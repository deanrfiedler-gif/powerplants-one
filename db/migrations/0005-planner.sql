-- P05 additive planner. Never modify applied P01–P04 bytes.
ALTER TABLE ppo.business_identities DROP CONSTRAINT ck_identities_type;
ALTER TABLE ppo.business_identities ADD CONSTRAINT ck_identities_type CHECK(object_type IN ('Ticket','Organisation','Person','Site','Facility','Asset','Relationship','SiteParty','ErpAccountMapping','AssetConfiguration','AssetLocationEvent','HistoryRecord','Activity','WorkOrder','Appointment','ScheduleChangeRequest','ContactOutcome'));
ALTER TABLE ppo.audit_events DROP CONSTRAINT ck_audit_object_type;
ALTER TABLE ppo.audit_events ADD CONSTRAINT ck_audit_object_type CHECK(object_type IN ('Ticket','Session','Organisation','Person','Site','Facility','Asset','Relationship','SiteParty','ErpAccountMapping','AssetConfiguration','AssetLocationEvent','HistoryRecord','Activity','WorkOrder','Appointment','ScheduleChangeRequest','ContactOutcome'));
ALTER TABLE ppo.outbox_jobs DROP CONSTRAINT ck_outbox_kind;
ALTER TABLE ppo.outbox_jobs ADD CONSTRAINT ck_outbox_kind CHECK(kind IN ('TicketDraftSaved','SharedRecordCreated','SharedRecordUpdated','SharedHistoryRecorded','TicketCreated','TicketIntakeSaved','TicketInformationRequested','TicketTriaged','ActivityCreated','ActivityUpdated','ActivityStarted','ActivityCompleted','ActivityCancelled','WorkOrderCreated','ScopeDraftSaved','ScopeSuccessorCreated','ScopeAuthorised','ReadinessAssessed','AppointmentProposed','AppointmentConfirmed','AppointmentChanged','AppointmentCancelled','ScheduleChangeRequested','ScheduleChangeDecided','ContactOutcomeRecorded'));
ALTER TABLE ppo.permission_grants DROP CONSTRAINT ck_grants_capability;
ALTER TABLE ppo.permission_grants ADD CONSTRAINT ck_grants_capability CHECK(capability IN ('service.ticket.read','service.ticket.edit','shared.read','shared.create','shared.edit','shared.internal.read','shared.finance.read','shared.history.record','activity.read','activity.edit','service.work_order.read','service.work_order.edit','service.scope.authorise','service.readiness.assess','schedule.read','schedule.manage','schedule.request','schedule.contact'));

-- Preserve the exact original P04 row before adding new current-state fields.
CREATE TABLE ppo.appointment_proposals (
 workspace_id uuid NOT NULL, appointment_id uuid NOT NULL, proposal_version integer NOT NULL,
 snapshot jsonb NOT NULL, content_hash text NOT NULL,
 PRIMARY KEY(workspace_id,appointment_id),
 FOREIGN KEY(workspace_id,appointment_id) REFERENCES ppo.appointments(workspace_id,id)
);
INSERT INTO ppo.appointment_proposals SELECT workspace_id,id,version,to_jsonb(a),encode(sha256(convert_to(to_jsonb(a)::text,'UTF8')),'hex') FROM ppo.appointments a;
CREATE TRIGGER proposal_immutable BEFORE UPDATE OR DELETE ON ppo.appointment_proposals FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
DROP TRIGGER proposed_visit_immutable ON ppo.appointments;
ALTER TABLE ppo.appointments DROP CONSTRAINT appointments_status_check;
ALTER TABLE ppo.appointments ADD CONSTRAINT ck_appointments_state CHECK(status IN ('Proposed','Confirmed','Cancelled'));
ALTER TABLE ppo.appointments DROP CONSTRAINT appointments_customer_commitment_check;
ALTER TABLE ppo.appointments ADD CONSTRAINT ck_appointments_commitment CHECK(customer_commitment IN ('Unknown','Proposed','Confirmed','Changed'));
ALTER TABLE ppo.appointments ADD COLUMN assignment_version integer NOT NULL DEFAULT 1 CHECK(assignment_version>0);
ALTER TABLE ppo.appointments ADD COLUMN schedule_version integer NOT NULL DEFAULT 1 CHECK(schedule_version>0);
ALTER TABLE ppo.appointments ADD COLUMN scheduling_policy_id uuid;
ALTER TABLE ppo.appointments ADD COLUMN booking_snapshot jsonb;
ALTER TABLE ppo.appointments ADD COLUMN booking_hash text;
ALTER TABLE ppo.appointments ADD COLUMN pack_requirement text NOT NULL DEFAULT 'PreparationRequired' CHECK(pack_requirement IN ('PreparationRequired','ReviewRequired','CancellationReviewRequired'));
ALTER TABLE ppo.appointments ADD COLUMN cancellation_reason text;
ALTER TABLE ppo.appointments ADD COLUMN cancelled_at timestamptz;
ALTER TABLE ppo.appointments ADD COLUMN actual_start_at timestamptz;
ALTER TABLE ppo.appointments ADD COLUMN actual_end_at timestamptz;
ALTER TABLE ppo.appointments ADD CONSTRAINT ck_appointments_cancel CHECK((status='Cancelled')=(cancelled_at IS NOT NULL AND cancellation_reason IS NOT NULL));
ALTER TABLE ppo.appointments ADD CONSTRAINT ck_appointments_booking CHECK(status<>'Confirmed' OR (booking_snapshot IS NOT NULL AND booking_hash ~ '^[a-f0-9]{64}$' AND scheduling_policy_id IS NOT NULL));
ALTER TABLE ppo.appointments ADD CONSTRAINT ck_appointments_actual CHECK((actual_start_at IS NULL OR isfinite(actual_start_at)) AND (actual_end_at IS NULL OR (actual_start_at IS NOT NULL AND isfinite(actual_end_at) AND actual_end_at>=actual_start_at)));
CREATE TABLE ppo.scheduling_policies (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES ppo.workspaces(id), version integer NOT NULL CHECK(version>0),
 name text NOT NULL, status text NOT NULL CHECK(status='Published'), effective_from timestamptz NOT NULL, effective_to timestamptz NOT NULL,
 source_as_at timestamptz NOT NULL, evidence text NOT NULL, synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 initial_contact_required boolean NOT NULL CHECK(initial_contact_required), changed_contact_allowed boolean NOT NULL CHECK(changed_contact_allowed),
 all_crew_skilled boolean NOT NULL CHECK(all_crew_skilled), max_visit_minutes integer NOT NULL CHECK(max_visit_minutes BETWEEN 1 AND 1440),
 UNIQUE(workspace_id,id), CHECK(isfinite(effective_from) AND isfinite(effective_to) AND effective_to>effective_from AND source_as_at<=effective_from)
);
CREATE TRIGGER scheduling_policy_immutable BEFORE UPDATE OR DELETE ON ppo.scheduling_policies FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
ALTER TABLE ppo.appointments ADD CONSTRAINT fk_appointment_scheduling_policy FOREIGN KEY(workspace_id,scheduling_policy_id) REFERENCES ppo.scheduling_policies(workspace_id,id);
CREATE TABLE ppo.working_calendars (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES ppo.workspaces(id), company_id uuid NOT NULL, version integer NOT NULL CHECK(version>0),
 name text NOT NULL, timezone text NOT NULL, status text NOT NULL CHECK(status IN ('Draft','Published')),
 effective_from timestamptz NOT NULL, effective_to timestamptz NOT NULL, source_as_at timestamptz NOT NULL, evidence text NOT NULL,
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic), UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id),
 CHECK(isfinite(effective_from) AND isfinite(effective_to) AND effective_to>effective_from AND source_as_at<=effective_from)
);
CREATE TABLE ppo.calendar_intervals (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, calendar_id uuid NOT NULL, weekday integer NOT NULL CHECK(weekday BETWEEN 0 AND 6),
 start_minute integer NOT NULL CHECK(start_minute BETWEEN 0 AND 1439), end_minute integer NOT NULL CHECK(end_minute BETWEEN 1 AND 1440),
 CHECK(end_minute>start_minute), FOREIGN KEY(workspace_id,calendar_id) REFERENCES ppo.working_calendars(workspace_id,id),
 EXCLUDE USING gist(calendar_id WITH =,weekday WITH =,int4range(start_minute,end_minute,'[)') WITH &&)
);
CREATE TABLE ppo.calendar_exceptions (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, calendar_id uuid NOT NULL, start_at timestamptz NOT NULL,end_at timestamptz NOT NULL,
 kind text NOT NULL CHECK(kind='Closed'), reason text NOT NULL,
 FOREIGN KEY(workspace_id,calendar_id) REFERENCES ppo.working_calendars(workspace_id,id), CHECK(isfinite(start_at) AND isfinite(end_at) AND end_at>start_at)
);
CREATE TABLE ppo.resources (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL REFERENCES ppo.workspaces(id),company_id uuid NOT NULL,version integer NOT NULL CHECK(version>0),
 name text NOT NULL,user_id uuid,resource_type text NOT NULL CHECK(resource_type='Technician'),active boolean NOT NULL,
 calendar_id uuid NOT NULL,base_timezone text NOT NULL,status text NOT NULL CHECK(status IN ('Draft','Published')),
 effective_from timestamptz NOT NULL,effective_to timestamptz NOT NULL,source_as_at timestamptz NOT NULL,evidence text NOT NULL,
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic), UNIQUE(workspace_id,id),UNIQUE(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,calendar_id) REFERENCES ppo.working_calendars(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,user_id) REFERENCES ppo.users(workspace_id,id),
 CHECK(isfinite(effective_from) AND isfinite(effective_to) AND effective_to>effective_from AND source_as_at<=effective_from)
);
CREATE TABLE ppo.resource_sites (
 workspace_id uuid NOT NULL,company_id uuid NOT NULL,site_id uuid NOT NULL,resource_id uuid NOT NULL,
 PRIMARY KEY(workspace_id,resource_id,site_id),
 FOREIGN KEY(workspace_id,company_id,resource_id) REFERENCES ppo.resources(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id) REFERENCES ppo.sites(workspace_id,company_id,id)
);
CREATE TABLE ppo.resource_evidence (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,resource_id uuid NOT NULL,version integer NOT NULL CHECK(version>0),
 source_reference text NOT NULL,source_as_at timestamptz NOT NULL,content_text text NOT NULL,content_hash text NOT NULL,
 reviewer_id uuid NOT NULL,reviewed_at timestamptz NOT NULL,synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 UNIQUE(workspace_id,resource_id,id), FOREIGN KEY(workspace_id,resource_id) REFERENCES ppo.resources(workspace_id,id),
 FOREIGN KEY(workspace_id,reviewer_id) REFERENCES ppo.users(workspace_id,id),CHECK(content_hash ~ '^[a-f0-9]{64}$' AND source_as_at<=reviewed_at)
);
CREATE TABLE ppo.skill_evidence (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,resource_id uuid NOT NULL,version integer NOT NULL CHECK(version>0),
 skill_code text NOT NULL,status text NOT NULL CHECK(status IN ('Verified','Unverified','Expired')),active boolean NOT NULL,
 valid_from timestamptz NOT NULL,valid_to timestamptz NOT NULL,source_as_at timestamptz NOT NULL,evidence_ref uuid,
 FOREIGN KEY(workspace_id,resource_id) REFERENCES ppo.resources(workspace_id,id),
 FOREIGN KEY(workspace_id,resource_id,evidence_ref) REFERENCES ppo.resource_evidence(workspace_id,resource_id,id),
 CHECK(isfinite(valid_from) AND isfinite(valid_to) AND valid_to>valid_from AND source_as_at<=valid_from),CHECK(status<>'Verified' OR evidence_ref IS NOT NULL)
);
CREATE TABLE ppo.availability_blocks (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,resource_id uuid NOT NULL,version integer NOT NULL CHECK(version>0),
 start_at timestamptz NOT NULL,end_at timestamptz NOT NULL,kind text NOT NULL CHECK(kind IN ('Leave','Unavailable','OtherWork')),
 active boolean NOT NULL,source_as_at timestamptz NOT NULL,evidence text NOT NULL,
 FOREIGN KEY(workspace_id,resource_id) REFERENCES ppo.resources(workspace_id,id),CHECK(isfinite(start_at) AND isfinite(end_at) AND end_at>start_at AND source_as_at<=start_at)
);
-- No P05 source-edit endpoint exists. Publication freezes roots AND all child insert/update/delete paths.
CREATE FUNCTION ppo.protect_planner_source() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE sealed boolean; rid uuid;
BEGIN
 IF TG_TABLE_NAME IN ('resources','working_calendars') THEN
  IF TG_OP='DELETE' OR OLD.status='Published' THEN RAISE EXCEPTION 'Published planner source is immutable' USING ERRCODE='55000'; END IF;
 ELSE
  IF TG_OP='DELETE' THEN rid:=OLD.resource_id; ELSE rid:=NEW.resource_id; END IF;
  SELECT status='Published' INTO sealed FROM ppo.resources WHERE id=rid FOR SHARE;
  IF sealed OR TG_OP<>'INSERT' THEN RAISE EXCEPTION 'Published resource evidence is immutable' USING ERRCODE='55000'; END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE FUNCTION ppo.protect_calendar_child() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE sealed boolean; cid uuid;
BEGIN
 IF TG_OP='DELETE' THEN cid:=OLD.calendar_id; ELSE cid:=NEW.calendar_id; END IF;
 SELECT status='Published' INTO sealed FROM ppo.working_calendars WHERE id=cid FOR SHARE;
 IF sealed OR TG_OP<>'INSERT' THEN RAISE EXCEPTION 'Published calendar is immutable' USING ERRCODE='55000'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER planner_source_immutable BEFORE UPDATE OR DELETE ON ppo.resources FOR EACH ROW EXECUTE FUNCTION ppo.protect_planner_source();
CREATE TRIGGER planner_source_immutable BEFORE UPDATE OR DELETE ON ppo.working_calendars FOR EACH ROW EXECUTE FUNCTION ppo.protect_planner_source();
CREATE TRIGGER planner_source_immutable BEFORE INSERT OR UPDATE OR DELETE ON ppo.resource_sites FOR EACH ROW EXECUTE FUNCTION ppo.protect_planner_source();
CREATE TRIGGER planner_source_immutable BEFORE INSERT OR UPDATE OR DELETE ON ppo.resource_evidence FOR EACH ROW EXECUTE FUNCTION ppo.protect_planner_source();
CREATE TRIGGER planner_source_immutable BEFORE INSERT OR UPDATE OR DELETE ON ppo.skill_evidence FOR EACH ROW EXECUTE FUNCTION ppo.protect_planner_source();
CREATE TRIGGER planner_source_immutable BEFORE INSERT OR UPDATE OR DELETE ON ppo.availability_blocks FOR EACH ROW EXECUTE FUNCTION ppo.protect_planner_source();
CREATE TRIGGER planner_source_immutable BEFORE INSERT OR UPDATE OR DELETE ON ppo.calendar_intervals FOR EACH ROW EXECUTE FUNCTION ppo.protect_calendar_child();
CREATE TRIGGER planner_source_immutable BEFORE INSERT OR UPDATE OR DELETE ON ppo.calendar_exceptions FOR EACH ROW EXECUTE FUNCTION ppo.protect_calendar_child();

CREATE TABLE ppo.assignments (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,company_id uuid NOT NULL,site_id uuid NOT NULL,appointment_id uuid NOT NULL,resource_id uuid NOT NULL,
 assignment_version integer NOT NULL CHECK(assignment_version>0),crew_role text NOT NULL CHECK(crew_role IN ('Lead','Technician','Specialist')),
 travel_before_minutes integer NOT NULL CHECK(travel_before_minutes BETWEEN 0 AND 1440),travel_after_minutes integer NOT NULL CHECK(travel_after_minutes BETWEEN 0 AND 1440),
 travel_reason text NOT NULL CHECK(length(btrim(travel_reason))>0),active boolean NOT NULL,
 resource_version integer NOT NULL,calendar_version integer NOT NULL,created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,resource_id,id),UNIQUE(workspace_id,appointment_id,resource_id,assignment_version),
 FOREIGN KEY(workspace_id,company_id,site_id,appointment_id) REFERENCES ppo.appointments(workspace_id,company_id,site_id,id),
 FOREIGN KEY(workspace_id,resource_id,site_id) REFERENCES ppo.resource_sites(workspace_id,resource_id,site_id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE UNIQUE INDEX uq_assignment_active ON ppo.assignments(workspace_id,appointment_id,resource_id) WHERE active;
CREATE TABLE ppo.resource_reservations (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,assignment_id uuid NOT NULL,resource_id uuid NOT NULL,start_at timestamptz NOT NULL,end_at timestamptz NOT NULL,active boolean NOT NULL,
 FOREIGN KEY(workspace_id,resource_id,assignment_id) REFERENCES ppo.assignments(workspace_id,resource_id,id),
 CHECK(isfinite(start_at) AND isfinite(end_at) AND end_at>start_at),UNIQUE(workspace_id,assignment_id),
 CONSTRAINT ex_reservations_resource_time EXCLUDE USING gist(workspace_id WITH =,resource_id WITH =,tstzrange(start_at,end_at,'[)') WITH &&) WHERE(active)
);
CREATE FUNCTION ppo.protect_booking_history() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' OR (TG_OP='UPDATE' AND (NOT OLD.active OR NEW.active OR (to_jsonb(NEW)-'active') IS DISTINCT FROM (to_jsonb(OLD)-'active'))) THEN
 RAISE EXCEPTION 'Booking evidence only permits one release' USING ERRCODE='55000'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER assignment_history BEFORE UPDATE OR DELETE ON ppo.assignments FOR EACH ROW EXECUTE FUNCTION ppo.protect_booking_history();
CREATE TRIGGER reservation_history BEFORE UPDATE OR DELETE ON ppo.resource_reservations FOR EACH ROW EXECUTE FUNCTION ppo.protect_booking_history();
CREATE TABLE ppo.appointment_revisions (
 workspace_id uuid NOT NULL,appointment_id uuid NOT NULL,version integer NOT NULL,snapshot jsonb NOT NULL,content_hash text NOT NULL,
 PRIMARY KEY(workspace_id,appointment_id,version),FOREIGN KEY(workspace_id,appointment_id) REFERENCES ppo.appointments(workspace_id,id)
);
INSERT INTO ppo.appointment_revisions SELECT workspace_id,id,version,to_jsonb(a),encode(sha256(convert_to(to_jsonb(a)::text,'UTF8')),'hex') FROM ppo.appointments a;
CREATE TRIGGER revision_immutable BEFORE UPDATE OR DELETE ON ppo.appointment_revisions FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.capture_appointment_revision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='INSERT' THEN INSERT INTO ppo.appointment_proposals VALUES(NEW.workspace_id,NEW.id,NEW.version,to_jsonb(NEW),encode(sha256(convert_to(to_jsonb(NEW)::text,'UTF8')),'hex')); END IF;
 INSERT INTO ppo.appointment_revisions VALUES(NEW.workspace_id,NEW.id,NEW.version,to_jsonb(NEW),encode(sha256(convert_to(to_jsonb(NEW)::text,'UTF8')),'hex'));
 RETURN NEW;
END $$;
CREATE TRIGGER capture_appointment_revision AFTER INSERT OR UPDATE ON ppo.appointments FOR EACH ROW EXECUTE FUNCTION ppo.capture_appointment_revision();
CREATE FUNCTION ppo.guard_appointment_change() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF (NEW.id,NEW.workspace_id,NEW.company_id,NEW.site_id,NEW.work_order_id,NEW.scope_revision_id,NEW.scope_version,NEW.policy_version_id,NEW.created_by,NEW.created_at,NEW.site_timezone,NEW.requested_window_start,NEW.requested_window_end) IS DISTINCT FROM
 (OLD.id,OLD.workspace_id,OLD.company_id,OLD.site_id,OLD.work_order_id,OLD.scope_revision_id,OLD.scope_version,OLD.policy_version_id,OLD.created_by,OLD.created_at,OLD.site_timezone,OLD.requested_window_start,OLD.requested_window_end)
 OR NEW.version<>OLD.version+1 OR OLD.status='Cancelled' OR (OLD.status='Confirmed' AND NEW.status='Proposed')
 OR (OLD.status='Proposed' AND NEW.status='Proposed' AND (NEW.start_at,NEW.end_at) IS DISTINCT FROM (OLD.start_at,OLD.end_at)) THEN
 RAISE EXCEPTION 'Appointment history/context/state is controlled' USING ERRCODE='55000'; END IF;
 IF NEW.status='Cancelled' AND (OLD.actual_start_at IS NOT NULL OR OLD.actual_end_at IS NOT NULL) THEN RAISE EXCEPTION 'Actual work prevents cancellation' USING ERRCODE='55000'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_appointment_change BEFORE UPDATE ON ppo.appointments FOR EACH ROW EXECUTE FUNCTION ppo.guard_appointment_change();
CREATE INDEX ix_appointments_workspace_start ON ppo.appointments(workspace_id,start_at,end_at);
CREATE TABLE ppo.schedule_change_requests (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,company_id uuid NOT NULL,site_id uuid NOT NULL,appointment_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version>0),created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),updated_by uuid NOT NULL,updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),UNIQUE(workspace_id,id),UNIQUE(workspace_id,company_id,site_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id,appointment_id) REFERENCES ppo.appointments(workspace_id,company_id,site_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id),
 crew_snapshot jsonb NOT NULL CHECK(jsonb_typeof(crew_snapshot)='array' AND jsonb_array_length(crew_snapshot) BETWEEN 1 AND 6),
 expected_version integer NOT NULL,expected_schedule_version integer NOT NULL,source_type text NOT NULL CHECK(source_type IN ('Manual','ProjectReference','TechnicianRequest')),
 source_reference text NOT NULL,source_version text NOT NULL,reason text NOT NULL,proposed_start timestamptz NOT NULL,proposed_end timestamptz NOT NULL,
 status text NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending','Accepted','Rejected','Cancelled')),decision_by uuid,decision_at timestamptz,decision_reason text,
 CHECK(isfinite(proposed_start) AND isfinite(proposed_end) AND proposed_end>proposed_start),
 FOREIGN KEY(workspace_id,decision_by) REFERENCES ppo.users(workspace_id,id),CHECK((status='Pending')=(decision_by IS NULL AND decision_at IS NULL AND decision_reason IS NULL))
);
CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.schedule_change_requests FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('ScheduleChangeRequest','');
ALTER TABLE ppo.schedule_change_requests ADD CONSTRAINT fk_schedule_change_requests_identity FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id);
CREATE TRIGGER no_delete BEFORE DELETE ON ppo.schedule_change_requests FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.contact_outcomes (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,company_id uuid NOT NULL,site_id uuid NOT NULL,appointment_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version>0),created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),updated_by uuid NOT NULL,updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),UNIQUE(workspace_id,id),UNIQUE(workspace_id,company_id,site_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id,appointment_id) REFERENCES ppo.appointments(workspace_id,company_id,site_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id),
 schedule_version integer NOT NULL,recipient_id uuid NOT NULL,activity_id uuid,
 channel text NOT NULL CHECK(channel IN ('ManualPhone','ManualEmail','InPerson','Simulated')),outcome text NOT NULL CHECK(outcome IN ('Attempted','Confirmed','NoResponse','Failed')),
 occurred_at timestamptz NOT NULL,notes text NOT NULL,start_at timestamptz NOT NULL,end_at timestamptz NOT NULL,
 FOREIGN KEY(workspace_id,recipient_id) REFERENCES ppo.people(workspace_id,id),FOREIGN KEY(workspace_id,activity_id) REFERENCES ppo.activities(workspace_id,id),
 CHECK(isfinite(occurred_at) AND isfinite(start_at) AND isfinite(end_at) AND end_at>start_at)
);
CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.contact_outcomes FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('ContactOutcome','');
ALTER TABLE ppo.contact_outcomes ADD CONSTRAINT fk_contact_outcomes_identity FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id);
CREATE TRIGGER no_delete BEFORE DELETE ON ppo.contact_outcomes FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TRIGGER contact_immutable BEFORE UPDATE ON ppo.contact_outcomes FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.guard_change_request() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.status<>'Pending' OR NEW.status='Pending' OR NEW.version<>OLD.version+1 OR
 (to_jsonb(NEW)-ARRAY['version','updated_by','updated_at','status','decision_by','decision_at','decision_reason']) IS DISTINCT FROM
 (to_jsonb(OLD)-ARRAY['version','updated_by','updated_at','status','decision_by','decision_at','decision_reason']) THEN
 RAISE EXCEPTION 'Request intent and decided outcome are immutable' USING ERRCODE='55000'; END IF; RETURN NEW;
END $$;
CREATE TRIGGER request_history BEFORE UPDATE ON ppo.schedule_change_requests FOR EACH ROW EXECUTE FUNCTION ppo.guard_change_request();
CREATE TABLE ppo.schedule_request_crew (
 workspace_id uuid NOT NULL,request_id uuid NOT NULL,resource_id uuid NOT NULL,resource_version integer NOT NULL,calendar_version integer NOT NULL,
 crew_role text NOT NULL CHECK(crew_role IN ('Lead','Technician','Specialist')),travel_before_minutes integer NOT NULL CHECK(travel_before_minutes>=0),travel_after_minutes integer NOT NULL CHECK(travel_after_minutes>=0),travel_reason text NOT NULL,
 PRIMARY KEY(workspace_id,request_id,resource_id),FOREIGN KEY(workspace_id,request_id) REFERENCES ppo.schedule_change_requests(workspace_id,id),FOREIGN KEY(workspace_id,resource_id) REFERENCES ppo.resources(workspace_id,id)
);
CREATE TRIGGER request_crew_immutable BEFORE UPDATE OR DELETE ON ppo.schedule_request_crew FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
-- The immutable parent seals the exact crew intent. Deferred comparison allows the
-- parent and all typed children to be written in one transaction, but rejects any
-- later insertion, deletion or substitution, including after a decision.
CREATE FUNCTION ppo.check_request_crew() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE rid uuid; wid uuid; expected jsonb; actual jsonb;
BEGIN
 IF TG_TABLE_NAME='schedule_change_requests' THEN rid:=NEW.id; ELSE rid:=NEW.request_id; END IF;
 wid:=NEW.workspace_id;
 SELECT jsonb_agg(e ORDER BY e->>'resource_id') INTO expected FROM ppo.schedule_change_requests q, jsonb_array_elements(q.crew_snapshot) e WHERE q.workspace_id=wid AND q.id=rid;
 SELECT jsonb_agg(to_jsonb(x)-ARRAY['workspace_id','request_id'] ORDER BY x.resource_id) INTO actual FROM ppo.schedule_request_crew x WHERE x.workspace_id=wid AND x.request_id=rid;
 IF expected IS DISTINCT FROM actual THEN RAISE EXCEPTION 'Typed request crew must match immutable intent' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER exact_request_crew AFTER INSERT ON ppo.schedule_change_requests DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_request_crew();
CREATE CONSTRAINT TRIGGER exact_request_crew AFTER INSERT ON ppo.schedule_request_crew DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_request_crew();
CREATE TABLE ppo.schedule_follow_ups (
 workspace_id uuid NOT NULL,appointment_id uuid NOT NULL,activity_id uuid NOT NULL,schedule_version integer NOT NULL,
 consequence text NOT NULL CHECK(consequence IN ('CustomerConfirmation','ChangedSchedule','Cancellation','ContactUnsuccessful')),
 PRIMARY KEY(workspace_id,appointment_id,activity_id),FOREIGN KEY(workspace_id,appointment_id) REFERENCES ppo.appointments(workspace_id,id),FOREIGN KEY(workspace_id,activity_id) REFERENCES ppo.activities(workspace_id,id)
);
CREATE TRIGGER follow_up_immutable BEFORE UPDATE OR DELETE ON ppo.schedule_follow_ups FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
-- Deferred consistency guards prevent partial crews and reserving a mere proposal, even through direct SQL.
CREATE FUNCTION ppo.check_booking_consistency() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE aid uuid; a ppo.appointments;
BEGIN
 IF TG_TABLE_NAME='appointments' THEN aid:=NEW.id;
 ELSIF TG_TABLE_NAME='assignments' THEN aid:=NEW.appointment_id;
 ELSE SELECT appointment_id INTO aid FROM ppo.assignments WHERE id=NEW.assignment_id; END IF;
 SELECT * INTO a FROM ppo.appointments WHERE id=aid;
 IF a.status='Confirmed' THEN
  IF (SELECT count(*) FROM ppo.assignments WHERE appointment_id=aid AND active AND crew_role='Lead')<>1 OR
   NOT EXISTS(SELECT 1 FROM ppo.assignments WHERE appointment_id=aid AND active) OR
   EXISTS(SELECT 1 FROM ppo.assignments x LEFT JOIN ppo.resource_reservations r ON r.assignment_id=x.id AND r.active WHERE x.appointment_id=aid AND x.active AND (r.id IS NULL OR x.assignment_version<>a.assignment_version OR r.start_at<>a.start_at-make_interval(mins=>x.travel_before_minutes) OR r.end_at<>a.end_at+make_interval(mins=>x.travel_after_minutes))) THEN
   RAISE EXCEPTION 'Confirmed appointment requires the complete exact crew' USING ERRCODE='23514'; END IF;
 ELSE
  IF EXISTS(SELECT 1 FROM ppo.assignments WHERE appointment_id=aid AND active) THEN RAISE EXCEPTION 'Unconfirmed appointment reserves nothing' USING ERRCODE='23514'; END IF;
 END IF;
 IF EXISTS(SELECT 1 FROM ppo.resource_reservations r JOIN ppo.assignments x ON x.id=r.assignment_id WHERE x.appointment_id=aid AND r.active AND NOT x.active) THEN RAISE EXCEPTION 'Released assignment cannot reserve capacity' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER booking_consistency AFTER INSERT OR UPDATE ON ppo.appointments DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_booking_consistency();
CREATE CONSTRAINT TRIGGER booking_consistency AFTER INSERT OR UPDATE ON ppo.assignments DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_booking_consistency();
CREATE CONSTRAINT TRIGGER booking_consistency AFTER INSERT OR UPDATE ON ppo.resource_reservations DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_booking_consistency();

CREATE OR REPLACE FUNCTION ppo.identity_has_typed_record() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target text; present boolean;
BEGIN
 target:=CASE NEW.object_type WHEN 'Ticket' THEN 'tickets' WHEN 'Organisation' THEN 'organisations' WHEN 'Person' THEN 'people' WHEN 'Site' THEN 'sites' WHEN 'Facility' THEN 'facilities' WHEN 'Asset' THEN 'assets' WHEN 'Relationship' THEN 'relationships' WHEN 'SiteParty' THEN 'site_parties' WHEN 'ErpAccountMapping' THEN 'erp_account_mappings' WHEN 'AssetConfiguration' THEN 'asset_configurations' WHEN 'AssetLocationEvent' THEN 'asset_location_events' WHEN 'HistoryRecord' THEN 'history_records' WHEN 'Activity' THEN 'activities' WHEN 'WorkOrder' THEN 'work_orders' WHEN 'Appointment' THEN 'appointments' WHEN 'ScheduleChangeRequest' THEN 'schedule_change_requests' WHEN 'ContactOutcome' THEN 'contact_outcomes' END;
 EXECUTE format('SELECT EXISTS(SELECT 1 FROM ppo.%I WHERE workspace_id=$1 AND id=$2)',target) INTO present USING NEW.workspace_id,NEW.id;
 IF NOT present THEN RAISE EXCEPTION 'Typed identity target is missing' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;

ALTER TABLE ppo.appointments ADD CONSTRAINT ck_appointment_booking_hash CHECK(booking_snapshot IS NULL OR booking_hash=encode(sha256(convert_to(booking_snapshot::text,'UTF8')),'hex'));
ALTER TABLE ppo.contact_outcomes ADD CONSTRAINT fk_contact_company_person FOREIGN KEY(workspace_id,company_id,recipient_id) REFERENCES ppo.person_company_contexts(workspace_id,company_id,person_id);
