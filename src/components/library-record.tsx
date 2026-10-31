"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  api,
  ErrorNotice,
  ReadState,
  Status,
  Stamp,
  useResource,
} from "./business-ui";
import { Button, ButtonLink } from "./ui/button";
import { WorklistMenu } from "./crm-worklist-tools";
import { RecordTabs } from "./record-ui";
import { RecordIdentity } from "../shell/record-identity";
import { usePhoneHeader } from "../shell/phone-header";
import {
  LibraryFacts,
  LibraryEligibility,
  useLibraryWindow,
} from "./library-register";
import { LibraryCommand, type LibraryIntent } from "./library-command";
import {
  recordHref,
  libraryLabel,
  revisionName,
  reviewLabel,
  targetPaths,
  type LibraryItem,
  type Finding,
} from "../library/model";
import "./library.css";
type Usage = {
  items: {
    id: string;
    revision_id: string;
    target_kind: string;
    target_id: string;
    target_label: string;
    purpose: string;
    retired_at: string | null;
    needs_revision_assessment: boolean;
  }[];
  next_after: string | null;
  coverage: string;
};
type History = {
  items: {
    id: string;
    version: number;
    command: string;
    revision: LibraryItem["revision"];
    actor_id: string;
    actor_name?: string;
    created_at: string;
    reason: string;
    evidence: unknown;
  }[];
  next_before: number | null;
  coverage: string;
};
type Revisions = {
  items: LibraryItem[];
  next_before: number | null;
  coverage: string;
};
function useRecordEvidence<T>(path: string, version: number, retain = false) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    path: string;
    version: number;
    attempt: number;
    data: T | null;
    error: unknown;
  } | null>(null);
  useEffect(() => {
    let live = true;
    void api<T>(path).then(
      (data) => {
        if (live) setResult({ path, version, attempt, data, error: null });
      },
      (error) => {
        if (live) setResult({ path, version, attempt, data: null, error });
      },
    );
    return () => {
      live = false;
    };
  }, [path, version, attempt]);
  const current =
    result?.path === path &&
    result.version === version &&
    result.attempt === attempt;
  return {
    data:
      current || (retain && result?.path === path && result.version === version)
        ? (result?.data ?? null)
        : null,
    error: current ? result.error : null,
    loading: !current,
    reload: () => setAttempt((a) => a + 1),
  };
}
export function LibraryRecord({ id }: { id: string }) {
  const params = useSearchParams(),
    revision = params.get("revision_id"),
    resource = useRecordEvidence<LibraryItem>(
      `document-library/${id}${revision ? `?revision_id=${encodeURIComponent(revision)}` : ""}`,
      0,
      true,
    );
  const item = !resource.error ? resource.data : null;
  const [tab, setTab] = useState("Overview");
  const [readAttempt, setReadAttempt] = useState(0);
  const refresh = () => {
    setReadAttempt((a) => a + 1);
    resource.reload();
  };
  return (
    <div
      id="ppo-library"
      data-module-layout="full-bleed"
      className="library-record"
    >
      <ReadState
        loading={resource.loading}
        error={resource.error}
        retry={resource.reload}
      />
      {item && (
        <LibraryRecordBody
          key={`${id}:${item.revision.id}`}
          item={item}
          refresh={refresh}
          tab={tab}
          setTab={setTab}
          refreshing={resource.loading}
          readAttempt={readAttempt}
        />
      )}
    </div>
  );
}
function LibraryRecordBody({
  item,
  refresh,
  tab,
  setTab,
  refreshing,
  readAttempt,
}: {
  item: LibraryItem;
  refresh: () => void;
  tab: string;
  setTab: (tab: string) => void;
  refreshing: boolean;
  readAttempt: number;
}) {
  const params = useSearchParams(),
    router = useRouter();
  const listQuery = params.get("list_query"),
    from = params.get("from") ?? "";
  const pages = Math.min(
    50,
    Math.max(1, Number(params.get("list_pages")) || 1),
  );
  const list = useLibraryWindow(
    listQuery !== null ? `document-library?${listQuery}` : null,
    pages,
  );
  const position =
    list.data?.items.findIndex((row) => row.document.id === item.document.id) ??
    -1;
  const listContext = { query: from, listQuery: listQuery ?? "", pages };
  const previous = position > 0 ? list.data!.items[position - 1] : undefined;
  const next = position >= 0 ? list.data?.items[position + 1] : undefined;
  const positionLabel =
    position >= 0
      ? `${position + 1} of ${list.data!.items.length} shown`
      : undefined;
  const [intent, setIntent] = useState<LibraryIntent | null>(null),
    [finding, setFinding] = useState<Finding>(),
    [linkId, setLinkId] = useState<string>();
  const current = item.library_current && item.document.state === "Current",
    writable = current && item.can_register && !refreshing;
  const [saved, setSaved] = useState("");
  const usage = useRecordEvidence<Usage>(
    `document-library/${item.document.id}/usage`,
    item.document.version + readAttempt,
  );
  const revisions = useRecordEvidence<Revisions>(
    `document-library/${item.document.id}/revisions`,
    item.document.version + readAttempt,
  );
  const linkCount =
    usage.data?.coverage === "VisibleReferences" && !usage.data.next_after
      ? usage.data.items.length
      : undefined;
  const revisionCount =
    revisions.data?.coverage === "VisibleRevisions" &&
    !revisions.data.next_before
      ? revisions.data.items.length
      : undefined;
  const action = (value: LibraryIntent, f?: Finding, id?: string) => {
    if (refreshing) return;
    setFinding(f);
    setLinkId(id);
    setIntent(value);
  };
  const download = `/api/v1/document-library/${item.document.id}/content?revision_id=${item.revision.id}`;
  usePhoneHeader({
    title: item.document.display_number,
    record: {
      position: positionLabel,
      previous: positionLabel
        ? {
            label: "Previous document",
            disabled: !previous,
            onSelect: () => {
              if (previous) router.push(recordHref(previous, listContext));
            },
          }
        : undefined,
      next: positionLabel
        ? {
            label: "Next document",
            disabled: !next,
            onSelect: () => {
              if (next) router.push(recordHref(next, listContext));
            },
          }
        : undefined,
      more: [
        { label: "Refresh exact revision", onSelect: refresh },
        ...(writable
          ? [
              { label: "Add revision", onSelect: () => action("Revise") },
              {
                label: "Open a finding",
                onSelect: () => action("Open finding"),
              },
              { label: "Add a link", onSelect: () => action("Add link") },
              {
                label: "Withdraw document",
                onSelect: () => action("Withdraw"),
              },
            ]
          : []),
      ],
    },
  });
  const reviewable =
    current &&
    !refreshing &&
    item.can_review &&
    item.independent_reviewer &&
    item.availability === "Available" &&
    item.source_current &&
    !item.review;
  const tabs = ["Overview", "Revisions", "Findings", "Links", "History"];
  return (
    <>
      <RecordIdentity
        reference={item.document.display_number}
        title={item.revision.title}
      />
      <header className="library-record-header">
        <Link
          className="library-back"
          href={`/documents${from ? `?${from}` : ""}`}
        >
          Document library
        </Link>
        <h1>{item.revision.title}</h1>
        <p>
          {item.document.display_number} · {item.owner_name} ·{" "}
          {revisionName(item.revision.revision)} registered{" "}
          <Stamp value={item.revision.created_at} /> ·{" "}
          {item.revision.document_type}
        </p>
        <Status value={reviewLabel(item.review_state)} />
        {positionLabel && (
          <nav className="library-position" aria-label="Document position">
            <span>{positionLabel}</span>
            {previous && (
              <Link href={recordHref(previous, listContext)}>
                Previous document
              </Link>
            )}
            {next && (
              <Link href={recordHref(next, listContext)}>Next document</Link>
            )}
          </nav>
        )}
        <div className="library-actions">
          {item.availability === "Available" && (
            <ButtonLink href={download}>
              Download {revisionName(item.revision.revision)}
            </ButtonLink>
          )}
          {writable && (
            <Button variant="primary" onClick={() => action("Revise")}>
              Add revision
            </Button>
          )}
          {reviewable && (
            <Button onClick={() => action("Review")}>
              Review {revisionName(item.revision.revision)}
            </Button>
          )}
          <WorklistMenu label="Document actions" icon="more">
            <Button onClick={refresh}>Refresh</Button>
            {writable && (
              <>
                <Button onClick={() => action("Open finding")}>
                  Open a finding
                </Button>
                <Button onClick={() => action("Add link")}>Add a link</Button>
                <Button onClick={() => action("Withdraw")}>
                  Withdraw document
                </Button>
              </>
            )}
            {item.can_register &&
              item.availability !== "Available" &&
              item.revision.source.kind === "SyntheticText" && (
                <Button onClick={() => action("Recover")}>
                  Recover exact content
                </Button>
              )}
          </WorklistMenu>
        </div>
      </header>
      {saved && <p role="status">{saved}</p>}
      <LibraryEligibility item={item} />
      {current && item.can_review && !item.independent_reviewer && (
        <p role="status">
          An independent reviewer is required. The revision registrar and source
          author cannot record its review.
        </p>
      )}
      {!current && (
        <p role="status">
          {item.document.state === "Withdrawn"
            ? "Withdrawn document. Retained evidence remains readable."
            : "Historical revision — read only. Links and review still belong to this exact revision."}{" "}
          {!item.library_current && (
            <Link href={`/documents/library/${item.document.id}`}>
              Open current revision
            </Link>
          )}
        </p>
      )}
      <div className="library-record-layout">
        <aside className="library-record-context">
          <LibraryFacts item={item} />
        </aside>
        <section className="library-record-main">
          <RecordTabs
            id="library-record"
            label="Document views"
            tabs={tabs.map((t) => {
              const count =
                t === "Findings"
                  ? item.findings?.length
                  : t === "Links"
                    ? linkCount
                    : t === "Revisions"
                      ? revisionCount
                      : undefined;
              return {
                id: t,
                label: (
                  <>
                    {t}
                    {count !== undefined && (
                      <span aria-hidden="true"> · {count}</span>
                    )}
                  </>
                ),
              };
            })}
            value={tab}
            onChange={setTab}
          />
          <div
            className="library-record-body"
            role="tabpanel"
            id={`library-record-panel-${tab}`}
            aria-labelledby={`library-record-tab-${tab}`}
          >
            {tab === "Overview" && (
              <>
                <ReadState
                  loading={usage.loading}
                  error={usage.error}
                  retry={usage.reload}
                  focusOnError={false}
                />
                {usage.data && (
                  <section className="library-link-notice" role="status">
                    {usage.data.items.some(
                      (link) =>
                        !link.retired_at && link.needs_revision_assessment,
                    ) ? (
                      <p>
                        A link still points at an earlier revision or withdrawn
                        document. Assess it before relying on this revision.
                      </p>
                    ) : usage.data.coverage === "Partial" ||
                      usage.data.next_after ? (
                      <p>
                        Link assessment is incomplete. Review the permitted
                        links before relying on this revision.
                      </p>
                    ) : (
                      <p>No visible active link needs revision assessment.</p>
                    )}
                    {usage.data.coverage === "Partial" && (
                      <p>
                        Partial coverage. Restricted links are not listed or
                        counted.
                      </p>
                    )}
                    {usage.data.next_after && (
                      <p>More permitted links are available.</p>
                    )}
                    <Button onClick={() => setTab("Links")}>Open Links</Button>
                  </section>
                )}
                <h2>
                  Review decision · {revisionName(item.revision.revision)}
                </h2>
                <section className="library-card">
                  {item.review ? (
                    <>
                      <Status value={reviewLabel(item.review_state)} />
                      <p>
                        Recorded <Stamp value={item.review.created_at} /> ·
                        reviewer {item.review.reviewer_name ?? "Unavailable"}
                      </p>
                      <dl className="library-facts">
                        <dt>Purpose</dt>
                        <dd>{item.review.purpose}</dd>
                        <dt>Rationale</dt>
                        <dd>{item.review.rationale}</dd>
                        <dt>Bound to</dt>
                        <dd className="library-hash">
                          {item.review.content_hash}
                        </dd>
                      </dl>
                    </>
                  ) : (
                    <p>No review recorded for this exact revision.</p>
                  )}
                </section>
                <ExactContent key={item.revision.id} item={item} />
              </>
            )}
            {tab === "Revisions" && (
              <RevisionList
                key={`${item.document.version}:${readAttempt}`}
                id={item.document.id}
              />
            )}
            {tab === "Findings" && (
              <>
                <h2>Findings · {revisionName(item.revision.revision)}</h2>
                <p>
                  A response awaits independent acceptance. Reviewed needs every
                  finding closed; Returned does not.
                </p>
                {writable && (
                  <Button onClick={() => action("Open finding")}>
                    Open a finding
                  </Button>
                )}
                {!item.findings?.length && (
                  <p>No findings recorded for this revision.</p>
                )}
                {item.findings?.map((f) => (
                  <article className="library-card" key={f.id}>
                    <h3>{f.text}</h3>
                    <Status
                      value={
                        f.state === "AwaitingReview"
                          ? "Awaiting review"
                          : f.state
                      }
                    />
                    <p>
                      Owner {f.owner_name ?? "Unavailable"} · due {f.due_date}
                    </p>
                    {f.response && <p>Response: {f.response}</p>}
                    {f.acceptance && <p>Acceptance: {f.acceptance}</p>}
                    {writable &&
                      f.state === "Open" &&
                      f.owner_id === item.actor_id && (
                        <Button onClick={() => action("Respond", f)}>
                          Respond
                        </Button>
                      )}
                    {current &&
                      item.can_review &&
                      f.state === "AwaitingReview" &&
                      f.response_by !== item.actor_id && (
                        <Button onClick={() => action("Accept response", f)}>
                          Accept response
                        </Button>
                      )}
                  </article>
                ))}
              </>
            )}
            {tab === "Links" && (
              <LinkList
                key={`${item.document.version}:${readAttempt}`}
                item={item}
                action={action}
              />
            )}
            {tab === "History" && (
              <HistoryList
                key={`${item.document.version}:${readAttempt}`}
                id={item.document.id}
              />
            )}
          </div>
        </section>
      </div>
      {intent && (
        <LibraryCommand
          intent={intent}
          item={item}
          finding={finding}
          linkId={linkId}
          onClose={() => setIntent(null)}
          onSaved={() => {
            setSaved(`${intent} saved. Refreshing the exact revision.`);
            setIntent(null);
            refresh();
          }}
        />
      )}
    </>
  );
}
function ExactContent({ item }: { item: LibraryItem }) {
  const [text, setText] = useState<string | null>(null),
    [error, setError] = useState<unknown>(null),
    [attempt, setAttempt] = useState(0);
  const path = `/api/v1/document-library/${item.document.id}/content?revision_id=${item.revision.id}`;
  useEffect(() => {
    let live = true;
    if (
      item.availability !== "Available" ||
      item.revision.source.kind !== "SyntheticText"
    )
      return;
    void fetch(path, { cache: "no-store" })
      .then(
        async (response) => {
          if (!response.ok)
            throw {
              status: response.status,
              message:
                "Exact content could not be loaded. Retry this revision; a newer revision will not be substituted.",
            };
          const value = await response.text();
          if (live) {
            setText(value);
            setError(null);
          }
        },
        (e) => {
          throw e;
        },
      )
      .catch((e) => {
        if (live) {
          setText(null);
          setError(e);
        }
      });
    return () => {
      live = false;
    };
  }, [path, attempt, item.availability, item.revision.source.kind]);
  return (
    <section>
      <h2>Content · {revisionName(item.revision.revision)}</h2>
      {item.availability !== "Available" ? (
        <p role="status">
          Exact content unavailable. No other revision will be substituted.
          Recover original synthetic content or use the source workflow for
          native issue recovery.
        </p>
      ) : item.revision.source.kind !== "SyntheticText" ? (
        <p>
          The exact native PDF is available to download.
          {item.revision.source.kind === "JobPackIssue" && (
            <>
              {" "}
              <Link href={`/documents/${item.revision.source.issue_id}`}>
                Open issued job pack
              </Link>
            </>
          )}
        </p>
      ) : (
        <>
          <ErrorNotice error={error} />
          {error ? (
            <Button onClick={() => setAttempt((a) => a + 1)}>
              Retry exact content
            </Button>
          ) : text === null ? (
            <p role="status">Loading exact text…</p>
          ) : (
            <>
              <pre>{text.split("\n").slice(0, 7).join("\n")}</pre>
              <p>
                Showing the first {Math.min(7, text.split("\n").length)} of{" "}
                {text.split("\n").length} lines. Download this revision for its
                complete exact content.
              </p>
            </>
          )}
        </>
      )}
    </section>
  );
}
function RevisionList({ id }: { id: string }) {
  const [before, setBefore] = useState<number | null>(null),
    r = useResource<Revisions>(
      `document-library/${id}/revisions${before ? `?before=${before}` : ""}`,
    ),
    data = !r.loading && !r.error ? r.data : null;
  return (
    <>
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      {data && (
        <>
          <p>
            {data.coverage === "Partial"
              ? "Partial coverage: some revisions cannot be shown."
              : "Permitted revisions, newest first."}
          </p>
          {data.items.map((item) => (
            <article className="library-card" key={item.revision.id}>
              <Link href={recordHref(item)}>
                {revisionName(item.revision.revision)} · {item.revision.title}
              </Link>
              <p>{item.revision.reason}</p>
              <Status value={reviewLabel(item.review_state)} />
              <p>
                {libraryLabel(item.availability)} ·{" "}
                {item.source_current ? "Source current" : "Source superseded"}
              </p>
            </article>
          ))}
          {data.next_before && (
            <Button onClick={() => setBefore(data.next_before)}>
              Older revisions
            </Button>
          )}
          {before && (
            <Button onClick={() => setBefore(null)}>Newest revisions</Button>
          )}
        </>
      )}
    </>
  );
}
function LinkList({
  item,
  action,
}: {
  item: LibraryItem;
  action: (intent: LibraryIntent, f?: Finding, id?: string) => void;
}) {
  const [after, setAfter] = useState<string | null>(null),
    r = useResource<Usage>(
      `document-library/${item.document.id}/usage${after ? `?after=${after}` : ""}`,
    ),
    data = !r.loading && !r.error ? r.data : null;
  return (
    <>
      <h2>Declared links</h2>
      <p>
        Receiving workflows retain their own authority. Earlier revision links
        are never moved automatically.
      </p>
      {item.library_current &&
        item.document.state === "Current" &&
        item.can_register && (
          <Button onClick={() => action("Add link")}>Add a link</Button>
        )}
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      {data && (
        <>
          <p>
            {data.coverage === "Partial"
              ? "Partial coverage. Restricted references are not listed or counted."
              : data.next_after
                ? "More permitted references available."
                : `${data.items.length} references on this page.`}
          </p>
          {!data.items.length && (
            <p>No visible declared references on this page.</p>
          )}
          {data.items.map((link) => (
            <article className="library-card" key={link.id}>
              <Link href={`${targetPaths[link.target_kind]}/${link.target_id}`}>
                {link.target_label}
              </Link>
              <p>{link.purpose}</p>
              <p>
                {link.retired_at
                  ? "Retired"
                  : link.needs_revision_assessment
                    ? "Needs assessment — earlier revision or withdrawn document"
                    : "Active reference"}
              </p>
              {link.revision_id !== item.revision.id && (
                <Link
                  href={`/documents/library/${item.document.id}?revision_id=${link.revision_id}`}
                >
                  Open linked revision
                </Link>
              )}
              {!link.retired_at &&
                item.can_register &&
                link.revision_id === item.revision.id && (
                  <Button
                    onClick={() => action("Retire link", undefined, link.id)}
                  >
                    Retire reference
                  </Button>
                )}
            </article>
          ))}
          {data.next_after && (
            <Button onClick={() => setAfter(data.next_after)}>
              More links
            </Button>
          )}
          {after && <Button onClick={() => setAfter(null)}>First links</Button>}
        </>
      )}
    </>
  );
}
function HistoryList({ id }: { id: string }) {
  const [before, setBefore] = useState<number | null>(null),
    r = useResource<History>(
      `document-library/${id}/history${before ? `?before=${before}` : ""}`,
    ),
    data = !r.loading && !r.error ? r.data : null;
  return (
    <>
      <h2>Immutable history</h2>
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      {data && (
        <>
          <p>
            {data.coverage === "Partial"
              ? "Partial coverage: restricted events are not listed or counted."
              : "Permitted events, newest first."}
          </p>
          {data.items.map((event) => (
            <article className="library-card" key={event.id}>
              <h3>
                {libraryLabel(event.command)} ·{" "}
                {revisionName(event.revision.revision)}
              </h3>
              <p>
                <Stamp value={event.created_at} /> · actor{" "}
                {event.actor_name ?? "Unavailable"}
              </p>
              <p>{event.reason}</p>
              {event.evidence !== null && (
                <details>
                  <summary>Retained event evidence</summary>
                  <pre>{JSON.stringify(event.evidence, null, 2)}</pre>
                </details>
              )}
            </article>
          ))}
          {data.next_before && (
            <Button onClick={() => setBefore(data.next_before)}>
              Older history
            </Button>
          )}
          {before && (
            <Button onClick={() => setBefore(null)}>Newest history</Button>
          )}
        </>
      )}
    </>
  );
}
