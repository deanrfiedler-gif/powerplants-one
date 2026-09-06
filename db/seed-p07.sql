-- Non-destructive P07 grants for explicitly fictional technician identities only.
INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
SELECT g.workspace_id,g.user_id,g.company_id,cap,g.scope_type,g.scope_id,g.site_id,g.valid_from,g.valid_to
FROM ppo.permission_grants g CROSS JOIN (VALUES('field.read.own'),('field.start.own'),('field.capture.own'),('field.correct.own'),('field.attachment.own'),('field.completion.own'),('activity.read'),('activity.edit')) x(cap)
WHERE g.capability='pack.acknowledge' AND g.user_id IN ('30000000-0000-4000-8000-000000000010','30000000-0000-4000-8000-000000000011') AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp()) ON CONFLICT DO NOTHING;
