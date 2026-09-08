-- AI1 owns only this table; 0015 is reserved to the separate Email & Calendar PR.
-- No existing functions, identity types, grants or business tables are replaced.
CREATE TABLE ppo.assistant_proposals (
  workspace_id uuid NOT NULL REFERENCES ppo.workspaces(id),
  id uuid NOT NULL,
  actor_id uuid NOT NULL,
  operation_id uuid NOT NULL,
  version integer NOT NULL DEFAULT 1 CHECK (version = 1),
  command jsonb,
  command_hash text NOT NULL CHECK (command_hash ~ '^[a-f0-9]{64}$'),
  selections jsonb NOT NULL,
  selection_hash text NOT NULL CHECK (selection_hash ~ '^[a-f0-9]{64}$'),
  state text NOT NULL DEFAULT 'Ready' CHECK (state IN ('Ready','Submitting','Accepted','Superseded')),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  expires_at timestamptz NOT NULL DEFAULT clock_timestamp() + interval '15 minutes',
  accepted_at timestamptz,
  synthetic boolean NOT NULL DEFAULT true CHECK (synthetic),
  PRIMARY KEY (workspace_id,id),
  UNIQUE (workspace_id,actor_id,operation_id),
  FOREIGN KEY (workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id),
  CHECK (command IS NOT NULL OR state = 'Accepted'),
  CHECK (command IS NULL OR (jsonb_typeof(command) = 'object' AND command->>'operation_id' = operation_id::text)),
  CHECK ((state = 'Accepted') = (accepted_at IS NOT NULL))
);
CREATE INDEX assistant_actor_recent ON ppo.assistant_proposals(workspace_id,actor_id,created_at DESC,id);
