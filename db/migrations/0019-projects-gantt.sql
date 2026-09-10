-- Approved r10 Projects schedule integration. 0016 is reserved for Assistant; 0017 is CRM.
-- Additive typed records; no applied migration or existing evidence changes.
DO $$
DECLARE item record; definition text;
BEGIN
 FOR item IN SELECT * FROM (VALUES
  ('business_identities','ck_identities_type','object_type','Project,ProjectTask,ProjectScheduleEvent'),
  ('audit_events','ck_audit_object_type','object_type','Project'),
  ('outbox_jobs','ck_outbox_kind','kind','ProjectCreated,ProjectTaskSaved'),
  ('permission_grants','ck_grants_capability','capability','project.read,project.create,project.edit'),
  ('reference_counters','ck_reference_type','record_type','PRJ')
 ) AS v(tab,con,col,added) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid=('ppo.'||item.tab)::regclass AND conname=item.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',item.tab,item.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR %I = ANY(%L::text[]))',item.tab,item.con,substring(definition from 8 for length(definition)-8),item.col,string_to_array(item.added,','));
 END LOOP;
 SELECT pg_get_functiondef('ppo.identity_has_typed_record()'::regprocedure) INTO definition;
 IF position('CASE NEW.object_type' in definition)=0 THEN RAISE EXCEPTION 'Inspect changed typed identity dispatch'; END IF;
 EXECUTE replace(definition,'CASE NEW.object_type','CASE NEW.object_type WHEN ''Project'' THEN ''projects'' WHEN ''ProjectTask'' THEN ''project_tasks'' WHEN ''ProjectScheduleEvent'' THEN ''project_schedule_events''');
END $$;

CREATE TABLE ppo.projects (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL,
 display_number text NOT NULL, version integer NOT NULL DEFAULT 1 CHECK(version>0),
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 title text NOT NULL CHECK(length(btrim(title)) BETWEEN 1 AND 200),
 organisation_id uuid NOT NULL, site_id uuid NOT NULL, coordinator_id uuid NOT NULL,
 target_date date CHECK(target_date BETWEEN DATE '0001-01-01' AND DATE '9998-12-31'),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id), UNIQUE(workspace_id,display_number),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,organisation_id) REFERENCES ppo.organisations(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id) REFERENCES ppo.sites(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,coordinator_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id),
 CHECK(isfinite(created_at) AND isfinite(updated_at))
);
CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.projects FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('Project','PRJ');
CREATE TRIGGER project_retained BEFORE DELETE ON ppo.projects FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

CREATE TABLE ppo.project_tasks (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, project_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version>0), project_version integer NOT NULL CHECK(project_version>1),
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 title text NOT NULL CHECK(length(btrim(title)) BETWEEN 1 AND 200),
 phase text NOT NULL CHECK(phase IN ('Planning','Procurement','Delivery','Handover')),
 status text NOT NULL CHECK(status IN ('Planned','InProgress','AtRisk','Complete')),
 milestone boolean NOT NULL, start_date date, finish_date date,
 progress integer NOT NULL CHECK(progress BETWEEN 0 AND 100), note text CHECK(length(btrim(note)) BETWEEN 1 AND 2000),
 owner_id uuid, external_owner_id uuid,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,project_id,id),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,project_id) REFERENCES ppo.projects(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,external_owner_id) REFERENCES ppo.person_company_contexts(workspace_id,company_id,person_id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id),
 CHECK(owner_id IS NULL OR external_owner_id IS NULL),
 CHECK((start_date IS NULL AND finish_date IS NULL) OR (start_date IS NOT NULL AND finish_date IS NOT NULL AND start_date<=finish_date AND start_date>=DATE '0001-01-01' AND finish_date<=DATE '9998-12-31')),
 CHECK((status='Complete')=(progress=100) AND (status<>'Planned' OR progress=0)),
 CHECK(NOT milestone OR (start_date IS NOT DISTINCT FROM finish_date AND progress IN (0,100) AND status<>'InProgress')),
 CHECK(isfinite(created_at) AND isfinite(updated_at))
);
CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.project_tasks FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('ProjectTask','');
CREATE TRIGGER task_retained BEFORE DELETE ON ppo.project_tasks FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.project_dependencies (
 workspace_id uuid NOT NULL, project_id uuid NOT NULL, task_id uuid NOT NULL, predecessor_id uuid NOT NULL,
 kind text NOT NULL CHECK(kind IN ('FS','SS')),
 PRIMARY KEY(workspace_id,project_id,task_id,predecessor_id), CHECK(task_id<>predecessor_id),
 FOREIGN KEY(workspace_id,project_id,task_id) REFERENCES ppo.project_tasks(workspace_id,project_id,id),
 FOREIGN KEY(workspace_id,project_id,predecessor_id) REFERENCES ppo.project_tasks(workspace_id,project_id,id)
);
CREATE TABLE ppo.project_schedule_events (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, project_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version=1), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 operation_id uuid NOT NULL, project_version integer NOT NULL CHECK(project_version>0),
 event_type text NOT NULL CHECK(event_type IN ('ProjectCreated','ProjectTaskSaved')),
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),
 project_snapshot jsonb NOT NULL, task_snapshot jsonb, dependencies jsonb,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,project_id,project_version), UNIQUE(workspace_id,created_by,operation_id),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,project_id) REFERENCES ppo.projects(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id),
 CHECK((event_type='ProjectCreated' AND project_version=1 AND task_snapshot IS NULL AND dependencies IS NULL) OR (event_type='ProjectTaskSaved' AND project_version>1 AND task_snapshot IS NOT NULL AND jsonb_typeof(dependencies)='array'))
);
CREATE TRIGGER register_identity BEFORE INSERT ON ppo.project_schedule_events FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('ProjectScheduleEvent','');
CREATE TRIGGER event_immutable BEFORE UPDATE OR DELETE ON ppo.project_schedule_events FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

CREATE FUNCTION ppo.protect_project_schedule() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE p ppo.projects;
BEGIN
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 IF TG_OP='INSERT' THEN
  IF NEW.version<>1 THEN RAISE EXCEPTION 'New records start at version one' USING ERRCODE='23514'; END IF;
 ELSIF NEW.version<>OLD.version+1 OR NEW.company_id<>OLD.company_id THEN
  RAISE EXCEPTION 'Retain scope and advance the record version' USING ERRCODE='55000';
 END IF;
 IF TG_TABLE_NAME='projects' THEN
  IF TG_OP='UPDATE' AND (NEW.title,NEW.organisation_id,NEW.site_id,NEW.coordinator_id,NEW.target_date) IS DISTINCT FROM (OLD.title,OLD.organisation_id,OLD.site_id,OLD.coordinator_id,OLD.target_date) THEN RAISE EXCEPTION 'Project context remains fixed in this increment' USING ERRCODE='55000'; END IF;
  IF TG_OP='INSERT' AND (NOT EXISTS(SELECT 1 FROM ppo.site_parties WHERE workspace_id=NEW.workspace_id AND company_id=NEW.company_id AND site_id=NEW.site_id AND organisation_id=NEW.organisation_id AND valid_from<=CURRENT_DATE AND (valid_to IS NULL OR valid_to>CURRENT_DATE)) OR NOT EXISTS(SELECT 1 FROM ppo.users WHERE workspace_id=NEW.workspace_id AND id=NEW.coordinator_id AND active)) THEN RAISE EXCEPTION 'Current customer/site relationship and coordinator required' USING ERRCODE='23514'; END IF;
 ELSE
  SELECT * INTO STRICT p FROM ppo.projects WHERE workspace_id=NEW.workspace_id AND id=NEW.project_id;
  IF NEW.project_version<>p.version OR (TG_OP='UPDATE' AND (NEW.project_id<>OLD.project_id OR NEW.project_version<=OLD.project_version)) THEN RAISE EXCEPTION 'Task belongs to the current accepted schedule version' USING ERRCODE='23514'; END IF;
  IF NEW.owner_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM ppo.users WHERE workspace_id=NEW.workspace_id AND id=NEW.owner_id AND active) THEN RAISE EXCEPTION 'Active internal owner required' USING ERRCODE='23514'; END IF;
  IF NEW.external_owner_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM ppo.people pe JOIN ppo.relationships r ON (r.workspace_id,r.person_id)=(pe.workspace_id,pe.id) WHERE pe.workspace_id=NEW.workspace_id AND pe.id=NEW.external_owner_id AND pe.active AND r.company_id=p.company_id AND r.organisation_id=p.organisation_id AND r.valid_from<=CURRENT_DATE AND (r.valid_to IS NULL OR r.valid_to>CURRENT_DATE)) THEN RAISE EXCEPTION 'Current external affiliation required' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER project_guards BEFORE INSERT OR UPDATE ON ppo.projects FOR EACH ROW EXECUTE FUNCTION ppo.protect_project_schedule();
CREATE TRIGGER task_guards BEFORE INSERT OR UPDATE ON ppo.project_tasks FOR EACH ROW EXECUTE FUNCTION ppo.protect_project_schedule();

CREATE FUNCTION ppo.check_project_schedule_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE p ppo.projects; e ppo.project_schedule_events; t ppo.project_tasks; deps jsonb;
BEGIN
 IF TG_TABLE_NAME='projects' THEN
  SELECT * INTO e FROM ppo.project_schedule_events WHERE workspace_id=NEW.workspace_id AND project_id=NEW.id AND project_version=NEW.version;
  IF e.id IS NULL OR e.project_snapshot<>to_jsonb(NEW) OR e.created_by<>NEW.updated_by THEN RAISE EXCEPTION 'Exact event required for each project version' USING ERRCODE='23514'; END IF;
 ELSIF TG_TABLE_NAME='project_tasks' THEN
  SELECT * INTO e FROM ppo.project_schedule_events WHERE workspace_id=NEW.workspace_id AND project_id=NEW.project_id AND project_version=NEW.project_version;
  IF e.id IS NULL OR e.task_snapshot IS DISTINCT FROM to_jsonb(NEW) OR e.created_by<>NEW.updated_by THEN RAISE EXCEPTION 'Exact event required for each task version' USING ERRCODE='23514'; END IF;
 ELSE
  SELECT * INTO STRICT p FROM ppo.projects WHERE workspace_id=NEW.workspace_id AND id=NEW.project_id;
  IF NEW.project_version>p.version OR (NEW.project_version>1 AND NOT EXISTS(SELECT 1 FROM ppo.project_schedule_events WHERE workspace_id=NEW.workspace_id AND project_id=NEW.project_id AND project_version=NEW.project_version-1)) THEN RAISE EXCEPTION 'Schedule event requires its preceding accepted version' USING ERRCODE='23514'; END IF;
  IF NEW.event_type='ProjectTaskSaved' THEN
   SELECT * INTO t FROM ppo.project_tasks WHERE workspace_id=NEW.workspace_id AND project_id=NEW.project_id AND id=(NEW.task_snapshot->>'id')::uuid;
   SELECT coalesce(jsonb_agg(jsonb_build_object('task_id',predecessor_id,'kind',kind) ORDER BY predecessor_id),'[]'::jsonb) INTO deps FROM ppo.project_dependencies WHERE workspace_id=NEW.workspace_id AND project_id=NEW.project_id AND task_id=t.id;
   IF t.id IS NULL OR t.project_version<>NEW.project_version OR NEW.task_snapshot<>to_jsonb(t) OR deps<>NEW.dependencies THEN RAISE EXCEPTION 'Accepted task and predecessor snapshot required' USING ERRCODE='23514'; END IF;
  END IF;
 END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER project_evidence AFTER INSERT OR UPDATE ON ppo.projects DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_project_schedule_evidence();
CREATE CONSTRAINT TRIGGER task_evidence AFTER INSERT OR UPDATE ON ppo.project_tasks DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_project_schedule_evidence();
CREATE CONSTRAINT TRIGGER event_chain AFTER INSERT ON ppo.project_schedule_events DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_project_schedule_evidence();

CREATE FUNCTION ppo.check_project_dependencies() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE w uuid:=coalesce(NEW.workspace_id,OLD.workspace_id); p uuid:=coalesce(NEW.project_id,OLD.project_id); tid uuid:=coalesce(NEW.task_id,OLD.task_id); expected jsonb;
BEGIN
 PERFORM 1 FROM ppo.workspaces WHERE id=w FOR UPDATE;
 IF EXISTS(WITH RECURSIVE reach(origin,id) AS (
  SELECT task_id,predecessor_id FROM ppo.project_dependencies WHERE workspace_id=w AND project_id=p
  UNION SELECT c.origin,d.predecessor_id FROM reach c JOIN ppo.project_dependencies d ON d.task_id=c.id AND d.workspace_id=w AND d.project_id=p
 ) SELECT 1 FROM reach WHERE origin=id) THEN RAISE EXCEPTION 'Dependency cycles are not permitted' USING ERRCODE='23514'; END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('task_id',predecessor_id,'kind',kind) ORDER BY predecessor_id),'[]'::jsonb) INTO expected FROM ppo.project_dependencies WHERE workspace_id=w AND project_id=p AND task_id=tid;
 IF NOT EXISTS(SELECT 1 FROM ppo.project_tasks t JOIN ppo.project_schedule_events e ON (e.workspace_id,e.project_id,e.project_version)=(t.workspace_id,t.project_id,t.project_version) WHERE t.workspace_id=w AND t.project_id=p AND t.id=tid AND e.dependencies=expected AND e.task_snapshot=to_jsonb(t)) THEN RAISE EXCEPTION 'Dependency changes require an accepted task snapshot' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER dependency_graph AFTER INSERT OR UPDATE OR DELETE ON ppo.project_dependencies DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_project_dependencies();
CREATE INDEX ix_projects_scope ON ppo.projects(workspace_id,company_id,site_id,id);
CREATE INDEX ix_project_task_order ON ppo.project_tasks(workspace_id,project_id,created_at,id);
