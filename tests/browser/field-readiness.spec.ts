import { test, expect, type APIRequestContext } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { prepareIsolatedFieldAppointment } from "../helpers/isolated-field-http";

test("FI05 assigned visit, unchanged originals, changed sources and responsive field review", async ({
  page,
  request,
  baseURL,
}, info) => {
  test.setTimeout(180000);
  const origin = baseURL!;
  const login = async (client: APIRequestContext, profile: string) => {
    const r = await client.post(origin + "/api/v1/local-session", {
      headers: { origin },
      data: { profile },
    });
    expect(r.status()).toBe(200);
  };
  const call = async (path: string, body?: unknown) => {
    const r = await request.fetch(origin + "/api/v1/" + path, {
      method: body === undefined ? "GET" : "POST",
      headers: { origin },
      data: body,
    });
    expect(r.ok(), await r.text()).toBeTruthy();
    return r.json();
  };
  const base = () => ({
    schema_version: 1,
    operation_id: randomUUID(),
    reason: "SYN FI05 browser verification",
  });
  await login(request, "coordinator");
  const job = await prepareIsolatedFieldAppointment(
    call,
    info.project.name.startsWith("mobile") ? "2031-11-20" : "2031-11-19",
  );
  const site = "70000000-0000-4000-8000-000000000001",
    owner = "30000000-0000-4000-8000-000000000001";
  const existing = await call(`cs/Readiness?context_id=${site}`),
    id = existing.items[0]?.id ?? randomUUID(),
    name = `SYN Field visit instructions ${id.slice(0, 8)}`;
  if (!existing.items.length)
    await call("cs/Readiness", {
      ...base(),
      id,
      context_id: site,
      name,
      owner_id: owner,
    });
  const requirement = {
    id: randomUUID(),
    revision: 1,
    title: "SYN Site induction",
    kind: "Induction",
    facility_id: null,
    activity: "Inspection",
    source:
      "SYN Current Site arrival and induction instruction; contact the Service owner for unresolved conditions.",
  };
  const content = {
    schema_version: 1,
    requirements: [requirement],
    evidence: [],
    windows: [],
  };
  const before = await call(`cs/Readiness/${id}`);
  await call(`cs/Readiness/${id}/save`, {
    ...base(),
    expected_version: before.record.version,
    name,
    owner_id: owner,
    content,
  });
  await login(page.request, "assigned-technician");
  const url = `/my-jobs/site-readiness?appointment_id=${job.appointment_id}&record_id=${id}&activity=Inspection`;
  await page.goto(url);
  await expect(
    page.getByRole("heading", { name: "SYN Site induction", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Not verified: your sign-in is not linked", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open the owning Site readiness record" }),
  ).toHaveAttribute("href", `/sites/${site}/readiness`);
  const widths = info.project.name.startsWith("mobile")
    ? [390]
    : [1440, 1024, 820, 390, 320, 720];
  for (const width of widths) {
    await page.setViewportSize({ width, height: width < 600 ? 844 : 960 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath(`fi05-${width}.png`),
      fullPage: true,
    });
    await page
      .getByRole("heading", { name: "Acknowledge this review", exact: true })
      .scrollIntoViewIfNeeded();
    await page.screenshot({
      path: info.outputPath(`fi05-review-${width}.png`),
    });
    await page
      .getByRole("heading", { name: "Site readiness", exact: true })
      .scrollIntoViewIfNeeded();
  }
  const note = page.getByLabel("Review note and conditions to escalate");
  await note.fill(
    "SYN I have read the current instructions; personal induction must be verified by the Service owner.",
  );
  await note.focus();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("checkbox", {
      name: "I have reviewed the displayed source",
    }),
  ).toBeFocused();
  await page
    .getByRole("checkbox", { name: "I have reviewed the displayed source" })
    .check();
  const action = page.getByRole("button", {
    name: "Record my acknowledgement",
  });
  await page.keyboard.press("Tab");
  await expect(action).toBeFocused();
  const actionBox = await action.boundingBox();
  expect(actionBox!.height).toBeGreaterThanOrEqual(44);
  // The server accepts the command but the browser loses its response.
  let drop = true;
  await page.route(
    `**/api/v1/my-jobs/${job.appointment_id}/site-readiness`,
    async (route) => {
      if (drop && route.request().method() === "POST") {
        drop = false;
        const r = await route.fetch();
        expect(r.status()).toBe(201);
        await route.abort("connectionreset");
      } else await route.continue();
    },
  );
  await page.getByRole("button", { name: "Record my acknowledgement" }).click();
  await expect(
    page.getByRole("button", { name: "Check the original acknowledgement" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Check the original acknowledgement" })
    .click();
  await expect(
    page.getByText("Saved to the server", { exact: true }),
  ).toBeVisible();
  const saved = await page.request.get(
    origin +
      `/api/v1/my-jobs/${job.appointment_id}/site-readiness?record_id=${id}&activity=Inspection`,
  );
  expect(saved.headers()["cache-control"]).toContain("no-store");
  expect((await saved.json()).acknowledgements).toHaveLength(1);
  const current = await call(`cs/Readiness/${id}`);
  await call(`cs/Readiness/${id}/save`, {
    ...base(),
    expected_version: current.record.version,
    name: current.record.name,
    owner_id: owner,
    content: {
      ...content,
      requirements: [
        {
          ...requirement,
          source: "SYN Changed Site source requires a fresh review.",
        },
      ],
    },
  });
  await page.getByRole("button", { name: "Refresh current sources" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Different or changed source/context — re-review required",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Record my acknowledgement" }),
  ).toBeDisabled();
  await page.screenshot({
    path: info.outputPath("fi05-changed-source.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Use the displayed context for a new review" })
    .click();
  await expect(
    page.getByRole("checkbox", {
      name: "I have reviewed the displayed source",
    }),
  ).not.toBeChecked();
  // Direct API permission refusal is private and does not reveal the source.
  await login(page.request, "second-company");
  const denied = await page.request.get(
    origin +
      `/api/v1/my-jobs/${job.appointment_id}/site-readiness?record_id=${id}`,
  );
  expect([403, 404]).toContain(denied.status());
  await page.goto(url);
  await expect(
    page.getByRole("heading", { name: "SYN Site induction", exact: true }),
  ).toHaveCount(0);
});
