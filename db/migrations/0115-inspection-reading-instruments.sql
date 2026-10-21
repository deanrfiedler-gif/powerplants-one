-- FI-03/FI-04: explicit attribution, authorised in inspections-reading-instruments.md.
-- Legacy attempts keep version zero and their exact original hashes. No attribution is inferred.
ALTER TABLE ppo.inspection_attempts ADD COLUMN reading_instrument_version smallint NOT NULL DEFAULT 0
  CONSTRAINT ck_inspection_attribution_version CHECK (reading_instrument_version IN (0,1));
CREATE TABLE ppo.inspection_reading_instruments (
  workspace_id uuid NOT NULL,
  company_id uuid NOT NULL,
  attempt_id uuid NOT NULL,
  check_key text NOT NULL,
  instrument_id uuid NOT NULL,
  PRIMARY KEY (workspace_id,attempt_id,check_key),
  FOREIGN KEY (workspace_id,company_id,attempt_id) REFERENCES ppo.inspection_attempts(workspace_id,company_id,id),
  FOREIGN KEY (workspace_id,attempt_id,check_key) REFERENCES ppo.inspection_results(workspace_id,attempt_id,check_key),
  FOREIGN KEY (workspace_id,attempt_id,instrument_id) REFERENCES ppo.inspection_instrument_uses(workspace_id,attempt_id,instrument_id)
);
CREATE FUNCTION ppo.guard_inspection_reading_instrument() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Check both identities on UPDATE: a frozen link cannot be moved to a draft.
  IF TG_OP IN ('UPDATE','DELETE') AND NOT EXISTS(
    SELECT 1 FROM ppo.inspection_attempts a WHERE a.workspace_id=OLD.workspace_id AND a.id=OLD.attempt_id AND a.state='Draft'
  ) THEN RAISE EXCEPTION 'Submitted reading attribution is frozen' USING ERRCODE='55000'; END IF;
  IF TG_OP IN ('INSERT','UPDATE') AND NOT EXISTS(
    SELECT 1 FROM ppo.inspection_attempts a WHERE a.workspace_id=NEW.workspace_id AND a.company_id=NEW.company_id
      AND a.id=NEW.attempt_id AND a.state='Draft' AND a.host_type='ServiceAppointment' AND a.reading_instrument_version=1
  ) THEN RAISE EXCEPTION 'Attribution requires an explicit Service draft' USING ERRCODE='55000'; END IF;
  RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END $$;
CREATE TRIGGER reading_instrument_frozen BEFORE INSERT OR UPDATE OR DELETE ON ppo.inspection_reading_instruments
  FOR EACH ROW EXECUTE FUNCTION ppo.guard_inspection_reading_instrument();
