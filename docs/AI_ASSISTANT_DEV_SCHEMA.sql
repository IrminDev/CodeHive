-- Development-only PostgreSQL schema completion after Hibernate ddl-auto=update.
-- Run against a backed-up local database; not a Flyway migration.
-- Idempotent where PostgreSQL supports it. Validate on fresh and populated databases.

INSERT INTO assignment_ai_policies (assignment_id, enabled, max_ai_requests, level, version)
SELECT id, false, 0, 'CONCEPTUAL_ONLY', 0 FROM assignments
ON CONFLICT (assignment_id) DO NOTHING;

CREATE UNIQUE INDEX IF NOT EXISTS ux_assistant_one_pending
    ON assistant_interactions (conversation_id) WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS ix_assistant_history
    ON assistant_interactions (conversation_id, sequence_number DESC);
CREATE INDEX IF NOT EXISTS ix_assistant_pending_lease
    ON assistant_interactions (lease_expires_at) WHERE status = 'PENDING';

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_assignment_ai_policy_quota') THEN
        ALTER TABLE assignment_ai_policies ADD CONSTRAINT ck_assignment_ai_policy_quota
            CHECK ((enabled AND max_ai_requests BETWEEN 1 AND 10)
                OR (NOT enabled AND max_ai_requests = 0));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_assistant_charged_status') THEN
        ALTER TABLE assistant_interactions ADD CONSTRAINT ck_assistant_charged_status
            CHECK (NOT quota_charged OR status IN ('COMPLETED', 'REDIRECTED'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_assistant_generation_attempts') THEN
        ALTER TABLE assistant_interactions ADD CONSTRAINT ck_assistant_generation_attempts
            CHECK (generation_attempts BETWEEN 0 AND 2);
    END IF;
END $$;
