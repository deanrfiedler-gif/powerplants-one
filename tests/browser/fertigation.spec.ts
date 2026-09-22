import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { crmBase, crmCreate } from "../helpers/crm";
import { discoveryInput } from "../helpers/estimating-discovery";
import type { Scope } from "../../src/estimating/fertigation/types";
import { compareFertigationDesign } from "../helpers/fertigation-design";
import { largeFertigationScope } from "../helpers/fertigation-large";
import { scenarioComparisonScope } from "../helpers/fertigation-scenarios";
import { calculate } from "../../src/estimating/fertigation/engine";
import { validateScope } from "../../src/estimating/fertigation/validation";
import { valveCsv } from "../../src/estimating/fertigation/output";
import {
  blankScope,
  blankSource,
  blankMaster,
  blankValve,
} from "../../src/estimating/fertigation/definition";

test.use({ actionTimeout: 15000 });
test.setTimeout(90000);
async function call(page: Page, path: string, body?: unknown) {
  const result = await page.request.fetch(`/api/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers:
      body === undefined
        ? {}
        : {
            Origin: new URL(page.url()).origin,
            "Content-Type": "application/json",
          },
    data: body,
  });
  expect(result.ok(), await result.text()).toBe(true);
  return result.json();
}
async function login(page: Page, route = "/estimating/discovery") {
  await page.goto(route);
  await page
    .getByLabel("Identity", { exact: true })
    .selectOption("coordinator");
  await page
    .getByRole("button", { name: "Use this identity", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Change identity", exact: true }),
  ).toBeVisible();
}
async function savedDiscovery(page: Page) {
  await login(page);
  const opportunity = {
    ...crmCreate(),
    title: `SYN Native fertigation ${randomUUID()}`,
  };
  await call(page, "crm/opportunities", opportunity);
  const discovery = discoveryInput();
  const preview = await call(page, "estimating/workspaces/preview", {
    opportunity_id: opportunity.id,
    discovery,
  });
  const input = {
    ...crmBase(),
    id: randomUUID(),
    option_id: randomUUID(),
    revision_id: randomUUID(),
    opportunity_id: opportunity.id,
    discovery,
    expected_opportunity_version: preview.expected_opportunity_version,
    context_hash: preview.context_hash,
    confirmed_question_ids: preview.required_confirmation_ids,
  };
  await call(page, "estimating/workspaces", input);
  await page.goto(
    `/estimating/discovery/${input.id}?option=${input.option_id}`,
  );
  await expect(page.locator("#ppo-estimate-wizard")).toBeVisible();
  return input;
}
async function moduleView(page: Page, label: string) {
  await expect(
    page.getByRole("button", { name: "Irrigation valves", exact: true }),
  ).toBeVisible();
  const nav = page.getByRole("navigation", { name: "Fertigation views" });
  if (!(await nav.isVisible())) {
    const expand = page.getByRole("button", {
      name: "Expand Fertigation menu",
      exact: true,
    });
    if (await expand.isVisible()) await expand.click();
    else
      await page
        .getByRole("button", { name: "Fertigation menu", exact: true })
        .click();
  }
  await nav.getByRole("button", { name: label, exact: true }).click();
}
async function inspector(page: Page, add: string, label: string) {
  await page.getByRole("button", { name: `+ Add ${add}`, exact: true }).click();
  const dialog = page.getByRole("dialog", { name: `Edit ${add}`, exact: true });
  await dialog.getByLabel("Label / reference", { exact: true }).fill(label);
  if (
    await dialog.getByRole("combobox", { name: "Phase", exact: true }).count()
  )
    await dialog
      .getByRole("combobox", { name: "Phase", exact: true })
      .selectOption("existing");
  return dialog;
}

test("FN-T61/77/78 native Discovery to saved valve and clean-context exact revision", async ({
  page,
  browser,
}, info) => {
  const discovery = await savedDiscovery(page);
  const entry = page.getByRole("link", {
    name: "Priva Fertigation Configurator",
    exact: true,
  });
  if (!(await entry.isVisible()))
    await page
      .getByRole("button", { name: "Estimating menu", exact: true })
      .click();
  await entry.click();
  await page
    .getByRole("link", { name: "New fertigation scope", exact: true })
    .click();
  await page
    .getByLabel("Scope name", { exact: true })
    .fill("SYN Berry reference native scope");
  await page.getByLabel("Unknown", { exact: true }).uncheck();
  await page.getByLabel("Commercial berries", { exact: true }).check();
  await page
    .getByLabel("Crop or plant description", { exact: true })
    .fill("SYN commercial berry reference; unverified design");
  await page
    .getByRole("button", { name: "Create saved scope", exact: true })
    .click();
  await expect(page).toHaveURL(/\/estimating\/fertigation\/[0-9a-f-]{36}$/);
  const scopeId = new URL(page.url()).pathname.split("/").at(-1)!;
  await moduleView(page, "Water & hydraulics");
  let dialog = await inspector(page, "water source", "SYN source A");
  await dialog.getByLabel("Reliable flow (m³/h)", { exact: true }).fill("60");
  await dialog
    .getByRole("button", { name: "Apply to draft", exact: true })
    .click();
  await moduleView(page, "Evidence & delivery");
  dialog = await inspector(page, "evidence reference", "SYN flow observation");
  await dialog
    .getByLabel("Reference", { exact: true })
    .fill("SYN witnessed valve-flow measurement; no manufacturer confirmation");
  await dialog
    .getByLabel("Source revision", { exact: true })
    .fill("SYN measurement r01");
  await dialog
    .getByLabel("Attribution", { exact: true })
    .fill("SYN field observer");
  await dialog
    .getByLabel("Applicability", { exact: true })
    .fill("SYN V-A1 at the recorded source boundary only");
  await dialog
    .getByRole("button", { name: "Apply to draft", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Irrigation valves", exact: true })
    .click();
  await page
    .getByRole("tab", { name: "Mainline / master valves", exact: true })
    .click();
  dialog = await inspector(page, "mainline / master valve", "SYN Master A");
  await dialog
    .getByRole("combobox", { name: "Water source", exact: true })
    .selectOption({ label: "SYN source A" });
  await dialog
    .getByRole("button", { name: "Apply to draft", exact: true })
    .click();
  await page.getByRole("tab", { name: "Growing areas", exact: true }).click();
  dialog = await inspector(page, "growing area", "SYN represented area");
  await dialog
    .getByLabel("Represented area (m²)", { exact: true })
    .fill("20000");
  await dialog
    .getByRole("combobox", { name: "Area measurement role", exact: true })
    .selectOption("planted");
  await dialog
    .getByRole("button", { name: "Apply to draft", exact: true })
    .click();
  await page
    .getByRole("tab", { name: "Irrigation valves", exact: true })
    .click();
  const add = page.getByRole("button", {
    name: "+ Add irrigation valve",
    exact: true,
  });
  await expect(add).toBeVisible();
  const box = await add.boundingBox();
  expect(box && box.y + box.height).toBeLessThan(page.viewportSize()!.height);
  await compareFertigationDesign(page, page.context(), info);
  dialog = await inspector(page, "irrigation valve", "SYN V-A1");
  await dialog
    .getByRole("combobox", { name: "Mainline / master valve", exact: true })
    .selectOption({ label: "SYN Master A" });
  await dialog
    .getByRole("combobox", { name: "Water source", exact: true })
    .selectOption({ label: "SYN source A" });
  await dialog
    .getByRole("combobox", { name: "Hydraulic demand basis", exact: true })
    .selectOption("measured");
  await dialog
    .getByLabel("Measured valve flow (m³/h)", { exact: true })
    .fill("16");
  await dialog
    .getByRole("combobox", { name: "Flow evidence", exact: true })
    .selectOption({ label: "SYN flow observation" });
  await dialog.getByLabel("SYN flow observation", { exact: true }).check();
  await dialog
    .getByRole("button", { name: "Add service allocation", exact: true })
    .click();
  await dialog
    .getByRole("combobox", { name: "Growing area", exact: true })
    .selectOption({ label: "SYN represented area" });
  await dialog.getByLabel("Served area (m²)", { exact: true }).fill("20000");
  await dialog
    .getByLabel("Explicit share of valve flow (fraction)", { exact: true })
    .fill("1");
  await dialog
    .getByRole("button", { name: "Apply to draft", exact: true })
    .click();
  await expect(page.locator(".fn-status")).toHaveText("Unsaved changes");
  await page
    .getByRole("button", { name: "Save revision", exact: true })
    .click();
  await expect(page.locator(".fn-status")).toHaveText("Saved revision 2");
  const saved = (await call(page, `estimating/fertigation/${scopeId}`)) as {
    revision: {
      id: string;
      content_hash: string;
      proposal: Scope;
      binding: { revision_id: string };
    };
  };
  expect(saved.revision.binding.revision_id).toBe(discovery.revision_id);
  expect(saved.revision.proposal.valves[0].measured_flow_m3h).toBe(16);
  expect(saved.revision.proposal.valves[0].flow_evidence_id).toBe(
    saved.revision.proposal.evidence[0].id,
  );
  expect(saved.revision.proposal.valves[0].evidence_ids).toEqual([
    saved.revision.proposal.evidence[0].id,
  ]);
  expect(saved.revision.proposal.valves[0].allocations[0].served_area_m2).toBe(
    20000,
  );
  await page.screenshot({
    path: info.outputPath(`native-valves-${page.viewportSize()!.width}.png`),
  });
  await page
    .getByRole("button", { name: "Change identity", exact: true })
    .click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page.locator("#ppo-fertigation")).toHaveCount(0);
  const clean = await browser.newContext({
    baseURL: new URL(page.url()).origin,
    viewport: page.viewportSize()!,
    locale: "en-AU",
  });
  const reopened = await clean.newPage();
  try {
    await login(
      reopened,
      `/estimating/fertigation/${scopeId}?revision_id=${saved.revision.id}&view=growing`,
    );
    await expect(reopened.locator(".fn-status")).toHaveText(
      "Historical revision · read-only",
    );
    await expect(
      reopened.getByRole("button", { name: "SYN V-A1", exact: true }),
    ).toBeVisible();
    await reopened.getByRole("button", { name: "View", exact: true }).click();
    const view = reopened.getByRole("dialog", {
      name: "View irrigation valve",
      exact: true,
    });
    await expect(
      view.getByLabel("Measured valve flow (m³/h)", { exact: true }),
    ).toHaveValue("16");
    await expect(
      view.getByRole("combobox", {
        name: "Mainline / master valve",
        exact: true,
      }),
    ).toHaveValue(saved.revision.proposal.masters[0].id);
    const exact = await call(
      reopened,
      `estimating/fertigation/${scopeId}?revision_id=${saved.revision.id}`,
    );
    expect(exact.revision.content_hash).toBe(saved.revision.content_hash);
    expect(exact.revision.proposal).toEqual(saved.revision.proposal);
    await reopened.screenshot({
      path: info.outputPath(
        `native-exact-reopen-${page.viewportSize()!.width}.png`,
      ),
    });
  } finally {
    await clean.close();
  }
});

test("FN-T56 native 100-area 1000-valve API and bounded register responsiveness", async ({
  page,
}, info) => {
  const discovery = await savedDiscovery(page);
  const options = await call(
    page,
    `estimating/fertigation/options?estimating_workspace_id=${discovery.id}`,
  );
  const source = options.sources.find(
    (x: { option_id: string }) => x.option_id === discovery.option_id,
  );
  expect(source).toBeTruthy();
  const proposal = largeFertigationScope();
  const timings: Record<string, number | string> = {
    fixture: "100 areas; 1000 valves; 100 groups; 300 delivery events",
    proposal_utf8_bytes: Buffer.byteLength(JSON.stringify(proposal)),
    viewport: `${page.viewportSize()!.width}x${page.viewportSize()!.height}`,
  };
  let started = performance.now();
  const validated = validateScope(proposal);
  timings.validation_ms = performance.now() - started;
  started = performance.now();
  const calculation = calculate(validated);
  timings.engine_ms = performance.now() - started;
  expect(calculation.schedule.events).toHaveLength(300);
  const id = randomUUID();
  started = performance.now();
  await call(page, "estimating/fertigation", {
    ...crmBase(),
    id,
    name: proposal.name,
    estimating_workspace_id: discovery.id,
    option_id: source.option_id,
    revision_id: source.revision_id,
    expected_workspace_version: source.expected_workspace_version,
    coverage: {
      system_id: null,
      area_ids: [],
      facility_ids: source.facility_ids,
    },
    proposal,
  });
  timings.api_create_ms = performance.now() - started;
  started = performance.now();
  const saved = await call(page, `estimating/fertigation/${id}`);
  timings.api_read_ms = performance.now() - started;
  timings.read_response_utf8_bytes = Buffer.byteLength(JSON.stringify(saved));
  expect(saved.revision.proposal.valves).toHaveLength(1000);
  proposal.valves[999].notes = "SYN exact successor performance proof";
  started = performance.now();
  await call(page, `estimating/fertigation/${id}/revisions`, {
    ...crmBase(),
    expected_version: saved.scope.version,
    expected_revision_id: saved.revision.id,
    source_context_hash: saved.revision.binding.upstream_context_hash,
    proposal,
  });
  timings.api_save_ms = performance.now() - started;
  started = performance.now();
  await page.goto(`/estimating/fertigation/${id}?view=growing`);
  await expect(page.locator("#ppo-fertigation tbody tr")).toHaveCount(25);
  timings.ui_navigation_ms = performance.now() - started;
  await expect(
    page.getByRole("button", { name: "SYN capacity valve 0001", exact: true }),
  ).toBeVisible();
  started = performance.now();
  await page.getByRole("button", { name: "Next 25", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "SYN capacity valve 0026", exact: true }),
  ).toBeVisible();
  timings.ui_next_page_ms = performance.now() - started;
  await expect(page.locator("#ppo-fertigation tbody tr")).toHaveCount(25);
  started = performance.now();
  await page
    .getByLabel("Search irrigation valves", { exact: true })
    .fill("1000");
  await expect(page.locator("#ppo-fertigation tbody tr")).toHaveCount(1);
  await page
    .getByRole("button", { name: "SYN capacity valve 1000", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Edit irrigation valve",
    exact: true,
  });
  await expect(dialog.getByLabel("Notes", { exact: true })).toHaveValue(
    "SYN exact successor performance proof",
  );
  timings.ui_search_open_ms = performance.now() - started;
  await dialog
    .getByRole("button", { name: "Apply to draft", exact: true })
    .click();
  await page.locator("#ppo-fertigation .fn-scroll").evaluate((element) => {
    element.scrollTop = 0;
  });
  await page.screenshot({
    path: info.outputPath("native-large-paged-register.png"),
  });
  await info.attach("native-large-performance.json", {
    body: JSON.stringify(timings, null, 2),
    contentType: "application/json",
  });
  await writeFile(
    info.outputPath("native-large-performance.json"),
    JSON.stringify(timings, null, 2),
  );
  if (page.viewportSize()!.width === 1440) {
    // CSS zoom verifies reflow at twice the CSS scale. This is not an OS/assistive-device or browser-menu zoom claim.
    await page.evaluate(() => {
      document.documentElement.style.zoom = "2";
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByRole("button", { name: "+ Add irrigation valve", exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: info.outputPath("native-css-zoom-200-percent.png"),
    });
    await page.evaluate(() => {
      document.documentElement.style.zoom = "";
    });
  }
});

test("FN-T62/65/87 native neutral context and failed editor preserve numeric unknowns", async ({
  page,
}, info) => {
  const discovery = await savedDiscovery(page);
  await page.goto(
    `/estimating/fertigation/new?estimating_workspace_id=${discovery.id}&option_id=${discovery.option_id}`,
  );
  await page
    .getByLabel("Scope name", { exact: true })
    .fill("SYN neutral nursery context");
  await page.getByLabel("Unknown", { exact: true }).uncheck();
  await page.getByLabel("Commercial nursery", { exact: true }).check();
  await page
    .getByLabel("Crop or plant description", { exact: true })
    .fill("SYN mixed ornamental plants");
  await page
    .getByRole("button", { name: "Create saved scope", exact: true })
    .click();
  await expect(page).toHaveURL(/\/estimating\/fertigation\/[0-9a-f-]{36}$/);
  await page
    .getByRole("button", { name: "Irrigation valves", exact: true })
    .click();
  const dialog = await inspector(
    page,
    "irrigation valve",
    "SYN Nursery measurement",
  );
  await dialog
    .getByRole("combobox", { name: "Hydraulic demand basis", exact: true })
    .selectOption("measured");
  await dialog
    .getByLabel("Measured valve flow (m³/h)", { exact: true })
    .fill("1.");
  await dialog
    .getByRole("button", { name: "Apply to draft", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText(
    "finite non-negative number",
  );
  await expect(
    dialog.getByLabel("Measured valve flow (m³/h)", { exact: true }),
  ).toHaveValue("1.");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "+ Add irrigation valve", exact: true }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "+ Add irrigation valve", exact: true })
    .press("Enter");
  await expect(
    dialog.getByLabel("Measured valve flow (m³/h)", { exact: true }),
  ).toHaveValue("1.");
  await dialog
    .getByRole("button", { name: "Keep entries and close", exact: true })
    .click();
  await page
    .getByRole("button", { name: "+ Add irrigation valve", exact: true })
    .click();
  await expect(
    dialog.getByLabel("Measured valve flow (m³/h)", { exact: true }),
  ).toHaveValue("1.");
  await dialog
    .getByLabel("Measured valve flow (m³/h)", { exact: true })
    .fill("12");
  await dialog
    .getByRole("button", { name: "Apply to draft", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Save revision", exact: true })
    .click();
  await expect(page.locator(".fn-status")).toHaveText("Saved revision 2");
  const id = new URL(page.url()).pathname.split("/").at(-1),
    saved = await call(page, `estimating/fertigation/${id}`);
  expect(saved.revision.proposal.crop_groups).toEqual([]);
  expect(saved.revision.proposal.valves[0].emitter.count).toBeNull();
  expect(saved.revision.proposal.production_context.crop_description).toBe(
    "SYN mixed ornamental plants",
  );
  expect(saved.calculation.daily_demand_m3.state).not.toBe("known");
  for (const width of [1440, 1280, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(page.locator("#ppo-fertigation h1")).toHaveCount(1);
    await expect(page.locator("#ppo-fertigation iframe")).toHaveCount(0);
    await page.screenshot({
      path: info.outputPath(`native-shell-${width}.png`),
    });
  }
  // Hold a real server response while the draft changes: stale results must not replace the new draft or leave its calculation control stuck.
  await moduleView(page, "Overview");
  let releasePreview!: () => void;
  let previewReady!: () => void;
  const held = new Promise<void>((resolve) => {
    releasePreview = resolve;
  });
  const ready = new Promise<void>((resolve) => {
    previewReady = resolve;
  });
  const previewPath = `**/api/v1/estimating/fertigation/${id}/preview`;
  await page.route(previewPath, async (route) => {
    const response = await route.fetch();
    previewReady();
    await held;
    await route.fulfill({ response });
  });
  try {
    await page
      .getByRole("button", { name: "Validate & calculate draft", exact: true })
      .click();
    await ready;
    await page
      .getByRole("button", { name: "Edit production context", exact: true })
      .click();
    const context = page.getByRole("dialog", {
      name: "Edit Production context",
      exact: true,
    });
    await context
      .getByLabel("Crop or plant description", { exact: true })
      .fill("SYN nursery changed during calculation");
    await context
      .getByRole("button", { name: "Apply to draft", exact: true })
      .click();
    releasePreview();
    await expect(
      page.getByRole("button", {
        name: "Validate & calculate draft",
        exact: true,
      }),
    ).toBeEnabled();
    await expect(
      page.getByText(
        "Draft changed. Recalculate to inspect the current proposal; saved results remain attached to the earlier revision.",
        { exact: true },
      ),
    ).toBeVisible();
    await expect(
      page.getByText("SYN nursery changed during calculation", { exact: true }),
    ).toBeVisible();
  } finally {
    releasePreview();
    await page.unroute(previewPath);
  }
});

test("FN-T16/17/79/86 native restore copy archive preserve exact history and recover original acceptance", async ({
  page,
}, info) => {
  const discovery = await savedDiscovery(page);
  const options = await call(
    page,
    `estimating/fertigation/options?estimating_workspace_id=${discovery.id}`,
  );
  const source = options.sources.find(
    (item: { option_id: string }) => item.option_id === discovery.option_id,
  );
  const proposal = blankScope();
  proposal.name = "SYN lifecycle preservation scope";
  proposal.sources = [
    {
      ...blankSource(randomUUID()),
      label: "SYN lifecycle source",
      phase: "proposed",
    },
  ];
  proposal.masters = [
    {
      ...blankMaster(randomUUID()),
      label: "SYN lifecycle master",
      phase: "proposed",
      source_id: proposal.sources[0].id,
    },
  ];
  proposal.valves = [
    {
      ...blankValve(randomUUID()),
      label: "SYN original valve",
      phase: "proposed",
      source_id: proposal.sources[0].id,
      master_id: proposal.masters[0].id,
      flow_basis: "design_allowance",
      design_flow_m3h: 2,
    },
  ];
  const scopeId = randomUUID();
  await call(page, "estimating/fertigation", {
    ...crmBase(),
    id: scopeId,
    name: proposal.name,
    estimating_workspace_id: discovery.id,
    option_id: source.option_id,
    revision_id: source.revision_id,
    expected_workspace_version: source.expected_workspace_version,
    coverage: {
      system_id: null,
      area_ids: [],
      facility_ids: source.facility_ids,
    },
    proposal,
  });
  const original = await call(page, `estimating/fertigation/${scopeId}`);
  await page.goto(`/estimating/fertigation/${scopeId}?view=growing`);
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  const valve = page.getByRole("dialog", {
    name: "Edit irrigation valve",
    exact: true,
  });
  await valve
    .getByLabel("Label / reference", { exact: true })
    .fill("SYN revised valve");
  await valve
    .getByLabel("Design allowance (m³/h)", { exact: true })
    .fill("3.5");
  await valve
    .getByRole("button", { name: "Apply to draft", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Save revision", exact: true })
    .click();
  await expect(page.locator(".fn-status")).toHaveText("Saved revision 2");
  const revised = await call(page, `estimating/fertigation/${scopeId}`);
  expect(revised.revision.proposal.valves[0].id).toBe(proposal.valves[0].id);
  await moduleView(page, "Scope review");
  await page
    .getByRole("button", { name: "History & exact revisions", exact: true })
    .click();
  let history = page.getByRole("dialog", {
    name: "History & exact revisions",
    exact: true,
  });
  await history
    .getByRole("button", { name: "Restore saved revision", exact: true })
    .click();
  await history
    .getByRole("combobox", { name: "Saved revision to restore", exact: true })
    .selectOption(original.revision.id);
  await history
    .getByRole("textbox", { name: "Reason for restore", exact: true })
    .fill("SYN reviewed restoration preserves old saved content");
  await history
    .getByRole("button", {
      name: "Close History & exact revisions",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Resume history action", exact: true })
    .click();
  await expect(
    history.getByRole("textbox", { name: "Reason for restore", exact: true }),
  ).toHaveValue("SYN reviewed restoration preserves old saved content");
  await history
    .getByRole("button", { name: "Restore as new revision", exact: true })
    .click();
  await expect(page.locator(".fn-status")).toHaveText("Saved revision 3");
  const restored = await call(page, `estimating/fertigation/${scopeId}`);
  expect(restored.revision.id).not.toBe(original.revision.id);
  expect(restored.revision.proposal).toEqual(original.revision.proposal);
  const preserved = await call(
    page,
    `estimating/fertigation/${scopeId}?revision_id=${revised.revision.id}`,
  );
  expect(preserved.revision).toEqual(revised.revision);
  await history
    .getByRole("button", { name: "Copy saved revision", exact: true })
    .click();
  await history
    .getByRole("combobox", { name: "Saved revision to copy", exact: true })
    .selectOption(revised.revision.id);
  await history
    .getByLabel("Copy name", { exact: true })
    .fill("SYN preserved revision copied");
  await history
    .getByRole("textbox", { name: "Reason for copy", exact: true })
    .fill("SYN independent copied proposal");
  await history
    .getByRole("button", { name: "Create saved copy", exact: true })
    .click();
  const copyLink = history.getByRole("link", {
    name: "Open copied scope",
    exact: true,
  });
  await expect(copyLink).toBeVisible();
  const copyId = (await copyLink.getAttribute("href"))!.split("/").at(-1)!;
  const copied = await call(page, `estimating/fertigation/${copyId}`);
  expect(copied.revision.proposal.valves[0].id).not.toBe(proposal.valves[0].id);
  expect(copied.revision.proposal.valves[0].master_id).toBe(
    copied.revision.proposal.masters[0].id,
  );
  expect(copied.revision.proposal.valves[0].source_id).toBe(
    copied.revision.proposal.sources[0].id,
  );
  expect(copied.revision.proposal.valves[0].label).toBe("SYN revised valve");
  expect(copied.revision.proposal.valves[0].design_flow_m3h).toBe(3.5);
  await copyLink.click();
  await expect(page).toHaveURL(
    new RegExp(`/estimating/fertigation/${copyId}$`),
  );
  await moduleView(page, "Scope review");
  await page
    .getByRole("button", { name: "History & exact revisions", exact: true })
    .click();
  history = page.getByRole("dialog", {
    name: "History & exact revisions",
    exact: true,
  });
  await history
    .getByRole("button", { name: "Archive scope", exact: true })
    .click();
  await history
    .getByRole("textbox", { name: "Reason for archive", exact: true })
    .fill("SYN archive with exact evidence retained");
  let archivePosts = 0;
  const archivePath = `**/api/v1/estimating/fertigation/${copyId}/archive`;
  await page.route(archivePath, async (route) => {
    archivePosts++;
    const response = await route.fetch();
    expect(response.ok()).toBe(true);
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        code: "SYNResponseInterrupted",
        message: "SYN accepted response interrupted",
        retryable: true,
      }),
    });
  });
  try {
    await history
      .getByRole("button", { name: "Confirm archive scope", exact: true })
      .click();
    await expect(
      history.getByRole("button", {
        name: "Confirm original history action",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      history.getByRole("button", {
        name: "Close History & exact revisions",
        exact: true,
      }),
    ).toBeDisabled();
    await history
      .getByRole("button", {
        name: "Confirm original history action",
        exact: true,
      })
      .click();
    await expect(page.locator(".fn-status")).toHaveText(
      "Archived · saved revision 1",
    );
    expect(archivePosts).toBe(1);
    const archived = await call(page, `estimating/fertigation/${copyId}`);
    expect(archived.scope.state).toBe("Archived");
    expect(archived.scope.version).toBe(2);
    expect(archived.can_edit).toBe(false);
    expect(archived.revision).toEqual(copied.revision);
    await expect(
      history.getByRole("link", { name: "Revision 1", exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: info.outputPath("native-archived-exact-history.png"),
    });
  } finally {
    await page.unroute(archivePath);
  }
});

test("FN-T07/T18/T49 compare shared scenarios, filter valve areas and review exact receiving quantities before acceptance", async ({
  page,
}, info) => {
  const discovery = await savedDiscovery(page);
  const options = await call(
      page,
      `estimating/fertigation/options?estimating_workspace_id=${discovery.id}`,
    ),
    source = options.sources[0];
  const proposal = scenarioComparisonScope(),
    scopeId = randomUUID();
  await call(page, "estimating/fertigation", {
    ...crmBase(),
    id: scopeId,
    name: proposal.name,
    estimating_workspace_id: discovery.id,
    option_id: source.option_id,
    revision_id: source.revision_id,
    expected_workspace_version: source.expected_workspace_version,
    coverage: {
      system_id: null,
      area_ids: [],
      facility_ids: source.facility_ids,
    },
    proposal,
  });
  const original = await call(page, `estimating/fertigation/${scopeId}`);
  await page.goto(`/estimating/fertigation/${scopeId}?view=growing`);
  await page
    .getByRole("combobox", { name: "Area filter", exact: true })
    .selectOption(proposal.areas[0].id);
  await expect(
    page.getByRole("row", { name: /SYN North valve/ }),
  ).toBeVisible();
  await expect(page.getByRole("row", { name: /SYN South valve/ })).toHaveCount(
    0,
  );
  await page
    .getByRole("combobox", { name: "Area filter", exact: true })
    .selectOption(proposal.areas[1].id);
  await expect(
    page.getByRole("row", { name: /SYN South valve/ }),
  ).toBeVisible();
  await expect(page.getByRole("row", { name: /SYN North valve/ })).toHaveCount(
    0,
  );
  await page
    .getByRole("combobox", { name: "Area filter", exact: true })
    .selectOption("");
  await moduleView(page, "Unit configurator");
  const constraints = page.getByRole("region", {
    name: "Candidate constraint details",
    exact: true,
  });
  await expect(
    constraints.getByRole("heading", {
      name: "Constraint details",
      exact: true,
    }),
  ).toBeVisible();
  await constraints.getByText(/^Operating unit flow: SYN North group:/).click();
  await expect(constraints.getByText(/0 to 100 m³\/h/)).toBeVisible();
  await constraints.getByText(/^Unit pressure at unknown:/).click();
  await expect(
    constraints.getByText(
      /Manufacturer confirmation pending; technical approval not configured/,
    ),
  ).toBeVisible();
  await expect(
    constraints
      .locator("details")
      .filter({
        has: page
          .locator("summary")
          .filter({ hasText: "Operating unit flow: SYN North group" }),
      })
      .getByText("Applicable capability source is missing.", { exact: true }),
  ).toBeVisible();
  await constraints.evaluate((element) =>
    element.scrollIntoView({ block: "start" }),
  );
  await page.screenshot({
    path: info.outputPath("native-candidate-constraints.png"),
  });
  await moduleView(page, "Operating plan");
  const comparison = page.getByRole("region", {
    name: "Operating scenario comparison",
    exact: true,
  });
  await comparison
    .getByRole("button", { name: "Compare scenario outcomes", exact: true })
    .click();
  const results = comparison.getByRole("table", {
    name: "Scenario outcomes",
    exact: true,
  });
  const peak = results.getByRole("row", { name: /Operating unit peak/ });
  await expect(peak.locator("td strong").nth(0)).toHaveText("2 m³/h");
  await expect(peak.locator("td strong").nth(1)).toHaveText("3 m³/h");
  await expect(
    results
      .getByRole("row", { name: /Final source storage/ })
      .locator("td strong")
      .nth(1),
  ).toHaveText("Unknown");
  const alternative = comparison.getByRole("article", {
    name: "SYN Higher demand plan assumptions and findings",
    exact: true,
  });
  await alternative
    .getByText(/exact findings, including conflicts and unknowns/)
    .click();
  await expect(
    alternative.getByText(/Start-to-start spacing is shorter/),
  ).toBeVisible();
  await expect(
    alternative.getByText(
      "Refill remains unknown. Entered spacing creates an explicit conflict.",
    ),
  ).toBeVisible();
  expect(
    (await call(page, `estimating/fertigation/${scopeId}`)).revision,
  ).toEqual(original.revision);
  await comparison
    .getByRole("combobox", { name: "Compare scenario B", exact: true })
    .selectOption(proposal.scenarios[0].id);
  await expect(
    comparison.getByRole("button", {
      name: "Compare scenario outcomes",
      exact: true,
    }),
  ).toBeDisabled();
  await comparison
    .getByRole("combobox", { name: "Compare scenario B", exact: true })
    .selectOption(proposal.scenarios[1].id);
  await page
    .getByRole("combobox", { name: "Selected saved scenario", exact: true })
    .selectOption(proposal.scenarios[1].id);
  await expect(
    comparison.getByText(
      "Comparison inputs changed. Compare again to see current outcomes.",
    ),
  ).toBeVisible();
  await comparison
    .getByRole("button", { name: "Compare scenario outcomes", exact: true })
    .click();
  await expect(comparison.getByText(/Unsaved draft comparison/)).toBeVisible();
  await results.scrollIntoViewIfNeeded();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("native-scenario-comparison.png"),
  });
  await page
    .getByRole("textbox", { name: "Revision reason", exact: true })
    .fill("SYN select second plan for unresolved review");
  await page
    .getByRole("button", { name: "Save revision", exact: true })
    .click();
  await expect(page.locator(".fn-status")).toHaveText("Saved revision 2");
  await moduleView(page, "Scope review");
  async function prepareAndReview(note: string) {
    await page
      .getByRole("textbox", {
        name: "Review purpose and remaining conditions",
        exact: true,
      })
      .fill(note);
    await page
      .getByRole("button", { name: /Record review.*unresolved/ })
      .click();
    const prepare = page.getByRole("button", {
      name: "Prepare scoping handover",
      exact: true,
    });
    await expect(prepare).toBeEnabled();
    await prepare.click();
    const accept = page.getByRole("button", {
      name: "Accept prepared notes in Discovery",
      exact: true,
    });
    await expect(accept).toBeDisabled();
    const inspect = page.getByRole("button", {
      name: "Review receiving effect",
      exact: true,
    });
    await expect(inspect).toBeEnabled();
    await inspect.click();
    await expect(
      page.getByText("Exact target matches the prepared source."),
    ).toBeVisible();
    await expect(accept).toBeEnabled();
    return accept;
  }
  let accept = await prepareAndReview(
    "SYN first notes; all technical checks remain unresolved",
  );
  const quantities = page.getByRole("table", {
    name: "Prepared and receiving quantities",
    exact: true,
  });
  await expect(
    quantities
      .getByRole("row", { name: /Connected flow/ })
      .locator("td")
      .nth(0),
  ).toHaveText("No prior notes");
  await accept.click();
  await expect(
    page.getByText("Notes accepted; adoption for costing is separate."),
  ).toBeVisible();
  const saved = await call(page, `estimating/fertigation/${scopeId}`),
    changed = structuredClone(saved.revision.proposal);
  changed.valves[0].design_flow_m3h = 4;
  await call(page, `estimating/fertigation/${scopeId}/revisions`, {
    ...crmBase(),
    expected_version: saved.scope.version,
    expected_revision_id: saved.revision.id,
    source_context_hash: saved.revision.binding.upstream_context_hash,
    proposal: changed,
  });
  await page.goto(`/estimating/fertigation/${scopeId}?view=review`);
  accept = await prepareAndReview(
    "SYN revised notes; review quantity difference without repricing",
  );
  const flowDelta = quantities.getByRole("row", { name: /Connected flow/ });
  await expect(flowDelta.locator("td").nth(0)).toHaveText("5 m³/h");
  await expect(flowDelta.locator("td").nth(1)).toHaveText("7 m³/h");
  await expect(flowDelta.locator("td").nth(2)).toHaveText("2 m³/h");
  await expect(
    page.getByText(/These are differences between recorded scoping quantities/),
  ).toBeVisible();
  await quantities.scrollIntoViewIfNeeded();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("native-receiving-effect-preview.png"),
  });
  await accept.click();
  await expect(
    page.getByText("Notes accepted; adoption for costing is separate."),
  ).toBeVisible();
});

test("FN-T44 upload valve CSV, inspect incomplete projection and explicitly import a new linked native draft", async ({
  page,
}, info) => {
  const discovery = await savedDiscovery(page),
    proposal = scenarioComparisonScope();
  for (const valve of proposal.valves) {
    valve.master_id = null;
    valve.source_id = null;
    valve.allocations = [];
  }
  await page.goto(
    `/estimating/fertigation/new?estimating_workspace_id=${discovery.id}&option_id=${discovery.option_id}`,
  );
  await page
    .getByRole("textbox", { name: "Scope name", exact: true })
    .fill("SYN reviewed CSV projection");
  const imported = page.getByRole("region", {
    name: "Import portable scope",
    exact: true,
  });
  await imported
    .getByLabel("Portable scope JSON or valve CSV", { exact: true })
    .setInputFiles({
      name: "SYN-valves.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(valveCsv(proposal)),
    });
  await imported
    .getByRole("button", { name: "Preview import mapping", exact: true })
    .click();
  await expect(imported.getByText(/native_valves_csv_r01/)).toBeVisible();
  await expect(
    imported.getByText(
      /This is a valve-register projection, not full-project interchange/,
    ),
  ).toBeVisible();
  const before = await call(
    page,
    `estimating/fertigation?estimating_workspace_id=${discovery.id}`,
  );
  expect(before.items).toHaveLength(0);
  await imported.getByText(/^Review identity mapping/).click();
  const mapping = imported.getByRole("table", {
    name: "Import identity mapping",
    exact: true,
  });
  await expect(mapping).toBeVisible();
  expect(await mapping.locator("tbody tr").count()).toBeLessThanOrEqual(25);
  const mappedId = await mapping
    .getByRole("row")
    .filter({ hasText: proposal.valves[0].id })
    .locator("td")
    .nth(2)
    .innerText();
  expect(mappedId).toMatch(/^[0-9a-f-]{36}$/);
  expect(mappedId).not.toBe(proposal.valves[0].id);
  await imported.scrollIntoViewIfNeeded();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("native-csv-import-preview.png"),
  });
  await imported
    .getByRole("button", {
      name: "Confirm import as new native draft",
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(/\/estimating\/fertigation\/[0-9a-f-]+$/);
  const id = new URL(page.url()).pathname.split("/").at(-1)!,
    saved = await call(page, `estimating/fertigation/${id}`);
  expect(saved.revision.source_revision_id).toBe(discovery.revision_id);
  expect(saved.revision.proposal.valves).toHaveLength(2);
  expect(
    saved.revision.proposal.valves.some(
      (v: { id: string }) => v.id === mappedId,
    ),
  ).toBe(true);
  for (const valve of saved.revision.proposal.valves) {
    expect(proposal.valves.some((v) => v.id === valve.id)).toBe(false);
    expect(valve.control.owner).toBe("unknown");
    expect(valve.emitter.method).toBe("unknown");
    expect(valve.allocations).toEqual([]);
  }
  expect(
    saved.revision.proposal.valves.map(
      (v: { design_flow_m3h: number }) => v.design_flow_m3h,
    ),
  ).toEqual([2, 3]);
  expect(saved.revision.proposal.name).toBe("SYN reviewed CSV projection");
  expect(saved.revision.proposal.production_context.hydraulic_arrangement).toBe(
    "unknown",
  );
});
