export type ReportRegisterRow = {
  id: string;
  reference: string;
  revision: number;
  status: string;
  appointment_reference: string;
  updated_at: string;
  title: string;
  outcome: string;
  technician_id: string;
  technician: string;
  attendance_start: string | null;
  attendance_end: string | null;
  customer_id: string;
  customer: string;
  site: string;
  work_order_reference: string;
  mine: boolean;
  response: string | null;
  remaining_open: number;
  returned_entries: number;
};

export const reportQueues = [
  { id: "all", label: "All reports", icon: "list" },
  { id: "mine", label: "My reviews", icon: "person" },
  { id: "review", label: "To review", icon: "inbox", group: "Review" },
  { id: "returned", label: "Returned to technician", icon: "changes" },
  { id: "ready", label: "Ready to issue", icon: "converted" },
  {
    id: "awaiting",
    label: "Awaiting response",
    icon: "clock",
    group: "After issue",
  },
  { id: "response", label: "Response not accepted", icon: "warning" },
  { id: "remaining", label: "Remaining work open", icon: "work" },
] as const;
export type ReportQueue = (typeof reportQueues)[number]["id"];

export function inReportQueue(row: ReportRegisterRow, queue: string) {
  switch (queue) {
    case "mine":
      return row.mine;
    case "review":
      return row.status === "Submitted";
    case "returned":
      return row.status === "Returned";
    case "ready":
      return row.status === "Reviewed";
    case "awaiting":
      return row.status === "Issued" && row.response === null;
    case "response":
      return (
        row.status === "Issued" &&
        row.response !== null &&
        row.response !== "Accepted"
      );
    case "remaining":
      return row.remaining_open > 0;
    default:
      return true;
  }
}

export function reportAttention(row: ReportRegisterRow) {
  if (row.status === "Returned")
    return `${row.returned_entries} entries returned`;
  if (row.status === "Submitted") return "Waiting for review";
  if (row.status === "Reviewed") return "Ready to issue";
  if (row.status === "Issued" && row.response && row.response !== "Accepted")
    return `Response: ${row.response === "AcceptedWithReservations" ? "reservations" : row.response.toLowerCase()}`;
  if (row.remaining_open) return "Remaining work open";
  if (row.status === "Issued" && !row.response) return "Awaiting response";
  return "No attention needed";
}

export function reportCsv(rows: ReportRegisterRow[]) {
  const cell = (value: unknown) => {
    const text = String(value ?? "");
    return `"${(/^[\t\r\n]|^\s*[=+@-]/.test(text) ? "'" + text : text).replaceAll('"', '""')}"`;
  };
  const fields: (keyof ReportRegisterRow)[] = [
    "reference",
    "title",
    "status",
    "outcome",
    "technician",
    "attendance_start",
    "customer",
    "site",
    "response",
    "remaining_open",
    "work_order_reference",
    "revision",
    "updated_at",
  ];
  return [
    fields.join(","),
    ...rows.map((row) => fields.map((key) => cell(row[key])).join(",")),
  ].join("\r\n");
}
