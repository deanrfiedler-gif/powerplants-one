-- Add exact PJ-06 receiving context without rewriting any EN-06 evidence.
ALTER TABLE ppo.material_handovers
 ADD COLUMN specialist_package_id uuid,
 ADD COLUMN specialist_version integer,
 ADD CONSTRAINT ck_material_specialist_pair CHECK ((specialist_package_id IS NULL)=(specialist_version IS NULL)),
 ADD CONSTRAINT fk_material_specialist_event FOREIGN KEY(workspace_id,specialist_package_id,specialist_version)
 REFERENCES ppo.project_specialist_events(workspace_id,package_id,version);

-- Only the new closed payload uses this canonical encoder. Historical hashes stay untouched.
CREATE FUNCTION ppo.specialist_handover_json(value jsonb) RETURNS text LANGUAGE plpgsql IMMUTABLE STRICT AS $$
DECLARE result text;
BEGIN
 CASE jsonb_typeof(value)
 WHEN 'object' THEN
  IF EXISTS(SELECT 1 FROM jsonb_object_keys(value) k WHERE k !~ '^[a-z_]+$') THEN RAISE EXCEPTION 'Unsupported handover key' USING ERRCODE='23514'; END IF;
  SELECT '{'||coalesce(string_agg(to_jsonb(e.key)::text||':'||ppo.specialist_handover_json(e.value),',' ORDER BY e.key COLLATE "C"),'')||'}' INTO result FROM jsonb_each(value) e;
 WHEN 'array' THEN
  SELECT '['||coalesce(string_agg(ppo.specialist_handover_json(e.value),',' ORDER BY e.ordinality),'')||']' INTO result FROM jsonb_array_elements(value) WITH ORDINALITY e(value,ordinality);
 WHEN 'number' THEN
  IF value::text !~ '^[0-9]+$' OR (value::text)::numeric>2147483647 THEN RAISE EXCEPTION 'Unsupported handover number' USING ERRCODE='23514'; END IF;
  result:=value::text;
 ELSE result:=value::text;
 END CASE;
 RETURN result;
END $$;

CREATE FUNCTION ppo.check_specialist_handover() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE e ppo.project_specialist_events; s ppo.project_specialist_packages; eng ppo.engineering_packages; rel ppo.material_releases; expected jsonb;
BEGIN
 IF TG_OP='UPDATE' AND (NEW.specialist_package_id,NEW.specialist_version) IS DISTINCT FROM (OLD.specialist_package_id,OLD.specialist_version)
 THEN RAISE EXCEPTION 'An exact specialist reference is permanent' USING ERRCODE='55000'; END IF;
 IF NEW.specialist_package_id IS NULL THEN
  IF NEW.payload ? 'specialist' OR NEW.payload->>'schema_version'='2' THEN RAISE EXCEPTION 'Specialist reference required' USING ERRCODE='23514'; END IF;
  RETURN NEW;
 END IF;
 SELECT * INTO STRICT s FROM ppo.project_specialist_packages WHERE workspace_id=NEW.workspace_id AND id=NEW.specialist_package_id;
 SELECT * INTO STRICT e FROM ppo.project_specialist_events WHERE workspace_id=NEW.workspace_id AND package_id=s.id AND version=NEW.specialist_version;
 SELECT p.* INTO STRICT eng FROM ppo.engineering_packages p JOIN ppo.material_sets ms ON (ms.workspace_id,ms.package_id)=(p.workspace_id,p.id) WHERE ms.workspace_id=NEW.workspace_id AND ms.id=NEW.set_id;
 SELECT * INTO STRICT rel FROM ppo.material_releases WHERE workspace_id=NEW.workspace_id AND id=NEW.release_id;
 expected:=jsonb_build_object('id',s.id,'version',e.version,'source_hash',e.source_hash,'accept_operation_id',e.operation_id,'content',e.content);
 IF e.state<>'Accepted' OR eng.project_id IS DISTINCT FROM s.project_id OR eng.opportunity_id IS NOT NULL
  OR eng.company_id<>NEW.company_id OR s.company_id<>NEW.company_id
  OR e.content->'engineering'->>'id' IS DISTINCT FROM eng.id::text
  OR rel.set_id<>NEW.set_id OR rel.purpose<>'TechnicalReleaseForProcurement'
  OR NEW.requested_action<>'ProcurementReady' OR NEW.demand_basis<>'Approved'
  OR NEW.payload->'specialist' IS DISTINCT FROM expected OR NEW.payload->'schema_version' IS DISTINCT FROM '2'::jsonb
  OR NEW.payload->'lines' IS DISTINCT FROM rel.manifest->'lines' OR NEW.payload->'exclusions' IS DISTINCT FROM rel.manifest->'exclusions'
  OR NEW.payload->'source'->>'release_id' IS DISTINCT FROM rel.id::text
  OR NEW.payload->'source'->>'content_hash' IS DISTINCT FROM rel.content_hash
  OR NEW.payload_hash<>encode(public.digest(ppo.specialist_handover_json(NEW.payload),'sha256'),'hex')
 THEN RAISE EXCEPTION 'Exact accepted specialist and native release payload required' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER specialist_handover_guard BEFORE INSERT OR UPDATE ON ppo.material_handovers FOR EACH ROW EXECUTE FUNCTION ppo.check_specialist_handover();
