-- My Work Sales Overview (design report r03; decisions D2 and D7 in my-work-sales-overview-integration.md).
-- Additive only: no existing row, constraint, trigger, grant or issued migration byte changes.
--
-- due_at stays the single instant after which an activity is overdue, so every existing
-- "due_at < now" read keeps its meaning without edits:
--   a task deadline      due_at = the deadline
--   a date-only task     due_at = the last instant of its local due day, due_date_only = true
--   an appointment       starts_at = its start, due_at = its planned end
-- An appointment is therefore never overdue merely because it has started. The column defaults
-- are catalogue defaults, so closed activities (which preserve_context refuses to update) are
-- not rewritten.
ALTER TABLE ppo.activities
 ADD COLUMN activity_type text NOT NULL DEFAULT 'Task'
  CONSTRAINT ck_activities_activity_type CHECK(activity_type IN ('Task','Call','Email','Meeting','SiteVisit')),
 ADD COLUMN starts_at timestamptz,
 ADD COLUMN due_date_only boolean NOT NULL DEFAULT false,
 ADD CONSTRAINT ck_activities_appointment CHECK(starts_at IS NULL OR
  (due_at IS NOT NULL AND isfinite(starts_at) AND starts_at<due_at AND due_at-starts_at<=interval '24 hours')),
 ADD CONSTRAINT ck_activities_date_only CHECK(NOT due_date_only OR (due_at IS NOT NULL AND starts_at IS NULL));

-- My Work reads one owner's active work in due order across companies and sites.
CREATE INDEX ix_activities_owner_due ON ppo.activities(workspace_id,owner_id,due_at,id) WHERE status IN ('Open','InProgress');

-- Personal saved criteria for My Work, after ppo.crm_directory_preferences (0017): one versioned
-- document per user, replaced whole under optimistic concurrency. It stores criteria only, never
-- records or authority; every use re-evaluates the reader's current grants.
CREATE TABLE ppo.work_view_preferences (
 workspace_id uuid NOT NULL, user_id uuid NOT NULL,
 version integer NOT NULL CONSTRAINT ck_work_view_preferences_version CHECK(version>0),
 views jsonb NOT NULL CONSTRAINT ck_work_view_preferences_views CHECK(jsonb_typeof(views)='array' AND jsonb_array_length(views)<=12),
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 CONSTRAINT pk_work_view_preferences PRIMARY KEY(workspace_id,user_id),
 CONSTRAINT fk_work_view_preferences_user FOREIGN KEY(workspace_id,user_id) REFERENCES ppo.users(workspace_id,id)
);
