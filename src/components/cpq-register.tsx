"use client";
import { useState } from "react";
import Link from "next/link";
import { useCrmResource } from "./crm-state";
import { ErrorNotice } from "./business-ui";
import { Button, ButtonLink } from "./ui/button";
import { RegisterTable, RegisterEmpty } from "./ui/register-table";
import { ProductIcon } from "./product-icons";
import {
  CpqFrame,
  CpqNav,
  CpqHeader,
  CpqPill,
  CpqDialog,
  CpqEmpty,
  useCpqCompany,
  money,
  stamp,
  type Wire,
} from "./cpq-ui";
import type { configurationRegister, ruleRegister } from "../cpq/ui-reads";
import type { listDrafts } from "../cpq/drafts";
import type { listDiscoveryWorkspaces } from "../estimating/discovery-workspaces";

export function CpqRegister({ rules = false }: { rules?: boolean }) {
  const company = useCpqCompany(),
    [search, setSearch] = useState(""),
    [state, setState] = useState("All"),
    [create, setCreate] = useState(false);
  const configurations = useCrmResource<
    Wire<Awaited<ReturnType<typeof configurationRegister>>>
  >(
    company && !rules ? `cpq/configurations?company_id=${company}` : null,
    true,
  );
  const registry = useCrmResource<
    Wire<Awaited<ReturnType<typeof ruleRegister>>>
  >(company && rules ? `cpq/rules?company_id=${company}` : null, true);
  const drafts = useCrmResource<Wire<Awaited<ReturnType<typeof listDrafts>>>>(
    company
      ? `cpq/drafts?company_id=${company}&kind=${rules ? "Rules" : "Configuration"}`
      : null,
    true,
  );
  const workspaces = useCrmResource<
    Wire<Awaited<ReturnType<typeof listDiscoveryWorkspaces>>>
  >(create && !rules ? "estimating/workspaces" : null, true);
  const rows = rules ? registry.data?.items : configurations.data?.items;
  const matches = (title: string, status: string) =>
    title.toLowerCase().includes(search.toLowerCase()) &&
    (state === "All" || status === state);
  const editable = rules
    ? registry.data?.can_author
    : configurations.data?.can_calculate;
  return (
    <CpqFrame
      name={rules ? "Rules studio" : "Configure & price"}
      menu={
        <>
          <CpqNav
            label={rules ? "All rules" : "All configurations"}
            selected={state === "All"}
            onClick={() => setState("All")}
          />
          <CpqNav
            label="Working drafts"
            selected={state === "Working"}
            icon="edit"
            onClick={() => setState("Working")}
          />
          <CpqNav
            label={rules ? "Ready for review" : "Ready to use"}
            selected={state === (rules ? "Draft" : "Ready")}
            icon="check"
            onClick={() => setState(rules ? "Draft" : "Ready")}
          />
          <CpqNav
            label={rules ? "Active releases" : "Needs attention"}
            selected={state === (rules ? "Published" : "Blocked")}
            icon="warning"
            onClick={() => setState(rules ? "Published" : "Blocked")}
          />
          <hr />
          <CpqNav
            label={rules ? "Configure & price" : "Rules studio"}
            icon={rules ? "products" : "documents"}
            href={rules ? "/estimating/cpq" : "/estimating/rules"}
          />
          <CpqNav
            label="Estimation wizard"
            icon="nav-wizard"
            href="/estimating/discovery"
          />
        </>
      }
    >
      <CpqHeader
        title={rules ? "Rules studio" : "Configure & price"}
        context={
          rules
            ? "Rules and configuration data"
            : "Configurations across estimates"
        }
      >
        {editable &&
          (rules ? (
            <ButtonLink variant="primary" href="/estimating/rules/new">
              <ProductIcon name="plus" />
              New rule set
            </ButtonLink>
          ) : (
            <Button variant="primary" onClick={() => setCreate(true)}>
              <ProductIcon name="plus" />
              New configuration
            </Button>
          ))}
      </CpqHeader>
      <div className="cpq-scroll">
        <div className="cpq-toolbar">
          <input
            aria-label={rules ? "Search rules" : "Search configurations"}
            placeholder={rules ? "Search rules" : "Search configurations"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span>
            {rows?.length ?? 0} {rules ? "rules" : "configurations"} ·{" "}
            {drafts.data?.items.length ?? 0} drafts <small>· up to 100</small>
          </span>
        </div>
        <ErrorNotice
          error={configurations.error ?? registry.error ?? drafts.error}
        />
        {!company && <CpqEmpty>Select a working company to view CPQ.</CpqEmpty>}
        {(configurations.loading || registry.loading || drafts.loading) && (
          <p role="status">Loading CPQ…</p>
        )}
        {!!drafts.data?.items.filter((d) => matches(d.label, "Working"))
          .length && (
          <section className="cpq-stack-tight">
            <h2>Working drafts</h2>
            {drafts.data.items
              .filter((d) => matches(d.label, "Working"))
              .map((d) => (
                <article className="cpq-card cpq-section-head" key={d.id}>
                  <div>
                    <Link
                      href={
                        d.kind === "Rules"
                          ? `/estimating/rules/${d.release_id ?? "new"}?draft=${d.id}`
                          : `/estimating/cpq/${d.estimating_workspace_id}?option=${d.option_id}&draft=${d.id}`
                      }
                    >
                      {d.label}
                    </Link>
                    <small>
                      {" "}
                      · Saved {stamp(d.updated_at)} · draft {d.version}
                    </small>
                  </div>
                  <CpqPill>Working draft</CpqPill>
                </article>
              ))}
          </section>
        )}
        {rules ? (
          <RegisterTable
            caption="Rules; open a rule to inspect or edit its current version."
            empty={
              !registry.data?.items.some((r) =>
                matches(r.rule.description, r.state),
              ) && (
                <RegisterEmpty title="No matching rules">
                  Create a rule set to start authoring.
                </RegisterEmpty>
              )
            }
          >
            <thead>
              <tr>
                <th>Rule</th>
                <th>Action / phase</th>
                <th>Release</th>
                <th>Version</th>
                <th>State</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {registry.data?.items
                .filter((r) =>
                  matches(r.rule.description + " " + r.rule.key, r.state),
                )
                .map((r) => (
                  <tr key={r.release_id + r.rule.key}>
                    <td>
                      <Link
                        href={`/estimating/rules/${r.release_id}?rule=${r.rule.key}`}
                      >
                        {r.rule.description}
                      </Link>
                      <small className="cpq-subtext">{r.rule.key}</small>
                    </td>
                    <td>
                      {r.rule.phase === "Labour" ? "Add labour" : "Add part"}
                    </td>
                    <td>{r.label}</td>
                    <td>
                      {r.rule_version
                        ? `v${r.rule_version}`
                        : `Release ${r.release_version}`}
                    </td>
                    <td>
                      <CpqPill
                        tone={r.state === "Published" ? "good" : "neutral"}
                      >
                        {r.state === "Published"
                          ? "Published version"
                          : r.state}
                      </CpqPill>
                    </td>
                    <td>{stamp(r.updated_at)}</td>
                  </tr>
                ))}
            </tbody>
          </RegisterTable>
        ) : (
          <RegisterTable
            caption="Configurations; open a configuration to continue or review its saved evaluation."
            empty={
              !configurations.data?.items.some((r) =>
                matches(r.title, r.state),
              ) && (
                <RegisterEmpty title="No matching configurations">
                  Start from a selected, complete option in the estimation
                  wizard.
                </RegisterEmpty>
              )
            }
          >
            <thead>
              <tr>
                <th>Configuration / estimate</th>
                <th>Customer</th>
                <th>Readiness</th>
                <th>Proposed sell</th>
                <th>Margin</th>
                <th>Saved</th>
              </tr>
            </thead>
            <tbody>
              {configurations.data?.items
                .filter((r) => matches(r.title + " " + r.option_label, r.state))
                .map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link
                        href={`/estimating/cpq/${r.estimating_workspace_id}?option=${r.option_id}${editable ? "" : `&evaluation=${r.id}`}`}
                      >
                        {r.title}
                      </Link>
                      <small className="cpq-subtext">{r.option_label}</small>
                    </td>
                    <td>{r.customer}</td>
                    <td>
                      <CpqPill tone={r.state === "Ready" ? "good" : "warning"}>
                        {r.state === "Ready"
                          ? "Ready to use"
                          : `${r.diagnostic_count} checks`}
                      </CpqPill>
                    </td>
                    <td>
                      {r.state === "Ready" ? "AUD " : "Indicative "}
                      {money(r.totals.sell)}
                    </td>
                    <td>{r.totals.margin_percent ?? "—"}%</td>
                    <td>{stamp(r.created_at)}</td>
                  </tr>
                ))}
            </tbody>
          </RegisterTable>
        )}
      </div>
      {create && (
        <CpqDialog title="New configuration" onClose={() => setCreate(false)}>
          <p>Choose a selected option with complete requirements.</p>
          <ErrorNotice error={workspaces.error} />
          <div className="cpq-stack-tight">
            {workspaces.data?.items.map((w) => {
              const option = w.options.find(
                (o) =>
                  o.id === w.selected_option_id &&
                  o.state === "Active" &&
                  o.scope_readiness === "Complete",
              );
              return (
                option && (
                  <ButtonLink
                    key={w.id}
                    href={`/estimating/cpq/${w.id}?option=${option.id}`}
                  >
                    {w.title} · {option.label}
                  </ButtonLink>
                )
              );
            })}
            {workspaces.data &&
              !workspaces.data.items.some((w) =>
                w.options.some(
                  (o) =>
                    o.id === w.selected_option_id &&
                    o.state === "Active" &&
                    o.scope_readiness === "Complete",
                ),
              ) && (
                <CpqEmpty>
                  No complete selected options.{" "}
                  <Link href="/estimating/discovery">
                    Open the estimation wizard
                  </Link>
                  .
                </CpqEmpty>
              )}
          </div>
        </CpqDialog>
      )}
    </CpqFrame>
  );
}
