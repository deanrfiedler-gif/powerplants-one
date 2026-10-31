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
    state: "Reviewed",
    supplier: "SYN Supplier",
    unit: "each",
    item: "SYN-DRV",
    tier_1: { minimum_quantity: "7.000", unit_cost: "100.00" },
    updated_at: "2026-10-31T00:00:00Z",
    valid_until: null,
    expiry_unknown: true,
    expiry_past: false,
    your_submission: false,
    can_review: false,
  };
  let deny = false,
    noMatch = false,
    empty = false,
    stale = false;
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
            items: noMatch || empty ? [] : [item],
            companies: [],
            counts: {
              all: empty ? 0 : 101,
              mine: 70,
              awaiting_my_review: 20,
              states: {
                Draft: 30,
                Submitted: 20,
                Reviewed: 50,
                Returned: 1,
                Rejected: 0,
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
    await snapshot.getByRole("tab", { name: "Changes", exact: true }).focus();
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
    await page.screenshot({ path: `${captures}/snapshot-${width}.png` });
    if (width <= 780)
      await page
        .getByRole("button", { name: "Back to cost sources", exact: true })
        .click();
    else await page.keyboard.press("Escape");
    await expect(snapshot).toHaveCount(0);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await expect
    .poll(() => queries.some((q) => q.includes("offset=25")))
    .toBe(true);
  await page
    .getByRole("checkbox", { name: "Select SYN-SRC-0021", exact: true })
    .check();
  await expect(
    page.getByRole("complementary", { name: "Selected sources" }),
  ).toBeVisible();
  await page.screenshot({ path: `${captures}/selection-1440.png` });
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
});
