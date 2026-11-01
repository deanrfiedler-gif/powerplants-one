"use client";
import Link from "next/link";
import { useRef, useState, type RefObject } from "react";
import { useSearchParams } from "next/navigation";
import { SecondaryMenuFrame, useSecondaryMenu } from "../shell/secondary-menu";
import { usePublishPageDescription } from "../shell/page-description";
import { RecordIdentity } from "../shell/record-identity";
import { Button, ButtonLink } from "./ui/button";
import {
  RegisterTable,
  RegisterChip,
  RegisterEmpty,
  RegisterFooter,
} from "./ui/register-table";
import { WorklistChoice } from "./crm-worklist-tools";
import { ReadState, useResource } from "./business-ui";
import { RecordTabs, RecordPanel } from "./record-ui";
import { FindingTime as Stamp } from "./service-findings-time";
import { FindingsMenu } from "./service-findings-menu";
import {
  escalationViews,
  type EscalationView,
} from "./service-escalations-menu";
import { OpenCaseForm } from "./service-escalations-create";
import {
  CaseCommandEditor,
  type EscalationRecord,
  type EditorAction,
  type Wire,
} from "./service-escalations-command";
import { stateLabels, type CaseState } from "../service/escalations/states";
import type { CaseRegister } from "../service/escalations/reads";
import "./service-escalations.css";
const stateTone = (s: CaseState) =>
  s === "ReplyToActOn" ? "attention" : s === "Closed" ? "positive" : "neutral";
function State({ state }: { state: CaseState }) {
  return (
    <RegisterChip tone={stateTone(state)}>{stateLabels[state]}</RegisterChip>
  );
}
export function EscalationsScreen() {
  const search = useSearchParams(),
    view =
      escalationViews.find((v) => v.id === search.get("view"))?.id ?? "open",
    owner = search.get("owner") ?? "",
    manufacturer = search.get("manufacturer") ?? "",
    offset = Number(search.get("offset") ?? 0),
    selected = search.get("case"),
    creating = search.get("new") === "1";
  const guardRef = useRef<() => boolean>(() => true),
    opener = useRef<HTMLElement | null>(null),
    [menuOpen, setMenuOpen] = useState(true);
  const menu = useSecondaryMenu(
    selected || creating ? false : menuOpen,
    setMenuOpen,
  );
  const params = new URLSearchParams({
    view,
    offset: String(Number.isSafeInteger(offset) && offset >= 0 ? offset : 0),
    limit: "25",
  });
  if (owner) params.set("owner_id", owner);
  if (manufacturer) params.set("manufacturer", manufacturer);
  const r = useResource<Wire<CaseRegister>>(
      !selected && !creating ? `service/escalations?${params}` : null,
    ),
    available = !!r.data && !r.loading && !r.error,
    data = available ? r.data : null,
    rows = data?.items ?? [];
  const navigate = (
    changes: Record<string, string | null>,
    restore = false,
  ) => {
    if (!guardRef.current()) return;
    const q = new URLSearchParams(search.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v === null || v === "") q.delete(k);
      else q.set(k, v);
    }
    window.history.pushState(
      null,
      "",
      `/service/escalations${q.size ? `?${q}` : ""}`,
    );
    menu.closeOverlay();
    if (restore)
      requestAnimationFrame(
        () => opener.current?.isConnected && opener.current.focus(),
      );
  };
  const choose = (value: EscalationView) =>
    navigate({
      view: value,
      case: null,
      new: null,
      finding: null,
      offset: null,
    });
  const open = (id: string) => {
    opener.current = document.activeElement as HTMLElement;
    navigate({ case: id, new: null, finding: null });
  };
  const back = () => navigate({ case: null, new: null, finding: null }, true);
  usePublishPageDescription(
    "Remote diagnosis and escalation",
    "Review synthetic manufacturer cases, retain technical evidence and record correspondence. A named person sends outside PPO. Source findings retain their own closure rules; controller settings belong to the grower.",
  );
  const ownerOptions = [
    { id: "", label: "Anyone" },
    ...(data?.owners ?? []).map((o) => ({ id: o.id, label: o.display_name })),
    ...(owner && !data?.owners.some((o) => o.id === owner)
      ? [{ id: owner, label: "Selected owner" }]
      : []),
  ];
  const manufacturerOptions = [
    { id: "", label: "All" },
    ...(data?.manufacturers ?? []).map((m) => ({ id: m, label: m })),
    ...(manufacturer && !data?.manufacturers.includes(manufacturer)
      ? [{ id: manufacturer, label: manufacturer }]
      : []),
  ];
  return (
    <SecondaryMenuFrame
      id="ppo-escalations"
      name="Service review"
      menuId="escalations-menu"
      contentId="escalations-content"
      state={menu}
      attributes={{
        "data-ppo-workspace": "shared",
        "data-record": selected || creating ? "true" : undefined,
      }}
      message="Synthetic cases. Recording sends nothing."
      phoneHeader={{
        title: "Escalations",
        count: data?.count,
        record:
          selected || creating
            ? {
                back: { label: "Back to cases", onSelect: back },
                more: [{ label: "Back to cases", onSelect: back }],
              }
            : undefined,
      }}
      menu={
        <nav aria-label="Service review views">
          <ul className="sv07-review-links">
            <li>
              <Link href="/service/reports">Service reports</Link>
            </li>
          </ul>
          <FindingsMenu escalationView={view} onEscalationSelect={choose} />
        </nav>
      }
    >
      {creating ? (
        <OpenCaseForm
          key={search.get("finding") ?? "new"}
          findingKey={search.get("finding") ?? ""}
          guardRef={guardRef}
          onCancel={back}
          onCreated={(id) => navigate({ new: null, finding: null, case: id })}
        />
      ) : selected ? (
        <CaseWorkspace
          key={selected}
          id={selected}
          guardRef={guardRef}
          onBack={back}
          phone={!!menu.phone}
        />
      ) : (
        <div className="sv08-register">
          <h1 className="sr-only">Remote diagnosis and escalation</h1>
          <div className="sv08-toolbar">
            <div className="sv08-phone">
              <WorklistChoice
                label="Case view"
                value={view}
                options={[...escalationViews]}
                onChange={(v) => choose(v as EscalationView)}
              />
            </div>
            <WorklistChoice
              label="Owner"
              prefix="Owner: "
              value={owner}
              options={ownerOptions}
              onChange={(v) => navigate({ owner: v, offset: null })}
            />
            <WorklistChoice
              label="Manufacturer"
              prefix="Manufacturer: "
              value={manufacturer}
              options={manufacturerOptions}
              onChange={(v) => navigate({ manufacturer: v, offset: null })}
            />
            <div className="sv08-toolbar-actions">
              <Button variant="quiet" onClick={r.reload}>
                Refresh
              </Button>
              <Button variant="primary" onClick={() => navigate({ new: "1" })}>
                Open case
              </Button>
            </div>
          </div>
          <p className="sv08-count" role="status">
            {data ? (
              <>
                {data.count} {view === "closed" ? "closed" : "permitted"} cases
                · As at <Stamp value={data.read_at} />
                {data.completeness !== "Complete" &&
                  " · Latest 1,000 candidates only"}
              </>
            ) : (
              "Current results unconfirmed"
            )}
          </p>
          {r.loading && (
            <p className="sv08-read" role="status">
              Loading permitted cases…
            </p>
          )}
          <ReadState loading={false} error={r.error} retry={r.reload} />
          {available && (
            <>
              <div className="sv08-desktop sv08-table">
                <RegisterTable
                  caption="Permitted escalation cases. Open a fault to inspect its diagnosis, evidence and correspondence."
                  empty={
                    !rows.length && (
                      <RegisterEmpty
                        title={
                          view === "closed"
                            ? "No closed cases"
                            : "No open cases"
                        }
                      >
                        Change the filters or{" "}
                        <button
                          type="button"
                          onClick={() =>
                            choose(view === "closed" ? "open" : "closed")
                          }
                        >
                          {view === "closed"
                            ? "Show open cases"
                            : "Show closed cases"}
                        </button>
                        .
                      </RegisterEmpty>
                    )
                  }
                >
                  <thead>
                    <tr>
                      {["Case", "Fault", "State", "Owner", "Next step"].map(
                        (h) => (
                          <th scope="col" key={h}>
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <strong>{row.display_number}</strong>
                          <small>{row.manufacturer}</small>
                        </td>
                        <td className="ppo-register-wrap">
                          <button
                            className="sv08-row-link"
                            onClick={() => open(row.id)}
                          >
                            {row.fault}
                          </button>
                          <small>{row.site}</small>
                        </td>
                        <td>
                          <State state={row.state} />
                        </td>
                        <td>{row.owner_name}</td>
                        <td>
                          {row.state === "Diagnosing" ? (
                            "Not sent"
                          ) : row.state === "WaitingOnManufacturer" ? (
                            <>
                              {row.chase_due ? "Chase due" : "Reply expected"}
                              <small>
                                <Stamp value={row.reply_expected_at} />
                              </small>
                            </>
                          ) : row.state === "ReplyToActOn" ? (
                            "Turn the advice into owned work"
                          ) : (
                            "Outcome recorded"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </RegisterTable>
              </div>
              <div className="sv08-phone sv08-phone-list">
                {rows.map((row) => (
                  <button
                    key={row.id}
                    className="sv08-phone-row"
                    onClick={() => open(row.id)}
                  >
                    <strong>{row.fault}</strong>
                    <span>
                      {row.display_number} · {row.manufacturer}
                    </span>
                    <span>
                      <State state={row.state} /> · {row.owner_name}
                    </span>
                    <small>
                      {row.state === "Diagnosing"
                        ? "Not sent"
                        : row.state === "WaitingOnManufacturer"
                          ? row.chase_due
                            ? "Chase due"
                            : "Waiting for reply"
                          : row.state === "ReplyToActOn"
                            ? "Replied"
                            : "Outcome recorded"}
                    </small>
                  </button>
                ))}
                {!rows.length && (
                  <RegisterEmpty
                    title={
                      view === "closed" ? "No closed cases" : "No open cases"
                    }
                  >
                    <Button
                      onClick={() =>
                        choose(view === "closed" ? "open" : "closed")
                      }
                    >
                      {view === "closed"
                        ? "Show open cases"
                        : "Show closed cases"}
                    </Button>
                  </RegisterEmpty>
                )}
              </div>
              <RegisterFooter>
                <span>{data?.count ?? 0} in the authorised window</span>
                <Button
                  disabled={!data || data.offset === 0}
                  onClick={() =>
                    navigate({
                      offset: String(Math.max(0, (data?.offset ?? 0) - 25)),
                    })
                  }
                >
                  Previous
                </Button>
                <Button
                  disabled={!data || data.offset + data.limit >= data.count}
                  onClick={() =>
                    navigate({ offset: String((data?.offset ?? 0) + 25) })
                  }
                >
                  Next
                </Button>
              </RegisterFooter>
            </>
          )}
        </div>
      )}
    </SecondaryMenuFrame>
  );
}
function CaseWorkspace({
  id,
  guardRef,
  onBack,
  phone,
}: {
  id: string;
  guardRef: RefObject<() => boolean>;
  onBack: () => void;
  phone: boolean;
}) {
  const r = useResource<EscalationRecord>(`service/escalations/${id}`),
    [fatal, setFatal] = useState<unknown>(null);
  if (fatal || r.error)
    return (
      <div className="sv08-read">
        <Button onClick={onBack}>Back to cases</Button>
        <ReadState
          loading={false}
          error={fatal || r.error}
          retry={() => {
            setFatal(null);
            r.reload();
          }}
        />
      </div>
    );
  if (!r.data)
    return (
      <div className="sv08-read">
        <Button onClick={onBack}>Back to cases</Button>
        <p role="status">
          Loading permitted case… Current details unconfirmed.
        </p>
      </div>
    );
  return (
    <CaseDetail
      data={r.data}
      loading={r.loading}
      onReload={r.reload}
      onBack={onBack}
      phone={phone}
      guardRef={guardRef}
      onRevoked={setFatal}
    />
  );
}
function CaseDetail({
  data,
  loading,
  onReload,
  onBack,
  phone,
  guardRef,
  onRevoked,
}: {
  data: EscalationRecord;
  loading: boolean;
  onReload: () => void;
  onBack: () => void;
  phone: boolean;
  guardRef: RefObject<() => boolean>;
  onRevoked: (e: unknown) => void;
}) {
  const row = data.record,
    [tab, setTab] = useState(
      row.state === "ReplyToActOn" ? "correspondence" : "diagnosis",
    ),
    [editing, setEditing] = useState<EditorAction | null>(
      row.state === "ReplyToActOn" &&
        row.next_action_reply_id !== row.last_reply_id
        ? "next_action"
        : null,
    );
  const actualTab = phone && tab === "configuration" ? "diagnosis" : tab,
    diagnostics = data.events.filter((e) => e.kind === "Diagnostic"),
    reply = data.events.find((e) => e.id === row.last_reply_id),
    sent = data.events.find((e) => e.id === row.last_sent_id),
    pack = data.packs.find((p) => p.id === row.latest_pack_id),
    closed = ["Closed", "Withdrawn"].includes(row.state);
  const edit = (action: EditorAction) => {
    if (loading || !guardRef.current()) return;
    setEditing(action);
    setTab(
      [
        "record_sent",
        "record_reply",
        "next_action",
        "follow_up",
        "close",
        "withdraw",
      ].includes(action)
        ? "correspondence"
        : ["prepare_pack", "review_pack", "photo"].includes(action)
          ? "pack"
          : action === "capture_configuration" && !phone
            ? "configuration"
            : "diagnosis",
    );
  };
  const editorTab = editing
    ? [
        "record_sent",
        "record_reply",
        "next_action",
        "follow_up",
        "close",
        "withdraw",
      ].includes(editing)
      ? "correspondence"
      : ["prepare_pack", "review_pack", "photo"].includes(editing)
        ? "pack"
        : editing === "capture_configuration" && !phone
          ? "configuration"
          : "diagnosis"
    : null;
  const checks =
    row.state === "ReplyToActOn" || closed
      ? [
          ["Sent and recorded", !!sent],
          ["Reply recorded", !!reply],
          [
            "Advice reviewed",
            row.next_action_reply_id === row.last_reply_id &&
              !!row.last_reply_id,
          ],
          [
            "Next action owned",
            !!data.finding.action?.owner_id && !!row.next_action_id,
          ],
          ["Case outcome written", !!row.outcome],
          [
            "Customer details left out",
            !!data.packs.some((p) => p.reviewed_at),
          ],
        ]
      : [
          ["Fault described", !!row.fault],
          ["Diagnostics recorded", diagnostics.length > 0],
          ["Configuration captured", data.configuration_current],
          ["Evidence pack reviewed", !!row.reviewed_pack_id],
          ["Customer details left out", !!row.reviewed_pack_id],
          ["Recipient chosen", !!data.support_route],
        ];
  const editor = editing && (
    <div hidden={actualTab !== editorTab}>
      <CaseCommandEditor
        key={editing}
        data={data}
        action={editing}
        guardRef={guardRef}
        onSaved={() => {
          setEditing(null);
          onReload();
        }}
        onCancel={() => setEditing(null)}
        onRevoked={onRevoked}
      />
    </div>
  );
  const config = (
    <section className="sv08-card">
      <h2>Read-only configuration</h2>
      <p>
        Controller settings belong to the grower; they are captured read-only,
        never changed from here.
      </p>
      {data.configuration ? (
        <>
          <p className="sv08-prose">{String(data.configuration.description)}</p>
          <p>
            Equipment revision {String(data.configuration.revision)} · Captured{" "}
            <Stamp
              value={String(data.configuration.created_at)}
              timezone={data.site.timezone}
            />
          </p>
          <code className="sv08-hash">{String(data.configuration.sha256)}</code>
          {!data.configuration_current && (
            <p className="sv08-notice">
              Equipment has a newer configuration. Capture it before preparing
              or using a pack.
            </p>
          )}
        </>
      ) : (
        <p>No configuration snapshot captured.</p>
      )}
      {row.state === "Diagnosing" && (
        <Button
          disabled={loading}
          onClick={() => edit("capture_configuration")}
        >
          Capture configuration
        </Button>
      )}
      <ButtonLink href={`/equipment/${row.asset_id}`}>
        Open equipment
      </ButtonLink>
    </section>
  );
  const evidence = (
    <section className="sv08-card">
      <h2>What the manufacturer will see</h2>
      <p>The technical pack names the site, not customer contacts.</p>
      <ul className="sv08-evidence-list">
        <li>Diagnostics already tried · {diagnostics.length} recorded</li>
        <li>
          Controller configuration ·{" "}
          {data.configuration_current
            ? "captured read-only"
            : "capture required"}
        </li>
        <li>
          Permitted inspection attempts, readings, instruments and calibration
          references
        </li>
        <li>
          Reviewed technical photos ·{" "}
          {data.files.filter((f) => f.kind === "Photo").length}
        </li>
        <li>Source finding and its native state</li>
        <li>
          <strong>Customer contact details and prices · left out</strong>
        </li>
      </ul>
      {pack ? (
        <>
          <p>
            Pack version {pack.revision} ·{" "}
            {row.reviewed_pack_id === pack.id ? "Reviewed" : "Review required"}
          </p>
          <p>
            <a href={fileUrl(row.id, pack.id, "html")} download>
              Download HTML
            </a>{" "}
            ·{" "}
            <a href={fileUrl(row.id, pack.id, "pdf")} download>
              Download PDF
            </a>
          </p>
          <code className="sv08-hash">HTML SHA-256 {pack.html_sha256}</code>
          <code className="sv08-hash">PDF SHA-256 {pack.pdf_sha256}</code>
        </>
      ) : (
        <p>No evidence pack prepared yet.</p>
      )}
      {row.state === "Diagnosing" && (
        <div className="sv08-actions">
          <Button disabled={loading} onClick={() => edit("prepare_pack")}>
            Prepare evidence pack
          </Button>
          {pack && (
            <Button disabled={loading} onClick={() => edit("review_pack")}>
              Review evidence pack
            </Button>
          )}
          <Button disabled={loading} onClick={() => edit("photo")}>
            Add technical photo
          </Button>
        </div>
      )}
    </section>
  );
  return (
    <div className="sv08-case">
      <RecordIdentity reference={row.display_number} title={row.fault} />
      <header className="sv08-case-heading">
        <div>
          <h1>{row.fault}</h1>
          <p>
            <State state={row.state} /> <strong>{row.display_number}</strong> ·{" "}
            {String(data.equipment.manufacturer ?? "Manufacturer not recorded")}
          </p>
          <p>
            {data.finding.source_record.reference} · {row.owner_name} · Opened{" "}
            <Stamp value={row.created_at} timezone={data.site.timezone} />
          </p>
        </div>
        <div className="sv08-actions">
          <span className="sv08-desktop">
            <Button variant="quiet" onClick={onBack}>
              Back to cases
            </Button>
          </span>
          <ButtonLink
            href={`/service/findings?${new URLSearchParams({ finding: row.finding_key })}`}
          >
            Open finding
          </ButtonLink>
          {row.state === "Diagnosing" && (
            <Button
              variant="primary"
              disabled={loading}
              onClick={() =>
                edit(
                  row.reviewed_pack_id
                    ? "record_sent"
                    : pack
                      ? "review_pack"
                      : "prepare_pack",
                )
              }
            >
              Prepare to send
            </Button>
          )}
          {row.state === "WaitingOnManufacturer" && (
            <Button
              variant="primary"
              disabled={loading}
              onClick={() => edit("record_reply")}
            >
              Record reply
            </Button>
          )}
          {row.state === "ReplyToActOn" && (
            <>
              <ButtonLink href={`/equipment/${row.asset_id}`}>
                Open equipment
              </ButtonLink>
              <Button disabled={loading} onClick={() => edit("close")}>
                Close case
              </Button>
            </>
          )}
        </div>
      </header>
      {loading && (
        <p className="sv08-notice" role="status">
          Refreshing this case. Current details are unconfirmed.
        </p>
      )}
      <section
        className="sv08-readiness"
        aria-label={
          row.state === "ReplyToActOn" ? "Before closing" : "Before sending"
        }
      >
        <strong>
          {row.state === "ReplyToActOn" || closed
            ? "Before closing"
            : "Before sending"}
        </strong>
        {checks.map(([label, done]) => (
          <span key={String(label)} data-done={!!done}>
            <span aria-hidden="true">{done ? "✓" : "○"}</span> {String(label)}
          </span>
        ))}
      </section>
      <div className="sv08-case-columns">
        <aside className="sv08-case-summary">
          <section>
            <h2>Summary</h2>
            <dl>
              <dt>State</dt>
              <dd>{stateLabels[row.state]}</dd>
              <dt>Fault type</dt>
              <dd>{row.fault_type}</dd>
              <dt>Owner</dt>
              <dd>{row.owner_name}</dd>
              <dt>Model</dt>
              <dd>{String(data.equipment.model ?? "Not recorded")}</dd>
              <dt>Serial</dt>
              <dd>{String(data.equipment.serial ?? "Not recorded")}</dd>
              <dt>Warranty ends</dt>
              <dd>
                {data.equipment.warranty_end ? (
                  <Stamp
                    value={String(data.equipment.warranty_end)}
                    dateOnly
                    timezone={data.site.timezone}
                  />
                ) : (
                  "Not recorded"
                )}
              </dd>
              <dt>Version</dt>
              <dd>{row.version}</dd>
            </dl>
            <p>Warranty decisions stay with Warranty (aftercare).</p>
          </section>
          <section>
            <h2>Equipment and site</h2>
            <p>
              <Link href={`/equipment/${row.asset_id}`}>
                {String(data.equipment.description)} ·{" "}
                {String(data.equipment.display_number)}
              </Link>
            </p>
            <p>{data.site.name}</p>
            <p>
              Controller settings belong to the grower; they are captured
              read-only, never changed from here.
            </p>
          </section>
          <section>
            <h2>Finding</h2>
            <p>{data.finding.what_remains}</p>
            <p>
              {data.finding.source_record.reference} ·{" "}
              {data.finding.native_state}
            </p>
            <p>{data.finding.closes_when}</p>
            {data.finding.action && (
              <ButtonLink href={data.finding.action.href}>
                Open next action in My Work
              </ButtonLink>
            )}
          </section>
          <section>
            <h2>Manufacturer support route</h2>
            {data.support_route ? (
              <p>
                {data.support_route.method} · {data.support_route.recipient}
              </p>
            ) : (
              <p>
                No support route is recorded for this equipment manufacturer.
              </p>
            )}
            {!closed && (
              <Button disabled={loading} onClick={() => edit("support_route")}>
                Maintain support route
              </Button>
            )}
          </section>
          {row.chase_activity_id && (
            <section>
              <h2>Chase reminder</h2>
              <p>
                Reply expected{" "}
                <Stamp
                  value={sent?.details.reply_expected_at}
                  scheduled
                  timezone={data.site.timezone}
                />
              </p>
              <ButtonLink href={`/work/${row.chase_activity_id}`}>
                Open chase in My Work
              </ButtonLink>
            </section>
          )}
          {!closed && (
            <Button
              variant="quiet"
              disabled={loading}
              onClick={() => edit("withdraw")}
            >
              Withdraw case
            </Button>
          )}
        </aside>
        <section className="sv08-case-main" aria-label="Case record">
          <RecordTabs
            id="sv08-tabs"
            label="Case sections"
            value={actualTab}
            onChange={setTab}
            tabs={
              phone
                ? [
                    { id: "correspondence", label: "Reply" },
                    { id: "diagnosis", label: "Diagnosis" },
                    { id: "pack", label: "Pack" },
                    { id: "history", label: "History" },
                  ]
                : [
                    {
                      id: "diagnosis",
                      label: `Diagnosis (${diagnostics.length})`,
                    },
                    { id: "configuration", label: "Configuration" },
                    { id: "pack", label: "Evidence pack" },
                    { id: "correspondence", label: "Correspondence" },
                    { id: "history", label: "History" },
                  ]
            }
          />
          <div className="sv08-case-panels">
            <RecordPanel id="sv08-tabs" tab="diagnosis" value={actualTab}>
              <section className="sv08-card">
                <div className="sv08-card-heading">
                  <h2>Diagnostics already tried</h2>
                  {row.state === "Diagnosing" && (
                    <Button disabled={loading} onClick={() => edit("diagnose")}>
                      Record diagnostic
                    </Button>
                  )}
                </div>
                {diagnostics.length ? (
                  diagnostics.map((d) => (
                    <article className="sv08-diagnostic" key={d.id}>
                      <h3>{String(d.details.diagnostic)}</h3>
                      <p className="sv08-prose">{String(d.details.result)}</p>
                      <small>
                        {String(d.recorded_by)} ·{" "}
                        <Stamp
                          value={String(d.occurred_at)}
                          timezone={data.site.timezone}
                        />
                      </small>
                      <p>{String(d.details.source_reference)}</p>
                    </article>
                  ))
                ) : (
                  <p>No diagnostic attempts recorded yet.</p>
                )}
              </section>
              {evidence}
              {phone && config}
            </RecordPanel>
            <RecordPanel id="sv08-tabs" tab="configuration" value={actualTab}>
              {config}
            </RecordPanel>
            <RecordPanel id="sv08-tabs" tab="pack" value={actualTab}>
              {evidence}
              <section className="sv08-card">
                <h2>Retained pack history</h2>
                {data.packs.map((p) => (
                  <article key={p.id}>
                    <p>
                      Version {p.revision} ·{" "}
                      <Stamp
                        value={String(p.created_at)}
                        timezone={data.site.timezone}
                      />{" "}
                      · {p.reviewed_at ? "Reviewed" : "Not reviewed"}
                    </p>
                    <a href={fileUrl(row.id, p.id, "pdf")} download>
                      Download retained PDF
                    </a>
                    <code className="sv08-hash">{p.pdf_sha256}</code>
                  </article>
                ))}
              </section>
              <section className="sv08-card">
                <h2>Technical photos</h2>
                {data.files
                  .filter((f) => f.kind === "Photo")
                  .map((f) => (
                    <p key={f.id}>
                      <a href={attachmentUrl(row.id, f.id)} download>
                        Download reviewed photo ({f.bytes} bytes)
                      </a>
                      <code className="sv08-hash">{f.sha256}</code>
                    </p>
                  ))}
              </section>
            </RecordPanel>
            <RecordPanel id="sv08-tabs" tab="correspondence" value={actualTab}>
              {editing === "record_sent" ? null : reply ? (
                <section className="sv08-card">
                  <h2>Manufacturer reply</h2>
                  <p>
                    Reference{" "}
                    {String(
                      sent?.details.manufacturer_reference ?? "Not recorded",
                    )}{" "}
                    · Received{" "}
                    <Stamp
                      value={String(reply.occurred_at)}
                      timezone={data.site.timezone}
                    />
                  </p>
                  <p className="sv08-prose">{String(reply.details.reply)}</p>
                  <h3>Recommended steps</h3>
                  <p className="sv08-prose">{String(reply.details.advice)}</p>
                  {reply.details.settings_change && (
                    <p className="sv08-notice">
                      Settings changes need the grower’s approval first.
                    </p>
                  )}
                  {data.files
                    .filter((f) => f.reply_id === reply.id)
                    .map((f) => (
                      <p key={f.id}>
                        <a href={attachmentUrl(row.id, f.id)} download>
                          Reply attachment ({f.bytes} bytes)
                        </a>
                        <code className="sv08-hash">{f.sha256}</code>
                      </p>
                    ))}
                  <p>
                    Recorded as received by {String(reply.recorded_by)}. PPO did
                    not receive or send this message.
                  </p>
                  {row.state === "ReplyToActOn" && (
                    <div className="sv08-actions">
                      <Button
                        variant="primary"
                        disabled={loading}
                        onClick={() => edit("next_action")}
                      >
                        Record next action
                      </Button>
                      <Button
                        disabled={loading}
                        onClick={() => edit("follow_up")}
                      >
                        Record a follow-up question
                      </Button>
                    </div>
                  )}
                </section>
              ) : (
                <section className="sv08-card">
                  <h2>Correspondence</h2>
                  <p>No manufacturer reply recorded yet.</p>
                  {row.state === "WaitingOnManufacturer" && (
                    <Button
                      disabled={loading}
                      onClick={() => edit("record_reply")}
                    >
                      Record reply
                    </Button>
                  )}
                  {row.state === "Diagnosing" && (
                    <Button
                      disabled={
                        loading || !row.reviewed_pack_id || !data.support_route
                      }
                      onClick={() => edit("record_sent")}
                    >
                      Record as sent
                    </Button>
                  )}
                </section>
              )}
              {editorTab === "correspondence" && editor}
              {sent && (
                <section className="sv08-card">
                  <h2>Recorded as sent</h2>
                  <p>
                    {String(sent.details.method)} ·{" "}
                    {String(sent.details.recipient)}
                  </p>
                  <p>
                    Sent{" "}
                    <Stamp
                      value={String(sent.occurred_at)}
                      timezone={data.site.timezone}
                    />{" "}
                    · Reference {String(sent.details.manufacturer_reference)}
                  </p>
                  <p>
                    Reply expected{" "}
                    <Stamp
                      value={String(sent.details.reply_expected_at)}
                      scheduled
                      timezone={data.site.timezone}
                    />
                  </p>
                  <code className="sv08-hash">
                    PDF {String(sent.details.pdf_sha256)}
                  </code>
                  <p>Recording sends nothing.</p>
                </section>
              )}
              {row.next_action_id && (
                <section className="sv08-card">
                  <h2>Owned next action</h2>
                  <p>{data.finding.action?.summary}</p>
                  <p>
                    {data.finding.action?.owner_name} ·{" "}
                    <Stamp
                      value={data.finding.action?.due_at}
                      timezone={data.site.timezone}
                      scheduled
                    />
                  </p>
                  <ButtonLink href={`/work/${row.next_action_id}`}>
                    Open in My Work
                  </ButtonLink>
                  <p>
                    Closing the case records its outcome. It does not close the
                    finding.
                  </p>
                </section>
              )}
              {row.outcome && (
                <section className="sv08-card">
                  <h2>Case outcome</h2>
                  <p>{row.outcome}</p>
                  <p>The source finding retains its own closure rules.</p>
                </section>
              )}
            </RecordPanel>
            <RecordPanel id="sv08-tabs" tab="history" value={actualTab}>
              <section className="sv08-card">
                <h2>Case history</h2>
                {data.history.map((h) => (
                  <article className="sv08-diagnostic" key={h.id}>
                    <h3>
                      {String(h.command)
                        .replace("ServiceEscalation:", "")
                        .replaceAll("_", " ")}
                    </h3>
                    <p>{String(h.reason)}</p>
                    <small>
                      {String(h.actor)} ·{" "}
                      <Stamp
                        value={String(h.occurred_at)}
                        timezone={data.site.timezone}
                      />{" "}
                      · version {String(h.record_version)}
                    </small>
                  </article>
                ))}
              </section>
              <section className="sv08-card">
                <h2>Retained correspondence</h2>
                {data.events
                  .filter((e) => ["Sent", "Reply", "FollowUp"].includes(e.kind))
                  .map((e) => (
                    <article key={e.id}>
                      <h3>{String(e.kind)}</h3>
                      <p>
                        <Stamp
                          value={String(e.occurred_at)}
                          timezone={data.site.timezone}
                        />{" "}
                        · {String(e.recorded_by)}
                      </p>
                      <p className="sv08-prose">
                        {String(
                          e.details.question ??
                            e.details.reply ??
                            e.details.manufacturer_reference ??
                            "",
                        )}
                      </p>
                    </article>
                  ))}
              </section>
            </RecordPanel>
            {editorTab !== "correspondence" && editor}
          </div>
        </section>
      </div>
    </div>
  );
}
function fileUrl(id: string, pack: string, format: "html" | "pdf") {
  return `/api/v1/service/escalations/${id}/files?kind=pack&file_id=${pack}&format=${format}`;
}
function attachmentUrl(id: string, file: string) {
  return `/api/v1/service/escalations/${id}/files?kind=attachment&file_id=${file}`;
}
