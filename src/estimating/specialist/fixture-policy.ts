import { initialProposal, bundleHash } from "./definition";
import { calculate, manualBasis } from "./engine";
import { hash } from "./hash";
import type { DraftProposal } from "./types";
// These are public dedicated Screen Systems identities, independent of ES-02 climate examples.
export const fixtureIds = {
  workspace: "10000000-0000-4000-8000-000000000001",
  company: "20000000-0000-4000-8000-000000000001",
  opportunity: "e5080000-0000-4000-8000-000000000001",
  estimating_workspace: "e5080000-0000-4000-8000-000000000002",
  option: "e5080000-0000-4000-8000-000000000003",
  revision: "e5080000-0000-4000-8000-000000000004",
  configuration: "e5080000-0000-4000-8000-000000000005",
  estimate: "e5080000-0000-4000-8000-000000000006",
  facility: "72000000-0000-4000-8000-000000000001",
  site: "70000000-0000-4000-8000-000000000001",
};
export function fixtureProposal(changed = false): DraftProposal {
  const p = initialProposal();
  p.inputs.discount.raw = "0";
  p.inputs.bays.raw = changed ? "13" : "12";
  for (const f of Object.values(p.inputs))
    f.attribution = {
      kind: "assumption",
      note: "SYN-ES08 authored Screen Systems fixture; not a customer requirement",
      source_field: null,
    };
  for (const m of Object.values(p.manual_quantities)) {
    m.value = "0";
    m.reason =
      "SYN-ES08 explicit zero manual allowance for bounded arithmetic proof";
    m.basis_hash = manualBasis(p);
  }
  p.illustrative_prices = calculate(p).positions.map((l) => ({
    key: l.key,
    price: {
      cost: "1.00",
      sell: "2.00",
      currency: "AUD",
      no_purchase: false,
      reason: "SYN-ES08 authored rate per calculation unit; no supplier quote",
      effective_date: "2026-09-21",
    },
  }));
  return p;
}
export function profile(p: DraftProposal) {
  return hash({
    bundle: p.definition_bundle_hash,
    inputs: Object.fromEntries(
      Object.entries(p.inputs).map(([k, v]) => [k, v.raw]),
    ),
    extras: p.extra_screens,
    parameters: Object.fromEntries(
      Object.entries(p.parameters).map(([k, v]) => [k, v.raw]),
    ),
    manual: Object.fromEntries(
      Object.entries(p.manual_quantities).map(([k, v]) => [k, v.value]),
    ),
    gates: Object.fromEntries(
      Object.entries(p.gates).map(([k, v]) => [k, v.include]),
    ),
    exclusions: p.exclusions,
  });
}
const mappings = [
  [223, "SYN-SCREEN-CLOTH-01", "m²"],
  [240, "PPO.WIR.004.ALL", "roll"],
  [241, "PPO.WIR.010.ALL", "m"],
  [242, "PPO.WIR.006.ALL", "each"],
  [260, "PPO.MSC.001.ALL", "roll"],
  [277, "PPO.FIX.011.ALL", "each"],
  [288, "PPO.PRF.007.ALL", "each"],
  [311, "PPO.CLP.003.ALL", "each"],
  [312, "PPO.CLP.006.ALL", "each"],
  [313, "PPO.CLP.005.ALL", "each"],
  [317, "PPO.MTR.002.ALL", "each"],
] as const;
export const receivingPolicy = {
  id: "SYN-ES08-RECEIVE-01",
  version: 1,
  bundle_hash: bundleHash,
  context: fixtureIds,
  profiles: [profile(fixtureProposal()), profile(fixtureProposal(true))],
  mapping_version: "SYN-ES08-UNIT-MAP-01",
  price_policy: "SYN-EST-ARITHMETIC-01",
  permitted_findings: ["SOURCE", "REV-17", "UNTESTED"],
  mappings: mappings.map(([row, part_id, unit]) => ({
    key: `CE-LINE-${row}`,
    part_id,
    unit,
    category: "Product" as const,
    allowance: false,
    factor: "1",
    evidence:
      row === 223
        ? "Explicit authored synthetic cloth identity; recovered cloth catalogue remains unavailable"
        : "Synthetic rate per exact calculation unit. Procurement packaging is not adopted.",
  })),
  operational_approval: false,
};
export const receivingPolicyHash = hash(receivingPolicy);
