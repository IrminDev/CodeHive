-- Additive PostgreSQL development schema. Apply after existing assistant tables exist.
-- No resets, content copies, fabricated calls, or permission grants.
ALTER TABLE assistant_interactions ADD COLUMN IF NOT EXISTS requested_assistance_level varchar(50);

CREATE TABLE IF NOT EXISTS assistant_model_calls (
    id uuid PRIMARY KEY,
    interaction_id uuid NOT NULL REFERENCES assistant_interactions(id),
    call_ordinal integer NOT NULL CHECK (call_ordinal > 0),
    stage varchar(30) NOT NULL CHECK (stage IN ('INPUT_REVIEW','ANSWER_GENERATION','OUTPUT_REVIEW','POLICY_REVALIDATION')),
    generation_attempt integer CHECK (generation_attempt BETWEEN 1 AND 2),
    provider_id varchar(100),
    configured_model_id varchar(150),
    reported_model_id varchar(150),
    prompt_version varchar(100),
    started_at timestamptz NOT NULL,
    finished_at timestamptz,
    duration_ms bigint CHECK (duration_ms >= 0),
    status varchar(20) NOT NULL CHECK (status IN ('STARTED','SUCCEEDED','FAILED','UNKNOWN')),
    failure_code varchar(60),
    caller_timed_out_at timestamptz,
    input_tokens bigint CHECK (input_tokens >= 0),
    output_tokens bigint CHECK (output_tokens >= 0),
    total_tokens bigint CHECK (total_tokens >= 0),
    usage_source varchar(30),
    UNIQUE (interaction_id, call_ordinal)
);

CREATE INDEX IF NOT EXISTS idx_assistant_call_started ON assistant_model_calls(started_at);

CREATE INDEX IF NOT EXISTS idx_assistant_call_interaction_started ON assistant_model_calls(interaction_id, started_at);

CREATE INDEX IF NOT EXISTS ix_assistant_history ON assistant_interactions(conversation_id, created_at);

-- Validate usefulness with EXPLAIN ANALYZE on representative data before adding more indexes.

-- Existing assistant invariants are retained when bootstrapping development databases.
CREATE UNIQUE INDEX IF NOT EXISTS ux_assistant_one_pending ON assistant_interactions(conversation_id) WHERE status = 'PENDING';

CREATE INDEX IF NOT EXISTS ix_assistant_pending_lease ON assistant_interactions(lease_expires_at) WHERE status = 'PENDING';

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_assignment_ai_policy_quota') THEN
        ALTER TABLE assignment_ai_policies ADD CONSTRAINT ck_assignment_ai_policy_quota CHECK ((enabled AND max_ai_requests BETWEEN 1 AND 10) OR (NOT enabled AND max_ai_requests = 0));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_assistant_charged_status') THEN
        ALTER TABLE assistant_interactions ADD CONSTRAINT ck_assistant_charged_status CHECK (NOT quota_charged OR status IN ('COMPLETED','REDIRECTED'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_assistant_generation_attempts') THEN
        ALTER TABLE assistant_interactions ADD CONSTRAINT ck_assistant_generation_attempts CHECK (generation_attempts BETWEEN 0 AND 2);
    END IF;
END $$;
