-- BP-03 increment A: atomic Discovery conversion, preserving historical I1 facts.
-- No existing opportunity, event, grant, receipt or issued source is rewritten.
CREATE OR REPLACE FUNCTION ppo.check_conversion_operation() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE x ppo.lead_conversions; o ppo.opportunities; total integer; expected_events integer;
BEGIN
 IF TG_TABLE_NAME='lead_conversions' THEN x:=NEW;
 ELSE
  SELECT * INTO x FROM ppo.lead_conversions WHERE workspace_id=NEW.workspace_id AND created_by=NEW.created_by AND operation_id=NEW.operation_id;
  IF x.id IS NULL THEN
   IF (SELECT count(*) FROM ppo.opportunity_events e WHERE e.workspace_id=NEW.workspace_id AND e.created_by=NEW.created_by AND e.operation_id=NEW.operation_id)>1 THEN
    RAISE EXCEPTION 'Multiple opportunity events require an exact retained conversion' USING ERRCODE='23514';
   END IF;
   RETURN NULL;
  END IF;
 END IF;
 SELECT * INTO o FROM ppo.opportunities WHERE workspace_id=x.workspace_id AND id=x.opportunity_id;
 IF x.id IS NULL OR o.id IS NULL OR NOT EXISTS(SELECT 1 FROM ppo.lead_candidates l WHERE l.workspace_id=x.workspace_id AND l.id=x.lead_id AND l.status='Converted' AND l.version=x.source_version+1 AND o.owner_id=l.owner_id AND o.company_id=l.company_id) THEN
  RAISE EXCEPTION 'An atomic conversion must retain its exact source and owner' USING ERRCODE='23514';
 END IF;
 IF EXISTS(SELECT 1 FROM ppo.crm_pipeline_definitions d WHERE d.workspace_id=o.workspace_id AND d.id=o.pipeline_definition_id AND d.definition_key='SyntheticFiveStage') THEN
  expected_events:=1;
  IF o.stage_id<>'Discovery' OR o.version<>1 OR o.qualification_note IS NULL THEN
   RAISE EXCEPTION 'A five-stage conversion requires qualified Discovery version one' USING ERRCODE='23514';
  END IF;
  SELECT count(*) INTO total FROM ppo.opportunity_events e WHERE e.workspace_id=x.workspace_id AND e.opportunity_id=x.opportunity_id AND e.created_by=x.created_by AND e.operation_id=x.operation_id AND e.opportunity_version=1 AND e.event_type='OpportunityCreated' AND e.to_stage='Discovery' AND e.qualification_note=o.qualification_note;
 ELSE
  expected_events:=2;
  IF o.stage_id<>'Qualified' OR o.version<>2 THEN
   RAISE EXCEPTION 'An I1 conversion requires its original Qualified version two' USING ERRCODE='23514';
  END IF;
  SELECT count(*) INTO total FROM ppo.opportunity_events e WHERE e.workspace_id=x.workspace_id AND e.opportunity_id=x.opportunity_id AND e.created_by=x.created_by AND e.operation_id=x.operation_id AND ((e.opportunity_version=1 AND e.event_type='OpportunityCreated') OR (e.opportunity_version=2 AND e.event_type='OpportunityQualified'));
 END IF;
 IF total<>expected_events OR (SELECT count(*) FROM ppo.opportunity_events e WHERE e.workspace_id=x.workspace_id AND e.created_by=x.created_by AND e.operation_id=x.operation_id)<>expected_events THEN
  RAISE EXCEPTION 'Conversion requires exact creation and qualification facts' USING ERRCODE='23514';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM ppo.lead_events e WHERE e.workspace_id=x.workspace_id AND e.lead_id=x.lead_id AND e.lead_version=x.source_version+1 AND e.event_type='ConvertLeadToOpportunity' AND e.created_by=x.created_by AND e.operation_id=x.operation_id) THEN
  RAISE EXCEPTION 'Conversion requires its exact source event' USING ERRCODE='23514';
 END IF;
 RETURN NULL;
END $$;

-- Discovery can identify its contact through the Activity created in the same
-- transaction. The original identification FK was immediate (unlike next action).
-- Retain its exact workspace/company/Activity target, checking it at commit.
DO $$
DECLARE identification_fk text;
BEGIN
 SELECT c.conname INTO STRICT identification_fk
 FROM pg_constraint c
 WHERE c.conrelid='ppo.opportunities'::regclass AND c.contype='f'
  AND c.confrelid='ppo.activities'::regclass
  AND c.conkey=ARRAY[
   (SELECT attnum FROM pg_attribute WHERE attrelid=c.conrelid AND attname='workspace_id'),
   (SELECT attnum FROM pg_attribute WHERE attrelid=c.conrelid AND attname='company_id'),
   (SELECT attnum FROM pg_attribute WHERE attrelid=c.conrelid AND attname='identification_activity_id')
  ]::smallint[];
 EXECUTE format('ALTER TABLE ppo.opportunities ALTER CONSTRAINT %I DEFERRABLE INITIALLY DEFERRED',identification_fk);
END $$;

-- The Activity and its link must exist, be owned and active at commit.
CREATE FUNCTION ppo.check_five_stage_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.stage_id NOT IN ('Discovery','Scoping','Quoting','Negotiation','Closing') THEN RETURN NULL; END IF;
 IF TG_OP='UPDATE' AND (NEW.qualification_note,NEW.identification_activity_id) IS DISTINCT FROM (OLD.qualification_note,OLD.identification_activity_id) THEN
  RAISE EXCEPTION 'Five-stage qualification evidence is retained' USING ERRCODE='23514';
 END IF;
 IF TG_OP='INSERT' OR NEW.stage_id IS DISTINCT FROM OLD.stage_id OR NEW.primary_person_id IS DISTINCT FROM OLD.primary_person_id THEN
  IF NEW.primary_person_id IS NULL AND NOT EXISTS(SELECT 1 FROM ppo.activities a JOIN ppo.activity_links l ON (l.workspace_id,l.activity_id)=(a.workspace_id,a.id) WHERE a.workspace_id=NEW.workspace_id AND a.id=NEW.identification_activity_id AND a.owner_id=NEW.owner_id AND a.status IN ('Open','InProgress') AND a.kind IN ('CustomerContact','RelationshipReview') AND l.opportunity_id=NEW.id) THEN
   RAISE EXCEPTION 'Owned active contact identification action required' USING ERRCODE='23514';
  END IF;
 END IF;
 IF TG_OP='INSERT' OR NEW.stage_id IS DISTINCT FROM OLD.stage_id THEN
  IF NOT EXISTS(SELECT 1 FROM ppo.opportunity_events e WHERE e.workspace_id=NEW.workspace_id AND e.opportunity_id=NEW.id AND e.opportunity_version=NEW.version AND e.created_at=NEW.stage_entered_at) THEN
   RAISE EXCEPTION 'Current stage time must match its exact event' USING ERRCODE='23514';
  END IF;
 END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER five_stage_evidence AFTER INSERT OR UPDATE ON ppo.opportunities DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_five_stage_evidence();
