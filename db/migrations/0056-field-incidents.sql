-- FI-06 additive synthetic incident authority. Installed migrations remain intact.
-- The pending 0026 identity backfill is in the same upgrade transaction.
SET CONSTRAINTS ppo.identity_target IMMEDIATE;
DO $$ DECLARE r record; d text; BEGIN
 FOR r IN SELECT * FROM (VALUES
 ('business_identities','ck_identities_type','object_type','Incident'),
 ('audit_events','ck_audit_object_type','object_type','Incident'),
 ('outbox_jobs','ck_outbox_kind','kind','IncidentChanged'),
 ('permission_grants','ck_grants_capability','capability','incident.read,incident.report,incident.review,incident.close,incident.sensitive')) v(tab,con,col,added) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT d FROM pg_constraint WHERE conrelid=('ppo.'||r.tab)::regclass AND conname=r.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',r.tab,r.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR %I=ANY(%L::text[]))',r.tab,r.con,substring(d from 8 for length(d)-8),r.col,string_to_array(r.added,','));
 END LOOP;
 SELECT pg_get_functiondef('ppo.identity_has_typed_record()'::regprocedure) INTO d;
 IF position('CASE NEW.object_type' in d)=0 THEN RAISE EXCEPTION 'Inspect changed identity dispatch'; END IF;
 EXECUTE replace(d,'CASE NEW.object_type','CASE NEW.object_type WHEN ''Incident'' THEN ''incidents''');
END $$;
SET CONSTRAINTS ppo.identity_target DEFERRED;
CREATE TABLE ppo.incidents (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, site_id uuid NOT NULL,
 appointment_id uuid NOT NULL, work_order_id uuid NOT NULL, reporter_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version>0),
 state text NOT NULL DEFAULT 'Draft' CHECK(state IN ('Draft','Submitted','InReview','Returned','ClarificationRequired','OnHold','Accepted','Closed')),
 facts jsonb NOT NULL CHECK(jsonb_typeof(facts)='object'),
 assessment text NOT NULL DEFAULT 'Unassessed' CHECK(assessment IN ('Unassessed','Assessed')),
 priority text NOT NULL DEFAULT 'Unknown' CHECK(priority IN ('Unknown','Routine','Urgent')),
 owner_id uuid, due_at timestamptz, hold boolean NOT NULL DEFAULT true,
 repeated_report_id uuid, defect_id uuid, accepted_hash text, accepted_by uuid,
 reported_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,appointment_id) REFERENCES ppo.appointments(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id) REFERENCES ppo.sites(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,work_order_id) REFERENCES ppo.work_orders(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,reporter_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,accepted_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,repeated_report_id) REFERENCES ppo.incidents(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,defect_id) REFERENCES ppo.inspection_defects(workspace_id,company_id,id),
 CHECK(repeated_report_id IS DISTINCT FROM id)
);
CREATE INDEX incident_work_scope ON ppo.incidents(workspace_id,work_order_id,state);
CREATE TRIGGER register_identity BEFORE INSERT ON ppo.incidents FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('Incident','');
CREATE TABLE ppo.incident_bindings (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, incident_id uuid NOT NULL, sequence integer NOT NULL,
 scope_item_id uuid NOT NULL, asset_id uuid NOT NULL, snapshot jsonb NOT NULL, source_hash text NOT NULL CHECK(source_hash ~ '^[a-f0-9]{64}$'),
 recorded_by uuid NOT NULL, recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,incident_id,sequence),
 FOREIGN KEY(workspace_id,incident_id) REFERENCES ppo.incidents(workspace_id,id),
 FOREIGN KEY(workspace_id,scope_item_id,asset_id) REFERENCES ppo.scope_assets(workspace_id,scope_item_id,asset_id),
 FOREIGN KEY(workspace_id,recorded_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.incident_actions (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, incident_id uuid NOT NULL, activity_id uuid NOT NULL,
 instruction text NOT NULL, owner_id uuid NOT NULL, due_at timestamptz NOT NULL,
 accepted_evidence_id uuid, accepted_by uuid,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,activity_id),
 FOREIGN KEY(workspace_id,incident_id) REFERENCES ppo.incidents(workspace_id,id),
 FOREIGN KEY(workspace_id,activity_id) REFERENCES ppo.activities(workspace_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,accepted_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.incident_evidence (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, incident_id uuid NOT NULL, action_id uuid,
 audience text NOT NULL CHECK(audience IN ('Operational','Restricted')), label text NOT NULL,
 media_type text NOT NULL CHECK(media_type IN ('image/png','text/plain')), byte_count integer NOT NULL CHECK(byte_count>0 AND byte_count<=2097152),
 content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'), added_by uuid NOT NULL, added_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id),
 FOREIGN KEY(workspace_id,incident_id) REFERENCES ppo.incidents(workspace_id,id),
 FOREIGN KEY(workspace_id,action_id) REFERENCES ppo.incident_actions(workspace_id,id),
 FOREIGN KEY(workspace_id,added_by) REFERENCES ppo.users(workspace_id,id)
);
ALTER TABLE ppo.incident_actions ADD FOREIGN KEY(workspace_id,accepted_evidence_id) REFERENCES ppo.incident_evidence(workspace_id,id);
CREATE TABLE ppo.incident_events (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, incident_id uuid NOT NULL, version integer NOT NULL,
 action text NOT NULL, reason text NOT NULL, actor_id uuid NOT NULL, operation_id uuid NOT NULL,
 snapshot jsonb NOT NULL, recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,incident_id,version), UNIQUE(workspace_id,actor_id,operation_id),
 FOREIGN KEY(workspace_id,incident_id) REFERENCES ppo.incidents(workspace_id,id),
 FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.incident_outputs (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, incident_id uuid NOT NULL, review_hash text NOT NULL,
 manifest jsonb NOT NULL, manifest_hash text NOT NULL, bundle jsonb NOT NULL,
 issued_by uuid NOT NULL, issued_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,incident_id,review_hash),
 FOREIGN KEY(workspace_id,incident_id) REFERENCES ppo.incidents(workspace_id,id),
 FOREIGN KEY(workspace_id,issued_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER retained_binding BEFORE UPDATE OR DELETE ON ppo.incident_bindings FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TRIGGER retained_evidence BEFORE UPDATE OR DELETE ON ppo.incident_evidence FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TRIGGER retained_event BEFORE UPDATE OR DELETE ON ppo.incident_events FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TRIGGER retained_output BEFORE UPDATE OR DELETE ON ppo.incident_outputs FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
