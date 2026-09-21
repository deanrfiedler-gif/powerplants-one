import assert from "node:assert/strict";
import { test } from "node:test";
import {
  decimal,
  mergeDetails,
  observed,
  parsePatch,
  siteToday,
  sourceInput,
} from "../../src/shared/facilities/validation";
import {
  fields,
  mapUrl,
  structures,
  uses,
} from "../../src/shared/facilities/definition";
const invalid = (fn: () => unknown) =>
  assert.throws(
    fn,
    (e: unknown) => (e as { code: string }).code === "InvalidData",
  );
test("CS05-T07–12,T63,T71: closed field grammar, applicability, independent use and exact decimal domains", () => {
  assert.equal(Object.keys(structures).length, 8);
  assert.equal(Object.keys(uses).length, 6);
  for (const input of [
    "0",
    "-1",
    "NaN",
    "Infinity",
    "1e3",
    "1,000",
    "1.001",
    "10000000000",
  ])
    invalid(() =>
      parsePatch({ structure_type: "greenhouse", footprint_m2: input }),
    );
  assert.equal(
    parsePatch({ structure_type: "greenhouse", footprint_m2: "0001.20" })
      .footprint_m2,
    "1.2",
  );
  assert.equal(
    parsePatch({ structure_type: "greenhouse", footprint_m2: "9999999999.99" })
      .footprint_m2,
    "9999999999.99",
  );
  invalid(() => parsePatch({ structure_type: "greenhouse", bay_count: 1.1 }));
  invalid(() => parsePatch({ structure_type: "greenhouse", bay_count: "8" }));
  invalid(() => parsePatch({ structure_type: "greenhouse", details: {} }));
  invalid(() => parsePatch({ structure_type: null }));
  invalid(() => parsePatch({ name: "SYN" }));
  invalid(() => parsePatch({ structure_type: "other", name: "x".repeat(201) }));
  const greenhouse = mergeDetails(
    {
      name: "SYN Glass",
      structure_type: "greenhouse",
      greenhouse_cladding: "glass",
      bay_count: 8,
      detail_notes: "Keep me",
    },
    parsePatch({ structure_type: "open_growing_area" }),
    "2026-09-21",
  );
  assert.deepEqual(greenhouse.clearing.sort(), [
    "bay_count",
    "greenhouse_cladding",
  ]);
  assert.equal(greenhouse.next.detail_notes, "Keep me");
  invalid(() =>
    mergeDetails(
      {},
      parsePatch({ structure_type: "polytunnel", bay_count: 2 }),
      "2026-09-21",
    ),
  );
  const storage = mergeDetails(
    {},
    parsePatch(
      {
        name: "Storage greenhouse",
        structure_type: "greenhouse",
        use: "non_growing",
        context_observed_on: "2026-09-01",
      },
      true,
    ),
    "2026-09-21",
  );
  assert.equal(storage.next.structure_type, "greenhouse");
  assert.equal(storage.next.use, "non_growing");
  invalid(() =>
    mergeDetails({}, parsePatch({ structure_type: "unknown" }), "2026-09-21"),
  );
  invalid(() =>
    mergeDetails({}, parsePatch({ structure_type: "other" }), "2026-09-21"),
  );
  for (const f of Object.values(fields))
    if (f.otherOf) {
      const parent = f.otherOf,
        structure = fields[parent].structure ?? "other";
      invalid(() =>
        mergeDetails(
          {},
          parsePatch({ structure_type: structure, [parent]: "other" }),
          "2026-09-21",
        ),
      );
    }
});
test("CS05-T22,T25,T28,T74: dates use exact calendar days and Site midnight; pin accepts zero and encodes fixed-origin URLs", () => {
  assert.equal(
    siteToday("Australia/Sydney", new Date("2026-09-20T14:05:00Z")),
    "2026-09-21",
  );
  assert.equal(
    siteToday("America/Los_Angeles", new Date("2026-09-20T14:05:00Z")),
    "2026-09-20",
  );
  assert.equal(observed("2024-02-29", "date", "2026-09-21"), "2024-02-29");
  for (const d of ["2026-02-29", "2026-09-22", "2026-09-01T00:00:00Z"])
    invalid(() => observed(d, "date", "2026-09-21"));
  invalid(() => siteToday("not/a_timezone"));
  assert.equal(observed(null, "date", "2026-09-21"), null);
  assert.equal(decimal("-0.0000000", "latitude", 7, -90, 90), "0");
  for (const v of ["90.0000001", "0.00000001", "1e-5", "NaN"])
    invalid(() => decimal(v, "latitude", 7, -90, 90));
  const url = new URL(mapUrl({ latitude: "0", longitude: "0" })!);
  assert.equal(url.origin, "https://www.google.com");
  assert.equal(url.searchParams.get("api"), "1");
  assert.equal(url.searchParams.get("query"), "0,0");
  assert.deepEqual(
    sourceInput(
      {
        kind: "reported_note",
        title: "  SYN source ",
        note: " First\nSecond ",
        source_date: "2024-02-29",
      },
      "source",
    ),
    {
      kind: "reported_note",
      title: "SYN source",
      note: "First\nSecond",
      source_date: "2024-02-29",
    },
  );
  invalid(() =>
    sourceInput(
      { kind: "reported_note", title: "SYN", url: "javascript:bad" },
      "source",
    ),
  );
});
