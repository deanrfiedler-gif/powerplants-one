"use client";
import Link from "next/link";
import { Fragment, useState } from "react";
import { ReadState } from "../components/business-ui";
import { useCrmResource } from "../components/crm-state";
import {
  WorklistChoice,
  WorklistMenu,
  WorklistPanel,
} from "../components/crm-worklist-tools";
import { ProductIcon } from "../components/product-icons";
import {
  RegisterTable,
  RegisterChip,
  RegisterEmpty,
  RegisterSortHeader,
} from "../components/ui/register-table";
import { Button } from "../components/ui/button";
import { SecondaryMenuFrame, useSecondaryMenu } from "../shell/secondary-menu";
import {
  incidentViews,
  incidentLabel,
  incidentTime,
  inIncidentView,
  type IncidentRow,
} from "./presentation";

const columns = [
  "Incident",
  "Summary",
  "Classification",
  "State",
  "Hold",
  "Priority",
  "Actions",
  "Reported",
  "Reporter",
  "Site",
];
export function IncidentRegister() {
  const r = useCrmResource<{
    items: IncidentRow[];
    as_at: string;
    window: string;
  }>("service/incidents", true);
  const [menuOpen, setMenuOpen] = useState(true),
    [view, setView] = useState("all"),
    [reporter, setReporter] = useState(""),
    [site, setSite] = useState(""),
    [selection, setSelection] = useState<string[]>([]),
    [hidden, setHidden] = useState<string[]>([]),
    [filtersOpen, setFiltersOpen] = useState(false),
    [sort, setSort] = useState<"ascending" | "descending" | undefined>();
  const menu = useSecondaryMenu(menuOpen, setMenuOpen);
  const all = r.data?.items ?? [],
    filtered = all.filter(
      (i) =>
        (!reporter || i.reporter_id === reporter) &&
        (!site || i.site_id === site),
    );
  const rows = filtered.filter((i) => inIncidentView(i, view));
  if (sort)
    rows.sort(
      (a, b) =>
        a.reference.localeCompare(b.reference) *
        (sort === "ascending" ? 1 : -1),
    );
  const choose = (change: () => void) => {
    setSelection([]);
    change();
  };
  const options = (key: "reporter" | "site") => [
    { id: "", label: key === "reporter" ? "Anyone" : "All" },
    ...Array.from(
      new Map(
        all.map((i) => [i[`${key}_id`], { id: i[`${key}_id`], label: i[key] }]),
      ).values(),
    ),
  ];
  const filters = (
    <>
      <WorklistChoice
        label="Reporter"
        prefix="Reporter: "
        value={reporter}
        options={options("reporter")}
        onChange={(v) => choose(() => setReporter(v))}
      />
      <WorklistChoice
        label="Site"
        prefix="Site: "
        value={site}
        options={options("site")}
        onChange={(v) => choose(() => setSite(v))}
      />
    </>
  );
  return (
    <SecondaryMenuFrame
      id="ppo-incidents"
      name="Incidents and actions"
      menuId="incidents-menu"
      contentId="incidents-content"
      state={menu}
      message="Online synthetic workflow. Counts cover the latest 200 candidates permitted to you."
      phoneHeader={{
        title: incidentViews.find((v) => v.id === view)?.label,
        count: r.data ? rows.length : undefined,
        filter: {
          open: () => setFiltersOpen(true),
          applied: !!reporter || !!site,
        },
      }}
      menu={
        <nav aria-label="Incident views">
          {incidentViews.map((item) => (
            <Fragment key={item.id}>
              {item.group && <h2>{item.group}</h2>}
              <button
                type="button"
                aria-current={view === item.id ? "page" : undefined}
                onClick={() => {
                  choose(() => setView(item.id));
                  menu.closeOverlay();
                }}
              >
                <ProductIcon name={item.icon} />
                <span>{item.label}</span>
                <small>
                  {r.data
                    ? filtered.filter((i) => inIncidentView(i, item.id)).length
                    : "—"}
                </small>
              </button>
            </Fragment>
          ))}
        </nav>
      }
    >
      <h1 className="fi06-sr-only">Incidents and corrective actions</h1>
      <div className="fi06-toolbar">
        <div className="fi06-filters">{filters}</div>
        <span className="fi06-count">
          {r.data
            ? `${rows.length} incidents · as at ${incidentTime(r.data.as_at)}`
            : r.error
              ? "Incident counts unavailable"
              : "Loading incidents…"}
        </span>
        <Button aria-label="Refresh incidents" onClick={r.reload}>
          <ProductIcon name="changes" />
        </Button>
        <WorklistMenu label="Incident register actions" icon="more" choices>
          <Link role="menuitem" data-menu-close href="/my-jobs">
            Open My jobs to report an incident
          </Link>
          <button
            role="menuitem"
            data-menu-close
            onClick={() => {
              setReporter("");
              setSite("");
              setView("all");
              setSelection([]);
            }}
          >
            Clear filters and selection
          </button>
        </WorklistMenu>
      </div>
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      {r.data && (
        <>
          <RegisterTable
            caption="Permitted incidents. Open a reference or summary to read the incident. Selection does not change any incident."
            empty={
              !rows.length && (
                <RegisterEmpty title="No matching incidents">
                  Choose another view or clear Reporter and Site filters.
                </RegisterEmpty>
              )
            }
          >
            <thead>
              <tr>
                <th className="fi06-select">
                  <input
                    type="checkbox"
                    aria-label="Select all visible incidents"
                    checked={
                      rows.length > 0 &&
                      rows.every((i) => selection.includes(i.id))
                    }
                    ref={(e) => {
                      if (e)
                        e.indeterminate =
                          rows.some((i) => selection.includes(i.id)) &&
                          !rows.every((i) => selection.includes(i.id));
                    }}
                    onChange={(e) =>
                      setSelection(
                        e.target.checked ? rows.map((i) => i.id) : [],
                      )
                    }
                  />
                </th>
                {columns
                  .filter((c) => !hidden.includes(c))
                  .map((c, index) =>
                    index === 0 ? (
                      <RegisterSortHeader
                        key={c}
                        label={c}
                        direction={sort}
                        onSort={() =>
                          setSort(
                            sort === "ascending" ? "descending" : "ascending",
                          )
                        }
                      />
                    ) : (
                      <th key={c} scope="col" data-column={c}>
                        {c}
                      </th>
                    ),
                  )}
                <th className="fi06-row-menu">
                  <WorklistMenu label="Incident columns" icon="settings">
                    {columns.slice(1).map((c) => (
                      <label key={c}>
                        <input
                          type="checkbox"
                          checked={!hidden.includes(c)}
                          onChange={(e) =>
                            setHidden(
                              e.target.checked
                                ? hidden.filter((h) => h !== c)
                                : [...hidden, c],
                            )
                          }
                        />
                        {c}
                      </label>
                    ))}
                  </WorklistMenu>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((i) => {
                const values: Record<string, React.ReactNode> = {
                  Incident: (
                    <Link
                      href={`/service/incidents/${i.id}`}
                      title={i.reference}
                    >
                      {i.reference}
                    </Link>
                  ),
                  Summary: (
                    <Link href={`/service/incidents/${i.id}`} title={i.summary}>
                      {i.summary}
                    </Link>
                  ),
                  Classification: incidentLabel(i.classification),
                  State: (
                    <RegisterChip
                      tone={
                        i.state === "Accepted"
                          ? "positive"
                          : [
                                "Submitted",
                                "InReview",
                                "Returned",
                                "ClarificationRequired",
                              ].includes(i.state)
                            ? "attention"
                            : "neutral"
                      }
                    >
                      {incidentLabel(i.state)}
                    </RegisterChip>
                  ),
                  Hold: i.hold ? "Scope held" : "No hold",
                  Priority: i.priority,
                  Actions: `${i.actions_open} open / ${i.actions}`,
                  Reported: incidentTime(i.reported_at, i.timezone),
                  Reporter: i.reporter,
                  Site: i.site,
                };
                return (
                  <tr
                    key={i.id}
                    data-selected={selection.includes(i.id) || undefined}
                  >
                    <td className="fi06-select">
                      <input
                        type="checkbox"
                        aria-label={`Select ${i.reference}`}
                        checked={selection.includes(i.id)}
                        onChange={(e) =>
                          setSelection(
                            e.target.checked
                              ? [...selection, i.id]
                              : selection.filter((id) => id !== i.id),
                          )
                        }
                      />
                    </td>
                    {columns
                      .filter((c) => !hidden.includes(c))
                      .map((c) => (
                        <td key={c} data-column={c}>
                          {values[c]}
                        </td>
                      ))}
                    <td className="fi06-row-menu">
                      <WorklistMenu
                        label={`Actions for ${i.reference}`}
                        icon="more"
                        choices
                      >
                        <Link
                          role="menuitem"
                          data-menu-close
                          href={`/service/incidents/${i.id}`}
                        >
                          Open incident
                        </Link>
                        <Link
                          role="menuitem"
                          data-menu-close
                          href={`/my-jobs/${i.appointment_id}`}
                        >
                          Open visit
                        </Link>
                      </WorklistMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </RegisterTable>
          <p className="fi06-window">
            {selection.filter((id) => rows.some((i) => i.id === id)).length}{" "}
            selected · {r.data.window} Ready to close is a view; closure
            rechecks current authority, sources and original files.
          </p>
        </>
      )}
      {filtersOpen && (
        <WorklistPanel
          title="Filter incidents"
          onClose={() => setFiltersOpen(false)}
        >
          {filters}
        </WorklistPanel>
      )}
    </SecondaryMenuFrame>
  );
}
