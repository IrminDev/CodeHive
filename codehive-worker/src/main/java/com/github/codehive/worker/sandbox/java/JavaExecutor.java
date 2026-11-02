package com.github.codehive.worker.sandbox.java;

import com.github.codehive.worker.sandbox.AbstractLanguageExecutor;
import com.github.dockerjava.api.DockerClient;
import org.springframework.stereotype.Component;

@Component("JAVA")
public class JavaExecutor extends AbstractLanguageExecutor {
    private static final String COMPILE_IMAGE = "eclipse-temurin:21-jdk-ubi10-minimal";
    private static final String EXEC_IMAGE = "irmindev/java-exec:latest";
    private static final long PIDS_LIMIT = 16L;

    public JavaExecutor(DockerClient dockerClient) {
        super(dockerClient);
    }

    @Override
    protected String execImage() {
        return EXEC_IMAGE;
    }

    @Override
    protected String compileImage() {
        return COMPILE_IMAGE;
    }

    @Override
    protected long pidsLimit() {
        return PIDS_LIMIT;
    }

    @Override
    protected String[] compileCommand() {
        return new String[]{"javac", "Main.java"};
    }

    @Override
    protected String sourceFileName() {
        return "Main.java";
    }

    @Override
    protected String tempDirPrefix() {
        return "java-exec-";
    }

    @Override
    protected String runCommand() {
        // Let timeout's SIGTERM terminate the JVM directly. The JVM's normal
        // signal handler needs a new thread, which can fail at the PID limit
        // and force timeout to escalate to SIGKILL (137, classified as MLE).
        return "java -Xrs Main";
    }

    @Override
    protected boolean isMemoryLimitError(String stderr) {
        return stderr != null && (stderr.contains("java.lang.OutOfMemoryError")
                || stderr.contains("OutOfMemoryError:"));
    }
}
