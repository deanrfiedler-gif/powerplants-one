// The `@` and `#` pickers (PPO-CONV-T1C-DESIGN 5.4): keyboard-driven lists of the people who can read the record (T1-3)
// and the deals and projects the sender can open. A picker that cannot load says so and still lets the message be sent.
import { useEffect, useId, useRef, useState } from "react";
import { usePlatformResource } from "../../components/platform-resource";
import { Button } from "../../components/ui/button";
import type { AnchorType } from "../model";
import type { DraftMention } from "../composition";

export type Person = { id: string; display_name: string };
export type LinkableRecord = { record_type: AnchorType; id: string; display_number: string; title: string };
const kind = { Opportunity: "Deal", Project: "Project" } as const;

export const recordMention = (r: LinkableRecord, key: string): DraftMention => ({
  key,
  kind: "Record",
  record_type: r.record_type,
  record_id: r.id,
  label: `${r.display_number} · ${r.title}`,
});
export const personMention = (p: Person, key: string): DraftMention => ({
  key,
  kind: "Person",
  person_id: p.id,
  display_name: p.display_name,
});

type Option = { id: string; label: string; detail?: string; mention: (key: string) => DraftMention };

export function MentionPicker({
  mode,
  anchor,
  onPick,
  onClose,
}: {
  mode: "person" | "record";
  anchor: { type: AnchorType; id: string } | null;
  onPick: (mention: DraftMention) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus(), []);
  const path =
    mode === "person"
      ? anchor && `conversations/people?anchor_type=${anchor.type}&anchor_id=${anchor.id}`
      : `conversations/records?q=${encodeURIComponent(query.trim())}`;
  const read = usePlatformResource<{ items: (Person | LinkableRecord)[] }>(path, false);
  const q = query.trim().toLocaleLowerCase("en-AU");
  const options: Option[] = (read.data?.items ?? [])
    .map((item): Option =>
      mode === "person"
        ? { id: item.id, label: (item as Person).display_name, mention: (key) => personMention(item as Person, key) }
        : {
            id: item.id,
            label: `${(item as LinkableRecord).display_number} · ${(item as LinkableRecord).title}`,
            detail: kind[(item as LinkableRecord).record_type],
            mention: (key) => recordMention(item as LinkableRecord, key),
          },
    )
    .filter((o) => mode === "record" || !q || o.label.toLocaleLowerCase("en-AU").includes(q));
  const current = Math.min(active, Math.max(options.length - 1, 0));
  const pick = (o: Option) => onPick(o.mention(`${o.id}:${crypto.randomUUID()}`));
  const keys = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, Math.min(options.length - 1, a + (e.key === "ArrowDown" ? 1 : -1))));
    } else if (e.key === "Enter" && options[current]) {
      e.preventDefault();
      pick(options[current]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };
  const name = mode === "person" ? "People" : "Records";
  return (
    <div className="cv-picker">
      <input
        ref={input}
        role="combobox"
        aria-label={mode === "person" ? "Find a person" : "Find a record"}
        aria-expanded="true"
        aria-controls={listId}
        aria-activedescendant={options[current] ? `${listId}-${current}` : undefined}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
        }}
        onKeyDown={keys}
        placeholder={mode === "person" ? "Find a person" : "Find a deal or project"}
      />
      {read.loading && <p className="cv-note">Loading…</p>}
      {!!read.error && (
        <div className="cv-picker-error">
          <p role="alert">{mode === "person" ? "People could not be loaded." : "Records could not be loaded."}</p>
          <Button onClick={read.reload}>Retry</Button>
        </div>
      )}
      <ul id={listId} role="listbox" aria-label={name}>
        {options.map((o, i) => (
          <li
            key={o.id}
            id={`${listId}-${i}`}
            role="option"
            aria-selected={i === current}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => pick(o)}
          >
            {o.label}
            {o.detail && <span className="cv-option-detail"> {o.detail}</span>}
          </li>
        ))}
      </ul>
      {read.data && !options.length && <p className="cv-note">{mode === "person" ? "No one else can read this record." : "No deals or projects match."}</p>}
    </div>
  );
}
