import { transaction } from "../platform/database";
import type { Principal } from "../platform/identity";
import { AppError } from "../platform/errors";
import { hasPermission } from "../platform/permissions";
import { requireAccessInspection } from "../access/service";
import { accessRequests } from "../access/requests";
import { isHostedDemo } from "../platform/demo-config";
import { listRecovery } from "../offline/recovery";
import { readBusinessPolicies } from "./policies";
import { policyReadAuthority } from "../scheduling/policy-authority";
// All nine accepted areas remain explicit. A missing destination has no invented
// permission or placeholder route. Its own scope must provide those before opening.
export const configurationAreas = [
  {
    id: "policies",
    name: "Business policies",
    scope: "AD-02",
    href: "/admin/policies",
    status: "Built",
    description:
      "Scheduling, field readiness, working hours and record references.",
  },
  {
    id: "access",
    name: "Users and access",
    scope: "AD-01",
    href: "/admin/access",
    status: "Built",
    description: "People, roles, teams and independent access review.",
  },
  {
    id: "integrations",
    name: "Integrations",
    scope: "AD-04 · AD-05",
    href: null,
    status: "Settings page not built",
    description:
      "MYOB remains the intended ERP authority; this prototype has no live connection.",
  },
  {
    id: "templates",
    name: "Templates",
    scope: "DK-06",
    href: null,
    status: "Backend built; management page not yet merged",
    description:
      "Controlled templates and publication; the management screen is in a separate build.",
  },
  {
    id: "assistant",
    name: "Assistant",
    scope: "AI-06",
    href: null,
    status: "Settings page not built",
    description: "Assistant configuration belongs to its own scope.",
  },
  {
    id: "quality",
    name: "Data quality",
    scope: "AD-03",
    href: null,
    status: "Page not built",
    description: "Checks for missing, duplicate or conflicting records.",
  },
  {
    id: "retention",
    name: "Retention",
    scope: "AD-08",
    href: null,
    status: "Page not built",
    description: "Retention and information lifecycle.",
  },
  {
    id: "workshop",
    name: "Workshop",
    scope: "CX-02",
    href: null,
    status: "Settings page not built",
    description: "Workshop assembly, testing and rework configuration.",
  },
  {
    id: "health",
    name: "Health and recovery",
    scope: "AD-09",
    href: "/admin",
    status: "Exceptions and recovery built",
    description:
      "Retained field evidence and links to responsible recovery workflows.",
  },
] as const;
export type AttentionItem = {
  id: string;
  title: string;
  detail: string;
  href: string;
};
async function permitted<T>(read: () => Promise<T>): Promise<T | null> {
  try {
    return await read();
  } catch (error) {
    if (
      error instanceof AppError &&
      (error.status === 403 || error.code === "WorkingCompanySelected")
    )
      return null;
    throw error; // A failed source is never converted into an empty/healthy result.
  }
}
export async function readSettings(p: Principal) {
  const allowed = new Set<string>();
  const attention: AttentionItem[] = [];
  const policies = await permitted(() => readBusinessPolicies(p));
  if (policies) {
    allowed.add("policies");
    for (const row of policies.items.filter((r) => r.proposal_id))
      attention.push({
        id: row.id,
        title: `${row.name} · ${row.state.toLowerCase()}`,
        detail: `Proposed version ${row.next_version}. Open the exact saved proposal and review before publishing.`,
        href: `/admin/policies/${row.id}`,
      });
  }
  const access = await permitted(() =>
    transaction(async (c) => {
      await requireAccessInspection(c, p);
      return true;
    }),
  );
  if (access) {
    allowed.add("access");
    if (!isHostedDemo()) {
      const requests = await permitted(() =>
        accessRequests(p, { state: "Submitted" }),
      );
      for (const row of requests?.items ?? [])
        attention.push({
          id: String(row.id),
          title: `${row.subject_name} · access request waiting`,
          detail: `${row.subject_name}'s request waits for ${row.reviewer_name}'s independent decision.`,
          href: `/admin/access/requests/${row.id}`,
        });
    }
  }
  const recoveryAllowed = await transaction(async (c) => {
    for (const cap of [
      "shared.read",
      "finance.read",
      "service.work_order.read",
      "field.read.own",
    ] as const)
      if (await hasPermission(c, p, cap)) return true;
    return false;
  });
  if (recoveryAllowed) {
    allowed.add("health");
    const recovery = await permitted(() => listRecovery(p));
    for (const row of recovery?.items ?? [])
      attention.push({
        id: String(row.case_id),
        title: "Retained field evidence needs review",
        detail:
          "Open the owned original and continue in its responsible workflow.",
        href: `/admin/recovery/${row.case_id}`,
      });
  }
  // Recheck at aggregate disclosure: a later source may have waited for locks.
  await transaction(async (c) => {
    if (allowed.has("policies")) await policyReadAuthority(c, p);
    if (allowed.has("access")) await requireAccessInspection(c, p);
    if (allowed.has("health")) {
      let current = false;
      for (const cap of [
        "shared.read",
        "finance.read",
        "service.work_order.read",
        "field.read.own",
      ] as const)
        current ||= await hasPermission(c, p, cap);
      if (!current)
        throw new AppError(
          403,
          "Forbidden",
          "Configuration access changed. Refresh before continuing.",
        );
    }
  });
  return {
    foundation_available: !isHostedDemo(),
    policy_summary: policies ? { count: policies.items.length } : null,
    areas: configurationAreas.filter((a) => a.href && allowed.has(a.id)),
    attention,
    read_at: new Date().toISOString(),
    viewer: p.display_name,
  };
}
