-- PPO-010 / EST-04/05 / XI-04/06/08: exact reviewed pricing successors, not uploads.
CREATE TABLE ppo.excel_source_pricings (
 workspace_id uuid NOT NULL, company_id uuid NOT NULL, estimate_id uuid NOT NULL,
 estimate_version_id uuid PRIMARY KEY, predecessor_id uuid NOT NULL, import_version_id uuid NOT NULL,
 operation_id uuid NOT NULL, receipt_id uuid NOT NULL, audit_event_id uuid NOT NULL,
 review jsonb NOT NULL, canonical_review text NOT NULL, review_hash text NOT NULL CHECK(review_hash ~ '^[a-f0-9]{64}$'),
 created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 1000),
 synthetic boolean NOT NULL DEFAULT true CHECK(synthetic),
 UNIQUE(workspace_id,estimate_version_id), UNIQUE(workspace_id,created_by,operation_id),
 FOREIGN KEY(workspace_id,company_id,estimate_version_id) REFERENCES ppo.estimate_versions(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,estimate_id,estimate_version_id) REFERENCES ppo.estimate_versions(workspace_id,estimate_id,id),
 FOREIGN KEY(workspace_id,estimate_id,predecessor_id) REFERENCES ppo.estimate_versions(workspace_id,estimate_id,id),
 FOREIGN KEY(workspace_id,estimate_id,import_version_id) REFERENCES ppo.estimate_versions(workspace_id,estimate_id,id),
 FOREIGN KEY(workspace_id,created_by,operation_id,receipt_id) REFERENCES ppo.operation_receipts(workspace_id,actor_id,operation_id,id) DEFERRABLE INITIALLY DEFERRED,
 FOREIGN KEY(audit_event_id) REFERENCES ppo.audit_events(id) DEFERRABLE INITIALLY DEFERRED,
 CHECK((canonical_review::jsonb=review-'review_hash' AND review->>'review_hash'=review_hash
   AND review_hash=encode(sha256(convert_to(canonical_review,'UTF8')),'hex')
   AND review->>'pricing_version'='PPO-EXCEL-SOURCE-PRICING-1'
   AND review->>'actor_id'=created_by::text AND review->>'import_version_id'=import_version_id::text
   AND review#>>'{proposal,estimate_version_id}'=predecessor_id::text
   AND jsonb_array_length(review#>'{proposal,selections}') BETWEEN 1 AND 500) IS TRUE)
);
CREATE FUNCTION ppo.check_excel_source_pricing() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v ppo.estimate_versions; old ppo.estimate_versions; origin record; item record;
 choice jsonb; binding jsonb; change jsonb; actual ppo.estimate_cost_source_bindings;
 workbook_entry jsonb; workbook_original jsonb; workbook_line_ref text;
 old_binding ppo.estimate_cost_source_bindings; source ppo.cost_source_revisions; header ppo.cost_sources;
BEGIN
 SELECT * INTO v FROM ppo.estimate_versions WHERE workspace_id=NEW.workspace_id AND id=NEW.estimate_version_id;
 SELECT * INTO old FROM ppo.estimate_versions WHERE workspace_id=NEW.workspace_id AND id=NEW.predecessor_id;
 SELECT * INTO origin FROM ppo.excel_import_history WHERE workspace_id=NEW.workspace_id AND estimate_id=NEW.estimate_id AND estimate_version_id=NEW.import_version_id;
 IF origin.estimate_version_id IS NULL
 OR (SELECT xmin::text::numeric FROM ppo.estimate_versions WHERE workspace_id=NEW.workspace_id AND id=v.id)<>(pg_current_xact_id()::text::numeric % 4294967296)
 OR v.predecessor_id IS DISTINCT FROM old.id OR v.version IS DISTINCT FROM old.version+1
 OR v.created_by IS DISTINCT FROM NEW.created_by OR v.reason IS DISTINCT FROM NEW.reason
 OR v.title IS DISTINCT FROM old.title OR v.scope IS DISTINCT FROM old.scope OR v.policy IS DISTINCT FROM old.policy
 OR v.cost_schema_version IS DISTINCT FROM old.cost_schema_version
 OR v.lines IS DISTINCT FROM NEW.review#>'{comparison,lines}'
 OR v.cost_total IS DISTINCT FROM (NEW.review#>>'{comparison,after,cost}')::numeric
 OR v.sell_total IS DISTINCT FROM old.sell_total
 OR old.content_hash IS DISTINCT FROM NEW.review#>>'{comparison,estimate_hash}'
 OR old.id::text IS DISTINCT FROM NEW.review#>>'{comparison,estimate_version_id}'
 OR NEW.estimate_id::text IS DISTINCT FROM NEW.review#>>'{comparison,estimate_id}'
 OR NEW.review->>'import_review_hash' IS DISTINCT FROM origin.review_hash
 OR NEW.review->'workbook' IS DISTINCT FROM origin.review->'file'
 OR NOT (old.id=NEW.import_version_id OR EXISTS(SELECT 1 FROM ppo.excel_source_pricings p
   WHERE p.workspace_id=NEW.workspace_id AND p.estimate_version_id=old.id AND p.import_version_id=NEW.import_version_id))
 OR NOT EXISTS(SELECT 1 FROM ppo.estimate_discovery_bases b JOIN ppo.estimate_discovery_bases prior
   ON (prior.workspace_id,prior.revision_id)=(b.workspace_id,b.revision_id)
   WHERE b.workspace_id=NEW.workspace_id AND b.estimate_version_id=v.id AND prior.estimate_version_id=old.id)
 OR NOT EXISTS(SELECT 1 FROM ppo.operation_receipts r WHERE r.id=NEW.receipt_id AND r.record_id=NEW.estimate_id
   AND r.result->>'record_version'=v.version::text)
 OR NOT EXISTS(SELECT 1 FROM ppo.audit_events a WHERE a.id=NEW.audit_event_id AND a.workspace_id=NEW.workspace_id
   AND a.actor_id=NEW.created_by AND a.operation_id=NEW.operation_id AND a.object_type='Estimate' AND a.object_id=NEW.estimate_id
   AND a.details->>'command'='ExcelImport:PriceSources' AND a.details->>'saved_version_id'=v.id::text
   AND a.details#>>'{excel_pricing,review_hash}'=NEW.review_hash)
 OR NOT EXISTS(SELECT 1 FROM ppo.outbox_jobs j WHERE j.workspace_id=NEW.workspace_id AND j.actor_id=NEW.created_by
   AND j.operation_id=NEW.operation_id AND j.kind='EstimateVersionSaved' AND j.payload->>'record_id'=NEW.estimate_id::text
   AND j.payload->>'record_version'=v.version::text)
 THEN RAISE EXCEPTION 'Excel pricing must bind its exact native successor, import and accepted evidence' USING ERRCODE='23514'; END IF;
 IF jsonb_array_length(v.lines)<>jsonb_array_length(old.lines)
 OR jsonb_array_length(NEW.review#>'{proposal,selections}')<>jsonb_array_length(NEW.review#>'{comparison,bindings}')
 OR jsonb_array_length(NEW.review#>'{proposal,selections}')<>jsonb_array_length(NEW.review#>'{comparison,changes}')
 OR jsonb_array_length(NEW.review#>'{proposal,selections}')<>jsonb_array_length(NEW.review->'workbook_values')
 OR jsonb_array_length(NEW.review#>'{proposal,selections}')<>(SELECT count(DISTINCT x->>'line_id') FROM jsonb_array_elements(NEW.review#>'{proposal,selections}') x)
 OR EXISTS(SELECT 1 FROM jsonb_array_elements(NEW.review#>'{proposal,selections}') x
   WHERE NOT EXISTS(SELECT 1 FROM jsonb_array_elements(v.lines) l WHERE l->>'id'=x->>'line_id'))
 THEN RAISE EXCEPTION 'Excel pricing requires exact distinct current lines and bindings' USING ERRCODE='23514'; END IF;
 FOR item IN SELECT value,ordinality FROM jsonb_array_elements(v.lines) WITH ORDINALITY LOOP
   SELECT x INTO choice FROM jsonb_array_elements(NEW.review#>'{proposal,selections}') x WHERE x->>'line_id'=item.value->>'id';
   SELECT * INTO actual FROM ppo.estimate_cost_source_bindings WHERE workspace_id=NEW.workspace_id AND estimate_version_id=v.id AND line_id=(item.value->>'id')::uuid;
   SELECT * INTO old_binding FROM ppo.estimate_cost_source_bindings WHERE workspace_id=NEW.workspace_id AND estimate_version_id=old.id AND line_id=(item.value->>'id')::uuid;
   IF choice IS NULL THEN
     IF item.value IS DISTINCT FROM old.lines->(item.ordinality::integer-1)
       OR (to_jsonb(actual)-ARRAY['estimate_version_id','created_by','created_at']) IS DISTINCT FROM
          (to_jsonb(old_binding)-ARRAY['estimate_version_id','created_by','created_at'])
     THEN RAISE EXCEPTION 'Unselected Excel prices and bindings must be preserved' USING ERRCODE='23514'; END IF;
   ELSE
     SELECT x INTO binding FROM jsonb_array_elements(NEW.review#>'{comparison,bindings}') x WHERE x->>'line_id'=item.value->>'id';
     SELECT x INTO change FROM jsonb_array_elements(NEW.review#>'{comparison,changes}') x WHERE x->>'line_id'=item.value->>'id';
     SELECT * INTO source FROM ppo.cost_source_revisions WHERE workspace_id=NEW.workspace_id AND id=(choice->>'revision_id')::uuid;
     SELECT * INTO header FROM ppo.cost_sources WHERE workspace_id=NEW.workspace_id AND id=source.source_id;
     SELECT line_ref INTO workbook_line_ref FROM ppo.excel_line_history
       WHERE workspace_id=NEW.workspace_id AND estimate_version_id=NEW.import_version_id AND line_id=(item.value->>'id')::uuid;
     SELECT x INTO workbook_original FROM jsonb_array_elements(origin.review->'lines') x WHERE x->>'line_ref'=workbook_line_ref;
     SELECT x INTO workbook_entry FROM jsonb_array_elements(NEW.review->'workbook_values') x WHERE x->>'line_id'=item.value->>'id';
     IF binding IS NULL OR change IS NULL OR actual.line_id IS NULL OR workbook_entry IS NULL
     OR workbook_entry->>'line_ref' IS DISTINCT FROM workbook_line_ref
     OR workbook_entry->'original' IS DISTINCT FROM COALESCE(workbook_original,'null'::jsonb)
     OR (item.value-ARRAY['unit_cost','source','effective_date']) IS DISTINCT FROM ((old.lines->(item.ordinality::integer-1))-ARRAY['unit_cost','source','effective_date'])
     OR change->'old' IS DISTINCT FROM old.lines->(item.ordinality::integer-1) OR change->'new' IS DISTINCT FROM item.value
     OR header.company_id IS DISTINCT FROM NEW.company_id OR header.id::text IS DISTINCT FROM choice->>'source_id'
     OR header.version IS DISTINCT FROM (choice->>'expected_source_version')::integer
     OR source.content_hash IS DISTINCT FROM change->>'source_hash'
     OR binding->>'source_id' IS DISTINCT FROM header.id::text
     OR binding->>'pricing_date' IS DISTINCT FROM NEW.review#>>'{proposal,pricing_date}'
     OR actual.source_revision_id IS DISTINCT FROM source.id
     OR actual.source_revision_id::text IS DISTINCT FROM binding->>'source_revision_id'
     OR actual.review_event_id::text IS DISTINCT FROM binding->>'review_event_id'
     OR actual.pricing_date IS DISTINCT FROM (NEW.review#>>'{proposal,pricing_date}')::date
     OR actual.unit_cost IS DISTINCT FROM (binding->>'unit_cost')::numeric
     OR actual.tier_minimum_quantity IS DISTINCT FROM (binding->>'tier_minimum_quantity')::numeric
     THEN RAISE EXCEPTION 'Excel pricing must preserve originals and exact reviewed source bindings' USING ERRCODE='23514'; END IF;
   END IF;
 END LOOP;
 RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER excel_source_pricing_complete AFTER INSERT ON ppo.excel_source_pricings
 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_excel_source_pricing();
CREATE TRIGGER retained BEFORE UPDATE OR DELETE ON ppo.excel_source_pricings FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();
CREATE OR REPLACE FUNCTION ppo.check_excel_capacity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF jsonb_array_length(NEW.lines)>100 AND NOT EXISTS(
   SELECT 1 FROM ppo.excel_import_history i WHERE i.workspace_id=NEW.workspace_id
   AND i.estimate_version_id=NEW.id AND i.review->>'capacity_version'='PPO-EXCEL-CAPACITY-1'
 ) AND NOT EXISTS(SELECT 1 FROM ppo.excel_source_pricings p WHERE p.workspace_id=NEW.workspace_id AND p.estimate_version_id=NEW.id)
 THEN RAISE EXCEPTION 'Large estimates require accepted Excel capacity evidence' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
