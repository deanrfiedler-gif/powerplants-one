-- P06 additive job packs. Applied P01–P05 source bytes remain unchanged.
ALTER TABLE ppo.business_identities DROP CONSTRAINT ck_identities_type;
ALTER TABLE ppo.business_identities ADD CONSTRAINT ck_identities_type CHECK(object_type IN ('Ticket','Organisation','Person','Site','Facility','Asset','Relationship','SiteParty','ErpAccountMapping','AssetConfiguration','AssetLocationEvent','HistoryRecord','Activity','WorkOrder','Appointment','ScheduleChangeRequest','ContactOutcome','Pack'));
ALTER TABLE ppo.audit_events DROP CONSTRAINT ck_audit_object_type;
ALTER TABLE ppo.audit_events ADD CONSTRAINT ck_audit_object_type CHECK(object_type IN ('Ticket','Session','Organisation','Person','Site','Facility','Asset','Relationship','SiteParty','ErpAccountMapping','AssetConfiguration','AssetLocationEvent','HistoryRecord','Activity','WorkOrder','Appointment','ScheduleChangeRequest','ContactOutcome','Pack'));
ALTER TABLE ppo.outbox_jobs DROP CONSTRAINT ck_outbox_kind;
ALTER TABLE ppo.outbox_jobs ADD CONSTRAINT ck_outbox_kind CHECK(kind IN ('TicketDraftSaved','SharedRecordCreated','SharedRecordUpdated','SharedHistoryRecorded','TicketCreated','TicketIntakeSaved','TicketInformationRequested','TicketTriaged','ActivityCreated','ActivityUpdated','ActivityStarted','ActivityCompleted','ActivityCancelled','WorkOrderCreated','ScopeDraftSaved','ScopeSuccessorCreated','ScopeAuthorised','ReadinessAssessed','AppointmentProposed','AppointmentConfirmed','AppointmentChanged','AppointmentCancelled','ScheduleChangeRequested','ScheduleChangeDecided','ContactOutcomeRecorded','PackPrepared','PackChecked','PackReturned','PackIssueRequested','PackIssued','PackAmendmentRaised','PackWithdrawn','PackAcknowledged','PackDistributionRecorded'));
ALTER TABLE ppo.permission_grants DROP CONSTRAINT ck_grants_capability;
ALTER TABLE ppo.permission_grants ADD CONSTRAINT ck_grants_capability CHECK(capability IN ('service.ticket.read','service.ticket.edit','shared.read','shared.create','shared.edit','shared.internal.read','shared.finance.read','shared.history.record','activity.read','activity.edit','service.work_order.read','service.work_order.edit','service.scope.authorise','service.readiness.assess','schedule.read','schedule.manage','schedule.request','schedule.contact','pack.read','pack.prepare','pack.check','pack.issue','pack.acknowledge'));
ALTER TABLE ppo.reference_counters DROP CONSTRAINT ck_reference_type;
ALTER TABLE ppo.reference_counters ADD CONSTRAINT ck_reference_type CHECK(record_type IN ('ORG','SITE','AST','TKT','WO','APT','PACK'));
ALTER TABLE ppo.appointments DROP CONSTRAINT appointments_pack_requirement_check;
ALTER TABLE ppo.appointments ADD CONSTRAINT appointments_pack_requirement_check CHECK(pack_requirement IN ('PreparationRequired','ReviewRequired','CancellationReviewRequired','AwaitingAcknowledgement','Acknowledged'));
CREATE OR REPLACE FUNCTION ppo.identity_has_typed_record() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target text; present boolean;
BEGIN
 target:=CASE NEW.object_type WHEN 'Ticket' THEN 'tickets' WHEN 'Organisation' THEN 'organisations' WHEN 'Person' THEN 'people' WHEN 'Site' THEN 'sites' WHEN 'Facility' THEN 'facilities' WHEN 'Asset' THEN 'assets' WHEN 'Relationship' THEN 'relationships' WHEN 'SiteParty' THEN 'site_parties' WHEN 'ErpAccountMapping' THEN 'erp_account_mappings' WHEN 'AssetConfiguration' THEN 'asset_configurations' WHEN 'AssetLocationEvent' THEN 'asset_location_events' WHEN 'HistoryRecord' THEN 'history_records' WHEN 'Activity' THEN 'activities' WHEN 'WorkOrder' THEN 'work_orders' WHEN 'Appointment' THEN 'appointments' WHEN 'ScheduleChangeRequest' THEN 'schedule_change_requests' WHEN 'ContactOutcome' THEN 'contact_outcomes' WHEN 'Pack' THEN 'packs' END;
 EXECUTE format('SELECT EXISTS(SELECT 1 FROM ppo.%I WHERE workspace_id=$1 AND id=$2)',target) INTO present USING NEW.workspace_id,NEW.id;
 IF NOT present THEN RAISE EXCEPTION 'Typed identity target is missing' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;

CREATE TABLE ppo.pack_templates (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES ppo.workspaces(id), version integer NOT NULL CHECK(version>0),
 name text NOT NULL, renderer_version text NOT NULL, definition text NOT NULL, content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,version), CHECK(content_hash=encode(sha256(convert_to(definition,'UTF8')),'hex'))
);
CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON ppo.pack_templates FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.pack_policy (
 workspace_id uuid PRIMARY KEY REFERENCES ppo.workspaces(id), version integer NOT NULL CHECK(version>0), template_id uuid NOT NULL,
 FOREIGN KEY(workspace_id,template_id) REFERENCES ppo.pack_templates(workspace_id,id)
);
CREATE TABLE ppo.pack_sources (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, site_id uuid NOT NULL,
 provider text NOT NULL CHECK(provider='Synthetic'), item_id text NOT NULL, version_id text NOT NULL,
 title text NOT NULL, media_type text NOT NULL CHECK(media_type='text/plain'), access_class text NOT NULL CHECK(access_class IN ('RestrictedService','RestrictedFinance','Internal')),
 owner_id uuid NOT NULL, byte_count integer NOT NULL CHECK(byte_count>0), content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,item_id,version_id),
 FOREIGN KEY(workspace_id,company_id,site_id) REFERENCES ppo.sites(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON ppo.pack_sources FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
-- Availability/naming are projections; exact retained source metadata is immutable.
CREATE TABLE ppo.pack_source_locations (
 workspace_id uuid NOT NULL, source_id uuid NOT NULL, version integer NOT NULL DEFAULT 1,
 display_name text NOT NULL, available boolean NOT NULL DEFAULT true,
 PRIMARY KEY(workspace_id,source_id), FOREIGN KEY(workspace_id,source_id) REFERENCES ppo.pack_sources(workspace_id,id)
);
CREATE TABLE ppo.packs (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, site_id uuid NOT NULL, appointment_id uuid NOT NULL,
 display_number text NOT NULL, version integer NOT NULL DEFAULT 1 CHECK(version>0), current_revision_id uuid, current_issue_id uuid,
 needs_review boolean NOT NULL DEFAULT true, status text NOT NULL DEFAULT 'Draft' CHECK(status IN ('Draft','Returned','Checked','Issued','Withdrawn')),
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic), created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 updated_by uuid NOT NULL, updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,appointment_id), UNIQUE(workspace_id,display_number),
 FOREIGN KEY(workspace_id,company_id,site_id,appointment_id) REFERENCES ppo.appointments(workspace_id,company_id,site_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id), FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id)
);
CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.packs FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('Pack','PACK');
CREATE TRIGGER no_delete BEFORE DELETE ON ppo.packs FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.pack_revisions (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, pack_id uuid NOT NULL, revision integer NOT NULL CHECK(revision>0),
 predecessor_id uuid, input jsonb NOT NULL, snapshot jsonb NOT NULL, content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'),
 change_reason text NOT NULL, created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,pack_id,id), UNIQUE(workspace_id,pack_id,revision),
 FOREIGN KEY(workspace_id,pack_id) REFERENCES ppo.packs(workspace_id,id), FOREIGN KEY(workspace_id,pack_id,predecessor_id) REFERENCES ppo.pack_revisions(workspace_id,pack_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 CHECK(jsonb_typeof(snapshot)='object' AND jsonb_typeof(input)='object')
);
CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON ppo.pack_revisions FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
ALTER TABLE ppo.packs ADD CONSTRAINT fk_current_revision FOREIGN KEY(workspace_id,id,current_revision_id) REFERENCES ppo.pack_revisions(workspace_id,pack_id,id) DEFERRABLE INITIALLY DEFERRED;
CREATE TABLE ppo.pack_checks (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, pack_id uuid NOT NULL, revision_id uuid NOT NULL,
 decision text NOT NULL CHECK(decision IN ('Checked','Returned')), reason text NOT NULL,
 actor_id uuid NOT NULL, checked_at timestamptz NOT NULL DEFAULT clock_timestamp(), content_hash text NOT NULL,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,pack_id,revision_id,id),
 FOREIGN KEY(workspace_id,pack_id,revision_id) REFERENCES ppo.pack_revisions(workspace_id,pack_id,id), FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON ppo.pack_checks FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.pack_render_jobs (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, pack_id uuid NOT NULL, revision_id uuid NOT NULL, check_id uuid NOT NULL,
 actor_id uuid NOT NULL, operation_id uuid NOT NULL, finalisation_operation_id uuid NOT NULL,
 input_hash text NOT NULL CHECK(input_hash ~ '^[a-f0-9]{64}$'), render_snapshot jsonb NOT NULL,
 requested_at timestamptz NOT NULL DEFAULT clock_timestamp(), state text NOT NULL DEFAULT 'Queued' CHECK(state IN ('Queued','Running','Durable','Failed','StaleSource','Issued')),
 attempts integer NOT NULL DEFAULT 0, lease_until timestamptz, lease_token uuid, error_code text, output_manifest jsonb, issue_id uuid,
 recovery_owner_id uuid NOT NULL, UNIQUE(workspace_id,id), UNIQUE(workspace_id,actor_id,operation_id), UNIQUE(workspace_id,revision_id),
 FOREIGN KEY(workspace_id,pack_id,revision_id,check_id) REFERENCES ppo.pack_checks(workspace_id,pack_id,revision_id,id),
 FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id), FOREIGN KEY(workspace_id,recovery_owner_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.pack_render_attempts (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, job_id uuid NOT NULL, attempt integer NOT NULL,
 outcome text NOT NULL CHECK(outcome IN ('Claimed','Durable','Failed','StaleSource','Issued')), code text,
 occurred_at timestamptz NOT NULL DEFAULT clock_timestamp(), actor_id uuid NOT NULL,
 FOREIGN KEY(workspace_id,job_id) REFERENCES ppo.pack_render_jobs(workspace_id,id), FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON ppo.pack_render_attempts FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.pack_issues (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, pack_id uuid NOT NULL, revision_id uuid NOT NULL, render_job_id uuid NOT NULL,
 issued_by uuid NOT NULL, issued_at timestamptz NOT NULL DEFAULT clock_timestamp(), manifest jsonb NOT NULL,
 output_hash text NOT NULL CHECK(output_hash ~ '^[a-f0-9]{64}$'), snapshot_hash text NOT NULL, assignment_version integer NOT NULL, schedule_version integer NOT NULL,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,pack_id,id), UNIQUE(workspace_id,revision_id), UNIQUE(workspace_id,render_job_id),
 FOREIGN KEY(workspace_id,pack_id,revision_id) REFERENCES ppo.pack_revisions(workspace_id,pack_id,id),
 FOREIGN KEY(workspace_id,render_job_id) REFERENCES ppo.pack_render_jobs(workspace_id,id), FOREIGN KEY(workspace_id,issued_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON ppo.pack_issues FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
ALTER TABLE ppo.packs ADD CONSTRAINT fk_current_issue FOREIGN KEY(workspace_id,id,current_issue_id) REFERENCES ppo.pack_issues(workspace_id,pack_id,id);
ALTER TABLE ppo.pack_render_jobs ADD CONSTRAINT fk_render_issue FOREIGN KEY(workspace_id,pack_id,issue_id) REFERENCES ppo.pack_issues(workspace_id,pack_id,id);
CREATE TABLE ppo.pack_issue_events (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, issue_id uuid NOT NULL, kind text NOT NULL CHECK(kind IN ('Issued','ReviewRequired','Superseded','Withdrawn')),
 reason text NOT NULL, actor_id uuid NOT NULL, occurred_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 FOREIGN KEY(workspace_id,issue_id) REFERENCES ppo.pack_issues(workspace_id,id), FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON ppo.pack_issue_events FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.pack_recipients (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, issue_id uuid NOT NULL, assignment_id uuid NOT NULL, assignment_version integer NOT NULL,
 user_id uuid NOT NULL, required boolean NOT NULL DEFAULT true CHECK(required), created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,issue_id,assignment_id), UNIQUE(workspace_id,issue_id,user_id),
 FOREIGN KEY(workspace_id,issue_id) REFERENCES ppo.pack_issues(workspace_id,id), FOREIGN KEY(workspace_id,assignment_id) REFERENCES ppo.assignments(workspace_id,id),
 FOREIGN KEY(workspace_id,user_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON ppo.pack_recipients FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.pack_acknowledgements (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, recipient_id uuid NOT NULL, actor_id uuid NOT NULL, operation_id uuid NOT NULL,
 presented_hash text NOT NULL CHECK(presented_hash ~ '^[a-f0-9]{64}$'), captured_at timestamptz NOT NULL, acknowledged_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,recipient_id), UNIQUE(workspace_id,actor_id,operation_id), FOREIGN KEY(workspace_id,recipient_id) REFERENCES ppo.pack_recipients(workspace_id,id),
 FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id), CHECK(isfinite(captured_at) AND captured_at<=acknowledged_at+interval '5 minutes')
);
CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON ppo.pack_acknowledgements FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.pack_distribution_events (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, recipient_id uuid NOT NULL, actor_id uuid NOT NULL,
 kind text NOT NULL CHECK(kind IN ('TaskCreated','SimulatedSent','Opened','Downloaded')), evidence text NOT NULL,
 occurred_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 FOREIGN KEY(workspace_id,recipient_id) REFERENCES ppo.pack_recipients(workspace_id,id), FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON ppo.pack_distribution_events FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.protect_render_intent() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' OR (to_jsonb(NEW)-ARRAY['state','attempts','lease_until','lease_token','error_code','output_manifest','issue_id']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['state','attempts','lease_until','lease_token','error_code','output_manifest','issue_id']) OR OLD.state='Issued' THEN
 RAISE EXCEPTION 'Render intent and completed result are immutable' USING ERRCODE='55000'; END IF;
 IF OLD.output_manifest IS NOT NULL AND NEW.output_manifest IS DISTINCT FROM OLD.output_manifest THEN RAISE EXCEPTION 'Original output must be retained' USING ERRCODE='55000'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER protect BEFORE UPDATE OR DELETE ON ppo.pack_render_jobs FOR EACH ROW EXECUTE FUNCTION ppo.protect_render_intent();
-- These consequences participate in the original P04/P05 transaction, including rollback.
CREATE FUNCTION ppo.invalidate_pack_applicability() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE a record; k text; why text;
BEGIN
 IF TG_TABLE_NAME='appointments' THEN
  IF (NEW.schedule_version,NEW.assignment_version,NEW.status) IS NOT DISTINCT FROM (OLD.schedule_version,OLD.assignment_version,OLD.status) THEN RETURN NEW; END IF;
  k:=CASE WHEN NEW.status='Cancelled' THEN 'Withdrawn' ELSE 'ReviewRequired' END;
  why:=CASE WHEN NEW.status='Cancelled' THEN 'Appointment cancelled: '||NEW.cancellation_reason ELSE 'Confirmed date/time or crew changed; prepare and issue a current revision.' END;
  FOR a IN SELECT * FROM ppo.packs WHERE workspace_id=NEW.workspace_id AND appointment_id=NEW.id LOOP
   INSERT INTO ppo.pack_issue_events SELECT gen_random_uuid(),NEW.workspace_id,a.current_issue_id,k,why,NEW.updated_by,clock_timestamp() WHERE a.current_issue_id IS NOT NULL;
   UPDATE ppo.packs SET needs_review=true,version=version+1,updated_by=NEW.updated_by,updated_at=clock_timestamp(),status=CASE WHEN k='Withdrawn' THEN 'Withdrawn' ELSE status END WHERE id=a.id;
  END LOOP;
 ELSE
  IF (NEW.scope_revision_id,NEW.authorised_scope_revision_id) IS NOT DISTINCT FROM (OLD.scope_revision_id,OLD.authorised_scope_revision_id) THEN RETURN NEW; END IF;
  FOR a IN SELECT p.* FROM ppo.packs p JOIN ppo.appointments ap ON ap.id=p.appointment_id WHERE ap.work_order_id=NEW.id AND ap.status<>'Cancelled' LOOP
   INSERT INTO ppo.pack_issue_events SELECT gen_random_uuid(),NEW.workspace_id,a.current_issue_id,'ReviewRequired','Scope authority changed; successor review required.',NEW.updated_by,clock_timestamp() WHERE a.current_issue_id IS NOT NULL;
   UPDATE ppo.packs SET needs_review=true,version=version+1,updated_by=NEW.updated_by,updated_at=clock_timestamp() WHERE id=a.id;
   UPDATE ppo.appointments SET dispatch_hold=true,pack_requirement='ReviewRequired',version=version+1,updated_by=NEW.updated_by,updated_at=clock_timestamp() WHERE id=a.appointment_id;
  END LOOP;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER pack_consequences AFTER UPDATE ON ppo.appointments FOR EACH ROW EXECUTE FUNCTION ppo.invalidate_pack_applicability();
CREATE TRIGGER pack_consequences AFTER UPDATE ON ppo.work_orders FOR EACH ROW EXECUTE FUNCTION ppo.invalidate_pack_applicability();
CREATE FUNCTION ppo.guard_pack_identity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF (NEW.workspace_id,NEW.company_id,NEW.site_id,NEW.appointment_id) IS DISTINCT FROM (OLD.workspace_id,OLD.company_id,OLD.site_id,OLD.appointment_id) OR NEW.version<>OLD.version+1 THEN RAISE EXCEPTION 'Pack context/version is controlled' USING ERRCODE='55000'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_pack BEFORE UPDATE ON ppo.packs FOR EACH ROW EXECUTE FUNCTION ppo.guard_pack_identity();
CREATE FUNCTION ppo.guard_pack_issue() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE j ppo.pack_render_jobs; p ppo.packs;
BEGIN
 SELECT * INTO j FROM ppo.pack_render_jobs WHERE workspace_id=NEW.workspace_id AND id=NEW.render_job_id;
 SELECT * INTO p FROM ppo.packs WHERE workspace_id=NEW.workspace_id AND id=NEW.pack_id;
 IF j.state<>'Durable' OR j.output_manifest IS DISTINCT FROM NEW.manifest OR NEW.output_hash IS DISTINCT FROM j.output_manifest->>'pdf_hash' OR NEW.snapshot_hash IS DISTINCT FROM j.input_hash OR NEW.id::text IS DISTINCT FROM j.render_snapshot->>'issue_id' OR p.current_revision_id<>NEW.revision_id OR p.status<>'Checked' THEN RAISE EXCEPTION 'Exact durable checked output is required' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_issue BEFORE INSERT ON ppo.pack_issues FOR EACH ROW EXECUTE FUNCTION ppo.guard_pack_issue();
CREATE FUNCTION ppo.guard_pack_recipient() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE i ppo.pack_issues; a ppo.assignments; u uuid;
BEGIN
 SELECT * INTO i FROM ppo.pack_issues WHERE workspace_id=NEW.workspace_id AND id=NEW.issue_id;
 SELECT * INTO a FROM ppo.assignments WHERE workspace_id=NEW.workspace_id AND id=NEW.assignment_id;
 SELECT user_id INTO u FROM ppo.resources WHERE workspace_id=NEW.workspace_id AND id=a.resource_id;
 IF NOT a.active OR a.assignment_version<>NEW.assignment_version OR NEW.assignment_version<>i.assignment_version OR u IS DISTINCT FROM NEW.user_id OR NOT EXISTS(SELECT 1 FROM ppo.packs WHERE id=i.pack_id AND appointment_id=a.appointment_id) THEN RAISE EXCEPTION 'Recipient must be exact current assignment user' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_recipient BEFORE INSERT ON ppo.pack_recipients FOR EACH ROW EXECUTE FUNCTION ppo.guard_pack_recipient();
CREATE FUNCTION ppo.guard_pack_acknowledgement() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE r ppo.pack_recipients; i ppo.pack_issues;
BEGIN
 SELECT * INTO r FROM ppo.pack_recipients WHERE workspace_id=NEW.workspace_id AND id=NEW.recipient_id;
 SELECT * INTO i FROM ppo.pack_issues WHERE workspace_id=NEW.workspace_id AND id=r.issue_id;
 IF NEW.actor_id IS DISTINCT FROM r.user_id OR NEW.presented_hash IS DISTINCT FROM i.output_hash OR NOT EXISTS(SELECT 1 FROM ppo.packs p JOIN ppo.appointments a ON a.id=p.appointment_id JOIN ppo.assignments x ON x.appointment_id=a.id WHERE p.id=i.pack_id AND p.current_issue_id=i.id AND p.status='Issued' AND NOT p.needs_review AND a.status='Confirmed' AND a.schedule_version=i.schedule_version AND a.assignment_version=i.assignment_version AND x.id=r.assignment_id AND x.active) THEN RAISE EXCEPTION 'Only current exact recipient may acknowledge applicable issue' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_ack BEFORE INSERT ON ppo.pack_acknowledgements FOR EACH ROW EXECUTE FUNCTION ppo.guard_pack_acknowledgement();
-- Replace P04's unconditional hold with an evidence-backed component invariant.
ALTER TABLE ppo.appointments DROP CONSTRAINT appointments_dispatch_hold_check;
CREATE FUNCTION ppo.guard_pack_dispatch() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE p ppo.packs; i ppo.pack_issues;
BEGIN
 IF NEW.dispatch_hold THEN RETURN NEW; END IF;
 SELECT * INTO p FROM ppo.packs WHERE workspace_id=NEW.workspace_id AND appointment_id=NEW.id;
 SELECT * INTO i FROM ppo.pack_issues WHERE workspace_id=NEW.workspace_id AND id=p.current_issue_id;
 IF p.id IS NULL OR i.id IS NULL OR p.needs_review OR p.status<>'Issued' OR NEW.status<>'Confirmed' OR NEW.customer_commitment<>'Confirmed' OR NEW.pack_requirement<>'Acknowledged' OR NEW.assignment_version<>i.assignment_version OR NEW.schedule_version<>i.schedule_version OR NOT EXISTS(SELECT 1 FROM ppo.work_orders w WHERE w.id=NEW.work_order_id AND w.scope_revision_id=w.authorised_scope_revision_id AND w.authorised_scope_revision_id=NEW.scope_revision_id)
 OR NOT EXISTS(SELECT 1 FROM ppo.assignments x WHERE x.appointment_id=NEW.id AND x.active)
 OR EXISTS(SELECT 1 FROM ppo.assignments x LEFT JOIN ppo.pack_recipients r ON r.assignment_id=x.id AND r.issue_id=i.id LEFT JOIN ppo.pack_acknowledgements a ON a.recipient_id=r.id WHERE x.appointment_id=NEW.id AND x.active AND (r.id IS NULL OR a.id IS NULL OR a.presented_hash<>i.output_hash)) THEN
 RAISE EXCEPTION 'Current issue and every independent crew response are required to clear dispatch hold' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_dispatch BEFORE INSERT OR UPDATE ON ppo.appointments FOR EACH ROW EXECUTE FUNCTION ppo.guard_pack_dispatch();
-- Owned urgent-contact/review activities are consequences, never outbound messages.
CREATE TABLE ppo.pack_follow_ups (
 workspace_id uuid NOT NULL, issue_event_id uuid PRIMARY KEY, activity_id uuid NOT NULL UNIQUE,
 FOREIGN KEY(workspace_id,issue_event_id) REFERENCES ppo.pack_issue_events(workspace_id,id),
 FOREIGN KEY(workspace_id,activity_id) REFERENCES ppo.activities(workspace_id,id)
);
CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON ppo.pack_follow_ups FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.pack_owned_follow_up() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE p record; task uuid;
BEGIN
 IF NEW.kind NOT IN ('ReviewRequired','Withdrawn') THEN RETURN NEW; END IF;
 SELECT pk.*,w.service_owner_id INTO p FROM ppo.pack_issues i JOIN ppo.packs pk ON pk.id=i.pack_id JOIN ppo.appointments a ON a.id=pk.appointment_id JOIN ppo.work_orders w ON w.id=a.work_order_id WHERE i.id=NEW.issue_id;
 task:=gen_random_uuid();
 INSERT INTO ppo.activities(id,workspace_id,company_id,site_id,created_by,updated_by,kind,owner_id,summary,due_at,due_needed,access_class)
 VALUES(task,NEW.workspace_id,p.company_id,p.site_id,NEW.actor_id,NEW.actor_id,'CustomerContact',p.service_owner_id,p.display_number||' · '||NEW.kind||': urgently review crew/customer contact and record the outcome; no message has been sent.',NULL,true,'RestrictedService');
 INSERT INTO ppo.activity_links(workspace_id,company_id,activity_id,object_type,object_id) VALUES(NEW.workspace_id,p.company_id,task,'Site',p.site_id);
 INSERT INTO ppo.pack_follow_ups VALUES(NEW.workspace_id,NEW.id,task);
 RETURN NEW;
END $$;
CREATE TRIGGER owned_follow_up AFTER INSERT ON ppo.pack_issue_events FOR EACH ROW EXECUTE FUNCTION ppo.pack_owned_follow_up();
