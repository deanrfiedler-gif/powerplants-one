"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { createContext, useContext, useState, type ReactNode } from "react";
import { SecondaryMenuFrame, useSecondaryMenu } from "../shell/secondary-menu";
import { ShellIcon } from "./shell-icon";
import { usePhoneHeader } from "../shell/phone-header";
import {
  facilityViews,
  type FacilityViewCounts,
} from "../shared/facilities/presentation";

const ViewCounts = createContext<
  (counts: FacilityViewCounts | undefined) => void
>(() => {});
export const useFacilityViewCounts = () => useContext(ViewCounts);
export function FacilityShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true),
    [counts, setCounts] = useState<FacilityViewCounts>();
  const menu = useSecondaryMenu(open, setOpen),
    path = usePathname(),
    params = useSearchParams();
  const openFilters = (opener: HTMLElement) =>
    window.dispatchEvent(
      new CustomEvent("ppo-facility-filters", { detail: opener }),
    );
  usePhoneHeader(
    path === "/facilities"
      ? {
          title: "Facilities",
          chooseView: {
            open: (opener) => menu.toggle(opener),
            expanded: open,
            controls: "facility-menu",
          },
          pageAction: {
            label: "Search facilities",
            icon: "search",
            search: true,
            onSelect: openFilters,
          },
          filter: {
            open: openFilters,
            applied: ["q", "site_id", "structure_type", "use"].some(
              (key) => !!params.get(key),
            ),
          },
        }
      : null,
  );
  if (path !== "/facilities")
    return (
      <div
        id="ppo-facilities"
        className="facility-record-host"
        data-module-layout="full-bleed"
        data-module-scope="CS-05"
      >
        {children}
      </div>
    );
  const view = params.get("area_view") ?? "all";
  return (
    <ViewCounts.Provider value={setCounts}>
      <SecondaryMenuFrame
        presentation="figma"
        id="ppo-facilities"
        name="Facilities and areas"
        menuId="facility-menu"
        contentId="facility-content"
        state={menu}
        attributes={{ "data-module-scope": "CS-05" }}
        message=""
        menu={
          <nav aria-label="Facilities and shared records">
            <ul>
              {[
                {
                  href: "/customers",
                  label: "Organisations",
                  icon: "customers" as const,
                },
                { href: "/people", label: "People", icon: "contacts" as const },
                { href: "/sites", label: "Sites", icon: "sites" as const },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>
                    <ShellIcon name={item.icon} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <h2 className="facility-menu-heading">Facilities &amp; areas</h2>
            <ul>
              {Object.entries(facilityViews).map(([key, label]) => {
                const next = new URLSearchParams(params);
                next.set("area_view", key);
                return (
                  <li key={key}>
                    <Link
                      href={`/facilities?${next}`}
                      aria-current={view === key ? "page" : undefined}
                      onClick={() => menu.closeOverlay(false)}
                    >
                      <ShellIcon
                        name={
                          key === "incomplete"
                            ? "help"
                            : key === "growing"
                              ? "sites"
                              : "overview"
                        }
                      />
                      <span>{label}</span>
                      <small>
                        {counts?.[key as keyof FacilityViewCounts] ?? ""}
                      </small>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <h2 className="facility-menu-heading">Related</h2>
            <ul>
              <li>
                <Link href="/surveys">
                  <ShellIcon name="work" />
                  <span>Site surveys &amp; as-found</span>
                </Link>
              </li>
              <li>
                <Link href="/equipment">
                  <ShellIcon name="equipment" />
                  <span>Equipment</span>
                </Link>
              </li>
            </ul>
          </nav>
        }
      >
        <div className="facility-host">{children}</div>
      </SecondaryMenuFrame>
    </ViewCounts.Provider>
  );
}
