-- Exact ES-07 subordinate evidence and native Supply demand lineage. No prior bytes/grants change.
DO $$ DECLARE definition text; BEGIN
 SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid='ppo.outbox_jobs'::regclass AND conname='ck_outbox_kind';
 ALTER TABLE ppo.outbox_jobs DROP CONSTRAINT ck_outbox_kind;
 EXECUTE format('ALTER TABLE ppo.outbox_jobs ADD CONSTRAINT ck_outbox_kind CHECK ((%s) OR kind = ''QuotationConversionRecorded'')',substring(definition from 8 for length(definition)-8));
END $$;
CREATE TABLE ppo.quote_conversion_events (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,quote_id uuid NOT NULL,revision_id uuid NOT NULL,issue_id uuid NOT NULL,response_id uuid NOT NULL,preparation_id uuid NOT NULL,
 sequence integer NOT NULL CHECK(sequence>0),action text NOT NULL CHECK(action IN ('Receive','Resolve','Plan','Execute')),predecessor_id uuid,
 output_hash text NOT NULL CHECK(output_hash ~ '^[a-f0-9]{64}$'),receiving jsonb,resolution jsonb,plan jsonb,plan_hash text,plan_id uuid,
 evidence text NOT NULL CHECK(length(btrim(evidence)) BETWEEN 1 AND 4000),reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),
 created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),operation_id uuid NOT NULL,
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,quote_id,id),UNIQUE(workspace_id,revision_id,id),UNIQUE(workspace_id,revision_id,sequence),UNIQUE(workspace_id,created_by,operation_id),
 FOREIGN KEY(workspace_id,quote_id,revision_id) REFERENCES ppo.quote_release_bases(workspace_id,quote_id,revision_id),
 FOREIGN KEY(workspace_id,quote_id,issue_id) REFERENCES ppo.quote_release_events(workspace_id,quote_id,id),
 FOREIGN KEY(workspace_id,revision_id,response_id) REFERENCES ppo.quote_response_events(workspace_id,revision_id,id),
 FOREIGN KEY(workspace_id,revision_id,preparation_id) REFERENCES ppo.quote_response_events(workspace_id,revision_id,id),
 FOREIGN KEY(workspace_id,revision_id,predecessor_id) REFERENCES ppo.quote_conversion_events(workspace_id,revision_id,id),
 FOREIGN KEY(workspace_id,revision_id,plan_id) REFERENCES ppo.quote_conversion_events(workspace_id,revision_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 CHECK((action='Receive')=(receiving IS NOT NULL)),CHECK((action='Resolve')=(resolution IS NOT NULL)),CHECK((action='Plan')=(plan IS NOT NULL)),CHECK((action='Plan')=(plan_hash IS NOT NULL)),CHECK((action='Execute')=(plan_id IS NOT NULL)),
 CHECK(plan_hash IS NULL OR plan_hash ~ '^[a-f0-9]{64}$'),
 CHECK(receiving IS NULL OR (jsonb_typeof(receiving)='object' AND coalesce(receiving->>'decision','') IN ('Received','Held','Returned') AND coalesce(length(receiving->>'next_action'),0) BETWEEN 1 AND 1000 AND receiving->>'owner_id' IS NOT NULL AND receiving->>'due_date' IS NOT NULL)),
 CHECK(resolution IS NULL OR (jsonb_typeof(resolution)='object' AND coalesce(resolution->>'state','') IN ('Missing','Ambiguous','Obsolete','Incompatible','OneOff') AND coalesce(length(btrim(resolution->>'label')),0) BETWEEN 1 AND 200 AND coalesce(length(resolution->>'unit'),0) BETWEEN 1 AND 40 AND coalesce(resolution->>'entity','')='SupplyDemand' AND resolution ?& ARRAY['line_id','item_id','company_id','external_mapping'] AND resolution->'external_mapping'='null'::jsonb)),
 CHECK(plan IS NULL OR (jsonb_typeof(plan)='object' AND coalesce(jsonb_typeof(plan->'basis'),'')='object' AND coalesce(jsonb_typeof(plan->'commands'),'')='array' AND jsonb_array_length(plan->'commands') BETWEEN 1 AND 100 AND plan->>'basis_hash' IS NOT NULL))
);
CREATE UNIQUE INDEX quote_conversion_execute_once ON ppo.quote_conversion_events(workspace_id,quote_id) WHERE action='Execute';
CREATE TRIGGER immutable_conversion BEFORE UPDATE OR DELETE ON ppo.quote_conversion_events FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.quote_conversion_targets (
 workspace_id uuid NOT NULL,quote_id uuid NOT NULL,revision_id uuid NOT NULL,plan_id uuid NOT NULL,execution_id uuid NOT NULL,line_id uuid NOT NULL,target_id uuid NOT NULL,operation_id uuid NOT NULL,
 PRIMARY KEY(workspace_id,quote_id,line_id),UNIQUE(workspace_id,target_id),UNIQUE(workspace_id,operation_id),
 FOREIGN KEY(workspace_id,quote_id,plan_id) REFERENCES ppo.quote_conversion_events(workspace_id,quote_id,id),
 FOREIGN KEY(workspace_id,revision_id,execution_id) REFERENCES ppo.quote_conversion_events(workspace_id,revision_id,id) DEFERRABLE INITIALLY DEFERRED,
 FOREIGN KEY(workspace_id,target_id) REFERENCES ppo.supply_records(workspace_id,id)
);
CREATE TRIGGER immutable_conversion_target BEFORE UPDATE OR DELETE ON ppo.quote_conversion_targets FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.quote_conversion_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE issued ppo.quote_release_events; prep ppo.quote_response_events; response ppo.quote_response_events; previous ppo.quote_conversion_events; q ppo.draft_quote_revisions; v ppo.estimate_versions; line jsonb; seq integer; current_issue uuid; current_response uuid; held boolean; b jsonb; r ppo.quote_conversion_events; x jsonb; commands jsonb; cmd jsonb; recipient jsonb; n integer;
BEGIN
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 SELECT * INTO STRICT issued FROM ppo.quote_release_events WHERE workspace_id=NEW.workspace_id AND id=NEW.issue_id;
 SELECT * INTO STRICT prep FROM ppo.quote_response_events WHERE workspace_id=NEW.workspace_id AND id=NEW.preparation_id;
 SELECT * INTO STRICT response FROM ppo.quote_response_events WHERE workspace_id=NEW.workspace_id AND id=NEW.response_id;
 SELECT * INTO STRICT q FROM ppo.draft_quote_revisions WHERE workspace_id=NEW.workspace_id AND id=NEW.revision_id;
 SELECT * INTO STRICT v FROM ppo.estimate_versions WHERE workspace_id=NEW.workspace_id AND id=q.estimate_version_id;
 IF issued.action<>'Issue' OR issued.revision_id<>NEW.revision_id OR issued.output_hash<>NEW.output_hash OR prep.action<>'Prepare' OR prep.response_id<>NEW.response_id OR prep.issue_id<>NEW.issue_id THEN RAISE EXCEPTION 'Exact preparation issue output and response required' USING ERRCODE='23514'; END IF;
 SELECT coalesce(max(sequence),0) INTO seq FROM ppo.quote_conversion_events WHERE workspace_id=NEW.workspace_id AND revision_id=NEW.revision_id;
 IF NEW.sequence<>seq+1 THEN RAISE EXCEPTION 'Next conversion sequence required' USING ERRCODE='23514'; END IF;
 SELECT id INTO current_issue FROM ppo.quote_release_events WHERE workspace_id=NEW.workspace_id AND quote_id=NEW.quote_id AND action='Issue' ORDER BY sequence DESC LIMIT 1;
 SELECT id INTO current_response FROM ppo.quote_response_events WHERE workspace_id=NEW.workspace_id AND revision_id=NEW.revision_id AND action IN ('Record','Correct') ORDER BY sequence DESC LIMIT 1;
 SELECT EXISTS(SELECT 1 FROM ppo.quote_response_events e WHERE e.workspace_id=NEW.workspace_id AND e.revision_id=NEW.revision_id AND (e.report->>'outcome'='Negotiation' OR (e.report->>'outcome'='Clarification' AND NOT EXISTS(SELECT 1 FROM ppo.quote_response_events c WHERE c.workspace_id=e.workspace_id AND c.response_id=e.id AND c.action IN ('Correct','Confirm'))))) INTO held;
 IF (NEW.action<>'Receive' OR NEW.receiving->>'decision'='Received') AND (current_issue<>NEW.issue_id OR current_response<>NEW.response_id OR held OR response.report->>'outcome' IS DISTINCT FROM 'Accepted' OR nullif(response.report->>'conditions','') IS NOT NULL) THEN RAISE EXCEPTION 'Current unconditioned exact response required' USING ERRCODE='23514'; END IF;
 IF NEW.action IN ('Receive','Plan') THEN
  SELECT * INTO previous FROM ppo.quote_conversion_events WHERE workspace_id=NEW.workspace_id AND revision_id=NEW.revision_id AND action=NEW.action ORDER BY sequence DESC LIMIT 1;
  IF NEW.predecessor_id IS DISTINCT FROM previous.id THEN RAISE EXCEPTION 'Explicit preceding decision required' USING ERRCODE='23514'; END IF;
 END IF;
 IF NEW.action='Receive' THEN
  PERFORM 1 FROM ppo.users WHERE workspace_id=NEW.workspace_id AND id=(NEW.receiving->>'owner_id')::uuid AND active;
  IF NOT FOUND THEN RAISE EXCEPTION 'Active receiving owner required' USING ERRCODE='23514'; END IF;
  PERFORM (NEW.receiving->>'due_date')::date;
 ELSIF NEW.action='Resolve' THEN
  SELECT l INTO line FROM jsonb_array_elements(v.lines) l WHERE l->>'id'=NEW.resolution->>'line_id' AND l->>'category'='Product' AND EXISTS(SELECT 1 FROM jsonb_array_elements(q.choices) ch WHERE ch->>'line_id'=l->>'id' AND ch->>'included'='true');
  IF line IS NULL OR NEW.resolution->>'company_id' IS DISTINCT FROM q.company_id::text OR NEW.resolution->>'item_id' IS NULL THEN RAISE EXCEPTION 'Exact included product company identity required' USING ERRCODE='23514'; END IF;
  PERFORM (NEW.resolution->>'item_id')::uuid;
  SELECT * INTO previous FROM ppo.quote_conversion_events WHERE workspace_id=NEW.workspace_id AND revision_id=NEW.revision_id AND action='Resolve' AND resolution->>'line_id'=NEW.resolution->>'line_id' ORDER BY sequence DESC LIMIT 1;
  IF NEW.predecessor_id IS DISTINCT FROM previous.id OR (previous.id IS NOT NULL AND NEW.resolution->>'item_id' IS DISTINCT FROM previous.resolution->>'item_id') THEN RAISE EXCEPTION 'Preserve original item identity and preceding resolution' USING ERRCODE='23514'; END IF;
  IF NEW.resolution->>'state'='OneOff' AND (NEW.resolution->>'unit' IS DISTINCT FROM line->>'unit' OR length(line->>'unit')>30) THEN RAISE EXCEPTION 'Exact compatible unit required' USING ERRCODE='23514'; END IF;
 ELSE
  IF EXISTS(SELECT 1 FROM ppo.quote_conversion_events WHERE workspace_id=NEW.workspace_id AND quote_id=NEW.quote_id AND action='Execute') THEN RAISE EXCEPTION 'Original downstream facts already exist' USING ERRCODE='23514'; END IF;
  IF NEW.action='Execute' THEN
   SELECT * INTO previous FROM ppo.quote_conversion_events WHERE workspace_id=NEW.workspace_id AND revision_id=NEW.revision_id AND action='Plan' ORDER BY sequence DESC LIMIT 1;
   IF previous.id IS DISTINCT FROM NEW.plan_id THEN RAISE EXCEPTION 'Latest exact reviewed plan required' USING ERRCODE='23514'; END IF;
   b=previous.plan->'basis';commands=previous.plan->'commands';
  ELSE b=NEW.plan->'basis';commands=NEW.plan->'commands'; END IF;
  SELECT * INTO r FROM ppo.quote_conversion_events WHERE workspace_id=NEW.workspace_id AND revision_id=NEW.revision_id AND action='Receive' ORDER BY sequence DESC LIMIT 1;
  IF r.receiving->>'decision' IS DISTINCT FROM 'Received' OR r.id::text IS DISTINCT FROM b->>'receiving_id' OR r.preparation_id<>NEW.preparation_id OR r.response_id<>NEW.response_id OR b->>'issue_id' IS DISTINCT FROM NEW.issue_id::text OR b->>'output_hash' IS DISTINCT FROM NEW.output_hash OR b->>'response_id' IS DISTINCT FROM NEW.response_id::text OR b->>'preparation_id' IS DISTINCT FROM NEW.preparation_id::text OR b->>'estimate_version_id' IS DISTINCT FROM v.id::text OR b->>'estimate_hash' IS DISTINCT FROM v.content_hash OR b->'commercial' IS DISTINCT FROM q.safe_snapshot OR b->'follow_up' IS DISTINCT FROM r.receiving THEN RAISE EXCEPTION 'Exact receiving source and commercial basis required' USING ERRCODE='23514'; END IF;
  IF b->'source_lines' IS DISTINCT FROM (SELECT jsonb_agg(s.l ORDER BY s.n) FROM jsonb_array_elements(v.lines) WITH ORDINALITY s(l,n) WHERE EXISTS(SELECT 1 FROM jsonb_array_elements(q.choices) ch WHERE ch->>'line_id'=l->>'id' AND ch->>'included'='true')) THEN RAISE EXCEPTION 'Preserve every accepted source line' USING ERRCODE='23514'; END IF;
  IF b->'target'->>'company' IS DISTINCT FROM q.company_id::text OR b->'target'->>'entity' IS DISTINCT FROM 'SupplyDemand' OR b->'target'->>'provider' IS DISTINCT FROM 'Synthetic' OR b->'target'->>'configuration' IS DISTINCT FROM 'PPO-Native' THEN RAISE EXCEPTION 'Native target identity required' USING ERRCODE='23514'; END IF;
  SELECT basis->'recipient' INTO STRICT recipient FROM ppo.quote_release_bases WHERE workspace_id=NEW.workspace_id AND revision_id=NEW.revision_id;
  IF b->'target'->>'site_id' IS DISTINCT FROM recipient->>'site_id' OR b->'target'->>'customer_id' IS DISTINCT FROM recipient->>'organisation_id' OR b->'target'->>'timezone' IS DISTINCT FROM (SELECT timezone FROM ppo.sites WHERE workspace_id=NEW.workspace_id AND id=(recipient->>'site_id')::uuid) THEN RAISE EXCEPTION 'Exact current target site customer and timezone required' USING ERRCODE='23514'; END IF;
  IF jsonb_array_length(b->'lines') IS DISTINCT FROM (SELECT count(*)::integer FROM jsonb_array_elements(b->'source_lines') l WHERE l->>'category'='Product') THEN RAISE EXCEPTION 'Every product requires exactly one target' USING ERRCODE='23514'; END IF;
  IF jsonb_array_length(commands) IS DISTINCT FROM jsonb_array_length(b->'lines') OR (SELECT count(DISTINCT value->>'id') FROM jsonb_array_elements(commands))<>jsonb_array_length(commands) OR (SELECT count(DISTINCT value->>'operation_id') FROM jsonb_array_elements(commands))<>jsonb_array_length(commands) THEN RAISE EXCEPTION 'Distinct exact target commands required' USING ERRCODE='23514'; END IF;
  FOR line IN SELECT l FROM jsonb_array_elements(b->'source_lines') l WHERE l->>'category'='Product' LOOP
   SELECT * INTO r FROM ppo.quote_conversion_events WHERE workspace_id=NEW.workspace_id AND revision_id=NEW.revision_id AND action='Resolve' AND resolution->>'line_id'=line->>'id' ORDER BY sequence DESC LIMIT 1;
   SELECT l INTO x FROM jsonb_array_elements(b->'lines') l WHERE l->>'line_id'=line->>'id';
   IF r.resolution->>'state' IS DISTINCT FROM 'OneOff' OR x IS NULL OR x->>'resolution_id' IS DISTINCT FROM r.id::text OR x->>'item_id' IS DISTINCT FROM r.resolution->>'item_id' OR x->>'quantity' IS DISTINCT FROM line->>'quantity' OR x->>'unit' IS DISTINCT FROM line->>'unit' OR x->>'label' IS DISTINCT FROM r.resolution->>'label' OR x->>'item' IS DISTINCT FROM 'SYN-ONEOFF-'||(r.resolution->>'item_id') THEN RAISE EXCEPTION 'Current exact resolved target line required' USING ERRCODE='23514'; END IF;
  END LOOP;
  FOR n IN 0..jsonb_array_length(commands)-1 LOOP
   cmd=commands->n;x=b->'lines'->n;
   IF cmd->>'kind' IS DISTINCT FROM 'Demand' OR cmd->>'company_id' IS DISTINCT FROM b->'target'->>'company' OR cmd->>'site_id' IS DISTINCT FROM b->'target'->>'site_id' OR cmd->>'item' IS DISTINCT FROM x->>'item' OR cmd->>'unit' IS DISTINCT FROM x->>'unit' OR (cmd->>'quantity')::numeric IS DISTINCT FROM (x->>'quantity')::numeric OR cmd->>'owner_id' IS DISTINCT FROM b->'follow_up'->>'owner_id' OR cmd->'data'->>'demand_class' IS DISTINCT FROM 'Forecast' OR cmd->'data'->>'customer_id' IS DISTINCT FROM b->'target'->>'customer_id' OR cmd->'data'->>'quote_reference' IS DISTINCT FROM NEW.issue_id::text OR cmd->'data'->>'handover_reference' IS DISTINCT FROM b->>'receiving_id' OR cmd->'data'->>'source_revision' IS DISTINCT FROM v.id::text THEN RAISE EXCEPTION 'Frozen native command must preserve exact source and target scope' USING ERRCODE='23514'; END IF;
   PERFORM (cmd->>'id')::uuid;PERFORM (cmd->>'operation_id')::uuid;
  END LOOP;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER quote_conversion_guard BEFORE INSERT ON ppo.quote_conversion_events FOR EACH ROW EXECUTE FUNCTION ppo.quote_conversion_guard();
CREATE FUNCTION ppo.quote_conversion_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE frozen jsonb; cmd jsonb; t record; original jsonb;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM ppo.audit_events a JOIN ppo.operation_receipts r ON (r.workspace_id,r.actor_id,r.operation_id)=(a.workspace_id,a.actor_id,a.operation_id) JOIN ppo.outbox_jobs j ON (j.workspace_id,j.actor_id,j.operation_id)=(a.workspace_id,a.actor_id,a.operation_id)
 WHERE a.workspace_id=NEW.workspace_id AND a.actor_id=NEW.created_by AND a.operation_id=NEW.operation_id AND a.object_type='DraftQuoteRevision' AND a.object_id=NEW.revision_id AND a.details->>'conversion_event_id'=NEW.id::text AND a.details->>'command'='QuoteConversion:'||NEW.action AND a.reason=NEW.reason AND r.record_id=NEW.revision_id AND (r.result->>'record_version')::integer=NEW.sequence AND j.kind='QuotationConversionRecorded') THEN RAISE EXCEPTION 'Conversion requires atomic original evidence' USING ERRCODE='23514'; END IF;
 IF NEW.action='Execute' THEN
  SELECT plan INTO STRICT frozen FROM ppo.quote_conversion_events WHERE workspace_id=NEW.workspace_id AND id=NEW.plan_id;
  IF (SELECT count(*) FROM ppo.quote_conversion_targets WHERE workspace_id=NEW.workspace_id AND execution_id=NEW.id)<>jsonb_array_length(frozen->'commands') THEN RAISE EXCEPTION 'All target effects must commit atomically' USING ERRCODE='23514'; END IF;
  FOR cmd IN SELECT * FROM jsonb_array_elements(frozen->'commands') LOOP
   SELECT * INTO STRICT t FROM ppo.quote_conversion_targets WHERE workspace_id=NEW.workspace_id AND execution_id=NEW.id AND target_id=(cmd->>'id')::uuid AND operation_id=(cmd->>'operation_id')::uuid AND plan_id=NEW.plan_id;
   SELECT snapshot INTO STRICT original FROM ppo.supply_revisions WHERE workspace_id=NEW.workspace_id AND record_id=t.target_id AND version=1;
   IF original->>'company_id' IS DISTINCT FROM cmd->>'company_id' OR original->>'site_id' IS DISTINCT FROM cmd->>'site_id' OR original->>'item' IS DISTINCT FROM cmd->>'item' OR original->>'unit' IS DISTINCT FROM cmd->>'unit' OR (original->>'quantity')::numeric IS DISTINCT FROM (cmd->>'quantity')::numeric OR original->'data' IS DISTINCT FROM cmd->'data' OR original->'external_key' IS DISTINCT FROM cmd->'external_key' OR original->>'created_by' IS DISTINCT FROM NEW.created_by::text THEN RAISE EXCEPTION 'Original target must match frozen command' USING ERRCODE='23514'; END IF;
   IF NOT EXISTS(SELECT 1 FROM ppo.operation_receipts r JOIN ppo.audit_events a ON (a.workspace_id,a.actor_id,a.operation_id)=(r.workspace_id,r.actor_id,r.operation_id) WHERE r.workspace_id=NEW.workspace_id AND r.actor_id=NEW.created_by AND r.operation_id=t.operation_id AND r.record_id=t.target_id AND a.details->>'conversion_plan_id'=NEW.plan_id::text AND a.details->>'source_line_id'=t.line_id::text) THEN RAISE EXCEPTION 'Original native target receipt required' USING ERRCODE='23514'; END IF;
  END LOOP;
 END IF;
 RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER quote_conversion_evidence AFTER INSERT ON ppo.quote_conversion_events DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.quote_conversion_evidence();
CREATE FUNCTION ppo.quote_conversion_target_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE e ppo.quote_conversion_events; p ppo.quote_conversion_events;
BEGIN
 SELECT * INTO STRICT e FROM ppo.quote_conversion_events WHERE workspace_id=NEW.workspace_id AND id=NEW.execution_id;
 SELECT * INTO STRICT p FROM ppo.quote_conversion_events WHERE workspace_id=NEW.workspace_id AND id=NEW.plan_id;
 IF e.action<>'Execute' OR e.plan_id<>p.id OR p.action<>'Plan' OR e.quote_id<>NEW.quote_id OR e.revision_id<>NEW.revision_id OR NOT EXISTS(SELECT 1 FROM ppo.quote_conversion_events x WHERE x.id=e.id AND x.xmin::text::bigint=mod(pg_current_xact_id()::text::numeric,4294967296)) OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(p.plan->'basis'->'lines') WITH ORDINALITY l(value,n) WHERE value->>'line_id'=NEW.line_id::text AND p.plan->'commands'->(n::integer-1)->>'id'=NEW.target_id::text AND p.plan->'commands'->(n::integer-1)->>'operation_id'=NEW.operation_id::text) THEN RAISE EXCEPTION 'Target lineage must be part of its original exact atomic execution' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER quote_conversion_target_guard AFTER INSERT ON ppo.quote_conversion_targets DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.quote_conversion_target_guard();
