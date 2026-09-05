-- P07 additive online field evidence. Earlier migration and seed bytes remain unchanged.
ALTER TABLE ppo.business_identities DROP CONSTRAINT ck_identities_type;
ALTER TABLE ppo.business_identities ADD CONSTRAINT ck_identities_type CHECK(object_type IN ('Ticket','Organisation','Person','Site','Facility','Asset','Relationship','SiteParty','ErpAccountMapping','AssetConfiguration','AssetLocationEvent','HistoryRecord','Activity','WorkOrder','Appointment','ScheduleChangeRequest','ContactOutcome','Pack','FieldEntry','Attachment','CompletionDraft'));
ALTER TABLE ppo.audit_events DROP CONSTRAINT ck_audit_object_type;
ALTER TABLE ppo.audit_events ADD CONSTRAINT ck_audit_object_type CHECK(object_type IN ('Ticket','Session','Organisation','Person','Site','Facility','Asset','Relationship','SiteParty','ErpAccountMapping','AssetConfiguration','AssetLocationEvent','HistoryRecord','Activity','WorkOrder','Appointment','ScheduleChangeRequest','ContactOutcome','Pack','FieldEntry','Attachment','CompletionDraft'));
ALTER TABLE ppo.permission_grants DROP CONSTRAINT ck_grants_capability;
ALTER TABLE ppo.permission_grants ADD CONSTRAINT ck_grants_capability CHECK(capability IN ('service.ticket.read','service.ticket.edit','shared.read','shared.create','shared.edit','shared.internal.read','shared.finance.read','shared.history.record','activity.read','activity.edit','service.work_order.read','service.work_order.edit','service.scope.authorise','service.readiness.assess','schedule.read','schedule.manage','schedule.request','schedule.contact','pack.read','pack.prepare','pack.check','pack.issue','pack.acknowledge','field.read.own','field.start.own','field.capture.own','field.correct.own','field.attachment.own','field.completion.own'));
ALTER TABLE ppo.outbox_jobs DROP CONSTRAINT ck_outbox_kind;
ALTER TABLE ppo.outbox_jobs ADD CONSTRAINT ck_outbox_kind CHECK(kind IN ('TicketDraftSaved','SharedRecordCreated','SharedRecordUpdated','SharedHistoryRecorded','TicketCreated','TicketIntakeSaved','TicketInformationRequested','TicketTriaged','ActivityCreated','ActivityUpdated','ActivityStarted','ActivityCompleted','ActivityCancelled','WorkOrderCreated','ScopeDraftSaved','ScopeSuccessorCreated','ScopeAuthorised','ReadinessAssessed','AppointmentProposed','AppointmentConfirmed','AppointmentChanged','AppointmentCancelled','ScheduleChangeRequested','ScheduleChangeDecided','ContactOutcomeRecorded','PackPrepared','PackChecked','PackReturned','PackIssueRequested','PackIssued','PackAmendmentRaised','PackWithdrawn','PackAcknowledged','PackDistributionRecorded','AttendanceStarted','FieldEvidenceAccepted','FieldEvidenceCorrected','AttachmentInitiated','AttachmentUploaded','AttachmentFinalised','CompletionDraftSaved'));
CREATE OR REPLACE FUNCTION ppo.identity_has_typed_record() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target text; present boolean;
BEGIN
 target:=CASE NEW.object_type WHEN 'Ticket' THEN 'tickets' WHEN 'Organisation' THEN 'organisations' WHEN 'Person' THEN 'people' WHEN 'Site' THEN 'sites' WHEN 'Facility' THEN 'facilities' WHEN 'Asset' THEN 'assets' WHEN 'Relationship' THEN 'relationships' WHEN 'SiteParty' THEN 'site_parties' WHEN 'ErpAccountMapping' THEN 'erp_account_mappings' WHEN 'AssetConfiguration' THEN 'asset_configurations' WHEN 'AssetLocationEvent' THEN 'asset_location_events' WHEN 'HistoryRecord' THEN 'history_records' WHEN 'Activity' THEN 'activities' WHEN 'WorkOrder' THEN 'work_orders' WHEN 'Appointment' THEN 'appointments' WHEN 'ScheduleChangeRequest' THEN 'schedule_change_requests' WHEN 'ContactOutcome' THEN 'contact_outcomes' WHEN 'Pack' THEN 'packs' WHEN 'FieldEntry' THEN 'field_entries' WHEN 'Attachment' THEN 'field_attachments' WHEN 'CompletionDraft' THEN 'completion_drafts' END;
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
 IF a.status IN ('Confirmed','InProgress') THEN
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
CREATE OR REPLACE FUNCTION ppo.invalidate_pack_applicability() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE a record; k text; why text;
BEGIN
 IF TG_TABLE_NAME='appointments' THEN
  IF (NEW.schedule_version,NEW.assignment_version) IS NOT DISTINCT FROM (OLD.schedule_version,OLD.assignment_version) AND NEW.status<>'Cancelled' THEN RETURN NEW; END IF;
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
CREATE OR REPLACE FUNCTION ppo.guard_pack_dispatch() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE p ppo.packs; i ppo.pack_issues;
BEGIN
 IF NEW.dispatch_hold THEN RETURN NEW; END IF;
 SELECT * INTO p FROM ppo.packs WHERE workspace_id=NEW.workspace_id AND appointment_id=NEW.id;
 SELECT * INTO i FROM ppo.pack_issues WHERE workspace_id=NEW.workspace_id AND id=p.current_issue_id;
 IF p.id IS NULL OR i.id IS NULL OR p.needs_review OR p.status<>'Issued' OR NEW.status NOT IN ('Confirmed','InProgress') OR NEW.customer_commitment<>'Confirmed' OR NEW.pack_requirement<>'Acknowledged' OR NEW.assignment_version<>i.assignment_version OR NEW.schedule_version<>i.schedule_version OR NOT EXISTS(SELECT 1 FROM ppo.work_orders w WHERE w.id=NEW.work_order_id AND w.scope_revision_id=w.authorised_scope_revision_id AND w.authorised_scope_revision_id=NEW.scope_revision_id)
 OR NOT EXISTS(SELECT 1 FROM ppo.assignments x WHERE x.appointment_id=NEW.id AND x.active)
 OR EXISTS(SELECT 1 FROM ppo.assignments x LEFT JOIN ppo.pack_recipients r ON r.assignment_id=x.id AND r.issue_id=i.id LEFT JOIN ppo.pack_acknowledgements a ON a.recipient_id=r.id WHERE x.appointment_id=NEW.id AND x.active AND (r.id IS NULL OR a.id IS NULL OR a.presented_hash<>i.output_hash)) THEN
 RAISE EXCEPTION 'Current issue and every independent crew response are required to clear dispatch hold' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
ALTER TABLE ppo.appointments DROP CONSTRAINT ck_appointments_state;
ALTER TABLE ppo.appointments ADD CONSTRAINT ck_appointments_state CHECK(status IN ('Proposed','Confirmed','InProgress','Cancelled'));
ALTER TABLE ppo.appointments ADD CONSTRAINT ck_in_progress_start CHECK(status<>'InProgress' OR actual_start_at IS NOT NULL);
CREATE FUNCTION ppo.protect_started_appointment() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.actual_start_at IS NOT NULL AND (NEW.actual_start_at,NEW.start_at,NEW.end_at,NEW.schedule_version,NEW.assignment_version,NEW.status) IS DISTINCT FROM (OLD.actual_start_at,OLD.start_at,OLD.end_at,OLD.schedule_version,OLD.assignment_version,OLD.status) THEN
 RAISE EXCEPTION 'Started attendance cannot be rewritten as a future booking' USING ERRCODE='55000'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER protect_started BEFORE UPDATE ON ppo.appointments FOR EACH ROW EXECUTE FUNCTION ppo.protect_started_appointment();
CREATE TABLE ppo.field_attendances (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, site_id uuid NOT NULL, appointment_id uuid NOT NULL,
 actor_id uuid NOT NULL, assignment_id uuid NOT NULL, assignment_version integer NOT NULL, schedule_version integer NOT NULL,
 scope_revision_id uuid NOT NULL, scope_version integer NOT NULL, scope_hash text NOT NULL, issue_id uuid NOT NULL, issue_hash text NOT NULL,
 captured_at timestamptz NOT NULL CHECK(isfinite(captured_at)), received_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 authority_snapshot jsonb NOT NULL, authority_hash text NOT NULL, operation_id uuid NOT NULL, reason text NOT NULL,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,appointment_id,actor_id), UNIQUE(workspace_id,appointment_id,actor_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id,appointment_id) REFERENCES ppo.appointments(workspace_id,company_id,site_id,id),
 FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id), FOREIGN KEY(workspace_id,assignment_id) REFERENCES ppo.assignments(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id,scope_revision_id) REFERENCES ppo.scope_revisions(workspace_id,company_id,site_id,id),
 FOREIGN KEY(workspace_id,issue_id) REFERENCES ppo.pack_issues(workspace_id,id),
 CHECK(authority_hash=encode(sha256(convert_to(authority_snapshot::text,'UTF8')),'hex')),
 CHECK(scope_hash ~ '^[a-f0-9]{64}$' AND issue_hash ~ '^[a-f0-9]{64}$'), CHECK(captured_at<=received_at+interval '5 minutes')
);
CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON ppo.field_attendances FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.guard_field_attendance() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE a ppo.appointments;
BEGIN
 SELECT * INTO a FROM ppo.appointments WHERE workspace_id=NEW.workspace_id AND id=NEW.appointment_id;
 IF a.status NOT IN ('Confirmed','InProgress') OR a.dispatch_hold OR a.scope_revision_id<>NEW.scope_revision_id OR a.scope_version<>NEW.scope_version OR a.assignment_version<>NEW.assignment_version OR a.schedule_version<>NEW.schedule_version
 OR NOT EXISTS(SELECT 1 FROM ppo.assignments x JOIN ppo.resources r ON r.id=x.resource_id WHERE x.id=NEW.assignment_id AND x.appointment_id=a.id AND x.active AND r.user_id=NEW.actor_id AND x.assignment_version=NEW.assignment_version)
 OR NOT EXISTS(SELECT 1 FROM ppo.packs p JOIN ppo.pack_issues i ON i.id=p.current_issue_id WHERE p.appointment_id=a.id AND p.status='Issued' AND NOT p.needs_review AND i.id=NEW.issue_id AND i.output_hash=NEW.issue_hash)
 THEN RAISE EXCEPTION 'Current personal start authority is required' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard BEFORE INSERT ON ppo.field_attendances FOR EACH ROW EXECUTE FUNCTION ppo.guard_field_attendance();
CREATE TABLE ppo.field_attachments (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, site_id uuid NOT NULL, appointment_id uuid NOT NULL,
 actor_id uuid NOT NULL, attendance_id uuid NOT NULL, upload_operation_id uuid NOT NULL, storage_item_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version>0), filename text NOT NULL, media_type text NOT NULL CHECK(media_type='image/png'),
 byte_count integer NOT NULL CHECK(byte_count BETWEEN 1 AND 4194304), content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'),
 access_class text NOT NULL DEFAULT 'RestrictedService' CHECK(access_class='RestrictedService'),
 status text NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending','Uploaded','Quarantined','Available','Rejected')),
 width integer, height integer, storage_version text, error_code text, received_at timestamptz NOT NULL DEFAULT clock_timestamp(), verified_at timestamptz,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,appointment_id,id), UNIQUE(workspace_id,actor_id,upload_operation_id), UNIQUE(workspace_id,storage_item_id),
 FOREIGN KEY(workspace_id,company_id,site_id,appointment_id) REFERENCES ppo.appointments(workspace_id,company_id,site_id,id),
 FOREIGN KEY(workspace_id,appointment_id,actor_id,attendance_id) REFERENCES ppo.field_attendances(workspace_id,appointment_id,actor_id,id),
 CHECK(status<>'Available' OR (width BETWEEN 1 AND 4096 AND height BETWEEN 1 AND 4096 AND width::bigint*height<=12000000 AND storage_version=content_hash AND verified_at IS NOT NULL))
);
CREATE FUNCTION ppo.protect_field_attachment() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' OR (to_jsonb(NEW)-ARRAY['version','status','width','height','storage_version','error_code','verified_at']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['version','status','width','height','storage_version','error_code','verified_at']) OR NEW.version<>OLD.version+1 OR OLD.status='Available' THEN
 RAISE EXCEPTION 'Attachment identity and accepted bytes are immutable' USING ERRCODE='55000'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER protect BEFORE UPDATE OR DELETE ON ppo.field_attachments FOR EACH ROW EXECUTE FUNCTION ppo.protect_field_attachment();
CREATE TABLE ppo.field_attachment_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),workspace_id uuid NOT NULL,attachment_id uuid NOT NULL,actor_id uuid NOT NULL,
 status text NOT NULL CHECK(status IN ('Pending','Uploaded','Quarantined','Available','Rejected')),code text,received_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 FOREIGN KEY(workspace_id,attachment_id) REFERENCES ppo.field_attachments(workspace_id,id), FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON ppo.field_attachment_events FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.field_entries (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, site_id uuid NOT NULL, appointment_id uuid NOT NULL,
 actor_id uuid NOT NULL, attendance_id uuid NOT NULL, assignment_id uuid NOT NULL, assignment_version integer NOT NULL,
 issue_id uuid NOT NULL, issue_hash text NOT NULL, scope_revision_id uuid NOT NULL, scope_version integer NOT NULL, scope_hash text NOT NULL,
 root_id uuid NOT NULL, version integer NOT NULL CHECK(version>0), supersedes_entry_id uuid, correction_reason text,
 kind text NOT NULL CHECK(kind IN ('Time','Material','Observation','Reading','Checklist','Photo')),
 scope_item_id uuid, asset_id uuid, captured_at timestamptz NOT NULL CHECK(isfinite(captured_at)), received_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 review_status text NOT NULL DEFAULT 'Captured' CHECK(review_status='Captured'), authority_state text NOT NULL CHECK(authority_state IN ('Current','ReviewRequired')),
 payload_schema_version integer NOT NULL DEFAULT 1 CHECK(payload_schema_version=1), payload jsonb NOT NULL CHECK(jsonb_typeof(payload)='object'),
 operation_id uuid NOT NULL, UNIQUE(workspace_id,id), UNIQUE(workspace_id,appointment_id,id), UNIQUE(workspace_id,root_id,version), UNIQUE(workspace_id,supersedes_entry_id),
 FOREIGN KEY(workspace_id,company_id,site_id,appointment_id) REFERENCES ppo.appointments(workspace_id,company_id,site_id,id),
 FOREIGN KEY(workspace_id,appointment_id,actor_id,attendance_id) REFERENCES ppo.field_attendances(workspace_id,appointment_id,actor_id,id),
 FOREIGN KEY(workspace_id,assignment_id) REFERENCES ppo.assignments(workspace_id,id), FOREIGN KEY(workspace_id,issue_id) REFERENCES ppo.pack_issues(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id,scope_revision_id) REFERENCES ppo.scope_revisions(workspace_id,company_id,site_id,id),
 FOREIGN KEY(workspace_id,scope_revision_id,scope_item_id) REFERENCES ppo.scope_items(workspace_id,scope_revision_id,id),
 FOREIGN KEY(workspace_id,scope_item_id,asset_id) REFERENCES ppo.scope_assets(workspace_id,scope_item_id,asset_id),
 FOREIGN KEY(workspace_id,appointment_id,supersedes_entry_id) REFERENCES ppo.field_entries(workspace_id,appointment_id,id),
 CHECK(asset_id IS NULL OR scope_item_id IS NOT NULL), CHECK(captured_at<=received_at+interval '5 minutes'),
 CHECK((version=1 AND root_id=id AND supersedes_entry_id IS NULL AND correction_reason IS NULL) OR (version>1 AND supersedes_entry_id IS NOT NULL AND length(btrim(correction_reason))>0))
);
CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON ppo.field_entries FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.guard_field_lineage() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE old ppo.field_entries; a ppo.field_attendances;
BEGIN
 SELECT * INTO a FROM ppo.field_attendances WHERE workspace_id=NEW.workspace_id AND id=NEW.attendance_id;
 IF (NEW.assignment_id,NEW.assignment_version,NEW.issue_id,NEW.issue_hash,NEW.scope_revision_id,NEW.scope_version,NEW.scope_hash) IS DISTINCT FROM (a.assignment_id,a.assignment_version,a.issue_id,a.issue_hash,a.scope_revision_id,a.scope_version,a.scope_hash) THEN RAISE EXCEPTION 'Original capture authority must be retained' USING ERRCODE='23514'; END IF;
 IF NEW.supersedes_entry_id IS NOT NULL THEN
 SELECT * INTO old FROM ppo.field_entries WHERE workspace_id=NEW.workspace_id AND id=NEW.supersedes_entry_id;
 IF (old.root_id,old.kind,old.actor_id,old.attendance_id,old.version+1) IS DISTINCT FROM (NEW.root_id,NEW.kind,NEW.actor_id,NEW.attendance_id,NEW.version) THEN RAISE EXCEPTION 'Correction lineage must be exact' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard BEFORE INSERT ON ppo.field_entries FOR EACH ROW EXECUTE FUNCTION ppo.guard_field_lineage();
CREATE TABLE ppo.field_entry_attachments (
 workspace_id uuid NOT NULL,appointment_id uuid NOT NULL,entry_id uuid NOT NULL,attachment_id uuid NOT NULL,
 PRIMARY KEY(workspace_id,entry_id,attachment_id),
 FOREIGN KEY(workspace_id,appointment_id,entry_id) REFERENCES ppo.field_entries(workspace_id,appointment_id,id),
 FOREIGN KEY(workspace_id,appointment_id,attachment_id) REFERENCES ppo.field_attachments(workspace_id,appointment_id,id)
);
CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON ppo.field_entry_attachments FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.field_time_ranges (
 workspace_id uuid NOT NULL,actor_id uuid NOT NULL,entry_id uuid NOT NULL,root_id uuid NOT NULL,
 start_at timestamptz NOT NULL,end_at timestamptz NOT NULL,PRIMARY KEY(workspace_id,root_id),
 FOREIGN KEY(workspace_id,entry_id) REFERENCES ppo.field_entries(workspace_id,id),
 CHECK(isfinite(start_at) AND isfinite(end_at) AND end_at>start_at),
 EXCLUDE USING gist(workspace_id WITH =,actor_id WITH =,tstzrange(start_at,end_at,'[)') WITH &&)
);
CREATE TABLE ppo.field_follow_ups (
 workspace_id uuid NOT NULL,appointment_id uuid NOT NULL,entry_id uuid NOT NULL,activity_id uuid NOT NULL,
 PRIMARY KEY(workspace_id,entry_id), FOREIGN KEY(workspace_id,appointment_id,entry_id) REFERENCES ppo.field_entries(workspace_id,appointment_id,id),
 FOREIGN KEY(workspace_id,activity_id) REFERENCES ppo.activities(workspace_id,id)
);
CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON ppo.field_follow_ups FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.completion_drafts (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,company_id uuid NOT NULL,site_id uuid NOT NULL,appointment_id uuid NOT NULL,actor_id uuid NOT NULL,
 version integer NOT NULL CHECK(version>0),updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,appointment_id,actor_id),
 FOREIGN KEY(workspace_id,company_id,site_id,appointment_id) REFERENCES ppo.appointments(workspace_id,company_id,site_id,id), FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.completion_draft_revisions (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,draft_id uuid NOT NULL,version integer NOT NULL,appointment_id uuid NOT NULL,actor_id uuid NOT NULL,attendance_id uuid NOT NULL,
 scope_outcome text NOT NULL CHECK(scope_outcome IN ('Complete','Partial','UnableToProceed')),work_performed text NOT NULL,exclusions text NOT NULL,remaining_work text NOT NULL,
 time_declaration text NOT NULL CHECK(time_declaration IN ('AllRecorded','None','Incomplete')),material_declaration text NOT NULL CHECK(material_declaration IN ('AllRecorded','None','Incomplete')),
 declaration_reason text NOT NULL,task_outcomes jsonb NOT NULL CHECK(jsonb_typeof(task_outcomes)='array'),required_attachments jsonb NOT NULL CHECK(jsonb_typeof(required_attachments)='array'),blockers jsonb NOT NULL,
 follow_up_activity_id uuid,received_at timestamptz NOT NULL DEFAULT clock_timestamp(),operation_id uuid NOT NULL,
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,draft_id,version),
 FOREIGN KEY(workspace_id,draft_id) REFERENCES ppo.completion_drafts(workspace_id,id),
 FOREIGN KEY(workspace_id,appointment_id,actor_id,attendance_id) REFERENCES ppo.field_attendances(workspace_id,appointment_id,actor_id,id),
 FOREIGN KEY(workspace_id,follow_up_activity_id) REFERENCES ppo.activities(workspace_id,id)
);
CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON ppo.completion_draft_revisions FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.completion_entry_refs (
 workspace_id uuid NOT NULL,revision_id uuid NOT NULL,appointment_id uuid NOT NULL,entry_id uuid NOT NULL,entry_version integer NOT NULL,
 PRIMARY KEY(workspace_id,revision_id,entry_id),FOREIGN KEY(workspace_id,revision_id) REFERENCES ppo.completion_draft_revisions(workspace_id,id),
 FOREIGN KEY(workspace_id,appointment_id,entry_id) REFERENCES ppo.field_entries(workspace_id,appointment_id,id)
);
CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON ppo.completion_entry_refs FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TRIGGER register_identity BEFORE INSERT ON ppo.field_entries FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('FieldEntry','');
CREATE TRIGGER register_identity BEFORE INSERT ON ppo.field_attachments FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('Attachment','');
CREATE TRIGGER register_identity BEFORE INSERT ON ppo.completion_drafts FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('CompletionDraft','');
