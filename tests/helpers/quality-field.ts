import type { Page } from "@playwright/test";
import { prepareFieldAppointment } from "./field-http";
import { base, startInput } from "./field";
import { call } from "./quality-browser";

// Each state proof owns a real, started visit; no preceding test supplies it.
export async function qualityFieldVisit(page: Page, day: string) {
  await call(page, "local-session", { profile: "coordinator" });
  const setup = await prepareFieldAppointment((path, body) => call(page, path, body), day);
  for (const profile of ["assigned-technician", "second-technician"]) {
    const actor = await call(page, "local-session", { profile });
    const recipient = setup.pack.readiness.recipients.find((r: { user_id: string }) => r.user_id === actor.actor_id);
    await call(page, `pack-issues/${setup.pack.current_issue_id}/acknowledge`, {
      ...base(), assignment_id: recipient.assignment_id, assignment_version: recipient.assignment_version,
      presented_hash: setup.pack.issues[0].output_hash, captured_at: new Date().toISOString(),
    });
  }
  const principal = await call(page, "local-session", { profile: "assigned-technician" });
  let job = (await call(page, `my-jobs/${setup.appointment_id}`)).items[0];
  await call(page, `appointments/${job.id}/start`, startInput(job));
  job = (await call(page, `my-jobs/${job.id}`)).items[0];
  return { principal, job };
}
