-- AD-01 read-only inspection. Preserve all earlier capability/scope rules.
DO $$ DECLARE definition text; BEGIN
  SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint
    WHERE conrelid='ppo.permission_grants'::regclass AND conname='ck_grants_capability';
  ALTER TABLE ppo.permission_grants DROP CONSTRAINT ck_grants_capability;
  EXECUTE format('ALTER TABLE ppo.permission_grants ADD CONSTRAINT ck_grants_capability CHECK ((%s) OR capability = %L)',
    substring(definition from 8 for length(definition)-8), 'admin.access.read');
END $$;
ALTER TABLE ppo.permission_grants ADD CONSTRAINT ck_access_inspection_workspace
  CHECK (capability <> 'admin.access.read' OR scope_type='Workspace');
