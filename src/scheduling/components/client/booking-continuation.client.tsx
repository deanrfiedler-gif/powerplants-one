"use client";
import Link from "next/link";
import { useResource, ReadState, type Envelope } from "../../../components/business-ui";
import { localDateTime } from "../../time";
import { plannerHref, safePlannerReturn } from "../../navigation";
import { BookingRecovery, useBookingCommand } from "./booking-recovery.client";
export function showAppointmentDates(a: { start_at: string; site_timezone: string; site_id: string }, returnTo: string) {
  // The planner supports three display zones; other site zones use UTC, while
  // appointment entry/detail still use the site's exact IANA zone.
  const zone = ["Australia/Brisbane", "Australia/Melbourne", "UTC"].includes(a.site_timezone) ? a.site_timezone : "UTC";
  return plannerHref({ day: localDateTime(a.start_at, zone).slice(0, 10), mode: "week", zone, site: a.site_id, resource: "", status: "" }) + "&returnTo=" + encodeURIComponent(safePlannerReturn(returnTo));
}
export function BookingContinuation() {
  const command = useBookingCommand();
  const target = command.accepted?.entry.target;
  const id = target?.split("?")[0].split("/").pop();
  const record = useResource<Envelope<{ start_at: string; site_timezone: string; site_id: string }>>(id ? `appointments/${id}` : null);
  const a = record.data?.items[0];
  return <div className="pl01-continuation">
    <BookingRecovery command={command} />
    {target && <><ReadState {...record} retry={record.reload} />
      <p>The saved appointment remains reachable even outside the current dates or filters. {a && !record.error && <Link href={showAppointmentDates(a, new URLSearchParams(target.split("?")[1]).get("returnTo") ?? "/schedule")}>Show its dates</Link>}</p>
      {!!record.error && <p>The save was accepted; only refreshing the appointment failed. Retry the read or use View appointment above.</p>}
    </>}
  </div>;
}
