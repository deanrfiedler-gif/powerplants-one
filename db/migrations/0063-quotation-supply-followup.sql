-- SYN-ES07-03. Subordinate immutable receiving, review and native Supply outcomes.
-- No identities, grants, seeds or issued output are rewritten.
DO $$ DECLARE definition text; BEGIN
 SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid='ppo.outbox_jobs'::regclass AND conname='ck_outbox_kind';
 ALTER TABLE ppo.outbox_jobs DROP CONSTRAINT ck_outbox_kind;
 EXECUTE format('ALTER TABLE ppo.outbox_jobs ADD CONSTRAINT ck_outbox_kind CHECK ((%s) OR kind = ''QuotationSupplyRecorded'')',substring(definition from 8 for length(definition)-8));
END $$;
CREATE TABLE ppo.quote_supply_events (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,revision_id uuid NOT NULL,execution_id uuid NOT NULL,target_id uuid NOT NULL,
 sequence integer NOT NULL CHECK(sequence>0),action text NOT NULL CHECK(action IN ('Refer','Receive','Review','Apply')),
 referral_id uuid NOT NULL,predecessor_id uuid,receiving_id uuid,review_id uuid,
 decision text NOT NULL CHECK(decision IN ('Requested','Accepted','Returned','Held','Retain','Hold','AdjustAllocation')),
 basis jsonb NOT NULL CHECK(jsonb_typeof(basis)='object'),basis_hash text NOT NULL CHECK(basis_hash ~ '^[a-f0-9]{64}$'),
 review_hash text CHECK(review_hash ~ '^[a-f0-9]{64}$'),command jsonb CHECK(command IS NULL OR jsonb_typeof(command)='object'),
 owner_id uuid NOT NULL,due_date date,date_needed boolean NOT NULL,next_action text NOT NULL CHECK(length(btrim(next_action)) BETWEEN 1 AND 1000),
 activity_id uuid NOT NULL,reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),evidence text NOT NULL CHECK(length(btrim(evidence)) BETWEEN 1 AND 4000),
 created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),operation_id uuid NOT NULL,native_receipt jsonb,
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,target_id,id),UNIQUE(workspace_id,target_id,sequence),UNIQUE(workspace_id,created_by,operation_id),
 FOREIGN KEY(workspace_id,target_id) REFERENCES ppo.quote_conversion_targets(workspace_id,target_id),
 FOREIGN KEY(workspace_id,revision_id,execution_id) REFERENCES ppo.quote_conversion_events(workspace_id,revision_id,id),
 FOREIGN KEY(workspace_id,target_id,referral_id) REFERENCES ppo.quote_supply_events(workspace_id,target_id,id) DEFERRABLE INITIALLY DEFERRED,
 FOREIGN KEY(workspace_id,target_id,predecessor_id) REFERENCES ppo.quote_supply_events(workspace_id,target_id,id),
 FOREIGN KEY(workspace_id,target_id,receiving_id) REFERENCES ppo.quote_supply_events(workspace_id,target_id,id),
 FOREIGN KEY(workspace_id,target_id,review_id) REFERENCES ppo.quote_supply_events(workspace_id,target_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,activity_id) REFERENCES ppo.activities(workspace_id,id),
 CHECK(date_needed=(due_date IS NULL)),CHECK((action='Apply')=(review_id IS NOT NULL)),
 CHECK((action IN ('Review','Apply'))=(receiving_id IS NOT NULL)),CHECK((action IN ('Review','Apply'))=(review_hash IS NOT NULL)),
 CHECK((decision='AdjustAllocation')=(command IS NOT NULL)),CHECK((action='Apply' AND decision='AdjustAllocation')=(native_receipt IS NOT NULL)),
 CHECK((action='Refer' AND decision='Requested' AND referral_id=id) OR (action='Receive' AND decision IN ('Accepted','Returned','Held')) OR (action IN ('Review','Apply') AND decision IN ('Retain','Hold','AdjustAllocation')))
);
CREATE UNIQUE INDEX quote_supply_apply_once ON ppo.quote_supply_events(workspace_id,review_id) WHERE action='Apply';
CREATE UNIQUE INDEX quote_supply_native_once ON ppo.quote_supply_events(workspace_id,(command->>'operation_id')) WHERE action='Review' AND command IS NOT NULL;
CREATE TRIGGER immutable_quote_supply BEFORE UPDATE OR DELETE ON ppo.quote_supply_events FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.quote_supply_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE t ppo.quote_conversion_targets; e ppo.quote_conversion_events; s ppo.supply_records; a ppo.supply_allocations;
 ref ppo.quote_supply_events; recv ppo.quote_supply_events; rev ppo.quote_supply_events; prev ppo.quote_supply_events;
 seq integer; b jsonb; cmd jsonb; sid uuid; latest_id uuid;
BEGIN
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 SELECT * INTO STRICT t FROM ppo.quote_conversion_targets WHERE workspace_id=NEW.workspace_id AND target_id=NEW.target_id;
 SELECT * INTO STRICT e FROM ppo.quote_conversion_events WHERE workspace_id=NEW.workspace_id AND id=t.execution_id;
 SELECT * INTO STRICT s FROM ppo.supply_records WHERE workspace_id=NEW.workspace_id AND id=NEW.target_id;
 b=NEW.basis->'conversion';cmd=NEW.command;
 IF NEW.execution_id<>t.execution_id OR NEW.revision_id<>t.revision_id OR e.action<>'Execute' OR NEW.basis->>'policy' IS DISTINCT FROM 'SYN-ES07-03' OR b->>'execution_id' IS DISTINCT FROM e.id::text OR b->>'plan_id' IS DISTINCT FROM t.plan_id::text OR b->>'line_id' IS DISTINCT FROM t.line_id::text OR b->>'output_hash' IS DISTINCT FROM e.output_hash OR b->'target' IS DISTINCT FROM (to_jsonb(s)||jsonb_build_object('quantity',s.quantity::text)) THEN RAISE EXCEPTION 'Exact completed conversion and current target required' USING ERRCODE='23514'; END IF;
 SELECT id INTO latest_id FROM ppo.quote_release_events WHERE workspace_id=NEW.workspace_id AND quote_id=t.quote_id AND action='Issue' ORDER BY sequence DESC LIMIT 1;
 IF b->'source'->>'issue_id' IS DISTINCT FROM latest_id::text THEN RAISE EXCEPTION 'Current issue required' USING ERRCODE='23514'; END IF;
 SELECT id INTO latest_id FROM ppo.quote_response_events WHERE workspace_id=NEW.workspace_id AND revision_id=t.revision_id AND action IN ('Record','Correct') ORDER BY sequence DESC LIMIT 1;
 IF b->'source'->>'response_id' IS DISTINCT FROM latest_id::text THEN RAISE EXCEPTION 'Current response required' USING ERRCODE='23514'; END IF;
 SELECT coalesce(max(sequence),0) INTO seq FROM ppo.quote_supply_events WHERE workspace_id=NEW.workspace_id AND target_id=NEW.target_id;
 IF NEW.sequence<>seq+1 THEN RAISE EXCEPTION 'Exact next target follow-up sequence required' USING ERRCODE='23514'; END IF;
 SELECT * INTO ref FROM ppo.quote_supply_events WHERE workspace_id=NEW.workspace_id AND target_id=NEW.target_id AND action='Refer' ORDER BY sequence DESC LIMIT 1;
 SELECT * INTO recv FROM ppo.quote_supply_events WHERE workspace_id=NEW.workspace_id AND referral_id=ref.id AND action='Receive' ORDER BY sequence DESC LIMIT 1;
 SELECT * INTO rev FROM ppo.quote_supply_events WHERE workspace_id=NEW.workspace_id AND referral_id=ref.id AND action='Review' ORDER BY sequence DESC LIMIT 1;
 IF NEW.action='Refer' THEN
  IF NEW.predecessor_id IS DISTINCT FROM ref.id OR (ref.id IS NOT NULL AND coalesce(recv.decision,'Requested') NOT IN ('Returned','Held') AND NOT EXISTS(SELECT 1 FROM ppo.quote_supply_events WHERE workspace_id=NEW.workspace_id AND review_id=rev.id AND action='Apply')) THEN RAISE EXCEPTION 'Recover and finish original referral before replacement' USING ERRCODE='23514'; END IF;
 ELSE
  IF NEW.referral_id IS DISTINCT FROM ref.id OR NEW.created_by<>ref.owner_id OR (NEW.owner_id,NEW.due_date,NEW.date_needed,NEW.next_action,NEW.activity_id) IS DISTINCT FROM (ref.owner_id,ref.due_date,ref.date_needed,ref.next_action,ref.activity_id) THEN RAISE EXCEPTION 'Exact current receiving owner and referral required' USING ERRCODE='23514'; END IF;
  IF NEW.action='Receive' THEN
   IF NEW.predecessor_id IS DISTINCT FROM recv.id THEN RAISE EXCEPTION 'Explicit acknowledgement predecessor required' USING ERRCODE='23514'; END IF;
  ELSE
   IF recv.decision IS DISTINCT FROM 'Accepted' OR NEW.receiving_id IS DISTINCT FROM recv.id THEN RAISE EXCEPTION 'Exact accepted referral required' USING ERRCODE='23514'; END IF;
   IF NEW.action='Review' THEN
    IF NEW.predecessor_id IS DISTINCT FROM rev.id THEN RAISE EXCEPTION 'Explicit review predecessor required' USING ERRCODE='23514'; END IF;
   ELSE
    IF NEW.review_id IS DISTINCT FROM rev.id OR NEW.decision<>rev.decision OR NEW.command IS DISTINCT FROM rev.command OR NEW.review_hash<>rev.review_hash OR NEW.predecessor_id IS NOT NULL OR NEW.basis->'conversion'->'source' IS DISTINCT FROM rev.basis->'conversion'->'source' OR NEW.basis->'disposition' IS DISTINCT FROM rev.basis->'disposition' THEN RAISE EXCEPTION 'Apply exact latest review only' USING ERRCODE='23514'; END IF;
    IF cmd IS NULL AND NEW.basis IS DISTINCT FROM rev.basis THEN RAISE EXCEPTION 'Retention and hold bind exact reviewed evidence' USING ERRCODE='23514'; END IF;
   END IF;
  END IF;
 END IF;
 IF cmd IS NOT NULL THEN
  SELECT * INTO STRICT a FROM ppo.supply_allocations WHERE workspace_id=NEW.workspace_id AND id=(cmd->>'id')::uuid;
  SELECT version INTO seq FROM ppo.supply_records WHERE workspace_id=NEW.workspace_id AND id=a.supply_id;
  IF s.data->>'demand_class'<>'Approved' OR EXISTS(SELECT 1 FROM ppo.supply_records WHERE workspace_id=NEW.workspace_id AND parent_id=s.id) OR EXISTS(SELECT 1 FROM ppo.supply_current_facts WHERE workspace_id=NEW.workspace_id AND record_id=s.id AND kind NOT IN ('Assessment','Impact')) THEN RAISE EXCEPTION 'Consequential target holds allocation follow-up' USING ERRCODE='23514'; END IF;
  IF cmd->>'demand_id' IS DISTINCT FROM s.id::text OR cmd->>'supply_id' IS DISTINCT FROM a.supply_id::text OR cmd->>'unit' IS DISTINCT FROM a.unit OR cmd->>'basis' IS DISTINCT FROM a.basis OR (cmd->>'quantity') !~ '^(0|[1-9][0-9]{0,11})(\.[0-9]{1,6})?$' OR cmd->>'operation_id' IS NULL OR a.company_id<>s.company_id THEN RAISE EXCEPTION 'Exact quantity-only native allocation required' USING ERRCODE='23514'; END IF;
  IF NEW.action='Review' AND ((cmd->>'expected_version')::integer<>a.version OR (cmd->>'demand_version')::integer<>s.version OR (cmd->>'supply_version')::integer<>seq OR (cmd->>'quantity')::numeric=a.quantity) THEN RAISE EXCEPTION 'Review exact allocation versions and changed quantity' USING ERRCODE='23514'; END IF;
  IF NEW.action='Apply' AND ((cmd->>'expected_version')::integer<>a.version-1 OR (cmd->>'demand_version')::integer<>s.version-1 OR (cmd->>'supply_version')::integer<>seq-1 OR (cmd->>'quantity')::numeric<>a.quantity) THEN RAISE EXCEPTION 'Apply exact native allocation once' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER quote_supply_guard BEFORE INSERT ON ppo.quote_supply_events FOR EACH ROW EXECUTE FUNCTION ppo.quote_supply_guard();
CREATE FUNCTION ppo.quote_supply_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM ppo.audit_events a JOIN ppo.operation_receipts r ON (r.workspace_id,r.actor_id,r.operation_id)=(a.workspace_id,a.actor_id,a.operation_id) JOIN ppo.outbox_jobs j ON (j.workspace_id,j.actor_id,j.operation_id)=(a.workspace_id,a.actor_id,a.operation_id)
 WHERE a.workspace_id=NEW.workspace_id AND a.actor_id=NEW.created_by AND a.operation_id=NEW.operation_id AND a.object_type='DraftQuoteRevision' AND a.object_id=NEW.revision_id AND a.details->>'supply_event_id'=NEW.id::text AND a.details->>'command'='QuoteSupply:'||NEW.action AND a.reason=NEW.reason AND r.record_id=NEW.revision_id AND (r.result->>'record_version')::integer=NEW.sequence AND j.kind='QuotationSupplyRecorded') THEN RAISE EXCEPTION 'Supply follow-up requires original receipt audit and outbox' USING ERRCODE='23514'; END IF;
 IF NEW.action='Apply' AND NEW.command IS NOT NULL THEN
  IF NOT EXISTS(SELECT 1 FROM ppo.operation_receipts r JOIN ppo.audit_events a ON (a.workspace_id,a.actor_id,a.operation_id)=(r.workspace_id,r.actor_id,r.operation_id) JOIN ppo.supply_allocation_history h ON h.workspace_id=r.workspace_id AND h.allocation_id=(NEW.command->>'id')::uuid AND h.version=(NEW.command->>'expected_version')::integer+1
   WHERE r.workspace_id=NEW.workspace_id AND r.actor_id=NEW.created_by AND r.operation_id=(NEW.command->>'operation_id')::uuid AND r.record_id=NEW.target_id AND r.result=NEW.native_receipt AND a.details->>'command'='Supply:Allocate' AND a.details->>'supply_review_id'=NEW.review_id::text AND a.details->>'supply_outcome_id'=NEW.id::text AND h.xmin::text::bigint=mod(pg_current_xact_id()::text::numeric,4294967296)) THEN RAISE EXCEPTION 'Native allocation history and original receipt must commit with outcome' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER quote_supply_evidence AFTER INSERT ON ppo.quote_supply_events DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.quote_supply_evidence();
-- A reserved native operation cannot be consumed by another target or command
-- family while its review is pending. Defer so the genuine receipt and outcome
-- can be inserted in either order within their one atomic application.
CREATE FUNCTION ppo.quote_supply_operation_reservation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM ppo.quote_supply_events e WHERE e.workspace_id=NEW.workspace_id AND e.action='Review' AND e.command->>'operation_id'=NEW.operation_id::text)
 AND NOT EXISTS(SELECT 1 FROM ppo.quote_supply_events e WHERE e.workspace_id=NEW.workspace_id AND e.action='Apply' AND e.command->>'operation_id'=NEW.operation_id::text AND e.created_by=NEW.actor_id AND e.target_id=NEW.record_id AND e.native_receipt=NEW.result)
 THEN RAISE EXCEPTION 'Reserved Supply operation requires its exact applied review and native outcome' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER quote_supply_operation_reservation AFTER INSERT ON ppo.operation_receipts DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.quote_supply_operation_reservation();
