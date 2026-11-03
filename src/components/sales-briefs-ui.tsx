"use client";
import { FontAwesomeGlyph } from "./font-awesome";
import { ProductIcon, type ProductIconName } from "./product-icons";
import {
  receivingStateLabel,
  sourceAttention,
  type ReceivingBrief,
} from "../sales/receiving-queue-model";
const icons = {
  clock: ["clock", "clock"],
  question: ["circle-question", "help"],
  answer: ["envelope", "mail"],
  returned: ["rotate-left", "changes"],
  accepted: ["circle-check", "check"],
  source: ["circle-exclamation", "warning"],
  refresh: ["rotate-left", "changes"],
  more: ["ellipsis", "more"],
  settings: ["gear", "settings"],
  search: ["magnifying-glass", "search"],
  close: ["xmark", "close"],
  next: ["chevron-down", "arrow-down"],
  previous: ["chevron-up", "arrow-up"],
  customer: ["building", "customers"],
  owner: ["user", "person"],
  date: ["calendar", "calendar"],
  activity: ["calendar-days", "calendar"],
  scope: ["list-check", "list"],
  files: ["files", "documents"],
  problem: ["circle-exclamation", "warning"],
  arrow: ["arrow-right", "expand"],
} satisfies Record<string, [string, ProductIconName]>;
export function BriefIcon({ name }: { name: keyof typeof icons }) {
  return (
    <FontAwesomeGlyph
      icon={icons[name][0]}
      className="sb-icon"
      fallback={<ProductIcon name={icons[name][1]} />}
    />
  );
}
export function BriefState({
  row,
  receiver,
}: {
  row: ReceivingBrief;
  receiver?: string;
}) {
  const icon = sourceAttention(row)
    ? "source"
    : (
        {
          Submitted: "clock",
          ClarificationRequested: "question",
          ClarificationAnswered: "answer",
          Returned: "returned",
          Accepted: "accepted",
        } as const
      )[row.state];
  return (
    <span
      className="sb-state"
      data-state={row.state}
      data-attention={sourceAttention(row) || undefined}
    >
      <BriefIcon name={icon} />
      <span>
        {receivingStateLabel(row.state)}
        {sourceAttention(row) ? " · source changed" : ""}
        {receiver ? ` · ${receiver} receives` : ""}
      </span>
    </span>
  );
}
