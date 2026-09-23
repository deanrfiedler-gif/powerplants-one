"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import type { SeverityCounts } from "../estimating/fertigation/guidance";
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

/** Menu grouping follows the scoping sequence; view order is unchanged. */
export const fertigationViewGroups: [string, FertigationView[]][] = [
  ["Define the farm", ["overview", "growing", "water", "recipes"]],
  ["Test the operating basis", ["controls", "operating", "configurator"]],
  ["Prepare the scope", ["evidence", "review"]],
];

const countWords = (c: SeverityCounts) =>
  [
    c.conflict &&
      `${c.conflict} ${c.conflict === 1 ? "conflict" : "conflicts"}`,
    c.incomplete && `${c.incomplete} incomplete`,
    c.review && `${c.review} for review`,
  ]
    .filter(Boolean)
    .join(", ");

/** Visual only; the words are given by aria-describedby outside the button,
 * so each view keeps its exact accessible name. */
function ViewBadge({ counts }: { counts?: SeverityCounts }) {
  if (!counts?.total) return null;
  const tone = counts.conflict
    ? "conflict"
    : counts.incomplete
      ? "incomplete"
      : "review";
  return (
    <span className={`mw-badge fn-badge-${tone}`} aria-hidden="true">
      {tone === "conflict" && (
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M12 4 2.5 20h19z" />
          <path d="M12 10v4" />
        </svg>
      )}
      {counts[tone]}
    </span>
  );
}

export function FertigationFrame({
  children,
  view,
  onView,
  sourceHref,
  message = "",
  counts,
  summary,
}: {
  children: ReactNode;
  view?: FertigationView;
  onView?: (view: FertigationView) => void;
  sourceHref?: string;
  message?: string;
  /** Open findings per view, from the calculation the page is showing. */
  counts?: Partial<Record<FertigationView, SeverityCounts>>;
  summary?: ReactNode;
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
          {summary}
          <nav aria-label="Fertigation views">
            <ul>
              <li>
                <Link href="/estimating/fertigation">Scope register</Link>
              </li>
            </ul>
            {onView &&
              fertigationViewGroups.map(([group, ids]) => (
                <div key={group} className="fn-menu-group">
                  <p className="fn-menu-group-title" id={`fn-menu-${ids[0]}`}>
                    {group}
                  </p>
                  <ul aria-labelledby={`fn-menu-${ids[0]}`}>
                    {ids.map((id) => {
                      const label = fertigationViews.find(
                        ([v]) => v === id,
                      )![1];
                      const c = counts?.[id];
                      return (
                        <li key={id}>
                          <button
                            type="button"
                            aria-current={view === id ? "page" : undefined}
                            aria-describedby={
                              c?.total ? `fn-count-${id}` : undefined
                            }
                            onClick={() => {
                              onView(id);
                              menu.closeOverlay(false);
                            }}
                          >
                            <span className="fn-menu-label">{label}</span>
                            <ViewBadge counts={c} />
                          </button>
                          {!!c?.total && (
                            <span id={`fn-count-${id}`} className="sr-only">
                              {countWords(c)}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            <ul>
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
