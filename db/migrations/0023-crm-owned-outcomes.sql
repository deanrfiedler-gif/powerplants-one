-- CRM-02 / increment B (#144). Adopted policy: audit-follow-through-policy-package.
-- Additive: I1 rows and every existing event, receipt and snapshot stay unchanged.
ALTER TABLE ppo.opportunities DROP CONSTRAINT opportunities_close_outcome_check;
ALTER TABLE ppo.opportunities ADD CONSTRAINT opportunities_close_outcome_check
 CHECK(close_outcome IN ('Open','Won','Lost') AND (close_outcome<>'Won' OR stage_id='Closing')
 AND (close_outcome='Open' OR stage_id IN ('Discovery','Scoping','Quoting','Negotiation','Closing')));
ALTER TABLE ppo.opportunity_events
 ADD COLUMN close_outcome text,
 ADD COLUMN lost_reason text,
 ADD COLUMN acceptance_evidence text;
ALTER TABLE ppo.opportunity_events ADD CONSTRAINT crm_outcome_event_shape CHECK (
 (event_type<>'OpportunityOutcomeRecorded' AND close_outcome IS NULL AND lost_reason IS NULL AND acceptance_evidence IS NULL)
 OR (event_type='OpportunityOutcomeRecorded' AND close_outcome IS NOT NULL AND record_snapshot IS NOT NULL
 AND from_stage=to_stage AND opportunity_version>1 AND
 ((close_outcome='Won' AND to_stage='Closing' AND lost_reason IS NULL AND acceptance_evidence IS NOT NULL AND length(btrim(acceptance_evidence)) BETWEEN 1 AND 2000)
 OR (close_outcome='Lost' AND lost_reason IS NOT NULL AND lost_reason IN ('Price','Competitor','Timing','No decision') AND acceptance_evidence IS NULL))));
DO $$
DECLARE definition text; item record;
BEGIN
 FOR item IN SELECT * FROM (VALUES
  ('outbox_jobs','ck_outbox_kind','kind'),
  ('opportunity_events','opportunity_events_event_type_check','event_type'),
  ('opportunity_events','opportunity_events_check','event_type')
 ) AS v(tab,con,col) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid=('ppo.'||item.tab)::regclass AND conname=item.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',item.tab,item.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR %I=''OpportunityOutcomeRecorded'')',item.tab,item.con,substring(definition from 8 for length(definition)-8),item.col);
 END LOOP;
END $$;
CREATE UNIQUE INDEX ux_crm_single_outcome ON ppo.opportunity_events(workspace_id,opportunity_id) WHERE event_type='OpportunityOutcomeRecorded';

-- This immutable companion records the outstanding obligation, not a Project,
-- Activity reassignment, receiving owner's acceptance or external transaction.
CREATE TABLE ppo.opportunity_handovers_due (
 workspace_id uuid NOT NULL, company_id uuid NOT NULL, opportunity_id uuid NOT NULL,
 outcome_event_id uuid NOT NULL, opportunity_version integer NOT NULL CHECK(opportunity_version>1),
 owner_id uuid NOT NULL, created_by uuid NOT NULL, created_at timestamptz NOT NULL,
 status text NOT NULL DEFAULT 'Due' CHECK(status='Due'), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 PRIMARY KEY(workspace_id,opportunity_id), UNIQUE(workspace_id,outcome_event_id),
 FOREIGN KEY(workspace_id,company_id,opportunity_id) REFERENCES ppo.opportunities(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,outcome_event_id) REFERENCES ppo.opportunity_events(workspace_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER handover_due_immutable BEFORE UPDATE OR DELETE ON ppo.opportunity_handovers_due FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

CREATE FUNCTION ppo.protect_crm_outcome() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  IF NEW.close_outcome<>'Open' THEN RAISE EXCEPTION 'Create an open opportunity' USING ERRCODE='23514'; END IF;
 ELSE
  IF OLD.close_outcome<>'Open' AND (NEW.close_outcome IS DISTINCT FROM OLD.close_outcome OR NEW.stage_id IS DISTINCT FROM OLD.stage_id) THEN
   RAISE EXCEPTION 'Closed opportunities cannot reopen or change stage' USING ERRCODE='23514'; END IF;
  IF NEW.close_outcome IS DISTINCT FROM OLD.close_outcome AND
   (to_jsonb(NEW)-ARRAY['close_outcome','version','updated_at','updated_by']) IS DISTINCT FROM
   (to_jsonb(OLD)-ARRAY['close_outcome','version','updated_at','updated_by']) THEN
   RAISE EXCEPTION 'Record only the outcome; retain the handover basis and activities' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER crm_outcome_protected BEFORE INSERT OR UPDATE ON ppo.opportunities FOR EACH ROW EXECUTE FUNCTION ppo.protect_crm_outcome();

CREATE FUNCTION ppo.check_crm_outcome_graph() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE e ppo.opportunity_events; h ppo.opportunity_handovers_due; o ppo.opportunities;
BEGIN
 IF TG_TABLE_NAME='opportunities' THEN
  SELECT * INTO e FROM ppo.opportunity_events WHERE workspace_id=NEW.workspace_id AND opportunity_id=NEW.id AND opportunity_version=NEW.version;
  IF NEW.close_outcome IS DISTINCT FROM OLD.close_outcome OR e.event_type='OpportunityOutcomeRecorded' THEN
   IF OLD.close_outcome<>'Open' OR NEW.close_outcome='Open' OR e.id IS NULL OR e.event_type<>'OpportunityOutcomeRecorded'
    OR e.close_outcome IS DISTINCT FROM NEW.close_outcome OR e.created_by<>NEW.owner_id OR e.created_by<>NEW.updated_by
    OR e.created_at IS DISTINCT FROM NEW.updated_at OR e.record_snapshot IS DISTINCT FROM ppo.crm_record_snapshot(NEW) THEN
    RAISE EXCEPTION 'Exact owned outcome event required' USING ERRCODE='23514'; END IF;
  END IF;
  RETURN NULL;
 ELSIF TG_TABLE_NAME='opportunity_events' THEN
  IF NEW.event_type<>'OpportunityOutcomeRecorded' THEN RETURN NULL; END IF;
  e:=NEW;
 ELSE
  SELECT * INTO STRICT e FROM ppo.opportunity_events WHERE workspace_id=NEW.workspace_id AND id=NEW.outcome_event_id;
  IF e.event_type<>'OpportunityOutcomeRecorded' OR e.close_outcome<>'Won' OR e.opportunity_id<>NEW.opportunity_id THEN
   RAISE EXCEPTION 'Handover due requires its Won event' USING ERRCODE='23514'; END IF;
 END IF;
 SELECT * INTO STRICT o FROM ppo.opportunities WHERE workspace_id=e.workspace_id AND id=e.opportunity_id;
 SELECT * INTO h FROM ppo.opportunity_handovers_due WHERE workspace_id=e.workspace_id AND opportunity_id=e.opportunity_id;
 IF o.close_outcome IS DISTINCT FROM e.close_outcome OR
  (e.close_outcome='Won' AND (h.opportunity_id IS NULL OR h.company_id<>e.company_id OR h.outcome_event_id<>e.id OR h.owner_id<>e.created_by OR h.created_by<>e.created_by OR h.opportunity_version<>e.opportunity_version OR h.created_at IS DISTINCT FROM e.created_at)) OR
  (e.close_outcome='Lost' AND h.opportunity_id IS NOT NULL) THEN
  RAISE EXCEPTION 'Outcome and exact owned handover due must agree' USING ERRCODE='23514'; END IF;
 IF NOT EXISTS(SELECT 1 FROM ppo.audit_events a WHERE a.workspace_id=e.workspace_id AND a.actor_id=e.created_by AND a.operation_id=e.operation_id AND a.object_type='Opportunity' AND a.object_id=e.opportunity_id AND a.outcome='Accepted' AND a.reason=e.reason AND a.details->>'command'='RecordOpportunityOutcome' AND (a.details->>'record_version')::integer=e.opportunity_version)
 OR NOT EXISTS(SELECT 1 FROM ppo.operation_receipts r WHERE r.workspace_id=e.workspace_id AND r.actor_id=e.created_by AND r.operation_id=e.operation_id AND r.record_id=e.opportunity_id AND (r.result->>'record_version')::integer=e.opportunity_version AND r.result->>'state'=e.close_outcome)
 OR NOT EXISTS(SELECT 1 FROM ppo.outbox_jobs j WHERE j.workspace_id=e.workspace_id AND j.actor_id=e.created_by AND j.operation_id=e.operation_id AND j.kind='OpportunityOutcomeRecorded' AND j.payload=jsonb_build_object('record_id',e.opportunity_id,'record_version',e.opportunity_version,'object_type','Opportunity','synthetic',true)) THEN
  RAISE EXCEPTION 'Outcome requires its accepted audit, receipt and minimal outbox' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER crm_outcome_graph AFTER UPDATE ON ppo.opportunities DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_crm_outcome_graph();
CREATE CONSTRAINT TRIGGER crm_outcome_event_graph AFTER INSERT ON ppo.opportunity_events DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_crm_outcome_graph();
CREATE CONSTRAINT TRIGGER crm_handover_due_graph AFTER INSERT ON ppo.opportunity_handovers_due DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_crm_outcome_graph();
