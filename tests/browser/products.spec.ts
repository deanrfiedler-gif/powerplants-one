import { test, expect, type Page } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  productFixture,
  publishProduct,
  productContentFixture,
  relationshipFixture,
} from "../helpers/products";
import { createRelationship } from "../../src/products/relationships";
import { reviseProduct, bindProductSource } from "../../src/products/commands";
import { createCostSource } from "../../src/estimating/sources/commands";
import { readCostSource } from "../../src/estimating/sources/reads";
import { sourceInput } from "../helpers/estimating-sources";
import { stageImport } from "../../src/products/imports";
import { readImport } from "../../src/products/imports";
import { readProduct } from "../../src/products/reads";
import { closeDatabase } from "../../src/platform/database";
import { randomUUID, createHash } from "node:crypto";
import { crmBase, CRM } from "../helpers/crm";
test.afterAll(closeDatabase);

test("PD paired source and native controls retain scoped layout, keyboard disclosure and phone reflow", async ({
  page,
  context,
}, info) => {
  const evidence = "docs/testing/evidence/products-native";
  await mkdir(evidence, { recursive: true });
  const f = await productFixture();
  const sourcePage = await context.newPage();
  await sourcePage.route(/^https?:/, (route) => route.abort());
  const sources = [];
  for (const path of [
    "docs/reference/ui/products/PPO-Products-Preview-r04.html",
    "docs/reference/ui/theme-style-board/powerplants-one-theme-style-board-r22.html",
  ]) {
    await sourcePage.goto(pathToFileURL(resolve(path)).href);
    sources.push({
      path,
      sha256: createHash("sha256")
        .update(await readFile(path))
        .digest("hex"),
      heading: await sourcePage
        .locator("h1")
        .first()
        .evaluate((el) => {
          const s = getComputedStyle(el);
          return {
            text: el.textContent,
            font: s.fontFamily,
            size: s.fontSize,
            colour: s.color,
          };
        }),
    });
  }
  await sourcePage.close();
  await login(page, f.author.token);
  const observations = [];
  for (const width of info.project.name.includes("desktop")
    ? [1440, 1024, 720]
    : [390, 320]) {
    await page.setViewportSize({
      width,
      height: width === 1440 ? 960 : width === 1024 ? 768 : 844,
    });
    await page.goto(`/products/${f.variant.id}`);
    await expect(
      page.getByRole("heading", {
        name: "Product technical workspace",
        exact: true,
      }),
    ).toBeVisible();
    const disclosure = page.getByText("Source and internal identifiers", {
      exact: true,
    });
    await disclosure.focus();
    await page.keyboard.press("Enter");
    await expect(disclosure.locator("..")).toHaveAttribute("open", "");
    await expect(disclosure.locator("..")).toContainText(f.variant.id);
    const facts = await page.locator("#ppo-products").evaluate((el) => {
      const h = el.querySelector("h1")!,
        s = getComputedStyle(h);
      return {
        width: innerWidth,
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        font: s.fontFamily,
        size: s.fontSize,
        colour: s.color,
        focus: getComputedStyle(document.activeElement!).outlineStyle,
      };
    });
    expect(facts.overflow).toBe(false);
    expect(facts.focus).not.toBe("none");
    observations.push(facts);
    await page.screenshot({
      path: `${evidence}/detail-identifiers-${width}.png`,
    });
    await page.goto("/products/publication?new=1");
    await expect(
      page.getByLabel("Display label", { exact: true }),
    ).toBeVisible();
    expect(
      await page
        .getByLabel("Display label", { exact: true })
        .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
    ).toBeGreaterThanOrEqual(16);
    if (width <= 390)
      expect(
        await page
          .getByRole("button", { name: "Save draft", exact: true })
          .evaluate((el) => el.getBoundingClientRect().height),
      ).toBeGreaterThanOrEqual(44);
  }
  await writeFile(
    `${evidence}/paired-controls-${info.project.name}.json`,
    JSON.stringify(
      {
        sources,
        observations,
        source_head:
          process.env.PPO_SOURCE_HEAD ?? "local completion working tree",
        build_id: (await readFile(".next/BUILD_ID", "utf8")).trim(),
        status:
          "Measured proposed native adaptation; owner/device acceptance separate",
      },
      null,
      2,
    ) + "\n",
  );
});

test("PD historical pricing handoff retains the selected revision through navigation and reload", async ({
  page,
}) => {
  const f = await productFixture(["estimating.read", "estimating.edit"]);
  const first = await readProduct(f.author.p, f.variant.id);
  const source = sourceInput();
  source.content.title = "SYN Historical revision price source";
  await createCostSource(f.author.p, source);
  const cost = await readCostSource(f.author.p, source.id);
  await bindProductSource(f.author.p, f.variant.id, {
    ...crmBase(),
    expected_version: first.product.version,
    revision_id: first.revision.id,
    source_id: source.id,
    source_revision_id: cost.revision.id,
    status: "Mapped",
    evidence: "SYN original variant source",
  });
  const bound = await readProduct(f.author.p, f.variant.id);
  await reviseProduct(f.author.p, f.variant.id, {
    ...crmBase(),
    expected_version: bound.product.version,
    content: {
      ...first.revision.content,
      title: "SYN Current successor without pricing",
    },
  });
  await login(page, f.author.token);
  await page.goto(`/products/${f.variant.id}?revision_id=${first.revision.id}`);
  await page
    .getByRole("link", { name: "Supplier pricing", exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp(`revision_id=${first.revision.id}`));
  await expect(
    page.getByRole("heading", {
      name: "SYN Historical revision price source",
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: first.revision.content.title,
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "SYN Historical revision price source",
      exact: true,
    }),
  ).toBeVisible();
  await page.goto(`/products/pricing?product_id=${f.variant.id}`);
  await expect(
    page.getByRole("heading", {
      name: "No exact source bindings",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "SYN Historical revision price source",
      exact: true,
    }),
  ).toHaveCount(0);
});
async function login(page: Page, token: string) {
  await page.context().addCookies([
    {
      name: "ppo_local_session",
      value: token,
      url: process.env.PPO_TEST_ORIGIN ?? "http://127.0.0.1:3000",
    },
  ]);
}
test("PD all five compiled native pages: exact identities, phone reflow, keyboard, URL state and denied evidence", async ({
  page,
}, info) => {
  const f = await productFixture(["estimating.read", "estimating.edit"]),
    published = await publishProduct(f.author.p, f.reviewer.p, f.variant.id);
  await reviseProduct(f.author.p, f.variant.id, {
    ...crmBase(),
    expected_version: published.product.version,
    content: {
      ...published.revision.content,
      title: "SYN Verdant successor draft",
    },
  });
  for (const [title, unit, valid_until] of [
    ["SYN Unknown validity source", "each", null],
    ["SYN Expired source", "each", "2026-09-02"],
    ["SYN Unit mismatch source", "m", null],
  ] as const) {
    const input = sourceInput();
    await createCostSource(f.author.p, {
      ...input,
      content: { ...input.content, title, unit, valid_until },
    });
    const source = await readCostSource(f.author.p, input.id),
      product = await readProduct(f.author.p, f.variant.id);
    await bindProductSource(f.author.p, f.variant.id, {
      ...crmBase(),
      expected_version: product.product.version,
      revision_id: product.revision.id,
      source_id: input.id,
      source_revision_id: source.revision.id,
      status: unit === "each" ? "Mapped" : "Unresolved",
      evidence: "SYN exact source context; date and unit uncertainty retained",
    });
  }
  const candidate = await readProduct(f.author.p, f.similar.id);
  await createRelationship(f.author.p, {
    ...crmBase(),
    id: randomUUID(),
    from: { product_id: f.variant.id, revision_id: published.revision.id },
    to: { product_id: f.similar.id, revision_id: candidate.revision.id },
    content: relationshipFixture(),
    predecessor_id: null,
  });
  const batchId = randomUUID();
  await stageImport(f.author.p, {
    ...crmBase(),
    id: batchId,
    company_id: CRM.company,
    filename: "browser-mixed.json",
    source_description: "SYN clean, unmapped and invalid source evidence",
    provider: "Synthetic catalogue",
    source_time: null,
    raw_content: JSON.stringify({
      format: "PPO synthetic catalogue 1",
      rows: [
        {
          external_key: `SYN-${randomUUID()}`,
          kind: "Family",
          parent_id: null,
          reference: `SYN-BROWSER-${randomUUID()}`,
          content: productContentFixture(),
        },
        { external_key: "INVALID", content: { unit: "" } },
      ],
    }),
  });
  await login(page, f.author.token);
  const evidence = "docs/testing/evidence/products-native";
  await mkdir(evidence, { recursive: true });
  const paths = [
    ["catalogue", "/products"],
    ["technical", `/products/${f.variant.id}`],
    ["publication", `/products/publication?product_id=${f.variant.id}`],
    ["pricing", `/products/pricing?product_id=${f.variant.id}`],
    ["compatibility", `/products/compatibility?product_id=${f.variant.id}`],
    ["import", `/products/import?batch_id=${batchId}`],
  ];
  const widths =
    info.project.name.includes("desktop") ? [1440, 1024, 720] : [390, 320];
  for (const width of widths) {
    await page.setViewportSize({
      width,
      height: width === 1440 ? 960 : width === 1024 ? 768 : 844,
    });
    for (const [name, path] of paths) {
      await page.goto(path);
      await expect(page.locator(".pd-workspace h1")).toBeVisible();
      await expect(page.getByText("Loading permitted records…")).toHaveCount(0);
      await expect(page.locator(".pd-workspace")).not.toContainText(
        "Check the highlighted details",
      );
      if (name === "pricing") {
        await expect(
          page.getByRole("heading", { name: "SYN Expired source" }),
        ).toBeVisible();
        await expect(
          page.getByText("Unknown validity end", { exact: true }),
        ).toHaveCount(2);
        await expect(page.getByText("Expired", { exact: true })).toHaveCount(1);
      }
      await expect(page.locator('.pd-workspace [role="alert"]')).toHaveCount(0);
      await page.locator(".pd-workspace h1").scrollIntoViewIfNeeded();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `${evidence}/${name}-${width}.png`,
        fullPage: true,
      });
    }
  }
  await page.goto("/products?q=impossible-filter");
  await expect(
    page.getByRole("heading", { name: "No products match these filters" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByLabel("Search exact identity, model or name"),
  ).toHaveValue("impossible-filter");
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page).toHaveURL(/\/products$/);
  await page.goto(`/products/${f.variant.id}`);
  await expect(page.getByText("NotApplicable", { exact: false })).toBeVisible();
  await expect(
    page.getByText("Protocol not supplied", { exact: false }),
  ).toBeVisible();
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(() => document.activeElement?.tagName !== "BODY"),
  ).toBe(true);
  await login(page, f.technical.token);
  await page.reload();
  await expect(
    page.getByRole("link", { name: "Supplier pricing", exact: true }),
  ).toHaveCount(0);
  await page.goto(`/products/pricing?product_id=${f.variant.id}`);
  await expect(
    page.getByText("Commercial evidence unavailable", { exact: false }),
  ).toBeVisible();
  await login(page, f.other.token);
  await page.goto(`/products/${f.variant.id}`);
  await expect(
    page.getByText("This record is unavailable.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "SYN Verdant successor draft" }),
  ).toHaveCount(0);
});
test("PD authoring preserves stale inputs and recovers a committed response loss without duplicate revision", async ({
  page,
}) => {
  const f = await productFixture();
  await login(page, f.author.token);
  await page.goto(`/products/publication?product_id=${f.variant.id}`);
  await page
    .getByLabel("Display label", { exact: true })
    .fill("SYN Browser edited catalogue");
  await page
    .getByLabel("Reason and evidence basis", { exact: true })
    .first()
    .fill("SYN browser recovery proof");
  let lost = false;
  await page.route(`**/api/v1/products/${f.variant.id}`, async (route) => {
    if (route.request().method() === "POST" && !lost) {
      lost = true;
      await route.fetch();
      await route.abort("connectionreset");
    } else await route.continue();
  });
  await page
    .getByRole("button", { name: "Save draft successor", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Outcome unknown" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Saved / recovered:", { exact: false }).first(),
  ).toBeVisible();
  expect((await readProduct(f.author.p, f.variant.id)).revision.revision).toBe(
    2,
  );
  await page.unrouteAll({ behavior: "wait" });
});

test("PD publication and candidate evidence use independent browser review without suitability claims", async ({
  page,
}) => {
  const f = await productFixture();
  await login(page, f.author.token);
  await page.goto(`/products/publication?product_id=${f.variant.id}`);
  const submit = page.locator("form").filter({
    has: page.getByRole("button", {
      name: "Submit exact revision",
      exact: true,
    }),
  });
  await submit
    .getByLabel("Reason and evidence basis")
    .fill("SYN exact source review");
  await submit
    .getByRole("button", { name: "Submit exact revision", exact: true })
    .click();
  await expect(
    page.getByText("Submitted", { exact: true }).first(),
  ).toBeVisible();
  await login(page, f.reviewer.token);
  await page.reload();
  const review = page.locator("form").filter({
    has: page.getByRole("button", {
      name: "Record independent review",
      exact: true,
    }),
  });
  await review
    .getByLabel("Reason and evidence basis")
    .fill("SYN independent technical evidence review");
  await review
    .getByRole("button", { name: "Record independent review", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Publish reviewed catalogue evidence" }),
  ).toBeVisible();
  await page
    .getByLabel("Publication purpose", { exact: true })
    .fill("SYN internal catalogue");
  await page
    .getByLabel("Publication audience", { exact: true })
    .fill("Synthetic review");
  await page
    .getByLabel("Effective context date", { exact: true })
    .fill("2026-09-25");
  const publish = page.locator("form").filter({
    has: page.getByRole("button", {
      name: "Publish exact reviewed revision",
      exact: true,
    }),
  });
  await publish
    .getByLabel("Reason and evidence basis")
    .fill("SYN bounded publication");
  await publish
    .getByRole("button", {
      name: "Publish exact reviewed revision",
      exact: true,
    })
    .click();
  await expect(
    page.getByText("Published", { exact: true }).first(),
  ).toBeVisible();
  await login(page, f.author.token);
  await page.goto(`/products/compatibility?product_id=${f.variant.id}`);
  await page.getByText("Prepare compatibility or candidate-replacement evidence", { exact: true }).click();
  const form = page.locator("form").filter({
    has: page.getByRole("button", {
      name: "Save relationship evidence",
      exact: true,
    }),
  });
  const original = await readProduct(f.author.p, f.variant.id),
    candidate = await readProduct(f.author.p, f.similar.id);
  await form
    .getByLabel("Candidate product", { exact: true })
    .selectOption(f.similar.id);
  await form
    .getByLabel("Original exact catalogue revision")
    .selectOption(original.revision.id);
  await form
    .getByLabel("Candidate exact catalogue revision")
    .selectOption(candidate.revision.id);
  for (const key of [
    "purpose",
    "evidence",
    "source_revision",
    "conditions",
    "limitations",
    "affected_use",
  ] as const)
    await form
      .getByLabel(key.replaceAll("_", " "), { exact: true })
      .fill(`SYN ${key} evidence`);
  await form.getByLabel("source date", { exact: true }).fill("2026-09-25");
  await form
    .getByLabel("Criterion 1 source evidence")
    .fill("Interface not supplied");
  await form
    .getByLabel("Criterion 1 clarification owner")
    .fill("SYN Engineering owner");
  await form
    .getByLabel("Reason and evidence basis")
    .fill("SYN retain unresolved candidate");
  await form
    .getByRole("button", { name: "Save relationship evidence", exact: true })
    .click();
  await expect(
    form.getByText("Saved / recovered:", { exact: false }),
  ).toBeVisible();
  await login(page, f.reviewer.token);
  await page.reload();
  const unresolved = page.locator("form").filter({
    has: page.getByRole("button", {
      name: "Record unresolved conclusion",
      exact: true,
    }),
  });
  await unresolved
    .getByLabel("Reason and evidence basis")
    .fill("SYN interface clarification required");
  await unresolved
    .getByRole("button", { name: "Record unresolved conclusion", exact: true })
    .click();
  await expect(
    page.getByText("SYN interface clarification required", { exact: false }),
  ).toBeVisible();
});

test("PD import browser maps clean and excluded invalid rows, reviews exact changes and applies drafts", async ({
  page,
}) => {
  const f = await productFixture(),
    id = randomUUID();
  await stageImport(f.author.p, {
    ...crmBase(),
    id,
    company_id: CRM.company,
    filename: "browser-application.json",
    source_description: "SYN browser mapping proof",
    provider: "Synthetic catalogue",
    source_time: null,
    raw_content: JSON.stringify({
      format: "PPO synthetic catalogue 1",
      rows: [
        {
          external_key: `SYN-${randomUUID()}`,
          reference: `SYN-${randomUUID()}`,
          kind: "Family",
          parent_id: null,
          content: productContentFixture({
            title: "SYN Browser imported family",
          }),
        },
        { external_key: "INVALID", content: {} },
      ],
    }),
  });
  await login(page, f.author.token);
  await page.goto(`/products/import?batch_id=${id}`);
  await page.getByLabel("Row 1 disposition").selectOption("New");
  await page
    .getByLabel("Row 1 mapping rationale")
    .fill("SYN explicit distinct identity");
  await page.getByLabel("Row 2 disposition").selectOption("Exclude");
  await page
    .getByLabel("Row 2 mapping rationale")
    .fill("SYN incomplete source excluded");
  await page
    .getByLabel("Reason and evidence basis")
    .fill("SYN exact bounded mapping");
  await page
    .getByRole("button", { name: "Save mapping and exact comparison" })
    .click();
  await expect(
    page.getByText("Saved / recovered:", { exact: false }),
  ).toBeVisible();
  await login(page, f.reviewer.token);
  await page.reload();
  const review = page.locator("form").filter({
    has: page.getByRole("button", {
      name: "Review exact import plan",
      exact: true,
    }),
  });
  await review
    .getByLabel("Reason and evidence basis")
    .fill("SYN independent import review");
  await review
    .getByRole("button", { name: "Review exact import plan", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Reviewed", exact: true }),
  ).toBeVisible();
  await login(page, f.author.token);
  await page.reload();
  const apply = page.locator("form").filter({
    has: page.getByRole("button", {
      name: "Apply exact reviewed change set",
      exact: true,
    }),
  });
  await apply
    .getByLabel("Reason and evidence basis")
    .fill("SYN apply exact reviewed plan");
  await apply
    .getByRole("button", {
      name: "Apply exact reviewed change set",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "Applied", exact: true }),
  ).toBeVisible();
  await page.reload();
  expect((await readImport(f.author.p, id)).batch.state).toBe("Applied");
  await expect(
    page.getByRole("button", {
      name: "Apply exact reviewed change set",
      exact: true,
    }),
  ).toHaveCount(0);
});
