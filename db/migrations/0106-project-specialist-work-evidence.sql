-- PJ-06 R3: preserve every prior row/hash/grant; no seed or implicit work authority.
SET CONSTRAINTS ppo.identity_target IMMEDIATE;
DO $$ DECLARE spec record; definition text; BEGIN
 FOR spec IN SELECT * FROM (VALUES ('business_identities','ck_identities_type'),('audit_events','ck_audit_object_type')) v(tab,con) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid=('ppo.'||spec.tab)::regclass AND conname=spec.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',spec.tab,spec.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR object_type = ''ProjectSpecialistWorkEvidence'')',spec.tab,spec.con,substring(definition from 8 for length(definition)-8));
 END LOOP;
 SELECT pg_get_functiondef('ppo.identity_has_typed_record()'::regprocedure) INTO definition;
 IF position('CASE NEW.object_type' in definition)=0 THEN RAISE EXCEPTION 'Inspect changed identity dispatch'; END IF;
 EXECUTE replace(definition,'CASE NEW.object_type','CASE NEW.object_type WHEN ''ProjectSpecialistWorkEvidence'' THEN ''project_specialist_work''');
END $$;
SET CONSTRAINTS ppo.identity_target DEFERRED;
DO $$ DECLARE definition text; BEGIN
 SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid='ppo.permission_grants'::regclass AND conname='ck_grants_capability';
 ALTER TABLE ppo.permission_grants DROP CONSTRAINT ck_grants_capability;
 EXECUTE format('ALTER TABLE ppo.permission_grants ADD CONSTRAINT ck_grants_capability CHECK ((%s) OR capability = ''project.specialist.work.review'')',substring(definition from 8 for length(definition)-8));
END $$;
CREATE TABLE ppo.project_specialist_work (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,company_id uuid NOT NULL,project_id uuid NOT NULL,
 handover_id uuid NOT NULL,document_id uuid NOT NULL,revision_id uuid NOT NULL,reviewer_id uuid NOT NULL,
 scope text NOT NULL CHECK(length(btrim(scope)) BETWEEN 1 AND 4000),limitations text NOT NULL CHECK(length(btrim(limitations)) BETWEEN 1 AND 4000),
 predecessor_id uuid,source jsonb NOT NULL,source_hash text NOT NULL CHECK(source_hash ~ '^[a-f0-9]{64}$'),
 created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,project_id,id),UNIQUE(workspace_id,predecessor_id),CHECK(predecessor_id IS NULL OR predecessor_id<>id),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,project_id) REFERENCES ppo.projects(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,handover_id) REFERENCES ppo.material_handovers(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,document_id,revision_id) REFERENCES ppo.library_revisions(workspace_id,document_id,id),
 FOREIGN KEY(workspace_id,reviewer_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,project_id,predecessor_id) REFERENCES ppo.project_specialist_work(workspace_id,project_id,id)
);
CREATE TRIGGER specialist_work_identity BEFORE INSERT ON ppo.project_specialist_work FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('ProjectSpecialistWorkEvidence','');
CREATE TRIGGER specialist_work_immutable BEFORE UPDATE OR DELETE ON ppo.project_specialist_work FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE INDEX specialist_work_project ON ppo.project_specialist_work(workspace_id,project_id,id);
CREATE TABLE ppo.project_specialist_work_events (
 workspace_id uuid NOT NULL,work_id uuid NOT NULL,version integer NOT NULL CHECK(version IN (1,2)),
 command text NOT NULL CHECK(command IN ('Submit','Accept','Return','Withdraw')),
 state text NOT NULL CHECK(state IN ('Submitted','Accepted','Returned','Withdrawn')),
 note text NOT NULL CHECK(length(btrim(note)) BETWEEN 1 AND 2000),reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),
 created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),operation_id uuid NOT NULL,
 PRIMARY KEY(workspace_id,work_id,version),UNIQUE(workspace_id,created_by,operation_id),
 FOREIGN KEY(workspace_id,work_id) REFERENCES ppo.project_specialist_work(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER specialist_work_event_immutable BEFORE UPDATE OR DELETE ON ppo.project_specialist_work_events FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.guard_specialist_work() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE h ppo.material_handovers; pr ppo.projects; eng ppo.engineering_packages; d ppo.library_documents; r ppo.library_revisions;
 brief ppo.project_specialist_events; prior ppo.project_specialist_work; expected jsonb;
BEGIN
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 SELECT * INTO STRICT pr FROM ppo.projects WHERE workspace_id=NEW.workspace_id AND id=NEW.project_id;
 SELECT * INTO STRICT h FROM ppo.material_handovers WHERE workspace_id=NEW.workspace_id AND id=NEW.handover_id;
 SELECT p.* INTO STRICT eng FROM ppo.engineering_packages p JOIN ppo.material_sets s ON (s.workspace_id,s.package_id)=(p.workspace_id,p.id) WHERE s.workspace_id=h.workspace_id AND s.id=h.set_id;
 SELECT * INTO STRICT d FROM ppo.library_documents WHERE workspace_id=NEW.workspace_id AND id=NEW.document_id;
 SELECT * INTO STRICT r FROM ppo.library_revisions WHERE workspace_id=NEW.workspace_id AND document_id=d.id AND id=NEW.revision_id;
 IF h.state<>'Accepted' OR h.specialist_package_id IS NULL OR h.company_id<>pr.company_id OR NEW.company_id<>pr.company_id OR eng.project_id IS DISTINCT FROM pr.id OR eng.site_id IS DISTINCT FROM pr.site_id OR d.company_id<>pr.company_id OR d.organisation_id<>pr.organisation_id OR d.site_id IS DISTINCT FROM pr.site_id THEN RAISE EXCEPTION 'Exact same-context accepted specialist handover and evidence required' USING ERRCODE='23514'; END IF;
 SELECT * INTO STRICT brief FROM ppo.project_specialist_events WHERE workspace_id=h.workspace_id AND package_id=h.specialist_package_id AND version=h.specialist_version;
 IF NEW.created_by<>pr.coordinator_id AND NEW.created_by<>(brief.content->>'owner_id')::uuid THEN RAISE EXCEPTION 'Specialist owner or coordinator required' USING ERRCODE='23514'; END IF;
 IF NEW.reviewer_id IN (NEW.created_by,r.created_by,(r.source->>'author_id')::uuid) THEN RAISE EXCEPTION 'Independent work reviewer required' USING ERRCODE='23514'; END IF;
 IF NOT EXISTS(SELECT 1 FROM ppo.users WHERE workspace_id=NEW.workspace_id AND id=NEW.reviewer_id AND active) THEN RAISE EXCEPTION 'Active reviewer required' USING ERRCODE='23514'; END IF;
 expected:=jsonb_build_object('handover',jsonb_build_object('id',h.id,'version',h.version,'payload_hash',h.payload_hash,'accept_operation_id',h.outcome_operation_id,'specialist_id',h.specialist_package_id,'specialist_version',h.specialist_version),
 'document',jsonb_build_object('id',d.id,'revision_id',r.id,'title',r.title,'content_hash',r.source->>'content_hash','byte_count',(r.source->>'byte_count')::integer,'revision_author_id',r.created_by,'source_author_id',r.source->>'author_id'));
 IF NEW.source<>expected OR NEW.source_hash<>encode(sha256(convert_to(ppo.project_specialist_source_json(expected),'UTF8')),'hex') THEN RAISE EXCEPTION 'Exact server-derived source snapshot required' USING ERRCODE='23514'; END IF;
 IF NEW.predecessor_id IS NOT NULL THEN
  SELECT * INTO STRICT prior FROM ppo.project_specialist_work WHERE workspace_id=NEW.workspace_id AND id=NEW.predecessor_id;
  IF prior.project_id<>pr.id OR prior.source->'handover'->>'specialist_id'<>h.specialist_package_id::text OR NOT EXISTS(SELECT 1 FROM ppo.project_specialist_work_events WHERE workspace_id=NEW.workspace_id AND work_id=prior.id AND version=2) THEN RAISE EXCEPTION 'Terminal predecessor in this specialist brief required' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER specialist_work_guard BEFORE INSERT ON ppo.project_specialist_work FOR EACH ROW EXECUTE FUNCTION ppo.guard_specialist_work();
-- Current native library issue, in addition to the library's exact current revision.
-- Storage bytes and actor access remain service checks; PostgreSQL guards native lineage.
CREATE FUNCTION ppo.specialist_work_document_current(ws uuid, doc uuid, rev uuid) RETURNS boolean LANGUAGE sql STABLE AS $$
 SELECT EXISTS(SELECT 1 FROM ppo.library_documents d JOIN ppo.library_revisions r ON (r.workspace_id,r.document_id,r.id)=(d.workspace_id,d.id,d.current_revision_id)
 WHERE d.workspace_id=ws AND d.id=doc AND r.id=rev AND d.state='Current' AND CASE r.source->>'kind'
 WHEN 'SyntheticText' THEN true
 WHEN 'JobPackIssue' THEN EXISTS(SELECT 1 FROM ppo.pack_issues i JOIN ppo.packs p ON (p.workspace_id,p.id)=(i.workspace_id,i.pack_id) WHERE i.workspace_id=ws AND i.id=(r.source->>'issue_id')::uuid AND p.current_issue_id=i.id AND p.status='Issued' AND NOT p.needs_review)
 WHEN 'ReportIssue' THEN EXISTS(SELECT 1 FROM ppo.report_issues i JOIN ppo.service_reports p ON (p.workspace_id,p.id)=(i.workspace_id,i.report_id) WHERE i.workspace_id=ws AND i.id=(r.source->>'issue_id')::uuid AND p.current_issue_id=i.id AND p.status='Issued')
 ELSE false END)
$$;
CREATE FUNCTION ppo.check_specialist_work_sources(w ppo.project_specialist_work) RETURNS void LANGUAGE plpgsql AS $$
DECLARE h ppo.material_handovers; brief ppo.project_specialist_events; pkg ppo.project_specialist_packages;
 source ppo.project_commercial_sources; eng ppo.engineering_packages; demand ppo.supply_records; rel ppo.material_releases;
BEGIN
 SELECT * INTO STRICT h FROM ppo.material_handovers WHERE workspace_id=w.workspace_id AND id=w.handover_id;
 SELECT * INTO STRICT pkg FROM ppo.project_specialist_packages WHERE workspace_id=w.workspace_id AND id=h.specialist_package_id;
 SELECT * INTO STRICT brief FROM ppo.project_specialist_events WHERE workspace_id=w.workspace_id AND package_id=pkg.id AND version=h.specialist_version;
 IF brief.state<>'Accepted' OR EXISTS(SELECT 1 FROM ppo.project_specialist_packages p JOIN ppo.project_specialist_events e ON (e.workspace_id,e.package_id)=(p.workspace_id,p.id) WHERE p.workspace_id=w.workspace_id AND p.predecessor_id=pkg.id AND e.state='Accepted')
 THEN RAISE EXCEPTION 'Current accepted specialist brief required' USING ERRCODE='23514'; END IF;
 IF NOT EXISTS(SELECT 1 FROM ppo.project_commercial_events e WHERE e.workspace_id=w.workspace_id AND e.entry_id=pkg.basis_id AND e.version=pkg.basis_version AND e.state='Approved'
  AND NOT EXISTS(SELECT 1 FROM ppo.project_commercial_events newer WHERE newer.workspace_id=e.workspace_id AND newer.entry_id=e.entry_id AND newer.version>e.version))
 THEN RAISE EXCEPTION 'Current approved commercial basis required' USING ERRCODE='23514'; END IF;
 SELECT * INTO STRICT source FROM ppo.project_commercial_sources WHERE workspace_id=w.workspace_id AND basis_id=pkg.basis_id;
 IF NOT ppo.specialist_work_document_current(w.workspace_id,source.document_id,source.document_revision_id)
  OR NOT EXISTS(SELECT 1 FROM ppo.library_documents d WHERE d.workspace_id=w.workspace_id AND d.id=source.document_id AND d.version=(source.snapshot->'input'->>'document_version')::int)
  OR NOT EXISTS(SELECT 1 FROM ppo.draft_quotes q JOIN ppo.draft_quote_revisions r ON (r.workspace_id,r.quote_id)=(q.workspace_id,q.id) WHERE r.workspace_id=w.workspace_id AND r.id=source.quote_revision_id AND q.current_revision_id=r.id AND q.version=(source.snapshot->'input'->'quotation'->>'expected_quote_version')::int)
  OR (SELECT max(sequence) FROM ppo.quote_response_events WHERE workspace_id=w.workspace_id AND revision_id=source.quote_revision_id) IS DISTINCT FROM (source.snapshot->'input'->'quotation'->>'expected_response_sequence')::int
  OR EXISTS(SELECT 1 FROM ppo.library_findings f WHERE f.workspace_id=w.workspace_id AND f.revision_id=source.document_revision_id AND (f.state<>'Closed' OR NOT EXISTS(SELECT 1 FROM ppo.library_reviews r, jsonb_array_elements(r.findings_snapshot) prior WHERE r.workspace_id=w.workspace_id AND r.id=source.document_review_id AND prior->>'id'=f.id::text)))
  OR NOT EXISTS(SELECT 1 FROM ppo.sales_handovers sh JOIN ppo.sales_workflow_events v ON (v.workspace_id,v.record_id)=(sh.workspace_id,sh.id) JOIN ppo.opportunities o ON (o.workspace_id,o.id)=(sh.workspace_id,sh.opportunity_id) WHERE sh.workspace_id=w.workspace_id AND sh.id=source.handover_id AND sh.state='Accepted' AND v.id=source.acceptance_event_id AND sh.version=v.version AND sh.source_hash=v.source_hash AND o.close_outcome='Won')
  OR EXISTS(SELECT 1 FROM ppo.quote_response_events v WHERE v.workspace_id=w.workspace_id AND v.id=source.response_event_id AND nullif(v.report->>'conditions','') IS NOT NULL)
  OR EXISTS(SELECT 1 FROM ppo.quote_response_events v WHERE v.workspace_id=w.workspace_id AND v.revision_id=source.quote_revision_id AND (v.report->>'outcome'='Negotiation' OR (v.report->>'outcome'='Clarification' AND NOT EXISTS(SELECT 1 FROM ppo.quote_response_events x WHERE x.workspace_id=v.workspace_id AND x.response_id=v.id AND x.action IN ('Correct','Confirm')))))
 THEN RAISE EXCEPTION 'Current exact commercial sources required' USING ERRCODE='23514'; END IF;
 SELECT * INTO STRICT eng FROM ppo.engineering_packages WHERE workspace_id=w.workspace_id AND id=(brief.content->'engineering'->>'id')::uuid;
 IF brief.source->'engineering' IS DISTINCT FROM jsonb_build_object('id',eng.id,'version',eng.version,'title',eng.title,'brief',eng.brief,'discipline',eng.discipline)
 THEN RAISE EXCEPTION 'Current exact Engineering source required' USING ERRCODE='23514'; END IF;
 IF brief.content->'demand'<>'null'::jsonb THEN
  SELECT * INTO STRICT demand FROM ppo.supply_records WHERE workspace_id=w.workspace_id AND id=(brief.content->'demand'->>'id')::uuid;
  IF brief.source->'demand' IS DISTINCT FROM jsonb_build_object('id',demand.id,'version',demand.version,'reference',demand.reference,'item',demand.item,'unit',demand.unit,'quantity',demand.quantity::text)
  THEN RAISE EXCEPTION 'Current exact Project demand required' USING ERRCODE='23514'; END IF;
 END IF;
 SELECT * INTO STRICT rel FROM ppo.material_releases WHERE workspace_id=w.workspace_id AND id=h.release_id;
 IF rel.issue_state<>'Issued' OR rel.withdrawn_at IS NOT NULL OR rel.superseded_by IS NOT NULL
  OR EXISTS(SELECT 1 FROM jsonb_array_elements(rel.manifest->'lines') l WHERE NOT EXISTS(SELECT 1 FROM ppo.material_lines current WHERE current.workspace_id=w.workspace_id AND current.set_id=h.set_id AND current.id=(l->>'line_id')::uuid AND current.content_hash=l->>'content_hash'))
  OR EXISTS(SELECT 1 FROM jsonb_array_elements(rel.manifest->'sources') s WHERE NOT EXISTS(SELECT 1 FROM ppo.material_sources current LEFT JOIN ppo.material_source_changes ch ON (ch.workspace_id,ch.source_id)=(current.workspace_id,current.id) WHERE current.workspace_id=w.workspace_id AND current.package_id=eng.id AND current.id=(s->>'id')::uuid AND current.completeness<>'Unavailable' AND ch.source_id IS NULL))
 THEN RAISE EXCEPTION 'Current exact issued release required' USING ERRCODE='23514'; END IF;
 IF NOT EXISTS(SELECT 1 FROM ppo.material_sources s LEFT JOIN ppo.material_source_changes ch ON (ch.workspace_id,ch.source_id)=(s.workspace_id,s.id) WHERE s.workspace_id=w.workspace_id AND s.package_id=eng.id AND s.id=h.demand_source_id AND s.completeness<>'Unavailable' AND s.permitted_purpose='Procurement' AND ch.source_id IS NULL)
 THEN RAISE EXCEPTION 'Current approved handover demand required' USING ERRCODE='23514'; END IF;
 IF NOT ppo.specialist_work_document_current(w.workspace_id,w.document_id,w.revision_id)
 THEN RAISE EXCEPTION 'Current exact evidence revision required' USING ERRCODE='23514'; END IF;
END $$;
CREATE FUNCTION ppo.guard_specialist_work_event() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE w ppo.project_specialist_work;pr ppo.projects;previous ppo.project_specialist_work_events;h ppo.material_handovers;brief ppo.project_specialist_events;valid boolean;
BEGIN
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 SELECT * INTO STRICT w FROM ppo.project_specialist_work WHERE workspace_id=NEW.workspace_id AND id=NEW.work_id;
 SELECT * INTO STRICT pr FROM ppo.projects WHERE workspace_id=NEW.workspace_id AND id=w.project_id;
 SELECT * INTO STRICT h FROM ppo.material_handovers WHERE workspace_id=NEW.workspace_id AND id=w.handover_id;
 SELECT * INTO STRICT brief FROM ppo.project_specialist_events WHERE workspace_id=h.workspace_id AND package_id=h.specialist_package_id AND version=h.specialist_version;
 SELECT * INTO previous FROM ppo.project_specialist_work_events WHERE workspace_id=NEW.workspace_id AND work_id=w.id ORDER BY version DESC LIMIT 1;
 IF pr.lifecycle<>'Active' OR NEW.version<>coalesce(previous.version,0)+1 THEN RAISE EXCEPTION 'Active project and next exact version required' USING ERRCODE='23514'; END IF;
 valid:=CASE NEW.command WHEN 'Submit' THEN previous.version IS NULL AND NEW.version=1 AND NEW.state='Submitted' AND NEW.created_by=w.created_by
 WHEN 'Accept' THEN previous.state='Submitted' AND NEW.state='Accepted'
 WHEN 'Return' THEN previous.state='Submitted' AND NEW.state='Returned'
 WHEN 'Withdraw' THEN previous.state='Submitted' AND NEW.state='Withdrawn' ELSE false END;
 IF NOT coalesce(valid,false) THEN RAISE EXCEPTION 'Invalid work evidence transition' USING ERRCODE='23514'; END IF;
 IF NEW.command IN ('Accept','Return') THEN
  IF NEW.created_by<>w.reviewer_id THEN RAISE EXCEPTION 'Designated reviewer required' USING ERRCODE='23514'; END IF;
 ELSIF NEW.created_by<>pr.coordinator_id AND NEW.created_by<>(brief.content->>'owner_id')::uuid THEN RAISE EXCEPTION 'Owner or coordinator required' USING ERRCODE='23514'; END IF;
 IF NEW.command IN ('Submit','Accept') THEN PERFORM ppo.check_specialist_work_sources(w); END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER specialist_work_event_guard BEFORE INSERT ON ppo.project_specialist_work_events FOR EACH ROW EXECUTE FUNCTION ppo.guard_specialist_work_event();
CREATE FUNCTION ppo.check_specialist_work_initial() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM ppo.project_specialist_work_events WHERE workspace_id=NEW.workspace_id AND work_id=NEW.id AND version=1 AND command='Submit' AND created_by=NEW.created_by)
 THEN RAISE EXCEPTION 'Initial work submission required' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER specialist_work_initial AFTER INSERT ON ppo.project_specialist_work DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_specialist_work_initial();
CREATE FUNCTION ppo.check_specialist_work_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM ppo.operation_receipts r JOIN ppo.audit_events a ON (a.workspace_id,a.actor_id,a.operation_id)=(r.workspace_id,r.actor_id,r.operation_id)
  JOIN ppo.outbox_jobs j ON (j.workspace_id,j.actor_id,j.operation_id)=(r.workspace_id,r.actor_id,r.operation_id)
  JOIN ppo.project_specialist_work w ON (w.workspace_id,w.id)=(NEW.workspace_id,NEW.work_id)
  WHERE r.workspace_id=NEW.workspace_id AND r.actor_id=NEW.created_by AND r.operation_id=NEW.operation_id AND r.record_id=NEW.work_id
   AND r.result->>'record_id'=NEW.work_id::text AND (r.result->>'record_version')::integer=NEW.version AND r.result->>'state'=NEW.state
   AND a.object_type='ProjectSpecialistWorkEvidence' AND a.object_id=NEW.work_id AND a.reason=NEW.reason AND a.outcome='Accepted'
   AND a.details->>'command'='ProjectSpecialistWork:'||NEW.command AND (a.details->>'record_version')::integer=NEW.version AND a.details->>'source_hash'=w.source_hash
   AND j.kind='SharedRecordUpdated' AND j.payload->>'object_type'='ProjectSpecialistWorkEvidence' AND j.payload->>'record_id'=NEW.work_id::text AND (j.payload->>'record_version')::integer=NEW.version)
 THEN RAISE EXCEPTION 'Exact work audit, receipt and outbox required' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER specialist_work_event_evidence AFTER INSERT ON ppo.project_specialist_work_events DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_specialist_work_evidence();
