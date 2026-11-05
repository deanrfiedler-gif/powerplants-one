"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, useState } from "react";
import { LookupField } from "../../components/record-ui";
import {
  ReadState,
  Stamp,
  useResource,
  type Envelope,
} from "../../components/business-ui";
import { Button, ButtonLink } from "../../components/ui/button";
import {
  RegisterTable,
  RegisterFooter,
  RegisterEmpty,
} from "../../components/ui/register-table";
import { WorklistPanel } from "../../components/crm-worklist-tools";
import {
  SecondaryMenuFrame,
  useSecondaryMenu,
} from "../../shell/secondary-menu";
import type { Project } from "../model";
import { ValueBreakdown } from "./ui-values";
import { CommercialCommand } from "./ui-command";
import {
  PendingCommercialSave,
  CommercialState,
  ControlValues,
  useCommercialList,
} from "./ui-common";
import {
  group,
  obligationOverdue,
  noticeRelation,
  groupOrder,
  kindLabel,
  moneyLabel,
  recordHref,
  type Finance,
  type Intent,
  type Row,
} from "./ui-model";
import type { Kind } from "./model";
import "./ui.css";

const views = [
  { id: "Variation", label: "Variations" },
  { id: "Obligation", label: "Obligations" },
  { id: "Notice", label: "Notices" },
  { id: "Basis", label: "Commercial basis" },
  { id: "Values", label: "Value breakdown" },
];
export function CommercialRegister() {
  const params = useSearchParams(),
    router = useRouter();
  const project = params.get("project") ?? "",
    selected = params.get("view") ?? "Variation";
  const view = views.some((x) => x.id === selected) ? selected : "Variation";
  const [search, setSearch] = useState("");
  const projects = useResource<Envelope<Project>>(
    `projects?q=${encodeURIComponent(search || project)}&limit=100`,
  );
  const changeProject = (id: string) =>
    router.push(
      `/projects/commercial${id ? `?project=${id}&view=${view}` : ""}`,
    );
  return (
    <CommercialWorkspace
      key={project}
      project={project}
      view={view}
      onView={(v) =>
        router.push(`/projects/commercial?project=${project}&view=${v}`)
      }
      picker={
        <>
          <LookupField
            name="commercial-project"
            label="Project"
            value={project}
            onChange={changeProject}
            search={search}
            onSearch={setSearch}
            options={(projects.data?.items ?? []).map((p) => ({
              id: p.id,
              display_name: p.title,
              display_number: p.display_number,
            }))}
            loading={projects.loading}
            more={!!projects.data?.next_cursor}
            error={!!projects.error}
          />
          <ReadState
            loading={false}
            error={projects.error}
            retry={projects.reload}
          />
        </>
      }
    />
  );
}
function CommercialWorkspace({
  project,
  view,
  onView,
  picker,
}: {
  project: string;
  view: string;
  onView: (v: string) => void;
  picker: React.ReactNode;
}) {
  const router = useRouter();
  const list = useCommercialList(project),
    finance = useResource<Finance>(
      project ? `projects/${project}/commercial/finance` : null,
    );
  const [menuOpen, setMenuOpen] = useState(true),
    menu = useSecondaryMenu(menuOpen, setMenuOpen);
  const [intent, setIntent] = useState<Intent | null>(null),
    [preview, setPreview] = useState<Row | null>(null);
  const [selection, setSelection] = useState<string[]>([]);
  const rows = list.data?.items ?? [],
    context = list.data?.context;
  const current = !!context && !list.loading && !list.error;
  const basis = rows.find((x) => x.kind === "Basis" && x.state === "Approved");
  const selected = rows.filter(
    (x) => x.kind === (view === "Values" ? "Variation" : view),
  );
  const chosen = selected.filter((row) => selection.includes(row.id));
  const complete = list.data?.completeness === "Complete";
  const canCreate =
    current &&
    context.can_prepare &&
    context.project.lifecycle === "Active" &&
    (context.project.coordinator_id === context.actor_id ||
      basis?.content.owner_id === context.actor_id) &&
    (view === "Basis" ? !basis : basis?.source_status === "Current");
  const groups = complete
    ? groupOrder
        .map((name) => ({
          name,
          rows: selected.filter(
            (row) =>
              group(row, context?.project.timezone, list.data?.observed_at) ===
              name,
          ),
        }))
        .filter((g) => g.rows.length)
    : [{ name: "Permitted records · incomplete list", rows: selected }];
  const refresh = () => {
    list.reload();
    finance.reload();
    setPreview(null);
    setSelection([]);
  };
  const openCreate = () =>
    setIntent({ action: "Create", kind: view as Kind, basis: basis?.id });
  return (
    <SecondaryMenuFrame
      state={menu}
      id="ppo-commercial"
      name="Variations & obligations"
      menuId="commercial-menu"
      contentId="commercial-content"
      attributes={{ "data-ppo-workspace": "shared" }}
      message={list.loading ? "Loading commercial records" : ""}
      phoneHeader={{ title: "Variations & obligations" }}
      menu={
        <>
          {views.map((v) => (
            <Fragment key={v.id}>
              {v.id === "Values" && (
                <div className="commercial-menu-heading">Finance</div>
              )}
              <button
                type="button"
                key={v.id}
                className="commercial-menu-item"
                aria-current={view === v.id ? "page" : undefined}
                onClick={() => {
                  onView(v.id);
                  menu.closeOverlay();
                }}
              >
                {v.label}
              </button>
            </Fragment>
          ))}
          <div className="commercial-menu-heading">This project</div>
          {project && (
            <Link
              className="commercial-menu-item"
              href={`/projects/${project}`}
            >
              Open project page
            </Link>
          )}
        </>
      }
    >
      {context && !intent && (
        <PendingCommercialSave
          context={context}
          onRecover={() => setIntent({ action: "Create", kind: "Variation" })}
        />
      )}
      <div className="commercial-toolbar">
        <div className="commercial-picker">{picker}</div>
        <div className="commercial-toolbar-actions">
          {complete && (
            <span className="commercial-desktop-utility">
              {selected.length}{" "}
              {views.find((v) => v.id === view)?.label.toLowerCase()}
            </span>
          )}
          <Button
            className="commercial-desktop-utility"
            onClick={refresh}
            disabled={!project || !!intent}
          >
            Refresh
          </Button>
          {view !== "Values" && (
            <Button
              variant="primary"
              className="commercial-create"
              aria-label={
                view === "Notice"
                  ? "Record a notice"
                  : view === "Basis"
                    ? "Propose basis"
                    : `New ${view.toLowerCase()}`
              }
              disabled={!canCreate}
              onClick={openCreate}
            >
              <span className="commercial-create-text">
                {view === "Notice"
                  ? "Record a notice"
                  : view === "Basis"
                    ? "Propose basis"
                    : `New ${view.toLowerCase()}`}
              </span>
              <span className="commercial-create-icon" aria-hidden="true">
                +
              </span>
            </Button>
          )}
        </div>
      </div>
      {!project ? (
        <RegisterEmpty title="Choose a project">
          Read variations, obligations and recorded notices for one project.
        </RegisterEmpty>
      ) : (
        <>
          <ReadState
            loading={list.loading}
            error={list.error}
            retry={refresh}
            retained={!!list.data}
          />
          {(view === "Variation" || view === "Values") && current && (
            <ControlValues
              data={finance.data}
              error={finance.error}
              loading={finance.loading}
              retry={finance.reload}
            />
          )}
          <div className="commercial-phone-view">
            <label>
              View
              <select value={view} onChange={(e) => onView(e.target.value)}>
                {views.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>
            {complete && <span>{selected.length}</span>}
            <Button onClick={refresh} disabled={!project || !!intent}>
              Refresh
            </Button>
          </div>
          {context?.project.lifecycle !== "Active" && context && (
            <p className="commercial-banner">
              This project is closed. Reopen it through its native workflow
              before changing commercial records.
            </p>
          )}
          {current && !basis && (
            <p className="commercial-banner">
              No approved original basis is available. Propose and independently
              approve the basis before adding variations, obligations or
              notices.
            </p>
          )}
          {current && basis?.source_status === "Changed" && (
            <p className="commercial-banner" role="status">
              The retained commercial basis changed. New records and decisions
              are held until its source is reconciled.
            </p>
          )}
          {list.data?.completeness === "Partial" && (
            <p className="commercial-banner">
              Some records are unavailable or the list is incomplete. Complete
              counts are not shown.
            </p>
          )}
          {view === "Notice" && (
            <p className="commercial-banner">
              Notices are evidence your team records after a notice was given or
              received. PPO sends nothing and makes no delivery claim. Plan a
              future notice as an obligation or an Activity.
            </p>
          )}
          {view === "Values" ? (
            <>
              {current &&
                finance.data &&
                !finance.error &&
                !finance.loading && (
                  <ValueBreakdown
                    data={finance.data}
                    rows={rows}
                    project={project}
                  />
                )}
            </>
          ) : (
            <>
              <div className="commercial-desktop-table">
                {chosen.length > 0 && (
                  <div className="commercial-selection" role="status">
                    {chosen.length} selected
                    {chosen.length === 1 && (
                      <Button
                        disabled={!current}
                        onClick={() => setPreview(chosen[0])}
                      >
                        Preview selected
                      </Button>
                    )}
                    <Button onClick={() => setSelection([])}>
                      Clear selection
                    </Button>
                  </div>
                )}
                <RegisterTable
                  caption={`${views.find((v) => v.id === view)?.label}. Open a title for its record; Preview shows its current summary.`}
                  stale={!current}
                  empty={
                    !selected.length && !list.loading && !list.error ? (
                      <RegisterEmpty
                        title={`No ${views.find((v) => v.id === view)?.label.toLowerCase()}`}
                      >
                        No permitted records in this view.
                      </RegisterEmpty>
                    ) : undefined
                  }
                  footer={
                    <RegisterFooter>
                      {complete
                        ? `End of list · ${selected.length} records · grouped by state, newest change first`
                        : "Incomplete permitted list · complete counts unavailable"}
                      {list.data && (
                        <>
                          {" "}
                          · read <Stamp value={list.data.observed_at} />
                        </>
                      )}
                    </RegisterFooter>
                  }
                >
                  <thead>
                    <tr>
                      <th className="ppo-register-check">
                        <input
                          type="checkbox"
                          aria-label="Select all records in this view"
                          disabled={!current || !selected.length}
                          checked={
                            selected.length > 0 &&
                            chosen.length === selected.length
                          }
                          onChange={(e) =>
                            setSelection(
                              e.target.checked
                                ? selected.map((row) => row.id)
                                : [],
                            )
                          }
                        />
                      </th>
                      <th>{kindLabel(view as Kind)}</th>
                      <th>{view === "Notice" ? "Occurred" : "State"}</th>
                      {view === "Variation" ? (
                        <>
                          <th>Requested</th>
                          <th>Priced</th>
                          <th>Approved</th>
                        </>
                      ) : view === "Obligation" ? (
                        <>
                          <th>Due</th>
                          <th>Activities</th>
                        </>
                      ) : view === "Notice" ? (
                        <>
                          <th>Record</th>
                          <th>Clause</th>
                        </>
                      ) : (
                        <th>Clause</th>
                      )}
                      <th>{view === "Notice" ? "Recorded by" : "Owner"}</th>
                      <th>
                        <span className="commercial-sr-only">Settings</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((g) => (
                      <Fragment key={g.name}>
                        <tr
                          className="commercial-group"
                          data-state-group={g.name}
                        >
                          <th
                            colSpan={
                              view === "Variation"
                                ? 8
                                : view === "Obligation"
                                  ? 7
                                  : view === "Notice"
                                    ? 7
                                    : 6
                            }
                          >
                            {g.name}
                            {complete ? ` · ${g.rows.length}` : ""}
                          </th>
                        </tr>
                        {g.rows.map((row) => (
                          <tr
                            key={row.id}
                            data-selected={
                              selection.includes(row.id) || undefined
                            }
                          >
                            <td className="ppo-register-check">
                              <input
                                type="checkbox"
                                aria-label={`Select ${row.content.title}`}
                                disabled={!current}
                                checked={selection.includes(row.id)}
                                onChange={(e) =>
                                  setSelection((old) =>
                                    e.target.checked
                                      ? [...old, row.id]
                                      : old.filter((id) => id !== row.id),
                                  )
                                }
                              />
                            </td>
                            <td className="ppo-register-wrap">
                              <Link
                                className="ppo-register-row-title"
                                href={recordHref(project, row.id)}
                              >
                                {row.content.title}
                              </Link>
                              {row.source_status === "Changed" && (
                                <small>Source changed</small>
                              )}
                            </td>
                            <td>
                              {view === "Notice" ? (
                                <Stamp value={row.content.occurred_at} />
                              ) : (
                                <CommercialState row={row} />
                              )}
                            </td>
                            {view === "Variation" ? (
                              <>
                                <td>
                                  {moneyLabel(row.content.requested_amount)}
                                </td>
                                <td>
                                  {moneyLabel(
                                    row.content.priced_amount,
                                    "Not priced",
                                  )}
                                </td>
                                <td>
                                  {row.state === "Approved"
                                    ? moneyLabel(row.content.priced_amount)
                                    : "—"}
                                </td>
                              </>
                            ) : view === "Obligation" ? (
                              <>
                                <td>
                                  {row.content.due_date ?? "Date needed"}
                                  {context &&
                                    obligationOverdue(
                                      row,
                                      context.project.timezone,
                                      new Date(list.data!.observed_at),
                                    ) && <small>Overdue</small>}
                                </td>
                                <td>
                                  {row.activity_counts.open
                                    ? `${row.activity_counts.open} open`
                                    : row.activity_counts.closed
                                      ? `${row.activity_counts.closed} closed`
                                      : "None"}
                                </td>
                              </>
                            ) : view === "Notice" ? (
                              <>
                                <td>{noticeRelation(row)}</td>
                                <td>{row.content.clause}</td>
                              </>
                            ) : (
                              <td>{row.content.clause}</td>
                            )}
                            <td>
                              {view === "Notice"
                                ? row.recorded_by_name
                                : row.owner_name}
                            </td>
                            <td>
                              <Button
                                variant="quiet"
                                className="commercial-row-preview"
                                aria-label={`Preview ${row.content.title}`}
                                disabled={!current}
                                onClick={() => setPreview(row)}
                              >
                                <span aria-hidden="true">…</span>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    ))}
                  </tbody>
                </RegisterTable>
              </div>
              <div className="commercial-phone-list">
                {groups.map((g) => (
                  <section key={g.name} data-state-group={g.name}>
                    <h2>
                      {g.name}
                      {complete ? ` · ${g.rows.length}` : ""}
                    </h2>
                    {g.rows.map((row) => (
                      <article key={row.id}>
                        <Link
                          className="ppo-register-row-title"
                          href={recordHref(project, row.id)}
                        >
                          {row.content.title}
                        </Link>
                        <p>
                          {context &&
                            obligationOverdue(
                              row,
                              context.project.timezone,
                              new Date(list.data!.observed_at),
                            ) && <strong>Overdue · </strong>}
                          {row.content.clause} ·{" "}
                          {view === "Notice"
                            ? row.recorded_by_name
                            : row.owner_name}{" "}
                          · <CommercialState row={row} />
                        </p>
                        <p>
                          {view === "Variation"
                            ? `Priced ${moneyLabel(row.content.priced_amount, "not priced")} · requested ${moneyLabel(row.content.requested_amount, "unknown")}`
                            : view === "Obligation"
                              ? (row.content.due_date ?? "Date needed")
                              : view === "Notice"
                                ? noticeRelation(row)
                                : row.note}
                        </p>
                        <Button
                          variant="quiet"
                          className="commercial-row-preview"
                          disabled={!current}
                          onClick={() => setPreview(row)}
                          aria-label={`Preview ${row.content.title}`}
                        >
                          <span aria-hidden="true">…</span>
                        </Button>
                      </article>
                    ))}
                  </section>
                ))}
                {!selected.length && !list.loading && (
                  <p>No permitted records in this view.</p>
                )}
              </div>
            </>
          )}
        </>
      )}
      {preview && current && (
        <WorklistPanel
          title={preview.content.title}
          drawer
          onClose={() => setPreview(null)}
        >
          <CommercialState row={preview} />
          <p>
            {preview.content.clause} · {preview.owner_name} · version{" "}
            {preview.version}
          </p>
          <p>{preview.content.detail}</p>
          {preview.kind === "Variation" && (
            <p>
              Requested {moneyLabel(preview.content.requested_amount)} · Priced{" "}
              {moneyLabel(preview.content.priced_amount, "Not priced")}
            </p>
          )}
          <p>{preview.note}</p>
          <ButtonLink href={recordHref(project, preview.id)}>
            Open {kindLabel(preview.kind).toLowerCase()}
          </ButtonLink>
        </WorklistPanel>
      )}
      {intent && context && (
        <CommercialCommand
          intent={intent}
          context={context}
          onClose={() => setIntent(null)}
          onSaved={(id) => {
            setIntent(null);
            router.push(recordHref(project, id));
          }}
        />
      )}
    </SecondaryMenuFrame>
  );
}
