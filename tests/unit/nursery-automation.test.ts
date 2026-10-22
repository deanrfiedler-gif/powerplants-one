import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import {
  blankFact,
  blankStudy,
  blankScenario,
  findings,
} from "../../src/estimating/nursery-automation/model";
import {
  parseStudy,
  parseFact,
} from "../../src/estimating/nursery-automation/validation";
import { catalogue } from "../../src/estimating/nursery-automation/catalogue";
test("N1 unknown is retained; zero is explicit sourced data, not a default", () => {
  assert.equal(parseFact(blankFact(), "stops", "minutes").value, null);
  const zero = {
    ...blankFact(),
    knowledge: "CustomerAdvised",
    value: "0",
    source: "SYN customer questionnaire",
  };
  assert.equal(parseFact(zero, "stops", "minutes").value, "0");
  assert.throws(() => parseFact({ ...zero, source: null }, "stops", "minutes"));
  assert.throws(() => parseFact({ ...zero, value: "1e3" }, "stops", "minutes"));
  assert.throws(() =>
    parseFact({ ...zero, value: "100000.001" }, "stops", "minutes"),
  );
  assert.equal(
    parseFact({ ...zero, value: "100000" }, "stops", "minutes").value,
    "100000",
  );
});
test("N1 conflicting source values stay explicit and cannot become a selected value", () => {
  const conflict = {
    ...blankFact(),
    knowledge: "Conflict",
    alternatives: [
      { value: "55", source: "SYN source A" },
      { value: "60", source: "SYN source B" },
    ],
    owner: "SYN estimator",
    next_action: "Request trial",
  };
  assert.deepEqual(parseFact(conflict, "diameter", "mm"), conflict);
  assert.throws(() =>
    parseFact({ ...conflict, value: "55" }, "diameter", "mm"),
  );
  assert.throws(() =>
    parseFact(
      { ...conflict, alternatives: [conflict.alternatives[0]] },
      "diameter",
      "mm",
    ),
  );
  assert.throws(() =>
    parseFact(
      {
        ...conflict,
        alternatives: [conflict.alternatives[0], conflict.alternatives[0]],
      },
      "diameter",
      "mm",
    ),
  );
});
test("N1 scenario IDs and future phases survive reorder; no money, rating or invented Product mapping accepted", () => {
  const study = blankStudy();
  study.scenarios = [blankScenario(randomUUID()), blankScenario(randomUUID())];
  study.scenarios[1].phase = "Future";
  assert.deepEqual(parseStudy(study), study);
  study.scenarios.reverse();
  assert.deepEqual(parseStudy(study).scenarios, study.scenarios);
  assert.throws(() => parseStudy({ ...study, price: "100" }));
  assert.throws(() =>
    parseStudy({ ...study, product_variant_id: randomUUID() }),
  );
  assert.throws(() =>
    parseStudy({
      ...study,
      scenarios: [study.scenarios[0], study.scenarios[0]],
    }),
  );
  assert.throws(() =>
    parseStudy({
      ...study,
      scenarios: Array.from({ length: 21 }, () => blankScenario(randomUUID())),
    }),
  );
  assert.throws(() =>
    parseStudy({ ...study, candidate_ids: ["invented-equipment"] }),
  );
});
test("N1 scope dimensions stay independent; complete capture never claims technical/CPQ readiness", () => {
  const study = blankStudy();
  study.delivery[1] = {
    ...study.delivery[1],
    applicability: "Applicable",
    selection: "Base",
    responsibility: "Supplier",
    basis: "SYN supplier coverage",
  };
  const parsed = parseStudy(study);
  assert.equal(parsed.delivery[1].responsibility, "Supplier");
  assert.equal(parsed.delivery[1].selection, "Base");
  assert.ok(findings(study).some((f) => f.key === "scenarios"));
  assert.equal("ready" in parsed, false);
  assert.equal("labour_hours" in parsed, false);
  for (const e of catalogue.entries) {
    assert.equal(e.approved_limits, null);
    assert.equal(e.product_variant, null);
    assert.equal(e.review, "Pending");
  }
});
