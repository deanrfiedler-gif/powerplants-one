"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useCrmResource } from "./crm-state";
import { useIdentity } from "./business-session";
import { Button, ButtonLink } from "./ui/button";
import { RecordTabs } from "./record-ui";
import { usePhoneHeader } from "../shell/phone-header";
import { formatDateTime } from "../shell/date-format";
import {
  CostSourceIcon as Icon,
  CostSourceReadNotice,
  CostSourceState,
} from "./cost-source-register-parts";
import {
  exactSourceHref,
  sourceChanges,
  sourceDate,
  sourceMoney,
  type CostSourceDetailData,
  type CostSourceRow,
} from "../estimating/cost-source-register-model";

function Fact({
  icon,
  children,
  label,
}: {
  icon: string;
  children: ReactNode;
  label: ReactNode;
}) {
  return (
    <div className="cs-fact">
      <Icon name={icon} />
      <div>
        {children}
        <small>{label}</small>
      </div>
    </div>
  );
}
export function CostSourceSnapshot({
  row,
  rows,
  phone,
  onSelect,
  onClose,
  onRefresh,
}: {
  row: CostSourceRow;
  rows: CostSourceRow[];
  phone: boolean | null;
  onSelect: (row: CostSourceRow) => void;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const identity = useIdentity(),
    panel = useRef<HTMLDivElement>(null),
    [tab, setTab] = useState("changes");
  const resource = useCrmResource<CostSourceDetailData>(
    `estimating/cost-sources/${row.id}?revision_id=${row.revision_id}`,
    true,
  );
  const detail = resource.error ? null : resource.data,
    revision = detail?.revision,
    content = revision?.content;
  const index = rows.findIndex((r) => r.id === row.id),
    previous = index > 0 ? rows[index - 1] : null,
    next = rows[index + 1];
  useEffect(() => {
    panel.current?.focus({ preventScroll: true });
  }, []);
  usePhoneHeader(
    phone
      ? {
          title: "Source snapshot",
          record: {
            position: `${index + 1} of ${rows.length}`,
          back: { label: "Back to cost sources", onSelect: onClose },
            previous: {
              label: "Previous source",
              disabled: !previous,
              onSelect: () => {
                if (previous) onSelect(previous);
              },
            },
            next: {
              label: "Next source",
              disabled: !next,
              onSelect: () => {
                if (next) onSelect(next);
              },
            },
            more: [{ label: "Back to cost sources", onSelect: onClose }],
          },
        }
      : null,
  );
  const exact =
    !!detail &&
    detail.revision.id === row.revision_id &&
    detail.revision.content_hash === row.content_hash;
  const stale = exact && detail.source.version !== row.version;
  const event = detail?.history.find((e) => e.revision_id === row.revision_id);
  const state =
    event?.action === "DraftSaved"
      ? "Draft"
      : event?.action === "Submitted"
        ? "Submitted"
        : (event?.action ?? "Draft");
  const usage =
    detail?.affected.filter((b) => b.source_revision_id === row.revision_id) ??
    [];
  const person = (id: string) => (id === identity.actor_id ? "You" : id);
  const href = exactSourceHref(row.id, row.revision_id);
  return (
    <div
      className="cs-snapshot"
      ref={panel}
      role="region"
      aria-label="Source snapshot"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <div className="cs-snapshot-controls">
        <Button variant="quiet" aria-label="Close snapshot" onClick={onClose}>
          <Icon name="xmark" />
        </Button>
        <Button
          variant="quiet"
          aria-label="Previous source"
          disabled={!previous}
          onClick={() => previous && onSelect(previous)}
        >
          <span className="cs-up">
            <Icon name="chevron-down" />
          </span>
        </Button>
        <Button
          variant="quiet"
          aria-label="Next source"
          disabled={!next}
          onClick={() => next && onSelect(next)}
        >
          <Icon name="chevron-down" />
        </Button>
      </div>
      {!detail || !exact ? (
        <div className="cs-snapshot-scroll">
          <h2>Source snapshot</h2>
          <CostSourceReadNotice {...resource} />
          {detail && !exact && (
            <div role="alert">
              <p>
                The returned evidence does not match the selected revision.
                Refresh the register before opening it again.
              </p>
              <Button onClick={onRefresh}>Refresh register</Button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="cs-snapshot-record">
            <div className="cs-snapshot-scroll">
              <header>
                <h2>{content!.title}</h2>
                <p className="cs-small">
                  {detail.source.reference} · source revision r
                  {revision!.revision}
                </p>
                <div className="cs-status-line">
                  <span className="mw-tag">Synthetic</span>
                  <CostSourceState
                    row={{
                      state,
                      your_submission:
                        state === "Submitted" &&
                        (detail.source.owner_id === identity.actor_id ||
                          revision!.created_by === identity.actor_id),
                    }}
                  />
                </div>
              </header>
              {stale && (
                <div className="cs-rule" role="status">
                  The source changed after this row was loaded. This is still
                  the selected r{revision!.revision}; current source state:{" "}
                  {detail.source.state}.{" "}
                  <Button onClick={onRefresh}>Refresh register</Button>
                </div>
              )}
              <section className="cs-facts">
                <h3>Source</h3>
                <Fact
                  icon="building"
                  label={
                    <>
                      Supplier · external company/entity key{" "}
                      {content!.supplier_entity_key ?? "Unknown"}
                    </>
                  }
                >
                  {content!.supplier_label}
                </Fact>
                <Fact icon="tags" label="Item and unit, fixed for this source">
                  {content!.item_reference}, per {content!.unit}
                </Fact>
                <Fact
                  icon="calendar"
                  label="Effective from and supplier expiry"
                >
                  {sourceDate(content!.effective_from)} to{" "}
                  {sourceDate(content!.valid_until)}
                </Fact>
                <Fact
                  icon="files"
                  label={
                    <>
                      Evidence reference · source date{" "}
                      {sourceDate(content!.source_date)}
                    </>
                  }
                >
                  {content!.evidence_reference}
                </Fact>
                <Fact icon="user" label="Source owner">
                  {person(detail.source.owner_id)}
                </Fact>
                <Fact
                  icon="user"
                  label={
                    <>
                      Author of r{revision!.revision}
                      {detail.can_review && !stale
                        ? " · eligible for independent review"
                        : ""}
                    </>
                  }
                >
                  {person(revision!.created_by)}
                </Fact>
              </section>
              <section>
                <h3>
                  Quantity tiers, r{revision!.revision} · AUD excluding tax
                </h3>
                <table className="cs-tiers">
                  <caption className="sr-only">
                    Exact quantity tiers for revision {revision!.revision}
                  </caption>
                  <thead>
                    <tr>
                      <th>Minimum quantity</th>
                      <th>Unit cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {content!.tiers.map((t) => (
                      <tr key={t.minimum_quantity}>
                        <td>
                          {t.minimum_quantity} {content!.unit}
                        </td>
                        <td>
                          {sourceMoney(t.unit_cost)} / {content!.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="cs-small">
                  An estimate line uses the highest minimum quantity not above
                  its quantity. Units must match exactly; below{" "}
                  {content!.tiers[0].minimum_quantity} {content!.unit} there is
                  no price.
                </p>
              </section>
              <p className="cs-rule">
                A review checks this revision’s evidence. It does not approve an
                estimate or quotation. Saved prices remain unchanged until
                someone compares costs and saves a new estimate version. Unknown
                expiry is a warning, not perpetual validity.
              </p>
            </div>
            <footer className="cs-snapshot-footer">
              <ButtonLink href={href}>Open source</ButtonLink>
              {detail.can_review && !stale && (
                <ButtonLink variant="primary" href={`${href}#source-review`}>
                  Review evidence
                </ButtonLink>
              )}
            </footer>
          </div>
          <div className="cs-snapshot-activity">
            <section className="cs-evidence-tabs">
              <RecordTabs
                id="cs-evidence"
                label="Source evidence"
                value={tab}
                onChange={setTab}
                tabs={[
                  {
                    id: "changes",
                    label: detail.previous_revision
                      ? `Changes from r${detail.previous_revision.revision}`
                      : "Changes",
                  },
                  { id: "evidence", label: "Evidence" },
                  { id: "usage", label: "Used in" },
                ]}
              />
              <div
                role="tabpanel"
                id={`cs-evidence-panel-${tab}`}
                aria-labelledby={`cs-evidence-tab-${tab}`}
                tabIndex={0}
              >
                {tab === "changes" && (
                  <>
                    {!detail.previous_revision ? (
                      <p>This is the first revision.</p>
                    ) : (
                      <>
                        <dl className="cs-changes">
                          {sourceChanges(detail).map((change) => (
                            <div key={change.field}>
                              <dt>{change.field}</dt>
                              <dd>
                                <span>
                                  r{detail.previous_revision!.revision}
                                </span>
                                <pre>{change.before}</pre>
                              </dd>
                              <dd>
                                <span>r{revision!.revision}</span>
                                <pre>{change.after}</pre>
                              </dd>
                            </div>
                          ))}
                        </dl>
                        <p className="cs-small">
                          Only changed fields are listed. Supplier, item and
                          unit stay fixed.
                        </p>
                      </>
                    )}
                    <p>
                      Reason for r{revision!.revision}: {revision!.reason}
                    </p>
                  </>
                )}
                {tab === "evidence" && (
                  <>
                    <h3>{content!.evidence_reference}</h3>
                    <p className="cs-narrative">{content!.evidence_excerpt}</p>
                    <dl className="cs-identities">
                      <dt>Exact revision</dt>
                      <dd>{revision!.id}</dd>
                      <dt>Content hash</dt>
                      <dd>{revision!.content_hash}</dd>
                      <dt>Source owner</dt>
                      <dd>{detail.source.owner_id}</dd>
                      <dt>Revision author</dt>
                      <dd>{revision!.created_by}</dd>
                    </dl>
                    {content!.fx && (
                      <p>
                        This revision retains reviewed FX evidence. Open the
                        native source for its exact currency, rate and
                        confirmation details.
                      </p>
                    )}
                  </>
                )}
                {tab === "usage" && (
                  <>
                    <p>
                      Permitted saved estimate-line bindings to r
                      {revision!.revision}. Each link retains the original
                      estimate version.
                    </p>
                    {!detail.affected_complete && (
                      <p className="cs-rule" role="status">
                        Partial usage: only the latest {detail.affected_limit}{" "}
                        candidate bindings across this source were checked.
                        Older bindings may be absent; this is not a total.
                      </p>
                    )}
                    {!usage.length ? (
                      <p>
                        {detail.affected_complete
                          ? "No permitted typed bindings to this revision were found."
                          : "No permitted bindings to this revision in the returned window."}{" "}
                        Legacy free-text mentions are not typed bindings.
                      </p>
                    ) : (
                      <ul>
                        {usage.map((b) => (
                          <li key={`${b.estimate_version_id}:${b.line_id}`}>
                            <Link
                              href={`/estimating/estimates/${b.estimate_id}/sources?version_id=${b.estimate_version_id}`}
                            >
                              {b.display_number} · estimate version {b.version}
                            </Link>
                            <p className="cs-small">
                              {b.is_current
                                ? "Current saved version"
                                : "Historical version; retained"}{" "}
                              · line {b.line_id}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>
            </section>
            <section className="cs-history">
              <h2>History</h2>
              <ol>
                {detail.history.map((e) => {
                  const r = detail.revisions.find(
                    (r) => r.id === e.revision_id,
                  );
                  return (
                    <li key={e.id}>
                      <strong>
                        {e.action === "DraftSaved" ? "Draft saved" : e.action} ·{" "}
                        <Link href={exactSourceHref(row.id, e.revision_id)}>
                          r{r?.revision ?? "—"}
                        </Link>
                      </strong>
                      <p>{formatDateTime(String(e.created_at))}</p>
                      <p>{e.reason}</p>
                      <small>
                        {["Reviewed", "Returned", "Rejected"].includes(e.action)
                          ? "Independent reviewer"
                          : e.action === "Submitted"
                            ? "Submitted by"
                            : "Revision author"}
                        : {person(e.created_by)}
                      </small>
                    </li>
                  );
                })}
              </ol>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
