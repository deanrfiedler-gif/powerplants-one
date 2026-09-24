import {
  test,
  expect,
  request as playwrightRequest,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import { randomUUID } from "node:crypto";
import {
  MATERIALS,
  type SignIn,
  type Call,
} from "../helpers/engineering-materials";
import {
  seedControlContext,
  command,
  saveFields,
  basisContent,
} from "../helpers/engineering-control";
import type { ControlRead } from "../../src/engineering/control/reads";
test.describe.configure({ timeout: 240000 });
const origin = () =>
  new URL(test.info().project.use.baseURL ?? "http://127.0.0.1:3000").origin;
function crew() {
  const contexts = new Map<string, APIRequestContext>();
  const as: SignIn = async (profile) => {
    let context = contexts.get(profile);
    if (!context) {
      context = await playwrightRequest.newContext({
        baseURL: origin(),
        extraHTTPHeaders: { Origin: origin() },
      });
      expect(
        (
          await context.post("/api/v1/local-session", { data: { profile } })
        ).ok(),
      ).toBe(true);
      contexts.set(profile, context);
    }
    const call: Call = async (path, body) => {
      const r = await context!.fetch(`/api/v1/${path}`, {
        method: body === undefined ? "GET" : "POST",
        data: body,
      });
      return { status: r.status(), body: await r.json() };
    };
    return call;
  };
  return {
    as,
    dispose: () => Promise.all([...contexts.values()].map((c) => c.dispose())),
  };
}
async function signIn(page: Page, profile: string) {
  expect(
    (
      await page.request.post("/api/v1/local-session", {
        headers: { Origin: origin() },
        data: { profile },
      })
    ).ok(),
  ).toBe(true);
}
async function made(tag: string) {
  const c = crew(),
    s = await seedControlContext(c.as, ` native browser ${tag}`),
    author = await c.as("materials-author");
  return { ...s, ...c, author };
}
async function accepted(call: Call, path: string, body: unknown) {
  const r = await call(path, body);
  expect(r.status, JSON.stringify(r.body)).toBe(201);
}
const noOverflow = async (page: Page) =>
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
test("EN02 actual native forms retain draft, six views, keyboard focus and original-operation recovery", async ({
  page,
}) => {
  const s = await made("basis");
  try {
    await signIn(page, "materials-author");
    await page.goto(`/engineering/${s.ids.package}/basis`);
    const root = page.locator("#ppo-engineering-control");
    await expect(
      root.getByRole("heading", { name: "No records yet" }),
    ).toBeVisible({ timeout: 60000 });
    await root.getByRole("button", { name: "Add basis", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog
      .getByLabel("Title", { exact: true })
      .fill(
        "SYN-PPO native basis with a deliberately long technical interface and responsibility description",
      );
    await dialog
      .getByLabel("Design basis and scope", { exact: true })
      .fill(
        "SYN-PPO fictional nursery layout basis; native authoring remains external.",
      );
    await dialog
      .getByRole("button", { name: "Requirements", exact: true })
      .click();
    await dialog
      .getByRole("button", { name: "Add requirement", exact: true })
      .click();
    await dialog
      .getByLabel("Requirement", { exact: true })
      .fill("SYN-PPO pressure interface");
    await dialog
      .getByLabel("Acceptance criterion", { exact: true })
      .fill("SYN evidence is retained against exact source");
    await dialog.getByRole("checkbox", { name: /SYN-PPO-INPUT/ }).check();
    await dialog
      .getByLabel("Reason for this change", { exact: true })
      .fill("SYN-PPO authored basis");
    let original: Record<string, unknown> | undefined,
      drop = true;
    await page.route(`**/api/v1/${s.base}`, async (route) => {
      if (route.request().method() === "POST" && drop) {
        drop = false;
        original = route.request().postDataJSON();
        const response = await route.fetch();
        expect(response.status()).toBe(201);
        await route.abort("failed");
      } else await route.continue();
    });
    await dialog
      .getByRole("button", { name: "Save basis", exact: true })
      .click();
    await expect(
      dialog.getByText("Outcome unknown", { exact: true }),
    ).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "Save basis", exact: true }),
    ).toBeDisabled();
    await dialog
      .getByRole("button", { name: "Retry unchanged operation" })
      .click();
    await expect(dialog).toHaveCount(0);
    await page.unroute(`**/api/v1/${s.base}`);
    const data = (await s.author(s.base)).body as ControlRead;
    expect(data.records.basis).toHaveLength(1);
    expect(
      data.history.filter((h) => h.subject_id === original!.id),
    ).toHaveLength(1);
    const basis = data.records.basis[0];
    for (const [segment, title] of [
      ["", "Basis & scope"],
      ["requirements", "Requirements"],
      ["assumptions", "Assumptions & questions"],
      ["interfaces", "Interfaces"],
      ["sources", "Calculations & sources"],
      ["review", "Review & handover"],
    ]) {
      await page.goto(
        `/engineering/${s.ids.package}/basis${segment ? "/" + segment : ""}?record=${basis.id}`,
      );
      await expect(
        page
          .locator(".ec-inspector")
          .getByRole("heading", { name: title, exact: true }),
      ).toBeVisible({ timeout: 60000 });
      await noOverflow(page);
    }
    await page
      .locator(".ec-inspector")
      .getByRole("button", { name: "Close inspector" })
      .click();
    await expect(page.locator(`#ec-record-${basis.id}`)).toBeFocused({
      timeout: 60000,
    });
    await page.keyboard.press("Shift+Tab");
    await expect(
      root.getByRole("button", { name: "Refresh", exact: true }),
    ).toBeFocused();
    await expect(
      root.getByRole("button", { name: "Refresh", exact: true }),
    ).not.toHaveCSS("outline-style", "none");
  } finally {
    await s.dispose();
  }
});
test("EN01–EN05 responsive registers, exact references, guides, empty states and read-only scope", async ({
  page,
}, info) => {
  test.skip(
    info.project.name === "mobile-chromium",
    "Explicit device/reflow matrix is executed once.",
  );
  const s = await made("layout");
  try {
    const basis = saveFields("basis", basisContent(s.source), {
      title:
        "SYN-PPO long basis reference and shared multilevel interface responsibility that must wrap",
    });
    await accepted(s.author, s.base, command(basis));
    const document = saveFields(
      "document",
      {
        schema_version: 1,
        source_ids: [s.source],
        discipline: "Hydraulics",
        document_type: "Native drawing",
      },
      { title: "SYN-PPO retained drawing with long controlled title" },
    );
    await accepted(s.author, s.base, command(document));
    await accepted(
      s.author,
      s.base,
      command({
        kind: "document",
        action: "revise_document",
        id: document.id,
        expected_version: 1,
        revision_id: randomUUID(),
        engineering_revision: "B",
        native_system: "SYN native CAD",
        native_reference:
          "SYN-PPO/models/" +
          "long-native-reference/".repeat(12) +
          "assembly.sldasm",
        native_version: "7.2",
        configuration: "SYN variant",
        basis_id: null,
        outputs: [
          {
            reference: "SYN-PPO/published/drawing.pdf",
            version: "4.0",
            content_hash: "d".repeat(64),
          },
        ],
      }),
    );
    await signIn(page, "materials-author");
    for (const [width, height] of [
      [1440, 960],
      [1024, 768],
      [390, 844],
      [320, 844],
      [720, 480],
    ]) {
      await page.setViewportSize({ width, height });
      await page.goto(
        `/engineering/${s.ids.package}/drawings?record=${document.id}`,
      );
      await expect(
        page.getByRole("heading", {
          name: "Controlled revisions",
          exact: true,
        }),
      ).toBeVisible({ timeout: 60000 });
      await expect(page.locator(".ec-inspector")).toContainText(
        "Source file version",
      );
      await noOverflow(page);
      const add = page.getByRole("button", {
        name: "Add document",
        exact: true,
      });
      const colours = await add.evaluate((element) => {
        const style = getComputedStyle(element);
        return [style.color, style.backgroundColor];
      });
      expect(colours[0]).not.toBe(colours[1]);
      await expect(add).toHaveCSS("color", "rgb(255, 255, 255)");
      await page.screenshot({
        path: test
          .info()
          .outputPath(`engineering-drawings-${width}x${height}.png`),
      });
      if (width === 390 || width === 320) {
        await page.locator(".ec-inspector").evaluate((element) => {
          element.scrollTop = element.scrollHeight;
        });
        await page.screenshot({
          path: test
            .info()
            .outputPath(`engineering-drawings-evidence-${width}x${height}.png`),
        });
      }
    }
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto(`/engineering/${s.ids.package}/basis?record=${basis.id}`);
    await expect(page.locator(".ec-inspector")).toBeVisible({ timeout: 60000 });
    await page
      .getByRole("button", { name: "Edit draft basis", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: "Edit draft basis", exact: true }),
    ).toBeFocused();
    await page
      .getByLabel("Search records", { exact: true })
      .fill("missing-synthetic-match");
    await expect(
      page.getByRole("heading", { name: "No records match" }),
    ).toBeVisible();
    await page.goto(`/engineering/${s.ids.package}/queries`);
    await expect(
      page.getByRole("heading", { name: "No records yet" }),
    ).toBeVisible({ timeout: 60000 });
    await signIn(page, "materials-viewer");
    await page.reload();
    await expect(page.locator(".ec-notice")).toContainText(
      "Read-only authoring",
      { timeout: 60000 },
    );
    await expect(
      page.getByRole("button", { name: "Add query", exact: true }),
    ).toHaveCount(0);
    await signIn(page, "second-company");
    await page.reload();
    await expect(page.locator(".business-error[role=alert]")).toBeVisible({
      timeout: 60000,
    });
    await expect(page.locator(".ec-register")).toHaveCount(0);
  } finally {
    await s.dispose();
  }
});
test("EN02 loading, validation, stale comparison and saving preserve the authored draft", async ({
  page,
}) => {
  const s = await made("stale");
  let releaseRead = () => {},
    releaseSave = () => {};
  try {
    const basis = saveFields("basis", basisContent(s.source));
    await accepted(s.author, s.base, command(basis));
    await signIn(page, "materials-author");
    const readGate = new Promise<void>((resolve) => {
      releaseRead = resolve;
    });
    let holdRead = true;
    await page.route(`**/api/v1/${s.base}*`, async (route) => {
      if (route.request().method() === "GET" && holdRead) {
        holdRead = false;
        await readGate;
      }
      await route.continue();
    });
    await page.goto(`/engineering/${s.ids.package}/basis?record=${basis.id}`);
    await expect(
      page
        .getByRole("status")
        .filter({ hasText: "Loading exact Engineering records" }),
    ).toBeVisible();
    releaseRead();
    await page
      .getByRole("button", { name: "Edit draft basis", exact: true })
      .click({ timeout: 60000 });
    await page.unroute(`**/api/v1/${s.base}*`);
    const dialog = page.getByRole("dialog"),
      title = dialog.getByLabel("Title", { exact: true });
    await title.fill("   ");
    await dialog
      .getByLabel("Reason for this change", { exact: true })
      .fill("SYN-PPO draft retained through correction");
    await dialog
      .getByRole("button", { name: "Save basis", exact: true })
      .click();
    await expect(dialog.locator(".business-error[role=alert]")).toBeVisible();
    await expect(title).toHaveValue("   ");
    await title.fill("SYN-PPO retained local draft");
    await accepted(
      s.author,
      s.base,
      command({
        ...basis,
        title: "SYN-PPO concurrent saved content",
        expected_version: 1,
      }),
    );
    await dialog
      .getByRole("button", { name: "Save basis", exact: true })
      .click();
    await expect(
      dialog.getByRole("region", { name: "Compare stale draft" }),
    ).toBeVisible();
    await expect(title).toHaveValue("SYN-PPO retained local draft");
    await dialog
      .getByRole("button", { name: "Read latest saved content", exact: true })
      .click();
    await expect(
      dialog.getByText("Latest saved version 2", { exact: true }),
    ).toBeVisible();
    await expect(dialog).toContainText("SYN-PPO concurrent saved content");
    await dialog
      .getByRole("button", {
        name: "Use version 2 for my retained draft",
        exact: true,
      })
      .click();
    const saveGate = new Promise<void>((resolve) => {
      releaseSave = resolve;
    });
    await page.route(`**/api/v1/${s.base}`, async (route) => {
      if (route.request().method() === "POST") await saveGate;
      await route.continue();
    });
    await dialog
      .getByRole("button", { name: "Save basis", exact: true })
      .click();
    await expect(dialog.getByRole("status")).toContainText(
      "Saving the exact operation",
    );
    await expect(title).toBeDisabled();
    releaseSave();
    await expect(dialog).toHaveCount(0);
    const saved = ((await s.author(s.base)).body as ControlRead).records
      .basis[0];
    expect(saved.version).toBe(3);
    expect(saved.title).toBe("SYN-PPO retained local draft");
    await page.getByRole("button", { name: "Page guide", exact: true }).click();
    await expect(page.getByRole("dialog")).toContainText("Design basis");
  } finally {
    releaseRead();
    releaseSave();
    await page.unrouteAll({ behavior: "wait" });
    await s.dispose();
  }
});

test("EN04–EN05 compiled journey: formal response, independent review, exact issue and recipient evidence", async ({
  page,
}) => {
  const s = await made("review");
  try {
    const query = saveFields("query", {
      schema_version: 1,
      source_ids: [s.source],
      question: "SYN-PPO confirm exact interface",
      deliverable_ids: [],
      change_id: null,
      review_required: true,
    });
    await accepted(s.author, s.base, command(query));
    await signIn(page, "materials-author");
    await page.goto(`/engineering/${s.ids.package}/queries?record=${query.id}`);
    await page
      .getByRole("button", { name: "Record formal response", exact: true })
      .click({ timeout: 60000 });
    let dialog = page.getByRole("dialog");
    await dialog
      .getByLabel("Formal technical answer", { exact: true })
      .fill("SYN-PPO answer tied to the exact retained brief");
    await dialog
      .getByLabel("Resulting actions and affected work", { exact: true })
      .fill("Prepare controlled document successor separately");
    await dialog
      .getByLabel("Reason", { exact: true })
      .fill("SYN formal answer");
    await dialog
      .getByRole("button", { name: "Record formal response", exact: true })
      .click();
    await expect(dialog).toHaveCount(0);
    await signIn(page, "materials-reviewer");
    await page.reload();
    await page
      .getByRole("button", { name: "Review technical answer", exact: true })
      .click({ timeout: 60000 });
    dialog = page.getByRole("dialog");
    await dialog
      .getByRole("combobox", { name: "Technical disposition", exact: true })
      .selectOption("Resolved");
    await dialog
      .getByLabel("Disposition rationale", { exact: true })
      .fill("SYN independent technical check");
    await dialog.getByLabel("Reason", { exact: true }).fill("SYN checked");
    await dialog
      .getByRole("button", { name: "Review technical answer", exact: true })
      .click();
    await expect(dialog).toHaveCount(0);
    const reviewId = randomUUID();
    await accepted(
      s.author,
      s.base,
      command({
        kind: "review",
        action: "submit_review",
        id: reviewId,
        reference: "SYN-PPO-REVIEW-" + reviewId.slice(0, 8),
        title: "SYN-PPO exact source review",
        reviewer_id: MATERIALS.reviewer.id,
        due_date: null,
        purpose: "InformationOnly",
        source_ids: [s.source],
        basis_id: null,
        document_revision_ids: [],
        submittal_ids: [],
        predecessor_id: null,
      }),
    );
    await page.goto(`/engineering/${s.ids.package}/reviews?record=${reviewId}`);
    await page
      .getByRole("button", { name: "Record review outcome", exact: true })
      .click({ timeout: 60000 });
    dialog = page.getByRole("dialog");
    await dialog
      .getByRole("combobox", { name: "Review outcome", exact: true })
      .selectOption("Reviewed");
    await dialog
      .getByLabel("Review rationale", { exact: true })
      .fill("SYN source checked for information");
    await dialog
      .getByLabel("Reason", { exact: true })
      .fill("SYN review complete");
    await dialog
      .getByRole("button", { name: "Record review outcome", exact: true })
      .click();
    await expect(dialog).toHaveCount(0);
    await signIn(page, "materials-release");
    await page.reload();
    await page
      .getByRole("button", { name: "Issue exact reviewed set", exact: true })
      .click({ timeout: 60000 });
    dialog = page.getByRole("dialog");
    await dialog
      .getByLabel("Formal issue reference", { exact: true })
      .fill("SYN-PPO-ISSUE-" + randomUUID().slice(0, 8));
    await dialog
      .getByLabel("Issue title", { exact: true })
      .fill("SYN-PPO issue for information");
    await dialog
      .getByRole("checkbox", { name: MATERIALS.viewer.name, exact: true })
      .check();
    await dialog
      .getByLabel("Reason", { exact: true })
      .fill("SYN issued exact reviewed source");
    await dialog
      .getByRole("button", { name: "Issue exact reviewed set", exact: true })
      .click();
    await expect(dialog).toHaveCount(0);
    const issuer = await s.as("materials-release"),
      issue = ((await issuer(s.base)).body as ControlRead).records.issue[0];
    await page.goto(
      `/engineering/${s.ids.package}/reviews/issues?record=${issue.id}`,
    );
    for (const label of ["Record sent evidence", "Record delivery evidence"]) {
      await page
        .getByRole("button", { name: label, exact: true })
        .click({ timeout: 60000 });
      dialog = page.getByRole("dialog");
      await dialog
        .getByLabel("Evidence reference and observation", { exact: true })
        .fill("SYN-PPO retained " + label);
      await dialog
        .getByLabel("Reason", { exact: true })
        .fill("SYN separate observation");
      await dialog.getByRole("button", { name: label, exact: true }).click();
      await expect(dialog).toHaveCount(0);
    }
    await signIn(page, "materials-viewer");
    await page.reload();
    await page
      .getByRole("button", { name: "Acknowledge exact issue", exact: true })
      .click({ timeout: 60000 });
    dialog = page.getByRole("dialog");
    await dialog
      .getByLabel("Evidence reference and observation", { exact: true })
      .fill("SYN-PPO recipient read this exact manifest");
    await dialog.getByLabel("Reason", { exact: true }).fill("SYN acknowledged");
    await dialog
      .getByRole("button", { name: "Acknowledge exact issue", exact: true })
      .click();
    await expect(dialog).toHaveCount(0);
    await expect(page.locator(".ec-inspector")).toContainText(
      "Acknowledged: SYN-PPO recipient read this exact manifest",
      { timeout: 60000 },
    );
  } finally {
    await s.dispose();
  }
});
