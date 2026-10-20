-- SV-07 D5. No seed, grants, source rewrites or new business identity types.
CREATE TABLE ppo.service_finding_activity_bindings (
 workspace_id uuid NOT NULL,
 source text NOT NULL CHECK (source IN ('inspection','incident','completion','response','schedule')),
 source_id uuid NOT NULL,
 parent_id uuid NOT NULL,
 activity_id uuid NOT NULL,
 PRIMARY KEY (workspace_id,source,source_id),
 FOREIGN KEY (workspace_id,activity_id) REFERENCES ppo.activities(workspace_id,id)
);
CREATE INDEX service_finding_activity_binding_activity ON ppo.service_finding_activity_bindings(workspace_id,activity_id);
CREATE FUNCTION ppo.check_service_finding_activity_binding() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE appointment uuid; native_activity uuid; company uuid; site uuid;
BEGIN
 CASE NEW.source
 WHEN 'inspection' THEN
  SELECT host_id,activity_id INTO appointment,native_activity FROM ppo.inspection_defects
   WHERE workspace_id=NEW.workspace_id AND id=NEW.source_id AND host_type='ServiceAppointment' AND host_id=NEW.parent_id;
 WHEN 'incident' THEN
  SELECT i.appointment_id,a.activity_id INTO appointment,native_activity FROM ppo.incident_actions a
   JOIN ppo.incidents i ON (i.workspace_id,i.id)=(a.workspace_id,a.incident_id)
   WHERE a.workspace_id=NEW.workspace_id AND a.id=NEW.source_id AND a.incident_id=NEW.parent_id;
 WHEN 'completion' THEN
  SELECT appointment_id,(snapshot#>>'{completion,follow_up_activity_id}')::uuid INTO appointment,native_activity FROM ppo.report_revisions
   WHERE workspace_id=NEW.workspace_id AND id=NEW.source_id AND report_id=NEW.parent_id
   AND snapshot#>>'{completion,scope_outcome}' IN ('Partial','UnableToProceed');
 WHEN 'response' THEN
  SELECT s.appointment_id,r.follow_up_activity_id INTO appointment,native_activity FROM ppo.customer_responses r
   JOIN ppo.service_reports s ON (s.workspace_id,s.id)=(r.workspace_id,r.report_id)
   WHERE r.workspace_id=NEW.workspace_id AND r.id=NEW.source_id AND r.report_id=NEW.parent_id AND r.response<>'Accepted';
 WHEN 'schedule' THEN
  SELECT appointment_id,activity_id INTO appointment,native_activity FROM ppo.schedule_follow_ups
   WHERE workspace_id=NEW.workspace_id AND activity_id=NEW.source_id AND appointment_id=NEW.parent_id;
 END CASE;
 IF appointment IS NULL OR (native_activity IS NOT NULL AND native_activity<>NEW.activity_id) THEN
  RAISE EXCEPTION 'Finding source binding does not match' USING ERRCODE='23514';
 END IF;
 SELECT company_id,site_id INTO company,site FROM ppo.appointments WHERE workspace_id=NEW.workspace_id AND id=appointment;
 IF NOT EXISTS(SELECT 1 FROM ppo.activities WHERE workspace_id=NEW.workspace_id AND id=NEW.activity_id
   AND company_id=company AND site_id=site) THEN
  RAISE EXCEPTION 'Finding Activity context does not match' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER service_finding_activity_binding_valid BEFORE INSERT ON ppo.service_finding_activity_bindings
 FOR EACH ROW EXECUTE FUNCTION ppo.check_service_finding_activity_binding();
CREATE TRIGGER service_finding_activity_binding_retained BEFORE UPDATE OR DELETE ON ppo.service_finding_activity_bindings
 FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

-- Requirements belong to the Activity: two native observations may legitimately
-- refer to the same task (for example successive report revisions).
CREATE TABLE ppo.service_finding_action_details (
 workspace_id uuid NOT NULL,
 activity_id uuid NOT NULL,
 required_evidence text CHECK(required_evidence IS NULL OR length(btrim(required_evidence)) BETWEEN 1 AND 4000),
 updated_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(workspace_id,activity_id),
 FOREIGN KEY(workspace_id,activity_id) REFERENCES ppo.activities(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
