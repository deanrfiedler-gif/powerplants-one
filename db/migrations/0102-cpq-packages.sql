-- ES-02/ES-03 owned packages. No seed, grants or rewrite of historical evidence.
SET CONSTRAINTS ppo.identity_target IMMEDIATE;
DO $$ DECLARE spec record; definition text; BEGIN
 FOR spec IN SELECT * FROM (VALUES ('business_identities','ck_identities_type'),('audit_events','ck_audit_object_type')) v(tab,con) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid=('ppo.'||spec.tab)::regclass AND conname=spec.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',spec.tab,spec.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR object_type = ''CpqPackage'')',spec.tab,spec.con,substring(definition from 8 for length(definition)-8));
 END LOOP;
 SELECT pg_get_functiondef('ppo.identity_has_typed_record()'::regprocedure) INTO definition;
 IF position('CASE NEW.object_type' in definition)=0 THEN RAISE EXCEPTION 'Inspect changed identity dispatch'; END IF;
 EXECUTE replace(definition,'CASE NEW.object_type','CASE NEW.object_type WHEN ''CpqPackage'' THEN ''cpq_packages''');
END $$;
SET CONSTRAINTS ppo.identity_target DEFERRED;

CREATE TABLE ppo.cpq_packages (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL,
 kind text NOT NULL CHECK(kind IN ('Rules','Tables')), owner_id uuid NOT NULL,
 version integer NOT NULL CHECK(version>0), current_revision_id uuid NOT NULL,
 state text NOT NULL CHECK(state IN ('Draft','Tested','TestFailed','Reviewed','Rejected','Published','Withdrawn')),
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER cpq_package_identity BEFORE INSERT ON ppo.cpq_packages FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('CpqPackage','');
CREATE TRIGGER cpq_package_retained BEFORE DELETE ON ppo.cpq_packages FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.guard_cpq_package_root() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF (NEW.id,NEW.workspace_id,NEW.company_id,NEW.kind,NEW.owner_id,NEW.synthetic) IS DISTINCT FROM (OLD.id,OLD.workspace_id,OLD.company_id,OLD.kind,OLD.owner_id,OLD.synthetic)
 OR NEW.version<>OLD.version+1 THEN RAISE EXCEPTION 'Package identity, owner and sequential versions are retained' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER cpq_package_root_guard BEFORE UPDATE ON ppo.cpq_packages FOR EACH ROW EXECUTE FUNCTION ppo.guard_cpq_package_root();
CREATE TABLE ppo.cpq_package_revisions (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, package_id uuid NOT NULL, version integer NOT NULL CHECK(version>0), predecessor_id uuid,
 fixture_owner_id uuid NOT NULL, content jsonb NOT NULL CHECK(jsonb_typeof(content)='object' AND octet_length(content::text)<=200000),
 content_hash text NOT NULL CHECK(content_hash~'^[a-f0-9]{64}$'), created_by uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,package_id,id), UNIQUE(workspace_id,package_id,version),
 FOREIGN KEY(workspace_id,package_id) REFERENCES ppo.cpq_packages(workspace_id,id),
 FOREIGN KEY(workspace_id,package_id,predecessor_id) REFERENCES ppo.cpq_package_revisions(workspace_id,package_id,id),
 FOREIGN KEY(workspace_id,fixture_owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
ALTER TABLE ppo.cpq_packages ADD FOREIGN KEY(workspace_id,id,current_revision_id) REFERENCES ppo.cpq_package_revisions(workspace_id,package_id,id) DEFERRABLE INITIALLY DEFERRED;
CREATE TABLE ppo.cpq_package_events (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, package_id uuid NOT NULL, revision_id uuid NOT NULL,
 version integer NOT NULL CHECK(version>0), action text NOT NULL CHECK(action IN ('Save','Attest','Review','Publish','Withdraw')),
 state text NOT NULL CHECK(state IN ('Draft','Tested','TestFailed','Reviewed','Rejected','Published','Withdrawn')),
 basis_id uuid, report jsonb NOT NULL CHECK(jsonb_typeof(report)='object' AND octet_length(report::text)<=200000),
 report_hash text NOT NULL CHECK(report_hash~'^[a-f0-9]{64}$'), actor_id uuid NOT NULL, operation_id uuid NOT NULL, reason text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,package_id,id), UNIQUE(workspace_id,package_id,version), UNIQUE(workspace_id,actor_id,operation_id),
 FOREIGN KEY(workspace_id,package_id,revision_id) REFERENCES ppo.cpq_package_revisions(workspace_id,package_id,id),
 FOREIGN KEY(workspace_id,package_id,basis_id) REFERENCES ppo.cpq_package_events(workspace_id,package_id,id),
 FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE FUNCTION ppo.guard_cpq_package_event() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE root ppo.cpq_packages; rev ppo.cpq_package_revisions; prior ppo.cpq_package_events; basis ppo.cpq_package_events; accepted ppo.cpq_package_events; valid boolean;
BEGIN
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 SELECT * INTO STRICT root FROM ppo.cpq_packages WHERE workspace_id=NEW.workspace_id AND id=NEW.package_id;
 SELECT * INTO STRICT rev FROM ppo.cpq_package_revisions WHERE workspace_id=NEW.workspace_id AND id=NEW.revision_id;
 SELECT * INTO prior FROM ppo.cpq_package_events WHERE workspace_id=NEW.workspace_id AND package_id=NEW.package_id ORDER BY version DESC LIMIT 1;
 SELECT * INTO basis FROM ppo.cpq_package_events WHERE workspace_id=NEW.workspace_id AND id=NEW.basis_id;
 IF NEW.version<>coalesce(prior.version,0)+1 OR NEW.version<>root.version OR NEW.revision_id<>root.current_revision_id OR NEW.state<>root.state
 THEN RAISE EXCEPTION 'Exact current package event required' USING ERRCODE='23514'; END IF;
 valid:=CASE NEW.action
  WHEN 'Save' THEN NEW.state='Draft' AND NEW.actor_id=root.owner_id AND rev.created_by=root.owner_id AND NEW.basis_id IS NULL AND NEW.report->>'content_hash'=rev.content_hash AND
    rev.version=coalesce((SELECT version FROM ppo.cpq_package_revisions WHERE workspace_id=NEW.workspace_id AND id=prior.revision_id),0)+1 AND rev.predecessor_id IS NOT DISTINCT FROM prior.revision_id
  WHEN 'Attest' THEN prior.state IN ('Draft','TestFailed') AND NEW.state IN ('Tested','TestFailed') AND NEW.actor_id=rev.fixture_owner_id AND NEW.basis_id IS NULL AND
    NEW.report->>'content_hash'=rev.content_hash AND NEW.report->>'schema_version'='1' AND NEW.report->>'scope'='SyntheticInWorkerEvaluation' AND jsonb_typeof(NEW.report->'passed')='boolean' AND
    NEW.state=CASE WHEN NEW.report->>'passed'='true' THEN 'Tested' ELSE 'TestFailed' END
  WHEN 'Review' THEN prior.state='Tested' AND NEW.state IN ('Reviewed','Rejected') AND basis.id=prior.id AND NEW.actor_id NOT IN (root.owner_id,rev.fixture_owner_id) AND
    NEW.report->>'basis_id'=basis.id::text AND NEW.report->>'basis_hash'=basis.report_hash AND NEW.report->>'outcome'=CASE WHEN NEW.state='Reviewed' THEN 'Approved' ELSE 'Rejected' END
  WHEN 'Publish' THEN prior.state='Reviewed' AND NEW.state='Published' AND basis.id=prior.id AND NEW.actor_id NOT IN (root.owner_id,rev.fixture_owner_id,basis.actor_id)
  WHEN 'Withdraw' THEN prior.state<>'Withdrawn' AND NEW.state='Withdrawn' AND NEW.actor_id=root.owner_id AND NEW.basis_id IS NULL AND NEW.report->>'content_hash'=rev.content_hash
  ELSE false END;
 IF NEW.action<>'Save' AND NEW.revision_id IS DISTINCT FROM prior.revision_id THEN valid:=false; END IF;
 IF NOT coalesce(valid,false) THEN RAISE EXCEPTION 'Invalid package transition or independent actor' USING ERRCODE='23514'; END IF;
 IF NEW.action='Publish' THEN
  SELECT * INTO STRICT accepted FROM ppo.cpq_package_events WHERE workspace_id=NEW.workspace_id AND id=basis.basis_id;
  IF accepted.state<>'Tested' OR accepted.revision_id<>rev.id
   OR NEW.report->>'review_id' IS DISTINCT FROM basis.id::text OR NEW.report->>'review_hash' IS DISTINCT FROM basis.report_hash
   OR NEW.report->>'attestation_id' IS DISTINCT FROM accepted.id::text OR NEW.report->>'attestation_hash' IS DISTINCT FROM accepted.report_hash
  THEN RAISE EXCEPTION 'Exact accepted fixtures required' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER cpq_package_event_guard BEFORE INSERT ON ppo.cpq_package_events FOR EACH ROW EXECUTE FUNCTION ppo.guard_cpq_package_event();
CREATE FUNCTION ppo.check_cpq_package_evidence() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM ppo.cpq_package_events e JOIN ppo.audit_events a ON (a.workspace_id,a.actor_id,a.operation_id)=(e.workspace_id,e.actor_id,e.operation_id)
  JOIN ppo.operation_receipts r ON (r.workspace_id,r.actor_id,r.operation_id)=(e.workspace_id,e.actor_id,e.operation_id)
  JOIN ppo.outbox_jobs j ON (j.workspace_id,j.actor_id,j.operation_id)=(e.workspace_id,e.actor_id,e.operation_id)
  WHERE e.workspace_id=NEW.workspace_id AND e.package_id=NEW.id AND e.version=NEW.version AND e.state=NEW.state AND e.revision_id=NEW.current_revision_id
   AND a.object_type='CpqPackage' AND a.object_id=e.package_id AND a.reason=e.reason AND a.details->>'command'='CpqPackage:'||e.action
   AND a.details->>'event_id'=e.id::text AND a.details->>'report_hash'=e.report_hash AND (a.details->>'record_version')::integer=e.version
   AND r.record_id=e.package_id AND r.result->>'state'=e.state AND (r.result->>'record_version')::integer=e.version
   AND j.kind='CpqChanged' AND j.payload->>'record_id'=e.package_id::text AND (j.payload->>'record_version')::integer=e.version)
 THEN RAISE EXCEPTION 'Exact package event, audit, receipt and outbox required' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER cpq_package_evidence AFTER INSERT OR UPDATE ON ppo.cpq_packages DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_cpq_package_evidence();
CREATE TRIGGER cpq_package_revision_retained BEFORE UPDATE OR DELETE ON ppo.cpq_package_revisions FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TRIGGER cpq_package_event_retained BEFORE UPDATE OR DELETE ON ppo.cpq_package_events FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.check_cpq_package_revision() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NEW.fixture_owner_id::text IS DISTINCT FROM NEW.content->>'fixture_owner_id' OR NOT EXISTS(
   SELECT 1 FROM ppo.cpq_package_events e JOIN ppo.cpq_packages p ON (p.workspace_id,p.id)=(e.workspace_id,e.package_id)
   WHERE e.workspace_id=NEW.workspace_id AND e.revision_id=NEW.id AND e.action='Save' AND e.actor_id=NEW.created_by AND e.actor_id=p.owner_id AND e.report->>'content_hash'=NEW.content_hash)
 THEN RAISE EXCEPTION 'Closed package revision and save evidence required' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER cpq_package_revision_evidence AFTER INSERT ON ppo.cpq_package_revisions DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_cpq_package_revision();

-- NULL preserves every historical release/run hash. The existing revision
-- immutable trigger closes this manifest at the same time as the definition.
ALTER TABLE ppo.cpq_revisions ADD COLUMN package_manifest jsonb CHECK(package_manifest IS NULL OR (jsonb_typeof(package_manifest)='array' AND jsonb_array_length(package_manifest) BETWEEN 1 AND 20 AND octet_length(package_manifest::text)<=200000));
CREATE FUNCTION ppo.check_cpq_package_manifest() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE ref jsonb; root ppo.cpq_packages; rev ppo.cpq_package_revisions; pub ppo.cpq_package_events;
 selected jsonb; rules jsonb:='[]'; tables jsonb:='[]'; candidate jsonb; collection jsonb; member_kind integer;
BEGIN
 IF NEW.package_manifest IS NULL THEN
  IF EXISTS(SELECT 1 FROM ppo.cpq_revisions WHERE workspace_id=NEW.workspace_id AND release_id=NEW.release_id AND package_manifest IS NOT NULL)
  THEN RAISE EXCEPTION 'Package governance cannot be removed' USING ERRCODE='23514'; END IF;
  RETURN NEW;
 END IF;
 IF (SELECT count(DISTINCT x->>'package_id') FROM jsonb_array_elements(NEW.package_manifest) x)<>jsonb_array_length(NEW.package_manifest)
 THEN RAISE EXCEPTION 'Unique package manifest required' USING ERRCODE='23514'; END IF;
 FOR ref IN SELECT * FROM jsonb_array_elements(NEW.package_manifest) LOOP
  SELECT * INTO STRICT root FROM ppo.cpq_packages WHERE workspace_id=NEW.workspace_id AND id=(ref->>'package_id')::uuid;
  SELECT * INTO STRICT rev FROM ppo.cpq_package_revisions WHERE workspace_id=NEW.workspace_id AND package_id=root.id AND id=(ref->>'revision_id')::uuid;
  SELECT * INTO STRICT pub FROM ppo.cpq_package_events WHERE workspace_id=NEW.workspace_id AND package_id=root.id AND id=(ref->>'publication_id')::uuid;
  IF root.company_id<>NEW.company_id OR root.current_revision_id<>rev.id OR root.state<>'Published' OR pub.revision_id<>rev.id OR pub.action<>'Publish' OR pub.version<>root.version
   OR root.kind IS DISTINCT FROM ref->>'kind' OR rev.content_hash IS DISTINCT FROM ref->>'content_hash' OR root.owner_id::text IS DISTINCT FROM ref->>'owner_id' OR rev.fixture_owner_id::text IS DISTINCT FROM ref->>'fixture_owner_id' OR pub.report_hash IS DISTINCT FROM ref->>'evidence_hash'
  THEN RAISE EXCEPTION 'Exact published package manifest required' USING ERRCODE='23514'; END IF;
  SELECT coalesce(jsonb_agg(m),'[]') INTO selected FROM jsonb_array_elements(
   CASE root.kind WHEN 'Rules' THEN rev.content->'definition'->'rules' ELSE rev.content->'definition'->'design'->'decision_tables' END
  ) m WHERE rev.content->'member_keys' ? (m->>'key');
  IF jsonb_array_length(selected)<>jsonb_array_length(rev.content->'member_keys')
  THEN RAISE EXCEPTION 'Exact complete package members required' USING ERRCODE='23514'; END IF;
  IF root.kind='Rules' THEN rules:=rules||selected; ELSE tables:=tables||selected; END IF;
 END LOOP;
 FOR member_kind IN 1..2 LOOP
  IF member_kind=1 THEN collection:=rules; candidate:=NEW.definition->'rules';
  ELSE collection:=tables; candidate:=coalesce(NEW.definition->'design'->'decision_tables','[]'); END IF;
  IF jsonb_array_length(collection) IS DISTINCT FROM jsonb_array_length(candidate)
   OR (SELECT count(DISTINCT m->>'key') FROM jsonb_array_elements(collection) m)<>jsonb_array_length(collection)
   OR NOT coalesce(collection @> candidate AND candidate @> collection,false)
  THEN RAISE EXCEPTION 'Exact complete package members required' USING ERRCODE='23514'; END IF;
 END LOOP;
 RETURN NEW;
END $$;
CREATE TRIGGER cpq_package_manifest_guard BEFORE INSERT ON ppo.cpq_revisions FOR EACH ROW EXECUTE FUNCTION ppo.check_cpq_package_manifest();
