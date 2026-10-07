-- CRM-03 / CRM-08: retained receiving evidence beside independently owned delivery.
CREATE TABLE ppo.sales_delivery_bindings (
 workspace_id uuid NOT NULL, company_id uuid NOT NULL, handover_id uuid NOT NULL,
 acceptance_event_id uuid NOT NULL, destination_kind text NOT NULL CHECK(destination_kind IN ('Projects','Service')),
 project_id uuid, work_order_id uuid, destination_site_id uuid NOT NULL,
 destination_version integer NOT NULL CHECK(destination_version>0),
 operation_id uuid NOT NULL, recorded_by uuid NOT NULL,
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(workspace_id,handover_id,acceptance_event_id), UNIQUE(workspace_id,recorded_by,operation_id),
 FOREIGN KEY(workspace_id,handover_id) REFERENCES ppo.sales_handovers(workspace_id,id),
 FOREIGN KEY(workspace_id,handover_id,acceptance_event_id) REFERENCES ppo.sales_workflow_events(workspace_id,record_id,id),
 FOREIGN KEY(workspace_id,company_id,project_id) REFERENCES ppo.projects(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,destination_site_id,work_order_id) REFERENCES ppo.work_orders(workspace_id,company_id,site_id,id),
 FOREIGN KEY(workspace_id,recorded_by) REFERENCES ppo.users(workspace_id,id),
 CHECK((destination_kind='Projects' AND project_id IS NOT NULL AND work_order_id IS NULL) OR (destination_kind='Service' AND project_id IS NULL AND work_order_id IS NOT NULL))
);
CREATE TRIGGER retain_sales_delivery_binding BEFORE UPDATE OR DELETE ON ppo.sales_delivery_bindings FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.check_sales_delivery_binding() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NOT EXISTS (
  SELECT 1 FROM ppo.sales_handovers h
  JOIN ppo.sales_workflow_events e ON (e.workspace_id,e.record_id,e.id)=(h.workspace_id,h.id,NEW.acceptance_event_id)
  WHERE (h.workspace_id,h.id,h.company_id)=(NEW.workspace_id,NEW.handover_id,NEW.company_id)
   AND h.kind='Won' AND h.state='Accepted' AND h.receiving_owner_id=NEW.recorded_by AND h.content->>'destination'=NEW.destination_kind
   AND e.content=h.content AND e.action='Accept' AND e.version=h.version AND e.revision=h.revision AND e.source_hash=h.source_hash AND e.recorded_by=NEW.recorded_by
   AND (h.site_id IS NULL OR h.site_id=NEW.destination_site_id)
   AND EXISTS(SELECT 1 FROM ppo.site_parties sp WHERE sp.workspace_id=h.workspace_id AND sp.company_id=h.company_id AND sp.site_id=NEW.destination_site_id AND sp.organisation_id=h.organisation_id AND sp.valid_from<=CURRENT_DATE AND (sp.valid_to IS NULL OR sp.valid_to>CURRENT_DATE))
   AND ((NEW.destination_kind='Projects' AND EXISTS(SELECT 1 FROM ppo.projects p WHERE (p.workspace_id,p.company_id,p.id,p.site_id,p.organisation_id,p.coordinator_id,p.version)=(h.workspace_id,h.company_id,NEW.project_id,NEW.destination_site_id,h.organisation_id,NEW.recorded_by,NEW.destination_version) AND p.lifecycle='Active'))
    OR (NEW.destination_kind='Service' AND EXISTS(SELECT 1 FROM ppo.work_orders w WHERE (w.workspace_id,w.company_id,w.id,w.site_id,w.customer_id,w.service_owner_id,w.version)=(h.workspace_id,h.company_id,NEW.work_order_id,NEW.destination_site_id,h.organisation_id,NEW.recorded_by,NEW.destination_version))))
 ) THEN RAISE EXCEPTION 'Compare the exact accepted Won handover and owned native delivery context' USING ERRCODE='23514'; END IF;
 IF NOT EXISTS (
  SELECT 1 FROM ppo.audit_events a JOIN ppo.operation_receipts r ON (r.workspace_id,r.actor_id,r.operation_id)=(a.workspace_id,a.actor_id,a.operation_id)
  JOIN ppo.outbox_jobs j ON (j.workspace_id,j.actor_id,j.operation_id)=(a.workspace_id,a.actor_id,a.operation_id)
  JOIN ppo.sales_workflow_events e ON (e.workspace_id,e.record_id,e.id)=(NEW.workspace_id,NEW.handover_id,NEW.acceptance_event_id)
  WHERE (a.workspace_id,a.actor_id,a.operation_id)=(NEW.workspace_id,NEW.recorded_by,NEW.operation_id)
   AND a.object_type='SalesHandover' AND a.object_id=NEW.handover_id AND a.outcome='Accepted' AND a.reason=NEW.reason
   AND a.details->>'command'='SalesHandover:BindDelivery' AND a.details->>'acceptance_event_id'=NEW.acceptance_event_id::text
   AND a.details->>'source_hash'=e.source_hash AND a.details->>'destination_kind'=NEW.destination_kind
   AND a.details->>'destination_id'=COALESCE(NEW.project_id,NEW.work_order_id)::text
   AND (a.details->>'destination_version')::integer=NEW.destination_version AND a.details->>'destination_site_id'=NEW.destination_site_id::text
   AND r.record_id=NEW.handover_id AND r.result->>'state'='DestinationLinked' AND (r.result->>'record_version')::integer=e.version
   AND j.kind='SharedRecordUpdated' AND j.payload->>'record_id'=NEW.handover_id::text
 ) THEN RAISE EXCEPTION 'Retain the original delivery link receipt and publication' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER sales_delivery_binding_evidence AFTER INSERT ON ppo.sales_delivery_bindings DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_sales_delivery_binding();
