-- Native CCE / ES-02 and ES-03. No grants, users or operational catalogue rows.
SET CONSTRAINTS ppo.identity_target IMMEDIATE;
DO $$ DECLARE spec record; definition text; BEGIN
 FOR spec IN SELECT * FROM (VALUES
  ('business_identities','ck_identities_type','object_type','CpqRelease,CpqRun'),
  ('audit_events','ck_audit_object_type','object_type','CpqRelease,CpqRun'),
  ('outbox_jobs','ck_outbox_kind','kind','CpqChanged'),
  ('permission_grants','ck_grants_capability','capability','cpq.read,cpq.author,cpq.review,cpq.publish,cpq.calculate')
 ) v(tab,con,col,added) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid=('ppo.'||spec.tab)::regclass AND conname=spec.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',spec.tab,spec.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR %I = ANY(%L::text[]))',spec.tab,spec.con,substring(definition from 8 for length(definition)-8),spec.col,string_to_array(spec.added,','));
 END LOOP;
 SELECT pg_get_functiondef('ppo.identity_has_typed_record()'::regprocedure) INTO definition;
 IF position('CASE NEW.object_type' in definition)=0 THEN RAISE EXCEPTION 'Inspect changed identity dispatch'; END IF;
 EXECUTE replace(definition,'CASE NEW.object_type','CASE NEW.object_type WHEN ''CpqRelease'' THEN ''cpq_releases'' WHEN ''CpqRun'' THEN ''cpq_runs''');
END $$;
SET CONSTRAINTS ppo.identity_target DEFERRED;
ALTER TABLE ppo.permission_grants ADD CONSTRAINT cpq_company_duties CHECK(capability NOT LIKE 'cpq.%' OR scope_type IN ('Company','Workspace'));

CREATE TABLE ppo.cpq_releases (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL,
 display_number text, label text NOT NULL,
 version integer NOT NULL CHECK(version>0), current_revision_id uuid NOT NULL,
 state text NOT NULL CHECK(state IN ('Draft','Reviewed','Rejected','Published')),
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 updated_by uuid NOT NULL, updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER cpq_release_identity BEFORE INSERT OR UPDATE ON ppo.cpq_releases FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('CpqRelease','');
CREATE TRIGGER cpq_release_retained BEFORE DELETE ON ppo.cpq_releases FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.cpq_revisions (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, release_id uuid NOT NULL,
 version integer NOT NULL CHECK(version>0), predecessor_id uuid,
 definition jsonb NOT NULL CHECK(jsonb_typeof(definition)='object' AND octet_length(definition::text)<=100000),
 content_hash text NOT NULL CHECK(content_hash~'^[a-f0-9]{64}$'),
 reason text NOT NULL, created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id), UNIQUE(workspace_id,release_id,id), UNIQUE(workspace_id,release_id,version),
 FOREIGN KEY(workspace_id,company_id,release_id) REFERENCES ppo.cpq_releases(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,release_id,predecessor_id) REFERENCES ppo.cpq_revisions(workspace_id,release_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
ALTER TABLE ppo.cpq_releases ADD FOREIGN KEY(workspace_id,id,current_revision_id) REFERENCES ppo.cpq_revisions(workspace_id,release_id,id) DEFERRABLE INITIALLY DEFERRED;
CREATE TABLE ppo.cpq_reviews (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, revision_id uuid NOT NULL, reviewer_id uuid NOT NULL,
 outcome text NOT NULL CHECK(outcome IN ('Approved','Rejected')), content_hash text NOT NULL,
 fixture_results jsonb NOT NULL CHECK(jsonb_typeof(fixture_results)='array'), reason text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), UNIQUE(workspace_id,id), UNIQUE(workspace_id,revision_id),
 FOREIGN KEY(workspace_id,revision_id) REFERENCES ppo.cpq_revisions(workspace_id,id),
 FOREIGN KEY(workspace_id,reviewer_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.cpq_activations (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, revision_id uuid NOT NULL,
 review_id uuid NOT NULL, version integer NOT NULL CHECK(version>0), created_by uuid NOT NULL,
 reason text NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id), UNIQUE(workspace_id,company_id,version),
 FOREIGN KEY(workspace_id,company_id,revision_id) REFERENCES ppo.cpq_revisions(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,review_id) REFERENCES ppo.cpq_reviews(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.cpq_heads (
 workspace_id uuid NOT NULL,company_id uuid NOT NULL,activation_id uuid NOT NULL,
 PRIMARY KEY(workspace_id,company_id),
 FOREIGN KEY(workspace_id,company_id,activation_id) REFERENCES ppo.cpq_activations(workspace_id,company_id,id)
);
CREATE TABLE ppo.cpq_runs (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,company_id uuid NOT NULL,display_number text,
 estimating_workspace_id uuid NOT NULL,option_id uuid NOT NULL,discovery_revision_id uuid NOT NULL,
 release_revision_id uuid NOT NULL,activation_id uuid NOT NULL,parent_id uuid,
 binding jsonb NOT NULL,input jsonb NOT NULL,result jsonb NOT NULL,
 content_hash text NOT NULL CHECK(content_hash~'^[a-f0-9]{64}$'),
 state text NOT NULL CHECK(state IN ('Ready','Blocked')),version integer NOT NULL DEFAULT 1 CHECK(version=1),
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),reason text NOT NULL,
 created_by uuid NOT NULL,updated_by uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,company_id,id),UNIQUE(workspace_id,option_id,id),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,estimating_workspace_id) REFERENCES ppo.estimating_workspaces(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,estimating_workspace_id,option_id) REFERENCES ppo.estimating_options(workspace_id,estimating_workspace_id,id),
 FOREIGN KEY(workspace_id,option_id,discovery_revision_id) REFERENCES ppo.estimation_revisions(workspace_id,option_id,id),
 FOREIGN KEY(workspace_id,company_id,release_revision_id) REFERENCES ppo.cpq_revisions(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,activation_id) REFERENCES ppo.cpq_activations(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,option_id,parent_id) REFERENCES ppo.cpq_runs(workspace_id,option_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER cpq_run_identity BEFORE INSERT ON ppo.cpq_runs FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('CpqRun','');
CREATE TABLE ppo.cpq_adoptions (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,company_id uuid NOT NULL,run_id uuid NOT NULL,
 estimate_id uuid NOT NULL,estimate_version_id uuid NOT NULL,result_hash text NOT NULL,
 lines jsonb NOT NULL,created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,estimate_version_id),
 FOREIGN KEY(workspace_id,company_id,run_id) REFERENCES ppo.cpq_runs(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,estimate_id) REFERENCES ppo.estimates(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,estimate_id,estimate_version_id) REFERENCES ppo.estimate_versions(workspace_id,estimate_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['cpq_revisions','cpq_reviews','cpq_activations','cpq_runs','cpq_adoptions'] LOOP
  EXECUTE format('CREATE TRIGGER retained BEFORE UPDATE OR DELETE ON ppo.%I FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence()',t);
 END LOOP;
END $$;
CREATE FUNCTION ppo.check_cpq_governance() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE r ppo.cpq_revisions; review ppo.cpq_reviews;
BEGIN
 SELECT * INTO STRICT r FROM ppo.cpq_revisions WHERE workspace_id=NEW.workspace_id AND id=NEW.revision_id;
 IF TG_TABLE_NAME='cpq_reviews' THEN
  IF NEW.reviewer_id=r.created_by OR NEW.content_hash<>r.content_hash THEN RAISE EXCEPTION 'Independent review of exact CPQ content required' USING ERRCODE='23514'; END IF;
  IF NEW.outcome='Approved' AND (jsonb_array_length(NEW.fixture_results)=0 OR EXISTS(SELECT 1 FROM jsonb_array_elements(NEW.fixture_results) f WHERE f->>'passed' IS DISTINCT FROM 'true')) THEN RAISE EXCEPTION 'Passing CPQ fixtures required' USING ERRCODE='23514'; END IF;
 ELSE
  SELECT * INTO STRICT review FROM ppo.cpq_reviews WHERE workspace_id=NEW.workspace_id AND id=NEW.review_id;
  IF review.revision_id<>r.id OR review.outcome<>'Approved' OR review.reviewer_id=NEW.created_by OR r.created_by=NEW.created_by THEN RAISE EXCEPTION 'Independent publication of exact reviewed release required' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER cpq_review_integrity BEFORE INSERT ON ppo.cpq_reviews FOR EACH ROW EXECUTE FUNCTION ppo.check_cpq_governance();
CREATE TRIGGER cpq_activation_integrity BEFORE INSERT ON ppo.cpq_activations FOR EACH ROW EXECUTE FUNCTION ppo.check_cpq_governance();
CREATE INDEX cpq_runs_history ON ppo.cpq_runs(workspace_id,estimating_workspace_id,created_at DESC,id);
