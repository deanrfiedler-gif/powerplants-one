"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { useIdentity } from "./business-session";
import { useScopePreferences } from "./scope-preferences";
import { SecondaryMenuFrame, useSecondaryMenu } from "../shell/secondary-menu";
import "./fertigation-workbench.css";

export const fertigationViews = [
  ["overview", "Overview"],
  ["growing", "Growing areas & irrigation"],
  ["water", "Water & hydraulics"],
  ["recipes", "Recipes & dosing"],
  ["controls", "Controls & I/O"],
  ["operating", "Operating plan"],
  ["configurator", "Unit configurator"],
  ["evidence", "Evidence & delivery"],
  ["review", "Scope review"],
] as const;
export type FertigationView = (typeof fertigationViews)[number][0];

export function FertigationFrame({
  children,
  view,
  onView,
  sourceHref,
  message = "",
}: {
  children: ReactNode;
  view?: FertigationView;
  onView?: (view: FertigationView) => void;
  sourceHref?: string;
  message?: string;
}) {
  const identity = useIdentity();
  const preference = useScopePreferences(
    `${identity.workspace_id}:${identity.actor_id}:fertigation`,
  );
  const menu = useSecondaryMenu(preference.value.menu, (open) =>
    preference.save({ ...preference.value, menu: open }),
  );
  return (
    <SecondaryMenuFrame
      state={menu}
      id="ppo-fertigation"
      name="Fertigation"
      menuId="fertigation-menu"
      contentId="fertigation-content"
      message={message}
      menu={
        <>
          <div className="mw-menu-title">
            <strong>Fertigation</strong>
          </div>
          <nav aria-label="Fertigation views">
            <ul>
              <li>
                <Link href="/estimating/fertigation">Scope register</Link>
              </li>
              {onView &&
                fertigationViews.map(([id, label]) => (
                  <li key={id}>
                    <button
                      type="button"
                      aria-current={view === id ? "page" : undefined}
                      onClick={() => {
                        onView(id);
                        menu.closeOverlay(false);
                      }}
                    >
                      {label}
                    </button>
                  </li>
                ))}
              <li>
                <Link href={sourceHref ?? "/estimating/discovery"}>
                  {sourceHref
                    ? "Return to Discovery alternative"
                    : "Discovery workspaces"}
                </Link>
              </li>
            </ul>
          </nav>
          <p className="fn-menu-note">
            ES-02 · Fertigation
            <br />
            Native scope capture
            <br />
            Supplier confirmation remains separate
          </p>
        </>
      }
    >
      {children}
    </SecondaryMenuFrame>
  );
}
