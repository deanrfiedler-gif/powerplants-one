-- P11 failed disposable CI 34105904946: avoid variable/entry-decision alias ambiguity.
-- Forward repair preserves the already-executed 0013 checksum and all original rows.
CREATE OR REPLACE FUNCTION ppo.guard_finance_line() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE e ppo.field_entries; rv ppo.report_reviews; q numeric; u text; direction text; basis_definition jsonb;
BEGIN
 SELECT e0.* INTO STRICT e FROM ppo.field_entries e0 JOIN ppo.report_entry_refs rr ON (rr.workspace_id,rr.entry_id,rr.entry_version)=(e0.workspace_id,e0.id,e0.version) WHERE rr.workspace_id=NEW.workspace_id AND rr.report_revision_id=NEW.report_revision_id AND rr.entry_id=NEW.entry_id;
 SELECT r.* INTO STRICT rv FROM ppo.report_reviews r JOIN ppo.finance_sources s ON s.review_id=r.id WHERE s.workspace_id=NEW.workspace_id AND s.revision_id=NEW.revision_id AND s.report_revision_id=NEW.report_revision_id;
 IF e.kind='Time' AND (e.payload->>'elapsed_seconds')::numeric%60=0 AND e.payload->>'time_kind' IN ('Labour','Travel') THEN
  q:=(e.payload->>'elapsed_seconds')::numeric/60; u:='MIN'; direction:=e.payload->>'time_kind';
  IF direction='Travel' THEN
   SELECT f.definition INTO STRICT basis_definition FROM ppo.finance_revisions v JOIN ppo.finance_definitions f ON (f.workspace_id,f.id,f.version)=(v.workspace_id,v.definition_id,v.definition_version) WHERE v.workspace_id=NEW.workspace_id AND v.id=NEW.revision_id;
   IF (basis_definition->'quantity'->'travel') IS DISTINCT FROM '{"duration":"WholeMinutes","uom":"MIN","disposition":"NonBillable","posting":"Prohibited"}'::jsonb THEN
    RAISE EXCEPTION 'Exact approved synthetic Travel definition required' USING ERRCODE='23514';
   END IF;
  END IF;
 ELSIF e.kind='Material' THEN
  q:=(e.payload->>'quantity')::numeric; u:=e.payload->>'uom'; direction:=e.payload->>'movement_kind';
 ELSE RAISE EXCEPTION 'Unsupported quantity definition' USING ERRCODE='23514';
 END IF;
 IF NEW.entry_version<>e.version OR NEW.root_entry_id<>e.root_id OR NEW.captured_quantity<>q OR NEW.uom<>u OR NEW.direction<>direction OR NEW.source_entry_hash !~ '^[a-f0-9]{64}$' OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(rv.entry_decisions) d WHERE d->>'id'=e.id::text AND (d->>'version')::integer=e.version AND d->>'decision'='Approved') THEN
  RAISE EXCEPTION 'Exact original captured and reviewed quantity required' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
