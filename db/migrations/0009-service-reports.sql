-- Additive P09 exact submissions, review, reports and responses. Earlier migrations are preserved.
ALTER TABLE ppo.business_identities DROP CONSTRAINT ck_identities_type;
ALTER TABLE ppo.business_identities ADD CONSTRAINT ck_identities_type CHECK(object_type IN ('Ticket','Organisation','Person','Site','Facility','Asset','Relationship','SiteParty','ErpAccountMapping','AssetConfiguration','AssetLocationEvent','HistoryRecord','Activity','WorkOrder','Appointment','ScheduleChangeRequest','ContactOutcome','Pack','FieldEntry','Attachment','CompletionDraft','ServiceReport','CustomerResponse'));
ALTER TABLE ppo.audit_events DROP CONSTRAINT ck_audit_object_type;
ALTER TABLE ppo.audit_events ADD CONSTRAINT ck_audit_object_type CHECK(object_type IN ('Ticket','Session','Organisation','Person','Site','Facility','Asset','Relationship','SiteParty','ErpAccountMapping','AssetConfiguration','AssetLocationEvent','HistoryRecord','Activity','WorkOrder','Appointment','ScheduleChangeRequest','ContactOutcome','Pack','FieldEntry','Attachment','CompletionDraft','ServiceReport','CustomerResponse'));
ALTER TABLE ppo.permission_grants DROP CONSTRAINT ck_grants_capability;
ALTER TABLE ppo.permission_grants ADD CONSTRAINT ck_grants_capability CHECK(capability IN ('service.ticket.read','service.ticket.edit','shared.read','shared.create','shared.edit','shared.internal.read','shared.finance.read','shared.history.record','activity.read','activity.edit','service.work_order.read','service.work_order.edit','service.scope.authorise','service.readiness.assess','schedule.read','schedule.manage','schedule.request','schedule.contact','pack.read','pack.prepare','pack.check','pack.issue','pack.acknowledge','field.read.own','field.start.own','field.capture.own','field.correct.own','field.attachment.own','field.completion.own','report.read','report.review','report.issue','report.respond'));
ALTER TABLE ppo.reference_counters DROP CONSTRAINT ck_reference_type;
ALTER TABLE ppo.reference_counters ADD CONSTRAINT ck_reference_type CHECK(record_type IN ('ORG','SITE','AST','TKT','WO','APT','PACK','RPT'));
CREATE TABLE ppo.service_reports (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,company_id uuid NOT NULL,site_id uuid NOT NULL,appointment_id uuid NOT NULL,attendance_id uuid NOT NULL,actor_id uuid NOT NULL,
 display_number text NOT NULL,version integer NOT NULL DEFAULT 1 CHECK(version>0),revision integer NOT NULL DEFAULT 0 CHECK(revision>=0),
 status text NOT NULL CHECK(status IN ('Draft','Submitted','Returned','Reviewed','Issued')),current_revision_id uuid,current_issue_id uuid,
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),updated_by uuid NOT NULL,updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,attendance_id),UNIQUE(workspace_id,display_number),UNIQUE(workspace_id,appointment_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id,appointment_id) REFERENCES ppo.appointments(workspace_id,company_id,site_id,id),
 FOREIGN KEY(workspace_id,appointment_id,actor_id,attendance_id) REFERENCES ppo.field_attendances(workspace_id,appointment_id,actor_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id),FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.service_reports FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('ServiceReport','RPT');
CREATE FUNCTION ppo.protect_service_report() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='DELETE' OR (to_jsonb(NEW)-ARRAY['version','revision','status','current_revision_id','current_issue_id','updated_by','updated_at']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['version','revision','status','current_revision_id','current_issue_id','updated_by','updated_at']) OR NEW.version<>OLD.version+1 THEN RAISE EXCEPTION 'Report identity and version are controlled' USING ERRCODE='55000'; END IF; RETURN NEW; END $$;
CREATE TRIGGER protect BEFORE UPDATE OR DELETE ON ppo.service_reports FOR EACH ROW EXECUTE FUNCTION ppo.protect_service_report();
CREATE TABLE ppo.report_revisions (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,report_id uuid NOT NULL,appointment_id uuid NOT NULL,revision integer NOT NULL CHECK(revision>0),predecessor_id uuid,
 draft_revision_id uuid NOT NULL,actor_id uuid NOT NULL,attendance_end_at timestamptz NOT NULL CHECK(isfinite(attendance_end_at)),
 snapshot jsonb NOT NULL,source_hash text NOT NULL CHECK(source_hash ~ '^[a-f0-9]{64}$'),change_reason text NOT NULL,operation_id uuid NOT NULL,submitted_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,report_id,id),UNIQUE(workspace_id,report_id,revision),UNIQUE(workspace_id,appointment_id,id),
 FOREIGN KEY(workspace_id,appointment_id,report_id) REFERENCES ppo.service_reports(workspace_id,appointment_id,id),
 FOREIGN KEY(workspace_id,appointment_id,draft_revision_id) REFERENCES ppo.completion_draft_revisions(workspace_id,appointment_id,id),
 FOREIGN KEY(workspace_id,report_id,predecessor_id) REFERENCES ppo.report_revisions(workspace_id,report_id,id),FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id),
 CHECK((revision=1)=(predecessor_id IS NULL)),CHECK(attendance_end_at<=submitted_at+interval '5 minutes')
);
CREATE TABLE ppo.report_entry_refs (
 workspace_id uuid NOT NULL,report_revision_id uuid NOT NULL,appointment_id uuid NOT NULL,entry_id uuid NOT NULL,entry_version integer NOT NULL,
 PRIMARY KEY(workspace_id,report_revision_id,entry_id),
 FOREIGN KEY(workspace_id,appointment_id,report_revision_id) REFERENCES ppo.report_revisions(workspace_id,appointment_id,id),
 FOREIGN KEY(workspace_id,appointment_id,entry_id,entry_version) REFERENCES ppo.field_entries(workspace_id,appointment_id,id,version)
);
CREATE TABLE ppo.report_reviews (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,report_id uuid NOT NULL,revision_id uuid NOT NULL,actor_id uuid NOT NULL,
 decision text NOT NULL CHECK(decision IN ('Approved','Returned')),source_hash text NOT NULL,entry_decisions jsonb NOT NULL,
 authority_disposition text NOT NULL CHECK(authority_disposition IN ('Current','OriginalAttendanceOnly')),remarks text NOT NULL,
 recipient_id uuid,customer_snapshot jsonb,customer_hash text,source_guard jsonb,operation_id uuid NOT NULL,reviewed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,report_id,id),UNIQUE(workspace_id,revision_id),
 FOREIGN KEY(workspace_id,report_id,revision_id) REFERENCES ppo.report_revisions(workspace_id,report_id,id),FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,recipient_id) REFERENCES ppo.people(workspace_id,id),
 CHECK(decision<>'Approved' OR (recipient_id IS NOT NULL AND customer_snapshot IS NOT NULL AND customer_hash ~ '^[a-f0-9]{64}$' AND source_guard IS NOT NULL))
);
CREATE TABLE ppo.attendance_acceptances (
 workspace_id uuid NOT NULL,attendance_id uuid NOT NULL,report_id uuid NOT NULL,review_id uuid NOT NULL,accepted_end_at timestamptz NOT NULL,
 accepted_at timestamptz NOT NULL DEFAULT clock_timestamp(),PRIMARY KEY(workspace_id,attendance_id),
 FOREIGN KEY(workspace_id,attendance_id) REFERENCES ppo.field_attendances(workspace_id,id),
 FOREIGN KEY(workspace_id,report_id,review_id) REFERENCES ppo.report_reviews(workspace_id,report_id,id)
);
CREATE TABLE ppo.report_cycles (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,report_id uuid NOT NULL,predecessor_id uuid NOT NULL,actor_id uuid NOT NULL,reason text NOT NULL,operation_id uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,report_id,predecessor_id),FOREIGN KEY(workspace_id,report_id,predecessor_id) REFERENCES ppo.report_revisions(workspace_id,report_id,id),FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.report_templates (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL REFERENCES ppo.workspaces(id),version integer NOT NULL CHECK(version>0),definition text NOT NULL,content_hash text NOT NULL,
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,version)
);
CREATE TABLE ppo.report_template_policy (workspace_id uuid PRIMARY KEY REFERENCES ppo.workspaces(id),template_id uuid NOT NULL,version integer NOT NULL DEFAULT 1,FOREIGN KEY(workspace_id,template_id) REFERENCES ppo.report_templates(workspace_id,id));
CREATE TABLE ppo.report_render_jobs (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,report_id uuid NOT NULL,revision_id uuid NOT NULL,review_id uuid NOT NULL,actor_id uuid NOT NULL,recovery_owner_id uuid NOT NULL,
 operation_id uuid NOT NULL,finalisation_operation_id uuid NOT NULL UNIQUE,render_snapshot jsonb NOT NULL,input_hash text NOT NULL,
 state text NOT NULL DEFAULT 'Queued' CHECK(state IN ('Queued','Running','Durable','Failed','StaleSource','Issued')),attempts integer NOT NULL DEFAULT 0,lease_token uuid,lease_until timestamptz,error_code text,output_manifest jsonb,issue_id uuid,
 requested_at timestamptz NOT NULL DEFAULT clock_timestamp(),UNIQUE(workspace_id,id),UNIQUE(workspace_id,report_id,id),UNIQUE(workspace_id,actor_id,operation_id),UNIQUE(workspace_id,revision_id),
 FOREIGN KEY(workspace_id,report_id,revision_id) REFERENCES ppo.report_revisions(workspace_id,report_id,id),FOREIGN KEY(workspace_id,report_id,review_id) REFERENCES ppo.report_reviews(workspace_id,report_id,id),
 FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id),FOREIGN KEY(workspace_id,recovery_owner_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.report_render_attempts (id uuid PRIMARY KEY,workspace_id uuid NOT NULL,job_id uuid NOT NULL,attempt integer NOT NULL,outcome text NOT NULL,code text,occurred_at timestamptz NOT NULL DEFAULT clock_timestamp(),FOREIGN KEY(workspace_id,job_id) REFERENCES ppo.report_render_jobs(workspace_id,id));
CREATE TABLE ppo.report_issues (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,report_id uuid NOT NULL,revision_id uuid NOT NULL,review_id uuid NOT NULL,render_job_id uuid NOT NULL,
 issued_by uuid NOT NULL,issued_at timestamptz NOT NULL DEFAULT clock_timestamp(),manifest jsonb NOT NULL,output_hash text NOT NULL,recipient_id uuid NOT NULL,
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,report_id,id),UNIQUE(workspace_id,revision_id),UNIQUE(workspace_id,render_job_id),
 FOREIGN KEY(workspace_id,report_id,revision_id) REFERENCES ppo.report_revisions(workspace_id,report_id,id),FOREIGN KEY(workspace_id,report_id,review_id) REFERENCES ppo.report_reviews(workspace_id,report_id,id),
 FOREIGN KEY(workspace_id,report_id,render_job_id) REFERENCES ppo.report_render_jobs(workspace_id,report_id,id),FOREIGN KEY(workspace_id,issued_by) REFERENCES ppo.users(workspace_id,id),FOREIGN KEY(workspace_id,recipient_id) REFERENCES ppo.people(workspace_id,id)
);
CREATE TABLE ppo.report_presentations (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,report_id uuid NOT NULL,revision_id uuid NOT NULL,issue_id uuid,
 kind text NOT NULL CHECK(kind IN ('IssuedReport','DraftEvidence')),content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'),html_hash text NOT NULL,html text,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),UNIQUE(workspace_id,id),UNIQUE(workspace_id,report_id,revision_id,kind),UNIQUE(workspace_id,report_id,id,content_hash),
 FOREIGN KEY(workspace_id,report_id,revision_id) REFERENCES ppo.report_revisions(workspace_id,report_id,id),FOREIGN KEY(workspace_id,report_id,issue_id) REFERENCES ppo.report_issues(workspace_id,report_id,id),
 CHECK((kind='IssuedReport' AND issue_id IS NOT NULL AND html IS NULL) OR (kind='DraftEvidence' AND issue_id IS NULL AND html IS NOT NULL AND content_hash=html_hash))
);
CREATE TABLE ppo.customer_responses (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,report_id uuid NOT NULL,presentation_id uuid NOT NULL,presented_hash text NOT NULL,
 response text NOT NULL CHECK(response IN ('Accepted','AcceptedWithReservations','Declined','Unavailable','Disputed')),
 respondent_name text,respondent_role text,remarks text,next_action text,presented_at timestamptz NOT NULL,captured_at timestamptz NOT NULL,
 actor_id uuid NOT NULL,received_at timestamptz NOT NULL DEFAULT clock_timestamp(),operation_id uuid NOT NULL,
 signature_key jsonb,signature_hash text,signature_bytes integer,follow_up_activity_id uuid,
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,actor_id,operation_id),
 FOREIGN KEY(workspace_id,report_id,presentation_id,presented_hash) REFERENCES ppo.report_presentations(workspace_id,report_id,id,content_hash),
 FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id),FOREIGN KEY(workspace_id,follow_up_activity_id) REFERENCES ppo.activities(workspace_id,id),
 CHECK(isfinite(presented_at) AND isfinite(captured_at) AND presented_at<=captured_at AND captured_at<=received_at+interval '5 minutes'),
 CHECK((response='Unavailable' AND respondent_name IS NULL AND respondent_role IS NULL AND signature_key IS NULL) OR (response<>'Unavailable' AND respondent_name IS NOT NULL AND respondent_role IS NOT NULL AND length(btrim(respondent_name))>0 AND length(btrim(respondent_role))>0)),
 CHECK(response='Accepted' OR (remarks IS NOT NULL AND next_action IS NOT NULL AND length(btrim(remarks))>=10 AND length(btrim(next_action))>=10 AND follow_up_activity_id IS NOT NULL)),
 CHECK((signature_key IS NULL AND signature_hash IS NULL AND signature_bytes IS NULL) OR (signature_key IS NOT NULL AND signature_hash ~ '^[a-f0-9]{64}$' AND signature_bytes BETWEEN 1 AND 4194304))
);
CREATE TRIGGER register_identity BEFORE INSERT ON ppo.customer_responses FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('CustomerResponse','');
CREATE TABLE ppo.report_follow_ups (workspace_id uuid NOT NULL,report_id uuid NOT NULL,activity_id uuid NOT NULL,kind text NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),PRIMARY KEY(workspace_id,report_id,activity_id),FOREIGN KEY(workspace_id,report_id) REFERENCES ppo.service_reports(workspace_id,id),FOREIGN KEY(workspace_id,activity_id) REFERENCES ppo.activities(workspace_id,id));
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['report_revisions','report_entry_refs','report_reviews','attendance_acceptances','report_cycles','report_templates','report_render_attempts','report_issues','report_presentations','customer_responses','report_follow_ups'] LOOP EXECUTE format('CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON ppo.%I FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence()',t); END LOOP; END $$;
ALTER TABLE ppo.service_reports ADD FOREIGN KEY(workspace_id,id,current_revision_id) REFERENCES ppo.report_revisions(workspace_id,report_id,id);
ALTER TABLE ppo.service_reports ADD FOREIGN KEY(workspace_id,id,current_issue_id) REFERENCES ppo.report_issues(workspace_id,report_id,id);
ALTER TABLE ppo.appointments DROP CONSTRAINT ck_appointments_state;
ALTER TABLE ppo.appointments ADD CONSTRAINT ck_appointments_state CHECK(status IN ('Proposed','Confirmed','InProgress','CompletedPendingReview','Completed','Cancelled'));
CREATE OR REPLACE FUNCTION ppo.protect_started_appointment() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF OLD.actual_start_at IS NOT NULL AND ((NEW.actual_start_at,NEW.start_at,NEW.end_at,NEW.schedule_version,NEW.assignment_version) IS DISTINCT FROM (OLD.actual_start_at,OLD.start_at,OLD.end_at,OLD.schedule_version,OLD.assignment_version) OR (NEW.status<>OLD.status AND NOT ((OLD.status='InProgress' AND NEW.status='CompletedPendingReview') OR (OLD.status='CompletedPendingReview' AND NEW.status='Completed')))) THEN RAISE EXCEPTION 'Started attendance cannot be rewritten as a future booking' USING ERRCODE='55000'; END IF;
 IF OLD.status='Completed' AND NEW.actual_end_at IS DISTINCT FROM OLD.actual_end_at THEN RAISE EXCEPTION 'Accepted attendance end is immutable' USING ERRCODE='55000'; END IF;
 IF NEW.status='CompletedPendingReview' AND NOT EXISTS(SELECT 1 FROM ppo.report_revisions r WHERE r.workspace_id=NEW.workspace_id AND r.appointment_id=NEW.id) THEN RAISE EXCEPTION 'Exact submission required' USING ERRCODE='23514'; END IF;
 IF NEW.status='Completed' AND (NEW.actual_end_at IS NULL OR EXISTS(SELECT 1 FROM ppo.field_attendances a WHERE a.workspace_id=NEW.workspace_id AND a.appointment_id=NEW.id AND NOT EXISTS(SELECT 1 FROM ppo.attendance_acceptances x WHERE x.workspace_id=a.workspace_id AND x.attendance_id=a.id))) THEN RAISE EXCEPTION 'All actual attendances must be accepted' USING ERRCODE='23514'; END IF; RETURN NEW; END $$;
CREATE FUNCTION ppo.guard_report_capture() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE r ppo.service_reports; accepted boolean; BEGIN
 SELECT * INTO r FROM ppo.service_reports WHERE workspace_id=NEW.workspace_id AND attendance_id=NEW.attendance_id;
 IF r.id IS NULL THEN RETURN NEW; END IF;
 IF r.status IN ('Submitted','Reviewed','Issued') THEN RAISE EXCEPTION 'Open an explicit correction cycle or return the exact submission before changing evidence' USING ERRCODE='55000'; END IF;
 SELECT EXISTS(SELECT 1 FROM ppo.attendance_acceptances WHERE workspace_id=NEW.workspace_id AND attendance_id=NEW.attendance_id) INTO accepted;
 IF accepted AND NEW.supersedes_entry_id IS NULL THEN RAISE EXCEPTION 'Accepted attendance permits linked factual corrections only; new physical work needs a new visit' USING ERRCODE='55000'; END IF; RETURN NEW; END $$;
CREATE TRIGGER report_capture_guard BEFORE INSERT ON ppo.field_entries FOR EACH ROW EXECUTE FUNCTION ppo.guard_report_capture();

CREATE OR REPLACE FUNCTION ppo.identity_has_typed_record() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target text; present boolean;
BEGIN
 target:=CASE NEW.object_type WHEN 'Ticket' THEN 'tickets' WHEN 'Organisation' THEN 'organisations' WHEN 'Person' THEN 'people' WHEN 'Site' THEN 'sites' WHEN 'Facility' THEN 'facilities' WHEN 'Asset' THEN 'assets' WHEN 'Relationship' THEN 'relationships' WHEN 'SiteParty' THEN 'site_parties' WHEN 'ErpAccountMapping' THEN 'erp_account_mappings' WHEN 'AssetConfiguration' THEN 'asset_configurations' WHEN 'AssetLocationEvent' THEN 'asset_location_events' WHEN 'HistoryRecord' THEN 'history_records' WHEN 'Activity' THEN 'activities' WHEN 'WorkOrder' THEN 'work_orders' WHEN 'Appointment' THEN 'appointments' WHEN 'ScheduleChangeRequest' THEN 'schedule_change_requests' WHEN 'ContactOutcome' THEN 'contact_outcomes' WHEN 'Pack' THEN 'packs' WHEN 'FieldEntry' THEN 'field_entries' WHEN 'Attachment' THEN 'field_attachments' WHEN 'CompletionDraft' THEN 'completion_drafts' WHEN 'ServiceReport' THEN 'service_reports' WHEN 'CustomerResponse' THEN 'customer_responses' END;
 EXECUTE format('SELECT EXISTS(SELECT 1 FROM ppo.%I WHERE workspace_id=$1 AND id=$2)',target) INTO present USING NEW.workspace_id,NEW.id;
 IF NOT present THEN RAISE EXCEPTION 'Typed identity target is missing' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION ppo.check_booking_consistency() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE aid uuid; a ppo.appointments;
BEGIN
 IF TG_TABLE_NAME='appointments' THEN aid:=NEW.id;
 ELSIF TG_TABLE_NAME='assignments' THEN aid:=NEW.appointment_id;
 ELSE SELECT appointment_id INTO aid FROM ppo.assignments WHERE id=NEW.assignment_id; END IF;
 SELECT * INTO a FROM ppo.appointments WHERE id=aid;
 IF a.status IN ('Confirmed','InProgress','CompletedPendingReview','Completed') THEN
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

-- Input identity is immutable even while the bounded worker changes its lease/state.
CREATE FUNCTION ppo.protect_report_job() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='DELETE' OR (to_jsonb(NEW)-ARRAY['state','attempts','lease_token','lease_until','error_code','output_manifest','issue_id']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['state','attempts','lease_token','lease_until','error_code','output_manifest','issue_id']) OR (OLD.state IN ('Issued','StaleSource') AND NEW IS DISTINCT FROM OLD) OR (OLD.output_manifest IS NOT NULL AND NEW.output_manifest IS DISTINCT FROM OLD.output_manifest) THEN RAISE EXCEPTION 'Original render input, durable manifest and terminal outcome are immutable' USING ERRCODE='55000'; END IF; RETURN NEW;
END $$;
CREATE TRIGGER protect_job BEFORE UPDATE OR DELETE ON ppo.report_render_jobs FOR EACH ROW EXECUTE FUNCTION ppo.protect_report_job();
CREATE FUNCTION ppo.check_report_fact() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE r ppo.service_reports; v ppo.report_revisions; review ppo.report_reviews; job ppo.report_render_jobs; issue ppo.report_issues; presentation ppo.report_presentations;
BEGIN
 IF TG_TABLE_NAME='report_entry_refs' THEN
  SELECT * INTO v FROM ppo.report_revisions WHERE workspace_id=NEW.workspace_id AND id=NEW.report_revision_id;
  IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(v.snapshot->'entries') e WHERE e->>'id'=NEW.entry_id::text AND (e->>'version')::integer=NEW.entry_version) THEN RAISE EXCEPTION 'Entry ref must belong to the sealed submitted snapshot' USING ERRCODE='23514'; END IF; RETURN NEW;
 END IF;
 SELECT * INTO r FROM ppo.service_reports WHERE workspace_id=NEW.workspace_id AND id=NEW.report_id;
 IF TG_TABLE_NAME='report_revisions' THEN
  IF r.actor_id<>NEW.actor_id OR NEW.revision<>r.revision+1 OR NEW.predecessor_id IS DISTINCT FROM r.current_revision_id OR r.status NOT IN ('Draft','Returned') OR NEW.snapshot#>>'{attendance,id}'<>r.attendance_id::text OR NOT EXISTS(SELECT 1 FROM ppo.completion_draft_revisions d WHERE d.id=NEW.draft_revision_id AND d.actor_id=NEW.actor_id AND d.attendance_id=r.attendance_id) THEN RAISE EXCEPTION 'Exact personal submission and successor lineage required' USING ERRCODE='23514'; END IF;
 ELSIF TG_TABLE_NAME='report_reviews' THEN
  SELECT * INTO v FROM ppo.report_revisions WHERE workspace_id=NEW.workspace_id AND id=NEW.revision_id;
  IF r.status<>'Submitted' OR r.current_revision_id<>NEW.revision_id OR v.source_hash<>NEW.source_hash OR (SELECT jsonb_agg(jsonb_build_object('id',e.entry_id,'version',e.entry_version) ORDER BY e.entry_id) FROM ppo.report_entry_refs e WHERE e.report_revision_id=v.id) IS DISTINCT FROM (SELECT jsonb_agg(jsonb_build_object('id',e->>'id','version',(e->>'version')::integer) ORDER BY e->>'id') FROM jsonb_array_elements(NEW.entry_decisions) e) OR (NEW.decision='Approved' AND EXISTS(SELECT 1 FROM jsonb_array_elements(NEW.entry_decisions) e WHERE e->>'decision'<>'Approved')) THEN RAISE EXCEPTION 'Review requires the exact current submitted set' USING ERRCODE='23514'; END IF;
 ELSIF TG_TABLE_NAME='attendance_acceptances' THEN
  SELECT * INTO review FROM ppo.report_reviews WHERE workspace_id=NEW.workspace_id AND id=NEW.review_id;
  SELECT * INTO v FROM ppo.report_revisions WHERE id=review.revision_id;
  IF review.decision<>'Approved' OR r.attendance_id<>NEW.attendance_id OR v.attendance_end_at<>NEW.accepted_end_at THEN RAISE EXCEPTION 'Acceptance must match the reviewed actual attendance' USING ERRCODE='23514'; END IF;
 ELSIF TG_TABLE_NAME='report_issues' THEN
  SELECT * INTO job FROM ppo.report_render_jobs WHERE workspace_id=NEW.workspace_id AND id=NEW.render_job_id;
  SELECT * INTO review FROM ppo.report_reviews WHERE workspace_id=NEW.workspace_id AND id=NEW.review_id;
  IF r.status<>'Reviewed' OR r.current_revision_id<>NEW.revision_id OR review.decision<>'Approved' OR review.revision_id<>NEW.revision_id OR job.state<>'Durable' OR job.revision_id<>NEW.revision_id OR job.review_id<>NEW.review_id OR job.output_manifest IS DISTINCT FROM NEW.manifest OR NEW.output_hash<>NEW.manifest->>'pdf_hash' THEN RAISE EXCEPTION 'Issue requires the exact reviewed durable output' USING ERRCODE='23514'; END IF;
 ELSIF TG_TABLE_NAME='report_presentations' THEN
  IF NEW.kind='IssuedReport' THEN
   SELECT * INTO issue FROM ppo.report_issues WHERE workspace_id=NEW.workspace_id AND id=NEW.issue_id;
   IF issue.revision_id<>NEW.revision_id OR NEW.content_hash<>issue.manifest->>'html_hash' OR NEW.html_hash<>NEW.content_hash THEN RAISE EXCEPTION 'Presentation must bind the exact issued HTML bytes' USING ERRCODE='23514'; END IF;
  ELSIF NEW.content_hash<>encode(sha256(convert_to(NEW.html,'UTF8')),'hex') OR NOT EXISTS(SELECT 1 FROM ppo.report_reviews WHERE workspace_id=NEW.workspace_id AND revision_id=NEW.revision_id AND decision='Approved') THEN RAISE EXCEPTION 'Draft presentation requires reviewed exact HTML' USING ERRCODE='23514'; END IF;
 ELSIF TG_TABLE_NAME='customer_responses' THEN
  SELECT * INTO presentation FROM ppo.report_presentations WHERE workspace_id=NEW.workspace_id AND id=NEW.presentation_id;
  IF r.status NOT IN ('Reviewed','Issued') OR r.current_revision_id<>presentation.revision_id OR NEW.presented_at<presentation.created_at OR NEW.presented_hash<>presentation.content_hash THEN RAISE EXCEPTION 'Response requires the exact current presented content' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['report_revisions','report_entry_refs','report_reviews','attendance_acceptances','report_issues','report_presentations','customer_responses'] LOOP EXECUTE format('CREATE TRIGGER exact_fact BEFORE INSERT ON ppo.%I FOR EACH ROW EXECUTE FUNCTION ppo.check_report_fact()',t); END LOOP; END $$;
