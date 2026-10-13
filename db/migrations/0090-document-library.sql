-- DK-01 / DK-02: empty synthetic library; no users or permission grants.
-- Flush deferred identities from earlier pending migrations (including 0026).
SET CONSTRAINTS ppo.identity_target IMMEDIATE;
DO $$ DECLARE spec record; definition text; BEGIN
 FOR spec IN SELECT * FROM (VALUES
  ('business_identities','ck_identities_type','object_type','LibraryDocument'),
  ('audit_events','ck_audit_object_type','object_type','LibraryDocument'),
  ('permission_grants','ck_grants_capability','capability','document.read,document.register,document.review'),
  ('reference_counters','ck_reference_type','record_type','DOC')
 ) v(tab,con,col,added) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid=('ppo.'||spec.tab)::regclass AND conname=spec.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',spec.tab,spec.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR %I = ANY(%L::text[]))',spec.tab,spec.con,substring(definition from 8 for length(definition)-8),spec.col,string_to_array(spec.added,','));
 END LOOP;
 SELECT pg_get_functiondef('ppo.identity_has_typed_record()'::regprocedure) INTO definition;
 IF position('CASE NEW.object_type' in definition)=0 THEN RAISE EXCEPTION 'Inspect changed identity dispatch'; END IF;
 EXECUTE replace(definition,'CASE NEW.object_type','CASE NEW.object_type WHEN ''LibraryDocument'' THEN ''library_documents''');
END $$;
SET CONSTRAINTS ppo.identity_target DEFERRED;

CREATE TABLE ppo.library_documents (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL,
 organisation_id uuid NOT NULL, site_id uuid, display_number text,
 version integer NOT NULL CHECK(version>0), current_revision_id uuid NOT NULL,
 state text NOT NULL CHECK(state IN ('Current','Withdrawn')),
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 updated_by uuid NOT NULL, updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id),
 FOREIGN KEY(workspace_id,organisation_id) REFERENCES ppo.organisations(workspace_id,id),
 FOREIGN KEY(workspace_id,site_id) REFERENCES ppo.sites(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER library_identity BEFORE INSERT OR UPDATE ON ppo.library_documents FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('LibraryDocument','DOC');
CREATE TRIGGER library_retained BEFORE DELETE ON ppo.library_documents FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.library_revisions (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, document_id uuid NOT NULL,
 revision integer NOT NULL CHECK(revision>0), document_version integer NOT NULL CHECK(document_version>0),
 title text NOT NULL CHECK(length(title) BETWEEN 1 AND 200),
 document_type text NOT NULL CHECK(length(document_type) BETWEEN 1 AND 80),
 applicability text NOT NULL CHECK(length(applicability) BETWEEN 1 AND 2000),
 audience text NOT NULL CHECK(length(audience) BETWEEN 1 AND 200),
 owner_id uuid NOT NULL, source jsonb NOT NULL,
 created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(), reason text NOT NULL,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,document_id,id), UNIQUE(workspace_id,document_id,revision),
 FOREIGN KEY(workspace_id,document_id) REFERENCES ppo.library_documents(workspace_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 CHECK(jsonb_typeof(source)='object' AND source ?& ARRAY['kind','author_id','content_hash','byte_count','content_type','operation_id','command_hash','issue_id','store_key','envelope_hash'] AND source->>'kind' IN ('SyntheticText','JobPackIssue','ReportIssue')
  AND source->>'content_hash' ~ '^[a-f0-9]{64}$' AND (source->>'byte_count')::integer BETWEEN 1 AND 20000000
  AND source->>'author_id' IS NOT NULL AND source->>'operation_id' IS NOT NULL
  AND source->>'command_hash' ~ '^[a-f0-9]{64}$')
);
ALTER TABLE ppo.library_documents ADD FOREIGN KEY(workspace_id,id,current_revision_id) REFERENCES ppo.library_revisions(workspace_id,document_id,id) DEFERRABLE INITIALLY DEFERRED;
CREATE TABLE ppo.library_findings (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, document_id uuid NOT NULL, revision_id uuid NOT NULL,
 document_version integer NOT NULL CHECK(document_version>0), text text NOT NULL CHECK(length(text) BETWEEN 1 AND 2000),
 owner_id uuid NOT NULL, due_date date NOT NULL, state text NOT NULL CHECK(state IN ('Open','AwaitingReview','Closed')),
 response text, response_by uuid, response_at timestamptz,
 acceptance text, accepted_by uuid, accepted_at timestamptz,
 created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id),
 FOREIGN KEY(workspace_id,document_id,revision_id) REFERENCES ppo.library_revisions(workspace_id,document_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,response_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,accepted_by) REFERENCES ppo.users(workspace_id,id),
 CHECK((state='Open' AND response IS NULL AND response_by IS NULL AND response_at IS NULL AND acceptance IS NULL AND accepted_by IS NULL AND accepted_at IS NULL)
  OR (state='AwaitingReview' AND length(response) BETWEEN 1 AND 2000 AND response_by IS NOT NULL AND response_at IS NOT NULL AND acceptance IS NULL AND accepted_by IS NULL AND accepted_at IS NULL)
  OR (state='Closed' AND length(response) BETWEEN 1 AND 2000 AND response_by IS NOT NULL AND response_at IS NOT NULL AND length(acceptance) BETWEEN 1 AND 2000 AND accepted_by IS NOT NULL AND accepted_at IS NOT NULL AND accepted_by<>response_by))
);
CREATE TABLE ppo.library_reviews (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, document_id uuid NOT NULL, revision_id uuid NOT NULL,
 document_version integer NOT NULL CHECK(document_version>0),
 outcome text NOT NULL CHECK(outcome IN ('Reviewed','Returned')), purpose text NOT NULL CHECK(length(purpose) BETWEEN 1 AND 200),
 rationale text NOT NULL CHECK(length(rationale) BETWEEN 1 AND 2000), content_hash text NOT NULL,
 findings_snapshot jsonb NOT NULL CHECK(jsonb_typeof(findings_snapshot)='array'),
 reviewer_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,revision_id),
 FOREIGN KEY(workspace_id,document_id,revision_id) REFERENCES ppo.library_revisions(workspace_id,document_id,id),
 FOREIGN KEY(workspace_id,reviewer_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE TABLE ppo.library_links (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, document_id uuid NOT NULL, revision_id uuid NOT NULL,
 document_version integer NOT NULL CHECK(document_version>0),
 target_kind text NOT NULL CHECK(target_kind IN ('Organisation','Site','Asset','Project','WorkOrder','EngineeringPackage')),
 target_id uuid NOT NULL, purpose text NOT NULL CHECK(length(purpose) BETWEEN 1 AND 500),
 created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 retired_by uuid, retired_at timestamptz,
 UNIQUE(workspace_id,id),
 FOREIGN KEY(workspace_id,document_id,revision_id) REFERENCES ppo.library_revisions(workspace_id,document_id,id),
 FOREIGN KEY(workspace_id,target_id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,retired_by) REFERENCES ppo.users(workspace_id,id),
 CHECK((retired_by IS NULL)=(retired_at IS NULL))
);
CREATE UNIQUE INDEX library_active_link ON ppo.library_links(workspace_id,document_id,revision_id,target_kind,target_id) WHERE retired_at IS NULL;
CREATE TABLE ppo.library_events (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, document_id uuid NOT NULL, revision_id uuid NOT NULL,
 document_version integer NOT NULL, command text NOT NULL CHECK(command IN ('Create','Revise','Finding:Open','Finding:Respond','Finding:Accept','Review','Link:Add','Link:Retire','Withdraw','Recover')),
 actor_id uuid NOT NULL, operation_id uuid NOT NULL, reason text NOT NULL,
 document_snapshot jsonb NOT NULL, payload jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,document_id,document_version), UNIQUE(workspace_id,actor_id,operation_id),
 FOREIGN KEY(workspace_id,document_id,revision_id) REFERENCES ppo.library_revisions(workspace_id,document_id,id),
 FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE INDEX library_scope ON ppo.library_documents(workspace_id,company_id,site_id,id);
CREATE INDEX library_source_issue ON ppo.library_revisions(workspace_id,(source->>'issue_id'));
CREATE INDEX library_link_target ON ppo.library_links(workspace_id,target_kind,target_id);
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['library_revisions','library_reviews','library_events'] LOOP
  EXECUTE format('CREATE TRIGGER retained BEFORE UPDATE OR DELETE ON ppo.%I FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence()',t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['library_findings','library_links'] LOOP
  EXECUTE format('CREATE TRIGGER retained BEFORE DELETE ON ppo.%I FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence()',t);
 END LOOP;
END $$;
CREATE FUNCTION ppo.library_transition() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE r ppo.library_revisions; d ppo.library_documents; kind text;
BEGIN
 IF TG_TABLE_NAME='library_documents' THEN
  IF NOT EXISTS(SELECT 1 FROM ppo.organisations o WHERE (o.workspace_id,o.id,o.company_id)=(NEW.workspace_id,NEW.organisation_id,NEW.company_id))
   OR (NEW.site_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM ppo.sites s WHERE (s.workspace_id,s.id,s.company_id)=(NEW.workspace_id,NEW.site_id,NEW.company_id))) THEN
   RAISE EXCEPTION 'Library context mismatch' USING ERRCODE='23514';
  END IF;
  IF TG_OP='INSERT' THEN
   IF NEW.version<>1 OR NEW.state<>'Current' THEN RAISE EXCEPTION 'Initial library state required' USING ERRCODE='23514'; END IF;
  ELSE
   IF NEW.version<>OLD.version+1 OR (to_jsonb(NEW)-ARRAY['version','current_revision_id','state','updated_by','updated_at']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['version','current_revision_id','state','updated_by','updated_at'])
    OR (OLD.state='Withdrawn' AND NEW.state<>'Withdrawn') THEN
    RAISE EXCEPTION 'Retained library identity and next version required' USING ERRCODE='23514';
   END IF;
  END IF;
  RETURN NEW;
 END IF;
 IF TG_TABLE_NAME='library_findings' AND TG_OP='UPDATE' THEN
  IF (to_jsonb(NEW)-ARRAY['document_version','state','response','response_by','response_at','acceptance','accepted_by','accepted_at'])
    IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['document_version','state','response','response_by','response_at','acceptance','accepted_by','accepted_at'])
   OR NOT ((OLD.state='Open' AND NEW.state='AwaitingReview' AND NEW.response_by=OLD.owner_id) OR (OLD.state='AwaitingReview' AND NEW.state='Closed'
    AND (NEW.response,NEW.response_by,NEW.response_at) IS NOT DISTINCT FROM (OLD.response,OLD.response_by,OLD.response_at))) THEN
   RAISE EXCEPTION 'Finding evidence and ordered transitions required' USING ERRCODE='23514';
  END IF;
 END IF;
 IF TG_TABLE_NAME='library_links' THEN
  SELECT object_type INTO kind FROM ppo.business_identities WHERE workspace_id=NEW.workspace_id AND id=NEW.target_id;
  IF kind IS DISTINCT FROM NEW.target_kind THEN RAISE EXCEPTION 'Typed link target required' USING ERRCODE='23514'; END IF;
  IF TG_OP='UPDATE' AND ((to_jsonb(NEW)-ARRAY['document_version','retired_by','retired_at']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['document_version','retired_by','retired_at']) OR OLD.retired_at IS NOT NULL OR NEW.retired_at IS NULL) THEN
   RAISE EXCEPTION 'Exact link is retained' USING ERRCODE='23514';
  END IF;
 END IF;
 IF TG_TABLE_NAME='library_reviews' THEN
  SELECT * INTO STRICT r FROM ppo.library_revisions WHERE workspace_id=NEW.workspace_id AND id=NEW.revision_id;
  SELECT * INTO STRICT d FROM ppo.library_documents WHERE workspace_id=NEW.workspace_id AND id=NEW.document_id;
  IF NEW.findings_snapshot IS DISTINCT FROM (SELECT coalesce(jsonb_agg(to_jsonb(f) ORDER BY f.id),'[]'::jsonb) FROM ppo.library_findings f WHERE workspace_id=NEW.workspace_id AND revision_id=NEW.revision_id) OR NEW.reviewer_id IN (r.created_by,(r.source->>'author_id')::uuid) OR NEW.content_hash<>r.source->>'content_hash'
   OR d.current_revision_id<>r.id OR d.state<>'Current'
   OR (NEW.outcome='Reviewed' AND EXISTS(SELECT 1 FROM ppo.library_findings WHERE workspace_id=NEW.workspace_id AND revision_id=r.id AND state<>'Closed')) THEN
   RAISE EXCEPTION 'Independent review of current exact resolved content required' USING ERRCODE='23514';
  END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER library_document_transition BEFORE INSERT OR UPDATE ON ppo.library_documents FOR EACH ROW EXECUTE FUNCTION ppo.library_transition();
CREATE TRIGGER library_finding_transition BEFORE UPDATE ON ppo.library_findings FOR EACH ROW EXECUTE FUNCTION ppo.library_transition();
CREATE TRIGGER library_link_transition BEFORE INSERT OR UPDATE ON ppo.library_links FOR EACH ROW EXECUTE FUNCTION ppo.library_transition();
CREATE TRIGGER library_review_transition BEFORE INSERT ON ppo.library_reviews FOR EACH ROW EXECUTE FUNCTION ppo.library_transition();

-- Each typed write must have the matching versioned immutable event; an event
-- must have its exact audit / receipt / outbox graph at transaction commit.
CREATE FUNCTION ppo.library_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE e ppo.library_events; d ppo.library_documents; rev ppo.library_revisions;
BEGIN
 IF TG_TABLE_NAME='library_documents' THEN
  SELECT * INTO e FROM ppo.library_events WHERE workspace_id=NEW.workspace_id AND document_id=NEW.id AND document_version=NEW.version;
  IF e.id IS NULL OR e.document_snapshot IS DISTINCT FROM to_jsonb(NEW) OR e.actor_id<>NEW.updated_by THEN
   RAISE EXCEPTION 'Library snapshot evidence required' USING ERRCODE='23514';
  END IF;
 ELSIF TG_TABLE_NAME='library_events' THEN
  SELECT * INTO STRICT d FROM ppo.library_documents WHERE workspace_id=NEW.workspace_id AND id=NEW.document_id;
  IF d.version<NEW.document_version OR NEW.document_snapshot->>'id'<>NEW.document_id::text
   OR NEW.document_snapshot->>'version'<>NEW.document_version::text
   OR NOT EXISTS(SELECT 1 FROM ppo.audit_events a JOIN ppo.operation_receipts r ON (r.workspace_id,r.actor_id,r.operation_id)=(a.workspace_id,a.actor_id,a.operation_id)
    JOIN ppo.outbox_jobs o ON (o.workspace_id,o.actor_id,o.operation_id)=(a.workspace_id,a.actor_id,a.operation_id)
    WHERE (a.workspace_id,a.actor_id,a.operation_id)=(NEW.workspace_id,NEW.actor_id,NEW.operation_id)
    AND a.object_type='LibraryDocument' AND a.object_id=NEW.document_id AND a.outcome='Accepted' AND a.reason=NEW.reason
    AND a.details->>'command'='Library:'||NEW.command AND a.details->>'event_id'=NEW.id::text
    AND r.record_id=NEW.document_id AND r.result->>'record_version'=NEW.document_version::text
    AND o.kind='SharedRecordUpdated' AND o.payload->>'record_id'=NEW.document_id::text AND o.payload->>'record_version'=NEW.document_version::text) THEN
   RAISE EXCEPTION 'Library operation evidence required' USING ERRCODE='23514';
  END IF;
  IF (NEW.command='Withdraw' AND NEW.document_snapshot->>'state'<>'Withdrawn')
   OR (NEW.command NOT IN ('Withdraw','Recover','Link:Retire') AND NEW.document_snapshot->>'state'<>'Current')
   OR (NEW.command NOT IN ('Recover','Link:Retire') AND NEW.document_snapshot->>'current_revision_id'<>NEW.revision_id::text)
   OR (NEW.command='Create' AND NEW.document_version<>1) THEN
   RAISE EXCEPTION 'Library command state mismatch' USING ERRCODE='23514';
  END IF;
  IF NEW.command IN ('Create','Revise') THEN
   SELECT * INTO STRICT rev FROM ppo.library_revisions WHERE workspace_id=NEW.workspace_id AND id=NEW.revision_id;
   IF NEW.payload IS DISTINCT FROM to_jsonb(rev) OR NEW.document_snapshot->>'current_revision_id'<>rev.id::text OR rev.created_by<>NEW.actor_id OR rev.source->>'operation_id'<>NEW.operation_id::text OR rev.source->>'command_hash' IS DISTINCT FROM (SELECT payload_hash FROM ppo.operation_receipts WHERE workspace_id=NEW.workspace_id AND actor_id=NEW.actor_id AND operation_id=NEW.operation_id) THEN RAISE EXCEPTION 'Library revision evidence required' USING ERRCODE='23514'; END IF;
  END IF;
 ELSE
  SELECT * INTO e FROM ppo.library_events WHERE workspace_id=NEW.workspace_id AND document_id=NEW.document_id AND document_version=NEW.document_version;
  IF e.id IS NULL OR e.payload IS DISTINCT FROM to_jsonb(NEW) OR e.revision_id IS DISTINCT FROM (CASE WHEN TG_TABLE_NAME='library_revisions' THEN NEW.id ELSE (to_jsonb(NEW)->>'revision_id')::uuid END) OR
   (e.command IN ('Create','Revise','Finding:Open','Link:Add') AND e.actor_id::text IS DISTINCT FROM to_jsonb(NEW)->>'created_by') OR
   (e.command='Finding:Open' AND to_jsonb(NEW)->>'state'<>'Open') OR
   (e.command='Finding:Respond' AND (e.actor_id::text IS DISTINCT FROM to_jsonb(NEW)->>'response_by' OR to_jsonb(NEW)->>'state'<>'AwaitingReview')) OR
   (e.command='Finding:Accept' AND (e.actor_id::text IS DISTINCT FROM to_jsonb(NEW)->>'accepted_by' OR to_jsonb(NEW)->>'state'<>'Closed')) OR
   (e.command='Review' AND e.actor_id::text IS DISTINCT FROM to_jsonb(NEW)->>'reviewer_id') OR
   (e.command='Link:Retire' AND e.actor_id::text IS DISTINCT FROM to_jsonb(NEW)->>'retired_by') OR
   (TG_TABLE_NAME='library_revisions' AND e.command NOT IN ('Create','Revise')) OR
   (TG_TABLE_NAME='library_findings' AND e.command NOT IN ('Finding:Open','Finding:Respond','Finding:Accept')) OR
   (TG_TABLE_NAME='library_reviews' AND e.command<>'Review') OR
   (TG_TABLE_NAME='library_links' AND e.command NOT IN ('Link:Add','Link:Retire')) THEN
   RAISE EXCEPTION 'Typed library mutation evidence required' USING ERRCODE='23514';
  END IF;
 END IF;
 RETURN NULL;
END $$;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['library_documents','library_revisions','library_findings','library_reviews','library_links','library_events'] LOOP
  EXECUTE format('CREATE CONSTRAINT TRIGGER library_evidence AFTER INSERT OR UPDATE ON ppo.%I DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.library_evidence()',t);
 END LOOP;
END $$;
