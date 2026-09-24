"use client";
import Link from "next/link";
import { ErrorNotice, useResource } from "../../../components/business-ui";
import { controlHref, type ControlModule } from "../navigation";
import type { ControlRead } from "../reads";
import type { ControlKind, ControlRecord } from "../model";
import { sourceBlockers } from "../model";
export function ControlSummary({
  packageId,
  mode,
}: {
  packageId: string;
  mode: "overview" | "documents" | "queries" | "review";
}) {
  const read = useResource<ControlRead>(`engineering/${packageId}/control`),
    data = read.data;
  const groups: {
    kind: ControlKind;
    module: ControlModule;
    view?: string;
    title: string;
  }[] =
    mode === "overview"
      ? [
          {
            kind: "basis",
            module: "basis",
            title: "Design basis & interfaces",
          },
          {
            kind: "issue",
            module: "reviews",
            view: "issues",
            title: "Exact formal issues",
          },
        ]
      : mode === "documents"
        ? [
            {
              kind: "deliverable",
              module: "drawings",
              view: "deliverables",
              title: "Accountable deliverables",
            },
            {
              kind: "document",
              module: "drawings",
              title: "Controlled documents",
            },
          ]
        : mode === "queries"
          ? [
              {
                kind: "query",
                module: "queries",
                title: "Formal technical queries",
              },
              {
                kind: "submittal",
                module: "queries",
                view: "submittals",
                title: "Supplier submittals",
              },
            ]
          : [
              {
                kind: "review",
                module: "reviews",
                title: "Technical review queue",
              },
              {
                kind: "issue",
                module: "reviews",
                view: "issues",
                title: "Formal issues & transmittals",
              },
            ];
  return (
    <section className="eng-section" aria-label="Native technical work">
      <ErrorNotice error={read.error} />
      {read.loading && <p role="status">Loading technical work…</p>}
      {data && !read.error && (
        <>
          {groups.map((g) => (
            <section key={g.kind}>
              <h3>
                <Link href={controlHref(packageId, g.module, g.view)}>
                  {g.title}
                </Link>
              </h3>
              {data.records[g.kind].length ? (
                <ul>
                  {data.records[g.kind].map((r) => (
                    <li key={r.id}>
                      <Link
                        href={controlHref(packageId, g.module, g.view, r.id)}
                      >
                        {r.reference} · {r.title}
                      </Link>
                      <p>
                        {r.state} ·{" "}
                        {data.people.find((p) => p.id === r.owner_id)
                          ?.display_name ?? "Owner unavailable"}{" "}
                        · {r.due_date ?? "Date needed"}
                      </p>
                      {g.kind === "deliverable" && (
                        <p>
                          {(r as ControlRecord<"deliverable">).content
                            .prerequisite_evidence ??
                            "Blocked — prerequisite evidence needed"}
                          <br />
                          Next:{" "}
                          {
                            (r as ControlRecord<"deliverable">).content
                              .next_action
                          }
                        </p>
                      )}
                      {g.kind === "issue" &&
                        sourceBlockers([...r.content.source_ids, ...data.native_sources.filter((s) => s.issue_id === r.id).map((s) => s.source_id)], data.sources)
                          .length > 0 && (
                          <p>
                            Historical issue — source reassessment required for
                            current use.
                          </p>
                        )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No {g.kind} records yet.</p>
              )}
            </section>
          ))}
          {mode === "overview" && (
            <p>
              Planned and authorised effort belong to accountable deliverables
              and require an evidence reference. Actual effort and staff
              availability are not governed here; utilisation is not calculated.
            </p>
          )}
          {mode === "review" && (
            <p>
              Technical decisions and exact formal issues are separate from the
              coordination notes below.
            </p>
          )}
        </>
      )}
    </section>
  );
}
