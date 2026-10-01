import assert from "node:assert/strict";
import { test } from "node:test";
import {
  retainedCalibration,
  type InstrumentRow,
} from "../../src/inspections/service";
import { assessInstrument } from "../../src/inspections/model";
import {
  boundChecks,
  type Template,
} from "../../src/inspections/service-context";
import { acceptsServiceInspectionEntry } from "../../src/inspections/service-journal";
import {
  readJournal,
  writeJournal,
  type JournalEntry,
} from "../../src/shared/lib/command-journal";
const id = (n: number) =>
  `10000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
test("Service check occurrence identity separates equipment, scope and procedures while retaining a stable version lineage", () => {
  const template: Template = {
    id: id(1),
    procedure_key: "syn-pressure",
    revision: 1,
    title: "Same visible label",
    source_reference: "SYN",
    source_content: "Fictional",
    task_kinds: ["Inspection"],
    retired: false,
    checks: [
      {
        key: "pressure",
        name: "Same visible label",
        check_type: "Numeric",
        required: true,
        numeric: null,
        qualitative: null,
        condition: null,
        evidence_min: 0,
        instrument_required: false,
        scope_key: null,
        witness: "None",
        criterion_source_id: null,
      },
    ],
  };
  const original = boundChecks(template, id(2), id(3))[0];
  assert.notEqual(original.key, boundChecks(template, id(2), id(4))[0].key);
  assert.notEqual(original.key, boundChecks(template, id(4), id(3))[0].key);
  assert.notEqual(
    original.key,
    boundChecks(
      { ...template, procedure_key: "different-test" },
      id(2),
      id(3),
    )[0].key,
  );
  const successor = boundChecks(
    { ...template, id: id(5), revision: 2 },
    id(2),
    id(3),
  )[0];
  assert.equal(original.key, successor.key);
  assert.notEqual(original.criterion_source_id, successor.criterion_source_id);
});
test("Service retained calibration resists renewal, applies retrospective withdrawal and keeps missing authority unknown", () => {
  const old: InstrumentRow = {
    id: id(1),
    reference: "SYN pressure",
    description: "Synthetic only",
    calibration_reference: "SYN certificate",
    calibration_version: "1",
    valid_from: "2026-01-01",
    valid_to: "2026-09-01",
    withdrawn_effective_from: null,
    withdrawn_reason: null,
    withdrawn_recorded_at: null,
  };
  const renewed = { ...old, calibration_version: "2", valid_to: "2027-09-01" };
  assert.equal(
    assessInstrument(retainedCalibration(old, renewed), "2026-10-01")
      .assessment,
    "InvalidAtUse",
  );
  assert.equal(
    assessInstrument(
      retainedCalibration(old, {
        ...renewed,
        withdrawn_effective_from: "2026-07-01",
        withdrawn_reason: "SYN reference failed",
      }),
      "2026-08-01",
    ).assessment,
    "WithdrawnForUse",
  );
  assert.equal(
    assessInstrument(retainedCalibration(old, null), "2026-08-01").assessment,
    "Unknown",
  );
  assert.equal(
    assessInstrument(retainedCalibration(old, renewed), "2026-08-01")
      .assessment,
    "ValidAtUse",
  );
});
test("Service evidence recovery is bounded, exact, quota-safe and isolated without enlarging other journals", () => {
  const values = new Map<string, string>(),
    storage = {
      getItem: (k: string) => values.get(k) ?? null,
      setItem: (k: string, v: string) => {
        values.set(k, v);
      },
      removeItem: (k: string) => {
        values.delete(k);
      },
    };
  const scope = { actor_id: id(1), workspace_id: id(2) },
    e: JournalEntry = {
      version: 1,
      scope,
      phase: "pending",
      record_id: id(3),
      path: `my-jobs/${id(3)}/inspections`,
      target: `/my-jobs/inspections?appointment_id=${id(3)}`,
      label: "SYN original",
      body: {
        operation_id: id(4),
        schema_version: 1,
        action: "evidence",
        evidence: { content_base64: "a".repeat(40000) },
      },
    };
  assert.throws(
    () => writeJournal(storage, "key", e, acceptsServiceInspectionEntry),
    /bounds/,
  );
  const saved = writeJournal(
    storage,
    "key",
    e,
    acceptsServiceInspectionEntry,
    6_000_000,
  );
  assert.deepEqual(
    readJournal(
      storage,
      "key",
      scope,
      acceptsServiceInspectionEntry,
      6_000_000,
    ),
    saved,
  );
  assert(!acceptsServiceInspectionEntry({ ...e, record_id: id(5) }));
  assert(
    !acceptsServiceInspectionEntry({
      ...e,
      body: { ...e.body, token: "synthetic invalid field" },
    }),
  );
  assert.throws(
    () =>
      writeJournal(
        storage,
        "key",
        { ...e, body: { ...e.body, operation_id: id(5) } },
        acceptsServiceInspectionEntry,
        6_000_000,
      ),
    /original/,
  );
  assert.equal(
    readJournal(
      storage,
      "key",
      { ...scope, actor_id: id(9) },
      acceptsServiceInspectionEntry,
      6_000_000,
    ),
    null,
  );
  assert.throws(
    () =>
      writeJournal(
        {
          ...storage,
          setItem: () => {
            throw Error("quota");
          },
        },
        "key",
        e,
        acceptsServiceInspectionEntry,
        6_000_000,
      ),
    /quota/,
  );
});
