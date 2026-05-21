package com.github.codehive.worker.sandbox.cpp;

import static com.github.codehive.worker.sandbox.SandboxConstants.*;

import com.github.codehive.worker.model.dto.ExecutionResult;
import com.github.codehive.worker.sandbox.AbstractLanguageExecutor;
import com.github.codehive.worker.sandbox.ContainerSession;
import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.command.CreateContainerResponse;
import com.github.dockerjava.api.command.WaitContainerResultCallback;
import com.github.dockerjava.api.model.Frame;
import com.github.dockerjava.api.model.StreamType;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermissions;
import java.util.concurrent.TimeUnit;

@Component("CPP")
public class CPPExecutor extends AbstractLanguageExecutor {
    private static final String GCC_IMAGE = "gcc:latest";
    private static final long PIDS_LIMIT = 32L;

    public CPPExecutor(DockerClient dockerClient) {
        super(dockerClient);
    }

    @Override
    protected String dockerImage() {
        return GCC_IMAGE;
    }

    @Override
    protected long pidsLimit() {
        return PIDS_LIMIT;
    }

    @Override
    public ContainerSession prepare(InputStream sourceCode, Long timeLimitMs, Long memoryLimitMb) throws Exception {
        timeLimitMs = timeLimitMs != null ? timeLimitMs : DEFAULT_TIME_LIMIT_MS;
        memoryLimitMb = memoryLimitMb != null ? memoryLimitMb : DEFAULT_MEMORY_LIMIT_MB;

        Path tempDir = Files.createTempDirectory("cpp-exec-");
        Files.setPosixFilePermissions(tempDir, PosixFilePermissions.fromString("rwxrwxrwx"));

        Path sourceFile = tempDir.resolve("main.cpp");
        byte[] sourceBytes = sourceCode.readNBytes(SOURCE_SIZE_LIMIT_BYTES);
        Files.write(sourceFile, sourceBytes);
        Files.setPosixFilePermissions(sourceFile, PosixFilePermissions.fromString("r--r--r--"));

        // Compile first
        ExecutionResult compileResult = compile(tempDir);
        if (compileResult != null) {
            deleteDirectory(tempDir);
            return ContainerSession.compilationError(compileResult.getCompilationError());
        }

        // Start long-running execution container
        CreateContainerResponse container = dockerClient.createContainerCmd(GCC_IMAGE)
                .withHostConfig(buildRunHostConfig(tempDir, memoryLimitMb))
                .withWorkingDir("/workspace")
                .withUser("nobody")
                .withCmd("sh", "-c", "sleep infinity")
                .exec();

        String containerId = container.getId();
        dockerClient.startContainerCmd(containerId).exec();

        return new ContainerSession(containerId, tempDir, timeLimitMs, memoryLimitMb);
    }

    @Override
    public ExecutionResult runTestCase(ContainerSession session, InputStream testInput) throws Exception {
        Path inputFile = session.getTempDir().resolve("input.txt");

        if (testInput != null) {
            byte[] inputBytes = testInput.readNBytes(INPUT_SIZE_LIMIT_BYTES);
            Files.write(inputFile, inputBytes);
            Files.setPosixFilePermissions(inputFile, PosixFilePermissions.fromString("r--r--r--"));
        } else {
            Files.deleteIfExists(inputFile);
        }

        boolean hasInput = Files.exists(inputFile);
        double timeLimitSec = session.getTimeLimitMs() / 1000.0;
        String timeoutCmd = String.format("timeout --kill-after=2s %.3fs ./program", timeLimitSec);
        String cmd = hasInput ? timeoutCmd + " < input.txt" : timeoutCmd;

        String execId = dockerClient.execCreateCmd(session.getContainerId())
                .withAttachStdout(true)
                .withAttachStderr(true)
                .withWorkingDir("/workspace")
                .withUser("nobody")
                .withCmd("sh", "-c", cmd)
                .exec()
                .getId();

        ByteArrayOutputStream stdoutBaos = new ByteArrayOutputStream();
        ByteArrayOutputStream stderrBaos = new ByteArrayOutputStream();
        int[] sharedBytes = {0};
        boolean[] truncated = {false};

        long startTime = System.currentTimeMillis();

        dockerClient.execStartCmd(execId)
                .exec(new ResultCallback.Adapter<Frame>() {
                    @Override
                    public void onNext(Frame frame) {
                        byte[] payload = frame.getPayload();
                        if (payload == null) return;
                        synchronized (sharedBytes) {
                            int remaining = OUTPUT_LIMIT_BYTES - sharedBytes[0];
                            if (remaining <= 0) { truncated[0] = true; return; }
                            int toWrite = Math.min(payload.length, remaining);
                            try {
                                if (frame.getStreamType() == StreamType.STDOUT) {
                                    stdoutBaos.write(payload, 0, toWrite);
                                } else {
                                    stderrBaos.write(payload, 0, toWrite);
                                }
                            } catch (Exception ignored) {}
                            sharedBytes[0] += toWrite;
                            if (toWrite < payload.length) truncated[0] = true;
                        }
                    }
                })
                .awaitCompletion(session.getTimeLimitMs() + 5000, TimeUnit.MILLISECONDS);

        long executionTime = System.currentTimeMillis() - startTime;

        Long exitCode = dockerClient.inspectExecCmd(execId).exec().getExitCodeLong();
        if (exitCode == null) exitCode = -1L;

        String stdout = stdoutBaos.toString(StandardCharsets.UTF_8);
        String stderr = stderrBaos.toString(StandardCharsets.UTF_8);

        cleanupBetweenRuns(session);

        if (exitCode == 124L) {
            return ExecutionResult.timeLimitExceeded(session.getTimeLimitMs());
        }
        if (exitCode == 137L) {
            return ExecutionResult.memoryLimitExceeded(session.getMemoryLimitMb() * 1024L);
        }
        if (truncated[0]) {
            return ExecutionResult.outputLimitExceeded(
                stdout + "\n[Output truncated: exceeded 4 MB limit]", executionTime);
        }
        if (exitCode != 0) {
            return ExecutionResult.runtimeError(stderr, exitCode.intValue(), executionTime);
        }
        return ExecutionResult.success(stdout, executionTime, 0L);
    }



    private ExecutionResult compile(Path workDir) {
        String containerId = null;
        try {
            CreateContainerResponse container = dockerClient.createContainerCmd(GCC_IMAGE)
                    .withHostConfig(buildCompileHostConfig(workDir))
                    .withWorkingDir("/workspace")
                    .withUser("nobody")
                    .withCmd("g++", "-o", "program", "main.cpp", "-std=c++17", "-lm")
                    .exec();

            containerId = container.getId();
            dockerClient.startContainerCmd(containerId).exec();

            int exitCode = dockerClient.waitContainerCmd(containerId)
                    .exec(new WaitContainerResultCallback())
                    .awaitStatusCode(30, TimeUnit.SECONDS);

            if (exitCode != 0) {
                String stderr = getContainerLogsCompile(containerId);
                return ExecutionResult.compilationError(stderr);
            }

            return null;
        } catch (Exception e) {
            logger.error("Compilation error", e);
            return ExecutionResult.compilationError("Compilation failed: " + e.getMessage());
        } finally {
            if (containerId != null) {
                try {
                    dockerClient.removeContainerCmd(containerId).withForce(true).exec();
                } catch (Exception e) {
                    logger.warn("Failed to remove compile container", e);
                }
            }
        }
    }

    private String getContainerLogsCompile(String containerId) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        int[] bytesWritten = {0};
        try {
            dockerClient.logContainerCmd(containerId)
                .withStdOut(false)
                .withStdErr(true)
                .exec(new ResultCallback.Adapter<Frame>() {
                    @Override
                    public void onNext(Frame frame) {
                        byte[] payload = frame.getPayload();
                        if (payload == null) return;
                        int remaining = COMPILE_STDERR_LIMIT_BYTES - bytesWritten[0];
                        if (remaining <= 0) return;
                        int toWrite = Math.min(payload.length, remaining);
                        try { baos.write(payload, 0, toWrite); } catch (Exception ignored) {}
                        bytesWritten[0] += toWrite;
                    }
                }).awaitCompletion(5, TimeUnit.SECONDS);
        } catch (Exception e) {
            logger.error("Failed to get compile logs", e);
        }
        return baos.toString(StandardCharsets.UTF_8);
    }

}
