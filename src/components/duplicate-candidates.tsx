"use client";
import { ReadState, RecordLink, useResource, type Envelope } from "./business-ui";

type DuplicateOrganisation = { id: string; display_name?: string; display_number?: string; relationship_status?: string };

export function DuplicateCandidates({ record }: { record: {id:string;display_name?:string} }) {
  const r = useResource<Envelope<DuplicateOrganisation>>(
    `customers?q=${encodeURIComponent(record.display_name ?? "")}`,
  );
  return (
    <section className="detail-section">
      <h2>Possible duplicate organisations</h2>
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      {r.data && !r.loading && !r.error && (
        <>
          {r.data.items.filter((x) => x.id !== record.id).length === 0 ? (
            <p>No other permitted matching names were found in this page.</p>
          ) : (
            r.data.items
              .filter((x) => x.id !== record.id)
              .map((x) => (
                <p key={x.id}>
                  <RecordLink type="Organisation" id={x.id}>
                    {x.display_name} · {x.display_number}
                  </RecordLink>{" "}
                  · {x.relationship_status}
                </p>
              ))
          )}
          <p>
            Review each identity and its relationships. Records are never merged
            automatically.
          </p>
        </>
      )}
    </section>
  );
}
