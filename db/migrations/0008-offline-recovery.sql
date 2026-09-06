-- Additive P08. No earlier migration, accepted receipt, source or issued byte is rewritten.
ALTER TABLE ppo.operation_receipts ADD CONSTRAINT uq_operation_receipts_exact_sync UNIQUE(workspace_id,actor_id,operation_id,id);
CREATE TABLE ppo.sync_acceptances (
 workspace_id uuid NOT NULL, actor_id uuid NOT NULL, operation_id uuid NOT NULL,
 appointment_id uuid NOT NULL, envelope jsonb NOT NULL, payload_hash text NOT NULL CHECK(payload_hash ~ '^[a-f0-9]{64}$'),
 receipt_id uuid NOT NULL, received_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(workspace_id,actor_id,operation_id),
 FOREIGN KEY(workspace_id,actor_id,operation_id) REFERENCES ppo.operation_receipts(workspace_id,actor_id,operation_id),
 FOREIGN KEY(workspace_id,actor_id,operation_id,receipt_id) REFERENCES ppo.operation_receipts(workspace_id,actor_id,operation_id,id),
 FOREIGN KEY(workspace_id,appointment_id) REFERENCES ppo.appointments(workspace_id,id),
 CHECK(envelope ?& ARRAY['operation_id','actor_id','workspace_id','appointment_id','schema_version','payload','authority','depends_on'] AND envelope->>'schema_version'='1' AND envelope->>'operation_id'=operation_id::text AND envelope->>'actor_id'=actor_id::text AND envelope->>'workspace_id'=workspace_id::text AND envelope->>'appointment_id'=appointment_id::text)
);
CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON ppo.sync_acceptances FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.offline_recovery_grants (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, actor_id uuid NOT NULL, company_id uuid NOT NULL, site_id uuid NOT NULL,
 appointment_id uuid NOT NULL, owner_id uuid NOT NULL, token_hash text NOT NULL UNIQUE CHECK(token_hash ~ '^[a-f0-9]{64}$'),
 authority jsonb NOT NULL, issued_at timestamptz NOT NULL DEFAULT clock_timestamp(), expires_at timestamptz NOT NULL,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,actor_id,id),
 FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id,appointment_id) REFERENCES ppo.appointments(workspace_id,company_id,site_id,id),
 CHECK(expires_at>issued_at)
);
CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON ppo.offline_recovery_grants FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.offline_recovery_cases (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, actor_id uuid NOT NULL, operation_id uuid NOT NULL,
 grant_id uuid NOT NULL, activity_id uuid NOT NULL, receipt_id uuid NOT NULL UNIQUE,
 envelope jsonb NOT NULL, payload_hash text NOT NULL CHECK(payload_hash ~ '^[a-f0-9]{64}$'),
 byte_hash text, byte_count integer, storage_item_id uuid,
 received_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,actor_id,operation_id),
 FOREIGN KEY(workspace_id,actor_id,grant_id) REFERENCES ppo.offline_recovery_grants(workspace_id,actor_id,id),
 FOREIGN KEY(workspace_id,activity_id) REFERENCES ppo.activities(workspace_id,id),
 CHECK((byte_hash IS NULL AND byte_count IS NULL AND storage_item_id IS NULL) OR (byte_hash ~ '^[a-f0-9]{64}$' AND byte_count BETWEEN 1 AND 4194304 AND storage_item_id IS NOT NULL))
);
CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON ppo.offline_recovery_cases FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.guard_offline_recovery() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE g ppo.offline_recovery_grants;
BEGIN
 SELECT * INTO g FROM ppo.offline_recovery_grants WHERE workspace_id=NEW.workspace_id AND actor_id=NEW.actor_id AND id=NEW.grant_id;
 IF g.id IS NULL OR NOT (NEW.envelope ?& ARRAY['operation_id','actor_id','workspace_id','appointment_id','command','authority']) OR
 NEW.envelope->>'operation_id' IS DISTINCT FROM NEW.operation_id::text OR NEW.envelope->>'actor_id' IS DISTINCT FROM NEW.actor_id::text OR
 NEW.envelope->>'workspace_id' IS DISTINCT FROM NEW.workspace_id::text OR NEW.envelope->>'appointment_id' IS DISTINCT FROM g.appointment_id::text OR
 NEW.envelope->'authority' IS DISTINCT FROM g.authority OR NEW.envelope->>'command' NOT IN ('Capture','Correct','AttachmentInitiate','AttachmentUpload','AttachmentFinalise','CompletionDraft') THEN
 RAISE EXCEPTION 'Recovery must preserve exact original actor and granted appointment authority' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_original BEFORE INSERT ON ppo.offline_recovery_cases FOR EACH ROW EXECUTE FUNCTION ppo.guard_offline_recovery();
CREATE TABLE ppo.offline_recovery_dispositions (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, case_id uuid NOT NULL, actor_id uuid NOT NULL,
 disposition text NOT NULL CHECK(disposition IN ('RetainedForReview','ClarificationRequired')),
 reason text NOT NULL CHECK(length(reason) BETWEEN 1 AND 2000), received_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 FOREIGN KEY(workspace_id,case_id) REFERENCES ppo.offline_recovery_cases(workspace_id,id),
 FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON ppo.offline_recovery_dispositions FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
