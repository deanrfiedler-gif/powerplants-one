import { structuredDiscovery } from "./estimating-configuration";
import { equipmentCatalogueDefinition } from "../../src/estimating/equipment-catalogue";
import type { Configuration } from "../../src/estimating/configuration-definition";

// Explicit fictional fixture choices, never a migration or operational mapping.
export function classifySyntheticConfiguration(
  c: Configuration,
): Configuration {
  return {
    ...structuredClone(c),
    schema_version: 2,
    definition_id: equipmentCatalogueDefinition,
    systems: c.systems.map((s) => {
      const classification =
        s.family === "ControlsClimate"
          ? {
              family: "Controls" as const,
              category_id: "controls-priva-compass" as const,
            }
          : s.family === "Fertigation"
            ? {
                family: "Water" as const,
                category_id: "water-priva-nutrijet-inline" as const,
              }
            : s.family === "MonitoringWeather"
              ? {
                  family: "Controls" as const,
                  category_id: "controls-sensors-weather-stations" as const,
                }
              : { family: "Infrastructure" as const, category_id: null };
      return { ...structuredClone(s), ...classification };
    }),
  };
}
export function catalogueDiscovery(complete = false) {
  const input = structuredDiscovery(complete);
  return {
    ...input,
    configuration: classifySyntheticConfiguration(input.configuration),
  };
}
