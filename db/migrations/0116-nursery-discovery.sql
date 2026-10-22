-- ADR-0060 / N1. Append-only child of the existing estimating workspace/alternative.
-- No seed, capability, identity type, product publication or CPQ change.
CREATE TABLE ppo.nursery_discovery_revisions (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL,
 estimating_workspace_id uuid NOT NULL, option_id uuid NOT NULL,
 source_revision_id uuid NOT NULL, version integer NOT NULL CHECK(version>0),
 predecessor_id uuid, source_hash text NOT NULL CHECK(source_hash ~ '^[a-f0-9]{64}$'),
 catalogue jsonb NOT NULL CHECK(jsonb_typeof(catalogue)='object'),
 proposal jsonb NOT NULL CHECK(jsonb_typeof(proposal)='object' AND proposal->>'schema_version'='1' AND octet_length(proposal::text)<=131072),
 content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,option_id,id), UNIQUE(workspace_id,option_id,version),
 FOREIGN KEY(workspace_id,company_id,estimating_workspace_id) REFERENCES ppo.estimating_workspaces(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,estimating_workspace_id,option_id) REFERENCES ppo.estimating_options(workspace_id,estimating_workspace_id,id),
 FOREIGN KEY(workspace_id,option_id,source_revision_id) REFERENCES ppo.estimation_revisions(workspace_id,option_id,id),
 FOREIGN KEY(workspace_id,option_id,predecessor_id) REFERENCES ppo.nursery_discovery_revisions(workspace_id,option_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 CHECK((version=1 AND predecessor_id IS NULL) OR (version>1 AND predecessor_id IS NOT NULL))
);
CREATE TRIGGER retain_nursery_discovery BEFORE UPDATE OR DELETE ON ppo.nursery_discovery_revisions
 FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE INDEX nursery_discovery_history ON ppo.nursery_discovery_revisions(workspace_id,estimating_workspace_id,option_id,version DESC);
