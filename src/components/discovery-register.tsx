"use client";
import Link from "next/link";
import { Fragment, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useIdentity } from "./business-session";
import { denied, useCrmResource } from "./crm-state";
import { SecondaryMenuFrame, useSecondaryMenu } from "../shell/secondary-menu";
import { usePhoneHeader, type PhoneHeaderConfig } from "../shell/phone-header";
import { Button, ButtonLink } from "./ui/button";
import { RegisterTable, RegisterChip } from "./ui/register-table";
import { WorklistChoice, WorklistPanel } from "./crm-worklist-tools";
import { ShellIcon } from "./shell-icon";
import { DiscoveryRegisterIcon as Icon } from "./discovery-register-icon";
import { DiscoverySnapshot } from "./discovery-register-snapshot";
import {
  costLabel,
  phoneCostLabel,
  discoveryViews,
  matchesDiscoveryView,
  optionLetter,
  readiness,
  revisionLabel,
  selectedOption,
  type DiscoveryRegisterData,
  type DiscoveryRegisterRow,
  type DiscoveryView,
} from "../estimating/discovery-register-model";
import "./discovery-register.css";

const shortDate = (value: string) =>
  new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    timeZone: "Australia/Brisbane",
  }).format(new Date(value));
const readTime = (value: string) =>
  new Intl.DateTimeFormat("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Australia/Brisbane",
  }).format(new Date(value));
function PhoneConfig({ config }: { config: PhoneHeaderConfig }) {
  usePhoneHeader(config);
  return null;
}
export function DiscoveryReadiness({ row }: { row: DiscoveryRegisterRow }) {
  const option = selectedOption(row),
    label = readiness(option);
  return (
    <RegisterChip
      tone={
        label === "Complete"
          ? "positive"
          : label === "Incomplete"
            ? "attention"
            : "neutral"
      }
    >
      {label}
    </RegisterChip>
  );
}
export function DiscoveryRegister() {
  const params = useSearchParams();
  return (
    <Register
      key={params.toString()}
      query={new URLSearchParams(params.toString())}
    />
  );
}
function Register({ query }: { query: URLSearchParams }) {
  const router = useRouter(),
    identity = useIdentity();
  const [menuOpen, setMenuOpen] = useState(true),
    menu = useSecondaryMenu(menuOpen, setMenuOpen);
  const snapshotOpener = useRef<HTMLElement | null>(null);
  const closeSnapshot = () => {
    setSnapshot(null);
    requestAnimationFrame(() =>
      snapshotOpener.current?.focus({ preventScroll: true }),
    );
  };
  const [filterOpen, setFilterOpen] = useState(false),
    [snapshot, setSnapshot] = useState<string | null>(null);
  const request = query.get("opportunity_id")
    ? `?${new URLSearchParams({ opportunity_id: query.get("opportunity_id")! })}`
    : "";
  const resource = useCrmResource<DiscoveryRegisterData>(
    `estimating/workspaces${request}`,
    true,
  );
  const data = resource.error ? null : resource.data;
  const view =
    discoveryViews.find((v) => v.id === query.get("view"))?.id ?? "All";
  const owner = query.get("owner") ?? "",
    customer = query.get("customer") ?? "";
  const counts = Object.fromEntries(
    discoveryViews.map((v) => [
      v.id,
      data?.items.filter((r) =>
        matchesDiscoveryView(r, v.id, identity.actor_id),
      ).length,
    ]),
  );
  const inView =
    data?.items.filter((r) =>
      matchesDiscoveryView(r, view, identity.actor_id),
    ) ?? [];
  const rows = inView.filter(
    (r) =>
      (!owner || r.owner.id === owner) &&
      (!customer || r.customer.id === customer),
  );
  const owners = [
    ...new Map(data?.items.map((r) => [r.owner.id, r.owner])).values(),
  ];
  const customers = [
    ...new Map(data?.items.map((r) => [r.customer.id, r.customer])).values(),
  ];
  const ownerName =
    owners.find((o) => o.id === owner)?.name ??
    (owner ? "Selected estimator" : "All");
  const customerName =
    customers.find((c) => c.id === customer)?.name ??
    (customer ? "Selected customer" : "All");
  const count = data
    ? owner || customer
      ? `${rows.length} of ${inView.length}`
      : `${rows.length} workspace${rows.length === 1 ? "" : "s"}`
    : resource.loading
      ? "Loading…"
      : "—";
  function change(values: Record<string, string>) {
    const next = new URLSearchParams(query);
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    router.push(`/estimating/discovery${next.size ? `?${next}` : ""}`, {
      scroll: false,
    });
  }
  const filters = (
    <>
      <WorklistChoice
        label="Estimator"
        prefix="Estimator: "
        value={owner}
        options={[
          { id: "", label: "All" },
          ...owners.map((o) => ({ id: o.id, label: o.name })),
        ]}
        onChange={(value) => change({ owner: value })}
      />
      <WorklistChoice
        label="Customer"
        prefix="Customer: "
        value={customer}
        options={[
          { id: "", label: "All" },
          ...customers.map((c) => ({ id: c.id, label: c.name })),
        ]}
        onChange={(value) => change({ customer: value })}
      />
    </>
  );
  const notice = resource.error ? (
    <div className="dr-notice dr-error" role="alert">
      <strong>
        {denied(resource.error)
          ? "Discovery workspaces are outside your access"
          : "Discovery workspaces could not be loaded"}
      </strong>
      <p>
        No list or counts are shown.{" "}
        {denied(resource.error)
          ? "Choose a permitted identity or ask your administrator about access."
          : "Check your connection, then retry. Saved discovery and estimates are unchanged."}
      </p>
      <Button onClick={resource.reload}>Retry loading</Button>
    </div>
  ) : resource.loading ? (
    <div role="status" aria-label="Loading discovery workspaces">
      <p className="dr-loading-label">
        Loading permitted discovery workspaces…
      </p>
      {Array.from({ length: 6 }, (_, i) => (
        <div className="dr-skeleton" key={i} aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
      ))}
    </div>
  ) : data && !rows.length ? (
    <div className="dr-notice">
      <strong>
        {data.items.length
          ? "No matching workspaces"
          : "No discovery workspaces yet"}
      </strong>
      <p>
        {data.items.length
          ? `${discoveryViews.find((v) => v.id === view)!.label} · Estimator: ${ownerName} · Customer: ${customerName}. Clearing filters changes the view only; it never changes a workspace or its saved discovery.`
          : "A workspace starts from an accepted Sales brief or an eligible opportunity without one. Each opportunity has one workspace; its alternatives and revisions live inside it."}
      </p>
      {data.items.length ? (
        <Button onClick={() => change({ view: "", owner: "", customer: "" })}>
          Clear filters
        </Button>
      ) : (
        <ButtonLink href="/estimating/intake">Open Intake</ButtonLink>
      )}
    </div>
  ) : null;
  const current = rows.find((r) => r.id === snapshot);
  return (
    <>
      <SecondaryMenuFrame
        id="ppo-discovery-register"
        name="Estimation wizard"
        menuId="discovery-views"
        contentId="discovery-content"
        state={menu}
        message={data ? count : "Current results unconfirmed"}
        menu={
          <nav aria-label="Discovery views">
            {discoveryViews.map((v, index) => (
              <Fragment key={v.id}>
                {v.group && discoveryViews[index - 1]?.group !== v.group && (
                  <h3>{v.group}</h3>
                )}
                <ul>
                  <li>
                    <Link
                      prefetch={false}
                      href={`/estimating/discovery?${new URLSearchParams({ ...Object.fromEntries(query), view: v.id })}`}
                      aria-current={v.id === view ? "page" : undefined}
                      onClick={() => menu.closeOverlay()}
                    >
                      <Icon
                        name={
                          v.id === "Mine"
                            ? "user"
                            : v.id === "Alternatives"
                              ? "branch"
                              : v.id === "NotCosted"
                                ? "warning"
                                : v.id === "Incomplete"
                                  ? "incomplete"
                                  : v.id === "NotRecorded"
                                    ? "unrecorded"
                                    : v.id === "Complete"
                                      ? "check"
                                      : v.id === "LegacyManual"
                                        ? "legacy"
                                        : v.id === "Ready"
                                          ? "cost"
                                          : "summary"
                        }
                      />
                      <span>{v.label}</span>
                      {data && (
                        <small className="mw-badge">{counts[v.id]}</small>
                      )}
                    </Link>
                  </li>
                </ul>
              </Fragment>
            ))}
          </nav>
        }
      >
        <div className="dr-register">
          <button
            className="dr-tablet-menu-strip"
            type="button"
            aria-label="Show discovery views"
            aria-controls="discovery-views"
            aria-expanded={menu.open}
            onClick={(event) => menu.toggle(event.currentTarget)}
          >
            <span aria-hidden="true" />
          </button>
          <h1 className="sr-only">Discovery register</h1>
          <div className="dr-register-list" inert={!!current && !menu.phone}>
            <div className="dr-toolbar">
              {data?.can_create && (
                <ButtonLink
                  className="dr-create"
                  variant="primary"
                  href="/estimating/discovery/new"
                >
                  <Icon name="plus" />
                  New discovery workspace
                </ButtonLink>
              )}
              <div className="dr-desktop-filters">{filters}</div>
              <div className="dr-phone-view">
                <WorklistChoice
                  label="Discovery view"
                  value={view}
                  options={discoveryViews.map((v) => ({
                    id: v.id,
                    label: v.label,
                  }))}
                  onChange={(value) => change({ view: value as DiscoveryView })}
                />
              </div>
              <span className="dr-count">
                {count}
                {data && !data.can_create && (
                  <span className="dr-view-only"> · view only</span>
                )}
                <span className="dr-desktop-time">
                  {data &&
                    ` · as at ${shortDate(data.as_at)}, ${readTime(data.as_at)}`}
                </span>
              </span>
              <Button
                className="dr-filter dr-icon-button"
                aria-label="Filter workspaces"
                onClick={() => setFilterOpen(true)}
              >
                <Icon name="filter" />
              </Button>
              <Button
                className="dr-refresh dr-icon-button"
                aria-label="Refresh workspaces"
                disabled={resource.loading}
                onClick={resource.reload}
              >
                <Icon name="refresh" />
              </Button>
              <Button
                className="dr-more dr-icon-button"
                aria-label="More actions unavailable"
                title="More actions unavailable"
                disabled
              >
                <Icon name="more" />
              </Button>
            </div>
            <div className="dr-phone-context">
              <WorklistChoice
                label="Estimator"
                prefix="Estimator: "
                value={owner}
                options={[
                  { id: "", label: "All" },
                  ...owners.map((o) => ({ id: o.id, label: o.name })),
                ]}
                onChange={(value) => change({ owner: value })}
              />
              <span>
                {data
                  ? `As at ${readTime(data.as_at)}`
                  : "Current results unconfirmed"}
              </span>
              <Button
                className="dr-icon-button"
                aria-label="Refresh workspaces"
                disabled={resource.loading}
                onClick={resource.reload}
              >
                <Icon name="refresh" />
              </Button>
            </div>
            <div className="dr-desktop-grid">
              <RegisterTable
                caption="Discovery workspaces. Open a title to inspect its read-only snapshot."
                empty={notice}
              >
                <thead>
                  <tr>
                    {[
                      "Select",
                      "Title",
                      "Customer",
                      "Readiness",
                      "Cost basis",
                      "Selected option",
                      "Opportunity",
                      "Discovery",
                      "Options",
                      "Estimator",
                      "Changed",
                      "Settings",
                    ].map((label, index) => (
                      <th
                        key={label}
                        scope="col"
                        className={`dr-col-${index}`}
                        aria-sort={
                          label === "Changed" ? "descending" : undefined
                        }
                      >
                        {index === 0 ? (
                          <input
                            type="checkbox"
                            disabled
                            aria-label="Bulk actions unavailable"
                          />
                        ) : index === 11 ? (
                          <span title="Column settings unavailable">
                            <ShellIcon name="settings" />
                          </span>
                        ) : (
                          label
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data &&
                    rows.map((row) => {
                      const option = selectedOption(row);
                      return (
                        <tr key={row.id}>
                          <td>
                            <input
                              type="checkbox"
                              disabled
                              aria-label={`Selection unavailable for ${row.title}`}
                            />
                          </td>
                          <td>
                            <button
                              className="dr-title"
                              onClick={(event) => {
                                snapshotOpener.current = event.currentTarget;
                                setSnapshot(row.id);
                              }}
                            >
                              {row.title}
                            </button>
                          </td>
                          <td title={row.customer.name}>{row.customer.name}</td>
                          <td>
                            <DiscoveryReadiness row={row} />
                          </td>
                          <td title={costLabel(row)}>{costLabel(row)}</td>
                          <td>
                            {optionLetter(option.ordinal)} · {option.label}
                          </td>
                          <td>{row.display_number}</td>
                          <td>
                            {option.kind === "LegacyManual"
                              ? "Legacy"
                              : revisionLabel(option.revision)}
                          </td>
                          <td>{row.options.length}</td>
                          <td>{row.owner.name}</td>
                          <td>
                            <time dateTime={row.updated_at}>
                              {shortDate(row.updated_at)}
                            </time>
                          </td>
                          <td>
                            <Button
                              variant="quiet"
                              className="dr-icon-button"
                              aria-label={`Inspect ${row.title}`}
                              onClick={(event) => {
                                snapshotOpener.current = event.currentTarget;
                                setSnapshot(row.id);
                              }}
                            >
                              <Icon name="more" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </RegisterTable>
              {data && rows.length > 0 && (
                <p className="dr-footnote">
                  {!data.can_create &&
                    "View only: creating a workspace needs estimating edit permission. "}
                  Up to {data.limit} permitted workspaces, most recently changed
                  first. One row per opportunity shows its selected option;
                  alternatives and saved revisions open in the snapshot.
                  Complete discovery is scope evidence only: it approves no
                  price and issues no quotation.
                </p>
              )}
            </div>
            <div className="dr-phone-list">
              {notice}
              {data &&
                rows.map((row) => {
                  const option = selectedOption(row);
                  return (
                    <Link
                      prefetch={false}
                      href={`/estimating/discovery/${row.id}`}
                      className="dr-phone-row"
                      key={row.id}
                    >
                      <div>
                        <div className="dr-phone-title">
                          <strong>{row.title}</strong>
                          <time dateTime={row.updated_at}>
                            {shortDate(row.updated_at)}
                          </time>
                        </div>
                        <div className="dr-phone-reference">
                          {row.display_number} · {row.customer.name}
                          <span
                            className="dr-phone-option"
                            data-base={option.ordinal === 1}
                          >
                            {" "}
                            · {optionLetter(option.ordinal)}
                          </span>
                        </div>
                        <div
                          className="dr-phone-state"
                          data-readiness={readiness(option)}
                        >
                          <Icon
                            name={
                              option.scope_readiness === "Complete"
                                ? "check"
                                : option.scope_readiness === "Incomplete"
                                  ? "warning"
                                  : option.kind === "LegacyManual"
                                    ? "legacy"
                                    : "unrecorded"
                            }
                          />
                          <span>
                            {option.kind === "LegacyManual"
                              ? "Legacy manual basis"
                              : readiness(option)}{" "}
                            · {phoneCostLabel(row)}
                          </span>
                        </div>
                      </div>
                      <Icon name="chevron-right" />
                    </Link>
                  );
                })}
            </div>
            {data?.can_create && (
              <ButtonLink
                className="dr-phone-create"
                variant="primary"
                href="/estimating/discovery/new"
                aria-label="New discovery workspace"
              >
                <Icon name="plus" />
              </ButtonLink>
            )}
          </div>
          {current && !menu.phone && (
            <DiscoverySnapshot
              key={current.id}
              row={current}
              rows={rows}
              onSelect={setSnapshot}
              onClose={closeSnapshot}
            />
          )}
        </div>
      </SecondaryMenuFrame>
      <PhoneConfig
        config={{
          title: "Estimation wizard",
          count: data ? rows.length : undefined,
          chooseView: {
            open: (opener) => menu.toggle(opener),
            expanded: menu.open,
            controls: "discovery-views",
          },
          filter: {
            open: () => setFilterOpen(true),
            applied: !!(owner || customer || view !== "All"),
          },
        }}
      />
      {filterOpen && (
        <WorklistPanel
          title="Filter discovery workspaces"
          onClose={() => setFilterOpen(false)}
        >
          {filters}
          <p>
            Filters cover the current window of up to 100 permitted workspaces.
          </p>
          <Button onClick={() => change({ owner: "", customer: "" })}>
            Clear filters
          </Button>
        </WorklistPanel>
      )}
    </>
  );
}
