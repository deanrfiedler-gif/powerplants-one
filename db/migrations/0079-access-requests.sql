-- AD-01 request/decision evidence only: never mutate an effective grant.
DO $$ DECLARE item record; definition text; BEGIN
 FOR item IN SELECT * FROM (VALUES
  ('permission_grants','ck_grants_capability','capability','admin.access.propose,admin.access.approve'),
  ('audit_events','ck_audit_object_type','object_type','AccessChangeRequest')
 ) AS v(tab,con,col,added) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint
   WHERE conrelid=('ppo.'||item.tab)::regclass AND conname=item.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',item.tab,item.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR %I=ANY(%L::text[]))',
   item.tab,item.con,substring(definition from 8 for length(definition)-8),item.col,string_to_array(item.added,','));
 END LOOP;
END $$;
ALTER TABLE ppo.permission_grants ADD CONSTRAINT ck_access_commands_workspace
 CHECK(capability NOT IN ('admin.access.propose','admin.access.approve') OR scope_type='Workspace');

CREATE TABLE ppo.access_change_requests (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES ppo.workspaces(id),
 subject_id uuid NOT NULL, requester_id uuid NOT NULL, reviewer_id uuid NOT NULL,
 capability text NOT NULL CHECK(capability<>'' AND capability<>'email.connect' AND capability NOT LIKE 'admin.%'),
 scope_type text NOT NULL CHECK(scope_type IN ('Workspace','Company','Site')),
 scope_id uuid NOT NULL, company_id uuid, site_id uuid,
 valid_from timestamptz NOT NULL CHECK(isfinite(valid_from)), valid_to timestamptz CHECK(isfinite(valid_to)),
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 10 AND 1000),
 state text NOT NULL DEFAULT 'Submitted' CHECK(state IN ('Submitted','Approved','Returned')),
 version integer NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 decided_at timestamptz, decision_reason text,
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 UNIQUE(workspace_id,id),
 FOREIGN KEY(workspace_id,subject_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,requester_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,reviewer_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id) REFERENCES ppo.sites(workspace_id,company_id,id),
 CHECK(subject_id<>requester_id AND subject_id<>reviewer_id AND requester_id<>reviewer_id),
 CHECK(valid_to IS NULL OR valid_to>valid_from),
 CHECK((scope_type='Workspace' AND scope_id=workspace_id AND company_id IS NULL AND site_id IS NULL)
  OR (scope_type='Company' AND scope_id=company_id AND company_id IS NOT NULL AND site_id IS NULL)
  OR (scope_type='Site' AND scope_id=site_id AND company_id IS NOT NULL AND site_id IS NOT NULL)),
 CHECK((state='Submitted' AND version=1 AND decided_at IS NULL AND decision_reason IS NULL)
  OR (state IN ('Approved','Returned') AND version=2 AND decided_at IS NOT NULL
    AND length(btrim(decision_reason)) BETWEEN 10 AND 1000 AND decision_reason IS NOT NULL))
);
CREATE UNIQUE INDEX access_pending_grant ON ppo.access_change_requests(workspace_id,subject_id,capability,scope_type,scope_id)
 WHERE state IN ('Submitted','Approved');
CREATE INDEX access_request_queue ON ppo.access_change_requests(workspace_id,created_at DESC,id);
CREATE FUNCTION ppo.protect_access_request() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='INSERT' THEN
  IF NEW.state<>'Submitted' OR NEW.version<>1 THEN RAISE EXCEPTION 'Submit a new request' USING ERRCODE='23514'; END IF;
 ELSIF OLD.state<>'Submitted' OR NEW.state NOT IN ('Approved','Returned') OR NEW.version<>2
  OR (to_jsonb(NEW)-ARRAY['state','version','decided_at','decision_reason']) IS DISTINCT FROM
     (to_jsonb(OLD)-ARRAY['state','version','decided_at','decision_reason']) THEN
  RAISE EXCEPTION 'Retain the exact proposal and decide it once' USING ERRCODE='55000';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER access_request_guard BEFORE INSERT OR UPDATE ON ppo.access_change_requests
 FOR EACH ROW EXECUTE FUNCTION ppo.protect_access_request();
CREATE TRIGGER access_request_retained BEFORE DELETE ON ppo.access_change_requests
 FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

CREATE TABLE ppo.access_change_operations (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, actor_id uuid NOT NULL, operation_id uuid NOT NULL,
 request_id uuid NOT NULL, request_version integer NOT NULL CHECK(request_version IN (1,2)),
 command text NOT NULL CHECK(command IN ('Submit','Decide')),
 payload_hash text NOT NULL CHECK(payload_hash ~ '^[a-f0-9]{64}$'),
 audit_id uuid NOT NULL UNIQUE REFERENCES ppo.audit_events(id),
 snapshot jsonb NOT NULL, receipt jsonb NOT NULL,
 UNIQUE(workspace_id,actor_id,operation_id), UNIQUE(workspace_id,request_id,request_version),
 FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,request_id) REFERENCES ppo.access_change_requests(workspace_id,id)
);
CREATE TRIGGER access_operation_retained BEFORE UPDATE OR DELETE ON ppo.access_change_operations
 FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.check_access_request_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE e ppo.access_change_operations; a ppo.audit_events; expected_actor uuid;
BEGIN
 SELECT * INTO e FROM ppo.access_change_operations
 WHERE workspace_id=NEW.workspace_id AND request_id=NEW.id AND request_version=NEW.version;
 expected_actor:=CASE WHEN NEW.version=1 THEN NEW.requester_id ELSE NEW.reviewer_id END;
 SELECT * INTO a FROM ppo.audit_events WHERE id=e.audit_id;
 IF e.id IS NULL OR e.snapshot<>to_jsonb(NEW) OR e.actor_id<>expected_actor
  OR e.command<>(CASE WHEN NEW.version=1 THEN 'Submit' ELSE 'Decide' END)
  OR a.workspace_id IS DISTINCT FROM NEW.workspace_id OR a.actor_id IS DISTINCT FROM expected_actor
  OR a.object_type IS DISTINCT FROM 'AccessChangeRequest' OR a.object_id IS DISTINCT FROM NEW.id
  OR a.operation_id IS DISTINCT FROM e.operation_id OR a.details IS DISTINCT FROM e.snapshot
  OR a.reason IS DISTINCT FROM (CASE WHEN NEW.version=1 THEN NEW.reason ELSE NEW.decision_reason END) THEN
  RAISE EXCEPTION 'Exact access request evidence required' USING ERRCODE='23514';
 END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER access_request_evidence AFTER INSERT OR UPDATE ON ppo.access_change_requests
 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_access_request_evidence();
CREATE FUNCTION ppo.check_access_operation_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE r ppo.access_change_requests; a ppo.audit_events;
BEGIN
 SELECT * INTO STRICT r FROM ppo.access_change_requests WHERE workspace_id=NEW.workspace_id AND id=NEW.request_id;
 SELECT * INTO STRICT a FROM ppo.audit_events WHERE id=NEW.audit_id;
 IF NEW.request_version>r.version
  OR (NEW.snapshot-ARRAY['state','version','decided_at','decision_reason']) IS DISTINCT FROM
     (to_jsonb(r)-ARRAY['state','version','decided_at','decision_reason'])
  OR (NEW.snapshot->>'version')::integer IS DISTINCT FROM NEW.request_version
  OR NEW.actor_id IS DISTINCT FROM (CASE WHEN NEW.request_version=1 THEN r.requester_id ELSE r.reviewer_id END)
  OR NEW.command IS DISTINCT FROM (CASE WHEN NEW.request_version=1 THEN 'Submit' ELSE 'Decide' END)
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
CREATE CONSTRAINT TRIGGER access_operation_evidence AFTER INSERT ON ppo.access_change_operations
 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_access_operation_evidence();
