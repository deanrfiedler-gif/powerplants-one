-- PJ-03 / PRJ-02: independent immutable baseline revisions; no existing row rewrites.
CREATE TABLE ppo.project_schedule_baselines (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, project_id uuid NOT NULL,
 revision integer NOT NULL CHECK(revision>0), project_version integer NOT NULL CHECK(project_version>0),
 label text NOT NULL CHECK(length(btrim(label)) BETWEEN 1 AND 120),
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),
 calendar_key text NOT NULL CHECK(calendar_key='PPO-PJ-CALENDAR-01'),
 snapshot jsonb NOT NULL CHECK(jsonb_typeof(snapshot)='array' AND jsonb_array_length(snapshot) BETWEEN 1 AND 1000),
 created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp() CHECK(isfinite(created_at)),
 operation_id uuid NOT NULL, synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 UNIQUE(workspace_id,project_id,revision), UNIQUE(workspace_id,created_by,operation_id),
 FOREIGN KEY(workspace_id,company_id,project_id) REFERENCES ppo.projects(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE FUNCTION ppo.project_baseline_snapshot(w uuid,p uuid) RETURNS jsonb LANGUAGE sql STABLE AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object(
  'id',t.id,'version',t.version,'title',t.title,'phase',t.phase,'status',t.status,
  'milestone',t.milestone,'start_date',t.start_date::text,'finish_date',t.finish_date::text,'progress',t.progress,
  'dependencies',coalesce((SELECT jsonb_agg(jsonb_build_object('task_id',d.predecessor_id,'kind',d.kind) ORDER BY d.predecessor_id)
    FROM ppo.project_dependencies d WHERE d.workspace_id=w AND d.project_id=p AND d.task_id=t.id),'[]'::jsonb)
 ) ORDER BY t.id),'[]'::jsonb) FROM ppo.project_tasks t WHERE t.workspace_id=w AND t.project_id=p
$$;
CREATE FUNCTION ppo.guard_project_baseline() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE p ppo.projects; previous integer;
BEGIN
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 SELECT * INTO STRICT p FROM ppo.projects WHERE workspace_id=NEW.workspace_id AND id=NEW.project_id;
 SELECT coalesce(max(revision),0) INTO previous FROM ppo.project_schedule_baselines WHERE workspace_id=NEW.workspace_id AND project_id=NEW.project_id;
 IF p.lifecycle<>'Active' OR p.version<>NEW.project_version OR p.coordinator_id<>NEW.created_by OR NEW.revision<>previous+1
  OR NEW.snapshot<>ppo.project_baseline_snapshot(NEW.workspace_id,NEW.project_id)
  OR EXISTS(SELECT 1 FROM ppo.project_tasks WHERE workspace_id=NEW.workspace_id AND project_id=NEW.project_id AND (start_date IS NULL OR finish_date IS NULL))
 THEN RAISE EXCEPTION 'A baseline requires the current coordinator, dated schedule and next revision' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER baseline_guard BEFORE INSERT ON ppo.project_schedule_baselines FOR EACH ROW EXECUTE FUNCTION ppo.guard_project_baseline();
CREATE TRIGGER baseline_immutable BEFORE UPDATE OR DELETE ON ppo.project_schedule_baselines FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.check_project_baseline_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.snapshot<>ppo.project_baseline_snapshot(NEW.workspace_id,NEW.project_id)
 OR NOT EXISTS(SELECT 1 FROM ppo.projects WHERE workspace_id=NEW.workspace_id AND id=NEW.project_id AND version=NEW.project_version AND lifecycle='Active')
 OR NOT EXISTS(
  SELECT 1 FROM ppo.operation_receipts r JOIN ppo.audit_events a
   ON (a.workspace_id,a.actor_id,a.operation_id)=(r.workspace_id,r.actor_id,r.operation_id)
  JOIN ppo.outbox_jobs j ON (j.workspace_id,j.actor_id,j.operation_id)=(r.workspace_id,r.actor_id,r.operation_id)
  WHERE r.workspace_id=NEW.workspace_id AND r.actor_id=NEW.created_by AND r.operation_id=NEW.operation_id AND r.record_id=NEW.project_id
   AND r.result->>'record_id'=NEW.project_id::text AND (r.result->>'record_version')::integer=NEW.project_version AND r.result->>'state'='BaselineRecorded'
   AND a.object_type='Project' AND a.object_id=NEW.project_id AND a.outcome='Accepted' AND a.reason=NEW.reason
   AND a.details->>'command'='RecordProjectBaseline' AND a.details->>'baseline_id'=NEW.id::text
   AND (a.details->>'baseline_revision')::integer=NEW.revision AND (a.details->>'record_version')::integer=NEW.project_version
   AND j.kind='SharedRecordUpdated' AND j.payload->>'record_id'=NEW.project_id::text
   AND j.payload->>'object_type'='Project' AND (j.payload->>'record_version')::integer=NEW.project_version
 ) THEN RAISE EXCEPTION 'Exact baseline, original receipt, audit and outbox evidence required' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER baseline_evidence AFTER INSERT ON ppo.project_schedule_baselines DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_project_baseline_evidence();
