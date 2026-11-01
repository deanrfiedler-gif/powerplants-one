import { choice, narrative, object } from "../shared/validation";

export const SITE_READINESS = "CustomerSiteReadiness";
export const siteCheckKeys = [
  "access",
  "power_water",
  "equipment",
  "isolation",
] as const;
export type SiteCheck = {
  status: "Confirmed" | "NotReady" | "NotApplicable";
  note: string;
};
export type SiteChecks = Record<(typeof siteCheckKeys)[number], SiteCheck>;

export function siteChecks(input: unknown): SiteChecks {
  const checks = object(input, [...siteCheckKeys]);
  return Object.fromEntries(
    siteCheckKeys.map((key) => {
      const check = object(checks[key], ["status", "note"]);
      return [
        key,
        {
          status: choice(check.status, key, [
            "Confirmed",
            "NotReady",
            "NotApplicable",
          ]),
          note:
            check.note === undefined || check.note === ""
              ? ""
              : narrative(check.note, `${key}.note`, 1000),
        },
      ];
    }),
  ) as SiteChecks;
}

export function siteReadinessOutcome(
  contact: { outcome: string; occurred_at: Date; checks: SiteChecks } | null,
  opens: Date,
): "Pass" | "Blocked" | "Unknown" {
  if (!contact || contact.occurred_at < opens) return "Unknown";
  if (siteCheckKeys.some((key) => contact.checks[key].status === "NotReady"))
    return "Blocked";
  return contact.outcome === "Confirmed" ? "Pass" : "Unknown";
}

export type SitePreparation = {
  policy: { id: string; reference: string; version: number; synthetic: true };
  schedule_version: number;
  outcome: "Pass" | "Blocked" | "Unknown";
  contact_id: string | null;
  opens_at: string;
  confirmation_due_at: string;
  late: boolean;
  issue_due_at: string | null;
  calendar_status: string;
  issue_deadline_blocks_dispatch: false;
};
