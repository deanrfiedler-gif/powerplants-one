import { test, expect, type Page } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const id = (t: string, n = 1) =>
  `${t}000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const keys = [
  "identification",
  "customer_arrangements",
  "scope",
  "equipment",
  "history",
  "technical_information",
  "readiness",
  "site_controls",
  "completion",
];
const base = () => ({
  operation_id: crypto.randomUUID(),
  schema_version: 1,
  reason: "SYN P06 browser proof",
});
async function call(page: Page, path: string, body?: unknown) {
  const r = await page.request.fetch("/api/v1/" + path, {
    method: body ? "POST" : "GET",
    headers: body
      ? { Origin: "http://127.0.0.1:3000", "Content-Type": "application/json" }
      : {},
    data: body,
  });
  const data = await r.json();
  expect(r.ok(), JSON.stringify(data)).toBeTruthy();
  return data;
}
async function identity(page: Page, profile = "coordinator") {
  await page.getByLabel("Identity", { exact: true }).selectOption(profile);
  await page
    .getByRole("button", { name: "Use this identity", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Use this identity", exact: true }),
  ).toBeEnabled();
}
async function capture(
  page: Page,
  info: { outputPath: (s: string) => string },
  name: string,
) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("P06-" + name + ".png"),
    fullPage: true,
  });
}
async function appointment(page: Page, day: string) {
  const order = (await call(page, `service/work-orders/${id("a9")}`)).items[0],
    aid = crypto.randomUUID();
  await call(page, `service/work-orders/${order.id}/visits`, {
    ...base(),
    id: aid,
    expected_version: order.version,
    scope_revision_id: id("aa"),
    scope_version: 1,
    start_at: day + "T00:00:00Z",
    end_at: day + "T02:00:00Z",
    customer_commitment: "Proposed",
    preparation_status: "Preparing",
  });
  let a = (await call(page, `appointments/${aid}`)).items[0];
  await call(page, `service/work-orders/${order.id}/readiness`, {
    ...base(),
    expected_version: a.work_order_version,
    assessment: {
      scope_revision_id: id("aa"),
      scope_version: 1,
      appointment_id: aid,
      criterion_code: "ToolPreparation",
      outcome: "Pass",
      reason: "SYN reviewed kit and collection",
      source_as_at: "2026-09-05T00:00:00Z",
      evidence: {
        title: "SYN P06 preparation",
        content_text: "SYN collection reviewed; visual inspection only.",
        source_reference: "SYN-PPO-P06-BROWSER",
        source_version: "1",
      },
    },
  });
  await call(page, `appointments/${aid}/contacts`, {
    ...base(),
    id: crypto.randomUUID(),
    expected_version: a.version,
    recipient_id: id("60"),
    channel: "Simulated",
    outcome: "Confirmed",
    occurred_at: new Date().toISOString(),
    notes: "SYN manually recorded date agreement; no pack response.",
  });
  a = (await call(page, `appointments/${aid}`)).items[0];
  await call(page, `appointments/${aid}/confirm`, {
    ...base(),
    expected_version: a.version,
    expected_work_order_version: a.work_order_version,
    expected_assignment_version: a.assignment_version,
    scope_revision_id: a.scope_revision_id,
    scope_version: a.scope_version,
    policy_version_id: a.policy_version_id,
    scheduling_policy_id: id("a0"),
    scheduling_policy_version: 1,
    crew: [9, 2].map((n, i) => ({
      resource_id: id("a4", n),
      resource_version: 1,
      calendar_version: 1,
      crew_role: i ? "Technician" : "Lead",
      travel_before_minutes: 0,
      travel_after_minutes: 0,
      travel_reason:
        "SYN explicit zero travel allowance at the same fictional site",
    })),
  });
  return aid;
}
test("P06 complete workbench preparation, check, queued output, exact document and independent crew responses", async ({
  page,
}, info) => {
  test.setTimeout(120000);
  await page.goto("/service/packs");
  await identity(page);
  const aid = await appointment(
    page,
    info.project.name.startsWith("mobile") ? "2026-11-18" : "2026-11-17",
  );
  await page.goto(`/service/packs/new?appointment_id=${aid}`);
  await expect(
    page.getByRole("heading", { name: "Prepare nine-section job pack" }),
  ).toBeVisible();
  await capture(page, info, "empty-preparation");
  await page.getByRole("checkbox", { name: /SYN visual inspection/ }).check();
  for (const k of keys)
    await page
      .locator(`#section-${k}`)
      .fill(
        `SYN reviewed ${k.replaceAll("_", " ")}. Visual inspection only. Stop and escalate any access, equipment identity or safety uncertainty. No intervention is authorised.`,
      );
  await page
    .getByLabel("Preparation / change reason")
    .fill("SYN reviewed nine-section inspection preparation");
  await page
    .getByRole("button", { name: "Save preparation", exact: true })
    .click();
  await expect(page).toHaveURL(/\/service\/packs\/[a-f0-9-]+$/);
  await expect(
    page.getByRole("button", { name: "Check this revision" }),
  ).toBeVisible();
  const pid = page.url().split("/").pop()!;
  await capture(page, info, "prepared");
  await page
    .getByLabel("Decision / change reason")
    .fill("SYN exact scope, technical sources and crew checked");
  await page.getByRole("button", { name: "Check this revision" }).click();
  await expect(
    page.getByRole("button", { name: "Queue exact output for issue" }),
  ).toBeEnabled();
  await capture(page, info, "checked");
  await page
    .getByRole("button", { name: "Queue exact output for issue" })
    .click();
  await expect(
    page.getByRole("button", { name: "Process or recover original output" }),
  ).toBeEnabled();
  await expect(
    page.getByRole("link", { name: "Open exact issued document" }),
  ).toHaveCount(0);
  await capture(page, info, "queued-not-issued");
  await page
    .getByRole("button", { name: "Process or recover original output" })
    .click();
  await expect(
    page.getByRole("link", { name: "Open exact issued document" }),
  ).toBeVisible({ timeout: 45000 });
  await capture(page, info, "issued-awaiting-crew");
  const pack = (await call(page, `packs/${pid}`)).items[0],
    issue = pack.issues[0];
  await page.getByRole("link", { name: "Open exact issued document" }).click();
  await capture(page, info, "document-manifest");
  const pdf = await page.request.get(`/api/v1/pack-issues/${issue.id}/pdf`);
  expect(pdf.ok()).toBeTruthy();
  const bytes = await pdf.body();
  expect(createHash("sha256").update(bytes).digest("hex")).toBe(
    issue.output_hash,
  );
  await writeFile(info.outputPath(issue.manifest.filename), bytes);
  await writeFile(
    info.outputPath("P06-output-manifest.json"),
    JSON.stringify(
      {
        provenance: {
          executed_sha: process.env.GITHUB_SHA,
          head_ref: process.env.GITHUB_HEAD_REF,
          project: info.project.name,
        },
        manifest: issue.manifest,
        issue,
        source: pack.revisions[0].snapshot,
      },
      null,
      2,
    ),
  );
  await writeFile(
    info.outputPath("P06-original-" + issue.id + ".html"),
    await (
      await page.request.get(`/api/v1/pack-issues/${issue.id}/html`)
    ).text(),
  );
  await page.goto(`/api/v1/pack-issues/${issue.id}/html`);
  await expect(page.getByRole("heading", { level: 2 })).toHaveCount(9);
  await capture(page, info, "exact-html");
  await page.goto(`/service/packs/${pid}`);
  await identity(page, "assigned-technician");
  await expect(
    page.getByRole("button", { name: /Acknowledge this exact issue/ }),
  ).toBeEnabled();
  await capture(page, info, "riley-acknowledgement");
  const acknowledgementPath = `**/api/v1/pack-issues/${issue.id}/acknowledge`;
  let acceptedBody: string | null = null;
  await page.route(
    acknowledgementPath,
    async (route) => {
      acceptedBody = route.request().postData();
      await route.fetch();
      await route.abort("failed");
    },
    { times: 1 },
  );
  await page
    .getByRole("button", { name: /Acknowledge this exact issue/ })
    .click();
  await expect(page.locator(".business-error")).toBeVisible();
  await capture(page, info, "acknowledgement-response-lost");
  const replay = page.waitForRequest((request) =>
    request.url().endsWith(`/pack-issues/${issue.id}/acknowledge`),
  );
  await page
    .getByRole("button", { name: /Acknowledge this exact issue/ })
    .click();
  expect((await replay).postData()).toBe(acceptedBody);
  await expect(
    page.getByRole("button", { name: /Acknowledge this exact issue/ }),
  ).toHaveCount(0);
  await expect(page.getByText("Dispatch held", { exact: true })).toBeVisible();
  await identity(page, "second-technician");
  await page
    .getByRole("button", { name: /Acknowledge this exact issue/ })
    .click();
  await expect(
    page.getByText("P06 dispatch component ready", { exact: true }),
  ).toBeVisible();
  await capture(page, info, "two-responses-ready");
  await identity(page, "coordinator");
  await page
    .getByLabel("Decision / change reason")
    .fill("SYN controlled withdrawal for document integrity demonstration");
  await page.getByRole("button", { name: "Withdraw current issue" }).click();
  await expect(page.getByText("Dispatch held", { exact: true })).toBeVisible();
  await capture(page, info, "withdrawn-original-retained");
  const after = await page.request.get(`/api/v1/pack-issues/${issue.id}/pdf`);
  expect(await after.body()).toEqual(bytes);
});
test("P06 long content remains readable in exact HTML and multi-page A4 output", async ({
  page,
}, info) => {
  test.setTimeout(120000);
  await page.goto("/service/packs");
  await identity(page);
  const aid = await appointment(
      page,
      info.project.name.startsWith("mobile") ? "2026-11-20" : "2026-11-19",
    ),
    a = (await call(page, `appointments/${aid}`)).items[0],
    pid = crypto.randomUUID();
  const notes = Object.fromEntries(
    keys.map((k) => [
      k,
      k === "history" || k === "completion"
        ? Array.from(
            { length: 28 },
            (_, i) =>
              `SYN item ${i + 1}: retain the original equipment context and record unresolved observations with clear limits. This fictional inspection does not authorise adjustments, shutdown or extra work.`,
          ).join("\n\n")
        : `SYN ${k}: reviewed, no additional requirements beyond the explicit approved scope.`,
    ]),
  );
  await call(page, "packs", {
    ...base(),
    id: pid,
    appointment_id: aid,
    expected_appointment_version: a.version,
    content: {
      sections: notes,
      source_ids: [id("c2"), id("c2", 2)],
      history_ids: [],
    },
  });
  let p = (await call(page, `packs/${pid}`)).items[0];
  await call(page, `packs/${pid}/check`, {
    ...base(),
    expected_version: p.version,
    decision: "Checked",
  });
  p = (await call(page, `packs/${pid}`)).items[0];
  await call(page, `packs/${pid}/issue`, {
    ...base(),
    expected_version: p.version,
  });
  p = (await call(page, `packs/${pid}`)).items[0];
  const job = await call(page, `render-jobs/${p.jobs[0].id}/retry`, {});
  expect(job.state).toBe("Issued");
  p = (await call(page, `packs/${pid}`)).items[0];
  const issue = p.issues[0];
  const pdf = await page.request.get(`/api/v1/pack-issues/${issue.id}/pdf`);
  await mkdir(info.outputPath("long"), { recursive: true });
  await writeFile(
    info.outputPath("long/" + issue.manifest.filename),
    await pdf.body(),
  );
  await writeFile(
    info.outputPath("P06-long-manifest.json"),
    JSON.stringify(
      {
        provenance: {
          executed_sha: process.env.GITHUB_SHA,
          head_ref: process.env.GITHUB_HEAD_REF,
          project: info.project.name,
        },
        manifest: issue.manifest,
        issue,
        source: p.revisions[0].snapshot,
      },
      null,
      2,
    ),
  );
  await writeFile(
    info.outputPath("P06-original-" + issue.id + ".html"),
    await (
      await page.request.get(`/api/v1/pack-issues/${issue.id}/html`)
    ).text(),
  );
  await page.goto(`/api/v1/pack-issues/${issue.id}/html`);
  await expect(page.getByRole("heading", { level: 2 })).toHaveCount(9);
  await capture(page, info, "long-html");
});
test("P06 unavailable read and unassigned identity expose honest recovery and no document content", async ({
  page,
}, info) => {
  await page.goto("/service/packs");
  await identity(page, "observer");
  await expect(page.getByText(/No job packs are available/)).toBeVisible();
  await capture(page, info, "unassigned-empty");
  await identity(page);
  await page.route("**/api/v1/packs", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        code: "DependencyUnavailable",
        message:
          "The document register is unavailable; no saved state can be confirmed.",
        retryable: true,
      }),
    }),
  );
  await page.reload();
  await expect(page.locator(".business-error")).toContainText(
    "document register is unavailable",
  );
  await capture(page, info, "read-unavailable");
});
