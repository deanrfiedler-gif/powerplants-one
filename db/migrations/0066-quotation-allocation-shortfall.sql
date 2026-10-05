-- SYN-ES07-06: exact independently received reductions after applied Receipt correction.
-- No installed evidence, seeds, grants, identities or external transactions change.
-- Statement conservation is immediate for ALL allocation writes, never deferred.
CREATE OR REPLACE FUNCTION ppo.supply_allocation_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE d ppo.supply_records; s ppo.supply_records;
BEGIN
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 SELECT * INTO STRICT d FROM ppo.supply_records WHERE workspace_id=NEW.workspace_id AND id=NEW.demand_id;
 SELECT * INTO STRICT s FROM ppo.supply_records WHERE workspace_id=NEW.workspace_id AND id=NEW.supply_id;
 IF d.kind<>'Demand' OR s.kind<>'Supply' OR NEW.unit<>d.unit OR NEW.unit<>s.unit OR d.item<>s.item OR d.data->>'demand_class'<>'Approved' THEN RAISE EXCEPTION 'Allocation requires same item/unit and approved demand' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND ((NEW.id,NEW.demand_id,NEW.supply_id,NEW.unit,NEW.basis,NEW.company_id,NEW.workspace_id) IS DISTINCT FROM (OLD.id,OLD.demand_id,OLD.supply_id,OLD.unit,OLD.basis,OLD.company_id,OLD.workspace_id) OR NEW.version<>OLD.version+1) THEN RAISE EXCEPTION 'Stale or changed allocation identity' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE FUNCTION ppo.supply_allocation_conservation() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE a record; capacity numeric; total numeric; d ppo.supply_records;
BEGIN
 FOR a IN SELECT DISTINCT workspace_id,supply_id,basis FROM allocation_new LOOP
  SELECT CASE WHEN a.basis='Incoming' THEN s.quantity ELSE ppo.supply_usable(a.workspace_id,s.id) END INTO capacity FROM ppo.supply_records s WHERE s.workspace_id=a.workspace_id AND s.id=a.supply_id;
  SELECT sum(quantity) INTO total FROM ppo.supply_allocations WHERE workspace_id=a.workspace_id AND supply_id=a.supply_id AND basis=a.basis;
  IF capacity IS NULL OR total>capacity THEN RAISE EXCEPTION 'Allocation exceeds evidenced capacity or demand' USING ERRCODE='23514'; END IF;
 END LOOP;
 FOR a IN SELECT DISTINCT workspace_id,demand_id,basis FROM allocation_new LOOP
  SELECT * INTO STRICT d FROM ppo.supply_records WHERE workspace_id=a.workspace_id AND id=a.demand_id;
  SELECT sum(quantity) INTO total FROM ppo.supply_allocations WHERE workspace_id=a.workspace_id AND demand_id=a.demand_id AND basis=a.basis;
  IF total>d.quantity THEN RAISE EXCEPTION 'Allocation exceeds evidenced capacity or demand' USING ERRCODE='23514'; END IF;
  IF a.basis='Usable' AND total<coalesce((SELECT sum(ppo.supply_q(data,'quantity')) FROM ppo.supply_current_facts WHERE workspace_id=a.workspace_id AND record_id=a.demand_id AND kind='Pick'),0) THEN RAISE EXCEPTION 'Retain allocation for already picked goods' USING ERRCODE='23514'; END IF;
 END LOOP;
 RETURN NULL;
END $$;
CREATE TRIGGER allocation_conservation_insert AFTER INSERT ON ppo.supply_allocations REFERENCING NEW TABLE AS allocation_new FOR EACH STATEMENT EXECUTE FUNCTION ppo.supply_allocation_conservation();
CREATE TRIGGER allocation_conservation_update AFTER UPDATE ON ppo.supply_allocations REFERENCING NEW TABLE AS allocation_new FOR EACH STATEMENT EXECUTE FUNCTION ppo.supply_allocation_conservation();

CREATE TABLE ppo.quote_supply_shortfall_events (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, revision_id uuid NOT NULL, execution_id uuid NOT NULL, target_id uuid NOT NULL,
 sequence integer NOT NULL CHECK(sequence>0), action text NOT NULL CHECK(action IN ('ShortfallPropose','ShortfallReceive')),
 referral_id uuid NOT NULL, receiving_id uuid NOT NULL, proposal_id uuid NOT NULL, predecessor_id uuid,
 demand_id uuid, owner_id uuid NOT NULL, decision text NOT NULL CHECK(decision IN ('Proposed','Accepted','Returned','Held')),
 basis jsonb NOT NULL, basis_hash text NOT NULL CHECK(basis_hash ~ '^[a-f0-9]{64}$'),
 dependencies jsonb NOT NULL, dependency_hash text NOT NULL CHECK(dependency_hash ~ '^[a-f0-9]{64}$'),
 proposal_hash text NOT NULL CHECK(proposal_hash ~ '^[a-f0-9]{64}$'), command jsonb NOT NULL,
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 1000), evidence text NOT NULL CHECK(length(btrim(evidence)) BETWEEN 1 AND 4000),
 created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(), operation_id uuid NOT NULL,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,target_id,id), UNIQUE(workspace_id,target_id,sequence), UNIQUE(workspace_id,created_by,operation_id),
 FOREIGN KEY(workspace_id,target_id) REFERENCES ppo.quote_conversion_targets(workspace_id,target_id),
 FOREIGN KEY(workspace_id,revision_id,execution_id) REFERENCES ppo.quote_conversion_events(workspace_id,revision_id,id),
 FOREIGN KEY(workspace_id,target_id,referral_id) REFERENCES ppo.quote_supply_events(workspace_id,target_id,id),
 FOREIGN KEY(workspace_id,target_id,receiving_id) REFERENCES ppo.quote_supply_events(workspace_id,target_id,id),
 FOREIGN KEY(workspace_id,target_id,proposal_id) REFERENCES ppo.quote_supply_shortfall_events(workspace_id,target_id,id) DEFERRABLE INITIALLY DEFERRED,
 FOREIGN KEY(workspace_id,target_id,predecessor_id) REFERENCES ppo.quote_supply_shortfall_events(workspace_id,target_id,id),
 FOREIGN KEY(workspace_id,demand_id) REFERENCES ppo.supply_records(workspace_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id), FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 CHECK((action='ShortfallPropose' AND decision='Proposed' AND proposal_id=id AND demand_id IS NULL) OR (action='ShortfallReceive' AND decision IN ('Accepted','Returned','Held') AND demand_id IS NOT NULL))
);
CREATE UNIQUE INDEX quote_shortfall_reserved_operation ON ppo.quote_supply_shortfall_events(workspace_id,(command->>'operation_id')) WHERE action='ShortfallPropose';
CREATE TRIGGER immutable_quote_shortfall BEFORE UPDATE OR DELETE ON ppo.quote_supply_shortfall_events FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

ALTER TABLE ppo.quote_supply_events
 ADD COLUMN allocation_proposal_id uuid,
 ADD FOREIGN KEY(workspace_id,target_id,allocation_proposal_id) REFERENCES ppo.quote_supply_shortfall_events(workspace_id,target_id,id),
 DROP CONSTRAINT quote_supply_events_decision_check,
 DROP CONSTRAINT quote_supply_events_check4,
 DROP CONSTRAINT quote_supply_events_check5,
 DROP CONSTRAINT quote_supply_events_check6,
 DROP CONSTRAINT quote_supply_events_check8,
 ADD CONSTRAINT quote_supply_events_decision_check CHECK(decision IN ('Requested','Accepted','Returned','Held','Retain','Hold','AdjustAllocation','ReconcileReservationOutcome','CorrectReceipt','ReduceAllocations')),
 ADD CONSTRAINT quote_supply_events_check4 CHECK((decision IN ('AdjustAllocation','ReconcileReservationOutcome','CorrectReceipt','ReduceAllocations'))=(command IS NOT NULL)),
 ADD CONSTRAINT quote_supply_events_check5 CHECK((action='Apply' AND decision IN ('AdjustAllocation','ReconcileReservationOutcome','CorrectReceipt','ReduceAllocations'))=(native_receipt IS NOT NULL)),
 ADD CONSTRAINT quote_supply_events_check6 CHECK((action='Refer' AND decision='Requested' AND referral_id=id) OR (action='Receive' AND decision IN ('Accepted','Returned','Held')) OR (action IN ('Review','Apply') AND decision IN ('Retain','Hold','AdjustAllocation','ReconcileReservationOutcome','CorrectReceipt','ReduceAllocations'))),
 ADD CONSTRAINT quote_supply_events_check8 CHECK(decision IN ('CorrectReceipt','ReduceAllocations') OR effect_receiving_ids='[]'::jsonb),
 ADD CHECK((decision='ReduceAllocations')=(allocation_proposal_id IS NOT NULL));
DROP INDEX ppo.quote_supply_native_once;
CREATE UNIQUE INDEX quote_supply_native_once ON ppo.quote_supply_events(workspace_id,(command->>'operation_id')) WHERE action='Review' AND command IS NOT NULL AND decision NOT IN ('CorrectReceipt','ReduceAllocations');
CREATE UNIQUE INDEX quote_shortfall_apply_once ON ppo.quote_supply_events(workspace_id,allocation_proposal_id) WHERE action='Apply' AND decision='ReduceAllocations';

CREATE FUNCTION ppo.shortfall_changes(cmd jsonb) RETURNS jsonb LANGUAGE sql IMMUTABLE AS $$ SELECT coalesce(cmd->'changes',jsonb_build_array(cmd)) $$;

-- Compare complete pre/post native position; immutable fact IDs retain exact contents.
CREATE FUNCTION ppo.shortfall_position(w uuid,deps jsonb,cmd jsonb,applied boolean,actor uuid) RETURNS void LANGUAGE plpgsql AS $$
DECLARE g jsonb=deps->'group'; x jsonb; y jsonb; change jsonb; r ppo.supply_records; a ppo.supply_allocations; corr ppo.quote_supply_events; changed boolean; n integer;
BEGIN
 SELECT * INTO STRICT corr FROM ppo.quote_supply_events WHERE workspace_id=w AND id=(deps->'correction'->>'id')::uuid;
 SELECT * INTO STRICT r FROM ppo.supply_records WHERE workspace_id=w AND id=(cmd->>'supply_id')::uuid;
 IF corr.action<>'Apply' OR corr.decision<>'CorrectReceipt' OR corr.native_receipt IS NULL OR corr.command->>'record_id'<>r.id::text OR r.data->>'supply_kind'<>'Shipment'
 OR NOT EXISTS(SELECT 1 FROM ppo.supply_current_facts WHERE workspace_id=w AND record_id=r.id AND id=(corr.command->>'id')::uuid)
 OR EXISTS(SELECT 1 FROM ppo.supply_current_facts WHERE workspace_id=w AND record_id=r.id AND kind='ExternalOutcome' AND data->>'state'='Unknown')
 OR r.version<>(cmd->>'supply_version')::integer+(CASE WHEN applied THEN 1 ELSE 0 END)
 THEN RAISE EXCEPTION 'Exact current applied Receipt correction and Shipment Supply required' USING ERRCODE='23514'; END IF;
 IF NOT applied AND ((g->'supply') IS DISTINCT FROM (to_jsonb(r)||jsonb_build_object('quantity',r.quantity::text)) OR ppo.supply_usable(w,r.id) IS NULL OR (g->>'usable_allocated')::numeric<=ppo.supply_usable(w,r.id)) THEN RAISE EXCEPTION 'Review exact current shortfall' USING ERRCODE='23514'; END IF;
 IF applied AND (((g->'supply')-'version'-'updated_at'-'updated_by'-'last_reason') IS DISTINCT FROM ((to_jsonb(r)||jsonb_build_object('quantity',r.quantity::text))-'version'-'updated_at'-'updated_by'-'last_reason') OR r.updated_by<>actor OR r.last_reason<>cmd->>'reason') THEN RAISE EXCEPTION 'Retain Supply business content' USING ERRCODE='23514'; END IF;
 IF jsonb_array_length(g->'allocations')<>(SELECT count(*) FROM ppo.supply_allocations WHERE workspace_id=w AND supply_id=r.id) THEN RAISE EXCEPTION 'Complete shared allocation set required' USING ERRCODE='23514'; END IF;
 IF jsonb_array_length(g->'demands')<>(SELECT count(DISTINCT demand_id) FROM ppo.supply_allocations WHERE workspace_id=w AND supply_id=r.id) THEN RAISE EXCEPTION 'Complete affected Demand set required' USING ERRCODE='23514'; END IF;
 IF jsonb_array_length(ppo.shortfall_changes(cmd))<1 OR jsonb_array_length(ppo.shortfall_changes(cmd))>100 OR
  (SELECT count(DISTINCT value->>'id') FROM jsonb_array_elements(ppo.shortfall_changes(cmd)))<>jsonb_array_length(ppo.shortfall_changes(cmd)) THEN RAISE EXCEPTION 'Distinct bounded reductions required' USING ERRCODE='23514'; END IF;
 FOR change IN SELECT value FROM jsonb_array_elements(ppo.shortfall_changes(cmd)) LOOP
  SELECT value INTO x FROM jsonb_array_elements(g->'allocations') WHERE value->>'id'=change->>'id';
  IF x IS NULL OR change->>'supply_id'<>r.id::text OR change->>'demand_id' IS DISTINCT FROM x->>'demand_id' OR change->>'unit' IS DISTINCT FROM x->>'unit'
   OR change->>'basis' IS DISTINCT FROM 'Usable' OR x->>'basis'<>'Usable' OR change->>'operation_id' IS DISTINCT FROM cmd->>'operation_id'
   OR change->>'reason' IS DISTINCT FROM cmd->>'reason' OR change->>'expected_version' IS DISTINCT FROM x->>'version'
   OR change->>'supply_version' IS DISTINCT FROM cmd->>'supply_version' OR ppo.supply_q(change,'quantity')>=(x->>'quantity')::numeric
  THEN RAISE EXCEPTION 'Exact quantity-only existing Usable reductions required' USING ERRCODE='23514'; END IF;
 END LOOP;
 FOR x IN SELECT value FROM jsonb_array_elements(g->'allocations') LOOP
  SELECT * INTO STRICT a FROM ppo.supply_allocations WHERE workspace_id=w AND id=(x->>'id')::uuid;
  SELECT value INTO change FROM jsonb_array_elements(ppo.shortfall_changes(cmd)) WHERE value->>'id'=a.id::text;
  IF applied AND change IS NOT NULL THEN
   IF a.quantity<>ppo.supply_q(change,'quantity') OR a.version<>(x->>'version')::integer+1 OR a.updated_by<>actor OR a.reason<>cmd->>'reason'
    OR (x-'quantity'-'version'-'updated_at'-'updated_by'-'reason') IS DISTINCT FROM ((to_jsonb(a)||jsonb_build_object('quantity',a.quantity::text))-'quantity'-'version'-'updated_at'-'updated_by'-'reason')
   THEN RAISE EXCEPTION 'Exact applied allocation effects required' USING ERRCODE='23514'; END IF;
  ELSIF x IS DISTINCT FROM (to_jsonb(a)||jsonb_build_object('quantity',a.quantity::text)) THEN RAISE EXCEPTION 'Allocation changed outside exact proposal' USING ERRCODE='23514'; END IF;
 END LOOP;
 FOR x IN SELECT value FROM jsonb_array_elements(g->'demands') LOOP
  SELECT * INTO STRICT r FROM ppo.supply_records WHERE workspace_id=w AND id=(x->'record'->>'id')::uuid;
  SELECT value INTO change FROM jsonb_array_elements(ppo.shortfall_changes(cmd)) WHERE value->>'demand_id'=r.id::text;
  changed=change IS NOT NULL;
  IF changed AND (r.data->>'demand_class'<>'Approved' OR EXISTS(SELECT 1 FROM ppo.supply_records WHERE workspace_id=w AND parent_id=r.id) OR EXISTS(SELECT 1 FROM ppo.supply_current_facts WHERE workspace_id=w AND record_id=r.id AND kind NOT IN ('Impact','Assessment','Pick'))) THEN RAISE EXCEPTION 'Consequential dependencies require their owning workflow' USING ERRCODE='23514'; END IF;
  IF changed AND (change->>'demand_version')::integer<>(x->'record'->>'version')::integer THEN RAISE EXCEPTION 'Exact Demand version required' USING ERRCODE='23514'; END IF;
  IF applied AND changed THEN
   IF r.version<>(x->'record'->>'version')::integer+1 OR r.updated_by<>actor OR r.last_reason<>cmd->>'reason' OR ((x->'record')-'version'-'updated_at'-'updated_by'-'last_reason') IS DISTINCT FROM ((to_jsonb(r)||jsonb_build_object('quantity',r.quantity::text))-'version'-'updated_at'-'updated_by'-'last_reason')
    OR NOT EXISTS(SELECT 1 FROM ppo.supply_facts WHERE workspace_id=w AND record_id=r.id AND kind='Impact' AND version=r.version AND data->>'state'='Requested' AND activity_id IS NOT NULL AND xmin::text::bigint=mod(pg_current_xact_id()::text::numeric,4294967296))
   THEN RAISE EXCEPTION 'Retain Demand content and append owned Impact' USING ERRCODE='23514'; END IF;
  ELSIF x->'record' IS DISTINCT FROM (to_jsonb(r)||jsonb_build_object('quantity',r.quantity::text)) THEN RAISE EXCEPTION 'Unreviewed affected Demand change' USING ERRCODE='23514'; END IF;
  FOR y IN SELECT value FROM jsonb_array_elements(x->'facts') LOOP
   IF NOT EXISTS(SELECT 1 FROM ppo.supply_current_facts WHERE workspace_id=w AND record_id=r.id AND id=(y->>'id')::uuid) THEN RAISE EXCEPTION 'Reviewed fact has a successor' USING ERRCODE='23514'; END IF;
  END LOOP;
  SELECT count(*) INTO n FROM ppo.supply_current_facts WHERE workspace_id=w AND record_id=r.id;
  IF n<>jsonb_array_length(x->'facts')+(CASE WHEN applied AND changed THEN 1 ELSE 0 END) THEN RAISE EXCEPTION 'Unreviewed dependency change' USING ERRCODE='23514'; END IF;
 END LOOP;
END $$;

CREATE FUNCTION ppo.quote_shortfall_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE ref ppo.quote_supply_events; recv ppo.quote_supply_events; prop ppo.quote_supply_shortfall_events; prev uuid; seq integer; d ppo.supply_records;
BEGIN
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 SELECT * INTO STRICT ref FROM ppo.quote_supply_events WHERE workspace_id=NEW.workspace_id AND target_id=NEW.target_id AND action='Refer' ORDER BY sequence DESC LIMIT 1;
 SELECT * INTO STRICT recv FROM ppo.quote_supply_events WHERE workspace_id=NEW.workspace_id AND referral_id=ref.id AND action='Receive' ORDER BY sequence DESC LIMIT 1;
 SELECT coalesce(max(sequence),0) INTO seq FROM ppo.quote_supply_shortfall_events WHERE workspace_id=NEW.workspace_id AND target_id=NEW.target_id;
 IF NEW.sequence<>seq+1 OR NEW.referral_id<>ref.id OR NEW.receiving_id<>recv.id OR recv.decision<>'Accepted' OR NEW.execution_id<>ref.execution_id OR NEW.revision_id<>ref.revision_id OR NEW.dependencies->'correction'->>'target_id'<>NEW.target_id::text THEN RAISE EXCEPTION 'Exact accepted referral and completed correction lineage required' USING ERRCODE='23514'; END IF;
 PERFORM ppo.shortfall_position(NEW.workspace_id,NEW.dependencies,NEW.command,false,NEW.created_by);
 IF NEW.action='ShortfallPropose' THEN
  SELECT id INTO prev FROM ppo.quote_supply_shortfall_events WHERE workspace_id=NEW.workspace_id AND referral_id=ref.id AND action='ShortfallPropose' ORDER BY sequence DESC LIMIT 1;
  IF NEW.predecessor_id IS DISTINCT FROM prev OR NEW.created_by<>ref.owner_id OR NEW.owner_id<>ref.owner_id THEN RAISE EXCEPTION 'Owned proposal with exact predecessor required' USING ERRCODE='23514'; END IF;
  IF EXISTS(SELECT 1 FROM ppo.quote_supply_shortfall_events p WHERE p.workspace_id=NEW.workspace_id AND p.target_id<>NEW.target_id AND p.action='ShortfallPropose' AND p.command->>'supply_id'=NEW.command->>'supply_id'
   AND p.id=(SELECT id FROM ppo.quote_supply_shortfall_events WHERE workspace_id=p.workspace_id AND referral_id=p.referral_id AND action='ShortfallPropose' ORDER BY sequence DESC LIMIT 1)
   AND p.referral_id=(SELECT id FROM ppo.quote_supply_events WHERE workspace_id=p.workspace_id AND target_id=p.target_id AND action='Refer' ORDER BY sequence DESC LIMIT 1)
   AND 'Accepted'=(SELECT decision FROM ppo.quote_supply_events WHERE workspace_id=p.workspace_id AND referral_id=p.referral_id AND action='Receive' ORDER BY sequence DESC LIMIT 1)
   AND NOT EXISTS(SELECT 1 FROM ppo.quote_supply_events WHERE workspace_id=p.workspace_id AND allocation_proposal_id=p.id AND action='Apply')) THEN RAISE EXCEPTION 'Another accepted referral owns this allocation set' USING ERRCODE='23514'; END IF;
 ELSE
  SELECT * INTO STRICT prop FROM ppo.quote_supply_shortfall_events WHERE workspace_id=NEW.workspace_id AND referral_id=ref.id AND action='ShortfallPropose' ORDER BY sequence DESC LIMIT 1;
  SELECT id INTO prev FROM ppo.quote_supply_shortfall_events WHERE workspace_id=NEW.workspace_id AND proposal_id=prop.id AND demand_id=NEW.demand_id AND action='ShortfallReceive' ORDER BY sequence DESC LIMIT 1;
  SELECT * INTO STRICT d FROM ppo.supply_records WHERE workspace_id=NEW.workspace_id AND id=NEW.demand_id;
  IF NEW.proposal_id<>prop.id OR NEW.predecessor_id IS DISTINCT FROM prev OR NEW.created_by<>d.owner_id OR NEW.owner_id<>d.owner_id OR NEW.command IS DISTINCT FROM prop.command OR NEW.proposal_hash<>prop.proposal_hash OR NEW.basis IS DISTINCT FROM prop.basis OR NEW.dependencies IS DISTINCT FROM prop.dependencies
   OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(ppo.shortfall_changes(prop.command)) x WHERE x->>'demand_id'=d.id::text)
   OR EXISTS(SELECT 1 FROM ppo.quote_supply_events WHERE workspace_id=NEW.workspace_id AND allocation_proposal_id=prop.id AND action='Apply') THEN RAISE EXCEPTION 'Independent current owner must receive the exact unapplied allocation proposal' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER quote_shortfall_guard BEFORE INSERT ON ppo.quote_supply_shortfall_events FOR EACH ROW EXECUTE FUNCTION ppo.quote_shortfall_guard();

CREATE FUNCTION ppo.quote_shortfall_review_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE prop ppo.quote_supply_shortfall_events; recv ppo.quote_supply_shortfall_events; prior ppo.quote_supply_events; x jsonb; ids jsonb='[]';
BEGIN
 IF NEW.decision<>'ReduceAllocations' THEN RETURN NEW; END IF;
 SELECT * INTO STRICT prop FROM ppo.quote_supply_shortfall_events WHERE workspace_id=NEW.workspace_id AND referral_id=NEW.referral_id AND action='ShortfallPropose' ORDER BY sequence DESC LIMIT 1;
 IF prop.id<>NEW.allocation_proposal_id OR prop.receiving_id<>NEW.receiving_id OR prop.command IS DISTINCT FROM NEW.command THEN RAISE EXCEPTION 'Exact latest proposal and acceptance required' USING ERRCODE='23514'; END IF;
 PERFORM ppo.shortfall_position(NEW.workspace_id,prop.dependencies,NEW.command,NEW.action='Apply',NEW.created_by);
 FOR x IN SELECT value FROM jsonb_array_elements(prop.dependencies->'group'->'demands') LOOP
  IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(ppo.shortfall_changes(prop.command)) c WHERE c->>'demand_id'=x->'record'->>'id') THEN CONTINUE; END IF;
  SELECT * INTO STRICT recv FROM ppo.quote_supply_shortfall_events WHERE workspace_id=NEW.workspace_id AND proposal_id=prop.id AND demand_id=(x->'record'->>'id')::uuid AND action='ShortfallReceive' ORDER BY sequence DESC LIMIT 1;
  IF recv.decision<>'Accepted' OR recv.created_by<>(x->'record'->>'owner_id')::uuid OR recv.dependencies IS DISTINCT FROM prop.dependencies THEN RAISE EXCEPTION 'Every changed Demand must independently accept the exact proposal' USING ERRCODE='23514'; END IF;
  ids=ids||jsonb_build_array(recv.id);
 END LOOP;
 IF ids IS DISTINCT FROM NEW.effect_receiving_ids THEN RAISE EXCEPTION 'Freeze exact independently received allocation effects' USING ERRCODE='23514'; END IF;
 IF NEW.action='Review' AND NEW.basis IS DISTINCT FROM prop.basis THEN RAISE EXCEPTION 'Review current exact proposal basis' USING ERRCODE='23514'; END IF;
 IF NEW.action='Apply' THEN
  SELECT * INTO STRICT prior FROM ppo.quote_supply_events WHERE workspace_id=NEW.workspace_id AND id=NEW.review_id;
  IF prior.allocation_proposal_id<>prop.id OR prior.effect_receiving_ids IS DISTINCT FROM ids THEN RAISE EXCEPTION 'Apply only the independently received immutable review' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER quote_shortfall_review_guard BEFORE INSERT ON ppo.quote_supply_events FOR EACH ROW EXECUTE FUNCTION ppo.quote_shortfall_review_guard();
CREATE FUNCTION ppo.quote_shortfall_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM ppo.operation_receipts r JOIN ppo.audit_events a ON (a.workspace_id,a.actor_id,a.operation_id)=(r.workspace_id,r.actor_id,r.operation_id) JOIN ppo.outbox_jobs j ON (j.workspace_id,j.actor_id,j.operation_id)=(r.workspace_id,r.actor_id,r.operation_id)
  WHERE r.workspace_id=NEW.workspace_id AND r.actor_id=NEW.created_by AND r.operation_id=NEW.operation_id AND r.record_id=NEW.revision_id AND (r.result->>'record_version')::integer=NEW.sequence AND a.details->>'shortfall_event_id'=NEW.id::text AND a.details->>'command'='QuoteSupply:'||NEW.action AND a.reason=NEW.reason AND j.kind='QuotationSupplyRecorded')
 THEN RAISE EXCEPTION 'Allocation proposal and receiving require atomic original receipts audit and outbox' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER quote_shortfall_evidence AFTER INSERT ON ppo.quote_supply_shortfall_events DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.quote_shortfall_evidence();

CREATE FUNCTION ppo.quote_shortfall_native_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE x jsonb; native_name text; native_target uuid;
BEGIN
 IF NEW.action<>'Apply' OR NEW.decision<>'ReduceAllocations' THEN RETURN NEW; END IF;
 native_name=CASE WHEN NEW.command ? 'changes' THEN 'Supply:ReduceAllocations' ELSE 'Supply:Allocate' END;
 native_target=CASE WHEN NEW.command ? 'changes' THEN (NEW.command->>'supply_id')::uuid ELSE (NEW.command->>'demand_id')::uuid END;
 IF NOT EXISTS(SELECT 1 FROM ppo.operation_receipts r JOIN ppo.audit_events a ON (a.workspace_id,a.actor_id,a.operation_id)=(r.workspace_id,r.actor_id,r.operation_id) JOIN ppo.outbox_jobs j ON (j.workspace_id,j.actor_id,j.operation_id)=(r.workspace_id,r.actor_id,r.operation_id)
  WHERE r.workspace_id=NEW.workspace_id AND r.actor_id=NEW.created_by AND r.operation_id=(NEW.command->>'operation_id')::uuid AND r.record_id=native_target AND r.result=NEW.native_receipt AND a.details->>'command'=native_name AND a.details->>'supply_review_id'=NEW.review_id::text AND a.details->>'supply_outcome_id'=NEW.id::text AND j.kind='SupplyRecorded') THEN RAISE EXCEPTION 'Native allocation receipt audit and outcome must commit together' USING ERRCODE='23514'; END IF;
 FOR x IN SELECT value FROM jsonb_array_elements(ppo.shortfall_changes(NEW.command)) LOOP
  IF NOT EXISTS(SELECT 1 FROM ppo.supply_allocation_history h JOIN ppo.supply_revisions d ON d.workspace_id=h.workspace_id AND d.record_id=(x->>'demand_id')::uuid AND d.version=(x->>'demand_version')::integer+1 WHERE h.workspace_id=NEW.workspace_id AND h.allocation_id=(x->>'id')::uuid AND h.version=(x->>'expected_version')::integer+1 AND h.xmin::text::bigint=mod(pg_current_xact_id()::text::numeric,4294967296) AND d.xmin::text::bigint=mod(pg_current_xact_id()::text::numeric,4294967296)) THEN RAISE EXCEPTION 'Every allocation and Demand history must commit with original receipt' USING ERRCODE='23514'; END IF;
 END LOOP;
 RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER quote_shortfall_native_evidence AFTER INSERT ON ppo.quote_supply_events DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.quote_shortfall_native_evidence();

CREATE OR REPLACE FUNCTION ppo.quote_supply_operation_reservation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF (EXISTS(SELECT 1 FROM ppo.quote_supply_events e WHERE e.workspace_id=NEW.workspace_id AND e.action='Review' AND e.command->>'operation_id'=NEW.operation_id::text)
  OR EXISTS(SELECT 1 FROM ppo.quote_supply_receipt_events e WHERE e.workspace_id=NEW.workspace_id AND e.action='ReceiptPropose' AND e.command->>'operation_id'=NEW.operation_id::text)
  OR EXISTS(SELECT 1 FROM ppo.quote_supply_shortfall_events e WHERE e.workspace_id=NEW.workspace_id AND e.action='ShortfallPropose' AND e.command->>'operation_id'=NEW.operation_id::text))
 AND NOT EXISTS(SELECT 1 FROM ppo.quote_supply_events e WHERE e.workspace_id=NEW.workspace_id AND e.action='Apply' AND e.command->>'operation_id'=NEW.operation_id::text AND e.created_by=NEW.actor_id
  AND CASE WHEN e.command ? 'record_id' THEN (e.command->>'record_id')::uuid WHEN e.command ? 'changes' THEN (e.command->>'supply_id')::uuid ELSE coalesce((e.command->>'demand_id')::uuid,e.target_id) END=NEW.record_id AND e.native_receipt=NEW.result)
 THEN RAISE EXCEPTION 'Reserved Supply operation requires its exact applied review and native outcome' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
