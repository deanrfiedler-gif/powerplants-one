import { test, expect, type Page } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { renderPack, type PackSnapshot } from "../../src/documents/render";
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
      ? {
          Origin: new URL(test.info().project.use.baseURL!).origin,
          "Content-Type": "application/json",
        }
      : {},
    data: body,
  });
  const data = await r.json();
  expect(r.ok(), JSON.stringify(data)).toBeTruthy();
  return data;
}
async function identity(page: Page, profile = "coordinator") {
  await expect(
    page.getByRole("region", {
      name: "Local demonstration identity",
      exact: true,
    }),
  ).toHaveAttribute("aria-busy", "false");
  if (!(await page.getByLabel("Identity", { exact: true }).isVisible()))
    await page
      .getByRole("button", { name: "Change identity", exact: true })
      .click();

  await page.getByLabel("Identity", { exact: true }).selectOption(profile);
  await page
    .getByRole("button", { name: "Use this identity", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Change identity", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("region", {
      name: "Local demonstration identity",
      exact: true,
    }),
  ).toHaveAttribute("aria-busy", "false");
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
// Each controlled pack decision opens its own dialog and records its own reason (Job Pack r03, audit M1).
async function decide(
  page: Page,
  trigger: string,
  confirm: string,
  reason: string,
) {
  await page.getByRole("button", { name: trigger, exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByLabel("Decision / change reason", { exact: true }),
  ).toBeFocused();
  // A decision without a reason is refused in place, before any command is sent.
  await dialog.getByRole("button", { name: confirm, exact: true }).click();
  await expect(
    dialog.getByText("Enter the reason for this decision.", { exact: true }),
  ).toBeVisible();
  await dialog
    .getByLabel("Decision / change reason", { exact: true })
    .fill(reason);
  await dialog.getByRole("button", { name: confirm, exact: true }).click();
  await expect(dialog).toHaveCount(0);
}
// Audit finding M1: every save records its own reason, in the dialog that states what it changes.
async function savePreparation(page: Page, title: string, reason: string) {
  await page
    .getByRole("button", { name: "Save preparation…", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: title })).toBeVisible();
  await expect(
    dialog.getByLabel("Reason for this change", { exact: true }),
  ).toBeFocused();
  // A save without a reason is refused in place, before any command is sent.
  await dialog
    .getByRole("button", { name: "Save preparation", exact: true })
    .click();
  await expect(
    dialog.getByText("Enter the reason for this change.", { exact: true }),
  ).toBeVisible();
  await dialog
    .getByLabel("Reason for this change", { exact: true })
    .fill(reason);
  await dialog
    .getByRole("button", { name: "Save preparation", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
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
    info.project.name.startsWith("mobile") ? "2031-11-19" : "2031-11-18",
  );
  await page.goto(`/service/packs/new?appointment_id=${aid}`);
  await expect(
    page.getByRole("heading", { name: "Prepare the first revision" }),
  ).toBeVisible();
  // Nothing has been entered, so there is nothing to record a reason for.
  await expect(
    page.getByRole("button", { name: "Save preparation…", exact: true }),
  ).toBeDisabled();
  await capture(page, info, "empty-preparation");
  await page.getByRole("checkbox", { name: /SYN visual inspection/ }).check();
  for (const k of keys)
    await page
      .locator(`#section-${k}`)
      .fill(
        `SYN reviewed ${k.replaceAll("_", " ")}. Visual inspection only. Stop and escalate any access, equipment identity or safety uncertainty. No intervention is authorised.`,
      );
  await savePreparation(
    page,
    "Record the first preparation",
    "SYN reviewed nine-section inspection preparation",
  );
  await expect(page).toHaveURL(/\/service\/packs\/[a-f0-9-]+$/);
  await expect(
    page.getByRole("button", { name: "Check this revision" }),
  ).toBeVisible();
  const pid = page.url().split("/").pop()!;
  // Save and print must consume the actual flat OperationReceipt returned by commandRoute.
  // Prove the preview is the immutable saved successor, before continuing the issue journey.
  await page.getByRole("tab", { name: /^Preparation,/ }).click();
  await page
    .locator("#section-identification")
    .fill("SYN revised arrival notes for the exact preparation preview.");
  await page
    .getByRole("button", { name: "Print preview", exact: true })
    .click();
  await page.getByRole("button", { name: "Save and print…" }).click();
  await page
    .getByLabel("Reason for this change", { exact: true })
    .fill("SYN print the saved successor");
  await page
    .getByRole("button", { name: "Save preparation", exact: true })
    .click();
  const printDialog = page.getByRole("dialog", {
    name: "Saved preparation — ready to print",
  });
  await expect(printDialog).toBeVisible();
  const savedPack = (await call(page, `packs/${pid}`)).items[0];
  const previewLink = printDialog.getByRole("link", {
    name: /^Print saved revision/,
  });
  await expect(previewLink).toHaveAttribute(
    "href",
    `/api/v1/packs/${pid}/preview?revision_id=${savedPack.current_revision_id}`,
  );
  const preview = await page.request.get(
    (await previewLink.getAttribute("href"))!,
  );
  expect(preview.ok()).toBe(true);
  expect(await preview.text()).toContain(
    "SYN revised arrival notes for the exact preparation preview.",
  );
  await printDialog
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  await capture(page, info, "prepared");
  // SC-06 r03 page: the accepted scope container, its nine sections and readiness read from the policy registry.
  await expect(page.locator("#ppo-job-pack")).toBeVisible();
  await expect(page.locator("#jp-panel-pack .jp-section-head h2")).toHaveCount(
    9,
  );
  await expect(
    page.getByRole("tab", { name: "Job pack, 9 sections", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText(/^\d+ of \d+ criteria satisfied/)).toBeVisible();
  await decide(
    page,
    "Check this revision",
    "Record check",
    "SYN exact scope, technical sources and crew checked",
  );
  await expect(
    page.getByRole("button", { name: "Queue exact output for issue" }),
  ).toBeEnabled();
  await capture(page, info, "checked");
  await decide(
    page,
    "Queue exact output for issue",
    "Queue output",
    "SYN exact checked revision queued for controlled issue",
  );
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
  await expect(page).toHaveURL(`/documents/${issue.id}`);
  await expect(
    page.getByRole("heading", { name: "Exact issued job pack", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Current applicable issue", { exact: true }),
  ).toBeVisible();
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
    page.getByText("Pack dispatch checks complete", { exact: true }),
  ).toBeVisible();
  await capture(page, info, "two-responses-ready");
  await identity(page, "coordinator");
  await decide(
    page,
    "Withdraw current issue",
    "Withdraw issue",
    "SYN controlled withdrawal for document integrity demonstration",
  );
  await expect(page.getByText("Dispatch held", { exact: true })).toBeVisible();
  await capture(page, info, "withdrawn-original-retained");
  const after = await page.request.get(`/api/v1/pack-issues/${issue.id}/pdf`);
  expect(await after.body()).toEqual(bytes);
  await page.goto(`/documents/${issue.id}`);
  await expect(
    page.getByText("Not currently applicable", { exact: true }),
  ).toBeVisible();
  await capture(page, info, "withdrawn-document-status");
});
test("P06 long content remains readable in exact HTML and multi-page A4 output", async ({
  page,
}, info) => {
  test.setTimeout(120000);
  await page.goto("/service/packs");
  await identity(page);
  const aid = await appointment(
      page,
      info.project.name.startsWith("mobile") ? "2031-11-21" : "2031-11-20",
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
  if (info.project.name === "desktop-chromium") {
    const fixture: PackSnapshot = structuredClone(p.revisions[0].snapshot);
    fixture.pack_reference = "SYN-PPO-PACK-900001";
    fixture.revision = 99;
    fixture.customer.name =
      "SYN Extended Fictional Research and Demonstration Organisation with Multiple Site Operating Divisions and a Deliberately Long Customer Name";
    fixture.site.name =
      "SYN North Demonstration Facility including the Propagation Research Building, External Irrigation Gallery and Equipment Observation Area";
    fixture.sections.identification.text =
      "Standalone synthetic renderer fixture — no database issue or approved work exists for this fixture.";
    fixture.sections.equipment.text = Array.from(
      { length: 24 },
      (_, i) =>
        `SYN fixture asset ${i + 1}: external observation equipment with a long identification description; configuration unverified; no intervention. This is a layout fixture only.`,
    ).join("\n\n");
    fixture.sections.history.notes =
      "Not applicable to this standalone layout fixture; no actual service history is asserted.";
    const prepared_at = new Date().toISOString(),
      issue_id = crypto.randomUUID();
    const output = await renderPack(fixture, { prepared_at, issue_id });
    await writeFile(
      info.outputPath("SYN-PPO-PACK-900001-job-pack-r99.pdf"),
      output.pdf,
    );
    await writeFile(info.outputPath("P06-renderer-fixture.html"), output.html);
    await writeFile(
      info.outputPath("P06-renderer-fixture.json"),
      JSON.stringify(
        {
          kind: "Standalone synthetic visual fixture; never issued",
          provenance: {
            executed_sha: process.env.GITHUB_SHA,
            project: info.project.name,
          },
          source: fixture,
          prepared_at,
          issue_id,
          pdf_hash: createHash("sha256").update(output.pdf).digest("hex"),
          html_hash: createHash("sha256").update(output.html).digest("hex"),
          renderer_version: output.renderer_version,
          browser_version: output.browser_version,
        },
        null,
        2,
      ),
    );
  }
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
