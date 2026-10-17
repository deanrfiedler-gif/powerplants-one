-- Conversations T1b (PPO-CONV-T1-SCOPE rules T1-1, T1-2; answer U3). conversation.read and conversation.post go to every
-- local synthetic profile that already holds crm.opportunity.read or project.read, in exactly that grant's scope and
-- validity: the thread's read right follows the record's read capability, so no profile gains a record it could not open.
-- Hosted demo testers (a different issuer) are not granted; exposure there is a separate decision at T1c.
-- No user, identity or other grant is added, and a revoked or expired source grant is not copied as live.
-- Each new grant's id is derived from its source grant and the duty, so a repeat or an upgrade proof can name it exactly;
-- the source order is fixed so that, where one profile holds both read capabilities in one scope, the same grant wins.
INSERT INTO ppo.permission_grants(id,workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
SELECT md5('ppo-conversations-t1b:'||g.id::text||':'||duty.capability)::uuid,g.workspace_id,g.user_id,g.company_id,duty.capability,g.scope_type,g.scope_id,g.site_id,g.valid_from,g.valid_to
FROM ppo.permission_grants g
JOIN ppo.users u ON (u.workspace_id,u.id)=(g.workspace_id,g.user_id) AND u.issuer='PPO-LocalSynthetic' AND u.active
CROSS JOIN (VALUES ('conversation.read'),('conversation.post')) AS duty(capability)
WHERE g.capability IN ('crm.opportunity.read','project.read')
 AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp())
ORDER BY g.capability,g.id,duty.capability
ON CONFLICT DO NOTHING;
