-- P01 bounded persistence; not the complete DAT-01–DAT-11 schema.
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE SCHEMA ppo;
CREATE TABLE ppo.workspaces (
  id uuid PRIMARY KEY, display_name text NOT NULL, synthetic boolean NOT NULL DEFAULT true CHECK(synthetic)
);
CREATE TABLE ppo.companies (
  id uuid PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES ppo.workspaces(id),
  provider text NOT NULL CHECK(provider='Synthetic'), erp_connection_id text NOT NULL,
  erp_company_id text NOT NULL, display_name text NOT NULL,
  synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
  UNIQUE(workspace_id,id), UNIQUE(workspace_id,provider,erp_connection_id,erp_company_id)
);
CREATE TABLE ppo.users (
  id uuid PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES ppo.workspaces(id),
  issuer text NOT NULL CHECK(issuer='PPO-LocalSynthetic'), subject_id text NOT NULL,
  display_name text NOT NULL, active boolean NOT NULL DEFAULT true,
  synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
  UNIQUE(workspace_id,id), UNIQUE(issuer,subject_id)
);
CREATE TABLE ppo.permission_grants (
  workspace_id uuid NOT NULL, user_id uuid NOT NULL, company_id uuid NOT NULL,
  capability text NOT NULL CHECK(capability IN ('service.ticket.read','service.ticket.edit')),
  valid_from timestamptz NOT NULL DEFAULT '2026-01-01T00:00:00Z', valid_to timestamptz,
  PRIMARY KEY(workspace_id,user_id,company_id,capability),
  FOREIGN KEY(workspace_id,user_id) REFERENCES ppo.users(workspace_id,id),
  FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id),
  CHECK(valid_to IS NULL OR valid_to>valid_from)
);
CREATE TABLE ppo.sessions (
  token_hash text PRIMARY KEY CHECK(token_hash ~ '^[a-f0-9]{64}$'),
  workspace_id uuid NOT NULL, actor_id uuid NOT NULL, expires_at timestamptz NOT NULL,
  FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.tickets (
  id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL,
  display_number text NOT NULL CHECK(display_number ~ '^SYN-PPO-TKT-[0-9]{6,}$'),
  summary text NOT NULL CHECK(length(btrim(summary)) BETWEEN 1 AND 200),
  symptom text NOT NULL, received_at timestamptz NOT NULL,
  channel text NOT NULL CHECK(channel IN ('Phone','Email','Manual','PlannedMaintenance','Other')),
  requester_description text NOT NULL, site_identification_needed boolean NOT NULL CHECK(site_identification_needed),
  priority text NOT NULL CHECK(priority IN ('Low','Normal','High','Urgent')),
  triage_owner_id uuid NOT NULL, status text NOT NULL CHECK(status IN ('New','NeedsInformation','Triaged','Active','Waiting','Resolved','Closed','Cancelled')),
  version integer NOT NULL DEFAULT 1 CHECK(version>0), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
  created_at timestamptz NOT NULL, created_by uuid NOT NULL, updated_at timestamptz NOT NULL, updated_by uuid NOT NULL,
  UNIQUE(workspace_id,id), UNIQUE(workspace_id,display_number),
  FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id),
  FOREIGN KEY(workspace_id,triage_owner_id) REFERENCES ppo.users(workspace_id,id),
  FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
  FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.operation_receipts (
  id uuid PRIMARY KEY, workspace_id uuid NOT NULL, actor_id uuid NOT NULL, operation_id uuid NOT NULL,
  record_id uuid NOT NULL, payload_hash text NOT NULL CHECK(payload_hash ~ '^[a-f0-9]{64}$'),
  schema_version integer NOT NULL DEFAULT 1 CHECK(schema_version=1), result jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE(workspace_id,actor_id,operation_id),
  FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id),
  FOREIGN KEY(workspace_id,record_id) REFERENCES ppo.tickets(workspace_id,id)
);
CREATE TABLE ppo.audit_events (
  id uuid PRIMARY KEY, workspace_id uuid NOT NULL, actor_id uuid NOT NULL,
  object_type text NOT NULL CHECK(object_type IN ('Ticket','Session')), object_id uuid NOT NULL,
  operation_id uuid, occurred_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  schema_version integer NOT NULL DEFAULT 1 CHECK(schema_version=1),
  outcome text NOT NULL CHECK(outcome='Accepted'), reason text NOT NULL, details jsonb NOT NULL,
  UNIQUE(workspace_id,actor_id,operation_id),
  FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.outbox_jobs (
  id uuid PRIMARY KEY, workspace_id uuid NOT NULL, actor_id uuid NOT NULL, operation_id uuid NOT NULL,
  correlation_id uuid NOT NULL, kind text NOT NULL CHECK(kind='TicketDraftSaved'),
  payload_version integer NOT NULL CHECK(payload_version=1), payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'Ready' CHECK(status IN ('Ready','Running','Done','Retry','Blocked','OutcomeUnknown')),
  attempts integer NOT NULL DEFAULT 0 CHECK(attempts>=0), lease_until timestamptz,
  next_attempt_at timestamptz, error_code text, created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE(workspace_id,actor_id,operation_id,kind),
  FOREIGN KEY(workspace_id,actor_id,operation_id) REFERENCES ppo.operation_receipts(workspace_id,actor_id,operation_id)
);
CREATE FUNCTION ppo.immutable_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Accepted evidence is append-only' USING ERRCODE='55000'; END $$;
CREATE TRIGGER audit_append_only BEFORE UPDATE OR DELETE ON ppo.audit_events FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TRIGGER receipts_append_only BEFORE UPDATE OR DELETE ON ppo.operation_receipts FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

-- Isolated experiment schema: these are not completed scheduling/domain tables.
CREATE SCHEMA ppo_proof;
CREATE TABLE ppo_proof.reservations (
  id uuid PRIMARY KEY, workspace_id uuid NOT NULL, resource_id uuid NOT NULL,
  start_at timestamptz NOT NULL, end_at timestamptz NOT NULL, active boolean NOT NULL DEFAULT true,
  during tstzrange GENERATED ALWAYS AS (tstzrange(start_at,end_at,'[)')) STORED,
  CHECK(isfinite(start_at) AND isfinite(end_at) AND start_at<end_at),
  EXCLUDE USING gist(workspace_id WITH =,resource_id WITH =,during WITH &&) WHERE(active)
);
