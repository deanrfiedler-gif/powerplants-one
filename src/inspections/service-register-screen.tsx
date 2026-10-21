"use client";
import Link from "next/link";
import { useState } from "react";
import { useCrmResource } from "../components/crm-state";
import { ReadState } from "../components/business-ui";
import { Button } from "../components/ui/button";
import {
  RegisterTable,
  RegisterChip,
  RegisterEmpty,
  RegisterFooter,
} from "../components/ui/register-table";
import { SecondaryMenuFrame, useSecondaryMenu } from "../shell/secondary-menu";
import { usePhoneHeader } from "../shell/phone-header";
import { inspectionLabel } from "./model";
import type { InspectionRegisterRow } from "./service-register";

const views = [
  ["all", "All attempts"],
  ["InReview", "Awaiting review"],
  ["ClarificationRequired", "Clarification requested"],
  ["OnHold", "On hold"],
  ["Returned", "Returned"],
  ["retests", "Retest due"],
  ["accepted", "Accepted, not issued"],
  ["issued", "Outcomes issued"],
] as const;
const matches = (r: InspectionRegisterRow, v: string) =>
  v === "all" ||
  (v === "retests"
    ? r.retest_due
    : v === "accepted"
      ? r.review === "Accepted" && !r.issued
      : v === "issued"
        ? r.issued
        : r.review === v);
const href = (r: InspectionRegisterRow, capture: boolean) =>
  `/${capture ? "my-jobs" : "service"}/inspections?appointment_id=${r.id}${r.attempt_id ? "&attempt_id=" + r.attempt_id : ""}`;
const date = (d: Date | null) =>
  d
    ? new Date(d).toLocaleString("en-AU", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
export function InspectionWorklist({ mode }: { mode: "capture" | "review" }) {
  const capture = mode === "capture";
  const r = useCrmResource<{
    rows: InspectionRegisterRow[];
    window: string;
    as_at: string;
  }>(capture ? "my-jobs/inspections" : "service/inspections", true);
  const [view, setView] = useState("all"),
    [performer, setPerformer] = useState(""),
    [site, setSite] = useState(""),
    [remembered, remember] = useState(true);
  const menu = useSecondaryMenu(remembered, remember);
  const all = r.data?.rows ?? [],
    rows = all.filter(
      (x) =>
        matches(x, view) &&
        (!performer || x.performer_id === performer) &&
        (!site || x.site_id === site),
    );
  const title = views.find((v) => v[0] === view)?.[1] ?? "All attempts";
  usePhoneHeader(
    capture ? { title: "My inspections", count: all.length } : null,
  );
  const state = (
    <ReadState loading={r.loading} error={r.error} retry={r.reload} />
  );
  if (capture)
    return (
      <section className="inspection-mine" aria-label="My inspections">
        <div className="inspection-list-intro">
          <h1>My inspections</h1>
          <span>Online only</span>
          <p>Your work on assigned visits · {all.length} inspections</p>
        </div>
        {state}
        {r.data &&
          (all.length ? (
            ["To do", "Submitted", "Finished"].map((group) => {
              const items = all.filter((x) =>
                group === "To do"
                  ? x.state !== "Submitted"
                  : group === "Finished"
                    ? x.review === "Accepted" || x.review === "Returned"
                    : x.state === "Submitted" &&
                      x.review !== "Accepted" &&
                      x.review !== "Returned",
              );
              return items.length ? (
                <section key={group} className="inspection-work-group">
                  <h2>
                    {group} <span>{items.length}</span>
                  </h2>
                  {items.map((x) => (
                    <Link
                      className="inspection-work-item"
                      key={x.attempt_id ?? x.id}
                      href={href(x, true)}
                    >
                      <div>
                        <strong>{x.procedure}</strong>
                        <RegisterChip
                          tone={
                            x.review === "Accepted" ? "positive" : "neutral"
                          }
                        >
                          {x.state === "Draft"
                            ? "Draft"
                            : x.state === "NotStarted"
                              ? "Not started"
                              : x.review === "InReview"
                                ? "Awaiting review"
                                : inspectionLabel(x.review)}
                        </RegisterChip>
                      </div>
                      <p>
                        {x.predecessor_number ? "Retest · " : ""}
                        {x.site} · {x.equipment}
                      </p>
                      <small>
                        {x.reference} · {date(x.start_at)} · {x.result}
                      </small>
                    </Link>
                  ))}
                </section>
              ) : null;
            })
          ) : (
            <RegisterEmpty title="No assigned inspections">
              Your assigned visits will appear here.
            </RegisterEmpty>
          ))}
      </section>
    );
  return (
    <SecondaryMenuFrame
      state={menu}
      id="inspection-register"
      name="Inspection review"
      menuId="inspection-views"
      contentId="inspection-grid"
      message="Inspection views"
      phoneHeader={{ title, count: rows.length }}
      menu={
        <nav aria-label="Inspection views">
          {views.map(([key, label], i) => (
            <div key={key}>
              {(i === 1 || i === 5) && (
                <h2 className="inspection-menu-heading">
                  {i === 1 ? "Review" : "Follow-through"}
                </h2>
              )}
              <button
                type="button"
                className="mw-menu-item"
                aria-current={view === key ? "page" : undefined}
                onClick={() => {
                  setView(key);
                  menu.closeOverlay();
                }}
              >
                {label}
                <span>{all.filter((x) => matches(x, key)).length}</span>
              </button>
            </div>
          ))}
        </nav>
      }
    >
      <div className="inspection-toolbar">
        <label>
          <span className="inspection-sr">Performer</span>
          <select
            aria-label="Performer"
            value={performer}
            onChange={(e) => setPerformer(e.target.value)}
          >
            <option value="">Performer · All</option>
            {[
              ...new Map(
                all
                  .filter((x) => x.performer_id)
                  .map((x) => [x.performer_id, x]),
              ).values(),
            ].map((x) => (
              <option key={x.performer_id} value={x.performer_id!}>
                {x.performer}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="inspection-sr">Site</span>
          <select
            aria-label="Site"
            value={site}
            onChange={(e) => setSite(e.target.value)}
          >
            <option value="">Site · All</option>
            {[...new Map(all.map((x) => [x.site_id, x])).values()].map((x) => (
              <option key={x.site_id} value={x.site_id}>
                {x.site}
              </option>
            ))}
          </select>
        </label>
        <span className="inspection-as-at">
          {rows.length} attempts ·{" "}
          {r.data
            ? `As at ${new Date(r.data.as_at).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}`
            : r.error ? "Unavailable" : "Loading"}
        </span>
        <Button
          aria-label="Refresh inspections"
          onClick={r.reload}
          disabled={r.loading}
        >
          Refresh
        </Button>
      </div>
      {state}
      {r.data && (
        <RegisterTable
          caption="Inspection attempts. Open a procedure to inspect its retained readings and review."
          stale={r.loading}
          empty={
            !rows.length && (
              <RegisterEmpty title="No attempts in this view">
                Choose another view or clear the filters.
              </RegisterEmpty>
            )
          }
          footer={
            <RegisterFooter>
              {rows.length} attempts · {r.data.window}
            </RegisterFooter>
          }
        >
          <thead>
            <tr>
              {[
                "Visit",
                "Procedure",
                "Attempt",
                "Review",
                "Result",
                "Defects",
                "Equipment",
                "Performer",
                "Submitted",
                "Site",
              ].map((label) => (
                <th key={label} scope="col">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((x) => (
              <tr key={x.attempt_id}>
                <td>
                  <Link href={`/my-jobs/${x.id}`}>{x.reference}</Link>
                </td>
                <td>
                  <Link href={href(x, false)}>{x.procedure}</Link>
                </td>
                <td>
                  Attempt {x.attempt_number}
                  {x.predecessor_number
                    ? ` · retest of ${x.predecessor_number}`
                    : ""}
                </td>
                <td>
                  <RegisterChip
                    tone={
                      x.review === "Accepted"
                        ? "positive"
                        : x.review === "Returned"
                          ? "negative"
                          : x.review === "InReview"
                            ? "attention"
                            : "neutral"
                    }
                  >
                    {x.review === "InReview"
                      ? "Awaiting review"
                      : inspectionLabel(x.review)}
                  </RegisterChip>
                </td>
                <td>{x.result}</td>
                <td>{x.defects || "—"}</td>
                <td>{x.equipment}</td>
                <td>{x.performer}</td>
                <td>{date(x.submitted_at)}</td>
                <td>{x.site}</td>
              </tr>
            ))}
          </tbody>
        </RegisterTable>
      )}
    </SecondaryMenuFrame>
  );
}
