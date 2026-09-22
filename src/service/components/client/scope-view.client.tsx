"use client";
import Link from "next/link";
import { SummaryPair, Status, Stamp } from "../../../components/business-ui";
import type { Order } from "../../../components/work-order-screens";
export function ScopeView({ r }: { r: Order["scopes"][number] }) {
  return (
    <>
      <p className="preserve-lines lede">
        {r.summary ?? "Scope summary needed"}
      </p>
      {r.change_reason && (
        <p className="callout">
          <strong>Change reason:</strong> {r.change_reason}
        </p>
      )}
      <dl className="summary-grid">
        <SummaryPair label="Exclusions">
          <span className="preserve-lines">
            {r.exclusions ?? "Not recorded"}
          </span>
        </SummaryPair>
        <SummaryPair label="Limited diagnostic authority">
          <span className="preserve-lines">
            {r.diagnostic_limit ?? "Not recorded"}
          </span>
        </SummaryPair>
        <SummaryPair label="Account and charging review">
          <span className="preserve-lines">
            {r.pending_account_plan ?? "Not recorded"}
          </span>
        </SummaryPair>
      </dl>
      {r.items.map((i) => (
        <article key={i.id} className="wo-task">
          <h3>
            {i.sequence}. {i.task_description}
          </h3>
          <Status value={i.task_kind} />
          <p>
            <strong>Expected outcome:</strong> {i.expected_outcome}
          </p>
          <ul>
            {i.completion_requirements.map((x, j) => (
              <li key={j}>{x}</li>
            ))}
          </ul>
          {i.required_skill_codes.length > 0 && (
            <p>Competencies: {i.required_skill_codes.join(", ")}</p>
          )}
          {i.shutdown_condition && (
            <p>Shutdown / isolation: {i.shutdown_condition}</p>
          )}
          {i.access_condition && <p>Access: {i.access_condition}</p>}
          {i.assets.map((a) => (
            <div key={a.asset_id} className="wo-asset">
              <Link href={`/equipment/${a.asset_id}`}>
                {a.description} · {a.display_number}
              </Link>{" "}
              <Status value={a.identity_status} />
              {a.identity_status !== "Verified" && (
                <p>
                  Identity remains unresolved or disputed. Only a reviewed
                  identification plan can permit the defined limited task.
                </p>
              )}
              {a.configuration_status && (
                <p>Configuration: {a.configuration_status}</p>
              )}
              {a.method && (
                <>
                  <p>
                    <strong>Identification method:</strong> {a.method}
                  </p>
                  <p>
                    <strong>Limits:</strong> {a.limits}
                  </p>
                  <p>
                    {r.approved_at
                      ? "Plan approved with this exact scope."
                      : "Plan awaits scope authorisation."}
                  </p>
                </>
              )}
            </div>
          ))}
        </article>
      ))}
      <div className="wo-two-column">
        <section>
          <h3>Coverage</h3>
          <Status value={r.coverage?.status ?? "Unknown"} />
          <p>{r.coverage?.assessment ?? "Assessment not recorded."}</p>
          <p>{r.coverage?.reason}</p>
          {r.coverage?.agreement_reference && (
            <p>
              {r.coverage.agreement_reference} · version{" "}
              {r.coverage.source_version ?? "Unknown"}
            </p>
          )}
          <p>
            Charging route:{" "}
            {r.coverage?.charging_route === "ContractReference"
              ? "Contract reference for separate review"
              : "Finance review pending"}
          </p>
          <p className="read-meta">
            No automatic free work, invoice or supplier recovery.
          </p>
        </section>
        <section>
          <h3>Authority evidence</h3>
          {r.authority ? (
            <>
              <strong>{r.authority.title}</strong>
              <p>
                {r.authority.source_reference} · version{" "}
                {r.authority.source_version}
              </p>
              <p className="preserve-lines">{r.authority.content_text}</p>
              <small>Synthetic manual evidence</small>
            </>
          ) : (
            <p>Authority evidence is missing.</p>
          )}
        </section>
      </div>
      {r.approved_at && (
        <aside className="callout">
          <strong>Authorised scope — read-only</strong>
          <p>
            Authorised <Stamp value={r.approved_at} />. Changes require a
            successor revision and fresh review.
          </p>
          <details>
            <summary>Exact approval identity</summary>
            <p>Reviewer: {r.approved_by}</p>
            <p className="hash">Scope hash: {r.content_hash}</p>
          </details>
        </aside>
      )}
    </>
  );
}
