"use client";
import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import type { SeverityCounts } from "../estimating/fertigation/guidance";
import { calculationEdition } from "../estimating/fertigation/definition";
import { useIdentity } from "./business-session";
import { useScopePreferences } from "./scope-preferences";
import { SecondaryMenuFrame, useSecondaryMenu } from "../shell/secondary-menu";
import { FertigationIcon, type FertigationIconName } from "./fertigation-icons";
import { ShellIcon } from "./shell-icon";
import "./fertigation-workbench.css";
import "./fertigation-figma.css";

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

/** Menu grouping follows the scoping sequence (design board K); view order is unchanged. */
export const fertigationViewGroups: [string, FertigationView[]][] = [
  ["Define the farm", ["overview", "growing", "water", "recipes"]],
  ["Test the operating basis", ["controls", "operating", "configurator"]],
  ["Prepare the scope", ["evidence", "review"]],
];

export const viewLabel = (view: FertigationView) =>
  fertigationViews.find(([id]) => id === view)![1];

/** "Define the farm · 2 of 9": the group a view belongs to and its place in the sequence. */
export function viewEyebrow(view: FertigationView) {
  const group = fertigationViewGroups.find(([, ids]) => ids.includes(view))![0];
  const index = fertigationViews.findIndex(([id]) => id === view) + 1;
  return `${group} · ${index} of ${fertigationViews.length}`;
}

const countWords = (c: SeverityCounts) =>
  [
    c.conflict &&
      `${c.conflict} ${c.conflict === 1 ? "conflict" : "conflicts"}`,
    c.incomplete && `${c.incomplete} incomplete`,
    c.review && `${c.review} for review`,
  ]
    .filter(Boolean)
    .join(", ");

/** The conflict mark on fertigation chips and view badges: Font Awesome Light once the Kit is running
 * (ADR-0050), the outline triangle until then. Visual only; its words always stand beside it. */
export function ConflictMark() {
  return <FertigationIcon name="conflict" className="fn-mark" />;
}

/** Visual only; the words are given by aria-describedby outside the button,
 * so each view keeps its exact accessible name. */
function ViewBadge({
  counts,
  review = false,
}: {
  counts?: SeverityCounts;
  review?: boolean;
}) {
  if (!counts) return null;
  if (!counts.total && !review) return null;
  if (!counts.total)
    return (
      <span className="fn-menu-clear" aria-hidden="true">
        <FertigationIcon name="check" className="fn-mark" />
      </span>
    );
  const tone = counts.conflict
    ? "conflict"
    : counts.incomplete
      ? "incomplete"
      : "review";
  return (
    <span className={`mw-badge fn-badge-${tone}`} aria-hidden="true">
      <FertigationIcon
        name={tone === "conflict" ? "conflict" : "info"}
        className="fn-mark"
      />
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
  edition = calculationEdition,
}: {
  children: ReactNode;
  view?: FertigationView;
  onView?: (view: FertigationView) => void;
  sourceHref?: string;
  message?: string;
  /** Open findings per view, from the calculation the page is showing. */
  counts?: Partial<Record<FertigationView, SeverityCounts>>;
  summary?: ReactNode;
  edition?: string;
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
        <div className="fn-rail">
          {summary ?? (
            <div className="mw-menu-title">
              <strong>Fertigation</strong>
              <span>Priva scoping workbench</span>
            </div>
          )}
          <nav aria-label="Fertigation views" className="fn-rail-nav">
            {onView ? (
              fertigationViewGroups.map(([group, ids]) => (
                <div key={group} className="fn-menu-group">
                  <p className="fn-menu-group-title" id={`fn-menu-${ids[0]}`}>
                    {group}
                  </p>
                  <ul aria-labelledby={`fn-menu-${ids[0]}`}>
                    {ids.map((id) => {
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
                            <FertigationIcon
                              name={id as FertigationIconName}
                              className="fn-menu-icon"
                              selected={view === id}
                            />
                            <span className="fn-menu-label">
                              {viewLabel(id)}
                            </span>
                            <ViewBadge counts={c} review={id === "review"} />
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
              ))
            ) : (
              <ul className="fn-menu-plain">
                <li>
                  <Link href="/estimating/fertigation" aria-current="page">
                    <FertigationIcon name="list" className="fn-menu-icon" />
                    <span className="fn-menu-label">Scope register</span>
                  </Link>
                </li>
              </ul>
            )}
            <div className="fn-rail-foot">
              {onView && (
                <Link href="/estimating/fertigation" className="fn-rail-link">
                  <FertigationIcon name="list" className="fn-rail-link-icon" />
                  Scope register
                </Link>
              )}
              <Link
                href={sourceHref ?? "/estimating/discovery"}
                className="fn-rail-link"
              >
                <FertigationIcon name="back" className="fn-rail-link-icon" />
                {sourceHref
                  ? "Return to Discovery alternative"
                  : "Discovery workspaces"}
              </Link>
              <p className="fn-rail-edition">Calculation edition {edition}</p>
            </div>
          </nav>
        </div>
      }
    >
      {children}
    </SecondaryMenuFrame>
  );
}

/** Native modal keeps keyboard focus inside the phone section sheet. */
export function FertigationSectionPicker({
  view,
  onView,
  counts,
}: {
  view: FertigationView;
  onView: (view: FertigationView) => void;
  counts: Partial<Record<FertigationView, SeverityCounts>>;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const close = () => {
    dialog.current?.close();
    setOpen(false);
    trigger.current?.focus();
  };
  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="fn-section-trigger"
        aria-label={`Section: ${viewLabel(view)}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          dialog.current?.showModal();
          setOpen(true);
        }}
      >
        <FertigationIcon name={view} />
        <span>
          {fertigationViews.findIndex(([id]) => id === view) + 1} ·{" "}
          {viewLabel(view)}
        </span>
        <small>{counts.review?.total ?? 0} open</small>
        <FertigationIcon name="chevron-down" />
      </button>
      <dialog
        ref={dialog}
        className="fn-section-sheet"
        aria-label="Fertigation sections"
        onCancel={close}
        onClose={() => setOpen(false)}
      >
        <header>
          <h2>Go to a section</h2>
          <button type="button" aria-label="Close sections" onClick={close}>
            <ShellIcon name="close" />
          </button>
        </header>
        <nav>
          {fertigationViewGroups.map(([group, ids]) => (
            <section key={group}>
              <h3>{group}</h3>
              {ids.map((id) => (
                <button
                  type="button"
                  key={id}
                  aria-label={viewLabel(id)}
                  aria-current={view === id ? "page" : undefined}
                  onClick={() => {
                    onView(id);
                    close();
                  }}
                >
                  <FertigationIcon name={id} className="fn-menu-icon" />
                  <span>
                    {fertigationViews.findIndex(([key]) => key === id) + 1} ·{" "}
                    {viewLabel(id)}
                  </span>
                  <span className="fn-sheet-count">
                    <ViewBadge counts={counts[id]} review={id === "review"} />
                  </span>
                </button>
              ))}
            </section>
          ))}
        </nav>
        <Link href="/estimating/fertigation" className="fn-rail-link">
          Scope register
        </Link>
      </dialog>
    </>
  );
}
