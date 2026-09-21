-- Retain exact polymorphic recipient identities and correct stored EN-08 Project context.
CREATE OR REPLACE FUNCTION ppo.acceptance_source_context() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NEW.commissioning_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM ppo.commissioning_packages k JOIN ppo.engineering_packages e ON e.workspace_id=k.workspace_id AND e.id=k.package_id WHERE k.workspace_id=NEW.workspace_id AND k.id=NEW.commissioning_id AND e.project_id=NEW.project_id) THEN RAISE EXCEPTION 'Technical evidence must belong to the exact Project' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;

ALTER TABLE ppo.acceptance_manifests ADD COLUMN customer_person_id uuid GENERATED ALWAYS AS (CASE WHEN audience='Customer' THEN recipient_id END) STORED;
ALTER TABLE ppo.acceptance_manifests ADD COLUMN service_user_id uuid GENERATED ALWAYS AS (CASE WHEN audience='Service' THEN recipient_id END) STORED;
ALTER TABLE ppo.acceptance_manifests ADD CONSTRAINT acceptance_customer_fk FOREIGN KEY(workspace_id,customer_person_id) REFERENCES ppo.people(workspace_id,id);
ALTER TABLE ppo.acceptance_manifests ADD CONSTRAINT acceptance_service_fk FOREIGN KEY(workspace_id,service_user_id) REFERENCES ppo.users(workspace_id,id);
ALTER TABLE ppo.acceptance_responses ADD CONSTRAINT acceptance_respondent_fk FOREIGN KEY(workspace_id,respondent_id) REFERENCES ppo.people(workspace_id,id);
CREATE TRIGGER retained_requirements BEFORE UPDATE OR DELETE ON ppo.acceptance_requirements FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
