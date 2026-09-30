"use client";
import Link from "next/link";
import {
  ReadState,
  useResource,
  type Envelope,
} from "../../../components/business-ui";
import type { PolicyHold } from "../../policy-holds";

export function PolicyHolds({ activityId }: { activityId?: string }) {
  const read = useResource<
    Envelope<{
      appointment_id: string;
      reference: string;
      impacts: PolicyHold[];
    }>
  >(
    activityId
      ? `activities/${activityId}/policy-impacts`
      : "schedule/policy-holds",
  );
  if (!read.loading && !read.error && !read.data?.items.length) return null;
  return (
    <section aria-label="Published scheduling impacts">
      <h2>Published scheduling impacts</h2>
      <ReadState {...read} retry={read.reload} />
      {!read.loading &&
        !read.error &&
        read.data?.items.map((a) => (
          <article key={a.appointment_id}>
            <h3>
              <Link href={`/service/appointments/${a.appointment_id}`}>
                {a.reference} · Review booking
              </Link>
            </h3>
            {a.impacts.map((i) => (
              <div key={i.impact_id}>
                <p>
                  <strong>
                    {i.held ? "Start held" : "Impact history"} · {i.disposition}
                  </strong>{" "}
                  · {i.reason}
                </p>
                <p>Responsible owner: {i.owner_name}</p>
                <p className="record-id">
                  Source publication: {i.publication_id}
                </p>
                <p>{i.next_action}</p>
              </div>
            ))}
            <p>
              Completing an Activity or acknowledging a pack does not resolve a
              policy impact.
            </p>
          </article>
        ))}
    </section>
  );
}
