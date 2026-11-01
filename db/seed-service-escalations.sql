-- Synthetic SV-08 duty profiles only. The assigned technician demonstrates the senior role.
-- Derive the existing scopes, never widen them, and never reinstate a revoked grant.
INSERT INTO ppo.permission_grants(id,workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
SELECT md5('sv08:'||g.id::text)::uuid,g.workspace_id,g.user_id,g.company_id,'service_escalation.record',g.scope_type,g.scope_id,g.site_id,g.valid_from,g.valid_to
FROM ppo.permission_grants g JOIN ppo.users u ON (u.workspace_id,u.id)=(g.workspace_id,g.user_id)
WHERE u.active AND u.issuer='PPO-LocalSynthetic' AND u.subject_id IN ('coordinator','assigned-technician')
AND g.capability='activity.edit' AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp())
AND NOT EXISTS(SELECT 1 FROM ppo.permission_grants x WHERE x.workspace_id=g.workspace_id AND x.user_id=g.user_id AND x.capability='service_escalation.record' AND x.scope_type=g.scope_type AND x.scope_id IS NOT DISTINCT FROM g.scope_id)
ON CONFLICT DO NOTHING;
