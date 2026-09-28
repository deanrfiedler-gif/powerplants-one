-- Step 2 only: constrained synthetic evidence. No operational authorisation or command.
-- 0051 Maintenance/Warranty and 0052 Products remain reserved and are not dependencies.
-- Only the publication needs a global identity: operation_receipts.record_id requires it.
SET CONSTRAINTS ppo.identity_target IMMEDIATE;
DO $$ DECLARE d text; BEGIN
 SELECT pg_get_constraintdef(oid) INTO STRICT d FROM pg_constraint
 WHERE conrelid='ppo.business_identities'::regclass AND conname='ck_identities_type';
 ALTER TABLE ppo.business_identities DROP CONSTRAINT ck_identities_type;
 EXECUTE format('ALTER TABLE ppo.business_identities ADD CONSTRAINT ck_identities_type CHECK ((%s) OR object_type=''SchedulingPolicyPublication'')',substring(d from 8 for length(d)-8));
 SELECT pg_get_functiondef('ppo.identity_has_typed_record()'::regprocedure) INTO d;
 IF position('CASE NEW.object_type' in d)=0 THEN RAISE EXCEPTION 'Inspect changed identity dispatch'; END IF;
 EXECUTE replace(d,'CASE NEW.object_type','CASE NEW.object_type WHEN ''SchedulingPolicyPublication'' THEN ''scheduling_policy_publications''');
END $$;
SET CONSTRAINTS ppo.identity_target DEFERRED;

-- Hash the supplied canonical UTF-8 bytes, never PostgreSQL's JSON serialization.
-- The server adapter validates Step 1's exact shape, normalization and canonical algorithm.
CREATE FUNCTION ppo.scheduling_evidence_bytes(body jsonb, bytes text, hash text)
RETURNS boolean LANGUAGE sql IMMUTABLE STRICT AS $$
 SELECT jsonb_typeof(body)='object' AND body=bytes::jsonb
 AND hash=encode(sha256(convert_to(bytes,'UTF8')),'hex')
$$;

CREATE TABLE ppo.scheduling_policy_families (
 workspace_id uuid NOT NULL, family text NOT NULL CHECK(family='synthetic-service-scheduling'),
 root_policy_id uuid NOT NULL CHECK(root_policy_id='a0000000-0000-4000-8000-000000000001'),
 PRIMARY KEY(workspace_id,family), UNIQUE(workspace_id,root_policy_id),
 FOREIGN KEY(workspace_id,root_policy_id) REFERENCES ppo.scheduling_policies(workspace_id,id)
);
CREATE TABLE ppo.scheduling_policy_members (
 workspace_id uuid NOT NULL, family text NOT NULL, policy_id uuid NOT NULL,
 policy_version integer NOT NULL CHECK(policy_version>0), content_hash text NOT NULL,
 chain_version integer NOT NULL CHECK(chain_version>0), predecessor_id uuid, publication_id uuid,
 content jsonb NOT NULL, canonical_content text NOT NULL,
 PRIMARY KEY(workspace_id,family,policy_id), UNIQUE(workspace_id,policy_id),
 UNIQUE(workspace_id,publication_id),
 UNIQUE(workspace_id,family,chain_version), UNIQUE(workspace_id,family,predecessor_id),
 UNIQUE(workspace_id,family,policy_id,policy_version,content_hash,chain_version),
 UNIQUE(workspace_id,family,policy_id,chain_version),
 FOREIGN KEY(workspace_id,family) REFERENCES ppo.scheduling_policy_families(workspace_id,family),
 FOREIGN KEY(workspace_id,policy_id) REFERENCES ppo.scheduling_policies(workspace_id,id),
 FOREIGN KEY(workspace_id,family,predecessor_id) REFERENCES ppo.scheduling_policy_members(workspace_id,family,policy_id),
 CHECK((chain_version=1 AND predecessor_id IS NULL AND publication_id IS NULL) OR
       (chain_version>1 AND predecessor_id IS NOT NULL AND publication_id IS NOT NULL)),
 CHECK(ppo.scheduling_evidence_bytes(content,canonical_content,content_hash))
);
CREATE TABLE ppo.scheduling_policy_heads (
 workspace_id uuid NOT NULL, family text NOT NULL, policy_id uuid NOT NULL,
 version integer NOT NULL CHECK(version>0),
 PRIMARY KEY(workspace_id,family),
 FOREIGN KEY(workspace_id,family) REFERENCES ppo.scheduling_policy_families(workspace_id,family),
 FOREIGN KEY(workspace_id,family,policy_id,version) REFERENCES ppo.scheduling_policy_members(workspace_id,family,policy_id,chain_version)
);

CREATE TABLE ppo.scheduling_policy_proposals (
 workspace_id uuid NOT NULL, family text NOT NULL, id uuid NOT NULL, version integer NOT NULL CHECK(version>0),
 root_policy_id uuid NOT NULL, source_id uuid NOT NULL, source_version integer NOT NULL,
 source_hash text NOT NULL, expected_head_version integer NOT NULL,
 predecessor_id uuid, predecessor_version integer, predecessor_hash text,
 proposer_id uuid NOT NULL, proposed_at timestamptz NOT NULL,
 schema_version integer NOT NULL CHECK(schema_version=1), evaluator_version integer NOT NULL CHECK(evaluator_version=1),
 content jsonb NOT NULL, canonical_content text NOT NULL, content_hash text NOT NULL,
 PRIMARY KEY(workspace_id,id), UNIQUE(workspace_id,family,id,version,content_hash),
 FOREIGN KEY(workspace_id,family) REFERENCES ppo.scheduling_policy_families(workspace_id,family),
 FOREIGN KEY(workspace_id,root_policy_id) REFERENCES ppo.scheduling_policies(workspace_id,id),
 FOREIGN KEY(workspace_id,family,source_id,source_version,source_hash,expected_head_version)
 REFERENCES ppo.scheduling_policy_members(workspace_id,family,policy_id,policy_version,content_hash,chain_version),
 FOREIGN KEY(workspace_id,family,predecessor_id,predecessor_version,predecessor_hash)
 REFERENCES ppo.scheduling_policy_proposals(workspace_id,family,id,version,content_hash),
 FOREIGN KEY(workspace_id,proposer_id) REFERENCES ppo.users(workspace_id,id),
 CHECK((version=1 AND predecessor_id IS NULL AND predecessor_version IS NULL AND predecessor_hash IS NULL) OR
       (version>1 AND predecessor_id IS NOT NULL AND predecessor_version=version-1 AND predecessor_hash IS NOT NULL AND predecessor_id<>id)),
 CHECK(isfinite(proposed_at)), CHECK(ppo.scheduling_evidence_bytes(content,canonical_content,content_hash))
);
CREATE TABLE ppo.scheduling_policy_reviews (
 workspace_id uuid NOT NULL, family text NOT NULL, id uuid NOT NULL, version integer NOT NULL CHECK(version=1),
 proposal_id uuid NOT NULL, proposal_version integer NOT NULL, proposal_hash text NOT NULL,
 reviewer_id uuid NOT NULL, review_event_id uuid NOT NULL, evaluated_at timestamptz NOT NULL,
 population_hash text NOT NULL CHECK(population_hash ~ '^[a-f0-9]{64}$'),
 schema_version integer NOT NULL CHECK(schema_version=1), evaluator_version integer NOT NULL CHECK(evaluator_version=1),
 content jsonb NOT NULL, canonical_content text NOT NULL, content_hash text NOT NULL,
 PRIMARY KEY(workspace_id,id), UNIQUE(workspace_id,family,id,version,content_hash),
 UNIQUE(workspace_id,review_event_id),
 FOREIGN KEY(workspace_id,family,proposal_id,proposal_version,proposal_hash)
 REFERENCES ppo.scheduling_policy_proposals(workspace_id,family,id,version,content_hash),
 FOREIGN KEY(workspace_id,reviewer_id) REFERENCES ppo.users(workspace_id,id),
 CHECK(isfinite(evaluated_at)), CHECK(ppo.scheduling_evidence_bytes(content,canonical_content,content_hash)),
 CHECK((content->>'coverage'='CompleteWorkspaceFamily' AND jsonb_typeof(content->'candidates')='array'
 AND jsonb_array_length(content->'candidates')<=200) IS TRUE)
);
CREATE TABLE ppo.scheduling_policy_candidates (
 workspace_id uuid NOT NULL, review_id uuid NOT NULL, ordinal integer NOT NULL CHECK(ordinal BETWEEN 0 AND 199),
 appointment_id uuid NOT NULL, company_id uuid NOT NULL, site_id uuid NOT NULL, work_order_id uuid NOT NULL,
 appointment_version integer NOT NULL CHECK(appointment_version>0), appointment_hash text NOT NULL,
 dependency_fingerprint text NOT NULL CHECK(dependency_fingerprint ~ '^[a-f0-9]{64}$'),
 impact_owner_id uuid, outcome text NOT NULL CHECK(outcome IN ('Compliant','ImpactRequired')),
 content jsonb NOT NULL,
 PRIMARY KEY(workspace_id,review_id,appointment_id), UNIQUE(workspace_id,review_id,ordinal),
 UNIQUE(workspace_id,review_id,appointment_id,dependency_fingerprint),
 FOREIGN KEY(workspace_id,review_id) REFERENCES ppo.scheduling_policy_reviews(workspace_id,id),
 FOREIGN KEY(workspace_id,appointment_id) REFERENCES ppo.appointments(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id) REFERENCES ppo.sites(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,work_order_id) REFERENCES ppo.work_orders(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,impact_owner_id) REFERENCES ppo.users(workspace_id,id),
 CHECK((outcome='Compliant')=(impact_owner_id IS NULL))
);

CREATE TABLE ppo.scheduling_policy_publications (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, family text NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version=1), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 created_at timestamptz NOT NULL, created_by uuid NOT NULL,
 proposal_id uuid NOT NULL, proposal_version integer NOT NULL, proposal_hash text NOT NULL,
 review_id uuid NOT NULL, review_version integer NOT NULL, review_hash text NOT NULL,
 predecessor_id uuid NOT NULL, policy_id uuid NOT NULL, policy_version integer NOT NULL, policy_hash text NOT NULL,
 head_version integer NOT NULL CHECK(head_version>1), operation_id uuid NOT NULL, command_hash text NOT NULL,
 command jsonb NOT NULL, canonical_command text NOT NULL, receipt_id uuid NOT NULL,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,family,id), UNIQUE(workspace_id,proposal_id),
 UNIQUE(workspace_id,review_id), UNIQUE(workspace_id,policy_id), UNIQUE(workspace_id,family,predecessor_id),
 UNIQUE(workspace_id,created_by,operation_id),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,family,proposal_id,proposal_version,proposal_hash)
 REFERENCES ppo.scheduling_policy_proposals(workspace_id,family,id,version,content_hash),
 FOREIGN KEY(workspace_id,family,review_id,review_version,review_hash)
 REFERENCES ppo.scheduling_policy_reviews(workspace_id,family,id,version,content_hash),
 FOREIGN KEY(workspace_id,family,policy_id,policy_version,policy_hash,head_version)
 REFERENCES ppo.scheduling_policy_members(workspace_id,family,policy_id,policy_version,content_hash,chain_version) DEFERRABLE INITIALLY DEFERRED,
 FOREIGN KEY(workspace_id,created_by,operation_id,receipt_id)
 REFERENCES ppo.operation_receipts(workspace_id,actor_id,operation_id,id) DEFERRABLE INITIALLY DEFERRED,
 CHECK(isfinite(created_at)), CHECK(ppo.scheduling_evidence_bytes(command,canonical_command,command_hash))
);
CREATE TRIGGER register_identity BEFORE INSERT ON ppo.scheduling_policy_publications
FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('SchedulingPolicyPublication','');
ALTER TABLE ppo.scheduling_policy_members ADD CONSTRAINT scheduling_member_publication
FOREIGN KEY(workspace_id,family,publication_id) REFERENCES ppo.scheduling_policy_publications(workspace_id,family,id) DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE ppo.scheduling_policy_impacts (
 workspace_id uuid NOT NULL, id uuid NOT NULL, publication_id uuid NOT NULL, review_id uuid NOT NULL,
 appointment_id uuid NOT NULL, dependency_fingerprint text NOT NULL, content jsonb NOT NULL,
 canonical_content text NOT NULL, content_hash text NOT NULL,
 PRIMARY KEY(workspace_id,id), UNIQUE(workspace_id,publication_id,appointment_id),
 FOREIGN KEY(workspace_id,publication_id) REFERENCES ppo.scheduling_policy_publications(workspace_id,id),
 FOREIGN KEY(workspace_id,review_id,appointment_id,dependency_fingerprint)
 REFERENCES ppo.scheduling_policy_candidates(workspace_id,review_id,appointment_id,dependency_fingerprint),
 CHECK(ppo.scheduling_evidence_bytes(content,canonical_content,content_hash))
);
-- A typed companion, not a new generic Activity target. Existing Site link is retained.
CREATE TABLE ppo.scheduling_policy_impact_activities (
 workspace_id uuid NOT NULL, impact_id uuid NOT NULL, activity_id uuid NOT NULL,
 PRIMARY KEY(workspace_id,impact_id), UNIQUE(workspace_id,activity_id),
 FOREIGN KEY(workspace_id,impact_id) REFERENCES ppo.scheduling_policy_impacts(workspace_id,id),
 FOREIGN KEY(workspace_id,activity_id) REFERENCES ppo.activities(workspace_id,id)
);
CREATE TABLE ppo.scheduling_policy_resolutions (
 workspace_id uuid NOT NULL, id uuid NOT NULL, impact_id uuid NOT NULL,
 sequence integer NOT NULL CHECK(sequence>0), predecessor_id uuid,
 actor_id uuid NOT NULL, operation_id uuid NOT NULL, observed_at timestamptz NOT NULL,
 appointment_id uuid NOT NULL, appointment_version integer NOT NULL CHECK(appointment_version>0),
 replacement_id uuid, outcome text NOT NULL CHECK(outcome IN ('VerifiedNoConflict','Cancelled','Replaced')),
 schema_version integer NOT NULL CHECK(schema_version=1), evaluator_version integer NOT NULL CHECK(evaluator_version=1),
 content jsonb NOT NULL, canonical_content text NOT NULL, content_hash text NOT NULL,
 PRIMARY KEY(workspace_id,id), UNIQUE(workspace_id,impact_id,id), UNIQUE(workspace_id,impact_id,sequence),
 UNIQUE(workspace_id,impact_id,predecessor_id), UNIQUE(workspace_id,actor_id,operation_id),
 FOREIGN KEY(workspace_id,impact_id) REFERENCES ppo.scheduling_policy_impacts(workspace_id,id),
 FOREIGN KEY(workspace_id,impact_id,predecessor_id) REFERENCES ppo.scheduling_policy_resolutions(workspace_id,impact_id,id),
 FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,appointment_id) REFERENCES ppo.appointments(workspace_id,id),
 FOREIGN KEY(workspace_id,replacement_id) REFERENCES ppo.appointments(workspace_id,id),
 CHECK((sequence=1)=(predecessor_id IS NULL)), CHECK((outcome='Replaced')=(replacement_id IS NOT NULL)),
 CHECK(replacement_id IS NULL OR replacement_id<>appointment_id),
 CHECK(isfinite(observed_at)), CHECK(ppo.scheduling_evidence_bytes(content,canonical_content,content_hash))
);

CREATE FUNCTION ppo.check_scheduling_member() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE p ppo.scheduling_policies; f ppo.scheduling_policy_families; prev ppo.scheduling_policy_members; BEGIN
 SELECT * INTO STRICT p FROM ppo.scheduling_policies WHERE workspace_id=NEW.workspace_id AND id=NEW.policy_id;
 SELECT * INTO STRICT f FROM ppo.scheduling_policy_families WHERE workspace_id=NEW.workspace_id AND family=NEW.family;
 IF NEW.policy_version<>p.version OR NEW.content<>jsonb_build_object(
 'id',p.id,'version',p.version,'name',p.name,'evidence',p.evidence,
 'effective_from',to_char(p.effective_from AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
 'effective_to',to_char(p.effective_to AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
 'source_as_at',to_char(p.source_as_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
 'initial_contact_required',p.initial_contact_required,'changed_contact_allowed',p.changed_contact_allowed,
 'all_crew_skilled',p.all_crew_skilled,'max_visit_minutes',p.max_visit_minutes) THEN
 RAISE EXCEPTION 'Exact policy content required' USING ERRCODE='23514'; END IF;
 IF NEW.chain_version=1 THEN
  IF NEW.policy_id<>f.root_policy_id THEN RAISE EXCEPTION 'Only trusted root may bootstrap' USING ERRCODE='23514'; END IF;
 ELSE
  SELECT * INTO STRICT prev FROM ppo.scheduling_policy_members WHERE workspace_id=NEW.workspace_id AND family=NEW.family AND policy_id=NEW.predecessor_id;
  IF NEW.chain_version<>prev.chain_version+1 OR (NEW.content->>'effective_from')::timestamptz<=(prev.content->>'effective_from')::timestamptz
  OR (NEW.content-ARRAY['id','version','effective_from','max_visit_minutes'])<>(prev.content-ARRAY['id','version','effective_from','max_visit_minutes']) THEN
   RAISE EXCEPTION 'Successor must retain terms and immediately follow predecessor' USING ERRCODE='23514'; END IF;
 END IF; RETURN NEW;
END $$;
CREATE TRIGGER scheduling_member_content BEFORE INSERT ON ppo.scheduling_policy_members FOR EACH ROW EXECUTE FUNCTION ppo.check_scheduling_member();

CREATE FUNCTION ppo.check_scheduling_proposal() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE src ppo.scheduling_policy_members; f ppo.scheduling_policy_families; b jsonb:=NEW.content; BEGIN
 SELECT * INTO STRICT src FROM ppo.scheduling_policy_members WHERE workspace_id=NEW.workspace_id AND family=NEW.family AND policy_id=NEW.source_id;
 SELECT * INTO STRICT f FROM ppo.scheduling_policy_families WHERE workspace_id=NEW.workspace_id AND family=NEW.family;
 IF NOT (b @> jsonb_build_object('kind','SchedulingPolicyProposal','workspace_id',NEW.workspace_id,'family',NEW.family,
 'root_policy_id',NEW.root_policy_id,'id',NEW.id,'version',NEW.version,'schema_version',NEW.schema_version,'evaluator_version',NEW.evaluator_version,
 'proposer_id',NEW.proposer_id,'source',jsonb_build_object('id',NEW.source_id,'version',NEW.source_version,'content_hash',NEW.source_hash),
 'expected_head',jsonb_build_object('version',NEW.expected_head_version,'policy',b->'source')))
 OR NEW.root_policy_id<>f.root_policy_id OR NEW.proposed_at IS DISTINCT FROM (b->>'proposed_at')::timestamptz
 OR b->'fixed_terms' IS DISTINCT FROM (src.content-ARRAY['id','version','effective_from','max_visit_minutes'])
 OR b->'predecessor_proposal' IS DISTINCT FROM (CASE WHEN NEW.predecessor_id IS NULL THEN 'null'::jsonb ELSE jsonb_build_object('id',NEW.predecessor_id,'version',NEW.predecessor_version,'content_hash',NEW.predecessor_hash) END)
 OR NOT coalesce((b->>'effective_from')::timestamptz>NEW.proposed_at AND (b->>'effective_from')::timestamptz>(src.content->>'effective_from')::timestamptz
 AND (b->>'effective_from')::timestamptz<(src.content->>'effective_to')::timestamptz AND (b->>'max_visit_minutes')::integer BETWEEN 1 AND 1440,false)
 THEN RAISE EXCEPTION 'Exact proposal bindings required' USING ERRCODE='23514'; END IF; RETURN NEW;
END $$;
CREATE TRIGGER scheduling_proposal_content BEFORE INSERT ON ppo.scheduling_policy_proposals FOR EACH ROW EXECUTE FUNCTION ppo.check_scheduling_proposal();

CREATE FUNCTION ppo.check_scheduling_review() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE p ppo.scheduling_policy_proposals; b jsonb:=NEW.content; BEGIN
 SELECT * INTO STRICT p FROM ppo.scheduling_policy_proposals WHERE workspace_id=NEW.workspace_id AND id=NEW.proposal_id;
 IF NOT (b @> jsonb_build_object('kind','SchedulingPolicyReview','workspace_id',NEW.workspace_id,'family',NEW.family,
 'id',NEW.id,'version',NEW.version,'schema_version',NEW.schema_version,'evaluator_version',NEW.evaluator_version,
 'proposal',jsonb_build_object('id',NEW.proposal_id,'version',NEW.proposal_version,'content_hash',NEW.proposal_hash),
 'reviewer_id',NEW.reviewer_id,'review_event_id',NEW.review_event_id,'population_hash',NEW.population_hash))
 OR b->'root_policy_id' IS DISTINCT FROM p.content->'root_policy_id' OR b->'source' IS DISTINCT FROM p.content->'source'
 OR b->'expected_head' IS DISTINCT FROM p.content->'expected_head' OR NEW.evaluated_at IS DISTINCT FROM (b->>'evaluated_at')::timestamptz
 OR NEW.evaluated_at<p.proposed_at OR NEW.evaluated_at>=(p.content->>'effective_from')::timestamptz THEN
 RAISE EXCEPTION 'Exact review bindings required' USING ERRCODE='23514'; END IF; RETURN NEW;
END $$;
CREATE TRIGGER scheduling_review_content BEFORE INSERT ON ppo.scheduling_policy_reviews FOR EACH ROW EXECUTE FUNCTION ppo.check_scheduling_review();

CREATE FUNCTION ppo.check_scheduling_population() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE rid uuid; expected jsonb; actual jsonb; BEGIN
 IF TG_TABLE_NAME='scheduling_policy_reviews' THEN rid:=NEW.id; ELSE rid:=NEW.review_id; END IF;
 SELECT content->'candidates' INTO STRICT expected FROM ppo.scheduling_policy_reviews WHERE workspace_id=NEW.workspace_id AND id=rid;
 SELECT coalesce(jsonb_agg(content ORDER BY ordinal),'[]'::jsonb) INTO actual FROM ppo.scheduling_policy_candidates WHERE workspace_id=NEW.workspace_id AND review_id=rid;
 IF actual IS DISTINCT FROM expected THEN RAISE EXCEPTION 'Complete ordered reviewed population required' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER scheduling_complete_population AFTER INSERT ON ppo.scheduling_policy_reviews DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_scheduling_population();
CREATE CONSTRAINT TRIGGER scheduling_complete_population AFTER INSERT ON ppo.scheduling_policy_candidates DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_scheduling_population();
CREATE FUNCTION ppo.check_scheduling_candidate() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE b jsonb:=NEW.content; booking jsonb:=b#>'{dependencies,booking}'; a ppo.appointments; r ppo.scheduling_policy_reviews; BEGIN
 SELECT * INTO STRICT a FROM ppo.appointments WHERE workspace_id=NEW.workspace_id AND id=NEW.appointment_id;
 SELECT * INTO STRICT r FROM ppo.scheduling_policy_reviews WHERE workspace_id=NEW.workspace_id AND id=NEW.review_id;
 IF b IS DISTINCT FROM r.content->'candidates'->NEW.ordinal
 OR NOT (booking @> jsonb_build_object('appointment',jsonb_build_object('id',NEW.appointment_id,'version',NEW.appointment_version,'content_hash',NEW.appointment_hash),
 'company_id',NEW.company_id,'site_id',NEW.site_id,'work_order_id',NEW.work_order_id))
 OR b->>'dependency_fingerprint' IS DISTINCT FROM NEW.dependency_fingerprint OR b#>>'{evaluation,outcome}' IS DISTINCT FROM NEW.outcome
 OR (b->>'impact_owner_id')::uuid IS DISTINCT FROM NEW.impact_owner_id
 OR (a.company_id,a.site_id,a.work_order_id) IS DISTINCT FROM (NEW.company_id,NEW.site_id,NEW.work_order_id)
 OR NOT (b->'dependencies' @> jsonb_build_object('workspace_id',NEW.workspace_id,'family',r.family,'root_policy_id',r.content->'root_policy_id'))
 THEN RAISE EXCEPTION 'Exact typed review candidate required' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER scheduling_candidate_content BEFORE INSERT ON ppo.scheduling_policy_candidates FOR EACH ROW EXECUTE FUNCTION ppo.check_scheduling_candidate();

CREATE FUNCTION ppo.check_scheduling_head() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='INSERT' AND NEW.version<>1 THEN RAISE EXCEPTION 'Head starts at trusted root' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND ((NEW.workspace_id,NEW.family) IS DISTINCT FROM (OLD.workspace_id,OLD.family)
 OR NEW.version<>OLD.version+1 OR NOT EXISTS(SELECT 1 FROM ppo.scheduling_policy_members m WHERE m.workspace_id=NEW.workspace_id AND m.family=NEW.family AND m.policy_id=NEW.policy_id AND m.predecessor_id=OLD.policy_id)) THEN
 RAISE EXCEPTION 'Head advances exactly once to immediate successor' USING ERRCODE='23514'; END IF; RETURN NEW;
END $$;
CREATE TRIGGER scheduling_head_advance BEFORE INSERT OR UPDATE ON ppo.scheduling_policy_heads FOR EACH ROW EXECUTE FUNCTION ppo.check_scheduling_head();
CREATE FUNCTION ppo.check_scheduling_chain_complete() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM ppo.scheduling_policy_heads h WHERE h.workspace_id=NEW.workspace_id AND h.family=NEW.family
 AND h.version=(SELECT max(m.chain_version) FROM ppo.scheduling_policy_members m WHERE m.workspace_id=h.workspace_id AND m.family=h.family)) THEN
 RAISE EXCEPTION 'Family must retain complete chain and latest head' USING ERRCODE='23514'; END IF; RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER scheduling_chain_complete AFTER INSERT ON ppo.scheduling_policy_families DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_scheduling_chain_complete();
CREATE CONSTRAINT TRIGGER scheduling_chain_complete AFTER INSERT ON ppo.scheduling_policy_members DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_scheduling_chain_complete();
CREATE CONSTRAINT TRIGGER scheduling_chain_complete AFTER INSERT OR UPDATE ON ppo.scheduling_policy_heads DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_scheduling_chain_complete();

CREATE FUNCTION ppo.check_scheduling_publication() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE p ppo.scheduling_policy_proposals; r ppo.scheduling_policy_reviews; m ppo.scheduling_policy_members; receipt ppo.operation_receipts; BEGIN
 SELECT * INTO STRICT p FROM ppo.scheduling_policy_proposals WHERE workspace_id=NEW.workspace_id AND id=NEW.proposal_id;
 SELECT * INTO STRICT r FROM ppo.scheduling_policy_reviews WHERE workspace_id=NEW.workspace_id AND id=NEW.review_id;
 SELECT * INTO STRICT m FROM ppo.scheduling_policy_members WHERE workspace_id=NEW.workspace_id AND policy_id=NEW.policy_id;
 SELECT * INTO STRICT receipt FROM ppo.operation_receipts WHERE workspace_id=NEW.workspace_id AND actor_id=NEW.created_by AND operation_id=NEW.operation_id;
 IF r.proposal_id<>p.id OR NEW.predecessor_id<>p.source_id OR NEW.head_version<>p.expected_head_version+1
 OR m.publication_id<>NEW.id OR m.predecessor_id<>NEW.predecessor_id OR NEW.created_by=r.reviewer_id
 OR NEW.created_at<r.evaluated_at OR NEW.created_at>=(m.content->>'effective_from')::timestamptz
 OR (m.content-ARRAY['id','version','effective_from','max_visit_minutes'])<>p.content->'fixed_terms'
 OR m.content->'effective_from' IS DISTINCT FROM p.content->'effective_from' OR m.content->'max_visit_minutes' IS DISTINCT FROM p.content->'max_visit_minutes'
 OR NEW.command IS DISTINCT FROM jsonb_build_object('command','PublishSchedulingPolicy','schema_version',1,'operation_id',NEW.operation_id,'proposal',r.content->'proposal',
 'review',jsonb_build_object('id',r.id,'version',r.version,'content_hash',r.content_hash),'source',p.content->'source',
 'expected_head_version',p.expected_head_version,'selected_policy',jsonb_build_object('id',m.policy_id,'version',m.policy_version,'content_hash',m.content_hash),'reason',NEW.command->'reason')
 OR length(btrim(coalesce(NEW.command->>'reason','')))=0
 OR receipt.id<>NEW.receipt_id OR receipt.record_id<>NEW.id OR receipt.payload_hash<>NEW.command_hash
 OR NOT (receipt.result @> jsonb_build_object('operation_id',NEW.operation_id,'receipt_id',NEW.receipt_id,'record_id',NEW.id,'record_version',NEW.version,'state','Published')) THEN
 RAISE EXCEPTION 'Exact publication, source, review and original receipt required' USING ERRCODE='23514'; END IF; RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER scheduling_publication_binding AFTER INSERT ON ppo.scheduling_policy_publications DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_scheduling_publication();

CREATE FUNCTION ppo.check_scheduling_impact() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE c ppo.scheduling_policy_candidates; pub ppo.scheduling_policy_publications; BEGIN
 SELECT * INTO STRICT c FROM ppo.scheduling_policy_candidates WHERE workspace_id=NEW.workspace_id AND review_id=NEW.review_id AND appointment_id=NEW.appointment_id;
 SELECT * INTO STRICT pub FROM ppo.scheduling_policy_publications WHERE workspace_id=NEW.workspace_id AND id=NEW.publication_id;
 IF pub.review_id<>NEW.review_id OR c.outcome<>'ImpactRequired' OR NEW.content IS DISTINCT FROM c.content THEN
 RAISE EXCEPTION 'Impact must preserve exact affected reviewed candidate' USING ERRCODE='23514'; END IF; RETURN NEW;
END $$;
CREATE TRIGGER scheduling_impact_content BEFORE INSERT ON ppo.scheduling_policy_impacts FOR EACH ROW EXECUTE FUNCTION ppo.check_scheduling_impact();
CREATE FUNCTION ppo.check_scheduling_impact_activity() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE i ppo.scheduling_policy_impacts; c ppo.scheduling_policy_candidates; a ppo.activities; BEGIN
 SELECT * INTO STRICT i FROM ppo.scheduling_policy_impacts WHERE workspace_id=NEW.workspace_id AND id=NEW.impact_id;
 SELECT * INTO STRICT c FROM ppo.scheduling_policy_candidates WHERE workspace_id=i.workspace_id AND review_id=i.review_id AND appointment_id=i.appointment_id;
 SELECT * INTO STRICT a FROM ppo.activities WHERE workspace_id=NEW.workspace_id AND id=NEW.activity_id;
 IF (a.company_id,a.site_id,a.owner_id) IS DISTINCT FROM (c.company_id,c.site_id,c.impact_owner_id)
 OR a.kind<>'TechnicalFollowUp' OR a.activity_type<>'Task' OR a.access_class<>'RestrictedService'
 OR NOT EXISTS(SELECT 1 FROM ppo.activity_links l WHERE l.workspace_id=a.workspace_id AND l.activity_id=a.id AND l.object_type='Site' AND l.object_id=c.site_id) THEN
 RAISE EXCEPTION 'Impact Activity must retain typed site and reviewed owner' USING ERRCODE='23514'; END IF; RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER scheduling_impact_activity_binding AFTER INSERT ON ppo.scheduling_policy_impact_activities DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_scheduling_impact_activity();
CREATE FUNCTION ppo.check_scheduling_resolution() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE i ppo.scheduling_policy_impacts; prev ppo.scheduling_policy_resolutions; b jsonb:=NEW.content; BEGIN
 SELECT * INTO STRICT i FROM ppo.scheduling_policy_impacts WHERE workspace_id=NEW.workspace_id AND id=NEW.impact_id;
 IF NEW.predecessor_id IS NOT NULL THEN
  SELECT * INTO STRICT prev FROM ppo.scheduling_policy_resolutions WHERE workspace_id=NEW.workspace_id AND id=NEW.predecessor_id;
  IF NEW.sequence<>prev.sequence+1 OR NEW.observed_at<prev.observed_at THEN RAISE EXCEPTION 'Resolution sequence cannot branch or rewind' USING ERRCODE='23514'; END IF;
 END IF;
 IF NEW.appointment_id<>i.appointment_id OR NOT (b @> jsonb_build_object('id',NEW.id,'workspace_id',NEW.workspace_id,
 'impact_id',NEW.impact_id,'impact_hash',i.content_hash,'sequence',NEW.sequence,'predecessor_id',NEW.predecessor_id,
 'actor_id',NEW.actor_id,'operation_id',NEW.operation_id,'appointment_id',NEW.appointment_id,'appointment_version',NEW.appointment_version,
 'replacement_id',NEW.replacement_id,'outcome',NEW.outcome,'schema_version',NEW.schema_version,'evaluator_version',NEW.evaluator_version))
 OR NEW.observed_at IS DISTINCT FROM (b->>'observed_at')::timestamptz
 OR length(btrim(coalesce(b->>'reason','')))=0 OR jsonb_typeof(b->'dependencies') IS DISTINCT FROM 'object'
 OR b#>>'{dependencies,booking,appointment,id}' IS DISTINCT FROM NEW.appointment_id::text
 OR (b#>>'{dependencies,booking,appointment,version}')::integer IS DISTINCT FROM NEW.appointment_version THEN
 RAISE EXCEPTION 'Exact resolution evidence required' USING ERRCODE='23514'; END IF; RETURN NEW;
END $$;
CREATE TRIGGER scheduling_resolution_content BEFORE INSERT ON ppo.scheduling_policy_resolutions FOR EACH ROW EXECUTE FUNCTION ppo.check_scheduling_resolution();

-- A committed publication cannot omit an affected candidate, task companion or
-- original receipt. This is graph integrity, not permission or stale-review proof.
CREATE FUNCTION ppo.check_scheduling_publication_complete() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE pid uuid; pub ppo.scheduling_policy_publications; expected uuid[]; actual uuid[]; receipt ppo.operation_receipts; BEGIN
 IF TG_TABLE_NAME='scheduling_policy_publications' THEN pid:=NEW.id;
 ELSIF TG_TABLE_NAME='scheduling_policy_impacts' THEN pid:=NEW.publication_id;
 ELSE SELECT publication_id INTO STRICT pid FROM ppo.scheduling_policy_impacts WHERE workspace_id=NEW.workspace_id AND id=NEW.impact_id;
 END IF;
 SELECT * INTO STRICT pub FROM ppo.scheduling_policy_publications WHERE workspace_id=NEW.workspace_id AND id=pid;
 SELECT coalesce(array_agg(appointment_id ORDER BY appointment_id),'{}'::uuid[]) INTO expected
 FROM ppo.scheduling_policy_candidates WHERE workspace_id=pub.workspace_id AND review_id=pub.review_id AND outcome='ImpactRequired';
 SELECT coalesce(array_agg(appointment_id ORDER BY appointment_id),'{}'::uuid[]) INTO actual
 FROM ppo.scheduling_policy_impacts WHERE workspace_id=pub.workspace_id AND publication_id=pid;
 IF expected<>actual OR EXISTS(SELECT 1 FROM ppo.scheduling_policy_impacts i WHERE i.workspace_id=pub.workspace_id AND i.publication_id=pid
 AND NOT EXISTS(SELECT 1 FROM ppo.scheduling_policy_impact_activities a WHERE a.workspace_id=i.workspace_id AND a.impact_id=i.id)) THEN
 RAISE EXCEPTION 'Publication requires every affected snapshot and typed task' USING ERRCODE='23514'; END IF;
 SELECT * INTO STRICT receipt FROM ppo.operation_receipts WHERE workspace_id=pub.workspace_id AND actor_id=pub.created_by AND operation_id=pub.operation_id;
 -- Receipt task_ids keeps its existing outbox meaning. Activity IDs are resolved
 -- from typed companions above, not substituted into the generic receipt.
 IF (receipt.result->>'accepted_at')::timestamptz IS DISTINCT FROM pub.created_at THEN
 RAISE EXCEPTION 'Receipt must retain exact publication time' USING ERRCODE='23514'; END IF; RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER scheduling_publication_complete AFTER INSERT ON ppo.scheduling_policy_publications DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_scheduling_publication_complete();
CREATE CONSTRAINT TRIGGER scheduling_publication_complete AFTER INSERT ON ppo.scheduling_policy_impacts DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_scheduling_publication_complete();
CREATE CONSTRAINT TRIGGER scheduling_publication_complete AFTER INSERT ON ppo.scheduling_policy_impact_activities DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_scheduling_publication_complete();

DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['scheduling_policy_families','scheduling_policy_members','scheduling_policy_proposals',
 'scheduling_policy_reviews','scheduling_policy_candidates','scheduling_policy_publications','scheduling_policy_impacts',
 'scheduling_policy_impact_activities','scheduling_policy_resolutions'] LOOP
 EXECUTE format('CREATE TRIGGER scheduling_evidence_immutable BEFORE UPDATE OR DELETE ON ppo.%I FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence()',t);
 END LOOP;
END $$;
CREATE TRIGGER scheduling_head_retained BEFORE DELETE ON ppo.scheduling_policy_heads FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
