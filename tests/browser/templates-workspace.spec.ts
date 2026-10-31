import { test, expect, type Page } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { destinations } from "../../src/shell/navigation";
import {
  tmDefinition,
  tmProposal,
  tmPublication,
  tmPolicy,
  tmScope,
  tmId,
} from "../helpers/templates-ui";
test.setTimeout(180000);
test.use({
  viewport: { width: 1440, height: 900 },
  isMobile: false,
  hasTouch: false,
});
const capture = "docs/testing/evidence/template-management/workspace";
const definitionPath = `/documents/templates/OUT-09/${tmId(3)}`;
const proposalPath = `/documents/templates/proposals/${tmId(4)}`;
const usePath = `/documents/templates/use?company=${tmId(1)}&site=${tmId(2)}`;
const pageOf = (items: unknown[]) => ({
  items,
  next_cursor: null,
  scope: "PermittedRecords",
  observed_at: "2026-10-14T02:00:00Z",
});
async function setup(page: Page) {
  await page.route(/^https:\/\/[^/]+\.fontawesome\.com\//, (r) => r.abort());
  await page.route("**/api/v1/**", async (r) => {
    const u = new URL(r.request().url()),
      p = u.pathname.replace("/api/v1/", "");
    let data: unknown = pageOf([]);
    if (p === "local-session")
      data = {
        actor_id: tmId(9),
        workspace_id: tmId(10),
        display_name: "SYN Jordan Hale",
      };
    else if (p === "shell/context")
      data = {
        display_name: "SYN Jordan Hale",
        preference_scope: "templates-fixture",
        actions: [],
        navigation: destinations.map((d) => d.id),
        can_preview: true,
      };
    else if (p === "document-templates") data = pageOf([tmDefinition]);
    else if (p === `document-templates/${tmId(3)}`) data = tmDefinition;
    else if (p === "document-template-drafts/scopes") data = pageOf([tmScope]);
    else if (p === "document-template-drafts/bindings")
      data = {
        items: [
          {
            binding: "site.name",
            capability: "site.read",
            audience: "Internal",
          },
        ],
      };
    else if (p === "document-template-drafts")
      data = pageOf([
        {
          ...tmProposal.proposal,
          ...tmProposal,
          id: tmId(4),
          family: "OUT-09",
          revision: 2,
          title: tmProposal.revision.body.title,
          audience: "Internal",
          content_hash: tmProposal.revision.content_hash,
          state: "Reviewed",
          current_revision_id: tmId(5),
        },
      ]);
    else if (p === `document-template-drafts/${tmId(4)}`) data = tmProposal;
    else if (p === `document-template-drafts/${tmId(4)}/history`)
      data = pageOf(
        u.searchParams.get("kind") === "Review"
          ? [tmProposal.latest_review]
          : [tmProposal.revision],
      );
    else if (p === `document-template-drafts/${tmId(4)}/publication`)
      data = {
        proposal_id: tmId(4),
        expected_version: 3,
        revision_id: tmId(5),
        content_hash: tmProposal.revision.content_hash,
        review_id: tmId(6),
        runtime_version: 4,
        definition_hash: tmDefinition.content_hash,
        definition: tmDefinition.definition,
      };
    else if (p === `document-template-publications/${tmId(7)}`)
      data = tmPublication;
    else if (p === "document-template-publications")
      data = pageOf([
        { ...tmPublication.publication, title: tmDefinition.name },
      ]);
    else if (p === "document-template-use-policies") data = tmPolicy;
    await r.fulfill({ json: data });
  });
}
test("DK06 four routes remain within desktop, tablet, phone and 320 px", async ({
  page,
}) => {
  await setup(page);
  await mkdir(capture, { recursive: true });
  for (const width of [1440, 1024, 390, 320]) {
    await page.setViewportSize({
      width,
      height: width === 1024 ? 768 : width < 780 ? 844 : 900,
    });
    for (const [name, route, selector] of [
      ["definitions", "/documents/templates?family=OUT-09", ".tm-paging"],
      [
        "proposals",
        "/documents/templates?view=proposals&family=OUT-09",
        ".tm-paging",
      ],
      ["definition", definitionPath, ".tm-definition"],
      ["proposal", proposalPath, ".tm-record-main"],
      ["site-use", usePath, ".tm-baseline"],
    ]) {
      await page.goto(route);
      await expect(page.locator(selector).first()).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${name} ${width}`,
      ).toBe(true);
      if (width < 780 && ["definition", "proposal"].includes(name))
        await expect(page.locator(".mobile-navigation")).toBeHidden();
      if (width < 780 && ["definition", "proposal"].includes(name)) {
        const actions = await page.locator(".tm-phone-primary").boundingBox();
        expect(Math.round(actions!.y + actions!.height)).toBe(844);
      }
      await page.screenshot({ path: `${capture}/${name}-${width}.png` });
    }
  }
});
test("DK06 snapshot restores keyboard focus; publication links preserve exact identities", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/documents/templates?family=OUT-09");
  const trigger = page.getByRole("checkbox", { name: "Inspect version 3" });
  await trigger.focus();
  await trigger.press("Space");
  await expect(
    page.getByRole("complementary", { name: "Definition snapshot" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await page.goto(definitionPath);
  await page.getByRole("tab", { name: "Publication", exact: true }).click();
  await expect(
    page.getByText("SYN Jordan Hale", { exact: true }).last(),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open site use" }),
  ).toHaveAttribute("href", usePath);
  await expect(
    page.getByRole("link", { name: tmId(4), exact: true }),
  ).toHaveAttribute("href", `${proposalPath}?revision=${tmId(5)}`);
});
test("DK06 continuation retains rows while pending, focuses new evidence and clears revoked results", async ({
  page,
}) => {
  await setup(page);
  let release: (() => void) | undefined;
  let denied = false;
  await page.route(/\/api\/v1\/document-templates\?/, async (r) => {
    if (denied) {
      await r.fulfill({
        status: 403,
        json: { code: "Forbidden", message: "SYN access removed" },
      });
      return;
    }
    if (new URL(r.request().url()).searchParams.has("cursor")) {
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      await r.fulfill({
        json: pageOf([
          {
            ...tmDefinition,
            id: tmId(11),
            version: 4,
            name: "SYN Successor job pack",
          },
        ]),
      });
    } else
      await r.fulfill({
        json: { ...pageOf([tmDefinition]), next_cursor: "synthetic-next" },
      });
  });
  await page.goto("/documents/templates?family=OUT-09");
  await page.getByRole("button", { name: "Load more", exact: true }).click();
  await expect(
    page.getByRole("link", { name: tmDefinition.name, exact: true }),
  ).toBeVisible();
  await expect.poll(() => !!release).toBe(true);
  release!();
  await expect(
    page.getByRole("checkbox", { name: "Inspect version 4" }),
  ).toBeFocused();
  denied = true;
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(
    page.getByRole("link", { name: tmDefinition.name, exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Start again" })).toBeVisible();
});
test("DK06 proposal tabs survive refresh, readiness is publisher-only and historical revisions stay read-only", async ({
  page,
}) => {
  await setup(page);
  let current = structuredClone(tmProposal);
  current.publication_id = null;
  current.permissions.can_publish = false;
  await page.route(`**/api/v1/document-template-drafts/${tmId(4)}`, (r) =>
    r.fulfill({ json: current }),
  );
  await page.goto(proposalPath + "?tab=publication");
  await expect(
    page.getByRole("tab", { name: "Publication", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("tab", { name: "Proposal", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page.getByRole("tab", { name: "History", exact: true }).click();
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(
    page.getByRole("tab", { name: "History", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  current = {
    ...current,
    is_current_revision: false,
    permissions: {
      is_contributor: false,
      can_revise: false,
      can_review: false,
      can_publish: false,
    },
  };
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Open the current revision" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Revise", exact: true }),
  ).toHaveCount(0);
});

test("DK06 uncertain review retries the exact original operation and revision", async ({
  page,
}) => {
  await setup(page);
  const sent: unknown[] = [];
  let readable = true;
  await page.route(`**/api/v1/document-template-drafts/${tmId(4)}`, (r) =>
    r.fulfill(
      readable
        ? { json: tmProposal }
        : {
            status: 404,
            json: {
              code: "RecordUnavailable",
              message: "SYN evidence unavailable",
            },
          },
    ),
  );
  await page.route(
    `**/api/v1/document-template-drafts/${tmId(4)}/reviews`,
    async (r) => {
      sent.push(r.request().postDataJSON());
      await r.fulfill(
        sent.length === 1
          ? {
              status: 503,
              json: {
                code: "Unavailable",
                message: "SYN uncertain response",
                retryable: true,
              },
            }
          : !readable
            ? {
                status: 404,
                json: {
                  code: "RecordUnavailable",
                  message: "SYN source permission removed",
                },
              }
            : {
                status: 201,
                json: {
                  operation_id: r.request().postDataJSON().operation_id,
                  state: "ChangesRequested",
                  record_version: 4,
                },
              },
      );
    },
  );
  await page.route("**/api/v1/operations/*", (r) =>
    r.fulfill({
      status: 404,
      json: { code: "RecordUnavailable", message: "SYN absent receipt" },
    }),
  );
  await page.goto(proposalPath);
  await page.getByRole("button", { name: "Review", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: /^Review r2/ });
  for (const label of [
    "Schema observation",
    "Source bindings observation",
    "Audience observation",
  ])
    await dialog
      .getByLabel(label, { exact: true })
      .fill("SYN Needs independent correction");
  await dialog
    .getByLabel("Reason", { exact: true })
    .fill("SYN Request a revised field label");
  await dialog
    .getByRole("button", { name: "Record review", exact: true })
    .click();
  await expect(
    dialog.getByRole("button", { name: "Confirm original action" }),
  ).toBeVisible();
  await expect(dialog.getByLabel("Reason", { exact: true })).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  readable = false;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  const unavailable = page.getByRole("dialog", {
    name: "Decision unavailable",
    exact: true,
  });
  await expect(unavailable).toBeVisible();
  await expect(unavailable.getByLabel("Reason", { exact: true })).toHaveCount(
    0,
  );
  await expect(
    page.getByText(tmProposal.revision.body.title, { exact: true }),
  ).toHaveCount(0);
  await unavailable
    .getByRole("button", { name: "Confirm original action" })
    .click();
  await expect.poll(() => sent.length).toBe(2);
  await expect(
    unavailable.getByRole("button", { name: "Confirm original action" }),
  ).toBeEnabled();
  readable = true;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(dialog.getByLabel("Reason", { exact: true })).toHaveValue(
    "SYN Request a revised field label",
  );
  await dialog.getByRole("button", { name: "Confirm original action" }).click();
  await expect(dialog).toHaveCount(0);
  expect(sent).toHaveLength(3);
  expect(sent[1]).toEqual(sent[0]);
  expect(sent[2]).toEqual(sent[0]);
  expect(sent[0]).toMatchObject({
    revision_id: tmId(5),
    content_hash: tmProposal.revision.content_hash,
    expected_version: 3,
    outcome: "ChangesRequested",
  });
});
test("DK06 site assignment binds the displayed publication, policy and server-time interval", async ({
  page,
}) => {
  await setup(page);
  let sent: unknown;
  await page.route("**/api/v1/document-template-use-assignments", async (r) => {
    sent = r.request().postDataJSON();
    await r.fulfill({
      status: 201,
      json: { state: "Assigned", record_version: 2 },
    });
  });
  await page.goto(usePath);
  await page
    .getByRole("button", { name: "Assign use", exact: true })
    .first()
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Assign use · Job packs",
    exact: true,
  });
  await dialog
    .getByLabel("Publication at this site", { exact: true })
    .selectOption(tmId(7));
  await dialog
    .getByLabel("Service approval note", { exact: true })
    .fill("SYN Exact publication use approved");
  await dialog
    .getByLabel("Reason", { exact: true })
    .fill("SYN Start the reviewed site arrangement");
  await dialog.getByRole("button", { name: "Assign use", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(sent).toMatchObject({
    company_id: tmId(1),
    site_id: tmId(2),
    publication_id: tmId(7),
    definition_hash: tmDefinition.content_hash,
    expected_policy_version: 1,
    baseline_template_id: tmId(3),
    baseline_policy_version: 2,
    baseline_hash: tmDefinition.content_hash,
    effective_from: null,
    effective_to: null,
    predecessor_id: null,
  });
});
test("DK06 phone filters replace toolbars and empty/failure states remain distinct", async ({
  page,
}) => {
  await setup(page);
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/documents/templates?family=OUT-09");
  await expect(page.locator(".tm-toolbar")).toBeHidden();
  await page
    .getByRole("button", { name: "Filter, a filter is applied", exact: true })
    .click();
  const filter = page.getByRole("dialog", {
    name: "Template filters",
    exact: true,
  });
  await expect(filter).toBeVisible();
  await filter.getByRole("button", { name: "Show records" }).click();
  await expect(filter).toHaveCount(0);
  await page.route(/\/api\/v1\/document-templates\?/, (r) =>
    r.fulfill({ json: pageOf([]) }),
  );
  await page.reload();
  await expect(
    page.getByText("Nothing in this view for this family", { exact: false }),
  ).toBeVisible();
  await page.route(/\/api\/v1\/document-templates\?/, (r) =>
    r.fulfill({
      status: 503,
      json: { code: "Unavailable", message: "SYN cannot read catalogue" },
    }),
  );
  await page.reload();
  await expect(page.getByRole("button", { name: "Start again" })).toBeVisible();
  await expect(
    page.getByText("Nothing in this view for this family", { exact: false }),
  ).toHaveCount(0);
});

test("DK06 new proposal keeps its exact base; phone revision copies fields and retains stale input", async ({
  page,
}) => {
  await setup(page);
  let created: Record<string, unknown> | undefined;
  await page.route("**/api/v1/document-template-drafts", async (r) => {
    created = r.request().postDataJSON();
    await r.fulfill({
      status: 201,
      json: { state: "Draft", record_version: 1 },
    });
  });
  await page.goto(definitionPath);
  await page
    .getByRole("button", { name: "Propose a change", exact: true })
    .click();
  let dialog = page.getByRole("dialog", {
    name: "New proposal · Job packs",
    exact: true,
  });
  await expect(
    dialog.getByRole("heading", {
      name: "New proposal · Job packs",
      exact: true,
    }),
  ).toBeVisible();
  const bounds = await dialog.boundingBox();
  expect(bounds!.x + bounds!.width).toBe(1440);
  await dialog.getByLabel("Company", { exact: true }).selectOption(tmId(1));
  await dialog.getByLabel("Site", { exact: true }).selectOption(tmId(2));
  await dialog
    .getByLabel("Title", { exact: true })
    .fill("SYN New site arrangement");
  await dialog.getByLabel("Field 1 key", { exact: true }).fill("site");
  await dialog.getByLabel("Field 1 label", { exact: true }).fill("Site");
  await dialog
    .getByLabel("Field 1 source", { exact: true })
    .selectOption("site.name");
  await dialog
    .getByLabel("Reason", { exact: true })
    .fill("SYN Retain exact base");
  await page.screenshot({ path: `${capture}/new-proposal-1440.png` });
  await dialog.locator('button[type="submit"]').click();
  await expect.poll(() => created?.id).toBeTruthy();
  await expect(page).toHaveURL(new RegExp(String(created!.id) + "$"));
  expect(created).toMatchObject({
    base_template_id: tmId(3),
    base_content_hash: tmDefinition.content_hash,
    family: "OUT-09",
    company_id: tmId(1),
    site_id: tmId(2),
  });
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto(proposalPath);
  await page
    .getByRole("button", { name: "Revise proposal", exact: true })
    .click();
  dialog = page.getByRole("dialog", { name: /^Revise ·/ });
  await expect(dialog.getByLabel("Title", { exact: true })).toHaveValue(
    tmProposal.revision.body.title,
  );
  await expect(
    dialog.getByLabel("Field 1 source", { exact: true }),
  ).toHaveValue("site.name");
  await dialog.getByLabel("Title", { exact: true }).fill("SYN Revised title");
  await dialog
    .getByLabel("Reason", { exact: true })
    .fill("SYN Keep an independent revision");
  await page.route(
    `**/api/v1/document-template-drafts/${tmId(4)}/revisions`,
    (r) =>
      r.fulfill({
        status: 409,
        json: {
          code: "StaleVersion",
          message: "SYN another revision was accepted",
        },
      }),
  );
  await dialog.locator('button[type="submit"]').click();
  await expect(
    dialog.getByText("SYN another revision was accepted"),
  ).toBeVisible();
  await expect(dialog.getByLabel("Title", { exact: true })).toHaveValue(
    "SYN Revised title",
  );
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
  await page.screenshot({ path: `${capture}/revise-stale-320.png` });
});
test("DK06 publication submits exact readiness and preserves a refused decision", async ({
  page,
}) => {
  await setup(page);
  await page.route(`**/api/v1/document-template-drafts/${tmId(4)}`, (r) =>
    r.fulfill({ json: { ...tmProposal, publication_id: null } }),
  );
  let submitted: unknown;
  await page.route(
    `**/api/v1/document-template-drafts/${tmId(4)}/publication`,
    async (r) => {
      if (r.request().method() === "POST") {
        submitted = r.request().postDataJSON();
        await r.fulfill({
          status: 409,
          json: {
            code: "StalePublication",
            message: "SYN runtime version changed",
          },
        });
      } else await r.fallback();
    },
  );
  await page.goto(proposalPath + "?tab=publication");
  await page
    .getByRole("button", { name: "Publish version 4", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Publish as Job pack version 4",
    exact: true,
  });
  await dialog
    .getByLabel("Service approval note", { exact: true })
    .fill("SYN Exact independent publication approval");
  await dialog
    .getByLabel("Reason", { exact: true })
    .fill("SYN Retain the reviewed definition");
  await page.screenshot({ path: `${capture}/publish-1440.png` });
  await dialog
    .getByRole("button", { name: "Publish version 4", exact: true })
    .click();
  await expect(dialog.getByText("SYN runtime version changed")).toBeVisible();
  expect(submitted).toMatchObject({
    expected_version: 3,
    revision_id: tmId(5),
    review_id: tmId(6),
    content_hash: tmProposal.revision.content_hash,
    runtime_version: 4,
    definition_hash: tmDefinition.content_hash,
  });
  await expect(dialog.getByLabel("Reason", { exact: true })).toHaveValue(
    "SYN Retain the reviewed definition",
  );
});

test("DK06 phone pull refresh keeps its selected family and rechecks the current list", async ({
  page,
}) => {
  await setup(page);
  let requests = 0;
  await page.route(/\/api\/v1\/document-templates\?/, async (r) => {
    requests++;
    await r.fulfill({ json: pageOf([tmDefinition]) });
  });
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/documents/templates?family=OUT-09");
  await expect(page.locator(".tm-phone-row")).toBeVisible();
  const before = requests;
  await page.locator(".tm-phone-list").evaluate((el) => {
    const touch = (y: number) =>
      new Touch({ identifier: 1, target: el, clientX: 100, clientY: y });
    el.dispatchEvent(
      new TouchEvent("touchstart", { bubbles: true, touches: [touch(100)] }),
    );
    el.dispatchEvent(
      new TouchEvent("touchend", {
        bubbles: true,
        changedTouches: [touch(210)],
      }),
    );
  });
  await expect.poll(() => requests).toBeGreaterThan(before);
  await expect(page).toHaveURL(/family=OUT-09/);
});

test("DK06 assignment inspection hands an immutable predecessor to a separate successor decision", async ({
  page,
}) => {
  await setup(page);
  const assignment = {
    id: tmId(12),
    company_id: tmId(1),
    site_id: tmId(2),
    policy_version: 1,
    publication_id: tmId(7),
    template_id: tmId(3),
    template_version: 3,
    definition_hash: tmDefinition.content_hash,
    effective_from: "2026-10-14T02:00:00Z",
    effective_to: null,
    resolved_effective_to: null,
    predecessor_id: null,
    successor_id: null,
    actor_id: tmId(9),
    actor_name: "SYN Jordan Hale",
    recorded_at: "2026-10-14T02:00:00Z",
    reason: "SYN Exact site use",
    approval_note: "SYN Exact publication approved",
  };
  await page.route("**/api/v1/document-template-use-policies?*", (r) =>
    r.fulfill({
      json: {
        ...tmPolicy,
        items: [assignment],
        selection: { ...tmPolicy.selection, assignment_id: assignment.id },
      },
    }),
  );
  await page.route(
    `**/api/v1/document-template-use-assignments/${assignment.id}`,
    (r) => r.fulfill({ json: { assignment, as_of: tmPolicy.as_of } }),
  );
  let submitted: unknown;
  await page.route("**/api/v1/document-template-use-assignments", async (r) => {
    submitted = r.request().postDataJSON();
    await r.fulfill({
      status: 201,
      json: { state: "Assigned", record_version: 2 },
    });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(usePath);
  await page.getByRole("button", { name: /^Assigned interval/ }).click();
  const detail = page.getByRole("dialog", {
    name: "Assignment details",
    exact: true,
  });
  await expect(
    detail.getByText("SYN Jordan Hale", { exact: true }),
  ).toBeVisible();
  await expect(
    detail.getByRole("link", { name: /^Version 3/ }),
  ).toHaveAttribute("href", definitionPath);
  await page.screenshot({ path: `${capture}/assignment-detail-390.png` });
  await detail
    .getByRole("button", { name: "Assign successor", exact: true })
    .click();
  const decision = page.getByRole("dialog", {
    name: "Assign successor · Job packs",
    exact: true,
  });
  await decision
    .getByLabel("Publication at this site", { exact: true })
    .selectOption(tmId(7));
  await decision
    .getByLabel("Service approval note", { exact: true })
    .fill("SYN Successor approved");
  await decision
    .getByLabel("Reason", { exact: true })
    .fill("SYN Retain the original interval");
  await page.screenshot({ path: `${capture}/assign-successor-390.png` });
  await decision
    .getByRole("button", { name: "Assign use", exact: true })
    .click();
  await expect(decision).toHaveCount(0);
  expect(submitted).toMatchObject({
    predecessor_id: assignment.id,
    expected_policy_version: 1,
    publication_id: tmId(7),
    effective_from: null,
    effective_to: null,
  });
});

test("DK06 actual Chrome 200 percent zoom reflows both registers and exact records", async () => {
  const { chromium } = await import("@playwright/test");
  const context = await chromium.launchPersistentContext("", {
    channel: "chrome",
    viewport: { width: 1440, height: 900 },
    baseURL: test.info().project.use.baseURL,
    locale: "en-AU",
  });
  try {
    const page = await context.newPage();
    await setup(page);
    const settings = await context.newPage();
    await settings.goto("chrome://settings/appearance");
    await settings.locator("#zoomLevel").selectOption("2");
    await expect(settings.locator("#zoomLevel")).toHaveValue("2");
    await settings.close();
    for (const [name, path, selector] of [
      ["definitions", "/documents/templates?family=OUT-09", ".tm-phone-row"],
      [
        "proposals",
        "/documents/templates?view=proposals&family=OUT-09",
        ".tm-phone-row",
      ],
      ["definition", definitionPath, ".tm-definition"],
      ["proposal", proposalPath, ".tm-record-main"],
    ]) {
      await page.goto(path);
      await expect(page.locator(selector).first()).toBeVisible();
      expect(
        await page.evaluate(() => ({
          width: innerWidth,
          scale: devicePixelRatio,
        })),
      ).toEqual({ width: 720, scale: 2 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const cdp = await context.newCDPSession(page);
      const { data } = await cdp.send("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: false,
      });
      await writeFile(
        `${capture}/${name}-zoom200.png`,
        Buffer.from(data, "base64"),
      );
      await cdp.detach();
    }
    await page.getByRole("tab", { name: "Proposal", exact: true }).focus();
    await page.keyboard.press("End");
    await expect(
      page.getByRole("tab", { name: "Publication", exact: true }),
    ).toBeFocused();
  } finally {
    await context.close();
  }
});
