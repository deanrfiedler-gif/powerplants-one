import { test, expect, type APIRequestContext } from "@playwright/test";
import { createHash, randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { prepareIsolatedFieldAppointment } from "../helpers/isolated-field-http";
import {
  inspectionPreparation,
  png,
  base,
} from "../helpers/service-inspections";
import { startInput } from "../helpers/field";
import type { loadServiceInspections } from "../../src/inspections/service-context";
type View = Awaited<ReturnType<typeof loadServiceInspections>>;

test("FI03/FI04 retained proposed Quality and r20 references are compared with the native shell", async ({
  browser,
  page,
  baseURL,
}, info) => {
  const registry = JSON.parse(
    await readFile("docs/standards/ui-baselines.json", "utf8"),
  );
  const contract = registry.module_integrations.find(
    (x: { id: string }) => x.id === "fi03-inspections-native",
  );
  const context = await browser.newContext({
    viewport: {
      width: info.project.name.startsWith("mobile") ? 390 : 1440,
      height: 1000,
    },
  });
  const reference = await context.newPage();
  const references = [];
  const tokens = (target: typeof page, selector: string) =>
    target.locator(selector).evaluate((e) => {
      const s = getComputedStyle(e);
      return Object.fromEntries(
        ["--line-strong", "--focus", "--radius-card"].map((k) => [
          k,
          s.getPropertyValue(k).trim(),
        ]),
      );
    });
  try {
    for (const [name, path, expected] of [
      ["quality-r01", contract.design, contract.sha256],
      ["theme-r20", contract.shared_design, contract.shared_sha256],
    ]) {
      expect(
        createHash("sha256")
          .update(await readFile(path))
          .digest("hex"),
      ).toBe(expected);
      await reference.goto(pathToFileURL(resolve(path)).href);
      await reference.evaluate(() => document.fonts.ready);
      if (name === "quality-r01") {
        await reference.locator('#tabs [data-view="inspection"]').click();
        await expect(reference.locator("#inspection-form")).toBeVisible();
      }
      await reference.screenshot({ path: info.outputPath(`${name}.png`) });
      references.push({
        name,
        path,
        sha256: expected,
        tokens: await tokens(
          reference,
          name === "theme-r20" ? "#ppo-theme-board" : "#inspection-form",
        ),
      });
    }
    expect(
      (
        await page.request.post(`${baseURL}/api/v1/local-session`, {
          headers: { Origin: baseURL! },
          data: { profile: "coordinator" },
        })
      ).ok(),
    ).toBe(true);
    await page.goto(`${baseURL}/service/inspections`);
    await expect(
      page.getByRole("heading", { name: "Inspection review", exact: true }),
    ).toBeVisible();
    const native = await tokens(page, "#ppo-service-inspections"),
      theme = references.find((x) => x.name === "theme-r20")!.tokens;
    expect(native["--line-strong"]).toBe(theme["--line-strong"]);
    expect(native["--focus"]).toBe(theme["--focus"]);
    expect(theme["--radius-card"]).toBe("7px");
    expect(native["--radius-card"]).toBe("8px"); // Existing application token, declared adaptation from r20's 7px.
    await page.screenshot({ path: info.outputPath("native-worklist.png") });
    await writeFile(
      info.outputPath("reference-comparison.json"),
      JSON.stringify(
        {
          references,
          native,
          result: "Passed bounded source/token comparison",
          adaptations:
            "Existing shared shell and 8px card token; separate real-appointment FI03/FI04 routes replace the proposed combined Quality/incident workspace. No FI06 or owner baseline adoption.",
          acceptance:
            "Independent visual/owner/device/screen-reader acceptance pending",
        },
        null,
        2,
      ),
    );
  } finally {
    await context.close();
  }
});

test("FI03/FI04 compiled exact failure, original recovery, owned correction, retained retest and reviewed output", async ({
  page,
  request,
  baseURL,
}, info) => {
  test.setTimeout(180000);
  const origin = baseURL!;
  const assertScrollOwner = async () => {
    const owners = await page.evaluate(() => {
      const root = document.querySelector("#ppo-service-inspections")!;
      const nodes = new Set<Element>([
        document.scrollingElement!,
        ...root.querySelectorAll("*"),
        root,
      ]);
      for (
        let parent = root.parentElement;
        parent;
        parent = parent.parentElement
      )
        nodes.add(parent);
      return [...nodes]
        .filter(
          (node) =>
            node.scrollHeight > node.clientHeight + 1 &&
            (node === document.scrollingElement ||
              ["auto", "scroll"].includes(getComputedStyle(node).overflowY)),
        )
        .map((node) => node.id || node.tagName);
    });
    expect(owners).toHaveLength(1);
  };
  const login = async (client: APIRequestContext, profile: string) => {
    const r = await client.post(origin + "/api/v1/local-session", {
      headers: { origin },
      data: { profile },
    });
    expect(r.status(), await r.text()).toBe(200);
    return r.json();
  };
  const caller =
    (client: APIRequestContext) => async (path: string, body?: unknown) => {
      const r = await client.fetch(origin + "/api/v1/" + path, {
        method: body === undefined ? "GET" : "POST",
        headers: { origin },
        data: body,
      });
      expect(r.ok(), await r.text()).toBeTruthy();
      return r.json();
    };
  const call = caller(request),
    own = caller(page.request);
  await login(request, "coordinator");
  const setup = await prepareIsolatedFieldAppointment(
    call,
    info.project.name.startsWith("mobile") ? "2031-12-11" : "2031-12-10",
  );
  const site = "70000000-0000-4000-8000-000000000001",
    owner = "30000000-0000-4000-8000-000000000001";
  let sources = (await call(`cs/Readiness?context_id=${site}`)).items;
  if (!sources.length) {
    const id = randomUUID();
    await call("cs/Readiness", {
      ...base(),
      id,
      context_id: site,
      name: "SYN Service inspection browser preparation",
      owner_id: owner,
    });
    sources = [(await call(`cs/Readiness/${id}`)).record];
  }
  // The task-owned serial synthetic browser suite shares a site. Retain its source
  // history and establish current preparation through ordinary owner/reviewer commands.
  for (const source of sources) {
    await login(request, "coordinator");
    const record = (await call(`cs/Readiness/${source.id}`)).record,
      content = inspectionPreparation();
    await call(`cs/Readiness/${source.id}/save`, {
      ...base(),
      expected_version: record.version,
      name: record.name,
      owner_id: record.owner_id,
      content,
    });
    const saved = (await call(`cs/Readiness/${source.id}`)).record;
    await login(request, "cs-reviewer");
    await call(`cs/Readiness/${source.id}/actions`, {
      ...base(),
      expected_version: saved.version,
      action: "review_evidence",
      evidence_id: content.evidence[0].id,
    });
  }
  for (const profile of ["assigned-technician", "second-technician"]) {
    const who = await login(request, profile),
      recipient = setup.pack.readiness.recipients.find(
        (x: { user_id: string }) => x.user_id === who.actor_id,
      );
    await call(`pack-issues/${setup.pack.current_issue_id}/acknowledge`, {
      ...base(),
      assignment_id: recipient.assignment_id,
      assignment_version: recipient.assignment_version,
      presented_hash: setup.pack.issues[0].output_hash,
      captured_at: new Date().toISOString(),
    });
  }
  for (const profile of ["assigned-technician", "second-technician"]) {
    await login(request, profile);
    const job = (await call(`my-jobs/${setup.appointment_id}`)).items[0];
    await call(`appointments/${job.id}/start`, startInput(job));
  }
  await login(page.request, "assigned-technician");
  const id = setup.appointment_id,
    capture = `/my-jobs/inspections?appointment_id=${id}`,
    review = `/service/inspections?appointment_id=${id}`,
    api = `my-jobs/${id}/inspections`;
  await page.goto(capture);
  const guide = page.getByRole("button", { name: "Page guide", exact: true });
  await guide.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("dialog", { name: "Page guide", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(guide).toBeFocused();
  await page
    .getByRole("combobox", { name: "Procedure", exact: true })
    .selectOption("e9550000-0000-4000-8000-000000000001");
  const view: View = await own(api);
  await page
    .getByRole("combobox", { name: "Equipment and task", exact: true })
    .selectOption(
      view.targets[0].scope_item_id + ":" + view.targets[0].asset_id,
    );
  await page
    .getByRole("button", { name: "Open inspection draft", exact: true })
    .click();
  await expect(
    page.getByLabel("SYN holding pressure reading", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Record current test time", exact: true })
    .click();
  await page
    .getByLabel("SYN holding pressure reading", { exact: true })
    .fill("120");
  await page
    .getByRole("combobox", { name: "Instrument", exact: true })
    .selectOption("e9550000-0000-4000-8000-000000000003");
  await page
    .getByRole("combobox", { name: "Outcome", exact: true })
    .selectOption("Clear");
  await page.getByLabel("Unit", { exact: true }).fill("psi");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(
    page.getByText("That unit has no approved conversion", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByLabel("SYN holding pressure reading", { exact: true }),
  ).toHaveValue("120");
  await page.getByLabel("Unit", { exact: true }).fill("kPa");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(
    page.getByText("Saved draft · version 3", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Findings", { exact: true })
    .fill("SYN retained through an actual disconnected request.");
  await page.context().setOffline(true);
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(
    page.getByText("Uncertain result — recover the unchanged original", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByLabel("Findings", { exact: true })).toHaveValue(
    "SYN retained through an actual disconnected request.",
  );
  await page.context().setOffline(false);
  await page
    .getByRole("button", { name: "Refresh saved records", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Retry unchanged original", exact: true })
    .click();
  await expect(
    page.getByText("Saved draft · version 5", { exact: true }),
  ).toBeVisible();
  expect((await own(api)).attempts[0].row.findings).toBe(
    "SYN retained through an actual disconnected request.",
  );
  await page.getByLabel("Original file", { exact: true }).setInputFiles({
    name: "SYN pressure original.png",
    mimeType: "image/png",
    buffer: png(),
  });
  await expect(
    page.getByRole("link", { name: "Open original evidence", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Saved draft · version 7", { exact: true }),
  ).toBeVisible();
  let submittedBody: Record<string, unknown> | null = null;
  await page.route(`**/api/v1/${api}`, async (route) => {
    if (
      route.request().method() === "POST" &&
      route.request().postDataJSON().action === "submit" &&
      !submittedBody
    ) {
      submittedBody = route.request().postDataJSON();
      const result = await route.fetch();
      expect(result.status(), await result.text()).toBe(201);
      await route.abort("connectionreset");
    } else await route.continue();
  });
  await page
    .getByRole("button", { name: "Submit exact attempt", exact: true })
    .click();
  await expect(
    page.getByText("Uncertain result — recover the unchanged original", {
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Submit exact inspection saved.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Uncertain result — recover the unchanged original", {
      exact: true,
    }),
  ).toHaveCount(0);
  const submitted: View = await own(api),
    first = submitted.attempts[0];
  expect(first.row.state).toBe("Submitted");
  expect(submitted.defects).toHaveLength(1);
  expect(submitted.defects[0].activity_id).toBeTruthy();
  const replay = await own(api, submittedBody!);
  expect(replay.operation_id).toBe(
    (submittedBody! as Record<string, unknown>).operation_id,
  );
  expect((await own(api)).defects).toHaveLength(1);
  await page.unroute(`**/api/v1/${api}`);
  await login(page.request, "coordinator");
  await page.goto(review);
  await page.getByRole("button", { name: /^Attempt 1 ·/ }).click();
  await expect(
    page.getByRole("heading", { name: "Submitted readings", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Decision reason", { exact: true })
    .fill(
      "SYN failed pressure evidence returned for owned correction and fresh linked retest.",
    );
  await page
    .getByRole("button", { name: "Save review decision", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Save review decision", exact: true }),
  ).toBeDisabled();
  await login(page.request, "assigned-technician");
  await page.goto(capture);
  await page
    .getByLabel("Correction evidence and action", { exact: true })
    .fill(
      "SYN external observation setup corrected; no operational equipment intervention.",
    );
  await page
    .getByRole("button", { name: "Record correction", exact: true })
    .click();
  await expect(
    page.getByText("CorrectionRecorded · owner", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Procedure", exact: true })
    .selectOption("e9550000-0000-4000-8000-000000000001");
  await page
    .getByRole("combobox", { name: "Equipment and task", exact: true })
    .selectOption(
      view.targets[0].scope_item_id + ":" + view.targets[0].asset_id,
    );
  await page
    .getByRole("combobox", { name: "Retest lineage", exact: true })
    .selectOption(first.row.id);
  await page
    .getByRole("button", { name: "Open inspection draft", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Record current test time", exact: true })
    .click();
  await page
    .getByLabel("SYN holding pressure reading", { exact: true })
    .fill("2.1");
  await page.getByLabel("Unit", { exact: true }).fill("bar");
  await page
    .getByRole("combobox", { name: "Instrument", exact: true })
    .selectOption("e9550000-0000-4000-8000-000000000003");
  await page
    .getByRole("combobox", { name: "Outcome", exact: true })
    .selectOption("Clear");
  const discard = page.waitForEvent("dialog");
  const switchAttempt = page
    .getByRole("button", { name: /^Attempt 1 ·/ })
    .click();
  const dialog = await discard;
  expect(dialog.message()).toBe("Switch attempt and discard unsaved changes?");
  await dialog.dismiss();
  await switchAttempt;
  await expect(
    page.getByLabel("SYN holding pressure reading", { exact: true }),
  ).toHaveValue("2.1");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(
    page.getByText("Saved draft · version 3", { exact: true }),
  ).toBeVisible();
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
    await assertScrollOwner();
    await page.screenshot({
      path: info.outputPath(`capture-${width}.png`),
      fullPage: true,
    });
  }
  await page.getByLabel("Original file", { exact: true }).setInputFiles({
    name: "SYN fresh retest.png",
    mimeType: "image/png",
    buffer: png(97, 65),
  });
  await expect(
    page.getByText("Saved draft · version 5", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Submit exact attempt", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Submitted readings", exact: true }),
  ).toBeVisible();
  const after: View = await own(api),
    fresh = after.attempts.find((x) => x.row.predecessor_id === first.row.id)!;
  expect(fresh.results.find((r) => r.unit === "bar")?.raw_value).toBe("2.1");
  expect(after.defects[0].state).toBe("CorrectionRecorded");
  await login(page.request, "coordinator");
  await page.goto(review);
  await page.getByRole("button", { name: /^Attempt 2 ·/ }).click();
  await page
    .getByRole("combobox", { name: "Decision", exact: true })
    .selectOption("Accepted");
  await page
    .getByLabel("Decision reason", { exact: true })
    .fill("SYN exact fresh evidence independently accepted.");
  await page
    .getByRole("button", { name: "Save review decision", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Issue scoped inspection outcome",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByLabel("Decision reason", { exact: true })
    .fill(
      "SYN release only this procedure and equipment occurrence, with other domains excluded.",
    );
  const releaseStarted = Date.now();
  const released = page.waitForResponse(
    (response) =>
      response.url().endsWith(`/api/v1/service/inspections/${id}`) &&
      response.request().method() === "POST" &&
      response.request().postDataJSON().action === "release",
  );
  await page
    .getByRole("button", {
      name: "Issue scoped inspection outcome",
      exact: true,
    })
    .click();
  const releaseResponse = await released;
  expect(releaseResponse.status(), await releaseResponse.text()).toBe(201);
  const releaseMilliseconds = Date.now() - releaseStarted;
  await expect(
    page.getByRole("link", { name: "Exact HTML", exact: true }),
  ).toBeVisible();
  const final: View = await own(`service/inspections/${id}`);
  expect(final.defects[0].state).toBe("Closed");
  expect(final.attempts.find((x) => x.row.id === first.row.id)!.row).toEqual(
    first.row,
  );
  expect(final.appointment.status).toBe("InProgress");
  expect(final.work_order.status).toBe("Authorised");
  const files = [];
  for (const label of ["Exact HTML", "Exact PDF"]) {
    const href = await page
      .getByRole("link", { name: label, exact: true })
      .getAttribute("href");
    const file = await page.request.get(origin + href);
    expect(file.status()).toBe(200);
    const bytes = await file.body(),
      hash = createHash("sha256").update(bytes).digest("hex");
    expect(hash).toBe(file.headers()["x-content-sha256"]);
    const again = await page.request.get(origin + href);
    expect(await again.body()).toEqual(bytes);
    files.push({ label, href, sha256: hash, bytes: bytes.length });
  }
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
    await assertScrollOwner();
    await page.screenshot({
      path: info.outputPath(`review-${width}.png`),
      fullPage: true,
    });
  }
  await writeFile(
    info.outputPath("retained.json"),
    JSON.stringify(
      {
        appointment: id,
        first: first.row.id,
        retest: fresh.row.id,
        submission: submittedBody,
        files,
        output: final.outputs[0],
        first_hash: first.row.submitted_hash,
        release_milliseconds: releaseMilliseconds,
      },
      null,
      2,
    ),
  );
  await login(page.request, "second-company");
  await page.goto(review);
  await expect(
    page.getByRole("link", { name: "Exact HTML", exact: true }),
  ).toHaveCount(0);
  const denied = await page.request.get(origin + files[0].href);
  // This profile lacks report.read, so the established capability gate refuses
  // before record lookup; no inspection/output bytes may be disclosed.
  expect(denied.status()).toBe(403);
  expect(await denied.text()).not.toContain(first.row.submitted_hash!);
});
