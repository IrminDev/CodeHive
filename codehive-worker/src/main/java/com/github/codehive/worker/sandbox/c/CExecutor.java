package com.github.codehive.worker.sandbox.c;

import com.github.codehive.worker.sandbox.AbstractLanguageExecutor;
import com.github.dockerjava.api.DockerClient;
import org.springframework.stereotype.Component;

@Component("C")
public class CExecutor extends AbstractLanguageExecutor {
    private static final String GCC_IMAGE = "gcc:latest";
    private static final long PIDS_LIMIT = 32L;

    public CExecutor(DockerClient dockerClient) {
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
    protected String[] compileCommand() {
        return new String[]{"gcc", "-std=c23", "-o", "program", "main.c", "-lm"};
    }

    @Override
    protected String sourceFileName() {
        return "main.c";
    }

    @Override
    protected String tempDirPrefix() {
        return "c-exec-";
    }

    @Override
    protected String runCommand() {
        return "./program";
    }

}
