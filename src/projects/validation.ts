import {
  common,
  commonKeys,
  object,
  uuid,
  label,
  optionalId,
  optionalNarrative,
  dateOnly,
  version,
  invalid,
  choice,
} from "../shared/validation";
import { phases, statuses, type Task } from "./model";
const optionalDate = (v: unknown, field: string) => {
  if (v === null || v === undefined) return null;
  const date = dateOnly(v, field);
  if (date < "0001-01-01" || date > "9998-12-31")
    invalid(field, "Enter a date between years 0001 and 9998.");
  return date;
};
export function parseProject(value: unknown) {
  const p = object(value, [
    ...commonKeys,
    "id",
    "title",
    "company_id",
    "organisation_id",
    "site_id",
    "coordinator_id",
    "target_date",
  ]);
  return {
    ...common(p),
    id: uuid(p.id, "id"),
    title: label(p.title, "title", 200),
    company_id: uuid(p.company_id, "company_id"),
    organisation_id: uuid(p.organisation_id, "organisation_id"),
    site_id: uuid(p.site_id, "site_id"),
    coordinator_id: uuid(p.coordinator_id, "coordinator_id"),
    target_date: optionalDate(p.target_date, "target_date"),
  };
}
export function parseTask(projectId: string, value: unknown) {
  const p = object(value, [
    ...commonKeys,
    "id",
    "expected_version",
    "title",
    "phase",
    "status",
    "milestone",
    "start_date",
    "finish_date",
    "progress",
    "note",
    "owner_id",
    "external_owner_id",
    "dependencies",
  ]);
  const start_date = optionalDate(p.start_date, "start_date"),
    finish_date = optionalDate(p.finish_date, "finish_date");
  if (
    !!start_date !== !!finish_date ||
    (start_date && finish_date && finish_date < start_date)
  )
    invalid(
      "finish_date",
      "Enter both dates with finish on or after start, or leave both unscheduled.",
    );
  if (typeof p.milestone !== "boolean")
    invalid("milestone", "Choose task or milestone.");
  if (
    !Number.isInteger(p.progress) ||
    Number(p.progress) < 0 ||
    Number(p.progress) > 100
  )
    invalid("progress", "Enter a whole percentage from 0 to 100.");
  const status = choice(p.status, "status", statuses),
    progress = Number(p.progress);
  if (
    (status === "Complete") !== (progress === 100) ||
    (status === "Planned" && progress !== 0)
  )
    invalid(
      "progress",
      "Complete items require 100%; planned items require 0%.",
    );
  if (
    p.milestone &&
    (start_date !== finish_date ||
      ![0, 100].includes(progress) ||
      status === "InProgress")
  )
    invalid(
      "milestone",
      "Milestones have one date and are either 0% or 100% complete.",
    );
  const owner_id = optionalId(p.owner_id, "owner_id"),
    external_owner_id = optionalId(p.external_owner_id, "external_owner_id"),
    id = uuid(p.id, "id");
  if (owner_id && external_owner_id)
    invalid("owner_id", "Choose one internal or external owner.");
  if (!Array.isArray(p.dependencies) || p.dependencies.length > 50)
    invalid("dependencies", "Choose up to 50 predecessors.");
  const dependencies = p.dependencies
    .map((v) => {
      const d = object(v, ["task_id", "kind"]);
      return {
        task_id: uuid(d.task_id, "dependencies"),
        kind: choice(d.kind, "dependencies", ["FS", "SS"] as const),
      };
    })
    .sort((a, b) => a.task_id.localeCompare(b.task_id));
  if (
    dependencies.some((d) => d.task_id === id) ||
    new Set(dependencies.map((d) => d.task_id)).size !== dependencies.length
  )
    invalid(
      "dependencies",
      "Each predecessor must be distinct and cannot be the task itself.",
    );
  const task: Omit<Task, "version" | "owner_name"> = {
    id,
    title: label(p.title, "title", 200),
    phase: choice(p.phase, "phase", phases),
    status,
    milestone: p.milestone,
    start_date,
    finish_date,
    progress,
    note: optionalNarrative(p.note, "note", 2000),
    owner_id,
    external_owner_id,
    dependencies,
  };
  return {
    ...common(p),
    project_id: uuid(projectId, "project_id"),
    expected_version: version(p.expected_version),
    ...task,
  };
}
