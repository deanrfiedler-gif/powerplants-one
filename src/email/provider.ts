import type { PoolClient } from "pg";
// This adapter has no credentials, network or Microsoft implementation.
export async function seedEmailProvider(c: PoolClient) {
  const workspace = "10000000-0000-4000-8000-000000000001", company = "20000000-0000-4000-8000-000000000001", owner = "30000000-0000-4000-8000-000000000001";
  await c.query(`INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
    SELECT workspace_id,user_id,company_id,cap,scope_type,scope_id,site_id,valid_from,valid_to FROM ppo.permission_grants CROSS JOIN unnest(ARRAY['email.read','email.edit']) cap WHERE user_id=$1 AND capability='shared.edit' ON CONFLICT DO NOTHING`, [owner]);
  for (const [id, subject, body] of [
    ["ec000000-0000-4000-8000-000000000001", "Irrigation upgrade — scope confirmation", "Hi, could we confirm the site visit and review the irrigation scope? Please record the next action against the correct opportunity. Thanks, Casey."],
    ["ec000000-0000-4000-8000-000000000002", "Climate monitoring — initial questions", "Hi, could we discuss sensor locations for the propagation area? This is a separate enquiry from the irrigation upgrade. Thanks, Casey."],
  ]) await c.query(`INSERT INTO ppo.email_messages(id,workspace_id,company_id,owner_id,provider,provider_id,created_by,updated_by,sender_name,sender_address,subject,body_text,received_at) VALUES($1::uuid,$2,$3,$4,'Synthetic',$1::text,$4,$4,'Casey Rowan','casey@banksia.example',$5,$6,'2026-09-08T00:00:00Z')`,[id,workspace,company,owner,subject,body]);
  await c.query(`INSERT INTO ppo.email_calendar_events(id,workspace_id,company_id,owner_id,provider,title,starts_at,ends_at,private) VALUES
    ('ec100000-0000-4000-8000-000000000001',$1,$2,$3,'Synthetic','Irrigation scope review','2026-09-08T00:00:00Z','2026-09-08T00:30:00Z',false),
    ('ec100000-0000-4000-8000-000000000002',$1,$2,$3,'Synthetic','Personal appointment','2026-09-08T02:30:00Z','2026-09-08T03:00:00Z',true)`,[workspace,company,owner]);
}
