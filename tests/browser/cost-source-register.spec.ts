import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { destinations } from "../../src/shell/navigation";

test("ES03 full matching counts, exact tier, responsive list, selection and denied recovery", async ({
  page,
}) => {
  test.setTimeout(240000);
  const item = {
    id: "91000000-0000-4000-8000-000000000001",
    reference: "SYN-SRC-0021",
    revision_id: "91000000-0000-4000-8000-000000000002",
    revision: 2,
    version: 4,
    content_hash: "a".repeat(64),
    title: "SYN Pump drive",
    state: "Submitted",
    supplier: "SYN Supplier",
    unit: "each",
    item: "SYN-DRV",
    tier_1: { minimum_quantity: "7.000", unit_cost: "100.00" },
    updated_at: "2026-10-31T00:00:00Z",
    valid_until: null,
    expiry_unknown: true,
    expiry_past: false,
    your_submission: false,
    can_review: true,
  };
  let deny = false,
    noMatch = false,
    empty = false,
    stale = false,
    excludeOpen = false;
  let holdSelection = false;
  let releaseSelection!: () => void;
  let selectionHeld!: () => void;
  const selectedRead = new Promise<void>((resolve) => {
    selectionHeld = resolve;
  });
  const selectionGate = new Promise<void>((resolve) => {
    releaseSelection = resolve;
  });
  const queries: string[] = [];
  let releaseRead!: () => void;
  let firstRead = true;
  const firstReadGate = new Promise<void>((resolve) => {
    releaseRead = () => {
      firstRead = false;
      resolve();
    };
  });
  await page.route("**/api/v1/**", (r) =>
    r.fulfill({ json: { items: [], actions: [] } }),
  );
  await page.route("**/api/v1/local-session", (r) =>
    r.fulfill({
      json: {
        actor_id: "synthetic-reader",
        workspace_id: "synthetic-workspace",
        display_name: "SYN Reviewer",
      },
    }),
  );
  await page.route("**/api/v1/shell/context", (r) =>
    r.fulfill({
      json: {
        display_name: "SYN Reviewer",
        preference_scope: "cost-sources-proof",
        actions: [],
        navigation: destinations.map((d) => d.id),
        can_preview: true,
      },
    }),
  );
  await page.route("**/api/v1/estimating/cost-sources/register*", async (r) => {
    if (firstRead) await firstReadGate;
    if (holdSelection) {
      holdSelection = false;
      selectionHeld();
      await selectionGate;
    }
    queries.push(r.request().url());
    return deny || stale
      ? r.fulfill({
          status: deny ? 403 : 409,
          json: {
            code: deny ? "Forbidden" : "CostSourceRegisterChanged",
            message: "Read changed",
          },
        })
      : r.fulfill({
          json: {
            items:
              noMatch || empty
                ? []
                : Array.from({ length: 25 }, (_, i) =>
                    i === 0
                      ? item
                      : {
                          ...item,
                          id: `91000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
                          reference: `SYN-SRC-${String(21 + i).padStart(4, "0")}`,
                          title: `SYN Source evidence ${i + 1}`,
                          state: i === 24 ? "Rejected" : "Reviewed",
                          can_review: false,
                        },
                  ).filter((row) => !excludeOpen || row.id !== item.id),
            companies: [],
            counts: {
              all: empty ? 0 : 101,
              mine: 70,
              awaiting_my_review: 20,
              states: {
                Draft: 30,
                Submitted: 20,
                Reviewed: 49,
                Returned: 1,
                Rejected: 1,
              },
              validity: { unknown: 50, past: 10 },
            },
            matching_count: noMatch || empty ? 0 : 101,
            limit: 25,
            offset: new URL(r.request().url()).searchParams.has("offset")
              ? 25
              : 0,
            next_offset: 25,
            validity_date: "2026-10-31",
            as_of: new Date().toISOString(),
          },
        });
  });
  await page.route(
    `**/api/v1/estimating/cost-sources/${item.id}?revision_id=*`,
    (r) =>
      r.fulfill({
        json: {
          source: {
            id: item.id,
            reference: item.reference,
            owner_id: "synthetic-owner",
            current_revision_id: item.revision_id,
            version: item.version,
            state: "Submitted",
          },
          revision: {
            id: item.revision_id,
            revision: 2,
            content_hash: item.content_hash,
            created_by: "synthetic-author",
            reason: "Synthetic evidence correction",
            content: {
              title: item.title,
              supplier_label: item.supplier,
              supplier_entity_key: null,
              item_reference: item.item,
              unit: item.unit,
              effective_from: "2026-01-01",
              valid_until: null,
              source_date: "2026-01-01",
              evidence_reference: "SYN-EVID-21",
              evidence_excerpt: "Synthetic retained evidence excerpt",
              tiers: [item.tier_1],
              fx: {
                policy: "SYN-EST-FX-01",
                currency: "USD",
                rate: "1.000000",
                rate_date: "2026-01-01",
                effective_from: "2026-01-01",
                valid_until: "2026-12-31",
                evidence_reference: "SYN FX",
                evidence_excerpt: "Synthetic unreviewed FX evidence",
                tiers: [item.tier_1],
              },
            },
          },
          history: [
            {
              id: "event",
              revision_id: item.revision_id,
              action: "Submitted",
              reason: "Synthetic submission",
              created_by: "synthetic-owner",
              created_at: item.updated_at,
            },
          ],
          revisions: [{ id: item.revision_id, revision: 2 }],
          previous_revision: null,
          affected: [
            {
              source_revision_id: item.revision_id,
              estimate_id: "estimate-id",
              estimate_version_id: "exact-version",
              version: 3,
              display_number: "SYN-EST-21",
              line_id: "line",
              is_current: false,
            },
          ],
          affected_limit: 100,
          affected_complete: false,
          can_review: true,
        },
      }),
  );
  const captures = "docs/testing/evidence/cost-source-register/workspace";
  await mkdir(captures, { recursive: true });
  for (const width of [1440, 1024, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/estimating/cost-sources");
    await expect(
      page.getByText("Loading demonstration identity…", { exact: true }),
    ).toHaveCount(0, { timeout: 60000 });
    if (width === 1440) {
      await expect(
        page.getByText("Loading permitted cost sources…", { exact: true }),
      ).toBeVisible();
      releaseRead();
    }
    await expect(page.locator(".cs-count")).toContainText("101 sources");
    await expect(
      page.locator(width > 780 ? ".cs-grid" : ".cs-phone-list"),
    ).toContainText("7.000 each");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({ path: `${captures}/register-${width}.png` });
    if (width <= 780) {
      await page.locator(".cs-phone-list").evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });
      await expect(page.locator(".cs-phone-open").last()).toBeInViewport();
      await page.screenshot({ path: `${captures}/list-end-${width}.png` });
      await page.locator(".cs-phone-list").evaluate((el) => {
        el.scrollTop = 0;
      });
    }

    await page
      .locator(width > 780 ? ".cs-row-link" : ".cs-phone-open")
      .first()
      .click();
    const snapshot = page.getByRole("region", { name: "Source snapshot" });
    await expect(
      snapshot.getByRole("heading", { name: item.title }),
    ).toBeVisible();
    await expect(
      snapshot.getByRole("link", { name: "Open source", exact: true }),
    ).toHaveAttribute(
      "href",
      `/estimating/cost-sources/${item.id}?revision_id=${item.revision_id}`,
    );
    await snapshot.getByRole("tab").first().focus();
    await page.keyboard.press("End");
    await expect(
      snapshot.getByRole("tab", { name: "Used in" }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(snapshot).toContainText("Partial usage");
    await expect(
      snapshot.getByRole("link", { name: "SYN-EST-21 · estimate version 3" }),
    ).toHaveAttribute(
      "href",
      "/estimating/estimates/estimate-id/sources?version_id=exact-version",
    );
    await snapshot.getByRole("tab", { name: "Evidence", exact: true }).click();
    await expect(
      snapshot.getByText(/This revision retains FX evidence/),
    ).toBeVisible();
    await expect(
      snapshot.getByText(/retains reviewed FX evidence/),
    ).toHaveCount(0);
    await expect(
      snapshot.getByText("USD / 1.000000", { exact: true }),
    ).toBeVisible();
    await snapshot.getByRole("tab").first().click();
    await page.screenshot({ path: `${captures}/snapshot-${width}.png` });
    if (width <= 780) {
      const before = queries.length;
      excludeOpen = true;
      await page.evaluate(() => window.dispatchEvent(new Event("focus")));
      await expect.poll(() => queries.length).toBeGreaterThan(before);
      await expect(page.getByText("1 of 25", { exact: true })).toBeVisible();
      await expect(snapshot).toBeVisible();
      excludeOpen = false;
      await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    }
    if (width <= 780)
      await page
        .getByRole("button", { name: "Back to cost sources", exact: true })
        .click();
    else await page.keyboard.press("Escape");
    await expect(snapshot).toHaveCount(0);
    if (width <= 780) {
      const list = page.locator(".cs-phone-list");
      const panel = page.getByRole("complementary", {
        name: "Selected sources",
      });
      if (width === 390) {
        await page
          .getByRole("button", { name: "Cost source actions", exact: true })
          .click();
        await page
          .getByRole("menuitem", { name: "Select sources", exact: true })
          .click();
        await list
          .getByRole("checkbox", { name: "Select SYN-SRC-0021", exact: true })
          .check();
      } else {
        // Exercise the touch handler without relying on a real device hold.
        const row = list.locator(".cs-phone-open").first();
        await row.dispatchEvent("pointerdown", {
          pointerType: "touch",
          clientX: 40,
          clientY: 200,
        });
        await row.dispatchEvent("pointermove", {
          pointerType: "touch",
          clientX: 60,
          clientY: 220,
        });
        await page.waitForTimeout(650); // Beyond the hold timer: a scroll gesture must not select.
        await expect(
          list.getByRole("checkbox", {
            name: "Select SYN-SRC-0021",
            exact: true,
          }),
        ).toHaveCount(0);
        await row.dispatchEvent("pointerup", { pointerType: "touch" });
        await row.dispatchEvent("pointerdown", {
          pointerType: "touch",
          clientX: 40,
          clientY: 200,
        });
        await row.dispatchEvent("pointermove", {
          pointerType: "touch",
          clientX: 42,
          clientY: 202,
        });
        await expect(
          list.getByRole("checkbox", {
            name: "Select SYN-SRC-0021",
            exact: true,
          }),
        ).toBeChecked();
        await row.dispatchEvent("pointerup", { pointerType: "touch" });
        await row.click();
        await expect(snapshot).toHaveCount(0);
      }
      await expect(panel).toHaveCount(0);
      await list
        .getByRole("checkbox", { name: "Select SYN-SRC-0022", exact: true })
        .check();
      await expect(
        page.getByText("2 selected on this page", { exact: true }),
      ).toBeVisible();
      await expect(panel).toHaveCount(0);
      await page.screenshot({ path: `${captures}/selection-${width}.png` });
      await page
        .getByRole("button", { name: "Show panel", exact: true })
        .click();
      await expect(panel).toBeVisible();
      await page.screenshot({
        path: `${captures}/selection-panel-${width}.png`,
      });
      await panel
        .getByRole("button", { name: "Hide panel", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "Show panel", exact: true }),
      ).toBeFocused();
      await expect(
        list.getByRole("checkbox", {
          name: "Select SYN-SRC-0021",
          exact: true,
        }),
      ).toBeChecked();
      await expect(
        list.getByRole("checkbox", {
          name: "Select SYN-SRC-0022",
          exact: true,
        }),
      ).toBeChecked();
      await list
        .getByRole("checkbox", { name: "Select SYN-SRC-0022", exact: true })
        .uncheck();
      await expect(panel).toHaveCount(0);
      await list
        .getByRole("checkbox", { name: "Select SYN-SRC-0022", exact: true })
        .check();
      await expect(panel).toHaveCount(0);
      await page
        .getByRole("button", { name: "Clear selection", exact: true })
        .click();
    }
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  const rowOpener = page.locator(".cs-row-link").first();
  await rowOpener.click();
  await page.keyboard.press("Escape");
  await expect(rowOpener).toBeFocused();
  const rowMenu = page.getByRole("button", {
    name: "Actions for SYN-SRC-0021",
    exact: true,
  });
  await rowMenu.click();
  await page
    .getByRole("menuitem", { name: "Source snapshot", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await expect(rowMenu).toBeFocused();
  await page
    .getByRole("button", { name: "Column settings", exact: true })
    .click();
  const widthInput = page.getByRole("spinbutton", {
    name: "Source column width",
    exact: true,
  });
  await widthInput.fill("");
  await widthInput.pressSequentially("204");
  await expect(widthInput).toHaveValue("204");
  await widthInput.fill("20");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.locator('th[data-column="source"]')).toHaveCSS(
    "width",
    "204px",
  );
  await page
    .getByRole("button", { name: "Collapse Cost sources menu", exact: true })
    .click();
  // The shared menu's handle remains the same DOM node across URL changes.
  const search = page.getByRole("searchbox", {
    name: "Search source, supplier or item",
    exact: true,
  });
  await search.fill("Pump");
  await search.press("Enter");
  await expect(page).toHaveURL(/q=Pump/);
  await expect(search).toBeFocused();
  await expect(page.locator("#ppo-cost-sources")).toHaveAttribute(
    "data-menu",
    "collapsed",
  );
  await search.fill("");
  await search.press("Enter");
  await expect(page).not.toHaveURL(/q=Pump/);
  await page.goBack();
  await expect(page).toHaveURL(/q=Pump/);
  await expect(search).toHaveValue("Pump");
  await page.goForward();
  await expect(page).not.toHaveURL(/q=Pump/);
  await expect(search).toHaveValue("");
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Next page", exact: true }),
  ).toBeFocused();
  await expect(page.locator("#ppo-cost-sources")).toHaveAttribute(
    "data-menu",
    "collapsed",
  );
  await page
    .getByRole("button", { name: "Expand Cost sources menu", exact: true })
    .click();
  await expect
    .poll(() => queries.some((q) => q.includes("offset=25")))
    .toBe(true);
  await page
    .getByRole("checkbox", { name: "Select SYN-SRC-0021", exact: true })
    .check();
  await page
    .getByRole("checkbox", { name: "Select SYN-SRC-0022", exact: true })
    .check();
  await expect(
    page.getByRole("complementary", { name: "Selected sources" }),
  ).toBeVisible();
  await page.screenshot({ path: `${captures}/selection-1440.png` });
  const firstSource = page.getByRole("button", {
    name: "Open first source",
    exact: true,
  });
  await firstSource.click();
  await expect(
    page.getByRole("region", { name: "Source snapshot" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(firstSource).toBeFocused();
  deny = true;
  await page
    .getByRole("button", { name: "Export list", exact: true })
    .first()
    .click();
  await expect(page.locator(".cs-grid")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Retry loading" }),
  ).toBeVisible();
  deny = false;
  await page.getByRole("button", { name: "Retry loading" }).click();
  await expect(page.locator(".cs-grid")).toContainText("SYN-SRC-0021");
  noMatch = true;
  await page.goto("/estimating/cost-sources?q=absent");
  await expect(
    page.getByText("No sources match these filters", { exact: true }),
  ).toBeVisible({ timeout: 30000 });
  noMatch = false;
  empty = true;
  await page.goto("/estimating/cost-sources");
  await expect(
    page.getByText("No cost sources yet", { exact: true }),
  ).toBeVisible();
  empty = false;
  stale = true;
  await page.reload();
  await expect(
    page.getByText("Cost sources changed during this read", { exact: true }),
  ).toBeVisible();
  stale = false;
  await page.getByRole("button", { name: "Retry loading" }).click();
  await expect(page.locator(".cs-grid")).toContainText("SYN-SRC-0021");
  // A selection recheck from the previous query must not open stale UI after navigation.
  await page
    .getByRole("checkbox", { name: "Select SYN-SRC-0021", exact: true })
    .check();
  holdSelection = true;
  await page
    .getByRole("button", { name: "Open first source", exact: true })
    .click();
  await selectedRead;
  await page.getByRole("link", { name: /My sources/ }).click();
  await expect(page).toHaveURL(/view=mine/);
  const delayedResponse = page.waitForResponse((response) =>
    response.url().endsWith("/cost-sources/register"),
  );
  releaseSelection();
  await delayedResponse;
  await expect(page.locator(".cs-grid")).toBeVisible();
  const currentSearch = page.getByRole("searchbox", {
    name: "Search source, supplier or item",
    exact: true,
  });
  await currentSearch.fill("SYN Pump");
  await expect(currentSearch).toBeFocused();
  await expect(
    page.getByRole("region", { name: "Source snapshot" }),
  ).toHaveCount(0);
  await currentSearch.press("Enter");
  await expect
    .poll(() => new URL(page.url()).searchParams.get("q"))
    .toBe("SYN Pump");
  for (const width of [1440, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/estimating/cost-sources");
    await page
      .locator(width > 780 ? ".cs-row-link" : ".cs-phone-open")
      .first()
      .click();
    await page
      .getByRole("region", { name: "Source snapshot" })
      .getByRole("link", { name: "Review evidence", exact: true })
      .click();
    await expect(page).toHaveURL(
      new RegExp(`${item.id}\\?revision_id=${item.revision_id}#source-review$`),
    );
    await expect(page.locator("#source-review")).toBeFocused();
    await expect(page.locator("#source-review")).toBeInViewport();
    await page.screenshot({ path: `${captures}/review-step-${width}.png` });
  }
});
