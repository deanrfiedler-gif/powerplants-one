import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import type { Principal } from "../platform/identity";
import { AppError, unavailable } from "../platform/errors";
import { sharedOperation } from "../platform/operations";
import {
  authoriseActivityInput,
  insertActivity,
  type ActivityInput,
} from "../activities/activities";
import { companyContext } from "../shared/authority";
import { hasPermission } from "../platform/permissions";
import { invalid, uuid } from "../shared/validation";
import {
  supplyRecord,
  newContext,
  currentVersion,
  createCapability,
  factCapability,
  financeAllowed,
} from "./context";
import { recordCommand, factCommand, allocationCommand } from "./validation";
import { factsFor, materialBasis } from "./reads";
import {
  factSpecs,
  currentFacts,
  latestFact,
  sumFacts,
  decimal,
  q,
  receiptArithmetic,
  custodyArithmetic,
  materialChanges,
  type Fact,
  type Fields,
  type FactKind,
  type SupplyRecord,
} from "./model";
async function insert(
  c: PoolClient,
  table: string,
  data: Record<string, unknown>,
) {
  const entries = Object.entries(data);
  return (
    await c.query(
      `INSERT INTO ppo.${table}(${entries.map(([k]) => k).join(",")}) VALUES(${entries.map((_, i) => `$${i + 1}`).join(",")}) RETURNING *`,
      entries.map(([, v]) => v),
    )
  ).rows[0];
}
async function touch(
  c: PoolClient,
  p: Principal,
  r: SupplyRecord,
  reason: string,
) {
  return (
    await c.query(
      "UPDATE ppo.supply_records SET version=version+1,updated_by=$3,updated_at=clock_timestamp(),last_reason=$4 WHERE workspace_id=$1 AND id=$2 RETURNING *",
      [p.workspace_id, r.id, p.actor_id, reason],
    )
  ).rows[0] as SupplyRecord;
}
const result = (
  r: SupplyRecord,
  audit_details: Record<string, unknown> = {},
) => ({
  id: r.id,
  version: r.version,
  state: "Recorded",
  updated_at: new Date(r.updated_at),
  audit_details,
});
export async function saveRecord(p: Principal, input: unknown, update = false) {
  const cmd = recordCommand(input, update);
  return sharedOperation(
    p,
    cmd,
    `Supply:${update ? "Revise" : "Create"}`,
    async (c) => {
      if (update) await supplyRecord(c, p, cmd.id, createCapability[cmd.kind]);
      await newContext(c, p, cmd);
      return update ? await supplyRecord(c, p, cmd.id) : null;
    },
    async (c, before) => {
      if (before) currentVersion(before.version, cmd.expected_version);
      const {
        operation_id: _operation,
        schema_version: _schema,
        reason,
        expected_version: _version,
        ...values
      } = cmd;
      void _operation;
      void _schema;
      void _version;
      let saved: SupplyRecord;
      if (before) {
        if (before.kind === "Demand") {
          const issued = (await c.query("SELECT COALESCE(sum(quantity),0)::text n FROM ppo.supply_records WHERE workspace_id=$1 AND parent_id=$2 AND kind='Custody'",[p.workspace_id,before.id])).rows[0].n;
          check(decimal(cmd.quantity) >= decimal(issued),"Demand cannot fall below retained service-stock issues.");
        }
        const entries = Object.entries({
          ...values,
          parent_id: cmd.data.demand_id ?? null,
          last_reason: reason,
          updated_by: p.actor_id,
        });
        saved = (
          await c.query(
            `UPDATE ppo.supply_records SET ${entries.map(([k], i) => `${k}=$${i + 3}`).join(",")},version=version+1,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *`,
            [p.workspace_id, cmd.id, ...entries.map(([, v]) => v)],
          )
        ).rows[0];
      } else
        saved = await insert(c, "supply_records", {
          ...values,
          parent_id: cmd.data.demand_id ?? null,
          workspace_id: p.workspace_id,
          last_reason: reason,
          created_by: p.actor_id,
          updated_by: p.actor_id,
        });
      if (before && materialChanges(before, saved).length)
        await impacts(
          c,
          p,
          saved,
          reason,
          `${before.version}`,
          `${saved.version}`,
          materialChanges(before, saved).join(", "),
        );
      return result(saved);
    },
    "SupplyRecord",
    "SupplyRecorded",
  );
}
async function addFact(
  c: PoolClient,
  p: Principal,
  r: SupplyRecord,
  kind: FactKind,
  data: Fields,
  extra: Partial<Fact> & {
    evidence: string;
    completeness: Fact["completeness"];
    observed_at: string;
  },
) {
  return insert(c, "supply_facts", {
    id: extra.id ?? randomUUID(),
    workspace_id: p.workspace_id,
    company_id: r.company_id,
    record_id: r.id,
    version: r.version,
    kind,
    data,
    predecessor_id: extra.predecessor_id ?? null,
    evidence: extra.evidence,
    completeness: extra.completeness,
    observed_at: extra.observed_at,
    attachment_id: extra.attachment_id ?? null,
    activity_id: extra.activity_id ?? null,
    created_by: p.actor_id,
  });
}
async function impacts(
  c: PoolClient,
  p: Principal,
  r: SupplyRecord,
  reason: string,
  before: string,
  after: string,
  change: string,
) {
  let demands: SupplyRecord[] = [];
  if (r.kind === "Demand") demands = [r];
  if (r.kind === "Supply")
    for (const link of (
      await c.query(
        "SELECT DISTINCT demand_id FROM ppo.supply_allocations WHERE workspace_id=$1 AND supply_id=$2",
        [p.workspace_id, r.id],
      )
    ).rows)
      demands.push(
        await supplyRecord(c, p, link.demand_id, "supply.coordinate"),
      );
  for (let demand of demands) {
    if (demand.id !== r.id) demand = await touch(c, p, demand, reason);
    const activity: ActivityInput = {
      id: randomUUID(),
      company_id: demand.company_id,
      site_id: demand.site_id,
      kind: "MaterialAction",
      owner_id: demand.owner_id,
      summary: `${demand.reference}: review ${change}. ${reason}`.slice(
        0,
        1900,
      ),
      due_at: null,
      due_needed: true,
      access_class: "RestrictedService",
      links:
        demand.data.origin_kind === "Project"
          ? [{ object_type: "Project", object_id: demand.data.origin_id! }]
          : [{ object_type: "Site", object_id: demand.site_id! }],
    };
    await authoriseActivityInput(c, p, activity);
    await insertActivity(c, p, activity);
    const assessment = latestFact(await factsFor(c,p,demand),"Assessment");
    const packs = demand.data.appointment_id && await hasPermission(c,p,"pack.read",demand.company_id,demand.site_id ?? undefined)
      ? (await c.query("SELECT display_number,version,current_issue_id FROM ppo.packs WHERE workspace_id=$1 AND appointment_id=$2 AND current_issue_id IS NOT NULL",[p.workspace_id,demand.data.appointment_id])).rows : [];
    const affected = [
      assessment ? `Readiness assessment ${assessment.id} at version ${assessment.version}` : "No saved readiness assessment",
      demand.data.origin_kind,
      demand.data.origin_id,
      demand.data.appointment_id
        ? `Appointment ${demand.data.appointment_id} (unchanged)`
        : "Appointment not linked",
      demand.data.customer_commitment ?? "Customer commitment not evidenced",
      demand.data.engineering_id
        ? `Engineering ${demand.data.engineering_id}`
        : "Technical release separately owned",
      ...packs.map(pack => `Issued pack ${pack.display_number} version ${pack.version}, exact issue ${pack.current_issue_id} (unchanged; document owner review required)`),
    ]
      .filter(Boolean)
      .join("; ");
    await addFact(
      c,
      p,
      demand,
      "Impact",
      {
        before_version: before,
        after_version: after,
        change: `${r.reference}: ${change}. ${reason}`,
        affected,
        state: "Requested",
        review_reference: null,
      },
      {
        evidence: reason,
        completeness: "Complete",
        observed_at: new Date().toISOString(),
        activity_id: activity.id,
      },
    );
  }
}
export async function allocate(p: Principal, input: unknown) {
  const cmd = allocationCommand(input);
  return sharedOperation(
    p,
    cmd,
    "Supply:Allocate",
    async (c) => ({
      d: await supplyRecord(c, p, cmd.demand_id, "supply.coordinate"),
      s: await supplyRecord(c, p, cmd.supply_id, "supply.coordinate"),
    }),
    async (c, { d, s }) => {
      currentVersion(d.version, cmd.demand_version);
      currentVersion(s.version, cmd.supply_version);
      const old = (
        await c.query(
          "SELECT * FROM ppo.supply_allocations WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, cmd.id],
        )
      ).rows[0];
      if (old) {
        if (old.demand_id !== d.id || old.supply_id !== s.id)
          throw unavailable();
        currentVersion(old.version, cmd.expected_version);
      } else if (cmd.expected_version !== null) throw unavailable();
      if (
        d.company_id !== s.company_id ||
        d.item !== s.item ||
        d.unit !== s.unit ||
        cmd.unit !== d.unit
      )
        invalid(
          "unit",
          "An allocation needs the same company, item and exact unit.",
        );
      if (old)
        await c.query(
          "UPDATE ppo.supply_allocations SET quantity=$3,version=version+1,reason=$4,updated_by=$5,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, cmd.id, cmd.quantity, cmd.reason, p.actor_id],
        );
      else
        await insert(c, "supply_allocations", {
          id: cmd.id,
          workspace_id: p.workspace_id,
          company_id: d.company_id,
          demand_id: d.id,
          supply_id: s.id,
          quantity: cmd.quantity,
          unit: cmd.unit,
          basis: cmd.basis,
          reason: cmd.reason,
          updated_by: p.actor_id,
        });
      const saved = await touch(c, p, d, cmd.reason);
      await touch(c, p, s, cmd.reason);
      await impacts(
        c,
        p,
        saved,
        cmd.reason,
        String(d.version),
        String(saved.version),
        "allocation",
      );
      return result(saved, { allocation_id: cmd.id });
    },
    "SupplyRecord",
    "SupplyRecorded",
  );
}
function check(condition: boolean, message: string): asserts condition {
  if (!condition) throw new AppError(422, "InvalidTransition", message);
}
function sameScopeState(
  previous: Fact | undefined,
  data: Fields,
  states: string[],
) {
  const from = previous?.data.state;
  const target = data.state!;
  check(states.includes(target), "The requested state is unsupported.");
  if (!previous) check(target === states[0], `Begin with ${states[0]}.`);
  else
    check(
      target === from || states.indexOf(target) === states.indexOf(from!) + 1,
      `Review the preceding ${from} stage first.`,
    );
  if (previous)
    for (const key of ["quantity", "outcome"])
      check(
        previous.data[key] === data[key],
        "A decision must retain its proposed quantity and outcome.",
      );
}
async function validateFact(
  c: PoolClient,
  p: Principal,
  r: SupplyRecord,
  cmd: ReturnType<typeof factCommand>,
  facts: Fact[],
) {
  const { kind, data } = cmd;
  check(
    kind !== "Credit" || !cmd.attachment_id,
    "Credit evidence belongs in the restricted Finance reference, not a shared Supply photo.",
  );
  check(
    factSpecs[kind].kinds.includes(r.kind),
    "This evidence does not belong to this record type.",
  );
  const active = currentFacts(facts),
    previous = cmd.predecessor_id
      ? active.find((f) => f.id === cmd.predecessor_id)
      : undefined;
  if (cmd.predecessor_id)
    check(
      !!previous && previous.kind === kind,
      "The predecessor changed or is not the same evidence kind.",
    );
  const singleton = [
    "Purchase",
    "Promise",
    "Reservation",
    "Substitution",
    "ReturnAuthorisation",
    "Disposition",
    "CustomerOutcome",
    "Claim",
    "Custody",
  ];
  if (singleton.includes(kind) && latestFact(facts, kind))
    check(
      previous?.id === latestFact(facts, kind)?.id,
      "Retain the latest evidence as the predecessor when revising this state.",
    );
  const unresolved = active.filter(
    (f) => f.kind === "ExternalOutcome" && f.data.state === "Unknown",
  );
  if (
    unresolved.length &&
    !["ExternalOutcome", "Impact", "Assessment"].includes(kind)
  )
    throw new AppError(
      409,
      "ReconciliationRequired",
      "Reconcile the original unknown external operation before another equivalent effect.",
    );
  if (kind === "ExternalOutcome") {
    const existing = active.find(
      (f) =>
        f.kind === "ExternalOutcome" &&
        f.data.source_operation === data.source_operation &&
        f.data.effect === data.effect,
    );
    if (existing)
      check(
        previous?.id === existing.id,
        "Reconcile the original operation; do not replace its identity.",
      );
    if (previous)
      check(
        previous.data.source_operation === data.source_operation &&
          previous.data.effect === data.effect,
        "The external operation and effect must remain exact.",
      );
    if (unresolved.length)
      check(
        unresolved.every((f) => f.id === previous?.id),
        "Resolve each original unknown outcome before recording another external operation.",
      );
  }
  if (kind === "Credit") {
    const original = active.find(f=>f.kind==="Credit" && f.data.party===data.party && f.data.erp_reference===data.erp_reference);
    if (original) check(previous?.id===original.id,"Retain the original credit observation as its predecessor; do not duplicate the source reference.");
    if (previous) check(previous.data.party===data.party && previous.data.erp_reference===data.erp_reference,
      "Reconcile the exact original credit party and ERP reference.");
    check(!active.some(f=>f.kind==="Credit" && f.data.party===data.party && f.data.state==="Unknown" && f.id!==previous?.id),
      "Reconcile the original unknown credit before another observation for that party.");
  }
  if (kind === "Purchase") {
    check(
      r.data.demand_class === "Approved",
      "Purchasing coordination requires approved demand.",
    );
    if (data.request_state === "Approved")
      check(
        !!data.approval_evidence,
        "Purchase request approval needs separate authority evidence.",
      );
  }
  if (kind === "Receipt") {
    try {
      receiptArithmetic(data);
    } catch (e) {
      invalid("received", (e as Error).message);
    }
    check(
      data.identity_status === "Verified" || q(data, "usable") === 0n,
      "Unidentified receipts remain unresolved and cannot provide usable supply.",
    );
  }
  if (kind === "Reservation") {
    check(
      q(data, "quantity") <= decimal(r.quantity),
      "Reservation observation exceeds demand.",
    );
    if (previous?.data.state === "Unknown")
      check(
        data.source_operation === previous.data.source_operation &&
          cmd.completeness === "Complete",
        "Resolve the original unknown reservation from complete evidence.",
      );
  }
  if (kind === "Substitution" && data.state === "Approved")
    check(
      previous?.data.state === "Proposed" &&
        !!data.engineering_reference &&
        !!data.scope_review,
      "Approval references the existing Engineering decision and scope review; technical authority remains there.",
    );
  if (["Pick", "Stage", "Dispatch"].includes(kind)) {
    const basis = await materialBasis(c, p, r, facts);
    check(
      basis.sources.every((s) => s.valid),
      "Refresh changed or incomplete usable evidence before fulfilment.",
    );
    check(
      !active.some(
        (f) => f.kind === "Substitution" && f.data.state === "Proposed",
      ),
      "Resolve the proposed substitution before picking or dispatch.",
    );
  }
  if (kind === "Dispatch") {
    if (data.state === "Moved")
      check(
        !!previous &&
          ["Prepared","Moved"].includes(previous.data.state!) &&
          data.quantity === previous.data.quantity &&
          !!data.movement_at,
        "Physical movement needs the exact prepared predecessor and movement time.",
      );
    check(
      q(data, "quantity") <=
        sumFacts(facts, "Stage") -
          sumFacts(
            facts.filter(
              (f) => f.id !== cmd.predecessor_id && (f.kind !== "Dispatch" || f.data.state === "Moved"),
            ),
            "Dispatch",
          ),
      "Prepare only the remaining staged quantity.",
    );
  }
  if (kind === "Delivery")
    check(
      q(data, "damaged") <= q(data, "quantity"),
      "Damage is part of the physical delivery quantity.",
    );
  if (kind === "Acknowledgement")
    check(
      active.some((f) => f.id === data.delivery_id && f.kind === "Delivery"),
      "Acknowledge an exact current delivery capture.",
    );
  if (kind === "ReturnAuthorisation") {
    check(
      r.data.identity_status === "Verified",
      "Unidentified goods remain evidence; resolve identity before authorisation.",
    );
    check(
      q(data, "quantity") <= decimal(r.quantity),
      "Authorisation exceeds the requested remaining-return quantity.",
    );
    if (data.state === "Approved")
      check(
        !!previous && ["Proposed","Approved"].includes(previous.data.state!) && previous.data.quantity === data.quantity,
        "Approve the exact proposed authorisation.",
      );
  }
  if (kind === "ReturnReceipt") {
    const authorised = latestFact(facts, "ReturnAuthorisation");
    const retainedReceipt = sumFacts(facts.filter(f=>f.id!==cmd.predecessor_id),"ReturnReceipt","received") + q(data,"received");
    const disposition = latestFact(facts,"Disposition");
    check(!disposition || q(disposition.data,"quantity") <= retainedReceipt,
      "Receipt correction cannot remove quantity already retained in a disposition decision.");
    check(
      q(data, "usable") + q(data, "quarantined") <= q(data, "received"),
      "Usable and quarantined cannot exceed received.",
    );
    if (r.data.identity_status !== "Verified")
      check(
        q(data, "usable") === 0n,
        "Unidentified returned goods cannot become usable.",
      );
    else
      check(
        authorised?.data.state === "Approved" &&
          sumFacts(
            facts.filter((f) => f.id !== cmd.predecessor_id),
            "ReturnReceipt",
            "received",
          ) +
            q(data, "received") <=
            q(authorised.data, "quantity"),
        "Return receipt exceeds the remaining authorised quantity.",
      );
  }
  if (kind === "Disposition") {
    check(
      r.data.identity_status === "Verified",
      "Resolve returned item identity before disposition.",
    );
    sameScopeState(previous, data, ["Proposed", "Approved", "Executed"]);
    check(
      q(data, "quantity") <= sumFacts(facts, "ReturnReceipt", "received"),
      "Disposition exceeds physical return receipt.",
    );
  }
  if (kind === "CustomerOutcome" && data.state === "Complete")
    check(
      latestFact(facts, "Disposition")?.data.state === "Executed",
      "Customer completion needs an executed remedy disposition. Supplier recovery is separate.",
    );
  if (kind === "SupplierMovement")
    check(
      latestFact(facts, "Disposition")?.data.state === "Executed" &&
        latestFact(facts, "Disposition")?.data.outcome === "ReturnToSupplier" &&
        sumFacts(
          facts.filter((f) => f.id !== cmd.predecessor_id),
          "SupplierMovement",
        ) +
          q(data, "quantity") <=
          q(latestFact(facts, "Disposition")!.data, "quantity"),
      "Physical supplier movement requires sufficient executed supplier-return disposition.",
    );
  if (kind === "Custody") {
    try {
      custodyArithmetic(r.quantity, data);
    } catch (e) {
      invalid("used", (e as Error).message);
    }
    if (q(data, "used") > 0n) {
      check(
        !!data.field_entry_id,
        "Used quantity requires an exact Field parts-capture reference.",
      );
      const entry = (
        await c.query(
          "SELECT * FROM ppo.field_entries e WHERE workspace_id=$1 AND id=$2 AND kind='Material' AND NOT EXISTS(SELECT 1 FROM ppo.field_entries n WHERE n.workspace_id=e.workspace_id AND n.supersedes_entry_id=e.id)",
          [p.workspace_id, uuid(data.field_entry_id, "field_entry_id")],
        )
      ).rows[0];
      check(
        !!entry &&
          entry.appointment_id === r.data.appointment_id &&
          entry.actor_id === r.data.technician_id &&
          entry.payload.item_reference === r.item &&
          entry.payload.uom === r.unit &&
          entry.payload.movement_kind === "Consumed" &&
          decimal(entry.payload.quantity) === q(data, "used"),
        "The current Field parts capture must match visit, custodian, item, unit and exact consumed quantity.",
      );
      const linked = (
        await c.query(
          "SELECT 1 FROM ppo.supply_current_facts WHERE workspace_id=$1 AND kind='Custody' AND record_id<>$2 AND data->>'field_entry_id'=$3",
          [p.workspace_id, r.id, data.field_entry_id],
        )
      ).rowCount;
      check(
        !linked,
        "This Field capture already reconciles another custody record.",
      );
    }
  }
  if (kind === "Impact" && data.state === "Reviewed")
    check(
      !!previous && !!data.review_reference,
      "Retain the requested review and reference the owning module's outcome.",
    );
  if (cmd.attachment_id) {
    const exists = (
      await c.query(
        "SELECT 1 FROM ppo.supply_attachments WHERE workspace_id=$1 AND record_id=$2 AND id=$3",
        [p.workspace_id, r.id, cmd.attachment_id],
      )
    ).rowCount;
    if (!exists) throw unavailable();
  }
}
export async function recordFact(p: Principal, id: string, input: unknown) {
  const cmd = factCommand(input);
  const operation = { ...cmd, record_id: id };
  return sharedOperation(
    p,
    operation,
    `Supply:Fact:${cmd.kind}`,
    async (c) => {
      const r = await supplyRecord(c, p, id, factCapability(cmd.kind));
      if (cmd.kind === "Credit" && !(await financeAllowed(c, p, r)))
        throw unavailable();
      return r;
    },
    async (c, r) => {
      currentVersion(r.version, cmd.expected_version);
      const facts = await factsFor(c, p, r);
      await validateFact(c, p, r, cmd, facts);
      let data = cmd.data;
      if (cmd.kind === "Assessment") {
        const basis = await materialBasis(c, p, r, facts);
        data = {
          ...data,
          state: basis.readiness.state,
          shortage: basis.readiness.shortage,
          basis: JSON.stringify({
            ...basis,
            fact_versions: currentFacts(facts).map((f) => ({
              id: f.id,
              version: f.version,
            })),
          }),
        };
      }
      // Public record revisions must never copy a restricted Finance explanation.
      const saved = await touch(
        c,
        p,
        r,
        cmd.kind === "Credit"
          ? "Restricted Finance observation recorded"
          : cmd.reason,
      );
      let activity_id: string | null = null;
      if (cmd.kind === "Impact") {
        activity_id =
          facts.find((f) => f.id === cmd.predecessor_id)?.activity_id ?? null;
        if (!activity_id) {
          const activity: ActivityInput = {
            id: randomUUID(),
            company_id: r.company_id,
            site_id: r.site_id,
            kind: "MaterialAction",
            owner_id: r.owner_id,
            summary: `${r.reference}: ${data.change}. ${cmd.reason}`.slice(
              0,
              1900,
            ),
            due_at: null,
            due_needed: true,
            access_class: "RestrictedService",
            links:
              r.data.origin_kind === "Project"
                ? [{ object_type: "Project", object_id: r.data.origin_id! }]
                : [{ object_type: "Site", object_id: r.site_id! }],
          };
          await authoriseActivityInput(c, p, activity);
          await insertActivity(c, p, activity);
          activity_id = activity.id;
        }
      }
      await addFact(c, p, saved, cmd.kind, data, { ...cmd, activity_id });
      if (
        ["Promise", "Receipt", "Reservation", "Substitution"].includes(cmd.kind)
      )
        await impacts(
          c,
          p,
          saved,
          cmd.reason,
          String(r.version),
          String(saved.version),
          cmd.kind,
        );
      return result(saved, { fact_id: cmd.id });
    },
    "SupplyRecord",
    "SupplyRecorded",
  );
}
export async function sourceReservation(
  p: Principal,
  id: string,
): Promise<never> {
  const { database } = await import("../platform/database");
  const r = await supplyRecord(database(), p, id, "supply.coordinate");
  await companyContext(
    database(),
    p,
    r.company_id,
    r.site_id,
    "supply.coordinate",
  );
  throw new AppError(
    409,
    "NotConfigured",
    "Live reservation commands are not configured. The source policy and authority have not been verified.",
  );
}
