package com.github.codehive.worker.sandbox.python;

import com.github.codehive.worker.sandbox.AbstractLanguageExecutor;
import com.github.dockerjava.api.DockerClient;
import org.springframework.stereotype.Component;

@Component("PYTHON")
public class PythonExecutor extends AbstractLanguageExecutor {
    private static final String EXEC_IMAGE = "irmindev/python-exec:latest";
    private static final long PIDS_LIMIT = 16L;

    public PythonExecutor(DockerClient dockerClient) {
        super(dockerClient);
    }

    @Override
    protected String execImage() {
        return EXEC_IMAGE;
    }

    @Override
    protected long pidsLimit() {
        return PIDS_LIMIT;
    }

    @Override
    protected String compileImage() {
        return EXEC_IMAGE;
    }

    @Override
    protected String[] compileCommand() {
        return new String[]{
                "python", "-c",
                "from pathlib import Path; compile(Path('main.py').read_bytes(), 'main.py', 'exec')"
        };
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
    protected boolean isMemoryLimitError(String stderr) {
        if (stderr == null) return false;
        String trimmed = stderr.stripTrailing();
        return trimmed.endsWith("MemoryError") || trimmed.contains("MemoryError:");
    }
}
