"use client";
import Link from "next/link";
import { useState } from "react";
import { Field, PageHeader, ReadState, ValidationFields } from "./business-ui";
import { Button } from "./ui/button";
import { useCrmCommand, useCrmResource } from "./crm-state";
import { EquipmentNav } from "./equipment-workspace";
import { EqCommandState, EqSelect, type EqOptions } from "./equipment-forms";
import type { equipmentInstruments } from "../equipment/evidence";
type Instrument = Awaited<
  ReturnType<typeof equipmentInstruments>
>["items"][number];
const labels: Record<string, string> = {
  ValidAtUse: "Valid for this date",
  InvalidAtUse: "Outside calibration interval",
  WithdrawnForUse: "Withdrawn for this date",
  Unknown: "Unknown",
};
export function EquipmentInstruments() {
  const r = useCrmResource<Awaited<ReturnType<typeof equipmentInstruments>>>(
      "equipment/instruments",
      true,
    ),
    options = useCrmResource<EqOptions>("equipment/options", true),
    [create, setCreate] = useState(false),
    [renew, setRenew] = useState<Instrument | null>(null);
  return (
    <main id="ppo-equipment" className="eq-workspace">
      <PageHeader
        eyebrow="EQ-09 · Equipment"
        title="Test instruments & calibration"
        description="Canonical Inspection instruments and retained certificate versions. Current validity and validity when used are separate."
      />
      <EquipmentNav />
      <ReadState
        loading={r.loading || options.loading}
        error={r.error || options.error}
        retry={() => {
          r.reload();
          options.reload();
        }}
      />
      {!!options.data?.companies.length && (
        <Button
          onClick={() => {
            setCreate((v) => !v);
            setRenew(null);
          }}
          variant="primary"
        >
          {create ? "Close calibration form" : "Record calibration evidence"}
        </Button>
      )}
      {(create || renew) && options.data && (
        <CalibrationForm
          key={renew?.id ?? "new"}
          options={options.data}
          predecessor={renew}
          saved={() => {
            setCreate(false);
            setRenew(null);
            r.reload();
          }}
        />
      )}
      {r.data && (
        <>
          <p role="status">
            {r.data.items.length} retained calibration records · assessed{" "}
            {r.data.today}
            {r.data.partial ? " · Partial register" : ""}
          </p>
          {!r.data.items.length && (
            <p>No permitted instrument calibration records.</p>
          )}
          {r.data.items.map((i) => (
            <article key={i.id} className="eq-card">
              <h2>
                {i.reference} · {i.description}
              </h2>
              <p>
                <strong>{labels[i.current.assessment]}</strong> ·{" "}
                {i.current.reason}
              </p>
              <dl>
                <dt>Measurement</dt>
                <dd>
                  {[i.measurement_type, i.measurement_range, i.measurement_unit]
                    .filter(Boolean)
                    .join(" · ") ||
                    "Capability not recorded on this retained calibration"}
                </dd>
                <dt>Calibration</dt>
                <dd>
                  {i.calibration_reference} · {i.calibration_version}
                </dd>
                <dt>Valid interval</dt>
                <dd>
                  {i.valid_from} to {i.valid_to}
                </dd>
                <dt>Exact certificate evidence</dt>
                <dd>
                  {i.certificate_reference
                    ? `${i.certificate_reference} · ${i.certificate_revision}`
                    : "Certificate evidence unavailable"}
                </dd>
                <dt>Withdrawal</dt>
                <dd>
                  {i.withdrawn_effective_from
                    ? `${i.withdrawn_effective_from} · ${i.withdrawn_reason}`
                    : "No withdrawal recorded"}
                </dd>
              </dl>
              <p>{i.usage_scope}</p>
              <details>
                <summary>Historical Inspection usage ({i.uses.length})</summary>
                {!i.uses.length && (
                  <p>
                    No permitted Inspection use is recorded for this certificate
                    version.
                  </p>
                )}
                {i.uses.map((u) => (
                  <section key={u.attempt_id}>
                    <h3>
                      <Link href={u.href}>Inspection attempt</Link>
                    </h3>
                    <p>
                      Occurred:{" "}
                      {u.occurred_at
                        ? new Date(u.occurred_at).toLocaleString("en-AU")
                        : "Not recorded"}{" "}
                      · {u.configuration_reference}
                    </p>
                    <p>
                      Retained at-use assessment: {labels[u.at_use.assessment]}{" "}
                      · {u.at_use.reason}
                    </p>
                    <p>
                      Including later withdrawals:{" "}
                      {labels[u.current_assessment_of_use.assessment]} ·{" "}
                      {u.current_assessment_of_use.reason}
                    </p>
                    <p>
                      Exact certificate snapshot:{" "}
                      {u.snapshot.calibration_reference} ·{" "}
                      {u.snapshot.calibration_version}
                    </p>
                    <ul>
                      {u.readings.map((r) => (
                        <li key={r.id}>
                          {r.check_key}:{" "}
                          {r.raw_value ?? r.choice ?? r.entry_state} {r.unit} ·{" "}
                          {r.evaluation ?? "Not evaluated"} {r.note}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </details>
              {i.can_edit && (
                <>
                  <Button
                    onClick={() => {
                      setRenew(i);
                      setCreate(false);
                    }}
                  >
                    Record renewed certificate
                  </Button>
                  {!i.withdrawn_effective_from && (
                    <WithdrawalForm row={i} saved={r.reload} />
                  )}
                </>
              )}
            </article>
          ))}
        </>
      )}
    </main>
  );
}
function CalibrationForm({
  options,
  predecessor,
  saved,
}: {
  options: EqOptions;
  predecessor: Instrument | null;
  saved: () => void;
}) {
  const [fields, setFields] = useState<Record<string, string>>(() => ({
      company_id:
        predecessor?.company_id ??
        (options.companies.length === 1 ? options.companies[0].id : ""),
      reference: predecessor?.reference ?? "",
      description: predecessor?.description ?? "",
      measurement_type: predecessor?.measurement_type ?? "",
      measurement_range: predecessor?.measurement_range ?? "",
      measurement_unit: predecessor?.measurement_unit ?? "",
    })),
    command = useCrmCommand(saved);
  const set = (k: string, v: string) => {
    setFields((f) => ({ ...f, [k]: v }));
    command.dirty();
  };
  const specs = [
    ["reference", "Instrument reference"],
    ["description", "Description"],
    ["measurement_type", "Measurement type"],
    ["measurement_range", "Measurement range"],
    ["measurement_unit", "Unit"],
    ["calibration_reference", "Calibration reference"],
    ["calibration_version", "Calibration version"],
    ["valid_from", "Valid from", "date"],
    ["valid_to", "Valid to", "date"],
    ["certificate_reference", "Exact certificate evidence reference"],
    ["certificate_revision", "Certificate revision"],
    ["reason", "Reason for recording"],
  ];
  return (
    <section className="eq-card">
      <h2>
        {predecessor
          ? "Renew calibration — original retained"
          : "Record canonical instrument calibration"}
      </h2>
      <ValidationFields error={command.error}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void command.send("equipment/instruments", {
              ...fields,
              id: crypto.randomUUID(),
              instrument_id: crypto.randomUUID(),
              predecessor_id: predecessor?.id ?? null,
              expected_version: predecessor?.version ?? null,
            });
          }}
        >
          <fieldset
            className="eq-form"
            disabled={command.busy || command.uncertain}
          >
            <legend>Certificate basis</legend>
            <EqSelect
              label="Company context"
              value={fields.company_id}
              onChange={(v) => set("company_id", v)}
              options={options.companies.map((c) => ({
                id: c.id,
                label: c.display_name,
              }))}
            />
            {specs.map(([name, label, type]) => (
              <Field
                key={name}
                name={name}
                label={label}
                type={type ?? "text"}
                required
                value={fields[name] ?? ""}
                onChange={(v) => set(name, v)}
              />
            ))}
            <p>
              Renewal creates a retained successor certificate for the same
              instrument reference. It never repairs an earlier invalid reading.
            </p>
            <Button type="submit" variant="primary">
              Record certificate evidence
            </Button>
          </fieldset>
          <EqCommandState command={command} />
        </form>
      </ValidationFields>
    </section>
  );
}
function WithdrawalForm({
  row,
  saved,
}: {
  row: Instrument;
  saved: () => void;
}) {
  const [effective, setEffective] = useState(""),
    [reason, setReason] = useState(""),
    command = useCrmCommand(saved);
  return (
    <details>
      <summary>Record retrospective withdrawal</summary>
      <ValidationFields error={command.error}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void command.send("equipment/instruments", {
              id: crypto.randomUUID(),
              instrument_id: row.id,
              company_id: row.company_id,
              expected_version: row.version,
              withdrawn_effective_from: effective,
              reason,
            });
          }}
        >
          <fieldset
            className="eq-form"
            disabled={command.busy || command.uncertain}
          >
            <legend>Withdraw this exact calibration record</legend>
            <Field
              name="withdrawn_effective_from"
              label="Withdrawal effective from"
              type="date"
              value={effective}
              required
              onChange={(v) => {
                setEffective(v);
                command.dirty();
              }}
            />
            <Field
              name="reason"
              label="Source-backed withdrawal reason"
              value={reason}
              required
              onChange={(v) => {
                setReason(v);
                command.dirty();
              }}
            />
            <p>
              Historical use snapshots remain unchanged. Their current
              assessment includes this withdrawal.
            </p>
            <Button type="submit" variant="danger">
              Record withdrawal
            </Button>
          </fieldset>
          <EqCommandState command={command} />
        </form>
      </ValidationFields>
    </details>
  );
}
