// The composer (PPO-CONV-T1C-DESIGN 5.4) and its thread wrapper. The draft lives here, outside the thread's read, so a
// re-read never clears what someone is typing.
import { useCallback, useRef, useState } from "react";
import { api, ErrorNotice } from "../../components/business-ui";
import { useIdentity } from "../../components/business-session";
import { Button } from "../../components/ui/button";
import { useRecoverableCommand, type Receipt } from "../../shared/ui/use-recoverable-command";
import { emptyDraft, insertMention, reconcile, toMessageInput, type Draft, type DraftMention } from "../composition";
import { composerMode } from "../composer-mode";
import type { AnchorType } from "../model";
import { AskRows } from "./ask-rows";
import { announceConversationsChanged } from "./conversations-workspace";
import { MentionPicker } from "./mention-picker";
import type { Thread } from "./thread-view";

type Anchor = { type: AnchorType; id: string };
export const serverAllocated = (_entry: unknown, receipt: Receipt) => /^[0-9a-f-]{36}$/.test(receipt.record_id);

export function Composer({
  anchor,
  draft,
  onDraft,
  onSend,
  busy,
  localError,
  placeholder,
}: {
  anchor: Anchor | null;
  draft: Draft;
  onDraft: (d: Draft) => void;
  onSend?: () => void;
  busy: boolean;
  localError: string;
  placeholder: string;
}) {
  const [picker, setPicker] = useState<"person" | "record" | null>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const caret = useRef(0);
  const open = (mode: "person" | "record") => {
    caret.current = field.current?.selectionStart ?? draft.text.length;
    setPicker(mode);
  };
  const pick = (m: DraftMention) => {
    const { draft: next, caret: at } = insertMention(draft, m, caret.current);
    onDraft(next);
    setPicker(null);
    requestAnimationFrame(() => {
      field.current?.focus();
      field.current?.setSelectionRange(at, at);
    });
  };
  return (
    <div className="cv-composer">
      <textarea
        ref={field}
        aria-label="Message"
        placeholder={placeholder}
        maxLength={4000}
        value={draft.text}
        onChange={(e) => onDraft(reconcile({ ...draft, text: e.target.value }))}
        onKeyDown={(e) => {
          if ((e.key === "@" && anchor) || e.key === "#") {
            e.preventDefault();
            open(e.key === "@" ? "person" : "record");
          } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && onSend) {
            e.preventDefault();
            onSend();
          }
        }}
      />
      <div className="cv-composer-toolbar">
        <button type="button" className="cv-tool" aria-label="Tag a person" disabled={!anchor} onClick={() => open("person")}>
          @
        </button>
        <button type="button" className="cv-tool" aria-label="Link a record" onClick={() => open("record")}>
          #
        </button>
        {onSend && (
          <Button variant="primary" className="cv-send" busy={busy} onClick={onSend}>
            Send
          </Button>
        )}
      </div>
      {picker && <MentionPicker mode={picker} anchor={anchor} onPick={pick} onClose={() => setPicker(null)} />}
      <AskRows draft={draft} onChange={(asks) => onDraft({ ...draft, asks })} />
      {localError && (
        <p className="cv-field-error" role="alert">
          {localError}
        </p>
      )}
    </div>
  );
}

export function ThreadComposer({ thread, reload }: { thread: Thread; reload: () => void }) {
  const identity = useIdentity();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [localError, setLocalError] = useState("");
  const accepts = useCallback((entry: { path: string }) => entry.path === `conversations/${thread.id}/messages`, [thread.id]);
  const command = useRecoverableCommand({
    key: `ppo:conversations:${thread.id}:post`,
    scope: identity,
    accepts,
    transport: api,
    acceptsReceipt: serverAllocated,
  });
  const done = (receipt: Receipt | null) => {
    if (!receipt) return;
    setDraft(emptyDraft());
    reload();
    announceConversationsChanged();
  };
  const send = async () => {
    const input = toMessageInput(draft);
    if (!input.ok) return setLocalError(input.message);
    setLocalError("");
    done(
      await command.send(
        `conversations/${thread.id}/messages`,
        { reason: "Post a message", body: input.body, mentions: input.mentions, asks: input.asks },
        `/conversations/${thread.id}`,
        "Message",
        thread.id,
      ),
    );
  };
  const mode = composerMode(thread.state, command.error as { status?: number } | null);
  if (mode === "read-only") return <p className="cv-note">You can read this conversation but not post in it.</p>;
  const others = thread.participants.filter((p) => p.user_id !== identity.actor_id).map((p) => p.display_name);
  return (
    <>
      <Composer
        anchor={{ type: thread.anchor.type, id: thread.anchor.id }}
        draft={draft}
        onDraft={setDraft}
        onSend={() => void send()}
        busy={command.busy}
        localError={localError}
        placeholder={`${others.length ? `Reply to ${others.join(", ")}. ` : ""}Type @ to tag a person, # to link a record`}
      />
      {!!command.error && (
        <div className="cv-send-error">
          <ErrorNotice error={command.error} focusOnError={false} />
          {command.pending && (
            <Button busy={command.busy} onClick={() => void command.retry().then(done)}>
              Retry
            </Button>
          )}
        </div>
      )}
    </>
  );
}
