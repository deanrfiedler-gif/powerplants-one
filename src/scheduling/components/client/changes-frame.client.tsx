"use client";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  SecondaryMenuFrame,
  useSecondaryMenu,
} from "../../../shell/secondary-menu";
import type { PhoneHeaderConfig } from "../../../shell/phone-header";
import { ShellIcon, type ShellIconName } from "../../../components/shell-icon";
import { useResource, type Envelope } from "../../../components/business-ui";
import {
  useCurrentLocationSearch,
  notifyLocationSearchChanged,
} from "../../../components/current-location-search";
import { plannerContext } from "../../navigation";
import { addDays, utcFromLocal } from "../../time";
import { changeQueues, type ChangeQueue } from "../../changes-model";

export function useChangesWindow(path = "/schedule/changes") {
  const search = useCurrentLocationSearch(),
    context = plannerContext(new URLSearchParams(search.toString()));
  const days = [7, 28, 90].includes(Number(search.get("days")))
    ? Number(search.get("days"))
    : 7;
  const query = new URLSearchParams({
    from: utcFromLocal(context.day + "T00:00", context.zone),
    to: utcFromLocal(addDays(context.day, days) + "T00:00", context.zone),
    timezone: context.zone,
    ...(context.site ? { site_id: context.site } : {}),
    ...(context.resource ? { resource_id: context.resource } : {}),
  });
  const sites =
    useResource<Envelope<{ id: string; display_name: string }>>(
      "sites?limit=100",
    );
  function update(values: Record<string, string>) {
    const next = new URLSearchParams(window.location.search);
    Object.entries(values).forEach(([k, v]) =>
      v ? next.set(k, v) : next.delete(k),
    );
    window.history.replaceState(null, "", path + "?" + next);
    notifyLocationSearchChanged();
  }
  return { search, context, days, query, sites, update };
}
const icons: Record<ChangeQueue, ShellIconName> = {
  review: "recovery",
  requests: "work",
  contact: "contacts",
  cancellations: "close",
  history: "calendar",
};
export function ChangesFrame({
  children,
  selected,
  counts,
  query,
  onQueue,
  phoneHeader,
}: {
  children: ReactNode;
  selected?: ChangeQueue | "policy";
  counts?: Record<ChangeQueue, number>;
  query: URLSearchParams;
  onQueue?: (queue: ChangeQueue) => void;
  phoneHeader?: PhoneHeaderConfig;
}) {
  const [open, setOpen] = useState(true),
    menu = useSecondaryMenu(open, setOpen);
  const context = plannerContext(query);
  const base = new URLSearchParams({
    day: context.day,
    timezone: context.zone,
    ...(context.site ? { site_id: context.site } : {}),
    ...(context.resource ? { resource_id: context.resource } : {}),
    ...(query.get("days") ? { days: query.get("days")! } : {}),
  });
  const link = (path: string) => path + "?" + base;
  return (
    <SecondaryMenuFrame
      id="ppo-schedule-changes"
      state={menu}
      name="Changes and follow-up"
      menuId="changes-menu"
      contentId="changes-content"
      message=""
      phoneHeader={
        phoneHeader ?? {
          title: selected === "policy" ? "Policy impact" : "Changes",
        }
      }
      menu={
        <nav aria-label="Scheduling workspace">
          <div className="mw-menu-group">
            <ul>
              <li>
                <Link className="mw-menu-link" href={link("/schedule")}>
                  <ShellIcon name="calendar" />
                  <span>Planner</span>
                </Link>
              </li>
              <li>
                <Link
                  className="mw-menu-link"
                  href={link("/service/technicians")}
                >
                  <ShellIcon name="contacts" />
                  <span>Resources</span>
                </Link>
              </li>
            </ul>
          </div>
          <div className="mw-menu-group">
            <h3>Changes &amp; follow-up</h3>
            <ul>
              {changeQueues.map((q) => (
                <li key={q.id}>
                  <Link
                    className="mw-menu-link"
                    href={link("/schedule/changes") + "&queue=" + q.id}
                    aria-current={selected === q.id ? "page" : undefined}
                    onClick={
                      onQueue
                        ? (e) => {
                            e.preventDefault();
                            onQueue(q.id);
                            menu.closeOverlay();
                          }
                        : undefined
                    }
                  >
                    <ShellIcon name={icons[q.id]} />
                    <span>{q.label}</span>
                    {counts && (
                      <small className="mw-badge">{counts[q.id]}</small>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="mw-menu-group">
            <h3>Reviews</h3>
            <ul>
              {[
                ["/schedule/policy-impact", "Policy impact", "settings"],
                ["/schedule/travel", "Travel review", "sites"],
                ["/schedule/capacity", "Demand & capacity", "work"],
              ].map(([path, label, icon]) => (
                <li key={path}>
                  <Link
                    className="mw-menu-link"
                    aria-current={
                      path.endsWith("policy-impact") && selected === "policy"
                        ? "page"
                        : undefined
                    }
                    href={link(path)}
                  >
                    <ShellIcon name={icon as ShellIconName} />
                    <span>{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      }
    >
      {children}
    </SecondaryMenuFrame>
  );
}
