-- DK-06 R2: empty synthetic proposals; no runtime-template, seed or grant mutation.
SET CONSTRAINTS ppo.identity_target IMMEDIATE;
DO $$ DECLARE spec record; definition text; BEGIN
 FOR spec IN SELECT * FROM (VALUES
  ('business_identities','ck_identities_type','object_type','TemplateProposal'),
  ('audit_events','ck_audit_object_type','object_type','TemplateProposal'),
  ('permission_grants','ck_grants_capability','capability','template.read,template.propose,template.review')
 ) v(tab,con,col,added) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid=('ppo.'||spec.tab)::regclass AND conname=spec.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',spec.tab,spec.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR %I = ANY(%L::text[]))',spec.tab,spec.con,substring(definition from 8 for length(definition)-8),spec.col,string_to_array(spec.added,','));
 END LOOP;
 SELECT pg_get_functiondef('ppo.identity_has_typed_record()'::regprocedure) INTO definition;
 IF position('CASE NEW.object_type' in definition)=0 THEN RAISE EXCEPTION 'Inspect changed identity dispatch'; END IF;
 EXECUTE replace(definition,'CASE NEW.object_type','CASE NEW.object_type WHEN ''TemplateProposal'' THEN ''template_proposals''');
END $$;
SET CONSTRAINTS ppo.identity_target DEFERRED;

CREATE TABLE ppo.template_proposals (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, site_id uuid NOT NULL,
 family text NOT NULL CHECK(family IN ('OUT-09','OUT-10','OUT-14')),
 version integer NOT NULL CHECK(version>0), current_revision_id uuid NOT NULL,
 state text NOT NULL CHECK(state IN ('Draft','Reviewed','ChangesRequested')),
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 updated_by uuid NOT NULL, updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id),
 FOREIGN KEY(workspace_id,site_id) REFERENCES ppo.sites(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER template_proposal_identity BEFORE INSERT OR UPDATE ON ppo.template_proposals FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('TemplateProposal','');
CREATE TRIGGER template_proposal_retained BEFORE DELETE ON ppo.template_proposals FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.template_proposal_revisions (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, proposal_id uuid NOT NULL,
 revision integer NOT NULL CHECK(revision>0), proposal_version integer NOT NULL CHECK(proposal_version>0),
 base jsonb NOT NULL CHECK(jsonb_typeof(base)='object'), body jsonb NOT NULL CHECK(jsonb_typeof(body)='object'),
 canonical_content text NOT NULL, content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'),
 created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(), reason text NOT NULL CHECK(length(reason) BETWEEN 1 AND 1000),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,proposal_id,id), UNIQUE(workspace_id,proposal_id,revision),
 FOREIGN KEY(workspace_id,proposal_id) REFERENCES ppo.template_proposals(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 CHECK(canonical_content::jsonb=jsonb_build_object('base',base,'body',body)
  AND content_hash=encode(sha256(convert_to(canonical_content,'UTF8')),'hex'))
);
ALTER TABLE ppo.template_proposals ADD FOREIGN KEY(workspace_id,id,current_revision_id) REFERENCES ppo.template_proposal_revisions(workspace_id,proposal_id,id) DEFERRABLE INITIALLY DEFERRED;
CREATE TABLE ppo.template_proposal_reviews (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, proposal_id uuid NOT NULL, revision_id uuid NOT NULL,
 proposal_version integer NOT NULL CHECK(proposal_version>1), content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'),
 outcome text NOT NULL CHECK(outcome IN ('Reviewed','ChangesRequested')), checks jsonb NOT NULL CHECK(jsonb_typeof(checks)='object'),
 reviewer_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(), reason text NOT NULL CHECK(length(reason) BETWEEN 1 AND 1000),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,proposal_id,proposal_version),
 FOREIGN KEY(workspace_id,proposal_id,revision_id) REFERENCES ppo.template_proposal_revisions(workspace_id,proposal_id,id),
 FOREIGN KEY(workspace_id,reviewer_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.template_proposal_events (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, proposal_id uuid NOT NULL, revision_id uuid NOT NULL,
 proposal_version integer NOT NULL CHECK(proposal_version>0), command text NOT NULL CHECK(command IN ('Create','Revise','Review')),
 actor_id uuid NOT NULL, operation_id uuid NOT NULL, command_hash text NOT NULL CHECK(command_hash ~ '^[a-f0-9]{64}$'),
 reason text NOT NULL, snapshot jsonb NOT NULL, payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,proposal_id,proposal_version), UNIQUE(workspace_id,actor_id,operation_id),
 FOREIGN KEY(workspace_id,proposal_id,revision_id) REFERENCES ppo.template_proposal_revisions(workspace_id,proposal_id,id),
 FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id)
);
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['template_proposal_revisions','template_proposal_reviews','template_proposal_events'] LOOP
  EXECUTE format('CREATE TRIGGER template_evidence_retained BEFORE UPDATE OR DELETE ON ppo.%I FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence()',t);
 END LOOP;
END $$;
CREATE INDEX template_proposal_scope ON ppo.template_proposals(workspace_id,family,id);
CREATE INDEX template_revision_history ON ppo.template_proposal_revisions(workspace_id,proposal_id,id);
CREATE INDEX template_review_history ON ppo.template_proposal_reviews(workspace_id,proposal_id,id);

-- Application validation supplies normalized canonical bytes; SQL independently
-- refuses malformed shapes, arbitrary bindings, cross-family bases and self-review.
CREATE FUNCTION ppo.template_proposal_transition() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE d ppo.template_proposals; r ppo.template_proposal_revisions; b jsonb; f jsonb; k text; allowed text[]; base_table text;
BEGIN
 IF TG_TABLE_NAME='template_proposals' THEN
  IF NOT EXISTS(SELECT 1 FROM ppo.sites WHERE workspace_id=NEW.workspace_id AND id=NEW.site_id AND company_id=NEW.company_id) THEN RAISE EXCEPTION 'Proposal site/company mismatch' USING ERRCODE='23514'; END IF;
  IF TG_OP='INSERT' THEN
   IF NEW.version<>1 OR NEW.state<>'Draft' OR NEW.created_by<>NEW.updated_by THEN RAISE EXCEPTION 'Draft starts at version one' USING ERRCODE='23514'; END IF;
  ELSIF (NEW.company_id,NEW.site_id,NEW.family) IS DISTINCT FROM (OLD.company_id,OLD.site_id,OLD.family)
   OR NEW.version<>OLD.version+1 THEN RAISE EXCEPTION 'Scope is permanent and versions advance exactly once' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
 END IF;
 SELECT * INTO STRICT d FROM ppo.template_proposals WHERE workspace_id=NEW.workspace_id AND id=NEW.proposal_id;
 IF d.version<>NEW.proposal_version THEN RAISE EXCEPTION 'Current proposal version required' USING ERRCODE='23514'; END IF;
 IF TG_TABLE_NAME='template_proposal_revisions' THEN
  IF d.current_revision_id<>NEW.id OR d.state<>'Draft' OR d.updated_by<>NEW.created_by THEN RAISE EXCEPTION 'Current draft author required' USING ERRCODE='23514'; END IF;
  SELECT * INTO r FROM ppo.template_proposal_revisions WHERE workspace_id=NEW.workspace_id AND proposal_id=NEW.proposal_id ORDER BY revision DESC LIMIT 1;
  IF NEW.revision<>coalesce(r.revision,0)+1 THEN RAISE EXCEPTION 'Contiguous revision required' USING ERRCODE='23514'; END IF;
  IF r.id IS NOT NULL THEN
   IF NEW.base IS DISTINCT FROM r.base THEN RAISE EXCEPTION 'Original base is permanent' USING ERRCODE='23514'; END IF;
  ELSE
   base_table:=CASE d.family WHEN 'OUT-09' THEN 'pack_templates' WHEN 'OUT-10' THEN 'report_templates' ELSE 'finance_templates' END;
   EXECUTE format('SELECT jsonb_build_object(''id'',id,''version'',version,''content_hash'',content_hash,''definition'',definition,''renderer_version'',%s) FROM ppo.%I WHERE workspace_id=$1 AND id=$2',CASE WHEN d.family='OUT-09' THEN 'renderer_version' ELSE 'NULL::text' END,base_table) INTO b USING NEW.workspace_id,(NEW.base->>'id')::uuid;
   IF b IS NULL OR NEW.base IS DISTINCT FROM b OR b->>'content_hash'<>encode(sha256(convert_to(b->>'definition','UTF8')),'hex') THEN RAISE EXCEPTION 'Exact retained base required' USING ERRCODE='23514'; END IF;
  END IF;
  b:=NEW.body;
  IF NOT coalesce(b ?& ARRAY['schema_version','title','audience','fields'] AND b-'schema_version'-'title'-'audience'-'fields'='{}'::jsonb
   AND b->'schema_version'='1'::jsonb AND jsonb_typeof(b->'title')='string' AND length(b->>'title') BETWEEN 1 AND 200
   AND b->>'audience' IN ('Internal','Customer') AND (d.family='OUT-10' OR b->>'audience'='Internal')
   AND jsonb_typeof(b->'fields')='array',false) THEN RAISE EXCEPTION 'Unsupported proposal body' USING ERRCODE='23514'; END IF;
  IF jsonb_array_length(b->'fields') NOT BETWEEN 1 AND 40 THEN RAISE EXCEPTION 'Bounded fields required' USING ERRCODE='23514'; END IF;
  allowed:=CASE d.family WHEN 'OUT-09' THEN ARRAY['site.name','customer.name','work.reference','appointment.start_at'] WHEN 'OUT-10' THEN ARRAY['site.name','customer.name','work.reference','completion.work_performed'] ELSE ARRAY['site','customer','work_reference','account','treatment_basis'] END;
  FOR f IN SELECT value FROM jsonb_array_elements(b->'fields') LOOP
   IF NOT coalesce(jsonb_typeof(f)='object' AND f ?& ARRAY['key','label','binding','required'] AND f-'key'-'label'-'binding'-'required'='{}'::jsonb
    AND jsonb_typeof(f->'key')='string' AND length(f->>'key')<=64 AND f->>'key' ~ '^[a-z][a-z0-9_]*$'
    AND jsonb_typeof(f->'label')='string' AND length(f->>'label') BETWEEN 1 AND 120
    AND f->>'binding'=ANY(allowed) AND jsonb_typeof(f->'required')='boolean',false) THEN RAISE EXCEPTION 'Invalid proposed field' USING ERRCODE='23514'; END IF;
  END LOOP;
  IF (SELECT count(DISTINCT value->>'key') FROM jsonb_array_elements(b->'fields'))<>jsonb_array_length(b->'fields') THEN RAISE EXCEPTION 'Duplicate field keys' USING ERRCODE='23514'; END IF;
 ELSE
  SELECT * INTO STRICT r FROM ppo.template_proposal_revisions WHERE workspace_id=NEW.workspace_id AND proposal_id=NEW.proposal_id AND id=NEW.revision_id;
  IF d.current_revision_id<>r.id OR NEW.content_hash<>r.content_hash OR d.state<>NEW.outcome OR d.updated_by<>NEW.reviewer_id
   OR EXISTS(SELECT 1 FROM ppo.template_proposal_revisions WHERE workspace_id=NEW.workspace_id AND proposal_id=NEW.proposal_id AND created_by=NEW.reviewer_id) THEN RAISE EXCEPTION 'Independent exact current review required' USING ERRCODE='23514'; END IF;
  IF NOT (NEW.checks ?& ARRAY['schema','source_bindings','audience']) OR NEW.checks-'schema'-'source_bindings'-'audience'<>'{}'::jsonb THEN RAISE EXCEPTION 'All review observations required' USING ERRCODE='23514'; END IF;
  FOREACH k IN ARRAY ARRAY['schema','source_bindings','audience'] LOOP
   f:=NEW.checks->k;
   IF NOT coalesce(jsonb_typeof(f)='object' AND f ?& ARRAY['result','note'] AND f-'result'-'note'='{}'::jsonb AND f->>'result' IN ('Pass','Fail','Blocked','NotRun')
    AND jsonb_typeof(f->'note')='string' AND length(f->>'note') BETWEEN 1 AND 2000 AND (NEW.outcome<>'Reviewed' OR f->>'result'='Pass'),false) THEN RAISE EXCEPTION 'Review needs explicit complete observations' USING ERRCODE='23514'; END IF;
  END LOOP;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER template_proposal_transition BEFORE INSERT OR UPDATE ON ppo.template_proposals FOR EACH ROW EXECUTE FUNCTION ppo.template_proposal_transition();
CREATE TRIGGER template_revision_transition BEFORE INSERT ON ppo.template_proposal_revisions FOR EACH ROW EXECUTE FUNCTION ppo.template_proposal_transition();
CREATE TRIGGER template_review_transition BEFORE INSERT ON ppo.template_proposal_reviews FOR EACH ROW EXECUTE FUNCTION ppo.template_proposal_transition();

CREATE FUNCTION ppo.template_proposal_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE e ppo.template_proposal_events; payload jsonb;
BEGIN
 IF TG_TABLE_NAME='template_proposals' THEN
  SELECT * INTO e FROM ppo.template_proposal_events WHERE workspace_id=NEW.workspace_id AND proposal_id=NEW.id AND proposal_version=NEW.version;
  IF e.id IS NULL OR e.snapshot IS DISTINCT FROM to_jsonb(NEW) OR e.actor_id<>NEW.updated_by THEN RAISE EXCEPTION 'Exact proposal event required' USING ERRCODE='23514'; END IF;
 ELSIF TG_TABLE_NAME='template_proposal_events' THEN
  IF NEW.command IN ('Create','Revise') THEN
   SELECT to_jsonb(r) INTO payload FROM ppo.template_proposal_revisions r WHERE workspace_id=NEW.workspace_id AND proposal_id=NEW.proposal_id AND id=NEW.revision_id AND proposal_version=NEW.proposal_version AND created_by=NEW.actor_id AND reason=NEW.reason;
  ELSE
   SELECT to_jsonb(r) INTO payload FROM ppo.template_proposal_reviews r WHERE workspace_id=NEW.workspace_id AND proposal_id=NEW.proposal_id AND revision_id=NEW.revision_id AND proposal_version=NEW.proposal_version AND reviewer_id=NEW.actor_id AND reason=NEW.reason;
  END IF;
  IF payload IS NULL OR payload IS DISTINCT FROM NEW.payload OR NEW.snapshot->>'current_revision_id'<>NEW.revision_id::text
   OR (NEW.command='Create') IS DISTINCT FROM (NEW.proposal_version=1)
   OR (NEW.command IN ('Create','Revise') AND NEW.snapshot->>'state'<>'Draft')
   OR (NEW.command='Review' AND NEW.snapshot->>'state'<>payload->>'outcome')
   OR NOT EXISTS(SELECT 1 FROM ppo.audit_events a JOIN ppo.operation_receipts r ON (r.workspace_id,r.actor_id,r.operation_id)=(a.workspace_id,a.actor_id,a.operation_id)
    JOIN ppo.outbox_jobs o ON (o.workspace_id,o.actor_id,o.operation_id)=(a.workspace_id,a.actor_id,a.operation_id)
    WHERE (a.workspace_id,a.actor_id,a.operation_id)=(NEW.workspace_id,NEW.actor_id,NEW.operation_id)
    AND a.object_type='TemplateProposal' AND a.object_id=NEW.proposal_id AND a.outcome='Accepted' AND a.reason=NEW.reason
    AND a.details->>'command'='TemplateDraft:'||NEW.command AND a.details->>'event_id'=NEW.id::text
    AND r.record_id=NEW.proposal_id AND r.payload_hash=NEW.command_hash AND r.result->>'record_version'=NEW.proposal_version::text AND r.result->>'state'=NEW.snapshot->>'state'
    AND o.kind='SharedRecordUpdated' AND o.payload->>'object_type'='TemplateProposal' AND o.payload->>'record_id'=NEW.proposal_id::text AND o.payload->>'record_version'=NEW.proposal_version::text) THEN
   RAISE EXCEPTION 'Exact typed operation graph required' USING ERRCODE='23514';
  END IF;
 ELSE
  SELECT * INTO e FROM ppo.template_proposal_events WHERE workspace_id=NEW.workspace_id AND proposal_id=NEW.proposal_id AND proposal_version=NEW.proposal_version;
  IF e.id IS NULL OR e.payload IS DISTINCT FROM to_jsonb(NEW)
   OR (TG_TABLE_NAME='template_proposal_revisions' AND e.command NOT IN ('Create','Revise'))
   OR (TG_TABLE_NAME='template_proposal_reviews' AND e.command<>'Review') THEN RAISE EXCEPTION 'Typed proposal evidence required' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NULL;
END $$;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['template_proposals','template_proposal_revisions','template_proposal_reviews','template_proposal_events'] LOOP
  EXECUTE format('CREATE CONSTRAINT TRIGGER template_proposal_evidence AFTER INSERT OR UPDATE ON ppo.%I DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.template_proposal_evidence()',t);
 END LOOP;
END $$;
