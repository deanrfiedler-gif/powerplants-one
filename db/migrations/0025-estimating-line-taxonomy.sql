-- ADR-0023 / DR-01: preserve schema-1 lines and hashes; explicit new-version adoption only.
ALTER TABLE ppo.estimate_versions ADD COLUMN cost_schema_version integer NOT NULL DEFAULT 1
  CONSTRAINT estimate_cost_schema CHECK (cost_schema_version IN (1,2));

-- Read the installed function, retaining all prior decimal, identity, scope and predecessor guards.
-- Refuse an unreviewed definition instead of replacing or losing a later guard.
DO $$ DECLARE definition text; original text := $old$coalesce(row->>'category','') NOT IN ('Product','Labour','Freight')$old$;
  replacement text := $new$(coalesce(row->>'category','') NOT IN ('Product','Labour','Freight') AND
    (NEW.cost_schema_version <> 2 OR coalesce(row->>'category','') NOT IN ('Engineering','Subcontract')))
    OR (NEW.cost_schema_version = 1 AND row ? 'allowance')
    OR (NEW.cost_schema_version = 2 AND jsonb_typeof(row->'allowance') IS DISTINCT FROM 'boolean')$new$;
BEGIN
  SELECT pg_get_functiondef('ppo.check_estimate_version()'::regprocedure) INTO STRICT definition;
  IF (length(definition)-length(replace(definition,original,''))) <> length(original) THEN
    RAISE EXCEPTION 'Review current estimate arithmetic guard before taxonomy upgrade';
  END IF;
  EXECUTE replace(definition,original,replacement);
END $$;
