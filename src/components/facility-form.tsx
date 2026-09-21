"use client";
import Link from "next/link";
import { useState } from "react";
import {
  api,
  ErrorNotice,
  Field,
  PageHeader,
  ReadState,
  SelectField,
  ValidationFields,
  type Envelope,
  type Failure,
} from "./business-ui";
import { useCrmCommand, useCrmResource, denied } from "./crm-state";
import {
  Comparison,
  ParentPicker,
  SitePicker,
  SourceField,
  reviewOf,
  useFacilityPages,
} from "./facility-controls";
import {
  applicable,
  fields,
  type Details,
  type Facility,
  type Preview,
  type Source,
  type SourceInput,
} from "../shared/facilities/definition";
import type { OperationReceipt } from "../platform/operations";

function editableDetails(saved?: Details): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(fields).map(([k, f]) => {
      const value = saved?.[k] ?? null;
      return [
        k,
        f.kind === "source" && value
          ? { kind: "existing_source", id: (value as Source).id, version: 1 }
          : value,
      ];
    }),
  );
}
export function FacilityFormEntry({
  id,
  siteId = "",
}: {
  id?: string;
  siteId?: string;
}) {
  const r = useCrmResource<Facility>(id ? `facilities/${id}/workspace` : null);
  if (id && !r.data)
    return <ReadState loading={r.loading} error={r.error} retry={r.reload} />;
  if (id && !r.data?.can_edit)
    return (
      <p className="empty-state">
        This record is read-only.{" "}
        <Link href={`/facilities/${id}`}>Open facility</Link>
      </p>
    );
  return (
    <FacilityForm
      key={id ?? `new:${siteId}`}
      initial={r.data ?? undefined}
      siteId={siteId}
      reload={r.reload}
      refreshError={r.error}
    />
  );
}
function FacilityForm({
  initial,
  siteId,
  reload,
  refreshError,
}: {
  initial?: Facility;
  siteId: string;
  reload: () => void;
  refreshError: unknown;
}) {
  const [baseline, setBaseline] = useState(initial),
    [site, setSite] = useState(initial?.site_id ?? siteId),
    [draft, setDraft] = useState(() => editableDetails(initial?.details));
  const [reason, setReason] = useState(""),
    [preview, setPreview] = useState<Preview | null>(null),
    [previewError, setPreviewError] = useState<unknown>(null),
    [previewing, setPreviewing] = useState(false),
    [accepted, setAccepted] = useState<OperationReceipt | null>(null);
  const siteRead = useCrmResource<
    Envelope<{
      id: string;
      company_id: string;
      display_name: string;
      timezone: string;
    }>
  >(site ? `sites/${site}` : null, true);
  const sources = useFacilityPages<Source>(
    initial ? `facilities/${initial.id}/sources` : null,
  );
  const sourceOptions = [
    ...sources.items,
    ...Object.values(initial?.details ?? {}).filter(
      (v): v is Source => typeof v === "object" && v !== null && "id" in v,
    ),
  ].filter((v, i, a) => a.findIndex((x) => x.id === v.id) === i);
  const command = useCrmCommand((r) => {
    setAccepted(r);
    setPreview(null);
    reload();
  }, "Unsaved");
  const blocked =
    command.busy ||
    command.uncertain ||
    previewing ||
    !!accepted ||
    (command.error as Failure)?.code === "OperationConflict";
  const before = editableDetails(baseline?.details);
  const changes = Object.fromEntries(
    Object.entries(draft).filter(
      ([k, v]) =>
        k === "structure_type" ||
        JSON.stringify(v) !== JSON.stringify(before[k]),
    ),
  );
  const meaningful = Object.keys(changes).some(
    (k) => JSON.stringify(changes[k]) !== JSON.stringify(before[k]),
  );
  function change(key: string, value: unknown) {
    command.dirty();
    setPreview(null);
    setPreviewError(null);
    setDraft((old) => {
      const next = { ...old, [key]: value };
      for (const k of Object.keys(fields))
        if (!applicable(k, next)) next[k] = null;
      return next;
    });
  }
  async function save() {
    if (!siteRead.data?.items[0]) return;
    setPreviewError(null);
    if (!baseline)
      await command.send("facilities/create-details", {
        id: crypto.randomUUID(),
        company_id: siteRead.data.items[0].company_id,
        site_id: site,
        details: draft,
        reason,
      });
    else {
      setPreviewing(true);
      try {
        setPreview(
          await api<Preview>(`facilities/${baseline.id}/preview-change`, {
            expected_version: baseline.version,
            changes,
          }),
        );
      } catch (e) {
        setPreviewError(e);
        if ((e as Failure).code === "VersionConflict") reload();
      } finally {
        setPreviewing(false);
      }
    }
  }
  if (denied(command.error) || denied(previewError) || denied(siteRead.error))
    return (
      <ErrorNotice error={command.error ?? previewError ?? siteRead.error} />
    );
  if (accepted)
    return (
      <div className="facility-workspace">
        <PageHeader eyebrow="Facility" title="Saved to the server" />
        <p role="status">
          Accepted version {accepted.record_version}. Operation{" "}
          {accepted.operation_id}.
        </p>
        <ErrorNotice error={refreshError} />
        {initial && initial.version < accepted.record_version && (
          <p>
            Saved; latest details have not yet loaded.{" "}
            <button type="button" className="secondary" onClick={reload}>
              Refresh latest details
            </button>
          </p>
        )}
        <Link className="button" href={`/facilities/${accepted.record_id}`}>
          Open saved facility
        </Link>
        <p>
          A reload discards in-session proposal and recovery data. The saved
          record and permitted history remain available.
        </p>
      </div>
    );
  return (
    <div className="facility-workspace facility-form">
      <PageHeader
        eyebrow="Facilities & growing areas"
        title={
          baseline ? `Edit ${baseline.details.name}` : "Add facility / area"
        }
        description={
          baseline
            ? `${baseline.site_name} · Record ID ${baseline.id} · Saved version ${baseline.version}`
            : "Choose an exact Site and record what is known. Optional measurements can remain blank."
        }
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <ValidationFields error={command.error ?? previewError}>
          <ErrorNotice error={command.error ?? previewError} />
          {baseline && initial && initial.version !== baseline.version && (
            <section className="facility-comparison">
              <h2>A newer saved version is available</h2>
              <p>
                Your proposal is retained. Compare version {initial.version}{" "}
                before trying again.
              </p>
              <dl>
                {Object.keys(fields)
                  .filter(
                    (k) =>
                      JSON.stringify(initial.details[k]) !==
                      JSON.stringify(baseline.details[k]),
                  )
                  .map((k) => (
                    <div key={k}>
                      <dt>{fields[k].label}</dt>
                      <dd>
                        {String(baseline.details[k] ?? "Not recorded")} →{" "}
                        {String(initial.details[k] ?? "Not recorded")}
                      </dd>
                    </div>
                  ))}
              </dl>
              <button
                type="button"
                className="secondary"
                disabled={blocked}
                onClick={() => {
                  setBaseline(initial);
                  setPreview(null);
                  setPreviewError(null);
                  command.clearError();
                }}
              >
                Use latest saved version for comparison
              </button>
            </section>
          )}
          {!baseline && !siteId && (
            <fieldset disabled={blocked}>
              <SitePicker
                value={site}
                onChange={(id) => {
                  if (
                    command.hasUnsavedChanges &&
                    !window.confirm(
                      "Changing Site clears the entered location and details. Continue?",
                    )
                  )
                    return;
                  setSite(id);
                  setDraft(editableDetails());
                  setPreview(null);
                  command.dirty();
                }}
              />
              <ReadState
                loading={siteRead.loading}
                error={siteRead.error}
                retry={siteRead.reload}
              />
            </fieldset>
          )}
          {siteRead.data && (
            <p className="facility-meta">
              {siteRead.data.items[0].display_name} · Dates use{" "}
              {siteRead.data.items[0].timezone}. Blank dates remain unrecorded.
            </p>
          )}
          <ReadState
            loading={sources.loading && !!initial}
            error={sources.error}
            retry={sources.reload}
          />
          {sources.next && (
            <button type="button" className="secondary" onClick={sources.more}>
              Load more retained sources
            </button>
          )}
          <fieldset disabled={blocked || !!preview} className="facility-fields">
            {[...new Set(Object.values(fields).map((f) => f.group))].map(
              (group) => (
                <section key={group}>
                  <h2>{group}</h2>
                  <div className="facility-grid">
                    {Object.entries(fields)
                      .filter(
                        ([k, f]) => f.group === group && applicable(k, draft),
                      )
                      .map(([k, f]) => {
                        if (k === "parent_facility_id")
                          return site ? (
                            <ParentPicker
                              key={k}
                              siteId={site}
                              excludeId={baseline?.id}
                              value={String(draft[k] ?? "")}
                              onChange={(id) => change(k, id || null)}
                            />
                          ) : null;
                        if (f.kind === "source")
                          return (
                            <SourceField
                              key={k}
                              name={k}
                              label={f.label}
                              value={draft[k] as SourceInput | null}
                              existing={sourceOptions}
                              onChange={(v) => change(k, v)}
                            />
                          );
                        if (f.kind === "choice")
                          return (
                            <SelectField
                              key={k}
                              name={k}
                              label={f.label}
                              required={
                                k === "structure_type" ||
                                k === "parent_relationship"
                              }
                              value={String(draft[k] ?? "")}
                              empty={
                                k === "structure_type"
                                  ? "Choose a structure type"
                                  : "Not recorded"
                              }
                              options={Object.entries(f.options!).map(
                                ([id, display_name]) => ({ id, display_name }),
                              )}
                              onChange={(v) => change(k, v || null)}
                            />
                          );
                        return (
                          <Field
                            key={k}
                            name={k}
                            label={f.label}
                            value={String(draft[k] ?? "")}
                            required={
                              k === "name" ||
                              k === "type_description" ||
                              k === "type_unknown_reason" ||
                              !!f.otherOf
                            }
                            multiline={f.kind === "note"}
                            maxLength={
                              f.kind === "text" || f.kind === "note"
                                ? f.max
                                : 40
                            }
                            type={f.kind === "date" ? "date" : "text"}
                            hint={
                              f.kind === "decimal"
                                ? "Optional. Record this measurement independently; no area totals are calculated."
                                : undefined
                            }
                            onChange={(v) =>
                              change(
                                k,
                                v === ""
                                  ? null
                                  : f.kind === "integer"
                                    ? /^\d+$/.test(v)
                                      ? Number(v)
                                      : v
                                    : v,
                              )
                            }
                          />
                        );
                      })}
                  </div>
                </section>
              ),
            )}
            <Field
              name="reason"
              label={baseline ? "Change reason" : "Reason for recording"}
              required
              value={reason}
              maxLength={1000}
              onChange={(v) => {
                setReason(v);
                command.dirty();
              }}
            />
          </fieldset>
          {preview && (
            <Comparison
              preview={preview}
              onCancel={() => setPreview(null)}
              onConfirm={command.busy || command.uncertain}
              confirm={() =>
                void command.send(`facilities/${baseline!.id}/revise`, {
                  expected_version: baseline!.version,
                  changes,
                  reason,
                  review: reviewOf(preview),
                })
              }
            />
          )}
          <div className="facility-footer">
            <span role="status">{command.status}</span>
            <div className="facility-actions">
              <Link
                className="button secondary"
                href={
                  baseline
                    ? `/facilities/${baseline.id}`
                    : `/facilities${site ? `?site_id=${site}` : ""}`
                }
              >
                Cancel
              </Link>
              {!preview && (
                <button disabled={blocked || !siteRead.data || !meaningful}>
                  {previewing
                    ? "Preparing comparison…"
                    : baseline
                      ? "Review changes"
                      : "Save facility"}
                </button>
              )}
              {command.uncertain && (
                <button
                  type="button"
                  onClick={() => void command.reconcile()}
                  disabled={command.busy}
                >
                  Check original action
                </button>
              )}
            </div>
          </div>
          <p className="facility-meta">
            Save recovery is available while this page remains open. Reloading
            or closing the tab discards an unsaved proposal or uncertain
            original; inspect saved records before starting a replacement
            action.
          </p>
          {!baseline && (
            <p>
              After saving, open the record to add an optional location pin.
            </p>
          )}
        </ValidationFields>
      </form>
    </div>
  );
}
