"use client";
import { useState } from "react";
import { api, ErrorNotice } from "../../../components/business-ui";
import { RecordDetail } from "./record-detail";
import { Button } from "../../../components/ui/button";
import { Dialog } from "../../materials/components/client/materials-ui";
import { disciplines } from "../../model";
import {
  basisViews,
  type BasisContent,
  type ContentByKind,
  type ControlKind,
  type ControlRecord,
} from "../model";
import type { ControlRead } from "../reads";
import { TextField, Pick, People, Sources, Choices } from "./fields";
import { BasisEditor } from "./basis-editor";
import { CommandResult, useControlCommand } from "./recovery";

const initial = (kind: ControlKind): ContentByKind[ControlKind] => {
  const shared = { schema_version: 1 as const, source_ids: [] };
  switch (kind) {
    case "basis":
      return {
        ...shared,
        purpose: "DesignPreparation",
        summary: "",
        exclusions: "No procurement, installation or operational authority.",
        facility_ids: [],
        requirements: [],
        inputs: [],
        interfaces: [],
        calculations: [],
      };
    case "document":
      return { ...shared, discipline: "Mechanical", document_type: "Drawing" };
    case "query":
      return {
        ...shared,
        question: "",
        deliverable_ids: [],
        change_id: null,
        review_required: true,
        response: null,
        response_by: null,
        response_at: null,
        actions: null,
      };
    case "submittal":
      return {
        ...shared,
        supplier: "",
        product_reference: "",
        purchase_reference: null,
        submitted_revision: "",
        evidence: "",
        reviewer_id: "",
        downstream_actions: "",
      };
    case "deliverable":
      return {
        ...shared,
        discipline: "Mechanical",
        document_id: null,
        prerequisite: "",
        prerequisite_evidence: null,
        next_action: "",
        planned_hours: null,
        effort_source: null,
        authorised_hours: null,
        authorisation_reference: null,
      };
    default:
      throw Error("Use the exact review or issue preparation form.");
  }
};
export function RecordEditor({
  data,
  kind,
  record,
  successor = false,
  view = "basis",
  onClose,
  onSaved,
}: {
  data: ControlRead;
  kind: ControlKind;
  record?: ControlRecord;
  successor?: boolean;
  view?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [id] = useState(() =>
      successor || !record ? crypto.randomUUID() : record.id,
    ),
    [reference, setReference] = useState(() =>
      successor
        ? `${record!.reference}.r${record!.revision + 1}`
        : (record?.reference ??
          `SYN-PPO-${kind.toUpperCase()}-${crypto.randomUUID().slice(0, 8)}`),
    ),
    [title, setTitle] = useState(record?.title ?? ""),
    [owner, setOwner] = useState(record?.owner_id ?? data.actor_id),
    [due, setDue] = useState(record?.due_date ?? null),
    [content, setContent] = useState<ContentByKind[ControlKind]>(
      record?.content ?? initial(kind),
    ),
    [activeView, setView] = useState(view),
    [reason, setReason] = useState(""),
    [dirty, setDirty] = useState(false);
  const command = useControlCommand(() => {
    onSaved();
    onClose();
  });
  const [expectedVersion, setExpectedVersion] = useState(
    record?.version ?? null,
  );
  const [latest, setLatest] = useState<ControlRead | null>(null),
    [comparisonError, setComparisonError] = useState<unknown>(null);
  const current = latest?.records[kind].find((r) => r.id === record?.id);
  const update = (patch: Partial<ContentByKind[ControlKind]>) => {
    setDirty(true);
    setContent({ ...content, ...patch } as ContentByKind[ControlKind]);
  };
  async function save(e: React.FormEvent) {
    e.preventDefault();
    let payload: unknown = content;
    if (kind === "query") {
      const q = content as ContentByKind["query"];
      payload = {
        schema_version: 1,
        question: q.question,
        source_ids: q.source_ids,
        deliverable_ids: q.deliverable_ids,
        change_id: q.change_id,
        review_required: q.review_required,
      };
    }
    if (
      await command.send(`engineering/${data.package.id}/control`, {
        kind,
        action: "save",
        id,
        expected_version: record && !successor ? expectedVersion : null,
        reference,
        title,
        owner_id: owner,
        due_date: due,
        content: payload,
        predecessor_id: successor
          ? record!.id
          : (record?.predecessor_id ?? null),
        reason,
      })
    )
      onClose();
  }
  return (
    <Dialog
      title={`${successor ? "Prepare successor" : record ? "Edit draft" : "Add"} ${kind}`}
      subtitle={`${data.package.display_number} · ${data.package.customer_name}`}
      wide
      busy={command.locked}
      dirty={dirty}
      onClose={onClose}
    >
      <form
        className="ec-form"
        onSubmit={(e) => void save(e)}
        onChange={() => setDirty(true)}
      >
        <fieldset disabled={command.locked}>
          <div className="ec-grid">
            <TextField
              label="Reference"
              value={reference}
              onChange={setReference}
              required
            />
            <TextField
              label="Title"
              value={title}
              onChange={setTitle}
              required
            />
            <People
              data={data}
              duty="author"
              label="Responsible owner"
              value={owner}
              onChange={setOwner}
            />
            <TextField
              label="Required date (unknown if blank)"
              type="date"
              value={due}
              onChange={(v) => setDue(v || null)}
            />
          </div>
          {kind === "basis" && (
            <>
              <nav className="ec-tabs" aria-label="Basis editor views">
                {basisViews
                  .filter(([key]) => key !== "review")
                  .map(([key, label]) => (
                    <Button
                      key={key}
                      aria-pressed={activeView === key}
                      onClick={() => setView(key)}
                    >
                      {label}
                    </Button>
                  ))}
              </nav>
              <BasisEditor
                data={data}
                value={content as BasisContent}
                onChange={(v) => {
                  setContent(v);
                  setDirty(true);
                }}
                view={activeView === "review" ? "basis" : activeView}
              />
            </>
          )}
          {kind === "document" && (
            <>
              <Pick
                label="Discipline"
                value={(content as ContentByKind["document"]).discipline}
                onChange={(discipline) => update({ discipline })}
                options={disciplines.map((id) => ({ id, label: id }))}
              />
              <TextField
                label="Document / source type"
                value={(content as ContentByKind["document"]).document_type}
                onChange={(document_type) => update({ document_type })}
              />
              <p>
                Register the stable identity first, then retain each native
                source version and engineering revision separately.
              </p>
            </>
          )}
          {kind === "query" && (
            <>
              <TextField
                label="Technical question"
                area
                value={(content as ContentByKind["query"]).question}
                onChange={(question) => update({ question })}
                required
              />
              <label>
                <input
                  type="checkbox"
                  checked={(content as ContentByKind["query"]).review_required}
                  onChange={(e) =>
                    update({ review_required: e.target.checked })
                  }
                />{" "}
                Formal response requires independent review
              </label>
              <Choices
                label="Affected deliverables"
                options={data.records.deliverable.map((d) => ({
                  id: d.id,
                  label: d.title,
                }))}
                value={(content as ContentByKind["query"]).deliverable_ids}
                onChange={(deliverable_ids) => update({ deliverable_ids })}
              />
            </>
          )}
          {kind === "submittal" && (
            <>
              {(
                [
                  ["supplier", "Supplier"],
                  ["product_reference", "Equipment / product reference"],
                  ["purchase_reference", "Related PO reference (optional)"],
                  ["submitted_revision", "Submitted revision"],
                  ["evidence", "Submitted evidence reference"],
                  ["downstream_actions", "Required downstream actions"],
                ] as const
              ).map(([key, label]) => (
                <TextField
                  key={key}
                  label={label}
                  value={(content as ContentByKind["submittal"])[key]}
                  area={key === "evidence" || key === "downstream_actions"}
                  onChange={(v) => update({ [key]: v || null })}
                  required={key !== "purchase_reference"}
                />
              ))}
              <People
                data={data}
                duty="review"
                label="Assigned technical reviewer"
                value={(content as ContentByKind["submittal"]).reviewer_id}
                onChange={(reviewer_id) => update({ reviewer_id })}
              />
              <p>A technical disposition records no goods receipt.</p>
            </>
          )}
          {kind === "deliverable" && (
            <>
              <Pick
                label="Deliverable discipline"
                value={(content as ContentByKind["deliverable"]).discipline}
                onChange={(discipline) => update({ discipline })}
                options={disciplines.map((id) => ({ id, label: id }))}
              />
              <Pick
                label="Controlled document"
                value={(content as ContentByKind["deliverable"]).document_id}
                onChange={(v) => update({ document_id: v || null })}
                options={data.records.document.map((d) => ({
                  id: d.id,
                  label: `${d.reference} · ${d.title}`,
                }))}
              />
              {(
                [
                  ["prerequisite", "Required prerequisite evidence"],
                  [
                    "prerequisite_evidence",
                    "Retained prerequisite evidence (blank means missing)",
                  ],
                  ["next_action", "Next accountable action"],
                  ["planned_hours", "Planned hours (unknown if blank)"],
                  ["effort_source", "Planning source and date"],
                  ["authorised_hours", "Authorised hours (unknown if blank)"],
                  ["authorisation_reference", "Exact authorisation evidence"],
                ] as const
              ).map(([key, label]) => (
                <TextField
                  key={key}
                  label={label}
                  value={(content as ContentByKind["deliverable"])[key]}
                  onChange={(v) => update({ [key]: v || null })}
                />
              ))}
            </>
          )}
          {kind !== "basis" && (
            <Sources
              data={data}
              value={content.source_ids}
              onChange={(source_ids) => update({ source_ids })}
            />
          )}
          <TextField
            label="Reason for this change"
            value={reason}
            onChange={setReason}
            required
          />
          <Button
            variant="primary"
            type="submit"
            busy={command.status === "saving"}
          >
            Save {kind}
          </Button>
        </fieldset>
        <CommandResult command={command} />
        {command.error?.code === "VersionConflict" && record && (
          <section aria-label="Compare stale draft">
            <p>
              Your draft remains above. Read the latest saved content before
              choosing whether to apply this draft to its current version.
            </p>
            <Button
              onClick={() =>
                void api<ControlRead>(
                  `engineering/${data.package.id}/control?record_id=${record.id}`,
                ).then(setLatest, setComparisonError)
              }
            >
              Read latest saved content
            </Button>
            <ErrorNotice error={comparisonError} />
            {latest && current && (
              <>
                <details open>
                  <summary>Latest saved version {current.version}</summary>
                  <h3>{current.title}</h3>
                  <fieldset disabled className="ec-detail">
                    <RecordDetail
                      data={latest}
                      kind={kind}
                      record={current}
                      view={activeView}
                      edit={() => {}}
                      act={() => {}}
                    />
                  </fieldset>
                </details>
                <Button
                  onClick={() => {
                    setExpectedVersion(current.version);
                    setLatest(null);
                  }}
                >
                  Use version {current.version} for my retained draft
                </Button>
              </>
            )}
          </section>
        )}
      </form>
    </Dialog>
  );
}
