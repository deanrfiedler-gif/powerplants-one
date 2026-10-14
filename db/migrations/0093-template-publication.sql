-- R3: supported OUT-09 publication, separate from any policy assignment.
SET CONSTRAINTS ppo.identity_target IMMEDIATE;
DO $$ DECLARE spec record; definition text; BEGIN
 FOR spec IN SELECT * FROM (VALUES
  ('business_identities','ck_identities_type','object_type','TemplatePublication'),
  ('audit_events','ck_audit_object_type','object_type','TemplatePublication'),
  ('permission_grants','ck_grants_capability','capability','template.publish')
 ) v(tab,con,col,added) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid=('ppo.'||spec.tab)::regclass AND conname=spec.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',spec.tab,spec.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR %I = ANY(%L::text[]))',spec.tab,spec.con,substring(definition from 8 for length(definition)-8),spec.col,string_to_array(spec.added,','));
 END LOOP;
 SELECT pg_get_functiondef('ppo.identity_has_typed_record()'::regprocedure) INTO definition;
 IF position('CASE NEW.object_type' in definition)=0 THEN RAISE EXCEPTION 'Inspect changed identity dispatch'; END IF;
 EXECUTE replace(definition,'CASE NEW.object_type','CASE NEW.object_type WHEN ''TemplatePublication'' THEN ''template_publications''');
END $$;
SET CONSTRAINTS ppo.identity_target DEFERRED;
CREATE TABLE ppo.template_publications (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, proposal_id uuid NOT NULL, revision_id uuid NOT NULL, review_id uuid NOT NULL,
 proposal_version integer NOT NULL CHECK(proposal_version>1), template_id uuid NOT NULL, runtime_version integer NOT NULL CHECK(runtime_version>=3),
 definition text NOT NULL, definition_hash text NOT NULL CHECK(definition_hash=encode(sha256(convert_to(definition,'UTF8')),'hex')),
 publisher_id uuid NOT NULL, operation_id uuid NOT NULL, reason text NOT NULL CHECK(length(reason) BETWEEN 1 AND 1000),
 approval_note text NOT NULL CHECK(length(btrim(approval_note)) BETWEEN 1 AND 2000),
 command_hash text NOT NULL CHECK(command_hash ~ '^[a-f0-9]{64}$'), proposal_snapshot jsonb NOT NULL, review_snapshot jsonb NOT NULL,
 published_at timestamptz NOT NULL DEFAULT clock_timestamp(), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,revision_id), UNIQUE(workspace_id,template_id), UNIQUE(workspace_id,publisher_id,operation_id),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,proposal_id,revision_id) REFERENCES ppo.template_proposal_revisions(workspace_id,proposal_id,id),
 FOREIGN KEY(workspace_id,review_id) REFERENCES ppo.template_proposal_reviews(workspace_id,id),
 FOREIGN KEY(workspace_id,template_id) REFERENCES ppo.pack_templates(workspace_id,id),
 FOREIGN KEY(workspace_id,publisher_id) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER template_publication_identity BEFORE INSERT ON ppo.template_publications FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('TemplatePublication','');
CREATE TRIGGER template_publication_retained BEFORE UPDATE OR DELETE ON ppo.template_publications FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE INDEX template_publication_proposal ON ppo.template_publications(workspace_id,proposal_id,id);

CREATE FUNCTION ppo.template_publication_validate() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE d ppo.template_proposals; r ppo.template_proposal_revisions; v ppo.template_proposal_reviews; t ppo.pack_templates; b jsonb;
BEGIN
 SELECT * INTO STRICT d FROM ppo.template_proposals WHERE workspace_id=NEW.workspace_id AND id=NEW.proposal_id;
 SELECT * INTO STRICT r FROM ppo.template_proposal_revisions WHERE workspace_id=NEW.workspace_id AND id=NEW.revision_id;
 SELECT * INTO STRICT v FROM ppo.template_proposal_reviews WHERE workspace_id=NEW.workspace_id AND id=NEW.review_id;
 SELECT * INTO STRICT t FROM ppo.pack_templates WHERE workspace_id=NEW.workspace_id AND id=NEW.template_id;
 b:=NEW.definition::jsonb;
 IF d.family<>'OUT-09' OR d.state<>'Reviewed' OR d.version<>NEW.proposal_version OR d.current_revision_id<>r.id
  OR v.proposal_id<>d.id OR v.revision_id<>r.id OR v.proposal_version<>d.version OR v.outcome<>'Reviewed' OR v.content_hash<>r.content_hash
  OR NEW.proposal_snapshot IS DISTINCT FROM to_jsonb(d) OR NEW.review_snapshot IS DISTINCT FROM to_jsonb(v)
  OR EXISTS(SELECT 1 FROM ppo.template_proposal_revisions WHERE workspace_id=NEW.workspace_id AND proposal_id=d.id AND created_by=NEW.publisher_id)
  OR t.version<>NEW.runtime_version OR t.definition<>NEW.definition OR t.content_hash<>NEW.definition_hash
  OR NOT coalesce(b->>'family'='OUT-09' AND b->'version'=to_jsonb(NEW.runtime_version) AND b->'schema_version'='1'::jsonb
   AND b->>'renderer'='DK06-OUT09-1' AND b->>'renderer_version'=t.renderer_version AND b->'body'=r.body
   AND b->'origin'=jsonb_build_object('proposal_id',d.id,'revision_id',r.id,'content_hash',r.content_hash)
   AND jsonb_typeof(b->'sources')='array' AND jsonb_array_length(b->'sources')>0,false)
 THEN RAISE EXCEPTION 'Independent exact reviewed supported publication required' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER template_publication_validate BEFORE INSERT ON ppo.template_publications FOR EACH ROW EXECUTE FUNCTION ppo.template_publication_validate();

CREATE FUNCTION ppo.template_publication_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM ppo.audit_events a JOIN ppo.operation_receipts r ON (r.workspace_id,r.actor_id,r.operation_id)=(a.workspace_id,a.actor_id,a.operation_id)
  JOIN ppo.outbox_jobs o ON (o.workspace_id,o.actor_id,o.operation_id)=(a.workspace_id,a.actor_id,a.operation_id)
  WHERE (a.workspace_id,a.actor_id,a.operation_id)=(NEW.workspace_id,NEW.publisher_id,NEW.operation_id)
  AND a.object_type='TemplatePublication' AND a.object_id=NEW.id AND a.outcome='Accepted' AND a.reason=NEW.reason
  AND a.details->>'command'='Template:Publish' AND a.details->>'template_id'=NEW.template_id::text
  AND a.details->>'review_id'=NEW.review_id::text AND a.details->>'definition_hash'=NEW.definition_hash
  AND r.record_id=NEW.id AND r.payload_hash=NEW.command_hash AND r.result->>'record_version'='1' AND r.result->>'state'='Published'
  AND o.kind='PolicyOrTemplatePublished' AND o.payload->>'record_id'=NEW.id::text AND o.payload->>'record_version'='1'
  AND o.payload->>'object_type'='TemplatePublication' AND o.payload->>'publication_type'='TemplateDefinition'
  AND o.payload->>'family'='OUT-09' AND o.payload->>'template_id'=NEW.template_id::text AND o.payload->>'template_version'=NEW.runtime_version::text
  AND o.payload->>'review_id'=NEW.review_id::text AND o.payload->>'proposal_revision_id'=NEW.revision_id::text
  AND o.payload->>'definition_hash'=NEW.definition_hash AND o.payload->'use_assigned'='false'::jsonb)
 THEN RAISE EXCEPTION 'Exact publication operation graph required' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER template_publication_evidence AFTER INSERT ON ppo.template_publications DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.template_publication_evidence();
-- Direct managed definition inserts cannot bypass publication evidence.
CREATE FUNCTION ppo.managed_pack_template_publication() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.version>=3 AND NOT EXISTS(SELECT 1 FROM ppo.template_publications WHERE workspace_id=NEW.workspace_id AND template_id=NEW.id) THEN
  RAISE EXCEPTION 'Managed pack template publication required' USING ERRCODE='23514';
 END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER managed_pack_template_publication AFTER INSERT ON ppo.pack_templates DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.managed_pack_template_publication();
