// The `@` and `#` pickers (PPO-CONV-T1C-DESIGN 5.4): keyboard-driven lists of the people who can read the record (T1-3)
// and the deals and projects the sender can open. A picker that cannot load says so and still lets the message be sent.
import { Fragment, useEffect, useId, useRef, useState } from "react";
import { usePlatformResource } from "../../components/platform-resource";
import { Button } from "../../components/ui/button";
import type { AnchorType } from "../model";
import type { DraftMention } from "../composition";
import {
  peopleOptions,
  type PeopleRead,
  type PickerOption,
} from "../picker-options";
import { AgentAvatar } from "./agent-avatar";
export { personMention, type Person } from "../picker-options";

export type LinkableRecord = {
  record_type: AnchorType;
  id: string;
  display_number: string;
  title: string;
};
const kind = { Opportunity: "Deal", Project: "Project" } as const;

export const recordMention = (r: LinkableRecord, key: string): DraftMention => ({
  key,
  kind: "Record",
  record_type: r.record_type,
  record_id: r.id,
  label: `${r.display_number} · ${r.title}`,
});
export function MentionPicker({
  mode,
  anchor,
  onPick,
  onClose,
  agentTagged = false,
}: {
  mode: "person" | "record";
  anchor: { type: AnchorType; id: string } | null;
  onPick: (mention: DraftMention) => void;
  onClose: () => void;
  agentTagged?: boolean;
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
  const read = usePlatformResource<PeopleRead | { items: LinkableRecord[] }>(
    path,
  );
  const options: PickerOption[] =
    mode === "person"
      ? peopleOptions(read.data as PeopleRead | undefined, agentTagged, query)
      : ((read.data?.items ?? []) as LinkableRecord[]).map((item) => ({
          id: item.id,
          label: `${(item as LinkableRecord).display_number} · ${(item as LinkableRecord).title}`,
          detail: kind[(item as LinkableRecord).record_type],
          mention: (key) => recordMention(item as LinkableRecord, key),
        }));
  const current = Math.min(active, Math.max(options.length - 1, 0));
  const pick = (o: PickerOption) =>
    onPick(o.mention(`${o.id}:${crypto.randomUUID()}`));
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
      <div className="cv-picker-search">
        <input
          ref={input}
          role="combobox"
          aria-label={mode === "person" ? "Find a person" : "Find a record"}
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={
            options[current] ? `${listId}-${current}` : undefined
          }
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={keys}
          placeholder={
            mode === "person" ? "Find a person" : "Find a deal or project"
          }
        />
        <button className="cv-tool" type="button" aria-label="Close picker" onClick={onClose}>
          ×
        </button>
      </div>
      {read.loading && <p className="cv-note">Loading…</p>}
      {!!read.error && (
        <div className="cv-picker-error">
          <p role="alert">
            {mode === "person"
              ? "People could not be loaded."
              : "Records could not be loaded."}
          </p>
          <Button onClick={read.reload}>Retry</Button>
        </div>
      )}
      <ul id={listId} role="listbox" aria-label={name}>
        {options.map((o, i) => (
          <Fragment key={o.id}>
            {mode === "person" &&
              (i === 0 || options[i - 1].agent !== o.agent) && (
                <li role="presentation" className="cv-picker-heading">
                  {o.agent ? "AI assistant" : "People"}
                </li>
              )}
            <li
              id={`${listId}-${i}`}
              role="option"
              data-mention-kind={
                o.agent ? "Agent" : mode === "person" ? "Person" : "Record"
              }
              aria-selected={i === current}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(o)}
            >
              {o.agent && <AgentAvatar />}
              <span className="cv-option-copy">
                {o.label}
                {o.detail && (
                  <span className="cv-option-detail">{o.detail}</span>
                )}
              </span>
            </li>
          </Fragment>
        ))}
      </ul>
      {read.data && !options.length && (
        <p className="cv-note">
          {mode === "person"
            ? "No one else can read this record."
            : "No deals or projects match."}
        </p>
      )}
    </div>
  );
}
