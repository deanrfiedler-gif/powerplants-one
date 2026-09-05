import {
  common,
  commonKeys,
  object,
  instant,
  invalid,
  uuid,
  version,
  narrative,
  choice,
} from "../shared/validation";
export const crewRoles = ["Lead", "Technician", "Specialist"] as const;
export const SCHEDULING_POLICY_ID = "a0000000-0000-4000-8000-000000000001";
export function integer(v: unknown, field: string, max = 1440) {
  if (!Number.isSafeInteger(v) || Number(v) < 0 || Number(v) > max)
    invalid(field, `Enter an explicit whole number from 0 to ${max}.`);
  return Number(v);
}
export function interval(start: unknown, end: unknown) {
  const start_at = instant(start, "start_at"),
    end_at = instant(end, "end_at");
  if (end_at <= start_at) invalid("end_at", "Finish must follow start.");
  return { start_at, end_at };
}
export function crewFields(input: unknown) {
  if (!Array.isArray(input) || input.length < 1 || input.length > 6)
    invalid("crew", "Choose 1–6 explicit crew members.");
  const crew = input
    .map((v) => {
      const r = object(v, [
        "resource_id",
        "resource_version",
        "calendar_version",
        "crew_role",
        "travel_before_minutes",
        "travel_after_minutes",
        "travel_reason",
      ]);
      return {
        resource_id: uuid(r.resource_id, "resource_id"),
        resource_version: version(r.resource_version),
        calendar_version: version(r.calendar_version),
        crew_role: choice(r.crew_role, "crew_role", crewRoles),
        travel_before_minutes: integer(
          r.travel_before_minutes,
          "travel_before_minutes",
        ),
        travel_after_minutes: integer(
          r.travel_after_minutes,
          "travel_after_minutes",
        ),
        travel_reason: narrative(r.travel_reason, "travel_reason", 1000),
      };
    })
    .sort((a, b) => a.resource_id.localeCompare(b.resource_id));
  if (new Set(crew.map((x) => x.resource_id)).size !== crew.length)
    invalid("crew", "Choose each resource once.");
  if (crew.filter((x) => x.crew_role === "Lead").length !== 1)
    invalid("crew", "Choose exactly one lead technician.");
  return crew;
}
export type CrewInput = ReturnType<typeof crewFields>;
export const bookingKeys = [
  "expected_version",
  "expected_work_order_version",
  "expected_assignment_version",
  "scope_revision_id",
  "scope_version",
  "policy_version_id",
  "scheduling_policy_id",
  "scheduling_policy_version",
  "crew",
];
export function bookingFields(r: Record<string, unknown>) {
  return {
    expected_version: version(r.expected_version),
    expected_work_order_version: version(r.expected_work_order_version),
    expected_assignment_version: version(r.expected_assignment_version),
    scope_revision_id: uuid(r.scope_revision_id, "scope_revision_id"),
    scope_version: version(r.scope_version),
    policy_version_id: uuid(r.policy_version_id, "policy_version_id"),
    scheduling_policy_id: uuid(r.scheduling_policy_id, "scheduling_policy_id"),
    scheduling_policy_version: version(r.scheduling_policy_version),
    crew: crewFields(r.crew),
  };
}
export type BookingInput = ReturnType<typeof bookingFields> & {
  start_at: string;
  end_at: string;
  reason: string;
};
export function bookingCommand(id: string, input: unknown, move: boolean) {
  const r = object(input, [
    ...commonKeys,
    ...bookingKeys,
    ...(move ? ["start_at", "end_at"] : []),
  ]);
  return {
    ...common(r),
    appointment_id: uuid(id, "appointment_id"),
    ...bookingFields(r),
    ...(move ? interval(r.start_at, r.end_at) : {}),
  };
}
export function sameVersion(
  actual: number,
  expected: number,
  field = "record",
) {
  if (actual !== expected) {
    // Imported below to keep the common error envelope consistent.
    throw new AppError(
      409,
      "VersionConflict",
      `This ${field} changed. Keep your proposal and review the saved version.`,
    );
  }
}
import { AppError } from "../platform/errors";
export function timezone(value: unknown) {
  if (typeof value !== "string" || value.length > 80)
    invalid("timezone", "Choose an IANA display timezone.");
  try {
    new Intl.DateTimeFormat("en-AU", { timeZone: value }).format();
  } catch {
    invalid("timezone", "Choose a valid IANA display timezone.");
  }
  return value;
}
