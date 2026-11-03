import { createHash, randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { database, transaction } from "../platform/database";
import type { Principal } from "../platform/identity";
import { canonical, sharedOperation } from "../platform/operations";
import type { QueryClient } from "../platform/permissions";
import { AppError, unavailable } from "../platform/errors";
import { companyContext, scopedOwner } from "../shared/authority";
import {
  common,
  commonKeys,
  object,
  optionalId,
  uuid,
  version,
} from "../shared/validation";
import {
  conflict,
  insertRow,
  recipientCheck,
  switchMode,
} from "../communications/records";
import {
  prepareCustomerMessageInTransaction,
  type MessageSource,
} from "../communications/service";
import { currentVersion, supplyRecord } from "./context";
import { decimal, type SupplyRecord } from "./model";
import {
  customerDeliveryCommand,
  dispatchQuantities,
  laterCustomerEta,
  type DispatchNoticeDetails,
} from "./customer-delivery-model";

export type DeliveryEvidence = {
  id: string;
  workspace_id: string;
  company_id: string;
  demand_id: string;
  version: number;
  record_version: number;
  contact_id: string | null;
  customer_eta: string | null;
  delay_reason_code: string | null;
};
export async function currentCustomerDelivery(
  c: QueryClient,
  w: string,
  id: string,
): Promise<DeliveryEvidence | null> {
  return (
    (
      await c.query(
        `SELECT *,customer_eta::text AS customer_eta FROM ppo.supply_customer_delivery_events
    WHERE workspace_id=$1 AND demand_id=$2 ORDER BY version DESC LIMIT 1`,
        [w, id],
      )
    ).rows[0] ?? null
  );
}
async function demand(c: QueryClient, p: Principal, id: string, write = false) {
  const r = await supplyRecord(
    c,
    p,
    id,
    write ? "supply.coordinate" : "supply.read",
  );
  if (r.kind !== "Demand" || !r.data.customer_id) throw unavailable();
  return r;
}
export async function lastSentCustomerEta(
  c: QueryClient,
  w: string,
  r: SupplyRecord,
  contact: string | null,
) {
  if (!contact) return null;
  return (
    ((
      await c.query(
        `SELECT m.id,s.customer_eta::text AS customer_eta FROM ppo.supply_customer_notice_sources s
    JOIN ppo.customer_communications m ON (m.workspace_id,m.id)=(s.workspace_id,s.communication_id)
    JOIN LATERAL (SELECT occurred_at,version FROM ppo.customer_communication_events e
      WHERE e.workspace_id=m.workspace_id AND e.communication_id=m.id AND e.state='Sent'
      ORDER BY version DESC LIMIT 1) sent ON true
    WHERE s.workspace_id=$1 AND s.demand_id=$2 AND m.company_id=$3 AND m.organisation_id=$4
      AND m.recipient_contact_id=$5 AND s.customer_eta IS NOT NULL
      AND EXISTS(SELECT 1 FROM ppo.customer_email_templates t WHERE t.workspace_id=m.workspace_id AND t.id=m.template_id
        AND position('{{delivery.customer_eta}}' IN t.definition)>0)
    ORDER BY sent.occurred_at DESC,m.id DESC LIMIT 1`,
        [w, r.id, r.company_id, r.data.customer_id, contact],
      )
    ).rows[0] as { id: string; customer_eta: string } | undefined) ?? null
  );
}
async function option(c: QueryClient, kind: string, code: string) {
  const row = (
    await c.query(
      "SELECT code,label FROM ppo.supply_customer_notice_options WHERE kind=$1 AND code=$2",
      [kind, code],
    )
  ).rows[0];
  if (!row)
    conflict(
      "UnknownSyntheticOption",
      "Select an entry from the synthetic carrier, platform or delay-reason catalogue.",
    );
  return row as { code: string; label: string };
}
export async function customerDeliveryOptions(
  p: Principal,
  _id: string,
  query: Record<string, string>,
) {
  const c = database(),
    company = uuid(query.company_id, "company_id");
  await companyContext(c, p, company, null, "supply.read");
  return {
    synthetic: true,
    options: (
      await c.query(
        "SELECT kind,code,label FROM ppo.supply_customer_notice_options ORDER BY kind,code",
      )
    ).rows,
  };
}
export async function readCustomerDelivery(p: Principal, id: string) {
  return transaction(async (c) => {
    const r = await demand(c, p, id);
    const current = await currentCustomerDelivery(c, p.workspace_id, id);
    const history = (
      await c.query(
        `SELECT id,version,record_version,contact_id,customer_eta::text,delay_reason_code,actor_id,operation_id,recorded_at
      FROM ppo.supply_customer_delivery_events WHERE workspace_id=$1 AND demand_id=$2 ORDER BY version`,
        [p.workspace_id, id],
      )
    ).rows;
    const dispatches = (
      await c.query(
        `SELECT f.id,f.version,f.predecessor_id,f.data,d.carrier_code,d.platform_code,d.tracking_number,
      NOT EXISTS(SELECT 1 FROM ppo.supply_facts n WHERE n.workspace_id=f.workspace_id AND n.predecessor_id=f.id) AS current
      FROM ppo.supply_facts f LEFT JOIN ppo.supply_dispatch_details d ON (d.workspace_id,d.fact_id)=(f.workspace_id,f.id)
      WHERE f.workspace_id=$1 AND f.record_id=$2 AND f.kind='Dispatch' ORDER BY f.version,f.id`,
        [p.workspace_id, id],
      )
    ).rows;
    const notices = (
      await c.query(
        `SELECT s.communication_id,s.dispatch_fact_id,s.delivery_event_id,s.baseline_communication_id,s.source_hash,
      ppo.customer_communication_latest(s.workspace_id,s.communication_id) AS state FROM ppo.supply_customer_notice_sources s
      WHERE s.workspace_id=$1 AND s.demand_id=$2 ORDER BY s.created_at,s.communication_id`,
        [p.workspace_id, id],
      )
    ).rows;
    return {
      demand_id: id,
      record_version: r.version,
      current,
      history,
      dispatches,
      notices,
      last_sent_eta: await lastSentCustomerEta(
        c,
        p.workspace_id,
        r,
        current?.contact_id ?? null,
      ),
      synthetic: true,
    };
  });
}

export async function recordCustomerDelivery(
  p: Principal,
  id: string,
  input: unknown,
) {
  const cmd = customerDeliveryCommand(id, input);
  return sharedOperation(
    p,
    cmd,
    "Supply:CustomerDelivery",
    (c) => demand(c, p, cmd.id, true),
    async (c, r) => {
      currentVersion(r.version, cmd.expected_version);
      if (cmd.contact_id) {
        const checked = await recipientCheck(
          c,
          p.workspace_id,
          {
            company_id: r.company_id,
            organisation_id: r.data.customer_id!,
            message_class: "DelayNotice",
          },
          cmd.contact_id,
        );
        if (!checked.person || checked.hold === "RecipientNotCurrent")
          throw unavailable();
      }
      if (cmd.delay_reason_code)
        await option(c, "DelayReason", cmd.delay_reason_code);
      const prior = await currentCustomerDelivery(c, p.workspace_id, id);
      if (
        prior &&
        prior.contact_id === cmd.contact_id &&
        prior.customer_eta === cmd.customer_eta &&
        prior.delay_reason_code === cmd.delay_reason_code
      )
        conflict(
          "CustomerDeliveryUnchanged",
          "The named contact and customer ETA are unchanged.",
        );
      const saved = (
        await c.query(
          `UPDATE ppo.supply_records SET version=version+1,updated_by=$3,updated_at=clock_timestamp(),last_reason=$4
      WHERE workspace_id=$1 AND id=$2 RETURNING *`,
          [p.workspace_id, id, p.actor_id, cmd.reason],
        )
      ).rows[0] as SupplyRecord;
      const delivery = await insertRow(c, "supply_customer_delivery_events", {
        id: randomUUID(),
        workspace_id: p.workspace_id,
        company_id: r.company_id,
        demand_id: id,
        version: (prior?.version ?? 0) + 1,
        record_version: saved.version,
        contact_id: cmd.contact_id,
        customer_eta: cmd.customer_eta,
        delay_reason_code: cmd.delay_reason_code,
        actor_id: p.actor_id,
        operation_id: cmd.operation_id,
      });
      const notice = await draftNotice(c, p, saved, null, delivery.id);
      return {
        id,
        version: saved.version,
        state: "Recorded",
        updated_at: new Date(saved.updated_at),
        audit_details: {
          delivery_event_id: delivery.id,
          communication_id: null,
          ...notice,
        },
      };
    },
    "SupplyRecord",
    "SupplyRecorded",
  );
}

// Called only after native supply validation accepted a Dispatch fact in the same transaction.
export async function recordDispatchNotice(
  c: PoolClient,
  p: Principal,
  r: SupplyRecord,
  fact: {
    id: string;
    data: Record<string, string | null>;
    dispatch_notice?: DispatchNoticeDetails;
  },
) {
  // Historical populated-upgrade proofs run native commands before S3 is installed.
  if (
    !(
      await c.query(
        "SELECT to_regclass('ppo.supply_dispatch_details') AS relation",
      )
    ).rows[0].relation
  )
    return null;
  if (fact.dispatch_notice) {
    await option(c, "Carrier", fact.dispatch_notice.carrier_code);
    await option(c, "Platform", fact.dispatch_notice.platform_code);
    await insertRow(c, "supply_dispatch_details", {
      workspace_id: p.workspace_id,
      company_id: r.company_id,
      demand_id: r.id,
      fact_id: fact.id,
      ...fact.dispatch_notice,
    });
  }
  if (
    fact.data.state !== "Moved" ||
    !r.data.customer_id ||
    decimal(fact.data.quantity ?? "0") === 0n
  )
    return null;
  return draftNotice(c, p, r, fact.id, null);
}

type Snapshot = {
  message_class: "DispatchNotice" | "DelayNotice";
  facts: Record<string, string | null>;
  required: string[];
  delivery: DeliveryEvidence | null;
  baseline_id: string | null;
  customer_eta: string | null;
  dispatch_fact_id: string | null;
  supersedes_id: string | null;
  basis: Record<string, unknown>;
  hold: "PriorOutcomeUnknown" | "MissingData" | null;
};
export async function noticeSnapshot(
  c: QueryClient,
  p: Principal,
  r: SupplyRecord,
  dispatchId: string | null,
): Promise<Snapshot | null> {
  const w = p.workspace_id,
    delivery = await currentCustomerDelivery(c, w, r.id);
  const facts: Record<string, string | null> = {
    "delivery.customer_eta": delivery?.customer_eta ?? null,
  };
  const basis: Record<string, unknown> = {
    company_id: r.company_id,
    site_id: r.site_id,
    organisation_id: r.data.customer_id,
    reference: r.reference,
    item: r.item,
    unit: r.unit,
    quantity: r.quantity,
    delivery_event_id: delivery?.id ?? null,
  };
  if (!dispatchId) {
    const baseline = await lastSentCustomerEta(
      c,
      w,
      r,
      delivery?.contact_id ?? null,
    );
    if (
      !laterCustomerEta(
        delivery?.customer_eta ?? null,
        baseline?.customer_eta ?? null,
      )
    )
      return null;
    const reason = delivery?.delay_reason_code
      ? await option(c, "DelayReason", delivery.delay_reason_code)
      : null;
    Object.assign(facts, {
      "delay.previous_eta": baseline!.customer_eta,
      "delay.reason": reason?.label ?? null,
    });
    return {
      message_class: "DelayNotice",
      facts,
      required: ["delivery.customer_eta", "delay.previous_eta", "delay.reason"],
      delivery,
      baseline_id: baseline!.id,
      customer_eta: delivery!.customer_eta,
      dispatch_fact_id: null,
      supersedes_id: null,
      basis: { ...basis, baseline_communication_id: baseline!.id, facts },
      hold: null,
    };
  }
  const dispatch = (
    await c.query(
      `SELECT f.*,d.carrier_code,d.platform_code,d.tracking_number FROM ppo.supply_current_facts f
    LEFT JOIN ppo.supply_dispatch_details d ON (d.workspace_id,d.fact_id)=(f.workspace_id,f.id)
    WHERE f.workspace_id=$1 AND f.record_id=$2 AND f.id=$3 AND f.kind='Dispatch' AND f.data->>'state'='Moved'`,
      [w, r.id, dispatchId],
    )
  ).rows[0];
  if (!dispatch)
    conflict(
      "DispatchNotCurrent",
      "Select the current native Moved dispatch evidence.",
    );
  const moved = (
    await c.query(
      `SELECT id,version,data->>'quantity' AS quantity FROM ppo.supply_current_facts
    WHERE workspace_id=$1 AND record_id=$2 AND kind='Dispatch' AND data->>'state'='Moved'`,
      [w, r.id],
    )
  ).rows as { id: string; version: number; quantity: string }[];
  moved.sort((a, b) => new Intl.Collator("en").compare(a.id, b.id));
  const totals = dispatchQuantities(
    r.quantity,
    moved.map((f) => f.quantity),
    dispatch.data.quantity,
  );
  const carrier = dispatch.carrier_code
    ? await option(c, "Carrier", dispatch.carrier_code)
    : null;
  const platform = dispatch.platform_code
    ? await option(c, "Platform", dispatch.platform_code)
    : null;
  Object.assign(facts, {
    "dispatch.carrier": carrier?.label ?? null,
    "dispatch.platform": platform?.label ?? null,
    "dispatch.tracking_number": dispatch.tracking_number ?? null,
    "dispatch.tracking_url":
      dispatch.tracking_number && carrier
        ? `https://tracking.example/${carrier.code}/${encodeURIComponent(dispatch.tracking_number)}`
        : null,
    "dispatch.movement_at": dispatch.data.movement_at,
    "dispatch.quantity": totals.movement,
    "dispatch.dispatched_quantity": totals.dispatched,
    "dispatch.outstanding_quantity": totals.outstanding,
    "dispatch.item": r.item,
    "dispatch.unit": r.unit,
  });
  const prior = (
    await c.query(
      `WITH RECURSIVE ancestors AS (
    SELECT id,predecessor_id FROM ppo.supply_facts WHERE workspace_id=$1 AND id=$2
    UNION ALL SELECT f.id,f.predecessor_id FROM ppo.supply_facts f JOIN ancestors a ON f.id=a.predecessor_id WHERE f.workspace_id=$1)
    SELECT m.id,ppo.customer_communication_latest(m.workspace_id,m.id) AS state FROM ppo.supply_customer_notice_sources s JOIN ppo.customer_communications m ON (m.workspace_id,m.id)=(s.workspace_id,s.communication_id)
    WHERE s.workspace_id=$1 AND s.demand_id=$3 AND s.dispatch_fact_id IN (SELECT id FROM ancestors WHERE id<>$2)
      AND m.recipient_contact_id IS NOT DISTINCT FROM $4::uuid AND ppo.customer_communication_latest(m.workspace_id,m.id) IN ('Queued','Submitted','Sent','Delivered','OutcomeUnknown')
    ORDER BY m.source_fact_version DESC,m.id LIMIT 1`,
      [w, dispatchId, r.id, delivery?.contact_id ?? null],
    )
  ).rows[0];
  return {
    message_class: "DispatchNotice",
    facts,
    required: [
      "dispatch.carrier",
      "dispatch.platform",
      "dispatch.tracking_number",
      "dispatch.movement_at",
      "dispatch.quantity",
    ],
    delivery,
    baseline_id: null,
    customer_eta: delivery?.customer_eta ?? null,
    dispatch_fact_id: dispatchId,
    supersedes_id:
      prior && ["Sent", "Delivered"].includes(prior.state) ? prior.id : null,
    basis: {
      ...basis,
      dispatch_fact_id: dispatchId,
      completeness: dispatch.completeness,
      moved,
      facts,
    },
    hold:
      prior && ["Queued", "Submitted", "OutcomeUnknown"].includes(prior.state)
        ? "PriorOutcomeUnknown"
        : dispatch.completeness !== "Complete"
          ? "MissingData"
          : null,
  };
}
export const noticeSourceHash = (basis: Record<string, unknown>) =>
  createHash("sha256").update(canonical(basis)).digest("hex");

type NoticePreparation =
  | { communication_id: string }
  | {
      communication_id: null;
      notice_outcome: "NotPrepared";
      notice_reason: "OwnerUnavailable";
    };

async function draftNotice(
  c: PoolClient,
  p: Principal,
  r: SupplyRecord,
  dispatchId: string | null,
  deliveryId: string | null,
): Promise<NoticePreparation | null> {
  const cls = dispatchId ? "DispatchNotice" : "DelayNotice";
  if ((await switchMode(c, p.workspace_id, r.company_id, cls)) === "Off")
    return null;
  const snapshot = await noticeSnapshot(c, p, r, dispatchId);
  if (!snapshot) return null;
  if (deliveryId && snapshot.delivery?.id !== deliveryId)
    conflict(
      "CustomerDeliveryChanged",
      "Review the latest customer delivery evidence.",
    );
  // A missing follow-up owner is notice setup, not invalid native Dispatch/ETA evidence.
  // Do not guess a replacement owner or suppress any caller/source/catalogue validation.
  try {
    await scopedOwner(
      c,
      p,
      r.owner_id,
      r.company_id,
      r.site_id ?? undefined,
      "activity.read",
    );
  } catch (error) {
    if (
      error instanceof AppError &&
      error.status === 404 &&
      error.code === "RecordUnavailable"
    )
      return {
        communication_id: null,
        notice_outcome: "NotPrepared",
        notice_reason: "OwnerUnavailable",
      };
    throw error;
  }
  const duplicate = (
    await c.query(
      `SELECT s.communication_id FROM ppo.supply_customer_notice_sources s
    JOIN ppo.customer_communications m ON (m.workspace_id,m.id)=(s.workspace_id,s.communication_id)
    WHERE s.workspace_id=$1 AND s.demand_id=$2 AND m.message_class=$3
      AND s.dispatch_fact_id IS NOT DISTINCT FROM $4::uuid
      AND ($4::uuid IS NOT NULL OR s.delivery_event_id IS NOT DISTINCT FROM $5::uuid)
      AND m.recipient_contact_id IS NOT DISTINCT FROM $6::uuid AND ppo.customer_communication_latest(m.workspace_id,m.id)<>'Withdrawn'`,
      [
        p.workspace_id,
        r.id,
        cls,
        dispatchId,
        snapshot.delivery?.id ?? null,
        snapshot.delivery?.contact_id ?? null,
      ],
    )
  ).rows[0];
  if (duplicate)
    conflict(
      "MessageAlreadyPrepared",
      "This source fact already has a message for this contact. Withdraw an unsent draft before preparing it again.",
    );
  const source: MessageSource = {
    message_class: cls,
    source_type: "SupplyDemand",
    source_id: r.id,
    async resolve(client, actor) {
      await supplyRecord(
        client,
        actor,
        r.id,
        dispatchId ? "supply.fulfil" : "supply.coordinate",
      );
      return {
        fact_version: r.version,
        facts: snapshot.facts,
        required: snapshot.required,
        hold: snapshot.hold,
        recipient: {
          role: "Order delivery contact",
          contact_id: snapshot.delivery?.contact_id ?? null,
        },
      };
    },
  };
  const communication_id = randomUUID();
  await prepareCustomerMessageInTransaction(c, p, source, {
    operation_id: randomUUID(),
    schema_version: 1,
    reason: "Drafted from recorded synthetic customer delivery evidence.",
    communication_id,
    supersedes_id: snapshot.supersedes_id,
  });
  await insertRow(c, "supply_customer_notice_sources", {
    workspace_id: p.workspace_id,
    company_id: r.company_id,
    demand_id: r.id,
    communication_id,
    dispatch_fact_id: dispatchId,
    delivery_event_id: snapshot.delivery?.id ?? null,
    baseline_communication_id: snapshot.baseline_id,
    customer_eta: snapshot.customer_eta,
    source_snapshot: canonical(snapshot.basis),
    source_hash: noticeSourceHash(snapshot.basis),
  });
  return { communication_id };
}

// Explicit recovery after Off, missing setup or a held draft. It still resolves native evidence;
// callers cannot submit recipient addresses, body text or a claimed source version.
export async function prepareSupplyCustomerNotice(
  p: Principal,
  id: string,
  input: unknown,
) {
  const r = object(input, [
    ...commonKeys,
    "expected_version",
    "dispatch_fact_id",
  ]);
  const cmd = {
    ...common(r),
    id: uuid(id, "id"),
    expected_version: version(r.expected_version),
    dispatch_fact_id: optionalId(r.dispatch_fact_id, "dispatch_fact_id"),
  };
  return sharedOperation(
    p,
    cmd,
    cmd.dispatch_fact_id
      ? "Supply:PrepareDispatchNotice"
      : "Supply:PrepareDelayNotice",
    async (c) => {
      const record = await demand(c, p, cmd.id);
      await companyContext(
        c,
        p,
        record.company_id,
        record.site_id,
        cmd.dispatch_fact_id ? "supply.fulfil" : "supply.coordinate",
      );
      return record;
    },
    async (c, record) => {
      currentVersion(record.version, cmd.expected_version);
      const notice = await draftNotice(
        c,
        p,
        record,
        cmd.dispatch_fact_id,
        null,
      );
      if (notice && !notice.communication_id)
        conflict(
          "NoticeOwnerUnavailable",
          "Restore an active, authorised follow-up owner on the demand before preparing its notice.",
        );
      if (!notice)
        conflict(
          "NoticeNotApplicable",
          "The class is Off or no later customer ETA has a sent baseline for this contact.",
        );
      return {
        id,
        version: record.version,
        state: "Recorded",
        updated_at: new Date(),
        audit_details: { ...notice },
      };
    },
    "SupplyRecord",
    "SupplyRecorded",
  );
}
