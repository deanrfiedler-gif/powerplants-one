-- Synthetic P4/P5 only. New scopes bind v3; existing v1/v2 pins remain unchanged.
INSERT INTO ppo.policy_versions(id,workspace_id,policy_type,key,version,status,effective_at,definition)
SELECT '94000000-0000-4000-8000-000000000003',workspace_id,policy_type,key,3,status,'2026-10-24T00:00:00Z',
 definition || '{"customer_site_readiness":"Derived from current-schedule SiteReadiness contact within the synthetic window; no manual pass or exception"}'::jsonb
FROM ppo.policy_versions WHERE id='94000000-0000-4000-8000-000000000002' ON CONFLICT DO NOTHING;
INSERT INTO ppo.policy_criteria(workspace_id,policy_version_id,criterion_code,label,blocking_stage,exception_allowed,not_applicable_allowed,applicability)
SELECT workspace_id,'94000000-0000-4000-8000-000000000003',criterion_code,label,blocking_stage,exception_allowed,not_applicable_allowed,applicability
FROM ppo.policy_criteria WHERE policy_version_id='94000000-0000-4000-8000-000000000002' ON CONFLICT DO NOTHING;
INSERT INTO ppo.policy_criteria(workspace_id,policy_version_id,criterion_code,label,blocking_stage,exception_allowed,not_applicable_allowed,applicability)
VALUES('10000000-0000-4000-8000-000000000001','94000000-0000-4000-8000-000000000003','CustomerSiteReadiness','Customer site readiness','Dispatch',false,false,'Always') ON CONFLICT DO NOTHING;
INSERT INTO ppo.scheduling_preparation_policies(id,workspace_id,reference,version,readiness_policy_id,confirmation_opens_hours,confirmation_due_hours,issue_due_minute,calendar_basis,evidence)
VALUES('12000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','SYN-POL-000001',1,'94000000-0000-4000-8000-000000000003',120,24,720,'PublishedLeadCalendar',
 'Synthetic P4/P5 Q4: confirmation opens five days before, due 24 hours before; pack due noon site time on the previous working day of the assigned lead calendar. Service sets real values under D-015.') ON CONFLICT DO NOTHING;
