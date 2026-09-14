package com.github.codehive.worker.sandbox.python;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.command.InspectImageCmd;
import org.junit.jupiter.api.Test;

class PythonExecutorTest {

    @Test
    void performsStaticCompilationWithoutExecutingSource() {
        PythonExecutor executor = executor();

        assertThat(executor.compileImage()).isEqualTo("irmindev/python-exec:latest");
        assertThat(executor.compileCommand())
                .containsExactly("python", "-c",
                        "from pathlib import Path; compile(Path('main.py').read_bytes(), 'main.py', 'exec')");
    }

    @Test
    void recognizesTerminalMemoryErrorButNotGenericTraceback() {
        PythonExecutor executor = executor();

        assertThat(executor.isMemoryLimitError("Traceback...\nMemoryError\n")).isTrue();
        assertThat(executor.isMemoryLimitError("Traceback...\nZeroDivisionError: division by zero\n"))
                .isFalse();
    }

    private PythonExecutor executor() {
        DockerClient dockerClient = mock(DockerClient.class);
        InspectImageCmd inspectImageCmd = mock(InspectImageCmd.class);
        when(dockerClient.inspectImageCmd(anyString())).thenReturn(inspectImageCmd);
        return new PythonExecutor(dockerClient);
    }
}
