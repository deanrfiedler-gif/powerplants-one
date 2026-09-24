-- Fictional prototype duties only; no hosted tester or operational access changes.
INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
SELECT g.workspace_id,u.id,g.company_id,d.capability,g.scope_type,g.scope_id,g.site_id,g.valid_from,g.valid_to
FROM ppo.permission_grants g
JOIN (VALUES ('materials-reviewer','engineering.technical.review'),('materials-release','engineering.technical.issue'),
 ('materials-release','engineering.technical.distribute'),('coordinator','engineering.technical.source')) d(subject_id,capability) ON true
JOIN ppo.users u ON u.workspace_id=g.workspace_id AND u.subject_id=d.subject_id
WHERE g.user_id='30000000-0000-4000-8000-000000000001' AND g.company_id='20000000-0000-4000-8000-000000000001'
 AND g.scope_type='Company' AND g.capability='engineering.read' AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp())
ON CONFLICT DO NOTHING;

INSERT INTO ppo.engineering_control_policies(id,workspace_id,company_id,policy_version,effective_from,grants)
SELECT 'ec450000-0000-4000-8000-000000000001',c.workspace_id,c.id,1,'2026-01-01T00:00:00Z',jsonb_agg(jsonb_build_object(
 'actor_id',d.actor_id,'duty',d.duty,'purposes',jsonb_build_array('InformationOnly','DesignPreparation','TechnicalReleaseForProcurement'),
 'disciplines',jsonb_build_array('Mechanical','Layout','Hydraulics','Electrical','Automation','Controls')))
FROM ppo.companies c CROSS JOIN (VALUES
 ('30000000-0000-4000-8000-000000000018','review'),('30000000-0000-4000-8000-000000000019','issue'),('30000000-0000-4000-8000-000000000019','distribute')
) d(actor_id,duty)
WHERE c.id='20000000-0000-4000-8000-000000000001' AND c.workspace_id='10000000-0000-4000-8000-000000000001'
GROUP BY c.workspace_id,c.id ON CONFLICT DO NOTHING;
