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
 IF NEW.command IN ('Submit','Accept') AND NOT EXISTS(SELECT 1 FROM ppo.library_documents WHERE workspace_id=w.workspace_id AND id=w.document_id AND state='Current' AND current_revision_id=w.revision_id) THEN RAISE EXCEPTION 'Current exact evidence revision required' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER specialist_work_event_guard BEFORE INSERT ON ppo.project_specialist_work_events FOR EACH ROW EXECUTE FUNCTION ppo.guard_specialist_work_event();
