-- DK-03: additive synthetic evidence only. Native services retain issue authority.
DO $$ DECLARE definition text; BEGIN
 SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid='ppo.outbox_jobs'::regclass AND conname='ck_outbox_kind';
 ALTER TABLE ppo.outbox_jobs DROP CONSTRAINT ck_outbox_kind;
 EXECUTE format('ALTER TABLE ppo.outbox_jobs ADD CONSTRAINT ck_outbox_kind CHECK ((%s) OR kind IN (''OutputDistributionPrepared'',''OutputDistributionRecorded'',''OutputDistributionReconciled''))',substring(definition from 8 for length(definition)-8));
END $$;
CREATE TABLE ppo.output_distribution_attempts (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL,
 kind text NOT NULL CHECK(kind IN ('JobPack','ServiceReport')),
 output_id uuid NOT NULL, issue_id uuid NOT NULL, recipient_id uuid NOT NULL,
 output_hash text NOT NULL CHECK(output_hash ~ '^[a-f0-9]{64}$'),
 channel text NOT NULL DEFAULT 'Synthetic' CHECK(channel='Synthetic'),
 actor_id uuid NOT NULL, recovery_owner_id uuid NOT NULL, operation_id uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,actor_id,operation_id),
 FOREIGN KEY(workspace_id,output_id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,recovery_owner_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE INDEX output_distribution_source ON ppo.output_distribution_attempts(workspace_id,kind,output_id,issue_id,recipient_id);
CREATE TABLE ppo.output_distribution_events (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, attempt_id uuid NOT NULL,
 version integer NOT NULL CHECK(version>0),
 state text NOT NULL CHECK(state IN ('Prepared','OutcomeUnknown','SimulatedSent','SimulatedNotSent')),
 action text NOT NULL CHECK(action IN ('Prepare','Record','Reconcile')),
 actor_id uuid NOT NULL, operation_id uuid NOT NULL,
 reason text NOT NULL CHECK(length(reason) BETWEEN 1 AND 2000),
 evidence text NOT NULL CHECK(length(evidence) BETWEEN 1 AND 2000),
 occurred_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,attempt_id,version), UNIQUE(workspace_id,actor_id,operation_id),
 FOREIGN KEY(workspace_id,attempt_id) REFERENCES ppo.output_distribution_attempts(workspace_id,id),
 FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE FUNCTION ppo.guard_output_distribution_attempt() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 IF NEW.kind='JobPack' THEN
  IF NOT EXISTS(SELECT 1 FROM ppo.pack_issues i JOIN ppo.pack_recipients r ON r.workspace_id=i.workspace_id AND r.issue_id=i.id WHERE i.workspace_id=NEW.workspace_id AND i.pack_id=NEW.output_id AND i.id=NEW.issue_id AND r.id=NEW.recipient_id AND i.output_hash=NEW.output_hash) THEN
   RAISE EXCEPTION 'Exact pack issue/recipient required' USING ERRCODE='23514';
  END IF;
  IF EXISTS(SELECT 1 FROM ppo.pack_distribution_events WHERE workspace_id=NEW.workspace_id AND recipient_id=NEW.recipient_id AND kind='SimulatedSent') THEN
   RAISE EXCEPTION 'Native simulated send already recorded for recipient' USING ERRCODE='23514';
  END IF;
 ELSE
  IF NOT EXISTS(SELECT 1 FROM ppo.report_issues i WHERE i.workspace_id=NEW.workspace_id AND i.report_id=NEW.output_id AND i.id=NEW.issue_id AND i.recipient_id=NEW.recipient_id AND i.output_hash=NEW.output_hash) THEN
   RAISE EXCEPTION 'Exact report issue/recipient required' USING ERRCODE='23514';
  END IF;
 END IF;
 IF EXISTS(SELECT 1 FROM ppo.output_distribution_attempts a WHERE a.workspace_id=NEW.workspace_id AND a.kind=NEW.kind AND a.issue_id=NEW.issue_id AND a.recipient_id=NEW.recipient_id AND COALESCE((SELECT e.state FROM ppo.output_distribution_events e WHERE e.workspace_id=a.workspace_id AND e.attempt_id=a.id ORDER BY e.version DESC LIMIT 1),'Prepared') <> 'SimulatedNotSent') THEN
  RAISE EXCEPTION 'Recover the existing recipient attempt' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE FUNCTION ppo.guard_output_distribution_event() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE previous ppo.output_distribution_events; a ppo.output_distribution_attempts;
BEGIN
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 SELECT * INTO STRICT a FROM ppo.output_distribution_attempts WHERE workspace_id=NEW.workspace_id AND id=NEW.attempt_id;
 SELECT * INTO previous FROM ppo.output_distribution_events WHERE workspace_id=NEW.workspace_id AND attempt_id=NEW.attempt_id ORDER BY version DESC LIMIT 1;
 IF NEW.version<>COALESCE(previous.version,0)+1 OR
    (previous.id IS NULL AND (NEW.action<>'Prepare' OR NEW.state<>'Prepared' OR NEW.actor_id<>a.actor_id OR NEW.operation_id<>a.operation_id)) OR
    (previous.id IS NOT NULL AND NOT (
       (previous.state='Prepared' AND NEW.action='Record' AND NEW.state IN ('OutcomeUnknown','SimulatedSent','SimulatedNotSent')) OR
       (previous.state='OutcomeUnknown' AND NEW.action='Reconcile' AND NEW.state IN ('SimulatedSent','SimulatedNotSent')))) THEN
  RAISE EXCEPTION 'Invalid distribution transition' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE FUNCTION ppo.output_distribution_initial_event() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM ppo.output_distribution_events WHERE workspace_id=NEW.workspace_id AND attempt_id=NEW.id AND version=1) THEN
  RAISE EXCEPTION 'Distribution preparation requires its original event' USING ERRCODE='23514';
 END IF;
 RETURN NULL;
END $$;
CREATE TRIGGER output_distribution_attempt_guard BEFORE INSERT ON ppo.output_distribution_attempts FOR EACH ROW EXECUTE FUNCTION ppo.guard_output_distribution_attempt();
CREATE TRIGGER output_distribution_event_guard BEFORE INSERT ON ppo.output_distribution_events FOR EACH ROW EXECUTE FUNCTION ppo.guard_output_distribution_event();
CREATE CONSTRAINT TRIGGER output_distribution_initial AFTER INSERT ON ppo.output_distribution_attempts DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.output_distribution_initial_event();
CREATE TRIGGER output_distribution_attempt_retained BEFORE UPDATE OR DELETE ON ppo.output_distribution_attempts FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TRIGGER output_distribution_event_retained BEFORE UPDATE OR DELETE ON ppo.output_distribution_events FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
-- The existing native simulation route cannot bypass an unresolved DK-03 attempt.
CREATE FUNCTION ppo.guard_native_pack_distribution() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.kind='SimulatedSent' THEN
  PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
  IF EXISTS(SELECT 1 FROM ppo.output_distribution_attempts a WHERE a.workspace_id=NEW.workspace_id AND a.kind='JobPack' AND a.recipient_id=NEW.recipient_id AND COALESCE((SELECT e.state FROM ppo.output_distribution_events e WHERE e.workspace_id=a.workspace_id AND e.attempt_id=a.id ORDER BY e.version DESC LIMIT 1),'Prepared')<>'SimulatedNotSent') THEN
   RAISE EXCEPTION 'Recover the original distribution attempt' USING ERRCODE='23514';
  END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER native_pack_distribution_guard BEFORE INSERT ON ppo.pack_distribution_events FOR EACH ROW EXECUTE FUNCTION ppo.guard_native_pack_distribution();
