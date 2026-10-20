import type { Page } from "@playwright/test";
import { discoveryInput } from "./estimating-discovery";
import { compileDiscovery } from "../../src/estimating/discovery";
import { compareSavedDiscovery } from "../../src/estimating/discovery-comparison";
import { calculate, type CostLine } from "../../src/estimating/math";

// Synthetic API-boundary fixture for the real ES-02 route. No database writes.
export const costingId = (n: number) =>
  `e5020000-0000-4000-8000-${String(n).padStart(12, "0")}`;
export const costingPath = `/estimating/discovery/${costingId(1)}/costing`;
export function costingFixture() {
  const input = discoveryInput();
  input.answers[0].value =
    "Supply six motors and 3,600 m² of screen cloth in Block B; add a rain sensor.";
  const old = structuredClone(input);
  old.answers[0].value =
    "Supply four motors and 2,400 m² of screen cloth in Block B.";
  const revision = (
    version: number,
    input: ReturnType<typeof discoveryInput>,
  ) => ({
    id: costingId(10 + version),
    option_id: costingId(2),
    version,
    kind: "Discovery" as const,
    input,
    scope_readiness: "Complete",
    scope_snapshot_id: costingId(20 + version),
    answer_snapshot_id: costingId(30 + version),
    content_hash: "a".repeat(64),
    context_hash: "b".repeat(64),
    created_at: "2026-10-06T00:00:00Z",
    observed_context: {
      site: { display_name: "SYN Block B" },
      facilities: [],
      equipment: [],
    },
  });
  const current = revision(2, input),
    baseline = revision(1, old);
  const lines: CostLine[] = [
    [
      "Shade screen motor and gearbox",
      "Product",
      "4",
      "each",
      "1850.00",
      "2450.00",
    ],
    ["Screen cloth, aluminised 55%", "Product", "2400", "m²", "4.20", "5.60"],
    ["Installation", "Labour", "48", "hours", "72.00", "105.00"],
    ["Commissioning", "Labour", "12", "hours", "95.00", "140.00"],
    ["Freight to Block B", "Freight", "1", "lot", "900.00", "1250.00"],
  ].map((row, i) => ({
    id: costingId(40 + i),
    description: row[0],
    category: row[1] as CostLine["category"],
    quantity: row[2],
    unit: row[3],
    unit_cost: row[4],
    unit_sell: row[5],
    source: i < 2 ? "SYN supplier quote SQ-108" : "SYN estimator cost basis",
    effective_date: "2026-10-02",
    allowance: i === 4,
  }));
  const totals = calculate(lines);
  const basis = {
    revision_id: baseline.id,
    revision: 1,
    option_id: costingId(2),
    scope_snapshot_id: baseline.scope_snapshot_id,
    answer_snapshot_id: baseline.answer_snapshot_id,
  };
  const saved = {
    id: costingId(5),
    estimate_id: costingId(4),
    version: 2,
    title: "Shade screen replacement, Block B",
    scope: {
      included: "Supply and install the recorded screen scope.",
      excluded:
        "Controller program changes, gutter repairs and additional electrical work.",
      assumptions: "Power available at each gable.",
    },
    lines,
    cost_schema_version: 2,
    cost_total: totals.cost,
    sell_total: totals.sell,
    discovery_basis: basis,
    source_bindings: [
      {
        line_id: lines[0].id,
        source_id: costingId(60),
        source_revision_id: costingId(61),
        review_event_id: costingId(62),
        pricing_date: "2026-10-02",
        tier_minimum_quantity: "1",
        unit_cost: "1850.00",
      },
    ],
  };
  const detail = {
    workspace: {
      id: costingId(1),
      version: 2,
      selected_option_id: costingId(2),
    },
    can_edit: true,
    context: {
      title: "Shade screen replacement, Block B",
      display_number: "SYN-PPO-OPP-000334",
      owner: "SYN Estimator",
    },
    options: [
      {
        option: { id: costingId(2), label: "B", state: "Active" },
        revision: current,
        evaluation: compileDiscovery(input),
        history_count: 2,
        cost: { status: "Available", version: 2, amount: totals.sell, basis },
      },
    ],
  };
  const summary = {
    status: "Available",
    ...saved,
    estimate_version_id: saved.id,
    basis: basis as typeof basis | null,
    basis_kind: "Discovery",
  };
  const preview = {
    workspace_id: costingId(1),
    option_id: costingId(2),
    option_label: "B",
    revision_id: current.id,
    revision: 2,
    scope_snapshot_id: current.scope_snapshot_id,
    answer_snapshot_id: current.answer_snapshot_id,
    content_hash: current.content_hash,
    context_hash: current.context_hash,
    expected_workspace_version: 2,
    expected_estimate_version: 2,
    estimate_id: costingId(4),
    selected_scope: compileDiscovery(input),
    recorded_context: current.observed_context,
    current_saved: saved,
    fertigation_handovers: [],
    synthetic: true,
  };
  return {
    detail,
    summary,
    preview,
    baseline,
    current,
    adoptions: [] as Record<string, unknown>[],
    mode: "normal" as
      "normal" | "pending" | "uncertain" | "denied" | "loading" | "error",
    revoked: false,
    release: null as (() => void) | null,
  };
}
export async function mountCosting(page: Page, fixture = costingFixture()) {
  // Public proof contains only local fallback glyphs; never capture kit artwork.
  await page.route(/https:\/\/(kit|ka-p|kit-pro|pro)\./, (route) =>
    route.abort(),
  );
  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url()),
      path = url.pathname.replace("/api/v1/", "");
    const reply = (body: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    if (path === "local-session")
      return reply({
        actor_id: costingId(90),
        workspace_id: costingId(91),
        display_name: "SYN Estimator",
      });
    if (path === "shell/context")
      return reply({
        display_name: "SYN Estimator",
        actions: [],
        navigation: [
          "estimates",
          "intake",
          "wizard",
          "pricing",
          "quotations",
          "configurations",
        ],
        can_preview: false,
        companies: [],
        conversations: false,
      });
    if (path === `estimating/workspaces/${costingId(1)}`) {
      if (fixture.mode === "loading")
        await new Promise<void>((resolve) => {
          fixture.release = resolve;
        });
      if (fixture.revoked)
        return reply({ code: "Forbidden", message: "Access denied" }, 403);
      return reply(fixture.detail);
    }
    if (path.endsWith("/summary")) return reply(fixture.summary);
    if (path.endsWith("/revisions")) return reply(fixture.baseline);
    if (path.endsWith("/costing/preview")) {
      if (fixture.mode === "error")
        return reply(
          { code: "Unavailable", message: "Saved source could not be loaded." },
          503,
        );
      return reply(fixture.preview);
    }
    if (path.endsWith("/compare"))
      return reply({
        differences: compareSavedDiscovery(fixture.baseline, fixture.current),
      });
    if (path.endsWith("/costing")) {
      fixture.adoptions.push(route.request().postDataJSON());
      if (fixture.mode === "pending")
        await new Promise<void>((resolve) => {
          fixture.release = resolve;
        });
      if (fixture.mode === "uncertain") return route.abort("failed");
      if (fixture.mode === "denied")
        return reply(
          { code: "Forbidden", message: "Adoption no longer permitted" },
          403,
        );
      return reply({
        record_id: costingId(4),
        operation_id: fixture.adoptions.at(-1)?.operation_id,
      });
    }
    if (path.startsWith("operations/"))
      return reply({
        operation_id: fixture.adoptions.at(-1)?.operation_id,
        record_id: costingId(4),
      });
    return reply({ items: [] });
  });
  await page.goto(costingPath);
  return fixture;
}

export function incompleteCostingFixture() {
  const fixture = costingFixture();
  fixture.current.input.answers[0] = {
    question_id: "Q01",
    state: "Deferred",
    value: null,
    source: null,
    follow_up: {
      owner_id: costingId(90),
      reason: "SYN confirm the included work before costing",
    },
  };
  fixture.detail.options[0].evaluation = compileDiscovery(
    fixture.current.input,
  );
  fixture.current.scope_readiness =
    fixture.detail.options[0].evaluation.scope_readiness;
  return fixture;
}
