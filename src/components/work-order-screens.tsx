"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useIdentity } from "./business-session";
import {
  EnumField,
  ErrorNotice,
  ValidationFields,
  Field,
  Observed,
  PageHeader,
  ReadState,
  SelectField,
  Stamp,
  Status,
  SummaryPair,
  useCommand,
  useResource,
  type Envelope,
  type Option,
} from "./business-ui";
import {
  coverageStates,
  readinessStates,
  taskKinds,
  type ScopeInput,
} from "../service/work-scope-validation";
// Runtime validators have no database import; server record/date projections are explicit here.
type Evidence = {
  title: string;
  content_text: string;
  source_reference: string;
  source_version: string;
  id?: string;
  content_hash?: string;
};
type Asset = Option & {
  asset_id: string;
  identity_status: string;
  serial?: string;
  model?: string;
  configuration_id: string | null;
  configuration_status: string | null;
  method: string | null;
  limits: string | null;
};
type Item = {
  id: string;
  sequence: number;
  task_kind: "Inspection" | "Identification" | "Intervention";
  task_description: string;
  expected_outcome: string;
  completion_requirements: string[];
  required_skill_codes: string[];
  shutdown_condition: string | null;
  access_condition: string | null;
  assets: Asset[];
};
type Assessment = {
  criterion_code: string;
  label: string;
  blocking_stage: string;
  exception_allowed: boolean;
  not_applicable_allowed: boolean;
  outcome: string;
  recorded_outcome: string;
  stale: boolean;
  expired: boolean;
  reason: string | null;
  assessed_at: string | null;
  assessed_by: string | null;
  source_as_at: string | null;
  valid_until: string | null;
  evidence_title: string | null;
  evidence_text: string | null;
};
type Scope = {
  id: string;
  version: number;
  revision: number;
  summary: string | null;
  exclusions: string | null;
  diagnostic_limit: string | null;
  pending_account_plan: string | null;
  change_reason: string | null;
  predecessor_id: string | null;
  approved_at: string | null;
  approved_by: string | null;
  content_hash: string | null;
  policy_version_id: string;
  coverage: ScopeInput["coverage"];
  authority: Evidence | null;
  items: Item[];
  readiness: Assessment[];
};
type Visit = {
  id: string;
  display_number: string;
  status: string;
  start_at: string;
  end_at: string;
  site_timezone: string;
  customer_commitment: string;
  preparation_status: string;
  scope_revision_id: string;
  scope_version: number;
  scope_review_required: boolean;
  readiness: Assessment[];
};
type Order = {
  id: string;
  company_id: string;
  site_id: string;
  customer_id: string;
  version: number;
  display_number: string;
  status: string;
  site_name: string;
  site_timezone: string;
  customer_name: string;
  owner_name: string;
  scope_revision_id: string | null;
  authorised_scope_revision_id: string | null;
  scopes: Scope[];
  visits: Visit[];
  tickets: {
    id: string;
    display_number: string;
    summary: string;
    status: string;
    priority: string;
    issue_disposition: string;
  }[];
  blockers: { field: string; message: string; stage: string }[];
  actions: { can_edit: boolean; can_authorise: boolean; can_assess: boolean };
};
type Row = {
  id: string;
  display_number: string;
  status: string;
  site_name: string;
  customer_name: string;
  summary: string | null;
  revision: number | null;
  coverage_status: string | null;
};
const emptyEvidence = (): Evidence => ({
  title: "",
  content_text: "",
  source_reference: "",
  source_version: "",
});
const emptyItem = (): ScopeInput["items"][number] => ({
  sequence: 1,
  task_kind: "Inspection",
  task_description: "",
  expected_outcome: "",
  completion_requirements: [""],
  required_skill_codes: [],
  shutdown_condition: null,
  access_condition: null,
  assets: [],
});
function draftScope(r: Scope | null): ScopeInput {
  return {
    summary: r?.summary ?? null,
    exclusions: r?.exclusions ?? null,
    diagnostic_limit: r?.diagnostic_limit ?? null,
    pending_account_plan: r?.pending_account_plan ?? null,
    authority_evidence: r?.authority
      ? {
          title: r.authority.title,
          content_text: r.authority.content_text,
          source_reference: r.authority.source_reference,
          source_version: r.authority.source_version,
        }
      : null,
    coverage: r?.coverage
      ? {
          status: r.coverage.status,
          agreement_reference: r.coverage.agreement_reference,
          source_version: r.coverage.source_version,
          effective_from: r.coverage.effective_from,
          effective_to: r.coverage.effective_to,
          assessment: r.coverage.assessment,
          reason: r.coverage.reason,
          charging_route: r.coverage.charging_route,
        }
      : null,
    items:
      r?.items.map((i) => ({
        sequence: i.sequence,
        task_kind: i.task_kind,
        task_description: i.task_description,
        expected_outcome: i.expected_outcome,
        completion_requirements: i.completion_requirements,
        required_skill_codes: i.required_skill_codes,
        shutdown_condition: i.shutdown_condition,
        access_condition: i.access_condition,
        assets: i.assets.map((a) => ({
          asset_id: a.asset_id,
          configuration_id: a.configuration_id,
          identification_plan: a.method
            ? { method: a.method, limits: a.limits ?? "" }
            : null,
        })),
      })) ?? [],
  };
}
export function WorkOrderList() {
  const [q, setQ] = useState(""),
    [status, setStatus] = useState(""),
    [cursor, setCursor] = useState("");
  const r = useResource<Envelope<Row>>(
    `service/work-orders?${new URLSearchParams({ q, ...(status ? { status } : {}), ...(cursor ? { cursor } : {}) })}`,
  );
  return (
    <>
      <PageHeader
        eyebrow="Service / Work preparation"
        title="Work orders"
        description="Review the exact scope, authority and controls before work moves to planning."
        action={
          <Link className="button" href="/service/work-orders/new">
            New work order
          </Link>
        }
      />
      <div className="filter-bar">
        <Field
          name="work-order-search"
          label="Search work orders"
          value={q}
          onChange={(v) => {
            setQ(v);
            setCursor("");
          }}
        />
        <EnumField
          name="work-order-status"
          label="Work order state"
          value={status}
          values={["Draft", "Authorised"]}
          onChange={(v) => {
            setStatus(v);
            setCursor("");
          }}
        />
      </div>
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      {r.data && (
        <>
          <Observed envelope={r.data} />
          <div className="record-grid">
            {r.data.items.map((w) => (
              <article className="record-card" key={w.id}>
                <p className="eyebrow">{w.display_number}</p>
                <h2>
                  <Link href={`/service/work-orders/${w.id}`}>
                    {w.summary ?? "Scope needed"}
                  </Link>
                </h2>
                <p>
                  {w.customer_name} · {w.site_name}
                </p>
                <Status value={w.status} />{" "}
                <Status value={w.coverage_status ?? "Unknown"} />
                <p>
                  {w.revision
                    ? `Current scope r${String(w.revision).padStart(2, "0")}`
                    : "No scope saved"}
                </p>
              </article>
            ))}
          </div>
          {!r.data.items.length && (
            <div className="empty-state">
              <h2>No work orders in this view</h2>
              <p>
                Adjust the filters or create a draft from a service request.
              </p>
            </div>
          )}
          {r.data.next_cursor && (
            <button onClick={() => setCursor(r.data!.next_cursor!)}>
              Next page
            </button>
          )}
        </>
      )}
    </>
  );
}
export function NewWorkOrder() {
  const params = useSearchParams(),
    router = useRouter(),
    identity = useIdentity();
  const [company, setCompany] = useState(params.get("company_id") ?? ""),
    [site, setSite] = useState(params.get("site_id") ?? ""),
    [customer, setCustomer] = useState(""),
    [owner, setOwner] = useState(identity?.actor_id ?? ""),
    [tickets, setTickets] = useState<string[]>(
      params.get("ticket_id") ? [params.get("ticket_id")!] : [],
    ),
    [selected, setSelected] = useState(""),
    [disposition, setDisposition] = useState(""),
    [id] = useState(() => crypto.randomUUID());
  const cmd = useCommand();
  const companies = useResource<Envelope<Option>>(
      "selectors/companies?limit=200",
    ),
    sites = useResource<Envelope<Option>>(
      company ? `sites?company_id=${company}&limit=200` : null,
    ),
    customers = useResource<Envelope<Option>>(site ? `sites/${site}` : null),
    owners = useResource<Envelope<Option>>(
      company && site
        ? `selectors/owners?company_id=${company}&site_id=${site}&purpose=WorkOrder&limit=200`
        : null,
    ),
    requests = useResource<Envelope<Option & { summary: string }>>(
      site ? `service/tickets?site_id=${site}&limit=200` : null,
    );
  // Site parties are a separate exact projection from the existing site route.
  const detail = customers.data?.items[0] as
    | (Option & {
        parties?: {
          organisation_id: string;
          display_name: string;
          is_current: boolean;
        }[];
      })
    | null;
  return (
    <>
      <PageHeader
        eyebrow="Service / Work preparation"
        title="New work order"
        description="A draft retains the service request history and starts a separate scope decision."
      />
      <ValidationFields error={cmd.error}>
        <form
          className="panel"
          onSubmit={async (e) => {
            e.preventDefault();
            const result = await cmd.send<{ record_id: string }>(
              "service/work-orders",
              {
                id,
                company_id: company,
                site_id: site,
                customer_id: customer,
                service_owner_id: owner,
                tickets: tickets.map((ticket_id) => ({
                  ticket_id,
                  issue_disposition: disposition,
                })),
                reason: "Create a synthetic work-order draft",
              },
            );
            if (result) router.push(`/service/work-orders/${result.record_id}`);
          }}
        >
          <ErrorNotice error={cmd.error} />
          <div className="form-grid">
            <SelectField
              name="wo-company"
              label="Company context"
              value={company}
              onChange={(v) => {
                setCompany(v);
                setSite("");
                setCustomer("");
                setTickets([]);
              }}
              options={companies.data?.items ?? []}
              required
            />
            <SelectField
              name="wo-site"
              label="Service site"
              value={site}
              onChange={(v) => {
                setSite(v);
                setCustomer("");
                setTickets([]);
              }}
              options={sites.data?.items ?? []}
              required
            />
            <SelectField
              name="wo-customer"
              label="Customer at this site"
              value={customer}
              onChange={setCustomer}
              options={(detail?.parties ?? [])
                .filter((p) => p.is_current)
                .map((p) => ({
                  id: p.organisation_id,
                  display_name: p.display_name,
                }))
                .filter((p, i, a) => a.findIndex((x) => x.id === p.id) === i)}
              required
            />
            <SelectField
              name="wo-owner"
              label="Service owner"
              value={owner}
              onChange={setOwner}
              options={owners.data?.items ?? []}
              required
            />
          </div>
          <SelectField
            name="wo-ticket"
            label="Service request to link"
            value={selected}
            onChange={setSelected}
            options={(requests.data?.items ?? []).map((t) => ({
              ...t,
              display_name: t.summary,
            }))}
          />
          <button
            type="button"
            className="secondary"
            disabled={!selected || tickets.includes(selected)}
            onClick={() => {
              setTickets([...tickets, selected]);
              setSelected("");
            }}
          >
            Link service request
          </button>
          <ul>
            {tickets.map((t) => (
              <li key={t}>
                {requests.data?.items.find((r) => r.id === t)?.display_number ??
                  t}{" "}
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setTickets(tickets.filter((x) => x !== t))}
                >
                  Remove link
                </button>
              </li>
            ))}
          </ul>
          <Field
            name="issue_disposition"
            label="Purpose of these linked requests"
            value={disposition}
            onChange={setDisposition}
            multiline
            maxLength={2000}
            required
          />
          {[companies, sites, customers, owners, requests].map((r, i) => (
            <ReadState
              key={i}
              loading={r.loading}
              error={r.error}
              retry={r.reload}
            />
          ))}
          <button disabled={cmd.busy}>Save draft work order</button>
        </form>
      </ValidationFields>
    </>
  );
}
function EvidenceFields({
  value,
  onChange,
  prefix,
}: {
  value: Evidence;
  onChange: (v: Evidence) => void;
  prefix: string;
}) {
  return (
    <div className="form-grid">
      <Field
        name={`${prefix}-title`}
        validationField="title"
        label="Evidence title"
        value={value.title}
        onChange={(v) => onChange({ ...value, title: v })}
      />
      <Field
        name={`${prefix}-ref`}
        validationField="source_reference"
        label="Synthetic source reference"
        value={value.source_reference}
        onChange={(v) => onChange({ ...value, source_reference: v })}
      />
      <Field
        name={`${prefix}-version`}
        validationField="source_version"
        label="Source version"
        value={value.source_version}
        onChange={(v) => onChange({ ...value, source_version: v })}
      />
      <Field
        name={`${prefix}-text`}
        validationField="content_text"
        label="Exact manual evidence"
        value={value.content_text}
        onChange={(v) => onChange({ ...value, content_text: v })}
        multiline
        maxLength={10000}
      />
    </div>
  );
}
function ConflictReview({
  version,
  latest,
  onAdopt,
}: {
  version: number;
  latest: number;
  onAdopt: () => void;
}) {
  return version !== latest ? (
    <aside className="callout">
      <h3>A newer saved version is available</h3>
      <p>
        Your proposal still uses version {version}. Compare it with saved
        version {latest} before continuing.
      </p>
      <button type="button" className="secondary" onClick={onAdopt}>
        Use latest version with my proposal
      </button>
    </aside>
  ) : null;
}
function ScopeForm({
  w,
  r,
  successor,
  onSaved,
}: {
  w: Order;
  r: Scope | null;
  successor: boolean;
  onSaved: () => void;
}) {
  const [value, setValue] = useState<ScopeInput>(() => draftScope(r)),
    [reason, setReason] = useState(""),
    [expected, setExpected] = useState(w.version),
    [assetChoice, setAssetChoice] = useState<Record<number, string>>({});
  const cmd = useCommand();
  const assets = useResource<Envelope<Option & { identity_status: string }>>(
    `assets?site_id=${w.site_id}&limit=200`,
  );
  const change = (i: number, fields: Partial<ScopeInput["items"][number]>) =>
    setValue({
      ...value,
      items: value.items.map((x, j) => (j === i ? { ...x, ...fields } : x)),
    });
  return (
    <ValidationFields error={cmd.error}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const result = await cmd.send(
            `service/work-orders/${w.id}/${successor ? "successor" : "save-scope"}`,
            {
              expected_version: expected,
              scope: {
                ...value,
                items: value.items.map((item) => ({
                  task_kind: item.task_kind,
                  task_description: item.task_description,
                  expected_outcome: item.expected_outcome,
                  completion_requirements: item.completion_requirements,
                  required_skill_codes: item.required_skill_codes,
                  shutdown_condition: item.shutdown_condition,
                  access_condition: item.access_condition,
                  assets: item.assets,
                })),
              },
              ...(successor ? { change_reason: reason } : {}),
              reason: successor
                ? reason
                : "Save synthetic scope draft for review",
            },
          );
          if (result) {
            onSaved();
            setExpected((result as { record_version: number }).record_version);
          }
        }}
      >
        <ErrorNotice error={cmd.error} />
        <ConflictReview
          version={expected}
          latest={w.version}
          onAdopt={() => {
            cmd.clear();
            setExpected(w.version);
          }}
        />
        {successor && (
          <Field
            name="change_reason"
            label="Reason for successor scope"
            value={reason}
            onChange={setReason}
            multiline
            maxLength={2000}
            required
          />
        )}
        <Field
          name="summary"
          label="Scope summary"
          value={value.summary ?? ""}
          onChange={(v) => setValue({ ...value, summary: v || null })}
          multiline
          maxLength={4000}
        />
        <Field
          name="exclusions"
          label="Explicit exclusions"
          value={value.exclusions ?? ""}
          onChange={(v) => setValue({ ...value, exclusions: v || null })}
          multiline
          maxLength={4000}
          hint="Record excluded work and control limits. Enter None only when reviewed."
        />
        <Field
          name="diagnostic_limit"
          label="Limited diagnostic authority"
          value={value.diagnostic_limit ?? ""}
          onChange={(v) => setValue({ ...value, diagnostic_limit: v || null })}
          multiline
          maxLength={4000}
          hint="Required for unknown/disputed coverage and unresolved identification. This never authorises intervention."
        />
        <Field
          name="pending_account_plan"
          label="Account clarification and Finance review plan"
          value={value.pending_account_plan ?? ""}
          onChange={(v) =>
            setValue({ ...value, pending_account_plan: v || null })
          }
          multiline
          maxLength={2000}
        />
        <h3>Tasks and affected equipment</h3>
        {value.items.map((i, index) => (
          <fieldset className="wo-task" key={index}>
            <legend>Task {index + 1}</legend>
            <EnumField
              name={`task-kind-${index}`}
              label="Task type"
              value={i.task_kind}
              values={taskKinds}
              onChange={(v) =>
                change(index, { task_kind: v as Item["task_kind"] })
              }
            />
            <Field
              name={`task-${index}`}
              validationField="task_description"
              label="Task description"
              value={i.task_description}
              onChange={(v) => change(index, { task_description: v })}
              multiline
              maxLength={4000}
            />
            <Field
              name={`outcome-${index}`}
              validationField="expected_outcome"
              label="Expected outcome"
              value={i.expected_outcome}
              onChange={(v) => change(index, { expected_outcome: v })}
              multiline
              maxLength={4000}
            />
            <Field
              name={`completion-${index}`}
              label="Completion requirements — one per line"
              value={i.completion_requirements.join("\n")}
              onChange={(v) =>
                change(index, { completion_requirements: v.split("\n") })
              }
              multiline
              maxLength={10000}
            />
            <Field
              name={`skills-${index}`}
              label="Required competency codes — one per line"
              value={i.required_skill_codes.join("\n")}
              onChange={(v) =>
                change(index, { required_skill_codes: v ? v.split("\n") : [] })
              }
              multiline
              maxLength={2000}
            />
            <Field
              name={`shutdown-${index}`}
              label="Shutdown and isolation conditions"
              value={i.shutdown_condition ?? ""}
              onChange={(v) => change(index, { shutdown_condition: v || null })}
              multiline
              maxLength={2000}
            />
            <Field
              name={`access-${index}`}
              label="Task access conditions"
              value={i.access_condition ?? ""}
              onChange={(v) => change(index, { access_condition: v || null })}
              multiline
              maxLength={2000}
            />
            <SelectField
              name={`asset-${index}`}
              label="Equipment to include"
              value={assetChoice[index] ?? ""}
              onChange={(v) => setAssetChoice({ ...assetChoice, [index]: v })}
              options={assets.data?.items ?? []}
            />
            <button
              type="button"
              className="secondary"
              disabled={
                !assetChoice[index] ||
                i.assets.some((a) => a.asset_id === assetChoice[index])
              }
              onClick={() =>
                change(index, {
                  assets: [
                    ...i.assets,
                    {
                      asset_id: assetChoice[index],
                      configuration_id: null,
                      identification_plan: null,
                    },
                  ],
                })
              }
            >
              Include equipment in task {index + 1}
            </button>
            {i.assets.map((a, j) => {
              const current = assets.data?.items.find(
                (x) => x.id === a.asset_id,
              );
              return (
                <div className="wo-asset" key={a.asset_id}>
                  <strong>{current?.description ?? a.asset_id}</strong>{" "}
                  <Status value={current?.identity_status ?? "Unknown"} />
                  {a.configuration_id && (
                    <p>
                      Retained configuration reference: {a.configuration_id}. It
                      requires verified evidence before authorisation.
                    </p>
                  )}
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={!!a.identification_plan}
                      onChange={(e) =>
                        change(index, {
                          assets: i.assets.map((x, k) =>
                            j === k
                              ? {
                                  ...x,
                                  identification_plan: e.target.checked
                                    ? { method: "", limits: "" }
                                    : null,
                                }
                              : x,
                          ),
                        })
                      }
                    />{" "}
                    Include a bounded identification plan
                  </label>
                  {a.identification_plan && (
                    <>
                      <Field
                        name={`method-${index}-${j}`}
                        label="Identification method"
                        value={a.identification_plan.method}
                        onChange={(v) =>
                          change(index, {
                            assets: i.assets.map((x, k) =>
                              j === k
                                ? {
                                    ...x,
                                    identification_plan: {
                                      method: v,
                                      limits: a.identification_plan!.limits,
                                    },
                                  }
                                : x,
                            ),
                          })
                        }
                        multiline
                        maxLength={4000}
                      />
                      <Field
                        name={`limits-${index}-${j}`}
                        label="Identification limits"
                        value={a.identification_plan.limits}
                        onChange={(v) =>
                          change(index, {
                            assets: i.assets.map((x, k) =>
                              j === k
                                ? {
                                    ...x,
                                    identification_plan: {
                                      method: a.identification_plan!.method,
                                      limits: v,
                                    },
                                  }
                                : x,
                            ),
                          })
                        }
                        multiline
                        maxLength={4000}
                      />
                    </>
                  )}
                  <button
                    type="button"
                    className="secondary"
                    onClick={() =>
                      change(index, {
                        assets: i.assets.filter((_, k) => k !== j),
                      })
                    }
                  >
                    Remove equipment
                  </button>
                </div>
              );
            })}
            <button
              type="button"
              className="secondary"
              onClick={() =>
                setValue({
                  ...value,
                  items: value.items.filter((_, j) => j !== index),
                })
              }
            >
              Remove task {index + 1}
            </button>
          </fieldset>
        ))}
        <button
          type="button"
          className="secondary"
          onClick={() =>
            setValue({ ...value, items: [...value.items, emptyItem()] })
          }
        >
          Add scope task
        </button>
        <ReadState
          loading={assets.loading}
          error={assets.error}
          retry={assets.reload}
        />
        <h3>Coverage assessment</h3>
        <label className="check-label">
          <input
            type="checkbox"
            checked={!!value.coverage}
            onChange={(e) =>
              setValue({
                ...value,
                coverage: e.target.checked
                  ? {
                      status: "Unknown",
                      assessment: "",
                      reason: "",
                      agreement_reference: null,
                      source_version: null,
                      effective_from: null,
                      effective_to: null,
                      charging_route: "FinanceReview",
                    }
                  : null,
              })
            }
          />{" "}
          Record a coverage assessment
        </label>
        {value.coverage && (
          <>
            <EnumField
              name="coverage-state"
              label="Coverage position"
              values={coverageStates}
              value={value.coverage.status}
              onChange={(v) =>
                setValue({
                  ...value,
                  coverage: {
                    ...value.coverage!,
                    status: v as NonNullable<ScopeInput["coverage"]>["status"],
                  },
                })
              }
            />
            <Field
              name="coverage-assessment"
              label="Assessment"
              value={value.coverage.assessment}
              onChange={(v) =>
                setValue({
                  ...value,
                  coverage: { ...value.coverage!, assessment: v },
                })
              }
              multiline
              maxLength={4000}
            />
            <Field
              name="coverage-reason"
              label="Coverage reason"
              value={value.coverage.reason}
              onChange={(v) =>
                setValue({
                  ...value,
                  coverage: { ...value.coverage!, reason: v },
                })
              }
              multiline
              maxLength={2000}
            />
            {(
              [
                "agreement_reference",
                "source_version",
                "effective_from",
                "effective_to",
              ] as const
            ).map((k) => (
              <Field
                key={k}
                name={`coverage-${k}`}
                label={
                  {
                    agreement_reference: "Agreement reference",
                    source_version: "Agreement version",
                    effective_from: "Effective from",
                    effective_to: "Effective to",
                  }[k]
                }
                type={k.startsWith("effective") ? "date" : "text"}
                value={value.coverage![k] ?? ""}
                onChange={(v) =>
                  setValue({
                    ...value,
                    coverage: { ...value.coverage!, [k]: v || null },
                  })
                }
              />
            ))}
            <EnumField
              name="charging_route"
              label="Charging decision route"
              value={value.coverage.charging_route}
              values={["FinanceReview", "ContractReference"]}
              onChange={(v) =>
                setValue({
                  ...value,
                  coverage: {
                    ...value.coverage!,
                    charging_route: v as "FinanceReview" | "ContractReference",
                  },
                })
              }
            />
          </>
        )}
        <p className="callout">
          Coverage does not decide billability, customer charging, warranty
          liability or supplier recovery. Finance review remains separate.
        </p>
        <h3>Authority evidence</h3>
        <label className="check-label">
          <input
            type="checkbox"
            checked={!!value.authority_evidence}
            onChange={(e) =>
              setValue({
                ...value,
                authority_evidence: e.target.checked ? emptyEvidence() : null,
              })
            }
          />{" "}
          Record synthetic manual authority evidence
        </label>
        {value.authority_evidence && (
          <EvidenceFields
            prefix="scope-authority"
            value={value.authority_evidence}
            onChange={(v) => setValue({ ...value, authority_evidence: v })}
          />
        )}
        <p className="read-meta">
          Saving changed scope requires fresh readiness review. Previous
          approvals remain preserved.
        </p>
        <button disabled={cmd.busy}>
          {successor ? "Create successor draft" : "Save scope draft"}
        </button>
        <p role="status">{cmd.saved}</p>
      </form>
    </ValidationFields>
  );
}
function ReadinessTable({ rows }: { rows: Assessment[] }) {
  return (
    <div className="wo-readiness">
      {rows.map((a) => (
        <article
          key={a.criterion_code}
          className={`wo-criterion ${["Unknown", "Blocked"].includes(a.outcome) ? "wo-blocked" : ""}`}
        >
          <div>
            <strong>{a.label}</strong>
            <p>
              {a.blocking_stage} ·{" "}
              {a.exception_allowed
                ? "Documented exception permitted"
                : "Mandatory — no general override"}
            </p>
          </div>
          <Status value={a.outcome} />
          {a.stale && <p>Scope changed. Review again.</p>}
          {a.expired && <p>Evidence expired. Review again.</p>}
          {a.reason && <p>{a.reason}</p>}
          {a.evidence_text && (
            <details>
              <summary>Reviewed evidence</summary>
              <p className="preserve-lines">{a.evidence_text}</p>
              <p>
                Source as at <Stamp value={a.source_as_at} /> · Assessed{" "}
                <Stamp value={a.assessed_at} />
              </p>
              {a.valid_until && (
                <p>
                  Valid until <Stamp value={a.valid_until} />
                </p>
              )}
            </details>
          )}
        </article>
      ))}
    </div>
  );
}
function AssessmentForm({
  w,
  r,
  visit,
  onSaved,
}: {
  w: Order;
  r: Scope;
  visit?: Visit;
  onSaved: () => void;
}) {
  const rows = visit?.readiness ?? r.readiness;
  const [criterion, setCriterion] = useState(rows[0]?.criterion_code ?? ""),
    [outcome, setOutcome] = useState("Unknown"),
    [reason, setReason] = useState(""),
    [evidence, setEvidence] = useState(emptyEvidence),
    [asAt, setAsAt] = useState(""),
    [expiry, setExpiry] = useState(""),
    [expected, setExpected] = useState(w.version);
  const cmd = useCommand(),
    pc = rows.find((x) => x.criterion_code === criterion);
  return (
    <ValidationFields error={cmd.error}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const result = await cmd.send<{ record_version: number }>(
            `service/work-orders/${w.id}/readiness`,
            {
              expected_version: expected,
              assessment: {
                scope_revision_id: r.id,
                scope_version: r.version,
                appointment_id: visit?.id ?? null,
                criterion_code: criterion,
                outcome,
                reason,
                evidence: [
                  "Pass",
                  "PermittedException",
                  "NotApplicable",
                ].includes(outcome)
                  ? evidence
                  : null,
                source_as_at: asAt ? new Date(asAt).toISOString() : null,
                valid_until: expiry ? new Date(expiry).toISOString() : null,
              },
              reason: "Review synthetic readiness evidence",
            },
          );
          if (result) {
            setExpected(result.record_version);
            onSaved();
          }
        }}
      >
        <ErrorNotice error={cmd.error} />
        <ConflictReview
          version={expected}
          latest={w.version}
          onAdopt={() => {
            cmd.clear();
            setExpected(w.version);
          }}
        />
        <SelectField
          name={`criterion-${visit?.id ?? "scope"}`}
          label="Readiness criterion"
          value={criterion}
          onChange={(v) => {
            setCriterion(v);
            setOutcome("Unknown");
          }}
          options={rows.map((a) => ({
            id: a.criterion_code,
            display_name: `${a.label} · ${a.blocking_stage}`,
          }))}
        />
        <EnumField
          name={`outcome-${visit?.id ?? "scope"}`}
          label="Readiness decision"
          value={outcome}
          onChange={setOutcome}
          values={readinessStates
            .filter((v) => v !== "PermittedException" || pc?.exception_allowed)
            .filter((v) => v !== "NotApplicable" || pc?.not_applicable_allowed)}
        />
        <Field
          name={`reason-${visit?.id ?? "scope"}`}
          validationField="assessment_reason"
          label="Review reason"
          value={reason}
          onChange={setReason}
          multiline
          maxLength={2000}
          required
        />
        <Field
          name={`asat-${visit?.id ?? "scope"}`}
          validationField="source_as_at"
          label="Evidence source time (your device timezone)"
          type="datetime-local"
          value={asAt}
          onChange={setAsAt}
          required
        />
        <Field
          name={`expiry-${visit?.id ?? "scope"}`}
          validationField="valid_until"
          label="Evidence expiry (optional, your device timezone)"
          type="datetime-local"
          value={expiry}
          onChange={setExpiry}
        />
        {["Pass", "PermittedException", "NotApplicable"].includes(outcome) && (
          <EvidenceFields
            prefix={`readiness-${visit?.id ?? "scope"}`}
            value={evidence}
            onChange={setEvidence}
          />
        )}
        <button disabled={cmd.busy}>Record readiness review</button>
        <p role="status">{cmd.saved}</p>
      </form>
    </ValidationFields>
  );
}
function VisitForm({
  w,
  r,
  onSaved,
}: {
  w: Order;
  r: Scope;
  onSaved: () => void;
}) {
  const [start, setStart] = useState(""),
    [end, setEnd] = useState(""),
    [windowStart, setWindowStart] = useState(""),
    [windowEnd, setWindowEnd] = useState(""),
    [commitment, setCommitment] = useState("Unknown"),
    [preparation, setPreparation] = useState("Unknown"),
    [expected, setExpected] = useState(w.version),
    [id] = useState(() => crypto.randomUUID());
  const cmd = useCommand();
  return (
    <ValidationFields error={cmd.error}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const result = await cmd.send(`service/work-orders/${w.id}/visits`, {
            id,
            expected_version: expected,
            scope_revision_id: r.id,
            scope_version: r.version,
            start_at: start ? new Date(start).toISOString() : null,
            end_at: end ? new Date(end).toISOString() : null,
            requested_window_start: windowStart
              ? new Date(windowStart).toISOString()
              : null,
            requested_window_end: windowEnd
              ? new Date(windowEnd).toISOString()
              : null,
            customer_commitment: commitment,
            preparation_status: preparation,
            reason: "Record synthetic proposed attendance only",
          });
          if (result) onSaved();
        }}
      >
        <ErrorNotice error={cmd.error} />
        <ConflictReview
          version={expected}
          latest={w.version}
          onAdopt={() => {
            cmd.clear();
            setExpected(w.version);
          }}
        />
        <p>
          Enter instants in your device timezone. The saved proposal is shown in{" "}
          {w.site_timezone}. No crew or time is reserved.
        </p>
        <div className="form-grid">
          <Field
            name="visit-start"
            label="Proposed start (device timezone)"
            value={start}
            onChange={setStart}
            type="datetime-local"
            required
          />
          <Field
            name="visit-end"
            label="Proposed finish (device timezone)"
            value={end}
            onChange={setEnd}
            type="datetime-local"
            required
          />
          <Field
            name="window-start"
            label="Customer window start (optional)"
            value={windowStart}
            onChange={setWindowStart}
            type="datetime-local"
          />
          <Field
            name="window-end"
            label="Customer window finish (optional)"
            value={windowEnd}
            onChange={setWindowEnd}
            type="datetime-local"
          />
          <EnumField
            name="customer-commitment"
            label="Customer commitment"
            value={commitment}
            values={["Unknown", "Proposed"]}
            onChange={setCommitment}
          />
          <EnumField
            name="preparation"
            label="Preparation state"
            value={preparation}
            values={["Unknown", "Preparing", "Blocked"]}
            onChange={setPreparation}
          />
        </div>
        <button disabled={cmd.busy}>Save proposed visit</button>
        <p role="status">{cmd.saved}</p>
      </form>
    </ValidationFields>
  );
}
function ScopeView({ r }: { r: Scope }) {
  return (
    <>
      <p className="preserve-lines lede">
        {r.summary ?? "Scope summary needed"}
      </p>
      {r.change_reason && (
        <p className="callout">
          <strong>Change reason:</strong> {r.change_reason}
        </p>
      )}
      <dl className="summary-grid">
        <SummaryPair label="Exclusions">
          <span className="preserve-lines">
            {r.exclusions ?? "Not recorded"}
          </span>
        </SummaryPair>
        <SummaryPair label="Limited diagnostic authority">
          <span className="preserve-lines">
            {r.diagnostic_limit ?? "Not recorded"}
          </span>
        </SummaryPair>
        <SummaryPair label="Account and charging review">
          <span className="preserve-lines">
            {r.pending_account_plan ?? "Not recorded"}
          </span>
        </SummaryPair>
      </dl>
      {r.items.map((i) => (
        <article key={i.id} className="wo-task">
          <h3>
            {i.sequence}. {i.task_description}
          </h3>
          <Status value={i.task_kind} />
          <p>
            <strong>Expected outcome:</strong> {i.expected_outcome}
          </p>
          <ul>
            {i.completion_requirements.map((x, j) => (
              <li key={j}>{x}</li>
            ))}
          </ul>
          {i.required_skill_codes.length > 0 && (
            <p>Competencies: {i.required_skill_codes.join(", ")}</p>
          )}
          {i.shutdown_condition && (
            <p>Shutdown / isolation: {i.shutdown_condition}</p>
          )}
          {i.access_condition && <p>Access: {i.access_condition}</p>}
          {i.assets.map((a) => (
            <div key={a.asset_id} className="wo-asset">
              <Link href={`/equipment/${a.asset_id}`}>
                {a.description} · {a.display_number}
              </Link>{" "}
              <Status value={a.identity_status} />
              {a.identity_status !== "Verified" && (
                <p>
                  Identity remains unresolved or disputed. Only a reviewed
                  identification plan can permit the defined limited task.
                </p>
              )}
              {a.configuration_status && (
                <p>Configuration: {a.configuration_status}</p>
              )}
              {a.method && (
                <>
                  <p>
                    <strong>Identification method:</strong> {a.method}
                  </p>
                  <p>
                    <strong>Limits:</strong> {a.limits}
                  </p>
                  <p>
                    {r.approved_at
                      ? "Plan approved with this exact scope."
                      : "Plan awaits scope authorisation."}
                  </p>
                </>
              )}
            </div>
          ))}
        </article>
      ))}
      <div className="wo-two-column">
        <section>
          <h3>Coverage</h3>
          <Status value={r.coverage?.status ?? "Unknown"} />
          <p>{r.coverage?.assessment ?? "Assessment not recorded."}</p>
          <p>{r.coverage?.reason}</p>
          {r.coverage?.agreement_reference && (
            <p>
              {r.coverage.agreement_reference} · version{" "}
              {r.coverage.source_version ?? "Unknown"}
            </p>
          )}
          <p>
            Charging route:{" "}
            {r.coverage?.charging_route === "ContractReference"
              ? "Contract reference for separate review"
              : "Finance review pending"}
          </p>
          <p className="read-meta">
            No automatic free work, invoice or supplier recovery.
          </p>
        </section>
        <section>
          <h3>Authority evidence</h3>
          {r.authority ? (
            <>
              <strong>{r.authority.title}</strong>
              <p>
                {r.authority.source_reference} · version{" "}
                {r.authority.source_version}
              </p>
              <p className="preserve-lines">{r.authority.content_text}</p>
              <small>Synthetic manual evidence</small>
            </>
          ) : (
            <p>Authority evidence is missing.</p>
          )}
        </section>
      </div>
      {r.approved_at && (
        <aside className="callout">
          <strong>Authorised scope — read-only</strong>
          <p>
            Authorised <Stamp value={r.approved_at} />. Changes require a
            successor revision and fresh review.
          </p>
          <details>
            <summary>Exact approval identity</summary>
            <p>Reviewer: {r.approved_by}</p>
            <p className="hash">Scope hash: {r.content_hash}</p>
          </details>
        </aside>
      )}
    </>
  );
}
export function WorkOrderDetail({ id }: { id: string }) {
  const resource = useResource<Envelope<Order>>(`service/work-orders/${id}`),
    cmd = useCommand();
  const w = resource.data?.items[0],
    r = w?.scopes.find((s) => s.id === w.scope_revision_id) ?? null;
  return (
    <>
      <ReadState
        loading={resource.loading}
        error={resource.error}
        retry={resource.reload}
      />
      {w && (
        <>
          <PageHeader
            eyebrow={`Service / ${w.display_number}`}
            title={r?.summary ?? "Work scope needed"}
            description={`${w.customer_name} · ${w.site_name}`}
            action={
              <button className="secondary" onClick={resource.reload}>
                Compare saved version
              </button>
            }
          />
          <div className="wo-state">
            <Status value={w.status} />
            <Status value={r?.coverage?.status ?? "Unknown"} />
            <span>
              {r
                ? `Current scope r${String(r.revision).padStart(2, "0")}`
                : "No scope revision"}
            </span>
            <span>Service owner: {w.owner_name}</span>
          </div>
          {w.authorised_scope_revision_id &&
            w.authorised_scope_revision_id !== w.scope_revision_id && (
              <aside className="callout">
                <strong>Successor draft awaiting authorisation</strong>
                <p>
                  The previous approved scope remains exact. The proposed
                  changes grant no additional work authority.
                </p>
              </aside>
            )}
          <section className="panel">
            <h2>Linked service requests</h2>
            {w.tickets.map((t) => (
              <p key={t.id}>
                <Link href={`/service/tickets/${t.id}`}>
                  {t.display_number} · {t.summary}
                </Link>{" "}
                <Status value={t.status} /> <Status value={t.priority} />
                <br />
                {t.issue_disposition}
              </p>
            ))}
          </section>
          <section className="panel" aria-labelledby="authorisation-heading">
            <h2 id="authorisation-heading">Work authorisation</h2>
            <ErrorNotice error={cmd.error} />
            {w.blockers.length ? (
              <>
                <p>
                  <strong>Blocked at work authorisation</strong> ·{" "}
                  {w.blockers.length} item(s) need review. Urgent priority
                  bypasses no control.
                </p>
                <ul className="wo-blocker-list">
                  {w.blockers.map((b, i) => (
                    <li key={i}>{b.message}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p>
                {r?.approved_at
                  ? "The current scope is authorised. Confirmed appointments require controlled planner checks."
                  : "The saved scope is ready for an authorised reviewer’s decision."}
              </p>
            )}
            {w.actions.can_authorise && r && !r.approved_at && (
              <button
                disabled={cmd.busy}
                onClick={async () => {
                  const result = await cmd.send(
                    `service/work-orders/${w.id}/authorise`,
                    {
                      expected_version: w.version,
                      scope_revision_id: r.id,
                      scope_version: r.version,
                      policy_version_id: r.policy_version_id,
                      reason:
                        "Authorise exact synthetic scope and reviewed evidence",
                    },
                  );
                  if (result) resource.reload();
                }}
              >
                Authorise current scope
              </button>
            )}
            <p role="status">{cmd.saved}</p>
          </section>
          <section className="panel">
            <h2>
              Current scope {r ? `r${String(r.revision).padStart(2, "0")}` : ""}
            </h2>
            {r ? (
              <ScopeView r={r} />
            ) : (
              <p>No scope is saved yet. The draft remains owned and visible.</p>
            )}
            {w.actions.can_edit && (
              <details className="wo-edit" open={!r}>
                <summary>
                  {r?.approved_at
                    ? "Create successor scope"
                    : "Edit scope draft"}
                </summary>
                <ScopeForm
                  key={r?.id ?? "first"}
                  w={w}
                  r={r}
                  successor={!!r?.approved_at}
                  onSaved={resource.reload}
                />
              </details>
            )}
          </section>
          {r && (
            <section className="panel">
              <h2>Readiness for work authorisation</h2>
              <p>
                Each criterion records its policy, stage and reviewed evidence.
                Approval does not confirm crew competency or dispatch readiness.
              </p>
              <ReadinessTable rows={r.readiness} />
              {w.actions.can_assess && !r.approved_at && (
                <details className="wo-edit">
                  <summary>Review a readiness criterion</summary>
                  <AssessmentForm w={w} r={r} onSaved={resource.reload} />
                </details>
              )}
            </section>
          )}
          <section className="panel">
            <h2>Planned visits</h2>
            <p>
              Proposals reserve no crew. Open the appointment for confirmed
              booking, crew and contact details. Dispatch and acknowledgement
              remain separate.
            </p>
            {!w.visits.length && <p>No visits proposed yet.</p>}
            {w.visits.map((v) => (
              <article className="wo-task" key={v.id}>
                <h3>
                  <Link href={`/service/appointments/${v.id}`}>
                    {v.display_number}
                  </Link>
                </h3>
                <Status value={v.status} />
                <p>
                  <Stamp value={v.start_at} timezone={v.site_timezone} /> –{" "}
                  <Stamp value={v.end_at} timezone={v.site_timezone} /> (
                  {v.site_timezone})
                </p>
                <p>
                  Customer commitment: {v.customer_commitment} · Preparation:{" "}
                  {v.preparation_status}
                </p>
                {v.scope_review_required && (
                  <p className="callout">
                    Scope review required before later confirmation. This
                    proposal retains its original scope context.
                  </p>
                )}
                <ReadinessTable rows={v.readiness} />
                {w.actions.can_assess &&
                  v.status !== "Cancelled" &&
                  w.scopes.find((s) => s.id === v.scope_revision_id) && (
                    <details className="wo-edit">
                      <summary>Review proposed visit preparation</summary>
                      <AssessmentForm
                        w={w}
                        r={w.scopes.find((s) => s.id === v.scope_revision_id)!}
                        visit={v}
                        onSaved={resource.reload}
                      />
                    </details>
                  )}
              </article>
            ))}
            {w.actions.can_edit && r && (
              <details className="wo-edit">
                <summary>Propose a visit</summary>
                <VisitForm
                  key={`${r.id}-${w.visits.length}`}
                  w={w}
                  r={r}
                  onSaved={resource.reload}
                />
              </details>
            )}
          </section>
          {w.scopes.length > 1 && (
            <section className="panel">
              <h2>Scope revision history</h2>
              {w.scopes
                .filter((s) => s.id !== w.scope_revision_id)
                .map((s) => (
                  <details key={s.id}>
                    <summary>
                      Scope r{String(s.revision).padStart(2, "0")} —{" "}
                      {s.approved_at ? "Authorised, read-only" : "Draft"}
                    </summary>
                    <ScopeView r={s} />
                    <ReadinessTable rows={s.readiness} />
                  </details>
                ))}
            </section>
          )}
          <Observed envelope={resource.data!} />
        </>
      )}
    </>
  );
}
