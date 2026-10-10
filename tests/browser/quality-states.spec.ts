import { test, expect } from "../helpers/browser-lifecycle";
import type { Request, Response } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import type { Pack } from "../../src/documents/components/client/job-pack-types";
import { financeHttpSource, httpFinanceDraft } from "../helpers/finance-http";
import { call, identity, capture } from "../helpers/quality-browser";
import { qualityFieldVisit } from "../helpers/quality-field";
import { base, entry, png } from "../helpers/field";
import { operation } from "../helpers/offline";

test.use({ actionTimeout: 15000, navigationTimeout: 60000 });

test("P11 PT-29 pack and report queues never turn failed reads into empty or issued claims", async ({
  page,
}, info) => {
  await call(page, "local-session", { profile: "coordinator" });
  for (const kind of ["packs", "reports"]) {
    await page.route(`**/api/v1/${kind}`, (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          code: "DependencyUnavailable",
          message: `SYN ${kind} unavailable. Retry the read.`,
          retryable: true,
        }),
      }),
    );
    await page.goto(`/service/${kind}`);
    await expect(
      page.getByRole("alert").filter({ hasText: `SYN ${kind} unavailable` }),
    ).toBeVisible();
    await expect(
      page.getByText(
        /^(No job packs are available|No permitted submissions appear)/,
      ),
    ).toHaveCount(0);
    await capture(page, info, `${kind}-failed-not-empty`);
    await page.unroute(`**/api/v1/${kind}`);
  }
  await page.route("**/api/v1/packs", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            display_number: "SYN P11 unissued preparation",
            status: "Draft",
            needs_review: false,
            appointment_id: "22222222-2222-4222-8222-222222222222",
          },
        ],
      }),
    }),
  );
  await page.goto("/service/packs");
  await expect(
    page.getByText("Draft · Not issued", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Draft · Issued", { exact: true })).toHaveCount(
    0,
  );
  await capture(page, info, "draft-pack-not-issued");
});

test("P11 PT-29 failed photo upload retains the selected original and recovers without a false available claim", async ({ page }, info) => {
  test.setTimeout(180000);
  const { job } = await qualityFieldVisit(page, info.project.name.startsWith("mobile") ? "2031-11-14" : "2031-11-13");
  await page.goto(`/my-jobs/${job.id}`);
  await page.getByRole("button", { name: "Photos", exact: true }).click();
  const bytes = png();
  await page.getByLabel("Synthetic photo file").setInputFiles({ name: "SYN-PT29-retained.png", mimeType: "image/png", buffer: bytes });
  await page.getByRole("button", { name: "1. Register photo", exact: true }).click();
  const upload = page.getByRole("button", { name: "2. Upload original bytes", exact: true });
  await expect(upload).toBeVisible();
  const before = (await call(page, `my-jobs/${job.id}`)).items[0].attachments;
  expect(before).toHaveLength(1);
  const path = `**/api/v1/attachments/${before[0].id}/upload`;
  await page.route(path, route => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({
    code: "DependencyUnavailable", message: "SYN upload unavailable. Retry the original photo.", retryable: true,
  }) }));
  await upload.click();
  await expect(page.getByRole("alert").filter({ hasText: "SYN upload unavailable" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Preview original photo", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "3. Verify and make available", exact: true })).toHaveCount(0);
  expect(await page.getByLabel("Synthetic photo file").evaluate((e: HTMLInputElement) => e.files?.[0]?.name)).toBe("SYN-PT29-retained.png");
  expect((await call(page, `my-jobs/${job.id}`)).items[0].attachments).toEqual(before);
  await capture(page, info, "SC-10-upload-failed-original-retained");
  await page.unroute(path);
  // The explicit retry reuses the original command and bytes, without reselecting.
  await page.getByRole("button", { name: "Retry original submission", exact: true }).click();
  await page.getByRole("button", { name: "3. Verify and make available", exact: true }).click();
  await expect(page.getByRole("link", { name: "Preview original photo", exact: true })).toBeVisible();
  const after = (await call(page, `my-jobs/${job.id}`)).items[0].attachments;
  expect(after).toHaveLength(1);
  expect(after[0].id).toBe(before[0].id);
  expect(after[0].status).toBe("Available");
  const response = await page.request.get(`/api/v1/attachments/${after[0].id}/bytes`);
  expect(response.status()).toBe(200);
  expect(await response.body()).toEqual(bytes);
  await capture(page, info, "SC-10-upload-recovered-exact-original");
});

test("P11 PT-29 failed and stale output presentation never claims an issue", async ({ page }, info) => {
  // Deliberate presentation injection into the retained synthetic fixture.
  // Worker rollback/storage recovery is a separate PT-23 persistence proof.
  const read = JSON.parse(await readFile("tests/fixtures/job-pack-read.json", "utf8")) as { items: Pack[] };
  const pack = read.items[0];
  pack.status = "Checked";
  pack.jobs = [{ id: crypto.randomUUID(), revision_id: pack.current_revision_id!, state: "Failed",
    attempts: 1, error_code: "RenderOrStorageFailure", requested_at: "2031-11-05T00:00:00Z",
    recovery_owner_id: "30000000-0000-4000-8000-000000000001", recovery_owner_name: "SYN Coordinator",
    issue_id: null, actor_name: "SYN Coordinator" }];
  expect(pack.current_issue_id).toBeNull();
  await call(page, "local-session", { profile: "coordinator" });
  await page.route(`**/api/v1/packs/${pack.id}`, route => route.fulfill({ json: read }));
  await page.route(`**/api/v1/render-jobs/${pack.jobs[0].id}/retry`, route => route.fulfill({ status: 503, json: {
    code: "DependencyUnavailable", message: "SYN renderer unavailable. Recover the original output.", retryable: true,
  } }));
  await page.goto(`/service/packs/${pack.id}`);
  await expect(page.getByRole("tabpanel", { name: "Job pack, 9 sections", exact: true }).getByText("Output recovery needed", { exact: true })).toBeVisible();
  await expect(page.getByText("The output could not be generated or stored. Recover the original output.", { exact: false }).first()).toBeVisible();
  await page.getByRole("button", { name: "Process or recover original output", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "SYN renderer unavailable" })).toBeVisible();
  await expect(page.locator('a[href^="/documents/"]')).toHaveCount(0);
  await capture(page, info, "SC-06-render-failed-no-issue", { injection: "retained synthetic pack read and renderer 503; not worker proof" });
  pack.jobs[0].state = "StaleSource";
  pack.jobs[0].error_code = "StaleSource";
  await page.reload();
  await expect(page.getByText("The checked source changed", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Process or recover original output", exact: true })).toHaveCount(0);
  await expect(page.getByText("Original attempt retained. Prepare and check a new revision with current sources.", { exact: true })).toBeVisible();
  await capture(page, info, "SC-06-stale-output-requires-successor", { injection: "retained synthetic pack read; not worker proof" });
});

test("P11 PT-29 partial and failed account extractions keep historical totals separate from current values", async ({ page }, info) => {
  await call(page, "local-session", { profile: "finance" });
  const account = (await call(page, "finance/options")).accounts[0];
  await page.goto(`/customers/${account.customer_id}/account?account_id=${account.id}`);
  const balance = page.getByText("Supplied account balance", { exact: true }).locator("..").locator("strong");
  for (const fixture of ["F-01", "F-04", "Failed", "F-01"]) {
    await page.getByLabel("Independent fixture", { exact: true }).selectOption(fixture);
    await page.getByRole("button", { name: "Record synthetic extraction", exact: true }).click();
    await expect(page.getByRole("button", { name: "Record synthetic extraction", exact: true })).toBeEnabled();
    const original = await call(page, `customers/${account.customer_id}/account-observations?account_id=${account.id}`);
    expect(original.current.completeness).toBe(fixture === "F-01" ? "Complete" : fixture === "F-04" ? "Partial" : "Failed");
    await expect(balance).toHaveText(fixture === "F-01" ? "AUD 600.00" : "Unavailable");
    if (fixture !== "F-01") {
      await expect(page.getByText(/Last good observation:/)).toContainText("This is historical; the current total is unavailable.");
      await expect(page.getByText("Separate unapplied cash", { exact: true }).locator("..").locator("strong")).toHaveText("Unknown");
      expect(original.account_balance).toBeNull();
      await capture(page, info, `SC-13-${fixture === "F-04" ? "partial" : "failed-extraction"}`);
    }
  }
  await capture(page, info, "SC-13-complete-extraction-recovered");
});

test("P11 PT-29 stale Finance action preserves current cancellation and safe input", async ({ page }, info) => {
  test.setTimeout(180000);
  const mobile = info.project.name.startsWith("mobile");
  const source = await financeHttpSource((p, b) => call(page, p, b), mobile ? "2031-11-12" : "2031-11-11", mobile ? 81 : 80);
  const input = await httpFinanceDraft((p, b) => call(page, p, b), source);
  await call(page, "finance/handoffs", input);
  await page.goto(`/finance/handoffs/${input.id}`);
  const reason = "SYN retain this review proposal while comparing the concurrent cancellation.";
  await page.getByLabel("Precise action / correction reason", { exact: true }).fill(reason);
  const current = await call(page, `finance/handoffs/${input.id}`);
  await call(page, `finance/handoffs/${input.id}/cancel`, { ...base(), expected_version: current.handoff.version });
  const refused = page.waitForResponse(response => response.request().method() === "POST" && new URL(response.url()).pathname === `/api/v1/finance/handoffs/${input.id}/submit`);
  await page.getByRole("button", { name: "Submit for Finance review", exact: true }).click();
  expect((await refused).status()).toBe(409);
  await expect(page.locator('.business-error[role="alert"]')).toBeVisible();
  await expect(page.getByText("Cancelled", { exact: true }).first()).toBeVisible();
  await expect(page.getByLabel("Precise action / correction reason", { exact: true })).toHaveValue(reason);
  const after = await call(page, `finance/handoffs/${input.id}`);
  expect(after.handoff.status).toBe("Cancelled");
  expect(after.attempts).toHaveLength(0);
  await capture(page, info, "SC-12-stale-action-current-cancellation");
});

test("P11 PT-29 all fifteen screen families show actual loading, failure, recovery and current denial", async ({
  page,
}, info) => {
  test.setTimeout(360000);
  const mobile = info.project.name.startsWith("mobile");
  const source = await financeHttpSource(
    (p, b) => call(page, p, b),
    mobile ? "2031-11-06" : "2031-11-05",
    mobile ? 42 : 41,
  );
  const cmd = await httpFinanceDraft((p, b) => call(page, p, b), source);
  await call(page, "finance/handoffs", cmd);
  const account = await call(page, `customers/${(await call(page, "finance/options")).accounts.find((a: { id: string }) => a.id === cmd.account_id).customer_id}/account-observations?account_id=${cmd.account_id}`);
  await call(page, `finance/accounts/${cmd.account_id}/observe`, {
    ...base(), expected_version: account.account.version, fixture: "F-01",
  });
  // SC-09 and SC-15 must be populated even when this spec runs by itself.
  const field = await qualityFieldVisit(page, mobile ? "2031-11-10" : "2031-11-07");
  const grant = await call(page, `sync/context/${field.job.id}`, {});
  const retained = operation(field.principal, field.job, "Capture", entry(field.job));
  const recovery = await call(page, "sync/recovery", {
    grant_id: grant.recovery.id, token: grant.recovery.token, operation: retained,
  });
  expect(recovery.normal_acceptance).toBe(false);
  await call(page, "local-session", { profile: "coordinator" });
  const report = (await call(page, `reports/${source.report_id}`)).items[0];
  const appointment = report.appointment.id;
  const pack = (await call(page, "packs")).items.find(
    (p: { appointment_id: string }) => p.appointment_id === appointment,
  );
  expect(pack).toBeTruthy();
  const packDetail = (await call(page, `packs/${pack.id}`)).items[0];
  const ticket = (await call(page, "service/tickets")).items[0];
  const customer = report.revisions[0].snapshot.customer.id;
  const matrix = [
    {
      id: "SC-01",
      // My actions is SC-01's list read; the Overview's own states are proved in my-work.spec.ts.
      url: "/work/actions",
      api: "work/actions",
      profile: "coordinator",
      list: true,
      refresh: "Refresh activities",
    },
    {
      id: "SC-02",
      url: "/customers",
      api: "crm/directory",
      profile: "coordinator",
      list: true,
    },
    {
      id: "SC-03",
      url: "/sites/70000000-0000-4000-8000-000000000001",
      api: "sites/70000000-0000-4000-8000-000000000001",
      profile: "coordinator",
    },
    {
      id: "SC-04",
      url: `/service/tickets/${ticket.id}`,
      api: `service/tickets/${ticket.id}`,
      profile: "coordinator",
    },
    {
      id: "SC-05",
      url: `/service/work-orders/${source.work_order_id}`,
      api: `service/work-orders/${source.work_order_id}`,
      profile: "coordinator",
      refresh: "Compare saved version",
    },
    {
      id: "SC-06",
      url: `/service/packs/${pack.id}`,
      api: `packs/${pack.id}`,
      profile: "coordinator",
    },
    {
      id: "SC-07",
      url: `/schedule?day=${mobile ? "2031-11-06" : "2031-11-05"}&view=day`,
      api: "schedule",
      profile: "coordinator",
      list: true,
      refresh: "Refresh planner",
    },
    {
      id: "SC-08",
      url: `/service/appointments/${appointment}`,
      api: `appointments/${appointment}`,
      profile: "coordinator",
    },
    {
      id: "SC-09",
      url: "/my-jobs",
      api: "my-jobs",
      profile: "assigned-technician",
      list: true,
      refresh: "Refresh jobs",
    },
    {
      id: "SC-10",
      url: `/my-jobs/${appointment}`,
      api: `my-jobs/${appointment}`,
      profile: "assigned-technician",
      refresh: "Refresh job",
    },
    {
      id: "SC-11",
      url: `/service/reports/${source.report_id}`,
      api: `reports/${source.report_id}`,
      profile: "coordinator",
      refresh: "Refresh exact report",
    },
    {
      id: "SC-12",
      url: "/finance/handoffs",
      api: "finance/handoffs",
      profile: "finance",
      list: true,
      refresh: "Refresh queue",
    },
    {
      id: "SC-13",
      url: `/customers/${customer}/account?account_id=${cmd.account_id}`,
      api: `customers/${customer}/account-observations`,
      profile: "finance",
      refresh: "Refresh observations",
    },
    {
      id: "SC-14",
      url: `/documents/${packDetail.current_issue_id}`,
      api: `pack-issues/${packDetail.current_issue_id}/manifest`,
      profile: "coordinator",
    },
    {
      id: "SC-15",
      url: "/admin",
      api: "sync/recovery-review",
      profile: "coordinator",
      list: true,
      refresh: "Refresh recovery cases",
    },
  ];
  const proof: unknown[] = [];
  for (const s of matrix) {
    await test.step(`${s.id}: ${s.url}`, async () => {
      const screenLoading = page
        .locator("main")
        .getByText(/^(?:.*\s)?Loading .*…$/);
      await call(page, "local-session", { profile: s.profile });
      const loadedRead = page.waitForResponse((response) =>
        new URL(response.url()).pathname === `/api/v1/${s.api}` &&
        response.request().method() === "GET" && response.status() === 200,
        { timeout: 60000 });
      // The screen contract is the authorised read and rendered state. A dev
      // document's unrelated load event is not the selected record's readiness.
      const [loaded] = await Promise.all([
        loadedRead,
        page.goto(s.url, { waitUntil: "domcontentloaded" }),
      ]);
      const query = new URL(loaded.url()).search;
      const original = await loaded.json();
      expect(loaded.headers()["cache-control"]).toBe("private, no-store");
      await expect(page.getByRole("region", { name: "Local demonstration identity", exact: true })).toHaveAttribute("aria-busy", "false");
      await expect(page.getByRole("button", { name: "Change identity", exact: true })).toBeEnabled();
      await expect(page.locator('.business-error[role="alert"]')).toHaveCount(0);
      await expect(screenLoading).toHaveCount(0);
      // Successful status alone is not populated proof. Assert a record from
      // this browser's exact response is actually rendered in the main region.
      if (s.id !== "SC-13" && s.id !== "SC-14") expect(original.items.length, s.id).toBeGreaterThan(0);
      const record = original.items?.[0];
      const populatedLabel: string = s.id === "SC-13" ? original.current.observations[0].id
        : s.id === "SC-14" ? original.filename
        : s.id === "SC-15" ? record.operation_id
        : s.id === "SC-01" ? record.summary
        : record.display_number ?? record.reference ?? record.display_name;
      expect(populatedLabel, `${s.id}: visible source label`).toBeTruthy();
      await expect(page.locator("main")).toContainText(populatedLabel);
      if (s.id === "SC-13") {
        expect(original.current.observations.length).toBeGreaterThan(0);
        await expect(page.locator("tbody tr").first()).toBeVisible();
      }
      if (s.id === "SC-08") {
        await expect(page.getByRole("banner").locator(".ppo-crumb-current")).toHaveText("Schedule");
        await expect(page.getByRole("banner").locator(".ppo-crumb-current")).toBeVisible();
        // The workspace rail/phone destinations replace the duplicate Service
        // header tabs. Schedule keeps its current breadcrumb and owned page.
        await expect(page.getByRole("banner").locator(".module-navigation")).toHaveCount(0);
      }
      if (s.id === "SC-14") {
        await expect(page.getByRole("banner").locator(".ppo-crumb-current")).toHaveText("Documents");
        await expect(page.getByRole("banner").locator(".ppo-crumb-current")).toBeVisible();
      }
      await capture(page, info, `${s.id}-loaded`);
      const match = (url: URL) => url.pathname === `/api/v1/${s.api}`;
      let release: () => void = () => {};
      const wait = new Promise<void>((r) => {
        release = r;
      });
      await page.route(match, async (route) => {
        await wait;
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({
            code: "DependencyUnavailable",
            message: `SYN ${s.id} current read unavailable. Retry loading.`,
            retryable: true,
          }),
        });
      });
      try {
        const refresh = s.refresh
          ? page.getByRole("button", { name: s.refresh, exact: true })
          : null;
        if (refresh && (await refresh.count())) await refresh.click();
        else await page.reload({ waitUntil: "domcontentloaded" });
        await expect
          .poll(async () => {
            for (let i = 0; i < (await screenLoading.count()); i++) {
              if (await screenLoading.nth(i).isVisible()) return true;
            }
            return false;
          })
          .toBe(true);
        await expect(
          page.getByRole("heading", {
            name: "Current page summary",
            exact: true,
          }),
        ).toHaveCount(0);
        if (s.id === "SC-07")
          await expect(page.locator(".planner-stat-row strong")).toHaveText(
            Array(4).fill("—"),
          );
        await capture(page, info, `${s.id}-loading`);
      } finally {
        release();
      }
      await expect(
        page
          .getByRole("alert")
          .filter({ hasText: `SYN ${s.id} current read unavailable` }),
      ).toBeVisible();
      await expect(screenLoading).toHaveCount(0);
      await expect(
        page.getByText(
          /^(No permitted (activities|service requests|submissions)|No current assigned visits|No Finance handoffs|No job packs are available)/,
        ),
      ).toHaveCount(0);
      await expect(
        page.getByRole("heading", { name: "Current page summary", exact: true }),
      ).toHaveCount(0);
      await capture(page, info, `${s.id}-failed`);
      await page.unroute(match);
      if (s.id === "SC-01") {
        // Keep the real authorised response, but deliver it after the ordinary
        // five-second assertion window. Recovery must await the read itself.
        let delivery: Promise<void> | undefined;
        await page.route(match, async (route) => {
          const response = await route.fetch();
          delivery ??= new Promise((resolve) => setTimeout(resolve, 6500));
          await delivery;
          await route.fulfill({ response });
        });
      }
      const recoveredRead = page.waitForResponse((response) =>
        match(new URL(response.url())) && response.request().method() === "GET" && response.status() === 200,
      { timeout: 60000 });
      await Promise.all([recoveredRead, page.reload({ waitUntil: "domcontentloaded" })]);
      await expect(page.locator('.business-error[role="alert"]')).toHaveCount(0);
      await expect(screenLoading).toHaveCount(0);
      if (s.id === "SC-01") {
        await capture(page, info, `${s.id}-recovered`);
        await page.unroute(match);
      }
      if (s.id === "SC-14") {
        // Applicability is a separate authorised read from immutable metadata.
        // A failed current-status read must not retain a current-use claim.
        const statusMatch = (url: URL) =>
          url.pathname === `/api/v1/pack-issues/${packDetail.current_issue_id}`;
        await page.route(statusMatch, (route) =>
          route.fulfill({
            status: 503,
            contentType: "application/json",
            body: JSON.stringify({
              code: "DependencyUnavailable",
              message: "SYN current applicability unavailable. Retry this read.",
              retryable: true,
            }),
          }),
        );
        await page.reload({ waitUntil: "domcontentloaded" });
        await expect(
          page
            .locator('.business-error[role="alert"]')
            .filter({ hasText: "SYN current applicability unavailable" }),
        ).toBeVisible();
        await expect(
          page.getByText("Current applicable issue", { exact: true }),
        ).toHaveCount(0);
        await expect(
          page.getByText("Not currently applicable", { exact: true }),
        ).toHaveCount(0);
        await capture(page, info, "SC-14-applicability-failed-no-current-claim");
        await page.unroute(statusMatch);
        await page.route(statusMatch, (route) =>
          route.fulfill({
            status: 403,
            contentType: "application/json",
            body: JSON.stringify({
              code: "Forbidden",
              message: "SYN current issue access revoked.",
              retryable: false,
            }),
          }),
        );
        await page.reload({ waitUntil: "domcontentloaded" });
        await expect(
          page
            .locator('.business-error[role="alert"]')
            .filter({ hasText: "SYN current issue access revoked" }),
        ).toBeVisible();
        await expect(
          page.getByRole("link", { name: "Download exact A4 PDF", exact: true }),
        ).toHaveCount(0);
        await expect(
          page.getByRole("heading", {
            name: packDetail.issues[0].manifest.filename,
            exact: true,
          }),
        ).toHaveCount(0);
        await capture(page, info, "SC-14-secondary-denial-clears-manifest");
        await page.unroute(statusMatch);
      }
      if (s.list) {
        await page.route(match, (route) =>
          route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ ...original, items: [], total: 0, next_cursor: null }),
          }),
        );
        await page.reload({ waitUntil: "domcontentloaded" });
        await expect(screenLoading).toHaveCount(0);
        await expect(
          page
            .getByText(/No (permitted|current assigned|Finance handoffs)/)
            .first(),
        ).toBeVisible();
        await capture(page, info, `${s.id}-empty`);
        await page.unroute(match);
      } else if (s.id === "SC-13") {
        await page.route(match, route => route.fulfill({ status: 200, contentType: "application/json",
          body: JSON.stringify({ ...original, current: null, last_good: null, history: [], account_balance: null, unapplied_cash: null, balance_status: "Unavailable" }),
        }));
        await page.reload({ waitUntil: "domcontentloaded" });
        await expect(page.getByText("No extraction recorded. Account total unavailable.", { exact: true })).toBeVisible();
        await expect(page.getByText("Supplied account balance", { exact: true }).locator("..").locator("strong")).toHaveText("Unavailable");
        await expect(page.locator("tbody tr")).toHaveCount(0);
        await capture(page, info, `${s.id}-no-extraction`);
        await page.unroute(match);
      } else {
        let unavailableRequested = false;
        let releaseUnavailable: () => void = () => {};
        const unavailableReady = new Promise<void>((resolve) => {
          releaseUnavailable = resolve;
        });
        await page.route(match, async (route) => {
          unavailableRequested = true;
          await unavailableReady;
          await route.fulfill({
            status: 404,
            contentType: "application/json",
            body: JSON.stringify({
              code: "RecordUnavailable",
              message: "The requested record is unavailable to this identity.",
              retryable: false,
            }),
          });
        });
        // The unavailable-record assertion starts after the actual selected
        // read, not while the independent identity prerequisite is loading.
        try {
          await page.reload({ waitUntil: "domcontentloaded" });
          await expect(page.getByRole("region", { name: "Local demonstration identity", exact: true }))
            .toHaveAttribute("aria-busy", "false");
          await expect.poll(() => unavailableRequested, {
            timeout: 15000, message: `${s.id}: selected record read requested`,
          }).toBe(true);
          const unavailableResponse = page.waitForResponse((response) =>
            new URL(response.url()).pathname === `/api/v1/${s.api}` &&
            response.request().method() === "GET" && response.status() === 404,
            { timeout: 15000 });
          releaseUnavailable();
          await unavailableResponse;
        } finally {
          releaseUnavailable();
        }
        await expect(
          page
            .getByRole("alert")
            .filter({ hasText: "requested record is unavailable" }),
        ).toBeVisible();
        await capture(page, info, `${s.id}-unavailable-record`);
        await page.unroute(match);
      }
      // Assert the screen's real server-derived Systems denial. Observing the
      // selected read avoids introducing a second auxiliary request beside the
      // UI request whose response and rendered error form this contract.
      // Only requests started after the accepted identity change may satisfy it.
      let identityAccepted = false;
      const currentReads = new WeakSet<Request>();
      const acceptedIdentity = (response: Response) => {
        if (new URL(response.url()).pathname === "/api/v1/local-session" &&
            response.request().method() === "POST" && response.status() === 200)
          identityAccepted = true;
      };
      const currentRead = (request: Request) => {
        if (identityAccepted && request.method() === "GET" &&
            new URL(request.url()).pathname === `/api/v1/${s.api}`)
          currentReads.add(request);
      };
      page.on("response", acceptedIdentity).on("request", currentRead);
      let denied: Response;
      try {
        [denied] = await Promise.all([
          page.waitForResponse(response => currentReads.has(response.request())),
          identity(page, "systems"),
        ]);
      } finally {
        page.off("response", acceptedIdentity).off("request", currentRead);
      }
      const deniedQuery = new URL(denied.url()).searchParams;
      for (const [key, value] of new URLSearchParams(query)) {
        const actual = deniedQuery.get(key);
        expect(actual, `${s.id}: ${key}`).not.toBeNull();
        if (key === "from" || key === "to")
          expect(Date.parse(actual!), `${s.id}: ${key}`).toBe(Date.parse(value));
        else expect(actual, `${s.id}: ${key}`).toBe(value);
      }
      expect([403, 404], s.id).toContain(denied.status());
      expect(denied.headers()["cache-control"]).toBe("private, no-store");
      const deniedBody = await denied.json();
      await expect(
        page
          .locator('.business-error[role="alert"]')
          .filter({ hasText: deniedBody.message })
          .first(),
      ).toBeVisible();
      await expect(screenLoading).toHaveCount(0);
      await expect(
        page.getByRole("heading", {
          name: "SYN Greenhouse Demonstration",
          exact: true,
        }),
      ).toHaveCount(0);
      expect(JSON.stringify(deniedBody)).not.toContain(source.report_id);
      await expect(
        page.getByRole("heading", { name: "Current page summary", exact: true }),
      ).toHaveCount(0);
      await capture(page, info, `${s.id}-denied`);
      proof.push({
        screen: s.id,
        route: s.url,
        read: s.api,
        profile: s.profile,
        populated_label: populatedLabel,
        populated_source: "Actual browser GET 200; visible record asserted",
        query,
        denied_status: denied.status(),
        denial_source: "Browser GET after accepted identity POST",
        states: [
          "populated",
          "loading",
          "failed",
          "recovered",
          s.list ? "empty permitted result" : s.id === "SC-13" ? "no extraction; total unavailable" : "unavailable detail record",
          "actual Systems denial",
        ],
        empty_detail_basis: s.list || s.id === "SC-13"
          ? null
          : "Detail APIs return unavailable for no permitted record; an empty success object is not fabricated.",
        limits:
          "Injected read failures prove UI states. Existing domain suites prove actual server failure/rollback. No screen-reader or whole-product conformance claim.",
      });
    });
  }
  await writeFile(
    info.outputPath("P11-screen-state-matrix.json"),
    JSON.stringify(proof, null, 2),
  );
});
