-- Approved desktop r11/mobile r07 implementation. Existing stages, ownership,
-- organisation/site context, issued records and original migration bytes remain.
ALTER TABLE ppo.opportunities
 ADD COLUMN value_amount numeric(11,2) CHECK(value_amount>=0 AND value_amount<>'NaN'::numeric),
 ADD COLUMN expected_close_date date CHECK(expected_close_date IS NULL OR isfinite(expected_close_date)),
 ADD COLUMN scope_details jsonb NOT NULL DEFAULT '{}' CHECK(jsonb_typeof(scope_details)='object');
ALTER TABLE ppo.opportunity_events ADD COLUMN record_snapshot jsonb CHECK(record_snapshot IS NULL OR jsonb_typeof(record_snapshot)='object');
DO $$
DECLARE definition text; item record;
BEGIN
 FOR item IN SELECT * FROM (VALUES
  ('outbox_jobs','ck_outbox_kind','kind'),
  ('opportunity_events','opportunity_events_event_type_check','event_type')
 ) AS v(tab,con,col) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid=('ppo.'||item.tab)::regclass AND conname=item.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',item.tab,item.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR %I = ANY(%L::text[]))',item.tab,item.con,substring(definition from 8 for length(definition)-8),item.col,ARRAY['OpportunityInformationEdited','OpportunityScopeEdited','OpportunityStageChanged']);
 END LOOP;
 -- Extend only the original event-shape constraint, identified by its expression.
 SELECT conname,pg_get_constraintdef(oid) AS definition INTO STRICT item FROM pg_constraint
 WHERE conrelid='ppo.opportunity_events'::regclass AND contype='c' AND pg_get_constraintdef(oid) LIKE '%OpportunityCreated%' AND pg_get_constraintdef(oid) LIKE '%opportunity_version%';
 EXECUTE format('ALTER TABLE ppo.opportunity_events DROP CONSTRAINT %I',item.conname);
 EXECUTE format('ALTER TABLE ppo.opportunity_events ADD CONSTRAINT %I CHECK ((%s) OR (event_type IN (''OpportunityInformationEdited'',''OpportunityScopeEdited'') AND from_stage=to_stage AND opportunity_version>1 AND record_snapshot IS NOT NULL) OR (event_type=''OpportunityStageChanged'' AND from_stage<>to_stage AND opportunity_version>1 AND record_snapshot IS NOT NULL))',item.conname,substring(item.definition from 8 for length(item.definition)-8));
END $$;

CREATE FUNCTION ppo.crm_record_snapshot(o ppo.opportunities) RETURNS jsonb LANGUAGE sql IMMUTABLE AS $$
 SELECT jsonb_build_object('title',o.title,'primary_person_id',o.primary_person_id,'contact_unknown_reason',o.contact_unknown_reason,'value_amount',o.value_amount::text,'expected_close_date',o.expected_close_date::text,'scope_details',o.scope_details)
$$;

CREATE FUNCTION ppo.check_crm_refinement_event() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE e ppo.opportunity_events;
BEGIN
 SELECT * INTO e FROM ppo.opportunity_events WHERE workspace_id=NEW.workspace_id AND opportunity_id=NEW.id AND opportunity_version=NEW.version;
 IF e.event_type IN ('OpportunityInformationEdited','OpportunityScopeEdited','OpportunityStageChanged') THEN
  IF e.record_snapshot IS DISTINCT FROM ppo.crm_record_snapshot(NEW) OR NEW.next_activity_id IS DISTINCT FROM OLD.next_activity_id THEN RAISE EXCEPTION 'Refinement edits retain next activity and exact snapshot' USING ERRCODE='23514'; END IF;
  IF e.event_type='OpportunityStageChanged' AND NEW.need_summary IS DISTINCT FROM OLD.need_summary THEN RAISE EXCEPTION 'Stage changes retain requirements' USING ERRCODE='23514'; END IF;
 END IF;
 IF (NEW.title,NEW.primary_person_id,NEW.contact_unknown_reason,NEW.value_amount,NEW.expected_close_date) IS DISTINCT FROM (OLD.title,OLD.primary_person_id,OLD.contact_unknown_reason,OLD.value_amount,OLD.expected_close_date) THEN
  IF e.event_type IS DISTINCT FROM 'OpportunityInformationEdited' OR e.record_snapshot IS DISTINCT FROM ppo.crm_record_snapshot(NEW) THEN RAISE EXCEPTION 'Exact information edit event required' USING ERRCODE='23514'; END IF;
 END IF;
 IF NEW.scope_details IS DISTINCT FROM OLD.scope_details OR (NEW.need_summary IS DISTINCT FROM OLD.need_summary AND NEW.stage_id=OLD.stage_id) THEN
  IF e.event_type IS DISTINCT FROM 'OpportunityScopeEdited' OR e.record_snapshot IS DISTINCT FROM ppo.crm_record_snapshot(NEW) THEN RAISE EXCEPTION 'Exact scope edit event required' USING ERRCODE='23514'; END IF;
 END IF;
 IF NEW.stage_id<>OLD.stage_id AND e.event_type IS DISTINCT FROM 'OpportunityQualified' THEN
  IF e.event_type IS DISTINCT FROM 'OpportunityStageChanged' OR e.record_snapshot IS DISTINCT FROM ppo.crm_record_snapshot(NEW) THEN RAISE EXCEPTION 'Exact stage change event required' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER crm_refinement_event AFTER UPDATE ON ppo.opportunities DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_crm_refinement_event();

CREATE OR REPLACE FUNCTION ppo.protect_opportunity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 IF TG_OP='INSERT' THEN
  IF NEW.stage_id<>'Enquiry' OR NEW.version<>1 THEN RAISE EXCEPTION 'Create only at Enquiry version one' USING ERRCODE='23514'; END IF;
 ELSE
  IF (NEW.company_id,NEW.organisation_id,NEW.site_id,NEW.site_unknown_reason,NEW.owner_id,NEW.pipeline_definition_id,NEW.source_channel,NEW.source_basis) IS DISTINCT FROM
     (OLD.company_id,OLD.organisation_id,OLD.site_id,OLD.site_unknown_reason,OLD.owner_id,OLD.pipeline_definition_id,OLD.source_channel,OLD.source_basis) OR NEW.version<>OLD.version+1 THEN
   RAISE EXCEPTION 'Original opportunity context and version are protected' USING ERRCODE='55000'; END IF;
  IF NEW.stage_id<>OLD.stage_id THEN
   IF NOT ((OLD.stage_id='Enquiry' AND NEW.stage_id='Qualified') OR (OLD.stage_id='Qualified' AND NEW.stage_id='Enquiry')) THEN RAISE EXCEPTION 'Unsupported opportunity progression' USING ERRCODE='23514'; END IF;
  ELSIF (NEW.stage_entered_at,NEW.qualification_note,NEW.identification_activity_id) IS DISTINCT FROM (OLD.stage_entered_at,OLD.qualification_note,OLD.identification_activity_id) THEN
   RAISE EXCEPTION 'Only qualification changes qualification facts' USING ERRCODE='55000'; END IF;
 END IF;
 IF TG_OP='INSERT' OR NEW.stage_id IS DISTINCT FROM OLD.stage_id OR NEW.primary_person_id IS DISTINCT FROM OLD.primary_person_id THEN
  IF NOT EXISTS(SELECT 1 FROM ppo.users WHERE workspace_id=NEW.workspace_id AND id=NEW.owner_id AND active) THEN RAISE EXCEPTION 'Owner must be active' USING ERRCODE='23514'; END IF;
  IF NEW.site_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM ppo.site_parties WHERE workspace_id=NEW.workspace_id AND company_id=NEW.company_id AND site_id=NEW.site_id AND organisation_id=NEW.organisation_id AND valid_from<=CURRENT_DATE AND (valid_to IS NULL OR valid_to>CURRENT_DATE)) THEN RAISE EXCEPTION 'Site has no current organisation relationship' USING ERRCODE='23514'; END IF;
  IF NEW.primary_person_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM ppo.relationships WHERE workspace_id=NEW.workspace_id AND company_id=NEW.company_id AND organisation_id=NEW.organisation_id AND person_id=NEW.primary_person_id AND valid_from<=CURRENT_DATE AND (valid_to IS NULL OR valid_to>CURRENT_DATE)) THEN RAISE EXCEPTION 'Contact affiliation required' USING ERRCODE='23514'; END IF;
  IF NEW.stage_id='Qualified' AND NEW.primary_person_id IS NULL AND NOT EXISTS(SELECT 1 FROM ppo.activities a JOIN ppo.activity_links l ON (l.workspace_id,l.activity_id)=(a.workspace_id,a.id) WHERE a.workspace_id=NEW.workspace_id AND a.id=NEW.identification_activity_id AND a.owner_id=NEW.owner_id AND a.status IN ('Open','InProgress') AND a.kind IN ('CustomerContact','RelationshipReview') AND l.opportunity_id=NEW.id) THEN RAISE EXCEPTION 'Owned active contact identification action required' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;

-- Personal presentation preferences contain no copied business records.
CREATE TABLE ppo.crm_directory_preferences (
 workspace_id uuid NOT NULL, user_id uuid NOT NULL, kind text NOT NULL CHECK(kind IN ('organisations','people')),
 version integer NOT NULL CHECK(version>0), views jsonb NOT NULL CHECK(jsonb_typeof(views)='array' AND jsonb_array_length(views)<=12),
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(workspace_id,user_id,kind),
 FOREIGN KEY(workspace_id,user_id) REFERENCES ppo.users(workspace_id,id)
);
