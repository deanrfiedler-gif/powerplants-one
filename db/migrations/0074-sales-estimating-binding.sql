-- CRM-03 / EST-01: exact accepted Sales context beside independently authored Discovery.
CREATE TABLE ppo.sales_estimating_bindings (
 workspace_id uuid NOT NULL, company_id uuid NOT NULL, handover_id uuid NOT NULL,
 acceptance_event_id uuid NOT NULL, estimating_workspace_id uuid NOT NULL,
 estimating_version integer NOT NULL CHECK(estimating_version>0),
 selected_option_id uuid NOT NULL, selected_revision_id uuid NOT NULL,
 operation_id uuid NOT NULL, recorded_by uuid NOT NULL, reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(workspace_id,handover_id,acceptance_event_id), UNIQUE(workspace_id,recorded_by,operation_id),
 FOREIGN KEY(workspace_id,handover_id) REFERENCES ppo.sales_handovers(workspace_id,id),
 FOREIGN KEY(workspace_id,handover_id,acceptance_event_id) REFERENCES ppo.sales_workflow_events(workspace_id,record_id,id),
 FOREIGN KEY(workspace_id,company_id,estimating_workspace_id) REFERENCES ppo.estimating_workspaces(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,estimating_workspace_id,selected_option_id) REFERENCES ppo.estimating_options(workspace_id,estimating_workspace_id,id),
 FOREIGN KEY(workspace_id,selected_option_id,selected_revision_id) REFERENCES ppo.estimation_revisions(workspace_id,option_id,id),
 FOREIGN KEY(workspace_id,recorded_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER retain_sales_estimating_binding BEFORE UPDATE OR DELETE ON ppo.sales_estimating_bindings FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.check_sales_estimating_binding() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NOT EXISTS (
  SELECT 1 FROM ppo.sales_handovers h
  JOIN ppo.sales_workflow_events e ON (e.workspace_id,e.record_id,e.id)=(h.workspace_id,h.id,NEW.acceptance_event_id)
  JOIN ppo.estimating_workspaces g ON (g.workspace_id,g.company_id,g.opportunity_id)=(h.workspace_id,h.company_id,h.opportunity_id)
  JOIN ppo.estimating_options o ON (o.workspace_id,o.estimating_workspace_id,o.id)=(g.workspace_id,g.id,g.selected_option_id)
  WHERE (h.workspace_id,h.id,h.company_id)=(NEW.workspace_id,NEW.handover_id,NEW.company_id)
   AND h.kind='Estimating' AND h.state='Accepted' AND h.receiving_owner_id=NEW.recorded_by
   AND e.action='Accept' AND e.version=h.version AND e.revision=h.revision AND e.source_hash=h.source_hash AND e.recorded_by=NEW.recorded_by
   AND g.id=NEW.estimating_workspace_id AND g.version=NEW.estimating_version AND g.owner_id=NEW.recorded_by
   AND o.id=NEW.selected_option_id AND o.current_revision_id=NEW.selected_revision_id AND o.state='Active'
 ) THEN RAISE EXCEPTION 'Compare the exact current accepted Sales brief and owned native workspace' USING ERRCODE='23514'; END IF;
 IF NOT EXISTS (
  SELECT 1 FROM ppo.audit_events a JOIN ppo.operation_receipts r ON (r.workspace_id,r.actor_id,r.operation_id)=(a.workspace_id,a.actor_id,a.operation_id)
  JOIN ppo.outbox_jobs j ON (j.workspace_id,j.actor_id,j.operation_id)=(a.workspace_id,a.actor_id,a.operation_id)
  WHERE (a.workspace_id,a.actor_id,a.operation_id)=(NEW.workspace_id,NEW.recorded_by,NEW.operation_id)
   AND a.object_type='SalesHandover' AND a.object_id=NEW.handover_id AND a.outcome='Accepted' AND a.reason=NEW.reason
   AND a.details->>'command'='SalesHandover:BindEstimating' AND a.details->>'acceptance_event_id'=NEW.acceptance_event_id::text
   AND a.details->>'estimating_workspace_id'=NEW.estimating_workspace_id::text
   AND a.details->>'selected_revision_id'=NEW.selected_revision_id::text
   AND r.record_id=NEW.handover_id AND r.result->>'state'='WorkspaceLinked'
   AND j.kind='SharedRecordUpdated' AND j.payload->>'record_id'=NEW.handover_id::text
 ) THEN RAISE EXCEPTION 'Retain the original Sales estimating link receipt and publication' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER sales_estimating_binding_evidence AFTER INSERT ON ppo.sales_estimating_bindings DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_sales_estimating_binding();
