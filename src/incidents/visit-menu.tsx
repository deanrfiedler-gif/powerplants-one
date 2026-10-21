"use client";
import Link from "next/link";
import { useState } from "react";
import { WorklistMenu } from "../components/crm-worklist-tools";
import { useCrmResource } from "../components/crm-state";
import { ReadState } from "../components/business-ui";

/** Q1: read current reporting authority only when this visit's More menu is used. */
export function IncidentVisitMenu({
  appointmentId,
}: {
  appointmentId: string;
}) {
  const [requested, setRequested] = useState(false);
  const r = useCrmResource<{
    can_report: boolean;
    targets: {
      scope_item_id: string;
      asset_id: string;
      task_description: string;
      display_name: string;
    }[];
  }>(
    requested
      ? `service/incidents/context?appointment_id=${appointmentId}`
      : null,
    true,
  );
  return (
    <span
      onClickCapture={() => setRequested(true)}
      onKeyDownCapture={() => setRequested(true)}
    >
      <WorklistMenu label="Visit more actions" icon="more" choices>
        <ReadState loading={r.loading} error={r.error} retry={r.reload} />
        {r.data?.can_report &&
          r.data.targets.map((t) => (
            <Link
              key={`${t.scope_item_id}:${t.asset_id}`}
              role="menuitem"
              data-menu-close
              href={`/service/incidents/new?appointment_id=${appointmentId}&scope_item_id=${t.scope_item_id}&asset_id=${t.asset_id}`}
            >
              Report an incident
              {r.data!.targets.length > 1
                ? ` · ${t.task_description} · ${t.display_name}`
                : ""}
            </Link>
          ))}
        {r.data && (!r.data.can_report || !r.data.targets.length) && (
          <p>
            Incident reporting is unavailable for this visit under your current
            access.
          </p>
        )}
      </WorklistMenu>
    </span>
  );
}
