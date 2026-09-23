import { test, expect } from "@playwright/test";
import { createDemand, openDemand, openDemandPanel, fillProposal, pl01Call, pl01Identity, fixtureId } from "../helpers/pl01";

// The device must not share the site's zone, or entry in device time would pass unnoticed.
test.use({ timezoneId: "America/Los_Angeles" });

test("PL01 demand to readiness, contact, full crew confirmation and retained planner context", async ({ page }, info) => {
  await pl01Identity(page);
  const w = await createDemand(page);
  const context = `/schedule?day=2031-09-22&view=day&timezone=UTC&resource_id=${fixtureId("a4")}&status=Confirmed`;
  await openDemand(page, w.id, context);
  const panel = await fillProposal(page, info.project.name.startsWith("mobile") ? "2031-09-30" : "2031-09-29");
  await panel.getByRole("button", { name: "Save proposal", exact: true }).click();
  const next = panel.getByRole("link", { name: "Continue booking / View appointment" });
  await expect(next).toBeVisible();
  const target = await next.getAttribute("href");
  const appointmentId = target!.split("?")[0].split("/").pop()!;
  const a = (await pl01Call(page, `appointments/${appointmentId}`)).items[0];
  expect(a.status).toBe("Proposed"); expect(a.assignments).toHaveLength(0);
  expect(a.start_at).toContain("04:00:00"); // Brisbane 14:00; device is Los Angeles.
  expect((await pl01Call(page, "schedule/demand")).items.some((r: { id: string }) => r.id === w.id)).toBe(false);
  await next.click();
  await page.getByRole("link", { name: "Review readiness on the work order" }).click();
  const visit = page.locator(`#visit-${appointmentId}`);
  await visit.getByText("Review proposed visit preparation", { exact: true }).click();
  await visit.getByLabel("Readiness criterion").selectOption("ToolPreparation");
  await visit.getByLabel("Readiness decision").selectOption("Pass");
  await visit.getByLabel("Review reason").fill("SYN kit reviewed and available for this exact visit");
  await visit.getByLabel("Evidence source time (your device timezone)").fill("2026-09-05T10:00");
  await visit.getByLabel("Evidence title").fill("SYN exact kit review");
  await visit.getByLabel("Synthetic source reference").fill("SYN-PPO-PL01-KIT");
  await visit.getByLabel("Source version", { exact: true }).fill("1");
  await visit.getByLabel("Exact manual evidence").fill("SYN inspection kit ready; dispatch remains held");
  await visit.getByRole("button", { name: "Record readiness review" }).click();
  await expect(visit.getByText("Readiness assessment saved.", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Continue saved appointment", exact: true }).click();
  await page.getByRole("button", { name: "Record contact", exact: true }).click();
  const contact = page.getByRole("region", { name: "Record customer contact" });
  await contact.getByLabel("Contact outcome").selectOption("Confirmed");
  await contact.getByLabel("Contact notes").fill("SYN current recipient agreed to these exact visit dates; no message sent");
  await contact.getByRole("button", { name: "Save contact outcome" }).click();
  await expect(page.getByText("Customer contact saved. Each later booking step is saved separately.").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirm appointment", exact: true }).first()).toBeEnabled();
  await page.getByRole("button", { name: "Confirm appointment", exact: true }).first().click();
  const crew = page.getByRole("region", { name: "Confirm appointment", exact: true });
  for (let i = 1; i <= 2; i++) {
    if (i > 1) await crew.getByRole("button", { name: "Add crew member" }).click();
    await crew.getByLabel(`Resource ${i}`, { exact: true }).selectOption(fixtureId("a4", i));
    await crew.getByLabel(`Travel before ${i} (minutes)`).fill("0");
    await crew.getByLabel(`Travel after ${i} (minutes)`).fill("0");
    await crew.getByLabel(`Travel basis ${i}`).fill("SYN explicitly reviewed same-site zero allowance");
  }
  await crew.getByLabel("Booking reason").fill("SYN exact work, readiness, agreement and complete crew reviewed");
  await crew.getByRole("button", { name: "Confirm booking", exact: true }).click();
  await expect(page.getByText("Confirmation saved. Each later booking step is saved separately.").first()).toBeVisible();
  await expect.poll(async () => (await pl01Call(page, `appointments/${appointmentId}`)).items[0].status).toBe("Confirmed");
  const booked = (await pl01Call(page, `appointments/${appointmentId}`)).items[0];
  expect(booked.assignments.filter((r: { active: boolean }) => r.active)).toHaveLength(2);
  expect(booked.dispatch_hold).toBe(true); expect(booked.pack_requirement).toBe("PreparationRequired");
  await page.reload();
  await expect(page.getByText("Dispatch held", { exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath("confirmed.png"), fullPage: true });
  await page.getByRole("link", { name: "Show its dates / View in planner" }).click();
  await expect(page.locator(`a[href='/service/appointments/${appointmentId}']`).first()).toBeVisible();
  await page.getByRole("link", { name: "Return to previous planner context" }).click();
  await expect(page).toHaveURL(new RegExp("day=2031-09-22&view=day&timezone=UTC"));
  expect(new URL(page.url()).searchParams.get("resource_id")).toBe(fixtureId("a4"));
});

test("PL01 each saved booking step leaves the next one usable", async ({ page }) => {
  // The form remounts after each save and checks the retained receipt. Under React
  // Strict Mode that check is voided and restarted; the form must still settle.
  await pl01Identity(page); const w = await createDemand(page);
  await openDemand(page, w.id); const panel = await fillProposal(page);
  await panel.getByRole("button", { name: "Save proposal", exact: true }).click();
  const next = panel.getByRole("link", { name: "Continue booking / View appointment" });
  await expect(next).toBeVisible();
  const aid = (await next.getAttribute("href"))!.split("?")[0].split("/").pop()!;
  await page.goto(`/service/appointments/${aid}`);
  for (const outcome of ["Failed", "Confirmed"]) {
    await page.getByRole("button", { name: "Record contact", exact: true }).click();
    await page.getByLabel("Contact outcome", { exact: true }).selectOption(outcome);
    await page.getByLabel("Contact notes", { exact: true }).fill(`SYN ${outcome} contact; no message sent`);
    const saved = page.waitForResponse(r => new URL(r.url()).pathname === `/api/v1/appointments/${aid}/contacts` && r.request().method() === "POST");
    await page.getByRole("button", { name: "Save contact outcome", exact: true }).click();
    expect((await saved).ok()).toBe(true);
  }
  await expect(page.getByLabel("Contact outcome", { exact: true })).toBeEnabled();
  const contacts = (await pl01Call(page, `appointments/${aid}`)).items[0].contacts;
  expect(contacts.map((c: { outcome: string }) => c.outcome).sort()).toEqual(["Confirmed", "Failed"]);
});

test("PL01 lost proposal response survives same-tab reload without repeating the effect", async ({ page }) => {
  await pl01Identity(page); const w = await createDemand(page);
  await openDemand(page, w.id); const panel = await fillProposal(page);
  let posts = 0, original: Record<string, unknown> | null = null;
  await page.route(`**/api/v1/service/work-orders/${w.id}/visits`, async route => {
    posts++; original = route.request().postDataJSON();
    await route.fetch(); await route.abort("failed");
  });
  await panel.getByRole("button", { name: "Save proposal", exact: true }).click();
  await expect(panel.getByRole("button", { name: "Retry unchanged original" })).toBeEnabled();
  await page.reload();
  await expect(page.getByRole("link", { name: "Continue booking / View appointment" })).toBeVisible();
  expect(posts).toBe(1);
  const visits = (await pl01Call(page, `service/work-orders/${w.id}`)).items[0].visits;
  expect(visits).toHaveLength(1); expect(visits[0].id).toBe(original!.id);
  await page.getByRole("link", { name: "Continue booking / View appointment" }).click();
  await expect(page.getByRole("heading", { name: visits[0].display_number, exact: true })).toBeVisible();
});

test("PL01 unknown original offers only unchanged explicit retry, even if fields would change", async ({ page }) => {
  await pl01Identity(page); const w = await createDemand(page);
  await openDemand(page, w.id); const panel = await fillProposal(page);
  const requests: unknown[] = [];
  await page.route(`**/api/v1/service/work-orders/${w.id}/visits`, async route => { requests.push(route.request().postDataJSON()); await route.abort("failed"); });
  await panel.getByRole("button", { name: "Save proposal", exact: true }).click();
  await expect(panel.getByLabel("Start (site time)", { exact: true })).toBeDisabled();
  await page.reload();
  await expect(page.getByRole("button", { name: "Retry unchanged original" })).toBeEnabled();
  await page.unroute(`**/api/v1/service/work-orders/${w.id}/visits`);
  await page.route(`**/api/v1/service/work-orders/${w.id}/visits`, async route => { requests.push(route.request().postDataJSON()); await route.continue(); });
  await page.getByRole("button", { name: "Retry unchanged original" }).click();
  await expect(page.getByRole("link", { name: "Continue booking / View appointment" })).toBeVisible();
  expect(requests).toHaveLength(2); expect(requests[1]).toEqual(requests[0]);
});

test("PL01 corrupted or unavailable storage refuses sending and another identity cannot restore context", async ({ page }) => {
  await pl01Identity(page); const w = await createDemand(page);
  await page.evaluate(() => sessionStorage.setItem("ppo-pl01-command-v1", "{corrupt"));
  await page.reload();
  await expect(page.getByText(/same-tab recovery record is unreadable/)).toBeVisible();
  await openDemandPanel(page, w.id);
  await expect(page.getByRole("button", { name: "Save proposal", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Close plan visit" }).click();
  await page.getByRole("button", { name: "Change identity", exact: true }).click();
  await page.getByLabel("Identity", { exact: true }).selectOption("observer");
  await page.getByRole("button", { name: "Use this identity", exact: true }).click();
  await expect(page.getByRole("region", { name: "Local demonstration identity" })).toHaveAttribute("aria-busy", "false");
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem("ppo-pl01-command-v1"))).toBe(null);
  await openDemandPanel(page, w.id);
  await expect(page.getByText("Your current permissions allow viewing this work, but not proposing a visit.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Save proposal", exact: true })).toBeDisabled();
});
