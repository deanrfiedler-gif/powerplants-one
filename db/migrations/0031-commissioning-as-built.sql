-- EN-08 Commissioning Basis & As-Built Release (principal requirement ENG-07; decisions in
-- docs/decisions/engineering-commissioning-as-built-design.md). Additive only: no existing row, trigger, grant
-- or issued migration byte changes. Four shared CHECK constraints are widened by the 0020 idiom, so every value
-- they accepted before remains accepted.
--
-- Two bounded areas are created. The shared inspection core (ppo.inspection_*) owns attempts, results, evidence,
-- reviews, defects and retest lineage for any typed host: a Project commissioning scope now, a Service
-- appointment for later FI-03/FI-04 consumers. It is not a commissioning engine and EN-08 builds no second one.
-- The commissioning area (ppo.commissioning_*) owns scope, test basis, configuration reconciliation, redlines,
-- associations, backups, obligations, as-built releases, exact outputs and receiving. Sources are the retained
-- upstream snapshots of 0029 (ppo.material_sources); a referred technical difference is a real EN-07 change (0030).
-- A technical release completes no Project, authorises no site operation, starts no warranty, books nobody,
-- controls no equipment and closes no commercial obligation: nothing here records those facts.
--
-- The runner applies every pending migration in one transaction and PostgreSQL refuses to ALTER a table with
-- pending trigger events. As AGENTS.md requires since 0029, the deferred identity_target checks are settled
-- before ppo.business_identities is altered and deferral is restored straight afterwards.
SET CONSTRAINTS ppo.identity_target IMMEDIATE;
DO $$
DECLARE item record; definition text;
BEGIN
 FOR item IN SELECT * FROM (VALUES
 ('business_identities','ck_identities_type','object_type','CommissioningPackage'),
 ('audit_events','ck_audit_object_type','object_type','CommissioningPackage'),
 ('outbox_jobs','ck_outbox_kind','kind','CommissioningRecordSaved,CommissioningBasisDecided,InspectionSubmitted,InspectionReviewed,CommissioningReleaseDecided,CommissioningReleaseIssued,CommissioningHandoverSubmitted,CommissioningReceivingDecided'),
 ('permission_grants','ck_grants_capability','capability','engineering.commissioning.capture,engineering.commissioning.review,engineering.commissioning.issue,engineering.commissioning.receive')
 ) AS v(tab,con,col,added) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid=('ppo.'||item.tab)::regclass AND conname=item.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',item.tab,item.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR %I = ANY(%L::text[]))',item.tab,item.con,substring(definition from 8 for length(definition)-8),item.col,string_to_array(item.added,','));
 END LOOP;
 SELECT pg_get_functiondef('ppo.identity_has_typed_record()'::regprocedure) INTO definition;
 IF position('CASE NEW.object_type' in definition)=0 THEN RAISE EXCEPTION 'Inspect changed typed identity dispatch'; END IF;
 EXECUTE replace(definition,'CASE NEW.object_type','CASE NEW.object_type WHEN ''CommissioningPackage'' THEN ''commissioning_packages''');
END $$;
SET CONSTRAINTS ppo.identity_target DEFERRED;

-- =====================================================================================================
-- Commissioning package. Its reference is a package-local synthetic alias: PPO-STD-001 catalogues no reference
-- type for a commissioning package, so none is invented and no SYN-PPO counter is consumed. No status lives
-- here: basis approval, evidence, reconciliation, release and receiving are separate facts read from their own
-- rows, and the workflow shown on screen is derived from them. Installed area and served areas are different.
CREATE TABLE ppo.commissioning_packages (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, package_id uuid NOT NULL, site_id uuid,
 version integer NOT NULL DEFAULT 1 CONSTRAINT ck_commissioning_packages_version CHECK(version>0), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 record_number integer NOT NULL CONSTRAINT ck_commissioning_packages_number CHECK(record_number BETWEEN 1 AND 99999),
 reference text NOT NULL CONSTRAINT ck_commissioning_packages_reference CHECK(reference ~ '^SYN-EN08-[0-9]{3,5}$'),
 title text NOT NULL CONSTRAINT ck_commissioning_packages_title CHECK(length(btrim(title)) BETWEEN 1 AND 200),
 system_name text NOT NULL CONSTRAINT ck_commissioning_packages_system CHECK(length(btrim(system_name)) BETWEEN 1 AND 120),
 area text NOT NULL CONSTRAINT ck_commissioning_packages_area CHECK(length(btrim(area)) BETWEEN 1 AND 120),
 owner_id uuid, due date CONSTRAINT ck_commissioning_packages_due CHECK(due BETWEEN DATE '0001-01-01' AND DATE '9998-12-31'),
 due_meaning text CONSTRAINT ck_commissioning_packages_due_meaning CHECK(due_meaning IN ('ReviewDue','TestWindowCloses','ReleaseTarget','HandoverTarget')),
 release_stage text NOT NULL DEFAULT 'WholeScope' CONSTRAINT ck_commissioning_packages_stage CHECK(release_stage IN ('WholeScope','StagedArea')),
 current_scope integer NOT NULL DEFAULT 1 CONSTRAINT ck_commissioning_packages_scope CHECK(current_scope>0),
 archived_at timestamptz, archived_by uuid, archived_reason text CONSTRAINT ck_commissioning_packages_archived_reason CHECK(length(btrim(archived_reason)) BETWEEN 1 AND 1000),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id),
 CONSTRAINT uq_commissioning_packages_number UNIQUE(workspace_id,package_id,record_number), CONSTRAINT uq_commissioning_packages_reference UNIQUE(workspace_id,package_id,reference),
 CONSTRAINT ck_commissioning_packages_due_pair CHECK(due IS NULL OR due_meaning IS NOT NULL),
 CONSTRAINT ck_commissioning_packages_archived CHECK(num_nonnulls(archived_at,archived_by,archived_reason) IN (0,3)),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,package_id) REFERENCES ppo.engineering_packages(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id) REFERENCES ppo.sites(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,archived_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.commissioning_packages FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('CommissioningPackage','');
CREATE TRIGGER commissioning_retained BEFORE DELETE ON ppo.commissioning_packages FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE INDEX ix_commissioning_packages_package ON ppo.commissioning_packages(workspace_id,package_id,due);
CREATE FUNCTION ppo.protect_commissioning_package() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.version<>OLD.version+1 THEN RAISE EXCEPTION 'Advance the commissioning package version' USING ERRCODE='55000'; END IF;
 IF (NEW.company_id,NEW.package_id,NEW.site_id,NEW.record_number,NEW.reference) IS DISTINCT FROM (OLD.company_id,OLD.package_id,OLD.site_id,OLD.record_number,OLD.reference) THEN
  RAISE EXCEPTION 'The identity and context of a commissioning package are permanent' USING ERRCODE='55000'; END IF;
 -- Archive is recorded once. It deletes nothing and is never Project completion.
 IF OLD.archived_at IS NOT NULL AND (NEW.archived_at,NEW.archived_by,NEW.archived_reason) IS DISTINCT FROM (OLD.archived_at,OLD.archived_by,OLD.archived_reason) THEN
  RAISE EXCEPTION 'An archive is recorded once' USING ERRCODE='55000'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER commissioning_guards BEFORE UPDATE ON ppo.commissioning_packages FOR EACH ROW EXECUTE FUNCTION ppo.protect_commissioning_package();

-- A generic guard for versioned rows that become permanent: the version advances by one, the named lineage
-- columns never change, and once the row reaches a frozen state its frozen columns never change again.
CREATE FUNCTION ppo.commissioning_frozen() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE old_row jsonb:=to_jsonb(OLD); new_row jsonb:=to_jsonb(NEW); col text;
BEGIN
 IF (new_row->>'version')::int<>(old_row->>'version')::int+1 THEN RAISE EXCEPTION 'Advance the record version' USING ERRCODE='55000'; END IF;
 FOREACH col IN ARRAY string_to_array(TG_ARGV[0],',') LOOP
  IF new_row->col IS DISTINCT FROM old_row->col THEN RAISE EXCEPTION 'The lineage of this record is permanent (%)',col USING ERRCODE='55000'; END IF;
 END LOOP;
 IF old_row->>TG_ARGV[1]<>TG_ARGV[2] THEN
  FOREACH col IN ARRAY string_to_array(TG_ARGV[3],',') LOOP
   IF new_row->col IS DISTINCT FROM old_row->col THEN RAISE EXCEPTION 'This content was frozen when it left %; correct it through a successor (%)',TG_ARGV[2],col USING ERRCODE='55000'; END IF;
  END LOOP;
 END IF;
 RETURN NEW;
END $$;

-- Versioned scope: the systems, areas and assets this package covers, those it excludes with reasons, and the
-- interfaces several of them share. Working is an optimistic draft; a scope is frozen when a test basis that
-- binds it is submitted, and a change after that is a successor scope version.
CREATE TABLE ppo.commissioning_scopes (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, commissioning_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version>0), created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 scope_number integer NOT NULL CHECK(scope_number>0), predecessor_id uuid,
 state text NOT NULL DEFAULT 'Working' CONSTRAINT ck_commissioning_scopes_state CHECK(state IN ('Working','Frozen')),
 statement text CONSTRAINT ck_commissioning_scopes_statement CHECK(length(btrim(statement)) BETWEEN 1 AND 2000),
 items jsonb NOT NULL DEFAULT '[]' CONSTRAINT ck_commissioning_scopes_items CHECK(jsonb_typeof(items)='array' AND jsonb_array_length(items)<=60),
 interfaces jsonb NOT NULL DEFAULT '[]' CONSTRAINT ck_commissioning_scopes_interfaces CHECK(jsonb_typeof(interfaces)='array' AND jsonb_array_length(interfaces)<=20),
 content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'), frozen_at timestamptz, frozen_by uuid,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id), CONSTRAINT uq_commissioning_scopes_number UNIQUE(workspace_id,commissioning_id,scope_number),
 CONSTRAINT ck_commissioning_scopes_frozen CHECK((state='Frozen')=(frozen_at IS NOT NULL) AND num_nonnulls(frozen_at,frozen_by) IN (0,2)),
 FOREIGN KEY(workspace_id,company_id,commissioning_id) REFERENCES ppo.commissioning_packages(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,predecessor_id) REFERENCES ppo.commissioning_scopes(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,frozen_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER scope_retained BEFORE DELETE ON ppo.commissioning_scopes FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TRIGGER scope_guards BEFORE UPDATE ON ppo.commissioning_scopes FOR EACH ROW EXECUTE FUNCTION ppo.commissioning_frozen('company_id,commissioning_id,scope_number,predecessor_id','state','Working','statement,items,interfaces,content_hash,state,frozen_at,frozen_by');

-- Versioned fictional commissioning policy. It names actors per duty and says where independence is required;
-- a role label or a capability alone grants nothing, and no row means "Authority not configured". Rows are
-- immutable: a change is a new version. It closes no D-019 decision.
CREATE TABLE ppo.commissioning_policies (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, site_id uuid,
 policy_version integer NOT NULL CHECK(policy_version>0), effective_from timestamptz NOT NULL,
 independence jsonb NOT NULL CONSTRAINT ck_commissioning_policies_independence CHECK(jsonb_typeof(independence)='object'),
 grants jsonb NOT NULL CONSTRAINT ck_commissioning_policies_grants CHECK(jsonb_typeof(grants)='array' AND jsonb_array_length(grants)<=60),
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic), created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id), CONSTRAINT uq_commissioning_policies_version UNIQUE(workspace_id,company_id,policy_version),
 FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id) REFERENCES ppo.sites(workspace_id,company_id,id)
);
CREATE TRIGGER policy_immutable BEFORE UPDATE OR DELETE ON ppo.commissioning_policies FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

-- A test basis version: the exact procedure, criteria, intended technical basis, prerequisites and review
-- requirement approved for one declared purpose. A procedure file revision, an Engineering issue revision and
-- this row's version are three different identifiers and all three are kept. Checks are validated by the
-- application's strict parsers; the database holds their shape and their immutability. A material edit after
-- submission is a successor basis: the version bound to an existing test never changes.
CREATE TABLE ppo.commissioning_bases (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, commissioning_id uuid NOT NULL, scope_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version>0), created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 basis_number integer NOT NULL CHECK(basis_number>0), predecessor_id uuid,
 state text NOT NULL DEFAULT 'Draft' CONSTRAINT ck_commissioning_bases_state CHECK(state IN ('Draft','InReview','ApprovedForTest','Returned','Superseded')),
 reference text NOT NULL CONSTRAINT ck_commissioning_bases_reference CHECK(length(btrim(reference)) BETWEEN 1 AND 40),
 revision text NOT NULL CONSTRAINT ck_commissioning_bases_revision CHECK(revision ~ '^[A-Za-z0-9.]{1,12}$'),
 approval_purpose text NOT NULL DEFAULT 'CommissioningTest' CONSTRAINT ck_commissioning_bases_purpose CHECK(approval_purpose='CommissioningTest'),
 procedure_source_id uuid, drawing_source_id uuid, configuration_source_id uuid,
 sources jsonb NOT NULL DEFAULT '{}' CONSTRAINT ck_commissioning_bases_sources CHECK(jsonb_typeof(sources)='object'),
 checks jsonb NOT NULL DEFAULT '[]' CONSTRAINT ck_commissioning_bases_checks CHECK(jsonb_typeof(checks)='array' AND jsonb_array_length(checks)<=80),
 prerequisites jsonb NOT NULL DEFAULT '[]' CONSTRAINT ck_commissioning_bases_prerequisites CHECK(jsonb_typeof(prerequisites)='array' AND jsonb_array_length(prerequisites)<=30),
 content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'),
 submitted_hash text CHECK(submitted_hash ~ '^[a-f0-9]{64}$'), submitted_at timestamptz, submitted_by uuid,
 decision_reason text CONSTRAINT ck_commissioning_bases_reason CHECK(length(btrim(decision_reason)) BETWEEN 1 AND 2000),
 decided_by uuid, decided_at timestamptz, policy_id uuid, policy_version integer, independence_required boolean,
 source_state jsonb, return_owner_id uuid, return_due date, decision_operation_id uuid,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id), CONSTRAINT uq_commissioning_bases_number UNIQUE(workspace_id,commissioning_id,basis_number),
 CONSTRAINT ck_commissioning_bases_submitted CHECK((state='Draft')=(submitted_hash IS NULL) AND num_nonnulls(submitted_hash,submitted_at,submitted_by) IN (0,3) AND (submitted_hash IS NULL OR submitted_hash=content_hash)),
 CONSTRAINT ck_commissioning_bases_decided CHECK((state IN ('ApprovedForTest','Returned','Superseded'))=(decided_by IS NOT NULL) AND num_nonnulls(decision_reason,decided_by,decided_at,policy_id,policy_version,independence_required,decision_operation_id) IN (0,7)),
 CONSTRAINT ck_commissioning_bases_returned CHECK(state<>'Returned' OR (return_owner_id IS NOT NULL AND return_due IS NOT NULL)),
 -- Where the policy requires independence it is also a database fact: nobody approves or returns their own submission.
 CONSTRAINT ck_commissioning_bases_independent CHECK(independence_required IS NOT TRUE OR decided_by IS DISTINCT FROM submitted_by),
 FOREIGN KEY(workspace_id,company_id,commissioning_id) REFERENCES ppo.commissioning_packages(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,scope_id) REFERENCES ppo.commissioning_scopes(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,predecessor_id) REFERENCES ppo.commissioning_bases(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,procedure_source_id) REFERENCES ppo.material_sources(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,drawing_source_id) REFERENCES ppo.material_sources(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,configuration_source_id) REFERENCES ppo.material_sources(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,policy_id) REFERENCES ppo.commissioning_policies(workspace_id,id),
 FOREIGN KEY(workspace_id,submitted_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,decided_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,return_owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER basis_retained BEFORE DELETE ON ppo.commissioning_bases FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TRIGGER basis_guards BEFORE UPDATE ON ppo.commissioning_bases FOR EACH ROW EXECUTE FUNCTION ppo.commissioning_frozen('company_id,commissioning_id,basis_number,predecessor_id','state','Draft',
 'scope_id,reference,revision,approval_purpose,procedure_source_id,drawing_source_id,configuration_source_id,sources,checks,prerequisites,content_hash,submitted_hash,submitted_at,submitted_by');
CREATE FUNCTION ppo.commissioning_basis_transitions() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.state=NEW.state THEN RETURN NEW; END IF;
 IF NOT ((OLD.state='Draft' AND NEW.state='InReview') OR (OLD.state='InReview' AND NEW.state IN ('ApprovedForTest','Returned')) OR (OLD.state='ApprovedForTest' AND NEW.state='Superseded')) THEN
  RAISE EXCEPTION 'A test basis moves Draft, In review, then Approved for test or Returned; an approved basis is only ever superseded' USING ERRCODE='55000'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER basis_transitions BEFORE UPDATE ON ppo.commissioning_bases FOR EACH ROW EXECUTE FUNCTION ppo.commissioning_basis_transitions();
-- At most one basis of a package is approved for test at a time; approving a successor supersedes the one before it.
CREATE UNIQUE INDEX uq_commissioning_bases_approved ON ppo.commissioning_bases(workspace_id,commissioning_id) WHERE state='ApprovedForTest';

-- =====================================================================================================
-- The shared inspection core. A host is typed and validated: nothing here accepts a free-text context.
CREATE TABLE ppo.inspection_instruments (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version>0), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic), created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 reference text NOT NULL CONSTRAINT ck_inspection_instruments_reference CHECK(length(btrim(reference)) BETWEEN 1 AND 60),
 description text NOT NULL CONSTRAINT ck_inspection_instruments_description CHECK(length(btrim(description)) BETWEEN 1 AND 200),
 calibration_reference text NOT NULL CONSTRAINT ck_inspection_instruments_calibration CHECK(length(btrim(calibration_reference)) BETWEEN 1 AND 80),
 calibration_version text NOT NULL CONSTRAINT ck_inspection_instruments_calibration_version CHECK(length(btrim(calibration_version)) BETWEEN 1 AND 20),
 valid_from date NOT NULL, valid_to date NOT NULL,
 -- A retrospective withdrawal names the date from which the certificate is no longer relied on. It is recorded once.
 withdrawn_effective_from date, withdrawn_reason text CONSTRAINT ck_inspection_instruments_withdrawn_reason CHECK(length(btrim(withdrawn_reason)) BETWEEN 1 AND 600), withdrawn_recorded_at timestamptz,
 adapter text NOT NULL DEFAULT 'SyntheticCalibrationFixture' CONSTRAINT ck_inspection_instruments_adapter CHECK(adapter='SyntheticCalibrationFixture'),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id), CONSTRAINT uq_inspection_instruments_calibration UNIQUE(workspace_id,company_id,reference,calibration_reference,calibration_version),
 CONSTRAINT ck_inspection_instruments_interval CHECK(valid_to>=valid_from), CONSTRAINT ck_inspection_instruments_withdrawn CHECK(num_nonnulls(withdrawn_effective_from,withdrawn_reason,withdrawn_recorded_at) IN (0,3)),
 FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id)
);
CREATE TRIGGER instrument_retained BEFORE DELETE ON ppo.inspection_instruments FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.protect_inspection_instrument() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.version<>OLD.version+1 OR OLD.withdrawn_effective_from IS NOT NULL OR NEW.withdrawn_effective_from IS NULL
  OR (NEW.company_id,NEW.reference,NEW.description,NEW.calibration_reference,NEW.calibration_version,NEW.valid_from,NEW.valid_to) IS DISTINCT FROM (OLD.company_id,OLD.reference,OLD.description,OLD.calibration_reference,OLD.calibration_version,OLD.valid_from,OLD.valid_to) THEN
  RAISE EXCEPTION 'A calibration record is permanent; only its withdrawal is recorded, once. A renewed certificate is a new record' USING ERRCODE='55000'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER instrument_guards BEFORE UPDATE ON ppo.inspection_instruments FOR EACH ROW EXECUTE FUNCTION ppo.protect_inspection_instrument();

-- One attempt at the checks of one host. While Draft it is an ordinary optimistic draft. Submitting freezes
-- the plan, scope, tested configuration, occurrence time, prerequisites, readings, instruments and evidence
-- manifest under one hash, with the server's own receipt time. A retest is a new attempt that names its
-- predecessor; it copies nothing forward as fresh evidence.
CREATE TABLE ppo.inspection_attempts (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, site_id uuid,
 host_type text NOT NULL CONSTRAINT ck_inspection_attempts_host CHECK(host_type IN ('ProjectCommissioningScope','ServiceAppointment')), host_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version>0), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL, updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 attempt_number integer NOT NULL CHECK(attempt_number>0), predecessor_id uuid,
 state text NOT NULL DEFAULT 'Draft' CONSTRAINT ck_inspection_attempts_state CHECK(state IN ('Draft','Submitted')),
 -- The frozen plan: what was approved to be tested, exactly as it stood when this attempt was opened.
 plan_source jsonb NOT NULL CONSTRAINT ck_inspection_attempts_plan_source CHECK(jsonb_typeof(plan_source)='object'),
 plan jsonb NOT NULL CONSTRAINT ck_inspection_attempts_plan CHECK(jsonb_typeof(plan)='array' AND jsonb_array_length(plan) BETWEEN 1 AND 80),
 plan_hash text NOT NULL CHECK(plan_hash ~ '^[a-f0-9]{64}$'),
 scope_keys jsonb NOT NULL DEFAULT '[]' CONSTRAINT ck_inspection_attempts_scope CHECK(jsonb_typeof(scope_keys)='array' AND jsonb_array_length(scope_keys)<=60),
 check_keys jsonb NOT NULL DEFAULT '[]' CONSTRAINT ck_inspection_attempts_checks CHECK(jsonb_typeof(check_keys)='array' AND jsonb_array_length(check_keys)<=80),
 configuration_reference text CONSTRAINT ck_inspection_attempts_configuration CHECK(length(btrim(configuration_reference)) BETWEEN 1 AND 200), configuration_source_id uuid,
 performer_id uuid NOT NULL, occurred_at timestamptz, timezone text CONSTRAINT ck_inspection_attempts_timezone CHECK(length(btrim(timezone)) BETWEEN 1 AND 64),
 clock_concern text CONSTRAINT ck_inspection_attempts_clock CHECK(length(btrim(clock_concern)) BETWEEN 1 AND 400),
 prerequisites jsonb NOT NULL DEFAULT '[]' CONSTRAINT ck_inspection_attempts_prerequisites CHECK(jsonb_typeof(prerequisites)='array' AND jsonb_array_length(prerequisites)<=30),
 findings text CONSTRAINT ck_inspection_attempts_findings CHECK(length(btrim(findings)) BETWEEN 1 AND 4000),
 content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'),
 submitted_hash text CHECK(submitted_hash ~ '^[a-f0-9]{64}$'), submitted_at timestamptz, submitted_by uuid, received_at timestamptz, submit_operation_id uuid,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id), CONSTRAINT uq_inspection_attempts_number UNIQUE(workspace_id,host_type,host_id,attempt_number),
 CONSTRAINT ck_inspection_attempts_submitted CHECK((state='Draft')=(submitted_hash IS NULL) AND num_nonnulls(submitted_hash,submitted_at,submitted_by,received_at,submit_operation_id) IN (0,5) AND (submitted_hash IS NULL OR (submitted_hash=content_hash AND occurred_at IS NOT NULL AND timezone IS NOT NULL AND configuration_reference IS NOT NULL))),
 CONSTRAINT ck_inspection_attempts_predecessor CHECK(predecessor_id IS DISTINCT FROM id),
 FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id) REFERENCES ppo.sites(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,predecessor_id) REFERENCES ppo.inspection_attempts(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,configuration_source_id) REFERENCES ppo.material_sources(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,performer_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,submitted_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE INDEX ix_inspection_attempts_host ON ppo.inspection_attempts(workspace_id,host_type,host_id,attempt_number);
CREATE TRIGGER attempt_retained BEFORE DELETE ON ppo.inspection_attempts FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
-- The host is real, in the same company and, where it has one, the same site; and a predecessor belongs to the
-- same host, so a retest chain can never cross into another context or loop back on itself.
CREATE FUNCTION ppo.protect_inspection_attempt() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  IF NEW.host_type='ProjectCommissioningScope' AND NOT EXISTS(SELECT 1 FROM ppo.commissioning_packages h WHERE (h.workspace_id,h.company_id,h.id)=(NEW.workspace_id,NEW.company_id,NEW.host_id) AND h.site_id IS NOT DISTINCT FROM NEW.site_id AND h.archived_at IS NULL) THEN
   RAISE EXCEPTION 'The commissioning scope hosting this inspection does not exist in this company and site' USING ERRCODE='23503'; END IF;
  IF NEW.host_type='ServiceAppointment' AND NOT EXISTS(SELECT 1 FROM ppo.appointments h WHERE (h.workspace_id,h.company_id,h.site_id,h.id)=(NEW.workspace_id,NEW.company_id,NEW.site_id,NEW.host_id)) THEN
   RAISE EXCEPTION 'The appointment hosting this inspection does not exist in this company and site' USING ERRCODE='23503'; END IF;
  IF NEW.predecessor_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM ppo.inspection_attempts a WHERE (a.workspace_id,a.id,a.host_type,a.host_id)=(NEW.workspace_id,NEW.predecessor_id,NEW.host_type,NEW.host_id) AND a.state='Submitted' AND a.attempt_number<NEW.attempt_number) THEN
   RAISE EXCEPTION 'A retest follows an earlier submitted attempt of the same host' USING ERRCODE='23514'; END IF;
  RETURN NEW;
 END IF;
 IF NEW.version<>OLD.version+1 THEN RAISE EXCEPTION 'Advance the attempt version' USING ERRCODE='55000'; END IF;
 IF OLD.state='Submitted' THEN RAISE EXCEPTION 'A submitted attempt is immutable; a correction is an attributed successor attempt' USING ERRCODE='55000'; END IF;
 IF (NEW.company_id,NEW.site_id,NEW.host_type,NEW.host_id,NEW.attempt_number,NEW.predecessor_id,NEW.plan_source,NEW.plan,NEW.plan_hash,NEW.performer_id) IS DISTINCT FROM (OLD.company_id,OLD.site_id,OLD.host_type,OLD.host_id,OLD.attempt_number,OLD.predecessor_id,OLD.plan_source,OLD.plan,OLD.plan_hash,OLD.performer_id) THEN
  RAISE EXCEPTION 'The host, plan, lineage and performer of an attempt are permanent' USING ERRCODE='55000'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER attempt_guards BEFORE INSERT OR UPDATE ON ppo.inspection_attempts FOR EACH ROW EXECUTE FUNCTION ppo.protect_inspection_attempt();
-- Children of an attempt move only while it is a draft. After that they are its frozen evidence.
CREATE FUNCTION ppo.inspection_attempt_is_draft() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE ws uuid; att uuid;
BEGIN
 IF TG_OP='DELETE' THEN ws:=OLD.workspace_id; att:=OLD.attempt_id; ELSE ws:=NEW.workspace_id; att:=NEW.attempt_id; END IF;
 IF NOT EXISTS(SELECT 1 FROM ppo.inspection_attempts a WHERE a.workspace_id=ws AND a.id=att AND a.state='Draft') THEN
  RAISE EXCEPTION 'The readings, instruments and evidence of a submitted attempt are frozen' USING ERRCODE='55000'; END IF;
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END $$;

-- One entry per check occurrence. The raw value is kept exactly as entered, as text: a number is never stored
-- through a float. The evaluation is written by the server at submission, under the rule version that made it.
CREATE TABLE ppo.inspection_results (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, attempt_id uuid NOT NULL,
 check_key text NOT NULL CONSTRAINT ck_inspection_results_key CHECK(check_key ~ '^[a-z0-9][a-z0-9:-]{0,79}$'),
 entry_state text NOT NULL CONSTRAINT ck_inspection_results_state CHECK(entry_state IN ('Recorded','NotTested','NotApplicable')),
 raw_value text CONSTRAINT ck_inspection_results_value CHECK(raw_value ~ '^-?[0-9]{1,15}(\.[0-9]{1,12})?$'), unit text CONSTRAINT ck_inspection_results_unit CHECK(length(btrim(unit)) BETWEEN 1 AND 20),
 choice text CONSTRAINT ck_inspection_results_choice CHECK(length(btrim(choice)) BETWEEN 1 AND 80), reason text CONSTRAINT ck_inspection_results_reason CHECK(length(btrim(reason)) BETWEEN 1 AND 600),
 note text CONSTRAINT ck_inspection_results_note CHECK(length(btrim(note)) BETWEEN 1 AND 1000),
 evaluation text CONSTRAINT ck_inspection_results_evaluation CHECK(evaluation IN ('Pass','Fail','NotTested','NotApplicable','UnableToAssess')),
 evaluation_reason text, compared text, rule_version text, sort_order integer NOT NULL DEFAULT 0,
 UNIQUE(workspace_id,id), CONSTRAINT uq_inspection_results_check UNIQUE(workspace_id,attempt_id,check_key),
 CONSTRAINT ck_inspection_results_evaluated CHECK(num_nonnulls(evaluation,rule_version) IN (0,2)),
 FOREIGN KEY(workspace_id,company_id,attempt_id) REFERENCES ppo.inspection_attempts(workspace_id,company_id,id)
);
CREATE TRIGGER result_frozen BEFORE INSERT OR UPDATE OR DELETE ON ppo.inspection_results FOR EACH ROW EXECUTE FUNCTION ppo.inspection_attempt_is_draft();
CREATE TABLE ppo.inspection_instrument_uses (
 workspace_id uuid NOT NULL, company_id uuid NOT NULL, attempt_id uuid NOT NULL, instrument_id uuid NOT NULL,
 -- The calibration facts as they stood when the instrument was named, kept beside the live record.
 snapshot jsonb NOT NULL CONSTRAINT ck_inspection_instrument_uses_snapshot CHECK(jsonb_typeof(snapshot)='object'),
 CONSTRAINT pk_inspection_instrument_uses PRIMARY KEY(workspace_id,attempt_id,instrument_id),
 FOREIGN KEY(workspace_id,company_id,attempt_id) REFERENCES ppo.inspection_attempts(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,instrument_id) REFERENCES ppo.inspection_instruments(workspace_id,company_id,id)
);
CREATE TRIGGER instrument_use_frozen BEFORE INSERT OR UPDATE OR DELETE ON ppo.inspection_instrument_uses FOR EACH ROW EXECUTE FUNCTION ppo.inspection_attempt_is_draft();
-- Evidence is a reference to a durable original, never a copied authoritative value: a retained upstream source,
-- an existing field entry at its exact revision, or exact stored bytes under their hash. A link is not proof
-- that a document was inspected; its state says whether the bytes were there and readable when it was added.
CREATE TABLE ppo.inspection_evidence (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, attempt_id uuid NOT NULL,
 check_key text CONSTRAINT ck_inspection_evidence_key CHECK(check_key ~ '^[a-z0-9][a-z0-9:-]{0,79}$'),
 kind text NOT NULL CONSTRAINT ck_inspection_evidence_kind CHECK(kind IN ('RetainedSource','FieldEntry','StoredFile')),
 source_id uuid, field_entry_id uuid, field_entry_revision integer, storage_id uuid,
 label text NOT NULL CONSTRAINT ck_inspection_evidence_label CHECK(length(btrim(label)) BETWEEN 1 AND 200),
 purpose text NOT NULL CONSTRAINT ck_inspection_evidence_purpose CHECK(length(btrim(purpose)) BETWEEN 1 AND 300),
 media_type text CONSTRAINT ck_inspection_evidence_media CHECK(media_type IN ('image/png','text/plain')),
 byte_count integer CONSTRAINT ck_inspection_evidence_bytes CHECK(byte_count BETWEEN 1 AND 20000000), content_hash text CHECK(content_hash ~ '^[a-f0-9]{64}$'),
 access_class text NOT NULL DEFAULT 'Internal' CONSTRAINT ck_inspection_evidence_access CHECK(access_class IN ('Internal','CustomerSafe')),
 state text NOT NULL CONSTRAINT ck_inspection_evidence_state CHECK(state IN ('Complete','Pending','Missing','Unsupported')),
 added_by uuid NOT NULL, added_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id),
 CONSTRAINT ck_inspection_evidence_target CHECK(num_nonnulls(source_id,field_entry_id,storage_id)=1 AND (kind='RetainedSource')=(source_id IS NOT NULL) AND (kind='FieldEntry')=(field_entry_id IS NOT NULL AND field_entry_revision IS NOT NULL) AND (kind='StoredFile')=(storage_id IS NOT NULL)),
 CONSTRAINT ck_inspection_evidence_complete CHECK(state<>'Complete' OR content_hash IS NOT NULL),
 FOREIGN KEY(workspace_id,company_id,attempt_id) REFERENCES ppo.inspection_attempts(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,source_id) REFERENCES ppo.material_sources(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,added_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE INDEX ix_inspection_evidence_attempt ON ppo.inspection_evidence(workspace_id,attempt_id);
CREATE TRIGGER evidence_frozen BEFORE INSERT OR UPDATE OR DELETE ON ppo.inspection_evidence FOR EACH ROW EXECUTE FUNCTION ppo.inspection_attempt_is_draft();

-- A review decision on one exact submitted attempt. Every decision is retained: a later acceptance never
-- removes the return, the clarification or the hold that came before it. Review never rewrites a measured value.
CREATE TABLE ppo.inspection_reviews (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, attempt_id uuid NOT NULL,
 decision text NOT NULL CONSTRAINT ck_inspection_reviews_decision CHECK(decision IN ('Accepted','Returned','ClarificationRequired','OnHold','ClarificationProvided')),
 reason text NOT NULL CONSTRAINT ck_inspection_reviews_reason CHECK(length(btrim(reason)) BETWEEN 1 AND 4000),
 submitted_hash text NOT NULL CHECK(submitted_hash ~ '^[a-f0-9]{64}$'), owner_id uuid, due date,
 policy jsonb NOT NULL CONSTRAINT ck_inspection_reviews_policy CHECK(jsonb_typeof(policy)='object'), independence_required boolean NOT NULL,
 applicability jsonb, operation_id uuid NOT NULL, decided_by uuid NOT NULL, decided_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id),
 CONSTRAINT ck_inspection_reviews_owned CHECK(decision NOT IN ('Returned','ClarificationRequired','OnHold') OR (owner_id IS NOT NULL AND due IS NOT NULL)),
 FOREIGN KEY(workspace_id,company_id,attempt_id) REFERENCES ppo.inspection_attempts(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,decided_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE INDEX ix_inspection_reviews_attempt ON ppo.inspection_reviews(workspace_id,attempt_id,decided_at);
CREATE FUNCTION ppo.protect_inspection_review() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE att ppo.inspection_attempts; latest text;
BEGIN
 IF TG_OP<>'INSERT' THEN RAISE EXCEPTION 'A review decision is permanent' USING ERRCODE='55000'; END IF;
 SELECT * INTO att FROM ppo.inspection_attempts a WHERE (a.workspace_id,a.id)=(NEW.workspace_id,NEW.attempt_id);
 IF att.state<>'Submitted' OR att.submitted_hash<>NEW.submitted_hash THEN RAISE EXCEPTION 'A review binds the exact submitted attempt' USING ERRCODE='23514'; END IF;
 SELECT r.decision INTO latest FROM ppo.inspection_reviews r WHERE (r.workspace_id,r.attempt_id)=(NEW.workspace_id,NEW.attempt_id) ORDER BY r.decided_at DESC,r.id DESC LIMIT 1;
 IF latest IN ('Accepted','Returned') THEN RAISE EXCEPTION 'This attempt was already % in review; later work is a successor attempt',lower(latest) USING ERRCODE='23514'; END IF;
 IF NEW.decision='ClarificationProvided' AND latest IS DISTINCT FROM 'ClarificationRequired' THEN RAISE EXCEPTION 'A clarification answers a request for one' USING ERRCODE='23514'; END IF;
 IF NEW.decision<>'ClarificationProvided' AND NEW.independence_required AND NEW.decided_by IN (att.performer_id,att.submitted_by,att.created_by) THEN
  RAISE EXCEPTION 'Evidence is never reviewed by the person who captured or submitted it' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER review_guards BEFORE INSERT OR UPDATE OR DELETE ON ppo.inspection_reviews FOR EACH ROW EXECUTE FUNCTION ppo.protect_inspection_review();

-- A defect belongs to one check occurrence of one host. While it is unresolved there is exactly one: a repeated
-- failure and a repeated command both land on it, by constraint and not by a disabled button. It closes only
-- through a fresh passing attempt whose evidence an independent reviewer accepted, and it closes only itself.
CREATE TABLE ppo.inspection_defects (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL,
 host_type text NOT NULL CONSTRAINT ck_inspection_defects_host CHECK(host_type IN ('ProjectCommissioningScope','ServiceAppointment')), host_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version>0), created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 defect_number integer NOT NULL CHECK(defect_number>0), reference text NOT NULL CONSTRAINT ck_inspection_defects_reference CHECK(reference ~ '^DEF-[0-9]{3,5}$'),
 check_key text NOT NULL CONSTRAINT ck_inspection_defects_key CHECK(check_key ~ '^[a-z0-9][a-z0-9:-]{0,79}$'), scope_key text,
 title text NOT NULL CONSTRAINT ck_inspection_defects_title CHECK(length(btrim(title)) BETWEEN 1 AND 200),
 severity text NOT NULL DEFAULT 'Unclassified' CONSTRAINT ck_inspection_defects_severity CHECK(severity IN ('Unclassified','Minor','Major','Critical')),
 state text NOT NULL DEFAULT 'Open' CONSTRAINT ck_inspection_defects_state CHECK(state IN ('Open','CorrectionRecorded','Closed')),
 owner_id uuid NOT NULL, due date NOT NULL, retest_required boolean NOT NULL DEFAULT true,
 proposed_correction text CONSTRAINT ck_inspection_defects_proposed CHECK(length(btrim(proposed_correction)) BETWEEN 1 AND 1000),
 correction_note text CONSTRAINT ck_inspection_defects_correction CHECK(length(btrim(correction_note)) BETWEEN 1 AND 2000), correction_by uuid, correction_at timestamptz,
 changes_system boolean NOT NULL DEFAULT false, change_id uuid,
 -- The one owned follow-up in My Work, where the people involved may hold one. It is the same action there and here, never a copy.
 activity_id uuid,
 source_attempt_id uuid NOT NULL, closed_by_attempt_id uuid, closed_review_id uuid, closed_at timestamptz,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id), CONSTRAINT uq_inspection_defects_number UNIQUE(workspace_id,host_type,host_id,defect_number),
 CONSTRAINT ck_inspection_defects_corrected CHECK(num_nonnulls(correction_note,correction_by,correction_at) IN (0,3) AND (state<>'CorrectionRecorded' OR correction_at IS NOT NULL)),
 CONSTRAINT ck_inspection_defects_closed CHECK((state='Closed')=(closed_at IS NOT NULL) AND num_nonnulls(closed_by_attempt_id,closed_review_id,closed_at) IN (0,3)),
 FOREIGN KEY(workspace_id,company_id,source_attempt_id) REFERENCES ppo.inspection_attempts(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,closed_by_attempt_id) REFERENCES ppo.inspection_attempts(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,closed_review_id) REFERENCES ppo.inspection_reviews(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,change_id) REFERENCES ppo.engineering_changes(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,activity_id) REFERENCES ppo.activities(workspace_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,correction_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE UNIQUE INDEX uq_inspection_defects_unresolved ON ppo.inspection_defects(workspace_id,host_type,host_id,check_key) WHERE state<>'Closed';
CREATE TRIGGER defect_retained BEFORE DELETE ON ppo.inspection_defects FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.protect_inspection_defect() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.version<>OLD.version+1 THEN RAISE EXCEPTION 'Advance the defect version' USING ERRCODE='55000'; END IF;
 IF OLD.state='Closed' THEN RAISE EXCEPTION 'A closed defect is permanent; a later failure is a new defect' USING ERRCODE='55000'; END IF;
 IF (NEW.company_id,NEW.host_type,NEW.host_id,NEW.defect_number,NEW.reference,NEW.check_key,NEW.scope_key,NEW.source_attempt_id) IS DISTINCT FROM (OLD.company_id,OLD.host_type,OLD.host_id,OLD.defect_number,OLD.reference,OLD.check_key,OLD.scope_key,OLD.source_attempt_id) THEN
  RAISE EXCEPTION 'The identity, check and source of a defect are permanent' USING ERRCODE='55000'; END IF;
 IF NEW.state='Closed' AND NOT EXISTS(
  SELECT 1 FROM ppo.inspection_attempts a JOIN ppo.inspection_results r ON (r.workspace_id,r.attempt_id)=(a.workspace_id,a.id) JOIN ppo.inspection_reviews v ON (v.workspace_id,v.attempt_id)=(a.workspace_id,a.id)
  WHERE (a.workspace_id,a.id,a.host_type,a.host_id)=(NEW.workspace_id,NEW.closed_by_attempt_id,NEW.host_type,NEW.host_id) AND a.id<>NEW.source_attempt_id AND a.state='Submitted'
   AND r.check_key=NEW.check_key AND r.evaluation='Pass' AND v.id=NEW.closed_review_id AND v.decision='Accepted') THEN
  RAISE EXCEPTION 'A defect closes on a fresh passing result of its own check whose evidence was accepted in review' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER defect_guards BEFORE UPDATE ON ppo.inspection_defects FOR EACH ROW EXECUTE FUNCTION ppo.protect_inspection_defect();
-- Every attempt a defect is tied to: the one that raised it, each repeat failure, and each retest.
CREATE TABLE ppo.inspection_defect_attempts (
 workspace_id uuid NOT NULL, company_id uuid NOT NULL, defect_id uuid NOT NULL, attempt_id uuid NOT NULL,
 relation text NOT NULL CONSTRAINT ck_inspection_defect_attempts_relation CHECK(relation IN ('Raised','Repeated','Retest')), created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 CONSTRAINT pk_inspection_defect_attempts PRIMARY KEY(workspace_id,defect_id,attempt_id),
 FOREIGN KEY(workspace_id,company_id,defect_id) REFERENCES ppo.inspection_defects(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,attempt_id) REFERENCES ppo.inspection_attempts(workspace_id,company_id,id)
);
CREATE TRIGGER defect_attempt_immutable BEFORE UPDATE OR DELETE ON ppo.inspection_defect_attempts FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

-- =====================================================================================================
-- Installed configuration. Intended design, observed installation and reviewed as-built are three different
-- things. An observation is an attributed fact or an explicitly unverified report; it never updates the approved
-- design or the canonical installed base. Reconciled covers this named snapshot and nothing later.
CREATE TABLE ppo.commissioning_configurations (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, commissioning_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version>0), created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 snapshot_number integer NOT NULL CHECK(snapshot_number>0), predecessor_id uuid,
 state text NOT NULL DEFAULT 'Working' CONSTRAINT ck_commissioning_configurations_state CHECK(state IN ('Working','UnderReview','Reconciled','Superseded')),
 installed_reference text NOT NULL CONSTRAINT ck_commissioning_configurations_reference CHECK(length(btrim(installed_reference)) BETWEEN 1 AND 80),
 installed_revision text NOT NULL CONSTRAINT ck_commissioning_configurations_revision CHECK(installed_revision ~ '^[A-Za-z0-9.]{1,12}$'),
 intended_source_id uuid, installed_source_id uuid,
 submitted_by uuid, submitted_at timestamptz, reconciled_by uuid, reconciled_at timestamptz,
 reconcile_reason text CONSTRAINT ck_commissioning_configurations_reason CHECK(length(btrim(reconcile_reason)) BETWEEN 1 AND 2000),
 policy_id uuid, policy_version integer, independence_required boolean, content_hash text CHECK(content_hash ~ '^[a-f0-9]{64}$'),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id), CONSTRAINT uq_commissioning_configurations_number UNIQUE(workspace_id,commissioning_id,snapshot_number),
 CONSTRAINT ck_commissioning_configurations_reconciled CHECK((state IN ('Reconciled'))<=(reconciled_by IS NOT NULL) AND num_nonnulls(reconciled_by,reconciled_at,reconcile_reason,policy_id,policy_version,independence_required,content_hash) IN (0,7)),
 CONSTRAINT ck_commissioning_configurations_independent CHECK(independence_required IS NOT TRUE OR reconciled_by IS DISTINCT FROM submitted_by),
 FOREIGN KEY(workspace_id,company_id,commissioning_id) REFERENCES ppo.commissioning_packages(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,predecessor_id) REFERENCES ppo.commissioning_configurations(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,intended_source_id) REFERENCES ppo.material_sources(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,installed_source_id) REFERENCES ppo.material_sources(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,policy_id) REFERENCES ppo.commissioning_policies(workspace_id,id),
 FOREIGN KEY(workspace_id,submitted_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,reconciled_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER configuration_retained BEFORE DELETE ON ppo.commissioning_configurations FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.protect_commissioning_configuration() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.version<>OLD.version+1 THEN RAISE EXCEPTION 'Advance the configuration version' USING ERRCODE='55000'; END IF;
 IF (NEW.company_id,NEW.commissioning_id,NEW.snapshot_number,NEW.predecessor_id) IS DISTINCT FROM (OLD.company_id,OLD.commissioning_id,OLD.snapshot_number,OLD.predecessor_id) THEN RAISE EXCEPTION 'The lineage of a configuration snapshot is permanent' USING ERRCODE='55000'; END IF;
 IF OLD.state='Superseded' OR (OLD.state='Reconciled' AND NEW.state<>'Superseded') THEN RAISE EXCEPTION 'A reconciled snapshot is only ever superseded by a successor' USING ERRCODE='55000'; END IF;
 IF OLD.state='Reconciled' AND (NEW.installed_reference,NEW.installed_revision,NEW.intended_source_id,NEW.installed_source_id,NEW.reconciled_by,NEW.reconciled_at,NEW.reconcile_reason,NEW.content_hash) IS DISTINCT FROM (OLD.installed_reference,OLD.installed_revision,OLD.intended_source_id,OLD.installed_source_id,OLD.reconciled_by,OLD.reconciled_at,OLD.reconcile_reason,OLD.content_hash) THEN
  RAISE EXCEPTION 'A reconciled snapshot is frozen' USING ERRCODE='55000'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER configuration_guards BEFORE UPDATE ON ppo.commissioning_configurations FOR EACH ROW EXECUTE FUNCTION ppo.protect_commissioning_configuration();
-- Children of a snapshot move only until it is reconciled.
CREATE FUNCTION ppo.commissioning_configuration_is_open() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE ws uuid; cfg uuid;
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'A compared item is retained' USING ERRCODE='55000'; END IF;
 ws:=NEW.workspace_id; cfg:=NEW.configuration_id;
 IF NOT EXISTS(SELECT 1 FROM ppo.commissioning_configurations k WHERE k.workspace_id=ws AND k.id=cfg AND k.state IN ('Working','UnderReview')) THEN
  RAISE EXCEPTION 'The items of a reconciled configuration snapshot are frozen' USING ERRCODE='55000'; END IF;
 IF TG_OP='UPDATE' AND NEW.version<>OLD.version+1 THEN RAISE EXCEPTION 'Advance the item version' USING ERRCODE='55000'; END IF;
 RETURN NEW;
END $$;

-- Field redlines. Accepted for incorporation is not an issued as-built: the redline stays outstanding until a
-- verified successor of its exact source exists. A rejected redline keeps its reason; a returned one keeps its
-- original entry and names its corrected successor.
CREATE TABLE ppo.commissioning_redlines (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, commissioning_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version>0), created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 redline_number integer NOT NULL CHECK(redline_number>0), reference text NOT NULL CONSTRAINT ck_commissioning_redlines_reference CHECK(reference ~ '^RL-[0-9]{3,5}$'),
 source_id uuid NOT NULL, source_snapshot jsonb NOT NULL CONSTRAINT ck_commissioning_redlines_snapshot CHECK(jsonb_typeof(source_snapshot)='object'),
 location text NOT NULL CONSTRAINT ck_commissioning_redlines_location CHECK(length(btrim(location)) BETWEEN 1 AND 120),
 component text NOT NULL CONSTRAINT ck_commissioning_redlines_component CHECK(length(btrim(component)) BETWEEN 1 AND 120),
 description text NOT NULL CONSTRAINT ck_commissioning_redlines_description CHECK(length(btrim(description)) BETWEEN 1 AND 2000),
 evidence text CONSTRAINT ck_commissioning_redlines_evidence CHECK(length(btrim(evidence)) BETWEEN 1 AND 600),
 proposed_correction text NOT NULL CONSTRAINT ck_commissioning_redlines_correction CHECK(length(btrim(proposed_correction)) BETWEEN 1 AND 1000),
 classification text CONSTRAINT ck_commissioning_redlines_class CHECK(classification IN ('Clerical','Material')),
 state text NOT NULL DEFAULT 'Recorded' CONSTRAINT ck_commissioning_redlines_state CHECK(state IN ('Recorded','UnderReview','ClarificationRequired','AcceptedForIncorporation','Rejected','IncorporatedVerified')),
 author_id uuid NOT NULL, recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(), owner_id uuid, due date,
 decision_reason text CONSTRAINT ck_commissioning_redlines_reason CHECK(length(btrim(decision_reason)) BETWEEN 1 AND 2000), decided_by uuid, decided_at timestamptz,
 change_id uuid, predecessor_id uuid, successor_source_id uuid,
 verification_note text CONSTRAINT ck_commissioning_redlines_verification CHECK(length(btrim(verification_note)) BETWEEN 1 AND 2000), verified_by uuid, verified_at timestamptz,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id), CONSTRAINT uq_commissioning_redlines_number UNIQUE(workspace_id,commissioning_id,redline_number),
 CONSTRAINT ck_commissioning_redlines_decided CHECK((state IN ('AcceptedForIncorporation','Rejected','IncorporatedVerified','ClarificationRequired'))<=(decided_by IS NOT NULL) AND num_nonnulls(decision_reason,decided_by,decided_at) IN (0,3)),
 CONSTRAINT ck_commissioning_redlines_classified CHECK(state NOT IN ('AcceptedForIncorporation','IncorporatedVerified') OR classification IS NOT NULL),
 CONSTRAINT ck_commissioning_redlines_verified CHECK((state='IncorporatedVerified')=(verified_by IS NOT NULL) AND num_nonnulls(successor_source_id,verification_note,verified_by,verified_at) IN (0,4)),
 -- Incorporation is verified by somebody other than the person who drew the redline.
 CONSTRAINT ck_commissioning_redlines_independent CHECK(verified_by IS DISTINCT FROM author_id),
 CONSTRAINT ck_commissioning_redlines_owned CHECK(state NOT IN ('ClarificationRequired','AcceptedForIncorporation') OR (owner_id IS NOT NULL AND due IS NOT NULL)),
 FOREIGN KEY(workspace_id,company_id,commissioning_id) REFERENCES ppo.commissioning_packages(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,source_id) REFERENCES ppo.material_sources(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,successor_source_id) REFERENCES ppo.material_sources(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,predecessor_id) REFERENCES ppo.commissioning_redlines(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,change_id) REFERENCES ppo.engineering_changes(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,author_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,decided_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,verified_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER redline_retained BEFORE DELETE ON ppo.commissioning_redlines FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.protect_commissioning_redline() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.version<>OLD.version+1 THEN RAISE EXCEPTION 'Advance the redline version' USING ERRCODE='55000'; END IF;
 IF (NEW.company_id,NEW.commissioning_id,NEW.redline_number,NEW.reference,NEW.source_id,NEW.source_snapshot,NEW.location,NEW.component,NEW.description,NEW.author_id,NEW.recorded_at,NEW.predecessor_id)
  IS DISTINCT FROM (OLD.company_id,OLD.commissioning_id,OLD.redline_number,OLD.reference,OLD.source_id,OLD.source_snapshot,OLD.location,OLD.component,OLD.description,OLD.author_id,OLD.recorded_at,OLD.predecessor_id) THEN
  RAISE EXCEPTION 'What a redline recorded, against which exact source, is permanent; a correction is a successor redline' USING ERRCODE='55000'; END IF;
 IF OLD.state IN ('Rejected','IncorporatedVerified') THEN RAISE EXCEPTION 'A rejected or incorporated redline is final' USING ERRCODE='55000'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER redline_guards BEFORE UPDATE ON ppo.commissioning_redlines FOR EACH ROW EXECUTE FUNCTION ppo.protect_commissioning_redline();

-- One compared item of one snapshot. An empty observed value is unknown, never "no difference". A difference
-- referred to change review names a real EN-07 change; the referral is a request, not a resolution.
CREATE TABLE ppo.commissioning_differences (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, configuration_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version>0), created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 item_key text NOT NULL CONSTRAINT ck_commissioning_differences_key CHECK(item_key ~ '^[a-z0-9][a-z0-9:-]{0,79}$'),
 kind text NOT NULL CONSTRAINT ck_commissioning_differences_kind CHECK(kind IN ('Identity','Location','ServedArea','Material','Version','Drawing','Setting')),
 component text NOT NULL CONSTRAINT ck_commissioning_differences_component CHECK(length(btrim(component)) BETWEEN 1 AND 160), scope_key text, critical boolean NOT NULL DEFAULT false,
 intended_value text CONSTRAINT ck_commissioning_differences_intended CHECK(length(btrim(intended_value)) BETWEEN 1 AND 400), intended_source text CONSTRAINT ck_commissioning_differences_intended_source CHECK(length(btrim(intended_source)) BETWEEN 1 AND 200),
 observed_value text CONSTRAINT ck_commissioning_differences_observed CHECK(length(btrim(observed_value)) BETWEEN 1 AND 400), observed_evidence text CONSTRAINT ck_commissioning_differences_evidence CHECK(length(btrim(observed_evidence)) BETWEEN 1 AND 400),
 observation_verified boolean NOT NULL DEFAULT false, observed_by uuid, observed_at timestamptz,
 proposed_as_built text CONSTRAINT ck_commissioning_differences_proposed CHECK(length(btrim(proposed_as_built)) BETWEEN 1 AND 400),
 disposition text NOT NULL DEFAULT 'Open' CONSTRAINT ck_commissioning_differences_disposition CHECK(disposition IN ('Open','Matches','AcceptedAsBuilt','ReferredToChange','RejectedCorrectionRequired')),
 disposition_reason text CONSTRAINT ck_commissioning_differences_reason CHECK(length(btrim(disposition_reason)) BETWEEN 1 AND 1000), disposition_by uuid, disposition_at timestamptz,
 change_id uuid, redline_id uuid, sort_order integer NOT NULL DEFAULT 0,
 UNIQUE(workspace_id,id), CONSTRAINT uq_commissioning_differences_key UNIQUE(workspace_id,configuration_id,item_key),
 CONSTRAINT ck_commissioning_differences_disposed CHECK((disposition='Open')=(disposition_by IS NULL) AND num_nonnulls(disposition_reason,disposition_by,disposition_at) IN (0,3)),
 CONSTRAINT ck_commissioning_differences_referred CHECK(disposition<>'ReferredToChange' OR change_id IS NOT NULL),
 -- "Matches" and "accepted as built" rest on a verified observation of a known value; an unknown is neither.
 CONSTRAINT ck_commissioning_differences_known CHECK(disposition NOT IN ('Matches','AcceptedAsBuilt') OR (observed_value IS NOT NULL AND observation_verified)),
 FOREIGN KEY(workspace_id,company_id,configuration_id) REFERENCES ppo.commissioning_configurations(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,change_id) REFERENCES ppo.engineering_changes(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,redline_id) REFERENCES ppo.commissioning_redlines(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,observed_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,disposition_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER difference_open BEFORE INSERT OR UPDATE OR DELETE ON ppo.commissioning_differences FOR EACH ROW EXECUTE FUNCTION ppo.commissioning_configuration_is_open();

-- Sensor, valve, controller channel and served-area relationships. A physical connection, a logical assignment
-- and a served area are different facts and one never proves another. No universal cardinality is imposed: a
-- concern is recorded only where a sourced constraint says there is one. A changed association is a successor row.
CREATE TABLE ppo.commissioning_associations (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, commissioning_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version>0), created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 kind text NOT NULL CONSTRAINT ck_commissioning_associations_kind CHECK(kind IN ('PhysicalConnection','LogicalAssignment','ServedArea')),
 from_reference text NOT NULL CONSTRAINT ck_commissioning_associations_from CHECK(length(btrim(from_reference)) BETWEEN 1 AND 120), from_asset_id uuid,
 to_reference text NOT NULL CONSTRAINT ck_commissioning_associations_to CHECK(length(btrim(to_reference)) BETWEEN 1 AND 120), to_asset_id uuid,
 source text NOT NULL CONSTRAINT ck_commissioning_associations_source CHECK(length(btrim(source)) BETWEEN 1 AND 300),
 confirmation_method text CONSTRAINT ck_commissioning_associations_method CHECK(length(btrim(confirmation_method)) BETWEEN 1 AND 300), effective_from timestamptz NOT NULL,
 state text NOT NULL DEFAULT 'Proposed' CONSTRAINT ck_commissioning_associations_state CHECK(state IN ('Proposed','Confirmed','ReviewRequired','Superseded')),
 concern text CONSTRAINT ck_commissioning_associations_concern CHECK(length(btrim(concern)) BETWEEN 1 AND 600), constraint_source text CONSTRAINT ck_commissioning_associations_constraint CHECK(length(btrim(constraint_source)) BETWEEN 1 AND 300),
 affected_checks jsonb NOT NULL DEFAULT '[]' CONSTRAINT ck_commissioning_associations_checks CHECK(jsonb_typeof(affected_checks)='array' AND jsonb_array_length(affected_checks)<=40),
 predecessor_id uuid, reviewer_id uuid, reviewed_at timestamptz, review_note text CONSTRAINT ck_commissioning_associations_note CHECK(length(btrim(review_note)) BETWEEN 1 AND 1000),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id),
 CONSTRAINT ck_commissioning_associations_concern_sourced CHECK((concern IS NULL)=(constraint_source IS NULL) AND (state<>'ReviewRequired' OR concern IS NOT NULL)),
 CONSTRAINT ck_commissioning_associations_confirmed CHECK((state='Confirmed')<=(reviewer_id IS NOT NULL AND confirmation_method IS NOT NULL) AND num_nonnulls(reviewer_id,reviewed_at,review_note) IN (0,3)),
 FOREIGN KEY(workspace_id,company_id,commissioning_id) REFERENCES ppo.commissioning_packages(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,from_asset_id) REFERENCES ppo.assets(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,to_asset_id) REFERENCES ppo.assets(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,predecessor_id) REFERENCES ppo.commissioning_associations(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,reviewer_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER association_retained BEFORE DELETE ON ppo.commissioning_associations FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TRIGGER association_guards BEFORE UPDATE ON ppo.commissioning_associations FOR EACH ROW EXECUTE FUNCTION ppo.commissioning_frozen('company_id,commissioning_id,kind,from_reference,from_asset_id,to_reference,to_asset_id,effective_from,predecessor_id','state','-','');

-- Configuration backup references. Available, identity verified and restore verified are three separately
-- evidenced facts: a backup that exists, or that downloaded, proves nothing about recoverability. Only a
-- reference and its metadata are held. No controller is contacted and no credential or backup content is stored.
CREATE TABLE ppo.commissioning_backups (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, commissioning_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version>0), created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 asset_reference text NOT NULL CONSTRAINT ck_commissioning_backups_asset CHECK(length(btrim(asset_reference)) BETWEEN 1 AND 120), asset_id uuid,
 purpose text NOT NULL CONSTRAINT ck_commissioning_backups_purpose CHECK(length(btrim(purpose)) BETWEEN 1 AND 300),
 configuration_version text NOT NULL CONSTRAINT ck_commissioning_backups_configuration CHECK(length(btrim(configuration_version)) BETWEEN 1 AND 80),
 native_format text NOT NULL CONSTRAINT ck_commissioning_backups_format CHECK(length(btrim(native_format)) BETWEEN 1 AND 60),
 stored_reference text NOT NULL CONSTRAINT ck_commissioning_backups_reference CHECK(length(btrim(stored_reference)) BETWEEN 1 AND 300), content_hash text CHECK(content_hash ~ '^[a-f0-9]{64}$'),
 captured_at timestamptz NOT NULL, author_id uuid NOT NULL, access_class text NOT NULL DEFAULT 'Restricted' CONSTRAINT ck_commissioning_backups_access CHECK(access_class IN ('Internal','Restricted')),
 compatibility text CONSTRAINT ck_commissioning_backups_compatibility CHECK(length(btrim(compatibility)) BETWEEN 1 AND 300),
 required_stage text NOT NULL DEFAULT 'TechnicalIssue' CONSTRAINT ck_commissioning_backups_stage CHECK(required_stage IN ('TestPrerequisite','TechnicalIssue','CustomerHandover','ServiceAcceptance')),
 available_evidence text, available_by uuid, available_at timestamptz, identity_evidence text, identity_by uuid, identity_at timestamptz, restore_evidence text, restore_by uuid, restore_at timestamptz,
 UNIQUE(workspace_id,id),
 CONSTRAINT ck_commissioning_backups_available CHECK(num_nonnulls(available_evidence,available_by,available_at) IN (0,3)),
 CONSTRAINT ck_commissioning_backups_identity CHECK(num_nonnulls(identity_evidence,identity_by,identity_at) IN (0,3) AND (identity_at IS NULL OR (available_at IS NOT NULL AND content_hash IS NOT NULL))),
 CONSTRAINT ck_commissioning_backups_restore CHECK(num_nonnulls(restore_evidence,restore_by,restore_at) IN (0,3) AND (restore_at IS NULL OR identity_at IS NOT NULL)),
 FOREIGN KEY(workspace_id,company_id,commissioning_id) REFERENCES ppo.commissioning_packages(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,asset_id) REFERENCES ppo.assets(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,author_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,available_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,identity_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,restore_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER backup_retained BEFORE DELETE ON ppo.commissioning_backups FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TRIGGER backup_guards BEFORE UPDATE ON ppo.commissioning_backups FOR EACH ROW EXECUTE FUNCTION ppo.commissioning_frozen('company_id,commissioning_id,asset_reference,asset_id,configuration_version,stored_reference,content_hash,captured_at,author_id','access_class','-','');

-- Training, manuals, support context, warranty context, holds and other obligations. Each declares the stage it
-- is required for; planned, delivered, evidenced and competence confirmed are different facts with their own
-- dates, and none of them starts a warranty or schedules maintenance.
CREATE TABLE ppo.commissioning_obligations (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, commissioning_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version>0), created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 kind text NOT NULL CONSTRAINT ck_commissioning_obligations_kind CHECK(kind IN ('Training','Manual','BackupReference','SupportContext','WarrantyMaintenance','Hold','Other')),
 title text NOT NULL CONSTRAINT ck_commissioning_obligations_title CHECK(length(btrim(title)) BETWEEN 1 AND 200),
 required_stage text NOT NULL CONSTRAINT ck_commissioning_obligations_stage CHECK(required_stage IN ('TestPrerequisite','TechnicalIssue','CustomerHandover','ServiceAcceptance')),
 state text NOT NULL DEFAULT 'Open' CONSTRAINT ck_commissioning_obligations_state CHECK(state IN ('Open','Planned','Delivered','EvidenceRecorded','CompetenceConfirmed','Complete','Dispositioned')),
 subject text CONSTRAINT ck_commissioning_obligations_subject CHECK(length(btrim(subject)) BETWEEN 1 AND 300), content_revision text CONSTRAINT ck_commissioning_obligations_revision CHECK(length(btrim(content_revision)) BETWEEN 1 AND 40),
 source_reference text CONSTRAINT ck_commissioning_obligations_source CHECK(length(btrim(source_reference)) BETWEEN 1 AND 300),
 planned_on date, delivered_on date, evidence text CONSTRAINT ck_commissioning_obligations_evidence CHECK(length(btrim(evidence)) BETWEEN 1 AND 600),
 competence_note text CONSTRAINT ck_commissioning_obligations_competence CHECK(length(btrim(competence_note)) BETWEEN 1 AND 600),
 disposition_reason text CONSTRAINT ck_commissioning_obligations_disposition CHECK(length(btrim(disposition_reason)) BETWEEN 1 AND 1000), disposition_authority text CONSTRAINT ck_commissioning_obligations_authority CHECK(length(btrim(disposition_authority)) BETWEEN 1 AND 300),
 owner_id uuid NOT NULL, due date,
 UNIQUE(workspace_id,id),
 -- Each later fact needs the one before it: nothing is evidenced that was not delivered, and competence is never implied by attendance.
 CONSTRAINT ck_commissioning_obligations_facts CHECK((state NOT IN ('Delivered','EvidenceRecorded','CompetenceConfirmed') OR delivered_on IS NOT NULL) AND (state NOT IN ('EvidenceRecorded','CompetenceConfirmed','Complete') OR evidence IS NOT NULL)
  AND (state<>'CompetenceConfirmed' OR competence_note IS NOT NULL) AND (state<>'Dispositioned' OR (disposition_reason IS NOT NULL AND disposition_authority IS NOT NULL))),
 FOREIGN KEY(workspace_id,company_id,commissioning_id) REFERENCES ppo.commissioning_packages(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER obligation_retained BEFORE DELETE ON ppo.commissioning_obligations FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TRIGGER obligation_guards BEFORE UPDATE ON ppo.commissioning_obligations FOR EACH ROW EXECUTE FUNCTION ppo.commissioning_frozen('company_id,commissioning_id,kind,required_stage','state','-','');

-- =====================================================================================================
-- An as-built release revision. The candidate is frozen when it is submitted: review and approval bind that
-- exact manifest hash, and a material edit is a successor revision that inherits no decision. Approve for issue
-- and issue are separate facts. Issued requires exact durable outputs and the committed issue event together.
CREATE TABLE ppo.commissioning_releases (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, commissioning_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version>0), created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 release_number integer NOT NULL CHECK(release_number>0), revision_number integer NOT NULL DEFAULT 1 CHECK(revision_number>0), predecessor_id uuid,
 reference text NOT NULL CONSTRAINT ck_commissioning_releases_reference CHECK(reference ~ '^AB-[0-9]{3,5}$'),
 state text NOT NULL DEFAULT 'Draft' CONSTRAINT ck_commissioning_releases_state CHECK(state IN ('Draft','InReview','ApprovedForIssue','Issued','Withdrawn','Superseded')),
 partial boolean NOT NULL DEFAULT false, scope_id uuid NOT NULL, basis_id uuid NOT NULL, configuration_id uuid NOT NULL,
 included jsonb NOT NULL DEFAULT '[]' CONSTRAINT ck_commissioning_releases_included CHECK(jsonb_typeof(included)='array' AND jsonb_array_length(included)<=60),
 excluded jsonb NOT NULL DEFAULT '[]' CONSTRAINT ck_commissioning_releases_excluded CHECK(jsonb_typeof(excluded)='array' AND jsonb_array_length(excluded)<=60),
 audience text NOT NULL DEFAULT 'Internal' CONSTRAINT ck_commissioning_releases_audience CHECK(audience IN ('Internal','Customer')),
 recipients jsonb NOT NULL DEFAULT '[]' CONSTRAINT ck_commissioning_releases_recipients CHECK(jsonb_typeof(recipients)='array' AND jsonb_array_length(recipients)<=12),
 manifest jsonb NOT NULL DEFAULT '{}' CONSTRAINT ck_commissioning_releases_manifest CHECK(jsonb_typeof(manifest)='object'), manifest_hash text NOT NULL CHECK(manifest_hash ~ '^[a-f0-9]{64}$'),
 submitted_hash text CHECK(submitted_hash ~ '^[a-f0-9]{64}$'), submitted_by uuid, submitted_at timestamptz,
 approved_by uuid, approved_at timestamptz, approval_reason text CONSTRAINT ck_commissioning_releases_approval CHECK(length(btrim(approval_reason)) BETWEEN 1 AND 2000),
 approval_source_state jsonb, policy_id uuid, policy_version integer, independence_required boolean, approval_operation_id uuid,
 return_reason text CONSTRAINT ck_commissioning_releases_return CHECK(length(btrim(return_reason)) BETWEEN 1 AND 2000), returned_by uuid, returned_at timestamptz,
 issued_by uuid, issued_at timestamptz, issue_operation_id uuid, issue_source_state jsonb,
 withdrawn_by uuid, withdrawn_at timestamptz, withdrawn_reason text CONSTRAINT ck_commissioning_releases_withdrawn CHECK(length(btrim(withdrawn_reason)) BETWEEN 1 AND 2000), successor_id uuid,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id), CONSTRAINT uq_commissioning_releases_revision UNIQUE(workspace_id,commissioning_id,release_number,revision_number),
 CONSTRAINT ck_commissioning_releases_submitted CHECK((state='Draft' AND returned_by IS NULL)<=(submitted_hash IS NULL) AND num_nonnulls(submitted_hash,submitted_by,submitted_at) IN (0,3)),
 CONSTRAINT ck_commissioning_releases_approved CHECK((state IN ('ApprovedForIssue','Issued'))<=(approved_by IS NOT NULL) AND num_nonnulls(approved_by,approved_at,approval_reason,approval_source_state,policy_id,policy_version,independence_required,approval_operation_id) IN (0,8)),
 CONSTRAINT ck_commissioning_releases_issued CHECK((state='Issued')<=(issued_by IS NOT NULL) AND num_nonnulls(issued_by,issued_at,issue_operation_id,issue_source_state) IN (0,4) AND (issued_by IS NULL OR approved_by IS NOT NULL)),
 CONSTRAINT ck_commissioning_releases_withdrawal CHECK((state='Withdrawn')=(withdrawn_by IS NOT NULL) AND num_nonnulls(withdrawn_by,withdrawn_at,withdrawn_reason) IN (0,3)),
 CONSTRAINT ck_commissioning_releases_independent CHECK(independence_required IS NOT TRUE OR approved_by IS DISTINCT FROM submitted_by),
 FOREIGN KEY(workspace_id,company_id,commissioning_id) REFERENCES ppo.commissioning_packages(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,predecessor_id) REFERENCES ppo.commissioning_releases(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,successor_id) REFERENCES ppo.commissioning_releases(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,scope_id) REFERENCES ppo.commissioning_scopes(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,basis_id) REFERENCES ppo.commissioning_bases(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,configuration_id) REFERENCES ppo.commissioning_configurations(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,policy_id) REFERENCES ppo.commissioning_policies(workspace_id,id),
 FOREIGN KEY(workspace_id,submitted_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,approved_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,returned_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,issued_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,withdrawn_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER release_retained BEFORE DELETE ON ppo.commissioning_releases FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
-- One candidate of a package is in progress at a time. An issued release stays issued while its successor
-- revision is prepared, reviewed and approved; issuing the successor is what supersedes it.
CREATE UNIQUE INDEX uq_commissioning_releases_candidate ON ppo.commissioning_releases(workspace_id,commissioning_id) WHERE state IN ('Draft','InReview','ApprovedForIssue');
CREATE FUNCTION ppo.protect_commissioning_release() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.version<>OLD.version+1 THEN RAISE EXCEPTION 'Advance the release version' USING ERRCODE='55000'; END IF;
 IF (NEW.company_id,NEW.commissioning_id,NEW.release_number,NEW.revision_number,NEW.predecessor_id,NEW.reference) IS DISTINCT FROM (OLD.company_id,OLD.commissioning_id,OLD.release_number,OLD.revision_number,OLD.predecessor_id,OLD.reference) THEN
  RAISE EXCEPTION 'The lineage of a release revision is permanent' USING ERRCODE='55000'; END IF;
 IF OLD.state IN ('Withdrawn','Superseded') AND (OLD.state<>NEW.state OR NEW.successor_id IS NOT DISTINCT FROM OLD.successor_id) THEN RAISE EXCEPTION 'A withdrawn or superseded release is history' USING ERRCODE='55000'; END IF;
 IF NOT (OLD.state=NEW.state OR (OLD.state='Draft' AND NEW.state='InReview') OR (OLD.state='InReview' AND NEW.state IN ('ApprovedForIssue','Draft')) OR (OLD.state='ApprovedForIssue' AND NEW.state IN ('Issued','Superseded'))
  OR (OLD.state='Issued' AND NEW.state IN ('Withdrawn','Superseded')) OR (OLD.state='Draft' AND NEW.state='Superseded')) THEN
  RAISE EXCEPTION 'A release moves Draft, In review, Approved for issue, Issued, then Withdrawn or Superseded' USING ERRCODE='55000'; END IF;
 -- The candidate is frozen from submission. A return reopens the same revision as a draft only by clearing its hash,
 -- which the application does with a new manifest: no decision ever migrates onto edited content.
 IF OLD.state<>'Draft' AND NEW.state<>'Draft' AND (NEW.partial,NEW.scope_id,NEW.basis_id,NEW.configuration_id,NEW.included,NEW.excluded,NEW.audience,NEW.recipients,NEW.manifest,NEW.manifest_hash,NEW.submitted_hash)
  IS DISTINCT FROM (OLD.partial,OLD.scope_id,OLD.basis_id,OLD.configuration_id,OLD.included,OLD.excluded,OLD.audience,OLD.recipients,OLD.manifest,OLD.manifest_hash,OLD.submitted_hash) THEN
  RAISE EXCEPTION 'A submitted release candidate is frozen; a material edit is a successor revision' USING ERRCODE='55000'; END IF;
 IF NEW.state='Issued' AND OLD.state='ApprovedForIssue' AND (SELECT count(*) FROM ppo.commissioning_outputs o WHERE (o.workspace_id,o.release_id)=(NEW.workspace_id,NEW.id) AND o.manifest_hash=NEW.manifest_hash AND o.state='Issued')<1 THEN
  RAISE EXCEPTION 'A release is issued together with its exact durable output' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;

-- Exact outputs (OUT-12 Commissioning/test record, OUT-13 Handover pack). The id is the reserved output identity
-- and the storage key, so a crash after rendering recovers the same bytes and never makes a second output.
-- prepared_at is when the bytes were reserved and rendered; issued_at is the actual issue event. They differ,
-- and issued bytes are never altered to add a later date or signature.
CREATE TABLE ppo.commissioning_outputs (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, commissioning_id uuid NOT NULL, release_id uuid NOT NULL, handover_id uuid,
 version integer NOT NULL DEFAULT 1 CHECK(version>0),
 kind text NOT NULL CONSTRAINT ck_commissioning_outputs_kind CHECK(kind IN ('OUT-12','OUT-13')),
 audience text NOT NULL CONSTRAINT ck_commissioning_outputs_audience CHECK(audience IN ('Internal','Customer')),
 template_version text NOT NULL CONSTRAINT ck_commissioning_outputs_template CHECK(length(btrim(template_version)) BETWEEN 1 AND 120), renderer_version text NOT NULL,
 manifest_hash text NOT NULL CHECK(manifest_hash ~ '^[a-f0-9]{64}$'), content jsonb NOT NULL CONSTRAINT ck_commissioning_outputs_content CHECK(jsonb_typeof(content)='object'),
 -- One stored bundle per output, under this id: the exact HTML and PDF together with what they were prepared from.
 bundle_sha256 text NOT NULL CHECK(bundle_sha256 ~ '^[a-f0-9]{64}$'), bundle_bytes integer NOT NULL CHECK(bundle_bytes>0),
 html_sha256 text NOT NULL CHECK(html_sha256 ~ '^[a-f0-9]{64}$'), html_bytes integer NOT NULL CHECK(html_bytes>0),
 pdf_sha256 text NOT NULL CHECK(pdf_sha256 ~ '^[a-f0-9]{64}$'), pdf_bytes integer NOT NULL CHECK(pdf_bytes>0),
 state text NOT NULL DEFAULT 'Prepared' CONSTRAINT ck_commissioning_outputs_state CHECK(state IN ('Prepared','Issued','Discarded')),
 prepared_by uuid NOT NULL, prepared_at timestamptz NOT NULL, prepare_operation_id uuid NOT NULL, issued_at timestamptz, issue_operation_id uuid,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id),
 CONSTRAINT ck_commissioning_outputs_issued CHECK((state='Issued')=(issued_at IS NOT NULL) AND num_nonnulls(issued_at,issue_operation_id) IN (0,2) AND (issued_at IS NULL OR issued_at>=prepared_at)),
 CONSTRAINT ck_commissioning_outputs_pack CHECK((kind='OUT-13')=(handover_id IS NOT NULL)),
 FOREIGN KEY(workspace_id,company_id,commissioning_id) REFERENCES ppo.commissioning_packages(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,release_id) REFERENCES ppo.commissioning_releases(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,prepared_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE INDEX ix_commissioning_outputs_release ON ppo.commissioning_outputs(workspace_id,release_id,kind,state);
CREATE TRIGGER output_retained BEFORE DELETE ON ppo.commissioning_outputs FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.protect_commissioning_output() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.version<>OLD.version+1 OR OLD.state<>'Prepared' OR NEW.state='Prepared' OR (to_jsonb(NEW)-'version'-'state'-'issued_at'-'issue_operation_id')<>(to_jsonb(OLD)-'version'-'state'-'issued_at'-'issue_operation_id') THEN
  RAISE EXCEPTION 'Prepared bytes are issued or discarded once, exactly as they were prepared' USING ERRCODE='55000'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER output_guards BEFORE UPDATE ON ppo.commissioning_outputs FOR EACH ROW EXECUTE FUNCTION ppo.protect_commissioning_output();
CREATE TRIGGER release_guards BEFORE UPDATE ON ppo.commissioning_releases FOR EACH ROW EXECUTE FUNCTION ppo.protect_commissioning_release();

-- A receiving request: one stable identity per issued release, destination, recipient and purpose. Technical
-- release, Equipment receiving, Service acceptance and Project staged acceptance are separate outcomes; none
-- cascades into another. A correction is a new submission under the same identity.
CREATE TABLE ppo.commissioning_handovers (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, commissioning_id uuid NOT NULL, release_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version>0), created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 destination text NOT NULL CONSTRAINT ck_commissioning_handovers_destination CHECK(destination IN ('Service','Equipment','Projects')),
 recipient_id uuid NOT NULL, purpose text NOT NULL CONSTRAINT ck_commissioning_handovers_purpose CHECK(length(btrim(purpose)) BETWEEN 1 AND 300),
 support_owner_id uuid, due date, created_operation_id uuid NOT NULL,
 adapter text NOT NULL DEFAULT 'SyntheticReceiverFixture' CONSTRAINT ck_commissioning_handovers_adapter CHECK(adapter='SyntheticReceiverFixture'),
 cancelled_by uuid, cancelled_at timestamptz, cancelled_reason text CONSTRAINT ck_commissioning_handovers_cancelled_reason CHECK(length(btrim(cancelled_reason)) BETWEEN 1 AND 1000),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id),
 CONSTRAINT ck_commissioning_handovers_cancelled CHECK(num_nonnulls(cancelled_by,cancelled_at,cancelled_reason) IN (0,3)),
 FOREIGN KEY(workspace_id,company_id,commissioning_id) REFERENCES ppo.commissioning_packages(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,release_id) REFERENCES ppo.commissioning_releases(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,recipient_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,support_owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,cancelled_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE UNIQUE INDEX uq_commissioning_handovers_request ON ppo.commissioning_handovers(workspace_id,release_id,destination,recipient_id) WHERE cancelled_at IS NULL;
CREATE TRIGGER handover_retained BEFORE DELETE ON ppo.commissioning_handovers FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TRIGGER handover_guards BEFORE UPDATE ON ppo.commissioning_handovers FOR EACH ROW EXECUTE FUNCTION ppo.commissioning_frozen('company_id,commissioning_id,release_id,destination,recipient_id,purpose,created_operation_id,adapter','adapter','-','');
ALTER TABLE ppo.commissioning_outputs ADD FOREIGN KEY(workspace_id,company_id,handover_id) REFERENCES ppo.commissioning_handovers(workspace_id,company_id,id);

-- Each exact manifest sent to a receiver and the one outcome recorded against it. An accepted earlier manifest
-- never accepts its successor. Delivery is what the receiving adapter reported: a receiver that could not be
-- reached is Unknown or Unavailable, never "not requested" and never accepted.
CREATE TABLE ppo.commissioning_handover_submissions (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, handover_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version>0), submission_number integer NOT NULL CHECK(submission_number>0),
 manifest jsonb NOT NULL CONSTRAINT ck_commissioning_handover_submissions_manifest CHECK(jsonb_typeof(manifest)='object'), manifest_hash text NOT NULL CHECK(manifest_hash ~ '^[a-f0-9]{64}$'),
 output_id uuid, correction_note text CONSTRAINT ck_commissioning_handover_submissions_note CHECK(length(btrim(correction_note)) BETWEEN 1 AND 2000),
 submitted_by uuid NOT NULL, submitted_at timestamptz NOT NULL DEFAULT clock_timestamp(), operation_id uuid NOT NULL,
 delivery text NOT NULL DEFAULT 'Delivered' CONSTRAINT ck_commissioning_handover_submissions_delivery CHECK(delivery IN ('Delivered','Pending','Unknown','Unavailable')), delivery_checked_at timestamptz,
 outcome text CONSTRAINT ck_commissioning_handover_submissions_outcome CHECK(outcome IN ('Accepted','Returned','ClarificationRequired')),
 outcome_reason text CONSTRAINT ck_commissioning_handover_submissions_reason CHECK(length(btrim(outcome_reason)) BETWEEN 1 AND 2000),
 outcome_by uuid, outcome_at timestamptz, outcome_operation_id uuid, return_owner_id uuid, return_due date,
 UNIQUE(workspace_id,id), CONSTRAINT uq_commissioning_handover_submissions_number UNIQUE(workspace_id,handover_id,submission_number),
 CONSTRAINT ck_commissioning_handover_submissions_decided CHECK(num_nonnulls(outcome,outcome_reason,outcome_by,outcome_at,outcome_operation_id) IN (0,5) AND (outcome IS NULL OR delivery='Delivered')),
 CONSTRAINT ck_commissioning_handover_submissions_returned CHECK(outcome IS NULL OR outcome='Accepted' OR (return_owner_id IS NOT NULL AND return_due IS NOT NULL)),
 -- A manifest is decided by its receiver, never by whoever sent it.
 CONSTRAINT ck_commissioning_handover_submissions_independent CHECK(outcome_by IS DISTINCT FROM submitted_by),
 FOREIGN KEY(workspace_id,company_id,handover_id) REFERENCES ppo.commissioning_handovers(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,output_id) REFERENCES ppo.commissioning_outputs(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,submitted_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,outcome_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,return_owner_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER handover_submission_retained BEFORE DELETE ON ppo.commissioning_handover_submissions FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.protect_commissioning_handover_submission() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.outcome IS NOT NULL OR NEW.version<>OLD.version+1 OR (NEW.handover_id,NEW.submission_number,NEW.manifest,NEW.manifest_hash,NEW.output_id,NEW.correction_note,NEW.submitted_by,NEW.submitted_at,NEW.operation_id)
  IS DISTINCT FROM (OLD.handover_id,OLD.submission_number,OLD.manifest,OLD.manifest_hash,OLD.output_id,OLD.correction_note,OLD.submitted_by,OLD.submitted_at,OLD.operation_id) THEN
  RAISE EXCEPTION 'A submitted manifest and its recorded outcome are permanent' USING ERRCODE='55000'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER handover_submission_guards BEFORE UPDATE ON ppo.commissioning_handover_submissions FOR EACH ROW EXECUTE FUNCTION ppo.protect_commissioning_handover_submission();

-- A recorded source check: who asked the upstream adapter, when, and what it answered. The time shown beside
-- "Sources current" is this row's time and never the time a screen happened to load. A manual assessment names
-- its assessor and evidence; ticking a box is not one.
CREATE TABLE ppo.commissioning_source_checks (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, commissioning_id uuid NOT NULL,
 result text NOT NULL CONSTRAINT ck_commissioning_source_checks_result CHECK(result IN ('Current','ReassessmentRequired','Unavailable','Restricted','NotCaptured')),
 details jsonb NOT NULL, adapter text NOT NULL CONSTRAINT ck_commissioning_source_checks_adapter CHECK(adapter IN ('SyntheticUpstreamFixture','ManualAssessment')),
 assessment_evidence text CONSTRAINT ck_commissioning_source_checks_evidence CHECK(length(btrim(assessment_evidence)) BETWEEN 1 AND 600),
 operation_id uuid NOT NULL, checked_by uuid NOT NULL, checked_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id), CONSTRAINT ck_commissioning_source_checks_manual CHECK((adapter='ManualAssessment')=(assessment_evidence IS NOT NULL)),
 FOREIGN KEY(workspace_id,company_id,commissioning_id) REFERENCES ppo.commissioning_packages(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,checked_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER source_check_immutable BEFORE UPDATE OR DELETE ON ppo.commissioning_source_checks FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE INDEX ix_commissioning_source_checks_package ON ppo.commissioning_source_checks(workspace_id,commissioning_id,checked_at DESC);

-- Append-only history for every subject in the module, written in the same transaction as the change.
CREATE TABLE ppo.commissioning_events (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, package_id uuid NOT NULL, commissioning_id uuid NOT NULL,
 subject_type text NOT NULL CONSTRAINT ck_commissioning_events_subject CHECK(subject_type IN ('Package','Scope','Basis','Attempt','Review','Defect','Configuration','Difference','Redline','Association','Backup','Obligation','Release','Output','Handover','Submission','SourceCheck')),
 subject_id uuid NOT NULL, record_version integer NOT NULL CHECK(record_version>0),
 event_type text NOT NULL CONSTRAINT ck_commissioning_events_type CHECK(event_type ~ '^[A-Z][A-Za-z]{2,59}$'),
 reason text NOT NULL CONSTRAINT ck_commissioning_events_reason CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),
 note text CONSTRAINT ck_commissioning_events_note CHECK(length(btrim(note)) BETWEEN 1 AND 2000),
 snapshot jsonb NOT NULL, operation_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 UNIQUE(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,package_id) REFERENCES ppo.engineering_packages(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,commissioning_id) REFERENCES ppo.commissioning_packages(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER event_immutable BEFORE UPDATE OR DELETE ON ppo.commissioning_events FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE INDEX ix_commissioning_events_package ON ppo.commissioning_events(workspace_id,package_id,created_at DESC,id);
CREATE INDEX ix_commissioning_events_record ON ppo.commissioning_events(workspace_id,commissioning_id,created_at DESC);
