"use client";
import {
  MaForm,
  f,
  ownerField,
  sourceField,
  agreementFields,
  planFields,
  assessmentFields,
  type MaField,
  type MaOptions,
} from "./maintenance-forms";
import type { MaWorkspace } from "./maintenance-workspace";
import type { Family } from "../maintenance/context";

type Props = {
  family: Family;
  detail: MaWorkspace;
  tab: string;
  options: MaOptions;
  onSaved: () => void;
};
type Form = {
  title: string;
  path?: string;
  fields: MaField[];
  build: (v: Record<string, unknown>) => Record<string, unknown>;
  cap: string;
  initial?: Record<string, unknown>;
};
const pick = (v: Record<string, unknown>, fields: MaField[]) =>
  Object.fromEntries(fields.map((f) => [f.key, v[f.key] ?? null]));
export function MaintenanceActions({
  family,
  detail: d,
  tab,
  options,
  onSaved,
}: Props) {
  const root =
      family === "cases"
        ? "warranty/cases"
        : family === "recovery"
          ? "warranty/supplier-recovery"
          : `maintenance/${family}`,
    path = `${root}/${d.row.id}`;
  const row = d.row as typeof d.row & Record<string, unknown>,
    forms: Form[] = [];
  const add = (
    title: string,
    action: string,
    fields: MaField[],
    cap: string,
    initial?: Record<string, unknown>,
  ) =>
    forms.push({
      title,
      fields,
      cap,
      initial,
      build: (v) =>
        family === "cases" || family === "recovery"
          ? { action, data: pick(v, fields) }
          : { action, ...pick(v, fields) },
    });
  const plan = d.sources.plan as { id: string; assessment_id: string } | null,
    planId = plan?.id ?? "";
  const decision = [
    f("decision", "Decision", "select", { options: ["Approved", "Declined"] }),
    f("authority_reference", "Exact authority reference"),
    f("basis", "Decision basis", "textarea"),
  ];
  const review = [
    ownerField,
    f("due_date", "Next review due", "date"),
    f("next_action", "Next action", "textarea"),
  ];
  if (family === "agreements" && tab === "actions") {
    const revisions = d.sources.revisions as {
      content: Record<string, unknown>;
    }[];
    forms.push({
      title: "Prepare successor agreement revision",
      fields: agreementFields,
      cap: "maintenance.manage",
      initial: revisions?.[0]?.content,
      build: (v) => ({ action: "Revise", content: pick(v, agreementFields) }),
    });
    add(
      "Approve exact agreement terms",
      "Approve",
      [f("authority_reference", "Commercial approval reference")],
      "maintenance.agreement.approve",
    );
    add(
      "Withdraw current agreement terms",
      "Withdraw",
      [f("authority_reference", "Withdrawal authority reference")],
      "maintenance.agreement.approve",
    );
  }
  if (family === "plans" && tab === "actions") {
    const revisions = d.sources.revisions as {
      content: Record<string, unknown>;
    }[];
    forms.push({
      title: "Prepare successor plan",
      fields: planFields,
      cap: "maintenance.manage",
      initial: revisions?.[0]?.content,
      build: (v) => ({ action: "Revise", content: pick(v, planFields) }),
    });
    add(
      "Review exact plan and interval source",
      "Review",
      [],
      "maintenance.assess",
    );
    add("Hold future generation", "Hold", [], "maintenance.manage");
    add(
      "Generate bounded due occurrences",
      "Generate",
      [f("from", "Window begins", "date"), f("until", "Window ends", "date")],
      "maintenance.manage",
    );
  }
  if (family === "due" && tab === "actions") {
    for (const action of ["Defer", "Skip", "Cancel"])
      add(
        `${action} original occurrence`,
        action,
        [
          ...(action === "Defer"
            ? [f("target_date", "Revised target date", "date")]
            : []),
          f("source_reference", "Source / customer-window evidence"),
          ownerField,
        ],
        "maintenance.manage",
      );
  }
  if (
    (family === "due" && tab === "actions") ||
    (family === "cases" && tab === "resolution")
  ) {
    const cap = family === "due" ? "maintenance.manage" : "warranty.manage";
    if (d.actions["service.ticket.edit"])
      forms.push({
        title: "Prepare owned Service request",
        path: `${path}/prepare-work`,
        fields: [
          f("assessment_id", "Exact entitlement assessment", "select", {
            bucket: "assessments",
          }),
          ownerField,
        ],
        cap,
        initial: plan ? { assessment_id: plan.assessment_id } : {},
        build: (v) => ({
          ...pick(v, [f("assessment_id", ""), ownerField]),
          ...(family === "cases" ? { plan_id: planId } : {}),
        }),
      });
    const requests = (d.sources.requests ?? []) as {
      id: string;
      ticket_id: string;
    }[];
    forms.push({
      title: "Receive exact reviewed Service result",
      path: `${path}/receive-result`,
      fields: [
        f("request_id", "Original work request", "select", {
          options: requests.map((x) => ({ id: x.id, label: x.id })),
        }),
        f("report_revision_id", "Exact reviewed Service report revision"),
        f("task_mapping", "Task outcomes", "mapping"),
      ],
      cap: family === "due" ? "maintenance.assess" : "warranty.assess",
      build: (v) => v,
    });
  }
  if (family === "renewals" && tab === "actions") {
    const fields = [
      ownerField,
      f("next_date", "Next action date", "date"),
      f("next_action", "Next action", "textarea"),
    ];
    add(
      "Retain renewal proposal",
      "Proposal",
      [
        f("proposal", "Proposed terms (no agreement extension)", "textarea"),
        ...fields,
      ],
      "maintenance.manage",
    );
    add(
      "Record customer discussion",
      "CustomerReview",
      [
        f("customer_response", "Customer response context", "textarea"),
        ...fields,
      ],
      "maintenance.manage",
    );
    for (const [action, title] of [
      ["FollowUp", "Set owned review follow-up"],
      ["CrmHandoff", "Create CRM relationship Activity"],
      ["ServiceHandoff", "Create Service technical Activity"],
      ["Close", "Close this review with retained next action"],
    ])
      add(title, action, fields, "maintenance.manage");
  }
  if (family === "cases") {
    if (tab === "evidence") {
      add(
        "Add exact evidence reference",
        "AddEvidence",
        [sourceField],
        "warranty.manage",
      );
      add(
        "Retain successor warranty source",
        "ReviseSource",
        [sourceField],
        "warranty.manage",
      );
      add(
        "Review current evidence set",
        "ReviewEvidence",
        [f("basis", "Review basis and unresolved facts", "textarea")],
        "warranty.assess",
      );
      add("Assign next case review", "AssignReview", review, "warranty.manage");
    }
    if (tab === "coverage") {
      forms.push({
        title: "Record coverage and separate cause assessment",
        path: "maintenance/coverage",
        fields: assessmentFields,
        cap: "warranty.assess",
        initial: { event_date: row.event_date },
        build: (v) => ({
          id: crypto.randomUUID(),
          company_id: row.company_id,
          site_id: row.site_id,
          customer_id: row.customer_id,
          asset_id: row.asset_id,
          warranty_case_id: row.id,
          assessment: pick(v, assessmentFields),
        }),
      });
      if (planId) {
        const fields = decision;
        forms.push({
          title: "Decide commercial goodwill for this plan",
          fields,
          cap: "warranty.goodwill",
          build: (v) => ({
            action: "Goodwill",
            data: { ...pick(v, fields), plan_id: planId },
          }),
        });
      }
    }
    if (tab === "resolution") {
      add(
        "Prepare exact resolution plan",
        "Plan",
        [
          f("assessment_id", "Current case assessment", "select", {
            bucket: "assessments",
          }),
          f("remedy", "Proposed remedy", "select", {
            options: ["Investigate", "Repair", "Return", "Replace", "Loan"],
          }),
          f("scope", "Exact remedy scope", "textarea"),
          f(
            "access_review",
            "Access, shutdown and receiving requirements",
            "textarea",
          ),
          f("target_date", "Requested target date", "date"),
          ownerField,
        ],
        "warranty.assess",
      );
      if (planId)
        forms.push({
          title: "Review Service work authority for this plan",
          fields: decision,
          cap: "service.scope.authorise",
          build: (v) => ({
            action: "Authority",
            data: { ...pick(v, decision), plan_id: planId },
          }),
        });
      add(
        "Link reviewed Equipment replacement",
        "ReviewReplacement",
        [
          f(
            "equipment_change_id",
            "Applied canonical Equipment change identity",
          ),
          ownerField,
          f("due_date", "Future-maintenance review due", "date"),
        ],
        "warranty.assess",
      );
    }
    if (tab === "customer") {
      add(
        "Prepare exact customer update",
        "UpdateCustomer",
        [
          f("recipient", "Intended customer recipient"),
          f("content", "Reviewed customer update", "textarea"),
        ],
        "warranty.manage",
      );
      const updates = (d.sources.updates ?? []) as {
        id: string;
        revision: number;
      }[];
      add(
        "Record exact customer response",
        "CustomerResponse",
        [
          f("update_id", "Customer update revision", "select", {
            options: updates.map((x) => ({
              id: x.id,
              label: `Revision ${x.revision} · ${x.id}`,
            })),
          }),
          f("response", "Customer response", "select", {
            options: ["Accepted", "Reservations", "Disagreed", "Unavailable"],
          }),
          f("evidence", "Response evidence", "textarea"),
          ...review.map((x) => ({ ...x, optional: true })),
        ],
        "warranty.manage",
      );
      add(
        "Record customer resolution",
        "ResolveCustomer",
        [f("basis", "Resolution review basis", "textarea")],
        "warranty.assess",
      );
    }
  }
  if (family === "recovery" && tab === "actions") {
    const evidence = [
      f("reference", "Exact external evidence reference"),
      f("source_date", "Source date", "date"),
      f("evidence", "Retained evidence / matching reason", "textarea"),
    ];
    add(
      "Record claim submission evidence",
      "Submission",
      evidence,
      "warranty.recovery",
    );
    add(
      "Record supplier response",
      "Response",
      [
        ...evidence,
        f("response", "Supplier response", "select", {
          options: [
            "Reviewing",
            "MoreInformation",
            "Approved",
            "PartiallyApproved",
            "Rejected",
          ],
        }),
        f(
          "approved_minor",
          "Supplier-approved amount in minor units",
          "number",
        ),
        ownerField,
        f("due_date", "Next recovery review", "date"),
      ],
      "warranty.recovery",
    );
    add(
      "Retain external physical-return evidence",
      "ReturnEvidence",
      [
        ...evidence,
        f("stage", "Evidenced physical-return stage", "select", {
          options: ["Authorised", "Received", "Disposed", "NotRequired"],
        }),
      ],
      "warranty.recovery",
    );
    const approvals = d.history.filter((e) => e.action === "Response");
    add(
      "Link existing Finance credit evidence",
      "Credit",
      [
        ...evidence,
        f("approval_event_id", "Exact supplier approval", "select", {
          options: approvals.map((x) => ({
            id: x.id,
            label: `Version ${x.version} · ${String(x.content.response)}`,
          })),
        }),
        f("erp_company_key", "External ERP company key"),
        f("amount_minor", "Credit amount in minor units", "number"),
        f("reconciliation_state", "Reconciliation evidence", "select", {
          options: ["EvidenceLinked", "Reconciled"],
        }),
      ],
      "finance.reconcile",
    );
    add(
      "Record unrecovered Finance disposition",
      "CloseUnrecovered",
      evidence,
      "finance.reconcile",
    );
  }
  const permitted = forms.filter((form) => d.actions[form.cap]);
  return (
    <>
      {permitted.map((form) => (
        <MaForm
          key={form.title}
          title={form.title}
          path={form.path ?? path}
          fields={form.fields}
          build={form.build}
          initial={form.initial}
          version={row.version}
          versionField={
            form.path === "maintenance/coverage"
              ? "expected_case_version"
              : "expected_version"
          }
          options={options}
          onSaved={onSaved}
        />
      ))}
      {forms.length > 0 && !permitted.length && (
        <p className="ma-notice">
          Read-only. Your current identity has no permitted decision on this
          view.
        </p>
      )}
    </>
  );
}
