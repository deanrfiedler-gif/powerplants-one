-- SV-08 / PPO-SV08-NATIVE-DEC. Synthetic records only; correspondence sends nothing.
-- Drain the identity events left by 0026 before altering its registry.
SET CONSTRAINTS ppo.identity_target IMMEDIATE;
DO $$ DECLARE spec record; definition text; BEGIN
 FOR spec IN SELECT * FROM (VALUES
  ('business_identities','ck_identities_type','object_type','EscalationCase'),
  ('permission_grants','ck_grants_capability','capability','service_escalation.record'),
  ('audit_events','ck_audit_object_type','object_type','EscalationCase'),
  ('outbox_jobs','ck_outbox_kind','kind','EscalationCaseChanged'),
  ('reference_counters','ck_reference_type','record_type','ESC')
 ) v(tab,con,col,added) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid=('ppo.'||spec.tab)::regclass AND conname=spec.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',spec.tab,spec.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR %I = ANY(%L::text[]))',spec.tab,spec.con,substring(definition from 8 for length(definition)-8),spec.col,string_to_array(spec.added,','));
 END LOOP;
 SELECT pg_get_functiondef('ppo.identity_has_typed_record()'::regprocedure) INTO definition;
 IF position('CASE NEW.object_type' in definition)=0 THEN RAISE EXCEPTION 'Inspect changed identity dispatch'; END IF;
 EXECUTE replace(definition,'CASE NEW.object_type','CASE NEW.object_type WHEN ''EscalationCase'' THEN ''service_escalation_cases''');
END $$;
SET CONSTRAINTS ppo.identity_target DEFERRED;

-- Routes belong to existing equipment manufacturers; no directory is invented.
CREATE TABLE ppo.equipment_support_routes (
 workspace_id uuid NOT NULL, asset_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version>0),
 manufacturer text NOT NULL CHECK(length(btrim(manufacturer)) BETWEEN 1 AND 200),
 method text NOT NULL CHECK(method IN ('Email','Portal')), recipient text NOT NULL CHECK(length(btrim(recipient)) BETWEEN 1 AND 500),
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic), PRIMARY KEY(workspace_id,asset_id),
 FOREIGN KEY(workspace_id,asset_id) REFERENCES ppo.assets(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.service_escalation_cases (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, site_id uuid NOT NULL, asset_id uuid NOT NULL,
 display_number text NOT NULL CHECK(display_number ~ '^SYN-ESC-[0-9]{6,}$'),
 finding_key text NOT NULL CHECK(finding_key ~ '^(inspection|incident|completion|response|schedule):[0-9a-f-]{36}$'),
 owner_id uuid NOT NULL, fault text NOT NULL CHECK(length(btrim(fault)) BETWEEN 1 AND 200), fault_type text NOT NULL CHECK(length(btrim(fault_type)) BETWEEN 1 AND 100),
 state text NOT NULL DEFAULT 'Diagnosing' CHECK(state IN ('Diagnosing','WaitingOnManufacturer','ReplyToActOn','Closed','Withdrawn')),
 version integer NOT NULL DEFAULT 1 CHECK(version>0), content_version integer NOT NULL DEFAULT 1 CHECK(content_version>0),
 current_configuration_id uuid, latest_pack_id uuid, reviewed_pack_id uuid, last_sent_id uuid, last_reply_id uuid,
 chase_activity_id uuid, next_action_id uuid, next_action_reply_id uuid, outcome text,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic), UNIQUE(workspace_id,id),
 CHECK(state NOT IN ('Closed','Withdrawn') OR (outcome IS NOT NULL AND length(btrim(outcome)) BETWEEN 1 AND 4000)),
 CHECK(state<>'WaitingOnManufacturer' OR (last_sent_id IS NOT NULL AND chase_activity_id IS NOT NULL)),
 CHECK(state NOT IN ('ReplyToActOn','Closed') OR last_reply_id IS NOT NULL),
 CHECK(state<>'Closed' OR (next_action_id IS NOT NULL AND next_action_reply_id IS NOT NULL AND next_action_reply_id=last_reply_id)),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id),
 FOREIGN KEY(workspace_id,site_id) REFERENCES ppo.sites(workspace_id,id),
 FOREIGN KEY(workspace_id,asset_id) REFERENCES ppo.assets(workspace_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,chase_activity_id) REFERENCES ppo.activities(workspace_id,id),
 FOREIGN KEY(workspace_id,next_action_id) REFERENCES ppo.activities(workspace_id,id)
);
CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.service_escalation_cases FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('EscalationCase','ESC');
CREATE INDEX service_escalations_register ON ppo.service_escalation_cases(workspace_id,state,updated_at DESC,id);
CREATE INDEX service_escalations_finding ON ppo.service_escalation_cases(workspace_id,finding_key);
CREATE TABLE ppo.service_escalation_events (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, case_id uuid NOT NULL,
 kind text NOT NULL CHECK(kind IN ('Diagnostic','Sent','Reply','FollowUp','NextAction','Closed','Withdrawn')),
 occurred_at timestamptz NOT NULL CHECK(isfinite(occurred_at)), details jsonb NOT NULL CHECK(jsonb_typeof(details)='object'),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic), UNIQUE(workspace_id,case_id,id),
 FOREIGN KEY(workspace_id,case_id) REFERENCES ppo.service_escalation_cases(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.service_escalation_configurations (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, case_id uuid NOT NULL, source_id uuid NOT NULL,
 revision integer NOT NULL CHECK(revision>0), description text NOT NULL, sha256 text NOT NULL CHECK(sha256 ~ '^[a-f0-9]{64}$'),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic), UNIQUE(workspace_id,case_id,id),
 FOREIGN KEY(workspace_id,case_id) REFERENCES ppo.service_escalation_cases(workspace_id,id),
 FOREIGN KEY(workspace_id,source_id) REFERENCES ppo.asset_configurations(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.service_escalation_files (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, case_id uuid NOT NULL, reply_id uuid,
 kind text NOT NULL CHECK(kind IN ('Photo','ReplyAttachment')),
 media_type text NOT NULL CHECK(media_type IN ('image/png','image/jpeg','application/pdf')),
 content bytea NOT NULL CHECK(octet_length(content) BETWEEN 1 AND 2097152), sha256 text NOT NULL CHECK(sha256 ~ '^[a-f0-9]{64}$'),
 confirmed_exclusions boolean NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic), UNIQUE(workspace_id,case_id,id),
 CHECK((kind='Photo' AND reply_id IS NULL AND confirmed_exclusions AND media_type<>'application/pdf') OR (kind='ReplyAttachment' AND reply_id IS NOT NULL)),
 FOREIGN KEY(workspace_id,case_id) REFERENCES ppo.service_escalation_cases(workspace_id,id),
 FOREIGN KEY(workspace_id,case_id,reply_id) REFERENCES ppo.service_escalation_events(workspace_id,case_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.service_escalation_packs (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, case_id uuid NOT NULL, revision integer NOT NULL CHECK(revision>0), content_version integer NOT NULL CHECK(content_version>0),
 evidence jsonb NOT NULL CHECK(jsonb_typeof(evidence)='object'), evidence_sha256 text NOT NULL CHECK(evidence_sha256 ~ '^[a-f0-9]{64}$'),
 html text NOT NULL, html_sha256 text NOT NULL CHECK(html_sha256 ~ '^[a-f0-9]{64}$'),
 pdf bytea NOT NULL, pdf_sha256 text NOT NULL CHECK(pdf_sha256 ~ '^[a-f0-9]{64}$'), renderer_version text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic), UNIQUE(workspace_id,case_id,id), UNIQUE(workspace_id,case_id,revision),
 FOREIGN KEY(workspace_id,case_id) REFERENCES ppo.service_escalation_cases(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.service_escalation_pack_reviews (
 workspace_id uuid NOT NULL, case_id uuid NOT NULL, pack_id uuid NOT NULL,
 html_sha256 text NOT NULL CHECK(html_sha256 ~ '^[a-f0-9]{64}$'), pdf_sha256 text NOT NULL CHECK(pdf_sha256 ~ '^[a-f0-9]{64}$'),
 confirmed_exclusions boolean NOT NULL CHECK(confirmed_exclusions), reviewed_at timestamptz NOT NULL DEFAULT clock_timestamp(), reviewed_by uuid NOT NULL,
 PRIMARY KEY(workspace_id,case_id,pack_id),
 FOREIGN KEY(workspace_id,case_id,pack_id) REFERENCES ppo.service_escalation_packs(workspace_id,case_id,id),
 FOREIGN KEY(workspace_id,reviewed_by) REFERENCES ppo.users(workspace_id,id)
);
ALTER TABLE ppo.service_escalation_cases
 ADD FOREIGN KEY(workspace_id,id,current_configuration_id) REFERENCES ppo.service_escalation_configurations(workspace_id,case_id,id),
 ADD FOREIGN KEY(workspace_id,id,latest_pack_id) REFERENCES ppo.service_escalation_packs(workspace_id,case_id,id),
 ADD FOREIGN KEY(workspace_id,id,reviewed_pack_id) REFERENCES ppo.service_escalation_pack_reviews(workspace_id,case_id,pack_id),
 ADD FOREIGN KEY(workspace_id,id,last_sent_id) REFERENCES ppo.service_escalation_events(workspace_id,case_id,id),
 ADD FOREIGN KEY(workspace_id,id,last_reply_id) REFERENCES ppo.service_escalation_events(workspace_id,case_id,id),
 ADD FOREIGN KEY(workspace_id,id,next_action_reply_id) REFERENCES ppo.service_escalation_events(workspace_id,case_id,id);
DO $$ DECLARE tab text; BEGIN
 FOREACH tab IN ARRAY ARRAY['service_escalation_events','service_escalation_configurations','service_escalation_files','service_escalation_packs','service_escalation_pack_reviews'] LOOP
  EXECUTE format('CREATE TRIGGER retain_evidence BEFORE UPDATE OR DELETE ON ppo.%I FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence()',tab);
 END LOOP;
END $$;
CREATE FUNCTION ppo.service_escalation_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Case history is retained' USING ERRCODE='55000'; END IF;
 IF NOT EXISTS(SELECT 1 FROM ppo.assets a WHERE (a.workspace_id,a.id,a.company_id,a.site_id)=(NEW.workspace_id,NEW.asset_id,NEW.company_id,NEW.site_id)) THEN RAISE EXCEPTION 'Case equipment context mismatch' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' THEN
  IF (NEW.company_id,NEW.site_id,NEW.asset_id,NEW.finding_key,NEW.fault,NEW.fault_type,NEW.owner_id) IS DISTINCT FROM (OLD.company_id,OLD.site_id,OLD.asset_id,OLD.finding_key,OLD.fault,OLD.fault_type,OLD.owner_id) OR OLD.state IN ('Closed','Withdrawn') OR NEW.version<>OLD.version+1 THEN RAISE EXCEPTION 'Case context and terminal history are retained' USING ERRCODE='55000'; END IF;
  IF NEW.state<>OLD.state AND NOT (NEW.state='Withdrawn' OR (OLD.state='Diagnosing' AND NEW.state='WaitingOnManufacturer') OR (OLD.state='WaitingOnManufacturer' AND NEW.state='ReplyToActOn') OR (OLD.state='ReplyToActOn' AND NEW.state IN ('Diagnosing','Closed'))) THEN RAISE EXCEPTION 'Invalid case transition' USING ERRCODE='23514'; END IF;
 END IF;
 IF NEW.reviewed_pack_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM ppo.service_escalation_packs p WHERE (p.workspace_id,p.case_id,p.id,p.content_version)=(NEW.workspace_id,NEW.id,NEW.reviewed_pack_id,NEW.content_version)) THEN RAISE EXCEPTION 'Evidence changed after review' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER case_integrity BEFORE INSERT OR UPDATE OR DELETE ON ppo.service_escalation_cases FOR EACH ROW EXECUTE FUNCTION ppo.service_escalation_guard();
