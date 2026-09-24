import { randomUUID } from "node:crypto";
import type { Principal } from "../platform/identity";
import { sharedOperation } from "../platform/operations";
import type { Capability } from "../platform/permissions";
import { visible } from "../shared/reads";
import {
  common,
  commonKeys,
  object,
  uuid,
  version,
  invalid,
  choice,
  dateOnly,
  label,
} from "../shared/validation";
import { currentAssessment } from "./assessments";
import { minorUnits, supplierApproval, supplierStates, text } from "./model";
import {
  assetSnapshot,
  bump,
  event,
  expected,
  hash,
  history,
  insert,
  meta,
  owner,
  record,
  reference,
  conflict,
  type Claim,
  type WarrantyCase,
} from "./context";

export async function createClaim(p: Principal, input: unknown) {
  const r = object(input, [
    ...commonKeys,
    "id",
    "case_id",
    "expected_case_version",
    "assessment_id",
    "supplier_id",
    "scope",
    "claimed_minor",
    "currency",
    "tax_basis",
    "owner_id",
    "due_date",
  ]);
  const cmd = {
    ...common(r),
    id: uuid(r.id, "id"),
    case_id: uuid(r.case_id, "case_id"),
    expected_case_version: version(r.expected_case_version),
    assessment_id: uuid(r.assessment_id, "assessment_id"),
    supplier_id: uuid(r.supplier_id, "supplier_id"),
    scope: text(r.scope, "scope"),
    claimed_minor: minorUnits(r.claimed_minor, "claimed_minor"),
    currency: label(r.currency, "currency", 3),
    tax_basis: choice(r.tax_basis, "tax_basis", [
      "ExcludingTax",
      "IncludingTax",
      "NotApplicable",
    ] as const),
    owner_id: uuid(r.owner_id, "owner_id"),
    due_date: dateOnly(r.due_date, "due_date"),
  };
  if (!/^[A-Z]{3}$/.test(cmd.currency))
    invalid("currency", "Use an explicit ISO currency code.");
  return sharedOperation(
    p,
    cmd,
    "Warranty:CreateClaim",
    async (c) => {
      const row = await record<WarrantyCase>(
        c,
        p,
        "cases",
        cmd.case_id,
        "warranty.recovery",
      );
      const supplier = await visible(c, p, "Organisation", cmd.supplier_id);
      if (supplier.company_id !== row.company_id)
        invalid(
          "supplier_id",
          "Choose the exact supplier in this company context.",
        );
      await owner(c, p, row, cmd.owner_id, "warranty.recovery");
      return row;
    },
    async (c, w) => {
      expected(w.version, cmd.expected_case_version);
      const assessment = await currentAssessment(c, p, cmd.assessment_id),
        asset = await assetSnapshot(c, p, w.asset_id);
      if (
        assessment.warranty_case_id !== w.id ||
        w.source.availability !== "Available" ||
        asset.identity_status !== "Verified"
      )
        conflict(
          "The claim needs this case's current assessment, available terms and verified identity.",
        );
      const evidence = (
        await c.query(
          "SELECT id,revision,source FROM ppo.warranty_evidence WHERE workspace_id=$1 AND case_id=$2 ORDER BY revision",
          [p.workspace_id, w.id],
        )
      ).rows;
      const pack = {
        case_id: w.id,
        source: w.source,
        evidence_revision: w.evidence_revision,
        evidence,
        assessment,
        asset,
        scope: cmd.scope,
        claimed_minor: cmd.claimed_minor,
        currency: cmd.currency,
        tax_basis: cmd.tax_basis,
      };
      const {
        operation_id: _o,
        schema_version: _s,
        reason,
        expected_case_version: _v,
        assessment_id: _a,
        ...fields
      } = cmd;
      void _o;
      void _s;
      void _v;
      void _a;
      const row = await insert<Claim>(c, "supplier_claims", {
        ...meta(p),
        ...fields,
        company_id: w.company_id,
        site_id: w.site_id,
        customer_id: w.customer_id,
        reference: reference("SCL", cmd.id),
        package: pack,
        package_hash: hash(pack),
      });
      await event(
        c,
        p,
        row,
        "Prepared",
        { package_hash: hash(pack), sc08_receiving: "Unavailable" },
        reason,
      );
      return row;
    },
    "SupplierClaim",
    "WarrantyChanged",
  );
}
export function recoveryCapability(action: string): Capability {
  return ["Credit", "CloseUnrecovered"].includes(action)
    ? "finance.reconcile"
    : "warranty.recovery";
}
export async function recoveryCommand(
  p: Principal,
  id: string,
  input: unknown,
) {
  const r = object(input, [
    ...commonKeys,
    "expected_version",
    "action",
    "data",
  ]);
  const action = choice(r.action, "action", [
    "Submission",
    "Response",
    "ReturnEvidence",
    "Credit",
    "CloseUnrecovered",
  ] as const);
  const d = object(r.data, [
    "reference",
    "source_date",
    "evidence",
    "response",
    "approved_minor",
    "owner_id",
    "due_date",
    "stage",
    "erp_company_key",
    "amount_minor",
    "approval_event_id",
    "reconciliation_state",
  ]);
  const cmd = {
    ...common(r),
    id: uuid(id, "id"),
    expected_version: version(r.expected_version),
    action,
    data: d,
  };
  return sharedOperation(
    p,
    cmd,
    `Warranty:Recovery:${action}`,
    (c) => record<Claim>(c, p, "recovery", id, recoveryCapability(action)),
    async (c, row) => {
      expected(row.version, cmd.expected_version);
      const events = await history(c, p, id),
        w = await record<WarrantyCase>(c, p, "cases", row.case_id);
      const date = dateOnly(d.source_date, "source_date"),
        evidence = text(d.evidence, "evidence"),
        ref = label(d.reference, "reference", 200);
      if (date < w.event_date)
        invalid("source_date", "Evidence cannot precede the reported failure.");
      const detail: Record<string, unknown> = {
          source_date: date,
          evidence,
          reference: ref,
        },
        changes: Record<string, unknown> = {};
      if (action === "Submission") {
        if (row.state !== "Prepared")
          conflict("The claim already has retained submission evidence.");
        changes.state = "Submitted";
        detail.package_hash = row.package_hash;
      } else if (action === "Response") {
        const submitted = events.find((e) => e.action === "Submission"),
          prior = events.filter((e) => e.action === "Response").at(-1);
        if (
          !submitted ||
          date <
            String(
              prior?.content.source_date ?? submitted.content.source_date,
            ) ||
          row.unrecovered_minor !== "0"
        )
          conflict(
            "Keep supplier response dates in order after submission; closed unrecovered decisions require a separate successor review.",
          );
        const response = choice(d.response, "response", supplierStates),
          amount = minorUnits(d.approved_minor, "approved_minor", true),
          owner_id = uuid(d.owner_id, "owner_id");
        supplierApproval(
          response,
          amount,
          Number(row.claimed_minor),
          Number(row.credited_minor),
        );
        await owner(c, p, row, owner_id, "warranty.recovery");
        changes.state = response;
        changes.approved_minor = amount;
        changes.owner_id = owner_id;
        changes.due_date = dateOnly(d.due_date, "due_date");
        Object.assign(detail, {
          response,
          approved_minor: amount,
          owner_id,
          due_date: changes.due_date,
          package_hash: row.package_hash,
        });
      } else if (action === "ReturnEvidence") {
        const stage = choice(d.stage, "stage", [
            "Authorised",
            "Received",
            "Disposed",
            "NotRequired",
          ] as const),
          prior = events.filter((e) => e.action === "ReturnEvidence").at(-1);
        if (
          (!prior && !["Authorised", "NotRequired"].includes(stage)) ||
          (prior &&
            (stage !==
              (
                { Authorised: "Received", Received: "Disposed" } as Record<
                  string,
                  string
                >
              )[String(prior.content.stage)] ||
              date < String(prior.content.source_date)))
        )
          invalid(
            "stage",
            "External return evidence follows Authorised → Received → Disposed, or a retained Not required decision before any movement.",
          );
        Object.assign(detail, {
          stage,
          receiving_state: "SC08Unavailable",
          source_mode: "ExternalEvidenceReference",
          asset_id: w.asset_id,
        });
      } else if (action === "Credit") {
        const approval = events.filter((e) => e.action === "Response").at(-1),
          amount = minorUnits(d.amount_minor, "amount_minor");
        if (
          !approval ||
          approval.id !== uuid(d.approval_event_id, "approval_event_id") ||
          !["Approved", "PartiallyApproved"].includes(
            String(approval.content.response),
          ) ||
          date < String(approval.content.source_date)
        )
          conflict(
            "Link credit evidence against the exact current supplier approval and a source date on or after approval.",
          );
        if (
          Number(row.credited_minor) + amount > Number(row.approved_minor) ||
          Number(row.unrecovered_minor) > 0
        )
          invalid(
            "amount_minor",
            "Credit links must stay within approved recovery and cannot rewrite an unrecovered closure.",
          );
        const cid = randomUUID(),
          erp_company_key = label(d.erp_company_key, "erp_company_key", 200),
          reconciliation_state = choice(
            d.reconciliation_state,
            "reconciliation_state",
            ["EvidenceLinked", "Reconciled"] as const,
          );
        await insert(c, "supplier_credit_evidence", {
          id: cid,
          workspace_id: p.workspace_id,
          company_id: row.company_id,
          claim_id: id,
          approval_event_id: approval!.id,
          erp_company_key,
          credit_reference: ref,
          source_date: date,
          amount_minor: amount,
          evidence,
          reconciliation_state,
          created_by: p.actor_id,
        });
        changes.credited_minor = Number(row.credited_minor) + amount;
        changes.state = "CreditLinked";
        Object.assign(detail, {
          credit_id: cid,
          approval_event_id: approval!.id,
          amount_minor: amount,
          reconciliation_state,
          erp_company_key,
        });
      } else {
        const response = events.filter((e) => e.action === "Response").at(-1);
        if (
          !response ||
          !["Approved", "PartiallyApproved", "Rejected"].includes(
            String(response.content.response),
          ) ||
          Number(row.unrecovered_minor) > 0 ||
          date < String(response.content.source_date)
        )
          conflict(
            "Unrecovered closure needs a final supplier response and a separate Finance disposition.",
          );
        const remaining =
          Number(row.claimed_minor) - Number(row.credited_minor);
        if (remaining <= 0)
          conflict(
            "There is no unresolved claim amount to dispose as unrecovered.",
          );
        changes.unrecovered_minor = remaining;
        changes.state = "UnrecoveredClosed";
        detail.unrecovered_minor = remaining;
      }
      return bump(c, p, "recovery", row, action, detail, cmd.reason, changes);
    },
    "SupplierClaim",
    "WarrantyChanged",
  );
}
