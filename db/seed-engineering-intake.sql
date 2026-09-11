-- Existing fictional coordinator scopes only; no fabricated engineering business records.
INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
SELECT g.workspace_id,g.user_id,g.company_id,cap,g.scope_type,g.scope_id,g.site_id,g.valid_from,g.valid_to
FROM ppo.permission_grants g JOIN ppo.users u ON (u.workspace_id,u.id)=(g.workspace_id,g.user_id)
CROSS JOIN unnest(ARRAY['engineering.read','engineering.create','engineering.edit']) AS cap
WHERE u.subject_id IN ('coordinator','second-company') AND u.active AND g.capability='shared.edit'
AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp())
AND EXISTS(SELECT 1 FROM ppo.permission_grants r WHERE r.workspace_id=g.workspace_id AND r.user_id=g.user_id AND r.capability='shared.internal.read' AND r.scope_type=g.scope_type AND r.scope_id=g.scope_id AND r.valid_from<=clock_timestamp() AND (r.valid_to IS NULL OR r.valid_to>clock_timestamp()))
ON CONFLICT DO NOTHING;
