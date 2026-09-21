-- PJ-09 / PRJ-06 / PRJ-08. Additive acceptance subdomain; see ADR-0033.
SET CONSTRAINTS ppo.identity_target IMMEDIATE;
DO $$ DECLARE item record; definition text; BEGIN
 FOR item IN SELECT * FROM (VALUES
 ('business_identities','ck_identities_type','object_type','AcceptanceStage'),
 ('audit_events','ck_audit_object_type','object_type','AcceptanceStage'),
 ('outbox_jobs','ck_outbox_kind','kind','AcceptanceChanged,AcceptanceIssued,AcceptanceClosed'),
 ('permission_grants','ck_grants_capability','capability','acceptance.scope,acceptance.submit,acceptance.technical,acceptance.prepare,acceptance.issue,acceptance.response.record,acceptance.response.validate,acceptance.receive,acceptance.commercial,acceptance.close.stage,acceptance.close.project,acceptance.reopen,acceptance.source'),
 ('activity_links','activity_links_object_type_check','object_type','Project')
 ) AS v(tab,con,col,added) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid=('ppo.'||item.tab)::regclass AND conname=item.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',item.tab,item.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR %I = ANY(%L::text[]))',item.tab,item.con,substring(definition from 8 for length(definition)-8),item.col,string_to_array(item.added,','));
 END LOOP;
 SELECT pg_get_functiondef('ppo.identity_has_typed_record()'::regprocedure) INTO definition;
 IF position('CASE NEW.object_type' in definition)=0 THEN RAISE EXCEPTION 'Inspect changed identity dispatch'; END IF;
 EXECUTE replace(definition,'CASE NEW.object_type','CASE NEW.object_type WHEN ''AcceptanceStage'' THEN ''acceptance_stages''');
END $$;
SET CONSTRAINTS ppo.identity_target DEFERRED;

ALTER TABLE ppo.projects ADD COLUMN lifecycle text NOT NULL DEFAULT 'Active' CHECK(lifecycle IN ('Active','Closed'));
ALTER TABLE ppo.projects ADD COLUMN acceptance_version integer NOT NULL DEFAULT 1 CHECK(acceptance_version>0);
ALTER TABLE ppo.activity_links ADD COLUMN project_id uuid GENERATED ALWAYS AS (CASE WHEN object_type='Project' THEN object_id END) STORED;
ALTER TABLE ppo.activity_links ADD CONSTRAINT fk_activity_project FOREIGN KEY(workspace_id,company_id,project_id) REFERENCES ppo.projects(workspace_id,company_id,id);
CREATE FUNCTION ppo.acceptance_activity_context() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NEW.project_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM ppo.projects p JOIN ppo.activities a ON a.workspace_id=p.workspace_id AND a.company_id=p.company_id AND a.site_id=p.site_id WHERE p.workspace_id=NEW.workspace_id AND p.id=NEW.project_id AND a.id=NEW.activity_id) THEN
  RAISE EXCEPTION 'Project activity must have the exact project site' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER acceptance_activity_context AFTER INSERT OR UPDATE ON ppo.activity_links DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.acceptance_activity_context();

CREATE TABLE ppo.acceptance_units (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, project_id uuid NOT NULL,
 reference text NOT NULL, title text NOT NULL CHECK(length(title) BETWEEN 1 AND 200), facility_id uuid, asset_id uuid,
 system_name text NOT NULL, function_name text NOT NULL, installed_at text NOT NULL, served_areas text[] NOT NULL DEFAULT '{}', configuration_version text NOT NULL,
 required boolean NOT NULL DEFAULT true, removal_reference text, removal_reason text,
 created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,project_id,id), UNIQUE(workspace_id,project_id,reference),
 CHECK(required OR (length(removal_reference)>0 AND length(removal_reason)>0)),
 FOREIGN KEY(workspace_id,company_id,project_id) REFERENCES ppo.projects(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,facility_id) REFERENCES ppo.facilities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,asset_id) REFERENCES ppo.assets(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.acceptance_stages (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, project_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version>0), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 reference text NOT NULL, title text NOT NULL CHECK(length(btrim(title)) BETWEEN 1 AND 200), owner_id uuid NOT NULL,
 revision integer NOT NULL DEFAULT 1 CHECK(revision>0), state text NOT NULL DEFAULT 'Draft' CHECK(state IN ('Draft','In review','Returned')),
 closeout text NOT NULL DEFAULT 'Open' CHECK(closeout IN ('Open','Closed','Reopened')), reassessment boolean NOT NULL DEFAULT false,
 due date, due_basis text, created_by uuid NOT NULL, updated_by uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id), UNIQUE(workspace_id,project_id,id), UNIQUE(workspace_id,project_id,reference),
 CHECK(due IS NULL OR length(due_basis)>0),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,project_id) REFERENCES ppo.projects(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id), FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.acceptance_stages FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('AcceptanceStage','');
CREATE INDEX acceptance_register ON ppo.acceptance_stages(workspace_id,project_id,due,id);
CREATE TABLE ppo.acceptance_stage_units (
 workspace_id uuid NOT NULL, project_id uuid NOT NULL, stage_id uuid NOT NULL, revision integer NOT NULL CHECK(revision>0), unit_id uuid NOT NULL,
 disposition text NOT NULL CHECK(disposition IN ('Included','Excluded')), reason text NOT NULL, relationship text,
 PRIMARY KEY(workspace_id,stage_id,revision,unit_id),
 FOREIGN KEY(workspace_id,project_id,stage_id) REFERENCES ppo.acceptance_stages(workspace_id,project_id,id),
 FOREIGN KEY(workspace_id,project_id,unit_id) REFERENCES ppo.acceptance_units(workspace_id,project_id,id)
);
CREATE TABLE ppo.acceptance_sources (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, project_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version>0), adapter text NOT NULL CHECK(adapter IN ('EN08','SyntheticAcceptanceSource')),
 commissioning_id uuid, scope_key text, title text NOT NULL, kind text NOT NULL CHECK(kind IN ('Technical','Training','Manual','Backup','Warranty','Commercial','Hold')),
 outcome text NOT NULL CHECK(outcome IN ('Satisfied','Outstanding','Blocked','Cannot assess','Not required')),
 availability text NOT NULL CHECK(availability IN ('Current','Changed','Unavailable','Restricted','Not checked')),
 details jsonb NOT NULL DEFAULT '{}', public_reference text NOT NULL, source_version text NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 UNIQUE(workspace_id,project_id,id), UNIQUE(workspace_id,id),
 CHECK((adapter='EN08')=(commissioning_id IS NOT NULL)),
 FOREIGN KEY(workspace_id,company_id,project_id) REFERENCES ppo.projects(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,commissioning_id) REFERENCES ppo.commissioning_packages(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
-- A shared source applies to every served unit; excluding its installed location cannot remove it.
CREATE TABLE ppo.acceptance_requirements (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, project_id uuid NOT NULL, unit_id uuid NOT NULL, source_id uuid NOT NULL,
 title text NOT NULL, gate text NOT NULL CHECK(gate IN ('Technical','Handover','Closeout','Commercial')),
 mandatory boolean NOT NULL DEFAULT true, owner_id uuid NOT NULL, due date, due_basis text, applicability_reference text,
 UNIQUE(workspace_id,project_id,id), UNIQUE(workspace_id,unit_id,source_id,gate),
 FOREIGN KEY(workspace_id,project_id,unit_id) REFERENCES ppo.acceptance_units(workspace_id,project_id,id),
 FOREIGN KEY(workspace_id,project_id,source_id) REFERENCES ppo.acceptance_sources(workspace_id,project_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.acceptance_revisions (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, project_id uuid NOT NULL, stage_id uuid NOT NULL, revision integer NOT NULL,
 predecessor_id uuid, snapshot jsonb NOT NULL, content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'),
 reason text NOT NULL, submitted_by uuid NOT NULL, submitted_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,stage_id,revision), UNIQUE(workspace_id,project_id,id),
 FOREIGN KEY(workspace_id,project_id,stage_id) REFERENCES ppo.acceptance_stages(workspace_id,project_id,id),
 FOREIGN KEY(workspace_id,project_id,predecessor_id) REFERENCES ppo.acceptance_revisions(workspace_id,project_id,id),
 FOREIGN KEY(workspace_id,submitted_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.acceptance_obligations (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, project_id uuid NOT NULL, stage_id uuid NOT NULL, unit_id uuid NOT NULL, source_id uuid,
 version integer NOT NULL DEFAULT 1 CHECK(version>0), title text NOT NULL, owner_id uuid NOT NULL, recipient_id uuid NOT NULL,
 due date, due_basis text NOT NULL, completion_evidence text, required_evidence text NOT NULL, control_reference text NOT NULL,
 eligible boolean NOT NULL DEFAULT false, conditions text NOT NULL, review_rule text NOT NULL,
 state text NOT NULL DEFAULT 'Outstanding' CHECK(state IN ('Outstanding','Completed')), activity_id uuid NOT NULL,
 created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,project_id,id), UNIQUE(workspace_id,id),
 CHECK(state<>'Completed' OR length(completion_evidence)>0),
 FOREIGN KEY(workspace_id,project_id,stage_id) REFERENCES ppo.acceptance_stages(workspace_id,project_id,id),
 FOREIGN KEY(workspace_id,project_id,unit_id) REFERENCES ppo.acceptance_units(workspace_id,project_id,id),
 FOREIGN KEY(workspace_id,project_id,source_id) REFERENCES ppo.acceptance_sources(workspace_id,project_id,id),
 FOREIGN KEY(workspace_id,activity_id) REFERENCES ppo.activities(workspace_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id), FOREIGN KEY(workspace_id,recipient_id) REFERENCES ppo.users(workspace_id,id), FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.acceptance_manifests (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, project_id uuid NOT NULL, stage_id uuid NOT NULL, revision integer NOT NULL,
 audience text NOT NULL CHECK(audience IN ('Customer','Service')), recipient_id uuid NOT NULL, purpose text NOT NULL,
 manifest jsonb NOT NULL, content_hash text NOT NULL, facts_hash text NOT NULL, template_version text NOT NULL,
 prepared jsonb NOT NULL, prepared_by uuid NOT NULL, prepared_at timestamptz NOT NULL,
 UNIQUE(workspace_id,project_id,id), UNIQUE(workspace_id,id),
 FOREIGN KEY(workspace_id,project_id,stage_id) REFERENCES ppo.acceptance_stages(workspace_id,project_id,id),
 FOREIGN KEY(workspace_id,stage_id,revision) REFERENCES ppo.acceptance_revisions(workspace_id,stage_id,revision),
 FOREIGN KEY(workspace_id,prepared_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.acceptance_issues (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, project_id uuid NOT NULL, manifest_id uuid NOT NULL, issued_by uuid NOT NULL, issued_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,project_id,id), UNIQUE(workspace_id,manifest_id),
 FOREIGN KEY(workspace_id,project_id,manifest_id) REFERENCES ppo.acceptance_manifests(workspace_id,project_id,id), FOREIGN KEY(workspace_id,issued_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.acceptance_requests (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, project_id uuid NOT NULL, issue_id uuid NOT NULL, sender_id uuid NOT NULL,
 transport text NOT NULL DEFAULT 'Submitted locally' CHECK(transport IN ('Submitted locally','Unavailable','Outcome unknown')),
 requested_due date, created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,project_id,id), UNIQUE(workspace_id,issue_id),
 FOREIGN KEY(workspace_id,project_id,issue_id) REFERENCES ppo.acceptance_issues(workspace_id,project_id,id), FOREIGN KEY(workspace_id,sender_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.acceptance_responses (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, project_id uuid NOT NULL, request_id uuid NOT NULL,
 respondent_id uuid NOT NULL, authority_basis text NOT NULL, method text NOT NULL, evidence text NOT NULL, outcome text NOT NULL CHECK(outcome IN ('Accepted','With conditions','Reservations','Declined','Disputed','Returned','Received')),
 response_time text, time_precision text NOT NULL CHECK(time_precision IN ('Instant','Date','Unknown')), conditions text NOT NULL DEFAULT '',
 recorded_by uuid NOT NULL, recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(), correction_of uuid,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,project_id,id),
 FOREIGN KEY(workspace_id,project_id,request_id) REFERENCES ppo.acceptance_requests(workspace_id,project_id,id), FOREIGN KEY(workspace_id,recorded_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,project_id,correction_of) REFERENCES ppo.acceptance_responses(workspace_id,project_id,id)
);
CREATE TABLE ppo.acceptance_response_units (
 workspace_id uuid NOT NULL, project_id uuid NOT NULL, response_id uuid NOT NULL, unit_id uuid NOT NULL,
 PRIMARY KEY(workspace_id,response_id,unit_id),
 FOREIGN KEY(workspace_id,project_id,response_id) REFERENCES ppo.acceptance_responses(workspace_id,project_id,id), FOREIGN KEY(workspace_id,project_id,unit_id) REFERENCES ppo.acceptance_units(workspace_id,project_id,id)
);
CREATE TABLE ppo.acceptance_decisions (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, project_id uuid NOT NULL, stage_id uuid, revision integer,
 kind text NOT NULL CHECK(kind IN ('Technical','Customer','Service','Commercial','Stage closeout','Project closeout','Reopen','Amendment','Transfer','Source completion')),
 outcome text NOT NULL, subject_id uuid, facts_hash text NOT NULL, snapshot jsonb NOT NULL, reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 4000), policy_version text NOT NULL DEFAULT 'synthetic-pj09-v1',
 actor_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(), operation_id uuid NOT NULL,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,actor_id,operation_id,kind),
 FOREIGN KEY(workspace_id,project_id) REFERENCES ppo.projects(workspace_id,id), FOREIGN KEY(workspace_id,project_id,stage_id) REFERENCES ppo.acceptance_stages(workspace_id,project_id,id), FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.acceptance_events (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, project_id uuid NOT NULL, stage_id uuid, kind text NOT NULL, subject_id uuid,
 snapshot jsonb NOT NULL, reason text NOT NULL, actor_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(), operation_id uuid NOT NULL,
 UNIQUE(workspace_id,id),
 FOREIGN KEY(workspace_id,project_id) REFERENCES ppo.projects(workspace_id,id), FOREIGN KEY(workspace_id,project_id,stage_id) REFERENCES ppo.acceptance_stages(workspace_id,project_id,id), FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE INDEX acceptance_history ON ppo.acceptance_events(workspace_id,project_id,created_at DESC,id);
CREATE TABLE ppo.acceptance_followups (
 workspace_id uuid NOT NULL, project_id uuid NOT NULL, stage_id uuid NOT NULL, cause text NOT NULL, activity_id uuid NOT NULL,
 PRIMARY KEY(workspace_id,stage_id,cause), FOREIGN KEY(workspace_id,project_id,stage_id) REFERENCES ppo.acceptance_stages(workspace_id,project_id,id), FOREIGN KEY(workspace_id,activity_id) REFERENCES ppo.activities(workspace_id,id)
);
CREATE TABLE ppo.acceptance_checks (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, project_id uuid NOT NULL, stage_id uuid NOT NULL, facts_hash text NOT NULL, result text NOT NULL,
 checked_by uuid NOT NULL, checked_at timestamptz NOT NULL DEFAULT clock_timestamp(), snapshot jsonb NOT NULL,
 FOREIGN KEY(workspace_id,project_id,stage_id) REFERENCES ppo.acceptance_stages(workspace_id,project_id,id), FOREIGN KEY(workspace_id,checked_by) REFERENCES ppo.users(workspace_id,id)
);
DO $$ DECLARE tab text; BEGIN
 FOREACH tab IN ARRAY ARRAY['acceptance_units','acceptance_stage_units','acceptance_revisions','acceptance_manifests','acceptance_issues','acceptance_requests','acceptance_responses','acceptance_response_units','acceptance_decisions','acceptance_events','acceptance_checks','acceptance_followups'] LOOP
  EXECUTE format('CREATE TRIGGER retained_evidence BEFORE UPDATE OR DELETE ON ppo.%I FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence()',tab);
 END LOOP;
END $$;
CREATE FUNCTION ppo.acceptance_stage_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF (NEW.workspace_id,NEW.company_id,NEW.project_id,NEW.reference) IS DISTINCT FROM (OLD.workspace_id,OLD.company_id,OLD.project_id,OLD.reference) OR NEW.version<>OLD.version+1 THEN
  RAISE EXCEPTION 'Preserve acceptance identity and advance version' USING ERRCODE='55000'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER acceptance_stage_guard BEFORE UPDATE ON ppo.acceptance_stages FOR EACH ROW EXECUTE FUNCTION ppo.acceptance_stage_guard();
-- Existing schedules still use their original namespaces/receipts. Current closed-basis writes are refused.
CREATE FUNCTION ppo.acceptance_schedule_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF EXISTS(SELECT 1 FROM ppo.projects WHERE workspace_id=NEW.workspace_id AND id=NEW.project_id AND lifecycle='Closed') THEN
  RAISE EXCEPTION 'Reopen the closed project before changing its schedule' USING ERRCODE='55000'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER acceptance_schedule_guard BEFORE INSERT OR UPDATE ON ppo.project_tasks FOR EACH ROW EXECUTE FUNCTION ppo.acceptance_schedule_guard();
