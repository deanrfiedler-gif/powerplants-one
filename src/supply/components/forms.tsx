"use client";
import { useState } from "react";
import { Button } from "../../components/ui/button";
import { ErrorNotice, api, type Failure } from "../../components/business-ui";
import {
  completeness,
  recordFields,
  factSpecs,
  type FieldSpec,
  type Fields,
  type SupplyRecord,
  type Fact,
  type RecordKind,
  type FactKind,
  type Allocation,
} from "../model";
import type { options } from "../reads";
import { useSupplyCommand, Recovery } from "./recovery";
type Options = Awaited<ReturnType<typeof options>>;
type Command = ReturnType<typeof useSupplyCommand>;
type Option = { id: string; label: string };
// A native labelled field is used for each declared business fact; no raw payload editor.
export function Input({
  field,
  value,
  onChange,
  options,
  disabled = false,
}: {
  field: FieldSpec;
  value: string | null | undefined;
  onChange: (value: string) => void;
  options?: Option[];
  disabled?: boolean;
}) {
  const id = `supply-${field.key}`;
  return (
    <label htmlFor={id}>
      {field.label}
      {field.required ? " *" : ""}
      {field.choices || options ? (
        <select
          id={id}
          name={field.key}
          data-validation-field={field.key}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          disabled={disabled}
        >
          <option value="">
            {field.required ? "Choose…" : "Unknown / not linked"}
          </option>
          {options
            ? options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))
            : field.choices!.map((v) => <option key={v}>{v}</option>)}
        </select>
      ) : (
        <input
          id={id}
          name={field.key}
          data-validation-field={field.key}
          value={value ?? ""}
          required={field.required}
          disabled={disabled}
          type={field.type === "date" ? "date" : "text"}
          inputMode={field.type === "quantity" ? "decimal" : undefined}
          placeholder={
            field.type === "instant" ? "YYYY-MM-DDTHH:mm:ssZ" : undefined
          }
          maxLength={1000}
          onChange={(e) => onChange(e.target.value)}
        />
      )}{" "}
      {field.help && <small>{field.help}</small>}
    </label>
  );
}
const spec = (key: string, label: string, required = true): FieldSpec => ({
  key,
  label,
  required,
});
export function RecordForm({
  kind,
  record,
  options,
  command,
  onDone,
}: {
  kind: RecordKind;
  record?: SupplyRecord;
  options: Options;
  command: Command;
  onDone: () => void;
}) {
  const [id] = useState(() => record?.id ?? crypto.randomUUID());
  const [newShipment] = useState(() => crypto.randomUUID());
  const [source, setSource] = useState(() => ({
    provider: record?.external_key?.provider ?? "Manual",
    configuration: record?.external_key?.configuration ?? "",
    company: record?.external_key?.company ?? "",
    entity: record?.external_key?.entity ?? "",
    key: record?.external_key?.key ?? "",
  }));
  const [values, set] = useState<Record<string, string>>(() => ({
    reference:
      record?.reference ?? `SYN-PPO-SC-${kind.toUpperCase()}-${id.slice(0, 8)}`,
    title: record?.title ?? "",
    company_id: record?.company_id ?? options.companies[0]?.id ?? "",
    site_id: record?.site_id ?? "",
    item: record?.item ?? "",
    unit: record?.unit ?? "",
    quantity: record?.quantity ?? "",
    owner_id: record?.owner_id ?? options.actor_id,
    next_action: record?.next_action ?? "",
    observed_at: record
      ? new Date(record.observed_at).toISOString()
      : new Date().toISOString(),
    completeness: record?.completeness ?? "Partial",
    source_reference: record?.source_reference ?? "",
    reason: "",
  }));
  const [data, setData] = useState<Fields>(
    () =>
      record?.data ??
      Object.fromEntries(
        recordFields[kind].map((f) => [
          f.key,
          f.key === "timezone" ? "Australia/Sydney" : null,
        ]),
      ),
  );
  const change = (key: string, value: string) =>
    set((v) => ({ ...v, [key]: value }));
  const linked = (key: string): Option[] | undefined =>
    key === "demand_id"
      ? options.records
          .filter(
            (r) => r.kind === "Demand" && r.company_id === values.company_id,
          )
          .map((r) => ({ id: r.id, label: `${r.reference} · ${r.title}` }))
      : key === "technician_id"
        ? options.owners
        : key === "shipment_id"
          ? [
              {
                id: newShipment,
                label: "New shipment (identity retained across its lines)",
              },
              ...options.records
                .filter(
                  (r) =>
                    r.company_id === values.company_id && r.data.shipment_id,
                )
                .filter(
                  (r, i, all) =>
                    all.findIndex(
                      (s) => s.data.shipment_id === r.data.shipment_id,
                    ) === i,
                )
                .map((r) => ({
                  id: r.data.shipment_id!,
                  label: `${r.reference} · ${r.data.line_reference}`,
                })),
            ]
          : options.contexts[
              key === "origin_id" ? (data.origin_kind ?? "") : key
            ]?.filter(
              (o) =>
                o.company_id === values.company_id &&
                (!o.site_id || !values.site_id || o.site_id === values.site_id),
            );
  return (
    <form
      className="supply-form"
      onSubmit={(e) => {
        e.preventDefault();
        void command
          .send(`supply/records${record ? `/${id}` : ""}`, {
            ...values,
            id,
            kind,
            site_id: values.site_id || null,
            expected_version: record?.version ?? undefined,
            external_key: source.key ? source : null,
            data,
          })
          .then((ok) => {
            if (ok) onDone();
          });
      }}
    >
      <p>
        {record
          ? `Revise saved version ${record.version}. Its predecessor will remain available.`
          : "Create a synthetic coordination record with explicit context."}
      </p>
      <div className="supply-fields">
        {[spec("reference", "Readable reference"), spec("title", "Title")].map(
          (f) => (
            <Input
              key={f.key}
              field={f}
              value={values[f.key]}
              onChange={(v) => change(f.key, v)}
              disabled={!!record && f.key === "reference"}
            />
          ),
        )}
        <Input
          field={spec("company_id", "Company")}
          value={values.company_id}
          onChange={(v) => {
            change("company_id", v);
            change("site_id", "");
          }}
          options={options.companies}
          disabled={!!record}
        />
        <Input
          field={spec("site_id", "Site", kind !== "Supply")}
          value={values.site_id}
          onChange={(v) => change("site_id", v)}
          options={options.sites.filter(
            (s) => s.company_id === values.company_id,
          )}
          disabled={!!record}
        />
        {[
          spec("item", "Exact item reference"),
          spec("unit", "Explicit unit"),
          {
            ...spec(
              "quantity",
              kind === "Custody" ? "Issued quantity" : "Line quantity",
            ),
            type: "quantity" as const,
          },
        ].map((f) => (
          <Input
            key={f.key}
            field={f}
            value={values[f.key]}
            onChange={(v) => change(f.key, v)}
            disabled={!!record && f.key !== "quantity"}
          />
        ))}
        <Input
          field={spec("owner_id", "Accountable owner")}
          value={values.owner_id}
          onChange={(v) => change("owner_id", v)}
          options={options.owners}
        />
        <Input
          field={spec("next_action", "Next action")}
          value={values.next_action}
          onChange={(v) => change("next_action", v)}
        />
      </div>
      <h3>{kind} context</h3>
      <div className="supply-fields">
        {recordFields[kind].map((f) => (
          <Input
            key={f.key}
            field={f}
            value={data[f.key]}
            onChange={(v) =>
              setData((d) => ({
                ...d,
                [f.key]: v || null,
                ...(f.key === "origin_kind" ? { origin_id: null } : {}),
              }))
            }
            options={linked(f.key)}
            disabled={
              !!record &&
              [
                "demand_id",
                "origin_kind",
                "origin_id",
                "supply_kind",
                "shipment_id",
                "technician_id",
                "appointment_id",
                "direction",
              ].includes(f.key)
            }
          />
        ))}
      </div>
      <h3>Evidence basis</h3>
      <details>
        <summary>Qualified external source key (optional)</summary>
        <div className="supply-fields">
          {(
            ["provider", "configuration", "company", "entity", "key"] as const
          ).map((key) => (
            <Input
              key={key}
              field={{
                ...spec(key, `Source ${key}`, !!source.key),
                ...(key === "provider"
                  ? { choices: ["Manual", "Synthetic"] }
                  : {}),
              }}
              value={source[key]}
              onChange={(value) => setSource((s) => ({ ...s, [key]: value }))}
            />
          ))}
        </div>
      </details>
      <div className="supply-fields">
        {[
          {
            ...spec("completeness", "Source completeness"),
            choices: completeness,
          },
          { ...spec("observed_at", "Observed at"), type: "instant" as const },
          spec("source_reference", "Source reference / evidence"),
          spec("reason", "Reason for this record"),
        ].map((f) => (
          <Input
            key={f.key}
            field={f}
            value={values[f.key]}
            onChange={(v) => change(f.key, v)}
          />
        ))}
      </div>
      <Button
        type="submit"
        variant="primary"
        busy={command.busy}
        disabled={!!command.pending}
      >
        Save {kind.toLowerCase()}
      </Button>
    </form>
  );
}
export function FactForm({
  kind,
  record,
  previous,
  facts,
  fieldCaptures,
  command,
  onDone,
}: {
  kind: FactKind;
  record: SupplyRecord;
  previous?: Fact;
  facts: Fact[];
  fieldCaptures: Option[];
  command: Command;
  onDone: () => void;
}) {
  const [id] = useState(() => crypto.randomUUID()),
    [data, setData] = useState<Fields>(
      () =>
        previous?.data ??
        Object.fromEntries(
          factSpecs[kind].fields.map((f) => [
            f.key,
            f.type === "quantity" ? "0" : null,
          ]),
        ),
    );
  const [evidence, setEvidence] = useState(""),
    [observed, setObserved] = useState(new Date().toISOString()),
    [complete, setComplete] = useState<string>("Partial"),
    [reason, setReason] = useState(""),
    [attachment, setAttachment] = useState<string | null>(null),
    [photoError, setPhotoError] = useState<Failure | null>(null),
    [uploading, setUploading] = useState(false),
    [version, setVersion] = useState(record.version);
  const photoCommand = useSupplyCommand(
    () => {},
    `.photo.${record.id}`,
    (body, receipt) => {
      setAttachment(body.id as string);
      setVersion(receipt.record_version);
    },
  );
  async function photo(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setPhotoError(null);
    try {
      if (file.type !== "image/png" || file.size > 2000000)
        throw { message: "Choose a PNG up to 2 MB." };
      const bytes = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      for (const b of bytes) binary += String.fromCharCode(b);
      await photoCommand.send(`supply/records/${record.id}/evidence`, {
        id: crypto.randomUUID(),
        reason: "Captured synthetic Supply Chain photo evidence",
        expected_version: version,
        caption: file.name,
        content_base64: btoa(binary),
      });
    } catch (e) {
      setPhotoError(e as Failure);
    } finally {
      setUploading(false);
    }
  }
  return (
    <form
      className="supply-form"
      onSubmit={(e) => {
        e.preventDefault();
        void command
          .send(`supply/records/${record.id}/facts`, {
            id,
            expected_version: version,
            kind,
            data,
            predecessor_id: previous?.id ?? null,
            evidence,
            observed_at: observed,
            completeness: complete,
            attachment_id: attachment,
            reason,
          })
          .then((ok) => {
            if (ok) onDone();
          });
      }}
    >
      <p>
        {record.reference} · {record.item} · {record.unit} · saved version{" "}
        {version}
      </p>
      {command.error?.code === "VersionConflict" && (
        <Button
          onClick={async () => {
            const latest = await api<{ record: SupplyRecord }>(
              `supply/records/${record.id}`,
            );
            if (
              window.confirm(
                `The server is now version ${latest.record.version}. Review the latest record in the workspace before rebasing this retained proposal. Use this version?`,
              )
            )
              setVersion(latest.record.version);
          }}
        >
          Compare latest version and rebase proposal
        </Button>
      )}
      {previous && (
        <p>
          Retaining original capture {previous.id}; this saves its successor.
        </p>
      )}
      <div className="supply-fields">
        {factSpecs[kind].fields.map((f) => (
          <Input
            key={f.key}
            field={f}
            value={data[f.key]}
            onChange={(v) => setData((d) => ({ ...d, [f.key]: v || null }))}
            options={
              f.key === "field_entry_id" ? fieldCaptures : f.key === "delivery_id"
                ? facts
                    .filter((f) => f.kind === "Delivery")
                    .map((f) => ({
                      id: f.id,
                      label: `Delivery ${f.data.quantity} ${record.unit} · ${new Date(f.observed_at).toLocaleString("en-AU")}`,
                    }))
                : undefined
            }
          />
        ))}
      </div>
      <h3>Source and capture evidence</h3>
      <div className="supply-fields">
        <Input
          field={spec("evidence", "Evidence reference / finding")}
          value={evidence}
          onChange={setEvidence}
        />
        <Input
          field={{ ...spec("observed_at", "Evidence time"), type: "instant" }}
          value={observed}
          onChange={setObserved}
        />
        <Input
          field={{
            ...spec("completeness", "Source completeness"),
            choices: completeness,
          }}
          value={complete}
          onChange={setComplete}
        />
        <Input
          field={spec("reason", "Reason / correction explanation")}
          value={reason}
          onChange={setReason}
        />
      </div>
      {[
        "Receipt",
        "Pick",
        "Dispatch",
        "Delivery",
        "ReturnReceipt",
        "Custody",
      ].includes(kind) && (
        <label>
          Photo evidence (PNG, up to 2 MB)
          <input
            type="file"
            accept="image/png"
            capture="environment"
            disabled={uploading || command.busy || !!photoCommand.pending}
            onChange={(e) => void photo(e.target.files?.[0])}
          />
          <small>
            {attachment
              ? "Exact photo stored and verified. It will link to this capture."
              : uploading
                ? "Uploading and verifying…"
                : "Photo and business capture are saved separately."}
          </small>
        </label>
      )}
      <ErrorNotice error={photoError} />
      <Recovery command={photoCommand} />
      <Button
        type="submit"
        variant="primary"
        busy={command.busy}
        disabled={
          !!command.pending ||
          uploading ||
          photoCommand.busy ||
          !!photoCommand.pending
        }
      >
        Save {factSpecs[kind].title.toLowerCase()}
      </Button>
    </form>
  );
}
export function AllocationForm({
  record,
  options,
  allocations,
  command,
  onDone,
}: {
  record: SupplyRecord;
  options: Options;
  allocations: Allocation[];
  command: Command;
  onDone: () => void;
}) {
  const [target, setTarget] = useState(""),
    [revision, setRevision] = useState(""),
    [amount, setAmount] = useState(""),
    [basis, setBasis] = useState("Incoming"),
    [reason, setReason] = useState("");
  const candidates = options.records.filter(
    (r) =>
      r.kind === (record.kind === "Demand" ? "Supply" : "Demand") &&
      r.company_id === record.company_id &&
      r.item === record.item &&
      r.unit === record.unit,
  );
  return (
    <form
      className="supply-form"
      onSubmit={(e) => {
        e.preventDefault();
        const other = candidates.find((r) => r.id === target);
        if (!other) return;
        const demand = record.kind === "Demand" ? record : other,
          supply = record.kind === "Supply" ? record : other;
        const existing = allocations.find((a) => a.id === revision);
        void command
          .send("supply/allocations", {
            id: existing?.id ?? crypto.randomUUID(),
            expected_version: existing?.version ?? null,
            demand_id: demand.id,
            demand_version: demand.version,
            supply_id: supply.id,
            supply_version: supply.version,
            unit: record.unit,
            quantity: amount,
            basis,
            reason,
          })
          .then((ok) => {
            if (ok) onDone();
          });
      }}
    >
      <p>
        Only same-company, same-item, like-unit lines are offered. Incoming
        supply and usable allocations remain separate.
      </p>
      <Input
        field={spec("revision", "New allocation or retained revision", false)}
        value={revision}
        options={allocations.map((a) => ({
          id: a.id,
          label: `Revise ${a.basis}: ${a.quantity} ${a.unit} · version ${a.version}`,
        }))}
        onChange={(id) => {
          setRevision(id);
          const a = allocations.find((a) => a.id === id);
          setTarget(
            a ? (record.kind === "Demand" ? a.supply_id : a.demand_id) : "",
          );
          setAmount(a?.quantity ?? "");
          setBasis(a?.basis ?? "Incoming");
        }}
      />
      {revision && (
        <p>
          A revision retains the original line and basis. Enter zero to release
          its unpicked quantity.
        </p>
      )}
      <Input
        field={spec("target", "Receiving line")}
        value={target}
        disabled={!!revision}
        onChange={setTarget}
        options={candidates.map((r) => ({
          id: r.id,
          label: `${r.reference} · ${r.quantity} ${r.unit}`,
        }))}
      />
      <Input
        field={{
          ...spec("basis", "Allocation basis"),
          choices: ["Incoming", "Usable"],
        }}
        value={basis}
        disabled={!!revision}
        onChange={setBasis}
      />
      <Input
        field={{
          ...spec("quantity", `Quantity (${record.unit})`),
          type: "quantity",
        }}
        value={amount}
        onChange={setAmount}
      />
      <Input
        field={spec("reason", "Allocation reason")}
        value={reason}
        onChange={setReason}
      />
      <Button
        type="submit"
        variant="primary"
        busy={command.busy}
        disabled={!target || !!command.pending}
      >
        Save allocation
      </Button>
    </form>
  );
}
