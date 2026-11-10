import { randomUUID } from "node:crypto";
import type { Principal } from "../platform/identity";
import { sharedOperation } from "../platform/operations";
import { insert } from "../documents/packs";
import { sameVersion } from "../scheduling/validation";
import { unavailable } from "../platform/errors";
import {
  financeAccount,
  financeContext,
  accountCurrent,
  definition,
  hash,
  blocked,
} from "./context";
import {
  projectClaimProject,
  projectClaimSource,
} from "./project-claims-source";
import { projectFinanceCommand } from "./project-claims-validation";
import { bump, event, noPossibleEffect } from "./service";

export async function saveProjectFinance(
  p: Principal,
  id: string | null,
  input: unknown,
) {
  const cmd = projectFinanceCommand(id, input);
  return sharedOperation(
    p,
    cmd,
    id ? "ReviseFinance" : "CreateFinance",
    async (c) => {
      const w = await projectClaimProject(
          c,
          p,
          cmd.project_id,
          "finance.prepare",
        ),
        a = await financeAccount(c, p, cmd.account_id, "finance.prepare");
      if (w.company_id !== a.company_id || w.customer_id !== a.organisation_id)
        throw unavailable();
      // Original-operation replay still requires access to its exact selected evidence.
      await projectClaimSource(
        c,
        p,
        cmd.project_id,
        cmd.basis_id,
        cmd.completion_versions,
        false,
      );
      if (id) {
        const ctx = await financeContext(c, p, id, "finance.prepare");
        if (
          ctx.h.source_kind !== "ProjectClaim" ||
          ctx.h.project_id !== w.id ||
          ctx.h.account_id !== a.id ||
          ctx.h.mode !== cmd.mode
        )
          throw unavailable();
        return ctx;
      }
      return { h: null, w, a };
    },
    async (c, ctx) => {
      let h = ctx.h;
      const retained = new Set<string>();
      if (h) {
        sameVersion(h.version, cmd.expected_version!);
        if (!["Draft", "Returned"].includes(h.status))
          blocked("FinanceStateChanged", "Revise a Draft or Returned claim.");
        await noPossibleEffect(c, p, h);
        for (const row of (
          await c.query(
            "SELECT claim_basis_id,claim_kind,claim_target_id FROM ppo.finance_allocation_holds WHERE workspace_id=$1 AND handoff_id=$2 AND state='Held'",
            [p.workspace_id, h.id],
          )
        ).rows)
          retained.add(
            `${row.claim_basis_id}:${row.claim_kind}:${row.claim_target_id}`,
          );
      }
      await accountCurrent(c, p, ctx.a);
      const d = await definition(c, p);
      if (
        d.id !== cmd.definition_id ||
        d.version !== cmd.definition_version ||
        d.policy_version !== cmd.policy_version
      )
        blocked(
          "FinancePolicyChanged",
          "Use the current Finance definition and policy.",
        );
      const source = await projectClaimSource(
        c,
        p,
        cmd.project_id,
        cmd.basis_id,
        cmd.completion_versions,
      );
      if (source.currency !== ctx.a.currency)
        blocked(
          "ClaimCurrencyMismatch",
          "Claim and account currencies must match exactly.",
        );
      if (
        new Set(source.claims.map((e) => `${e.kind}:${e.target_id}`)).size !==
        source.claims.length
      )
        blocked(
          "DuplicateClaimEntitlement",
          "Select each whole entitlement once.",
        );
      if (!h) {
        h = await insert(c, "finance_handoffs", {
          id: cmd.id,
          workspace_id: p.workspace_id,
          company_id: ctx.w.company_id,
          site_id: ctx.w.site_id,
          work_order_id: null,
          project_id: ctx.w.id,
          source_kind: "ProjectClaim",
          customer_id: ctx.w.customer_id,
          account_id: ctx.a.id,
          mode: cmd.mode,
          currency: ctx.a.currency,
          owner_id: p.actor_id,
          correlation_id: randomUUID(),
          created_by: p.actor_id,
          updated_by: p.actor_id,
        });
        await event(c, p, h, cmd, "Created");
      }
      const snapshot = {
        schema_version: 2,
        synthetic: true,
        source_kind: "ProjectClaim",
        company_id: h.company_id,
        customer_id: h.customer_id,
        account_id: h.account_id,
        currency: h.currency,
        mapping_hash: hash(ctx.a.mapping_snapshot),
        reports: [],
        project_claim: source,
      };
      const r = await insert(c, "finance_revisions", {
        id: randomUUID(),
        workspace_id: p.workspace_id,
        handoff_id: h.id,
        revision: h.revision + 1,
        predecessor_id: h.current_revision_id,
        definition_id: d.id,
        definition_version: d.version,
        policy_version: d.policy_version,
        source_snapshot: snapshot,
        source_hash: hash(snapshot),
        treatment_basis: cmd.treatment_basis,
        remaining_work_basis:
          "Whole evidenced entitlement only; no partial claims or operational tax policy.",
        reason: cmd.reason,
        actor_id: p.actor_id,
        operation_id: cmd.operation_id,
      });
      // Release and transfer happen in one workspace-locked transaction; rollback restores the old holds.
      await c.query(
        "UPDATE ppo.finance_allocation_holds SET state='Released' WHERE workspace_id=$1 AND handoff_id=$2 AND state='Held'",
        [p.workspace_id, h.id],
      );
      for (const e of source.claims) {
        const line = await insert(c, "finance_lines", {
          id: randomUUID(),
          workspace_id: p.workspace_id,
          revision_id: r.id,
          source_kind: "ProjectClaim",
          claim_basis_id: source.basis_id,
          claim_event_version: e.event_version,
          claim_kind: e.kind,
          claim_target_id: e.target_id,
          claim_amount: e.amount,
          claim_currency: source.currency,
          claim_tax_basis: source.tax_basis,
          captured_quantity: "1",
          reviewed_quantity: "1",
          allocated_quantity: "1",
          billable_quantity: "1",
          uom: "CLAIM",
          direction: "Claim",
          disposition: "Billable",
          reason: cmd.treatment_basis,
          target_group: `${e.kind}:${e.target_id}`,
          source_entry_hash: hash(e),
        });
        if (retained.has(`${source.basis_id}:${e.kind}:${e.target_id}`))
          await insert(c, "finance_allocation_holds", {
            workspace_id: p.workspace_id,
            handoff_id: h.id,
            revision_id: r.id,
            line_id: line.id,
            root_entry_id: null,
            claim_basis_id: source.basis_id,
            claim_kind: e.kind,
            claim_target_id: e.target_id,
            quantity: "1",
            state: "Held",
          });
      }
      return bump(c, p, h, cmd, "DraftSaved", {
        status: "Draft",
        revision: r.revision,
        current_revision_id: r.id,
        needs_review: false,
        source_blocker: null,
        active_attempt_id: null,
        processing_owner_id: null,
      });
    },
    "FinancialHandoff",
    "FinanceDraftSaved",
  );
}
