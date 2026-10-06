-- API-C26 Step 3. Commands remain unregistered until Step 4 enforcement is delivered.
-- Preserve installed 0053 and reserved Maintenance 0051 / Products 0052.
SET CONSTRAINTS ppo.identity_target IMMEDIATE;
DO $$ DECLARE r record; d text; BEGIN
 FOR r IN SELECT * FROM (VALUES
 ('business_identities','ck_identities_type','object_type','SchedulingPolicyProposal,SchedulingPolicyReview,SchedulingPolicyResolution'),
 ('audit_events','ck_audit_object_type','object_type','SchedulingPolicyProposal,SchedulingPolicyReview,SchedulingPolicyPublication,SchedulingPolicyResolution'),
 ('outbox_jobs','ck_outbox_kind','kind','SchedulingPolicyProposalSaved,SchedulingPolicyReviewed,PolicyOrTemplatePublished,SchedulingPolicyImpactResolved'),
 ('permission_grants','ck_grants_capability','capability','schedule.policy.review,schedule.policy.publish')) v(tab,con,col,added) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT d FROM pg_constraint WHERE conrelid=('ppo.'||r.tab)::regclass AND conname=r.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',r.tab,r.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR %I=ANY(%L::text[]))',r.tab,r.con,substring(d from 8 for length(d)-8),r.col,string_to_array(r.added,','));
 END LOOP;
 SELECT pg_get_functiondef('ppo.identity_has_typed_record()'::regprocedure) INTO d;
 IF position('CASE NEW.object_type' in d)=0 THEN RAISE EXCEPTION 'Inspect changed identity dispatch'; END IF;
 EXECUTE replace(d,'CASE NEW.object_type','CASE NEW.object_type WHEN ''SchedulingPolicyProposal'' THEN ''scheduling_policy_proposals'' WHEN ''SchedulingPolicyReview'' THEN ''scheduling_policy_reviews'' WHEN ''SchedulingPolicyResolution'' THEN ''scheduling_policy_resolutions''');
END $$;
SET CONSTRAINTS ppo.identity_target DEFERRED;

-- Generic original receipts reference their actual typed result, never an unrelated
-- Activity or policy. Existing evidence is retained without fabricated receipts.
INSERT INTO ppo.business_identities(workspace_id,id,object_type)
 SELECT workspace_id,id,'SchedulingPolicyProposal' FROM ppo.scheduling_policy_proposals
 UNION ALL SELECT workspace_id,id,'SchedulingPolicyReview' FROM ppo.scheduling_policy_reviews
 UNION ALL SELECT workspace_id,id,'SchedulingPolicyResolution' FROM ppo.scheduling_policy_resolutions;
CREATE TRIGGER register_identity BEFORE INSERT ON ppo.scheduling_policy_proposals
 FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('SchedulingPolicyProposal','');
CREATE TRIGGER register_identity BEFORE INSERT ON ppo.scheduling_policy_reviews
 FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('SchedulingPolicyReview','');
CREATE TRIGGER register_identity BEFORE INSERT ON ppo.scheduling_policy_resolutions
 FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('SchedulingPolicyResolution','');

-- Supplement the unchanged Step 1 review contract with current reviewer authority,
-- explicit server exclusions and a server-allocated successor identity. A legacy
-- storage-only review without this evidence cannot be published by the new command.
CREATE TABLE ppo.scheduling_policy_review_contexts (
 workspace_id uuid NOT NULL, review_id uuid NOT NULL,
 content jsonb NOT NULL, canonical_content text NOT NULL, content_hash text NOT NULL,
 PRIMARY KEY(workspace_id,review_id),
 FOREIGN KEY(workspace_id,review_id) REFERENCES ppo.scheduling_policy_reviews(workspace_id,id),
 CHECK(ppo.scheduling_evidence_bytes(content,canonical_content,content_hash)),
 CHECK(content->>'schema_version'='1' AND content->>'workspace_id'=workspace_id::text AND content#>>'{review,id}'=review_id::text)
);
CREATE TRIGGER scheduling_evidence_immutable BEFORE UPDATE OR DELETE ON ppo.scheduling_policy_review_contexts
 FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
