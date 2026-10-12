-- CCE reference schema for PostgreSQL 16.
-- Proposed, not an applied PPO migration. Required parent contracts:
-- ppo.companies(workspace_id,id), ppo.users(workspace_id,id),
-- ppo.estimates(workspace_id,company_id,id), and
-- ppo.estimating_options(workspace_id,company_id,id),
-- ppo.estimate_versions(workspace_id,company_id,id),
-- ppo.estimate_versions(workspace_id,estimate_id,id).
-- Adoption guard additionally expects the native fields listed in the report.

BEGIN;

CREATE DOMAIN ppo.cce_sha256 AS bytea
  CHECK (octet_length(VALUE) = 32);
CREATE DOMAIN ppo.cce_amount AS numeric(24,6)
  CHECK (VALUE >= 0 AND VALUE < 'Infinity'::numeric);

CREATE TABLE ppo.cce_rules (
  workspace_id uuid NOT NULL,
  company_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  rule_code varchar(80) NOT NULL,
  scope_code varchar(80) NOT NULL,
  display_name varchar(200) NOT NULL,
  owner_id uuid NOT NULL,
  lock_version bigint NOT NULL DEFAULT 1 CHECK (lock_version > 0),
  retired_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  created_by uuid NOT NULL,
  PRIMARY KEY (workspace_id,company_id,id),
  UNIQUE (workspace_id,company_id,rule_code),
  FOREIGN KEY (workspace_id,company_id)
    REFERENCES ppo.companies(workspace_id,id),
  FOREIGN KEY (workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),
  FOREIGN KEY (workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
  CHECK (rule_code ~ '^[A-Z][A-Z0-9_-]{2,79}$'),
  CHECK (length(btrim(scope_code)) > 0),
  CHECK (length(btrim(display_name)) > 0)
);

CREATE TABLE ppo.cce_rule_versions (
  workspace_id uuid NOT NULL,
  company_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  rule_id uuid NOT NULL,
  version_number integer NOT NULL CHECK (version_number > 0),
  predecessor_id uuid,
  predecessor_number integer GENERATED ALWAYS AS
    (version_number - 1) STORED,
  definition_schema_version integer NOT NULL
    CHECK (definition_schema_version > 0),
  engine_abi varchar(80) NOT NULL,
  priority integer NOT NULL CHECK (priority BETWEEN 0 AND 100000),
  definition jsonb NOT NULL,
  content_hash ppo.cce_sha256 NOT NULL,
  change_reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  created_by uuid NOT NULL,
  PRIMARY KEY (workspace_id,company_id,id),
  UNIQUE (workspace_id,company_id,rule_id,version_number),
  UNIQUE (workspace_id,company_id,rule_id,id,version_number),
  FOREIGN KEY (workspace_id,company_id,rule_id)
    REFERENCES ppo.cce_rules(workspace_id,company_id,id),
  FOREIGN KEY (workspace_id,company_id,rule_id,
               predecessor_id,predecessor_number)
    REFERENCES ppo.cce_rule_versions(
      workspace_id,company_id,rule_id,id,version_number),
  FOREIGN KEY (workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
  CHECK ((version_number=1 AND predecessor_id IS NULL)
      OR (version_number>1 AND predecessor_id IS NOT NULL)),
  CHECK (length(btrim(engine_abi)) > 0),
  CHECK (length(btrim(change_reason)) BETWEEN 1 AND 2000),
  CHECK (jsonb_typeof(definition)='object'
    AND definition ?& ARRAY['name','when','actions']
    AND jsonb_typeof(definition->'name')='string'
    AND jsonb_typeof(definition->'when')='object'
    AND jsonb_typeof(definition->'actions')='array'
    AND jsonb_array_length(definition->'actions') BETWEEN 1 AND 100
    AND octet_length(definition::text)<=262144)
);

CREATE TABLE ppo.cce_ruleset_releases (
  workspace_id uuid NOT NULL,
  company_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  scope_code varchar(80) NOT NULL,
  engine_abi varchar(80) NOT NULL,
  engine_build_sha256 ppo.cce_sha256 NOT NULL,
  execution_contract jsonb NOT NULL,
  validation_evidence jsonb NOT NULL,
  expected_member_count integer NOT NULL
    CHECK (expected_member_count BETWEEN 0 AND 1000),
  assembly_generation integer NOT NULL DEFAULT 0
    CHECK (assembly_generation BETWEEN 0 AND 1000),
  empty_release_reason text,
  sealed boolean NOT NULL DEFAULT false,
  sealed_at timestamptz,
  sealed_by uuid,
  content_hash ppo.cce_sha256,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  created_by uuid NOT NULL,
  PRIMARY KEY (workspace_id,company_id,id),
  UNIQUE (workspace_id,company_id,id,sealed),
  UNIQUE (workspace_id,company_id,scope_code,id,sealed),
  FOREIGN KEY (workspace_id,company_id)
    REFERENCES ppo.companies(workspace_id,id),
  FOREIGN KEY (workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
  FOREIGN KEY (workspace_id,sealed_by) REFERENCES ppo.users(workspace_id,id),
  CHECK (length(btrim(scope_code)) > 0 AND length(btrim(engine_abi)) > 0),
  CHECK (assembly_generation <= expected_member_count),
  CHECK (jsonb_typeof(execution_contract)='object'
    AND octet_length(execution_contract::text)<=1048576),
  CHECK (jsonb_typeof(validation_evidence)='object'
    AND octet_length(validation_evidence::text)<=262144),
  CHECK ((expected_member_count=0 AND empty_release_reason IS NOT NULL
          AND length(btrim(empty_release_reason)) BETWEEN 1 AND 2000)
      OR (expected_member_count>0 AND empty_release_reason IS NULL)),
  CHECK ((NOT sealed AND sealed_at IS NULL AND sealed_by IS NULL
          AND content_hash IS NULL)
      OR (sealed AND sealed_at IS NOT NULL AND sealed_by IS NOT NULL
          AND content_hash IS NOT NULL))
);

CREATE TABLE ppo.cce_ruleset_members (
  workspace_id uuid NOT NULL,
  company_id uuid NOT NULL,
  release_id uuid NOT NULL,
  rule_id uuid NOT NULL,
  rule_version_id uuid NOT NULL,
  version_number integer NOT NULL,
  PRIMARY KEY (workspace_id,company_id,release_id,rule_id),
  FOREIGN KEY (workspace_id,company_id,release_id)
    REFERENCES ppo.cce_ruleset_releases(workspace_id,company_id,id),
  FOREIGN KEY (workspace_id,company_id,rule_id,rule_version_id,version_number)
    REFERENCES ppo.cce_rule_versions(
      workspace_id,company_id,rule_id,id,version_number)
);

CREATE TABLE ppo.cce_release_heads (
  workspace_id uuid NOT NULL,
  company_id uuid NOT NULL,
  scope_code varchar(80) NOT NULL,
  release_id uuid NOT NULL,
  release_sealed boolean NOT NULL DEFAULT true CHECK (release_sealed),
  lock_version bigint NOT NULL DEFAULT 1 CHECK (lock_version>0),
  changed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  changed_by uuid NOT NULL,
  PRIMARY KEY (workspace_id,company_id,scope_code),
  FOREIGN KEY (workspace_id,company_id,scope_code,release_id,release_sealed)
    REFERENCES ppo.cce_ruleset_releases(
      workspace_id,company_id,scope_code,id,sealed),
  FOREIGN KEY (workspace_id,changed_by) REFERENCES ppo.users(workspace_id,id)
);

CREATE TABLE ppo.cce_evaluation_runs (
  workspace_id uuid NOT NULL,
  company_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  option_id uuid NOT NULL,
  estimate_id uuid,
  base_estimate_version_id uuid,
  release_id uuid NOT NULL,
  release_sealed boolean NOT NULL DEFAULT true CHECK (release_sealed),
  run_schema_version integer NOT NULL CHECK (run_schema_version>0),
  request_id uuid NOT NULL,
  request_hash ppo.cce_sha256 NOT NULL,
  calculation_signature ppo.cce_sha256 NOT NULL,
  source_vector_hash ppo.cce_sha256 NOT NULL,
  result_state text NOT NULL CHECK (result_state IN ('READY','BLOCKED')),
  fact_snapshot jsonb NOT NULL,
  cost_basis_snapshot jsonb NOT NULL,
  base_manifest jsonb NOT NULL,
  override_snapshot jsonb NOT NULL,
  effective_manifest jsonb NOT NULL,
  receiving_proposal jsonb NOT NULL,
  execution_trace jsonb NOT NULL,
  diagnostics jsonb NOT NULL,
  currency varchar(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  cost_total ppo.cce_amount,
  sell_total ppo.cce_amount,
  content_hash ppo.cce_sha256 NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  created_by uuid NOT NULL,
  PRIMARY KEY (workspace_id,company_id,id),
  UNIQUE (workspace_id,company_id,request_id),
  UNIQUE (workspace_id,company_id,id,option_id),
  UNIQUE (workspace_id,company_id,id,release_id,result_state),
  FOREIGN KEY (workspace_id,company_id,estimate_id)
    REFERENCES ppo.estimates(workspace_id,company_id,id),
  FOREIGN KEY (workspace_id,company_id,option_id)
    REFERENCES ppo.estimating_options(workspace_id,company_id,id),
  FOREIGN KEY (workspace_id,estimate_id,base_estimate_version_id)
    REFERENCES ppo.estimate_versions(workspace_id,estimate_id,id),
  FOREIGN KEY (workspace_id,company_id,release_id,release_sealed)
    REFERENCES ppo.cce_ruleset_releases(workspace_id,company_id,id,sealed),
  FOREIGN KEY (workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
  CHECK ((estimate_id IS NULL)=(base_estimate_version_id IS NULL)),
  CHECK (jsonb_typeof(fact_snapshot)='object'),
  CHECK (jsonb_typeof(cost_basis_snapshot)='object'),
  CHECK (jsonb_typeof(base_manifest)='object'),
  CHECK (jsonb_typeof(override_snapshot)='array'),
  CHECK (jsonb_typeof(effective_manifest)='object'),
  CHECK (jsonb_typeof(receiving_proposal)='object'),
  CHECK (jsonb_typeof(execution_trace)='object'),
  CHECK (jsonb_typeof(diagnostics)='array'),
  CHECK ((result_state='READY' AND cost_total IS NOT NULL
          AND sell_total IS NOT NULL
          AND receiving_proposal ?& ARRAY[
            'nativeLines','nativeScope','nativeTitle',
            'nativePolicy','nativeCostSchemaVersion'])
      OR (result_state='BLOCKED' AND cost_total IS NULL
          AND sell_total IS NULL AND jsonb_array_length(diagnostics)>0))
);

CREATE TABLE ppo.estimate_bom_snapshots (
  workspace_id uuid NOT NULL,
  company_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  estimate_id uuid NOT NULL,
  option_id uuid NOT NULL,
  estimate_version_id uuid NOT NULL,
  run_id uuid NOT NULL,
  release_id uuid NOT NULL,
  run_state text NOT NULL DEFAULT 'READY' CHECK (run_state='READY'),
  snapshot_schema_version integer NOT NULL CHECK (snapshot_schema_version>0),
  request_id uuid NOT NULL,
  request_hash ppo.cce_sha256 NOT NULL,
  run_evidence_hash ppo.cce_sha256 NOT NULL,
  native_content_hash text NOT NULL
    CHECK (native_content_hash ~ '^[a-f0-9]{64}$'),
  final_manifest jsonb NOT NULL CHECK (jsonb_typeof(final_manifest)='object'),
  currency varchar(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  cost_total ppo.cce_amount NOT NULL,
  sell_total ppo.cce_amount NOT NULL,
  reason text NOT NULL CHECK (length(btrim(reason)) BETWEEN 1 AND 2000),
  content_hash ppo.cce_sha256 NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  created_by uuid NOT NULL,
  PRIMARY KEY (workspace_id,company_id,id),
  UNIQUE (workspace_id,company_id,estimate_version_id),
  UNIQUE (workspace_id,company_id,run_id),
  UNIQUE (workspace_id,company_id,request_id),
  FOREIGN KEY (workspace_id,company_id,estimate_version_id)
    REFERENCES ppo.estimate_versions(workspace_id,company_id,id),
  FOREIGN KEY (workspace_id,estimate_id,estimate_version_id)
    REFERENCES ppo.estimate_versions(workspace_id,estimate_id,id),
  FOREIGN KEY (workspace_id,company_id,run_id,option_id)
    REFERENCES ppo.cce_evaluation_runs(workspace_id,company_id,id,option_id),
  FOREIGN KEY (workspace_id,company_id,run_id,release_id,run_state)
    REFERENCES ppo.cce_evaluation_runs(
      workspace_id,company_id,id,release_id,result_state),
  FOREIGN KEY (workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);

CREATE INDEX cce_rule_registry ON ppo.cce_rules(
  workspace_id,company_id,scope_code,id) WHERE retired_at IS NULL;
CREATE INDEX cce_release_registry ON ppo.cce_ruleset_releases(
  workspace_id,company_id,scope_code,created_at DESC,id) WHERE sealed;
CREATE INDEX cce_member_version ON ppo.cce_ruleset_members(
  workspace_id,company_id,rule_version_id,release_id);
CREATE INDEX cce_run_estimate ON ppo.cce_evaluation_runs(
  workspace_id,company_id,estimate_id,created_at DESC,id);
CREATE INDEX cce_run_option ON ppo.cce_evaluation_runs(
  workspace_id,company_id,option_id,created_at DESC,id);
CREATE INDEX cce_run_release ON ppo.cce_evaluation_runs(
  workspace_id,company_id,release_id);
CREATE INDEX cce_snapshot_estimate ON ppo.estimate_bom_snapshots(
  workspace_id,company_id,estimate_id,created_at DESC,id);

CREATE FUNCTION ppo.cce_reject_change() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
  RAISE EXCEPTION 'CCE evidence is retained; create a successor'
    USING ERRCODE='23514';
END;
$$;

CREATE FUNCTION ppo.cce_hash_evidence() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog
  SET timezone='UTC' SET datestyle='ISO, YMD' AS $$
DECLARE body jsonb;
BEGIN
  IF TG_TABLE_NAME='cce_rule_versions' THEN
    -- Generated predecessor_number is unavailable in BEFORE triggers.
    -- Hash its authoritative inputs; omit the derived column explicitly.
    body := jsonb_build_object(
      'workspace_id',NEW.workspace_id,'company_id',NEW.company_id,
      'id',NEW.id,'rule_id',NEW.rule_id,
      'version_number',NEW.version_number,'predecessor_id',NEW.predecessor_id,
      'definition_schema_version',NEW.definition_schema_version,
      'engine_abi',NEW.engine_abi,'priority',NEW.priority,
      'definition',NEW.definition,'change_reason',NEW.change_reason,
      'created_at',NEW.created_at,'created_by',NEW.created_by
    );
  ELSE
    body := to_jsonb(NEW)-'content_hash';
  END IF;
  IF octet_length(body::text)>2097152 THEN
    RAISE EXCEPTION 'CCE evidence exceeds 2 MiB' USING ERRCODE='23514';
  END IF;
  NEW.content_hash := sha256(convert_to(body::text,'UTF8'));
  RETURN NEW;
END;
$$;

CREATE FUNCTION ppo.cce_guard_rule_root() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
  IF (to_jsonb(NEW)-ARRAY['display_name','owner_id','retired_at','lock_version'])
     IS DISTINCT FROM
     (to_jsonb(OLD)-ARRAY['display_name','owner_id','retired_at','lock_version'])
     OR NEW.lock_version<>OLD.lock_version+1 THEN
    RAISE EXCEPTION 'Retain rule identity and advance expected version'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE FUNCTION ppo.cce_guard_release() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog
  SET timezone='UTC' SET datestyle='ISO, YMD' AS $$
DECLARE member_count integer; members jsonb; body jsonb;
BEGIN
  IF TG_OP='INSERT' THEN
    IF NEW.sealed OR NEW.assembly_generation<>0 OR NEW.content_hash IS NOT NULL THEN
      RAISE EXCEPTION 'Release must start as an empty unsealed assembly';
    END IF;
    RETURN NEW;
  END IF;
  IF OLD.sealed THEN
    RAISE EXCEPTION 'Sealed release is immutable' USING ERRCODE='23514';
  END IF;

  IF NOT NEW.sealed THEN
    IF NEW.assembly_generation<>OLD.assembly_generation+1
       OR (to_jsonb(NEW)-'assembly_generation')
          IS DISTINCT FROM (to_jsonb(OLD)-'assembly_generation') THEN
      RAISE EXCEPTION 'Only member assembly progression is permitted';
    END IF;
    RETURN NEW;
  END IF;

  IF (to_jsonb(NEW)-ARRAY['sealed','sealed_at','sealed_by','content_hash'])
     IS DISTINCT FROM
     (to_jsonb(OLD)-ARRAY['sealed','sealed_at','sealed_by','content_hash']) THEN
    RAISE EXCEPTION 'Sealing cannot alter the release definition';
  END IF;
  IF NEW.sealed_at IS NULL OR NEW.sealed_by IS NULL THEN
    RAISE EXCEPTION 'Sealing actor and time required';
  END IF;

  SELECT count(*)::integer,
    coalesce(jsonb_agg(jsonb_build_object(
      'ruleId',m.rule_id,'versionId',m.rule_version_id,
      'versionNumber',m.version_number,'hash',encode(v.content_hash,'hex')
    ) ORDER BY m.rule_id),'[]'::jsonb)
  INTO member_count,members
  FROM ppo.cce_ruleset_members m
  JOIN ppo.cce_rule_versions v
    ON v.workspace_id=m.workspace_id AND v.company_id=m.company_id
   AND v.id=m.rule_version_id
  WHERE m.workspace_id=NEW.workspace_id AND m.company_id=NEW.company_id
    AND m.release_id=NEW.id;

  IF member_count<>NEW.expected_member_count
     OR member_count<>NEW.assembly_generation THEN
    RAISE EXCEPTION 'Release membership does not match complete assembly';
  END IF;
  IF EXISTS (
    SELECT 1 FROM ppo.cce_ruleset_members m
    JOIN ppo.cce_rule_versions v
      ON v.workspace_id=m.workspace_id AND v.company_id=m.company_id
     AND v.id=m.rule_version_id
    JOIN ppo.cce_rules r
      ON r.workspace_id=m.workspace_id AND r.company_id=m.company_id
     AND r.id=m.rule_id
    WHERE m.workspace_id=NEW.workspace_id AND m.company_id=NEW.company_id
      AND m.release_id=NEW.id
      AND (v.engine_abi<>NEW.engine_abi OR r.scope_code<>NEW.scope_code)
  ) THEN
    RAISE EXCEPTION 'Incompatible engine ABI or release scope';
  END IF;

  body := (to_jsonb(NEW)-'content_hash') || jsonb_build_object('members',members);
  NEW.content_hash := sha256(convert_to(body::text,'UTF8'));
  RETURN NEW;
END;
$$;

CREATE FUNCTION ppo.cce_guard_member_insert() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
  -- UPDATE both serializes membership and records a real parent-row change.
  UPDATE ppo.cce_ruleset_releases
  SET assembly_generation=assembly_generation+1
  WHERE workspace_id=NEW.workspace_id AND company_id=NEW.company_id
    AND id=NEW.release_id AND NOT sealed
    AND assembly_generation<expected_member_count;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Release unavailable, sealed or assembly already complete'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE FUNCTION ppo.cce_guard_head() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
  IF TG_OP='INSERT' THEN
    IF NEW.lock_version<>1 THEN RAISE EXCEPTION 'Initial head version must be 1'; END IF;
  ELSIF (NEW.workspace_id,NEW.company_id,NEW.scope_code)
     IS DISTINCT FROM (OLD.workspace_id,OLD.company_id,OLD.scope_code)
     OR NEW.lock_version<>OLD.lock_version+1 THEN
    RAISE EXCEPTION 'Retain head identity and increment expected version';
  END IF;
  RETURN NEW;
END;
$$;

CREATE FUNCTION ppo.cce_check_adoption() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $$
DECLARE r ppo.cce_evaluation_runs; v ppo.estimate_versions; e ppo.estimates;
BEGIN
  SELECT * INTO STRICT r FROM ppo.cce_evaluation_runs
    WHERE workspace_id=NEW.workspace_id AND company_id=NEW.company_id
      AND id=NEW.run_id;
  SELECT * INTO STRICT v FROM ppo.estimate_versions
    WHERE workspace_id=NEW.workspace_id AND company_id=NEW.company_id
      AND id=NEW.estimate_version_id;
  SELECT * INTO STRICT e FROM ppo.estimates
    WHERE workspace_id=NEW.workspace_id AND company_id=NEW.company_id
      AND id=NEW.estimate_id;

  IF r.result_state<>'READY'
     OR e.option_id IS DISTINCT FROM r.option_id
     OR (r.estimate_id IS NOT NULL AND r.estimate_id<>NEW.estimate_id)
     OR NEW.run_evidence_hash IS DISTINCT FROM r.content_hash
     OR NEW.final_manifest IS DISTINCT FROM r.effective_manifest
     OR NEW.currency IS DISTINCT FROM r.currency
     OR NEW.cost_total IS DISTINCT FROM r.cost_total
     OR NEW.sell_total IS DISTINCT FROM r.sell_total
     OR NEW.native_content_hash IS DISTINCT FROM v.content_hash
     OR v.predecessor_id IS DISTINCT FROM r.base_estimate_version_id
     OR v.cost_total IS DISTINCT FROM r.cost_total
     OR v.sell_total IS DISTINCT FROM r.sell_total
     OR v.lines IS DISTINCT FROM (r.receiving_proposal->'nativeLines')
     OR v.scope IS DISTINCT FROM (r.receiving_proposal->'nativeScope')
     OR v.title IS DISTINCT FROM (r.receiving_proposal->>'nativeTitle')
     OR v.policy IS DISTINCT FROM (r.receiving_proposal->>'nativePolicy')
     OR v.cost_schema_version IS DISTINCT FROM
        ((r.receiving_proposal->>'nativeCostSchemaVersion')::integer) THEN
    RAISE EXCEPTION 'Adoption must match exact ready run and native successor'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE FUNCTION ppo.cce_check_run_context() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
  IF NEW.estimate_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM ppo.estimates e
    WHERE e.workspace_id=NEW.workspace_id AND e.company_id=NEW.company_id
      AND e.id=NEW.estimate_id AND e.option_id=NEW.option_id
  ) THEN
    RAISE EXCEPTION 'Run estimate and option must share exact context';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER cce_rule_root_guard BEFORE UPDATE ON ppo.cce_rules
  FOR EACH ROW EXECUTE FUNCTION ppo.cce_guard_rule_root();
CREATE TRIGGER cce_release_guard BEFORE INSERT OR UPDATE ON ppo.cce_ruleset_releases
  FOR EACH ROW EXECUTE FUNCTION ppo.cce_guard_release();
CREATE TRIGGER cce_member_guard BEFORE INSERT ON ppo.cce_ruleset_members
  FOR EACH ROW EXECUTE FUNCTION ppo.cce_guard_member_insert();
CREATE TRIGGER cce_head_guard BEFORE INSERT OR UPDATE ON ppo.cce_release_heads
  FOR EACH ROW EXECUTE FUNCTION ppo.cce_guard_head();
CREATE TRIGGER cce_adoption_check BEFORE INSERT ON ppo.estimate_bom_snapshots
  FOR EACH ROW EXECUTE FUNCTION ppo.cce_check_adoption();
CREATE TRIGGER cce_run_context BEFORE INSERT ON ppo.cce_evaluation_runs
  FOR EACH ROW EXECUTE FUNCTION ppo.cce_check_run_context();

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['cce_rule_versions','cce_evaluation_runs','estimate_bom_snapshots'] LOOP
    EXECUTE format('CREATE TRIGGER cce_evidence_hash BEFORE INSERT ON ppo.%I
      FOR EACH ROW EXECUTE FUNCTION ppo.cce_hash_evidence()',t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['cce_rule_versions','cce_ruleset_members',
                           'cce_evaluation_runs','estimate_bom_snapshots'] LOOP
    EXECUTE format('CREATE TRIGGER cce_immutable BEFORE UPDATE OR DELETE ON ppo.%I
      FOR EACH ROW EXECUTE FUNCTION ppo.cce_reject_change()',t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['cce_rules','cce_ruleset_releases','cce_release_heads'] LOOP
    EXECUTE format('CREATE TRIGGER cce_retained BEFORE DELETE ON ppo.%I
      FOR EACH ROW EXECUTE FUNCTION ppo.cce_reject_change()',t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['cce_rules','cce_rule_versions','cce_ruleset_releases',
    'cce_ruleset_members','cce_release_heads','cce_evaluation_runs','estimate_bom_snapshots'] LOOP
    EXECUTE format('CREATE TRIGGER cce_no_truncate BEFORE TRUNCATE ON ppo.%I
      FOR EACH STATEMENT EXECUTE FUNCTION ppo.cce_reject_change()',t);
    EXECUTE format('REVOKE ALL ON TABLE ppo.%I FROM PUBLIC',t);
  END LOOP;
END;
$$;

COMMIT;
