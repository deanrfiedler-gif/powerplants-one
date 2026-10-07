import type { Principal } from "../platform/identity";
import type { QueryClient } from "../platform/permissions";
import { transaction } from "../platform/database";
import { AppError, unavailable } from "../platform/errors";
import { sharedOperation } from "../platform/operations";
import { companyContext } from "../shared/authority";
import {
  common,
  commonKeys,
  object,
  uuid,
  version,
  invalid,
} from "../shared/validation";
import {
  workspaceAuthority,
  currentGroup,
  revisionAuthority,
} from "../estimating/discovery-workspace-context";
import {
  handoverRecord,
  handoverBasis,
  hashBasis,
  conflict,
} from "./handover-service";

type Binding = {
  handover_id: string;
  acceptance_event_id: string;
  estimating_workspace_id: string;
  estimating_version: number;
  selected_option_id: string;
  selected_revision_id: string;
  operation_id: string;
  recorded_by: string;
  recorded_at: Date;
  reason: string;
};
const denied = (e: unknown) =>
  e instanceof AppError && [403, 404].includes(e.status);
async function available(c: QueryClient) {
  return !!(
    await c.query(
      "SELECT to_regclass('ppo.sales_estimating_bindings') AS relation",
    )
  ).rows[0].relation;
}
export async function estimatingBindingReceiptAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  operation: string,
) {
  const b = (
    await c.query<Binding>(
      `SELECT b.* FROM ppo.sales_estimating_bindings b
    JOIN ppo.audit_events a ON (a.workspace_id,a.actor_id,a.operation_id)=(b.workspace_id,b.recorded_by,b.operation_id)
    WHERE b.workspace_id=$1 AND b.handover_id=$2 AND b.recorded_by=$3 AND b.operation_id=$4
      AND a.object_type='SalesHandover' AND a.object_id=b.handover_id AND a.outcome='Accepted'
      AND a.details->>'command'='SalesHandover:BindEstimating'
      AND a.details->>'acceptance_event_id'=b.acceptance_event_id::text
      AND a.details->>'selected_revision_id'=b.selected_revision_id::text`,
      [p.workspace_id, id, p.actor_id, operation],
    )
  ).rows[0];
  if (!b) throw unavailable();
  const { row, history } = await handoverRecord(c, p, id);
  const acceptance = history.find(
    (e) =>
      e.id === b.acceptance_event_id &&
      e.action === "Accept" &&
      e.recorded_by === p.actor_id,
  );
  if (!acceptance || row.kind !== "Estimating") throw unavailable();
  await companyContext(c, p, row.company_id, row.site_id, "estimating.edit");
  const g = await workspaceAuthority(c, p, b.estimating_workspace_id, true);
  if (g.opportunity_id !== row.opportunity_id) throw unavailable();
  await currentGroup(c, p, g);
  await revisionAuthority(c, p, g, b.selected_revision_id, true);
  return b;
}
export async function bindEstimatingWorkspace(
  p: Principal,
  id: string,
  value: unknown,
) {
  const r = object(value, [
    ...commonKeys,
    "expected_version",
    "acceptance_event_id",
    "source_hash",
    "estimating_workspace_id",
    "expected_estimating_version",
    "selected_option_id",
    "selected_revision_id",
  ]);
  if(typeof r.source_hash !== "string" || !/^[a-f0-9]{64}$/.test(r.source_hash)) invalid("source_hash","Compare the exact accepted Sales source before linking.");
  const input = {
    ...common(r),
    id: uuid(id, "id"),
    expected_version: version(r.expected_version),
    acceptance_event_id: uuid(r.acceptance_event_id, "acceptance_event_id"),
    source_hash: String(r.source_hash),
    estimating_workspace_id: uuid(
      r.estimating_workspace_id,
      "estimating_workspace_id",
    ),
    expected_estimating_version: version(r.expected_estimating_version),
    selected_option_id: uuid(r.selected_option_id, "selected_option_id"),
    selected_revision_id: uuid(r.selected_revision_id, "selected_revision_id"),
  };
  return sharedOperation(
    p,
    input,
    "SalesHandover:BindEstimating",
    async (c) => {
      await c.query("SELECT ppo.lock_crm_transfer_authority($1)", [
        p.workspace_id,
      ]);
      const prior = (
        await c.query(
          "SELECT 1 FROM ppo.operation_receipts WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3",
          [p.workspace_id, p.actor_id, input.operation_id],
        )
      ).rowCount;
      if (prior)
        await estimatingBindingReceiptAuthority(c, p, id, input.operation_id);
      return handoverRecord(c, p, id, prior ? "read" : "receive");
    },
    async (c, { row, history }) => {
      if (row.kind !== "Estimating") throw unavailable();
      const accepted = history.find(
        (e) =>
          e.id === input.acceptance_event_id &&
          e.action === "Accept" &&
          e.version === row.version &&
          e.revision === row.revision &&
          e.recorded_by === p.actor_id,
      );
      if (
        row.state !== "Accepted" ||
        row.version !== input.expected_version ||
        !accepted ||
        row.source_hash !== input.source_hash ||
        hashBasis(await handoverBasis(c, p, row, row.content, true)) !==
          input.source_hash
      )
        conflict(
          "The accepted Sales brief or its sources changed. Review a current accepted successor before linking.",
        );
      const g = await workspaceAuthority(
        c,
        p,
        input.estimating_workspace_id,
        true,
      );
      if (
        g.opportunity_id !== row.opportunity_id ||
        g.company_id !== row.company_id
      )
        throw unavailable();
      const options = await currentGroup(c, p, g),
        selected = options.find((o) => o.option.id === g.selected_option_id)!;
      if (
        g.version !== input.expected_estimating_version ||
        g.selected_option_id !== input.selected_option_id ||
        selected.revision.id !== input.selected_revision_id
      )
        conflict(
          "The native workspace changed. Compare its current selected option and revision before linking.",
        );
      await revisionAuthority(c, p, g, selected.revision.id, true);
      const b = (
        await c.query<Binding>(
          `INSERT INTO ppo.sales_estimating_bindings(workspace_id,company_id,handover_id,acceptance_event_id,estimating_workspace_id,estimating_version,selected_option_id,selected_revision_id,operation_id,recorded_by,reason)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
          [
            p.workspace_id,
            row.company_id,
            id,
            accepted.id,
            g.id,
            g.version,
            selected.option.id,
            selected.revision.id,
            input.operation_id,
            p.actor_id,
            input.reason,
          ],
        )
      ).rows[0];
      return {
        id: row.id,
        version: row.version,
        state: "WorkspaceLinked",
        updated_at: b.recorded_at,
        audit_details: {
          acceptance_event_id: accepted.id,
          source_hash: row.source_hash,
          estimating_workspace_id: g.id,
          estimating_version: g.version,
          selected_option_id: selected.option.id,
          selected_revision_id: selected.revision.id,
        },
      };
    },
    "SalesHandover",
    "SharedRecordUpdated",
  );
}

export async function readEstimatingBinding(p: Principal, id: string) {
  return transaction(async (c) => {
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const { row, history } = await handoverRecord(c, p, id);
    if (row.kind !== "Estimating") throw unavailable();
    const accepted =
      history.find(
        (e) =>
          e.action === "Accept" &&
          e.version === row.version &&
          e.revision === row.revision,
      ) ?? null;
    const changed =
      !!row.source_hash &&
      row.source_hash !== hashBasis(await handoverBasis(c, p, row));
    const bindings = (await available(c))
      ? (
          await c.query<Binding>(
            "SELECT * FROM ppo.sales_estimating_bindings WHERE workspace_id=$1 AND handover_id=$2 ORDER BY recorded_at",
            [p.workspace_id, id],
          )
        ).rows
      : [];
    const links = [];
    for (const b of bindings) {
      try {
        const g = await workspaceAuthority(c, p, b.estimating_workspace_id);
        const revision = await revisionAuthority(
          c,
          p,
          g,
          b.selected_revision_id,
        );
        const event = history.find((e) => e.id === b.acceptance_event_id);
        if (!event || g.opportunity_id !== row.opportunity_id)
          throw unavailable();
        links.push({
          access: "Available" as const,
          acceptance_event_id: b.acceptance_event_id,
          handover_revision: event.revision,
          workspace_id: g.id,
          workspace_version: b.estimating_version,
          option_id: b.selected_option_id,
          revision_id: revision.id,
          revision_version: revision.version,
          current: accepted?.id === event.id,
          reason: b.reason,
          recorded_at: b.recorded_at.toISOString(),
          content: event.content,
        });
      } catch (e) {
        if (!denied(e)) throw e;
        links.push({ access: "Restricted" as const });
      }
    }
    const existing = (
      await c.query<{ id: string }>(
        "SELECT id FROM ppo.estimating_workspaces WHERE workspace_id=$1 AND opportunity_id=$2",
        [p.workspace_id, row.opportunity_id],
      )
    ).rows[0];
    let candidate = null;
    let restricted = false,
      canLink = false,
      canCreate = false;
    const current =
      !!accepted &&
      row.state === "Accepted" &&
      !changed &&
      !bindings.some((b) => b.acceptance_event_id === accepted.id);
    try {
      if (existing) {
        const g = await workspaceAuthority(c, p, existing.id),
          options = await currentGroup(c, p, g),
          selected = options.find((o) => o.option.id === g.selected_option_id)!;
        candidate = {
          id: g.id,
          version: g.version,
          owner_id: g.owner_id,
          selected_option_id: selected.option.id,
          option_label: selected.option.label,
          selected_revision_id: selected.revision.id,
          revision_version: selected.revision.version,
          scope_readiness: selected.revision.scope_readiness,
        };
        if (current) {
          await handoverRecord(c, p, id, "receive");
          await workspaceAuthority(c, p, g.id, true);
          await revisionAuthority(c, p, g, selected.revision.id, true);
          canLink = true;
        }
      } else if (current) {
        await handoverRecord(c, p, id, "receive");
        await companyContext(
          c,
          p,
          row.company_id,
          row.site_id,
          "estimating.read",
        );
        canCreate = true;
      }
    } catch (e) {
      if (!denied(e)) throw e;
      restricted = true;
    }
    return {
      handover_id: row.id,
      opportunity_id: row.opportunity_id,
      version: row.version,
      state: row.state,
      source_hash: row.source_hash,
      source_changed: changed,
      acceptance_event_id: accepted?.id ?? null,
      content: row.content,
      links,
      candidate,
      restricted,
      can_link: canLink,
      can_create: canCreate,
    };
  });
}
export async function readWorkspaceSalesBriefs(p: Principal, id: string) {
  return transaction(async (c) => {
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const g = await workspaceAuthority(c, p, id);
    await currentGroup(c, p, g);
    const bindings = (await available(c))
      ? (
          await c.query<Binding>(
            "SELECT * FROM ppo.sales_estimating_bindings WHERE workspace_id=$1 AND estimating_workspace_id=$2 ORDER BY recorded_at",
            [p.workspace_id, id],
          )
        ).rows
      : [];
    const items = [];
    for (const b of bindings) {
      try {
        const { row, history } = await handoverRecord(c, p, b.handover_id);
        const event = history.find(
          (e) => e.id === b.acceptance_event_id && e.action === "Accept",
        );
        await revisionAuthority(c, p, g, b.selected_revision_id);
        if (!event || row.opportunity_id !== g.opportunity_id)
          throw unavailable();
        items.push({
          access: "Available" as const,
          handover_id: row.id,
          acceptance_event_id: event.id,
          revision: event.revision,
          content: event.content,
          recorded_at: b.recorded_at.toISOString(),
          current: row.state === "Accepted" && row.version === event.version,
          source_changed:
            hashBasis(await handoverBasis(c, p, row, event.content)) !==
            event.source_hash,
        });
      } catch (e) {
        if (!denied(e)) throw e;
        items.push({ access: "Restricted" as const });
      }
    }
    return { items };
  });
}
