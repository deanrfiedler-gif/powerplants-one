"use client";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { SecondaryMenuFrame, useSecondaryMenu } from "../shell/secondary-menu";
import { ShellIcon } from "./shell-icon";

export function FacilityShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true);
  const menu = useSecondaryMenu(open, setOpen);
  return (
    <SecondaryMenuFrame
      id="ppo-facilities"
      name="Customer locations"
      menuId="facility-menu"
      contentId="facility-content"
      state={menu}
      attributes={{ "data-module-scope": "CS-05" }}
      message=""
      menu={
        <>
          <div className="mw-menu-title">
            <strong>Customer locations</strong>
            <span>Shared records</span>
          </div>
          <nav aria-label="Customer locations">
            <ul>
              {[
                {
                  href: "/customers",
                  label: "Customers",
                  icon: "customers" as const,
                },
                { href: "/people", label: "Contacts", icon: "person" as const },
                { href: "/sites", label: "Sites", icon: "sites" as const },
                {
                  href: "/facilities",
                  label: "Facilities & growing areas",
                  icon: "sites" as const,
                },
                {
                  href: "/equipment",
                  label: "Equipment",
                  icon: "engineering" as const,
                },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={
                      item.href === "/facilities" ? "page" : undefined
                    }
                    onClick={() => menu.closeOverlay(false)}
                  >
                    <ShellIcon name={item.icon} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </>
      }
    >
      <div className="facility-host">{children}</div>
    </SecondaryMenuFrame>
  );
}
