// Frozen ES-02 r02 classification, from Dean's six-family list of 23 September 2026.
// Source: docs/decisions/es02-design-board.md section 3. IDs are issued internal
// identities: do not regenerate them when a label changes; issue a new definition.
export const equipmentCatalogueDefinition = "PPO-ES02-CONFIG-r02" as const;
export const equipmentCatalogue = [
  {
    id: "Climate",
    label: "Climate",
    categories: [
      {
        id: "climate-lighting",
        label: "Lighting",
      },
      {
        id: "climate-circulation-fans-priva",
        label: "Circulation fans – Priva",
      },
      {
        id: "climate-circulation-fans-other",
        label: "Circulation fans – other",
      },
      {
        id: "climate-exhaust-fans-ventilation",
        label: "Exhaust fans & ventilation",
      },
      {
        id: "climate-drive-systems-vents-screens",
        label: "Drive systems (vents & screens)",
      },
      {
        id: "climate-pad-fan-cooling",
        label: "Pad & fan cooling",
      },
      {
        id: "climate-fogging-humidification",
        label: "Fogging & humidification",
      },
      {
        id: "climate-heating-hydronic",
        label: "Heating – hydronic",
      },
      {
        id: "climate-heating-direct-fired-air",
        label: "Heating – direct-fired air",
      },
      {
        id: "climate-hvac-dehumidification",
        label: "HVAC & dehumidification",
      },
      {
        id: "climate-co2-systems",
        label: "CO2 systems",
      },
      {
        id: "climate-screens-shade-thermal",
        label: "Screens – shade / thermal",
      },
      {
        id: "climate-screens-blackout",
        label: "Screens – blackout",
      },
      {
        id: "climate-screens-outdoor",
        label: "Screens – outdoor",
      },
      {
        id: "climate-insect-screens",
        label: "Insect screens",
      },
      {
        id: "climate-roll-up-walls",
        label: "Roll-up walls",
      },
      {
        id: "climate-sulphur-burners",
        label: "Sulphur burners",
      },
    ],
  },
  {
    id: "Controls",
    label: "Controls",
    categories: [
      {
        id: "controls-priva-compass",
        label: "Priva Compass",
      },
      {
        id: "controls-priva-compact-cc",
        label: "Priva Compact CC",
      },
      {
        id: "controls-priva-connext",
        label: "Priva Connext",
      },
      {
        id: "controls-priva-fs-performance",
        label: "Priva FS Performance",
      },
      {
        id: "controls-priva-blue-id",
        label: "Priva Blue ID",
      },
      {
        id: "controls-grosound",
        label: "Grosound",
      },
      {
        id: "controls-maximizer",
        label: "Maximizer",
      },
      {
        id: "controls-minigrow",
        label: "Minigrow",
      },
      {
        id: "controls-multigrow",
        label: "Multigrow",
      },
      {
        id: "controls-omnigrow",
        label: "Omnigrow",
      },
      {
        id: "controls-nutridose",
        label: "Nutridose",
      },
      {
        id: "controls-sensors-weather-stations",
        label: "Sensors & weather stations",
      },
      {
        id: "controls-electrical-panels",
        label: "Electrical panels",
      },
      {
        id: "controls-switchboards-circuit-breakers",
        label: "Switchboards & circuit breakers",
      },
      {
        id: "controls-electrical-materials-installation",
        label: "Electrical materials & installation",
      },
    ],
  },
  {
    id: "Water",
    label: "Water",
    categories: [
      {
        id: "water-priva-nutrione",
        label: "Priva NutriOne",
      },
      {
        id: "water-priva-nutrifit",
        label: "Priva NutriFit",
      },
      {
        id: "water-priva-nutrijet-bypass",
        label: "Priva NutriJet (bypass)",
      },
      {
        id: "water-priva-nutrijet-inline",
        label: "Priva NutriJet (inline)",
      },
      {
        id: "water-priva-nutriflex",
        label: "Priva NutriFlex",
      },
      {
        id: "water-priva-nutrimix",
        label: "Priva NutriMix",
      },
      {
        id: "water-directjet-dosing",
        label: "DirectJet dosing",
      },
      {
        id: "water-easydose-dosing",
        label: "EasyDose dosing",
      },
      {
        id: "water-peridose-dosing",
        label: "PeriDose dosing",
      },
      {
        id: "water-dosing-racks",
        label: "Dosing racks",
      },
      {
        id: "water-neutralisers",
        label: "Neutralisers",
      },
      {
        id: "water-priva-vialux-hp",
        label: "Priva Vialux HP",
      },
      {
        id: "water-priva-vialux-m",
        label: "Priva Vialux M",
      },
      {
        id: "water-ecolux-recycling",
        label: "Ecolux recycling",
      },
      {
        id: "water-ro-ultrafiltration",
        label: "RO & ultrafiltration",
      },
      {
        id: "water-irrigation",
        label: "Irrigation",
      },
      {
        id: "water-wireless-irrigation-control",
        label: "Wireless irrigation control",
      },
      {
        id: "water-moisture-sensing-monitoring",
        label: "Moisture sensing & monitoring",
      },
      {
        id: "water-tanks",
        label: "Tanks",
      },
      {
        id: "water-stirrers",
        label: "Stirrers",
      },
    ],
  },
  {
    id: "Automation",
    label: "Automation",
    categories: [
      {
        id: "automation-javo-potting-machines",
        label: "Javo potting machines",
      },
      {
        id: "automation-tray-fillers",
        label: "Tray fillers",
      },
      {
        id: "automation-sowing-lines",
        label: "Sowing lines",
      },
      {
        id: "automation-seeding-drilling-dibbling",
        label: "Seeding – drilling / dibbling",
      },
      {
        id: "automation-transplanting-automatic",
        label: "Transplanting – automatic",
      },
      {
        id: "automation-transplanting-manual",
        label: "Transplanting – manual",
      },
      {
        id: "automation-conveyors",
        label: "Conveyors",
      },
      {
        id: "automation-buffer-belts",
        label: "Buffer belts",
      },
      {
        id: "automation-dispatch-systems-willburg",
        label: "Dispatch systems (Willburg)",
      },
      {
        id: "automation-forklifts-forks",
        label: "Forklifts & forks",
      },
      {
        id: "automation-pot-in-tray-robots",
        label: "Pot-in-tray robots",
      },
      {
        id: "automation-trailer-loaders",
        label: "Trailer loaders",
      },
      {
        id: "automation-benches-fixed",
        label: "Benches – fixed",
      },
      {
        id: "automation-benches-mobile",
        label: "Benches – mobile",
      },
      {
        id: "automation-benches-nft",
        label: "Benches – NFT",
      },
      {
        id: "automation-benches-sideshift",
        label: "Benches – sideshift",
      },
      {
        id: "automation-grow-systems-gutters",
        label: "Grow systems – gutters",
      },
      {
        id: "automation-grow-systems-mgs",
        label: "Grow systems – MGS",
      },
      {
        id: "automation-grow-systems-raft",
        label: "Grow systems – raft",
      },
      {
        id: "automation-trolleys-crop-pipe-rail",
        label: "Trolleys – crop (pipe-rail)",
      },
      {
        id: "automation-trolleys-crop-tyre",
        label: "Trolleys – crop (tyre)",
      },
      {
        id: "automation-trolleys-pick-pipe-rail",
        label: "Trolleys – pick (pipe-rail)",
      },
      {
        id: "automation-trolleys-pick-tyre",
        label: "Trolleys – pick (tyre)",
      },
      {
        id: "automation-trolleys-spray-pipe-rail",
        label: "Trolleys – spray (pipe-rail)",
      },
      {
        id: "automation-trolleys-spray-tyre",
        label: "Trolleys – spray (tyre)",
      },
      {
        id: "automation-trimming",
        label: "Trimming",
      },
      {
        id: "automation-labelling",
        label: "Labelling",
      },
      {
        id: "automation-washers",
        label: "Washers",
      },
      {
        id: "automation-vision-grading",
        label: "Vision grading",
      },
      {
        id: "automation-soil-handling",
        label: "Soil handling",
      },
      {
        id: "automation-soil-storage",
        label: "Soil storage",
      },
      {
        id: "automation-rockwool-handling",
        label: "Rockwool handling",
      },
      {
        id: "automation-automated-booms",
        label: "Automated booms",
      },
      {
        id: "automation-automated-watering",
        label: "Automated watering",
      },
      {
        id: "automation-growcoon-systems",
        label: "Growcoon systems",
      },
      {
        id: "automation-weed-control-equipment",
        label: "Weed-control equipment",
      },
      {
        id: "automation-automation-project-turnkey",
        label: "Automation project (turnkey)",
      },
      {
        id: "automation-other-nursery-automation",
        label: "Other nursery automation",
      },
    ],
  },
  {
    id: "Structures",
    label: "Structures",
    categories: [
      {
        id: "structures-greenhouses",
        label: "Greenhouses",
      },
      {
        id: "structures-greenhouse-construction",
        label: "Greenhouse construction",
      },
      {
        id: "structures-cravo-retractable-roof-structures",
        label: "Cravo retractable-roof structures",
      },
      {
        id: "structures-cravo-parts",
        label: "Cravo parts",
      },
      {
        id: "structures-cladding",
        label: "Cladding",
      },
      {
        id: "structures-flooring-weed-mat",
        label: "Flooring & weed mat",
      },
      {
        id: "structures-earthworks",
        label: "Earthworks",
      },
    ],
  },
  {
    id: "Services",
    label: "Services",
    categories: [
      {
        id: "services-project-management",
        label: "Project management",
      },
      {
        id: "services-design",
        label: "Design",
      },
      {
        id: "services-consulting",
        label: "Consulting",
      },
      {
        id: "services-training",
        label: "Training",
      },
      {
        id: "services-commissioning-standalone",
        label: "Commissioning (standalone)",
      },
      {
        id: "services-service",
        label: "Service",
      },
      {
        id: "services-maintenance-contracts",
        label: "Maintenance contracts",
      },
      {
        id: "services-site-costs-prelims",
        label: "Site costs & prelims",
      },
      {
        id: "services-freight-standalone",
        label: "Freight (standalone)",
      },
      {
        id: "services-extended-warranty",
        label: "Extended warranty",
      },
      {
        id: "services-post-handover-technical-support",
        label: "Post-handover technical support",
      },
    ],
  },
] as const;
export type CatalogueFamily = (typeof equipmentCatalogue)[number]["id"];
export type CategoryId =
  (typeof equipmentCatalogue)[number]["categories"][number]["id"];
export const equipmentCategories = equipmentCatalogue.flatMap((f) =>
  f.categories.map((c) => ({ ...c, family: f.id })),
);
// Shared infrastructure is deliberately outside the six equipment/service families.
export const catalogueGroups = [
  ...equipmentCatalogue.map(({ id, label }) => ({ id, label })),
  { id: "Infrastructure", label: "Shared infrastructure" },
] as const;
export function categoryBelongsToFamily(
  family: string,
  category: unknown,
): category is CategoryId {
  return (
    typeof category === "string" &&
    equipmentCategories.some((c) => c.id === category && c.family === family)
  );
}
