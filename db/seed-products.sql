-- Named fictional local Products duties only; no hosted role or invitation.
INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name) VALUES
 ('d0520000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','PPO-LocalSynthetic','products-reader','SYN Products reader'),
 ('d0520000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','PPO-LocalSynthetic','products-author','SYN Products author'),
 ('d0520000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001','PPO-LocalSynthetic','products-reviewer','SYN Products reviewer'),
 ('d0520000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000001','PPO-LocalSynthetic','products-publisher','SYN Products publisher');
INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
SELECT g.workspace_id,d.user_id::uuid,g.company_id,d.capability,g.scope_type,g.scope_id,g.site_id,g.valid_from,g.valid_to
FROM ppo.permission_grants g CROSS JOIN (VALUES
 ('d0520000-0000-4000-8000-000000000001','shared.read'),
 ('d0520000-0000-4000-8000-000000000001','products.read'),
 ('d0520000-0000-4000-8000-000000000002','shared.read'),
 ('d0520000-0000-4000-8000-000000000002','products.read'),
 ('d0520000-0000-4000-8000-000000000002','products.edit'),
 ('d0520000-0000-4000-8000-000000000002','products.commercial.read'),
 ('d0520000-0000-4000-8000-000000000002','products.sources.bind'),
 ('d0520000-0000-4000-8000-000000000002','products.relationship.edit'),
 ('d0520000-0000-4000-8000-000000000002','products.import.stage'),
 ('d0520000-0000-4000-8000-000000000002','products.import.apply'),
 ('d0520000-0000-4000-8000-000000000002','estimating.read'),
 ('d0520000-0000-4000-8000-000000000002','estimating.edit'),
 ('d0520000-0000-4000-8000-000000000003','shared.read'),
 ('d0520000-0000-4000-8000-000000000003','products.read'),
 ('d0520000-0000-4000-8000-000000000003','products.review'),
 ('d0520000-0000-4000-8000-000000000003','products.commercial.read'),
 ('d0520000-0000-4000-8000-000000000003','products.relationship.review'),
 ('d0520000-0000-4000-8000-000000000003','products.import.review'),
 ('d0520000-0000-4000-8000-000000000003','estimating.read'),
 ('d0520000-0000-4000-8000-000000000004','shared.read'),
 ('d0520000-0000-4000-8000-000000000004','products.read'),
 ('d0520000-0000-4000-8000-000000000004','products.publish')
) d(user_id,capability) WHERE g.user_id='30000000-0000-4000-8000-000000000001' AND g.company_id='20000000-0000-4000-8000-000000000001' AND g.scope_type='Company' AND g.capability='shared.read';
