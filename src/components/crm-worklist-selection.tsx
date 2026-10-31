"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import type { WorklistItem } from "../crm/worklist";
import { valueSummary } from "../crm/value-summary";
import { dealWorkspaceHref } from "./deal-workspace-link";
import { ProductIcon } from "./product-icons";
export function DealSelection({
  items,
  busy,
  onClose,
  onOpen,
  onExport,
}: {
  items: WorklistItem[];
  busy: boolean;
  onClose: () => void;
  onOpen: () => void;
  onExport: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.show();
    return () => {
      previous?.focus({ preventScroll: true });
    };
  }, []);
  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (
        e.key === "Escape" &&
        !document.querySelector(":modal,:popover-open")
      ) {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [onClose]);
  return (
    <dialog
      ref={ref}
      className="crm-selection-panel"
      aria-labelledby="crm-selection-title"
    >
      <header>
        <h2 id="crm-selection-title">
          {items.length} {items.length === 1 ? "deal" : "deals"} selected
        </h2>
        <button
          className="secondary"
          aria-label="Close selection"
          onClick={onClose}
        >
          <ProductIcon name="close" />
        </button>
      </header>
      <div className="crm-selection-body">
        <p>
          {valueSummary(items).formatted} known · {valueSummary(items).unknown}{" "}
          not estimated
        </p>
        <p>
          Selection from the current result page. Filters, page changes or
          changed records clear this selection.
        </p>
        {items.map((item) => (
          <article key={item.id}>
            <Link href={dealWorkspaceHref(item.id)}>{item.title}</Link>
            <p>{item.organisation_name}</p>
            <small>
              {item.stage_id} · {item.owner_name}
            </small>
          </article>
        ))}
        <div className="crm-selection-actions">
          <button className="secondary" disabled={busy} onClick={onExport}>
            <ProductIcon name="download" />
            Export selected list
          </button>
        </div>
        <p>
          CSV includes selected deals in displayed order and the visible List
          columns. Access and saved values are checked again before export.
        </p>
        <p>
          Stage and outcome changes remain individual decisions, opened from
          each deal.
        </p>
      </div>
      <footer>
        <button
          className="secondary"
          aria-label="Cancel selection"
          onClick={onClose}
        >
          Cancel
        </button>
        <button disabled={busy} onClick={onOpen}>
          Open in sequence
        </button>
      </footer>
    </dialog>
  );
}
