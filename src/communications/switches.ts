import { randomUUID } from "node:crypto";
import { hasPermission } from "../platform/permissions";
import { transaction } from "../platform/database";
import { AppError } from "../platform/errors";
import type { Principal } from "../platform/identity";
import { sharedOperation } from "../platform/operations";
import { companyContext } from "../shared/authority";
import { choice, common, commonKeys, invalid, object, uuid } from "../shared/validation";
import { classRules, messageClasses } from "./model";
import { insertRow } from "./records";

// R9: each class is Off unless switched on. S2 has one other mode, the synthetic channel; internal
// test addresses and customers (S4) need their own migration and Dean's decision to switch on.
const modes = ["Off", "Synthetic"] as const;
export async function setMessageClassSwitch(p: Principal, input: unknown) {
  const r = object(input, [...commonKeys, "company_id", "message_class", "mode", "expected_version"]);
  if (!Number.isSafeInteger(r.expected_version) || Number(r.expected_version) < 0)
    invalid("expected_version", "Give the current version, or 0 when the class has never been switched.");
  const cmd = {
    ...common(r),
    company_id: uuid(r.company_id, "company_id"),
    message_class: choice(r.message_class, "message_class", messageClasses),
    mode: choice(r.mode, "mode", modes),
    expected_version: Number(r.expected_version),
  };
  return sharedOperation(
    p,
    cmd,
    "SetCustomerMessageSwitch",
    (c) => companyContext(c, p, cmd.company_id, null, "customer_message.switch"),
    async (c) => {
      const current = (
        await c.query(
          "SELECT version,mode FROM ppo.customer_message_switch_events WHERE workspace_id=$1 AND company_id=$2 AND message_class=$3 ORDER BY version DESC LIMIT 1",
          [p.workspace_id, cmd.company_id, cmd.message_class],
        )
      ).rows[0] ?? { version: 0, mode: "Off" };
      if (current.version !== cmd.expected_version)
        throw new AppError(409, "VersionConflict", "This switch changed. Review its saved state.");
      if (current.mode === cmd.mode)
        throw new AppError(409, "SwitchUnchanged", `This class is already ${cmd.mode}.`);
      const row = await insertRow(c, "customer_message_switch_events", {
        id: randomUUID(),
        workspace_id: p.workspace_id,
        company_id: cmd.company_id,
        message_class: cmd.message_class,
        version: current.version + 1,
        mode: cmd.mode,
        actor_id: p.actor_id,
        operation_id: cmd.operation_id,
        reason: cmd.reason,
      });
      return {
        id: row.id,
        version: row.version,
        state: cmd.mode,
        updated_at: row.recorded_at,
        audit_details: { company_id: cmd.company_id, message_class: cmd.message_class, mode: cmd.mode },
      };
    },
    "CustomerMessageSwitch",
    "CustomerMessageSwitchChanged",
  );
}
export async function readMessageClassSwitches(p: Principal, query: Record<string, string>) {
  const q = object(query, ["company_id"]);
  const company = uuid(q.company_id, "company_id");
  return transaction(async (c) => {
    await companyContext(c, p, company, null, "shared.read");
    const rows = (
      await c.query(
        `SELECT s.message_class,s.version,s.mode,s.reason,s.recorded_at,u.display_name AS recorded_by
         FROM ppo.customer_message_switch_events s JOIN ppo.users u ON (u.workspace_id,u.id)=(s.workspace_id,s.actor_id)
         WHERE s.workspace_id=$1 AND s.company_id=$2 ORDER BY s.message_class,s.version DESC`,
        [p.workspace_id, company],
      )
    ).rows;
    return {
      company_id: company,
      can_switch: await hasPermission(c, p, "customer_message.switch", company),
      channel: "Synthetic",
      classes: messageClasses.map((cls) => {
        const r = rows.find((x) => x.message_class === cls);
        return {
          message_class: cls,
          code: classRules[cls].code,
          label: classRules[cls].label,
          review: classRules[cls].review,
          mode: r?.mode ?? "Off",
          version: r?.version ?? 0,
          recorded_by: r?.recorded_by ?? null,
          recorded_at: r?.recorded_at?.toISOString() ?? null,
          reason: r?.reason ?? null,
        };
      }),
    };
  });
}
