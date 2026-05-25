package com.github.codehive.worker.sandbox.cpp;

import com.github.codehive.worker.sandbox.AbstractLanguageExecutor;
import com.github.dockerjava.api.DockerClient;
import org.springframework.stereotype.Component;

@Component("CPP")
public class CPPExecutor extends AbstractLanguageExecutor {
    private static final String COMPILE_IMAGE = "gcc:12";
    private static final String EXEC_IMAGE = "irmindev/cpp-exec:latest";
    private static final long PIDS_LIMIT = 32L;

    public CPPExecutor(DockerClient dockerClient) {
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
        return new String[]{"g++", "-std=c++23", "-o", "program", "main.cpp", "-lm"};
    }

    @Override
    protected String sourceFileName() {
        return "main.cpp";
    }

    @Override
    protected String tempDirPrefix() {
        return "cpp-exec-";
    }

    @Override
    protected String runCommand() {
        return "./program";
    }
}
