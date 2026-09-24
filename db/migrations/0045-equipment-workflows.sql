-- ADR-0045. Synthetic Equipment evidence; canonical masters remain in their owning domains.
SET CONSTRAINTS ppo.identity_target IMMEDIATE;
DO $$ DECLARE r record; d text; BEGIN
 FOR r IN SELECT * FROM (VALUES ('business_identities','ck_identities_type'),('audit_events','ck_audit_object_type')) v(tab,con) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT d FROM pg_constraint WHERE conrelid=('ppo.'||r.tab)::regclass AND conname=r.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',r.tab,r.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR object_type IN (''EquipmentChange'',''EquipmentBackup'',''EquipmentBulletin'',''EquipmentSupport'',''CalibrationEvidence''))',r.tab,r.con,substring(d from 8 for length(d)-8));
 END LOOP;
 SELECT pg_get_functiondef('ppo.identity_has_typed_record()'::regprocedure) INTO d;
 IF position('CASE NEW.object_type' in d)=0 THEN RAISE EXCEPTION 'Inspect identity dispatch'; END IF;
 EXECUTE replace(d,'CASE NEW.object_type','CASE NEW.object_type WHEN ''EquipmentChange'' THEN ''equipment_changes'' WHEN ''EquipmentBackup'' THEN ''equipment_backups'' WHEN ''EquipmentBulletin'' THEN ''equipment_bulletins'' WHEN ''EquipmentSupport'' THEN ''equipment_support'' WHEN ''CalibrationEvidence'' THEN ''equipment_calibration_events''');
END $$;
SET CONSTRAINTS ppo.identity_target DEFERRED;

-- Closed typed records share mechanical identity/audit columns, not a generic master.
DO $$ DECLARE r record; BEGIN
 FOR r IN SELECT * FROM (VALUES ('equipment_changes','EquipmentChange'),('equipment_backups','EquipmentBackup'),('equipment_bulletins','EquipmentBulletin'),('equipment_support','EquipmentSupport'),('equipment_calibration_events','CalibrationEvidence')) v(tab,typ) LOOP
  EXECUTE format('CREATE TABLE ppo.%I (
   id uuid PRIMARY KEY,workspace_id uuid NOT NULL,company_id uuid NOT NULL,site_id uuid,
   version integer NOT NULL DEFAULT 1 CHECK(version>0),synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
   created_at timestamptz NOT NULL DEFAULT clock_timestamp(),created_by uuid NOT NULL,
   updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),updated_by uuid NOT NULL,
   UNIQUE(workspace_id,id),UNIQUE(workspace_id,company_id,id),
   FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
   FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id),
   FOREIGN KEY(workspace_id,company_id,site_id) REFERENCES ppo.sites(workspace_id,company_id,id),
   FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id))',r.tab);
  EXECUTE format('CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.%I FOR EACH ROW EXECUTE FUNCTION ppo.register_identity(%L,'''')',r.tab,r.typ);
  EXECUTE format('CREATE TRIGGER retain_record BEFORE DELETE ON ppo.%I FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence()',r.tab);
 END LOOP;
END $$;
ALTER TABLE ppo.equipment_changes
 ADD asset_id uuid NOT NULL, ADD asset_version integer NOT NULL CHECK(asset_version>0),
 ADD kind text NOT NULL CHECK(kind IN ('Configuration','Relocate','CorrectLocation','Replace','Retire')),
 ADD state text NOT NULL DEFAULT 'Proposed' CHECK(state IN ('Proposed','Applied','Rejected')),
 ADD effective_at timestamptz NOT NULL CHECK(isfinite(effective_at)), ADD reason text NOT NULL,
 ADD source_reference text NOT NULL, ADD source_revision text NOT NULL,
 ADD basis jsonb NOT NULL CHECK(jsonb_typeof(basis)='object'),
 ADD proposal jsonb NOT NULL CHECK(jsonb_typeof(proposal)='object'),
 ADD reviewed_by uuid, ADD reviewed_at timestamptz, ADD review_reason text,
 ADD FOREIGN KEY(workspace_id,company_id,asset_id) REFERENCES ppo.assets(workspace_id,company_id,id),
 ADD FOREIGN KEY(workspace_id,reviewed_by) REFERENCES ppo.users(workspace_id,id),
 ADD CHECK((state='Proposed')=(reviewed_at IS NULL)),
 ADD CHECK(num_nonnulls(reviewed_by,reviewed_at,review_reason) IN (0,3));
CREATE FUNCTION ppo.equipment_change_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF OLD.state<>'Proposed' OR NEW.state='Proposed' OR NEW.version<>OLD.version+1 OR
  (to_jsonb(NEW)-ARRAY['state','version','updated_at','updated_by','reviewed_by','reviewed_at','review_reason']) IS DISTINCT FROM
  (to_jsonb(OLD)-ARRAY['state','version','updated_at','updated_by','reviewed_by','reviewed_at','review_reason']) THEN
  RAISE EXCEPTION 'A proposal and its evidence are retained; review it once' USING ERRCODE='55000'; END IF;
 RETURN NEW; END $$;
CREATE TRIGGER equipment_change_guard BEFORE UPDATE ON ppo.equipment_changes FOR EACH ROW EXECUTE FUNCTION ppo.equipment_change_guard();
CREATE INDEX ON ppo.equipment_changes(workspace_id,asset_id,created_at);

-- Additive successor evidence retains every original configuration byte. The old interval is an
-- assertion made then; effective supersession is an independently retained fact.
CREATE TABLE ppo.asset_configuration_successions (
 workspace_id uuid NOT NULL,asset_id uuid NOT NULL,predecessor_id uuid NOT NULL,successor_id uuid NOT NULL,
 change_id uuid NOT NULL,effective_at timestamptz NOT NULL,
 PRIMARY KEY(workspace_id,successor_id),UNIQUE(workspace_id,predecessor_id),UNIQUE(workspace_id,change_id),
 FOREIGN KEY(workspace_id,asset_id,predecessor_id) REFERENCES ppo.asset_configurations(workspace_id,asset_id,id),
 FOREIGN KEY(workspace_id,asset_id,successor_id) REFERENCES ppo.asset_configurations(workspace_id,asset_id,id) DEFERRABLE INITIALLY DEFERRED,
 FOREIGN KEY(workspace_id,change_id) REFERENCES ppo.equipment_changes(workspace_id,id),CHECK(predecessor_id<>successor_id));
CREATE TRIGGER succession_retained BEFORE UPDATE OR DELETE ON ppo.asset_configuration_successions FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
ALTER TABLE ppo.asset_configurations DROP CONSTRAINT asset_configurations_workspace_id_asset_id_tstzrange_excl;
CREATE FUNCTION ppo.equipment_configuration_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE previous ppo.asset_configurations; link ppo.asset_configuration_successions; BEGIN
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 SELECT * INTO link FROM ppo.asset_configuration_successions WHERE workspace_id=NEW.workspace_id AND successor_id=NEW.id;
 IF FOUND THEN
  SELECT * INTO STRICT previous FROM ppo.asset_configurations WHERE workspace_id=NEW.workspace_id AND id=link.predecessor_id;
  IF NEW.asset_id<>previous.asset_id OR NEW.company_id<>previous.company_id OR NEW.revision<>previous.revision+1 OR NEW.valid_from<=previous.valid_from OR NEW.valid_from<>link.effective_at
   OR NOT EXISTS(SELECT 1 FROM ppo.equipment_changes ch WHERE ch.workspace_id=NEW.workspace_id AND ch.id=link.change_id AND ch.asset_id=NEW.asset_id AND ch.kind='Configuration' AND ch.state='Applied') THEN
   RAISE EXCEPTION 'Configuration successor needs an applied exact predecessor review' USING ERRCODE='23514'; END IF;
 ELSE
  IF EXISTS(SELECT 1 FROM ppo.asset_configurations ac WHERE ac.workspace_id=NEW.workspace_id AND ac.asset_id=NEW.asset_id AND tstzrange(ac.valid_from,ac.valid_to,'[)') && tstzrange(NEW.valid_from,NEW.valid_to,'[)')) THEN
   RAISE EXCEPTION 'Overlapping configuration requires controlled succession' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW; END $$;
CREATE TRIGGER configuration_successor_guard BEFORE INSERT ON ppo.asset_configurations FOR EACH ROW EXECUTE FUNCTION ppo.equipment_configuration_guard();

-- Historical consumers reference immutable identity plus event-time Site. Their old current-Site FK
-- made a governed move impossible even after work ended. Revalidate Site only for a new/changed link.
CREATE FUNCTION ppo.equipment_event_site_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NEW.asset_id IS NOT NULL AND (TG_OP='INSERT' OR (NEW.asset_id,NEW.site_id,NEW.company_id) IS DISTINCT FROM (OLD.asset_id,OLD.site_id,OLD.company_id)) AND
  NOT EXISTS(SELECT 1 FROM ppo.assets a WHERE (a.workspace_id,a.company_id,a.site_id,a.id)=(NEW.workspace_id,NEW.company_id,NEW.site_id,NEW.asset_id)) THEN
  RAISE EXCEPTION 'New equipment link must match current physical Site' USING ERRCODE='23514'; END IF;
 RETURN NEW; END $$;
DO $$ DECLARE r record; BEGIN
 FOR r IN SELECT conrelid::regclass AS tab,conname FROM pg_constraint WHERE confrelid='ppo.assets'::regclass AND contype='f' AND conrelid IN ('ppo.tickets'::regclass,'ppo.scope_assets'::regclass,'ppo.estimating_scope_equipment'::regclass) LOOP
  EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I',r.tab,r.conname);
  EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %I FOREIGN KEY(workspace_id,company_id,asset_id) REFERENCES ppo.assets(workspace_id,company_id,id)',r.tab,r.conname);
  EXECUTE format('CREATE TRIGGER equipment_event_site BEFORE INSERT OR UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION ppo.equipment_event_site_guard()',r.tab);
 END LOOP;
END $$;
-- Keep the original hierarchy/company checks; replace only the unconditional move refusal with
-- an exact applied review requirement. The service cannot unlock this with a session variable.
DO $$ DECLARE d text; old text := 'IF TG_TABLE_NAME=''assets'' AND TG_OP=''UPDATE'' AND to_jsonb(NEW)->>''site_id'' IS DISTINCT FROM to_jsonb(OLD)->>''site_id'' THEN RAISE EXCEPTION ''Reviewed asset move workflow is not enabled'' USING ERRCODE=''23514''; END IF;'; BEGIN
 SELECT pg_get_functiondef('ppo.shared_graph_guard()'::regprocedure) INTO d;
 IF position(old in d)=0 THEN RAISE EXCEPTION 'Inspect changed Asset move guard'; END IF;
 EXECUTE replace(d,old,'IF TG_TABLE_NAME=''assets'' AND TG_OP=''UPDATE'' AND to_jsonb(NEW)->>''site_id'' IS DISTINCT FROM to_jsonb(OLD)->>''site_id'' AND NOT EXISTS(SELECT 1 FROM ppo.equipment_changes ch WHERE ch.workspace_id=NEW.workspace_id AND ch.asset_id=NEW.id AND ch.asset_version=OLD.version AND ch.state=''Applied'' AND ch.kind IN (''Relocate'',''CorrectLocation'') AND ch.site_id=(to_jsonb(OLD)->>''site_id'')::uuid AND ch.proposal->>''site_id''=to_jsonb(NEW)->>''site_id'' AND ch.proposal->>''facility_id'' IS NOT DISTINCT FROM to_jsonb(NEW)->>''facility_id'') THEN RAISE EXCEPTION ''Equipment movement requires an exact applied review'' USING ERRCODE=''23514''; END IF;');
END $$;
CREATE FUNCTION ppo.equipment_lifecycle_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF (NEW.site_id,NEW.facility_id,NEW.lifecycle_status) IS DISTINCT FROM (OLD.site_id,OLD.facility_id,OLD.lifecycle_status) THEN
  IF NEW.version<>OLD.version+1 OR NOT EXISTS(SELECT 1 FROM ppo.equipment_changes ch WHERE ch.workspace_id=NEW.workspace_id AND ch.asset_id=NEW.id AND ch.asset_version=OLD.version AND ch.state='Applied' AND (
    (ch.kind IN ('Relocate','CorrectLocation') AND OLD.lifecycle_status='Active' AND NEW.lifecycle_status=OLD.lifecycle_status AND ch.site_id=OLD.site_id AND ch.proposal->>'site_id'=NEW.site_id::text AND ch.proposal->>'facility_id' IS NOT DISTINCT FROM NEW.facility_id::text)
    OR (ch.kind IN ('Replace','Retire') AND OLD.lifecycle_status='Active' AND NEW.site_id=OLD.site_id AND NEW.facility_id IS NOT DISTINCT FROM OLD.facility_id AND NEW.lifecycle_status=CASE WHEN ch.kind='Replace' THEN 'Removed' ELSE 'Decommissioned' END)
  )) THEN
   RAISE EXCEPTION 'Physical lifecycle change needs a current applied review' USING ERRCODE='23514'; END IF;
  IF EXISTS(SELECT 1 FROM ppo.assets child WHERE child.workspace_id=OLD.workspace_id AND child.parent_asset_id=OLD.id) OR NEW.parent_asset_id IS NOT NULL THEN RAISE EXCEPTION 'Resolve component and parent relationships first' USING ERRCODE='23514'; END IF;
  IF EXISTS(SELECT 1 FROM ppo.asset_served_facilities l WHERE l.workspace_id=OLD.workspace_id AND l.asset_id=OLD.id AND l.ended_at IS NULL) THEN RAISE EXCEPTION 'Explicitly end served relationships before physical lifecycle change' USING ERRCODE='23514'; END IF;
 END IF; RETURN NEW; END $$;
CREATE TRIGGER equipment_lifecycle_guard BEFORE UPDATE ON ppo.assets FOR EACH ROW EXECUTE FUNCTION ppo.equipment_lifecycle_guard();

ALTER TABLE ppo.equipment_backups ADD asset_id uuid NOT NULL,ADD configuration_id uuid NOT NULL,
 ADD reference text NOT NULL,ADD captured_at timestamptz NOT NULL,ADD captured_by text NOT NULL,ADD custodian text NOT NULL,
 ADD source_reference text NOT NULL,ADD source_revision text NOT NULL,ADD compatibility text NOT NULL,
 ADD procedure_reference text NOT NULL,ADD procedure_revision text NOT NULL,
 ADD relationship text NOT NULL CHECK(relationship IN ('Baseline','PreChange','PostChange')),ADD predecessor_id uuid,
 ADD FOREIGN KEY(workspace_id,company_id,asset_id) REFERENCES ppo.assets(workspace_id,company_id,id),
 ADD FOREIGN KEY(workspace_id,asset_id,configuration_id) REFERENCES ppo.asset_configurations(workspace_id,asset_id,id),
 ADD FOREIGN KEY(workspace_id,predecessor_id) REFERENCES ppo.equipment_backups(workspace_id,id);
CREATE TRIGGER backup_retained BEFORE UPDATE ON ppo.equipment_backups FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.equipment_backup_reviews (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,backup_id uuid NOT NULL,step text NOT NULL CHECK(step IN ('BackupReviewed','ProcedureReviewed','RecoveryTested','RecoveryVerified')),
 result text NOT NULL CHECK(result IN ('Passed','Failed','Unknown')),configuration_id uuid NOT NULL,evidence_reference text NOT NULL,evidence_revision text NOT NULL,
 reason text NOT NULL,occurred_at timestamptz NOT NULL,recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),recorded_by uuid NOT NULL,
 FOREIGN KEY(workspace_id,backup_id) REFERENCES ppo.equipment_backups(workspace_id,id),FOREIGN KEY(workspace_id,configuration_id) REFERENCES ppo.asset_configurations(workspace_id,id),FOREIGN KEY(workspace_id,recorded_by) REFERENCES ppo.users(workspace_id,id));
CREATE TRIGGER backup_review_retained BEFORE UPDATE OR DELETE ON ppo.equipment_backup_reviews FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

ALTER TABLE ppo.equipment_bulletins ADD reference text NOT NULL,ADD revision text NOT NULL,ADD title text NOT NULL,
 ADD source_reference text NOT NULL,ADD published_on date NOT NULL,ADD manufacturer text,ADD model text,ADD serial text,ADD configuration_id uuid,
 ADD state text NOT NULL DEFAULT 'Open' CHECK(state IN ('Open','Closed')),ADD closed_at timestamptz,ADD closed_by uuid,ADD close_reason text,
 ADD UNIQUE(workspace_id,company_id,reference,revision),ADD FOREIGN KEY(workspace_id,company_id,configuration_id) REFERENCES ppo.asset_configurations(workspace_id,company_id,id),ADD FOREIGN KEY(workspace_id,closed_by) REFERENCES ppo.users(workspace_id,id);
CREATE FUNCTION ppo.equipment_bulletin_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF OLD.state<>'Open' OR NEW.state<>'Closed' OR NEW.closed_at IS NULL OR NEW.closed_by IS NULL OR NEW.close_reason IS NULL OR NEW.version<>OLD.version+1 OR
  (to_jsonb(NEW)-ARRAY['state','version','updated_at','updated_by','closed_at','closed_by','close_reason']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['state','version','updated_at','updated_by','closed_at','closed_by','close_reason']) THEN
  RAISE EXCEPTION 'Bulletin revision is retained; closure requires exact review' USING ERRCODE='55000'; END IF; RETURN NEW; END $$;
CREATE TRIGGER bulletin_retained BEFORE UPDATE ON ppo.equipment_bulletins FOR EACH ROW EXECUTE FUNCTION ppo.equipment_bulletin_guard();
CREATE TABLE ppo.equipment_bulletin_reviews (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,company_id uuid NOT NULL,bulletin_id uuid NOT NULL,asset_id uuid NOT NULL,asset_version integer NOT NULL,
 disposition text NOT NULL CHECK(disposition IN ('Affected','PotentiallyAffected','NotApplicable','Unknown')),
 evidence_reference text NOT NULL,evidence_revision text NOT NULL,reason text NOT NULL,activity_id uuid,
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),recorded_by uuid NOT NULL,
 FOREIGN KEY(workspace_id,company_id,bulletin_id) REFERENCES ppo.equipment_bulletins(workspace_id,company_id,id),FOREIGN KEY(workspace_id,company_id,asset_id) REFERENCES ppo.assets(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,activity_id) REFERENCES ppo.activities(workspace_id,company_id,id),FOREIGN KEY(workspace_id,recorded_by) REFERENCES ppo.users(workspace_id,id));
CREATE TRIGGER bulletin_review_retained BEFORE UPDATE OR DELETE ON ppo.equipment_bulletin_reviews FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

ALTER TABLE ppo.equipment_support ADD asset_id uuid NOT NULL,ADD source_reference text NOT NULL,ADD source_revision text NOT NULL,ADD source_date date NOT NULL,
 ADD conclusion text NOT NULL CHECK(conclusion IN ('Unknown','Supported','SupportEnding','Discontinued')),ADD support_end date,ADD software_support_end date,
 ADD component text,ADD replacement_recommendation text,ADD uncertainty text NOT NULL,ADD predecessor_id uuid,
 ADD FOREIGN KEY(workspace_id,company_id,asset_id) REFERENCES ppo.assets(workspace_id,company_id,id),ADD FOREIGN KEY(workspace_id,predecessor_id) REFERENCES ppo.equipment_support(workspace_id,id);
CREATE TRIGGER support_retained BEFORE UPDATE ON ppo.equipment_support FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

ALTER TABLE ppo.inspection_instruments ADD measurement_type text,ADD measurement_range text,ADD measurement_unit text,
 ADD certificate_reference text,ADD certificate_revision text,ADD predecessor_id uuid,
 ADD FOREIGN KEY(workspace_id,company_id,predecessor_id) REFERENCES ppo.inspection_instruments(workspace_id,company_id,id);
CREATE UNIQUE INDEX instrument_one_successor ON ppo.inspection_instruments(workspace_id,predecessor_id) WHERE predecessor_id IS NOT NULL;
CREATE FUNCTION ppo.instrument_extended_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF (NEW.measurement_type,NEW.measurement_range,NEW.measurement_unit,NEW.certificate_reference,NEW.certificate_revision,NEW.predecessor_id) IS DISTINCT FROM (OLD.measurement_type,OLD.measurement_range,OLD.measurement_unit,OLD.certificate_reference,OLD.certificate_revision,OLD.predecessor_id) THEN
  RAISE EXCEPTION 'Measurement and certificate evidence is retained with the calibration' USING ERRCODE='55000'; END IF; RETURN NEW; END $$;
CREATE TRIGGER instrument_extended_guard BEFORE UPDATE ON ppo.inspection_instruments FOR EACH ROW EXECUTE FUNCTION ppo.instrument_extended_guard();
ALTER TABLE ppo.equipment_calibration_events ADD instrument_id uuid NOT NULL,ADD kind text NOT NULL CHECK(kind IN ('Recorded','Renewed','Withdrawn')),ADD reason text NOT NULL,
 ADD FOREIGN KEY(workspace_id,company_id,instrument_id) REFERENCES ppo.inspection_instruments(workspace_id,company_id,id);
CREATE TRIGGER calibration_event_retained BEFORE UPDATE ON ppo.equipment_calibration_events FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
