-- Synthetic-only receiving reviewer for the CS completion proof.
-- A dedicated fictional reviewer preserves every existing profile's authority.
-- No new capability, business approval authority or production grant.
INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name)
VALUES('c5010044-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','PPO-LocalSynthetic','cs-reviewer','SYN Customer records reviewer');
INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
SELECT workspace_id,'c5010044-0000-4000-8000-000000000001',company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to
FROM ppo.permission_grants WHERE user_id='30000000-0000-4000-8000-000000000001'
 AND company_id='20000000-0000-4000-8000-000000000001' AND scope_type='Company'
 AND capability IN ('shared.read','shared.edit','shared.internal.read','activity.read');
