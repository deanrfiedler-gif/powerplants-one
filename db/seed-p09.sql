-- Seed receipt 9 prevents grant revival on repeated seed. No report/Finance facts are fabricated.
INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
SELECT g.workspace_id,g.user_id,g.company_id,cap,g.scope_type,g.scope_id,g.site_id,g.valid_from,g.valid_to FROM ppo.permission_grants g CROSS JOIN (VALUES('report.read'),('report.review'),('report.issue'),('report.respond')) x(cap)
WHERE g.capability='service.work_order.edit' AND g.user_id='30000000-0000-4000-8000-000000000001' AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp()) ON CONFLICT DO NOTHING;
INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
SELECT g.workspace_id,g.user_id,g.company_id,cap,g.scope_type,g.scope_id,g.site_id,g.valid_from,g.valid_to FROM ppo.permission_grants g CROSS JOIN (VALUES('report.read'),('report.respond')) x(cap)
WHERE g.capability='field.completion.own' AND g.user_id IN ('30000000-0000-4000-8000-000000000010','30000000-0000-4000-8000-000000000011') AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp()) ON CONFLICT DO NOTHING;
INSERT INTO ppo.report_templates(id,workspace_id,version,definition,content_hash)
SELECT 'e1000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001',1,d,encode(sha256(convert_to(d,'UTF8')),'hex') FROM (VALUES('PPO OUT-10 semantic HTML/A4 v1; customer-safe exact reviewed evidence; navy/green; escaped text; repeated identity and table headers; no external requests; no inherited signature; tagged PDF requested.')) x(d);
INSERT INTO ppo.report_template_policy(workspace_id,template_id) VALUES('10000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001');
