"use client";
import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Field,
  SelectField,
  ValidationFields,
} from "../../components/business-ui";
import { useCrmResource } from "../../components/crm-state";
import { Button } from "../../components/ui/button";
import { useUnsavedChanges } from "../../components/record-ui";
import type { listImports, readImport, Mapping } from "../imports";
import {
  CommandOutcome,
  Comparison,
  ProductChoice,
  ProductsFrame,
  ReasonField,
  RecoveryAction,
  ResourceState,
  options,
  useCatalogue,
  useProductCommand,
  type Catalogue,
} from "./shared";

function StageForm({ catalogue }: { catalogue: Catalogue }) {
  const [id] = useState(() => crypto.randomUUID()),
    [company, setCompany] = useState(catalogue.companies[0]?.id ?? ""),
    [filename, setFilename] = useState("synthetic-catalogue.json"),
    [description, setDescription] = useState(""),
    [provider, setProvider] = useState("Synthetic catalogue"),
    [time, setTime] = useState(""),
    [raw, setRaw] = useState(
      '{"format":"PPO synthetic catalogue 1","rows":[]}',
    ),
    [reason, setReason] = useState(""),
    [dirty, setDirty] = useState(false),
    [fileError, setFileError] = useState("");
  const command = useProductCommand("import-stage");
  useUnsavedChanges(dirty, command.busy || !!command.pending);
  return (
    <form
      className="pd-panel"
      onChange={() => setDirty(true)}
      onSubmit={async (e) => {
        e.preventDefault();
        if (
          await command.send(
            "products/imports",
            {
              id,
              company_id: company,
              filename,
              source_description: description,
              provider,
              source_time: time || null,
              raw_content: raw,
              reason,
            },
            `/products/import?batch_id=${id}`,
            "Import source",
            id,
          )
        )
          setDirty(false);
      }}
    >
      <h2>1. Stage synthetic source</h2>
      <p>
        Bounded JSON format: PPO synthetic catalogue 1, up to 50 rows and 12,000
        bytes. Each row supplies external_key, kind, parent_id, reference and
        content. Production catalogue formats are Not configured.
      </p>
      <Link href="/products/import-format.json" download>
        Download synthetic format example
      </Link>
      <CommandOutcome command={command} />
      <ValidationFields error={command.error}>
        <fieldset
          disabled={!command.ready || command.busy || !!command.pending}
        >
          <legend>Source provenance</legend>
          <SelectField
            name="company_id"
            label="Import company"
            value={company}
            onChange={setCompany}
            options={catalogue.companies.filter((c) =>
              catalogue.access
                .find((a) => a.company_id === c.id)
                ?.capabilities.includes("products.import.stage"),
            )}
          />
          <div className="pd-form-grid">
            <Field
              name="filename"
              label="Source filename"
              value={filename}
              onChange={setFilename}
              required
            />
            <Field
              name="source_description"
              label="Source description"
              value={description}
              onChange={setDescription}
              required
            />
            <Field
              name="provider"
              label="Source provider"
              value={provider}
              onChange={setProvider}
              required
            />
            <Field
              name="source_time"
              label="Observed/source UTC time (optional ISO instant)"
              value={time}
              onChange={setTime}
            />
          </div>
          <label htmlFor="source-file">Choose synthetic JSON file</label>
          <input
            id="source-file"
            type="file"
            accept=".json,application/json"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 12000) {
                setFileError("The synthetic source exceeds 12,000 bytes.");
                return;
              }
              setFileError("");
              setFilename(file.name);
              setRaw(await file.text());
              setDirty(true);
            }}
          />
          {fileError && <p role="alert">{fileError}</p>}
          <Field
            name="raw_content"
            label="Original JSON source evidence"
            value={raw}
            onChange={setRaw}
            multiline
            maxLength={12000}
            required
          />
          <ReasonField value={reason} onChange={setReason} />
          <Button type="submit">Stage source for mapping</Button>
        </fieldset>
      </ValidationFields>
    </form>
  );
}
type ImportDetail = Awaited<ReturnType<typeof readImport>>;
function MappingForm({
  detail,
  catalogue,
}: {
  detail: ImportDetail;
  catalogue: Catalogue;
}) {
  const [baseline] = useState(detail.batch.version),
    [decisions, setDecisions] = useState<Mapping[]>(
      detail.rows.flatMap((r) => (r.mapping ? [r.mapping] : [])),
    ),
    [reason, setReason] = useState(""),
    [dirty, setDirty] = useState(false),
    command = useProductCommand(`import-map:${detail.batch.id}`);
  useUnsavedChanges(dirty, command.busy || !!command.pending);
  function update(row: number, patch: Partial<Mapping>) {
    setDirty(true);
    const old = decisions.find((r) => r.row_number === row) ?? {
      row_number: row,
      action: "Resolve" as const,
      target_id: null,
      reason: "",
    };
    setDecisions([
      ...decisions.filter((r) => r.row_number !== row),
      { ...old, ...patch },
    ]);
  }
  return (
    <form
      className="pd-panel"
      onSubmit={async (e) => {
        e.preventDefault();
        if (
          await command.send(
            `products/imports/${detail.batch.id}/map`,
            { expected_version: baseline, mappings: decisions, reason },
            `/products/import?batch_id=${detail.batch.id}`,
            "Mapping comparison",
            detail.batch.id,
          )
        )
          setDirty(false);
      }}
    >
      <h2>2–4. Mapping, validation and exceptions</h2>
      <p>
        Choose exact identity, explicitly propose a new record, or exclude with
        a reason. Name similarity never merges products.
      </p>
      {baseline !== detail.batch.version && (
        <p role="alert">
          The batch changed. Entered mapping remains here; reopen the saved
          batch to compare before replacing it.
        </p>
      )}
      <CommandOutcome command={command} />
      <fieldset disabled={!command.ready || command.busy || !!command.pending}>
        <legend>Original source rows</legend>
        {detail.rows.map((r) => {
          const m = decisions.find((x) => x.row_number === r.row_number);
          return (
            <section className="pd-panel" key={r.row_number}>
              <h3>
                Row {r.row_number} ·{" "}
                {r.external_key ?? "Invalid / unknown identity"}
              </h3>
              <details>
                <summary>Original raw values</summary>
                <pre>{JSON.stringify(r.raw, null, 2)}</pre>
              </details>
              <SelectField
                name={`mapping-action-${r.row_number}`}
                label={`Row ${r.row_number} disposition`}
                value={m?.action ?? ""}
                onChange={(v) =>
                  update(r.row_number, {
                    action: v as Mapping["action"],
                    target_id: null,
                  })
                }
                options={options(["Resolve", "New", "Exclude"])}
              />
              {m?.action === "Resolve" && (
                <ProductChoice
                  data={{
                    ...catalogue,
                    items: catalogue.items.filter(
                      (p) => p.company_id === detail.batch.company_id,
                    ),
                  }}
                  name={`mapping-target-${r.row_number}`}
                  label={`Row ${r.row_number} exact target identity`}
                  value={m.target_id ?? ""}
                  onChange={(v) =>
                    update(r.row_number, { target_id: v || null })
                  }
                />
              )}
              <Field
                name={`mapping-reason-${r.row_number}`}
                label={`Row ${r.row_number} mapping rationale`}
                value={m?.reason ?? ""}
                onChange={(v) => update(r.row_number, { reason: v })}
                required
              />
              <ul>
                {r.errors.map((err, i) => (
                  <li className="pd-issue" key={i}>
                    {err}
                  </li>
                ))}
                {r.warnings.map((warning, i) => (
                  <li key={`w${i}`}>{warning}</li>
                ))}
              </ul>
              {r.duplicate_candidates.length > 0 && (
                <>
                  <h4>Similarity evidence — separate identities</h4>
                  {r.duplicate_candidates.map((c) => (
                    <p key={c.id}>
                      {c.reference} · {c.model} / {c.variant} · {c.id}
                    </p>
                  ))}
                </>
              )}
            </section>
          );
        })}
        <ReasonField value={reason} onChange={setReason} />
        <Button type="submit">Save mapping and exact comparison</Button>
      </fieldset>
    </form>
  );
}
function ImportRecord({ id, catalogue }: { id: string; catalogue: Catalogue }) {
  const resource = useCrmResource<ImportDetail>(`products/imports/${id}`, true),
    d = resource.data;
  return (
    <>
      <ResourceState resource={resource} />
      {d && !resource.error && (
        <>
          <section className="pd-panel">
            <h2>{d.batch.filename}</h2>
            <p>
              {d.batch.state} · batch version {d.batch.version} · {d.batch.id}
            </p>
            <p>
              {d.batch.source_description} · Provider {d.batch.provider} ·
              Company {d.batch.company_id}
            </p>
            <p>
              Source observed{" "}
              {d.batch.source_time ? String(d.batch.source_time) : "Unknown"} ·
              Staged {String(d.batch.created_at)}
            </p>
            <p>Content SHA-256 {d.batch.content_hash}</p>
          </section>
          {d.can_map && (
            <MappingForm key={id} detail={d} catalogue={catalogue} />
          )}
          <section className="pd-panel">
            <h2>5. Exact proposed change set</h2>
            {!d.current ? (
              <p>Save a mapping preview before review.</p>
            ) : (
              <>
                <p>
                  Plan {d.current.id} · comparison SHA-256{" "}
                  {d.current.comparison_hash}
                </p>
                {d.rows.map((r) => (
                  <section key={r.row_number}>
                    <h3>
                      Row {r.row_number}: {r.mapping?.action ?? "Unresolved"}
                    </h3>
                    <p>
                      Target {r.target_id ?? r.proposed_id} · predecessor{" "}
                      {r.target_revision_id ?? "New record"} · expected version{" "}
                      {r.expected_version ?? "New"}
                    </p>
                    {r.errors.map((e, i) => (
                      <p key={i} className="pd-issue">
                        {e}
                      </p>
                    ))}
                    {r.warnings.map((e, i) => (
                      <p key={`w${i}`}>{e}</p>
                    ))}
                    {r.mapping?.action !== "Exclude" && (
                      <Comparison changes={r.changes} />
                    )}
                  </section>
                ))}
              </>
            )}
          </section>
          {d.current && d.can_review && (
            <div className="pd-cards">
              {["Reviewed", "Returned"].map((action) => (
                <RecoveryAction
                  key={action}
                  label={
                    action === "Reviewed"
                      ? "Review exact import plan"
                      : "Return import plan"
                  }
                  id={id}
                  path={`products/imports/${id}/review`}
                  fields={{
                    expected_version: d.batch.version,
                    plan_id: d.current!.id,
                    comparison_hash: d.current!.comparison_hash,
                    action,
                  }}
                  target={`/products/import?batch_id=${id}`}
                  onSaved={resource.reload}
                />
              ))}
            </div>
          )}
          {d.current && d.can_apply && (
            <section className="pd-panel">
              <h2>6. Controlled application</h2>
              <p>
                Creates new drafts or draft successors atomically. It never
                publishes or edits a published revision.
              </p>
              <RecoveryAction
                label="Apply exact reviewed change set"
                id={id}
                path={`products/imports/${id}/review`}
                fields={{
                  expected_version: d.batch.version,
                  plan_id: d.current.id,
                  comparison_hash: d.current.comparison_hash,
                  action: "Apply",
                }}
                target={`/products/import?batch_id=${id}`}
                onSaved={resource.reload}
              />
            </section>
          )}
          <section className="pd-panel">
            <h2>7. Result, recovery and retained history</h2>
            {d.history.map((e) => (
              <article className="pd-document" key={e.id}>
                <h3>{e.action}</h3>
                <p>
                  {e.reason} · Actor {e.created_by} · {String(e.created_at)}
                </p>
                <p>
                  Original operation {e.operation_id} · Exact plan{" "}
                  {e.plan_id ?? "Source only"}
                </p>
                {e.result?.map((r) => (
                  <p key={r.row_number}>
                    Row {r.row_number}:{" "}
                    <Link
                      href={`/products/${r.product_id}?revision_id=${r.revision_id}`}
                    >
                      Open exact resulting draft
                    </Link>
                  </p>
                ))}
              </article>
            ))}
            <details>
              <summary>
                Retained mapping plan history ({d.plans.length})
              </summary>
              {d.plans.map((plan) => (
                <section key={plan.id}>
                  <h3>{plan.id}</h3>
                  <p>
                    {plan.comparison_hash} · Author {plan.created_by}
                  </p>
                  {plan.rows.map((r) => (
                    <details key={r.row_number}>
                      <summary>
                        Row {r.row_number} · {r.mapping?.action ?? "Unresolved"}
                      </summary>
                      <Comparison changes={r.changes} />
                    </details>
                  ))}
                </section>
              ))}
            </details>
          </section>
        </>
      )}
    </>
  );
}
export function ImportPage() {
  const params = useSearchParams(),
    id = params.get("batch_id"),
    catalogue = useCatalogue(),
    batches = useCrmResource<Awaited<ReturnType<typeof listImports>>>(
      "products/imports",
      true,
    );
  return (
    <ProductsFrame title="Catalogue import and exception review">
      <ResourceState resource={catalogue} />
      <ResourceState resource={batches} />
      {id && catalogue.data ? (
        <ImportRecord id={id} catalogue={catalogue.data} />
      ) : (
        <>
          {catalogue.data &&
            catalogue.data.access.some((a) =>
              a.capabilities.includes("products.import.stage"),
            ) && <StageForm catalogue={catalogue.data} />}
          <section className="pd-panel">
            <h2>Staged source history</h2>
            {batches.data?.items.length === 0 && (
              <p>No permitted import batches.</p>
            )}
            {batches.data?.items.map((b) => (
              <p key={b.id}>
                <Link href={`/products/import?batch_id=${b.id}`}>
                  {b.filename}
                </Link>{" "}
                · {b.state} · {b.content_hash}
              </p>
            ))}
          </section>
        </>
      )}
    </ProductsFrame>
  );
}
