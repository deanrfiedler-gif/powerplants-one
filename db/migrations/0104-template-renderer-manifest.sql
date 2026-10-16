-- DK-06 G5: new managed OUT-09 publications name the DK06-OUT09-2 renderer
-- contract, whose manifest covers rendering sources and explicit Playwright
-- versions. Only the insert guard is replaced; retained DK06-OUT09-1 rows,
-- tables, seeds, grants, identities and capabilities are unchanged.
CREATE FUNCTION ppo.template_publication_renderer() RETURNS text LANGUAGE sql IMMUTABLE AS $$ SELECT 'DK06-OUT09-2'::text $$;
CREATE OR REPLACE FUNCTION ppo.template_publication_validate() RETURNS trigger LANGUAGE plpgsql AS $$
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
   AND b->>'renderer'=ppo.template_publication_renderer() AND b->>'renderer_version'=t.renderer_version AND b->'body'=r.body
   AND b->'origin'=jsonb_build_object('proposal_id',d.id,'revision_id',r.id,'content_hash',r.content_hash)
   AND jsonb_typeof(b->'sources')='array' AND jsonb_array_length(b->'sources')>0
   AND jsonb_typeof(b->'dependencies')='array' AND jsonb_array_length(b->'dependencies')>0,false)
 THEN RAISE EXCEPTION 'Independent exact reviewed supported publication required' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
