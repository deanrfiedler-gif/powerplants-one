-- Conversations T1b (PPO-CONV-T1-SCOPE rules T1-1, T1-2; answer U3). conversation.read and conversation.post go to every
-- local synthetic profile that already holds crm.opportunity.read or project.read, in exactly that grant's scope and
-- validity: the thread's read right follows the record's read capability, so no profile gains a record it could not open.
-- Hosted demo testers (a different issuer) are not granted; exposure there is a separate decision at T1c.
-- No user, identity or other grant is added, and a revoked or expired source grant is not copied as live.
INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
SELECT g.workspace_id,g.user_id,g.company_id,duty.capability,g.scope_type,g.scope_id,g.site_id,g.valid_from,g.valid_to
FROM ppo.permission_grants g
JOIN ppo.users u ON (u.workspace_id,u.id)=(g.workspace_id,g.user_id) AND u.issuer='PPO-LocalSynthetic' AND u.active
CROSS JOIN (VALUES ('conversation.read'),('conversation.post')) AS duty(capability)
WHERE g.capability IN ('crm.opportunity.read','project.read')
 AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp())
ON CONFLICT DO NOTHING;
