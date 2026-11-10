package com.github.codehive.repository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import org.springframework.jdbc.core.namedparam.*;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.*;
import com.github.codehive.model.dto.assistant.usage.AssistantUsageDTO.*;

/** Aggregates each ledger independently. No content columns are ever selected. */
@Repository
public class AssistantUsageRepository {
    private final NamedParameterJdbcTemplate jdbc;
    private static final String LINKS = " join assistant_conversations c on c.id=i.conversation_id join assignments a on a.id=c.assignment_id join class_groups g on g.id=a.group_id ";
    public AssistantUsageRepository(NamedParameterJdbcTemplate jdbc) { this.jdbc=jdbc; }
    private MapSqlParameterSource params(Filters f) {
        return new MapSqlParameterSource().addValue("from", f.from()==null?null:Timestamp.from(f.from()))
                .addValue("to",f.to()==null?null:Timestamp.from(f.to())).addValue("user",f.userId())
                .addValue("group",f.groupId()).addValue("assignment",f.assignmentId())
                .addValue("provider",f.provider()).addValue("model",f.model());
    }
    private String scope(Filters f) {
        return (f.userId()==null?"":" and c.student_id=:user")+(f.groupId()==null?"":" and g.id=:group")
                +(f.assignmentId()==null?"":" and a.id=:assignment");
    }
    private String range(Filters f, String column) {
        return (f.from()==null?"":" and "+column+">=:from")+(f.to()==null?"":" and "+column+"<:to");
    }
    private String modelFilter(Filters f) {
        return (f.provider()==null?"":" and m.provider_id=:provider")+(f.model()==null?"":" and (m.configured_model_id=:model or m.reported_model_id=:model)");
    }
    private long n(Map<String,Object> m,String key) { Object v=m.get(key); return v==null?0:((Number)v).longValue(); }
    private Long nullable(Map<String,Object> m,String key) { return m.get(key)==null?null:((Number)m.get(key)).longValue(); }
    private BigDecimal decimal(Map<String,Object> m,String key) { Object v=m.get(key);return v==null?null:new BigDecimal(v.toString()).setScale(2,RoundingMode.HALF_UP); }
    private Instant instant(Object value) { return value==null?null:value instanceof Timestamp t?t.toInstant():value instanceof java.time.OffsetDateTime o?o.toInstant():(Instant)value; }
    private UUID uuid(Object value) { return value instanceof UUID id?id:UUID.fromString(value.toString()); }
    private String educationalSelect() { return """
        count(*) requests, count(case when i.quota_charged then 1 end) responses,
        count(case when i.status='COMPLETED' then 1 end) completed,
        count(case when i.status='REDIRECTED' then 1 end) redirected,
        count(case when i.status='BLOCKED' then 1 end) blocked,
        count(case when i.status='FAILED' then 1 end) failed,
        count(case when i.status='CANCELLED' then 1 end) cancelled,
        count(case when i.status='PENDING' then 1 end) pending,
        count(distinct c.student_id) active_users,
        count(distinct case when i.quota_charged then c.student_id end) responding_users,
        count(case when i.requested_assistance_level is null then 1 end) historical,
        count(case when exists(select 1 from assistant_model_calls r where r.interaction_id=i.id and r.stage='ANSWER_GENERATION' and r.generation_attempt>=2) then 1 end) regenerations,
        count(case when i.editor_context_included then 1 end) editor_opt_ins,
        count(case when i.execution_context_included then 1 end) execution_opt_ins,
        avg(case when i.quota_charged and i.completed_at is not null then extract(epoch from (i.completed_at-i.created_at))*1000 end) latency,
        count(case when i.quota_charged and i.completed_at is not null then 1 end) samples,
        max(i.created_at) last_activity
        """; }
    public Educational educational(Filters f) {
        var m=jdbc.queryForMap("select "+educationalSelect()+" from assistant_interactions i"+LINKS+" where 1=1"+scope(f)+range(f,"i.created_at"),params(f));
        return new Educational(n(m,"requests"),n(m,"responses"),n(m,"completed"),n(m,"redirected"),n(m,"blocked"),n(m,"failed"),n(m,"cancelled"),n(m,"pending"),n(m,"active_users"),n(m,"responding_users"),n(m,"historical"),n(m,"regenerations"),n(m,"editor_opt_ins"),n(m,"execution_opt_ins"),decimal(m,"latency"),n(m,"samples"),levels(f,"requested_assistance_level"),levels(f,"completed_assistance_level"),instant(m.get("last_activity")));
    }
    private Map<String,Long> levels(Filters f,String column) {
        Map<String,Long> result=new LinkedHashMap<>();
        jdbc.query("select i."+column+" level,count(*) amount from assistant_interactions i"+LINKS+" where i."+column+" is not null"+scope(f)+range(f,"i.created_at")+" group by i."+column,params(f),rs->{result.put(rs.getString("level"),rs.getLong("amount"));});return result;
    }
    private String technicalSelect() { return """
        count(*) calls, count(case when m.status='SUCCEEDED' then 1 end) succeeded,
        count(case when m.status='FAILED' then 1 end) failed,
        count(case when m.status in ('STARTED','UNKNOWN') then 1 end) uncertain,
        count(m.caller_timed_out_at) timeouts,
        sum(m.input_tokens) input_tokens, sum(m.output_tokens) output_tokens, sum(m.total_tokens) total_tokens,
        count(case when m.input_tokens is not null and m.output_tokens is not null and m.total_tokens is not null then 1 end) measured,
        avg(m.duration_ms) latency, count(m.duration_ms) samples
        """; }
    private Technical technical(Map<String,Object> m) {
        long calls=n(m,"calls"),measured=n(m,"measured");
        return new Technical(calls,n(m,"succeeded"),n(m,"failed"),n(m,"uncertain"),n(m,"timeouts"),nullable(m,"input_tokens"),nullable(m,"output_tokens"),nullable(m,"total_tokens"),measured,calls-measured,calls==0?null:BigDecimal.valueOf(measured).multiply(BigDecimal.valueOf(100)).divide(BigDecimal.valueOf(calls),2,RoundingMode.HALF_UP),decimal(m,"latency"),n(m,"samples"));
    }
    private String callFrom() { return " from assistant_model_calls m join assistant_interactions i on i.id=m.interaction_id"+LINKS; }
    public Technical technical(Filters f) {
        return technical(jdbc.queryForMap("select "+technicalSelect()+callFrom()+" where 1=1"+scope(f)+range(f,"m.started_at")+modelFilter(f),params(f)));
    }
    public Instant instrumentationStartedAt() {
        return instant(jdbc.queryForMap("select min(started_at) started from assistant_model_calls",new MapSqlParameterSource()).get("started"));
    }
    public List<Daily> trend(Filters f) {
        String dayI="cast(i.created_at at time zone 'UTC' as date)", dayM="cast(m.started_at at time zone 'UTC' as date)";
        var rows=jdbc.queryForList("with e as (select "+dayI+" bucket,count(*) requests,count(case when i.quota_charged then 1 end) responses from assistant_interactions i"+LINKS+" where 1=1"+scope(f)+range(f,"i.created_at")+" group by 1), t as (select "+dayM+" bucket,count(*) calls,sum(m.total_tokens) tokens"+callFrom()+" where 1=1"+scope(f)+range(f,"m.started_at")+modelFilter(f)+" group by 1) select coalesce(e.bucket,t.bucket) bucket,coalesce(e.requests,0) requests,coalesce(e.responses,0) responses,coalesce(t.calls,0) calls,t.tokens from e full outer join t on e.bucket=t.bucket order by 1",params(f));
        return rows.stream().map(m->new Daily(((java.sql.Date)m.get("bucket")).toLocalDate(),n(m,"requests"),n(m,"responses"),n(m,"calls"),nullable(m,"tokens"))).toList();
    }
    public List<ModelRow> models(Filters f) {
        return jdbc.queryForList("select m.provider_id,m.configured_model_id,m.reported_model_id,m.stage,"+technicalSelect()+callFrom()+" where 1=1"+scope(f)+range(f,"m.started_at")+modelFilter(f)+" group by m.provider_id,m.configured_model_id,m.reported_model_id,m.stage order by 1,2,3,4",params(f)).stream().map(m->new ModelRow((String)m.get("provider_id"),(String)m.get("configured_model_id"),(String)m.get("reported_model_id"),(String)m.get("stage"),technical(m))).toList();
    }
    public boolean hasPersonalGroup(UUID userId, UUID groupId) {
        return Boolean.TRUE.equals(jdbc.queryForObject("select exists(select 1 from group_enrollments where student_id=:user and group_id=:group) or exists(select 1 from assistant_conversations c join assignments a on a.id=c.assignment_id where c.student_id=:user and a.group_id=:group)",new MapSqlParameterSource("user",userId).addValue("group",groupId),Boolean.class));
    }
    public List<GroupOption> ownedGroups(UUID ownerId) {
        return jdbc.queryForList("select id,name,archived,is_active from class_groups where owner_id=:owner order by name,id",new MapSqlParameterSource("owner",ownerId)).stream()
            .map(m->new GroupOption(uuid(m.get("id")),(String)m.get("name"),!Boolean.TRUE.equals(m.get("is_active"))?"deleted":Boolean.TRUE.equals(m.get("archived"))?"archived":"active")).toList();
    }
    public enum Dimension { USERS, STUDENTS, GROUPS, ASSIGNMENTS }
    public Page<Row> rows(Filters f, Dimension dimension, String search, int page, int size, String sort, boolean desc) {
        String key=switch(dimension) {case USERS,STUDENTS->"c.student_id";case GROUPS->"g.id";case ASSIGNMENTS->"a.id";};
        String candidates=switch(dimension) {
            case USERS -> "select u.id,concat(u.name,' ',u.last_name) label,u.enrollment_number enrollment_number,false current_participant from users u where exists(select 1 from assistant_conversations c join assignments a on a.id=c.assignment_id join class_groups g on g.id=a.group_id where c.student_id=u.id"+scope(f)+")";
            case STUDENTS -> "select u.id,concat(u.name,' ',u.last_name) label,u.enrollment_number enrollment_number,exists(select 1 from group_enrollments z where z.student_id=u.id and z.group_id=:group and z.status='ACTIVE') current_participant from users u where exists(select 1 from group_enrollments z where z.student_id=u.id and z.group_id=:group and z.status='ACTIVE') or exists(select 1 from assistant_conversations c join assignments a on a.id=c.assignment_id join class_groups g on g.id=a.group_id where c.student_id=u.id"+scope(f)+")";
            case GROUPS -> "select g.id,g.name label,cast(null as varchar) enrollment_number,false current_participant from class_groups g where "+(f.userId()==null?"1=1":"(exists(select 1 from group_enrollments z where z.group_id=g.id and z.student_id=:user) or exists(select 1 from assistant_conversations c join assignments a on a.id=c.assignment_id where a.group_id=g.id and c.student_id=:user))")+(f.groupId()==null?"":" and g.id=:group");
            case ASSIGNMENTS -> "select a.id,a.title label,cast(null as varchar) enrollment_number,false current_participant from assignments a where a.group_id=:group"+(f.assignmentId()==null?"":" and a.id=:assignment")
                    +(f.userId()==null?"":" and (exists(select 1 from assistant_conversations own where own.assignment_id=a.id and own.student_id=:user) or (a.is_active=true and a.validation_status='READY' and (a.launch_date is null or a.launch_date<=current_timestamp) and exists(select 1 from group_enrollments z join class_groups visible on visible.id=z.group_id where z.group_id=a.group_id and z.student_id=:user and z.status='ACTIVE' and visible.is_active=true)))");
        };
        var p=params(f).addValue("search", "%"+(search==null?"":search.toLowerCase(Locale.ROOT).replace("!","!!").replace("%","!%").replace("_","!_"))+"%").addValue("limit",size).addValue("offset",(long)page*size);
        String cte="with candidates as ("+candidates+"), e as (select "+key+" id,"+educationalSelect()+" from assistant_interactions i"+LINKS+" where 1=1"+scope(f)+range(f,"i.created_at")+" group by "+key+"), t as (select "+key+" id,count(*) calls,sum(m.total_tokens) tokens"+callFrom()+" where 1=1"+scope(f)+range(f,"m.started_at")+modelFilter(f)+" group by "+key+"), lifetime as (select "+key+" id,count(case when i.quota_charged then 1 end) used,count(case when i.status='PENDING' then 1 end) reserved from assistant_interactions i"+LINKS+" where 1=1"+scope(f)+" group by "+key+") ";
        String from=" from candidates b left join e on e.id=b.id left join t on t.id=b.id left join lifetime l on l.id=b.id";
        boolean policy=dimension==Dimension.ASSIGNMENTS || f.assignmentId()!=null;
        if(policy) from+=" left join assignment_ai_policies policy on policy.assignment_id="+(dimension==Dimension.ASSIGNMENTS?"b.id":":assignment");
        String where=" where (lower(b.label) like :search escape '!' or lower(coalesce(b.enrollment_number,'')) like :search escape '!')";
        String order=switch(sort) {case "label"->"b.label";case "requests"->"coalesce(e.requests,0)";case "responses"->"coalesce(e.responses,0)";case "lastActivity"->"e.last_activity";default->throw new IllegalArgumentException("Unsupported usage sort");};
        Long total=jdbc.queryForObject(cte+"select count(*)"+from+where,p,Long.class);
        String select="select b.*,coalesce(e.requests,0) requests,coalesce(e.responses,0) responses,coalesce(e.blocked,0)+coalesce(e.failed,0)+coalesce(e.cancelled,0) unanswered,coalesce(e.regenerations,0) regenerations,e.last_activity,coalesce(t.calls,0) calls,t.tokens,coalesce(l.used,0) used,coalesce(l.reserved,0) reserved"+(policy?",policy.enabled,policy.max_ai_requests,policy.level,policy.version":"");
        var result=jdbc.queryForList(cte+select+from+where+" order by "+order+(desc?" desc":" asc")+" nulls last,b.id asc limit :limit offset :offset",p).stream().map(m->{
            Policy current=policy?new Policy(Boolean.TRUE.equals(m.get("enabled")),(int)n(m,"max_ai_requests"),(String)m.get("level"),n(m,"version")):null;
            Quota quota=null;
            if(current!=null && (dimension==Dimension.STUDENTS || (dimension==Dimension.ASSIGNMENTS && f.userId()!=null))) {
                long used=n(m,"used"),reserved=n(m,"reserved");int max=current.enabled()?current.maximumCurrent():0;
                quota=new Quota(used,max,reserved,Math.max(0,max-used-reserved),used>max,current.enabled());
            }
            return new Row(uuid(m.get("id")),(String)m.get("label"),(String)m.get("enrollment_number"),Boolean.TRUE.equals(m.get("current_participant")),n(m,"requests"),n(m,"responses"),n(m,"unanswered"),n(m,"regenerations"),instant(m.get("last_activity")),n(m,"calls"),nullable(m,"tokens"),quota,current);
        }).toList();
        return new PageImpl<>(result,PageRequest.of(page,size),total==null?0:total);
    }
}
