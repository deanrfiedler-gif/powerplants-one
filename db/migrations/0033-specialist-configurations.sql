-- ADR-0034 / ES-08. Additive synthetic review and receiving; no operational approvals.
-- The pending identity events from 0026 must settle before widening identity types.
SET CONSTRAINTS ppo.identity_target IMMEDIATE;
DO $$ DECLARE item record; definition text; BEGIN
 FOR item IN SELECT * FROM (VALUES
 ('business_identities','ck_identities_type','object_type','SpecialistConfiguration'),
 ('audit_events','ck_audit_object_type','object_type','SpecialistConfiguration'),
 ('outbox_jobs','ck_outbox_kind','kind','SpecialistConfigurationSaved')) AS v(tab,con,col,added) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid=('ppo.'||item.tab)::regclass AND conname=item.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',item.tab,item.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR %I = ANY(%L::text[]))',item.tab,item.con,substring(definition from 8 for length(definition)-8),item.col,string_to_array(item.added,','));
 END LOOP;
 SELECT pg_get_functiondef('ppo.identity_has_typed_record()'::regprocedure) INTO definition;
 IF position('CASE NEW.object_type' in definition)=0 THEN RAISE EXCEPTION 'Inspect changed identity dispatch'; END IF;
 EXECUTE replace(definition,'CASE NEW.object_type','CASE NEW.object_type WHEN ''SpecialistConfiguration'' THEN ''specialist_configurations''');
END $$;
SET CONSTRAINTS ppo.identity_target DEFERRED;

CREATE TABLE ppo.specialist_definitions (
 id uuid PRIMARY KEY, bundle_hash text NOT NULL CHECK(bundle_hash ~ '^[a-f0-9]{64}$'),
 manifest jsonb NOT NULL CHECK(jsonb_typeof(manifest)='object'),
 state text NOT NULL CHECK(state='Review required'), UNIQUE(id,bundle_hash)
);
CREATE TRIGGER retain_definition BEFORE UPDATE OR DELETE ON ppo.specialist_definitions FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.specialist_policies (
 id text PRIMARY KEY, content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'),
 manifest jsonb NOT NULL CHECK(jsonb_typeof(manifest)='object'),
 definition_id uuid NOT NULL, definition_hash text NOT NULL,
 FOREIGN KEY(definition_id,definition_hash) REFERENCES ppo.specialist_definitions(id,bundle_hash)
);
CREATE TRIGGER retain_policy BEFORE UPDATE OR DELETE ON ppo.specialist_policies FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

CREATE TABLE ppo.specialist_configurations (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,company_id uuid NOT NULL,
 estimating_workspace_id uuid NOT NULL,option_id uuid NOT NULL,
 display_number text NOT NULL,name text NOT NULL CHECK(length(btrim(name)) BETWEEN 1 AND 200),
 family text NOT NULL DEFAULT 'ScreenSystems' CHECK(family='ScreenSystems'),owner_id uuid NOT NULL,
 state text NOT NULL DEFAULT 'Active' CHECK(state IN ('Active','Archived')),version integer NOT NULL DEFAULT 1 CHECK(version>0),
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 current_draft_id uuid NOT NULL,current_run_id uuid,current_resolved_id uuid,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),updated_by uuid NOT NULL,
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,company_id,id),UNIQUE(workspace_id,id,option_id),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,estimating_workspace_id) REFERENCES ppo.estimating_workspaces(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,estimating_workspace_id,option_id) REFERENCES ppo.estimating_options(workspace_id,estimating_workspace_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.specialist_configurations FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('SpecialistConfiguration','');
CREATE TRIGGER retain_configuration BEFORE DELETE ON ppo.specialist_configurations FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE INDEX specialist_register ON ppo.specialist_configurations(workspace_id,estimating_workspace_id,state,updated_at DESC,id);

CREATE TABLE ppo.specialist_drafts (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,company_id uuid NOT NULL,configuration_id uuid NOT NULL,
 option_id uuid NOT NULL,revision_id uuid NOT NULL,version integer NOT NULL CHECK(version>0),predecessor_id uuid,
 binding jsonb NOT NULL CHECK(jsonb_typeof(binding)='object'),proposal jsonb NOT NULL CHECK(jsonb_typeof(proposal)='object' AND octet_length(proposal::text)<=262144),
 content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'),
 definition_id uuid NOT NULL,definition_hash text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),created_by uuid NOT NULL,reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,configuration_id,id),UNIQUE(workspace_id,configuration_id,version),
 FOREIGN KEY(workspace_id,company_id,configuration_id) REFERENCES ppo.specialist_configurations(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,configuration_id,option_id) REFERENCES ppo.specialist_configurations(workspace_id,id,option_id),
 FOREIGN KEY(workspace_id,option_id,revision_id) REFERENCES ppo.estimation_revisions(workspace_id,option_id,id),
 FOREIGN KEY(workspace_id,configuration_id,predecessor_id) REFERENCES ppo.specialist_drafts(workspace_id,configuration_id,id),
 FOREIGN KEY(definition_id,definition_hash) REFERENCES ppo.specialist_definitions(id,bundle_hash),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 CHECK(binding->>'revision_id'=revision_id::text AND binding->>'option_id'=option_id::text),
 CHECK(proposal->>'schema_version'='1' AND proposal->>'definition_bundle_id'=definition_id::text AND proposal->>'definition_bundle_hash'=definition_hash)
);
CREATE TRIGGER retain_draft BEFORE UPDATE OR DELETE ON ppo.specialist_drafts FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.specialist_runs (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,configuration_id uuid NOT NULL,draft_id uuid NOT NULL,
 sequence integer NOT NULL CHECK(sequence>0),snapshot jsonb NOT NULL CHECK(jsonb_typeof(snapshot)='object' AND octet_length(snapshot::text)<=2097152),
 evidence_hash text NOT NULL CHECK(evidence_hash ~ '^[a-f0-9]{64}$'),created_at timestamptz NOT NULL,created_by uuid NOT NULL,
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,configuration_id,id),UNIQUE(workspace_id,configuration_id,sequence),
 FOREIGN KEY(workspace_id,configuration_id,draft_id) REFERENCES ppo.specialist_drafts(workspace_id,configuration_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 CHECK(snapshot->>'configuration_id'=configuration_id::text AND snapshot->>'draft_id'=draft_id::text AND snapshot->>'created_by'=created_by::text)
);
CREATE TRIGGER retain_run BEFORE UPDATE OR DELETE ON ppo.specialist_runs FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.specialist_resolved_sets (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,configuration_id uuid NOT NULL,run_id uuid NOT NULL,
 snapshot jsonb NOT NULL CHECK(jsonb_typeof(snapshot)='object' AND octet_length(snapshot::text)<=2097152),
 content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'),created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,configuration_id,id),UNIQUE(workspace_id,configuration_id,run_id,id),
 FOREIGN KEY(workspace_id,configuration_id,run_id) REFERENCES ppo.specialist_runs(workspace_id,configuration_id,id),
 CHECK(snapshot->>'run_id'=run_id::text)
);
CREATE TRIGGER retain_resolved BEFORE UPDATE OR DELETE ON ppo.specialist_resolved_sets FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
ALTER TABLE ppo.specialist_configurations ADD CONSTRAINT specialist_current_draft FOREIGN KEY(workspace_id,id,current_draft_id) REFERENCES ppo.specialist_drafts(workspace_id,configuration_id,id) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE ppo.specialist_configurations ADD CONSTRAINT specialist_current_run FOREIGN KEY(workspace_id,id,current_run_id) REFERENCES ppo.specialist_runs(workspace_id,configuration_id,id) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE ppo.specialist_configurations ADD CONSTRAINT specialist_current_resolved FOREIGN KEY(workspace_id,id,current_run_id,current_resolved_id) REFERENCES ppo.specialist_resolved_sets(workspace_id,configuration_id,run_id,id) DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE ppo.estimate_specialist_lineage (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,company_id uuid NOT NULL,estimate_id uuid NOT NULL,estimate_version_id uuid NOT NULL,
 basis_revision_id uuid,predecessor_id uuid,estimate_content_hash text NOT NULL,
 snapshot jsonb NOT NULL CHECK(jsonb_typeof(snapshot)='object' AND octet_length(snapshot::text)<=2097152),content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'),
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,estimate_version_id),
 FOREIGN KEY(workspace_id,company_id,estimate_version_id) REFERENCES ppo.estimate_versions(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,estimate_id,estimate_version_id) REFERENCES ppo.estimate_versions(workspace_id,estimate_id,id),
 FOREIGN KEY(workspace_id,basis_revision_id) REFERENCES ppo.estimation_revisions(workspace_id,id),
 FOREIGN KEY(workspace_id,predecessor_id) REFERENCES ppo.estimate_specialist_lineage(workspace_id,id),
 CHECK(snapshot->>'estimate_version_id'=estimate_version_id::text AND snapshot->>'estimate_content_hash'=estimate_content_hash)
);
CREATE TRIGGER retain_lineage BEFORE UPDATE OR DELETE ON ppo.estimate_specialist_lineage FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.specialist_adoptions (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,company_id uuid NOT NULL,configuration_id uuid NOT NULL,run_id uuid NOT NULL,resolved_set_id uuid NOT NULL,
 estimate_id uuid NOT NULL,estimate_version_id uuid NOT NULL,policy_id text NOT NULL REFERENCES ppo.specialist_policies(id),
 snapshot jsonb NOT NULL CHECK(jsonb_typeof(snapshot)='object'),content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),created_by uuid NOT NULL,
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,configuration_id,estimate_version_id),
 FOREIGN KEY(workspace_id,company_id,configuration_id) REFERENCES ppo.specialist_configurations(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,configuration_id,run_id,resolved_set_id) REFERENCES ppo.specialist_resolved_sets(workspace_id,configuration_id,run_id,id),
 FOREIGN KEY(workspace_id,company_id,estimate_version_id) REFERENCES ppo.estimate_versions(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,estimate_id,estimate_version_id) REFERENCES ppo.estimate_versions(workspace_id,estimate_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.specialist_reviews (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,configuration_id uuid NOT NULL,draft_id uuid NOT NULL,finding_id text NOT NULL,
 note text NOT NULL CHECK(length(btrim(note)) BETWEEN 1 AND 1000),owner_id uuid NOT NULL,next_action text NOT NULL CHECK(length(btrim(next_action)) BETWEEN 1 AND 1000),
 disposition text NOT NULL CHECK(disposition IN ('Open','Reviewed; unresolved')),created_at timestamptz NOT NULL DEFAULT clock_timestamp(),created_by uuid NOT NULL,
 FOREIGN KEY(workspace_id,configuration_id,draft_id) REFERENCES ppo.specialist_drafts(workspace_id,configuration_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.specialist_operation_closures (
 workspace_id uuid NOT NULL,actor_id uuid NOT NULL,operation_id uuid NOT NULL,configuration_id uuid NOT NULL,
 resolution_operation_id uuid NOT NULL,command text NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(workspace_id,actor_id,operation_id),
 -- A closed, unaccepted Create may reference a configuration that never existed.
 -- Scoped command authority and the actor/operation key protect this intent.
 FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER retain_adoption BEFORE UPDATE OR DELETE ON ppo.specialist_adoptions FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TRIGGER retain_review BEFORE UPDATE OR DELETE ON ppo.specialist_reviews FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TRIGGER retain_closure BEFORE UPDATE OR DELETE ON ppo.specialist_operation_closures FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

-- Pin JSON binding to the same exact immutable source, including real structured memberships.
CREATE FUNCTION ppo.specialist_binding_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE r ppo.estimation_revisions; cfg ppo.specialist_configurations; member jsonb;
BEGIN
 SELECT * INTO STRICT r FROM ppo.estimation_revisions WHERE workspace_id=NEW.workspace_id AND id=NEW.revision_id;
 SELECT * INTO STRICT cfg FROM ppo.specialist_configurations WHERE workspace_id=NEW.workspace_id AND id=NEW.configuration_id;
 IF r.kind<>'Discovery' OR r.company_id<>NEW.company_id OR r.estimating_workspace_id<>cfg.estimating_workspace_id
  OR NEW.binding->>'estimating_workspace_id'<>cfg.estimating_workspace_id::text
  OR NEW.binding->>'content_hash'<>r.content_hash OR NEW.binding->>'context_hash'<>r.context_hash
  OR NEW.binding->>'scope_snapshot_id'<>r.scope_snapshot_id::text OR NEW.binding->>'answer_snapshot_id'<>r.answer_snapshot_id::text
  OR (NEW.binding->>'site_id')::uuid IS DISTINCT FROM r.site_id THEN RAISE EXCEPTION 'Exact specialist source required' USING ERRCODE='23514'; END IF;
 FOR member IN SELECT * FROM jsonb_array_elements(NEW.binding->'facility_ids') LOOP
  IF NOT r.input->'scope'->'facility_ids' @> jsonb_build_array(member) THEN RAISE EXCEPTION 'Facility outside saved scope' USING ERRCODE='23514'; END IF;
 END LOOP;
 IF NEW.binding->>'kind'='StructuredSystem' THEN
  IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(r.input->'configuration'->'systems') s WHERE s->>'id'=NEW.binding->>'system_id') THEN RAISE EXCEPTION 'Unknown saved system' USING ERRCODE='23514'; END IF;
  FOR member IN SELECT * FROM jsonb_array_elements(NEW.binding->'area_ids') LOOP
   IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(r.input->'configuration'->'systems') s WHERE s->>'id'=NEW.binding->>'system_id' AND s->'coverage'->'area_ids' @> jsonb_build_array(member)) THEN RAISE EXCEPTION 'Area outside saved coverage' USING ERRCODE='23514'; END IF;
  END LOOP;
 ELSIF NEW.binding->>'kind'<>'FacilityScope' OR NEW.binding->>'system_id' IS NOT NULL OR jsonb_array_length(NEW.binding->'area_ids')<>0 THEN RAISE EXCEPTION 'Explicit specialist binding required' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER check_specialist_binding BEFORE INSERT ON ppo.specialist_drafts FOR EACH ROW EXECUTE FUNCTION ppo.specialist_binding_guard();

CREATE FUNCTION ppo.specialist_lineage_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v ppo.estimate_versions; basis uuid; entry jsonb; ids text[]:='{}'; keys text[]:='{}';
BEGIN
 SELECT * INTO STRICT v FROM ppo.estimate_versions WHERE workspace_id=NEW.workspace_id AND id=NEW.estimate_version_id;
 SELECT revision_id INTO basis FROM ppo.estimate_discovery_bases WHERE workspace_id=NEW.workspace_id AND estimate_version_id=v.id;
 IF v.content_hash<>NEW.estimate_content_hash OR v.estimate_id<>NEW.estimate_id OR basis IS DISTINCT FROM NEW.basis_revision_id
  OR (NEW.snapshot->>'basis_revision_id')::uuid IS DISTINCT FROM basis THEN RAISE EXCEPTION 'Lineage exact version mismatch' USING ERRCODE='23514'; END IF;
 FOR entry IN SELECT * FROM jsonb_array_elements(NEW.snapshot->'contributions') LOOP
  IF ((entry->>'configuration_id')||':'||(entry->>'key'))=ANY(keys) THEN RAISE EXCEPTION 'Duplicate generation ownership' USING ERRCODE='23514'; END IF;
  keys:=array_append(keys,(entry->>'configuration_id')||':'||(entry->>'key'));
  IF entry->>'disposition'='Owned' AND entry->'current'<>'null'::jsonb THEN
   IF entry->>'line_id'=ANY(ids) THEN RAISE EXCEPTION 'Duplicate line ownership' USING ERRCODE='23514'; END IF;
   ids:=array_append(ids,entry->>'line_id');
  END IF;
  IF NOT EXISTS(SELECT 1 FROM ppo.specialist_resolved_sets s JOIN ppo.specialist_configurations c ON (c.workspace_id,c.id)=(s.workspace_id,s.configuration_id)
    JOIN ppo.estimates e ON e.workspace_id=c.workspace_id AND e.id=NEW.estimate_id
    WHERE s.workspace_id=NEW.workspace_id AND s.id=(entry->>'resolved_set_id')::uuid AND s.run_id=(entry->>'run_id')::uuid
    AND c.id=(entry->>'configuration_id')::uuid AND c.company_id=NEW.company_id AND c.option_id=e.option_id AND s.content_hash=entry->>'resolved_set_hash')
   THEN RAISE EXCEPTION 'Lineage source relationship mismatch' USING ERRCODE='23514'; END IF;
 END LOOP;
 RETURN NEW;
END $$;
CREATE TRIGGER check_specialist_lineage BEFORE INSERT ON ppo.estimate_specialist_lineage FOR EACH ROW EXECUTE FUNCTION ppo.specialist_lineage_guard();
