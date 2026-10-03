-- ES-04 subordinate exact-version evidence. Original Estimate/Quote rows are unchanged.
DO $$ DECLARE spec record; definition text; BEGIN
 FOR spec IN SELECT * FROM (VALUES
  ('outbox_jobs','ck_outbox_kind','kind','EstimateReviewRecorded'),
  ('permission_grants','ck_grants_capability','capability','estimating.review.completeness,estimating.review.price,estimating.review.technical')
 ) v(tab,con,col,added) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid=('ppo.'||spec.tab)::regclass AND conname=spec.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',spec.tab,spec.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR %I = ANY(%L::text[]))',spec.tab,spec.con,substring(definition from 8 for length(definition)-8),spec.col,string_to_array(spec.added,','));
 END LOOP;
END $$;

CREATE TABLE ppo.estimate_review_events (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL,
 estimate_id uuid NOT NULL, estimate_version_id uuid NOT NULL, sequence integer NOT NULL CHECK(sequence>0),
 submission_id uuid NOT NULL, predecessor_id uuid,
 kind text NOT NULL CHECK(kind IN ('Submission','Completeness','SourcePrice','Technical')),
 outcome text NOT NULL CHECK(outcome IN ('Submitted','Reviewed','Returned')),
 basis jsonb, responses jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(responses)='array' AND jsonb_array_length(responses)<=60),
 findings jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(findings)='array' AND jsonb_array_length(findings)<=20),
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),
 created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(), operation_id uuid NOT NULL,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,estimate_id,id), UNIQUE(workspace_id,estimate_id,sequence), UNIQUE(workspace_id,created_by,operation_id),
 FOREIGN KEY(workspace_id,company_id,estimate_id) REFERENCES ppo.estimates(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,estimate_id,estimate_version_id) REFERENCES ppo.estimate_versions(workspace_id,estimate_id,id),
 FOREIGN KEY(workspace_id,estimate_id,submission_id) REFERENCES ppo.estimate_review_events(workspace_id,estimate_id,id) DEFERRABLE INITIALLY DEFERRED,
 FOREIGN KEY(workspace_id,estimate_id,predecessor_id) REFERENCES ppo.estimate_review_events(workspace_id,estimate_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 CHECK ((kind='Submission' AND outcome='Submitted' AND submission_id=id AND basis IS NOT NULL AND basis->>'contract'='SYN-ES04-01' AND jsonb_typeof(basis->'fingerprints')='object' AND jsonb_array_length(findings)=0)
  OR (kind<>'Submission' AND outcome IN ('Reviewed','Returned') AND submission_id<>id AND basis IS NULL AND predecessor_id IS NULL AND jsonb_array_length(responses)=0)),
 CHECK ((outcome='Returned' AND jsonb_array_length(findings)>0) OR (outcome<>'Returned' AND jsonb_array_length(findings)=0)),
 CHECK(octet_length(coalesce(basis::text,''))+octet_length(responses::text)+octet_length(findings::text)<=65536)
);
CREATE UNIQUE INDEX estimate_review_one_decision ON ppo.estimate_review_events(workspace_id,submission_id,kind) WHERE kind<>'Submission';
CREATE TRIGGER immutable_estimate_review BEFORE UPDATE OR DELETE ON ppo.estimate_review_events FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

CREATE FUNCTION ppo.estimate_review_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE e ppo.estimates; v ppo.estimate_versions; s ppo.estimate_review_events; previous uuid; previous_sequence integer; f jsonb;
BEGIN
 SELECT * INTO STRICT e FROM ppo.estimates WHERE workspace_id=NEW.workspace_id AND id=NEW.estimate_id;
 SELECT * INTO STRICT v FROM ppo.estimate_versions WHERE workspace_id=NEW.workspace_id AND id=NEW.estimate_version_id;
 SELECT coalesce(max(sequence),0) INTO previous_sequence FROM ppo.estimate_review_events WHERE workspace_id=NEW.workspace_id AND estimate_id=NEW.estimate_id;
 IF NEW.sequence<>previous_sequence+1 THEN RAISE EXCEPTION 'Review sequence must advance once' USING ERRCODE='23514'; END IF;
 SELECT id INTO previous FROM ppo.estimate_review_events WHERE workspace_id=NEW.workspace_id AND estimate_id=NEW.estimate_id AND kind='Submission' ORDER BY sequence DESC LIMIT 1;
 IF NEW.kind='Submission' THEN
  IF NEW.predecessor_id IS DISTINCT FROM previous OR NEW.created_by<>e.owner_id OR NEW.estimate_version_id<>e.current_version_id OR NEW.basis->>'estimate_hash' IS DISTINCT FROM v.content_hash THEN RAISE EXCEPTION 'Submit the exact owner revision with its predecessor' USING ERRCODE='23514'; END IF;
  FOREACH f IN ARRAY ARRAY[NEW.basis->'fingerprints'->'Completeness',NEW.basis->'fingerprints'->'SourcePrice',NEW.basis->'fingerprints'->'Technical'] LOOP
   IF f IS NULL OR jsonb_typeof(f)<>'string' OR trim(both '"' from f::text) !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Exact review fingerprints required' USING ERRCODE='23514'; END IF;
  END LOOP;
 ELSE
  SELECT * INTO STRICT s FROM ppo.estimate_review_events WHERE workspace_id=NEW.workspace_id AND id=NEW.submission_id;
  IF s.kind<>'Submission' OR s.id IS DISTINCT FROM previous OR s.estimate_version_id<>v.id OR NEW.created_by IN (s.created_by,v.created_by,e.owner_id) THEN RAISE EXCEPTION 'Independent review of the current exact submission required' USING ERRCODE='23514'; END IF;
  FOR f IN SELECT value FROM jsonb_array_elements(NEW.findings) LOOP
   IF coalesce(length(btrim(f->>'detail')),0) NOT BETWEEN 1 AND 1000 OR f->>'id' IS NULL OR (f->>'line_id' IS NOT NULL AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(v.lines) l WHERE l->>'id'=f->>'line_id')) THEN RAISE EXCEPTION 'Finding must identify submitted evidence' USING ERRCODE='23514'; END IF;
  END LOOP;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER estimate_review_guard BEFORE INSERT ON ppo.estimate_review_events FOR EACH ROW EXECUTE FUNCTION ppo.estimate_review_guard();

CREATE FUNCTION ppo.estimate_review_evidence() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM ppo.audit_events a JOIN ppo.operation_receipts r ON (r.workspace_id,r.actor_id,r.operation_id)=(a.workspace_id,a.actor_id,a.operation_id)
  JOIN ppo.outbox_jobs j ON (j.workspace_id,j.actor_id,j.operation_id)=(a.workspace_id,a.actor_id,a.operation_id)
  WHERE a.workspace_id=NEW.workspace_id AND a.actor_id=NEW.created_by AND a.operation_id=NEW.operation_id AND a.object_type='Estimate' AND a.object_id=NEW.estimate_id
   AND a.details->>'review_event_id'=NEW.id::text AND a.reason=NEW.reason AND r.record_id=NEW.estimate_id AND (r.result->>'record_version')::integer=NEW.sequence AND j.kind='EstimateReviewRecorded')
 THEN RAISE EXCEPTION 'Review needs atomic original receipt audit and event' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER estimate_review_evidence AFTER INSERT ON ppo.estimate_review_events DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.estimate_review_evidence();
