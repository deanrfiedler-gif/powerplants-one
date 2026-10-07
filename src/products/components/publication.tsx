"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Field,
  SelectField,
  ValidationFields,
} from "../../components/business-ui";
import { Button } from "../../components/ui/button";
import { useUnsavedChanges } from "../../components/record-ui";
import type { Attribute, Content, DocumentReference, Product } from "../model";
import {
  CommandOutcome,
  Comparison,
  ProductContext,
  ProductsFrame,
  ReasonField,
  RecoveryAction,
  ResourceState,
  SelectedProduct,
  options,
  useCatalogue,
  useProductCommand,
  type Catalogue,
  type Detail,
} from "./shared";

export const emptyContent: Content = {
  title: "",
  manufacturer: "",
  model: "",
  variant: "",
  technical_revision: "",
  source_reference: "",
  source_revision: "",
  source_date: "",
  description: "",
  unit: "each",
  attributes: [],
  documents: [],
  lifecycle: "Unknown",
  lifecycle_evidence: "",
  support_until: null,
  data_mode: "Synthetic",
};
export function ContentFields({
  content,
  onChange,
}: {
  content: Content;
  onChange: (v: Content) => void;
}) {
  const field = (key: keyof Content, value: unknown) =>
    onChange({ ...content, [key]: value });
  const unitByKey = {
    voltage: "V",
    power: "kW",
    flow: "L/min",
    pressure: "kPa",
    length: "mm",
    mass: "kg",
    interface: "text",
  };
  return (
    <>
      <div className="pd-form-grid">
        {(
          [
            ["title", "Display label"],
            ["manufacturer", "Manufacturer / source identity"],
            ["model", "Model context"],
            ["variant", "Variant context"],
            ["technical_revision", "Explicit technical revision"],
            ["source_reference", "Source evidence reference"],
            ["source_revision", "Source revision"],
            ["source_date", "Source as-at date"],
            ["description", "Technical description"],
            ["lifecycle_evidence", "Lifecycle / support evidence"],
          ] as const
        ).map(([key, label]) => (
          <Field
            key={key}
            name={key}
            label={label}
            value={content[key]}
            onChange={(v) => field(key, v)}
            type={key === "source_date" ? "date" : "text"}
            required
            maxLength={key === "description" ? 2000 : 1000}
          />
        ))}
        <SelectField
          name="unit"
          label="Product unit"
          value={content.unit}
          onChange={(v) => field("unit", v)}
          options={options(["each", "m", "kg"])}
        />
        <SelectField
          name="lifecycle"
          label="Lifecycle evidence conclusion"
          value={content.lifecycle}
          onChange={(v) => field("lifecycle", v)}
          options={options(["Unknown", "Supported", "Discontinued", "Retired"])}
        />
        <Field
          name="support_until"
          label="Known support end (blank means unknown)"
          type="date"
          value={content.support_until ?? ""}
          onChange={(v) => field("support_until", v || null)}
        />
      </div>
      <h3>Typed attributes and explicit units</h3>
      {content.attributes.map((a, index) => {
        const update = (patch: Partial<Attribute>) =>
          field(
            "attributes",
            content.attributes.map((x, i) =>
              i === index ? { ...x, ...patch } : x,
            ),
          );
        return (
          <fieldset key={index}>
            <legend>Attribute {index + 1}</legend>
            <div className="pd-form-grid">
              <SelectField
                name={`attribute-key-${index}`}
                label={`Attribute ${index + 1} type`}
                value={a.key}
                onChange={(v) =>
                  update({
                    key: v as Attribute["key"],
                    unit: unitByKey[v as Attribute["key"]],
                  })
                }
                options={options(Object.keys(unitByKey))}
              />
              <Field
                name={`attribute-value-${index}`}
                label={`Attribute ${index + 1} value (${a.unit}; blank means unknown)`}
                value={a.value ?? ""}
                onChange={(v) => update({ value: v || null })}
              />
              <SelectField
                name={`attribute-status-${index}`}
                label={`Attribute ${index + 1} evidence state`}
                value={a.status}
                onChange={(v) => update({ status: v as Attribute["status"] })}
                options={options(["SourceReported", "Reviewed", "Unresolved"])}
              />
              <Field
                name={`attribute-evidence-${index}`}
                label={`Attribute ${index + 1} evidence`}
                value={a.evidence}
                onChange={(v) => update({ evidence: v })}
                required
              />
              <Field
                name={`attribute-owner-${index}`}
                label={`Attribute ${index + 1} clarification owner`}
                value={a.clarification_owner ?? ""}
                onChange={(v) => update({ clarification_owner: v || null })}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                field(
                  "attributes",
                  content.attributes.filter((_, i) => i !== index),
                )
              }
            >
              Remove attribute {index + 1}
            </Button>
          </fieldset>
        );
      })}
      <Button
        type="button"
        variant="secondary"
        disabled={content.attributes.length >= 20}
        onClick={() =>
          field("attributes", [
            ...content.attributes,
            {
              key: "interface",
              unit: "text",
              value: null,
              status: "Unresolved",
              evidence: "",
              clarification_owner: "",
            },
          ])
        }
      >
        Add technical attribute
      </Button>
      <h3>Controlled document applicability</h3>
      {content.documents.map((d, index) => {
        const update = (patch: Partial<DocumentReference>) =>
          field(
            "documents",
            content.documents.map((x, i) =>
              i === index ? { ...x, ...patch } : x,
            ),
          );
        return (
          <fieldset key={index}>
            <legend>Document {index + 1}</legend>
            <div className="pd-form-grid">
              {(
                [
                  "title",
                  "provider",
                  "entity_key",
                  "revision",
                  "type",
                  "basis",
                  "source_date",
                ] as const
              ).map((key) => (
                <Field
                  key={key}
                  name={`document-${key}-${index}`}
                  label={`Document ${index + 1} ${key.replaceAll("_", " ")}`}
                  value={d[key]}
                  onChange={(v) => update({ [key]: v })}
                  type={key === "source_date" ? "date" : "text"}
                  required
                />
              ))}
              <SelectField
                name={`document-applicability-${index}`}
                label={`Document ${index + 1} applicability`}
                value={d.applicability}
                onChange={(v) =>
                  update({
                    applicability: v as DocumentReference["applicability"],
                  })
                }
                options={options(["Applicable", "NotApplicable", "Unresolved"])}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                field(
                  "documents",
                  content.documents.filter((_, i) => i !== index),
                )
              }
            >
              Remove document {index + 1}
            </Button>
          </fieldset>
        );
      })}
      <Button
        type="button"
        variant="secondary"
        disabled={content.documents.length >= 20}
        onClick={() =>
          field("documents", [
            ...content.documents,
            {
              provider: "Synthetic reference",
              entity_key: "",
              revision: "",
              title: "",
              type: "PDF",
              applicability: "Unresolved",
              basis: "",
              source_date: "",
            },
          ])
        }
      >
        Add controlled document
      </Button>
    </>
  );
}
function ProductEditor({
  detail,
  catalogue,
}: {
  detail?: Detail;
  catalogue?: Catalogue;
}) {
  const [content, setContent] = useState(
      detail?.revision.content ?? emptyContent,
    ),
    [reason, setReason] = useState(""),
    [dirty, setDirty] = useState(false);
  const [baseline, setBaseline] = useState(detail),
    [id] = useState(() => detail?.product.id ?? crypto.randomUUID());
  const [company, setCompany] = useState(catalogue?.companies[0]?.id ?? ""),
    [reference, setReference] = useState(""),
    [kind, setKind] = useState<Product["kind"]>("Family"),
    [parent, setParent] = useState(""),
    [provider, setProvider] = useState("Synthetic catalogue"),
    [entity, setEntity] = useState("");
  const command = useProductCommand(`author:${id}`),
    locked = !command.ready || command.busy || !!command.pending;
  useUnsavedChanges(dirty, command.busy || !!command.pending);
  const changes = (Object.keys(content) as (keyof Content)[])
    .filter(
      (k) =>
        JSON.stringify(baseline?.revision.content[k]) !==
        JSON.stringify(content[k]),
    )
    .map((field) => ({
      field,
      before: baseline?.revision.content[field] ?? null,
      after: content[field],
    }));
  return (
    <form
      className="pd-panel"
      onChange={() => setDirty(true)}
      onSubmit={async (e) => {
        e.preventDefault();
        const receipt = await command.send(
          detail ? `products/${id}` : "products",
          detail
            ? { expected_version: baseline!.product.version, content, reason }
            : {
                id,
                company_id: company,
                reference,
                kind,
                parent_id: parent || null,
                provider,
                entity_key: entity,
                content,
                reason,
              },
          `/products/${id}`,
          "Catalogue draft",
          id,
        );
        if (receipt) setDirty(false);
      }}
    >
      <h2>
        {detail ? "Prepare a draft successor" : "Create a catalogue draft"}
      </h2>
      <p>
        Each save retains a new immutable content revision. Technical revision
        is explicit source provenance; it is not automatically incremented.
      </p>
      {detail && baseline?.product.version !== detail.product.version && (
        <aside className="pd-issue">
          <p>
            The server record changed. Your entered content is retained. Compare
            the current record before replacing it.
          </p>
          <Link href={`/products/${id}`} target="_blank">
            Inspect current record
          </Link>
          <Button
            type="button"
            onClick={() => {
              setContent(detail.revision.content);
              setBaseline(detail);
              setDirty(false);
            }}
          >
            Replace inputs with current revision
          </Button>
        </aside>
      )}
      <CommandOutcome command={command} />
      <ValidationFields error={command.error}>
        <fieldset disabled={locked}>
          <legend>Draft content</legend>
          {!detail && catalogue && (
            <div className="pd-form-grid">
              <SelectField
                name="company_id"
                label="Company scope"
                value={company}
                onChange={setCompany}
                options={catalogue.companies.filter((c) =>
                  catalogue.access
                    .find((a) => a.company_id === c.id)
                    ?.capabilities.includes("products.edit"),
                )}
              />
              <Field
                name="reference"
                label="Synthetic fixture alias (SYN-)"
                value={reference}
                onChange={setReference}
                required
              />
              <SelectField
                name="kind"
                label="Identity kind"
                value={kind}
                onChange={(v) => {
                  setKind(v as Product["kind"]);
                  setParent("");
                }}
                options={options(["Family", "Model", "Variant"])}
              />
              {kind !== "Family" && (
                <SelectField
                  name="parent_id"
                  label={kind === "Model" ? "Exact family" : "Exact model"}
                  value={parent}
                  onChange={setParent}
                  options={catalogue.items
                    .filter(
                      (p) =>
                        p.company_id === company &&
                        p.kind === (kind === "Model" ? "Family" : "Model"),
                    )
                    .map((p) => ({
                      id: p.id,
                      display_name: `${p.content.title} · ${p.reference}`,
                    }))}
                  required
                />
              )}
              <Field
                name="provider"
                label="Source provider"
                value={provider}
                onChange={setProvider}
                required
              />
              <Field
                name="entity_key"
                label="Exact external entity key"
                value={entity}
                onChange={setEntity}
                required
              />
            </div>
          )}
          <ContentFields content={content} onChange={setContent} />
          <ReasonField value={reason} onChange={setReason} />
          <details>
            <summary>Compare proposed content before saving</summary>
            <Comparison changes={changes} />
          </details>
          <Button type="submit">Save draft {detail ? "successor" : ""}</Button>
        </fieldset>
      </ValidationFields>
    </form>
  );
}
function PublicationDetail({
  detail,
  reload,
}: {
  detail: Detail;
  reload: () => void;
}) {
  const p = detail.product,
    caps = detail.capabilities,
    common = { expected_version: p.version, revision_id: detail.revision.id };
  const [purpose, setPurpose] = useState(""),
    [audience, setAudience] = useState(""),
    [effective, setEffective] = useState("");
  return (
    <>
      <ProductContext detail={detail} />
      <Comparison changes={detail.changes} />
      <p>
        Saved draft ≠ reviewed ≠ published. Published catalogue information is
        separate from installation, quotation and purchasing authority.
      </p>
      {caps.includes("products.edit") && p.state !== "Submitted" && (
        <ProductEditor key={p.id} detail={detail} />
      )}
      <div className="pd-cards">
        {caps.includes("products.edit") && p.state === "Draft" && (
          <RecoveryAction
            label="Submit exact revision"
            id={p.id}
            path={`products/${p.id}/review`}
            fields={{ ...common, action: "Submit" }}
            target={`/products/publication?product_id=${p.id}`}
            onSaved={reload}
          />
        )}{" "}
        {caps.includes("products.review") &&
          p.state === "Submitted" &&
          detail.revision.created_by !== detail.actor_id &&
          (["Reviewed", "Returned"] as const).map((action) => (
            <RecoveryAction
              key={action}
              label={
                action === "Reviewed"
                  ? "Record independent review"
                  : "Return for correction"
              }
              id={p.id}
              path={`products/${p.id}/review`}
              fields={{ ...common, action }}
              target={`/products/publication?product_id=${p.id}`}
              onSaved={reload}
            />
          ))}
      </div>
      {caps.includes("products.publish") && p.state === "Reviewed" && (
        <section className="pd-panel">
          <h2>Publish reviewed catalogue evidence</h2>
          <Field
            name="purpose"
            label="Publication purpose"
            value={purpose}
            onChange={setPurpose}
          />
          <Field
            name="audience"
            label="Publication audience"
            value={audience}
            onChange={setAudience}
          />
          <Field
            name="effective_on"
            label="Effective context date"
            type="date"
            value={effective}
            onChange={setEffective}
          />
          <RecoveryAction
            label="Publish exact reviewed revision"
            id={p.id}
            path={`products/${p.id}/review`}
            fields={{
              ...common,
              action: "Published",
              purpose,
              audience,
              effective_on: effective,
            }}
            target={`/products/${p.id}`}
            onSaved={reload}
          />
        </section>
      )}
      {caps.includes("products.publish") && p.published_revision_id && (
        <RecoveryAction
          label="Withdraw published use"
          id={p.id}
          path={`products/${p.id}/review`}
          fields={{
            ...common,
            revision_id: p.published_revision_id,
            action: "Withdrawn",
          }}
          target={`/products/${p.id}`}
          onSaved={reload}
        />
      )}
      <Link href={`/products/${p.id}`}>
        Inspect retained history and exact published basis
      </Link>
      {!caps.some((c) =>
        ["products.edit", "products.review", "products.publish"].includes(c),
      ) && (
        <p>Read only — no catalogue authoring, review or publication grant.</p>
      )}
    </>
  );
}
export function PublicationPage() {
  const params = useSearchParams(),
    catalogue = useCatalogue();
  return (
    <ProductsFrame title="Catalogue authoring and publication">
      <p>
        Named synthetic author, reviewer and publisher duties have separate grants.
        Independent review is required before publication.
      </p>
      {params.get("new") === "1" ? (
        <>
          <ResourceState resource={catalogue} />
          {catalogue.data &&
          catalogue.data.access.some((a) =>
            a.capabilities.includes("products.edit"),
          ) ? (
            <ProductEditor catalogue={catalogue.data} />
          ) : (
            catalogue.data && (
              <p>Read only — creating catalogue drafts is not authorised.</p>
            )
          )}
        </>
      ) : (
        <>
          <Link href="/products/publication?new=1">
            Prepare a new product identity
          </Link>
          <SelectedProduct>
            {(detail, reload) => (
              <PublicationDetail detail={detail} reload={reload} />
            )}
          </SelectedProduct>
        </>
      )}
    </ProductsFrame>
  );
}
