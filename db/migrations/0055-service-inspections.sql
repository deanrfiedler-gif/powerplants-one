-- FI-03/FI-04 consumer of the retained shared inspection engine. No installed object
-- or identity type is replaced; 0051/0052 remain independently reserved.
CREATE TABLE ppo.service_inspection_templates (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL,
 procedure_key text NOT NULL, revision integer NOT NULL CHECK(revision>0),
 title text NOT NULL, source_reference text NOT NULL, source_content text NOT NULL,
 task_kinds text[] NOT NULL, checks jsonb NOT NULL CHECK(jsonb_typeof(checks)='array'),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,company_id,id), UNIQUE(workspace_id,company_id,procedure_key,revision),
 FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id)
);
CREATE TRIGGER retained_template BEFORE UPDATE OR DELETE ON ppo.service_inspection_templates FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.service_inspection_template_retirements (
 workspace_id uuid NOT NULL, company_id uuid NOT NULL, template_id uuid PRIMARY KEY,
 reason text NOT NULL, recorded_by uuid NOT NULL, recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 FOREIGN KEY(workspace_id,company_id,template_id) REFERENCES ppo.service_inspection_templates(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,recorded_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER retained_retirement BEFORE UPDATE OR DELETE ON ppo.service_inspection_template_retirements FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.service_inspection_bindings (
 attempt_id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL,
 appointment_id uuid NOT NULL, template_id uuid NOT NULL, scope_item_id uuid NOT NULL, asset_id uuid NOT NULL,
 snapshot jsonb NOT NULL, binding_hash text NOT NULL CHECK(binding_hash ~ '^[a-f0-9]{64}$'),
 UNIQUE(workspace_id,attempt_id),
 FOREIGN KEY(workspace_id,company_id,attempt_id) REFERENCES ppo.inspection_attempts(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,template_id) REFERENCES ppo.service_inspection_templates(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,appointment_id) REFERENCES ppo.appointments(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,scope_item_id,asset_id) REFERENCES ppo.scope_assets(workspace_id,scope_item_id,asset_id)
);
CREATE TRIGGER retained_binding BEFORE UPDATE OR DELETE ON ppo.service_inspection_bindings FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE INDEX service_inspection_bindings_appointment ON ppo.service_inspection_bindings(workspace_id,appointment_id);
CREATE TABLE ppo.service_inspection_events (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, appointment_id uuid NOT NULL,
 actor_id uuid NOT NULL, action text NOT NULL, details jsonb NOT NULL,
 operation_id uuid NOT NULL, recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,actor_id,operation_id),
 FOREIGN KEY(workspace_id,appointment_id) REFERENCES ppo.appointments(workspace_id,id),
 FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER retained_event BEFORE UPDATE OR DELETE ON ppo.service_inspection_events FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.service_inspection_outputs (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL,
 appointment_id uuid NOT NULL, attempt_id uuid NOT NULL, review_id uuid NOT NULL,
 audience text NOT NULL CHECK(audience='Internal'), manifest jsonb NOT NULL,
 manifest_hash text NOT NULL CHECK(manifest_hash ~ '^[a-f0-9]{64}$'),
 bundle jsonb NOT NULL, issued_by uuid NOT NULL, issued_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,attempt_id,review_id),
 FOREIGN KEY(workspace_id,company_id,attempt_id) REFERENCES ppo.inspection_attempts(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,review_id) REFERENCES ppo.inspection_reviews(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,appointment_id) REFERENCES ppo.appointments(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,issued_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER retained_output BEFORE UPDATE OR DELETE ON ppo.service_inspection_outputs FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.guard_service_inspection_context() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM ppo.inspection_attempts a WHERE a.workspace_id=NEW.workspace_id AND a.company_id=NEW.company_id
   AND a.id=NEW.attempt_id AND a.host_type='ServiceAppointment' AND a.host_id=NEW.appointment_id) THEN
   RAISE EXCEPTION 'Service inspection binding requires its real appointment attempt' USING ERRCODE='23514';
 END IF;
 IF TG_TABLE_NAME='service_inspection_outputs' THEN
   IF NOT EXISTS(SELECT 1 FROM ppo.inspection_reviews r JOIN ppo.inspection_attempts a ON a.workspace_id=r.workspace_id AND a.id=r.attempt_id
     WHERE r.workspace_id=NEW.workspace_id AND r.id=NEW.review_id AND r.attempt_id=NEW.attempt_id AND r.decision='Accepted'
       AND r.independence_required AND r.submitted_hash=a.submitted_hash AND r.decided_by<>a.performer_id) THEN
     RAISE EXCEPTION 'Service output requires the exact independent accepted review' USING ERRCODE='23514';
   END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER exact_context BEFORE INSERT ON ppo.service_inspection_bindings FOR EACH ROW EXECUTE FUNCTION ppo.guard_service_inspection_context();
CREATE TRIGGER exact_context BEFORE INSERT ON ppo.service_inspection_outputs FOR EACH ROW EXECUTE FUNCTION ppo.guard_service_inspection_context();
