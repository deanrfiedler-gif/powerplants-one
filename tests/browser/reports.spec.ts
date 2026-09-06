import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { prepareFieldAppointment } from "../helpers/field-http";
import { base, startInput, png } from "../helpers/field";
const hash = (v: string | Buffer) =>
  createHash("sha256").update(v).digest("hex");
async function call(page: Page, path: string, body?: unknown) {
  const r = await page.request.fetch(`/api/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers:
      body === undefined
        ? {}
        : {
            Origin: "http://127.0.0.1:3000",
            "Content-Type": "application/json",
          },
    data: body,
  });
  const d = await r.json();
  expect(r.ok(), JSON.stringify(d)).toBeTruthy();
  return d;
}
async function identity(page: Page, profile: string) {
  await page.getByLabel("Identity", { exact: true }).selectOption(profile);
  await page
    .getByRole("button", { name: "Use this identity", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Use this identity", exact: true }),
  ).toBeEnabled();
}
async function proof(
  page: Page,
  info: TestInfo,
  name: string,
  extra: Record<string, unknown> = {},
) {
  await page.evaluate(() => scrollTo(0, 0));
  await page.evaluate(
    () =>
      new Promise<void>((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => r())),
      ),
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await mkdir(info.outputPath("."), { recursive: true });
  const bytes = await page.screenshot({
    path: info.outputPath(`P09-${name}.png`),
    fullPage: true,
  });
  await writeFile(
    info.outputPath(`P09-${name}.json`),
    JSON.stringify(
      {
        scenario: name,
        source_head: process.env.PPO_SOURCE_HEAD ?? process.env.GITHUB_SHA,
        executed_checkout: execFileSync("git", ["rev-parse", "HEAD"], {
          encoding: "utf8",
        }).trim(),
        executed_tree: execFileSync("git", ["rev-parse", "HEAD^{tree}"], {
          encoding: "utf8",
        }).trim(),
        run_id: process.env.GITHUB_RUN_ID,
        run_attempt: process.env.GITHUB_RUN_ATTEMPT,
        viewport: page.viewportSize(),
        byte_count: bytes.length,
        sha256: hash(bytes),
        ...extra,
      },
      null,
      2,
    ),
  );
}
async function completion(page: Page) {
  await page.getByRole("button", { name: "Completion", exact: true }).click();
  await page
    .getByLabel("Actual work performed", { exact: true })
    .fill(
      "SYN completed visual inspection. " +
        "Uncertain label identity remains explicit; no intervention was authorised. ".repeat(
          35,
        ),
    );
  await page
    .getByLabel("Exclusions and limits", { exact: true })
    .fill(
      "SYN no intervention, no whole-project acceptance and no financial treatment.",
    );
  await page
    .getByLabel("Remaining work and reasons", { exact: true })
    .fill(
      "SYN second task requires a separately authorised return. Service coordinator owns identification and contact.",
    );
  await page
    .getByLabel("My time declaration", { exact: true })
    .selectOption("None");
  await page
    .getByLabel("My material declaration", { exact: true })
    .selectOption("None");
  await page
    .getByLabel("Declaration explanation", { exact: true })
    .fill(
      "SYN no elapsed-time or material quantities claimed in this UI scenario.",
    );
  const fields = page.getByLabel(/Task \d+ explanation/);
  for (let n = 0; n < (await fields.count()); n++)
    await fields
      .nth(n)
      .fill(
        n
          ? "SYN remaining task awaits return crew and confirmed booking."
          : "SYN visual inspection attempted; identity remains uncertain.",
      );
  await page
    .getByRole("button", { name: "Save completion draft", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /Saved completion draft v/ }).first(),
  ).toBeVisible();
}
async function submit(page: Page) {
  await page
    .getByLabel("Submission reason", { exact: true })
    .fill("SYN submit my exact completion evidence for authorised review.");
  await page
    .getByRole("button", {
      name: "Submit exact evidence for review",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("link", { name: "Open report review and revision history" }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Open report review and revision history" })
    .click();
  await expect(
    page.getByRole("heading", { name: /Revision \d+ · Submitted/ }),
  ).toBeVisible();
}
async function review(page: Page, returned = false) {
  const fields = page.getByLabel(/Entry \d+ review reason/);
  for (let n = 0; n < (await fields.count()); n++)
    await fields
      .nth(n)
      .fill(
        returned
          ? "SYN correct the customer finding while retaining the original capture."
          : "SYN exact factual evidence checked; no financial treatment.",
      );
  if (returned) {
    await page
      .getByLabel("Entry 1 decision", { exact: true })
      .selectOption("Returned");
    await page
      .getByLabel("Review decision", { exact: true })
      .selectOption("Returned");
  }
  await page
    .getByLabel("Review remarks (internal)", { exact: true })
    .fill(
      returned
        ? "SYN RETURN: explain the attempted fix and uncertain result."
        : "SYN PRIVATE_REVIEW_CANARY: factual attendance accepted; remaining work stays owned.",
    );
  await page
    .getByRole("button", { name: "Commit exact review", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: returned ? /Revision \d+ · Returned/ : /Revision \d+ · Reviewed/,
    }),
  ).toBeVisible();
}
async function issue(page: Page) {
  await page
    .getByRole("button", { name: "Request exact report issue", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Generate / recover original report",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Generate / recover original report",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", { name: /Revision \d+ · Issued/ }),
  ).toBeVisible();
}
async function saveOutputs(
  page: Page,
  info: TestInfo,
  id: string,
  name: string,
) {
  const r = (await call(page, `reports/${id}`)).items[0],
    v = r.presentations.find(
      (x: { kind: string; revision_id: string }) =>
        x.kind === "IssuedReport" && x.revision_id === r.revisions[0].id,
    );
  for (const kind of ["html", "pdf", "manifest"]) {
    const response = await page.request.get(
      `/api/v1/reports/${id}/${kind}?presentation_id=${v.id}`,
    );
    expect(response.ok()).toBeTruthy();
    const bytes = await response.body();
    await writeFile(
      info.outputPath(`P09-${name}.${kind === "manifest" ? "json" : kind}`),
      bytes,
    );
    await writeFile(
      info.outputPath(`P09-${name}-${kind}-provenance.json`),
      JSON.stringify(
        {
          scenario: name,
          source_head: process.env.PPO_SOURCE_HEAD,
          executed_checkout: execFileSync("git", ["rev-parse", "HEAD"], {
            encoding: "utf8",
          }).trim(),
          executed_tree: execFileSync("git", ["rev-parse", "HEAD^{tree}"], {
            encoding: "utf8",
          }).trim(),
          run_id: process.env.GITHUB_RUN_ID,
          run_attempt: process.env.GITHUB_RUN_ATTEMPT,
          byte_count: bytes.length,
          sha256: hash(bytes),
          presentation: v,
        },
        null,
        2,
      ),
    );
    if (kind !== "pdf")
      for (const forbidden of [
        "PRIVATE_REVIEW_CANARY",
        "store_key",
        "drive_id",
        "stock_status",
        "content_base64",
      ])
        expect(bytes.toString()).not.toContain(forbidden);
  }
  return { r, v };
}
test("P09 complete UI return, correction, partial acceptance, return proposal, controlled revisions and five exact responses", async ({
  page,
}, info) => {
  test.setTimeout(240000);
  await page.goto("/service/reports");
  await identity(page, "coordinator");
  await expect(
    page.getByRole("heading", { name: "Service review and reports" }),
  ).toBeVisible();
  await proof(page, info, "report-list");
  const setup = await prepareFieldAppointment(
    (path, body) => call(page, path, body),
    info.project.name.startsWith("mobile") ? "2026-12-21" : "2026-12-18",
  );
  for (const profile of ["assigned-technician", "second-technician"]) {
    await identity(page, profile);
    const actor = await call(page, "local-session"),
      r = setup.pack.readiness.recipients.find(
        (x: { user_id: string }) => x.user_id === actor.actor_id,
      );
    await call(page, `pack-issues/${setup.pack.current_issue_id}/acknowledge`, {
      ...base(),
      assignment_id: r.assignment_id,
      assignment_version: r.assignment_version,
      presented_hash: setup.pack.issues[0].output_hash,
      captured_at: new Date().toISOString(),
    });
  }
  await identity(page, "assigned-technician");
  const job = (await call(page, `my-jobs/${setup.appointment_id}`)).items[0];
  await call(page, `appointments/${job.id}/start`, startInput(job));
  await page.goto(`/my-jobs/${job.id}`);
  await page
    .getByLabel("Evidence type", { exact: true })
    .selectOption("Observation");
  await page
    .getByLabel("Authorised task", { exact: true })
    .selectOption(job.scope.items[0].id);
  await page
    .getByLabel("Affected asset", { exact: true })
    .selectOption(job.scope.items[0].assets[0].id);
  await page
    .getByLabel("Finding", { exact: true })
    .fill("SYN initial uncertain external label finding");
  await page
    .getByLabel("Finding confidence", { exact: true })
    .selectOption("Suspected");
  await page
    .getByLabel("Attempted action", { exact: true })
    .fill("SYN attempted visual reading only");
  await page
    .getByLabel("Action result", { exact: true })
    .fill("SYN label still unclear, no repair authorised");
  await page
    .getByLabel("Capture context", { exact: true })
    .fill("SYN P09 evidence for a personal completion submission");
  await page
    .getByRole("button", { name: "Save evidence online", exact: true })
    .click();
  await expect(page.getByLabel("Capture context", { exact: true })).toHaveValue(
    "",
  );
  await completion(page);
  await proof(page, info, "exact-draft-ready");
  await submit(page);
  const reportId = page.url().split("/").at(-1)!;
  await identity(page, "coordinator");
  await page
    .getByRole("button", { name: "Commit exact review", exact: true })
    .click();
  await expect(page.getByRole("alert").first()).toBeFocused();
  await proof(page, info, "review-validation-focus");
  await review(page, true);
  await proof(page, info, "returned-entry-reason");
  await identity(page, "assigned-technician");
  await page
    .getByRole("link", { name: "Technician evidence and correction" })
    .click();
  await page.getByRole("button", { name: "History", exact: true }).click();
  await page
    .getByRole("button", { name: "Correct this observation entry" })
    .click();
  await page
    .getByLabel("Finding", { exact: true })
    .fill(
      "SYN corrected finding: visual reading failed; asset identity remains unverified.",
    );
  await page
    .getByLabel("Correction reason", { exact: true })
    .fill("SYN reviewer return addressed through a linked factual successor");
  await page
    .getByRole("button", { name: "Save successor correction", exact: true })
    .click();
  await expect(
    page.getByLabel("Capture context", { exact: true }),
  ).toBeVisible();
  await completion(page);
  await submit(page);
  await identity(page, "coordinator");
  await review(page);
  await proof(page, info, "accepted-attendance-partial-work");
  let report = (await call(page, `reports/${reportId}`)).items[0];
  expect(report.appointment.status).toBe("Completed");
  expect(report.work_order.status).toBe("Authorised");
  await page
    .getByRole("link", { name: "Remaining work and return proposal" })
    .click();
  await page.getByText("Propose a visit", { exact: true }).click();
  await page
    .getByLabel("Proposed start (device timezone)")
    .fill(
      info.project.name.startsWith("mobile")
        ? "2026-12-23T00:00"
        : "2026-12-22T00:00",
    );
  await page
    .getByLabel("Proposed finish (device timezone)")
    .fill(
      info.project.name.startsWith("mobile")
        ? "2026-12-23T02:00"
        : "2026-12-22T02:00",
    );
  await page
    .getByRole("button", { name: "Save proposed visit", exact: true })
    .click();
  await expect(
    page.getByText("Saved to the server.", { exact: true }).last(),
  ).toBeVisible();
  await proof(page, info, "owned-return-proposal");
  await page.goto(`/service/reports/${reportId}`);
  await issue(page);
  await proof(page, info, "durable-issued-report");
  const old = await saveOutputs(page, info, reportId, "long-revision-02");
  for (const [n, value] of [
    "Accepted",
    "AcceptedWithReservations",
    "Declined",
    "Unavailable",
    "Disputed",
  ].entries()) {
    await page
      .getByRole("button", { name: "Present Issued Report", exact: true })
      .first()
      .click();
    await expect(
      page.getByRole("heading", {
        name: "Record customer response",
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByLabel("Customer response", { exact: true })
      .selectOption(value);
    if (value !== "Unavailable") {
      await page
        .getByLabel("Stated respondent name (synthetic)")
        .fill("SYN Casey Fictional");
      await page
        .getByLabel("Stated respondent role", { exact: true })
        .fill("Fictional site contact");
    }
    if (n === 0)
      await page
        .getByLabel("Optional synthetic signature PNG")
        .setInputFiles({
          name: "SYN-mark.png",
          mimeType: "image/png",
          buffer: png(),
        });
    if (value !== "Accepted") {
      await page
        .getByLabel(
          value === "Unavailable"
            ? "Unavailable reason"
            : "Response remarks / reservations",
          { exact: true },
        )
        .fill(
          "SYN remaining work requires another owned contact and authorised return.",
        );
      await page
        .getByLabel("Owned next action (required unless accepted)")
        .fill(
          "SYN service coordinator to contact the fictional site and arrange a proposal.",
        );
    }
    await proof(page, info, `response-${value}-presented`);
    await page
      .getByRole("button", {
        name: "Save response to presented content",
        exact: true,
      })
      .click();
    await expect
      .poll(
        async () =>
          (await call(page, `reports/${reportId}`)).items[0].responses.length,
      )
      .toBe(n + 1);
  }
  report = (await call(page, `reports/${reportId}`)).items[0];
  const prior = report.responses.find(
    (x: { signature_hash: string | null }) => x.signature_hash,
  );
  await identity(page, "assigned-technician");
  await page
    .getByLabel("Report correction reason", { exact: true })
    .fill(
      "SYN materially changed finding requires a successor report; retain prior response.",
    );
  await page
    .getByRole("button", { name: "Open successor correction", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /Revision \d+ · Draft/ }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Technician evidence and correction" })
    .click();
  await page.getByRole("button", { name: "History", exact: true }).click();
  await page
    .getByRole("button", { name: "Correct this observation entry" })
    .click();
  await page
    .getByLabel("Finding", { exact: true })
    .fill(
      "SYN MATERIAL CHANGE: customer equipment label was transcribed incorrectly. Prior uncertainty and output remain retained.",
    );
  await page
    .getByLabel("Correction reason", { exact: true })
    .fill("SYN factual report correction after accepted attendance");
  await page
    .getByRole("button", { name: "Save successor correction", exact: true })
    .click();
  await expect(
    page.getByLabel("Capture context", { exact: true }),
  ).toBeVisible();
  await completion(page);
  await submit(page);
  await identity(page, "coordinator");
  await review(page);
  await issue(page);
  const newer = await saveOutputs(page, info, reportId, "long-revision-03");
  expect(newer.v.content_hash).not.toBe(old.v.content_hash);
  expect(newer.r.responses).toHaveLength(5);
  const refused = await page.request.post(
    `/api/v1/reports/${reportId}/respond`,
    {
      headers: { Origin: "http://127.0.0.1:3000" },
      data: {
        ...base(),
        id: crypto.randomUUID(),
        presentation_id: newer.v.id,
        revision_id: newer.v.revision_id,
        presentation_kind: "IssuedReport",
        presented_hash: prior.presented_hash,
        expected_report_version: newer.r.version,
        response: "Accepted",
        respondent_name: "SYN Casey Fictional",
        respondent_role: "Fictional site contact",
        remarks: null,
        next_action: null,
        presented_at: new Date().toISOString(),
        captured_at: new Date().toISOString(),
        signature: null,
      },
    },
  );
  expect(refused.status()).toBe(409);
  await writeFile(
    info.outputPath("P09-reassociation-refusal.json"),
    JSON.stringify(await refused.json(), null, 2),
  );
  expect(
    (await call(page, `reports/${reportId}`)).items[0].responses,
  ).toHaveLength(5);
  await page
    .getByRole("button", { name: "Present Issued Report", exact: true })
    .last()
    .click();
  await expect(
    page.getByText(
      "Historical presentation retained. A prior response or signature cannot be transferred to a successor.",
    ),
  ).toBeVisible();
  await proof(page, info, "old-response-preserved-new-content-refused");
});
