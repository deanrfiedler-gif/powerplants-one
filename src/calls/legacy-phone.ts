import type { PoolClient } from "pg";
import type { Principal } from "../platform/identity";
import { AppError } from "../platform/errors";
import type { QueryClient } from "../platform/permissions";
import { readPhoneNumber } from "./numbers";

export const numberColumns = "id,label,entered,e164,needs_checking,is_primary,position";

// Q9: a company without a phone setting reads local numbers as Australian.
export async function companyRegion(c: QueryClient, workspaceId: string, companyId: string) {
  return (
    (
      await c.query(
        "SELECT default_phone_region FROM ppo.company_phone_settings WHERE workspace_id=$1 AND company_id=$2",
        [workspaceId, companyId],
      )
    ).rows[0]?.default_phone_region ?? "AU"
  );
}

// A Person shared by several companies reads numbers in the region of its first company context.
export async function personRegion(c: QueryClient, workspaceId: string, personId: string) {
  const company = (
    await c.query(
      "SELECT company_id FROM ppo.person_company_contexts WHERE workspace_id=$1 AND person_id=$2 ORDER BY company_id LIMIT 1",
      [workspaceId, personId],
    )
  ).rows[0]?.company_id;
  return company ? companyRegion(c, workspaceId, company) : "AU";
}

// Upgrade proofs run current commands against schemas older than 0118; there is nothing to sync.
async function numbersInstalled(c: QueryClient) {
  return !!(await c.query("SELECT to_regclass('ppo.contact_numbers') AS relation")).rows[0].relation;
}

// The single-phone field on Person forms predates multiple numbers. It edits the one number a
// person has; with several numbers it cannot know which is meant, so it refuses rather than guess.
export async function syncLegacyPhone(c: PoolClient, p: Principal, personId: string, phone: string | null) {
  if (!(await numbersInstalled(c))) return;
  const existing = (
    await c.query(`SELECT ${numberColumns} FROM ppo.contact_numbers WHERE workspace_id=$1 AND person_id=$2 ORDER BY position`, [
      p.workspace_id,
      personId,
    ])
  ).rows;
  if (existing.length > 1)
    throw new AppError(409, "UseNumbersEditor", "This person has several numbers. Change them in the numbers editor.");
  if (phone === null) {
    if (existing.length)
      await c.query("DELETE FROM ppo.contact_numbers WHERE workspace_id=$1 AND id=$2", [p.workspace_id, existing[0].id]);
    return;
  }
  const read = readPhoneNumber(phone, await personRegion(c, p.workspace_id, personId));
  if (existing.length)
    await c.query(
      "UPDATE ppo.contact_numbers SET entered=$3,e164=$4,region=$5,needs_checking=$6,updated_at=clock_timestamp(),updated_by=$7 WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, existing[0].id, read.entered, read.e164, read.region, read.e164 === null, p.actor_id],
    );
  else
    await c.query(
      "INSERT INTO ppo.contact_numbers(id,workspace_id,person_id,label,entered,e164,region,needs_checking,is_primary,position,created_by,updated_by) VALUES(gen_random_uuid(),$1,$2,'Other',$3,$4,$5,$6,true,1,$7,$7)",
      [p.workspace_id, personId, read.entered, read.e164, read.region, read.e164 === null, p.actor_id],
    );
}
