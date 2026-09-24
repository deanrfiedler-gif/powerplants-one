import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import type { Pack } from "../../src/documents/components/client/job-pack-types";

// Presentation proof uses the retained synthetic read; server authorisation and digest checks
// remain covered by packs.test.ts/packs.spec.ts. These mocks do not claim a persisted save.
async function setup(page: Page) {
  const read = JSON.parse(
    await readFile("tests/fixtures/job-pack-read.json", "utf8"),
  ) as { items: Pack[] };
  const pack = read.items[0];
  const current = pack.revisions.find(
    (r) => r.id === pack.current_revision_id,
  )!;
  const session = await page.request.post("/api/v1/local-session", {
    headers: { Origin: new URL(test.info().project.use.baseURL!).origin },
    data: { profile: "coordinator" },
  });
  expect(session.status()).toBe(200);
  await page.route(`**/api/v1/packs/${pack.id}`, (route) =>
    route.fulfill({ json: read }),
  );
  const open = async () => {
    const ready = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/v1/packs/${pack.id}`) &&
        response.request().method() === "GET" &&
        response.status() === 200,
    );
    await page.goto(`/service/packs/${pack.id}`);
    await ready;
    await expect(page.locator("#jp-panel-pack .jp-paper-section")).toHaveCount(
      9,
    );
  };
  const amend = (body: {
    content: Pack["revisions"][number]["input"];
    reason: string;
  }) => {
    const next = {
      ...structuredClone(current),
      id: crypto.randomUUID(),
      revision: current.revision + 1,
      input: body.content,
      change_reason: body.reason,
    };
    pack.revisions.unshift(next);
    pack.current_revision_id = next.id;
    pack.version++;
    pack.basis_drift = [];
    return next;
  };
  return { pack, current, open, amend };
}

test("SV05-I4 changed sources can be refreshed without inventing note changes", async ({
  page,
}) => {
  const { pack, current, open, amend } = await setup(page);
  let submitted:
    | {
        content: typeof current.input;
        reason: string;
        expected_version: number;
      }
    | undefined;
  await page.route(`**/api/v1/packs/${pack.id}/amend`, async (route) => {
    submitted = route.request().postDataJSON();
    amend(submitted!);
    await route.fulfill({ json: { record_version: pack.version } });
  });
  await open();
  const notice = page.getByRole("region", { name: "Changed pack sources" });
  await expect(notice).toContainText(
    "Source changed since this draft was prepared",
  );
  await notice.getByRole("button", { name: "Review changed sources" }).click();
  await expect(page.getByRole("tab", { name: /^Preparation,/ })).toBeFocused();
  await notice.getByRole("button", { name: "Refresh saved sources…" }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Reason for this change", { exact: true })
    .fill("SYN refreshed changed schedule");
  await dialog
    .getByRole("button", { name: "Save preparation", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(notice).toHaveCount(0);
  expect(submitted?.content).toEqual(current.input);
  expect(submitted?.reason).toBe("SYN refreshed changed schedule");
  await page
    .getByRole("tab", { name: "Revision history", exact: true })
    .click();
  await expect(page.locator(".jp-timeline")).toContainText(
    "SYN refreshed changed schedule",
  );
  await expect(page.locator(".jp-timeline")).toContainText(
    current.change_reason,
  );
});

test("SV05-I4 saved print keeps unsaved entries and returns keyboard focus", async ({
  page,
}) => {
  const { pack, current, open } = await setup(page);
  await open();
  await page.getByRole("tab", { name: /^Preparation,/ }).click();
  await page.locator("#section-identification").fill("SYN unsaved visit note");
  const trigger = page.getByRole("button", {
    name: "Print preview",
    exact: true,
  });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toHaveAccessibleName("Print with unsaved preparation?");
  await expect(
    dialog.getByRole("button", { name: "Save and print…" }),
  ).toBeFocused();
  await expect(
    dialog.getByRole("link", { name: "Print saved draft" }),
  ).toHaveAttribute(
    "href",
    `/api/v1/packs/${pack.id}/preview?revision_id=${current.id}`,
  );
  await expect(dialog).toContainText("Preparation preview — not issued");
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(page.locator("#section-identification")).toHaveValue(
    "SYN unsaved visit note",
  );
});

test("SV05-I4 save and print replays original bytes and pins the saved successor", async ({
  page,
}) => {
  const { pack, current, open, amend } = await setup(page);
  const requests: string[] = [];
  let savedId = "";
  let acceptedVersion = 0;
  await page.route(`**/api/v1/packs/${pack.id}/amend`, async (route) => {
    requests.push(route.request().postData()!);
    if (requests.length === 1) {
      savedId = amend(route.request().postDataJSON()).id;
      acceptedVersion = pack.version;
      // Another coordinator saves again before the original caller reloads. Print must still
      // open the revision accepted by this operation, never the new current_revision_id.
      pack.revisions.unshift({
        ...structuredClone(current),
        id: crypto.randomUUID(),
        revision: current.revision + 2,
      });
      pack.current_revision_id = pack.revisions[0].id;
      pack.version++;
      await route.abort("failed");
    } else await route.fulfill({ json: { record_version: acceptedVersion } });
  });
  await open();
  await page.getByRole("tab", { name: /^Preparation,/ }).click();
  await page.locator("#section-identification").fill("SYN saved print note");
  await page
    .getByRole("button", { name: "Print preview", exact: true })
    .click();
  await page.getByRole("button", { name: "Save and print…" }).click();
  let dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Reason for this change", { exact: true })
    .fill("SYN saved for controlled print");
  await dialog
    .getByRole("button", { name: "Save preparation", exact: true })
    .click();
  await expect(dialog.locator(".business-error")).toBeVisible();
  await expect(dialog.getByRole("link")).toHaveCount(0);
  await dialog
    .getByRole("button", { name: "Save preparation", exact: true })
    .click();
  dialog = page.getByRole("dialog", {
    name: "Saved preparation — ready to print",
  });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("link", { name: /^Print saved revision/ }),
  ).toHaveAttribute(
    "href",
    `/api/v1/packs/${pack.id}/preview?revision_id=${savedId}`,
  );
  expect(requests).toHaveLength(2);
  expect(requests[1]).toBe(requests[0]);
});

test("SV05-I4 stale source refuses a save without opening a print or losing entries", async ({
  page,
}) => {
  const { pack, open } = await setup(page);
  await page.route(`**/api/v1/packs/${pack.id}/amend`, (route) =>
    route.fulfill({
      status: 409,
      json: {
        code: "StaleSource",
        message: "The source changed. Review the current appointment.",
        retryable: false,
      },
    }),
  );
  await open();
  await page.getByRole("tab", { name: /^Preparation,/ }).click();
  await page
    .locator("#section-identification")
    .fill("SYN preserve refused proposal");
  await page
    .getByRole("button", { name: "Print preview", exact: true })
    .click();
  await page.getByRole("button", { name: "Save and print…" }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Reason for this change", { exact: true })
    .fill("SYN source review");
  await dialog
    .getByRole("button", { name: "Save preparation", exact: true })
    .click();
  await expect(dialog.locator(".business-error")).toContainText(
    "The source changed",
  );
  await expect(dialog.getByRole("link")).toHaveCount(0);
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.locator("#section-identification")).toHaveValue(
    "SYN preserve refused proposal",
  );
});

test("SV05-I4 source and print actions honour the permitted staff read", async ({
  page,
}) => {
  const { pack, open } = await setup(page);
  pack.actions.can_prepare = false;
  pack.actions.can_check = false;
  pack.actions.can_issue = false;
  pack.basis_drift = null;
  await open();
  await expect(
    page.getByRole("region", { name: "Changed pack sources" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Print preview", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: "Prepare successor revision",
      exact: true,
    }),
  ).toHaveCount(0);
});

test("SV05-I4 an unissued successor retains preview alongside the earlier exact issue", async ({
  page,
}) => {
  const { pack, current, open } = await setup(page);
  const issueId = crypto.randomUUID();
  pack.current_issue_id = issueId;
  pack.issues = [
    {
      id: issueId,
      revision: current.revision - 1,
      revision_id: crypto.randomUUID(),
      issued_at: current.created_at,
      issued_by_name: "SYN Coordinator",
      output_hash: "a".repeat(64),
      manifest: {
        filename: "SYN retained issue.pdf",
        pdf_bytes: 1,
        pdf_hash: "a".repeat(64),
        html_hash: "b".repeat(64),
        renderer_version: "synthetic",
        browser_version: "synthetic",
      },
    },
  ];
  await open();
  await expect(
    page.getByRole("button", { name: "Print preview", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open exact issued document", exact: true }),
  ).toHaveAttribute("href", `/documents/${issueId}`);
});

test("SV05-I4 source review and print choices fit supported widths with keyboard recovery", async ({
  page,
}, info) => {
  test.skip(
    info.project.name.startsWith("mobile"),
    "All widths measured once against the same source fixture.",
  );
  const { open } = await setup(page);
  for (const [width, height] of [
    [1440, 960],
    [1024, 768],
    [820, 800],
    [770, 900],
    [390, 844],
    [320, 800],
  ]) {
    await page.setViewportSize({ width, height });
    await open();
    const notice = page.getByRole("region", { name: "Changed pack sources" });
    await expect(notice).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const noticeBox = await notice.boundingBox();
    expect(noticeBox!.x + noticeBox!.width).toBeLessThanOrEqual(width);
    await page.screenshot({
      path: info.outputPath(`source-change-${width}.png`),
    });
    await page
      .getByRole("button", { name: "Print preview", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading")).toBeFocused();
    const dialogBox = await dialog.boundingBox();
    expect(dialogBox!.x).toBeGreaterThanOrEqual(0);
    expect(dialogBox!.x + dialogBox!.width).toBeLessThanOrEqual(width);
    await page.keyboard.press("Shift+Tab");
    await expect(
      dialog.getByRole("link", { name: "Print saved draft" }),
    ).toBeFocused();
    await page.screenshot({
      path: info.outputPath(`print-choice-${width}.png`),
    });
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: "Print preview", exact: true }),
    ).toBeFocused();
  }
});
