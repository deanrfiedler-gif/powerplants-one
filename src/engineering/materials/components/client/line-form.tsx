"use client";
import { useState } from "react";
import { disciplines } from "../../../model";
import { units, type MaterialLine } from "../../model";
import type { readPeople, readSources } from "../../reads";
import { CommandNotice, Dialog, Field, fieldError, text, useMaterialsCommand, useRead } from "./materials-ui";
import { useMaterials } from "./materials-shell";

type People = Awaited<ReturnType<typeof readPeople>>;
type Sources = Awaited<ReturnType<typeof readSources>>;

// Create or correct one material requirement. Entries stay in the form through any refusal or conflict; the
// screen says "saved" only after the server has. Item mapping is deliberately not here: it has its own owner.
export function LineForm({ line, setId, nextNumber, onClose, onSaved }: { line: MaterialLine | null; setId: string; nextNumber: string; onClose: () => void; onSaved: (lineId: string) => void }) {
  const { packageId } = useMaterials();
  const people = useRead<People>(`engineering/${packageId}/materials/people`), sources = useRead<Sources>(`engineering/${packageId}/materials/sources`);
  const [id] = useState(() => line?.id ?? crypto.randomUUID());
  const [f, setF] = useState(() => ({
    line_number: line?.line_number ?? nextNumber, description: line?.description ?? "", category: line?.category ?? "", specification: line?.specification ?? "",
    discipline: line?.discipline ?? "Hydraulics", system_name: line?.system_name ?? "", location: line?.location ?? "", served_areas: (line?.served_areas ?? []).join("\n"),
    quantity: line?.quantity ?? "", unit: line?.unit ?? "EA", quantity_basis: line?.quantity_basis ?? "", required_by: line?.required_by ?? "",
    purpose: line?.purpose ?? "TechnicalReleaseForProcurement", manufacturer: line?.manufacturer ?? "", model: line?.model ?? "", supplier_part: line?.supplier_part ?? "",
    product_ref: line?.product_ref ?? "", dependency_group: line?.dependency_group ?? "", drawing_source_id: line?.drawing?.id ?? "", basis_source_id: line?.basis?.id ?? "",
    scope_decision_needed: line?.scope_decision_needed ?? false, scope_decision_owner_id: line?.scope_decision_owner_id ?? "", next_owner_id: line?.next_owner_id ?? "", next_action: line?.next_action ?? "",
    action_due: line?.action_due ?? "", reason: line ? "Material requirement corrected" : "Material requirement added",
  }));
  const [dirty, setDirty] = useState(false);
  const command = useMaterialsCommand(() => onSaved(id));
  const set = <K extends keyof typeof f>(key: K, value: (typeof f)[K]) => { setF((old) => ({ ...old, [key]: value })); setDirty(true); };
  const blank = (v: string) => (v.trim() ? v.trim() : null);
  const submit = () =>
    void command.send(`engineering/${packageId}/materials/lines`, {
      action: "save", reason: f.reason, line_id: id, set_id: setId, ...(line ? { expected_version: line.version } : {}),
      line_number: f.line_number, description: f.description, category: f.category, specification: f.specification, discipline: f.discipline, system_name: f.system_name,
      location: f.location, served_areas: f.served_areas.split("\n").map((s) => s.trim()).filter(Boolean), quantity: f.quantity.trim(), unit: f.unit, quantity_basis: f.quantity_basis,
      required_by: blank(f.required_by), purpose: f.purpose, manufacturer: blank(f.manufacturer), model: blank(f.model), supplier_part: blank(f.supplier_part), product_ref: blank(f.product_ref),
      kit_role: line?.kit_role ?? "Independent", parent_line_id: line?.parent_line_id ?? null, dependency_group: blank(f.dependency_group),
      drawing_source_id: blank(f.drawing_source_id), basis_source_id: blank(f.basis_source_id), scope_decision_needed: f.scope_decision_needed,
      scope_decision_owner_id: f.scope_decision_needed ? blank(f.scope_decision_owner_id) : null, next_owner_id: f.next_owner_id, next_action: f.next_action, action_due: blank(f.action_due),
    });
  const err = (name: string) => fieldError(command.error, name);
  const sourceOptions = (kind: string) => (sources.data?.items ?? []).filter((s) => s.kind === kind && (s.use === "Current" || s.id === line?.drawing?.id || s.id === line?.basis?.id));
  return (
    <Dialog
      title={line ? `Correct line ${line.line_number}` : "Add material requirement"} wide busy={command.busy} dirty={dirty && command.state !== "saved"} onClose={onClose}
      subtitle={line ? `Content revision ${line.content_revision}. A technical change creates the next revision; earlier decisions keep the revision they were made on.` : "A requirement is taken from an exact drawing issue and design basis."}
      footer={<>
        <button type="button" className="mw-button" onClick={onClose} disabled={command.busy}>{command.state === "saved" ? "Close" : "Cancel"}</button>
        <button type="button" className="mw-button mw-button-primary" onClick={submit} disabled={command.busy || command.state === "unknown"}>{command.busy ? "Saving…" : "Save requirement"}</button>
      </>}
    >
      <CommandNotice command={command} saved="Saved to the server. The register shows the confirmed record." />
      <div className="mw-field-row">
        <div className="mw-field-short"><Field label="Line" error={err("line_number")}><input data-autofocus value={f.line_number} onChange={(e) => set("line_number", e.target.value)} inputMode="numeric" /></Field></div>
        <Field label="Material requirement" error={err("description")}><input value={f.description} onChange={(e) => set("description", e.target.value)} /></Field>
        <Field label="Category" error={err("category")}><input value={f.category} onChange={(e) => set("category", e.target.value)} /></Field>
      </div>
      <Field label="Required specification" error={err("specification")}><textarea value={f.specification} onChange={(e) => set("specification", e.target.value)} /></Field>
      <div className="mw-field-row">
        <Field label="Discipline" error={err("discipline")}><select value={f.discipline} onChange={(e) => set("discipline", e.target.value)}>{disciplines.map((d) => <option key={d}>{d}</option>)}</select></Field>
        <Field label="System" error={err("system_name")}><input value={f.system_name} onChange={(e) => set("system_name", e.target.value)} /></Field>
        <Field label="Physical location" hint="Where the item is installed." error={err("location")}><input value={f.location} onChange={(e) => set("location", e.target.value)} /></Field>
      </div>
      <Field label="Areas served" hint="One per line. Serving several areas never multiplies the quantity: a pump that serves three areas is one pump." error={err("served_areas")}><textarea value={f.served_areas} onChange={(e) => set("served_areas", e.target.value)} /></Field>
      <div className="mw-field-row">
        <div className="mw-field-short"><Field label="Design quantity" hint="Exact decimal, up to six places." error={err("quantity")}><input value={f.quantity} onChange={(e) => set("quantity", e.target.value)} inputMode="decimal" /></Field></div>
        <div className="mw-field-short"><Field label="Unit" error={err("unit")}><select value={f.unit} onChange={(e) => set("unit", e.target.value as typeof f.unit)}>{units.map((u) => <option key={u}>{u}</option>)}</select></Field></div>
        <Field label="Quantity basis" hint="How the quantity was reached. Any allowance names its own basis; none is assumed." error={err("quantity_basis")}><input value={f.quantity_basis} onChange={(e) => set("quantity_basis", e.target.value)} /></Field>
      </div>
      <div className="mw-field-row">
        <Field label="Drawing issue" error={err("drawing_source_id")}>
          <select value={f.drawing_source_id} onChange={(e) => set("drawing_source_id", e.target.value)}><option value="">No drawing linked</option>{sourceOptions("DrawingIssue").map((s) => <option key={s.id} value={s.id}>{s.reference} · {s.revision} ({text(s.permitted_purpose)})</option>)}</select>
        </Field>
        <Field label="Design basis" error={err("basis_source_id")}>
          <select value={f.basis_source_id} onChange={(e) => set("basis_source_id", e.target.value)}><option value="">No basis linked</option>{sourceOptions("DesignBasis").map((s) => <option key={s.id} value={s.id}>{s.reference} · {s.revision} ({text(s.permitted_purpose)})</option>)}</select>
        </Field>
        <Field label="Intended output" hint="A source's permitted purpose is set by its owner and cannot be changed here." error={err("purpose")}>
          <select value={f.purpose} onChange={(e) => set("purpose", e.target.value as typeof f.purpose)}><option value="TechnicalReleaseForProcurement">Technical release for procurement</option><option value="InformationOnly">Information only</option></select>
        </Field>
      </div>
      <div className="mw-field-row">
        <Field label="Manufacturer" error={err("manufacturer")}><input value={f.manufacturer} onChange={(e) => set("manufacturer", e.target.value)} /></Field>
        <Field label="Model" error={err("model")}><input value={f.model} onChange={(e) => set("model", e.target.value)} /></Field>
        <Field label="Product reference" error={err("product_ref")}><input value={f.product_ref} onChange={(e) => set("product_ref", e.target.value)} /></Field>
        <Field label="Supplier part" error={err("supplier_part")}><input value={f.supplier_part} onChange={(e) => set("supplier_part", e.target.value)} /></Field>
      </div>
      <div className="mw-field-row">
        <Field label="Dependency group" hint="Lines that only work together share a group and are released whole or not at all." error={err("dependency_group")}><input value={f.dependency_group} onChange={(e) => set("dependency_group", e.target.value)} /></Field>
        <Field label="Material required by" hint="Leave empty when unknown. No date is invented: the register shows “Date needed”." error={err("required_by")}><input type="date" value={f.required_by} onChange={(e) => set("required_by", e.target.value)} /></Field>
      </div>
      <div className="mw-field-row">
        <Field label="Next action" error={err("next_action")}><input value={f.next_action} onChange={(e) => set("next_action", e.target.value)} /></Field>
        <Field label="Next action owner" error={err("next_owner_id")}>
          <select value={f.next_owner_id} onChange={(e) => set("next_owner_id", e.target.value)}><option value="">Choose a person</option>{people.data?.items.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
        </Field>
        <Field label="Review action due" hint="Separate from the material required-by date." error={err("action_due")}><input type="date" value={f.action_due} onChange={(e) => set("action_due", e.target.value)} /></Field>
      </div>
      <label className="mw-choice"><input type="checkbox" checked={f.scope_decision_needed} onChange={(e) => set("scope_decision_needed", e.target.checked)} /><span>A scope or commercial decision is outstanding for this line</span></label>
      {f.scope_decision_needed && (
        <Field label="Decision owner" hint="The commercial coordinator who decides. Engineering does not decide it for them." error={err("scope_decision_owner_id")}>
          <select value={f.scope_decision_owner_id} onChange={(e) => set("scope_decision_owner_id", e.target.value)}><option value="">Choose the commercial coordinator</option>{people.data?.items.filter((u) => u.commercial).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
        </Field>
      )}
      <Field label="Reason for this change" error={err("reason")}><input value={f.reason} onChange={(e) => set("reason", e.target.value)} /></Field>
    </Dialog>
  );
}
