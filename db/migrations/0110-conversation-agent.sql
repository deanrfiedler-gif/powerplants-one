-- PPO-CONV-T2-SCOPE / PPO-CONV-T2B-DESIGN: Carl's local, synthetic assistant core.
-- No user, provider, route or hosted grant. Existing message bytes and receipts are retained.
SET CONSTRAINTS ppo.identity_target IMMEDIATE;
DO $$ DECLARE spec record; definition text; BEGIN
 FOR spec IN SELECT * FROM (VALUES
  ('business_identities','ck_identities_type','object_type','AssistantTurn'),
  ('audit_events','ck_audit_object_type','object_type','AssistantTurn'),
  ('permission_grants','ck_grants_capability','capability','conversation.agent.ask'),
  ('conversation_mentions','conversation_mentions_kind_check','kind','Agent')
 ) v(tab,con,col,added) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid=('ppo.'||spec.tab)::regclass AND conname=spec.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',spec.tab,spec.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR %I = ANY(%L::text[]))',spec.tab,spec.con,substring(definition from 8 for length(definition)-8),spec.col,string_to_array(spec.added,','));
 END LOOP;
 SELECT pg_get_functiondef('ppo.identity_has_typed_record()'::regprocedure) INTO definition;
 IF position('CASE NEW.object_type' in definition)=0 THEN RAISE EXCEPTION 'Inspect changed identity dispatch'; END IF;
 EXECUTE replace(definition,'CASE NEW.object_type','CASE NEW.object_type WHEN ''AssistantTurn'' THEN ''assistant_turns''');
END $$;
SET CONSTRAINTS ppo.identity_target DEFERRED;

CREATE TABLE ppo.assistant_turns (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, thread_id uuid NOT NULL,
 trigger_message_id uuid NOT NULL UNIQUE, acted_for_id uuid NOT NULL,
 state text NOT NULL DEFAULT 'Queued' CHECK(state IN ('Queued','Answering','Answered','CannotAnswer','Unavailable','Failed','Discarded')),
 reason text CHECK(reason IN ('FeatureOff','BudgetSpent','PriceMissing','CreditExhausted','ProviderUnavailable','RateLimited','MalformedOutput',
  'Declined','NoEvidence','InvalidCitation','UnsafeOutput','TurnLimit','Timeout','Interrupted','InternalError','AccessChanged','ThreadResolved','ActorLostAccess')),
 adapter text CHECK(adapter IN ('Simulated','Claude')), model text CHECK(length(model) BETWEEN 1 AND 100),
 attempt integer NOT NULL DEFAULT 0 CHECK(attempt BETWEEN 0 AND 1),
 model_calls integer NOT NULL DEFAULT 0 CHECK(model_calls BETWEEN 0 AND 6),
 input_tokens integer NOT NULL DEFAULT 0 CHECK(input_tokens BETWEEN 0 AND 48000),
 output_tokens integer NOT NULL DEFAULT 0 CHECK(output_tokens BETWEEN 0 AND 8000),
 evidence_count integer NOT NULL DEFAULT 0 CHECK(evidence_count>=0),
 left_out_count integer NOT NULL DEFAULT 0 CHECK(left_out_count>=0),
 answer_message_id uuid UNIQUE, version integer NOT NULL DEFAULT 1 CHECK(version>0),
 lease_until timestamptz, created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 started_at timestamptz, finished_at timestamptz,
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 UNIQUE(workspace_id,id),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,thread_id) REFERENCES ppo.conversation_threads(workspace_id,id),
 FOREIGN KEY(workspace_id,thread_id,trigger_message_id) REFERENCES ppo.conversation_messages(workspace_id,thread_id,id),
 FOREIGN KEY(workspace_id,thread_id,answer_message_id) REFERENCES ppo.conversation_messages(workspace_id,thread_id,id),
 FOREIGN KEY(workspace_id,acted_for_id) REFERENCES ppo.users(workspace_id,id),
 CHECK(isfinite(created_at) AND (started_at IS NULL OR isfinite(started_at)) AND (finished_at IS NULL OR isfinite(finished_at))
  AND (lease_until IS NULL OR isfinite(lease_until))),
 CHECK((adapter IS NULL)=(model IS NULL)),
 CHECK((state IN ('Answered','CannotAnswer'))=(answer_message_id IS NOT NULL)),
 CHECK((state IN ('Queued','Answering'))=(finished_at IS NULL)),
 CHECK((state IN ('Queued','Answering','Answered'))=(reason IS NULL)),
 CHECK(state<>'Unavailable' OR reason IN ('FeatureOff','BudgetSpent','PriceMissing','CreditExhausted','ProviderUnavailable')),
 CHECK(state<>'Failed' OR reason IN ('RateLimited','MalformedOutput','InvalidCitation','UnsafeOutput','TurnLimit','Timeout','Interrupted','InternalError')),
 CHECK(state<>'Discarded' OR reason IN ('AccessChanged','ThreadResolved','ActorLostAccess')),
 CHECK(state<>'Answering' OR (started_at IS NOT NULL AND lease_until IS NOT NULL AND adapter IS NOT NULL)),
 CHECK(state IN ('Queued','Answering') OR lease_until IS NULL)
);
CREATE TRIGGER register_identity BEFORE INSERT ON ppo.assistant_turns FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('AssistantTurn','');
CREATE INDEX ix_assistant_turn_queue ON ppo.assistant_turns(workspace_id,created_at,id) WHERE state IN ('Queued','Answering');

ALTER TABLE ppo.conversation_messages
 ALTER COLUMN author_id DROP NOT NULL,
 ADD COLUMN author_kind text NOT NULL DEFAULT 'Person',
 ADD COLUMN acted_for_id uuid,
 ADD COLUMN turn_id uuid UNIQUE,
 ADD COLUMN agent_outcome text,
 ADD COLUMN adapter text,
 ADD COLUMN left_out_count integer,
 ADD FOREIGN KEY(workspace_id,acted_for_id) REFERENCES ppo.users(workspace_id,id),
 ADD FOREIGN KEY(workspace_id,turn_id) REFERENCES ppo.assistant_turns(workspace_id,id),
 ADD CONSTRAINT ck_conversation_author CHECK(
  (author_kind='Person' AND author_id IS NOT NULL AND acted_for_id IS NULL AND turn_id IS NULL AND agent_outcome IS NULL AND adapter IS NULL AND left_out_count IS NULL)
  OR (author_kind='Agent' AND author_id IS NULL AND acted_for_id IS NOT NULL AND turn_id IS NOT NULL
   AND agent_outcome IS NOT NULL AND agent_outcome IN ('Answered','CannotAnswer')
   AND adapter IS NOT NULL AND adapter IN ('Simulated','Claude') AND left_out_count IS NOT NULL AND left_out_count>=0));
CREATE UNIQUE INDEX ix_conversation_agent_operation ON ppo.conversation_messages(workspace_id,acted_for_id,operation_id) WHERE author_kind='Agent';
DO $$ DECLARE definition text; BEGIN
 SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint
  WHERE conrelid='ppo.conversation_mentions'::regclass AND conname='conversation_mentions_check';
 IF position('Person' in definition)=0 OR position('Record' in definition)=0 THEN RAISE EXCEPTION 'Inspect changed mention shape'; END IF;
 ALTER TABLE ppo.conversation_mentions DROP CONSTRAINT conversation_mentions_check;
 EXECUTE format('ALTER TABLE ppo.conversation_mentions ADD CONSTRAINT conversation_mentions_check CHECK ((%s) OR (kind=''Agent'' AND person_id IS NULL AND record_type IS NULL AND record_id IS NULL))',substring(definition from 8 for length(definition)-8));
END $$;
CREATE UNIQUE INDEX ix_conversation_one_agent ON ppo.conversation_mentions(workspace_id,message_id) WHERE kind='Agent';

-- Replace only the inspected live functions. Normalising CRLF for the shape check supports both
-- repository checkout encodings; the replacement retains the live function's other statements.
DO $$ DECLARE spec record; definition text; BEGIN
 FOR spec IN SELECT * FROM (VALUES
  ('guard_conversation_message','46d1e01b31e87f44abc971fd0fd27143'),
  ('guard_conversation_mention','7d7812a7c5844e43303f3e4b856b4500'),
  ('check_conversation_tokens','1d4a4689a51e41ad0697a1e02ec472a5'),
  ('check_conversation_audit','44cc31a958b6938e0c803bf9275715eb')
 ) v(name,hash) LOOP
  IF (SELECT md5(replace(prosrc,chr(13),'')) FROM pg_proc WHERE oid=('ppo.'||spec.name||'()')::regprocedure)<>spec.hash
   THEN RAISE EXCEPTION 'Inspect changed function %',spec.name; END IF;
 END LOOP;
 SELECT pg_get_functiondef('ppo.guard_conversation_message()'::regprocedure) INTO definition;
 definition:=replace(definition,'NEW.author_id','coalesce(NEW.author_id,NEW.acted_for_id)');
 definition:=replace(definition,' RETURN NEW;',$body$
 IF NEW.author_kind='Agent' THEN
  IF NOT EXISTS(SELECT 1 FROM ppo.assistant_turns a WHERE a.workspace_id=NEW.workspace_id AND a.id=NEW.turn_id
    AND a.thread_id=NEW.thread_id AND a.acted_for_id=NEW.acted_for_id AND a.state='Answering' AND a.adapter=NEW.adapter)
   THEN RAISE EXCEPTION 'An agent message needs its answering turn' USING ERRCODE='23514'; END IF;
  IF NOT EXISTS(SELECT 1 FROM ppo.users u WHERE u.workspace_id=NEW.workspace_id AND u.id=NEW.acted_for_id AND u.active)
   THEN RAISE EXCEPTION 'The acted-for person is active' USING ERRCODE='23514'; END IF;
  IF EXISTS(SELECT duty FROM unnest(ARRAY['conversation.post','conversation.agent.ask']) duty WHERE NOT EXISTS(
    SELECT 1 FROM ppo.permission_grants g WHERE g.workspace_id=NEW.workspace_id AND g.user_id=NEW.acted_for_id AND g.capability=duty
    AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp())
    AND (g.scope_type='Workspace' OR (g.company_id=t.company_id AND (g.scope_type='Company' OR (g.scope_type='Site' AND g.site_id=(
     SELECT site_id FROM ppo.opportunities WHERE t.anchor_type='Opportunity' AND workspace_id=t.workspace_id AND id=t.anchor_id
     UNION ALL SELECT site_id FROM ppo.projects WHERE t.anchor_type='Project' AND workspace_id=t.workspace_id AND id=t.anchor_id)))))))
   THEN RAISE EXCEPTION 'The acted-for person holds both duties in the anchor scope' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;$body$);
 EXECUTE definition;
 SELECT pg_get_functiondef('ppo.check_conversation_audit()'::regprocedure) INTO definition;
 EXECUTE replace(definition,'a.actor_id=NEW.author_id','a.actor_id=coalesce(NEW.author_id,NEW.acted_for_id)');
 SELECT pg_get_functiondef('ppo.check_conversation_tokens()'::regprocedure) INTO definition;
 EXECUTE replace(definition,'CASE kind WHEN ''Person'' THEN ''@'' ELSE ''#'' END','CASE WHEN kind IN (''Person'',''Agent'') THEN ''@'' ELSE ''#'' END');
 SELECT pg_get_functiondef('ppo.guard_conversation_mention()'::regprocedure) INTO definition;
 EXECUTE replace(definition,' RETURN NEW;',$body$
 IF EXISTS(SELECT 1 FROM ppo.conversation_messages WHERE workspace_id=NEW.workspace_id AND id=NEW.message_id AND author_kind='Agent')
  THEN RAISE EXCEPTION 'Agent messages have no mentions' USING ERRCODE='23514'; END IF;
 IF NEW.kind='Agent' AND EXISTS(SELECT 1 FROM ppo.conversation_mentions WHERE workspace_id=NEW.workspace_id AND message_id=NEW.message_id AND kind='Agent')
  THEN RAISE EXCEPTION 'A person message tags the agent once' USING ERRCODE='23514'; END IF;
 RETURN NEW;$body$);
END $$;

CREATE FUNCTION ppo.guard_assistant_turn() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' OR (TG_OP='UPDATE' AND OLD.state NOT IN ('Queued','Answering')) THEN
  RAISE EXCEPTION 'A finished turn is permanent' USING ERRCODE='55000'; END IF;
 IF TG_OP='INSERT' THEN
  IF NEW.state<>'Queued' OR NEW.version<>1 OR NEW.attempt<>0 OR NEW.model_calls<>0 OR NEW.input_tokens<>0 OR NEW.output_tokens<>0
    OR NEW.started_at IS NOT NULL OR NEW.finished_at IS NOT NULL OR NEW.adapter IS NOT NULL OR NEW.lease_until IS NOT NULL
    OR NEW.evidence_count<>0 OR NEW.left_out_count<>0
   THEN RAISE EXCEPTION 'A new turn starts queued and unused' USING ERRCODE='23514'; END IF;
  IF NOT EXISTS(SELECT 1 FROM ppo.conversation_messages m JOIN ppo.conversation_mentions n ON (n.workspace_id,n.message_id)=(m.workspace_id,m.id)
    WHERE m.workspace_id=NEW.workspace_id AND m.id=NEW.trigger_message_id AND m.thread_id=NEW.thread_id
    AND m.author_kind='Person' AND m.author_id=NEW.acted_for_id AND n.kind='Agent')
   THEN RAISE EXCEPTION 'A turn belongs to its tagging person message' USING ERRCODE='23514'; END IF;
 ELSE
  IF (NEW.id,NEW.workspace_id,NEW.thread_id,NEW.trigger_message_id,NEW.acted_for_id,NEW.created_at,NEW.synthetic)
    IS DISTINCT FROM (OLD.id,OLD.workspace_id,OLD.thread_id,OLD.trigger_message_id,OLD.acted_for_id,OLD.created_at,OLD.synthetic)
   THEN RAISE EXCEPTION 'Turn provenance is permanent' USING ERRCODE='55000'; END IF;
  IF NEW.version<>OLD.version+1 OR NEW.attempt<OLD.attempt OR NEW.model_calls<OLD.model_calls OR NEW.input_tokens<OLD.input_tokens OR NEW.output_tokens<OLD.output_tokens
    OR (OLD.state='Queued' AND NEW.state IN ('Answered','CannotAnswer'))
    OR (OLD.state='Answering' AND NEW.state='Queued')
    OR (OLD.started_at IS NOT NULL AND NEW.started_at IS DISTINCT FROM OLD.started_at)
    OR (OLD.adapter IS NOT NULL AND (NEW.adapter,NEW.model) IS DISTINCT FROM (OLD.adapter,OLD.model))
   THEN RAISE EXCEPTION 'Invalid turn transition or counters' USING ERRCODE='23514'; END IF;
 END IF;
 IF NEW.state='Answered' AND NOT EXISTS(SELECT 1 FROM ppo.conversation_messages m WHERE m.workspace_id=NEW.workspace_id
   AND m.id=NEW.answer_message_id AND m.turn_id=NEW.id AND m.agent_outcome='Answered') THEN
  RAISE EXCEPTION 'An answered turn needs its answer' USING ERRCODE='23514'; END IF;
 IF NEW.state='CannotAnswer' AND (NEW.reason NOT IN ('Declined','NoEvidence') OR NOT EXISTS(SELECT 1 FROM ppo.conversation_messages m
   WHERE m.workspace_id=NEW.workspace_id AND m.id=NEW.answer_message_id AND m.turn_id=NEW.id AND m.agent_outcome='CannotAnswer')) THEN
  RAISE EXCEPTION 'A declined turn needs its decline message' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard BEFORE INSERT OR UPDATE OR DELETE ON ppo.assistant_turns FOR EACH ROW EXECUTE FUNCTION ppo.guard_assistant_turn();

CREATE TABLE ppo.conversation_message_sources (
 workspace_id uuid NOT NULL, message_id uuid NOT NULL, number integer NOT NULL CHECK(number>0),
 record_type text NOT NULL CHECK(record_type IN ('Opportunity','Organisation','Activity','Project','ProjectTask','ProjectRaid','AcceptanceStage')),
 record_id uuid NOT NULL, source_version text NOT NULL CHECK(length(source_version) BETWEEN 1 AND 100),
 retrieved_at timestamptz NOT NULL CHECK(isfinite(retrieved_at)),
 PRIMARY KEY(workspace_id,message_id,number), UNIQUE(workspace_id,message_id,record_type,record_id),
 FOREIGN KEY(workspace_id,message_id) REFERENCES ppo.conversation_messages(workspace_id,id),
 FOREIGN KEY(workspace_id,record_id) REFERENCES ppo.business_identities(workspace_id,id)
);
CREATE TABLE ppo.conversation_message_claims (
 workspace_id uuid NOT NULL, message_id uuid NOT NULL, ordinal integer NOT NULL CHECK(ordinal BETWEEN 1 AND 17),
 kind text NOT NULL CHECK(kind IN ('Fact','Gap')), text text NOT NULL,
 source_numbers integer[] NOT NULL,
 PRIMARY KEY(workspace_id,message_id,ordinal),
 FOREIGN KEY(workspace_id,message_id) REFERENCES ppo.conversation_messages(workspace_id,id),
 CHECK((kind='Fact' AND length(btrim(text)) BETWEEN 1 AND 500 AND cardinality(source_numbers)>0)
  OR (kind='Gap' AND length(btrim(text)) BETWEEN 1 AND 300 AND cardinality(source_numbers)=0))
);
CREATE FUNCTION ppo.guard_conversation_answer_part() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM ppo.conversation_messages m JOIN ppo.assistant_turns t ON (t.workspace_id,t.id)=(m.workspace_id,m.turn_id)
   WHERE m.workspace_id=NEW.workspace_id AND m.id=NEW.message_id AND m.author_kind='Agent' AND t.state='Answering')
  THEN RAISE EXCEPTION 'Answer parts belong to an agent message being posted' USING ERRCODE='23514'; END IF;
 IF TG_TABLE_NAME='conversation_message_claims' THEN
  IF (SELECT count(*) FROM ppo.conversation_message_claims WHERE workspace_id=NEW.workspace_id AND message_id=NEW.message_id AND kind=NEW.kind)
    >= (CASE WHEN NEW.kind='Fact' THEN 12 ELSE 5 END)
   OR EXISTS(SELECT 1 FROM unnest(NEW.source_numbers) n WHERE n IS NULL OR NOT EXISTS(SELECT 1 FROM ppo.conversation_message_sources
    WHERE workspace_id=NEW.workspace_id AND message_id=NEW.message_id AND number=n))
   THEN RAISE EXCEPTION 'Claims are bounded and cite stored sources' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard BEFORE INSERT ON ppo.conversation_message_sources FOR EACH ROW EXECUTE FUNCTION ppo.guard_conversation_answer_part();
CREATE TRIGGER guard BEFORE INSERT ON ppo.conversation_message_claims FOR EACH ROW EXECUTE FUNCTION ppo.guard_conversation_answer_part();
CREATE TRIGGER source_immutable BEFORE UPDATE OR DELETE ON ppo.conversation_message_sources FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TRIGGER claim_immutable BEFORE UPDATE OR DELETE ON ppo.conversation_message_claims FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

CREATE TABLE ppo.assistant_budget_settings (
 workspace_id uuid PRIMARY KEY REFERENCES ppo.workspaces(id),
 monthly_ceiling_micro bigint NOT NULL CHECK(monthly_ceiling_micro BETWEEN 0 AND 30000000)
);
CREATE TABLE ppo.assistant_budget_entries (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, turn_id uuid NOT NULL,
 call_index integer NOT NULL CHECK(call_index BETWEEN 1 AND 6),
 period date NOT NULL CHECK(isfinite(period) AND extract(day FROM period)=1),
 adapter text NOT NULL CHECK(adapter IN ('Simulated','Claude')), model text NOT NULL CHECK(length(model) BETWEEN 1 AND 100),
 price_version text NOT NULL CHECK(length(price_version) BETWEEN 1 AND 100),
 max_input_tokens integer NOT NULL CHECK(max_input_tokens BETWEEN 0 AND 48000),
 max_output_tokens integer NOT NULL CHECK(max_output_tokens BETWEEN 0 AND 8000),
 reserved_micro bigint NOT NULL CHECK(reserved_micro>=0),
 state text NOT NULL DEFAULT 'Reserved' CHECK(state IN ('Reserved','Settled','Released','Unknown')),
 input_tokens integer, output_tokens integer, settled_micro bigint,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp() CHECK(isfinite(created_at)),
 settled_at timestamptz CHECK(isfinite(settled_at)),
 UNIQUE(workspace_id,turn_id,call_index),
 FOREIGN KEY(workspace_id) REFERENCES ppo.assistant_budget_settings(workspace_id),
 FOREIGN KEY(workspace_id,turn_id) REFERENCES ppo.assistant_turns(workspace_id,id),
 CHECK((state IN ('Reserved','Unknown') AND input_tokens IS NULL AND output_tokens IS NULL AND settled_micro IS NULL AND settled_at IS NULL)
  OR (state='Released' AND input_tokens IS NULL AND output_tokens IS NULL AND settled_micro IS NULL AND settled_at IS NOT NULL)
  OR (state='Settled' AND input_tokens IS NOT NULL AND output_tokens IS NOT NULL AND settled_micro IS NOT NULL
    AND input_tokens BETWEEN 0 AND max_input_tokens AND output_tokens BETWEEN 0 AND max_output_tokens
    AND settled_micro BETWEEN 0 AND reserved_micro AND settled_at IS NOT NULL))
);
CREATE INDEX ix_assistant_budget_month ON ppo.assistant_budget_entries(workspace_id,period);
CREATE FUNCTION ppo.guard_assistant_budget_entry() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE committed bigint; ceiling bigint;
BEGIN
 IF TG_OP='DELETE' OR (TG_OP='UPDATE' AND OLD.state IN ('Settled','Released')) THEN
  RAISE EXCEPTION 'Settled budget evidence is permanent' USING ERRCODE='55000'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('assistant-budget:'||NEW.workspace_id,0));
 IF TG_OP='INSERT' THEN
  IF NEW.state<>'Reserved' OR NOT EXISTS(SELECT 1 FROM ppo.assistant_turns t WHERE t.workspace_id=NEW.workspace_id AND t.id=NEW.turn_id
    AND t.state='Answering' AND t.adapter=NEW.adapter AND t.model=NEW.model)
   THEN RAISE EXCEPTION 'Reserve a call for its answering turn' USING ERRCODE='23514'; END IF;
 ELSE
  IF (to_jsonb(NEW)-'state'-'input_tokens'-'output_tokens'-'settled_micro'-'settled_at')
   IS DISTINCT FROM (to_jsonb(OLD)-'state'-'input_tokens'-'output_tokens'-'settled_micro'-'settled_at') THEN
   RAISE EXCEPTION 'Reservation provenance is permanent' USING ERRCODE='55000'; END IF;
  IF NOT ((OLD.state='Reserved' AND NEW.state IN ('Settled','Released','Unknown')) OR (OLD.state='Unknown' AND NEW.state='Settled')) THEN
   RAISE EXCEPTION 'An unknown reservation cannot be released' USING ERRCODE='23514'; END IF;
 END IF;
 SELECT monthly_ceiling_micro INTO STRICT ceiling FROM ppo.assistant_budget_settings WHERE workspace_id=NEW.workspace_id;
 SELECT coalesce(sum(CASE WHEN state IN ('Reserved','Unknown') THEN reserved_micro WHEN state='Settled' THEN settled_micro ELSE 0 END),0)
  INTO committed FROM ppo.assistant_budget_entries WHERE workspace_id=NEW.workspace_id AND period=NEW.period AND id<>NEW.id;
 IF committed+(CASE WHEN NEW.state IN ('Reserved','Unknown') THEN NEW.reserved_micro WHEN NEW.state='Settled' THEN NEW.settled_micro ELSE 0 END)>ceiling THEN
  RAISE EXCEPTION 'Assistant monthly budget spent' USING ERRCODE='23514',CONSTRAINT='assistant_monthly_ceiling'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard BEFORE INSERT OR UPDATE OR DELETE ON ppo.assistant_budget_entries FOR EACH ROW EXECUTE FUNCTION ppo.guard_assistant_budget_entry();
