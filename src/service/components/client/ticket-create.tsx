"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useIdentity } from "../../../components/business-session";
import {
  EnumField,
  ErrorNotice,
  Field,
  ReadState,
  SelectField,
  ValidationFields,
  useCommand,
  useResource,
  type Envelope,
  type Option,
} from "../../../components/business-ui";
import { LocalDateTimeField, useCreateDraft } from "../../../components/record-ui";
import { DeliveryCreation, type SalesCreation } from "../../../components/sales-delivery-creation";
import { Button, ButtonLink } from "../../../components/ui/button";
import { stageLabel } from "../../ticket-register-view";
import type { RegisterItem } from "../../ticket-register-view";
import { ServiceDialog, TicketRecord } from "./ticket-record";
export function TicketCreatePage({ siteId }: { siteId?: string }) {
  return (
    <div className="sv-create-host" data-module-layout="full-bleed">
    <DeliveryCreation kind="Service" intake>
      {(sales) => <CreateContext siteId={siteId ?? sales?.source.site_id ?? undefined} sales={sales} />}
    </DeliveryCreation>
    </div>
  );
}
function CreateContext({ siteId, sales }: { siteId?: string; sales?: SalesCreation }) {
  const site = useResource<Envelope<Option & { company_id: string }>>(siteId ? `sites/${siteId}` : null);
  return (
    <section id="ppo-service-create" data-module-layout="full-bleed">
      <ReadState loading={site.loading} error={site.error} retry={site.reload} />
      {(!siteId || (!site.loading && !site.error && site.data)) && (
        <CreateForm
          initialSite={siteId}
          initialSiteOption={site.data?.items[0]}
          initialCompany={site.data?.items[0].company_id ?? sales?.source.company_id}
          sales={sales}
        />
      )}
    </section>
  );
}
function CreateForm({
  initialSite,
  initialSiteOption,
  initialCompany,
  sales,
}: {
  initialSite?: string;
  initialSiteOption?: Option;
  initialCompany?: string;
  sales?: SalesCreation;
}) {
  const p = useIdentity(),
    router = useRouter(),
    cmd = useCommand(),
    [id] = useState(() => crypto.randomUUID()),
    [preview, setPreview] = useState<{
      id: string;
      statement?: boolean;
    } | null>(null),
    [feedback, setFeedback] = useState("");
  const [v, setV] = useState({
    company: initialCompany ?? "",
    site: initialSite ?? "",
    requester: "",
    requester_description: "",
    asset: "",
    received: new Date().toISOString(),
    channel: "Phone",
    summary: "",
    symptom: "",
    impact: "",
    priority: "Normal",
    priority_reason: "",
    owner: p.actor_id,
    next_action: "",
    reason: "",
  });
  const set = (k: keyof typeof v, value: string) => setV((old) => ({ ...old, [k]: value }));
  const saved = useCreateDraft(v, cmd.busy, !sales?.blocked);
  const companies = useResource<Envelope<Option>>("selectors/companies"),
    sites = useResource<Envelope<Option>>(v.company ? `sites?company_id=${v.company}&limit=200` : null),
    people = useResource<Envelope<Option>>("people?limit=200"),
    assets = useResource<Envelope<Option>>(v.site ? `assets?site_id=${v.site}&limit=200` : null),
    owners = useResource<Envelope<Option>>(
      v.company
        ? `selectors/owners?${new URLSearchParams({ company_id: v.company, ...(v.site ? { site_id: v.site } : {}), purpose: "Ticket" })}`
        : null,
    );
  const siteContext = useResource<
    Envelope<{
      parties: {
        organisation_id: string;
        display_name: string;
        role: string;
        is_current: boolean;
      }[];
    }>
  >(v.site ? `sites/${v.site}` : null);
  const customers = [
    ...new Map(
      (siteContext.data?.items[0].parties ?? [])
        .filter((p) => p.role === "Operator" && p.is_current)
        .map((p) => [p.organisation_id, p]),
    ).values(),
  ];
  // The handover already read this permitted Site. Keep its name visible while
  // the broader selector loads, rather than displaying "Not identified".
  const siteOptions = sites.data?.items ?? [];
  const visibleSites =
    initialSiteOption && v.site === initialSiteOption.id && !siteOptions.some((site) => site.id === v.site)
      ? [initialSiteOption, ...siteOptions]
      : siteOptions;
  const duplicates = useResource<Envelope<RegisterItem>>(
    v.site ? `service/tickets?site_id=${v.site}&queue=all_open&limit=20&sort=urgency` : null,
  );
  const matches = (duplicates.loading || duplicates.error ? [] : (duplicates.data?.items ?? [])).filter(
    (i) => !v.asset || i.asset?.id === v.asset,
  );
  const field = (
    key: keyof typeof v,
    title: string,
    required = false,
    multiline = false,
    maxLength = 2000,
    hint?: string,
  ) => (
    <Field
      name={key}
      validationField={({ requester: "requester_id", owner: "triage_owner_id" } as Record<string, string>)[key] ?? key}
      label={title}
      value={v[key]}
      onChange={(value) => set(key, value)}
      required={required}
      multiline={multiline}
      maxLength={maxLength}
      hint={hint}
    />
  );
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const fields = {
      id,
      company_id: v.company,
      received_at: v.received,
      channel: v.channel,
      requester_id: v.requester || null,
      requester_description: v.requester_description || null,
      site_id: v.site || null,
      site_identification_needed: !v.site,
      asset_id: v.asset || null,
      summary: v.summary,
      symptom: v.symptom,
      impact: v.impact || null,
      priority: v.priority,
      priority_reason: v.priority_reason || null,
      triage_owner_id: v.owner,
      next_action: v.next_action,
      reason: v.reason,
    };
    const result = sales ? await sales.send(fields) : await cmd.send<{ record_id: string }>("service/tickets", fields);
    if (result) {
      saved();
      if (!sales) router.push(`/service/tickets/${result.record_id}`);
    }
  }
  const busy = cmd.busy || sales?.blocked;
  return (
    <div className="sv-create-columns">
      <form className="sv-create-form" onSubmit={submit}>
        <div className="sv-form-scroll">
          <h1>Log a request</h1>
          <ValidationFields error={sales?.error ?? cmd.error}>
            <ErrorNotice error={sales?.error ?? cmd.error} />
            <fieldset disabled={busy}>
              <section className="sv-form-section">
                <h2>Caller and customer</h2>
                <details className="sv-company-context" open={!v.company || undefined}>
                  <summary>
                    Company context
                    {v.company
                      ? `: ${companies.data?.items.find((c) => c.id === v.company)?.display_name ?? "Selected"}`
                      : " — choose to start"}
                  </summary>{" "}
                  <SelectField
                    name="company_id"
                    label="Company visibility context"
                    value={v.company}
                    options={companies.data?.items ?? []}
                    required
                    onChange={(value) =>
                      setV((old) => ({
                        ...old,
                        company: value,
                        site: "",
                        asset: "",
                      }))
                    }
                  />
                </details>{" "}
                <div className="sv-two-fields">
                  <div className="field">
                    <span className="sv-field-label">Customer</span>
                    <p>
                      {siteContext.loading
                        ? "Loading customer context…"
                        : siteContext.error
                          ? "Customer context unavailable"
                          : customers.length === 1
                            ? customers[0].display_name
                            : "Not identified — derived from site or requester"}
                    </p>
                    <small>Company visibility is separate from the customer.</small>
                  </div>
                  <SelectField
                    name="site_id"
                    label="Site"
                    value={v.site}
                    options={visibleSites}
                    empty="Not identified — clarify later"
                    onChange={(value) => setV((old) => ({ ...old, site: value, asset: "" }))}
                  />
                </div>
                <div className="sv-two-fields">
                  <SelectField
                    name="requester_id"
                    label="Caller"
                    value={v.requester}
                    options={people.data?.items ?? []}
                    empty="Not identified — describe below"
                    onChange={(value) => set("requester", value)}
                  />
                  <EnumField
                    name="channel"
                    label="Channel"
                    value={v.channel}
                    values={["Phone", "Email", "Manual", "PlannedMaintenance", "Other"]}
                    onChange={(value) => set("channel", value)}
                  />
                </div>
                {!v.requester && field("requester_description", "Caller description / what needs clarifying", true)}
                <LocalDateTimeField
                  name="received_at"
                  label="Received"
                  value={v.received}
                  onChange={(value) => set("received", value)}
                />
              </section>
              <section className="sv-form-section">
                <h2>Issue</h2>
                {field("summary", "Summary", true, false, 200)}
                {field(
                  "symptom",
                  "What the customer reported",
                  true,
                  true,
                  10000,
                  "Use the caller’s words. Record uncertainty explicitly.",
                )}
              </section>
              <section className="sv-form-section">
                <h2>Location and impact</h2>
                <div className="sv-two-fields">
                  {v.site && (
                    <SelectField
                      name="asset_id"
                      label="Equipment"
                      value={v.asset}
                      options={assets.data?.items ?? []}
                      empty="Not recorded"
                      onChange={(value) => set("asset", value)}
                    />
                  )}

                  <EnumField
                    name="priority"
                    label="Reported priority"
                    value={v.priority}
                    values={["Low", "Normal", "High", "Urgent"]}
                    onChange={(value) => set("priority", value)}
                  />
                </div>

                {field("impact", "Impact and backup", false, true)}
                {field("priority_reason", "Priority reason", false, true, 2000, "Urgent priority bypasses no control.")}
              </section>
              <section className="sv-form-section">
                <h2>Ownership and next action</h2>{" "}
                <SelectField
                  name="triage_owner_id"
                  label="Request owner"
                  value={v.owner}
                  options={owners.data?.items ?? []}
                  required
                  onChange={(value) => set("owner", value)}
                />
                {field("next_action", "Next action", true, true)}
                {field("reason", "Reason for logging", true, false, 1000)}
              </section>
            </fieldset>
          </ValidationFields>
          {[companies, sites, people, assets, owners, siteContext].map((r, i) => (
            <ReadState key={i} loading={r.loading} error={r.error} retry={r.reload} />
          ))}
        </div>
        <footer className="sv-savebar">
          <small>The request starts at New. Logging it authorises no work and books no visit.</small>
          <ButtonLink href="/service/tickets">Cancel</ButtonLink>
          <Button
            type="submit"
            variant="primary"
            busy={busy}
            disabled={companies.loading || owners.loading || !!companies.error || !!owners.error}
          >
            Create request
          </Button>
        </footer>
      </form>
      <aside className="sv-duplicate">
        <h2>Check before creating</h2>
        <p>Review open requests at this site before logging another.</p>
        {feedback && <p role="status">{feedback}</p>}
        {!v.site ? (
          <p>Select a site to check.</p>
        ) : (
          <>
            <ReadState loading={duplicates.loading} error={duplicates.error} retry={duplicates.reload} />
            {matches.length > 0 ? (
              <>
                <div className="sv-duplicate-warning">
                  <strong>
                    {matches.length} open {matches.length === 1 ? "request may" : "requests may"} be the same issue
                  </strong>
                  <p>Same site{v.asset ? " and equipment" : ""}. Check whether this is the same issue.</p>
                </div>
                {matches.map((item) => (
                  <article key={item.id}>
                    <small>{item.display_number}</small>
                    <h3>{item.summary}</h3>
                    <span className="sv-tag">{stageLabel(item.status)}</span>
                    <p>
                      {item.customer?.display_name ?? "Customer not identified"} · {item.site?.display_name}
                    </p>
                    <div className="sv-duplicate-actions">
                      <Button onClick={() => setPreview({ id: item.id, statement: true })}>
                        Add as customer statement
                      </Button>
                      <Button variant="quiet" onClick={() => setPreview({ id: item.id })}>
                        Open request
                      </Button>
                    </div>
                    <p className="sv-note">
                      If this is the same issue, record the customer’s statement on that request.
                    </p>
                  </article>
                ))}
              </>
            ) : (
              !duplicates.loading &&
              !duplicates.error && (
                <p>No matching open requests in the loaded results. This does not prove the issue is new.</p>
              )
            )}
            {duplicates.data?.next_cursor && (
              <p>Only the first 20 open requests are checked. Search the register for more.</p>
            )}
          </>
        )}
        {v.asset && !duplicates.loading && !duplicates.error && (
          <section className="sv-earlier-equipment">
            <h3>Earlier on this equipment</h3>
            {matches
              .filter((item) => item.status === "Triaged")
              .map((item) => (
                <article key={item.id}>
                  <Link href={`/service/tickets/${item.id}`}>
                    {item.display_number} · {item.summary}
                  </Link>
                  <small>
                    Triaged · received{" "}
                    {new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeZone: "Australia/Brisbane" }).format(
                      new Date(item.received_at),
                    )}
                    {item.work_orders[0]
                      ? ` · work order ${item.work_orders[0].display_number}`
                      : " · no visible work order linked"}
                  </small>
                </article>
              ))}
            {!matches.some((item) => item.status === "Triaged") && (
              <p>No earlier triaged request in the loaded results.</p>
            )}
          </section>
        )}
        <Link href="/service/tickets">Search all requests</Link>
      </aside>
      {preview && (
        <ServiceDialog
          title={preview.statement ? "Record customer statement" : "Request snapshot"}
          onClose={() => setPreview(null)}
        >
          <TicketRecord
            key={preview.id + String(preview.statement)}
            id={preview.id}
            snapshot
            statementDraft={
              preview.statement
                ? {
                    body: v.symptom,
                    source_label:
                      people.data?.items.find((o) => o.id === v.requester)?.display_name ?? v.requester_description,
                    occurred_at: v.received,
                    channel: v.channel,
                    reason: v.reason,
                  }
                : undefined
            }
            onStatementCancelled={() => setPreview(null)}
            onStatementSaved={() => {
              setFeedback(
                "Customer statement recorded. Your new-request entries are kept; no new request was created.",
              );
              setPreview(null);
              duplicates.reload();
            }}
          />
        </ServiceDialog>
      )}
    </div>
  );
}
