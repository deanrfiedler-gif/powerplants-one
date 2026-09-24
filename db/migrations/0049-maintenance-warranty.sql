-- ADR-0049 / SVC-12.1–SVC-12.5. Synthetic native records; no external transaction.
SET CONSTRAINTS ppo.identity_target IMMEDIATE;
DO $$ DECLARE r record; d text; BEGIN
 FOR r IN SELECT * FROM (VALUES
 ('business_identities','ck_identities_type','object_type','ServiceAgreement,EntitlementAssessment,MaintenancePlan,MaintenanceOccurrence,RenewalReview,WarrantyCase,SupplierClaim'),
 ('audit_events','ck_audit_object_type','object_type','ServiceAgreement,EntitlementAssessment,MaintenancePlan,MaintenanceOccurrence,RenewalReview,WarrantyCase,SupplierClaim'),
 ('outbox_jobs','ck_outbox_kind','kind','MaintenanceChanged,WarrantyChanged'),
 ('permission_grants','ck_grants_capability','capability','maintenance.read,maintenance.manage,maintenance.assess,maintenance.agreement.approve,warranty.read,warranty.manage,warranty.assess,warranty.goodwill,warranty.recovery')
 ) v(tab,con,col,added) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT d FROM pg_constraint WHERE conrelid=('ppo.'||r.tab)::regclass AND conname=r.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',r.tab,r.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR %I=ANY(%L::text[]))',r.tab,r.con,substring(d from 8 for length(d)-8),r.col,string_to_array(r.added,','));
 END LOOP;
 SELECT pg_get_functiondef('ppo.identity_has_typed_record()'::regprocedure) INTO d;
 IF position('CASE NEW.object_type' in d)=0 THEN RAISE EXCEPTION 'Inspect changed identity dispatch'; END IF;
 EXECUTE replace(d,'CASE NEW.object_type','CASE NEW.object_type WHEN ''ServiceAgreement'' THEN ''service_agreements'' WHEN ''EntitlementAssessment'' THEN ''entitlement_assessments'' WHEN ''MaintenancePlan'' THEN ''maintenance_plans'' WHEN ''MaintenanceOccurrence'' THEN ''maintenance_occurrences'' WHEN ''RenewalReview'' THEN ''renewal_reviews'' WHEN ''WarrantyCase'' THEN ''warranty_cases'' WHEN ''SupplierClaim'' THEN ''supplier_claims''');
END $$;
SET CONSTRAINTS ppo.identity_target DEFERRED;

-- Mechanical identity columns are shared; each business family has its own typed table.
DO $$ DECLARE r record; BEGIN
 FOR r IN SELECT * FROM (VALUES ('service_agreements','ServiceAgreement'),('entitlement_assessments','EntitlementAssessment'),('maintenance_plans','MaintenancePlan'),('maintenance_occurrences','MaintenanceOccurrence'),('renewal_reviews','RenewalReview'),('warranty_cases','WarrantyCase'),('supplier_claims','SupplierClaim')) v(tab,typ) LOOP
  EXECUTE format('CREATE TABLE ppo.%I (
   id uuid PRIMARY KEY,workspace_id uuid NOT NULL,company_id uuid NOT NULL,site_id uuid,customer_id uuid NOT NULL,owner_id uuid NOT NULL,
   reference text NOT NULL CHECK(length(reference) BETWEEN 1 AND 100),version integer NOT NULL DEFAULT 1 CHECK(version>0),
   synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),created_at timestamptz NOT NULL DEFAULT clock_timestamp(),updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),created_by uuid NOT NULL,updated_by uuid NOT NULL,
   UNIQUE(workspace_id,id),UNIQUE(workspace_id,company_id,id),UNIQUE(workspace_id,company_id,reference),
   FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
   FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id),
   FOREIGN KEY(workspace_id,company_id,site_id) REFERENCES ppo.sites(workspace_id,company_id,id),
   FOREIGN KEY(workspace_id,company_id,customer_id) REFERENCES ppo.organisations(workspace_id,company_id,id),
   FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),
   FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id))',r.tab);
  EXECUTE format('CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.%I FOR EACH ROW EXECUTE FUNCTION ppo.register_identity(%L,'''')',r.tab,r.typ);
  EXECUTE format('CREATE TRIGGER retain_record BEFORE DELETE ON ppo.%I FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence()',r.tab);
  EXECUTE format('CREATE INDEX ON ppo.%I(workspace_id,company_id,site_id,updated_at DESC,id)',r.tab);
 END LOOP;
END $$;

ALTER TABLE ppo.service_agreements ADD state text NOT NULL DEFAULT 'Proposed' CHECK(state IN ('Proposed','Active','Withdrawn')),ADD current_revision_id uuid NOT NULL,ADD revision integer NOT NULL DEFAULT 1 CHECK(revision>0);
CREATE TABLE ppo.agreement_revisions (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,company_id uuid NOT NULL,agreement_id uuid NOT NULL,revision integer NOT NULL CHECK(revision>0),predecessor_id uuid,
 content jsonb NOT NULL CHECK(jsonb_typeof(content)='object' AND octet_length(content::text)<=65536),content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'),
 created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),reason text NOT NULL,
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,company_id,id),UNIQUE(workspace_id,agreement_id,id),UNIQUE(workspace_id,agreement_id,revision),
 FOREIGN KEY(workspace_id,company_id,agreement_id) REFERENCES ppo.service_agreements(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,agreement_id,predecessor_id) REFERENCES ppo.agreement_revisions(workspace_id,agreement_id,id),FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id));
ALTER TABLE ppo.service_agreements ADD FOREIGN KEY(workspace_id,id,current_revision_id) REFERENCES ppo.agreement_revisions(workspace_id,agreement_id,id) DEFERRABLE INITIALLY DEFERRED;
CREATE TABLE ppo.agreement_scope (
 workspace_id uuid NOT NULL,company_id uuid NOT NULL,revision_id uuid NOT NULL,site_id uuid NOT NULL,mode text NOT NULL CHECK(mode IN ('WholeSite','SelectedFacilities')),
 PRIMARY KEY(workspace_id,revision_id,site_id),FOREIGN KEY(workspace_id,company_id,revision_id) REFERENCES ppo.agreement_revisions(workspace_id,company_id,id),FOREIGN KEY(workspace_id,company_id,site_id) REFERENCES ppo.sites(workspace_id,company_id,id));
CREATE TABLE ppo.agreement_scope_assets (
 workspace_id uuid NOT NULL,company_id uuid NOT NULL,revision_id uuid NOT NULL,asset_id uuid NOT NULL,site_id uuid NOT NULL,excluded boolean NOT NULL,
 PRIMARY KEY(workspace_id,revision_id,asset_id),FOREIGN KEY(workspace_id,revision_id,site_id) REFERENCES ppo.agreement_scope(workspace_id,revision_id,site_id),FOREIGN KEY(workspace_id,company_id,asset_id) REFERENCES ppo.assets(workspace_id,company_id,id));
CREATE TABLE ppo.agreement_scope_facilities (
 workspace_id uuid NOT NULL,company_id uuid NOT NULL,revision_id uuid NOT NULL,facility_id uuid NOT NULL,site_id uuid NOT NULL,excluded boolean NOT NULL,
 PRIMARY KEY(workspace_id,revision_id,facility_id),FOREIGN KEY(workspace_id,revision_id,site_id) REFERENCES ppo.agreement_scope(workspace_id,revision_id,site_id),FOREIGN KEY(workspace_id,company_id,facility_id) REFERENCES ppo.facilities(workspace_id,company_id,id));

ALTER TABLE ppo.warranty_cases ADD asset_id uuid NOT NULL,ADD event_date date NOT NULL CHECK(isfinite(event_date)),ADD symptoms text NOT NULL,
 ADD state text NOT NULL DEFAULT 'Open' CHECK(state IN ('Open','Resolved')),ADD evidence_revision integer NOT NULL DEFAULT 0 CHECK(evidence_revision>=0),
 ADD next_review date CHECK(isfinite(next_review)),ADD next_action text NOT NULL,ADD source jsonb NOT NULL,ADD asset_snapshot jsonb NOT NULL,
 ADD FOREIGN KEY(workspace_id,company_id,asset_id) REFERENCES ppo.assets(workspace_id,company_id,id);
ALTER TABLE ppo.entitlement_assessments ADD asset_id uuid,ADD facility_id uuid,ADD warranty_case_id uuid,ADD agreement_revision_id uuid,
 ADD event_date date NOT NULL CHECK(isfinite(event_date)),ADD status text NOT NULL CHECK(status IN ('Unknown','Covered','NotCovered','Disputed','NotApplicable')),
 ADD basis text NOT NULL,ADD cause text NOT NULL,ADD review_due date CHECK(isfinite(review_due)),ADD next_action text NOT NULL,ADD context_hash text NOT NULL CHECK(context_hash ~ '^[a-f0-9]{64}$'),ADD context jsonb NOT NULL,
 ADD FOREIGN KEY(workspace_id,company_id,asset_id) REFERENCES ppo.assets(workspace_id,company_id,id),ADD FOREIGN KEY(workspace_id,company_id,facility_id) REFERENCES ppo.facilities(workspace_id,company_id,id),
 ADD FOREIGN KEY(workspace_id,company_id,warranty_case_id) REFERENCES ppo.warranty_cases(workspace_id,company_id,id),ADD FOREIGN KEY(workspace_id,company_id,agreement_revision_id) REFERENCES ppo.agreement_revisions(workspace_id,company_id,id),
 ADD CHECK(status NOT IN ('Unknown','Disputed') OR review_due IS NOT NULL);
ALTER TABLE ppo.coverage_assessments ADD entitlement_assessment_id uuid,ADD FOREIGN KEY(workspace_id,company_id,entitlement_assessment_id) REFERENCES ppo.entitlement_assessments(workspace_id,company_id,id);

ALTER TABLE ppo.maintenance_plans ADD asset_id uuid NOT NULL,ADD state text NOT NULL DEFAULT 'Draft' CHECK(state IN ('Draft','Reviewed','ReviewRequired','Held')),
 ADD current_revision_id uuid NOT NULL,ADD revision integer NOT NULL DEFAULT 1 CHECK(revision>0),ADD asset_version integer NOT NULL CHECK(asset_version>0),
 ADD FOREIGN KEY(workspace_id,company_id,asset_id) REFERENCES ppo.assets(workspace_id,company_id,id);
CREATE TABLE ppo.maintenance_plan_revisions (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,company_id uuid NOT NULL,plan_id uuid NOT NULL,revision integer NOT NULL CHECK(revision>0),predecessor_id uuid,agreement_revision_id uuid NOT NULL,effective_from date NOT NULL CHECK(isfinite(effective_from)),
 content jsonb NOT NULL CHECK(jsonb_typeof(content)='object' AND octet_length(content::text)<=65536),content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'),created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),reason text NOT NULL,
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,company_id,id),UNIQUE(workspace_id,plan_id,id),UNIQUE(workspace_id,plan_id,revision),
 FOREIGN KEY(workspace_id,company_id,plan_id) REFERENCES ppo.maintenance_plans(workspace_id,company_id,id),FOREIGN KEY(workspace_id,plan_id,predecessor_id) REFERENCES ppo.maintenance_plan_revisions(workspace_id,plan_id,id),
 FOREIGN KEY(workspace_id,company_id,agreement_revision_id) REFERENCES ppo.agreement_revisions(workspace_id,company_id,id),FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id));
ALTER TABLE ppo.maintenance_plans ADD FOREIGN KEY(workspace_id,id,current_revision_id) REFERENCES ppo.maintenance_plan_revisions(workspace_id,plan_id,id) DEFERRABLE INITIALLY DEFERRED;
CREATE TABLE ppo.maintenance_plan_tasks (
 workspace_id uuid NOT NULL,revision_id uuid NOT NULL,id uuid NOT NULL,sequence integer NOT NULL CHECK(sequence>0),description text NOT NULL,expected_outcome text NOT NULL,completion_requirements text NOT NULL,kind text NOT NULL CHECK(kind IN ('Inspection','Identification','Intervention')),
 PRIMARY KEY(workspace_id,revision_id,id),UNIQUE(workspace_id,revision_id,sequence),FOREIGN KEY(workspace_id,revision_id) REFERENCES ppo.maintenance_plan_revisions(workspace_id,id));
ALTER TABLE ppo.maintenance_occurrences ADD plan_id uuid NOT NULL,ADD plan_revision_id uuid NOT NULL,ADD asset_id uuid NOT NULL,
 ADD original_due date NOT NULL CHECK(isfinite(original_due)),ADD target_date date NOT NULL CHECK(isfinite(target_date)),ADD timezone text NOT NULL,
 ADD state text NOT NULL DEFAULT 'Open' CHECK(state IN ('Open','Deferred','Skipped','Cancelled','WorkRequested','Partial','Completed')),ADD asset_snapshot jsonb NOT NULL,
 ADD UNIQUE(workspace_id,plan_id,original_due),ADD FOREIGN KEY(workspace_id,plan_id,plan_revision_id) REFERENCES ppo.maintenance_plan_revisions(workspace_id,plan_id,id),ADD FOREIGN KEY(workspace_id,company_id,asset_id) REFERENCES ppo.assets(workspace_id,company_id,id);
ALTER TABLE ppo.renewal_reviews ADD agreement_id uuid NOT NULL,ADD agreement_revision_id uuid NOT NULL,ADD revision integer NOT NULL DEFAULT 1 CHECK(revision>0),
 ADD state text NOT NULL DEFAULT 'Review' CHECK(state IN ('Review','Proposal','CustomerReview','FollowUp','Closed')),ADD review_from date NOT NULL CHECK(isfinite(review_from)),ADD next_date date NOT NULL CHECK(isfinite(next_date)),ADD next_action text NOT NULL,
 ADD proposal text,ADD customer_response text,ADD crm_activity_id uuid,ADD service_activity_id uuid,
 ADD FOREIGN KEY(workspace_id,agreement_id,agreement_revision_id) REFERENCES ppo.agreement_revisions(workspace_id,agreement_id,id),ADD FOREIGN KEY(workspace_id,company_id,crm_activity_id) REFERENCES ppo.activities(workspace_id,company_id,id),ADD FOREIGN KEY(workspace_id,company_id,service_activity_id) REFERENCES ppo.activities(workspace_id,company_id,id);

CREATE TABLE ppo.warranty_evidence (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,case_id uuid NOT NULL,revision integer NOT NULL,reference text NOT NULL,source jsonb NOT NULL,created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,case_id,revision),FOREIGN KEY(workspace_id,case_id) REFERENCES ppo.warranty_cases(workspace_id,id),FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id));
CREATE UNIQUE INDEX warranty_evidence_exact_reference ON ppo.warranty_evidence(workspace_id,case_id,lower(btrim(reference)));
CREATE TABLE ppo.warranty_resolution_plans (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,company_id uuid NOT NULL,case_id uuid NOT NULL,revision integer NOT NULL CHECK(revision>0),predecessor_id uuid,assessment_id uuid NOT NULL,
 remedy text NOT NULL CHECK(remedy IN ('Investigate','Repair','Return','Replace','Loan')),scope text NOT NULL,access_review text NOT NULL,target_date date NOT NULL CHECK(isfinite(target_date)),owner_id uuid NOT NULL,
 context_hash text NOT NULL,content_hash text NOT NULL,created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,company_id,id),UNIQUE(workspace_id,case_id,id),UNIQUE(workspace_id,case_id,revision),
 FOREIGN KEY(workspace_id,company_id,case_id) REFERENCES ppo.warranty_cases(workspace_id,company_id,id),FOREIGN KEY(workspace_id,case_id,predecessor_id) REFERENCES ppo.warranty_resolution_plans(workspace_id,case_id,id),
 FOREIGN KEY(workspace_id,company_id,assessment_id) REFERENCES ppo.entitlement_assessments(workspace_id,company_id,id),FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id));

CREATE TABLE ppo.maintenance_work_requests (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,company_id uuid NOT NULL,occurrence_id uuid,resolution_plan_id uuid,ticket_id uuid NOT NULL,assessment_id uuid NOT NULL,
 content jsonb NOT NULL,content_hash text NOT NULL,created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,ticket_id),UNIQUE(workspace_id,resolution_plan_id),CHECK((occurrence_id IS NULL)<>(resolution_plan_id IS NULL)),
 FOREIGN KEY(workspace_id,company_id,occurrence_id) REFERENCES ppo.maintenance_occurrences(workspace_id,company_id,id),FOREIGN KEY(workspace_id,company_id,resolution_plan_id) REFERENCES ppo.warranty_resolution_plans(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,ticket_id) REFERENCES ppo.tickets(workspace_id,company_id,id),FOREIGN KEY(workspace_id,company_id,assessment_id) REFERENCES ppo.entitlement_assessments(workspace_id,company_id,id),FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id));
CREATE UNIQUE INDEX occurrence_one_original_request ON ppo.maintenance_work_requests(workspace_id,occurrence_id) WHERE occurrence_id IS NOT NULL;
CREATE TABLE ppo.maintenance_service_results (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,request_id uuid NOT NULL,report_revision_id uuid NOT NULL,task_mapping jsonb NOT NULL,outcome text NOT NULL CHECK(outcome IN ('Partial','Completed')),created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,request_id,report_revision_id),FOREIGN KEY(workspace_id,request_id) REFERENCES ppo.maintenance_work_requests(workspace_id,id),FOREIGN KEY(workspace_id,report_revision_id) REFERENCES ppo.report_revisions(workspace_id,id),FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id));
CREATE TABLE ppo.warranty_customer_updates (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,case_id uuid NOT NULL,revision integer NOT NULL CHECK(revision>0),result_id uuid NOT NULL,recipient text NOT NULL,content text NOT NULL,content_hash text NOT NULL,created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,case_id,revision),FOREIGN KEY(workspace_id,case_id) REFERENCES ppo.warranty_cases(workspace_id,id),FOREIGN KEY(workspace_id,result_id) REFERENCES ppo.maintenance_service_results(workspace_id,id),FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id));
CREATE TABLE ppo.warranty_customer_responses (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,case_id uuid NOT NULL,update_id uuid NOT NULL,response text NOT NULL CHECK(response IN ('Accepted','Reservations','Disagreed','Unavailable')),evidence text NOT NULL,followup_id uuid,created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id),FOREIGN KEY(workspace_id,case_id) REFERENCES ppo.warranty_cases(workspace_id,id),FOREIGN KEY(workspace_id,update_id) REFERENCES ppo.warranty_customer_updates(workspace_id,id),FOREIGN KEY(workspace_id,followup_id) REFERENCES ppo.activities(workspace_id,id),FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),CHECK(response='Accepted' OR followup_id IS NOT NULL));

ALTER TABLE ppo.supplier_claims ADD case_id uuid NOT NULL,ADD supplier_id uuid NOT NULL,ADD scope text NOT NULL,ADD package jsonb NOT NULL,ADD package_hash text NOT NULL,
 ADD claimed_minor bigint NOT NULL CHECK(claimed_minor>0 AND claimed_minor<=1000000000000),ADD approved_minor bigint NOT NULL DEFAULT 0 CHECK(approved_minor>=0),ADD credited_minor bigint NOT NULL DEFAULT 0 CHECK(credited_minor>=0),ADD unrecovered_minor bigint NOT NULL DEFAULT 0 CHECK(unrecovered_minor>=0),
 ADD currency text NOT NULL CHECK(currency ~ '^[A-Z]{3}$'),ADD tax_basis text NOT NULL CHECK(tax_basis IN ('ExcludingTax','IncludingTax','NotApplicable')),ADD due_date date NOT NULL CHECK(isfinite(due_date)),
 ADD state text NOT NULL DEFAULT 'Prepared' CHECK(state IN ('Prepared','Submitted','Reviewing','MoreInformation','Approved','PartiallyApproved','Rejected','CreditLinked','UnrecoveredClosed')),
 ADD UNIQUE(workspace_id,case_id),ADD FOREIGN KEY(workspace_id,company_id,case_id) REFERENCES ppo.warranty_cases(workspace_id,company_id,id),ADD FOREIGN KEY(workspace_id,company_id,supplier_id) REFERENCES ppo.organisations(workspace_id,company_id,id),
 ADD CHECK(credited_minor<=approved_minor AND approved_minor<=claimed_minor AND credited_minor+unrecovered_minor<=claimed_minor);
CREATE TABLE ppo.supplier_credit_evidence (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,company_id uuid NOT NULL,claim_id uuid NOT NULL,approval_event_id uuid NOT NULL,erp_company_key text NOT NULL,credit_reference text NOT NULL,source_date date NOT NULL CHECK(isfinite(source_date)),amount_minor bigint NOT NULL CHECK(amount_minor>0),evidence text NOT NULL,reconciliation_state text NOT NULL CHECK(reconciliation_state IN ('EvidenceLinked','Reconciled')),created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id),FOREIGN KEY(workspace_id,company_id,claim_id) REFERENCES ppo.supplier_claims(workspace_id,company_id,id),FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id));
CREATE UNIQUE INDEX supplier_credit_exact_reference ON ppo.supplier_credit_evidence(workspace_id,company_id,lower(btrim(erp_company_key)),lower(btrim(credit_reference)));

-- Domain history is evidence, never an alternative business master.
CREATE TABLE ppo.maintenance_events (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,record_id uuid NOT NULL,version integer NOT NULL CHECK(version>0),action text NOT NULL,content jsonb NOT NULL CHECK(octet_length(content::text)<=131072),reason text NOT NULL,created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,record_id,version),FOREIGN KEY(workspace_id,record_id) REFERENCES ppo.business_identities(workspace_id,id),FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id));
ALTER TABLE ppo.supplier_credit_evidence ADD FOREIGN KEY(workspace_id,approval_event_id) REFERENCES ppo.maintenance_events(workspace_id,id);
DO $$ DECLARE tab text; BEGIN
 FOREACH tab IN ARRAY ARRAY['agreement_revisions','agreement_scope','agreement_scope_assets','agreement_scope_facilities','entitlement_assessments','maintenance_plan_revisions','maintenance_plan_tasks','warranty_evidence','warranty_resolution_plans','maintenance_work_requests','maintenance_service_results','warranty_customer_updates','warranty_customer_responses','supplier_credit_evidence','maintenance_events'] LOOP
  EXECUTE format('CREATE TRIGGER retain_evidence BEFORE UPDATE OR DELETE ON ppo.%I FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence()',tab);
 END LOOP;
END $$;

CREATE FUNCTION ppo.maintenance_occurrence_identity() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF (NEW.workspace_id,NEW.company_id,NEW.site_id,NEW.customer_id,NEW.plan_id,NEW.plan_revision_id,NEW.asset_id,NEW.original_due,NEW.timezone,NEW.asset_snapshot) IS DISTINCT FROM (OLD.workspace_id,OLD.company_id,OLD.site_id,OLD.customer_id,OLD.plan_id,OLD.plan_revision_id,OLD.asset_id,OLD.original_due,OLD.timezone,OLD.asset_snapshot) THEN
  RAISE EXCEPTION 'An occurrence retains its original identity, date, plan and location' USING ERRCODE='23514';
 END IF;
 IF NEW.state IN ('Skipped','Cancelled') AND EXISTS(SELECT 1 FROM ppo.maintenance_work_requests WHERE workspace_id=NEW.workspace_id AND occurrence_id=NEW.id) THEN RAISE EXCEPTION 'Receiving work requires a receiving disposition' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER original_occurrence BEFORE UPDATE ON ppo.maintenance_occurrences FOR EACH ROW EXECUTE FUNCTION ppo.maintenance_occurrence_identity();
