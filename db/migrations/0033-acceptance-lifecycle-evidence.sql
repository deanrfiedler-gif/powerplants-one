-- PJ-09 integration proof found that every Project version requires its exact schedule-history event.
-- Retain that invariant, add an explicit acceptance event kind, and preserve every old event/receipt.
DO $$ DECLARE r record; BEGIN
 FOR r IN SELECT conname,pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid='ppo.project_schedule_events'::regclass AND contype='c' AND pg_get_constraintdef(oid) LIKE '%event_type%' LOOP
  EXECUTE format('ALTER TABLE ppo.project_schedule_events DROP CONSTRAINT %I',r.conname);
  EXECUTE format('ALTER TABLE ppo.project_schedule_events ADD CONSTRAINT %I CHECK ((%s) OR (event_type=''ProjectAcceptanceChanged'' AND project_version>1 AND task_snapshot IS NULL AND dependencies IS NULL))',r.conname,substring(r.definition from 8 for length(r.definition)-8));
 END LOOP;
END $$;
CREATE TABLE ppo.acceptance_source_versions (
 workspace_id uuid NOT NULL, source_id uuid NOT NULL, version integer NOT NULL, snapshot jsonb NOT NULL, recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(workspace_id,source_id,version), FOREIGN KEY(workspace_id,source_id) REFERENCES ppo.acceptance_sources(workspace_id,id)
);
INSERT INTO ppo.acceptance_source_versions SELECT workspace_id,id,version,to_jsonb(s),clock_timestamp() FROM ppo.acceptance_sources s;
CREATE TRIGGER source_version_retained BEFORE UPDATE OR DELETE ON ppo.acceptance_source_versions FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.acceptance_source_version() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='UPDATE' AND (NEW.version<>OLD.version+1 OR (NEW.workspace_id,NEW.project_id,NEW.adapter,NEW.commissioning_id,NEW.scope_key) IS DISTINCT FROM (OLD.workspace_id,OLD.project_id,OLD.adapter,OLD.commissioning_id,OLD.scope_key)) THEN RAISE EXCEPTION 'Preserve source identity and advance its version' USING ERRCODE='55000'; END IF;
 INSERT INTO ppo.acceptance_source_versions VALUES(NEW.workspace_id,NEW.id,NEW.version,to_jsonb(NEW),clock_timestamp()); RETURN NEW;
END $$;
CREATE TRIGGER acceptance_source_version AFTER INSERT OR UPDATE ON ppo.acceptance_sources FOR EACH ROW EXECUTE FUNCTION ppo.acceptance_source_version();
CREATE FUNCTION ppo.acceptance_source_context() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NEW.commissioning_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM ppo.commissioning_packages k JOIN ppo.engineering_packages e ON e.workspace_id=k.workspace_id AND e.id=k.package_id WHERE k.workspace_id=NEW.workspace_id AND k.id=NEW.commissioning_id AND e.context_kind='Project' AND e.context_id=NEW.project_id) THEN RAISE EXCEPTION 'Technical evidence must belong to the exact Project' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER acceptance_source_context BEFORE INSERT OR UPDATE ON ppo.acceptance_sources FOR EACH ROW EXECUTE FUNCTION ppo.acceptance_source_context();
-- The same owning EN-08 command transaction marks only stages bound to this commissioning record.
-- Reassessment is a current warning, never an authorised reopening. One shared Activity per source version.
CREATE FUNCTION ppo.acceptance_commissioning_changed() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE s record; activity uuid; cause text;
BEGIN
 FOR s IN SELECT DISTINCT st.* FROM ppo.acceptance_stages st JOIN ppo.acceptance_stage_units l ON l.workspace_id=st.workspace_id AND l.stage_id=st.id AND l.revision=st.revision AND l.disposition='Included'
 JOIN ppo.acceptance_requirements r ON r.workspace_id=l.workspace_id AND r.unit_id=l.unit_id JOIN ppo.acceptance_sources src ON src.workspace_id=r.workspace_id AND src.id=r.source_id
 WHERE src.workspace_id=NEW.workspace_id AND src.commissioning_id=NEW.id AND EXISTS(SELECT 1 FROM ppo.acceptance_decisions d WHERE d.workspace_id=st.workspace_id AND d.stage_id=st.id AND d.kind='Technical') LOOP
  UPDATE ppo.acceptance_stages SET reassessment=true,version=version+1,updated_at=clock_timestamp(),updated_by=NEW.updated_by WHERE id=s.id;
  cause:='en08:'||NEW.id||':'||NEW.version;
  IF NOT EXISTS(SELECT 1 FROM ppo.acceptance_followups WHERE workspace_id=s.workspace_id AND stage_id=s.id AND acceptance_followups.cause=acceptance_commissioning_changed.cause) THEN
   activity:=gen_random_uuid();
   INSERT INTO ppo.activities(id,workspace_id,company_id,site_id,kind,owner_id,summary,due_at,due_needed,access_class,created_by,updated_by)
   SELECT activity,s.workspace_id,s.company_id,p.site_id,'TechnicalFollowUp',s.owner_id,'Reassess changed technical evidence for acceptance stage',NULL,true,'Internal',NEW.updated_by,NEW.updated_by FROM ppo.projects p WHERE p.workspace_id=s.workspace_id AND p.id=s.project_id;
   INSERT INTO ppo.activity_links(workspace_id,company_id,activity_id,object_type,object_id) VALUES(s.workspace_id,s.company_id,activity,'Project',s.project_id);
   INSERT INTO ppo.acceptance_followups VALUES(s.workspace_id,s.project_id,s.id,cause,activity);
  END IF;
 END LOOP;
 RETURN NEW;
END $$;
CREATE TRIGGER acceptance_commissioning_changed AFTER UPDATE ON ppo.commissioning_packages FOR EACH ROW EXECUTE FUNCTION ppo.acceptance_commissioning_changed();
