"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useShell } from "../../../components/shell-provider";
import { plannerContext } from "../../navigation";

export function SchedulingNavigation({ side = false }: { side?: boolean }) {
  const { context, error } = useShell(),
    path = usePathname(),
    search = useSearchParams();
  // F13: the page can paint before the shell context names its permissions. Hold the tab row
  // until then (a placeholder anchor with no href takes the tabs' height), so the page below
  // does not move down when the tabs arrive. Without the Planner permission the row still goes.
  if (!context && !error)
    return (
      <nav className={side ? "pl01-navigation" : "scheduling-navigation"} aria-label="Scheduling workspace" aria-hidden>
        <a className="scheduling-navigation-placeholder">&nbsp;</a>
      </nav>
    );
  if (!context?.navigation.includes("planner")) return null;
  const c = plannerContext(new URLSearchParams(search.toString()));
  const query = new URLSearchParams({
    day: c.day,
    timezone: c.zone,
    ...(c.site ? { site_id: c.site } : {}),
    ...(c.resource ? { resource_id: c.resource } : {}),
  });
  return (
    <nav className={side ? "pl01-navigation" : "scheduling-navigation"} aria-label="Scheduling workspace">
      {[
        ["/schedule", "Planner"],
        ["/service/technicians", "Resources"],
        ["/schedule/changes", "Changes & follow-up"],
        ["/schedule/policy-impact", "Policy impact"],
        ["/schedule/travel", "Travel review"],
        ["/schedule/capacity", "Demand & capacity"],
      ].map(([href, label]) => (
        <Link
          key={href}
          href={href + "?" + query}
          aria-current={
            path === href ||
            (href === "/service/technicians" && path.startsWith(href + "/"))
              ? "page"
              : undefined
          }
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
