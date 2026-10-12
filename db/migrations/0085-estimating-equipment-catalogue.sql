-- ES-02 catalogue successor; r01 sources, hashes, outputs and grants stay unchanged.
-- Extend the installed function rather than replacing earlier ownership/lineage guards.
CREATE FUNCTION ppo.validate_configuration_catalogue(cfg jsonb, previous jsonb)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE system jsonb; old_system jsonb; field_name text;
BEGIN
 IF previous->>'definition_id'='PPO-ES02-CONFIG-r02'
    AND (cfg->>'definition_id' IS DISTINCT FROM 'PPO-ES02-CONFIG-r02' OR cfg->'schema_version' IS DISTINCT FROM '2'::jsonb)
 THEN RAISE EXCEPTION 'Retain successor configuration definition' USING ERRCODE='23514'; END IF;
 IF cfg->>'definition_id' IS DISTINCT FROM 'PPO-ES02-CONFIG-r02' THEN RETURN; END IF;
 IF cfg->'schema_version' IS DISTINCT FROM '2'::jsonb OR jsonb_typeof(cfg->'systems') IS DISTINCT FROM 'array'
    OR jsonb_typeof(cfg->'facts') IS DISTINCT FROM 'array'
 THEN RAISE EXCEPTION 'Exact r02 schema and collections required' USING ERRCODE='23514'; END IF;
 FOR system IN SELECT * FROM jsonb_array_elements(cfg->'systems') LOOP
  IF system->>'family'='Infrastructure' THEN
   IF system->'category_id' IS DISTINCT FROM 'null'::jsonb THEN RAISE EXCEPTION 'Infrastructure has no category' USING ERRCODE='23514'; END IF;
  ELSIF NOT EXISTS (SELECT 1 FROM (VALUES
      ('climate-lighting', 'Climate'),
      ('climate-circulation-fans-priva', 'Climate'),
      ('climate-circulation-fans-other', 'Climate'),
      ('climate-exhaust-fans-ventilation', 'Climate'),
      ('climate-drive-systems-vents-screens', 'Climate'),
      ('climate-pad-fan-cooling', 'Climate'),
      ('climate-fogging-humidification', 'Climate'),
      ('climate-heating-hydronic', 'Climate'),
      ('climate-heating-direct-fired-air', 'Climate'),
      ('climate-hvac-dehumidification', 'Climate'),
      ('climate-co2-systems', 'Climate'),
      ('climate-screens-shade-thermal', 'Climate'),
      ('climate-screens-blackout', 'Climate'),
      ('climate-screens-outdoor', 'Climate'),
      ('climate-insect-screens', 'Climate'),
      ('climate-roll-up-walls', 'Climate'),
      ('climate-sulphur-burners', 'Climate'),
      ('controls-priva-compass', 'Controls'),
      ('controls-priva-compact-cc', 'Controls'),
      ('controls-priva-connext', 'Controls'),
      ('controls-priva-fs-performance', 'Controls'),
      ('controls-priva-blue-id', 'Controls'),
      ('controls-grosound', 'Controls'),
      ('controls-maximizer', 'Controls'),
      ('controls-minigrow', 'Controls'),
      ('controls-multigrow', 'Controls'),
      ('controls-omnigrow', 'Controls'),
      ('controls-nutridose', 'Controls'),
      ('controls-sensors-weather-stations', 'Controls'),
      ('controls-electrical-panels', 'Controls'),
      ('controls-switchboards-circuit-breakers', 'Controls'),
      ('controls-electrical-materials-installation', 'Controls'),
      ('water-priva-nutrione', 'Water'),
      ('water-priva-nutrifit', 'Water'),
      ('water-priva-nutrijet-bypass', 'Water'),
      ('water-priva-nutrijet-inline', 'Water'),
      ('water-priva-nutriflex', 'Water'),
      ('water-priva-nutrimix', 'Water'),
      ('water-directjet-dosing', 'Water'),
      ('water-easydose-dosing', 'Water'),
      ('water-peridose-dosing', 'Water'),
      ('water-dosing-racks', 'Water'),
      ('water-neutralisers', 'Water'),
      ('water-priva-vialux-hp', 'Water'),
      ('water-priva-vialux-m', 'Water'),
      ('water-ecolux-recycling', 'Water'),
      ('water-ro-ultrafiltration', 'Water'),
      ('water-irrigation', 'Water'),
      ('water-wireless-irrigation-control', 'Water'),
      ('water-moisture-sensing-monitoring', 'Water'),
      ('water-tanks', 'Water'),
      ('water-stirrers', 'Water'),
      ('automation-javo-potting-machines', 'Automation'),
      ('automation-tray-fillers', 'Automation'),
      ('automation-sowing-lines', 'Automation'),
      ('automation-seeding-drilling-dibbling', 'Automation'),
      ('automation-transplanting-automatic', 'Automation'),
      ('automation-transplanting-manual', 'Automation'),
      ('automation-conveyors', 'Automation'),
      ('automation-buffer-belts', 'Automation'),
      ('automation-dispatch-systems-willburg', 'Automation'),
      ('automation-forklifts-forks', 'Automation'),
      ('automation-pot-in-tray-robots', 'Automation'),
      ('automation-trailer-loaders', 'Automation'),
      ('automation-benches-fixed', 'Automation'),
      ('automation-benches-mobile', 'Automation'),
      ('automation-benches-nft', 'Automation'),
      ('automation-benches-sideshift', 'Automation'),
      ('automation-grow-systems-gutters', 'Automation'),
      ('automation-grow-systems-mgs', 'Automation'),
      ('automation-grow-systems-raft', 'Automation'),
      ('automation-trolleys-crop-pipe-rail', 'Automation'),
      ('automation-trolleys-crop-tyre', 'Automation'),
      ('automation-trolleys-pick-pipe-rail', 'Automation'),
      ('automation-trolleys-pick-tyre', 'Automation'),
      ('automation-trolleys-spray-pipe-rail', 'Automation'),
      ('automation-trolleys-spray-tyre', 'Automation'),
      ('automation-trimming', 'Automation'),
      ('automation-labelling', 'Automation'),
      ('automation-washers', 'Automation'),
      ('automation-vision-grading', 'Automation'),
      ('automation-soil-handling', 'Automation'),
      ('automation-soil-storage', 'Automation'),
      ('automation-rockwool-handling', 'Automation'),
      ('automation-automated-booms', 'Automation'),
      ('automation-automated-watering', 'Automation'),
      ('automation-growcoon-systems', 'Automation'),
      ('automation-weed-control-equipment', 'Automation'),
      ('automation-automation-project-turnkey', 'Automation'),
      ('automation-other-nursery-automation', 'Automation'),
      ('structures-greenhouses', 'Structures'),
      ('structures-greenhouse-construction', 'Structures'),
      ('structures-cravo-retractable-roof-structures', 'Structures'),
      ('structures-cravo-parts', 'Structures'),
      ('structures-cladding', 'Structures'),
      ('structures-flooring-weed-mat', 'Structures'),
      ('structures-earthworks', 'Structures'),
      ('services-project-management', 'Services'),
      ('services-design', 'Services'),
      ('services-consulting', 'Services'),
      ('services-training', 'Services'),
      ('services-commissioning-standalone', 'Services'),
      ('services-service', 'Services'),
      ('services-maintenance-contracts', 'Services'),
      ('services-site-costs-prelims', 'Services'),
      ('services-freight-standalone', 'Services'),
      ('services-extended-warranty', 'Services'),
      ('services-post-handover-technical-support', 'Services')
  ) AS catalogue(category_id,family) WHERE category_id=system->>'category_id' AND family=system->>'family') THEN
   RAISE EXCEPTION 'Exact catalogue family/category required' USING ERRCODE='23514';
  END IF;
 END LOOP;
 FOR old_system IN SELECT * FROM jsonb_array_elements(previous->'systems') LOOP
  IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(cfg->'systems') s WHERE s->>'id'=old_system->>'id') THEN CONTINUE; END IF;
  FOR field_name IN
   SELECT f->>'field' FROM jsonb_array_elements(previous->'facts') f WHERE f->>'system_id'=old_system->>'id'
   UNION SELECT 'SupplyDescription' WHERE previous->>'definition_id'='PPO-ES02-CONFIG-r01'
   UNION SELECT 'VerifiedCapacity' WHERE previous->>'definition_id'='PPO-ES02-CONFIG-r01' AND old_system->>'family'='ControlsClimate' AND old_system->>'intent'<>'New'
   UNION SELECT 'EquipmentModel' WHERE previous->>'definition_id'='PPO-ES02-CONFIG-r01' AND old_system->>'family'='MonitoringWeather' AND old_system->>'intent'<>'New'
  LOOP
   IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(cfg->'facts') f WHERE f->>'system_id'=old_system->>'id' AND f->>'field'=field_name)
   THEN RAISE EXCEPTION 'Retain surviving system fact requirements' USING ERRCODE='23514'; END IF;
  END LOOP;
 END LOOP;
END $$;

DO $migration$
DECLARE body text := pg_get_functiondef('ppo.check_estimating_configuration()'::regprocedure);
 old_schema text := $old$OR cfg->>'definition_id' IS DISTINCT FROM 'PPO-ES02-CONFIG-r01'$old$;
 old_version text := $old$cfg->>'schema_version' IS DISTINCT FROM '1'$old$;
 entry_point text := $old$ IF NEW.kind<>'Discovery' OR NOT (NEW.input ? 'configuration') THEN RETURN NEW; END IF;$old$;
BEGIN
 IF strpos(body,old_schema)=0 OR strpos(body,old_version)=0 OR strpos(body,entry_point)=0 THEN
  RAISE EXCEPTION 'Review the installed configuration guard before extending it';
 END IF;
 body := replace(body, old_version, $new$((cfg->'schema_version'='1'::jsonb AND cfg->>'definition_id'='PPO-ES02-CONFIG-r01') OR (cfg->'schema_version'='2'::jsonb AND cfg->>'definition_id'='PPO-ES02-CONFIG-r02')) IS DISTINCT FROM TRUE$new$);
 body := replace(body, old_schema, '');
 body := replace(body, entry_point, $new$ IF NEW.kind='Discovery' THEN
  SELECT input->'configuration' INTO prior FROM ppo.estimation_revisions WHERE workspace_id=NEW.workspace_id AND id=NEW.predecessor_id;
  PERFORM ppo.validate_configuration_catalogue(cfg, prior);
 END IF;
$new$ || entry_point);
 EXECUTE body;
END $migration$;
