-- P04 additive typed scope and proposed visits. Applied P01–P03 bytes remain unchanged.
ALTER TABLE ppo.business_identities DROP CONSTRAINT ck_identities_type;
ALTER TABLE ppo.business_identities ADD CONSTRAINT ck_identities_type CHECK(object_type IN ('Ticket','Organisation','Person','Site','Facility','Asset','Relationship','SiteParty','ErpAccountMapping','AssetConfiguration','AssetLocationEvent','HistoryRecord','Activity','WorkOrder','Appointment'));
ALTER TABLE ppo.reference_counters DROP CONSTRAINT reference_counters_record_type_check;
ALTER TABLE ppo.reference_counters ADD CONSTRAINT ck_reference_type CHECK(record_type IN ('ORG','SITE','AST','TKT','WO','APT'));
ALTER TABLE ppo.audit_events DROP CONSTRAINT ck_audit_object_type;
ALTER TABLE ppo.audit_events ADD CONSTRAINT ck_audit_object_type CHECK(object_type IN ('Ticket','Session','Organisation','Person','Site','Facility','Asset','Relationship','SiteParty','ErpAccountMapping','AssetConfiguration','AssetLocationEvent','HistoryRecord','Activity','WorkOrder','Appointment'));
ALTER TABLE ppo.outbox_jobs DROP CONSTRAINT ck_outbox_kind;
ALTER TABLE ppo.outbox_jobs ADD CONSTRAINT ck_outbox_kind CHECK(kind IN ('TicketDraftSaved','SharedRecordCreated','SharedRecordUpdated','SharedHistoryRecorded','TicketCreated','TicketIntakeSaved','TicketInformationRequested','TicketTriaged','ActivityCreated','ActivityUpdated','ActivityStarted','ActivityCompleted','ActivityCancelled','WorkOrderCreated','ScopeDraftSaved','ScopeSuccessorCreated','ScopeAuthorised','ReadinessAssessed','AppointmentProposed'));
ALTER TABLE ppo.permission_grants DROP CONSTRAINT ck_grants_capability;
ALTER TABLE ppo.permission_grants ADD CONSTRAINT ck_grants_capability CHECK(capability IN ('service.ticket.read','service.ticket.edit','shared.read','shared.create','shared.edit','shared.internal.read','shared.finance.read','shared.history.record','activity.read','activity.edit','service.work_order.read','service.work_order.edit','service.scope.authorise','service.readiness.assess'));
ALTER TABLE ppo.tickets ADD CONSTRAINT uq_tickets_full_context UNIQUE(workspace_id,company_id,site_id,id);
ALTER TABLE ppo.asset_configurations ADD CONSTRAINT uq_configuration_asset UNIQUE(workspace_id,asset_id,id);

CREATE TABLE ppo.policy_versions (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES ppo.workspaces(id),
 policy_type text NOT NULL CHECK(policy_type='ServiceReadiness'), key text NOT NULL,
 version integer NOT NULL CHECK(version>0), status text NOT NULL CHECK(status='Published'),
 effective_at timestamptz NOT NULL CHECK(isfinite(effective_at)), definition jsonb NOT NULL CHECK(jsonb_typeof(definition)='object'),
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,policy_type,key,version)
);
CREATE TRIGGER policy_immutable BEFORE UPDATE OR DELETE ON ppo.policy_versions FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.policy_criteria (
 workspace_id uuid NOT NULL, policy_version_id uuid NOT NULL, criterion_code text NOT NULL,
 label text NOT NULL, blocking_stage text NOT NULL CHECK(blocking_stage IN ('Authorisation','Booking','Dispatch','Completion')),
 exception_allowed boolean NOT NULL DEFAULT false, not_applicable_allowed boolean NOT NULL DEFAULT false,
 applicability text NOT NULL CHECK(applicability IN ('Always','Intervention')),
 PRIMARY KEY(workspace_id,policy_version_id,criterion_code),
 FOREIGN KEY(workspace_id,policy_version_id) REFERENCES ppo.policy_versions(workspace_id,id),
 CHECK(NOT exception_allowed OR criterion_code='ToolPreparation'),
 CHECK(NOT not_applicable_allowed OR applicability='Intervention')
);
CREATE TRIGGER policy_criteria_immutable BEFORE UPDATE OR DELETE ON ppo.policy_criteria FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

CREATE TABLE ppo.work_orders (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES ppo.workspaces(id), company_id uuid NOT NULL, site_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version>0), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id), UNIQUE(workspace_id,company_id,site_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id) REFERENCES ppo.sites(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id),
 display_number text NOT NULL, customer_id uuid NOT NULL, service_owner_id uuid NOT NULL,
 status text NOT NULL DEFAULT 'Draft' CHECK(status IN ('Draft','Authorised')),
 authority_mode text NOT NULL DEFAULT 'PlatformSynthetic' CHECK(authority_mode='PlatformSynthetic'),
 scope_revision_id uuid, authorised_scope_revision_id uuid,
 project_reference text, opportunity_reference text,
 FOREIGN KEY(workspace_id,company_id,customer_id) REFERENCES ppo.organisations(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,service_owner_id) REFERENCES ppo.users(workspace_id,id),
 CHECK((status='Authorised')=(authorised_scope_revision_id IS NOT NULL))
);
ALTER TABLE ppo.work_orders ADD CONSTRAINT fk_work_orders_identity FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id);
CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.work_orders FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('WorkOrder','WO');
CREATE TRIGGER no_delete BEFORE DELETE ON ppo.work_orders FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.work_order_tickets (
 workspace_id uuid NOT NULL, company_id uuid NOT NULL, site_id uuid NOT NULL,
 work_order_id uuid NOT NULL, ticket_id uuid NOT NULL, issue_disposition text NOT NULL CHECK(length(btrim(issue_disposition)) BETWEEN 1 AND 2000),
 PRIMARY KEY(workspace_id,work_order_id,ticket_id),
 FOREIGN KEY(workspace_id,company_id,site_id,work_order_id) REFERENCES ppo.work_orders(workspace_id,company_id,site_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id,ticket_id) REFERENCES ppo.tickets(workspace_id,company_id,site_id,id)
);
CREATE TRIGGER ticket_links_immutable BEFORE UPDATE OR DELETE ON ppo.work_order_tickets FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

CREATE TABLE ppo.document_references (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES ppo.workspaces(id), company_id uuid NOT NULL, site_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version>0), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id), UNIQUE(workspace_id,company_id,site_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id) REFERENCES ppo.sites(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id),
 work_order_id uuid NOT NULL, provider text NOT NULL DEFAULT 'Synthetic' CHECK(provider='Synthetic'),
 local_object_key text NOT NULL, version_id text NOT NULL DEFAULT '1', title text NOT NULL CHECK(length(btrim(title)) BETWEEN 1 AND 200),
 media_type text NOT NULL DEFAULT 'text/plain' CHECK(media_type='text/plain'),
 access_class text NOT NULL DEFAULT 'RestrictedService' CHECK(access_class='RestrictedService'),
 owner_id uuid NOT NULL, status text NOT NULL DEFAULT 'Available' CHECK(status='Available'),
 content_text text NOT NULL CHECK(length(btrim(content_text)) BETWEEN 1 AND 10000), content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'),
 source_reference text NOT NULL, source_version text NOT NULL,
 FOREIGN KEY(workspace_id,company_id,site_id,work_order_id) REFERENCES ppo.work_orders(workspace_id,company_id,site_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),
 UNIQUE(workspace_id,work_order_id,id)
);
CREATE TRIGGER no_delete BEFORE DELETE ON ppo.document_references FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TRIGGER document_immutable BEFORE UPDATE ON ppo.document_references FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.coverage_assessments (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES ppo.workspaces(id), company_id uuid NOT NULL, site_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version>0), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id), UNIQUE(workspace_id,company_id,site_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id) REFERENCES ppo.sites(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id),
 work_order_id uuid NOT NULL,
 status text NOT NULL CHECK(status IN ('Unknown','Covered','NotCovered','Disputed','NotApplicable')),
 agreement_reference text, source_version text, effective_from date, effective_to date,
 assessment text NOT NULL CHECK(length(btrim(assessment)) BETWEEN 1 AND 4000), reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 2000),
 charging_route text NOT NULL CHECK(charging_route IN ('FinanceReview','ContractReference')),
 assessed_by uuid NOT NULL, assessed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 FOREIGN KEY(workspace_id,assessed_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id,work_order_id) REFERENCES ppo.work_orders(workspace_id,company_id,site_id,id),
 UNIQUE(workspace_id,work_order_id,id),
 CHECK((effective_from IS NULL OR isfinite(effective_from)) AND (effective_to IS NULL OR (isfinite(effective_to) AND effective_from IS NOT NULL AND effective_to>=effective_from))),
 CHECK(charging_route<>'ContractReference' OR (agreement_reference IS NOT NULL AND source_version IS NOT NULL)),
 CHECK(status NOT IN ('Unknown','Disputed') OR charging_route='FinanceReview')
);
CREATE TRIGGER no_delete BEFORE DELETE ON ppo.coverage_assessments FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TRIGGER coverage_immutable BEFORE UPDATE ON ppo.coverage_assessments FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.scope_revisions (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES ppo.workspaces(id), company_id uuid NOT NULL, site_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version>0), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id), UNIQUE(workspace_id,company_id,site_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id) REFERENCES ppo.sites(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id),
 work_order_id uuid NOT NULL, revision integer NOT NULL CHECK(revision>0), predecessor_id uuid,
 summary text, exclusions text, change_reason text, diagnostic_limit text, pending_account_plan text,
 coverage_assessment_id uuid, authority_evidence_ref uuid, policy_version_id uuid NOT NULL,
 approved_by uuid, approved_at timestamptz, approved_snapshot jsonb, content_hash text,
 UNIQUE(workspace_id,work_order_id,id), UNIQUE(workspace_id,work_order_id,revision),
 FOREIGN KEY(workspace_id,company_id,site_id,work_order_id) REFERENCES ppo.work_orders(workspace_id,company_id,site_id,id),
 FOREIGN KEY(workspace_id,work_order_id,predecessor_id) REFERENCES ppo.scope_revisions(workspace_id,work_order_id,id),
 FOREIGN KEY(workspace_id,work_order_id,coverage_assessment_id) REFERENCES ppo.coverage_assessments(workspace_id,work_order_id,id),
 FOREIGN KEY(workspace_id,work_order_id,authority_evidence_ref) REFERENCES ppo.document_references(workspace_id,work_order_id,id),
 FOREIGN KEY(workspace_id,policy_version_id) REFERENCES ppo.policy_versions(workspace_id,id),
 FOREIGN KEY(workspace_id,approved_by) REFERENCES ppo.users(workspace_id,id),
 CHECK((revision=1 AND predecessor_id IS NULL AND change_reason IS NULL) OR (revision>1 AND predecessor_id IS NOT NULL AND length(btrim(change_reason))>0)),
 CHECK((approved_by IS NULL AND approved_at IS NULL AND approved_snapshot IS NULL AND content_hash IS NULL) OR
 (approved_by IS NOT NULL AND approved_at IS NOT NULL AND isfinite(approved_at) AND approved_snapshot IS NOT NULL AND jsonb_typeof(approved_snapshot)='object' AND content_hash ~ '^[a-f0-9]{64}$' AND summary IS NOT NULL AND exclusions IS NOT NULL AND pending_account_plan IS NOT NULL AND coverage_assessment_id IS NOT NULL AND authority_evidence_ref IS NOT NULL))
);
CREATE TRIGGER no_delete BEFORE DELETE ON ppo.scope_revisions FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
ALTER TABLE ppo.work_orders ADD CONSTRAINT fk_order_current_scope FOREIGN KEY(workspace_id,id,scope_revision_id) REFERENCES ppo.scope_revisions(workspace_id,work_order_id,id) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE ppo.work_orders ADD CONSTRAINT fk_order_approved_scope FOREIGN KEY(workspace_id,id,authorised_scope_revision_id) REFERENCES ppo.scope_revisions(workspace_id,work_order_id,id) DEFERRABLE INITIALLY DEFERRED;
CREATE TABLE ppo.scope_items (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, site_id uuid NOT NULL, scope_revision_id uuid NOT NULL,
 sequence integer NOT NULL CHECK(sequence>0), task_kind text NOT NULL CHECK(task_kind IN ('Inspection','Identification','Intervention')),
 task_description text NOT NULL CHECK(length(btrim(task_description)) BETWEEN 1 AND 4000), expected_outcome text NOT NULL CHECK(length(btrim(expected_outcome)) BETWEEN 1 AND 4000),
 completion_requirements text[] NOT NULL CHECK(cardinality(completion_requirements)>0), required_skill_codes text[] NOT NULL DEFAULT '{}', shutdown_condition text, access_condition text,
 UNIQUE(workspace_id,scope_revision_id,id), UNIQUE(workspace_id,scope_revision_id,sequence), UNIQUE(workspace_id,company_id,site_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id,scope_revision_id) REFERENCES ppo.scope_revisions(workspace_id,company_id,site_id,id)
);
CREATE TABLE ppo.scope_assets (
 workspace_id uuid NOT NULL, company_id uuid NOT NULL, site_id uuid NOT NULL, scope_revision_id uuid NOT NULL, scope_item_id uuid NOT NULL, asset_id uuid NOT NULL, configuration_id uuid,
 PRIMARY KEY(workspace_id,scope_item_id,asset_id),
 FOREIGN KEY(workspace_id,scope_revision_id,scope_item_id) REFERENCES ppo.scope_items(workspace_id,scope_revision_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id,scope_item_id) REFERENCES ppo.scope_items(workspace_id,company_id,site_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id,asset_id) REFERENCES ppo.assets(workspace_id,company_id,site_id,id),
 FOREIGN KEY(workspace_id,asset_id,configuration_id) REFERENCES ppo.asset_configurations(workspace_id,asset_id,id)
);
CREATE TABLE ppo.identification_plans (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, scope_revision_id uuid NOT NULL, scope_item_id uuid NOT NULL, asset_id uuid NOT NULL,
 method text NOT NULL CHECK(length(btrim(method)) BETWEEN 1 AND 4000), limits text NOT NULL CHECK(length(btrim(limits)) BETWEEN 1 AND 4000),
 approved_by uuid, approved_at timestamptz,
 UNIQUE(workspace_id,scope_item_id,asset_id),
 FOREIGN KEY(workspace_id,scope_revision_id,scope_item_id) REFERENCES ppo.scope_items(workspace_id,scope_revision_id,id),
 FOREIGN KEY(workspace_id,scope_item_id,asset_id) REFERENCES ppo.scope_assets(workspace_id,scope_item_id,asset_id),
 FOREIGN KEY(workspace_id,approved_by) REFERENCES ppo.users(workspace_id,id),
 CHECK((approved_by IS NULL)=(approved_at IS NULL))
);

CREATE TABLE ppo.appointments (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES ppo.workspaces(id), company_id uuid NOT NULL, site_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version>0), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id), UNIQUE(workspace_id,company_id,site_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id) REFERENCES ppo.sites(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id),
 display_number text NOT NULL, work_order_id uuid NOT NULL,
 status text NOT NULL DEFAULT 'Proposed' CHECK(status='Proposed'), start_at timestamptz NOT NULL, end_at timestamptz NOT NULL,
 site_timezone text NOT NULL, requested_window_start timestamptz, requested_window_end timestamptz,
 customer_commitment text NOT NULL CHECK(customer_commitment IN ('Unknown','Proposed')),
 preparation_status text NOT NULL CHECK(preparation_status IN ('Unknown','Preparing','Blocked')),
 dispatch_hold boolean NOT NULL DEFAULT true CHECK(dispatch_hold),
 policy_version_id uuid NOT NULL, scope_revision_id uuid NOT NULL, scope_version integer NOT NULL CHECK(scope_version>0),
 FOREIGN KEY(workspace_id,company_id,site_id,work_order_id) REFERENCES ppo.work_orders(workspace_id,company_id,site_id,id),
 FOREIGN KEY(workspace_id,work_order_id,scope_revision_id) REFERENCES ppo.scope_revisions(workspace_id,work_order_id,id),
 FOREIGN KEY(workspace_id,policy_version_id) REFERENCES ppo.policy_versions(workspace_id,id),
 UNIQUE(workspace_id,work_order_id,id), UNIQUE(workspace_id,scope_revision_id,id),
 CHECK(isfinite(start_at) AND isfinite(end_at) AND end_at>start_at),
 CHECK((requested_window_start IS NULL AND requested_window_end IS NULL) OR (requested_window_start IS NOT NULL AND requested_window_end IS NOT NULL AND isfinite(requested_window_start) AND isfinite(requested_window_end) AND requested_window_end>requested_window_start AND start_at>=requested_window_start AND end_at<=requested_window_end))
);
ALTER TABLE ppo.appointments ADD CONSTRAINT fk_appointments_identity FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id);
CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.appointments FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('Appointment','APT');
CREATE TRIGGER no_delete BEFORE DELETE ON ppo.appointments FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TRIGGER proposed_visit_immutable BEFORE UPDATE ON ppo.appointments FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.readiness_assessments (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, scope_revision_id uuid NOT NULL, scope_version integer NOT NULL CHECK(scope_version>0), appointment_id uuid,
 criterion_code text NOT NULL, policy_version_id uuid NOT NULL, assessment_version integer NOT NULL CHECK(assessment_version>0),
 outcome text NOT NULL CHECK(outcome IN ('Unknown','Pass','Blocked','PermittedException','NotApplicable')),
 blocking_stage text NOT NULL CHECK(blocking_stage IN ('Authorisation','Booking','Dispatch','Completion')),
 exception_allowed boolean NOT NULL, evidence_ref uuid, assessed_by uuid NOT NULL, assessed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 2000), source_as_at timestamptz NOT NULL, valid_until timestamptz,
 UNIQUE NULLS NOT DISTINCT(workspace_id,scope_revision_id,appointment_id,criterion_code,assessment_version),
 FOREIGN KEY(workspace_id,scope_revision_id) REFERENCES ppo.scope_revisions(workspace_id,id),
 FOREIGN KEY(workspace_id,scope_revision_id,appointment_id) REFERENCES ppo.appointments(workspace_id,scope_revision_id,id),
 FOREIGN KEY(workspace_id,policy_version_id,criterion_code) REFERENCES ppo.policy_criteria(workspace_id,policy_version_id,criterion_code),
 FOREIGN KEY(workspace_id,evidence_ref) REFERENCES ppo.document_references(workspace_id,id),
 FOREIGN KEY(workspace_id,assessed_by) REFERENCES ppo.users(workspace_id,id),
 CHECK(outcome NOT IN ('Pass','PermittedException','NotApplicable') OR evidence_ref IS NOT NULL),
 CHECK(outcome<>'PermittedException' OR exception_allowed),
 CHECK(isfinite(source_as_at) AND (valid_until IS NULL OR (isfinite(valid_until) AND valid_until>source_as_at)))
);
CREATE TRIGGER readiness_immutable BEFORE UPDATE OR DELETE ON ppo.readiness_assessments FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

CREATE FUNCTION ppo.protect_scope_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE sid uuid; approved boolean;
BEGIN
 IF TG_TABLE_NAME='scope_revisions' THEN
  IF TG_OP='UPDATE' AND (OLD.approved_at IS NOT NULL OR (NEW.id,NEW.workspace_id,NEW.company_id,NEW.site_id,NEW.work_order_id,NEW.revision,NEW.predecessor_id,NEW.change_reason,NEW.created_by,NEW.created_at) IS DISTINCT FROM (OLD.id,OLD.workspace_id,OLD.company_id,OLD.site_id,OLD.work_order_id,OLD.revision,OLD.predecessor_id,OLD.change_reason,OLD.created_by,OLD.created_at)) THEN
   RAISE EXCEPTION 'Approved scope and original lineage are immutable' USING ERRCODE='55000'; END IF;
 ELSE
  IF TG_OP='DELETE' THEN sid:=OLD.scope_revision_id; ELSE sid:=NEW.scope_revision_id; END IF;
  SELECT approved_at IS NOT NULL INTO approved FROM ppo.scope_revisions WHERE id=sid FOR SHARE;
  IF approved THEN
   IF TG_TABLE_NAME='readiness_assessments' THEN
    IF NEW.appointment_id IS NULL THEN RAISE EXCEPTION 'Approved scope evidence is immutable' USING ERRCODE='55000'; END IF;
   ELSE RAISE EXCEPTION 'Approved scope evidence is immutable' USING ERRCODE='55000'; END IF;
  END IF;
  IF TG_OP='UPDATE' AND NEW.scope_revision_id<>OLD.scope_revision_id THEN RAISE EXCEPTION 'Scope attribution is permanent' USING ERRCODE='55000'; END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE TRIGGER scope_immutable BEFORE UPDATE ON ppo.scope_revisions FOR EACH ROW EXECUTE FUNCTION ppo.protect_scope_evidence();

CREATE TRIGGER scope_immutable BEFORE INSERT OR UPDATE OR DELETE ON ppo.scope_items FOR EACH ROW EXECUTE FUNCTION ppo.protect_scope_evidence();
CREATE TRIGGER scope_immutable BEFORE INSERT OR UPDATE OR DELETE ON ppo.scope_assets FOR EACH ROW EXECUTE FUNCTION ppo.protect_scope_evidence();
CREATE TRIGGER scope_immutable BEFORE INSERT OR UPDATE OR DELETE ON ppo.identification_plans FOR EACH ROW EXECUTE FUNCTION ppo.protect_scope_evidence();
CREATE TRIGGER scope_immutable BEFORE INSERT ON ppo.readiness_assessments FOR EACH ROW EXECUTE FUNCTION ppo.protect_scope_evidence();
CREATE FUNCTION ppo.check_work_order() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE w ppo.work_orders; key uuid;
BEGIN
 IF TG_TABLE_NAME='work_orders' THEN key:=NEW.id; ELSE key:=NEW.work_order_id; END IF;
 SELECT * INTO w FROM ppo.work_orders WHERE workspace_id=NEW.workspace_id AND id=key;
 IF NOT EXISTS(SELECT 1 FROM ppo.work_order_tickets WHERE workspace_id=w.workspace_id AND work_order_id=w.id) THEN RAISE EXCEPTION 'Work order requires explicit ticket linkage' USING ERRCODE='23514'; END IF;
 IF w.authorised_scope_revision_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM ppo.scope_revisions WHERE workspace_id=w.workspace_id AND id=w.authorised_scope_revision_id AND approved_at IS NOT NULL) THEN RAISE EXCEPTION 'Authorised pointer requires approved scope' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER order_context AFTER INSERT OR UPDATE ON ppo.work_orders DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_work_order();
CREATE CONSTRAINT TRIGGER order_scope_context AFTER INSERT OR UPDATE ON ppo.scope_revisions DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_work_order();
CREATE FUNCTION ppo.protect_work_order_context() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF (NEW.company_id,NEW.site_id,NEW.customer_id,NEW.authority_mode) IS DISTINCT FROM (OLD.company_id,OLD.site_id,OLD.customer_id,OLD.authority_mode) OR (OLD.status='Authorised' AND NEW.status<>'Authorised') THEN
 RAISE EXCEPTION 'Original work context and authorisation are retained' USING ERRCODE='55000'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER order_context_immutable BEFORE UPDATE ON ppo.work_orders FOR EACH ROW EXECUTE FUNCTION ppo.protect_work_order_context();
CREATE OR REPLACE FUNCTION ppo.identity_has_typed_record() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target text; present boolean;
BEGIN
 target:=CASE NEW.object_type WHEN 'Ticket' THEN 'tickets' WHEN 'Organisation' THEN 'organisations' WHEN 'Person' THEN 'people' WHEN 'Site' THEN 'sites' WHEN 'Facility' THEN 'facilities' WHEN 'Asset' THEN 'assets' WHEN 'Relationship' THEN 'relationships' WHEN 'SiteParty' THEN 'site_parties' WHEN 'ErpAccountMapping' THEN 'erp_account_mappings' WHEN 'AssetConfiguration' THEN 'asset_configurations' WHEN 'AssetLocationEvent' THEN 'asset_location_events' WHEN 'HistoryRecord' THEN 'history_records' WHEN 'Activity' THEN 'activities' WHEN 'WorkOrder' THEN 'work_orders' WHEN 'Appointment' THEN 'appointments' END;
 EXECUTE format('SELECT EXISTS(SELECT 1 FROM ppo.%I WHERE workspace_id=$1 AND id=$2)',target) INTO present USING NEW.workspace_id,NEW.id;
 IF NOT present THEN RAISE EXCEPTION 'Typed identity target is missing' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE INDEX ix_work_orders_scope ON ppo.work_orders(workspace_id,company_id,site_id,status,id);
CREATE INDEX ix_appointments_order ON ppo.appointments(workspace_id,work_order_id,id);
CREATE INDEX ix_readiness_scope ON ppo.readiness_assessments(workspace_id,scope_revision_id,appointment_id,criterion_code,assessment_version DESC);

-- Policy and evidence relationships also hold for direct SQL writes; the application cannot turn
-- an arbitrary boolean into an exception. Append-only assessment versions retain superseded evidence.
CREATE FUNCTION ppo.validate_readiness_policy() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE pc ppo.policy_criteria; sr ppo.scope_revisions; d ppo.document_references; ap ppo.appointments;
BEGIN
 SELECT * INTO sr FROM ppo.scope_revisions WHERE workspace_id=NEW.workspace_id AND id=NEW.scope_revision_id;
 SELECT * INTO pc FROM ppo.policy_criteria WHERE workspace_id=NEW.workspace_id AND policy_version_id=NEW.policy_version_id AND criterion_code=NEW.criterion_code;
 IF sr.policy_version_id IS DISTINCT FROM NEW.policy_version_id OR pc.blocking_stage IS DISTINCT FROM NEW.blocking_stage OR pc.exception_allowed IS DISTINCT FROM NEW.exception_allowed OR
 (NEW.appointment_id IS NULL AND NEW.blocking_stage<>'Authorisation') OR (NEW.appointment_id IS NOT NULL AND NEW.blocking_stage='Authorisation') THEN RAISE EXCEPTION 'Readiness facts must match controlled policy' USING ERRCODE='23514'; END IF;
 IF NEW.evidence_ref IS NOT NULL THEN
  SELECT * INTO d FROM ppo.document_references WHERE workspace_id=NEW.workspace_id AND id=NEW.evidence_ref;
  IF d.work_order_id IS DISTINCT FROM sr.work_order_id THEN RAISE EXCEPTION 'Readiness evidence belongs to another order' USING ERRCODE='23514'; END IF;
 END IF;
 IF NEW.outcome='NotApplicable' AND (NOT pc.not_applicable_allowed OR EXISTS(SELECT 1 FROM ppo.scope_items WHERE workspace_id=NEW.workspace_id AND scope_revision_id=NEW.scope_revision_id AND task_kind='Intervention')) THEN RAISE EXCEPTION 'Applicable mandatory control cannot be waived' USING ERRCODE='23514'; END IF;
 IF NEW.appointment_id IS NOT NULL THEN
  SELECT * INTO ap FROM ppo.appointments WHERE workspace_id=NEW.workspace_id AND id=NEW.appointment_id;
  IF ap.policy_version_id IS DISTINCT FROM NEW.policy_version_id OR ap.scope_version<>NEW.scope_version THEN RAISE EXCEPTION 'Proposal scope/policy evidence changed' USING ERRCODE='23514'; END IF;
 END IF;
 IF NEW.criterion_code IN ('CrewCompetency','DispatchControls') AND NEW.outcome IN ('Pass','PermittedException','NotApplicable') THEN RAISE EXCEPTION 'P04 cannot clear later crew/dispatch controls' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER assessment_policy BEFORE INSERT ON ppo.readiness_assessments FOR EACH ROW EXECUTE FUNCTION ppo.validate_readiness_policy();
