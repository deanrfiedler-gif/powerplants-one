import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { financeHttpSource, httpFinanceDraft } from "../helpers/finance-http";
test.describe.configure({ timeout: 240000 });
test.use({ actionTimeout: 15000 });
const hash = (b: Buffer | string) =>
  createHash("sha256").update(b).digest("hex");
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
  expect(r.ok(), JSON.stringify(d)).toBe(true);
  return d;
}
async function identity(page: Page, profile: string) {
  await expect(page.getByRole("region", { name: "Local demonstration identity", exact: true })).toHaveAttribute("aria-busy", "false");
  if (!(await page.getByLabel("Identity", { exact: true }).isVisible())) await page.getByRole("button", { name: "Change identity", exact: true }).click();

  await page.getByLabel("Identity", { exact: true }).selectOption(profile);
  await page
    .getByRole("button", { name: "Use this identity", exact: true })
    .click();
  await expect(page.getByRole("button", { name: "Change identity", exact: true })).toBeEnabled();
  await expect(page.getByRole("region", { name: "Local demonstration identity", exact: true })).toHaveAttribute("aria-busy", "false");
}
async function capture(
  page: Page,
  info: TestInfo,
  scenario: string,
  extra: Record<string, unknown> = {},
) {
  await page
    .locator("h1")
    .evaluate((heading) => heading.scrollIntoView({ block: "start" }));
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await mkdir(info.outputPath("."), { recursive: true });
  for (const fullPage of [false, true]) {
    const name = `P10-${scenario}${fullPage ? "-full" : ""}`,
      bytes = await page.screenshot({
        path: info.outputPath(name + ".png"),
        fullPage,
      });
    await writeFile(
      info.outputPath(name + ".json"),
      JSON.stringify(
        {
          scenario,
          full_page: fullPage,
          viewport: page.viewportSize(),
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
          ...extra,
        },
        null,
        2,
      ),
    );
  }
}
async function reason(page: Page, text: string) {
  await page.getByLabel("Precise action / correction reason").fill(text);
}
async function state(page: Page, text: string) {
  await expect(page.getByText(text, { exact: true }).first()).toBeVisible();
}
test("P10 PT-17/PT-19 complete UI allocation, return/correction, unknown lookup, reconciliation and OUT-14", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const desktop = info.project.name.startsWith("desktop"),
    source = await financeHttpSource(
      (p, b) => call(page, p, b),
      desktop ? "2026-11-25" : "2026-11-26",
      desktop ? 1 : 2,
    );
  await page.goto("/finance/handoffs/new");
  await identity(page, "finance");
  await page
    .getByLabel("Work order", { exact: true })
    .selectOption(source.work_order_id);
  await page
    .getByLabel("Synthetic account", { exact: true })
    .selectOption({ index: 1 });
  await page
    .getByLabel("Processing mode", { exact: true })
    .selectOption("SyntheticApi");
  await page
    .getByRole("checkbox", { name: new RegExp(source.reference) })
    .check();
  const time = page
      .locator("section")
      .filter({
        has: page.getByRole("heading", {
          name: /Allocation \d+ · Captured Labour time/,
        }),
      })
      .last(),
    material = page
      .locator("section")
      .filter({
        has: page.getByRole("heading", {
          name: /Allocation \d+ · SYN fictional label sleeve/,
        }),
      })
      .last();
  await time.getByLabel(/Allocated quantity/).fill("60");
  await time.getByLabel(/Disposition \d+/).selectOption("Billable");
  await time.getByLabel(/Target group/).fill("F06-LABOUR");
  await time
    .getByLabel(/Disposition reason/)
    .fill(
      "F-06 exact synthetic allocation of sixty minutes; no operational billing policy.",
    );
  await material.getByLabel(/Disposition \d+/).selectOption("Billable");
  await material.getByLabel(/Target group/).fill("F06-MATERIAL");
  await material
    .getByLabel(/Disposition reason/)
    .fill(
      "F-06 two EA on a fictional service charge; no warehouse issue or stock movement.",
    );
  await time.getByRole("button", { name: /Add split allocation/ }).click();
  await page.getByLabel("Allocated quantity 3", { exact: true }).fill("30");
  await page
    .getByLabel("Disposition 3", { exact: true })
    .selectOption("NonBillable");
  await page
    .getByLabel("Disposition reason 3", { exact: true })
    .fill(
      "F-06 reviewed non-billable thirty minutes remain allocated and cannot be silently reused.",
    );
  const long =
    "SYN FINANCE_PRIVATE_CANARY: F-06 exact synthetic treatment of 60 MIN plus 2 EA; all 90 MIN are dispositioned. No live price, tax, stock or warranty policy. ";
  await page
    .getByLabel("Finance treatment basis", { exact: true })
    .fill(long.repeat(12));
  await page
    .getByLabel("Remaining work and dependency basis", { exact: true })
    .fill(
      "Exact accepted Partial attendance only. Service owns the remaining task and a separately authorised future visit. ".repeat(
        8,
      ),
    );
  await page
    .getByLabel("Reason for this saved revision", { exact: true })
    .fill(
      "SYN Finance preparer records independently specified F-06 source allocations.",
    );
  await capture(page, info, "long-allocation-form");
  await page
    .getByRole("button", { name: "Save Finance draft", exact: true })
    .click();
  await expect(page).toHaveURL(/\/finance\/handoffs\/[a-f0-9-]+$/);
  const id = page.url().split("/").at(-1)!;
  await state(page, "Draft");
  await capture(page, info, "loaded-draft");
  await reason(
    page,
    "F-06 full source quantities and original report bytes checked for Finance review.",
  );
  await page
    .getByRole("button", { name: "Submit for Finance review", exact: true })
    .click();
  await state(page, "Ready For Review");
  await identity(page, "finance-reviewer");
  await reason(
    page,
    "Return: clarify why the separate thirty-minute no-posting disposition is retained.",
  );
  await page
    .getByRole("button", { name: "Return with correction reason", exact: true })
    .click();
  await state(page, "Returned");
  await capture(page, info, "returned-exact-review");
  await identity(page, "finance");
  await page
    .getByRole("button", { name: "Revise retained draft", exact: true })
    .click();
  await page
    .getByLabel("Finance treatment basis", { exact: true })
    .fill(
      long.repeat(12) +
        " The separate reviewed thirty-minute no-posting allocation remains consumed.",
    );
  await page
    .getByLabel("Reason for this saved revision", { exact: true })
    .fill(
      "Correct the precise reviewer reason while preserving the first submitted revision and allocation history.",
    );
  await page
    .getByRole("button", { name: "Save Finance draft", exact: true })
    .click();
  await state(page, "Draft");
  await reason(
    page,
    "Resubmit the explicitly corrected F-06 allocation basis and complete exact source set.",
  );
  await page
    .getByRole("button", { name: "Submit for Finance review", exact: true })
    .click();
  await state(page, "Ready For Review");
  await identity(page, "finance-reviewer");
  await reason(
    page,
    "Approve exact F-06 revision: 60 MIN and 2 EA billable, 30 MIN non-billable; no operational treatment implied.",
  );
  await page
    .getByRole("button", { name: "Approve exact revision", exact: true })
    .click();
  await state(page, "Approved");
  await identity(page, "finance-processor");
  await page
    .getByLabel("Synthetic outcome scenario", { exact: true })
    .selectOption("AcceptedThenTimeout");
  await reason(
    page,
    "Claim the original F-07 simulator operation once; retain its exact approved source and correlation.",
  );
  await page
    .getByRole("button", {
      name: "Claim original processing action",
      exact: true,
    })
    .click();
  await state(page, "Awaiting ERP");
  await capture(page, info, "claimed-original");
  await page
    .getByRole("button", {
      name: "Execute synthetic action and record outcome",
      exact: true,
    })
    .click();
  await state(page, "Outcome Unknown");
  await capture(page, info, "unknown-outcome");
  const unknown = await call(page, `finance/handoffs/${id}`);
  expect(unknown.targets).toHaveLength(0);
  expect(unknown.outcomes[0].outcome).toBe("Unknown");
  await reason(
    page,
    "Look up the original operation and retain its independently recorded synthetic target receipt.",
  );
  await page
    .getByRole("button", { name: "Look up original operation", exact: true })
    .click();
  await state(page, "Reconciliation Required");
  const found = await call(page, `finance/handoffs/${id}`);
  expect(found.targets).toHaveLength(1);
  expect(
    found.targets[0].lines.map((l: { quantity: string; uom: string }) => [
      l.quantity,
      l.uom,
    ]),
  ).toEqual([
    ["60", "MIN"],
    ["2", "EA"],
  ]);
  await capture(page, info, "recorded-original-target");
  await identity(page, "finance-reconciler");
  await reason(
    page,
    "F-06 independent reconciliation: exact 60 MIN and 2 EA target lines match; reviewed 30 MIN non-billable is retained. No differences accepted.",
  );
  await page
    .getByRole("button", {
      name: "Reconcile exact source and target",
      exact: true,
    })
    .click();
  await state(page, "Reconciled");
  await capture(page, info, "reconciled-source-target");
  await page
    .getByRole("button", { name: "Prepare OUT-14 evidence", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Recover original output operation",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Recover original output operation",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("link", { name: "Open original PDF", exact: true }),
  ).toBeVisible({ timeout: 60000 });
  await capture(page, info, "issued-original-finance-output");
  const final = await call(page, `finance/handoffs/${id}`),
    issue = final.issues[0];
  for (const format of ["html", "pdf"]) {
    const response = await page.request.get(
      `/api/v1/finance/issues/${issue.id}/bytes?format=${format}`,
    );
    expect(response.ok()).toBe(true);
    const bytes = await response.body();
    expect(response.headers()["cache-control"]).toContain("no-store");
    await writeFile(info.outputPath(`P10-OUT14.${format}`), bytes);
    await writeFile(
      info.outputPath(`P10-OUT14-${format}-proof.json`),
      JSON.stringify(
        {
          scenario: "PT-17/PT-19 original OUT-14",
          source_head: process.env.PPO_SOURCE_HEAD,
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
          manifest: issue.manifest,
        },
        null,
        2,
      ),
    );
  }
  const service = await call(page, "local-session", { profile: "coordinator" });
  expect(service.actor_id).toBeTruthy();
  const report = (await call(page, `reports/${source.report_id}`)).items[0],
    presentation = report.presentations.find(
      (p: { kind: string }) => p.kind === "IssuedReport",
    ),
    safe = await page.request.get(
      `/api/v1/reports/${source.report_id}/html?presentation_id=${presentation.id}`,
    );
  expect(safe.ok()).toBe(true);
  expect(await safe.text()).not.toContain("FINANCE_PRIVATE_CANARY");
  expect(
    (
      await page.request.get(
        `/api/v1/finance/issues/${issue.id}/bytes?format=pdf`,
      )
    ).status(),
  ).toBe(403);
  await call(page, "local-session", { profile: "assigned-technician" });
  for (const [path, method] of [
    [`my-jobs/${report.appointment.id}`, "GET"],
    [`sync/context/${report.appointment.id}`, "POST"],
  ]) {
    const response = await page.request.fetch(`/api/v1/${path}`, {
      method,
      ...(method === "POST"
        ? {
            headers: {
              Origin: "http://127.0.0.1:3000",
              "Content-Type": "application/json",
            },
            data: {},
          }
        : {}),
    });
    expect(response.ok()).toBe(true);
    expect(await response.text()).not.toContain("FINANCE_PRIVATE_CANARY");
  }
  expect(errors).toEqual([]);
});
test("P10 PT-20/PT-21 UI exact account arithmetic, filtering, partial/failure and as-at labels", async ({
  page,
}, info) => {
  await page.goto("/finance/handoffs");
  await identity(page, "finance");
  const o = await call(page, "finance/options"),
    a = o.accounts[0];
  await page.goto(`/customers/${a.customer_id}/account?account_id=${a.id}`);
  for (const [f, balance, cash] of [
    ["F-01", "AUD 600.00", "AUD 0.00"],
    ["F-02", "AUD 600.00", "AUD 200.00"],
    ["F-03", "AUD 1000.00", "AUD 0.00"],
    ["F-04", "Unavailable", "Unknown"],
    ["F-05", "AUD 600.00", "AUD 0.00"],
    ["Failed", "Unavailable", "Unknown"],
  ]) {
    await page
      .getByLabel("Independent fixture", { exact: true })
      .selectOption(f);
    await page
      .getByRole("button", { name: "Record synthetic extraction", exact: true })
      .click();
    await expect(
      page.getByRole("button", {
        name: "Record synthetic extraction",
        exact: true,
      }),
    ).toBeEnabled();
    const metric = page
      .getByText("Supplied account balance", { exact: true })
      .locator("..");
    await expect(metric.locator("strong")).toHaveText(balance);
    await expect(
      page
        .getByText("Separate unapplied cash", { exact: true })
        .locator("..")
        .locator("strong"),
    ).toHaveText(cash);
    await expect(
      page.getByText("Committed cost", { exact: true }).locator(".."),
    ).toContainText("Not defined");
    if (f === "F-02" || f === "F-04") {
      await page.getByLabel("Show invoice rows only").check();
      await expect(page.locator("tbody tr")).toHaveCount(1);
      await expect(metric.locator("strong")).toHaveText(balance);
    }
    if (f === "F-03") {
      await page.getByLabel("Show invoice rows only").uncheck();
      await expect(
        page.getByText("Reverses SYN-F01-PAYMENT", { exact: true }),
      ).toBeVisible();
    }
    await capture(page, info, `account-${f.toLowerCase()}`);
    if (f === "F-03" && info.project.name.startsWith("mobile")) {
      const table = page.getByLabel("Account transaction table", {
        exact: true,
      });
      await table.focus();
      await expect(table).toBeFocused();
      await table.evaluate((element) => {
        element.scrollLeft = element.scrollWidth;
      });
      expect(
        await table.evaluate((element) => element.scrollLeft),
      ).toBeGreaterThan(0);
      await table.scrollIntoViewIfNeeded();
      const bytes = await page.screenshot({
        path: info.outputPath("P10-account-table-right.png"),
      });
      await writeFile(
        info.outputPath("P10-account-table-right.json"),
        JSON.stringify(
          {
            scenario:
              "F-03 phone contained horizontal table reveals remaining/status/reversal columns",
            viewport: page.viewportSize(),
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
          },
          null,
          2,
        ),
      );
      await table.evaluate((element) => {
        element.scrollLeft = 0;
      });
    }
    if (f === "F-01") {
      await page.route(
        "**/account-observations?**",
        (route) =>
          route.fulfill({
            status: 503,
            contentType: "application/json",
            body: JSON.stringify({
              message:
                "SYN account refresh failed; original observation retained.",
              retryable: true,
            }),
          }),
        { times: 1 },
      );
      await page
        .getByRole("button", { name: "Refresh observations", exact: true })
        .click();
      await expect(
        page.getByText("Refresh failed — current total unavailable", {
          exact: true,
        }),
      ).toBeVisible();
      await expect(metric.locator("strong")).toHaveText("Unavailable");
      await expect(
        page
          .getByText("Separate unapplied cash", { exact: true })
          .locator("..")
          .locator("strong"),
      ).toHaveText("Unknown");
      await expect(page.getByText(/Last good observation:/)).toContainText(
        "600.00",
      );
      await capture(page, info, "account-refresh-failed-historical");
      await page
        .getByRole("button", { name: "Refresh observations", exact: true })
        .click();
      await expect(metric.locator("strong")).toHaveText("AUD 600.00");
    }
  }
  await expect(page.getByText(/Last good observation:/)).toBeVisible();
  await identity(page, "assigned-technician");
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByText("AUD 600.00", { exact: true })).toHaveCount(0);
  await capture(page, info, "account-role-denied");
});
test("P10 loaded/empty/loading/error/keyboard queue states retain scope and reflow", async ({
  page,
}, info) => {
  await page.goto("/finance/handoffs");
  await identity(page, "finance");
  await expect(
    page.getByRole("heading", { name: "Finance handoffs", exact: true }),
  ).toBeVisible();
  await capture(page, info, "loaded-queue");
  await page
    .getByLabel("Queue state", { exact: true })
    .selectOption("ReadyForReview");
  await expect(
    page.getByRole("heading", { name: "No Finance handoffs", exact: true }),
  ).toBeVisible();
  await capture(page, info, "empty-queue");
  await page.getByLabel("Queue state", { exact: true }).focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Refresh queue", exact: true }),
  ).toBeFocused();
  await capture(page, info, "keyboard-queue");
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/v1/finance/handoffs?**", async (route) => {
    await pending;
    await route.continue();
  });
  await page.getByLabel("Queue state", { exact: true }).selectOption("Draft");
  await expect(
    page.getByText("Loading permitted Finance work…", { exact: true }),
  ).toBeVisible();
  await capture(page, info, "loading-queue");
  release();
  await page.unrouteAll({ behavior: "wait" });
  await identity(page, "systems");
  await expect(page.getByRole("alert")).toBeVisible();
  await capture(page, info, "queue-denied");
  await expect(page.getByText(/SYN-ACCOUNT-/)).toHaveCount(0);
});
test("P10 stale browser proposal shows conflict and preserves a concurrently cancelled original", async ({
  page,
}, info) => {
  await page.goto("/finance/handoffs");
  await identity(page, "finance");
  const list = await call(page, "finance/handoffs"),
    existing = list.items.find(
      (h: { status: string }) => h.status === "Reconciled",
    ),
    d = await call(page, `finance/handoffs/${existing.id}`),
    source = {
      report_id: d.revisions[0].source_snapshot.reports[0].report_id,
      reference: "retained source",
      work_order_id: d.handoff.work_order_id,
    },
    input = await httpFinanceDraft((p, b) => call(page, p, b), source);
  await call(page, "finance/handoffs", input);
  await page.goto(`/finance/handoffs/${input.id}`);
  await state(page, "Draft");
  await reason(
    page,
    "Stale browser submit must not undo a concurrent explicit cancellation.",
  );
  const current = await call(page, `finance/handoffs/${input.id}`);
  await call(page, `finance/handoffs/${input.id}/cancel`, {
    schema_version: 1,
    operation_id: randomUUID(),
    expected_version: current.handoff.version,
    reason: "Concurrent explicit cancellation before any effects.",
  });
  await page
    .getByRole("button", { name: "Submit for Finance review", exact: true })
    .click();
  await expect(page.getByRole("alert")).toBeVisible();
  await state(page, "Cancelled");
  await capture(page, info, "stale-exact-version");
  const final = await call(page, `finance/handoffs/${input.id}`);
  expect(final.handoff.status).toBe("Cancelled");
  expect(final.attempts).toHaveLength(0);
});

test("P10 lost save response keeps input and retries the exact original once through UI", async ({
  page,
}, info) => {
  await page.goto("/finance/handoffs");
  await identity(page, "finance");
  const existing = (await call(page, "finance/handoffs")).items.find(
      (h: { status: string }) => h.status === "Reconciled",
    ),
    d = await call(page, `finance/handoffs/${existing.id}`),
    input = await httpFinanceDraft((p, b) => call(page, p, b), {
      report_id: d.revisions[0].source_snapshot.reports[0].report_id,
      reference: "retained exact source",
      work_order_id: d.handoff.work_order_id,
    });
  await call(page, "finance/handoffs", input);
  await page.goto(`/finance/handoffs/${input.id}`);
  await state(page, "Draft");
  await page
    .getByRole("button", { name: "Revise retained draft", exact: true })
    .click();
  await page
    .getByLabel("Reason for this saved revision", { exact: true })
    .fill(
      "SYN lost HTTP response after acceptance; retain and retry this exact original.",
    );
  let original: unknown;
  await page.route(
    `**/api/v1/finance/handoffs/${input.id}/revise`,
    async (route) => {
      original = route.request().postDataJSON();
      const accepted = await route.fetch();
      expect(accepted.status()).toBe(201);
      await route.abort("failed");
    },
    { times: 1 },
  );
  await page
    .getByRole("button", { name: "Save Finance draft", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Retry original action", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Reason for this saved revision", { exact: true }),
  ).toHaveValue(
    "SYN lost HTTP response after acceptance; retain and retry this exact original.",
  );
  await capture(page, info, "accepted-save-response-lost");
  const sent = page.waitForRequest(
    (r) =>
      r.url().endsWith(`/finance/handoffs/${input.id}/revise`) &&
      r.method() === "POST",
  );
  await page
    .getByRole("button", { name: "Retry original action", exact: true })
    .click();
  expect((await sent).postDataJSON()).toEqual(original);
  await expect(
    page.getByRole("button", { name: "Revise retained draft", exact: true }),
  ).toBeVisible();
  const final = await call(page, `finance/handoffs/${input.id}`);
  expect(final.revisions).toHaveLength(2);
  expect(final.attempts).toHaveLength(0);
  await capture(page, info, "accepted-save-original-recovered");
});
