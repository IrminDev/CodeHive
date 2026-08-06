package com.github.codehive.worker.sandbox.factory;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;

import com.github.codehive.worker.model.enums.Language;
import com.github.codehive.worker.sandbox.LanguageExecutor;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("LanguageExecutorFactory")
class LanguageExecutorFactoryTest {

    private LanguageExecutor javaExecutor;
    private LanguageExecutor pythonExecutor;
    private LanguageExecutor cExecutor;
    private LanguageExecutor cppExecutor;
    private LanguageExecutorFactory factory;

    @BeforeEach
    void setUp() {
        javaExecutor   = mock(LanguageExecutor.class);
        pythonExecutor = mock(LanguageExecutor.class);
        cExecutor      = mock(LanguageExecutor.class);
        cppExecutor    = mock(LanguageExecutor.class);

        factory = new LanguageExecutorFactory(Map.of(
                "JAVA",   javaExecutor,
                "PYTHON", pythonExecutor,
                "C",      cExecutor,
                "CPP",    cppExecutor
        ));
    }

    @Test
    @DisplayName("returns correct executor for each supported language")
    void returnsCorrectExecutorPerLanguage() {
        assertThat(factory.getExecutor(Language.JAVA)).isSameAs(javaExecutor);
        assertThat(factory.getExecutor(Language.PYTHON)).isSameAs(pythonExecutor);
        assertThat(factory.getExecutor(Language.C)).isSameAs(cExecutor);
        assertThat(factory.getExecutor(Language.CPP)).isSameAs(cppExecutor);
    }

    @Test
    @DisplayName("null language throws IllegalArgumentException")
    void nullLanguageThrows() {
        assertThatThrownBy(() -> factory.getExecutor(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("null");
    }

    @Test
    @DisplayName("unregistered language throws IllegalArgumentException")
    void unregisteredLanguageThrows() {
        LanguageExecutorFactory emptyFactory = new LanguageExecutorFactory(Map.of());
        assertThatThrownBy(() -> emptyFactory.getExecutor(Language.JAVA))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("JAVA");
    }
}
