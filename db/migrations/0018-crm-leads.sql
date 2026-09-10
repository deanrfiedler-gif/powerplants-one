-- Manual synthetic Leads. 0015/0017 belong to open email/CRM integration work.
-- Extend current unions without rewriting accepted migrations.
DO $$ DECLARE item record; definition text; BEGIN
 FOR item IN SELECT * FROM (VALUES
 ('business_identities','ck_identities_type','object_type','Lead,LeadEvent,LeadConversion'),
 ('audit_events','ck_audit_object_type','object_type','Lead'),
 ('outbox_jobs','ck_outbox_kind','kind','LeadCreated,LeadChanged,LeadActionPlanned,LeadConverted'),
 ('permission_grants','ck_grants_capability','capability','crm.lead.read,crm.lead.create,crm.lead.edit,crm.lead.convert'),
 ('reference_counters','ck_reference_type','record_type','LEAD'),
 ('activity_links','activity_links_object_type_check','object_type','Lead')
 ) AS v(tab,con,col,added) LOOP
 SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid=('ppo.'||item.tab)::regclass AND conname=item.con;
 EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',item.tab,item.con);
 EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR %I = ANY(%L::text[]))',item.tab,item.con,substring(definition from 8 for length(definition)-8),item.col,string_to_array(item.added,','));
 END LOOP;
 SELECT pg_get_functiondef('ppo.identity_has_typed_record()'::regprocedure) INTO definition;
 IF position('CASE NEW.object_type' in definition)=0 THEN RAISE EXCEPTION 'Inspect typed identity dispatch'; END IF;
 EXECUTE replace(definition,'CASE NEW.object_type','CASE NEW.object_type WHEN ''Lead'' THEN ''lead_candidates'' WHEN ''LeadEvent'' THEN ''lead_events'' WHEN ''LeadConversion'' THEN ''lead_conversions''');
END $$;
CREATE TABLE ppo.lead_candidates (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL,
 display_number text NOT NULL, version integer NOT NULL DEFAULT 1 CHECK(version>0),
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 owner_id uuid NOT NULL, organisation_id uuid, site_id uuid, primary_person_id uuid,
 title text NOT NULL CHECK(length(btrim(title)) BETWEEN 1 AND 200),
 need_summary text CHECK(length(btrim(need_summary)) BETWEEN 1 AND 2000),
 organisation_text text CHECK(length(btrim(organisation_text)) BETWEEN 1 AND 200),
 contact_text text CHECK(length(btrim(contact_text)) BETWEEN 1 AND 200),
 source_channel text NOT NULL CHECK(source_channel IN ('Phone','Email','Meeting','Referral','Other')),
 source_basis text NOT NULL CHECK(length(btrim(source_basis)) BETWEEN 1 AND 1000),
 status text NOT NULL DEFAULT 'New' CHECK(status IN ('New','Contacting','Nurturing','Disqualified','Converted')),
 is_archived boolean NOT NULL DEFAULT false, next_activity_id uuid,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id), UNIQUE(workspace_id,display_number),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,organisation_id) REFERENCES ppo.organisations(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id) REFERENCES ppo.sites(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,primary_person_id) REFERENCES ppo.person_company_contexts(workspace_id,company_id,person_id),
 FOREIGN KEY(workspace_id,company_id,next_activity_id) REFERENCES ppo.activities(workspace_id,company_id,id) DEFERRABLE INITIALLY DEFERRED,
 CHECK(organisation_id IS NOT NULL OR (site_id IS NULL AND primary_person_id IS NULL)),
 CHECK(status<>'Converted' OR NOT is_archived), CHECK(isfinite(created_at) AND isfinite(updated_at))
);
CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.lead_candidates FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('Lead','LEAD');
CREATE TRIGGER lead_retained BEFORE DELETE ON ppo.lead_candidates FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.lead_events (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, lead_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version=1), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 operation_id uuid NOT NULL, lead_version integer NOT NULL CHECK(lead_version>0),
 event_type text NOT NULL CHECK(event_type IN ('CreateLead','UpdateLead','RecordLeadNote','ArchiveLead','UnarchiveLead','DisqualifyLead','ReopenLead','PlanLeadAction','ConvertLeadToOpportunity')),
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),
 note text CHECK(length(btrim(note)) BETWEEN 1 AND 10000), snapshot jsonb NOT NULL,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,lead_id,lead_version), UNIQUE(workspace_id,created_by,operation_id),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,lead_id) REFERENCES ppo.lead_candidates(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id),
 CHECK((event_type='RecordLeadNote')=(note IS NOT NULL))
);
CREATE TRIGGER register_identity BEFORE INSERT ON ppo.lead_events FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('LeadEvent','');
CREATE TRIGGER lead_event_retained BEFORE UPDATE OR DELETE ON ppo.lead_events FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.lead_conversions (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, lead_id uuid NOT NULL, opportunity_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version=1), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 operation_id uuid NOT NULL, source_version integer NOT NULL CHECK(source_version>0),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,lead_id), UNIQUE(workspace_id,opportunity_id), UNIQUE(workspace_id,created_by,operation_id),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,lead_id) REFERENCES ppo.lead_candidates(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,opportunity_id) REFERENCES ppo.opportunities(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER register_identity BEFORE INSERT ON ppo.lead_conversions FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('LeadConversion','');
CREATE TRIGGER lead_conversion_retained BEFORE UPDATE OR DELETE ON ppo.lead_conversions FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
ALTER TABLE ppo.activity_links ADD COLUMN lead_id uuid GENERATED ALWAYS AS (CASE WHEN object_type='Lead' THEN object_id END) STORED;
ALTER TABLE ppo.activity_links ADD CONSTRAINT fk_activity_links_lead FOREIGN KEY(workspace_id,company_id,lead_id) REFERENCES ppo.lead_candidates(workspace_id,company_id,id);
CREATE FUNCTION ppo.protect_lead() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 IF TG_OP='INSERT' THEN
 IF NEW.version<>1 OR NEW.status<>'New' OR NEW.is_archived OR NEW.next_activity_id IS NOT NULL THEN RAISE EXCEPTION 'Create an active New lead at version one' USING ERRCODE='23514'; END IF;
 ELSE
 IF OLD.status='Converted' OR NEW.version<>OLD.version+1 OR
 (NEW.workspace_id,NEW.company_id,NEW.owner_id,NEW.organisation_id,NEW.site_id,NEW.primary_person_id,NEW.created_at,NEW.created_by) IS DISTINCT FROM
 (OLD.workspace_id,OLD.company_id,OLD.owner_id,OLD.organisation_id,OLD.site_id,OLD.primary_person_id,OLD.created_at,OLD.created_by) THEN RAISE EXCEPTION 'Lead source, owner and accepted versions are retained' USING ERRCODE='55000'; END IF;
 IF NEW.status='Converted' AND (OLD.is_archived OR OLD.status='Disqualified') THEN RAISE EXCEPTION 'Only active leads convert' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER lead_guard BEFORE INSERT OR UPDATE ON ppo.lead_candidates FOR EACH ROW EXECUTE FUNCTION ppo.protect_lead();
CREATE FUNCTION ppo.check_lead_graph() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE l ppo.lead_candidates; aid uuid; BEGIN
 IF TG_TABLE_NAME='lead_candidates' THEN
 SELECT * INTO STRICT l FROM ppo.lead_candidates WHERE workspace_id=NEW.workspace_id AND id=NEW.id;
 IF NOT EXISTS(SELECT 1 FROM ppo.lead_events e WHERE e.workspace_id=NEW.workspace_id AND e.lead_id=NEW.id AND e.lead_version=NEW.version AND e.created_by=NEW.updated_by AND e.snapshot=to_jsonb(NEW)) THEN RAISE EXCEPTION 'Exact lead event required for every version' USING ERRCODE='23514'; END IF;
 IF (l.status='Converted') IS DISTINCT FROM EXISTS(SELECT 1 FROM ppo.lead_conversions x WHERE x.workspace_id=l.workspace_id AND x.lead_id=l.id) THEN RAISE EXCEPTION 'Conversion and retained lead must agree' USING ERRCODE='23514'; END IF;
 IF NEW.next_activity_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM ppo.activity_links a WHERE a.workspace_id=NEW.workspace_id AND a.activity_id=NEW.next_activity_id AND a.lead_id=NEW.id) THEN RAISE EXCEPTION 'Next action must link the lead' USING ERRCODE='23514'; END IF;
 IF NEW.next_activity_id IS NOT NULL AND (TG_OP='INSERT' OR NEW.next_activity_id IS DISTINCT FROM OLD.next_activity_id) AND NOT EXISTS(SELECT 1 FROM ppo.activities a WHERE a.workspace_id=NEW.workspace_id AND a.id=NEW.next_activity_id AND a.status IN ('Open','InProgress')) THEN RAISE EXCEPTION 'Choose an active next action' USING ERRCODE='23514'; END IF;
 ELSE
 IF TG_TABLE_NAME='activities' THEN aid:=NEW.id; ELSE aid:=NEW.activity_id; END IF;
 IF EXISTS(SELECT 1 FROM ppo.activity_links x JOIN ppo.activities a ON (a.workspace_id,a.id)=(x.workspace_id,x.activity_id) JOIN ppo.lead_candidates t ON (t.workspace_id,t.id)=(x.workspace_id,x.lead_id) WHERE x.workspace_id=NEW.workspace_id AND x.activity_id=aid AND (a.company_id<>t.company_id OR a.site_id IS DISTINCT FROM t.site_id OR a.access_class<>'Internal')) THEN RAISE EXCEPTION 'Lead activity requires exact company/site/Internal context' USING ERRCODE='23514'; END IF;
 END IF; RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER lead_graph AFTER INSERT OR UPDATE ON ppo.lead_candidates DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_lead_graph();
CREATE CONSTRAINT TRIGGER lead_activity_context AFTER INSERT OR UPDATE ON ppo.activities DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_lead_graph();
CREATE CONSTRAINT TRIGGER lead_link_context AFTER INSERT ON ppo.activity_links DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_lead_graph();
-- One conversion operation contains the original creation and qualification facts.
-- Reuse across events is permitted ONLY for this exact atomic pair and retained conversion.
DO $$ DECLARE con text; BEGIN
 SELECT conname INTO STRICT con FROM pg_constraint WHERE conrelid='ppo.opportunity_events'::regclass AND contype='u' AND pg_get_constraintdef(oid)='UNIQUE (workspace_id, created_by, operation_id)';
 EXECUTE format('ALTER TABLE ppo.opportunity_events DROP CONSTRAINT %I',con);
END $$;
ALTER TABLE ppo.opportunity_events ADD CONSTRAINT opportunity_operation_version UNIQUE(workspace_id,created_by,operation_id,opportunity_version);
CREATE FUNCTION ppo.check_conversion_operation() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE x ppo.lead_conversions; BEGIN
 IF TG_TABLE_NAME='lead_conversions' THEN x:=NEW;
 ELSE
 IF (SELECT count(*) FROM ppo.opportunity_events e WHERE e.workspace_id=NEW.workspace_id AND e.created_by=NEW.created_by AND e.operation_id=NEW.operation_id)<2 THEN RETURN NULL; END IF;
 SELECT * INTO x FROM ppo.lead_conversions WHERE workspace_id=NEW.workspace_id AND created_by=NEW.created_by AND operation_id=NEW.operation_id;
 END IF;
 IF x.id IS NULL OR NOT EXISTS(SELECT 1 FROM ppo.lead_candidates l JOIN ppo.opportunities o ON o.workspace_id=l.workspace_id AND o.id=x.opportunity_id WHERE l.workspace_id=x.workspace_id AND l.id=x.lead_id AND l.status='Converted' AND l.version=x.source_version+1 AND o.owner_id=l.owner_id AND o.company_id=l.company_id AND o.stage_id='Qualified' AND o.version=2) THEN RAISE EXCEPTION 'An atomic conversion must retain source, owner and Qualified deal' USING ERRCODE='23514'; END IF;
 IF (SELECT count(*) FROM ppo.opportunity_events e WHERE e.workspace_id=x.workspace_id AND e.created_by=x.created_by AND e.operation_id=x.operation_id)<>2 OR
 (SELECT count(*) FROM ppo.opportunity_events e WHERE e.workspace_id=x.workspace_id AND e.opportunity_id=x.opportunity_id AND e.created_by=x.created_by AND e.operation_id=x.operation_id AND ((e.opportunity_version=1 AND e.event_type='OpportunityCreated') OR (e.opportunity_version=2 AND e.event_type='OpportunityQualified')))<>2 THEN RAISE EXCEPTION 'Conversion requires exact creation and qualification facts' USING ERRCODE='23514'; END IF;
 IF NOT EXISTS(SELECT 1 FROM ppo.lead_events e WHERE e.workspace_id=x.workspace_id AND e.lead_id=x.lead_id AND e.lead_version=x.source_version+1 AND e.event_type='ConvertLeadToOpportunity' AND e.created_by=x.created_by AND e.operation_id=x.operation_id) THEN RAISE EXCEPTION 'Conversion requires its exact source event' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER conversion_graph AFTER INSERT ON ppo.lead_conversions DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_conversion_operation();
CREATE CONSTRAINT TRIGGER conversion_operation AFTER INSERT ON ppo.opportunity_events DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_conversion_operation();
CREATE INDEX ix_lead_inbox ON ppo.lead_candidates(workspace_id,company_id,status,is_archived,owner_id,id);
