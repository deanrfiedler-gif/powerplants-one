-- PPO-CONV-T2-SCOPE W2/W7: local synthetic posters alone may ask Carl, in the same scope and validity.
-- No Carl user, hosted grant or provider configuration. IDs make replay and upgrade assertions exact.
INSERT INTO ppo.permission_grants(id,workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
SELECT md5('ppo-conversations-t2b:'||g.id::text||':conversation.agent.ask')::uuid,g.workspace_id,g.user_id,g.company_id,
 'conversation.agent.ask',g.scope_type,g.scope_id,g.site_id,g.valid_from,g.valid_to
FROM ppo.permission_grants g
JOIN ppo.users u ON (u.workspace_id,u.id)=(g.workspace_id,g.user_id) AND u.issuer='PPO-LocalSynthetic' AND u.active
WHERE g.capability='conversation.post'
 AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp())
ORDER BY g.id
ON CONFLICT DO NOTHING;
INSERT INTO ppo.assistant_budget_settings(workspace_id,monthly_ceiling_micro)
SELECT id,30000000 FROM ppo.workspaces ORDER BY id ON CONFLICT DO NOTHING;
