-- PPO-MAINTENANCE-TS02-DEC M1 (M-R2, M-R4). M-R1 intervals are validated plan content and need no
-- schema change. Synthetic native records only; no capability, grant, seed, identity, outbox kind
-- or existing row changes. Every existing request keeps its bytes: both new columns stay null.
--
-- M-R2: a maintenance Service request records the Draft work order prepared with it. The work order
-- must receive the request's exact ticket, and each prepared work order serves one request.
-- M-R4: a follow-on request names the Partial result it follows. One follow-on per result, and no
-- follow-on while any request for the occurrence is still waiting for its result, so an
-- occurrence has at most one open follow-on. The original request stays the occurrence's only
-- non-follow-on request.
ALTER TABLE ppo.maintenance_work_requests
 ADD COLUMN work_order_id uuid,
 ADD COLUMN follow_on_result_id uuid,
 ADD CONSTRAINT fk_maintenance_request_work_order FOREIGN KEY(workspace_id,company_id,work_order_id) REFERENCES ppo.work_orders(workspace_id,company_id,id),
 ADD CONSTRAINT fk_maintenance_request_follows FOREIGN KEY(workspace_id,follow_on_result_id) REFERENCES ppo.maintenance_service_results(workspace_id,id),
 ADD CONSTRAINT uq_maintenance_request_follows UNIQUE(workspace_id,follow_on_result_id),
 ADD CONSTRAINT ck_maintenance_follow_on_occurrence CHECK(follow_on_result_id IS NULL OR occurrence_id IS NOT NULL);
CREATE UNIQUE INDEX maintenance_request_one_work_order ON ppo.maintenance_work_requests(workspace_id,work_order_id) WHERE work_order_id IS NOT NULL;
DROP INDEX ppo.occurrence_one_original_request;
CREATE UNIQUE INDEX occurrence_one_original_request ON ppo.maintenance_work_requests(workspace_id,occurrence_id) WHERE occurrence_id IS NOT NULL AND follow_on_result_id IS NULL;

CREATE FUNCTION ppo.guard_maintenance_request_links() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NEW.work_order_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM ppo.work_order_tickets WHERE workspace_id=NEW.workspace_id AND work_order_id=NEW.work_order_id AND ticket_id=NEW.ticket_id) THEN
  RAISE EXCEPTION 'A prepared work order must receive this exact request' USING ERRCODE='23514'; END IF;
 IF NEW.follow_on_result_id IS NULL THEN RETURN NEW; END IF;
 IF NOT EXISTS(SELECT 1 FROM ppo.maintenance_service_results s JOIN ppo.maintenance_work_requests q ON (q.workspace_id,q.id)=(s.workspace_id,s.request_id)
  WHERE s.workspace_id=NEW.workspace_id AND s.id=NEW.follow_on_result_id AND s.outcome='Partial' AND q.occurrence_id=NEW.occurrence_id) THEN
  RAISE EXCEPTION 'Follow-on work follows a Partial result of the same occurrence' USING ERRCODE='23514'; END IF;
 IF EXISTS(SELECT 1 FROM ppo.maintenance_work_requests q WHERE q.workspace_id=NEW.workspace_id AND q.occurrence_id=NEW.occurrence_id
  AND NOT EXISTS(SELECT 1 FROM ppo.maintenance_service_results s WHERE s.workspace_id=q.workspace_id AND s.request_id=q.id)) THEN
  RAISE EXCEPTION 'An occurrence has at most one open follow-on request' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_request_links BEFORE INSERT ON ppo.maintenance_work_requests
 FOR EACH ROW EXECUTE FUNCTION ppo.guard_maintenance_request_links();
