-- AD-01 immutable local Keep observations. No permission or team changes.
DO $$ DECLARE item record; definition text; BEGIN
 FOR item IN SELECT * FROM (VALUES
  ('permission_grants','ck_grants_capability','capability','admin.access.review.attest'),
  ('audit_events','ck_audit_object_type','object_type','AccessReview')
 ) AS v(tab,con,col,added) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint
   WHERE conrelid=('ppo.'||item.tab)::regclass AND conname=item.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',item.tab,item.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR %I=%L)',
   item.tab,item.con,substring(definition from 8 for length(definition)-8),item.col,item.added);
 END LOOP;
END $$;
ALTER TABLE ppo.permission_grants ADD CONSTRAINT ck_access_review_workspace
 CHECK(capability<>'admin.access.review.attest' OR scope_type='Workspace');
CREATE TABLE ppo.access_review_attestations (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES ppo.workspaces(id),
 team_id uuid NOT NULL, subject_id uuid NOT NULL, grant_id uuid NOT NULL,
 actor_id uuid NOT NULL, decision text NOT NULL DEFAULT 'Keep' CHECK(decision='Keep'),
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 10 AND 1000),
 basis_hash text NOT NULL CHECK(basis_hash ~ '^[a-f0-9]{64}$'), basis_snapshot jsonb NOT NULL,
 checked_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT date_trunc('milliseconds',clock_timestamp()),
 state text NOT NULL DEFAULT 'Recorded' CHECK(state='Recorded'),
 version integer NOT NULL DEFAULT 1 CHECK(version=1),
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic), CHECK(actor_id<>subject_id),
 UNIQUE(workspace_id,id),
 FOREIGN KEY(workspace_id,team_id,subject_id) REFERENCES ppo.access_team_members(workspace_id,team_id,user_id),
 FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE INDEX access_review_queue ON ppo.access_review_attestations(workspace_id,created_at DESC,id);
CREATE TABLE ppo.access_review_operations (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, actor_id uuid NOT NULL, operation_id uuid NOT NULL,
 attestation_id uuid NOT NULL UNIQUE, command text NOT NULL DEFAULT 'RecordAttestation' CHECK(command='RecordAttestation'),
 payload_hash text NOT NULL CHECK(payload_hash ~ '^[a-f0-9]{64}$'),
 audit_id uuid NOT NULL UNIQUE REFERENCES ppo.audit_events(id), snapshot jsonb NOT NULL, receipt jsonb NOT NULL,
 UNIQUE(workspace_id,actor_id,operation_id),
 FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,attestation_id) REFERENCES ppo.access_review_attestations(workspace_id,id)
);
CREATE TRIGGER access_review_retained BEFORE UPDATE OR DELETE ON ppo.access_review_attestations
 FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TRIGGER access_review_operation_retained BEFORE UPDATE OR DELETE ON ppo.access_review_operations
 FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.check_access_review_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE review_key uuid; r ppo.access_review_attestations; e ppo.access_review_operations; a ppo.audit_events;
 expected jsonb; original_basis jsonb;
BEGIN
 IF TG_TABLE_NAME='access_review_attestations' THEN review_key:=NEW.id; ELSE review_key:=NEW.attestation_id; END IF;
 SELECT * INTO STRICT r FROM ppo.access_review_attestations WHERE workspace_id=NEW.workspace_id AND id=review_key;
 SELECT * INTO e FROM ppo.access_review_operations WHERE workspace_id=r.workspace_id AND attestation_id=r.id;
 SELECT * INTO a FROM ppo.audit_events WHERE id=e.audit_id;
 expected:=to_jsonb(r);
 -- Check the original basis only at insertion; later grant edits/removal must not rewrite history.
 SELECT jsonb_build_object('team',jsonb_build_object('id',t.id,'version',t.version),
   'subject',jsonb_build_object('id',u.id,'active',u.active,'issuer',u.issuer),
   'grant',to_jsonb(g),'row_state','Current') INTO original_basis
 FROM ppo.access_teams t JOIN ppo.users u ON u.workspace_id=t.workspace_id AND u.id=r.subject_id
 JOIN ppo.permission_grants g ON (g.workspace_id,g.user_id)=(u.workspace_id,u.id) AND g.id=r.grant_id
 JOIN ppo.users actor ON actor.workspace_id=t.workspace_id AND actor.id=r.actor_id
 WHERE t.workspace_id=r.workspace_id AND t.id=r.team_id AND u.active AND u.issuer='PPO-LocalSynthetic'
   AND actor.active AND actor.issuer='PPO-LocalSynthetic'
   AND g.valid_from<=r.checked_at AND (g.valid_to IS NULL OR g.valid_to>r.checked_at);
 IF original_basis IS NULL OR r.basis_snapshot IS DISTINCT FROM original_basis OR e.id IS NULL
  OR e.snapshot IS DISTINCT FROM expected OR e.actor_id IS DISTINCT FROM r.actor_id
  OR a.workspace_id IS DISTINCT FROM r.workspace_id OR a.actor_id IS DISTINCT FROM r.actor_id
  OR a.object_type IS DISTINCT FROM 'AccessReview' OR a.object_id IS DISTINCT FROM r.id
  OR a.operation_id IS DISTINCT FROM e.operation_id OR a.outcome IS DISTINCT FROM 'Accepted'
  OR a.reason IS DISTINCT FROM r.reason OR a.details IS DISTINCT FROM expected
  OR e.receipt IS DISTINCT FROM jsonb_build_object('receipt_id',e.id,'operation_id',e.operation_id,
    'record_id',r.id,'record_version',1,'state','Recorded','accepted_at',e.receipt->'accepted_at',
    'warnings','[]'::jsonb,'task_ids','[]'::jsonb)
  OR (e.receipt->>'accepted_at')::timestamptz IS DISTINCT FROM r.created_at THEN
  RAISE EXCEPTION 'Exact original review basis, audit and receipt required' USING ERRCODE='23514';
 END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER access_review_evidence AFTER INSERT ON ppo.access_review_attestations
 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_access_review_evidence();
CREATE CONSTRAINT TRIGGER access_review_operation_evidence AFTER INSERT ON ppo.access_review_operations
 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_access_review_evidence();
