-- D-025 S3: synthetic native dispatch/customer-ETA evidence. No provider, grants or user rows.
-- All existing supply facts, communication bytes, publications and operation hashes are retained.
CREATE TABLE ppo.supply_customer_notice_options (
 kind text NOT NULL CHECK(kind IN ('Carrier','Platform','DelayReason')),
 code text PRIMARY KEY CHECK(code ~ '^SYN-(CAR|PLT|DLR)-[0-9]{6}$'),
 label text NOT NULL CHECK(length(btrim(label)) BETWEEN 1 AND 200),
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic), UNIQUE(kind,code),
 CHECK((kind='Carrier' AND code ~ '^SYN-CAR-') OR (kind='Platform' AND code ~ '^SYN-PLT-') OR (kind='DelayReason' AND code ~ '^SYN-DLR-'))
);
CREATE TABLE ppo.supply_customer_delivery_events (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, demand_id uuid NOT NULL,
 version integer NOT NULL CHECK(version>0), record_version integer NOT NULL CHECK(record_version>1),
 contact_id uuid, customer_eta date CHECK(isfinite(customer_eta)), delay_reason_code text,
 delay_reason_kind text NOT NULL DEFAULT 'DelayReason' CHECK(delay_reason_kind='DelayReason'),
 actor_id uuid NOT NULL, operation_id uuid NOT NULL, recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,demand_id,id), UNIQUE(workspace_id,demand_id,version), UNIQUE(workspace_id,actor_id,operation_id),
 FOREIGN KEY(workspace_id,company_id,demand_id) REFERENCES ppo.supply_records(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,contact_id) REFERENCES ppo.person_company_contexts(workspace_id,company_id,person_id),
 FOREIGN KEY(delay_reason_kind,delay_reason_code) REFERENCES ppo.supply_customer_notice_options(kind,code),
 FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.supply_dispatch_details (
 workspace_id uuid NOT NULL, company_id uuid NOT NULL, demand_id uuid NOT NULL, fact_id uuid NOT NULL,
 carrier_code text NOT NULL, platform_code text NOT NULL,
 carrier_kind text NOT NULL DEFAULT 'Carrier' CHECK(carrier_kind='Carrier'),
 platform_kind text NOT NULL DEFAULT 'Platform' CHECK(platform_kind='Platform'),
 tracking_number text NOT NULL CHECK(length(tracking_number) BETWEEN 1 AND 120 AND tracking_number ~ '^[A-Za-z0-9][A-Za-z0-9 ./_-]*$'),
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic), PRIMARY KEY(workspace_id,fact_id),
 FOREIGN KEY(workspace_id,company_id,demand_id) REFERENCES ppo.supply_records(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,demand_id,fact_id) REFERENCES ppo.supply_facts(workspace_id,record_id,id),
 FOREIGN KEY(carrier_kind,carrier_code) REFERENCES ppo.supply_customer_notice_options(kind,code),
 FOREIGN KEY(platform_kind,platform_code) REFERENCES ppo.supply_customer_notice_options(kind,code)
);
CREATE TABLE ppo.supply_customer_notice_sources (
 workspace_id uuid NOT NULL, company_id uuid NOT NULL, demand_id uuid NOT NULL, communication_id uuid NOT NULL,
 dispatch_fact_id uuid, delivery_event_id uuid, baseline_communication_id uuid, customer_eta date CHECK(isfinite(customer_eta)),
 source_snapshot text NOT NULL CHECK(jsonb_typeof(source_snapshot::jsonb)='object'),
 source_hash text NOT NULL CHECK(source_hash ~ '^[a-f0-9]{64}$' AND source_hash=encode(sha256(convert_to(source_snapshot,'UTF8')),'hex')),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 PRIMARY KEY(workspace_id,communication_id),
 CHECK(dispatch_fact_id IS NOT NULL OR (delivery_event_id IS NOT NULL AND baseline_communication_id IS NOT NULL AND customer_eta IS NOT NULL)),
 FOREIGN KEY(workspace_id,company_id,demand_id) REFERENCES ppo.supply_records(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,communication_id) REFERENCES ppo.customer_communications(workspace_id,id),
 FOREIGN KEY(workspace_id,demand_id,dispatch_fact_id) REFERENCES ppo.supply_facts(workspace_id,record_id,id),
 FOREIGN KEY(workspace_id,demand_id,delivery_event_id) REFERENCES ppo.supply_customer_delivery_events(workspace_id,demand_id,id),
 FOREIGN KEY(workspace_id,baseline_communication_id) REFERENCES ppo.customer_communications(workspace_id,id)
);
CREATE INDEX supply_customer_notice_demand ON ppo.supply_customer_notice_sources(workspace_id,demand_id,created_at,communication_id);

CREATE FUNCTION ppo.supply_customer_delivery_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE r ppo.supply_records; f ppo.supply_facts;
BEGIN
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 SELECT * INTO STRICT r FROM ppo.supply_records WHERE workspace_id=NEW.workspace_id AND id=NEW.demand_id;
 IF r.kind<>'Demand' OR r.company_id<>NEW.company_id THEN RAISE EXCEPTION 'Customer delivery evidence belongs to the same demand company' USING ERRCODE='23514'; END IF;
 IF TG_TABLE_NAME='supply_dispatch_details' THEN
  SELECT * INTO STRICT f FROM ppo.supply_facts WHERE workspace_id=NEW.workspace_id AND id=NEW.fact_id;
  IF f.kind<>'Dispatch' OR f.record_id<>r.id OR f.company_id<>r.company_id OR f.version<>r.version THEN
   RAISE EXCEPTION 'Carrier details accompany exact native Dispatch evidence' USING ERRCODE='23514'; END IF;
 ELSE
  IF r.data->>'customer_id' IS NULL OR r.version<>NEW.record_version OR NEW.version<>coalesce((SELECT max(version) FROM ppo.supply_customer_delivery_events WHERE workspace_id=NEW.workspace_id AND demand_id=r.id),0)+1 THEN
   RAISE EXCEPTION 'Contiguous current customer delivery evidence required' USING ERRCODE='23514'; END IF;
  IF NEW.contact_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM ppo.people p JOIN ppo.relationships rel ON (rel.workspace_id,rel.person_id)=(p.workspace_id,p.id)
    WHERE p.workspace_id=NEW.workspace_id AND p.id=NEW.contact_id AND p.active AND rel.company_id=r.company_id
      AND rel.organisation_id::text=r.data->>'customer_id' AND rel.valid_from<=current_date AND (rel.valid_to IS NULL OR rel.valid_to>current_date)) THEN
   RAISE EXCEPTION 'Name a current contact of this customer and company' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER supply_customer_delivery_guard BEFORE INSERT ON ppo.supply_customer_delivery_events FOR EACH ROW EXECUTE FUNCTION ppo.supply_customer_delivery_guard();
CREATE TRIGGER supply_dispatch_details_guard BEFORE INSERT ON ppo.supply_dispatch_details FOR EACH ROW EXECUTE FUNCTION ppo.supply_customer_delivery_guard();

CREATE FUNCTION ppo.supply_customer_notice_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE m ppo.customer_communications; r ppo.supply_records; d ppo.supply_customer_delivery_events;
 f ppo.supply_facts; details ppo.supply_dispatch_details; baseline ppo.supply_customer_notice_sources; prior ppo.customer_communications; facts jsonb; moved numeric; carrier text; platform text; delay_reason text; tracking_url text;
BEGIN
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 SELECT * INTO STRICT m FROM ppo.customer_communications WHERE workspace_id=NEW.workspace_id AND id=NEW.communication_id;
 SELECT * INTO STRICT r FROM ppo.supply_records WHERE workspace_id=NEW.workspace_id AND id=NEW.demand_id;
 SELECT * INTO d FROM ppo.supply_customer_delivery_events WHERE workspace_id=NEW.workspace_id AND demand_id=NEW.demand_id ORDER BY version DESC LIMIT 1;
 facts:=NEW.source_snapshot::jsonb->'facts';
 IF (m.source_type,m.source_id,m.company_id,m.source_fact_version,m.recipient_role) IS DISTINCT FROM ('SupplyDemand'::text,r.id,NEW.company_id,r.version,'Order delivery contact'::text)
  OR d.id IS DISTINCT FROM NEW.delivery_event_id OR d.contact_id IS DISTINCT FROM m.recipient_contact_id OR d.customer_eta IS DISTINCT FROM NEW.customer_eta
  OR facts IS NULL OR NOT (m.facts @> facts) OR (NEW.source_snapshot::jsonb->>'delivery_event_id')::uuid IS DISTINCT FROM d.id THEN
  RAISE EXCEPTION 'Bind the exact current native customer delivery source and recipient' USING ERRCODE='23514'; END IF;
 IF NEW.dispatch_fact_id IS NOT NULL THEN
  SELECT * INTO STRICT f FROM ppo.supply_current_facts WHERE workspace_id=NEW.workspace_id AND id=NEW.dispatch_fact_id;
  SELECT * INTO details FROM ppo.supply_dispatch_details WHERE workspace_id=NEW.workspace_id AND fact_id=NEW.dispatch_fact_id;
  SELECT label INTO carrier FROM ppo.supply_customer_notice_options WHERE kind='Carrier' AND code=details.carrier_code;
  SELECT label INTO platform FROM ppo.supply_customer_notice_options WHERE kind='Platform' AND code=details.platform_code;
  tracking_url:='https://tracking.example/'||details.carrier_code||'/'||replace(replace(details.tracking_number,' ','%20'),'/','%2F');
  IF facts->>'dispatch.carrier' IS DISTINCT FROM carrier OR facts->>'dispatch.platform' IS DISTINCT FROM platform
   OR facts->>'dispatch.tracking_number' IS DISTINCT FROM details.tracking_number OR facts->>'dispatch.tracking_url' IS DISTINCT FROM tracking_url
   OR facts->>'dispatch.item' IS DISTINCT FROM r.item OR facts->>'dispatch.unit' IS DISTINCT FROM r.unit THEN
   RAISE EXCEPTION 'Dispatch wording must bind exact typed catalogue and movement facts' USING ERRCODE='23514'; END IF;
  IF ppo.customer_communication_latest(m.workspace_id,m.id)='Prepared' AND (details.fact_id IS NULL OR f.completeness<>'Complete') THEN
   RAISE EXCEPTION 'Incomplete native dispatch facts must be held' USING ERRCODE='23514'; END IF;
  SELECT coalesce(sum((data->>'quantity')::numeric),0) INTO moved FROM ppo.supply_current_facts WHERE workspace_id=NEW.workspace_id AND record_id=r.id AND kind='Dispatch' AND data->>'state'='Moved';
  IF m.message_class<>'DispatchNotice' OR NEW.baseline_communication_id IS NOT NULL OR f.kind<>'Dispatch' OR f.record_id<>r.id OR f.data->>'state'<>'Moved' OR (f.data->>'quantity')::numeric<=0
   OR (facts->>'dispatch.quantity')::numeric IS DISTINCT FROM (f.data->>'quantity')::numeric OR facts->>'dispatch.movement_at' IS DISTINCT FROM f.data->>'movement_at'
   OR (facts->>'dispatch.dispatched_quantity')::numeric IS DISTINCT FROM moved OR (facts->>'dispatch.outstanding_quantity')::numeric IS DISTINCT FROM r.quantity-moved THEN
   RAISE EXCEPTION 'Dispatch notice must conserve the exact native movement and outstanding quantity' USING ERRCODE='23514'; END IF;
 ELSE
  SELECT label INTO delay_reason FROM ppo.supply_customer_notice_options WHERE kind='DelayReason' AND code=d.delay_reason_code;
  IF facts->>'delay.reason' IS DISTINCT FROM delay_reason OR (ppo.customer_communication_latest(m.workspace_id,m.id)='Prepared' AND delay_reason IS NULL) THEN
   RAISE EXCEPTION 'Delay wording must bind the exact customer-safe catalogue reason' USING ERRCODE='23514'; END IF;
  SELECT * INTO STRICT baseline FROM ppo.supply_customer_notice_sources WHERE workspace_id=NEW.workspace_id AND communication_id=NEW.baseline_communication_id;
  SELECT * INTO STRICT prior FROM ppo.customer_communications WHERE workspace_id=NEW.workspace_id AND id=NEW.baseline_communication_id;
  IF m.message_class<>'DelayNotice' OR baseline.demand_id<>r.id OR prior.recipient_contact_id IS DISTINCT FROM m.recipient_contact_id
   OR prior.organisation_id<>m.organisation_id OR baseline.customer_eta IS NULL OR NOT (NEW.customer_eta>baseline.customer_eta)
   OR facts->>'delay.previous_eta' IS DISTINCT FROM baseline.customer_eta::text
   OR NOT EXISTS(SELECT 1 FROM ppo.customer_communication_events WHERE workspace_id=NEW.workspace_id AND communication_id=prior.id AND state='Sent')
   OR NOT EXISTS(SELECT 1 FROM ppo.customer_email_templates WHERE workspace_id=NEW.workspace_id AND id=prior.template_id AND position('{{delivery.customer_eta}}' IN definition)>0) THEN
   RAISE EXCEPTION 'Delay requires a later explicit customer ETA than one actually sent to the same contact' USING ERRCODE='23514'; END IF;
 END IF;
 IF facts->>'delivery.customer_eta' IS DISTINCT FROM NEW.customer_eta::text THEN
  RAISE EXCEPTION 'Customer ETA must be explicit delivery evidence' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER supply_customer_notice_guard BEFORE INSERT ON ppo.supply_customer_notice_sources FOR EACH ROW EXECUTE FUNCTION ppo.supply_customer_notice_guard();

-- Each new evidence row retains its actual original operation; the envelope is written last.
CREATE FUNCTION ppo.supply_customer_delivery_receipt() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE actor uuid; op uuid; record uuid;
BEGIN
 IF TG_TABLE_NAME='supply_customer_delivery_events' THEN
  actor:=NEW.actor_id; op:=NEW.operation_id; record:=NEW.demand_id;
  IF NOT EXISTS(SELECT 1 FROM ppo.audit_events a WHERE a.workspace_id=NEW.workspace_id AND a.actor_id=actor AND a.operation_id=op
    AND a.object_id=record AND a.details->>'command'='Supply:CustomerDelivery' AND a.details->>'delivery_event_id'=NEW.id::text) THEN
   RAISE EXCEPTION 'Customer delivery evidence requires its original accepted operation' USING ERRCODE='23514'; END IF;
 ELSE
  SELECT prepared_by,operation_id,id INTO actor,op,record FROM ppo.customer_communications WHERE workspace_id=NEW.workspace_id AND id=NEW.communication_id;
 END IF;
 IF NOT EXISTS(SELECT 1 FROM ppo.operation_receipts WHERE workspace_id=NEW.workspace_id AND actor_id=actor AND operation_id=op AND record_id=record) THEN
  RAISE EXCEPTION 'Original operation receipt required' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER supply_customer_delivery_receipt AFTER INSERT ON ppo.supply_customer_delivery_events DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.supply_customer_delivery_receipt();
CREATE CONSTRAINT TRIGGER supply_customer_notice_receipt AFTER INSERT ON ppo.supply_customer_notice_sources DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.supply_customer_delivery_receipt();

DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['supply_customer_notice_options','supply_customer_delivery_events','supply_dispatch_details','supply_customer_notice_sources'] LOOP
  EXECUTE format('CREATE TRIGGER retained_customer_delivery BEFORE UPDATE OR DELETE ON ppo.%I FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence()',t);
 END LOOP;
END $$;
ALTER TABLE ppo.customer_communication_events DROP CONSTRAINT customer_communication_events_hold_reason_check;
ALTER TABLE ppo.customer_communication_events ADD CONSTRAINT customer_communication_events_hold_reason_check
 CHECK(hold_reason IN ('ClassSwitchedOff','DoNotNotify','NoRecipient','MissingAddress','RecipientNotCurrent','RecipientChanged','MissingData','TemplateUnavailable','SourceChanged','SenderUnauthorised','PriorOutcomeUnknown'));
INSERT INTO ppo.customer_email_bindings(message_class,binding)
 SELECT 'DispatchNotice',binding FROM unnest(ARRAY['dispatch.carrier','dispatch.platform','dispatch.tracking_number','dispatch.tracking_url','dispatch.movement_at','dispatch.quantity','dispatch.dispatched_quantity','dispatch.outstanding_quantity','dispatch.item','dispatch.unit','delivery.customer_eta']) AS binding;
INSERT INTO ppo.customer_email_bindings(message_class,binding)
 SELECT 'DelayNotice',binding FROM unnest(ARRAY['delivery.customer_eta','delay.previous_eta','delay.reason']) AS binding;
