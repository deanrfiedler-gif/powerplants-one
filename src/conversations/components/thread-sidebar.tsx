// The thread sidebar (PPO-CONV-T1C-DESIGN 5.3; accepted T1 frames 1244:3423 and 1244:285233).
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErrorNotice } from "../../components/business-ui";
import { Button } from "../../components/ui/button";
import { formatDate, formatTime } from "../../shell/date-format";
import type { ThreadSummary } from "../reads";
import type { ThreadFilter } from "../model";
import { applyFilter, filterCounts, groupByRecord, rowState } from "../sidebar-model";

const today = (iso: string) => formatDate(iso) === formatDate(new Date().toISOString());
const when = (t: ThreadSummary) => {
  const at = t.last_message_at;
  return at ? (today(at) ? formatTime(at) : formatDate(at)) : "";
};
const tone = { "Waiting on you": "waiting", Resolved: "resolved", Open: "open" } as const;

export function ThreadSidebar({
  items,
  loading,
  error,
  reload,
  current,
}: {
  items: ThreadSummary[] | undefined;
  loading: boolean;
  error: unknown;
  reload: () => void;
  current: string | null;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<ThreadFilter>("All");
  const [search, setSearch] = useState("");
  const counts = filterCounts(items ?? []);
  const shown = applyFilter(items ?? [], filter, search);
  const toggle = (f: ThreadFilter) => setFilter((now) => (now === f ? "All" : f));
  return (
    <nav className="cv-sidebar" aria-label="Conversations">
      <Button variant="primary" className="cv-new-thread" onClick={() => router.push("/conversations?new=1")}>
        New thread
      </Button>
      <input
        className="cv-search"
        type="search"
        aria-label="Search threads"
        placeholder="Search threads"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <p className="cv-menu-heading">Filters</p>
      <div className="cv-filters">
        <button type="button" aria-pressed={filter === "WaitingOnYou"} onClick={() => toggle("WaitingOnYou")}>
          <span>Waiting on you</span>
          <span className="cv-count">{items ? counts.waiting : ""}</span>
        </button>
        <button type="button" aria-pressed={filter === "Mentions"} onClick={() => toggle("Mentions")}>
          <span>Mentions</span>
          <span className="cv-count">{items ? counts.mentions : ""}</span>
        </button>
      </div>
      {loading && (
        <div className="cv-skeleton" role="status" aria-label="Loading conversations">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} />
          ))}
        </div>
      )}
      {!!error && (
        <div className="cv-sidebar-error">
          <ErrorNotice error={error} focusOnError={false} />
          <Button onClick={reload}>Retry</Button>
        </div>
      )}
      {items && !items.length && <p className="cv-note">No conversations yet. Start one from a deal or project to ask a colleague a question.</p>}
      {items && !!items.length && !shown.length && <p className="cv-note">No conversations match.</p>}
      {groupByRecord(shown).map((group) => (
        <section key={group.key} className="cv-group">
          <h2 className="cv-menu-heading">{group.heading}</h2>
          <ul>
            {group.threads.map((t) => {
              const state = rowState(t);
              return (
                <li key={t.id}>
                  <Link
                    href={`/conversations/${t.id}`}
                    className="cv-row"
                    data-unread={t.unread ? "true" : undefined}
                    aria-current={current === t.id ? "page" : undefined}
                  >
                    <span className="cv-dot" data-tone={tone[state]} aria-hidden="true" />
                    <span className="cv-row-text">
                      <span className="cv-row-title">{t.title}</span>
                      <span className="cv-row-meta">
                        <span data-tone={tone[state]}>{state}</span>
                        {when(t) && <span> · {when(t)}</span>}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </nav>
  );
}
