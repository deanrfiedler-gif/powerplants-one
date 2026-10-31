"use client";
import Link from "next/link";
import "./service-review-menu.css";
import { Fragment } from "react";
import { ProductIcon } from "./product-icons";
export const findingViews = [
  { id: "open", label: "All open" },
  { id: "needs_owner", label: "Needs an owner" },
  { id: "due_this_week", label: "Due this week" },
  { id: "overdue", label: "Overdue" },
  { id: "waiting_review", label: "Waiting on review" },
  { id: "follow_up_completed", label: "Ready to close" },
  { id: "recurring", label: "Recurring" },
  { id: "closed", label: "Closed findings" },
] as const;
export type FindingView = (typeof findingViews)[number]["id"];
export function FindingsMenu({
  view,
  counts,
  onSelect,
}: {
  view?: FindingView;
  counts?: Record<string, number>;
  onSelect?: (view: FindingView) => void;
}) {
  return (
    <>
      {[findingViews.slice(0, 7), findingViews.slice(7)].map((group, index) => (
        <Fragment key={index}>
          <h2>{index === 0 ? "Findings" : "History"}</h2>
          <ul className="sv07-review-links">
            {group.map((v) => (
              <li key={v.id}>
                {onSelect ? (
                  <a
                    href={`/service/findings?view=${v.id}`}
                    aria-current={v.id === view ? "page" : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      onSelect(v.id);
                    }}
                  >
                    <ProductIcon name="list" />
                    <span>{v.label}</span>
                    <small className="mw-badge">{counts?.[v.id] ?? "—"}</small>
                  </a>
                ) : (
                  <Link href={`/service/findings?view=${v.id}`}>
                    <ProductIcon name="list" />
                    <span>{v.label}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </Fragment>
      ))}
    </>
  );
}
