-- B1 / project delivery billing decision R1: a work order may belong to at most one project.
-- The typed link is optional. Nothing is inferred from the free-text project_reference, so every
-- existing work order stays unlinked until someone links it. No capability, grant, seed, identity
-- or existing row changes. The project version is not advanced by a link: each project version
-- needs its exact schedule event, and field work is not a schedule change.
ALTER TABLE ppo.work_orders ADD COLUMN project_id uuid;
ALTER TABLE ppo.work_orders ADD CONSTRAINT fk_work_order_project
 FOREIGN KEY(workspace_id,company_id,project_id) REFERENCES ppo.projects(workspace_id,company_id,id);
CREATE INDEX ix_work_orders_project ON ppo.work_orders(workspace_id,project_id,id) WHERE project_id IS NOT NULL;

-- Same workspace and company come from the foreign key. The guard adds the same customer, an Active
-- project when linking, no direct switch between projects (unlink first, with its own reason), and
-- no change of link once any visit on the work order has started. The project row is share-locked so
-- a concurrent closure waits for the link to commit or roll back.
CREATE FUNCTION ppo.guard_work_order_project() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE pj ppo.projects;
BEGIN
 IF TG_OP='UPDATE' AND NEW.project_id IS NOT DISTINCT FROM OLD.project_id THEN RETURN NEW; END IF;
 IF TG_OP='UPDATE' THEN
  IF OLD.project_id IS NOT NULL AND NEW.project_id IS NOT NULL THEN
   RAISE EXCEPTION 'Unlink the work order from its project before linking another' USING ERRCODE='23514'; END IF;
  IF EXISTS(SELECT 1 FROM ppo.appointments WHERE workspace_id=NEW.workspace_id AND work_order_id=NEW.id AND actual_start_at IS NOT NULL) THEN
   RAISE EXCEPTION 'The project link is fixed once a visit has started' USING ERRCODE='55000'; END IF;
 END IF;
 IF NEW.project_id IS NULL THEN RETURN NEW; END IF;
 SELECT * INTO pj FROM ppo.projects WHERE workspace_id=NEW.workspace_id AND id=NEW.project_id FOR SHARE;
 IF NOT FOUND OR pj.company_id<>NEW.company_id OR pj.organisation_id<>NEW.customer_id THEN
  RAISE EXCEPTION 'Project field work belongs to the same company and customer' USING ERRCODE='23514'; END IF;
 IF pj.lifecycle<>'Active' THEN
  RAISE EXCEPTION 'Link field work only to an Active project' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_project_link BEFORE INSERT OR UPDATE OF project_id ON ppo.work_orders
 FOR EACH ROW EXECUTE FUNCTION ppo.guard_work_order_project();

DO $$ DECLARE definition text; BEGIN
 SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid='ppo.outbox_jobs'::regclass AND conname='ck_outbox_kind';
 ALTER TABLE ppo.outbox_jobs DROP CONSTRAINT ck_outbox_kind;
 EXECUTE format('ALTER TABLE ppo.outbox_jobs ADD CONSTRAINT ck_outbox_kind CHECK ((%s) OR kind = ANY(%L::text[]))',
  substring(definition from 8 for length(definition)-8), ARRAY['WorkOrderProjectLinked','WorkOrderProjectUnlinked']);
END $$;
