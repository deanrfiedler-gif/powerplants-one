import { test, expect } from "../helpers/browser-lifecycle";
import type { Request, Response } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { financeHttpSource, httpFinanceDraft } from "../helpers/finance-http";
import { call, identity, capture } from "../helpers/quality-browser";

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

test("P11 PT-29 all fifteen screen families show actual loading, failure, recovery and current denial", async ({
  page,
}, info) => {
  test.setTimeout(360000);
  const mobile = info.project.name.startsWith("mobile");
  const source = await financeHttpSource(
    (p, b) => call(page, p, b),
    mobile ? "2026-11-05" : "2026-11-04",
    mobile ? 42 : 41,
  );
  const cmd = await httpFinanceDraft((p, b) => call(page, p, b), source);
  await call(page, "finance/handoffs", cmd);
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
      url: "/work",
      api: "work",
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
      url: "/schedule",
      api: "schedule",
      profile: "coordinator",
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
      await call(page, "local-session", { profile: s.profile });
      const query =
        s.id === "SC-02" ? "?kind=organisations" :
        s.id === "SC-13"
          ? `?account_id=${cmd.account_id}`
          : s.id === "SC-07"
            ? "?from=2026-09-20T14:00:00Z&to=2026-09-27T14:00:00Z&timezone=Australia%2FBrisbane"
            : "";
      const original = await call(page, s.api + query);
      const loadedRead = page.waitForResponse((response) =>
        new URL(response.url()).pathname === `/api/v1/${s.api}` &&
        response.request().method() === "GET" && response.status() === 200,
        { timeout: 60000 });
      // The screen contract is the authorised read and rendered state. A dev
      // document's unrelated load event is not the selected record's readiness.
      await Promise.all([
        loadedRead,
        page.goto(s.url, { waitUntil: "domcontentloaded" }),
      ]);
      await expect(page.getByRole("region", { name: "Local demonstration identity", exact: true })).toHaveAttribute("aria-busy", "false");
      await expect(page.getByRole("button", { name: "Change identity", exact: true })).toBeEnabled();
      await expect(page.locator('.business-error[role="alert"]')).toHaveCount(0);
      await expect(page.getByText(/^Loading .*…$/)).toHaveCount(0);
      if (s.id === "SC-08") {
        await expect(page.getByRole("banner").getByText("Service", { exact: true })).toBeVisible();
        await expect(page.getByRole("navigation", { name: "Service navigation", exact: true })
          .getByRole("link", { name: "Service planner", exact: true })).toHaveAttribute("aria-current", "page");
      }
      if (s.id === "SC-14") {
        await expect(page.getByRole("banner").getByText("Documents", { exact: true })).toBeVisible();
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
          .poll(async () =>
            page
              .locator("main")
              .getByText(/^Loading .*…$/)
              .evaluateAll(
                (nodes) =>
                  nodes.filter(
                    (node) =>
                      node instanceof HTMLElement &&
                      (typeof node.checkVisibility !== "function" ||
                        node.checkVisibility()),
                  ).length,
              ),
          )
          .toBeGreaterThan(0);
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
      await expect(page.getByText(/^Loading .*…$/)).toHaveCount(0);
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
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(page.locator('.business-error[role="alert"]')).toHaveCount(0);
      await expect(page.getByText(/^Loading .*…$/)).toHaveCount(0);
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
            body: JSON.stringify({ ...original, items: [], next_cursor: null }),
          }),
        );
        await page.reload({ waitUntil: "domcontentloaded" });
        await expect(page.getByText(/^Loading .*…$/)).toHaveCount(0);
        await expect(
          page
            .getByText(/No (permitted|current assigned|Finance handoffs)/)
            .first(),
        ).toBeVisible();
        await capture(page, info, `${s.id}-empty`);
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
      await expect(page.getByText(/^Loading .*…$/)).toHaveCount(0);
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
        denied_status: denied.status(),
        denial_source: "Browser GET after accepted identity POST",
        states: [
          "loaded",
          "loading",
          "failed",
          "recovered",
          s.list ? "empty permitted result" : "unavailable detail record",
          "actual Systems denial",
        ],
        empty_detail_basis: s.list
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
