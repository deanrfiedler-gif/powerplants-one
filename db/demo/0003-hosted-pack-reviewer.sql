-- Hosted-only, attributable least-privilege role profiles for invited testers.
-- The Entra tester remains the authentication anchor; each selectable profile
-- has its own PPO actor, grants and audit trail.
ALTER TABLE ppo.users DROP CONSTRAINT users_issuer_check;
ALTER TABLE ppo.users ADD CONSTRAINT users_issuer_check
  CHECK(issuer IN ('PPO-LocalSynthetic','PPO-EntraDemo','PPO-EntraDemoRole'));

CREATE TABLE ppo.demo_tester_roles (
  tenant_id uuid NOT NULL,
  object_id uuid NOT NULL,
  role_key text NOT NULL CHECK(role_key IN ('pack-reviewer')),
  workspace_id uuid NOT NULL,
  user_id uuid NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  expires_at timestamptz NOT NULL,
  PRIMARY KEY(tenant_id,object_id,role_key),
  UNIQUE(workspace_id,user_id),
  FOREIGN KEY(tenant_id,object_id) REFERENCES ppo.demo_testers(tenant_id,object_id),
  FOREIGN KEY(workspace_id,user_id) REFERENCES ppo.users(workspace_id,id)
);
