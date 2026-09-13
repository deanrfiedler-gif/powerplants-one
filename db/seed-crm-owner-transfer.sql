-- Once-only synthetic capability/receiver, governed by seed receipt 24.
-- No existing identity, grant, opportunity or Activity is rewritten.
INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name)
VALUES('30000000-0000-4000-8000-000000000015','10000000-0000-4000-8000-000000000001','PPO-LocalSynthetic','crm-receiver','SYN Sales receiver');
INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
SELECT workspace_id,'30000000-0000-4000-8000-000000000015',company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to
FROM ppo.permission_grants WHERE user_id='30000000-0000-4000-8000-000000000001'
 AND company_id='20000000-0000-4000-8000-000000000001' AND scope_type='Company'
 AND capability IN ('shared.read','shared.internal.read','crm.opportunity.read','crm.opportunity.edit','activity.read','activity.edit')
 AND valid_from<=clock_timestamp() AND (valid_to IS NULL OR valid_to>clock_timestamp());
INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
SELECT workspace_id,user_id,company_id,'crm.opportunity.transfer.own',scope_type,scope_id,site_id,valid_from,valid_to
FROM ppo.permission_grants WHERE user_id='30000000-0000-4000-8000-000000000001'
 AND company_id='20000000-0000-4000-8000-000000000001' AND scope_type='Company' AND capability='crm.opportunity.edit'
 AND valid_from<=clock_timestamp() AND (valid_to IS NULL OR valid_to>clock_timestamp());
