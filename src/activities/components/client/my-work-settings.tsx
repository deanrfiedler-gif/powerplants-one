"use client";
// Filters, Customise and saved views. All three change what is shown; none changes access.
import { useState } from "react";
import { teamSharing } from "../../../platform/view-targets";
import { ErrorNotice, friendly, useResource, type Envelope, type Option } from "../../../components/business-ui";
import { defaultCriteria, sameCriteria, TODAYS_FOCUS } from "../../work-criteria";
import type { WorkView, WorkViewCriteria } from "../../work-views";
import { defaultLayout, useMyWork, type PanelId } from "./my-work-shell";
import { Icon, WorkDialog } from "./my-work-ui";

const kinds = ["TechnicalFollowUp", "CustomerContact", "MaterialAction", "FinanceQuery", "RelationshipReview"] as const;

export function FiltersDialog({
  criteria,
  onApply,
  onClose,
}: {
  criteria: WorkViewCriteria;
  onApply: (next: WorkViewCriteria) => void;
  onClose: () => void;
}) {
  const companies = useResource<Envelope<Option>>("selectors/companies");
  const [company, setCompany] = useState(criteria.company_id ?? ""),
    [kind, setKind] = useState<string>(criteria.kind ?? "");
  return (
    <WorkDialog
      title="Filters"
      subtitle="Overview filters"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            className="mw-button mw-button-quiet"
            onClick={() => {
              onApply({ ...criteria, company_id: null, kind: null });
              onClose();
            }}
          >
            Reset filters
          </button>
          <span className="mw-spacer" />
          <button type="button" className="mw-button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="mw-button mw-button-primary"
            onClick={() => {
              onApply({ ...criteria, company_id: company || null, kind: (kind || null) as WorkViewCriteria["kind"] });
              onClose();
            }}
          >
            Apply filters
          </button>
        </>
      }
    >
      <div className="mw-field">
        <label htmlFor="mw-filter-company">Company</label>
        <select id="mw-filter-company" value={company} onChange={(e) => setCompany(e.target.value)} data-autofocus>
          <option value="">All permitted companies</option>
          {(companies.data?.items ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.display_name}
            </option>
          ))}
        </select>
        {!!companies.error && <small className="mw-inline-error">Companies could not be loaded.</small>}
      </div>
      <div className="mw-field">
        <label htmlFor="mw-filter-kind">Activity purpose</label>
        <select id="mw-filter-kind" value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="">All purposes</option>
          {kinds.map((k) => (
            <option key={k} value={k}>
              {friendly(k)}
            </option>
          ))}
        </select>
      </div>
      <p className="mw-hint">
        Company applies to every panel and count. Purpose applies to activities: the counts, the list, the schedule and the date-needed notice. It does not apply to waiting requests,
        opportunities or reviews, which are not activities. <strong>All activity types</strong> and <strong>Sort</strong> change only the My activities list.
      </p>
    </WorkDialog>
  );
}

const panelNames: Record<PanelId, string> = {
  schedule: "Today's schedule",
  waiting: "Waiting on others",
  gaps: "Needs a next activity",
};
export function CustomiseDialog({ onClose }: { onClose: () => void }) {
  const work = useMyWork();
  const [panels, setPanels] = useState(work.layout.panels),
    [hidden, setHidden] = useState(work.layout.hidden),
    [weatherHidden, setWeatherHidden] = useState(work.layout.weather.hidden);
  // A phone shows one weekly agenda in a fixed reading order, so only what can be hidden is offered.
  const phone = !!work.phone;
  const move = (id: PanelId, by: number) => {
    const at = panels.indexOf(id),
      to = at + by;
    if (to < 0 || to >= panels.length) return;
    const next = [...panels];
    [next[at], next[to]] = [next[to], next[at]];
    setPanels(next);
  };
  return (
    <WorkDialog
      title="Customise overview"
      subtitle={`${work.department} default, adjusted for you on this device`}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            className="mw-button mw-button-quiet"
            onClick={() => {
              setPanels(defaultLayout.panels);
              setHidden([]);
              setWeatherHidden(false);
            }}
          >
            Reset to {work.department} default
          </button>
          <span className="mw-spacer" />
          <button type="button" className="mw-button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="mw-button mw-button-primary"
            onClick={() => {
              work.saveLayout({ ...work.layout, panels, hidden, weather: { ...work.layout.weather, hidden: weatherHidden } });
              work.announce("Overview layout saved.");
              onClose();
            }}
          >
            Save layout
          </button>
        </>
      }
    >
      <ul className="mw-customise">
        {phone && (
          <li>
            <label className="mw-choice">
              <input type="checkbox" checked={!weatherHidden} onChange={(e) => setWeatherHidden(!e.target.checked)} data-autofocus />
              <span>Local weather</span>
            </label>
          </li>
        )}
        {panels.filter((id) => !phone || id !== "schedule").map((id, i) => (
          <li key={id}>
            <label className="mw-choice">
              <input
                type="checkbox"
                checked={!hidden.includes(id)}
                onChange={(e) => setHidden(e.target.checked ? hidden.filter((h) => h !== id) : [...hidden, id])}
                data-autofocus={(!phone && i === 0) || undefined}
              />
              <span>{panelNames[id]}</span>
            </label>
            <span className="mw-spacer" />
            {!phone && (
              <>
                <button type="button" className="mw-icon-button" onClick={() => move(id, -1)} disabled={i === 0} aria-label={`Move ${panelNames[id]} up`}>
                  <span className="mw-turn-up">
                    <Icon name="chevron-down" />
                  </span>
                </button>
                <button type="button" className="mw-icon-button" onClick={() => move(id, 1)} disabled={i === panels.length - 1} aria-label={`Move ${panelNames[id]} down`}>
                  <Icon name="chevron-down" />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      <p className="mw-hint">
        {phone
          ? "Needs attention and the weekly agenda always stay: hiding a section never hides required work, and everything hidden is still reachable from the My Work menu."
          : "The activity list, the four counts and the date-needed and review notices always stay: hiding a panel never hides required work, and every hidden panel is still reachable from the My Work menu."}{" "}
        The layout is remembered for you in this browser.
      </p>
    </WorkDialog>
  );
}

// Saved views: create, use, rename, duplicate, pin and retire. The whole personal document is
// saved under a version check; a conflict keeps what was typed and says what to do.
export function ViewsDialog({
  target,
  criteria,
  activeId,
  onUse,
  onClose,
}: {
  target: WorkView["target"];
  criteria: WorkViewCriteria;
  activeId: string | null;
  onUse: (view: WorkView | null) => void;
  onClose: () => void;
}) {
  const work = useMyWork();
  const views = work.views?.views ?? [];
  const [name, setName] = useState(""),
    [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(null);
  async function save(next: WorkView[], message: string) {
    setBusy(true);
    setError(null);
    try {
      await work.saveViews(next);
      work.announce(message);
      return true;
    } catch (e) {
      setError(e);
      if ((e as { code?: string }).code === "VersionConflict") work.reloadViews();
      return false;
    } finally {
      setBusy(false);
    }
  }
  const unique = (wanted: string) => !views.some((v) => v.name.toLowerCase() === wanted.trim().toLowerCase());
  return (
    <WorkDialog title="Saved views" subtitle="Personal to you. A view stores criteria only; each use applies your current access." busy={busy} onClose={onClose}>
      <p className="mw-hint">{teamSharing.reason}</p>
      <form
        className="mw-inline-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const label = name.trim();
          if (!label || !unique(label)) return setError({ message: "Give the view a name you have not used already." });
          if (views.length >= 12) return setError({ message: "You can keep up to twelve saved views. Retire one first." });
          const view: WorkView = { id: crypto.randomUUID(), name: label, target, pinned: false, criteria };
          if (await save([...views, view], `View “${label}” saved.`)) {
            setName("");
            onUse(view);
          }
        }}
      >
        <div className="mw-field">
          <label htmlFor="mw-view-name">Save the current criteria as</label>
          <input id="mw-view-name" type="text" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} disabled={busy} data-autofocus />
        </div>
        <button type="submit" className="mw-button mw-button-primary" disabled={busy || !name.trim()}>
          Save view
        </button>
      </form>
      <ErrorNotice error={error} />
      {!!work.viewsError && <p className="mw-inline-error">Your saved views could not be loaded, so none can be changed right now.</p>}
      <ul className="mw-views">
        {target === "overview" && (
          <li>
            <div>
              <strong>{TODAYS_FOCUS}</strong>
              <span>Built-in default · my work, all types, due time</span>
            </div>
            <button
              type="button"
              className="mw-button"
              onClick={() => {
                onUse(null);
                onClose();
              }}
              disabled={activeId === null && sameCriteria(criteria, defaultCriteria)}
            >
              Use
            </button>
          </li>
        )}
        {views.map((v) => (
          <li key={v.id}>
            {renaming?.id === v.id ? (
              <form
                className="mw-inline-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const label = renaming.name.trim();
                  if (!label || (label.toLowerCase() !== v.name.toLowerCase() && !unique(label))) return setError({ message: "Give the view a name you have not used already." });
                  if (await save(views.map((x) => (x.id === v.id ? { ...x, name: label } : x)), `View renamed to “${label}”.`)) setRenaming(null);
                }}
              >
                <div className="mw-field">
                  <label htmlFor={`mw-rename-${v.id}`}>New name for {v.name}</label>
                  <input id={`mw-rename-${v.id}`} type="text" maxLength={60} value={renaming.name} onChange={(e) => setRenaming({ id: v.id, name: e.target.value })} disabled={busy} />
                </div>
                <button type="submit" className="mw-button mw-button-primary" disabled={busy}>
                  Save name
                </button>
                <button type="button" className="mw-button" onClick={() => setRenaming(null)} disabled={busy}>
                  Cancel
                </button>
              </form>
            ) : (
              <>
                <div>
                  <strong>{v.name}</strong>
                  <span>
                    {v.target === "overview" ? "Overview" : v.target === "actions" ? "My actions" : "Team queue"}
                    {v.pinned ? " · Pinned" : ""}
                    {activeId === v.id ? " · In use" : ""}
                  </span>
                </div>
                <div className="mw-actions">
                  {v.target === target && (
                    <button
                      type="button"
                      className="mw-button"
                      onClick={() => {
                        onUse(v);
                        onClose();
                      }}
                    >
                      Use
                    </button>
                  )}
                  {v.target === target && <button type="button" className="mw-button" disabled={busy || sameCriteria(v.criteria, criteria)} onClick={() => void save(views.map(x => x.id === v.id ? {...x, criteria} : x), "Saved view updated to current criteria.")}>Update criteria</button>}
                  <button type="button" className="mw-button mw-button-quiet" onClick={() => setRenaming({ id: v.id, name: v.name })} disabled={busy}>
                    Rename
                  </button>
                  <button
                    type="button"
                    className="mw-button mw-button-quiet"
                    disabled={busy || views.length >= 12}
                    onClick={() => {
                      let copy = `${v.name.slice(0, 48)} copy`;
                      for (let n = 2; !unique(copy); n++) copy = `${v.name.slice(0, 48)} copy ${n}`;
                      void save([...views, { ...v, id: crypto.randomUUID(), name: copy, pinned: false }], `View duplicated as “${copy}”.`);
                    }}
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    className="mw-button mw-button-quiet"
                    disabled={busy}
                    aria-pressed={v.pinned}
                    onClick={() => void save(views.map((x) => (x.id === v.id ? { ...x, pinned: !x.pinned } : x)), v.pinned ? `“${v.name}” unpinned.` : `“${v.name}” pinned to the My Work menu.`)}
                  >
                    {v.pinned ? "Unpin" : "Pin"}
                  </button>
                  <button
                    type="button"
                    className="mw-button mw-button-quiet"
                    disabled={busy}
                    onClick={async () => {
                      if (!window.confirm(`Retire the saved view “${v.name}”? This removes the view only; no activity or record is changed.`)) return;
                      if ((await save(views.filter((x) => x.id !== v.id), `View “${v.name}” retired. No records were changed.`)) && activeId === v.id) onUse(null);
                    }}
                  >
                    Retire
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
        {!views.length && target !== "overview" && <li className="mw-muted">No saved views yet.</li>}
      </ul>
    </WorkDialog>
  );
}
