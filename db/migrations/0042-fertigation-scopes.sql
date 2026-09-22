-- ADR-0038 / ES-02 Fertigation. Additive native synthetic scopes; no manufacturer approval.
-- Flush pending cross-0026 identity events before extending the protected registry.
SET CONSTRAINTS ppo.identity_target IMMEDIATE;
DO $$ DECLARE item record; definition text; BEGIN
 FOR item IN SELECT * FROM (VALUES
 ('business_identities','ck_identities_type','object_type','FertigationScope'),
 ('audit_events','ck_audit_object_type','object_type','FertigationScope'),
 ('outbox_jobs','ck_outbox_kind','kind','FertigationScopeSaved'),
 ('reference_counters','ck_reference_type','record_type','FRT')) AS v(tab,con,col,added) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid=('ppo.'||item.tab)::regclass AND conname=item.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',item.tab,item.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR %I=%L)',item.tab,item.con,substring(definition from 8 for length(definition)-8),item.col,item.added);
 END LOOP;
 SELECT pg_get_functiondef('ppo.identity_has_typed_record()'::regprocedure) INTO definition;
 IF position('CASE NEW.object_type' in definition)=0 THEN RAISE EXCEPTION 'Inspect changed identity dispatch'; END IF;
 EXECUTE replace(definition,'CASE NEW.object_type','CASE NEW.object_type WHEN ''FertigationScope'' THEN ''fertigation_scopes''');
END $$;
SET CONSTRAINTS ppo.identity_target DEFERRED;

CREATE TABLE ppo.fertigation_scopes (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL,
 estimating_workspace_id uuid NOT NULL, option_id uuid NOT NULL,
 display_number text NOT NULL, name text NOT NULL CHECK(length(btrim(name)) BETWEEN 1 AND 200),
 owner_id uuid NOT NULL, state text NOT NULL DEFAULT 'Active' CHECK(state IN ('Active','Archived')),
 version integer NOT NULL DEFAULT 1 CHECK(version>0), current_revision_id uuid NOT NULL,
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 created_by uuid NOT NULL, updated_by uuid NOT NULL,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id), UNIQUE(workspace_id,id,option_id), UNIQUE(workspace_id,display_number),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,estimating_workspace_id) REFERENCES ppo.estimating_workspaces(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,estimating_workspace_id,option_id) REFERENCES ppo.estimating_options(workspace_id,estimating_workspace_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.fertigation_scopes FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('FertigationScope','FRT');
CREATE TRIGGER retain_fertigation BEFORE DELETE ON ppo.fertigation_scopes FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE INDEX fertigation_register ON ppo.fertigation_scopes(workspace_id,estimating_workspace_id,state,updated_at DESC,id);
CREATE FUNCTION ppo.fertigation_scope_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF (NEW.company_id,NEW.estimating_workspace_id,NEW.option_id,NEW.owner_id) IS DISTINCT FROM (OLD.company_id,OLD.estimating_workspace_id,OLD.option_id,OLD.owner_id) THEN
  RAISE EXCEPTION 'Fertigation aggregate ownership is permanent' USING ERRCODE='55000';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER check_fertigation_scope BEFORE UPDATE ON ppo.fertigation_scopes FOR EACH ROW EXECUTE FUNCTION ppo.fertigation_scope_guard();

CREATE TABLE ppo.fertigation_revisions (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,company_id uuid NOT NULL,scope_id uuid NOT NULL,option_id uuid NOT NULL,
 source_revision_id uuid NOT NULL,version integer NOT NULL CHECK(version>0),predecessor_id uuid,
 binding jsonb NOT NULL CHECK(jsonb_typeof(binding)='object'),
 proposal jsonb NOT NULL CHECK(jsonb_typeof(proposal)='object' AND proposal->>'schema_version'='1' AND octet_length(proposal::text)<=4194304),
 calculation jsonb NOT NULL CHECK(jsonb_typeof(calculation)='object' AND octet_length(calculation::text)<=8388608),
 content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'),
 calculation_input_hash text NOT NULL CHECK(calculation_input_hash ~ '^[a-f0-9]{64}$'),
 calculation_edition text NOT NULL,source_hash text NOT NULL CHECK(source_hash ~ '^[a-f0-9]{64}$'),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),created_by uuid NOT NULL,reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,scope_id,id),UNIQUE(workspace_id,company_id,scope_id,id),UNIQUE(workspace_id,scope_id,version),
 FOREIGN KEY(workspace_id,company_id,scope_id) REFERENCES ppo.fertigation_scopes(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,scope_id,option_id) REFERENCES ppo.fertigation_scopes(workspace_id,id,option_id),
 FOREIGN KEY(workspace_id,option_id,source_revision_id) REFERENCES ppo.estimation_revisions(workspace_id,option_id,id),
 FOREIGN KEY(workspace_id,scope_id,predecessor_id) REFERENCES ppo.fertigation_revisions(workspace_id,scope_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 CHECK(binding->>'revision_id'=source_revision_id::text AND binding->>'option_id'=option_id::text AND binding->>'schema_version'='1')
);
CREATE TRIGGER retain_fertigation_revision BEFORE UPDATE OR DELETE ON ppo.fertigation_revisions FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
ALTER TABLE ppo.fertigation_scopes ADD CONSTRAINT fertigation_current_revision FOREIGN KEY(workspace_id,id,current_revision_id) REFERENCES ppo.fertigation_revisions(workspace_id,scope_id,id) DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE ppo.fertigation_children (
 workspace_id uuid NOT NULL, id uuid NOT NULL, scope_id uuid NOT NULL,kind text NOT NULL,parent_id uuid,
 PRIMARY KEY(workspace_id,id),FOREIGN KEY(workspace_id,scope_id) REFERENCES ppo.fertigation_scopes(workspace_id,id)
);
CREATE TRIGGER retain_fertigation_child BEFORE UPDATE OR DELETE ON ppo.fertigation_children FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.fertigation_reference_guard(root jsonb,node jsonb) RETURNS void LANGUAGE plpgsql AS $$
DECLARE item record; target text; ref jsonb; BEGIN
 IF jsonb_typeof(node)='array' THEN
  FOR ref IN SELECT * FROM jsonb_array_elements(node) LOOP PERFORM ppo.fertigation_reference_guard(root,ref); END LOOP;
 ELSIF jsonb_typeof(node)='object' THEN
  FOR item IN SELECT * FROM jsonb_each(node) LOOP
   target:=CASE item.key WHEN 'area_id' THEN 'areas' WHEN 'crop_group_id' THEN 'crop_groups' WHEN 'master_id' THEN 'masters' WHEN 'source_id' THEN 'sources'
    WHEN 'recipe_id' THEN 'recipes' WHEN 'stock_id' THEN 'stocks' WHEN 'candidate_id' THEN 'candidates' WHEN 'controller_id' THEN 'controllers' WHEN 'bank_id' THEN 'banks'
    WHEN 'sensor_id' THEN 'sensors' WHEN 'selected_scenario_id' THEN 'scenarios' WHEN 'evidence_id' THEN 'evidence' WHEN 'flow_evidence_id' THEN 'evidence'
    WHEN 'curve_evidence_id' THEN 'evidence' WHEN 'capability_evidence_id' THEN 'evidence' WHEN 'evidence_ids' THEN 'evidence' WHEN 'valve_ids' THEN 'valves' WHEN 'group_ids' THEN 'groups' ELSE NULL END;
   IF target IS NOT NULL AND item.value<>'null'::jsonb THEN
    FOR ref IN SELECT * FROM jsonb_array_elements(CASE WHEN jsonb_typeof(item.value)='array' THEN item.value ELSE jsonb_build_array(item.value) END) LOOP
     IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(root->target) r WHERE r->'id'=ref) THEN RAISE EXCEPTION 'Fertigation relationship must target this scope and entity type' USING ERRCODE='23514'; END IF;
    END LOOP;
   END IF;
   PERFORM ppo.fertigation_reference_guard(root,item.value);
  END LOOP;
 END IF;
END $$;
CREATE FUNCTION ppo.fertigation_revision_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE r ppo.estimation_revisions; s ppo.fertigation_scopes; entry jsonb; allocation jsonb; k text; prior ppo.fertigation_children; ids uuid[]:='{}'; child_id uuid;
BEGIN
 SELECT * INTO STRICT r FROM ppo.estimation_revisions WHERE workspace_id=NEW.workspace_id AND id=NEW.source_revision_id;
 SELECT * INTO STRICT s FROM ppo.fertigation_scopes WHERE workspace_id=NEW.workspace_id AND id=NEW.scope_id;
 IF r.kind<>'Discovery' OR r.company_id<>NEW.company_id OR r.estimating_workspace_id<>s.estimating_workspace_id
  OR NEW.binding->>'estimating_workspace_id'<>s.estimating_workspace_id::text
  OR NEW.binding->>'content_hash'<>r.content_hash OR NEW.binding->>'context_hash'<>r.context_hash
  OR NEW.binding->>'scope_snapshot_id'<>r.scope_snapshot_id::text OR NEW.binding->>'answer_snapshot_id'<>r.answer_snapshot_id::text
  OR (NEW.binding->>'site_id')::uuid IS DISTINCT FROM r.site_id THEN RAISE EXCEPTION 'Exact fertigation source required' USING ERRCODE='23514'; END IF;
 FOR entry IN SELECT * FROM jsonb_array_elements(NEW.binding->'facility_ids') LOOP
  IF NOT r.input->'scope'->'facility_ids' @> jsonb_build_array(entry) THEN RAISE EXCEPTION 'Facility outside exact saved scope' USING ERRCODE='23514'; END IF;
 END LOOP;
 IF NEW.binding->>'system_id' IS NOT NULL THEN
  IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(r.input->'configuration'->'systems') sy WHERE sy->>'id'=NEW.binding->>'system_id' AND sy->>'family'='Fertigation') THEN RAISE EXCEPTION 'Exact saved Fertigation system required' USING ERRCODE='23514'; END IF;
  FOR entry IN SELECT * FROM jsonb_array_elements(NEW.binding->'area_ids') LOOP
   IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(r.input->'configuration'->'systems') sy WHERE sy->>'id'=NEW.binding->>'system_id' AND sy->'coverage'->'area_ids' @> jsonb_build_array(entry)) THEN RAISE EXCEPTION 'Area outside saved Fertigation system' USING ERRCODE='23514'; END IF;
  END LOOP;
 ELSIF jsonb_array_length(NEW.binding->'area_ids')<>0 THEN RAISE EXCEPTION 'Area coverage needs saved Fertigation system' USING ERRCODE='23514'; END IF;
 PERFORM ppo.fertigation_reference_guard(NEW.proposal,NEW.proposal);
 FOR entry IN SELECT * FROM jsonb_array_elements(NEW.proposal->'areas') LOOP
  IF entry->>'facility_id' IS NOT NULL AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(NEW.binding->'facility_observations') f WHERE f->>'id'=entry->>'facility_id' AND f->>'version'=entry->>'facility_version') THEN RAISE EXCEPTION 'Exact observed Facility version required' USING ERRCODE='23514'; END IF;
 END LOOP;
 FOR entry IN SELECT * FROM jsonb_array_elements((NEW.proposal->'valves')||(NEW.proposal->'controllers')) LOOP
  IF entry->>'asset_id' IS NOT NULL AND NOT r.input->'scope'->'equipment_ids' @> jsonb_build_array(entry->>'asset_id') THEN RAISE EXCEPTION 'Asset outside exact saved source' USING ERRCODE='23514'; END IF;
 END LOOP;
 FOR entry IN SELECT * FROM jsonb_array_elements(NEW.proposal->'evidence') LOOP
  IF left(entry->>'reference',9)='ppo-file:' AND NOT EXISTS(SELECT 1 FROM ppo.fertigation_evidence e WHERE e.workspace_id=NEW.workspace_id AND e.scope_id=NEW.scope_id AND e.id=substring(entry->>'reference' from 10)::uuid AND e.sha256=entry->>'sha256') THEN RAISE EXCEPTION 'Prepared evidence belongs to this exact scope and hash' USING ERRCODE='23514'; END IF;
 END LOOP;
 FOREACH k IN ARRAY ARRAY['areas','crop_groups','valves','masters','sources','groups','scenarios','pipes','filters','water_samples','recipes','stocks','channels','controllers','banks','sensors','strategies','candidates','evidence','actions'] LOOP
  FOR entry IN SELECT * FROM jsonb_array_elements(NEW.proposal->k) LOOP
   child_id:=(entry->>'id')::uuid;
   IF child_id=ANY(ids) THEN RAISE EXCEPTION 'Duplicate fertigation child identity' USING ERRCODE='23514'; END IF;
   ids:=array_append(ids,child_id);
   INSERT INTO ppo.fertigation_children(workspace_id,id,scope_id,kind) VALUES(NEW.workspace_id,child_id,NEW.scope_id,k) ON CONFLICT DO NOTHING;
   SELECT * INTO STRICT prior FROM ppo.fertigation_children WHERE workspace_id=NEW.workspace_id AND id=child_id;
   IF prior.scope_id<>NEW.scope_id OR prior.kind<>k OR prior.parent_id IS NOT NULL THEN RAISE EXCEPTION 'Fertigation child ownership is permanent' USING ERRCODE='23514'; END IF;
   IF k='valves' THEN
    FOR allocation IN SELECT * FROM jsonb_array_elements(entry->'allocations') LOOP
     child_id:=(allocation->>'id')::uuid;
     IF child_id=ANY(ids) THEN RAISE EXCEPTION 'Duplicate fertigation allocation identity' USING ERRCODE='23514'; END IF;
     ids:=array_append(ids,child_id);
     INSERT INTO ppo.fertigation_children(workspace_id,id,scope_id,kind,parent_id) VALUES(NEW.workspace_id,child_id,NEW.scope_id,'allocations',(entry->>'id')::uuid) ON CONFLICT DO NOTHING;
     SELECT * INTO STRICT prior FROM ppo.fertigation_children WHERE workspace_id=NEW.workspace_id AND id=child_id;
     IF prior.scope_id<>NEW.scope_id OR prior.kind<>'allocations' OR prior.parent_id IS DISTINCT FROM (entry->>'id')::uuid THEN RAISE EXCEPTION 'Allocation ownership is permanent' USING ERRCODE='23514'; END IF;
    END LOOP;
   END IF;
  END LOOP;
 END LOOP;
 RETURN NEW;
END $$;
CREATE TRIGGER check_fertigation_revision BEFORE INSERT ON ppo.fertigation_revisions FOR EACH ROW EXECUTE FUNCTION ppo.fertigation_revision_guard();

CREATE TABLE ppo.fertigation_reviews (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,scope_id uuid NOT NULL,revision_id uuid NOT NULL,
 content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'),basis_hash text NOT NULL CHECK(basis_hash ~ '^[a-f0-9]{64}$'),
 disposition text NOT NULL CHECK(disposition='Reviewed; unresolved'),note text NOT NULL CHECK(length(btrim(note)) BETWEEN 1 AND 2000),
 created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 FOREIGN KEY(workspace_id,scope_id,revision_id) REFERENCES ppo.fertigation_revisions(workspace_id,scope_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.fertigation_handovers (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,company_id uuid NOT NULL,scope_id uuid NOT NULL,revision_id uuid NOT NULL,
 estimating_workspace_id uuid NOT NULL,option_id uuid NOT NULL,receiving_revision_id uuid,
 snapshot jsonb NOT NULL CHECK(jsonb_typeof(snapshot)='object'),content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'),
 created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 FOREIGN KEY(workspace_id,company_id,scope_id,revision_id) REFERENCES ppo.fertigation_revisions(workspace_id,company_id,scope_id,id),
 FOREIGN KEY(workspace_id,estimating_workspace_id,option_id) REFERENCES ppo.estimating_options(workspace_id,estimating_workspace_id,id),
 FOREIGN KEY(workspace_id,option_id,receiving_revision_id) REFERENCES ppo.estimation_revisions(workspace_id,option_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.fertigation_outputs (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,company_id uuid NOT NULL,scope_id uuid NOT NULL,revision_id uuid NOT NULL,
 audience text NOT NULL CHECK(audience IN ('internal','customer')),template_id text NOT NULL,
 source_hash text NOT NULL CHECK(source_hash ~ '^[a-f0-9]{64}$'),content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'),
 mime_type text NOT NULL,document_key jsonb NOT NULL CHECK(jsonb_typeof(document_key)='object'),
 created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 FOREIGN KEY(workspace_id,company_id,scope_id,revision_id) REFERENCES ppo.fertigation_revisions(workspace_id,company_id,scope_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.fertigation_evidence (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,company_id uuid NOT NULL,scope_id uuid NOT NULL,revision_id uuid NOT NULL,
 label text NOT NULL,filename text NOT NULL,mime_type text NOT NULL,byte_length integer NOT NULL CHECK(byte_length BETWEEN 1 AND 5242880),
 sha256 text NOT NULL CHECK(sha256 ~ '^[a-f0-9]{64}$'),document_key jsonb NOT NULL CHECK(jsonb_typeof(document_key)='object'),
 source_revision text NOT NULL,attribution text NOT NULL,applicability text NOT NULL,
 created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 FOREIGN KEY(workspace_id,company_id,scope_id,revision_id) REFERENCES ppo.fertigation_revisions(workspace_id,company_id,scope_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER retain_fertigation_review BEFORE UPDATE OR DELETE ON ppo.fertigation_reviews FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TRIGGER retain_fertigation_handover BEFORE UPDATE OR DELETE ON ppo.fertigation_handovers FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE UNIQUE INDEX fertigation_handover_once ON ppo.fertigation_handovers(workspace_id,(snapshot->>'prepared_id')) WHERE receiving_revision_id IS NOT NULL;
CREATE TRIGGER retain_fertigation_output BEFORE UPDATE OR DELETE ON ppo.fertigation_outputs FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TRIGGER retain_fertigation_evidence BEFORE UPDATE OR DELETE ON ppo.fertigation_evidence FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.fertigation_copies (
 workspace_id uuid NOT NULL,scope_id uuid NOT NULL,revision_id uuid NOT NULL,source_scope_id uuid NOT NULL,source_revision_id uuid NOT NULL,
 identity_map jsonb NOT NULL CHECK(jsonb_typeof(identity_map)='object'),content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'),
 PRIMARY KEY(workspace_id,scope_id),
 FOREIGN KEY(workspace_id,scope_id,revision_id) REFERENCES ppo.fertigation_revisions(workspace_id,scope_id,id),
 FOREIGN KEY(workspace_id,source_scope_id,source_revision_id) REFERENCES ppo.fertigation_revisions(workspace_id,scope_id,id),
 CHECK(scope_id<>source_scope_id)
);
CREATE TRIGGER retain_fertigation_copy BEFORE UPDATE OR DELETE ON ppo.fertigation_copies FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.fertigation_operation_closures (
 workspace_id uuid NOT NULL,actor_id uuid NOT NULL,operation_id uuid NOT NULL,scope_id uuid NOT NULL,
 resolution_operation_id uuid NOT NULL,command text NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(workspace_id,actor_id,operation_id),FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER retain_fertigation_closure BEFORE UPDATE OR DELETE ON ppo.fertigation_operation_closures FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.fertigation_imports (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,scope_id uuid NOT NULL,revision_id uuid NOT NULL,
 source_hash text NOT NULL CHECK(source_hash ~ '^[a-f0-9]{64}$'),source_schema text NOT NULL,
 preview_hash text NOT NULL CHECK(preview_hash ~ '^[a-f0-9]{64}$'),
 provenance jsonb NOT NULL CHECK(jsonb_typeof(provenance)='object'),identity_map jsonb NOT NULL CHECK(jsonb_typeof(identity_map)='object'),
 created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 FOREIGN KEY(workspace_id,scope_id,revision_id) REFERENCES ppo.fertigation_revisions(workspace_id,scope_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER retain_fertigation_import BEFORE UPDATE OR DELETE ON ppo.fertigation_imports FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
