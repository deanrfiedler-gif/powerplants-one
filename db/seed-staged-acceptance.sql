-- Explicit synthetic PJ-09 duties. Existing project.edit does not acquire acceptance authority.
-- No employees or hosted invited testers are assigned; users are existing synthetic profiles.
INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
SELECT g.workspace_id,u.id,g.company_id,d.capability,g.scope_type,g.scope_id,g.site_id,g.valid_from,g.valid_to
FROM ppo.permission_grants g
CROSS JOIN (VALUES
 ('coordinator','acceptance.scope'),('coordinator','acceptance.submit'),('coordinator','acceptance.prepare'),('coordinator','acceptance.issue'),('coordinator','acceptance.response.record'),('coordinator','acceptance.close.stage'),('coordinator','acceptance.close.project'),('coordinator','acceptance.reopen'),('coordinator','acceptance.source'),
 ('materials-engineer','acceptance.scope'),('materials-engineer','acceptance.submit'),('materials-engineer','acceptance.prepare'),('materials-engineer','acceptance.response.record'),
 ('materials-author','acceptance.scope'),('materials-author','acceptance.submit'),('materials-author','acceptance.prepare'),('materials-author','acceptance.response.record'),
 ('materials-reviewer','acceptance.technical'),('materials-reviewer','acceptance.response.validate'),('materials-reviewer','acceptance.close.stage'),('materials-reviewer','acceptance.close.project'),('materials-reviewer','acceptance.reopen'),
 ('materials-release','acceptance.issue'),('changes-service','acceptance.receive'),
 ('finance-reviewer','acceptance.commercial'),('finance-reviewer','acceptance.source')
) d(subject_id,capability)
JOIN ppo.users u ON u.workspace_id=g.workspace_id AND u.subject_id=d.subject_id AND u.issuer='PPO-LocalSynthetic'
WHERE g.user_id='30000000-0000-4000-8000-000000000001' AND g.company_id='20000000-0000-4000-8000-000000000001' AND g.scope_type='Company' AND g.capability='project.read'
ON CONFLICT DO NOTHING;
-- Independent receivers/reviewers need the same Project and Activity visibility they receive responsibility for.
INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
SELECT g.workspace_id,u.id,g.company_id,g.capability,g.scope_type,g.scope_id,g.site_id,g.valid_from,g.valid_to
FROM ppo.permission_grants g JOIN ppo.users u ON u.workspace_id=g.workspace_id AND u.issuer='PPO-LocalSynthetic' AND u.subject_id IN ('materials-reviewer','materials-release','changes-service','finance-reviewer','materials-engineer','materials-author')
WHERE g.user_id='30000000-0000-4000-8000-000000000001' AND g.company_id='20000000-0000-4000-8000-000000000001' AND g.scope_type='Company'
AND g.capability IN ('project.read','shared.read','shared.internal.read','activity.read','activity.edit','engineering.read')
ON CONFLICT DO NOTHING;
