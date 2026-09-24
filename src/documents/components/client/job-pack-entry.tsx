"use client";
import { ReadState, useResource } from "../../../components/business-ui";
import { Button, ButtonLink } from "../../../components/ui/button";
import { readableValue } from "../../pack-view";

type AppointmentPack = {
  pack: {
    id: string;
    display_number: string;
    status: string;
    needs_review: boolean;
  } | null;
  can_prepare: boolean;
};

// One canonical handover shared by the appointment and Field Technicians drawer.
// A stale, failed or denied read never leaves a previous record link actionable.
export function JobPackEntry({ appointmentId }: { appointmentId: string }) {
  const read = useResource<AppointmentPack>(
    `appointments/${appointmentId}/pack`,
  );
  const current = !read.loading && !read.error ? read.data : null;
  return (
    <section className="job-pack-entry" aria-label="Visit job pack">
      <ReadState {...read} retry={read.reload} />
      {current && (
        <>
          {current.pack ? (
            <>
              <p>
                {current.pack.display_number} ·{" "}
                {readableValue(current.pack.status)}
                {current.pack.needs_review ? " · Review needed" : ""}
              </p>
              <ButtonLink href={`/service/packs/${current.pack.id}`}>
                Open job pack
              </ButtonLink>
            </>
          ) : current.can_prepare ? (
            <>
              <p>
                No visible pack. Preparation checks the current visit and
                approved scope when saved.
              </p>
              <ButtonLink
                href={`/service/packs/new?appointment_id=${appointmentId}`}
              >
                Prepare job pack
              </ButtonLink>
            </>
          ) : (
            <p>
              No job pack is available to this identity. Ask the service
              coordinator to review preparation.
            </p>
          )}
          <Button variant="quiet" onClick={read.reload}>
            Refresh pack status
          </Button>
        </>
      )}
    </section>
  );
}
