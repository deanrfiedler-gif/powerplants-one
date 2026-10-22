import { R, type Rational } from "../specialist/rational";
import type { Fact, Study } from "./model";
import {
  assessmentEdition,
  activeIn,
  type Assessment,
  type AssessmentResult,
  type Check,
  type ExactValue,
  type Review,
} from "./assessment-model";

const value = (f: Fact): Rational | null =>
  f.value !== null &&
  !["Unknown", "Conflict", "NotApplicable"].includes(f.knowledge)
    ? R(f.value)
    : null;
const exact = (r: Rational | null, unit: string): ExactValue | null =>
  r === null ? null : { ...r.evidence(), unit };
const reviewed = (r: Review) => r.state === "Reviewed" && !!r.reviewer;
const confirmed = (f: Fact) =>
  !!f.source && ["SupplierDocumented", "TrialMeasured"].includes(f.knowledge);
export function assess(source: Study, input: Assessment): AssessmentResult {
  const out: AssessmentResult = {
    edition: assessmentEdition,
    technical_state: "NeedsConfirmation",
    findings: [],
    quantities: [],
    scenarios: [],
    buffers: [],
  };
  let unsuitable = false;
  const finding = (
    key: string,
    rule: string,
    subject: string,
    message: string,
    gate: "TechnicalUse" | "QuantityGeneration" = "TechnicalUse",
    owner = input.owner,
    action = "Confirm the exact source and revise the assessment.",
    failure = false,
  ) => {
    out.findings.push({
      key,
      rule,
      subject,
      message,
      gate,
      severity: "Blocker",
      owner,
      action,
    });
    if (failure && gate === "TechnicalUse") unsuitable = true;
  };
  const uncertain = (
    key: string,
    rule: string,
    subject: string,
    f: Fact,
    gate: "TechnicalUse" | "QuantityGeneration" = "TechnicalUse",
  ) => {
    if (value(f) === null || f.knowledge === "Assumed")
      finding(
        key,
        rule,
        subject,
        "Required value is unknown, conflicting, not applicable or assumed.",
        gate,
        f.owner ?? input.owner,
        f.next_action ?? "Obtain a source-qualified value.",
      );
  };
  const check = (key: string, subject: string, c: Check, rule: string) => {
    if (c.state === "Incompatible") {
      finding(
        key,
        rule,
        subject,
        c.aspect + " is recorded as incompatible.",
        "TechnicalUse",
        c.owner ?? input.owner,
        c.action ?? "Resolve this mandatory incompatibility.",
        true,
      );
      return false;
    }
    if (
      !["Compatible", "NotApplicable"].includes(c.state) ||
      !c.source ||
      !reviewed(c.review)
    ) {
      finding(
        key,
        rule,
        subject,
        c.aspect + " needs evidence and internal review.",
        "TechnicalUse",
        c.owner ?? input.owner,
        c.action ??
          "Confirm applicability and the exact interface or configuration.",
      );
      return false;
    }
    return true;
  };
  if (!source.scenarios.length)
    finding(
      "scenarios",
      "NAC-R01",
      "Scenarios",
      "No required production scenario is saved.",
    );
  if (!input.stages.length)
    finding("stages", "NAC-R03", "Process", "No process stages are recorded.");
  const sourceIds = new Set(source.scenarios.map((s) => s.id));
  for (const sc of input.scenarios)
    if (!sourceIds.has(sc.scenario_id))
      finding(
        sc.scenario_id + ":orphan",
        "NAC-R01",
        "Scenario",
        "This scenario is absent from the exact saved Nursery source.",
      );
  for (const stage of input.stages) {
    const technical = value(stage.technical_count),
      installation = value(stage.installation_count),
      spare = value(stage.spare_count),
      waste = value(stage.waste_count),
      pack = value(stage.pack_size);
    const active = ["Base", "Selected"].includes(stage.selection);
    let need: Rational | null = R(0),
      packs: Rational | null = R(0),
      purchased: Rational | null = R(0);
    if (active) {
      uncertain(
        stage.id + ":technical",
        "NAC-R07",
        stage.name,
        stage.technical_count,
        "QuantityGeneration",
      );
      uncertain(
        stage.id + ":installation",
        "NAC-R07",
        stage.name,
        stage.installation_count,
        "QuantityGeneration",
      );
      if (installation && technical && installation.cmp(technical) > 0)
        finding(
          stage.id + ":installation-excess",
          "NAC-R07",
          stage.name,
          "Installation count exceeds technical units.",
          "QuantityGeneration",
        );
      if (stage.disposition !== "Manual" && technical?.cmp(0) === 0)
        finding(
          stage.id + ":zero-equipment",
          "NAC-R07",
          stage.name,
          "Selected equipment requires a positive technical count.",
          "QuantityGeneration",
        );
      if (stage.disposition === "New") {
        uncertain(
          stage.id + ":spare",
          "NAC-R07",
          stage.name,
          stage.spare_count,
          "QuantityGeneration",
        );
        uncertain(
          stage.id + ":waste",
          "NAC-R07",
          stage.name,
          stage.waste_count,
          "QuantityGeneration",
        );
        uncertain(
          stage.id + ":pack",
          "NAC-R07",
          stage.name,
          stage.pack_size,
          "QuantityGeneration",
        );
        need =
          technical && spare && waste ? technical.add(spare).add(waste) : null;
        packs =
          need && pack && pack.cmp(0) > 0
            ? need.div(pack).round(0, "up")
            : null;
        purchased = packs && pack ? packs.mul(pack) : null;
        if (pack?.cmp(0) === 0)
          finding(
            stage.id + ":zero-pack",
            "NAC-R07",
            stage.name,
            "Pack size must be positive.",
            "QuantityGeneration",
          );
        if (!reviewed(stage.quantity_review) || !stage.pack_size.source)
          finding(
            stage.id + ":quantity-review",
            "NAC-R07",
            stage.name,
            "Purchase-pack conversion needs its source and internal review.",
            "QuantityGeneration",
          );
        if (purchased && purchased.cmp(100000) > 0)
          finding(
            stage.id + ":quantity-bound",
            "NAC-R07",
            stage.name,
            "Purchase result exceeds the 100,000 quantity envelope; retained without truncation.",
            "QuantityGeneration",
          );
      }
      if (
        stage.role === "Potting" &&
        stage.disposition !== "Manual" &&
        (!stage.candidate_id ||
          !source.candidate_ids.includes(stage.candidate_id) ||
          !stage.configuration)
      )
        finding(
          stage.id + ":configuration",
          "NAC-R01",
          stage.name,
          "Bind a shortlisted candidate and its exact regional/options configuration.",
        );
    }
    out.quantities.push({
      stage_id: stage.id,
      phase: stage.phase,
      technical: exact(technical, "units"),
      installation: exact(installation, "units"),
      spare: exact(spare, "units"),
      waste: exact(waste, "units"),
      purchase_need: exact(need, "units"),
      purchase_packs: exact(packs, "packs"),
      purchase_units: exact(purchased, "units"),
      disposition: stage.disposition,
    });
  }

  for (const scenario of source.scenarios) {
    const prefix = scenario.id,
      sc = input.scenarios.find((s) => s.scenario_id === scenario.id),
      stages = input.stages.filter((s) => activeIn(s, scenario.phase));
    const result: AssessmentResult["scenarios"][number] = {
      scenario_id: scenario.id,
      phase: scenario.phase,
      capacity_state: "NotAssessable",
      rate_basis: null,
      line_rate: null,
      running_minutes: null,
      good_output: null,
      target: exact(value(scenario.facts.target_good_pots), "good pots/shift"),
      target_state: "NotAssessable",
      bottleneck_stage_ids: [],
      rates: [],
    };
    out.scenarios.push(result);
    let comparable = input.topology === "Sequential" && stages.length > 0;
    for (const field of ["crop", "container", "media", "quality"] as const) {
      const fact = scenario.facts[field];
      if (
        ["Unknown", "Conflict", "Assumed"].includes(fact.knowledge) ||
        !fact.source
      ) {
        comparable = false;
        finding(
          prefix + ":requirement:" + field,
          "NAC-R01",
          scenario.name,
          "Required " + field + " evidence is unresolved.",
        );
      }
    }
    if (stages.some((s) => s.disposition === "Manual")) {
      const manual = stages
        .filter((s) => s.disposition === "Manual")
        .map((s) => sc?.stages.find((c) => c.stage_id === s.id)?.operators);
      const allocationsKnown = manual.every(
        (f) =>
          f && value(f) && value(f)!.cmp(0) > 0 && f.knowledge !== "Assumed",
      );
      const allocated = allocationsKnown
        ? manual.reduce((n, f) => n.add(value(f!)!), R(0))
        : null;
      const staffing = value(scenario.facts.staffing);
      if (
        !staffing ||
        !allocated ||
        staffing.cmp(allocated) < 0 ||
        scenario.facts.staffing.knowledge === "Assumed"
      ) {
        comparable = false;
        finding(
          prefix + ":staffing",
          "NAC-R03",
          scenario.name,
          "Manual stages need explicit positive operator allocations, enough simultaneous staffing and independently supported stage rates; shared operators require another model.",
        );
      }
    }
    if (input.topology !== "Sequential")
      finding(
        prefix + ":topology",
        "NAC-R03",
        scenario.name,
        "This topology requires a supported model or engineering assessment; simple minimum rate is not applicable.",
      );
    if (!stages.length)
      finding(
        prefix + ":stages",
        "NAC-R03",
        scenario.name,
        "No selected stages apply to this phase.",
      );
    for (const role of [
      "MediaSupply",
      "Dispensing",
      "Potting",
      "Planting",
      "TakeOff",
    ]) {
      if (!stages.some((s) => s.role === role)) {
        comparable = false;
        finding(
          prefix + ":role:" + role,
          "NAC-R03",
          scenario.name,
          "Account for " + role + ", including retained or manual work.",
        );
      }
    }
    const connections = input.connections.filter(
      (c) =>
        c.scenario_ids.includes(scenario.id) &&
        stages.some((s) => s.id === c.from_id) &&
        stages.some((s) => s.id === c.to_id),
    );
    const expectedEdges = stages
      .slice(1)
      .map((s, i) => stages[i].id + ":" + s.id);
    const actualEdges = connections.map((c) => c.from_id + ":" + c.to_id);
    if (
      actualEdges.length !== expectedEdges.length ||
      expectedEdges.some((e) => actualEdges.filter((a) => a === e).length !== 1)
    ) {
      comparable = false;
      finding(
        prefix + ":connections",
        "NAC-R03",
        scenario.name,
        "Record exactly the ordered sequential connections; branches, missing links, duplicates or reverse links cannot use the minimum-rate model.",
      );
    }
    for (const c of connections)
      for (const item of c.checks)
        if (
          !check(
            prefix + ":" + c.id + ":" + item.aspect,
            scenario.name + " connection",
            item,
            "NAC-R08",
          )
        )
          comparable = false;

    const rates: { id: string; rate: Rational; basis: "Gross" | "NetGood" }[] =
      [];
    for (const stage of stages) {
      const c = sc?.stages.find((c) => c.stage_id === stage.id),
        key = prefix + ":" + stage.id;
      if (!c) {
        comparable = false;
        finding(
          key + ":case",
          "NAC-R01",
          scenario.name + " / " + stage.name,
          "No stage assessment exists for this required scenario.",
        );
        continue;
      }
      if (stage.disposition !== "Manual" && stage.configuration_evidence.state === "NotApplicable") {
        comparable = false;
        finding(key + ":configuration-required", "NAC-R01", stage.name, "Selected equipment needs exact configuration confirmation; it cannot be marked not applicable.");
      }
      const count = value(stage.technical_count);
      if (
        stage.disposition !== "Manual" &&
        !check(
          key + ":configuration-evidence",
          stage.name,
          stage.configuration_evidence,
          "NAC-R01",
        )
      )
        comparable = false;
      if (
        stage.disposition !== "Manual" &&
        (!count ||
          count.cmp(0) <= 0 ||
          stage.technical_count.knowledge === "Assumed")
      ) {
        comparable = false;
        finding(
          key + ":count",
          "NAC-R03",
          stage.name,
          "A selected processing stage needs a known positive technical count.",
        );
      }
      if (
        count &&
        count.cmp(1) > 0 &&
        !["Conveying", "Manual"].includes(stage.role) &&
        stage.disposition !== "Manual"
      ) {
        comparable = false;
        finding(
          key + ":multiple",
          "NAC-R03",
          stage.name,
          "Multiple processing units need an explicitly supported topology model.",
        );
      }
      let rate = value(c.rate);
      uncertain(key + ":rate", "NAC-R03", stage.name, c.rate);
      if (!reviewed(c.rate_review))
        finding(
          key + ":rate-review",
          "NAC-R03",
          stage.name,
          "The complete-stage rate needs internal source review.",
        );
      if (c.rate.knowledge === "Assumed" || !reviewed(c.rate_review))
        comparable = false;
      if (c.rate_unit === "TraysPerHour") {
        const occupancy = value(c.occupancy);
        uncertain(key + ":occupancy", "NAC-R02", stage.name, c.occupancy);
        if (
          !occupancy ||
          occupancy.cmp(0) <= 0 ||
          c.occupancy.knowledge === "Assumed"
        ) {
          rate = null;
          finding(
            key + ":occupancy-positive",
            "NAC-R02",
            stage.name,
            "Occupied pots per tray must be known and greater than zero.",
          );
        } else rate = rate?.mul(occupancy) ?? null;
      }
      result.rates.push({
        stage_id: stage.id,
        original: c.rate,
        unit: c.rate_unit,
        normalized: exact(rate, "pots/hour"),
      });
      if (rate) rates.push({ id: stage.id, rate, basis: c.rate_basis });
      else comparable = false;
      for (const l of c.limits) {
        const f = scenario.facts[l.dimension],
          raw = value(f),
          min = value(l.minimum),
          max = value(l.maximum);
        const minNA = l.minimum.knowledge === "NotApplicable",
          maxNA = l.maximum.knowledge === "NotApplicable";
        const minKnown = reviewed(l.review) && !!min && confirmed(l.minimum);
        const maxKnown = reviewed(l.review) && !!max && confirmed(l.maximum);
        // A missing opposite bound must never hide an established mandatory failure.
        if (
          raw &&
          f.knowledge !== "Assumed" &&
          ((minKnown &&
            (raw.cmp(min!) < 0 ||
              (!l.minimum_inclusive && raw.cmp(min!) === 0))) ||
            (maxKnown &&
              (raw.cmp(max!) > 0 ||
                (!l.maximum_inclusive && raw.cmp(max!) === 0))))
        ) {
          comparable = false;
          finding(
            key + ":" + l.dimension + ":outside",
            "NAC-R01",
            stage.name,
            "Required " +
              l.dimension +
              " is outside the recorded reviewed boundary.",
            "TechnicalUse",
            input.owner,
            "Change the selection or obtain an authorised corrected requirement/limit.",
            true,
          );
        }
        if (
          !reviewed(l.review) ||
          (!minNA && !minKnown) ||
          (!maxNA && !maxKnown) ||
          (minNA && !l.minimum.source) ||
          (maxNA && !l.maximum.source)
        ) {
          comparable = false;
          finding(
            key + ":" + l.dimension + ":evidence",
            "NAC-R01",
            stage.name,
            l.dimension +
              " needs reviewed, source-qualified limits or an explicit applicability reason.",
          );
          continue;
        }
        if (min && max && min.cmp(max) > 0) {
          comparable = false;
          finding(
            key + ":" + l.dimension + ":range",
            "NAC-R01",
            stage.name,
            "The recorded minimum exceeds the maximum.",
          );
          continue;
        }
        if (minNA && maxNA) continue;
        if (!raw || f.knowledge === "Assumed") {
          comparable = false;
          finding(
            key + ":" + l.dimension + ":input",
            "NAC-R01",
            stage.name,
            "Required container dimension is unknown, conflicting or assumed.",
            "TechnicalUse",
            f.owner ?? input.owner,
            f.next_action ?? "Obtain exact container evidence.",
          );
          continue;
        }
      }
      for (const item of c.checks)
        if (!check(key + ":" + item.aspect, stage.name, item, "NAC-R01"))
          comparable = false;
    }
    if (new Set(rates.map((r) => r.basis)).size > 1) {
      comparable = false;
      finding(
        prefix + ":mixed-rate-basis",
        "NAC-R03",
        scenario.name,
        "Gross and net-good stage rates are not directly comparable.",
      );
    }
    const facts = scenario.facts,
      shift = value(facts.shift_minutes),
      stops = value(facts.stops_minutes),
      changes = value(facts.changeovers),
      changeMinutes = value(facts.changeover_minutes),
      target = value(facts.target_good_pots);
    for (const k of [
      "shift_minutes",
      "stops_minutes",
      "changeovers",
      "changeover_minutes",
      "target_good_pots",
    ] as const)
      uncertain(prefix + ":" + k, "NAC-R04", scenario.name, facts[k]);
    const running =
      shift && stops && changes && changeMinutes
        ? shift.sub(stops).sub(changes.mul(changeMinutes))
        : null;
    if (running && running.cmp(0) < 0)
      finding(
        prefix + ":stops",
        "NAC-R04",
        scenario.name,
        "Stops and changeovers exceed available shift time; output cannot be assessed.",
      );
    else result.running_minutes = exact(running, "minutes");
    if (comparable && rates.length === stages.length && rates.length) {
      const minimum = rates.reduce((a, b) => (a.rate.cmp(b.rate) <= 0 ? a : b));
      result.capacity_state = "Indicative";
      result.rate_basis = minimum.basis;
      result.line_rate = exact(minimum.rate, "pots/hour");
      result.bottleneck_stage_ids = rates
        .filter((r) => r.rate.cmp(minimum.rate) === 0)
        .map((r) => r.id);
      const fraction = sc ? value(sc.good_fraction) : null;
      if (minimum.basis === "Gross") {
        if (sc)
          uncertain(
            prefix + ":good-fraction",
            "NAC-R04",
            scenario.name,
            sc.good_fraction,
          );
        else
          finding(
            prefix + ":good-fraction",
            "NAC-R04",
            scenario.name,
            "Good-output fraction is missing.",
          );
      }
      const output =
        running &&
        running.cmp(0) >= 0 &&
        (minimum.basis === "NetGood" || fraction !== null)
          ? minimum.rate
              .mul(running)
              .div(60)
              .mul(minimum.basis === "NetGood" ? 1 : fraction!)
          : null;
      result.good_output = exact(output, "good pots/shift");
      const timingKnown = [
        "shift_minutes",
        "stops_minutes",
        "changeovers",
        "changeover_minutes",
        "target_good_pots",
      ].every((k) => facts[k as keyof typeof facts].knowledge !== "Assumed");
      if (
        output &&
        target &&
        timingKnown &&
        (minimum.basis === "NetGood" ||
          sc?.good_fraction.knowledge !== "Assumed")
      ) {
        result.target_state =
          output.cmp(target) < 0 ? "Shortfall" : "MeetsTarget";
        if (result.target_state === "Shortfall")
          finding(
            prefix + ":shortfall",
            "NAC-R09",
            scenario.name,
            "Unrounded achievable good output is below the required shift target.",
            "TechnicalUse",
            input.owner,
            "Revise the design or obtain an explicitly reviewed requirement change.",
            true,
          );
      }
    }
    if (result.target_state === "NotAssessable")
      finding(
        prefix + ":target-unassessable",
        "NAC-R09",
        scenario.name,
        "Required output cannot be confirmed on a comparable phase, time and quality basis.",
      );
  }
  for (const c of input.connections) {
    const positions = value(c.buffer_positions),
      demand = value(c.downstream_demand_per_minute);
    const state =
      c.buffer_positions.knowledge === "Assumed" ||
      c.downstream_demand_per_minute.knowledge === "Assumed"
        ? "Unknown"
        : demand?.cmp(0) === 0
          ? "NotApplicable"
          : positions && demand
            ? "Indicative"
            : "Unknown";
    out.buffers.push({
      connection_id: c.id,
      state,
      minutes:
        state === "Indicative"
          ? exact(positions!.div(demand!), "minutes")
          : null,
    });
    if (state === "Unknown")
      out.findings.push({
        key: c.id + ":buffer",
        rule: "NAC-R05",
        subject: "Buffer",
        message:
          "Buffer coverage is unknown; it cannot remove a persistent bottleneck.",
        severity: "Warning",
        gate: "TechnicalUse",
        owner: c.buffer_positions.owner ?? input.owner,
        action:
          "Record usable positions and downstream demand if buffer coverage is required.",
      });
  }
  out.technical_state = unsuitable
    ? "NotSuitable"
    : out.findings.some(
          (f) => f.gate === "TechnicalUse" && f.severity === "Blocker",
        )
      ? "NeedsConfirmation"
      : "ChecksSatisfied";
  return out;
}
