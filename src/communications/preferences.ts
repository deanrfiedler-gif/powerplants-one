import { randomUUID } from "node:crypto";
import { transaction } from "../platform/database";
import { AppError, unavailable } from "../platform/errors";
import type { Principal } from "../platform/identity";
import { sharedOperation } from "../platform/operations";
import type { QueryClient } from "../platform/permissions";
import { companyContext } from "../shared/authority";
import { visible } from "../shared/reads";
import { choice, common, commonKeys, invalid, object, uuid } from "../shared/validation";
import { classRules, messageClasses, type MessageClass } from "./model";
import { insertRow } from "./records";

const preferences = ["Allowed", "DoNotNotify"] as const;
// An append-only ledger version; 0 means nothing has been recorded yet.
function ledgerVersion(value: unknown) {
  if (!Number.isSafeInteger(value) || Number(value) < 0)
    invalid("expected_version", "Give the current version, or 0 when nothing is recorded yet.");
  return Number(value);
}
async function contactInCompany(c: QueryClient, p: Principal, person: string, company: string) {
  await visible(c, p, "Person", person);
  if (
    !(
      await c.query(
        "SELECT 1 FROM ppo.person_company_contexts WHERE workspace_id=$1 AND company_id=$2 AND person_id=$3",
        [p.workspace_id, company, person],
      )
    ).rowCount
  )
    throw unavailable();
}

// R2: Allowed or Do not notify, per contact, class and company, with who recorded it, when and why.
// Nothing recorded means being the named recipient is the basis for sending; no marketing consent
// is ever inferred from it.
export async function recordNoticePreference(p: Principal, personId: string, input: unknown) {
  const r = object(input, [...commonKeys, "company_id", "message_class", "preference", "expected_version"]);
  const cmd = {
    ...common(r),
    person_id: uuid(personId, "person_id"),
    company_id: uuid(r.company_id, "company_id"),
    message_class: choice(r.message_class, "message_class", messageClasses),
    preference: choice(r.preference, "preference", preferences),
    expected_version: ledgerVersion(r.expected_version),
  };
  return sharedOperation(
    p,
    cmd,
    "RecordNoticePreference",
    async (c) => {
      await companyContext(c, p, cmd.company_id, null, "shared.edit");
      await contactInCompany(c, p, cmd.person_id, cmd.company_id);
    },
    async (c) => {
      const current = Number(
        (
          await c.query(
            "SELECT coalesce(max(version),0) AS v FROM ppo.contact_notice_preferences WHERE workspace_id=$1 AND company_id=$2 AND person_id=$3 AND message_class=$4",
            [p.workspace_id, cmd.company_id, cmd.person_id, cmd.message_class],
          )
        ).rows[0].v,
      );
      if (current !== cmd.expected_version)
        throw new AppError(409, "VersionConflict", "This preference changed. Review the saved preference.");
      const row = await insertRow(c, "contact_notice_preferences", {
        id: randomUUID(),
        workspace_id: p.workspace_id,
        company_id: cmd.company_id,
        person_id: cmd.person_id,
        message_class: cmd.message_class,
        version: current + 1,
        preference: cmd.preference,
        actor_id: p.actor_id,
        operation_id: cmd.operation_id,
        reason: cmd.reason,
      });
      return {
        id: cmd.person_id,
        version: row.version,
        state: cmd.preference,
        updated_at: row.recorded_at,
        audit_details: { company_id: cmd.company_id, message_class: cmd.message_class, preference: cmd.preference, preference_version: row.version },
      };
    },
    "Person",
    "CustomerNoticePreferenceRecorded",
  );
}
export async function readNoticePreferences(p: Principal, personId: string, query: Record<string, string>) {
  const q = object(query, ["company_id"]);
  const company = uuid(q.company_id, "company_id"),
    person = uuid(personId, "person_id");
  return transaction(async (c) => {
    await companyContext(c, p, company, null, "shared.read");
    await contactInCompany(c, p, person, company);
    const rows = (
      await c.query(
        `SELECT n.message_class,n.version,n.preference,n.reason,n.recorded_at,u.display_name AS recorded_by
         FROM ppo.contact_notice_preferences n JOIN ppo.users u ON (u.workspace_id,u.id)=(n.workspace_id,n.actor_id)
         WHERE n.workspace_id=$1 AND n.company_id=$2 AND n.person_id=$3 ORDER BY n.message_class,n.version DESC`,
        [p.workspace_id, company, person],
      )
    ).rows;
    return {
      person_id: person,
      company_id: company,
      classes: messageClasses.map((cls: MessageClass) => {
        const history = rows
          .filter((r) => r.message_class === cls)
          .map((r) => ({
            version: r.version,
            preference: r.preference,
            recorded_by: r.recorded_by,
            recorded_at: r.recorded_at.toISOString(),
            reason: r.reason,
          }));
        return {
          message_class: cls,
          code: classRules[cls].code,
          label: classRules[cls].label,
          preference: history[0]?.preference ?? null,
          // With nothing recorded, being the named recipient on a record is the basis (R2).
          basis: history[0] ? "Recorded" : "NamedRecipient",
          version: history[0]?.version ?? 0,
          history,
        };
      }),
    };
  });
}
