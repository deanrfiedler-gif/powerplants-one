-- Separate hosted-only schema track. Never modify the issued local migrations.
ALTER TABLE ppo.users DROP CONSTRAINT users_issuer_check;
ALTER TABLE ppo.users ADD CONSTRAINT users_issuer_check CHECK(issuer IN ('PPO-LocalSynthetic','PPO-EntraDemo'));
CREATE TABLE ppo.demo_testers (
  tenant_id uuid NOT NULL, object_id uuid NOT NULL,
  workspace_id uuid NOT NULL, user_id uuid NOT NULL,
  enabled boolean NOT NULL DEFAULT true, expires_at timestamptz NOT NULL,
  PRIMARY KEY(tenant_id,object_id), UNIQUE(workspace_id,user_id),
  FOREIGN KEY(workspace_id,user_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.demo_login_attempts (
  token_hash text PRIMARY KEY CHECK(token_hash ~ '^[a-f0-9]{64}$'),
  state text NOT NULL, nonce text NOT NULL, verifier text NOT NULL,
  expires_at timestamptz NOT NULL
);
