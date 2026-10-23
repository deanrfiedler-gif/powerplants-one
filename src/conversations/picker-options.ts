import type { DraftMention } from "./composition";
import type { HistoryWarning } from "./participant-warning";

export type Person = {
  id: string;
  display_name: string;
  role?: string;
  history_warning?: HistoryWarning;
};
export type PeopleRead = {
  items: Person[];
  agent?: { name: string; label: string } | null;
};
export type PickerOption = {
  id: string;
  label: string;
  detail?: string;
  agent?: boolean;
  mention: (key: string) => DraftMention;
};
export const personMention = (p: Person, key: string): DraftMention => ({
  key,
  kind: "Person",
  person_id: p.id,
  display_name: p.display_name,
});

// Availability is supplied by the server for this anchor. Names never select an Agent identity.
export function peopleOptions(
  read: PeopleRead | undefined,
  alreadyTagged: boolean,
  query: string,
): PickerOption[] {
  const options: PickerOption[] = (read?.items ?? []).map((p) => ({
    id: p.id,
    label: p.display_name,
    detail: `Person · ${p.role ?? "Role not recorded"}`,
    mention: (key) => personMention(p, key),
  }));
  if (read?.agent && !alreadyTagged)
    options.unshift({
      id: "agent",
      label: read.agent.label,
      agent: true,
      detail: "Answers from records everyone in this thread can see, for you",
      mention: (key) => ({ key, kind: "Agent" }),
    });
  const q = query.trim().toLocaleLowerCase("en-AU");
  return options.filter(
    (o) => !q || o.label.toLocaleLowerCase("en-AU").includes(q),
  );
}
