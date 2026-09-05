-- P02: expand P01 without changing its checksum or accepted evidence.
CREATE TABLE ppo.erp_connections (
  id uuid PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES ppo.workspaces(id),
  provider text NOT NULL CHECK(provider='Synthetic'), external_connection_key text COLLATE "C" NOT NULL,
  synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
  UNIQUE(workspace_id,id), UNIQUE(workspace_id,provider,external_connection_key)
);
-- Retain the exact P01 key as provenance; the new connection identity is a UUID.
ALTER TABLE ppo.companies RENAME COLUMN erp_connection_id TO legacy_erp_connection_key;
ALTER TABLE ppo.companies ADD COLUMN erp_connection_id uuid;
INSERT INTO ppo.erp_connections(id,workspace_id,provider,external_connection_key)
SELECT gen_random_uuid(),workspace_id,provider,legacy_erp_connection_key FROM ppo.companies
GROUP BY workspace_id,provider,legacy_erp_connection_key;
UPDATE ppo.companies c SET erp_connection_id=e.id FROM ppo.erp_connections e
WHERE (e.workspace_id,e.provider,e.external_connection_key)=(c.workspace_id,c.provider,c.legacy_erp_connection_key);
ALTER TABLE ppo.companies ALTER COLUMN erp_connection_id SET NOT NULL;
ALTER TABLE ppo.companies ADD CONSTRAINT fk_companies_connection FOREIGN KEY(workspace_id,erp_connection_id) REFERENCES ppo.erp_connections(workspace_id,id);
ALTER TABLE ppo.companies ADD CONSTRAINT uq_companies_source UNIQUE(workspace_id,id,erp_connection_id,erp_company_id);

-- Identity registry contains identity only, never untyped business content.
CREATE TABLE ppo.business_identities (
  workspace_id uuid NOT NULL REFERENCES ppo.workspaces(id), id uuid NOT NULL,
  object_type text NOT NULL CHECK(object_type IN ('Ticket','Organisation','Person','Site','Facility','Asset','Relationship','SiteParty','ErpAccountMapping','AssetConfiguration','AssetLocationEvent','HistoryRecord')),
  display_number text COLLATE "C", synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
  PRIMARY KEY(workspace_id,id), UNIQUE(workspace_id,display_number), UNIQUE(workspace_id,id,object_type)
);
CREATE TABLE ppo.reference_counters (
  workspace_id uuid NOT NULL REFERENCES ppo.workspaces(id), record_type text NOT NULL CHECK(record_type IN ('ORG','SITE','AST','TKT')),
  namespace text NOT NULL CHECK(namespace='SYN-PPO'), last_value bigint NOT NULL CHECK(last_value>0),
  PRIMARY KEY(workspace_id,record_type,namespace)
);
INSERT INTO ppo.business_identities(workspace_id,id,object_type,display_number) SELECT workspace_id,id,'Ticket',display_number FROM ppo.tickets;
INSERT INTO ppo.reference_counters SELECT workspace_id,'TKT','SYN-PPO',max(substring(display_number from '[0-9]+$')::bigint) FROM ppo.tickets GROUP BY workspace_id;
CREATE TRIGGER identity_append_only BEFORE UPDATE OR DELETE ON ppo.business_identities FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.counter_never_rewinds() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Reference counters are permanent' USING ERRCODE='55000'; END IF;
 IF NEW.last_value<OLD.last_value OR (NEW.workspace_id,NEW.record_type,NEW.namespace) IS DISTINCT FROM (OLD.workspace_id,OLD.record_type,OLD.namespace) THEN
 RAISE EXCEPTION 'Reference counters cannot rewind' USING ERRCODE='55000'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER counter_permanent BEFORE UPDATE OR DELETE ON ppo.reference_counters FOR EACH ROW EXECUTE FUNCTION ppo.counter_never_rewinds();
CREATE FUNCTION ppo.register_identity() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE allocated bigint; ref text; prior ppo.business_identities; code text:=TG_ARGV[1];
BEGIN
 IF TG_OP='UPDATE' THEN
  IF (NEW.id,NEW.workspace_id,NEW.synthetic,NEW.created_at,NEW.created_by) IS DISTINCT FROM (OLD.id,OLD.workspace_id,OLD.synthetic,OLD.created_at,OLD.created_by)
   OR (code<>'' AND to_jsonb(NEW)->>'display_number' IS DISTINCT FROM to_jsonb(OLD)->>'display_number') THEN
   RAISE EXCEPTION 'Identity and creation provenance are permanent' USING ERRCODE='55000'; END IF;
  RETURN NEW;
 END IF;
 SELECT * INTO prior FROM ppo.business_identities WHERE workspace_id=NEW.workspace_id AND id=NEW.id;
 IF FOUND THEN
  IF prior.object_type<>TG_ARGV[0] THEN RAISE EXCEPTION 'Identity belongs to another type' USING ERRCODE='23505'; END IF;
  IF code<>'' THEN
   IF NEW.display_number IS NOT NULL AND NEW.display_number<>prior.display_number THEN RAISE EXCEPTION 'Reference is permanent' USING ERRCODE='23505'; END IF;
   NEW.display_number:=prior.display_number;
  END IF;
  RETURN NEW; -- Existing typed row uniqueness still rejects ordinary duplicate creation.
 END IF;
 IF code<>'' THEN
  ref:=NEW.display_number;
  IF ref IS NULL THEN
   INSERT INTO ppo.reference_counters VALUES(NEW.workspace_id,code,'SYN-PPO',1)
   ON CONFLICT(workspace_id,record_type,namespace) DO UPDATE SET last_value=ppo.reference_counters.last_value+1 RETURNING last_value INTO allocated;
   ref:='SYN-PPO-'||code||'-'||lpad(allocated::text,greatest(6,length(allocated::text)),'0');
  ELSE
   IF ref !~ ('^SYN-PPO-'||code||'-[0-9]{6,}$') OR substring(ref from '[0-9]+$')::bigint<1 THEN RAISE EXCEPTION 'Invalid synthetic reference' USING ERRCODE='23514'; END IF;
   INSERT INTO ppo.reference_counters VALUES(NEW.workspace_id,code,'SYN-PPO',substring(ref from '[0-9]+$')::bigint)
   ON CONFLICT(workspace_id,record_type,namespace) DO UPDATE SET last_value=greatest(ppo.reference_counters.last_value,excluded.last_value);
  END IF;
  NEW.display_number:=ref;
 END IF;
 INSERT INTO ppo.business_identities(workspace_id,id,object_type,display_number) VALUES(NEW.workspace_id,NEW.id,TG_ARGV[0],ref);
 RETURN NEW;
END $$;
CREATE TRIGGER ticket_identity BEFORE INSERT OR UPDATE ON ppo.tickets FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('Ticket','TKT');
CREATE TRIGGER ticket_no_delete BEFORE DELETE ON ppo.tickets FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
ALTER TABLE ppo.tickets ADD CONSTRAINT fk_tickets_identity FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id);
ALTER TABLE ppo.operation_receipts DROP CONSTRAINT operation_receipts_workspace_id_record_id_fkey;
ALTER TABLE ppo.operation_receipts ADD CONSTRAINT fk_receipts_identity FOREIGN KEY(workspace_id,record_id) REFERENCES ppo.business_identities(workspace_id,id);
ALTER TABLE ppo.audit_events DROP CONSTRAINT audit_events_object_type_check;
ALTER TABLE ppo.audit_events ADD CONSTRAINT ck_audit_object_type CHECK(object_type IN ('Ticket','Session','Organisation','Person','Site','Facility','Asset','Relationship','SiteParty','ErpAccountMapping','AssetConfiguration','AssetLocationEvent','HistoryRecord'));
ALTER TABLE ppo.outbox_jobs DROP CONSTRAINT outbox_jobs_kind_check;
ALTER TABLE ppo.outbox_jobs ADD CONSTRAINT ck_outbox_kind CHECK(kind IN ('TicketDraftSaved','SharedRecordCreated','SharedRecordUpdated','SharedHistoryRecorded'));

CREATE TABLE ppo.organisations (
  id uuid PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES ppo.workspaces(id),
  version integer NOT NULL DEFAULT 1 CHECK(version>0), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
  UNIQUE(workspace_id,id),
  FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
  FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id),
  FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
  company_id uuid NOT NULL, UNIQUE(workspace_id,company_id,id),
  FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id),
  display_number text NOT NULL, display_name text NOT NULL CHECK(length(btrim(display_name)) BETWEEN 1 AND 200),
  legal_name text, relationship_status text NOT NULL CHECK(relationship_status IN ('Prospect','Active','Inactive')),
  owner_id uuid NOT NULL, parent_organisation_id uuid, sector text, notes text, access_class text NOT NULL DEFAULT 'Internal' CHECK(access_class IN ('Internal','RestrictedService','RestrictedFinance','CustomerApproved')),
  FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),
  FOREIGN KEY(workspace_id,company_id,parent_organisation_id) REFERENCES ppo.organisations(workspace_id,company_id,id)
);

CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.organisations FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('Organisation','ORG');

CREATE TRIGGER protect_content BEFORE DELETE ON ppo.organisations FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

CREATE TABLE ppo.people (
  id uuid PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES ppo.workspaces(id),
  version integer NOT NULL DEFAULT 1 CHECK(version>0), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
  UNIQUE(workspace_id,id),
  FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
  FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id),
  FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
  display_name text NOT NULL CHECK(length(btrim(display_name)) BETWEEN 1 AND 200), email text, phone text,
  active boolean NOT NULL DEFAULT true, contact_preference text,
  CHECK(email IS NULL OR email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$')
);

CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.people FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('Person','');

CREATE TRIGGER protect_content BEFORE DELETE ON ppo.people FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

CREATE TABLE ppo.person_company_contexts (
 workspace_id uuid NOT NULL, company_id uuid NOT NULL, person_id uuid NOT NULL,
 PRIMARY KEY(workspace_id,company_id,person_id),
 FOREIGN KEY(workspace_id,person_id) REFERENCES ppo.people(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id)
);

CREATE TABLE ppo.relationships (
  id uuid PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES ppo.workspaces(id),
  version integer NOT NULL DEFAULT 1 CHECK(version>0), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
  UNIQUE(workspace_id,id),
  FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
  FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id),
  FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
  company_id uuid NOT NULL, UNIQUE(workspace_id,company_id,id),
  FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id),
  organisation_id uuid NOT NULL, person_id uuid NOT NULL, role_label text NOT NULL CHECK(length(btrim(role_label)) BETWEEN 1 AND 200),
  valid_from date NOT NULL, valid_to date,
  CHECK(isfinite(valid_from) AND (valid_to IS NULL OR (isfinite(valid_to) AND valid_to>valid_from))),
  FOREIGN KEY(workspace_id,company_id,organisation_id) REFERENCES ppo.organisations(workspace_id,company_id,id),
  FOREIGN KEY(workspace_id,company_id,person_id) REFERENCES ppo.person_company_contexts(workspace_id,company_id,person_id),
  EXCLUDE USING gist(workspace_id WITH =,organisation_id WITH =,person_id WITH =,role_label WITH =,daterange(valid_from,valid_to,'[)') WITH &&)
);

CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.relationships FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('Relationship','');

CREATE TRIGGER protect_content BEFORE DELETE ON ppo.relationships FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

CREATE TABLE ppo.sites (
  id uuid PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES ppo.workspaces(id),
  version integer NOT NULL DEFAULT 1 CHECK(version>0), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
  UNIQUE(workspace_id,id),
  FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
  FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id),
  FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
  company_id uuid NOT NULL, UNIQUE(workspace_id,company_id,id),
  FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id),
  display_number text NOT NULL, display_name text NOT NULL CHECK(length(btrim(display_name)) BETWEEN 1 AND 200),
  location_description text NOT NULL CHECK(length(btrim(location_description)) BETWEEN 1 AND 10000), timezone text NOT NULL,
  owner_id uuid NOT NULL, address jsonb, latitude numeric(9,6), longitude numeric(10,6),
  access_instructions text, primary_contact_id uuid, biosecurity_notes text, controls_reviewed_at timestamptz,
  FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),
  FOREIGN KEY(workspace_id,company_id,primary_contact_id) REFERENCES ppo.person_company_contexts(workspace_id,company_id,person_id),
  CHECK((latitude IS NULL AND longitude IS NULL) OR (latitude IS NOT NULL AND longitude IS NOT NULL AND latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)),
  CHECK(address IS NULL OR (jsonb_typeof(address)='object' AND address ?& ARRAY['country','state','suburb','postcode','street']))
);

CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.sites FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('Site','SITE');

CREATE TRIGGER protect_content BEFORE DELETE ON ppo.sites FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

CREATE FUNCTION ppo.site_timezone() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN IF NOT EXISTS(SELECT 1 FROM pg_timezone_names WHERE name=NEW.timezone) THEN RAISE EXCEPTION 'Invalid timezone' USING ERRCODE='23514'; END IF; RETURN NEW; END $$;
CREATE TRIGGER timezone_valid BEFORE INSERT OR UPDATE ON ppo.sites FOR EACH ROW EXECUTE FUNCTION ppo.site_timezone();

CREATE TABLE ppo.site_parties (
  id uuid PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES ppo.workspaces(id),
  version integer NOT NULL DEFAULT 1 CHECK(version>0), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
  UNIQUE(workspace_id,id),
  FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
  FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id),
  FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
  company_id uuid NOT NULL, UNIQUE(workspace_id,company_id,id),
  FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id),
  site_id uuid NOT NULL, organisation_id uuid NOT NULL, role text NOT NULL CHECK(role IN ('Operator','BillingParty','Owner')),
  valid_from timestamptz NOT NULL, valid_to timestamptz,
  CHECK(isfinite(valid_from) AND (valid_to IS NULL OR (isfinite(valid_to) AND valid_to>valid_from))),
  FOREIGN KEY(workspace_id,company_id,site_id) REFERENCES ppo.sites(workspace_id,company_id,id),
  FOREIGN KEY(workspace_id,company_id,organisation_id) REFERENCES ppo.organisations(workspace_id,company_id,id),
  EXCLUDE USING gist(workspace_id WITH =,site_id WITH =,role WITH =,tstzrange(valid_from,valid_to,'[)') WITH &&) WHERE(role='Operator'),
  EXCLUDE USING gist(workspace_id WITH =,site_id WITH =,organisation_id WITH =,role WITH =,tstzrange(valid_from,valid_to,'[)') WITH &&)
);

CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.site_parties FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('SiteParty','');

CREATE TRIGGER protect_content BEFORE DELETE ON ppo.site_parties FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

CREATE TABLE ppo.facilities (
  id uuid PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES ppo.workspaces(id),
  version integer NOT NULL DEFAULT 1 CHECK(version>0), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
  UNIQUE(workspace_id,id),
  FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
  FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id),
  FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
  company_id uuid NOT NULL, UNIQUE(workspace_id,company_id,id),
  FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id),
  site_id uuid NOT NULL, parent_facility_id uuid, name text NOT NULL CHECK(length(btrim(name)) BETWEEN 1 AND 200),
  UNIQUE(workspace_id,company_id,site_id,id),
  FOREIGN KEY(workspace_id,company_id,site_id) REFERENCES ppo.sites(workspace_id,company_id,id),
  FOREIGN KEY(workspace_id,company_id,site_id,parent_facility_id) REFERENCES ppo.facilities(workspace_id,company_id,site_id,id)
);

CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.facilities FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('Facility','');

CREATE TRIGGER protect_content BEFORE DELETE ON ppo.facilities FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

CREATE TABLE ppo.assets (
  id uuid PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES ppo.workspaces(id),
  version integer NOT NULL DEFAULT 1 CHECK(version>0), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
  UNIQUE(workspace_id,id),
  FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
  FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id),
  FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
  company_id uuid NOT NULL, UNIQUE(workspace_id,company_id,id),
  FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id),
  display_number text NOT NULL, description text NOT NULL CHECK(length(btrim(description)) BETWEEN 1 AND 200),
  identity_status text NOT NULL CHECK(identity_status IN ('Verified','Unresolved','Disputed')),
  site_id uuid NOT NULL, facility_id uuid, parent_asset_id uuid, manufacturer text, model text,
  serial text COLLATE "C", external_equipment_ref text COLLATE "C",
  lifecycle_status text NOT NULL CHECK(lifecycle_status IN ('Active','Removed','Decommissioned')), predecessor_asset_id uuid,
  installed_on date, commissioned_on date, warranty_start date, warranty_end date,
  UNIQUE(workspace_id,company_id,site_id,id),
  FOREIGN KEY(workspace_id,company_id,site_id) REFERENCES ppo.sites(workspace_id,company_id,id),
  FOREIGN KEY(workspace_id,company_id,site_id,facility_id) REFERENCES ppo.facilities(workspace_id,company_id,site_id,id),
  FOREIGN KEY(workspace_id,company_id,site_id,parent_asset_id) REFERENCES ppo.assets(workspace_id,company_id,site_id,id),
  FOREIGN KEY(workspace_id,company_id,predecessor_asset_id) REFERENCES ppo.assets(workspace_id,company_id,id),
  CHECK(installed_on IS NULL OR isfinite(installed_on)), CHECK(commissioned_on IS NULL OR isfinite(commissioned_on)),
  CHECK(warranty_start IS NULL OR isfinite(warranty_start)), CHECK(warranty_end IS NULL OR isfinite(warranty_end)),
  CHECK(warranty_end IS NULL OR warranty_start IS NULL OR warranty_end>=warranty_start),
  CHECK(commissioned_on IS NULL OR installed_on IS NULL OR commissioned_on>=installed_on)
);

CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.assets FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('Asset','AST');

CREATE TRIGGER protect_content BEFORE DELETE ON ppo.assets FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

CREATE TABLE ppo.erp_account_mappings (
  id uuid PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES ppo.workspaces(id),
  version integer NOT NULL DEFAULT 1 CHECK(version>0), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
  UNIQUE(workspace_id,id),
  FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
  FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id),
  FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
  company_id uuid NOT NULL, UNIQUE(workspace_id,company_id,id),
  FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id),
  organisation_id uuid NOT NULL, erp_connection_id uuid NOT NULL, erp_company_id text COLLATE "C" NOT NULL,
  entity_type text COLLATE "C" NOT NULL CHECK(entity_type='Customer'), customer_id text COLLATE "C" NOT NULL CHECK(length(customer_id) BETWEEN 1 AND 200),
  mapping_status text NOT NULL CHECK(mapping_status IN ('Proposed','Verified','Disputed','Inactive')),
  valid_from timestamptz NOT NULL, valid_to timestamptz,
  CHECK(isfinite(valid_from) AND (valid_to IS NULL OR (isfinite(valid_to) AND valid_to>valid_from))),
  FOREIGN KEY(workspace_id,company_id,organisation_id) REFERENCES ppo.organisations(workspace_id,company_id,id),
  FOREIGN KEY(workspace_id,company_id,erp_connection_id,erp_company_id) REFERENCES ppo.companies(workspace_id,id,erp_connection_id,erp_company_id),
  -- Verification with controlled document evidence remains a later command. Never imply verification.
  CHECK(mapping_status<>'Verified'),
  EXCLUDE USING gist(workspace_id WITH =,erp_connection_id WITH =,erp_company_id WITH =,entity_type WITH =,customer_id WITH =,tstzrange(valid_from,valid_to,'[)') WITH &&) WHERE(mapping_status<>'Inactive')
);

CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.erp_account_mappings FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('ErpAccountMapping','');

CREATE TRIGGER protect_content BEFORE DELETE ON ppo.erp_account_mappings FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

CREATE TABLE ppo.asset_configurations (
  id uuid PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES ppo.workspaces(id),
  version integer NOT NULL DEFAULT 1 CHECK(version>0), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
  UNIQUE(workspace_id,id),
  FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
  FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id),
  FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
  company_id uuid NOT NULL, UNIQUE(workspace_id,company_id,id),
  FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id),
  schema_version integer NOT NULL DEFAULT 1 CHECK(schema_version=1), asset_id uuid NOT NULL, revision integer NOT NULL CHECK(revision>0),
  description text NOT NULL CHECK(length(btrim(description)) BETWEEN 1 AND 10000), valid_from timestamptz NOT NULL, valid_to timestamptz,
  verification_status text NOT NULL DEFAULT 'ReviewRequired' CHECK(verification_status='ReviewRequired'),
  CHECK(isfinite(valid_from) AND (valid_to IS NULL OR (isfinite(valid_to) AND valid_to>valid_from))),
  UNIQUE(workspace_id,asset_id,revision),
  FOREIGN KEY(workspace_id,company_id,asset_id) REFERENCES ppo.assets(workspace_id,company_id,id),
  EXCLUDE USING gist(workspace_id WITH =,asset_id WITH =,tstzrange(valid_from,valid_to,'[)') WITH &&)
);

CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.asset_configurations FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('AssetConfiguration','');

CREATE TRIGGER protect_content BEFORE UPDATE OR DELETE ON ppo.asset_configurations FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

CREATE TABLE ppo.asset_location_events (
  id uuid PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES ppo.workspaces(id),
  version integer NOT NULL DEFAULT 1 CHECK(version>0), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
  UNIQUE(workspace_id,id),
  FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
  FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id),
  FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
  company_id uuid NOT NULL, UNIQUE(workspace_id,company_id,id),
  FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id),
  schema_version integer NOT NULL DEFAULT 1 CHECK(schema_version=1), asset_id uuid NOT NULL,
  from_site_id uuid, to_site_id uuid NOT NULL, effective_at timestamptz NOT NULL CHECK(isfinite(effective_at)), reason text NOT NULL,
  UNIQUE(workspace_id,asset_id,effective_at),
  FOREIGN KEY(workspace_id,company_id,asset_id) REFERENCES ppo.assets(workspace_id,company_id,id),
  FOREIGN KEY(workspace_id,company_id,from_site_id) REFERENCES ppo.sites(workspace_id,company_id,id),
  FOREIGN KEY(workspace_id,company_id,to_site_id) REFERENCES ppo.sites(workspace_id,company_id,id),
  CHECK(from_site_id IS NULL OR from_site_id<>to_site_id)
);

CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.asset_location_events FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('AssetLocationEvent','');

CREATE TRIGGER protect_content BEFORE UPDATE OR DELETE ON ppo.asset_location_events FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

CREATE TABLE ppo.history_records (
  id uuid PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES ppo.workspaces(id),
  version integer NOT NULL DEFAULT 1 CHECK(version>0), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
  UNIQUE(workspace_id,id),
  FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
  FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id),
  FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
  company_id uuid NOT NULL, UNIQUE(workspace_id,company_id,id),
  FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id),
  schema_version integer NOT NULL DEFAULT 1 CHECK(schema_version=1), site_id uuid NOT NULL, asset_id uuid,
  occurred_at timestamptz NOT NULL CHECK(isfinite(occurred_at)), author_label text NOT NULL CHECK(length(btrim(author_label)) BETWEEN 1 AND 200),
  kind text NOT NULL CHECK(kind IN ('PriorWork','KnownIssue','AttemptedFix','TechnicalAdvice')),
  summary text NOT NULL CHECK(length(btrim(summary)) BETWEEN 1 AND 10000), confidence text NOT NULL CHECK(confidence IN ('Reported','Suspected','Verified')),
  source_system text COLLATE "C", source_id text COLLATE "C", verification_status text NOT NULL CHECK(verification_status IN ('Imported','Verified','ReviewRequired')),
  access_class text NOT NULL DEFAULT 'Internal' CHECK(access_class IN ('Internal','RestrictedService','RestrictedFinance','CustomerApproved')), site_label text NOT NULL, operator_organisation_id uuid, operator_label text,
  asset_identity_status text CHECK(asset_identity_status IN ('Verified','Unresolved','Disputed')),
  FOREIGN KEY(workspace_id,company_id,site_id) REFERENCES ppo.sites(workspace_id,company_id,id),
  FOREIGN KEY(workspace_id,company_id,asset_id) REFERENCES ppo.assets(workspace_id,company_id,id),
  FOREIGN KEY(workspace_id,company_id,operator_organisation_id) REFERENCES ppo.organisations(workspace_id,company_id,id),
  CHECK((source_system IS NULL)=(source_id IS NULL)),
  CHECK(verification_status<>'Imported' OR (source_system IS NOT NULL AND source_id IS NOT NULL))
);

CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.history_records FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('HistoryRecord','');

CREATE TRIGGER protect_content BEFORE UPDATE OR DELETE ON ppo.history_records FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

-- Row-lock serialisation makes hierarchy checks safe against concurrent write skew.
-- Services acquire this workspace lock BEFORE reading graph state; triggers cover direct SQL writes too.
CREATE FUNCTION ppo.shared_graph_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE parent_id uuid; ancestor uuid; seen uuid[]; col text:=TG_ARGV[0];
BEGIN
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 IF TG_OP='UPDATE' AND NEW.company_id<>OLD.company_id THEN RAISE EXCEPTION 'Company context is permanent in P02' USING ERRCODE='23514'; END IF;
 IF TG_TABLE_NAME='assets' AND TG_OP='UPDATE' AND to_jsonb(NEW)->>'site_id' IS DISTINCT FROM to_jsonb(OLD)->>'site_id' THEN RAISE EXCEPTION 'Reviewed asset move workflow is not enabled' USING ERRCODE='23514'; END IF;
 IF TG_TABLE_NAME='facilities' AND TG_OP='UPDATE' AND to_jsonb(NEW)->>'site_id' IS DISTINCT FROM to_jsonb(OLD)->>'site_id' THEN RAISE EXCEPTION 'Facility context is permanent in P02' USING ERRCODE='23514'; END IF;
 parent_id:=(to_jsonb(NEW)->>col)::uuid; seen:=ARRAY[NEW.id];
 WHILE parent_id IS NOT NULL LOOP
  IF parent_id=ANY(seen) THEN RAISE EXCEPTION 'Hierarchy cycle' USING ERRCODE='23514'; END IF;
  seen:=array_append(seen,parent_id);
  EXECUTE format('SELECT %I FROM ppo.%I WHERE workspace_id=$1 AND id=$2',col,TG_TABLE_NAME) INTO ancestor USING NEW.workspace_id,parent_id;
  parent_id:=ancestor;
 END LOOP;
 RETURN NEW;
END $$;
CREATE TRIGGER graph_guard BEFORE INSERT OR UPDATE ON ppo.organisations FOR EACH ROW EXECUTE FUNCTION ppo.shared_graph_guard('parent_organisation_id');
CREATE TRIGGER graph_guard BEFORE INSERT OR UPDATE ON ppo.facilities FOR EACH ROW EXECUTE FUNCTION ppo.shared_graph_guard('parent_facility_id');
CREATE TRIGGER graph_guard BEFORE INSERT OR UPDATE ON ppo.assets FOR EACH ROW EXECUTE FUNCTION ppo.shared_graph_guard('parent_asset_id');
CREATE TRIGGER predecessor_guard BEFORE INSERT OR UPDATE ON ppo.assets FOR EACH ROW EXECUTE FUNCTION ppo.shared_graph_guard('predecessor_asset_id');
CREATE FUNCTION ppo.history_context() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE context_site uuid;
BEGIN
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 IF NEW.asset_id IS NOT NULL THEN
  SELECT to_site_id INTO context_site FROM ppo.asset_location_events WHERE workspace_id=NEW.workspace_id AND asset_id=NEW.asset_id AND effective_at<=NEW.occurred_at ORDER BY effective_at DESC LIMIT 1;
  IF context_site IS DISTINCT FROM NEW.site_id THEN RAISE EXCEPTION 'History needs known asset location at occurrence' USING ERRCODE='23514'; END IF;
  -- Backdated imported evidence must not inherit a later identity conclusion.
  IF NEW.asset_identity_status IS NULL THEN
   SELECT identity_status INTO NEW.asset_identity_status FROM ppo.assets WHERE workspace_id=NEW.workspace_id AND id=NEW.asset_id AND created_at<=NEW.occurred_at;
  END IF;
 END IF;
 SELECT display_name INTO NEW.site_label FROM ppo.sites WHERE workspace_id=NEW.workspace_id AND id=NEW.site_id;
 SELECT o.id,o.display_name INTO NEW.operator_organisation_id,NEW.operator_label FROM ppo.site_parties sp
 JOIN ppo.organisations o ON (o.workspace_id,o.id)=(sp.workspace_id,sp.organisation_id)
 WHERE sp.workspace_id=NEW.workspace_id AND sp.site_id=NEW.site_id AND sp.role='Operator'
 AND sp.valid_from<=NEW.occurred_at AND (sp.valid_to IS NULL OR sp.valid_to>NEW.occurred_at);
 RETURN NEW;
END $$;
CREATE TRIGGER history_context BEFORE INSERT ON ppo.history_records FOR EACH ROW EXECUTE FUNCTION ppo.history_context();

ALTER TABLE ppo.permission_grants DROP CONSTRAINT permission_grants_capability_check;
ALTER TABLE ppo.permission_grants DROP CONSTRAINT permission_grants_pkey;
ALTER TABLE ppo.permission_grants ALTER COLUMN company_id DROP NOT NULL;
ALTER TABLE ppo.permission_grants ADD COLUMN id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY;
ALTER TABLE ppo.permission_grants ADD COLUMN scope_type text NOT NULL DEFAULT 'Company';
ALTER TABLE ppo.permission_grants ADD COLUMN scope_id uuid;
ALTER TABLE ppo.permission_grants ADD COLUMN site_id uuid;
UPDATE ppo.permission_grants SET scope_id=company_id;
ALTER TABLE ppo.permission_grants ALTER COLUMN scope_id SET NOT NULL;
ALTER TABLE ppo.permission_grants ADD CONSTRAINT uq_grants_scope UNIQUE(workspace_id,user_id,capability,scope_type,scope_id);
ALTER TABLE ppo.permission_grants ADD CONSTRAINT ck_grants_scope CHECK(
 (scope_type='Workspace' AND scope_id=workspace_id AND company_id IS NULL AND site_id IS NULL) OR
 (scope_type='Company' AND scope_id=company_id AND company_id IS NOT NULL AND site_id IS NULL) OR
 (scope_type='Site' AND scope_id=site_id AND company_id IS NOT NULL AND site_id IS NOT NULL));
ALTER TABLE ppo.permission_grants ADD CONSTRAINT fk_grants_site FOREIGN KEY(workspace_id,company_id,site_id) REFERENCES ppo.sites(workspace_id,company_id,id);
ALTER TABLE ppo.permission_grants ADD CONSTRAINT ck_grants_capability CHECK(capability IN ('service.ticket.read','service.ticket.edit','shared.read','shared.create','shared.edit','shared.internal.read','shared.finance.read','shared.history.record'));
-- P01 tickets have no site; a site grant can never authorise their access.
ALTER TABLE ppo.permission_grants ADD CONSTRAINT ck_ticket_scope CHECK(capability NOT LIKE 'service.ticket.%' OR scope_type='Company');
CREATE TABLE ppo.seed_receipts (version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT clock_timestamp());
CREATE TRIGGER seed_append_only BEFORE UPDATE OR DELETE ON ppo.seed_receipts FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE INDEX ix_organisations_scope_order ON ppo.organisations(workspace_id,company_id,display_name,id);
CREATE INDEX ix_assets_site ON ppo.assets(workspace_id,company_id,site_id,id);
CREATE INDEX ix_history_asset_time ON ppo.history_records(workspace_id,company_id,asset_id,occurred_at,id);

CREATE FUNCTION ppo.check_location_chain() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE asset_key uuid; current_site uuid; last_site uuid; event record;
BEGIN
 IF TG_TABLE_NAME='assets' THEN asset_key:=NEW.id; ELSE asset_key:=NEW.asset_id; END IF;
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 SELECT site_id INTO current_site FROM ppo.assets WHERE workspace_id=NEW.workspace_id AND id=asset_key;
 FOR event IN SELECT * FROM ppo.asset_location_events WHERE workspace_id=NEW.workspace_id AND asset_id=asset_key ORDER BY effective_at LOOP
  IF event.from_site_id IS DISTINCT FROM last_site THEN RAISE EXCEPTION 'Location chain is inconsistent' USING ERRCODE='23514'; END IF;
  last_site:=event.to_site_id;
 END LOOP;
 IF last_site IS DISTINCT FROM current_site THEN RAISE EXCEPTION 'Current site needs matching location evidence' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER location_matches_asset AFTER INSERT OR UPDATE ON ppo.assets DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_location_chain();
CREATE CONSTRAINT TRIGGER location_chain AFTER INSERT ON ppo.asset_location_events DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_location_chain();

CREATE FUNCTION ppo.identity_has_typed_record() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target text; present boolean;
BEGIN
 target:=CASE NEW.object_type WHEN 'Ticket' THEN 'tickets' WHEN 'Organisation' THEN 'organisations' WHEN 'Person' THEN 'people' WHEN 'Site' THEN 'sites' WHEN 'Facility' THEN 'facilities' WHEN 'Asset' THEN 'assets' WHEN 'Relationship' THEN 'relationships' WHEN 'SiteParty' THEN 'site_parties' WHEN 'ErpAccountMapping' THEN 'erp_account_mappings' WHEN 'AssetConfiguration' THEN 'asset_configurations' WHEN 'AssetLocationEvent' THEN 'asset_location_events' WHEN 'HistoryRecord' THEN 'history_records' END;
 EXECUTE format('SELECT EXISTS(SELECT 1 FROM ppo.%I WHERE workspace_id=$1 AND id=$2)',target) INTO present USING NEW.workspace_id,NEW.id;
 IF NOT present THEN RAISE EXCEPTION 'Typed identity target is missing' USING ERRCODE='23503'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER identity_target AFTER INSERT ON ppo.business_identities DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.identity_has_typed_record();
