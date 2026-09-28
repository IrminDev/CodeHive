package com.github.codehive.worker.sandbox.c;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.command.InspectImageCmd;
import org.junit.jupiter.api.Test;

class CExecutorTest {

    @Test
    void usesC2xCompatibleCompilerImage() {
        DockerClient dockerClient = mock(DockerClient.class);
        InspectImageCmd inspectImageCmd = mock(InspectImageCmd.class);
        when(dockerClient.inspectImageCmd(anyString())).thenReturn(inspectImageCmd);
        CExecutor executor = new CExecutor(dockerClient);

        assertThat(executor.compileImage()).isEqualTo("gcc:13-bookworm");
        assertThat(executor.compileCommand())
                .containsExactly("gcc", "-std=c2x", "-o", "program", "main.c", "-lm");
    }
}
