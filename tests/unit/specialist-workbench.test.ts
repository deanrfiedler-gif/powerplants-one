import assert from "node:assert/strict";
import { test } from "node:test";
import {
  defaultDrawing,
  drawingErrors,
  profileGeometry,
  readDrawing,
  rollFit,
  roofHeight,
  type DrawingModel,
} from "../../src/estimating/specialist/drawing";
import {
  calculate,
} from "../../src/estimating/specialist/engine";
import { initialProposal } from "../../src/estimating/specialist/definition";
import { fixtureProposal } from "../../src/estimating/specialist/fixture-policy";
import {
  clothWorking,
  configurationSignature,
  coverageReconciliation,
  cutSchedule,
  formulaCells,
  headline,
  inputErrors,
  pricedLines,
  readinessGates,
  sheetGeometry,
  untestedOptions,
} from "../../src/estimating/specialist/workbench";
const near = (a: number, b: number, tolerance = 5e-5) =>
  assert.ok(Math.abs(a - b) <= tolerance, `${a} is not within ${tolerance} of ${b}`);
const venlo = (): DrawingModel => defaultDrawing("Venlo");
test("ES08-D01 profile heights equal the design board decision's r10 checks", () => {
  // Decision section 7: Venlo 4.6464 m at 6.4 m span, 3.2 m roofs, 22°.
  near(profileGeometry(venlo(), 6.4).top, 4.6464);
  // Venlo 4.8081 m at 8.0 m span with 4.0 m roofs.
  near(profileGeometry({ ...venlo(), roof_width: "4.0" }, 8).top, 4.8081);
  // Gable ridge 5.2929 m, Arch radius 3.9554 m, Sawtooth high side 5.5957 m.
  near(profileGeometry(defaultDrawing("Gable"), 6.4).top, 5.2929);
  near(profileGeometry(defaultDrawing("Arch"), 6.4).radius ?? 0, 3.9554);
  near(profileGeometry(defaultDrawing("Sawtooth"), 6.4).top, 5.5957);
  // The Venlo screen underside sits a 0.45 m truss below the gutter.
  near(profileGeometry(venlo(), 6.4).underside, 3.55);
  near(profileGeometry(defaultDrawing("Gable"), 6.4).underside, 4);
});
test("ES08-D02 roof curves pass through the gutters and the crown and stay symmetric", () => {
  for (const profile of ["Venlo", "Gable", "Arch", "Gothic"] as const) {
    const m = defaultDrawing(profile),
      g = profileGeometry(m, 6.4);
    near(roofHeight(m, 6.4, g, 0), 0, 1e-9);
    near(roofHeight(m, 6.4, g, 6.4), 0, 1e-9);
    const crown = profile === "Venlo" ? 1.6 : 3.2;
    near(roofHeight(m, 6.4, g, crown), g.rise, 1e-9);
    for (const x of [0.4, 1.1, 2.3]) near(roofHeight(m, 6.4, g, x), roofHeight(m, 6.4, g, 6.4 - x), 1e-9);
  }
  // Arch points lie on the circle through both gutters and the crown.
  const arch = defaultDrawing("Arch"),
    g = profileGeometry(arch, 6.4),
    R = g.radius ?? 0;
  for (const x of [0, 1.6, 3.2, 4.8, 6.4]) {
    const y = roofHeight(arch, 6.4, g, x);
    near(Math.hypot(x - 3.2, y - (g.rise - R)), R, 1e-9);
  }
  // Sawtooth rises in a single slope to the high side.
  const saw = defaultDrawing("Sawtooth"),
    sg = profileGeometry(saw, 6.4);
  near(roofHeight(saw, 6.4, sg, 6.4), sg.rise, 1e-9);
  near(roofHeight(saw, 6.4, sg, 3.2), sg.rise / 2, 1e-9);
});
test("ES08-D03 every drawing rule in the decision withholds the section", () => {
  assert.deepEqual(drawingErrors(venlo(), 6.4, 3.5), {});
  assert.match(drawingErrors({ ...venlo(), roof_width: "4.0" }, 6.4, 3.5).roof_width ?? "", /not a whole number of 4.0 m roofs/);
  const pitch = { ...venlo(), pitch: { ...venlo().pitch, Venlo: "31" } };
  assert.match(drawingErrors(pitch, 6.4, 3.5).pitch ?? "", /18° to 30°/);
  const vent = { ...defaultDrawing("Sawtooth"), vent: "1.6" };
  assert.match(drawingErrors(vent, 6.4, 3.5).vent ?? "", /less than the 1.60 m sawtooth rise/);
  assert.match(drawingErrors(venlo(), 6.4, 3.55).height ?? "", /below the structure underside \(3.55 m, gutter less 0.45 m truss\)/);
  assert.match(drawingErrors(defaultDrawing("Gable"), 6.4, 4).height ?? "", /\(4.00 m\)/);
  assert.match(drawingErrors({ ...venlo(), gutter: "0" }, 6.4, 3.5).gutter ?? "", /greater than 0/);
  assert.match(drawingErrors({ ...venlo(), roll_width: "4.3" }, 6.4, 3.5).roll_width ?? "", /whole millimetres/);
  // A missing span width leaves the quantity engine's report in charge.
  assert.deepEqual(drawingErrors(venlo(), null, 3.5), {});
});
test("ES08-D04 roll fit follows DEC-R2 and never claims procurement readiness", () => {
  assert.equal(rollFit(venlo(), 4.3).status, "not-checked");
  assert.equal(rollFit({ ...venlo(), roll_width: "4300" }, 4.3).status, "fits");
  assert.equal(rollFit({ ...venlo(), roll_width: "4200" }, 4.3).status, "too-narrow");
  assert.equal(rollFit({ ...venlo(), roll_width: "4,2" }, 4.3).status, "invalid");
  assert.equal(rollFit({ ...venlo(), roll_width: "4300" }, null).status, "not-checked");
});
test("ES08-D05 remembered drawing inputs are read back through the model's own shape", () => {
  assert.deepEqual(readDrawing(null, "Gable"), defaultDrawing("Gable"));
  assert.deepEqual(readDrawing("x", "Arch").profile, "Arch");
  const read = readDrawing(
    { profile: "Sawtooth", pitch: { Sawtooth: "12", Venlo: 7 }, gutter: "\u0000", roof_width: "9", vent: "0.5", roll_width: "4300", direction: "Sideways", fabric_reference: "SYN-FAB-01" },
    "Gable",
  );
  assert.equal(read.profile, "Sawtooth");
  assert.equal(read.pitch.Sawtooth, "12");
  assert.equal(read.pitch.Venlo, "22");
  assert.equal(read.gutter, "4.0");
  assert.equal(read.roof_width, "3.2");
  assert.equal(read.vent, "0.5");
  assert.equal(read.roll_width, "4300");
  assert.equal(read.direction, "Not set");
  assert.equal(read.fabric_reference, "SYN-FAB-01");
});
test("ES08-D06 sheet geometry reads the engine's facts, never a second calculation", () => {
  const p = initialProposal(),
    c = calculate(p),
    g = sheetGeometry(c, p)!;
  assert.equal(c.state, "Current");
  assert.deepEqual(
    [g.width, g.length, g.area, g.count, g.cut, g.clothWidth, g.cloth, g.spacing, g.drives, g.spaces, g.perGroupDrives],
    [38.4, 48, 1843, 24, 20, 4.3, 2064, 3.68, 12, 5, 6],
  );
  assert.equal(g.drive0, 0.4);
  assert.equal(g.screenGroups, 2);
  assert.match(configurationSignature(c), /^[0-9A-F]{4}-[0-9A-F]{4}$/);
  const invalid = structuredClone(p);
  invalid.inputs.span.raw = "-";
  const bad = calculate(invalid);
  assert.equal(sheetGeometry(bad, invalid), null);
  assert.equal(configurationSignature(null), "—");
  assert.match(inputErrors(bad).span ?? "", /listed choice or bounded/);
});
test("ES08-D07 the cut schedule and coverage cross-check explain the priced cloth", () => {
  const p = initialProposal(),
    c = calculate(p),
    schedule = cutSchedule(c, p)!,
    g = sheetGeometry(c, p)!;
  assert.equal(schedule.rows[0].qty, 24);
  assert.equal(schedule.rows[0].cloth, 2064);
  assert.equal(schedule.rows[0].detail, "CE-LINE-223 · B01–B12 × groups A, B");
  assert.equal(schedule.rows[1].muted, true);
  assert.equal(schedule.rows[2].qty, 0);
  const cover = coverageReconciliation(g);
  near(cover.area, 1843.2);
  near(cover.lengthFactor, 1.041667, 1e-5);
  near(cover.widthFactor, 1.075, 1e-9);
  near(cover.explained, 2064, 1e-6);
  assert.equal(cover.exact, true);
  const steps = clothWorking(g);
  assert.equal(steps.length, 5);
  assert.equal(steps[4].code, "24 × 20.0 m × 4.3 m = 2,064.0 m²");
  assert.deepEqual(formulaCells("=B223*C77*F77*G77"), ["B223", "C77", "F77", "G77"]);
});
test("ES08-D08 readiness gates state every outcome in words", () => {
  const p = initialProposal(),
    c = calculate(p);
  const gates = readinessGates({ calculation: c, proposal: p, drawing: defaultDrawing(p.inputs.roof.raw), runSequence: null });
  assert.deepEqual(
    gates.map((x) => [x.id, x.status, x.value]),
    [
      ["geometry", "ok", "Valid"],
      ["grid", "ok", "Whole grid"],
      ["cloth", "ok", "Exact lookup"],
      ["roll", "neutral", "Not checked"],
      ["manual", "warn", "0 of 14 reviewed"],
      ["release", "warn", "Review open"],
    ],
  );
  assert.equal(gates[0].detail, "Model resolves · 1,843 m² floor");
  assert.match(gates[5].detail, /Pinion drive/);
  assert.deepEqual(untestedOptions(c, p).map((u) => u.key), ["drive"]);
  // A drawing-only error withholds the drawings and keeps the quantities valid.
  const narrow = { ...defaultDrawing("Venlo"), roof_width: "4.0" as const };
  const withheld = readinessGates({ calculation: c, proposal: p, drawing: narrow, runSequence: 3 });
  assert.equal(withheld[0].value, "Drawing withheld");
  assert.equal(withheld[0].detail, "Quantities valid · 1 drawing input");
  assert.equal(withheld[4].detail, "Basis changed since run R03");
  // A quantity error withholds everything.
  const invalid = structuredClone(p);
  invalid.inputs.bay.raw = "4.2";
  const blocked = readinessGates({ calculation: calculate(invalid), proposal: invalid, drawing: narrow, runSequence: null });
  assert.equal(blocked[0].value, "Withheld");
  assert.equal(blocked[2].value, "No match");
  // The reviewed fixture clears the manual gate.
  const fixture = fixtureProposal(),
    reviewed = readinessGates({ calculation: calculate(fixture), proposal: fixture, drawing: defaultDrawing(), runSequence: null });
  assert.equal(reviewed[4].value, "14 of 14 reviewed");
  assert.equal(readinessGates({ calculation: null, proposal: p, drawing: defaultDrawing(), runSequence: null })[0].value, "Not calculated");
});
test("ES08-D09 headline metrics and priced extensions follow the engine's exact arithmetic", () => {
  const p = fixtureProposal(),
    c = calculate(p),
    lines = pricedLines(c, p),
    cloth = lines.find((l) => l.position.key === "CE-LINE-223")!;
  assert.equal(cloth.extended, "4128");
  assert.equal(cloth.costAud, "1");
  assert.equal(cloth.margin, "50");
  assert.equal(cloth.rateMissing, false);
  assert.ok(lines.every((l) => l.position.row < 383));
  const metrics = headline(c, p);
  assert.equal(metrics.find((m) => m.id === "cloth")?.value, 2064);
  assert.equal(metrics.find((m) => m.id === "lines")?.value, lines.length);
  assert.equal(metrics.find((m) => m.id === "total")?.value, Number(c.commercial.total?.display));
  // EUR costs convert at the quoted rate; a blank rate is unavailable, never zero.
  const eur = structuredClone(p),
    clothRate = eur.illustrative_prices.find((x) => x.key === "CE-LINE-223")!,
    wireRate = eur.illustrative_prices.find((x) => x.key === "CE-LINE-240")!;
  clothRate.price = { ...clothRate.price, cost: "2.00", sell: "4.00", currency: "EUR" };
  wireRate.price = { ...wireRate.price, cost: "" };
  const converted = pricedLines(calculate(eur), eur);
  assert.equal(converted.find((l) => l.position.key === "CE-LINE-223")?.costAud, "3.33");
  assert.equal(converted.find((l) => l.position.key === "CE-LINE-240")?.rateMissing, true);
});
