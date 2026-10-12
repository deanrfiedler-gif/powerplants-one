import type { Definition, CalculationInput } from "../../src/cpq/types";
export const cpqInstance = "c0860000-0000-4000-8000-000000000001";
export const cpqInput = (): CalculationInput => ({
  pricing_date: "2026-10-12",
  instances: [
    {
      id: cpqInstance,
      label: "SYN sensor assembly",
      facts: { count: "2", install: true },
    },
  ],
  overrides: [],
});
export const cpqDefinition = (): Definition => ({
  schema_version: 1,
  label: "SYN sensor package — software fixture only",
  currency: "AUD",
  facts: [
    {
      key: "count",
      label: "Sensor count",
      type: "Decimal",
      unit: "each",
      required: true,
      choices: [],
    },
    {
      key: "install",
      label: "Include installation",
      type: "Boolean",
      unit: "choice",
      required: true,
      choices: [],
    },
  ],
  parts: [
    {
      key: "sensor",
      description: "SYN sensor",
      category: "Product",
      unit: "each",
      resolver: "SUM",
      source: "SYN explicit fictional cost source",
      effective_from: "2026-01-01",
      effective_to: "2026-12-31",
      tiers: [
        { minimum: "0.001", unit_cost: "10.00", unit_sell: "15.00" },
        { minimum: "10.000", unit_cost: "9.00", unit_sell: "14.00" },
      ],
    },
    {
      key: "installation",
      description: "SYN installation",
      category: "Labour",
      unit: "hour",
      resolver: "SUM",
      source: "SYN fictional labour rate",
      effective_from: "2026-01-01",
      effective_to: "2026-12-31",
      tiers: [{ minimum: "0.001", unit_cost: "50.00", unit_sell: "75.00" }],
    },
  ],
  rules: [
    {
      key: "sensors",
      description: "Count selected sensors",
      phase: "Materials",
      when: { op: "GT", fact: "count", value: "0" },
      part: "sensor",
      quantity: "count",
      priority: 1,
    },
    {
      key: "install_sensors",
      description: "Install resolved sensors",
      phase: "Labour",
      when: { op: "EQ", fact: "install", value: true },
      part: "installation",
      quantity: "bom_sensor / 2",
      priority: 1,
    },
  ],
  constraints: [
    {
      key: "capacity",
      when: { op: "EQ", fact: "install", value: true },
      require: { op: "LTE", fact: "count", value: "20" },
      message: "SYN fixture supports installation of at most 20 sensors.",
    },
  ],
  fixtures: [
    {
      name: "Two sensors with installation",
      input: cpqInput(),
      expected: {
        ready: true,
        cost: "70.00",
        sell: "105.00",
        diagnostic_codes: [],
      },
    },
  ],
});
