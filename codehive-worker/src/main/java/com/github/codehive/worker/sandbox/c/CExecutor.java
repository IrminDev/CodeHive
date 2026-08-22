package com.github.codehive.worker.sandbox.c;

import com.github.codehive.worker.sandbox.AbstractLanguageExecutor;
import com.github.dockerjava.api.DockerClient;
import org.springframework.stereotype.Component;

@Component("C")
public class CExecutor extends AbstractLanguageExecutor {
    // GCC 13 exposes C23 draft support through -std=c2x.
    // Bookworm matches the Debian 12 execution image, preserving glibc compatibility.
    private static final String COMPILE_IMAGE = "gcc:13-bookworm";
    private static final String EXEC_IMAGE = "irmindev/c-exec:latest";
    private static final long PIDS_LIMIT = 32L;

    public CExecutor(DockerClient dockerClient) {
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
        return new String[]{"gcc", "-std=c2x", "-o", "program", "main.c", "-lm"};
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

    @Override
    protected boolean isMemoryLimitError(String stderr) {
        return stderr != null && stderr.toLowerCase().contains("cannot allocate memory");
    }
}
