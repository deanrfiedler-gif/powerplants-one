-- Explicit fictional duties only. No invitations, real delegation or agreement activation.
INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
SELECT g.workspace_id,g.user_id,g.company_id,v.capability,g.scope_type,g.scope_id,g.site_id,g.valid_from,g.valid_to
FROM ppo.permission_grants g CROSS JOIN unnest(ARRAY['maintenance.read','maintenance.manage','maintenance.assess','warranty.read','warranty.manage','warranty.assess','warranty.recovery']) v(capability)
WHERE g.capability='shared.read' AND g.user_id IN ('30000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000008');
INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
SELECT g.workspace_id,g.user_id,g.company_id,v.capability,g.scope_type,g.scope_id,g.site_id,g.valid_from,g.valid_to
FROM ppo.permission_grants g CROSS JOIN unnest(ARRAY['maintenance.read','warranty.read']) v(capability)
WHERE g.capability='shared.read' AND g.user_id IN ('30000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000012','30000000-0000-4000-8000-000000000014');
INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
SELECT g.workspace_id,g.user_id,g.company_id,v.capability,g.scope_type,g.scope_id,g.site_id,g.valid_from,g.valid_to
FROM ppo.permission_grants g CROSS JOIN unnest(ARRAY['maintenance.agreement.approve','warranty.goodwill']) v(capability)
WHERE g.capability='shared.read' AND g.user_id='30000000-0000-4000-8000-000000000012';
