"use client";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  Field,
  PageHeader,
  ReadState,
  SelectField,
  ValidationFields,
} from "./business-ui";
import { useCrmCommand, useCrmResource } from "./crm-state";
import { useContactView } from "./contact-workspace";
import { LocalDateTimeField, RecordPanel, RecordTabs } from "./record-ui";
import { Button } from "./ui/button";
import { SharedRecord, RecordFactSection } from "./ui/shared-record";
import { WorklistMenu } from "./crm-worklist-tools";
import { ProductIcon } from "./product-icons";
import {
  CommandStatus,
  ContentEditor,
  MultiChoice,
  type CsOptions,
} from "./cs-forms";
import { CreateCs } from "./cs-workspace";
import { usePhoneHeader } from "../shell/phone-header";
import type { listCs, readCs } from "../shared/cs/service";
import type {
  CsRow,
  Evidence,
  PreparationBasis,
  ReadinessContent,
} from "../shared/cs/model";
import type { assessPreparation } from "../shared/cs/readiness";
import "../app/styles/organisations.css";
import "../app/styles/access-readiness.css";

type Workspace = Awaited<ReturnType<typeof readCs>>;
const phoneQuery = "(max-width:780px)";
const subscribePhone = (listener: () => void) => {
  const media = window.matchMedia(phoneQuery);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
};
type Visit = Workspace["visits"][number];
type Check = {
  id: string;
  revision: number;
  recorded_at: string;
  recorded_by: string;
  recheck_required: boolean;
  basis: {
    preparation: PreparationBasis;
    assessment: ReturnType<typeof assessPreparation>;
    visit?: Visit;
  };
};
const sections = [
  { id: "overview", label: "Overview" },
  { id: "requirements", label: "Requirements" },
  { id: "evidence", label: "Evidence" },
  { id: "windows", label: "Work windows" },
  { id: "preparation", label: "Visit preparation" },
  { id: "history", label: "History" },
];
const boundary =
  "Acknowledging grants nothing: no work authority, booking, resource reservation, pack issue or dispatch clearance.";
const format = (
  value: string | Date | undefined,
  timezone = "Australia/Brisbane",
) =>
  value
    ? new Intl.DateTimeFormat("en-AU", {
        timeZone: timezone,
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(new Date(value))
    : "Not recorded";
const optionName = (
  items: { id: string; display_name: string }[],
  id: string | null | undefined,
  fallback = "Not recorded",
) => items.find((o) => o.id === id)?.display_name ?? fallback;
function Tag({
  children,
  warning = false,
}: {
  children: ReactNode;
  warning?: boolean;
}) {
  return (
    <span className={`readiness-tag${warning ? " readiness-tag-warning" : ""}`}>
      {children}
    </span>
  );
}
function Facts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="readiness-facts">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
function useFormFocus() {
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    form.current?.querySelector<HTMLElement>("textarea,select,input")?.focus();
  }, []);
  return form;
}
function Card({
  title,
  children,
  status,
}: {
  title: string;
  children: ReactNode;
  status?: ReactNode;
}) {
  return (
    <section className="readiness-card">
      <header>
        <h2>{title}</h2>
        {status}
      </header>
      {children}
    </section>
  );
}

export function AccessReadinessLanding({ siteId }: { siteId: string }) {
  const records = useCrmResource<Awaited<ReturnType<typeof listCs>>>(
    `cs/Readiness?context_id=${siteId}`,
    true,
  );
  usePhoneHeader(
    records.data?.items[0]
      ? null
      : {
          title: "Access & readiness",
          record: { position: "Access & readiness" },
        },
  );
  if (records.data?.items[0])
    return (
      <AccessReadinessWorkspace id={records.data.items[0].id} siteId={siteId} />
    );
  return (
    <section
      id="ppo-readiness"
      className="readiness-initial"
      data-module-layout="full-bleed"
    >
      <PageHeader
        eyebrow=""
        title="Access & readiness"
        description="Readiness unknown until requirements and evidence are recorded and checked."
      />
      <Link href={`/sites/${siteId}`}>Open Site</Link>
      <ReadState
        loading={records.loading}
        error={records.error}
        retry={records.reload}
      />
      {records.data && (
        <>
          <p>
            No requirements recorded. Missing requirements do not mean
            unrestricted access.
          </p>
          <CreateCs
            kind="Readiness"
            contextId={siteId}
            onSaved={records.reload}
          />
        </>
      )}
    </section>
  );
}

function AccessReadinessWorkspace({
  id,
  siteId,
}: {
  id: string;
  siteId: string;
}) {
  const resource = useCrmResource<Workspace>(`cs/Readiness/${id}`, true);
  const options = useCrmResource<CsOptions>(
    `cs/Readiness/options?context_id=${siteId}`,
    true,
  );
  return (
    <>
      <ReadState
        loading={resource.loading || options.loading}
        error={resource.error || options.error}
        retry={() => {
          resource.reload();
          options.reload();
        }}
      />
      {resource.data && options.data && (
        <Loaded
          key={`${id}:${resource.data.actor_id}:${resource.data.can_edit}:${resource.data.requirements_draft_access}`}
          data={resource.data}
          options={options.data}
          reload={resource.reload}
        />
      )}
    </>
  );
}

function Loaded({
  data,
  options,
  reload,
}: {
  data: Workspace;
  options: CsOptions;
  reload: () => void;
}) {
  const phone = useSyncExternalStore(
    subscribePhone,
    () => window.matchMedia(phoneQuery).matches,
    () => false,
  );
  const orderedSections = phone
    ? [
        sections[0],
        sections[2],
        { ...sections[3], label: "Windows" },
        sections[5],
        sections[1],
        sections[4],
      ]
    : sections;
  const row = data.record,
    content = row.content as ReadinessContent,
    site = options.context;
  const [view, setView] = useContactView(
    sections.map((s) => s.id),
    "overview",
  );
  const [visitId, setVisitId] = useState<string | null>(null);
  const [editor, setEditor] = useState<{
    mode: "requirements" | "evidence" | "windows";
    row: CsRow;
  } | null>(null);
  const [review, setReview] = useState<{
    evidence: Evidence;
    row: CsRow;
  } | null>(null);
  const [acknowledgement, setAcknowledgement] = useState<{
    check: Check;
    row: CsRow;
  } | null>(null);
  const [preparing, setPreparing] = useState<{
    row: CsRow;
    check?: Check;
    visit?: Visit;
  } | null>(null);
  const [reviewingDraft, setReviewingDraft] = useState<Workspace | null>(null);
  const [notice, setNotice] = useState("");
  const [savedFromVersion, setSavedFromVersion] = useState<number | null>(null);
  const refreshing =
    savedFromVersion !== null && row.version <= savedFromVersion;
  const canEdit = data.can_edit && !refreshing;
  const returnFocus = useRef<HTMLElement | null>(null);
  const rememberFocus = () => {
    returnFocus.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
  };
  const visits = data.visits;
  const checks = data.snapshots.filter(
    (s) => s.kind === "Preparation",
  ) as Check[];
  const selectedId =
    visitId ??
    (checks.length ? (checks[0].basis.visit?.id ?? "") : (visits[0]?.id ?? ""));
  const visit = visits.find((v) => v.id === selectedId);
  const check = checks.find((c) => (c.basis.visit?.id ?? "") === selectedId);
  const timezone = String(site.timezone || "Australia/Brisbane");
  const requirementsState =
    row.state === "Reviewed"
      ? `Reviewed · rev ${row.revision}`
      : `Recorded · rev ${row.revision} · review not established`;
  const status = !content.requirements.length
    ? "Readiness unknown"
    : !check || check.recheck_required
      ? "Recheck required"
      : check.basis.assessment.status;
  const completed = () => {
    setSavedFromVersion(row.version);
    reload();
    setNotice("Saved to the server. No authority to proceed was granted.");
    close();
  };
  const close = () => {
    requestAnimationFrame(() => {
      const previous = returnFocus.current;
      const target = previous?.isConnected
        ? previous
        : previous?.id
          ? document.getElementById(previous.id)
          : null;
      if (target?.getClientRects().length) target.focus();
      else
        document
          .querySelector<HTMLElement>(
            "#ppo-readiness [role=tab][aria-selected=true]",
          )
          ?.focus();
    });
  };
  const edit = (mode: "requirements" | "evidence" | "windows") => {
    rememberFocus();
    setEditor({
      mode,
      row:
        mode === "requirements" &&
        data.requirements_draft?.state !== "Reviewed" &&
        data.requirements_draft
          ? {
              ...row,
              content: {
                ...content,
                requirements: data.requirements_draft.basis.requirements,
              },
            }
          : row,
    });
    setView(mode);
  };
  const prepare = () => {
    rememberFocus();
    setPreparing({ row, check, visit });
    if (view !== "preparation") setView("preparation");
  };
  const more = sections
    .filter((s) => ["requirements", "preparation"].includes(s.id))
    .map((s) => ({ label: s.label, onSelect: () => setView(s.id) }));
  usePhoneHeader({
    title: "Access & readiness",
    record: {
      position: "Access & readiness",
      more: [
        ...more,
        {
          label: "Site details",
          onSelect: () => {
            document
              .getElementById("readiness-site-details")
              ?.scrollIntoView({ block: "start" });
            document.getElementById("readiness-site-details")?.focus();
          },
        },
      ],
    },
  });
  const menu = (
    <WorklistMenu label="More readiness actions" icon="more">
      {sections.map((s) => (
        <Button
          variant="primary"
          type="button"
          key={s.id}
          data-menu-close
          onClick={() => setView(s.id)}
        >
          {s.label}
        </Button>
      ))}
      <Link href={`/sites/${row.site_id}`}>Open Site</Link>
      <Link href={`/surveys?site_id=${row.site_id}`}>Open survey register</Link>
      <p>Readiness contact (P4) is not available yet.</p>
    </WorklistMenu>
  );
  const actions = (
    <>
      <Button
        variant="secondary"
        type="button"
        className="secondary readiness-contact"
        disabled
        title="P4 is not built; contact confirmation cannot be recorded here."
      >
        Record readiness contact
      </Button>
      {canEdit && (
        <Button
          variant="primary"
          id="readiness-check-primary"
          type="button"
          onClick={prepare}
        >
          Check preparation
        </Button>
      )}
      {menu}
    </>
  );
  const facts = (
    <div id="readiness-site-details" tabIndex={-1}>
      <RecordFactSection title="Site & owner">
        <Facts
          rows={[
            [
              "Site",
              <Link href={`/sites/${row.site_id}`}>
                {String(site.name || row.name)}
              </Link>,
            ],
            ["Record", row.name],
            ["Owner", optionName(options.owners.edit, row.owner_id)],
            ["Requirements", requirementsState],
            ["Time zone", timezone],
          ]}
        />
      </RecordFactSection>
      <RecordFactSection title="Selected visit">
        {visits.length > 0 && (
          <SelectField
            name="selected_visit"
            label="Visit to prepare"
            value={selectedId}
            options={[
              { id: "", display_name: "Unbound preparation checks" },
              ...visits.map((v) => ({
                id: v.id,
                display_name: `${v.reference} · ${format(v.starts_at, timezone)}`,
              })),
            ]}
            onChange={setVisitId}
          />
        )}
        <p className="readiness-subtle">{data.visits_scope}</p>
        <Facts
          rows={[
            [
              "Visit",
              visit ? (
                <Link href={`/service/appointments/${visit.id}`}>
                  {visit.reference}
                </Link>
              ) : (
                "No scheduled visit selected"
              ),
            ],
            [
              "Attendance",
              visit
                ? `${format(visit.starts_at, timezone)} – ${format(visit.ends_at, timezone)}`
                : check
                  ? `${format(check.basis.preparation.starts_at, timezone)} – ${format(check.basis.preparation.ends_at, timezone)}`
                  : "Not selected",
            ],
            ["Activity", check?.basis.preparation.activity ?? "Not checked"],
            [
              "Areas",
              check?.basis.preparation.facility_ids
                .map((f) => optionName(options.facilities, f))
                .join(", ") || "Site",
            ],
            [
              "Visitors",
              check?.basis.preparation.person_ids
                .map((p) => optionName(options.people, p))
                .join(", ") || "Not checked",
            ],
          ]}
        />
      </RecordFactSection>
      <RecordFactSection title="Readiness basis">
        <Facts
          rows={[
            ["Requirements", `${content.requirements.length} recorded`],
            [
              "Evidence",
              `${content.evidence.length} captures · independent review applies`,
            ],
            [
              "Work windows",
              `${content.windows.length} recorded · whole interval checked`,
            ],
            ["Customer info", "P4 · not available"],
            ["Work authority", "Not granted"],
          ]}
        />
      </RecordFactSection>
      <RecordFactSection title="Record boundaries">
        <p>
          Evidence review is specific to the captured requirement revision,
          area, activity and visitor.
        </p>
        <p>{boundary}</p>
        <Link href={`/sites/${row.site_id}`}>Open Site record</Link>
      </RecordFactSection>
    </div>
  );
  return (
    <SharedRecord
      id="ppo-readiness"
      title="Access & readiness"
      reference=""
      statusPlacement="title"
      status={
        <Tag warning={status !== "Recorded preparation checks satisfied"}>
          {status}
        </Tag>
      }
      meta={
        <span>
          {String(site.name || row.name)} · {requirementsState} · {timezone} ·
          as at {format(data.observed_at, timezone)}
        </span>
      }
      actions={actions}
      sourcesLabel="Readiness basis"
      sources={
        <>
          <strong>Readiness</strong>
          <span>
            {visit ? format(visit.starts_at, timezone) : "Select visit"}
          </span>
          <span>{requirementsState}</span>
          <span>Customer info: not available</span>
          <span>No authority to proceed</span>
          <span className="readiness-phone-summary">
            <Tag
              warning={
                !!content.requirements.length &&
                status !== "Recorded preparation checks satisfied"
              }
            >
              {status}
            </Tag>
            {check && !!content.requirements.length && (
              <span>{check.basis.assessment.blockers.length} blockers</span>
            )}
            {!content.requirements.length && <span>Nothing recorded</span>}
          </span>
        </>
      }
      facts={facts}
      tabs={
        <RecordTabs
          id="readiness"
          label="Access and readiness sections"
          tabs={orderedSections}
          value={view}
          onChange={setView}
        />
      }
      stickyAction={
        <>
          {menu}
          {!!content.requirements.length && (
            <Button
              variant="secondary"
              className="secondary readiness-contact"
              disabled
            >
              Record contact
            </Button>
          )}
          {canEdit && (
            <Button
              variant="primary"
              onClick={
                content.requirements.length
                  ? prepare
                  : () => edit("requirements")
              }
            >
              {content.requirements.length ? "Check again" : "Add requirement"}
            </Button>
          )}
        </>
      }
    >
      {notice && (
        <p role="status" className="readiness-notice">
          {notice}
          {refreshing && " Refreshing the saved record before another action."}
        </p>
      )}
      {data.requirements_draft_access === "Restricted" && (
        <p className="readiness-notice">
          Requirements draft details are restricted. The permitted active
          requirements remain visible.
        </p>
      )}
      {!data.can_edit && (
        <p className="readiness-notice">
          Read only. Your access does not permit changes or acknowledgements.
        </p>
      )}
      {data.requirements_draft?.state === "Pending" && (
        <p className="readiness-notice">
          Requirements revision {data.requirements_draft.revision} awaits
          independent review. The active requirements remain in use.{" "}
          <Button
            variant="primary"
            className="text-button"
            onClick={() => setView("requirements")}
          >
            View draft
          </Button>
        </p>
      )}
      <RecordPanel id="readiness" tab="overview" value={view}>
        <CheckOverview
          check={check}
          empty={!content.requirements.length}
          options={options}
          canEdit={canEdit}
          onPrepare={prepare}
          onEvidence={() => setView("evidence")}
          onWindows={() => setView("windows")}
          onAdd={() => edit("requirements")}
        />
        {!!content.requirements.length && <P4 />}
        <p className="readiness-footnote">
          Readiness is specific to the selected visit and its recorded basis. A
          saved check retains its source; changes require a new check.
        </p>
      </RecordPanel>
      <RecordPanel id="readiness" tab="requirements" value={view}>
        <div className="readiness-toolbar">
          <div>
            <h2>Requirements</h2>
            <p>{requirementsState}</p>
          </div>
          {canEdit && (
            <Button
              variant="secondary"
              className="secondary"
              onClick={() => edit("requirements")}
            >
              Start revision {row.revision + 1}
            </Button>
          )}
          <Link href={`/surveys?site_id=${row.site_id}`}>Open survey</Link>
        </div>
        <Requirements
          content={content}
          options={options}
          statuses={data.evidence_status}
        />
        {data.requirements_draft && (
          <Card
            title={`Requirements revision ${data.requirements_draft.revision}`}
            status={<Tag>{data.requirements_draft.state}</Tag>}
          >
            <Requirements
              content={data.requirements_draft.basis.content}
              options={options}
              statuses={{}}
            />
            {data.requirements_draft.state === "Pending" &&
              canEdit &&
              (data.requirements_draft.basis.contributors.includes(
                data.actor_id,
              ) ? (
                <p>
                  Another permitted editor must review this revision. You
                  contributed to this draft.
                </p>
              ) : (
                <Button
                  variant="primary"
                  id="readiness-review-requirements"
                  onClick={() => {
                    rememberFocus();
                    setReviewingDraft(data);
                  }}
                >
                  Review requirements revision
                </Button>
              ))}
          </Card>
        )}
        {reviewingDraft && (
          <RequirementsReview
            data={reviewingDraft}
            onSaved={() => {
              setReviewingDraft(null);
              completed();
            }}
            onCancel={() => {
              setReviewingDraft(null);
              close();
            }}
          />
        )}
        {editor?.mode === "requirements" && (
          <ContentEditor
            row={editor.row}
            kind="Readiness"
            options={options}
            view="requirements"
            readinessMode="requirements"
            onSaved={() => {
              setEditor(null);
              completed();
            }}
            onCancel={() => {
              setEditor(null);
              close();
            }}
          />
        )}
        <p className="readiness-footnote">
          Evidence must match the exact requirement revision, area, activity and
          visitor where required. A draft does not replace the active
          requirements.
        </p>
      </RecordPanel>
      <RecordPanel id="readiness" tab="evidence" value={view}>
        <div hidden={!!review}>
          <div className="readiness-toolbar">
            <h2>Evidence</h2>
            {canEdit && (
              <Button
                variant="secondary"
                className="secondary"
                onClick={() => edit("evidence")}
              >
                Add or update evidence
              </Button>
            )}
          </div>
          {!content.evidence.length && (
            <p>
              No evidence recorded. Capturing evidence does not independently
              review it.
            </p>
          )}
          {content.evidence.map((e) => (
            <article className="readiness-evidence" key={e.id}>
              <div>
                <h3>
                  {content.requirements.find((r) => r.id === e.requirement_id)
                    ?.title ?? "Retained evidence for a retired requirement"}
                </h3>
                <p>
                  {optionName(
                    options.people,
                    e.person_id,
                    "Site / area evidence",
                  )}{" "}
                  · requirement rev {e.requirement_revision}
                </p>
                <small>
                  {e.captured_on} – {e.expires_on} · {e.source}
                </small>
                <p>{data.evidence_status[e.id]}</p>
              </div>
              {canEdit && (
                <Button
                  variant="secondary"
                  className="secondary"
                  id={`readiness-review-${e.id}`}
                  onClick={() => {
                    rememberFocus();
                    setReview({ evidence: e, row });
                  }}
                >
                  Review evidence
                </Button>
              )}
            </article>
          ))}
        </div>
        {review && (
          <EvidenceReview
            key={review.evidence.id}
            row={review.row}
            evidence={review.evidence}
            options={options}
            onSaved={() => {
              setReview(null);
              completed();
            }}
            onCancel={() => {
              setReview(null);
              close();
            }}
          />
        )}
        {editor?.mode === "evidence" && (
          <ContentEditor
            row={editor.row}
            kind="Readiness"
            options={options}
            view="evidence"
            readinessMode="evidence"
            onSaved={() => {
              setEditor(null);
              completed();
            }}
            onCancel={() => {
              setEditor(null);
              close();
            }}
          />
        )}
        <CheckOverview
          check={check}
          empty={!content.requirements.length}
          options={options}
          canEdit={canEdit}
          onPrepare={prepare}
          onEvidence={() => setView("evidence")}
          onWindows={() => setView("windows")}
          onAdd={() => edit("requirements")}
        />
      </RecordPanel>
      <RecordPanel id="readiness" tab="windows" value={view}>
        <div className="readiness-toolbar">
          <h2>Work windows</h2>
          {canEdit && (
            <Button
              variant="secondary"
              className="secondary"
              onClick={() => edit("windows")}
            >
              Edit work windows
            </Button>
          )}
        </div>
        {!content.windows.length && (
          <p>
            No work windows recorded. This does not mean unrestricted access.
          </p>
        )}
        {content.windows.map((w) => (
          <Card
            key={w.id}
            title={optionName(options.facilities, w.facility_id, "Whole Site")}
          >
            <Facts
              rows={[
                ["Activity", w.activity],
                ["Dates", `${w.from_date} – ${w.to_date}`],
                ["Season", `${w.season_from} – ${w.season_to}`],
                ["Hours", `${w.start_time} – ${w.end_time} · ${timezone}`],
                ["Source", w.source],
              ]}
            />
          </Card>
        ))}
        {editor?.mode === "windows" && (
          <ContentEditor
            row={editor.row}
            kind="Readiness"
            options={options}
            view="windows"
            readinessMode="windows"
            onSaved={() => {
              setEditor(null);
              completed();
            }}
            onCancel={() => {
              setEditor(null);
              close();
            }}
          />
        )}
      </RecordPanel>
      <RecordPanel id="readiness" tab="preparation" value={view}>
        <div
          className="readiness-toolbar"
          hidden={!!acknowledgement && !preparing}
        >
          <h2>Visit preparation</h2>
          {canEdit && (
            <Button variant="secondary" className="secondary" onClick={prepare}>
              New check
            </Button>
          )}
        </div>
        {preparing && (
          <PreparationForm
            key={preparing.row.version}
            row={preparing.row}
            check={preparing.check}
            visit={preparing.visit}
            visits={visits}
            options={options}
            onSaved={(savedVisitId) => {
              setVisitId(savedVisitId);
              setPreparing(null);
              completed();
            }}
            onCancel={() => {
              setPreparing(null);
              close();
            }}
          />
        )}
        {acknowledgement && (
          <div hidden={!!preparing}>
            <Acknowledgement
              initial={acknowledgement}
              latest={check}
              currentRow={row}
              options={options}
              onPrepare={prepare}
              onSaved={() => {
                setAcknowledgement(null);
                completed();
              }}
              onCancel={() => {
                setAcknowledgement(null);
                close();
              }}
            />
          </div>
        )}
        {!acknowledgement && !preparing && check && canEdit && (
          <Button
            variant="secondary"
            className="secondary"
            id="readiness-acknowledge"
            onClick={() => {
              rememberFocus();
              setAcknowledgement({ check, row });
            }}
          >
            Acknowledge this check
          </Button>
        )}
        <CheckOverview
          check={check}
          empty={!content.requirements.length}
          options={options}
          canEdit={canEdit}
          onPrepare={prepare}
          onEvidence={() => setView("evidence")}
          onWindows={() => setView("windows")}
          onAdd={() => edit("requirements")}
        />
        <Card title="What this acknowledgement does">
          <p>
            Records that you have read this exact check, including its blockers
            and source basis.
          </p>
          <Facts
            rows={[
              ["Work authority", "Not granted"],
              ["Booking", "Not confirmed"],
              ["Resources", "Not reserved"],
              ["Pack issue", "Not issued"],
              ["Dispatch", "Not cleared"],
            ]}
          />
        </Card>
      </RecordPanel>
      <RecordPanel id="readiness" tab="history" value={view}>
        <h2>History</h2>
        <p>{data.history_scope}</p>
        {data.history.map((h) => (
          <article className="readiness-history" key={h.id}>
            <strong>
              Version {h.version} · requirements rev {h.revision}
            </strong>
            <p>{h.reason}</p>
            <small>
              {format(h.recorded_at, timezone)} ·{" "}
              {optionName(options.owners.edit, h.recorded_by, "Recorded user")}
            </small>
          </article>
        ))}
        {data.events.map((e) => (
          <article className="readiness-history" key={e.id}>
            <strong>{e.kind}</strong>
            <p>{String(e.details.reason ?? "")}</p>
            <small>{format(e.recorded_at, timezone)}</small>
          </article>
        ))}
      </RecordPanel>
    </SharedRecord>
  );
}

function Requirements({
  content,
  options,
  statuses,
}: {
  content: ReadinessContent;
  options: CsOptions;
  statuses: Record<string, string>;
}) {
  const groups = [...new Set(content.requirements.map((r) => r.facility_id))];
  if (!groups.length)
    return <p>No requirements recorded. Readiness remains unknown.</p>;
  return (
    <div
      className="readiness-table-scroll"
      tabIndex={0}
      role="region"
      aria-label="Requirements by area"
    >
      <table className="readiness-requirements">
        <thead>
          <tr>
            <th>Requirement</th>
            <th>Kind</th>
            <th>Activity</th>
            <th>Evidence</th>
          </tr>
        </thead>
        {groups.map((group) => (
          <tbody key={group ?? "site"}>
            <tr className="readiness-group">
              <th colSpan={4} scope="rowgroup">
                {optionName(options.facilities, group, "Whole Site")} ·{" "}
                {
                  content.requirements.filter((r) => r.facility_id === group)
                    .length
                }{" "}
                requirements
              </th>
            </tr>
            {content.requirements
              .filter((r) => r.facility_id === group)
              .map((r) => (
                <tr key={r.id}>
                  <th scope="row">
                    {r.title}
                    <small>
                      Revision {r.revision} · {r.source}
                    </small>
                  </th>
                  <td>{r.kind}</td>
                  <td>{r.activity === "*" ? "All activities" : r.activity}</td>
                  <td>
                    {content.evidence
                      .filter(
                        (e) =>
                          e.requirement_id === r.id &&
                          e.requirement_revision === r.revision,
                      )
                      .map((e) => (
                        <span key={e.id}>
                          {statuses[e.id]?.startsWith("Reviewed")
                            ? "Reviewed capture; check validity"
                            : "Captured; review required"}
                          <br />
                        </span>
                      ))}
                    {!content.evidence.some(
                      (e) =>
                        e.requirement_id === r.id &&
                        e.requirement_revision === r.revision,
                    ) && "Not recorded"}
                  </td>
                </tr>
              ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}

function CheckOverview({
  check,
  empty,
  options,
  canEdit,
  onPrepare,
  onEvidence,
  onWindows,
  onAdd,
}: {
  check?: Check;
  empty: boolean;
  options: CsOptions;
  canEdit: boolean;
  onPrepare: () => void;
  onEvidence: () => void;
  onWindows: () => void;
  onAdd: () => void;
}) {
  const replaceIds = (text: string) =>
    [...options.facilities, ...options.people].reduce(
      (s, o) => s.replaceAll(o.id, o.display_name),
      text,
    );
  if (empty)
    return (
      <Card
        title="No requirements recorded"
        status={<Tag>Readiness unknown</Tag>}
      >
        <p>
          Add the Site and area requirements before checking visit preparation.
        </p>
        <p>
          Nothing recorded does not mean unrestricted access. The previous
          check, if any, remains in History.
        </p>
        <div className="readiness-check-row">
          <ProductIcon name="info" />
          <div>
            <strong>Requirements</strong>
            <p>None recorded. Confirm the Site and area requirements.</p>
          </div>
          {canEdit && (
            <Button
              variant="secondary"
              className="readiness-row-action"
              onClick={onAdd}
            >
              Add requirement
            </Button>
          )}
        </div>
        <div className="readiness-check-row">
          <ProductIcon name="info" />
          <div>
            <strong>Work windows</strong>
            <p>
              Check recorded coverage. A missing window means access is unknown.
            </p>
          </div>
          <Button
            variant="secondary"
            className="readiness-row-action"
            onClick={onWindows}
          >
            View windows
          </Button>
        </div>
      </Card>
    );
  if (!check)
    return (
      <Card title="Check overview" status={<Tag warning>Not checked</Tag>}>
        <p>
          No retained check for this selection. Select the exact visit,
          activity, areas and visitors to check preparation.
        </p>
        {canEdit && (
          <Button variant="secondary" className="secondary" onClick={onPrepare}>
            Check preparation
          </Button>
        )}
      </Card>
    );
  const a = check.basis.assessment,
    p = check.basis.preparation;
  return (
    <Card
      title="Check overview"
      status={
        <Tag warning={check.recheck_required || !!a.blockers.length}>
          {check.recheck_required ? "Recheck required" : a.status}
        </Tag>
      }
    >
      <p className="readiness-check-date">
        {format(p.starts_at, a.timezone)} – {format(p.ends_at, a.timezone)}
      </p>
      <p className="readiness-subtle">
        {p.activity} ·{" "}
        {p.facility_ids
          .map((f) => optionName(options.facilities, f))
          .join(", ") || "Whole Site"}{" "}
        · requirements rev {check.revision}
      </p>
      {check.recheck_required && (
        <div className="readiness-stale">
          <ProductIcon name="warning" />
          <div>
            <strong>Source changed since this check</strong>
            <p>
              The saved check is retained. Check again against the current
              source before acknowledging.
            </p>
          </div>
        </div>
      )}
      {a.blockers.map((blocker, i) => {
        const text = replaceIds(blocker),
          split = text.indexOf(":");
        return (
          <div className="readiness-check-row" key={i}>
            <ProductIcon name="warning" />
            <div>
              <strong>{split < 0 ? text : text.slice(0, split)}</strong>
              <p>{split < 0 ? "" : text.slice(split + 1).trim()}</p>
            </div>
            <Button
              variant="secondary"
              className="readiness-row-action"
              onClick={/window/i.test(blocker) ? onWindows : onEvidence}
            >
              {/window/i.test(blocker) ? "View windows" : "View evidence"}
            </Button>
          </div>
        );
      })}
      {a.checks
        ?.filter((c) => c.status === "Met")
        .map((c, i) => (
          <div className="readiness-check-row readiness-met" key={i}>
            <ProductIcon name="check" />
            <div>
              <strong>
                {c.title}
                {c.person_id
                  ? ` · ${optionName(options.people, c.person_id)}`
                  : ""}
              </strong>
              <p>{c.detail}</p>
            </div>
            <span>Met for this check</span>
          </div>
        ))}
      {!a.blockers.length && (
        <p>Recorded preparation checks satisfied for this exact basis.</p>
      )}
      <p className="readiness-footnote">
        Checked {format(check.recorded_at, a.timezone)}. {boundary}
      </p>
    </Card>
  );
}
function P4() {
  return (
    <section
      className="readiness-confirmation"
      aria-label="Customer confirmation"
    >
      <div className="readiness-confirmation-title">
        <h2>Customer confirmation</h2>
        <span className="readiness-subtle">Gate P4 · not available</span>
      </div>
      <div className="readiness-card readiness-confirmation-card">
        {[
          "Access arranged",
          "Power and water available",
          "Equipment accessible",
          "Isolation arrangements agreed",
        ].map((title) => (
          <div className="readiness-check-row" key={title}>
            <ProductIcon name="info" />
            <div>
              <strong>{title}</strong>
              <p>Not available until readiness contact is built.</p>
            </div>
          </div>
        ))}
      </div>
      <p className="readiness-footnote">
        Contact confirmation does not replace evidence review or grant authority
        to proceed.
      </p>
    </section>
  );
}

function ActionForm({
  title,
  row,
  action,
  fields,
  children,
  onSaved,
  onCancel,
  reasonLabel = "Reason",
}: {
  title: string;
  row: CsRow;
  action: string;
  fields: Record<string, unknown>;
  children: ReactNode;
  onSaved: () => void;
  onCancel: () => void;
  reasonLabel?: string;
}) {
  const [reason, setReason] = useState("");
  const command = useCrmCommand(onSaved);
  const form = useFormFocus();
  return (
    <Card title={title}>
      <form
        ref={form}
        onSubmit={(e) => {
          e.preventDefault();
          void command.send(`cs/Readiness/${row.id}/actions`, {
            expected_version: row.version,
            action:
              action === "publish_requirements" &&
              (e.nativeEvent as SubmitEvent).submitter?.getAttribute(
                "value",
              ) === "return"
                ? "return_requirements"
                : action,
            ...fields,
            reason,
          });
        }}
      >
        {children}
        <ValidationFields error={command.error}>
          <fieldset disabled={command.busy || command.uncertain}>
            <Field
              name="reason"
              label={reasonLabel}
              multiline
              required
              value={reason}
              onChange={(value) => {
                setReason(value);
                command.dirty();
              }}
            />
            <div className="readiness-form-actions">
              <Button variant="primary" type="submit">
                {action === "review_evidence"
                  ? "Record review"
                  : "Publish requirements"}
              </Button>
              {action === "publish_requirements" && (
                <Button
                  type="submit"
                  variant="secondary"
                  className="secondary"
                  value="return"
                >
                  Return for changes
                </Button>
              )}
              <Button
                variant="secondary"
                type="button"
                className="secondary"
                onClick={() => {
                  command.discard();
                  onCancel();
                }}
              >
                Cancel
              </Button>
            </div>
          </fieldset>
        </ValidationFields>
        <CommandStatus command={command} />
      </form>
    </Card>
  );
}
function EvidenceReview({
  row,
  evidence: e,
  options,
  onSaved,
  onCancel,
}: {
  row: CsRow;
  evidence: Evidence;
  options: CsOptions;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const r = (row.content as ReadinessContent).requirements.find(
    (r) => r.id === e.requirement_id,
  );
  return (
    <ActionForm
      title="Review captured evidence"
      row={row}
      action="review_evidence"
      fields={{ evidence_id: e.id }}
      onSaved={onSaved}
      onCancel={onCancel}
      reasonLabel="Review note"
    >
      <p>
        Review this exact capture. A different permitted editor must review
        evidence they did not capture.
      </p>
      <Facts
        rows={[
          [
            "Requirement",
            `${r?.title ?? "Retired requirement"} · revision ${e.requirement_revision}`,
          ],
          ["Area", optionName(options.facilities, e.facility_id, "Whole Site")],
          ["Activity", e.activity],
          [
            "Visitor",
            optionName(options.people, e.person_id, "Not visitor-specific"),
          ],
          ["Captured on", e.captured_on],
          ["Valid to", e.expires_on],
          ["Source", e.source],
        ]}
      />
      <p className="readiness-footnote">
        Review does not extend validity or replace a new preparation check.
      </p>
    </ActionForm>
  );
}
function RequirementsReview({
  data,
  onSaved,
  onCancel,
}: {
  data: Workspace;
  onSaved: () => void;
  onCancel: () => void;
}) {
  return (
    <ActionForm
      title={`Publish requirements revision ${data.requirements_draft!.revision}`}
      row={data.record}
      action="publish_requirements"
      fields={{ snapshot_id: data.requirements_draft!.id }}
      onSaved={onSaved}
      onCancel={onCancel}
      reasonLabel="Independent review note"
    >
      <p>
        Publishing replaces the active requirements with the draft shown above.
        Existing checks and evidence remain retained; changed requirements must
        be checked again.
      </p>
    </ActionForm>
  );
}

function PreparationForm({
  row,
  check,
  visit: initialVisit,
  visits,
  options,
  onSaved,
  onCancel,
}: {
  row: CsRow;
  check?: Check;
  visit?: Visit;
  visits: Visit[];
  options: CsOptions;
  onSaved: (visitId: string) => void;
  onCancel: () => void;
}) {
  const [visitId, setVisitId] = useState(initialVisit?.id ?? ""),
    [activity, setActivity] = useState(check?.basis.preparation.activity ?? ""),
    [facilities, setFacilities] = useState(
      check?.basis.preparation.facility_ids ?? [],
    ),
    [people, setPeople] = useState(check?.basis.preparation.person_ids ?? []),
    [starts, setStarts] = useState(check?.basis.preparation.starts_at ?? ""),
    [ends, setEnds] = useState(check?.basis.preparation.ends_at ?? ""),
    [reason, setReason] = useState("");
  const command = useCrmCommand(() => onSaved(visitId)),
    visit = visits.find((v) => v.id === visitId),
    timezone = String(options.context.timezone || "Australia/Brisbane");
  const form = useFormFocus();
  return (
    <Card title="Check preparation">
      <form
        ref={form}
        onSubmit={(e) => {
          e.preventDefault();
          void command.send(`cs/Readiness/${row.id}/actions`, {
            expected_version: row.version,
            action: "prepare",
            appointment_id: visitId || null,
            preparation: {
              facility_ids: facilities,
              person_ids: people,
              activity,
              starts_at: visit?.starts_at ?? starts,
              ends_at: visit?.ends_at ?? ends,
            },
            reason,
          });
        }}
      >
        <ValidationFields error={command.error}>
          <fieldset disabled={command.busy || command.uncertain}>
            <SelectField
              name="appointment_id"
              label="Visit"
              value={visitId}
              options={[
                { id: "", display_name: "Unbound preparation — no booking" },
                ...visits.map((v) => ({
                  id: v.id,
                  display_name: `${v.reference} · ${format(v.starts_at, timezone)}`,
                })),
              ]}
              onChange={(v) => {
                setVisitId(v);
                command.dirty();
              }}
            />
            {visit ? (
              <Facts
                rows={[
                  [
                    "Attendance",
                    `${format(visit.starts_at, timezone)} – ${format(visit.ends_at, timezone)}`,
                  ],
                  [
                    "Schedule basis",
                    `Version ${visit.schedule_version} · assignment ${visit.assignment_version}`,
                  ],
                ]}
              />
            ) : (
              <>
                <LocalDateTimeField
                  name="starts_at"
                  label="Attendance starts"
                  timezone={timezone}
                  value={starts}
                  onChange={(v) => {
                    setStarts(v);
                    command.dirty();
                  }}
                />
                <LocalDateTimeField
                  name="ends_at"
                  label="Attendance ends"
                  timezone={timezone}
                  value={ends}
                  onChange={(v) => {
                    setEnds(v);
                    command.dirty();
                  }}
                />
              </>
            )}
            <Field
              name="activity"
              label="Exact activity basis"
              required
              value={activity}
              onChange={(v) => {
                setActivity(v);
                command.dirty();
              }}
            />
            <MultiChoice
              label="Exact areas (none means Site)"
              items={options.facilities}
              value={facilities}
              onChange={(v) => {
                setFacilities(v);
                command.dirty();
              }}
            />
            <MultiChoice
              label="Every individual visitor"
              items={options.people}
              value={people}
              onChange={(v) => {
                setPeople(v);
                command.dirty();
              }}
            />
            <Field
              name="reason"
              label="Reason for check"
              required
              multiline
              value={reason}
              onChange={(v) => {
                setReason(v);
                command.dirty();
              }}
            />
            <p className="readiness-footnote">
              This online check uses the whole attendance interval. No booking,
              resource reservation or clearance is created.
            </p>
            <div className="readiness-form-actions">
              <Button variant="primary" type="submit">
                Record preparation check
              </Button>
              <Button
                variant="secondary"
                type="button"
                className="secondary"
                onClick={() => {
                  command.discard();
                  onCancel();
                }}
              >
                Cancel
              </Button>
            </div>
          </fieldset>
        </ValidationFields>
        <CommandStatus command={command} />
      </form>
    </Card>
  );
}

function Acknowledgement({
  initial,
  latest,
  currentRow,
  options,
  onPrepare,
  onSaved,
  onCancel,
}: {
  initial: { check: Check; row: CsRow };
  latest?: Check;
  currentRow: CsRow;
  options: CsOptions;
  onPrepare: () => void;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState(initial),
    [reason, setReason] = useState("");
  const command = useCrmCommand(onSaved),
    check = selected.check,
    p = check.basis.preparation;
  const form = useFormFocus();
  return (
    <Card
      title="Acknowledge this check"
      status={<Tag warning>Grants nothing</Tag>}
    >
      <form
        ref={form}
        onSubmit={(e) => {
          e.preventDefault();
          void command.send(`cs/Readiness/${selected.row.id}/actions`, {
            expected_version: selected.row.version,
            action: "acknowledge",
            snapshot_id: check.id,
            reason,
          });
        }}
      >
        <p>
          You are acknowledging the exact check below, including any blockers.
          The basis cannot be edited here.
        </p>
        <Facts
          rows={[
            [
              "Visit",
              check.basis.visit?.reference ??
                "Unbound preparation — no booking",
            ],
            [
              "Attendance",
              `${format(p.starts_at, check.basis.assessment.timezone)} – ${format(p.ends_at, check.basis.assessment.timezone)}`,
            ],
            [
              "Checked",
              format(check.recorded_at, check.basis.assessment.timezone),
            ],
            ["Requirements", `Revision ${check.revision}`],
            [
              "Areas",
              p.facility_ids
                .map((f) => optionName(options.facilities, f))
                .join(", ") || "Whole Site",
            ],
            ["Activity", p.activity],
            [
              "Visitors",
              p.person_ids
                .map((id) => optionName(options.people, id))
                .join(", ") || "Not selected",
            ],
            [
              "Blockers",
              `${check.basis.assessment.blockers.length} recorded · see check below`,
            ],
          ]}
        />
        <ValidationFields error={command.error}>
          <fieldset disabled={command.busy || command.uncertain}>
            <Field
              name="reason"
              label="Reason"
              required
              multiline
              value={reason}
              onChange={(v) => {
                setReason(v);
                command.dirty();
              }}
              hint="Explain why you are acknowledging this check, including any unresolved blocker."
            />
            <p className="readiness-footnote">{boundary}</p>
            <div className="readiness-form-actions">
              <Button variant="primary" type="submit">
                Acknowledge
              </Button>
              <Button
                variant="secondary"
                type="button"
                className="secondary"
                onClick={() => {
                  command.discard();
                  onCancel();
                }}
              >
                Cancel
              </Button>
            </div>
          </fieldset>
        </ValidationFields>
        <CommandStatus command={command} />
        {!!command.error && !command.uncertain && (
          <div className="readiness-stale">
            <div>
              <strong>Nothing saved. Review the current source.</strong>
              <p>
                Your reason remains here. Check again if the source has changed.
              </p>
              <Button
                variant="secondary"
                type="button"
                className="secondary"
                onClick={onPrepare}
              >
                Check again
              </Button>
            </div>
          </div>
        )}
        {latest && latest.id !== check.id && (
          <Button
            variant="secondary"
            type="button"
            className="secondary"
            disabled={
              command.busy || command.uncertain || latest.recheck_required
            }
            onClick={() => {
              setSelected({ row: currentRow, check: latest });
              command.clearError();
              command.dirty();
            }}
          >
            Use latest check and retain reason
          </Button>
        )}
      </form>
    </Card>
  );
}
