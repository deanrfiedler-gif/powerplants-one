-- ADR-0046. 0045 is reserved by the concurrent equipment workflow.
SET CONSTRAINTS ppo.identity_target IMMEDIATE;
DO $$ DECLARE item record; definition text; BEGIN
 FOR item IN SELECT * FROM (VALUES ('business_identities','ck_identities_type'),('audit_events','ck_audit_object_type')) v(tab,con) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid=('ppo.'||item.tab)::regclass AND conname=item.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',item.tab,item.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR object_type IN (''SalesHandover'',''AftercareRecord''))',item.tab,item.con,substring(definition from 8 for length(definition)-8));
 END LOOP;
 SELECT pg_get_functiondef('ppo.identity_has_typed_record()'::regprocedure) INTO definition;
 IF position('CASE NEW.object_type' in definition)=0 THEN RAISE EXCEPTION 'Inspect changed identity dispatch'; END IF;
 EXECUTE replace(definition,'CASE NEW.object_type','CASE NEW.object_type WHEN ''SalesHandover'' THEN ''sales_handovers'' WHEN ''AftercareRecord'' THEN ''sales_aftercare''');
END $$;
SET CONSTRAINTS ppo.identity_target DEFERRED;

CREATE TABLE ppo.sales_handovers (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, organisation_id uuid NOT NULL, site_id uuid,
 opportunity_id uuid NOT NULL, kind text NOT NULL CHECK(kind IN ('Estimating','Won')),
 won_obligation_id uuid, owner_id uuid NOT NULL, receiving_owner_id uuid,
 version integer NOT NULL DEFAULT 1 CHECK(version>0), revision integer NOT NULL DEFAULT 1 CHECK(revision>0),
 state text NOT NULL DEFAULT 'Draft' CHECK(state IN ('Draft','Submitted','ClarificationRequested','ClarificationAnswered','Returned','Accepted')),
 content jsonb NOT NULL CHECK(jsonb_typeof(content)='object'), basis jsonb, source_hash text,
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),created_by uuid NOT NULL,updated_by uuid NOT NULL,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,kind,opportunity_id),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,opportunity_id) REFERENCES ppo.opportunities(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,won_obligation_id) REFERENCES ppo.opportunity_handovers_due(workspace_id,opportunity_id),
 FOREIGN KEY(workspace_id,company_id,organisation_id) REFERENCES ppo.organisations(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id) REFERENCES ppo.sites(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,receiving_owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id), FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id),
 CHECK((kind='Won' AND won_obligation_id IS NOT NULL AND won_obligation_id=opportunity_id) OR (kind='Estimating' AND won_obligation_id IS NULL)),
 CHECK(state='Draft' OR (basis IS NOT NULL AND source_hash IS NOT NULL AND source_hash ~ '^[a-f0-9]{64}$'))
);
CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.sales_handovers FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('SalesHandover','');
CREATE TRIGGER retain_record BEFORE DELETE ON ppo.sales_handovers FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.sales_handover_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF (NEW.id,NEW.workspace_id,NEW.company_id,NEW.organisation_id,NEW.site_id,NEW.opportunity_id,NEW.won_obligation_id,NEW.kind,NEW.created_by,NEW.created_at)
 IS DISTINCT FROM (OLD.id,OLD.workspace_id,OLD.company_id,OLD.organisation_id,OLD.site_id,OLD.opportunity_id,OLD.won_obligation_id,OLD.kind,OLD.created_by,OLD.created_at) THEN RAISE EXCEPTION 'Handover source is permanent' USING ERRCODE='55000'; END IF;
 IF NEW.version<>OLD.version+1 OR NEW.revision NOT IN (OLD.revision,OLD.revision+1) THEN RAISE EXCEPTION 'Advance versions explicitly' USING ERRCODE='23514'; END IF;
 IF OLD.state<>'Draft' AND NEW.revision=OLD.revision AND (NEW.content,NEW.basis,NEW.source_hash,NEW.receiving_owner_id) IS DISTINCT FROM (OLD.content,OLD.basis,OLD.source_hash,OLD.receiving_owner_id) THEN RAISE EXCEPTION 'Submitted revision is immutable' USING ERRCODE='55000'; END IF;
 IF NEW.revision=OLD.revision+1 AND (NEW.state<>'Draft' OR OLD.state NOT IN ('Returned','Accepted')) THEN RAISE EXCEPTION 'Successor requires return or accepted predecessor' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER protect_revision BEFORE UPDATE ON ppo.sales_handovers FOR EACH ROW EXECUTE FUNCTION ppo.sales_handover_guard();

CREATE TABLE ppo.sales_aftercare (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,company_id uuid NOT NULL,organisation_id uuid NOT NULL,site_id uuid NOT NULL,
 source_report_id uuid NOT NULL,owner_id uuid NOT NULL,review_owner_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version>0),revision integer NOT NULL DEFAULT 1 CHECK(revision>0),
 state text NOT NULL DEFAULT 'Open' CHECK(state IN ('Open','ReviewCompleted','Closed')),
 content jsonb NOT NULL CHECK(jsonb_typeof(content)='object'),synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),created_by uuid NOT NULL,updated_by uuid NOT NULL,
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,source_report_id),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,source_report_id) REFERENCES ppo.service_reports(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,organisation_id) REFERENCES ppo.organisations(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id) REFERENCES ppo.sites(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),FOREIGN KEY(workspace_id,review_owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.sales_aftercare FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('AftercareRecord','');
CREATE TRIGGER retain_record BEFORE DELETE ON ppo.sales_aftercare FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.sales_aftercare_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF (NEW.id,NEW.workspace_id,NEW.company_id,NEW.organisation_id,NEW.site_id,NEW.source_report_id,NEW.created_at,NEW.created_by)
 IS DISTINCT FROM (OLD.id,OLD.workspace_id,OLD.company_id,OLD.organisation_id,OLD.site_id,OLD.source_report_id,OLD.created_at,OLD.created_by) THEN RAISE EXCEPTION 'Aftercare source is permanent' USING ERRCODE='55000'; END IF;
 IF NEW.version<>OLD.version+1 OR NEW.revision NOT IN (OLD.revision,OLD.revision+1) THEN RAISE EXCEPTION 'Advance aftercare versions explicitly' USING ERRCODE='23514'; END IF;
 IF OLD.state<>'Open' AND NEW.revision=OLD.revision AND NEW.content->'review' IS DISTINCT FROM OLD.content->'review' THEN RAISE EXCEPTION 'Completed review needs a correction revision' USING ERRCODE='55000'; END IF;
 IF NEW.revision=OLD.revision+1 AND (NEW.state<>'Open' OR OLD.state='Open') THEN RAISE EXCEPTION 'Correction requires a completed review' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER protect_review BEFORE UPDATE ON ppo.sales_aftercare FOR EACH ROW EXECUTE FUNCTION ppo.sales_aftercare_guard();

CREATE TABLE ppo.sales_workflow_events (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,record_id uuid NOT NULL,version integer NOT NULL,revision integer NOT NULL,
 action text NOT NULL,content jsonb NOT NULL,basis jsonb,source_hash text,note text NOT NULL,question_id uuid,follow_up_activity_id uuid,
 recorded_by uuid NOT NULL,recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,record_id,id),UNIQUE(workspace_id,record_id,version),
 FOREIGN KEY(workspace_id,record_id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,follow_up_activity_id) REFERENCES ppo.activities(workspace_id,id),
 FOREIGN KEY(workspace_id,record_id,question_id) REFERENCES ppo.sales_workflow_events(workspace_id,record_id,id),
 FOREIGN KEY(workspace_id,recorded_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER retain_evidence BEFORE UPDATE OR DELETE ON ppo.sales_workflow_events FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE INDEX ON ppo.sales_workflow_events(workspace_id,record_id,revision);
