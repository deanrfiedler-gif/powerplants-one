-- ADR-0026 / E2-D02/D03: additive discovery only. E1 source rows and bytes stay intact.
DO $$ DECLARE item record; definition text; BEGIN
 FOR item IN SELECT * FROM (VALUES
 ('business_identities','ck_identities_type','object_type','EstimatingWorkspace'),
 ('audit_events','ck_audit_object_type','object_type','EstimatingWorkspace'),
 ('outbox_jobs','ck_outbox_kind','kind','EstimatingWorkspaceCreated,EstimatingOptionBranched,EstimatingOptionSelected,EstimatingScopeSaved,EstimatingOptionArchived,EstimatingOptionReopened')) AS v(tab,con,col,added) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid=('ppo.'||item.tab)::regclass AND conname=item.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',item.tab,item.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR %I = ANY(%L::text[]))',item.tab,item.con,substring(definition from 8 for length(definition)-8),item.col,string_to_array(item.added,','));
 END LOOP;
 SELECT pg_get_functiondef('ppo.identity_has_typed_record()'::regprocedure) INTO definition;
 IF position('CASE NEW.object_type' in definition)=0 THEN RAISE EXCEPTION 'Inspect changed typed identity dispatch'; END IF;
 EXECUTE replace(definition,'CASE NEW.object_type','CASE NEW.object_type WHEN ''EstimatingWorkspace'' THEN ''estimating_workspaces''');
END $$;

CREATE TABLE ppo.estimating_workspaces (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL,
 opportunity_id uuid NOT NULL, owner_id uuid NOT NULL, selected_option_id uuid NOT NULL,
 legacy_estimate_id uuid, version integer NOT NULL DEFAULT 1 CHECK(version>0),
 state text NOT NULL DEFAULT 'Draft' CHECK(state='Draft'),
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id), UNIQUE(workspace_id,opportunity_id),
 UNIQUE(workspace_id,legacy_estimate_id),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,opportunity_id) REFERENCES ppo.opportunities(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,legacy_estimate_id) REFERENCES ppo.estimates(workspace_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.estimating_workspaces FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('EstimatingWorkspace','');
CREATE TRIGGER retain_workspace BEFORE DELETE ON ppo.estimating_workspaces FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

CREATE TABLE ppo.estimating_options (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, estimating_workspace_id uuid NOT NULL,
 ordinal integer NOT NULL CHECK(ordinal BETWEEN 1 AND 10), label text NOT NULL CHECK(length(btrim(label)) BETWEEN 1 AND 100),
 state text NOT NULL DEFAULT 'Active' CHECK(state IN ('Active','Archived')), current_revision_id uuid NOT NULL,
 predecessor_option_id uuid, version integer NOT NULL DEFAULT 1 CHECK(version>0), workspace_version integer NOT NULL CHECK(workspace_version>0),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,estimating_workspace_id,id), UNIQUE(workspace_id,company_id,id),
 UNIQUE(workspace_id,estimating_workspace_id,ordinal),
 FOREIGN KEY(workspace_id,company_id,estimating_workspace_id) REFERENCES ppo.estimating_workspaces(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,estimating_workspace_id,predecessor_option_id) REFERENCES ppo.estimating_options(workspace_id,estimating_workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id),
 CHECK((ordinal=1 AND predecessor_option_id IS NULL) OR (ordinal>1 AND predecessor_option_id IS NOT NULL))
);
CREATE TRIGGER retain_option BEFORE DELETE ON ppo.estimating_options FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

CREATE TABLE ppo.estimation_revisions (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL,
 estimating_workspace_id uuid NOT NULL, option_id uuid NOT NULL, version integer NOT NULL CHECK(version>0),
 predecessor_id uuid, copied_from_id uuid, kind text NOT NULL CHECK(kind IN ('LegacyManual','Discovery')),
 legacy_estimate_id uuid, legacy_source_created_at timestamptz,
 scope_snapshot_id uuid UNIQUE, answer_snapshot_id uuid UNIQUE, site_id uuid,
 input jsonb, observed_context jsonb, content_hash text, context_hash text,
 scope_readiness text NOT NULL CHECK(scope_readiness IN ('NotRecorded','Incomplete','Complete')),
 comparison jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(comparison)='object'),
 retained_hidden_answers jsonb NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(retained_hidden_answers)='array'),
 answer_attribution jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(answer_attribution)='object'),
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,option_id,id), UNIQUE(workspace_id,estimating_workspace_id,id),
 UNIQUE(workspace_id,option_id,version), UNIQUE(workspace_id,scope_snapshot_id),
 UNIQUE(workspace_id,company_id,site_id,scope_snapshot_id),
 FOREIGN KEY(workspace_id,company_id,estimating_workspace_id) REFERENCES ppo.estimating_workspaces(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,estimating_workspace_id,option_id) REFERENCES ppo.estimating_options(workspace_id,estimating_workspace_id,id),
 FOREIGN KEY(workspace_id,option_id,predecessor_id) REFERENCES ppo.estimation_revisions(workspace_id,option_id,id),
 FOREIGN KEY(workspace_id,estimating_workspace_id,copied_from_id) REFERENCES ppo.estimation_revisions(workspace_id,estimating_workspace_id,id),
 FOREIGN KEY(workspace_id,legacy_estimate_id) REFERENCES ppo.estimates(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id) REFERENCES ppo.sites(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 CHECK((version=1 AND predecessor_id IS NULL) OR (version>1 AND predecessor_id IS NOT NULL)),
 CHECK((kind='LegacyManual' AND version=1 AND legacy_estimate_id IS NOT NULL AND legacy_source_created_at IS NOT NULL
   AND scope_readiness='NotRecorded' AND input IS NULL AND observed_context IS NULL AND content_hash IS NULL AND context_hash IS NULL
   AND scope_snapshot_id IS NULL AND answer_snapshot_id IS NULL AND copied_from_id IS NULL)
  OR (kind='Discovery' AND legacy_estimate_id IS NULL AND legacy_source_created_at IS NULL
   AND scope_snapshot_id IS NOT NULL AND answer_snapshot_id IS NOT NULL AND scope_snapshot_id<>answer_snapshot_id
   AND scope_readiness IN ('Incomplete','Complete') AND input IS NOT NULL AND jsonb_typeof(input)='object'
   AND observed_context IS NOT NULL AND jsonb_typeof(observed_context)='object'
   AND content_hash IS NOT NULL AND content_hash ~ '^[a-f0-9]{64}$' AND context_hash IS NOT NULL AND context_hash ~ '^[a-f0-9]{64}$')),
 CHECK(kind='LegacyManual' OR ((input->'scope'->>'mode'='Site' AND site_id IS NOT NULL)
   OR (input->'scope'->>'mode' IN ('Unknown','NoSiteRequired') AND site_id IS NULL))),
 CHECK(kind='LegacyManual' OR (input->'scope'->>'mode' IS NOT NULL
   AND input->>'definition_id' IS NOT NULL AND input->>'definition_id'='SYN-E2-QUESTIONS'
   AND input->>'definition_revision' IS NOT NULL AND input->>'definition_revision'='r01'
   AND input->'scope'->'facility_ids' IS NOT NULL AND jsonb_typeof(input->'scope'->'facility_ids')='array'
   AND input->'scope'->'equipment_ids' IS NOT NULL AND jsonb_typeof(input->'scope'->'equipment_ids')='array')),
 CHECK(kind='LegacyManual' OR (input->'scope'->>'site_id')::uuid IS NOT DISTINCT FROM site_id)
);
CREATE TRIGGER retain_revision BEFORE UPDATE OR DELETE ON ppo.estimation_revisions FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
ALTER TABLE ppo.estimating_workspaces ADD CONSTRAINT fk_estimating_selected_option FOREIGN KEY(workspace_id,id,selected_option_id)
 REFERENCES ppo.estimating_options(workspace_id,estimating_workspace_id,id) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE ppo.estimating_options ADD CONSTRAINT fk_estimating_current_revision FOREIGN KEY(workspace_id,id,current_revision_id)
 REFERENCES ppo.estimation_revisions(workspace_id,option_id,id) DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE ppo.estimating_scope_facilities (
 workspace_id uuid NOT NULL, company_id uuid NOT NULL, site_id uuid NOT NULL, scope_snapshot_id uuid NOT NULL, facility_id uuid NOT NULL,
 PRIMARY KEY(workspace_id,scope_snapshot_id,facility_id),
 FOREIGN KEY(workspace_id,company_id,site_id,scope_snapshot_id) REFERENCES ppo.estimation_revisions(workspace_id,company_id,site_id,scope_snapshot_id),
 FOREIGN KEY(workspace_id,company_id,site_id,facility_id) REFERENCES ppo.facilities(workspace_id,company_id,site_id,id)
);
CREATE TABLE ppo.estimating_scope_equipment (
 workspace_id uuid NOT NULL, company_id uuid NOT NULL, site_id uuid NOT NULL, scope_snapshot_id uuid NOT NULL, asset_id uuid NOT NULL,
 PRIMARY KEY(workspace_id,scope_snapshot_id,asset_id),
 FOREIGN KEY(workspace_id,company_id,site_id,scope_snapshot_id) REFERENCES ppo.estimation_revisions(workspace_id,company_id,site_id,scope_snapshot_id),
 FOREIGN KEY(workspace_id,company_id,site_id,asset_id) REFERENCES ppo.assets(workspace_id,company_id,site_id,id)
);
CREATE TRIGGER retain_membership BEFORE UPDATE OR DELETE ON ppo.estimating_scope_facilities FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TRIGGER retain_membership BEFORE UPDATE OR DELETE ON ppo.estimating_scope_equipment FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

CREATE FUNCTION ppo.check_estimating_scope_membership() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE r ppo.estimation_revisions; facilities uuid[]; equipment uuid[]; expected_facilities uuid[]; expected_equipment uuid[];
BEGIN
 IF TG_TABLE_NAME='estimation_revisions' THEN r:=NEW;
 ELSE SELECT * INTO STRICT r FROM ppo.estimation_revisions WHERE workspace_id=NEW.workspace_id AND scope_snapshot_id=NEW.scope_snapshot_id; END IF;
 IF r.kind='LegacyManual' THEN RETURN NULL; END IF;
 SELECT coalesce(array_agg(facility_id ORDER BY facility_id),'{}'::uuid[]) INTO facilities FROM ppo.estimating_scope_facilities WHERE workspace_id=r.workspace_id AND scope_snapshot_id=r.scope_snapshot_id;
 SELECT coalesce(array_agg(asset_id ORDER BY asset_id),'{}'::uuid[]) INTO equipment FROM ppo.estimating_scope_equipment WHERE workspace_id=r.workspace_id AND scope_snapshot_id=r.scope_snapshot_id;
 SELECT coalesce(array_agg(value::uuid ORDER BY value::uuid),'{}'::uuid[]) INTO expected_facilities FROM jsonb_array_elements_text(r.input->'scope'->'facility_ids');
 SELECT coalesce(array_agg(value::uuid ORDER BY value::uuid),'{}'::uuid[]) INTO expected_equipment FROM jsonb_array_elements_text(r.input->'scope'->'equipment_ids');
 IF facilities IS DISTINCT FROM expected_facilities OR equipment IS DISTINCT FROM expected_equipment OR cardinality(facilities)>10 OR cardinality(equipment)>100 THEN
  RAISE EXCEPTION 'Exact selected discovery membership required' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER exact_membership AFTER INSERT ON ppo.estimation_revisions DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_estimating_scope_membership();
CREATE CONSTRAINT TRIGGER exact_membership AFTER INSERT ON ppo.estimating_scope_facilities DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_estimating_scope_membership();
CREATE CONSTRAINT TRIGGER exact_membership AFTER INSERT ON ppo.estimating_scope_equipment DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_estimating_scope_membership();

CREATE FUNCTION ppo.check_estimating_graph() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE g ppo.estimating_workspaces; o ppo.estimating_options; r ppo.estimation_revisions; e ppo.estimates;
BEGIN
 IF TG_TABLE_NAME='estimating_workspaces' THEN SELECT * INTO STRICT g FROM ppo.estimating_workspaces WHERE id=NEW.id;
 ELSE SELECT * INTO STRICT g FROM ppo.estimating_workspaces WHERE id=NEW.estimating_workspace_id; END IF;
 SELECT * INTO STRICT o FROM ppo.estimating_options WHERE workspace_id=g.workspace_id AND estimating_workspace_id=g.id AND id=g.selected_option_id;
 IF o.state<>'Active' THEN RAISE EXCEPTION 'Selected option must remain active' USING ERRCODE='23514'; END IF;
 IF g.legacy_estimate_id IS NOT NULL THEN
  SELECT * INTO STRICT e FROM ppo.estimates WHERE workspace_id=g.workspace_id AND id=g.legacy_estimate_id;
  IF (e.company_id,e.opportunity_id,e.owner_id) IS DISTINCT FROM (g.company_id,g.opportunity_id,g.owner_id)
   OR NOT EXISTS(SELECT 1 FROM ppo.estimation_revisions v WHERE v.workspace_id=e.workspace_id AND v.estimating_workspace_id=g.id
     AND v.option_id=e.option_id AND v.id=e.estimation_revision_id AND v.kind='LegacyManual' AND v.legacy_estimate_id=e.id
     AND v.legacy_source_created_at=e.created_at AND v.site_id IS NOT DISTINCT FROM e.site_id) THEN
   RAISE EXCEPTION 'Retain the exact E1 compatibility context' USING ERRCODE='23514'; END IF;
 END IF;
 FOR o IN SELECT * FROM ppo.estimating_options WHERE workspace_id=g.workspace_id AND estimating_workspace_id=g.id LOOP
  SELECT * INTO STRICT r FROM ppo.estimation_revisions WHERE workspace_id=o.workspace_id AND option_id=o.id AND id=o.current_revision_id;
  IF r.version<>(SELECT max(version) FROM ppo.estimation_revisions WHERE workspace_id=o.workspace_id AND option_id=o.id)
   OR o.workspace_version>g.version THEN RAISE EXCEPTION 'Exact current discovery revision required' USING ERRCODE='23514'; END IF;
 END LOOP;
 IF TG_TABLE_NAME='estimation_revisions' THEN
  IF NEW.predecessor_id IS NOT NULL AND NOT EXISTS(
   SELECT 1 FROM ppo.estimation_revisions WHERE workspace_id=NEW.workspace_id AND option_id=NEW.option_id AND id=NEW.predecessor_id AND version=NEW.version-1
  ) THEN RAISE EXCEPTION 'Exact discovery predecessor required' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER estimating_graph AFTER INSERT OR UPDATE ON ppo.estimating_workspaces DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_estimating_graph();
CREATE CONSTRAINT TRIGGER estimating_graph AFTER INSERT OR UPDATE ON ppo.estimating_options DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_estimating_graph();
CREATE CONSTRAINT TRIGGER estimating_graph AFTER INSERT ON ppo.estimation_revisions DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_estimating_graph();

-- Build indexes before backfill queues deferred identity/graph checks.
CREATE INDEX ix_estimating_workspace_owner ON ppo.estimating_workspaces(workspace_id,company_id,owner_id,id);
CREATE INDEX ix_estimating_revision_history ON ppo.estimation_revisions(workspace_id,option_id,version DESC);

CREATE FUNCTION ppo.materialise_legacy_estimate(e ppo.estimates) RETURNS void LANGUAGE plpgsql AS $$
DECLARE group_id uuid:=gen_random_uuid();
BEGIN
 INSERT INTO ppo.estimating_workspaces(id,workspace_id,company_id,opportunity_id,owner_id,selected_option_id,legacy_estimate_id,created_by,updated_by)
  VALUES(group_id,e.workspace_id,e.company_id,e.opportunity_id,e.owner_id,e.option_id,e.id,e.created_by,e.created_by);
 INSERT INTO ppo.estimating_options(id,workspace_id,company_id,estimating_workspace_id,ordinal,label,current_revision_id,workspace_version,created_by,updated_by)
  VALUES(e.option_id,e.workspace_id,e.company_id,group_id,1,'A',e.estimation_revision_id,1,e.created_by,e.created_by);
 INSERT INTO ppo.estimation_revisions(id,workspace_id,company_id,estimating_workspace_id,option_id,version,kind,legacy_estimate_id,legacy_source_created_at,site_id,scope_readiness,reason,created_by)
  VALUES(e.estimation_revision_id,e.workspace_id,e.company_id,group_id,e.option_id,1,'LegacyManual',e.id,e.created_at,e.site_id,'NotRecorded','E1 identity formalisation only; no E2 questionnaire recorded',e.created_by);
END $$;
DO $$ DECLARE e ppo.estimates; BEGIN
 FOR e IN SELECT * FROM ppo.estimates ORDER BY workspace_id,id LOOP PERFORM ppo.materialise_legacy_estimate(e); END LOOP;
END $$;
CREATE FUNCTION ppo.materialise_new_legacy_estimate() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 PERFORM ppo.materialise_legacy_estimate(NEW); RETURN NULL;
END $$;
CREATE TRIGGER estimating_legacy_identity AFTER INSERT ON ppo.estimates FOR EACH ROW EXECUTE FUNCTION ppo.materialise_new_legacy_estimate();

CREATE FUNCTION ppo.assert_estimating_group_draft(group_id uuid) RETURNS void LANGUAGE plpgsql AS $$
DECLARE g ppo.estimating_workspaces;
BEGIN
 SELECT * INTO STRICT g FROM ppo.estimating_workspaces WHERE id=group_id;
 PERFORM 1 FROM ppo.workspaces WHERE id=g.workspace_id FOR UPDATE;
 IF g.state<>'Draft' OR EXISTS(SELECT 1 FROM ppo.estimates e WHERE e.workspace_id=g.workspace_id AND e.opportunity_id=g.opportunity_id AND e.state<>'Draft')
 OR EXISTS(SELECT 1 FROM ppo.draft_quotes q JOIN ppo.estimates e ON (e.workspace_id,e.id)=(q.workspace_id,q.estimate_id) WHERE e.workspace_id=g.workspace_id AND e.opportunity_id=g.opportunity_id AND q.state<>'Draft')
 OR EXISTS(SELECT 1 FROM ppo.draft_quote_revisions q JOIN ppo.estimates e ON (e.workspace_id,e.id)=(q.workspace_id,q.estimate_id) WHERE e.workspace_id=g.workspace_id AND e.opportunity_id=g.opportunity_id AND q.state<>'Draft') THEN
  RAISE EXCEPTION 'Only the known Draft commercial group is editable' USING ERRCODE='55000'; END IF;
END $$;
CREATE FUNCTION ppo.protect_estimating_workspace() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 PERFORM ppo.assert_estimating_group_draft(OLD.id);
 IF (NEW.id,NEW.workspace_id,NEW.company_id,NEW.opportunity_id,NEW.owner_id,NEW.legacy_estimate_id,NEW.state)
  IS DISTINCT FROM (OLD.id,OLD.workspace_id,OLD.company_id,OLD.opportunity_id,OLD.owner_id,OLD.legacy_estimate_id,OLD.state)
  OR NEW.version<>OLD.version+1 THEN RAISE EXCEPTION 'Retain estimating ownership and advance one version' USING ERRCODE='55000'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER protect_workspace BEFORE UPDATE ON ppo.estimating_workspaces FOR EACH ROW EXECUTE FUNCTION ppo.protect_estimating_workspace();
CREATE FUNCTION ppo.protect_estimating_option() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 PERFORM ppo.assert_estimating_group_draft(NEW.estimating_workspace_id);
 IF TG_OP='UPDATE' AND ((NEW.id,NEW.workspace_id,NEW.company_id,NEW.estimating_workspace_id,NEW.ordinal,NEW.predecessor_option_id,NEW.created_at,NEW.created_by)
  IS DISTINCT FROM (OLD.id,OLD.workspace_id,OLD.company_id,OLD.estimating_workspace_id,OLD.ordinal,OLD.predecessor_option_id,OLD.created_at,OLD.created_by)
  OR NEW.version<>OLD.version+1 OR NEW.workspace_version<=OLD.workspace_version) THEN
  RAISE EXCEPTION 'Retain option identity and advance its group version' USING ERRCODE='55000'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER protect_option BEFORE INSERT OR UPDATE ON ppo.estimating_options FOR EACH ROW EXECUTE FUNCTION ppo.protect_estimating_option();
CREATE FUNCTION ppo.guard_e1_discovery_state() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE e ppo.estimates; g ppo.estimating_workspaces;
BEGIN
 IF TG_TABLE_NAME='estimates' THEN e:=NEW;
 ELSE SELECT * INTO STRICT e FROM ppo.estimates WHERE workspace_id=NEW.workspace_id AND id=NEW.estimate_id; END IF;
 SELECT * INTO g FROM ppo.estimating_workspaces WHERE workspace_id=e.workspace_id AND opportunity_id=e.opportunity_id;
 IF NOT FOUND THEN RETURN NEW; END IF;
 IF TG_TABLE_NAME='estimates' AND TG_OP='INSERT' THEN
  RAISE EXCEPTION 'An estimating workspace already exists for this opportunity' USING ERRCODE='23505'; END IF;
 PERFORM ppo.assert_estimating_group_draft(g.id);
 IF NOT EXISTS(SELECT 1 FROM ppo.estimating_options WHERE workspace_id=e.workspace_id AND estimating_workspace_id=g.id AND id=e.option_id AND state='Active') THEN
  RAISE EXCEPTION 'Only an active option can author new commercial content' USING ERRCODE='55000'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER discovery_draft_guard BEFORE INSERT OR UPDATE ON ppo.estimates FOR EACH ROW EXECUTE FUNCTION ppo.guard_e1_discovery_state();
CREATE TRIGGER discovery_draft_guard BEFORE INSERT ON ppo.estimate_versions FOR EACH ROW EXECUTE FUNCTION ppo.guard_e1_discovery_state();
CREATE TRIGGER discovery_draft_guard BEFORE INSERT OR UPDATE ON ppo.draft_quotes FOR EACH ROW EXECUTE FUNCTION ppo.guard_e1_discovery_state();
CREATE TRIGGER discovery_draft_guard BEFORE INSERT ON ppo.draft_quote_revisions FOR EACH ROW EXECUTE FUNCTION ppo.guard_e1_discovery_state();
