export type TeamProposalPerson = {
  id: string;
  name: string;
  designOnly: boolean;
};
export type TeamProposal = {
  id: string;
  name: string;
  purpose: string;
  lead: TeamProposalPerson;
  members: (TeamProposalPerson & { from: string; to: string | null })[];
};
export type InspectedTeamPerson = TeamProposalPerson & {
  current: { id: string; display_name: string; active: boolean } | null;
};
export type TeamInspection = Omit<TeamProposal, "lead" | "members"> & {
  lead: InspectedTeamPerson;
  members: (InspectedTeamPerson & { from: string; to: string | null })[];
};

// Retained examples, never assigned memberships or permission inputs.
// Unit proof binds every field to docs/design/access-review/model.js.
export const teamExampleDate = "2026-09-17";
const person = (
  n: number,
  name: string,
  designOnly = false,
): TeamProposalPerson => ({
  id: `${designOnly ? "3a" : "30"}000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
  name,
  designOnly,
});
const member = (
  n: number,
  name: string,
  from: string,
  to: string | null = null,
  designOnly = false,
) => ({
  ...person(n, name, designOnly),
  from,
  to,
});
export const teamProposals: TeamProposal[] = [
  {
    id: "team-service",
    name: "Service coordination",
    purpose: "Planned service coordination and field delivery for Company A.",
    lead: person(3, "SYN Service team lead", true),
    members: [
      member(1, "SYN Coordinator", "2026-01-01"),
      member(10, "SYN Riley Technician", "2026-03-01"),
      member(5, "SYN Site observer", "2026-09-10"),
      member(5, "SYN Former coordinator", "2026-01-01", "2026-09-12", true),
    ],
  },
  {
    id: "team-finance",
    name: "Finance handoff",
    purpose:
      "Synthetic Finance handoff preparation, review, processing and reconciliation.",
    lead: person(12, "SYN Finance reviewer"),
    members: [
      member(7, "SYN Finance context reviewer", "2026-01-01"),
      member(12, "SYN Finance reviewer", "2026-01-01"),
      member(13, "SYN Finance processor", "2026-01-01"),
      member(14, "SYN Finance reconciler", "2026-01-01"),
    ],
  },
];
