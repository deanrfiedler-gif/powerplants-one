-- Repeated seed never overwrites edited records, receipts or reference identities.
INSERT INTO ppo.workspaces VALUES
('10000000-0000-4000-8000-000000000001','SYN PPO development',true),
('10000000-0000-4000-8000-000000000002','SYN PPO isolation test',true) ON CONFLICT DO NOTHING;
INSERT INTO ppo.companies VALUES
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Synthetic','PPO-SIM','SYN-A','SYN Greenhouse Demonstration',true),
('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','Synthetic','PPO-SIM','SYN-B','SYN Greenhouse Demonstration',true),
('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000002','Synthetic','PPO-SIM','SYN-C','SYN isolation company',true) ON CONFLICT DO NOTHING;
INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name) VALUES
('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','PPO-LocalSynthetic','coordinator','SYN Coordinator'),
('30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','PPO-LocalSynthetic','observer','SYN Observer'),
('30000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001','PPO-LocalSynthetic','systems','SYN Systems'),
('30000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000002','PPO-LocalSynthetic','other-workspace','SYN Other workspace') ON CONFLICT DO NOTHING;
INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability) VALUES
('10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','service.ticket.read'),
('10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','service.ticket.edit'),
('10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001','service.ticket.read'),
('10000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000003','service.ticket.read') ON CONFLICT DO NOTHING;
INSERT INTO ppo.tickets(id,workspace_id,company_id,display_number,summary,symptom,received_at,channel,requester_description,site_identification_needed,priority,triage_owner_id,status,created_at,created_by,updated_at,updated_by)
SELECT ('40000000-0000-4000-8000-00000000000'||n)::uuid,workspace_id,id,'SYN-PPO-TKT-00000'||n,
  CASE WHEN n=1 THEN 'Prepare an irrigation controller inspection' ELSE 'Restricted synthetic request '||n END,
  'Synthetic intermittent sensor reading; cause unverified.','2026-09-05T00:00:00Z','PlannedMaintenance',
  'SYN requester; coordinator to confirm identity',true,'Normal',
  CASE WHEN n=3 THEN '30000000-0000-4000-8000-000000000004'::uuid ELSE '30000000-0000-4000-8000-000000000001'::uuid END,
  'New','2026-09-05T00:00:00Z',
  CASE WHEN n=3 THEN '30000000-0000-4000-8000-000000000004'::uuid ELSE '30000000-0000-4000-8000-000000000001'::uuid END,
  '2026-09-05T00:00:00Z',
  CASE WHEN n=3 THEN '30000000-0000-4000-8000-000000000004'::uuid ELSE '30000000-0000-4000-8000-000000000001'::uuid END
FROM (SELECT c.*,right(c.id::text,1)::integer AS n FROM ppo.companies c) s
ON CONFLICT DO NOTHING;
