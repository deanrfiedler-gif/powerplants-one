"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { listHandovers, readHandover } from "../sales/handover-service";
import {
  destinations,
  type HandoverKind,
  type HandoverContent,
} from "../sales/handover-model";
import type { listOpportunities } from "../crm/worklist";
import type { readOpportunity } from "../crm/reads";
import { useCrmResource } from "./crm-state";
import {
  api,
  ErrorNotice,
  Field,
  SelectField,
  PageHeader,
  Stamp,
  Status,
  type Envelope,
} from "./business-ui";
import { useIdentity } from "./business-session";
import { useRecoverableCommand } from "../shared/ui/use-recoverable-command";
import { Button } from "./ui/button";
import { RecordTabs, RecordPanel, useUnsavedChanges } from "./record-ui";

type Detail = Awaited<ReturnType<typeof readHandover>>;
const root = (kind: HandoverKind) =>
  `/sales/handoffs/${kind === "Estimating" ? "estimating" : "won"}`;
function useHandoverCommand(id: string, onSaved: () => void) {
  const savedRef = useRef(onSaved);
  useEffect(() => {
    savedRef.current = onSaved;
  }, [onSaved]);
  const p = useIdentity();
  const command = useRecoverableCommand({
    key: `ppo-sales-handover:${id}`,
    scope: p,
    transport: api,
    accepts: (e) =>
      e.path === "sales/handovers" || e.path === `sales/handovers/${id}`,
  });
  useEffect(() => {
    if (command.accepted) savedRef.current();
  }, [command.accepted]);
  return command;
}
function Recovery({
  command,
}: {
  command: ReturnType<typeof useHandoverCommand>;
}) {
  return (
    <>
      <ErrorNotice error={command.error} />
      {command.pending && (
        <section role="status">
          <p>
            The original outcome is uncertain. Resolve it before another
            command.
          </p>
          <Button busy={command.busy} onClick={() => void command.recover()}>
            Check original result
          </Button>
          <Button busy={command.busy} onClick={() => void command.retry()}>
            Retry exact original
          </Button>
        </section>
      )}
      {command.saved && <p role="status">{command.saved}</p>}
    </>
  );
}

export function HandoverList({
  kind,
  receiving = false,
}: {
  kind: HandoverKind;
  receiving?: boolean;
}) {
  const params = useSearchParams(),
    router = useRouter(),
    [opportunity, setOpportunity] = useState(
      params.get("opportunity_id") ?? "",
    ),
    [search, setSearch] = useState("");
  const list = useCrmResource<Awaited<ReturnType<typeof listHandovers>>>(
    `sales/handovers?kind=${kind}&receiving=${receiving}`,
    true,
  );
  const deals = useCrmResource<Awaited<ReturnType<typeof listOpportunities>>>(
    receiving
      ? null
      : `crm/opportunities?pipeline_definition_id=c1000000-0000-4000-8000-000000000002&outcome=${kind === "Won" ? "Won" : "Open"}&q=${encodeURIComponent(search)}&limit=50`,
    true,
  );
  const command = useHandoverCommand("create", list.reload);
  async function create() {
    const id = crypto.randomUUID();
    const receipt = await command.send(
      "sales/handovers",
      {
        id,
        opportunity_id: opportunity,
        kind,
        reason: "Prepare a Sales handover",
      },
      root(kind),
      "Handover preparation",
      id,
    );
    if (receipt) router.push(`${root(kind)}/${receipt.record_id}`);
  }
  return (
    <>
      <PageHeader
        eyebrow="Sales handover"
        title={
          receiving
            ? "Estimating Intake"
            : kind === "Estimating"
              ? "Sales-to-Estimating handover"
              : "Won-deal receiving"
        }
        description={
          receiving
            ? "Review the exact brief submitted by Sales."
            : "Prepare, submit and review a saved revision with an explicit receiving owner."
        }
      />
      <p>
        Save, submission and receiver acceptance are separate. Acceptance
        creates no estimate, order, Project, work order or booking.
      </p>
      <Recovery command={command} />
      {!receiving && (
        <section className="crm-panel">
          <h2>Prepare a handover</h2>
          <Field
            name="find-deal"
            label="Find a deal"
            value={search}
            onChange={setSearch}
          />
          <SelectField
            name="opportunity_id"
            label="Opportunity"
            value={opportunity}
            onChange={setOpportunity}
            options={
              deals.data?.items.map((o) => ({
                id: o.id,
                display_name: `${o.display_number} · ${o.title}`,
              })) ?? []
            }
          />
          <ErrorNotice error={deals.error} />
          {deals.data?.completeness === "Partial" && (
            <p>Partial deal list; refine search.</p>
          )}
          <Button
            disabled={!opportunity || !!command.pending || !command.ready}
            busy={command.busy}
            onClick={() => void create()}
          >
            Prepare handover
          </Button>
        </section>
      )}
      {list.loading && <p role="status">Loading permitted handovers…</p>}
      <ErrorNotice error={list.error} />
      {!!list.error && <Button onClick={list.reload}>Retry handovers</Button>}
      {!list.error && list.data && (
        <>
          <p>
            {list.data.items.length} permitted handovers ·{" "}
            {list.data.completeness} · As at{" "}
            <Stamp value={list.data.observed_at} />
          </p>
          {list.data.items.map((d) => (
            <article className="crm-panel" key={d.record.id}>
              <h2>
                <Link href={`${root(kind)}/${d.record.id}`}>
                  {d.opportunity.display_number} · {d.opportunity.title}
                </Link>
              </h2>
              <p>
                <Status value={d.record.state} /> · Revision {d.record.revision}
                {d.source_changed
                  ? " · Source changed; renewed review required"
                  : ""}
              </p>
              <p>
                {d.record.content.included_scope || "Scope not yet recorded"}
              </p>
              <p>
                Requested: {d.record.content.requested_date ?? "Date needed"} ·
                Receiving owner:{" "}
                {d.owners.find((x) => x.id === d.record.receiving_owner_id)
                  ?.display_name ?? "Queue / routing decision required"}
              </p>
            </article>
          ))}
          {!list.data.items.length && (
            <p>No permitted handovers in this queue.</p>
          )}
        </>
      )}
      {kind === "Estimating" && (
        <Link href={receiving ? root(kind) : "/estimating/intake"}>
          {receiving ? "Sales preparation" : "Open Estimating Intake"}
        </Link>
      )}
    </>
  );
}
export function HandoverDetail({ id }: { id: string }) {
  const r = useCrmResource<Detail>(`sales/handovers/${id}`, true);
  return (
    <>
      {r.loading && <p role="status">Loading handover…</p>}
      <ErrorNotice error={r.error} />
      {!!r.error && <Button onClick={r.reload}>Retry handover</Button>}
      {!r.error && r.data && (
        <HandoverContentView key={id} data={r.data} reload={r.reload} />
      )}
    </>
  );
}
function HandoverContentView({
  data: d,
  reload,
}: {
  data: Detail;
  reload: () => void;
}) {
  const row = d.record,
    [content, setContent] = useState(row.content),
    [owner, setOwner] = useState(row.receiving_owner_id ?? ""),
    [note, setNote] = useState(""),
    [returnActivity, setReturnActivity] = useState(
      row.content.next_activity_id ?? "",
    ),
    [tab, setTab] = useState("brief"),
    [dirty, setDirty] = useState(false),
    [baseVersion, setBaseVersion] = useState(row.version);
  const command = useHandoverCommand(row.id, reload),
    deal = useCrmResource<
      Envelope<Awaited<ReturnType<typeof readOpportunity>>>
    >(`crm/opportunities/${row.opportunity_id}`, true);
  useEffect(() => {
    if (!dirty && row.version >= baseVersion) {
      let live = true;
      queueMicrotask(() => {
        if (live) {
          setContent(row.content);
          setOwner(row.receiving_owner_id ?? "");
          setBaseVersion(row.version);
        }
      });
      return () => {
        live = false;
      };
    }
  }, [row.version, row.content, row.receiving_owner_id, dirty, baseVersion]);
  useEffect(() => {
    if (command.accepted) {
      let live = true;
      queueMicrotask(() => {
        if (live) {
          setDirty(false);
          setBaseVersion(command.accepted!.receipt.record_version);
        }
      });
      return () => {
        live = false;
      };
    }
  }, [command.accepted]);
  const refreshing =
    !!command.accepted && row.version < command.accepted.receipt.record_version;
  const blocked =
    command.busy || !!command.pending || !command.ready || refreshing;
  useUnsavedChanges(dirty, !!command.pending);
  const set = <K extends keyof HandoverContent>(
    key: K,
    value: HandoverContent[K],
  ) => {
    setContent((o) => ({ ...o, [key]: value }));
    setDirty(true);
  };
  async function act(action: string) {
    const question = [...d.history]
      .reverse()
      .find((e) => e.action === "Clarify" && e.revision === row.revision);
    await command.send(
      `sales/handovers/${row.id}`,
      {
        action,
        expected_version: action === "Save" ? baseVersion : row.version,
        reason: note || `${action} Sales handover`,
        note: ["Clarify", "Answer", "Resolve", "Return", "Accept"].includes(
          action,
        )
          ? note
          : note || `${action} Sales handover`,
        ...(action === "Save"
          ? { content, receiving_owner_id: owner || null }
          : {}),
        ...(["Answer", "Resolve"].includes(action)
          ? { question_id: question?.id }
          : {}),
        ...(action === "Accept" ? { source_hash: row.source_hash } : {}),
        ...(action === "Return"
          ? { follow_up_activity_id: returnActivity || null }
          : {}),
      },
      `${root(row.kind)}/${row.id}`,
      action,
      row.id,
    );
  }
  const predecessor = [...d.history]
    .reverse()
    .find((e) => e.action === "Submit" && e.revision < row.revision);
  return (
    <>
      <Link href={root(row.kind)}>← Handover worklist</Link>
      <ErrorNotice error={deal.error} />
      {!!deal.error && (
        <Button onClick={deal.reload}>Retry opportunity actions</Button>
      )}
      <PageHeader
        eyebrow="Sales handover"
        title={d.opportunity.title}
        description={`${row.kind} handover · Revision ${row.revision} · Saved version ${row.version}`}
      />
      <p>
        <Status value={row.state} /> ·{" "}
        <Link href={`/sales/opportunities/${row.opportunity_id}`}>
          {d.opportunity.display_number}
        </Link>{" "}
        · As at <Stamp value={d.observed_at} />
      </p>
      <Recovery command={command} />
      {refreshing && (
        <p role="status">
          Loading the saved revision before the next decision…
        </p>
      )}
      {baseVersion !== row.version && dirty && (
        <section role="alert">
          <h2>Saved handover changed</h2>
          <p>
            Your draft is retained. Compare with the saved content before a
            deliberate retry.
          </p>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify(row.content, null, 2)}
          </pre>
          <Button
            disabled={blocked}
            onClick={() => setBaseVersion(row.version)}
          >
            Use current version for deliberate retry
          </Button>
        </section>
      )}
      {dirty && (
        <p role="status">Unsaved changes. Save the draft before submitting.</p>
      )}
      {d.source_changed && (
        <p role="alert">
          Source changed since submission. The earlier basis and decision
          remain; return for a corrected successor before acceptance.
        </p>
      )}
      <RecordTabs
        id="handover"
        label="Handover sections"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "brief", label: "Brief & scope" },
          { id: "review", label: "Review & clarification" },
          { id: "history", label: "History & comparison" },
        ]}
      />
      <RecordPanel id="handover" tab="brief" value={tab}>
        <section className="crm-panel">
          <h2>Exact handover brief</h2>
          <fieldset
            disabled={!d.can_prepare || row.state !== "Draft" || blocked}
          >
            <div className="form-grid">
              {(
                [
                  ["problem", "Customer problem"],
                  ["outcome", "Desired outcome"],
                  ["included_scope", "Included scope"],
                  ["exclusions", "Exclusions (record None if none)"],
                  ["assumptions", "Assumptions (record None if none)"],
                  ["unknowns", "Unresolved unknowns and their owner"],
                  ["date_reason", "Requested-date basis / reason unknown"],
                ] as const
              ).map(([key, label]) => (
                <Field
                  key={key}
                  name={key}
                  label={label}
                  value={content[key]}
                  onChange={(v) => set(key, v)}
                  multiline
                  maxLength={4000}
                />
              ))}
              <Field
                name="requested_date"
                label="Requested date"
                type="date"
                value={content.requested_date ?? ""}
                onChange={(v) => set("requested_date", v || null)}
              />
            </div>
            {d.locations.map((x) => (
              <label key={x.id}>
                <input
                  type="checkbox"
                  checked={(x.kind === "Facility"
                    ? content.facility_ids
                    : content.asset_ids
                  ).includes(x.id)}
                  onChange={(e) => {
                    const k =
                      x.kind === "Facility" ? "facility_ids" : "asset_ids";
                    set(
                      k,
                      e.target.checked
                        ? [...content[k], x.id]
                        : content[k].filter((id) => id !== x.id),
                    );
                  }}
                />
                {x.kind} · {x.display_name}
              </label>
            ))}
            <SelectField
              name="next_activity_id"
              label="Owned next action (shared Activity)"
              value={content.next_activity_id ?? ""}
              onChange={(v) => set("next_activity_id", v || null)}
              options={
                deal.data?.items[0]?.actions
                  .filter((a) => ["Open", "InProgress"].includes(a.status))
                  .map((a) => ({
                    id: a.id,
                    display_name: `${a.summary} · ${a.owner_name}`,
                  })) ?? []
              }
            />
            <p>
              Create or date the follow-up in{" "}
              <Link
                href={`/sales/opportunities/${row.opportunity_id}?section=timeline`}
              >
                Deal Activities
              </Link>
              .
            </p>
            {row.kind === "Won" && (
              <>
                <SelectField
                  name="destination"
                  label="Destination"
                  value={content.destination}
                  onChange={(v) => {
                    set("destination", v as HandoverContent["destination"]);
                    setOwner("");
                  }}
                  options={destinations.map((id) => ({
                    id,
                    display_name:
                      id === "Undecided" ? "Routing decision required" : id,
                  }))}
                />
                <p>
                  Save a destination before selecting its eligible receiving
                  owner. Parts receiving is unavailable.
                </p>
                <Field
                  name="routing_basis"
                  label="Routing evidence and exact source revision"
                  multiline
                  maxLength={4000}
                  value={content.routing_basis}
                  onChange={(v) => set("routing_basis", v)}
                />
                <Field
                  name="delivery_items"
                  label="Selected delivery items"
                  multiline
                  maxLength={4000}
                  value={content.delivery_items}
                  onChange={(v) => set("delivery_items", v)}
                />
                <Field
                  name="release_prerequisites"
                  label="Open work-release prerequisites and owners"
                  multiline
                  maxLength={4000}
                  value={content.release_prerequisites}
                  onChange={(v) => set("release_prerequisites", v)}
                />
              </>
            )}
            <SelectField
              name="receiving_owner_id"
              label="Receiving owner"
              value={owner}
              onChange={(v) => {
                setOwner(v);
                setDirty(true);
              }}
              options={d.owners}
            />
            <h3>Evidence references</h3>
            <p>
              Exact native Draft quotation or Service document references; bytes
              remain with their source. A Draft quotation is not customer
              acceptance.
            </p>
            {content.evidence.map((e, i) => (
              <div key={i}>
                <SelectField
                  name={`evidence-kind-${i}`}
                  label="Source kind"
                  value={e.kind}
                  options={["DraftQuote", "ServiceDocument"].map((id) => ({
                    id,
                    display_name: id,
                  }))}
                  onChange={(v) =>
                    set(
                      "evidence",
                      content.evidence.map((x, j) =>
                        i === j ? { ...x, kind: v as typeof e.kind } : x,
                      ),
                    )
                  }
                />
                {(["id", "purpose"] as const).map((k) => (
                  <Field
                    key={k}
                    name={`evidence-${i}-${k}`}
                    label={
                      k === "id" ? "Exact source UUID" : "Evidence purpose"
                    }
                    value={e[k]}
                    onChange={(v) =>
                      set(
                        "evidence",
                        content.evidence.map((x, j) =>
                          i === j ? { ...x, [k]: v } : x,
                        ),
                      )
                    }
                  />
                ))}
                <Field
                  name={`evidence-revision-${i}`}
                  label="Exact revision"
                  type="text"
                  value={String(e.revision)}
                  onChange={(v) =>
                    set(
                      "evidence",
                      content.evidence.map((x, j) =>
                        i === j ? { ...x, revision: v } : x,
                      ),
                    )
                  }
                />
                <Button
                  onClick={() =>
                    set(
                      "evidence",
                      content.evidence.filter((_, j) => i !== j),
                    )
                  }
                >
                  Remove reference
                </Button>
              </div>
            ))}
            <Button
              onClick={() =>
                set("evidence", [
                  ...content.evidence,
                  { kind: "DraftQuote", id: "", revision: "1", purpose: "" },
                ])
              }
            >
              Add evidence reference
            </Button>
          </fieldset>
          {d.can_receive && (
            <SelectField
              name="return-activity"
              label="Owned follow-up for return"
              value={returnActivity}
              onChange={setReturnActivity}
              options={(deal.data?.items[0]?.actions ?? [])
                .filter(
                  (a) => ["Open", "InProgress"].includes(a.status) && a.due_at,
                )
                .map((a) => ({ id: a.id, display_name: a.summary }))}
            />
          )}
          {d.can_prepare && row.state === "Draft" && (
            <Button disabled={blocked} onClick={() => void act("Save")}>
              Save draft
            </Button>
          )}
        </section>
      </RecordPanel>
      <RecordPanel id="handover" tab="review" value={tab}>
        <section className="crm-panel">
          <h2>Readiness and receiving decision</h2>
          <p>
            {d.readiness.length
              ? `Missing: ${d.readiness.join(", ")}`
              : "Ready to submit saved content"}
            . Readiness is not receiver acceptance.
          </p>
          <p>
            Quotation/customer acceptance: unavailable native source. ERP
            conversion: unavailable native source. Review does not authorise
            work, scheduling, delivery or Finance processing.
          </p>
          <p>Source fingerprint: {row.source_hash ?? "Not submitted"}</p>
          <Field
            name="review-note"
            label="Review, clarification or return reason"
            value={note}
            onChange={setNote}
            multiline
            maxLength={4000}
          />
          {d.can_receive && (
            <SelectField
              name="return-activity"
              label="Owned follow-up for return"
              value={returnActivity}
              onChange={setReturnActivity}
              options={(deal.data?.items[0]?.actions ?? [])
                .filter(
                  (a) => ["Open", "InProgress"].includes(a.status) && a.due_at,
                )
                .map((a) => ({ id: a.id, display_name: a.summary }))}
            />
          )}
          {d.can_prepare && row.state === "Draft" && (
            <Button
              disabled={blocked || dirty || !!d.readiness.length}
              onClick={() => void act("Submit")}
            >
              Submit exact revision
            </Button>
          )}
          {d.can_prepare && row.state === "ClarificationRequested" && (
            <Button
              disabled={blocked || !note.trim()}
              onClick={() => void act("Answer")}
            >
              Answer clarification
            </Button>
          )}
          {d.can_prepare && ["Returned", "Accepted"].includes(row.state) && (
            <Button
              disabled={blocked || !note.trim()}
              onClick={() => void act("Successor")}
            >
              Create successor revision
            </Button>
          )}
          {d.can_receive && (
            <>
              {row.state === "Submitted" && (
                <>
                  <Button
                    disabled={blocked || !note.trim()}
                    onClick={() => void act("Clarify")}
                  >
                    Request clarification
                  </Button>
                  <Button
                    disabled={blocked || d.source_changed || !note.trim()}
                    onClick={() => void act("Accept")}
                  >
                    Accept exact revision
                  </Button>
                </>
              )}
              {row.state === "ClarificationAnswered" && (
                <Button
                  disabled={blocked || !note.trim()}
                  onClick={() => void act("Resolve")}
                >
                  Resolve reviewed answer
                </Button>
              )}
              {[
                "Submitted",
                "ClarificationRequested",
                "ClarificationAnswered",
              ].includes(row.state) && (
                <Button
                  disabled={blocked || !note.trim()}
                  onClick={() => void act("Return")}
                >
                  Return with owned follow-up
                </Button>
              )}
            </>
          )}
          {!d.can_prepare && !d.can_receive && (
            <p>Read only under current permissions and receiving ownership.</p>
          )}
          {d.history
            .filter((e) =>
              ["Clarify", "Answer", "Resolve", "Return", "Accept"].includes(
                e.action,
              ),
            )
            .map((e) => (
              <article key={e.id}>
                <h3>
                  {e.action} · revision {e.revision}
                </h3>
                <p className="crm-narrative">{e.note}</p>
                {e.follow_up_activity_id && (
                  <Link href={`/work/${e.follow_up_activity_id}`}>
                    Owned return follow-up
                  </Link>
                )}
                <p>
                  {e.recorded_by} · <Stamp value={String(e.recorded_at)} />
                </p>
              </article>
            ))}
        </section>
      </RecordPanel>
      <RecordPanel id="handover" tab="history" value={tab}>
        <section className="crm-panel">
          <h2>Retained revisions</h2>
          {predecessor && (
            <>
              <h3>
                Difference from prior submitted revision {predecessor.revision}
              </h3>
              {Object.keys(content)
                .filter(
                  (k) =>
                    JSON.stringify(content[k as keyof HandoverContent]) !==
                    JSON.stringify(
                      predecessor.content[k as keyof HandoverContent],
                    ),
                )
                .map((k) => (
                  <p key={k}>
                    <strong>{k}</strong> · Before:{" "}
                    {JSON.stringify(
                      predecessor.content[k as keyof HandoverContent],
                    )}{" "}
                    · Current:{" "}
                    {JSON.stringify(content[k as keyof HandoverContent])}
                  </p>
                ))}
            </>
          )}
          {d.history.map((e) => (
            <details key={e.id}>
              <summary>
                {e.action} · revision {e.revision} · version {e.version}
              </summary>
              <p>{e.note}</p>
              <p>
                {e.recorded_by} · <Stamp value={String(e.recorded_at)} />
              </p>
              <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                {JSON.stringify(
                  {
                    content: e.content,
                    basis: e.basis,
                    source_hash: e.source_hash,
                  },
                  null,
                  2,
                )}
              </pre>
            </details>
          ))}
        </section>
      </RecordPanel>
    </>
  );
}
