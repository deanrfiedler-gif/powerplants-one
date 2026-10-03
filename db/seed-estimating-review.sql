-- Separate explicit evidence-review duties for one existing local fictional reader.
-- Existing source review does not imply any of these; no commercial/hosted authority.
INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
SELECT workspace_id,'e5030045-0000-4000-8000-000000000001',company_id,d.capability,scope_type,scope_id,site_id,valid_from,valid_to
FROM ppo.permission_grants CROSS JOIN (VALUES('estimating.review.completeness'),('estimating.review.price'),('estimating.review.technical')) d(capability)
WHERE user_id='30000000-0000-4000-8000-000000000001' AND company_id='20000000-0000-4000-8000-000000000001' AND scope_type='Company' AND permission_grants.capability='estimating.read';

INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
SELECT workspace_id,'e5030045-0000-4000-8000-000000000001',company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to
FROM ppo.permission_grants WHERE user_id='30000000-0000-4000-8000-000000000001' AND company_id='20000000-0000-4000-8000-000000000001' AND scope_type='Company' AND capability IN ('crm.opportunity.read','shared.internal.read');
