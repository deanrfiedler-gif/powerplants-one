// The context panel (PPO-CONV-T1C-DESIGN 11; accepted T1 frames 1244:3423, 1244:286582 and phone sheet 1149:913 without
// Carl). A view rebuilt from the records each time it opens (S5): nothing in it is stored, pinned or excluded.
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ErrorNotice } from "../../components/business-ui";
import { usePlatformResource } from "../../components/platform-resource";
import { ProductIcon } from "../../components/product-icons";
import { Button } from "../../components/ui/button";
import type { ContextItem, ThreadContext } from "../context-model";
import { useVisibleRefresh } from "./conversations-workspace";

// The panel sits beside the thread from 1280 px, the width where the AI1 side panel also docks; narrower screens open it
// from the Context button, as a drawer on tablets and as a sheet on phones.
const wideQuery = "(min-width: 1280px)";
const subscribeWide = (change: () => void) => {
  const query = window.matchMedia(wideQuery);
  query.addEventListener("change", change);
  return () => query.removeEventListener("change", change);
};
// Unknown until the browser answers, so a phone never paints the docked panel first.
export const useContextDocked = () => useSyncExternalStore<boolean | null>(subscribeWide, () => window.matchMedia(wideQuery).matches, () => null);

type Failure = { status?: number };
const unavailable = (error: unknown) => [403, 404].includes((error as Failure | undefined)?.status ?? 0);

function Reasons({ why }: { why: string[] }) {
  return (
    <span className="cv-context-reasons">
      {why.map((reason) => (
        <span key={reason} className="cv-context-why">
          {reason}
        </span>
      ))}
    </span>
  );
}

function Title({ item }: { item: ContextItem }) {
  if (!item.href) return <span className="cv-context-title">{item.title}</span>;
  // A document opens in its owning system, the document library, at the linked revision.
  if (item.href.startsWith("/api/"))
    return (
      <a className="cv-context-title" href={item.href}>
        {item.title}
      </a>
    );
  return (
    <Link className="cv-context-title" href={item.href}>
      {item.title}
    </Link>
  );
}

function Item({ item }: { item: ContextItem }) {
  return (
    <li className="cv-context-item">
      <Title item={item} />
      {item.detail && <span className="cv-context-detail">{item.detail}</span>}
      {(item.phone || item.email) && (
        <span className="cv-context-detail cv-context-reach">
          {item.phone && <a href={`tel:${item.phone.replace(/[^+\d]/g, "")}`}>{item.phone}</a>}
          {item.email && <a href={`mailto:${item.email}`}>{item.email}</a>}
        </span>
      )}
      <Reasons why={item.why} />
    </li>
  );
}

function Group({ title, empty, children, count }: { title: string; empty: string; count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  const id = useId();
  return (
    <section className="cv-context-group">
      <h3>
        <button type="button" className="cv-context-heading" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
          {title}
          <ProductIcon name="chevron" />
        </button>
      </h3>
      <div id={id} hidden={!open}>
        {count ? children : <p className="cv-context-empty">{empty}</p>}
      </div>
    </section>
  );
}

function Contents({ context }: { context: ThreadContext }) {
  const { record, noun } = context;
  return (
    <>
      <Group title="Record" empty="" count={1}>
        <div className="cv-context-record">
          <Link className="cv-context-title" href={record.href}>
            {record.title}
          </Link>
          <dl>
            {record.facts.map((f) => (
              <div key={f.label}>
                <dt>{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
          <Reasons why={[record.why]} />
        </div>
      </Group>
      {(
        [
          ["Files and documents", context.documents, `No documents are linked to this ${noun} that you can open.`],
          ["Contacts", context.contacts, `No contacts on this ${noun}.`],
          ["Related records", context.related, "No related records you can open."],
          ["This thread", context.thread, ""],
        ] as const
      ).map(([title, items, empty]) => (
        <Group key={title} title={title} empty={empty} count={items.length}>
          <ul className="cv-context-list">
            {items.map((item) => (
              <Item key={item.key} item={item} />
            ))}
          </ul>
        </Group>
      ))}
    </>
  );
}

// Read when the panel is shown and re-read on the thread's cadence (5.7). A refusal (403 or 404) draws no panel at all,
// because the thread itself then says it is unavailable; a kept panel is dropped so a later read cannot draw it again.
function useThreadContext(threadId: string) {
  const read = usePlatformResource<ThreadContext>(`conversations/${threadId}/context`);
  useVisibleRefresh(read.reload);
  const gone = !!read.error && unavailable(read.error);
  const [kept, setKept] = useState<ThreadContext>();
  if (read.data && read.data !== kept) setKept(read.data);
  if (gone && kept) setKept(undefined);
  return { read, gone, context: gone ? undefined : (read.data ?? kept) };
}

function PanelBody({
  state: { read, context },
  headingId,
  onClose,
}: {
  state: ReturnType<typeof useThreadContext>;
  headingId: string;
  onClose: () => void;
}) {
  return (
    <>
      <header className="cv-context-head">
        <h2 id={headingId}>Context</h2>
        <button type="button" className="cv-context-close" aria-label="Close context" onClick={onClose}>
          <ProductIcon name="close" />
        </button>
      </header>
      <p className="cv-context-intro">Rebuilt from the records each time it opens, from what you can open.</p>
      {context ? (
        <Contents context={context} />
      ) : read.error ? (
        <div className="cv-context-error">
          <ErrorNotice error={read.error} focusOnError={false} />
          <Button onClick={read.reload}>Retry</Button>
        </div>
      ) : (
        <div className="cv-skeleton" role="status" aria-label="Loading context">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} />
          ))}
        </div>
      )}
      {context && read.error && (
        <div className="cv-banner" role="status">
          <p>The context could not be refreshed. Showing what was last loaded.</p>
          <Button onClick={read.reload}>Retry</Button>
        </div>
      )}
    </>
  );
}

// Docked beside the thread on wide screens.
export function ContextAside({ threadId, onClose }: { threadId: string; onClose: () => void }) {
  const headingId = useId();
  const state = useThreadContext(threadId);
  if (state.gone) return null;
  return (
    <aside className="cv-context" aria-labelledby={headingId}>
      <PanelBody state={state} headingId={headingId} onClose={onClose} />
    </aside>
  );
}

// A modal drawer (tablet) or sheet (phone): Escape, the backdrop and Close return focus to the Context button.
export function ContextOverlay({ threadId, onClose }: { threadId: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const state = useThreadContext(threadId);
  // Access withdrawn while open: the sheet closes and the thread says it is unavailable.
  const { gone } = state;
  useEffect(() => {
    if (gone) onClose();
  }, [gone, onClose]);
  useEffect(() => {
    const dialog = ref.current,
      opener = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    return () => {
      dialog?.close();
      opener?.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="cv-context cv-context-overlay"
      aria-labelledby={headingId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="cv-context-sheet">
        <span className="cv-context-handle" aria-hidden="true" />
        <PanelBody state={state} headingId={headingId} onClose={onClose} />
      </div>
    </dialog>
  );
}

// The Context button in the thread header: shown whenever the panel is not docked open. Icon-only at 360 px and narrower.
// Closing the docked panel moves focus here, so a keyboard user keeps their place.
export function ContextButton({ onOpen, focusOnMount }: { onOpen: () => void; focusOnMount?: { current: boolean } }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!focusOnMount?.current) return;
    focusOnMount.current = false;
    ref.current?.closest("button")?.focus();
  }, [focusOnMount]);
  return (
    <Button className="cv-context-button" aria-label="Context" onClick={onOpen}>
      <svg ref={ref} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
        <path d="M3 4h18v16H3z M15 4v16" />
      </svg>
      <span className="cv-context-button-label">Context</span>
    </Button>
  );
}
