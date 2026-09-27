-- Additive FI-01 timer companion. Completed intervals remain ordinary immutable P07 Time entries.
-- No identity-table ALTER, seed, new capability, grant or historical-row rewrite.
CREATE TABLE ppo.field_timers (
 attendance_id uuid PRIMARY KEY, workspace_id uuid NOT NULL, appointment_id uuid NOT NULL, actor_id uuid NOT NULL,
 version integer NOT NULL CHECK(version>0), state text NOT NULL CHECK(state IN ('Running','Paused','Stopped')),
 open_since timestamptz, time_kind text CHECK(time_kind IN ('Labour','Break','Travel','Waiting','Other')),
 scope_item_id uuid NOT NULL, asset_id uuid, pause_reason text, note text,
 last_occurred_at timestamptz NOT NULL CHECK(isfinite(last_occurred_at)), updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,attendance_id), UNIQUE(workspace_id,appointment_id,actor_id,attendance_id),
 FOREIGN KEY(workspace_id,appointment_id,actor_id,attendance_id) REFERENCES ppo.field_attendances(workspace_id,appointment_id,actor_id,id),
 FOREIGN KEY(scope_item_id) REFERENCES ppo.scope_items(id),
 FOREIGN KEY(workspace_id,asset_id) REFERENCES ppo.assets(workspace_id,id),
 CHECK((state='Stopped')=(open_since IS NULL AND time_kind IS NULL)),
 CHECK(state='Stopped' OR (open_since IS NOT NULL AND isfinite(open_since) AND time_kind IS NOT NULL)),
 CHECK(state<>'Running' OR (time_kind='Labour' AND pause_reason IS NULL)),
 CHECK(state<>'Paused' OR (time_kind<>'Labour' AND pause_reason IS NOT NULL)),
 CHECK(pause_reason IS NULL OR pause_reason IN ('Break','Travel','WaitingForParts','WaitingForAccessOrCustomer','WaitingForApproval','UnsafeToContinue','Other')),
 CHECK(pause_reason IS NULL OR pause_reason IN ('Break','Travel') OR (note IS NOT NULL AND length(btrim(note))>0))
);
CREATE UNIQUE INDEX one_personal_work_timer ON ppo.field_timers(workspace_id,actor_id) WHERE state IN ('Running','Paused');

CREATE TABLE ppo.field_timer_events (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, appointment_id uuid NOT NULL, actor_id uuid NOT NULL, attendance_id uuid NOT NULL,
 version integer NOT NULL CHECK(version>0), action text NOT NULL CHECK(action IN ('Start','Pause','Resume','Stop','Undo')),
 state_before text NOT NULL CHECK(state_before IN ('Idle','Running','Paused','Stopped')),
 state_after text NOT NULL CHECK(state_after IN ('Running','Paused','Stopped')),
 occurred_at timestamptz NOT NULL CHECK(isfinite(occurred_at)), received_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 reason text NOT NULL CHECK(length(btrim(reason))>0), note text, pause_reason text,
 open_since timestamptz, time_kind text, scope_item_id uuid NOT NULL, asset_id uuid,
 entry_root_id uuid, undo_event_id uuid, operation_id uuid NOT NULL,
 authority_state text NOT NULL CHECK(authority_state IN ('Current','ReviewRequired')),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,attendance_id,version), UNIQUE(workspace_id,actor_id,operation_id),
 FOREIGN KEY(workspace_id,appointment_id,actor_id,attendance_id) REFERENCES ppo.field_timers(workspace_id,appointment_id,actor_id,attendance_id),
 FOREIGN KEY(workspace_id,appointment_id,entry_root_id) REFERENCES ppo.field_entries(workspace_id,appointment_id,id),
 FOREIGN KEY(workspace_id,undo_event_id) REFERENCES ppo.field_timer_events(workspace_id,id),
 CHECK(occurred_at<=received_at+interval '5 minutes'),
 CHECK(date_trunc('second',occurred_at)=occurred_at),
 CHECK((action='Undo')=(undo_event_id IS NOT NULL))
);
CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON ppo.field_timer_events FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TRIGGER retain_timer BEFORE DELETE ON ppo.field_timers FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.guard_timer_event() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE prior ppo.field_timer_events;
BEGIN
 SELECT * INTO prior FROM ppo.field_timer_events WHERE workspace_id=NEW.workspace_id AND attendance_id=NEW.attendance_id AND version=NEW.version-1;
 IF (NEW.version=1 AND NEW.state_before<>'Idle') OR (NEW.version>1 AND (prior.id IS NULL OR NEW.state_before<>prior.state_after OR NEW.occurred_at<prior.occurred_at))
 OR NOT ((NEW.action='Start' AND NEW.state_before='Idle' AND NEW.state_after='Running')
  OR (NEW.action='Resume' AND NEW.state_before IN ('Paused','Stopped') AND NEW.state_after='Running')
  OR (NEW.action='Pause' AND NEW.state_before='Running' AND NEW.state_after='Paused')
  OR (NEW.action='Stop' AND NEW.state_before IN ('Running','Paused') AND NEW.state_after='Stopped')
  OR (NEW.action='Undo' AND NEW.undo_event_id=prior.id AND prior.action IN ('Pause','Stop') AND NEW.state_after=prior.state_before AND NEW.received_at<=prior.received_at+interval '8 seconds'))
 THEN RAISE EXCEPTION 'Timer events must retain their exact permitted predecessor' USING ERRCODE='23514'; END IF;
 IF NEW.entry_root_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM ppo.field_entries WHERE workspace_id=NEW.workspace_id AND id=NEW.entry_root_id AND root_id=id AND actor_id=NEW.actor_id AND attendance_id=NEW.attendance_id AND kind='Time' AND operation_id=NEW.operation_id) THEN
  RAISE EXCEPTION 'A closed timer stretch must name its own exact original Time entry' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_event BEFORE INSERT ON ppo.field_timer_events FOR EACH ROW EXECUTE FUNCTION ppo.guard_timer_event();
CREATE FUNCTION ppo.guard_field_timer() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF (NEW.workspace_id,NEW.appointment_id,NEW.actor_id,NEW.attendance_id) IS DISTINCT FROM
    (OLD.workspace_id,OLD.appointment_id,OLD.actor_id,OLD.attendance_id) OR NEW.version<>OLD.version+1 OR NEW.last_occurred_at<OLD.last_occurred_at THEN
   RAISE EXCEPTION 'Timer context and ordered versions must be retained' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_timer BEFORE UPDATE ON ppo.field_timers FOR EACH ROW EXECUTE FUNCTION ppo.guard_field_timer();

CREATE FUNCTION ppo.check_field_timer_event() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE t ppo.field_timers; e ppo.field_timer_events; a ppo.field_attendances;
BEGIN
 SELECT * INTO STRICT t FROM ppo.field_timers WHERE workspace_id=NEW.workspace_id AND attendance_id=NEW.attendance_id;
 SELECT * INTO e FROM ppo.field_timer_events WHERE workspace_id=t.workspace_id AND attendance_id=t.attendance_id ORDER BY version DESC LIMIT 1;
 SELECT * INTO STRICT a FROM ppo.field_attendances WHERE workspace_id=t.workspace_id AND id=t.attendance_id;
 IF e.id IS NULL OR (t.version,t.state,t.open_since,t.time_kind,t.scope_item_id,t.asset_id,t.pause_reason,t.note,t.last_occurred_at,t.updated_at)
  IS DISTINCT FROM (e.version,e.state_after,e.open_since,e.time_kind,e.scope_item_id,e.asset_id,e.pause_reason,e.note,e.occurred_at,e.received_at)
  OR e.version<>(SELECT count(*) FROM ppo.field_timer_events WHERE workspace_id=t.workspace_id AND attendance_id=t.attendance_id)
  OR t.last_occurred_at<a.captured_at OR t.open_since<a.captured_at
  OR NOT EXISTS(SELECT 1 FROM ppo.scope_items WHERE workspace_id=t.workspace_id AND scope_revision_id=a.scope_revision_id AND id=t.scope_item_id)
  OR (t.asset_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM ppo.scope_assets WHERE workspace_id=t.workspace_id AND scope_item_id=t.scope_item_id AND asset_id=t.asset_id))
  OR (t.state IN ('Running','Paused') AND (EXISTS(SELECT 1 FROM ppo.service_reports WHERE workspace_id=t.workspace_id AND attendance_id=t.attendance_id AND (revision>0 OR status IN ('Submitted','Reviewed','Issued'))) OR EXISTS(SELECT 1 FROM ppo.attendance_acceptances WHERE workspace_id=t.workspace_id AND attendance_id=t.attendance_id)))
 THEN RAISE EXCEPTION 'Timer projection must match its retained ordered event chain' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;

-- Retention is still restricted review, never normal acceptance or a replacement intent.
-- Widen only the verified live command list; keep actor, workspace, visit and grant authority exact.
DO $$ DECLARE definition text; marker text := '(''Capture'',''Correct'',''AttachmentInitiate'',''AttachmentUpload'',''AttachmentFinalise'',''CompletionDraft'')'; BEGIN
 SELECT pg_get_functiondef('ppo.guard_offline_recovery()'::regprocedure) INTO definition;
 IF position(marker in definition)=0 THEN RAISE EXCEPTION 'Inspect the changed offline recovery contract'; END IF;
 EXECUTE replace(definition,marker,'(''Capture'',''Correct'',''AttachmentInitiate'',''AttachmentUpload'',''AttachmentFinalise'',''CompletionDraft'',''Timer'',''FieldReadiness'')');
END $$;
CREATE CONSTRAINT TRIGGER timer_event_chain AFTER INSERT OR UPDATE ON ppo.field_timers DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_field_timer_event();
CREATE CONSTRAINT TRIGGER timer_event_chain AFTER INSERT ON ppo.field_timer_events DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_field_timer_event();

CREATE FUNCTION ppo.guard_timer_submission() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.status IN ('Submitted','Reviewed','Issued') AND EXISTS(SELECT 1 FROM ppo.field_timers WHERE workspace_id=NEW.workspace_id AND attendance_id=NEW.attendance_id AND state IN ('Running','Paused')) THEN
  RAISE EXCEPTION 'Finish the personal timer before submitting its completion evidence' USING ERRCODE='55000';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER timer_submission_guard BEFORE INSERT OR UPDATE ON ppo.service_reports FOR EACH ROW EXECUTE FUNCTION ppo.guard_timer_submission();

DO $$ DECLARE old_check text; BEGIN
 SELECT pg_get_constraintdef(oid) INTO STRICT old_check FROM pg_constraint WHERE conrelid='ppo.outbox_jobs'::regclass AND conname='ck_outbox_kind';
 ALTER TABLE ppo.outbox_jobs DROP CONSTRAINT ck_outbox_kind;
 EXECUTE format('ALTER TABLE ppo.outbox_jobs ADD CONSTRAINT ck_outbox_kind CHECK ((%s) OR kind=''FieldTimerChanged'')',substring(old_check FROM 8 FOR length(old_check)-8));
END $$;
