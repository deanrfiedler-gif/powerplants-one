"use client";
import Link from "next/link";
import { useState } from "react";
import type { Comparison, Decision, Position } from "../estimating/specialist/types";
import { headline, manualReview, type Headline } from "../estimating/specialist/workbench";
import { NativePrices } from "./specialist-pricing";
import type { Bench } from "./specialist-types";
import { Notice, Pill, Segmented, fmt, money, readable, runLabel } from "./specialist-ui";

// Compare & save (design board artboard 05): the live configuration against a
// saved run or a session-only scratch baseline (D9), line changes matched by
// stable CE-LINE key with every required decision chosen in place, and the
// record-run checklist. Saving never rewrites an earlier run.
type Row = Comparison<Position>;
const kinds = ["Changed", "Manual edit", "Added", "Removed", "Deleted", "Incompatible", "Unchanged"] as const;
const value = (x: Position | null) => (x ? `${x.effective_quantity?.display ?? "Unresolved"} ${x.unit}` : "Omitted");
const choicesFor = (kind: Row["kind"], current: Position | null, candidate: Position | null): { value: Decision["choice"]; label: string }[] =>
  kind === "Deleted"
    ? [
        { value: "restore", label: "Restore proposal" },
        { value: "omit", label: "Keep omitted" },
      ]
    : kind === "Removed"
      ? [
          { value: "remove", label: "Remove" },
          { value: "retain", label: "Retain as manual" },
        ]
      : kind === "Incompatible"
        ? [
            { value: "retain", label: "Retain saved identity" },
            { value: "generated", label: "Use new identity and quantity" },
          ]
        : [
            { value: "keep", label: `Keep saved ${current?.effective_quantity?.display ?? ""}`.trim() },
            { value: "generated", label: `Use current ${candidate?.effective_quantity?.display ?? ""}`.trim() },
          ];
export function DecisionRows({ rows, choose, disabled, title, tone = "warn" }: { rows: Row[]; choose: (key: string, choice: Decision["choice"]) => void; disabled: boolean; title: string; tone?: "warn" | "danger" }) {
  if (!rows.length) return null;
  return (
    <>
      <div className={`es08-group-title es08-tone-${tone}`}>{title}</div>
      <ul className="es08-changes">
        {rows.map((r) => {
          const status = r.decision
            ? r.decision.choice === "keep" || r.decision.choice === "retain"
              ? `Keeps saved ${value(r.current)}`
              : r.decision.choice === "remove" || r.decision.choice === "omit"
                ? "Omitted from this run"
                : `Uses current ${value(r.candidate)}`
            : `${r.kind} · saved ${value(r.current)}, current ${value(r.candidate)} · decision needed`;
          return (
            <li key={r.key} className="es08-change es08-change--decision">
              <span className="es08-mono es08-sub">{r.key}</span>
              <span className="es08-change-name">
                <span id={`es08-dec-${r.key}`} className="es08-strong">
                  {(r.candidate ?? r.current ?? r.baseline)?.description ?? r.key}
                </span>
                <span className={`es08-sub ${r.decision ? "es08-tone-ok" : "es08-tone-warn"}`}>{status}</span>
              </span>
              <Segmented label={`${r.key} decision`} size="sm" disabled={disabled} options={choicesFor(r.kind, r.current, r.candidate)} value={r.decision?.choice ?? ""} onChange={(x) => choose(r.key, x as Decision["choice"])} />
            </li>
          );
        })}
      </ul>
    </>
  );
}
export function CompareView({ bench }: { bench: Bench }) {
  const { calculation: c, proposal: p, preview, data, frozen, fresh, decisions } = bench,
    run = data.current_run,
    [against, setAgainst] = useState<"saved" | "scratch">(run ? "saved" : "scratch"),
    [scratch, setScratch] = useState<{ at: Date; metrics: Headline[] } | null>(null),
    [ack, setAck] = useState(false),
    live = headline(c, p),
    saved = run ? headline(run.snapshot.calculation, run.snapshot.proposal) : null,
    baseline = against === "saved" ? saved : (scratch?.metrics ?? null),
    comparison = fresh ? (preview?.comparison ?? []) : [],
    byKind = Object.fromEntries(kinds.map((k) => [k, comparison.filter((r) => r.kind === k)])) as Record<(typeof kinds)[number], Row[]>,
    required = comparison.filter((r) => r.required),
    decided = required.filter((r) => r.decision).length,
    manual = manualReview(c),
    checks = [
      { label: "Preview signature current", ok: fresh && !!preview, status: fresh && preview ? `CFG ${bench.signature} matches the live preview` : bench.calculating ? "Recalculating the preview" : "Inputs changed after this comparison" },
      { label: "All inputs valid", ok: c?.state === "Current", status: c?.state === "Current" ? "No field errors" : `${Object.keys(bench.errors).length || "Some"} input${Object.keys(bench.errors).length === 1 ? "" : "s"} to resolve` },
      { label: "Manual quantities reviewed", ok: manual.outstanding === 0, status: manual.outstanding === 0 ? `${manual.total} of ${manual.total} reviewed` : `${manual.reviewed} of ${manual.total}${run ? ` · basis changed since ${runLabel(run.sequence)}` : ""}` },
      { label: "Saved-line decisions", ok: decided === required.length, status: required.length ? `${decided} of ${required.length} chosen` : "None required" },
    ],
    blockers = [
      ...(!fresh || !preview ? ["refresh the comparison"] : []),
      ...(c?.state !== "Current" ? ["resolve the invalid inputs"] : []),
      ...(manual.outstanding ? [`review the ${manual.outstanding} manual quantit${manual.outstanding === 1 ? "y" : "ies"}`] : []),
      ...(decided < required.length ? [`choose ${required.length - decided} saved-line decision${required.length - decided === 1 ? "" : "s"}`] : []),
      ...(!ack ? ["confirm the acknowledgement"] : []),
    ],
    canSave = !frozen && blockers.length === 0,
    nextRun = runLabel((run?.sequence ?? 0) + 1),
    rollBlocks = bench.gates[3].status === "block";
  const delta = (a: Headline, b: Headline | undefined) => {
    if (a.value === null || !b || b.value === null) return { text: "—", tone: "" };
    const d = a.value - b.value;
    if (Math.abs(d) < 1e-9) return { text: "No change", tone: "es08-sub" };
    const text = a.money ? money(String(d), true) : `${d > 0 ? "+" : "−"}${fmt(Math.abs(d), a.dp)}${a.unit ? ` ${a.unit}` : ""}`;
    return { text, tone: "es08-tone-info es08-strong" };
  };
  const show = (m: Headline) => (m.value === null ? "—" : m.money ? money(String(m.value)) : `${fmt(m.value, m.dp)}${m.unit ? ` ${m.unit}` : ""}`);
  return (
    <div className="es08-view">
      <div className="es08-view-head">
        <div>
          <h2>Compare &amp; save</h2>
          <p>Check the live configuration against a baseline before recording a run. Lines are matched by stable CE-LINE key, never by description.</p>
        </div>
        <div className="es08-view-actions">
          <span id="es08-cmp-against" className="es08-sub">
            Compare against
          </span>
          <Segmented
            labelledBy="es08-cmp-against"
            options={[
              { value: "saved", label: run ? `Saved run ${runLabel(run.sequence)}` : "Saved run", disabled: !run },
              { value: "scratch", label: "Scratch baseline" },
            ]}
            value={against}
            onChange={(x) => setAgainst(x as "saved" | "scratch")}
          />
          <button
            type="button"
            className="ppo-button"
            disabled={!c}
            onClick={() => {
              setScratch({ at: new Date(), metrics: live });
              setAgainst("scratch");
            }}
          >
            Capture scratch baseline
          </button>
        </div>
      </div>
      <div className="es08-comparegrid">
        <div className="es08-stack">
          <section className="es08-card" aria-labelledby="es08-metrics-h">
            <div className="es08-card-head">
              <h3 id="es08-metrics-h">Headline comparison</h3>
              <span className="es08-sub">Estimating metrics only · not an engineering ranking</span>
            </div>
            {baseline ? (
              <>
                <table className="es08-table es08-table--metrics">
                  <thead>
                    <tr>
                      <th scope="col">Metric</th>
                      <th scope="col" className="es08-num">
                        {against === "saved" && run ? `Saved run ${runLabel(run.sequence)} · ${readable(run.created_at)}` : `Scratch · ${scratch ? readable(scratch.at) : ""}`}
                      </th>
                      <th scope="col" className="es08-num">Proposed · live</th>
                      <th scope="col" className="es08-num">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {live.map((m) => {
                      const b = baseline.find((x) => x.id === m.id),
                        d = delta(m, b);
                      return (
                        <tr key={m.id} data-total={m.money || undefined}>
                          <th scope="row">{m.label}</th>
                          <td className="es08-num es08-sub">{b ? show(b) : "—"}</td>
                          <td className="es08-num">{show(m)}</td>
                          <td className={`es08-num ${d.tone}`}>{d.text}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="es08-sub es08-card-note">The proposed total is the live preview before keep-saved decisions. The new run records the resolved line set and its own total.</p>
              </>
            ) : (
              <div className="es08-empty">
                <strong>{against === "saved" ? "No saved run to compare against" : "No scratch baseline captured"}</strong>
                <p className="es08-sub">
                  {against === "saved"
                    ? "Save the first run to record a baseline. Until then, capture a scratch baseline for side-by-side trials."
                    : "A scratch baseline holds the headline metrics of the current configuration for side-by-side trials. It lives only in this session and is never saved as a run."}
                </p>
              </div>
            )}
          </section>
          <section className="es08-card" aria-labelledby="es08-changes-h">
            <div className="es08-card-head">
              <h3 id="es08-changes-h">Line changes by stable key</h3>
              <ul aria-label="Change summary" className="es08-pills">
                {kinds
                  .filter((k) => byKind[k].length || k === "Unchanged" || k === "Changed")
                  .map((k) => (
                    <li key={k}>
                      <Pill tone={k === "Changed" ? "info" : k === "Unchanged" || k === "Added" ? "neutral" : "warn"}>
                        {k} {byKind[k].length}
                      </Pill>
                    </li>
                  ))}
              </ul>
            </div>
            {!fresh && <p className="es08-sub es08-card-note">{bench.calculating ? "Recalculating the comparison…" : "Inputs changed after this comparison; the line list refreshes with the next calculation."}</p>}
            {fresh && !run && !comparison.length && <p className="es08-sub es08-card-note">No saved run yet: every active line is new in this run. Save run {nextRun} to record the first baseline.</p>}
            {byKind.Changed.length > 0 && (
              <>
                <div className="es08-group-title es08-tone-info">Changed · regenerated from the rules</div>
                <ul className="es08-changes">
                  {byKind.Changed.map((r) => (
                    <li key={r.key} className="es08-change">
                      <span className="es08-mono es08-sub">{r.key}</span>
                      <span className="es08-strong">{r.candidate?.description ?? r.key}</span>
                      <span className="es08-num">
                        <span className="es08-sub">{value(r.current)}</span> → <strong>{value(r.candidate)}</strong>
                      </span>
                      <span className="es08-num es08-tone-info es08-strong">{r.current?.effective_quantity && r.candidate?.effective_quantity ? `${Number(r.candidate.effective_quantity.display) - Number(r.current.effective_quantity.display) > 0 ? "+" : ""}${fmt(Number(r.candidate.effective_quantity.display) - Number(r.current.effective_quantity.display), 2)}` : ""}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {byKind.Added.length > 0 && (
              <>
                <div className="es08-group-title">Added · new in this run</div>
                <ul className="es08-changes">
                  {byKind.Added.slice(0, 12).map((r) => (
                    <li key={r.key} className="es08-change">
                      <span className="es08-mono es08-sub">{r.key}</span>
                      <span className="es08-strong">{r.candidate?.description ?? r.key}</span>
                      <span className="es08-num">{value(r.candidate)}</span>
                      <span />
                    </li>
                  ))}
                  {byKind.Added.length > 12 && <li className="es08-sub es08-change-more">{byKind.Added.length - 12} more added lines</li>}
                </ul>
              </>
            )}
            <DecisionRows rows={required} choose={(k, choice) => bench.decide(k, choice)} disabled={frozen} title="Manual edit, removal or new identity on a saved line · choose one" />
            <div className="es08-card-foot">
              <span className="es08-sub">{byKind.Unchanged.length} unchanged lines keep their saved values and rates.</span>
            </div>
          </section>
        </div>
        <aside className="es08-stack" aria-label="Record run">
          <section className="es08-card es08-record" aria-labelledby="es08-save-h">
            <div className="es08-card-head es08-card-head--stack">
              <span className="es08-eyebrow">Record run</span>
              <h3 id="es08-save-h">Save as run {nextRun}</h3>
            </div>
            <ul aria-label="Save requirements" className="es08-checks">
              {checks.map((ck) => (
                <li key={ck.label}>
                  <span className={`es08-check-mark es08-check-mark--${ck.ok ? "ok" : "warn"}`} aria-hidden="true">
                    {ck.ok ? "✓" : "!"}
                  </span>
                  <span>
                    <span className="es08-strong">{ck.label}</span>
                    <span className={`es08-sub ${ck.ok ? "es08-tone-ok" : "es08-tone-warn"}`}>{ck.status}</span>
                  </span>
                </li>
              ))}
            </ul>
            <button type="button" className="ppo-button" disabled={frozen || !c} onClick={bench.openManual}>
              Review all manual quantities
            </button>
            <label className="es08-ack">
              <input type="checkbox" checked={ack} disabled={frozen} onChange={(e) => setAck(e.target.checked)} />
              <span>I understand run {nextRun} is a local design record, not an issued estimate.</span>
            </label>
            <div className="es08-record-actions">
              <button type="button" className="ppo-button ppo-button--primary" disabled={!canSave} aria-describedby="es08-save-why" onClick={() => void bench.saveReview()}>
                Save review run
              </button>
              <button
                type="button"
                className="ppo-button"
                disabled={frozen || (!decisions.length && !ack)}
                onClick={() => {
                  for (const d of decisions) bench.decide(d.key, "generated");
                  setAck(false);
                }}
              >
                Cancel comparison
              </button>
            </div>
            <p id="es08-save-why" className={`es08-sub ${blockers.length ? "es08-tone-warn" : "es08-tone-ok"}`}>
              {frozen ? "Saving is unavailable in this state." : blockers.length ? `To save: ${blockers.join(", ")}.` : `Ready to save run ${nextRun}.`}
            </p>
          </section>
          <section className="es08-card es08-card--dashed" aria-labelledby="es08-send-h">
            <h3 id="es08-send-h">Send to estimate</h3>
            {!data.estimate ? (
              <p className="es08-sub">
                No estimate has been created. <Link href={`/estimating/discovery/${data.draft.binding.estimating_workspace_id}`}>Open discovery costing</Link> to create an exact bound estimate first.
              </p>
            ) : (
              <>
                <p className="es08-sub">
                  Applies the saved run&apos;s resolved lines to estimate v{data.estimate.version} as a synthetic contribution under SYN-EST-ARITHMETIC-01. Engineering acceptance stays open; nothing here is an issued estimate.
                  {rollBlocks ? " Blocked while the roll is too narrow for the cloth (DEC-R2)." : ""}
                </p>
                <NativePrices bench={bench} />
                <div className="es08-record-actions">
                  <button type="button" className="ppo-button" disabled={frozen || !run || bench.dirty || rollBlocks} onClick={() => void bench.reviewReceiving()}>
                    Review estimate changes
                  </button>
                </div>
                {bench.dirty && run && <p className="es08-sub es08-tone-warn">Save the draft before reviewing estimate changes; receiving reads the saved run.</p>}
                {bench.receivingError ? <Notice tone="danger" title="Receiving preview unavailable">{String((bench.receivingError as { message?: string }).message ?? "Retry the review.")}</Notice> : null}
                {bench.receiving && (
                  <div className="es08-receiving">
                    {bench.receiving.blockers.length > 0 && (
                      <Notice tone="warn" title="Receiving blocked">
                        <ul className="es08-list">
                          {bench.receiving.blockers.map((b, i) => (
                            <li key={i}>
                              <span className="es08-mono">{b.key}</span>: {b.message}
                            </li>
                          ))}
                        </ul>
                      </Notice>
                    )}
                    <DecisionRows rows={bench.receiving.comparison.filter((r) => r.required) as Row[]} choose={(k, choice) => bench.decide(k, choice, true)} disabled={frozen} title="Saved estimate lines changed · choose one" tone="danger" />
                    <p className="es08-sub">
                      {bench.receiving.lines.length} resulting cost lines · cost AUD {bench.receiving.totals.cost} · sell AUD {bench.receiving.totals.sell}.{" "}
                      {bench.receiving.already_current ? "Exact accepted contribution is already current." : "A separate estimate version will be saved."}
                    </p>
                    <div className="es08-record-actions">
                      <button type="button" className="ppo-button ppo-button--primary" disabled={frozen || bench.receiving.blockers.length > 0} onClick={() => void bench.apply()}>
                        Apply reviewed changes
                      </button>
                      <button type="button" className="ppo-button" onClick={bench.cancelReceiving}>
                        Cancel receiving comparison
                      </button>
                    </div>
                  </div>
                )}
                <p className="es08-sub">
                  Saved estimate v{data.estimate.version}: AUD {data.estimate.sell ?? "Unavailable"} · existing quotations retain their earlier exact version.{" "}
                  <Link href={`/estimating/estimates/${data.estimate.id}`}>Open saved estimate</Link>
                </p>
              </>
            )}
          </section>
          <p className="es08-sub">Saving never rewrites run {run ? runLabel(run.sequence) : "history"}. Cancelling discards pending decisions and leaves saved lines and runs unchanged.</p>
        </aside>
      </div>
    </div>
  );
}
