"use client";
import Link from "next/link";
import { useState } from "react";
import { Field, SelectField } from "../../components/business-ui";
import { Button } from "../../components/ui/button";
import { useCrmResource } from "../../components/crm-state";
import type { readProductUses, previewProductUse } from "../uses";
import { RecoveryAction, ResourceState, options } from "./shared";
export function ProductUses({ id }: { id: string }) {
  const resource = useCrmResource<Awaited<ReturnType<typeof readProductUses>>>(
      `products/${id}/uses`,
      true,
    ),
    [kind, setKind] = useState("Asset"),
    [target, setTarget] = useState(""),
    [evidence, setEvidence] = useState(""),
    [query, setQuery] = useState("");
  const preview = useCrmResource<Awaited<ReturnType<typeof previewProductUse>>>(
    query ? `products/${id}/uses/preview?${query}` : null,
    true,
  );
  return (
    <section className="pd-panel">
      <h2>Exact downstream-use references</h2>
      <ResourceState resource={resource} />
      {resource.data && (
        <>
          <p>{resource.data.scope}</p>
          {resource.data.items.length === 0 && (
            <p>
              No permitted explicitly linked uses in this view. This does not
              establish no impact.
            </p>
          )}
          {resource.data.items.map((u) => (
            <article className="pd-document" key={u.id}>
              <h3>
                <Link href={u.snapshot.href}>
                  {u.snapshot.domain}: {u.snapshot.label}
                </Link>
              </h3>
              <p>
                Retained Product revision {u.product_revision_id} · Owning
                record version {u.target_version} · {u.currentness}
              </p>
              <p>{u.snapshot.evidence}</p>
              <p>{u.reason}</p>
            </article>
          ))}
          {resource.data.can_link && (
            <details>
              <summary>
                Link an exact observed Engineering or Equipment use
              </summary>
              <p>
                Open the owning record to obtain its UUID. Preview checks its
                actual scope and version. A reference creates no substitution or
                installation approval.
              </p>
              <SelectField
                name="use-kind"
                label="Owning record kind"
                value={kind}
                onChange={(v) => {
                  setKind(v);
                  setQuery("");
                }}
                options={options(["Asset", "MaterialLine"])}
              />
              <Field
                name="use-target"
                label="Exact owning-record UUID"
                value={target}
                onChange={(v) => {
                  setTarget(v);
                  setQuery("");
                }}
              />
              <Button
                onClick={() =>
                  setQuery(
                    new URLSearchParams({ kind, target_id: target }).toString(),
                  )
                }
              >
                Preview exact use context
              </Button>
              <ResourceState resource={preview} />
              {preview.data && (
                <>
                  <p>
                    {preview.data.target.label} · {preview.data.target.domain} ·
                    version {preview.data.target.version}
                  </p>
                  <Field
                    name="use-evidence"
                    label="Evidence linking this exact product to the observed use"
                    value={evidence}
                    onChange={setEvidence}
                  />
                  <RecoveryAction
                    label="Retain exact use reference"
                    id={id}
                    path={`products/${id}/uses`}
                    fields={{
                      expected_version: preview.data.product_version,
                      revision_id: preview.data.revision_id,
                      kind: preview.data.kind,
                      target_id: preview.data.target.id,
                      target_version: preview.data.target.version,
                      evidence,
                    }}
                    target={`/products/compatibility?product_id=${id}`}
                    onSaved={resource.reload}
                  />
                </>
              )}
            </details>
          )}
        </>
      )}
    </section>
  );
}
