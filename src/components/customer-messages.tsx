"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { PhoneHeaderAction } from "../shell/phone-header";
import { ErrorNotice, useResource } from "./business-ui";
import { Button, ButtonLink } from "./ui/button";
import {
  RegisterTable,
  RegisterChip,
  RegisterEmpty,
  RegisterFooter,
} from "./ui/register-table";
import { WorklistPanel } from "./crm-worklist-tools";
import { EmailWorkspaceFrame } from "./email-workspace-menu";
import { useShell } from "./shell-provider";
import {
  classRules,
  holdSummary,
  type MessageClass,
} from "../communications/model";
import {
  inMessageView,
  messageDate,
  messageState,
  messageTone,
  messageViews,
  sourceHref,
  type MessageView,
  type MessageQueue,
  type MessageDetail,
  type MessageRow,
  type MessageSwitches,
} from "../communications/ui-model";
import {
  useMessageCommand,
  type MessageAction,
} from "./customer-message-command";
import "./customer-messages.css";

const root = "/email/customer-messages";
function State({ m }: { m: MessageRow }) {
  return (
    <RegisterChip tone={messageTone(m.state)}>{messageState(m)}</RegisterChip>
  );
}
function Recovery({
  command,
}: {
  command: ReturnType<typeof useMessageCommand>;
}) {
  return (
    <>
      <ErrorNotice error={command.error} />
      {command.saved && <p role="status">{command.saved}</p>}
      {command.pending && (
        <div className="cm-warning" role="status">
          <strong>Action outcome not confirmed</strong>
          <p>
            The original command is retained in this tab. Check its result with
            the identical operation; do not start another send.
          </p>
          <Button busy={command.busy} onClick={() => void command.send()}>
            Check original result
          </Button>
        </div>
      )}
    </>
  );
}
export function CustomerMessages({ id }: { id?: string }) {
  const [recordMore, setRecordMore] = useState<PhoneHeaderAction[]>([]);
  const params = useSearchParams(),
    router = useRouter();
  const view = (messageViews.find((v) => v.id === params.get("view"))?.id ??
    (id ? "all" : "to-send")) as MessageView;
  const selected = id ?? params.get("message");
  const queue = useResource<MessageQueue>(
    "customer-communications/queue?view=all",
  );
  const [search, setSearch] = useState(""),
    [cls, setClass] = useState(""),
    [customer, setCustomer] = useState(""),
    [date, setDate] = useState(""),
    [filter, setFilter] = useState(false);
  // A failed or outstanding read never leaves actionable stale rows or counts behind.
  const data = !queue.loading && !queue.error ? queue.data : null;
  const counts = data
    ? Object.fromEntries(
        messageViews
          .filter((v) => v.id !== "classes")
          .map((v) => [
            v.id,
            data.items.filter((m) => inMessageView(m, v.id)).length,
          ]),
      )
    : undefined;
  const items = (data?.items ?? []).filter(
    (m) =>
      inMessageView(m, view) &&
      (!cls || m.message_class === cls) &&
      (!customer || m.organisation_id === customer) &&
      (!date ||
        new Date(m.prepared_at).toLocaleDateString("en-CA", {
          timeZone: "Australia/Brisbane",
        }) >= date) &&
      `${m.subject ?? ""} ${m.recipient.name ?? ""} ${m.customer_name ?? ""} ${m.source.reference}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const classes = [
    ...new Set([
      "DispatchNotice",
      "DelayNotice",
      ...(data?.items.map((m) => m.message_class) ?? []),
    ]),
  ] as MessageClass[];
  const customers = [
    ...new Map(
      (data?.items ?? []).map((m) => [
        m.organisation_id,
        m.customer_name ?? "Customer name not bound",
      ]),
    ).entries(),
  ];
  const open = (message: string) =>
    router.push(`${root}?view=${view}&message=${message}`, { scroll: false });
  const filters = (
    <div className="cm-filters">
      <label>
        Search messages
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Message, customer or recipient"
        />
      </label>
      <label>
        Class
        <select value={cls} onChange={(e) => setClass(e.target.value)}>
          <option value="">All classes</option>
          {classes.map((c) => (
            <option key={c} value={c}>
              {classRules[c].code} {classRules[c].label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Customer
        <select value={customer} onChange={(e) => setCustomer(e.target.value)}>
          <option value="">All customers</option>
          {customers.map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Prepared on or after · Brisbane
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>
      <Button
        onClick={() => {
          setSearch("");
          setClass("");
          setCustomer("");
          setDate("");
        }}
      >
        Clear filters
      </Button>
    </div>
  );
  return (
    <EmailWorkspaceFrame
      view={view}
      counts={counts}
      phoneHeader={{
        record: selected
          ? {
              position: items.some((m) => m.id === selected)
                ? `${items.findIndex((m) => m.id === selected) + 1} of ${items.length}`
                : "Message",
              previous: {
                label: "Previous message",
                disabled:
                  !data || items.findIndex((m) => m.id === selected) < 1,
                onSelect: () => {
                  const i = items.findIndex((m) => m.id === selected) ?? -1;
                  if (i > 0) open(items[i - 1].id);
                },
              },
              next: {
                label: "Next message",
                disabled:
                  !data ||
                  items.findIndex((m) => m.id === selected) < 0 ||
                  items.findIndex((m) => m.id === selected) >= items.length - 1,
                onSelect: () => {
                  const i = items.findIndex((m) => m.id === selected) ?? -1;
                  if (i >= 0 && i < items.length - 1) open(items[i + 1].id);
                },
              },
              more: [
                ...recordMore,
                {
                  label: "Back to messages",
                  onSelect: () => router.push(`${root}?view=${view}`),
                },
              ],
            }
          : undefined,
        title: selected
          ? "Customer message"
          : messageViews.find((v) => v.id === view)?.label,
        count: selected ? undefined : counts?.[view],
        ...(!selected && view !== "classes"
          ? {
              pageAction: {
                icon: "search",
                label: "Search messages",
                search: true,
                onSelect: () => setFilter(true),
              },
              filter: {
                open: () => setFilter(true),
                applied: !!(search || cls || customer || date),
              },
            }
          : {}),
      }}
    >
      <h1 className="ppo-register-title">Customer messages</h1>
      {selected ? (
        <CustomerMessageRecord
          key={selected}
          id={selected}
          full={!!id}
          onMore={setRecordMore}
          onSaved={() => queue.reload()}
          back={`${root}?view=${view}`}
        />
      ) : view === "classes" ? (
        <MessageClasses available={classes} />
      ) : (
        <>
          <div className="cm-toolbar">
            {filters}
            <span>
              {data
                ? `${items.length} messages in window`
                : "Messages unavailable"}
            </span>
            <Button onClick={() => queue.reload()} disabled={queue.loading}>
              Refresh
            </Button>
          </div>
          <p className="cm-simulated">
            Simulated only · nothing reaches a provider, mailbox or customer.
          </p>
          {(search || cls || customer || date) && (
            <p className="cm-filter-summary">
              Filters applied{" "}
              <Button
                variant="quiet"
                onClick={() => {
                  setSearch("");
                  setClass("");
                  setCustomer("");
                  setDate("");
                }}
              >
                Clear
              </Button>
            </p>
          )}
          <ErrorNotice error={queue.error} />
          {queue.loading && (
            <p className="cm-read" role="status">
              Loading messages…
            </p>
          )}
          {data && (
            <>
              <div className="cm-desktop-grid">
                <RegisterTable
                  caption="Customer messages. Open a message to review its exact content."
                  footer={<RegisterFooter>{data.coverage}</RegisterFooter>}
                  empty={
                    !items.length && (
                      <RegisterEmpty
                        title={
                          view === "to-send"
                            ? "Nothing to send"
                            : "No matching messages"
                        }
                      >
                        <p>
                          No permitted messages match this view and its filters.
                        </p>
                      </RegisterEmpty>
                    )
                  }
                >
                  <thead>
                    <tr>
                      {[
                        "Message",
                        "Class",
                        "State",
                        "Customer",
                        "To",
                        "Source",
                        "Prepared",
                        "Owner",
                      ].map((x) => (
                        <th scope="col" key={x}>
                          {x}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((m) => (
                      <tr key={m.id}>
                        <td className="ppo-register-wrap">
                          <button
                            className="cm-message-link"
                            onClick={() => open(m.id)}
                          >
                            {m.subject ?? `${m.label} · content unavailable`}
                          </button>
                        </td>
                        <td>
                          {m.code} {m.label}
                        </td>
                        <td>
                          <State m={m} />
                        </td>
                        <td>{m.customer_name ?? "Not bound"}</td>
                        <td>{m.recipient.name ?? "No named contact"}</td>
                        <td>{m.source.reference}</td>
                        <td>
                          <time dateTime={m.prepared_at}>
                            {messageDate(m.prepared_at)}
                          </time>
                        </td>
                        <td>{m.owner.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </RegisterTable>
              </div>
              <div className="cm-phone-list">
                {items.map((m) => (
                  <button
                    key={m.id}
                    className="cm-phone-message"
                    onClick={() => open(m.id)}
                  >
                    <strong>{m.subject ?? m.label}</strong>
                    <span>
                      {m.customer_name ?? "Customer not bound"} ·{" "}
                      {m.recipient.name ?? "No named contact"}
                    </span>
                    <State m={m} />
                    <small>
                      {m.code} · {m.source.reference} ·{" "}
                      {messageDate(m.prepared_at)}
                    </small>
                  </button>
                ))}
                {!items.length && (
                  <RegisterEmpty
                    title={
                      view === "to-send"
                        ? "Nothing to send"
                        : "No matching messages"
                    }
                  />
                )}
                <p className="cm-read">{data.coverage}</p>
              </div>
            </>
          )}
        </>
      )}
      {filter && (
        <WorklistPanel
          title="Search and filter"
          onClose={() => setFilter(false)}
        >
          <div className="cm-dialog">
            {filters}
            <Button variant="primary" onClick={() => setFilter(false)}>
              Show messages
            </Button>
          </div>
        </WorklistPanel>
      )}
    </EmailWorkspaceFrame>
  );
}

function CustomerMessageRecord({
  id,
  full,
  onSaved,
  onMore,
  back,
}: {
  id: string;
  full: boolean;
  onSaved: () => void;
  onMore: (items: PhoneHeaderAction[]) => void;
  back: string;
}) {
  const r = useResource<MessageDetail>(`customer-communications/${id}`),
    [tab, setTab] = useState("Message"),
    [note, setNote] = useState(""),
    [intent, setIntent] = useState<MessageAction | null>(null);
  const command = useMessageCommand(
    id,
    () => {
      setIntent(null);
      setNote("");
      r.reload();
      onSaved();
    },
    () => {
      setIntent(null);
      r.reload();
    },
  );
  const m = !r.loading && !r.error ? r.data : null;
  const disabled = !command.ready || command.busy || !!command.pending;
  const router = useRouter();
  const canWithdraw = !!m?.actions.withdraw && !disabled;
  const source = m ? sourceHref(m) : null;
  useEffect(() => {
    onMore([
      ...(canWithdraw
        ? [
            {
              label: "Withdraw",
              onSelect: () => setIntent("withdraw" as const),
            },
          ]
        : []),
      ...(source
        ? [{ label: "Open source record", onSelect: () => router.push(source) }]
        : []),
    ]);
    return () => onMore([]);
  }, [canWithdraw, source, onMore, router]);
  const confirmLabel =
    m?.review === "Reviewed" ? "Approve and send" : "Confirm and send";
  async function submit() {
    if (!m || !intent) return;
    const reason =
      note.trim() ||
      (intent === "confirm"
        ? "Named sender confirmed the exact synthetic customer message."
        : intent === "reconcile"
          ? "Check the original outcome in synthetic Sent Items."
          : "Withdraw the prepared synthetic customer message.");
    await command.send(intent, {
      expected_version: m.version,
      reason,
      ...(intent === "confirm" ? { content_hash: m.content_hash } : {}),
    });
  }
  const action = (a: MessageAction, label: string, primary = false) => (
    <Button
      variant={primary ? "primary" : "secondary"}
      disabled={disabled}
      onClick={() => setIntent(a)}
    >
      {label}
    </Button>
  );
  return (
    <div className="cm-record-host">
      <div className="cm-record-tools">
        <Link href={back}>← Back to messages</Link>
        {!full && (
          <Link href={`${root}/${id}${back.slice(root.length)}`}>
            Open full record
          </Link>
        )}
        <Button
          onClick={() => r.reload()}
          disabled={command.busy || !!command.pending || r.loading}
        >
          Refresh message
        </Button>
      </div>
      <Recovery command={command} />
      <ErrorNotice error={r.error} />
      {r.loading && (
        <p role="status" className="cm-read">
          Loading current message…
        </p>
      )}
      {m && (
        <div className="cm-record">
          <aside className="cm-facts">
            <h2>{m.subject ?? m.label}</h2>
            <p>
              {m.source.reference} ·{" "}
              {m.customer_name ?? "Customer name not bound"}
            </p>
            <State m={m} />
            <div className="cm-recipient-context">
              <h3>Sends to · fixed when prepared</h3>
              <p>
                <strong>{m.recipient.name ?? "No named contact"}</strong>
                <br />
                {m.recipient.address ?? "No address recorded"}
                <br />
                {m.recipient.role}
              </p>
              {m.recipient.contact_id && (
                <Link href={`/people/${m.recipient.contact_id}`}>
                  Open person
                </Link>
              )}
              <p>
                From the shared customer mailbox
                <br />
                <small>
                  customers@powerplants.example · synthetic placeholder
                </small>
              </p>
              <p>
                {m.notice_preference === "DoNotNotify"
                  ? "Do not notify"
                  : m.notice_preference === "Allowed"
                    ? "Notices allowed"
                    : "No notice preference recorded"}
              </p>
            </div>
            <div className="cm-built-from">
              <h3>Built from</h3>
              <p>
                {m.source.reference} · fact version {m.source.fact_version}
              </p>
              <p>
                Template:{" "}
                {m.template
                  ? `${m.label} v${m.template.version}`
                  : "No prepared template"}
              </p>
              <dl className="cm-source-facts">
                {[
                  ["dispatch.carrier", "Carrier"],
                  ["dispatch.tracking_number", "Consignment"],
                  ["dispatch.quantity", "This movement"],
                  ["dispatch.dispatched_quantity", "Dispatched"],
                  ["dispatch.outstanding_quantity", "Outstanding"],
                  ["dispatch.unit", "Unit"],
                  ["delivery.customer_eta", "Customer ETA"],
                  ["delay.previous_eta", "Previous customer ETA"],
                  ["delay.reason", "Delay reason"],
                ]
                  .filter(([key]) => m.facts[key] != null)
                  .map(([key, label]) => (
                    <div key={key}>
                      <dt>{label}</dt>
                      <dd>{m.facts[key]}</dd>
                    </div>
                  ))}
              </dl>
              <p>Message owner: {m.owner.name}</p>
              <p className="cm-information">
                Confirmation checks the current source, recipient, preference,
                class switch and your authority again. Sent is simulated and
                never confirms delivery or reading.
              </p>
              <ButtonLink href={sourceHref(m)}>Open source record</ButtonLink>
            </div>
          </aside>
          <section className="cm-review">
            <nav className="cm-tabs" aria-label="Message detail views">
              {["Message", "Facts", "History"].map((t) => (
                <Button
                  key={t}
                  variant="quiet"
                  aria-pressed={tab === t}
                  onClick={() => setTab(t)}
                >
                  {t}
                  {t === "History" ? ` · ${m.history.length}` : ""}
                </Button>
              ))}
            </nav>
            {tab === "Message" && (
              <>
                <div className="cm-preview-heading">
                  <strong>
                    Exact message · fixed {messageDate(m.prepared_at)}
                  </strong>
                  <span>Simulated</span>
                  <small>
                    {m.template
                      ? `CUS-EMAIL ${m.label} v${m.template.version}`
                      : "Template unavailable"}{" "}
                    · content check{" "}
                    <code title={m.content_hash ?? undefined}>
                      {m.content_hash?.slice(0, 8) ?? "Unavailable"}
                    </code>
                  </small>
                </div>
                <article
                  className="cm-email"
                  data-dimmed={["Held", "Failed"].includes(m.state)}
                >
                  <dl>
                    <dt>To</dt>
                    <dd>
                      {m.recipient.name ?? "No named contact"} &lt;
                      {m.recipient.address ?? "no address"}&gt;
                    </dd>
                    <dt>From</dt>
                    <dd>
                      Powerplants &lt;customers@powerplants.example&gt; ·
                      placeholder
                    </dd>
                    <dt>Subject</dt>
                    <dd>
                      <strong>{m.subject ?? "Content not prepared"}</strong>
                    </dd>
                  </dl>
                  <div className="cm-body">
                    {m.body ??
                      "No exact content was prepared. Review the hold reason and source record."}
                  </div>
                </article>
                <div className="cm-readiness">
                  <strong>
                    {m.state === "Prepared"
                      ? m.current_hold
                        ? `Sending would be held: ${holdSummary(m.current_hold)}`
                        : "Ready for confirmation · source checks passed at this read"
                      : messageState(m)}
                  </strong>
                  <p>
                    Checked {messageDate(m.checked_at)}. Nothing leaves PPO.
                  </p>
                </div>
                {!m.actions.duty && (
                  <p className="cm-warning">
                    View only · sending needs the customer send duty and this
                    class’s working duty.
                  </p>
                )}
                {!m.actions.independent_sender && (
                  <p className="cm-warning">
                    Independent sender required · you prepared this reviewed
                    message.
                  </p>
                )}
                {m.state === "Prepared" && m.actions.confirm && (
                  <label className="cm-note">
                    Sending note{" "}
                    {m.review === "Reviewed"
                      ? "(required approval note)"
                      : "(optional)"}
                    <textarea
                      value={note}
                      maxLength={2000}
                      disabled={disabled}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </label>
                )}
                {m.follow_up && (
                  <p>
                    <ButtonLink
                      variant={
                        ["Held", "Failed"].includes(m.state)
                          ? "primary"
                          : "secondary"
                      }
                      href={`/work/${m.follow_up.activity_id}`}
                    >
                      Open follow-up
                    </ButtonLink>{" "}
                    · {m.follow_up.status}
                  </p>
                )}
                {m.state === "Failed" && <p>{m.last_evidence}</p>}
                {m.state === "OutcomeUnknown" && (
                  <p>
                    Check synthetic Sent Items for the original message. A
                    missing copy requeues that original job; this page has no
                    resend action.
                  </p>
                )}
                <div className="cm-actions">
                  {m.actions.confirm && (
                    <Button
                      variant="primary"
                      disabled={
                        disabled || (m.review === "Reviewed" && !note.trim())
                      }
                      onClick={() => setIntent("confirm")}
                    >
                      {confirmLabel}
                    </Button>
                  )}
                  {m.actions.reconcile &&
                    action("reconcile", "Check Sent Items", true)}
                  {m.actions.withdraw && (
                    <span className="cm-withdraw">
                      {action("withdraw", "Withdraw")}
                    </span>
                  )}
                </div>
                {m.actions.withdraw && (
                  <details className="cm-phone-more">
                    <summary>More</summary>
                    {action("withdraw", "Withdraw")}
                    <Link href={sourceHref(m)}>Open source record</Link>
                    <span>
                      Template management is not available in this build.
                    </span>
                  </details>
                )}
                <p className="cm-template-link">
                  Template management is not available in this build. The
                  prepared template version and content check remain above.
                </p>
              </>
            )}
            {tab === "Facts" && (
              <div className="cm-fact-list">
                <h3>Facts bound when prepared</h3>
                <dl>
                  {Object.entries(m.facts).map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>{v ?? "Not recorded"}</dd>
                    </div>
                  ))}
                </dl>
                {m.template && (
                  <p>
                    Template v{m.template.version} · definition check{" "}
                    <code>{m.template.definition_hash}</code>
                  </p>
                )}
              </div>
            )}
            {tab === "History" && (
              <ol className="cm-history">
                {m.history.map((e) => (
                  <li key={e.version}>
                    <strong>
                      {messageState({
                        state: e.state,
                        hold_reason: e.hold_reason,
                        last_evidence: e.evidence,
                      })}
                    </strong>
                    <p>
                      {messageDate(e.occurred_at)} · {e.actor}
                    </p>
                    <p>{e.evidence}</p>
                    <p>{e.reason}</p>
                  </li>
                ))}
                <li>
                  <strong>Every outcome is simulated</strong>
                  <p>Sent does not establish delivery or reading.</p>
                </li>
              </ol>
            )}
          </section>
        </div>
      )}
      {intent && m && (
        <WorklistPanel
          title={
            intent === "confirm"
              ? confirmLabel
              : intent === "withdraw"
                ? "Withdraw message"
                : "Check Sent Items"
          }
          onClose={() => {
            if (!command.busy && !command.pending) setIntent(null);
          }}
        >
          <form
            className="cm-dialog"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <p>
              <strong>{m.recipient.name}</strong> &lt;{m.recipient.address}&gt;
            </p>
            <p>
              <strong>Subject</strong>
              <br />
              {m.subject}
            </p>
            <p>
              Content check <code>{m.content_hash ?? "Not prepared"}</code>
            </p>
            <p>
              Template:{" "}
              {m.template
                ? `CUS-EMAIL ${m.label} v${m.template.version}`
                : "Not prepared"}
            </p>
            <p>
              Named sender: <strong>{m.sender.name}</strong>
            </p>
            <p>
              {intent === "confirm"
                ? "Confirm this exact content. PPO checks your authority, current source facts, recipient, preference and class switch again before simulated hand-over. Delivery is not claimed."
                : intent === "withdraw"
                  ? "Withdraw before hand-over. This preserves the prepared content and history."
                  : "Reconcile the original message against synthetic Sent Items. No provider is contacted."}
            </p>
            <p className="cm-warning">
              Simulated: nothing reaches a provider, mailbox or customer.
            </p>
            <label>
              {intent === "confirm"
                ? m.review === "Reviewed"
                  ? "Approval note (required)"
                  : "Sending note (optional)"
                : "Reason"}
              <input
                required={intent !== "confirm" || m.review === "Reviewed"}
                value={note}
                maxLength={2000}
                onChange={(e) => setNote(e.target.value)}
                disabled={disabled}
              />
            </label>
            <Recovery command={command} />
            <Button
              variant="primary"
              type="submit"
              disabled={
                disabled ||
                (intent !== "confirm" && !note.trim()) ||
                (intent === "confirm" &&
                  m.review === "Reviewed" &&
                  !note.trim())
              }
            >
              {intent === "confirm"
                ? confirmLabel
                : intent === "withdraw"
                  ? "Confirm withdrawal"
                  : "Check Sent Items"}
            </Button>
            <Button
              disabled={command.busy || !!command.pending}
              onClick={() => setIntent(null)}
            >
              Cancel
            </Button>
          </form>
        </WorklistPanel>
      )}
    </div>
  );
}

function MessageClasses({ available }: { available: MessageClass[] }) {
  const shell = useShell(),
    companies = shell.context?.companies ?? [],
    [choice, setChoice] = useState("");
  const company =
    choice ||
    shell.context?.working_company_id ||
    (companies.length === 1 ? companies[0].id : "");
  return (
    <div className="cm-classes">
      <h2>Message classes</h2>
      <p>
        Simulated sending only. Templates stay in Template management; notice
        preferences stay on People.
      </p>
      <label>
        Company
        <select value={company} onChange={(e) => setChoice(e.target.value)}>
          <option value="">Choose a company</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      {company && (
        <ClassRows key={company} company={company} available={available} />
      )}
    </div>
  );
}
function ClassRows({
  company,
  available,
}: {
  company: string;
  available: MessageClass[];
}) {
  const r = useResource<MessageSwitches>(
      `customer-communications/switches?company_id=${company}`,
    ),
    [selected, setSelected] = useState<MessageClass | null>(null),
    [reason, setReason] = useState("");
  const templates = useResource<{
    classes: {
      message_class: MessageClass;
      current: { version: number } | null;
    }[];
  }>(`customer-email-templates?company_id=${company}`);
  const command = useMessageCommand(
    `company:${company}`,
    () => {
      setSelected(null);
      setReason("");
      r.reload();
    },
    () => {
      setSelected(null);
      r.reload();
    },
  );
  const data = !r.loading && !r.error ? r.data : null,
    row = data?.classes.find((c) => c.message_class === selected);
  return (
    <>
      <Recovery command={command} />
      <ErrorNotice error={r.error} />
      <Button
        onClick={() => r.reload()}
        disabled={r.loading || command.busy || !!command.pending}
      >
        Refresh classes
      </Button>
      {r.loading && <p role="status">Loading message classes…</p>}
      {data && (
        <RegisterTable caption="Customer message classes and their synthetic sending switches">
          <thead>
            <tr>
              <th>Class</th>
              <th>How it is sent</th>
              <th>Sending switch</th>
              <th>Current template</th>
              <th>Sender duty</th>
            </tr>
          </thead>
          <tbody>
            {data.classes
              .filter((c) => available.includes(c.message_class))
              .map((c) => (
                <tr key={c.message_class}>
                  <td>
                    {c.code} {c.label}
                  </td>
                  <td>
                    {c.review === "Reviewed"
                      ? "Independent named sender"
                      : "Named sender confirms"}
                  </td>
                  <td>
                    <Button
                      role="switch"
                      aria-checked={c.mode === "Synthetic"}
                      aria-label={`${c.label} sending`}
                      disabled={
                        !data.can_switch ||
                        command.busy ||
                        !!command.pending ||
                        !command.ready
                      }
                      onClick={() => setSelected(c.message_class)}
                    >
                      {c.mode === "Synthetic" ? "On · synthetic" : "Off"}
                    </Button>
                  </td>
                  <td>
                    {templates.loading
                      ? "Loading…"
                      : templates.error
                        ? "Unavailable under current access"
                        : templates.data?.classes.find(
                              (t) => t.message_class === c.message_class,
                            )?.current
                          ? `Version ${templates.data.classes.find((t) => t.message_class === c.message_class)!.current!.version}`
                          : "Not published"}
                  </td>
                  <td>
                    Customer send duty +{" "}
                    {c.message_class === "VisitConfirmation"
                      ? "schedule management"
                      : c.message_class === "ProjectUpdate"
                        ? "project editing"
                        : "supply coordination"}
                  </td>
                </tr>
              ))}
          </tbody>
        </RegisterTable>
      )}
      {data &&
        data.classes
          .filter((c) => available.includes(c.message_class) && c.reason)
          .map((c) => (
            <p key={c.message_class} className="cm-class-change">
              <strong>
                {c.code} {c.label}:{" "}
                {c.mode === "Off" ? "Off" : "On · synthetic"}
              </strong>
              {c.recorded_by ? ` · ${c.recorded_by}` : ""}
              {c.recorded_at ? ` · ${messageDate(c.recorded_at)}` : ""}
              <br />
              {c.reason}
            </p>
          ))}
      {data && !data.can_switch && (
        <p>
          View only · changing switches needs the customer message switch duty.
        </p>
      )}
      {row && (
        <WorklistPanel
          title={`Turn ${row.mode === "Synthetic" ? "off" : "on"} ${row.label.toLowerCase()}`}
          onClose={() => {
            if (!command.busy && !command.pending) setSelected(null);
          }}
        >
          <form
            className="cm-dialog"
            onSubmit={(e) => {
              e.preventDefault();
              if (reason.trim())
                void command.send("switches", {
                  company_id: company,
                  message_class: row.message_class,
                  expected_version: row.version,
                  mode: row.mode === "Synthetic" ? "Off" : "Synthetic",
                  reason,
                });
            }}
          >
            <p>
              {row.mode === "Synthetic"
                ? "PPO stops preparing this class. Pending messages are held when confirmation or the worker checks the switch; existing records and history stay."
                : "Enable preparation on the synthetic channel only. Every message still needs named confirmation. Held messages remain held."}
            </p>
            <label>
              Reason (required)
              <textarea
                required
                maxLength={2000}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={command.busy || !!command.pending}
              />
            </label>
            <Recovery command={command} />
            <Button
              type="submit"
              variant="primary"
              disabled={!reason.trim() || command.busy || !!command.pending}
            >
              Confirm switch change
            </Button>
          </form>
        </WorklistPanel>
      )}
    </>
  );
}
