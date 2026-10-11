-- One existing local synthetic Systems identity. Never provision hosted access.
INSERT INTO ppo.permission_grants
  (id,workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
SELECT 'ad010078-0000-4000-8000-000000000001'::uuid,u.workspace_id,u.id,NULL,
  'admin.access.read','Workspace',u.workspace_id,NULL,'2026-01-01T00:00:00Z'::timestamptz,NULL
FROM ppo.users u WHERE u.workspace_id='10000000-0000-4000-8000-000000000001'
  AND u.id='30000000-0000-4000-8000-000000000003'
  AND u.issuer='PPO-LocalSynthetic' AND u.subject_id='systems'
ON CONFLICT DO NOTHING;
