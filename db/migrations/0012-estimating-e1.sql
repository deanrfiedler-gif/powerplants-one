-- E1 #46; independent of P10's reserved 0011. Extend current unions additively.
DO $$ DECLARE item record; definition text; BEGIN
 FOR item IN SELECT * FROM (VALUES
 ('business_identities','ck_identities_type','object_type','Estimate,EstimateVersion,DraftQuote,DraftQuoteRevision'),
 ('audit_events','ck_audit_object_type','object_type','Estimate,DraftQuoteRevision'),
 ('outbox_jobs','ck_outbox_kind','kind','EstimateCreated,EstimateVersionSaved,DraftQuotePrepared'),
 ('permission_grants','ck_grants_capability','capability','estimating.read,estimating.edit,estimating.quote.read,estimating.quote.prepare'),
 ('reference_counters','ck_reference_type','record_type','EST,QUO')) AS v(tab,con,col,added) LOOP
  SELECT pg_get_constraintdef(oid) INTO STRICT definition FROM pg_constraint WHERE conrelid=('ppo.'||item.tab)::regclass AND conname=item.con;
  EXECUTE format('ALTER TABLE ppo.%I DROP CONSTRAINT %I',item.tab,item.con);
  EXECUTE format('ALTER TABLE ppo.%I ADD CONSTRAINT %I CHECK ((%s) OR %I = ANY(%L::text[]))',item.tab,item.con,substring(definition from 8 for length(definition)-8),item.col,string_to_array(item.added,','));
 END LOOP;
 SELECT pg_get_functiondef('ppo.identity_has_typed_record()'::regprocedure) INTO definition;
 IF position('CASE NEW.object_type' in definition)=0 THEN RAISE EXCEPTION 'Inspect changed typed identity dispatch'; END IF;
 EXECUTE replace(definition,'CASE NEW.object_type','CASE NEW.object_type WHEN ''Estimate'' THEN ''estimates'' WHEN ''EstimateVersion'' THEN ''estimate_versions'' WHEN ''DraftQuote'' THEN ''draft_quotes'' WHEN ''DraftQuoteRevision'' THEN ''draft_quote_revisions''');
END $$;

CREATE TABLE ppo.estimates (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL,
 display_number text NOT NULL, version integer NOT NULL DEFAULT 1 CHECK(version>0),
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 opportunity_id uuid NOT NULL, site_id uuid, owner_id uuid NOT NULL,
 option_id uuid NOT NULL UNIQUE, estimation_revision_id uuid NOT NULL UNIQUE,
 current_version_id uuid NOT NULL, state text NOT NULL DEFAULT 'Draft' CHECK(state='Draft'),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id), UNIQUE(workspace_id,display_number), UNIQUE(workspace_id,opportunity_id),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,opportunity_id) REFERENCES ppo.opportunities(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id) REFERENCES ppo.sites(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,owner_id) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.estimates FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('Estimate','EST');
CREATE TRIGGER estimate_retained BEFORE DELETE ON ppo.estimates FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.estimate_versions (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, estimate_id uuid NOT NULL,
 version integer NOT NULL CHECK(version>0), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 predecessor_id uuid, scope_revision_id uuid NOT NULL UNIQUE,
 title text NOT NULL CHECK(length(btrim(title)) BETWEEN 1 AND 200),
 scope jsonb NOT NULL CHECK(jsonb_typeof(scope)='object'),
 lines jsonb NOT NULL CHECK(jsonb_typeof(lines)='array' AND jsonb_array_length(lines)<=100),
 policy text NOT NULL CHECK(policy='SYN-EST-ARITHMETIC-01'),
 content_hash text NOT NULL CHECK(content_hash ~ '^[a-f0-9]{64}$'),
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),
 cost_total numeric(18,2), sell_total numeric(18,2),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id), UNIQUE(workspace_id,estimate_id,id), UNIQUE(workspace_id,estimate_id,version),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,estimate_id) REFERENCES ppo.estimates(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,estimate_id,predecessor_id) REFERENCES ppo.estimate_versions(workspace_id,estimate_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id),
 CHECK((version=1 AND predecessor_id IS NULL) OR (version>1 AND predecessor_id IS NOT NULL)),
 CHECK((jsonb_array_length(lines)=0 AND cost_total IS NULL AND sell_total IS NULL) OR
 (jsonb_array_length(lines)>0 AND cost_total IS NOT NULL AND sell_total IS NOT NULL AND cost_total>=0 AND sell_total>=cost_total))
);
CREATE TRIGGER register_identity BEFORE INSERT ON ppo.estimate_versions FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('EstimateVersion','');
CREATE TRIGGER version_immutable BEFORE UPDATE OR DELETE ON ppo.estimate_versions FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
ALTER TABLE ppo.estimates ADD CONSTRAINT fk_estimate_current_version FOREIGN KEY(workspace_id,id,current_version_id) REFERENCES ppo.estimate_versions(workspace_id,estimate_id,id) DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE ppo.draft_quotes (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, estimate_id uuid NOT NULL,
 display_number text NOT NULL, version integer NOT NULL DEFAULT 1 CHECK(version>0),
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 current_revision_id uuid NOT NULL, state text NOT NULL DEFAULT 'Draft' CHECK(state='Draft'),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id), UNIQUE(workspace_id,estimate_id,id), UNIQUE(workspace_id,estimate_id), UNIQUE(workspace_id,display_number),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,estimate_id) REFERENCES ppo.estimates(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER register_identity BEFORE INSERT OR UPDATE ON ppo.draft_quotes FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('DraftQuote','QUO');
CREATE TRIGGER quote_retained BEFORE DELETE ON ppo.draft_quotes FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TABLE ppo.draft_quote_revisions (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, quote_id uuid NOT NULL, estimate_id uuid NOT NULL, estimate_version_id uuid NOT NULL,
 version integer NOT NULL CHECK(version>0), synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_by uuid NOT NULL,
 choices jsonb NOT NULL CHECK(jsonb_typeof(choices)='array'),
 safe_snapshot jsonb NOT NULL CHECK(jsonb_typeof(safe_snapshot)='object'),
 template_version text NOT NULL CHECK(template_version='PPO-E1-DRAFT-r01'),
 template_hash text NOT NULL CHECK(template_hash ~ '^[a-f0-9]{64}$'),
 template_definition text NOT NULL,
 input_html text NOT NULL, input_hash text NOT NULL CHECK(input_hash ~ '^[a-f0-9]{64}$'),
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),
 state text NOT NULL DEFAULT 'Draft' CHECK(state='Draft'),
 UNIQUE(workspace_id,id), UNIQUE(workspace_id,company_id,id), UNIQUE(workspace_id,quote_id,id), UNIQUE(workspace_id,quote_id,version),
 FOREIGN KEY(workspace_id,id) REFERENCES ppo.business_identities(workspace_id,id),
 FOREIGN KEY(workspace_id,estimate_id,quote_id) REFERENCES ppo.draft_quotes(workspace_id,estimate_id,id),
 FOREIGN KEY(workspace_id,company_id,quote_id) REFERENCES ppo.draft_quotes(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,estimate_id,estimate_version_id) REFERENCES ppo.estimate_versions(workspace_id,estimate_id,id),
 FOREIGN KEY(workspace_id,created_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,updated_by) REFERENCES ppo.users(workspace_id,id)
);
CREATE TRIGGER register_identity BEFORE INSERT ON ppo.draft_quote_revisions FOR EACH ROW EXECUTE FUNCTION ppo.register_identity('DraftQuoteRevision','');
CREATE TRIGGER quote_revision_immutable BEFORE UPDATE OR DELETE ON ppo.draft_quote_revisions FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
ALTER TABLE ppo.draft_quotes ADD CONSTRAINT fk_quote_current_revision FOREIGN KEY(workspace_id,id,current_revision_id) REFERENCES ppo.draft_quote_revisions(workspace_id,quote_id,id) DEFERRABLE INITIALLY DEFERRED;
CREATE TABLE ppo.estimate_quote_jobs (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, revision_id uuid NOT NULL UNIQUE,
 actor_id uuid NOT NULL, state text NOT NULL DEFAULT 'Pending' CHECK(state IN ('Pending','Running','Ready','Failed')),
 attempts integer NOT NULL DEFAULT 0 CHECK(attempts>=0), lease_token uuid, lease_until timestamptz, error_code text,
 manifest jsonb, created_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 FOREIGN KEY(workspace_id,revision_id) REFERENCES ppo.draft_quote_revisions(workspace_id,id),
 FOREIGN KEY(workspace_id,actor_id) REFERENCES ppo.users(workspace_id,id),
 CHECK((state='Ready')=(manifest IS NOT NULL))
);
CREATE TABLE ppo.estimate_quote_attempts (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, job_id uuid NOT NULL REFERENCES ppo.estimate_quote_jobs(id),
 attempt integer NOT NULL, outcome text NOT NULL CHECK(outcome IN ('Claimed','Ready','Failed')), code text,
 happened_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TRIGGER attempt_immutable BEFORE UPDATE OR DELETE ON ppo.estimate_quote_attempts FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE FUNCTION ppo.protect_estimate_header() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 IF (NEW.company_id,NEW.opportunity_id,NEW.site_id,NEW.owner_id,NEW.option_id,NEW.estimation_revision_id) IS DISTINCT FROM
 (OLD.company_id,OLD.opportunity_id,OLD.site_id,OLD.owner_id,OLD.option_id,OLD.estimation_revision_id) OR NEW.version<>OLD.version+1 THEN
 RAISE EXCEPTION 'Retain estimate context and advance one saved version' USING ERRCODE='55000'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER protect_estimate_header BEFORE UPDATE ON ppo.estimates FOR EACH ROW EXECUTE FUNCTION ppo.protect_estimate_header();
CREATE FUNCTION ppo.check_estimate_graph() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE v ppo.estimate_versions; BEGIN
 SELECT * INTO STRICT v FROM ppo.estimate_versions WHERE workspace_id=NEW.workspace_id AND id=NEW.current_version_id;
 IF v.version<>NEW.version OR v.created_by<>NEW.updated_by OR NOT EXISTS(SELECT 1 FROM ppo.opportunities o WHERE o.workspace_id=NEW.workspace_id AND o.id=NEW.opportunity_id AND o.site_id IS NOT DISTINCT FROM NEW.site_id) THEN
 RAISE EXCEPTION 'Exact estimate version/context required' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER estimate_graph AFTER INSERT OR UPDATE ON ppo.estimates DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_estimate_graph();
CREATE FUNCTION ppo.check_estimate_version() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE row jsonb; c numeric:=0; s numeric:=0; BEGIN
 IF NEW.predecessor_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM ppo.estimate_versions WHERE workspace_id=NEW.workspace_id AND id=NEW.predecessor_id AND version=NEW.version-1) THEN RAISE EXCEPTION 'Exact predecessor required' USING ERRCODE='23514'; END IF;
 IF (SELECT count(DISTINCT x->>'id') FROM jsonb_array_elements(NEW.lines) x)<>jsonb_array_length(NEW.lines) THEN RAISE EXCEPTION 'Distinct line identities required' USING ERRCODE='23514'; END IF;
 IF coalesce(NEW.scope->>'included','')='' OR coalesce(NEW.scope->>'excluded','')='' OR coalesce(NEW.scope->>'assumptions','')='' THEN RAISE EXCEPTION 'Explicit scope required' USING ERRCODE='23514'; END IF;
 FOR row IN SELECT * FROM jsonb_array_elements(NEW.lines) LOOP
  IF coalesce(row->>'description','')='' OR coalesce(row->>'unit','')='' OR coalesce(row->>'source','')='' OR coalesce(row->>'category','') NOT IN ('Product','Labour','Freight') OR coalesce(row->>'effective_date','') !~ '^\d{4}-\d{2}-\d{2}$' THEN RAISE EXCEPTION 'Complete manual basis required' USING ERRCODE='23514'; END IF;
  IF (row->>'effective_date')::date::text<>row->>'effective_date' THEN RAISE EXCEPTION 'Real source date required' USING ERRCODE='23514'; END IF;
  IF coalesce(row->>'quantity','') !~ '^(0|[1-9][0-9]{0,5})\.[0-9]{3}$' OR coalesce(row->>'unit_cost','') !~ '^(0|[1-9][0-9]{0,6})\.[0-9]{2}$' OR coalesce(row->>'unit_sell','') !~ '^(0|[1-9][0-9]{0,6})\.[0-9]{2}$' THEN RAISE EXCEPTION 'Canonical decimal values required' USING ERRCODE='23514'; END IF;
  IF (row->>'quantity')::numeric<=0 OR (row->>'quantity')::numeric>100000 OR (row->>'unit_cost')::numeric>1000000 OR (row->>'unit_sell')::numeric>1000000 OR (row->>'unit_sell')::numeric<(row->>'unit_cost')::numeric THEN RAISE EXCEPTION 'Invalid manual arithmetic' USING ERRCODE='23514'; END IF;
  c:=c+round((row->>'quantity')::numeric*(row->>'unit_cost')::numeric,2); s:=s+round((row->>'quantity')::numeric*(row->>'unit_sell')::numeric,2);
 END LOOP;
 IF jsonb_array_length(NEW.lines)>0 AND (NEW.cost_total<>c OR NEW.sell_total<>s) THEN RAISE EXCEPTION 'Declared totals must match saved lines' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER estimate_version_arithmetic BEFORE INSERT ON ppo.estimate_versions FOR EACH ROW EXECUTE FUNCTION ppo.check_estimate_version();
CREATE FUNCTION ppo.protect_estimate_quote_job() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='DELETE' OR (OLD.state='Ready' AND NEW IS DISTINCT FROM OLD) THEN RAISE EXCEPTION 'Retain exact ready output' USING ERRCODE='55000'; END IF;
 IF (NEW.id,NEW.workspace_id,NEW.revision_id,NEW.actor_id) IS DISTINCT FROM (OLD.id,OLD.workspace_id,OLD.revision_id,OLD.actor_id) THEN RAISE EXCEPTION 'Render intent identity is immutable' USING ERRCODE='55000'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER retain_quote_job BEFORE UPDATE OR DELETE ON ppo.estimate_quote_jobs FOR EACH ROW EXECUTE FUNCTION ppo.protect_estimate_quote_job();
CREATE INDEX ix_estimate_work ON ppo.estimates(workspace_id,company_id,site_id,owner_id,id);
CREATE INDEX ix_estimate_quote_work ON ppo.estimate_quote_jobs(state,lease_until);
CREATE FUNCTION ppo.protect_draft_quote_header() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 IF (NEW.company_id,NEW.estimate_id) IS DISTINCT FROM (OLD.company_id,OLD.estimate_id) OR NEW.version<>OLD.version+1 THEN
 RAISE EXCEPTION 'Retain quote context and advance one revision' USING ERRCODE='55000'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER protect_draft_quote_header BEFORE UPDATE ON ppo.draft_quotes FOR EACH ROW EXECUTE FUNCTION ppo.protect_draft_quote_header();
CREATE FUNCTION ppo.check_draft_quote_graph() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE v ppo.draft_quote_revisions; BEGIN
 SELECT * INTO STRICT v FROM ppo.draft_quote_revisions WHERE workspace_id=NEW.workspace_id AND id=NEW.current_revision_id;
 IF v.version<>NEW.version OR v.created_by<>NEW.updated_by THEN RAISE EXCEPTION 'Exact quote revision required' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER draft_quote_graph AFTER INSERT OR UPDATE ON ppo.draft_quotes DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_draft_quote_graph();
