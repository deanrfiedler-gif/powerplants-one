-- Once under seed receipt 12. No customer, opportunity, estimate or quote created.
INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
SELECT g.workspace_id,g.user_id,g.company_id,cap,g.scope_type,g.scope_id,g.site_id,g.valid_from,g.valid_to
FROM ppo.permission_grants g JOIN ppo.users u ON (u.workspace_id,u.id)=(g.workspace_id,g.user_id)
CROSS JOIN unnest(ARRAY['estimating.read','estimating.edit','estimating.quote.read','estimating.quote.prepare']) cap
WHERE u.subject_id IN ('coordinator','second-company') AND u.active AND g.capability='crm.opportunity.edit'
AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp()) ON CONFLICT DO NOTHING;
