-- FI-07 extends the immutable P09 response; it never rewrites installed facts,
-- templates, identities, grants, receipts or reserved migration allocations.
CREATE TABLE ppo.customer_response_contexts (
 workspace_id uuid NOT NULL,
 response_id uuid PRIMARY KEY,
 subject text NOT NULL CHECK (subject IN ('ReportContent','AttendanceFacts')),
 review_id uuid NOT NULL,
 supersedes_response_id uuid,
 correction_reason text,
 source_binding jsonb NOT NULL CHECK (jsonb_typeof(source_binding)='object'),
 restrictions jsonb NOT NULL CHECK (jsonb_typeof(restrictions)='object'),
 UNIQUE(workspace_id,response_id),
 FOREIGN KEY(workspace_id,response_id) REFERENCES ppo.customer_responses(workspace_id,id),
 FOREIGN KEY(workspace_id,review_id) REFERENCES ppo.report_reviews(workspace_id,id),
 FOREIGN KEY(workspace_id,supersedes_response_id) REFERENCES ppo.customer_responses(workspace_id,id),
 CHECK ((supersedes_response_id IS NULL AND correction_reason IS NULL) OR
   (supersedes_response_id IS NOT NULL AND supersedes_response_id<>response_id AND
    correction_reason IS NOT NULL AND length(btrim(correction_reason))>=10))
);
CREATE UNIQUE INDEX customer_response_one_successor
 ON ppo.customer_response_contexts(workspace_id,supersedes_response_id)
 WHERE supersedes_response_id IS NOT NULL;
CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON ppo.customer_response_contexts
 FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.check_customer_response_context() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE current_response ppo.customer_responses; prior_response ppo.customer_responses;
 reviewed ppo.report_reviews; presentation ppo.report_presentations; prior_subject text;
BEGIN
 SELECT * INTO current_response FROM ppo.customer_responses WHERE workspace_id=NEW.workspace_id AND id=NEW.response_id;
 SELECT * INTO presentation FROM ppo.report_presentations WHERE workspace_id=NEW.workspace_id AND id=current_response.presentation_id;
 SELECT * INTO reviewed FROM ppo.report_reviews WHERE workspace_id=NEW.workspace_id AND id=NEW.review_id;
 IF reviewed.id IS NULL OR reviewed.decision<>'Approved' OR
    reviewed.report_id IS DISTINCT FROM current_response.report_id OR
    reviewed.revision_id IS DISTINCT FROM presentation.revision_id THEN
   RAISE EXCEPTION 'Exact approved response context required' USING ERRCODE='23514';
 END IF;
 IF NEW.supersedes_response_id IS NOT NULL THEN
   SELECT * INTO prior_response FROM ppo.customer_responses WHERE workspace_id=NEW.workspace_id AND id=NEW.supersedes_response_id;
   SELECT subject INTO prior_subject FROM ppo.customer_response_contexts WHERE workspace_id=NEW.workspace_id AND response_id=NEW.supersedes_response_id;
   IF prior_response.id IS NULL OR prior_response.report_id<>current_response.report_id OR
      prior_response.presentation_id<>current_response.presentation_id OR
      coalesce(prior_subject,'ReportContent')<>NEW.subject OR
      prior_response.received_at>current_response.received_at THEN
     RAISE EXCEPTION 'Response correction must retain its exact subject and presentation' USING ERRCODE='23514';
   END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER exact_context BEFORE INSERT ON ppo.customer_response_contexts
 FOR EACH ROW EXECUTE FUNCTION ppo.check_customer_response_context();
