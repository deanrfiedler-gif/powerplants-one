-- Real EN-08 source-command proof exposed an invalid PL/pgSQL variable qualification.
-- Correct the trigger forward; preserve every applied migration, prior decision and receipt.
CREATE OR REPLACE FUNCTION ppo.acceptance_commissioning_changed() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE s record; activity uuid; changed_cause text;
BEGIN
 FOR s IN SELECT DISTINCT st.* FROM ppo.acceptance_stages st JOIN ppo.acceptance_stage_units l ON l.workspace_id=st.workspace_id AND l.stage_id=st.id AND l.revision=st.revision AND l.disposition='Included'
 JOIN ppo.acceptance_requirements r ON r.workspace_id=l.workspace_id AND r.unit_id=l.unit_id JOIN ppo.acceptance_sources src ON src.workspace_id=r.workspace_id AND src.id=r.source_id
 WHERE src.workspace_id=NEW.workspace_id AND src.commissioning_id=NEW.id AND EXISTS(SELECT 1 FROM ppo.acceptance_decisions d WHERE d.workspace_id=st.workspace_id AND d.stage_id=st.id AND d.kind='Technical') LOOP
  UPDATE ppo.acceptance_stages SET reassessment=true,version=version+1,updated_at=clock_timestamp(),updated_by=NEW.updated_by WHERE id=s.id;
  changed_cause:='en08:'||NEW.id||':'||NEW.version;
  IF NOT EXISTS(SELECT 1 FROM ppo.acceptance_followups WHERE workspace_id=s.workspace_id AND stage_id=s.id AND acceptance_followups.cause=changed_cause) THEN
   activity:=gen_random_uuid();
   INSERT INTO ppo.activities(id,workspace_id,company_id,site_id,kind,owner_id,summary,due_at,due_needed,access_class,created_by,updated_by)
   SELECT activity,s.workspace_id,s.company_id,p.site_id,'TechnicalFollowUp',s.owner_id,'Reassess changed technical evidence for acceptance stage',NULL,true,'Internal',NEW.updated_by,NEW.updated_by FROM ppo.projects p WHERE p.workspace_id=s.workspace_id AND p.id=s.project_id;
   INSERT INTO ppo.activity_links(workspace_id,company_id,activity_id,object_type,object_id) VALUES(s.workspace_id,s.company_id,activity,'Project',s.project_id);
   INSERT INTO ppo.acceptance_followups VALUES(s.workspace_id,s.project_id,s.id,changed_cause,activity);
  END IF;
 END LOOP;
 RETURN NEW;
END $$;
