"use client";
// SV-01 register parts (build plan I2): board, list, phone cards, preview and the Move dialog. Presentation
// only. Every state, blocker and permitted action comes from the server read or from the existing commands.
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode, type UIEvent } from "react";
import { ReadState, useResource, type Envelope } from "../../../components/business-ui";
import { TriageActions, type Intake } from "../../../components/intake-screens";
import { ProductIcon } from "../../../components/product-icons";
import {
  actionDue,
  actionOwner,
  attention,
  cardChips,
  channelLabel,
  clarificationOverdue,
  customerLabel,
  equipmentLabel,
  formatWhen,
  initials,
  moveTargets,
  moveUnavailable,
  nativeLanes,
  nextAction,
  relativeTime,
  siteLabel,
  stageLabel,
  workOrderLabel,
  type MoveTarget,
  type RegisterItem,
  type Tone,
} from "../../ticket-register-view";

const href = (item: RegisterItem) => `/service/tickets/${item.id}`;

export function Chip({ tone = "neutral", icon, children }: { tone?: Tone; icon?: "warning" | "flag"; children: ReactNode }) {
  return (
    <span className={`sr-chip tone-${tone}`}>
      {icon && <ProductIcon name={icon} />}
      {children}
    </span>
  );
}

export function PriorityChip({ priority }: { priority: string }) {
  if (priority === "Urgent")
    return (
      <Chip tone="danger" icon="flag">
        Urgent
      </Chip>
    );
  if (priority === "High") return <Chip tone="warning">High</Chip>;
  return <span className="sr-priority-plain">{priority}</span>;
}

function Avatar({ name }: { name: string | null }) {
  return (
    <span className="sr-avatar" aria-hidden="true">
      {initials(name)}
    </span>
  );
}

// Unknown values are stated in amber words; "None" reads in grey. No cell is left blank.
function Unknown({ children }: { children: ReactNode }) {
  return <span className="sr-unknown">{children}</span>;
}
function customer(item: RegisterItem) {
  return item.customer ? item.customer.display_name : <Unknown>{customerLabel(item)}</Unknown>;
}
function site(item: RegisterItem) {
  return item.site?.display_name ? item.site.display_name : <Unknown>{siteLabel(item)}</Unknown>;
}
function equipment(item: RegisterItem) {
  return item.asset ? equipmentLabel(item) : <Unknown>Not recorded</Unknown>;
}

function NextActionBlock({ item, now }: { item: RegisterItem; now: Date }) {
  const action = nextAction(item, now),
    clarification = action.heading === "Owned clarification",
    overdue = clarificationOverdue(item, now),
    due = item.clarification?.due_at;
  return (
    <div className={`sr-next${overdue ? " is-danger" : ""}`}>
      <ProductIcon name={overdue ? "warning" : clarification ? "clock" : "expand"} />
      <div>
        <span className="sr-next-heading">{action.heading}</span>
        <strong>{action.text || "Not recorded"}</strong>
        {clarification ? (
          <>
            <span className="sr-next-owner">{action.owner ?? "Owner not visible"}</span>
            <span>
              {due
                ? `${formatWhen(due, now)} · ${relativeTime(now, due).text}`
                : action.dueNeeded
                  ? "Due time needed"
                  : "No due time"}
            </span>
          </>
        ) : (
          <span>Recorded next action · no due time</span>
        )}
      </div>
    </div>
  );
}

function WorkChips({ item }: { item: RegisterItem }) {
  return (
    <>
      {item.work_orders.map((order) => (
        <Chip key={order.id}>{workOrderLabel(order)}</Chip>
      ))}
    </>
  );
}

function MoveButton({ item, onMove, compact = false }: { item: RegisterItem; onMove: (item: RegisterItem) => void; compact?: boolean }) {
  const reason = moveUnavailable(item);
  return (
    <button
      type="button"
      className={compact ? "secondary sr-icon-button" : "secondary"}
      aria-label={compact ? `Move ${item.display_number}` : undefined}
      title={reason ?? `Move ${item.display_number}`}
      disabled={!!reason}
      data-move={item.id}
      onClick={() => onMove(item)}
    >
      <ProductIcon name="changes" />
      {!compact && <span>Move request</span>}
    </button>
  );
}

function Card({
  item,
  now,
  selected,
  onPreview,
  onMove,
  onDrag,
}: {
  item: RegisterItem;
  now: Date;
  selected: boolean;
  onPreview: (item: RegisterItem) => void;
  onMove: (item: RegisterItem, target?: MoveTarget) => void;
  onDrag: (item: RegisterItem | null) => void;
}) {
  const movable = !moveUnavailable(item);
  const chips = cardChips(item);
  return (
    <article
      className="sr-card"
      data-ticket-id={item.id}
      data-selected={selected || undefined}
      draggable={movable}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", item.id);
        event.dataTransfer.effectAllowed = "move";
        onDrag(item);
      }}
      onDragEnd={() => onDrag(null)}
    >
      <div className="sr-card-top">
        <span className="sr-ref">{item.display_number}</span>
        <PriorityChip priority={item.priority} />
      </div>
      <h3>
        <Link href={href(item)}>{item.summary}</Link>
      </h3>
      <p className="sr-card-line">{customer(item)}</p>
      <p className="sr-card-line">{site(item)}</p>
      <NextActionBlock item={item} now={now} />
      {(chips.length > 0 || item.work_orders.length > 0) && (
        <div className="sr-chip-row">
          {chips.map((chip) => (
            <Chip key={chip.text} tone={chip.tone} icon={chip.tone === "warning" ? "warning" : undefined}>
              {chip.text}
            </Chip>
          ))}
          <WorkChips item={item} />
        </div>
      )}
      <footer className="sr-card-foot">
        <Avatar name={item.triage_owner_name} />
        <div>
          <span>
            Owner <strong>{item.triage_owner_name}</strong>
          </span>
          <span>
            Received {formatWhen(item.received_at, now)} · {channelLabel(item.channel)}
          </span>
        </div>
        <button
          type="button"
          className="secondary sr-icon-button"
          aria-label={`Preview ${item.display_number}`}
          aria-pressed={selected}
          onClick={() => onPreview(item)}
        >
          <ProductIcon name="eye" />
        </button>
        <MoveButton item={item} onMove={onMove} compact />
      </footer>
    </article>
  );
}

// Lanes for the three states the application moves a request through today (frame 14, D3). An empty lane
// collapses to a narrow strip, stays a drop target and expands while a permitted card is dragged over it (D2).
export function Board({
  items,
  now,
  selected,
  onPreview,
  onMove,
}: {
  items: RegisterItem[];
  now: Date;
  selected: string | null;
  onPreview: (item: RegisterItem) => void;
  onMove: (item: RegisterItem, target?: MoveTarget) => void;
}) {
  const [dragging, setDragging] = useState<RegisterItem | null>(null),
    [expanded, setExpanded] = useState<Record<string, boolean>>({}),
    [over, setOver] = useState<string | null>(null);
  return (
    <div className="sr-board">
      {nativeLanes.map((lane) => {
        const cards = items.filter((item) => item.status === lane.status),
          allowed = !!dragging && moveTargets(dragging).includes(lane.status as MoveTarget) && !moveUnavailable(dragging),
          collapsed = cards.length === 0 && !expanded[lane.status] && over !== lane.status,
          heading = `sr-lane-${lane.status}`;
        return (
          <section
            key={lane.status}
            className="sr-lane"
            aria-labelledby={heading}
            data-lane={lane.status}
            data-collapsed={collapsed || undefined}
            data-drop={dragging ? (allowed ? "allowed" : "refused") : undefined}
            data-over={over === lane.status || undefined}
            onDragOver={(event) => {
              if (!allowed) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              setOver(lane.status);
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null))
                setOver((current) => (current === lane.status ? null : current));
            }}
            onDrop={(event) => {
              event.preventDefault();
              setOver(null);
              const moved = dragging;
              setDragging(null);
              if (moved && allowed) onMove(moved, lane.status as MoveTarget);
            }}
          >
            {collapsed ? (
              <button
                type="button"
                className="sr-lane-strip"
                aria-expanded="false"
                onClick={() => setExpanded((old) => ({ ...old, [lane.status]: true }))}
              >
                <span className="sr-count">0</span>
                <span className="sr-lane-vertical" id={heading}>
                  {lane.label}
                </span>
                <span className="sr-only">, empty. Show lane</span>
              </button>
            ) : (
              <>
                <header className="sr-lane-head">
                  <div>
                    <h2 id={heading}>{lane.label}</h2>
                    <p>{lane.purpose}</p>
                  </div>
                  <span className="sr-count" aria-label={`${cards.length} ${cards.length === 1 ? "request" : "requests"}`}>
                    {cards.length}
                  </span>
                  {cards.length === 0 && (
                    <button
                      type="button"
                      className="secondary sr-icon-button"
                      aria-label={`Collapse ${lane.label} lane`}
                      aria-expanded="true"
                      onClick={() => setExpanded((old) => ({ ...old, [lane.status]: false }))}
                    >
                      <ProductIcon name="collapse" />
                    </button>
                  )}
                </header>
                {cards.length ? (
                  <ol className="sr-cards">
                    {cards.map((item) => (
                      <li key={item.id}>
                        <Card
                          item={item}
                          now={now}
                          selected={selected === item.id}
                          onPreview={onPreview}
                          onMove={onMove}
                          onDrag={setDragging}
                        />
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="sr-lane-empty">No requests in this stage.</p>
                )}
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}

// The fourteen list columns with a native source (SV-01 contract). Customer update, Affected areas, Response
// route and Category wait for a contract that supplies them.
export type ColumnKey =
  | "customer"
  | "priority"
  | "stage"
  | "attention"
  | "next"
  | "action_owner"
  | "action_due"
  | "site"
  | "equipment"
  | "work"
  | "owner"
  | "received"
  | "channel";
type Column = { key: ColumnKey; label: string; width: number; cell: (item: RegisterItem, now: Date) => ReactNode };
const person = (name: string | null) => (
  <span className="sr-person">
    <Avatar name={name} />
    {name ?? <Unknown>Not visible</Unknown>}
  </span>
);
export const columns: Column[] = [
  { key: "customer", label: "Customer", width: 190, cell: (item) => customer(item) },
  { key: "priority", label: "Priority", width: 104, cell: (item) => <PriorityChip priority={item.priority} /> },
  { key: "stage", label: "Stage", width: 176, cell: (item) => <Chip>{stageLabel(item.status)}</Chip> },
  {
    key: "attention",
    label: "Attention",
    width: 230,
    cell: (item, now) => {
      const chip = attention(item, now);
      return chip ? (
        <Chip tone={chip.tone} icon={chip.tone === "danger" || chip.tone === "warning" ? "warning" : undefined}>
          {chip.text}
        </Chip>
      ) : (
        <span className="sr-none">None</span>
      );
    },
  },
  { key: "next", label: "Next action", width: 290, cell: (item, now) => <span className="sr-wrap">{nextAction(item, now).text || <Unknown>Not recorded</Unknown>}</span> },
  { key: "action_owner", label: "Action owner", width: 150, cell: (item) => person(actionOwner(item)) },
  {
    key: "action_due",
    label: "Action due",
    width: 176,
    cell: (item, now) => {
      const due = actionDue(item, now);
      return (
        <span className={`sr-two-line tone-${due.tone}`}>
          <span>{due.text}</span>
          {due.detail && <small>{due.detail}</small>}
        </span>
      );
    },
  },
  { key: "site", label: "Site", width: 180, cell: (item) => site(item) },
  { key: "equipment", label: "Equipment", width: 170, cell: (item) => equipment(item) },
  {
    key: "work",
    label: "Linked work",
    width: 230,
    cell: (item) => {
      const [first, ...rest] = item.work_orders;
      return first ? (
        <span className="sr-two-line">
          <span>
            {first.display_number}
            {rest.length > 0 && <span className="sr-more"> +{rest.length}</span>}
          </span>
          <small>{first.status}</small>
        </span>
      ) : (
        <span className="sr-none">None</span>
      );
    },
  },
  { key: "owner", label: "Request owner", width: 150, cell: (item) => person(item.triage_owner_name) },
  { key: "received", label: "Received", width: 186, cell: (item, now) => formatWhen(item.received_at, now) },
  { key: "channel", label: "Channel", width: 120, cell: (item) => channelLabel(item.channel) },
];

export function Table({
  items,
  now,
  hidden,
  selected,
  onPreview,
}: {
  items: RegisterItem[];
  now: Date;
  hidden: ColumnKey[];
  selected: string | null;
  onPreview: (item: RegisterItem) => void;
}) {
  const [edges, setEdges] = useState({ start: false, end: false });
  const scroller = useRef<HTMLDivElement>(null);
  const measure = (node: HTMLDivElement) =>
    setEdges({ start: node.scrollLeft > 0, end: node.scrollLeft + node.clientWidth < node.scrollWidth - 1 });
  useEffect(() => {
    const node = scroller.current;
    if (!node) return;
    measure(node);
    const observer = new ResizeObserver(() => measure(node));
    observer.observe(node);
    return () => observer.disconnect();
  }, [hidden]);
  const shown = columns.filter((column) => !hidden.includes(column.key));
  return (
    <div
      ref={scroller}
      className="sr-table-scroll"
      role="region"
      tabIndex={0}
      aria-label="Service requests list — scroll for all columns"
      data-scrolled={edges.start || undefined}
      data-more={edges.end || undefined}
      onScroll={(event: UIEvent<HTMLDivElement>) => measure(event.currentTarget)}
    >
      <table className="sr-table">
        <colgroup>
          <col style={{ width: 300 }} />
          {shown.map((column) => (
            <col key={column.key} style={{ width: column.width }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className="sr-pinned">
              Request
            </th>
            {shown.map((column) => (
              <th scope="col" key={column.key}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              data-ticket-id={item.id}
              data-selected={selected === item.id || undefined}
              onClick={(event) => {
                if (!(event.target as HTMLElement).closest("a,button")) onPreview(item);
              }}
            >
              <th scope="row" className="sr-pinned">
                <div className="sr-request-cell">
                  <div>
                    <Link href={href(item)}>{item.summary}</Link>
                    <small>{item.display_number}</small>
                  </div>
                  <button
                    type="button"
                    className="secondary sr-icon-button"
                    aria-label={`Preview ${item.display_number}`}
                    aria-pressed={selected === item.id}
                    onClick={() => onPreview(item)}
                  >
                    <ProductIcon name="eye" />
                  </button>
                </div>
              </th>
              {shown.map((column) => (
                <td key={column.key}>{column.cell(item, now)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Below 1024 px the register is a stacked card list (frames 11 and 23); a card opens its request.
export function PhoneCards({ items, now }: { items: RegisterItem[]; now: Date }) {
  return (
    <ol className="sr-phone-cards">
      {items.map((item) => {
        const chips = cardChips(item);
        return (
          <li key={item.id}>
            <article className="sr-phone-card" data-ticket-id={item.id}>
              <div className="sr-card-top">
                <span className="sr-ref">
                  <span className="sr-ref-prefix">{item.display_number.replace(/TKT-.*$/, "")}</span>
                  {item.display_number.replace(/^.*?(TKT-)/, "$1")} · {stageLabel(item.status)}
                </span>
                <PriorityChip priority={item.priority} />
              </div>
              <h2>
                <Link href={href(item)}>{item.summary}</Link>
              </h2>
              <p className="sr-card-line">
                {customer(item)} · {site(item)}
              </p>
              <NextActionBlock item={item} now={now} />
              {(chips.length > 0 || item.work_orders.length > 0) && (
                <div className="sr-chip-row">
                  {chips.map((chip) => (
                    <Chip key={chip.text} tone={chip.tone} icon={chip.tone === "warning" ? "warning" : undefined}>
                      {chip.text}
                    </Chip>
                  ))}
                  <WorkChips item={item} />
                </div>
              )}
            </article>
          </li>
        );
      })}
    </ol>
  );
}

function attentionNotice(item: RegisterItem, now: Date) {
  if (clarificationOverdue(item, now))
    return {
      tone: "danger" as const,
      title: "The owned clarification is overdue.",
      text: `It was due ${formatWhen(item.clarification!.due_at!, now)}. Follow it up before triage.`,
    };
  if (item.triage_blocker_count)
    return {
      tone: "warning" as const,
      title: `${item.triage_blocker_count} ${item.triage_blocker_count === 1 ? "field needs" : "fields need"} completing before triage.`,
      text: "Open the request to see and complete them.",
    };
  if (item.clarification_unavailable)
    return {
      tone: "neutral" as const,
      title: "The linked clarification is outside your activity access.",
      text: "No question or outcome details are shown.",
    };
  return null;
}

export function Preview({
  item,
  now,
  onClose,
  onMove,
}: {
  item: RegisterItem;
  now: Date;
  onClose: () => void;
  onMove: (item: RegisterItem) => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), [item.id]);
  const notice = attentionNotice(item, now),
    action = nextAction(item, now),
    due = actionDue(item, now),
    reason = moveUnavailable(item);
  return (
    <aside
      className="sr-preview"
      aria-labelledby="sr-preview-title"
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      <div className="sr-preview-scroll">
        <header className="sr-preview-head">
          <span className="sr-ref">{item.display_number}</span>
          <button type="button" className="secondary sr-icon-button" aria-label="Close preview" onClick={onClose}>
            <ProductIcon name="close" />
          </button>
        </header>
        <h2 id="sr-preview-title" ref={heading} tabIndex={-1}>
          {item.summary}
        </h2>
        <p className="sr-muted">
          {customerLabel(item)} · {siteLabel(item)}
        </p>
        <div className="sr-chip-row">
          <Chip>{stageLabel(item.status)}</Chip>
          <Chip tone={item.priority === "Urgent" ? "danger" : item.priority === "High" ? "warning" : "neutral"}>
            {item.priority} priority
          </Chip>
        </div>
        {notice && (
          <div className={`sr-notice tone-${notice.tone}`}>
            {notice.tone !== "neutral" && <ProductIcon name="warning" />}
            <p>
              <strong>{notice.title}</strong> {notice.text}
            </p>
          </div>
        )}
        <section>
          <h3>{action.heading}</h3>
          <dl className="sr-pairs">
            <div>
              <dt>Action</dt>
              <dd>{action.text || <Unknown>Not recorded</Unknown>}</dd>
            </div>
            <div>
              <dt>Responsible</dt>
              <dd>{actionOwner(item)}</dd>
            </div>
            <div>
              <dt>Due</dt>
              <dd className={`tone-${due.tone}`}>
                {due.text}
                {due.detail && <strong> · {due.detail}</strong>}
              </dd>
            </div>
          </dl>
        </section>
        <section>
          <h3>Context</h3>
          <dl className="sr-pairs">
            <div>
              <dt>Customer</dt>
              <dd>
                {customer(item)}
                {item.customer && (
                  <small>{item.customer.basis === "SiteOperator" ? "The site's current operator" : "The caller's organisation"}</small>
                )}
              </dd>
            </div>
            <div>
              <dt>Site</dt>
              <dd>{site(item)}</dd>
            </div>
            <div>
              <dt>Equipment</dt>
              <dd>{equipment(item)}</dd>
            </div>
            <div>
              <dt>Linked work</dt>
              <dd>
                {item.work_orders.length ? (
                  item.work_orders.map((order) => <span key={order.id}>{workOrderLabel(order)}</span>)
                ) : (
                  <span className="sr-none">None</span>
                )}
              </dd>
            </div>
            <div>
              <dt>Request owner</dt>
              <dd>{item.triage_owner_name}</dd>
            </div>
            <div>
              <dt>Received</dt>
              <dd>
                {formatWhen(item.received_at, now)} · {channelLabel(item.channel)}
              </dd>
            </div>
          </dl>
        </section>
      </div>
      <footer className="sr-preview-foot">
        <Link className="button" href={href(item)}>
          Open request
        </Link>
        <MoveButton item={item} onMove={onMove} />
        {reason && <p className="sr-muted">{reason}</p>}
      </footer>
    </aside>
  );
}

// A board move is an instruction to begin a transition, not to complete it: the existing command form opens
// on the chosen target, and the request stays in its lane until the server accepts that form (SV-02 contract).
export function MoveDialog({
  item,
  target: initial,
  onClose,
  onMoved,
}: {
  item: RegisterItem;
  target?: MoveTarget;
  onClose: () => void;
  onMoved: (item: RegisterItem, target: MoveTarget) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    targets = moveTargets(item),
    [target, setTarget] = useState<MoveTarget>(initial ?? targets[0]),
    read = useResource<Envelope<Intake>>(`service/tickets/${item.id}`),
    ticket = read.data?.items[0];
  useEffect(() => {
    const node = dialog.current;
    if (node && !node.open) node.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="sr-move"
      aria-labelledby="sr-move-title"
      onClose={onClose}
    >
      <header className="sr-move-head">
        <div>
          <span className="sr-ref">{item.display_number}</span>
          <h2 id="sr-move-title">Move request</h2>
        </div>
        <button type="button" className="secondary sr-icon-button" aria-label="Close move form" onClick={() => dialog.current?.close()}>
          <ProductIcon name="close" />
        </button>
      </header>
      <div className="sr-move-body">
        <p>
          <strong>{item.summary}</strong>
          <br />
          Currently {stageLabel(item.status)}. It stays there until the server accepts this form.
        </p>
        {targets.length > 1 ? (
          <fieldset className="sr-move-targets">
            <legend>Move to</legend>
            {targets.map((value) => (
              <label key={value}>
                <input type="radio" name="sr-move-target" value={value} checked={target === value} onChange={() => setTarget(value)} />
                <span>
                  <strong>{stageLabel(value)}</strong>
                  <small>{value === "NeedsInformation" ? "Ask for what is missing, with an owned follow-up" : "Complete the triage assessment"}</small>
                </span>
              </label>
            ))}
          </fieldset>
        ) : (
          <p>
            Move to <strong>{stageLabel(target)}</strong>
          </p>
        )}
        <ReadState loading={read.loading} error={read.error} retry={read.reload} />
        {ticket && ticket.status !== item.status && (
          <div className="sr-notice tone-warning">
            <ProductIcon name="warning" />
            <p>
              <strong>This request is now {stageLabel(ticket.status)}.</strong> It changed after the register loaded. Close this form to see its current stage.
            </p>
          </div>
        )}
        {ticket && ticket.status === item.status && ticket.version !== item.version && (
          <div className="sr-notice tone-warning">
            <ProductIcon name="warning" />
            <p>
              <strong>This request changed after the register loaded.</strong> The form below uses its current revision, {ticket.version}.
            </p>
          </div>
        )}
        {ticket && ticket.status === item.status && !ticket.can_edit_intake && (
          <div className="sr-notice tone-neutral">
            <p>
              <strong>You can view this request.</strong> Moving it needs service request edit permission for its site.
            </p>
          </div>
        )}
        {ticket && ticket.status === item.status && ticket.can_edit_intake && (
          <TriageActions key={target} ticket={ticket} target={target} reload={() => onMoved(item, target)} />
        )}
      </div>
    </dialog>
  );
}
