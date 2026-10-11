-- PD-01–05 synthetic catalogue. No grants, price master or external writes.
SET CONSTRAINTS ppo.identity_target IMMEDIATE;
DO $$ DECLARE spec record; definition text; BEGIN
 FOR spec IN SELECT * FROM (VALUES
 ('business_identities','ck_identities_type','object_type','Product,ProductRelationship,ProductImport'),
 ('audit_events','ck_audit_object_type','object_type','Product,ProductRelationship,ProductImport'),
 ('outbox_jobs','ck_outbox_kind','kind','ProductChanged,ProductRelationshipChanged,ProductImportChanged'),
 ('permission_grants','ck_grants_capability','capability','products.read,products.edit,products.review,products.publish,products.commercial.read,products.sources.bind,products.relationship.edit,products.relationship.review,products.import.stage,products.import.review,products.import.apply')
 ) v(tab,con,col,added) LOOP
 SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid=('ppo.'||spec.tab)::regclass AND conname=spec.con;
 EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',spec.tab,spec.con);
 EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR %I = ANY(%L::text[]))',spec.tab,spec.con,substring(definition from 8 for length(definition)-8),spec.col,string_to_array(spec.added,','));
 END LOOP;
 SELECT pg_get_functiondef('ppo.identity_has_typed_record()'::regprocedure) INTO definition;
 IF position('CASE NEW.object_type' in definition)=0 THEN RAISE EXCEPTION 'Inspect changed identity dispatch'; END IF;
 EXECUTE replace(definition,'CASE NEW.object_type','CASE NEW.object_type WHEN ''Product'' THEN ''products'' WHEN ''ProductRelationship'' THEN ''product_relationships'' WHEN ''ProductImport'' THEN ''product_imports''');
END $$;
SET CONSTRAINTS ppo.identity_target DEFERRED;

CREATE TABLE ppo.products (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,company_id uuid NOT NULL,
 reference text NOT NULL CHECK(reference ~ '^SYN-[A-Za-z0-9-]{1,96}$'),
 kind text NOT NULL CHECK(kind IN ('Family','Model','Variant')),parent_id uuid,
 provider text NOT NULL CHECK(length(btrim(provider)) BETWEEN 1 AND 200),entity_key text NOT NULL CHECK(length(btrim(entity_key)) BETWEEN 1 AND 200),
 owner_id uuid NOT NULL,version integer NOT NULL DEFAULT 1 CHECK(version>0),revision integer NOT NULL DEFAULT 1 CHECK(revision>0),current_revision_id uuid NOT NULL,published_revision_id uuid,
 state text NOT NULL DEFAULT 'Draft' CHECK(state IN ('Draft','Submitted','Reviewed','Returned','Published','Withdrawn')),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),created_by uuid NOT NULL,updated_by uuid NOT NULL,synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,company_id,id),UNIQUE(workspace_id,company_id,reference),UNIQUE(workspace_id,company_id,provider,entity_key),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,parent_id) REFERENCES ppo.products(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id),
 CHECK((kind='Family' AND parent_id IS NULL) OR (kind<>'Family' AND parent_id IS NOT NULL))
);
CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.products FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('Product','');
CREATE TRIGGER retain_product BEFORE DELETE ON ppo.products FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.product_revisions (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,company_id uuid NOT NULL,product_id uuid NOT NULL,revision integer NOT NULL CHECK(revision>0),predecessor_id uuid,
 content jsonb NOT NULL CHECK(jsonb_typeof(content)='object' AND content->>'data_mode'='Synthetic' AND octet_length(content::text)<=32768),content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'),reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,company_id,id),UNIQUE(workspace_id,product_id,id),UNIQUE(workspace_id,product_id,revision),
 FOREIGN KEY(workspace_id,company_id,product_id) REFERENCES ppo.products(workspace_id,company_id,id),FOREIGN KEY(workspace_id,product_id,predecessor_id) REFERENCES ppo.product_revisions(workspace_id,product_id,id),FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 CHECK((revision=1 AND predecessor_id IS NULL) OR (revision>1 AND predecessor_id IS NOT NULL))
);
ALTER TABLE ppo.products ADD CONSTRAINT product_current FOREIGN KEY(workspace_id,id,current_revision_id) REFERENCES ppo.product_revisions(workspace_id,product_id,id) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE ppo.products ADD CONSTRAINT product_published FOREIGN KEY(workspace_id,id,published_revision_id) REFERENCES ppo.product_revisions(workspace_id,product_id,id) DEFERRABLE INITIALLY DEFERRED;
CREATE TRIGGER immutable_product_revision BEFORE UPDATE OR DELETE ON ppo.product_revisions FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.product_events (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,product_id uuid NOT NULL,revision_id uuid NOT NULL,product_version integer NOT NULL CHECK(product_version>0),
 action text NOT NULL CHECK(action IN ('Draft','Submitted','Reviewed','Returned','Published','Withdrawn','SourceBound','UseLinked')),
 supersedes_id uuid,purpose text,audience text,effective_on date,reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),operation_id uuid NOT NULL,created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,product_id,product_version),
 FOREIGN KEY(workspace_id,product_id,revision_id) REFERENCES ppo.product_revisions(workspace_id,product_id,id),FOREIGN KEY(workspace_id,product_id,supersedes_id) REFERENCES ppo.product_revisions(workspace_id,product_id,id),FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 CHECK(action<>'Published' OR (length(btrim(purpose))>0 AND length(btrim(audience))>0 AND effective_on IS NOT NULL))
);
CREATE TRIGGER immutable_product_event BEFORE UPDATE OR DELETE ON ppo.product_events FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.product_guard() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE parent_kind text; BEGIN
 IF NEW.parent_id IS NOT NULL THEN
 SELECT kind INTO parent_kind FROM ppo.products WHERE workspace_id=NEW.workspace_id AND company_id=NEW.company_id AND id=NEW.parent_id;
 IF parent_kind IS DISTINCT FROM (CASE NEW.kind WHEN 'Model' THEN 'Family' WHEN 'Variant' THEN 'Model' END) THEN RAISE EXCEPTION 'Exact Family / Model / Variant hierarchy required' USING ERRCODE='23514'; END IF;
 END IF;
 IF TG_OP='INSERT' THEN
 IF NEW.version<>1 OR NEW.revision<>1 OR NEW.state<>'Draft' OR NEW.published_revision_id IS NOT NULL OR NEW.owner_id<>NEW.created_by THEN RAISE EXCEPTION 'Product starts as an unpublished draft' USING ERRCODE='23514'; END IF;
 ELSE
 IF (NEW.id,NEW.workspace_id,NEW.company_id,NEW.reference,NEW.kind,NEW.parent_id,NEW.provider,NEW.entity_key,NEW.owner_id,NEW.created_by,NEW.created_at) IS DISTINCT FROM (OLD.id,OLD.workspace_id,OLD.company_id,OLD.reference,OLD.kind,OLD.parent_id,OLD.provider,OLD.entity_key,OLD.owner_id,OLD.created_by,OLD.created_at) OR NEW.version<>OLD.version+1 THEN RAISE EXCEPTION 'Retain product identity and advance exactly once' USING ERRCODE='55000'; END IF;
 IF NEW.current_revision_id<>OLD.current_revision_id THEN
 IF OLD.state='Submitted' OR NEW.revision<>OLD.revision+1 OR NEW.state<>'Draft' OR NEW.published_revision_id IS DISTINCT FROM OLD.published_revision_id THEN RAISE EXCEPTION 'Successor retains the published basis and starts Draft' USING ERRCODE='23514'; END IF;
 ELSIF NEW.revision<>OLD.revision OR NOT (
 (NEW.state=OLD.state AND NEW.published_revision_id IS NOT DISTINCT FROM OLD.published_revision_id) OR
 (OLD.state='Draft' AND NEW.state='Submitted') OR
 (OLD.state='Submitted' AND NEW.state IN ('Reviewed','Returned')) OR
 (OLD.state='Reviewed' AND NEW.state='Published' AND NEW.published_revision_id=NEW.current_revision_id) OR
 (NEW.state='Withdrawn' AND OLD.published_revision_id IS NOT NULL AND NEW.published_revision_id IS NULL)
 ) THEN RAISE EXCEPTION 'Invalid catalogue transition' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER product_guard BEFORE INSERT OR UPDATE ON ppo.products FOR EACH ROW EXECUTE FUNCTION ppo.product_guard();
CREATE FUNCTION ppo.product_graph() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE r ppo.product_revisions;e ppo.product_events;prior ppo.product_revisions; BEGIN
 IF TG_TABLE_NAME='products' THEN
 SELECT * INTO STRICT r FROM ppo.product_revisions WHERE workspace_id=NEW.workspace_id AND id=NEW.current_revision_id;
 SELECT * INTO e FROM ppo.product_events WHERE workspace_id=NEW.workspace_id AND product_id=NEW.id AND product_version=NEW.version;
 IF r.product_id<>NEW.id OR r.revision<>NEW.revision OR e.id IS NULL OR e.created_by<>NEW.updated_by OR (e.action NOT IN ('SourceBound','UseLinked') AND e.action<>NEW.state) THEN RAISE EXCEPTION 'Exact catalogue revision and event required' USING ERRCODE='23514'; END IF;
 IF e.action NOT IN ('Withdrawn','SourceBound','UseLinked') AND e.revision_id<>r.id THEN RAISE EXCEPTION 'Event must address exact revision' USING ERRCODE='23514'; END IF;
 ELSIF TG_TABLE_NAME='product_revisions' THEN
 IF NEW.predecessor_id IS NOT NULL THEN
 SELECT * INTO STRICT prior FROM ppo.product_revisions WHERE workspace_id=NEW.workspace_id AND product_id=NEW.product_id AND id=NEW.predecessor_id;
 IF NEW.revision<>prior.revision+1 THEN RAISE EXCEPTION 'Exact predecessor sequence required' USING ERRCODE='23514'; END IF;
 END IF;
 ELSIF TG_TABLE_NAME='product_events' THEN
 SELECT * INTO STRICT r FROM ppo.product_revisions WHERE workspace_id=NEW.workspace_id AND id=NEW.revision_id;
 IF NEW.action IN ('Reviewed','Returned') AND NEW.created_by=r.created_by THEN RAISE EXCEPTION 'Independent catalogue review required' USING ERRCODE='23514'; END IF;
 IF NEW.action='Published' AND NOT EXISTS(SELECT 1 FROM ppo.product_events WHERE workspace_id=NEW.workspace_id AND revision_id=NEW.revision_id AND action='Reviewed' AND product_version<NEW.product_version) THEN RAISE EXCEPTION 'Exact reviewed revision required' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER product_graph AFTER INSERT OR UPDATE ON ppo.products DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.product_graph();
CREATE CONSTRAINT TRIGGER product_revision_graph AFTER INSERT ON ppo.product_revisions DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.product_graph();
CREATE CONSTRAINT TRIGGER product_event_graph AFTER INSERT ON ppo.product_events DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.product_graph();

CREATE TABLE ppo.product_cost_source_bindings (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,company_id uuid NOT NULL,product_id uuid NOT NULL,product_revision_id uuid NOT NULL,source_revision_id uuid NOT NULL,
 status text NOT NULL CHECK(status IN ('Mapped','Unresolved')),evidence text NOT NULL CHECK(length(btrim(evidence)) BETWEEN 1 AND 1000),created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,product_revision_id,source_revision_id),
 FOREIGN KEY(workspace_id,company_id,product_id) REFERENCES ppo.products(workspace_id,company_id,id),FOREIGN KEY(workspace_id,product_id,product_revision_id) REFERENCES ppo.product_revisions(workspace_id,product_id,id),FOREIGN KEY(workspace_id,company_id,source_revision_id) REFERENCES ppo.cost_source_revisions(workspace_id,company_id,id),FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER immutable_product_source BEFORE UPDATE OR DELETE ON ppo.product_cost_source_bindings FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

CREATE TABLE ppo.product_use_references (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,company_id uuid NOT NULL,product_id uuid NOT NULL,product_revision_id uuid NOT NULL,
 asset_id uuid,material_line_id uuid,target_version integer NOT NULL CHECK(target_version>0),snapshot jsonb NOT NULL,reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 CHECK(num_nonnulls(asset_id,material_line_id)=1),
 FOREIGN KEY(workspace_id,company_id,product_id) REFERENCES ppo.products(workspace_id,company_id,id),FOREIGN KEY(workspace_id,product_id,product_revision_id) REFERENCES ppo.product_revisions(workspace_id,product_id,id),
 FOREIGN KEY(workspace_id,company_id,asset_id) REFERENCES ppo.assets(workspace_id,company_id,id),FOREIGN KEY(workspace_id,company_id,material_line_id) REFERENCES ppo.material_lines(workspace_id,company_id,id),FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE UNIQUE INDEX product_use_asset ON ppo.product_use_references(workspace_id,product_revision_id,asset_id,target_version) WHERE asset_id IS NOT NULL;
CREATE UNIQUE INDEX product_use_material ON ppo.product_use_references(workspace_id,product_revision_id,material_line_id,target_version) WHERE material_line_id IS NOT NULL;
CREATE TRIGGER immutable_product_use BEFORE UPDATE OR DELETE ON ppo.product_use_references FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

CREATE TABLE ppo.product_relationships (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,company_id uuid NOT NULL,from_revision_id uuid NOT NULL,to_revision_id uuid NOT NULL,predecessor_id uuid,
 content jsonb NOT NULL CHECK(jsonb_typeof(content)='object' AND octet_length(content::text)<=16384),content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'),
 version integer NOT NULL DEFAULT 1 CHECK(version=1),state text NOT NULL DEFAULT 'Recorded' CHECK(state='Recorded'),reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,company_id,id),CHECK(from_revision_id<>to_revision_id),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),FOREIGN KEY(workspace_id,company_id,from_revision_id) REFERENCES ppo.product_revisions(workspace_id,company_id,id),FOREIGN KEY(workspace_id,company_id,to_revision_id) REFERENCES ppo.product_revisions(workspace_id,company_id,id),FOREIGN KEY(workspace_id,company_id,predecessor_id) REFERENCES ppo.product_relationships(workspace_id,company_id,id),FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER register_identity BEFORE INSERT ON ppo.product_relationships FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('ProductRelationship','');
CREATE TRIGGER immutable_product_relationship BEFORE UPDATE OR DELETE ON ppo.product_relationships FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.product_relationship_reviews (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,relationship_id uuid NOT NULL,outcome text NOT NULL CHECK(outcome IN ('Conditional','Unresolved','Rejected')),reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,relationship_id),FOREIGN KEY(workspace_id,relationship_id) REFERENCES ppo.product_relationships(workspace_id,id),FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER immutable_product_relationship_review BEFORE UPDATE OR DELETE ON ppo.product_relationship_reviews FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.product_relationship_review_guard() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE r ppo.product_relationships; BEGIN
 SELECT * INTO STRICT r FROM ppo.product_relationships WHERE workspace_id=NEW.workspace_id AND id=NEW.relationship_id;
 IF NEW.created_by=r.created_by OR (NEW.outcome='Conditional' AND (jsonb_array_length(r.content->'criteria')=0 OR EXISTS(SELECT 1 FROM jsonb_array_elements(r.content->'criteria') c WHERE c->>'outcome' IS DISTINCT FROM 'Met'))) THEN RAISE EXCEPTION 'Independent bounded review with resolved criteria required' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER product_relationship_review_guard BEFORE INSERT ON ppo.product_relationship_reviews FOR EACH ROW EXECUTE FUNCTION ppo.product_relationship_review_guard();

CREATE TABLE ppo.product_imports (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,company_id uuid NOT NULL,filename text NOT NULL,source_description text NOT NULL,provider text NOT NULL,source_time timestamptz,content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'),raw_content text NOT NULL CHECK(octet_length(raw_content)<=49152),
 version integer NOT NULL DEFAULT 1 CHECK(version>0),state text NOT NULL DEFAULT 'Staged' CHECK(state IN ('Staged','Mapped','Reviewed','Returned','Applied')),current_plan_id uuid,
 created_by uuid NOT NULL,updated_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,company_id,id),UNIQUE(workspace_id,company_id,provider,content_hash),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),FOREIGN KEY(workspace_id,company_id) REFERENCES ppo.companies(workspace_id,id),FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.product_imports FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('ProductImport','');
CREATE TRIGGER retain_product_import BEFORE DELETE ON ppo.product_imports FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.product_import_plans (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,batch_id uuid NOT NULL,predecessor_id uuid,rows jsonb NOT NULL CHECK(jsonb_typeof(rows)='array' AND jsonb_array_length(rows) BETWEEN 1 AND 50),comparison_hash text NOT NULL CHECK(comparison_hash ~ '^[a-f0-9]{64}$'),created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(workspace_id,id),UNIQUE(workspace_id,batch_id,id),FOREIGN KEY(workspace_id,batch_id) REFERENCES ppo.product_imports(workspace_id,id),FOREIGN KEY(workspace_id,batch_id,predecessor_id) REFERENCES ppo.product_import_plans(workspace_id,batch_id,id),FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
ALTER TABLE ppo.product_imports ADD CONSTRAINT product_import_current FOREIGN KEY(workspace_id,id,current_plan_id) REFERENCES ppo.product_import_plans(workspace_id,batch_id,id) DEFERRABLE INITIALLY DEFERRED;
CREATE TRIGGER immutable_product_import_plan BEFORE UPDATE OR DELETE ON ppo.product_import_plans FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.product_import_events (
 id uuid PRIMARY KEY,workspace_id uuid NOT NULL,batch_id uuid NOT NULL,plan_id uuid,batch_version integer NOT NULL,action text NOT NULL CHECK(action IN ('Staged','Mapped','Reviewed','Returned','Applied')),reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),operation_id uuid NOT NULL,created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),result jsonb,
 UNIQUE(workspace_id,batch_id,batch_version),FOREIGN KEY(workspace_id,batch_id) REFERENCES ppo.product_imports(workspace_id,id),FOREIGN KEY(workspace_id,batch_id,plan_id) REFERENCES ppo.product_import_plans(workspace_id,batch_id,id),FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER immutable_product_import_event BEFORE UPDATE OR DELETE ON ppo.product_import_events FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.product_import_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='UPDATE' THEN
 IF (NEW.id,NEW.workspace_id,NEW.company_id,NEW.filename,NEW.source_description,NEW.provider,NEW.source_time,NEW.content_hash,NEW.raw_content,NEW.created_by,NEW.created_at) IS DISTINCT FROM (OLD.id,OLD.workspace_id,OLD.company_id,OLD.filename,OLD.source_description,OLD.provider,OLD.source_time,OLD.content_hash,OLD.raw_content,OLD.created_by,OLD.created_at) OR NEW.version<>OLD.version+1 OR OLD.state='Applied' THEN RAISE EXCEPTION 'Retain staged evidence and applied result' USING ERRCODE='55000'; END IF;
 IF NOT ((OLD.state IN ('Staged','Mapped','Returned') AND NEW.state='Mapped' AND NEW.current_plan_id IS DISTINCT FROM OLD.current_plan_id) OR (OLD.state='Mapped' AND NEW.state IN ('Reviewed','Returned') AND NEW.current_plan_id=OLD.current_plan_id) OR (OLD.state='Reviewed' AND NEW.state='Applied' AND NEW.current_plan_id=OLD.current_plan_id)) THEN RAISE EXCEPTION 'Invalid import transition' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER product_import_guard BEFORE INSERT OR UPDATE ON ppo.product_imports FOR EACH ROW EXECUTE FUNCTION ppo.product_import_guard();
CREATE FUNCTION ppo.product_import_graph() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE e ppo.product_import_events;plan ppo.product_import_plans;BEGIN
 SELECT * INTO e FROM ppo.product_import_events WHERE workspace_id=NEW.workspace_id AND batch_id=NEW.id AND batch_version=NEW.version;
 IF e.id IS NULL OR e.action<>NEW.state OR e.plan_id IS DISTINCT FROM NEW.current_plan_id OR e.created_by<>NEW.updated_by THEN RAISE EXCEPTION 'Exact import event required' USING ERRCODE='23514'; END IF;
 IF NEW.state IN ('Reviewed','Returned') THEN
 SELECT * INTO STRICT plan FROM ppo.product_import_plans WHERE workspace_id=NEW.workspace_id AND id=NEW.current_plan_id;
 IF plan.created_by=NEW.updated_by THEN RAISE EXCEPTION 'Independent import reviewer required' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER product_import_graph AFTER INSERT OR UPDATE ON ppo.product_imports DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.product_import_graph();
