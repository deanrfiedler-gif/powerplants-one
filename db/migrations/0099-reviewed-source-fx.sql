-- PPO-010 / EST-04/05/07 / XI-04/06/08: retained foreign supplier evidence.
-- No original rows, hashes, identities, grants or source snapshots are changed.
CREATE FUNCTION ppo.cost_source_fx_revision_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE f jsonb; prior jsonb; t record; a jsonb; previous numeric:=0; price numeric;
BEGIN
 IF NEW.predecessor_id IS NOT NULL THEN
  SELECT content INTO prior FROM ppo.cost_source_revisions WHERE workspace_id=NEW.workspace_id AND id=NEW.predecessor_id;
  IF (prior ? 'fx') IS DISTINCT FROM (NEW.content ? 'fx')
    OR prior#>>'{fx,currency}' IS DISTINCT FROM NEW.content#>>'{fx,currency}' THEN
   RAISE EXCEPTION 'Retain original source currency and domestic/FX profile' USING ERRCODE='23514';
  END IF;
 END IF;
 IF NOT NEW.content ? 'fx' THEN RETURN NEW; END IF;
 f:=NEW.content->'fx';
 IF (jsonb_typeof(f)='object' AND f-'policy'-'currency'-'rate'-'rate_date'-'effective_from'-'valid_until'-'evidence_reference'-'evidence_excerpt'-'tiers'='{}'::jsonb
  AND f->>'policy'='SYN-EST-FX-01' AND f->>'currency' IN ('USD','EUR','GBP','NZD','CAD','CNY')
  AND f->>'rate' ~ '^(0|[1-9][0-9]*)\.[0-9]{6}$' AND (f->>'rate')::numeric>0 AND (f->>'rate')::numeric<=1000000
  AND f->>'rate_date' ~ '^\d{4}-\d{2}-\d{2}$' AND f->>'effective_from' ~ '^\d{4}-\d{2}-\d{2}$' AND f->>'valid_until' ~ '^\d{4}-\d{2}-\d{2}$'
  AND (f->>'rate_date')::date<=(f->>'effective_from')::date AND (f->>'valid_until')::date>=(f->>'effective_from')::date
  AND length(btrim(f->>'evidence_reference')) BETWEEN 1 AND 300 AND length(btrim(f->>'evidence_excerpt')) BETWEEN 1 AND 2000
  AND jsonb_typeof(f->'tiers')='array' AND jsonb_array_length(f->'tiers') BETWEEN 1 AND 20
  AND jsonb_array_length(f->'tiers')=jsonb_array_length(NEW.content->'tiers')) IS NOT TRUE THEN
  RAISE EXCEPTION 'Exact bounded foreign prices, rate, dates and evidence required' USING ERRCODE='23514';
 END IF;
 FOR t IN SELECT value,ordinality FROM jsonb_array_elements(f->'tiers') WITH ORDINALITY LOOP
  a:=NEW.content->'tiers'->(t.ordinality::integer-1);
  IF (t.value-'minimum_quantity'-'unit_cost'='{}'::jsonb
    AND t.value->>'minimum_quantity' ~ '^(0|[1-9][0-9]*)\.[0-9]{3}$'
    AND (t.value->>'minimum_quantity')::numeric>previous AND (t.value->>'minimum_quantity')::numeric<=100000
    AND t.value->>'unit_cost' ~ '^(0|[1-9][0-9]*)\.[0-9]{6}$'
    AND (t.value->>'unit_cost')::numeric BETWEEN 0 AND 1000000) IS NOT TRUE THEN
   RAISE EXCEPTION 'Exact increasing foreign supplier tiers required' USING ERRCODE='23514';
  END IF;
  previous:=(t.value->>'minimum_quantity')::numeric;
  price:=round((t.value->>'unit_cost')::numeric*(f->>'rate')::numeric,2);
  IF price>1000000 OR a->>'minimum_quantity' IS DISTINCT FROM t.value->>'minimum_quantity'
   OR (a->>'unit_cost')::numeric IS DISTINCT FROM price THEN
   RAISE EXCEPTION 'AUD source tiers must equal unit-first HALF_UP FX conversion' USING ERRCODE='23514';
  END IF;
 END LOOP;
 RETURN NEW;
END $$;
CREATE TRIGGER source_fx_revision BEFORE INSERT ON ppo.cost_source_revisions FOR EACH ROW EXECUTE FUNCTION ppo.cost_source_fx_revision_guard();

CREATE FUNCTION ppo.cost_source_fx_review_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE f jsonb; evidence jsonb;
BEGIN
 IF NEW.action<>'Reviewed' THEN RETURN NEW; END IF;
 SELECT content->'fx' INTO f FROM ppo.cost_source_revisions WHERE workspace_id=NEW.workspace_id AND id=NEW.revision_id;
 IF f IS NULL THEN RETURN NEW; END IF;
 SELECT details->'fx_review' INTO evidence FROM ppo.audit_events
  WHERE workspace_id=NEW.workspace_id AND actor_id=NEW.created_by AND operation_id=NEW.operation_id
   AND object_type='CostSource' AND object_id=NEW.source_id AND outcome='Accepted'
   AND details->>'command'='ReviewCostSource' AND details->>'event_id'=NEW.id::text
   AND details->>'source_revision_id'=NEW.revision_id::text;
 IF (evidence->'conversion'=f AND (evidence->>'canonical')::jsonb=f
   AND evidence->>'hash'=encode(sha256(convert_to(evidence->>'canonical','UTF8')),'hex')) IS NOT TRUE THEN
  RAISE EXCEPTION 'Independent review must retain exact FX confirmation evidence' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER source_fx_review AFTER INSERT ON ppo.cost_source_events DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.cost_source_fx_review_guard();

CREATE FUNCTION ppo.cost_source_fx_binding_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE f jsonb;
BEGIN
 SELECT content->'fx' INTO f FROM ppo.cost_source_revisions WHERE workspace_id=NEW.workspace_id AND id=NEW.source_revision_id;
 IF f IS NOT NULL AND (NEW.pricing_date BETWEEN (f->>'effective_from')::date AND (f->>'valid_until')::date) IS NOT TRUE THEN
  RAISE EXCEPTION 'An FX binding must use its recorded rate validity' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER source_fx_binding BEFORE INSERT ON ppo.estimate_cost_source_bindings FOR EACH ROW EXECUTE FUNCTION ppo.cost_source_fx_binding_guard();

CREATE FUNCTION ppo.excel_source_fx_pricing_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE row record; retained jsonb; change jsonb; tier jsonb; reviewed_hash text; count_sources integer;
BEGIN
 SELECT count(DISTINCT r.id) INTO count_sources FROM jsonb_array_elements(NEW.review#>'{comparison,bindings}') b
 JOIN ppo.cost_source_revisions r ON r.id=(b->>'source_revision_id')::uuid AND r.workspace_id=NEW.workspace_id WHERE r.content ? 'fx';
 IF count_sources=0 AND NOT (NEW.review->'comparison' ? 'fx_sources') THEN RETURN NEW; END IF;
 IF jsonb_array_length(NEW.review#>'{comparison,fx_sources}') IS DISTINCT FROM count_sources THEN
  RAISE EXCEPTION 'Exact distinct converted sources required in Excel review' USING ERRCODE='23514';
 END IF;
 FOR row IN SELECT b.value AS binding,r.id,r.content->'fx' AS fx FROM jsonb_array_elements(NEW.review#>'{comparison,bindings}') b
 JOIN ppo.cost_source_revisions r ON r.id=(b.value->>'source_revision_id')::uuid AND r.workspace_id=NEW.workspace_id WHERE r.content ? 'fx' LOOP
  SELECT x INTO retained FROM jsonb_array_elements(NEW.review#>'{comparison,fx_sources}') x WHERE x->>'source_revision_id'=row.id::text;
  SELECT x INTO change FROM jsonb_array_elements(NEW.review#>'{comparison,changes}') x WHERE x->>'line_id'=row.binding->>'line_id';
  SELECT x INTO tier FROM jsonb_array_elements(row.fx->'tiers') x WHERE x->>'minimum_quantity'=row.binding->>'tier_minimum_quantity';
  SELECT a.details#>>'{fx_review,hash}' INTO reviewed_hash FROM ppo.cost_source_events e JOIN ppo.audit_events a
   ON a.workspace_id=e.workspace_id AND a.actor_id=e.created_by AND a.operation_id=e.operation_id
   WHERE e.workspace_id=NEW.workspace_id AND e.id=(row.binding->>'review_event_id')::uuid AND a.details->>'event_id'=e.id::text;
  IF retained->'conversion' IS DISTINCT FROM row.fx OR change#>>'{foreign_price,currency}' IS DISTINCT FROM row.fx->>'currency'
   OR change#>>'{foreign_price,unit_cost}' IS DISTINCT FROM tier->>'unit_cost'
   OR reviewed_hash IS NULL OR change#>>'{foreign_price,fx_review_hash}' IS DISTINCT FROM reviewed_hash THEN
   RAISE EXCEPTION 'Excel pricing must preserve reviewed FX and original foreign tier' USING ERRCODE='23514';
  END IF;
 END LOOP;
 RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER excel_source_fx_pricing AFTER INSERT ON ppo.excel_source_pricings DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ppo.excel_source_fx_pricing_guard();
