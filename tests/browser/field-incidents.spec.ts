import { test, expect, type APIRequestContext } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { prepareIsolatedFieldAppointment } from "../helpers/isolated-field-http";
import { base } from "../helpers/service-inspections";
import { moduleIntegration } from "../helpers/ui-baselines";
import type { incidentRead } from "../../src/incidents/service";
import {
  openPageGuide,
  phoneWidth,
  phoneMenuOpener,
} from "../helpers/phone-menu";
type View = Awaited<ReturnType<typeof incidentRead>>;

test("FI06 retained historical reference and current native shell comparison", async ({
  page,
  browser,
  baseURL,
}, info) => {
  const contract = moduleIntegration("fi06-incidents-register")!;
  const context = await browser.newContext({
      viewport: {
        width: info.project.name.startsWith("mobile") ? 390 : 1440,
        height: 1000,
      },
    }),
    reference = await context.newPage();
  try {
    for (const [name, path, hash] of [
      ["quality-r01", contract.design, contract.sha256],
      ["theme-r20", contract.shared_design, contract.shared_sha256],
    ]) {
      expect(
        createHash("sha256")
          .update(await readFile(path))
          .digest("hex"),
      ).toBe(hash);
      await reference.goto(pathToFileURL(resolve(path)).href);
      await reference.evaluate(() => document.fonts.ready);
      if (name === "quality-r01")
        for (const view of ["incidents", "release"]) {
          await reference.locator(`#tabs [data-view="${view}"]`).click();
          await reference.screenshot({
            path: info.outputPath(`${name}-${view}.png`),
          });
        }
      else await reference.screenshot({ path: info.outputPath(`${name}.png`) });
    }
    expect(
      (
        await page.request.post(`${baseURL}/api/v1/local-session`, {
          headers: { origin: baseURL! },
          data: { profile: "coordinator" },
        })
      ).ok(),
    ).toBe(true);
    await page.goto(`${baseURL}/service/incidents`);
    await expect(page.locator("#ppo-incidents h1")).toHaveText(
      "Incidents and corrective actions",
    );
    const tokens = await page.locator("#ppo-incidents").evaluate((e) => {
      const s = getComputedStyle(e);
      return Object.fromEntries(
        ["--focus", "--line-strong", "--radius-card"].map((k) => [
          k,
          s.getPropertyValue(k).trim(),
        ]),
      );
    });
    const theme = await reference.locator("#ppo-theme-board").evaluate((e) => {
      const s = getComputedStyle(e);
      return Object.fromEntries(
        ["--focus", "--line-strong", "--radius-card"].map((k) => [
          k,
          s.getPropertyValue(k).trim(),
        ]),
      );
    });
    expect(tokens["--focus"]).toBe(theme["--focus"]);
    expect(tokens["--line-strong"]).toBe(theme["--line-strong"]);
    expect(tokens["--radius-card"]).toBe("8px");
    expect(theme["--radius-card"]).toBe("7px");
    await page.screenshot({ path: info.outputPath("native-register.png") });
    await writeFile(
      info.outputPath("comparison.json"),
      JSON.stringify(
        {
          tokens,
          theme,
          source: contract.design,
          adaptations:
            "Accepted FI-06 frames now use the shared register and record layout. Historical HTML remains unchanged reference evidence; owner visual review pending.",
          acceptance:
            "Independent owner, device, visual and screen-reader acceptance pending",
        },
        null,
        2,
      ),
    );
  } finally {
    await context.close();
  }
});

test("FI06 compiled factual report, original recovery, return, owned correction, independent outcome and restricted access", async ({
  page,
  request,
  baseURL,
}, info) => {
  test.setTimeout(180000);
  const origin = baseURL!;
  const refreshIncident = async () => {
    if (phoneWidth(page)) {
      await page
        .getByRole("button", { name: "More actions", exact: true })
        .click();
      await page
        .getByRole("menuitem", { name: "Refresh incident", exact: true })
        .click();
    } else
      await page
        .getByRole("button", { name: "Refresh saved record", exact: true })
        .click();
  };
  const login = async (client: APIRequestContext, profile: string) => {
    const r = await client.post(origin + "/api/v1/local-session", {
      headers: { origin },
      data: { profile },
    });
    expect(r.ok(), await r.text()).toBe(true);
    return r.json();
  };
  const caller =
    (client: APIRequestContext) => async (path: string, body?: unknown) => {
      const r = await client.fetch(origin + "/api/v1/" + path, {
        method: body === undefined ? "GET" : "POST",
        headers: { origin },
        data: body,
      });
      expect(r.ok(), await r.text()).toBe(true);
      return r.json();
    };
  const call = caller(request),
    own = caller(page.request);
  await login(request, "coordinator");
  const setup = await prepareIsolatedFieldAppointment(
    call,
    info.project.name.startsWith("mobile")
      ? (process.env.PPO_INCIDENT_MOBILE_DAY ?? "2031-12-23")
      : (process.env.PPO_INCIDENT_DESKTOP_DAY ?? "2031-12-17"),
  );
  await login(page.request, "assigned-technician");
  await page.goto(
    `${origin}/service/incidents/new?appointment_id=${setup.appointment_id}`,
  );
  const ctx = await own(
      `service/incidents/context?appointment_id=${setup.appointment_id}`,
    ),
    t = ctx.targets[0];
  await page
    .getByRole("combobox", {
      name: "Exact affected scope and equipment",
      exact: true,
    })
    .selectOption(`${t.scope_item_id}:${t.asset_id}`);
  await page.getByRole("radio", { name: "Incident", exact: true }).check();
  await page
    .getByLabel("Operational summary", { exact: true })
    .fill("SYN external leak observation");
  await page
    .getByLabel("Source reference", { exact: true })
    .fill("SYN fictional technician observation");
  await page
    .getByLabel("Factual observations", { exact: true })
    .fill("Original observation retained");
  await page
    .getByLabel("Immediate response already taken", { exact: true })
    .fill("Reported only; no equipment control");
  await page
    .getByLabel("Restricted details", { exact: true })
    .fill("FI06-PRIVATE-CANARY");
  await page
    .getByLabel("Reason for this report or correction", { exact: true })
    .fill("SYN factual initial report");
  // On a phone the guide opens from the header Menu by keyboard, and Escape returns focus to the Menu button.
  const guide = phoneWidth(page)
    ? phoneMenuOpener(page)
    : page.getByRole("button", { name: "Page guide", exact: true });
  await openPageGuide(page, true);
  await expect(
    page.getByRole("dialog", { name: "Page guide", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(guide).toBeFocused();
  await page.getByRole("button", { name: "Save draft", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/service\/incidents\/[0-9a-f-]{36}$/);
  const id = page.url().split("/").pop()!,
    url = page.url(),
    read = (): Promise<View> => own(`service/incidents/${id}`);
  let original: Record<string, unknown> | null = null;
  await page.route("**/api/v1/service/incidents", async (route) => {
    const body = route.request().postDataJSON();
    if (body?.action === "submit") {
      original = body;
      await route.fetch();
      await route.abort("connectionreset");
    } else await route.continue();
  });
  await page
    .getByLabel("Reason for this report or correction", { exact: true })
    .fill("SYN submit unchanged factual report");
  await page
    .getByRole("button", { name: "Submit report", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Submit this report?" })
    .getByRole("button", { name: "Submit report", exact: true })
    .click();
  await expect(
    page.getByText("We don’t know if your report arrived", {
      exact: true,
    }),
  ).toBeVisible();
  await page.unroute("**/api/v1/service/incidents");
  await page
    .getByRole("button", { name: "Check original receipt", exact: true })
    .click();
  await expect(page.locator(".shared-record-meta")).toContainText("v2");
  expect(original).not.toBeNull();
  const saved = await read();
  expect(saved.row.version).toBe(2);
  expect(saved.operational_hold).toBe(true);
  await page
    .getByRole("button", { name: "Correct report", exact: true })
    .click();
  await page
    .getByLabel("Factual observations", { exact: true })
    .fill("SYN retained during disconnected factual correction");
  await page
    .getByLabel("Reason for this report or correction", { exact: true })
    .fill("SYN reconnect proof");
  await page.context().setOffline(true);
  await expect(
    page.getByRole("button", { name: "Save factual correction", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByLabel("Factual observations", { exact: true }),
  ).toHaveValue("SYN retained during disconnected factual correction");
  await page.context().setOffline(false);
  await page
    .getByRole("button", { name: "Save factual correction", exact: true })
    .click();
  await expect(page.locator(".shared-record-meta")).toContainText("v3");
  const startContext = await own(`my-jobs/${setup.appointment_id}`);
  expect(startContext.items[0].readiness.component_ready).toBe(false);
  await login(page.request, "coordinator");
  await page.goto(url);
  await page
    .getByRole("tab", { name: "Triage and review", exact: true })
    .click();
  await page.getByLabel("Assessment", { exact: true }).selectOption("Assessed");
  await page
    .getByLabel("Basis for the assessment", { exact: true })
    .fill("SYN independent triage, exact scope");
  await page
    .getByRole("combobox", { name: "Accountable owner", exact: true })
    .selectOption("30000000-0000-4000-8000-000000000010");
  await page.getByLabel("Due time", { exact: true }).fill("2031-12-24T10:00");
  await page
    .getByRole("combobox", { name: "Priority", exact: true })
    .selectOption("Routine");
  await page.getByRole("button", { name: "Save triage", exact: true }).click();
  await expect(page.locator(".shared-record-title")).toContainText("In review");
  await page
    .getByText("Review decisions and corrective work", { exact: true })
    .click();
  await page
    .getByLabel("Operational corrective instruction", { exact: true })
    .fill("SYN owned external observation and correction evidence");
  await page
    .getByRole("button", {
      name: "Create owned corrective Activity",
      exact: true,
    })
    .click();
  await page.getByRole("tab", { name: /^Actions / }).click();
  await expect(
    page.getByRole("link", { name: "Open activity", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("tab", { name: "Triage and review", exact: true })
    .click();
  await page
    .getByLabel("Review or closure reason", { exact: true })
    .fill("SYN clarify the exact original observation");
  await page
    .getByRole("button", { name: "Request clarification", exact: true })
    .click();
  await expect(page.locator(".shared-record-title")).toContainText(
    "Clarification required",
  );
  await login(page.request, "assigned-technician");
  await page.goto(url);
  await page
    .getByRole("button", { name: "Correct report", exact: true })
    .click();
  await page
    .getByLabel("Factual observations", { exact: true })
    .fill("Corrected observation retaining original context");
  await page
    .getByLabel("Reason for this report or correction", { exact: true })
    .fill("SYN factual clarification");
  // A concurrent original reporter save must not silently change the draft version.
  const concurrent = await read();
  await own("service/incidents", {
    ...base(),
    id,
    action: "save",
    expected_version: concurrent.row.version,
    facts: {
      ...concurrent.row.facts,
      source_reference: "SYN concurrent source clarification",
    },
  });
  await page
    .getByRole("button", { name: "Save factual correction", exact: true })
    .click();
  await expect(
    page.getByText("This incident changed.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Factual observations", { exact: true }),
  ).toHaveValue("Corrected observation retaining original context");
  await refreshIncident();
  await page
    .getByRole("button", {
      name: "Use current version for this correction",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Save factual correction", exact: true })
    .click();
  await expect(page.locator(".shared-record-title")).toContainText("Submitted");
  let v = await read();
  const action = v.actions[0];
  await page.getByRole("tab", { name: /^Actions / }).click();
  await expect(
    page.getByRole("link", { name: "Open activity", exact: true }),
  ).toHaveAttribute("href", `/work/${action.activity_id}`);
  await page.goto(`${origin}/work/${action.activity_id}`);
  await expect(
    page.getByRole("link", {
      name: "Return to incident and corrective evidence",
      exact: true,
    }),
  ).toHaveAttribute("href", `/service/incidents/${id}`);
  await page
    .getByRole("link", {
      name: "Return to incident and corrective evidence",
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(url);
  const task = (await own(`activities/${action.activity_id}`)).items[0];
  await own(`activities/${action.activity_id}/complete`, {
    ...base(),
    expected_version: task.version,
    outcome: "SYN completed corrective work, closure still separate",
  });
  await refreshIncident();
  await page.getByRole("tab", { name: /^Actions / }).click();
  await expect(page.getByText(/Completed · Owner/)).toBeVisible();
  await page.getByRole("tab", { name: /^Evidence / }).click();
  expect((await read()).operational_hold).toBe(true);
  await page
    .getByRole("combobox", { name: "Evidence for", exact: true })
    .selectOption(action.id);
  await page
    .getByLabel("Evidence label", { exact: true })
    .fill("SYN exact corrective record");
  await page
    .getByLabel("Evidence reason", { exact: true })
    .fill("SYN original corrective bytes");
  await page
    .getByLabel("Original PNG or plain-text file", { exact: true })
    .setInputFiles({
      name: "correction.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(
        "SYN corrected external observation. Original retained.",
      ),
    });
  await page
    .getByRole("button", { name: "Save original evidence", exact: true })
    .click();
  await expect(
    page.getByRole("link", {
      name: "SYN exact corrective record",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Evidence for", exact: true })
    .selectOption("");
  await page
    .getByRole("combobox", { name: "Evidence audience", exact: true })
    .selectOption("Restricted");
  await page
    .getByLabel("Evidence label", { exact: true })
    .fill("FI06-PRIVATE-EVIDENCE");
  await page
    .getByLabel("Evidence reason", { exact: true })
    .fill("SYN restricted original source");
  await page
    .getByLabel("Original PNG or plain-text file", { exact: true })
    .setInputFiles({
      name: "restricted.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("FI06-PRIVATE-BYTES"),
    });
  await page
    .getByRole("button", { name: "Save original evidence", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "FI06-PRIVATE-EVIDENCE", exact: true }),
  ).toBeVisible();
  const restricted = (await read()).evidence.find(
    (e) => e.audience === "Restricted",
  )!;
  for (const width of info.project.name.startsWith("mobile")
    ? [390, 320]
    : [1440, 1024]) {
    await page.setViewportSize({
      width,
      height: width < 600 ? 844 : width === 1024 ? 768 : 1000,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    const owners = await page.evaluate(() =>
      // The primary rail has its own bounded scroll surface for long permitted
      // department lists. The record still owns one page-content scroll body.
      [...document.querySelectorAll("body *:not(.ppo-rail):not(.ppo-rail *)")]
        .filter(
          (e) =>
            e.scrollHeight > e.clientHeight + 1 &&
            ["auto", "scroll"].includes(getComputedStyle(e).overflowY),
        )
        .map((e) => e.id || e.tagName),
    );
    expect(owners).toEqual(["fi06-record"]);
    await page.locator("#fi06-record").evaluate((e) => {
      e.scrollTop = 0;
    });
    await page.screenshot({
      path: info.outputPath(`record-${width}.png`),
      fullPage: true,
    });
  }
  await login(page.request, "coordinator");
  await page.goto(url);
  await page.getByRole("tab", { name: /^Actions / }).click();
  await page
    .getByRole("radio", { name: /Use SYN exact corrective record/ })
    .check();
  await page
    .getByLabel("Reason for your decision", { exact: true })
    .fill("SYN independent exact evidence review");
  await page
    .getByRole("button", { name: "Accept evidence", exact: true })
    .click();
  await expect(page.getByText(/Evidence independently accepted/)).toBeVisible();
  await page
    .getByRole("tab", { name: "Triage and review", exact: true })
    .click();
  await page
    .getByLabel("Basis for the assessment", { exact: true })
    .fill("SYN independently verified exact scope and evidence");
  await page
    .getByRole("button", { name: "Accept exact closure evidence", exact: true })
    .click();
  await expect(page.locator(".shared-record-title")).toContainText("Accepted");
  const closeReceipt = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/v1/service/incidents") &&
      r.request().method() === "POST" &&
      r.request().postDataJSON()?.action === "close",
  );
  const closedRead = page.waitForResponse(
    async (r) =>
      r.url().endsWith(`/api/v1/service/incidents/${id}`) &&
      r.request().method() === "GET" &&
      r.ok() &&
      (await r.json()).row?.state === "Closed",
  );
  await page
    .getByRole("button", {
      name: "Close incident and issue internal outcome",
      exact: true,
    })
    .click();
  expect((await closeReceipt).status()).toBe(201);
  await closedRead; // The exact issued receipt precedes the refreshed record.

  await expect(
    page.getByText("Current incident closure", { exact: true }),
  ).toBeVisible();
  v = await read();
  const output = v.outputs[0],
    html = await (
      await page.request.get(
        `${origin}/api/v1/service/incidents/${id}/files?output_id=${output.id}`,
      )
    ).body();
  expect(html.toString()).not.toContain("FI06-PRIVATE-CANARY");
  await page.reload();
  await page
    .getByRole("tab", { name: "Triage and review", exact: true })
    .click();
  await expect(
    page.getByText("Current incident closure", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Review or closure reason", { exact: true })
    .fill("SYN renewed exact-scope concern");
  await page
    .getByRole("button", { name: "Reopen and restore scope hold", exact: true })
    .click();
  await expect(
    page.getByText("Historical output — current applicability withdrawn", {
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await (
      await page.request.get(
        `${origin}/api/v1/service/incidents/${id}/files?output_id=${output.id}`,
      )
    ).body(),
  ).toEqual(html);
  await login(page.request, "second-technician");
  await page.goto(url);
  await page.getByRole("tab", { name: "History", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Original report and retained history",
      exact: true,
    }),
  ).toBeVisible();
  expect(await page.locator("#ppo-incidents").innerText()).not.toContain(
    "FI06-PRIVATE-CANARY",
  );
  expect(JSON.stringify(await read())).not.toContain("FI06-PRIVATE-CANARY");
  expect(JSON.stringify(await own("service/incidents"))).not.toContain(
    "FI06-PRIVATE",
  );
  expect(
    JSON.stringify((await own("search?q=FI06-PRIVATE")).items),
  ).not.toContain("FI06-PRIVATE");
  expect(
    JSON.stringify(await own(`activities/${action.activity_id}`)),
  ).not.toContain("FI06-PRIVATE");
  expect(
    (
      await page.request.get(
        `${origin}/api/v1/service/incidents/${id}/files?evidence_id=${restricted.id}`,
      )
    ).status(),
  ).toBe(404);
  expect(
    JSON.stringify(await own(`my-jobs/${setup.appointment_id}`)),
  ).not.toContain("FI06-PRIVATE");

  await login(page.request, "second-company");
  await page.goto(url);
  await expect(
    page.getByRole("heading", {
      name: "Original report and retained history",
      exact: true,
    }),
  ).toHaveCount(0);
  expect(
    (
      await page.request.get(
        `${origin}/api/v1/service/incidents/${id}/files?output_id=${output.id}`,
      )
    ).ok(),
  ).toBe(false);
  await writeFile(
    info.outputPath("journey.json"),
    JSON.stringify(
      {
        appointment: setup.appointment_id,
        incident: id,
        action: action.id,
        activity: action.activity_id,
        output: output.id,
        output_sha256: createHash("sha256").update(html).digest("hex"),
        result:
          "Passed compiled online journey and original recovery; independent acceptance pending",
      },
      null,
      2,
    ),
  );
});
