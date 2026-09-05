import { test, expect, type Page } from "@playwright/test";
const id = (t: number, n = 1) =>
  `${t}000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
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
  await expect(
    page.getByText("Loading permitted records…", { exact: true }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: info.outputPath(name), fullPage: true });
}
test("P04 SC-05 draft, authority refusal, dispute, identity limits, mandatory blocker, exception and approved history", async ({
  page,
}, info) => {
  await page.goto("/service/work-orders");
  await identity(page);
  await expect(
    page.getByRole("heading", { name: "Work orders", exact: true }),
  ).toBeVisible();
  await capture(page, info, "P04-list.png");
  for (const [n, name] of [
    [1, "draft"],
    [2, "authorised"],
    [3, "authority-missing"],
    [4, "disputed"],
    [5, "unresolved"],
    [6, "mandatory-blocker"],
    [7, "permitted-exception"],
    [8, "successor"],
    [9, "identification-plan"],
  ] as const) {
    await page.goto(`/service/work-orders/${id(90, n)}`);
    await expect(
      page.getByRole("heading", { name: "Work authorisation", exact: true }),
    ).toBeVisible();
    if (n === 2)
      await expect(
        page.getByText("Authorised scope — read-only", { exact: true }),
      ).toBeVisible();
    if (n === 8) {
      await page
        .getByText("Scope r01 — Authorised, read-only", { exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: "Scope revision history" }),
      ).toBeVisible();
    }
    await capture(page, info, `P04-${name}.png`);
  }
  await page.goto(`/service/work-orders/${id(90, 3)}`);
  await page
    .getByRole("button", { name: "Authorise current scope", exact: true })
    .click();
  await expect(page.locator(".business-error[role=alert]")).toContainText(
    "Resolve the work-authorisation blockers",
  );
  await capture(page, info, "P04-authorisation-refusal.png");
});
test("P04 forms retain invalid and stale proposals with explicit comparison; keyboard and phone layouts", async ({
  page,
}, info) => {
  await page.goto(`/service/work-orders/${id(90, 3)}`);
  await identity(page);
  await page.getByText("Edit scope draft", { exact: true }).click();
  const summary = page.getByLabel("Scope summary", { exact: true });
  await summary.fill(
    "SYN retained long scope proposal\n" +
      "Inspect the external display and retain uncertainty. ".repeat(15),
  );
  await summary.focus();
  await capture(page, info, "P04-scope-form-focus.png");
  await page.getByLabel("Task description", { exact: true }).fill("");
  await page
    .getByRole("button", { name: "Save scope draft", exact: true })
    .click();
  await expect(page.locator(".business-error[role=alert]")).toContainText(
    "Check the highlighted details",
  );
  await expect(summary).toHaveValue(/SYN retained long scope proposal/);
  await expect(
    page.getByLabel("Task description", { exact: true }),
  ).toHaveAttribute("aria-invalid", "true");
  await capture(page, info, "P04-validation-retained.png");
  await page
    .getByLabel("Task description", { exact: true })
    .fill("SYN original proposal retained after conflict");
  await page.route(
    `**/api/v1/service/work-orders/${id(90, 3)}/save-scope`,
    async (route) => {
      await route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({
          code: "VersionConflict",
          message:
            "This work order changed. Keep your proposal and compare the saved version.",
          field_errors: [],
          retryable: false,
        }),
      });
    },
  );
  await page
    .getByRole("button", { name: "Save scope draft", exact: true })
    .click();
  await expect(page.locator(".business-error[role=alert]")).toContainText(
    "This work order changed",
  );
  await expect(summary).toHaveValue(/SYN retained long scope proposal/);
  await capture(page, info, "P04-conflict-retained.png");
  await page.unrouteAll();
  await page.goto(`/service/work-orders/${id(90, 7)}`);
  await page
    .getByText("Review proposed visit preparation", { exact: true })
    .click();
  const preparation = page
    .locator("details")
    .filter({
      has: page.locator("summary", {
        hasText: "Review proposed visit preparation",
      }),
    });
  await preparation
    .getByLabel("Readiness criterion", { exact: true })
    .selectOption("ToolPreparation");
  await preparation
    .getByLabel("Readiness decision", { exact: true })
    .selectOption("PermittedException");
  await capture(page, info, "P04-preparation-review-form.png");
  await page.goto(`/service/work-orders/${id(90, 1)}`);
  await page.getByText("Propose a visit", { exact: true }).click();
  await capture(page, info, "P04-proposed-visit-form.png");
});
test("P04 creation, exact uncertain retry, scoped empty results and Systems refusal", async ({
  page,
}, info) => {
  await page.goto("/service/work-orders/new");
  await identity(page);
  await page
    .getByLabel("Company context", { exact: true })
    .selectOption(id(20));
  await page.getByLabel("Service site", { exact: true }).selectOption(id(70));
  await page
    .getByLabel("Customer at this site", { exact: true })
    .selectOption(id(50));
  await page.getByLabel("Service owner", { exact: true }).selectOption(id(30));
  await page
    .getByLabel("Service request to link", { exact: true })
    .selectOption(id(40, 20));
  await page
    .getByRole("button", { name: "Link service request", exact: true })
    .click();
  await page
    .getByLabel("Purpose of these linked requests", { exact: true })
    .fill("SYN browser explicit source context");
  await capture(page, info, "P04-create-form.png");
  let first = true;
  const payloads: string[] = [];
  await page.route("**/api/v1/service/work-orders", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    payloads.push(route.request().postData()!);
    const response = await route.fetch();
    if (first) {
      first = false;
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: "unreadable accepted response",
      });
    } else await route.fulfill({ response });
  });
  await page
    .getByRole("button", { name: "Save draft work order", exact: true })
    .click();
  await expect(page.locator(".business-error[role=alert]")).toContainText(
    "server response could not be read",
  );
  await capture(page, info, "P04-uncertain-retry.png");
  await page
    .getByRole("button", { name: "Save draft work order", exact: true })
    .click();
  await expect(page).toHaveURL(/\/service\/work-orders\/[a-f0-9-]+$/);
  expect(payloads).toHaveLength(2);
  expect(payloads[0]).toBe(payloads[1]);
  await capture(page, info, "P04-created-empty-scope.png");
  await page.unrouteAll();
  await page.goto("/service/work-orders");
  await page
    .getByLabel("Search work orders", { exact: true })
    .fill("SYN no matching work 748291");
  await expect(
    page.getByRole("heading", { name: "No work orders in this view" }),
  ).toBeVisible();
  await capture(page, info, "P04-empty.png");
  await identity(page, "systems");
  await expect(page.locator(".business-error[role=alert]")).toBeVisible();
  await capture(page, info, "P04-systems-refusal.png");
});

test("P04 saved scope, reviewed readiness, authorisation, proposed visit and successor preserve approved evidence", async ({
  page,
}, info) => {
  test.setTimeout(90000);
  await page.goto("/service/work-orders");
  await identity(page);
  async function post(path: string, fields: object) {
    const response = await page.request.post(
      `/api/v1/service/work-orders${path}`,
      {
        headers: { Origin: "http://127.0.0.1:3000" },
        data: {
          operation_id: crypto.randomUUID(),
          schema_version: 1,
          reason: "SYN browser fixture preparation",
          ...fields,
        },
      },
    );
    expect(response.ok(), await response.text()).toBe(true);
    return response.json();
  }
  const evidence = {
    title: "SYN reviewed authority",
    source_reference: "SYN-PPO-EVIDENCE-BROWSER",
    source_version: "1",
    content_text:
      "SYN manual review of external inspection only. No financial approval.",
  };
  const wo = crypto.randomUUID();
  await post("", {
    id: wo,
    company_id: id(20),
    site_id: id(70),
    customer_id: id(50),
    service_owner_id: id(30),
    tickets: [
      {
        ticket_id: id(40, 20),
        issue_disposition: "SYN bounded browser review",
      },
    ],
  });
  await post(`/${wo}/save-scope`, {
    expected_version: 1,
    scope: {
      summary: "SYN browser inspection",
      exclusions: "No intervention or extra work",
      diagnostic_limit: "External visual inspection only",
      pending_account_plan: "SYN Finance review remains outstanding",
      authority_evidence: evidence,
      coverage: {
        status: "Disputed",
        assessment: "SYN coverage dispute retained",
        reason: "SYN review pending",
        charging_route: "FinanceReview",
      },
      items: [
        {
          task_kind: "Inspection",
          task_description: "Inspect external display",
          expected_outcome: "Record display state",
          completion_requirements: ["Record observations"],
          required_skill_codes: [],
          assets: [{ asset_id: id(80) }],
        },
      ],
    },
  });
  await page.goto(`/service/work-orders/${wo}`);
  await page.getByText("Edit scope draft", { exact: true }).click();
  await page
    .getByLabel("Scope summary", { exact: true })
    .fill("SYN browser saved inspection scope");
  await page
    .getByRole("button", { name: "Save scope draft", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "SYN browser saved inspection scope",
      exact: true,
    }),
  ).toBeVisible();
  async function savedOrder() {
    return (
      await (await page.request.get(`/api/v1/service/work-orders/${wo}`)).json()
    ).items[0];
  }
  for (const criterion_code of [
    "SiteControls",
    "CompetencyPlan",
    "MandatoryIsolation",
    "ShutdownAuthority",
  ]) {
    const w = await savedOrder(),
      r = w.scopes[0];
    await post(`/${wo}/readiness`, {
      expected_version: w.version,
      assessment: {
        scope_revision_id: r.id,
        scope_version: r.version,
        criterion_code,
        outcome: ["MandatoryIsolation", "ShutdownAuthority"].includes(
          criterion_code,
        )
          ? "NotApplicable"
          : "Pass",
        reason: "SYN reviewed non-intervention evidence",
        evidence,
        source_as_at: "2026-09-05T00:00:00Z",
      },
    });
  }
  await page.reload();
  await page.getByText("Review a readiness criterion", { exact: true }).click();
  await page
    .getByLabel("Readiness criterion", { exact: true })
    .selectOption("SiteAccess");
  await page
    .getByLabel("Readiness decision", { exact: true })
    .selectOption("Pass");
  await page
    .getByLabel("Review reason", { exact: true })
    .fill("SYN reviewed site access evidence");
  await page
    .getByLabel("Evidence source time (your device timezone)", { exact: true })
    .fill("2026-09-05T00:00");
  // Scope edit evidence fields are in a closed details; use the visible review form.
  const review = page.locator("form").filter({
    has: page.getByRole("button", {
      name: "Record readiness review",
      exact: true,
    }),
  });
  await review
    .getByLabel("Evidence title", { exact: true })
    .fill(evidence.title);
  await review
    .getByLabel("Synthetic source reference", { exact: true })
    .fill(evidence.source_reference);
  await review
    .getByLabel("Source version", { exact: true })
    .fill(evidence.source_version);
  await review
    .getByLabel("Exact manual evidence", { exact: true })
    .fill(evidence.content_text);
  await review
    .getByRole("button", { name: "Record readiness review", exact: true })
    .click();
  await expect(
    page.getByText(
      "The saved scope is ready for an authorised reviewer’s decision.",
      { exact: true },
    ),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Authorise current scope", exact: true })
    .click();
  await expect(
    page.getByText("Authorised scope — read-only", { exact: true }),
  ).toBeVisible();
  const approved = (await savedOrder()).scopes[0];
  await capture(page, info, "P04-authorised-through-ui.png");
  await page.reload();
  await page.getByText("Propose a visit", { exact: true }).click();
  await page
    .getByLabel("Proposed start (device timezone)", { exact: true })
    .fill("2026-09-20T09:00");
  await page
    .getByLabel("Proposed finish (device timezone)", { exact: true })
    .fill("2026-09-20T11:00");
  await page
    .getByRole("button", { name: "Save proposed visit", exact: true })
    .click();
  await expect(
    page.getByText("No visits proposed yet.", { exact: true }),
  ).toHaveCount(0);
  expect((await savedOrder()).visits[0].status).toBe("Proposed");
  await capture(page, info, "P04-visit-saved-through-ui.png");
  await page.reload();
  await page.getByText("Create successor scope", { exact: true }).click();
  await page
    .getByLabel("Reason for successor scope", { exact: true })
    .fill(
      "SYN additional external observations only; no shutdown or intervention",
    );
  await page
    .getByLabel("Scope summary", { exact: true })
    .fill("SYN reviewed successor proposal");
  await page
    .getByRole("button", { name: "Create successor draft", exact: true })
    .click();
  await expect(
    page.getByText("Successor draft awaiting authorisation", { exact: true }),
  ).toBeVisible();
  const after = await savedOrder();
  expect(
    after.scopes.find((s: { id: string }) => s.id === approved.id).content_hash,
  ).toBe(approved.content_hash);
  expect(after.scopes[0].coverage.status).toBe("Disputed");
  expect(after.financial_disposition).toBe("PendingFinanceReview");
  await capture(page, info, "P04-successor-saved-through-ui.png");
});
