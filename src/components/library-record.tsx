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
import { RegisterTable, RegisterChip } from "./ui/register-table";
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
    revision: number;
    created_at: string;
    created_by_name: string;
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
    summary: string;
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
  const [savedResult, setSavedResult] = useState<{
    id: string;
    message: string;
  } | null>(null);
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
          saved={savedResult?.id === id ? savedResult.message : ""}
          setSaved={(message) => setSavedResult({ id, message })}
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
  saved,
  setSaved,
}: {
  item: LibraryItem;
  refresh: () => void;
  tab: string;
  setTab: (tab: string) => void;
  refreshing: boolean;
  readAttempt: number;
  saved: string;
  setSaved: (message: string) => void;
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
            <Link
              href={contextualRevisionHref(
                item.document.id,
                item.document.current_revision_id,
                params,
              )}
            >
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
                {item.availability !== "Available" && (
                  <div className="library-content-unavailable">
                    <ExactContent key={item.revision.id} item={item} />
                    {item.can_register &&
                      item.revision.source.kind === "SyntheticText" && (
                        <Button
                          disabled={refreshing}
                          onClick={() => action("Recover")}
                        >
                          Recover original text
                        </Button>
                      )}
                  </div>
                )}
                <ReadState
                  loading={usage.loading}
                  error={usage.error}
                  retry={usage.reload}
                  focusOnError={false}
                />
                {usage.data && (
                  <section
                    className="library-link-notice"
                    role="status"
                    data-tone={
                      usage.data.coverage === "Partial" ||
                      usage.data.next_after ||
                      usage.data.items.some(
                        (link) =>
                          !link.retired_at && link.needs_revision_assessment,
                      )
                        ? "warning"
                        : undefined
                    }
                  >
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
                {item.availability === "Available" && (
                  <ExactContent key={item.revision.id} item={item} />
                )}
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
          onSaved={(_id, revisionId) => {
            setSaved(
              {
                Register: "Document registered.",
                Revise: "Revision added.",
                Review: "Review recorded.",
                "Open finding": "Finding opened.",
                Respond: "Response recorded.",
                "Accept response": "Response accepted.",
                "Add link": "Link added.",
                "Retire link": "Link retired.",
                Withdraw: "Document withdrawn.",
                Recover: "Exact content recovered.",
              }[intent],
            );
            if (revisionId) {
              const query = new URLSearchParams(params.toString());
              query.set("revision_id", revisionId);
              router.push(`/documents/library/${item.document.id}?${query}`);
            }
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
function contextualRevisionHref(
  id: string,
  revision: string,
  params: { toString(): string },
) {
  const query = new URLSearchParams(params.toString());
  query.set("revision_id", revision);
  return `/documents/library/${id}?${query}`;
}
function RevisionList({ id }: { id: string }) {
  const params = useSearchParams();
  const [before, setBefore] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState(params.get("revision_id"));
  const r = useResource<Revisions>(
    `document-library/${id}/revisions${before ? `?before=${before}` : ""}`,
  );
  const data = !r.loading && !r.error ? r.data : null;
  const selected =
    data?.items.find((item) => item.revision.id === selectedId) ??
    data?.items[0];
  return (
    <>
      <h2>Revisions</h2>
      <p>Each revision keeps its exact content, source and review.</p>
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      {data && (
        <>
          <p>
            {data.coverage === "Partial"
              ? "Partial coverage: some revisions cannot be shown."
              : "Permitted revisions, newest first."}
          </p>
          <div className="library-evidence-table">
            <RegisterTable
              variant="panel"
              caption="Document revisions. Select a revision to inspect its retained evidence."
              empty={
                !data.items.length ? (
                  <p>No permitted revisions on this page.</p>
                ) : undefined
              }
            >
              <thead>
                <tr>
                  {["Revision", "State", "Review", "Registered", "Reason"].map(
                    (label) => (
                      <th scope="col" key={label}>
                        {label}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr
                    key={item.revision.id}
                    data-selected={
                      item.revision.id === selected?.revision.id || undefined
                    }
                  >
                    <td>
                      <Button
                        aria-pressed={
                          item.revision.id === selected?.revision.id
                        }
                        onClick={() => setSelectedId(item.revision.id)}
                      >
                        {revisionName(item.revision.revision)}
                      </Button>
                    </td>
                    <td>
                      {item.library_current
                        ? item.document.state === "Withdrawn"
                          ? "Withdrawn"
                          : "Current"
                        : item.superseded_by_revision
                          ? `Superseded by ${revisionName(item.superseded_by_revision)}`
                          : "Historical revision"}
                    </td>
                    <td>
                      <Status value={reviewLabel(item.review_state)} />
                    </td>
                    <td>
                      <Stamp value={item.revision.created_at} />
                      <small>
                        {item.registered_by_name} ·{" "}
                        {item.revision.source.byte_count.toLocaleString()} bytes
                      </small>
                    </td>
                    <td className="ppo-register-wrap">
                      {item.revision.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </RegisterTable>
          </div>
          <div className="library-actions">
            {data.next_before && (
              <Button onClick={() => setBefore(data.next_before)}>
                Older revisions
              </Button>
            )}
            {before && (
              <Button onClick={() => setBefore(null)}>Newest revisions</Button>
            )}
          </div>
          {selected && (
            <SelectedRevision key={selected.revision.id} item={selected} />
          )}
        </>
      )}
    </>
  );
}
function SelectedRevision({ item }: { item: LibraryItem }) {
  const params = useSearchParams();
  const links = useResource<Usage>(
    `document-library/${item.document.id}/usage?revision_id=${item.revision.id}&state=Active`,
  );
  const usage = !links.loading && !links.error ? links.data : null;
  return (
    <section
      className="library-selected-revision"
      aria-label={`Selected revision ${revisionName(item.revision.revision)}`}
    >
      <h3>Selected revision · {revisionName(item.revision.revision)}</h3>
      <div className="library-selected-grid">
        <section>
          <h4>Review</h4>
          <Status value={reviewLabel(item.review_state)} />
          {item.review ? (
            <>
              <p>
                {item.review.reviewer_name ?? "Unavailable"} ·{" "}
                <Stamp value={item.review.created_at} />
              </p>
              <p>Purpose: {item.review.purpose}</p>
              <p>{item.review.rationale}</p>
            </>
          ) : (
            <p>No independent decision recorded.</p>
          )}
        </section>
        <section>
          <h4>Source</h4>
          <p>
            {libraryLabel(item.revision.source.kind)} ·{" "}
            {item.source_current ? "Source current" : "Source superseded"}
          </p>
          <p>
            {item.source_author_name} ·{" "}
            {item.revision.source.byte_count.toLocaleString()} bytes
          </p>
          <p className="library-hash">
            SHA-256 {item.revision.source.content_hash}
          </p>
        </section>
        <section>
          <h4>Declared links</h4>
          <ReadState
            loading={links.loading}
            error={links.error}
            retry={links.reload}
          />
          {usage && (
            <>
              <p>
                {usage.coverage === "Partial"
                  ? "Partial coverage; restricted references omitted."
                  : "Permitted active declared references."}{" "}
                {usage.next_after
                  ? "More references available in Links."
                  : `${usage.items.length} on this page.`}
              </p>
              {usage.items.map((link) => (
                <p key={link.id}>
                  <Link
                    href={`${targetPaths[link.target_kind]}/${link.target_id}`}
                  >
                    {libraryLabel(link.target_kind)}: {link.target_label}
                  </Link>{" "}
                  · {link.purpose}
                </p>
              ))}
            </>
          )}
        </section>
        <section>
          <h4>Content</h4>
          <p>{libraryLabel(item.availability)}</p>
          {item.availability === "Available" ? (
            <ButtonLink
              href={`/api/v1/document-library/${item.document.id}/content?revision_id=${item.revision.id}`}
            >
              Download exact revision
            </ButtonLink>
          ) : (
            <p>Exact bytes unavailable. No successor will be substituted.</p>
          )}
          <p>
            <Link
              href={contextualRevisionHref(
                item.document.id,
                item.revision.id,
                params,
              )}
            >
              Open exact revision record
            </Link>
          </p>
        </section>
      </div>
      {!item.library_current && (
        <p className="library-link-notice">
          Historical content and review are retained. Earlier declared links
          stay on their exact revision until assessed.
        </p>
      )}
    </section>
  );
}
function LinkList({
  item,
  action,
}: {
  item: LibraryItem;
  action: (intent: LibraryIntent, f?: Finding, id?: string) => void;
}) {
  const params = useSearchParams();
  const [after, setAfter] = useState<string | null>(null);
  const [state, setState] = useState("All");
  const query = new URLSearchParams({ state, ...(after ? { after } : {}) });
  const r = useResource<Usage>(
    `document-library/${item.document.id}/usage?${query}`,
  );
  const data = !r.loading && !r.error ? r.data : null;
  return (
    <>
      <h2>Declared links</h2>
      <p>
        Exact revision references. Receiving workflows retain their own
        authority; these declarations do not prove every organisation-wide use.
      </p>
      <div className="library-link-controls">
        <div role="group" aria-label="Filter declared links">
          {[
            ["All", "All"],
            ["Active", "Active"],
            ["NeedsAssessment", "Needs assessment"],
            ["Retired", "Retired"],
          ].map(([value, label]) => (
            <Button
              key={value}
              aria-pressed={state === value}
              onClick={() => {
                setState(value);
                setAfter(null);
              }}
            >
              {label}
            </Button>
          ))}
        </div>
        {item.library_current &&
          item.document.state === "Current" &&
          item.can_register && (
            <Button onClick={() => action("Add link")}>Add a link</Button>
          )}
      </div>
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
          <div className="library-evidence-table">
            <RegisterTable
              variant="panel"
              caption={`${state === "NeedsAssessment" ? "Needs assessment" : state} declared links to exact document revisions.`}
              empty={
                !data.items.length ? (
                  <p>No visible declared references match this filter.</p>
                ) : undefined
              }
            >
              <thead>
                <tr>
                  {[
                    "Linked record",
                    "Revision",
                    "Purpose",
                    "Added",
                    "Status",
                  ].map((label) => (
                    <th scope="col" key={label}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.items.map((link) => (
                  <tr key={link.id}>
                    <td className="ppo-register-wrap">
                      <Link
                        href={`${targetPaths[link.target_kind]}/${link.target_id}`}
                      >
                        {libraryLabel(link.target_kind)}: {link.target_label}
                      </Link>
                    </td>
                    <td>
                      <Link
                        href={contextualRevisionHref(
                          item.document.id,
                          link.revision_id,
                          params,
                        )}
                      >
                        {revisionName(link.revision)}
                      </Link>
                    </td>
                    <td className="ppo-register-wrap">{link.purpose}</td>
                    <td>
                      <Stamp value={link.created_at} />
                      <small>{link.created_by_name}</small>
                      {link.retired_at && (
                        <small>
                          Retired <Stamp value={link.retired_at} />
                        </small>
                      )}
                    </td>
                    <td>
                      <RegisterChip
                        tone={
                          link.retired_at
                            ? "neutral"
                            : link.needs_revision_assessment
                              ? "attention"
                              : "positive"
                        }
                      >
                        {link.retired_at
                          ? "Retired"
                          : link.needs_revision_assessment
                            ? "Needs assessment"
                            : "Active"}
                      </RegisterChip>
                      {!link.retired_at &&
                        item.can_register &&
                        link.revision_id === item.revision.id && (
                          <Button
                            onClick={() =>
                              action("Retire link", undefined, link.id)
                            }
                          >
                            Retire reference
                          </Button>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </RegisterTable>
          </div>
          <div className="library-actions">
            {data.next_after && (
              <Button onClick={() => setAfter(data.next_after)}>
                More links
              </Button>
            )}
            {after && (
              <Button onClick={() => setAfter(null)}>First links</Button>
            )}
          </div>
          <p className="library-link-notice">
            Links never move to a newer revision automatically. Assess each
            earlier reference in its receiving workflow.
          </p>
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
            <article className="library-history-event" key={event.id}>
              <h3>
                {libraryLabel(event.command)} ·{" "}
                {revisionName(event.revision.revision)}
              </h3>
              <p>
                <Stamp value={event.created_at} /> · actor{" "}
                {event.actor_name ?? "Unavailable"} · Event {event.version}
              </p>
              <p>{event.reason}</p>
              <p>{event.summary}</p>
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
