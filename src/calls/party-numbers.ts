import type { PoolClient } from "pg";
import type { Principal } from "../platform/identity";
import { database } from "../platform/database";
import { sharedOperation } from "../platform/operations";
import type { QueryClient } from "../platform/permissions";
import { companyContext } from "../shared/authority";
import { currentVersion, personEditAuthority } from "../shared/contacts/commands";
import { visible } from "../shared/reads";
import { choice, common, commonKeys, invalid, label, object, uuid, version } from "../shared/validation";
import { companyRegion, numberColumns, personRegion } from "./legacy-phone";
import { numberLabels, partyTypes, readPhoneNumber, type PartyType } from "./numbers";

export type PartyNumber = {
  id: string;
  label: (typeof numberLabels)[number];
  entered: string;
  e164: string | null;
  needs_checking: boolean;
  is_primary: boolean;
  position: number;
};
const column = (party: PartyType) => (party === "Person" ? "person_id" : "organisation_id");

export async function partyNumbers(c: QueryClient, workspaceId: string, party: PartyType, id: string) {
  return (
    await c.query<PartyNumber>(
      `SELECT ${numberColumns} FROM ppo.contact_numbers WHERE workspace_id=$1 AND ${column(party)}=$2 ORDER BY position`,
      [workspaceId, id],
    )
  ).rows;
}

export async function readPartyNumbers(p: Principal, party: unknown, id: string) {
  const kind = choice(party, "party", partyTypes);
  const c = database();
  const row = await visible(c, p, kind, uuid(id, "id"));
  return { party_version: row.version as number, numbers: await partyNumbers(c, p.workspace_id, kind, row.id) };
}

async function editAuthority(c: QueryClient, p: Principal, party: PartyType, id: string) {
  if (party === "Person") {
    const row = await personEditAuthority(c, p, id);
    return { row, region: await personRegion(c, p.workspace_id, id) };
  }
  const row = await visible(c, p, "Organisation", id);
  await companyContext(c, p, row.company_id, null, "shared.edit");
  return { row, region: await companyRegion(c, p.workspace_id, row.company_id) };
}

// Replaces a party's whole list, so the order, labels and primary are always one consistent set.
export async function setPartyNumbers(p: Principal, party: unknown, id: string, input: unknown) {
  const kind = choice(party, "party", partyTypes);
  const r = object(input, [...commonKeys, "expected_version", "numbers"]);
  if (!Array.isArray(r.numbers) || r.numbers.length > 10) invalid("numbers", "Provide 0–10 numbers.");
  const numbers = r.numbers.map((value, i) => {
    const n = object(value, ["label", "entered", "is_primary", "needs_checking"]);
    if (typeof n.is_primary !== "boolean") invalid(`numbers.${i}.is_primary`, "Choose whether this is the primary number.");
    if (n.needs_checking !== undefined && typeof n.needs_checking !== "boolean")
      invalid(`numbers.${i}.needs_checking`, "Choose whether this number needs checking.");
    return {
      label: choice(n.label, `numbers.${i}.label`, numberLabels),
      entered: label(n.entered, `numbers.${i}.entered`, 200),
      is_primary: n.is_primary as boolean,
      needs_checking: n.needs_checking === true,
    };
  });
  if (numbers.length && numbers.filter((n) => n.is_primary).length !== 1)
    invalid("numbers", "Mark exactly one number as primary.");
  const command = { ...common(r), id: uuid(id, "id"), party: kind, expected_version: version(r.expected_version), numbers };
  return sharedOperation(
    p,
    command,
    "SetPartyNumbers",
    (c) => editAuthority(c, p, kind, command.id),
    async (c: PoolClient, { row, region }) => {
      currentVersion(row.version, command.expected_version);
      const read = command.numbers.map((n) => ({ ...n, ...readPhoneNumber(n.entered, region) }));
      const known = read.flatMap((n) => (n.e164 ? [n.e164] : []));
      if (new Set(known).size !== known.length) invalid("numbers", "Each number may appear only once.");
      const before = await partyNumbers(c, p.workspace_id, kind, row.id);
      await c.query(`DELETE FROM ppo.contact_numbers WHERE workspace_id=$1 AND ${column(kind)}=$2`, [p.workspace_id, row.id]);
      for (const [i, n] of read.entries())
        await c.query(
          `INSERT INTO ppo.contact_numbers(id,workspace_id,${column(kind)},label,entered,e164,region,needs_checking,is_primary,position,created_by,updated_by)
           VALUES(gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10)`,
          [p.workspace_id, row.id, n.label, n.entered, n.e164, n.region, n.needs_checking || n.e164 === null, n.is_primary, i + 1, p.actor_id],
        );
      const primary = read.find((n) => n.is_primary)?.entered ?? null;
      const updated = (
        await c.query(
          kind === "Person"
            ? "UPDATE ppo.people SET phone=$3,version=version+1,updated_by=$4,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *,CASE WHEN active THEN 'Active' ELSE 'Inactive' END AS state"
            : "UPDATE ppo.organisations SET version=version+1,updated_by=$3,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *,'Recorded' AS state",
          kind === "Person" ? [p.workspace_id, row.id, primary, p.actor_id] : [p.workspace_id, row.id, p.actor_id],
        )
      ).rows[0];
      const summary = (list: Pick<PartyNumber, "label" | "entered" | "e164" | "needs_checking" | "is_primary">[]) =>
        list.map(({ label, entered, e164, needs_checking, is_primary }) => ({ label, entered, e164, needs_checking, is_primary }));
      const after = await partyNumbers(c, p.workspace_id, kind, row.id);
      return {
        ...updated,
        audit_details: { previous_version: row.version, before: { numbers: summary(before) }, after: { numbers: summary(after) } },
      };
    },
    kind,
    "SharedRecordUpdated",
  );
}
