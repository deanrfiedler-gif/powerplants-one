-- SYN-ES07-07. Companion evidence only; retain all issued migrations and originals.
CREATE TABLE ppo.quote_material_events (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, revision_id uuid NOT NULL, target_id uuid NOT NULL, execution_id uuid NOT NULL,
 sequence integer NOT NULL CHECK(sequence>0), action text NOT NULL CHECK(action IN ('MaterialPropose','MaterialReceive','MaterialReview','MaterialApply')),
 referral_id uuid NOT NULL, receiving_id uuid NOT NULL, proposal_id uuid NOT NULL, predecessor_id uuid, review_id uuid,
 allocation_outcome_id uuid NOT NULL, demand_id uuid NOT NULL, impact_id uuid NOT NULL, task_id uuid NOT NULL,
 role text CHECK(role IN ('Demand','Project','Task','MaterialAction')),
 decision text NOT NULL CHECK(decision IN ('Proposed','Accepted','Returned','Held','WithdrawForecast','Retain','Hold')),
 basis jsonb NOT NULL, basis_hash text NOT NULL CHECK(basis_hash ~ '^[a-f0-9]{64}$'),
 dependencies jsonb NOT NULL, dependency_hash text NOT NULL CHECK(dependency_hash ~ '^[a-f0-9]{64}$'),
 proposal_hash text NOT NULL CHECK(proposal_hash ~ '^[a-f0-9]{64}$'), review_hash text,
 effect_receiving_ids jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(effect_receiving_ids)='array'),
 project_command jsonb NOT NULL, impact_command jsonb NOT NULL,
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),
 evidence text NOT NULL CHECK(length(btrim(evidence)) BETWEEN 1 AND 4000),
 created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(), operation_id uuid NOT NULL,
 native_receipts jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(native_receipts)='array'), after jsonb,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,target_id,id), UNIQUE(workspace_id,target_id,sequence), UNIQUE(workspace_id,created_by,operation_id),
 FOREIGN KEY(workspace_id,target_id) REFERENCES ppo.quote_conversion_targets(workspace_id,target_id),
 FOREIGN KEY(workspace_id,revision_id,execution_id) REFERENCES ppo.quote_conversion_events(workspace_id,revision_id,id),
 FOREIGN KEY(workspace_id,target_id,referral_id) REFERENCES ppo.quote_supply_events(workspace_id,target_id,id),
 FOREIGN KEY(workspace_id,target_id,receiving_id) REFERENCES ppo.quote_supply_events(workspace_id,target_id,id),
 FOREIGN KEY(workspace_id,target_id,allocation_outcome_id) REFERENCES ppo.quote_supply_events(workspace_id,target_id,id),
 FOREIGN KEY(workspace_id,target_id,proposal_id) REFERENCES ppo.quote_material_events(workspace_id,target_id,id) DEFERRABLE INITIALLY DEFERRED,
 FOREIGN KEY(workspace_id,target_id,predecessor_id) REFERENCES ppo.quote_material_events(workspace_id,target_id,id),
 FOREIGN KEY(workspace_id,target_id,review_id) REFERENCES ppo.quote_material_events(workspace_id,target_id,id),
 FOREIGN KEY(workspace_id,demand_id) REFERENCES ppo.supply_records(workspace_id,id),
 FOREIGN KEY(workspace_id,impact_id) REFERENCES ppo.supply_facts(workspace_id,id),
 FOREIGN KEY(workspace_id,task_id) REFERENCES ppo.project_tasks(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 CHECK((action='MaterialPropose' AND decision='Proposed' AND proposal_id=id AND role IS NULL AND review_id IS NULL)
    OR (action='MaterialReceive' AND decision IN ('Accepted','Returned','Held') AND role IS NOT NULL AND review_id IS NULL)
    OR (action='MaterialReview' AND decision IN ('WithdrawForecast','Retain','Hold') AND role IS NULL AND review_id IS NULL)
    OR (action='MaterialApply' AND decision IN ('WithdrawForecast','Retain','Hold') AND role IS NULL AND review_id IS NOT NULL)),
 CHECK((action IN ('MaterialReview','MaterialApply'))=(review_hash IS NOT NULL)),
 CHECK((action='MaterialApply')=(after IS NOT NULL)),
 CHECK(jsonb_array_length(native_receipts)=CASE WHEN action='MaterialApply' AND decision='WithdrawForecast' THEN 2 ELSE 0 END)
);
CREATE UNIQUE INDEX material_project_reserved ON ppo.quote_material_events(workspace_id,(project_command->>'operation_id')) WHERE action='MaterialPropose';
CREATE UNIQUE INDEX material_impact_reserved ON ppo.quote_material_events(workspace_id,(impact_command->>'operation_id')) WHERE action='MaterialPropose';
CREATE UNIQUE INDEX material_apply_once ON ppo.quote_material_events(workspace_id,proposal_id) WHERE action='MaterialApply';
CREATE TRIGGER immutable_quote_material BEFORE UPDATE OR DELETE ON ppo.quote_material_events FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

CREATE FUNCTION ppo.material_position(w uuid,d jsonb,pc jsonb,ic jsonb,applied boolean) RETURNS void LANGUAGE plpgsql AS $$
DECLARE r ppo.supply_records; p ppo.projects; t ppo.project_tasks; a ppo.activities; f ppo.supply_facts; x jsonb; v integer=CASE WHEN applied THEN 1 ELSE 0 END; ids jsonb; expected_ids jsonb;
BEGIN
 SELECT * INTO STRICT r FROM ppo.supply_records WHERE workspace_id=w AND id=(d->'demand'->>'id')::uuid;
 SELECT * INTO STRICT p FROM ppo.projects WHERE workspace_id=w AND id=(pc->>'project_id')::uuid;
 SELECT * INTO STRICT t FROM ppo.project_tasks WHERE workspace_id=w AND id=(pc->>'id')::uuid;
 SELECT * INTO STRICT a FROM ppo.activities WHERE workspace_id=w AND id=(d->'activity'->>'id')::uuid;
 SELECT * INTO STRICT f FROM ppo.supply_facts WHERE workspace_id=w AND id=(d->'impact'->>'id')::uuid;
 IF r.version<>(d->'demand'->>'version')::integer+v OR r.data IS DISTINCT FROM d->'demand'->'data' OR r.quantity<>(d->'demand'->>'quantity')::numeric
  OR r.owner_id<>(d->'demand'->>'owner_id')::uuid OR r.data->>'origin_kind'<>'Project' OR r.data->>'origin_id'<>p.id::text
  OR r.company_id<>p.company_id OR r.site_id<>p.site_id OR p.version<>(d->'project'->'project'->>'version')::integer+v
  OR t.project_id<>p.id OR t.version<>(d->'project'->'task'->>'version')::integer+v
  OR a.version<>(d->'activity'->>'version')::integer OR a.owner_id<>(d->'activity'->>'owner_id')::uuid
  OR f.record_id<>r.id OR f.activity_id<>a.id OR f.kind<>'Impact' OR f.data->>'state'<>'Requested'
 THEN RAISE EXCEPTION 'Exact current Project Demand task and owned Impact evidence required' USING ERRCODE='23514'; END IF;
 IF (pc->>'expected_version')::integer<>(d->'project'->'project'->>'version')::integer
  OR (ic->>'expected_version')::integer<>(d->'demand'->>'version')::integer OR ic->>'record_id'<>r.id::text
  OR ic->>'predecessor_id'<>f.id::text OR ic->>'kind'<>'Impact' OR ic->'data'->>'state'<>'Reviewed'
  OR ((ic->'data')-'state'-'review_reference') IS DISTINCT FROM (f.data-'state'-'review_reference')
  OR pc->'start_date'<>'null'::jsonb OR pc->'finish_date'<>'null'::jsonb
  OR EXISTS(SELECT 1 FROM jsonb_each(d->'project'->'task') z WHERE z.key IN ('id','title','phase','status','milestone','progress','note','owner_id','external_owner_id','dependencies') AND z.value IS DISTINCT FROM pc->z.key)
 THEN RAISE EXCEPTION 'Only exact forecast dates and verified Impact review are contracted' USING ERRCODE='23514'; END IF;
 IF (t.title,t.phase,t.status,t.milestone,t.progress,t.note,t.owner_id,t.external_owner_id)
 IS DISTINCT FROM (pc->>'title',pc->>'phase',pc->>'status',(pc->>'milestone')::boolean,(pc->>'progress')::integer,pc->>'note',(pc->>'owner_id')::uuid,(pc->>'external_owner_id')::uuid)
 OR (NOT applied AND (t.start_date::text,t.finish_date::text) IS DISTINCT FROM (d->'project'->'task'->>'start_date',d->'project'->'task'->>'finish_date'))
 OR (applied AND (t.start_date IS NOT NULL OR t.finish_date IS NOT NULL))
 THEN RAISE EXCEPTION 'Project task changed outside reviewed dates' USING ERRCODE='23514'; END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('task_id',task_id,'predecessor_id',predecessor_id,'kind',kind) ORDER BY task_id,predecessor_id),'[]') INTO ids
 FROM ppo.project_dependencies WHERE workspace_id=w AND project_id=p.id;
 IF ids IS DISTINCT FROM d->'project'->'dependencies' THEN RAISE EXCEPTION 'New or changed Project dependencies require receiving' USING ERRCODE='23514'; END IF;
 SELECT coalesce(jsonb_agg(id ORDER BY id),'[]') INTO ids FROM ppo.supply_current_facts WHERE workspace_id=w AND record_id=r.id;
 SELECT coalesce(jsonb_agg(CASE WHEN applied AND value->>'id'=f.id::text THEN (ic->>'id')::uuid ELSE (value->>'id')::uuid END ORDER BY CASE WHEN applied AND value->>'id'=f.id::text THEN (ic->>'id')::uuid ELSE (value->>'id')::uuid END),'[]') INTO expected_ids FROM jsonb_array_elements(d->'facts');
 IF ids IS DISTINCT FROM expected_ids THEN RAISE EXCEPTION 'Retain exact current fact set and selected successor only' USING ERRCODE='23514'; END IF;
 IF jsonb_array_length(d->'material'->'allocations')<>(SELECT count(*) FROM ppo.supply_allocations WHERE workspace_id=w AND demand_id=r.id)
 THEN RAISE EXCEPTION 'New allocations invalidate material receiving' USING ERRCODE='23514'; END IF;
 FOR x IN SELECT value FROM jsonb_array_elements(d->'material'->'allocations') LOOP
  IF NOT EXISTS(SELECT 1 FROM ppo.supply_allocations al WHERE al.workspace_id=w AND al.id=(x->>'id')::uuid AND al.demand_id=r.id AND al.version=(x->>'version')::integer AND al.quantity=(x->>'quantity')::numeric AND al.supply_id=(x->>'supply_id')::uuid AND al.basis=x->>'basis') THEN RAISE EXCEPTION 'Preserve reviewed allocations' USING ERRCODE='23514'; END IF;
 END LOOP;
 FOR x IN SELECT value FROM jsonb_array_elements(d->'sources') LOOP
  IF NOT EXISTS(SELECT 1 FROM ppo.supply_records s WHERE s.workspace_id=w AND s.id=(x->'record'->>'id')::uuid AND s.version=(x->'record'->>'version')::integer) THEN RAISE EXCEPTION 'Source changed' USING ERRCODE='23514'; END IF;
 END LOOP;
END $$;

CREATE FUNCTION ppo.quote_material_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE ref ppo.quote_supply_events; recv ppo.quote_supply_events; outcome ppo.quote_supply_events;
 prop ppo.quote_material_events; review ppo.quote_material_events; received ppo.quote_material_events;
 prev uuid; seq integer; k text; owner uuid; ids jsonb='[]'; d jsonb=NEW.dependencies;
BEGIN
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 SELECT * INTO STRICT ref FROM ppo.quote_supply_events WHERE workspace_id=NEW.workspace_id AND target_id=NEW.target_id AND action='Refer' ORDER BY sequence DESC LIMIT 1;
 SELECT * INTO STRICT recv FROM ppo.quote_supply_events WHERE workspace_id=NEW.workspace_id AND referral_id=ref.id AND action='Receive' ORDER BY sequence DESC LIMIT 1;
 SELECT * INTO STRICT outcome FROM ppo.quote_supply_events WHERE workspace_id=NEW.workspace_id AND id=NEW.allocation_outcome_id;
 SELECT coalesce(max(sequence),0) INTO seq FROM ppo.quote_material_events WHERE workspace_id=NEW.workspace_id AND target_id=NEW.target_id;
 IF NEW.sequence<>seq+1 OR ref.id<>NEW.referral_id OR recv.id<>NEW.receiving_id OR recv.decision<>'Accepted'
  OR NEW.revision_id<>ref.revision_id OR NEW.execution_id<>ref.execution_id
  OR outcome.action<>'Apply' OR outcome.decision<>'ReduceAllocations' OR outcome.native_receipt IS NULL OR outcome.target_id<>NEW.target_id
  OR d->'demand'->>'id' IS DISTINCT FROM NEW.demand_id::text OR d->'impact'->>'id' IS DISTINCT FROM NEW.impact_id::text
  OR d->'project'->'task'->>'id' IS DISTINCT FROM NEW.task_id::text
  OR ((d->'allocation_outcome')-'created_at') IS DISTINCT FROM (to_jsonb(outcome)-'created_at')
  OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(ppo.shortfall_changes(outcome.command)) x WHERE x->>'demand_id'=NEW.demand_id::text)
  OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(outcome.basis->'position') g, jsonb_array_elements(g->'demands') dm, jsonb_array_elements(dm->'facts') f WHERE dm->'record'->>'id'=NEW.demand_id::text AND f->>'id'=NEW.impact_id::text AND f->'data'->>'state'='Requested')
 THEN RAISE EXCEPTION 'Exact applied reduction and accepted referral lineage required' USING ERRCODE='23514'; END IF;
 PERFORM ppo.material_position(NEW.workspace_id,d,NEW.project_command,NEW.impact_command,NEW.action='MaterialApply' AND NEW.decision='WithdrawForecast');
 IF NEW.action='MaterialPropose' THEN
  SELECT id INTO prev FROM ppo.quote_material_events WHERE workspace_id=NEW.workspace_id AND target_id=NEW.target_id AND action='MaterialPropose' ORDER BY sequence DESC LIMIT 1;
  IF NEW.predecessor_id IS DISTINCT FROM prev OR NEW.created_by<>ref.owner_id THEN RAISE EXCEPTION 'Owned exact successor proposal required' USING ERRCODE='23514'; END IF;
  IF EXISTS(SELECT 1 FROM ppo.quote_material_events x WHERE x.workspace_id=NEW.workspace_id AND x.target_id<>NEW.target_id AND x.action='MaterialPropose'
   AND (x.impact_id=NEW.impact_id OR x.task_id=NEW.task_id)
   AND x.id=(SELECT id FROM ppo.quote_material_events WHERE workspace_id=x.workspace_id AND target_id=x.target_id AND action='MaterialPropose' ORDER BY sequence DESC LIMIT 1)
   AND x.referral_id=(SELECT id FROM ppo.quote_supply_events WHERE workspace_id=x.workspace_id AND target_id=x.target_id AND action='Refer' ORDER BY sequence DESC LIMIT 1)
   AND 'Accepted'=(SELECT decision FROM ppo.quote_supply_events WHERE workspace_id=x.workspace_id AND referral_id=x.referral_id AND action='Receive' ORDER BY sequence DESC LIMIT 1)
   AND NOT EXISTS(SELECT 1 FROM ppo.quote_material_events WHERE workspace_id=x.workspace_id AND proposal_id=x.id AND action='MaterialApply'))
  THEN RAISE EXCEPTION 'Competing active material target; return or recover original first' USING ERRCODE='23514'; END IF;
  IF NEW.project_command->>'operation_id'=NEW.impact_command->>'operation_id' OR EXISTS(
   SELECT 1 FROM ppo.operation_receipts WHERE workspace_id=NEW.workspace_id AND operation_id IN ((NEW.project_command->>'operation_id')::uuid,(NEW.impact_command->>'operation_id')::uuid))
   THEN RAISE EXCEPTION 'Reserve unused distinct native originals' USING ERRCODE='23514'; END IF;
  IF EXISTS(SELECT 1 FROM ppo.quote_material_events x WHERE x.workspace_id=NEW.workspace_id AND x.action='MaterialPropose'
    AND (x.project_command->>'operation_id' IN (NEW.project_command->>'operation_id',NEW.impact_command->>'operation_id') OR x.impact_command->>'operation_id' IN (NEW.project_command->>'operation_id',NEW.impact_command->>'operation_id')))
   THEN RAISE EXCEPTION 'Native original already reserved' USING ERRCODE='23514'; END IF;
 ELSE
  SELECT * INTO STRICT prop FROM ppo.quote_material_events WHERE workspace_id=NEW.workspace_id AND target_id=NEW.target_id AND action='MaterialPropose' ORDER BY sequence DESC LIMIT 1;
  IF NEW.proposal_id<>prop.id OR NEW.referral_id<>prop.referral_id OR NEW.receiving_id<>prop.receiving_id OR NEW.proposal_hash<>prop.proposal_hash
   OR NEW.dependencies IS DISTINCT FROM prop.dependencies OR NEW.basis IS DISTINCT FROM prop.basis
   OR NEW.project_command IS DISTINCT FROM prop.project_command OR NEW.impact_command IS DISTINCT FROM prop.impact_command
   OR (NEW.demand_id,NEW.impact_id,NEW.task_id,NEW.allocation_outcome_id) IS DISTINCT FROM (prop.demand_id,prop.impact_id,prop.task_id,prop.allocation_outcome_id)
   OR EXISTS(SELECT 1 FROM ppo.quote_material_events WHERE workspace_id=NEW.workspace_id AND proposal_id=prop.id AND action='MaterialApply')
  THEN RAISE EXCEPTION 'Exact current unapplied proposal required' USING ERRCODE='23514'; END IF;
  IF NEW.action='MaterialReceive' THEN
   SELECT id INTO prev FROM ppo.quote_material_events WHERE workspace_id=NEW.workspace_id AND proposal_id=prop.id AND action='MaterialReceive' AND role=NEW.role ORDER BY sequence DESC LIMIT 1;
   owner=CASE NEW.role WHEN 'Demand' THEN (d->'demand'->>'owner_id')::uuid WHEN 'Project' THEN (d->'project'->'project'->>'coordinator_id')::uuid WHEN 'Task' THEN (d->'project'->'task'->>'owner_id')::uuid ELSE (d->'activity'->>'owner_id')::uuid END;
   IF NEW.created_by IS DISTINCT FROM owner OR NEW.predecessor_id IS DISTINCT FROM prev THEN RAISE EXCEPTION 'Separate exact current owner decision required' USING ERRCODE='23514'; END IF;
  ELSE
   IF NEW.created_by<>ref.owner_id THEN RAISE EXCEPTION 'Only accepted referral owner reviews and applies' USING ERRCODE='23514'; END IF;
   FOREACH k IN ARRAY ARRAY['Demand','Project','Task','MaterialAction'] LOOP
    SELECT * INTO received FROM ppo.quote_material_events WHERE workspace_id=NEW.workspace_id AND proposal_id=prop.id AND action='MaterialReceive' AND role=k ORDER BY sequence DESC LIMIT 1;
    IF NEW.decision='WithdrawForecast' AND (received.id IS NULL OR received.decision<>'Accepted') THEN RAISE EXCEPTION 'Four separate independent downstream acceptances required' USING ERRCODE='23514'; END IF;
    IF received.id IS NOT NULL THEN ids=ids||jsonb_build_array(received.id); END IF;
   END LOOP;
   IF ids IS DISTINCT FROM NEW.effect_receiving_ids THEN RAISE EXCEPTION 'Freeze exact latest receiving decisions' USING ERRCODE='23514'; END IF;
   IF NEW.action='MaterialReview' THEN
    SELECT id INTO prev FROM ppo.quote_material_events WHERE workspace_id=NEW.workspace_id AND proposal_id=prop.id AND action='MaterialReview' ORDER BY sequence DESC LIMIT 1;
    IF NEW.predecessor_id IS DISTINCT FROM prev THEN RAISE EXCEPTION 'Retain review predecessor' USING ERRCODE='23514'; END IF;
   ELSE
    SELECT * INTO STRICT review FROM ppo.quote_material_events WHERE workspace_id=NEW.workspace_id AND proposal_id=prop.id AND action='MaterialReview' ORDER BY sequence DESC LIMIT 1;
    IF NEW.review_id<>review.id OR NEW.review_hash<>review.review_hash OR NEW.decision<>review.decision OR NEW.effect_receiving_ids IS DISTINCT FROM review.effect_receiving_ids THEN RAISE EXCEPTION 'Separate exact immutable review application required' USING ERRCODE='23514'; END IF;
   END IF;
   IF NEW.decision='WithdrawForecast' THEN
    IF d->'project'->'project'->>'lifecycle'<>'Active' OR d->'project'->'task'->>'status'<>'Planned' OR (d->'project'->'task'->>'progress')::integer<>0
     OR (d->'project'->'task'->>'milestone')::boolean OR d->'project'->'task'->>'owner_id' IS NULL
     OR d->'project'->'task'->>'start_date' IS NULL OR d->'project'->'task'->>'finish_date' IS NULL
     OR d->'activity'->>'state' IN ('Completed','Cancelled')
     OR EXISTS(SELECT 1 FROM ppo.project_dependencies WHERE workspace_id=NEW.workspace_id AND (task_id=NEW.task_id OR predecessor_id=NEW.task_id))
     OR EXISTS(SELECT 1 FROM ppo.engineering_packages WHERE workspace_id=NEW.workspace_id AND project_id=(NEW.project_command->>'project_id')::uuid)
     OR EXISTS(SELECT 1 FROM ppo.acceptance_stages WHERE workspace_id=NEW.workspace_id AND project_id=(NEW.project_command->>'project_id')::uuid)
     OR EXISTS(SELECT 1 FROM ppo.supply_records WHERE workspace_id=NEW.workspace_id AND parent_id=NEW.demand_id)
     OR EXISTS(SELECT 1 FROM ppo.supply_current_facts WHERE workspace_id=NEW.workspace_id AND record_id=NEW.demand_id AND kind NOT IN ('Impact','Assessment'))
     OR coalesce(d->'demand'->'data'->>'appointment_id',d->'demand'->'data'->>'engineering_id',d->'demand'->'data'->>'customer_commitment') IS NOT NULL
    THEN RAISE EXCEPTION 'Native consequential dependencies retain owning workflow hold' USING ERRCODE='23514'; END IF;
   END IF;
  END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER quote_material_guard BEFORE INSERT ON ppo.quote_material_events FOR EACH ROW EXECUTE FUNCTION ppo.quote_material_guard();

CREATE FUNCTION ppo.quote_material_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE receipt jsonb; op uuid; family text; target uuid; n integer=0;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM ppo.operation_receipts r JOIN ppo.audit_events a ON (a.workspace_id,a.actor_id,a.operation_id)=(r.workspace_id,r.actor_id,r.operation_id)
 JOIN ppo.outbox_jobs j ON (j.workspace_id,j.actor_id,j.operation_id)=(r.workspace_id,r.actor_id,r.operation_id)
 WHERE r.workspace_id=NEW.workspace_id AND r.actor_id=NEW.created_by AND r.operation_id=NEW.operation_id AND r.record_id=NEW.revision_id
 AND (r.result->>'record_version')::integer=NEW.sequence AND a.details->>'material_event_id'=NEW.id::text AND a.details->>'command'='QuoteSupply:'||NEW.action AND a.reason=NEW.reason AND j.kind='QuotationSupplyRecorded')
 THEN RAISE EXCEPTION 'Material evidence requires atomic original audit receipt and outbox' USING ERRCODE='23514'; END IF;
 IF NEW.action='MaterialApply' AND NEW.decision='WithdrawForecast' THEN
  FOR receipt IN SELECT value FROM jsonb_array_elements(NEW.native_receipts) LOOP
   op=CASE WHEN n=0 THEN (NEW.project_command->>'operation_id')::uuid ELSE (NEW.impact_command->>'operation_id')::uuid END;
   family=CASE WHEN n=0 THEN 'SaveProjectTask' ELSE 'Supply:Fact:Impact' END;
   target=CASE WHEN n=0 THEN (NEW.project_command->>'project_id')::uuid ELSE NEW.demand_id END;
   IF NOT EXISTS(SELECT 1 FROM ppo.operation_receipts r JOIN ppo.audit_events a ON (a.workspace_id,a.actor_id,a.operation_id)=(r.workspace_id,r.actor_id,r.operation_id)
    WHERE r.workspace_id=NEW.workspace_id AND r.actor_id=NEW.created_by AND r.operation_id=op AND r.record_id=target AND r.result=receipt
    AND a.details->>'command'=family AND a.details->>'material_outcome_id'=NEW.id::text AND a.details->>'material_review_id'=NEW.review_id::text)
    THEN RAISE EXCEPTION 'Verified exact owning workflow receipts required' USING ERRCODE='23514'; END IF;
   n=n+1;
  END LOOP;
  IF NOT EXISTS(SELECT 1 FROM ppo.project_schedule_events WHERE workspace_id=NEW.workspace_id AND operation_id=(NEW.project_command->>'operation_id')::uuid
   AND project_id=(NEW.project_command->>'project_id')::uuid AND task_snapshot->>'id'=NEW.task_id::text AND task_snapshot->'start_date'='null'::jsonb AND task_snapshot->'finish_date'='null'::jsonb)
   OR NOT EXISTS(SELECT 1 FROM ppo.supply_facts WHERE workspace_id=NEW.workspace_id AND id=(NEW.impact_command->>'id')::uuid AND predecessor_id=NEW.impact_id
    AND record_id=NEW.demand_id AND kind='Impact' AND data=NEW.impact_command->'data' AND activity_id=(NEW.dependencies->'activity'->>'id')::uuid)
  THEN RAISE EXCEPTION 'Verified Project effect and exact Impact successor required' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER quote_material_evidence AFTER INSERT ON ppo.quote_material_events DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.quote_material_evidence();
CREATE FUNCTION ppo.material_reserved_receipt() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE prop ppo.quote_material_events;
BEGIN
 SELECT * INTO prop FROM ppo.quote_material_events WHERE workspace_id=NEW.workspace_id AND action='MaterialPropose'
 AND (project_command->>'operation_id'=NEW.operation_id::text OR impact_command->>'operation_id'=NEW.operation_id::text);
 IF prop.id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM ppo.quote_material_events e WHERE e.workspace_id=NEW.workspace_id AND e.proposal_id=prop.id AND e.action='MaterialApply'
  AND e.decision='WithdrawForecast' AND e.created_by=NEW.actor_id AND e.native_receipts @> jsonb_build_array(NEW.result))
 THEN RAISE EXCEPTION 'Reserved native original belongs to exact received material application' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER material_reserved_receipt AFTER INSERT ON ppo.operation_receipts DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.material_reserved_receipt();
