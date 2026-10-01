import {
  test,
  expect,
  type Page,
  type APIRequestContext,
} from "@playwright/test";
import { closeDatabase } from "../../src/platform/database";
import {
  setupPolicy,
  reviewed,
  rows,
  populationBooking,
  reviewerId,
} from "../helpers/policy-commands";
import { confirmed } from "../helpers/packs";
import { publishSchedulingPolicy } from "../../src/scheduling/policy-commands";

const root = "/schedule/policy-impact";
const origin = `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`;
async function login(request: APIRequestContext, profile: string) {
  const r = await request.post("/api/v1/local-session", {
    headers: { Origin: origin },
    data: { profile },
  });
  expect(r.ok(), await r.text()).toBeTruthy();
}
async function switchTo(page: Page, profile: string) {
  await page
    .getByRole("button", { name: "Change identity", exact: true })
    .click();
  await page.getByLabel("Identity", { exact: true }).selectOption(profile);
  const response = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/v1/local-session") &&
      r.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Use this identity", exact: true })
    .click();
  expect((await response).ok()).toBeTruthy();
  await expect(
    page.getByRole("region", { name: "Local demonstration identity" }),
  ).toHaveAttribute("aria-busy", "false");
}
async function propose(
  page: Page,
  minutes = "60",
  effective = "2031-09-22T10:00",
) {
  await page
    .getByLabel("Maximum visit duration (minutes)", { exact: true })
    .fill(minutes);
  await page
    .getByLabel("Effective local time", { exact: true })
    .fill(effective);
  await page
    .getByLabel("Proposal reason", { exact: true })
    .fill("SYN native immutable proposal proof");
  const result = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/v1/schedule/policy-proposals") &&
      r.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Save immutable proposal", exact: true })
    .click();
  const response = await result;
  expect(response.status(), await response.text()).toBe(201);
  const receipt = await response.json();
  await expect(page).toHaveURL(new RegExp(`\\?proposal=${receipt.record_id}`));
  await expect(
    page.getByRole("heading", {
      name: "Saved immutable proposal",
      exact: true,
    }),
  ).toBeVisible();
  return new URL(page.url()).searchParams.get("proposal")!;
}
async function review(page: Page) {
  await page
    .getByLabel("Action reason", { exact: true })
    .fill("SYN request complete current population");
  await page
    .getByRole("button", { name: "Obtain fresh complete review", exact: true })
    .click();
  await expect(page).toHaveURL(/\?review=/);
  await expect(
    page.getByRole("heading", { name: "Complete saved review", exact: true }),
  ).toBeVisible();
  return new URL(page.url()).searchParams.get("review")!;
}
test.beforeEach(setupPolicy);
test.afterAll(closeDatabase);

test("native reviewer successor and publisher exact lost-response recovery, reload, typed owned handovers and narrow authority", async ({
  page,
}, info) => {
  await login(page.request, "scheduling-policy-reviewer");
  await page.goto("/schedule");
  await page
    .getByRole("navigation", { name: "Scheduling workspace" })
    .getByRole("link", { name: "Policy impact", exact: true })
    .click();
  const proposal = await propose(page);
  const original = (
    await rows(
      "SELECT content FROM ppo.scheduling_policy_proposals WHERE id=$1",
      [proposal],
    )
  )[0].content;
  await page.evaluate(() => {
    sessionStorage.removeItem("ppo-pl04-command-v1:accepted");
  });
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Saved immutable proposal",
      exact: true,
    }),
  ).toBeVisible();
  await page.goto(root);
  await page.getByText("Reopen saved records", { exact: true }).click();
  await page
    .getByRole("link", { name: `Open proposal ${proposal}`, exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp(`\\?proposal=${proposal}`));
  await page
    .getByRole("button", { name: "Edit as immutable successor", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Unsaved successor edits", exact: true }),
  ).toBeFocused();
  const successor = await propose(page, "75");
  expect(successor).not.toBe(proposal);
  expect(
    (
      await rows(
        "SELECT content FROM ppo.scheduling_policy_proposals WHERE id=$1",
        [proposal],
      )
    )[0].content,
  ).toEqual(original);
  await page
    .getByRole("link", { name: "Open original proposal", exact: true })
    .click();
  await expect(page.getByText(/a successor proposal exists/)).toBeVisible();
  await page
    .getByRole("link", { name: "Open successor proposal", exact: true })
    .click();
  // A zero-result, site-scoped temporary comparison cannot become the saved review.
  await page
    .getByLabel("Proposed effective time", { exact: true })
    .fill("2031-09-22T10:00");
  await page
    .getByLabel("Proposed maximum visit (minutes)", { exact: true })
    .fill("1440");
  const comparedSite = (
    await rows(
      "SELECT site_id FROM ppo.appointments WHERE id='a8000000-0000-4000-8000-000000000001'",
    )
  )[0].site_id;
  await page
    .getByLabel("Site restriction", { exact: true })
    .selectOption(comparedSite);
  await page
    .getByRole("button", { name: "Compare future bookings", exact: true })
    .click();
  await expect(
    page.getByText(/No matching bookings require review under this comparison/),
  ).toBeVisible();
  const reviewId = await review(page);
  await expect(page.getByText(/Complete workspace family:/)).toBeVisible();
  await expect(page.getByText(/Duration Limit Exceeded/).first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Publish exact reviewed proposal" }),
  ).toHaveCount(0);
  for (const width of info.project.name.includes("mobile")
    ? [390, 320]
    : [1440, 1024]) {
    await page.setViewportSize({ width, height: 960 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page
      .getByRole("heading", { name: "Complete saved review", exact: true })
      .scrollIntoViewIfNeeded();
    await page.screenshot({
      path: info.outputPath(`review-${width}.png`),
      fullPage: true,
    });
  }
  await switchTo(page, "scheduling-policy-publisher");
  await expect(
    page.getByRole("heading", { name: "Complete saved review", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Obtain fresh complete review" }),
  ).toHaveCount(0);
  const submissions: string[] = [];
  await page.route("**/api/v1/schedule/policy-publications", async (route) => {
    submissions.push(route.request().postData()!);
    const response = await route.fetch();
    expect(response.status()).toBe(submissions.length === 1 ? 201 : 200);
    if (submissions.length === 1) await route.abort("failed");
    else await route.fulfill({ response });
  });
  await page
    .getByLabel("Action reason", { exact: true })
    .fill("SYN explicit exact reviewed publication");
  await page
    .getByRole("button", {
      name: "Publish exact reviewed proposal",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "Outcome not yet confirmed" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Action reason", { exact: true }),
  ).toBeDisabled();
  await page.route("**/api/v1/operations/*", (route) => route.abort("failed"));
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Outcome not yet confirmed" }),
  ).toBeVisible();
  await page.unroute("**/api/v1/operations/*");
  await page
    .getByRole("button", { name: "Retry unchanged original", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Open accepted publication", exact: true }),
  ).toBeVisible();
  expect(submissions).toHaveLength(2);
  expect(submissions[1]).toBe(submissions[0]);
  const altered = await page.request.post(
    "/api/v1/schedule/policy-publications",
    {
      headers: { Origin: origin },
      data: { ...JSON.parse(submissions[0]), reason: "SYN altered retry" },
    },
  );
  expect(altered.status()).toBe(409);
  await page
    .getByRole("link", { name: "Open accepted publication", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Saved publication", exact: true }),
  ).toBeVisible();
  const publication = new URL(page.url()).searchParams.get("publication")!;
  await page.evaluate(() => {
    sessionStorage.removeItem("ppo-pl04-command-v1:accepted");
  });
  await page.goto(root);
  await page.getByText("Reopen saved records", { exact: true }).click();
  await page
    .getByLabel("Saved record type", { exact: true })
    .selectOption("publication");
  await page
    .getByRole("link", { name: `Open publication ${publication}`, exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp(`\\?publication=${publication}`));
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Saved publication", exact: true }),
  ).toBeVisible();
  const pub = page.getByRole("region", {
    name: "Saved publication",
    exact: true,
  });
  await pub.getByText("Exact accepted receipt", { exact: true }).click();
  await expect(pub.getByText(/Start held/)).toBeVisible();
  const records = await rows(
    "SELECT * FROM ppo.scheduling_policy_publications",
  );
  expect(records).toHaveLength(1);
  expect(records[0].id).toBe(publication);
  expect(records[0].review_id).toBe(reviewId);
  expect(records[0].proposal_id).toBe(successor);
  const impacts = await rows(
    "SELECT * FROM ppo.scheduling_policy_impact_activities",
  );
  expect(impacts).toHaveLength(1);
  await expect(
    pub.getByRole("link", { name: "Open owned Activity" }),
  ).toHaveAttribute("href", `/work/${impacts[0].activity_id}`);
  await pub.getByRole("link", { name: "Open owned Activity" }).click();
  await expect(page).toHaveURL(new RegExp(`/work/${impacts[0].activity_id}`));
  await expect(page.getByText(/Responsible owner:/).first()).toBeVisible();
  await page.goto(`${root}?publication=${publication}`);
  await page
    .getByRole("region", { name: "Saved publication", exact: true })
    .getByRole("link", { name: "Review impacted appointment" })
    .click();
  await expect(page).toHaveURL(/\/service\/appointments\//);
  await expect(page.getByText(/Responsible owner:/).first()).toBeVisible();
  await expect(
    page.getByText("Resolve scheduling impact after a controlled change", {
      exact: true,
    }),
  ).toHaveCount(0);
  await page.goto(`${root}?publication=${publication}`);
  await expect(
    page.getByRole("heading", { name: "Saved publication", exact: true }),
  ).toBeVisible();
  await expect(pub.getByText(/Start held/)).toBeVisible();
  await pub
    .getByRole("heading", { name: "Saved publication", exact: true })
    .scrollIntoViewIfNeeded();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("publication.png"),
    fullPage: true,
  });
  await switchTo(page, "coordinator");
  await expect(
    page.getByRole("heading", { name: "Saved publication", exact: true }),
  ).toHaveCount(0);
  expect(
    (
      await page.request.get(
        `/api/v1/schedule/policy-publications/${publication}`,
      )
    ).status(),
  ).toBe(403);
});

test("complete empty review, correctable server and ambiguous local time errors, unavailable and denied saved reads", async ({
  page,
}, info) => {
  await login(page.request, "scheduling-policy-reviewer");
  await page.goto(root);
  await page
    .getByLabel("Maximum visit duration (minutes)", { exact: true })
    .fill("60");
  await page
    .getByLabel("Effective local time", { exact: true })
    .fill("2027-04-04T02:30");
  await page
    .getByLabel("Proposal timezone", { exact: true })
    .selectOption("Australia/Melbourne");
  await page
    .getByLabel("Proposal reason", { exact: true })
    .fill("SYN clock-change refusal");
  await page.getByRole("button", { name: "Save immutable proposal" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "ambiguous" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Effective local time", { exact: true }),
  ).toHaveAttribute("aria-invalid", "true");
  await page
    .getByLabel("Proposal timezone", { exact: true })
    .selectOption("Australia/Brisbane");
  await page
    .getByLabel("Effective local time", { exact: true })
    .fill("2032-01-01T10:00");
  await page
    .getByLabel("Maximum visit duration (minutes)", { exact: true })
    .fill("0");
  await page.getByRole("button", { name: "Save immutable proposal" }).click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Visit duration must be positive" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Maximum visit duration (minutes)", { exact: true }),
  ).toHaveValue("0");
  const proposal = await propose(page, "60", "2032-01-01T10:00");
  await review(page);
  await expect(
    page.getByText(/server evaluated the complete empty population/),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("empty-review.png"),
    fullPage: true,
  });
  await page.route("**/api/v1/schedule/policy-proposals/*", (route) =>
    route.fulfill({
      status: 503,
      json: {
        code: "DependencyUnavailable",
        message: "SYN saved source unavailable",
      },
    }),
  );
  await page.goto(`${root}?proposal=${proposal}`);
  await expect(
    page.getByText("SYN saved source unavailable", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Saved immutable proposal",
      exact: true,
    }),
  ).toHaveCount(0);
  await page.unroute("**/api/v1/schedule/policy-proposals/*");
  await page
    .getByRole("button", { name: "Retry loading", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Saved immutable proposal",
      exact: true,
    }),
  ).toBeVisible();
  await rows(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='schedule.policy.review'",
    [reviewerId],
  );
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Saved immutable proposal",
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(
    page.getByText(/require the dedicated workspace reviewer/),
  ).toBeVisible();
  expect(
    (
      await page.request.get(`/api/v1/schedule/policy-proposals/${proposal}`)
    ).status(),
  ).toBe(403);
});

test("saved review refuses changed dependencies and a changed publication head without substitution", async ({
  page,
}) => {
  const first = await reviewed();
  await login(page.request, "scheduling-policy-publisher");
  await page.goto(`${root}?review=${first.review.id}`);
  // A second full review sees the changed evidence; the displayed first review remains exact.
  const candidate = first.review.candidates[0];
  await rows("UPDATE ppo.work_orders SET version=version+1 WHERE id=$1", [
    candidate.dependencies.booking.work_order_id,
  ]);
  await page
    .getByLabel("Action reason", { exact: true })
    .fill("SYN stale dependency refusal");
  await page
    .getByRole("button", { name: "Publish exact reviewed proposal" })
    .click();
  await expect(page.getByText(/Publication was not accepted/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Publish exact reviewed proposal" }),
  ).toBeDisabled();
  expect(
    await rows("SELECT id FROM ppo.scheduling_policy_publications"),
  ).toHaveLength(0);
  const second = await reviewed(90);
  await publishSchedulingPolicy(second.publisher, second.publish);
  await page.reload();
  await expect(page.getByText(/the publication head changed/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Publish exact reviewed proposal" }),
  ).toBeDisabled();
  expect(
    await rows("SELECT id FROM ppo.scheduling_policy_publications"),
  ).toHaveLength(1);
});

test("complete population over the limit refuses without a partial saved review", async ({
  page,
}, info) => {
  for (let i = 1; i <= 200; i++) await populationBooking(i);
  await login(page.request, "scheduling-policy-reviewer");
  await page.goto(root);
  await propose(page);
  await page
    .getByLabel("Action reason", { exact: true })
    .fill("SYN complete limit refusal");
  await page
    .getByRole("button", { name: "Obtain fresh complete review" })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "complete population exceeds" }),
  ).toBeVisible();
  expect(
    await rows("SELECT id FROM ppo.scheduling_policy_reviews"),
  ).toHaveLength(0);
  await expect(
    page.getByRole("heading", { name: "Complete saved review" }),
  ).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath("limit-refusal.png"),
    fullPage: true,
  });
});

test("identity switch invalidates a protected in-flight read and direct comparison remains permitted", async ({
  page,
}) => {
  const compliant = await confirmed();
  const f = await reviewed(1440);
  expect(
    f.review.candidates.find(
      (c) => c.dependencies.booking.appointment.id === compliant.id,
    )?.evaluation.outcome,
  ).toBe("Compliant");
  await login(page.request, "scheduling-policy-reviewer");
  let release!: () => void, arrived!: () => void;
  const barrier = new Promise<void>((resolve) => {
    release = resolve;
  });
  const waiting = new Promise<void>((resolve) => {
    arrived = resolve;
  });
  let first = true;
  await page.route(
    `**/api/v1/schedule/policy-reviews/${f.review.id}`,
    async (route) => {
      if (!first) {
        await route.continue();
        return;
      }
      first = false;
      const response = await route.fetch();
      expect(response.status()).toBe(200);
      arrived();
      await barrier;
      await route.fulfill({ response });
    },
  );
  await page.goto(`${root}?review=${f.review.id}`);
  await waiting;
  await switchTo(page, "coordinator");
  release();
  await expect(
    page.getByText(/require the dedicated workspace reviewer/),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Complete saved review", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", {
      name: "Temporary scoped comparison",
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => sessionStorage.getItem("ppo-pl04-command-v1")),
  ).toBeNull();
  await page.unroute(`**/api/v1/schedule/policy-reviews/${f.review.id}`);
  await switchTo(page, "scheduling-policy-publisher");
  await expect(
    page.getByRole("heading", { name: "Complete saved review", exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/1 compliant; 1 affected/)).toBeVisible();
});

test("a superseding immutable proposal refuses the displayed publisher review and exposes its successor only after reopening", async ({
  page,
  request,
}) => {
  const f = await reviewed();
  await login(page.request, "scheduling-policy-publisher");
  await page.goto(`${root}?review=${f.review.id}`);
  await expect(
    page.getByRole("heading", { name: "Complete saved review", exact: true }),
  ).toBeVisible();
  await login(request, "scheduling-policy-reviewer");
  const successor = crypto.randomUUID();
  const saved = await request.post("/api/v1/schedule/policy-proposals", {
    headers: { Origin: origin },
    data: {
      ...f.command,
      operation_id: crypto.randomUUID(),
      id: successor,
      predecessor_proposal: f.publish.proposal,
      max_visit_minutes: 90,
      reason: "SYN concurrent immutable successor while publisher reads",
    },
  });
  expect(saved.status(), await saved.text()).toBe(201);
  await page
    .getByLabel("Action reason", { exact: true })
    .fill("SYN explicit publication of now-obsolete proposal");
  await page
    .getByRole("button", {
      name: "Publish exact reviewed proposal",
      exact: true,
    })
    .click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "A newer immutable revision requires a new review." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Publish exact reviewed proposal",
      exact: true,
    }),
  ).toBeDisabled();
  await expect(page).toHaveURL(new RegExp(`\\?review=${f.review.id}`));
  expect(
    await rows("SELECT id FROM ppo.scheduling_policy_publications"),
  ).toHaveLength(0);
  await page.reload();
  await expect(
    page.getByRole("link", { name: "Open successor proposal", exact: true }),
  ).toHaveAttribute("href", `${root}?proposal=${successor}`);
  await expect(
    page.getByRole("button", {
      name: "Publish exact reviewed proposal",
      exact: true,
    }),
  ).toBeDisabled();
});

test("an unavailable original receipt retains the explicit unchanged publication retry after reload", async ({
  page,
}, info) => {
  const f = await reviewed();
  await login(page.request, "scheduling-policy-publisher");
  await page.goto(`${root}?review=${f.review.id}`);
  await expect(
    page.getByRole("heading", { name: "Complete saved review", exact: true }),
  ).toBeVisible();
  const originals: string[] = [];
  await page.route("**/api/v1/schedule/policy-publications", async (route) => {
    originals.push(route.request().postData()!);
    if (originals.length === 1) await route.abort("failed");
    else await route.continue();
  });
  await page
    .getByLabel("Action reason", { exact: true })
    .fill("SYN original request did not reach the server");
  await page
    .getByRole("button", {
      name: "Publish exact reviewed proposal",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Outcome not yet confirmed",
      exact: true,
    }),
  ).toBeVisible();
  const lookup = page.waitForResponse(
    (r) =>
      r.url().includes("/api/v1/operations/") && r.request().method() === "GET",
  );
  await page.reload();
  expect((await lookup).status()).toBe(404);
  await expect(
    page.getByRole("button", { name: "Retry unchanged original", exact: true }),
  ).toBeVisible();
  expect(
    await rows("SELECT id FROM ppo.scheduling_policy_publications"),
  ).toHaveLength(0);
  await expect(
    page.getByRole("link", { name: "Open accepted publication", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("heading", { name: "Outcome not yet confirmed", exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: info.outputPath("unknown-receipt-retry.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Retry unchanged original", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Open accepted publication", exact: true }),
  ).toBeVisible();
  expect(originals).toHaveLength(2);
  expect(originals[1]).toBe(originals[0]);
  expect(
    await rows("SELECT id FROM ppo.scheduling_policy_publications"),
  ).toHaveLength(1);
  expect(
    await rows("SELECT id FROM ppo.scheduling_policy_impacts"),
  ).toHaveLength(1);
});
