# Graph Report - codehive-worker  (2026-08-18)

## Corpus Check
- 51 files · ~11,754 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 551 nodes · 1376 edges · 29 communities (24 shown, 5 thin omitted)
- Extraction: 76% EXTRACTED · 24% INFERRED · 0% AMBIGUOUS · INFERRED: 325 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6ac7f36f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ExecutionResult
- .executePracticeTests
- ExecutionReport
- ExecutionJob
- AbstractLanguageExecutor
- DisplayName
- TestCaseResult
- TestGenerationJob
- CExecutor
- PythonExecutor
- TestGenerationResult
- ExecutionRequestListener.java
- TestGenerationResultProducer
- CPPExecutor
- JavaExecutor
- DisplayName
- RabbitMQConfig
- TestCaseInfo
- WorkerApplicationTests.java
- DockerClientConfig.java
- MinioConfig.java
- TestGenerationService
- gradlew
- WorkerApplication
- TestcontainersConfiguration.java
- TestWorkerApplication

## God Nodes (most connected - your core abstractions)
1. `ExecutionJob` - 38 edges
2. `ExecutionReport` - 37 edges
3. `ExecutionResult` - 33 edges
4. `TestGenerationJob` - 33 edges
5. `AbstractLanguageExecutor` - 33 edges
6. `TestCaseResult` - 27 edges
7. `ExecutionStatus` - 27 edges
8. `ExecutionTestCaseInfo` - 22 edges
9. `TestGenerationResult` - 21 edges
10. `SandboxSecurityTest` - 21 edges

## Surprising Connections (you probably didn't know these)
- `ExecutionRequestListener` --references--> `TestExecutionService`  [EXTRACTED]
  src/main/java/com/github/codehive/worker/messaging/listener/ExecutionRequestListener.java → src/main/java/com/github/codehive/worker/service/TestExecutionService.java
- `TestGenerationRequestListener` --references--> `TestGenerationService`  [EXTRACTED]
  src/main/java/com/github/codehive/worker/messaging/listener/TestGenerationRequestListener.java → src/main/java/com/github/codehive/worker/service/TestGenerationService.java
- `ExecutionReport` --references--> `TestCaseResult`  [EXTRACTED]
  src/main/java/com/github/codehive/worker/model/dto/ExecutionReport.java → src/main/java/com/github/codehive/worker/model/dto/TestCaseResult.java
- `ExecutionReport` --references--> `ExecutionStatus`  [EXTRACTED]
  src/main/java/com/github/codehive/worker/model/dto/ExecutionReport.java → src/main/java/com/github/codehive/worker/model/enums/ExecutionStatus.java
- `ExecutionResult` --references--> `ExecutionStatus`  [EXTRACTED]
  src/main/java/com/github/codehive/worker/model/dto/ExecutionResult.java → src/main/java/com/github/codehive/worker/model/enums/ExecutionStatus.java

## Import Cycles
- None detected.

## Communities (29 total, 5 thin omitted)

### Community 0 - "ExecutionResult"
Cohesion: 0.08
Nodes (18): AfterAll, ExecutionResult, CE, ExecutionResultTest, DisplayName, Nested, Test, MLE (+10 more)

### Community 1 - ".executePracticeTests"
Cohesion: 0.07
Nodes (18): ObjectMapper, ExecutionTestCaseInfo, Component, Logger, LanguageExecutorFactory, LanguageExecutor, Logger, MinioClient (+10 more)

### Community 2 - "ExecutionReport"
Cohesion: 0.14
Nodes (7): ExecutionReport, AddTestCase, DetermineOverallStatus, ExecutionReportTest, DisplayName, Nested, Test

### Community 3 - "ExecutionJob"
Cohesion: 0.08
Nodes (12): ExecutionJob, ComparatorType, EXACT_MATCH, FLOATING_POINT, ExecutionType, DEFINITIVE, PRACTICE, Language (+4 more)

### Community 4 - "AbstractLanguageExecutor"
Cohesion: 0.11
Nodes (9): HostConfig, AbstractLanguageExecutor, DockerClient, Logger, Override, ContainerSession, ContainerSessionTest, DisplayName (+1 more)

### Community 5 - "DisplayName"
Cohesion: 0.15
Nodes (11): ComparisonResult, Logger, Service, OutputComparatorService, ExactMatch, FloatingPoint, BeforeEach, DisplayName (+3 more)

### Community 6 - "TestCaseResult"
Cohesion: 0.07
Nodes (12): TestCaseResult, ExecutionStatus, AC, CE, MLE, OLE, PENDING, RTE (+4 more)

### Community 7 - "TestGenerationJob"
Cohesion: 0.14
Nodes (5): TestGenerationJob, TestGenerationMode, REFERENCE_COMPATIBILITY, TEST_SUITE_GENERATION, TestGenerationServiceTest

### Community 8 - "CExecutor"
Cohesion: 0.19
Nodes (6): CExecutor, Component, DockerClient, Override, CExecutorTest, Test

### Community 9 - "PythonExecutor"
Cohesion: 0.21
Nodes (5): BeforeAll, Component, DockerClient, Override, PythonExecutor

### Community 12 - "ExecutionRequestListener.java"
Cohesion: 0.26
Nodes (8): ExecutionRequestListener, Component, Logger, RabbitListener, ExecutionResultProducer, Logger, RabbitTemplate, Service

### Community 13 - "TestGenerationResultProducer"
Cohesion: 0.26
Nodes (8): Component, Logger, RabbitListener, TestGenerationRequestListener, Logger, RabbitTemplate, Service, TestGenerationResultProducer

### Community 14 - "CPPExecutor"
Cohesion: 0.26
Nodes (4): CPPExecutor, Component, DockerClient, Override

### Community 15 - "JavaExecutor"
Cohesion: 0.26
Nodes (4): Component, DockerClient, Override, JavaExecutor

### Community 16 - "DisplayName"
Cohesion: 0.35
Nodes (4): SandboxConstants, DisplayName, Test, SandboxConstantsTest

### Community 17 - "RabbitMQConfig"
Cohesion: 0.31
Nodes (5): MessageConverter, Bean, Configuration, RabbitMQConfig, SuppressWarnings

### Community 19 - "WorkerApplicationTests.java"
Cohesion: 0.53
Nodes (4): Import, SpringBootTest, Test, WorkerApplicationTests

### Community 20 - "DockerClientConfig.java"
Cohesion: 0.53
Nodes (4): DockerClientConfig, Bean, Configuration, DockerClient

### Community 21 - "MinioConfig.java"
Cohesion: 0.53
Nodes (4): Bean, Configuration, MinioClient, MinioConfig

### Community 22 - "TestGenerationService"
Cohesion: 0.60
Nodes (3): Logger, Service, TestGenerationService

### Community 23 - "gradlew"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

## Knowledge Gaps
- **18 isolated node(s):** `EXACT_MATCH`, `FLOATING_POINT`, `TLE`, `MLE`, `OLE` (+13 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AbstractLanguageExecutor` connect `AbstractLanguageExecutor` to `ExecutionResult`, `.executePracticeTests`, `CExecutor`, `PythonExecutor`, `CPPExecutor`, `JavaExecutor`?**
  _High betweenness centrality (0.196) - this node is a cross-community bridge._
- **Why does `LanguageExecutor` connect `.executePracticeTests` to `ExecutionResult`, `AbstractLanguageExecutor`, `TestGenerationService`, `TestCaseResult`?**
  _High betweenness centrality (0.157) - this node is a cross-community bridge._
- **Why does `ExecutionResult` connect `ExecutionResult` to `.executePracticeTests`, `AbstractLanguageExecutor`, `TestCaseResult`, `PythonExecutor`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **What connects `EXACT_MATCH`, `FLOATING_POINT`, `TLE` to the rest of the system?**
  _18 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ExecutionResult` be split into smaller, more focused modules?**
  _Cohesion score 0.08269230769230769 - nodes in this community are weakly interconnected._
- **Should `.executePracticeTests` be split into smaller, more focused modules?**
  _Cohesion score 0.07103825136612021 - nodes in this community are weakly interconnected._
- **Should `ExecutionReport` be split into smaller, more focused modules?**
  _Cohesion score 0.13783533765032377 - nodes in this community are weakly interconnected._