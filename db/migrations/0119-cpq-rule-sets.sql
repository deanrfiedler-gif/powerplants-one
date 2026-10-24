-- Configuration rule sets (ADR-0066 R2): roots, immutable revisions, owner acceptances of blocking
-- findings, independent reviews, publications and heads. Synthetic only (ADR-0066 Q6).
-- No grants, users, seeds or capabilities: the existing cpq.read/author/review/publish duties govern.
SET CONSTRAINTS ppo.identity_target IMMEDIATE;
DO $$ DECLARE spec record; definition text; BEGIN
 FOR spec IN SELECT * FROM (VALUES
  ('business_identities','ck_identities_type','object_type','CpqRuleSet'),
  ('audit_events','ck_audit_object_type','object_type','CpqRuleSet')
 ) v(tab,con,col,added) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid=('ppo.'||spec.tab)::regclass AND conname=spec.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',spec.tab,spec.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR %I = ANY(%L::text[]))',spec.tab,spec.con,substring(definition from 8 for length(definition)-8),spec.col,string_to_array(spec.added,','));
 END LOOP;
 SELECT pg_get_functiondef('ppo.identity_has_typed_record()'::regprocedure) INTO definition;
 IF position('CASE NEW.object_type' in definition)=0 THEN RAISE EXCEPTION 'Inspect changed identity dispatch'; END IF;
 EXECUTE replace(definition,'CASE NEW.object_type','CASE NEW.object_type WHEN ''CpqRuleSet'' THEN ''cpq_rule_sets''');
END $$;
SET CONSTRAINTS ppo.identity_target DEFERRED;

CREATE TABLE ppo.cpq_rule_sets (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL,
 key text NOT NULL CHECK(key ~ '^[a-z][a-z0-9_]{0,47}$'),
 label text NOT NULL CHECK(length(label) BETWEEN 1 AND 300),
 family text NOT NULL CHECK(length(family) BETWEEN 1 AND 300),
 owner_id uuid NOT NULL,
 version integer NOT NULL CHECK(version>0), current_revision_id uuid NOT NULL,
 state text NOT NULL CHECK(state IN ('Draft','Reviewed','Rejected','Published')),
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 updated_by uuid NOT NULL, updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id), UNIQUE(workspace_id,company_id,key),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER cpq_rule_set_identity BEFORE INSERT OR UPDATE ON ppo.cpq_rule_sets FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('CpqRuleSet','');
CREATE TRIGGER cpq_rule_set_retained BEFORE DELETE ON ppo.cpq_rule_sets FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

CREATE FUNCTION ppo.cpq_rule_set_fixed() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.company_id<>OLD.company_id OR NEW.key<>OLD.key OR NEW.owner_id<>OLD.owner_id OR NEW.created_by<>OLD.created_by OR NEW.created_at<>OLD.created_at OR NEW.synthetic<>OLD.synthetic THEN
  RAISE EXCEPTION 'A rule set keeps its company, key, owner and creation' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER cpq_rule_set_fixed BEFORE UPDATE ON ppo.cpq_rule_sets FOR EACH ROW EXECUTE FUNCTION ppo.cpq_rule_set_fixed();

CREATE TABLE ppo.cpq_rule_set_revisions (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, rule_set_id uuid NOT NULL,
 version integer NOT NULL CHECK(version>0), predecessor_id uuid,
 definition jsonb NOT NULL CHECK(jsonb_typeof(definition)='object' AND (definition->>'schema_version')='5' AND octet_length(definition::text)<=1048576),
 content_hash text NOT NULL CHECK(content_hash~'^[a-f0-9]{64}$'),
 test jsonb NOT NULL CHECK(jsonb_typeof(test)='object' AND (test->>'valid')='true'),
 reason text NOT NULL CHECK(length(reason) BETWEEN 1 AND 2000),
 created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,rule_set_id,id), UNIQUE(workspace_id,rule_set_id,version),
 FOREIGN KEY(workspace_id,company_id,rule_set_id) REFERENCES ppo.cpq_rule_sets(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,rule_set_id,predecessor_id) REFERENCES ppo.cpq_rule_set_revisions(workspace_id,rule_set_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
ALTER TABLE ppo.cpq_rule_sets ADD FOREIGN KEY(workspace_id,id,current_revision_id) REFERENCES ppo.cpq_rule_set_revisions(workspace_id,rule_set_id,id) DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE ppo.cpq_rule_set_acceptances (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, revision_id uuid NOT NULL,
 code text NOT NULL CHECK(code ~ '^[A-Z_]{1,40}$'), subject text NOT NULL CHECK(length(subject) BETWEEN 1 AND 200),
 reason text NOT NULL CHECK(length(reason) BETWEEN 1 AND 2000),
 accepted_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,revision_id,code,subject),
 FOREIGN KEY(workspace_id,revision_id) REFERENCES ppo.cpq_rule_set_revisions(workspace_id,id),
 FOREIGN KEY(workspace_id,accepted_by) REFERENCES ppo.users(workspace_id,id)
);

CREATE TABLE ppo.cpq_rule_set_reviews (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, revision_id uuid NOT NULL, reviewer_id uuid NOT NULL,
 outcome text NOT NULL CHECK(outcome IN ('Approved','Rejected')),
 content_hash text NOT NULL CHECK(content_hash~'^[a-f0-9]{64}$'),
 test jsonb NOT NULL CHECK(jsonb_typeof(test)='object'),
 reason text NOT NULL CHECK(length(reason) BETWEEN 1 AND 2000),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,revision_id),
 FOREIGN KEY(workspace_id,revision_id) REFERENCES ppo.cpq_rule_set_revisions(workspace_id,id),
 FOREIGN KEY(workspace_id,reviewer_id) REFERENCES ppo.users(workspace_id,id)
);

CREATE TABLE ppo.cpq_rule_set_publications (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, rule_set_id uuid NOT NULL,
 revision_id uuid NOT NULL, review_id uuid NOT NULL, version integer NOT NULL CHECK(version>0),
 reason text NOT NULL CHECK(length(reason) BETWEEN 1 AND 2000),
 created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,rule_set_id,id), UNIQUE(workspace_id,rule_set_id,version),
 FOREIGN KEY(workspace_id,company_id,rule_set_id) REFERENCES ppo.cpq_rule_sets(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,rule_set_id,revision_id) REFERENCES ppo.cpq_rule_set_revisions(workspace_id,rule_set_id,id),
 FOREIGN KEY(workspace_id,review_id) REFERENCES ppo.cpq_rule_set_reviews(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);

CREATE TABLE ppo.cpq_rule_set_heads (
 workspace_id uuid NOT NULL, rule_set_id uuid NOT NULL, publication_id uuid NOT NULL,
 PRIMARY KEY(workspace_id,rule_set_id),
 FOREIGN KEY(workspace_id,rule_set_id,publication_id) REFERENCES ppo.cpq_rule_set_publications(workspace_id,rule_set_id,id)
);

DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['cpq_rule_set_revisions','cpq_rule_set_acceptances','cpq_rule_set_reviews','cpq_rule_set_publications'] LOOP
  EXECUTE format('CREATE TRIGGER retained BEFORE UPDATE OR DELETE ON ppo.%I FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence()',t);
 END LOOP;
END $$;

-- A stored test result passes only when it has cases, none failed, and a coverage list.
-- Malformed JSON never passes: every comparison is on exact JSON values, never a cast.
CREATE FUNCTION ppo.cpq_rule_set_test_passes(t jsonb) RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
 SELECT COALESCE(jsonb_typeof(t->'summary'->'cases')='number' AND (t->'summary'->'cases')<>'0'::jsonb
  AND (t->'summary'->'failed')='0'::jsonb AND jsonb_typeof(t->'coverage')='array', false)
$$;

-- Governance holds even when the service is bypassed.
CREATE FUNCTION ppo.check_cpq_rule_set_governance() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE r ppo.cpq_rule_set_revisions; s ppo.cpq_rule_sets; review ppo.cpq_rule_set_reviews; finding jsonb;
BEGIN
 SELECT * INTO STRICT r FROM ppo.cpq_rule_set_revisions WHERE workspace_id=NEW.workspace_id AND id=NEW.revision_id;
 SELECT * INTO STRICT s FROM ppo.cpq_rule_sets WHERE workspace_id=NEW.workspace_id AND id=r.rule_set_id;
 IF TG_TABLE_NAME='cpq_rule_set_acceptances' THEN
  IF NEW.accepted_by<>s.owner_id THEN RAISE EXCEPTION 'Only the rule set owner accepts a blocking finding' USING ERRCODE='23514'; END IF;
  IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(r.test->'coverage') f WHERE f->>'severity'='Blocking' AND f->>'code'=NEW.code AND f->>'subject'=NEW.subject) THEN
   RAISE EXCEPTION 'Only a blocking finding of this revision can be accepted' USING ERRCODE='23514';
  END IF;
 ELSIF TG_TABLE_NAME='cpq_rule_set_reviews' THEN
  IF NEW.reviewer_id=r.created_by OR NEW.content_hash<>r.content_hash THEN RAISE EXCEPTION 'Independent review of exact rule set content required' USING ERRCODE='23514'; END IF;
  IF s.owner_id NOT IN (r.created_by, NEW.reviewer_id) THEN RAISE EXCEPTION 'The rule set owner must author or review the revision' USING ERRCODE='23514'; END IF;
  IF s.current_revision_id<>r.id OR s.state<>'Draft' THEN RAISE EXCEPTION 'Review the current draft revision' USING ERRCODE='23514'; END IF;
  IF NEW.outcome='Approved' THEN
   -- Both the result stored at save and the rerun at review must pass; neither is taken on trust alone.
   IF NOT ppo.cpq_rule_set_test_passes(r.test) OR NOT ppo.cpq_rule_set_test_passes(NEW.test) THEN
    RAISE EXCEPTION 'Every reference case must pass before approval' USING ERRCODE='23514';
   END IF;
   FOR finding IN SELECT f FROM jsonb_array_elements((r.test->'coverage') || (NEW.test->'coverage')) f WHERE f->>'severity'='Blocking' LOOP
    IF NOT EXISTS(SELECT 1 FROM ppo.cpq_rule_set_acceptances a WHERE a.workspace_id=NEW.workspace_id AND a.revision_id=r.id AND a.code=finding->>'code' AND a.subject=finding->>'subject') THEN
     RAISE EXCEPTION 'Every blocking finding must be accepted by the owner before approval' USING ERRCODE='23514';
    END IF;
   END LOOP;
  END IF;
 ELSE
  SELECT * INTO STRICT review FROM ppo.cpq_rule_set_reviews WHERE workspace_id=NEW.workspace_id AND id=NEW.review_id;
  IF review.revision_id<>r.id OR review.outcome<>'Approved' OR NEW.created_by IN (r.created_by, review.reviewer_id) OR NEW.rule_set_id<>r.rule_set_id
     OR s.current_revision_id<>r.id OR s.state<>'Reviewed' THEN
   RAISE EXCEPTION 'Independent publication of the exact approved revision required' USING ERRCODE='23514';
  END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER cpq_rule_set_acceptance_integrity BEFORE INSERT ON ppo.cpq_rule_set_acceptances FOR EACH ROW EXECUTE FUNCTION ppo.check_cpq_rule_set_governance();
CREATE TRIGGER cpq_rule_set_review_integrity BEFORE INSERT ON ppo.cpq_rule_set_reviews FOR EACH ROW EXECUTE FUNCTION ppo.check_cpq_rule_set_governance();
CREATE TRIGGER cpq_rule_set_publication_integrity BEFORE INSERT ON ppo.cpq_rule_set_publications FOR EACH ROW EXECUTE FUNCTION ppo.check_cpq_rule_set_governance();
CREATE INDEX cpq_rule_sets_company ON ppo.cpq_rule_sets(workspace_id,company_id,key);

-- A head only moves forward to a later publication of the same rule set, and is never removed.
CREATE FUNCTION ppo.cpq_rule_set_head_forward() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE before_version integer; after_version integer;
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'A rule set head is retained' USING ERRCODE='23514'; END IF;
 SELECT version INTO STRICT before_version FROM ppo.cpq_rule_set_publications WHERE workspace_id=OLD.workspace_id AND id=OLD.publication_id;
 SELECT version INTO STRICT after_version FROM ppo.cpq_rule_set_publications WHERE workspace_id=NEW.workspace_id AND id=NEW.publication_id;
 IF NEW.rule_set_id<>OLD.rule_set_id OR after_version<=before_version THEN RAISE EXCEPTION 'A rule set head only moves forward' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER cpq_rule_set_head_forward BEFORE UPDATE OR DELETE ON ppo.cpq_rule_set_heads FOR EACH ROW EXECUTE FUNCTION ppo.cpq_rule_set_head_forward();
