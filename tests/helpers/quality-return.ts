import { expect, type Page, type TestInfo } from "@playwright/test";
import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { call, capture, identity } from "./quality-browser";
import {
  committed,
  contact,
  issuePack,
  readiness,
  savePreparation,
} from "./quality-prepare";
import { submit, review, issue } from "./quality-report";
import { png } from "./field";

export type ReturnSource = {
  work_order_id: string;
  appointment_id: string;
  old_issue_id: string;
  current_issue_id: string;
  report_id: string;
  presentation: { id: string };
  return_proposal: { record_id: string };
  finance: { handoff_id: string; issue: { id: string } };
};

// Continue the actual proposal from this same service/Finance journey. Every
// mutation uses a rendered control; API reads establish exact persisted facts.
export async function prepareReturnVisit(
  page: Page,
  info: TestInfo,
  source: ReturnSource,
) {
  let aid = source.return_proposal.record_id;
  await identity(page, "coordinator");
  const before = (await call(page, `appointments/${aid}`)).items[0];
  expect(before.status).toBe("Proposed");
  expect(before.assignments).toEqual([]);
  expect(before.customer_commitment).toBe("Unknown");
  const historicReport = (await call(page, `reports/${source.report_id}`))
    .items[0];
  const servicePaths = [
    ...[source.old_issue_id, source.current_issue_id].flatMap((id) =>
      ["html", "pdf", "manifest"].map((f) => `pack-issues/${id}/${f}`),
    ),
    ...["html", "pdf", "manifest"].map(
      (f) =>
        `reports/${source.report_id}/${f}?presentation_id=${source.presentation.id}`,
    ),
  ];
  const priorService = await exactOutputs(page, servicePaths);
  await identity(page, "finance-reconciler");
  const priorFinance = await call(
    page,
    `finance/handoffs/${source.finance.handoff_id}`,
  );
  const financePaths = ["html", "pdf"].map(
    (f) => `finance/issues/${source.finance.issue.id}/bytes?format=${f}`,
  );
  const priorFinanceBytes = await exactOutputs(page, financePaths);
  await identity(page, "coordinator");

  // The earlier reservation created a preparation-Unknown proposal. A readiness
  // decision does not edit its preparation state. Exercise the documented
  // controlled replacement, retaining the original rather than patching it.
  expect(before.preparation_status).toBe("Unknown");
  await page.goto(`/service/appointments/${aid}`);
  await page
    .getByRole("button", { name: "Cancel appointment", exact: true })
    .click();
  await page
    .getByLabel("Cancellation reason")
    .fill(
      `SYN replace unprepared return proposal ${aid} on the same work order with an explicitly owned preparation plan. Preserve the original history; no customer message sent.`,
    );
  await committed(page, `appointments/${aid}/cancel`, () =>
    page
      .getByRole("button", { name: "Cancel future appointment", exact: true })
      .click(),
  );
  expect((await call(page, `appointments/${aid}`)).items[0].status).toBe(
    "Cancelled",
  );
  await page.goto(`/service/work-orders/${source.work_order_id}`);
  await page.getByText("Propose a visit", { exact: true }).click();
  await page
    .getByLabel("Proposed start (device timezone)")
    .fill(new Date(before.start_at).toISOString().slice(0, 16));
  await page
    .getByLabel("Proposed finish (device timezone)")
    .fill(new Date(before.end_at).toISOString().slice(0, 16));
  await page
    .getByLabel("Preparation state", { exact: true })
    .selectOption("Preparing");
  const replacement = await committed(
    page,
    `service/work-orders/${source.work_order_id}/visits`,
    () =>
      page
        .getByRole("button", { name: "Save proposed visit", exact: true })
        .click(),
  );
  aid = replacement.record_id;

  await page.goto(`/service/work-orders/${source.work_order_id}`);
  const visit = page.locator(`#visit-${aid}`);
  await visit
    .getByText("Review proposed visit preparation", { exact: true })
    .click();
  await readiness(
    page,
    source.work_order_id,
    visit.locator("details"),
    "ToolPreparation",
  );
  await page.goto(`/service/appointments/${aid}`);
  await contact(page, aid, "Confirmed");
  await page
    .getByRole("button", { name: "Confirm appointment", exact: true })
    .click();
  const booking = page.getByRole("region", {
    name: "Confirm appointment",
    exact: true,
  });
  for (const [i, n] of [9, 2].entries()) {
    if (i)
      await booking
        .getByRole("button", { name: "Add crew member", exact: true })
        .click();
    await booking
      .getByLabel(`Resource ${i + 1}`, { exact: true })
      .selectOption(`a4000000-0000-4000-8000-${String(n).padStart(12, "0")}`);
    await booking
      .getByLabel(`Travel before ${i + 1} (minutes)`, { exact: true })
      .fill("0");
    await booking
      .getByLabel(`Travel after ${i + 1} (minutes)`, { exact: true })
      .fill("0");
    await booking
      .getByLabel(`Travel basis ${i + 1}`, { exact: true })
      .fill(
        "SYN return to the same fictional site; explicit zero planning allowance, no actual time inferred.",
      );
  }
  await booking
    .getByLabel("Booking reason", { exact: true })
    .fill(
      "SYN independently confirm the owned return proposal within the unchanged authorised visual scope.",
    );
  await committed(page, `appointments/${aid}/confirm`, () =>
    booking
      .getByRole("button", { name: "Confirm booking", exact: true })
      .click(),
  );
  const confirmed = (await call(page, `appointments/${aid}`)).items[0];
  expect(
    confirmed.assignments.filter((a: { active: boolean }) => a.active),
  ).toHaveLength(2);
  expect(confirmed.work_order_id).toBe(source.work_order_id);
  expect(confirmed.scope_revision_id).toBe(before.scope_revision_id);
  await page.goto(`/service/packs/new?appointment_id=${aid}`);
  await page.getByRole("checkbox", { name: /SYN visual inspection/ }).check();
  for (const k of [
    "identification",
    "customer_arrangements",
    "scope",
    "equipment",
    "history",
    "technical_information",
    "readiness",
    "site_controls",
    "completion",
  ])
    await page
      .locator(`#section-${k}`)
      .fill(
        `SYN return visit ${k}: review the earlier failed label reading and retained correction. Repeat both authorised external visual checks only, after the fictional condensation clears. No enclosure access, repair, shutdown or financial approval. Preserve the original reservation and record fresh outcomes.`,
      );
  await savePreparation(
    page,
    "SYN independently prepare the return visit from the same authorised scope and retained first-visit history.",
  );
  await expect(page).toHaveURL(/\/service\/packs\/[a-f0-9-]{36}$/);
  const pid = page.url().split("/").at(-1)!;
  await issuePack(page, pid);
  const pack = (await call(page, `packs/${pid}`)).items[0];
  expect(pack.current_issue_id).not.toBe(source.current_issue_id);
  for (const profile of ["assigned-technician", "second-technician"]) {
    await identity(page, profile);
    await page.goto(`/documents/${pack.current_issue_id}`);
    await expect(
      page.getByText("Current applicable issue", { exact: true }),
    ).toBeVisible();
    await openReturnJob(page, aid);
    const acknowledge = page.getByRole("button", {
      name: "I have read and acknowledge this exact pack",
      exact: true,
    });
    // Scrolling past the timer changes the sticky header's height. Finish that
    // observed transition before a pointer click; the first combined replay
    // clicked during compaction and dispatched no acknowledgement request.
    await acknowledge.scrollIntoViewIfNeeded();
    await expect(page.locator("#ppo-work-timer .head")).toHaveAttribute(
      "data-compact",
      "1",
    );
    await committed(
      page,
      `pack-issues/${pack.current_issue_id}/acknowledge`,
      () => acknowledge.click(),
    );
  }
  return {
    aid,
    pid,
    pack,
    historicReport,
    servicePaths,
    priorService,
    priorFinance,
    financePaths,
    priorFinanceBytes,
  };
}
export type PreparedReturn = Awaited<ReturnType<typeof prepareReturnVisit>>;
export async function completeReturnVisit(
  page: Page,
  info: TestInfo,
  source: ReturnSource,
  saved: PreparedReturn,
) {
  const {
    aid,
    pid,
    pack,
    historicReport,
    servicePaths,
    priorService,
    priorFinance,
    financePaths,
    priorFinanceBytes,
  } = saved;
  // The other technician performs this return; first-visit attendance is never
  // copied, borrowed from a crew acknowledgement or inferred from the booking.
  await openReturnJob(page, aid);
  await page
    .getByLabel("Start context", { exact: true })
    .fill(
      "SYN actual second-technician return after reviewing the first-visit failure and exact new pack. Retrospective synthetic demonstration; scheduled dates do not create attendance.",
    );
  await committed(page, `appointments/${aid}/start`, () =>
    page
      .getByRole("button", { name: "Record my actual start", exact: true })
      .click(),
  );
  await expect(
    page.getByText("Your actual start is server-saved.", { exact: true }),
  ).toBeVisible();
  const job = (await call(page, `my-jobs/${aid}`)).items[0];
  expect(job.entries).toEqual([]);
  expect(job.attendance.actor_id).toBe(
    (await call(page, "local-session")).actor_id,
  );
  // Arrival must refresh timer authority immediately, without manual refresh
  // or navigation and within the normal 5s assertion budget (poll is 15s).
  await expect(
    page.getByRole("button", { name: "Start work", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Start work", exact: true }).click();
  const timer = page.getByRole("dialog", { name: "Start work", exact: true });
  await timer
    .getByLabel("Affected equipment")
    .selectOption(job.scope.items[0].assets[0].id);
  await committed(page, `my-jobs/${aid}/timer`, () =>
    timer.getByRole("button", { name: "Start work", exact: true }).click(),
  );
  await expect(timer).toHaveCount(0);
  await page.getByRole("button", { name: "Photos", exact: true }).click();
  await page.getByLabel("Synthetic photo file").setInputFiles({
    name: "SYN-return-controls.png",
    mimeType: "image/png",
    buffer: png(),
  });
  await page
    .getByRole("button", { name: "1. Register photo", exact: true })
    .click();
  await page
    .getByRole("button", { name: "2. Upload original bytes", exact: true })
    .click();
  await page
    .getByRole("button", { name: "3. Verify and make available", exact: true })
    .click();
  await expect(
    page.getByText("Original bytes verified", { exact: false }),
  ).toBeVisible();
  const photo = (await call(page, `my-jobs/${aid}`)).items[0].attachments[0];
  expect(photo.status).toBe("Available");
  await page.getByRole("button", { name: "Capture", exact: true }).click();
  for (const [task, check] of [
    ...job.scope.items.map((t: { id: string }) => [t.id, "SYN-TASK-RESULT"]),
    [job.scope.items[0].id, "SYN-SITE-CONTROLS"],
  ]) {
    await page
      .getByLabel("Evidence type", { exact: true })
      .selectOption("Checklist");
    await page
      .getByLabel("Authorised task", { exact: true })
      .selectOption(task);
    await page
      .getByLabel("Affected asset", { exact: true })
      .selectOption(
        job.scope.items.find((t: { id: string }) => t.id === task).assets[0].id,
      );
    await page
      .getByLabel("Synthetic checklist item", { exact: true })
      .selectOption(check);
    await page
      .getByLabel("Checklist result", { exact: true })
      .selectOption("Pass");
    await page
      .getByLabel("Checklist reason", { exact: true })
      .fill(
        "SYN fresh external visual check completed on the return; fictional label now readable, no intervention or safety certification.",
      );
    if (check === "SYN-SITE-CONTROLS")
      await page
        .getByLabel("Supporting photo", { exact: true })
        .selectOption(photo.id);
    await page
      .getByLabel("Capture context", { exact: true })
      .fill(
        "SYN personal return-visit check, retained independently from the first visit.",
      );
    await committed(page, "field-entries", () =>
      page
        .getByRole("button", { name: "Save evidence online", exact: true })
        .click(),
    );
    await expect(
      page.getByLabel("Capture context", { exact: true }),
    ).toHaveValue("");
  }
  // Arrival rounds the earliest timer instant up to a whole second. A fast
  // fixture can otherwise Stop in that same second and correctly save no time.
  const running = (await call(page, `my-jobs/${aid}/timer`)).timer;
  expect(running.state).toBe("Running");
  const firstCapturedSecond = Date.parse(running.open_since) + 1000;
  expect(Number.isFinite(firstCapturedSecond)).toBe(true);
  await expect
    .poll(() => page.evaluate(() => Date.now()), {
      message: "Stop must follow a positive captured timer interval",
    })
    .toBeGreaterThanOrEqual(firstCapturedSecond);
  await committed(page, `my-jobs/${aid}/timer`, () =>
    page.getByRole("button", { name: "Stop work", exact: true }).click(),
  );
  await expect(
    page.getByRole("button", { name: "Resume work", exact: true }),
  ).toBeEnabled();
  await expect(
    page
      .getByRole("region", { name: "Time recorded", exact: true })
      .getByRole("row")
      .filter({ hasText: "Server saved" }),
  ).toHaveCount(1);
  const recordedTimes = (
    await call(page, `my-jobs/${aid}`)
  ).items[0].entries.filter(
    (e: { kind: string; actor_id: string }) =>
      e.kind === "Time" && e.actor_id === job.attendance.actor_id,
  );
  expect(recordedTimes).toHaveLength(1);
  expect(recordedTimes[0].payload.elapsed_seconds).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Completion", exact: true }).click();
  await page
    .getByLabel("Overall scope outcome", { exact: true })
    .selectOption("Complete");
  await page
    .getByLabel("Actual work performed", { exact: true })
    .fill(
      "SYN both authorised external visual checks repeated and completed on this return. Label now readable after fictional condensation cleared.",
    );
  await page
    .getByLabel("Exclusions and limits", { exact: true })
    .fill(
      "SYN no enclosure access, repair, commissioning, financial approval or equipment identity certification.",
    );
  await page
    .getByLabel("Remaining work and reasons", { exact: true })
    .fill(
      "SYN no remaining task within this visual-only scope. Earlier findings and customer reservation remain historically intact for Service review.",
    );
  await page
    .getByLabel("My time declaration", { exact: true })
    .selectOption("AllRecorded");
  await page
    .getByLabel("My material declaration", { exact: true })
    .selectOption("None");
  await page
    .getByLabel("Declaration explanation", { exact: true })
    .fill(
      "SYN this technician's actual timer interval is recorded; no materials used or inferred from booking.",
    );
  for (let i = 1; i <= job.scope.items.length; i++) {
    await page
      .getByLabel(`Task ${i} outcome`, { exact: true })
      .selectOption("Complete");
    await page
      .getByLabel(`Task ${i} explanation`, { exact: true })
      .fill(
        "SYN this external visual task passed the fresh return checklist; prior unsuccessful evidence is retained.",
      );
  }
  await committed(page, `appointments/${aid}/completion-draft`, () =>
    page
      .getByRole("button", { name: "Save completion draft", exact: true })
      .click(),
  );
  await expect(
    page.getByRole("heading", { name: /Saved completion draft v1/ }),
  ).toBeVisible();
  await submit(page);
  const rid = page.url().split("/").at(-1)!;
  expect(rid).not.toBe(source.report_id);
  await identity(page, "coordinator");
  await review(page);
  await issue(page);
  const report = (await call(page, `reports/${rid}`)).items[0];
  expect(report.appointment.status).toBe("Completed");
  expect(report.work_order.status).toBe("Authorised");
  expect(report.revisions[0].snapshot.completion.scope_outcome).toBe(
    "Complete",
  );
  expect(report.responses).toEqual([]); // Earlier customer acceptance is not inherited.
  const presentation = report.presentations.find(
    (p: { kind: string }) => p.kind === "IssuedReport",
  );
  const returnPaths = [
    ...["html", "pdf", "manifest"].map(
      (f) => `pack-issues/${pack.current_issue_id}/${f}`,
    ),
    ...["html", "pdf", "manifest"].map(
      (f) => `reports/${rid}/${f}?presentation_id=${presentation.id}`,
    ),
  ];
  const returnOutputs = await exactOutputs(page, returnPaths);
  expect(await exactOutputs(page, servicePaths)).toEqual(priorService);
  const old = (await call(page, `reports/${source.report_id}`)).items[0];
  for (const key of ["revisions", "responses", "reviews", "issues"])
    expect(old[key]).toEqual(historicReport[key]);
  await identity(page, "finance-reconciler");
  const finance = await call(
    page,
    `finance/handoffs/${source.finance.handoff_id}`,
  );
  expect(finance.handoff).toEqual(priorFinance.handoff);
  expect(finance.targets).toEqual(priorFinance.targets);
  expect(await exactOutputs(page, financePaths)).toEqual(priorFinanceBytes);
  // A later crew member can read the return evidence, but cannot edit another
  // person's attendance or see private review/Finance content.
  await identity(page, "assigned-technician");
  await openReturnJob(page, aid);
  const history = (await call(page, `my-jobs/${aid}`)).items[0];
  expect(history.attendance).toBeNull();
  const returnPhoto = await exactOutputs(page, [
    `attachments/${photo.id}/bytes`,
  ]);
  expect(returnPhoto[`attachments/${photo.id}/bytes`]).toBe(photo.sha256);
  expect(
    history.entries.filter((e: { kind: string }) => e.kind === "Checklist"),
  ).toHaveLength(job.scope.items.length + 1);
  expect(
    history.entries.filter((e: { kind: string }) => e.kind === "Time"),
  ).toHaveLength(1);
  await page
    .getByRole("heading", {
      name: "Saved evidence and corrections",
      exact: true,
    })
    .scrollIntoViewIfNeeded();
  await expect(
    page.getByRole("button", { name: /^Correct this .* entry$/ }),
  ).toHaveCount(0);
  await capture(page, info, "return-next-technician-history");
  await page.goto(`/service/reports/${rid}`);
  await expect(
    page.getByRole("heading", { name: /Revision 1 · Issued/ }),
  ).toBeVisible();
  await expect(
    page.getByText(/FINANCE_PRIVATE_CANARY|P11_PRIVATE_REVIEW_CANARY/),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Commit exact review", exact: true }),
  ).toHaveCount(0);
  const denied = await page.request.get(
    `/api/v1/finance/handoffs/${source.finance.handoff_id}`,
  );
  expect([403, 404]).toContain(denied.status());
  const evidence = {
    original_appointment_id: source.appointment_id,
    cancelled_proposal_id: source.return_proposal.record_id,
    work_order_id: source.work_order_id,
    appointment_id: aid,
    attendance_id: job.attendance.id,
    actor_id: job.attendance.actor_id,
    pack_id: pid,
    issue_id: pack.current_issue_id,
    report_id: rid,
    timer_interval: {
      entry_id: recordedTimes[0].id,
      start_at: recordedTimes[0].payload.start_at,
      end_at: recordedTimes[0].payload.end_at,
      elapsed_seconds: recordedTimes[0].payload.elapsed_seconds,
    },
    presentation,
    appointment_status: report.appointment.status,
    scope_outcome: report.revisions[0].snapshot.completion.scope_outcome,
    preserved_outputs: { ...priorService, ...priorFinanceBytes },
    return_outputs: returnOutputs,
    return_photo: returnPhoto,
    original_customer_response: old.responses[0].response,
    original_finance_status: finance.handoff.status,
    limits:
      "Synthetic return attendance completed and reviewed, with a separately issued report and no inherited customer response or financial outcome. Existing follow-up activities are not automatically closed. No policy/application update, backup restore, hosted deployment, owner/device acceptance or complete PT-28/PT-30 claim.",
  };
  await writeFile(
    info.outputPath("P11-return-visit.json"),
    JSON.stringify(evidence, null, 2),
  );
  return evidence;
}

async function openReturnJob(page: Page, aid: string) {
  // Both independent reads own the initial host readiness. Do not click the
  // first briefly rendered pack control while the timer host is refreshing.
  const responses = await Promise.all([
    ...[`/api/v1/my-jobs/${aid}`, `/api/v1/my-jobs/${aid}/timer`].map((path) =>
      page.waitForResponse(
        (r) =>
          new URL(r.url()).pathname === path && r.request().method() === "GET",
      ),
    ),
    page.goto(`/my-jobs/${aid}`),
  ]);
  for (const response of responses.slice(0, 2))
    expect(response!.ok()).toBe(true);
  await expect(
    page.getByText("Loading permitted records…", { exact: true }),
  ).toHaveCount(0);
}

async function exactOutputs(page: Page, paths: string[]) {
  const out: Record<string, string> = {};
  for (const path of paths) {
    const r = await page.request.get(`/api/v1/${path}`);
    expect(r.ok(), `${path}: ${r.ok() ? "" : await r.text()}`).toBe(true);
    expect(r.headers()["cache-control"]).toContain("no-store");
    out[path] = createHash("sha256")
      .update(await r.body())
      .digest("hex");
  }
  return out;
}
export async function returnVisit(
  page: Page,
  info: TestInfo,
  source: ReturnSource,
) {
  const saved = await prepareReturnVisit(page, info, source);
  return completeReturnVisit(page, info, source, saved);
}
