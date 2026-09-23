"use client";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Field, PageHeader, ReadState, ValidationFields } from "./business-ui";
import { useCrmCommand, useCrmResource } from "./crm-state";
import { Button } from "./ui/button";
import { LocalDateTimeField } from "./record-ui";
import { EquipmentNav } from "./equipment-workspace";
import { EqCommandState, EqSelect, type EqOptions } from "./equipment-forms";
import type {
  equipmentEvidence,
  bulletinWorkspace,
  EvidenceKind,
} from "../equipment/evidence";
import type { equipmentCommissioningBackups } from "../equipment/commissioning";
type EvidenceRow = Awaited<
  ReturnType<typeof equipmentEvidence>
>["items"][number];
const titles = {
  backups: "Configuration backups & recovery",
  bulletins: "Service bulletin applicability",
  support: "Support lifecycle & obsolescence",
};
const descriptions = {
  backups:
    "Record exact backup, procedure and recovery evidence. Each review stage is separate; this workspace does not restore a controller.",
  bulletins:
    "Review exact supplier bulletin revisions against the installed base. Candidate matches require an Asset-level decision and owned follow-up.",
  support:
    "Retain supplier evidence, support dates and uncertainty. Unknown remains Unknown; support advice never performs a physical replacement.",
};
const routes = {
  backups: "backups",
  bulletins: "bulletins",
  support: "lifecycle",
};
export function EquipmentEvidencePortfolio({ kind }: { kind: EvidenceKind }) {
  const query = useSearchParams(),
    router = useRouter(),
    asset = query.get("asset_id") ?? "",
    [creating, setCreating] = useState(false);
  const r = useCrmResource<Awaited<ReturnType<typeof equipmentEvidence>>>(
      `equipment/${kind}${asset ? `?asset_id=${asset}` : ""}`,
      true,
    ),
    options = useCrmResource<EqOptions>(
      `equipment/options${asset ? `?asset_id=${asset}` : ""}`,
      true,
    );
  return (
    <main id="ppo-equipment" className="eq-workspace">
      <PageHeader
        eyebrow="Equipment & installed base"
        title={titles[kind]}
        description={descriptions[kind]}
      />
      <EquipmentNav />
      {options.data && (
        <div className="eq-filters">
          <EqSelect
            label="Equipment context"
            required={false}
            value={asset}
            onChange={(id) => {
              setCreating(false);
              router.push(
                `/equipment/${routes[kind]}${id ? `?asset_id=${id}` : ""}`,
              );
            }}
            options={options.data.assets.map((a) => ({
              id: a.id,
              label: `${a.display_number} · ${a.description}`,
            }))}
          />
          {options.data.can_edit && (
            <Button
              variant="primary"
              disabled={kind !== "bulletins" && !asset}
              onClick={() => setCreating((v) => !v)}
            >
              {creating
                ? "Close record form"
                : kind === "backups"
                  ? "Record backup"
                  : kind === "bulletins"
                    ? "Record bulletin revision"
                    : "Record support evidence"}
            </Button>
          )}
        </div>
      )}
      <ReadState
        loading={r.loading || options.loading}
        error={r.error || options.error}
        retry={() => {
          r.reload();
          options.reload();
        }}
      />
      {creating && options.data && (
        <EvidenceCreate
          key={`${kind}:${asset}`}
          kind={kind}
          options={options.data}
          saved={() => {
            setCreating(false);
            r.reload();
          }}
        />
      )}
      {r.data && (
        <>
          <p role="status">
            {r.data.items.length} permitted records
            {r.data.partial ? " · Partial: refine Equipment context" : ""}
          </p>
          {!r.data.items.length && (
            <section className="eq-card">
              <h2>
                No {kind === "support" ? "support evidence" : kind} recorded in
                this view
              </h2>
              <p>
                {kind === "support"
                  ? "Support status remains Unknown until a source-backed review is recorded."
                  : "Choose Equipment context to record exact evidence or clear the filter to inspect the portfolio."}
              </p>
            </section>
          )}
          {r.data.items.map((row) =>
            kind === "bulletins" ? (
              <BulletinRecord key={row.id} id={row.id} />
            ) : (
              <article className="eq-card" key={row.id}>
                <h2>{kind === "backups" ? row.reference : row.conclusion}</h2>
                <p>
                  <Link href={`/equipment/${row.asset_id}`}>
                    {row.display_number} · {row.description}
                  </Link>
                </p>
                <dl>
                  <dt>Source</dt>
                  <dd>
                    {row.source_reference} · {row.source_revision}
                  </dd>
                  <dt>Recorded by</dt>
                  <dd>
                    {row.actor} ·{" "}
                    {new Date(row.created_at).toLocaleString("en-AU")}
                  </dd>
                  {kind === "support" && (
                    <>
                      <dt>Source date</dt>
                      <dd>{String(row.source_date).slice(0, 10)}</dd>
                      <dt>Support end</dt>
                      <dd>
                        {row.support_end
                          ? String(row.support_end).slice(0, 10)
                          : "Unknown"}
                      </dd>
                      <dt>Software support end</dt>
                      <dd>
                        {row.software_support_end
                          ? String(row.software_support_end).slice(0, 10)
                          : "Unknown"}
                      </dd>
                      <dt>Component</dt>
                      <dd>{row.component ?? "Not specified"}</dd>
                      <dt>Replacement advice</dt>
                      <dd>
                        {row.replacement_recommendation ?? "Not recorded"}
                      </dd>
                      <dt>Uncertainty</dt>
                      <dd>{row.uncertainty}</dd>
                    </>
                  )}
                </dl>
                {kind === "backups" && (
                  <BackupRecord row={row} saved={r.reload} />
                )}
              </article>
            ),
          )}
        </>
      )}
      {kind === "backups" && <CommissioningBackups asset={asset} />}
    </main>
  );
}
function EvidenceCreate({
  kind,
  options,
  saved,
}: {
  kind: EvidenceKind;
  options: EqOptions;
  saved: () => void;
}) {
  const [basis] = useState({
      asset: options.asset,
      configuration: options.configuration,
    }),
    [fields, setFields] = useState<Record<string, string>>(
      kind === "bulletins"
        ? {
            company_id:
              options.companies.length === 1 ? options.companies[0].id : "",
          }
        : kind === "backups"
          ? { relationship: "Baseline" }
          : { conclusion: "Unknown" },
    ),
    command = useCrmCommand(saved);
  const set = (k: string, v: string) => {
    setFields((old) => ({ ...old, [k]: v }));
    command.dirty();
  };
  const field = (
    key: string,
    label: string,
    optional = false,
    type = "text",
    hint?: string,
  ) => (
    <Field
      key={key}
      name={key}
      label={label}
      required={!optional}
      value={fields[key] ?? ""}
      onChange={(v) => set(key, v)}
      type={type}
      hint={hint}
      maxLength={key === "reason" ? 1000 : 2000}
    />
  );
  function submit() {
    const b: Record<string, unknown> = { ...fields, id: crypto.randomUUID() };
    if (kind !== "bulletins") {
      b.asset_id = basis.asset?.id;
      b.expected_asset_version = basis.asset?.version;
    }
    if (kind === "backups") b.configuration_id = basis.configuration?.id;
    for (const k of [
      "manufacturer",
      "model",
      "serial",
      "component",
      "replacement_recommendation",
      "support_end",
      "software_support_end",
    ])
      if (b[k] === "") b[k] = null;
    void command.send(`equipment/${kind}`, b);
  }
  return (
    <section className="eq-card">
      <h2>
        Record{" "}
        {kind === "backups"
          ? "backup"
          : kind === "bulletins"
            ? "bulletin revision"
            : "support evidence"}
      </h2>
      <ValidationFields error={command.error}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <fieldset
            className="eq-form"
            disabled={command.busy || command.uncertain}
          >
            <legend>Exact source and context</legend>
            {kind === "bulletins" ? (
              <>
                <EqSelect
                  label="Company context"
                  value={fields.company_id ?? ""}
                  onChange={(v) => set("company_id", v)}
                  options={options.companies.map((c) => ({
                    id: c.id,
                    label: c.display_name,
                  }))}
                />
                {field("reference", "Bulletin reference")}
                {field("revision", "Bulletin revision")}
                {field("title", "Title")}
                {field("published_on", "Publication date", false, "date")}
                {field("manufacturer", "Manufacturer criterion", true)}
                {field("model", "Model criterion", true)}
                {field("serial", "Exact serial criterion", true)}
                <p>
                  Blank criteria are unknown. A string match only identifies
                  candidates for review.
                </p>
              </>
            ) : (
              <p>
                Equipment version {basis.asset?.version} ·{" "}
                {basis.configuration
                  ? `configuration revision ${basis.configuration.revision}`
                  : "No current configuration"}
              </p>
            )}
            {field(
              "source_reference",
              kind === "backups"
                ? "Protected backup location / document reference"
                : "Exact source reference",
              false,
              "text",
              "Use a protected reference; never enter credentials, tokens or connection strings.",
            )}
            {kind !== "bulletins" &&
              field("source_revision", "Exact source revision")}
            {kind === "backups" && (
              <>
                {field("reference", "Backup reference")}
                <LocalDateTimeField
                  name="captured_at"
                  label="Capture date and time"
                  value={fields.captured_at ?? ""}
                  onChange={(v) => set("captured_at", v)}
                />
                {field("captured_by", "Captured by")}
                {field("custodian", "Custodian")}
                {field("compatibility", "Software / firmware compatibility")}
                {field("procedure_reference", "Recovery procedure reference")}
                {field("procedure_revision", "Exact procedure revision")}
                <EqSelect
                  label="Change relationship"
                  value={fields.relationship}
                  onChange={(v) => set("relationship", v)}
                  options={["Baseline", "PreChange", "PostChange"].map(
                    (id) => ({ id, label: id }),
                  )}
                />
              </>
            )}
            {kind === "support" && (
              <>
                {field("source_date", "Source date", false, "date")}
                <EqSelect
                  label="Reviewed support conclusion"
                  value={fields.conclusion}
                  onChange={(v) => set("conclusion", v)}
                  options={[
                    "Unknown",
                    "Supported",
                    "SupportEnding",
                    "Discontinued",
                  ].map((id) => ({
                    id,
                    label: id.replace(/([a-z])([A-Z])/g, "$1 $2"),
                  }))}
                />
                {field("support_end", "Support end date", true, "date")}
                {field(
                  "software_support_end",
                  "Software support end",
                  true,
                  "date",
                )}
                {field("component", "Affected component", true)}
                {field(
                  "replacement_recommendation",
                  "Source-backed replacement recommendation",
                  true,
                )}
                {field("uncertainty", "Uncertainty / limits")}
              </>
            )}
            {field("reason", "Reason for recording")}
            <Button
              type="submit"
              variant="primary"
              disabled={kind === "backups" && !basis.configuration}
            >
              Record evidence
            </Button>
          </fieldset>
          <EqCommandState command={command} />
        </form>
      </ValidationFields>
    </section>
  );
}
function BackupRecord({ row, saved }: { row: EvidenceRow; saved: () => void }) {
  const [basis, setBasis] = useState({
      review_version: row.review_version,
      asset_version: row.asset_version,
    }),
    [step, setStep] = useState("BackupReviewed"),
    [result, setResult] = useState("Unknown"),
    [evidence, setEvidence] = useState(""),
    [revision, setRevision] = useState(""),
    [reason, setReason] = useState(""),
    [occurred, setOccurred] = useState(""),
    command = useCrmCommand(saved);
  return (
    <>
      <p>
        <strong>
          {row.current_configuration
            ? "Current configuration basis"
            : "Historical backup — configuration has changed"}
        </strong>
      </p>
      <dl>
        <dt>Captured</dt>
        <dd>
          {new Date(row.captured_at).toLocaleString("en-AU")} ·{" "}
          {row.captured_by}
        </dd>
        <dt>Custodian</dt>
        <dd>{row.custodian}</dd>
        <dt>Compatibility</dt>
        <dd>{row.compatibility}</dd>
        <dt>Recovery procedure</dt>
        <dd>
          {row.procedure_reference} · {row.procedure_revision}
        </dd>
        <dt>Change relationship</dt>
        <dd>{row.relationship}</dd>
      </dl>
      <ol>
        <li>Backup recorded</li>
        {(
          row.reviews as {
            id: string;
            step: string;
            result: string;
            evidence_reference: string;
            evidence_revision: string;
            reviewer: string;
            occurred_at: string;
            reason: string;
          }[]
        ).map((r) => (
          <li key={r.id}>
            <strong>
              {r.step.replace(/([a-z])([A-Z])/g, "$1 $2")} · {r.result}
            </strong>
            <p>
              {r.evidence_reference} · {r.evidence_revision} · {r.reviewer} ·{" "}
              {new Date(r.occurred_at).toLocaleString("en-AU")}
            </p>
            <p>{r.reason}</p>
          </li>
        ))}
      </ol>
      {row.can_edit && row.current_configuration && (
        <details>
          <summary>Record review or recovery evidence</summary>
          <ValidationFields error={command.error}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void command.send(`equipment/backups/${row.id}/review`, {
                  expected_review_version: basis.review_version,
                  expected_asset_version: basis.asset_version,
                  configuration_id: row.configuration_id,
                  step,
                  result,
                  evidence_reference: evidence,
                  evidence_revision: revision,
                  reason,
                  occurred_at: occurred,
                });
              }}
            >
              <fieldset
                className="eq-form"
                disabled={command.busy || command.uncertain}
              >
                <legend>Separate recovery evidence stage</legend>
                {(basis.review_version !== row.review_version ||
                  basis.asset_version !== row.asset_version) && (
                  <>
                    <p role="alert">
                      The evidence basis changed. Compare the retained review
                      history before accepting the current version.
                    </p>
                    <Button
                      onClick={() =>
                        setBasis({
                          review_version: row.review_version,
                          asset_version: row.asset_version,
                        })
                      }
                    >
                      I reviewed the current evidence basis
                    </Button>
                  </>
                )}
                <EqSelect
                  label="Evidence stage"
                  value={step}
                  onChange={(v) => {
                    setStep(v);
                    command.dirty();
                  }}
                  options={[
                    "BackupReviewed",
                    "ProcedureReviewed",
                    "RecoveryTested",
                    "RecoveryVerified",
                  ].map((id) => ({
                    id,
                    label: id.replace(/([a-z])([A-Z])/g, "$1 $2"),
                  }))}
                />
                <EqSelect
                  label="Result"
                  value={result}
                  onChange={(v) => {
                    setResult(v);
                    command.dirty();
                  }}
                  options={["Unknown", "Passed", "Failed"].map((id) => ({
                    id,
                    label: id,
                  }))}
                />
                <Field
                  name="evidence_reference"
                  label="Evidence reference"
                  value={evidence}
                  required
                  onChange={(v) => {
                    setEvidence(v);
                    command.dirty();
                  }}
                />
                <Field
                  name="evidence_revision"
                  label="Exact evidence revision"
                  value={revision}
                  required
                  onChange={(v) => {
                    setRevision(v);
                    command.dirty();
                  }}
                />
                <LocalDateTimeField
                  name="occurred_at"
                  label="Evidence occurrence time"
                  value={occurred}
                  onChange={(v) => {
                    setOccurred(v);
                    command.dirty();
                  }}
                />
                <Field
                  name="reason"
                  label="Review reason"
                  value={reason}
                  required
                  onChange={(v) => {
                    setReason(v);
                    command.dirty();
                  }}
                />
                <p>
                  Recovery verification requires preceding passed evidence and a
                  different permitted reviewer from the tester.
                </p>
                <Button type="submit" variant="primary">
                  Record review evidence
                </Button>
              </fieldset>
              <EqCommandState command={command} />
            </form>
          </ValidationFields>
        </details>
      )}
    </>
  );
}
function BulletinRecord({ id }: { id: string }) {
  const r = useCrmResource<Awaited<ReturnType<typeof bulletinWorkspace>>>(
      `equipment/bulletins/${id}`,
      true,
    ),
    [asset, setAsset] = useState(""),
    [basis, setBasis] = useState<{
      asset: number;
      review: number;
      bulletin: number;
    } | null>(null),
    [activity, setActivity] = useState(""),
    [disposition, setDisposition] = useState("Unknown"),
    [evidence, setEvidence] = useState(""),
    [revision, setRevision] = useState(""),
    [reason, setReason] = useState(""),
    [owner, setOwner] = useState(""),
    [due, setDue] = useState("");
  const options = useCrmResource<EqOptions>(
      asset ? `equipment/options?asset_id=${asset}` : null,
      true,
    ),
    command = useCrmCommand(r.reload);
  if (!r.data)
    return <ReadState loading={r.loading} error={r.error} retry={r.reload} />;
  const row = r.data.record,
    selected = r.data.candidates.find((a) => a.id === asset),
    reviews = r.data.reviews.filter((a) => a.asset_id === asset);
  return (
    <article className="eq-card">
      <h2>
        {row.reference} · {row.revision} · {row.state}
      </h2>
      <h3>{row.title}</h3>
      <p>
        Source: {row.source_reference} · {String(row.published_on).slice(0, 10)}
      </p>
      <p>
        Criteria:{" "}
        {[row.manufacturer, row.model, row.serial]
          .filter(Boolean)
          .join(" / ") || "Unknown — review the installed base"}
      </p>
      <p>
        {r.data.candidates.length} permitted candidates. Matching does not
        establish applicability.
      </p>
      <ul>
        {r.data.reviews.map((v) => (
          <li key={v.id}>
            <Link href={`/equipment/${v.asset_id}`}>{v.display_number}</Link> ·{" "}
            {v.disposition} · {v.evidence_reference} {v.evidence_revision}
            {v.activity_id && (
              <>
                {" "}
                · <Link href={`/work/${v.activity_id}`}>Owned follow-up</Link>
              </>
            )}
          </li>
        ))}
      </ul>
      {r.data.can_edit && row.state === "Open" && (
        <details>
          <summary>Review Asset applicability</summary>
          <ValidationFields error={command.error}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!selected || !basis) return;
                void command.send(`equipment/bulletins/${id}/review`, {
                  expected_version: basis.bulletin,
                  asset_id: asset,
                  expected_asset_version: basis.asset,
                  expected_review_version: basis.review,
                  activity_id: activity || null,
                  disposition,
                  evidence_reference: evidence,
                  evidence_revision: revision,
                  reason,
                  owner_id: owner || null,
                  due_at: due || null,
                });
              }}
            >
              <fieldset
                className="eq-form"
                disabled={command.busy || command.uncertain}
              >
                <legend>Asset-level decision</legend>
                {basis &&
                  selected &&
                  (basis.asset !== selected.version ||
                    basis.review !== reviews.length + 1 ||
                    basis.bulletin !== row.version) && (
                    <>
                      <p role="alert">
                        The reviewed basis changed. Your decision is retained;
                        compare the latest source before saving.
                      </p>
                      <Button
                        onClick={() =>
                          setBasis({
                            asset: selected.version,
                            review: reviews.length + 1,
                            bulletin: row.version,
                          })
                        }
                      >
                        I reviewed the current applicability basis
                      </Button>
                    </>
                  )}
                <EqSelect
                  label="Candidate equipment"
                  value={asset}
                  onChange={(v) => {
                    setAsset(v);
                    const chosen = r.data!.candidates.find((a) => a.id === v);
                    setBasis(
                      chosen
                        ? {
                            asset: chosen.version,
                            review:
                              r.data!.reviews.filter((a) => a.asset_id === v)
                                .length + 1,
                            bulletin: row.version,
                          }
                        : null,
                    );
                    setActivity("");
                    command.dirty();
                  }}
                  options={r.data.candidates.map((a) => ({
                    id: a.id,
                    label: `${a.display_number} · ${a.description}`,
                  }))}
                />
                <EqSelect
                  label="Applicability"
                  value={disposition}
                  onChange={(v) => {
                    setDisposition(v);
                    command.dirty();
                  }}
                  options={[
                    "Unknown",
                    "PotentiallyAffected",
                    "Affected",
                    "NotApplicable",
                  ].map((id) => ({
                    id,
                    label: id.replace(/([a-z])([A-Z])/g, "$1 $2"),
                  }))}
                />
                <Field
                  name="evidence_reference"
                  label="Applicability evidence"
                  required
                  value={evidence}
                  onChange={(v) => {
                    setEvidence(v);
                    command.dirty();
                  }}
                />
                <Field
                  name="evidence_revision"
                  label="Evidence revision"
                  required
                  value={revision}
                  onChange={(v) => {
                    setRevision(v);
                    command.dirty();
                  }}
                />
                <Field
                  name="reason"
                  label="Review / closure reason"
                  required
                  value={reason}
                  onChange={(v) => {
                    setReason(v);
                    command.dirty();
                  }}
                />
                {disposition !== "NotApplicable" && (
                  <>
                    <EqSelect
                      label="Follow-up owner"
                      required={!activity.trim()}
                      value={owner}
                      onChange={(v) => {
                        setOwner(v);
                        command.dirty();
                      }}
                      options={
                        options.data?.people.map((u) => ({
                          id: u.id,
                          label: u.display_name,
                        })) ?? []
                      }
                    />
                    <LocalDateTimeField
                      name="due_at"
                      label="Follow-up due"
                      required={!activity.trim()}
                      value={due}
                      onChange={(v) => {
                        setDue(v);
                        command.dirty();
                      }}
                    />
                    <Field
                      name="activity_id"
                      label="Existing owned Activity UUID (optional)"
                      value={activity}
                      onChange={(v) => {
                        setActivity(v);
                        command.dirty();
                      }}
                    />
                    <p>
                      An owned canonical Activity will appear in My Work and
                      shared notifications. It does not authorise Service work.
                    </p>
                  </>
                )}
                <div className="eq-actions">
                  <Button type="submit" variant="primary">
                    Record Asset disposition
                  </Button>
                  <Button
                    disabled={!reason.trim()}
                    onClick={() =>
                      void command.send(`equipment/bulletins/${id}/close`, {
                        expected_version: row.version,
                        reason,
                      })
                    }
                  >
                    Close bulletin after all dispositions
                  </Button>
                </div>
              </fieldset>
              <EqCommandState command={command} />
            </form>
          </ValidationFields>
        </details>
      )}
    </article>
  );
}

function CommissioningBackups({ asset }: { asset: string }) {
  const r = useCrmResource<
    Awaited<ReturnType<typeof equipmentCommissioningBackups>>
  >(
    `equipment/commissioning-backups${asset ? `?asset_id=${asset}` : ""}`,
    true,
  );
  return (
    <section>
      <h2>Engineering commissioning backup evidence</h2>
      <p>
        These records stay with their commissioning package, exact configuration
        and release obligations.
      </p>
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      {r.data && (
        <>
          {!r.data.items.length && (
            <p>No permitted Asset-linked commissioning backup records.</p>
          )}
          {r.data.partial && <p>Partial source window.</p>}
          {r.data.items.map((b) => (
            <article className="eq-card" key={b.id}>
              <h3>
                <Link href={b.href}>
                  {b.asset_reference} - {b.configuration}
                </Link>
              </h3>
              <p>
                {b.reference} - {b.format}
              </p>
              <p>{b.compatibility}</p>
              <p>
                Availability evidence: {b.available ? "Recorded" : "Missing"};
                identity evidence: {b.identity_checked ? "Recorded" : "Missing"}
                ; restore evidence:{" "}
                {b.recovery_evidence ? "Recorded" : "Missing"}
              </p>
              <p>
                Recorded {new Date(b.captured_at).toLocaleString("en-AU")}. Open
                the owning source for evidence and decisions.
              </p>
            </article>
          ))}
        </>
      )}
    </section>
  );
}
