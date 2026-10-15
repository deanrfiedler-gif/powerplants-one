-- PJ-06 internal coordination only: no source mutation, backfill, seed or grant.
SET CONSTRAINTS ppo.identity_target IMMEDIATE;
DO $$ DECLARE spec record; definition text; BEGIN
 FOR spec IN SELECT * FROM (VALUES ('business_identities','ck_identities_type'),('audit_events','ck_audit_object_type')) v(tab,con) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid=('ppo.'||spec.tab)::regclass AND conname=spec.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',spec.tab,spec.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR object_type = ''ProjectSpecialistPackage'')',spec.tab,spec.con,substring(definition from 8 for length(definition)-8));
 END LOOP;
 SELECT pg_get_functiondef('ppo.identity_has_typed_record()'::regprocedure) INTO definition;
 IF position('CASE NEW.object_type' in definition)=0 THEN RAISE EXCEPTION 'Inspect changed identity dispatch'; END IF;
 EXECUTE replace(definition,'CASE NEW.object_type','CASE NEW.object_type WHEN ''ProjectSpecialistPackage'' THEN ''project_specialist_packages''');
END $$;
SET CONSTRAINTS ppo.identity_target DEFERRED;
DO $$ DECLARE definition text; BEGIN
 SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid='ppo.permission_grants'::regclass AND conname='ck_grants_capability';
 ALTER TABLE ppo.permission_grants DROP CONSTRAINT ck_grants_capability;
 EXECUTE format('ALTER TABLE ppo.permission_grants ADD CONSTRAINT ck_grants_capability CHECK ((%s) OR capability IN (''project.specialist.read'',''project.specialist.prepare'',''project.specialist.receive''))',substring(definition from 8 for length(definition)-8));
END $$;
CREATE TABLE ppo.project_specialist_packages (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, project_id uuid NOT NULL,
 basis_id uuid NOT NULL, basis_version integer NOT NULL CHECK(basis_version>0), predecessor_id uuid, created_by uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,project_id,id), UNIQUE(workspace_id,predecessor_id),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,project_id) REFERENCES ppo.projects(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,project_id,basis_id) REFERENCES ppo.project_commercial_entries(workspace_id,project_id,id),
 FOREIGN KEY(workspace_id,basis_id,basis_version) REFERENCES ppo.project_commercial_events(workspace_id,entry_id,version),
 FOREIGN KEY(workspace_id,project_id,predecessor_id) REFERENCES ppo.project_specialist_packages(workspace_id,project_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id), CHECK(predecessor_id IS NULL OR predecessor_id<>id)
);
CREATE TRIGGER specialist_identity BEFORE INSERT ON ppo.project_specialist_packages FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('ProjectSpecialistPackage','');
CREATE TRIGGER specialist_package_immutable BEFORE UPDATE OR DELETE ON ppo.project_specialist_packages FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE INDEX specialist_project ON ppo.project_specialist_packages(workspace_id,project_id,id);
CREATE TABLE ppo.project_specialist_events (
 workspace_id uuid NOT NULL, package_id uuid NOT NULL, version integer NOT NULL CHECK(version>0),
 command text NOT NULL CHECK(command IN ('Create','Revise','Submit','Accept','Return','Withdraw')),
 state text NOT NULL CHECK(state IN ('Draft','Submitted','Accepted','Returned','Withdrawn')),
 content jsonb NOT NULL CHECK(jsonb_typeof(content)='object' AND octet_length(content::text)<=65536),
 source jsonb NOT NULL CHECK(jsonb_typeof(source)='object' AND octet_length(source::text)<=32768),
 source_hash text NOT NULL CHECK(source_hash ~ '^[a-f0-9]{64}$'),
 note text NOT NULL CHECK(length(btrim(note)) BETWEEN 1 AND 2000), reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),
 created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp() CHECK(isfinite(created_at)), operation_id uuid NOT NULL,
 PRIMARY KEY(workspace_id,package_id,version), UNIQUE(workspace_id,created_by,operation_id),
 FOREIGN KEY(workspace_id,package_id) REFERENCES ppo.project_specialist_packages(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 CHECK(content ?& ARRAY['title','scope','exclusions','deliverables','specialist','owner_id','receiver_id','due_date','date_needed_reason','engineering','engineering_needed_reason','demand','demand_needed_reason','action_ids']),
 CHECK(length(btrim(content->>'title')) BETWEEN 1 AND 200 AND length(btrim(content->>'scope')) BETWEEN 1 AND 4000 AND length(btrim(content->>'exclusions')) BETWEEN 1 AND 4000 AND length(btrim(content->>'deliverables')) BETWEEN 1 AND 4000 AND length(btrim(content->>'specialist')) BETWEEN 1 AND 500),
 CHECK(jsonb_typeof(content->'action_ids')='array' AND jsonb_array_length(content->'action_ids')<=20)
);
CREATE TRIGGER specialist_event_immutable BEFORE UPDATE OR DELETE ON ppo.project_specialist_events FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
-- Closed PJ-06 snapshots use ASCII keys, text, null and int32 versions.
CREATE FUNCTION ppo.project_specialist_source_json(value jsonb) RETURNS text LANGUAGE plpgsql IMMUTABLE STRICT AS $$
DECLARE result text;
BEGIN
 CASE jsonb_typeof(value)
 WHEN 'object' THEN
  IF EXISTS(SELECT 1 FROM jsonb_object_keys(value) k WHERE k !~ '^[a-z_]+$') THEN RAISE EXCEPTION 'Unsupported source key' USING ERRCODE='23514'; END IF;
  SELECT '{'||coalesce(string_agg(to_jsonb(e.key)::text||':'||ppo.project_specialist_source_json(e.value),',' ORDER BY e.key COLLATE "C"),'')||'}' INTO result FROM jsonb_each(value) e;
 WHEN 'number' THEN
  IF value::text !~ '^[0-9]+$' OR (value::text)::numeric>2147483647 THEN RAISE EXCEPTION 'Unsupported source version' USING ERRCODE='23514'; END IF;
  result:=value::text;
 WHEN 'string' THEN result:=value::text;
 WHEN 'null' THEN result:=value::text;
 ELSE RAISE EXCEPTION 'Unsupported source shape' USING ERRCODE='23514';
 END CASE;
 RETURN result;
END $$;
CREATE FUNCTION ppo.guard_project_specialist_event() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE pkg ppo.project_specialist_packages; pr ppo.projects; previous ppo.project_specialist_events; valid boolean; key text;
 commercial ppo.project_commercial_sources; eng ppo.engineering_packages; demand ppo.supply_records; expected jsonb; ids uuid[];
BEGIN
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
  IF NEW.source_hash<>encode(sha256(convert_to(ppo.project_specialist_source_json(NEW.source),'UTF8')),'hex') THEN RAISE EXCEPTION 'Exact source snapshot hash required' USING ERRCODE='23514'; END IF;
 SELECT * INTO STRICT pkg FROM ppo.project_specialist_packages WHERE workspace_id=NEW.workspace_id AND id=NEW.package_id;
 SELECT * INTO STRICT pr FROM ppo.projects WHERE workspace_id=NEW.workspace_id AND id=pkg.project_id;
 SELECT * INTO previous FROM ppo.project_specialist_events WHERE workspace_id=NEW.workspace_id AND package_id=NEW.package_id ORDER BY version DESC LIMIT 1;
 IF pr.lifecycle<>'Active' OR NEW.version<>coalesce(previous.version,0)+1 THEN RAISE EXCEPTION 'Active project and next exact version required' USING ERRCODE='23514'; END IF;
 FOR key IN SELECT unnest(ARRAY['owner_id','receiver_id']) LOOP
  IF NOT EXISTS(SELECT 1 FROM ppo.users WHERE workspace_id=NEW.workspace_id AND id=(NEW.content->>key)::uuid AND active) THEN RAISE EXCEPTION 'Active scoped participant required' USING ERRCODE='23514'; END IF;
  IF previous.version IS NOT NULL AND NEW.content->key IS DISTINCT FROM previous.content->key THEN RAISE EXCEPTION 'Participants are retained' USING ERRCODE='23514'; END IF;
 END LOOP;
 IF previous.version IS NULL THEN
  valid:=NEW.command='Create' AND NEW.state='Draft' AND NEW.created_by=pkg.created_by AND NEW.created_by=pr.coordinator_id;
  IF pkg.predecessor_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM ppo.project_specialist_events WHERE workspace_id=NEW.workspace_id AND package_id=pkg.predecessor_id AND state='Accepted') THEN RAISE EXCEPTION 'Accepted predecessor required' USING ERRCODE='23514'; END IF;
 ELSE
  valid:=CASE NEW.command WHEN 'Revise' THEN previous.state IN ('Draft','Returned') AND NEW.state='Draft'
   WHEN 'Submit' THEN previous.state IN ('Draft','Returned') AND NEW.state='Submitted'
   WHEN 'Accept' THEN previous.state='Submitted' AND NEW.state='Accepted'
   WHEN 'Return' THEN previous.state='Submitted' AND NEW.state='Returned'
   WHEN 'Withdraw' THEN previous.state IN ('Draft','Returned','Submitted') AND NEW.state='Withdrawn' ELSE false END;
  IF NEW.command<>'Revise' AND (NEW.content<>previous.content OR NEW.source<>previous.source OR NEW.source_hash<>previous.source_hash) THEN RAISE EXCEPTION 'Retain exact submitted content and sources' USING ERRCODE='23514'; END IF;
  IF NOT ((NEW.content->'action_ids') @> (previous.content->'action_ids')) THEN RAISE EXCEPTION 'Retain earlier action links' USING ERRCODE='23514'; END IF;
 END IF;
 IF NOT coalesce(valid,false) THEN RAISE EXCEPTION 'Invalid package transition' USING ERRCODE='23514'; END IF;
 IF NEW.command IN ('Accept','Return') THEN
  IF NEW.created_by<>(NEW.content->>'receiver_id')::uuid OR EXISTS(SELECT 1 FROM ppo.project_specialist_events WHERE workspace_id=NEW.workspace_id AND package_id=NEW.package_id AND created_by=NEW.created_by AND command IN ('Create','Revise','Submit')) THEN RAISE EXCEPTION 'Independent designated receiver required' USING ERRCODE='23514'; END IF;
 ELSIF previous.version IS NOT NULL AND NEW.created_by<>pr.coordinator_id AND NEW.created_by<>(previous.content->>'owner_id')::uuid THEN RAISE EXCEPTION 'Recorded preparer required' USING ERRCODE='23514'; END IF;
 IF NOT EXISTS(SELECT 1 FROM ppo.project_commercial_entries e JOIN ppo.project_commercial_events v ON (v.workspace_id,v.entry_id)=(e.workspace_id,e.id) WHERE e.workspace_id=NEW.workspace_id AND e.id=pkg.basis_id AND e.kind='Basis' AND e.project_id=pr.id AND v.version=pkg.basis_version AND v.state='Approved') THEN RAISE EXCEPTION 'Exact approved commercial basis required' USING ERRCODE='23514'; END IF;
 SELECT * INTO STRICT commercial FROM ppo.project_commercial_sources WHERE workspace_id=NEW.workspace_id AND basis_id=pkg.basis_id;
 IF NEW.source->'commercial' IS DISTINCT FROM jsonb_build_object('id',pkg.basis_id,'version',pkg.basis_version,'source_hash',commercial.snapshot->>'hash') THEN RAISE EXCEPTION 'Exact commercial source required' USING ERRCODE='23514'; END IF;
 FOR key IN SELECT unnest(ARRAY['due_date','engineering','demand']) LOOP
  IF (NEW.content->key='null'::jsonb) IS DISTINCT FROM (NEW.content->(CASE key WHEN 'due_date' THEN 'date_needed_reason' ELSE key||'_needed_reason' END)<>'null'::jsonb) THEN RAISE EXCEPTION 'Exact selection or unresolved reason required' USING ERRCODE='23514'; END IF;
 END LOOP;
 IF NEW.command NOT IN ('Return','Withdraw') THEN
  IF NOT EXISTS(SELECT 1 FROM ppo.library_documents WHERE workspace_id=NEW.workspace_id AND id=commercial.document_id AND state='Current' AND current_revision_id=commercial.document_revision_id AND version=(commercial.snapshot->'input'->>'document_version')::int)
   OR NOT EXISTS(SELECT 1 FROM ppo.draft_quotes q JOIN ppo.draft_quote_revisions r ON (r.workspace_id,r.quote_id)=(q.workspace_id,q.id) WHERE r.workspace_id=NEW.workspace_id AND r.id=commercial.quote_revision_id AND q.current_revision_id=r.id AND q.version=(commercial.snapshot->'input'->'quotation'->>'expected_quote_version')::int)
   OR (SELECT max(sequence) FROM ppo.quote_response_events WHERE workspace_id=NEW.workspace_id AND revision_id=commercial.quote_revision_id)<>(commercial.snapshot->'input'->'quotation'->>'expected_response_sequence')::int
  THEN RAISE EXCEPTION 'Current commercial sources required for new use' USING ERRCODE='23514'; END IF;
  IF NEW.content->'engineering'<>'null'::jsonb THEN
   SELECT * INTO STRICT eng FROM ppo.engineering_packages WHERE workspace_id=NEW.workspace_id AND id=(NEW.content->'engineering'->>'id')::uuid;
   expected:=jsonb_build_object('id',eng.id,'version',eng.version,'title',eng.title,'brief',eng.brief,'discipline',eng.discipline);
   IF eng.project_id IS DISTINCT FROM pr.id OR eng.site_id IS DISTINCT FROM pr.site_id OR eng.company_id<>pr.company_id OR eng.version<>(NEW.content->'engineering'->>'version')::int OR NEW.source->'engineering' IS DISTINCT FROM expected THEN RAISE EXCEPTION 'Exact Engineering Project reference required' USING ERRCODE='23514'; END IF;
  ELSIF NEW.source->'engineering' IS DISTINCT FROM 'null'::jsonb THEN RAISE EXCEPTION 'No unselected Engineering source' USING ERRCODE='23514'; END IF;
  IF NEW.content->'demand'<>'null'::jsonb THEN
   SELECT * INTO STRICT demand FROM ppo.supply_records WHERE workspace_id=NEW.workspace_id AND id=(NEW.content->'demand'->>'id')::uuid;
   expected:=jsonb_build_object('id',demand.id,'version',demand.version,'reference',demand.reference,'item',demand.item,'unit',demand.unit,'quantity',demand.quantity::text);
   IF demand.kind<>'Demand' OR demand.company_id<>pr.company_id OR demand.site_id IS DISTINCT FROM pr.site_id OR demand.data->>'origin_kind'<>'Project' OR demand.data->>'origin_id' IS DISTINCT FROM pr.id::text OR demand.version<>(NEW.content->'demand'->>'version')::int OR NEW.source->'demand' IS DISTINCT FROM expected THEN RAISE EXCEPTION 'Exact Project demand and original units required' USING ERRCODE='23514'; END IF;
  ELSIF NEW.source->'demand' IS DISTINCT FROM 'null'::jsonb THEN RAISE EXCEPTION 'No unselected demand source' USING ERRCODE='23514'; END IF;
 END IF;
 SELECT coalesce(array_agg(value::uuid),ARRAY[]::uuid[]) INTO ids FROM jsonb_array_elements_text(NEW.content->'action_ids');
 IF cardinality(ids)<>(SELECT count(DISTINCT id) FROM unnest(ids) id) OR EXISTS(SELECT 1 FROM unnest(ids) u(action_id) WHERE NOT EXISTS(SELECT 1 FROM ppo.activities a JOIN ppo.activity_links l ON (l.workspace_id,l.activity_id)=(a.workspace_id,a.id) WHERE a.workspace_id=NEW.workspace_id AND a.id=u.action_id AND a.company_id=pr.company_id AND a.site_id=pr.site_id AND l.object_type='Project' AND l.object_id=pr.id)) THEN RAISE EXCEPTION 'Distinct native Project actions required' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER specialist_event_guard BEFORE INSERT ON ppo.project_specialist_events FOR EACH ROW EXECUTE FUNCTION ppo.guard_project_specialist_event();

CREATE FUNCTION ppo.check_project_specialist_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM ppo.operation_receipts r JOIN ppo.audit_events a ON (a.workspace_id,a.actor_id,a.operation_id)=(r.workspace_id,r.actor_id,r.operation_id)
  JOIN ppo.outbox_jobs j ON (j.workspace_id,j.actor_id,j.operation_id)=(r.workspace_id,r.actor_id,r.operation_id)
  WHERE r.workspace_id=NEW.workspace_id AND r.actor_id=NEW.created_by AND r.operation_id=NEW.operation_id AND r.record_id=NEW.package_id
   AND r.result->>'record_id'=NEW.package_id::text AND (r.result->>'record_version')::integer=NEW.version AND r.result->>'state'=NEW.state
   AND a.object_type='ProjectSpecialistPackage' AND a.object_id=NEW.package_id AND a.reason=NEW.reason AND a.outcome='Accepted'
   AND a.details->>'command'='ProjectSpecialist:'||NEW.command AND (a.details->>'record_version')::integer=NEW.version AND a.details->>'source_hash'=NEW.source_hash
   AND j.kind='SharedRecordUpdated' AND j.payload->>'object_type'='ProjectSpecialistPackage' AND j.payload->>'record_id'=NEW.package_id::text AND (j.payload->>'record_version')::integer=NEW.version)
 THEN RAISE EXCEPTION 'Exact specialist audit, receipt and outbox required' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER specialist_event_evidence AFTER INSERT ON ppo.project_specialist_events DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_project_specialist_evidence();
CREATE FUNCTION ppo.check_project_specialist_initial() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM ppo.project_specialist_events WHERE workspace_id=NEW.workspace_id AND package_id=NEW.id AND version=1 AND command='Create')
 THEN RAISE EXCEPTION 'Initial event and original source required' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER specialist_initial AFTER INSERT ON ppo.project_specialist_packages DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_project_specialist_initial();
