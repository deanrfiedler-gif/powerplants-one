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
import type { RelationshipContent } from "../model";
import type { listRelationships } from "../relationships";
import { ProductUses } from "./uses";
import {
  CommandOutcome,
  ProductChoice,
  ProductsFrame,
  ReasonField,
  RecoveryAction,
  ResourceState,
  TechnicalContent,
  options,
  useCatalogue,
  useProductCommand,
  type Catalogue,
  type Detail,
} from "./shared";

function RelationshipForm({
  catalogue,
  selected,
}: {
  catalogue: Catalogue;
  selected: string;
}) {
  const [from, setFrom] = useState(selected),
    [to, setTo] = useState(""),
    [fromRevision, setFromRevision] = useState(""),
    [toRevision, setToRevision] = useState(""),
    [predecessor, setPredecessor] = useState("");
  const original = useCrmResource<Detail>(
      from ? `products/${from}` : null,
      true,
    ),
    candidate = useCrmResource<Detail>(to ? `products/${to}` : null, true);
  const [id] = useState(() => crypto.randomUUID()),
    [reason, setReason] = useState(""),
    [dirty, setDirty] = useState(false),
    command = useProductCommand("relationship-create");
  const [content, setContent] = useState<RelationshipContent>({
    purpose: "",
    type: "CandidateReplacement",
    evidence: "",
    source_revision: "",
    source_date: "",
    conditions: "",
    limitations: "",
    criteria: [
      {
        criterion: "Interface / application",
        outcome: "Unknown",
        evidence: "",
        owner: "",
      },
    ],
    affected_use: "",
    handover: "Both",
  });
  const update = (patch: Partial<RelationshipContent>) =>
    setContent({ ...content, ...patch });
  useUnsavedChanges(dirty, command.busy || !!command.pending);
  return (
    <form
      className="pd-panel"
      onChange={() => setDirty(true)}
      onSubmit={async (e) => {
        e.preventDefault();
        if (
          await command.send(
            "products/relationships",
            {
              id,
              from: { product_id: from, revision_id: fromRevision },
              to: { product_id: to, revision_id: toRevision },
              predecessor_id: predecessor || null,
              content,
              reason,
            },
            "/products/compatibility",
            "Relationship evidence",
            id,
          )
        )
          setDirty(false);
      }}
    >
      <h2>Record product-level evidence</h2>
      <p>
        A supplier-nominated successor remains a candidate. This record cannot
        release an Engineering substitution or alter an installed Asset.
      </p>
      <CommandOutcome command={command} />
      <ValidationFields error={command.error}>
        <fieldset
          disabled={!command.ready || command.busy || !!command.pending}
        >
          <legend>Exact product comparison</legend>
          <div className="pd-form-grid">
            <ProductChoice
              data={catalogue}
              name="from_product"
              label="Original product"
              value={from}
              onChange={(v) => {
                setFrom(v);
                setFromRevision("");
              }}
            />
            <ProductChoice
              data={catalogue}
              name="to_product"
              label="Candidate product"
              value={to}
              onChange={(v) => {
                setTo(v);
                setToRevision("");
              }}
            />
          </div>
          <ResourceState resource={original} />
          <ResourceState resource={candidate} />
          <div className="pd-form-grid">
            {original.data && (
              <SelectField
                name="from_revision"
                label="Original exact catalogue revision"
                value={fromRevision}
                onChange={setFromRevision}
                options={original.data.revisions.map((r) => ({
                  id: r.id,
                  display_name: `r${r.revision} · technical ${r.content.technical_revision}`,
                }))}
                required
              />
            )}
            {candidate.data && (
              <SelectField
                name="to_revision"
                label="Candidate exact catalogue revision"
                value={toRevision}
                onChange={setToRevision}
                options={candidate.data.revisions.map((r) => ({
                  id: r.id,
                  display_name: `r${r.revision} · technical ${r.content.technical_revision}`,
                }))}
                required
              />
            )}
            <SelectField
              name="relationship-type"
              label="Relationship purpose/type"
              value={content.type}
              onChange={(v) =>
                update({ type: v as RelationshipContent["type"] })
              }
              options={options(["CandidateReplacement", "Compatibility"])}
            />
            {(
              [
                "purpose",
                "evidence",
                "source_revision",
                "source_date",
                "conditions",
                "limitations",
                "affected_use",
              ] as const
            ).map((key) => (
              <Field
                key={key}
                name={`relationship-${key}`}
                label={key.replaceAll("_", " ")}
                value={content[key]}
                onChange={(v) => update({ [key]: v })}
                type={key === "source_date" ? "date" : "text"}
                required
                maxLength={1000}
              />
            ))}
            <SelectField
              name="handover"
              label="Owning-domain handover"
              value={content.handover}
              onChange={(v) =>
                update({ handover: v as RelationshipContent["handover"] })
              }
              options={options(["Engineering", "Equipment", "Both"])}
            />
            <Field
              name="predecessor_id"
              label="Prior relationship UUID (optional successor evidence)"
              value={predecessor}
              onChange={setPredecessor}
            />
          </div>
          {content.criteria.map((criterion, i) => {
            const change = (patch: Partial<typeof criterion>) =>
              update({
                criteria: content.criteria.map((c, n) =>
                  n === i ? { ...c, ...patch } : c,
                ),
              });
            return (
              <fieldset key={i}>
                <legend>Criterion {i + 1}</legend>
                <Field
                  name={`criterion-${i}`}
                  label={`Criterion ${i + 1} requirement`}
                  value={criterion.criterion}
                  onChange={(v) => change({ criterion: v })}
                  required
                />
                <SelectField
                  name={`criterion-outcome-${i}`}
                  label={`Criterion ${i + 1} evidence outcome`}
                  value={criterion.outcome}
                  onChange={(v) =>
                    change({ outcome: v as typeof criterion.outcome })
                  }
                  options={options(["Met", "NotMet", "Unknown"])}
                />
                <Field
                  name={`criterion-evidence-${i}`}
                  label={`Criterion ${i + 1} source evidence`}
                  value={criterion.evidence}
                  onChange={(v) => change({ evidence: v })}
                  required
                />
                <Field
                  name={`criterion-owner-${i}`}
                  label={`Criterion ${i + 1} clarification owner`}
                  value={criterion.owner}
                  onChange={(v) => change({ owner: v })}
                  required
                />
              </fieldset>
            );
          })}
          <Button
            type="button"
            variant="secondary"
            disabled={content.criteria.length >= 20}
            onClick={() =>
              update({
                criteria: [
                  ...content.criteria,
                  {
                    criterion: "",
                    outcome: "Unknown",
                    evidence: "",
                    owner: "",
                  },
                ],
              })
            }
          >
            Add interface criterion
          </Button>
          <ReasonField value={reason} onChange={setReason} />
          <Button type="submit">Save relationship evidence</Button>
        </fieldset>
      </ValidationFields>
    </form>
  );
}
export function CompatibilityPage() {
  const params = useSearchParams(),
    selected = params.get("product_id") ?? "",
    catalogue = useCatalogue(),
    relationships = useCrmResource<
      Awaited<ReturnType<typeof listRelationships>>
    >(
      `products/relationships${selected ? `?product_id=${selected}` : ""}`,
      true,
    );
  return (
    <ProductsFrame title="Compatibility, replacements and lifecycle">
      <p>
        Conclusions are bounded by exact source revisions, conditions and
        evidence. Unknown interfaces require owned clarification.
      </p>
      {selected && <ProductUses id={selected} />}
      <ResourceState resource={catalogue} />
      <ResourceState resource={relationships} />
      {catalogue.data &&
        catalogue.data.access.some((a) =>
          a.capabilities.includes("products.relationship.edit"),
        ) && (
          <details>
            <summary>
              Prepare compatibility or candidate-replacement evidence
            </summary>
            <RelationshipForm catalogue={catalogue.data} selected={selected} />
          </details>
        )}
      {relationships.data && !relationships.error && (
        <>
          {!relationships.data.items.length && (
            <p>
              No permitted relationship evidence for this selection.
              Compatibility is unknown.
            </p>
          )}
          {relationships.data.items.map((r) => (
            <article className="pd-panel" key={r.id}>
              <h2>
                {r.from_content.model} / {r.from_content.variant} →{" "}
                {r.to_content.model} / {r.to_content.variant}
              </h2>
              <p>
                {r.content.type} · {r.outcome ?? "Unreviewed"} ·{" "}
                {r.content.purpose}
              </p>
              <p>
                Original r{r.from_revision} / technical{" "}
                {r.from_content.technical_revision}; candidate r{r.to_revision}{" "}
                / technical {r.to_content.technical_revision}.
              </p>
              <div className="pd-actions">
                <Link
                  href={`/products/${r.from_product_id}?revision_id=${r.from_revision_id}`}
                >
                  Exact original revision
                </Link>
                <Link
                  href={`/products/${r.to_product_id}?revision_id=${r.to_revision_id}`}
                >
                  Exact candidate revision
                </Link>
              </div>
              <p>
                Source {r.content.source_revision} · {r.content.source_date} ·{" "}
                {r.content.evidence}
              </p>
              <p>
                <strong>Conditions:</strong> {r.content.conditions}
              </p>
              <p>
                <strong>Limitations:</strong> {r.content.limitations}
              </p>
              {r.content.criteria.map((c, i) => (
                <section className="pd-issue" key={i}>
                  <h3>
                    {c.criterion}: {c.outcome}
                  </h3>
                  <p>
                    {c.evidence} · Owner {c.owner}
                  </p>
                </section>
              ))}
              <p>Affected-use evidence: {r.content.affected_use}</p>
              <p>
                Owning domain: {r.content.handover}. Original saved/installed
                identities remain unchanged.
              </p>
              <div className="pd-actions">
                <Link href="/engineering/materials">
                  Engineering materials / substitutions
                </Link>
                <Link href="/engineering/changes">
                  Engineering change impact
                </Link>
                <Link href="/equipment/lifecycle">
                  Installed equipment lifecycle
                </Link>
                <Link href="/equipment/bulletins">Equipment bulletins</Link>
              </div>
              {r.reviewer && (
                <p>
                  Reviewer {r.reviewer} · {r.review_reason}
                </p>
              )}
              {r.predecessor_id && (
                <p>Retained predecessor relationship {r.predecessor_id}</p>
              )}
              <details>
                <summary>Compare technical source content</summary>
                <div className="pd-form-grid">
                  <div>
                    <h3>Original</h3>
                    <TechnicalContent content={r.from_content} />
                  </div>
                  <div>
                    <h3>Candidate</h3>
                    <TechnicalContent content={r.to_content} />
                  </div>
                </div>
              </details>
              {r.can_review && (
                <div className="pd-cards">
                  {["Conditional", "Unresolved", "Rejected"].map((outcome) => (
                    <RecoveryAction
                      key={outcome}
                      label={`Record ${outcome.toLowerCase()} conclusion`}
                      id={r.id}
                      path={`products/relationships/${r.id}/review`}
                      fields={{
                        expected_version: r.version,
                        content_hash: r.content_hash,
                        outcome,
                      }}
                      target="/products/compatibility"
                      onSaved={relationships.reload}
                    />
                  ))}
                </div>
              )}
              <p className="pd-muted">
                Relationship identity {r.id}. A reviewed candidate remains
                subject to separate application suitability and installed-impact
                review.
              </p>
            </article>
          ))}
        </>
      )}
    </ProductsFrame>
  );
}
