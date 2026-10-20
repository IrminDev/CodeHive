package com.github.codehive.repository;
import static org.assertj.core.api.Assertions.*;
import java.time.Instant;
import java.sql.Timestamp;
import java.util.UUID;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;
import com.github.codehive.model.dto.assistant.usage.AssistantUsageDTO.Filters;
@org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
@SpringBootTest
@ActiveProfiles("test")
@Tag("postgres-assistant")
@Transactional
class AssistantUsagePostgresIntegrationTest {
    @Autowired org.springframework.test.web.servlet.MockMvc mvc;
    @Autowired com.github.codehive.service.GroupService groupService;
    @Autowired jakarta.persistence.EntityManager entityManager;
    @Autowired JdbcTemplate jdbc;
    @Autowired AssistantUsageRepository usage;
    private static UUID id(int number) { return UUID.fromString("00000000-0000-0000-0000-"+String.format("%012d",number)); }
    private static final Instant FROM=Instant.parse("2026-01-01T00:00:00Z"),TO=Instant.parse("2026-01-03T00:00:00Z");
    @BeforeEach void seed() {
        for(int n=1;n<=3;n++) jdbc.update("insert into users(id,name,last_name,enrollment_number,email,password,role,created_at,is_active,temporary_password,blocked,rate_limit_violation_count,token_version) values (?, 'Grace','Hopper',?,?,'unused',?,'2026-01-01',true,false,false,0,0)",id(n),"USAGE-"+n,"usage"+n+"@example.com",n==1?"TEACHER":"STUDENT");
        jdbc.update("insert into class_groups(id,name,description,owner_id,join_code,archived,is_active,created_at,updated_at) values (?, 'Usage group','',?,'USAGE123',true,false,'2026-01-01','2026-01-01')",id(10),id(1));
        jdbc.update("insert into assignments(id,title,description,group_id,author_id,time_limit_ms,memory_limit_mb,comparator_type,created_at,updated_at,validation_status,is_active,max_points,version) values (?, 'Historical assignment','',?,?,5000,256,'EXACT_MATCH','2026-01-01','2026-01-01','READY',false,100,0)",id(20),id(10),id(1));
        jdbc.update("insert into assignment_ai_policies(assignment_id,enabled,max_ai_requests,level,version) values (?,true,1,'CONCEPTUAL_ONLY',0)",id(20));
        for(int n=2;n<=3;n++) jdbc.update("insert into group_enrollments(id,group_id,student_id,status,joined_at) values (?,?,?,?, '2026-01-01')",id(30+n),id(10),id(n),n==2?"LEFT":"ACTIVE");
        jdbc.update("insert into assistant_conversations(id,assignment_id,student_id,next_sequence,created_at,updated_at) values (?,?,?,4,'2026-01-01','2026-01-03')",id(40),id(20),id(2));
        for(int n=0;n<3;n++) jdbc.update("insert into assistant_interactions(id,conversation_id,sequence_number,client_request_id,request_fingerprint,status,quota_charged,content_erased,requested_policy_version,requested_assistance_level,editor_context_included,execution_context_included,language,generation_attempts,created_at,completed_at) values (?,?,?,?,?,?,?,?,0,?,false,false,'JAVA',0,?,?)",
            id(100+n),id(40),n+1,id(200+n),"fixture",n==0?"COMPLETED":n==1?"BLOCKED":"PENDING",n==0,true,n==1?null:"CONCEPTUAL_ONLY",Timestamp.from(n==0?Instant.parse("2026-01-01T23:59:59Z"):n==1?Instant.parse("2026-01-02T00:00:00Z"):TO),n==0?Timestamp.from(Instant.parse("2026-01-02T00:00:01Z")):null);
        for(int n=0;n<3;n++) jdbc.update("insert into assistant_model_calls(id,interaction_id,call_ordinal,stage,generation_attempt,provider_id,configured_model_id,started_at,finished_at,status,duration_ms,input_tokens,output_tokens,total_tokens) values (?,?,?,'ANSWER_GENERATION',?,'fixture','fixture-model',?,?,?,10,?,?,?)",
            id(300+n),id(100),n+1,n==2?2:1,Timestamp.from(Instant.parse("2026-01-02T00:00:00Z").plusSeconds(n)),n==1?null:Timestamp.from(Instant.parse("2026-01-02T00:00:10Z")),n==1?"UNKNOWN":"SUCCEEDED",n==1?null:n==0?5L:3_000_000_000L,n==1?null:0L,n==1?null:n==0?7L:3_000_000_000L);
    }
    private Filters filters(UUID student,UUID assignment) {return new Filters(FROM,TO,student,id(10),assignment,null,null);}
    @Test void noFanoutAndNullableCoveragePreserveProviderTotals() {
        var f=filters(null,null);var e=usage.educational(f);var t=usage.technical(f);
        assertThat(e.requests()).isEqualTo(2);assertThat(e.responses()).isEqualTo(1);
        assertThat(e.historicalUninstrumented()).isEqualTo(1);assertThat(e.regenerations()).isEqualTo(1);
        assertThat(t.calls()).isEqualTo(3);assertThat(t.knownTotalTokens()).isEqualTo(3_000_000_007L);
        assertThat(t.measuredCalls()).isEqualTo(2);assertThat(t.unknownCalls()).isEqualTo(1);
        assertThat(t.coveragePercent()).isEqualByComparingTo("66.67");assertThat(t.uncertain()).isEqualTo(1);
        var days=usage.trend(f);assertThat(days).hasSize(2);
        assertThat(days.get(0).calls()).isZero();assertThat(days.get(0).knownTotalTokens()).isNull();
        assertThat(days.get(1).calls()).isEqualTo(3);
        assertThat(usage.models(f)).hasSize(1);
    }
    @Test void rangeDoesNotChangeLifetimeQuotaAndHistoricalStudentsSurvive() {
        var rows=usage.rows(filters(null,id(20)),AssistantUsageRepository.Dimension.STUDENTS,"",0,20,"label",false);
        assertThat(rows.getTotalElements()).isEqualTo(2);
        var historical=rows.getContent().stream().filter(row->row.id().equals(id(2))).findFirst().orElseThrow();
        assertThat(historical.currentParticipant()).isFalse();assertThat(historical.requests()).isEqualTo(2);
        assertThat(historical.quota().usedLifetime()).isEqualTo(1);assertThat(historical.quota().pendingReservations()).isEqualTo(1);assertThat(historical.quota().remainingNow()).isZero();
        var zero=rows.getContent().stream().filter(row->row.id().equals(id(3))).findFirst().orElseThrow();
        assertThat(zero.requests()).isZero();assertThat(zero.knownTotalTokens()).isNull();
        jdbc.update("update assignment_ai_policies set enabled=false,max_ai_requests=0 where assignment_id=?",id(20));
        var own=usage.rows(filters(id(2),null),AssistantUsageRepository.Dimension.ASSIGNMENTS,"",0,20,"label",false).getContent().getFirst();
        assertThat(own.quota().usedLifetime()).isEqualTo(1);assertThat(own.quota().maximumCurrent()).isZero();assertThat(own.quota().limitReduced()).isTrue();
    }
    @Test void halfOpenRangeUsesCallCohortAndPaginationIsStable() {
        var f=new Filters(Instant.parse("2026-01-02T00:00:00Z"),TO,id(2),id(10),null,null,null);
        assertThat(usage.educational(f).requests()).isEqualTo(1);assertThat(usage.educational(f).responses()).isZero();assertThat(usage.technical(f).calls()).isEqualTo(3);
        var first=usage.rows(filters(null,id(20)),AssistantUsageRepository.Dimension.STUDENTS,"",0,1,"label",false);
        var second=usage.rows(filters(null,id(20)),AssistantUsageRepository.Dimension.STUDENTS,"",1,1,"label",false);
        assertThat(first.getContent().getFirst().id()).isEqualTo(id(2));assertThat(second.getContent().getFirst().id()).isEqualTo(id(3));
        assertThat(usage.hasPersonalGroup(id(2),id(10))).isTrue();assertThat(usage.hasPersonalGroup(id(1),id(10))).isFalse();
        assertThat(usage.rows(filters(null,null),AssistantUsageRepository.Dimension.USERS,"USAGE-2",0,20,"responses",true).getTotalElements()).isEqualTo(1);
        assertThat(usage.rows(filters(id(2),null),AssistantUsageRepository.Dimension.GROUPS,"",0,20,"lastActivity",true).getTotalElements()).isEqualTo(1);
    }
    @Test void representativePlanRunsWithoutContentColumns() {
        String plan=String.join("\n",jdbc.queryForList("explain (analyze,buffers,format text) select count(*) from assistant_model_calls m join assistant_interactions i on i.id=m.interaction_id join assistant_conversations c on c.id=i.conversation_id where c.student_id='"+id(2)+"' and m.started_at >= '2026-01-01T00:00:00Z'",String.class));
        assertThat(plan).contains("Execution Time");System.out.println("AI_USAGE_EXPLAIN_FIXTURE\n"+plan);
    }

    private org.springframework.test.web.servlet.request.RequestPostProcessor principal(int number, String... authorities) {
        return org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("usage"+number+"@example.com")
            .authorities(java.util.Arrays.stream(authorities).map(org.springframework.security.core.authority.SimpleGrantedAuthority::new).toList());
    }
    @Test void httpRoutesEnforceRoleOwnershipAndEffectiveDates() throws Exception {
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/assistant-usage/me")
            .param("from",FROM.toString()).param("to",TO.toString()).with(principal(2,"STUDENT")))
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk())
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.data.educational.requests").value(2))
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.data.filters.userId").value(id(2).toString()));
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/groups/"+id(10)+"/assistant-usage").with(principal(2,"STUDENT")))
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isForbidden());
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/groups/"+id(10)+"/assistant-usage").with(principal(1,"TEACHER")))
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk());
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/assistant-usage/me").param("userId",id(3).toString()).with(principal(2,"STUDENT")))
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isBadRequest());
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/assistant-usage/me/groups").param("size","101").with(principal(2,"STUDENT")))
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isBadRequest());
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/admin/assistant-usage").with(principal(1,"TEACHER","CHECK_ANALYTICS")))
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isForbidden());
    }
    @Test void adminAnalyticsAndIdentityScopesAreIndependent() throws Exception {
        jdbc.update("update users set role='ADMIN' where id=?",id(1));
        jdbc.update("insert into user_scopes(user_id,scope) values (?,'CHECK_ANALYTICS')",id(1));
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/admin/assistant-usage").with(principal(1,"ADMIN","CHECK_ANALYTICS")))
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk());
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/admin/assistant-usage/users").with(principal(1,"ADMIN","CHECK_ANALYTICS")))
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isForbidden());
        jdbc.update("insert into user_scopes(user_id,scope) values (?,'VIEW_USERS')",id(1));
        entityManager.clear();
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/admin/users/"+id(2)+"/assistant-usage/groups/"+id(10)+"/assignments")
            .param("lifetime","true").with(principal(1,"ADMIN","CHECK_ANALYTICS","VIEW_USERS")))
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk())
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.data.rows.content[0].quota.usedLifetime").value(1));
    }
    @Test void representativeVolumeMeasuresIndependentAggregatesAndSelectiveIndexes() {
        jdbc.update("""
            insert into assistant_interactions(id,conversation_id,sequence_number,client_request_id,request_fingerprint,status,quota_charged,content_erased,requested_policy_version,requested_assistance_level,editor_context_included,execution_context_included,language,generation_attempts,created_at,completed_at)
            select md5('usage-interaction-'||n)::uuid,?,1000+n,md5('usage-request-'||n)::uuid,'fixture','COMPLETED',true,true,0,'CONCEPTUAL_ONLY',false,false,'JAVA',1,
                timestamptz '2025-01-01T00:00:00Z'+n*interval '20 minutes',timestamptz '2025-01-01T00:00:00Z'+n*interval '20 minutes'+interval '1 second'
            from generate_series(1,20000) n
            """,id(40));
        jdbc.update("""
            insert into assistant_model_calls(id,interaction_id,call_ordinal,stage,generation_attempt,provider_id,configured_model_id,started_at,finished_at,status,duration_ms,input_tokens,output_tokens,total_tokens)
            select md5('usage-call-'||n||'-'||ordinal)::uuid,md5('usage-interaction-'||n)::uuid,ordinal,
                case ordinal when 1 then 'INPUT_REVIEW' when 2 then 'ANSWER_GENERATION' else 'OUTPUT_REVIEW' end,1,'fixture','fixture-model',
                timestamptz '2025-01-01T00:00:00Z'+n*interval '20 minutes',timestamptz '2025-01-01T00:00:00Z'+n*interval '20 minutes'+interval '1 second','SUCCEEDED',1000,10,5,15
            from generate_series(1,20000) n cross join generate_series(1,3) ordinal
            """);
        jdbc.execute("analyze assistant_interactions");jdbc.execute("analyze assistant_model_calls");jdbc.execute("analyze assistant_conversations");
        var all=new Filters(null,null,id(2),id(10),null,null,null);
        long started=System.nanoTime();
        assertThat(usage.educational(all).requests()).isEqualTo(20003);assertThat(usage.technical(all).calls()).isEqualTo(60003);
        usage.rows(all,AssistantUsageRepository.Dimension.ASSIGNMENTS,"",0,20,"responses",true);
        System.out.println("AI_USAGE_20K_REQUESTS_60K_CALLS_AGGREGATES_MS="+java.util.concurrent.TimeUnit.NANOSECONDS.toMillis(System.nanoTime()-started));
        String plan=String.join("\n",jdbc.queryForList("explain (analyze,buffers,format text) select count(*) from assistant_model_calls where started_at >= timestamptz '2025-09-01T00:00:00Z' and started_at < timestamptz '2025-09-02T00:00:00Z'",String.class));
        assertThat(plan).contains("idx_assistant_call_started");System.out.println("AI_USAGE_SELECTIVE_EXPLAIN\n"+plan);
    }

    @Test void archiveErasesContentButPreservesTechnicalAndEducationalUsage() throws Exception {
        jdbc.update("update class_groups set archived=false,is_active=true where id=?",id(10));
        jdbc.update("update assistant_interactions set content_erased=false,student_message='PRIVATE_PROMPT',assistant_response='PRIVATE_ANSWER' where id=?",id(100));
        var response=mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/assistant-usage/me").param("lifetime","true").with(principal(2,"STUDENT")))
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk()).andReturn().getResponse().getContentAsString();
        assertThat(response).doesNotContain("PRIVATE_PROMPT","PRIVATE_ANSWER","studentMessage","assistantResponse","requestFingerprint");
        groupService.setArchived(id(10),true,"usage1@example.com");
        assertThat(jdbc.queryForObject("select count(*) from assistant_model_calls where interaction_id=?",Long.class,id(100))).isEqualTo(3);
        assertThat(jdbc.queryForObject("select student_message from assistant_interactions where id=?",String.class,id(100))).isNull();
        assertThat(usage.educational(filters(id(2),null)).responses()).isEqualTo(1);
        assertThat(usage.technical(filters(id(2),null)).calls()).isEqualTo(3);
    }
    @Test void groupTotalsAddUpAndReenrollmentDoesNotDuplicateUsage() {
        jdbc.update("insert into class_groups(id,name,description,owner_id,join_code,archived,is_active,created_at,updated_at) values (?, 'Other historical group','',?,'OTHER123',false,false,'2026-01-01','2026-01-01')",id(11),id(1));
        jdbc.update("insert into assignments(id,title,description,group_id,author_id,time_limit_ms,memory_limit_mb,comparator_type,created_at,updated_at,validation_status,is_active,max_points,version) values (?, 'Other assignment','',?,?,5000,256,'EXACT_MATCH','2026-01-01','2026-01-01','READY',false,100,0)",id(21),id(11),id(1));
        jdbc.update("insert into assistant_conversations(id,assignment_id,student_id,next_sequence,created_at,updated_at) values (?,?,?,2,'2026-01-01','2026-01-01')",id(41),id(21),id(2));
        jdbc.update("insert into assistant_interactions(id,conversation_id,sequence_number,client_request_id,request_fingerprint,status,quota_charged,content_erased,requested_policy_version,editor_context_included,execution_context_included,language,generation_attempts,created_at) values (?,?,1,?,'fixture','FAILED',false,true,0,false,false,'JAVA',0,'2026-01-02')",id(104),id(41),id(204));
        var all=new Filters(FROM,TO,id(2),null,null,null,null);
        var groups=usage.rows(all,AssistantUsageRepository.Dimension.GROUPS,"",0,20,"label",false);
        assertThat(groups.getTotalElements()).isEqualTo(2);
        assertThat(groups.stream().mapToLong(row->row.requests()).sum()).isEqualTo(usage.educational(all).requests());
        assertThat(groups.stream().mapToLong(row->row.calls()).sum()).isEqualTo(usage.technical(all).calls());
        jdbc.update("update group_enrollments set status='ACTIVE' where student_id=? and group_id=?",id(2),id(10));
        var students=usage.rows(filters(null,id(20)),AssistantUsageRepository.Dimension.STUDENTS,"",0,20,"label",false);
        assertThat(students.getTotalElements()).isEqualTo(2);
        assertThat(students.getContent().getFirst().requests()).isEqualTo(2);
        assertThat(students.getContent().getFirst().currentParticipant()).isTrue();
    }
}
