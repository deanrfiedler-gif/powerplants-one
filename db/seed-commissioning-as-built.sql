-- Once-only synthetic EN-08 responsibility profiles, governed by seed receipt 31. Fictional people only: they
-- allocate no employee, define no corporate authority, qualify nobody and close no D-019 decision.
-- No existing identity, grant or business record is rewritten, and no commissioning record is fabricated here;
-- the review scenario is built through the application's ordinary commands (scripts/engineering-commissioning-scenario.ts).
-- Preparers, the performer, the reviewer, the issue authority and the Service and Projects receivers are the
-- fictional people seeds 1, 29 and 30 already made. The installed base had nobody to receive for it, so one is added.
INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name) VALUES
('30000000-0000-4000-8000-000000000025','10000000-0000-4000-8000-000000000001','PPO-LocalSynthetic','commissioning-equipment','SYN Morgan Equipment records');

-- Read context for the Equipment receiver, copied from the coordinator's current Company A scope. They author nothing.
INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
SELECT g.workspace_id,u.id,g.company_id,g.capability,g.scope_type,g.scope_id,g.site_id,g.valid_from,g.valid_to
FROM ppo.permission_grants g JOIN ppo.users u ON u.workspace_id=g.workspace_id AND u.subject_id='commissioning-equipment' AND u.issuer='PPO-LocalSynthetic'
WHERE g.user_id='30000000-0000-4000-8000-000000000001' AND g.company_id='20000000-0000-4000-8000-000000000001' AND g.scope_type='Company'
 AND g.capability IN ('shared.read','shared.internal.read','project.read','engineering.read')
 AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp())
ON CONFLICT DO NOTHING;

-- One separate capability per independent duty. engineering.edit stays authorship only and is granted to nobody
-- here: it never captures a test, reviews evidence, approves an as-built, issues a release or receives one. The
-- policy below must separately name the same person before any of these takes effect.
INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
SELECT g.workspace_id,u.id,g.company_id,duty.capability,g.scope_type,g.scope_id,g.site_id,g.valid_from,g.valid_to
FROM ppo.permission_grants g
JOIN (VALUES ('changes-verifier','engineering.commissioning.capture'),('materials-reviewer','engineering.commissioning.review'),('materials-release','engineering.commissioning.issue'),
 ('changes-service','engineering.commissioning.receive'),('commissioning-equipment','engineering.commissioning.receive'),('coordinator','engineering.commissioning.receive')) AS duty(subject_id,capability) ON true
JOIN ppo.users u ON u.workspace_id=g.workspace_id AND u.subject_id=duty.subject_id AND u.issuer='PPO-LocalSynthetic'
WHERE g.user_id='30000000-0000-4000-8000-000000000001' AND g.company_id='20000000-0000-4000-8000-000000000001' AND g.scope_type='Company'
 AND g.capability='engineering.read' AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp())
ON CONFLICT DO NOTHING;

-- An owned follow-up is one action in My Work, never a copy of one. The people who raise a defect and the two
-- preparers who own them may hold that action, in the company scope where they already read Engineering.
INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
SELECT g.workspace_id,u.id,g.company_id,work.capability,g.scope_type,g.scope_id,g.site_id,g.valid_from,g.valid_to
FROM ppo.permission_grants g
JOIN (VALUES ('activity.read'),('activity.edit')) AS work(capability) ON true
JOIN ppo.users u ON u.workspace_id=g.workspace_id AND u.issuer='PPO-LocalSynthetic' AND u.subject_id IN ('materials-author','materials-engineer','materials-reviewer','changes-verifier')
WHERE g.user_id='30000000-0000-4000-8000-000000000001' AND g.company_id='20000000-0000-4000-8000-000000000001' AND g.scope_type='Company'
 AND g.capability='engineering.read' AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp())
ON CONFLICT DO NOTHING;

-- Fictional commissioning policy, version 1, for Company A only. Company B deliberately has none, so it
-- demonstrates "Authority not configured". Independence is required for all three review decisions: the person
-- who prepared or performed never approves, reviews or reconciles their own work. The source assessor is the
-- coordinator who already operates the synthetic upstream adapter.
INSERT INTO ppo.commissioning_policies(id,workspace_id,company_id,site_id,policy_version,effective_from,independence,grants)
SELECT 'e8000000-0000-4000-8000-000000000001',c.workspace_id,c.id,NULL,1,'2026-01-01T00:00:00Z',
 jsonb_build_object('basis',true,'evidence',true,'as_built',true),jsonb_build_array(
 jsonb_build_object('actor_id','30000000-0000-4000-8000-000000000024','role','Performer','destinations',jsonb_build_array()),
 jsonb_build_object('actor_id','30000000-0000-4000-8000-000000000018','role','BasisApprover','destinations',jsonb_build_array()),
 jsonb_build_object('actor_id','30000000-0000-4000-8000-000000000018','role','EvidenceReviewer','destinations',jsonb_build_array()),
 jsonb_build_object('actor_id','30000000-0000-4000-8000-000000000018','role','AsBuiltApprover','destinations',jsonb_build_array()),
 jsonb_build_object('actor_id','30000000-0000-4000-8000-000000000019','role','Issuer','destinations',jsonb_build_array()),
 jsonb_build_object('actor_id','30000000-0000-4000-8000-000000000001','role','SourceAssessor','destinations',jsonb_build_array()),
 jsonb_build_object('actor_id','30000000-0000-4000-8000-000000000023','role','Receiver','destinations',jsonb_build_array('Service')),
 jsonb_build_object('actor_id','30000000-0000-4000-8000-000000000025','role','Receiver','destinations',jsonb_build_array('Equipment')),
 jsonb_build_object('actor_id','30000000-0000-4000-8000-000000000001','role','Receiver','destinations',jsonb_build_array('Projects')))
FROM ppo.companies c WHERE c.id='20000000-0000-4000-8000-000000000001' AND c.workspace_id='10000000-0000-4000-8000-000000000001';

-- Fictional test instruments and their calibration records, observed through the synthetic calibration fixture.
-- The dates are fixed so that three cases always hold whatever day the application is opened: PG-014 was valid
-- on the fixture test dates and is expired today; FM-022 is valid throughout; PG-009 was withdrawn with effect
-- from before the fixture test dates. No real instrument, certificate or laboratory is described.
INSERT INTO ppo.inspection_instruments(id,workspace_id,company_id,reference,description,calibration_reference,calibration_version,valid_from,valid_to,withdrawn_effective_from,withdrawn_reason,withdrawn_recorded_at)
SELECT v.id::uuid,c.workspace_id,c.id,v.reference,v.description,v.calibration_reference,'1',v.valid_from::date,v.valid_to::date,v.withdrawn_from::date,v.withdrawn_reason,CASE WHEN v.withdrawn_from IS NULL THEN NULL ELSE '2026-09-18T00:00:00Z'::timestamptz END
FROM ppo.companies c CROSS JOIN (VALUES
 ('e8100000-0000-4000-8000-000000000001','SYN-INS-PG-014','SYN pressure gauge 0-1000 kPa','SYN-CAL-2025-0914','2025-09-14','2026-09-13',NULL,NULL),
 ('e8100000-0000-4000-8000-000000000002','SYN-INS-FM-022','SYN clamp-on flow meter','SYN-CAL-2026-0301','2026-03-01','2027-02-28',NULL,NULL),
 ('e8100000-0000-4000-8000-000000000003','SYN-INS-PG-009','SYN pressure gauge 0-600 kPa','SYN-CAL-2026-0110','2026-01-10','2027-01-09','2026-08-01','SYN laboratory notice: reference standard found out of tolerance'),
 ('e8100000-0000-4000-8000-000000000004','SYN-INS-LX-003','SYN PAR light meter','SYN-CAL-2026-0502','2026-05-02','2027-05-01',NULL,NULL)
) AS v(id,reference,description,calibration_reference,valid_from,valid_to,withdrawn_from,withdrawn_reason)
WHERE c.id='20000000-0000-4000-8000-000000000001' AND c.workspace_id='10000000-0000-4000-8000-000000000001';
