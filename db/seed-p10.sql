-- Independent synthetic Finance contexts, not earlier-stage handoffs or live mappings.
INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name) VALUES
('30000000-0000-4000-8000-000000000012','10000000-0000-4000-8000-000000000001','PPO-LocalSynthetic','finance-reviewer','SYN Finance reviewer'),
('30000000-0000-4000-8000-000000000013','10000000-0000-4000-8000-000000000001','PPO-LocalSynthetic','finance-processor','SYN Finance processor'),
('30000000-0000-4000-8000-000000000014','10000000-0000-4000-8000-000000000001','PPO-LocalSynthetic','finance-reconciler','SYN Finance reconciler');
INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id)
SELECT u.workspace_id,u.id,'20000000-0000-4000-8000-000000000001',cap,'Company','20000000-0000-4000-8000-000000000001',NULL
FROM ppo.users u CROSS JOIN unnest(ARRAY['shared.read','shared.finance.read','finance.read','finance.account.read']) AS cap
WHERE u.subject_id IN ('finance','finance-reviewer','finance-processor','finance-reconciler') ON CONFLICT DO NOTHING;
INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id)
SELECT u.workspace_id,u.id,'20000000-0000-4000-8000-000000000001',v.cap,'Company','20000000-0000-4000-8000-000000000001',NULL
FROM ppo.users u JOIN (VALUES('finance','finance.prepare'),('finance-reviewer','finance.review'),('finance-processor','finance.process'),('finance-reconciler','finance.reconcile'),('finance-reconciler','finance.issue')) v(profile,cap) ON u.subject_id=v.profile;
