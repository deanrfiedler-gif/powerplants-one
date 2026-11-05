"use client";
import Link from "next/link";
import { ProductIcon } from "./product-icons";
export const escalationViews = [
  { id: "open", label: "Open cases" },
  { id: "diagnosing", label: "Diagnosing" },
  { id: "waiting", label: "Waiting on manufacturer" },
  { id: "reply", label: "Reply to act on" },
  { id: "closed", label: "Closed cases" },
] as const;
export type EscalationView = (typeof escalationViews)[number]["id"];
export function EscalationMenuLink({
  id,
  label,
  view,
  onSelect,
}: {
  id: EscalationView;
  label: string;
  view?: EscalationView;
  onSelect?: (v: EscalationView) => void;
}) {
  return (
    <li>
      <Link
        href={`/service/escalations?view=${id}`}
        aria-current={view === id ? "page" : undefined}
        onClick={
          onSelect
            ? (e) => {
                e.preventDefault();
                onSelect(id);
              }
            : undefined
        }
      >
        <ProductIcon name="list" />
        <span>{label}</span>
      </Link>
    </li>
  );
}
export function EscalationsMenu({
  view,
  onSelect,
}: {
  view?: EscalationView;
  onSelect?: (v: EscalationView) => void;
}) {
  return (
    <>
      <h2>Escalations</h2>
      <ul className="sv07-review-links">
        {escalationViews.slice(0, 4).map((v) => (
          <EscalationMenuLink
            key={v.id}
            {...v}
            view={view}
            onSelect={onSelect}
          />
        ))}
      </ul>
    </>
  );
}
