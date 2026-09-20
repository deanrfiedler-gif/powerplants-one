-- Server-held command intents retain the original operation across a page/app/database restart.
-- Payloads are private to the initiating actor and current source/project authority is rechecked on recovery.
CREATE TABLE ppo.acceptance_intents (
 workspace_id uuid NOT NULL, actor_id uuid NOT NULL, operation_id uuid NOT NULL, project_id uuid NOT NULL,
 action text NOT NULL, payload_hash text NOT NULL CHECK(payload_hash ~ '^[0-9a-f]{64}$'), payload jsonb NOT NULL,
 registered_at timestamptz NOT NULL DEFAULT clock_timestamp(), acknowledged_at timestamptz, final_failure text,
 PRIMARY KEY(workspace_id,actor_id,operation_id),
 FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,project_id) REFERENCES ppo.projects(workspace_id,id)
);
CREATE FUNCTION ppo.acceptance_intent_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='DELETE' OR (to_jsonb(NEW)-ARRAY['acknowledged_at','final_failure']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['acknowledged_at','final_failure']) THEN RAISE EXCEPTION 'Retain original acceptance command identity and payload' USING ERRCODE='55000'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER acceptance_intent_guard BEFORE UPDATE OR DELETE ON ppo.acceptance_intents FOR EACH ROW EXECUTE FUNCTION ppo.acceptance_intent_guard();
CREATE INDEX acceptance_pending_intents ON ppo.acceptance_intents(workspace_id,actor_id,project_id,registered_at) WHERE acknowledged_at IS NULL AND final_failure IS NULL;
