"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { GuideDocument } from "./model";
import { DocumentDetails } from "./document-details";

// Mounted only in the local development shell. Hosted users keep released help.
export function DevelopmentPageGuide() {
  const pathname = usePathname();
  const [guide, setGuide] = useState<GuideDocument | null>(null),
    [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    void fetch(
      "/api/development/catalog?pathname=" + encodeURIComponent(pathname),
      { cache: "no-store", signal: controller.signal },
    )
      .then(async (response) => {
        if (!response.ok) throw Error("unavailable");
        return response.json() as Promise<GuideDocument>;
      })
      .then((value) => {
        if (!controller.signal.aborted) setGuide(value);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [pathname]);
  return (
    <details className="ppo-development-guide">
      <summary>Development draft guide for this page</summary>
      {error ? (
        <p>No registered guide is available for this address.</p>
      ) : !guide ? (
        <p role="status">Loading draft guide…</p>
      ) : (
        <>
          <p>
            <strong>{guide.title}</strong> · {guide.review_state}
          </p>
          <DocumentDetails
            history={guide.history}
            owner={guide.owner_role}
            reviewer={guide.reviewer}
            reviewedAt={guide.reviewed_at}
          />
          <p>
            History covers the guide library file; it does not record a review
            of this article.
          </p>
          <p>
            Working design guidance. Validate the tasks against this release
            before operational use.
          </p>
          <Link
            href={
              "/development/page-register?entry=" +
              encodeURIComponent(guide.entry_key)
            }
          >
            Open full guide and design references
          </Link>
          {guide.sections.map((section) => (
            <section key={section.section_id}>
              <h3>{section.title}</h3>
              {section.paragraphs.map((text, i) => (
                <p key={i}>{text}</p>
              ))}
              {!!section.steps.length && (
                <ol>
                  {section.steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              )}
              {!!section.rows.length && (
                <dl>
                  {section.rows.map((row, i) => (
                    <div key={i}>
                      <dt>{row[0]}</dt>
                      <dd>{row.slice(1).join(" · ")}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </section>
          ))}
        </>
      )}
    </details>
  );
}
