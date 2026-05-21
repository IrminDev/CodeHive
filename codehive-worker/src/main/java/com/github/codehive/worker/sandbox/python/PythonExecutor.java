package com.github.codehive.worker.sandbox.python;

import com.github.codehive.worker.model.dto.ExecutionResult;
import com.github.codehive.worker.sandbox.AbstractLanguageExecutor;
import com.github.dockerjava.api.DockerClient;
import org.springframework.stereotype.Component;

@Component("PYTHON")
public class PythonExecutor extends AbstractLanguageExecutor {
    private static final String PYTHON_IMAGE = "python:3.13-slim";
    private static final long PIDS_LIMIT = 64L;

    public PythonExecutor(DockerClient dockerClient) {
        super(dockerClient);
    }

    @Override
    protected String dockerImage() {
        return PYTHON_IMAGE;
    }

    @Override
    protected long pidsLimit() {
        return PIDS_LIMIT;
    }

    @Override
    protected String sourceFileName() {
        return "main.py";
    }

    @Override
    protected String tempDirPrefix() {
        return "python-exec-";
    }

    @Override
    protected String runCommand() {
        return "python main.py";
    }

    @Override
    protected String[] containerEnv() {
        return new String[]{"PYTHONDONTWRITEBYTECODE=1"};
    }

    @Override
    protected ExecutionResult classifyNonZeroExit(long exitCode, String stdout, String stderr, long executionTime) {
        if (stderr.contains("SyntaxError")) {
            return ExecutionResult.compilationError(stderr);
        }
        return null;
    }

}
