"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { RegisterChip } from "../ui/register-table";
import { Button } from "../ui/button";
import { isDenied } from "../business-ui";
import type { readCs } from "../../shared/cs/service";
export type SurveyWorkspace = Awaited<ReturnType<typeof readCs>>;
export const surveyViews = [
  ["", "All surveys"],
  ["Draft", "Drafts"],
  ["Submitted", "Awaiting review"],
  ["Returned", "Returned"],
  ["Reviewed", "Reviewed"],
] as const;
export const observationKinds = [
  "Measured",
  "Observed",
  "Customer statement",
  "Unknown",
  "Assumption",
] as const;
export const tabs = [
  { id: "scope", label: "Survey scope" },
  { id: "observations", label: "Observations" },
  { id: "photos", label: "Photos" },
  { id: "follow-up", label: "Follow-up" },
  { id: "review", label: "Review & handover" },
  { id: "history", label: "History" },
];
export const surveyBoundary =
  "Review records the as-found brief. It does not certify design suitability, capacity, site safety or work authority.";
export function SurveyTag({ value }: { value: string }) {
  return (
    <RegisterChip
      tone={
        ["Reviewed", "Measured"].includes(value)
          ? "positive"
          : ["Submitted", "Unknown", "Assumption", "Recheck required"].includes(
                value,
              )
            ? "attention"
            : value === "Returned"
              ? "negative"
              : "neutral"
      }
    >
      {value}
    </RegisterChip>
  );
}
export function SurveyReadState({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error: unknown;
  retry: () => void;
}) {
  if (loading)
    return (
      <div className="srv-state" role="status" aria-busy="true">
        <h2>Loading site surveys…</h2>
        <p>Reading your permitted surveys.</p>
        <div className="srv-skeleton" />
        <div className="srv-skeleton" />
        <div className="srv-skeleton" />
      </div>
    );
  if (error)
    return (
      <div className="srv-state" role="alert">
        <h2>
          {isDenied(error)
            ? "Survey access unavailable"
            : "Could not load site surveys"}
        </h2>
        <p>
          {isDenied(error)
            ? "This record or view is not available with your current access."
            : "The current list and counts could not be read. Check your connection and try again."}
        </p>
        <Button onClick={retry}>Try again</Button>
      </div>
    );
  return null;
}
export function SurveySection({
  title,
  action,
  description,
  children,
}: {
  title: string;
  action?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="srv-section">
      <header>
        <div>
          <h2>{title}</h2>
          {description && (
            <p className="srv-section-description">{description}</p>
          )}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
export function SurveyFacts({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="srv-facts">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
export const surveyDate = (
  value: string | Date | null | undefined,
  timezone = "Australia/Brisbane",
  time = false,
) =>
  value
    ? new Intl.DateTimeFormat("en-AU", {
        weekday: "short",
        day: "numeric",
        month: "short",
        ...(time
          ? { hour: "2-digit" as const, minute: "2-digit" as const }
          : {}),
        timeZone: timezone,
      }).format(new Date(value))
    : "Not recorded";

/** Keep keyboard context when an inline survey form replaces its trigger. */
export function useSurveyFormFocus() {
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    const heading = form.current?.querySelector<HTMLElement>("h2");
    heading?.setAttribute("tabindex", "-1");
    const target = heading?.getClientRects().length
      ? heading
      : form.current?.querySelector<HTMLElement>(
          "button,input,select,textarea",
        );
    target?.focus({ preventScroll: true });
    return () => {
      requestAnimationFrame(() => {
        if (
          previous instanceof HTMLElement &&
          previous.isConnected &&
          previous.getClientRects().length
        )
          previous.focus({ preventScroll: true });
      });
    };
  }, []);
  return form;
}
