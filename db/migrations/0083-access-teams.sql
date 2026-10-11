-- AD-01 local team creation: no access inheritance or review-routing authority.
DO $$ DECLARE item record; definition text; BEGIN
 FOR item IN SELECT * FROM (VALUES
  ('permission_grants','ck_grants_capability','capability','admin.access.team.create'),
  ('audit_events','ck_audit_object_type','object_type','AccessTeam')
 ) AS v(tab,con,col,added) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint
   WHERE conrelid=('ppo.'||item.tab)::regclass AND conname=item.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',item.tab,item.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR %I=%L)',
   item.tab,item.con,substring(definition from 8 for length(definition)-8),item.col,item.added);
 END LOOP;
END $$;
ALTER TABLE ppo.permission_grants ADD CONSTRAINT ck_access_team_create_workspace
 CHECK(capability<>'admin.access.team.create' OR scope_type='Workspace');
CREATE TABLE ppo.access_teams (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES ppo.workspaces(id),
 name text NOT NULL CHECK(length(btrim(name)) BETWEEN 1 AND 100),
 purpose text NOT NULL CHECK(length(btrim(purpose)) BETWEEN 10 AND 1000),
 lead_id uuid NOT NULL, created_by uuid NOT NULL,
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 10 AND 1000),
 created_at timestamptz NOT NULL DEFAULT date_trunc('milliseconds',clock_timestamp()),
 state text NOT NULL DEFAULT 'Recorded' CHECK(state='Recorded'),
 version integer NOT NULL DEFAULT 1 CHECK(version=1),
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 UNIQUE(workspace_id,id),
 FOREIGN KEY(workspace_id,lead_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE INDEX access_team_queue ON ppo.access_teams(workspace_id,created_at DESC,id);
CREATE TABLE ppo.access_team_members (
 workspace_id uuid NOT NULL, team_id uuid NOT NULL, user_id uuid NOT NULL,
 PRIMARY KEY(workspace_id,team_id,user_id),
 FOREIGN KEY(workspace_id,team_id) REFERENCES ppo.access_teams(workspace_id,id),
 FOREIGN KEY(workspace_id,user_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.access_team_operations (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, actor_id uuid NOT NULL, operation_id uuid NOT NULL,
 team_id uuid NOT NULL UNIQUE, command text NOT NULL CHECK(command='CreateTeam'),
 payload_hash text NOT NULL CHECK(payload_hash ~ '^[a-f0-9]{64}$'),
 audit_id uuid NOT NULL UNIQUE REFERENCES ppo.audit_events(id), snapshot jsonb NOT NULL, receipt jsonb NOT NULL,
 UNIQUE(workspace_id,actor_id,operation_id),
 FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,team_id) REFERENCES ppo.access_teams(workspace_id,id)
);
CREATE TRIGGER access_team_retained BEFORE UPDATE OR DELETE ON ppo.access_teams
 FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TRIGGER access_team_member_retained BEFORE UPDATE OR DELETE ON ppo.access_team_members
 FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TRIGGER access_team_operation_retained BEFORE UPDATE OR DELETE ON ppo.access_team_operations
 FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.check_access_team_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE team_key uuid; t ppo.access_teams; e ppo.access_team_operations; a ppo.audit_events; members jsonb; expected jsonb;
BEGIN
 IF TG_TABLE_NAME='access_teams' THEN team_key:=NEW.id; ELSE team_key:=NEW.team_id; END IF;
 SELECT * INTO STRICT t FROM ppo.access_teams WHERE workspace_id=NEW.workspace_id AND id=team_key;
 SELECT * INTO e FROM ppo.access_team_operations WHERE workspace_id=t.workspace_id AND team_id=t.id;
 SELECT * INTO a FROM ppo.audit_events WHERE id=e.audit_id;
 SELECT coalesce(jsonb_agg(to_jsonb(m) ORDER BY m.user_id),'[]'::jsonb) INTO members
  FROM ppo.access_team_members m WHERE m.workspace_id=t.workspace_id AND m.team_id=t.id;
 expected:=jsonb_build_object('team',to_jsonb(t),'members',members);
 IF jsonb_array_length(members) NOT BETWEEN 1 AND 20 OR e.id IS NULL
  OR e.snapshot IS DISTINCT FROM expected OR e.actor_id IS DISTINCT FROM t.created_by
  OR a.workspace_id IS DISTINCT FROM t.workspace_id OR a.actor_id IS DISTINCT FROM t.created_by
  OR a.object_type IS DISTINCT FROM 'AccessTeam' OR a.object_id IS DISTINCT FROM t.id
  OR a.operation_id IS DISTINCT FROM e.operation_id OR a.outcome IS DISTINCT FROM 'Accepted'
  OR a.reason IS DISTINCT FROM t.reason OR a.details IS DISTINCT FROM expected
  OR e.receipt IS DISTINCT FROM jsonb_build_object('receipt_id',e.id,'operation_id',e.operation_id,
    'record_id',t.id,'record_version',1,'state','Recorded','accepted_at',e.receipt->'accepted_at',
    'warnings','[]'::jsonb,'task_ids','[]'::jsonb)
  OR (e.receipt->>'accepted_at')::timestamptz IS DISTINCT FROM t.created_at THEN
  RAISE EXCEPTION 'Exact original team, roster, audit and receipt required' USING ERRCODE='23514';
 END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER access_team_evidence AFTER INSERT ON ppo.access_teams
 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_access_team_evidence();
CREATE CONSTRAINT TRIGGER access_team_member_evidence AFTER INSERT ON ppo.access_team_members
 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_access_team_evidence();
CREATE CONSTRAINT TRIGGER access_team_operation_evidence AFTER INSERT ON ppo.access_team_operations
 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_access_team_evidence();
