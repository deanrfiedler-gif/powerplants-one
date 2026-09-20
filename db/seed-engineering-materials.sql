-- Once-only synthetic EN-06 responsibility profiles, governed by seed receipt 29. Fictional people only:
-- they allocate no employee, define no corporate authority and close no D-002/D-019 decision.
-- No existing identity, grant or business record is rewritten, and no material record is fabricated here;
-- the review scenario is built through the application's ordinary commands (scripts/engineering-materials-scenario.ts).
INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name) VALUES
('30000000-0000-4000-8000-000000000016','10000000-0000-4000-8000-000000000001','PPO-LocalSynthetic','materials-author','SYN Alex Lee'),
('30000000-0000-4000-8000-000000000017','10000000-0000-4000-8000-000000000001','PPO-LocalSynthetic','materials-engineer','SYN Sam Jordan'),
('30000000-0000-4000-8000-000000000018','10000000-0000-4000-8000-000000000001','PPO-LocalSynthetic','materials-reviewer','SYN Casey Reviewer'),
('30000000-0000-4000-8000-000000000019','10000000-0000-4000-8000-000000000001','PPO-LocalSynthetic','materials-release','SYN Drew Release authority'),
('30000000-0000-4000-8000-000000000020','10000000-0000-4000-8000-000000000001','PPO-LocalSynthetic','materials-supply','SYN Robin Supply coordinator'),
('30000000-0000-4000-8000-000000000021','10000000-0000-4000-8000-000000000001','PPO-LocalSynthetic','materials-viewer','SYN Quinn Materials viewer');

-- Read context for all six, copied from the coordinator's current Company A scope. engineering.edit goes to
-- the two authors only, and it is never review, release or receiving authority.
INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
SELECT g.workspace_id,u.id,g.company_id,g.capability,g.scope_type,g.scope_id,g.site_id,g.valid_from,g.valid_to
FROM ppo.permission_grants g JOIN ppo.users u ON u.workspace_id=g.workspace_id
 AND u.subject_id IN ('materials-author','materials-engineer','materials-reviewer','materials-release','materials-supply','materials-viewer')
WHERE g.user_id='30000000-0000-4000-8000-000000000001' AND g.company_id='20000000-0000-4000-8000-000000000001' AND g.scope_type='Company'
 AND (g.capability IN ('shared.read','shared.internal.read','project.read','engineering.read')
  OR (g.capability='engineering.edit' AND u.subject_id IN ('materials-author','materials-engineer')))
 AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp())
ON CONFLICT DO NOTHING;

-- One separate capability per independent duty, each held by exactly one fictional profile.
INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
SELECT g.workspace_id,u.id,g.company_id,duty.capability,g.scope_type,g.scope_id,g.site_id,g.valid_from,g.valid_to
FROM ppo.permission_grants g
JOIN (VALUES ('materials-reviewer','engineering.material.review'),('materials-release','engineering.material.release'),('materials-supply','engineering.material.receive')) AS duty(subject_id,capability) ON true
JOIN ppo.users u ON u.workspace_id=g.workspace_id AND u.subject_id=duty.subject_id
WHERE g.user_id='30000000-0000-4000-8000-000000000001' AND g.company_id='20000000-0000-4000-8000-000000000001' AND g.scope_type='Company'
 AND g.capability='engineering.read' AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp())
ON CONFLICT DO NOTHING;

-- The local synthetic upstream adapter is operated by the existing coordinators, in the scopes where they
-- already edit Engineering packages. It stands in for source owners (EN-02, EN-03/EN-05, Projects) that have
-- no runtime here; it is not an Engineering author's permission.
INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
SELECT g.workspace_id,g.user_id,g.company_id,'engineering.material.source',g.scope_type,g.scope_id,g.site_id,g.valid_from,g.valid_to
FROM ppo.permission_grants g JOIN ppo.users u ON (u.workspace_id,u.id)=(g.workspace_id,g.user_id)
WHERE u.subject_id IN ('coordinator','second-company') AND u.active AND g.capability='engineering.edit'
 AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp())
ON CONFLICT DO NOTHING;

-- Fictional review and release policy, version 1, for Company A only. Company B deliberately has none, so
-- it demonstrates "Authority not configured". Reviewer and release authority may not be the same person.
INSERT INTO ppo.material_policies(id,workspace_id,company_id,site_id,policy_version,effective_from,allow_reviewer_release_overlap,grants)
SELECT 'e6000000-0000-4000-8000-000000000001',c.workspace_id,c.id,NULL,1,'2026-01-01T00:00:00Z',false,jsonb_build_array(
 jsonb_build_object('actor_id','30000000-0000-4000-8000-000000000018','role','TechnicalReviewer','disciplines',jsonb_build_array('Mechanical','Layout','Hydraulics','Electrical','Automation','Controls'),'purposes',jsonb_build_array('TechnicalReleaseForProcurement','InformationOnly')),
 jsonb_build_object('actor_id','30000000-0000-4000-8000-000000000019','role','ReleaseAuthority','disciplines',jsonb_build_array('Mechanical','Layout','Hydraulics','Electrical','Automation','Controls'),'purposes',jsonb_build_array('TechnicalReleaseForProcurement','InformationOnly')),
 jsonb_build_object('actor_id','30000000-0000-4000-8000-000000000020','role','SupplyReceiver','disciplines',jsonb_build_array('Mechanical','Layout','Hydraulics','Electrical','Automation','Controls'),'purposes',jsonb_build_array('TechnicalReleaseForProcurement','InformationOnly')))
FROM ppo.companies c WHERE c.id='20000000-0000-4000-8000-000000000001' AND c.workspace_id='10000000-0000-4000-8000-000000000001';
