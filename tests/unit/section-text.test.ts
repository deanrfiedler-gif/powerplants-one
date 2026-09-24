import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  formatArrangements,
  formatScope,
  formatEquipment,
  formatHistory,
  formatControls,
  formatSiteControls,
  completionPrefix,
  type SectionScope,
} from "../../src/documents/section-text";
import {
  readArrangements,
  readControls,
  readSection,
  type SectionView,
} from "../../src/documents/section-readers";
import type { PackSnapshot } from "../../src/documents/render";
// The text and hashes predate I6: retained I1 read, ca006fb. Only section_view is added.
const fixture = JSON.parse(
  readFileSync("tests/fixtures/job-pack-read.json", "utf8"),
).items[0];
const revision = fixture.revisions.find(
  (r: { id: string }) => r.id === fixture.current_revision_id,
);
const saved = revision.snapshot as PackSnapshot;
const view = fixture.section_view as SectionView;
const scope = view.scope as SectionScope;

test("D6-A structured scope, equipment and completion reproduce the retained pre-I6 bytes", () => {
  assert.equal(formatScope(scope), saved.sections.scope.text);
  assert.equal(formatEquipment(scope.items), saved.sections.equipment.text);
  const completion = readSection("completion", saved, revision.id, view);
  assert.equal(completion?.kind, "completion");
  if (completion?.kind !== "completion")
    throw Error("Expected verified completion");
  assert.equal(
    completionPrefix(completion.value.items) + completion.value.standing,
    saved.sections.completion.text,
  );
  assert.equal(formatHistory([]), saved.sections.history.text);
  assert.equal(readSection("scope", saved, revision.id, view)?.kind, "scope");
  assert.equal(
    readSection("equipment", saved, revision.id, view)?.kind,
    "equipment",
  );
});
test("D6-A frozen arrangements, controls and site controls round-trip without source reads", () => {
  const a = readArrangements(saved.sections.customer_arrangements.text);
  assert.ok(a);
  assert.equal(a.contact?.name, "SYN Avery Contact");
  assert.equal(
    formatArrangements(a),
    saved.sections.customer_arrangements.text,
  );
  const controls = readControls(saved.sections.readiness.text);
  assert.ok(controls?.length);
  assert.equal(formatControls(controls), saved.sections.readiness.text);
  const site = readSection("site_controls", saved, revision.id, null);
  assert.equal(site?.kind, "site-controls");
  if (site?.kind !== "site-controls")
    throw Error("Expected frozen site controls");
  assert.equal(
    formatSiteControls(
      site.value.access,
      site.value.biosecurity,
      formatControls(site.value.controls),
    ),
    saved.sections.site_controls.text,
  );
});
test("D6-A a denied, mismatched or unverified scope never replaces frozen text", () => {
  for (const section of ["scope", "equipment", "completion"] as const) {
    assert.equal(readSection(section, saved, revision.id, null), null);
    assert.equal(
      readSection(section, saved, revision.id, {
        ...view,
        revision_id: "another-revision",
      }),
      null,
    );
    assert.equal(
      readSection(section, saved, revision.id, {
        ...view,
        scope: { ...scope, verified: false },
      }),
      null,
    );
    const changed = structuredClone(saved);
    changed.sections[section].text += "\nSYN saved amendment";
    if (section !== "completion")
      assert.equal(readSection(section, changed, revision.id, view), null);
  }
  assert.equal(
    readSection("scope", saved, revision.id, {
      ...view,
      scope: { ...scope, verified: true, summary: "A newer live summary" },
    }),
    null,
  );
  const changed = structuredClone(saved);
  changed.sections.completion.text =
    "9. A different requirement\nStanding instructions";
  assert.equal(readSection("completion", changed, revision.id, view), null);
});
test("D6-A ambiguous delimiters and unfamiliar outcomes fall back verbatim", () => {
  const original = saved.sections.customer_arrangements.text;
  assert.equal(
    readArrangements(
      original.replace("\nAccess: ", "\nContact: another contact\nAccess: "),
    ),
    null,
  );
  assert.equal(
    readArrangements(
      original.replace("SYN Avery Contact", "SYN Avery; injected separator"),
    ),
    null,
  );
  assert.equal(
    readControls("A control: InventedPass. reason\nEvidence: source; hash"),
    null,
  );
  assert.equal(
    readControls("A control: Pass. reason\nEvidence: first; ambiguous; hash"),
    null,
  );
  const future = structuredClone(saved);
  future.template.version = 99;
  assert.equal(
    readSection("customer_arrangements", future, revision.id, view),
    null,
  );
});
test("D6-A history requires the original selected IDs, ordering, hash proof and exact text", () => {
  const h = {
    id: "synthetic-history",
    kind: "ReportedSymptom",
    confidence: "Unverified",
    summary: "A reported symptom, not a verified cause.",
    occurred_at: "2026-09-20T00:00:00.000Z",
    matches_snapshot: true,
  };
  const s = structuredClone(saved);
  s.history = [{ id: h.id, hash: "frozen-hash" }];
  s.sections.history.text =
    "ReportedSymptom (Unverified): A reported symptom, not a verified cause.";
  assert.equal(
    readSection("history", s, revision.id, { ...view, history: [h] })?.kind,
    "history",
  );
  for (const changed of [
    { ...h, matches_snapshot: false },
    { ...h, id: "different" },
    { ...h, summary: "A later correction" },
  ])
    assert.equal(
      readSection("history", s, revision.id, { ...view, history: [changed] }),
      null,
    );
});
test("D6-A v1 coercion, null values, multiline prose and comma-joined requirements remain exact", () => {
  const s: SectionScope = {
    revision: 2,
    summary: "First line\nSecond line",
    exclusions: "None",
    diagnostic_limit: null,
    items: [
      {
        sequence: 3,
        task_kind: "Inspection",
        task_description: "Observe",
        completion_requirements: ["One, with a comma", "Two"],
        shutdown_condition: null,
        assets: [],
      },
    ],
  };
  assert.equal(
    formatScope(s),
    "Approved scope r02: First line\nSecond line\nExclusions: None\nDiagnostic limits: Not recorded\n\n3. Inspection: Observe\nCompletion: One, with a comma,Two\nShutdown condition: Not recorded",
  );
  assert.equal(
    formatArrangements({
      location: "SYN site",
      contact: null,
      access: null,
      commitment: "Proposed",
    }),
    "Location: SYN site\nContact: Not recorded\nAccess: Not recorded\nDate agreement: Proposed. This is not pack acknowledgement.",
  );
});
