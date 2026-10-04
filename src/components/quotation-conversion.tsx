"use client";
import { useState } from "react";
import {
  api,
  ErrorNotice,
  Field,
  PageHeader,
  SelectField,
  Status,
  ValidationFields,
} from "./business-ui";
import { useIdentity } from "./business-session";
import { useCrmResource, denied } from "./crm-state";
import { useUnsavedChanges } from "./record-ui";
import { Button, ButtonLink } from "./ui/button";
import { useRecoverableCommand } from "../shared/ui/use-recoverable-command";
import type { JournalEntry } from "../shared/lib/command-journal";
import type { readConversion } from "../estimating/conversion/reads";
import { resolutionStates } from "../estimating/conversion/validation";
import "./quotation-release.css";
import { QuotationSupplyFollowups } from "./quotation-supply-followup";
import { QuotationDispositions } from "./quotation-disposition";
type Detail = Awaited<ReturnType<typeof readConversion>>;
const accepts = (e: JournalEntry) =>
  /^estimating\/quotes\/[a-f0-9-]{36}\/conversion\/(receive|resolve|plan|execute|disposition-review|disposition-apply|supply-refer|supply-receive|supply-review|supply-apply)$/.test(
    e.path,
  ) && /^\/estimating\/quotes\/[a-f0-9-]{36}\/conversion$/.test(e.target);
const capture = (d: Detail) => ({
  sequence: d.sequence,
  issue: d.issue.id,
  hash: d.issue.output_hash,
  preparation: d.preparation?.id,
  response: d.preparation?.response_id,
  basis_hash: d.basis_hash,
  receiving: d.receiving?.id,
  plan: d.plan?.id,
  plan_hash: d.plan?.plan_hash,
});
export function QuotationConversion({ id }: { id: string }) {
  const identity = useIdentity(),
    resource = useCrmResource<Detail>(
      `estimating/quotes/${id}/conversion`,
      true,
    );
  return (
    <div className="quotation-release">
      <PageHeader
        eyebrow="Estimating · ES-07"
        title="Receiving and controlled conversion"
        description="Receive one exact synthetic offer, resolve Product lines and review native demand before conversion."
      />
      <ErrorNotice error={resource.error} />
      {resource.loading && (
        <p role="status">Loading permitted receiving evidence…</p>
      )}
      {!resource.data && !!resource.error && (
        <Button onClick={resource.reload}>Retry permitted read</Button>
      )}
      {resource.data && (
        <ConversionBody
          key={`${identity.workspace_id}:${identity.actor_id}:${id}`}
          detail={resource.data}
          reload={resource.reload}
        />
      )}
    </div>
  );
}
function ConversionBody({
  detail: d,
  reload,
}: {
  detail: Detail;
  reload: () => void;
}) {
  const identity = useIdentity(),
    key = `ppo:es07:${d.revision.quote_id}`,
    path = `estimating/quotes/${d.revision.id}/conversion`;
  const command = useRecoverableCommand({
    key,
    scope: identity,
    accepts,
    transport: api,
    journalLimit: 65536,
  });
  const [basis, setBasis] = useState(capture(d)),
    [reason, setReason] = useState(""),
    [evidence, setEvidence] = useState(""),
    [ack, setAck] = useState(""),
    [decision, setDecision] = useState("Received"),
    [owner, setOwner] = useState(identity.actor_id ?? ""),
    [due, setDue] = useState(""),
    [next, setNext] = useState(""),
    [lineId, setLineId] = useState(d.lines[0]?.source.id ?? ""),
    [state, setState] = useState("OneOff"),
    [label, setLabel] = useState(d.lines[0]?.source.description ?? ""),
    [unit, setUnit] = useState(d.lines[0]?.source.unit ?? "");
  const stale = JSON.stringify(basis) !== JSON.stringify(capture(d)),
    blocked =
      !command.ready ||
      command.busy ||
      !!command.pending ||
      !!command.accepted ||
      stale ||
      !d.can_write ||
      !d.preparation;
  useUnsavedChanges(
    !!(reason || evidence || next) && !command.accepted,
    !!command.pending || command.busy,
  );
  const common = {
    reason,
    evidence,
    synthetic_only: ack === "yes",
    issue_id: basis.issue,
    output_hash: basis.hash,
    preparation_id: basis.preparation,
    response_id: basis.response,
    expected_sequence: basis.sequence,
  };
  const line = d.lines.find((l) => l.source.id === lineId);
  async function send(
    kind: "receive" | "resolve" | "plan" | "execute",
    extra: object,
  ) {
    await command.send(
      `${path}/${kind}`,
      { ...common, ...extra },
      `/${path}`,
      "Synthetic quotation conversion",
      d.revision.id,
    );
  }
  if (denied(command.error))
    return (
      <>
        <ErrorNotice error={command.error} />
        <p>
          Current permission no longer allows this evidence. The original
          command remains retained for authorised recovery.
        </p>
        <Button onClick={() => window.location.reload()}>
          Reload permitted receiving
        </Button>
      </>
    );
  return (
    <>
      <section className="release-panel">
        <h2>
          {d.revision.snapshot.display_number} · revision {d.revision.version}
        </h2>
        <p className="release-notice">
          <strong>Synthetic coordination only.</strong> Receiving is not
          respondent authority, signature, commercial approval or authority to
          start work. Authority, signing, validity/expiry, withdrawal and
          operative terms: Not configured.
        </p>
        <Status
          value={d.current ? "Current issued offer" : "Superseded offer"}
        />
        <p>
          {d.revision.snapshot.customer} · one exact option ·{" "}
          {d.revision.snapshot.total} AUD excluding tax
        </p>
        <div className="release-actions">
          <ButtonLink href={`/estimating/quotes/${d.revision.id}/response`}>
            Open exact ES-06 response
          </ButtonLink>
          <ButtonLink
            href={`/api/v1/estimating/quotes/${d.revision.id}/file?kind=pdf`}
            target="_blank"
            rel="noreferrer"
          >
            Original issued PDF
          </ButtonLink>
          <Button onClick={reload} disabled={command.busy}>
            Refresh current evidence
          </Button>
        </div>
        <details>
          <summary>Exact receiving boundary</summary>
          <dl className="release-evidence">
            <dt>Issue / output fingerprint</dt>
            <dd>
              {d.issue.id}
              <br />
              {d.issue.output_hash}
            </dd>
            <dt>Preparation / response</dt>
            <dd>
              {d.preparation?.id ?? "No preparation"}
              <br />
              {d.preparation?.response_id ?? "No applicable response"}
            </dd>
            <dt>Preparation owner / note</dt>
            <dd>
              {d.preparation?.detail.owner_id}
              <br />
              {d.preparation?.detail.note}
            </dd>
          </dl>
          <p>
            A prepared note is distinct from sending, receiving, review and
            conversion. No sending event is inferred.
          </p>
        </details>
      </section>
      <ErrorNotice error={command.error} />
      {command.pending && (
        <section className="release-panel" role="status">
          <h2>Resolve the original action</h2>
          <p>
            The original outcome is uncertain. Replacement actions are held. A
            missing receipt does not prove failure.
          </p>
          <p>Operation: {command.pending.body.operation_id}</p>
          <div className="release-actions">
            <Button
              disabled={command.busy}
              onClick={() => void command.recover()}
            >
              Recover original conversion receipt
            </Button>
            <Button
              disabled={command.busy}
              onClick={() => void command.retry()}
            >
              Retry exact original
            </Button>
          </div>
        </section>
      )}
      {command.accepted && (
        <section className="release-panel" role="status">
          <h2>Saved to the server</h2>
          <p>
            {command.accepted.receipt.state} · receiving sequence{" "}
            {command.accepted.receipt.record_version}
          </p>
          <Button
            onClick={() => {
              try {
                sessionStorage.removeItem(key + ":accepted");
              } catch {
                /* Original remains on server. */
              }
              window.location.assign(command.accepted!.entry.target);
            }}
          >
            Open saved receiving
          </Button>
        </section>
      )}
      {stale && (
        <section className="release-panel" role="status">
          <h2>Receiving basis changed</h2>
          <p>
            Your entries remain. Compare current source, mappings and plans
            before another action.
          </p>
          <Button
            disabled={!!command.pending || command.busy}
            onClick={() => setBasis(capture(d))}
          >
            Use current receiving basis
          </Button>
        </section>
      )}
      <section className="release-panel">
        <h2>Readiness and retained effects</h2>
        <Status
          value={
            d.executions.length
              ? "Converted — original targets retained"
              : d.plan_applicable
                ? "Reviewed plan ready"
                : (d.receiving?.receiving?.decision ?? "Not received")
          }
        />
        {d.holds.length > 0 && (
          <ul>
            {d.holds.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        )}
        {d.executions.length > 0 &&
          d.dispositions.some((t) => t.status === "Review required") && (
            <p role="status">
              Completed target facts remain. Changed applicability or downstream
              content needs deliberate resolution; no replacement will be
              created.
            </p>
          )}
        <p>
          Supported target: native Supply Demand, Forecast class, one record per
          included Product line. Other accepted line types remain commercial
          evidence. External item mapping and ERP order creation: Not
          configured.
        </p>
      </section>
      <ValidationFields error={command.error}>
        <section className="release-panel">
          <h2>Evidence for the next decision</h2>
          <fieldset disabled={blocked}>
            <Field
              name="conversion-reason"
              label="Reason for this decision"
              value={reason}
              onChange={setReason}
              maxLength={1000}
              required
            />
            <Field
              name="conversion-evidence"
              label="Synthetic receiving evidence"
              value={evidence}
              onChange={setEvidence}
              maxLength={4000}
              multiline
              required
            />
            <SelectField
              name="conversion-ack"
              label="Synthetic coordination acknowledgement"
              value={ack}
              onChange={setAck}
              options={[
                { id: "", display_name: "Choose acknowledgement" },
                {
                  id: "yes",
                  display_name:
                    "Synthetic only; no work or commercial authority",
                },
              ]}
            />
          </fieldset>
          {!d.can_write && (
            <p>
              Current quotation reads and scoped Supply coordination duty are
              required.
            </p>
          )}
        </section>
        <section className="release-panel">
          <h2>1. Receive or return the exact preparation</h2>
          {d.receiving && (
            <p>
              Recorded {d.receiving.receiving!.decision} by{" "}
              {d.receiving.created_by} at {String(d.receiving.created_at)}.
              Follow-up: {d.receiving.receiving!.next_action}
            </p>
          )}
          <fieldset disabled={blocked}>
            <SelectField
              name="receiving-decision"
              label="Receiving decision"
              value={decision}
              onChange={setDecision}
              options={["Received", "Held", "Returned"].map((value) => ({
                id: value,
                display_name: value,
              }))}
            />
            <Field
              name="receiving-owner"
              label="Follow-up owner UUID"
              value={owner}
              onChange={setOwner}
              required
            />
            <Field
              name="receiving-due"
              label="Follow-up due date"
              value={due}
              onChange={setDue}
              type="date"
              required
            />
            <Field
              name="receiving-next"
              label="Owned follow-up"
              value={next}
              onChange={setNext}
              multiline
              required
            />
            <Button
              onClick={() =>
                void send("receive", {
                  predecessor_id: basis.receiving ?? null,
                  decision,
                  owner_id: owner,
                  due_date: due,
                  next_action: next,
                })
              }
            >
              Record receiving decision
            </Button>
          </fieldset>
          <p>
            A correction appends a decision linked to the preceding one.
            Returned or Held can record incomplete evidence.
          </p>
        </section>
        <section className="release-panel">
          <h2>2. Resolve items and review target lines</h2>
          {d.lines.map((l) => (
            <article className="release-panel" key={l.source.id}>
              <h3>{l.source.description}</h3>
              <p>
                {l.source.quantity} {l.source.unit} · source line {l.source.id}
              </p>
              <Status value={l.resolution?.resolution?.state ?? "Missing"} />
              {l.resolution && (
                <p>
                  Internal one-off identity: {l.resolution.resolution!.item_id}
                  <br />
                  Display label: {l.resolution.resolution!.label}
                </p>
              )}
              {l.holds.map((h) => (
                <p key={h}>{h}</p>
              ))}
            </article>
          ))}
          <fieldset disabled={blocked || !d.lines.length}>
            <SelectField
              name="resolution-line"
              label="Exact Product line"
              value={lineId}
              onChange={(v) => {
                setLineId(v);
                const l = d.lines.find((x) => x.source.id === v);
                setLabel(l?.source.description ?? "");
                setUnit(l?.source.unit ?? "");
              }}
              options={d.lines.map((l) => ({
                id: l.source.id,
                display_name: l.source.description,
              }))}
            />
            <SelectField
              name="resolution-state"
              label="Item resolution"
              value={state}
              onChange={setState}
              options={resolutionStates.map((value) => ({
                id: value,
                display_name: value,
              }))}
            />
            <Field
              name="resolution-label"
              label="One-off display label"
              value={label}
              onChange={setLabel}
              maxLength={200}
            />
            <Field
              name="resolution-unit"
              label="Exact target unit"
              value={unit}
              onChange={setUnit}
              maxLength={40}
            />
            <p>
              Company {d.company_id} · entity SupplyDemand. One-off identity is
              local to the source line; no operational item master is created.
            </p>
            <Button
              onClick={() =>
                void send("resolve", {
                  predecessor_id: line?.resolution?.id ?? null,
                  line_id: lineId,
                  state,
                  label,
                  unit,
                  company_id: d.company_id,
                  entity: "SupplyDemand",
                })
              }
            >
              Record item resolution
            </Button>
          </fieldset>
        </section>
        <section className="release-panel">
          <h2>3. Review and freeze the conversion plan</h2>
          {d.basis && (
            <>
              <p>
                Target {d.basis.target.provider} /{" "}
                {d.basis.target.configuration} / {d.basis.target.company} /{" "}
                {d.basis.target.entity}
              </p>
              <p>
                Customer {d.basis.target.customer_id} · site{" "}
                {d.basis.target.site_id} · {d.basis.target.timezone}
              </p>
              <ul>
                {d.basis.lines.map((l) => (
                  <li key={l.line_id}>
                    {l.label}: {l.quantity} {l.unit} → {l.item}
                  </li>
                ))}
              </ul>
            </>
          )}
          <details>
            <summary>All accepted commercial source lines</summary>
            {d.source_lines.map((l) => (
              <p key={l.id}>
                {l.description} · {l.quantity} {l.unit} · authoritative unit
                sell {l.unit_sell} AUD excluding tax ·{" "}
                {l.category === "Product"
                  ? "Native demand target"
                  : "Retained commercial basis; no material-demand effect"}
              </p>
            ))}
          </details>
          <p>
            Freezing records an explicit Reviewed decision with the exact
            receiving, response, mappings, source versions and target commands.
            It creates no target.
          </p>
          <Button
            disabled={blocked || d.holds.length > 0 || !!d.executions.length}
            onClick={() =>
              void send("plan", {
                predecessor_id: basis.plan ?? null,
                basis_hash: basis.basis_hash,
                decision: "Reviewed",
              })
            }
          >
            {d.plan ? "Review replacement plan" : "Review and freeze plan"}
          </Button>
        </section>
        <section className="release-panel">
          <h2>4. Execute the reviewed native conversion</h2>
          {d.plan && (
            <>
              <p>
                Plan {d.plan.id}
                <br />
                Fingerprint {d.plan.plan_hash}
              </p>
              <p>
                Reviewed by {d.plan.created_by} at {String(d.plan.created_at)} ·{" "}
                {d.plan_applicable ? "Applicable" : "Held or replaced basis"}
              </p>
            </>
          )}
          <p>
            All demand records and original receipts commit together. A lost
            response requires original recovery before another action.
          </p>
          <Button
            disabled={blocked || !d.plan_applicable || !!d.executions.length}
            onClick={() =>
              void send("execute", {
                plan_id: basis.plan,
                plan_hash: basis.plan_hash,
              })
            }
          >
            Create synthetic demand records
          </Button>
          {d.targets.map((t) => (
            <article className="release-panel" key={t.target_id}>
              <h3>{t.current.title}</h3>
              <p>
                {t.current.quantity} {t.current.unit} · {t.current.reference}
              </p>
              <p>
                Source line {t.line_id} · plan {t.plan_id}
              </p>
              <p>
                Original created quantity: {String(t.original.quantity)}{" "}
                {String(t.original.unit)}. Current target version:{" "}
                {t.current.version}.
              </p>
              <ButtonLink
                href={`/supply/material-readiness?record=${t.target_id}`}
              >
                Open native demand
              </ButtonLink>
            </article>
          ))}
        </section>
      </ValidationFields>
      <QuotationDispositions
        detail={d}
        actor={identity.actor_id ?? ""}
        blocked={
          !command.ready ||
          command.busy ||
          !!command.pending ||
          !!command.accepted ||
          !d.can_write
        }
        send={async (kind, body) => {
          await command.send(
            `${path}/${kind}`,
            body,
            `/${path}`,
            "Synthetic completed-conversion disposition",
            d.revision.id,
          );
        }}
      />
      <QuotationSupplyFollowups
        targets={d.followups}
        actor={identity.actor_id ?? ""}
        blocked={
          !command.ready ||
          command.busy ||
          !!command.pending ||
          !!command.accepted ||
          !d.can_write
        }
        send={async (kind, body) => {
          await command.send(
            `${path}/${kind}`,
            body,
            `/${path}`,
            "Synthetic owned Supply follow-up",
            d.revision.id,
          );
        }}
      />
      <section className="release-panel">
        <h2>Immutable receiving and conversion history</h2>
        {d.events.map((e) => (
          <details key={e.id}>
            <summary>
              {e.sequence}. {e.action} ·{" "}
              {e.receiving?.decision ??
                e.resolution?.state ??
                (e.action === "Plan" ? "Reviewed" : "Converted")}
            </summary>
            <p>
              {e.id} · actor {e.created_by} · {String(e.created_at)}
            </p>
            <p>{e.reason}</p>
            <p>{e.evidence}</p>
            <p>
              Issue {e.issue_id} · response {e.response_id} · preparation{" "}
              {e.preparation_id}
            </p>
            {e.receiving && (
              <p>
                Owner {e.receiving.owner_id} · due {e.receiving.due_date} ·{" "}
                {e.receiving.next_action}
              </p>
            )}
            {e.resolution && (
              <p>
                Source line {e.resolution.line_id} · item {e.resolution.item_id}{" "}
                · {e.resolution.label} · {e.resolution.unit} · company{" "}
                {e.resolution.company_id} / {e.resolution.entity}. External
                mapping: Not configured.
              </p>
            )}
            {e.plan && (
              <>
                <p>
                  Frozen plan fingerprint {e.plan_hash} · receiving{" "}
                  {e.plan.basis.receiving_id} · source version{" "}
                  {e.plan.basis.estimate_version_id}
                </p>
                <ul>
                  {e.plan.basis.lines.map((l, i) => (
                    <li key={l.line_id}>
                      {l.label}: {l.quantity} {l.unit} · source {l.line_id} ·
                      resolution {l.resolution_id} · intended target{" "}
                      {e.plan!.commands[i].id}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {e.plan_id && <p>Executed plan {e.plan_id}</p>}
            <p>
              Predecessor {e.predecessor_id ?? "None"} · original operation{" "}
              {e.operation_id}
            </p>
          </details>
        ))}
      </section>
    </>
  );
}
