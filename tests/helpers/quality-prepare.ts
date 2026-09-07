import {
  expect,
  type Page,
  type Locator,
  type TestInfo,
} from "@playwright/test";
import { call, capture } from "./quality-browser";

const id = (prefix: string, n = 1) =>
  `${prefix}000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
export async function committed(
  page: Page,
  path: string,
  action: () => Promise<unknown>,
) {
  const result = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === `/api/v1/${path}` &&
      r.request().method() === "POST",
  );
  await action();
  const response = await result;
  expect(response.ok(), await response.text()).toBe(true);
  expect(response.headers()["cache-control"]).toBe("private, no-store");
  await expect(page.getByText(/^Loading .*…$/)).toHaveCount(0);
  return response.json();
}
async function manualEvidence(form: Locator, purpose: string) {
  await form
    .getByLabel("Evidence title", { exact: true })
    .fill(`SYN P11 ${purpose}`);
  await form
    .getByLabel("Synthetic source reference", { exact: true })
    .fill(`SYN-P11-${purpose}`);
  await form.getByLabel("Source version", { exact: true }).fill("1");
  await form
    .getByLabel("Exact manual evidence", { exact: true })
    .fill(
      `SYN ${purpose}: reviewed fictional external visual inspection only. Stop before intervention; no shutdown or isolation work is authorised. Coordinator owns access and identification follow-up.`,
    );
}
async function readiness(
  page: Page,
  wo: string,
  form: Locator,
  criterion: string,
  outcome = "Pass",
) {
  await form
    .getByLabel("Readiness criterion", { exact: true })
    .selectOption(criterion);
  await form
    .getByLabel("Readiness decision", { exact: true })
    .selectOption(outcome);
  await form
    .getByLabel("Review reason", { exact: true })
    .fill(
      `SYN explicit ${criterion} review for the current visual-only scope; no waiver of required controls.`,
    );
  await form
    .getByLabel("Evidence source time (your device timezone)", { exact: true })
    .fill("2026-09-05T00:00");
  await manualEvidence(form, criterion);
  await committed(page, `service/work-orders/${wo}/readiness`, () =>
    form
      .getByRole("button", { name: "Record readiness review", exact: true })
      .click(),
  );
}
async function contact(page: Page, aid: string, outcome: string) {
  await page
    .getByRole("button", { name: "Record contact", exact: true })
    .click();
  await page
    .getByLabel("Contact outcome", { exact: true })
    .selectOption(outcome);
  await page
    .getByLabel("Contact notes", { exact: true })
    .fill(
      outcome === "Confirmed"
        ? "SYN fictional customer explicitly agrees to these exact displayed dates. No communication was sent. No pack acknowledgement or billing approval is implied."
        : "SYN fictional contact attempt failed. Coordinator retains follow-up; no customer agreement is inferred.",
    );
  await committed(page, `appointments/${aid}/contacts`, () =>
    page
      .getByRole("button", { name: "Save contact outcome", exact: true })
      .click(),
  );
}
async function issuePack(page: Page, pid: string) {
  await page
    .getByLabel("Decision / change reason", { exact: true })
    .fill(
      "SYN current scope, all nine sections, exact sources and whole-crew dates checked.",
    );
  await committed(page, `packs/${pid}/check`, () =>
    page
      .getByRole("button", { name: "Check this revision", exact: true })
      .click(),
  );
  await committed(page, `packs/${pid}/issue`, () =>
    page
      .getByRole("button", {
        name: "Queue exact output for issue",
        exact: true,
      })
      .click(),
  );
  await page
    .getByRole("button", {
      name: "Process or recover original output",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("link", { name: "Open exact issued document", exact: true }),
  ).toBeVisible({ timeout: 60000 });
}

// Every creation, scope/readiness decision, booking, contact and pack mutation
// below uses the actual UI. HTTP reads only inspect what those commands saved.
export async function prepareJourney(page: Page, info: TestInfo) {
  const mobile = info.project.name.startsWith("mobile");
  const day = mobile ? "2026-11-10" : "2026-11-09";
  const movedDay = mobile ? "2026-11-12" : "2026-11-11";
  const summary = `SYN P11 integrated inspection ${info.project.name}`;
  await page.goto("/service/tickets/new");
  await page
    .getByLabel("Company visibility context", { exact: true })
    .selectOption(id("20"));
  await page.getByLabel("Request summary", { exact: true }).fill(summary);
  await page
    .getByLabel("Known requester", { exact: true })
    .selectOption(id("60"));
  await page.getByLabel("Known site", { exact: true }).selectOption(id("70"));
  await page
    .getByLabel("Requester description / clarification")
    .fill(
      "SYN fictional caller reports repeated external display alarm after an unsuccessful earlier check.",
    );
  await page
    .getByLabel("Reported symptoms / explicit symptom uncertainty")
    .fill(
      "SYN intermittent external display alarm; root cause and coverage remain uncertain.",
    );
  await page
    .getByLabel("Operational impact", { exact: true })
    .fill("SYN monitoring interrupted; no invented production loss.");
  await page
    .getByLabel("Priority rationale", { exact: true })
    .fill("SYN assessment needed; urgency does not authorise physical work.");
  await page
    .getByLabel("Next action", { exact: true })
    .fill(
      "SYN coordinator to review limited scope, authority and exact site access.",
    );
  await page
    .getByLabel("Reason for saving")
    .fill(
      "SYN preserve complete fictional intake before separate work authority.",
    );
  await page
    .getByRole("button", { name: "Save service request", exact: true })
    .click();
  await expect(page).toHaveURL(/\/service\/tickets\/[a-f0-9-]{36}$/);
  const ticket = page.url().split("/").at(-1)!;
  await page
    .getByLabel("Reason for this triage action")
    .fill("SYN exact intake reviewed; triage does not approve scope or dates.");
  await committed(page, `service/tickets/${ticket}/triage`, () =>
    page.getByRole("button", { name: "Complete triage", exact: true }).click(),
  );
  await capture(page, info, "journey-intake-triaged");

  await page.goto("/service/work-orders/new");
  await page
    .getByLabel("Company context", { exact: true })
    .selectOption(id("20"));
  await page.getByLabel("Service site", { exact: true }).selectOption(id("70"));
  await page
    .getByLabel("Customer at this site", { exact: true })
    .selectOption(id("50"));
  await page
    .getByLabel("Service owner", { exact: true })
    .selectOption(id("30"));
  await page
    .getByLabel("Service request to link", { exact: true })
    .selectOption(ticket);
  await page
    .getByRole("button", { name: "Link service request", exact: true })
    .click();
  await page
    .getByLabel("Purpose of these linked requests", { exact: true })
    .fill(
      "SYN trace the selected external inspection to its exact original service request.",
    );
  await page
    .getByRole("button", { name: "Save draft work order", exact: true })
    .click();
  await expect(page).toHaveURL(/\/service\/work-orders\/[a-f0-9-]{36}$/);
  const wo = page.url().split("/").at(-1)!;
  await page.getByText("Edit scope draft", { exact: true }).click();
  const scope = page
    .locator("form")
    .filter({ has: page.getByLabel("Scope summary", { exact: true }) });
  await scope.getByLabel("Scope summary", { exact: true }).fill(summary);
  await scope
    .getByLabel("Explicit exclusions", { exact: true })
    .fill(
      "SYN no intervention, repair, live-system access, isolation or shutdown; no whole-project acceptance.",
    );
  await scope
    .getByLabel("Limited diagnostic authority", { exact: true })
    .fill(
      "SYN external visual inspection only; retain failed earlier attempted fix and uncertain identification.",
    );
  await scope
    .getByLabel("Account clarification and Finance review plan", {
      exact: true,
    })
    .fill(
      "SYN Finance reviews exact completed quantities separately; coverage and charging remain distinct.",
    );
  for (let n = 1; n <= 2; n++) {
    await scope
      .getByRole("button", { name: "Add scope task", exact: true })
      .click();
    const task = scope.getByRole("group", { name: `Task ${n}`, exact: true });
    await task
      .getByLabel("Task description", { exact: true })
      .fill(
        n === 1
          ? "SYN inspect external display and record factual evidence"
          : "SYN remaining external label inspection needing another owned visit",
      );
    await task
      .getByLabel("Expected outcome", { exact: true })
      .fill("SYN record exact observed state and explicit unresolved limits.");
    await task
      .getByLabel("Completion requirements — one per line", { exact: true })
      .fill("SYN preserve findings, image, reading and personal declaration");
    await task
      .getByLabel("Equipment to include", { exact: true })
      .selectOption(id("80"));
    await task
      .getByRole("button", {
        name: `Include equipment in task ${n}`,
        exact: true,
      })
      .click();
  }
  await scope
    .getByRole("checkbox", {
      name: "Record a coverage assessment",
      exact: true,
    })
    .check();
  await scope
    .getByLabel("Coverage position", { exact: true })
    .selectOption("Disputed");
  await scope
    .getByLabel("Assessment", { exact: true })
    .fill("SYN coverage disputed; no warranty or billing conclusion inferred.");
  await scope
    .getByLabel("Coverage reason", { exact: true })
    .fill(
      "SYN coordinator retains authority evidence; Finance treatment remains separate.",
    );
  await scope
    .getByRole("checkbox", {
      name: "Record synthetic manual authority evidence",
      exact: true,
    })
    .check();
  await manualEvidence(scope, "bounded-work-authority");
  await committed(page, `service/work-orders/${wo}/save-scope`, () =>
    scope
      .getByRole("button", { name: "Save scope draft", exact: true })
      .click(),
  );
  await page.getByText("Review a readiness criterion", { exact: true }).click();
  const review = page
    .locator("details")
    .filter({
      has: page.locator("summary", {
        hasText: /^Review a readiness criterion$/,
      }),
    });
  for (const criterion of [
    "SiteControls",
    "CompetencyPlan",
    "SiteAccess",
    "MandatoryIsolation",
    "ShutdownAuthority",
  ])
    await readiness(
      page,
      wo,
      review,
      criterion,
      ["MandatoryIsolation", "ShutdownAuthority"].includes(criterion)
        ? "NotApplicable"
        : "Pass",
    );
  await committed(page, `service/work-orders/${wo}/authorise`, () =>
    page
      .getByRole("button", { name: "Authorise current scope", exact: true })
      .click(),
  );
  await expect(
    page.getByText("Authorised scope — read-only", { exact: true }),
  ).toBeVisible();
  await capture(page, info, "journey-authorised-exact-scope");
  await page.getByText("Propose a visit", { exact: true }).click();
  await page
    .getByLabel("Proposed start (device timezone)")
    .fill(day + "T00:00");
  await page
    .getByLabel("Proposed finish (device timezone)")
    .fill(day + "T02:00");
  const receipt = await committed(
    page,
    `service/work-orders/${wo}/visits`,
    () =>
      page
        .getByRole("button", { name: "Save proposed visit", exact: true })
        .click(),
  );
  const aid = receipt.record_id;
  await page
    .getByText("Review proposed visit preparation", { exact: true })
    .click();
  const preparation = page
    .locator("details")
    .filter({
      has: page.locator("summary", {
        hasText: /^Review proposed visit preparation$/,
      }),
    });
  await readiness(page, wo, preparation, "ToolPreparation");
  await page.goto(`/service/appointments/${aid}`);
  await contact(page, aid, "Failed");
  await capture(page, info, "journey-failed-contact-owned");
  await contact(page, aid, "Confirmed");
  await page
    .getByRole("button", { name: "Confirm appointment", exact: true })
    .click();
  const booking = page.getByRole("region", {
    name: "Confirm appointment",
    exact: true,
  });
  for (const [i, resource] of [9, 2].entries()) {
    if (i)
      await booking
        .getByRole("button", { name: "Add crew member", exact: true })
        .click();
    await booking
      .getByLabel(`Resource ${i + 1}`, { exact: true })
      .selectOption(id("a4", resource));
    await booking
      .getByLabel(`Travel before ${i + 1} (minutes)`, { exact: true })
      .fill("30");
    await booking
      .getByLabel(`Travel after ${i + 1} (minutes)`, { exact: true })
      .fill("0");
    await booking
      .getByLabel(`Travel basis ${i + 1}`, { exact: true })
      .fill(
        "SYN explicit thirty-minute planning allowance; actual personal Travel is captured independently.",
      );
  }
  await booking
    .getByLabel("Booking reason", { exact: true })
    .fill(
      "SYN exact customer dates and whole-crew reservations reviewed within authorised visual-only scope.",
    );
  await committed(page, `appointments/${aid}/confirm`, () =>
    booking
      .getByRole("button", { name: "Confirm booking", exact: true })
      .click(),
  );
  expect(
    (await call(page, `appointments/${aid}`)).items[0].assignments.filter(
      (a: { active: boolean }) => a.active,
    ),
  ).toHaveLength(2);
  await page.goto(`/service/packs/new?appointment_id=${aid}`);
  await page.getByRole("checkbox", { name: /SYN visual inspection/ }).check();
  for (const k of [
    "identification",
    "customer_arrangements",
    "scope",
    "equipment",
    "history",
    "technical_information",
    "readiness",
    "site_controls",
    "completion",
  ])
    await page
      .locator(`#section-${k}`)
      .fill(
        `SYN reviewed ${k.replaceAll("_", " ")}. Visual inspection only; preserve uncertain identity and failed earlier fix. Stop and escalate any access or control uncertainty. ` +
          "SYN explicit preparation and scope limits remain readable in long output. ".repeat(
            8,
          ),
      );
  await page
    .getByLabel("Preparation / change reason", { exact: true })
    .fill(
      "SYN prepare all nine sections from exact approved context and source bytes.",
    );
  await page
    .getByRole("button", { name: "Save preparation", exact: true })
    .click();
  await expect(page).toHaveURL(/\/service\/packs\/[a-f0-9-]{36}$/);
  const pid = page.url().split("/").at(-1)!;
  await issuePack(page, pid);
  const oldPack = (await call(page, `packs/${pid}`)).items[0];
  const original = await page.request.get(
    `/api/v1/pack-issues/${oldPack.current_issue_id}/pdf`,
  );
  expect(original.ok()).toBe(true);
  const originalBytes = await original.body();
  await capture(page, info, "journey-first-issued-pack");
  await page.goto(`/service/appointments/${aid}`);
  await page
    .getByRole("button", { name: "Move or reassign", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  const move = page.getByRole("dialog");
  await move
    .getByLabel("Start (site time)", { exact: true })
    .fill(movedDay + "T10:00");
  await move
    .getByLabel("Finish (site time)", { exact: true })
    .fill(movedDay + "T12:00");
  await move
    .getByLabel("Change reason", { exact: true })
    .fill(
      "SYN controlled weekday move; retain original issued bytes and require changed-date contact and successor pack.",
    );
  await committed(page, `appointments/${aid}/move`, () =>
    move
      .getByRole("button", { name: "Save proposed move", exact: true })
      .click(),
  );
  await contact(page, aid, "Confirmed");
  await capture(page, info, "journey-controlled-move");
  await page.goto(`/service/packs/${pid}`);
  await page
    .getByRole("button", { name: "Prepare successor revision", exact: true })
    .click();
  await page
    .getByLabel("Preparation / change reason", { exact: true })
    .fill(
      "SYN successor reflects controlled changed dates; original issue remains immutable.",
    );
  await committed(page, `packs/${pid}/amend`, () =>
    page
      .getByRole("button", {
        name: "Save successor and hold dispatch",
        exact: true,
      })
      .click(),
  );
  await issuePack(page, pid);
  const currentPack = (await call(page, `packs/${pid}`)).items[0];
  expect(currentPack.current_issue_id).not.toBe(oldPack.current_issue_id);
  expect(
    await (
      await page.request.get(
        `/api/v1/pack-issues/${oldPack.current_issue_id}/pdf`,
      )
    ).body(),
  ).toEqual(originalBytes);
  await capture(page, info, "journey-successor-pack-before-personal-acks");
  return {
    ticket,
    work_order_id: wo,
    appointment_id: aid,
    pack_id: pid,
    old_issue_id: oldPack.current_issue_id,
    old_pack_pdf: originalBytes,
    current_issue_id: currentPack.current_issue_id,
  };
}
