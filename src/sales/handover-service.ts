import { createHash, randomUUID } from "node:crypto";
import type { Principal } from "../platform/identity";
import { database, transaction } from "../platform/database";
import { AppError, unavailable } from "../platform/errors";
import { canonical, sharedOperation } from "../platform/operations";
import {
  hasPermission,
  type Capability,
  type QueryClient,
} from "../platform/permissions";
import { companyContext, scopedOwner } from "../shared/authority";
import { visible } from "../shared/reads";
import {
  common,
  commonKeys,
  object,
  uuid,
  version,
  choice,
  narrative,
  optionalId,
  invalid,
} from "../shared/validation";
import { visibleOpportunity } from "../crm/context";
import { activityLinks, visibleActivity } from "../activities/activities";
import { quoteContext } from "../estimating/context";
import { visibleWorkOrder } from "../service/work-orders";
import {
  emptyHandover,
  handoverKinds,
  handoverReadiness,
  parseHandover,
  type HandoverContent,
  type HandoverKind,
} from "./handover-model";

export type Handover = {
  id: string;
  workspace_id: string;
  company_id: string;
  organisation_id: string;
  site_id: string | null;
  opportunity_id: string;
  kind: HandoverKind;
  owner_id: string;
  receiving_owner_id: string | null;
  version: number;
  revision: number;
  state: string;
  content: HandoverContent;
  basis: Record<string, unknown> | null;
  source_hash: string | null;
  updated_at: Date;
};
export type HandoverEvent = {
  id: string;
  record_id: string;
  version: number;
  revision: number;
  action: string;
  content: HandoverContent;
  basis: Record<string, unknown> | null;
  source_hash: string | null;
  note: string;
  question_id: string | null;
  follow_up_activity_id: string | null;
  recorded_by: string;
  recorded_at: Date;
};
export const hashBasis = (value: unknown) =>
  createHash("sha256").update(canonical(value)).digest("hex");
export function conflict(message: string): never {
  throw new AppError(409, "VersionConflict", message);
}
export function receiverCapability(
  row: Pick<Handover, "kind" | "content">,
): Capability | null {
  return row.kind === "Estimating"
    ? "estimating.edit"
    : row.content.destination === "Projects"
      ? "project.edit"
      : row.content.destination === "Service"
        ? "service.work_order.edit"
        : null;
}
export async function handoverBasis(
  c: QueryClient,
  p: Principal,
  row: Handover,
  content = row.content,
  ready = false,
  validateReceiver = ready,
) {
  const o = await visibleOpportunity(c, p, row.opportunity_id);
  if (
    o.company_id !== row.company_id ||
    o.organisation_id !== row.organisation_id ||
    o.site_id !== row.site_id
  )
    throw unavailable();
  const related: Record<string, unknown> = {};
  for (const [kind, list] of [
    ["Facility", content.facility_ids],
    ["Asset", content.asset_ids],
  ] as const)
    for (const id of list) {
      const r = await visible(c, p, kind, id);
      if (r.company_id !== row.company_id || r.site_id !== row.site_id)
        throw unavailable();
      related[`${kind}:${id}`] = { version: r.version };
    }
  for (const e of content.evidence) {
    if (e.kind === "DraftQuote") {
      const { q, e: estimate } = await quoteContext(c, p, e.id);
      if (estimate.opportunity_id !== row.opportunity_id) throw unavailable();
      if (ready && String(q.version) !== e.revision)
        invalid(
          "evidence",
          "The quotation revision changed. Review and save the current reference.",
        );
      related[`DraftQuote:${e.id}`] = {
        requested_revision: e.revision,
        version: q.version,
        content_hash: q.input_hash,
        state: "Draft",
      };
    } else {
      const d = (
        await c.query(
          "SELECT * FROM ppo.document_references WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, e.id],
        )
      ).rows[0];
      if (!d) throw unavailable();
      const w = await visibleWorkOrder(c, p, d.work_order_id);
      if (w.company_id !== row.company_id || w.site_id !== row.site_id)
        throw unavailable();
      if (ready && String(d.source_version) !== String(e.revision))
        invalid(
          "evidence",
          "The document revision changed. Review and save the current reference.",
        );
      related[`ServiceDocument:${e.id}`] = {
        requested_revision: e.revision,
        revision: d.source_version,
        hash: d.content_hash,
        status: d.status,
      };
    }
  }
  if (content.next_activity_id) {
    const a = await visibleActivity(c, p, content.next_activity_id),
      links = await activityLinks(c, p, a.id);
    if (
      a.company_id !== row.company_id ||
      !links.some(
        (l) =>
          l.object_type === "Opportunity" && l.object_id === row.opportunity_id,
      )
    )
      throw unavailable();
    if (
      ready &&
      (!["Open", "InProgress"].includes(a.status) || !a.owner_id || !a.due_at)
    )
      invalid(
        "next_activity_id",
        "Choose an open Opportunity Activity with an owner and due date.",
      );
  }
  if (validateReceiver && row.receiving_owner_id) {
    const cap = receiverCapability({ ...row, content });
    if (!cap)
      invalid(
        "destination",
        "Routing decision required before assigning a receiving owner.",
      );
    await scopedOwner(
      c,
      p,
      row.receiving_owner_id,
      row.company_id,
      row.site_id ?? undefined,
      cap,
    );
    await visibleOpportunity(
      c,
      { ...p, actor_id: row.receiving_owner_id },
      o.id,
    );
  }
  const obligation =
    row.kind === "Won"
      ? (
          await c.query(
            "SELECT opportunity_version,owner_id,created_at,status FROM ppo.opportunity_handovers_due WHERE workspace_id=$1 AND opportunity_id=$2",
            [p.workspace_id, o.id],
          )
        ).rows[0]
      : null;
  if (row.kind === "Won" && !obligation) throw unavailable();
  const org = await visible(c, p, "Organisation", row.organisation_id),
    site = row.site_id ? await visible(c, p, "Site", row.site_id) : null;
  return {
    opportunity: {
      id: o.id,
      version: o.version,
      title: o.title,
      need_summary: o.need_summary,
      scope_details: o.scope_details,
      value_amount: o.value_amount,
      expected_close_date: o.expected_close_date,
      outcome: o.close_outcome,
      updated_at: o.updated_at.toISOString(),
    },
    organisation: { id: org.id, version: org.version },
    site: site ? { id: site.id, version: site.version } : null,
    related,
    obligation,
    quotation_acceptance:
      "Unavailable: native quotation issue/customer response is not implemented",
    conversion: "Unavailable: ES-07 native conversion is not implemented",
    destination: content.destination,
    routing_basis: content.routing_basis,
  };
}
export async function handoverRecord(
  c: QueryClient,
  p: Principal,
  id: string,
  duty: "read" | "prepare" | "receive" = "read",
) {
  const row = (
    await c.query<Handover>(
      "SELECT * FROM ppo.sales_handovers WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, uuid(id, "id")],
    )
  ).rows[0];
  if (!row) throw unavailable();
  const o = await visibleOpportunity(c, p, row.opportunity_id);
  if (duty === "prepare") {
    await companyContext(
      c,
      p,
      row.company_id,
      row.site_id,
      "crm.opportunity.edit",
    );
    if (o.owner_id !== p.actor_id) throw unavailable();
  }
  if (duty === "receive") {
    const cap = receiverCapability(row);
    if (!cap || row.receiving_owner_id !== p.actor_id) throw unavailable();
    await companyContext(c, p, row.company_id, row.site_id, cap);
  }
  await handoverBasis(c, p, row);
  // Historical content must not bypass a newly revoked related-object grant.
  const history = (
    await c.query<HandoverEvent>(
      "SELECT * FROM ppo.sales_workflow_events WHERE workspace_id=$1 AND record_id=$2 ORDER BY version",
      [p.workspace_id, id],
    )
  ).rows;
  for (const event of history) {
    await handoverBasis(c, p, row, event.content);
    if (event.follow_up_activity_id)
      await handoverBasis(c, p, row, {
        ...event.content,
        next_activity_id: event.follow_up_activity_id,
      });
  }
  return { row, o, history };
}
export async function readHandover(p: Principal, id: string) {
  return transaction(async (c) => {
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const { row, o, history } = await handoverRecord(c, p, id);
    const current_basis = await handoverBasis(c, p, row);
    const cap = receiverCapability(row);
    const owners: { id: string; display_name: string }[] = [];
    for (const u of (
      await c.query<{ id: string; display_name: string }>(
        "SELECT id,display_name FROM ppo.users WHERE workspace_id=$1 AND active ORDER BY display_name,id",
        [p.workspace_id],
      )
    ).rows)
      try {
        if (!cap) continue;
        await scopedOwner(
          c,
          p,
          u.id,
          row.company_id,
          row.site_id ?? undefined,
          cap,
        );
        await visibleOpportunity(c, { ...p, actor_id: u.id }, o.id);
        owners.push(u);
      } catch (e) {
        if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
      }
    const locations: {
      id: string;
      display_name: string;
      kind: "Facility" | "Asset";
    }[] = [];
    if (row.site_id)
      for (const [table, kind] of [
        ["facilities", "Facility"],
        ["assets", "Asset"],
      ] as const)
        for (const item of (
          await c.query<{ id: string }>(
            `SELECT id FROM ppo.${table} WHERE workspace_id=$1 AND site_id=$2`,
            [p.workspace_id, row.site_id],
          )
        ).rows)
          try {
            const v = await visible(c, p, kind, item.id);
            locations.push({ id: v.id, display_name: v.display_name, kind });
          } catch (e) {
            if (!(e instanceof AppError) || ![403, 404].includes(e.status))
              throw e;
          }
    return {
      record: row,
      opportunity: {
        id: o.id,
        title: o.title,
        display_number: o.display_number,
      },
      history,
      current_basis,
      owners,
      locations,
      source_changed:
        !!row.source_hash && row.source_hash !== hashBasis(current_basis),
      readiness: handoverReadiness(row.kind, row.content),
      can_prepare:
        o.owner_id === p.actor_id &&
        (await hasPermission(
          c,
          p,
          "crm.opportunity.edit",
          row.company_id,
          row.site_id ?? undefined,
        )),
      can_receive:
        row.receiving_owner_id === p.actor_id &&
        !!cap &&
        (await hasPermission(
          c,
          p,
          cap,
          row.company_id,
          row.site_id ?? undefined,
        )),
      observed_at: new Date().toISOString(),
    };
  });
}
export async function listHandovers(
  p: Principal,
  kind: HandoverKind,
  opportunity_id?: string,
  receiving = false,
) {
  if (opportunity_id)
    await visibleOpportunity(
      database(),
      p,
      uuid(opportunity_id, "opportunity_id"),
    );
  const ids = (
    await database().query<{ id: string }>(
      "SELECT id FROM ppo.sales_handovers WHERE workspace_id=$1 AND kind=$2 AND ($3::uuid IS NULL OR opportunity_id=$3) ORDER BY updated_at DESC,id",
      [p.workspace_id, kind, opportunity_id ?? null],
    )
  ).rows;
  const items: Awaited<ReturnType<typeof readHandover>>[] = [];
  for (const { id } of ids)
    try {
      const r = await readHandover(p, id);
      if (receiving) {
        const cap = receiverCapability(r.record);
        if (
          !cap ||
          !(await hasPermission(
            database(),
            p,
            cap,
            r.record.company_id,
            r.record.site_id ?? undefined,
          ))
        )
          continue;
        const submitted = [...r.history]
          .reverse()
          .find((e) => e.action === "Submit");
        if (!submitted) continue;
        items.push({
          ...r,
          record: {
            ...r.record,
            content: submitted.content,
            basis: submitted.basis,
            source_hash: submitted.source_hash,
            revision: submitted.revision,
            state:
              [...r.history]
                .reverse()
                .find(
                  (e) =>
                    e.revision === submitted.revision &&
                    [
                      "Submit",
                      "Accept",
                      "Return",
                      "Clarify",
                      "Answer",
                      "Resolve",
                    ].includes(e.action),
                )?.action === "Accept"
                ? "Accepted"
                : r.record.revision === submitted.revision
                  ? r.record.state
                  : "Returned",
          },
        });
      } else items.push(r);
    } catch (e) {
      if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
    }
  return {
    items,
    completeness: "Complete" as const,
    observed_at: new Date().toISOString(),
  };
}
async function event(
  c: QueryClient,
  p: Principal,
  row: Handover,
  action: string,
  note: string,
  question_id: string | null = null,
  follow_up_activity_id: string | null = null,
) {
  await c.query(
    "INSERT INTO ppo.sales_workflow_events(id,workspace_id,record_id,version,revision,action,content,basis,source_hash,note,question_id,recorded_by,follow_up_activity_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)",
    [
      randomUUID(),
      p.workspace_id,
      row.id,
      row.version,
      row.revision,
      action,
      row.content,
      row.basis,
      row.source_hash,
      note,
      question_id,
      p.actor_id,
      follow_up_activity_id,
    ],
  );
  return row;
}
export async function createHandover(p: Principal, value: unknown) {
  const r = object(value, [...commonKeys, "id", "opportunity_id", "kind"]),
    input = {
      ...common(r),
      id: uuid(r.id, "id"),
      opportunity_id: uuid(r.opportunity_id, "opportunity_id"),
      kind: choice(r.kind, "kind", handoverKinds),
    };
  return sharedOperation(
    p,
    input,
    "SalesHandover:Create",
    async (c) => {
      const o = await visibleOpportunity(c, p, input.opportunity_id);
      await companyContext(
        c,
        p,
        o.company_id,
        o.site_id,
        "crm.opportunity.edit",
      );
      if (o.owner_id !== p.actor_id) throw unavailable();
      return o;
    },
    async (c, o) => {
      if (input.kind === "Won" && o.close_outcome !== "Won")
        invalid(
          "opportunity_id",
          "A Won opportunity and its immutable obligation are required.",
        );
      const content = { ...emptyHandover(), problem: o.need_summary };
      const row = (
        await c.query<Handover>(
          "INSERT INTO ppo.sales_handovers(id,workspace_id,company_id,organisation_id,site_id,opportunity_id,kind,won_obligation_id,owner_id,content,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$9,$9) RETURNING *",
          [
            input.id,
            p.workspace_id,
            o.company_id,
            o.organisation_id,
            o.site_id,
            o.id,
            input.kind,
            input.kind === "Won" ? o.id : null,
            p.actor_id,
            content,
          ],
        )
      ).rows[0];
      return event(c, p, row, "Create", input.reason);
    },
    "SalesHandover",
    "SharedRecordCreated",
  );
}
const receivingActions = ["Clarify", "Resolve", "Return", "Accept"];
export async function commandHandover(
  p: Principal,
  id: string,
  value: unknown,
) {
  const r = object(value, [
    ...commonKeys,
    "expected_version",
    "action",
    "content",
    "receiving_owner_id",
    "question_id",
    "follow_up_activity_id",
    "note",
    "source_hash",
  ]);
  const action = choice(r.action, "action", [
    "Save",
    "Submit",
    "Clarify",
    "Answer",
    "Resolve",
    "Return",
    "Accept",
    "Successor",
  ]);
  const input = {
    ...common(r),
    id: uuid(id, "id"),
    expected_version: version(r.expected_version),
    action,
    content: action === "Save" ? parseHandover(r.content) : null,
    receiving_owner_id:
      action === "Save"
        ? optionalId(r.receiving_owner_id, "receiving_owner_id")
        : null,
    question_id: optionalId(r.question_id, "question_id"),
    follow_up_activity_id: optionalId(
      r.follow_up_activity_id,
      "follow_up_activity_id",
    ),
    note: narrative(r.note, "note", 4000),
    source_hash: r.source_hash === undefined ? null : String(r.source_hash),
  };
  return sharedOperation(
    p,
    input,
    `SalesHandover:${action}`,
    (c) =>
      handoverRecord(
        c,
        p,
        id,
        receivingActions.includes(action) ? "receive" : "prepare",
      ),
    async (c, { row, history }) => {
      if (row.version !== input.expected_version)
        conflict("This handover changed. Reload and compare before retrying.");
      let state = row.state,
        revision = row.revision,
        content = row.content,
        basis = row.basis,
        source_hash = row.source_hash,
        receiving_owner_id = row.receiving_owner_id;
      if (action === "Save") {
        if (state !== "Draft")
          conflict(
            "Submitted content is frozen. Create a successor after return or acceptance.",
          );
        content = input.content!;
        receiving_owner_id = input.receiving_owner_id;
        await handoverBasis(
          c,
          p,
          { ...row, receiving_owner_id },
          content,
          false,
          true,
        );
      } else if (action === "Submit") {
        if (state !== "Draft") conflict("Only a saved draft can be submitted.");
        const missing = handoverReadiness(row.kind, content);
        if (missing.length)
          invalid(
            missing[0],
            `Complete submission requirements: ${missing.join(", ")}.`,
          );
        if (!receiving_owner_id)
          invalid("receiving_owner_id", "Choose a permitted receiving owner.");
        basis = await handoverBasis(c, p, row, content, true);
        source_hash = hashBasis(basis);
        state = "Submitted";
      } else if (action === "Successor") {
        if (!["Returned", "Accepted"].includes(state))
          conflict(
            "Return or accept this revision before preparing a successor.",
          );
        revision++;
        state = "Draft";
        basis = null;
        source_hash = null;
      } else if (action === "Clarify") {
        if (state !== "Submitted") conflict("Clarify a submitted revision.");
        state = "ClarificationRequested";
      } else if (action === "Answer" || action === "Resolve") {
        const question = history.find(
          (e) =>
            e.id === input.question_id &&
            e.revision === row.revision &&
            e.action === "Clarify",
        );
        if (!question)
          invalid("question_id", "Use the exact clarification question.");
        if (action === "Answer") {
          if (state !== "ClarificationRequested")
            conflict("An unanswered clarification is required.");
          state = "ClarificationAnswered";
        } else {
          if (
            state !== "ClarificationAnswered" ||
            !history.some(
              (e) => e.action === "Answer" && e.question_id === question.id,
            )
          )
            conflict("Review the recorded answer before resolution.");
          state = "Submitted";
        }
      } else if (action === "Return") {
        if (
          ![
            "Submitted",
            "ClarificationRequested",
            "ClarificationAnswered",
          ].includes(state)
        )
          conflict("Only an open submission can be returned.");
        const followUp =
          input.follow_up_activity_id ?? content.next_activity_id;
        if (!followUp)
          invalid(
            "follow_up_activity_id",
            "Choose an owned, dated Opportunity Activity for the return.",
          );
        const a = await visibleActivity(c, p, followUp);
        await handoverBasis(c, p, row, {
          ...content,
          next_activity_id: followUp,
        });
        if (
          !["Open", "InProgress"].includes(a.status) ||
          !a.owner_id ||
          !a.due_at
        )
          invalid(
            "follow_up_activity_id",
            "Choose an open, owned, dated Opportunity Activity for the return.",
          );
        state = "Returned";
      } else if (action === "Accept") {
        if (state !== "Submitted")
          conflict("Resolve clarification before acceptance.");
        const current = hashBasis(
          await handoverBasis(c, p, row, content, true),
        );
        if (current !== source_hash || input.source_hash !== source_hash)
          conflict(
            "Source changed or the reviewed fingerprint is stale. Return for a corrected successor.",
          );
        if (row.kind === "Won" && content.destination === "Undecided")
          invalid("destination", "Routing decision required.");
        state = "Accepted";
      }
      const updated = (
        await c.query<Handover>(
          "UPDATE ppo.sales_handovers SET version=version+1,revision=$3,state=$4,content=$5,basis=$6,source_hash=$7,receiving_owner_id=$8,updated_by=$9,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *",
          [
            p.workspace_id,
            id,
            revision,
            state,
            content,
            basis,
            source_hash,
            receiving_owner_id,
            p.actor_id,
          ],
        )
      ).rows[0];
      return event(
        c,
        p,
        updated,
        action,
        input.note,
        input.question_id,
        action === "Return"
          ? (input.follow_up_activity_id ?? content.next_activity_id)
          : null,
      );
    },
    "SalesHandover",
    "SharedRecordUpdated",
  );
}
export async function handoverReceiptAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  command: string,
) {
  return handoverRecord(
    c,
    p,
    id,
    receivingActions.includes(command.split(":")[1]) ? "receive" : "prepare",
  );
}
