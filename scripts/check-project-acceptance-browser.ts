import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { launchDocumentBrowser } from "../src/platform/browser";
const origin = process.env.PJ09_REVIEW_ORIGIN ?? "http://127.0.0.1:3000",
  out = resolve("tmp/pj09-evidence");
await mkdir(out, { recursive: true });
const boardPath = resolve(
    "docs/reference/ui/theme-style-board/powerplants-one-theme-style-board-r22.html",
  ),
  boardHash = createHash("sha256")
    .update(await readFile(boardPath))
    .digest("hex");
assert.equal(
  boardHash,
  "a305361c5d937296a8837e751f1a80ac7e6ca7615013705c7ad55ad794957df0",
);
const b = await launchDocumentBrowser(),
  results: unknown[] = [],
  errors: string[] = [];
try {
  const board = await b.newPage();
  await board.goto(pathToFileURL(boardPath).href);
  await board.evaluate(() => document.fonts.ready);
  const specimens: Record<string, unknown> = {};
  for (const [tone, selector] of Object.entries({
    success: "#controls .tag.success",
    caution: "#controls .tag.warning",
    failure: '#colour .tag.danger:text-is("Read failed")',
    info: "#controls .tag.info",
    neutral: ".tag.proposed",
  }))
    specimens[tone] = await board
      .locator(selector)
      .first()
      .evaluate((e) => {
        const c = getComputedStyle(e);
        return {
          color: c.color,
          background: c.backgroundColor,
          padding: c.padding,
          radius: c.borderRadius,
          fontSize: c.fontSize,
          fontWeight: c.fontWeight,
          lineHeight: c.lineHeight,
        };
      });
  const page = await b.newPage({
    viewport: { width: 1920, height: 1200 },
    baseURL: origin,
  });
  page.on("pageerror", (e) => errors.push(e.message));
  const login = await page.request.post("/api/v1/local-session", {
    headers: { Origin: origin },
    data: { profile: "coordinator" },
  });
  assert.equal(login.status(), 200);
  const data = await (
    await page.request.get("/api/v1/projects/acceptance")
  ).json();
  const project = data.project.id,
    stage = data.items.find(
      (d: { stage: { title: string } }) =>
        d.stage.title === "Greenhouse 01 acceptance",
    ).stage.id;
  const root = `/projects/acceptance?project=${project}&stage=${stage}`;
  await page.goto(root);
  await page
    .getByRole("button", { name: "Greenhouse 01 acceptance", exact: true })
    .waitFor();
  await page.evaluate(() => document.fonts.ready);
  const flush = () =>
    page.evaluate(() => {
      const a = document.querySelector(".ac-scroll")!.getBoundingClientRect(),
        t = document.querySelector(".ac-register")!.getBoundingClientRect(),
        h = document
          .querySelector(".ac-register thead")!
          .getBoundingClientRect(),
        f = document.querySelector(".ac-footer")!.getBoundingClientRect();
      return (
        Math.abs(a.left - t.left) < 1 &&
        Math.abs(a.right - t.right) < 1 &&
        Math.abs(h.left - t.left) < 1 &&
        Math.abs(f.left - t.left) < 1 &&
        Math.abs(f.right - t.right) < 1
      );
    });
  assert.equal(await flush(), true);
  const control = await page.addStyleTag({
    content:
      "#ppo-acceptance .ac-scroll{padding-left:16px!important;padding-right:16px!important}",
  });
  assert.equal(await flush(), false, "Gutter negative control must fail");
  await control.evaluate((e) => e.parentNode?.removeChild(e));
  assert.equal(await flush(), true);
  results.push({
    check: "PJ09-04 full stylesheet flush geometry and negative control",
    passed: true,
  });
  for (const tone of Object.keys(specimens)) {
    const actual = await page
      .locator(".ac-tag.ac-" + tone)
      .first()
      .evaluate((e) => {
        const c = getComputedStyle(e);
        return {
          color: c.color,
          background: c.backgroundColor,
          padding: c.padding,
          radius: c.borderRadius,
          fontSize: c.fontSize,
          fontWeight: c.fontWeight,
          lineHeight: c.lineHeight,
        };
      });
    assert.deepEqual(actual, specimens[tone], tone);
  }
  results.push({
    check: "PJ09-05 independently rendered r22 tags",
    boardHash,
    specimens,
    passed: true,
  });
  const font = await page
    .locator(".ac-register td")
    .first()
    .evaluate((e) => {
      const c = getComputedStyle(e);
      return {
        font: c.font,
        stretch: c.fontStretch,
        loaded: document.fonts.check("400 14px Roboto"),
        transform: c.transform,
      };
    });
  assert.equal(font.loaded, true);
  assert.equal(font.stretch, "100%");
  assert.equal(font.transform, "none");
  results.push({ check: "Normal loaded Roboto", ...font });
  assert.equal(await page.locator(".mw-menu:visible").count(), 0);
  await page.screenshot({ path: out + "/1920-collapsed.png" });
  await page
    .locator("#header-menu")
    .getByRole("button", { name: "Show menu", exact: true })
    .click();
  await page.locator("#acceptance-menu").waitFor({ state: "visible" });
  const menu = await page.locator("#acceptance-menu").boundingBox(),
    inspector = await page.locator(".ac-inspector").boundingBox();
  assert(menu && Math.abs(menu.width - 220) < 2);
  assert(inspector && inspector.width === 464);
  await page.screenshot({ path: out + "/1920-open.png" });
  await page
    .getByRole("button", { name: "Close inspector", exact: true })
    .click();
  await page.screenshot({ path: out + "/1920-inspector-closed.png" });
  await page
    .getByRole("button", { name: "＋ Acceptance stage", exact: true })
    .click();
  await page.getByRole("dialog").waitFor();
  assert(
    await page
      .getByRole("dialog")
      .evaluate((e) => e.contains(document.activeElement)),
  );
  await page.screenshot({ path: out + "/decision-dialog.png" });
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("dialog").count(), 0);
  for (const segment of [
    "readiness",
    "outstanding",
    "handover",
    "closeout",
    "history",
  ]) {
    const response = await page.goto(
      `/projects/acceptance/${segment}?project=${project}&stage=${stage}&panel=closed`,
    );
    assert.equal(response?.status(), 200);
    await page.locator(".ac-view-heading").waitFor();
    assert.equal(await page.locator(".ac-error").count(), 0);
    results.push({ check: "PJ09-01 route " + segment, passed: true });
  }
  await page.goto(root + "&panel=closed");
  await page
    .getByRole("button", { name: "Greenhouse 01 acceptance", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Controls handover", exact: true })
    .click();
  await page
    .locator(".ac-inspector h2")
    .filter({ hasText: "Controls handover" })
    .waitFor();
  await page.goBack();
  assert(await page.url().includes("panel=closed"));
  results.push({ check: "PJ09-01 selection and Back", passed: true });
  for (const size of [
    { width: 1440, height: 1000, name: "1440-narrow" },
    { width: 390, height: 844, name: "390-phone" },
    { width: 960, height: 600, name: "200-percent-layout-equivalent" },
  ]) {
    await page.setViewportSize(size);
    await page.goto(root + "&panel=closed");
    await page.locator(".ac-count").waitFor();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      size.name,
    );
    await page.screenshot({ path: out + "/" + size.name + ".png" });
    const select =
      size.width <= 780
        ? page
            .locator(".ac-phone-row")
            .filter({ hasText: "Greenhouse 01 acceptance" })
        : page.getByRole("button", {
            name: "Greenhouse 01 acceptance",
            exact: true,
          });
    await select.click();
    await page.locator(".ac-inspector-overlay").waitFor();
    assert(
      await page
        .locator(".ac-inspector-overlay")
        .evaluate((e) => e.contains(document.activeElement)),
    );
    await page.screenshot({ path: out + "/" + size.name + "-inspector.png" });
    await page.keyboard.press("Escape");
    await page.locator(".ac-inspector-overlay").waitFor({ state: "hidden" });
    assert.equal(await page.locator(".ac-inspector-overlay").count(), 0);
    results.push({ check: "PJ09-06/07 " + size.name, passed: true });
  }
  const times = [];
  for (let i = 0; i < 5; i++) {
    const at = performance.now(),
      r = await page.request.get(
        "/api/v1/projects/acceptance?project=" + project,
      );
    assert.equal(r.status(), 200);
    times.push(Math.round(performance.now() - at));
  }
  results.push({
    check: "PJ09-55 read timings",
    stages: data.total,
    ms: times,
    environment:
      "Local compiled Next.js; PostgreSQL 16; no performance acceptance threshold claimed",
  });
  assert.deepEqual(errors, []);
  await writeFile(
    out + "/browser-results.json",
    JSON.stringify(
      {
        origin,
        browser: b.version(),
        build: (await readFile(".next/BUILD_ID", "utf8")).trim(),
        boardHash,
        results,
        errors,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify(results));
} finally {
  await b.close();
}
