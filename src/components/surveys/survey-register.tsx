"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useContactView } from "../contact-workspace";
import {
  PageHeader,
  SelectField,
  type Envelope,
  type Option,
} from "../business-ui";
import { useCrmResource } from "../crm-state";
import { Button } from "../ui/button";
import {
  RegisterTable,
  RegisterSortHeader,
  RegisterFooter,
} from "../ui/register-table";
import { ShellIcon } from "../shell-icon";
import {
  SecondaryMenuFrame,
  useSecondaryMenu,
} from "../../shell/secondary-menu";
import { usePhoneHeader } from "../../shell/phone-header";
import { SurveyCreate } from "./survey-forms";
import {
  SurveyReadState,
  SurveyTag,
  surveyDate,
  surveyViews,
} from "./survey-ui";
import type { listCs } from "../../shared/cs/service";
import "../../app/styles/organisations.css";
import "../../app/styles/surveys.css";

export function SurveyRegister({ siteId = "" }: { siteId?: string }) {
  const [view, setView] = useContactView(
    surveyViews.map(([key]) => key),
    "",
  );
  const [site, setSite] = useState(siteId),
    [owner, setOwner] = useState(""),
    [cursor, setCursor] = useState(""),
    [creating, setCreating] = useState(false),
    [ascending, setAscending] = useState(true),
    [selection, setSelection] = useState<string[]>([]),
    [remembered, setRemembered] = useState(true);
  const menu = useSecondaryMenu(remembered, setRemembered);
  const filters = useRef<HTMLDialogElement>(null),
    filterOpener = useRef<HTMLElement | null>(null);
  const params = new URLSearchParams({
    limit: "100",
    ...(site ? { context_id: site } : {}),
    ...(owner ? { owner_id: owner } : {}),
    ...(view ? { state: view } : {}),
    ...(cursor ? { cursor } : {}),
  });
  const r = useCrmResource<Awaited<ReturnType<typeof listCs>>>(
    "cs/Survey?" + params,
    true,
  );
  const sites = useCrmResource<Envelope<Option>>("sites?limit=100", true);
  const viewName =
    surveyViews.find(([key]) => key === view)?.[1] ?? "All surveys";
  const openFilter = (opener: HTMLElement) => {
    filterOpener.current = opener;
    filters.current?.showModal();
  };
  const closeFilter = () => {
    filters.current?.close();
    filterOpener.current?.focus();
  };
  usePhoneHeader(
    creating
      ? { title: "New survey" }
      : {
          title: viewName,
          count: r.data ? r.data.items.length : undefined,
          chooseView: {
            open: (opener) => menu.toggle(opener),
            expanded: menu.open,
            controls: "survey-menu",
          },
          filter: { open: openFilter, applied: !!site || !!owner },
          pageAction: {
            label: "New survey",
            icon: "plus",
            onSelect: () => setCreating(true),
          },
        },
  );
  const changeView = (value: string) => {
    setView(value);
    setCursor("");
    setSelection([]);
    menu.closeOverlay();
  };
  const filterControls = (prefix: string) => (
    <>
      <SelectField
        name={prefix + "-site"}
        label="Site"
        value={site}
        onChange={(v) => {
          setSite(v);
          setOwner("");
          setCursor("");
          setSelection([]);
        }}
        options={sites.data?.items ?? []}
        empty="All sites"
      />
      <SelectField
        name={prefix + "-owner"}
        label="Owner"
        value={owner}
        onChange={(v) => {
          setOwner(v);
          setCursor("");
          setSelection([]);
        }}
        options={r.data?.owner_options ?? []}
        empty="All owners"
      />
    </>
  );
  const rows =
    r.data?.items.toSorted((a, b) =>
      ascending ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
    ) ?? [];
  const select = (id: string, checked: boolean) =>
    setSelection((old) =>
      checked ? [...old, id] : old.filter((x) => x !== id),
    );
  const menuContent = (
    <nav aria-label="Survey views">
      <ul>
        <li>
          <Link href="/sites">
            <ShellIcon name="sites" />
            Sites
          </Link>
        </li>
        <li>
          <Link href="/facilities">
            <ShellIcon name="sites" />
            Facilities & growing areas
          </Link>
        </li>
      </ul>
      <h2>Site surveys</h2>
      <ul>
        {surveyViews.map(([key, label]) => (
          <li key={key}>
            <a
              href={"/surveys" + (key ? "?view=" + key : "")}
              aria-current={view === key ? "page" : undefined}
              onClick={(e) => {
                e.preventDefault();
                changeView(key);
              }}
            >
              <ShellIcon name={key === "Reviewed" ? "check" : "bar-work"} />
              <span>{label}</span>
              {r.data?.view_counts && (
                <span className="mw-badge">
                  {key ? (r.data.view_counts[key] ?? 0) : r.data.total_count}
                </span>
              )}
            </a>
          </li>
        ))}
      </ul>
      <h2>Related</h2>
      <ul>
        <li>
          <Link href={site ? "/sites/" + site + "/readiness" : "/sites"}>
            <ShellIcon name="check" />
            Access & readiness
          </Link>
        </li>
        <li>
          <Link href="/equipment">
            <ShellIcon name="equipment" />
            Equipment
          </Link>
        </li>
      </ul>
    </nav>
  );
  if (creating)
    return (
      <div id="ppo-survey-create" data-module-layout="full-bleed">
        <SurveyCreate initialSite={site} onClose={() => setCreating(false)} />
      </div>
    );
  return (
    <SecondaryMenuFrame
      state={menu}
      id="ppo-surveys"
      name="Site surveys"
      menuId="survey-menu"
      contentId="survey-register-content"
      message={r.data ? rows.length + " surveys loaded" : ""}
      menu={menuContent}
    >
      <div className="srv-register">
        <PageHeader eyebrow="CS-08" title="Site surveys" variant="register" />
        <div className="srv-toolbar">
          <div className="srv-desktop-filters">{filterControls("survey")}</div>
          {r.data && (
            <p className="srv-read-time">
              {rows.length} surveys{r.data.next_cursor ? " on this page" : ""} ·
              as at {surveyDate(r.data.observed_at, undefined, true)}
            </p>
          )}
          <Button
            onClick={r.reload}
            aria-label="Refresh surveys"
            title="Refresh surveys"
          >
            ↻
          </Button>
          <Button variant="primary" onClick={() => setCreating(true)}>
            New survey
          </Button>
        </div>
        <SurveyReadState loading={r.loading} error={r.error} retry={r.reload} />
        {r.data && (
          <>
            {(r.data.next_cursor || cursor) && (
              <p className="srv-partial" role="status">
                This is a page of permitted surveys. Use the page controls to
                read more.
              </p>
            )}
            {!rows.length ? (
              <div className="srv-state">
                <h2>
                  {view === "Reviewed"
                    ? "No reviewed surveys"
                    : "No surveys in this view"}
                </h2>
                <p>
                  {site
                    ? "No matching surveys have been recorded at the chosen site."
                    : "No surveys match the chosen filters."}
                </p>
                <Button
                  onClick={() => {
                    setSite("");
                    setOwner("");
                    changeView("");
                  }}
                >
                  Show all surveys
                </Button>
              </div>
            ) : (
              <>
                <div className="srv-grid">
                  <RegisterTable caption="Site surveys. Open a survey by its title. Checkboxes select rows in this page only.">
                    <thead>
                      <tr>
                        <th className="srv-select">
                          <input
                            type="checkbox"
                            aria-label="Select all surveys on this page"
                            checked={
                              rows.length > 0 &&
                              rows.every((x) => selection.includes(x.id))
                            }
                            onChange={(e) =>
                              setSelection(
                                e.target.checked ? rows.map((x) => x.id) : [],
                              )
                            }
                          />
                        </th>
                        <RegisterSortHeader
                          label="Survey"
                          direction={ascending ? "ascending" : "descending"}
                          onSort={() => setAscending((v) => !v)}
                          className="srv-title"
                        />
                        <th>Status</th>
                        <th>Site</th>
                        <th>Visit</th>
                        <th>Open gaps</th>
                        <th>Handover</th>
                        <th>Revision</th>
                        <th>Owner</th>
                        <th>Observations</th>
                        <th>Reference</th>
                        <th className="srv-end">
                          <span className="sr-only">Open record</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((s) => (
                        <tr
                          key={s.id}
                          data-selected={selection.includes(s.id) || undefined}
                        >
                          <td className="srv-select">
                            <input
                              type="checkbox"
                              aria-label={"Select " + s.name}
                              checked={selection.includes(s.id)}
                              onChange={(e) => select(s.id, e.target.checked)}
                            />
                          </td>
                          <td className="srv-title">
                            <Link href={"/surveys/" + s.id}>{s.name}</Link>
                          </td>
                          <td>
                            <SurveyTag value={s.state} />
                          </td>
                          <td>
                            <Link href={"/sites/" + s.site_id}>
                              {s.site_name}
                            </Link>
                          </td>
                          <td>
                            {s.planned_at
                              ? surveyDate(s.planned_at, s.timezone)
                              : "Not booked"}
                          </td>
                          <td className="srv-number">{s.open_gaps}</td>
                          <td>
                            {s.handover ??
                              (s.state === "Reviewed" ? "None" : "—")}
                          </td>
                          <td>{s.revision}</td>
                          <td>{s.owner_name}</td>
                          <td>{s.observation_count}</td>
                          <td>{s.display_number}</td>
                          <td className="srv-end">
                            <Link
                              href={"/surveys/" + s.id}
                              aria-label={"Open " + s.name}
                            >
                              <ShellIcon name="chevron-right" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </RegisterTable>
                </div>
                <div className="srv-phone-list">
                  {rows.map((s) => (
                    <Link href={"/surveys/" + s.id} key={s.id}>
                      <div>
                        <strong>{s.name}</strong>
                        <SurveyTag value={s.state} />
                      </div>
                      <p>
                        {s.site_name} · {s.owner_name}
                      </p>
                      <p>
                        Rev {s.revision} · {s.open_gaps} open{" "}
                        {s.open_gaps === 1 ? "gap" : "gaps"} ·{" "}
                        {s.handover ??
                          (s.planned_at
                            ? surveyDate(s.planned_at, s.timezone)
                            : "Visit not booked")}
                      </p>
                    </Link>
                  ))}
                </div>
              </>
            )}
            {(cursor || r.data.next_cursor || selection.length > 0) && (
              <RegisterFooter>
                <span>
                  {selection.length ? selection.length + " selected" : ""}
                </span>
                {cursor && (
                  <Button
                    onClick={() => {
                      setCursor("");
                      setSelection([]);
                    }}
                  >
                    First page
                  </Button>
                )}
                {r.data.next_cursor && (
                  <Button
                    onClick={() => {
                      setCursor(r.data!.next_cursor!);
                      setSelection([]);
                    }}
                  >
                    Next page
                  </Button>
                )}
              </RegisterFooter>
            )}
          </>
        )}
        <dialog
          ref={filters}
          className="srv-filter-dialog"
          aria-labelledby="survey-filter-title"
          onCancel={(e) => {
            e.preventDefault();
            closeFilter();
          }}
        >
          <header>
            <h2 id="survey-filter-title">Filter surveys</h2>
            <Button onClick={closeFilter}>Done</Button>
          </header>
          {filterControls("phone-survey")}
          <SurveyReadState
            loading={sites.loading}
            error={sites.error}
            retry={sites.reload}
          />
        </dialog>
        <div className="srv-quick-add">
          <Button variant="primary" onClick={() => setCreating(true)}>
            <ShellIcon name="plus" />
            New survey
          </Button>
        </div>
      </div>
    </SecondaryMenuFrame>
  );
}
