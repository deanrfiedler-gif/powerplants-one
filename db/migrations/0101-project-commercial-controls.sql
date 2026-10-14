-- PJ-05 synthetic controls; no seed, grant, historical ledger or source mutation.
SET CONSTRAINTS ppo.identity_target IMMEDIATE;
DO $$ DECLARE spec record; definition text; BEGIN
 FOR spec IN SELECT * FROM (VALUES ('business_identities','ck_identities_type'),('audit_events','ck_audit_object_type')) v(tab,con) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid=('ppo.'||spec.tab)::regclass AND conname=spec.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',spec.tab,spec.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR object_type = ''ProjectCommercialRecord'')',spec.tab,spec.con,substring(definition from 8 for length(definition)-8));
 END LOOP;
 SELECT pg_get_functiondef('ppo.identity_has_typed_record()'::regprocedure) INTO definition;
 IF position('CASE NEW.object_type' in definition)=0 THEN RAISE EXCEPTION 'Inspect changed identity dispatch'; END IF;
 EXECUTE replace(definition,'CASE NEW.object_type','CASE NEW.object_type WHEN ''ProjectCommercialRecord'' THEN ''project_commercial_entries''');
END $$;
SET CONSTRAINTS ppo.identity_target DEFERRED;
DO $$ DECLARE definition text; BEGIN
 SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid='ppo.permission_grants'::regclass AND conname='ck_grants_capability';
 ALTER TABLE ppo.permission_grants DROP CONSTRAINT ck_grants_capability;
 EXECUTE format('ALTER TABLE ppo.permission_grants ADD CONSTRAINT ck_grants_capability CHECK ((%s) OR capability IN (''project.commercial.read'',''project.commercial.prepare'',''project.commercial.review''))',substring(definition from 8 for length(definition)-8));
END $$;

CREATE TABLE ppo.project_commercial_entries (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, project_id uuid NOT NULL,
 kind text NOT NULL CHECK(kind IN ('Basis','Obligation','Notice','Variation')),
 basis_id uuid, predecessor_id uuid, created_by uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,project_id,id),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,project_id) REFERENCES ppo.projects(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,project_id,basis_id) REFERENCES ppo.project_commercial_entries(workspace_id,project_id,id),
 FOREIGN KEY(workspace_id,project_id,predecessor_id) REFERENCES ppo.project_commercial_entries(workspace_id,project_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 CHECK((kind='Basis')=(basis_id IS NULL)), CHECK(predecessor_id IS NULL OR (kind IN ('Notice','Variation') AND predecessor_id<>id))
);
CREATE TRIGGER commercial_identity BEFORE INSERT ON ppo.project_commercial_entries FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('ProjectCommercialRecord','');
CREATE TRIGGER commercial_entry_immutable BEFORE UPDATE OR DELETE ON ppo.project_commercial_entries FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE INDEX commercial_project ON ppo.project_commercial_entries(workspace_id,project_id,id);
CREATE UNIQUE INDEX commercial_notice_successor ON ppo.project_commercial_entries(workspace_id,predecessor_id) WHERE kind='Notice' AND predecessor_id IS NOT NULL;

CREATE TABLE ppo.project_commercial_sources (
 workspace_id uuid NOT NULL, basis_id uuid NOT NULL, handover_id uuid NOT NULL, acceptance_event_id uuid NOT NULL,
 quote_revision_id uuid NOT NULL, issue_id uuid NOT NULL, response_event_id uuid NOT NULL,
 document_id uuid NOT NULL, document_revision_id uuid NOT NULL, document_review_id uuid NOT NULL,
 amount numeric(14,2) NOT NULL, snapshot jsonb NOT NULL CHECK(jsonb_typeof(snapshot)='object' AND octet_length(snapshot::text)<=16384),
 PRIMARY KEY(workspace_id,basis_id),
 FOREIGN KEY(workspace_id,basis_id) REFERENCES ppo.project_commercial_entries(workspace_id,id),
 FOREIGN KEY(workspace_id,handover_id,acceptance_event_id) REFERENCES ppo.sales_delivery_bindings(workspace_id,handover_id,acceptance_event_id),
 FOREIGN KEY(workspace_id,quote_revision_id) REFERENCES ppo.quote_release_bases(workspace_id,revision_id),
 FOREIGN KEY(workspace_id,issue_id) REFERENCES ppo.quote_release_events(workspace_id,id),
 FOREIGN KEY(workspace_id,quote_revision_id,response_event_id) REFERENCES ppo.quote_response_events(workspace_id,revision_id,id),
 FOREIGN KEY(workspace_id,document_id,document_revision_id) REFERENCES ppo.library_revisions(workspace_id,document_id,id),
 FOREIGN KEY(workspace_id,document_review_id) REFERENCES ppo.library_reviews(workspace_id,id)
);
CREATE TRIGGER commercial_source_immutable BEFORE UPDATE OR DELETE ON ppo.project_commercial_sources FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.check_project_commercial_source() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE e ppo.project_commercial_entries; pr ppo.projects; q ppo.draft_quote_revisions; b ppo.quote_release_bases; h ppo.sales_handovers;
 d ppo.library_documents; r ppo.library_revisions; review ppo.library_reviews; response ppo.quote_response_events; issue ppo.quote_release_events; s jsonb;
BEGIN
 SELECT * INTO STRICT e FROM ppo.project_commercial_entries WHERE workspace_id=NEW.workspace_id AND id=NEW.basis_id;
 SELECT * INTO STRICT pr FROM ppo.projects WHERE workspace_id=e.workspace_id AND id=e.project_id;
 SELECT * INTO STRICT q FROM ppo.draft_quote_revisions WHERE workspace_id=e.workspace_id AND id=NEW.quote_revision_id;
 SELECT * INTO STRICT b FROM ppo.quote_release_bases WHERE workspace_id=e.workspace_id AND revision_id=q.id;
 SELECT * INTO STRICT h FROM ppo.sales_handovers WHERE workspace_id=e.workspace_id AND id=NEW.handover_id;
 SELECT * INTO STRICT d FROM ppo.library_documents WHERE workspace_id=e.workspace_id AND id=NEW.document_id;
 SELECT * INTO STRICT r FROM ppo.library_revisions WHERE workspace_id=e.workspace_id AND id=NEW.document_revision_id;
 SELECT * INTO STRICT review FROM ppo.library_reviews WHERE workspace_id=e.workspace_id AND id=NEW.document_review_id;
 SELECT * INTO STRICT response FROM ppo.quote_response_events WHERE workspace_id=e.workspace_id AND id=NEW.response_event_id;
 SELECT * INTO STRICT issue FROM ppo.quote_release_events WHERE workspace_id=e.workspace_id AND id=NEW.issue_id;
 s:=NEW.snapshot->'input';
 IF e.kind<>'Basis' OR q.company_id<>pr.company_id OR h.company_id<>pr.company_id OR h.organisation_id<>pr.organisation_id OR h.site_id IS DISTINCT FROM pr.site_id
  OR h.kind<>'Won' OR NOT EXISTS(SELECT 1 FROM ppo.sales_delivery_bindings x WHERE (x.workspace_id,x.handover_id,x.acceptance_event_id,x.project_id)=(e.workspace_id,h.id,NEW.acceptance_event_id,pr.id))
  OR NOT EXISTS(SELECT 1 FROM ppo.estimates x WHERE x.workspace_id=e.workspace_id AND x.id=q.estimate_id AND x.opportunity_id=h.opportunity_id)
  OR b.basis->'recipient'->>'organisation_id' IS DISTINCT FROM pr.organisation_id::text OR b.basis->'recipient'->>'site_id' IS DISTINCT FROM pr.site_id::text
  OR d.company_id<>pr.company_id OR d.organisation_id<>pr.organisation_id OR (d.site_id IS NOT NULL AND d.site_id<>pr.site_id)
  OR r.document_id<>d.id OR review.revision_id<>r.id OR review.document_id<>d.id OR review.outcome<>'Reviewed'
  OR review.reviewer_id=r.created_by OR review.reviewer_id=(r.source->>'author_id')::uuid OR review.content_hash IS DISTINCT FROM r.source->>'content_hash'
  OR issue.revision_id<>q.id OR issue.action<>'Issue' OR response.issue_id<>issue.id OR response.revision_id<>q.id OR response.report->>'outcome' IS DISTINCT FROM 'Accepted'
  OR q.safe_snapshot->>'currency' IS DISTINCT FROM 'AUD' OR q.safe_snapshot->>'tax_basis' IS DISTINCT FROM 'ExcludingTax'
  OR NEW.amount IS DISTINCT FROM (q.safe_snapshot->>'total')::numeric OR NEW.snapshot->>'amount' IS DISTINCT FROM NEW.amount::text
  OR s->>'handover_id' IS DISTINCT FROM h.id::text OR s->>'acceptance_event_id' IS DISTINCT FROM NEW.acceptance_event_id::text
  OR s->'quotation'->>'revision_id' IS DISTINCT FROM q.id::text OR s->'quotation'->>'issue_id' IS DISTINCT FROM issue.id::text
  OR s->'quotation'->>'response_event_id' IS DISTINCT FROM response.id::text OR s->'quotation'->>'output_hash' IS DISTINCT FROM issue.output_hash
  OR s->>'document_id' IS DISTINCT FROM d.id::text OR s->>'document_revision_id' IS DISTINCT FROM r.id::text OR s->>'document_review_id' IS DISTINCT FROM review.id::text
  OR NEW.snapshot->>'document_hash' IS DISTINCT FROM review.content_hash
 THEN RAISE EXCEPTION 'Exact same-project quotation, receiving and independently reviewed document required' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER commercial_source_guard BEFORE INSERT ON ppo.project_commercial_sources FOR EACH ROW EXECUTE FUNCTION ppo.check_project_commercial_source();

CREATE TABLE ppo.project_commercial_events (
 workspace_id uuid NOT NULL, entry_id uuid NOT NULL, version integer NOT NULL CHECK(version>0),
 command text NOT NULL CHECK(command IN ('Create','Revise','Submit','Decide','Withdraw','Satisfy','Reopen')),
 state text NOT NULL CHECK(state IN ('Draft','Submitted','Approved','Returned','Withdrawn','Open','Satisfied','Waived','RecordedEvidence','Requested','Assessed','Rejected','Disputed')),
 content jsonb NOT NULL CHECK(jsonb_typeof(content)='object' AND octet_length(content::text)<=24576),
 note text NOT NULL CHECK(length(btrim(note)) BETWEEN 1 AND 2000), disputed boolean NOT NULL,
 action_snapshot jsonb NOT NULL CHECK(jsonb_typeof(action_snapshot)='array'),
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),
 created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp() CHECK(isfinite(created_at)), operation_id uuid NOT NULL,
 PRIMARY KEY(workspace_id,entry_id,version), UNIQUE(workspace_id,created_by,operation_id),
 FOREIGN KEY(workspace_id,entry_id) REFERENCES ppo.project_commercial_entries(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 CHECK(content ?& ARRAY['title','detail','clause','owner_id','action_ids','due_date','date_needed','evidence','occurred_at','requested_amount','priced_amount','date_impact']),
 CHECK(length(btrim(content->>'title')) BETWEEN 1 AND 200 AND length(btrim(content->>'detail')) BETWEEN 1 AND 4000 AND length(btrim(content->>'clause')) BETWEEN 1 AND 500),
 CHECK(jsonb_typeof(content->'action_ids')='array' AND jsonb_array_length(content->'action_ids')<=20),
 CHECK((content->'requested_amount'='null'::jsonb OR content->>'requested_amount' ~ '^-?(0|[1-9][0-9]{0,11})[.][0-9]{2}$')
   AND (content->'priced_amount'='null'::jsonb OR content->>'priced_amount' ~ '^-?(0|[1-9][0-9]{0,11})[.][0-9]{2}$'))
);
CREATE TRIGGER commercial_event_immutable BEFORE UPDATE OR DELETE ON ppo.project_commercial_events FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.guard_project_commercial_event() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE e ppo.project_commercial_entries; previous ppo.project_commercial_events; parent ppo.project_commercial_entries; p ppo.projects;
 valid boolean:=false; ids uuid[]; snapshot jsonb; field text; source ppo.project_commercial_sources;
BEGIN
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 SELECT * INTO STRICT e FROM ppo.project_commercial_entries WHERE workspace_id=NEW.workspace_id AND id=NEW.entry_id;
 SELECT * INTO STRICT p FROM ppo.projects WHERE workspace_id=e.workspace_id AND id=e.project_id;
 SELECT * INTO previous FROM ppo.project_commercial_events WHERE workspace_id=e.workspace_id AND entry_id=e.id ORDER BY version DESC LIMIT 1;
 IF p.lifecycle<>'Active' OR NEW.version<>coalesce(previous.version,0)+1 OR NOT EXISTS(SELECT 1 FROM ppo.users WHERE workspace_id=NEW.workspace_id AND id=(NEW.content->>'owner_id')::uuid AND active)
 THEN RAISE EXCEPTION 'Active project, owner and sequential event required' USING ERRCODE='23514'; END IF;
 IF NEW.command<>'Decide' AND NEW.created_by<>p.coordinator_id AND NEW.created_by IS DISTINCT FROM
  (CASE WHEN previous.version IS NOT NULL THEN previous.content->>'owner_id'
   ELSE (SELECT content->>'owner_id' FROM ppo.project_commercial_events WHERE workspace_id=e.workspace_id AND entry_id=e.basis_id ORDER BY version DESC LIMIT 1) END)::uuid
 THEN RAISE EXCEPTION 'Recorded commercial owner or project coordinator required' USING ERRCODE='23514'; END IF;
 IF previous.version IS NULL THEN
  valid:=NEW.command='Create' AND NEW.created_by=e.created_by AND NEW.state=CASE e.kind WHEN 'Basis' THEN 'Draft' WHEN 'Obligation' THEN 'Open' WHEN 'Notice' THEN 'RecordedEvidence' ELSE CASE WHEN NEW.content->'priced_amount'='null'::jsonb THEN 'Requested' ELSE 'Assessed' END END;
 ELSE
  IF NEW.command NOT IN ('Revise') AND NEW.content<>previous.content THEN RAISE EXCEPTION 'Decision must retain exact submitted content' USING ERRCODE='23514'; END IF;
  IF NEW.content->>'owner_id'<>previous.content->>'owner_id' THEN RAISE EXCEPTION 'Owner transfer requires separate control' USING ERRCODE='23514'; END IF;
  valid:=CASE NEW.command
   WHEN 'Revise' THEN
    (e.kind='Basis' AND previous.state IN ('Draft','Returned') AND NEW.state='Draft') OR
    (e.kind='Obligation' AND previous.state='Open' AND NEW.state='Open') OR
    (e.kind='Variation' AND previous.state IN ('Requested','Assessed','Rejected','Disputed') AND NEW.state=CASE WHEN NEW.content->'priced_amount'='null'::jsonb THEN 'Requested' ELSE 'Assessed' END)
   WHEN 'Submit' THEN NEW.state='Submitted' AND ((e.kind='Basis' AND previous.state IN ('Draft','Returned')) OR (e.kind='Obligation' AND previous.state='Open') OR (e.kind='Variation' AND previous.state='Assessed'))
   WHEN 'Decide' THEN previous.state='Submitted' AND ((e.kind='Basis' AND NEW.state IN ('Approved','Returned')) OR (e.kind='Obligation' AND NEW.state IN ('Waived','Open')) OR (e.kind='Variation' AND NEW.state IN ('Approved','Rejected','Disputed')))
   WHEN 'Withdraw' THEN e.kind IN ('Basis','Variation') AND previous.state NOT IN ('Approved','Withdrawn') AND NEW.state='Withdrawn'
   WHEN 'Satisfy' THEN e.kind='Obligation' AND previous.state='Open' AND NEW.state='Satisfied' AND length(btrim(NEW.content->>'evidence'))>0
   WHEN 'Reopen' THEN e.kind='Obligation' AND previous.state IN ('Satisfied','Waived') AND NEW.state='Open'
   ELSE false END;
 END IF;
 IF NOT coalesce(valid,false) THEN RAISE EXCEPTION 'Invalid commercial transition' USING ERRCODE='23514'; END IF;
 IF NEW.command IN ('Create','Revise','Submit','Decide') AND e.kind<>'Notice' THEN
  SELECT * INTO STRICT source FROM ppo.project_commercial_sources WHERE workspace_id=e.workspace_id AND basis_id=coalesce(e.basis_id,e.id);
  IF NOT EXISTS(SELECT 1 FROM ppo.draft_quotes q JOIN ppo.draft_quote_revisions r ON (r.workspace_id,r.quote_id)=(q.workspace_id,q.id)
   WHERE r.workspace_id=e.workspace_id AND r.id=source.quote_revision_id AND q.current_revision_id=r.id AND q.version=(source.snapshot->'input'->'quotation'->>'expected_quote_version')::integer)
   OR NOT EXISTS(SELECT 1 FROM ppo.library_documents d WHERE d.workspace_id=e.workspace_id AND d.id=source.document_id AND d.current_revision_id=source.document_revision_id AND d.state='Current' AND d.version=(source.snapshot->'input'->>'document_version')::integer)
   OR EXISTS(SELECT 1 FROM ppo.library_findings f WHERE f.workspace_id=e.workspace_id AND f.revision_id=source.document_revision_id AND (f.state<>'Closed' OR NOT EXISTS(SELECT 1 FROM ppo.library_reviews r, jsonb_array_elements(r.findings_snapshot) prior WHERE r.workspace_id=e.workspace_id AND r.id=source.document_review_id AND prior->>'id'=f.id::text)))
   OR NOT EXISTS(SELECT 1 FROM ppo.sales_handovers h JOIN ppo.sales_workflow_events v ON (v.workspace_id,v.record_id)=(h.workspace_id,h.id)
    JOIN ppo.opportunities o ON (o.workspace_id,o.id)=(h.workspace_id,h.opportunity_id)
    WHERE h.workspace_id=e.workspace_id AND h.id=source.handover_id AND h.state='Accepted' AND v.id=source.acceptance_event_id AND h.version=v.version AND h.source_hash=v.source_hash AND o.close_outcome='Won')
   OR (SELECT max(sequence) FROM ppo.quote_response_events WHERE workspace_id=e.workspace_id AND revision_id=source.quote_revision_id)<>(source.snapshot->'input'->'quotation'->>'expected_response_sequence')::integer
   OR EXISTS(SELECT 1 FROM ppo.quote_response_events v WHERE v.workspace_id=e.workspace_id AND v.id=source.response_event_id AND nullif(v.report->>'conditions','') IS NOT NULL)
   OR EXISTS(SELECT 1 FROM ppo.quote_response_events v WHERE v.workspace_id=e.workspace_id AND v.revision_id=source.quote_revision_id AND v.report->>'outcome'='Negotiation')
   OR EXISTS(SELECT 1 FROM ppo.quote_response_events v WHERE v.workspace_id=e.workspace_id AND v.revision_id=source.quote_revision_id AND v.report->>'outcome'='Clarification' AND NOT EXISTS(SELECT 1 FROM ppo.quote_response_events x WHERE x.workspace_id=v.workspace_id AND x.response_id=v.id AND x.action IN ('Correct','Confirm')))
  THEN RAISE EXCEPTION 'Current exact commercial sources required for new use' USING ERRCODE='23514'; END IF;
 END IF;
 IF NEW.command='Decide' AND EXISTS(SELECT 1 FROM ppo.project_commercial_events WHERE workspace_id=NEW.workspace_id AND entry_id=NEW.entry_id AND created_by=NEW.created_by AND command IN ('Create','Revise','Submit'))
 THEN RAISE EXCEPTION 'Independent reviewer required' USING ERRCODE='23514'; END IF;
 IF NEW.disputed IS DISTINCT FROM (e.kind='Variation' AND (NEW.state='Disputed' OR (coalesce(previous.disputed,false) AND NEW.state NOT IN ('Approved','Rejected','Withdrawn'))))
 THEN RAISE EXCEPTION 'Retain unresolved dispute evidence' USING ERRCODE='23514'; END IF;
 IF e.basis_id IS NOT NULL THEN
  SELECT * INTO STRICT parent FROM ppo.project_commercial_entries WHERE workspace_id=e.workspace_id AND id=e.basis_id;
  IF parent.kind<>'Basis' OR NOT EXISTS(SELECT 1 FROM ppo.project_commercial_events WHERE workspace_id=e.workspace_id AND entry_id=e.basis_id AND state='Approved')
  THEN RAISE EXCEPTION 'Approved original basis required' USING ERRCODE='23514'; END IF;
 END IF;
 IF e.predecessor_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM ppo.project_commercial_entries x JOIN ppo.project_commercial_events v ON (v.workspace_id,v.entry_id)=(x.workspace_id,x.id)
   WHERE x.workspace_id=e.workspace_id AND x.id=e.predecessor_id AND x.kind=e.kind AND x.basis_id=e.basis_id AND v.state=CASE e.kind WHEN 'Variation' THEN 'Approved' ELSE 'RecordedEvidence' END)
 THEN RAISE EXCEPTION 'Exact same-basis predecessor required' USING ERRCODE='23514'; END IF;
 IF e.kind='Basis' AND NEW.state='Approved' AND EXISTS(SELECT 1 FROM ppo.project_commercial_entries x JOIN ppo.project_commercial_events v ON (v.workspace_id,v.entry_id)=(x.workspace_id,x.id)
  WHERE x.workspace_id=e.workspace_id AND x.project_id=e.project_id AND x.kind='Basis' AND x.id<>e.id AND v.state='Approved')
 THEN RAISE EXCEPTION 'Only one approved original basis per project' USING ERRCODE='23514'; END IF;
 IF e.kind='Notice' AND (NEW.content->>'occurred_at')::timestamptz>clock_timestamp() THEN RAISE EXCEPTION 'Notice occurrence cannot be in future' USING ERRCODE='23514'; END IF;
 IF e.kind='Obligation' AND (NEW.content->>'date_needed')::boolean IS DISTINCT FROM (NEW.content->'due_date'='null'::jsonb) THEN RAISE EXCEPTION 'Explicit date or date-needed required' USING ERRCODE='23514'; END IF;
 SELECT coalesce(array_agg(value::uuid ORDER BY value::uuid),'{}'::uuid[]) INTO ids FROM jsonb_array_elements_text(NEW.content->'action_ids');
 IF cardinality(ids)<>(SELECT count(DISTINCT x) FROM unnest(ids) x) OR (previous.version IS NOT NULL AND NOT ((previous.content->'action_ids') <@ (NEW.content->'action_ids'))) THEN RAISE EXCEPTION 'Unique retained action links required' USING ERRCODE='23514'; END IF;
 IF EXISTS(SELECT 1 FROM unnest(ids) x WHERE NOT EXISTS(SELECT 1 FROM ppo.activities a JOIN ppo.activity_links l ON (l.workspace_id,l.activity_id)=(a.workspace_id,a.id)
   WHERE a.workspace_id=e.workspace_id AND a.id=x AND a.company_id=e.company_id AND a.site_id=p.site_id AND l.object_type='Project' AND l.object_id=p.id AND (NEW.state NOT IN ('Satisfied','Waived') OR a.status IN ('Completed','Cancelled'))))
 THEN RAISE EXCEPTION 'Same-project actions; terminal actions for satisfied/waived obligations' USING ERRCODE='23514'; END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'version',version,'state',status) ORDER BY id),'[]'::jsonb) INTO snapshot FROM ppo.activities WHERE workspace_id=e.workspace_id AND id=ANY(ids);
 IF NEW.action_snapshot<>snapshot THEN RAISE EXCEPTION 'Exact action snapshot required' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER commercial_event_guard BEFORE INSERT ON ppo.project_commercial_events FOR EACH ROW EXECUTE FUNCTION ppo.guard_project_commercial_event();

CREATE FUNCTION ppo.check_project_commercial_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM ppo.operation_receipts r JOIN ppo.audit_events a ON (a.workspace_id,a.actor_id,a.operation_id)=(r.workspace_id,r.actor_id,r.operation_id)
  JOIN ppo.outbox_jobs j ON (j.workspace_id,j.actor_id,j.operation_id)=(r.workspace_id,r.actor_id,r.operation_id)
  WHERE r.workspace_id=NEW.workspace_id AND r.actor_id=NEW.created_by AND r.operation_id=NEW.operation_id AND r.record_id=NEW.entry_id
   AND r.result->>'record_id'=NEW.entry_id::text AND (r.result->>'record_version')::integer=NEW.version AND r.result->>'state'=NEW.state
   AND a.object_type='ProjectCommercialRecord' AND a.object_id=NEW.entry_id AND a.reason=NEW.reason AND a.outcome='Accepted'
   AND a.details->>'command'='Commercial:'||NEW.command AND (a.details->>'record_version')::integer=NEW.version
   AND j.kind='SharedRecordUpdated' AND j.payload->>'object_type'='ProjectCommercialRecord' AND j.payload->>'record_id'=NEW.entry_id::text AND (j.payload->>'record_version')::integer=NEW.version)
 THEN RAISE EXCEPTION 'Exact commercial audit, receipt and outbox required' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER commercial_event_evidence AFTER INSERT ON ppo.project_commercial_events DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_project_commercial_evidence();
CREATE FUNCTION ppo.check_project_commercial_initial() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM ppo.project_commercial_events WHERE workspace_id=NEW.workspace_id AND entry_id=NEW.id AND version=1 AND command='Create')
  OR (NEW.kind='Basis' AND NOT EXISTS(SELECT 1 FROM ppo.project_commercial_sources WHERE workspace_id=NEW.workspace_id AND basis_id=NEW.id))
 THEN RAISE EXCEPTION 'Initial event and original source required' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER commercial_initial AFTER INSERT ON ppo.project_commercial_entries DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_project_commercial_initial();
