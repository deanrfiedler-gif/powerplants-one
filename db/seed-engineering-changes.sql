-- Once-only synthetic EN-07 responsibility profiles, governed by seed receipt 30. Fictional people only:
-- they allocate no employee, define no corporate authority and close no D-008/D-019 decision.
-- No existing identity, grant or business record is rewritten, and no change record is fabricated here;
-- the review scenario is built through the application's ordinary commands (scripts/engineering-changes-scenario.ts).
-- Authors, the discipline reviewer, the technical authority and the Supply Chain receiver are the fictional
-- people seed 29 already made. Three destinations had nobody to receive for them, so three people are added.
INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name) VALUES
('30000000-0000-4000-8000-000000000022','10000000-0000-4000-8000-000000000001','PPO-LocalSynthetic','changes-release-owner','SYN Riley Drawing issue owner'),
('30000000-0000-4000-8000-000000000023','10000000-0000-4000-8000-000000000001','PPO-LocalSynthetic','changes-service','SYN Jamie Service coordinator'),
('30000000-0000-4000-8000-000000000024','10000000-0000-4000-8000-000000000001','PPO-LocalSynthetic','changes-verifier','SYN Taylor Commissioning verifier');

-- Read context for the three, copied from the coordinator's current Company A scope. None of them authors.
INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
SELECT g.workspace_id,u.id,g.company_id,g.capability,g.scope_type,g.scope_id,g.site_id,g.valid_from,g.valid_to
FROM ppo.permission_grants g JOIN ppo.users u ON u.workspace_id=g.workspace_id
 AND u.subject_id IN ('changes-release-owner','changes-service','changes-verifier')
WHERE g.user_id='30000000-0000-4000-8000-000000000001' AND g.company_id='20000000-0000-4000-8000-000000000001' AND g.scope_type='Company'
 AND g.capability IN ('shared.read','shared.internal.read','project.read','engineering.read')
 AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp())
ON CONFLICT DO NOTHING;

-- One separate capability per independent duty. engineering.edit is authorship only and is granted to nobody
-- here. Review, technical decision, receiving, verification and closure are each their own capability, and the
-- policy below must separately name the same person before any of them takes effect.
INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
SELECT g.workspace_id,u.id,g.company_id,duty.capability,g.scope_type,g.scope_id,g.site_id,g.valid_from,g.valid_to
FROM ppo.permission_grants g
JOIN (VALUES ('materials-reviewer','engineering.change.review'),('materials-release','engineering.change.decide'),('materials-release','engineering.change.close'),
 ('materials-supply','engineering.change.receive'),('changes-release-owner','engineering.change.receive'),('changes-service','engineering.change.receive'),
 ('changes-verifier','engineering.change.receive'),('changes-verifier','engineering.change.verify'),('coordinator','engineering.change.receive')) AS duty(subject_id,capability) ON true
JOIN ppo.users u ON u.workspace_id=g.workspace_id AND u.subject_id=duty.subject_id AND u.issuer='PPO-LocalSynthetic'
WHERE g.user_id='30000000-0000-4000-8000-000000000001' AND g.company_id='20000000-0000-4000-8000-000000000001' AND g.scope_type='Company'
 AND g.capability='engineering.read' AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp())
ON CONFLICT DO NOTHING;

-- Fictional change-review policy, version 1, for Company A only. Company B deliberately has none, so it
-- demonstrates "Authority not configured". The coordinator stands in for the Project's commercial coordinator:
-- the commercial and scheduling prerequisite is an in-module synthetic record, never a Project or Finance approval.
INSERT INTO ppo.change_policies(id,workspace_id,company_id,site_id,policy_version,effective_from,grants)
SELECT 'e7000000-0000-4000-8000-000000000001',c.workspace_id,c.id,NULL,1,'2026-01-01T00:00:00Z',jsonb_build_array(
 jsonb_build_object('actor_id','30000000-0000-4000-8000-000000000018','role','DisciplineReviewer','disciplines',jsonb_build_array('Mechanical','Layout','Hydraulics','Electrical','Automation','Controls'),'destinations',jsonb_build_array()),
 jsonb_build_object('actor_id','30000000-0000-4000-8000-000000000019','role','TechnicalAuthority','disciplines',jsonb_build_array('Mechanical','Layout','Hydraulics','Electrical','Automation','Controls'),'destinations',jsonb_build_array()),
 jsonb_build_object('actor_id','30000000-0000-4000-8000-000000000019','role','Closer','disciplines',jsonb_build_array(),'destinations',jsonb_build_array()),
 jsonb_build_object('actor_id','30000000-0000-4000-8000-000000000001','role','CommercialReviewer','disciplines',jsonb_build_array(),'destinations',jsonb_build_array()),
 jsonb_build_object('actor_id','30000000-0000-4000-8000-000000000001','role','Receiver','disciplines',jsonb_build_array(),'destinations',jsonb_build_array('Projects')),
 jsonb_build_object('actor_id','30000000-0000-4000-8000-000000000020','role','Receiver','disciplines',jsonb_build_array(),'destinations',jsonb_build_array('SupplyChain','Materials')),
 jsonb_build_object('actor_id','30000000-0000-4000-8000-000000000022','role','Receiver','disciplines',jsonb_build_array(),'destinations',jsonb_build_array('TechnicalRelease','DocumentControl')),
 jsonb_build_object('actor_id','30000000-0000-4000-8000-000000000023','role','Receiver','disciplines',jsonb_build_array(),'destinations',jsonb_build_array('Service')),
 jsonb_build_object('actor_id','30000000-0000-4000-8000-000000000024','role','Receiver','disciplines',jsonb_build_array(),'destinations',jsonb_build_array('Commissioning')),
 jsonb_build_object('actor_id','30000000-0000-4000-8000-000000000024','role','Verifier','disciplines',jsonb_build_array(),'destinations',jsonb_build_array()))
FROM ppo.companies c WHERE c.id='20000000-0000-4000-8000-000000000001' AND c.workspace_id='10000000-0000-4000-8000-000000000001';
