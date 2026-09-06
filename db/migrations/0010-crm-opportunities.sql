-- BP-03 I1, issue #39. Additive; P09 owns 0009. No existing evidence is rewritten.
-- Extend the actual preceding checks instead of replacing a stale P08/P09 union.
DO $$
DECLARE item record; definition text;
BEGIN
 FOR item IN SELECT * FROM (VALUES
  ('business_identities','ck_identities_type','object_type','Opportunity,CrmPipelineDefinition,OpportunityEvent'),
  ('audit_events','ck_audit_object_type','object_type','Opportunity'),
  ('outbox_jobs','ck_outbox_kind','kind','OpportunityCreated,OpportunityQualified,OpportunityActionPlanned'),
  ('permission_grants','ck_grants_capability','capability','crm.opportunity.read,crm.opportunity.create,crm.opportunity.edit'),
  ('reference_counters','ck_reference_type','record_type','OPP'),
  ('activity_links','activity_links_object_type_check','object_type','Opportunity')
 ) AS v(tab,con,col,added) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid=('ppo.'||item.tab)::regclass AND conname=item.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',item.tab,item.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR %I = ANY(%L::text[]))',item.tab,item.con,substring(definition from 8 for length(definition)-8),item.col,string_to_array(item.added,','));
 END LOOP;
 SELECT pg_get_functiondef('ppo.identity_has_typed_record()'::regprocedure) INTO definition;
 IF position('CASE NEW.object_type' in definition)=0 THEN RAISE EXCEPTION 'Inspect changed typed identity dispatch before migration'; END IF;
 EXECUTE replace(definition,'CASE NEW.object_type', 'CASE NEW.object_type WHEN ''Opportunity'' THEN ''opportunities'' WHEN ''CrmPipelineDefinition'' THEN ''crm_pipeline_definitions'' WHEN ''OpportunityEvent'' THEN ''opportunity_events''');
END $$;

CREATE TABLE ppo.crm_pipeline_definitions (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES ppo.workspaces(id),
 version integer NOT NULL DEFAULT 1 CHECK(version=1), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 label text NOT NULL CHECK(label='Fictional sales enquiry — I1'),
 definition_key text NOT NULL CHECK(definition_key='SyntheticEnquiryI1'),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,definition_key),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER register_identity BEFORE INSERT ON ppo.crm_pipeline_definitions FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('CrmPipelineDefinition','');
CREATE TRIGGER definition_immutable BEFORE UPDATE OR DELETE ON ppo.crm_pipeline_definitions FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
-- Closed, typed stage catalogue: no configurable edges/editor in I1.
CREATE TABLE ppo.crm_stage_definitions (
 workspace_id uuid NOT NULL, pipeline_definition_id uuid NOT NULL,
 stage_id text NOT NULL CHECK(stage_id IN ('Enquiry','Qualified')),
 ordinal integer NOT NULL, PRIMARY KEY(workspace_id,pipeline_definition_id,stage_id),
 CHECK((stage_id='Enquiry' AND ordinal=1) OR (stage_id='Qualified' AND ordinal=2)),
 FOREIGN KEY(workspace_id,pipeline_definition_id) REFERENCES ppo.crm_pipeline_definitions(workspace_id,id)
);
CREATE TRIGGER stage_immutable BEFORE UPDATE OR DELETE ON ppo.crm_stage_definitions FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

CREATE TABLE ppo.opportunities (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL,
 display_number text NOT NULL, version integer NOT NULL DEFAULT 1 CHECK(version>0),
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 organisation_id uuid NOT NULL, site_id uuid, primary_person_id uuid,
 site_unknown_reason text, contact_unknown_reason text,
 title text NOT NULL CHECK(length(btrim(title)) BETWEEN 1 AND 200),
 need_summary text NOT NULL CHECK(length(btrim(need_summary)) BETWEEN 1 AND 2000),
 source_channel text NOT NULL CHECK(source_channel IN ('Phone','Email','Meeting','Referral','Other')),
 source_basis text NOT NULL CHECK(length(btrim(source_basis)) BETWEEN 1 AND 1000),
 owner_id uuid NOT NULL, pipeline_definition_id uuid NOT NULL,
 stage_id text NOT NULL DEFAULT 'Enquiry', close_outcome text NOT NULL DEFAULT 'Open' CHECK(close_outcome='Open'),
 stage_entered_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 next_activity_id uuid NOT NULL, qualification_note text, identification_activity_id uuid,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id), UNIQUE(workspace_id,display_number),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,organisation_id) REFERENCES ppo.organisations(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id) REFERENCES ppo.sites(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,primary_person_id) REFERENCES ppo.person_company_contexts(workspace_id,company_id,person_id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,pipeline_definition_id,stage_id) REFERENCES ppo.crm_stage_definitions(workspace_id,pipeline_definition_id,stage_id),
 FOREIGN KEY(workspace_id,company_id,next_activity_id) REFERENCES ppo.activities(workspace_id,company_id,id) DEFERRABLE INITIALLY DEFERRED,
 FOREIGN KEY(workspace_id,company_id,identification_activity_id) REFERENCES ppo.activities(workspace_id,company_id,id),
 CHECK((site_id IS NULL AND site_unknown_reason IS NOT NULL AND length(btrim(site_unknown_reason)) BETWEEN 1 AND 1000) OR (site_id IS NOT NULL AND site_unknown_reason IS NULL)),
 CHECK((primary_person_id IS NULL AND contact_unknown_reason IS NOT NULL AND length(btrim(contact_unknown_reason)) BETWEEN 1 AND 1000) OR (primary_person_id IS NOT NULL AND contact_unknown_reason IS NULL)),
 CHECK((stage_id='Enquiry' AND qualification_note IS NULL AND identification_activity_id IS NULL) OR
 (stage_id='Qualified' AND qualification_note IS NOT NULL AND length(btrim(qualification_note)) BETWEEN 1 AND 2000 AND (primary_person_id IS NOT NULL OR identification_activity_id IS NOT NULL))),
 CHECK(isfinite(created_at) AND isfinite(updated_at) AND isfinite(stage_entered_at))
);
CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.opportunities FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('Opportunity','OPP');
CREATE TRIGGER opportunity_retained BEFORE DELETE ON ppo.opportunities FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
ALTER TABLE ppo.activity_links ADD COLUMN opportunity_id uuid GENERATED ALWAYS AS (CASE WHEN object_type='Opportunity' THEN object_id END) STORED;
ALTER TABLE ppo.activity_links ADD CONSTRAINT fk_activity_links_opportunity FOREIGN KEY(workspace_id,company_id,opportunity_id) REFERENCES ppo.opportunities(workspace_id,company_id,id);

CREATE TABLE ppo.opportunity_events (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, opportunity_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version=1), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 operation_id uuid NOT NULL, opportunity_version integer NOT NULL CHECK(opportunity_version>0),
 event_type text NOT NULL CHECK(event_type IN ('OpportunityCreated','OpportunityQualified','OpportunityActionPlanned')),
 pipeline_definition_id uuid NOT NULL, from_stage text, to_stage text NOT NULL,
 next_activity_id uuid NOT NULL, identification_activity_id uuid,
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),
 need_summary text NOT NULL CHECK(length(btrim(need_summary)) BETWEEN 1 AND 2000), qualification_note text,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,opportunity_id,opportunity_version), UNIQUE(workspace_id,created_by,operation_id),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,opportunity_id) REFERENCES ppo.opportunities(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,pipeline_definition_id,to_stage) REFERENCES ppo.crm_stage_definitions(workspace_id,pipeline_definition_id,stage_id),
 FOREIGN KEY(workspace_id,pipeline_definition_id,from_stage) REFERENCES ppo.crm_stage_definitions(workspace_id,pipeline_definition_id,stage_id),
 FOREIGN KEY(workspace_id,company_id,next_activity_id) REFERENCES ppo.activities(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,identification_activity_id) REFERENCES ppo.activities(workspace_id,company_id,id),
 CHECK((event_type='OpportunityCreated' AND opportunity_version=1 AND from_stage IS NULL AND to_stage='Enquiry') OR
 (event_type='OpportunityQualified' AND from_stage='Enquiry' AND to_stage='Qualified' AND qualification_note IS NOT NULL) OR
 (event_type='OpportunityActionPlanned' AND from_stage=to_stage AND opportunity_version>1))
);
CREATE TRIGGER register_identity BEFORE INSERT ON ppo.opportunity_events FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('OpportunityEvent','');
CREATE TRIGGER event_immutable BEFORE UPDATE OR DELETE ON ppo.opportunity_events FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

CREATE FUNCTION ppo.protect_opportunity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 IF TG_OP='INSERT' THEN
  IF NEW.stage_id<>'Enquiry' OR NEW.version<>1 THEN RAISE EXCEPTION 'Create only at Enquiry version one' USING ERRCODE='23514'; END IF;
 ELSE
  IF (NEW.company_id,NEW.organisation_id,NEW.site_id,NEW.primary_person_id,NEW.site_unknown_reason,NEW.contact_unknown_reason,NEW.owner_id,NEW.pipeline_definition_id,NEW.title,NEW.source_channel,NEW.source_basis) IS DISTINCT FROM
     (OLD.company_id,OLD.organisation_id,OLD.site_id,OLD.primary_person_id,OLD.site_unknown_reason,OLD.contact_unknown_reason,OLD.owner_id,OLD.pipeline_definition_id,OLD.title,OLD.source_channel,OLD.source_basis) OR NEW.version<>OLD.version+1 THEN
   RAISE EXCEPTION 'Original opportunity context and version are protected' USING ERRCODE='55000'; END IF;
  IF NEW.stage_id<>OLD.stage_id THEN
   IF OLD.stage_id<>'Enquiry' OR NEW.stage_id<>'Qualified' THEN RAISE EXCEPTION 'Unsupported opportunity progression' USING ERRCODE='23514'; END IF;
  ELSIF (NEW.stage_entered_at,NEW.need_summary,NEW.qualification_note,NEW.identification_activity_id) IS DISTINCT FROM (OLD.stage_entered_at,OLD.need_summary,OLD.qualification_note,OLD.identification_activity_id) THEN
   RAISE EXCEPTION 'Only qualification changes qualification facts' USING ERRCODE='55000'; END IF;
 END IF;
 IF TG_OP='INSERT' OR NEW.stage_id IS DISTINCT FROM OLD.stage_id THEN
  IF NOT EXISTS(SELECT 1 FROM ppo.users WHERE workspace_id=NEW.workspace_id AND id=NEW.owner_id AND active) THEN RAISE EXCEPTION 'Owner must be active' USING ERRCODE='23514'; END IF;
  IF NEW.site_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM ppo.site_parties WHERE workspace_id=NEW.workspace_id AND company_id=NEW.company_id AND site_id=NEW.site_id AND organisation_id=NEW.organisation_id AND valid_from<=CURRENT_DATE AND (valid_to IS NULL OR valid_to>CURRENT_DATE)) THEN RAISE EXCEPTION 'Site has no current organisation relationship' USING ERRCODE='23514'; END IF;
  IF NEW.primary_person_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM ppo.relationships WHERE workspace_id=NEW.workspace_id AND company_id=NEW.company_id AND organisation_id=NEW.organisation_id AND person_id=NEW.primary_person_id AND valid_from<=CURRENT_DATE AND (valid_to IS NULL OR valid_to>CURRENT_DATE)) THEN RAISE EXCEPTION 'Contact affiliation required' USING ERRCODE='23514'; END IF;
  IF NEW.stage_id='Qualified' AND NEW.primary_person_id IS NULL AND NOT EXISTS(SELECT 1 FROM ppo.activities a JOIN ppo.activity_links l ON (l.workspace_id,l.activity_id)=(a.workspace_id,a.id) WHERE a.workspace_id=NEW.workspace_id AND a.id=NEW.identification_activity_id AND a.owner_id=NEW.owner_id AND a.status IN ('Open','InProgress') AND a.kind IN ('CustomerContact','RelationshipReview') AND l.opportunity_id=NEW.id) THEN RAISE EXCEPTION 'Owned active contact identification action required' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER opportunity_guards BEFORE INSERT OR UPDATE ON ppo.opportunities FOR EACH ROW EXECUTE FUNCTION ppo.protect_opportunity();

CREATE FUNCTION ppo.check_opportunity_graph() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE o ppo.opportunities; aid uuid;
BEGIN
 IF TG_TABLE_NAME='opportunities' THEN
  SELECT * INTO o FROM ppo.opportunities WHERE workspace_id=NEW.workspace_id AND id=NEW.id;
  IF NOT EXISTS(SELECT 1 FROM ppo.activities a JOIN ppo.activity_links l ON (l.workspace_id,l.activity_id)=(a.workspace_id,a.id) WHERE a.workspace_id=o.workspace_id AND a.id=o.next_activity_id AND l.opportunity_id=o.id) THEN RAISE EXCEPTION 'Designated action must link opportunity' USING ERRCODE='23514'; END IF;
  IF (TG_OP='INSERT' OR NEW.next_activity_id IS DISTINCT FROM OLD.next_activity_id) AND NOT EXISTS(SELECT 1 FROM ppo.activities a WHERE a.workspace_id=o.workspace_id AND a.id=o.next_activity_id AND a.status IN ('Open','InProgress')) THEN RAISE EXCEPTION 'A new designation must be active' USING ERRCODE='23514'; END IF;
  IF NOT EXISTS(SELECT 1 FROM ppo.opportunity_events e WHERE e.workspace_id=o.workspace_id AND e.opportunity_id=o.id AND e.opportunity_version=o.version AND e.to_stage=o.stage_id AND e.pipeline_definition_id=o.pipeline_definition_id AND e.next_activity_id=o.next_activity_id AND e.need_summary=o.need_summary AND e.qualification_note IS NOT DISTINCT FROM o.qualification_note AND e.identification_activity_id IS NOT DISTINCT FROM o.identification_activity_id) THEN RAISE EXCEPTION 'Exact opportunity event required' USING ERRCODE='23514'; END IF;
 ELSE
  IF TG_TABLE_NAME='activities' THEN aid:=NEW.id; ELSE aid:=NEW.activity_id; END IF;
  IF EXISTS(SELECT 1 FROM ppo.activity_links l JOIN ppo.activities a ON (a.workspace_id,a.id)=(l.workspace_id,l.activity_id) JOIN ppo.opportunities x ON (x.workspace_id,x.id)=(l.workspace_id,l.opportunity_id) WHERE l.workspace_id=NEW.workspace_id AND l.activity_id=aid AND (a.site_id IS DISTINCT FROM x.site_id OR a.access_class<>'Internal' OR a.company_id<>x.company_id)) THEN RAISE EXCEPTION 'Opportunity action retains exact company/site/Internal context' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER opportunity_graph AFTER INSERT OR UPDATE ON ppo.opportunities DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_opportunity_graph();
CREATE CONSTRAINT TRIGGER crm_activity_context AFTER INSERT OR UPDATE ON ppo.activities DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_opportunity_graph();
CREATE CONSTRAINT TRIGGER crm_link_context AFTER INSERT ON ppo.activity_links DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_opportunity_graph();
CREATE INDEX ix_opportunities_scope_stage ON ppo.opportunities(workspace_id,company_id,site_id,owner_id,stage_id,id);
CREATE INDEX ix_opportunity_events_history ON ppo.opportunity_events(workspace_id,opportunity_id,opportunity_version);
