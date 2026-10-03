-- Additive subordinate evidence only: no existing identities, grants, templates or bytes change.
DO $$ DECLARE definition text; BEGIN
 SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid='ppo.outbox_jobs'::regclass AND conname='ck_outbox_kind';
 ALTER TABLE ppo.outbox_jobs DROP CONSTRAINT ck_outbox_kind;
 EXECUTE format('ALTER TABLE ppo.outbox_jobs ADD CONSTRAINT ck_outbox_kind CHECK ((%s) OR kind = ''QuotationResponseRecorded'')',substring(definition from 8 for length(definition)-8));
END $$;
CREATE TABLE ppo.quote_response_events (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, quote_id uuid NOT NULL, revision_id uuid NOT NULL, issue_id uuid NOT NULL,
 sequence integer NOT NULL CHECK(sequence>0), action text NOT NULL CHECK(action IN ('Record','Correct','Answer','Confirm','Prepare')),
 response_id uuid, output_hash text NOT NULL CHECK(output_hash ~ '^[a-f0-9]{64}$'), report jsonb, detail jsonb NOT NULL,
 evidence text NOT NULL CHECK(length(btrim(evidence)) BETWEEN 1 AND 4000), reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),
 created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(), operation_id uuid NOT NULL,
 UNIQUE(workspace_id,revision_id,id), UNIQUE(workspace_id,revision_id,sequence), UNIQUE(workspace_id,created_by,operation_id),
 FOREIGN KEY(workspace_id,quote_id,revision_id) REFERENCES ppo.quote_release_bases(workspace_id,quote_id,revision_id),
 FOREIGN KEY(workspace_id,quote_id,issue_id) REFERENCES ppo.quote_release_events(workspace_id,quote_id,id),
 FOREIGN KEY(workspace_id,revision_id,response_id) REFERENCES ppo.quote_response_events(workspace_id,revision_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 CHECK(jsonb_typeof(detail)='object' AND octet_length(detail::text)<=16384),
 CONSTRAINT ck_quote_response_report CHECK((action IN ('Record','Correct') AND report IS NOT NULL AND jsonb_typeof(report)='object'
   AND coalesce(report->>'outcome','') IN ('Accepted','Declined','Clarification','Negotiation')
   AND coalesce(length(btrim(report->>'respondent')),0) BETWEEN 1 AND 200 AND coalesce(length(btrim(report->>'claimed_role')),0) BETWEEN 1 AND 200
   AND jsonb_typeof(report->'respondent')='string' AND jsonb_typeof(report->'claimed_role')='string'
   AND (report->'conditions'='null'::jsonb OR (jsonb_typeof(report->'conditions')='string' AND length(report->>'conditions')<=2000))
   AND report ?& ARRAY['outcome','respondent','claimed_role','responded_at','conditions'] AND octet_length(report::text)<=16384 AND detail='{}'::jsonb)
   OR (action IN ('Answer','Confirm','Prepare') AND report IS NULL AND response_id IS NOT NULL)),
 CHECK(action<>'Correct' OR response_id IS NOT NULL)
);
CREATE TRIGGER immutable_quote_response BEFORE UPDATE OR DELETE ON ppo.quote_response_events FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE UNIQUE INDEX quote_response_answer_once ON ppo.quote_response_events(workspace_id,response_id,action) WHERE action IN ('Answer','Confirm','Prepare');
CREATE FUNCTION ppo.quote_response_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE issued ppo.quote_release_events; previous ppo.quote_response_events; target ppo.quote_response_events; seq integer; current_issue uuid; material boolean; unanswered boolean; owner uuid;
BEGIN
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 SELECT * INTO STRICT issued FROM ppo.quote_release_events WHERE workspace_id=NEW.workspace_id AND id=NEW.issue_id;
 IF issued.action<>'Issue' OR issued.revision_id<>NEW.revision_id OR issued.output_hash<>NEW.output_hash THEN RAISE EXCEPTION 'Bind the exact immutable issue and output' USING ERRCODE='23514'; END IF;
 SELECT coalesce(max(sequence),0) INTO seq FROM ppo.quote_response_events WHERE workspace_id=NEW.workspace_id AND revision_id=NEW.revision_id;
 IF NEW.sequence<>seq+1 THEN RAISE EXCEPTION 'Next response sequence required' USING ERRCODE='23514'; END IF;
 SELECT id INTO current_issue FROM ppo.quote_release_events WHERE workspace_id=NEW.workspace_id AND quote_id=NEW.quote_id AND action='Issue' ORDER BY sequence DESC LIMIT 1;
 SELECT * INTO previous FROM ppo.quote_response_events WHERE workspace_id=NEW.workspace_id AND revision_id=NEW.revision_id AND action IN ('Record','Correct') ORDER BY sequence DESC LIMIT 1;
 SELECT EXISTS(SELECT 1 FROM ppo.quote_response_events WHERE workspace_id=NEW.workspace_id AND revision_id=NEW.revision_id AND report->>'outcome'='Negotiation') INTO material;
 SELECT EXISTS(SELECT 1 FROM ppo.quote_response_events q WHERE q.workspace_id=NEW.workspace_id AND q.revision_id=NEW.revision_id AND q.report->>'outcome'='Clarification'
  AND NOT EXISTS(SELECT 1 FROM ppo.quote_response_events x WHERE x.workspace_id=q.workspace_id AND x.response_id=q.id AND x.action IN ('Correct','Confirm'))) INTO unanswered;
 IF NEW.action IN ('Record','Correct') THEN
  IF NEW.response_id IS DISTINCT FROM previous.id THEN RAISE EXCEPTION 'Explicit original response lineage required' USING ERRCODE='23514'; END IF;
  IF NEW.report->>'responded_at' IS NULL OR (NEW.report->>'responded_at')::timestamptz < issued.created_at OR (NEW.report->>'responded_at')::timestamptz > NEW.created_at THEN RAISE EXCEPTION 'Response time outside issued/recorded bounds' USING ERRCODE='23514'; END IF;
  IF NEW.action='Record' AND NEW.report->>'outcome'='Accepted' AND (current_issue<>NEW.issue_id OR material OR unanswered) THEN RAISE EXCEPTION 'Current unchanged issue and resolved clarification required' USING ERRCODE='23514'; END IF;
 ELSE
  SELECT * INTO STRICT target FROM ppo.quote_response_events WHERE workspace_id=NEW.workspace_id AND revision_id=NEW.revision_id AND id=NEW.response_id;
  IF current_issue<>NEW.issue_id OR material THEN RAISE EXCEPTION 'Superseded or material-change issue held' USING ERRCODE='23514'; END IF;
  IF NEW.action IN ('Answer','Confirm') THEN
   IF target.report->>'outcome' IS DISTINCT FROM 'Clarification' OR EXISTS(SELECT 1 FROM ppo.quote_response_events WHERE workspace_id=NEW.workspace_id AND response_id=target.id AND action IN ('Correct','Confirm')) THEN RAISE EXCEPTION 'Unresolved original clarification required' USING ERRCODE='23514'; END IF;
   IF NEW.action='Answer' AND coalesce(length(btrim(NEW.detail->>'answer')),0) NOT BETWEEN 1 AND 4000 THEN RAISE EXCEPTION 'Information-only answer required' USING ERRCODE='23514'; END IF;
   IF NEW.action='Confirm' THEN
    IF coalesce(length(btrim(NEW.detail->>'respondent')),0) NOT BETWEEN 1 AND 200 OR coalesce(length(btrim(NEW.detail->>'claimed_role')),0) NOT BETWEEN 1 AND 200 OR NEW.detail->>'responded_at' IS NULL THEN RAISE EXCEPTION 'Attributable confirmation required' USING ERRCODE='23514'; END IF;
    IF NOT EXISTS(SELECT 1 FROM ppo.quote_response_events WHERE workspace_id=NEW.workspace_id AND response_id=target.id AND action='Answer' AND created_at <= (NEW.detail->>'responded_at')::timestamptz) OR (NEW.detail->>'responded_at')::timestamptz > NEW.created_at THEN RAISE EXCEPTION 'Confirmation must follow answer and precede recording' USING ERRCODE='23514'; END IF;
   END IF;
  ELSE
   IF previous.id IS DISTINCT FROM target.id OR target.report->>'outcome' IS DISTINCT FROM 'Accepted' OR nullif(target.report->>'conditions','') IS NOT NULL OR unanswered THEN RAISE EXCEPTION 'Exact unconditioned response required for receiving preparation' USING ERRCODE='23514'; END IF;
   SELECT e.owner_id INTO STRICT owner FROM ppo.estimates e JOIN ppo.draft_quote_revisions q ON (q.workspace_id,q.estimate_id)=(e.workspace_id,e.id) WHERE q.workspace_id=NEW.workspace_id AND q.id=NEW.revision_id;
   IF NEW.detail->>'owner_id' IS DISTINCT FROM owner::text OR NEW.created_by<>owner OR NEW.detail->>'due_date' IS NULL OR coalesce(length(btrim(NEW.detail->>'note')),0) NOT BETWEEN 1 AND 4000 THEN RAISE EXCEPTION 'Owned dated receiving note required' USING ERRCODE='23514'; END IF;
   PERFORM (NEW.detail->>'due_date')::date;
  END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER quote_response_guard BEFORE INSERT ON ppo.quote_response_events FOR EACH ROW EXECUTE FUNCTION ppo.quote_response_guard();
CREATE FUNCTION ppo.quote_response_evidence() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM ppo.audit_events a JOIN ppo.operation_receipts r ON (r.workspace_id,r.actor_id,r.operation_id)=(a.workspace_id,a.actor_id,a.operation_id)
  JOIN ppo.outbox_jobs j ON (j.workspace_id,j.actor_id,j.operation_id)=(a.workspace_id,a.actor_id,a.operation_id)
  WHERE a.workspace_id=NEW.workspace_id AND a.actor_id=NEW.created_by AND a.operation_id=NEW.operation_id AND a.object_type='DraftQuoteRevision' AND a.object_id=NEW.revision_id
  AND a.details->>'response_event_id'=NEW.id::text AND a.details->>'command'='QuoteResponse:'||NEW.action AND a.reason=NEW.reason
  AND r.record_id=NEW.revision_id AND (r.result->>'record_version')::integer=NEW.sequence AND r.result->>'state'=coalesce(NEW.report->>'outcome',NEW.action) AND j.kind='QuotationResponseRecorded')
 THEN RAISE EXCEPTION 'Response requires original atomic audit receipt and outbox' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER quote_response_evidence AFTER INSERT ON ppo.quote_response_events DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.quote_response_evidence();
