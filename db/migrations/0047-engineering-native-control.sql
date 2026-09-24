-- ADR-0047: EN-01–EN-05; package identities and EN-06–EN-08 remain unchanged.
DO $$ DECLARE item record; definition text; BEGIN
 FOR item IN SELECT * FROM (VALUES
 ('permission_grants','ck_grants_capability','capability','engineering.technical.review,engineering.technical.issue,engineering.technical.distribute,engineering.technical.source'),
 ('outbox_jobs','ck_outbox_kind','kind','EngineeringControlSaved')
 ) v(tab,con,col,added) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid=('ppo.'||item.tab)::regclass AND conname=item.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',item.tab,item.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR %I=ANY(%L::text[]))',item.tab,item.con,substring(definition from 8 for length(definition)-8),item.col,string_to_array(item.added,','));
 END LOOP;
END $$;

CREATE TABLE ppo.engineering_control_policies (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,company_id uuid NOT NULL,site_id uuid,
 policy_version integer NOT NULL CHECK(policy_version>0),effective_from timestamptz NOT NULL,
 independent_review boolean NOT NULL DEFAULT true,independent_issue boolean NOT NULL DEFAULT true,
 grants jsonb NOT NULL CHECK(jsonb_typeof(grants)='array'),
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,company_id,policy_version),
 FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id) REFERENCES ppo.sites(workspace_id,company_id,id)
);
CREATE TRIGGER retain_policy BEFORE UPDATE OR DELETE ON ppo.engineering_control_policies FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

-- Separate typed aggregates, with versioned validated content. Relational links below retain
-- exact source keys; JSON is the versioned record's structured evidence, never an arbitrary entity.
DO $$ DECLARE item record; BEGIN
 FOR item IN SELECT * FROM (VALUES
 ('engineering_bases','Draft,Submitted,Returned,Reviewed,Withdrawn'),
 ('engineering_documents','Current,Superseded,Withdrawn'),
 ('engineering_queries','Open,Answered,Returned,Resolved'),
 ('engineering_submittals','Submitted,Returned,Accepted,Rejected,Superseded'),
 ('engineering_reviews','Submitted,Returned,Reviewed'),
 ('engineering_issues','Issued,Withdrawn,Superseded'),
 ('engineering_deliverables','Planned,InProgress,Complete')
 ) v(tab,states) LOOP
  EXECUTE format('CREATE TABLE ppo.%I (
   id uuid PRIMARY KEY,workspace_id uuid NOT NULL,company_id uuid NOT NULL,package_id uuid NOT NULL,
   reference text NOT NULL CHECK(length(btrim(reference)) BETWEEN 1 AND 100),title text NOT NULL CHECK(length(btrim(title)) BETWEEN 1 AND 300),
   owner_id uuid NOT NULL,due_date date CHECK(isfinite(due_date)),version integer NOT NULL DEFAULT 1 CHECK(version>0),revision integer NOT NULL DEFAULT 1 CHECK(revision>0),
   state text NOT NULL CHECK(state=ANY(%L::text[])),content jsonb NOT NULL CHECK(jsonb_typeof(content)=''object'' AND content->>''schema_version''=''1'' AND octet_length(content::text)<=262144),
   predecessor_id uuid,created_by uuid NOT NULL,updated_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
   UNIQUE(workspace_id,id),UNIQUE(workspace_id,package_id,id),UNIQUE(workspace_id,package_id,reference),
   FOREIGN KEY(workspace_id,company_id,package_id) REFERENCES ppo.engineering_packages(workspace_id,company_id,id),
   FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),
   FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
   FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id),
   FOREIGN KEY(workspace_id,package_id,predecessor_id) REFERENCES ppo.%I(workspace_id,package_id,id)
  )',item.tab,string_to_array(item.states,','),item.tab);
  EXECUTE format('CREATE TRIGGER retain_record BEFORE DELETE ON ppo.%I FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence()',item.tab);
  EXECUTE format('CREATE INDEX ON ppo.%I(workspace_id,package_id)',item.tab);
 END LOOP;
END $$;

CREATE TABLE ppo.engineering_document_revisions (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,package_id uuid NOT NULL,document_id uuid NOT NULL,
 source_id uuid NOT NULL,engineering_revision text NOT NULL,native_system text NOT NULL,native_reference text NOT NULL,native_version text NOT NULL,
 discipline text NOT NULL,document_reference text NOT NULL,document_title text NOT NULL,
 configuration text,outputs jsonb NOT NULL CHECK(jsonb_typeof(outputs)='array'),basis_id uuid,
 predecessor_id uuid,created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,package_id,id),UNIQUE(workspace_id,document_id,id),UNIQUE(workspace_id,document_id,engineering_revision),UNIQUE(workspace_id,source_id),
 FOREIGN KEY(workspace_id,package_id,document_id) REFERENCES ppo.engineering_documents(workspace_id,package_id,id),
 FOREIGN KEY(workspace_id,source_id) REFERENCES ppo.material_sources(workspace_id,id),
 FOREIGN KEY(workspace_id,package_id,basis_id) REFERENCES ppo.engineering_bases(workspace_id,package_id,id),
 FOREIGN KEY(workspace_id,document_id,predecessor_id) REFERENCES ppo.engineering_document_revisions(workspace_id,document_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER retain_revision BEFORE UPDATE OR DELETE ON ppo.engineering_document_revisions FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

-- Exact reviewed children: no package-wide revision shortcut.
CREATE TABLE ppo.engineering_review_items (
 workspace_id uuid NOT NULL,package_id uuid NOT NULL,review_id uuid NOT NULL,source_id uuid NOT NULL,
 basis_id uuid,document_revision_id uuid,submittal_id uuid,
 PRIMARY KEY(workspace_id,review_id,source_id),
 FOREIGN KEY(workspace_id,package_id,review_id) REFERENCES ppo.engineering_reviews(workspace_id,package_id,id),
 FOREIGN KEY(workspace_id,source_id) REFERENCES ppo.material_sources(workspace_id,id),
 FOREIGN KEY(workspace_id,package_id,basis_id) REFERENCES ppo.engineering_bases(workspace_id,package_id,id),
 FOREIGN KEY(workspace_id,package_id,document_revision_id) REFERENCES ppo.engineering_document_revisions(workspace_id,package_id,id),
 FOREIGN KEY(workspace_id,package_id,submittal_id) REFERENCES ppo.engineering_submittals(workspace_id,package_id,id)
);
CREATE TRIGGER retain_review_item BEFORE UPDATE OR DELETE ON ppo.engineering_review_items FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

CREATE TABLE ppo.engineering_findings (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,package_id uuid NOT NULL,review_id uuid NOT NULL,
 owner_id uuid NOT NULL,due_date date,version integer NOT NULL DEFAULT 1 CHECK(version>0),
 finding text NOT NULL,response text,state text NOT NULL DEFAULT 'Open' CHECK(state IN ('Open','ResponseReceived','Accepted')),
 created_by uuid NOT NULL,accepted_by uuid,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,package_id,id),
 FOREIGN KEY(workspace_id,package_id,review_id) REFERENCES ppo.engineering_reviews(workspace_id,package_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,accepted_by) REFERENCES ppo.users(workspace_id,id),
 CHECK(state<>'Accepted' OR (response IS NOT NULL AND accepted_by IS NOT NULL AND accepted_by<>owner_id))
);
CREATE TRIGGER retain_finding BEFORE DELETE ON ppo.engineering_findings FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

CREATE TABLE ppo.engineering_transmittals (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,package_id uuid NOT NULL,issue_id uuid NOT NULL,recipient_id uuid NOT NULL,
 created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,package_id,id),UNIQUE(workspace_id,issue_id,recipient_id),
 FOREIGN KEY(workspace_id,package_id,issue_id) REFERENCES ppo.engineering_issues(workspace_id,package_id,id),
 FOREIGN KEY(workspace_id,recipient_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER retain_transmittal BEFORE UPDATE OR DELETE ON ppo.engineering_transmittals FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.engineering_distribution_evidence (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,transmittal_id uuid NOT NULL,
 kind text NOT NULL CHECK(kind IN ('Sent','Delivered','Acknowledged')),
 evidence text NOT NULL,issue_hash text NOT NULL CHECK(issue_hash ~ '^[a-f0-9]{64}$'),
 recorded_by uuid NOT NULL,recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,transmittal_id,kind),
 FOREIGN KEY(workspace_id,transmittal_id) REFERENCES ppo.engineering_transmittals(workspace_id,id),
 FOREIGN KEY(workspace_id,recorded_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER retain_distribution BEFORE UPDATE OR DELETE ON ppo.engineering_distribution_evidence FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

CREATE TABLE ppo.engineering_control_events (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,package_id uuid NOT NULL,subject_id uuid NOT NULL,subject_kind text NOT NULL,
 operation_id uuid NOT NULL,action text NOT NULL,version integer NOT NULL,content jsonb NOT NULL,content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'),
 recorded_by uuid NOT NULL,recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),reason text NOT NULL,
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,recorded_by,operation_id),
 FOREIGN KEY(workspace_id,package_id) REFERENCES ppo.engineering_packages(workspace_id,id),
 FOREIGN KEY(workspace_id,recorded_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER retain_control_event BEFORE UPDATE OR DELETE ON ppo.engineering_control_events FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

CREATE FUNCTION ppo.engineering_control_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF (NEW.id,NEW.workspace_id,NEW.company_id,NEW.package_id,NEW.reference,NEW.predecessor_id,NEW.created_by,NEW.created_at)
 IS DISTINCT FROM (OLD.id,OLD.workspace_id,OLD.company_id,OLD.package_id,OLD.reference,OLD.predecessor_id,OLD.created_by,OLD.created_at)
 THEN RAISE EXCEPTION 'Engineering scope and identity are permanent' USING ERRCODE='55000'; END IF;
 IF NEW.version<>OLD.version+1 OR NEW.revision<>OLD.revision THEN RAISE EXCEPTION 'Use an expected version or a successor' USING ERRCODE='23514'; END IF;
 IF TG_TABLE_NAME IN ('engineering_reviews','engineering_issues','engineering_submittals') OR (TG_TABLE_NAME='engineering_bases' AND OLD.state<>'Draft') THEN
  IF (NEW.title,NEW.owner_id,NEW.due_date,NEW.content) IS DISTINCT FROM (OLD.title,OLD.owner_id,OLD.due_date,OLD.content)
  THEN RAISE EXCEPTION 'Submitted content is immutable; create a successor' USING ERRCODE='55000'; END IF;
 END IF;
 RETURN NEW;
END $$;
DO $$ DECLARE tab text; BEGIN
 FOREACH tab IN ARRAY ARRAY['engineering_bases','engineering_documents','engineering_queries','engineering_submittals','engineering_reviews','engineering_issues','engineering_deliverables'] LOOP
  EXECUTE format('CREATE TRIGGER protect_control BEFORE UPDATE ON ppo.%I FOR EACH ROW EXECUTE FUNCTION ppo.engineering_control_guard()',tab);
 END LOOP;
END $$;

-- Native upstream lineage is additive. Historical synthetic sources remain valid.
CREATE TABLE ppo.engineering_source_lineage (
 workspace_id uuid NOT NULL,package_id uuid NOT NULL,source_id uuid NOT NULL,basis_id uuid,document_revision_id uuid,issue_id uuid,
 PRIMARY KEY(workspace_id,source_id),CHECK(num_nonnulls(basis_id,document_revision_id,issue_id)=1),
 FOREIGN KEY(workspace_id,source_id) REFERENCES ppo.material_sources(workspace_id,id),
 FOREIGN KEY(workspace_id,package_id,basis_id) REFERENCES ppo.engineering_bases(workspace_id,package_id,id),
 FOREIGN KEY(workspace_id,package_id,document_revision_id) REFERENCES ppo.engineering_document_revisions(workspace_id,package_id,id),
 FOREIGN KEY(workspace_id,package_id,issue_id) REFERENCES ppo.engineering_issues(workspace_id,package_id,id)
);
CREATE TRIGGER retain_lineage BEFORE UPDATE OR DELETE ON ppo.engineering_source_lineage FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

-- One successor and one issue per reviewed content; all history remains addressable.
CREATE UNIQUE INDEX engineering_basis_successor ON ppo.engineering_bases(workspace_id,predecessor_id) WHERE predecessor_id IS NOT NULL;
CREATE UNIQUE INDEX engineering_review_successor ON ppo.engineering_reviews(workspace_id,predecessor_id) WHERE predecessor_id IS NOT NULL;
CREATE UNIQUE INDEX engineering_issue_review ON ppo.engineering_issues(workspace_id,(content->>'review_id'));

CREATE TABLE ppo.engineering_source_dependencies (
 workspace_id uuid NOT NULL,package_id uuid NOT NULL,source_id uuid NOT NULL,dependency_id uuid NOT NULL,
 PRIMARY KEY(workspace_id,source_id,dependency_id),CHECK(source_id<>dependency_id),
 FOREIGN KEY(workspace_id,source_id) REFERENCES ppo.material_sources(workspace_id,id),
 FOREIGN KEY(workspace_id,dependency_id) REFERENCES ppo.material_sources(workspace_id,id),
 FOREIGN KEY(workspace_id,package_id) REFERENCES ppo.engineering_packages(workspace_id,id)
);
CREATE TRIGGER retain_dependency BEFORE UPDATE OR DELETE ON ppo.engineering_source_dependencies FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.engineering_source_scope_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM ppo.material_sources s WHERE (s.workspace_id,s.package_id,s.id)=(NEW.workspace_id,NEW.package_id,NEW.source_id))
 THEN RAISE EXCEPTION 'Exact source belongs to another package' USING ERRCODE='23514'; END IF;
 IF TG_TABLE_NAME='engineering_source_dependencies' THEN
  IF NOT EXISTS(SELECT 1 FROM ppo.material_sources s WHERE (s.workspace_id,s.package_id,s.id)=(NEW.workspace_id,NEW.package_id,NEW.dependency_id) AND s.created_at <= (SELECT created_at FROM ppo.material_sources WHERE id=NEW.source_id))
  THEN RAISE EXCEPTION 'Dependencies precede the derived source in the same package' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER source_scope BEFORE INSERT ON ppo.engineering_source_dependencies FOR EACH ROW EXECUTE FUNCTION ppo.engineering_source_scope_guard();
CREATE TRIGGER source_scope BEFORE INSERT ON ppo.engineering_source_lineage FOR EACH ROW EXECUTE FUNCTION ppo.engineering_source_scope_guard();
CREATE TRIGGER source_scope BEFORE INSERT ON ppo.engineering_document_revisions FOR EACH ROW EXECUTE FUNCTION ppo.engineering_source_scope_guard();
CREATE TRIGGER source_scope BEFORE INSERT ON ppo.engineering_review_items FOR EACH ROW EXECUTE FUNCTION ppo.engineering_source_scope_guard();

-- A changed upstream reference withdraws CURRENT USE of each native derived source.
-- The immutable basis/review/issue and its acknowledgements are retained. Existing EN-06–EN-08
-- already consume material_source_changes, so they require reassessment without new release engines.
CREATE FUNCTION ppo.engineering_invalidate_derived_sources() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 INSERT INTO ppo.material_source_changes(workspace_id,company_id,source_id,change,reason,operation_id,created_by)
 SELECT d.workspace_id,s.company_id,d.source_id,'Withdrawn','Upstream source changed; reassess the exact technical content.',NEW.operation_id,NEW.created_by
 FROM ppo.engineering_source_dependencies d JOIN ppo.material_sources s ON (s.workspace_id,s.id)=(d.workspace_id,d.source_id)
 WHERE (d.workspace_id,d.dependency_id)=(NEW.workspace_id,NEW.source_id)
 ON CONFLICT(workspace_id,source_id) DO NOTHING;
 RETURN NEW;
END $$;
CREATE TRIGGER invalidate_native_sources AFTER INSERT ON ppo.material_source_changes FOR EACH ROW EXECUTE FUNCTION ppo.engineering_invalidate_derived_sources();

CREATE FUNCTION ppo.engineering_transition_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NEW.state=OLD.state THEN RETURN NEW; END IF;
 IF NOT (
  (TG_TABLE_NAME='engineering_bases' AND ((OLD.state='Draft' AND NEW.state='Submitted') OR (OLD.state='Submitted' AND NEW.state IN ('Reviewed','Returned')) OR (OLD.state='Reviewed' AND NEW.state='Withdrawn'))) OR
  (TG_TABLE_NAME='engineering_reviews' AND OLD.state='Submitted' AND NEW.state IN ('Reviewed','Returned')) OR
  (TG_TABLE_NAME='engineering_issues' AND OLD.state='Issued' AND NEW.state IN ('Withdrawn','Superseded')) OR
  (TG_TABLE_NAME='engineering_submittals' AND ((OLD.state='Submitted' AND NEW.state IN ('Accepted','Returned','Rejected')) OR (OLD.state='Accepted' AND NEW.state='Superseded'))) OR
  (TG_TABLE_NAME='engineering_queries' AND ((OLD.state IN ('Open','Returned') AND NEW.state IN ('Answered','Resolved')) OR (OLD.state='Answered' AND NEW.state IN ('Returned','Resolved')))) OR
  (TG_TABLE_NAME='engineering_documents' AND OLD.state='Current' AND NEW.state IN ('Superseded','Withdrawn')) OR
  (TG_TABLE_NAME='engineering_deliverables' AND OLD.state='Planned' AND NEW.state='InProgress') OR
  (TG_TABLE_NAME='engineering_deliverables' AND OLD.state='InProgress' AND NEW.state='Complete')
 ) THEN RAISE EXCEPTION 'Invalid controlled Engineering transition' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
DO $$ DECLARE tab text; BEGIN
 FOREACH tab IN ARRAY ARRAY['engineering_bases','engineering_documents','engineering_queries','engineering_submittals','engineering_reviews','engineering_issues','engineering_deliverables'] LOOP
  EXECUTE format('CREATE TRIGGER control_transition BEFORE UPDATE ON ppo.%I FOR EACH ROW EXECUTE FUNCTION ppo.engineering_transition_guard()',tab);
 END LOOP;
END $$;

CREATE FUNCTION ppo.engineering_issue_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE review ppo.engineering_reviews; policy ppo.engineering_control_policies; BEGIN
 SELECT * INTO STRICT review FROM ppo.engineering_reviews WHERE workspace_id=NEW.workspace_id AND package_id=NEW.package_id AND id=(NEW.content->>'review_id')::uuid;
 SELECT * INTO STRICT policy FROM ppo.engineering_control_policies WHERE workspace_id=NEW.workspace_id AND company_id=NEW.company_id AND id=(NEW.content->>'policy_id')::uuid;
 IF review.state<>'Reviewed' OR NEW.content->>'purpose' IS DISTINCT FROM review.content->>'purpose'
 OR NEW.content->'manifest'->'exact_content' IS DISTINCT FROM review.content->'submission'
 OR NEW.content->'manifest'->>'submission_hash' IS DISTINCT FROM review.content->>'submission_hash'
 OR NEW.content->'source_ids' IS DISTINCT FROM review.content->'source_ids'
 THEN RAISE EXCEPTION 'Issue must preserve the exact completed review' USING ERRCODE='23514'; END IF;
 IF policy.independent_issue AND (NEW.created_by=review.owner_id OR review.content->'contributors' ? NEW.created_by::text)
 THEN RAISE EXCEPTION 'Independent issue authority required' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER exact_issue BEFORE INSERT ON ppo.engineering_issues FOR EACH ROW EXECUTE FUNCTION ppo.engineering_issue_guard();

CREATE FUNCTION ppo.engineering_distribution_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE trans ppo.engineering_transmittals; issue ppo.engineering_issues; BEGIN
 SELECT * INTO STRICT trans FROM ppo.engineering_transmittals WHERE workspace_id=NEW.workspace_id AND id=NEW.transmittal_id;
 SELECT * INTO STRICT issue FROM ppo.engineering_issues WHERE workspace_id=NEW.workspace_id AND id=trans.issue_id;
 IF issue.state<>'Issued' OR NEW.issue_hash IS DISTINCT FROM issue.content->>'manifest_hash' OR (NEW.kind='Acknowledged' AND trans.recipient_id<>NEW.recorded_by)
 THEN RAISE EXCEPTION 'Evidence must identify this issued manifest and exact recipient' USING ERRCODE='23514'; END IF;
 IF NEW.kind<>'Sent' AND NOT EXISTS(SELECT 1 FROM ppo.engineering_distribution_evidence WHERE workspace_id=NEW.workspace_id AND transmittal_id=NEW.transmittal_id AND kind=CASE WHEN NEW.kind='Delivered' THEN 'Sent' ELSE 'Delivered' END)
 THEN RAISE EXCEPTION 'Retain preceding distribution evidence first' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER exact_distribution BEFORE INSERT ON ppo.engineering_distribution_evidence FOR EACH ROW EXECUTE FUNCTION ppo.engineering_distribution_guard();

CREATE FUNCTION ppo.engineering_finding_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF OLD.state='Accepted' OR NEW.version<>OLD.version+1 OR (NEW.id,NEW.workspace_id,NEW.package_id,NEW.review_id,NEW.owner_id,NEW.finding,NEW.created_by,NEW.created_at) IS DISTINCT FROM (OLD.id,OLD.workspace_id,OLD.package_id,OLD.review_id,OLD.owner_id,OLD.finding,OLD.created_by,OLD.created_at)
 THEN RAISE EXCEPTION 'Retain finding identity and accepted closure' USING ERRCODE='55000'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER finding_guard BEFORE UPDATE ON ppo.engineering_findings FOR EACH ROW EXECUTE FUNCTION ppo.engineering_finding_guard();
