package com.github.codehive.service.assistant;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;
import com.github.codehive.model.dto.assistant.usage.AssistantUsageDTO.*;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.exception.*;
import com.github.codehive.model.request.assistant.AssistantUsageQuery;
import com.github.codehive.model.response.PageResponse;
import com.github.codehive.repository.*;
import com.github.codehive.repository.AssistantUsageRepository.Dimension;

@Service
@Transactional(readOnly = true)
public class AssistantUsageService {
    public enum Audience { OWNER, PERSONAL, ADMIN }
    public record Access(Filters filters, String label) {}
    private final AssistantUsageRepository usage;
    private final UserRepository users;
    private final ClassGroupRepository groups;
    private final AssignmentRepository assignments;
    private final AssignmentAiPolicyRepository policies;
    public AssistantUsageService(AssistantUsageRepository usage, UserRepository users, ClassGroupRepository groups,
            AssignmentRepository assignments, AssignmentAiPolicyRepository policies) {
        this.usage=usage; this.users=users; this.groups=groups; this.assignments=assignments; this.policies=policies;
    }
    public Access authorize(Audience audience, String email, UUID userId, UUID groupId, UUID assignmentId,
            AssistantUsageQuery query, boolean identities) {
        User caller=users.findByEmail(email).orElseThrow(()->new EntityNotFoundException("Authenticated user not found"));
        if (audience==Audience.ADMIN) {
            require(caller.getRole()==Role.ADMIN && authority(caller,"CHECK_ANALYTICS"));
            if (identities || userId!=null || query.getUserId()!=null) require(authority(caller,"VIEW_USERS"));
            userId=merge(userId,query.getUserId()); groupId=merge(groupId,query.getGroupId()); assignmentId=merge(assignmentId,query.getAssignmentId());
        } else {
            if (query.getUserId()!=null || query.getProvider()!=null || query.getModel()!=null)
                throw new ValidationException("Unsupported usage filter for this audience");
            if (audience==Audience.PERSONAL) {
                require(caller.getRole()==Role.STUDENT); userId=caller.getId();
                if(query.getGroupId()!=null || query.getAssignmentId()!=null) throw new ValidationException("Personal scope comes from route");
            } else { groupId=merge(groupId,query.getGroupId()); assignmentId=merge(assignmentId,query.getAssignmentId()); }
        }
        String label=audience==Audience.PERSONAL?"My AI usage":"AI usage";
        if (userId!=null && audience==Audience.ADMIN) {
            User target=users.findById(userId).orElseThrow(()->new EntityNotFoundException("User not found"));
            label=target.getName()+" "+target.getLastName();
        }
        if (assignmentId!=null) {
            var assignment=assignments.findById(assignmentId).orElseThrow(()->new EntityNotFoundException("Assignment not found"));
            groupId=merge(groupId,assignment.getGroup().getId()); label=assignment.getTitle();
        }
        if (groupId!=null) {
            var group=groups.findById(groupId).orElseThrow(()->new EntityNotFoundException("Group not found"));
            if (audience==Audience.OWNER) require(group.getOwner().getId().equals(caller.getId()));
            if (userId!=null) require(usage.hasPersonalGroup(userId,groupId));
            if (assignmentId==null) label=group.getName();
        } else if (audience==Audience.OWNER) throw new ValidationException("Owned group is required");
        return new Access(filters(query,userId,groupId,assignmentId),label);
    }
    private UUID merge(UUID fixed,UUID requested) {
        if (fixed!=null && requested!=null && !fixed.equals(requested)) throw new AccessDeniedException("Usage scope mismatch");
        return fixed==null?requested:fixed;
    }
    private boolean authority(User user,String name) { return user.getAuthorities().stream().anyMatch(a->a.getAuthority().equals(name)); }
    private void require(boolean condition) { if(!condition) throw new AccessDeniedException("Usage access denied"); }
    public Filters filters(AssistantUsageQuery query, UUID userId, UUID groupId, UUID assignmentId) {
        Instant now=Instant.now(),from=query.getFrom(),to=query.getTo();
        if (query.isLifetime()) {
            if(from!=null || to!=null) throw new ValidationException("Lifetime cannot be combined with dates");
        } else {
            if(to==null) to=now;
            if(from==null) from=to.minus(Duration.ofDays(30));
            if(!from.isBefore(to) || Duration.between(from,to).compareTo(Duration.ofDays(366))>0)
                throw new ValidationException("Usage range must be increasing and at most 366 days");
        }
        if(query.getPage()<0 || query.getSize()<1 || query.getSize()>100) throw new ValidationException("Usage page must be nonnegative and size 1..100");
        if(!Set.of("label","requests","responses","lastActivity").contains(query.getSort())) throw new ValidationException("Unsupported usage sort");
        if(!Set.of("ASC","DESC").contains(query.getDirection())) throw new ValidationException("Unsupported usage direction");
        if(query.getSearch()!=null && query.getSearch().length()>200) throw new ValidationException("Usage search is too long");
        if(query.getProvider()!=null && query.getProvider().length()>100 || query.getModel()!=null && query.getModel().length()>150)
            throw new ValidationException("Usage model filter is too long");
        return new Filters(from,to,userId,groupId,assignmentId,query.getProvider(),query.getModel());
    }
    public Summary summary(Access access) {
        Filters f=access.filters();
        Policy policy=f.assignmentId()==null?null:policies.findById(f.assignmentId())
            .map(p->new Policy(p.isEnabled(),p.isEnabled()?p.getMaxAiRequests():0,p.getLevel().name(),p.getVersion())).orElse(new Policy(false,0,null,0));
        return new Summary(Instant.now(),f,usage.instrumentationStartedAt(),usage.educational(f),usage.technical(f),
                dailyTrend(f),policy,access.label());
    }
    private List<Daily> dailyTrend(Filters filters) {
        if (filters.from()==null) return List.of();
        var measured=new java.util.HashMap<java.time.LocalDate,Daily>();
        usage.trend(filters).forEach(day->measured.put(day.day(),day));
        var days=new java.util.ArrayList<Daily>();
        var first=filters.from().atZone(java.time.ZoneOffset.UTC).toLocalDate();
        var last=filters.to().minusNanos(1).atZone(java.time.ZoneOffset.UTC).toLocalDate();
        for(var day=first;!day.isAfter(last);day=day.plusDays(1)) {
            days.add(measured.getOrDefault(day,new Daily(day,0,0,0,null)));
        }
        return List.copyOf(days);
    }
    public Breakdown rows(Access access, Dimension dimension, AssistantUsageQuery query) {
        var rows=usage.rows(access.filters(),dimension,query.getSearch(),query.getPage(),query.getSize(),query.getSort(),"DESC".equals(query.getDirection()));
        return new Breakdown(Instant.now(),access.filters(),usage.instrumentationStartedAt(),new PageResponse<>(rows));
    }
    public Models models(Access access) {
        return new Models(Instant.now(),access.filters(),usage.instrumentationStartedAt(),usage.models(access.filters()));
    }
    public List<GroupOption> ownedGroups(String email) {
        User caller=users.findByEmail(email).orElseThrow(()->new EntityNotFoundException("Authenticated user not found"));
        return usage.ownedGroups(caller.getId());
    }
}
