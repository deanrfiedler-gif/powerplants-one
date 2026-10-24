import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { claudeModels } from "../src/assistant/claude-models";
import { evaluationHash } from "../src/assistant/evaluation";
import { evidenceFields } from "../src/assistant/evidence";
import type { SourceType } from "../src/assistant/model";
export type Catalogue = typeof import("../tests/fixtures/assistant/t2e-cases.json");
export type Case = Catalogue["cases"][number];
export const caseIds = [...Array.from({ length: 3 }, (_, n) => `C0${n + 1}`), ...Array.from({ length: 12 }, (_, n) => `L${String(n + 1).padStart(2, "0")}`)];
export function readCatalogue(root = process.cwd()): Catalogue {
  return JSON.parse(readFileSync(resolve(root, "tests/fixtures/assistant/t2e-cases.json"), "utf8"));
}
const aliases: Record<string, SourceType> = { deal: "Opportunity", organisation: "Organisation", A0: "Activity", A1: "Activity", A2: "Activity", A3: "Activity", project: "Project", task1: "ProjectTask", task2: "ProjectTask" };
export function parentRequirements(requirements: string[], root: string) {
  const spec = readFileSync(resolve(root, "docs/blueprints/ppo-assistant-specification.md"), "utf8");
  // Proposed derived mapping, rationale and sources: T2e plan § Derived T2/W parent mappings.
  const t2: Record<string, string[]> = {
    "T2-2": ["NFR-01"], "T2-3": ["NFR-01"], "T2-4": ["CRM-06", "NFR-01", "NFR-03"],
    "T2-5": ["CRM-06", "NFR-02"], "T2-6": ["NFR-11", "NFR-12"], "T2-7": ["NFR-05"],
    "T2-10": ["NFR-03"], "T2-12": ["NFR-01"], W3: ["PRJ-02"], W4: ["CRM-06"], W5: ["NFR-12"], W6: ["NFR-05"],
  };
  const plan = readFileSync(resolve(root, "docs/decisions/conversations-t2e-evaluation.md"), "utf8");
  for (const [rule, parents] of Object.entries(t2)) assert.ok(plan.includes(`| ${rule} | ${parents.join("; ")} |`), `Missing proposed mapping source ${rule}`);
  return [...new Set(requirements.flatMap(r => {
    if (r.startsWith("AIA-")) {
      const line = spec.split(/\r?\n/).find(l => l.startsWith(`| ${r} |`));
      assert.ok(line, `Unknown acceptance reference ${r}`);
      return line.split("|").at(-2)!.match(/(?:CRM|NFR|PM)-\d+/g) ?? [];
    }
    assert.ok(t2[r], `Unsupported traceability ${r}`);
    return t2[r];
  }))].sort();
}
export function expandCatalogue(c: Catalogue) {
  return c.cases.flatMap(k => c.models.flatMap(model => Array.from({ length: c.repetitions[k.stage as keyof typeof c.repetitions] }, (_, n) => ({
    case_id: k.id, stage: k.stage as "Calibration" | "Evaluation", model: model as typeof claudeModels[number], repetition: n + 1,
  }))));
}
export function validateCatalogue(value: unknown, root = process.cwd()): Catalogue {
  const c = value as Catalogue;
  const exact = (v: object, keys: string[]) => assert.deepEqual(Object.keys(v).sort(), keys.sort(), "Unexpected catalogue fields");
  exact(c, ["schema_version", "fixture_set", "status", "preparation", "record_sets", "cases", "models", "repetitions", "sentinel_placements", "offline_proofs"]);
  exact(c.record_sets, ["deal", "organisation", "activities", "project", "sentinels", "history_padding"]);
  assert.equal(c.schema_version, 2); assert.equal(c.fixture_set, "T2E-SYN-01");
  assert.deepEqual(c.models, [...claudeModels]); assert.deepEqual(c.repetitions, { Calibration: 1, Evaluation: 3 });
  assert.deepEqual(c.cases.map(x => x.id), caseIds);
  exact(c.record_sets.deal, ["title", "stage_id", "close_outcome", "need_summary", "qualification_note", "expected_close_date"]);
  exact(c.record_sets.organisation, ["display_name", "relationship_status", "sector"]);
  exact(c.record_sets.project, ["title", "tasks"]);
  assert.equal(c.record_sets.deal.stage_id, "Discovery", "Supported canonical initial stage");
  assert.equal(c.record_sets.deal.close_outcome, "Open"); assert.equal(c.record_sets.deal.expected_close_date, null);
  const text = (v: unknown, max: number) => assert.ok(typeof v === "string" && v.trim().length > 0 && v.length <= max);
  text(c.record_sets.deal.title, 200); text(c.record_sets.deal.need_summary, 2000); text(c.record_sets.deal.qualification_note, 2000);
  text(c.record_sets.organisation.display_name, 100); text(c.record_sets.organisation.sector, 200); text(c.record_sets.project.title, 200);
  for (const a of c.record_sets.activities) {
    exact(a, ["alias", "kind", "summary", "status", "due_at", "due_needed"]);
    assert.ok(["CustomerContact", "RelationshipReview"].includes(a.kind)); assert.equal(a.status, "Open");
    text(a.summary, 2000); assert.equal(a.due_needed, a.due_at === null);
    if (a.due_at !== null) assert.ok(Number.isFinite(Date.parse(a.due_at)) && a.due_at.endsWith("Z"));
  }
  assert.equal(c.record_sets.project.tasks.length, 2);
  for (const t of c.record_sets.project.tasks) {
    exact(t, ["title", "phase", "status", "progress", "milestone", "start_date", "finish_date"]);
    text(t.title, 200); assert.equal(t.phase, "Procurement"); assert.ok(["Complete", "Planned"].includes(t.status));
    assert.equal(t.progress, t.status === "Complete" ? 100 : 0); assert.equal(typeof t.milestone, "boolean");
    for (const date of [t.start_date, t.finish_date]) assert.ok(date === null || /^\d{4}-\d{2}-\d{2}$/.test(date));
  }
  assert.equal(c.record_sets.organisation.relationship_status, "Active", "Canonical organisation enum");
  assert.deepEqual(c.record_sets.activities.map(a => a.alias), ["A0", "A1", "A2", "A3"]);
  assert.deepEqual(c.record_sets.history_padding, { count: 20, text: "SYN historical padding. ", repeat_each: 140 });
  const blueprint = readFileSync(resolve(root, "docs/blueprints/BP-01-master-blueprint.md"), "utf8");
  const scope = readFileSync(resolve(root, "docs/decisions/conversations-t2-scope.md"), "utf8");
  for (const k of c.cases) {
    exact(k, ["id", "stage", "requirements", "setup", "question", "expected", "recipe", "parent_requirements", "gold"]);
    exact(k.recipe, ["anchor", "activities", "history", "siblings", "additional_activities", "participant", "human_ask", "sentinels", "hidden_project_activity", "unicode"]);
    assert.ok(k.requirements.length > 0);
    assert.equal(k.stage, k.id.startsWith("C") ? "Calibration" : "Evaluation");
    assert.ok(k.question.length > 0 && k.question.length < 3500 && k.expected.length);
    assert.equal(new Set(k.requirements).size, k.requirements.length);
    for (const r of k.requirements.filter(r => !r.startsWith("AIA-"))) assert.ok(scope.includes(r), `Missing scope reference ${r}`);
    assert.deepEqual(k.parent_requirements, parentRequirements(k.requirements, root), `${k.id} parent mapping`);
    for (const r of k.parent_requirements) assert.ok(blueprint.includes(`| ${r} |`), `Not a parent ${r}`);
    assert.deepEqual(k.gold.map(g => g.claim), k.expected, `${k.id} expected/gold mismatch`);
    for (const g of k.gold) {
      exact(g, ["claim", "support", "assessment"]);
      assert.ok(["human-entailment", "human-boundary-rubric", "persisted-ask"].includes(g.assessment));
      assert.equal(g.assessment === "human-entailment", g.support.length > 0);
      for (const s of g.support) {
        exact(s, ["alias", "field", "equals"]);
        assert.ok(aliases[s.alias] && evidenceFields[aliases[s.alias]].includes(s.field), `Unsupported gold field ${s.alias}.${s.field}`);
        assert.ok(!s.alias.startsWith("A") || (k.recipe.activities as string[]).includes(s.alias), "Gold Activity absent from recipe");
        const taskDates = c.record_sets.project.tasks.map(t => t.finish_date);
        const definitions: Record<string, Record<string, unknown>> = {
          deal: { ...c.record_sets.deal, need_summary: c.record_sets.deal.need_summary + (k.recipe.unicode ? " SYN café — 温室 🌱" : "") },
          organisation: { relationship_status: c.record_sets.organisation.relationship_status, sector: c.record_sets.organisation.sector }, project: { title: c.record_sets.project.title,
            task_count: c.record_sets.project.tasks.length, completed_tasks: c.record_sets.project.tasks.filter(t => t.status === "Complete").length,
            forecast_finish: c.record_sets.project.tasks.some(t => t.start_date === null || t.finish_date === null) ? null : [...taskDates].sort().at(-1) },
          task1: c.record_sets.project.tasks[0], task2: c.record_sets.project.tasks[1],
          ...Object.fromEntries(c.record_sets.activities.map(a => [a.alias, { ...a, due_at: a.due_at === null ? null : new Date(a.due_at).toISOString() }])),
        };
        assert.ok(Object.hasOwn(definitions[s.alias], s.field), "Gold field has no catalogue definition");
        assert.deepEqual(s.equals, definitions[s.alias][s.field], `${k.id} gold contradicts declared canonical source`);
        assert.ok(!(s.alias === "project" || s.alias.startsWith("task")) || k.recipe.anchor === "Project");
      }
    }
    const activityRecipes: Record<string, string[]> = { C02: ["A1", "A2"], L01: ["A1"], L02: [], L03: ["A1", "A2"], L04: ["A2", "A3"], L05: ["A1"], L07: ["A1"], L09: ["A1"], L10: ["A1"] };
    assert.deepEqual(k.recipe.activities, activityRecipes[k.id] ?? ["A0"]);
    assert.equal(k.recipe.anchor, k.id === "L02" ? "Project" : "Opportunity");
    assert.equal(k.recipe.history, k.id === "C03" ? "padding" : k.id === "L12" ? "omitted-history-padding" : k.id === "L08" ? "hostile" : "none");
    assert.equal(k.recipe.siblings, k.id === "L06" ? 11 : 0);
    assert.equal(k.recipe.additional_activities, k.id === "L06" ? 9 : 0);
    for (const [key, ids] of Object.entries({ participant: ["L05", "L10"], human_ask: ["L05"], sentinels: ["L09"], hidden_project_activity: ["L10"], unicode: ["C02"] }))
      assert.equal(k.recipe[key as keyof typeof k.recipe], ids.includes(k.id));
  }
  assert.deepEqual(c.sentinel_placements, [
    { key: "excluded_email", type: "Person", field: "email" },
    { key: "excluded_finance", type: "Activity", field: "summary", access_class: "RestrictedFinance" },
    { key: "excluded_erp", type: "ERPMapping", field: "customer_id" },
    { key: "restricted_activity", type: "Activity", field: "summary", exclusion: "participant-project-access" },
  ]);
  for (const s of c.sentinel_placements) {
    const allowed = evidenceFields[s.type as SourceType]?.includes(s.field) ?? false;
    assert.ok(!allowed || s.access_class === "RestrictedFinance" || s.exclusion === "participant-project-access", "Sentinel in provider field");
    const sentinel = c.record_sets.sentinels[s.key as keyof typeof c.record_sets.sentinels];
    assert.ok(sentinel.startsWith("SYN-") && c.sentinel_placements.filter(x => x.key === s.key).length === 1);
    // No value can be placed in a gold/source/question/history field by the catalogue.
    assert.ok(!JSON.stringify({ cases: c.cases, records: { ...c.record_sets, sentinels: undefined } }).includes(sentinel));
  }
  assert.deepEqual(c.offline_proofs.map(o => o.id), Array.from({ length: 10 }, (_, n) => `O${String(n + 1).padStart(2, "0")}`));
  for (const o of c.offline_proofs) for (const f of o.test_files) assert.ok(/^tests\/(unit|database)\/assistant[^/]*\.test\.ts$/.test(f) && existsSync(resolve(root, f)));
  const members = expandCatalogue(c);
  assert.equal(members.length, 117); assert.equal(members.filter(m => m.stage === "Calibration").length, 9);
  assert.equal(new Set(members.map(memberKey)).size, 117);
  return c;
}
export const memberKey = (m: ReturnType<typeof expandCatalogue>[number]) => `${m.case_id}:${m.model}:${m.repetition}`;
export const catalogueHash = (c: Catalogue) => evaluationHash(c);
