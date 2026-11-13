import type { Principal } from "../platform/identity";
import type { QueryClient } from "../platform/permissions";
import { AppError } from "../platform/errors";
import { recordOperation, sharedOperation } from "../platform/operations";
import { companyContext } from "../shared/authority";
import {
  common,
  commonKeys,
  object,
  uuid,
  version,
  label,
} from "../shared/validation";
import { createSupplyRecordInTransaction } from "../supply/commands";
import { supplyRecord } from "../supply/context";
import { exactQuantity, recordCommand } from "../supply/validation";
import {
  currentFacts,
  decimal,
  latestFact,
  quantity,
  sumFacts,
  type SupplyRecord,
} from "../supply/model";
import { factsFor } from "../supply/reads";
import { currentAssessment } from "./assessments";
import {
  assetSnapshot,
  bump,
  conflict,
  expected,
  hash,
  history,
  record,
  type Claim,
  type Event,
  type WarrantyCase,
} from "./context";

export const returnPreparedAction = "SupplyReturnPrepared";
export const prepareReturnCommand = "Warranty:PrepareSupplyReturn";

export async function returnLink(
  c: QueryClient,
  p: Principal,
  claimId: string,
) {
  return (await history(c, p, claimId)).find(
    (e) => e.action === returnPreparedAction,
  );
}

/** The immutable source portion; owners and next actions may still change in Supply. */
export function returnBasis(
  r: Pick<
    SupplyRecord,
    | "kind"
    | "company_id"
    | "site_id"
    | "reference"
    | "item"
    | "unit"
    | "quantity"
    | "data"
    | "source_reference"
    | "external_key"
  >,
) {
  return {
    kind: r.kind,
    company_id: r.company_id,
    site_id: r.site_id,
    reference: r.reference,
    item: r.item,
    unit: r.unit,
    quantity: quantity(decimal(r.quantity)),
    data: r.data,
    source_reference: r.source_reference,
    external_key: r.external_key,
  };
}

// Native Supply revision calls this within its existing workspace transaction.
// The old Supply upgrade proofs predate Maintenance; they have no bridge to guard.
export async function guardReturnRevision(
  c: QueryClient,
  p: Principal,
  before: SupplyRecord,
  after: Parameters<typeof returnBasis>[0],
) {
  if (before.kind !== "Return") return;
  if (
    !(await c.query("SELECT to_regclass('ppo.maintenance_events') relation"))
      .rows[0].relation
  )
    return;
  const link = (
    await c.query<Event>(
      "SELECT * FROM ppo.maintenance_events WHERE workspace_id=$1 AND action=$2 AND content->>'supply_return_id'=$3",
      [p.workspace_id, returnPreparedAction, before.id],
    )
  ).rows[0];
  if (link && hash(returnBasis(after)) !== hash(link.content.return_basis))
    conflict(
      "This return retains its exact Warranty source, item, quantity and identity. Change only its coordination fields; record receiving and disposition through native Supply evidence.",
    );
}

/** Permission checks only: historical receipts remain recoverable after source changes. */
export async function returnReceiptAuthority(
  c: QueryClient,
  p: Principal,
  claimId: string,
) {
  const claim = await record<Claim>(
    c,
    p,
    "recovery",
    claimId,
    "warranty.recovery",
  );
  await record(c, p, "cases", claim.case_id);
  await companyContext(c, p, claim.company_id, claim.site_id, "supply.return");
  const link = await returnLink(c, p, claimId);
  if (link)
    await supplyRecord(
      c,
      p,
      String(link.content.supply_return_id),
      "supply.return",
    );
  return claim;
}

export async function prepareSupplyReturn(
  p: Principal,
  id: string,
  input: unknown,
) {
  const r = object(input, [
    ...commonKeys,
    "expected_version",
    "expected_case_version",
    "expected_demand_version",
    "authorisation_event_id",
    "demand_id",
    "delivery_fact_id",
    "return_id",
    "supply_operation_id",
    "quantity",
    "owner_id",
    "identity_evidence",
    "reported_symptom",
    "source_reference",
  ]);
  const cmd = {
    ...common(r),
    id: uuid(id, "id"),
    expected_version: version(r.expected_version),
    expected_case_version: version(r.expected_case_version),
    expected_demand_version: version(r.expected_demand_version),
    authorisation_event_id: uuid(
      r.authorisation_event_id,
      "authorisation_event_id",
    ),
    demand_id: uuid(r.demand_id, "demand_id"),
    delivery_fact_id: uuid(r.delivery_fact_id, "delivery_fact_id"),
    return_id: uuid(r.return_id, "return_id"),
    supply_operation_id: uuid(r.supply_operation_id, "supply_operation_id"),
    quantity: exactQuantity(r.quantity, "quantity", true),
    owner_id: uuid(r.owner_id, "owner_id"),
    identity_evidence: label(r.identity_evidence, "identity_evidence", 1000),
    reported_symptom: label(r.reported_symptom, "reported_symptom", 1000),
    source_reference: label(r.source_reference, "source_reference", 1000),
  };
  if (cmd.operation_id === cmd.supply_operation_id)
    conflict(
      "The bridge and native Supply creation need distinct original operation IDs.",
    );
  return sharedOperation(
    p,
    cmd,
    prepareReturnCommand,
    async (c) => {
      const claim = await returnReceiptAuthority(c, p, cmd.id);
      const demand = await supplyRecord(c, p, cmd.demand_id);
      return { claim, demand };
    },
    async (c, { claim, demand }) => {
      expected(claim.version, cmd.expected_version);
      expected(demand.version, cmd.expected_demand_version);
      if (await returnLink(c, p, claim.id))
        conflict(
          "This claim already has a native return. Recover its original operation and continue that return.",
        );
      const w = await record<WarrantyCase>(c, p, "cases", claim.case_id);
      expected(w.version, cmd.expected_case_version);
      const authorisation = (await history(c, p, claim.id))
        .filter((e) => e.action === "ReturnEvidence")
        .at(-1);
      if (
        !authorisation ||
        authorisation.id !== cmd.authorisation_event_id ||
        authorisation.content.stage !== "Authorised"
      )
        return conflict(
          "Use the exact latest Authorised return evidence, before external receipt or disposition. Historical external movements are not imported as native custody.",
        );
      const assessment = await currentAssessment(
        c,
        p,
        String((claim.package.assessment as { id: string }).id),
      );
      const asset = await assetSnapshot(c, p, w.asset_id);
      if (
        assessment.warranty_case_id !== w.id ||
        w.source.availability !== "Available" ||
        hash(w.source) !== hash(claim.package.source) ||
        w.evidence_revision !== claim.package.evidence_revision ||
        asset.identity_status !== "Verified" ||
        asset.site_id !== w.site_id ||
        asset.serial !==
          (claim.package.asset as { serial: string | null }).serial
      )
        conflict(
          "The exact claim source, reviewed evidence and equipment identity must still support this return.",
        );
      const delivery = currentFacts(await factsFor(c, p, demand)).find(
        (f) => f.id === cmd.delivery_fact_id && f.kind === "Delivery",
      );
      if (
        !delivery ||
        delivery.completeness !== "Complete" ||
        decimal(cmd.quantity) > decimal(delivery.data.quantity!)
      )
        return conflict(
          "Name exact current complete delivery evidence covering the requested return quantity. Original demand alone does not establish delivered goods.",
        );
      if (
        demand.kind !== "Demand" ||
        demand.company_id !== claim.company_id ||
        demand.site_id !== claim.site_id ||
        demand.data.customer_id !== claim.customer_id ||
        demand.data.asset_id !== w.asset_id ||
        demand.data.demand_class !== "Approved" ||
        demand.completeness !== "Complete" ||
        decimal(cmd.quantity) > decimal(demand.quantity)
      )
        conflict(
          "Choose a complete approved original demand for this exact company, site, customer and equipment, within its recorded quantity.",
        );
      if (
        (
          await c.query(
            "SELECT 1 FROM ppo.operation_receipts WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3",
            [p.workspace_id, p.actor_id, cmd.supply_operation_id],
          )
        ).rowCount
      )
        conflict(
          "That native Supply operation is already used. Recover the original operation instead of adopting or replacing it.",
        );
      const native = recordCommand({
        ...common(r),
        operation_id: cmd.supply_operation_id,
        id: cmd.return_id,
        kind: "Return",
        company_id: claim.company_id,
        site_id: claim.site_id,
        reference: `SYN-SC-${cmd.return_id}`,
        title: `Warranty return ${claim.reference}`,
        item: demand.item,
        unit: demand.unit,
        quantity: cmd.quantity,
        owner_id: cmd.owner_id,
        next_action:
          "Review the exact return authorisation in Supply before receiving goods.",
        data: {
          direction: "Customer",
          demand_id: demand.id,
          identity_evidence: cmd.identity_evidence,
          identity_status: "Verified",
          reported_symptom: cmd.reported_symptom,
          warranty_reference: claim.reference,
          source_reference: cmd.source_reference,
        },
        completeness: "Complete",
        observed_at: new Date().toISOString(),
        source_reference: cmd.source_reference,
        external_key: null,
      });
      const saved = await createSupplyRecordInTransaction(c, p, native);
      await recordOperation(
        c,
        p,
        native,
        {
          id: saved.id,
          version: saved.version,
          state: "Recorded",
          updated_at: new Date(saved.updated_at),
        },
        "SupplyRecord",
        "SupplyRecorded",
        hash({ command: "Supply:Create", ...native }),
        {
          command: "Supply:Create",
          record_version: saved.version,
        },
      );
      return bump(
        c,
        p,
        "recovery",
        claim,
        returnPreparedAction,
        {
          bridge_version: 1,
          supply_return_id: saved.id,
          supply_operation_id: cmd.supply_operation_id,
          return_basis: returnBasis(saved),
          claim_package_hash: claim.package_hash,
          case_id: w.id,
          case_version: w.version,
          authorisation_event_id: authorisation.id,
          authorisation_hash: hash(authorisation),
          demand_id: demand.id,
          demand_version: demand.version,
          demand_hash: hash(demand),
          delivery,
          asset,
        },
        cmd.reason,
      );
    },
    "SupplierClaim",
    "WarrantyChanged",
    [cmd.supply_operation_id],
  );
}

const physicalKinds = new Set([
  "ReturnAuthorisation",
  "ReturnReceipt",
  "Disposition",
  "SupplierMovement",
  "ExternalOutcome",
]);
export async function returnProgress(
  c: QueryClient,
  p: Principal,
  claimId: string,
) {
  const link = await returnLink(c, p, claimId);
  if (!link)
    return {
      state: "NotPrepared",
      message:
        "No native Supply return has been prepared. External return evidence does not establish native receiving.",
    };
  try {
    const r = await supplyRecord(c, p, String(link.content.supply_return_id));
    if (hash(returnBasis(r)) !== hash(link.content.return_basis))
      return {
        state: "ReviewRequired",
        message: "The native return no longer matches its retained source.",
      };
    const facts = (await factsFor(c, p, r)).filter((f) =>
      physicalKinds.has(f.kind),
    );
    const active = currentFacts(facts),
      unknown = active.some(
        (f) => f.kind === "ExternalOutcome" && f.data.state === "Unknown",
      ),
      complete =
        !unknown &&
        r.completeness === "Complete" &&
        active.every((f) => f.completeness === "Complete");
    const received = sumFacts(facts, "ReturnReceipt", "received"),
      disposition = latestFact(facts, "Disposition"),
      authorised = latestFact(facts, "ReturnAuthorisation");
    const stage = unknown
      ? "OutcomeUnknown"
      : !complete
        ? "EvidenceNeeded"
        : disposition?.data.state === "Executed"
          ? decimal(disposition.data.quantity!) >= decimal(r.quantity)
            ? "DispositionExecuted"
            : "PartialDispositionExecuted"
          : received > 0n
            ? received >= decimal(r.quantity)
              ? "Received"
              : "PartiallyReceived"
            : authorised?.data.state === "Approved"
              ? "Authorised"
              : "Prepared";
    return {
      state: "Available",
      stage,
      supply_return_id: r.id,
      reference: r.reference,
      version: r.version,
      href: `/supply/returns?record=${r.id}`,
      unit: r.unit,
      requested_quantity: quantity(decimal(r.quantity)),
      received_quantity: complete ? quantity(received) : null,
      completeness: complete ? "Complete" : "Partial",
      authorisation: authorised ?? null,
      disposition: disposition ?? null,
      facts,
      message:
        "Native Supply evidence; customer resolution, Finance credit and ERP stock postings remain separate.",
    };
  } catch (e) {
    if (e instanceof AppError && [403, 404].includes(e.status))
      return {
        state: "Restricted",
        message: "Native return evidence is unavailable under current access.",
      };
    throw e;
  }
}

export async function visibleReturnEvent(
  c: QueryClient,
  p: Principal,
  event: Event,
) {
  if (event.action !== returnPreparedAction) return event;
  try {
    await supplyRecord(c, p, String(event.content.supply_return_id));
    return event;
  } catch (e) {
    if (!(e instanceof AppError && [403, 404].includes(e.status))) throw e;
    // The reason can contain receiving identifiers too; retain only the safe event envelope.
    return {
      ...event,
      reason: "Native return prepared; receiving evidence is restricted.",
      content: { state: "Restricted" },
    };
  }
}
