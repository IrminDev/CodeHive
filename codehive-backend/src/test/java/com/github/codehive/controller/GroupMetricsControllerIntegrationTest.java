package com.github.codehive.controller;

import static org.hamcrest.CoreMatchers.nullValue;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.AssignmentGrade;
import com.github.codehive.model.entity.ClassGroup;
import com.github.codehive.model.entity.Execution;
import com.github.codehive.model.entity.GroupEnrollment;
import com.github.codehive.model.entity.StudentAssignmentWork;
import com.github.codehive.model.entity.Submission;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.AssignmentValidationStatus;
import com.github.codehive.model.enums.ComparatorType;
import com.github.codehive.model.enums.ExecutionStatus;
import com.github.codehive.model.enums.ExecutionType;
import com.github.codehive.model.enums.GradeStatus;
import com.github.codehive.model.enums.Language;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.enums.StudentWorkStatus;
import com.github.codehive.model.enums.SubmissionStatus;
import com.github.codehive.repository.AssignmentGradeRepository;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.ClassGroupRepository;
import com.github.codehive.repository.ExecutionRepository;
import com.github.codehive.repository.GroupEnrollmentRepository;
import com.github.codehive.repository.StudentAssignmentWorkRepository;
import com.github.codehive.repository.SubmissionRepository;
import com.github.codehive.repository.UserRepository;
import com.github.codehive.utils.JwtUtil;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
@DisplayName("GroupMetricsController Integration")
class GroupMetricsControllerIntegrationTest {
    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private ClassGroupRepository groupRepository;
    @Autowired private GroupEnrollmentRepository enrollmentRepository;
    @Autowired private AssignmentRepository assignmentRepository;
    @Autowired private StudentAssignmentWorkRepository workRepository;
    @Autowired private SubmissionRepository submissionRepository;
    @Autowired private ExecutionRepository executionRepository;
    @Autowired private AssignmentGradeRepository gradeRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtUtil jwtUtil;

    private User teacher;
    private User ada;
    private User konrad;
    private String teacherToken;
    private String adaToken;
    private ClassGroup group;
    private Assignment assignment;

    @BeforeEach
    void setUp() {
        teacher = userRepository.save(new User("Grace", "Hopper", "TEA-MET", "teacher@metrics.test",
                passwordEncoder.encode("Pass123!"), Role.TEACHER));
        ada = userRepository.save(new User("Ada", "Lovelace", "STU-MET-1", "ada@metrics.test",
                passwordEncoder.encode("Pass123!"), Role.STUDENT));
        konrad = userRepository.save(new User("Konrad", "Zuse", "STU-MET-2", "konrad@metrics.test",
                passwordEncoder.encode("Pass123!"), Role.STUDENT));
        teacherToken = jwtUtil.generateToken(Map.of("role", "TEACHER"), teacher.getEmail());
        adaToken = jwtUtil.generateToken(Map.of("role", "STUDENT"), ada.getEmail());

        group = groupRepository.save(new ClassGroup("Algorithms", "", teacher, "METRICS9"));
        enrollmentRepository.save(new GroupEnrollment(group, ada));
        enrollmentRepository.save(new GroupEnrollment(group, konrad));

        // Ada submitted on time with a 26-hour margin; Konrad never submitted.
        LocalDateTime submittedAt = LocalDateTime.now().withNano(0).minusHours(2);
        Instant dueDate = submittedAt.atZone(ZoneId.systemDefault()).toInstant().plusSeconds(26 * 3600);

        assignment = new Assignment("Graphs", "description", 2000L, 256L, ComparatorType.EXACT_MATCH);
        assignment.setGroup(group);
        assignment.setAuthor(teacher);
        assignment.setValidationStatus(AssignmentValidationStatus.READY);
        assignment.setAllowedLanguages(List.of(Language.JAVA));
        assignment.setDueDate(dueDate);
        assignment = assignmentRepository.save(assignment);

        StudentAssignmentWork work = new StudentAssignmentWork();
        work.setAssignment(assignment);
        work.setStudent(ada);
        work.setStatus(StudentWorkStatus.SUBMITTED);
        work = workRepository.save(work);

        Submission submission = new Submission(assignment, ada, Language.JAVA, false);
        submission.setStudentWork(work);
        submission.setStatus(SubmissionStatus.SUBMITTED);
        submission.setCreatedAt(submittedAt);
        submission = submissionRepository.save(submission);
        work.setCurrentSubmission(submission);
        workRepository.save(work);

        Execution execution = new Execution(submission, ExecutionType.DEFINITIVE);
        execution.setStatus(ExecutionStatus.AC);
        execution.setTimeMs(320L);
        execution.setMemoryMb(30L);
        executionRepository.save(execution);

        AssignmentGrade grade = new AssignmentGrade();
        grade.setStudentWork(work);
        grade.setValue(new BigDecimal("95.00"));
        grade.setMaxPointsSnapshot(new BigDecimal("100.00"));
        grade.setStatus(GradeStatus.RETURNED);
        grade.setReturnedAt(Instant.now());
        grade.setGradedBy(teacher);
        grade.setGradedSubmission(submission);
        gradeRepository.save(grade);
    }

    @Test
    void ownerGetsGroupOverview() throws Exception {
        mockMvc.perform(get("/api/groups/{id}/metrics/overview", group.getId())
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.enrollment.active").value(2))
                .andExpect(jsonPath("$.data.assignments.total").value(1))
                .andExpect(jsonPath("$.data.assignments.published").value(1))
                .andExpect(jsonPath("$.data.overallSubmissionRate").value(50.0))
                .andExpect(jsonPath("$.data.overallAverageScore").value(95.0))
                .andExpect(jsonPath("$.data.overallOnTimeRate").value(100.0))
                .andExpect(jsonPath("$.data.gradingProgress.submitted").value(1))
                .andExpect(jsonPath("$.data.gradingProgress.graded").value(1))
                .andExpect(jsonPath("$.data.gradingProgress.returned").value(1));
    }

    @Test
    void ownerListsAssignmentMetrics() throws Exception {
        mockMvc.perform(get("/api/groups/{id}/metrics/assignments", group.getId())
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].assignmentId").value(assignment.getId().toString()))
                .andExpect(jsonPath("$.data[0].activeStudents").value(2))
                .andExpect(jsonPath("$.data[0].submittedCount").value(1))
                .andExpect(jsonPath("$.data[0].submissionRate").value(50.0))
                .andExpect(jsonPath("$.data[0].lateCount").value(0))
                .andExpect(jsonPath("$.data[0].onTimeRate").value(100.0))
                .andExpect(jsonPath("$.data[0].averageScore").value(95.0))
                .andExpect(jsonPath("$.data[0].averageAttempts").value(1.0))
                .andExpect(jsonPath("$.data[0].averageDeliveryMarginHours").value(26.0))
                .andExpect(jsonPath("$.data[0].verdictDistribution.AC").value(1))
                .andExpect(jsonPath("$.data[0].missingCount").value(1))
                .andExpect(jsonPath("$.data[0].overdue").value(false));
    }

    @Test
    void ownerListsStudentMetricsWithMinimalPersonalData() throws Exception {
        mockMvc.perform(get("/api/groups/{id}/metrics/students", group.getId())
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[0].studentId").value(ada.getId().toString()))
                .andExpect(jsonPath("$.data[0].fullName").value("Ada Lovelace"))
                .andExpect(jsonPath("$.data[0].completionRate").value(100.0))
                .andExpect(jsonPath("$.data[0].averageScore").value(95.0))
                .andExpect(jsonPath("$.data[0].missingAssignmentIds", hasSize(0)))
                .andExpect(jsonPath("$.data[1].studentId").value(konrad.getId().toString()))
                .andExpect(jsonPath("$.data[1].completionRate").value(0.0))
                .andExpect(jsonPath("$.data[1].averageScore").value(nullValue()))
                .andExpect(jsonPath("$.data[1].missingAssignmentIds", hasSize(1)))
                .andExpect(jsonPath("$.data[0].email").doesNotExist())
                .andExpect(jsonPath("$.data[0].scopes").doesNotExist())
                .andExpect(jsonPath("$.data[0].temporaryPassword").doesNotExist());
    }

    @Test
    void ownerGetsAssignmentDetailWithPerStudentBreakdown() throws Exception {
        mockMvc.perform(get("/api/assignments/{id}/metrics", assignment.getId())
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.languageDistribution.JAVA").value(1))
                .andExpect(jsonPath("$.data.acceptedPerformance.averageTimeMs").value(320.0))
                .andExpect(jsonPath("$.data.acceptedPerformance.averageMemoryMb").value(30.0))
                .andExpect(jsonPath("$.data.acceptedPerformance.timeLimitMs").value(2000))
                .andExpect(jsonPath("$.data.missingStudents", hasSize(1)))
                .andExpect(jsonPath("$.data.missingStudents[0].studentId").value(konrad.getId().toString()))
                .andExpect(jsonPath("$.data.perStudent", hasSize(2)))
                .andExpect(jsonPath("$.data.perStudent[0].fullName").value("Ada Lovelace"))
                .andExpect(jsonPath("$.data.perStudent[0].workStatus").value("SUBMITTED"))
                .andExpect(jsonPath("$.data.perStudent[0].attempts").value(1))
                .andExpect(jsonPath("$.data.perStudent[0].verdict").value("AC"))
                .andExpect(jsonPath("$.data.perStudent[0].grade.value").value(95.0))
                .andExpect(jsonPath("$.data.perStudent[1].workStatus").value("NOT_SUBMITTED"))
                .andExpect(jsonPath("$.data.perStudent[1].attempts").value(0))
                .andExpect(jsonPath("$.data.perStudent[1].verdict").value(nullValue()))
                .andExpect(jsonPath("$.data.perStudent[1].grade").value(nullValue()));
    }

    @Test
    void enrolledStudentCannotAccessMetrics() throws Exception {
        mockMvc.perform(get("/api/groups/{id}/metrics/overview", group.getId())
                        .header("Authorization", "Bearer " + adaToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/groups/{id}/metrics/students", group.getId())
                        .header("Authorization", "Bearer " + adaToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/assignments/{id}/metrics", assignment.getId())
                        .header("Authorization", "Bearer " + adaToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void unknownGroupAndDeletedAssignmentReturnNotFound() throws Exception {
        mockMvc.perform(get("/api/groups/{id}/metrics/overview",
                        "00000000-0000-0000-0000-000000000001")
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isNotFound());

        assignment.setIsActive(false);
        assignmentRepository.save(assignment);
        mockMvc.perform(get("/api/assignments/{id}/metrics", assignment.getId())
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void ownerKeepsHistoricalAccessToArchivedAndDeletedGroups() throws Exception {
        group.setArchived(true);
        group.setIsActive(false);
        groupRepository.save(group);

        mockMvc.perform(get("/api/groups/{id}/metrics/overview", group.getId())
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.groupId").value(group.getId().toString()));
    }

    @Test
    void studentOwnerSeesMetricsOfTheirOwnGroup() throws Exception {
        ClassGroup ownedByStudent = groupRepository.save(
                new ClassGroup("Peer Study", "", ada, "PEERMET1"));

        mockMvc.perform(get("/api/groups/{id}/metrics/overview", ownedByStudent.getId())
                        .header("Authorization", "Bearer " + adaToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.enrollment.active").value(0))
                .andExpect(jsonPath("$.data.overallSubmissionRate").value(nullValue()));
    }
}
