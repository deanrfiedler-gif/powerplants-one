-- P03 additive intake/activity expansion. Applied P01/P02 bytes and receipts are unchanged.
ALTER TABLE ppo.tickets DROP CONSTRAINT tickets_site_identification_needed_check;
ALTER TABLE ppo.tickets ADD COLUMN site_id uuid;
ALTER TABLE ppo.tickets ADD COLUMN requester_id uuid;
ALTER TABLE ppo.tickets ADD COLUMN asset_id uuid;
ALTER TABLE ppo.tickets ADD COLUMN impact text;
ALTER TABLE ppo.tickets ADD COLUMN priority_reason text;
ALTER TABLE ppo.tickets ADD COLUMN next_action text;
ALTER TABLE ppo.tickets ADD COLUMN open_questions text;
ALTER TABLE ppo.tickets ADD COLUMN clarification_outcome text;
ALTER TABLE ppo.tickets ADD COLUMN clarification_activity_id uuid;
ALTER TABLE ppo.tickets ADD COLUMN intake_schema_version integer NOT NULL DEFAULT 1 CHECK(intake_schema_version IN (1,2));
ALTER TABLE ppo.tickets ALTER COLUMN intake_schema_version SET DEFAULT 2;
ALTER TABLE ppo.tickets ADD COLUMN received_time_basis text NOT NULL DEFAULT 'LegacyUnverified' CHECK(received_time_basis IN ('LegacyUnverified','UserReported'));
ALTER TABLE ppo.tickets ALTER COLUMN received_time_basis SET DEFAULT 'UserReported';
ALTER TABLE ppo.tickets ADD CONSTRAINT uq_tickets_company UNIQUE(workspace_id,company_id,id);
ALTER TABLE ppo.tickets ADD CONSTRAINT fk_tickets_site FOREIGN KEY(workspace_id,company_id,site_id) REFERENCES ppo.sites(workspace_id,company_id,id);
ALTER TABLE ppo.tickets ADD CONSTRAINT fk_tickets_requester FOREIGN KEY(workspace_id,company_id,requester_id) REFERENCES ppo.person_company_contexts(workspace_id,company_id,person_id);
ALTER TABLE ppo.tickets ADD CONSTRAINT fk_tickets_asset FOREIGN KEY(workspace_id,company_id,site_id,asset_id) REFERENCES ppo.assets(workspace_id,company_id,site_id,id);
ALTER TABLE ppo.tickets ADD CONSTRAINT ck_tickets_context CHECK((site_id IS NULL)=site_identification_needed AND (asset_id IS NULL OR site_id IS NOT NULL) AND (requester_id IS NOT NULL OR length(btrim(requester_description))>0));
ALTER TABLE ppo.tickets ADD CONSTRAINT ck_tickets_intake CHECK(intake_schema_version=1 OR (length(btrim(symptom)) BETWEEN 1 AND 10000 AND next_action IS NOT NULL AND length(btrim(next_action)) BETWEEN 1 AND 2000 AND isfinite(received_at)));
ALTER TABLE ppo.tickets ALTER COLUMN created_at SET DEFAULT clock_timestamp();
ALTER TABLE ppo.tickets ALTER COLUMN updated_at SET DEFAULT clock_timestamp();

ALTER TABLE ppo.business_identities DROP CONSTRAINT business_identities_object_type_check;
ALTER TABLE ppo.business_identities ADD CONSTRAINT ck_identities_type CHECK(object_type IN ('Ticket','Organisation','Person','Site','Facility','Asset','Relationship','SiteParty','ErpAccountMapping','AssetConfiguration','AssetLocationEvent','HistoryRecord','Activity'));
ALTER TABLE ppo.audit_events DROP CONSTRAINT ck_audit_object_type;
ALTER TABLE ppo.audit_events ADD CONSTRAINT ck_audit_object_type CHECK(object_type IN ('Ticket','Session','Organisation','Person','Site','Facility','Asset','Relationship','SiteParty','ErpAccountMapping','AssetConfiguration','AssetLocationEvent','HistoryRecord','Activity'));
ALTER TABLE ppo.outbox_jobs DROP CONSTRAINT ck_outbox_kind;
ALTER TABLE ppo.outbox_jobs ADD CONSTRAINT ck_outbox_kind CHECK(kind IN ('TicketDraftSaved','SharedRecordCreated','SharedRecordUpdated','SharedHistoryRecorded','TicketCreated','TicketIntakeSaved','TicketInformationRequested','TicketTriaged','ActivityCreated','ActivityUpdated','ActivityStarted','ActivityCompleted','ActivityCancelled'));
ALTER TABLE ppo.permission_grants DROP CONSTRAINT ck_ticket_scope;
ALTER TABLE ppo.permission_grants DROP CONSTRAINT ck_grants_capability;
ALTER TABLE ppo.permission_grants ADD CONSTRAINT ck_grants_capability CHECK(capability IN ('service.ticket.read','service.ticket.edit','shared.read','shared.create','shared.edit','shared.internal.read','shared.finance.read','shared.history.record','activity.read','activity.edit'));

CREATE TABLE ppo.activities (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, site_id uuid,
 version integer NOT NULL DEFAULT 1 CHECK(version>0), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 kind text NOT NULL CHECK(kind IN ('TechnicalFollowUp','CustomerContact','MaterialAction','FinanceQuery','RelationshipReview')),
 owner_id uuid NOT NULL, summary text NOT NULL CHECK(length(btrim(summary)) BETWEEN 1 AND 2000),
 status text NOT NULL DEFAULT 'Open' CHECK(status IN ('Open','InProgress','Completed','Cancelled')),
 due_at timestamptz, due_needed boolean NOT NULL,
 outcome text, cancellation_reason text,
 access_class text NOT NULL CHECK(access_class IN ('Internal','RestrictedService','RestrictedFinance')),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id) REFERENCES ppo.sites(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id),
 CHECK((due_at IS NULL)=due_needed AND (due_at IS NULL OR isfinite(due_at))),
 CHECK((status='Completed' AND outcome IS NOT NULL AND length(btrim(outcome)) BETWEEN 1 AND 10000) OR (status<>'Completed' AND outcome IS NULL)),
 CHECK((status='Cancelled' AND cancellation_reason IS NOT NULL AND length(btrim(cancellation_reason)) BETWEEN 1 AND 2000) OR (status<>'Cancelled' AND cancellation_reason IS NULL)),
 CHECK(kind<>'FinanceQuery' OR access_class='RestrictedFinance')
);
CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.activities FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('Activity','');
CREATE TRIGGER protect_content BEFORE DELETE ON ppo.activities FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.activity_links (
 workspace_id uuid NOT NULL, company_id uuid NOT NULL, activity_id uuid NOT NULL,
 object_type text NOT NULL CHECK(object_type IN ('Organisation','Site','Asset','Ticket')), object_id uuid NOT NULL,
 organisation_id uuid GENERATED ALWAYS AS (CASE WHEN object_type='Organisation' THEN object_id END) STORED,
 site_id uuid GENERATED ALWAYS AS (CASE WHEN object_type='Site' THEN object_id END) STORED,
 asset_id uuid GENERATED ALWAYS AS (CASE WHEN object_type='Asset' THEN object_id END) STORED,
 ticket_id uuid GENERATED ALWAYS AS (CASE WHEN object_type='Ticket' THEN object_id END) STORED,
 PRIMARY KEY(workspace_id,activity_id,object_type,object_id),
 FOREIGN KEY(workspace_id,company_id,activity_id) REFERENCES ppo.activities(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,organisation_id) REFERENCES ppo.organisations(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id) REFERENCES ppo.sites(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,asset_id) REFERENCES ppo.assets(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,ticket_id) REFERENCES ppo.tickets(workspace_id,company_id,id)
);
CREATE TRIGGER links_append_only BEFORE UPDATE OR DELETE ON ppo.activity_links FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
ALTER TABLE ppo.tickets ADD CONSTRAINT fk_tickets_clarification FOREIGN KEY(workspace_id,company_id,clarification_activity_id) REFERENCES ppo.activities(workspace_id,company_id,id);
CREATE FUNCTION ppo.check_activity_links() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE a ppo.activities; key uuid;
BEGIN
 IF TG_TABLE_NAME='activities' THEN key:=NEW.id; ELSE key:=NEW.activity_id; END IF;
 SELECT * INTO a FROM ppo.activities WHERE workspace_id=NEW.workspace_id AND id=key;
 IF NOT EXISTS(SELECT 1 FROM ppo.activity_links WHERE workspace_id=a.workspace_id AND activity_id=a.id) THEN
 RAISE EXCEPTION 'Activity needs a real link' USING ERRCODE='23514'; END IF;
 IF a.site_id IS NOT NULL AND EXISTS(SELECT 1 FROM ppo.activity_links l
 LEFT JOIN ppo.assets e ON e.workspace_id=l.workspace_id AND e.id=l.asset_id
 LEFT JOIN ppo.tickets t ON t.workspace_id=l.workspace_id AND t.id=l.ticket_id
 WHERE l.workspace_id=a.workspace_id AND l.activity_id=a.id AND
 ((l.site_id IS NOT NULL AND l.site_id<>a.site_id) OR (l.asset_id IS NOT NULL AND e.site_id<>a.site_id) OR (l.ticket_id IS NOT NULL AND t.site_id IS DISTINCT FROM a.site_id))) THEN
 RAISE EXCEPTION 'Activity links disagree with site' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER activity_has_links AFTER INSERT OR UPDATE ON ppo.activities DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_activity_links();
CREATE CONSTRAINT TRIGGER link_context AFTER INSERT ON ppo.activity_links DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_activity_links();
CREATE FUNCTION ppo.protect_intake_context() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.company_id<>OLD.company_id THEN RAISE EXCEPTION 'Company context is permanent' USING ERRCODE='55000'; END IF;
 IF TG_TABLE_NAME='activities' THEN
  IF OLD.status IN ('Completed','Cancelled') OR NEW.site_id IS DISTINCT FROM OLD.site_id OR NEW.access_class<>OLD.access_class THEN
   RAISE EXCEPTION 'Closed activity and original access context are retained' USING ERRCODE='55000'; END IF;
 ELSE
  IF NEW.site_id IS DISTINCT FROM OLD.site_id AND EXISTS(SELECT 1 FROM ppo.activity_links l JOIN ppo.activities a ON (a.workspace_id,a.id)=(l.workspace_id,l.activity_id) WHERE l.workspace_id=NEW.workspace_id AND l.ticket_id=NEW.id AND a.site_id IS NOT NULL) THEN
   RAISE EXCEPTION 'Linked follow-up retains original site context' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER preserve_context BEFORE UPDATE ON ppo.activities FOR EACH ROW EXECUTE FUNCTION ppo.protect_intake_context();
CREATE TRIGGER preserve_context BEFORE UPDATE ON ppo.tickets FOR EACH ROW EXECUTE FUNCTION ppo.protect_intake_context();
CREATE INDEX ix_activities_scope_due ON ppo.activities(workspace_id,company_id,site_id,owner_id,status,due_at,id);
CREATE INDEX ix_activity_links_target ON ppo.activity_links(workspace_id,object_type,object_id,activity_id);
CREATE INDEX ix_tickets_scope_status ON ppo.tickets(workspace_id,company_id,site_id,status,id);
CREATE OR REPLACE FUNCTION ppo.identity_has_typed_record() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target text; present boolean;
BEGIN
 target:=CASE NEW.object_type WHEN 'Ticket' THEN 'tickets' WHEN 'Organisation' THEN 'organisations' WHEN 'Person' THEN 'people' WHEN 'Site' THEN 'sites' WHEN 'Facility' THEN 'facilities' WHEN 'Asset' THEN 'assets' WHEN 'Relationship' THEN 'relationships' WHEN 'SiteParty' THEN 'site_parties' WHEN 'ErpAccountMapping' THEN 'erp_account_mappings' WHEN 'AssetConfiguration' THEN 'asset_configurations' WHEN 'AssetLocationEvent' THEN 'asset_location_events' WHEN 'HistoryRecord' THEN 'history_records' WHEN 'Activity' THEN 'activities' END;
 EXECUTE format('SELECT EXISTS(SELECT 1 FROM ppo.%I WHERE workspace_id=$1 AND id=$2)',target) INTO present USING NEW.workspace_id,NEW.id;
 IF NOT present THEN RAISE EXCEPTION 'Typed identity target is missing' USING ERRCODE='23503'; END IF;
 RETURN NULL;
END $$;
