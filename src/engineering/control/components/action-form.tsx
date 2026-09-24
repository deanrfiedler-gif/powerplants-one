"use client";
import { useState } from "react";
import { Button } from "../../../components/ui/button";
import { Dialog } from "../../materials/components/client/materials-ui";
import type { ControlRead } from "../reads";
import type { ControlKind, ControlRecord } from "../model";
import { purposes } from "../model";
import type { Action } from "../validation";
import { TextField, People, Pick, Choices, Sources } from "./fields";
import { CommandResult, useControlCommand } from "./recovery";
export type ActionRequest = {
  action: Action;
  kind: ControlKind;
  record?: ControlRecord;
  extra?: Record<string, unknown>;
  label: string;
};
export function ActionForm({
  data,
  request,
  onClose,
  onSaved,
}: {
  data: ControlRead;
  request: ActionRequest;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { action, kind, record } = request;
  const [fields, setFields] = useState<Record<string, unknown>>(() => ({
      id: record?.id ?? crypto.randomUUID(),
      ...(record ? { expected_version: record.version } : {}),
      ...request.extra,
    })),
    [reason, setReason] = useState(""),
    [dirty, setDirty] = useState(false);
  const command = useControlCommand(() => {
      onSaved();
      onClose();
    }),
    put = (key: string, v: unknown) => {
      setDirty(true);
      setFields((f) => ({ ...f, [key]: v }));
    };
  const text = (key: string, title: string, required = true, area = false) => (
    <TextField
      key={key}
      label={title}
      value={typeof fields[key] === "string" ? (fields[key] as string) : null}
      onChange={(v) => put(key, v || null)}
      required={required}
      area={area}
    />
  );
  const person = (key: string, title: string, duty?: "author" | "review") => (
    <People
      data={data}
      label={title}
      duty={duty}
      value={(fields[key] as string) ?? null}
      onChange={(v) => put(key, v)}
    />
  );
  const dates = () => (
    <TextField
      label="Due date (unknown if blank)"
      type="date"
      value={(fields.due_date as string) ?? null}
      onChange={(v) => put("due_date", v || null)}
    />
  );
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = { ...fields };
    if (action === "revise_document") {
      body.revision_id ??= crypto.randomUUID();
      body.outputs = [
        {
          reference: body.output_reference,
          version: body.output_version,
          content_hash: body.output_hash,
        },
      ];
      delete body.output_reference;
      delete body.output_version;
      delete body.output_hash;
    }
    if (action === "issue" && !body.review_id && record) {
      body.review_id = record.id;
      body.id = crypto.randomUUID();
    }
    if (
      await command.send(`engineering/${data.package.id}/control`, {
        ...body,
        kind,
        action,
        reason,
      })
    )
      onClose();
  }
  return (
    <Dialog
      title={request.label}
      subtitle={`${data.package.display_number} · ${record?.reference ?? data.package.title}`}
      wide
      busy={command.locked}
      dirty={dirty}
      onClose={onClose}
    >
      <form className="ec-form" onSubmit={(e) => void submit(e)}>
        <fieldset disabled={command.locked}>
          {action === "submit_basis" && (
            <>
              {person(
                "reviewer_id",
                "Independent technical reviewer",
                "review",
              )}
              <p>
                The server freezes this exact basis, dependencies and policy.
                Outstanding inputs remain visible and prevent a positive
                decision.
              </p>
            </>
          )}
          {action === "confirm_interface" && (
            <p>
              Confirm your responsibility, required inputs and expected outputs
              for this exact saved interface. A source or interface change
              requires new confirmation.
            </p>
          )}
          {action === "revise_document" && (
            <>
              {text("engineering_revision", "Engineering revision")}
              {text("native_system", "Native authoring system")}
              {text("native_reference", "Native source reference / path")}
              {text("native_version", "Native source version")}
              {text("configuration", "Configuration / variant", false)}
              <Pick
                label="Affected reviewed basis"
                value={(fields.basis_id as string) ?? null}
                onChange={(v) => put("basis_id", v || null)}
                options={data.records.basis.map((b) => ({
                  id: b.id,
                  label: `${b.reference} · revision ${b.revision} · ${b.state}`,
                }))}
              />
              {text("output_reference", "Exact published output reference")}
              {text("output_version", "Published output version")}
              {text("output_hash", "Published output SHA-256")}
              <p>
                PPO retains metadata and exact references. Native files stay in
                their authoring system; no relocation or CAD editing occurs.
              </p>
            </>
          )}
          {action === "respond" && (
            <>
              {text("response", "Formal technical answer", true, true)}
              {text(
                "actions",
                "Resulting actions and affected work",
                true,
                true,
              )}
              {text("change_id", "Related EN-07 change UUID (optional)", false)}
              <p>
                A formal answer preserves the original basis and drawing
                revisions. It does not amend them.
              </p>
            </>
          )}
          {action === "dispose" && (
            <>
              <Pick
                label="Technical disposition"
                value={(fields.outcome as string) ?? null}
                onChange={(v) => put("outcome", v)}
                options={(kind === "query"
                  ? ["Resolved", "Returned"]
                  : ["Accepted", "Returned", "Rejected"]
                ).map((id) => ({ id, label: id }))}
              />
              {text("rationale", "Disposition rationale", true, true)}
              <p>
                Technical acceptance is separate from procurement receipt and
                commercial approval.
              </p>
            </>
          )}
          {action === "submit_review" && (
            <>
              {text("reference", "Review reference")}
              {text("title", "Review title")}
              {person("reviewer_id", "Assigned independent reviewer", "review")}
              {dates()}
              <Pick
                label="Approval purpose"
                value={(fields.purpose as string) ?? null}
                onChange={(v) => put("purpose", v)}
                options={purposes.map((id) => ({
                  id,
                  label: id.replace(/([a-z])([A-Z])/g, "$1 $2"),
                }))}
              />
              <Pick
                label="Reviewed design basis"
                value={(fields.basis_id as string) ?? null}
                onChange={(v) => put("basis_id", v || null)}
                options={data.records.basis
                  .filter((b) => b.state === "Reviewed")
                  .map((b) => ({
                    id: b.id,
                    label: `${b.reference} · revision ${b.revision}`,
                  }))}
              />
              <Choices
                label="Exact document revisions"
                value={(fields.document_revision_ids as string[]) ?? []}
                onChange={(v) => put("document_revision_ids", v)}
                options={data.document_revisions.map((d) => ({
                  id: d.id,
                  label: `${data.records.document.find((x) => x.id === d.document_id)?.reference} · engineering ${d.engineering_revision} · source ${d.native_version}`,
                }))}
              />
              <Choices
                label="Supplier submittals"
                value={(fields.submittal_ids as string[]) ?? []}
                onChange={(v) => put("submittal_ids", v)}
                options={data.records.submittal.map((s) => ({
                  id: s.id,
                  label: `${s.reference} · ${s.content.submitted_revision} · ${s.state}`,
                }))}
              />
              <Sources
                data={data}
                value={(fields.source_ids as string[]) ?? []}
                onChange={(v) => put("source_ids", v)}
              />
              <Pick
                label="Resubmission of returned review (optional)"
                value={(fields.predecessor_id as string) ?? null}
                onChange={(v) => put("predecessor_id", v || null)}
                options={data.records.review
                  .filter((r) => r.state === "Returned")
                  .map((r) => ({ id: r.id, label: r.reference }))}
              />
            </>
          )}
          {action === "finding" && (
            <>
              {text("finding", "Finding and required correction", true, true)}
              {person("owner_id", "Action owner", "author")}
              {dates()}
            </>
          )}
          {action === "respond_finding" &&
            text("response", "Correction evidence and response", true, true)}
          {action === "accept_finding" && (
            <p>
              Accept the named owner’s retained response. Closing a finding does
              not complete the technical review.
            </p>
          )}
          {action === "decide_review" && (
            <>
              <Pick
                label="Review outcome"
                value={(fields.outcome as string) ?? null}
                onChange={(v) => put("outcome", v)}
                options={[
                  { id: "Reviewed", label: "Reviewed for the stated purpose" },
                  { id: "Returned", label: "Returned for correction" },
                ]}
              />
              {text("rationale", "Review rationale", true, true)}
            </>
          )}
          {action === "issue" && (
            <>
              {text("reference", "Formal issue reference")}
              {text("title", "Issue title")}
              <Choices
                label="Synthetic recipients"
                value={(fields.recipient_ids as string[]) ?? []}
                onChange={(v) => put("recipient_ids", v)}
                options={data.people.map((p) => ({
                  id: p.id,
                  label: p.display_name,
                }))}
              />
              <p>
                The issue keeps the review’s exact purpose and per-document
                revisions. Issue does not send anything or prove delivery.
              </p>
            </>
          )}
          {action === "distribution" && (
            <>
              <p>
                Record {String(fields.evidence_kind)} evidence for this exact
                issue and recipient. This is a synthetic evidence record; no
                message is sent.
              </p>
              {text(
                "evidence",
                "Evidence reference and observation",
                true,
                true,
              )}
            </>
          )}
          {action === "withdraw" && (
            <p>
              Withdraw current use while retaining the manifest, recipients and
              all previous distribution evidence. No physical or commercial
              action is reversed.
            </p>
          )}
          <TextField
            label="Reason"
            value={reason}
            onChange={setReason}
            required
          />
          <Button
            type="submit"
            variant="primary"
            busy={command.status === "saving"}
          >
            {request.label}
          </Button>
        </fieldset>
        <CommandResult command={command} />
      </form>
    </Dialog>
  );
}
