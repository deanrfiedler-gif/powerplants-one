"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  api,
  ErrorNotice,
  Field,
  PageHeader,
  SelectField,
  ValidationFields,
} from "./business-ui";
import { useIdentity } from "./business-session";
import { useCrmResource } from "./crm-state";
import { useUnsavedChanges } from "./record-ui";
import { useRecoverableCommand } from "../shared/ui/use-recoverable-command";
import type { JournalEntry } from "../shared/lib/command-journal";
import type {
  listCostSources,
  readCostSource,
} from "../estimating/sources/reads";
import type { readEstimate } from "../estimating/reads";
import type { previewSourceRefresh } from "../estimating/sources/refresh";
import type {
  SourceContent,
  refreshProposal,
} from "../estimating/sources/validation";
import { Button, ButtonLink } from "./ui/button";
import "./estimating.css";
import "./cost-sources.css";

type Register = Awaited<ReturnType<typeof listCostSources>>;
type Detail = Awaited<ReturnType<typeof readCostSource>>;
type Estimate = Awaited<ReturnType<typeof readEstimate>>;
type Comparison = Awaited<ReturnType<typeof previewSourceRefresh>>;
type RefreshProposal = ReturnType<typeof refreshProposal>;
const accepts = (e: JournalEntry) =>
  /^estimating\/(cost-sources(?:\/[a-f0-9-]{36}(?:\/review)?)?|estimates\/[a-f0-9-]{36}\/source-refresh)$/.test(
    e.path,
  ) && /^\/estimating\/(cost-sources|estimates)\/[a-f0-9-]{36}$/.test(e.target);
function useSourceCommand(key: string) {
  const storageKey = `ppo:es03:${key}`,
    command = useRecoverableCommand({
      key: storageKey,
      scope: useIdentity(),
      accepts,
      transport: api,
    });
  return {
    ...command,
    openAccepted: () => {
      if (command.accepted) {
        try {
          sessionStorage.removeItem(storageKey + ":accepted");
        } catch {
          // Storage failure must not prevent opening a confirmed server record.
        }
        window.location.assign(command.accepted.entry.target);
      }
    },
  };
}
function Outcome({
  command,
}: {
  command: ReturnType<typeof useSourceCommand>;
}) {
  return (
    <>
      <ErrorNotice error={command.error} />
      {!command.ready && (
        <p role="status">Checking same-tab recovery before another save…</p>
      )}
      {command.busy && (
        <p role="status">Confirming the original server action…</p>
      )}
      {command.pending && (
        <section className="est-panel" aria-label="Original operation recovery">
          <h2>Resolve the original action</h2>
          <p>
            Outcome unknown. No replacement command has been created. Operation{" "}
            {command.pending.body.operation_id}
          </p>
          <div className="source-actions">
            <Button
              disabled={command.busy}
              onClick={() => void command.recover()}
            >
              Check original outcome
            </Button>
            <Button
              disabled={command.busy}
              onClick={() => void command.retry()}
            >
              Retry exact original
            </Button>
          </div>
        </section>
      )}
      {command.accepted && (
        <section className="est-panel" role="status">
          <h2>Saved to the server</h2>
          <p>
            Accepted record version {command.accepted.receipt.record_version} ·{" "}
            {command.accepted.receipt.state}
          </p>
          <Button onClick={command.openAccepted}>Open saved record</Button>
          <p>Operation {command.accepted.receipt.operation_id}</p>
        </section>
      )}
    </>
  );
}
function ReadState({
  loading,
  error,
  reload,
}: {
  loading: boolean;
  error: unknown;
  reload: () => void;
}) {
  return (
    <>
      <ErrorNotice error={error} />
      {loading && <p role="status">Loading permitted source evidence…</p>}
      {!!error && <Button onClick={reload}>Try loading again</Button>}
    </>
  );
}
function Boundary() {
  return (
    <aside className="est-panel">
      <h2>Source review and commercial authority</h2>
      <p>
        Manually authored synthetic evidence · AUD · excluding tax. Source
        review does not approve an estimate or quotation. Unknown expiry remains
        Unknown.
      </p>
      <p>
        Supplier connections, currency or unit conversion, landed-cost
        allocation and operational approval thresholds:{" "}
        <strong>Not configured</strong>.
      </p>
    </aside>
  );
}
export function CostSourceRegister() {
  const params = useSearchParams(),
    router = useRouter(),
    q = params.get("q") ?? "",
    state = params.get("state") ?? "";
  const data = useCrmResource<Register>(
    `estimating/cost-sources?${new URLSearchParams({ ...(q ? { q } : {}), ...(state ? { state } : {}) })}`,
    true,
  );
  return (
    <div className="est-screen source-screen">
      <PageHeader
        variant="register"
        eyebrow="Estimating · Synthetic"
        title="Cost sources"
        description="Review exact supplier evidence, then deliberately compare its effect on a saved estimate."
        action={
          data.data?.companies.length ? (
            <ButtonLink variant="primary" href="/estimating/cost-sources/new">
              New synthetic source
            </ButtonLink>
          ) : undefined
        }
      />
      <nav className="source-actions" aria-label="Cost source workflow">
        <Link href="/estimating">Intake & workload</Link>
        <Link href="/estimating?tab=estimates">Choose a saved estimate</Link>
      </nav>
      <form
        key={`${q}:${state}`}
        className="source-filter"
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget),
            next = new URLSearchParams();
          for (const key of ["q", "state"])
            if (form.get(key)) next.set(key, String(form.get(key)));
          router.push(`/estimating/cost-sources?${next}`);
        }}
      >
        <label>
          Search source, supplier or item
          <input type="search" name="q" defaultValue={q} maxLength={100} />
        </label>
        <label>
          Current source state
          <select name="state" defaultValue={state}>
            <option value="">All states</option>
            {["Draft", "Submitted", "Reviewed", "Returned", "Rejected"].map(
              (s) => (
                <option key={s}>{s}</option>
              ),
            )}
          </select>
        </label>
        <Button type="submit" variant="primary">
          Apply filters
        </Button>
        <Link href="/estimating/cost-sources">Clear filters</Link>
      </form>
      <ReadState {...data} />
      {data.data && (
        <>
          <p>
            {data.data.items.length} permitted sources · up to {data.data.limit}{" "}
            matching records. Narrow search for older sources.
          </p>
          {!data.data.items.length ? (
            <section className="est-panel">
              <h2>
                {q || state
                  ? "No sources match these filters"
                  : "No cost sources yet"}
              </h2>
              <p>
                Clear filters or create authored synthetic evidence with an
                explicit company and source reference.
              </p>
            </section>
          ) : (
            data.data.items.map((s) => (
              <article className="est-panel source-register-row" key={s.id}>
                <div>
                  <p className="est-eyebrow">
                    {s.reference} · Revision {s.revision} · {s.state}
                  </p>
                  <h2>
                    <Link href={`/estimating/cost-sources/${s.id}`}>
                      {s.title}
                    </Link>
                  </h2>
                  <p>
                    {s.supplier} · {s.item} · per {s.unit}
                  </p>
                </div>
                <div>
                  <p>Effective from {s.effective_from}</p>
                  <p>Supplier expiry: {s.valid_until ?? "Unknown"}</p>
                  <p>
                    {s.reviewed_revisions.length} reviewed revisions available
                  </p>
                </div>
              </article>
            ))
          )}
        </>
      )}
      <Boundary />
    </div>
  );
}
const emptyContent = (): SourceContent => ({
  title: "",
  supplier_label: "",
  supplier_entity_key: null,
  item_reference: "",
  unit: "",
  currency: "AUD",
  tax_basis: "ExcludingTax",
  data_mode: "Synthetic",
  source_date: "",
  effective_from: "",
  valid_until: null,
  evidence_reference: "",
  evidence_excerpt: "",
  tiers: [{ minimum_quantity: "", unit_cost: "" }],
});
function SourceFields({
  value,
  onChange,
  identityLocked,
}: {
  value: SourceContent;
  onChange: (v: SourceContent) => void;
  identityLocked: boolean;
}) {
  const set = (key: keyof SourceContent, v: unknown) =>
    onChange({ ...value, [key]: v });
  return (
    <>
      <div className="source-grid">
        <Field
          label="Source title"
          name="title"
          value={value.title}
          onChange={(v) => set("title", v)}
          required
          maxLength={200}
        />
        <fieldset disabled={identityLocked}>
          <Field
            label="Supplier label"
            name="supplier_label"
            value={value.supplier_label}
            onChange={(v) => set("supplier_label", v)}
            required
            maxLength={200}
          />
          <Field
            label="External company/entity key, if known"
            name="supplier_entity_key"
            value={value.supplier_entity_key ?? ""}
            onChange={(v) => set("supplier_entity_key", v || null)}
            maxLength={200}
          />
          <Field
            label="Item reference"
            name="item_reference"
            value={value.item_reference}
            onChange={(v) => set("item_reference", v)}
            required
            maxLength={200}
          />
          <Field
            label="Unit"
            name="unit"
            value={value.unit}
            onChange={(v) => set("unit", v)}
            required
            maxLength={40}
          />
          {identityLocked && (
            <p>A different supplier, item or unit needs a separate source.</p>
          )}
        </fieldset>
        <Field
          label="Source date"
          name="source_date"
          type="date"
          value={value.source_date}
          onChange={(v) => set("source_date", v)}
          required
        />
        <Field
          label="Effective from"
          name="effective_from"
          type="date"
          value={value.effective_from}
          onChange={(v) => set("effective_from", v)}
          required
        />
        <Field
          label="Known validity end, otherwise leave blank"
          name="valid_until"
          type="date"
          value={value.valid_until ?? ""}
          onChange={(v) => set("valid_until", v || null)}
        />
        <Field
          label="Evidence reference"
          name="evidence_reference"
          value={value.evidence_reference}
          onChange={(v) => set("evidence_reference", v)}
          required
          maxLength={300}
        />
      </div>
      <Field
        label="Authored synthetic evidence"
        name="evidence_excerpt"
        value={value.evidence_excerpt}
        onChange={(v) => set("evidence_excerpt", v)}
        multiline
        required
        maxLength={6000}
      />
      <h2>Explicit quantity tiers</h2>
      <p>
        Increasing minimum quantities, up to 20 tiers. Blank price is unknown;
        zero must be entered explicitly.
      </p>
      {value.tiers.map((t, i) => (
        <fieldset key={i} className="source-tier">
          <legend>Tier {i + 1}</legend>
          <Field
            label={`Minimum quantity ${i + 1}`}
            name={`tiers.${i}.minimum_quantity`}
            value={t.minimum_quantity}
            onChange={(v) =>
              set(
                "tiers",
                value.tiers.map((x, n) =>
                  n === i ? { ...x, minimum_quantity: v } : x,
                ),
              )
            }
            required
          />
          <Field
            label={`Unit cost AUD ${i + 1}`}
            name={`tiers.${i}.unit_cost`}
            value={t.unit_cost}
            onChange={(v) =>
              set(
                "tiers",
                value.tiers.map((x, n) =>
                  n === i ? { ...x, unit_cost: v } : x,
                ),
              )
            }
            required
          />
          <Button
            type="button"
            disabled={value.tiers.length === 1}
            onClick={() =>
              set(
                "tiers",
                value.tiers.filter((_, n) => n !== i),
              )
            }
          >
            Remove tier {i + 1}
          </Button>
        </fieldset>
      ))}
      <Button
        type="button"
        disabled={value.tiers.length >= 20}
        onClick={() =>
          set("tiers", [
            ...value.tiers,
            { minimum_quantity: "", unit_cost: "" },
          ])
        }
      >
        Add quantity tier
      </Button>
    </>
  );
}
export function NewCostSource() {
  const data = useCrmResource<Register>("estimating/cost-sources", true);
  return (
    <div className="est-screen source-screen">
      <Link href="/estimating/cost-sources">Cost sources</Link>
      <PageHeader
        title="New synthetic source"
        eyebrow="Estimating · Synthetic"
      />
      <ReadState {...data} />
      {data.data && <SourceForm companies={data.data.companies} />}
      <Boundary />
    </div>
  );
}
function SourceForm({
  companies = [],
  initial,
}: {
  companies?: Register["companies"];
  initial?: Detail;
}) {
  const [id] = useState(() => initial?.source.id ?? crypto.randomUUID()),
    [basis, setBasis] = useState(initial),
    [content, setContent] = useState(initial?.revision.content ?? emptyContent),
    [company, setCompany] = useState(
      initial?.source.company_id ?? companies[0]?.id ?? "",
    ),
    [reference, setReference] = useState(initial?.source.reference ?? ""),
    [reason, setReason] = useState(""),
    [dirty, setDirty] = useState(false);
  const command = useSourceCommand(initial ? `revise:${id}` : "create"),
    frozen =
      !command.ready || command.busy || !!command.pending || !!command.accepted,
    stale = !!basis && initial?.source.version !== basis.source.version;
  useUnsavedChanges(
    dirty && !command.accepted,
    !!command.pending || command.busy,
  );
  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void command.send(
            initial
              ? `estimating/cost-sources/${id}`
              : "estimating/cost-sources",
            {
              ...(initial
                ? { expected_version: basis!.source.version }
                : { id, company_id: company, reference }),
              content,
              reason,
            },
            `/estimating/cost-sources/${id}`,
            initial ? "Source successor" : "Synthetic source",
            id,
          );
        }}
        onChange={() => setDirty(true)}
      >
        <ValidationFields error={command.error}>
          <fieldset disabled={frozen}>
            <h2>
              {initial ? "Prepare a source successor" : "Record the evidence"}
            </h2>
            {!initial && (
              <>
                <SelectField
                  label="Company"
                  name="company_id"
                  value={company}
                  onChange={setCompany}
                  options={companies}
                  required
                />
                <Field
                  label="Local synthetic reference"
                  name="reference"
                  value={reference}
                  onChange={setReference}
                  required
                  maxLength={100}
                  hint="Start with SYN-. This is not an ERP record key."
                />
              </>
            )}
            <SourceFields
              value={content}
              onChange={setContent}
              identityLocked={!!initial}
            />
            <Field
              label="Reason for this source version"
              name="reason"
              value={reason}
              onChange={setReason}
              required
              maxLength={1000}
            />
            {stale && (
              <section role="alert">
                <h3>The saved source changed</h3>
                <p>
                  Your entries remain here. Starting basis version{" "}
                  {basis?.source.version}; current version{" "}
                  {initial?.source.version}.
                </p>
                <details>
                  <summary>Compare current saved evidence</summary>
                  <Evidence detail={initial!} />
                </details>
                <Button
                  type="button"
                  onClick={() => {
                    setBasis(initial);
                    setContent(initial!.revision.content);
                    setDirty(false);
                  }}
                >
                  Replace my entries with current saved evidence
                </Button>
              </section>
            )}
            <Button
              type="submit"
              variant="primary"
              disabled={stale || (!initial && !company)}
            >
              {initial ? "Save source successor" : "Save synthetic source"}
            </Button>
          </fieldset>
        </ValidationFields>
      </form>
      <Outcome command={command} />
    </>
  );
}
function Evidence({ detail: d }: { detail: Detail }) {
  const r = d.revision,
    c = r.content,
    review = d.history.find(
      (e) => e.revision_id === r.id && e.action === "Reviewed",
    );
  return (
    <section className="est-panel">
      <h2>Exact source revision {r.revision}</h2>
      <dl className="source-facts">
        <dt>Supplier / entity key</dt>
        <dd>
          {c.supplier_label} / {c.supplier_entity_key ?? "Unknown"}
        </dd>
        <dt>Item / unit</dt>
        <dd>
          {c.item_reference} / {c.unit}
        </dd>
        <dt>Source date</dt>
        <dd>{c.source_date}</dd>
        <dt>Effective from / expiry</dt>
        <dd>
          {c.effective_from} / {c.valid_until ?? "Unknown"}
        </dd>
        <dt>Evidence reference</dt>
        <dd>{c.evidence_reference}</dd>
        <dt>Exact revision review</dt>
        <dd>
          {review
            ? `Reviewed · ${review.created_at} · ${review.reason}`
            : "No independent reviewed event"}
        </dd>
      </dl>
      <p className="source-narrative">{c.evidence_excerpt}</p>
      <ul>
        {c.tiers.map((t) => (
          <li key={t.minimum_quantity}>
            From {t.minimum_quantity} {c.unit}: AUD {t.unit_cost} per {c.unit},
            excluding tax
          </li>
        ))}
      </ul>
      <details>
        <summary>Immutable identity and hash</summary>
        <p className="source-narrative">
          Revision {r.id}
          <br />
          Predecessor {r.predecessor_id ?? "None"}
          <br />
          SHA-256 {r.content_hash}
          <br />
          Author {r.created_by}
        </p>
      </details>
    </section>
  );
}
function SourceComparison({ detail: d }: { detail: Detail }) {
  if (!d.previous_revision) return null;
  const old = d.previous_revision.content,
    current = d.revision.content;
  const tiers = (c: SourceContent) =>
    c.tiers
      .map((t) => `${t.minimum_quantity}+ ${c.unit}: AUD ${t.unit_cost}`)
      .join("; ");
  const rows = [
    ["Source title", old.title, current.title],
    ["Quantity tiers", tiers(old), tiers(current)],
    ["Source date", old.source_date, current.source_date],
    ["Effective from", old.effective_from, current.effective_from],
    [
      "Known expiry",
      old.valid_until ?? "Unknown",
      current.valid_until ?? "Unknown",
    ],
    ["Evidence reference", old.evidence_reference, current.evidence_reference],
    ["Authored evidence", old.evidence_excerpt, current.evidence_excerpt],
  ];
  return (
    <section className="est-panel">
      <h2>Compare source revisions</h2>
      <p>
        Previous r{d.previous_revision.revision} and selected r
        {d.revision.revision}. Changed evidence is marked; review decisions
        remain separate.
      </p>
      {rows.map(([label, before, after]) => (
        <div className="source-change" key={label}>
          <h3>
            {label}
            {before !== after ? " · Changed" : " · Unchanged"}
          </h3>
          <div className="source-change-values">
            <p>
              <strong>Previous</strong>
              <br />
              {before}
            </p>
            <p>
              <strong>Selected</strong>
              <br />
              {after}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}
export function CostSourceDetail({ id }: { id: string }) {
  const params = useSearchParams(),
    revision = params.get("revision_id"),
    data = useCrmResource<Detail>(
      `estimating/cost-sources/${id}${revision ? `?revision_id=${encodeURIComponent(revision)}` : ""}`,
      true,
    ),
    [edit, setEdit] = useState(false);
  return (
    <div className="est-screen source-screen">
      <Link href="/estimating/cost-sources">Cost sources</Link>
      <PageHeader
        title={data.data?.revision.content.title ?? "Source evidence"}
        eyebrow="Estimating · Synthetic"
      />
      <ReadState {...data} />
      {data.data && (
        <>
          <p>
            {data.data.source.reference} · current source{" "}
            {data.data.source.state} · record version {data.data.source.version}
          </p>
          <Evidence detail={data.data} />
          <SourceComparison detail={data.data} />
          <nav className="source-actions" aria-label="Source actions">
            {data.data.can_revise && !edit && (
              <Button onClick={() => setEdit(true)}>
                Prepare source successor
              </Button>
            )}
            <Link href="/estimating?tab=estimates">
              Choose an estimate to compare costs
            </Link>
          </nav>
          {edit && data.data.can_revise && <SourceForm initial={data.data} />}
          <SourceDecision detail={data.data} />
          <section className="est-panel">
            <h2>Revision and review history</h2>
            {data.data.revisions.map((r) => (
              <p key={r.id}>
                <Link
                  href={`/estimating/cost-sources/${id}?revision_id=${r.id}`}
                >
                  Revision {r.revision}
                </Link>{" "}
                · {r.reason}
              </p>
            ))}
            <ol>
              {data.data.history.map((e) => (
                <li key={e.id}>
                  {e.action} · record version {e.source_version} ·{" "}
                  {String(e.created_at)} · {e.reason}
                  <details>
                    <summary>Review attribution</summary>
                    <p>
                      {e.created_by} · exact revision {e.revision_id} ·
                      operation {e.operation_id}
                    </p>
                  </details>
                </li>
              ))}
            </ol>
            <Link href={`/estimating/cost-sources/${id}`}>
              Return to current revision
            </Link>
          </section>
          <section className="est-panel">
            <h2>Estimate versions using this source</h2>
            <p>
              Up to {data.data.affected_limit} exact permitted line bindings.
              Legacy free-text mentions have no typed source binding.
            </p>
            {!data.data.affected.length ? (
              <p>No permitted typed bindings found.</p>
            ) : (
              data.data.affected.map((row) => (
                <p key={`${row.estimate_version_id}:${row.line_id}`}>
                  <Link
                    href={`/estimating/estimates/${row.estimate_id}/sources?version_id=${row.estimate_version_id}`}
                  >
                    {row.display_number} · estimate version {row.version}
                  </Link>{" "}
                  ·{" "}
                  {row.is_current
                    ? "Current saved version"
                    : "Historical; retained"}{" "}
                  · line {row.line_id}
                </p>
              ))
            )}
          </section>
        </>
      )}
      <Boundary />
    </div>
  );
}
function SourceDecision({ detail: d }: { detail: Detail }) {
  const [reason, setReason] = useState(""),
    [action, setAction] = useState("Reviewed"),
    [dirty, setDirty] = useState(false),
    command = useSourceCommand(`review:${d.source.id}`);
  useUnsavedChanges(
    dirty && !command.accepted,
    !!command.pending || command.busy,
  );
  if (!d.can_review && !d.can_submit && !command.pending && !command.accepted)
    return (
      <p>
        Submit is available to the draft owner. Independent review requires the
        separately assigned source-evidence duty.
      </p>
    );
  return (
    <section className="est-panel">
      <h2>
        {d.can_submit
          ? "Submit this exact revision"
          : "Independent evidence review"}
      </h2>
      <form
        onChange={() => setDirty(true)}
        onSubmit={(e) => {
          e.preventDefault();
          void command.send(
            `estimating/cost-sources/${d.source.id}/review`,
            {
              expected_version: d.source.version,
              revision_id: d.revision.id,
              action: d.can_submit ? "Submit" : action,
              reason,
            },
            `/estimating/cost-sources/${d.source.id}`,
            "Source review event",
            d.source.id,
          );
        }}
      >
        <ValidationFields error={command.error}>
          <fieldset
            disabled={
              !command.ready ||
              command.busy ||
              !!command.pending ||
              !!command.accepted
            }
          >
            {d.can_review && (
              <SelectField
                label="Evidence decision"
                name="action"
                value={action}
                onChange={setAction}
                options={["Reviewed", "Returned", "Rejected"].map((id) => ({
                  id,
                  display_name: id,
                }))}
                required
              />
            )}
            <Field
              label="Review or submission rationale"
              name="reason"
              value={reason}
              onChange={setReason}
              multiline
              required
              maxLength={1000}
            />
            <Button
              type="submit"
              variant="primary"
              disabled={!d.can_review && !d.can_submit}
            >
              {d.can_submit
                ? "Submit exact source evidence"
                : "Record evidence decision"}
            </Button>
          </fieldset>
        </ValidationFields>
      </form>
      <Outcome command={command} />
    </section>
  );
}
export function EstimateSourceRefresh({ id }: { id: string }) {
  const params = useSearchParams(),
    version = params.get("version_id"),
    estimate = useCrmResource<Estimate>(
      `estimating/estimates/${id}${version ? `?version_id=${encodeURIComponent(version)}` : ""}`,
      true,
    ),
    sources = useCrmResource<Register>("estimating/cost-sources", true);
  return (
    <div className="est-screen source-screen">
      <Link href={`/estimating/estimates/${id}`}>Saved estimate</Link>
      <PageHeader
        title="Compare reviewed source costs"
        eyebrow="Estimating · Synthetic"
      />
      <ReadState {...estimate} />
      <ReadState {...sources} />
      {estimate.data && sources.data && (
        <RefreshForm estimate={estimate.data} sources={sources.data} />
      )}
      <Boundary />
    </div>
  );
}
function RefreshForm({
  estimate: e,
  sources,
}: {
  estimate: Estimate;
  sources: Register;
}) {
  const [basis] = useState(e.saved),
    [pricingDate, setPricingDate] = useState(""),
    [selection, setSelection] = useState<Record<string, string>>({}),
    [comparison, setComparison] = useState<Comparison | null>(null),
    [comparedProposal, setComparedProposal] = useState<RefreshProposal | null>(
      null,
    ),
    [previewError, setPreviewError] = useState<unknown>(null),
    [previewBusy, setPreviewBusy] = useState(false),
    [reason, setReason] = useState(""),
    [reviewed, setReviewed] = useState(false),
    [dirty, setDirty] = useState(false);
  const command = useSourceCommand(`refresh:${e.id}`),
    stale = e.current_version_id !== basis.id,
    editable = e.can_edit && !stale && basis.id === e.current_version_id,
    frozen =
      command.busy || !!command.pending || !!command.accepted || previewBusy;
  const options = sources.items
    .filter((s) => s.company_id === e.company_id)
    .flatMap((s) =>
      s.reviewed_revisions.map((r) => ({
        id: `${s.id}:${r.id}`,
        display_name: `${s.reference} · reviewed r${r.revision} · ${s.item} / ${s.unit}`,
      })),
    );
  const proposal = () => ({
    estimate_version_id: basis.id,
    pricing_date: pricingDate,
    selections: Object.entries(selection)
      .filter(([, value]) => !!value)
      .map(([line_id, value]) => {
        const [source_id, revision_id] = value.split(":"),
          source = sources.items.find((s) => s.id === source_id)!;
        return {
          line_id,
          source_id,
          revision_id,
          expected_source_version: source.version,
        };
      }),
  });
  useUnsavedChanges(
    dirty && !command.accepted,
    !!command.pending || command.busy,
  );
  const changed = () => {
    setComparison(null);
    setComparedProposal(null);
    setReviewed(false);
    setDirty(true);
    setPreviewError(null);
  };
  return (
    <>
      <p>
        {e.display_number} · exact saved estimate version {basis.version} ·{" "}
        {basis.content_hash}
      </p>
      {!editable && (
        <p role="alert">
          This saved basis is historical, changed or read-only. Open the current
          editable estimate to prepare a new comparison.
        </p>
      )}
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setPreviewBusy(true);
          setPreviewError(null);
          setComparison(null);
          setComparedProposal(null);
          setReviewed(false);
          try {
            const exactProposal = proposal();
            const result = await api<Comparison>(
              `estimating/estimates/${e.id}/source-refresh/preview`,
              exactProposal,
            );
            setComparison(result);
            setComparedProposal(exactProposal);
          } catch (error) {
            setPreviewError(error);
          } finally {
            setPreviewBusy(false);
          }
        }}
      >
        <fieldset disabled={frozen || !editable}>
          <Field
            label="Explicit pricing date"
            name="pricing_date"
            type="date"
            value={pricingDate}
            onChange={(v) => {
              changed();
              setPricingDate(v);
            }}
            required
          />
          <p>
            Select each affected line and an exact reviewed revision. Up to 100
            permitted sources and their latest 50 reviewed revisions are
            available. Open Cost sources and narrow search for older evidence.
          </p>
          {basis.lines.map((line, i) => (
            <section className="est-panel source-line" key={line.id}>
              <div>
                <h2>
                  {i + 1}. {line.description}
                </h2>
                <p>
                  {line.quantity} {line.unit} · saved unit cost AUD{" "}
                  {line.unit_cost} · unit sell AUD {line.unit_sell}
                </p>
                <p className="source-narrative">
                  Saved source: {line.source} · source date{" "}
                  {line.effective_date}
                </p>
              </div>
              <div>
                <SelectField
                  label={`Reviewed source for line ${i + 1}`}
                  name={`source.${line.id}`}
                  value={selection[line.id] ?? ""}
                  onChange={(v) => {
                    changed();
                    setSelection({ ...selection, [line.id]: v });
                  }}
                  options={options}
                />
                {selection[line.id] && (
                  <Link
                    href={`/estimating/cost-sources/${selection[line.id].split(":")[0]}?revision_id=${selection[line.id].split(":")[1]}`}
                  >
                    Read selected exact evidence
                  </Link>
                )}
              </div>
            </section>
          ))}
          <Button
            type="submit"
            variant="primary"
            disabled={!Object.values(selection).some(Boolean)}
          >
            Compare selected source costs
          </Button>
        </fieldset>
      </form>
      <ErrorNotice error={previewError} />
      {previewBusy && (
        <p role="status">
          Checking exact scope, source review and cost effects…
        </p>
      )}
      {comparison && comparedProposal && (
        <section className="est-panel">
          <h2>Review the successor cost basis</h2>
          <p>
            Old cost AUD {comparison.before.cost}; proposed cost AUD{" "}
            {comparison.after.cost}; change AUD {comparison.cost_change}. Sell
            remains AUD {comparison.before.sell}.
          </p>
          {comparison.changes.map((c) => (
            <article key={c.line_id}>
              <h3>{c.description}</h3>
              <p>
                Old cost {c.old.unit_cost} / {c.old.source}
              </p>
              <p>
                New cost {c.new.unit_cost} / {c.new.source}
              </p>
              {c.warning && <p role="note">{c.warning}</p>}
            </article>
          ))}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void command.send(
                `estimating/estimates/${e.id}/source-refresh`,
                {
                  expected_version: comparison.expected_version,
                  proposal: comparedProposal,
                  comparison_hash: comparison.comparison_hash,
                  reviewed,
                  reason,
                },
                `/estimating/estimates/${e.id}`,
                "Estimate source successor",
                e.id,
              );
            }}
          >
            <ValidationFields error={command.error}>
              <fieldset disabled={frozen || !editable || !command.ready}>
                <label className="source-check">
                  <input
                    type="checkbox"
                    checked={reviewed}
                    onChange={(event) => setReviewed(event.target.checked)}
                    required
                  />
                  I reviewed every changed line, the unchanged sell prices and
                  any Unknown validity.
                </label>
                <Field
                  label="Reason for the estimate successor"
                  name="reason"
                  value={reason}
                  onChange={setReason}
                  required
                  maxLength={1000}
                />
                <Button type="submit" variant="primary" disabled={!reviewed}>
                  Save reviewed estimate successor
                </Button>
              </fieldset>
            </ValidationFields>
          </form>
        </section>
      )}
      <Outcome command={command} />
    </>
  );
}
