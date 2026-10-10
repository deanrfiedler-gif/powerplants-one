CREATE OR REPLACE FUNCTION ppo.invalidate_finance_source()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$ DECLARE h ppo.finance_handoffs; ev uuid; receipt uuid; job uuid; state text; BEGIN
 IF NEW.current_revision_id IS NOT DISTINCT FROM OLD.current_revision_id AND NOT (NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('Draft','Submitted','Returned')) THEN RETURN NEW; END IF;
 FOR h IN SELECT f.* FROM ppo.finance_handoffs f JOIN ppo.finance_sources s ON s.revision_id=f.current_revision_id WHERE s.workspace_id=NEW.workspace_id AND s.report_id=NEW.id AND f.status<>'Cancelled' AND NOT f.needs_review FOR UPDATE OF f LOOP
 state:=CASE WHEN h.status IN ('AwaitingERP','OutcomeUnknown') THEN 'OutcomeUnknown' WHEN h.status IN ('ReconciliationRequired','Reconciled') THEN 'ReconciliationRequired' ELSE 'Returned' END;
 UPDATE ppo.finance_handoffs SET status=state,needs_review=true,source_blocker='Exact service source changed; review the successor and retained processing evidence.',version=version+1,updated_by=NEW.updated_by,updated_at=clock_timestamp() WHERE id=h.id;
 ev:=gen_random_uuid();receipt:=gen_random_uuid();job:=gen_random_uuid();
 INSERT INTO ppo.finance_events(id,workspace_id,handoff_id,version,status,revision_id,actor_id,kind,reason,details) VALUES(ev,h.workspace_id,h.id,h.version+1,state,h.current_revision_id,NEW.updated_by,'SourceInvalidated','Exact service source changed',jsonb_build_object('report_id',NEW.id,'report_version',NEW.version));
 INSERT INTO ppo.audit_events(id,workspace_id,actor_id,object_type,object_id,operation_id,outcome,reason,details) VALUES(gen_random_uuid(),h.workspace_id,NEW.updated_by,'FinancialHandoff',h.id,ev,'Accepted','Exact service source dependency invalidated',jsonb_build_object('command','FinanceSourceInvalidated','report_id',NEW.id,'report_version',NEW.version,'event_id',ev));
 INSERT INTO ppo.operation_receipts(id,workspace_id,actor_id,operation_id,record_id,payload_hash,result) VALUES(receipt,h.workspace_id,NEW.updated_by,ev,h.id,encode(sha256(convert_to(jsonb_build_object('event_id',ev,'report_id',NEW.id,'report_version',NEW.version)::text,'UTF8')),'hex'),jsonb_build_object('operation_id',ev,'record_id',h.id,'record_version',h.version+1,'state',state,'accepted_at',clock_timestamp(),'receipt_id',receipt,'warnings','[]'::jsonb,'task_ids',jsonb_build_array(job)));
 INSERT INTO ppo.outbox_jobs(id,workspace_id,actor_id,operation_id,correlation_id,kind,payload_version,payload) VALUES(job,h.workspace_id,NEW.updated_by,ev,ev,'FinanceSourceInvalidated',1,jsonb_build_object('record_id',h.id,'record_version',h.version+1,'object_type','FinancialHandoff','synthetic',true));
 END LOOP;RETURN NEW;END $function$
