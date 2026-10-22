// The thread (PPO-CONV-T1C-DESIGN 5.3, 5.6 to 5.8): header, messages with their asks, and the footer.
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api, ErrorNotice, RecordLink } from "../../components/business-ui";
import { useIdentity } from "../../components/business-session";
import { usePlatformResource } from "../../components/platform-resource";
import { Button } from "../../components/ui/button";
import { RecordIdentity } from "../../shell/record-identity";
import { formatTimestamp } from "../../shell/date-format";
import { useRecoverableCommand } from "../../shared/ui/use-recoverable-command";
import type { AnchorType } from "../model";
import type { ThreadAsk } from "../ask-model";
import { AskCard } from "./ask-card";
import { announceConversationsChanged, useVisibleRefresh } from "./conversations-workspace";
import {
  initials,
  Message,
  AssistantTurnStatus,
  type ThreadMessage,
  type ThreadTurn,
} from "./message";

export type Thread = {
  id: string;
  title: string;
  state: "Open" | "Resolved";
  version: number;
  is_main: boolean;
  anchor: {
    type: AnchorType;
    id: string;
    display_number: string;
    title: string;
  };
  created_by: string;
  created_at: string;
  resolved_at: string | null;
  participants: {
    user_id: string;
    display_name: string;
    role: string;
    last_read_sequence: number;
  }[];
  messages: ThreadMessage[];
  asks: ThreadAsk[];
  turns?: ThreadTurn[];
};

type Failure = { status?: number; code?: string; message?: string };
const unavailable = (error: unknown) => [403, 404].includes((error as Failure | undefined)?.status ?? 0);
const changedMeanwhile = ["VersionConflict", "ThreadResolved", "AskClosed", "AlreadyInState"];

export function ThreadView({
  id,
  footer,
  headerAction,
}: {
  id: string;
  footer?: (thread: Thread, reload: () => void) => React.ReactNode;
  // The Context button (T1c-3), beside Resolve.
  headerAction?: React.ReactNode;
}) {
  const read = usePlatformResource<Thread>(`conversations/${id}`);
  const identity = useIdentity();
  const viewer = identity.actor_id;
  // A re-read briefly has no data; keep showing the last thread so the page and any draft stay in place (5.7). Once
  // access is withdrawn (403 or 404) the kept thread is dropped, so a later re-read cannot draw it again (5.8).
  const gone = !!read.error && unavailable(read.error);
  const [kept, setKept] = useState<Thread>();
  if (read.data && read.data !== kept) setKept(read.data);
  if (gone && kept) setKept(undefined);
  const thread = gone ? undefined : (read.data ?? kept);
  useVisibleRefresh(
    read.reload,
    thread?.turns?.some((t) => t.state === "Queued" || t.state === "Answering")
      ? 2000
      : 30000,
  );
  const staleError = !gone && !!read.error;
  const accepts = useCallback((entry: { path: string }) => entry.path.startsWith("conversations/"), []);
  const command = useRecoverableCommand({
    key: `ppo:conversations:${id}:state`,
    scope: identity,
    accepts,
    transport: api,
  });
  const acceptedOperation = command.accepted?.receipt.operation_id;
  const { reload } = read;
  useEffect(() => {
    if (!acceptedOperation) return;
    reload();
    announceConversationsChanged();
  }, [acceptedOperation, reload]);
  // A conflict means someone else changed the thread first: re-read it and say so (5.8).
  const errorCode = (command.error as Failure | null)?.code;
  const changedElsewhere = !!errorCode && changedMeanwhile.includes(errorCode);
  useEffect(() => {
    if (changedElsewhere) reload();
  }, [changedElsewhere, reload]);
  const note = changedElsewhere ? "This conversation changed while you were reading it. It has been refreshed." : "";

  // Mark read up to the newest message, once per sequence, and only for a participant (T1b refuses anyone else).
  const marked = useRef(0);
  const me = thread?.participants.find((p) => p.user_id === viewer);
  const newest = thread?.messages.at(-1)?.sequence ?? 0;
  useEffect(() => {
    if (!me || newest <= me.last_read_sequence || newest <= marked.current) return;
    marked.current = newest;
    void api(`conversations/${id}/read`, {
      operation_id: crypto.randomUUID(),
      schema_version: 1,
      reason: "Mark conversation read",
      through_sequence: newest,
    }).then(announceConversationsChanged, () => {
      marked.current = 0;
    });
  }, [id, me, newest]);

  if (gone)
    return (
      <div className="cv-unavailable">
        <p>This conversation isn&apos;t available to you</p>
      </div>
    );
  if (read.error && !thread)
    return (
      <div className="cv-unavailable">
        <ErrorNotice error={read.error} />
        <Button onClick={read.reload}>Retry</Button>
      </div>
    );
  if (!thread)
    return (
      <div className="cv-skeleton cv-thread-skeleton" role="status" aria-label="Loading conversation">
        {[0, 1, 2].map((i) => (
          <span key={i} />
        ))}
      </div>
    );

  const creator = thread.participants.find((p) => p.user_id === thread.created_by)?.display_name ?? "";
  const canChangeState = thread.created_by === viewer || !!me;
  const waitingOnMe = thread.asks.some((a) => a.state === "Open" && a.asked_id === viewer);
  const stateTag = thread.state === "Resolved" ? "Resolved" : waitingOnMe ? "Waiting on you" : "Open";
  const changeState = (to: "resolve" | "reopen") =>
    void command.send(
      `conversations/${id}/${to}`,
      {
        reason:
          to === "resolve" ? "Resolve conversation" : "Reopen conversation",
        expected_version: thread.version,
      },
      `/conversations/${id}`,
      to === "resolve" ? "Resolve conversation" : "Reopen conversation",
      id,
    );
  const decline = (ask: ThreadAsk) =>
    void command.send(
      `conversations/asks/${ask.id}/no-answer-needed`,
      { reason: "No answer needed", expected_version: ask.version },
      `/conversations/${id}`,
      "No answer needed",
      ask.id,
    );

  return (
    <div className="cv-thread">
      <RecordIdentity
        reference={thread.anchor.display_number}
        title={thread.title}
      />
      <header className="cv-thread-header">
        <Link className="cv-back" href="/conversations">
          Back to conversations
        </Link>
        <div className="cv-title-row">
          <h1>{thread.title}</h1>
          <span
            className="cv-participants"
            aria-label={`Participants: ${thread.participants.map((p) => p.display_name).join(", ")}`}
          >
            {thread.participants.map((p) => (
              <span
                key={p.user_id}
                className="cv-avatar"
                title={p.display_name}
                aria-hidden="true"
              >
                {initials(p.display_name)}
              </span>
            ))}
          </span>
          <span
            className="cv-state-tag"
            data-tone={
              stateTag === "Waiting on you"
                ? "waiting"
                : stateTag === "Resolved"
                  ? "resolved"
                  : "open"
            }
          >
            {stateTag}
          </span>
        </div>
        <p className="cv-record-row">
          <RecordLink type={thread.anchor.type} id={thread.anchor.id}>
            <span className="cv-record-link">
              {thread.anchor.display_number} · {thread.anchor.title}
            </span>
          </RecordLink>
          <span className="cv-thread-meta">
            {thread.is_main ? "Main thread" : "Thread"} · started by {creator},{" "}
            {formatTimestamp(thread.created_at)}
          </span>
        </p>
        {(canChangeState || headerAction) && (
          <div className="cv-actions">
            {canChangeState && (
              <Button
                busy={command.busy}
                disabled={!!command.pending}
                onClick={() =>
                  changeState(thread.state === "Open" ? "resolve" : "reopen")
                }
              >
                {thread.state === "Open" ? "Resolve" : "Reopen"}
              </Button>
            )}
            {headerAction}
          </div>
        )}
        {staleError && (
          <div className="cv-banner" role="status">
            <p>
              This conversation could not be refreshed. Showing what was last
              loaded.
            </p>
            <Button onClick={read.reload}>Retry</Button>
          </div>
        )}
        {command.pending && (
          <div className="cv-banner" role="status">
            <p>{command.pending.label} has not been confirmed.</p>
            <Button busy={command.busy} onClick={() => void command.retry()}>
              Retry
            </Button>
          </div>
        )}
        {note && <p role="status">{note}</p>}
        {!!command.error && !changedElsewhere && (
          <ErrorNotice error={command.error} />
        )}
      </header>
      <div
        className="cv-messages"
        role="log"
        aria-live="polite"
        aria-label="Messages"
      >
        {thread.messages.map((m) => (
          <div key={m.id} className="cv-message-group">
            <Message message={m} />
            {thread.turns
              ?.filter((t) => t.trigger_message_id === m.id)
              .map((t) => (
                <AssistantTurnStatus
                  key={t.id}
                  turn={t}
                  actedFor={m.author_name}
                />
              ))}
            {thread.asks
              .filter((a) => a.message_id === m.id)
              .map((a) => (
                <AskCard
                  key={a.id}
                  ask={a}
                  viewerId={viewer}
                  busy={command.busy}
                  disabled={!!command.pending}
                  onDecline={decline}
                />
              ))}
          </div>
        ))}
      </div>
      <footer className="cv-thread-footer">
        {thread.state === "Resolved" ? (
          <p className="cv-note">Reopen this conversation to reply</p>
        ) : (
          footer?.(thread, read.reload)
        )}
      </footer>
    </div>
  );
}
