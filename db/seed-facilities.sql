-- Authored synthetic showcase. Versioned seed receipt 41 protects later edits.
DO $$
DECLARE w uuid:='10000000-0000-4000-8000-000000000001'; c uuid:='20000000-0000-4000-8000-000000000001';
 a uuid:='30000000-0000-4000-8000-000000000001'; org uuid:='c5050000-0000-4000-8000-000000000001';
 nursery uuid:='c5050001-0000-4000-8000-000000000001'; fieldsite uuid:='c5050001-0000-4000-8000-000000000002';
 pump uuid:='c5050003-0000-4000-8000-000000000001'; f uuid; n integer; v record;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM ppo.users WHERE workspace_id=w AND id=a) OR NOT EXISTS(SELECT 1 FROM ppo.companies WHERE workspace_id=w AND id=c) THEN RETURN; END IF;
 INSERT INTO ppo.organisations(id,workspace_id,company_id,display_number,display_name,relationship_status,owner_id,access_class,created_by,updated_by)
 VALUES(org,w,c,NULL,'SYN Willowbank Horticulture','Active',a,'Internal',a,a) ON CONFLICT DO NOTHING;
 INSERT INTO ppo.sites(id,workspace_id,company_id,display_number,display_name,location_description,timezone,owner_id,created_by,updated_by)
 VALUES(nursery,w,c,NULL,'SYN Nursery & propagation','Authored fictional Site; no real address or coordinates.','Australia/Sydney',a,a,a),
 (fieldsite,w,c,NULL,'SYN Field production','Authored fictional Site; no real address or coordinates.','Australia/Sydney',a,a,a) ON CONFLICT DO NOTHING;
 INSERT INTO ppo.site_parties(id,workspace_id,company_id,site_id,organisation_id,role,valid_from,created_by,updated_by)
 VALUES('c5050004-0000-4000-8000-000000000001',w,c,nursery,org,'Operator','2026-09-01T00:00:00Z',a,a),
 ('c5050004-0000-4000-8000-000000000002',w,c,fieldsite,org,'Operator','2026-09-01T00:00:00Z',a,a) ON CONFLICT DO NOTHING;
 FOR v IN SELECT * FROM (VALUES
 (1,'SYN Greenhouse 01','greenhouse','production','Young vegetable plants','2400','glass',8,NULL,NULL,NULL,NULL),
 (2,'SYN Tunnel 01','polytunnel','production','Berry liners',NULL,NULL,NULL,'plastic_film',6,NULL,NULL),
 (3,'SYN Propagation House 01','greenhouse','propagation','Mixed nursery stock','1200','rigid_plastic',4,NULL,NULL,NULL,NULL),
 (4,'SYN Propagation Bay A','greenhouse','propagation','Rooted cuttings','240',NULL,NULL,NULL,NULL,NULL,NULL),
 (5,'SYN Pack Room 01','non_growing_facility','non_growing',NULL,'360',NULL,NULL,NULL,NULL,NULL,'packing'),
 (6,'SYN Irrigation Shed 01','non_growing_facility','non_growing',NULL,'48',NULL,NULL,NULL,NULL,NULL,'pump_equipment_room'),
 (7,'SYN Irrigation Block 01','open_growing_area','production','Container nursery stock','1800',NULL,NULL,NULL,NULL,'containers',NULL),
 (8,'SYN Irrigation Block 02 / Field','open_growing_area','production','Field nursery stock','12500',NULL,NULL,NULL,NULL,'rows',NULL),
 (9,'SYN Tunnel 02','polytunnel','trials','Berry varieties',NULL,NULL,NULL,'plastic_film',4,NULL,NULL)
 ) AS x(n,name,structure,use_value,crop,area,cladding,bays,cover,tunnels,layout,function_value) LOOP
  f:=('c5050002-0000-4000-8000-'||lpad(v.n::text,12,'0'))::uuid;
  INSERT INTO ppo.facilities(id,workspace_id,company_id,site_id,name,parent_facility_id,parent_relationship,structure_type,"use",crop,context_observed_on,footprint_m2,greenhouse_cladding,bay_count,polytunnel_cover,tunnel_count,open_area_layout,facility_function,created_by,updated_by)
  VALUES(f,w,c,CASE WHEN v.n>=8 THEN fieldsite ELSE nursery END,v.name,CASE WHEN v.n=4 THEN 'c5050002-0000-4000-8000-000000000003'::uuid END,CASE WHEN v.n=4 THEN 'physically_within' END,v.structure,v.use_value,v.crop,'2026-09-01',v.area::numeric,v.cladding,v.bays,v.cover,v.tunnels,v.layout,v.function_value,a,a) ON CONFLICT DO NOTHING;
 END LOOP;
 INSERT INTO ppo.assets(id,workspace_id,company_id,site_id,facility_id,display_number,description,identity_status,lifecycle_status,created_by,updated_by)
 VALUES(pump,w,c,nursery,'c5050002-0000-4000-8000-000000000006',NULL,'SYN Willowbank irrigation pump','Unresolved','Active',a,a) ON CONFLICT DO NOTHING;
 INSERT INTO ppo.asset_location_events(id,workspace_id,company_id,asset_id,to_site_id,effective_at,reason,created_by,updated_by)
 VALUES('c5050005-0000-4000-8000-000000000001',w,c,pump,nursery,'2026-09-01T00:00:00Z','Authored synthetic installation',a,a) ON CONFLICT DO NOTHING;
 FOR n IN 1..3 LOOP
  f:=('c5050002-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid;
  INSERT INTO ppo.facility_sources(id,workspace_id,company_id,site_id,facility_id,kind,title,note,source_date,recorded_by)
  VALUES(('c5050006-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,w,c,nursery,f,'reported_note','SYN authored service association','Fictional pump service relationship; no capacity or verification claim.','2026-09-01',a) ON CONFLICT DO NOTHING;
  INSERT INTO ppo.asset_served_facilities(id,workspace_id,company_id,site_id,asset_id,facility_id,source_id,recorded_by)
  VALUES(('c5050007-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,w,c,nursery,pump,f,('c5050006-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,a) ON CONFLICT DO NOTHING;
 END LOOP;
END $$;
