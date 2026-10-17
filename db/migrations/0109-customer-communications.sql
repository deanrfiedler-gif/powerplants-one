-- D-025 stage S2: the customer communication core on a synthetic channel only (C1, C2 as changed on
-- 16 October, C4-C8; rules R1-R9; ADR-0058). One record and an append-only state ledger per message,
-- prepare -> named sender confirms -> queued, a synthetic Sent Items record for reconciliation, owned
-- follow-ups, per-contact notice preferences, per-class switches (Off unless recorded) and the
-- CUS-EMAIL customer template family under DK-06's publication rules. No seed, grant, user or
-- Activity kind is added and no existing row changes. Nothing here reaches a provider or a customer.
SET CONSTRAINTS ppo.identity_target IMMEDIATE;
DO $$ DECLARE spec record; definition text; BEGIN
 FOR spec IN SELECT * FROM (VALUES
  ('business_identities','ck_identities_type','object_type','CustomerCommunication,CustomerEmailTemplateProposal,CustomerEmailTemplate,CustomerMessageSwitch'),
  ('audit_events','ck_audit_object_type','object_type','CustomerCommunication,CustomerEmailTemplateProposal,CustomerEmailTemplate,CustomerMessageSwitch'),
  ('permission_grants','ck_grants_capability','capability','customer_message.send,customer_message.switch'),
  ('outbox_jobs','ck_outbox_kind','kind','CustomerMessagePrepared,CustomerMessageConfirmed,CustomerMessageWithdrawn,CustomerMessageReconciled,CustomerNoticePreferenceRecorded,CustomerMessageSwitchChanged,CustomerEmailTemplateProposed,CustomerEmailTemplatePublished')
 ) v(tab,con,col,added) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid=('ppo.'||spec.tab)::regclass AND conname=spec.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',spec.tab,spec.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR %I = ANY(%L::text[]))',spec.tab,spec.con,substring(definition from 8 for length(definition)-8),spec.col,string_to_array(spec.added,','));
 END LOOP;
 SELECT pg_get_functiondef('ppo.identity_has_typed_record()'::regprocedure) INTO definition;
 IF position('CASE NEW.object_type' in definition)=0 THEN RAISE EXCEPTION 'Inspect changed identity dispatch'; END IF;
 EXECUTE replace(definition,'CASE NEW.object_type','CASE NEW.object_type WHEN ''CustomerCommunication'' THEN ''customer_communications'' WHEN ''CustomerEmailTemplateProposal'' THEN ''customer_email_template_proposals'' WHEN ''CustomerEmailTemplate'' THEN ''customer_email_templates'' WHEN ''CustomerMessageSwitch'' THEN ''customer_message_switch_events''');
END $$;
SET CONSTRAINTS ppo.identity_target DEFERRED;

-- R6 allowlist: the only typed customer-safe fields a template may bind, per message class.
-- Later stages add their own facts (S3: dispatch carrier and tracking) as further rows.
CREATE TABLE ppo.customer_email_bindings (
 message_class text NOT NULL CHECK(message_class IN ('DispatchNotice','DelayNotice','VisitConfirmation','ProjectUpdate')),
 binding text NOT NULL CHECK(binding ~ '^[a-z][a-z_]*[.][a-z][a-z_]*$'),
 PRIMARY KEY(message_class,binding)
);
INSERT INTO ppo.customer_email_bindings(message_class,binding)
 SELECT c,b FROM unnest(ARRAY['DispatchNotice','DelayNotice','VisitConfirmation','ProjectUpdate']) c
 CROSS JOIN unnest(ARRAY['customer.name','recipient.name','site.name','source.reference']) b;
CREATE TRIGGER customer_email_bindings_retained BEFORE UPDATE OR DELETE ON ppo.customer_email_bindings FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

-- A definition is canonical JSON: schema 1, family CUS-EMAIL, Customer audience, a subject that starts
-- with the bracketed confirmed reference (R7) and plain-text paragraphs. Every {{binding}} must be
-- allowlisted for the class; any other brace pair is refused.
CREATE FUNCTION ppo.customer_email_definition_valid(definition text, cls text) RETURNS boolean LANGUAGE plpgsql STABLE AS $$
DECLARE d jsonb; t text; part text; b text;
BEGIN
 BEGIN d:=definition::jsonb; EXCEPTION WHEN others THEN RETURN false; END;
 IF NOT coalesce(jsonb_typeof(d)='object' AND d ?& ARRAY['schema_version','family','message_class','audience','subject','body']
  AND d-'schema_version'-'family'-'message_class'-'audience'-'subject'-'body'='{}'::jsonb
  AND d->'schema_version'='1'::jsonb AND d->>'family'='CUS-EMAIL' AND d->>'message_class'=cls AND d->>'audience'='Customer'
  AND jsonb_typeof(d->'subject')='string' AND length(d->>'subject') BETWEEN 1 AND 300 AND left(d->>'subject',23)='[{{source.reference}}] '
  AND jsonb_typeof(d->'body')='array' AND jsonb_array_length(d->'body') BETWEEN 1 AND 40,false) THEN RETURN false; END IF;
 FOR part IN SELECT d->>'subject' UNION ALL SELECT value FROM jsonb_array_elements_text(d->'body') LOOP
  IF part IS NULL OR length(part) NOT BETWEEN 1 AND 2000 THEN RETURN false; END IF;
  FOR b IN SELECT m[1] FROM regexp_matches(part,'[{][{]([^{}]*)[}][}]','g') m LOOP
   IF NOT EXISTS(SELECT 1 FROM ppo.customer_email_bindings WHERE message_class=cls AND binding=b) THEN RETURN false; END IF;
  END LOOP;
  t:=regexp_replace(part,'[{][{][^{}]*[}][}]','','g');
  IF position('{' in t)>0 OR position('}' in t)>0 THEN RETURN false; END IF;
 END LOOP;
 FOR part IN SELECT jsonb_typeof(value) FROM jsonb_array_elements(d->'body') LOOP
  IF part<>'string' THEN RETURN false; END IF;
 END LOOP;
 RETURN true;
END $$;

CREATE TABLE ppo.customer_email_template_proposals (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL,
 message_class text NOT NULL CHECK(message_class IN ('DispatchNotice','DelayNotice','VisitConfirmation','ProjectUpdate')),
 definition text NOT NULL, definition_hash text NOT NULL CHECK(definition_hash=encode(sha256(convert_to(definition,'UTF8')),'hex')),
 author_id uuid NOT NULL, operation_id uuid NOT NULL, reason text NOT NULL CHECK(length(reason) BETWEEN 1 AND 1000),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,author_id,operation_id),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id),
 FOREIGN KEY(workspace_id,author_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.customer_email_templates (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL,
 message_class text NOT NULL CHECK(message_class IN ('DispatchNotice','DelayNotice','VisitConfirmation','ProjectUpdate')),
 version integer NOT NULL CHECK(version>0), proposal_id uuid NOT NULL,
 definition text NOT NULL, definition_hash text NOT NULL CHECK(definition_hash=encode(sha256(convert_to(definition,'UTF8')),'hex')),
 publisher_id uuid NOT NULL, approval_note text NOT NULL CHECK(length(btrim(approval_note)) BETWEEN 1 AND 2000),
 operation_id uuid NOT NULL, reason text NOT NULL CHECK(length(reason) BETWEEN 1 AND 1000),
 published_at timestamptz NOT NULL DEFAULT clock_timestamp(), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,message_class,version), UNIQUE(workspace_id,proposal_id), UNIQUE(workspace_id,publisher_id,operation_id),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id),
 FOREIGN KEY(workspace_id,proposal_id) REFERENCES ppo.customer_email_template_proposals(workspace_id,id),
 FOREIGN KEY(workspace_id,publisher_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE FUNCTION ppo.customer_email_template_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE pr ppo.customer_email_template_proposals;
BEGIN
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 IF NOT ppo.customer_email_definition_valid(NEW.definition,NEW.message_class) THEN
  RAISE EXCEPTION 'Customer email template binds a field outside the allowlist or has an unsupported shape' USING ERRCODE='23514';
 END IF;
 IF TG_TABLE_NAME='customer_email_templates' THEN
  SELECT * INTO pr FROM ppo.customer_email_template_proposals WHERE workspace_id=NEW.workspace_id AND id=NEW.proposal_id;
  IF pr.id IS NULL OR (pr.company_id,pr.message_class,pr.definition,pr.definition_hash) IS DISTINCT FROM (NEW.company_id,NEW.message_class,NEW.definition,NEW.definition_hash)
   OR pr.author_id=NEW.publisher_id
   OR NEW.version<>coalesce((SELECT max(version) FROM ppo.customer_email_templates WHERE workspace_id=NEW.workspace_id AND company_id=NEW.company_id AND message_class=NEW.message_class),0)+1 THEN
   RAISE EXCEPTION 'Independent exact publication of the next version required' USING ERRCODE='23514';
  END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER customer_email_template_proposal_identity BEFORE INSERT ON ppo.customer_email_template_proposals FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('CustomerEmailTemplateProposal','');
CREATE TRIGGER customer_email_template_proposal_guard BEFORE INSERT ON ppo.customer_email_template_proposals FOR EACH ROW EXECUTE FUNCTION ppo.customer_email_template_guard();
CREATE TRIGGER customer_email_template_identity BEFORE INSERT ON ppo.customer_email_templates FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('CustomerEmailTemplate','');
CREATE TRIGGER customer_email_template_guard BEFORE INSERT ON ppo.customer_email_templates FOR EACH ROW EXECUTE FUNCTION ppo.customer_email_template_guard();

-- R9: one switch per company and class, Off unless a later event says otherwise. S2 allows only the
-- synthetic channel; S4 widens the mode for internal test addresses and then customers.
CREATE TABLE ppo.customer_message_switch_events (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL,
 message_class text NOT NULL CHECK(message_class IN ('DispatchNotice','DelayNotice','VisitConfirmation','ProjectUpdate')),
 version integer NOT NULL CHECK(version>0), mode text NOT NULL CHECK(mode IN ('Off','Synthetic')),
 actor_id uuid NOT NULL, operation_id uuid NOT NULL, reason text NOT NULL CHECK(length(reason) BETWEEN 1 AND 1000),
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,message_class,version), UNIQUE(workspace_id,actor_id,operation_id),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id),
 FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id)
);
-- R2: a structured notice preference per contact, class and company, with who, when and why.
CREATE TABLE ppo.contact_notice_preferences (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, person_id uuid NOT NULL,
 message_class text NOT NULL CHECK(message_class IN ('DispatchNotice','DelayNotice','VisitConfirmation','ProjectUpdate')),
 version integer NOT NULL CHECK(version>0), preference text NOT NULL CHECK(preference IN ('Allowed','DoNotNotify')),
 actor_id uuid NOT NULL, operation_id uuid NOT NULL, reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,person_id,message_class,version), UNIQUE(workspace_id,actor_id,operation_id),
 FOREIGN KEY(workspace_id,company_id,person_id) REFERENCES ppo.person_company_contexts(workspace_id,company_id,person_id),
 FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE FUNCTION ppo.customer_message_ledger_version() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE previous integer;
BEGIN
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 IF TG_TABLE_NAME='customer_message_switch_events' THEN
  SELECT max(version) INTO previous FROM ppo.customer_message_switch_events WHERE workspace_id=NEW.workspace_id AND company_id=NEW.company_id AND message_class=NEW.message_class;
 ELSE
  SELECT max(version) INTO previous FROM ppo.contact_notice_preferences WHERE workspace_id=NEW.workspace_id AND company_id=NEW.company_id AND person_id=NEW.person_id AND message_class=NEW.message_class;
 END IF;
 IF NEW.version<>coalesce(previous,0)+1 THEN RAISE EXCEPTION 'Contiguous ledger version required' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER customer_message_switch_identity BEFORE INSERT ON ppo.customer_message_switch_events FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('CustomerMessageSwitch','');
CREATE TRIGGER customer_message_switch_version BEFORE INSERT ON ppo.customer_message_switch_events FOR EACH ROW EXECUTE FUNCTION ppo.customer_message_ledger_version();
CREATE TRIGGER contact_notice_preference_version BEFORE INSERT ON ppo.contact_notice_preferences FOR EACH ROW EXECUTE FUNCTION ppo.customer_message_ledger_version();

-- R3: one record per message. Content, recipient address and template are fixed at preparation; a
-- message held at preparation may lack them and can then only be withdrawn. channel='Synthetic' is
-- the only channel this migration admits, so no row can claim a real send.
CREATE TABLE ppo.customer_communications (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, site_id uuid, organisation_id uuid NOT NULL,
 message_class text NOT NULL CHECK(message_class IN ('DispatchNotice','DelayNotice','VisitConfirmation','ProjectUpdate')),
 review_class text NOT NULL CHECK(review_class IN ('Factual','Reviewed')),
 source_type text NOT NULL CHECK(source_type IN ('SupplyDemand','Project')), source_id uuid NOT NULL,
 source_reference text NOT NULL CHECK(length(btrim(source_reference)) BETWEEN 1 AND 200),
 source_fact_version integer NOT NULL CHECK(source_fact_version>0),
 recipient_role text NOT NULL CHECK(length(btrim(recipient_role)) BETWEEN 1 AND 120),
 recipient_contact_id uuid, recipient_name text CHECK(length(btrim(recipient_name)) BETWEEN 1 AND 200),
 recipient_address text CHECK(recipient_address ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
 template_id uuid, template_version integer CHECK(template_version>0), template_hash text CHECK(template_hash ~ '^[a-f0-9]{64}$'),
 facts jsonb NOT NULL CHECK(jsonb_typeof(facts)='object'),
 subject text CHECK(length(subject) BETWEEN 1 AND 400), body text CHECK(length(body) BETWEEN 1 AND 100000),
 content_hash text CHECK(content_hash ~ '^[a-f0-9]{64}$'),
 correction boolean NOT NULL DEFAULT false, supersedes_id uuid,
 channel text NOT NULL DEFAULT 'Synthetic' CHECK(channel='Synthetic'),
 owner_id uuid NOT NULL, prepared_by uuid NOT NULL, operation_id uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,prepared_by,operation_id),
 CHECK((message_class IN ('DispatchNotice','DelayNotice') AND source_type='SupplyDemand' AND review_class='Factual')
  OR (message_class='ProjectUpdate' AND source_type='Project' AND review_class='Reviewed')),
 CHECK(recipient_contact_id IS NOT NULL OR (recipient_name IS NULL AND recipient_address IS NULL)),
 CHECK(recipient_contact_id IS NULL OR recipient_name IS NOT NULL),
 CHECK((subject IS NULL)=(body IS NULL) AND (body IS NULL)=(content_hash IS NULL)),
 CHECK((template_id IS NULL)=(template_version IS NULL) AND (template_id IS NULL)=(template_hash IS NULL)),
 CHECK(body IS NULL OR template_id IS NOT NULL),
 CHECK(correction=(supersedes_id IS NOT NULL)),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,organisation_id) REFERENCES ppo.organisations(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id) REFERENCES ppo.sites(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,recipient_contact_id) REFERENCES ppo.people(workspace_id,id),
 FOREIGN KEY(workspace_id,template_id) REFERENCES ppo.customer_email_templates(workspace_id,id),
 FOREIGN KEY(workspace_id,supersedes_id) REFERENCES ppo.customer_communications(workspace_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,prepared_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE INDEX customer_communication_organisation ON ppo.customer_communications(workspace_id,organisation_id,created_at,id);
CREATE INDEX customer_communication_source ON ppo.customer_communications(workspace_id,source_type,source_id,created_at,id);
CREATE INDEX customer_communication_owner ON ppo.customer_communications(workspace_id,owner_id,created_at,id);

-- R4 with Queued added for the named sender's confirmation (C2 as changed on 16 October).
CREATE TABLE ppo.customer_communication_events (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, communication_id uuid NOT NULL,
 version integer NOT NULL CHECK(version>0),
 state text NOT NULL CHECK(state IN ('Prepared','Held','Queued','Submitted','Sent','Delivered','Failed','OutcomeUnknown','Withdrawn')),
 action text NOT NULL CHECK(action IN ('Prepare','Confirm','Hold','Withdraw','Record','Reconcile')),
 hold_reason text CHECK(hold_reason IN ('ClassSwitchedOff','DoNotNotify','NoRecipient','MissingAddress','RecipientNotCurrent','RecipientChanged','MissingData','TemplateUnavailable')),
 provider_message_id text CHECK(length(provider_message_id) BETWEEN 1 AND 200),
 actor_id uuid NOT NULL, operation_id uuid NOT NULL,
 reason text NOT NULL CHECK(length(reason) BETWEEN 1 AND 2000),
 evidence text NOT NULL CHECK(length(evidence) BETWEEN 1 AND 2000),
 occurred_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,communication_id,version), UNIQUE(workspace_id,actor_id,operation_id),
 CHECK((state='Held')=(hold_reason IS NOT NULL)),
 CHECK(state NOT IN ('Submitted','Sent','Delivered') OR provider_message_id IS NOT NULL),
 FOREIGN KEY(workspace_id,communication_id) REFERENCES ppo.customer_communications(workspace_id,id),
 FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE FUNCTION ppo.customer_communication_latest(w uuid, c uuid) RETURNS text LANGUAGE sql STABLE AS $$
 SELECT state FROM ppo.customer_communication_events WHERE workspace_id=w AND communication_id=c ORDER BY version DESC LIMIT 1
$$;
CREATE FUNCTION ppo.guard_customer_communication() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE prior ppo.customer_communications; t ppo.customer_email_templates; s ppo.supply_records; pj ppo.projects;
BEGIN
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 IF NEW.source_type='SupplyDemand' THEN
  SELECT * INTO s FROM ppo.supply_records WHERE workspace_id=NEW.workspace_id AND id=NEW.source_id;
  IF s.id IS NULL OR s.kind<>'Demand' OR s.company_id<>NEW.company_id OR s.site_id IS DISTINCT FROM NEW.site_id
   OR s.reference<>NEW.source_reference OR s.data->>'customer_id' IS DISTINCT FROM NEW.organisation_id::text THEN
   RAISE EXCEPTION 'The message must match its customer demand' USING ERRCODE='23514';
  END IF;
 ELSE
  SELECT * INTO pj FROM ppo.projects WHERE workspace_id=NEW.workspace_id AND id=NEW.source_id;
  IF pj.id IS NULL OR pj.company_id<>NEW.company_id OR pj.site_id IS DISTINCT FROM NEW.site_id
   OR pj.organisation_id<>NEW.organisation_id OR pj.display_number<>NEW.source_reference THEN
   RAISE EXCEPTION 'The message must match its project' USING ERRCODE='23514';
  END IF;
 END IF;
 IF NEW.template_id IS NOT NULL THEN
  SELECT * INTO t FROM ppo.customer_email_templates WHERE workspace_id=NEW.workspace_id AND id=NEW.template_id;
  IF (t.company_id,t.message_class,t.version,t.definition_hash) IS DISTINCT FROM (NEW.company_id,NEW.message_class,NEW.template_version,NEW.template_hash) THEN
   RAISE EXCEPTION 'The exact published template for this company and class is required' USING ERRCODE='23514';
  END IF;
 END IF;
 -- R8: one message per class, source, fact version and recipient, unless the earlier one was withdrawn.
 IF EXISTS(SELECT 1 FROM ppo.customer_communications o WHERE o.workspace_id=NEW.workspace_id AND o.message_class=NEW.message_class
   AND o.source_type=NEW.source_type AND o.source_id=NEW.source_id AND o.source_fact_version=NEW.source_fact_version
   AND o.recipient_contact_id IS NOT DISTINCT FROM NEW.recipient_contact_id
   AND ppo.customer_communication_latest(o.workspace_id,o.id)<>'Withdrawn') THEN
  RAISE EXCEPTION 'This message already exists for the same fact and recipient' USING ERRCODE='23505';
 END IF;
 IF NEW.supersedes_id IS NOT NULL THEN
  SELECT * INTO prior FROM ppo.customer_communications WHERE workspace_id=NEW.workspace_id AND id=NEW.supersedes_id;
  IF (prior.message_class,prior.source_type,prior.source_id) IS DISTINCT FROM (NEW.message_class,NEW.source_type,NEW.source_id)
   OR prior.recipient_contact_id IS DISTINCT FROM NEW.recipient_contact_id OR prior.source_fact_version>=NEW.source_fact_version
   OR ppo.customer_communication_latest(prior.workspace_id,prior.id) NOT IN ('Submitted','Sent','Delivered') THEN
   RAISE EXCEPTION 'A correction succeeds a sent message about an earlier fact' USING ERRCODE='23514';
  END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE FUNCTION ppo.guard_customer_communication_event() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE previous ppo.customer_communication_events; c ppo.customer_communications; ok boolean;
BEGIN
 SELECT * INTO STRICT c FROM ppo.customer_communications WHERE workspace_id=NEW.workspace_id AND id=NEW.communication_id FOR UPDATE;
 SELECT * INTO previous FROM ppo.customer_communication_events WHERE workspace_id=NEW.workspace_id AND communication_id=NEW.communication_id ORDER BY version DESC LIMIT 1;
 IF NEW.version<>coalesce(previous.version,0)+1 THEN RAISE EXCEPTION 'Invalid communication transition' USING ERRCODE='23514'; END IF;
 IF previous.id IS NULL THEN
  ok:=NEW.action='Prepare' AND NEW.actor_id=c.prepared_by AND NEW.operation_id=c.operation_id
   AND (NEW.state='Held' OR (NEW.state='Prepared' AND c.body IS NOT NULL AND c.recipient_address IS NOT NULL));
 ELSE
  ok:=CASE previous.state
   WHEN 'Prepared' THEN (NEW.action='Confirm' AND NEW.state='Queued' AND (c.review_class='Factual' OR NEW.actor_id<>c.prepared_by))
    OR (NEW.action='Hold' AND NEW.state='Held') OR (NEW.action='Withdraw' AND NEW.state='Withdrawn')
   WHEN 'Held' THEN NEW.action='Withdraw' AND NEW.state='Withdrawn'
   WHEN 'Queued' THEN (NEW.action='Record' AND NEW.state IN ('Submitted','Failed','OutcomeUnknown')) OR (NEW.action='Hold' AND NEW.state='Held')
   WHEN 'Submitted' THEN NEW.action='Record' AND NEW.state IN ('Sent','Failed')
   WHEN 'Sent' THEN NEW.action='Record' AND NEW.state IN ('Delivered','Failed')
   WHEN 'OutcomeUnknown' THEN NEW.action='Reconcile' AND NEW.state IN ('Queued','Submitted','Sent','Failed')
   ELSE false END;
 END IF;
 IF NOT coalesce(ok,false) THEN RAISE EXCEPTION 'Invalid communication transition' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE FUNCTION ppo.customer_communication_initial_event() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM ppo.customer_communication_events WHERE workspace_id=NEW.workspace_id AND communication_id=NEW.id AND version=1) THEN
  RAISE EXCEPTION 'A communication requires its original preparation event' USING ERRCODE='23514';
 END IF;
 RETURN NULL;
END $$;
CREATE TRIGGER customer_communication_identity BEFORE INSERT ON ppo.customer_communications FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('CustomerCommunication','');
CREATE TRIGGER customer_communication_guard BEFORE INSERT ON ppo.customer_communications FOR EACH ROW EXECUTE FUNCTION ppo.guard_customer_communication();
CREATE CONSTRAINT TRIGGER customer_communication_initial AFTER INSERT ON ppo.customer_communications DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.customer_communication_initial_event();
CREATE TRIGGER customer_communication_event_guard BEFORE INSERT ON ppo.customer_communication_events FOR EACH ROW EXECUTE FUNCTION ppo.guard_customer_communication_event();

-- R5: Held, Failed and OutcomeUnknown keep one owned CustomerContact Activity open.
CREATE TABLE ppo.customer_communication_follow_ups (
 workspace_id uuid NOT NULL, communication_id uuid NOT NULL, activity_id uuid NOT NULL,
 event_version integer NOT NULL CHECK(event_version>0), created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(workspace_id,activity_id),
 FOREIGN KEY(workspace_id,communication_id,event_version) REFERENCES ppo.customer_communication_events(workspace_id,communication_id,version),
 FOREIGN KEY(workspace_id,activity_id) REFERENCES ppo.activities(workspace_id,id)
);
CREATE INDEX customer_communication_follow_up_source ON ppo.customer_communication_follow_ups(workspace_id,communication_id,activity_id);

-- The synthetic channel's simulated Sent Items: what a provider accepted, found by PPO's message
-- identifier before any retry (R8). Its outcome is fixed when the copy is accepted.
CREATE TABLE ppo.synthetic_mailbox_messages (
 workspace_id uuid NOT NULL, communication_id uuid NOT NULL, provider_message_id text NOT NULL CHECK(provider_message_id ~ '^synthetic-[a-f0-9-]{36}$'),
 recipient_address text NOT NULL, subject text NOT NULL, content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'),
 simulated_outcome text NOT NULL CHECK(simulated_outcome IN ('Sent','Bounced','Delivered')),
 accepted_at timestamptz NOT NULL DEFAULT clock_timestamp(), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 PRIMARY KEY(workspace_id,communication_id), UNIQUE(provider_message_id),
 FOREIGN KEY(workspace_id,communication_id) REFERENCES ppo.customer_communications(workspace_id,id)
);

DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['customer_email_template_proposals','customer_email_templates','customer_message_switch_events','contact_notice_preferences',
  'customer_communications','customer_communication_events','customer_communication_follow_ups','synthetic_mailbox_messages'] LOOP
  EXECUTE format('CREATE TRIGGER customer_message_evidence_retained BEFORE UPDATE OR DELETE ON ppo.%I FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence()',t);
 END LOOP;
END $$;
