"use client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { convertQuantity, mappingConditions, quantityText, units, type MappingCondition, type Unit } from "../../model";
import type { readMapping } from "../../reads";
import { useMaterials } from "./materials-shell";
import { CommandNotice, Dialog, Field, fieldError, ReadNotice, Reason, Status, stampText, text, toneFor, useMaterialsCommand, useRead } from "./materials-ui";

type Mapping = Awaited<ReturnType<typeof readMapping>>;
type Row = Mapping["items"][number];

// EN-06 binds a technical requirement to an exact candidate item for one company. It creates no catalogue or ERP
// record. A missing binding keeps the requirement intact and names who resolves it.
export function MappingView() {
  const { packageId, setId, reloadFrame } = useMaterials(), search = useSearchParams();
  const mapping = useRead<Mapping>(`engineering/${packageId}/materials/mapping${setId ? `?set=${setId}` : ""}`);
  const [editing, setEditing] = useState<Row | null>(null), data = mapping.data, focus = search.get("line");
  return (
    <div className="em-page" aria-busy={mapping.loading}>
      <div className="em-page-head">
        <h2>Item &amp; unit mapping</h2>
        <p>Each line is bound to one item for one company, with its design unit, procurement unit and the evidence for any conversion between them. A missing conversion is unresolved, never one to one, and an item code that matches in another company proves nothing here.</p>
      </div>
      <ReadNotice error={mapping.error} what="Item and unit mapping" />
      {data && (
        <>
          <section className="em-panel" aria-label="Target">
            <dl className="em-panel-body em-facts">
              <div><dt>Provider</dt><dd>{data.target.provider}</dd></div>
              <div><dt>Target entity</dt><dd>{data.target.entity} · {data.target.company_name}</dd></div>
              <div><dt>Adapter</dt><dd>{data.target.adapter}</dd></div>
              <div><dt>Conditions in this set</dt><dd>{mappingConditions.filter((m) => data.counts[m]).map((m) => `${data.counts[m]} ${text(m).toLowerCase()}`).join(" · ") || "No lines"}</dd></div>
            </dl>
          </section>
          <section className="em-panel" aria-label="Bindings">
            <div className="em-table-scroll">
              <table className="em-table">
                <caption className="mw-sr">Item and unit binding of each material line</caption>
                <thead><tr><th scope="col">Line</th><th scope="col">Material requirement</th><th scope="col">Design qty</th><th scope="col">Target item</th><th scope="col">Condition</th><th scope="col">Procurement qty</th><th scope="col">Conversion basis</th><th scope="col"><span className="mw-sr">Actions</span></th></tr></thead>
                <tbody>
                  {data.items.map((r) => (
                    <tr key={r.line.id} data-inspected={r.line.id === focus || undefined}>
                      <td>{r.line.line_number}</td>
                      <td><strong>{r.line.description}</strong><span className="em-cell-sub">{[r.line.product_ref, r.line.model].filter(Boolean).join(" · ") || "No product identity recorded"}</span></td>
                      <td className="em-col-quantity">{quantityText(r.line.quantity, r.line.unit)}</td>
                      <td>{r.binding.item_key ? <><strong>{r.binding.item_key}</strong><span className="em-cell-sub">{r.binding.entity} · {r.binding.configuration} · v{r.binding.version}</span></> : <span className="mw-muted">None</span>}</td>
                      <td><Status tone={toneFor(r.binding.condition)}>{text(r.binding.condition)}</Status>{r.binding.observed_at && <span className="em-cell-sub">Observed {stampText(r.binding.observed_at)}</span>}</td>
                      <td className="em-col-quantity">{r.binding.conversion?.ok ? <>{quantityText(r.binding.conversion.quantity, r.binding.conversion.unit)}{r.binding.conversion.overage && <span className="em-cell-sub">overage {quantityText(r.binding.conversion.overage, r.line.unit)}</span>}</> : <span className="em-status-attention">Unresolved</span>}</td>
                      <td>{r.binding.conversion && !r.binding.conversion.ok ? <span className="em-cell-sub">{r.binding.conversion.message}</span> : r.binding.target_unit && r.binding.target_unit !== r.line.unit ? <span className="em-cell-sub">{r.binding.conversion_numerator} {r.line.unit} per {r.binding.conversion_denominator} {r.binding.target_unit}. {r.binding.conversion_evidence}</span> : <span className="em-cell-sub">{r.binding.target_unit ? "Same unit; no conversion" : "No target unit"}</span>}</td>
                      <td><button type="button" className="mw-button" onClick={() => setEditing(r)} disabled={r.locked || !(data.can.edit || data.can.source)}>{data.can.edit || data.can.source ? "Edit binding" : "Read only"}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data.items.length && <div className="em-empty"><strong>No material lines</strong><p>Add requirements in the materials register first.</p></div>}
            </div>
          </section>
          {!data.can.source && <Reason>Verifying an item for {data.target.entity} is the item owner&rsquo;s act, reached through the synthetic item adapter. Authors propose, flag or mark a mapping missing; they cannot verify one.</Reason>}
        </>
      )}
      {editing && data && <BindingForm row={editing} target={data.target} canVerify={data.can.source} onClose={() => setEditing(null)} onSaved={() => { mapping.reload(); reloadFrame(); }} />}
    </div>
  );
}

function BindingForm({ row, target, canVerify, onClose, onSaved }: { row: Row; target: Mapping["target"]; canVerify: boolean; onClose: () => void; onSaved: () => void }) {
  const { packageId } = useMaterials(), b = row.binding, command = useMaterialsCommand(onSaved);
  const [f, setF] = useState({
    mapping: (b.condition === "Verified" && !canVerify ? "Changed" : b.condition) as MappingCondition, configuration: b.configuration ?? "SYN-ITEMS-2026", entity: b.entity ?? target.entity, item_key: b.item_key ?? "",
    item_description: b.item_description ?? "", target_unit: (b.target_unit ?? row.line.unit) as Unit, numerator: b.conversion_numerator?.toString() ?? "", denominator: b.conversion_denominator?.toString() ?? "",
    whole: b.whole_units_only, precision: String(b.target_precision), evidence: b.conversion_evidence ?? "", overage: b.overage_basis ?? "", rationale: b.rationale ?? "",
    candidates: b.candidates.map((c) => `${c.item_key} | ${c.description} | ${c.discriminator}`).join("\n"),
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((old) => ({ ...old, [k]: v }));
  const preview = convertQuantity(row.line.quantity, { design_unit: row.line.unit, target_unit: f.target_unit, numerator: f.numerator || null, denominator: f.denominator || null, whole_units_only: f.whole, target_precision: Number(f.precision), evidence: f.evidence || null, overage_basis: f.overage || null });
  const blank = (v: string) => (v.trim() ? v.trim() : null), bound = ["Verified", "Proposed", "Changed"].includes(f.mapping), err = (n: string) => fieldError(command.error, n);
  const submit = () => void command.send(`engineering/${packageId}/materials/lines`, {
    action: "binding", reason: f.mapping === "Verified" ? "Item observed and verified for the target entity" : "Item and unit binding updated", line_id: row.line.id, expected_version: row.line.version, mapping: f.mapping,
    mapping_configuration: blank(f.configuration), mapping_entity: blank(f.entity), mapping_item_key: blank(f.item_key), mapping_item_description: blank(f.item_description),
    mapping_candidates: f.candidates.split("\n").map((l) => l.split("|").map((p) => p.trim())).filter((p) => p[0]).map(([item_key, description = "", discriminator = ""]) => ({ item_key, description, discriminator })),
    mapping_rationale: blank(f.rationale), target_unit: bound || f.mapping === "Ambiguous" ? f.target_unit : null,
    conversion_numerator: f.numerator ? Number(f.numerator) : null, conversion_denominator: f.denominator ? Number(f.denominator) : null, whole_units_only: f.whole, target_precision: Number(f.precision),
    conversion_evidence: blank(f.evidence), overage_basis: blank(f.overage),
  });
  return (
    <Dialog title={`Item & unit binding · line ${row.line.line_number}`} subtitle={`${row.line.description} · ${quantityText(row.line.quantity, row.line.unit)} for entity ${target.entity}`} wide busy={command.busy} onClose={onClose}
      footer={<><button type="button" className="mw-button" onClick={onClose} disabled={command.busy}>{command.state === "saved" ? "Close" : "Cancel"}</button><button type="button" className="mw-button mw-button-primary" onClick={submit} disabled={command.busy || command.state === "unknown"}>Save binding</button></>}>
      <CommandNotice command={command} saved="Saved to the server. A changed binding is changed technical content, so the line moved to its next content revision." />
      <div className="mw-field-row">
        <Field label="Mapping condition" error={err("mapping")}>
          <select data-autofocus value={f.mapping} onChange={(e) => set("mapping", e.target.value as MappingCondition)}>
            {mappingConditions.map((m) => <option key={m} value={m} disabled={m === "Verified" && !canVerify}>{text(m)}{m === "Verified" && !canVerify ? " (item owner only)" : ""}</option>)}
          </select>
        </Field>
        <Field label="Target entity" hint={`This package's company is ${target.entity}.`} error={err("mapping_entity")}><input value={f.entity} onChange={(e) => set("entity", e.target.value)} /></Field>
        <Field label="Configuration" error={err("mapping_configuration")}><input value={f.configuration} onChange={(e) => set("configuration", e.target.value)} /></Field>
      </div>
      <div className="mw-field-row">
        <Field label="Item key" error={err("mapping_item_key")}><input value={f.item_key} onChange={(e) => set("item_key", e.target.value)} /></Field>
        <Field label="Item description" error={err("mapping_item_description")}><input value={f.item_description} onChange={(e) => set("item_description", e.target.value)} /></Field>
      </div>
      {f.mapping === "Ambiguous" && <Field label="Permissible candidates" hint="One per line: item key | description | what tells it apart. No first match is chosen for you." error={err("mapping_candidates")}><textarea value={f.candidates} onChange={(e) => set("candidates", e.target.value)} /></Field>}
      {f.mapping === "NotRequired" && <Field label="Why no mapping is required" hint="Only for a named non-procurement output. It can never satisfy procurement readiness." error={err("mapping")}><textarea value={f.rationale} onChange={(e) => set("rationale", e.target.value)} /></Field>}
      <div className="mw-field-row">
        <div className="mw-field-short"><Field label="Procurement unit" error={err("target_unit")}><select value={f.target_unit} onChange={(e) => set("target_unit", e.target.value as Unit)}>{units.map((u) => <option key={u}>{u}</option>)}</select></Field></div>
        <div className="mw-field-short"><Field label={`${row.line.unit} per`} error={err("conversion_numerator")}><input inputMode="numeric" value={f.numerator} onChange={(e) => set("numerator", e.target.value.replace(/\D/g, ""))} disabled={f.target_unit === row.line.unit} /></Field></div>
        <div className="mw-field-short"><Field label={`this many ${f.target_unit}`} error={err("conversion_denominator")}><input inputMode="numeric" value={f.denominator} onChange={(e) => set("denominator", e.target.value.replace(/\D/g, ""))} disabled={f.target_unit === row.line.unit} /></Field></div>
        <div className="mw-field-short"><Field label="Target decimals"><select value={f.precision} onChange={(e) => set("precision", e.target.value)}>{[0, 1, 2, 3, 4, 5, 6].map((n) => <option key={n}>{n}</option>)}</select></Field></div>
      </div>
      <label className="mw-choice"><input type="checkbox" checked={f.whole} onChange={(e) => set("whole", e.target.checked)} /><span>Bought in whole units only (for example whole packs)</span></label>
      <Field label="Conversion evidence" hint="The exact source of the factor, for example a supplier data sheet." error={err("conversion_evidence")}><input value={f.evidence} onChange={(e) => set("evidence", e.target.value)} disabled={f.target_unit === row.line.unit} /></Field>
      <Field label="Overage decision" hint="Needed only when whole units exceed the design quantity: who accepts the overage and how receiving treats it." error={err("overage_basis")}><input value={f.overage} onChange={(e) => set("overage", e.target.value)} /></Field>
      <p className={`mw-notice${preview.ok ? "" : " mw-notice-attention"}`} role="status">
        {preview.ok ? <>Procurement quantity: <strong>{quantityText(preview.quantity, preview.unit)}</strong>{preview.overage ? `, which is ${quantityText(preview.overage, row.line.unit)} more than the design needs.` : preview.exact ? " (exact)." : "."}</> : preview.message}
      </p>
    </Dialog>
  );
}
