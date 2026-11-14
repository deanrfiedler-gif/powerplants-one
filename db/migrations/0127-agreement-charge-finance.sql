-- C1 reuses the existing Finance allocation lifecycle. No seed, grant or target ERP document.
CREATE TABLE ppo.agreement_charge_lines (
 workspace_id uuid NOT NULL, agreement_id uuid NOT NULL, revision_id uuid NOT NULL,
 charge_id uuid NOT NULL, due_date date NOT NULL CHECK(isfinite(due_date)),
 amount numeric(18,2) NOT NULL CHECK(amount>0), currency text NOT NULL CHECK(currency='AUD'),
 tax_basis text NOT NULL CHECK(length(btrim(tax_basis)) BETWEEN 1 AND 200),
 PRIMARY KEY(workspace_id,revision_id,charge_id),
 FOREIGN KEY(workspace_id,agreement_id) REFERENCES ppo.service_agreements(workspace_id,id),
 FOREIGN KEY(workspace_id,revision_id) REFERENCES ppo.agreement_revisions(workspace_id,id)
);
CREATE FUNCTION ppo.guard_agreement_charge_line() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM ppo.agreement_revisions r WHERE r.workspace_id=NEW.workspace_id AND r.id=NEW.revision_id AND r.agreement_id=NEW.agreement_id
  AND r.content->'charge_schedule'->>'currency'=NEW.currency AND r.content->'charge_schedule'->>'tax_basis'=NEW.tax_basis
  AND EXISTS(SELECT 1 FROM jsonb_array_elements(r.content->'charge_schedule'->'lines') l
   WHERE (l->>'id')::uuid=NEW.charge_id AND (l->>'due_date')::date=NEW.due_date AND (l->>'amount')::numeric=NEW.amount))
 THEN RAISE EXCEPTION 'Exact agreement revision charge required' USING ERRCODE='23514'; END IF; RETURN NEW;
END $$;
CREATE TRIGGER agreement_charge_exact BEFORE INSERT ON ppo.agreement_charge_lines FOR EACH ROW EXECUTE FUNCTION ppo.guard_agreement_charge_line();
CREATE TRIGGER agreement_charge_immutable BEFORE UPDATE OR DELETE ON ppo.agreement_charge_lines FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
ALTER TABLE ppo.finance_handoffs ADD COLUMN agreement_id uuid,
 ADD FOREIGN KEY(workspace_id,agreement_id) REFERENCES ppo.service_agreements(workspace_id,id),
 DROP CONSTRAINT finance_handoffs_source_kind_check,
 ADD CHECK(source_kind IN ('WorkOrder','ProjectClaim','AgreementCharge'));
ALTER TABLE ppo.finance_lines ADD COLUMN agreement_revision_id uuid, ADD COLUMN agreement_charge_id uuid,
 ADD FOREIGN KEY(workspace_id,agreement_revision_id,agreement_charge_id) REFERENCES ppo.agreement_charge_lines(workspace_id,revision_id,charge_id),
 DROP CONSTRAINT finance_lines_source_kind_check,
 ADD CHECK(source_kind IN ('WorkOrder','ProjectClaim','AgreementCharge'));
-- Preserve both existing source-shape expressions exactly while adding a disjoint branch.
DO $$ DECLARE d text; BEGIN
 SELECT pg_get_constraintdef(oid) INTO STRICT d FROM pg_constraint WHERE conrelid='ppo.finance_handoffs'::regclass AND conname='finance_source_kind';
 ALTER TABLE ppo.finance_handoffs DROP CONSTRAINT finance_source_kind;
 EXECUTE 'ALTER TABLE ppo.finance_handoffs ADD CONSTRAINT finance_source_kind CHECK (('||substring(d from 8 for length(d)-8)||') AND agreement_id IS NULL OR (source_kind=''AgreementCharge'' AND agreement_id IS NOT NULL AND work_order_id IS NULL AND project_id IS NULL AND site_id IS NULL))';
 SELECT pg_get_constraintdef(oid) INTO STRICT d FROM pg_constraint WHERE conrelid='ppo.finance_lines'::regclass AND conname='finance_line_source_kind';
 ALTER TABLE ppo.finance_lines DROP CONSTRAINT finance_line_source_kind;
 EXECUTE 'ALTER TABLE ppo.finance_lines ADD CONSTRAINT finance_line_source_kind CHECK (('||substring(d from 8 for length(d)-8)||') AND agreement_revision_id IS NULL AND agreement_charge_id IS NULL OR (source_kind=''AgreementCharge'' AND agreement_revision_id IS NOT NULL AND agreement_charge_id IS NOT NULL AND report_revision_id IS NULL AND entry_id IS NULL AND entry_version IS NULL AND root_entry_id IS NULL AND claim_basis_id IS NULL AND claim_event_version IS NULL AND claim_kind IS NULL AND claim_target_id IS NULL AND claim_amount IS NOT NULL AND claim_amount>0 AND claim_currency IS NOT NULL AND claim_tax_basis IS NOT NULL AND captured_quantity=1 AND reviewed_quantity=1 AND allocated_quantity=1 AND billable_quantity=1 AND disposition=''Billable'' AND uom=''CLAIM'' AND direction=''Claim''))';
END $$;
DO $$ DECLARE r record; d text; BEGIN
 FOR r IN SELECT conname FROM pg_constraint WHERE conrelid='ppo.finance_lines'::regclass AND contype='c' AND pg_get_constraintdef(oid) LIKE '%direction%' AND conname<>'finance_line_source_kind' LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT d FROM pg_constraint WHERE conrelid='ppo.finance_lines'::regclass AND conname=r.conname;
  EXECUTE format('ALTER TABLE ppo.finance_lines DROP CONSTRAINT %I',r.conname);
  EXECUTE format('ALTER TABLE ppo.finance_lines ADD CONSTRAINT %I CHECK ((%s) OR (source_kind=''AgreementCharge'' AND direction=''Claim''))',r.conname,substring(d from 8 for length(d)-8));
 END LOOP;
END $$;
ALTER TABLE ppo.finance_simulator_targets DROP CONSTRAINT finance_target_kind,
 ADD CONSTRAINT finance_target_kind CHECK(kind IN ('SyntheticServiceCharge','SyntheticProjectClaim','SyntheticAgreementCharge'));
ALTER TABLE ppo.finance_allocation_holds ADD COLUMN agreement_revision_id uuid, ADD COLUMN agreement_charge_id uuid,
 ADD FOREIGN KEY(workspace_id,agreement_revision_id,agreement_charge_id) REFERENCES ppo.agreement_charge_lines(workspace_id,revision_id,charge_id);
DO $$ DECLARE d text; BEGIN
 SELECT pg_get_constraintdef(oid) INTO STRICT d FROM pg_constraint WHERE conrelid='ppo.finance_allocation_holds'::regclass AND conname='finance_hold_source';
 ALTER TABLE ppo.finance_allocation_holds DROP CONSTRAINT finance_hold_source;
 EXECUTE 'ALTER TABLE ppo.finance_allocation_holds ADD CONSTRAINT finance_hold_source CHECK (('||substring(d from 8 for length(d)-8)||') AND agreement_revision_id IS NULL AND agreement_charge_id IS NULL OR (agreement_revision_id IS NOT NULL AND agreement_charge_id IS NOT NULL AND root_entry_id IS NULL AND claim_basis_id IS NULL AND claim_kind IS NULL AND claim_target_id IS NULL AND quantity=1))';
END $$;
CREATE UNIQUE INDEX finance_agreement_entitlement_live ON ppo.finance_allocation_holds(workspace_id,agreement_revision_id,agreement_charge_id) WHERE agreement_revision_id IS NOT NULL AND state<>'Released';
CREATE UNIQUE INDEX finance_agreement_line_once ON ppo.finance_lines(workspace_id,revision_id,agreement_revision_id,agreement_charge_id) WHERE source_kind='AgreementCharge';
CREATE INDEX finance_agreement_claims ON ppo.finance_handoffs(workspace_id,agreement_id,id) WHERE source_kind='AgreementCharge';
CREATE FUNCTION ppo.guard_finance_agreement_identity() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NEW.source_kind='AgreementCharge' AND NOT EXISTS(SELECT 1 FROM ppo.service_agreements a WHERE a.workspace_id=NEW.workspace_id AND a.id=NEW.agreement_id AND a.company_id=NEW.company_id AND a.customer_id=NEW.customer_id)
 THEN RAISE EXCEPTION 'Exact agreement account context required' USING ERRCODE='23514'; END IF; RETURN NEW;
END $$;
CREATE TRIGGER agreement_identity BEFORE INSERT ON ppo.finance_handoffs FOR EACH ROW EXECUTE FUNCTION ppo.guard_finance_agreement_identity();
DO $$ DECLARE d text; BEGIN
 SELECT pg_get_functiondef('ppo.guard_finance_line()'::regprocedure) INTO STRICT d;
 d:=overlay(d placing $branch$BEGIN
 IF NEW.source_kind='AgreementCharge' THEN
  IF NOT EXISTS(SELECT 1 FROM ppo.finance_revisions r JOIN ppo.finance_handoffs h ON (h.workspace_id,h.id)=(r.workspace_id,r.handoff_id)
   JOIN ppo.agreement_charge_lines l ON l.workspace_id=NEW.workspace_id AND l.revision_id=NEW.agreement_revision_id AND l.charge_id=NEW.agreement_charge_id
   WHERE r.workspace_id=NEW.workspace_id AND r.id=NEW.revision_id AND h.source_kind='AgreementCharge' AND h.agreement_id=l.agreement_id
    AND l.amount=NEW.claim_amount AND l.currency=NEW.claim_currency AND l.tax_basis=NEW.claim_tax_basis AND h.currency=l.currency
    AND r.source_snapshot->'agreement_charge'->>'revision_id'=l.revision_id::text
    AND EXISTS(SELECT 1 FROM jsonb_array_elements(r.source_snapshot->'agreement_charge'->'charges') x WHERE (x->>'id')::uuid=l.charge_id AND (x->>'amount')::numeric=l.amount AND (x->>'due_date')::date=l.due_date))
  THEN RAISE EXCEPTION 'Exact frozen agreement charge line required' USING ERRCODE='23514'; END IF; RETURN NEW;
 END IF;
$branch$ from position('BEGIN' in d) for 5);
 EXECUTE d;
END $$;
-- Existing allocation guard still validates quantities, state transitions and source graph.
CREATE FUNCTION ppo.guard_finance_agreement_allocation() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE l ppo.finance_lines; BEGIN
 SELECT * INTO STRICT l FROM ppo.finance_lines WHERE workspace_id=NEW.workspace_id AND id=NEW.line_id;
 IF NEW.agreement_revision_id IS DISTINCT FROM l.agreement_revision_id OR NEW.agreement_charge_id IS DISTINCT FROM l.agreement_charge_id
 THEN RAISE EXCEPTION 'Exact agreement allocation identity required' USING ERRCODE='23514'; END IF; RETURN NEW;
END $$;
CREATE TRIGGER agreement_allocation_exact BEFORE INSERT OR UPDATE ON ppo.finance_allocation_holds FOR EACH ROW EXECUTE FUNCTION ppo.guard_finance_agreement_allocation();
DO $$ DECLARE d text; BEGIN
 SELECT pg_get_functiondef('ppo.check_finance_project_state()'::regprocedure) INTO STRICT d;
 d:=replace(replace(d,'check_finance_project_state','check_finance_agreement_state'),'''ProjectClaim''','''AgreementCharge''');
 EXECUTE d;
END $$;
CREATE CONSTRAINT TRIGGER finance_agreement_allocation_state AFTER INSERT OR UPDATE ON ppo.finance_allocation_holds DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_finance_agreement_state();
CREATE CONSTRAINT TRIGGER finance_agreement_state AFTER INSERT OR UPDATE ON ppo.finance_handoffs DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_finance_agreement_state();
