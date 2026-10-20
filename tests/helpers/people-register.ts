import type {
  PeopleRegisterData,
  PeopleRegisterRow,
} from "../../src/shared/people-register-model";

// Synthetic composition from PPO - Design, 1395:150312 / 1395:151069,
// named version People — accepted. IDs are local fixture identities, never external keys.
export const peopleFixtureId = (n: number) =>
  `e6240000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const entries = [
  [
    "Ava Singh",
    "SYN Riverbend Nursery",
    "Owner",
    "0491 570 159",
    "ava.singh@riverbend.example",
    "Phone",
  ],
  [
    "Dana Brooks",
    "SYN Isolation Nursery",
    "Biosecurity officer",
    "0491 570 158",
    "dana.brooks@isolation.example",
    "Email",
  ],
  [
    "Grace Lin",
    "Valley Land Trust",
    "Property manager",
    "0491 570 313",
    "grace.lin@valleyland.example",
    "Email",
  ],
  ["Leo Park", "SYN Greenhouse Growers", "Grower", "0491 570 157", "", "Phone"],
  [
    "Mei Tan",
    "Coastal Berries",
    "Farm manager",
    "0491 570 156",
    "mei.tan@coastalberries.example",
    "Email",
  ],
  [
    "Noah Clarke",
    "Hillview Growers",
    "Accounts payable",
    "0491 570 110",
    "accounts@hillview.example",
    "Email",
  ],
  [
    "Priya Shah",
    "Hillview Growers",
    "Grower",
    "0491 570 006",
    "priya.shah@hillview.example",
    "Phone",
  ],
  [
    "Tom Reyes",
    "Block C Growers",
    "Maintenance lead",
    "",
    "tom.reyes@blockc.example",
    "Email",
  ],
];
export function peopleRegisterFixture(): PeopleRegisterData {
  const items: PeopleRegisterRow[] = entries.map(
    ([display_name, org, role, phone, email, contact_preference], i) => ({
      id: peopleFixtureId(i + 1),
      display_name,
      phone: phone || null,
      email: email || null,
      contact_preference,
      active: true,
      organisations: [
        { id: peopleFixtureId(i === 6 ? 106 : 101 + i), name: org, role },
      ],
      sites:
        i === 1
          ? [{ id: peopleFixtureId(201), name: "SYN Isolation House" }]
          : i === 4
            ? [{ id: peopleFixtureId(204), name: "SYN Coastal Berries" }]
            : i === 6
              ? [
                  { id: peopleFixtureId(206), name: "SYN Hillview House" },
                  { id: peopleFixtureId(207), name: "SYN Hillview Nursery" },
                ]
              : [],
      notice_exceptions: i === 0 ? 2 : i === 6 ? 1 : 0,
      notices_restricted: false,
      history_restricted: false,
      last_correction: null,
    }),
  );
  return {
    items,
    total: 8,
    counts: { Active: 8, SiteContacts: 4, Channels: 2, Inactive: 1 },
    organisations: items
      .filter((_, i) => i !== 6)
      .map((row) => ({
        id: row.organisations[0].id,
        label: row.organisations[0].name,
      })),
    next_cursor: null,
    observed_at: "2026-10-12T23:00:00.000Z",
  };
}
