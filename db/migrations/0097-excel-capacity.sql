-- PPO-010 / XI-03/04/06/07/08: bounded Excel capacity, preserving native 100-line APIs.
ALTER TABLE ppo.estimate_versions DROP CONSTRAINT estimate_versions_lines_check;
ALTER TABLE ppo.estimate_versions ADD CONSTRAINT estimate_versions_lines_check
 CHECK(jsonb_typeof(lines)='array' AND jsonb_array_length(lines)<=500);
ALTER TABLE ppo.excel_import_lines DROP CONSTRAINT excel_import_lines_ordinal_check;
ALTER TABLE ppo.excel_import_lines ADD CONSTRAINT excel_import_lines_ordinal_check CHECK(ordinal BETWEEN 0 AND 499);
ALTER TABLE ppo.excel_imports DROP CONSTRAINT excel_imports_review_check;
ALTER TABLE ppo.excel_imports ADD CONSTRAINT excel_imports_review_check CHECK((review->>'validation_passed'='true' AND review->>'state'='ReviewRequired'
   AND review->>'synthetic'='true' AND review#>>'{basis,expected_estimate_version}'='0'
   AND review->>'mapping_version'='PPO-EXCEL-REVIEW-1'
   AND jsonb_array_length(review->'lines') BETWEEN 1 AND CASE WHEN review->>'capacity_version'='PPO-EXCEL-CAPACITY-1' THEN 500 ELSE 100 END
   AND (review#>>'{file,bytes}')::integer BETWEEN 1 AND 5242880) IS TRUE);
ALTER TABLE ppo.excel_reimports DROP CONSTRAINT excel_reimports_review_check;
ALTER TABLE ppo.excel_reimports ADD CONSTRAINT excel_reimports_review_check CHECK((review->>'validation_passed'='true' AND review->>'state'='ReviewRequired'
   AND review->>'synthetic'='true' AND (review#>>'{basis,expected_estimate_version}')::integer>0
   AND review->>'mapping_version'='PPO-EXCEL-REVIEW-1'
   AND jsonb_array_length(review->'lines') BETWEEN 1 AND CASE WHEN review->>'capacity_version'='PPO-EXCEL-CAPACITY-1' THEN 500 ELSE 100 END
   AND (review#>>'{file,bytes}')::integer BETWEEN 1 AND 5242880) IS TRUE);
ALTER TABLE ppo.excel_reimports DROP CONSTRAINT excel_reimports_decisions_check;
ALTER TABLE ppo.excel_reimports ADD CONSTRAINT excel_reimports_decisions_check
 CHECK(jsonb_typeof(decisions)='array' AND jsonb_array_length(decisions)<=500);
ALTER TABLE ppo.excel_reimports DROP CONSTRAINT excel_reimports_projection_check;
ALTER TABLE ppo.excel_reimports ADD CONSTRAINT excel_reimports_projection_check
 CHECK(jsonb_typeof(projection)='array' AND jsonb_array_length(projection) BETWEEN 1 AND
 CASE WHEN review->>'capacity_version'='PPO-EXCEL-CAPACITY-1' THEN 500 ELSE 100 END);

-- The native row envelope is larger only for accepted Excel operations, whose existing
-- deferred graph checks still bind exact projections, audit, receipt, totals and provenance.
CREATE FUNCTION ppo.check_excel_capacity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF jsonb_array_length(NEW.lines)>100 AND NOT EXISTS(
   SELECT 1 FROM ppo.excel_import_history i WHERE i.workspace_id=NEW.workspace_id
   AND i.estimate_version_id=NEW.id AND i.review->>'capacity_version'='PPO-EXCEL-CAPACITY-1'
 ) THEN RAISE EXCEPTION 'Large estimates require accepted Excel capacity evidence' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER excel_capacity AFTER INSERT ON ppo.estimate_versions
 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_excel_capacity();

-- The import header verifies completeness once. Each immutable line verifies its own
-- exact membership; unique ordinal/key constraints prevent later additions to a complete import.
CREATE FUNCTION ppo.check_excel_import_line() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE i ppo.excel_imports%ROWTYPE; v ppo.estimate_versions%ROWTYPE; l jsonb; expected_line jsonb;
BEGIN
 SELECT * INTO i FROM ppo.excel_imports WHERE workspace_id=NEW.workspace_id AND estimate_version_id=NEW.estimate_version_id;
 SELECT * INTO v FROM ppo.estimate_versions WHERE workspace_id=i.workspace_id AND id=i.estimate_version_id;
 l=i.review->'lines'->NEW.ordinal;
 expected_line=jsonb_build_object('id',NEW.line_id,'description',l->'description','category',l->'category',
   'allowance',l->'allowance','quantity',l->'quantity','unit',l->'unit','unit_cost',l->'unit_cost',
   'unit_sell',l->'unit_sell','source',l->'source_text','effective_date',l->'effective_date');
 IF l IS NULL OR v.lines->NEW.ordinal IS DISTINCT FROM expected_line
 OR NEW.line_ref IS DISTINCT FROM l->>'line_ref' OR NEW.section_ref IS DISTINCT FROM l->>'section_ref'
 OR NEW.source_ref IS DISTINCT FROM l->>'source_ref'
 OR to_jsonb(NEW.included) IS DISTINCT FROM l->'included' OR to_jsonb(NEW.print) IS DISTINCT FROM l->'print'
 OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(i.review->'sections') s WHERE s->>'section_ref'=NEW.section_ref)
 OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(i.review->'sources') s WHERE s->>'source_ref'=NEW.source_ref)
 THEN RAISE EXCEPTION 'Workbook line must match its exact reviewed membership' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
DROP TRIGGER excel_line_complete ON ppo.excel_import_lines;
CREATE CONSTRAINT TRIGGER excel_line_complete AFTER INSERT ON ppo.excel_import_lines
 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.check_excel_import_line();
