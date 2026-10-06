-- SYN-ES07-05: one existing native Receipt correction and independently received effects.
-- No seeds, grants, identities, retained evidence or installed migration bytes change.
CREATE TABLE ppo.quote_supply_receipt_events (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, revision_id uuid NOT NULL, execution_id uuid NOT NULL, target_id uuid NOT NULL,
 sequence integer NOT NULL CHECK(sequence>0), action text NOT NULL CHECK(action IN ('ReceiptPropose','ReceiptReceive')),
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
 FOREIGN KEY(workspace_id,target_id,proposal_id) REFERENCES ppo.quote_supply_receipt_events(workspace_id,target_id,id) DEFERRABLE INITIALLY DEFERRED,
 FOREIGN KEY(workspace_id,target_id,predecessor_id) REFERENCES ppo.quote_supply_receipt_events(workspace_id,target_id,id),
 FOREIGN KEY(workspace_id,demand_id) REFERENCES ppo.supply_records(workspace_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id), FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 CHECK((action='ReceiptPropose' AND decision='Proposed' AND proposal_id=id AND demand_id IS NULL) OR (action='ReceiptReceive' AND decision IN ('Accepted','Returned','Held') AND demand_id IS NOT NULL))
);
CREATE UNIQUE INDEX quote_receipt_reserved_operation ON ppo.quote_supply_receipt_events(workspace_id,(command->>'operation_id')) WHERE action='ReceiptPropose';
CREATE TRIGGER immutable_quote_receipt BEFORE UPDATE OR DELETE ON ppo.quote_supply_receipt_events FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

ALTER TABLE ppo.quote_supply_events
 ADD COLUMN receipt_proposal_id uuid,
 ADD COLUMN effect_receiving_ids jsonb NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(effect_receiving_ids)='array'),
 ADD FOREIGN KEY(workspace_id,target_id,receipt_proposal_id) REFERENCES ppo.quote_supply_receipt_events(workspace_id,target_id,id),
 DROP CONSTRAINT quote_supply_events_decision_check,
 DROP CONSTRAINT quote_supply_events_check4,
 DROP CONSTRAINT quote_supply_events_check5,
 DROP CONSTRAINT quote_supply_events_check6,
 ADD CONSTRAINT quote_supply_events_decision_check CHECK(decision IN ('Requested','Accepted','Returned','Held','Retain','Hold','AdjustAllocation','ReconcileReservationOutcome','CorrectReceipt')),
 ADD CONSTRAINT quote_supply_events_check4 CHECK((decision IN ('AdjustAllocation','ReconcileReservationOutcome','CorrectReceipt'))=(command IS NOT NULL)),
 ADD CONSTRAINT quote_supply_events_check5 CHECK((action='Apply' AND decision IN ('AdjustAllocation','ReconcileReservationOutcome','CorrectReceipt'))=(native_receipt IS NOT NULL)),
 ADD CONSTRAINT quote_supply_events_check6 CHECK((action='Refer' AND decision='Requested' AND referral_id=id) OR (action='Receive' AND decision IN ('Accepted','Returned','Held')) OR (action IN ('Review','Apply') AND decision IN ('Retain','Hold','AdjustAllocation','ReconcileReservationOutcome','CorrectReceipt'))),
 ADD CHECK((decision='CorrectReceipt')=(receipt_proposal_id IS NOT NULL)),
 ADD CHECK(decision='CorrectReceipt' OR effect_receiving_ids='[]'::jsonb);
-- Earlier command families keep their original reservation uniqueness. A Receipt
-- proposal may have corrected reviews before its one application, all same command.
DROP INDEX ppo.quote_supply_native_once;
CREATE UNIQUE INDEX quote_supply_native_once ON ppo.quote_supply_events(workspace_id,(command->>'operation_id')) WHERE action='Review' AND command IS NOT NULL AND decision<>'CorrectReceipt';
CREATE UNIQUE INDEX quote_receipt_apply_once ON ppo.quote_supply_events(workspace_id,receipt_proposal_id) WHERE action='Apply' AND decision='CorrectReceipt';

CREATE FUNCTION ppo.quote_receipt_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE ref ppo.quote_supply_events; recv ppo.quote_supply_events; prop ppo.quote_supply_receipt_events; prev uuid;
 target ppo.quote_conversion_targets; supply ppo.supply_records; fact ppo.supply_facts; d ppo.supply_records; cmd jsonb; seq integer; x jsonb;
BEGIN
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 SELECT * INTO STRICT target FROM ppo.quote_conversion_targets WHERE workspace_id=NEW.workspace_id AND target_id=NEW.target_id;
 SELECT * INTO STRICT ref FROM ppo.quote_supply_events WHERE workspace_id=NEW.workspace_id AND target_id=NEW.target_id AND action='Refer' ORDER BY sequence DESC LIMIT 1;
 SELECT * INTO STRICT recv FROM ppo.quote_supply_events WHERE workspace_id=NEW.workspace_id AND referral_id=ref.id AND action='Receive' ORDER BY sequence DESC LIMIT 1;
 SELECT coalesce(max(sequence),0) INTO seq FROM ppo.quote_supply_receipt_events WHERE workspace_id=NEW.workspace_id AND target_id=NEW.target_id;
 IF NEW.sequence<>seq+1 OR NEW.referral_id<>ref.id OR NEW.receiving_id<>recv.id OR recv.decision<>'Accepted' OR NEW.execution_id<>target.execution_id OR NEW.revision_id<>target.revision_id
 THEN RAISE EXCEPTION 'Exact accepted referral, completed conversion and next Receipt sequence required' USING ERRCODE='23514'; END IF;
 cmd=NEW.command;
 SELECT * INTO STRICT supply FROM ppo.supply_records WHERE workspace_id=NEW.workspace_id AND id=(cmd->>'record_id')::uuid;
 SELECT * INTO STRICT fact FROM ppo.supply_current_facts WHERE workspace_id=NEW.workspace_id AND record_id=supply.id AND id=(cmd->>'predecessor_id')::uuid;
 IF supply.kind<>'Supply' OR fact.kind<>'Receipt' OR cmd->>'kind' IS DISTINCT FROM 'Receipt' OR (cmd->>'expected_version')::integer IS DISTINCT FROM supply.version
 OR cmd->>'attachment_id' IS DISTINCT FROM fact.attachment_id::text OR cmd->>'id' IS NULL OR cmd->>'operation_id' IS NULL
 OR NOT EXISTS(SELECT 1 FROM ppo.supply_allocations WHERE workspace_id=NEW.workspace_id AND demand_id=NEW.target_id AND supply_id=supply.id)
 OR NEW.dependencies->'group'->'supply' IS DISTINCT FROM (to_jsonb(supply)||jsonb_build_object('quantity',supply.quantity::text))
 OR EXISTS(SELECT 1 FROM ppo.supply_current_facts WHERE workspace_id=NEW.workspace_id AND record_id=supply.id AND kind='ExternalOutcome' AND data->>'state'='Unknown')
 THEN RAISE EXCEPTION 'Current original Receipt and exact native Supply basis required' USING ERRCODE='23514'; END IF;
 -- Record all allocated demands, even zero links, with exact owner/version/quantity.
 IF (SELECT count(DISTINCT demand_id) FROM ppo.supply_allocations WHERE workspace_id=NEW.workspace_id AND supply_id=supply.id)<>jsonb_array_length(NEW.dependencies->'group'->'demands') THEN RAISE EXCEPTION 'Complete affected Demand set required' USING ERRCODE='23514'; END IF;
 FOR x IN SELECT value FROM jsonb_array_elements(NEW.dependencies->'group'->'demands') LOOP
  SELECT * INTO STRICT d FROM ppo.supply_records WHERE workspace_id=NEW.workspace_id AND id=(x->'record'->>'id')::uuid;
  IF x->'record' IS DISTINCT FROM (to_jsonb(d)||jsonb_build_object('quantity',d.quantity::text)) OR NOT EXISTS(SELECT 1 FROM ppo.supply_allocations WHERE workspace_id=NEW.workspace_id AND supply_id=supply.id AND demand_id=d.id) THEN RAISE EXCEPTION 'Exact affected Demand owner and version required' USING ERRCODE='23514'; END IF;
 END LOOP;
 IF NEW.action='ReceiptPropose' THEN
  SELECT id INTO prev FROM ppo.quote_supply_receipt_events WHERE workspace_id=NEW.workspace_id AND referral_id=ref.id AND action='ReceiptPropose' ORDER BY sequence DESC LIMIT 1;
  IF NEW.predecessor_id IS DISTINCT FROM prev OR NEW.created_by<>ref.owner_id OR NEW.owner_id<>ref.owner_id THEN RAISE EXCEPTION 'Owned proposal with exact predecessor required' USING ERRCODE='23514'; END IF;
  IF EXISTS(SELECT 1 FROM ppo.quote_supply_receipt_events p WHERE p.workspace_id=NEW.workspace_id AND p.target_id<>NEW.target_id AND p.action='ReceiptPropose' AND p.command->>'predecessor_id'=fact.id::text
   AND p.id=(SELECT id FROM ppo.quote_supply_receipt_events WHERE workspace_id=p.workspace_id AND target_id=p.target_id AND action='ReceiptPropose' ORDER BY sequence DESC LIMIT 1)
   AND p.referral_id=(SELECT id FROM ppo.quote_supply_events WHERE workspace_id=p.workspace_id AND target_id=p.target_id AND action='Refer' ORDER BY sequence DESC LIMIT 1)
   AND 'Accepted'=(SELECT decision FROM ppo.quote_supply_events WHERE workspace_id=p.workspace_id AND referral_id=p.referral_id AND action='Receive' ORDER BY sequence DESC LIMIT 1)
   AND NOT EXISTS(SELECT 1 FROM ppo.quote_supply_events a WHERE a.workspace_id=p.workspace_id AND a.receipt_proposal_id=p.id AND a.action='Apply'))
  THEN RAISE EXCEPTION 'Another accepted referral owns original Receipt correction' USING ERRCODE='23514'; END IF;
 ELSE
  SELECT * INTO STRICT prop FROM ppo.quote_supply_receipt_events WHERE workspace_id=NEW.workspace_id AND referral_id=ref.id AND action='ReceiptPropose' ORDER BY sequence DESC LIMIT 1;
  SELECT id INTO prev FROM ppo.quote_supply_receipt_events WHERE workspace_id=NEW.workspace_id AND proposal_id=prop.id AND demand_id=NEW.demand_id AND action='ReceiptReceive' ORDER BY sequence DESC LIMIT 1;
  SELECT * INTO STRICT d FROM ppo.supply_records WHERE workspace_id=NEW.workspace_id AND id=NEW.demand_id;
  IF NEW.proposal_id<>prop.id OR NEW.predecessor_id IS DISTINCT FROM prev OR NEW.created_by<>d.owner_id OR NEW.owner_id<>d.owner_id
   OR NEW.command IS DISTINCT FROM prop.command OR NEW.proposal_hash<>prop.proposal_hash OR NEW.basis IS DISTINCT FROM prop.basis OR NEW.dependencies IS DISTINCT FROM prop.dependencies
   OR NOT EXISTS(SELECT 1 FROM ppo.supply_allocations WHERE workspace_id=NEW.workspace_id AND supply_id=supply.id AND demand_id=d.id)
  THEN RAISE EXCEPTION 'Independent current Demand owner must receive exact unchanged proposal' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER quote_receipt_guard BEFORE INSERT ON ppo.quote_supply_receipt_events FOR EACH ROW EXECUTE FUNCTION ppo.quote_receipt_guard();

CREATE FUNCTION ppo.quote_receipt_review_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE prop ppo.quote_supply_receipt_events; recv ppo.quote_supply_receipt_events; prior ppo.quote_supply_events;
 x jsonb; ids jsonb='[]'; d ppo.supply_records; f ppo.supply_facts; s ppo.supply_records;
BEGIN
 IF NEW.decision<>'CorrectReceipt' THEN RETURN NEW; END IF;
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 SELECT * INTO STRICT prop FROM ppo.quote_supply_receipt_events WHERE workspace_id=NEW.workspace_id AND referral_id=NEW.referral_id AND action='ReceiptPropose' ORDER BY sequence DESC LIMIT 1;
 IF prop.id<>NEW.receipt_proposal_id OR prop.receiving_id<>NEW.receiving_id OR NEW.command IS DISTINCT FROM prop.command THEN RAISE EXCEPTION 'Exact latest Receipt proposal and referral acceptance required' USING ERRCODE='23514'; END IF;
 FOR x IN SELECT value FROM jsonb_array_elements(prop.dependencies->'group'->'demands') LOOP
  SELECT * INTO STRICT recv FROM ppo.quote_supply_receipt_events WHERE workspace_id=NEW.workspace_id AND proposal_id=prop.id AND demand_id=(x->'record'->>'id')::uuid AND action='ReceiptReceive' ORDER BY sequence DESC LIMIT 1;
  SELECT * INTO STRICT d FROM ppo.supply_records WHERE workspace_id=NEW.workspace_id AND id=recv.demand_id;
  IF recv.decision<>'Accepted' OR recv.created_by<>d.owner_id OR recv.basis IS DISTINCT FROM prop.basis OR recv.dependencies IS DISTINCT FROM prop.dependencies THEN RAISE EXCEPTION 'Exact independently accepted affected Demand required' USING ERRCODE='23514'; END IF;
  ids=ids||jsonb_build_array(recv.id);
  IF NEW.action='Review' AND (x->'record' IS DISTINCT FROM (to_jsonb(d)||jsonb_build_object('quantity',d.quantity::text))) THEN RAISE EXCEPTION 'Affected Demand changed before review' USING ERRCODE='23514'; END IF;
  IF NEW.action='Apply' AND ((x->'record'->>'version')::integer<>d.version-1 OR ((x->'record')-'version'-'updated_at'-'updated_by'-'last_reason') IS DISTINCT FROM ((to_jsonb(d)||jsonb_build_object('quantity',d.quantity::text))-'version'-'updated_at'-'updated_by'-'last_reason')
   OR d.updated_by<>NEW.created_by OR d.last_reason IS DISTINCT FROM NEW.command->>'reason'
   OR NOT EXISTS(SELECT 1 FROM ppo.supply_facts i WHERE i.workspace_id=NEW.workspace_id AND i.record_id=d.id AND i.kind='Impact' AND i.version=d.version AND i.data->>'state'='Requested' AND i.activity_id IS NOT NULL AND i.xmin::text::bigint=mod(pg_current_xact_id()::text::numeric,4294967296))) THEN RAISE EXCEPTION 'Native correction must retain affected Demand content and append owned Impact' USING ERRCODE='23514'; END IF;
 END LOOP;
 IF ids IS DISTINCT FROM NEW.effect_receiving_ids THEN RAISE EXCEPTION 'Freeze every exact affected-demand acceptance' USING ERRCODE='23514'; END IF;
 SELECT * INTO STRICT s FROM ppo.supply_records WHERE workspace_id=NEW.workspace_id AND id=(NEW.command->>'record_id')::uuid;
 IF NEW.action='Review' THEN
  IF NEW.basis IS DISTINCT FROM prop.basis OR (NEW.command->>'expected_version')::integer<>s.version OR NOT EXISTS(SELECT 1 FROM ppo.supply_current_facts WHERE workspace_id=NEW.workspace_id AND record_id=s.id AND id=(NEW.command->>'predecessor_id')::uuid) THEN RAISE EXCEPTION 'Review current Receipt and exact original position' USING ERRCODE='23514'; END IF;
 ELSE
  SELECT * INTO STRICT prior FROM ppo.quote_supply_events WHERE workspace_id=NEW.workspace_id AND id=NEW.review_id;
  SELECT * INTO STRICT f FROM ppo.supply_current_facts WHERE workspace_id=NEW.workspace_id AND id=(NEW.command->>'id')::uuid;
  IF prior.receipt_proposal_id<>prop.id OR prior.effect_receiving_ids IS DISTINCT FROM ids OR (NEW.command->>'expected_version')::integer<>s.version-1
   OR f.record_id<>s.id OR f.version<>s.version OR f.kind<>'Receipt' OR f.predecessor_id IS DISTINCT FROM (NEW.command->>'predecessor_id')::uuid
   OR f.data IS DISTINCT FROM NEW.command->'data' OR f.completeness IS DISTINCT FROM NEW.command->>'completeness' OR f.evidence IS DISTINCT FROM NEW.command->>'evidence'
   OR f.observed_at IS DISTINCT FROM (NEW.command->>'observed_at')::timestamptz OR f.attachment_id IS DISTINCT FROM (NEW.command->>'attachment_id')::uuid OR f.created_by<>NEW.created_by
  THEN RAISE EXCEPTION 'Apply exact native Receipt successor and received effects once' USING ERRCODE='23514'; END IF;
  FOR x IN SELECT value FROM jsonb_array_elements(prop.dependencies->'group'->'allocations') LOOP
   IF NOT EXISTS(SELECT 1 FROM ppo.supply_allocations a WHERE a.workspace_id=NEW.workspace_id AND a.id=(x->>'id')::uuid AND (to_jsonb(a)||jsonb_build_object('quantity',a.quantity::text))=x) THEN RAISE EXCEPTION 'Receipt correction cannot change allocations' USING ERRCODE='23514'; END IF;
  END LOOP;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER quote_receipt_review_guard BEFORE INSERT ON ppo.quote_supply_events FOR EACH ROW EXECUTE FUNCTION ppo.quote_receipt_review_guard();

CREATE FUNCTION ppo.quote_receipt_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM ppo.operation_receipts r JOIN ppo.audit_events a ON (a.workspace_id,a.actor_id,a.operation_id)=(r.workspace_id,r.actor_id,r.operation_id) JOIN ppo.outbox_jobs j ON (j.workspace_id,j.actor_id,j.operation_id)=(r.workspace_id,r.actor_id,r.operation_id)
  WHERE r.workspace_id=NEW.workspace_id AND r.actor_id=NEW.created_by AND r.operation_id=NEW.operation_id AND r.record_id=NEW.revision_id AND (r.result->>'record_version')::integer=NEW.sequence AND a.details->>'receipt_event_id'=NEW.id::text AND a.details->>'command'='QuoteSupply:'||NEW.action AND a.reason=NEW.reason AND j.kind='QuotationSupplyRecorded')
 THEN RAISE EXCEPTION 'Receipt proposal and receiving require atomic original receipts audit and outbox' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER quote_receipt_evidence AFTER INSERT ON ppo.quote_supply_receipt_events DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.quote_receipt_evidence();

CREATE FUNCTION ppo.quote_receipt_native_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.action='Apply' AND NEW.decision='CorrectReceipt' AND NOT EXISTS(
  SELECT 1 FROM ppo.operation_receipts r JOIN ppo.audit_events a ON (a.workspace_id,a.actor_id,a.operation_id)=(r.workspace_id,r.actor_id,r.operation_id) JOIN ppo.outbox_jobs j ON (j.workspace_id,j.actor_id,j.operation_id)=(r.workspace_id,r.actor_id,r.operation_id)
  JOIN ppo.supply_facts f ON f.workspace_id=r.workspace_id AND f.id=(NEW.command->>'id')::uuid
  JOIN ppo.supply_revisions h ON h.workspace_id=r.workspace_id AND h.record_id=f.record_id AND h.version=f.version
  WHERE r.workspace_id=NEW.workspace_id AND r.actor_id=NEW.created_by AND r.operation_id=(NEW.command->>'operation_id')::uuid AND r.record_id=f.record_id AND r.result=NEW.native_receipt
   AND a.details->>'command'='Supply:Fact:Receipt' AND a.details->>'fact_id'=f.id::text AND a.details->>'supply_review_id'=NEW.review_id::text AND a.details->>'supply_outcome_id'=NEW.id::text AND j.kind='SupplyRecorded'
   AND f.xmin::text::bigint=mod(pg_current_xact_id()::text::numeric,4294967296) AND h.xmin::text::bigint=mod(pg_current_xact_id()::text::numeric,4294967296))
 THEN RAISE EXCEPTION 'Native Receipt successor history and original receipt must commit with outcome' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER quote_receipt_native_evidence AFTER INSERT ON ppo.quote_supply_events DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.quote_receipt_native_evidence();

CREATE OR REPLACE FUNCTION ppo.quote_supply_operation_reservation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF (EXISTS(SELECT 1 FROM ppo.quote_supply_events e WHERE e.workspace_id=NEW.workspace_id AND e.action='Review' AND e.command->>'operation_id'=NEW.operation_id::text)
  OR EXISTS(SELECT 1 FROM ppo.quote_supply_receipt_events e WHERE e.workspace_id=NEW.workspace_id AND e.action='ReceiptPropose' AND e.command->>'operation_id'=NEW.operation_id::text))
 AND NOT EXISTS(SELECT 1 FROM ppo.quote_supply_events e WHERE e.workspace_id=NEW.workspace_id AND e.action='Apply' AND e.command->>'operation_id'=NEW.operation_id::text AND e.created_by=NEW.actor_id AND coalesce((e.command->>'record_id')::uuid,e.target_id)=NEW.record_id AND e.native_receipt=NEW.result)
 THEN RAISE EXCEPTION 'Reserved Supply operation requires its exact applied review and native outcome' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
