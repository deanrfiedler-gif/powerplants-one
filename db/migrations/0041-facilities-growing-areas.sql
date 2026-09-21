-- CS-05 / FAC-D01–03. 0039/0040 are left to the open Estimating workstreams.
-- No identity update/backfill; null legacy attributes remain unrecorded.
CREATE TABLE ppo.facility_sources (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, site_id uuid NOT NULL,
 facility_id uuid NOT NULL, version integer NOT NULL DEFAULT 1 CHECK(version=1),
 kind text NOT NULL CHECK(kind='reported_note'), title text NOT NULL CHECK(length(btrim(title)) BETWEEN 1 AND 200),
 note text CHECK(length(btrim(note)) BETWEEN 1 AND 2000), source_date date CHECK(isfinite(source_date)),
 recorded_by uuid NOT NULL, recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(), replaces_source_id uuid,
 UNIQUE(workspace_id,facility_id,id), UNIQUE(workspace_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id,facility_id) REFERENCES ppo.facilities(workspace_id,company_id,site_id,id),
 FOREIGN KEY(workspace_id,recorded_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,facility_id,replaces_source_id) REFERENCES ppo.facility_sources(workspace_id,facility_id,id)
);
CREATE TRIGGER protect_content BEFORE UPDATE OR DELETE ON ppo.facility_sources FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence();

ALTER TABLE ppo.facilities
 ADD COLUMN parent_relationship text CHECK(parent_relationship IN ('grouping','physically_within')),
 ADD COLUMN on_site_position text CHECK(length(btrim(on_site_position)) BETWEEN 1 AND 1000),
 ADD COLUMN structure_type text CHECK(structure_type IN ('greenhouse','polytunnel','shade_net_house','open_growing_area','indoor_growing_room','non_growing_facility','other','unknown')),
 ADD COLUMN type_description text CHECK(length(btrim(type_description)) BETWEEN 1 AND 200),
 ADD COLUMN type_unknown_reason text CHECK(length(btrim(type_unknown_reason)) BETWEEN 1 AND 1000),
 ADD COLUMN greenhouse_cladding text CHECK(greenhouse_cladding IN ('glass','plastic_film','rigid_plastic','mixed','other','unknown')),
 ADD COLUMN greenhouse_cladding_description text CHECK(length(btrim(greenhouse_cladding_description)) BETWEEN 1 AND 200),
 ADD COLUMN bay_count integer CHECK(bay_count BETWEEN 1 AND 10000),
 ADD COLUMN polytunnel_cover text CHECK(polytunnel_cover IN ('plastic_film','net','mixed','other','unknown')),
 ADD COLUMN polytunnel_cover_description text CHECK(length(btrim(polytunnel_cover_description)) BETWEEN 1 AND 200),
 ADD COLUMN tunnel_count integer CHECK(tunnel_count BETWEEN 1 AND 10000),
 ADD COLUMN shade_house_cover text CHECK(shade_house_cover IN ('shade_cloth','insect_net','mixed','other','unknown')),
 ADD COLUMN shade_house_cover_description text CHECK(length(btrim(shade_house_cover_description)) BETWEEN 1 AND 200),
 ADD COLUMN open_area_layout text CHECK(open_area_layout IN ('beds','rows','benches','containers','mixed','other','unknown')),
 ADD COLUMN open_area_layout_description text CHECK(length(btrim(open_area_layout_description)) BETWEEN 1 AND 200),
 ADD COLUMN growing_levels integer CHECK(growing_levels BETWEEN 1 AND 100),
 ADD COLUMN facility_function text CHECK(facility_function IN ('pump_equipment_room','storage','packing','other','unknown')),
 ADD COLUMN facility_function_description text CHECK(length(btrim(facility_function_description)) BETWEEN 1 AND 200),
 ADD COLUMN "use" text CHECK("use" IN ('propagation','production','trials','mixed','non_growing','unknown')),
 ADD COLUMN crop text CHECK(length(btrim(crop)) BETWEEN 1 AND 200),
 ADD COLUMN context_observed_on date CHECK(isfinite(context_observed_on)),
 ADD COLUMN season_label text CHECK(length(btrim(season_label)) BETWEEN 1 AND 100),
 -- Unconstrained numeric deliberately preserves input scale until CHECK rejects it.
 ADD COLUMN footprint_m2 numeric CHECK(footprint_m2>0 AND footprint_m2<=9999999999.99 AND scale(footprint_m2)<=2),
 ADD COLUMN length_m numeric CHECK(length_m>0 AND length_m<=9999999.999 AND scale(length_m)<=3),
 ADD COLUMN width_m numeric CHECK(width_m>0 AND width_m<=9999999.999 AND scale(width_m)<=3),
 ADD COLUMN maximum_height_m numeric CHECK(maximum_height_m>0 AND maximum_height_m<=9999999.999 AND scale(maximum_height_m)<=3),
 ADD COLUMN measurement_basis text CHECK(measurement_basis IN ('reported','approximate','measured')),
 ADD COLUMN measurement_observed_on date CHECK(isfinite(measurement_observed_on)),
 ADD COLUMN detail_notes text CHECK(length(btrim(detail_notes)) BETWEEN 1 AND 2000),
 ADD COLUMN location_source_id uuid,
 ADD COLUMN context_source_id uuid,
 ADD COLUMN measurement_source_id uuid,
 ADD COLUMN pin_latitude numeric CHECK(pin_latitude BETWEEN -90 AND 90 AND scale(pin_latitude)<=7),
 ADD COLUMN pin_longitude numeric CHECK(pin_longitude BETWEEN -180 AND 180 AND scale(pin_longitude)<=7),
 ADD COLUMN pin_state text CHECK(pin_state IN ('proposed','confirmed')),
 ADD COLUMN pin_checked_on date CHECK(isfinite(pin_checked_on)),
 ADD COLUMN pin_source_id uuid,
 ADD CONSTRAINT facility_location_source FOREIGN KEY(workspace_id,id,location_source_id) REFERENCES ppo.facility_sources(workspace_id,facility_id,id),
 ADD CONSTRAINT facility_context_source FOREIGN KEY(workspace_id,id,context_source_id) REFERENCES ppo.facility_sources(workspace_id,facility_id,id),
 ADD CONSTRAINT facility_measurement_source FOREIGN KEY(workspace_id,id,measurement_source_id) REFERENCES ppo.facility_sources(workspace_id,facility_id,id),
 ADD CONSTRAINT facility_pin_source FOREIGN KEY(workspace_id,id,pin_source_id) REFERENCES ppo.facility_sources(workspace_id,facility_id,id),
 ADD CONSTRAINT facility_parent_qualifier CHECK(parent_facility_id IS NOT NULL OR parent_relationship IS NULL),
 ADD CONSTRAINT facility_type_other CHECK((structure_type IS NOT DISTINCT FROM 'other')=(type_description IS NOT NULL)),
 ADD CONSTRAINT facility_type_unknown CHECK((structure_type IS NOT DISTINCT FROM 'unknown')=(type_unknown_reason IS NOT NULL)),
 ADD CONSTRAINT facility_greenhouse CHECK(structure_type IS NOT DISTINCT FROM 'greenhouse' OR (greenhouse_cladding IS NULL AND bay_count IS NULL)),
 ADD CONSTRAINT facility_tunnel CHECK(structure_type IS NOT DISTINCT FROM 'polytunnel' OR (polytunnel_cover IS NULL AND tunnel_count IS NULL)),
 ADD CONSTRAINT facility_shade CHECK(structure_type IS NOT DISTINCT FROM 'shade_net_house' OR shade_house_cover IS NULL),
 ADD CONSTRAINT facility_open CHECK(structure_type IS NOT DISTINCT FROM 'open_growing_area' OR open_area_layout IS NULL),
 ADD CONSTRAINT facility_room CHECK(structure_type IS NOT DISTINCT FROM 'indoor_growing_room' OR growing_levels IS NULL),
 ADD CONSTRAINT facility_function_type CHECK(structure_type IS NOT DISTINCT FROM 'non_growing_facility' OR facility_function IS NULL),
 ADD CONSTRAINT facility_cladding_other CHECK((greenhouse_cladding IS NOT DISTINCT FROM 'other')=(greenhouse_cladding_description IS NOT NULL)),
 ADD CONSTRAINT facility_tunnel_other CHECK((polytunnel_cover IS NOT DISTINCT FROM 'other')=(polytunnel_cover_description IS NOT NULL)),
 ADD CONSTRAINT facility_shade_other CHECK((shade_house_cover IS NOT DISTINCT FROM 'other')=(shade_house_cover_description IS NOT NULL)),
 ADD CONSTRAINT facility_layout_other CHECK((open_area_layout IS NOT DISTINCT FROM 'other')=(open_area_layout_description IS NOT NULL)),
 ADD CONSTRAINT facility_function_other CHECK((facility_function IS NOT DISTINCT FROM 'other')=(facility_function_description IS NOT NULL)),
 ADD CONSTRAINT facility_crop_use CHECK(crop IS NULL OR ("use" IS NOT NULL AND "use"<>'non_growing')),
 ADD CONSTRAINT facility_pin_pair CHECK((pin_latitude IS NULL AND pin_longitude IS NULL AND pin_state IS NULL AND pin_checked_on IS NULL AND pin_source_id IS NULL) OR
  (pin_latitude IS NOT NULL AND pin_longitude IS NOT NULL AND pin_state IS NOT NULL AND
   ((pin_state='proposed' AND pin_checked_on IS NULL) OR (pin_state='confirmed' AND pin_checked_on IS NOT NULL AND pin_source_id IS NOT NULL))));

CREATE FUNCTION ppo.facility_date_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE today date;
BEGIN
 SELECT (clock_timestamp() AT TIME ZONE timezone)::date INTO today FROM ppo.sites WHERE workspace_id=NEW.workspace_id AND id=NEW.site_id;
 IF TG_TABLE_NAME='facility_sources' THEN
  IF NEW.source_date>today THEN RAISE EXCEPTION 'Future source date' USING ERRCODE='23514'; END IF;
 ELSE
  IF NEW.context_observed_on>today OR NEW.measurement_observed_on>today OR NEW.pin_checked_on>today THEN RAISE EXCEPTION 'Future observation date' USING ERRCODE='23514'; END IF;
  IF TG_OP='INSERT' THEN
   IF (NEW."use" IS NOT NULL OR NEW.crop IS NOT NULL OR NEW.season_label IS NOT NULL) AND NEW.context_observed_on IS NULL THEN RAISE EXCEPTION 'Context needs observed date' USING ERRCODE='23514'; END IF;
  ELSIF (NEW."use",NEW.crop,NEW.season_label,NEW.context_source_id) IS DISTINCT FROM (OLD."use",OLD.crop,OLD.season_label,OLD.context_source_id) AND NEW.context_observed_on IS NULL THEN
   RAISE EXCEPTION 'Changed context needs observed date' USING ERRCODE='23514';
  END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER facility_dates BEFORE INSERT OR UPDATE ON ppo.facilities FOR EACH ROW EXECUTE FUNCTION ppo.facility_date_guard();
CREATE TRIGGER facility_source_dates BEFORE INSERT ON ppo.facility_sources FOR EACH ROW EXECUTE FUNCTION ppo.facility_date_guard();

CREATE TABLE ppo.asset_served_facilities (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL, company_id uuid NOT NULL, site_id uuid NOT NULL,
 asset_id uuid NOT NULL, facility_id uuid NOT NULL, source_id uuid NOT NULL,
 recorded_by uuid NOT NULL, recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 ended_by uuid, ended_at timestamptz, end_reason text,
 FOREIGN KEY(workspace_id,company_id,asset_id) REFERENCES ppo.assets(workspace_id,company_id,id),
 FOREIGN KEY(workspace_id,company_id,site_id,facility_id) REFERENCES ppo.facilities(workspace_id,company_id,site_id,id),
 FOREIGN KEY(workspace_id,facility_id,source_id) REFERENCES ppo.facility_sources(workspace_id,facility_id,id),
 FOREIGN KEY(workspace_id,recorded_by) REFERENCES ppo.users(workspace_id,id),
 FOREIGN KEY(workspace_id,ended_by) REFERENCES ppo.users(workspace_id,id),
 CHECK((ended_at IS NULL AND ended_by IS NULL AND end_reason IS NULL) OR (ended_at IS NOT NULL AND ended_by IS NOT NULL AND length(btrim(end_reason)) BETWEEN 1 AND 1000))
);
CREATE UNIQUE INDEX asset_serves_active_pair ON ppo.asset_served_facilities(workspace_id,asset_id,facility_id) WHERE ended_at IS NULL;
CREATE INDEX facility_served_active ON ppo.asset_served_facilities(workspace_id,facility_id,asset_id) WHERE ended_at IS NULL;
CREATE FUNCTION ppo.asset_service_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Service relationship history is retained' USING ERRCODE='55000'; END IF;
 PERFORM 1 FROM ppo.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 IF TG_OP='UPDATE' AND (OLD.ended_at IS NOT NULL OR NEW.ended_at IS NULL OR
  (to_jsonb(NEW)-ARRAY['ended_at','ended_by','end_reason']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['ended_at','ended_by','end_reason'])) THEN
  RAISE EXCEPTION 'Only explicit ending is permitted' USING ERRCODE='55000';
 END IF;
 IF NEW.ended_at IS NULL AND NOT EXISTS(SELECT 1 FROM ppo.assets WHERE workspace_id=NEW.workspace_id AND company_id=NEW.company_id AND site_id=NEW.site_id AND id=NEW.asset_id) THEN
  RAISE EXCEPTION 'Active service membership must share Asset site' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER asset_service_guard BEFORE INSERT OR UPDATE OR DELETE ON ppo.asset_served_facilities FOR EACH ROW EXECUTE FUNCTION ppo.asset_service_guard();
-- Existing shared_graph_guard rejects every Asset site move, including direct SQL.
CREATE INDEX facilities_parent_name ON ppo.facilities(workspace_id,site_id,parent_facility_id,lower(name) COLLATE "C",id);
CREATE INDEX facilities_name ON ppo.facilities(workspace_id,lower(name) COLLATE "C",id);
CREATE INDEX facility_sources_history ON ppo.facility_sources(workspace_id,facility_id,recorded_at,id);
