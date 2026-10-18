// New thread (PPO-CONV-T1C-DESIGN 5.5): About, the message with its ask rows, and a title derived from the message that
// the person can edit before starting. Opened at /conversations?new=1, optionally with record={type}:{id} for T1d.
import { useCallback, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ErrorNotice } from "../../components/business-ui";
import { useIdentity } from "../../components/business-session";
import { usePlatformResource } from "../../components/platform-resource";
import { Button } from "../../components/ui/button";
import { useRecoverableCommand } from "../../shared/ui/use-recoverable-command";
import { emptyDraft, toMessageInput, type Draft } from "../composition";
import { anchorTypes, type AnchorType } from "../model";
import { deriveTitle } from "../title";
import { Composer, serverAllocated } from "./composer";
import { announceConversationsChanged } from "./conversations-workspace";
import type { LinkableRecord } from "./mention-picker";

type Chosen = { type: AnchorType; id: string; display_number: string; title: string };

const parseRecord = (value: string | null) => {
  const [type, id] = (value ?? "").split(":");
  return anchorTypes.includes(type as AnchorType) && /^[0-9a-f-]{36}$/.test(id ?? "") ? { type: type as AnchorType, id: id! } : null;
};

function AboutPicker({ chosen, onChoose }: { chosen: Chosen | null; onChoose: (c: Chosen | null) => void }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();
  const read = usePlatformResource<{ items: LinkableRecord[] }>(chosen ? null : `conversations/records?q=${encodeURIComponent(query.trim())}`, false);
  const items = read.data?.items ?? [];
  const current = Math.min(active, Math.max(items.length - 1, 0));
  const choose = (r: LinkableRecord) => onChoose({ type: r.record_type, id: r.id, display_number: r.display_number, title: r.title });
  if (chosen)
    return (
      <div className="cv-about-chosen">
        <span className="cv-record-link">
          {chosen.display_number} · {chosen.title}
        </span>
        <Button variant="quiet" onClick={() => onChoose(null)}>
          Change
        </Button>
      </div>
    );
  return (
    <div className="cv-picker cv-about">
      <input
        role="combobox"
        aria-label="About"
        aria-expanded="true"
        aria-controls={listId}
        aria-activedescendant={items[current] ? `${listId}-${current}` : undefined}
        placeholder="Find a deal or project"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(0, Math.min(items.length - 1, a + (e.key === "ArrowDown" ? 1 : -1))));
          } else if (e.key === "Enter" && items[current]) {
            e.preventDefault();
            choose(items[current]);
          }
        }}
      />
      {!!read.error && (
        <div className="cv-picker-error">
          <p role="alert">Records could not be loaded.</p>
          <Button onClick={read.reload}>Retry</Button>
        </div>
      )}
      <ul id={listId} role="listbox" aria-label="Records">
        {items.map((r, i) => (
          <li key={r.id} id={`${listId}-${i}`} role="option" aria-selected={i === current} onMouseDown={(e) => e.preventDefault()} onClick={() => choose(r)}>
            {r.display_number} · {r.title}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function NewThreadDialog({ initialRecord }: { initialRecord: string | null }) {
  const router = useRouter();
  const identity = useIdentity();
  const titleId = useId();
  const preset = parseRecord(initialRecord);
  // A record named in the address is looked up among the records the sender can link before it is shown (T1-4).
  const lookup = usePlatformResource<{ items: LinkableRecord[] }>(
    preset ? `conversations/records?record_type=${preset.type}&record_id=${preset.id}` : null,
    false,
  );
  const found = lookup.data?.items.find((r) => preset && r.id === preset.id && r.record_type === preset.type);
  const [picked, setPicked] = useState<Chosen | null | undefined>(undefined);
  const chosen = picked !== undefined ? picked : found ? { type: found.record_type, id: found.id, display_number: found.display_number, title: found.title } : null;
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [customTitle, setCustomTitle] = useState<string | null>(null);
  const [localError, setLocalError] = useState("");
  const accepts = useCallback((entry: { path: string }) => entry.path === "conversations", []);
  const command = useRecoverableCommand({ key: "ppo:conversations:new", scope: identity, accepts, transport: api, acceptsReceipt: serverAllocated });
  const title = customTitle ?? (chosen ? deriveTitle(draft, chosen.display_number) : "");
  // A confirmed start opens its thread, including one confirmed after a reload; the stored confirmation is then cleared
  // so the next New thread starts empty (5.5, final review I6).
  const accepted = command.accepted;
  useEffect(() => {
    if (!accepted) return;
    try {
      sessionStorage.removeItem("ppo:conversations:new:accepted");
    } catch {
      // Storage failure must not prevent opening the confirmed thread.
    }
    announceConversationsChanged();
    router.push(`/conversations/${accepted.receipt.record_id}`);
  }, [accepted, router]);
  const pendingTitle = command.pending ? String(command.pending.body.title ?? "") : "";
  const close = () => router.replace("/conversations");
  const start = async () => {
    if (!chosen) return setLocalError("Choose the deal or project this conversation is about.");
    const input = toMessageInput(draft);
    if (!input.ok) return setLocalError(input.message);
    if (!draft.text.trim()) return setLocalError("Write the first message.");
    if (!title.trim()) return setLocalError("Give the conversation a title.");
    setLocalError("");
    await command.send(
      "conversations",
      {
        reason: "Start a conversation",
        anchor_type: chosen.type,
        anchor_id: chosen.id,
        title: title.trim(),
        body: input.body,
        mentions: input.mentions,
        asks: input.asks,
      },
      "/conversations",
      "Conversation",
      chosen.id,
    );
  };
  return (
    <div className="cv-dialog-backdrop">
      <div className="cv-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} onKeyDown={(e) => e.key === "Escape" && close()}>
        <header className="cv-dialog-head">
          <h2 id={titleId}>New thread</h2>
          <Button variant="quiet" aria-label="Close" onClick={close}>
            ×
          </Button>
        </header>
        <p className="cv-dialog-body">
          Every thread is about one deal or project, so the people you ask can see what you mean. Only people who can
          open the record can be asked.
        </p>
        <div className="cv-field">
          <span className="cv-field-label">About</span>
          <AboutPicker chosen={chosen} onChoose={setPicked} />
        </div>
        <div className="cv-field">
          <span className="cv-field-label">Message</span>
          <Composer
            anchor={chosen ? { type: chosen.type, id: chosen.id } : null}
            draft={draft}
            onDraft={setDraft}
            busy={command.busy}
            localError=""
            placeholder="Write your first message. Tag a person with @ to ask them a question, or link a record with #"
          />
        </div>
        {chosen && (
          <div className="cv-title-line">
            {customTitle === null ? (
              <>
                <span>Title: {title}</span>
                <Button variant="quiet" onClick={() => setCustomTitle(title)}>
                  Edit
                </Button>
              </>
            ) : (
              <label className="cv-field">
                <span className="cv-field-label">Title</span>
                <input maxLength={200} value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} />
              </label>
            )}
          </div>
        )}
        <p className="cv-hint">Switch on Ask for anyone you&apos;re asking a question; you can add a reply-by date.</p>
        {localError && (
          <p className="cv-field-error" role="alert">
            {localError}
          </p>
        )}
        {command.pending && (
          <p className="cv-banner" role="status">
            “{pendingTitle}” has not been confirmed. Retry to confirm it before starting another conversation.
          </p>
        )}
        {!!command.error && <ErrorNotice error={command.error} focusOnError={false} />}
        <footer className="cv-dialog-actions">
          <Button onClick={close}>Cancel</Button>
          {command.pending ? (
            <Button variant="primary" busy={command.busy} onClick={() => void command.retry()}>
              Retry
            </Button>
          ) : (
            <Button variant="primary" busy={command.busy} onClick={() => void start()}>
              Start thread
            </Button>
          )}
        </footer>
      </div>
    </div>
  );
}
