-- Hosted-only Gmail connection schema (ADR-0021). Never modify the issued local migrations.
-- Real correspondence lives only in these tables. ppo.email_messages stays synthetic under 0015:
-- its provider, synthetic and '%.example' sender checks are the guard for the rest of the demo
-- and are deliberately left intact.

-- Extend the shared capability and audit vocabularies using the 0015 idiom, which appends to the
-- existing definition rather than restating a list this track cannot see.
DO $$ DECLARE item record; definition text; BEGIN
 FOR item IN SELECT * FROM (VALUES
 ('permission_grants','ck_grants_capability','capability','email.connect'),
 ('audit_events','ck_audit_object_type','object_type','MailConnection')
 ) AS v(tab,con,col,added) LOOP
 SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid=('ppo.'||item.tab)::regclass AND conname=item.con;
 EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',item.tab,item.con);
 EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR %I = ANY(%L::text[]))',item.tab,item.con,substring(definition from 8 for length(definition)-8),item.col,string_to_array(item.added,','));
 END LOOP;
END $$;

-- A connection is operational state, not a business record: it is deliberately absent from
-- ppo.business_identities and carries no SYN-PPO reference.
CREATE TABLE ppo.mail_connections (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES ppo.workspaces(id), owner_id uuid NOT NULL,
 provider text NOT NULL CHECK(provider='Gmail'),
 -- The permanent ownership anchor. A mailbox address can be re-aliased; the account subject cannot.
 -- Reconnection with a different subject is refused by the service, never silently rebound here.
 provider_account_id text COLLATE "C" NOT NULL CHECK(length(provider_account_id) BETWEEN 1 AND 255),
 mailbox_address text NOT NULL CHECK(mailbox_address ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
 -- The immutable Gmail Label_* identifier. Renaming the label must not silently empty the import.
 label_id text COLLATE "C" NOT NULL CHECK(length(label_id) BETWEEN 1 AND 128),
 label_name text NOT NULL CHECK(length(btrim(label_name)) BETWEEN 1 AND 200),
 granted_scopes text[] NOT NULL CHECK(cardinality(granted_scopes) BETWEEN 1 AND 10),
 import_window_days integer NOT NULL DEFAULT 30 CHECK(import_window_days BETWEEN 1 AND 30),
 status text NOT NULL CHECK(status IN ('Connecting','InitialSync','Ready','Paused','TransientFailure','ReconnectRequired','Disconnecting','Disconnected')),
 -- AES-256-GCM over the Google token material; the key itself never enters the database.
 token_ciphertext bytea, token_iv bytea, token_tag bytea,
 token_key_id text CHECK(token_key_id IS NULL OR token_key_id ~ '^[a-z0-9-]{1,32}$'),
 access_token_expires_at timestamptz, connected_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 last_success_at timestamptz, disconnected_at timestamptz,
 version integer NOT NULL DEFAULT 1 CHECK(version>0),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,id,owner_id),
 -- One mailbox per tester and one tester per Google account: another tester cannot reconnect
 -- this mailbox as their own, and cannot reach its content through a second connection row.
 UNIQUE(workspace_id,owner_id), UNIQUE(workspace_id,provider,provider_account_id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),
 -- Disconnect must leave no token bytes behind, and an actively syncing connection must hold them.
 CHECK(status<>'Disconnected' OR num_nonnulls(token_ciphertext,token_iv,token_tag,token_key_id)=0),
 CHECK(status NOT IN ('InitialSync','Ready','Paused','TransientFailure') OR token_ciphertext IS NOT NULL),
 CHECK(num_nonnulls(token_ciphertext,token_iv,token_tag,token_key_id) IN (0,4)),
 CHECK(token_iv IS NULL OR octet_length(token_iv)=12),
 CHECK(token_tag IS NULL OR octet_length(token_tag)=16),
 CHECK((status='Disconnected')=(disconnected_at IS NOT NULL))
);

-- Cached content from a mailbox PPO does not own. Unlike PPO evidence this is intentionally
-- deletable: disconnect and the explicit purge must be able to remove it, so there is no
-- immutable_evidence trigger and no synthetic column. Plain text only in this slice; there is
-- deliberately no HTML column until a reviewed sanitiser exists.
CREATE TABLE ppo.provider_messages (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES ppo.workspaces(id),
 connection_id uuid NOT NULL, owner_id uuid NOT NULL,
 provider_message_id text COLLATE "C" NOT NULL CHECK(length(provider_message_id) BETWEEN 1 AND 128),
 provider_thread_id text COLLATE "C" NOT NULL CHECK(length(provider_thread_id) BETWEEN 1 AND 128),
 internet_message_id text COLLATE "C" CHECK(internet_message_id IS NULL OR length(internet_message_id) BETWEEN 1 AND 998),
 history_id bigint NOT NULL CHECK(history_id>0),
 sender_name text NOT NULL CHECK(length(sender_name)<=320),
 sender_address text NOT NULL CHECK(length(sender_address) BETWEEN 1 AND 320),
 recipient_summary text NOT NULL DEFAULT '' CHECK(length(recipient_summary)<=2000),
 subject text NOT NULL CHECK(length(subject)<=2000),
 body_text text NOT NULL CHECK(length(body_text)<=100000), body_truncated boolean NOT NULL DEFAULT false,
 attachment_count integer NOT NULL DEFAULT 0 CHECK(attachment_count>=0),
 received_at timestamptz NOT NULL CHECK(isfinite(received_at)),
 imported_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 -- No company_id: an arbitrary inbound sender has no company at import. Company context is
 -- established only by an explicit link below, taken from the chosen opportunity.
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,id,owner_id),
 -- Duplicate prevention for repeated Refresh and overlapping sync rounds.
 UNIQUE(workspace_id,connection_id,provider_message_id),
 FOREIGN KEY(workspace_id,connection_id,owner_id) REFERENCES ppo.mail_connections(workspace_id,id,owner_id) ON DELETE CASCADE,
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id)
);

-- Linking is not sharing: a link organises the owner's own mailbox context and grants no
-- content access to anyone else. created_by=owner_id keeps that true at the schema level.
CREATE TABLE ppo.mail_message_links (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES ppo.workspaces(id),
 message_id uuid NOT NULL, owner_id uuid NOT NULL, company_id uuid NOT NULL, opportunity_id uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,message_id,opportunity_id),
 FOREIGN KEY(workspace_id,message_id,owner_id) REFERENCES ppo.provider_messages(workspace_id,id,owner_id) ON DELETE CASCADE,
 FOREIGN KEY(workspace_id,company_id,opportunity_id) REFERENCES ppo.opportunities(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 CHECK(created_by=owner_id)
);

CREATE TABLE ppo.mail_sync_checkpoints (
 workspace_id uuid NOT NULL, connection_id uuid NOT NULL, resource text NOT NULL CHECK(resource='Messages'),
 start_history_id bigint CHECK(start_history_id IS NULL OR start_history_id>0),
 window_start timestamptz NOT NULL CHECK(isfinite(window_start)),
 rebuild_required boolean NOT NULL DEFAULT true,
 last_attempt_at timestamptz, last_success_at timestamptz,
 attempts integer NOT NULL DEFAULT 0 CHECK(attempts>=0), next_attempt_at timestamptz,
 lease_owner text CHECK(lease_owner IS NULL OR lease_owner ~ '^[A-Za-z0-9._-]{1,64}$'), lease_until timestamptz,
 -- A provider failure must never carry a subject, address or body fragment into stored state.
 error_code text CHECK(error_code IS NULL OR error_code ~ '^[A-Za-z][A-Za-z0-9]{2,39}$'),
 PRIMARY KEY(workspace_id,connection_id,resource),
 FOREIGN KEY(workspace_id,connection_id) REFERENCES ppo.mail_connections(workspace_id,id) ON DELETE CASCADE,
 CHECK((lease_owner IS NULL)=(lease_until IS NULL)),
 -- Gmail retires history identifiers. Losing one must force a bounded re-list of the declared
 -- window, never a silent gap: no checkpoint may claim currency without a usable history ID.
 CHECK(rebuild_required OR start_history_id IS NOT NULL)
);

-- Mirrors ppo.demo_login_attempts, and additionally binds the attempt to the PPO actor who
-- started it, so a callback completed by a different signed-in tester cannot bind the mailbox.
CREATE TABLE ppo.mail_connect_attempts (
 token_hash text PRIMARY KEY CHECK(token_hash ~ '^[a-f0-9]{64}$'),
 workspace_id uuid NOT NULL, actor_id uuid NOT NULL,
 state text NOT NULL, nonce text NOT NULL, verifier text NOT NULL, expires_at timestamptz NOT NULL,
 FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id)
);

CREATE INDEX ix_provider_messages_owner ON ppo.provider_messages(workspace_id,owner_id,received_at,id);
CREATE INDEX ix_provider_messages_thread ON ppo.provider_messages(workspace_id,connection_id,provider_thread_id,received_at);
CREATE INDEX ix_mail_links_opportunity ON ppo.mail_message_links(workspace_id,company_id,opportunity_id,id);
