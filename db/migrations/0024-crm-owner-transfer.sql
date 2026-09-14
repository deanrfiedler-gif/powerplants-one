-- H-01/H-02/H-03 / CRM-02 / #145. Original event rows and receipt hashes stay intact.
CREATE TABLE ppo.opportunity_origins (
 workspace_id uuid NOT NULL, company_id uuid NOT NULL, opportunity_id uuid NOT NULL,
 original_owner_id uuid NOT NULL, source_version integer NOT NULL CHECK(source_version>0),
 captured_at timestamptz NOT NULL, provenance text NOT NULL CHECK(provenance IN ('UpgradeCapture','Creation')),
 PRIMARY KEY(workspace_id,opportunity_id),
 FOREIGN KEY(workspace_id,company_id,opportunity_id) REFERENCES ppo.opportunities(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,original_owner_id) REFERENCES ppo.users(workspace_id,id)
);
INSERT INTO ppo.opportunity_origins SELECT workspace_id,company_id,id,owner_id,version,clock_timestamp(),'UpgradeCapture' FROM ppo.opportunities;
CREATE TRIGGER origin_immutable BEFORE UPDATE OR DELETE ON ppo.opportunity_origins FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.capture_opportunity_origin() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 INSERT INTO ppo.opportunity_origins VALUES(NEW.workspace_id,NEW.company_id,NEW.id,NEW.owner_id,NEW.version,NEW.created_at,'Creation');
 RETURN NULL;
END $$;
CREATE TRIGGER opportunity_origin AFTER INSERT ON ppo.opportunities FOR EACH ROW EXECUTE FUNCTION ppo.capture_opportunity_origin();

CREATE TABLE ppo.opportunity_owner_transfers (
 workspace_id uuid NOT NULL, company_id uuid NOT NULL, opportunity_id uuid NOT NULL, event_id uuid NOT NULL,
 opportunity_version integer NOT NULL CHECK(opportunity_version>1),
 from_owner_id uuid NOT NULL, to_owner_id uuid NOT NULL CHECK(to_owner_id<>from_owner_id),
 next_activity_id uuid NOT NULL, next_activity_version integer NOT NULL CHECK(next_activity_version>0),
 identification_activity_id uuid, identification_activity_version integer,
 PRIMARY KEY(workspace_id,event_id), UNIQUE(workspace_id,opportunity_id,opportunity_version),
 FOREIGN KEY(workspace_id,event_id) REFERENCES ppo.opportunity_events(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,opportunity_id) REFERENCES ppo.opportunities(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,opportunity_id) REFERENCES ppo.opportunity_origins(workspace_id,opportunity_id),
 FOREIGN KEY(workspace_id,from_owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,to_owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,next_activity_id) REFERENCES ppo.activities(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,identification_activity_id) REFERENCES ppo.activities(workspace_id,company_id,id),
 CHECK((identification_activity_id IS NULL AND identification_activity_version IS NULL) OR (identification_activity_id IS NOT NULL AND identification_activity_version IS NOT NULL AND identification_activity_version>0)),
 CHECK(identification_activity_id IS DISTINCT FROM next_activity_id OR identification_activity_version=next_activity_version)
);
CREATE TRIGGER owner_transfer_immutable BEFORE UPDATE OR DELETE ON ppo.opportunity_owner_transfers FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.crm_owner_at(w uuid,o uuid,v integer) RETURNS uuid LANGUAGE sql AS $$
 SELECT coalesce((SELECT to_owner_id FROM ppo.opportunity_owner_transfers WHERE workspace_id=w AND opportunity_id=o AND opportunity_version<=v ORDER BY opportunity_version DESC LIMIT 1),
 (SELECT original_owner_id FROM ppo.opportunity_origins WHERE workspace_id=w AND opportunity_id=o))
$$;
-- The hosted application role cannot UPDATE users/grants, and row locking also
-- requires that privilege. This fixed, data-free function grants only the lock;
-- it cannot change rows, select content, change grants or accept arbitrary SQL.
CREATE FUNCTION ppo.lock_crm_transfer_authority(w uuid) RETURNS void
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,ppo AS $$
BEGIN
 PERFORM 1 FROM ppo.users WHERE workspace_id=w FOR SHARE;
 PERFORM 1 FROM ppo.permission_grants WHERE workspace_id=w FOR SHARE;
 PERFORM 1 FROM ppo.relationships WHERE workspace_id=w FOR SHARE;
 PERFORM 1 FROM ppo.site_parties WHERE workspace_id=w FOR SHARE;
END $$;
DO $$
DECLARE definition text; item record;
BEGIN
 FOR item IN SELECT * FROM (VALUES
  ('permission_grants','ck_grants_capability','capability','crm.opportunity.transfer.own'),
  ('outbox_jobs','ck_outbox_kind','kind','OpportunityOwnerTransferred'),
  ('opportunity_events','opportunity_events_event_type_check','event_type','OpportunityOwnerTransferred'),
  ('opportunity_events','opportunity_events_check','event_type','OpportunityOwnerTransferred')
 ) AS v(tab,con,col,val) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid=('ppo.'||item.tab)::regclass AND conname=item.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',item.tab,item.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR %I=%L)',item.tab,item.con,substring(definition from 8 for length(definition)-8),item.col,item.val);
 END LOOP;
 -- The independent guard below replaces only the owner part of the immutable tuple.
 SELECT pg_get_functiondef('ppo.protect_opportunity()'::regprocedure) INTO definition;
 IF position('NEW.site_unknown_reason,NEW.owner_id,NEW.pipeline_definition_id' in definition)=0 OR position('OLD.site_unknown_reason,OLD.owner_id,OLD.pipeline_definition_id' in definition)=0 THEN
  RAISE EXCEPTION 'Review the current opportunity guard before admitting transfer'; END IF;
 EXECUTE replace(replace(definition,'NEW.site_unknown_reason,NEW.owner_id,NEW.pipeline_definition_id','NEW.site_unknown_reason,NEW.pipeline_definition_id'),'OLD.site_unknown_reason,OLD.owner_id,OLD.pipeline_definition_id','OLD.site_unknown_reason,OLD.pipeline_definition_id');
END $$;
ALTER TABLE ppo.opportunity_events ADD CONSTRAINT crm_transfer_event_shape CHECK(event_type<>'OpportunityOwnerTransferred' OR (opportunity_version>1 AND from_stage IS NOT NULL AND from_stage=to_stage AND record_snapshot IS NOT NULL));

CREATE FUNCTION ppo.protect_crm_owner_transfer() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.owner_id<>OLD.owner_id THEN
  IF NEW.updated_by<>OLD.owner_id OR NEW.version<>OLD.version+1 OR
   (to_jsonb(NEW)-ARRAY['owner_id','version','updated_at','updated_by']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['owner_id','version','updated_at','updated_by']) OR
   NOT EXISTS(SELECT 1 FROM ppo.users WHERE workspace_id=NEW.workspace_id AND id=NEW.owner_id AND active) THEN
   RAISE EXCEPTION 'Transfer changes only owner and one exact version' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER crm_owner_transfer_protected BEFORE UPDATE ON ppo.opportunities FOR EACH ROW EXECUTE FUNCTION ppo.protect_crm_owner_transfer();

CREATE FUNCTION ppo.check_crm_owner_chain() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE e ppo.opportunity_events; x ppo.opportunity_owner_transfers; owner_before uuid;
BEGIN
 IF TG_TABLE_NAME='opportunities' THEN
  SELECT * INTO e FROM ppo.opportunity_events WHERE workspace_id=NEW.workspace_id AND opportunity_id=NEW.id AND opportunity_version=NEW.version;
  IF NEW.owner_id IS DISTINCT FROM ppo.crm_owner_at(NEW.workspace_id,NEW.id,NEW.version) THEN RAISE EXCEPTION 'Exact owner chain required at every version' USING ERRCODE='23514'; END IF;
  IF NEW.owner_id<>OLD.owner_id OR e.event_type='OpportunityOwnerTransferred' THEN
   SELECT * INTO x FROM ppo.opportunity_owner_transfers WHERE workspace_id=NEW.workspace_id AND opportunity_id=NEW.id AND opportunity_version=NEW.version;
   IF e.id IS NULL OR e.event_type<>'OpportunityOwnerTransferred' OR x.event_id IS DISTINCT FROM e.id OR x.from_owner_id IS DISTINCT FROM OLD.owner_id OR x.to_owner_id IS DISTINCT FROM NEW.owner_id
    OR e.created_by<>OLD.owner_id OR e.created_by<>NEW.updated_by OR e.created_at IS DISTINCT FROM NEW.updated_at OR e.record_snapshot IS DISTINCT FROM ppo.crm_record_snapshot(NEW) THEN
    RAISE EXCEPTION 'Exact transfer event required for owner change' USING ERRCODE='23514'; END IF;
  END IF;
  RETURN NULL;
 ELSIF TG_TABLE_NAME='opportunity_events' THEN
  IF NEW.event_type<>'OpportunityOwnerTransferred' THEN RETURN NULL; END IF;
  e:=NEW;
  SELECT * INTO x FROM ppo.opportunity_owner_transfers WHERE workspace_id=e.workspace_id AND event_id=e.id;
 ELSE
  x:=NEW;
  SELECT * INTO e FROM ppo.opportunity_events WHERE workspace_id=x.workspace_id AND id=x.event_id;
 END IF;
 owner_before:=ppo.crm_owner_at(e.workspace_id,e.opportunity_id,e.opportunity_version-1);
 IF e.id IS NULL OR x.event_id IS NULL OR e.event_type<>'OpportunityOwnerTransferred' OR e.company_id<>x.company_id OR e.opportunity_id<>x.opportunity_id OR e.opportunity_version<>x.opportunity_version OR e.created_by<>x.from_owner_id
  OR x.from_owner_id IS DISTINCT FROM owner_before OR e.next_activity_id<>x.next_activity_id OR e.identification_activity_id IS DISTINCT FROM x.identification_activity_id THEN
  RAISE EXCEPTION 'Transfer requires exact original owner, event and Activity comparison' USING ERRCODE='23514'; END IF;
 IF NOT EXISTS(SELECT 1 FROM ppo.activities WHERE workspace_id=x.workspace_id AND id=x.next_activity_id AND version=x.next_activity_version)
 OR (x.identification_activity_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM ppo.activities WHERE workspace_id=x.workspace_id AND id=x.identification_activity_id AND version=x.identification_activity_version)) THEN
  RAISE EXCEPTION 'Transfer must record exact reviewed Activity versions' USING ERRCODE='23514'; END IF;
 IF NOT EXISTS(SELECT 1 FROM ppo.audit_events a WHERE a.workspace_id=e.workspace_id AND a.actor_id=e.created_by AND a.operation_id=e.operation_id AND a.object_type='Opportunity' AND a.object_id=e.opportunity_id AND a.outcome='Accepted' AND a.reason=e.reason AND a.details->>'command'='TransferOpportunityOwner' AND (a.details->>'record_version')::integer=e.opportunity_version)
 OR NOT EXISTS(SELECT 1 FROM ppo.operation_receipts r WHERE r.workspace_id=e.workspace_id AND r.actor_id=e.created_by AND r.operation_id=e.operation_id AND r.record_id=e.opportunity_id AND (r.result->>'record_version')::integer=e.opportunity_version AND r.result->>'state'=e.to_stage)
 OR NOT EXISTS(SELECT 1 FROM ppo.outbox_jobs j WHERE j.workspace_id=e.workspace_id AND j.actor_id=e.created_by AND j.operation_id=e.operation_id AND j.kind='OpportunityOwnerTransferred' AND j.payload=jsonb_build_object('record_id',e.opportunity_id,'record_version',e.opportunity_version,'object_type','Opportunity','synthetic',true)) THEN
  RAISE EXCEPTION 'Transfer requires accepted audit, original receipt and minimal outbox' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER crm_owner_chain AFTER UPDATE ON ppo.opportunities DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_crm_owner_chain();
CREATE CONSTRAINT TRIGGER crm_transfer_event_chain AFTER INSERT ON ppo.opportunity_events DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_crm_owner_chain();
CREATE CONSTRAINT TRIGGER crm_transfer_companion_chain AFTER INSERT ON ppo.opportunity_owner_transfers DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_crm_owner_chain();

-- Moving an already-qualified five-stage deal retains its original qualifying owner.
-- Contact edits and creation still use today's owner and all existing active/link checks.
DO $$
DECLARE definition text;
BEGIN
 SELECT pg_get_functiondef('ppo.check_five_stage_evidence()'::regprocedure) INTO definition;
 IF position('a.owner_id=NEW.owner_id' in definition)=0 THEN RAISE EXCEPTION 'Review current identification guard'; END IF;
 EXECUTE replace(definition,'a.owner_id=NEW.owner_id','a.owner_id=CASE WHEN TG_OP=''UPDATE'' AND NEW.primary_person_id IS NOT DISTINCT FROM OLD.primary_person_id THEN ppo.crm_owner_at(NEW.workspace_id,NEW.id,1) ELSE NEW.owner_id END');
END $$;
