package com.github.codehive.worker.sandbox.java;

import com.github.codehive.worker.sandbox.AbstractLanguageExecutor;
import com.github.dockerjava.api.DockerClient;
import org.springframework.stereotype.Component;

@Component("JAVA")
public class JavaExecutor extends AbstractLanguageExecutor {
    private static final String JAVA_IMAGE = "eclipse-temurin:21-jdk-ubi10-minimal";
    private static final long PIDS_LIMIT = 64L;

    public JavaExecutor(DockerClient dockerClient) {
        super(dockerClient);
    }

    @Override
    protected String dockerImage() {
        return JAVA_IMAGE;
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
        return "java Main";
    }

}
