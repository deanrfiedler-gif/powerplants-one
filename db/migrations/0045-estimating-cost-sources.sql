-- Native ES-03. Manually authored synthetic sources; no catalogue publication,
-- commercial approval or legacy source backfill. Inspect current main before integration.
SET CONSTRAINTS ppo.identity_target IMMEDIATE;
DO $$ DECLARE spec record; definition text; BEGIN
 FOR spec IN SELECT * FROM (VALUES
  ('business_identities','ck_identities_type','object_type','CostSource'),
  ('audit_events','ck_audit_object_type','object_type','CostSource'),
  ('outbox_jobs','ck_outbox_kind','kind','CostSourceSaved,CostSourceSubmitted,CostSourceReviewed'),
  ('permission_grants','ck_grants_capability','capability','estimating.source.review')
 ) v(tab,con,col,added) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid=('ppo.'||spec.tab)::regclass AND conname=spec.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',spec.tab,spec.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR %I = ANY(%L::text[]))',spec.tab,spec.con,substring(definition from 8 for length(definition)-8),spec.col,string_to_array(spec.added,','));
 END LOOP;
 SELECT pg_get_functiondef('ppo.identity_has_typed_record()'::regprocedure) INTO definition;
 IF position('CASE NEW.object_type' in definition)=0 THEN RAISE EXCEPTION 'Inspect changed identity dispatch'; END IF;
 EXECUTE replace(definition,'CASE NEW.object_type','CASE NEW.object_type WHEN ''CostSource'' THEN ''cost_sources''');
END $$;
SET CONSTRAINTS ppo.identity_target DEFERRED;

CREATE TABLE ppo.cost_sources (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL,
 reference text NOT NULL CHECK(reference ~ '^SYN-[A-Za-z0-9-]{1,96}$'), owner_id uuid NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version>0), revision integer NOT NULL DEFAULT 1 CHECK(revision>0), current_revision_id uuid NOT NULL,
 state text NOT NULL DEFAULT 'Draft' CHECK(state IN ('Draft','Submitted','Reviewed','Returned','Rejected')),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),created_by uuid NOT NULL,updated_by uuid NOT NULL,
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,company_id,id),UNIQUE(workspace_id,company_id,reference),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.cost_sources FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('CostSource','');
CREATE TRIGGER retain_source BEFORE DELETE ON ppo.cost_sources FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.cost_source_revisions (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,company_id uuid NOT NULL,source_id uuid NOT NULL,
 revision integer NOT NULL CHECK(revision>0),predecessor_id uuid,
 content jsonb NOT NULL CHECK(jsonb_typeof(content)='object' AND content->>'data_mode'='Synthetic' AND content->>'currency'='AUD' AND content->>'tax_basis'='ExcludingTax' AND octet_length(content::text)<=32768),
 content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'), reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),
 created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,company_id,id),UNIQUE(workspace_id,source_id,id),UNIQUE(workspace_id,source_id,revision),
 FOREIGN KEY(workspace_id,company_id,source_id) REFERENCES ppo.cost_sources(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,source_id,predecessor_id) REFERENCES ppo.cost_source_revisions(workspace_id,source_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 CHECK((revision=1 AND predecessor_id IS NULL) OR (revision>1 AND predecessor_id IS NOT NULL))
);
ALTER TABLE ppo.cost_sources ADD CONSTRAINT cost_source_current FOREIGN KEY(workspace_id,id,current_revision_id) REFERENCES ppo.cost_source_revisions(workspace_id,source_id,id) DEFERRABLE INITIALLY DEFERRED;
CREATE TRIGGER immutable_source_revision BEFORE UPDATE OR DELETE ON ppo.cost_source_revisions FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.cost_source_events (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,source_id uuid NOT NULL,revision_id uuid NOT NULL,source_version integer NOT NULL CHECK(source_version>0),
 action text NOT NULL CHECK(action IN ('DraftSaved','Submitted','Reviewed','Returned','Rejected')),
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),operation_id uuid NOT NULL,
 created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,source_id,source_version),UNIQUE(workspace_id,revision_id,id),UNIQUE(workspace_id,created_by,operation_id),
 FOREIGN KEY(workspace_id,source_id,revision_id) REFERENCES ppo.cost_source_revisions(workspace_id,source_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER immutable_source_event BEFORE UPDATE OR DELETE ON ppo.cost_source_events FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

CREATE FUNCTION ppo.cost_source_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='INSERT' THEN
  IF NEW.version<>1 OR NEW.revision<>1 OR NEW.state<>'Draft' OR NEW.owner_id<>NEW.created_by OR NEW.updated_by<>NEW.created_by THEN RAISE EXCEPTION 'A source starts as its owner draft' USING ERRCODE='23514'; END IF;
 ELSE
  IF (NEW.id,NEW.workspace_id,NEW.company_id,NEW.reference,NEW.owner_id,NEW.created_by,NEW.created_at) IS DISTINCT FROM (OLD.id,OLD.workspace_id,OLD.company_id,OLD.reference,OLD.owner_id,OLD.created_by,OLD.created_at) OR NEW.version<>OLD.version+1 THEN RAISE EXCEPTION 'Retain source identity and advance exactly once' USING ERRCODE='55000'; END IF;
  IF NEW.current_revision_id<>OLD.current_revision_id THEN
   IF OLD.state='Submitted' OR NEW.revision<>OLD.revision+1 OR NEW.state<>'Draft' OR NEW.updated_by<>NEW.owner_id THEN RAISE EXCEPTION 'A correction is a new owner draft after review or before submission' USING ERRCODE='23514'; END IF;
  ELSIF NEW.revision<>OLD.revision OR NOT ((OLD.state='Draft' AND NEW.state='Submitted' AND NEW.updated_by=NEW.owner_id) OR (OLD.state='Submitted' AND NEW.state IN ('Reviewed','Returned','Rejected') AND NEW.updated_by<>NEW.owner_id)) THEN
   RAISE EXCEPTION 'Submitted exact evidence requires independent review' USING ERRCODE='23514';
  END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER source_guard BEFORE INSERT OR UPDATE ON ppo.cost_sources FOR EACH ROW EXECUTE FUNCTION ppo.cost_source_guard();
CREATE FUNCTION ppo.cost_source_graph() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE s ppo.cost_sources;r ppo.cost_source_revisions;e ppo.cost_source_events;old ppo.cost_source_revisions;
BEGIN
 IF TG_TABLE_NAME='cost_sources' THEN
  SELECT * INTO STRICT r FROM ppo.cost_source_revisions WHERE workspace_id=NEW.workspace_id AND id=NEW.current_revision_id;
  SELECT * INTO e FROM ppo.cost_source_events WHERE workspace_id=NEW.workspace_id AND source_id=NEW.id AND source_version=NEW.version;
  IF r.source_id<>NEW.id OR r.revision<>NEW.revision OR e.id IS NULL OR e.revision_id<>r.id OR e.created_by<>NEW.updated_by OR (CASE e.action WHEN 'DraftSaved' THEN 'Draft' ELSE e.action END)<>NEW.state THEN RAISE EXCEPTION 'Exact source revision and event required' USING ERRCODE='23514'; END IF;
 ELSIF TG_TABLE_NAME='cost_source_revisions' THEN
  SELECT * INTO STRICT s FROM ppo.cost_sources WHERE workspace_id=NEW.workspace_id AND id=NEW.source_id;
  IF NEW.created_by<>s.owner_id OR NEW.revision>s.revision THEN RAISE EXCEPTION 'Source owner and retained revision required' USING ERRCODE='23514'; END IF;
  IF NEW.predecessor_id IS NOT NULL THEN
   SELECT * INTO STRICT old FROM ppo.cost_source_revisions WHERE workspace_id=NEW.workspace_id AND source_id=NEW.source_id AND id=NEW.predecessor_id;
   IF NEW.revision<>old.revision+1 OR (NEW.content->>'supplier_entity_key',NEW.content->>'supplier_label',NEW.content->>'item_reference',NEW.content->>'unit') IS DISTINCT FROM (old.content->>'supplier_entity_key',old.content->>'supplier_label',old.content->>'item_reference',old.content->>'unit') THEN RAISE EXCEPTION 'Retain supplier, item and unit identity within one source' USING ERRCODE='23514'; END IF;
  END IF;
 ELSE
  SELECT * INTO STRICT s FROM ppo.cost_sources WHERE workspace_id=NEW.workspace_id AND id=NEW.source_id;
  SELECT * INTO STRICT r FROM ppo.cost_source_revisions WHERE workspace_id=NEW.workspace_id AND id=NEW.revision_id;
  IF NEW.source_version>s.version OR (NEW.source_version>1 AND NOT EXISTS(SELECT 1 FROM ppo.cost_source_events WHERE workspace_id=NEW.workspace_id AND source_id=NEW.source_id AND source_version=NEW.source_version-1)) OR (NEW.action IN ('Reviewed','Returned','Rejected') AND NEW.created_by=r.created_by) THEN RAISE EXCEPTION 'Retained source sequence and independent review required' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER source_graph AFTER INSERT OR UPDATE ON ppo.cost_sources DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.cost_source_graph();
CREATE CONSTRAINT TRIGGER source_revision_graph AFTER INSERT ON ppo.cost_source_revisions DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.cost_source_graph();
CREATE CONSTRAINT TRIGGER source_event_graph AFTER INSERT ON ppo.cost_source_events DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.cost_source_graph();

CREATE TABLE ppo.estimate_cost_source_bindings (
 workspace_id uuid NOT NULL,company_id uuid NOT NULL,estimate_version_id uuid NOT NULL,line_id uuid NOT NULL,
 source_revision_id uuid NOT NULL,review_event_id uuid NOT NULL,pricing_date date NOT NULL,
 tier_minimum_quantity numeric(12,3) NOT NULL CHECK(tier_minimum_quantity>0),unit_cost numeric(12,2) NOT NULL CHECK(unit_cost>=0),
 created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(workspace_id,estimate_version_id,line_id),
 FOREIGN KEY(workspace_id,company_id,estimate_version_id) REFERENCES ppo.estimate_versions(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,source_revision_id) REFERENCES ppo.cost_source_revisions(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,source_revision_id,review_event_id) REFERENCES ppo.cost_source_events(workspace_id,revision_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 CHECK(isfinite(pricing_date) AND pricing_date BETWEEN DATE '0001-01-01' AND DATE '9998-12-31')
);
CREATE TRIGGER immutable_cost_source_binding BEFORE UPDATE OR DELETE ON ppo.estimate_cost_source_bindings FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.cost_source_binding_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v ppo.estimate_versions;r ppo.cost_source_revisions;s ppo.cost_sources;line jsonb;tier jsonb;version_xid numeric;
BEGIN
 SELECT * INTO v FROM ppo.estimate_versions WHERE workspace_id=NEW.workspace_id AND id=NEW.estimate_version_id;
 SELECT xmin::text::numeric INTO version_xid FROM ppo.estimate_versions WHERE workspace_id=NEW.workspace_id AND id=NEW.estimate_version_id;
 -- Bindings may only be created in the version's inserting transaction. XIDs
 -- on tuples are 32-bit; pg_current_xact_id includes the epoch. No late append
 -- of typed evidence to a previously saved version, including legacy versions.
 IF v.id IS NULL OR version_xid<>(pg_current_xact_id()::text::numeric % 4294967296) THEN RAISE EXCEPTION 'Create source bindings atomically with a new estimate version' USING ERRCODE='55000'; END IF;
 SELECT * INTO STRICT r FROM ppo.cost_source_revisions WHERE workspace_id=NEW.workspace_id AND id=NEW.source_revision_id;
 SELECT * INTO STRICT s FROM ppo.cost_sources WHERE workspace_id=NEW.workspace_id AND id=r.source_id;
 SELECT value INTO line FROM jsonb_array_elements(v.lines) WHERE value->>'id'=NEW.line_id::text;
 SELECT value INTO tier FROM jsonb_array_elements(r.content->'tiers') WITH ORDINALITY WHERE (value->>'minimum_quantity')::numeric<=(line->>'quantity')::numeric ORDER BY ordinality DESC LIMIT 1;
 IF line IS NULL OR tier IS NULL OR NOT EXISTS(SELECT 1 FROM ppo.cost_source_events WHERE workspace_id=NEW.workspace_id AND id=NEW.review_event_id AND revision_id=r.id AND action='Reviewed')
  OR line->>'unit'<>r.content->>'unit' OR (line->>'unit_cost')::numeric<>NEW.unit_cost OR (tier->>'unit_cost')::numeric<>NEW.unit_cost OR (tier->>'minimum_quantity')::numeric<>NEW.tier_minimum_quantity
  OR line->>'effective_date'<>r.content->>'source_date' OR line->>'source'<>s.reference||' / r'||r.revision::text||' / '||(r.content->>'evidence_reference')
  OR NEW.pricing_date<(r.content->>'effective_from')::date OR (r.content->>'valid_until' IS NOT NULL AND NEW.pricing_date>(r.content->>'valid_until')::date) THEN
  RAISE EXCEPTION 'The exact reviewed source, tier, dates and saved cost line must agree' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER cost_source_binding_guard BEFORE INSERT ON ppo.estimate_cost_source_bindings FOR EACH ROW EXECUTE FUNCTION ppo.cost_source_binding_guard();
CREATE INDEX ON ppo.cost_sources(workspace_id,company_id,updated_at DESC,id);
CREATE INDEX ON ppo.estimate_cost_source_bindings(workspace_id,source_revision_id);
