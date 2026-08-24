package com.github.codehive.service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.github.codehive.model.dto.NotificationPreferenceDTO;
import com.github.codehive.model.dto.NotificationSettingsDTO;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.entity.UserNotificationPreference;
import com.github.codehive.model.entity.UserNotificationSettings;
import com.github.codehive.model.enums.NotificationType;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.model.exception.ValidationException;
import com.github.codehive.model.request.notification.UpdateNotificationPreferenceRequest;
import com.github.codehive.model.request.notification.UpdateNotificationSettingsRequest;
import com.github.codehive.repository.UserNotificationPreferenceRepository;
import com.github.codehive.repository.UserNotificationSettingsRepository;
import com.github.codehive.repository.UserRepository;

@Service
public class NotificationPreferenceService {
    public static final String DEFAULT_TIMEZONE = "America/Mexico_City";
    public static final String DEFAULT_LOCALE = "en-US";

    private final UserRepository userRepository;
    private final UserNotificationSettingsRepository settingsRepository;
    private final UserNotificationPreferenceRepository preferenceRepository;

    public NotificationPreferenceService(UserRepository userRepository,
                                         UserNotificationSettingsRepository settingsRepository,
                                         UserNotificationPreferenceRepository preferenceRepository) {
        this.userRepository = userRepository;
        this.settingsRepository = settingsRepository;
        this.preferenceRepository = preferenceRepository;
    }

    @Transactional(readOnly = true)
    public NotificationSettingsDTO getForUser(String email) {
        return toDTO(requireUser(email));
    }

    @Transactional
    public NotificationSettingsDTO update(String email, UpdateNotificationSettingsRequest request) {
        User user = requireUser(email);
        validateTimezone(request.timezone());
        if (!DEFAULT_LOCALE.equals(request.locale())) {
            throw new ValidationException("Only the en-US notification locale is currently supported");
        }

        UserNotificationSettings settings = settingsRepository.findByUserId(user.getId())
                .orElseGet(() -> new UserNotificationSettings(user));
        settings.setEmailEnabled(request.emailEnabled());
        settings.setTimezone(request.timezone());
        settings.setLocale(request.locale());
        settings.setUpdatedAt(LocalDateTime.now());
        settingsRepository.save(settings);

        List<UpdateNotificationPreferenceRequest> updates =
                request.preferences() != null ? request.preferences() : List.of();
        Set<NotificationType> seen = new HashSet<>();
        for (UpdateNotificationPreferenceRequest update : updates) {
            if (!seen.add(update.type())) {
                throw new ValidationException("Notification preference types must be unique");
            }
            validatePreference(user, update);
            UserNotificationPreference preference = preferenceRepository
                    .findByUserIdAndType(user.getId(), update.type())
                    .orElseGet(() -> new UserNotificationPreference(user, update.type()));
            preference.setEnabled(update.enabled());
            preference.setReminderLeadMinutes(update.type().isReminder()
                    ? effectiveLead(update.type(), update.reminderLeadMinutes())
                    : null);
            preference.setUpdatedAt(LocalDateTime.now());
            preferenceRepository.save(preference);
        }
        return toDTO(user);
    }

    @Transactional
    public NotificationSettingsDTO reset(String email) {
        User user = requireUser(email);
        preferenceRepository.deleteByUserId(user.getId());
        settingsRepository.deleteByUserId(user.getId());
        return toDTO(user);
    }

    @Transactional(readOnly = true)
    public boolean isEnabled(User user, NotificationType type) {
        if (user == null || !user.canParticipate() || !NotificationType.forUser(user).contains(type)) {
            return false;
        }
        boolean globallyEnabled = settingsRepository.findByUserId(user.getId())
                .map(UserNotificationSettings::getEmailEnabled)
                .orElse(true);
        if (!globallyEnabled) return false;
        return preferenceRepository.findByUserIdAndType(user.getId(), type)
                .map(UserNotificationPreference::getEnabled)
                .orElse(true);
    }

    @Transactional(readOnly = true)
    public int getReminderLeadMinutes(User user, NotificationType type) {
        if (!type.isReminder()) {
            throw new IllegalArgumentException(type + " is not a reminder notification");
        }
        return preferenceRepository.findByUserIdAndType(user.getId(), type)
                .map(UserNotificationPreference::getReminderLeadMinutes)
                .orElse(type.getDefaultLeadMinutes());
    }

    @Transactional(readOnly = true)
    public ZoneId getTimezone(User user) {
        String timezone = settingsRepository.findByUserId(user.getId())
                .map(UserNotificationSettings::getTimezone)
                .orElse(DEFAULT_TIMEZONE);
        return ZoneId.of(timezone);
    }

    private NotificationSettingsDTO toDTO(User user) {
        UserNotificationSettings settings = settingsRepository.findByUserId(user.getId()).orElse(null);
        Map<NotificationType, UserNotificationPreference> overrides = preferenceRepository.findByUserId(user.getId())
                .stream().collect(Collectors.toMap(UserNotificationPreference::getType, Function.identity()));
        List<NotificationPreferenceDTO> preferences = new ArrayList<>();
        for (NotificationType type : NotificationType.forUser(user)) {
            UserNotificationPreference override = overrides.get(type);
            preferences.add(new NotificationPreferenceDTO(
                    type,
                    type.getAudience(),
                    override == null || Boolean.TRUE.equals(override.getEnabled()),
                    type.isReminder()
                            ? (override != null && override.getReminderLeadMinutes() != null
                                    ? override.getReminderLeadMinutes()
                                    : type.getDefaultLeadMinutes())
                            : null));
        }
        preferences.sort(Comparator.comparing(item -> item.type().name()));
        return new NotificationSettingsDTO(
                settings == null || Boolean.TRUE.equals(settings.getEmailEnabled()),
                settings != null ? settings.getTimezone() : DEFAULT_TIMEZONE,
                settings != null ? settings.getLocale() : DEFAULT_LOCALE,
                preferences);
    }

    private void validatePreference(User user, UpdateNotificationPreferenceRequest update) {
        if (!NotificationType.forUser(user).contains(update.type())) {
            throw new ValidationException("Notification type " + update.type() + " is not available for this account");
        }
        if (!update.type().isReminder() && update.reminderLeadMinutes() != null) {
            throw new ValidationException("Reminder lead time is only valid for reminder notifications");
        }
        if (update.type().isReminder()) {
            effectiveLead(update.type(), update.reminderLeadMinutes());
        }
    }

    private int effectiveLead(NotificationType type, Integer requested) {
        int lead = requested != null ? requested : type.getDefaultLeadMinutes();
        if (!NotificationType.ALLOWED_LEAD_MINUTES.contains(lead)) {
            throw new ValidationException("Unsupported reminder lead time: " + lead);
        }
        return lead;
    }

    private void validateTimezone(String timezone) {
        try {
            ZoneId.of(timezone);
        } catch (Exception exception) {
            throw new ValidationException("Invalid timezone: " + timezone);
        }
    }

    private User requireUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Authenticated user not found"));
    }
}
