-- PPO-010 / XI-01/03/04/08: immutable evidence for the first reviewed workbook save.
-- Slots 0093/0094 are reserved by the independent template publication/use branches.
CREATE TABLE ppo.excel_imports (
 workspace_id uuid NOT NULL, company_id uuid NOT NULL,
 estimate_id uuid NOT NULL, estimate_version_id uuid PRIMARY KEY,
 estimating_workspace_id uuid NOT NULL, option_id uuid NOT NULL, revision_id uuid NOT NULL,
 operation_id uuid NOT NULL, receipt_id uuid NOT NULL, audit_event_id uuid NOT NULL,
 source_key jsonb NOT NULL, review jsonb NOT NULL, canonical_review text NOT NULL,
 review_hash text NOT NULL CHECK(review_hash ~ '^[a-f0-9]{64}$'),
 confirmations jsonb NOT NULL CHECK(confirmations='["SourceCalculation","Scope","Reconciliation","SourceWarnings"]'::jsonb),
 created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 UNIQUE(workspace_id,estimate_version_id), UNIQUE(workspace_id,option_id),
 UNIQUE(workspace_id,created_by,operation_id),
 FOREIGN KEY(workspace_id,company_id,estimate_version_id) REFERENCES ppo.estimate_versions(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,estimate_id,estimate_version_id) REFERENCES ppo.estimate_versions(workspace_id,estimate_id,id),
 FOREIGN KEY(workspace_id,company_id,estimating_workspace_id) REFERENCES ppo.estimating_workspaces(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,estimating_workspace_id,option_id) REFERENCES ppo.estimating_options(workspace_id,estimating_workspace_id,id),
 FOREIGN KEY(workspace_id,option_id,revision_id) REFERENCES ppo.estimation_revisions(workspace_id,option_id,id),
 FOREIGN KEY(workspace_id,created_by,operation_id,receipt_id) REFERENCES ppo.operation_receipts(workspace_id,actor_id,operation_id,id) DEFERRABLE INITIALLY DEFERRED,
 FOREIGN KEY(audit_event_id) REFERENCES ppo.audit_events(id) DEFERRABLE INITIALLY DEFERRED,
 CHECK((canonical_review::jsonb=review-'review_hash' AND review->>'review_hash'=review_hash
   AND review_hash=encode(sha256(convert_to(canonical_review,'UTF8')),'hex')) IS TRUE),
 CHECK((review->>'validation_passed'='true' AND review->>'state'='ReviewRequired'
   AND review->>'synthetic'='true' AND review#>>'{basis,expected_estimate_version}'='0'
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
CREATE TABLE ppo.excel_import_lines (
 workspace_id uuid NOT NULL, estimate_version_id uuid NOT NULL,
 ordinal integer NOT NULL CHECK(ordinal BETWEEN 0 AND 99),
 line_ref text NOT NULL CHECK(length(btrim(line_ref)) BETWEEN 1 AND 200),
 line_id uuid NOT NULL, section_ref text NOT NULL, source_ref text NOT NULL,
 included boolean NOT NULL, print boolean NOT NULL,
 PRIMARY KEY(workspace_id,estimate_version_id,line_ref),
 UNIQUE(workspace_id,estimate_version_id,ordinal), UNIQUE(workspace_id,estimate_version_id,line_id),
 FOREIGN KEY(workspace_id,estimate_version_id) REFERENCES ppo.excel_imports(workspace_id,estimate_version_id)
);
CREATE FUNCTION ppo.check_excel_import() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE i ppo.excel_imports%ROWTYPE; v ppo.estimate_versions%ROWTYPE; m record; l jsonb; expected_line jsonb;
BEGIN
 SELECT * INTO i FROM ppo.excel_imports WHERE workspace_id=NEW.workspace_id AND estimate_version_id=NEW.estimate_version_id;
 SELECT * INTO v FROM ppo.estimate_versions WHERE workspace_id=i.workspace_id AND id=i.estimate_version_id;
 IF v.version IS DISTINCT FROM 1 OR v.cost_schema_version IS DISTINCT FROM 2
 OR v.created_by IS DISTINCT FROM i.created_by OR v.reason IS DISTINCT FROM i.reason
 OR v.title IS DISTINCT FROM i.review#>>'{metadata,title}'
 OR v.cost_total IS DISTINCT FROM (i.review#>>'{totals,cost}')::numeric
 OR v.sell_total IS DISTINCT FROM (i.review#>>'{totals,sell}')::numeric
 OR v.scope IS DISTINCT FROM jsonb_build_object(
   'included',COALESCE(NULLIF(i.review#>>'{scope_comparison,0,proposed}',''),'None declared.'),
   'excluded',COALESCE(NULLIF(i.review#>>'{scope_comparison,1,proposed}',''),'None declared.'),
   'assumptions',COALESCE(NULLIF(i.review#>>'{scope_comparison,2,proposed}',''),'None declared.'))
 OR i.review#>>'{basis,workspace_id}' IS DISTINCT FROM i.estimating_workspace_id::text
 OR i.review#>>'{basis,company_id}' IS DISTINCT FROM i.company_id::text
 OR i.review#>>'{basis,actor_id}' IS DISTINCT FROM i.created_by::text
 OR i.review#>>'{basis,option_id}' IS DISTINCT FROM i.option_id::text
 OR i.review#>>'{basis,revision_id}' IS DISTINCT FROM i.revision_id::text
 OR NOT EXISTS(SELECT 1 FROM ppo.estimates e JOIN ppo.estimate_discovery_bases b
   ON (b.workspace_id,b.estimate_id)=(e.workspace_id,e.id)
   WHERE e.workspace_id=i.workspace_id AND e.id=i.estimate_id AND e.option_id=i.option_id
   AND b.estimate_version_id=i.estimate_version_id AND b.revision_id=i.revision_id)
 OR NOT EXISTS(SELECT 1 FROM ppo.operation_receipts r WHERE r.id=i.receipt_id
   AND r.record_id=i.estimate_id AND r.result->>'record_version'='1')
 OR NOT EXISTS(SELECT 1 FROM ppo.audit_events a WHERE a.id=i.audit_event_id AND a.workspace_id=i.workspace_id
   AND a.actor_id=i.created_by AND a.operation_id=i.operation_id AND a.object_type='Estimate'
   AND a.object_id=i.estimate_id AND a.details->>'command'='ExcelImport:Commit'
   AND a.details->>'saved_version_id'=i.estimate_version_id::text
   AND a.details#>>'{excel_import,review_hash}'=i.review_hash
   AND a.details#>>'{excel_import,source_sha256}'=i.source_key->>'sha256')
 OR NOT EXISTS(SELECT 1 FROM ppo.outbox_jobs j WHERE j.workspace_id=i.workspace_id
   AND j.actor_id=i.created_by AND j.operation_id=i.operation_id AND j.kind='EstimateCreated'
   AND j.payload->>'record_id'=i.estimate_id::text AND j.payload->>'record_version'='1')
 THEN RAISE EXCEPTION 'Workbook import must bind its exact native first version and accepted evidence' USING ERRCODE='23514'; END IF;
 IF jsonb_array_length(v.lines)<>jsonb_array_length(i.review->'lines')
 OR (SELECT count(*) FROM ppo.excel_import_lines WHERE workspace_id=i.workspace_id AND estimate_version_id=i.estimate_version_id)<>jsonb_array_length(v.lines)
 THEN RAISE EXCEPTION 'Workbook import requires every exact line mapping' USING ERRCODE='23514'; END IF;
 FOR m IN SELECT * FROM ppo.excel_import_lines WHERE workspace_id=i.workspace_id AND estimate_version_id=i.estimate_version_id LOOP
   l=i.review->'lines'->m.ordinal;
   expected_line=jsonb_build_object('id',m.line_id,'description',l->'description','category',l->'category',
     'allowance',l->'allowance','quantity',l->'quantity','unit',l->'unit','unit_cost',l->'unit_cost',
     'unit_sell',l->'unit_sell','source',l->'source_text','effective_date',l->'effective_date');
   IF v.lines->m.ordinal IS DISTINCT FROM expected_line OR m.line_ref IS DISTINCT FROM l->>'line_ref'
   OR m.section_ref IS DISTINCT FROM l->>'section_ref' OR m.source_ref IS DISTINCT FROM l->>'source_ref'
   OR to_jsonb(m.included) IS DISTINCT FROM l->'included' OR to_jsonb(m.print) IS DISTINCT FROM l->'print'
   OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(i.review->'sections') s WHERE s->>'section_ref'=m.section_ref)
   OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(i.review->'sources') s WHERE s->>'source_ref'=m.source_ref)
   THEN RAISE EXCEPTION 'Workbook line identity and section/source membership must match the reviewed native line' USING ERRCODE='23514'; END IF;
 END LOOP;
 RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER excel_import_complete AFTER INSERT ON ppo.excel_imports
 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_excel_import();
CREATE CONSTRAINT TRIGGER excel_line_complete AFTER INSERT ON ppo.excel_import_lines
 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_excel_import();
CREATE TRIGGER retained BEFORE UPDATE OR DELETE ON ppo.excel_imports FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE TRIGGER retained BEFORE UPDATE OR DELETE ON ppo.excel_import_lines FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

