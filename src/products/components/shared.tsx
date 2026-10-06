"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useId, useState } from "react";
import { usePublishPageDescription } from "../../shell/page-description";
import {
  api,
  ErrorNotice,
  Field,
  ReadState,
  SelectField,
} from "../../components/business-ui";
import { useIdentity } from "../../components/business-session";
import { useCrmResource } from "../../components/crm-state";
import { Button } from "../../components/ui/button";
import { useRecoverableCommand } from "../../shared/ui/use-recoverable-command";
import { acceptsProductCommand } from "../journal";
import type { listProducts, readProduct } from "../reads";
import type { Content } from "../model";
import "./products.css";

export type Catalogue = Awaited<ReturnType<typeof listProducts>>;
export type Detail = Awaited<ReturnType<typeof readProduct>>;
export const options = (values: readonly string[]) =>
  values.map((id) => ({ id, display_name: id }));
export function useProductCommand(key: string) {
  return useRecoverableCommand({
    key: `ppo:products:${key}`,
    scope: useIdentity(),
    accepts: acceptsProductCommand,
    transport: api,
  });
}
export function CommandOutcome({
  command,
}: {
  command: ReturnType<typeof useProductCommand>;
}) {
  return (
    <>
      <ErrorNotice error={command.error} />
      {!command.ready && (
        <p role="status">Checking original-operation recovery…</p>
      )}
      {command.busy && (
        <p role="status">Saving — confirming the server result…</p>
      )}
      {command.pending && (
        <aside className="pd-panel" aria-label="Original operation recovery">
          <h2>Outcome unknown</h2>
          <p>
            Retain original operation {command.pending.body.operation_id}. Check
            its receipt before another change.
          </p>
          <div className="pd-actions">
            <Button
              disabled={command.busy}
              onClick={() => void command.recover()}
            >
              Recover original result
            </Button>
            <Button
              disabled={command.busy}
              onClick={() => void command.retry()}
            >
              Retry exact original
            </Button>
          </div>
        </aside>
      )}
      {command.accepted && (
        <p role="status">
          Saved / recovered: {command.accepted.receipt.state} · version{" "}
          {command.accepted.receipt.record_version}.{" "}
          <Link href={command.accepted.entry.target}>Open saved result</Link> ·
          Receipt {command.accepted.receipt.receipt_id}
        </p>
      )}
    </>
  );
}
export function ProductsFrame({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const path = usePathname();
  usePublishPageDescription(
    path,
    "Inspect exact catalogue identities and retained evidence; make controlled changes within your granted company scope.",
  );
  return (
    <div id="ppo-products" className="pd-workspace">
      <header className="pd-header">
        <p className="pd-eyebrow">Shared catalogue · Synthetic data</p>
        <h1>{title}</h1>
        <p>
          Exact identities, controlled evidence and deliberate revision changes.
        </p>
      </header>
      <nav className="pd-tabs" aria-label="Products workspaces">
        {[
          ["Catalogue", "/products"],
          ["Publication", "/products/publication"],
          ["Pricing", "/products/pricing"],
          ["Compatibility", "/products/compatibility"],
          ["Import", "/products/import"],
        ].map(([name, url]) => (
          <Link
            key={url}
            href={url}
            aria-current={path === url ? "page" : undefined}
          >
            {name}
          </Link>
        ))}
      </nav>
      {children}
      <aside className="pd-boundary">
        <strong>Authority and source limits</strong>
        <p>
          Catalogue publication is not installation suitability, quotation
          approval or a purchasing commitment. MYOB remains the ERP authority;
          SharePoint and native CAD retain document authoring. Stock
          observations, live supplier feeds and production import formats: Not
          configured.
        </p>
      </aside>
    </div>
  );
}
export function ResourceState({
  resource,
}: {
  resource: { loading: boolean; error: unknown; reload: () => void };
}) {
  return (
    <ReadState
      loading={resource.loading}
      error={resource.error}
      retry={resource.reload}
    />
  );
}
export function useCatalogue() {
  return useCrmResource<Catalogue>("products", true);
}
export function ProductChoice({
  data,
  value,
  onChange,
  name = "product_id",
  label = "Exact product",
}: {
  data: Catalogue;
  value: string;
  onChange: (s: string) => void;
  name?: string;
  label?: string;
}) {
  return (
    <SelectField
      name={name}
      label={label}
      value={value}
      onChange={onChange}
      options={data.items.map((p) => ({
        id: p.id,
        display_name: `${p.content.title} · ${p.content.model} / ${p.content.variant} · ${p.reference}`,
      }))}
    />
  );
}
export function SelectedProduct({
  children,
  retainRevision = false,
}: {
  children: (detail: Detail, reload: () => void) => React.ReactNode;
  retainRevision?: boolean;
}) {
  const params = useSearchParams(),
    selected = params.get("product_id") ?? "",
    revision = retainRevision ? params.get("revision_id") : null,
    catalogue = useCatalogue();
  const detail = useCrmResource<Detail>(
    selected
      ? `products/${selected}${revision ? `?revision_id=${revision}` : ""}`
      : null,
    true,
  );
  return (
    <>
      <ResourceState resource={catalogue} />
      {catalogue.data && (
        <form className="pd-panel" action="">
          <ProductChoice
            data={catalogue.data}
            value={selected}
            onChange={(v) => {
              window.location.assign(
                `${window.location.pathname}?product_id=${v}`,
              );
            }}
          />
          <noscript>
            <Button type="submit">Open</Button>
          </noscript>
        </form>
      )}
      {!selected && (
        <p>
          Choose an exact product to inspect its current catalogue and technical
          revisions.
        </p>
      )}
      <ResourceState resource={detail} />
      {detail.data && !detail.error && children(detail.data, detail.reload)}
    </>
  );
}
export function ProductContext({ detail }: { detail: Detail }) {
  const { product: p, revision: r } = detail;
  return (
    <section className="pd-panel">
      <div className="pd-record-heading">
        <div>
          <p className="pd-eyebrow">
            {p.kind} · {p.reference}
          </p>
          <h2>{r.content.title}</h2>
          <p>
            {r.content.manufacturer} · {r.content.model} / {r.content.variant}
          </p>
        </div>
        <span className="pd-status">{detail.selected_state}</span>
      </div>
      <dl className="pd-facts">
        <div>
          <dt>Catalogue revision</dt>
          <dd>r{r.revision}</dd>
        </div>
        <div>
          <dt>Technical revision</dt>
          <dd>{r.content.technical_revision}</dd>
        </div>
        <div>
          <dt>Source revision / as at</dt>
          <dd>
            {r.content.source_revision} · {r.content.source_date}
          </dd>
        </div>
        <div>
          <dt>Source identity</dt>
          <dd>
            {p.provider} / {p.entity_key}
          </dd>
        </div>
      </dl>
      <details className="pd-muted">
        <summary>Source and internal identifiers</summary>
        <p>
          Product {p.id} · Revision {r.id} · Company {p.company_id}
        </p>
        <p>Demonstration alias; no adopted production numbering prefix.</p>
      </details>
    </section>
  );
}
function shown(value: unknown): string {
  return value === null
    ? "Unknown / no previous value"
    : typeof value === "object"
      ? JSON.stringify(value, null, 2)
      : String(value);
}
export function Comparison({
  changes,
}: {
  changes: { field: string; before: unknown; after: unknown }[];
}) {
  return (
    <section className="pd-panel">
      <h2>Exact predecessor comparison</h2>
      {changes.length ? (
        changes.map((c) => (
          <article className="pd-change" key={c.field}>
            <h3>{c.field.replaceAll("_", " ")}</h3>
            <div>
              <section>
                <h4>Before</h4>
                <pre>{shown(c.before)}</pre>
              </section>
              <section>
                <h4>After</h4>
                <pre>{shown(c.after)}</pre>
              </section>
            </div>
          </article>
        ))
      ) : (
        <p>No changed content.</p>
      )}
    </section>
  );
}
export function TechnicalContent({ content: c }: { content: Content }) {
  return (
    <>
      <section className="pd-panel">
        <h2>Technical attributes</h2>
        <p>{c.description}</p>
        {!c.attributes.length && (
          <p>No technical attributes recorded. Suitability remains unknown.</p>
        )}
        <div className="pd-cards">
          {c.attributes.map((a) => (
            <article key={a.key}>
              <h3>{a.key}</h3>
              <p className="pd-value">
                {a.value ?? "Unknown"} {a.unit}
              </p>
              <p>
                {a.status} · {a.evidence}
              </p>
              {a.clarification_owner && (
                <p>Clarification owner: {a.clarification_owner}</p>
              )}
            </article>
          ))}
        </div>
      </section>
      <section className="pd-panel">
        <h2>Controlled document references</h2>
        {!c.documents.length && <p>No controlled documents recorded.</p>}
        {c.documents.map((d, i) => (
          <article className="pd-document" key={i}>
            <h3>{d.title}</h3>
            <p>
              {d.type} · revision {d.revision} · {d.applicability}
            </p>
            <p>{d.basis}</p>
            <p>
              {d.provider} / {d.entity_key} · Source date {d.source_date}
            </p>
          </article>
        ))}
      </section>
      <section className="pd-panel">
        <h2>Lifecycle and support</h2>
        <p>
          {c.lifecycle} · {c.lifecycle_evidence}
        </p>
        <p>Support through: {c.support_until ?? "Unknown"}</p>
        <p>
          Retirement and named replacements retain original historical
          identities. Installed impact requires Equipment review.
        </p>
      </section>
    </>
  );
}
export function ReasonField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const id = useId();
  return (
    <Field
      name={`reason-${id}`}
      validationField="reason"
      label="Reason and evidence basis"
      value={value}
      onChange={onChange}
      required
      maxLength={1000}
    />
  );
}
export function RecoveryAction({
  label,
  path,
  id,
  fields,
  target,
  onSaved,
}: {
  label: string;
  path: string;
  id: string;
  fields: Record<string, unknown>;
  target: string;
  onSaved?: () => void;
}) {
  const command = useProductCommand(`${id}:${path}`),
    [reason, setReason] = useState("");
  return (
    <form
      className="pd-panel"
      onSubmit={async (e) => {
        e.preventDefault();
        const receipt = await command.send(
          path,
          { ...fields, reason },
          target,
          label,
          id,
        );
        if (receipt) onSaved?.();
      }}
    >
      <h3>{label}</h3>
      <ReasonField value={reason} onChange={setReason} />
      <CommandOutcome command={command} />
      <Button
        type="submit"
        disabled={!command.ready || command.busy || !!command.pending}
      >
        {label}
      </Button>
    </form>
  );
}
