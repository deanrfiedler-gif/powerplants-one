-- Existing E1 revisions/jobs/bytes remain unchanged. New release facts are subordinate.
ALTER TABLE ppo.draft_quote_revisions DROP CONSTRAINT draft_quote_revisions_template_version_check;
ALTER TABLE ppo.draft_quote_revisions ADD CONSTRAINT draft_quote_revisions_template_version_check
 CHECK(template_version IN ('PPO-E1-DRAFT-r01','PPO-SYN-RELEASE-r01'));
DO $$ DECLARE spec record; definition text; BEGIN
 FOR spec IN SELECT * FROM (VALUES
  ('outbox_jobs','ck_outbox_kind','kind','QuotationReleaseRecorded'),
  ('permission_grants','ck_grants_capability','capability','estimating.quote.approve,estimating.quote.issue,estimating.quote.distribute')
 ) v(tab,con,col,added) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid=('ppo.'||spec.tab)::regclass AND conname=spec.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',spec.tab,spec.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR %I = ANY(%L::text[]))',spec.tab,spec.con,substring(definition from 8 for length(definition)-8),spec.col,string_to_array(spec.added,','));
 END LOOP;
END $$;

CREATE TABLE ppo.quote_release_bases (
 revision_id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, quote_id uuid NOT NULL,
 source_revision_id uuid NOT NULL, predecessor_issue_id uuid,
 basis jsonb NOT NULL CHECK(jsonb_typeof(basis)='object' AND basis->>'policy_id' IS NOT DISTINCT FROM 'SYN-ES05-01'),
 basis_hash text NOT NULL CHECK(basis_hash ~ '^[a-f0-9]{64}$'),
 created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(), operation_id uuid NOT NULL,
 UNIQUE(workspace_id,revision_id), UNIQUE(workspace_id,quote_id,revision_id), UNIQUE(workspace_id,created_by,operation_id),
 FOREIGN KEY(workspace_id,company_id,revision_id) REFERENCES ppo.draft_quote_revisions(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,quote_id,revision_id) REFERENCES ppo.draft_quote_revisions(workspace_id,quote_id,id),
 FOREIGN KEY(workspace_id,quote_id,source_revision_id) REFERENCES ppo.draft_quote_revisions(workspace_id,quote_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 CHECK(revision_id<>source_revision_id), CHECK(octet_length(basis::text)<=65536)
);
CREATE TABLE ppo.quote_release_events (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, quote_id uuid NOT NULL, revision_id uuid NOT NULL,
 sequence integer NOT NULL CHECK(sequence>0), action text NOT NULL CHECK(action IN ('Prepare','Approval','Issue','Distribution')),
 outcome text NOT NULL CHECK(outcome IN ('Prepared','Approved','Returned','Issued','Unknown','SimulatedDelivered','SimulatedFailed')),
 approval_id uuid, issue_id uuid, attempt_id uuid, resolves_event_id uuid,
 output_hash text CHECK(output_hash ~ '^[a-f0-9]{64}$'), manifest jsonb,
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),
 created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(), operation_id uuid NOT NULL,
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,quote_id,id), UNIQUE(workspace_id,quote_id,sequence), UNIQUE(workspace_id,created_by,operation_id),
 FOREIGN KEY(workspace_id,quote_id,revision_id) REFERENCES ppo.quote_release_bases(workspace_id,quote_id,revision_id),
 FOREIGN KEY(workspace_id,quote_id,approval_id) REFERENCES ppo.quote_release_events(workspace_id,quote_id,id),
 FOREIGN KEY(workspace_id,quote_id,issue_id) REFERENCES ppo.quote_release_events(workspace_id,quote_id,id),
 FOREIGN KEY(workspace_id,quote_id,resolves_event_id) REFERENCES ppo.quote_release_events(workspace_id,quote_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 CHECK((action='Prepare' AND outcome='Prepared' AND manifest IS NULL AND output_hash IS NULL AND approval_id IS NULL AND issue_id IS NULL AND attempt_id IS NULL AND resolves_event_id IS NULL)
  OR (action='Approval' AND outcome IN ('Approved','Returned') AND manifest IS NOT NULL AND output_hash IS NOT NULL AND approval_id IS NULL AND issue_id IS NULL AND attempt_id IS NULL AND resolves_event_id IS NULL)
  OR (action='Issue' AND outcome='Issued' AND manifest IS NOT NULL AND output_hash IS NOT NULL AND approval_id IS NOT NULL AND issue_id IS NULL AND attempt_id IS NULL AND resolves_event_id IS NULL)
  OR (action='Distribution' AND outcome IN ('Unknown','SimulatedDelivered','SimulatedFailed') AND manifest IS NULL AND output_hash IS NULL AND approval_id IS NULL AND issue_id IS NOT NULL AND attempt_id IS NOT NULL))
);
ALTER TABLE ppo.quote_release_bases ADD CONSTRAINT release_predecessor_issue FOREIGN KEY(workspace_id,quote_id,predecessor_issue_id) REFERENCES ppo.quote_release_events(workspace_id,quote_id,id);
CREATE UNIQUE INDEX quote_release_one_action ON ppo.quote_release_events(workspace_id,revision_id,action) WHERE action<>'Distribution';
CREATE UNIQUE INDEX quote_release_distribution_attempt ON ppo.quote_release_events(workspace_id,attempt_id) WHERE action='Distribution' AND resolves_event_id IS NULL;
CREATE TRIGGER immutable_quote_release_basis BEFORE UPDATE OR DELETE ON ppo.quote_release_bases FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TRIGGER immutable_quote_release_event BEFORE UPDATE OR DELETE ON ppo.quote_release_events FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

CREATE FUNCTION ppo.quote_release_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE q ppo.draft_quote_revisions; h ppo.draft_quotes; b ppo.quote_release_bases; a ppo.quote_release_events; previous ppo.quote_release_events; owner uuid; seq integer;
BEGIN
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 SELECT * INTO STRICT q FROM ppo.draft_quote_revisions WHERE workspace_id=NEW.workspace_id AND id=NEW.revision_id;
 SELECT * INTO STRICT h FROM ppo.draft_quotes WHERE workspace_id=NEW.workspace_id AND id=NEW.quote_id;
 IF TG_TABLE_NAME='quote_release_bases' THEN
  IF q.template_version<>'PPO-SYN-RELEASE-r01' OR q.created_by<>NEW.created_by OR h.current_revision_id<>q.id OR NOT EXISTS(SELECT 1 FROM ppo.draft_quote_revisions s WHERE s.workspace_id=NEW.workspace_id AND s.id=NEW.source_revision_id AND s.version=q.version-1 AND s.estimate_version_id=q.estimate_version_id) THEN RAISE EXCEPTION 'Exact successor release preparation required' USING ERRCODE='23514'; END IF;
  IF NEW.predecessor_issue_id IS DISTINCT FROM (SELECT id FROM ppo.quote_release_events WHERE workspace_id=NEW.workspace_id AND quote_id=NEW.quote_id AND action='Issue' ORDER BY sequence DESC LIMIT 1) THEN RAISE EXCEPTION 'Retain the preceding exact issue' USING ERRCODE='23514'; END IF;
  RETURN NEW;
 END IF;
 SELECT * INTO STRICT b FROM ppo.quote_release_bases WHERE workspace_id=NEW.workspace_id AND revision_id=NEW.revision_id;
 SELECT coalesce(max(sequence),0) INTO seq FROM ppo.quote_release_events WHERE workspace_id=NEW.workspace_id AND quote_id=NEW.quote_id;
 IF NEW.sequence<>seq+1 OR (NEW.action<>'Distribution' AND h.current_revision_id<>q.id) THEN RAISE EXCEPTION 'Current exact release and next event required' USING ERRCODE='23514'; END IF;
 SELECT owner_id INTO STRICT owner FROM ppo.estimates WHERE workspace_id=q.workspace_id AND id=q.estimate_id;
 IF NEW.action='Prepare' AND (NEW.created_by<>b.created_by OR NEW.operation_id<>b.operation_id) THEN RAISE EXCEPTION 'Original preparation required' USING ERRCODE='23514'; END IF;
 IF NEW.action='Approval' THEN
  IF NEW.created_by IN (b.created_by,owner) OR NEW.manifest IS DISTINCT FROM (SELECT manifest FROM ppo.estimate_quote_jobs WHERE revision_id=q.id AND state='Ready') THEN RAISE EXCEPTION 'Independent approval of exact ready output required' USING ERRCODE='23514'; END IF;
 END IF;
 IF NEW.action='Issue' THEN
  SELECT * INTO STRICT a FROM ppo.quote_release_events WHERE workspace_id=NEW.workspace_id AND id=NEW.approval_id;
  IF a.action<>'Approval' OR a.outcome<>'Approved' OR a.revision_id<>q.id OR NEW.created_by IN (b.created_by,owner,a.created_by) OR NEW.output_hash<>a.output_hash OR NEW.manifest IS DISTINCT FROM a.manifest THEN RAISE EXCEPTION 'Independent issue of exact approved output required' USING ERRCODE='23514'; END IF;
  IF b.predecessor_issue_id IS DISTINCT FROM (SELECT id FROM ppo.quote_release_events WHERE workspace_id=NEW.workspace_id AND quote_id=NEW.quote_id AND action='Issue' ORDER BY sequence DESC LIMIT 1) THEN RAISE EXCEPTION 'Issue predecessor changed' USING ERRCODE='23514'; END IF;
 END IF;
 IF NEW.action='Distribution' THEN
  SELECT * INTO STRICT a FROM ppo.quote_release_events WHERE workspace_id=NEW.workspace_id AND id=NEW.issue_id;
  IF a.action<>'Issue' OR a.revision_id<>q.id THEN RAISE EXCEPTION 'Distribution refers to the exact issue' USING ERRCODE='23514'; END IF;
  SELECT * INTO previous FROM ppo.quote_release_events WHERE workspace_id=NEW.workspace_id AND issue_id=a.id ORDER BY sequence DESC LIMIT 1;
  IF NEW.resolves_event_id IS NOT NULL THEN
   IF previous.id IS DISTINCT FROM NEW.resolves_event_id OR previous.attempt_id<>NEW.attempt_id THEN RAISE EXCEPTION 'Resolve the exact most recent attempt' USING ERRCODE='23514'; END IF;
  ELSIF previous.id IS NOT NULL AND (previous.outcome<>'SimulatedFailed' OR previous.attempt_id=NEW.attempt_id) THEN RAISE EXCEPTION 'Recover or resolve the prior distribution before another attempt' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER quote_release_basis_guard BEFORE INSERT ON ppo.quote_release_bases FOR EACH ROW EXECUTE FUNCTION ppo.quote_release_guard();
CREATE TRIGGER quote_release_event_guard BEFORE INSERT ON ppo.quote_release_events FOR EACH ROW EXECUTE FUNCTION ppo.quote_release_guard();
CREATE FUNCTION ppo.quote_release_evidence() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM ppo.audit_events a JOIN ppo.operation_receipts r ON (r.workspace_id,r.actor_id,r.operation_id)=(a.workspace_id,a.actor_id,a.operation_id)
  JOIN ppo.outbox_jobs j ON (j.workspace_id,j.actor_id,j.operation_id)=(a.workspace_id,a.actor_id,a.operation_id)
  WHERE a.workspace_id=NEW.workspace_id AND a.actor_id=NEW.created_by AND a.operation_id=NEW.operation_id AND a.object_type='DraftQuoteRevision' AND a.object_id=NEW.revision_id
   AND a.details->>'release_event_id'=NEW.id::text AND a.reason=NEW.reason AND r.record_id=NEW.revision_id AND (r.result->>'record_version')::integer=NEW.sequence AND r.result->>'state'=NEW.outcome AND j.kind='QuotationReleaseRecorded')
 THEN RAISE EXCEPTION 'Release event requires original atomic audit receipt and outbox' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER quote_release_evidence AFTER INSERT ON ppo.quote_release_events DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.quote_release_evidence();
CREATE FUNCTION ppo.quote_release_basis_evidence() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM ppo.quote_release_events e WHERE e.workspace_id=NEW.workspace_id AND e.revision_id=NEW.revision_id AND e.action='Prepare' AND e.operation_id=NEW.operation_id) THEN RAISE EXCEPTION 'Release basis requires its exact preparation event' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER quote_release_basis_evidence AFTER INSERT ON ppo.quote_release_bases DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.quote_release_basis_evidence();

