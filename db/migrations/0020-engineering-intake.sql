-- Engineering r02: synthetic intake and coordination, separate from technical approval/issue.
DO $$
DECLARE item record; definition text;
BEGIN
 FOR item IN SELECT * FROM (VALUES
 ('business_identities','ck_identities_type','object_type','EngineeringPackage,EngineeringEvent'),
 ('audit_events','ck_audit_object_type','object_type','EngineeringPackage'),
 ('outbox_jobs','ck_outbox_kind','kind','EngineeringRequested,EngineeringCoordinated,EngineeringNoteAdded'),
 ('permission_grants','ck_grants_capability','capability','engineering.read,engineering.create,engineering.edit'),
 ('reference_counters','ck_reference_type','record_type','ENG')
 ) AS v(tab,con,col,added) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid=('ppo.'||item.tab)::regclass AND conname=item.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',item.tab,item.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR %I = ANY(%L::text[]))',item.tab,item.con,substring(definition from 8 for length(definition)-8),item.col,string_to_array(item.added,','));
 END LOOP;
 SELECT pg_get_functiondef('ppo.identity_has_typed_record()'::regprocedure) INTO definition;
 IF position('CASE NEW.object_type' in definition)=0 THEN RAISE EXCEPTION 'Inspect changed typed identity dispatch'; END IF;
 EXECUTE replace(definition,'CASE NEW.object_type','CASE NEW.object_type WHEN ''EngineeringPackage'' THEN ''engineering_packages'' WHEN ''EngineeringEvent'' THEN ''engineering_events''');
END $$;
CREATE TABLE ppo.engineering_packages (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, display_number text NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version>0), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 title text NOT NULL CHECK(length(btrim(title)) BETWEEN 1 AND 200), brief text NOT NULL CHECK(length(btrim(brief)) BETWEEN 1 AND 4000),
 organisation_id uuid NOT NULL, site_id uuid, project_id uuid, opportunity_id uuid, owner_id uuid NOT NULL,
 discipline text NOT NULL CHECK(discipline IN ('Mechanical','Layout','Hydraulics','Electrical','Automation','Controls')),
 state text NOT NULL DEFAULT 'Queued' CHECK(state IN ('Queued','In design','Awaiting information')),
 required_date date CHECK(required_date BETWEEN DATE '0001-01-01' AND DATE '9998-12-31'),
 next_action text NOT NULL CHECK(length(btrim(next_action)) BETWEEN 1 AND 300),
 action_due date CHECK(action_due BETWEEN DATE '0001-01-01' AND DATE '9998-12-31'),
 blocker text CHECK(length(btrim(blocker)) BETWEEN 1 AND 2000),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id), UNIQUE(workspace_id,display_number),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,organisation_id) REFERENCES ppo.organisations(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id) REFERENCES ppo.sites(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,project_id) REFERENCES ppo.projects(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,opportunity_id) REFERENCES ppo.opportunities(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id),
 CHECK(num_nonnulls(project_id,opportunity_id)=1), CHECK((state='Awaiting information')=(blocker IS NOT NULL)),
 CHECK(isfinite(created_at) AND isfinite(updated_at))
);
CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.engineering_packages FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('EngineeringPackage','ENG');
CREATE TRIGGER package_retained BEFORE DELETE ON ppo.engineering_packages FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.engineering_events (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, package_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version=1), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 operation_id uuid NOT NULL, package_version integer NOT NULL CHECK(package_version>0),
 event_type text NOT NULL CHECK(event_type IN ('EngineeringRequested','EngineeringCoordinated','EngineeringNoteAdded')),
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),
 note text CHECK(length(btrim(note)) BETWEEN 1 AND 1500), package_snapshot jsonb NOT NULL,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,package_id,package_version), UNIQUE(workspace_id,created_by,operation_id),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,package_id) REFERENCES ppo.engineering_packages(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id),
 CHECK((event_type='EngineeringRequested')=(package_version=1)),
 CHECK((event_type='EngineeringNoteAdded')=(note IS NOT NULL))
);
CREATE TRIGGER register_identity BEFORE INSERT ON ppo.engineering_events FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('EngineeringEvent','');
CREATE TRIGGER event_immutable BEFORE UPDATE OR DELETE ON ppo.engineering_events FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.protect_engineering_package() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE context_record record;
BEGIN
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 IF TG_OP='INSERT' THEN
  IF NEW.version<>1 OR NEW.state<>'Queued' THEN RAISE EXCEPTION 'New engineering requests enter the queue' USING ERRCODE='23514'; END IF;
 ELSIF NEW.version<>OLD.version+1 OR (NEW.company_id,NEW.organisation_id,NEW.site_id,NEW.project_id,NEW.opportunity_id,NEW.title,NEW.brief,NEW.discipline) IS DISTINCT FROM (OLD.company_id,OLD.organisation_id,OLD.site_id,OLD.project_id,OLD.opportunity_id,OLD.title,OLD.brief,OLD.discipline) THEN
  RAISE EXCEPTION 'Retain engineering context and advance its version' USING ERRCODE='55000';
 END IF;
 IF NEW.project_id IS NOT NULL THEN SELECT company_id,organisation_id,site_id INTO STRICT context_record FROM ppo.projects WHERE workspace_id=NEW.workspace_id AND id=NEW.project_id;
 ELSE SELECT company_id,organisation_id,site_id INTO STRICT context_record FROM ppo.opportunities WHERE workspace_id=NEW.workspace_id AND id=NEW.opportunity_id; END IF;
 IF (NEW.company_id,NEW.organisation_id,NEW.site_id) IS DISTINCT FROM (context_record.company_id,context_record.organisation_id,context_record.site_id) OR NOT EXISTS(SELECT 1 FROM ppo.users WHERE workspace_id=NEW.workspace_id AND id=NEW.owner_id AND active) THEN RAISE EXCEPTION 'Current linked context and active owner required' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER package_guards BEFORE INSERT OR UPDATE ON ppo.engineering_packages FOR EACH ROW EXECUTE FUNCTION ppo.protect_engineering_package();
CREATE FUNCTION ppo.check_engineering_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE e ppo.engineering_events; p ppo.engineering_packages;
BEGIN
 IF TG_TABLE_NAME='engineering_packages' THEN
  SELECT * INTO e FROM ppo.engineering_events WHERE workspace_id=NEW.workspace_id AND package_id=NEW.id AND package_version=NEW.version;
  IF e.id IS NULL OR e.package_snapshot<>to_jsonb(NEW) OR e.created_by<>NEW.updated_by THEN RAISE EXCEPTION 'Exact engineering event required' USING ERRCODE='23514'; END IF;
 ELSE
  SELECT * INTO STRICT p FROM ppo.engineering_packages WHERE workspace_id=NEW.workspace_id AND id=NEW.package_id;
  IF NEW.package_version>p.version OR (NEW.package_version>1 AND NOT EXISTS(SELECT 1 FROM ppo.engineering_events WHERE workspace_id=NEW.workspace_id AND package_id=NEW.package_id AND package_version=NEW.package_version-1)) THEN RAISE EXCEPTION 'Preceding engineering version required' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER package_evidence AFTER INSERT OR UPDATE ON ppo.engineering_packages DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_engineering_evidence();
CREATE CONSTRAINT TRIGGER event_chain AFTER INSERT ON ppo.engineering_events DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_engineering_evidence();
CREATE INDEX ix_engineering_scope ON ppo.engineering_packages(workspace_id,company_id,site_id,id);
