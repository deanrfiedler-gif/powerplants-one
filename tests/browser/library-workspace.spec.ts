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
  capture =
    "docs/testing/evidence/document-library/workspace/review-2026-11-01";
async function setup(page: Page) {
  await mkdir(`${capture}/${test.info().project.name}`, { recursive: true });
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
  await page.route(
    `**/api/v1/document-library/${libraryItem.document.id}/usage*`,
    (r) =>
      r.fulfill({
        json: { items: [], next_after: null, coverage: "VisibleReferences" },
      }),
  );
  await page.route(
    `**/api/v1/document-library/${libraryItem.document.id}/revisions*`,
    (r) =>
      r.fulfill({
        json: {
          items: [libraryItem],
          next_before: null,
          coverage: "VisibleRevisions",
        },
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
  await mkdir(`${capture}/${test.info().project.name}`, { recursive: true });
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
    await page.screenshot({
      path: `${capture}/${test.info().project.name}/register-${width}.png`,
    });
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
    await page.screenshot({
      path: `${capture}/${test.info().project.name}/record-${width}.png`,
    });
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
  await page.screenshot({
    path: `${capture}/${test.info().project.name}/review-panel.png`,
    fullPage: true,
  });
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
  await page.screenshot({
    path: `${capture}/${test.info().project.name}/uncertain-review.png`,
    fullPage: true,
  });
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
  await expect(
    page.getByRole("tab", { name: "Findings", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
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
              revision: 2,
              created_at: libraryItem.revision.created_at,
              created_by_name: libraryItem.registered_by_name,
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
              revision: 3,
              created_at: libraryItem.revision.created_at,
              created_by_name: libraryItem.registered_by_name,
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
    page.getByRole("link", { name: "r02", exact: true }),
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
  await page.screenshot({
    path: `${capture}/${test.info().project.name}/record-unavailable-320.png`,
  });
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
  await expect(
    page
      .locator(".library-desktop")
      .getByRole("link", { name: "SYN second row", exact: true }),
  ).toBeFocused();
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
  await expect(
    page
      .getByRole("navigation", { name: "Document position" })
      .getByText("1 of 2 shown", { exact: true }),
  ).toBeVisible();
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
    const choiceQuery = new URL(r.request().url()).searchParams;
    const kind = choiceQuery.get("kind");
    const id =
      kind === "Company"
        ? libraryItem.document.company_id
        : kind === "Organisation"
          ? libraryItem.document.organisation_id
          : kind === "Site"
            ? libraryItem.document.site_id
            : libraryItem.revision.owner_id;
    return r.fulfill({
      json: {
        items: [{ id, display_name: `SYN ${kind}` }],
        next_after: null,
        can_register_without_site: false,
        choose_site_first:
          !!choiceQuery.get("organisation_id") && !choiceQuery.get("site_id"),
      },
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
  await expect(dialog.getByLabel("Owner", { exact: true })).toBeDisabled();
  await expect(
    dialog.getByText("Choose a site before choosing an owner.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(dialog.getByLabel("Site", { exact: true })).not.toContainText(
    "No site",
  );
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
  await page.screenshot({
    path: `${capture}/${test.info().project.name}/registration-panel.png`,
    fullPage: true,
  });
  await dialog.getByRole("button", { name: "Register", exact: true }).click();
  await expect(page).toHaveURL(
    new RegExp(`/documents/library/${libraryItem.document.id}$`),
  );
  expect(created).toBe(true);
  await page.route(
    `**/api/v1/document-library/${libraryItem.document.id}/revisions`,
    (r) => {
      if (r.request().method() === "GET")
        return r.fulfill({
          json: {
            items: [libraryItem],
            next_before: null,
            coverage: "VisibleRevisions",
          },
        });
      const input = revisionInput(r.request().postDataJSON());
      if (!("observed_revision_id" in input))
        throw new Error("Expected a revision command");
      expect(input.observed_revision_id).toBe(libraryItem.revision.id);
      expect(input.expected_version).toBe(libraryItem.document.version);
      expect(input.revision_id).not.toBe(libraryItem.revision.id);
      revised = true;
      return r.fulfill({ json: { record_id: libraryItem.document.id } });
    },
  );
  await page.getByRole("button", { name: "Add revision", exact: true }).click();
  await expect(
    dialog.getByText("Active links will show Needs assessment", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(dialog.getByLabel("Title", { exact: true })).toHaveCount(0);
  await dialog
    .getByRole("button", { name: "Edit details", exact: true })
    .click();
  await expect(dialog.getByLabel("Title", { exact: true })).toHaveValue(
    libraryItem.revision.title,
  );
  await dialog
    .getByLabel("Exact synthetic text", { exact: true })
    .fill("SYN successor exact text");
  await dialog
    .getByLabel("Reason", { exact: true })
    .fill("SYN successor proof");
  await dialog.getByText("Find owner", { exact: true }).click();
  await dialog
    .getByRole("textbox", { name: "Find owner", exact: true })
    .fill("SYN");
  await dialog
    .getByRole("textbox", { name: "Find owner", exact: true })
    .press("Enter");
  await expect(dialog).toBeVisible();
  expect(revised).toBe(false);
  await page.screenshot({
    path: `${capture}/${test.info().project.name}/revision-panel.png`,
    fullPage: true,
  });
  await dialog.getByRole("button", { name: "Revise", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  expect(revised).toBe(true);
});

test("DK-UI review fixes preserve filters, selected labels and link assessment", async ({
  page,
}) => {
  await setup(page);
  const customer = libraryItem.document.organisation_id;
  await page.route("**/api/v1/document-library/options?*", (r) => {
    const q = new URL(r.request().url()).searchParams;
    const found = q.has("after") || q.has("selected_id");
    return r.fulfill({
      json: {
        items:
          q.get("kind") === "Organisation" && found
            ? [{ id: customer, display_name: "SYN customer beyond first page" }]
            : [],
        next_after: found ? null : customer,
      },
    });
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/documents");
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  const toolbar = page.getByRole("dialog");
  await toolbar.getByText("Find customer", { exact: true }).click();
  await toolbar
    .getByRole("button", { name: "More choices", exact: true })
    .click();
  const customerSelect = toolbar.getByRole("combobox", {
    name: "Customer",
    exact: true,
  });
  await customerSelect.focus();
  await customerSelect.selectOption(customer);
  await expect(customerSelect).toBeFocused();
  await expect(customerSelect.locator("option:checked")).toHaveText(
    "SYN customer beyond first page",
  );
  await toolbar
    .getByRole("button", { name: "First choices", exact: true })
    .click();
  await expect(customerSelect.locator("option:checked")).toHaveText(
    "SYN customer beyond first page",
  );

  await page.setViewportSize({ width: 390, height: 844 });
  const panel = page.getByRole("dialog");
  const type = panel.getByRole("combobox", { name: "Type", exact: true });
  await type.focus();
  await type.selectOption("Procedure");
  await expect(panel).toBeVisible();
  await expect(type).toBeFocused();
  await type.press("ArrowDown");
  await expect(type).toBeFocused();
  await expect(panel).toBeVisible();
  await page.route(
    `**/api/v1/document-library/${libraryItem.document.id}/usage*`,
    (r) =>
      r.fulfill({
        json: {
          items: [
            {
              id: "SYN-link",
              revision_id: "SYN-old",
              revision: 2,
              created_at: libraryItem.revision.created_at,
              created_by_name: libraryItem.registered_by_name,
              target_kind: "Site",
              target_id: libraryItem.document.site_id,
              target_label: "SYN site",
              purpose: "SYN link",
              retired_at: null,
              needs_revision_assessment: true,
            },
          ],
          next_after: "SYN-more",
          coverage: "Partial",
        },
      }),
  );
  await page.goto(path);
  await expect(
    page.getByText("A link still points at an earlier revision", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Partial coverage. Restricted links", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open Links", exact: true }).click();
  await expect(
    page.getByRole("tab", { name: "Links", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page
    .getByRole("button", { name: "Document actions", exact: true })
    .click();
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(
    page.getByRole("tab", { name: "Links", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText("SYN site", { exact: true })).toBeVisible();
});

test("DK-UI accepted evidence tables, link filters, history and tablet filter reset", async ({
  page,
}, testInfo) => {
  await setup(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  const old = {
    ...libraryItem,
    library_current: false,
    superseded_by_revision: 3,
    revision: {
      ...libraryItem.revision,
      id: "91000000-0000-4000-8000-000000000012",
      revision: 2,
      reason: "SYN earlier issued reference",
    },
    review_state: "Returned",
    review: {
      id: "SYN-review",
      outcome: "Returned",
      purpose: "SYN installation reference",
      rationale: "SYN add isolation detail",
      reviewer_id: libraryItem.actor_id,
      reviewer_name: "SYN Alex Chen",
      created_at: libraryItem.revision.created_at,
      content_hash: libraryItem.revision.source.content_hash,
    },
  };
  await page.route(
    `**/api/v1/document-library/${libraryItem.document.id}/revisions*`,
    (r) =>
      r.fulfill({
        json: {
          items: [libraryItem, old],
          next_before: null,
          coverage: "VisibleRevisions",
        },
      }),
  );
  const link = {
    id: "SYN-reference",
    revision_id: old.revision.id,
    revision: 2,
    target_kind: "Site",
    target_id: libraryItem.document.site_id,
    target_label: "SYN Northbank Block C",
    purpose: "SYN installation reference",
    created_at: libraryItem.revision.created_at,
    created_by_name: "SYN Morgan Lee",
    retired_at: null,
    needs_revision_assessment: true,
  };
  const queried: string[] = [];
  await page.route(
    `**/api/v1/document-library/${libraryItem.document.id}/usage*`,
    (r) => {
      const q = new URL(r.request().url()).searchParams;
      queried.push(q.get("state") ?? "All");
      return r.fulfill({
        json: {
          items: q.get("state") === "Retired" ? [] : [link],
          next_after: null,
          coverage: "VisibleReferences",
        },
      });
    },
  );
  await page.route(
    `**/api/v1/document-library/${libraryItem.document.id}/history*`,
    (r) =>
      r.fulfill({
        json: {
          items: [
            {
              id: "SYN-event",
              version: 2,
              command: "Review",
              revision: old.revision,
              actor_name: "SYN Alex Chen",
              created_at: old.revision.created_at,
              reason: "SYN independent inspection",
              summary:
                "Returned · Purpose: SYN installation reference · SYN add isolation detail",
              evidence: { workspace_id: "MUST-NOT-RENDER-RAW-JSON" },
            },
          ],
          next_before: null,
          coverage: "VisibleHistory",
        },
      }),
  );
  await page.goto(path);
  await page.getByRole("tab", { name: "Revisions", exact: true }).click();
  await page.getByRole("button", { name: "r02", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Selected revision r02" }),
  ).toContainText("SYN add isolation detail");
  await expect(
    page.getByRole("cell", { name: "Superseded by r03", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Download exact revision", exact: true }),
  ).toHaveAttribute("href", new RegExp(`revision_id=${old.revision.id}$`));
  if (testInfo.project.name === "desktop-chromium")
    await page.screenshot({
      path: `${capture}/${test.info().project.name}/revisions-1440.png`,
      fullPage: true,
    });
  await page.setViewportSize({ width: 320, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  if (testInfo.project.name === "desktop-chromium")
    await page.screenshot({
      path: `${capture}/${test.info().project.name}/revisions-320.png`,
      fullPage: true,
    });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole("tab", { name: "Links", exact: true }).click();
  await page
    .getByRole("button", { name: "Needs assessment", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Needs assessment", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => queried.includes("NeedsAssessment")).toBe(true);
  await expect(
    page.getByRole("columnheader", { name: "Added", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "r02", exact: true }),
  ).toHaveAttribute("href", `${path}?revision_id=${old.revision.id}`);
  if (testInfo.project.name === "desktop-chromium")
    await page.screenshot({
      path: `${capture}/${test.info().project.name}/links-1440.png`,
      fullPage: true,
    });
  await page.getByRole("button", { name: "Retired", exact: true }).click();
  await expect(
    page.getByText("No visible declared references match this filter."),
  ).toBeVisible();
  await page.getByRole("tab", { name: "History", exact: true }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "Returned · Purpose: SYN installation reference",
  );
  await expect(page.getByRole("tabpanel")).not.toContainText(
    "MUST-NOT-RENDER-RAW-JSON",
  );
  if (testInfo.project.name === "desktop-chromium")
    await page.screenshot({
      path: `${capture}/${test.info().project.name}/history-1440.png`,
      fullPage: true,
    });
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto(
    `/documents?view=Withdrawn&sort=number&direction=desc&organisation_id=${libraryItem.document.organisation_id}`,
  );
  await page
    .getByRole("button", { name: "Filters (1 applied)", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Reset filters", exact: true })
    .click();
  await expect(page).toHaveURL(/view=Withdrawn&sort=number&direction=desc$/);
});
