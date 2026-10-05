-- SYN-ES07-04. Extend subordinate events; preserve all original rows and receipts.
ALTER TABLE ppo.quote_supply_events
 DROP CONSTRAINT quote_supply_events_decision_check,
 DROP CONSTRAINT quote_supply_events_check4,
 DROP CONSTRAINT quote_supply_events_check5,
 DROP CONSTRAINT quote_supply_events_check6,
 ADD CONSTRAINT quote_supply_events_decision_check CHECK(decision IN ('Requested','Accepted','Returned','Held','Retain','Hold','AdjustAllocation','ReconcileReservationOutcome')),
 ADD CONSTRAINT quote_supply_events_check4 CHECK((decision IN ('AdjustAllocation','ReconcileReservationOutcome'))=(command IS NOT NULL)),
 ADD CONSTRAINT quote_supply_events_check5 CHECK((action='Apply' AND decision IN ('AdjustAllocation','ReconcileReservationOutcome'))=(native_receipt IS NOT NULL)),
 ADD CONSTRAINT quote_supply_events_check6 CHECK((action='Refer' AND decision='Requested' AND referral_id=id) OR (action='Receive' AND decision IN ('Accepted','Returned','Held')) OR (action IN ('Review','Apply') AND decision IN ('Retain','Hold','AdjustAllocation','ReconcileReservationOutcome')));

-- Keep the complete original lineage, allocation and receipt protections. Only
-- dispatch allocation-specific validation to its original decision family.
DO $$ DECLARE definition text; BEGIN
 SELECT pg_get_functiondef('ppo.quote_supply_guard()'::regprocedure) INTO definition;
 IF position('IF cmd IS NOT NULL THEN' in definition)=0 THEN RAISE EXCEPTION 'Expected original Supply guard'; END IF;
 EXECUTE replace(definition,'IF cmd IS NOT NULL THEN','IF NEW.decision=''AdjustAllocation'' THEN');
 SELECT pg_get_functiondef('ppo.quote_supply_evidence()'::regprocedure) INTO definition;
 IF position('IF NEW.action=''Apply'' AND NEW.command IS NOT NULL THEN' in definition)=0 THEN RAISE EXCEPTION 'Expected original Supply evidence guard'; END IF;
 EXECUTE replace(definition,'IF NEW.action=''Apply'' AND NEW.command IS NOT NULL THEN','IF NEW.action=''Apply'' AND NEW.decision=''AdjustAllocation'' THEN');
END $$;

CREATE FUNCTION ppo.quote_supply_reservation_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE original ppo.supply_facts; saved ppo.supply_facts; target ppo.supply_records; cmd jsonb;
BEGIN
 IF NEW.decision<>'ReconcileReservationOutcome' THEN RETURN NEW; END IF;
 cmd=NEW.command;
 SELECT * INTO STRICT target FROM ppo.supply_records WHERE workspace_id=NEW.workspace_id AND id=NEW.target_id;
 SELECT * INTO STRICT original FROM ppo.supply_facts WHERE workspace_id=NEW.workspace_id AND record_id=NEW.target_id AND id=(cmd->>'predecessor_id')::uuid;
 IF target.kind<>'Demand' OR original.kind<>'ExternalOutcome' OR original.data->>'effect' IS DISTINCT FROM 'Reservation' OR original.data->>'state' IS DISTINCT FROM 'Unknown'
 OR cmd->>'record_id' IS DISTINCT FROM NEW.target_id::text OR cmd->>'kind' IS DISTINCT FROM 'ExternalOutcome' OR cmd->>'completeness' IS DISTINCT FROM 'Complete'
 OR cmd->'data'->>'source_operation' IS DISTINCT FROM original.data->>'source_operation' OR cmd->'data'->>'effect' IS DISTINCT FROM 'Reservation'
 OR coalesce(cmd->'data'->>'state','') NOT IN ('Confirmed','Failed','Absent') OR length(btrim(coalesce(cmd->'data'->>'lookup_evidence','')))=0
 OR cmd->>'operation_id' IS NULL OR cmd->>'id' IS NULL OR cmd->>'observed_at' IS NULL OR cmd->>'attachment_id' IS NOT NULL
 THEN RAISE EXCEPTION 'Exact original unknown reservation and complete lookup evidence required' USING ERRCODE='23514'; END IF;
 IF NEW.action='Review' THEN
  IF (cmd->>'expected_version')::integer IS DISTINCT FROM target.version OR NOT EXISTS(SELECT 1 FROM ppo.supply_current_facts WHERE workspace_id=NEW.workspace_id AND id=original.id)
   OR EXISTS(SELECT 1 FROM ppo.supply_current_facts WHERE workspace_id=NEW.workspace_id AND record_id=NEW.target_id AND kind='ExternalOutcome' AND data->>'state'='Unknown' AND id<>original.id)
   OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(NEW.basis->'conversion'->'dependencies'->'facts') f WHERE f->>'id'=original.id::text AND f->'data'=original.data AND (f->>'version')::integer=original.version)
  THEN RAISE EXCEPTION 'Review exact current dependency and demand version' USING ERRCODE='23514'; END IF;
 ELSE
  SELECT * INTO STRICT saved FROM ppo.supply_facts WHERE workspace_id=NEW.workspace_id AND record_id=NEW.target_id AND id=(cmd->>'id')::uuid;
  IF (cmd->>'expected_version')::integer IS DISTINCT FROM target.version-1 OR saved.version<>target.version OR saved.kind<>'ExternalOutcome' OR saved.predecessor_id IS DISTINCT FROM original.id OR saved.data IS DISTINCT FROM cmd->'data' OR saved.completeness<>'Complete' OR saved.evidence IS DISTINCT FROM cmd->>'evidence' OR saved.observed_at IS DISTINCT FROM (cmd->>'observed_at')::timestamptz OR saved.created_by<>NEW.created_by
  THEN RAISE EXCEPTION 'Apply exact native successor once' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER quote_supply_reservation_guard BEFORE INSERT ON ppo.quote_supply_events FOR EACH ROW EXECUTE FUNCTION ppo.quote_supply_reservation_guard();

CREATE FUNCTION ppo.quote_supply_reservation_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.action='Apply' AND NEW.decision='ReconcileReservationOutcome' AND NOT EXISTS(
  SELECT 1 FROM ppo.operation_receipts r
  JOIN ppo.audit_events a ON (a.workspace_id,a.actor_id,a.operation_id)=(r.workspace_id,r.actor_id,r.operation_id)
  JOIN ppo.outbox_jobs j ON (j.workspace_id,j.actor_id,j.operation_id)=(r.workspace_id,r.actor_id,r.operation_id)
  JOIN ppo.supply_facts f ON f.workspace_id=r.workspace_id AND f.id=(NEW.command->>'id')::uuid
  JOIN ppo.supply_revisions h ON h.workspace_id=r.workspace_id AND h.record_id=NEW.target_id AND h.version=(NEW.command->>'expected_version')::integer+1
  WHERE r.workspace_id=NEW.workspace_id AND r.actor_id=NEW.created_by AND r.operation_id=(NEW.command->>'operation_id')::uuid AND r.record_id=NEW.target_id AND r.result=NEW.native_receipt
  AND a.details->>'command'='Supply:Fact:ExternalOutcome' AND a.details->>'fact_id'=f.id::text AND a.details->>'supply_review_id'=NEW.review_id::text AND a.details->>'supply_outcome_id'=NEW.id::text AND j.kind='SupplyRecorded'
  AND f.xmin::text::bigint=mod(pg_current_xact_id()::text::numeric,4294967296) AND h.xmin::text::bigint=mod(pg_current_xact_id()::text::numeric,4294967296))
 THEN RAISE EXCEPTION 'Native reservation evidence history and original receipt must commit with outcome' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER quote_supply_reservation_evidence AFTER INSERT ON ppo.quote_supply_events DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.quote_supply_reservation_evidence();
