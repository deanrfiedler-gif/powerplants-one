-- B3: ProjectClaim is a source in the existing Finance lifecycle. No seed/grant or ERP connection.
ALTER TABLE ppo.finance_handoffs
 ADD COLUMN source_kind text NOT NULL DEFAULT 'WorkOrder' CHECK(source_kind IN ('WorkOrder','ProjectClaim')),
 ADD COLUMN project_id uuid,
 ALTER COLUMN work_order_id DROP NOT NULL,
 ALTER COLUMN site_id DROP NOT NULL,
 ADD FOREIGN KEY(workspace_id,project_id) REFERENCES ppo.projects(workspace_id,id),
 ADD CONSTRAINT finance_source_kind CHECK ((source_kind='WorkOrder' AND work_order_id IS NOT NULL AND site_id IS NOT NULL AND project_id IS NULL) OR (source_kind='ProjectClaim' AND project_id IS NOT NULL AND work_order_id IS NULL));
ALTER TABLE ppo.finance_lines
 ADD COLUMN source_kind text NOT NULL DEFAULT 'WorkOrder' CHECK(source_kind IN ('WorkOrder','ProjectClaim')),
 ADD COLUMN claim_basis_id uuid, ADD COLUMN claim_event_version integer,
 ADD COLUMN claim_kind text, ADD COLUMN claim_target_id uuid,
 ADD COLUMN claim_amount numeric(18,2), ADD COLUMN claim_currency text, ADD COLUMN claim_tax_basis text,
 ALTER COLUMN report_revision_id DROP NOT NULL, ALTER COLUMN entry_id DROP NOT NULL,
 ALTER COLUMN entry_version DROP NOT NULL, ALTER COLUMN root_entry_id DROP NOT NULL,
 ADD FOREIGN KEY(workspace_id,claim_basis_id,claim_event_version) REFERENCES ppo.project_claim_events(workspace_id,basis_id,version),
 ADD CONSTRAINT finance_line_source_kind CHECK (
 (source_kind='WorkOrder' AND report_revision_id IS NOT NULL AND entry_id IS NOT NULL AND entry_version IS NOT NULL AND root_entry_id IS NOT NULL AND claim_basis_id IS NULL AND claim_event_version IS NULL AND claim_kind IS NULL AND claim_target_id IS NULL AND claim_amount IS NULL AND claim_currency IS NULL AND claim_tax_basis IS NULL)
 OR (source_kind='ProjectClaim' AND report_revision_id IS NULL AND entry_id IS NULL AND entry_version IS NULL AND root_entry_id IS NULL AND claim_basis_id IS NOT NULL AND claim_event_version IS NOT NULL AND claim_kind IN ('Milestone','Variation') AND claim_kind IS NOT NULL AND claim_target_id IS NOT NULL AND claim_amount>0 AND claim_amount IS NOT NULL AND claim_currency IS NOT NULL AND claim_tax_basis IS NOT NULL AND captured_quantity=1 AND reviewed_quantity=1 AND allocated_quantity=1 AND billable_quantity=1 AND disposition='Billable' AND uom='CLAIM' AND direction='Claim'));
-- Preserve the current (including P11 Travel) direction constraint.
DO $$ DECLARE item record; definition text; BEGIN
 FOR item IN SELECT conname FROM pg_constraint WHERE conrelid='ppo.finance_lines'::regclass AND contype='c' AND pg_get_constraintdef(oid) LIKE '%direction%' AND conname<>'finance_line_source_kind' LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid='ppo.finance_lines'::regclass AND conname=item.conname;
  EXECUTE format('ALTER TABLE ppo.finance_lines DROP CONSTRAINT %I',item.conname);
  EXECUTE format('ALTER TABLE ppo.finance_lines ADD CONSTRAINT %I CHECK ((%s) OR (source_kind=''ProjectClaim'' AND direction=''Claim''))',item.conname,substring(definition from 8 for length(definition)-8));
 END LOOP;
 SELECT conname INTO STRICT item FROM pg_constraint WHERE conrelid='ppo.finance_simulator_targets'::regclass AND contype='c' AND pg_get_constraintdef(oid) LIKE '%SyntheticServiceCharge%';
 EXECUTE format('ALTER TABLE ppo.finance_simulator_targets DROP CONSTRAINT %I',item.conname);
 ALTER TABLE ppo.finance_simulator_targets ADD CONSTRAINT finance_target_kind CHECK(kind IN ('SyntheticServiceCharge','SyntheticProjectClaim'));
END $$;
ALTER TABLE ppo.finance_allocation_holds
 ALTER COLUMN root_entry_id DROP NOT NULL,
 ADD COLUMN claim_basis_id uuid, ADD COLUMN claim_kind text, ADD COLUMN claim_target_id uuid,
 ADD FOREIGN KEY(workspace_id,claim_basis_id) REFERENCES ppo.project_commercial_entries(workspace_id,id),
 ADD CONSTRAINT finance_hold_source CHECK ((root_entry_id IS NOT NULL AND claim_basis_id IS NULL AND claim_kind IS NULL AND claim_target_id IS NULL) OR (root_entry_id IS NULL AND claim_basis_id IS NOT NULL AND claim_kind IS NOT NULL AND claim_kind IN ('Milestone','Variation') AND claim_target_id IS NOT NULL AND quantity=1));
CREATE UNIQUE INDEX finance_claim_entitlement_live ON ppo.finance_allocation_holds(workspace_id,claim_basis_id,claim_kind,claim_target_id) WHERE claim_basis_id IS NOT NULL AND state<>'Released';
CREATE UNIQUE INDEX finance_claim_line_once ON ppo.finance_lines(workspace_id,revision_id,claim_basis_id,claim_kind,claim_target_id) WHERE source_kind='ProjectClaim';
CREATE INDEX finance_project_claims ON ppo.finance_handoffs(workspace_id,project_id,id) WHERE source_kind='ProjectClaim';

CREATE FUNCTION ppo.guard_finance_project_identity() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE pr ppo.projects; BEGIN
 IF NEW.source_kind='ProjectClaim' THEN
  SELECT * INTO STRICT pr FROM ppo.projects WHERE workspace_id=NEW.workspace_id AND id=NEW.project_id;
  IF pr.company_id IS DISTINCT FROM NEW.company_id OR pr.organisation_id IS DISTINCT FROM NEW.customer_id OR pr.site_id IS DISTINCT FROM NEW.site_id THEN RAISE EXCEPTION 'Exact project account context required' USING ERRCODE='23514'; END IF;
 END IF; RETURN NEW;
END $$;
CREATE TRIGGER project_identity BEFORE INSERT ON ppo.finance_handoffs FOR EACH ROW EXECUTE FUNCTION ppo.guard_finance_project_identity();

-- Extend the live line guard, retaining its existing WorkOrder implementation byte-for-byte.
DO $$ DECLARE definition text; BEGIN
 SELECT pg_get_functiondef('ppo.guard_finance_line()'::regprocedure) INTO definition;
 IF position('BEGIN' in definition)=0 THEN RAISE EXCEPTION 'Inspect changed Finance line guard'; END IF;
 definition:=overlay(definition placing $branch$BEGIN
 IF NEW.source_kind='ProjectClaim' THEN
  IF NOT EXISTS(SELECT 1 FROM ppo.finance_revisions fr
   JOIN ppo.finance_handoffs h ON (h.workspace_id,h.id)=(fr.workspace_id,fr.handoff_id)
   JOIN ppo.project_commercial_entries b ON (b.workspace_id,b.id)=(fr.workspace_id,NEW.claim_basis_id)
   JOIN ppo.project_claim_events ce ON (ce.workspace_id,ce.basis_id,ce.version)=(b.workspace_id,b.id,NEW.claim_event_version)
   JOIN ppo.project_commercial_sources s ON (s.workspace_id,s.basis_id)=(b.workspace_id,b.id)
   WHERE fr.workspace_id=NEW.workspace_id AND fr.id=NEW.revision_id AND h.source_kind='ProjectClaim' AND b.project_id=h.project_id
    AND ce.command='RecordEvidence' AND ce.completion->>'kind'=NEW.claim_kind AND (ce.completion->>'target_id')::uuid=NEW.claim_target_id
    AND (ce.completion->>'amount')::numeric=NEW.claim_amount AND s.snapshot->>'currency'=NEW.claim_currency AND s.snapshot->>'tax_basis'=NEW.claim_tax_basis AND h.currency=NEW.claim_currency
    AND fr.source_snapshot->'project_claim'->>'basis_id'=b.id::text
    AND EXISTS(SELECT 1 FROM jsonb_array_elements(fr.source_snapshot->'project_claim'->'claims') x WHERE (x->>'event_version')::integer=ce.version AND x-'event_version'-'schedule_version'=ce.completion))
  THEN RAISE EXCEPTION 'Exact project claim line and frozen completion required' USING ERRCODE='23514'; END IF;
  RETURN NEW;
 END IF;
 IF NOT EXISTS(SELECT 1 FROM ppo.finance_revisions r JOIN ppo.finance_handoffs h ON (h.workspace_id,h.id)=(r.workspace_id,r.handoff_id) WHERE r.workspace_id=NEW.workspace_id AND r.id=NEW.revision_id AND h.source_kind='WorkOrder') THEN RAISE EXCEPTION 'WorkOrder source required' USING ERRCODE='23514'; END IF;
$branch$ from position('BEGIN' in definition) for 5);
 EXECUTE definition;
END $$;
CREATE OR REPLACE FUNCTION ppo.guard_finance_allocation() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE l ppo.finance_lines; total numeric; BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Allocation history is permanent' USING ERRCODE='55000'; END IF;
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 IF TG_OP='UPDATE' AND ((to_jsonb(NEW)-'state') IS DISTINCT FROM (to_jsonb(OLD)-'state') OR OLD.state<>'Held' OR NEW.state NOT IN ('Released','Consumed')) THEN RAISE EXCEPTION 'Allocation hold transition is controlled' USING ERRCODE='55000'; END IF;
 SELECT * INTO STRICT l FROM ppo.finance_lines WHERE workspace_id=NEW.workspace_id AND id=NEW.line_id;
 IF NEW.quantity<>l.allocated_quantity OR NEW.root_entry_id IS DISTINCT FROM l.root_entry_id OR NEW.revision_id<>l.revision_id
  OR NEW.claim_basis_id IS DISTINCT FROM l.claim_basis_id OR NEW.claim_kind IS DISTINCT FROM l.claim_kind OR NEW.claim_target_id IS DISTINCT FROM l.claim_target_id
  OR NOT EXISTS(SELECT 1 FROM ppo.finance_revisions WHERE workspace_id=NEW.workspace_id AND id=NEW.revision_id AND handoff_id=NEW.handoff_id)
 THEN RAISE EXCEPTION 'Exact source allocation required' USING ERRCODE='23514'; END IF;
 IF l.source_kind='ProjectClaim' THEN
  IF NEW.state<>'Released' AND EXISTS(SELECT 1 FROM ppo.finance_allocation_holds WHERE workspace_id=NEW.workspace_id AND claim_basis_id=NEW.claim_basis_id AND claim_kind=NEW.claim_kind AND claim_target_id=NEW.claim_target_id AND state<>'Released' AND line_id<>NEW.line_id)
  THEN RAISE EXCEPTION 'Project entitlement already held or consumed' USING ERRCODE='23514'; END IF;
 ELSE
  SELECT coalesce(sum(quantity),0) INTO total FROM ppo.finance_allocation_holds WHERE workspace_id=NEW.workspace_id AND root_entry_id=NEW.root_entry_id AND state<>'Released' AND line_id<>NEW.line_id;
  IF NEW.state<>'Released' AND total+NEW.quantity>l.reviewed_quantity THEN RAISE EXCEPTION 'Source quantity already allocated' USING ERRCODE='23514'; END IF;
 END IF; RETURN NEW;
END $$;
-- Deferred graph checks see the final aggregate/hold transition, including atomic revised Draft transfers.
CREATE FUNCTION ppo.check_finance_project_state() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE h ppo.finance_handoffs; BEGIN
 SELECT * INTO STRICT h FROM ppo.finance_handoffs WHERE workspace_id=NEW.workspace_id AND id=CASE WHEN TG_TABLE_NAME='finance_handoffs' THEN (to_jsonb(NEW)->>'id')::uuid ELSE (to_jsonb(NEW)->>'handoff_id')::uuid END;
 IF h.source_kind<>'ProjectClaim' THEN RETURN NULL; END IF;
 IF NOT EXISTS(SELECT 1 FROM ppo.finance_lines WHERE workspace_id=h.workspace_id AND revision_id=h.current_revision_id AND source_kind='ProjectClaim') THEN RAISE EXCEPTION 'Claim needs whole evidenced lines' USING ERRCODE='23514'; END IF;
 IF h.status NOT IN ('Draft','Cancelled') AND EXISTS(SELECT 1 FROM ppo.finance_lines l WHERE l.workspace_id=h.workspace_id AND l.revision_id=h.current_revision_id AND NOT EXISTS(SELECT 1 FROM ppo.finance_allocation_holds a WHERE a.workspace_id=l.workspace_id AND a.line_id=l.id AND a.handoff_id=h.id AND a.state IN ('Held','Consumed'))) THEN RAISE EXCEPTION 'Exact whole claim holds required' USING ERRCODE='23514'; END IF;
 IF EXISTS(SELECT 1 FROM ppo.finance_allocation_holds a WHERE a.workspace_id=h.workspace_id AND a.handoff_id=h.id AND a.state='Held' AND (h.status='Cancelled' OR a.revision_id<>h.current_revision_id)) THEN RAISE EXCEPTION 'Release abandoned claim holds atomically' USING ERRCODE='23514'; END IF;
 IF TG_TABLE_NAME='finance_allocation_holds' AND to_jsonb(NEW)->>'state'='Released' AND EXISTS(SELECT 1 FROM ppo.finance_processing_attempts a WHERE a.workspace_id=h.workspace_id AND a.handoff_id=h.id AND a.dispatch_started_at IS NOT NULL AND NOT EXISTS(SELECT 1 FROM ppo.finance_outcomes o WHERE o.workspace_id=a.workspace_id AND o.attempt_id=a.id AND o.outcome='NotProcessed')) THEN RAISE EXCEPTION 'Possible project claim effect retains entitlement' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER finance_project_allocation_state AFTER INSERT OR UPDATE ON ppo.finance_allocation_holds DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_finance_project_state();
CREATE CONSTRAINT TRIGGER finance_project_state AFTER INSERT OR UPDATE ON ppo.finance_handoffs DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_finance_project_state();
