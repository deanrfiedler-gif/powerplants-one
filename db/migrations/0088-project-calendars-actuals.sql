-- PJ-03: synthetic, date-only working calendars and reported actuals.
-- Existing forecasts, baseline rows, grants, identities and bookings are retained.
CREATE FUNCTION ppo.valid_project_calendar(days integer[], exceptions jsonb) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE e jsonb; d date; seen text[] := '{}';
BEGIN
 IF cardinality(days) NOT BETWEEN 1 AND 7 OR array_ndims(days)<>1 THEN RETURN false; END IF;
 IF array_position(days,NULL) IS NOT NULL
 OR NOT days <@ ARRAY[1,2,3,4,5,6,7] OR cardinality(days)<>(SELECT count(DISTINCT v) FROM unnest(days) v)
 OR jsonb_typeof(exceptions)<>'array' OR jsonb_array_length(exceptions)>366 THEN RETURN false; END IF;
 FOR e IN SELECT * FROM jsonb_array_elements(exceptions) LOOP
  IF jsonb_typeof(e)<>'object' OR NOT e ?& ARRAY['date','working','reason']
   OR e-ARRAY['date','working','reason']<>'{}'::jsonb OR jsonb_typeof(e->'working')<>'boolean'
   OR jsonb_typeof(e->'date')<>'string' OR jsonb_typeof(e->'reason')<>'string'
   OR (e->>'date') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
   OR length(btrim(e->>'reason')) NOT BETWEEN 1 AND 200 OR (e->>'date')=ANY(seen) THEN RETURN false; END IF;
  d:=(e->>'date')::date;
  IF d NOT BETWEEN DATE '0001-01-01' AND DATE '9998-12-31' THEN RETURN false; END IF;
  seen:=array_append(seen,e->>'date');
 END LOOP;
 RETURN true;
EXCEPTION WHEN OTHERS THEN RETURN false;
END $$;

CREATE TABLE ppo.project_calendar_revisions (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, project_id uuid NOT NULL,
 revision integer NOT NULL CHECK(revision>0), project_version integer NOT NULL CHECK(project_version>1),
 name text NOT NULL CHECK(length(btrim(name)) BETWEEN 1 AND 120),
 timezone text NOT NULL, weekdays integer[] NOT NULL, exceptions jsonb NOT NULL,
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 1000), reviewed boolean NOT NULL CHECK(reviewed),
 created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp() CHECK(isfinite(created_at)),
 operation_id uuid NOT NULL, synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 CHECK(ppo.valid_project_calendar(weekdays,exceptions)),
 UNIQUE(workspace_id,project_id,revision), UNIQUE(workspace_id,created_by,operation_id),
 FOREIGN KEY(workspace_id,company_id,project_id) REFERENCES ppo.projects(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.project_task_actual_revisions (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, project_id uuid NOT NULL, task_id uuid NOT NULL,
 revision integer NOT NULL CHECK(revision>0), project_version integer NOT NULL CHECK(project_version>1), task_version integer NOT NULL CHECK(task_version>0),
 forecast_start date, forecast_finish date, actual_start date, actual_finish date, timezone text NOT NULL,
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),
 created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp() CHECK(isfinite(created_at)),
 operation_id uuid NOT NULL, synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 CHECK(actual_finish IS NULL OR (actual_start IS NOT NULL AND actual_finish>=actual_start)),
 CHECK(actual_start IS NULL OR actual_start BETWEEN DATE '0001-01-01' AND DATE '9998-12-31'),
 CHECK(actual_finish IS NULL OR actual_finish BETWEEN DATE '0001-01-01' AND DATE '9998-12-31'),
 UNIQUE(workspace_id,project_id,task_id,revision), UNIQUE(workspace_id,created_by,operation_id),
 FOREIGN KEY(workspace_id,company_id,project_id) REFERENCES ppo.projects(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,project_id,task_id) REFERENCES ppo.project_tasks(workspace_id,project_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);

DO $$ DECLARE c record; BEGIN
 FOR c IN SELECT conname,pg_get_expr(conbin,conrelid) expr FROM pg_constraint
  WHERE conrelid='ppo.project_schedule_events'::regclass AND contype='c' AND pg_get_constraintdef(oid) LIKE '%event_type%'
 LOOP
  EXECUTE format('ALTER TABLE ppo.project_schedule_events DROP CONSTRAINT %I',c.conname);
  EXECUTE format('ALTER TABLE ppo.project_schedule_events ADD CONSTRAINT %I CHECK ((%s) OR (event_type IN (''ProjectCalendarRecorded'',''ProjectActualsRecorded'') AND project_version>1 AND task_snapshot IS NULL AND dependencies IS NULL))',c.conname,c.expr);
 END LOOP;
END $$;

CREATE FUNCTION ppo.guard_project_programme() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE p ppo.projects; t ppo.project_tasks; previous integer; zone text;
BEGIN
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 SELECT * INTO STRICT p FROM ppo.projects WHERE workspace_id=NEW.workspace_id AND id=NEW.project_id;
 SELECT timezone INTO STRICT zone FROM ppo.sites WHERE workspace_id=p.workspace_id AND id=p.site_id;
 IF p.lifecycle<>'Active' OR p.version<>NEW.project_version OR p.updated_by<>NEW.created_by OR NEW.timezone<>zone
 THEN RAISE EXCEPTION 'Current active Project and site timezone required' USING ERRCODE='23514'; END IF;
 IF TG_TABLE_NAME='project_calendar_revisions' THEN
  SELECT coalesce(max(revision),0) INTO previous FROM ppo.project_calendar_revisions WHERE workspace_id=NEW.workspace_id AND project_id=NEW.project_id;
  IF p.coordinator_id<>NEW.created_by THEN RAISE EXCEPTION 'Current coordinator required' USING ERRCODE='23514'; END IF;
 ELSE
  SELECT * INTO STRICT t FROM ppo.project_tasks WHERE workspace_id=NEW.workspace_id AND project_id=NEW.project_id AND id=NEW.task_id;
  SELECT coalesce(max(revision),0) INTO previous FROM ppo.project_task_actual_revisions WHERE workspace_id=NEW.workspace_id AND project_id=NEW.project_id AND task_id=NEW.task_id;
  IF (NEW.task_version,NEW.forecast_start,NEW.forecast_finish) IS DISTINCT FROM (t.version,t.start_date,t.finish_date)
   OR NEW.actual_start>(CURRENT_TIMESTAMP AT TIME ZONE zone)::date OR NEW.actual_finish>(CURRENT_TIMESTAMP AT TIME ZONE zone)::date
  THEN RAISE EXCEPTION 'Current forecast and nonfuture actual dates required' USING ERRCODE='23514'; END IF;
 END IF;
 IF NEW.revision<>previous+1 THEN RAISE EXCEPTION 'Next revision required' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE FUNCTION ppo.check_project_programme_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE command text; event_kind text; state text;
BEGIN
 IF TG_TABLE_NAME='project_calendar_revisions' THEN command:='RecordProjectCalendar'; event_kind:='ProjectCalendarRecorded'; state:='CalendarRecorded';
 ELSE command:='RecordProjectActuals'; event_kind:='ProjectActualsRecorded'; state:='ActualsRecorded'; END IF;
 IF NOT EXISTS(SELECT 1 FROM ppo.projects p JOIN ppo.project_schedule_events e ON (e.workspace_id,e.project_id,e.project_version)=(p.workspace_id,p.id,p.version)
   WHERE p.workspace_id=NEW.workspace_id AND p.id=NEW.project_id AND p.version=NEW.project_version AND p.lifecycle='Active'
   AND e.event_type=event_kind AND e.created_by=NEW.created_by AND e.operation_id=NEW.operation_id AND e.reason=NEW.reason AND e.project_snapshot=to_jsonb(p))
 OR NOT EXISTS(SELECT 1 FROM ppo.operation_receipts r JOIN ppo.audit_events a ON (a.workspace_id,a.actor_id,a.operation_id)=(r.workspace_id,r.actor_id,r.operation_id)
   JOIN ppo.outbox_jobs j ON (j.workspace_id,j.actor_id,j.operation_id)=(r.workspace_id,r.actor_id,r.operation_id)
   WHERE r.workspace_id=NEW.workspace_id AND r.actor_id=NEW.created_by AND r.operation_id=NEW.operation_id AND r.record_id=NEW.project_id
   AND r.result->>'record_id'=NEW.project_id::text AND (r.result->>'record_version')::integer=NEW.project_version AND r.result->>'state'=state
   AND a.object_type='Project' AND a.object_id=NEW.project_id AND a.outcome='Accepted' AND a.reason=NEW.reason
   AND a.details->>'command'=command AND a.details->'programme_snapshot'=to_jsonb(NEW) AND (a.details->>'record_version')::integer=NEW.project_version
   AND j.kind='SharedRecordUpdated' AND j.payload->>'record_id'=NEW.project_id::text AND j.payload->>'object_type'='Project' AND (j.payload->>'record_version')::integer=NEW.project_version)
 THEN RAISE EXCEPTION 'Exact programme revision, schedule event, receipt, audit and outbox required' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE FUNCTION ppo.check_project_programme_event() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF (NEW.event_type='ProjectCalendarRecorded' AND NOT EXISTS(SELECT 1 FROM ppo.project_calendar_revisions r WHERE (r.workspace_id,r.project_id,r.project_version,r.created_by,r.operation_id)=(NEW.workspace_id,NEW.project_id,NEW.project_version,NEW.created_by,NEW.operation_id)))
 OR (NEW.event_type='ProjectActualsRecorded' AND NOT EXISTS(SELECT 1 FROM ppo.project_task_actual_revisions r WHERE (r.workspace_id,r.project_id,r.project_version,r.created_by,r.operation_id)=(NEW.workspace_id,NEW.project_id,NEW.project_version,NEW.created_by,NEW.operation_id)))
 THEN RAISE EXCEPTION 'Programme event requires its typed revision' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER programme_event AFTER INSERT ON ppo.project_schedule_events DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_project_programme_event();
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['project_calendar_revisions','project_task_actual_revisions'] LOOP
  EXECUTE format('CREATE TRIGGER programme_guard BEFORE INSERT ON ppo.%I FOR EACH ROW EXECUTE FUNCTION ppo.guard_project_programme()',t);
  EXECUTE format('CREATE TRIGGER programme_immutable BEFORE UPDATE OR DELETE ON ppo.%I FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence()',t);
  EXECUTE format('CREATE CONSTRAINT TRIGGER programme_evidence AFTER INSERT ON ppo.%I DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_project_programme_evidence()',t);
 END LOOP;
END $$;

ALTER TABLE ppo.project_schedule_baselines DROP CONSTRAINT project_schedule_baselines_calendar_key_check;
ALTER TABLE ppo.project_schedule_baselines ADD CONSTRAINT project_schedule_baselines_calendar_key_check CHECK(calendar_key IN ('PPO-PJ-CALENDAR-01','PPO-PJ-CALENDAR-02'));
CREATE TABLE ppo.project_baseline_calendars (
 baseline_id uuid PRIMARY KEY REFERENCES ppo.project_schedule_baselines(id),
 calendar_id uuid NOT NULL REFERENCES ppo.project_calendar_revisions(id)
);
CREATE TRIGGER baseline_calendar_immutable BEFORE UPDATE OR DELETE ON ppo.project_baseline_calendars FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.check_project_baseline_calendar() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE b ppo.project_schedule_baselines; current_calendar uuid; saved uuid;
BEGIN
 IF TG_TABLE_NAME='project_schedule_baselines' THEN b:=NEW;
 ELSE SELECT * INTO STRICT b FROM ppo.project_schedule_baselines WHERE id=NEW.baseline_id; END IF;
 SELECT id INTO current_calendar FROM ppo.project_calendar_revisions WHERE workspace_id=b.workspace_id AND project_id=b.project_id ORDER BY revision DESC LIMIT 1;
 SELECT calendar_id INTO saved FROM ppo.project_baseline_calendars WHERE baseline_id=b.id;
 IF (current_calendar IS NULL AND (b.calendar_key<>'PPO-PJ-CALENDAR-01' OR saved IS NOT NULL))
 OR (current_calendar IS NOT NULL AND (b.calendar_key<>'PPO-PJ-CALENDAR-02' OR saved IS DISTINCT FROM current_calendar))
 THEN RAISE EXCEPTION 'Baseline requires its exact current calendar revision' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER baseline_calendar_evidence AFTER INSERT ON ppo.project_schedule_baselines DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_project_baseline_calendar();
CREATE CONSTRAINT TRIGGER baseline_calendar_evidence AFTER INSERT ON ppo.project_baseline_calendars DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_project_baseline_calendar();
