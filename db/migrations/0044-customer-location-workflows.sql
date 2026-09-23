-- ADR-0042. Canonical CS children, retained evidence and exact review bases.
-- 0043 belongs to the concurrent SH contribution; never substitute its SQL.
SET CONSTRAINTS ppo.identity_target IMMEDIATE;
DO $$ DECLARE item record; definition text; BEGIN
 FOR item IN SELECT * FROM (VALUES ('business_identities','ck_identities_type'),('audit_events','ck_audit_object_type')) v(tab,con) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid=('ppo.'||item.tab)::regclass AND conname=item.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',item.tab,item.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR object_type IN (''SiteReadiness'',''SiteSurvey'',''AccountPlan''))',item.tab,item.con,substring(definition from 8 for length(definition)-8));
 END LOOP;
 SELECT pg_get_functiondef('ppo.identity_has_typed_record()'::regprocedure) INTO definition;
 IF position('CASE NEW.object_type' in definition)=0 THEN RAISE EXCEPTION 'Inspect changed identity dispatch'; END IF;
 EXECUTE replace(definition,'CASE NEW.object_type','CASE NEW.object_type WHEN ''SiteReadiness'' THEN ''site_readiness'' WHEN ''SiteSurvey'' THEN ''site_surveys'' WHEN ''AccountPlan'' THEN ''customer_plans''');
END $$;
SET CONSTRAINTS ppo.identity_target DEFERRED;

-- Identical retention/identity mechanics; three closed, typed domain tables.
DO $$ DECLARE spec record; BEGIN
 FOR spec IN SELECT * FROM (VALUES ('site_readiness','SiteReadiness',false),('site_surveys','SiteSurvey',false),('customer_plans','AccountPlan',true)) v(tab,typ,is_plan) LOOP
  EXECUTE format('CREATE TABLE ppo.%I (
    id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL,
    site_id uuid, organisation_id uuid, name text NOT NULL CHECK(length(btrim(name)) BETWEEN 1 AND 200),
    owner_id uuid NOT NULL, version integer NOT NULL DEFAULT 1 CHECK(version>0), revision integer NOT NULL DEFAULT 1 CHECK(revision>0),
    state text NOT NULL DEFAULT ''Draft'' CHECK(state IN (''Draft'',''Submitted'',''Returned'',''Reviewed'')),
    content jsonb NOT NULL CHECK(jsonb_typeof(content)=''object'' AND content->>''schema_version''=''1'' AND octet_length(content::text)<=262144),
    synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),created_by uuid NOT NULL,updated_by uuid NOT NULL,
    UNIQUE(workspace_id,id),UNIQUE(workspace_id,company_id,id),
    FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
    FOREIGN KEY(workspace_id,company_id,site_id) REFERENCES ppo.sites(workspace_id,company_id,id),
    FOREIGN KEY(workspace_id,company_id,organisation_id) REFERENCES ppo.organisations(workspace_id,company_id,id),
    FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),
    FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
    FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id),
    CHECK(%s))',spec.tab,CASE WHEN spec.is_plan THEN 'organisation_id IS NOT NULL AND site_id IS NULL' ELSE 'site_id IS NOT NULL AND organisation_id IS NULL' END);
  EXECUTE format('CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.%I FOR EACH ROW EXECUTE FUNCTION ppo.register_identity(%L,'''')',spec.tab,spec.typ);
  EXECUTE format('CREATE TRIGGER retain_record BEFORE DELETE ON ppo.%I FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence()',spec.tab);
  EXECUTE format('CREATE INDEX ON ppo.%I(workspace_id,company_id,site_id,organisation_id)',spec.tab);
 END LOOP;
END $$;
CREATE UNIQUE INDEX one_readiness_per_site ON ppo.site_readiness(workspace_id,site_id);
CREATE UNIQUE INDEX one_development_plan_per_customer ON ppo.customer_plans(workspace_id,organisation_id);

CREATE FUNCTION ppo.cs_record_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF (NEW.id,NEW.workspace_id,NEW.company_id,NEW.site_id,NEW.organisation_id,NEW.created_at,NEW.created_by)
   IS DISTINCT FROM (OLD.id,OLD.workspace_id,OLD.company_id,OLD.site_id,OLD.organisation_id,OLD.created_at,OLD.created_by) THEN
  RAISE EXCEPTION 'Customer workflow scope is permanent' USING ERRCODE='55000';
 END IF;
 IF NEW.version<>OLD.version+1 OR NEW.revision NOT IN (OLD.revision,OLD.revision+1) THEN
  RAISE EXCEPTION 'Customer workflow versions must advance explicitly' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER protect_scope BEFORE UPDATE ON ppo.site_readiness FOR EACH ROW EXECUTE FUNCTION ppo.cs_record_guard();
CREATE TRIGGER protect_scope BEFORE UPDATE ON ppo.site_surveys FOR EACH ROW EXECUTE FUNCTION ppo.cs_record_guard();
CREATE TRIGGER protect_scope BEFORE UPDATE ON ppo.customer_plans FOR EACH ROW EXECUTE FUNCTION ppo.cs_record_guard();

CREATE TABLE ppo.cs_record_revisions (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,record_id uuid NOT NULL,version integer NOT NULL CHECK(version>0),revision integer NOT NULL CHECK(revision>0),
 content jsonb NOT NULL,content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'),state text NOT NULL,
 recorded_by uuid NOT NULL,recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),reason text NOT NULL,
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,record_id,version),
 FOREIGN KEY(workspace_id,record_id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,recorded_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.cs_snapshots (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,record_id uuid NOT NULL,record_version integer NOT NULL,revision integer NOT NULL,
 kind text NOT NULL CHECK(kind IN ('Preparation','Submission','PlanReview')),basis jsonb NOT NULL,
 content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'),recorded_by uuid NOT NULL,recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,record_id,id),
 FOREIGN KEY(workspace_id,record_id,record_version) REFERENCES ppo.cs_record_revisions(workspace_id,record_id,version),
 FOREIGN KEY(workspace_id,recorded_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.cs_record_events (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,record_id uuid NOT NULL,snapshot_id uuid,
 kind text NOT NULL CHECK(kind IN ('EvidenceReviewed','Acknowledged','Returned','Reviewed','Handover','PlanReviewed')),
 details jsonb NOT NULL,recorded_by uuid NOT NULL,recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id),
 FOREIGN KEY(workspace_id,record_id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,record_id,snapshot_id) REFERENCES ppo.cs_snapshots(workspace_id,record_id,id),
 FOREIGN KEY(workspace_id,recorded_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.cs_survey_photos (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,survey_id uuid NOT NULL,facility_id uuid,asset_id uuid,
 observer text NOT NULL,captured_on date NOT NULL CHECK(isfinite(captured_on)),method_source text NOT NULL,
 content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'),byte_count integer NOT NULL CHECK(byte_count BETWEEN 1 AND 4194304),
 storage_key jsonb NOT NULL,recorded_by uuid NOT NULL,recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,survey_id,id),
 FOREIGN KEY(workspace_id,survey_id) REFERENCES ppo.site_surveys(workspace_id,id),
 FOREIGN KEY(workspace_id,facility_id) REFERENCES ppo.facilities(workspace_id,id),
 FOREIGN KEY(workspace_id,asset_id) REFERENCES ppo.assets(workspace_id,id),
 FOREIGN KEY(workspace_id,recorded_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.cs_photo_captions (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,survey_id uuid NOT NULL,photo_id uuid NOT NULL,predecessor_id uuid,
 caption text NOT NULL CHECK(length(btrim(caption)) BETWEEN 1 AND 2000),recorded_by uuid NOT NULL,recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,photo_id,id),UNIQUE(workspace_id,photo_id,predecessor_id),
 FOREIGN KEY(workspace_id,survey_id,photo_id) REFERENCES ppo.cs_survey_photos(workspace_id,survey_id,id),
 FOREIGN KEY(workspace_id,photo_id,predecessor_id) REFERENCES ppo.cs_photo_captions(workspace_id,photo_id,id),
 FOREIGN KEY(workspace_id,recorded_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE UNIQUE INDEX one_original_caption ON ppo.cs_photo_captions(workspace_id,photo_id) WHERE predecessor_id IS NULL;
DO $$ DECLARE tab text; BEGIN
 FOREACH tab IN ARRAY ARRAY['cs_record_revisions','cs_snapshots','cs_record_events','cs_survey_photos','cs_photo_captions'] LOOP
  EXECUTE format('CREATE TRIGGER retain_evidence BEFORE UPDATE OR DELETE ON ppo.%I FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence()',tab);
 END LOOP;
END $$;
