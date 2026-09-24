-- Explicit fictional source-evidence reviewer. No existing user gains a duty,
-- and no estimate/quotation approval or hosted reviewer is configured.
INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name)
VALUES('e5030045-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','PPO-LocalSynthetic','estimating-source-reviewer','SYN Source evidence reviewer');
INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
SELECT workspace_id,'e5030045-0000-4000-8000-000000000001',company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to
FROM ppo.permission_grants WHERE user_id='30000000-0000-4000-8000-000000000001'
 AND company_id='20000000-0000-4000-8000-000000000001' AND scope_type='Company' AND capability IN ('shared.read','estimating.read');
INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
SELECT workspace_id,'e5030045-0000-4000-8000-000000000001',company_id,'estimating.source.review',scope_type,scope_id,site_id,valid_from,valid_to
FROM ppo.permission_grants WHERE user_id='30000000-0000-4000-8000-000000000001'
 AND company_id='20000000-0000-4000-8000-000000000001' AND scope_type='Company' AND capability='estimating.read';
