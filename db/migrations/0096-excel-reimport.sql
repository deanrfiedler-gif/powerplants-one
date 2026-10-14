-- PPO-010 / XI-03/04/05/08: additive, immutable whole-estimate successor evidence.
CREATE TABLE ppo.excel_reimports (
 workspace_id uuid NOT NULL, company_id uuid NOT NULL,
 estimate_id uuid NOT NULL, estimate_version_id uuid PRIMARY KEY,
 estimating_workspace_id uuid NOT NULL, option_id uuid NOT NULL, revision_id uuid NOT NULL,
 predecessor_id uuid NOT NULL,
 comparison jsonb NOT NULL, canonical_comparison text NOT NULL, comparison_hash text NOT NULL,
 decisions jsonb NOT NULL, projection jsonb NOT NULL,
 operation_id uuid NOT NULL, receipt_id uuid NOT NULL, audit_event_id uuid NOT NULL,
 source_key jsonb NOT NULL, review jsonb NOT NULL, canonical_review text NOT NULL,
 review_hash text NOT NULL CHECK(review_hash ~ '^[a-f0-9]{64}$'),
 confirmations jsonb NOT NULL CHECK(confirmations='["SourceCalculation","Scope","Reconciliation","SourceWarnings"]'::jsonb),
 created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 UNIQUE(workspace_id,estimate_version_id),
 UNIQUE(workspace_id,created_by,operation_id),
 FOREIGN KEY(workspace_id,company_id,estimate_version_id) REFERENCES ppo.estimate_versions(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,estimate_id,estimate_version_id) REFERENCES ppo.estimate_versions(workspace_id,estimate_id,id),
 FOREIGN KEY(workspace_id,company_id,estimating_workspace_id) REFERENCES ppo.estimating_workspaces(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,estimating_workspace_id,option_id) REFERENCES ppo.estimating_options(workspace_id,estimating_workspace_id,id),
 FOREIGN KEY(workspace_id,option_id,revision_id) REFERENCES ppo.estimation_revisions(workspace_id,option_id,id),
 FOREIGN KEY(workspace_id,created_by,operation_id,receipt_id) REFERENCES ppo.operation_receipts(workspace_id,actor_id,operation_id,id) DEFERRABLE INITIALLY DEFERRED,
 FOREIGN KEY(workspace_id,estimate_id,predecessor_id) REFERENCES ppo.estimate_versions(workspace_id,estimate_id,id),
 FOREIGN KEY(audit_event_id) REFERENCES ppo.audit_events(id) DEFERRABLE INITIALLY DEFERRED,
 CHECK((canonical_comparison::jsonb=comparison-'comparison_hash' AND comparison->>'comparison_hash'=comparison_hash
   AND comparison_hash=encode(sha256(convert_to(canonical_comparison,'UTF8')),'hex')
   AND comparison->>'comparison_version'='PPO-EXCEL-COMPARE-1' AND comparison->'proposal'=review
   AND comparison#>>'{predecessor,version_id}'=predecessor_id::text) IS TRUE),
 CHECK(jsonb_typeof(decisions)='array' AND jsonb_array_length(decisions)<=100),
 CHECK(jsonb_typeof(projection)='array' AND jsonb_array_length(projection) BETWEEN 1 AND 100),
 CHECK((canonical_review::jsonb=review-'review_hash' AND review->>'review_hash'=review_hash
   AND review_hash=encode(sha256(convert_to(canonical_review,'UTF8')),'hex')) IS TRUE),
 CHECK((review->>'validation_passed'='true' AND review->>'state'='ReviewRequired'
   AND review->>'synthetic'='true' AND (review#>>'{basis,expected_estimate_version}')::integer>0
   AND review->>'mapping_version'='PPO-EXCEL-REVIEW-1'
   AND jsonb_array_length(review->'lines') BETWEEN 1 AND 100
   AND (review#>>'{file,bytes}')::integer BETWEEN 1 AND 5242880) IS TRUE),
 CHECK((source_key->>'provider'='Synthetic' AND source_key->>'tenant_id' IS NULL
   AND source_key->>'site_id' IS NULL AND source_key->>'drive_id' IS NULL
   AND source_key->>'item_id' ~ '^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-8[a-f0-9]{3}-[a-f0-9]{12}$'
   AND source_key->>'sha256' ~ '^[a-f0-9]{64}$'
   AND source_key->>'version_id'=source_key->>'sha256'
   AND source_key->>'sha256'=review#>>'{file,sha256}') IS TRUE)
);
CREATE VIEW ppo.excel_import_history AS
 SELECT i.*, v.version FROM ppo.excel_imports i JOIN ppo.estimate_versions v ON v.id=i.estimate_version_id
 UNION ALL
 SELECT i.workspace_id,i.company_id,i.estimate_id,i.estimate_version_id,i.estimating_workspace_id,i.option_id,i.revision_id,
 i.operation_id,i.receipt_id,i.audit_event_id,i.source_key,i.review,i.canonical_review,i.review_hash,i.confirmations,
 i.created_by,i.created_at,i.reason,i.synthetic,v.version
 FROM ppo.excel_reimports i JOIN ppo.estimate_versions v ON v.id=i.estimate_version_id;
CREATE VIEW ppo.excel_line_history AS
 SELECT l.workspace_id,i.estimate_id,l.estimate_version_id,v.version,l.ordinal,l.line_ref,l.line_id,l.section_ref,l.source_ref,l.included,l.print
 FROM ppo.excel_import_lines l JOIN ppo.excel_imports i USING(workspace_id,estimate_version_id)
 JOIN ppo.estimate_versions v ON v.id=i.estimate_version_id
 UNION ALL
 SELECT i.workspace_id,i.estimate_id,i.estimate_version_id,v.version,(p.ordinality-1)::integer,
 p.value->>'line_ref',(p.value#>>'{line,id}')::uuid,l.value->>'section_ref',l.value->>'source_ref',
 (l.value->>'included')::boolean,(l.value->>'print')::boolean
 FROM ppo.excel_reimports i JOIN ppo.estimate_versions v ON v.id=i.estimate_version_id
 CROSS JOIN LATERAL jsonb_array_elements(i.projection) WITH ORDINALITY p
 JOIN LATERAL jsonb_array_elements(i.review->'lines') l ON l.value->>'line_ref'=p.value->>'line_ref'
 WHERE p.value->>'line_ref' IS NOT NULL;

CREATE FUNCTION ppo.check_excel_reimport() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE i ppo.excel_reimports%ROWTYPE; v ppo.estimate_versions%ROWTYPE; old ppo.estimate_versions%ROWTYPE;
 p jsonb; l jsonb; d jsonb; expected_line jsonb; expected_id uuid; prior_map record; prior_import record;
 n integer:=0; kept jsonb:='[]'; uploaded_ids jsonb:='[]'; proposed_lines jsonb:='[]';
BEGIN
 i:=NEW;
 SELECT * INTO v FROM ppo.estimate_versions WHERE workspace_id=i.workspace_id AND id=i.estimate_version_id;
 SELECT * INTO old FROM ppo.estimate_versions WHERE workspace_id=i.workspace_id AND id=i.predecessor_id;
 SELECT * INTO prior_import FROM ppo.excel_import_history WHERE workspace_id=i.workspace_id AND estimate_id=i.estimate_id AND version<v.version ORDER BY version DESC LIMIT 1;
 IF v.version IS DISTINCT FROM old.version+1 OR v.predecessor_id IS DISTINCT FROM old.id OR v.cost_schema_version IS DISTINCT FROM 2
 OR v.created_by IS DISTINCT FROM i.created_by OR v.reason IS DISTINCT FROM i.reason
 OR v.title IS DISTINCT FROM i.review#>>'{metadata,title}'
 OR v.scope IS DISTINCT FROM jsonb_build_object(
   'included',COALESCE(NULLIF(i.review#>>'{scope_comparison,0,proposed}',''),'None declared.'),
   'excluded',COALESCE(NULLIF(i.review#>>'{scope_comparison,1,proposed}',''),'None declared.'),
   'assumptions',COALESCE(NULLIF(i.review#>>'{scope_comparison,2,proposed}',''),'None declared.'))
 OR i.review#>>'{basis,workspace_id}' IS DISTINCT FROM i.estimating_workspace_id::text
 OR i.review#>>'{basis,company_id}' IS DISTINCT FROM i.company_id::text
 OR i.review#>>'{basis,actor_id}' IS DISTINCT FROM i.created_by::text
 OR i.review#>>'{basis,option_id}' IS DISTINCT FROM i.option_id::text
 OR i.review#>>'{basis,revision_id}' IS DISTINCT FROM i.revision_id::text
 OR i.review#>>'{basis,estimate_id}' IS DISTINCT FROM i.estimate_id::text
 OR i.review#>>'{basis,estimate_version_id}' IS DISTINCT FROM old.id::text
 OR (i.review#>>'{basis,expected_estimate_version}')::integer IS DISTINCT FROM old.version
 OR i.comparison#>'{predecessor,lines}' IS DISTINCT FROM old.lines
 OR i.comparison#>>'{predecessor,content_hash}' IS DISTINCT FROM old.content_hash
 OR i.comparison#>>'{previous_import,version_id}' IS DISTINCT FROM prior_import.estimate_version_id::text
 OR i.review#>>'{metadata,workbook_ref}' IS DISTINCT FROM prior_import.review#>>'{metadata,workbook_ref}'
 OR NOT EXISTS(SELECT 1 FROM ppo.excel_imports f WHERE f.workspace_id=i.workspace_id AND f.option_id=i.option_id AND f.estimate_id=i.estimate_id)
 OR NOT EXISTS(SELECT 1 FROM ppo.estimates e JOIN ppo.estimate_discovery_bases b ON (b.workspace_id,b.estimate_id)=(e.workspace_id,e.id)
   WHERE e.workspace_id=i.workspace_id AND e.id=i.estimate_id AND e.option_id=i.option_id AND b.estimate_version_id=v.id AND b.revision_id=i.revision_id)
 OR NOT EXISTS(SELECT 1 FROM ppo.operation_receipts r WHERE r.id=i.receipt_id AND r.record_id=i.estimate_id AND (r.result->>'record_version')::integer=v.version)
 OR NOT EXISTS(SELECT 1 FROM ppo.audit_events a WHERE a.id=i.audit_event_id AND a.workspace_id=i.workspace_id AND a.actor_id=i.created_by
   AND a.operation_id=i.operation_id AND a.object_type='Estimate' AND a.object_id=i.estimate_id
   AND a.details->>'command'='ExcelImport:Reimport' AND a.details->>'saved_version_id'=v.id::text
   AND a.details#>>'{excel_import,review_hash}'=i.review_hash AND a.details#>>'{excel_import,comparison_hash}'=i.comparison_hash
   AND a.details#>>'{excel_import,changes_confirmed}'='true' AND a.details#>'{excel_import,decisions}'=i.decisions
   AND a.details#>>'{excel_import,source_sha256}'=i.review#>>'{file,sha256}')
 OR NOT EXISTS(SELECT 1 FROM ppo.outbox_jobs o WHERE o.workspace_id=i.workspace_id AND o.operation_id=i.operation_id AND o.actor_id=i.created_by AND o.kind='EstimateVersionSaved'
   AND o.payload->>'record_id'=i.estimate_id::text AND (o.payload->>'record_version')::integer=v.version)
 THEN RAISE EXCEPTION 'Re-import must retain its exact predecessor, review, basis and operation evidence' USING ERRCODE='23514'; END IF;

 FOR l IN SELECT value FROM jsonb_array_elements(i.review->'lines') LOOP
   p:=i.projection->n;
   SELECT * INTO prior_map FROM ppo.excel_line_history WHERE workspace_id=i.workspace_id AND estimate_id=i.estimate_id
     AND version<v.version AND line_ref=l->>'line_ref' ORDER BY version DESC LIMIT 1;
   IF FOUND THEN expected_id:=prior_map.line_id;
   ELSE
     -- The immutable comparison binds newly allocated IDs; historical keys may never be reassigned.
     expected_id:=(i.comparison->'lines'->n->>'line_id')::uuid;
     IF EXISTS(SELECT 1 FROM ppo.excel_line_history WHERE workspace_id=i.workspace_id AND estimate_id=i.estimate_id AND version<v.version AND line_id=expected_id)
       OR EXISTS(SELECT 1 FROM jsonb_array_elements(old.lines) x WHERE x->>'id'=expected_id::text)
     THEN RAISE EXCEPTION 'New workbook keys cannot claim existing native lines' USING ERRCODE='23514'; END IF;
   END IF;
   expected_line:=jsonb_build_object('id',expected_id,'description',l->'description','category',l->'category','allowance',l->'allowance',
     'quantity',l->'quantity','unit',l->'unit','unit_cost',l->'unit_cost','unit_sell',l->'unit_sell','source',l->'source_text','effective_date',l->'effective_date');
   IF p->'line' IS DISTINCT FROM expected_line OR p->>'line_ref' IS DISTINCT FROM l->>'line_ref' OR p->>'retained_from' IS NOT NULL
     OR i.comparison->'lines'->n->'proposed' IS DISTINCT FROM expected_line
   THEN RAISE EXCEPTION 'Re-import line projection must match reviewed values and stable identities' USING ERRCODE='23514'; END IF;
   proposed_lines:=proposed_lines||jsonb_build_array(expected_line);
   uploaded_ids:=uploaded_ids||jsonb_build_array(expected_id::text);
   n:=n+1;
 END LOOP;
 IF jsonb_array_length(i.comparison->'lines') IS DISTINCT FROM n OR jsonb_array_length(i.decisions) IS DISTINCT FROM
   (SELECT count(*) FROM jsonb_array_elements(old.lines) x WHERE NOT uploaded_ids ? (x->>'id'))
 OR (SELECT count(DISTINCT x->>'line_id') FROM jsonb_array_elements(i.decisions) x)<>jsonb_array_length(i.decisions)
 THEN RAISE EXCEPTION 'Every omitted native line requires exactly one decision' USING ERRCODE='23514'; END IF;
 FOR l IN SELECT value FROM jsonb_array_elements(old.lines) WHERE NOT uploaded_ids ? (value->>'id') LOOP
   SELECT value INTO d FROM jsonb_array_elements(i.decisions) WHERE value->>'line_id'=l->>'id';
   IF d IS NULL OR (d->>'action') IS NULL OR d->>'action' NOT IN ('Keep','Remove')
   THEN RAISE EXCEPTION 'Omitted line decision required' USING ERRCODE='23514'; END IF;
   IF d->>'action'='Keep' THEN
     SELECT * INTO prior_map FROM ppo.excel_line_history WHERE workspace_id=i.workspace_id AND estimate_id=i.estimate_id
       AND version<v.version AND line_id=(l->>'id')::uuid ORDER BY version DESC LIMIT 1;
     p:=i.projection->n;
     IF p->'line' IS DISTINCT FROM l OR p->>'line_ref' IS NOT NULL OR p->>'retained_from' IS DISTINCT FROM prior_map.estimate_version_id::text
     THEN RAISE EXCEPTION 'Kept native lines and provenance must remain exact' USING ERRCODE='23514'; END IF;
     kept:=kept||jsonb_build_array(l); n:=n+1;
   END IF;
 END LOOP;
 IF jsonb_array_length(i.projection)<>n OR v.lines IS DISTINCT FROM proposed_lines||kept
 OR (SELECT count(DISTINCT x#>>'{line,id}') FROM jsonb_array_elements(i.projection) x)<>n
 THEN RAISE EXCEPTION 'Successor must contain exactly the resolved whole-estimate projection' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER excel_reimport_complete AFTER INSERT ON ppo.excel_reimports
 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_excel_reimport();
CREATE TRIGGER retained BEFORE UPDATE OR DELETE ON ppo.excel_reimports FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
