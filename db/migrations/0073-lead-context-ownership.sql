-- CRM-01/02/03/08: retain capture facts; resolve customer context and transfer only owned Leads.
CREATE TABLE ppo.lead_context_resolutions (
 workspace_id uuid NOT NULL, company_id uuid NOT NULL, lead_id uuid NOT NULL,
 event_id uuid NOT NULL, lead_version integer NOT NULL CHECK(lead_version>1),
 organisation_id uuid NOT NULL, site_id uuid, primary_person_id uuid,
 PRIMARY KEY(workspace_id,event_id), UNIQUE(workspace_id,lead_id,lead_version),
 FOREIGN KEY(workspace_id,event_id) REFERENCES ppo.lead_events(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,lead_id) REFERENCES ppo.lead_candidates(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,organisation_id) REFERENCES ppo.organisations(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id) REFERENCES ppo.sites(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,primary_person_id) REFERENCES ppo.person_company_contexts(workspace_id,company_id,person_id)
);
CREATE TABLE ppo.lead_owner_transfers (
 workspace_id uuid NOT NULL, company_id uuid NOT NULL, lead_id uuid NOT NULL,
 event_id uuid NOT NULL, lead_version integer NOT NULL CHECK(lead_version>1),
 from_owner_id uuid NOT NULL, to_owner_id uuid NOT NULL CHECK(to_owner_id<>from_owner_id),
 activity_versions jsonb NOT NULL CHECK(jsonb_typeof(activity_versions)='array'),
 PRIMARY KEY(workspace_id,event_id), UNIQUE(workspace_id,lead_id,lead_version),
 FOREIGN KEY(workspace_id,event_id) REFERENCES ppo.lead_events(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,lead_id) REFERENCES ppo.lead_candidates(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,from_owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,to_owner_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER lead_resolution_retained BEFORE UPDATE OR DELETE ON ppo.lead_context_resolutions FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TRIGGER lead_transfer_retained BEFORE UPDATE OR DELETE ON ppo.lead_owner_transfers FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
DO $$ DECLARE definition text; BEGIN
 SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid='ppo.lead_events'::regclass AND conname='lead_events_event_type_check';
 ALTER TABLE ppo.lead_events DROP CONSTRAINT lead_events_event_type_check;
 EXECUTE format('ALTER TABLE ppo.lead_events ADD CONSTRAINT lead_events_event_type_check CHECK ((%s) OR event_type IN (''ResolveLeadContext'',''TransferLeadOwner''))',substring(definition from 8 for length(definition)-8));
 SELECT pg_get_functiondef('ppo.protect_lead()'::regprocedure) INTO definition;
 IF position('NEW.company_id,NEW.owner_id,NEW.organisation_id' in definition)=0 OR position('OLD.company_id,OLD.owner_id,OLD.organisation_id' in definition)=0 THEN RAISE EXCEPTION 'Review the live Lead guard before admitting owner transfer'; END IF;
 EXECUTE replace(replace(definition,'NEW.company_id,NEW.owner_id,NEW.organisation_id','NEW.company_id,NEW.organisation_id'),'OLD.company_id,OLD.owner_id,OLD.organisation_id','OLD.company_id,OLD.organisation_id');
END $$;

CREATE FUNCTION ppo.protect_lead_owner() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NEW.owner_id<>OLD.owner_id AND (
  OLD.is_archived OR OLD.status IN ('Disqualified','Converted') OR NEW.updated_by<>OLD.owner_id OR
  (to_jsonb(NEW)-ARRAY['owner_id','version','updated_at','updated_by']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['owner_id','version','updated_at','updated_by']) OR
  NOT EXISTS(SELECT 1 FROM ppo.users WHERE workspace_id=NEW.workspace_id AND id=NEW.owner_id AND active)
 ) THEN RAISE EXCEPTION 'Only the current active Lead owner can transfer one exact version' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER lead_owner_guard BEFORE UPDATE ON ppo.lead_candidates FOR EACH ROW EXECUTE FUNCTION ppo.protect_lead_owner();

CREATE FUNCTION ppo.check_lead_amendment() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE e ppo.lead_events; expected jsonb;
BEGIN
 IF TG_TABLE_NAME='lead_events' THEN
  IF (NEW.event_type='ResolveLeadContext' AND NOT EXISTS(SELECT 1 FROM ppo.lead_context_resolutions r WHERE (r.workspace_id,r.event_id)=(NEW.workspace_id,NEW.id)))
   OR (NEW.event_type='TransferLeadOwner' AND NOT EXISTS(SELECT 1 FROM ppo.lead_owner_transfers t WHERE (t.workspace_id,t.event_id)=(NEW.workspace_id,NEW.id)))
  THEN RAISE EXCEPTION 'An amendment event requires its typed companion' USING ERRCODE='23514'; END IF;
  RETURN NULL;
 END IF;
 IF TG_TABLE_NAME='lead_candidates' THEN
  IF NEW.owner_id<>OLD.owner_id AND NOT EXISTS(
   SELECT 1 FROM ppo.lead_owner_transfers t JOIN ppo.lead_events ev ON (ev.workspace_id,ev.id)=(t.workspace_id,t.event_id)
   WHERE t.workspace_id=NEW.workspace_id AND t.lead_id=NEW.id AND t.lead_version=NEW.version
     AND t.from_owner_id=OLD.owner_id AND t.to_owner_id=NEW.owner_id AND ev.event_type='TransferLeadOwner'
     AND ev.created_by=OLD.owner_id AND ev.snapshot=to_jsonb(NEW)
  ) THEN RAISE EXCEPTION 'Exact retained Lead transfer required' USING ERRCODE='23514'; END IF;
  RETURN NULL;
 END IF;
 SELECT * INTO STRICT e FROM ppo.lead_events WHERE workspace_id=NEW.workspace_id AND id=NEW.event_id;
 IF (e.company_id,e.lead_id,e.lead_version) IS DISTINCT FROM (NEW.company_id,NEW.lead_id,NEW.lead_version)
  OR e.snapshot->>'status' NOT IN ('New','Contacting','Nurturing') OR (e.snapshot->>'is_archived')::boolean
  OR NOT EXISTS(SELECT 1 FROM ppo.lead_candidates l WHERE (l.workspace_id,l.id)=(NEW.workspace_id,NEW.lead_id) AND l.version>=NEW.lead_version)
  OR NOT EXISTS(SELECT 1 FROM ppo.lead_events prior WHERE prior.workspace_id=NEW.workspace_id AND prior.lead_id=NEW.lead_id AND prior.lead_version=NEW.lead_version-1
    AND (prior.snapshot-ARRAY['version','updated_at','updated_by','owner_id'])=(e.snapshot-ARRAY['version','updated_at','updated_by','owner_id']))
 THEN RAISE EXCEPTION 'An amendment needs its exact active Lead event' USING ERRCODE='23514'; END IF;
 IF TG_TABLE_NAME='lead_context_resolutions' THEN
  IF e.event_type<>'ResolveLeadContext' OR e.created_by::text<>e.snapshot->>'owner_id'
   OR NOT EXISTS(SELECT 1 FROM ppo.lead_events prior WHERE prior.workspace_id=NEW.workspace_id AND prior.lead_id=NEW.lead_id AND prior.lead_version=NEW.lead_version-1 AND prior.snapshot->>'owner_id'=e.snapshot->>'owner_id')
  THEN RAISE EXCEPTION 'Resolution requires the current Lead owner' USING ERRCODE='23514'; END IF;
 ELSE
  IF e.event_type<>'TransferLeadOwner' OR e.created_by<>NEW.from_owner_id OR e.snapshot->>'owner_id'<>NEW.to_owner_id::text
   OR NOT EXISTS(SELECT 1 FROM ppo.lead_events prior WHERE prior.workspace_id=NEW.workspace_id AND prior.lead_id=NEW.lead_id AND prior.lead_version=NEW.lead_version-1 AND prior.snapshot->>'owner_id'=NEW.from_owner_id::text)
  THEN RAISE EXCEPTION 'Lead ownership must follow the exact retained event chain' USING ERRCODE='23514'; END IF;
  SELECT coalesce(jsonb_agg(jsonb_build_object('id',a.id,'version',a.version) ORDER BY a.id),'[]'::jsonb) INTO expected
   FROM ppo.activities a JOIN ppo.activity_links l ON (l.workspace_id,l.activity_id)=(a.workspace_id,a.id)
   WHERE l.workspace_id=NEW.workspace_id AND l.lead_id=NEW.lead_id;
  IF NEW.activity_versions IS DISTINCT FROM expected THEN RAISE EXCEPTION 'Compare every original Lead activity before transfer' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER lead_owner_evidence AFTER UPDATE ON ppo.lead_candidates DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_lead_amendment();
CREATE CONSTRAINT TRIGGER lead_resolution_evidence AFTER INSERT ON ppo.lead_context_resolutions DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_lead_amendment();
CREATE CONSTRAINT TRIGGER lead_transfer_evidence AFTER INSERT ON ppo.lead_owner_transfers DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_lead_amendment();
CREATE CONSTRAINT TRIGGER lead_amendment_event AFTER INSERT ON ppo.lead_events DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_lead_amendment();
