-- C1-1: agreement + charge UUID is conserved across immutable revision provenance.
-- Refuse ambiguous pre-fix histories; never silently rewrite financial evidence.
DO $$ BEGIN
 IF EXISTS (
  SELECT 1 FROM ppo.finance_allocation_holds h JOIN ppo.agreement_charge_lines l
   ON (l.workspace_id,l.revision_id,l.charge_id)=(h.workspace_id,h.agreement_revision_id,h.agreement_charge_id)
  WHERE h.state<>'Released' GROUP BY l.workspace_id,l.agreement_id,l.charge_id HAVING count(*)>1
 ) THEN RAISE EXCEPTION 'Duplicate agreement charge entitlements require explicit reconciliation before 0128' USING ERRCODE='23514'; END IF;
END $$;
CREATE INDEX agreement_charge_identity ON ppo.agreement_charge_lines(workspace_id,agreement_id,charge_id,revision_id);
CREATE OR REPLACE FUNCTION ppo.guard_finance_agreement_allocation() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE l ppo.finance_lines; agreement uuid;
BEGIN
 -- A lock alone does not refresh a REPEATABLE READ snapshot. A logical no-op
 -- write makes an older concurrent snapshot abort with 40001 instead of missing a hold.
 IF NEW.agreement_revision_id IS NOT NULL THEN
  UPDATE ppo.workspaces w SET id=w.id WHERE w.id=NEW.workspace_id;
 END IF;
 SELECT * INTO STRICT l FROM ppo.finance_lines WHERE workspace_id=NEW.workspace_id AND id=NEW.line_id;
 IF NEW.agreement_revision_id IS DISTINCT FROM l.agreement_revision_id OR NEW.agreement_charge_id IS DISTINCT FROM l.agreement_charge_id
 THEN RAISE EXCEPTION 'Exact agreement allocation identity required' USING ERRCODE='23514'; END IF;
 IF NEW.agreement_revision_id IS NOT NULL AND NEW.state<>'Released' THEN
  SELECT agreement_id INTO STRICT agreement FROM ppo.agreement_charge_lines
   WHERE workspace_id=NEW.workspace_id AND revision_id=NEW.agreement_revision_id AND charge_id=NEW.agreement_charge_id;
  IF EXISTS (SELECT 1 FROM ppo.finance_allocation_holds h JOIN ppo.agreement_charge_lines c
    ON (c.workspace_id,c.revision_id,c.charge_id)=(h.workspace_id,h.agreement_revision_id,h.agreement_charge_id)
   WHERE h.workspace_id=NEW.workspace_id AND c.agreement_id=agreement AND h.agreement_charge_id=NEW.agreement_charge_id
    AND h.state<>'Released' AND h.line_id<>NEW.line_id)
  THEN RAISE EXCEPTION 'Agreement entitlement already held or consumed across revisions' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE FUNCTION ppo.guard_reserved_agreement_charges() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 -- Keep the native workspace lock and fence older snapshots without changing stored values.
 UPDATE ppo.workspaces w SET id=w.id WHERE w.id=NEW.workspace_id;
 IF EXISTS (SELECT 1 FROM ppo.finance_allocation_holds h JOIN ppo.agreement_charge_lines l
    ON (l.workspace_id,l.revision_id,l.charge_id)=(h.workspace_id,h.agreement_revision_id,h.agreement_charge_id)
   WHERE h.workspace_id=NEW.workspace_id AND l.agreement_id=NEW.agreement_id AND h.state<>'Released'
    AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(NEW.content->'charge_schedule'->'lines') x
     WHERE (x->>'id')::uuid=l.charge_id AND (x->>'amount')::numeric=l.amount AND (x->>'due_date')::date=l.due_date
      AND NEW.content->'charge_schedule'->>'currency'=l.currency AND NEW.content->'charge_schedule'->>'tax_basis'=l.tax_basis))
 THEN RAISE EXCEPTION 'Held or consumed agreement charge terms must be retained' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER agreement_reserved_charges BEFORE INSERT ON ppo.agreement_revisions FOR EACH ROW EXECUTE FUNCTION ppo.guard_reserved_agreement_charges();
