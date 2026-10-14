-- BC-04 / EST-04/05 / XI-04/06/08: exact reviewed freight/duty allocation.
-- Nullable evidence preserves historical binding values and command shapes.
ALTER TABLE ppo.estimate_cost_source_bindings ADD COLUMN landed jsonb;
CREATE OR REPLACE FUNCTION ppo.cost_source_binding_guard()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
  OR line->>'unit'<>r.content->>'unit' OR (line->>'unit_cost')::numeric<>NEW.unit_cost OR (tier->>'unit_cost')::numeric<>COALESCE((NEW.landed->>'base_unit_cost')::numeric,NEW.unit_cost) OR (tier->>'minimum_quantity')::numeric<>NEW.tier_minimum_quantity
  OR line->>'effective_date'<>r.content->>'source_date' OR line->>'source'<>s.reference||' / r'||r.revision::text||' / '||(r.content->>'evidence_reference')
  OR NEW.pricing_date<(r.content->>'effective_from')::date OR (r.content->>'valid_until' IS NOT NULL AND NEW.pricing_date>(r.content->>'valid_until')::date) THEN
  RAISE EXCEPTION 'The exact reviewed source, tier, dates and saved cost line must agree' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $function$;


CREATE FUNCTION ppo.landed_expected_allocations(charge jsonb, bindings jsonb, lines jsonb)
RETURNS jsonb LANGUAGE sql IMMUTABLE AS $$
 WITH targets AS (
  SELECT l->>'id' AS id,(l->>'quantity')::numeric AS quantity,
   CASE charge->>'allocation' WHEN 'Quantity' THEN (l->>'quantity')::numeric
    WHEN 'BaseCost' THEN (b#>>'{landed,base_cost}')::numeric ELSE 1 END AS weight
  FROM jsonb_array_elements(lines) l JOIN jsonb_array_elements(bindings) b ON b->>'line_id'=l->>'id'
  WHERE charge->'line_ids' ? (l->>'id')
 ), weighted AS (
  SELECT *,sum(weight) OVER () AS total_weight FROM targets
 ), parts AS (
  SELECT *,floor((charge->>'amount')::numeric*100*weight/NULLIF(total_weight,0)) AS cents,
   mod((charge->>'amount')::numeric*100*weight,NULLIF(total_weight,0)) AS remainder FROM weighted
 ), ranked AS (
  SELECT *,row_number() OVER (ORDER BY remainder DESC,id COLLATE "C") AS rank,
   (charge->>'amount')::numeric*100-sum(cents) OVER () AS residual FROM parts
 ) SELECT jsonb_agg(jsonb_build_object('line_id',id,'amount',trim(to_char(
  CASE charge->>'basis' WHEN 'Unit' THEN round(quantity*(charge->>'amount')::numeric,2)
   WHEN 'Line' THEN (charge->>'amount')::numeric
   ELSE (cents+CASE WHEN rank<=residual THEN 1 ELSE 0 END)/100 END,'9999999999999990.00'))) ORDER BY id COLLATE "C") FROM ranked
$$;

CREATE FUNCTION ppo.landed_binding_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v ppo.estimate_versions; line jsonb; prior_line jsonb; prior ppo.estimate_cost_source_bindings; f jsonb; total numeric;
BEGIN
 IF NEW.landed IS NULL THEN RETURN NEW; END IF;
 f:=NEW.landed;
 SELECT * INTO v FROM ppo.estimate_versions WHERE workspace_id=NEW.workspace_id AND id=NEW.estimate_version_id;
 SELECT x INTO line FROM jsonb_array_elements(v.lines) x WHERE x->>'id'=NEW.line_id::text;
 SELECT sum((x->>'amount')::numeric) INTO total FROM jsonb_array_elements(f->'charges') x;
 IF (jsonb_typeof(f)='object' AND f-ARRAY['policy','base_unit_cost','base_cost','allocated_cost','landed_cost','charges']='{}'::jsonb
  AND f->>'policy'='SYN-EST-LANDED-01' AND line->>'category'='Product'
  AND f->>'base_unit_cost' ~ '^(0|[1-9][0-9]*)\.[0-9]{2}$'
  AND (f->>'base_cost')::numeric=round((line->>'quantity')::numeric*(f->>'base_unit_cost')::numeric,2)
  AND (f->>'allocated_cost')::numeric=total AND total>=0
  AND (f->>'landed_cost')::numeric=(f->>'base_cost')::numeric+total
  AND (f->>'landed_cost')::numeric=round((line->>'quantity')::numeric*NEW.unit_cost,2)
  AND jsonb_array_length(f->'charges') BETWEEN 1 AND 20
  AND (SELECT count(DISTINCT x->>'id') FROM jsonb_array_elements(f->'charges') x)=jsonb_array_length(f->'charges')
  AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(f->'charges') x WHERE
    (x-ARRAY['id','amount']='{}'::jsonb AND x->>'id' ~ '^[a-f0-9-]{36}$' AND x->>'amount' ~ '^(0|[1-9][0-9]*)\.[0-9]{2}$') IS NOT TRUE)) IS NOT TRUE THEN
  RAISE EXCEPTION 'Landed binding must reconcile exact base, charge and native line cents' USING ERRCODE='23514';
 END IF;
 SELECT * INTO prior FROM ppo.estimate_cost_source_bindings WHERE workspace_id=NEW.workspace_id AND estimate_version_id=v.predecessor_id AND line_id=NEW.line_id;
 SELECT x INTO prior_line FROM ppo.estimate_versions prior_version,jsonb_array_elements(prior_version.lines) x WHERE prior_version.workspace_id=NEW.workspace_id AND prior_version.id=v.predecessor_id AND x->>'id'=NEW.line_id::text;
 IF (to_jsonb(prior)-ARRAY['estimate_version_id','created_by','created_at'])=(to_jsonb(NEW)-ARRAY['estimate_version_id','created_by','created_at'])
  AND prior_line->>'quantity'=line->>'quantity' AND prior_line->>'unit'=line->>'unit'
  AND prior_line->>'source'=line->>'source' AND prior_line->>'effective_date'=line->>'effective_date'
  AND prior_line->>'unit_cost'=line->>'unit_cost' THEN RETURN NEW; END IF;
 IF NOT EXISTS(SELECT 1 FROM ppo.excel_source_pricings p,jsonb_array_elements(p.review#>'{comparison,bindings}') b
   WHERE p.workspace_id=NEW.workspace_id AND p.estimate_version_id=NEW.estimate_version_id
    AND b->>'line_id'=NEW.line_id::text AND b->'landed'=f) THEN
  RAISE EXCEPTION 'New landed bindings require atomic accepted Excel pricing evidence' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER source_landed_binding AFTER INSERT ON ppo.estimate_cost_source_bindings DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.landed_binding_guard();

CREATE FUNCTION ppo.excel_landed_pricing_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE proposal jsonb:=NEW.review#>'{proposal,landed_costs}'; doc jsonb:=NEW.review#>'{comparison,landed_costs}';
 bindings jsonb:=NEW.review#>'{comparison,bindings}'; lines jsonb:=NEW.review#>'{comparison,lines}';
 charge_input jsonb; actual jsonb; allocations jsonb; binding_input jsonb; evidence jsonb; total numeric:=0; subtotal numeric;
BEGIN
 IF EXISTS(SELECT 1 FROM ppo.estimate_cost_source_bindings prior_binding WHERE prior_binding.workspace_id=NEW.workspace_id AND prior_binding.estimate_version_id=NEW.predecessor_id
  AND prior_binding.landed IS NOT NULL AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(bindings) b WHERE b->>'line_id'=prior_binding.line_id::text)) THEN
  RAISE EXCEPTION 'Compare every currently landed line together' USING ERRCODE='23514';
 END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(bindings) b JOIN ppo.estimate_cost_source_bindings saved
  ON saved.workspace_id=NEW.workspace_id AND saved.estimate_version_id=NEW.estimate_version_id AND saved.line_id=(b->>'line_id')::uuid
  WHERE saved.landed IS DISTINCT FROM b->'landed') THEN
  RAISE EXCEPTION 'Retain exact landed binding evidence' USING ERRCODE='23514';
 END IF;
 IF proposal IS NULL THEN
  IF doc IS NOT NULL OR EXISTS(SELECT 1 FROM jsonb_array_elements(bindings) b WHERE b ? 'landed') THEN
   RAISE EXCEPTION 'Explicit landed proposal required' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
 END IF;
 IF (proposal->>'policy'='SYN-EST-LANDED-01' AND proposal->>'currency'='AUD'
   AND proposal->'exclusive_cost_basis_confirmed'='true'::jsonb AND doc->'proposal'=proposal
   AND jsonb_array_length(proposal->'charges') BETWEEN 1 AND 20
   AND jsonb_array_length(doc->'charges')=jsonb_array_length(proposal->'charges')
   AND (SELECT count(DISTINCT x->>'id') FROM jsonb_array_elements(proposal->'charges') x)=jsonb_array_length(proposal->'charges')
   AND (SELECT count(DISTINCT (x->>'kind')||':'||lower(x->>'evidence_reference')) FROM jsonb_array_elements(proposal->'charges') x)=jsonb_array_length(proposal->'charges')
   AND (SELECT sum(jsonb_array_length(x->'line_ids')) FROM jsonb_array_elements(proposal->'charges') x)<=2000
   AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(lines) l WHERE l->>'category'='Freight' AND (l->>'unit_cost')::numeric>0)) IS NOT TRUE THEN
  RAISE EXCEPTION 'Exact exclusive bounded landed proposal required' USING ERRCODE='23514';
 END IF;
 FOR charge_input IN SELECT x FROM jsonb_array_elements(proposal->'charges') x LOOP
  IF (charge_input->>'kind' IN ('Freight','Duty') AND charge_input->>'basis' IN ('Unit','Line','Shipment')
   AND charge_input->>'amount' ~ '^(0|[1-9][0-9]*)\.[0-9]{2}$' AND (charge_input->>'amount')::numeric BETWEEN 0 AND 1000000
   AND (charge_input->>'effective_date')::date<=(NEW.review#>>'{proposal,pricing_date}')::date
   AND length(btrim(charge_input->>'evidence_reference')) BETWEEN 1 AND 200 AND length(btrim(charge_input->>'evidence_excerpt')) BETWEEN 1 AND 1000
   AND jsonb_array_length(charge_input->'line_ids') BETWEEN 1 AND 500
   AND (SELECT count(DISTINCT x) FROM jsonb_array_elements_text(charge_input->'line_ids') x)=jsonb_array_length(charge_input->'line_ids')
   AND (charge_input->>'basis'<>'Line' OR jsonb_array_length(charge_input->'line_ids')=1)
   AND (charge_input->>'basis'<>'Shipment' OR charge_input->>'allocation' IN ('Equal','Quantity','BaseCost'))
   AND (charge_input->>'basis'='Shipment' OR charge_input->'allocation'='null'::jsonb)
   AND (SELECT count(*) FROM jsonb_array_elements(bindings) b JOIN jsonb_array_elements(lines) l ON l->>'id'=b->>'line_id'
     WHERE charge_input->'line_ids' ? (b->>'line_id') AND b ? 'landed' AND l->>'category'='Product')=jsonb_array_length(charge_input->'line_ids')
   AND (NOT (charge_input->>'basis'='Unit' OR charge_input->>'allocation'='Quantity') OR
    (SELECT count(DISTINCT l->>'unit') FROM jsonb_array_elements(lines) l WHERE charge_input->'line_ids' ? (l->>'id'))=1)) IS NOT TRUE THEN
   RAISE EXCEPTION 'Valid exact charge basis, targets and evidence required' USING ERRCODE='23514';
  END IF;
  allocations:=ppo.landed_expected_allocations(charge_input,bindings,lines);
  SELECT x INTO actual FROM jsonb_array_elements(doc->'charges') x WHERE x->>'charge_id'=charge_input->>'id';
  SELECT sum((x->>'amount')::numeric) INTO subtotal FROM jsonb_array_elements(allocations) x;
  IF actual->'allocations' IS DISTINCT FROM allocations OR (actual->>'total')::numeric IS DISTINCT FROM subtotal
    OR subtotal IS NULL OR (charge_input->>'basis'<>'Unit' AND subtotal IS DISTINCT FROM (charge_input->>'amount')::numeric) THEN
   RAISE EXCEPTION 'Charge cents must follow exact allocation and reconcile' USING ERRCODE='23514';
  END IF;
  total:=total+subtotal;
 END LOOP;
 IF (doc->>'total')::numeric IS DISTINCT FROM total OR jsonb_array_length(doc->'bindings') IS DISTINCT FROM
  (SELECT count(*) FROM jsonb_array_elements(bindings) b WHERE b ? 'landed') THEN
  RAISE EXCEPTION 'Landed allocation total and membership must reconcile' USING ERRCODE='23514';
 END IF;
 FOR binding_input IN SELECT x FROM jsonb_array_elements(bindings) x WHERE x ? 'landed' LOOP
  SELECT jsonb_agg(jsonb_build_object('id',c->>'charge_id','amount',a->>'amount') ORDER BY c->>'charge_id') INTO allocations
   FROM jsonb_array_elements(doc->'charges') c,jsonb_array_elements(c->'allocations') a WHERE a->>'line_id'=binding_input->>'line_id';
  SELECT x INTO evidence FROM jsonb_array_elements(doc->'bindings') x WHERE x->>'line_id'=binding_input->>'line_id';
  IF binding_input#>'{landed,charges}' IS DISTINCT FROM allocations OR evidence->'landed' IS DISTINCT FROM binding_input->'landed'
   OR evidence->>'unit_cost' IS DISTINCT FROM binding_input->>'unit_cost' THEN
   RAISE EXCEPTION 'Each landed line must retain its exact charge allocation' USING ERRCODE='23514';
  END IF;
 END LOOP;
 RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER excel_landed_pricing AFTER INSERT ON ppo.excel_source_pricings DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.excel_landed_pricing_guard();
