import { test, expect, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { destinations } from "../../src/shell/navigation";
import { libraryItem } from "../helpers/library-ui";
import {
  findingInput,
  linkInput,
  reviewInput,
  revisionInput,
} from "../../src/library/validation";
const path = `/documents/library/${libraryItem.document.id}`,
  capture = "docs/testing/evidence/document-library/workspace";
async function setup(page: Page) {
  await page.route(/^https:\/\/[^/]+\.fontawesome\.com\//, (r) => r.abort());
  await page.route("**/api/v1/**", (r) =>
    r.fulfill({
      json: {
        items: [],
        observed_at: "2026-10-15T02:30:00Z",
        completeness: "Complete",
      },
    }),
  );
  await page.route("**/api/v1/local-session", (r) =>
    r.fulfill({
      json: {
        actor_id: libraryItem.actor_id,
        workspace_id: "10000000-0000-4000-8000-000000000001",
        display_name: "SYN Reviewer",
      },
    }),
  );
  await page.route("**/api/v1/shell/context", (r) =>
    r.fulfill({
      json: {
        display_name: "SYN Reviewer",
        preference_scope: "library-fixture",
        actions: [],
        navigation: destinations.map((d) => d.id),
        can_preview: true,
      },
    }),
  );
  await page.route(/\/api\/v1\/document-library\?.*$/, (r) =>
    r.fulfill({
      json: { items: [libraryItem], next_cursor: null, can_register: true },
    }),
  );
  await page.route(
    `**/api/v1/document-library/${libraryItem.document.id}*`,
    (r) => r.fulfill({ json: libraryItem }),
  );
  await page.route(
    `**/api/v1/document-library/${libraryItem.document.id}/content*`,
    (r) =>
      r.fulfill({
        contentType: "text/plain",
        body: "SYN exact installation notes\nLine 2\nLine 3",
      }),
  );
  await page.route("**/api/v1/document-library/options?*", (r) =>
    r.fulfill({ json: { items: [], next_after: null } }),
  );
}
test("DK-UI register and exact record at desktop, tablet, phone and 320", async ({
  page,
}) => {
  test.setTimeout(180000);
  await setup(page);
  await mkdir(capture, { recursive: true });
  for (const width of [1440, 1024, 390, 320]) {
    await page.setViewportSize({ width, height: width >= 1024 ? 900 : 844 });
    await page.goto("/documents?department=service");
    await expect(
      page.getByRole("heading", { name: "Document library", exact: true }),
    ).toBeAttached();
    await expect(
      page.getByText("Live read · No total claimed", { exact: false }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({ path: `${capture}/register-${width}.png` });
    await page.goto(path);
    await expect(
      page.getByRole("heading", {
        name: libraryItem.revision.title,
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText("No review recorded for this exact revision."),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({ path: `${capture}/record-${width}.png` });
  }
});
test("DK-UI uncertain review retries the same operation and denied refresh clears details", async ({
  page,
}) => {
  await setup(page);
  await page.goto(path);
  await page.getByRole("button", { name: "Review r03", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Purpose", { exact: true })
    .fill("SYN internal reference");
  await dialog
    .getByLabel("Rationale", { exact: true })
    .fill("SYN exact evidence checked");
  await dialog.getByLabel("Reason", { exact: true }).fill("SYN review proof");
  const bodies: unknown[] = [];
  await page.route(
    `**/api/v1/document-library/${libraryItem.document.id}/review`,
    async (r) => {
      reviewInput(r.request().postDataJSON());
      bodies.push(r.request().postDataJSON());
      if (bodies.length === 1) await r.abort();
      else await r.fulfill({ json: { record_id: libraryItem.document.id } });
    },
  );
  await dialog
    .getByRole("button", { name: "Record review", exact: true })
    .click();
  await expect(
    dialog.getByText("Original operation retained.", { exact: false }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Cancel", exact: true }),
  ).toBeDisabled();
  await dialog
    .getByRole("button", { name: "Retry original operation" })
    .click();
  await expect(dialog).not.toBeVisible();
  expect(bodies[0]).toEqual(bodies[1]);
  await page.route(
    `**/api/v1/document-library/${libraryItem.document.id}`,
    (r) =>
      r.fulfill({
        status: 403,
        json: { code: "Forbidden", message: "Not permitted" },
      }),
  );
  await page.getByRole("button", { name: "Document actions" }).click();
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: libraryItem.revision.title,
      exact: true,
    }),
  ).not.toBeVisible();
  await expect(page.getByText("Not permitted", { exact: true })).toBeVisible();
});

test("DK-UI awaiting review accepts only independently and old links open their own revision", async ({
  page,
}) => {
  await setup(page);
  const finding = {
    id: "91000000-0000-4000-8000-000000000009",
    text: "SYN verify label",
    state: "AwaitingReview",
    owner_id: libraryItem.revision.owner_id,
    owner_name: "SYN Morgan Lee",
    due_date: "2026-10-30",
    response: "SYN checked",
    response_by: libraryItem.revision.owner_id,
  };
  await page.route(
    `**/api/v1/document-library/${libraryItem.document.id}`,
    (r) => r.fulfill({ json: { ...libraryItem, findings: [finding] } }),
  );
  let accepted = false;
  await page.route(
    `**/api/v1/document-library/${libraryItem.document.id}/findings`,
    (r) => {
      const input = findingInput(r.request().postDataJSON());
      expect(input.action).toBe("Accept");
      expect(input.finding_id).toBe(finding.id);
      expect(input.revision_id).toBe(libraryItem.revision.id);
      accepted = true;
      return r.fulfill({ json: { record_id: libraryItem.document.id } });
    },
  );
  await page.goto(path);
  await page.getByRole("tab", { name: "Findings", exact: true }).click();
  await expect(
    page.getByText("Awaiting review", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Accept response", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Acceptance", { exact: true })
    .fill("SYN independently confirmed");
  await dialog.getByLabel("Reason", { exact: true }).fill("SYN proof");
  await dialog
    .getByRole("button", { name: "Accept response", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  expect(accepted).toBe(true);
  const previous = "91000000-0000-4000-8000-000000000008";
  await page.route(
    `**/api/v1/document-library/${libraryItem.document.id}/usage*`,
    (r) =>
      r.fulfill({
        json: {
          items: [
            {
              id: "91000000-0000-4000-8000-000000000010",
              revision_id: previous,
              target_kind: "Site",
              target_id: libraryItem.document.site_id,
              target_label: "SYN older site reference",
              purpose: "SYN retained",
              needs_revision_assessment: true,
              retired_at: null,
            },
            {
              id: "91000000-0000-4000-8000-000000000011",
              revision_id: libraryItem.revision.id,
              target_kind: "Site",
              target_id: libraryItem.document.site_id,
              target_label: "SYN current site reference",
              purpose: "SYN current",
              needs_revision_assessment: false,
              retired_at: null,
            },
          ],
          next_after: null,
          coverage: "VisibleUsage",
        },
      }),
  );
  await page.getByRole("tab", { name: "Links", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Open linked revision" }),
  ).toHaveAttribute("href", `${path}?revision_id=${previous}`);
  await expect(
    page.getByRole("button", { name: "Retire reference" }),
  ).toHaveCount(1);
  await page.route(
    `**/api/v1/document-library/${libraryItem.document.id}/links`,
    (r) => {
      const input = linkInput(r.request().postDataJSON());
      expect(input.revision_id).toBe(libraryItem.revision.id);
      expect(input.action).toBe("Retire");
      return r.fulfill({ json: { record_id: libraryItem.document.id } });
    },
  );
  await page.getByRole("button", { name: "Retire reference" }).click();
  await dialog
    .getByLabel("Reason", { exact: true })
    .fill("SYN receiving decision");
  await dialog
    .getByRole("button", { name: "Retire link", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await page.route(
    `**/api/v1/document-library/${libraryItem.document.id}`,
    (r) =>
      r.fulfill({
        json: {
          ...libraryItem,
          findings: [{ ...finding, response_by: libraryItem.actor_id }],
        },
      }),
  );
  await page.reload();
  await page.getByRole("tab", { name: "Findings", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Accept response", exact: true }),
  ).toHaveCount(0);
});

test("DK-UI unavailable historical content never substitutes bytes; register retries and refreshes its growing window", async ({
  page,
}) => {
  await setup(page);
  await page.setViewportSize({ width: 320, height: 844 });
  await page.route(
    `**/api/v1/document-library/${libraryItem.document.id}`,
    (r) =>
      r.fulfill({
        json: {
          ...libraryItem,
          library_current: false,
          availability: "ExactUnavailable",
          source_current: false,
          review_state: "ReviewOutdated",
        },
      }),
  );
  await page.goto(path);
  await expect(
    page.getByText("Historical revision — read only.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Download r03", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Add revision", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Exact content unavailable.", { exact: false }),
  ).toBeVisible();
  await page.screenshot({ path: `${capture}/record-unavailable-320.png` });
  await page.setViewportSize({ width: 1440, height: 900 });
  let firstReads = 0;
  await page.route(/\/api\/v1\/document-library\?.*$/, (r) => {
    const more = new URL(r.request().url()).searchParams.has("cursor");
    if (!more) firstReads++;
    return r.fulfill({
      json: {
        items: more
          ? [
              {
                ...libraryItem,
                document: {
                  ...libraryItem.document,
                  id: "91000000-0000-4000-8000-000000000012",
                },
                revision: { ...libraryItem.revision, title: "SYN second row" },
              },
            ]
          : [libraryItem],
        next_cursor: more ? null : "synthetic-cursor",
        can_register: true,
      },
    });
  });
  await page.goto("/documents");
  const readsBeforeMore = firstReads;
  await page.getByRole("button", { name: "Load 25 more" }).click();
  await expect(
    page.getByText("2 shown · Live read", { exact: false }),
  ).toBeVisible();
  expect(firstReads).toBeGreaterThan(readsBeforeMore);
  const snapshot = page.getByRole("button", {
    name: `Snapshot of ${libraryItem.revision.title}`,
    exact: true,
  });
  await snapshot.click();
  await expect(
    page.getByRole("complementary", {
      name: `Snapshot of ${libraryItem.revision.title}`,
    }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(snapshot).toBeFocused();
  await page
    .locator(".library-desktop")
    .getByRole("link", { name: libraryItem.revision.title, exact: true })
    .click();
  await expect(page.getByText("1 of 2 shown", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Next document", exact: true }),
  ).toHaveAttribute("href", /91000000-0000-4000-8000-000000000012/);
  await page.goto("/documents");

  await page.route(/\/api\/v1\/document-library\?.*$/, (r) =>
    r.fulfill({
      status: 503,
      json: { message: "SYN unavailable", retryable: true },
    }),
  );
  await page.getByRole("button", { name: "Refresh documents" }).click();
  await expect(
    page.getByText("SYN unavailable", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: libraryItem.revision.title, exact: true }),
  ).toHaveCount(0);
  await page.route(/\/api\/v1\/document-library\?.*$/, (r) =>
    r.fulfill({ json: { items: [], next_cursor: null, can_register: false } }),
  );
  await page
    .getByRole("button", { name: "Retry loading", exact: true })
    .click();
  await expect(
    page.getByText("No matching documents.", { exact: false }).first(),
  ).toBeVisible();
});

test("DK-UI registration and revision forms submit strict exact-source commands", async ({
  page,
}) => {
  await setup(page);
  await page.route("**/api/v1/document-library/options?*", (r) => {
    const kind = new URL(r.request().url()).searchParams.get("kind");
    const id =
      kind === "Company"
        ? libraryItem.document.company_id
        : kind === "Organisation"
          ? libraryItem.document.organisation_id
          : kind === "Site"
            ? libraryItem.document.site_id
            : libraryItem.revision.owner_id;
    return r.fulfill({
      json: { items: [{ id, display_name: `SYN ${kind}` }], next_after: null },
    });
  });
  let created = false,
    revised = false;
  await page.route("**/api/v1/document-library", (r) => {
    const input = revisionInput(r.request().postDataJSON(), true);
    expect(input.source.kind).toBe("SyntheticText");
    expect(input.title).toBe("SYN browser document");
    created = true;
    return r.fulfill({ json: { record_id: libraryItem.document.id } });
  });
  await page.goto("/documents");
  await page
    .getByRole("button", { name: "Register document", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Company", { exact: true })
    .selectOption(libraryItem.document.company_id);
  await dialog
    .getByLabel("Customer", { exact: true })
    .selectOption(libraryItem.document.organisation_id);
  await dialog
    .getByLabel("Site", { exact: true })
    .selectOption(libraryItem.document.site_id!);
  await dialog
    .getByLabel("Owner", { exact: true })
    .selectOption(libraryItem.revision.owner_id);
  await dialog
    .getByLabel("Title", { exact: true })
    .fill("SYN browser document");
  await dialog.getByLabel("Audience", { exact: true }).fill("SYN internal");
  await dialog
    .getByLabel("Applicability", { exact: true })
    .fill("SYN fixture only");
  await dialog
    .getByLabel("Exact synthetic text", { exact: true })
    .fill("SYN exact text");
  await dialog.getByLabel("Reason", { exact: true }).fill("SYN creation proof");
  await dialog.getByRole("button", { name: "Register", exact: true }).click();
  await expect(page).toHaveURL(
    new RegExp(`/documents/library/${libraryItem.document.id}$`),
  );
  expect(created).toBe(true);
  await page.route(
    `**/api/v1/document-library/${libraryItem.document.id}/revisions`,
    (r) => {
      const input = revisionInput(r.request().postDataJSON());
      expect(input.observed_revision_id).toBe(libraryItem.revision.id);
      expect(input.expected_version).toBe(libraryItem.document.version);
      expect(input.revision_id).not.toBe(libraryItem.revision.id);
      revised = true;
      return r.fulfill({ json: { record_id: libraryItem.document.id } });
    },
  );
  await page.getByRole("button", { name: "Add revision", exact: true }).click();
  await expect(dialog.getByLabel("Title", { exact: true })).toHaveValue(
    libraryItem.revision.title,
  );
  await dialog
    .getByLabel("Exact synthetic text", { exact: true })
    .fill("SYN successor exact text");
  await dialog
    .getByLabel("Reason", { exact: true })
    .fill("SYN successor proof");
  await dialog.getByRole("button", { name: "Revise", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  expect(revised).toBe(true);
});
