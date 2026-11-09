-- B2: an append-only claim-schedule extension of the existing commercial basis.
-- No grant, seed, ERP effect, Finance allocation or historical basis rewrite.
CREATE TABLE ppo.project_claim_events (
 workspace_id uuid NOT NULL, basis_id uuid NOT NULL,
 version integer NOT NULL CHECK(version>0),
 command text NOT NULL CHECK(command IN ('Save','Submit','Approve','Return','RecordEvidence')),
 state text NOT NULL CHECK(state IN ('Draft','Submitted','Approved','Returned')),
 schedule_version integer NOT NULL CHECK(schedule_version>0 AND schedule_version<=version),
 milestones jsonb NOT NULL CHECK(jsonb_typeof(milestones)='array' AND jsonb_array_length(milestones) BETWEEN 1 AND 50 AND octet_length(milestones::text)<=131072),
 completion jsonb,
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),
 created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp() CHECK(isfinite(created_at)), operation_id uuid NOT NULL,
 PRIMARY KEY(workspace_id,basis_id,version), UNIQUE(workspace_id,created_by,operation_id),
 FOREIGN KEY(workspace_id,basis_id) REFERENCES ppo.project_commercial_entries(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 CHECK((command='RecordEvidence')=(completion IS NOT NULL)),
 CHECK(completion IS NULL OR (jsonb_typeof(completion)='object' AND octet_length(completion::text)<=8192))
);
CREATE TRIGGER project_claim_immutable BEFORE UPDATE OR DELETE ON ppo.project_claim_events FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.guard_project_claim_event() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE b ppo.project_commercial_entries; pr ppo.projects; bv ppo.project_commercial_events;
 prior ppo.project_claim_events; src ppo.project_commercial_sources; m jsonb; total numeric:=0; valid boolean:=false;
 v ppo.project_commercial_entries; ve ppo.project_commercial_events;
 d ppo.library_documents; r ppo.library_revisions; review ppo.library_reviews; expected_amount numeric;
BEGIN
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 SELECT * INTO STRICT b FROM ppo.project_commercial_entries WHERE workspace_id=NEW.workspace_id AND id=NEW.basis_id;
 SELECT * INTO STRICT pr FROM ppo.projects WHERE workspace_id=b.workspace_id AND id=b.project_id;
 SELECT * INTO bv FROM ppo.project_commercial_events WHERE workspace_id=b.workspace_id AND entry_id=b.id ORDER BY version DESC LIMIT 1;
 SELECT * INTO prior FROM ppo.project_claim_events WHERE workspace_id=b.workspace_id AND basis_id=b.id ORDER BY version DESC LIMIT 1;
 SELECT * INTO STRICT src FROM ppo.project_commercial_sources WHERE workspace_id=b.workspace_id AND basis_id=b.id;
 IF b.kind<>'Basis' OR bv.state IS DISTINCT FROM 'Approved' OR pr.lifecycle<>'Active' OR NEW.version<>coalesce(prior.version,0)+1
 THEN RAISE EXCEPTION 'Approved original basis, Active project and sequential claim version required' USING ERRCODE='23514'; END IF;
 IF NEW.command NOT IN ('Approve','Return') AND NEW.created_by<>pr.coordinator_id AND NEW.created_by<>(bv.content->>'owner_id')::uuid
 THEN RAISE EXCEPTION 'Project coordinator or recorded commercial owner required' USING ERRCODE='23514'; END IF;
 -- Original source drift must not silently authorise new monetary entitlements.
 IF NOT EXISTS(SELECT 1 FROM ppo.draft_quotes q JOIN ppo.draft_quote_revisions qr ON (qr.workspace_id,qr.quote_id)=(q.workspace_id,q.id)
  WHERE qr.workspace_id=b.workspace_id AND qr.id=src.quote_revision_id AND q.current_revision_id=qr.id AND q.version=(src.snapshot->'input'->'quotation'->>'expected_quote_version')::integer)
  OR NOT EXISTS(SELECT 1 FROM ppo.library_documents ld WHERE ld.workspace_id=b.workspace_id AND ld.id=src.document_id AND ld.current_revision_id=src.document_revision_id AND ld.state='Current' AND ld.version=(src.snapshot->'input'->>'document_version')::integer)
  OR NOT EXISTS(SELECT 1 FROM ppo.sales_handovers h JOIN ppo.sales_workflow_events he ON (he.workspace_id,he.record_id)=(h.workspace_id,h.id)
    JOIN ppo.opportunities o ON (o.workspace_id,o.id)=(h.workspace_id,h.opportunity_id)
    WHERE h.workspace_id=b.workspace_id AND h.id=src.handover_id AND h.state='Accepted' AND he.id=src.acceptance_event_id AND h.version=he.version AND h.source_hash=he.source_hash AND o.close_outcome='Won')
  OR (SELECT max(sequence) FROM ppo.quote_response_events WHERE workspace_id=b.workspace_id AND revision_id=src.quote_revision_id)<>(src.snapshot->'input'->'quotation'->>'expected_response_sequence')::integer
  OR EXISTS(SELECT 1 FROM ppo.library_findings f WHERE f.workspace_id=b.workspace_id AND f.revision_id=src.document_revision_id AND
    (f.state<>'Closed' OR NOT EXISTS(SELECT 1 FROM ppo.library_reviews lr,jsonb_array_elements(lr.findings_snapshot) x WHERE lr.workspace_id=b.workspace_id AND lr.id=src.document_review_id AND x->>'id'=f.id::text)))
 THEN RAISE EXCEPTION 'Current exact commercial sources required' USING ERRCODE='23514'; END IF;
 FOR m IN SELECT value FROM jsonb_array_elements(NEW.milestones) LOOP
  IF NOT (m ?& ARRAY['id','title','trigger','amount']) OR (SELECT count(*) FROM jsonb_object_keys(m))<>4
   OR jsonb_typeof(m->'id')<>'string' OR jsonb_typeof(m->'title')<>'string' OR jsonb_typeof(m->'trigger')<>'string' OR jsonb_typeof(m->'amount')<>'string'
   OR length(btrim(m->>'title')) NOT BETWEEN 1 AND 200 OR length(btrim(m->>'trigger')) NOT BETWEEN 1 AND 2000
   OR m->>'amount' !~ '^(0|[1-9][0-9]{0,11})[.][0-9]{2}$' OR (m->>'amount')::numeric<=0
  THEN RAISE EXCEPTION 'Exact positive milestone amounts and bounded text required' USING ERRCODE='23514'; END IF;
  PERFORM (m->>'id')::uuid;
  total:=total+(m->>'amount')::numeric;
 END LOOP;
 IF total<>src.amount OR (SELECT count(DISTINCT (x->>'id')::uuid) FROM jsonb_array_elements(NEW.milestones) x)<>jsonb_array_length(NEW.milestones)
 THEN RAISE EXCEPTION 'Unique milestones must sum to original control value' USING ERRCODE='23514'; END IF;
 IF NEW.command='Save' THEN
  valid:=NEW.state='Draft' AND NEW.schedule_version=NEW.version AND (prior.version IS NULL OR prior.state<>'Submitted');
  IF EXISTS(SELECT 1 FROM ppo.project_claim_events WHERE workspace_id=b.workspace_id AND basis_id=b.id AND command='RecordEvidence')
  THEN RAISE EXCEPTION 'Schedule in use; reconciliation policy required' USING ERRCODE='23514'; END IF;
 ELSE
  IF NEW.milestones IS DISTINCT FROM prior.milestones OR NEW.schedule_version IS DISTINCT FROM prior.schedule_version
  THEN RAISE EXCEPTION 'Retain exact proposed schedule revision' USING ERRCODE='23514'; END IF;
  valid:=CASE NEW.command
   WHEN 'Submit' THEN prior.state IN ('Draft','Returned') AND NEW.state='Submitted'
   WHEN 'Approve' THEN prior.state='Submitted' AND NEW.state='Approved'
   WHEN 'Return' THEN prior.state='Submitted' AND NEW.state='Returned'
   WHEN 'RecordEvidence' THEN prior.state='Approved' AND NEW.state='Approved'
   ELSE false END;
 END IF;
 IF NOT coalesce(valid,false) THEN RAISE EXCEPTION 'Invalid claim schedule transition' USING ERRCODE='23514'; END IF;
 IF NEW.command IN ('Approve','Return') AND EXISTS(SELECT 1 FROM ppo.project_claim_events WHERE workspace_id=b.workspace_id AND basis_id=b.id AND created_by=NEW.created_by AND command IN ('Save','Submit'))
 THEN RAISE EXCEPTION 'Independent schedule reviewer required' USING ERRCODE='23514'; END IF;
 IF NEW.command='RecordEvidence' THEN
  m:=NEW.completion;
  IF NOT (m ?& ARRAY['kind','target_id','target_version','document_id','revision_id','review_id','document_version','occurred_at','explanation','content_hash','amount'])
   OR (SELECT count(*) FROM jsonb_object_keys(m))<>11 OR m->>'kind' NOT IN ('Milestone','Variation')
   OR EXISTS(SELECT 1 FROM jsonb_each(m) x WHERE (x.key IN ('target_version','document_version') AND (jsonb_typeof(x.value)<>'number' OR x.value::text !~ '^[1-9][0-9]*$'))
     OR (x.key NOT IN ('target_version','document_version') AND jsonb_typeof(x.value)<>'string'))
   OR jsonb_typeof(m->'explanation')<>'string' OR length(btrim(m->>'explanation')) NOT BETWEEN 1 AND 2000
   OR NOT isfinite((m->>'occurred_at')::timestamptz) OR (m->>'occurred_at')::timestamptz>clock_timestamp()
  THEN RAISE EXCEPTION 'Bounded completed-work evidence required' USING ERRCODE='23514'; END IF;
  IF m->>'kind'='Milestone' THEN
   SELECT (x->>'amount')::numeric INTO expected_amount FROM jsonb_array_elements(NEW.milestones) x WHERE (x->>'id')::uuid=(m->>'target_id')::uuid;
   IF (m->>'target_version')::integer<>NEW.schedule_version THEN RAISE EXCEPTION 'Exact milestone schedule revision required' USING ERRCODE='23514'; END IF;
  ELSE
   SELECT * INTO v FROM ppo.project_commercial_entries WHERE workspace_id=b.workspace_id AND id=(m->>'target_id')::uuid;
   SELECT * INTO ve FROM ppo.project_commercial_events WHERE workspace_id=b.workspace_id AND entry_id=v.id ORDER BY version DESC LIMIT 1;
   IF v.kind IS DISTINCT FROM 'Variation' OR v.project_id IS DISTINCT FROM pr.id OR v.basis_id IS DISTINCT FROM b.id OR ve.state IS DISTINCT FROM 'Approved' OR ve.version IS DISTINCT FROM (m->>'target_version')::integer
   THEN RAISE EXCEPTION 'Exact same-basis approved variation required' USING ERRCODE='23514'; END IF;
   expected_amount:=(ve.content->>'priced_amount')::numeric;
  END IF;
  IF expected_amount IS NULL OR expected_amount<=0 OR expected_amount IS DISTINCT FROM (m->>'amount')::numeric
  THEN RAISE EXCEPTION 'Retain exact positive entitlement amount' USING ERRCODE='23514'; END IF;
  SELECT * INTO d FROM ppo.library_documents WHERE workspace_id=b.workspace_id AND id=(m->>'document_id')::uuid;
  SELECT * INTO r FROM ppo.library_revisions WHERE workspace_id=b.workspace_id AND document_id=d.id AND id=(m->>'revision_id')::uuid;
  SELECT * INTO review FROM ppo.library_reviews WHERE workspace_id=b.workspace_id AND document_id=d.id AND revision_id=r.id AND id=(m->>'review_id')::uuid;
  IF d.company_id IS DISTINCT FROM pr.company_id OR d.organisation_id IS DISTINCT FROM pr.organisation_id OR (d.site_id IS NOT NULL AND d.site_id IS DISTINCT FROM pr.site_id)
   OR d.state IS DISTINCT FROM 'Current' OR d.current_revision_id IS DISTINCT FROM r.id OR d.version IS DISTINCT FROM (m->>'document_version')::integer
   OR review.outcome IS DISTINCT FROM 'Reviewed' OR review.reviewer_id=r.created_by OR review.reviewer_id=(r.source->>'author_id')::uuid
   OR review.content_hash IS DISTINCT FROM r.source->>'content_hash' OR m->>'content_hash' IS DISTINCT FROM review.content_hash
   OR EXISTS(SELECT 1 FROM ppo.library_findings f WHERE f.workspace_id=b.workspace_id AND f.revision_id=r.id AND (f.state<>'Closed' OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(review.findings_snapshot) x WHERE x->>'id'=f.id::text)))
  THEN RAISE EXCEPTION 'Current same-project independently reviewed document required' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER project_claim_guard BEFORE INSERT ON ppo.project_claim_events FOR EACH ROW EXECUTE FUNCTION ppo.guard_project_claim_event();
CREATE FUNCTION ppo.check_project_claim_receipt() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM ppo.operation_receipts r
  JOIN ppo.audit_events a ON (a.workspace_id,a.actor_id,a.operation_id)=(r.workspace_id,r.actor_id,r.operation_id)
  JOIN ppo.outbox_jobs j ON (j.workspace_id,j.actor_id,j.operation_id)=(r.workspace_id,r.actor_id,r.operation_id)
  WHERE r.workspace_id=NEW.workspace_id AND r.actor_id=NEW.created_by AND r.operation_id=NEW.operation_id AND r.record_id=NEW.basis_id
   AND r.result->>'record_id'=NEW.basis_id::text AND (r.result->>'record_version')::integer=NEW.version AND r.result->>'state'=NEW.state
   AND a.object_type='ProjectCommercialRecord' AND a.object_id=NEW.basis_id AND a.reason=NEW.reason AND a.outcome='Accepted'
   AND a.details->>'command'='ProjectClaims:'||NEW.command AND (a.details->>'record_version')::integer=NEW.version
   AND j.kind='SharedRecordUpdated' AND j.payload->>'object_type'='ProjectCommercialRecord' AND j.payload->>'record_id'=NEW.basis_id::text AND (j.payload->>'record_version')::integer=NEW.version)
 THEN RAISE EXCEPTION 'Exact claim audit, receipt and outbox required' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER project_claim_receipt AFTER INSERT ON ppo.project_claim_events DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_project_claim_receipt();
