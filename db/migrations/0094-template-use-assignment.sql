-- R4: exact site-scoped OUT-09 use, with immutable intervals and explicit succession.
SET CONSTRAINTS ppo.identity_target IMMEDIATE;
DO $$ DECLARE spec record; definition text; BEGIN
 FOR spec IN SELECT * FROM (VALUES
  ('business_identities','ck_identities_type','object_type','TemplateUseAssignment'),
  ('audit_events','ck_audit_object_type','object_type','TemplateUseAssignment'),
  ('permission_grants','ck_grants_capability','capability','template.assign'),
  ('outbox_jobs','ck_outbox_kind','kind','TemplateUseAssigned')
 ) v(tab,con,col,added) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid=('ppo.'||spec.tab)::regclass AND conname=spec.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',spec.tab,spec.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR %I = ANY(%L::text[]))',spec.tab,spec.con,substring(definition from 8 for length(definition)-8),spec.col,string_to_array(spec.added,','));
 END LOOP;
 SELECT pg_get_functiondef('ppo.identity_has_typed_record()'::regprocedure) INTO definition;
 IF position('CASE NEW.object_type' in definition)=0 THEN RAISE EXCEPTION 'Inspect changed identity dispatch'; END IF;
 EXECUTE replace(definition,'CASE NEW.object_type','CASE NEW.object_type WHEN ''TemplateUseAssignment'' THEN ''template_use_assignments''');
END $$;
SET CONSTRAINTS ppo.identity_target DEFERRED;

CREATE TABLE ppo.template_use_policies (
 workspace_id uuid NOT NULL, company_id uuid NOT NULL, site_id uuid NOT NULL, version integer NOT NULL CHECK(version>0),
 baseline_template_id uuid NOT NULL, baseline_policy_version integer NOT NULL CHECK(baseline_policy_version>0), baseline_hash text NOT NULL,
 PRIMARY KEY(workspace_id,company_id,site_id),
 FOREIGN KEY(workspace_id,company_id,site_id) REFERENCES ppo.sites(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,baseline_template_id) REFERENCES ppo.pack_templates(workspace_id,id)
);
CREATE TABLE ppo.template_use_assignments (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, site_id uuid NOT NULL,
 policy_version integer NOT NULL CHECK(policy_version>0), publication_id uuid NOT NULL, template_id uuid NOT NULL, definition_hash text NOT NULL,
 effective_from timestamptz NOT NULL CHECK(isfinite(effective_from)), effective_to timestamptz CHECK(isfinite(effective_to) AND effective_to>effective_from),
 predecessor_id uuid, actor_id uuid NOT NULL, operation_id uuid NOT NULL, reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),
 approval_note text NOT NULL CHECK(length(btrim(approval_note)) BETWEEN 1 AND 2000), command_hash text NOT NULL CHECK(command_hash ~ '^[a-f0-9]{64}$'),
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,site_id,policy_version), UNIQUE(workspace_id,predecessor_id), UNIQUE(workspace_id,actor_id,operation_id),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id) REFERENCES ppo.template_use_policies(workspace_id,company_id,site_id),
 FOREIGN KEY(workspace_id,publication_id) REFERENCES ppo.template_publications(workspace_id,id),
 FOREIGN KEY(workspace_id,template_id) REFERENCES ppo.pack_templates(workspace_id,id),
 FOREIGN KEY(workspace_id,predecessor_id) REFERENCES ppo.template_use_assignments(workspace_id,id),
 FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER template_use_identity BEFORE INSERT ON ppo.template_use_assignments FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('TemplateUseAssignment','');
CREATE TRIGGER template_use_retained BEFORE UPDATE OR DELETE ON ppo.template_use_assignments FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE VIEW ppo.template_use_intervals AS
 SELECT a.*,coalesce(s.effective_from,a.effective_to) AS resolved_effective_to,s.id AS successor_id
 FROM ppo.template_use_assignments a LEFT JOIN ppo.template_use_assignments s ON (s.workspace_id,s.predecessor_id)=(a.workspace_id,a.id);

CREATE FUNCTION ppo.template_use_policy_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Retain template use policy' USING ERRCODE='23514'; END IF;
 IF TG_OP='INSERT' THEN
  IF NEW.version<>1 OR NOT EXISTS(SELECT 1 FROM ppo.pack_policy p JOIN ppo.pack_templates t ON (t.workspace_id,t.id)=(p.workspace_id,p.template_id)
   WHERE p.workspace_id=NEW.workspace_id AND p.version=NEW.baseline_policy_version AND t.id=NEW.baseline_template_id AND t.content_hash=NEW.baseline_hash)
  THEN RAISE EXCEPTION 'Exact current baseline required' USING ERRCODE='23514'; END IF;
 ELSE
  IF NEW.version<>OLD.version+1 OR (to_jsonb(NEW)-'version') IS DISTINCT FROM (to_jsonb(OLD)-'version')
  THEN RAISE EXCEPTION 'Retain scope and baseline; advance exact policy version' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER template_use_policy_guard BEFORE INSERT OR UPDATE OR DELETE ON ppo.template_use_policies FOR EACH ROW EXECUTE FUNCTION ppo.template_use_policy_guard();
CREATE FUNCTION ppo.template_use_validate() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE predecessor ppo.template_use_assignments;
BEGIN
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 IF NEW.effective_from<transaction_timestamp() OR NOT EXISTS(SELECT 1 FROM ppo.template_use_policies h WHERE (h.workspace_id,h.company_id,h.site_id,h.version)=(NEW.workspace_id,NEW.company_id,NEW.site_id,NEW.policy_version))
 OR NOT EXISTS(SELECT 1 FROM ppo.template_publications pub JOIN ppo.template_proposals d ON (d.workspace_id,d.id)=(pub.workspace_id,pub.proposal_id)
  WHERE (pub.workspace_id,pub.id,pub.template_id,pub.definition_hash)=(NEW.workspace_id,NEW.publication_id,NEW.template_id,NEW.definition_hash)
  AND (d.company_id,d.site_id,d.family)=(NEW.company_id,NEW.site_id,'OUT-09'))
 THEN RAISE EXCEPTION 'Exact current scoped publication and prospective interval required' USING ERRCODE='23514'; END IF;
 IF NEW.predecessor_id IS NOT NULL THEN
  SELECT * INTO STRICT predecessor FROM ppo.template_use_assignments WHERE workspace_id=NEW.workspace_id AND id=NEW.predecessor_id;
  IF (predecessor.company_id,predecessor.site_id) IS DISTINCT FROM (NEW.company_id,NEW.site_id)
   OR predecessor.effective_to IS NOT NULL OR predecessor.effective_from>=NEW.effective_from OR predecessor.policy_version>=NEW.policy_version
  THEN RAISE EXCEPTION 'Name the exact open earlier predecessor in this scope' USING ERRCODE='23514'; END IF;
 END IF;
 IF EXISTS(SELECT 1 FROM ppo.template_use_intervals a WHERE (a.workspace_id,a.company_id,a.site_id)=(NEW.workspace_id,NEW.company_id,NEW.site_id)
  AND tstzrange(a.effective_from,CASE WHEN a.id=NEW.predecessor_id THEN NEW.effective_from ELSE a.resolved_effective_to END,'[)') && tstzrange(NEW.effective_from,NEW.effective_to,'[)'))
 THEN RAISE EXCEPTION 'Ambiguous overlapping template use' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER template_use_validate BEFORE INSERT ON ppo.template_use_assignments FOR EACH ROW EXECUTE FUNCTION ppo.template_use_validate();

CREATE FUNCTION ppo.template_use_policy_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM ppo.template_use_policies h JOIN ppo.template_use_assignments a USING(workspace_id,company_id,site_id)
  WHERE (h.workspace_id,h.company_id,h.site_id)=(NEW.workspace_id,NEW.company_id,NEW.site_id)
  GROUP BY h.version HAVING count(*)=h.version AND max(a.policy_version)=h.version)
 THEN RAISE EXCEPTION 'Exact complete policy assignment ledger required' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER template_use_policy_evidence AFTER INSERT OR UPDATE ON ppo.template_use_policies DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.template_use_policy_evidence();
CREATE FUNCTION ppo.template_use_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM ppo.audit_events a JOIN ppo.operation_receipts r ON (r.workspace_id,r.actor_id,r.operation_id)=(a.workspace_id,a.actor_id,a.operation_id)
  JOIN ppo.outbox_jobs o ON (o.workspace_id,o.actor_id,o.operation_id)=(a.workspace_id,a.actor_id,a.operation_id)
  WHERE (a.workspace_id,a.actor_id,a.operation_id)=(NEW.workspace_id,NEW.actor_id,NEW.operation_id)
  AND a.object_type='TemplateUseAssignment' AND a.object_id=NEW.id AND a.outcome='Accepted' AND a.reason=NEW.reason
  AND a.details->>'command'='Template:AssignUse' AND a.details->>'publication_id'=NEW.publication_id::text AND a.details->>'definition_hash'=NEW.definition_hash
  AND r.record_id=NEW.id AND r.payload_hash=NEW.command_hash AND r.result->>'record_version'=NEW.policy_version::text AND r.result->>'state'='Assigned'
  AND o.kind='TemplateUseAssigned' AND o.payload->>'record_id'=NEW.id::text AND o.payload->>'record_version'=NEW.policy_version::text AND o.payload->>'object_type'='TemplateUseAssignment')
 THEN RAISE EXCEPTION 'Exact assignment operation graph required' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER template_use_evidence AFTER INSERT ON ppo.template_use_assignments DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.template_use_evidence();

-- Recheck at the actual reservation/issue statement, including a boundary crossed
-- while the worker verified durable bytes. The original evidence is never changed.
CREATE FUNCTION ppo.template_use_render_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE s jsonb; scope record; h ppo.template_use_policies; a ppo.template_use_assignments; ids uuid[]; at_time timestamptz; first_time timestamptz; legacy record;
BEGIN
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 SELECT ap.company_id,ap.site_id INTO STRICT scope FROM ppo.packs p JOIN ppo.appointments ap ON (ap.workspace_id,ap.id)=(p.workspace_id,p.appointment_id) WHERE p.workspace_id=NEW.workspace_id AND p.id=NEW.pack_id;
 SELECT * INTO h FROM ppo.template_use_policies WHERE (workspace_id,company_id,site_id)=(NEW.workspace_id,scope.company_id,scope.site_id);
 IF NOT FOUND THEN RETURN NEW; END IF;
 IF TG_TABLE_NAME='pack_render_jobs' THEN s:=NEW.render_snapshot->'source'->'template';
 ELSE SELECT snapshot->'template' INTO STRICT s FROM ppo.pack_revisions WHERE workspace_id=NEW.workspace_id AND id=NEW.revision_id; END IF;
 at_time:=clock_timestamp();
 SELECT array_agg(id) INTO ids FROM ppo.template_use_intervals WHERE (workspace_id,company_id,site_id)=(NEW.workspace_id,scope.company_id,scope.site_id)
  AND effective_from<=at_time AND (resolved_effective_to IS NULL OR at_time<resolved_effective_to);
 IF cardinality(ids)=1 THEN
  SELECT * INTO STRICT a FROM ppo.template_use_assignments WHERE id=ids[1];
  IF (s->>'id',s->>'hash',s->>'policy_version',s->>'use_assignment_id') IS NOT DISTINCT FROM (a.template_id::text,a.definition_hash,a.policy_version::text,a.id::text) THEN RETURN NEW; END IF;
 ELSIF ids IS NULL THEN
  SELECT min(effective_from) INTO first_time FROM ppo.template_use_assignments WHERE (workspace_id,company_id,site_id)=(NEW.workspace_id,scope.company_id,scope.site_id);
  IF at_time<first_time THEN
   SELECT p.template_id,p.version,t.content_hash INTO STRICT legacy FROM ppo.pack_policy p JOIN ppo.pack_templates t ON (t.workspace_id,t.id)=(p.workspace_id,p.template_id) WHERE p.workspace_id=NEW.workspace_id;
   IF (legacy.template_id,legacy.version,legacy.content_hash) IS NOT DISTINCT FROM (h.baseline_template_id,h.baseline_policy_version,h.baseline_hash)
    AND (s->>'id',s->>'hash',s->>'policy_version',s->>'use_assignment_id') IS NOT DISTINCT FROM (h.baseline_template_id::text,h.baseline_hash,h.baseline_policy_version::text,NULL::text) THEN RETURN NEW; END IF;
  END IF;
 END IF;
 RAISE EXCEPTION 'Template use changed at reservation or issue; retain original output for review' USING ERRCODE='23514',CONSTRAINT='template_use_current';
END $$;
CREATE TRIGGER template_use_render_guard BEFORE INSERT ON ppo.pack_render_jobs FOR EACH ROW EXECUTE FUNCTION ppo.template_use_render_guard();
CREATE TRIGGER template_use_issue_guard BEFORE INSERT ON ppo.pack_issues FOR EACH ROW EXECUTE FUNCTION ppo.template_use_render_guard();
