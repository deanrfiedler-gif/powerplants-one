import type {
  SiteRow,
  SitesData,
  SiteWorkSource,
} from "../../src/shared/sites-model";
import type { EquipmentRow } from "../../src/equipment/model";
export const siteId = "70000000-0000-4000-8000-000000000001";
export const siteFixture: SiteRow = {
  id: siteId,
  company_id: "20000000-0000-4000-8000-000000000001",
  version: 1,
  display_name: "SYN Glasshouse 4",
  display_number: "SYN-SITE-000012",
  legacy_display_number: "SYN-PPO-SITE-000012",
  location_description: "Gatton, QLD",
  address: "142 Valley Rd, Gatton QLD 4343",
  timezone: "Australia/Brisbane",
  access_instructions:
    "Gate code from Priya Shah on the day; park at the packing shed.",
  biosecurity_notes: "Footbath at entry; no plant material between houses.",
  address_recorded: true,
  biosecurity_recorded: true,
  customers: [
    {
      id: "50000000-0000-4000-8000-000000000001",
      name: "Hillview Growers",
      role: "Operator",
    },
    {
      id: "50000000-0000-4000-8000-000000000002",
      name: "Valley Land Trust",
      role: "Owner",
    },
  ],
  primary_contact: {
    id: "60000000-0000-4000-8000-000000000001",
    name: "Priya Shah",
    phone: "+61 400 000 001",
    email: null,
  },
  areas: 6,
  equipment: 14,
  next_visit: {
    id: "d1000000-0000-4000-8000-000000000052",
    display_number: "SYN-PPO-APT-000052",
    start_at: "2031-10-15T22:00:00Z",
    end_at: "2031-10-16T01:00:00Z",
    status: "Confirmed",
  },
  last_visit: null,
  visits_state: "Available",
  readiness: "Check in CS-06",
  can_edit: true,
  can_request: true,
  can_follow_up: true,
};
export const sitesFixture: SitesData = {
  items: [
    siteFixture,
    ...[
      "SYN Block C Plant Room",
      "SYN Coastal Berries",
      "SYN Greenhouse 2",
      "SYN Hillview Growers",
      "SYN Isolation House",
      "SYN Nutrient Room",
    ].map((name, i) => ({
      ...siteFixture,
      id: `70000000-0000-4000-8000-${String(i + 2).padStart(12, "0")}`,
      display_name: name,
      display_number: `SYN-SITE-${String(i + 13).padStart(6, "0")}`,
      legacy_display_number: `SYN-PPO-SITE-${String(i + 13).padStart(6, "0")}`,
      next_visit: null,
      readiness: "No upcoming permitted visit" as const,
      biosecurity_recorded: i !== 2,
      address_recorded: i !== 5,
    })),
  ],
  total: 7,
  counts: { All: 7, Readiness: 1, Biosecurity: 1, Address: 1 },
  customers: [{ id: siteFixture.customers[0].id, label: "Hillview Growers" }],
  observed_at: "2026-10-20T00:00:00Z",
  next_cursor: null,
};
export const siteSources: SiteWorkSource[] = [
  {
    name: "Next visit",
    state: "Available",
    items: [
      {
        id: siteFixture.next_visit!.id,
        reference: "SYN-PPO-APT-000052",
        title: "Shade screen motor replacement",
        detail: "Confirmed visit; P4 unavailable",
        href: `/service/appointments/${siteFixture.next_visit!.id}`,
        kind: "Visit",
      },
    ],
  },
  {
    name: "Work orders",
    state: "Available",
    items: [
      {
        id: "d0000000-0000-4000-8000-000000000040",
        reference: "SYN-PPO-WO-000040",
        title: "Shade screen motor replacement",
        detail: "Authorised",
        href: "/service/work-orders/d0000000-0000-4000-8000-000000000040",
        kind: "Work order",
      },
    ],
  },
  {
    name: "Follow-ups",
    state: "Available",
    items: [
      {
        id: "a0000000-0000-4000-8000-000000000001",
        reference: "",
        title: "Call the grower about Thursday",
        detail: "Open",
        href: "/work/a0000000-0000-4000-8000-000000000001",
        kind: "Follow-up",
      },
    ],
  },
];
export const equipmentFixture: EquipmentRow[] = [
  "Shade screen motor M-4",
  "Shade screen motor M-3",
  "Vent actuator VA-41",
  "Temperature sensor TS-4",
  "Climate controller CC-4",
  "Irrigation valve bank VB-4",
].map((description, i) => ({
  id: `80000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
  version: 1,
  company_id: siteFixture.company_id,
  display_number: `SYN-PPO-AST-${String(i + 1).padStart(6, "0")}`,
  description,
  manufacturer: null,
  model: null,
  serial: null,
  identity_status: i === 2 ? "Unresolved" : "Verified",
  lifecycle_status: "Active",
  site_id: siteId,
  site_name: siteFixture.display_name,
  address: null,
  facility_id: `71000000-0000-4000-8000-00000000000${i < 4 ? 1 : 2}`,
  installed_name: i < 4 ? "Glasshouse 4" : "Packing shed and pump shed",
  customers: [],
  served: [
    {
      id: "71000000-0000-4000-8000-000000000003",
      name: i < 4 ? "Shade screen, whole house" : "Glasshouse 4, all bays",
      source_id: "synthetic-cs04-test",
    },
  ],
  moved: false,
}));
