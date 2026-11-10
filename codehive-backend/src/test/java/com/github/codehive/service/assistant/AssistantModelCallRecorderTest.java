package com.github.codehive.service.assistant;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import com.github.codehive.model.entity.*;
import com.github.codehive.model.enums.*;
import com.github.codehive.repository.*;
class AssistantModelCallRecorderTest {
    private static final UUID ID=UUID.fromString("00000000-0000-0000-0000-000000000001");
    private final AssistantModelCallRepository calls=mock(AssistantModelCallRepository.class);
    private final AssistantInteractionRepository interactions=mock(AssistantInteractionRepository.class);
    private final AssistantModelCallRecorder recorder=new AssistantModelCallRecorder(calls,interactions);
    @Test void completionIsIdempotentAndPreservesProviderTotalAndLargeTokens() {
        var call=new AssistantModelCall();call.setStatus(AssistantModelCallStatus.STARTED);
        when(calls.lock(ID)).thenReturn(Optional.of(call));
        recorder.finish(ID,new AssistantModelResult("never stored","reported",3_000_000_000L,0L,4_000_000_000L),null,4);
        recorder.finish(ID,null,"MODEL_FAILURE",9);
        assertThat(call.getStatus()).isEqualTo(AssistantModelCallStatus.SUCCEEDED);
        assertThat(call.getInputTokens()).isEqualTo(3_000_000_000L);
        assertThat(call.getOutputTokens()).isZero();
        assertThat(call.getTotalTokens()).isEqualTo(4_000_000_000L);
        assertThat(call.getDurationMs()).isEqualTo(4);
    }
    @Test void timeoutDoesNotOverwriteSuccessAndLateResultCompletesUnknownCall() {
        var call=new AssistantModelCall();call.setStatus(AssistantModelCallStatus.UNKNOWN);
        when(calls.lock(ID)).thenReturn(Optional.of(call));
        recorder.callerTimedOut(ID);
        recorder.finish(ID,new AssistantModelResult("untrusted",null,null,null,null),null,20);
        recorder.callerTimedOut(ID);
        assertThat(call.getStatus()).isEqualTo(AssistantModelCallStatus.SUCCEEDED);
        assertThat(call.getCallerTimedOutAt()).isNotNull();
        assertThat(call.getTotalTokens()).isNull();
    }
    @Test void cancelledInteractionCannotStartNewProviderCall() {
        var interaction=new AssistantInteraction();interaction.setStatus(AssistantInteractionStatus.CANCELLED);
        when(interactions.lockForModelCall(ID)).thenReturn(Optional.of(interaction));
        assertThatThrownBy(()->recorder.start(new AssistantModelCallContext(ID,AssistantModelCallStage.INPUT_REVIEW,null,"v1"),"provider","model"))
            .hasMessage("REQUEST_CANCELLED");
        verifyNoInteractions(calls);
    }
}
