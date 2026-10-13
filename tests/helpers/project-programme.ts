import { crmBase } from "./crm";
export const calendarInput = (expected_version = 2, expected_revision = 0) => ({
  ...crmBase(),
  expected_version,
  expected_revision,
  name: "SYN reviewed site calendar",
  weekdays: [1, 2, 3, 4, 5],
  exceptions: [
    { date: "2026-09-15", working: false, reason: "SYN site closure" },
  ],
  reviewed: true,
});
export const actualInput = (expected_version = 3, expected_revision = 0) => ({
  ...crmBase(),
  expected_version,
  expected_revision,
  expected_task_version: 1,
  actual_start: "2026-09-14",
  actual_finish: "2026-09-18",
});
