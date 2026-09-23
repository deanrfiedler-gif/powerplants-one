-- ADR-0040. Additive personal state only; no source rows, grants, users or identities change.
CREATE TABLE ppo.notification_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL,
 recipient_id uuid NOT NULL, event_id uuid NOT NULL REFERENCES ppo.audit_events(id),
 source_type text NOT NULL CHECK(source_type='Activity'), source_id uuid NOT NULL,
 source_version integer, event_at timestamptz NOT NULL, category text NOT NULL CHECK(category='OwnedWork'),
 UNIQUE(workspace_id,recipient_id,event_id), UNIQUE(workspace_id,recipient_id,id),
 FOREIGN KEY(workspace_id,recipient_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,source_id) REFERENCES ppo.activities(workspace_id,id)
);
CREATE INDEX ix_notification_recipient ON ppo.notification_events(workspace_id,recipient_id,event_at DESC,id);
CREATE TABLE ppo.notification_states (
 workspace_id uuid NOT NULL, user_id uuid NOT NULL, notification_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version>0), is_read boolean NOT NULL DEFAULT false,
 archived boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(workspace_id,user_id,notification_id),
 FOREIGN KEY(workspace_id,user_id,notification_id) REFERENCES ppo.notification_events(workspace_id,recipient_id,id)
);
CREATE TABLE ppo.notification_preferences (
 workspace_id uuid NOT NULL, user_id uuid NOT NULL, version integer NOT NULL CHECK(version>0),
 settings jsonb NOT NULL CHECK(jsonb_typeof(settings)='object'), updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(workspace_id,user_id), FOREIGN KEY(workspace_id,user_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.platform_view_preferences (
 workspace_id uuid NOT NULL, user_id uuid NOT NULL, version integer NOT NULL CHECK(version>0),
 settings jsonb NOT NULL CHECK(jsonb_typeof(settings)='object'), updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(workspace_id,user_id), FOREIGN KEY(workspace_id,user_id) REFERENCES ppo.users(workspace_id,id)
);
