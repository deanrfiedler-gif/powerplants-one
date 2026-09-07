import { expect, type Page, type TestInfo } from "@playwright/test";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { call, capture, identity } from "./quality-browser";
import { keyActivate, keyType } from "./quality-keyboard";
const hash = (b: Buffer | string) =>
  createHash("sha256").update(b).digest("hex");
async function reason(page: Page, value: string) {
  await page.getByLabel("Precise action / correction reason").fill(value);
}
async function state(page: Page, value: string) {
  await expect(page.getByText(value, { exact: true }).first()).toBeVisible();
}
// Continues the exact UI-created and issued Service source, with all Travel
// retained under the approved ADR-0018 policy and the existing F-06 Labour split.
export async function financeJourney(
  page: Page,
  info: TestInfo,
  source: { work_order_id: string; report_id: string; reference: string },
) {
  const uncertain = info.project.name.startsWith("mobile");
  const mode = uncertain ? "SyntheticApi" : "SyntheticManual";
  await page.goto("/finance/handoffs/new");
  await identity(page, "finance");
  await page
    .getByLabel("Work order", { exact: true })
    .selectOption(source.work_order_id);
  await page
    .getByLabel("Synthetic account", { exact: true })
    .selectOption({ index: 1 });
  await page.getByLabel("Processing mode", { exact: true }).selectOption(mode);
  await page
    .getByRole("checkbox", { name: new RegExp(source.reference) })
    .check();
  const travel = page
    .locator("section")
    .filter({
      has: page.getByRole("heading", {
        name: /Allocation \d+ · Captured Travel time/,
      }),
    })
    .last();
  await travel.getByLabel(/Disposition \d+/).selectOption("NonBillable");
  await travel
    .getByLabel(/Disposition reason/)
    .fill(
      "SYN ADR-0018 approved: all thirty exact whole Travel minutes explicitly non-billable, no posting and no relabelling.",
    );
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
  await page.getByLabel("Allocated quantity 4", { exact: true }).fill("30");
  await page
    .getByLabel("Disposition 4", { exact: true })
    .selectOption("NonBillable");
  await page
    .getByLabel("Disposition reason 4", { exact: true })
    .fill(
      "F-06 reviewed non-billable thirty minutes remain allocated and cannot be silently reused.",
    );
  const long =
    "SYN FINANCE_PRIVATE_CANARY: F-06 exact synthetic treatment of 60 MIN plus 2 EA; all 90 Labour MIN and separate 30 Travel MIN are dispositioned; Travel is retained non-billable with no accounting target. No live price, tax, stock or warranty policy. ";
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
  await keyType(
    page,
    page.getByLabel("Precise action / correction reason"),
    "Approve exact F-06 revision: 60 MIN and 2 EA billable, 30 MIN non-billable; no operational treatment implied.",
  );
  await capture(page, info, "journey-keyboard-finance-review-ready");
  await keyActivate(
    page,
    page.getByRole("button", { name: "Approve exact revision", exact: true }),
  );
  await state(page, "Approved");
  await identity(page, "finance-processor");
  await page
    .getByLabel("Synthetic outcome scenario", { exact: true })
    .selectOption(uncertain ? "AcceptedThenTimeout" : "Accepted");
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
  if (uncertain) {
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
  }
  await state(page, "Reconciliation Required");
  const found = await call(page, `finance/handoffs/${id}`);
  expect(found.handoff.mode).toBe(mode);
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
    await writeFile(info.outputPath(`P11-journey-OUT14.${format}`), bytes);
    await writeFile(
      info.outputPath(`P11-journey-OUT14-${format}-proof.json`),
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
  return { handoff_id: id, issue };
}
