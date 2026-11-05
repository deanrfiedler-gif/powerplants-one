import { utcFromLocal } from "./time";

// D5 presentation only. P4 remains the server's authority for the saved move.
export function moveNeedsSiteReadiness(
  basis: { preparation?: unknown; start_at: string; end_at: string; site_timezone: string },
  proposedStart: string,
  proposedEnd: string,
) {
  if (basis.preparation == null) return false;
  try {
    const start = Date.parse(utcFromLocal(proposedStart, basis.site_timezone));
    const end = Date.parse(utcFromLocal(proposedEnd, basis.site_timezone));
    return start !== Date.parse(basis.start_at) || end !== Date.parse(basis.end_at);
  } catch {
    // An incomplete local time is not yet a proposed interval.
    return false;
  }
}
