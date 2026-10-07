-- SYN-ES07-12: explicit A -> B, A -> C, B -> D, C -> D. D is saved once.
-- Earlier topology inputs, overloads, hashes, roles and outcomes retain their meaning.
ALTER TABLE ppo.quote_material_events ADD COLUMN diamond_commands jsonb;
ALTER TABLE ppo.quote_material_events DROP CONSTRAINT quote_material_events_role_check;
ALTER TABLE ppo.quote_material_events ADD CONSTRAINT quote_material_events_role_check CHECK(role IN ('Demand','Project','Task','MaterialAction','Successor','ChainEnd','BranchSuccessor','MergePredecessor','MergeSuccessor','DiamondB','DiamondC','DiamondD'));
ALTER TABLE ppo.quote_material_events DROP CONSTRAINT quote_material_events_check3;
ALTER TABLE ppo.quote_material_events ADD CONSTRAINT quote_material_events_check3 CHECK(jsonb_array_length(native_receipts)=CASE WHEN action='MaterialApply' AND decision='WithdrawForecast' THEN CASE WHEN diamond_commands IS NOT NULL THEN 5 WHEN chain_end_command IS NOT NULL OR branch_successor_command IS NOT NULL THEN 4 WHEN successor_command IS NOT NULL OR merge_successor_command IS NOT NULL THEN 3 ELSE 2 END ELSE 0 END);
ALTER TABLE ppo.quote_material_events ADD CONSTRAINT material_diamond_role CHECK(role NOT IN ('DiamondB','DiamondC','DiamondD') OR diamond_commands IS NOT NULL);
ALTER TABLE ppo.quote_material_events ADD CONSTRAINT material_diamond_shape CHECK(diamond_commands IS NULL OR (jsonb_typeof(diamond_commands)='object' AND diamond_commands ?& ARRAY['b','c','d'] AND diamond_commands-ARRAY['b','c','d']='{}'::jsonb AND successor_command IS NULL AND chain_end_command IS NULL AND branch_successor_command IS NULL AND merge_successor_command IS NULL));
CREATE UNIQUE INDEX material_diamond_b_reserved ON ppo.quote_material_events(workspace_id,(diamond_commands->'b'->>'operation_id')) WHERE action='MaterialPropose' AND diamond_commands IS NOT NULL;
CREATE UNIQUE INDEX material_diamond_c_reserved ON ppo.quote_material_events(workspace_id,(diamond_commands->'c'->>'operation_id')) WHERE action='MaterialPropose' AND diamond_commands IS NOT NULL;
CREATE UNIQUE INDEX material_diamond_d_reserved ON ppo.quote_material_events(workspace_id,(diamond_commands->'d'->>'operation_id')) WHERE action='MaterialPropose' AND diamond_commands IS NOT NULL;
CREATE FUNCTION ppo.material_position(w uuid,d jsonb,pc jsonb,ic jsonb,applied boolean,sc jsonb,cc jsonb,bc jsonb,mc jsonb,dc jsonb) RETURNS void LANGUAGE plpgsql AS $$
DECLARE r ppo.supply_records; p ppo.projects; t ppo.project_tasks; a ppo.activities; f ppo.supply_facts; x jsonb; v integer=CASE WHEN applied THEN 1 ELSE 0 END; ids jsonb; expected_ids jsonb; k text; cmd jsonb; snap jsonb; raw jsonb; ordinal integer=0;
BEGIN
 IF (mc IS NOT NULL) IS DISTINCT FROM (d->'project'->>'topology' IS NOT DISTINCT FROM 'Merge')
  OR (mc IS NOT NULL AND (sc IS NOT NULL OR cc IS NOT NULL OR bc IS NOT NULL))
  OR (mc IS NULL AND (d->'project'->'mergePredecessor' IS NOT NULL OR d->'project'->'mergeSuccessor' IS NOT NULL))
 THEN RAISE EXCEPTION 'Explicit exclusive merge commands and retained predecessor evidence required' USING ERRCODE='23514'; END IF;
 IF mc IS NOT NULL THEN
  SELECT * INTO STRICT t FROM ppo.project_tasks WHERE workspace_id=w AND id=(d->'project'->'mergePredecessor'->>'id')::uuid;
  IF to_jsonb(t) IS DISTINCT FROM d->'project'->'retainedPredecessor'
    OR t.project_id::text IS DISTINCT FROM pc->>'project_id'
    OR t.id::text IN (pc->>'id',mc->>'id')
  THEN RAISE EXCEPTION 'Preserve every native B field and version exactly' USING ERRCODE='23514'; END IF;
 END IF;
 IF (bc IS NOT NULL) IS DISTINCT FROM (d->'project'->>'topology' IS NOT DISTINCT FROM 'Branch')
  OR (bc IS NOT NULL AND cc IS NOT NULL)
 THEN RAISE EXCEPTION 'Explicit branch topology and exclusive third-task command required' USING ERRCODE='23514'; END IF;
 SELECT * INTO STRICT r FROM ppo.supply_records WHERE workspace_id=w AND id=(d->'demand'->>'id')::uuid;
 SELECT * INTO STRICT p FROM ppo.projects WHERE workspace_id=w AND id=(pc->>'project_id')::uuid;
 SELECT * INTO STRICT t FROM ppo.project_tasks WHERE workspace_id=w AND id=(pc->>'id')::uuid;
 SELECT * INTO STRICT a FROM ppo.activities WHERE workspace_id=w AND id=(d->'activity'->>'id')::uuid;
 SELECT * INTO STRICT f FROM ppo.supply_facts WHERE workspace_id=w AND id=(d->'impact'->>'id')::uuid;
 IF r.version<>(d->'demand'->>'version')::integer+v OR r.data IS DISTINCT FROM d->'demand'->'data' OR r.quantity<>(d->'demand'->>'quantity')::numeric
  OR r.owner_id<>(d->'demand'->>'owner_id')::uuid OR r.data->>'origin_kind'<>'Project' OR r.data->>'origin_id'<>p.id::text
  OR r.company_id<>p.company_id OR r.site_id<>p.site_id OR p.version<>(d->'project'->'project'->>'version')::integer+v*(CASE WHEN dc IS NOT NULL THEN 4 WHEN cc IS NOT NULL OR bc IS NOT NULL THEN 3 WHEN sc IS NULL AND mc IS NULL THEN 1 ELSE 2 END)
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

 IF (sc IS NULL) IS DISTINCT FROM (d->'project'->'successor' IS NULL) THEN RAISE EXCEPTION 'Exact successor command and evidence required' USING ERRCODE='23514'; END IF;
 IF sc IS NOT NULL THEN
  IF sc->>'project_id'<>p.id::text OR sc->>'id' IS DISTINCT FROM d->'project'->'successor'->>'id'
   OR sc->>'id'=pc->>'id' OR (sc->>'expected_version')::integer<>(pc->>'expected_version')::integer+1
   OR sc->'start_date'<>'null'::jsonb OR sc->'finish_date'<>'null'::jsonb
   OR EXISTS(SELECT 1 FROM jsonb_each(d->'project'->'successor') z WHERE z.key IN ('id','title','phase','status','milestone','progress','note','owner_id','external_owner_id','dependencies') AND z.value IS DISTINCT FROM sc->z.key)
  THEN RAISE EXCEPTION 'Only exact successor forecast dates are contracted' USING ERRCODE='23514'; END IF;
  SELECT * INTO STRICT t FROM ppo.project_tasks WHERE workspace_id=w AND id=(sc->>'id')::uuid;
  IF t.project_id<>p.id OR t.version<>(d->'project'->'successor'->>'version')::integer+v
   OR (t.title,t.phase,t.status,t.milestone,t.progress,t.note,t.owner_id,t.external_owner_id)
    IS DISTINCT FROM (sc->>'title',sc->>'phase',sc->>'status',(sc->>'milestone')::boolean,(sc->>'progress')::integer,sc->>'note',(sc->>'owner_id')::uuid,(sc->>'external_owner_id')::uuid)
   OR (NOT applied AND (t.start_date::text,t.finish_date::text) IS DISTINCT FROM (d->'project'->'successor'->>'start_date',d->'project'->'successor'->>'finish_date'))
   OR (applied AND (t.start_date IS NOT NULL OR t.finish_date IS NOT NULL))
  THEN RAISE EXCEPTION 'Successor changed outside reviewed dates' USING ERRCODE='23514'; END IF;
 END IF;
 IF (mc IS NULL) IS DISTINCT FROM (d->'project'->'mergeSuccessor' IS NULL) THEN RAISE EXCEPTION 'Exact merge successor command and evidence required' USING ERRCODE='23514'; END IF;
 IF mc IS NOT NULL THEN
  IF mc->>'project_id'<>p.id::text OR mc->>'id' IS DISTINCT FROM d->'project'->'mergeSuccessor'->>'id'
   OR mc->>'id'=pc->>'id' OR (mc->>'expected_version')::integer<>(pc->>'expected_version')::integer+1
   OR mc->'start_date'<>'null'::jsonb OR mc->'finish_date'<>'null'::jsonb
   OR EXISTS(SELECT 1 FROM jsonb_each(d->'project'->'mergeSuccessor') z WHERE z.key IN ('id','title','phase','status','milestone','progress','note','owner_id','external_owner_id','dependencies') AND z.value IS DISTINCT FROM mc->z.key)
  THEN RAISE EXCEPTION 'Only exact merge successor forecast dates are contracted' USING ERRCODE='23514'; END IF;
  SELECT * INTO STRICT t FROM ppo.project_tasks WHERE workspace_id=w AND id=(mc->>'id')::uuid;
  IF t.project_id<>p.id OR t.version<>(d->'project'->'mergeSuccessor'->>'version')::integer+v
   OR (t.title,t.phase,t.status,t.milestone,t.progress,t.note,t.owner_id,t.external_owner_id)
    IS DISTINCT FROM (mc->>'title',mc->>'phase',mc->>'status',(mc->>'milestone')::boolean,(mc->>'progress')::integer,mc->>'note',(mc->>'owner_id')::uuid,(mc->>'external_owner_id')::uuid)
   OR (NOT applied AND (t.start_date::text,t.finish_date::text) IS DISTINCT FROM (d->'project'->'mergeSuccessor'->>'start_date',d->'project'->'mergeSuccessor'->>'finish_date'))
   OR (applied AND (t.start_date IS NOT NULL OR t.finish_date IS NOT NULL))
  THEN RAISE EXCEPTION 'Merge successor changed outside reviewed dates' USING ERRCODE='23514'; END IF;
 END IF;
 IF (cc IS NULL) IS DISTINCT FROM (d->'project'->'chainEnd' IS NULL) THEN RAISE EXCEPTION 'Exact successor command and evidence required' USING ERRCODE='23514'; END IF;
 IF cc IS NOT NULL THEN
  IF cc->>'project_id'<>p.id::text OR cc->>'id' IS DISTINCT FROM d->'project'->'chainEnd'->>'id'
   OR cc->>'id' IN (pc->>'id',sc->>'id') OR sc IS NULL OR (cc->>'expected_version')::integer<>(pc->>'expected_version')::integer+2
   OR cc->'start_date'<>'null'::jsonb OR cc->'finish_date'<>'null'::jsonb
   OR EXISTS(SELECT 1 FROM jsonb_each(d->'project'->'chainEnd') z WHERE z.key IN ('id','title','phase','status','milestone','progress','note','owner_id','external_owner_id','dependencies') AND z.value IS DISTINCT FROM cc->z.key)
  THEN RAISE EXCEPTION 'Only exact successor forecast dates are contracted' USING ERRCODE='23514'; END IF;
  SELECT * INTO STRICT t FROM ppo.project_tasks WHERE workspace_id=w AND id=(cc->>'id')::uuid;
  IF t.project_id<>p.id OR t.version<>(d->'project'->'chainEnd'->>'version')::integer+v
   OR (t.title,t.phase,t.status,t.milestone,t.progress,t.note,t.owner_id,t.external_owner_id)
    IS DISTINCT FROM (cc->>'title',cc->>'phase',cc->>'status',(cc->>'milestone')::boolean,(cc->>'progress')::integer,cc->>'note',(cc->>'owner_id')::uuid,(cc->>'external_owner_id')::uuid)
   OR (NOT applied AND (t.start_date::text,t.finish_date::text) IS DISTINCT FROM (d->'project'->'chainEnd'->>'start_date',d->'project'->'chainEnd'->>'finish_date'))
   OR (applied AND (t.start_date IS NOT NULL OR t.finish_date IS NOT NULL))
  THEN RAISE EXCEPTION 'Successor changed outside reviewed dates' USING ERRCODE='23514'; END IF;
 END IF;
 IF (bc IS NULL) IS DISTINCT FROM (d->'project'->'branchSuccessor' IS NULL) THEN RAISE EXCEPTION 'Exact branch successor command and evidence required' USING ERRCODE='23514'; END IF;
 IF bc IS NOT NULL THEN
  IF bc->>'project_id'<>p.id::text OR bc->>'id' IS DISTINCT FROM d->'project'->'branchSuccessor'->>'id'
   OR bc->>'id' IN (pc->>'id',sc->>'id') OR sc IS NULL OR (bc->>'expected_version')::integer<>(pc->>'expected_version')::integer+2
   OR bc->'start_date'<>'null'::jsonb OR bc->'finish_date'<>'null'::jsonb
   OR EXISTS(SELECT 1 FROM jsonb_each(d->'project'->'branchSuccessor') z WHERE z.key IN ('id','title','phase','status','milestone','progress','note','owner_id','external_owner_id','dependencies') AND z.value IS DISTINCT FROM bc->z.key)
  THEN RAISE EXCEPTION 'Only exact branch successor forecast dates are contracted' USING ERRCODE='23514'; END IF;
  SELECT * INTO STRICT t FROM ppo.project_tasks WHERE workspace_id=w AND id=(bc->>'id')::uuid;
  IF t.project_id<>p.id OR t.version<>(d->'project'->'branchSuccessor'->>'version')::integer+v
   OR (t.title,t.phase,t.status,t.milestone,t.progress,t.note,t.owner_id,t.external_owner_id)
    IS DISTINCT FROM (bc->>'title',bc->>'phase',bc->>'status',(bc->>'milestone')::boolean,(bc->>'progress')::integer,bc->>'note',(bc->>'owner_id')::uuid,(bc->>'external_owner_id')::uuid)
   OR (NOT applied AND (t.start_date::text,t.finish_date::text) IS DISTINCT FROM (d->'project'->'branchSuccessor'->>'start_date',d->'project'->'branchSuccessor'->>'finish_date'))
   OR (applied AND (t.start_date IS NOT NULL OR t.finish_date IS NOT NULL))
  THEN RAISE EXCEPTION 'Branch successor changed outside reviewed dates' USING ERRCODE='23514'; END IF;
 END IF;
 IF (dc IS NOT NULL) IS DISTINCT FROM (d->'project'->>'topology' IS NOT DISTINCT FROM 'Diamond')
   OR (dc IS NOT NULL AND (sc IS NOT NULL OR cc IS NOT NULL OR bc IS NOT NULL OR mc IS NOT NULL))
   OR (dc IS NULL AND d->'project'->'diamond' IS NOT NULL)
 THEN RAISE EXCEPTION 'Explicit exclusive diamond evidence and commands required' USING ERRCODE='23514'; END IF;
 IF dc IS NOT NULL THEN
  IF jsonb_array_length(d->'project'->'diamond'->'nativeTasks')<>4
    OR (SELECT count(DISTINCT value->>'id') FROM jsonb_array_elements(d->'project'->'diamond'->'nativeTasks'))<>4
    OR to_jsonb(p)-ARRAY['version','updated_at','updated_by'] IS DISTINCT FROM (d->'project'->'diamond'->'nativeProject')-ARRAY['version','updated_at','updated_by']
    OR (NOT applied AND to_jsonb(p) IS DISTINCT FROM d->'project'->'diamond'->'nativeProject')
  THEN RAISE EXCEPTION 'Preserve complete native Project context and four distinct tasks' USING ERRCODE='23514'; END IF;
  FOREACH k IN ARRAY ARRAY['a','b','c','d'] LOOP
   cmd=CASE WHEN k='a' THEN pc ELSE dc->k END;
   snap=CASE WHEN k='a' THEN d->'project'->'task' ELSE d->'project'->'diamond'->k END;
   SELECT * INTO STRICT t FROM ppo.project_tasks WHERE workspace_id=w AND id=(cmd->>'id')::uuid;
   SELECT value INTO STRICT raw FROM jsonb_array_elements(d->'project'->'diamond'->'nativeTasks') WHERE value->>'id'=cmd->>'id';
   IF cmd IS NULL OR snap IS NULL OR cmd->>'project_id' IS DISTINCT FROM p.id::text OR cmd->>'id' IS DISTINCT FROM snap->>'id'
    OR (cmd->>'expected_version')::integer IS DISTINCT FROM (pc->>'expected_version')::integer+ordinal
    OR cmd->'start_date' IS DISTINCT FROM 'null'::jsonb OR cmd->'finish_date' IS DISTINCT FROM 'null'::jsonb
    OR EXISTS(SELECT 1 FROM jsonb_each(snap) z WHERE z.key IN ('id','title','phase','status','milestone','progress','note','owner_id','external_owner_id','dependencies') AND z.value IS DISTINCT FROM cmd->z.key)
    OR t.project_id<>p.id OR t.version<>(snap->>'version')::integer+v
    OR to_jsonb(t)-ARRAY['version','project_version','updated_at','updated_by','start_date','finish_date'] IS DISTINCT FROM raw-ARRAY['version','project_version','updated_at','updated_by','start_date','finish_date']
    OR (NOT applied AND to_jsonb(t) IS DISTINCT FROM raw)
    OR (applied AND (t.start_date IS NOT NULL OR t.finish_date IS NOT NULL OR t.project_version<>(pc->>'expected_version')::integer+ordinal+1))
   THEN RAISE EXCEPTION 'Each diamond task permits one exact native forecast withdrawal only' USING ERRCODE='23514'; END IF;
   ordinal=ordinal+1;
  END LOOP;
 END IF;
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

CREATE OR REPLACE FUNCTION ppo.quote_material_guard() RETURNS trigger LANGUAGE plpgsql AS $$
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
 PERFORM ppo.material_position(NEW.workspace_id,d,NEW.project_command,NEW.impact_command,NEW.action='MaterialApply' AND NEW.decision='WithdrawForecast',NEW.successor_command,NEW.chain_end_command,NEW.branch_successor_command,NEW.merge_successor_command,NEW.diamond_commands);
 IF NEW.action='MaterialPropose' THEN
  SELECT id INTO prev FROM ppo.quote_material_events WHERE workspace_id=NEW.workspace_id AND target_id=NEW.target_id AND action='MaterialPropose' ORDER BY sequence DESC LIMIT 1;
  IF NEW.predecessor_id IS DISTINCT FROM prev OR NEW.created_by<>ref.owner_id THEN RAISE EXCEPTION 'Owned exact successor proposal required' USING ERRCODE='23514'; END IF;
  IF EXISTS(SELECT 1 FROM ppo.quote_material_events x WHERE x.workspace_id=NEW.workspace_id AND x.target_id<>NEW.target_id AND x.action='MaterialPropose'
   AND (x.impact_id=NEW.impact_id OR ARRAY[x.task_id,(x.successor_command->>'id')::uuid,(x.chain_end_command->>'id')::uuid,(x.branch_successor_command->>'id')::uuid,(x.merge_successor_command->>'id')::uuid,(x.dependencies->'project'->'mergePredecessor'->>'id')::uuid,(x.diamond_commands->'b'->>'id')::uuid,(x.diamond_commands->'c'->>'id')::uuid,(x.diamond_commands->'d'->>'id')::uuid] && ARRAY[NEW.task_id,(NEW.successor_command->>'id')::uuid,(NEW.chain_end_command->>'id')::uuid,(NEW.branch_successor_command->>'id')::uuid,(NEW.merge_successor_command->>'id')::uuid,(NEW.dependencies->'project'->'mergePredecessor'->>'id')::uuid,(NEW.diamond_commands->'b'->>'id')::uuid,(NEW.diamond_commands->'c'->>'id')::uuid,(NEW.diamond_commands->'d'->>'id')::uuid])
   AND x.id=(SELECT id FROM ppo.quote_material_events WHERE workspace_id=x.workspace_id AND target_id=x.target_id AND action='MaterialPropose' ORDER BY sequence DESC LIMIT 1)
   AND x.referral_id=(SELECT id FROM ppo.quote_supply_events WHERE workspace_id=x.workspace_id AND target_id=x.target_id AND action='Refer' ORDER BY sequence DESC LIMIT 1)
   AND 'Accepted'=(SELECT decision FROM ppo.quote_supply_events WHERE workspace_id=x.workspace_id AND referral_id=x.referral_id AND action='Receive' ORDER BY sequence DESC LIMIT 1)
   AND NOT EXISTS(SELECT 1 FROM ppo.quote_material_events WHERE workspace_id=x.workspace_id AND proposal_id=x.id AND action='MaterialApply'))
  THEN RAISE EXCEPTION 'Competing active material target; return or recover original first' USING ERRCODE='23514'; END IF;
  IF (SELECT count(*)<>count(DISTINCT op) FROM unnest(ARRAY[NEW.project_command->>'operation_id',NEW.impact_command->>'operation_id',NEW.successor_command->>'operation_id',NEW.chain_end_command->>'operation_id',NEW.branch_successor_command->>'operation_id',NEW.merge_successor_command->>'operation_id',NEW.diamond_commands->'b'->>'operation_id',NEW.diamond_commands->'c'->>'operation_id',NEW.diamond_commands->'d'->>'operation_id']) op WHERE op IS NOT NULL) OR EXISTS(
   SELECT 1 FROM ppo.operation_receipts WHERE workspace_id=NEW.workspace_id AND operation_id IN ((NEW.project_command->>'operation_id')::uuid,(NEW.impact_command->>'operation_id')::uuid,(NEW.successor_command->>'operation_id')::uuid,(NEW.chain_end_command->>'operation_id')::uuid,(NEW.branch_successor_command->>'operation_id')::uuid,(NEW.merge_successor_command->>'operation_id')::uuid,(NEW.diamond_commands->'b'->>'operation_id')::uuid,(NEW.diamond_commands->'c'->>'operation_id')::uuid,(NEW.diamond_commands->'d'->>'operation_id')::uuid))
   THEN RAISE EXCEPTION 'Reserve unused distinct native originals' USING ERRCODE='23514'; END IF;
  IF EXISTS(SELECT 1 FROM ppo.quote_material_events x WHERE x.workspace_id=NEW.workspace_id AND x.action='MaterialPropose'
    AND ARRAY[x.project_command->>'operation_id',x.impact_command->>'operation_id',x.successor_command->>'operation_id',x.chain_end_command->>'operation_id',x.branch_successor_command->>'operation_id',x.merge_successor_command->>'operation_id',x.diamond_commands->'b'->>'operation_id',x.diamond_commands->'c'->>'operation_id',x.diamond_commands->'d'->>'operation_id'] && ARRAY[NEW.project_command->>'operation_id',NEW.impact_command->>'operation_id',NEW.successor_command->>'operation_id',NEW.chain_end_command->>'operation_id',NEW.branch_successor_command->>'operation_id',NEW.merge_successor_command->>'operation_id',NEW.diamond_commands->'b'->>'operation_id',NEW.diamond_commands->'c'->>'operation_id',NEW.diamond_commands->'d'->>'operation_id'])
   THEN RAISE EXCEPTION 'Native original already reserved' USING ERRCODE='23514'; END IF;
 ELSE
  SELECT * INTO STRICT prop FROM ppo.quote_material_events WHERE workspace_id=NEW.workspace_id AND target_id=NEW.target_id AND action='MaterialPropose' ORDER BY sequence DESC LIMIT 1;
  IF NEW.proposal_id<>prop.id OR NEW.referral_id<>prop.referral_id OR NEW.receiving_id<>prop.receiving_id OR NEW.proposal_hash<>prop.proposal_hash
   OR NEW.dependencies IS DISTINCT FROM prop.dependencies OR NEW.basis IS DISTINCT FROM prop.basis
   OR NEW.diamond_commands IS DISTINCT FROM prop.diamond_commands
   OR NEW.merge_successor_command IS DISTINCT FROM prop.merge_successor_command OR NEW.branch_successor_command IS DISTINCT FROM prop.branch_successor_command OR NEW.chain_end_command IS DISTINCT FROM prop.chain_end_command OR NEW.successor_command IS DISTINCT FROM prop.successor_command OR NEW.project_command IS DISTINCT FROM prop.project_command OR NEW.impact_command IS DISTINCT FROM prop.impact_command
   OR (NEW.demand_id,NEW.impact_id,NEW.task_id,NEW.allocation_outcome_id) IS DISTINCT FROM (prop.demand_id,prop.impact_id,prop.task_id,prop.allocation_outcome_id)
   OR EXISTS(SELECT 1 FROM ppo.quote_material_events WHERE workspace_id=NEW.workspace_id AND proposal_id=prop.id AND action='MaterialApply')
  THEN RAISE EXCEPTION 'Exact current unapplied proposal required' USING ERRCODE='23514'; END IF;
  IF NEW.action='MaterialReceive' THEN
   SELECT id INTO prev FROM ppo.quote_material_events WHERE workspace_id=NEW.workspace_id AND proposal_id=prop.id AND action='MaterialReceive' AND role=NEW.role ORDER BY sequence DESC LIMIT 1;
   owner=CASE NEW.role WHEN 'DiamondB' THEN (d->'project'->'diamond'->'b'->>'owner_id')::uuid WHEN 'DiamondC' THEN (d->'project'->'diamond'->'c'->>'owner_id')::uuid WHEN 'DiamondD' THEN (d->'project'->'diamond'->'d'->>'owner_id')::uuid WHEN 'Demand' THEN (d->'demand'->>'owner_id')::uuid WHEN 'Project' THEN (d->'project'->'project'->>'coordinator_id')::uuid WHEN 'Task' THEN (d->'project'->'task'->>'owner_id')::uuid WHEN 'MergePredecessor' THEN (d->'project'->'mergePredecessor'->>'owner_id')::uuid WHEN 'MergeSuccessor' THEN (d->'project'->'mergeSuccessor'->>'owner_id')::uuid WHEN 'BranchSuccessor' THEN (d->'project'->'branchSuccessor'->>'owner_id')::uuid WHEN 'ChainEnd' THEN (d->'project'->'chainEnd'->>'owner_id')::uuid WHEN 'Successor' THEN (d->'project'->'successor'->>'owner_id')::uuid ELSE (d->'activity'->>'owner_id')::uuid END;
   IF NEW.created_by IS DISTINCT FROM owner OR NEW.predecessor_id IS DISTINCT FROM prev THEN RAISE EXCEPTION 'Separate exact current owner decision required' USING ERRCODE='23514'; END IF;
  ELSE
   IF NEW.created_by<>ref.owner_id THEN RAISE EXCEPTION 'Only accepted referral owner reviews and applies' USING ERRCODE='23514'; END IF;
   FOREACH k IN ARRAY ARRAY['Demand','Project','Task','MaterialAction'] || CASE WHEN NEW.successor_command IS NULL THEN ARRAY[]::text[] ELSE ARRAY['Successor'] END || CASE WHEN NEW.chain_end_command IS NULL THEN ARRAY[]::text[] ELSE ARRAY['ChainEnd'] END || CASE WHEN NEW.branch_successor_command IS NULL THEN ARRAY[]::text[] ELSE ARRAY['BranchSuccessor'] END || CASE WHEN NEW.merge_successor_command IS NULL THEN ARRAY[]::text[] ELSE ARRAY['MergePredecessor','MergeSuccessor'] END || CASE WHEN NEW.diamond_commands IS NULL THEN ARRAY[]::text[] ELSE ARRAY['DiamondB','DiamondC','DiamondD'] END LOOP
    SELECT * INTO received FROM ppo.quote_material_events WHERE workspace_id=NEW.workspace_id AND proposal_id=prop.id AND action='MaterialReceive' AND role=k ORDER BY sequence DESC LIMIT 1;
    IF NEW.decision='WithdrawForecast' AND (received.id IS NULL OR received.decision<>'Accepted') THEN RAISE EXCEPTION 'Separate independent acceptance for every affected owner required' USING ERRCODE='23514'; END IF;
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
     OR (NEW.successor_command IS NULL AND NEW.merge_successor_command IS NULL AND NEW.diamond_commands IS NULL AND EXISTS(SELECT 1 FROM ppo.project_dependencies WHERE workspace_id=NEW.workspace_id AND (task_id=NEW.task_id OR predecessor_id=NEW.task_id)))
     OR (NEW.successor_command IS NOT NULL AND (
       d->'project'->'successor'->>'status'<>'Planned' OR (d->'project'->'successor'->>'progress')::integer<>0
       OR (d->'project'->'successor'->>'milestone')::boolean OR d->'project'->'successor'->>'owner_id' IS NULL
       OR d->'project'->'successor'->>'external_owner_id' IS NOT NULL
       OR d->'project'->'successor'->>'start_date' IS NULL OR d->'project'->'successor'->>'finish_date' IS NULL
       OR NOT EXISTS(SELECT 1 FROM ppo.project_dependencies WHERE workspace_id=NEW.workspace_id AND project_id=(NEW.project_command->>'project_id')::uuid AND predecessor_id=NEW.task_id AND task_id=(NEW.successor_command->>'id')::uuid AND kind IN ('FS','SS'))
       OR (SELECT count(*) FROM ppo.project_dependencies WHERE workspace_id=NEW.workspace_id AND (task_id IN (NEW.task_id,(NEW.successor_command->>'id')::uuid,(NEW.chain_end_command->>'id')::uuid,(NEW.branch_successor_command->>'id')::uuid) OR predecessor_id IN (NEW.task_id,(NEW.successor_command->>'id')::uuid,(NEW.chain_end_command->>'id')::uuid,(NEW.branch_successor_command->>'id')::uuid)))<>CASE WHEN NEW.chain_end_command IS NULL AND NEW.branch_successor_command IS NULL THEN 1 ELSE 2 END))
     OR (NEW.chain_end_command IS NOT NULL AND (
       d->'project'->'chainEnd'->>'status'<>'Planned' OR (d->'project'->'chainEnd'->>'progress')::integer<>0
       OR (d->'project'->'chainEnd'->>'milestone')::boolean OR d->'project'->'chainEnd'->>'owner_id' IS NULL
       OR d->'project'->'chainEnd'->>'external_owner_id' IS NOT NULL
       OR d->'project'->'chainEnd'->>'start_date' IS NULL OR d->'project'->'chainEnd'->>'finish_date' IS NULL
       OR NOT EXISTS(SELECT 1 FROM ppo.project_dependencies WHERE workspace_id=NEW.workspace_id AND project_id=(NEW.project_command->>'project_id')::uuid AND predecessor_id=(NEW.successor_command->>'id')::uuid AND task_id=(NEW.chain_end_command->>'id')::uuid AND kind IN ('FS','SS'))))
     OR (NEW.branch_successor_command IS NOT NULL AND (
       d->'project'->'branchSuccessor'->>'status'<>'Planned' OR (d->'project'->'branchSuccessor'->>'progress')::integer<>0
       OR (d->'project'->'branchSuccessor'->>'milestone')::boolean OR d->'project'->'branchSuccessor'->>'owner_id' IS NULL
       OR d->'project'->'branchSuccessor'->>'external_owner_id' IS NOT NULL
       OR d->'project'->'branchSuccessor'->>'start_date' IS NULL OR d->'project'->'branchSuccessor'->>'finish_date' IS NULL
       OR NOT EXISTS(SELECT 1 FROM ppo.project_dependencies WHERE workspace_id=NEW.workspace_id AND project_id=(NEW.project_command->>'project_id')::uuid AND predecessor_id=NEW.task_id AND task_id=(NEW.branch_successor_command->>'id')::uuid AND kind IN ('FS','SS'))))
     OR (NEW.merge_successor_command IS NOT NULL AND (
       (d->>'unmet')::numeric<=0 OR d->'project'->'retainedIssues'<>'[]'::jsonb
       OR EXISTS(SELECT 1 FROM jsonb_array_elements(jsonb_build_array(d->'project'->'mergePredecessor',d->'project'->'mergeSuccessor')) t WHERE
         t->>'status'<>'Planned' OR (t->>'progress')::integer<>0 OR (t->>'milestone')::boolean
         OR t->>'owner_id' IS NULL OR t->>'external_owner_id' IS NOT NULL OR t->>'start_date' IS NULL OR t->>'finish_date' IS NULL
         OR (t->>'finish_date')::date<(t->>'start_date')::date)
       OR d->'project'->'mergePredecessor'->'dependencies'<>'[]'::jsonb
       OR extract(isodow FROM (d->'project'->'mergePredecessor'->>'start_date')::date)>5
       OR extract(isodow FROM (d->'project'->'mergePredecessor'->>'finish_date')::date)>5
       OR (SELECT count(*) FROM ppo.project_dependencies WHERE workspace_id=NEW.workspace_id AND
         (task_id IN (NEW.task_id,(NEW.merge_successor_command->>'id')::uuid,(d->'project'->'mergePredecessor'->>'id')::uuid) OR
          predecessor_id IN (NEW.task_id,(NEW.merge_successor_command->>'id')::uuid,(d->'project'->'mergePredecessor'->>'id')::uuid)))<>2
       OR NOT EXISTS(SELECT 1 FROM ppo.project_dependencies WHERE workspace_id=NEW.workspace_id AND project_id=(NEW.project_command->>'project_id')::uuid
         AND task_id=(NEW.merge_successor_command->>'id')::uuid AND predecessor_id=NEW.task_id AND kind IN ('FS','SS'))
       OR NOT EXISTS(SELECT 1 FROM ppo.project_dependencies WHERE workspace_id=NEW.workspace_id AND project_id=(NEW.project_command->>'project_id')::uuid
         AND task_id=(NEW.merge_successor_command->>'id')::uuid AND predecessor_id=(d->'project'->'mergePredecessor'->>'id')::uuid AND kind IN ('FS','SS'))))
     OR (NEW.diamond_commands IS NOT NULL AND (
       (d->>'unmet')::numeric<=0
       OR EXISTS(SELECT 1 FROM jsonb_array_elements(d->'project'->'diamond'->'nativeTasks') t WHERE t->>'status'<>'Planned' OR (t->>'progress')::integer<>0 OR (t->>'milestone')::boolean OR t->>'owner_id' IS NULL OR t->>'external_owner_id' IS NOT NULL OR t->>'start_date' IS NULL OR t->>'finish_date' IS NULL)
       OR (SELECT count(*) FROM ppo.project_dependencies WHERE workspace_id=NEW.workspace_id AND (task_id IN (NEW.task_id,(NEW.diamond_commands->'b'->>'id')::uuid,(NEW.diamond_commands->'c'->>'id')::uuid,(NEW.diamond_commands->'d'->>'id')::uuid) OR predecessor_id IN (NEW.task_id,(NEW.diamond_commands->'b'->>'id')::uuid,(NEW.diamond_commands->'c'->>'id')::uuid,(NEW.diamond_commands->'d'->>'id')::uuid)))<>4
       OR EXISTS(SELECT 1 FROM (VALUES (NEW.task_id,(NEW.diamond_commands->'b'->>'id')::uuid),(NEW.task_id,(NEW.diamond_commands->'c'->>'id')::uuid),((NEW.diamond_commands->'b'->>'id')::uuid,(NEW.diamond_commands->'d'->>'id')::uuid),((NEW.diamond_commands->'c'->>'id')::uuid,(NEW.diamond_commands->'d'->>'id')::uuid)) edge(prior,next)
         WHERE NOT EXISTS(SELECT 1 FROM ppo.project_dependencies WHERE workspace_id=NEW.workspace_id AND project_id=(NEW.project_command->>'project_id')::uuid AND predecessor_id=edge.prior AND task_id=edge.next AND kind IN ('FS','SS')))))
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

CREATE OR REPLACE FUNCTION ppo.quote_material_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE receipt jsonb; op uuid; family text; target uuid; n integer=0; pc jsonb; tasks integer=CASE WHEN NEW.diamond_commands IS NOT NULL THEN 4 WHEN NEW.chain_end_command IS NOT NULL OR NEW.branch_successor_command IS NOT NULL THEN 3 WHEN NEW.successor_command IS NULL AND NEW.merge_successor_command IS NULL THEN 1 ELSE 2 END;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM ppo.operation_receipts r JOIN ppo.audit_events a ON (a.workspace_id,a.actor_id,a.operation_id)=(r.workspace_id,r.actor_id,r.operation_id)
 JOIN ppo.outbox_jobs j ON (j.workspace_id,j.actor_id,j.operation_id)=(r.workspace_id,r.actor_id,r.operation_id)
 WHERE r.workspace_id=NEW.workspace_id AND r.actor_id=NEW.created_by AND r.operation_id=NEW.operation_id AND r.record_id=NEW.revision_id
 AND (r.result->>'record_version')::integer=NEW.sequence AND a.details->>'material_event_id'=NEW.id::text AND a.details->>'command'='QuoteSupply:'||NEW.action AND a.reason=NEW.reason AND j.kind='QuotationSupplyRecorded')
 THEN RAISE EXCEPTION 'Material evidence requires atomic original audit receipt and outbox' USING ERRCODE='23514'; END IF;
 IF NEW.action='MaterialApply' AND NEW.decision='WithdrawForecast' THEN
  FOR receipt IN SELECT value FROM jsonb_array_elements(NEW.native_receipts) LOOP
   pc=CASE WHEN n=0 THEN NEW.project_command WHEN NEW.diamond_commands IS NOT NULL THEN NEW.diamond_commands->(ARRAY['b','c','d'])[n] WHEN n=1 THEN coalesce(NEW.merge_successor_command,NEW.successor_command) ELSE coalesce(NEW.chain_end_command,NEW.branch_successor_command) END;
   op=CASE WHEN n<tasks THEN (pc->>'operation_id')::uuid ELSE (NEW.impact_command->>'operation_id')::uuid END;
   family=CASE WHEN n<tasks THEN 'SaveProjectTask' ELSE 'Supply:Fact:Impact' END;
   target=CASE WHEN n<tasks THEN (pc->>'project_id')::uuid ELSE NEW.demand_id END;
   IF NOT EXISTS(SELECT 1 FROM ppo.operation_receipts r JOIN ppo.audit_events a ON (a.workspace_id,a.actor_id,a.operation_id)=(r.workspace_id,r.actor_id,r.operation_id)
    WHERE r.workspace_id=NEW.workspace_id AND r.actor_id=NEW.created_by AND r.operation_id=op AND r.record_id=target AND r.result=receipt
    AND a.details->>'command'=family AND a.details->>'material_outcome_id'=NEW.id::text AND a.details->>'material_review_id'=NEW.review_id::text)
    THEN RAISE EXCEPTION 'Verified exact owning workflow receipts required' USING ERRCODE='23514'; END IF;
   IF n<tasks AND NOT EXISTS(SELECT 1 FROM ppo.project_schedule_events WHERE workspace_id=NEW.workspace_id AND operation_id=op
    AND project_id=target AND project_version=(pc->>'expected_version')::integer+1 AND task_snapshot->>'id'=pc->>'id'
    AND task_snapshot->'start_date'='null'::jsonb AND task_snapshot->'finish_date'='null'::jsonb)
   THEN RAISE EXCEPTION 'Every native task effect requires exact schedule history' USING ERRCODE='23514'; END IF;
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

CREATE OR REPLACE FUNCTION ppo.material_reserved_receipt() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE prop ppo.quote_material_events;
BEGIN
 SELECT * INTO prop FROM ppo.quote_material_events WHERE workspace_id=NEW.workspace_id AND action='MaterialPropose'
 AND (project_command->>'operation_id'=NEW.operation_id::text OR merge_successor_command->>'operation_id'=NEW.operation_id::text OR branch_successor_command->>'operation_id'=NEW.operation_id::text OR chain_end_command->>'operation_id'=NEW.operation_id::text OR successor_command->>'operation_id'=NEW.operation_id::text OR diamond_commands->'b'->>'operation_id'=NEW.operation_id::text OR diamond_commands->'c'->>'operation_id'=NEW.operation_id::text OR diamond_commands->'d'->>'operation_id'=NEW.operation_id::text OR impact_command->>'operation_id'=NEW.operation_id::text);
 IF prop.id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM ppo.quote_material_events e WHERE e.workspace_id=NEW.workspace_id AND e.proposal_id=prop.id AND e.action='MaterialApply'
  AND e.decision='WithdrawForecast' AND e.created_by=NEW.actor_id AND e.native_receipts @> jsonb_build_array(NEW.result))
 THEN RAISE EXCEPTION 'Reserved native original belongs to exact received material application' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
