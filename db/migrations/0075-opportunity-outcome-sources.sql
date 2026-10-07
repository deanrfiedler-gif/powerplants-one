-- CRM-03: an explicit commercial decision basis, separate from native quotation authority.
CREATE TABLE ppo.opportunity_outcome_sources (
 workspace_id uuid NOT NULL, company_id uuid NOT NULL, opportunity_id uuid NOT NULL,
 event_id uuid NOT NULL, operation_id uuid NOT NULL, recorded_by uuid NOT NULL,
 source_kind text NOT NULL CHECK(source_kind IN ('Independent','Quotation')),
 evidence text, quote_id uuid, revision_id uuid, issue_id uuid, response_event_id uuid,
 quote_version integer, response_sequence integer, output_hash text, reported_outcome text,
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(workspace_id,event_id), UNIQUE(workspace_id,recorded_by,operation_id),
 FOREIGN KEY(workspace_id,company_id,opportunity_id) REFERENCES ppo.opportunities(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,event_id) REFERENCES ppo.opportunity_events(workspace_id,id),
 FOREIGN KEY(workspace_id,quote_id,revision_id) REFERENCES ppo.draft_quote_revisions(workspace_id,quote_id,id),
 FOREIGN KEY(workspace_id,quote_id,issue_id) REFERENCES ppo.quote_release_events(workspace_id,quote_id,id),
 FOREIGN KEY(workspace_id,revision_id,response_event_id) REFERENCES ppo.quote_response_events(workspace_id,revision_id,id),
 FOREIGN KEY(workspace_id,recorded_by) REFERENCES ppo.users(workspace_id,id),
 CHECK ((source_kind='Independent' AND length(btrim(evidence)) BETWEEN 1 AND 2000 AND evidence IS NOT NULL AND quote_id IS NULL AND revision_id IS NULL AND issue_id IS NULL AND response_event_id IS NULL AND quote_version IS NULL AND response_sequence IS NULL AND output_hash IS NULL AND reported_outcome IS NULL)
  OR (source_kind='Quotation' AND evidence IS NULL AND quote_id IS NOT NULL AND revision_id IS NOT NULL AND issue_id IS NOT NULL AND response_event_id IS NOT NULL AND quote_version IS NOT NULL AND quote_version>0 AND response_sequence IS NOT NULL AND response_sequence>0 AND output_hash IS NOT NULL AND output_hash ~ '^[a-f0-9]{64}$' AND reported_outcome IS NOT NULL AND reported_outcome IN ('Accepted','Declined')))
);
CREATE TRIGGER retain_opportunity_outcome_source BEFORE UPDATE OR DELETE ON ppo.opportunity_outcome_sources FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.check_opportunity_outcome_source() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NOT EXISTS (
  SELECT 1 FROM ppo.opportunity_events e
  JOIN ppo.audit_events a ON (a.workspace_id,a.actor_id,a.operation_id)=(e.workspace_id,e.created_by,e.operation_id)
  JOIN ppo.operation_receipts r ON (r.workspace_id,r.actor_id,r.operation_id)=(a.workspace_id,a.actor_id,a.operation_id)
  JOIN ppo.outbox_jobs j ON (j.workspace_id,j.actor_id,j.operation_id)=(a.workspace_id,a.actor_id,a.operation_id)
  WHERE (e.workspace_id,e.company_id,e.opportunity_id,e.id,e.created_by,e.operation_id)=(NEW.workspace_id,NEW.company_id,NEW.opportunity_id,NEW.event_id,NEW.recorded_by,NEW.operation_id)
   AND e.event_type='OpportunityOutcomeRecorded' AND a.object_type='Opportunity' AND a.object_id=e.opportunity_id AND a.outcome='Accepted'
   AND a.details->>'command'='RecordOpportunityOutcome' AND a.details->>'outcome_event_id'=e.id::text
   AND a.details->>'commercial_source_kind'=NEW.source_kind AND a.reason=e.reason
   AND r.record_id=e.opportunity_id AND (r.result->>'record_version')::integer=e.opportunity_version AND r.result->>'state'=e.close_outcome
   AND j.kind='OpportunityOutcomeRecorded' AND j.payload->>'record_id'=e.opportunity_id::text
 ) THEN RAISE EXCEPTION 'Retain the exact outcome, original receipt and source publication' USING ERRCODE='23514'; END IF;
 IF NEW.source_kind='Quotation' AND NOT EXISTS (
  SELECT 1 FROM ppo.opportunity_events e
  JOIN ppo.draft_quote_revisions q ON q.workspace_id=e.workspace_id AND q.id=NEW.revision_id
  JOIN ppo.estimates est ON (est.workspace_id,est.company_id,est.id)=(q.workspace_id,q.company_id,q.estimate_id)
  JOIN ppo.draft_quotes h ON (h.workspace_id,h.id)=(q.workspace_id,q.quote_id)
  JOIN ppo.quote_release_events issued ON (issued.workspace_id,issued.quote_id,issued.id)=(q.workspace_id,q.quote_id,NEW.issue_id)
  JOIN ppo.quote_response_events response ON (response.workspace_id,response.revision_id,response.id)=(q.workspace_id,q.id,NEW.response_event_id)
  WHERE (e.workspace_id,e.id)=(NEW.workspace_id,NEW.event_id) AND est.opportunity_id=e.opportunity_id AND est.company_id=e.company_id
   AND h.current_revision_id=q.id AND h.version=NEW.quote_version AND q.quote_id=NEW.quote_id
   AND issued.action='Issue' AND issued.revision_id=q.id AND issued.output_hash=NEW.output_hash
   AND issued.id=(SELECT id FROM ppo.quote_release_events WHERE workspace_id=q.workspace_id AND quote_id=q.quote_id AND action='Issue' ORDER BY sequence DESC LIMIT 1)
   AND response.action IN ('Record','Correct') AND response.issue_id=issued.id AND response.output_hash=NEW.output_hash AND response.report->>'outcome'=NEW.reported_outcome
   AND response.id=(SELECT id FROM ppo.quote_response_events WHERE workspace_id=q.workspace_id AND revision_id=q.id AND action IN ('Record','Correct') ORDER BY sequence DESC LIMIT 1)
   AND NEW.response_sequence=(SELECT max(sequence) FROM ppo.quote_response_events WHERE workspace_id=q.workspace_id AND revision_id=q.id)
   AND ((e.close_outcome='Won' AND NEW.reported_outcome='Accepted') OR (e.close_outcome='Lost' AND NEW.reported_outcome='Declined'))
 ) THEN RAISE EXCEPTION 'Compare the exact current issued response for this Deal outcome' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER opportunity_outcome_source_evidence AFTER INSERT ON ppo.opportunity_outcome_sources DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_opportunity_outcome_source();
