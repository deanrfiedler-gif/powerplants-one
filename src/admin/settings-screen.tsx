"use client";
import "./settings.css";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { SecondaryMenuFrame, useSecondaryMenu } from "../shell/secondary-menu";
import type { PhoneHeaderConfig } from "../shell/phone-header";
import { usePlatformResource } from "../components/platform-resource";
import { ReadState, Stamp } from "../components/business-ui";
import { Button } from "../components/ui/button";
import {
  RegisterTable,
  RegisterFooter,
  RegisterEmpty,
  RegisterChip,
  RegisterSortHeader,
} from "../components/ui/register-table";
import type { readSettings } from "./settings";
import type { readBusinessPolicies } from "./policies";
type Settings = Awaited<ReturnType<typeof readSettings>>;
export function SettingsFrame({
  children,
  record = false,
  phoneHeader,
  settingsSource,
}: {
  children: ReactNode;
  record?: boolean;
  phoneHeader?: Omit<PhoneHeaderConfig, "chooseView">;
  settingsSource?: ReturnType<typeof usePlatformResource<Settings>>;
}) {
  const [open, setOpen] = useState(!record);
  const menu = useSecondaryMenu(open, setOpen);
  const ownSource = usePlatformResource<Settings>(
    settingsSource ? null : "admin/settings",
  );
  const source = settingsSource ?? ownSource;
  const data = !source.loading && !source.error ? source.data : undefined;
  return (
    <SecondaryMenuFrame
      state={menu}
      id="ppo-settings"
      name="Settings"
      menuId="settings-menu"
      contentId="settings-content"
      attributes={{
        "data-ppo-workspace": "shared",
        "data-policy-record": record ? "true" : undefined,
      }}
      phoneHeader={phoneHeader ?? { title: "Settings" }}
      message={source.loading ? "Loading configuration access…" : "Settings"}
      menu={
        <>
          <h2 className="mw-menu-heading">Settings</h2>
          <Link className="settings-menu-link" href="/admin/settings">
            Overview
          </Link>
          {data?.areas.some((a) => a.id === "policies") && (
            <>
              <h3 className="mw-menu-heading">Business policies</h3>
              <Link className="settings-menu-link" href="/admin/policies">
                All policies
              </Link>
              <Link
                className="settings-menu-link"
                href="/admin/policies?state=waiting-to-publish"
              >
                Waiting to publish
              </Link>
              <Link
                className="settings-menu-link"
                href="/admin/policies/record-references"
              >
                Record references
              </Link>
            </>
          )}
          {data?.areas.some(
            (a) => a.id !== "policies" && a.id !== "health",
          ) && <h3 className="mw-menu-heading">Configuration areas</h3>}
          {data?.areas
            .filter((a) => a.id !== "policies" && a.id !== "health")
            .map((a) => (
              <Link className="settings-menu-link" key={a.id} href={a.href!}>
                {a.name}
              </Link>
            ))}
          {(data?.foundation_available ||
            data?.areas.some((a) => a.id === "health")) && (
            <>
              <h3 className="mw-menu-heading">Support</h3>
              {data.areas.some((a) => a.id === "health") && (
                <Link className="settings-menu-link" href="/admin">
                  Exceptions and recovery
                </Link>
              )}
              {data.foundation_available && (
                <Link className="settings-menu-link" href="/foundation">
                  Foundation checks
                </Link>
              )}
            </>
          )}
          <ReadState {...source} retry={source.reload} />
        </>
      }
    >
      {children}
    </SecondaryMenuFrame>
  );
}
export function SettingsHub() {
  const source = usePlatformResource<Settings>("admin/settings");
  const data = !source.loading && !source.error ? source.data : undefined;
  return (
    <SettingsFrame settingsSource={source}>
      <div className="settings-overview">
        <h1 className="settings-page-title">Settings</h1>
        <p className="settings-intro">
          Company-wide configuration for Powerplants One. Rules that change how
          work is checked are published as reviewed versions with a start date;
          publishing never rewrites a booking, a record or an issued document.
        </p>
        <ReadState {...source} retry={source.reload} />
        {data && (
          <>
            {!data.areas.length ? (
              <RegisterEmpty title="No configuration area permitted">
                <p>Your current access does not open a configuration area.</p>
              </RegisterEmpty>
            ) : (
              <>
                <section
                  className="settings-attention"
                  aria-label="Needs attention"
                >
                  <header>
                    <h2>Needs attention</h2>
                    <RegisterChip tone="attention">
                      {data.attention.length}
                    </RegisterChip>
                    <span>
                      Read{" "}
                      <Stamp
                        value={data.read_at}
                        timezone="Australia/Brisbane"
                      />
                    </span>
                  </header>
                  {data.attention.length ? (
                    data.attention.map((a) => (
                      <div className="settings-attention-row" key={a.id}>
                        <div>
                          <strong>{a.title}</strong>
                          <p>{a.detail}</p>
                        </div>
                        <Link href={a.href}>Open record →</Link>
                      </div>
                    ))
                  ) : (
                    <p className="settings-empty">
                      No attention items are available for your current access.
                    </p>
                  )}
                </section>
                {data.policy_summary && (
                  <section
                    className="settings-phone-policies"
                    aria-label="Business policies"
                  >
                    <h2>Business policies</h2>
                    <div className="settings-phone-links">
                      <Link href="/admin/policies">
                        All policies <span>{data.policy_summary.count} →</span>
                      </Link>
                      <Link href="/admin/policies/record-references">
                        Record references <span>→</span>
                      </Link>
                    </div>
                  </section>
                )}
                <h2>Configuration areas</h2>
                <div className="settings-area-grid">
                  {data.areas.map((a) => (
                    <Link
                      className="settings-area-card"
                      data-area={a.id}
                      key={a.id}
                      href={a.href!}
                    >
                      <h3>{a.name}</h3>
                      <small>{a.scope}</small>
                      <p>{a.description}</p>
                      <footer>
                        <RegisterChip tone="neutral">{a.status}</RegisterChip>
                        {a.id === "policies" && data.policy_summary && (
                          <span>{data.policy_summary.count} policies</span>
                        )}
                      </footer>
                    </Link>
                  ))}
                </div>
                <p className="settings-note">
                  Your own preferences are available from your initials in the
                  top bar. Settings changes apply across the workspace. Every
                  policy value here is synthetic, not an operating rule.
                </p>
              </>
            )}
            <Button onClick={source.reload}>Refresh settings</Button>
          </>
        )}
      </div>
    </SettingsFrame>
  );
}
export function BusinessPoliciesRegister({
  waitingOnly = false,
}: {
  waitingOnly?: boolean;
}) {
  const source =
    usePlatformResource<Awaited<ReturnType<typeof readBusinessPolicies>>>(
      "admin/policies",
    );
  const [search, setSearch] = useState(""),
    [ascending, setAscending] = useState(true);
  const data = !source.loading && !source.error ? source.data : undefined;
  const rows =
    data?.items
      .filter((r) => !waitingOnly || r.state === "Waiting to publish")
      .filter((r) =>
        `${r.name} ${r.area} ${r.scope} ${r.state}`
          .toLocaleLowerCase("en-AU")
          .includes(search.toLocaleLowerCase("en-AU")),
      )
      .sort((a, b) => a.name.localeCompare(b.name) * (ascending ? 1 : -1)) ??
    [];
  return (
    <SettingsFrame
      phoneHeader={{
        title: waitingOnly ? "Waiting to publish" : "All policies",
        count: data ? rows.length : undefined,
      }}
    >
      <div className="settings-register">
        <header className="settings-toolbar">
          <h1>{waitingOnly ? "Waiting to publish" : "Business policies"}</h1>
          <input
            aria-label="Find a policy"
            placeholder="Find a policy"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button onClick={source.reload}>Refresh</Button>
        </header>
        <ReadState {...source} retry={source.reload} />
        {data && (
          <>
            <RegisterTable
              caption="Business policies. Open a policy to read its terms and any saved proposal."
              empty={
                !rows.length && (
                  <RegisterEmpty
                    title={
                      waitingOnly && !search
                        ? "No policies waiting to publish"
                        : "No policies match"
                    }
                  >
                    {search && (
                      <Button onClick={() => setSearch("")}>
                        Clear search
                      </Button>
                    )}
                    {waitingOnly && (
                      <Link href="/admin/policies">Show all policies</Link>
                    )}
                  </RegisterEmpty>
                )
              }
              footer={
                <RegisterFooter>
                  {rows.length} policies · Read{" "}
                  <Stamp value={data.read_at} timezone="Australia/Brisbane" />
                </RegisterFooter>
              }
            >
              <thead>
                <tr>
                  <RegisterSortHeader
                    label="Policy"
                    direction={ascending ? "ascending" : "descending"}
                    onSort={() => setAscending(!ascending)}
                  />
                  <th scope="col">Area</th>
                  <th scope="col">In force</th>
                  <th scope="col">Scope</th>
                  <th scope="col">Proposal state</th>
                  <th scope="col">Next version</th>
                  <th scope="col">Since</th>
                  <th scope="col">How it changes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="ppo-register-wrap">
                      <Link href={`/admin/policies/${r.id}`}>{r.name}</Link>
                    </td>
                    <td>{r.area}</td>
                    <td>
                      {r.version
                        ? `Version ${r.version}`
                        : r.id === "record-references"
                          ? "Owner decision"
                          : "Not in force"}
                    </td>
                    <td>{r.scope}</td>
                    <td>
                      <RegisterChip
                        tone={r.proposal_id ? "attention" : "neutral"}
                      >
                        {r.state}
                      </RegisterChip>
                    </td>
                    <td>{r.next_version ?? "—"}</td>
                    <td>
                      {r.since && (
                        <Stamp value={r.since} timezone="Australia/Brisbane" />
                      )}
                    </td>
                    <td>{r.changes}</td>
                  </tr>
                ))}
              </tbody>
            </RegisterTable>
            <p className="settings-note">
              Only Scheduling changes through a saved proposal, independent
              review and separate publisher today. Field readiness and working
              hours are seed only, with no editor. Record references follow the
              adopted owner decision. All policy values are synthetic.
            </p>
          </>
        )}
      </div>
    </SettingsFrame>
  );
}
