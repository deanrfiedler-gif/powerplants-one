"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useShell } from "../../../components/shell-provider";
import { plannerContext } from "../../navigation";

export function SchedulingNavigation() {
  const { context } = useShell(),
    path = usePathname(),
    search = useSearchParams();
  if (!context?.navigation.includes("planner")) return null;
  const c = plannerContext(new URLSearchParams(search.toString()));
  const query = new URLSearchParams({
    day: c.day,
    timezone: c.zone,
    ...(c.site ? { site_id: c.site } : {}),
    ...(c.resource ? { resource_id: c.resource } : {}),
  });
  return (
    <nav className="scheduling-navigation" aria-label="Scheduling workspace">
      {[
        ["/schedule", "Planner"],
        ["/service/technicians", "Resources"],
        ["/schedule/changes", "Changes & follow-up"],
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
