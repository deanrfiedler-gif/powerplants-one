-- AD-01: install one independently approved local grant with exact retained evidence.
DO $$ DECLARE definition text; item record; BEGIN
 SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint
 WHERE conrelid='ppo.permission_grants'::regclass AND conname='ck_grants_capability';
 ALTER TABLE ppo.permission_grants DROP CONSTRAINT ck_grants_capability;
 EXECUTE format('ALTER TABLE ppo.permission_grants ADD CONSTRAINT ck_grants_capability CHECK ((%s) OR capability=%L)',
  substring(definition from 8 for length(definition)-8),'admin.access.apply');
 FOR item IN SELECT conname FROM pg_constraint WHERE conrelid='ppo.access_change_requests'::regclass
  AND contype='c' AND pg_get_constraintdef(oid) LIKE '%state%' LOOP
  EXECUTE format('ALTER TABLE ppo.access_change_requests DROP CONSTRAINT %I',item.conname);
 END LOOP;
 FOR item IN SELECT conname FROM pg_constraint WHERE conrelid='ppo.access_change_operations'::regclass
  AND contype='c' AND (pg_get_constraintdef(oid) LIKE '%request_version%' OR pg_get_constraintdef(oid) LIKE '%command%') LOOP
  EXECUTE format('ALTER TABLE ppo.access_change_operations DROP CONSTRAINT %I',item.conname);
 END LOOP;
END $$;
ALTER TABLE ppo.permission_grants ADD CONSTRAINT ck_access_apply_workspace
 CHECK(capability<>'admin.access.apply' OR scope_type='Workspace');
ALTER TABLE ppo.access_change_requests
 ADD COLUMN applied_by uuid,
 ADD COLUMN applied_at timestamptz,
 ADD COLUMN application_reason text,
 ADD COLUMN grant_id uuid UNIQUE REFERENCES ppo.permission_grants(id),
 ADD COLUMN grant_snapshot jsonb,
 ADD FOREIGN KEY(workspace_id,applied_by) REFERENCES ppo.users(workspace_id,id),
 ADD CONSTRAINT ck_access_application_state CHECK(
  (state='Submitted' AND version=1 AND decided_at IS NULL AND decision_reason IS NULL)
  OR (state IN ('Approved','Returned') AND version=2 AND decided_at IS NOT NULL
   AND decision_reason IS NOT NULL AND length(btrim(decision_reason)) BETWEEN 10 AND 1000)
  OR (state='Applied' AND version=3 AND decided_at IS NOT NULL AND decision_reason IS NOT NULL
   AND length(btrim(decision_reason)) BETWEEN 10 AND 1000)),
 ADD CONSTRAINT ck_access_application_evidence CHECK(
  (state<>'Applied' AND applied_by IS NULL AND applied_at IS NULL AND application_reason IS NULL AND grant_id IS NULL AND grant_snapshot IS NULL)
  OR (state='Applied' AND applied_by IS NOT NULL AND applied_by<>subject_id AND applied_by<>reviewer_id
   AND applied_at IS NOT NULL AND applied_at>=decided_at AND applied_at<valid_from
   AND application_reason IS NOT NULL AND length(btrim(application_reason)) BETWEEN 10 AND 1000
   AND grant_id IS NOT NULL AND grant_snapshot IS NOT NULL AND jsonb_typeof(grant_snapshot)='object'));
ALTER TABLE ppo.access_change_operations
 ADD CHECK(request_version IN (1,2,3)), ADD CHECK(command IN ('Submit','Decide','Apply'));

CREATE OR REPLACE FUNCTION ppo.protect_access_request() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='INSERT' THEN
  IF NEW.state<>'Submitted' OR NEW.version<>1 THEN RAISE EXCEPTION 'Submit a new request' USING ERRCODE='23514'; END IF;
 ELSIF OLD.state='Submitted' AND NEW.state IN ('Approved','Returned') AND NEW.version=2
  AND (to_jsonb(NEW)-ARRAY['state','version','decided_at','decision_reason']) IS NOT DISTINCT FROM
      (to_jsonb(OLD)-ARRAY['state','version','decided_at','decision_reason']) THEN NULL;
 ELSIF OLD.state='Approved' AND NEW.state='Applied' AND NEW.version=3
  AND (to_jsonb(NEW)-ARRAY['state','version','applied_by','applied_at','application_reason','grant_id','grant_snapshot']) IS NOT DISTINCT FROM
      (to_jsonb(OLD)-ARRAY['state','version','applied_by','applied_at','application_reason','grant_id','grant_snapshot']) THEN NULL;
 ELSE RAISE EXCEPTION 'Retain the exact proposal, decision and application' USING ERRCODE='55000';
 END IF;
 RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION ppo.check_access_request_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE e ppo.access_change_operations; a ppo.audit_events; expected_actor uuid; g ppo.permission_grants;
BEGIN
 SELECT * INTO e FROM ppo.access_change_operations
 WHERE workspace_id=NEW.workspace_id AND request_id=NEW.id AND request_version=NEW.version;
 expected_actor:=CASE NEW.version WHEN 1 THEN NEW.requester_id WHEN 2 THEN NEW.reviewer_id ELSE NEW.applied_by END;
 SELECT * INTO a FROM ppo.audit_events WHERE id=e.audit_id;
 IF e.id IS NULL OR e.snapshot<>to_jsonb(NEW) OR e.actor_id<>expected_actor
  OR e.command<>(CASE NEW.version WHEN 1 THEN 'Submit' WHEN 2 THEN 'Decide' ELSE 'Apply' END)
  OR a.workspace_id IS DISTINCT FROM NEW.workspace_id OR a.actor_id IS DISTINCT FROM expected_actor
  OR a.object_type IS DISTINCT FROM 'AccessChangeRequest' OR a.object_id IS DISTINCT FROM NEW.id
  OR a.operation_id IS DISTINCT FROM e.operation_id OR a.details IS DISTINCT FROM e.snapshot
  OR a.reason IS DISTINCT FROM (CASE NEW.version WHEN 1 THEN NEW.reason WHEN 2 THEN NEW.decision_reason ELSE NEW.application_reason END) THEN
  RAISE EXCEPTION 'Exact access request evidence required' USING ERRCODE='23514';
 END IF;
 IF NEW.version=3 THEN
  SELECT * INTO g FROM ppo.permission_grants WHERE id=NEW.grant_id;
  IF g.id IS NULL OR to_jsonb(g) IS DISTINCT FROM NEW.grant_snapshot
   OR (g.workspace_id,g.user_id,g.capability,g.scope_type,g.scope_id,g.company_id,g.site_id,g.valid_from,g.valid_to)
    IS DISTINCT FROM (NEW.workspace_id,NEW.subject_id,NEW.capability,NEW.scope_type,NEW.scope_id,NEW.company_id,NEW.site_id,NEW.valid_from,NEW.valid_to) THEN
   RAISE EXCEPTION 'Application must install the exact approved grant' USING ERRCODE='23514';
  END IF;
 END IF;
 RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION ppo.check_access_operation_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE r ppo.access_change_requests; a ppo.audit_events;
 mutable text[]:=ARRAY['state','version','decided_at','decision_reason','applied_by','applied_at','application_reason','grant_id','grant_snapshot'];
BEGIN
 SELECT * INTO STRICT r FROM ppo.access_change_requests WHERE workspace_id=NEW.workspace_id AND id=NEW.request_id;
 SELECT * INTO STRICT a FROM ppo.audit_events WHERE id=NEW.audit_id;
 IF NEW.request_version>r.version
  OR (NEW.snapshot-mutable) IS DISTINCT FROM (to_jsonb(r)-mutable)
  OR (NEW.snapshot->>'version')::integer IS DISTINCT FROM NEW.request_version
  OR NEW.actor_id IS DISTINCT FROM (CASE NEW.request_version WHEN 1 THEN r.requester_id WHEN 2 THEN r.reviewer_id ELSE r.applied_by END)
  OR NEW.command IS DISTINCT FROM (CASE NEW.request_version WHEN 1 THEN 'Submit' WHEN 2 THEN 'Decide' ELSE 'Apply' END)
  OR a.workspace_id<>NEW.workspace_id OR a.actor_id<>NEW.actor_id OR a.operation_id IS DISTINCT FROM NEW.operation_id
  OR a.object_type<>'AccessChangeRequest' OR a.object_id<>NEW.request_id OR a.details<>NEW.snapshot
  OR NEW.receipt->>'receipt_id' IS DISTINCT FROM NEW.id::text
  OR NEW.receipt->>'operation_id' IS DISTINCT FROM NEW.operation_id::text
  OR NEW.receipt->>'record_id' IS DISTINCT FROM NEW.request_id::text
  OR (NEW.receipt->>'record_version')::integer IS DISTINCT FROM NEW.request_version
  OR NEW.receipt->>'state' IS DISTINCT FROM NEW.snapshot->>'state'
  OR NEW.receipt->'task_ids' IS DISTINCT FROM '[]'::jsonb
  OR NEW.receipt->'warnings' IS DISTINCT FROM '[]'::jsonb THEN
  RAISE EXCEPTION 'Access receipt must identify its exact accepted evidence' USING ERRCODE='23514';
 END IF;
 RETURN NULL;
END $$;
