-- PJ-09: exactly one receipt and one final response per independent receiving request.
CREATE UNIQUE INDEX acceptance_service_response_once ON ppo.acceptance_decisions(workspace_id,subject_id,outcome) WHERE kind='Service';
CREATE UNIQUE INDEX acceptance_service_final_once ON ppo.acceptance_decisions(workspace_id,subject_id) WHERE kind='Service' AND outcome<>'Received';
CREATE UNIQUE INDEX acceptance_transfer_once ON ppo.acceptance_decisions(workspace_id,subject_id,((snapshot->>'obligation_version')::integer)) WHERE kind='Transfer';
CREATE FUNCTION ppo.acceptance_obligation_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Retain original obligation history' USING ERRCODE='55000'; END IF;
 IF OLD.state='Completed' OR NEW.state<>'Completed' OR NEW.version<>OLD.version+1 OR (to_jsonb(NEW)-ARRAY['state','version','completion_evidence']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['state','version','completion_evidence']) THEN RAISE EXCEPTION 'Retain obligation identity and original completion evidence' USING ERRCODE='55000'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER acceptance_obligation_guard BEFORE UPDATE OR DELETE ON ppo.acceptance_obligations FOR EACH ROW EXECUTE FUNCTION ppo.acceptance_obligation_guard();
