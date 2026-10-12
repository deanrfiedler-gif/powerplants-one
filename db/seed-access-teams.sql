-- One explicit local team-creation duty; no new user or hosted authority.
INSERT INTO ppo.permission_grants
 (id,workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
SELECT 'ad010082-0000-4000-8000-000000000001',u.workspace_id,u.id,NULL,'admin.access.team.create','Workspace',u.workspace_id,NULL,'2026-01-01T00:00:00Z',NULL
FROM ppo.users u WHERE u.workspace_id='10000000-0000-4000-8000-000000000001'
 AND u.issuer='PPO-LocalSynthetic' AND u.subject_id='systems'
ON CONFLICT DO NOTHING;
