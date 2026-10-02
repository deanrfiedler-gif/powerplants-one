-- Exact existing fictional scopes only. No user/hosted tester, broad technician
-- duty, or revival of a revoked grant. Seed receipt makes replay idempotent.
INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
SELECT g.workspace_id,g.user_id,g.company_id,d.capability,g.scope_type,g.scope_id,g.site_id,g.valid_from,g.valid_to
FROM ppo.permission_grants g JOIN ppo.users u ON (u.workspace_id,u.id)=(g.workspace_id,g.user_id) AND u.issuer='PPO-LocalSynthetic' AND u.active CROSS JOIN (VALUES('incident.read'),('incident.report'),('incident.review'),('incident.close'),('incident.sensitive')) d(capability)
WHERE g.capability='service.work_order.edit' AND g.user_id='30000000-0000-4000-8000-000000000001'
 AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp()) ON CONFLICT DO NOTHING;
INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
SELECT g.workspace_id,g.user_id,g.company_id,d.capability,g.scope_type,g.scope_id,g.site_id,g.valid_from,g.valid_to
FROM ppo.permission_grants g JOIN ppo.users u ON (u.workspace_id,u.id)=(g.workspace_id,g.user_id) AND u.issuer='PPO-LocalSynthetic' AND u.active CROSS JOIN (VALUES('incident.read'),('incident.report')) d(capability)
WHERE g.capability='field.read.own' AND g.user_id IN ('30000000-0000-4000-8000-000000000010','30000000-0000-4000-8000-000000000011')
 AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp()) ON CONFLICT DO NOTHING;
