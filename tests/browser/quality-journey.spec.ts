import { test, expect } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import {
  call,
  identity,
  capture,
  saveOriginal,
} from "../helpers/quality-browser";
import { prepareJourney, committed } from "../helpers/quality-prepare";
import { completion, submit, review, issue } from "../helpers/quality-report";
import { png } from "../helpers/field";
import { financeJourney } from "../helpers/quality-finance";
test.use({ actionTimeout: 15000, navigationTimeout: 60000 });

test("P11 selected UI service-to-Finance journey preserves controlled booking, personal originals, exact response and reconciled Travel no-posting", async ({
  page,
  context,
}, info) => {
  test.setTimeout(600000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await call(page, "local-session", { profile: "coordinator" });
  const source = await prepareJourney(page, info);
  const aid = source.appointment_id;
  for (const profile of ["assigned-technician", "second-technician"]) {
    await identity(page, profile);
    await page.goto(`/documents/${source.current_issue_id}`);
    await expect(
      page.getByText("Current applicable issue", { exact: true }),
    ).toBeVisible();
    await page.goto(`/my-jobs/${aid}`);
    await committed(
      page,
      `pack-issues/${source.current_issue_id}/acknowledge`,
      () =>
        page
          .getByRole("button", {
            name: "I have read and acknowledge this exact pack",
            exact: true,
          })
          .click(),
    );
    await capture(page, info, `journey-personal-ack-${profile}`);
  }
  await identity(page, "assigned-technician");
  await page.goto(`/my-jobs/${aid}`);
  await page
    .getByLabel("Start context", { exact: true })
    .fill(
      "SYN personal retrospective demonstration start after reading current amended instructions and both exact crew acknowledgements.",
    );
  await committed(page, `appointments/${aid}/start`, () =>
    page
      .getByRole("button", { name: "Record my actual start", exact: true })
      .click(),
  );
  await expect(
    page.getByText("Your actual start is server-saved.", { exact: true }),
  ).toBeVisible();
  let job = (await call(page, `my-jobs/${aid}`)).items[0];
  expect(job.entries).toHaveLength(0);
  expect(job.attendance.actor_id).toBe(
    (await call(page, "local-session")).actor_id,
  );
  const start = Date.parse(
    info.project.name.startsWith("mobile")
      ? "2026-08-24T04:00:00Z"
      : "2026-08-24T00:00:00Z",
  );
  for (const [kind, offset, duration] of [
    ["Travel", 0, 30],
    ["Labour", 30, 90],
  ] as const) {
    await page
      .getByLabel("Evidence type", { exact: true })
      .selectOption("Time");
    await page
      .getByLabel("Authorised task", { exact: true })
      .selectOption(job.scope.items[0].id);
    await page
      .getByLabel("Affected asset", { exact: true })
      .selectOption(job.scope.items[0].assets[0].id);
    await page.getByLabel("Time category", { exact: true }).selectOption(kind);
    await page
      .getByLabel("Time start (UTC ISO)", { exact: true })
      .fill(new Date(start + offset * 60000).toISOString());
    await page
      .getByLabel("Time finish (UTC ISO)", { exact: true })
      .fill(new Date(start + (offset + duration) * 60000).toISOString());
    await page
      .getByLabel("Time explanation", { exact: true })
      .fill(
        `SYN exact personal ${kind}; independently entered ${duration} whole minutes, no overlap, rounding or inferred quantity.`,
      );
    await page
      .getByLabel("Capture context", { exact: true })
      .fill(
        "SYN personal retrospective fixture captured independently of the booking allowance.",
      );
    await committed(page, "field-entries", () =>
      page
        .getByRole("button", { name: "Save evidence online", exact: true })
        .click(),
    );
    await expect(
      page.getByLabel("Capture context", { exact: true }),
    ).toHaveValue("");
  }
  await page
    .getByLabel("Evidence type", { exact: true })
    .selectOption("Material");
  await page
    .getByLabel("Material direction", { exact: true })
    .selectOption("Consumed");
  await page
    .getByLabel("Material description", { exact: true })
    .fill("SYN fictional label sleeve");
  await page.getByLabel("Positive quantity", { exact: true }).fill("2");
  await page.getByLabel("Unit of measure", { exact: true }).selectOption("EA");
  await page
    .getByLabel("Capture context", { exact: true })
    .fill(
      "SYN explicitly captured two fictional sleeves; no stock or accounting transaction.",
    );
  await committed(page, "field-entries", () =>
    page
      .getByRole("button", { name: "Save evidence online", exact: true })
      .click(),
  );
  await expect(page.getByLabel("Capture context", { exact: true })).toHaveValue(
    "",
  );
  await page
    .getByLabel("Evidence type", { exact: true })
    .selectOption("Reading");
  await page
    .getByLabel("Reading name", { exact: true })
    .fill("SYN external display value");
  await page.getByLabel("Numeric value", { exact: true }).fill("12.4");
  await page.getByLabel("Reading unit", { exact: true }).selectOption("V");
  await page
    .getByLabel("Measurement context", { exact: true })
    .fill(
      "SYN read displayed value only; no probe, intervention or verified calibration.",
    );
  await page
    .getByLabel("Capture context", { exact: true })
    .fill("SYN preserve exact displayed reading and its limits.");
  await committed(page, "field-entries", () =>
    page
      .getByRole("button", { name: "Save evidence online", exact: true })
      .click(),
  );
  await expect(page.getByLabel("Capture context", { exact: true })).toHaveValue(
    "",
  );
  await page
    .getByLabel("Evidence type", { exact: true })
    .selectOption("Checklist");
  await page
    .getByLabel("Checklist result", { exact: true })
    .selectOption("NotPerformed");
  await page
    .getByLabel("Checklist reason", { exact: true })
    .fill(
      "SYN additional control check not performed; stop and retain owned follow-up for remaining work.",
    );
  await page
    .getByLabel("Capture context", { exact: true })
    .fill("SYN incomplete check is retained honestly; no fabricated pass.");
  await committed(page, "field-entries", () =>
    page
      .getByRole("button", { name: "Save evidence online", exact: true })
      .click(),
  );
  await capture(
    page,
    info,
    "journey-independent-time-material-reading-checklist",
  );

  await page.goto("/offline/index.html");
  await expect(page.locator("#workspace")).toBeVisible();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await page.getByLabel("Assigned job to download").selectOption(aid);
  await page
    .getByRole("button", { name: "Download selected job", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Download selected job", exact: true }),
  ).toBeEnabled({ timeout: 45000 });
  await expect(page.locator("#notice")).toContainText(
    "Job context and exact pack saved",
  );
  await context.setOffline(true);
  await page.reload();
  await page
    .getByRole("button", { name: "Open saved field job", exact: true })
    .click();
  await page
    .getByLabel("Evidence type", { exact: true })
    .selectOption("Observation");
  await page
    .getByLabel("Finding", { exact: true })
    .fill(
      "SYN original offline finding: label unclear and repeated alarm persists.",
    );
  await page
    .getByLabel("Attempted fix", { exact: true })
    .fill("SYN attempted external visual reading only.");
  await page
    .getByLabel("Result, including unsuccessful work", { exact: true })
    .fill(
      "SYN unable to resolve external label identity; no repair was authorised.",
    );
  await page
    .getByLabel("Capture context", { exact: true })
    .fill(
      "SYN preserve original offline inspection evidence and explicit uncertainty.",
    );
  await page
    .getByRole("button", { name: "Save evidence on this device", exact: true })
    .click();
  await expect(page.locator("#queue .queue-row")).toHaveCount(1);
  await page.getByLabel("Evidence type", { exact: true }).selectOption("Photo");
  const bytes = png();
  await page.getByLabel("Original synthetic PNG").setInputFiles({
    name: "SYN-P11-original.png",
    mimeType: "image/png",
    buffer: bytes,
  });
  await page
    .getByLabel("Photo caption")
    .fill(
      "SYN original fictional navy and green field image; no real equipment or people.",
    );
  await page
    .getByRole("button", { name: "Save evidence on this device", exact: true })
    .click();
  await expect(page.locator("#queue .queue-row")).toHaveCount(5);
  async function localRows() {
    return page.evaluate(async () => {
      const modulePath = "/offline/modules/offline/store.js";
      const store = await import(modulePath);
      return store.queue((await store.ownership()).owner);
    });
  }
  const originals = (await localRows()).map(
    (x: { original: unknown }) => x.original,
  );
  await capture(page, info, "journey-offline-originals-completed-local-save");
  await page.reload();
  expect(
    (await localRows()).map((x: { original: unknown }) => x.original),
  ).toEqual(originals);
  await context.setOffline(false);
  await page.route("**/api/v1/sync/operations", async (route) => {
    await route.fetch();
    await route.abort("failed");
  });
  await page
    .getByRole("button", {
      name: "Send next batch / retry originals",
      exact: true,
    })
    .click();
  await expect(page.locator("#queue")).toContainText(
    "Server outcome is uncertain",
  );
  await capture(page, info, "journey-offline-uncertain-original-receipt");
  await page.unroute("**/api/v1/sync/operations");
  await page
    .getByRole("button", {
      name: "Send next batch / retry originals",
      exact: true,
    })
    .click();
  await expect(page.locator("#queue .status")).toHaveText(
    Array(5).fill("ServerSaved"),
  );
  expect(
    (await localRows()).map((x: { original: unknown }) => x.original),
  ).toEqual(originals);
  job = (await call(page, `my-jobs/${aid}`)).items[0];
  expect(job.entries).toHaveLength(7);
  expect(
    await (
      await page.request.get(
        `/api/v1/attachments/${job.attachments[0].id}/bytes`,
      )
    ).body(),
  ).toEqual(bytes);
  await writeFile(info.outputPath("P11-original-field.png"), bytes);
  await writeFile(
    info.outputPath("P11-offline-originals.json"),
    JSON.stringify(
      {
        originals,
        accepted_rows: await localRows(),
        png_sha256: createHash("sha256").update(bytes).digest("hex"),
        restart_limit:
          "This journey proves offline page reload. Original database/application/browser process restart gates run separately in the maintained workflow.",
      },
      null,
      2,
    ),
  );
  await page.goto(`/my-jobs/${aid}`);
  await completion(page);
  await submit(page);
  const rid = page.url().split("/").at(-1)!;
  await identity(page, "coordinator");
  await review(page, true);
  await capture(page, info, "journey-exact-evidence-returned");
  await identity(page, "assigned-technician");
  await page
    .getByRole("link", {
      name: "Technician evidence and correction",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "History", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Correct this observation entry",
      exact: true,
    })
    .click();
  await page
    .getByLabel("Finding", { exact: true })
    .fill(
      "SYN corrected finding: visual label reading failed. Original uncertainty remains; owner must arrange separate authorised work.",
    );
  await page
    .getByLabel("Correction reason", { exact: true })
    .fill(
      "SYN exact reviewer return addressed by a successor factual entry; original retained.",
    );
  await page
    .getByRole("button", { name: "Save successor correction", exact: true })
    .click();
  await expect(
    page.getByLabel("Capture context", { exact: true }),
  ).toBeVisible();
  await completion(page);
  await submit(page);
  await identity(page, "coordinator");
  await review(page);
  const report = (await call(page, `reports/${rid}`)).items[0];
  expect(report.appointment.status).toBe("Completed");
  expect(report.work_order.status).toBe("Authorised");
  await page
    .getByRole("link", {
      name: "Remaining work and return proposal",
      exact: true,
    })
    .click();
  await page.getByText("Propose a visit", { exact: true }).click();
  const returnDay = info.project.name.startsWith("mobile")
    ? "2026-11-16"
    : "2026-11-13";
  await page
    .getByLabel("Proposed start (device timezone)")
    .fill(returnDay + "T00:00");
  await page
    .getByLabel("Proposed finish (device timezone)")
    .fill(returnDay + "T02:00");
  const proposal = await committed(
    page,
    `service/work-orders/${source.work_order_id}/visits`,
    () =>
      page
        .getByRole("button", { name: "Save proposed visit", exact: true })
        .click(),
  );
  const proposed = (await call(page, `appointments/${proposal.record_id}`))
    .items[0];
  expect(proposed.status).toBe("Proposed");
  expect(proposed.assignments).toHaveLength(0);
  expect(proposed.customer_commitment).toBe("Unknown");
  await capture(page, info, "journey-owned-remaining-work-proposal");
  await page.goto(`/service/reports/${rid}`);
  await issue(page);
  const issued = (await call(page, `reports/${rid}`)).items[0];
  const presentation = issued.presentations.find(
    (p: { kind: string }) => p.kind === "IssuedReport",
  );
  for (const format of ["html", "pdf", "manifest"])
    await saveOriginal(
      page,
      info,
      `reports/${rid}/${format}?presentation_id=${presentation.id}`,
      `P11-reserved-report.${format === "manifest" ? "json" : format}`,
      { report_id: rid, presentation },
    );
  await page
    .getByRole("button", { name: "Present Issued Report", exact: true })
    .first()
    .click();
  const html = await page
    .getByTitle("Exact customer-safe report presentation", { exact: true })
    .getAttribute("srcdoc");
  expect(createHash("sha256").update(html!).digest("hex")).toBe(
    presentation.content_hash,
  );
  expect(html).not.toContain("P11_PRIVATE_REVIEW_CANARY");
  await page
    .getByLabel("Customer response", { exact: true })
    .selectOption("AcceptedWithReservations");
  await page
    .getByLabel("Stated respondent name (synthetic)")
    .fill("SYN Casey Fictional");
  await page
    .getByLabel("Stated respondent role", { exact: true })
    .fill("Fictional site contact");
  await page
    .getByLabel("Response remarks / reservations", { exact: true })
    .fill(
      "SYN accepts the exact attendance presentation with reservation: remaining label inspection requires another owned visit.",
    );
  await page
    .getByLabel("Owned next action (required unless accepted)")
    .fill(
      "SYN service coordinator to review the proposed return and contact the fictional site.",
    );
  await capture(page, info, "journey-exact-reserved-response");
  await page
    .getByRole("button", {
      name: "Save response to presented content",
      exact: true,
    })
    .click();
  await expect
    .poll(
      async () =>
        (await call(page, `reports/${rid}`)).items[0].responses.length,
    )
    .toBe(1);
  const finance = await financeJourney(page, info, {
    work_order_id: source.work_order_id,
    report_id: rid,
    reference: issued.reference,
  });
  await identity(page, "assigned-technician");
  for (const path of [
    `finance/handoffs/${finance.handoff_id}`,
    `finance/issues/${finance.issue.id}/bytes?format=pdf`,
    `finance/issues/${finance.issue.id}/bytes?format=html`,
  ]) {
    const denied = await page.request.get(`/api/v1/${path}`);
    expect([403, 404]).toContain(denied.status());
    expect(denied.headers()["cache-control"]).toBe("private, no-store");
    expect(await denied.text()).not.toContain("FINANCE_PRIVATE_CANARY");
  }
  await identity(page, "second-technician");
  await page.goto(`/my-jobs/${aid}`);
  await page.getByRole("button", { name: "History", exact: true }).click();
  await expect(
    page.getByText(/original offline finding/).first(),
  ).toBeVisible();
  await expect(page.getByText(/SYN corrected finding/).first()).toBeVisible();
  await expect(page.getByText(/FINANCE_PRIVATE_CANARY/)).toHaveCount(0);
  await capture(
    page,
    info,
    "journey-technician-original-and-correction-history",
  );
  await writeFile(
    info.outputPath("P11-selected-journey.json"),
    JSON.stringify(
      {
        ...source,
        old_pack_pdf: undefined,
        report_id: rid,
        presentation,
        return_proposal: proposal,
        finance,
        completed_boundary:
          "Service intake through exact reserved customer response and same-source Finance allocation, independent review, original unknown-outcome lookup, reconciliation and OUT-14.",
        p12_limit:
          "PT-30 full status remains blocked by its written completed P12 precondition; no restore or handover acceptance inferred.",
        page_errors: errors,
      },
      null,
      2,
    ),
  );
  expect(errors).toEqual([]);
});
