-- Explicit local fixture duties; titles confer no authority. No hosted rows.
INSERT INTO ppo.permission_grants
 (id,workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
SELECT v.id::uuid,u.workspace_id,u.id,NULL,v.capability,'Workspace',u.workspace_id,NULL,'2026-01-01T00:00:00Z',NULL
FROM (VALUES
 ('ad010079-0000-4000-8000-000000000001','systems','admin.access.propose'),
 ('ad010079-0000-4000-8000-000000000002','scheduling-policy-reviewer','admin.access.read'),
 ('ad010079-0000-4000-8000-000000000003','scheduling-policy-reviewer','admin.access.approve')
) AS v(id,subject,capability) JOIN ppo.users u ON u.subject_id=v.subject
WHERE u.workspace_id='10000000-0000-4000-8000-000000000001' AND u.issuer='PPO-LocalSynthetic'
ON CONFLICT DO NOTHING;
