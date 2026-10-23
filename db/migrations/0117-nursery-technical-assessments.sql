-- ADR-0061 / N2: immutable child evidence; no grants, seeds or Products/CPQ mutation.
CREATE TABLE ppo.nursery_assessment_revisions (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL,
 estimating_workspace_id uuid NOT NULL, option_id uuid NOT NULL,
 nursery_revision_id uuid NOT NULL, nursery_hash text NOT NULL CHECK(nursery_hash ~ '^[a-f0-9]{64}$'),
 version integer NOT NULL CHECK(version>0), predecessor_id uuid,
 rule_edition text NOT NULL CHECK(length(rule_edition) BETWEEN 1 AND 100),
 source_snapshot jsonb NOT NULL CHECK(jsonb_typeof(source_snapshot)='object'),
 proposal jsonb NOT NULL CHECK(jsonb_typeof(proposal)='object' AND proposal->>'schema_version'='1' AND octet_length(proposal::text)<=524288),
 result jsonb NOT NULL CHECK(jsonb_typeof(result)='object'),
 outputs jsonb NOT NULL CHECK(jsonb_typeof(outputs)='object' AND octet_length(outputs::text)<=4194304),
 content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,option_id,id), UNIQUE(workspace_id,option_id,version),
 FOREIGN KEY(workspace_id,company_id,estimating_workspace_id) REFERENCES ppo.estimating_workspaces(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,estimating_workspace_id,option_id) REFERENCES ppo.estimating_options(workspace_id,estimating_workspace_id,id),
 FOREIGN KEY(workspace_id,option_id,nursery_revision_id) REFERENCES ppo.nursery_discovery_revisions(workspace_id,option_id,id),
 FOREIGN KEY(workspace_id,option_id,predecessor_id) REFERENCES ppo.nursery_assessment_revisions(workspace_id,option_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 CHECK((version=1 AND predecessor_id IS NULL) OR (version>1 AND predecessor_id IS NOT NULL))
);
CREATE TRIGGER retain_nursery_assessment BEFORE UPDATE OR DELETE ON ppo.nursery_assessment_revisions
 FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE INDEX nursery_assessment_history ON ppo.nursery_assessment_revisions(workspace_id,estimating_workspace_id,option_id,version DESC);
