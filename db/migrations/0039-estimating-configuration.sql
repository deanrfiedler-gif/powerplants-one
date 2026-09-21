-- ADR-0033: immutable configuration entity ownership, captured in revision JSON.
-- Existing r01 inputs/receipts/output bytes are not rewritten. No new grants.
CREATE TABLE ppo.estimating_configuration_entities (
 workspace_id uuid NOT NULL, company_id uuid NOT NULL, estimating_workspace_id uuid NOT NULL,
 option_id uuid NOT NULL, id uuid NOT NULL, kind text NOT NULL,
 first_revision_id uuid NOT NULL, source_revision_id uuid, source_entity_id uuid,
 PRIMARY KEY(workspace_id,id),
 UNIQUE(workspace_id,estimating_workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,estimating_workspace_id) REFERENCES ppo.estimating_workspaces(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,estimating_workspace_id,option_id) REFERENCES ppo.estimating_options(workspace_id,estimating_workspace_id,id),
 FOREIGN KEY(workspace_id,option_id,first_revision_id) REFERENCES ppo.estimation_revisions(workspace_id,option_id,id) DEFERRABLE INITIALLY DEFERRED,
 FOREIGN KEY(workspace_id,estimating_workspace_id,source_revision_id) REFERENCES ppo.estimation_revisions(workspace_id,estimating_workspace_id,id),
 FOREIGN KEY(workspace_id,estimating_workspace_id,source_entity_id) REFERENCES ppo.estimating_configuration_entities(workspace_id,estimating_workspace_id,id),
 CHECK(kind IN ('areas','systems','facts','evidence','responsibilities','follow_ups')),
 CHECK((source_revision_id IS NULL)=(source_entity_id IS NULL))
);
CREATE TRIGGER retain_configuration_identity BEFORE UPDATE OR DELETE ON ppo.estimating_configuration_entities FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

CREATE FUNCTION ppo.check_estimating_configuration() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE cfg jsonb:=NEW.input->'configuration'; group_name text; entry jsonb; member jsonb; max_count integer;
 ids uuid[]:='{}'; area_ids uuid[]; system_ids uuid[]; fact_ids uuid[]; evidence_ids uuid[];
 existing ppo.estimating_configuration_entities; prior jsonb; source jsonb;
BEGIN
 IF NEW.kind<>'Discovery' OR NOT (NEW.input ? 'configuration') THEN RETURN NEW; END IF;
 IF jsonb_typeof(cfg) IS DISTINCT FROM 'object' OR cfg->>'schema_version' IS DISTINCT FROM '1'
 OR cfg->>'definition_id' IS DISTINCT FROM 'PPO-ES02-CONFIG-r01' THEN RAISE EXCEPTION 'Unsupported configuration schema' USING ERRCODE='23514'; END IF;
 SELECT input->'configuration' INTO prior FROM ppo.estimation_revisions WHERE workspace_id=NEW.workspace_id AND id=NEW.predecessor_id;
 FOR group_name,max_count IN SELECT * FROM (VALUES ('areas',20),('systems',40),('facts',160),('evidence',120),('responsibilities',80),('follow_ups',160)) AS groups(n,m) LOOP
  IF jsonb_typeof(cfg->group_name) IS DISTINCT FROM 'array' OR jsonb_array_length(cfg->group_name)>max_count THEN RAISE EXCEPTION 'Bounded configuration collection required' USING ERRCODE='23514'; END IF;
  FOR entry IN SELECT * FROM jsonb_array_elements(cfg->group_name) LOOP
   IF entry->>'id' IS NULL OR (entry->>'id')::uuid=ANY(ids) THEN RAISE EXCEPTION 'Unique configuration identity required' USING ERRCODE='23514'; END IF;
   ids:=array_append(ids,(entry->>'id')::uuid);
   SELECT * INTO existing FROM ppo.estimating_configuration_entities WHERE workspace_id=NEW.workspace_id AND id=(entry->>'id')::uuid;
   IF FOUND THEN
    IF (existing.company_id,existing.estimating_workspace_id,existing.option_id,existing.kind,existing.source_revision_id,existing.source_entity_id)
     IS DISTINCT FROM (NEW.company_id,NEW.estimating_workspace_id,NEW.option_id,group_name,(entry->'lineage'->>'revision_id')::uuid,(entry->'lineage'->>'entity_id')::uuid)
     THEN RAISE EXCEPTION 'Retain configuration ownership and exact lineage' USING ERRCODE='23514'; END IF;
    IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(prior->group_name) e WHERE e->>'id'=entry->>'id')
     AND NOT EXISTS(SELECT 1 FROM ppo.estimation_revisions h CROSS JOIN LATERAL jsonb_array_elements(h.input->'configuration'->group_name) e
       WHERE h.workspace_id=NEW.workspace_id AND h.option_id=NEW.option_id AND h.id=(NEW.comparison->>'historical_source_id')::uuid AND e->>'id'=entry->>'id')
     THEN RAISE EXCEPTION 'Removed identity requires explicit historical starting point' USING ERRCODE='23514'; END IF;
   ELSE
    IF entry->'lineage'->>'revision_id' IS NOT NULL THEN
     SELECT input->'configuration' INTO source FROM ppo.estimation_revisions WHERE workspace_id=NEW.workspace_id AND estimating_workspace_id=NEW.estimating_workspace_id AND id=(entry->'lineage'->>'revision_id')::uuid;
     IF NEW.copied_from_id IS DISTINCT FROM (entry->'lineage'->>'revision_id')::uuid OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(source->group_name) e WHERE e->>'id'=entry->'lineage'->>'entity_id') THEN RAISE EXCEPTION 'Exact copied source entity required' USING ERRCODE='23514'; END IF;
    END IF;
    INSERT INTO ppo.estimating_configuration_entities VALUES(NEW.workspace_id,NEW.company_id,NEW.estimating_workspace_id,NEW.option_id,(entry->>'id')::uuid,group_name,NEW.id,(entry->'lineage'->>'revision_id')::uuid,(entry->'lineage'->>'entity_id')::uuid);
   END IF;
  END LOOP;
 END LOOP;
 SELECT coalesce(array_agg((e->>'id')::uuid),'{}') INTO area_ids FROM jsonb_array_elements(cfg->'areas') e;
 SELECT coalesce(array_agg((e->>'id')::uuid),'{}') INTO system_ids FROM jsonb_array_elements(cfg->'systems') e;
 SELECT coalesce(array_agg((e->>'id')::uuid),'{}') INTO fact_ids FROM jsonb_array_elements(cfg->'facts') e;
 SELECT coalesce(array_agg((e->>'id')::uuid),'{}') INTO evidence_ids FROM jsonb_array_elements(cfg->'evidence') e;
 FOR entry IN SELECT * FROM jsonb_array_elements(cfg->'areas') LOOP
  IF entry->>'facility_id' IS NOT NULL AND NOT (NEW.input->'scope'->'facility_ids' @> jsonb_build_array(entry->>'facility_id')) THEN RAISE EXCEPTION 'Area Facility must belong to scope' USING ERRCODE='23514'; END IF;
 END LOOP;
 FOR entry IN SELECT * FROM jsonb_array_elements(cfg->'systems') LOOP
  IF entry->'coverage'->>'mode'='Defined' THEN
   IF jsonb_array_length(entry->'coverage'->'area_ids')<1 THEN RAISE EXCEPTION 'Defined coverage needs areas' USING ERRCODE='23514'; END IF;
  ELSIF entry->'coverage'->>'mode' IN ('Unknown','NotAreaSpecific') THEN
   IF jsonb_array_length(entry->'coverage'->'area_ids')<>0 THEN RAISE EXCEPTION 'Non-area coverage has no members' USING ERRCODE='23514'; END IF;
  ELSE RAISE EXCEPTION 'Explicit coverage mode required' USING ERRCODE='23514'; END IF;
  FOR member IN SELECT * FROM jsonb_array_elements(entry->'coverage'->'area_ids') LOOP
   IF NOT ((member#>>'{}')::uuid=ANY(area_ids)) THEN RAISE EXCEPTION 'Coverage must remain in this revision' USING ERRCODE='23514'; END IF;
  END LOOP;
  IF NOT ((NEW.input->'scope'->'equipment_ids') @> (entry->'equipment_ids')) THEN RAISE EXCEPTION 'Equipment must belong to scope' USING ERRCODE='23514'; END IF;
 END LOOP;
 FOR entry IN SELECT * FROM jsonb_array_elements(cfg->'facts') LOOP
  IF NOT ((entry->>'system_id')::uuid=ANY(system_ids)) THEN RAISE EXCEPTION 'Fact system must belong to revision' USING ERRCODE='23514'; END IF;
 END LOOP;
 FOR entry IN SELECT * FROM jsonb_array_elements(cfg->'responsibilities') LOOP
  FOR member IN SELECT * FROM jsonb_array_elements(entry->'area_ids') LOOP
   IF NOT ((member#>>'{}')::uuid=ANY(area_ids)) THEN RAISE EXCEPTION 'Responsibility area must belong to revision' USING ERRCODE='23514'; END IF;
  END LOOP;
  FOR member IN SELECT * FROM jsonb_array_elements(entry->'system_ids') LOOP
   IF NOT ((member#>>'{}')::uuid=ANY(system_ids)) THEN RAISE EXCEPTION 'Responsibility system must belong to revision' USING ERRCODE='23514'; END IF;
  END LOOP;
 END LOOP;
 FOR entry IN SELECT * FROM jsonb_array_elements(cfg->'areas') UNION ALL SELECT * FROM jsonb_array_elements(cfg->'systems') UNION ALL SELECT * FROM jsonb_array_elements(cfg->'facts') LOOP
  FOR member IN SELECT * FROM jsonb_array_elements(entry->'evidence_ids') LOOP
   IF NOT ((member#>>'{}')::uuid=ANY(evidence_ids)) THEN RAISE EXCEPTION 'Evidence must belong to revision' USING ERRCODE='23514'; END IF;
  END LOOP;
 END LOOP;
 FOR entry IN SELECT * FROM jsonb_array_elements(cfg->'follow_ups') LOOP
  IF entry->>'fact_id' IS NOT NULL AND NOT ((entry->>'fact_id')::uuid=ANY(fact_ids)) THEN RAISE EXCEPTION 'Follow-up origin must belong to revision' USING ERRCODE='23514'; END IF;
 END LOOP;
 RETURN NEW;
END $$;
CREATE TRIGGER configuration_integrity BEFORE INSERT ON ppo.estimation_revisions FOR EACH ROW EXECUTE FUNCTION ppo.check_estimating_configuration();
