package com.github.codehive.controller;

import static org.hamcrest.CoreMatchers.nullValue;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
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
@DisplayName("StudentMetricsController Integration")
class StudentMetricsControllerIntegrationTest {
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

    private User ada;
    private String adaToken;
    private String konradToken;
    private String outsiderToken;
    private ClassGroup group;
    private Assignment assignment;
    private AssignmentGrade grade;

    @BeforeEach
    void setUp() {
        User teacher = userRepository.save(new User("Grace", "Hopper", "TEA-SM", "teacher@sm.test",
                passwordEncoder.encode("Pass123!"), Role.TEACHER));
        ada = userRepository.save(new User("Ada", "Lovelace", "STU-SM-1", "ada@sm.test",
                passwordEncoder.encode("Pass123!"), Role.STUDENT));
        User konrad = userRepository.save(new User("Konrad", "Zuse", "STU-SM-2", "konrad@sm.test",
                passwordEncoder.encode("Pass123!"), Role.STUDENT));
        User outsider = userRepository.save(new User("Alan", "Turing", "STU-SM-3", "outsider@sm.test",
                passwordEncoder.encode("Pass123!"), Role.STUDENT));
        adaToken = jwtUtil.generateToken(Map.of("role", "STUDENT"), ada.getEmail());
        konradToken = jwtUtil.generateToken(Map.of("role", "STUDENT"), konrad.getEmail());
        outsiderToken = jwtUtil.generateToken(Map.of("role", "STUDENT"), outsider.getEmail());

        group = groupRepository.save(new ClassGroup("Algorithms", "", teacher, "STUMET99"));
        enrollmentRepository.save(new GroupEnrollment(group, ada));
        enrollmentRepository.save(new GroupEnrollment(group, konrad));

        assignment = new Assignment("Graphs", "description", 2000L, 256L, ComparatorType.EXACT_MATCH);
        assignment.setGroup(group);
        assignment.setAuthor(teacher);
        assignment.setValidationStatus(AssignmentValidationStatus.READY);
        assignment.setAllowedLanguages(List.of(Language.JAVA));
        assignment = assignmentRepository.save(assignment);

        // Ada submitted on time; Konrad never submitted.
        StudentAssignmentWork work = new StudentAssignmentWork();
        work.setAssignment(assignment);
        work.setStudent(ada);
        work.setStatus(StudentWorkStatus.SUBMITTED);
        work = workRepository.save(work);

        Submission submission = new Submission(assignment, ada, Language.JAVA, false);
        submission.setStudentWork(work);
        submission.setStatus(SubmissionStatus.SUBMITTED);
        submission.setCreatedAt(LocalDateTime.now().withNano(0).minusHours(2));
        submission = submissionRepository.save(submission);
        work.setCurrentSubmission(submission);
        workRepository.save(work);

        Execution execution = new Execution(submission, ExecutionType.DEFINITIVE);
        execution.setStatus(ExecutionStatus.AC);
        execution.setTimeMs(320L);
        execution.setMemoryMb(30L);
        executionRepository.save(execution);

        grade = new AssignmentGrade();
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
    void enrolledStudentGetsOwnSummary() throws Exception {
        mockMvc.perform(get("/api/groups/{id}/metrics/me", group.getId())
                        .header("Authorization", "Bearer " + adaToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.studentId").value(ada.getId().toString()))
                .andExpect(jsonPath("$.data.fullName").value("Ada Lovelace"))
                .andExpect(jsonPath("$.data.publishedAssignments").value(1))
                .andExpect(jsonPath("$.data.submittedCount").value(1))
                .andExpect(jsonPath("$.data.completionRate").value(100.0))
                .andExpect(jsonPath("$.data.lateCount").value(0))
                .andExpect(jsonPath("$.data.averageScore").value(95.0))
                .andExpect(jsonPath("$.data.gradedAssignments").value(1))
                .andExpect(jsonPath("$.data.totalAttempts").value(1))
                .andExpect(jsonPath("$.data.missingAssignmentIds", hasSize(0)));
    }

    @Test
    void nonSubmittingStudentGetsZeroesAndNullScore() throws Exception {
        mockMvc.perform(get("/api/groups/{id}/metrics/me", group.getId())
                        .header("Authorization", "Bearer " + konradToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.submittedCount").value(0))
                .andExpect(jsonPath("$.data.completionRate").value(0.0))
                .andExpect(jsonPath("$.data.averageScore").value(nullValue()))
                .andExpect(jsonPath("$.data.gradedAssignments").value(0))
                .andExpect(jsonPath("$.data.missingAssignmentIds", hasSize(1)))
                .andExpect(jsonPath("$.data.missingAssignmentIds[0]").value(assignment.getId().toString()));
    }

    @Test
    void draftGradeIsHiddenFromStudentAverage() throws Exception {
        grade.setStatus(GradeStatus.DRAFT);
        gradeRepository.save(grade);

        mockMvc.perform(get("/api/groups/{id}/metrics/me", group.getId())
                        .header("Authorization", "Bearer " + adaToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.averageScore").value(nullValue()))
                .andExpect(jsonPath("$.data.gradedAssignments").value(0));
    }

    @Test
    void enrolledStudentGetsOwnAssignmentBreakdown() throws Exception {
        mockMvc.perform(get("/api/groups/{id}/metrics/me/assignments", group.getId())
                        .header("Authorization", "Bearer " + adaToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].assignmentId").value(assignment.getId().toString()))
                .andExpect(jsonPath("$.data[0].workStatus").value("SUBMITTED"))
                .andExpect(jsonPath("$.data[0].deliveredLate").value(false))
                .andExpect(jsonPath("$.data[0].attempts").value(1))
                .andExpect(jsonPath("$.data[0].verdict").value("AC"))
                .andExpect(jsonPath("$.data[0].timeMs").value(320))
                .andExpect(jsonPath("$.data[0].memoryMb").value(30))
                .andExpect(jsonPath("$.data[0].grade.value").value(95.0))
                .andExpect(jsonPath("$.data[0].grade.status").value("RETURNED"));
    }

    @Test
    void nonSubmittingStudentAssignmentRowIsEmpty() throws Exception {
        mockMvc.perform(get("/api/groups/{id}/metrics/me/assignments", group.getId())
                        .header("Authorization", "Bearer " + konradToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].workStatus").value("NOT_SUBMITTED"))
                .andExpect(jsonPath("$.data[0].currentSubmissionId").value(nullValue()))
                .andExpect(jsonPath("$.data[0].verdict").value(nullValue()))
                .andExpect(jsonPath("$.data[0].attempts").value(0))
                .andExpect(jsonPath("$.data[0].grade").value(nullValue()));
    }

    @Test
    void draftGradeIsHiddenFromAssignmentBreakdown() throws Exception {
        grade.setStatus(GradeStatus.DRAFT);
        gradeRepository.save(grade);

        mockMvc.perform(get("/api/groups/{id}/metrics/me/assignments", group.getId())
                        .header("Authorization", "Bearer " + adaToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].grade").value(nullValue()));
    }

    @Test
    void nonEnrolledStudentIsForbidden() throws Exception {
        mockMvc.perform(get("/api/groups/{id}/metrics/me", group.getId())
                        .header("Authorization", "Bearer " + outsiderToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/groups/{id}/metrics/me/assignments", group.getId())
                        .header("Authorization", "Bearer " + outsiderToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void deletedGroupReturnsNotFound() throws Exception {
        group.setIsActive(false);
        groupRepository.save(group);

        mockMvc.perform(get("/api/groups/{id}/metrics/me", group.getId())
                        .header("Authorization", "Bearer " + adaToken))
                .andExpect(status().isNotFound());
    }
}
