-- Authorised scope removal/restoration is an immutable decision; the original ledger unit remains.
CREATE TABLE ppo.acceptance_unit_dispositions (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, project_id uuid NOT NULL, unit_id uuid NOT NULL,
 required boolean NOT NULL, source_reference text NOT NULL CHECK(length(btrim(source_reference))>0),
 reason text NOT NULL CHECK(length(btrim(reason))>0), actor_id uuid NOT NULL, operation_id uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), UNIQUE(workspace_id,actor_id,operation_id),
 FOREIGN KEY(workspace_id,project_id,unit_id) REFERENCES ppo.acceptance_units(workspace_id,project_id,id),
 FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER acceptance_unit_disposition_retained BEFORE UPDATE OR DELETE ON ppo.acceptance_unit_dispositions FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE INDEX acceptance_unit_disposition_current ON ppo.acceptance_unit_dispositions(workspace_id,unit_id,created_at DESC,id DESC);
