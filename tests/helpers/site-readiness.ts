import { randomUUID } from "node:crypto";
import { siteChecks } from "../../src/scheduling/site-readiness-model";
import {
  addDays,
  localDateTime,
  utcFromLocal,
} from "../../src/scheduling/time";
import { base, id } from "./packs";

// ADR-0030: only this new fixture moves with the server date. Issued/historical
// fixtures keep their original dates and policy pins; there is no application clock override.
export function nextWorkingVisit() {
  let day = addDays(
    localDateTime(new Date().toISOString(), "Australia/Brisbane").slice(0, 10),
    1,
  );
  while ([0, 6].includes(new Date(`${day}T12:00:00Z`).getUTCDay()))
    day = addDays(day, 1);
  return utcFromLocal(`${day}T10:00`, "Australia/Brisbane");
}
export function siteContactInput(version: number) {
  return {
    ...base(),
    id: randomUUID(),
    expected_version: version,
    recipient_id: id("60"),
    purpose: "SiteReadiness",
    site_checks: siteChecks(
      Object.fromEntries(
        ["access", "power_water", "equipment", "isolation"].map((key) => [
          key,
          { status: "Confirmed" },
        ]),
      ),
    ),
    channel: "Simulated",
    outcome: "Confirmed",
    occurred_at: new Date().toISOString(),
  };
}
