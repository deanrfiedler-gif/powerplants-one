import { test, expect, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { destinations } from "../../src/shell/navigation";
import {
  outputContext,
  outputDetail,
  outputId,
  outputIssue,
  outputList,
  oldIssue,
  recipientId,
} from "../helpers/output-workspace-fixture";
const record = `/documents/issues/job-packs/${outputId}`,
  captures = "docs/testing/evidence/output-register/workspace";
async function setup(
  page: Page,
  detail = structuredClone(outputDetail),
  context = structuredClone(outputContext),
) {
  await page.route(/^https:\/\/[^/]+\.fontawesome\.com\//, (r) => r.abort());
  await page.route("**/api/v1/**", (r) =>
    r.fulfill({
      json: {
        items: [],
        observed_at: outputList.as_at,
        completeness: "Complete",
      },
    }),
  );
  await page.route("**/api/v1/local-session", (r) =>
    r.fulfill({
      json: {
        actor_id: context.actor_id,
        workspace_id: context.workspace_id,
        display_name: "SYN Service coordinator",
      },
    }),
  );
  await page.route("**/api/v1/shell/context", (r) =>
    r.fulfill({
      json: {
        display_name: "SYN Service coordinator",
        preference_scope: "outputs-fixture",
        actions: [],
        navigation: destinations.map((d) => d.id),
        can_preview: true,
      },
    }),
  );
  await page.route(/\/api\/v1\/document-outputs(?:\?.*)?$/, (r) =>
    r.fulfill({ json: outputList }),
  );
  await page.route(new RegExp(`/api/v1/document-outputs/${outputId}\\?`), (r) =>
    r.fulfill({ json: detail }),
  );
  await page.route(
    new RegExp(`/api/v1/document-outputs/${outputId}/actions`),
    (r) => r.fulfill({ json: context }),
  );
}
test("DK03-U01 register, bounded coverage, desktop snapshot and phone rows", async ({
  page,
}) => {
  test.setTimeout(180000);
  await setup(page);
  await mkdir(captures, { recursive: true });
  for (const width of [1440, 1024, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/documents/issues?department=service");
    await expect(page.locator(".output-coverage").getByText("1 outputs", { exact: true })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width >= 1024) {
      await expect(page.locator(".output-grid tbody tr")).toHaveCount(1);
      await page
        .getByRole("button", {
          name: "Snapshot SYN-PPO-PACK-000066",
          exact: true,
        })
        .click();
      await expect(
        page.getByRole("complementary", {
          name: "Snapshot of SYN-PPO-PACK-000066",
        }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(
        page.getByRole("button", {
          name: "Snapshot SYN-PPO-PACK-000066",
          exact: true,
        }),
      ).toBeFocused();
    } else {
      await expect(page.locator(".output-phone-list")).toBeVisible();
      await expect(page.locator(".output-grid")).not.toBeVisible();
    }
    await page.screenshot({
      path: `${captures}/register-${width}.png`,
      fullPage: true,
    });
  }
  await page.route(/\/api\/v1\/document-outputs(?:\?.*)?$/, (r) =>
    r.fulfill({
      json: {
        ...outputList,
        total_matching: null,
        matching_in_window: 200,
        coverage: [
          { kind: "JobPack", state: "BoundedWindow" },
          { kind: "ServiceReport", state: "NotPermitted" },
        ],
      },
    }),
  );
  await page.goto("/documents/issues");
  await expect(
    page.getByText(/200 matches in permitted windows/).first(),
  ).toBeVisible();
  await expect(page.getByText(/No complete total is claimed/)).toBeVisible();
});
test("DK03-U02 exact history, bytes, tabs, unavailable 320px and read failures", async ({
  page,
}) => {
  test.setTimeout(180000);
  await setup(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(record);
  await expect(
    page.getByRole("link", { name: "Download PDF", exact: true }),
  ).toHaveAttribute("href", `/api/v1/pack-issues/${outputIssue}/pdf`);
  await page.getByRole("tab", { name: "Issue", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "Issue history", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByRole("link", { name: "View this issue", exact: true }),
  ).toHaveAttribute("href", `${record}?issue=${oldIssue}`);
  await page.screenshot({
    path: `${captures}/history-1440.png`,
    fullPage: true,
  });
  await page.getByRole("tab", { name: "Distribution", exact: true }).click();
  await expect(
    page.getByText("SYN Alex Morgan", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Acknowledged", { exact: true }).first(),
  ).toBeVisible();
  await page.screenshot({
    path: `${captures}/distribution-1440.png`,
    fullPage: true,
  });
  await page.getByRole("tab", { name: "Preparation", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Recover original preparation" }),
  ).toBeDisabled();
  await page.screenshot({
    path: `${captures}/preparation-1440.png`,
    fullPage: true,
  });
  await page.getByRole("tab", { name: "Issue", exact: true }).click();
  await page.screenshot({ path: `${captures}/issue-1440.png`, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: `${captures}/issue-390.png`, fullPage: true });
  const missing = structuredClone(outputDetail);
  missing.availability = "ExactUnavailable";
  missing.selected_issue!.id = oldIssue;
  missing.selected_issue!.is_current_issue = false;
  missing.selected_issue!.is_current_revision = false;
  missing.selected_issue!.pack_applicable = false;
  missing.selected_issue!.revision.revision = 1;
  missing.output.reference = "SYN-PPO-PACK-000066-EXACT-RETAINED-REFERENCE";
  await page.route(new RegExp(`/api/v1/document-outputs/${outputId}\\?`), (r) =>
    r.fulfill({ json: missing }),
  );
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto(`${record}?issue=${oldIssue}`);
  await expect(
    page.getByRole("heading", { name: "Exact output unavailable" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Download PDF", exact: true }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `${captures}/unavailable-320.png`,
    fullPage: true,
  });
  await page.route(new RegExp(`/api/v1/document-outputs/${outputId}\\?`), (r) =>
    r.fulfill({
      status: 403,
      json: { code: "Forbidden", message: "SYN permission removed" },
    }),
  );
  await page.reload();
  await expect(page.locator("#ppo-outputs .business-error")).toContainText(
    "permission removed",
  );
  await expect(page.getByText("SYN Alex Morgan", { exact: true })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("link", { name: "Download PDF", exact: true }),
  ).toHaveCount(0);
});
test("DK03-U03 uncertain action retains exact envelope across reload and recovers original receipt", async ({
  page,
}) => {
  test.setTimeout(180000);
  await setup(page);
  const posted: unknown[] = [];
  await page.route(
    new RegExp(`/api/v1/document-outputs/${outputId}/actions`),
    async (r) => {
      if (r.request().method() === "GET")
        return r.fulfill({ json: outputContext });
      posted.push(r.request().postDataJSON());
      return r.abort("connectionreset");
    },
  );
  await page.goto(record);
  await page.getByRole("tab", { name: "Distribution", exact: true }).click();
  await page
    .locator(".output-recipient")
    .first()
    .getByRole("button", { name: "Prepare distribution", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Prepare distribution",
    exact: true,
  });
  await dialog
    .getByLabel("Reason", { exact: true })
    .fill("SYN single recipient proof");
  await dialog
    .getByRole("button", { name: "Confirm prepare distribution", exact: true })
    .click();
  await expect(
    dialog.getByText("Outcome not yet confirmed", { exact: true }),
  ).toBeVisible();
  const first = posted[0] as {
    command: {
      operation_id: string;
      recipient_id: string;
      expected_version: number;
    };
  };
  expect(first.command.recipient_id).toBe(recipientId);
  expect(first.command.expected_version).toBe(7);
  page.on("dialog", (d) => d.accept());
  await page.reload();
  await expect(
    dialog.getByText("Outcome not yet confirmed", { exact: true }),
  ).toBeVisible();
  await dialog
    .getByRole("button", { name: "Retry original command", exact: true })
    .click();
  await expect.poll(() => posted.length).toBe(2);
  expect(posted[1]).toEqual(first);
  await page.route(
    new RegExp(`/api/v1/document-outputs/${outputId}/operations`),
    (r) =>
      r.fulfill({
        json: {
          operation_id: first.command.operation_id,
          record_id: outputId,
          state: "Prepared",
        },
      }),
  );
  await dialog
    .getByRole("button", { name: "Check original receipt", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  expect(posted).toHaveLength(2);
});
test("DK03-U04 native withdrawal, stale refusal and additive reconciliation use exact targets", async ({
  page,
}) => {
  test.setTimeout(180000);
  const context = structuredClone(outputContext);
  context.distribution_attempts = [
    {
      id: "91000000-0000-4000-8000-000000000022",
      issue_id: outputIssue,
      recipient_id: recipientId,
      output_hash: outputDetail.selected_issue!.output_hash,
      channel: "Synthetic",
      state: "OutcomeUnknown",
      version: 2,
      operation_id: "original",
      recovery_owner_name: "SYN Jordan Hale",
      events: [
        {
          id: "unknown",
          version: 2,
          action: "Record",
          state: "OutcomeUnknown",
          actor_name: "SYN Jordan Hale",
          reason: "SYN lost response",
          evidence: "SYN pending observation",
          occurred_at: outputList.as_at,
        },
      ],
    },
  ];
  await setup(page, structuredClone(outputDetail), context);
  const commands: { action: string; command: Record<string, unknown> }[] = [];
  await page.route(
    new RegExp(`/api/v1/document-outputs/${outputId}/actions`),
    (r) => {
      if (r.request().method() === "GET") return r.fulfill({ json: context });
      commands.push(r.request().postDataJSON());
      return r.fulfill({
        status: 409,
        json: { code: "VersionConflict", message: "SYN source changed" },
      });
    },
  );
  await page.goto(record);
  await page
    .getByRole("button", { name: "More output actions", exact: true })
    .first()
    .click();
  await page
    .getByRole("menuitem", { name: "Withdraw pack", exact: true })
    .click();
  const withdraw = page.getByRole("dialog", {
    name: "Withdraw pack",
    exact: true,
  });
  await withdraw
    .getByLabel("Reason", { exact: true })
    .fill("SYN withdrawal review");
  await withdraw
    .getByRole("button", { name: "Confirm withdraw pack", exact: true })
    .click();
  await expect(withdraw.getByRole("alert")).toContainText("source changed");
  expect(commands[0]).toMatchObject({
    action: "WithdrawPack",
    command: { expected_version: 7 },
  });
  await expect(
    withdraw.getByRole("button", {
      name: "Confirm withdraw pack",
      exact: true,
    }),
  ).toBeDisabled();
  await withdraw.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("tab", { name: "Distribution", exact: true }).click();
  await expect(
    page
      .locator(".output-recipient")
      .first()
      .getByRole("button", { name: "Prepare distribution", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Reconcile original outcome", exact: true })
    .click();
  const reconcile = page.getByRole("dialog", {
    name: "Reconcile outcome",
    exact: true,
  });
  await reconcile
    .getByLabel("Reason", { exact: true })
    .fill("SYN original evidence recovered");
  await reconcile
    .getByLabel("Evidence", { exact: true })
    .fill("SYN simulation only");
  await reconcile
    .getByLabel("Recorded outcome", { exact: true })
    .selectOption("SimulatedNotSent");
  await reconcile
    .getByRole("button", { name: "Confirm reconcile outcome", exact: true })
    .click();
  expect(commands[1]).toMatchObject({
    action: "ReconcileDistribution",
    command: {
      attempt_id: context.distribution_attempts[0].id,
      expected_attempt_version: 2,
      outcome: "SimulatedNotSent",
    },
  });
});
test("DK03-U05 failed and loading family reads never become empty or stale actionable rows", async ({
  page,
}) => {
  test.setTimeout(180000);
  await setup(page);
  await page.goto("/documents/issues");
  await expect(page.locator(".output-grid tbody tr")).toHaveCount(1);
  await page.route(/\/api\/v1\/document-outputs(?:\?.*)?$/, async (r) => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    await r.fulfill({
      status: 503,
      json: {
        code: "FamilyReadFailed",
        message: "SYN family read unavailable",
      },
    });
  });
  await page
    .getByRole("button", { name: "Refresh outputs", exact: true })
    .click();
  await expect(
    page.getByText("Loading permitted records…", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".output-grid tbody tr")).toHaveCount(0);
  await expect(page.locator("#ppo-outputs .business-error")).toContainText(
    "family read unavailable",
  );
  await expect(
    page.getByRole("heading", { name: "No matching outputs", exact: true }),
  ).toHaveCount(0);
  await page.route(/\/api\/v1\/document-outputs(?:\?.*)?$/, (r) =>
    r.fulfill({
      json: {
        ...outputList,
        items: [],
        total_matching: 0,
        matching_in_window: 0,
      },
    }),
  );
  await page
    .getByRole("button", { name: "Retry loading", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "No matching outputs", exact: true }),
  ).toBeVisible();
});
test("DK03-U06 service-report distribution preserves frozen recipient and content-only responses", async ({
  page,
}) => {
  test.setTimeout(180000);
  const d = structuredClone(outputDetail),
    c = structuredClone(outputContext);
  d.output.kind = "ServiceReport";
  d.output.reference = "SYN-PPO-SR-000072";
  d.output.native_href = `/service/reports/${outputId}`;
  d.output.recipient_summary = {
    visibility: "FrozenReportRecipient",
    recipient_count: 1,
    acknowledged_count: null,
    required_recipient_count: null,
    required_acknowledged_count: null,
  };
  d.selected_issue!.recipient_id = recipientId;
  d.selected_issue!.recipient_name = "SYN Casey Taylor";
  d.selected_issue!.pack_applicable = null;
  d.selected_issue!.distribution = {
    support: "NotRecordedBySource",
    recipients: [],
    responses: [
      {
        id: "response",
        response: "Accepted",
        subject: "ReportContent",
        respondent_name: "SYN Casey Taylor",
        respondent_role: "Site contact",
        presented_at: outputList.as_at,
        received_at: outputList.as_at,
        presented_hash: d.selected_issue!.exact.html_hash,
        superseded: false,
        supersedes_response_id: null,
        restrictions: "SYN response covers issued report content only",
        correction_reason: null,
      },
    ],
  };
  c.withdraw_pack = false;
  await setup(page, d, c);
  await page.goto(`/documents/issues/service-reports/${outputId}`);
  await page.getByRole("tab", { name: "Distribution", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "SYN Casey Taylor", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/Attendance acknowledgement belongs/),
  ).toBeVisible();
  await expect(page.getByText("Accepted", { exact: true })).toBeVisible();
  await page.screenshot({
    path: `${captures}/report-distribution-1440.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "More output actions", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("menuitem", { name: "Withdraw pack", exact: true }),
  ).toHaveCount(0);
});
test("DK03-U07 request and recovery use the exact native basis and original job", async ({
  page,
}) => {
  test.setTimeout(180000);
  const d = structuredClone(outputDetail),
    c = structuredClone(outputContext);
  d.output.source_state = "Checked";
  d.output.current_issue = null;
  d.output.preparation = null;
  d.availability = "NotIssued";
  d.selected_issue = null;
  d.preparations = [];
  d.issue_history = [];
  c.current_issue_id = null;
  c.request_issue = {
    available: true,
    reason: "Source revalidated on confirmation.",
    basis: { expected_version: 7 },
  };
  c.jobs = [];
  c.withdraw_pack = false;
  await setup(page, d, c);
  const commands: { action: string; command: Record<string, unknown> }[] = [];
  await page.route(
    new RegExp(`/api/v1/document-outputs/${outputId}/actions`),
    (r) => {
      if (r.request().method() === "GET") return r.fulfill({ json: c });
      const body = r.request().postDataJSON();
      commands.push(body);
      if (body.action === "RequestIssue") {
        c.request_issue.available = false;
        c.jobs = [
          { ...outputContext.jobs[0], state: "Failed", recoverable: true },
        ];
        d.preparations = [
          {
            ...outputDetail.preparations[0],
            state: "Failed",
            issue_id: null,
            has_recorded_output: false,
          },
        ];
        return r.fulfill({ status: 202, json: { state: "Queued" } });
      }
      return r.fulfill({
        json: {
          id: outputContext.jobs[0].id,
          state: "Issued",
          availability: "ExactUnavailable",
        },
      });
    },
  );
  await page.goto(record);
  await page.getByRole("tab", { name: "Preparation", exact: true }).click();
  await page
    .getByRole("button", { name: "Request issue", exact: true })
    .click();
  let dialog = page.getByRole("dialog", { name: "Request issue", exact: true });
  await dialog
    .getByLabel("Reason", { exact: true })
    .fill("SYN reviewed issue request");
  await dialog
    .getByRole("button", { name: "Confirm request issue", exact: true })
    .click();
  await expect(page.getByText(/Native action confirmed: Queued/)).toBeVisible();
  expect(commands[0]).toMatchObject({
    action: "RequestIssue",
    command: { expected_version: 7 },
  });
  await page.getByRole("tab", { name: "Preparation", exact: true }).click();
  await page
    .getByRole("button", { name: "Recover original preparation", exact: true })
    .click();
  dialog = page.getByRole("dialog", {
    name: "Recover preparation",
    exact: true,
  });
  await dialog
    .getByRole("button", { name: "Confirm recover preparation", exact: true })
    .click();
  await expect(
    page.getByText(
      /Original preparation: Issued. Exact output: ExactUnavailable/,
    ),
  ).toBeVisible();
  expect(commands[1]).toEqual({
    kind: "JobPack",
    action: "RecoverIssue",
    command: { job_id: outputContext.jobs[0].id },
  });
});
