// The composer (PPO-CONV-T1C-DESIGN 5.4) and its thread wrapper. The draft lives here, outside the thread's read, so a
// re-read never clears what someone is typing.
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ErrorNotice } from "../../components/business-ui";
import { useIdentity } from "../../components/business-session";
import { Button } from "../../components/ui/button";
import { useRecoverableCommand, type Receipt } from "../../shared/ui/use-recoverable-command";
import {
  applyEdit,
  emptyDraft,
  insertMention,
  toMessageInput,
  type Draft,
  type DraftMention,
  type MessageInput,
} from "../composition";
import { composerMode } from "../composer-mode";
import type { AnchorType } from "../model";
import { AskRows } from "./ask-rows";
import { announceConversationsChanged } from "./conversations-workspace";
import { MentionPicker } from "./mention-picker";
import type { Thread } from "./thread-view";
import type { PeopleRead, Person } from "../picker-options";
import type { ParticipantAcknowledgement } from "../participant-warning";
import { ParticipantWarning } from "./participant-warning";

type Anchor = { type: AnchorType; id: string };
export const serverAllocated = (_entry: unknown, receipt: Receipt) => /^[0-9a-f-]{36}$/.test(receipt.record_id);

export function Composer({
  anchor,
  draft,
  onDraft,
  onSend,
  busy,
  blocked = false,
  localError,
  placeholder,
}: {
  anchor: Anchor | null;
  draft: Draft;
  onDraft: (d: Draft) => void;
  onSend?: () => void;
  busy: boolean;
  blocked?: boolean;
  localError: string;
  placeholder: string;
}) {
  const [picker, setPicker] = useState<"person" | "record" | null>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const caret = useRef(0);
  // The @ or # the person typed stays in the text until a tag replaces it; Escape leaves it as typed.
  const trigger = useRef(false);
  const placeCaret = (at: number) =>
    requestAnimationFrame(() => {
      field.current?.focus();
      field.current?.setSelectionRange(at, at);
    });
  const open = (mode: "person" | "record", typed = false) => {
    caret.current = field.current?.selectionStart ?? draft.text.length;
    trigger.current = typed;
    setPicker(mode);
  };
  const close = () => {
    setPicker(null);
    placeCaret(caret.current);
  };
  const pick = (m: DraftMention) => {
    const { draft: next, caret: at } = insertMention(draft, m, caret.current, trigger.current ? 1 : 0);
    onDraft(next);
    setPicker(null);
    placeCaret(at);
  };
  const edit = (value: string, selection: number) => {
    const { draft: next, caret: at } = applyEdit(draft, value);
    onDraft(next);
    // A removed tag moves the caret; otherwise the browser's own caret is already right.
    if (next.text !== value) placeCaret(at);
    const typed = value.length === draft.text.length + 1 && next.text === value ? value[selection - 1] : "";
    if (typed === "#" || (typed === "@" && anchor)) {
      caret.current = selection;
      trigger.current = true;
      setPicker(typed === "@" ? "person" : "record");
    }
  };
  return (
    <div className="cv-composer">
      <textarea
        ref={field}
        aria-label="Message"
        placeholder={placeholder}
        maxLength={4000}
        value={draft.text}
        onChange={(e) => edit(e.target.value, e.target.selectionStart)}
        onKeyDown={(e) => {
          if (
            e.key === "Enter" &&
            (e.ctrlKey || e.metaKey) &&
            onSend &&
            !busy &&
            !blocked
          ) {
            e.preventDefault();
            onSend();
          }
        }}
      />
      <div className="cv-composer-toolbar">
        <button
          type="button"
          className="cv-tool"
          aria-label="Tag a person"
          disabled={!anchor}
          onClick={() => open("person")}
        >
          @
        </button>
        <button
          type="button"
          className="cv-tool"
          aria-label="Link a record"
          onClick={() => open("record")}
        >
          #
        </button>
        {onSend && (
          <Button
            variant="primary"
            className="cv-send"
            busy={busy}
            disabled={blocked}
            onClick={onSend}
          >
            Send
          </Button>
        )}
      </div>
      {picker && (
        <MentionPicker
          mode={picker}
          anchor={anchor}
          onPick={pick}
          onClose={close}
          agentTagged={draft.mentions.some((m) => m.kind === "Agent")}
        />
      )}
      <AskRows draft={draft} onChange={(asks) => onDraft({ ...draft, asks })} />
      {localError && (
        <p className="cv-field-error" role="alert">
          {localError}
        </p>
      )}
    </div>
  );
}

// The draft is held by the page, per thread, so a failed re-read or a resolve elsewhere never discards it (5.7).
export function ThreadComposer({
  thread,
  reload,
  draft,
  onDraft,
}: {
  thread: Thread;
  reload: () => void;
  draft: Draft;
  onDraft: (d: Draft) => void;
}) {
  const identity = useIdentity();
  const router = useRouter();
  const [localError, setLocalError] = useState("");
  const [checking, setChecking] = useState(false);
  const checkingRef = useRef(false),
    generation = useRef({ value: 0 }),
    currentDraft = useRef(draft);
  const [review, setReview] = useState<{
    people: Person[];
    draft: Draft;
    input: Extract<MessageInput, { ok: true }>;
    opener: HTMLElement | null;
  } | null>(null);
  const submittedDraft = useRef<Draft | null>(null),
    handledReceipt = useRef("");
  useEffect(() => {
    currentDraft.current = draft;
  }, [draft]);
  useEffect(() => {
    const scope = generation.current;
    const lock = () => {
      scope.value++;
      setReview(null);
    };
    window.addEventListener("ppo-session-lock", lock);
    return () => {
      scope.value++;
      window.removeEventListener("ppo-session-lock", lock);
    };
  }, []);
  const accepts = useCallback(
    (entry: { path: string }) =>
      entry.path === `conversations/${thread.id}/messages`,
    [thread.id],
  );
  const command = useRecoverableCommand({
    key: `ppo:conversations:${thread.id}:post`,
    scope: identity,
    accepts,
    transport: api,
    acceptsReceipt: serverAllocated,
  });
  // A post refused because the thread changed meanwhile re-reads it, so the page shows why (5.8).
  const errorCode = (command.error as { code?: string } | null)?.code;
  const changed = errorCode === "ThreadResolved" || errorCode === "VersionConflict";
  useEffect(() => {
    if (changed) reload();
  }, [changed, reload]);
  const acceptedOperation = command.accepted?.receipt.operation_id;
  useEffect(() => {
    if (!acceptedOperation || handledReceipt.current === acceptedOperation) return;
    handledReceipt.current = acceptedOperation;
    if (
      submittedDraft.current &&
      currentDraft.current === submittedDraft.current
    )
    onDraft(emptyDraft());
    reload();
    announceConversationsChanged();
  }, [acceptedOperation, onDraft, reload]);
  const submit = async (
    input: Extract<MessageInput, { ok: true }>,
    sent: Draft,
    acknowledgements?: ParticipantAcknowledgement[],
  ) => {
    setReview(null);
    submittedDraft.current = sent;
    await command.send(
      `conversations/${thread.id}/messages`,
      {
        reason: "Post a message",
        body: input.body,
        mentions: input.mentions,
        asks: input.asks,
        ...(acknowledgements?.length
          ? { participant_acknowledgements: acknowledgements }
          : {}),
      },
      `/conversations/${thread.id}`,
      "Message",
      thread.id,
    );
  };
  const send = async () => {
    if (
      checkingRef.current ||
      command.busy ||
      command.pending ||
      !command.ready
    ) return;
    const input = toMessageInput(draft);
    if (!input.ok) return setLocalError(input.message);
    setLocalError("");
    const candidates = input.mentions.flatMap((m) =>
      m.kind === "Person" &&
      !thread.participants.some((p) => p.user_id === m.person_id)
        ? [m.person_id]
        : [],
    );
    if (!candidates.length) return submit(input, draft);
    // Capture before the pending button is disabled, which can move browser focus.
    const opener = document.activeElement as HTMLElement | null;
    checkingRef.current = true;
    setChecking(true);
    const token = generation.current.value;
    try {
      const people = await api<PeopleRead>(
        `conversations/people?anchor_type=${thread.anchor.type}&anchor_id=${thread.anchor.id}&thread_id=${thread.id}`,
      );
      if (token !== generation.current.value || currentDraft.current !== draft) return;
      const warnings = people.items.filter(
        (p) => candidates.includes(p.id) && p.history_warning,
      );
      if (warnings.length) setReview({ people: warnings, draft, input, opener });
      else await submit(input, draft);
    } catch {
      if (token === generation.current.value)
        setLocalError(
          "Participant access could not be checked. Your draft is still here; try Send again.",
        );
    } finally {
      checkingRef.current = false;
      if (token === generation.current.value) setChecking(false);
    }
  };
  const mode = composerMode(thread.state, command.error as { status?: number } | null);
  if (mode === "read-only")
    return (
      <p className="cv-note">
        You can read this conversation but not post in it.
      </p>
    );
  const others = thread.participants.filter((p) => p.user_id !== identity.actor_id).map((p) => p.display_name);
  return (
    <>
      <Composer
        anchor={{ type: thread.anchor.type, id: thread.anchor.id }}
        draft={draft}
        onDraft={(d) => {
          setReview(null);
          onDraft(d);
        }}
        onSend={() => void send()}
        busy={command.busy || checking}
        blocked={!!command.pending || !command.ready}
        localError={localError}
        placeholder={`${others.length ? `Reply to ${others.join(", ")}. ` : ""}Type @ to tag, # to link a record`}
      />
      {review && (
        <ParticipantWarning
          people={review.people}
          returnFocus={review.opener}
          onCancel={() => setReview(null)}
          onNewThread={() => {
            setReview(null);
            router.push(
              `/conversations/${thread.id}?new=1&record=${encodeURIComponent(`${thread.anchor.type}:${thread.anchor.id}`)}`,
            );
          }}
          onConfirm={() => {
            if (currentDraft.current === review.draft)
              void submit(
                review.input,
                review.draft,
                review.people.map((p) => ({
                  person_id: p.id,
                  basis: p.history_warning!.basis,
                })),
              );
          }}
        />
      )}
      {command.pending && (
        <div className="cv-banner" role="status">
          <p>
            The original message is retained until its outcome is confirmed.
            Retry sends that same operation, including its tags and asks.
          </p>
          <Button busy={command.busy} onClick={() => void command.retry()}>
            Retry
          </Button>
        </div>
      )}
      {!!command.error &&
        !(errorCode === "ThreadResolved" && thread.state === "Open") && (
          <div className="cv-send-error">
            <ErrorNotice error={command.error} focusOnError={false} />
          </div>
        )}
    </>
  );
}
