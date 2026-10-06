-- SYN-ES07-02. Immutable decisions/effects beneath original completed conversions.
DO $$ DECLARE definition text; BEGIN
 SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid='ppo.outbox_jobs'::regclass AND conname='ck_outbox_kind';
 ALTER TABLE ppo.outbox_jobs DROP CONSTRAINT ck_outbox_kind;
 EXECUTE format('ALTER TABLE ppo.outbox_jobs ADD CONSTRAINT ck_outbox_kind CHECK ((%s) OR kind = ''QuotationDispositionRecorded'')',substring(definition from 8 for length(definition)-8));
END $$;
CREATE TABLE ppo.quote_disposition_events (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,revision_id uuid NOT NULL,execution_id uuid NOT NULL,target_id uuid NOT NULL,
 sequence integer NOT NULL CHECK(sequence>0),action text NOT NULL CHECK(action IN ('Review','Apply')),
 predecessor_id uuid,review_id uuid,decision text NOT NULL CHECK(decision IN ('Retain','ReviseQuantity','Hold')),
 basis jsonb NOT NULL CHECK(jsonb_typeof(basis)='object'),basis_hash text NOT NULL CHECK(basis_hash ~ '^[a-f0-9]{64}$'),
 command jsonb,review_hash text NOT NULL CHECK(review_hash ~ '^[a-f0-9]{64}$'),
 owner_id uuid NOT NULL,due_date date NOT NULL,next_action text NOT NULL CHECK(length(btrim(next_action)) BETWEEN 1 AND 1000),
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),evidence text NOT NULL CHECK(length(btrim(evidence)) BETWEEN 1 AND 4000),
 created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),operation_id uuid NOT NULL,effect_version integer,
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,target_id,id),UNIQUE(workspace_id,target_id,sequence),UNIQUE(workspace_id,created_by,operation_id),
 FOREIGN KEY(workspace_id,target_id) REFERENCES ppo.quote_conversion_targets(workspace_id,target_id),
 FOREIGN KEY(workspace_id,revision_id,execution_id) REFERENCES ppo.quote_conversion_events(workspace_id,revision_id,id),
 FOREIGN KEY(workspace_id,target_id,predecessor_id) REFERENCES ppo.quote_disposition_events(workspace_id,target_id,id),
 FOREIGN KEY(workspace_id,target_id,review_id) REFERENCES ppo.quote_disposition_events(workspace_id,target_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 CHECK((action='Apply')=(review_id IS NOT NULL)),CHECK((action='Apply')=(effect_version IS NOT NULL)),
 CHECK(action<>'Apply' OR (predecessor_id IS NULL AND decision<>'Hold')),
 CHECK((decision='ReviseQuantity')=(command IS NOT NULL)),CHECK(command IS NULL OR jsonb_typeof(command)='object')
);
CREATE UNIQUE INDEX quote_disposition_once ON ppo.quote_disposition_events(workspace_id,review_id) WHERE action='Apply';
CREATE TRIGGER immutable_disposition BEFORE UPDATE OR DELETE ON ppo.quote_disposition_events FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.quote_disposition_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE t ppo.quote_conversion_targets; e ppo.quote_conversion_events; plan ppo.quote_conversion_events; r ppo.quote_disposition_events; s ppo.supply_records; seq integer; original jsonb; x record; src jsonb; q uuid;
BEGIN
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 SELECT * INTO STRICT t FROM ppo.quote_conversion_targets WHERE workspace_id=NEW.workspace_id AND target_id=NEW.target_id;
 SELECT * INTO STRICT e FROM ppo.quote_conversion_events WHERE workspace_id=NEW.workspace_id AND id=t.execution_id;
 SELECT * INTO STRICT plan FROM ppo.quote_conversion_events WHERE workspace_id=NEW.workspace_id AND id=t.plan_id;
 SELECT * INTO STRICT s FROM ppo.supply_records WHERE workspace_id=NEW.workspace_id AND id=NEW.target_id;
 SELECT snapshot||jsonb_build_object('quantity',snapshot->>'quantity') INTO STRICT original FROM ppo.supply_revisions WHERE workspace_id=NEW.workspace_id AND record_id=NEW.target_id AND version=1;
 IF e.action<>'Execute' OR NEW.execution_id<>t.execution_id OR NEW.revision_id<>t.revision_id OR NEW.basis->>'policy' IS DISTINCT FROM 'SYN-ES07-02' OR NEW.basis->>'execution_id' IS DISTINCT FROM e.id::text OR NEW.basis->>'plan_id' IS DISTINCT FROM plan.id::text OR NEW.basis->>'plan_hash' IS DISTINCT FROM plan.plan_hash OR NEW.basis->>'line_id' IS DISTINCT FROM t.line_id::text OR NEW.basis->>'output_hash' IS DISTINCT FROM e.output_hash OR NEW.basis->'original_target' IS DISTINCT FROM original OR NEW.basis->'target' IS DISTINCT FROM (to_jsonb(s)||jsonb_build_object('quantity',s.quantity::text)) THEN RAISE EXCEPTION 'Exact original completed lineage and current target required' USING ERRCODE='23514'; END IF;
 src=NEW.basis->'source';
 SELECT id INTO q FROM ppo.quote_release_events WHERE workspace_id=NEW.workspace_id AND quote_id=t.quote_id AND action='Issue' ORDER BY sequence DESC LIMIT 1;
 IF src->>'issue_id' IS DISTINCT FROM q::text THEN RAISE EXCEPTION 'Current issued source required' USING ERRCODE='23514'; END IF;
 SELECT id INTO q FROM ppo.quote_response_events WHERE workspace_id=NEW.workspace_id AND revision_id=NEW.revision_id AND action IN ('Record','Correct') ORDER BY sequence DESC LIMIT 1;
 IF src->>'response_id' IS DISTINCT FROM q::text THEN RAISE EXCEPTION 'Current response required' USING ERRCODE='23514'; END IF;
 SELECT id INTO q FROM ppo.quote_response_events WHERE workspace_id=NEW.workspace_id AND revision_id=NEW.revision_id AND action='Prepare' ORDER BY sequence DESC LIMIT 1;
 IF src->>'preparation_id' IS DISTINCT FROM q::text THEN RAISE EXCEPTION 'Current preparation required' USING ERRCODE='23514'; END IF;
 SELECT id INTO q FROM ppo.quote_conversion_events WHERE workspace_id=NEW.workspace_id AND revision_id=NEW.revision_id AND action='Receive' ORDER BY sequence DESC LIMIT 1;
 IF src->>'receiving_id' IS DISTINCT FROM q::text THEN RAISE EXCEPTION 'Current receiving required' USING ERRCODE='23514'; END IF;
 SELECT id INTO q FROM ppo.quote_conversion_events WHERE workspace_id=NEW.workspace_id AND revision_id=NEW.revision_id AND action='Resolve' AND resolution->>'line_id'=t.line_id::text ORDER BY sequence DESC LIMIT 1;
 IF src->>'resolution_id' IS DISTINCT FROM q::text THEN RAISE EXCEPTION 'Current line resolution required' USING ERRCODE='23514'; END IF;
 SELECT coalesce(max(sequence),0) INTO seq FROM ppo.quote_disposition_events WHERE workspace_id=NEW.workspace_id AND target_id=NEW.target_id;
 IF NEW.sequence<>seq+1 THEN RAISE EXCEPTION 'Next target disposition sequence required' USING ERRCODE='23514'; END IF;
 SELECT * INTO r FROM ppo.quote_disposition_events WHERE workspace_id=NEW.workspace_id AND target_id=NEW.target_id AND action='Review' ORDER BY sequence DESC LIMIT 1;
 IF NEW.action='Review' THEN
  IF NEW.predecessor_id IS DISTINCT FROM r.id THEN RAISE EXCEPTION 'Explicit latest review predecessor required' USING ERRCODE='23514'; END IF;
 ELSE
  IF r.id IS DISTINCT FROM NEW.review_id OR NEW.decision<>r.decision OR NEW.command IS DISTINCT FROM r.command OR NEW.review_hash<>r.review_hash OR (NEW.owner_id,NEW.due_date,NEW.next_action) IS DISTINCT FROM (r.owner_id,r.due_date,r.next_action) OR NEW.basis->'source' IS DISTINCT FROM r.basis->'source' OR NEW.effect_version<>s.version THEN RAISE EXCEPTION 'Apply exact latest reviewed decision' USING ERRCODE='23514'; END IF;
  IF NEW.decision='Retain' AND NEW.basis IS DISTINCT FROM r.basis THEN RAISE EXCEPTION 'Retain only the exact reviewed evidence' USING ERRCODE='23514'; END IF;
  IF NEW.decision='ReviseQuantity' THEN
   IF s.version<>(r.basis->'target'->>'version')::integer+1 OR (SELECT snapshot||jsonb_build_object('quantity',snapshot->>'quantity') FROM ppo.supply_revisions WHERE workspace_id=NEW.workspace_id AND record_id=NEW.target_id AND version=s.version-1) IS DISTINCT FROM r.basis->'target' THEN RAISE EXCEPTION 'Exact reviewed predecessor target required' USING ERRCODE='23514'; END IF;
  END IF;
 END IF;
 IF NEW.decision='ReviseQuantity' THEN
  IF s.kind<>'Demand' OR s.data->>'demand_class'<>'Forecast' OR EXISTS(SELECT 1 FROM ppo.supply_allocations WHERE workspace_id=NEW.workspace_id AND demand_id=s.id AND quantity>0) OR EXISTS(SELECT 1 FROM ppo.supply_records WHERE workspace_id=NEW.workspace_id AND parent_id=s.id) OR EXISTS(SELECT 1 FROM ppo.supply_current_facts WHERE workspace_id=NEW.workspace_id AND record_id=s.id AND kind NOT IN ('Assessment','Impact')) THEN RAISE EXCEPTION 'Consequential downstream dependencies hold quantity disposition' USING ERRCODE='23514'; END IF;
  IF NEW.command->>'id' IS DISTINCT FROM s.id::text OR NEW.command->>'kind' IS DISTINCT FROM 'Demand' OR (NEW.command->>'quantity')::numeric<=0 OR (NEW.command->>'quantity')::numeric>=1000000000000 OR scale((NEW.command->>'quantity')::numeric)>6 OR NEW.command->>'operation_id' IS NULL THEN RAISE EXCEPTION 'Exact positive native revise command required' USING ERRCODE='23514'; END IF;
  FOR x IN SELECT key,value FROM jsonb_each(NEW.command-ARRAY['operation_id','schema_version','reason','expected_version','quantity','observed_at']) LOOP
   IF x.value IS DISTINCT FROM to_jsonb(s)->x.key THEN RAISE EXCEPTION 'Disposition changes quantity only' USING ERRCODE='23514'; END IF;
  END LOOP;
  IF (NEW.command->>'observed_at')::timestamptz IS DISTINCT FROM s.observed_at THEN RAISE EXCEPTION 'Retain source observation time' USING ERRCODE='23514'; END IF;
  IF NEW.action='Review' AND ((NEW.command->>'expected_version')::integer<>s.version OR (NEW.command->>'quantity')::numeric=s.quantity) THEN RAISE EXCEPTION 'Review changed quantity at exact target version' USING ERRCODE='23514'; END IF;
  IF NEW.action='Apply' AND ((NEW.command->>'quantity')::numeric<>s.quantity OR (NEW.command->>'expected_version')::integer<>s.version-1) THEN RAISE EXCEPTION 'Apply exact proposed quantity once' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER quote_disposition_guard BEFORE INSERT ON ppo.quote_disposition_events FOR EACH ROW EXECUTE FUNCTION ppo.quote_disposition_guard();
CREATE FUNCTION ppo.quote_disposition_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM ppo.audit_events a JOIN ppo.operation_receipts r ON (r.workspace_id,r.actor_id,r.operation_id)=(a.workspace_id,a.actor_id,a.operation_id) JOIN ppo.outbox_jobs j ON (j.workspace_id,j.actor_id,j.operation_id)=(a.workspace_id,a.actor_id,a.operation_id)
 WHERE a.workspace_id=NEW.workspace_id AND a.actor_id=NEW.created_by AND a.operation_id=NEW.operation_id AND a.object_type='DraftQuoteRevision' AND a.object_id=NEW.revision_id AND a.details->>'disposition_event_id'=NEW.id::text AND a.details->>'command'='QuoteDisposition:'||NEW.action AND a.reason=NEW.reason AND r.record_id=NEW.revision_id AND (r.result->>'record_version')::integer=NEW.sequence AND j.kind='QuotationDispositionRecorded') THEN RAISE EXCEPTION 'Disposition requires atomic original receipt audit and outbox' USING ERRCODE='23514'; END IF;
 IF NEW.action='Apply' AND NEW.decision='ReviseQuantity' THEN
  IF NOT EXISTS(SELECT 1 FROM ppo.operation_receipts r JOIN ppo.audit_events a ON (a.workspace_id,a.actor_id,a.operation_id)=(r.workspace_id,r.actor_id,r.operation_id) JOIN ppo.supply_revisions v ON (v.workspace_id,v.record_id,v.version)=(r.workspace_id,r.record_id,NEW.effect_version)
   WHERE r.workspace_id=NEW.workspace_id AND r.actor_id=NEW.created_by AND r.operation_id=(NEW.command->>'operation_id')::uuid AND r.record_id=NEW.target_id AND (r.result->>'record_version')::integer=NEW.effect_version AND a.details->>'command'='Supply:Revise' AND a.details->>'disposition_review_id'=NEW.review_id::text AND a.details->>'disposition_effect_id'=NEW.id::text AND v.xmin::text::bigint=mod(pg_current_xact_id()::text::numeric,4294967296)) THEN RAISE EXCEPTION 'Native target revision and original receipt must commit with disposition' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER quote_disposition_evidence AFTER INSERT ON ppo.quote_disposition_events DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.quote_disposition_evidence();
