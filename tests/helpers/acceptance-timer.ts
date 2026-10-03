import { expect, type Page, type TestInfo } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { call } from "./quality-browser";
import { committed } from "./quality-prepare";

// An actual elapsed minute on the original attendance. Finance's existing
// WholeMinutes contract forbids rounding seconds to make a handoff pass.
export async function originalMinute(page: Page, info: TestInfo, aid: string) {
  const job = (await call(page, `my-jobs/${aid}`)).items[0];
  await page.getByRole("button", { name: "Start work", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Start work", exact: true });
  await dialog
    .getByLabel("Affected equipment")
    .selectOption(job.scope.items[0].assets[0].id);
  await committed(page, `my-jobs/${aid}/timer`, () =>
    dialog.getByRole("button", { name: "Start work", exact: true }).click(),
  );
  const running = await call(page, `my-jobs/${aid}/timer`);
  expect(running.timer.state).toBe("Running");
  const end = Date.parse(running.timer.open_since) + 60000;
  // Fixture duration, not an assertion retry or business-benefit timing.
  while (Date.now() < end)
    await new Promise((resolve) =>
      setTimeout(resolve, Math.min(1000, end - Date.now())),
    );
  const stop = {
    schema_version: 1,
    operation_id: randomUUID(),
    reason:
      "SYN original attendance: one actual measured minute, captured at its exact end; no rounding or booking-derived time.",
    attendance_id: job.attendance.id,
    expected_version: running.timer.version,
    action: "Stop",
    occurred_at: new Date(end).toISOString(),
  };
  const receipt = await call(page, `my-jobs/${aid}/timer`, stop);
  const saved = await call(page, `my-jobs/${aid}/timer`);
  expect(saved.timer.state).toBe("Stopped");
  expect(saved.events).toHaveLength(2);
  const entry = (await call(page, `my-jobs/${aid}`)).items[0].entries.find(
    (e: { kind: string; payload: { elapsed_seconds?: number } }) =>
      e.kind === "Time" && e.payload.elapsed_seconds === 60,
  );
  expect(entry).toBeTruthy();
  await writeFile(
    info.outputPath("original-timer.json"),
    JSON.stringify(
      { stop, receipt, saved, entry_id: entry.id, elapsed_seconds: 60 },
      null,
      2,
    ),
  );
  await page.reload();
  return entry.id as string;
}
