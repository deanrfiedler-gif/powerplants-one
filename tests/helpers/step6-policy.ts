import { expect, type Page, type TestInfo } from "@playwright/test";
import { call, capture, identity } from "./quality-browser";
import {
  committed,
  contact,
  issuePack,
  readiness,
  savePreparation,
} from "./quality-prepare";
import type { PreparedReturn, ReturnSource } from "./quality-return";

const root = "/schedule/policy-impact";
export async function changePreparation(
  page: Page,
  source: ReturnSource,
  aid: string,
) {
  await identity(page, "coordinator");
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
}
async function review(page: Page, proposal: string) {
  await identity(page, "scheduling-policy-reviewer");
  await page.goto(`${root}?proposal=${proposal}`);
  await page
    .getByLabel("Action reason", { exact: true })
    .fill("SYN Step 6 complete current return-booking review");
  await page
    .getByRole("button", { name: "Obtain fresh complete review", exact: true })
    .click();
  await expect(page).toHaveURL(/\?review=/);
  await expect(
    page.getByRole("heading", { name: "Complete saved review", exact: true }),
  ).toBeVisible();
  return new URL(page.url()).searchParams.get("review")!;
}
export async function publishReturnPolicy(
  page: Page,
  info: TestInfo,
  source: ReturnSource,
  saved: PreparedReturn,
) {
  await call(page, "local-session", { profile: "scheduling-policy-reviewer" });
  await page.goto(root);
  await page
    .getByLabel("Maximum visit duration (minutes)", { exact: true })
    .fill("60");
  await page
    .getByLabel("Proposal timezone", { exact: true })
    .selectOption("Australia/Brisbane");
  await page
    .getByLabel("Effective local time", { exact: true })
    .fill("2031-09-01T10:00");
  await page
    .getByLabel("Proposal reason", { exact: true })
    .fill("SYN Step 6 future return duration; preserve all earlier evidence");
  const proposalReceipt = await committed(
    page,
    "schedule/policy-proposals",
    () =>
      page
        .getByRole("button", { name: "Save immutable proposal", exact: true })
        .click(),
  );
  const proposal = proposalReceipt.record_id;
  const firstReview = await review(page, proposal);
  // A real coordinator command changes a relevant dependency. No fixture SQL
  // is used to stand in for the reviewer/coordinator/publisher handover.
  await changePreparation(
    page,
    { ...source, work_order_id: "a9000000-0000-4000-8000-000000000001" },
    "a8000000-0000-4000-8000-000000000001",
  );
  await identity(page, "scheduling-policy-publisher");
  await page.goto(`${root}?review=${firstReview}`);
  await page
    .getByLabel("Action reason", { exact: true })
    .fill("SYN demonstrate refusal of earlier complete review");
  const refusal = page.waitForResponse(
    (r) =>
      r.url().endsWith("/schedule/policy-publications") &&
      r.request().method() === "POST",
  );
  await page
    .getByRole("button", {
      name: "Publish exact reviewed proposal",
      exact: true,
    })
    .click();
  const refused = await refusal;
  expect(refused.status()).toBe(422);
  const stale = await refused.json();
  expect(stale.code).toBe("InvalidData");
  await expect(page.getByText(/Publication was not accepted/)).toBeVisible();
  await capture(page, info, "step6-stale-review-refused");
  const reviewed = await review(page, proposal);
  expect(reviewed).not.toBe(firstReview);
  await expect(page.getByText(/Complete workspace family:/)).toBeVisible();
  await expect(page.getByText(/Duration Limit Exceeded/).first()).toBeVisible();
  await capture(page, info, "step6-complete-reviewed-return");
  await identity(page, "scheduling-policy-publisher");
  const submissions: string[] = [],
    receipts: unknown[] = [];
  await page.route("**/api/v1/schedule/policy-publications", async (route) => {
    submissions.push(route.request().postData()!);
    const response = await route.fetch();
    expect(response.status()).toBe(submissions.length === 1 ? 201 : 200);
    receipts.push(await response.json());
    if (submissions.length === 1) await route.abort("failed");
    else await route.fulfill({ response });
  });
  await page
    .getByLabel("Action reason", { exact: true })
    .fill("SYN explicit publication of this exact reviewed successor");
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
  await page.route("**/api/v1/operations/*", (route) => route.abort("failed"));
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Outcome not yet confirmed",
      exact: true,
    }),
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
  expect(receipts[1]).toEqual(receipts[0]);
  await page.unroute("**/api/v1/schedule/policy-publications");
  await page
    .getByRole("link", { name: "Open accepted publication", exact: true })
    .click();
  const publication = new URL(page.url()).searchParams.get("publication")!;
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Saved publication", exact: true }),
  ).toBeVisible();
  const region = page.getByRole("region", {
    name: "Saved publication",
    exact: true,
  });
  await region.getByText("Exact accepted receipt", { exact: true }).click();
  const impact = region.locator("article").filter({
    has: page.locator(`a[href='/service/appointments/${saved.aid}']`),
  });
  await expect(impact.getByText(/Start held/)).toBeVisible();
  const activity = await impact
    .getByRole("link", { name: "Open owned Activity", exact: true })
    .getAttribute("href");
  await impact
    .getByRole("link", { name: "Open owned Activity", exact: true })
    .click();
  await identity(page, "coordinator");
  await page.goto(activity!);
  await expect(page.getByText(/Source publication:/).first()).toBeVisible();
  await capture(page, info, "step6-owned-impact");
  const held = (await call(page, `appointments/${saved.aid}`)).items[0];
  return {
    proposal,
    firstReview,
    reviewed,
    publication,
    stale,
    activity,
    original: JSON.parse(submissions[0]),
    receipt: receipts[0],
    held,
  };
}
export async function resolveReturn(
  page: Page,
  info: TestInfo,
  aid: string,
  loseResponse: boolean,
) {
  await identity(page, "coordinator");
  await page.goto(`/service/appointments/${aid}`);
  await page
    .getByText("Resolve scheduling impact after a controlled change", {
      exact: true,
    })
    .click();
  await page
    .getByLabel("Controlled outcome", { exact: true })
    .selectOption("VerifiedNoConflict");
  await page
    .getByLabel("Resolution reason", { exact: true })
    .fill("SYN fresh exact evaluation of the explicitly changed return visit");
  await page
    .getByRole("button", { name: "Evaluate current booking", exact: true })
    .click();
  await expect(page.getByText(/Booking evaluation: Compliant/)).toBeVisible();
  const inputs: string[] = [],
    receipts: unknown[] = [];
  await page.route(
    "**/api/v1/schedule/policy-impacts/*/resolve",
    async (route) => {
      inputs.push(route.request().postData()!);
      const response = await route.fetch();
      expect(response.status()).toBe(inputs.length === 1 ? 201 : 200);
      receipts.push(await response.json());
      if (loseResponse && inputs.length === 1) await route.abort("failed");
      else await route.fulfill({ response });
    },
  );
  await page
    .getByRole("button", { name: "Save verified resolution", exact: true })
    .click();
  if (loseResponse) {
    await expect(
      page.getByText(/Result uncertain. Retry this unchanged resolution/),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Retry original resolution", exact: true })
      .click();
    expect(inputs).toHaveLength(2);
    expect(inputs[1]).toBe(inputs[0]);
    expect(receipts[1]).toEqual(receipts[0]);
  }
  await expect(page.getByText(/Current disposition: Current/)).toBeVisible();
  await page.unroute("**/api/v1/schedule/policy-impacts/*/resolve");
  await capture(page, info, "step6-controlled-resolution");
  return { original: JSON.parse(inputs[0]), receipt: receipts[0] };
}
export async function amendReturn(page: Page, saved: PreparedReturn) {
  await identity(page, "coordinator");
  await page.goto(`/service/appointments/${saved.aid}`);
  await page
    .getByRole("button", { name: "Move or reassign", exact: true })
    .click();
  const move = page.getByRole("region", {
    name: "Move or reassign",
    exact: true,
  });
  const start = await move
    .getByLabel("Start (site time)", { exact: true })
    .inputValue();
  await move
    .getByLabel("Finish (site time)", { exact: true })
    .fill(start.slice(0, 11) + "11:00");
  await expect(move.getByText(/Publication head 2/)).toBeVisible();
  await move
    .getByLabel("Change reason", { exact: true })
    .fill(
      "SYN controlled one-hour visual return under the reviewed limit; original pin and history retained",
    );
  await committed(page, `appointments/${saved.aid}/move`, () =>
    move
      .getByRole("button", { name: "Save proposed move", exact: true })
      .click(),
  );
  await contact(page, saved.aid, "Confirmed");
  await page.goto(`/service/packs/${saved.pid}`);
  await page
    .getByRole("button", { name: "Prepare successor revision", exact: true })
    .click();
  await page
    .locator("#section-customer_arrangements")
    .fill(
      "SYN explicitly agreed shorter return attendance, same authorised visual scope, earlier reservation and evidence retained.",
    );
  await committed(page, `packs/${saved.pid}/amend`, () =>
    savePreparation(
      page,
      "SYN explicit return amendment following policy impact review",
    ),
  );
  await issuePack(page, saved.pid);
  const pack = (await call(page, `packs/${saved.pid}`)).items[0];
  expect(pack.current_issue_id).not.toBe(saved.pack.current_issue_id);
  for (const profile of ["assigned-technician", "second-technician"]) {
    await identity(page, profile);
    await page.goto(`/documents/${pack.current_issue_id}`);
    await expect(
      page.getByText("Current applicable issue", { exact: true }),
    ).toBeVisible();
    await page.goto(`/my-jobs/${saved.aid}`);
    const ack = page.getByRole("button", {
      name: "I have read and acknowledge this exact pack",
      exact: true,
    });
    await ack.scrollIntoViewIfNeeded();
    await expect(page.locator("#ppo-work-timer .head")).toHaveAttribute(
      "data-compact",
      "1",
    );
    await committed(
      page,
      `pack-issues/${pack.current_issue_id}/acknowledge`,
      () => ack.click(),
    );
  }
  return { ...saved, pack };
}
