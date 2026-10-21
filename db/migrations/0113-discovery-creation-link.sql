-- ES-02: retain separate-link evidence and permit one reviewed creation transaction.
-- No grants, seed data or historical binding rows change.
CREATE OR REPLACE FUNCTION ppo.check_sales_estimating_binding() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NOT EXISTS (
  SELECT 1 FROM ppo.sales_handovers h
  JOIN ppo.sales_workflow_events e ON (e.workspace_id,e.record_id,e.id)=(h.workspace_id,h.id,NEW.acceptance_event_id)
  JOIN ppo.estimating_workspaces g ON (g.workspace_id,g.company_id,g.opportunity_id)=(h.workspace_id,h.company_id,h.opportunity_id)
  JOIN ppo.estimating_options o ON (o.workspace_id,o.estimating_workspace_id,o.id)=(g.workspace_id,g.id,g.selected_option_id)
  WHERE (h.workspace_id,h.id,h.company_id)=(NEW.workspace_id,NEW.handover_id,NEW.company_id)
   AND h.kind='Estimating' AND h.state='Accepted'
   AND e.action='Accept' AND e.version=h.version AND e.revision=h.revision AND e.source_hash=h.source_hash AND e.recorded_by=h.receiving_owner_id
   AND g.id=NEW.estimating_workspace_id AND g.version=NEW.estimating_version
   AND o.id=NEW.selected_option_id AND o.current_revision_id=NEW.selected_revision_id AND o.state='Active'
 ) THEN RAISE EXCEPTION 'Compare the exact current accepted Sales brief and native workspace' USING ERRCODE='23514'; END IF;

 IF NOT EXISTS (
  SELECT 1 FROM ppo.audit_events a
  JOIN ppo.operation_receipts r ON (r.workspace_id,r.actor_id,r.operation_id)=(a.workspace_id,a.actor_id,a.operation_id)
  JOIN ppo.outbox_jobs j ON (j.workspace_id,j.actor_id,j.operation_id)=(a.workspace_id,a.actor_id,a.operation_id)
  JOIN ppo.estimating_workspaces g ON (g.workspace_id,g.id)=(NEW.workspace_id,NEW.estimating_workspace_id)
  JOIN ppo.sales_handovers h ON (h.workspace_id,h.id)=(NEW.workspace_id,NEW.handover_id)
  WHERE (a.workspace_id,a.actor_id,a.operation_id)=(NEW.workspace_id,NEW.recorded_by,NEW.operation_id)
   AND a.outcome='Accepted' AND a.reason=NEW.reason
   AND (
    (
     a.object_type='SalesHandover' AND a.object_id=NEW.handover_id
     AND a.details->>'command'='SalesHandover:BindEstimating'
     AND a.details->>'acceptance_event_id'=NEW.acceptance_event_id::text
     AND a.details->>'estimating_workspace_id'=NEW.estimating_workspace_id::text
     AND a.details->>'selected_revision_id'=NEW.selected_revision_id::text
     AND g.owner_id=NEW.recorded_by AND h.receiving_owner_id=NEW.recorded_by
     AND r.record_id=NEW.handover_id AND r.result->>'state'='WorkspaceLinked'
     AND j.kind='SharedRecordUpdated' AND j.payload->>'record_id'=NEW.handover_id::text
    ) OR (
     a.object_type='EstimatingWorkspace' AND a.object_id=g.id
     AND a.details->>'command'='CreateEstimatingWorkspace'
     AND a.details->>'record_version'='1' AND g.version=1 AND g.state='Draft'
     AND g.created_by=NEW.recorded_by AND g.updated_by=NEW.recorded_by
     AND a.details->>'option_id'=NEW.selected_option_id::text
     AND a.details->>'selected_option_id'=NEW.selected_option_id::text
     AND a.details->>'revision_id'=NEW.selected_revision_id::text
     AND a.details#>>'{creation,owner_id}'=g.owner_id::text
     AND a.details#>>'{creation,sales_brief,handover_id}'=h.id::text
     AND a.details#>>'{creation,sales_brief,acceptance_event_id}'=NEW.acceptance_event_id::text
     AND a.details#>>'{creation,sales_brief,expected_version}'=h.version::text
     AND a.details#>>'{creation,sales_brief,source_hash}'=h.source_hash
     AND EXISTS (
      SELECT 1 FROM ppo.estimation_revisions v
      JOIN ppo.estimating_options o ON (o.workspace_id,o.id)=(v.workspace_id,v.option_id)
      WHERE (v.workspace_id,v.estimating_workspace_id,v.option_id,v.id)=
       (g.workspace_id,g.id,NEW.selected_option_id,NEW.selected_revision_id)
       AND v.version=1 AND v.kind='Discovery' AND v.created_by=NEW.recorded_by
       AND o.ordinal=1 AND o.created_by=NEW.recorded_by
       AND a.details->>'context_hash'=v.context_hash AND a.details->>'content_hash'=v.content_hash
     )
     AND r.record_id=g.id AND r.result->>'state'='Draft' AND r.result->>'record_version'='1'
     AND j.kind='EstimatingWorkspaceCreated' AND j.payload->>'record_id'=g.id::text
     AND j.payload->>'record_version'='1'
    )
   )
 ) THEN RAISE EXCEPTION 'Retain the exact Sales link or workspace creation receipt and publication' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
