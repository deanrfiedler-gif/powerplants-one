-- PJ-04 / PRJ-03: synthetic owned RAID and decisions, linked to native Activities.
-- No existing records, grants, seeds, schedules or operational rules are changed.
SET CONSTRAINTS ppo.identity_target IMMEDIATE;
DO $$ DECLARE spec record; definition text; BEGIN
 FOR spec IN SELECT * FROM (VALUES
  ('business_identities','ck_identities_type','object_type'),
  ('audit_events','ck_audit_object_type','object_type')
 ) v(tab,con,col) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid=('ppo.'||spec.tab)::regclass AND conname=spec.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',spec.tab,spec.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR %I = ''ProjectRaidEntry'')',spec.tab,spec.con,substring(definition from 8 for length(definition)-8),spec.col);
 END LOOP;
 SELECT pg_get_functiondef('ppo.identity_has_typed_record()'::regprocedure) INTO definition;
 IF position('CASE NEW.object_type' in definition)=0 THEN RAISE EXCEPTION 'Inspect changed identity dispatch'; END IF;
 EXECUTE replace(definition,'CASE NEW.object_type','CASE NEW.object_type WHEN ''ProjectRaidEntry'' THEN ''project_raid_entries''');
END $$;
SET CONSTRAINTS ppo.identity_target DEFERRED;

CREATE TABLE ppo.project_raid_entries (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, project_id uuid NOT NULL,
 kind text NOT NULL CHECK(kind IN ('Risk','Assumption','Issue','Dependency','Decision')),
 created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp() CHECK(isfinite(created_at)),
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,project_id) REFERENCES ppo.projects(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER raid_identity BEFORE INSERT ON ppo.project_raid_entries FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('ProjectRaidEntry','');
CREATE TRIGGER raid_entry_immutable BEFORE UPDATE OR DELETE ON ppo.project_raid_entries FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE INDEX raid_project ON ppo.project_raid_entries(workspace_id,project_id,id);

CREATE TABLE ppo.project_raid_revisions (
 workspace_id uuid NOT NULL, entry_id uuid NOT NULL, version integer NOT NULL CHECK(version>0),
 title text NOT NULL CHECK(length(btrim(title)) BETWEEN 1 AND 200),
 detail text NOT NULL CHECK(length(btrim(detail)) BETWEEN 1 AND 4000),
 owner_id uuid NOT NULL, priority text NOT NULL CHECK(priority IN ('Normal','High')),
 due_at timestamptz CHECK(isfinite(due_at)), due_needed boolean NOT NULL CHECK(due_needed=(due_at IS NULL)),
 response text CHECK(length(btrim(response)) BETWEEN 1 AND 4000),
 interface_notes text CHECK(length(btrim(interface_notes)) BETWEEN 1 AND 2000),
 state text NOT NULL CHECK(state IN ('Open','Monitoring','Closed')),
 outcome text CHECK(length(btrim(outcome)) BETWEEN 1 AND 4000), CHECK((state='Closed')=(outcome IS NOT NULL)),
 action_ids uuid[] NOT NULL CHECK(cardinality(action_ids)<=20),
 action_snapshot jsonb NOT NULL CHECK(jsonb_typeof(action_snapshot)='array'),
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),
 created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp() CHECK(isfinite(created_at)), operation_id uuid NOT NULL,
 PRIMARY KEY(workspace_id,entry_id,version), UNIQUE(workspace_id,created_by,operation_id),
 FOREIGN KEY(workspace_id,entry_id) REFERENCES ppo.project_raid_entries(workspace_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE FUNCTION ppo.guard_project_raid_revision() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE previous ppo.project_raid_revisions; entry ppo.project_raid_entries; project ppo.projects; snapshot jsonb;
BEGIN
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 SELECT * INTO STRICT entry FROM ppo.project_raid_entries WHERE workspace_id=NEW.workspace_id AND id=NEW.entry_id;
 SELECT * INTO STRICT project FROM ppo.projects WHERE workspace_id=entry.workspace_id AND id=entry.project_id;
 SELECT * INTO previous FROM ppo.project_raid_revisions WHERE workspace_id=NEW.workspace_id AND entry_id=NEW.entry_id ORDER BY version DESC LIMIT 1;
 IF project.lifecycle='Closed' OR NEW.version<>coalesce(previous.version,0)+1
  OR (previous.version IS NULL AND NEW.state<>'Open')
  OR (previous.state='Closed' AND NEW.state<>'Open')
  OR NOT coalesce(previous.action_ids,'{}'::uuid[]) <@ NEW.action_ids
  OR NEW.action_ids IS DISTINCT FROM ARRAY(SELECT DISTINCT id FROM unnest(NEW.action_ids) id ORDER BY id)
 THEN RAISE EXCEPTION 'Current project, sequential revision, explicit reopening and retained action links required' USING ERRCODE='23514'; END IF;
 IF EXISTS(SELECT 1 FROM unnest(NEW.action_ids) selected(action_id) WHERE NOT EXISTS(
  SELECT 1 FROM ppo.activities a JOIN ppo.activity_links l ON (l.workspace_id,l.activity_id)=(a.workspace_id,a.id)
  WHERE a.workspace_id=entry.workspace_id AND a.id=selected.action_id AND a.company_id=entry.company_id AND a.site_id=project.site_id
   AND l.object_type='Project' AND l.object_id=entry.project_id
   AND (NEW.state<>'Closed' OR a.status IN ('Completed','Cancelled'))
 )) THEN RAISE EXCEPTION 'Actions must belong to this project; closing requires terminal actions' USING ERRCODE='23514'; END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',a.id,'version',a.version,'state',a.status) ORDER BY a.id),'[]'::jsonb) INTO snapshot
 FROM ppo.activities a WHERE a.workspace_id=NEW.workspace_id AND a.id=ANY(NEW.action_ids);
 IF NEW.action_snapshot<>snapshot THEN RAISE EXCEPTION 'Exact action versions required' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER raid_revision_guard BEFORE INSERT ON ppo.project_raid_revisions FOR EACH ROW EXECUTE FUNCTION ppo.guard_project_raid_revision();
CREATE TRIGGER raid_revision_immutable BEFORE UPDATE OR DELETE ON ppo.project_raid_revisions FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.check_project_raid_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(
  SELECT 1 FROM ppo.operation_receipts r
  JOIN ppo.audit_events a ON (a.workspace_id,a.actor_id,a.operation_id)=(r.workspace_id,r.actor_id,r.operation_id)
  JOIN ppo.outbox_jobs j ON (j.workspace_id,j.actor_id,j.operation_id)=(r.workspace_id,r.actor_id,r.operation_id)
  WHERE r.workspace_id=NEW.workspace_id AND r.actor_id=NEW.created_by AND r.operation_id=NEW.operation_id AND r.record_id=NEW.entry_id
   AND r.result->>'record_id'=NEW.entry_id::text AND (r.result->>'record_version')::integer=NEW.version AND r.result->>'state'=NEW.state
   AND a.object_type='ProjectRaidEntry' AND a.object_id=NEW.entry_id AND a.outcome='Accepted' AND a.reason=NEW.reason
   AND a.details->>'command'='SaveProjectRaid' AND (a.details->>'record_version')::integer=NEW.version
   AND j.kind='SharedRecordUpdated' AND j.payload->>'object_type'='ProjectRaidEntry'
   AND j.payload->>'record_id'=NEW.entry_id::text AND (j.payload->>'record_version')::integer=NEW.version
 ) THEN RAISE EXCEPTION 'Exact RAID receipt, audit and outbox required' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER raid_revision_evidence AFTER INSERT ON ppo.project_raid_revisions DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_project_raid_evidence();
CREATE FUNCTION ppo.check_project_raid_initial_revision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM ppo.project_raid_revisions WHERE workspace_id=NEW.workspace_id AND entry_id=NEW.id AND version=1 AND created_by=NEW.created_by)
 THEN RAISE EXCEPTION 'Initial RAID revision required' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER raid_initial_revision AFTER INSERT ON ppo.project_raid_entries DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_project_raid_initial_revision();
