-- Dean's 20 October 2026 naming amendment and accepted CS-08 Q1/Q2.
-- Existing references and retained survey contents/hashes are permanent.
SET CONSTRAINTS ppo.identity_target IMMEDIATE;

-- Preserve historical constraints while admitting the shorter synthetic prefix.
DO $$ DECLARE item record; definition text; BEGIN
 FOR item IN
  SELECT c.oid,c.conname,c.conrelid::regclass AS tab
  FROM pg_constraint c JOIN pg_namespace n ON n.oid=c.connamespace
  WHERE n.nspname='ppo' AND c.contype='c'
    AND position('^SYN-PPO-' in pg_get_constraintdef(c.oid))>0
 LOOP
  definition:=replace(pg_get_constraintdef(item.oid),'^SYN-PPO-','^SYN-(PPO-)?');
  EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I',item.tab,item.conname);
  EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %I %s',item.tab,item.conname,definition);
 END LOOP;
 SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint
 WHERE conrelid='ppo.reference_counters'::regclass AND conname='ck_reference_type';
 ALTER TABLE ppo.reference_counters DROP CONSTRAINT ck_reference_type;
 EXECUTE 'ALTER TABLE ppo.reference_counters ADD CONSTRAINT ck_reference_type CHECK (('
   ||substring(definition from 8 for length(definition)-8)||') OR record_type=''SRV'')';

 -- The permanent counter namespace stays SYN-PPO. New output uses SYN, so the
 -- sequence continues rather than restarting. Explicit legacy seed/import refs
 -- remain valid and advance the same counter. Operational storage stays disabled.
 SELECT pg_get_functiondef('ppo.register_identity()'::regprocedure) INTO STRICT definition;
 IF position('ref:=''SYN-PPO-''||code' in definition)=0 THEN
  RAISE EXCEPTION 'Inspect changed readable reference allocator';
 END IF;
 definition:=replace(definition,'ref:=''SYN-PPO-''||code','ref:=''SYN-''||code');
 definition:=replace(definition,'''^SYN-PPO-''||code','''^SYN-(PPO-)?''||code');
 EXECUTE definition;
END $$;

ALTER TABLE ppo.site_surveys ADD COLUMN display_number text;
-- First allocation for unnumbered surveys only. Do not create artificial
-- revisions or edit the immutable submission/history payloads.
ALTER TABLE ppo.site_surveys DISABLE TRIGGER protect_scope;
ALTER TABLE ppo.site_surveys DISABLE TRIGGER register_identity;
ALTER TABLE ppo.business_identities DISABLE TRIGGER identity_append_only;
DO $$ DECLARE survey record; allocated bigint; reference text; BEGIN
 FOR survey IN SELECT id,workspace_id FROM ppo.site_surveys ORDER BY workspace_id,created_at,id LOOP
  SELECT display_number INTO reference FROM ppo.business_identities
   WHERE workspace_id=survey.workspace_id AND id=survey.id;
  IF reference IS NULL THEN
   INSERT INTO ppo.reference_counters VALUES(survey.workspace_id,'SRV','SYN-PPO',1)
   ON CONFLICT(workspace_id,record_type,namespace) DO UPDATE
    SET last_value=ppo.reference_counters.last_value+1 RETURNING last_value INTO allocated;
   reference:='SYN-SRV-'||lpad(allocated::text,greatest(6,length(allocated::text)),'0');
   UPDATE ppo.business_identities SET display_number=reference
    WHERE workspace_id=survey.workspace_id AND id=survey.id AND display_number IS NULL;
  END IF;
  UPDATE ppo.site_surveys SET display_number=reference
   WHERE workspace_id=survey.workspace_id AND id=survey.id;
 END LOOP;
END $$;
ALTER TABLE ppo.business_identities ENABLE TRIGGER identity_append_only;
SET CONSTRAINTS ppo.identity_target DEFERRED;
ALTER TABLE ppo.site_surveys ENABLE TRIGGER protect_scope;
DROP TRIGGER register_identity ON ppo.site_surveys;
CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.site_surveys
 FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('SiteSurvey','SRV');
ALTER TABLE ppo.site_surveys ALTER COLUMN display_number SET NOT NULL;
ALTER TABLE ppo.site_surveys ADD CONSTRAINT survey_reference_format
 CHECK(display_number ~ '^SYN-(PPO-)?SRV-[0-9]{6,}$');
ALTER TABLE ppo.site_surveys ADD CONSTRAINT survey_reference_unique UNIQUE(workspace_id,display_number);

-- Original file facts are immutable with their photo. Historical PNGs keep
-- their original bytes and may have no retained filename; never invent one.
ALTER TABLE ppo.cs_survey_photos ADD COLUMN file_name text
 CHECK(file_name IS NULL OR length(file_name) BETWEEN 1 AND 200);
ALTER TABLE ppo.cs_survey_photos ADD COLUMN media_type text NOT NULL DEFAULT 'image/png'
 CHECK(media_type IN ('image/png','image/jpeg','image/webp'));
