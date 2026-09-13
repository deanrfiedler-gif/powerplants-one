-- BP-03 increment A, issue #143. Additive. No existing row is rewritten.
-- Adds the five-stage catalogue and replaces the enumerated stage-edge pair in
-- ppo.protect_opportunity() with an ordinal rule read from crm_stage_definitions.
-- The application continues to run on the I1 definition; the code cutover is separate.
-- Plan: docs/delivery/crm-five-stage-implementation-plan.md r02.

-- 1. Admit the five-stage definition alongside the I1 one. Both definition rows are
--    immutable, so the five-stage pipeline is a new row, never an amendment.
DO $$
DECLARE definition text;
BEGIN
 FOR definition IN SELECT unnest(ARRAY['crm_pipeline_definitions_definition_key_check','crm_pipeline_definitions_label_check']) LOOP
  EXECUTE format('ALTER TABLE ppo.crm_pipeline_definitions DROP CONSTRAINT %I', definition);
 END LOOP;
END $$;
ALTER TABLE ppo.crm_pipeline_definitions ADD CONSTRAINT crm_pipeline_definitions_definition_key_check
 CHECK(definition_key IN ('SyntheticEnquiryI1','SyntheticFiveStage'));
ALTER TABLE ppo.crm_pipeline_definitions ADD CONSTRAINT crm_pipeline_definitions_label_check
 CHECK(label IN ('Fictional sales enquiry — I1','Fictional sales pipeline'));

-- 2. Stage catalogue. The ordinal pairing check is replaced by display order that is
--    unique per definition. A stage may now be entered more than once; ordinal carries
--    no entry history, which the event log holds instead.
ALTER TABLE ppo.crm_stage_definitions DROP CONSTRAINT crm_stage_definitions_check;
ALTER TABLE ppo.crm_stage_definitions DROP CONSTRAINT crm_stage_definitions_stage_id_check;
ALTER TABLE ppo.crm_stage_definitions ADD CONSTRAINT crm_stage_definitions_stage_id_check
 CHECK(stage_id IN ('Enquiry','Qualified','Discovery','Scoping','Quoting','Negotiation','Closing'));
ALTER TABLE ppo.crm_stage_definitions ADD CONSTRAINT crm_stage_definitions_ordinal_check CHECK(ordinal>0);
ALTER TABLE ppo.crm_stage_definitions ADD CONSTRAINT crm_stage_definitions_ordinal_key
 UNIQUE(workspace_id,pipeline_definition_id,ordinal);

-- 3. OpportunityCreated no longer names a literal entry stage. A CHECK cannot read the
--    stage catalogue, so "create at the first ordinal of your own definition" moves to
--    protect_opportunity() below, which can. This deviates from plan r02 §4.1 item 7,
--    which proposed expressing it in the CHECK; that is not possible in PostgreSQL.
--    The OpportunityQualified and OpportunityStageChanged branches are untouched:
--    the first keeps historical rows valid, the second is already general.
DO $$
DECLARE definition text;
BEGIN
 SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint
  WHERE conrelid='ppo.opportunity_events'::regclass AND conname='opportunity_events_check';
 IF position('(to_stage = ''Enquiry''::text)' in definition)=0 THEN
  RAISE EXCEPTION 'Inspect the changed opportunity event check before migration';
 END IF;
 EXECUTE 'ALTER TABLE ppo.opportunity_events DROP CONSTRAINT opportunity_events_check';
 EXECUTE format('ALTER TABLE ppo.opportunity_events ADD CONSTRAINT opportunity_events_check CHECK (%s)',
  replace(substring(definition from 8 for length(definition)-8),
          ' AND (to_stage = ''Enquiry''::text)', ''));
END $$;

-- 4. Movement becomes a rule rather than an enumerated pair: create at the first
--    ordinal; forward exactly one ordinal; backward to any lower ordinal. Everything
--    else in this function is carried across unchanged from 0017.
CREATE OR REPLACE FUNCTION ppo.protect_opportunity() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE old_ordinal integer; new_ordinal integer;
BEGIN
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 SELECT ordinal INTO new_ordinal FROM ppo.crm_stage_definitions
  WHERE workspace_id=NEW.workspace_id AND pipeline_definition_id=NEW.pipeline_definition_id AND stage_id=NEW.stage_id;
 IF new_ordinal IS NULL THEN RAISE EXCEPTION 'Stage is not defined for this pipeline' USING ERRCODE='23514'; END IF;
 IF TG_OP='INSERT' THEN
  IF NEW.version<>1 THEN RAISE EXCEPTION 'Create only at version one' USING ERRCODE='23514'; END IF;
  IF new_ordinal<>(SELECT min(ordinal) FROM ppo.crm_stage_definitions
                    WHERE workspace_id=NEW.workspace_id AND pipeline_definition_id=NEW.pipeline_definition_id) THEN
   RAISE EXCEPTION 'Create only at the first stage' USING ERRCODE='23514'; END IF;
 ELSE
  IF (NEW.company_id,NEW.organisation_id,NEW.site_id,NEW.site_unknown_reason,NEW.owner_id,NEW.pipeline_definition_id,NEW.source_channel,NEW.source_basis) IS DISTINCT FROM
     (OLD.company_id,OLD.organisation_id,OLD.site_id,OLD.site_unknown_reason,OLD.owner_id,OLD.pipeline_definition_id,OLD.source_channel,OLD.source_basis) OR NEW.version<>OLD.version+1 THEN
   RAISE EXCEPTION 'Original opportunity context and version are protected' USING ERRCODE='55000'; END IF;
  IF NEW.stage_id<>OLD.stage_id THEN
   SELECT ordinal INTO old_ordinal FROM ppo.crm_stage_definitions
    WHERE workspace_id=OLD.workspace_id AND pipeline_definition_id=OLD.pipeline_definition_id AND stage_id=OLD.stage_id;
   IF NOT (new_ordinal=old_ordinal+1 OR new_ordinal<old_ordinal) THEN
    RAISE EXCEPTION 'Unsupported opportunity progression' USING ERRCODE='23514'; END IF;
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

-- 5. Plan r02 §4.3. Without this the five-stage catalogue cannot be used at all:
--    opportunities_check2 admits only the two I1 stage literals, so a Discovery row
--    is refused by the table it lives in. Verified against a migrated database before
--    this section existed: "new row for relation opportunities violates check
--    constraint opportunities_check2".
--    The Enquiry and Qualified branches are kept verbatim so every historical row
--    stays valid. The added branch carries §4.3's reading: qualification happens in
--    Leads, so a five-stage deal arrives holding its evidence and holds it at every
--    stage, Discovery included.
--    The five stage names are written out here because a CHECK cannot read
--    crm_stage_definitions. That is the same limit step 3 met, resolved the other way:
--    movement is a rule and belongs in the trigger, evidence shape is a row invariant
--    and is worth keeping declarative even at the cost of naming the stages twice.
DO $$
DECLARE definition text;
BEGIN
 SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint
  WHERE conrelid='ppo.opportunities'::regclass AND conname='opportunities_check2';
 IF position('(stage_id = ''Enquiry''::text)' in definition)=0
    OR position('(stage_id = ''Qualified''::text)' in definition)=0 THEN
  RAISE EXCEPTION 'Inspect the changed opportunity qualification check before migration';
 END IF;
END $$;
ALTER TABLE ppo.opportunities DROP CONSTRAINT opportunities_check2;
ALTER TABLE ppo.opportunities ADD CONSTRAINT opportunities_check2 CHECK (
 (stage_id='Enquiry' AND qualification_note IS NULL AND identification_activity_id IS NULL)
 OR (stage_id='Qualified' AND qualification_note IS NOT NULL
     AND length(btrim(qualification_note)) BETWEEN 1 AND 2000
     AND (primary_person_id IS NOT NULL OR identification_activity_id IS NOT NULL))
 OR (stage_id IN ('Discovery','Scoping','Quoting','Negotiation','Closing')
     AND qualification_note IS NOT NULL
     AND length(btrim(qualification_note)) BETWEEN 1 AND 2000
     AND (primary_person_id IS NOT NULL OR identification_activity_id IS NOT NULL)));

-- 6. Bind a recorded stage to the row it describes. Step 3 removed ' AND to_stage =
--    ''Enquiry''' from the OpportunityCreated branch and left nothing in its place:
--    the CHECK cannot name a stage generically, protect_opportunity() guards a
--    different table, and check_opportunity_event_chain() compared only from_stage to
--    the preceding to_stage, which says nothing at version 1. An OpportunityCreated
--    event could therefore record any stage while the row held another, and every
--    later event would chain onto the wrong value consistently.
--    The event at the row's current version must agree with the row. Earlier versions
--    are history and are left alone. This holds for every existing event type, so no
--    stored row is invalidated.
CREATE OR REPLACE FUNCTION ppo.check_opportunity_event_chain() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE o ppo.opportunities; previous ppo.opportunity_events;
BEGIN
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 SELECT * INTO STRICT o FROM ppo.opportunities WHERE workspace_id=NEW.workspace_id AND id=NEW.opportunity_id;
 IF NEW.opportunity_version>o.version OR NEW.pipeline_definition_id<>o.pipeline_definition_id THEN
  RAISE EXCEPTION 'Event requires an accepted opportunity version and definition' USING ERRCODE='23514';
 END IF;
 IF NEW.opportunity_version=o.version AND NEW.to_stage<>o.stage_id THEN
  RAISE EXCEPTION 'Recorded stage must match the opportunity it describes' USING ERRCODE='23514';
 END IF;
 IF NEW.opportunity_version>1 THEN
  SELECT * INTO previous FROM ppo.opportunity_events WHERE workspace_id=NEW.workspace_id AND opportunity_id=NEW.opportunity_id AND opportunity_version=NEW.opportunity_version-1;
  IF previous.id IS NULL OR NEW.from_stage IS DISTINCT FROM previous.to_stage THEN
   RAISE EXCEPTION 'Opportunity history requires its exact preceding version and stage' USING ERRCODE='23514';
  END IF;
 END IF;
 RETURN NULL;
END $$;
