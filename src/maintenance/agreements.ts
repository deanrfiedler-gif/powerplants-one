import { randomUUID } from "node:crypto";
import type { Principal } from "../platform/identity";
import { sharedOperation } from "../platform/operations";
import { type QueryClient, type Capability } from "../platform/permissions";
import { companyContext } from "../shared/authority";
import { visible } from "../shared/reads";
import {
  common,
  commonKeys,
  object,
  uuid,
  version,
  invalid,
  choice,
} from "../shared/validation";
import { agreementFields, text, type AgreementContent } from "./model";
import {
  agreementRevision,
  bump,
  contextAuthority,
  event,
  expected,
  hash,
  insert,
  meta,
  owner,
  record,
  reference,
  sourceAccess,
  type Agreement,
} from "./context";

async function contentAuthority(
  c: QueryClient,
  p: Principal,
  company: string,
  customer: string,
  x: AgreementContent,
  cap: Capability,
) {
  for (const s of x.sites) {
    await contextAuthority(c, p, company, s.site_id, customer, cap);
    await companyContext(c, p, company, s.site_id, "maintenance.read");
    await sourceAccess(c, p, company, s.site_id, x.source.access_class);
    await owner(
      c,
      p,
      { company_id: company, site_id: s.site_id },
      x.billing_owner_id,
      "finance.review",
    );
    for (const [kind, ids] of [
      ["Asset", [...s.asset_ids, ...s.excluded_asset_ids]],
      ["Facility", [...s.facility_ids, ...s.excluded_facility_ids]],
    ] as const) {
      for (const id of ids) {
        const row = await visible(c, p, kind, id);
        if (row.company_id !== company || row.site_id !== s.site_id)
          invalid(
            "sites",
            "Every included or excluded item must belong to the stated company and site.",
          );
      }
    }
  }
}
async function saveRevision(
  c: QueryClient,
  p: Principal,
  row: Agreement,
  id: string,
  x: AgreementContent,
  reason: string,
  predecessor: string | null,
) {
  await insert(c, "agreement_revisions", {
    id,
    workspace_id: p.workspace_id,
    company_id: row.company_id,
    agreement_id: row.id,
    revision: row.revision,
    predecessor_id: predecessor,
    content: x,
    content_hash: hash(x),
    created_by: p.actor_id,
    reason,
  });
  for (const s of x.sites) {
    await insert(c, "agreement_scope", {
      workspace_id: p.workspace_id,
      company_id: row.company_id,
      revision_id: id,
      site_id: s.site_id,
      mode: s.mode,
    });
    for (const excluded of [false, true]) {
      for (const asset_id of excluded ? s.excluded_asset_ids : s.asset_ids)
        await insert(c, "agreement_scope_assets", {
          workspace_id: p.workspace_id,
          company_id: row.company_id,
          revision_id: id,
          site_id: s.site_id,
          asset_id,
          excluded,
        });
      for (const facility_id of excluded
        ? s.excluded_facility_ids
        : s.facility_ids)
        await insert(c, "agreement_scope_facilities", {
          workspace_id: p.workspace_id,
          company_id: row.company_id,
          revision_id: id,
          site_id: s.site_id,
          facility_id,
          excluded,
        });
    }
  }
}
export async function createAgreement(p: Principal, input: unknown) {
  const r = object(input, [
    ...commonKeys,
    "id",
    "company_id",
    "customer_id",
    "owner_id",
    "content",
  ]);
  const cmd = {
    ...common(r),
    id: uuid(r.id, "id"),
    company_id: uuid(r.company_id, "company_id"),
    customer_id: uuid(r.customer_id, "customer_id"),
    owner_id: uuid(r.owner_id, "owner_id"),
    content: agreementFields(r.content),
  };
  return sharedOperation(
    p,
    cmd,
    "Maintenance:CreateAgreement",
    async (c) => {
      await contentAuthority(
        c,
        p,
        cmd.company_id,
        cmd.customer_id,
        cmd.content,
        "maintenance.manage",
      );
      for (const s of cmd.content.sites)
        await owner(
          c,
          p,
          { company_id: cmd.company_id, site_id: s.site_id },
          cmd.owner_id,
          "maintenance.manage",
        );
    },
    async (c) => {
      const revision = randomUUID();
      const row = await insert<Agreement>(c, "service_agreements", {
        ...meta(p),
        id: cmd.id,
        company_id: cmd.company_id,
        customer_id: cmd.customer_id,
        owner_id: cmd.owner_id,
        reference: reference("AGR", cmd.id),
        current_revision_id: revision,
      });
      await saveRevision(c, p, row, revision, cmd.content, cmd.reason, null);
      await event(c, p, row, "Created", { revision_id: revision }, cmd.reason);
      return row;
    },
    "ServiceAgreement",
    "MaintenanceChanged",
  );
}
export async function agreementCommand(
  p: Principal,
  id: string,
  input: unknown,
) {
  const r = object(input, [
    ...commonKeys,
    "expected_version",
    "action",
    "content",
    "authority_reference",
  ]);
  const action = choice(r.action, "action", [
    "Revise",
    "Approve",
    "Withdraw",
  ] as const);
  const cmd = {
    ...common(r),
    id: uuid(id, "id"),
    expected_version: version(r.expected_version),
    action,
    content: action === "Revise" ? agreementFields(r.content) : null,
    authority_reference:
      r.authority_reference == null
        ? null
        : text(r.authority_reference, "authority_reference"),
  };
  const cap =
    action === "Revise"
      ? "maintenance.manage"
      : "maintenance.agreement.approve";
  return sharedOperation(
    p,
    cmd,
    `Maintenance:Agreement:${action}`,
    async (c) => {
      const row = await record<Agreement>(c, p, "agreements", id, cap);
      if (cmd.content)
        await contentAuthority(
          c,
          p,
          row.company_id,
          row.customer_id,
          cmd.content,
          cap,
        );
      return row;
    },
    async (c, row) => {
      expected(row.version, cmd.expected_version);
      const current = await agreementRevision(c, p, row.current_revision_id);
      if (action === "Revise") {
        const revision = randomUUID(),
          next = { ...row, revision: row.revision + 1 };
        await saveRevision(
          c,
          p,
          next,
          revision,
          cmd.content!,
          cmd.reason,
          row.current_revision_id,
        );
        return bump(
          c,
          p,
          "agreements",
          row,
          "Revised",
          { revision_id: revision, predecessor_id: row.current_revision_id },
          cmd.reason,
          {
            revision: next.revision,
            current_revision_id: revision,
            state: "Proposed",
          },
        );
      }
      if (!cmd.authority_reference?.trim())
        invalid(
          "authority_reference",
          "Record the exact approval or withdrawal authority evidence.",
        );
      if (
        action === "Approve" &&
        (row.state !== "Proposed" ||
          current.revision.content.source.availability !== "Available")
      )
        invalid(
          "action",
          "Approval requires proposed terms and an available exact source.",
        );
      return bump(
        c,
        p,
        "agreements",
        row,
        action,
        {
          revision_id: row.current_revision_id,
          authority_reference: cmd.authority_reference,
        },
        cmd.reason,
        { state: action === "Approve" ? "Active" : "Withdrawn" },
      );
    },
    "ServiceAgreement",
    "MaintenanceChanged",
  );
}
