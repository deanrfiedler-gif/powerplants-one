import type { Principal } from "../../platform/identity";
import { database } from "../../platform/database";
import { sharedOperation } from "../../platform/operations";
import { AppError, unavailable } from "../../platform/errors";
import {
  object,
  common,
  commonKeys,
  uuid,
  version,
  narrative,
} from "../../shared/validation";
import { expected } from "../service";
import {
  optionContext,
  requireActiveOption,
  requireDraftGroup,
  revisionAuthority,
} from "../discovery-workspace-context";
import {
  scopeRecord,
  savedRevision,
  writable,
  hash,
  observeBinding,
  notClosed,
} from "./context";
import { outputBasis } from "./artifacts";
import type { QueryClient } from "../../platform/permissions";
import type { FertigationRecord, ScopeRevision } from "./storage-types";

export async function recordReview(p: Principal, id: string, value: unknown) {
  const r = object(value, [
    ...commonKeys,
    "expected_version",
    "revision_id",
    "note",
  ]);
  const input = {
    ...common(r),
    scope_id: uuid(id, "scope_id"),
    expected_version: version(r.expected_version),
    revision_id: uuid(r.revision_id, "revision_id"),
    note: narrative(r.note, "note", 2000),
  };
  return sharedOperation(
    p,
    input,
    "RecordFertigationReview",
    async (c) => {
      await notClosed(c, p, input.operation_id);
      const scope = await scopeRecord(c, p, id, true);
      const { saved } = await savedRevision(
        c,
        p,
        scope,
        input.revision_id,
        true,
      );
      return { scope, saved };
    },
    async (c, { scope, saved }) => {
      expected(scope.version, input.expected_version);
      if (scope.current_revision_id !== saved.id)
        throw new AppError(
          409,
          "FertigationReviewChanged",
          "Review the current saved revision before recording a new review.",
        );
      const writableContext = await writable(c, p, scope);
      if (
        (await optionContext(c, writableContext.g, scope.option_id))
          .current_revision_id !== saved.source_revision_id
      )
        throw new AppError(
          409,
          "FertigationSourceChanged",
          "The originating Discovery alternative changed. Refresh its source before recording a current review.",
        );
      const current = await observeBinding(
        c,
        p,
        scope.estimating_workspace_id,
        scope.option_id,
        saved.source_revision_id,
        saved.binding,
      );
      if (current.upstream_context_hash !== saved.binding.upstream_context_hash)
        throw new AppError(
          409,
          "FertigationSourceChanged",
          "Review the changed source before recording this review.",
        );
      await c.query(
        "INSERT INTO ppo.fertigation_reviews(id,workspace_id,scope_id,revision_id,content_hash,basis_hash,disposition,note,created_by) VALUES($1,$2,$3,$4,$5,$6,'Reviewed; unresolved',$7,$8)",
        [
          input.operation_id,
          p.workspace_id,
          scope.id,
          saved.id,
          saved.content_hash,
          hash({
            scenario_id: saved.proposal.selected_scenario_id,
            calculation_edition: saved.calculation_edition,
            binding: saved.binding,
          }),
          input.note,
          p.actor_id,
        ],
      );
      return {
        ...scope,
        audit_details: {
          revision_id: saved.id,
          review_id: input.operation_id,
          disposition: "Reviewed; unresolved",
        },
      };
    },
    "FertigationScope",
    "FertigationScopeSaved",
  );
}
type Review = {
  id: string;
  revision_id: string;
  content_hash: string;
  note: string;
  created_by: string;
  created_at: Date;
  disposition: string;
};
async function reviewFor(
  c: QueryClient,
  p: Principal,
  scope: FertigationRecord,
  saved: ScopeRevision,
  reviewId: string,
) {
  const row = (
    await c.query<Review>(
      "SELECT * FROM ppo.fertigation_reviews WHERE workspace_id=$1 AND scope_id=$2 AND id=$3",
      [p.workspace_id, scope.id, uuid(reviewId, "review_id")],
    )
  ).rows[0];
  if (
    !row ||
    row.revision_id !== saved.id ||
    row.content_hash !== saved.content_hash
  )
    throw new AppError(
      409,
      "FertigationReviewRequired",
      "Record a review of this exact saved revision. Technical approval remains unconfigured.",
    );
  return row;
}
export async function prepareHandover(
  p: Principal,
  id: string,
  value: unknown,
) {
  const r = object(value, [
    ...commonKeys,
    "expected_version",
    "revision_id",
    "review_id",
  ]);
  const input = {
    ...common(r),
    scope_id: uuid(id, "scope_id"),
    expected_version: version(r.expected_version),
    revision_id: uuid(r.revision_id, "revision_id"),
    review_id: uuid(r.review_id, "review_id"),
  };
  return sharedOperation(
    p,
    input,
    "PrepareFertigationHandover",
    async (c) => {
      await notClosed(c, p, input.operation_id);
      const scope = await scopeRecord(c, p, id, true);
      const { saved } = await savedRevision(
        c,
        p,
        scope,
        input.revision_id,
        true,
      );
      await reviewFor(c, p, scope, saved, input.review_id);
      return { scope, saved };
    },
    async (c, { scope, saved }) => {
      expected(scope.version, input.expected_version);
      const writableContext = await writable(c, p, scope);
      if (
        (await optionContext(c, writableContext.g, scope.option_id))
          .current_revision_id !== saved.source_revision_id
      )
        throw new AppError(
          409,
          "FertigationSourceChanged",
          "The originating Discovery alternative changed. Refresh before preparing a current handover.",
        );
      if (scope.current_revision_id !== saved.id)
        throw new AppError(
          409,
          "FertigationRevisionChanged",
          "Prepare from the current saved scope. Earlier handovers remain historical.",
        );
      const currentBinding = await observeBinding(
        c,
        p,
        scope.estimating_workspace_id,
        scope.option_id,
        saved.source_revision_id,
        saved.binding,
      );
      if (
        currentBinding.upstream_context_hash !==
        saved.binding.upstream_context_hash
      )
        throw new AppError(
          409,
          "FertigationSourceChanged",
          "Source observations changed after review. Refresh and review before preparing a handover.",
        );
      const snapshot = {
        format: "PPO-FERT-HANDOVER-r01",
        state: "prepared",
        purpose: "manual_scoping_notes",
        technical_status: "unassessed",
        review_id: input.review_id,
        basis: outputBasis(scope, saved),
        production_context: saved.proposal.production_context,
        scenario_id: saved.proposal.selected_scenario_id,
        quantities: {
          represented_area: saved.calculation.area_m2,
          connected_flow: saved.calculation.connected_flow_m3h,
          operating_peak: saved.calculation.operating_peak_m3h,
        },
        candidates: saved.calculation.candidates,
        open_findings: saved.calculation.findings,
        actions: saved.proposal.actions,
        limits: [
          "No technical suitability, supplier approval, quantity-to-SKU mapping or pricing is accepted.",
          "Manual costing retains its own selected Complete source, authority and version checks.",
        ],
      };
      await c.query(
        "INSERT INTO ppo.fertigation_handovers(id,workspace_id,company_id,scope_id,revision_id,estimating_workspace_id,option_id,snapshot,content_hash,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
        [
          input.operation_id,
          p.workspace_id,
          scope.company_id,
          scope.id,
          saved.id,
          scope.estimating_workspace_id,
          scope.option_id,
          snapshot,
          hash(snapshot),
          p.actor_id,
        ],
      );
      return {
        ...scope,
        audit_details: {
          revision_id: saved.id,
          handover_id: input.operation_id,
        },
      };
    },
    "FertigationScope",
    "FertigationScopeSaved",
  );
}
export async function acceptHandover(p: Principal, id: string, value: unknown) {
  const r = object(value, [
    ...commonKeys,
    "expected_version",
    "prepared_id",
    "expected_workspace_version",
    "receiving_revision_id",
  ]);
  const input = {
    ...common(r),
    scope_id: uuid(id, "scope_id"),
    expected_version: version(r.expected_version),
    prepared_id: uuid(r.prepared_id, "prepared_id"),
    expected_workspace_version: version(r.expected_workspace_version),
    receiving_revision_id: uuid(
      r.receiving_revision_id,
      "receiving_revision_id",
    ),
  };
  return sharedOperation(
    p,
    input,
    "AcceptFertigationHandover",
    async (c) => {
      await notClosed(c, p, input.operation_id);
      const scope = await scopeRecord(c, p, id, true);
      const prepared = (
        await c.query<{
          revision_id: string;
          snapshot: { review_id: string };
          content_hash: string;
        }>(
          "SELECT revision_id,snapshot,content_hash FROM ppo.fertigation_handovers WHERE workspace_id=$1 AND scope_id=$2 AND id=$3 AND receiving_revision_id IS NULL",
          [p.workspace_id, id, input.prepared_id],
        )
      ).rows[0];
      if (!prepared || hash(prepared.snapshot) !== prepared.content_hash)
        throw unavailable();
      const exact = await savedRevision(
        c,
        p,
        scope,
        prepared.revision_id,
        true,
      );
      await reviewFor(c, p, scope, exact.saved, prepared.snapshot.review_id);
      return { scope, prepared, ...exact };
    },
    async (c, { scope, prepared, saved, g }) => {
      expected(scope.version, input.expected_version);
      expected(g.version, input.expected_workspace_version);
      await requireDraftGroup(c, p, g);
      const option = await optionContext(c, g, scope.option_id);
      requireActiveOption(option);
      if (
        scope.current_revision_id !== saved.id ||
        scope.state !== "Active" ||
        g.selected_option_id !== option.id ||
        option.current_revision_id !== input.receiving_revision_id
      )
        throw new AppError(
          409,
          "FertigationReceivingChanged",
          "Review the current selected alternative and saved scope before accepting the handover.",
        );
      const receiving = await revisionAuthority(
        c,
        p,
        g,
        input.receiving_revision_id,
        true,
      );
      if (receiving.scope_readiness !== "Complete")
        throw new AppError(
          409,
          "FertigationReceivingIncomplete",
          "The selected Discovery source must be Complete. Draft scoping notes remain available without creating a costing basis.",
        );
      // Only the exact origin can receive this first bounded contract. A changed
      // alternative needs an explicit source refresh, never a silent rebind.
      if (receiving.id !== saved.source_revision_id)
        throw new AppError(
          409,
          "FertigationReceivingSourceChanged",
          "Refresh and review the source before receiving into a successor alternative.",
        );
      const current = await observeBinding(
        c,
        p,
        g.id,
        option.id,
        receiving.id,
        saved.binding,
      );
      if (current.upstream_context_hash !== saved.binding.upstream_context_hash)
        throw new AppError(
          409,
          "FertigationSourceChanged",
          "Source context changed after preparation. Review and prepare again.",
        );
      const snapshot = {
        ...prepared.snapshot,
        state: "accepted_for_manual_scoping_notes",
        prepared_id: input.prepared_id,
        receiving_revision_id: receiving.id,
        adopted_for_costing: false,
      };
      await c.query(
        "INSERT INTO ppo.fertigation_handovers(id,workspace_id,company_id,scope_id,revision_id,estimating_workspace_id,option_id,receiving_revision_id,snapshot,content_hash,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
        [
          input.operation_id,
          p.workspace_id,
          scope.company_id,
          scope.id,
          saved.id,
          g.id,
          option.id,
          receiving.id,
          snapshot,
          hash(snapshot),
          p.actor_id,
        ],
      );
      return {
        ...scope,
        audit_details: {
          revision_id: saved.id,
          handover_id: input.operation_id,
          prepared_id: input.prepared_id,
          receiving_revision_id: receiving.id,
        },
      };
    },
    "FertigationScope",
    "FertigationScopeSaved",
  );
}
export async function readReviewLedger(p: Principal, id: string) {
  const c = database(),
    scope = await scopeRecord(c, p, id);
  const reviews: Review[] = [],
    handovers: Record<string, unknown>[] = [],
    outputs: Record<string, unknown>[] = [];
  // Reauthorise every exact revision BEFORE including it or its counts. Fixed
  // bounded page deliberately exposes no total or unauthorised look-ahead.
  for (const [table, result] of [
    ["fertigation_reviews", reviews],
    ["fertigation_handovers", handovers],
    ["fertigation_outputs", outputs],
  ] as const) {
    const columns =
      table === "fertigation_outputs"
        ? "id,revision_id,audience,template_id,mime_type,content_hash,created_at"
        : "*";
    const rows = (
      await c.query(
        `SELECT ${columns} FROM ppo.${table} WHERE workspace_id=$1 AND scope_id=$2 ORDER BY created_at DESC,id DESC LIMIT 50`,
        [p.workspace_id, id],
      )
    ).rows;
    for (const row of rows) {
      try {
        await savedRevision(c, p, scope, row.revision_id);
        result.push(row);
      } catch (e) {
        if (e instanceof AppError && (e.status === 404 || e.status === 403))
          continue;
        throw e;
      }
    }
  }
  return {
    reviews,
    handovers,
    outputs,
    current_revision_id: scope.current_revision_id,
    engineering_approval: "not_configured",
    supplier_confirmation: "pending",
  };
}
