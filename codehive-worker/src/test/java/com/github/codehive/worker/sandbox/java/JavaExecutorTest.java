package com.github.codehive.worker.sandbox.java;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.command.InspectImageCmd;
import org.junit.jupiter.api.Test;

class JavaExecutorTest {

    @Test
    void recognizesManagedHeapExhaustionAsMemoryLimitError() {
        JavaExecutor executor = executor();

        assertThat(executor.isMemoryLimitError(
                "Exception in thread \"main\" java.lang.OutOfMemoryError: Java heap space"))
                .isTrue();
        assertThat(executor.isMemoryLimitError(
                "Exception in thread \"main\" java.lang.NullPointerException"))
                .isFalse();
    }

    private JavaExecutor executor() {
        DockerClient dockerClient = mock(DockerClient.class);
        InspectImageCmd inspectImageCmd = mock(InspectImageCmd.class);
        when(dockerClient.inspectImageCmd(anyString())).thenReturn(inspectImageCmd);
        return new JavaExecutor(dockerClient);
    }
}
