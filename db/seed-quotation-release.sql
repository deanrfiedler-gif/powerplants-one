-- Named fictional local duties only. No hosted invitation or operational delegation.
INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name) VALUES
 ('e5050059-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','PPO-LocalSynthetic','quotation-approver','SYN Quotation approver'),
 ('e5050059-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','PPO-LocalSynthetic','quotation-issuer','SYN Quotation issuer');
INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
SELECT workspace_id,d.user_id::uuid,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to FROM ppo.permission_grants
CROSS JOIN (VALUES('e5050059-0000-4000-8000-000000000001'),('e5050059-0000-4000-8000-000000000002')) d(user_id)
WHERE permission_grants.user_id='30000000-0000-4000-8000-000000000001' AND company_id='20000000-0000-4000-8000-000000000001' AND scope_type='Company'
 AND capability IN ('shared.read','shared.internal.read','crm.opportunity.read','estimating.read','estimating.quote.read');
INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
SELECT workspace_id,d.user_id::uuid,company_id,d.capability,scope_type,scope_id,site_id,valid_from,valid_to FROM ppo.permission_grants
CROSS JOIN (VALUES('e5050059-0000-4000-8000-000000000001','estimating.quote.approve'),('e5050059-0000-4000-8000-000000000002','estimating.quote.issue'),('e5050059-0000-4000-8000-000000000002','estimating.quote.distribute')) d(user_id,capability)
WHERE permission_grants.user_id='30000000-0000-4000-8000-000000000001' AND company_id='20000000-0000-4000-8000-000000000001' AND scope_type='Company' AND permission_grants.capability='estimating.read';
