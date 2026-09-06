-- P10 / #45 / ADR-0016. Additive after accepted CRM I1. Preserve all earlier unions.
DO $$ DECLARE item record; definition text; BEGIN
 FOR item IN SELECT * FROM (VALUES
 ('business_identities','ck_identities_type','object_type','FinancialHandoff,FinanceAccount'),
 ('audit_events','ck_audit_object_type','object_type','FinancialHandoff,FinanceAccount'),
 ('outbox_jobs','ck_outbox_kind','kind','FinanceDraftSaved,FinanceSubmitted,FinanceReviewed,FinanceProcessingClaimed,FinanceOutcomeRecorded,FinanceReconciled,FinanceSourceInvalidated,FinanceEvidenceRequested,FinanceEvidenceIssued,FinanceAccountObserved'),
 ('permission_grants','ck_grants_capability','capability','finance.read,finance.prepare,finance.review,finance.process,finance.reconcile,finance.issue,finance.account.read'),
 ('reference_counters','ck_reference_type','record_type','FH')
 ) AS v(tab,con,col,added) LOOP
 SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid=('ppo.'||item.tab)::regclass AND conname=item.con;
 EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',item.tab,item.con);
 EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR %I = ANY(%L::text[]))',item.tab,item.con,substring(definition from 8 for length(definition)-8),item.col,string_to_array(item.added,','));
 END LOOP;
 SELECT pg_get_functiondef('ppo.identity_has_typed_record()'::regprocedure) INTO definition;
 IF position('CASE NEW.object_type' in definition)=0 THEN RAISE EXCEPTION 'Inspect changed identity dispatch'; END IF;
 EXECUTE replace(definition,'CASE NEW.object_type','CASE NEW.object_type WHEN ''FinancialHandoff'' THEN ''finance_handoffs'' WHEN ''FinanceAccount'' THEN ''finance_accounts''');
END $$;

CREATE TABLE ppo.finance_definitions (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL REFERENCES ppo.workspaces(id),version integer NOT NULL CHECK(version>0),
 definition jsonb NOT NULL,content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),UNIQUE(workspace_id,id),UNIQUE(workspace_id,id,version)
);
CREATE TABLE ppo.finance_policy (
 workspace_id uuid PRIMARY KEY REFERENCES ppo.workspaces(id),version integer NOT NULL CHECK(version>0),definition_id uuid NOT NULL,
 FOREIGN KEY(workspace_id,definition_id) REFERENCES ppo.finance_definitions(workspace_id,id)
);
CREATE TABLE ppo.finance_accounts (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,company_id uuid NOT NULL,organisation_id uuid NOT NULL,mapping_id uuid NOT NULL,mapping_version integer NOT NULL,
 mapping_snapshot jsonb NOT NULL,verification_basis text NOT NULL CHECK(length(btrim(verification_basis))>=10),
 status text NOT NULL DEFAULT 'SyntheticVerified' CHECK(status='SyntheticVerified'),currency text NOT NULL CHECK(currency ~ '^[A-Z]{3}$'),
 fixture_key text NOT NULL,version integer NOT NULL DEFAULT 1 CHECK(version>0),current_run_id uuid,
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),updated_by uuid NOT NULL,updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,company_id,organisation_id,id),UNIQUE(workspace_id,fixture_key),
 FOREIGN KEY(workspace_id,company_id,organisation_id) REFERENCES ppo.organisations(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,mapping_id) REFERENCES ppo.erp_account_mappings(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.finance_accounts FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('FinanceAccount','');
CREATE TABLE ppo.finance_account_runs (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,account_id uuid NOT NULL,predecessor_id uuid,fixture text NOT NULL CHECK(fixture IN ('F-01','F-02','F-03','F-04','F-05','Failed')),
 source_as_at timestamptz NOT NULL,observed_at timestamptz NOT NULL DEFAULT clock_timestamp(),cutoff timestamptz NOT NULL,
 completeness text NOT NULL CHECK(completeness IN ('Complete','Partial','Failed')),expected_pages integer NOT NULL CHECK(expected_pages>0),received_pages integer NOT NULL CHECK(received_pages>=0 AND received_pages<=expected_pages),
 expected_count integer NOT NULL CHECK(expected_count>=0),received_count integer NOT NULL CHECK(received_count>=0 AND received_count<=expected_count),
 extraction_scope jsonb NOT NULL,observations jsonb NOT NULL,source_balance numeric(18,2),unapplied_cash numeric(18,2),basis text NOT NULL,content_hash text NOT NULL,
 actor_id uuid NOT NULL,operation_id uuid NOT NULL,UNIQUE(workspace_id,id),UNIQUE(workspace_id,account_id,id),UNIQUE(workspace_id,actor_id,operation_id),
 FOREIGN KEY(workspace_id,account_id) REFERENCES ppo.finance_accounts(workspace_id,id),FOREIGN KEY(workspace_id,account_id,predecessor_id) REFERENCES ppo.finance_account_runs(workspace_id,account_id,id),
 FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id),
 CHECK((completeness='Complete' AND expected_pages=received_pages AND expected_count=received_count) OR (completeness<>'Complete' AND source_balance IS NULL))
);
ALTER TABLE ppo.finance_accounts ADD FOREIGN KEY(workspace_id,id,current_run_id) REFERENCES ppo.finance_account_runs(workspace_id,account_id,id);

CREATE TABLE ppo.finance_handoffs (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,company_id uuid NOT NULL,site_id uuid NOT NULL,work_order_id uuid NOT NULL,customer_id uuid NOT NULL,account_id uuid NOT NULL,
 display_number text NOT NULL,version integer NOT NULL DEFAULT 1 CHECK(version>0),revision integer NOT NULL DEFAULT 0 CHECK(revision>=0),current_revision_id uuid,
 status text NOT NULL DEFAULT 'Draft' CHECK(status IN ('Draft','ReadyForReview','Approved','Returned','AwaitingERP','OutcomeUnknown','ReconciliationRequired','Reconciled','Cancelled')),
 mode text NOT NULL CHECK(mode IN ('SyntheticManual','SyntheticApi')),currency text NOT NULL CHECK(currency ~ '^[A-Z]{3}$'),
 owner_id uuid NOT NULL,processing_owner_id uuid,active_attempt_id uuid,correlation_id uuid NOT NULL UNIQUE,needs_review boolean NOT NULL DEFAULT false,source_blocker text,
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),updated_by uuid NOT NULL,updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,display_number),UNIQUE(workspace_id,company_id,site_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id,work_order_id) REFERENCES ppo.work_orders(workspace_id,company_id,site_id,id),
 FOREIGN KEY(workspace_id,company_id,customer_id,account_id) REFERENCES ppo.finance_accounts(workspace_id,company_id,organisation_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),FOREIGN KEY(workspace_id,processing_owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.finance_handoffs FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('FinancialHandoff','FH');
CREATE TABLE ppo.finance_revisions (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,handoff_id uuid NOT NULL,revision integer NOT NULL CHECK(revision>0),predecessor_id uuid,
 definition_id uuid NOT NULL,definition_version integer NOT NULL,policy_version integer NOT NULL,source_snapshot jsonb NOT NULL,source_hash text NOT NULL CHECK(source_hash ~ '^[a-f0-9]{64}$'),
 treatment_basis text NOT NULL CHECK(length(btrim(treatment_basis))>=10),remaining_work_basis text NOT NULL CHECK(length(btrim(remaining_work_basis))>=10),
 reason text NOT NULL,actor_id uuid NOT NULL,operation_id uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,handoff_id,id),UNIQUE(workspace_id,handoff_id,revision),
 FOREIGN KEY(workspace_id,handoff_id) REFERENCES ppo.finance_handoffs(workspace_id,id),
 FOREIGN KEY(workspace_id,handoff_id,predecessor_id) REFERENCES ppo.finance_revisions(workspace_id,handoff_id,id),
 FOREIGN KEY(workspace_id,definition_id,definition_version) REFERENCES ppo.finance_definitions(workspace_id,id,version),FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id),
 CHECK((revision=1)=(predecessor_id IS NULL))
);
ALTER TABLE ppo.finance_handoffs ADD FOREIGN KEY(workspace_id,id,current_revision_id) REFERENCES ppo.finance_revisions(workspace_id,handoff_id,id);
CREATE TABLE ppo.finance_sources (
 workspace_id uuid NOT NULL,revision_id uuid NOT NULL,report_id uuid NOT NULL,report_revision_id uuid NOT NULL,review_id uuid NOT NULL,issue_id uuid NOT NULL,source_hash text NOT NULL,
 PRIMARY KEY(workspace_id,revision_id,report_id),UNIQUE(workspace_id,revision_id,report_revision_id),
 FOREIGN KEY(workspace_id,revision_id) REFERENCES ppo.finance_revisions(workspace_id,id),
 FOREIGN KEY(workspace_id,report_id,report_revision_id) REFERENCES ppo.report_revisions(workspace_id,report_id,id),
 FOREIGN KEY(workspace_id,report_id,review_id) REFERENCES ppo.report_reviews(workspace_id,report_id,id),FOREIGN KEY(workspace_id,report_id,issue_id) REFERENCES ppo.report_issues(workspace_id,report_id,id)
);
CREATE TABLE ppo.finance_lines (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,revision_id uuid NOT NULL,report_revision_id uuid NOT NULL,entry_id uuid NOT NULL,entry_version integer NOT NULL,root_entry_id uuid NOT NULL,
 captured_quantity numeric(20,6) NOT NULL CHECK(captured_quantity>0),reviewed_quantity numeric(20,6) NOT NULL CHECK(reviewed_quantity=captured_quantity),
 allocated_quantity numeric(20,6) NOT NULL CHECK(allocated_quantity>0 AND allocated_quantity<=reviewed_quantity),billable_quantity numeric(20,6),
 uom text NOT NULL,direction text NOT NULL CHECK(direction IN ('Labour','Consumed','Returned')),disposition text NOT NULL CHECK(disposition IN ('Pending','Billable','NonBillable','WarrantyReview','GoodwillReview')),
 reason text NOT NULL CHECK(length(btrim(reason))>=10),target_group text,source_entry_hash text NOT NULL,
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,revision_id,id),
 FOREIGN KEY(workspace_id,revision_id,report_revision_id) REFERENCES ppo.finance_sources(workspace_id,revision_id,report_revision_id),
 FOREIGN KEY(workspace_id,report_revision_id,entry_id) REFERENCES ppo.report_entry_refs(workspace_id,report_revision_id,entry_id),
 FOREIGN KEY(workspace_id,root_entry_id) REFERENCES ppo.field_entries(workspace_id,id),
 CHECK((disposition='Billable' AND billable_quantity=allocated_quantity AND target_group IS NOT NULL) OR (disposition='NonBillable' AND billable_quantity=0 AND target_group IS NULL) OR (disposition IN ('Pending','WarrantyReview','GoodwillReview') AND billable_quantity IS NULL AND target_group IS NULL))
);
CREATE TABLE ppo.finance_allocation_holds (
 workspace_id uuid NOT NULL,handoff_id uuid NOT NULL,revision_id uuid NOT NULL,line_id uuid NOT NULL,root_entry_id uuid NOT NULL,
 quantity numeric(20,6) NOT NULL CHECK(quantity>0),state text NOT NULL CHECK(state IN ('Held','Consumed','Released')),created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(workspace_id,line_id),FOREIGN KEY(workspace_id,handoff_id,revision_id) REFERENCES ppo.finance_revisions(workspace_id,handoff_id,id),
 FOREIGN KEY(workspace_id,revision_id,line_id) REFERENCES ppo.finance_lines(workspace_id,revision_id,id),FOREIGN KEY(workspace_id,root_entry_id) REFERENCES ppo.field_entries(workspace_id,id)
);
CREATE TABLE ppo.finance_reviews (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,handoff_id uuid NOT NULL,revision_id uuid NOT NULL,decision text NOT NULL CHECK(decision IN ('Approved','Returned')),
 source_hash text NOT NULL,definition_id uuid NOT NULL,policy_version integer NOT NULL,reason text NOT NULL CHECK(length(btrim(reason))>=10),actor_id uuid NOT NULL,operation_id uuid NOT NULL,
 reviewed_at timestamptz NOT NULL DEFAULT clock_timestamp(),UNIQUE(workspace_id,id),UNIQUE(workspace_id,handoff_id,id),UNIQUE(workspace_id,revision_id),
 FOREIGN KEY(workspace_id,handoff_id,revision_id) REFERENCES ppo.finance_revisions(workspace_id,handoff_id,id),FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.finance_processing_attempts (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,handoff_id uuid NOT NULL,revision_id uuid NOT NULL,review_id uuid NOT NULL,attempt integer NOT NULL CHECK(attempt>0),
 actor_id uuid NOT NULL,operation_id uuid NOT NULL,correlation_id uuid NOT NULL,input_hash text NOT NULL,source_snapshot jsonb NOT NULL,
 scenario text NOT NULL CHECK(scenario IN ('Accepted','AcceptedThenTimeout','NotProcessed','Partial')),claimed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 dispatch_started_at timestamptz,UNIQUE(workspace_id,id),UNIQUE(workspace_id,handoff_id,id),UNIQUE(workspace_id,handoff_id,attempt),UNIQUE(workspace_id,actor_id,operation_id),
 FOREIGN KEY(workspace_id,handoff_id,revision_id) REFERENCES ppo.finance_revisions(workspace_id,handoff_id,id),
 FOREIGN KEY(workspace_id,handoff_id,review_id) REFERENCES ppo.finance_reviews(workspace_id,handoff_id,id),FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id)
);
ALTER TABLE ppo.finance_handoffs ADD FOREIGN KEY(workspace_id,id,active_attempt_id) REFERENCES ppo.finance_processing_attempts(workspace_id,handoff_id,id);
-- The simulator is a separate durable effect boundary. Never treat its presence as a received outcome.
CREATE TABLE ppo.finance_simulator_targets (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,handoff_id uuid NOT NULL,account_id uuid NOT NULL,company_id uuid NOT NULL,customer_id uuid NOT NULL,currency text NOT NULL,
 correlation_id uuid NOT NULL UNIQUE,input_hash text NOT NULL,attempt_id uuid NOT NULL,kind text NOT NULL CHECK(kind='SyntheticServiceCharge'),
 status text NOT NULL CHECK(status IN ('Accepted','Partial')),lines jsonb NOT NULL,source_as_at timestamptz NOT NULL DEFAULT clock_timestamp(),synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 UNIQUE(workspace_id,id),FOREIGN KEY(workspace_id,handoff_id,attempt_id) REFERENCES ppo.finance_processing_attempts(workspace_id,handoff_id,id),
 FOREIGN KEY(workspace_id,company_id,customer_id,account_id) REFERENCES ppo.finance_accounts(workspace_id,company_id,organisation_id,id)
);
CREATE TABLE ppo.finance_outcomes (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,handoff_id uuid NOT NULL,attempt_id uuid NOT NULL,target_id uuid,
 outcome text NOT NULL CHECK(outcome IN ('Processed','NotProcessed','Unknown')),method text NOT NULL CHECK(method IN ('SimulatorReceipt','OriginalLookup')),
 evidence jsonb NOT NULL,evidence_hash text NOT NULL,actor_id uuid NOT NULL,operation_id uuid NOT NULL,observed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,handoff_id,id),UNIQUE(workspace_id,actor_id,operation_id),
 FOREIGN KEY(workspace_id,handoff_id,attempt_id) REFERENCES ppo.finance_processing_attempts(workspace_id,handoff_id,id),FOREIGN KEY(workspace_id,target_id) REFERENCES ppo.finance_simulator_targets(workspace_id,id),
 FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id),CHECK((outcome='Processed')=(target_id IS NOT NULL))
);
CREATE TABLE ppo.finance_reconciliations (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,handoff_id uuid NOT NULL,revision_id uuid NOT NULL,outcome_id uuid NOT NULL,
 result text NOT NULL CHECK(result IN ('Matched','NoPostingRequired')),line_mapping jsonb NOT NULL,no_posting jsonb NOT NULL,basis text NOT NULL,actor_id uuid NOT NULL,operation_id uuid NOT NULL,
 reconciled_at timestamptz NOT NULL DEFAULT clock_timestamp(),UNIQUE(workspace_id,id),UNIQUE(workspace_id,revision_id),
 FOREIGN KEY(workspace_id,handoff_id,revision_id) REFERENCES ppo.finance_revisions(workspace_id,handoff_id,id),FOREIGN KEY(workspace_id,handoff_id,outcome_id) REFERENCES ppo.finance_outcomes(workspace_id,handoff_id,id),FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.finance_corrections (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,handoff_id uuid NOT NULL,source_revision_id uuid NOT NULL,outcome_id uuid,reason text NOT NULL,disposition text NOT NULL CHECK(disposition IN ('Investigate','CorrectionRequested','ReversalRequested')),
 actor_id uuid NOT NULL,operation_id uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),UNIQUE(workspace_id,id),
 FOREIGN KEY(workspace_id,handoff_id,source_revision_id) REFERENCES ppo.finance_revisions(workspace_id,handoff_id,id),FOREIGN KEY(workspace_id,handoff_id,outcome_id) REFERENCES ppo.finance_outcomes(workspace_id,handoff_id,id),FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.finance_events (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,handoff_id uuid NOT NULL,version integer NOT NULL,status text NOT NULL,revision_id uuid,actor_id uuid NOT NULL,operation_id uuid,
 kind text NOT NULL,reason text NOT NULL,details jsonb NOT NULL DEFAULT '{}',occurred_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,handoff_id,version),FOREIGN KEY(workspace_id,handoff_id) REFERENCES ppo.finance_handoffs(workspace_id,id),FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id)
);
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['finance_definitions','finance_account_runs','finance_revisions','finance_sources','finance_lines','finance_reviews','finance_simulator_targets','finance_outcomes','finance_reconciliations','finance_corrections','finance_events'] LOOP
 EXECUTE format('CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON ppo.%I FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence()',t); END LOOP; END $$;

CREATE FUNCTION ppo.protect_finance_account() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='DELETE' OR (to_jsonb(NEW)-ARRAY['version','current_run_id','updated_by','updated_at']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['version','current_run_id','updated_by','updated_at']) OR NEW.version<>OLD.version+1 THEN RAISE EXCEPTION 'Synthetic account context is immutable' USING ERRCODE='55000'; END IF;RETURN NEW;END $$;
CREATE TRIGGER protected BEFORE UPDATE OR DELETE ON ppo.finance_accounts FOR EACH ROW EXECUTE FUNCTION ppo.protect_finance_account();
CREATE FUNCTION ppo.protect_finance_handoff() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='DELETE' OR (to_jsonb(NEW)-ARRAY['version','revision','current_revision_id','status','processing_owner_id','active_attempt_id','needs_review','source_blocker','updated_by','updated_at']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['version','revision','current_revision_id','status','processing_owner_id','active_attempt_id','needs_review','source_blocker','updated_by','updated_at']) OR NEW.version<>OLD.version+1 THEN RAISE EXCEPTION 'Finance identity and versions are controlled' USING ERRCODE='55000'; END IF;
 IF NEW.status='Cancelled' AND (OLD.status NOT IN ('Draft','ReadyForReview','Returned','Approved') OR EXISTS(SELECT 1 FROM ppo.finance_processing_attempts a WHERE a.handoff_id=OLD.id AND a.dispatch_started_at IS NOT NULL AND NOT EXISTS(SELECT 1 FROM ppo.finance_outcomes o WHERE o.attempt_id=a.id AND o.outcome='NotProcessed'))) THEN RAISE EXCEPTION 'Possible processing prevents cancellation' USING ERRCODE='23514'; END IF;
 RETURN NEW;END $$;
CREATE TRIGGER protected BEFORE UPDATE OR DELETE ON ppo.finance_handoffs FOR EACH ROW EXECUTE FUNCTION ppo.protect_finance_handoff();
CREATE FUNCTION ppo.protect_finance_attempt() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='DELETE' OR (to_jsonb(NEW)-'dispatch_started_at') IS DISTINCT FROM (to_jsonb(OLD)-'dispatch_started_at') OR OLD.dispatch_started_at IS NOT NULL OR NEW.dispatch_started_at IS NULL THEN RAISE EXCEPTION 'Original processing identity is permanent' USING ERRCODE='55000'; END IF;RETURN NEW;END $$;
CREATE TRIGGER protected BEFORE UPDATE OR DELETE ON ppo.finance_processing_attempts FOR EACH ROW EXECUTE FUNCTION ppo.protect_finance_attempt();
CREATE FUNCTION ppo.guard_finance_allocation() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE l ppo.finance_lines; total numeric; BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Allocation history is permanent' USING ERRCODE='55000'; END IF;
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 IF TG_OP='UPDATE' AND ((to_jsonb(NEW)-'state') IS DISTINCT FROM (to_jsonb(OLD)-'state') OR OLD.state<>'Held' OR NEW.state NOT IN ('Released','Consumed')) THEN RAISE EXCEPTION 'Allocation hold transition is controlled' USING ERRCODE='55000'; END IF;
 SELECT * INTO STRICT l FROM ppo.finance_lines WHERE workspace_id=NEW.workspace_id AND id=NEW.line_id;
 IF NEW.quantity<>l.allocated_quantity OR NEW.root_entry_id<>l.root_entry_id OR NEW.revision_id<>l.revision_id THEN RAISE EXCEPTION 'Exact source allocation required' USING ERRCODE='23514'; END IF;
 SELECT coalesce(sum(quantity),0) INTO total FROM ppo.finance_allocation_holds WHERE workspace_id=NEW.workspace_id AND root_entry_id=NEW.root_entry_id AND state<>'Released' AND line_id<>NEW.line_id;
 IF NEW.state<>'Released' AND total+NEW.quantity>l.reviewed_quantity THEN RAISE EXCEPTION 'Source quantity already allocated' USING ERRCODE='23514'; END IF;RETURN NEW;END $$;
CREATE TRIGGER allocation_guard BEFORE INSERT OR UPDATE OR DELETE ON ppo.finance_allocation_holds FOR EACH ROW EXECUTE FUNCTION ppo.guard_finance_allocation();
CREATE FUNCTION ppo.check_finance_state() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE h ppo.finance_handoffs; BEGIN
 SELECT * INTO h FROM ppo.finance_handoffs WHERE workspace_id=NEW.workspace_id AND id=NEW.id;
 IF NOT EXISTS(SELECT 1 FROM ppo.finance_events WHERE handoff_id=NEW.id AND version=NEW.version AND status=NEW.status AND revision_id IS NOT DISTINCT FROM NEW.current_revision_id AND actor_id=NEW.updated_by) THEN RAISE EXCEPTION 'Exact Finance version event required' USING ERRCODE='23514';END IF;
 IF NOT EXISTS(SELECT 1 FROM ppo.finance_revisions WHERE workspace_id=h.workspace_id AND handoff_id=h.id AND id=h.current_revision_id AND revision=h.revision) THEN RAISE EXCEPTION 'Exact Finance revision required' USING ERRCODE='23514';END IF;
 IF h.status IN ('Approved','AwaitingERP') AND NOT EXISTS(SELECT 1 FROM ppo.finance_reviews WHERE revision_id=h.current_revision_id AND decision='Approved') THEN RAISE EXCEPTION 'Exact Finance approval required' USING ERRCODE='23514';END IF;
 IF h.status IN ('AwaitingERP','OutcomeUnknown') AND (h.active_attempt_id IS NULL OR h.processing_owner_id IS NULL) THEN RAISE EXCEPTION 'Exact processing claim required' USING ERRCODE='23514';END IF;
 IF h.status='Reconciled' AND NOT EXISTS(SELECT 1 FROM ppo.finance_reconciliations WHERE revision_id=h.current_revision_id) THEN RAISE EXCEPTION 'Exact reconciliation required' USING ERRCODE='23514';END IF;RETURN NULL;END $$;
CREATE CONSTRAINT TRIGGER finance_state AFTER INSERT OR UPDATE ON ppo.finance_handoffs DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_finance_state();

CREATE FUNCTION ppo.invalidate_finance_source() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE h ppo.finance_handoffs; ev uuid; state text; BEGIN
 IF NEW.current_revision_id IS NOT DISTINCT FROM OLD.current_revision_id AND NOT (NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('Draft','Submitted','Returned')) THEN RETURN NEW; END IF;
 FOR h IN SELECT f.* FROM ppo.finance_handoffs f JOIN ppo.finance_sources s ON s.revision_id=f.current_revision_id WHERE s.workspace_id=NEW.workspace_id AND s.report_id=NEW.id AND f.status<>'Cancelled' AND NOT f.needs_review FOR UPDATE OF f LOOP
 state:=CASE WHEN h.status IN ('AwaitingERP','OutcomeUnknown') THEN 'OutcomeUnknown' WHEN h.status IN ('ReconciliationRequired','Reconciled') THEN 'ReconciliationRequired' ELSE 'Returned' END;
 UPDATE ppo.finance_handoffs SET status=state,needs_review=true,source_blocker='Exact service source changed; review the successor and retained processing evidence.',version=version+1,updated_by=NEW.updated_by,updated_at=clock_timestamp() WHERE id=h.id;
 ev:=gen_random_uuid();
 INSERT INTO ppo.finance_events(id,workspace_id,handoff_id,version,status,revision_id,actor_id,kind,reason,details) VALUES(ev,h.workspace_id,h.id,h.version+1,state,h.current_revision_id,NEW.updated_by,'SourceInvalidated','Exact service source changed',jsonb_build_object('report_id',NEW.id,'report_version',NEW.version));
 INSERT INTO ppo.audit_events(id,workspace_id,actor_id,object_type,object_id,outcome,reason,details) VALUES(gen_random_uuid(),h.workspace_id,NEW.updated_by,'FinancialHandoff',h.id,'Accepted','Exact service source dependency invalidated',jsonb_build_object('report_id',NEW.id,'report_version',NEW.version,'event_id',ev));
 INSERT INTO ppo.outbox_jobs(id,workspace_id,actor_id,operation_id,correlation_id,kind,payload_version,payload) VALUES(gen_random_uuid(),h.workspace_id,NEW.updated_by,ev,ev,'FinanceSourceInvalidated',1,jsonb_build_object('record_id',h.id,'record_version',h.version+1,'object_type','FinancialHandoff','synthetic',true));
 END LOOP;RETURN NEW;END $$;
CREATE TRIGGER finance_source_dependency AFTER UPDATE ON ppo.service_reports FOR EACH ROW EXECUTE FUNCTION ppo.invalidate_finance_source();
CREATE INDEX ix_finance_queue ON ppo.finance_handoffs(workspace_id,company_id,site_id,status,id);
CREATE INDEX ix_finance_allocation_source ON ppo.finance_allocation_holds(workspace_id,root_entry_id,state);

CREATE TABLE ppo.finance_simulator_results (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,attempt_id uuid NOT NULL,target_id uuid,outcome text NOT NULL CHECK(outcome IN ('Processed','NotProcessed')),evidence jsonb NOT NULL,observed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,attempt_id),FOREIGN KEY(workspace_id,attempt_id) REFERENCES ppo.finance_processing_attempts(workspace_id,id),FOREIGN KEY(workspace_id,target_id) REFERENCES ppo.finance_simulator_targets(workspace_id,id),CHECK((outcome='Processed')=(target_id IS NOT NULL))
);
CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON ppo.finance_simulator_results FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.finance_templates (id uuid PRIMARY KEY,workspace_id uuid NOT NULL REFERENCES ppo.workspaces(id),version integer NOT NULL CHECK(version>0),definition text NOT NULL,content_hash text NOT NULL,UNIQUE(workspace_id,id));
CREATE TABLE ppo.finance_template_policy (workspace_id uuid PRIMARY KEY REFERENCES ppo.workspaces(id),template_id uuid NOT NULL,version integer NOT NULL DEFAULT 1,FOREIGN KEY(workspace_id,template_id) REFERENCES ppo.finance_templates(workspace_id,id));
CREATE TABLE ppo.finance_render_jobs (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,handoff_id uuid NOT NULL,revision_id uuid NOT NULL,review_id uuid NOT NULL,reconciliation_id uuid NOT NULL,actor_id uuid NOT NULL,
 operation_id uuid NOT NULL,finalisation_operation_id uuid NOT NULL UNIQUE,render_snapshot jsonb NOT NULL,input_hash text NOT NULL,
 state text NOT NULL DEFAULT 'Queued' CHECK(state IN ('Queued','Running','Durable','Failed','StaleSource','Issued')),attempts integer NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 5),lease_token uuid,lease_until timestamptz,error_code text,output_manifest jsonb,
 requested_at timestamptz NOT NULL DEFAULT clock_timestamp(),UNIQUE(workspace_id,id),UNIQUE(workspace_id,handoff_id,id),UNIQUE(workspace_id,revision_id),UNIQUE(workspace_id,actor_id,operation_id),
 FOREIGN KEY(workspace_id,handoff_id,revision_id) REFERENCES ppo.finance_revisions(workspace_id,handoff_id,id),FOREIGN KEY(workspace_id,handoff_id,review_id) REFERENCES ppo.finance_reviews(workspace_id,handoff_id,id),FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id)
);
ALTER TABLE ppo.finance_reconciliations ADD UNIQUE(workspace_id,id);
ALTER TABLE ppo.finance_render_jobs ADD FOREIGN KEY(workspace_id,reconciliation_id) REFERENCES ppo.finance_reconciliations(workspace_id,id);
CREATE TABLE ppo.finance_render_attempts (id uuid PRIMARY KEY,workspace_id uuid NOT NULL,job_id uuid NOT NULL,attempt integer NOT NULL,outcome text NOT NULL,code text,occurred_at timestamptz NOT NULL DEFAULT clock_timestamp(),FOREIGN KEY(workspace_id,job_id) REFERENCES ppo.finance_render_jobs(workspace_id,id));
CREATE TABLE ppo.finance_issues (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,handoff_id uuid NOT NULL,revision_id uuid NOT NULL,review_id uuid NOT NULL,render_job_id uuid NOT NULL,issued_by uuid NOT NULL,issued_at timestamptz NOT NULL DEFAULT clock_timestamp(),manifest jsonb NOT NULL,output_hash text NOT NULL,audience text NOT NULL CHECK(audience='CurrentScopedFinance'),
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,revision_id),UNIQUE(workspace_id,render_job_id),FOREIGN KEY(workspace_id,handoff_id,revision_id) REFERENCES ppo.finance_revisions(workspace_id,handoff_id,id),FOREIGN KEY(workspace_id,handoff_id,review_id) REFERENCES ppo.finance_reviews(workspace_id,handoff_id,id),FOREIGN KEY(workspace_id,handoff_id,render_job_id) REFERENCES ppo.finance_render_jobs(workspace_id,handoff_id,id),FOREIGN KEY(workspace_id,issued_by) REFERENCES ppo.users(workspace_id,id)
);
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['finance_templates','finance_issues','finance_render_attempts'] LOOP EXECUTE format('CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON ppo.%I FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence()',t);END LOOP;END $$;
CREATE FUNCTION ppo.protect_finance_job() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='DELETE' OR (to_jsonb(NEW)-ARRAY['state','attempts','lease_token','lease_until','error_code','output_manifest']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['state','attempts','lease_token','lease_until','error_code','output_manifest']) OR (OLD.output_manifest IS NOT NULL AND NEW.output_manifest IS DISTINCT FROM OLD.output_manifest) OR OLD.state='Issued' THEN RAISE EXCEPTION 'Original Finance output job is permanent' USING ERRCODE='55000'; END IF;RETURN NEW;END $$;
CREATE TRIGGER protected BEFORE UPDATE OR DELETE ON ppo.finance_render_jobs FOR EACH ROW EXECUTE FUNCTION ppo.protect_finance_job();

CREATE FUNCTION ppo.guard_finance_source() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE v ppo.report_revisions; r ppo.service_reports; rv ppo.report_reviews; i ppo.report_issues; h ppo.finance_handoffs; BEGIN
 SELECT * INTO STRICT v FROM ppo.report_revisions WHERE workspace_id=NEW.workspace_id AND id=NEW.report_revision_id;
 SELECT * INTO STRICT r FROM ppo.service_reports WHERE workspace_id=NEW.workspace_id AND id=NEW.report_id;
 SELECT * INTO STRICT rv FROM ppo.report_reviews WHERE workspace_id=NEW.workspace_id AND id=NEW.review_id;
 SELECT * INTO STRICT i FROM ppo.report_issues WHERE workspace_id=NEW.workspace_id AND id=NEW.issue_id;
 SELECT f.* INTO STRICT h FROM ppo.finance_handoffs f JOIN ppo.finance_revisions x ON x.handoff_id=f.id WHERE x.id=NEW.revision_id AND x.workspace_id=NEW.workspace_id;
 IF r.status<>'Issued' OR r.current_revision_id<>v.id OR r.current_issue_id<>i.id OR rv.revision_id<>v.id OR rv.decision<>'Approved' OR i.revision_id<>v.id OR i.review_id<>rv.id OR NEW.source_hash<>v.source_hash OR rv.source_hash<>v.source_hash OR v.snapshot->'work'->>'id'<>h.work_order_id::text OR v.snapshot->'customer'->>'id'<>h.customer_id::text OR r.company_id<>h.company_id OR r.site_id<>h.site_id OR v.snapshot->'completion'->>'time_declaration' NOT IN ('AllRecorded','None') OR v.snapshot->'completion'->>'material_declaration' NOT IN ('AllRecorded','None') THEN RAISE EXCEPTION 'Exact current complete technical source required' USING ERRCODE='23514'; END IF;RETURN NEW;END $$;
CREATE TRIGGER source_guard BEFORE INSERT ON ppo.finance_sources FOR EACH ROW EXECUTE FUNCTION ppo.guard_finance_source();
CREATE FUNCTION ppo.guard_finance_line() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE e ppo.field_entries; rv ppo.report_reviews; q numeric; u text; direction text; BEGIN
 SELECT e0.* INTO STRICT e FROM ppo.field_entries e0 JOIN ppo.report_entry_refs rr ON (rr.workspace_id,rr.entry_id,rr.entry_version)=(e0.workspace_id,e0.id,e0.version) WHERE rr.workspace_id=NEW.workspace_id AND rr.report_revision_id=NEW.report_revision_id AND rr.entry_id=NEW.entry_id;
 SELECT r.* INTO STRICT rv FROM ppo.report_reviews r JOIN ppo.finance_sources s ON s.review_id=r.id WHERE s.workspace_id=NEW.workspace_id AND s.revision_id=NEW.revision_id AND s.report_revision_id=NEW.report_revision_id;
 IF e.kind='Time' AND (e.payload->>'elapsed_seconds')::numeric%60=0 THEN q:=(e.payload->>'elapsed_seconds')::numeric/60;u:='MIN';direction:='Labour';ELSIF e.kind='Material' THEN q:=(e.payload->>'quantity')::numeric;u:=e.payload->>'uom';direction:=e.payload->>'movement_kind';ELSE RAISE EXCEPTION 'Unsupported quantity definition' USING ERRCODE='23514';END IF;
 IF NEW.entry_version<>e.version OR NEW.root_entry_id<>e.root_id OR NEW.captured_quantity<>q OR NEW.uom<>u OR NEW.direction<>direction OR NEW.source_entry_hash !~ '^[a-f0-9]{64}$' OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(rv.entry_decisions) d WHERE d->>'id'=e.id::text AND (d->>'version')::integer=e.version AND d->>'decision'='Approved') THEN RAISE EXCEPTION 'Exact original captured and reviewed quantity required' USING ERRCODE='23514';END IF;RETURN NEW;END $$;
CREATE TRIGGER line_guard BEFORE INSERT ON ppo.finance_lines FOR EACH ROW EXECUTE FUNCTION ppo.guard_finance_line();
CREATE FUNCTION ppo.guard_finance_review_claim() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE h ppo.finance_handoffs; v ppo.finance_revisions; BEGIN
 SELECT * INTO STRICT h FROM ppo.finance_handoffs WHERE workspace_id=NEW.workspace_id AND id=NEW.handoff_id;
 SELECT * INTO STRICT v FROM ppo.finance_revisions WHERE workspace_id=NEW.workspace_id AND id=NEW.revision_id;
 IF h.current_revision_id<>v.id OR (TG_TABLE_NAME='finance_reviews' AND h.status<>'ReadyForReview') OR (TG_TABLE_NAME='finance_processing_attempts' AND h.status<>'Approved') THEN RAISE EXCEPTION 'Exact controlled Finance transition required' USING ERRCODE='23514'; END IF;
 IF TG_TABLE_NAME='finance_reviews' THEN
  IF NEW.actor_id=h.owner_id OR NEW.source_hash<>v.source_hash OR NEW.definition_id<>v.definition_id OR NEW.policy_version<>v.policy_version THEN RAISE EXCEPTION 'Exact separate Finance review required' USING ERRCODE='23514';END IF;
  IF NEW.decision='Approved' AND EXISTS(SELECT 1 FROM ppo.finance_lines WHERE revision_id=v.id AND disposition NOT IN ('Billable','NonBillable')) THEN RAISE EXCEPTION 'Unresolved financial treatment' USING ERRCODE='23514'; END IF;
 ELSE
  IF NOT EXISTS(SELECT 1 FROM ppo.finance_reviews WHERE id=NEW.review_id AND revision_id=v.id AND decision='Approved') OR NEW.correlation_id<>h.correlation_id THEN RAISE EXCEPTION 'Exact original approved claim required' USING ERRCODE='23514';END IF;
 END IF;
 RETURN NEW;END $$;
CREATE TRIGGER review_guard BEFORE INSERT ON ppo.finance_reviews FOR EACH ROW EXECUTE FUNCTION ppo.guard_finance_review_claim();
CREATE TRIGGER claim_guard BEFORE INSERT ON ppo.finance_processing_attempts FOR EACH ROW EXECUTE FUNCTION ppo.guard_finance_review_claim();
CREATE FUNCTION ppo.guard_finance_target() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE a ppo.finance_processing_attempts;h ppo.finance_handoffs;BEGIN
 SELECT * INTO STRICT a FROM ppo.finance_processing_attempts WHERE workspace_id=NEW.workspace_id AND id=NEW.attempt_id;
 SELECT * INTO STRICT h FROM ppo.finance_handoffs WHERE workspace_id=NEW.workspace_id AND id=NEW.handoff_id;
 IF a.handoff_id<>h.id OR a.dispatch_started_at IS NULL OR a.correlation_id<>NEW.correlation_id OR a.input_hash<>NEW.input_hash OR h.company_id<>NEW.company_id OR h.customer_id<>NEW.customer_id OR h.account_id<>NEW.account_id OR h.currency<>NEW.currency OR EXISTS(SELECT 1 FROM ppo.finance_simulator_results WHERE workspace_id=NEW.workspace_id AND attempt_id=a.id) THEN RAISE EXCEPTION 'Exact unfenced original target operation required' USING ERRCODE='23514';END IF;RETURN NEW;END $$;
CREATE TRIGGER target_guard BEFORE INSERT ON ppo.finance_simulator_targets FOR EACH ROW EXECUTE FUNCTION ppo.guard_finance_target();
CREATE FUNCTION ppo.guard_finance_outcome() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE a ppo.finance_processing_attempts; s ppo.finance_simulator_results; BEGIN
 SELECT * INTO STRICT a FROM ppo.finance_processing_attempts WHERE workspace_id=NEW.workspace_id AND id=NEW.attempt_id;
 SELECT * INTO s FROM ppo.finance_simulator_results WHERE workspace_id=NEW.workspace_id AND attempt_id=a.id;
 IF a.handoff_id<>NEW.handoff_id OR a.actor_id<>NEW.actor_id OR s.id IS NULL OR (NEW.outcome<>'Unknown' AND (NEW.outcome<>s.outcome OR NEW.target_id IS DISTINCT FROM s.target_id OR NEW.evidence IS DISTINCT FROM s.evidence)) THEN RAISE EXCEPTION 'Authoritative original outcome evidence required' USING ERRCODE='23514';END IF;RETURN NEW;END $$;
CREATE TRIGGER outcome_guard BEFORE INSERT ON ppo.finance_outcomes FOR EACH ROW EXECUTE FUNCTION ppo.guard_finance_outcome();
