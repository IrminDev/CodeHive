package com.github.codehive.service.assistant;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.time.Instant;
import java.util.*;
import org.junit.jupiter.api.Test;
import com.github.codehive.model.entity.*;
import com.github.codehive.model.enums.*;
import com.github.codehive.model.request.assistant.AssistantUsageQuery;
import com.github.codehive.repository.*;
import com.github.codehive.service.assistant.AssistantUsageService.Audience;
class AssistantUsageServiceTest {
    private static final UUID USER=UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID GROUP=UUID.fromString("00000000-0000-0000-0000-000000000002");
    private static final UUID OTHER=UUID.fromString("00000000-0000-0000-0000-000000000003");
    private final AssistantUsageRepository usage=mock(AssistantUsageRepository.class);
    private final UserRepository users=mock(UserRepository.class);
    private final ClassGroupRepository groups=mock(ClassGroupRepository.class);
    private final AssignmentRepository assignments=mock(AssignmentRepository.class);
    private final AssistantUsageService service=new AssistantUsageService(usage,users,groups,assignments,mock(AssignmentAiPolicyRepository.class));
    private User caller(Role role,Scope... scopes) {
        User u=new User("Grace","Hopper","FIXED","test@example.com","unused",role);u.setId(USER);u.setScopes(List.of(scopes));
        when(users.findByEmail(u.getEmail())).thenReturn(Optional.of(u));return u;
    }
    @Test void personalIdentityIsPrincipalAndFormerEnrollmentIsAllowed() {
        User u=caller(Role.STUDENT);var g=new ClassGroup();g.setId(GROUP);g.setName("Historical");when(groups.findById(GROUP)).thenReturn(Optional.of(g));
        when(usage.hasPersonalGroup(USER,GROUP)).thenReturn(true);
        var access=service.authorize(Audience.PERSONAL,u.getEmail(),null,GROUP,null,new AssistantUsageQuery(),false);
        assertThat(access.filters().userId()).isEqualTo(USER);
        assertThat(access.filters().groupId()).isEqualTo(GROUP);
    }
    @Test void teacherAnalyticsScopeDoesNotGrantGlobalAdministrativeAccess() {
        User u=caller(Role.TEACHER,Scope.CHECK_ANALYTICS,Scope.VIEW_USERS);
        assertThatThrownBy(()->service.authorize(Audience.ADMIN,u.getEmail(),null,null,null,new AssistantUsageQuery(),false)).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        verifyNoInteractions(usage);
    }
    @Test void adminGlobalScopeDoesNotPermitIdentitiesOrUserFilters() {
        User u=caller(Role.ADMIN,Scope.CHECK_ANALYTICS);
        assertThat(service.authorize(Audience.ADMIN,u.getEmail(),null,null,null,new AssistantUsageQuery(),false).filters().userId()).isNull();
        assertThatThrownBy(()->service.authorize(Audience.ADMIN,u.getEmail(),USER,null,null,new AssistantUsageQuery(),true)).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        var q=new AssistantUsageQuery();q.setUserId(USER);
        assertThatThrownBy(()->service.authorize(Audience.ADMIN,u.getEmail(),null,null,null,q,false)).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
    }
    @Test void ownerCheckPrecedesAggregationsEvenWithAnalyticsScope() {
        User u=caller(Role.TEACHER,Scope.CHECK_ANALYTICS);User other=new User();other.setId(OTHER);var group=new ClassGroup();group.setOwner(other);when(groups.findById(GROUP)).thenReturn(Optional.of(group));
        assertThatThrownBy(()->service.authorize(Audience.OWNER,u.getEmail(),null,GROUP,null,new AssistantUsageQuery(),false)).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        verifyNoInteractions(usage);
    }
    @Test void crossedAssignmentAndGroupIdsAreDenied() {
        User u=caller(Role.TEACHER);var group=new ClassGroup();group.setId(OTHER);var assignment=new Assignment();assignment.setGroup(group);when(assignments.findById(USER)).thenReturn(Optional.of(assignment));
        assertThatThrownBy(()->service.authorize(Audience.OWNER,u.getEmail(),null,GROUP,USER,new AssistantUsageQuery(),false)).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        verifyNoInteractions(usage);
    }
    @Test void datePageAndSortLimitsAreValidatedAndLifetimeHasNoTrendRange() {
        var dates=new AssistantUsageQuery();dates.setFrom(Instant.parse("2026-01-02T00:00:00Z"));dates.setTo(Instant.parse("2026-01-01T00:00:00Z"));
        assertThatThrownBy(()->service.filters(dates,null,null,null)).hasMessageContaining("range");
        dates.setFrom(Instant.parse("2024-01-01T00:00:00Z"));assertThatThrownBy(()->service.filters(dates,null,null,null)).hasMessageContaining("366");
        var q=new AssistantUsageQuery();q.setLifetime(true);assertThat(service.filters(q,null,null,null).from()).isNull();
        q.setSize(101);var badSize=q;assertThatThrownBy(()->service.filters(badSize,null,null,null)).hasMessageContaining("size");
        q.setSize(20);q.setSort("label;drop table users");var badSort=q;assertThatThrownBy(()->service.filters(badSort,null,null,null)).hasMessageContaining("sort");
    }
}
