import {
  common,
  commonKeys,
  dateOnly,
  invalid,
  label,
  object,
  uuid,
  version,
} from "../shared/validation";
function projectDate(value: unknown, field: string) {
  const date = dateOnly(value, field);
  if (date < "0001-01-01" || date > "9998-12-31")
    invalid(field, "Enter a date between years 0001 and 9998.");
  return date;
}
export function revision(value: unknown, field: string, zero = true) {
  if (
    !Number.isSafeInteger(value) ||
    Number(value) < (zero ? 0 : 1) ||
    Number(value) > 2147483646
  )
    invalid(field, "Use a valid revision number.");
  return Number(value);
}
export function parseCalendar(projectId: string, input: unknown) {
  const b = object(input, [
    ...commonKeys,
    "expected_version",
    "expected_revision",
    "name",
    "weekdays",
    "exceptions",
    "reviewed",
  ]);
  if (b.reviewed !== true)
    invalid(
      "reviewed",
      "Review the calendar and schedule consequences before saving.",
    );
  if (
    !Array.isArray(b.weekdays) ||
    !b.weekdays.length ||
    b.weekdays.length > 7 ||
    b.weekdays.some((n) => !Number.isInteger(n) || n < 1 || n > 7) ||
    new Set(b.weekdays).size !== b.weekdays.length
  )
    invalid(
      "weekdays",
      "Choose unique ISO weekdays from 1 (Monday) to 7 (Sunday).",
    );
  if (!Array.isArray(b.exceptions) || b.exceptions.length > 366)
    invalid(
      "exceptions",
      "Supply up to 366 dated working/nonworking exceptions.",
    );
  const exceptions = b.exceptions
    .map((value) => {
      const e = object(value, ["date", "working", "reason"]);
      if (typeof e.working !== "boolean")
        invalid("working", "State whether the date is working.");
      return {
        date: projectDate(e.date, "date"),
        working: e.working,
        reason: label(e.reason, "reason", 200),
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
  if (new Set(exceptions.map((e) => e.date)).size !== exceptions.length)
    invalid("exceptions", "Each date may have only one exception.");
  return {
    ...common(b),
    project_id: uuid(projectId, "project_id"),
    expected_version: version(b.expected_version),
    expected_revision: revision(b.expected_revision, "expected_revision"),
    name: label(b.name, "name", 120),
    weekdays: [...b.weekdays].sort((a, b) => a - b) as number[],
    exceptions,
    reviewed: true,
  };
}
export function parseActuals(
  projectId: string,
  taskId: string,
  input: unknown,
) {
  const b = object(input, [
    ...commonKeys,
    "expected_version",
    "expected_task_version",
    "expected_revision",
    "actual_start",
    "actual_finish",
  ]);
  const actual_start =
      b.actual_start === null
        ? null
        : projectDate(b.actual_start, "actual_start"),
    actual_finish =
      b.actual_finish === null
        ? null
        : projectDate(b.actual_finish, "actual_finish");
  if (actual_finish && (!actual_start || actual_finish < actual_start))
    invalid(
      "actual_finish",
      "Finish requires an actual start on or before it.",
    );
  return {
    ...common(b),
    project_id: uuid(projectId, "project_id"),
    task_id: uuid(taskId, "task_id"),
    expected_version: version(b.expected_version),
    expected_task_version: version(b.expected_task_version),
    expected_revision: revision(b.expected_revision, "expected_revision"),
    actual_start,
    actual_finish,
  };
}
