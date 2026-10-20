"use client";
import { Fragment, useRef, useState } from "react";
import Link from "next/link";
import {
  useResource,
  ErrorNotice,
  Stamp,
  friendly,
  type Envelope,
} from "./business-ui";
import { SecondaryMenuFrame, useSecondaryMenu } from "../shell/secondary-menu";
import { usePhoneHeader } from "../shell/phone-header";
import { usePublishPageDescription } from "../shell/page-description";
import { Button, ButtonLink } from "./ui/button";
import { RegisterTable, RegisterSortHeader } from "./ui/register-table";
import {
  WorklistChoice,
  WorklistMenu,
  WorklistPanel,
} from "./crm-worklist-tools";
import { ProductIcon } from "./product-icons";
import {
  reportAttention,
  reportCsv,
  reportQueues,
  inReportQueue,
  type ReportQueue,
  type ReportRegisterRow,
} from "../reports/register-model";
import { ReportSnapshot, ReportState } from "./report-workspace";
import "../app/styles/service-reports.css";

export function ReportListScreen() {
  const resource = useResource<
    Envelope<ReportRegisterRow> & { completeness: string }
  >("reports");
  const [menuOpen, setMenuOpen] = useState(true),
    [queue, setQueue] = useState<ReportQueue>("all"),
    [technician, setTechnician] = useState(""),
    [customer, setCustomer] = useState(""),
    [filtersOpen, setFiltersOpen] = useState(false),
    [selection, setSelection] = useState<string[]>([]),
    [sequence, setSequence] = useState<string[]>([]),
    [snapshot, setSnapshot] = useState<string | null>(null),
    [ascending, setAscending] = useState(false),
    [sorted, setSorted] = useState(false);
  const menu = useSecondaryMenu(menuOpen, setMenuOpen),
    opener = useRef<HTMLElement | null>(null);
  const available = !resource.error && !resource.loading;
  const all = available ? (resource.data?.items ?? []) : [];
  const filtered = all.filter(
    (row) =>
      (!technician || row.technician_id === technician) &&
      (!customer || row.customer_id === customer),
  );
  const rows = filtered.filter((row) => inReportQueue(row, queue));
  if (sorted)
    rows.sort(
      (left, right) =>
        left.reference.localeCompare(right.reference) * (ascending ? 1 : -1),
    );
  const selected = rows.filter((row) => selection.includes(row.id));
  const change = (next: () => void) => {
    setSelection([]);
    setSnapshot(null);
    next();
  };
  const reset = () =>
    change(() => {
      setQueue("all");
      setTechnician("");
      setCustomer("");
    });
  const inspect = (id: string, ids = rows.map((row) => row.id)) => {
    opener.current = document.activeElement as HTMLElement;
    setSequence(ids);
    setSnapshot(id);
  };
  const close = () => {
    setSnapshot(null);
    if (opener.current?.getClientRects().length) opener.current.focus();
    else document.querySelector<HTMLButtonElement>('.sv06-toolbar button[aria-label="Report actions"]')?.focus();
  };
  const exportRows = () => {
    const url = URL.createObjectURL(
      new Blob([reportCsv(selected.length ? selected : rows)], {
        type: "text/csv;charset=utf-8",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "PPO-service-reports.csv";
    link.click();
    URL.revokeObjectURL(url);
  };
  usePublishPageDescription(
    "Service review",
    "Review exact technician evidence and issue controlled reports. Synthetic prototype; issuing sends nothing. Counts and filters cover the recent 200-report window only.",
  );
  usePhoneHeader({
    title: "Service review",
    count: available ? rows.length : undefined,
    chooseView: { open: (source) => menu.toggle(source), expanded: menu.open },
    filter: {
      open: () => setFiltersOpen(true),
      applied: !!technician || !!customer,
    },
  });
  const options = (key: "technician" | "customer") => [
    { id: "", label: key === "technician" ? "Anyone" : "All" },
    ...Array.from(
      new Map(
        all.map((row) => [
          row[`${key}_id`],
          { id: row[`${key}_id`], label: row[key] },
        ]),
      ).values(),
    ).filter((option) => option.id),
  ];
  const filters = (
    <>
      <WorklistChoice
        label="Technician"
        prefix="Technician: "
        value={technician}
        options={options("technician")}
        onChange={(value) => change(() => setTechnician(value))}
      />
      <WorklistChoice
        label="Customer"
        prefix="Customer: "
        value={customer}
        options={options("customer")}
        onChange={(value) => change(() => setCustomer(value))}
      />
    </>
  );
  const columns = [
    "Report",
    "Visit",
    "State",
    "Outcome",
    "Attention",
    "Technician",
    "Attendance",
    "Customer",
    "Site",
    "Customer response",
    "Remaining work",
    "Work order",
    "Revision",
    "Updated",
  ];
  return (
    <SecondaryMenuFrame
      id="ppo-reports"
      name="Service review"
      menuId="reports-menu"
      contentId="reports-content"
      state={menu}
      message="Synthetic reports. Nothing is sent to customers."
      menu={
        <nav aria-label="Report queues">
          {reportQueues.map((item) => (
            <Fragment key={item.id}>
              {"group" in item && <h2>{item.group}</h2>}
              <button
                type="button"
                aria-current={queue === item.id ? "page" : undefined}
                onClick={() => {
                  change(() => setQueue(item.id));
                  menu.closeOverlay();
                }}
              >
                <ProductIcon name={item.icon} />
                <span>{item.label}</span>
                <small>
                  {available
                    ? filtered.filter((row) => inReportQueue(row, item.id))
                        .length
                    : "—"}
                </small>
              </button>
            </Fragment>
          ))}
        </nav>
      }
    >
      <div className="sv06-register">
        <h1 className="sr-only">Service review and reports</h1>
        <div className="sv06-toolbar">
          <div className="sv06-desktop-filters">{filters}</div>
          <div className="sv06-phone-view">
            <WorklistChoice
              label="Report view"
              value={queue}
              options={reportQueues.map((item) => ({
                id: item.id,
                label: item.label,
              }))}
              onChange={(value) => change(() => setQueue(value as ReportQueue))}
            />
          </div>
          <span className="sv06-count" aria-live="polite">
            {resource.loading ? (
              "Loading…"
            ) : available ? (
              <>
                {rows.length} reports
                <span className="sv06-as-at">
                  {" "}
                  · as at <Stamp value={resource.data?.observed_at} />
                </span>
              </>
            ) : (
              ""
            )}
          </span>
          <Button
            aria-label="Filters"
            className="sv06-phone-filter"
            onClick={() => setFiltersOpen(true)}
          >
            <ProductIcon name="filter" />
          </Button>
          <Button
            className="sv06-refresh"
            onClick={() => change(resource.reload)}
          >
            Refresh reports
          </Button>
          <WorklistMenu label="Report actions" icon="more">
            <Button
              disabled={!selected.length || !available}
              onClick={() =>
                inspect(
                  selected[0].id,
                  selected.map((row) => row.id),
                )
              }
              data-menu-close
            >
              Open in sequence
            </Button>
            <Button
              disabled={!rows.length || !available}
              onClick={exportRows}
              data-menu-close
            >
              Export list
              {selected.length ? ` (${selected.length} selected)` : ""}
            </Button>
          </WorklistMenu>
        </div>
        {(technician || customer || queue !== "all") && (
          <div className="sv06-chips" aria-label="Active filters">
            {queue !== "all" && (
              <Button
                onClick={() => change(() => setQueue("all"))}
                aria-label="Remove queue filter"
              >
                {reportQueues.find((item) => item.id === queue)?.label} ×
              </Button>
            )}
            {technician && (
              <Button
                onClick={() => change(() => setTechnician(""))}
                aria-label="Remove technician filter"
              >
                Technician:{" "}
                {all.find((row) => row.technician_id === technician)
                  ?.technician ?? "selected"}{" "}
                ×
              </Button>
            )}
            {customer && (
              <Button
                onClick={() => change(() => setCustomer(""))}
                aria-label="Remove customer filter"
              >
                Customer:{" "}
                {all.find((row) => row.customer_id === customer)?.customer ??
                  "selected"}{" "}
                ×
              </Button>
            )}
          </div>
        )}
        {resource.error ? (
          <div className="sv06-state sv06-error">
            <h2>Reports could not be loaded</h2>
            <p>
              No list is shown, so nothing here is out of date. Check your
              connection, then try again.
            </p>
            <ErrorNotice error={resource.error} />
            <Button onClick={resource.reload}>Try again</Button>
          </div>
        ) : resource.loading ? (
          <div className="sv06-loading" aria-busy="true">
            <p role="status">Loading reports…</p>
            {[0, 1, 2, 3, 4, 5].map((row) => (
              <div key={row} aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            ))}
          </div>
        ) : !rows.length ? (
          <div className="sv06-state">
            <h2>
              {all.length
                ? "No reports match these filters"
                : "No reports in this window"}
            </h2>
            <p>
              {all.length
                ? `${all.length} permitted reports are hidden by these filters.`
                : "Technicians submit from their job’s Completion tab. Older reports remain linked from their attendance."}
            </p>
            {!!all.length && <Button onClick={reset}>Clear filters</Button>}
          </div>
        ) : (
          <>
            <div className="sv06-grid">
              <RegisterTable caption="Recent permitted service reports. Open a row for its snapshot; tick a checkbox to select it for export or sequential review.">
                <thead>
                  <tr>
                    <th className="sv06-check">
                      <input
                        type="checkbox"
                        aria-label="Select all visible reports"
                        checked={selected.length === rows.length}
                        onChange={(event) =>
                          setSelection(
                            event.target.checked
                              ? rows.map((row) => row.id)
                              : [],
                          )
                        }
                      />
                    </th>
                    {columns.map((column, index) =>
                      index === 0 ? (
                        <RegisterSortHeader
                          key={column}
                          label={column}
                          direction={
                            sorted
                              ? ascending
                                ? "ascending"
                                : "descending"
                              : undefined
                          }
                          onSort={() => {
                            setSorted(true);
                            setAscending(!ascending);
                          }}
                        />
                      ) : (
                        <th scope="col" key={column}>
                          {column}
                        </th>
                      ),
                    )}
                    <th className="sv06-row-action">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      data-selected={selection.includes(row.id) || undefined}
                      onClick={(event) => {
                        if (
                          !(event.target as HTMLElement).closest(
                            "button,a,input",
                          )
                        )
                          inspect(row.id);
                      }}
                    >
                      <td className="sv06-check">
                        <input
                          type="checkbox"
                          aria-label={`Select ${row.reference}`}
                          checked={selection.includes(row.id)}
                          onChange={(event) =>
                            setSelection(
                              event.target.checked
                                ? [...selection, row.id]
                                : selection.filter((id) => id !== row.id),
                            )
                          }
                        />
                      </td>
                      <td>
                        <button
                          className="sv06-row-link"
                          onClick={() => inspect(row.id)}
                        >
                          {row.reference}
                        </button>
                      </td>
                      <td title={row.title}>{row.title}</td>
                      <td>
                        <ReportState status={row.status} />
                      </td>
                      <td>{friendly(row.outcome)}</td>
                      <td>{reportAttention(row)}</td>
                      <td>{row.technician}</td>
                      <td>
                        <Stamp value={row.attendance_start} />
                      </td>
                      <td>{row.customer}</td>
                      <td>{row.site}</td>
                      <td>
                        {row.response ? friendly(row.response) : "No response"}
                      </td>
                      <td>{row.remaining_open} open</td>
                      <td>{row.work_order_reference}</td>
                      <td>{row.revision}</td>
                      <td>
                        <Stamp value={row.updated_at} />
                      </td>
                      <td className="sv06-row-action">
                        <Button
                          variant="quiet"
                          aria-label={`Open ${row.reference} snapshot`}
                          onClick={() => inspect(row.id)}
                        >
                          <ProductIcon name="more" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </RegisterTable>
            </div>
            <div className="sv06-phone-list">
              {rows.map((row) => (
                <Link key={row.id} href={`/service/reports/${row.id}`}>
                  <span className="sv06-phone-title">{row.title}</span>
                  <time>
                    {row.attendance_start
                      ? new Intl.DateTimeFormat("en-AU", {
                          day: "numeric",
                          month: "short",
                          timeZone: "Australia/Brisbane",
                        }).format(new Date(row.attendance_start))
                      : "Unknown"}
                  </time>
                  <span className="sv06-phone-reference">
                    {row.reference} · {row.customer}
                  </span>
                  <ReportState status={row.status} />
                  <span className="sv06-phone-attention">
                    <ProductIcon
                      name={
                        row.status === "Returned" ||
                        (row.response && row.response !== "Accepted")
                          ? "warning"
                          : "clock"
                      }
                    />
                    {reportAttention(row)}
                  </span>
                  <span className="sv06-phone-outcome">
                    {friendly(row.outcome)}
                  </span>
                  <ProductIcon name="expand" />
                </Link>
              ))}
            </div>
          </>
        )}
        <p className="sv06-window">
          Recent 200-report window ·{" "}
          {resource.data?.completeness === "BoundedWindow"
            ? "Older reports are outside this window."
            : "Permitted reports only."}{" "}
          {selected.length > 0 && `${selected.length} selected.`}
        </p>
        {snapshot && available && (
          <ReportSnapshot
            key={snapshot}
            id={snapshot}
            position={sequence.indexOf(snapshot)}
            total={sequence.length}
            onClose={close}
            onMove={(offset) =>
              setSnapshot(sequence[sequence.indexOf(snapshot) + offset])
            }
          />
        )}
        {filtersOpen && (
          <WorklistPanel
            title="Filter reports"
            onClose={() => setFiltersOpen(false)}
            drawer
          >
            <div className="sv06-filter-panel">
              {filters}
              <Button onClick={reset}>Clear filters</Button>
              <ButtonLink href="/service/reports">Reset report view</ButtonLink>
            </div>
          </WorklistPanel>
        )}
      </div>
    </SecondaryMenuFrame>
  );
}
