"use client";
import Link from "next/link";
import { SavedViewControls } from "./saved-view-controls";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ErrorNotice } from "./business-ui";
import { usePlatformResource } from "./platform-resource";
import type { ApplicationSearch, searchPreview } from "../shell/search-service";
import type { SearchItem } from "../shell/model";
import { WorkDialog } from "../activities/components/client/my-work-ui";

function Preview({ item, close }: { item: SearchItem; close: () => void }) {
  const id = item.id.slice(item.kind.length + 1);
  const read = usePlatformResource<Awaited<ReturnType<typeof searchPreview>>>(
    `search/preview?${new URLSearchParams({ kind: item.kind, id })}`,
  );
  return (
    <WorkDialog drawer title="Record preview" onClose={close}>
      {read.loading && <p role="status">Checking current access…</p>}
      <ErrorNotice error={read.error} />
      {read.error && (
        <button className="mw-button" onClick={read.reload}>
          Retry preview
        </button>
      )}
      {read.data && (
        <>
          <p className="sh-eyebrow">
            {read.data.kind} · {read.data.reference}
          </p>
          <h2>{read.data.label}</h2>
          <p>{read.data.context}</p>
          <dl className="sh-facts">
            <dt>Status</dt>
            <dd>{read.data.status}</dd>
            <dt>Version</dt>
            <dd>{String(read.data.version ?? "Not supplied")}</dd>
            <dt>Source updated</dt>
            <dd>
              {read.data.updated_at
                ? new Date(String(read.data.updated_at)).toLocaleString("en-AU")
                : "Not supplied"}
            </dd>
            <dt>Observed</dt>
            <dd>{new Date(read.data.observed_at).toLocaleString("en-AU")}</dd>
          </dl>
          <Link className="mw-button mw-button-primary" href={read.data.href}>
            Open record
          </Link>
          <p className="sh-muted">
            {read.data.source}. Use Back to return to these search criteria.
          </p>
        </>
      )}
    </WorkDialog>
  );
}
export function PlatformSearch() {
  const params = useSearchParams(),
    router = useRouter();
  const q = params.get("q") ?? "",
    kind = params.get("kind") ?? "",
    cursor = params.get("cursor") ?? "";
  const [entry, setEntry] = useState({ query: q, value: q }),
    [selected, setSelected] = useState<SearchItem | null>(null);
  const draft = entry.query === q ? entry.value : q;
  const setDraft = (value: string) => setEntry({ query: q, value });
  const query = new URLSearchParams({
    q,
    ...(kind ? { kind } : {}),
    ...(cursor ? { cursor } : {}),
  });
  const read = usePlatformResource<ApplicationSearch>(
    q.trim().length >= 2 ? `search?${query}` : null,
  );
  const navigate = (text: string, type = kind, next?: string) => {
    setSelected(null);
    router.push(
      `/search?${new URLSearchParams({ q: text, ...(type ? { kind: type } : {}), ...(next ? { cursor: next } : {}) })}`,
    );
  };
  return (
    <div className="sh-workspace">
      <header className="sh-heading">
        <div>
          <p className="sh-eyebrow">Shared workspace</p>
          <h1>Search</h1>
          <p>Find records within your current access.</p>
        </div>
        <SavedViewControls
          target="search"
          criteria={{ q, kind }}
          apply={(c) => {
            setDraft(c.q ?? "");
            navigate(c.q ?? "", c.kind ?? "");
          }}
        />
        <Link href="/work" className="mw-button">
          My Work
        </Link>
      </header>
      <form
        className="sh-toolbar"
        onSubmit={(e) => {
          e.preventDefault();
          navigate(draft);
        }}
      >
        <label>
          Search records
          <input
            type="search"
            value={draft}
            minLength={2}
            maxLength={200}
            onChange={(e) => setDraft(e.target.value)}
          />
        </label>
        <button className="mw-button mw-button-primary">Search</button>
        <button type="button" className="mw-button" onClick={read.reload}>
          Refresh results
        </button>
      </form>
      {!q && (
        <p className="sh-empty">Enter at least two characters to search.</p>
      )}
      <ErrorNotice error={read.error} />
      {read.loading && <p role="status">Searching permitted sources…</p>}
      {read.data && (
        <>
          <nav className="sh-tabs" aria-label="Result types">
            <button aria-pressed={!kind} onClick={() => navigate(q, "")}>
              All types
            </button>
            {read.data.sources
              .filter((s) => s.state !== "denied")
              .map((s) => (
                <button
                  key={s.kind}
                  aria-pressed={kind === s.kind}
                  onClick={() => navigate(q, s.kind)}
                >
                  {s.kind}
                </button>
              ))}
          </nav>
          {kind && (
            <button className="mw-button" onClick={() => navigate(q, "")}>
              Choose another type
            </button>
          )}
          {read.data.state === "partial" ||
          read.data.state === "unavailable" ? (
            <p role="alert" className="sh-notice">
              {read.data.state === "partial"
                ? "Partial results"
                : "Search unavailable"}
              :{" "}
              {read.data.sources
                .filter((s) => s.state === "unavailable")
                .map((s) => s.kind)
                .join(", ")}
              . <button onClick={read.reload}>Retry</button>
            </p>
          ) : read.data.state === "denied" ? (
            <p role="status">You do not have access to these search sources.</p>
          ) : null}
          <p role="status">
            {read.data.items.length} results on this page for “{q}”
            {read.data.has_more
              ? "; more available. Choose a type to page through its results."
              : ""}
          </p>
          <ul className="sh-register">
            {read.data.items.map((item) => (
              <li key={item.id}>
                <div>
                  <button
                    className="sh-title"
                    onClick={() => setSelected(item)}
                  >
                    {item.label}
                  </button>
                  <p>
                    {item.reference || "Reference not supplied"} · {item.kind}
                  </p>
                  {item.context && <p>{item.context}</p>}
                </div>
                <Link className="mw-button" href={item.href}>
                  Open record
                </Link>
              </li>
            ))}
          </ul>
          {!read.data.items.length && read.data.state === "complete" && (
            <p className="sh-empty">No permitted records match this query.</p>
          )}
          <div className="sh-toolbar">
            {cursor && (
              <button className="mw-button" onClick={() => navigate(q)}>
                First page
              </button>
            )}
            {read.data.next_cursor && (
              <button
                className="mw-button"
                onClick={() => navigate(q, kind, read.data!.next_cursor!)}
              >
                Next page
              </button>
            )}
          </div>
          <p className="sh-muted">
            Observed {new Date(read.data.observed_at).toLocaleString("en-AU")}.
            Counts describe this page, not all business records.
          </p>
        </>
      )}
      {selected && (
        <Preview
          key={selected.id}
          item={selected}
          close={() => setSelected(null)}
        />
      )}
    </div>
  );
}
