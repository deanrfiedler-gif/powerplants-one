import { createHash } from "node:crypto";
import type { PoolClient } from "pg";
import type { Principal } from "../platform/identity";
import { database } from "../platform/database";
import { AppError, unavailable } from "../platform/errors";
import { canonical, sharedOperation } from "../platform/operations";
import { visibleActivity } from "../activities/activities";
import { requireCapability, type QueryClient } from "../platform/permissions";
import { visible } from "../shared/reads";
import { choice, common, commonKeys, invalid, object, uuid, version } from "../shared/validation";
import { matchingParties } from "./lookup";
import { skipReasons, type PartyType, callDirections, callSources } from "./numbers";

export type IncomingCall = {
  id: string;
  source: (typeof callSources)[number];
  source_reference: string;
  direction: (typeof callDirections)[number];
  number_e164: string;
  party?: { type: PartyType; id: string };
  started_at?: string;
  answered: boolean | null;
  duration_seconds: number | null;
};
const eventColumns = "*,coalesce(resolved_at,created_at) AS updated_at";

// Q5: skipped events are kept for 30 days so a mistaken skip can be found, then deleted.
export async function purgeSkippedCallEvents(c: QueryClient, p: Principal) {
  await c.query(
    "DELETE FROM ppo.call_events WHERE workspace_id=$1 AND state='Skipped' AND resolved_at<clock_timestamp()-interval '30 days'",
    [p.workspace_id],
  );
}

// The one entry point for every source (stage 2 phone app and stage 3 connectors included).
// R3: a number matching nobody this user may read stores nothing. R8: a repeated source reference
// returns the event already recorded. R5: the party is recorded only when it is unambiguous.
export async function ingestCallEvent(c: PoolClient, p: Principal, e: IncomingCall) {
  await requireCapability(c, p, "shared.read");
  if (typeof e.source_reference !== "string" || !e.source_reference.length || e.source_reference.length > 200)
    invalid("source_reference", "Provide a source reference of 1–200 characters.");
  // Retain only an opaque deduplication key, never a provider reference that may contain call data.
  const sourceKey = createHash("sha256").update(canonical({ source: e.source, reference: e.source_reference })).digest("hex");
  // Every source is serialised here, including future callers that do not use sharedOperation.
  await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [p.workspace_id]);
  const matches = await matchingParties(c, p, e.number_e164);
  if (!matches.length) return null;
  const party =
    e.party ?? (matches.length === 1 ? { type: matches[0].party_type, id: matches[0].party_id } : null);
  if (party && !matches.some((m) => m.party_type === party.type && m.party_id === party.id)) return null;
  // Look before inserting: the identity trigger runs before any ON CONFLICT clause, so a skipped
  // duplicate insert would leave an identity without its event. Callers hold the workspace lock.
  const existing = (
    await c.query(`SELECT ${eventColumns} FROM ppo.call_events WHERE workspace_id=$1 AND source_key=$2`, [
      p.workspace_id,
      sourceKey,
    ])
  ).rows[0];
  if (existing) {
    if (existing.user_id !== p.actor_id) throw unavailable();
    if (existing.person_id) await visible(c, p, "Person", existing.person_id);
    if (existing.organisation_id) await visible(c, p, "Organisation", existing.organisation_id);
    if (existing.activity_id) await visibleActivity(c, p, existing.activity_id);
    return existing;
  }
  if ((await c.query("SELECT 1 FROM ppo.business_identities WHERE workspace_id=$1 AND id=$2", [p.workspace_id, e.id])).rowCount)
    throw new AppError(409, "RelationshipConflict", "This call event identity has already been used.");
  return (
    await c.query(
      `INSERT INTO ppo.call_events(id,workspace_id,user_id,source,source_key,direction,number_e164,person_id,organisation_id,started_at,answered,duration_seconds,created_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,coalesce($10::timestamptz,clock_timestamp()),$11,$12,$3) RETURNING ${eventColumns}`,
      [
        e.id, p.workspace_id, p.actor_id, e.source, sourceKey, e.direction, e.number_e164,
        party?.type === "Person" ? party.id : null, party?.type === "Organisation" ? party.id : null,
        e.started_at ?? null, e.answered, e.duration_seconds,
      ],
    )
  ).rows[0];
}

// R1: tapping Call records only that a call was started. Nothing is logged or completed here.
export async function recordClickToCall(p: Principal, input: unknown) {
  const r = object(input, [...commonKeys, "id", "number_id"]);
  const command = { ...common(r), id: uuid(r.id, "id"), number_id: uuid(r.number_id, "number_id") };
  return sharedOperation(
    p,
    command,
    "RecordClickToCall",
    async (c) => {
      // Authorisation precedes receipt replay: a purged identity can never resurrect its receipt.
      const priorIdentity = (await c.query("SELECT 1 FROM ppo.business_identities WHERE workspace_id=$1 AND id=$2", [p.workspace_id, command.id])).rowCount;
      if (priorIdentity) await callEventReceiptAuthority(c, p, command.id);
      const number = (
        await c.query("SELECT * FROM ppo.contact_numbers WHERE workspace_id=$1 AND id=$2", [p.workspace_id, command.number_id])
      ).rows[0];
      if (!number) throw unavailable();
      const type: PartyType = number.person_id ? "Person" : "Organisation";
      await visible(c, p, type, number.person_id ?? number.organisation_id);
      if (!number.e164 || number.needs_checking)
        throw new AppError(422, "NumberNeedsChecking", "This number needs checking before it can be called from PPO.");
      return { number, type };
    },
    async (c, { number, type }) => {
      if ((await c.query("SELECT 1 FROM ppo.business_identities WHERE workspace_id=$1 AND id=$2", [p.workspace_id, command.id])).rowCount)
        throw new AppError(409, "RelationshipConflict", "This call event already exists.");
      await purgeSkippedCallEvents(c, p);
      const event = await ingestCallEvent(c, p, {
        id: command.id,
        source: "ClickToCall",
        source_reference: command.id,
        direction: "Outgoing",
        number_e164: number.e164,
        party: { type, id: number.person_id ?? number.organisation_id },
        answered: null,
        duration_seconds: null,
      });
      if (!event) throw unavailable();
      if (event.id !== command.id)
        throw new AppError(409, "RelationshipConflict", "This call event already exists.");
      // Call facts live only on the purgeable event, not in append-only audit/outbox evidence.
      return event;
    },
    "CallEvent",
    "CallEventRecorded",
  );
}

// Calls to log lists only the signed-in user's own events. A party the user can no longer read is
// left out (R4), and a shared number shows how many people the user can see holding it (R5).
export async function listCallsToLog(p: Principal) {
  const c = database();
  await requireCapability(c, p, "shared.read");
  const events = (
    await c.query(
      `SELECT ${eventColumns} FROM ppo.call_events WHERE workspace_id=$1 AND user_id=$2 AND state='ToLog' ORDER BY started_at DESC,id`,
      [p.workspace_id, p.actor_id],
    )
  ).rows;
  const items = [];
  for (const e of events) {
    const matches = await matchingParties(c, p, e.number_e164);
    const stored = e.person_id ?? e.organisation_id;
    const party = matches.find((m) => m.party_id === stored);
    items.push({
      id: e.id as string,
      version: e.version as number,
      source: e.source as string,
      direction: e.direction as string,
      number_e164: e.number_e164 as string,
      started_at: e.started_at as Date,
      answered: e.answered as boolean | null,
      duration_seconds: e.duration_seconds as number | null,
      party: party ? { type: party.party_type, id: party.party_id, display_name: party.display_name } : null,
      match_count: matches.length,
    });
  }
  return { items, count: items.length };
}

// Authority only: a call event is its owner's alone. State and version are checked after the
// receipt lookup, so an exact replay of a completed command still returns its receipt.
export async function ownEvent(c: QueryClient, p: Principal, id: string) {
  const event = (
    await c.query(`SELECT ${eventColumns} FROM ppo.call_events WHERE workspace_id=$1 AND id=$2 FOR UPDATE`, [p.workspace_id, id])
  ).rows[0];
  if (!event || event.user_id !== p.actor_id) throw unavailable();
  return event;
}

export async function callEventReceiptAuthority(c: QueryClient, p: Principal, id: string) {
  await requireCapability(c, p, "shared.read");
  const event = (await c.query("SELECT user_id,activity_id FROM ppo.call_events WHERE workspace_id=$1 AND id=$2", [p.workspace_id, id])).rows[0];
  if (!event || event.user_id !== p.actor_id) throw unavailable();
  if (event.activity_id) await visibleActivity(c, p, event.activity_id);
}

export function openEvent(event: { version: number; state: string }, expectedVersion?: number) {
  if (expectedVersion !== undefined && event.version !== expectedVersion)
    throw new AppError(409, "VersionConflict", "This call changed. Reload Calls to log and try again.");
  if (event.state !== "ToLog")
    throw new AppError(409, "CallAlreadyResolved", "This call has already been logged or skipped.");
}

export async function skipCallEvent(p: Principal, id: string, input: unknown) {
  const r = object(input, [...commonKeys, "expected_version", "skip_reason"]);
  const command = {
    ...common(r),
    id: uuid(id, "id"),
    expected_version: version(r.expected_version),
    skip_reason: r.skip_reason === undefined || r.skip_reason === null ? null : choice(r.skip_reason, "skip_reason", skipReasons),
  };
  return sharedOperation(
    p,
    command,
    "SkipCallEvent",
    async (c) => {
      await requireCapability(c, p, "shared.read");
      return ownEvent(c, p, command.id);
    },
    async (c, event) => {
      openEvent(event, command.expected_version);
      const row = (
        await c.query(
          `UPDATE ppo.call_events SET state='Skipped',skip_reason=$3,resolved_at=clock_timestamp(),resolved_by=$4,version=version+1
           WHERE workspace_id=$1 AND id=$2 RETURNING ${eventColumns}`,
          [p.workspace_id, event.id, command.skip_reason, p.actor_id],
        )
      ).rows[0];
      await purgeSkippedCallEvents(c, p);
      return { ...row, audit_details: { previous_version: event.version } };
    },
    "CallEvent",
    "CallEventSkipped",
  );
}
