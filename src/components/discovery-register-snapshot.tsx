"use client";
import { useEffect, useRef, useState } from "react";
import { useCrmResource } from "./crm-state";
import { Button, ButtonLink } from "./ui/button";
import { DiscoveryRegisterIcon as Icon } from "./discovery-register-icon";
import { RecordPanel, RecordTabs } from "./record-ui";
import { RegisterChip } from "./ui/register-table";
import {
  costLabel,
  optionLetter,
  revisionLabel,
  selectedOption,
  type DiscoveryRegisterRow,
} from "../estimating/discovery-register-model";
import type { readDiscoveryWorkspace } from "../estimating/discovery-workspaces";
import type {
  listDiscoveryHistory,
  readDiscoverySummary,
} from "../estimating/discovery-reads";
import { formatDateTime } from "../shell/date-format";

type Detail = Awaited<ReturnType<typeof readDiscoveryWorkspace>>;
type History = Awaited<ReturnType<typeof listDiscoveryHistory>>;
type Summary = Awaited<ReturnType<typeof readDiscoverySummary>>;
const date = (value: string | Date) => formatDateTime(String(value));
export function DiscoverySnapshot({
  row,
  rows,
  onSelect,
  onClose,
}: {
  row: DiscoveryRegisterRow;
  rows: DiscoveryRegisterRow[];
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null),
    [tab, setTab] = useState("alternatives"),
    [before, setBefore] = useState<number | null>(null);
  const detail = useCrmResource<Detail>(
    `estimating/workspaces/${row.id}`,
    true,
  );
  const selectedId = detail.data?.workspace.selected_option_id;
  const selected = detail.data?.options.find((o) => o.option.id === selectedId);
  const history = useCrmResource<History>(
    selectedId
      ? `estimating/workspaces/${row.id}/history?option_id=${selectedId}${before ? `&before=${before}` : ""}`
      : null,
    true,
  );
  const activity = useCrmResource<History>(
    selectedId
      ? `estimating/workspaces/${row.id}/history?option_id=${selectedId}`
      : null,
    true,
  );
  const summary = useCrmResource<Summary>(
    selectedId
      ? `estimating/workspaces/${row.id}/summary?option_id=${selectedId}`
      : null,
    true,
  );
  useEffect(() => {
    panel.current?.focus();
  }, []);
  const index = rows.findIndex((r) => r.id === row.id),
    option = selectedOption(row);
  const cost = summary.error ? null : summary.data;
  const revision = selected?.revision;
  return (
    <div
      className="dr-snapshot"
      ref={panel}
      role="region"
      aria-label={`Discovery snapshot: ${row.title}`}
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <div className="dr-snapshot-controls">
        <Button variant="quiet" aria-label="Close snapshot" onClick={onClose}>
          <Icon name="close" />
        </Button>
        <Button
          variant="quiet"
          aria-label="Previous workspace"
          disabled={index <= 0}
          onClick={() => onSelect(rows[index - 1].id)}
        >
          <Icon name="chevron-left" />
        </Button>
        <Button
          variant="quiet"
          aria-label="Next workspace"
          disabled={index === rows.length - 1}
          onClick={() => onSelect(rows[index + 1].id)}
        >
          <Icon name="chevron-right" />
        </Button>
      </div>
      <div className="dr-snapshot-record">
        <div className="dr-snapshot-scroll">
          <header>
            <h2>{row.title}</h2>
            <p className="dr-small">
              {row.display_number} · {row.customer.name} ·{" "}
              {revision?.observed_context?.site?.display_name ??
                "Site not recorded"}{" "}
              · {row.owner.name}
            </p>
            {revision && (
              <RegisterChip
                tone={
                  revision.scope_readiness === "Complete"
                    ? "positive"
                    : revision.scope_readiness === "Incomplete"
                      ? "attention"
                      : "neutral"
                }
              >
                {revision.kind === "LegacyManual"
                  ? "Legacy manual"
                  : revision.scope_readiness === "NotRecorded"
                    ? "Not recorded"
                    : revision.scope_readiness}
              </RegisterChip>
            )}
          </header>
          {detail.loading && <p role="status">Loading current workspace…</p>}
          {!!detail.error && (
            <div className="dr-notice dr-error" role="alert">
              <strong>Workspace details could not be loaded</strong>
              <p>The earlier summary is not confirmation of current access.</p>
              <Button onClick={detail.reload}>Retry loading details</Button>
            </div>
          )}
          {revision && (
            <>
              <section>
                <h3>
                  Selected basis · {optionLetter(selected!.option.ordinal)} —{" "}
                  {selected!.option.label}
                </h3>
                <div className="dr-fact">
                  <Icon name="summary" />
                  <div>
                    Discovery{" "}
                    {revision.kind === "LegacyManual"
                      ? "Legacy manual"
                      : revisionLabel(revision.version)}{" "}
                    · saved {date(revision.created_at)}
                    <small>{revision.reason}</small>
                  </div>
                </div>
                <div className="dr-fact">
                  <Icon name="warning" />
                  <div>
                    {revision.scope_readiness === "NotRecorded"
                      ? "Not recorded"
                      : revision.scope_readiness}
                    <small>
                      {selected?.evaluation?.open_items.length
                        ? `${selected.evaluation.open_items.length} recorded follow-up${selected.evaluation.open_items.length === 1 ? "" : "s"}`
                        : "No open follow-ups recorded"}
                    </small>
                  </div>
                </div>
                {revision.input && (
                  <div className="dr-fact">
                    <Icon name="family" />
                    <div>
                      {revision.input.scope.systems.length} systems ·{" "}
                      {revision.input.scope.facility_ids.length} facilities
                      <small>
                        {revision.input.scope.systems
                          .map((s) => s.tag.replace(/([a-z])([A-Z])/g, "$1 $2"))
                          .join(" · ") || "No systems recorded"}
                      </small>
                    </div>
                  </div>
                )}
              </section>
              <section>
                <h3>Cost basis</h3>
                {summary.loading ? (
                  <p role="status">Loading permitted cost basis…</p>
                ) : summary.error || cost?.status === "Unavailable" ? (
                  <>
                    <p>
                      Cost basis unavailable. It is not known whether the latest
                      revision is costed.
                    </p>
                    <Button onClick={summary.reload}>Retry cost basis</Button>
                  </>
                ) : cost?.status === "Available" ? (
                  <>
                    <div className="dr-fact">
                      <Icon name="document" />
                      <div>
                        Estimate v{cost.version} ·{" "}
                        {cost.sell_total === null
                          ? "Amount not recorded"
                          : `AUD ${Number(cost.sell_total).toLocaleString("en-AU", { minimumFractionDigits: 2 })}`}{" "}
                        excl. tax
                        <small>
                          {cost.basis
                            ? `Costed on discovery ${revisionLabel(cost.basis.revision)}`
                            : "Manual basis"}{" "}
                          · tax not calculated
                        </small>
                      </div>
                    </div>
                    {cost.basis?.revision_id !== revision.id && (
                      <div className="dr-fact dr-warning">
                        <Icon name="warning" />
                        <div>
                          Discovery {revisionLabel(revision.version)} differs
                          from this cost basis
                          <small>
                            Saved prices stay unchanged until a Complete
                            revision is costed.
                          </small>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p>No saved estimate.</p>
                )}
              </section>
              <p className="dr-rule">
                Read-only. The register opens a workspace; it never edits
                discovery, costs it or prices it. Complete discovery is scope
                evidence only and issues no quotation.
              </p>
            </>
          )}
        </div>
        <footer>
          {cost?.status === "Available" && !detail.error && (
            <ButtonLink
              href={`/estimating/estimates/${cost.estimate_id}?version_id=${cost.estimate_version_id}`}
            >
              Open estimate
            </ButtonLink>
          )}
          <ButtonLink
            variant="primary"
            href={`/estimating/discovery/${row.id}`}
          >
            Open workspace
          </ButtonLink>
        </footer>
      </div>
      <div className="dr-snapshot-activity">
        <div className="dr-tabs-card">
          <RecordTabs
            id="discovery-snapshot"
            label="Discovery evidence"
            value={tab}
            onChange={setTab}
            tabs={[
              {
                id: "alternatives",
                label: `Alternatives${detail.data ? ` · ${detail.data.options.length}` : ""}`,
              },
              {
                id: "revisions",
                label: `Revisions${selected?.history_count != null ? ` · ${selected.history_count}` : ""}`,
              },
            ]}
          />
          <RecordPanel id="discovery-snapshot" tab="alternatives" value={tab}>
            {detail.data && (
              <>
                <p>
                  {detail.data.options.length} of 10 alternatives ·{" "}
                  {
                    detail.data.options.filter(
                      (o) => o.option.state === "Archived",
                    ).length
                  }{" "}
                  archived · amounts are never summed
                </p>
                {detail.data.options.map((o) => (
                  <div className="dr-fact" key={o.option.id}>
                    <Icon
                      name={o.option.id === selectedId ? "check" : "copy"}
                    />
                    <div>
                      {optionLetter(o.option.ordinal)} — {o.option.label}
                      {o.option.id === selectedId ? " · Selected basis" : ""}
                      <small>
                        {o.option.state} · {revisionLabel(o.revision.version)}{" "}
                        {o.revision.scope_readiness} ·{" "}
                        {o.cost.status === "Available"
                          ? `estimate v${o.cost.version}${o.cost.basis ? ` on ${revisionLabel(o.cost.basis.revision)}` : " · manual basis"}`
                          : o.cost.status === "NoEstimate"
                            ? "not costed"
                            : "cost basis unavailable"}
                      </small>
                    </div>
                  </div>
                ))}
              </>
            )}
          </RecordPanel>
          <RecordPanel id="discovery-snapshot" tab="revisions" value={tab}>
            {history.loading && <p role="status">Loading saved revisions…</p>}
            {!!history.error && (
              <p role="alert">
                Revision history unavailable. No history count is inferred.
              </p>
            )}
            {history.data?.items.map((r) => (
              <div className="dr-fact" key={r.id}>
                <Icon name="history" />
                <div>
                  {revisionLabel(r.version)} · {r.scope_readiness}
                  <small>
                    {date(r.created_at)} · {r.author}
                  </small>
                  <small>{r.reason}</small>
                </div>
              </div>
            ))}
            {history.data?.next && (
              <Button onClick={() => setBefore(history.data!.next)}>
                Older revisions
              </Button>
            )}
            {before && (
              <Button onClick={() => setBefore(null)}>Latest revisions</Button>
            )}
          </RecordPanel>
        </div>
        <section>
          <h3>Recent activity</h3>
          <p className="dr-small">
            Saved discovery · selected option {optionLetter(option.ordinal)}
          </p>
          {activity.loading && <p role="status">Loading activity…</p>}
          {!!activity.error && <p>Discovery activity unavailable.</p>}
          {activity.data?.items.slice(0, 4).map((r) => (
            <div className="dr-activity" key={r.id}>
              <span aria-hidden="true" />
              <div>
                Discovery {revisionLabel(r.version)} saved
                <small>
                  {date(r.created_at)} · {r.author} · {r.scope_readiness}
                </small>
              </div>
            </div>
          ))}
        </section>
      </div>
      <span className="sr-only">Register summary: {costLabel(row)}</span>
    </div>
  );
}
