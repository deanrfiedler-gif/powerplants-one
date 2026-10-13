-- ES-02/ES-03: durable design drafts and explicit immutable version / seal evidence.
-- No users, grants, catalogue data or business transactions.
SET CONSTRAINTS ppo.identity_target IMMEDIATE;
DO $$ DECLARE spec record; definition text; BEGIN
 FOR spec IN SELECT * FROM (VALUES
  ('business_identities','ck_identities_type','object_type'),
  ('audit_events','ck_audit_object_type','object_type')
 ) v(tab,con,col) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid=('ppo.'||spec.tab)::regclass AND conname=spec.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',spec.tab,spec.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR %I = ''CpqDraft'')',spec.tab,spec.con,substring(definition from 8 for length(definition)-8),spec.col);
 END LOOP;
 SELECT pg_get_functiondef('ppo.identity_has_typed_record()'::regprocedure) INTO definition;
 IF position('CASE NEW.object_type' in definition)=0 THEN RAISE EXCEPTION 'Inspect changed identity dispatch'; END IF;
 EXECUTE replace(definition,'CASE NEW.object_type','CASE NEW.object_type WHEN ''CpqDraft'' THEN ''cpq_drafts''');
END $$;
SET CONSTRAINTS ppo.identity_target DEFERRED;
ALTER TABLE ppo.cpq_releases DROP CONSTRAINT cpq_releases_state_check;
ALTER TABLE ppo.cpq_releases ADD CONSTRAINT cpq_releases_state_check CHECK(state IN ('Draft','Reviewed','Rejected','Sealed','Published'));

CREATE TABLE ppo.cpq_drafts (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, display_number text,
 kind text NOT NULL CHECK(kind IN ('Rules','Configuration')),
 release_id uuid, estimating_workspace_id uuid, option_id uuid, discovery_revision_id uuid,
 base_revision_id uuid, base_run_id uuid, binding_hash text CHECK(binding_hash~'^[a-f0-9]{64}$'),
 label text NOT NULL, content jsonb NOT NULL CHECK(jsonb_typeof(content)='object' AND octet_length(content::text)<=100000),
 content_hash text NOT NULL CHECK(content_hash~'^[a-f0-9]{64}$'),
 version integer NOT NULL CHECK(version>0), state text NOT NULL DEFAULT 'Working' CHECK(state='Working'),
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 updated_by uuid NOT NULL, updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,release_id) REFERENCES ppo.cpq_releases(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,base_revision_id) REFERENCES ppo.cpq_revisions(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,estimating_workspace_id) REFERENCES ppo.estimating_workspaces(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,estimating_workspace_id,option_id) REFERENCES ppo.estimating_options(workspace_id,estimating_workspace_id,id),
 FOREIGN KEY(workspace_id,option_id,discovery_revision_id) REFERENCES ppo.estimation_revisions(workspace_id,option_id,id),
 FOREIGN KEY(workspace_id,option_id,base_run_id) REFERENCES ppo.cpq_runs(workspace_id,option_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id),
 CHECK((kind='Rules' AND estimating_workspace_id IS NULL AND option_id IS NULL AND discovery_revision_id IS NULL AND base_run_id IS NULL AND binding_hash IS NULL)
   OR (kind='Configuration' AND release_id IS NULL AND estimating_workspace_id IS NOT NULL AND option_id IS NOT NULL AND discovery_revision_id IS NOT NULL AND base_revision_id IS NOT NULL AND binding_hash IS NOT NULL))
);
CREATE TRIGGER cpq_draft_identity BEFORE INSERT OR UPDATE ON ppo.cpq_drafts FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('CpqDraft','');
CREATE TRIGGER cpq_draft_retained BEFORE DELETE ON ppo.cpq_drafts FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.cpq_draft_history (
 workspace_id uuid NOT NULL, draft_id uuid NOT NULL, version integer NOT NULL,
 snapshot jsonb NOT NULL, reason text NOT NULL, created_by uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(workspace_id,draft_id,version),
 FOREIGN KEY(workspace_id,draft_id) REFERENCES ppo.cpq_drafts(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.cpq_rule_versions (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, release_id uuid NOT NULL,
 rule_key text NOT NULL, version integer NOT NULL CHECK(version>0),
 content jsonb NOT NULL, content_hash text NOT NULL CHECK(content_hash~'^[a-f0-9]{64}$'),
 created_by uuid NOT NULL, reason text NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,release_id,rule_key,version),
 FOREIGN KEY(workspace_id,release_id) REFERENCES ppo.cpq_releases(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.cpq_release_members (
 workspace_id uuid NOT NULL, revision_id uuid NOT NULL, rule_key text NOT NULL, rule_version_id uuid NOT NULL,
 PRIMARY KEY(workspace_id,revision_id,rule_key),
 FOREIGN KEY(workspace_id,revision_id) REFERENCES ppo.cpq_revisions(workspace_id,id),
 FOREIGN KEY(workspace_id,rule_version_id) REFERENCES ppo.cpq_rule_versions(workspace_id,id)
);
CREATE TABLE ppo.cpq_seals (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, revision_id uuid NOT NULL, review_id uuid NOT NULL,
 content_hash text NOT NULL, created_by uuid NOT NULL, reason text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,revision_id),
 FOREIGN KEY(workspace_id,revision_id) REFERENCES ppo.cpq_revisions(workspace_id,id),
 FOREIGN KEY(workspace_id,review_id) REFERENCES ppo.cpq_reviews(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER cpq_seal_integrity BEFORE INSERT ON ppo.cpq_seals FOR EACH ROW EXECUTE FUNCTION ppo.check_cpq_governance();
CREATE FUNCTION ppo.check_cpq_seal_hash() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM ppo.cpq_revisions WHERE workspace_id=NEW.workspace_id AND id=NEW.revision_id AND content_hash=NEW.content_hash)
 THEN RAISE EXCEPTION 'Seal requires the exact CPQ content hash' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER cpq_seal_hash BEFORE INSERT ON ppo.cpq_seals FOR EACH ROW EXECUTE FUNCTION ppo.check_cpq_seal_hash();
CREATE FUNCTION ppo.check_cpq_member() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM ppo.cpq_revisions v JOIN ppo.cpq_rule_versions r ON r.workspace_id=v.workspace_id AND r.release_id=v.release_id
 WHERE v.workspace_id=NEW.workspace_id AND v.id=NEW.revision_id AND r.id=NEW.rule_version_id AND r.rule_key=NEW.rule_key
 AND EXISTS(SELECT 1 FROM jsonb_array_elements(v.definition->'rules') rule WHERE rule=r.content AND rule->>'key'=NEW.rule_key))
 THEN RAISE EXCEPTION 'Release member must match its exact immutable rule version' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER cpq_member_integrity BEFORE INSERT ON ppo.cpq_release_members FOR EACH ROW EXECUTE FUNCTION ppo.check_cpq_member();
CREATE FUNCTION ppo.check_cpq_design_activation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM ppo.cpq_revisions WHERE workspace_id=NEW.workspace_id AND id=NEW.revision_id AND definition->>'schema_version'='3')
 AND NOT EXISTS(SELECT 1 FROM ppo.cpq_seals WHERE workspace_id=NEW.workspace_id AND revision_id=NEW.revision_id AND review_id=NEW.review_id)
 THEN RAISE EXCEPTION 'Seal the exact CPQ design revision before activation' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER cpq_design_activation BEFORE INSERT ON ppo.cpq_activations FOR EACH ROW EXECUTE FUNCTION ppo.check_cpq_design_activation();
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['cpq_draft_history','cpq_rule_versions','cpq_release_members','cpq_seals'] LOOP
  EXECUTE format('CREATE TRIGGER retained BEFORE UPDATE OR DELETE ON ppo.%I FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence()',t);
 END LOOP;
END $$;
CREATE INDEX cpq_drafts_company ON ppo.cpq_drafts(workspace_id,company_id,kind,updated_at DESC,id);
