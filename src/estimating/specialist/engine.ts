import {
  definition,
  bundleHash,
  emptyPrice,
  sectionFor,
  unitFor,
} from "./definition";
import { hash } from "./hash";
import { R, Rational, type DecimalInput } from "./rational";
import type {
  Calculation,
  Commercial,
  Diagnostic,
  DraftProposal,
  Position,
  ExactValue,
} from "./types";
export const exact = (v: ExactValue) =>
  new Rational(BigInt(v.numerator), BigInt(v.denominator));
const clothLookup: Record<string, string> = {
  "2": "2.2",
  "2.13": "2.35",
  "3": "3.25",
  "4": "4.3",
  "4.5": "4.7",
  "5": "5.3",
};
const numeric = (s: string, positive = false, count = false) =>
  /^\d+(\.\d{1,6})?$/.test(s) &&
  R(s).cmp(1000000) <= 0 &&
  (!positive || R(s).cmp(0) > 0) &&
  (!count || R(s).d === 1n);
export function manualBasis(p: DraftProposal) {
  return hash({
    bundle: bundleHash,
    inputs: Object.fromEntries(
      definition.fields
        .filter((f) => f.group < 5)
        .map((f) => [f.key, p.inputs[f.key].raw]),
    ),
    extra: p.extra_screens,
    parameters: p.parameters,
  });
}
export function recoveredTorque(
  area: DecimalInput,
  family: string,
  firstCable: DecimalInput = "100",
) {
  const a = R(area);
  return family === "Cable"
    ? a.cmp(600) < 0
      ? R(firstCable)
      : a.cmp(1800) < 0
        ? R(300)
        : a.cmp(2400) < 0
          ? R(400)
          : a.cmp(5800) < 0
            ? R(800)
            : null
    : a.cmp(1800) < 0
      ? R(100)
      : a.cmp(5900) < 0
        ? R(300)
        : a.cmp(7000) < 0
          ? R(400)
          : R(800);
}
type PartResult = {
  state: Position["part_state"];
  id?: string;
  text?: string;
  note?: string;
  candidates?: string[];
};
type PartRule = {
  basis: string;
  cases: { when: [string, string, string | number][]; result: PartResult }[];
  default: PartResult;
};
export function resolvePart(row: number, p: DraftProposal, drop: Rational) {
  const rule = (
    definition.catalogue.rules as unknown as Record<string, PartRule>
  )[row];
  const result =
    rule.cases.find((c) =>
      c.when.every(([key, op, v]) => {
        const value = key === "$drop" ? drop.display() : p.inputs[key]?.raw;
        if (op === "eq") return value === String(v);
        if (op === "ne") return value !== String(v);
        const cmp = R(value).cmp(String(v));
        return op === "gt"
          ? cmp > 0
          : op === "lt"
            ? cmp < 0
            : op === "ge"
              ? cmp >= 0
              : false;
      }),
    )?.result ?? rule.default;
  return { ...result, basis: rule.basis };
}
export function commercial(p: DraftProposal, lines: Position[]): Commercial {
  let materials = R(0),
    cost = R(0),
    freight = R(0);
  const missing: string[] = [];
  for (const l of lines) {
    if (l.row >= 383 || l.excluded) continue;
    if (l.effective_quantity === null) {
      missing.push(l.key);
      continue;
    }
    const qty = exact(l.effective_quantity);
    if (qty.cmp(0) === 0) continue;
    const rate = l.price;
    if (!numeric(rate.cost) || !numeric(rate.sell) || !rate.effective_date) {
      missing.push(l.key);
      continue;
    }
    const c = R(rate.cost).div(rate.currency === "EUR" ? p.inputs.fx.raw : 1);
    cost = cost.add(qty.mul(c));
    if (l.row < 356) materials = materials.add(qty.mul(rate.sell));
    else if (l.row === 356) {
      freight = freight.add(
        R(p.inputs.seaCost.raw).div(
          R(1).sub(R(p.inputs.seaMargin.raw).div(100)),
        ),
      );
      cost = cost.sub(qty.mul(c)).add(p.inputs.seaCost.raw);
    } else if (l.row === 359) {
      freight = freight.add(p.inputs.localSell.raw);
      cost = cost.sub(qty.mul(c)).add(p.inputs.localCost.raw);
    }
  }
  const discount = materials.mul(p.inputs.discount.raw).div(100).floor(),
    before = materials.sub(discount).add(freight),
    total = before.round(-1, "up"),
    complete = missing.length === 0;
  const result = (n: Rational) => (complete ? n.evidence() : null);
  return {
    policy: "SYN-PRICE-02",
    complete,
    missing,
    materials: result(materials),
    discount: result(discount),
    freight: result(freight),
    before: result(before),
    total: result(total),
    cost: result(cost),
    rounding_adjustment: result(total.sub(before)),
    currency: "AUD",
    tax: "Not calculated",
  };
}
export function calculate(p: DraftProposal): Calculation {
  const diagnostics: Diagnostic[] = [];
  const report = (
    code: string,
    message: string,
    field: string | null = null,
    source = "SS-RECOVERED-QTY-r02",
    severity: Diagnostic["severity"] = "Warning",
    key: string | null = null,
  ) =>
    diagnostics.push({
      code,
      severity,
      field,
      key,
      message,
      source,
      action:
        severity === "Error"
          ? "Review the indicated value"
          : "Review source evidence; acknowledgment does not approve engineering",
    });
  const normalized_inputs = definition.fields.map((f) => {
    const raw = p.inputs[f.key].raw;
    let valid = f.options
      ? f.options.includes(raw)
      : numeric(
          raw,
          [
            "spans",
            "span",
            "bays",
            "bay",
            "roll",
            "across",
            "down",
            "spacing",
            "hookSpacing",
            "crossSpacing",
            "dropPerStock",
            "fx",
          ].includes(f.key),
          f.unit === "count",
        );
    if (
      valid &&
      !f.options &&
      ((["shrink", "seaMargin"].includes(f.key) && R(raw).cmp(100) >= 0) ||
        (["discount", "spares"].includes(f.key) && R(raw).cmp(100) > 0))
    )
      valid = false;
    if (!valid)
      report(
        "SpecialistInvalidInput",
        raw === ""
          ? "A calculation value is missing."
          : "Use a listed choice or bounded non-negative decimal; check counts, divisors and percentages.",
        f.key,
        f.source,
        "Error",
      );
    return {
      key: f.key,
      state: (raw === "" ? "Missing" : valid ? "Value" : "Invalid") as
        "Missing" | "Invalid" | "Value",
      value: valid
        ? f.options
          ? raw
          : f.unit === "%"
            ? R(raw).div(100).display()
            : R(raw).display()
        : null,
      unit: f.unit === "%" ? "fraction" : f.unit,
    };
  });
  for (const [key, value] of Object.entries(p.parameters))
    if (!numeric(value.raw, true))
      report(
        "SpecialistInvalidParameter",
        "Enter a positive parameter of at most 1,000,000 and six decimals.",
        `parameter.${key}`,
        key,
        "Error",
      );
  for (const [idx, e] of p.extra_screens.entries())
    for (const key of ["count", "length", "overhang", "width"] as const)
      if (
        !numeric(
          e[key],
          numeric(e.count) &&
            R(e.count).cmp(0) > 0 &&
            ["length", "width"].includes(key),
          key === "count",
        )
      )
        report(
          "SpecialistInvalidExtra",
          "Review the additional screen count and dimensions.",
          `extra.${idx}.${key}`,
          e.id,
          "Error",
        );
  for (const [key, m] of Object.entries(p.manual_quantities))
    if (m.value !== null && !numeric(m.value))
      report(
        "SpecialistInvalidManual",
        "Use an explicit unresolved value or a bounded non-negative decimal.",
        key,
        key,
        "Error",
      );
  for (const { key, price } of p.illustrative_prices)
    for (const rate of ["cost", "sell"] as const)
      if (price[rate] !== "" && !numeric(price[rate]))
        report(
          "SpecialistInvalidRate",
          "Use a bounded decimal rate or leave it unavailable.",
          `${key}.${rate}`,
          key,
          "Error",
        );
  const reviewBasis = manualBasis(p),
    review = Object.entries(p.manual_quantities)
      .filter(([, m]) => m.basis_hash !== reviewBasis)
      .map(([key]) => key);
  const result: Calculation = {
    state: "Invalid",
    normalized_inputs,
    facts: [],
    positions: [],
    diagnostics,
    manual_review_required: review,
    manual_basis_hash: reviewBasis,
    calculation_input_hash: hash({
      bundle: bundleHash,
      normalized_inputs,
      parameters: Object.fromEntries(
        Object.entries(p.parameters).map(([k, v]) => [
          k,
          numeric(v.raw) ? R(v.raw).display() : v.raw,
        ]),
      ),
      extras: p.extra_screens.map((e) => ({
        id: e.id,
        ...Object.fromEntries(
          (["count", "length", "width", "overhang"] as const).map((k) => [
            k,
            numeric(e[k]) ? R(e[k]).display() : e[k],
          ]),
        ),
      })),
      manual: Object.fromEntries(
        Object.entries(p.manual_quantities).map(([k, m]) => [
          k,
          m.value === null
            ? null
            : numeric(m.value)
              ? R(m.value).display()
              : m.value,
        ]),
      ),
      gates: Object.fromEntries(
        Object.entries(p.gates).map(([k, g]) => [k, g.include]),
      ),
    }),
    torque: null,
    commercial: {
      policy: "SYN-PRICE-02",
      complete: false,
      missing: [],
      materials: null,
      discount: null,
      freight: null,
      before: null,
      total: null,
      cost: null,
      rounding_adjustment: null,
      currency: "AUD",
      tax: "Not calculated",
    },
  };
  if (diagnostics.some((d) => d.severity === "Error")) return result;
  const i = (k: string) => p.inputs[k].raw,
    n = (k: string) => R(i(k)),
    yes = (k: string) => i(k) === "Yes",
    param = (k: string) => R(p.parameters[k].raw),
    up = (v: DecimalInput, d = 0) => R(v).round(d, "up");
  const clothWidth = clothLookup[n("bay").display()];
  if (!clothWidth) {
    report(
      "SpecialistClothLookupUnavailable",
      "No exact cloth width exists for this bay length.",
      "bay",
      "C70",
      "Error",
    );
    return result;
  }
  if (yes("wider") && n("sheet").cmp(clothWidth) < 0) {
    report(
      "SpecialistInvalidSheet",
      "Wider sheet must be at least the exact cloth width.",
      "sheet",
      "G71",
      "Error",
    );
    return result;
  }
  try {
    const w = n("spans").mul(n("span")),
      cs = n("spans").add(n("wallSpans")),
      len = n("bays")
        .sub(yes("odd") ? 1 : 0)
        .mul(n("bay"))
        .add(yes("odd") ? param("odd_bay_default_m") : 0),
      area = w.mul(len).floor(),
      groups = yes("individual") ? cs : n("across"),
      screenCount = n("bays").mul(groups),
      count = screenCount.sub(yes("odd") ? n("across") : 0),
      cw = R(clothWidth),
      groupWidth = yes("individual")
        ? n("span")
        : cs.mul(n("span")).div(n("across")),
      shrink = R(1).sub(n("shrink").div(100)),
      cut = up(groupWidth.div(shrink).add(n("overhang").mul(2)), 1),
      cloth = count.mul(cut).mul(cw),
      edgeRuns = n("across").mul(yes("seals") ? 4 : 2),
      crossRuns = n("supports").mul(n("bays")).mul(n("across")).add(1),
      crossLength = w.div(n("across")).add(1),
      edgeLength = len.add(1),
      drop = yes("droppers") ? n("dropPerSpan").mul(cs).mul(n("down")) : R(0),
      available = groupWidth.sub(param("drive_span_deduction_m")),
      lsBottom = w.div(param("ls_wire_spacing_m")).add(2),
      spaces = available.div(n("spacing")).round();
    if (count.cmp(0) < 0 || available.cmp(0) <= 0 || spaces.cmp(0) <= 0) {
      report(
        "SpecialistInvalidGeometry",
        "Available width and rounded drive spaces must be positive; standard screen count cannot be negative.",
        "spacing",
        "C97/C77",
        "Error",
      );
      return result;
    }
    const driveSpacing = available.div(spaces),
      drives = spaces.add(1).mul(groups).mul(n("down")),
      motorCount = n("across").mul(n("down")),
      extra = p.extra_screens.map((e) =>
        R(e.count)
          .mul(up(R(e.length).div(shrink), 1).add(R(e.overhang).mul(2)))
          .mul(e.width),
      ),
      motorArea = cloth.add(extra[0]).add(extra[1]).div(motorCount),
      torque = recoveredTorque(
        motorArea,
        i("drive"),
        param("cable_size_band_1"),
      );
    result.torque = torque?.evidence() ?? null;
    const add = (
      key: string,
      label: string,
      value: Rational,
      unit: string,
      source: string,
      expression: string,
    ) =>
      result.facts.push({
        key,
        label,
        value: value.evidence(),
        unit,
        source,
        expression,
      });
    add(
      "width",
      "Physical width",
      w,
      "m",
      "C28",
      "physical spans × span width",
    );
    add(
      "length",
      "Physical length",
      len,
      "m",
      "G28",
      "normal bays × bay length + parameter odd bay",
    );
    add("area", "Floor area", area, "m²", "C29", "floor(width × length)");
    add(
      "groupWidth",
      "Group width",
      groupWidth,
      "m",
      "C68",
      "calculation width / groups",
    );
    add(
      "count",
      "Standard screens",
      count,
      "screens",
      "C77",
      "bays × groups − odd-bay adjustment",
    );
    add(
      "cut",
      "Standard cut length",
      cut,
      "m",
      "G70",
      "ceil((group width / (1 − shrink) + 2 × overhang) × 10) / 10",
    );
    add(
      "clothWidth",
      "Exact cloth width",
      cw,
      "m",
      "C70",
      "exact six-value lookup",
    );
    add(
      "cloth",
      "Standard cloth",
      cloth,
      "m²",
      "C223",
      "standard count × cut × cloth width",
    );
    add(
      "available",
      "Available drive width",
      available,
      "m",
      "C97",
      "group width − deduction",
    );
    add(
      "spaces",
      "Rounded drive spaces",
      spaces,
      "spaces",
      "C97",
      "half-up(available / target)",
    );
    add(
      "spacing",
      "Actual drive spacing",
      driveSpacing,
      "m",
      "C98",
      "available / spaces",
    );
    add(
      "drives",
      "Drive positions",
      drives,
      "each",
      "G99",
      "(spaces + 1) × groups × motors along",
    );
    add(
      "motorArea",
      "Legacy area per motor",
      motorArea,
      "m²",
      "G89",
      "(main cloth + extra slots 1–2) / motors; omits slots 3–5 and offcuts",
    );
    extra.forEach((v, k) =>
      add(
        `extra${k + 1}`,
        `Additional screen ${k + 1} area`,
        v,
        "m²",
        `C${227 + k}`,
        "count × (ceil(length / (1 − shrink) × 10) / 10 + 2 × overhang) × width",
      ),
    );
    const q: Record<number, Rational | null> = {},
      put = (r: number, value: DecimalInput | null) => {
        q[r] = value === null ? null : R(value);
      },
      v = (r: number) => {
        const a = q[r];
        if (a == null) throw Error(`Unavailable dependency ${r}`);
        return a;
      },
      gate = (r: number) => p.gates[`B${r}`].include;
    put(219, 0);
    put(223, cloth);
    put(224, yes("wider") ? count.mul(cut).mul(n("sheet").sub(cw)) : 0);
    put(225, yes("wider") ? count.mul(cut) : 0);
    extra.forEach((x, k) => put(227 + k, x));
    put(232, 0);
    put(233, 0);
    put(
      235,
      yes("seals")
        ? up(n("across").mul(2).mul(len.div("0.97").round(1)).div(100))
        : 0,
    );
    put(
      236,
      yes("seals") ? up(v(235).mul(2).div("0.2").mul("1.1").div(1000)) : 0,
    );
    put(237, yes("tape") ? n("tapeRolls") : 0);
    put(
      240,
      up(
        w
          .div("0.4")
          .mul("1.5")
          .mul(len.add(2))
          .mul(R(1).add(n("spares").div(100)))
          .div(n("roll")),
      ).add(1),
    );
    put(
      241,
      up(
        edgeRuns
          .mul(edgeLength)
          .add(crossRuns.mul(crossLength))
          .add(drop.mul(n("dropWire")))
          .mul("1.15"),
      ),
    );
    put(
      242,
      crossRuns
        .mul(n("strainers"))
        .add(edgeRuns)
        .add(drop.mul(n("dropStrainers")))
        .add(2),
    );
    put(
      243,
      yes("replaceLS")
        ? up(lsBottom.add(lsBottom.div(2).floor()).mul("1.05"))
        : 0,
    );
    for (const r of definition.manual_rows)
      put(r, p.manual_quantities[`CE-LINE-${r}`].value);
    put(246, yes("footy") ? edgeRuns.mul(n("bays")) : 0);
    put(
      247,
      i("bed") === "Truss Clip"
        ? w
            .div(param("ls_wire_spacing_m"))
            .mul(len.div(n("bay")))
            .add(param("crosswire_clip_spare"))
            .floor()
        : 0,
    );
    put(
      248,
      i("bed") === "Truss Clip"
        ? up(v(247).div(2))
        : yes("crossClips")
          ? up(
              up(w.div(n("crossSpacing")))
                .mul(n("bays").sub(1))
                .mul("1.05"),
            )
          : 0,
    );
    put(249, yes("plates") ? up(edgeRuns.mul(n("bays"))) : 0);
    put(
      250,
      yes("endBeams")
        ? up(cs.div(n("span").div(param("end_beam_divisor"))).mul(2))
        : 0,
    );
    put(251, yes("droppers") ? up(drop.div(n("dropPerStock"))) : 0);
    put(
      252,
      yes("braces")
        ? n("braceLength").mul(2).mul(cs).mul(2).div("6.5").floor().add(1)
        : 0,
    );
    put(
      253,
      yes("chain")
        ? n("chainLength").mul(cs).mul(screenCount.sub(1)).floor()
        : 0,
    );
    put(
      254,
      gate(254) ? n("internalOmega").mul(cs).mul(2).add(drop).add(2) : 0,
    );
    put(255, n("externalOmega").mul(cs).mul(2));
    put(256, drop.cmp(0) > 0 ? drop.mul(4).add(2) : 0);
    put(257, drop.cmp(0) > 0 ? drop.mul(4).add(4) : 0);
    put(258, drop.cmp(0) > 0 ? drop.mul(8).add(4) : 0);
    put(259, yes("omega") ? edgeRuns.mul(n("bays")) : 0);
    put(
      260,
      yes("twine")
        ? up(
            crossLength
              .mul(crossRuns)
              .mul(param("baling_twine_factor"))
              .div(500),
          )
        : 0,
    );
    const cable = i("drive") === "Cable",
      loc = i("cableLocation") === "Central" ? 2 : 1,
      tableClamp = drives.div(n("down")).mul(len).div(n("bay")).floor().add(1),
      roller = tableClamp.sub(drives.mul(2)).floor().add(1),
      coupling = cable
        ? drives.div(n("down")).mul(n("bays")).add(2)
        : drives.mul(2).sub(motorCount.mul(2));
    put(
      263,
      gate(263)
        ? cable && i("pipeDiameter") !== "25"
          ? drives.mul(2)
          : drives
        : 0,
    );
    put(264, gate(264) ? up(drives) : 0);
    put(265, v(263).mul(2));
    put(266, gate(266) ? (cable ? drives.mul(loc) : drives.mul(2).sub(2)) : 0);
    put(
      267,
      gate(267)
        ? coupling.add(
            yes("wallPulleys") ? screenCount.mul(n("across")).mul(2) : 0,
          )
        : 0,
    );
    put(268, cable ? v(267) : 0);
    put(269, cable ? v(267) : 0);
    put(270, gate(270) ? drives.mul(cable ? loc : 2) : 0);
    put(271, 0);
    put(272, cable ? coupling.mul(2).add(20) : 0);
    put(
      244,
      cable
        ? up(
            v(263)
              .mul(4)
              .add(10)
              .add(v(264).mul(2))
              .add(edgeRuns.mul(2))
              .add(crossRuns.mul(2))
              .add(drop.mul(n("dropStrainers")).mul(2))
              .mul("1.02"),
          )
        : 0,
    );
    put(
      277,
      (cable ? v(263).mul(2) : roller.mul(2))
        .add(v(242))
        .add(50)
        .add(v(254).mul(8))
        .add(
          yes("extraTeks") ? lsBottom.add(lsBottom.div(2).floor()).mul(2) : 0,
        ),
    );
    put(284, cable ? drives.mul(loc).mul(2).add(7) : 0);
    const stock =
      i("leading") === "Tube - Alum"
        ? R("6.1")
        : n("span").cmp("6.4") === 0
          ? R("6.4")
          : R(8);
    put(
      286,
      i("leading") === "Profile"
        ? q[285] === null
          ? null
          : stock.mul(v(285))
        : 0,
    );
    put(287, q[286]);
    put(288, q[285] === null ? null : v(285).add(10));
    put(
      289,
      yes("wallPulleys") && i("leading") !== "Profile"
        ? n("across").mul(8).floor()
        : 0,
    );
    put(290, q[245] === null ? null : v(245).mul("1.1").floor());
    put(
      293,
      yes("delay")
        ? up(len.div(param("delay_unit_interval_m")))
            .sub(1)
            .mul(drives)
        : 0,
    );
    put(296, yes("motors") ? motorCount : 0);
    for (let r = 297; r <= 308; r++) put(r, 0);
    if (yes("motors")) {
      put(297, i("pipeDiameter") === "50" ? motorCount.mul(2) : 0);
      put(300, motorCount);
      put(306, motorCount.mul(4));
      put(307, motorCount.mul(5));
      put(308, motorCount.mul(13));
    }
    put(312, w.div("0.4").add(4).mul(len).div(n("bay")).floor());
    put(
      313,
      w
        .div("0.4")
        .add(1)
        .div(2)
        .mul(len)
        .div(n("bay"))
        .mul("1.1")
        .floor()
        .mul(i("leading") === "Profile" ? 2 : 1),
    );
    put(
      311,
      up(
        w
          .div("0.4")
          .mul(len)
          .div(n("bay"))
          .mul("1.1")
          .floor()
          .mul(i("leading") === "Profile" ? 2 : 1)
          .add(i("leading") === "Profile" ? v(312).div("1.5").mul(2) : 0),
      ),
    );
    put(
      314,
      i("edge") === "Hooks" ? 0 : cw.floor().add(1).mul(screenCount).mul(8),
    );
    put(315, v(314).div(2));
    put(316, i("leading") === "Profile" ? q[291] : 0);
    put(
      317,
      screenCount
        .mul(up(cw.div(n("hookSpacing"))))
        .mul(2)
        .mul("1.1")
        .floor(),
    );
    for (let r = 320; r <= 353; r++) put(r, 0);
    for (let r = 356; r <= 359; r++) put(r, 0);
    if (yes("freight")) {
      put(356, 1);
      put(359, 1);
    }
    for (let r = 362; r <= 380; r++) put(r, yes("installation") ? null : 0);
    put(383, n("discount").cmp(0) > 0 ? 1 : 0);
    put(384, 0);
    report(
      "SOURCE",
      "Recovered quantity rules require engineering and catalogue review.",
    );
    if (!yes("replaceLS"))
      report(
        "REV-17",
        "LS wire is generated despite the replacement selector; review explicit line exclusion.",
        "replaceLS",
        "C59/C240",
      );
    if (driveSpacing.cmp(4) > 0)
      report(
        "SPACING",
        "Drive spacing exceeds the recovered 4 m note; this is not a capacity approval.",
        "spacing",
        "G97",
      );
    if (cs.div(n("across")).d !== 1n)
      report(
        "POSTLINE",
        "Motor groups do not divide the calculation spans.",
        "across",
        "G88",
      );
    if (yes("odd"))
      report(
        "ODD",
        "Separate odd-bay cloth remains undefined.",
        "odd",
        "C77/G27",
      );
    if (extra.slice(2).some((x) => x.cmp(0) > 0))
      report(
        "REV-09",
        "Additional slots 3–5 are omitted from recovered motor area.",
        null,
        "G74",
      );
    if (extra.some((x) => x.cmp(0) > 0))
      report(
        "REV-07",
        "Additional cloth pricing references require review.",
        null,
        "D227:D231/J227:J231",
      );
    if (yes("seals"))
      report(
        "SEAL",
        "Seal staple pack expression and ignored material choice require review.",
        "seals",
        "C236",
      );
    if (i("leading") === "Profile")
      report(
        "PROFILE",
        "Profile clips require a pieces-to-pack decision.",
        "leading",
        "C313",
      );
    if (yes("endBeams") || yes("braces") || yes("chain"))
      report(
        "STOCK",
        "Recovered support-stock divisors and multipliers require confirmation.",
        null,
        "C250/C252/C253",
      );
    if (yes("motors"))
      report(
        "MOTOR",
        "Torque comparisons do not establish motor selection or approved capacity.",
        "motors",
        "G90/G92",
      );
    if (!torque)
      report(
        "TORQUE-UNAVAILABLE",
        "Cable upper torque range is unavailable.",
        "drive",
        "G90",
      );
    if (!cable && motorArea.cmp(7000) >= 0)
      report(
        "TORQUE-UPPER-UNKNOWN",
        "Pinion retains 800 Nm comparison without a known upper limit.",
        "drive",
        "G90",
      );
    if (yes("installation"))
      report(
        "INSTALL",
        "Installation quantities and amounts are unavailable.",
        "installation",
        "C174:E174/F395",
      );
    for (const u of definition.catalogue.untested)
      for (const [key, value] of u.triggers)
        if (i(key) === value)
          report("UNTESTED", `${u.never}: ${u.risk}`, key, u.source);
    for (const key of review)
      report(
        "SpecialistManualReviewRequired",
        "Review this manual quantity against the current noncommercial basis.",
        key,
        key,
        "Warning",
        key,
      );
    result.positions = definition.lines.map((l) => {
      const qty = q[l.row] ?? null,
        excluded = p.exclusions.some((e) => e.key === l.key && e.excluded),
        part = resolvePart(l.row, p, drop),
        catalog = definition.catalogue.parts.find((x) => x.id === part.id),
        price =
          p.illustrative_prices.find((x) => x.key === l.key)?.price ??
          emptyPrice();
      return {
        ...l,
        section: sectionFor(l.row),
        quantity: qty?.evidence() ?? null,
        effective_quantity: excluded
          ? R(0).evidence()
          : (qty?.evidence() ?? null),
        unit: unitFor(l.row),
        part_id: part.id ?? null,
        part_state: part.state,
        description: catalog?.description ?? part.text ?? l.label,
        part_basis: part.basis,
        part_note: part.note ?? "",
        part_candidates: part.candidates ?? [],
        excluded,
        gate_included: definition.gates.includes(l.row) ? gate(l.row) : null,
        price,
        status: excluded
          ? "Excluded"
          : qty === null
            ? "Unresolved"
            : qty.cmp(0) === 0
              ? "Zero"
              : l.manual
                ? "Manual"
                : "Calculated",
        origin: l.manual ? "manual" : "generated",
      } satisfies Position;
    });
    if (
      result.positions.some(
        (l) =>
          l.quantity &&
          (exact(l.quantity).cmp(0) < 0 ||
            exact(l.quantity).cmp("1000000000000") > 0),
      ) ||
      result.facts.some((f) => exact(f.value).cmp("1000000000000") > 0)
    ) {
      report(
        "SpecialistOutputBound",
        "Derived values exceed the non-negative 10^12 technical output limit.",
        null,
        "Native technical guard",
        "Error",
      );
      result.positions = [];
      result.facts = [];
      return result;
    }
    result.commercial = commercial(p, result.positions);
    result.state = "Current";
    return result;
  } catch {
    report(
      "SpecialistInvalidArithmetic",
      "The exact calculation encountered an unavailable dependency or technical arithmetic limit.",
      null,
      "Native technical guard",
      "Error",
    );
    result.positions = [];
    result.facts = [];
    return result;
  }
}
