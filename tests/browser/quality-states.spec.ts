import { test, expect } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { financeHttpSource, httpFinanceDraft } from "../helpers/finance-http";
import { call, identity, capture } from "../helpers/quality-browser";

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
      api: "customers",
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
    await call(page, "local-session", { profile: s.profile });
    const query =
      s.id === "SC-13"
        ? `?account_id=${cmd.account_id}`
        : s.id === "SC-07"
          ? "?from=2026-09-20T14:00:00Z&to=2026-09-27T14:00:00Z&timezone=Australia%2FBrisbane"
          : "";
    const original = await call(page, s.api + query);
    await page.goto(s.url);
    await expect(page.locator("#business-profile")).toBeEnabled();
    await expect(page.locator('.business-error[role="alert"]')).toHaveCount(0);
    await expect(page.getByText(/^Loading .*…$/)).toHaveCount(0);
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
      else await page.reload();
      await expect(page.getByText(/^Loading .*…$/).first()).toBeVisible();
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
    await capture(page, info, `${s.id}-failed`);
    await page.unroute(match);
    await page.reload();
    await expect(page.locator('.business-error[role="alert"]')).toHaveCount(0);
    await expect(page.getByText(/^Loading .*…$/)).toHaveCount(0);
    if (s.list) {
      await page.route(match, (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ...original, items: [], next_cursor: null }),
        }),
      );
      await page.reload();
      await expect(page.getByText(/^Loading .*…$/)).toHaveCount(0);
      await expect(
        page
          .getByText(/No (permitted|current assigned|Finance handoffs)/)
          .first(),
      ).toBeVisible();
      await capture(page, info, `${s.id}-empty`);
      await page.unroute(match);
    } else {
      await page.route(match, (route) =>
        route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({
            code: "RecordUnavailable",
            message: "The requested record is unavailable to this identity.",
            retryable: false,
          }),
        }),
      );
      await page.reload();
      await expect(
        page
          .getByRole("alert")
          .filter({ hasText: "requested record is unavailable" }),
      ).toBeVisible();
      await capture(page, info, `${s.id}-unavailable-record`);
      await page.unroute(match);
    }
    // Real server-derived Systems identity; no mocked role or denial response.
    await identity(page, "systems");
    const denied = await page.request.get(`/api/v1/${s.api}${query}`);
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
    await capture(page, info, `${s.id}-denied`);
    proof.push({
      screen: s.id,
      route: s.url,
      read: s.api,
      profile: s.profile,
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
  }
  await writeFile(
    info.outputPath("P11-screen-state-matrix.json"),
    JSON.stringify(proof, null, 2),
  );
});
