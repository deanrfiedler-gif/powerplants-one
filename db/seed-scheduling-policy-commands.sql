-- Dedicated fictional duties. No existing identity, duty, booking or policy changes.
-- Hosted sign-in cannot select these PPO-LocalSynthetic profiles. Reseeding never
-- reactivates an identity or reopens a revoked/expired grant.
INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name) VALUES
 ('a0540000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','PPO-LocalSynthetic','scheduling-policy-reviewer','SYN Taylor Policy reviewer'),
 ('a0540000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','PPO-LocalSynthetic','scheduling-policy-publisher','SYN Jamie Policy publisher')
ON CONFLICT DO NOTHING;
INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
SELECT u.workspace_id,u.id,NULL,c.capability,'Workspace',u.workspace_id,NULL,'2026-01-01T00:00:00Z',NULL
FROM ppo.users u CROSS JOIN (VALUES ('shared.read'),('schedule.read'),('service.work_order.read'),('service.ticket.read'),('activity.read')) c(capability)
WHERE u.workspace_id='10000000-0000-4000-8000-000000000001' AND u.issuer='PPO-LocalSynthetic'
 AND u.id IN ('a0540000-0000-4000-8000-000000000001','a0540000-0000-4000-8000-000000000002')
ON CONFLICT DO NOTHING;
INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
SELECT u.workspace_id,u.id,NULL,d.capability,'Workspace',u.workspace_id,NULL,'2026-01-01T00:00:00Z',NULL
FROM ppo.users u JOIN (VALUES
 ('a0540000-0000-4000-8000-000000000001'::uuid,'schedule.policy.review'),
 ('a0540000-0000-4000-8000-000000000002'::uuid,'schedule.policy.publish')) d(id,capability) ON d.id=u.id
WHERE u.workspace_id='10000000-0000-4000-8000-000000000001' AND u.issuer='PPO-LocalSynthetic'
ON CONFLICT DO NOTHING;
