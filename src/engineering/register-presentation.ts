import type { engineeringRegister } from "./register";
import type { EngineeringPackage } from "./model";
export type EngineeringRegisterData = Awaited<
  ReturnType<typeof engineeringRegister>
>;
export type EngineeringRegisterRow = EngineeringRegisterData["items"][number];
export const engineeringViews = [
  { id: "all", label: "All packages", icon: "list" },
  { id: "mine", label: "My work", icon: "user" },
  { id: "author", label: "Author actions", icon: "list-check" },
  { id: "review", label: "Reviews assigned to me", icon: "badge-check" },
  { id: "released", label: "Released", icon: "circle-check" },
] as const;
export type EngineeringView = (typeof engineeringViews)[number]["id"];
export const engineeringSorts = [
  ["RequiredDate", "Required by"],
  ["Reference", "Reference"],
  ["Name", "Work package"],
  ["ActionDate", "Action due"],
  ["Updated", "Last updated"],
] as const;
export type EngineeringSort = (typeof engineeringSorts)[number][0];
export function continuationExpired(error: unknown) {
  const e = error as {
    code?: string;
    field_errors?: { field: string }[];
  } | null;
  return (
    e?.code === "ReadConflict" ||
    !!e?.field_errors?.some((f) => f.field === "cursor")
  );
}
type ExportRow = Pick<
  EngineeringPackage,
  | "display_number"
  | "title"
  | "customer_name"
  | "state"
  | "owner_name"
  | "required_date"
  | "next_action"
  | "action_due"
  | "discipline"
  | "context_reference"
  | "version"
>;
export function engineeringCsv(rows: ExportRow[]) {
  const cell = (value: string | null) => {
    const raw = value ?? "";
    // Spreadsheet formula prefixes are data, never executable formulae.
    const safe = /^[\s]*[=+@-]/.test(raw) ? "'" + raw : raw;
    return '"' + safe.replaceAll('"', '""') + '"';
  };
  return (
    [
      [
        "Reference",
        "Work package",
        "Customer",
        "Coordination status",
        "Engineer",
        "Required by",
        "Next action",
        "Action due",
        "Discipline",
        "Project or opportunity",
        "Record version",
      ],
      ...rows.map((r) => [
        r.display_number,
        r.title,
        r.customer_name,
        r.state,
        r.owner_name,
        r.required_date,
        r.next_action,
        r.action_due,
        r.discipline,
        r.context_reference,
        String(r.version),
      ]),
    ]
      .map((row) => row.map(cell).join(","))
      .join("\r\n") + "\r\n"
  );
}
