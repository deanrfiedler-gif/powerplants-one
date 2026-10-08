import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { CRM, crmBase, crmAction } from "../helpers/crm";
import { leadCreate } from "../helpers/leads";
import { discoveryInput } from "../helpers/estimating-discovery";
import { estimateInput, quoteCommand } from "../helpers/estimating";
import { emptyHandover } from "../../src/sales/handover-model";
import {
  json,
  session,
  detail,
  releasePath,
  prepare,
  approve,
  issue,
} from "../helpers/quotation-release-http";
import {
  response,
  responseDetail,
  responsePath,
} from "../helpers/quotation-response-http";

async function call(page: Page, path: string, body?: unknown) {
  const result = await page.request.fetch(`/api/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? {} : { Origin: new URL(page.url()).origin },
    data: body,
  });
  expect(result.ok(), `${path}: ${await result.text()}`).toBe(true);
  return result.json();
}

// Native HTTP commands prepare the exact commercial chain. Browser actions
// exercise the joins; every step continues the same Lead/Deal and scope.
test("IJ-01 one Lead continues through exact quotation, Project receiving and an owned returned Lead", async ({
  page,
}, info) => {
  test.setTimeout(240000);
  page.on("dialog", (dialog) => void dialog.accept());
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/work");
  await call(page, "local-session", { profile: "coordinator" });
  const lead = {
    ...leadCreate(),
    title: `SYN Connected journey ${randomUUID()}`,
  };
  const action = {
    ...crmAction(),
    due_at: "2031-10-08T00:00:00.000Z",
    due_needed: false,
  };
  let deal = "",
    estimatingHandover = "",
    workspace = "",
    revision = "",
    estimate = "",
    quote = "",
    wonHandover = "",
    project = "",
    followup = "",
    returnedLead = "";
  const operations: string[] = [];
  const capture = async (name: string) => {
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({ path: info.outputPath(name + ".png") });
  };

  await test.step("Lead conversion retains the original owner and planned Activity", async () => {
    await call(page, "crm/leads", lead);
    await call(page, `crm/leads/${lead.id}/next-action`, {
      ...crmBase(),
      expected_version: 1,
      activity_id: null,
      new_action: action,
    });
    await page.goto(`/sales/leads/${lead.id}`);
    await page
      .getByRole("button", { name: "Convert to deal", exact: true })
      .click();
    await page
      .getByLabel("Qualification note", { exact: true })
      .fill("SYN Same customer need confirmed for this connected journey.");
    await page
      .getByRole("button", { name: "Convert to deal", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toContainText("Converted");
    const converted = await call(page, `crm/leads/${lead.id}`);
    deal = converted.deal.id;
    expect(converted.next_activity.id).toBe(action.id);
    await page.getByRole("link", { name: "Open deal", exact: true }).click();
    const saved = (await call(page, `crm/opportunities/${deal}`)).items[0];
    expect(saved.owner_id).toBe(CRM.owner);
    expect(saved.stage_id).toBe("Discovery");
    expect(saved.next_activity.id).toBe(action.id);
    await capture("01-converted-deal");
  });

  const acceptedHandover = async (kind: "Estimating" | "Won") => {
    const id = randomUUID();
    await call(page, "sales/handovers", {
      ...crmBase(),
      id,
      opportunity_id: deal,
      kind,
    });
    await call(page, `sales/handovers/${id}`, {
      ...crmBase(),
      action: "Save",
      expected_version: 1,
      receiving_owner_id: CRM.owner,
      note: "SYN independently prepared receiving scope",
      content: {
        ...emptyHandover(),
        problem: lead.need_summary,
        outcome: "SYN Controls outcome",
        included_scope: "SYN Controls and installation",
        exclusions: "Civil works",
        assumptions: "Synthetic manual prices",
        unknowns: "Receiver owns technical review",
        requested_date: "2031-10-08",
        date_reason: "SYN requested only",
        next_activity_id: action.id,
        destination: kind === "Won" ? "Projects" : "Undecided",
        routing_basis: kind === "Won" ? "SYN explicit Project delivery" : "",
        delivery_items: kind === "Won" ? "SYN controls package" : "",
        release_prerequisites:
          kind === "Won" ? "Independent Project scope acceptance" : "",
      },
    });
    await call(page, `sales/handovers/${id}`, {
      ...crmBase(),
      action: "Submit",
      expected_version: 2,
      note: "SYN submit",
    });
    const submitted = await call(page, `sales/handovers/${id}`);
    await call(page, `sales/handovers/${id}`, {
      ...crmBase(),
      action: "Accept",
      expected_version: 3,
      source_hash: submitted.record.source_hash,
      note: "SYN independent receiving review",
    });
    return id;
  };

  await test.step("Accepted Sales brief links to independently captured Discovery and exact manual costs", async () => {
    estimatingHandover = await acceptedHandover("Estimating");
    const discovery = discoveryInput();
    const preview = await call(page, "estimating/workspaces/preview", {
      opportunity_id: deal,
      discovery,
    });
    workspace = randomUUID();
    revision = randomUUID();
    const option = randomUUID();
    await call(page, "estimating/workspaces", {
      ...crmBase(),
      id: workspace,
      option_id: option,
      revision_id: revision,
      opportunity_id: deal,
      discovery,
      expected_opportunity_version: preview.expected_opportunity_version,
      context_hash: preview.context_hash,
      confirmed_question_ids: preview.required_confirmation_ids,
    });
    await page.goto(`/sales/handoffs/estimating/${estimatingHandover}`);
    await page
      .getByRole("button", { name: "Review workspace link", exact: true })
      .click();
    await page
      .getByLabel("Link reason", { exact: true })
      .fill("SYN compare the same customer need with independent discovery");
    await page
      .getByRole("button", { name: "Link accepted brief", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: /Current accepted brief linked/ }),
    ).toBeVisible();
    await page
      .getByRole("link", {
        name: "Open linked estimating workspace",
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("heading", {
        name: "Accepted Sales context",
        exact: true,
      }),
    ).toBeVisible();
    await capture("02-accepted-sales-brief");
    const cost = await call(
      page,
      `estimating/workspaces/${workspace}/costing/preview`,
      { option_id: option, revision_id: revision },
    );
    const manual = estimateInput(deal);
    estimate = randomUUID();
    await call(page, `estimating/workspaces/${workspace}/costing`, {
      ...crmBase(),
      estimate_id: estimate,
      option_id: option,
      revision_id: revision,
      expected_workspace_version: cost.expected_workspace_version,
      expected_estimate_version: cost.expected_estimate_version,
      context_hash: cost.context_hash,
      title: manual.title,
      scope: manual.scope,
      lines: manual.lines.map((line) => ({ ...line, allowance: false })),
      policy: manual.policy,
    });
    const saved = await call(page, `estimating/estimates/${estimate}`);
    expect(saved.saved.discovery_basis.revision_id).toBe(revision);
    expect(saved.totals.sell).toBe("720.00");
  });

  await test.step("Independent review, release and staff-recorded response retain the exact cost revision", async () => {
    const owner = await session("coordinator"),
      reviewer = await session("estimating-source-reviewer"),
      approver = await session("quotation-approver"),
      issuer = await session("quotation-issuer");
    for (const stage of ["Scoping", "Quoting"]) {
      const current = (await call(page, `crm/opportunities/${deal}`)).items[0];
      await call(page, `crm/opportunities/${deal}/stage`, {
        ...crmBase(),
        expected_version: current.version,
        stage_id: stage,
        qualification_note: null,
        identification_activity_id: null,
      });
    }
    const path = `estimating/estimates/${estimate}/review`,
      review = await json(owner, path);
    await json(owner, path, {
      ...crmBase(),
      estimate_version_id: review.saved.id,
      basis_hash: review.basis_hash,
      expected_version: 1,
      expected_review_version: 0,
      responses: [],
    });
    for (const kind of ["Completeness", "SourcePrice", "Technical"]) {
      const current = await json(reviewer, path);
      await json(reviewer, path + "/decision", {
        ...crmBase(),
        submission_id: current.submissions.at(-1).id,
        expected_version: 1,
        expected_review_version: current.sequence,
        kind,
        outcome: "Reviewed",
        findings: [],
      });
    }
    const saved = await json(owner, `estimating/estimates/${estimate}`),
      draft = quoteCommand(saved.saved);
    await json(owner, `estimating/estimates/${estimate}/quotes`, draft);
    const release = prepare(await detail(owner, draft.id));
    quote = release.id;
    await json(owner, releasePath(draft.id) + "/prepare", release);
    await json(owner, `estimating/quotes/${quote}/render`, {});
    await json(
      approver,
      releasePath(quote) + "/approval",
      approve(await detail(approver, quote)),
    );
    await json(
      issuer,
      releasePath(quote) + "/issue",
      issue(await detail(issuer, quote)),
    );
    await json(
      owner,
      responsePath(quote) + "/record",
      response(await responseDetail(owner, quote)),
    );
    expect(
      (await json(owner, `estimating/quotes/${quote}`)).estimate_version_id,
    ).toBe(saved.saved.id);
    await page.goto(`/sales/opportunities/${deal}`);
    await page
      .getByRole("tab", { name: "Estimates & quotations", exact: true })
      .click();
    const releaseEvidence = page.waitForResponse((r) =>
      r.request().method() === "GET" &&
      new URL(r.url()).pathname === `/api/v1/${releasePath(quote)}`,
    );
    const responseEvidence = page.waitForResponse((r) =>
      r.request().method() === "GET" &&
      new URL(r.url()).pathname === `/api/v1/${responsePath(quote)}`,
    );
    await page
      .getByText("Issue, reported response and conversion evidence", {
        exact: true,
      })
      .click();
    const released = await releaseEvidence;
    expect(released.status()).toBe(200);
    expect(await released.finished()).toBeNull();
    await expect(
      page.getByText("Independent approval: Approved. Issue: Recorded.", {
        exact: true,
      }),
    ).toBeVisible();
    const reported = await responseEvidence;
    expect(reported.status()).toBe(200);
    expect(await reported.finished()).toBeNull();
    await expect(
      page.getByText("Staff-recorded response: Accepted.", { exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel("Saved sales outcome")).toHaveText(
      "Outcome: Open",
    );
    await capture("03-exact-quotation-response");
  });

  await test.step("Won uses the same quotation and recovers one accepted outcome after a lost response", async () => {
    for (const stage of ["Negotiation", "Closing"]) {
      const current = (await call(page, `crm/opportunities/${deal}`)).items[0];
      await call(page, `crm/opportunities/${deal}/stage`, {
        ...crmBase(),
        expected_version: current.version,
        stage_id: stage,
        qualification_note: null,
        identification_activity_id: null,
      });
    }
    await page.reload();
    await page
      .getByRole("button", { name: "Record sales outcome", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await dialog
      .getByLabel("Outcome evidence source", { exact: true })
      .selectOption("Quotation");
    await dialog
      .getByLabel("Quotation release to review", { exact: true })
      .selectOption(quote);
    await dialog
      .getByRole("button", { name: "Review quotation basis", exact: true })
      .click();
    await dialog
      .getByLabel("Acceptance or order evidence")
      .fill("SYN exact staff-recorded accepted quotation reviewed");
    let posts = 0;
    await page.route(
      `**/api/v1/crm/opportunities/${deal}/outcome`,
      async (route) => {
        posts++;
        operations.push(route.request().postDataJSON().operation_id);
        const accepted = await route.fetch();
        expect(accepted.ok(), await accepted.text()).toBe(true);
        await route.abort("connectionfailed");
      },
      { times: 1 },
    );
    await dialog
      .getByRole("button", { name: "Record outcome", exact: true })
      .click();
    await dialog
      .getByRole("button", { name: "Confirm original save outcome" })
      .click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByLabel("Saved sales outcome")).toHaveText(
      "Outcome: Won",
    );
    expect(posts).toBe(1);
    expect((await call(page, `operations/${operations[0]}`)).state).toBe("Won");
    const current = (await call(page, `crm/opportunities/${deal}`)).items[0];
    expect(
      current.events.filter(
        (event: { event_type: string }) =>
          event.event_type === "OpportunityOutcomeRecorded",
      ),
    ).toHaveLength(1);
  });

  await test.step("Native Project and explicit delivery receiving preserve independent authority", async () => {
    wonHandover = await acceptedHandover("Won");
    await page.goto(`/sales/handoffs/won/${wonHandover}`);
    await page
      .getByRole("link", { name: "Create native project", exact: true })
      .click();
    await expect(page.getByLabel("Project name", { exact: true })).toHaveValue(
      lead.title,
    );
    await page
      .getByRole("button", { name: "Create project", exact: true })
      .click();
    await expect(page).toHaveURL(
      new RegExp(`/sales/handoffs/won/${wonHandover}\\?created_destination=`),
    );
    project = new URL(page.url()).searchParams.get("created_destination")!;
    const before = await call(page, `projects/${project}`);
    await page
      .getByRole("button", { name: "Review delivery link", exact: true })
      .click();
    await page
      .getByLabel("Delivery link reason", { exact: true })
      .fill("SYN same Won source and native customer/site reviewed");
    await page
      .getByRole("button", { name: "Link accepted Won handover", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: /Current accepted handover linked/ }),
    ).toBeVisible();
    const after = await call(page, `projects/${project}`);
    // observed_at is generated for each read; every saved/derived business
    // field must remain identical after accepting the separate Sales link.
    expect(Number.isNaN(Date.parse(after.observed_at))).toBe(false);
    expect({ ...after, observed_at: before.observed_at }).toEqual(before);
    await page.goto(`/projects/${project}`);
    await page
      .getByRole("button", { name: "Sales handovers", exact: true })
      .click();
    await expect(
      page.getByText(lead.need_summary, { exact: true }),
    ).toBeVisible();
    await capture("04-native-project-receiving");
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: "Sales handovers", exact: true }),
    ).toBeFocused();
  });

  await test.step("Delivery follow-up returns to a new Lead with the same owner, due date and Project link", async () => {
    await page
      .getByRole("button", { name: "Sales handovers", exact: true })
      .click();
    await page
      .getByRole("link", { name: "Record a customer need for Sales review" })
      .click();
    await expect(page.getByLabel("Linked record", { exact: true })).toHaveValue(
      project,
    );
    await page
      .getByLabel("Purpose / summary", { exact: true })
      .fill("SYN Review an additional growing area after delivery receiving");
    await page.getByLabel("Due date still needed", { exact: true }).uncheck();
    await page
      .getByLabel("Due date and time", { exact: true })
      .fill("2031-10-09T09:00");
    await page
      .getByRole("button", { name: "Create activity", exact: true })
      .click();
    await expect(page).toHaveURL(/\/work\/[a-f0-9-]+$/);
    followup = page.url().split("/").at(-1)!;
    const before = (await call(page, `activities/${followup}`)).items[0];
    await page
      .getByLabel("I reviewed existing Sales records for this customer need")
      .check();
    await page
      .getByRole("link", { name: "Create Lead and return for link review" })
      .click();
    await page
      .getByLabel("Lead title", { exact: true })
      .fill(`SYN Returned need from ${lead.id}`);
    await page.getByRole("button", { name: "Save lead", exact: true }).click();
    await expect(page).toHaveURL(
      new RegExp(`/work/${followup}\\?sales_kind=Lead`),
    );
    returnedLead = new URL(page.url()).searchParams.get("sales_candidate")!;
    await page
      .getByLabel("I reviewed existing Sales records for this customer need")
      .check();
    await page
      .getByRole("button", { name: "Compare Sales link", exact: true })
      .click();
    await page
      .getByLabel("Reason for Sales link", { exact: true })
      .fill("SYN new need keeps its reviewed delivery provenance");
    await capture("05-returned-sales-comparison");
    await page
      .getByRole("button", { name: "Link reviewed Sales record", exact: true })
      .click();
    await page
      .getByRole("link", {
        name: "Review this Activity as the Lead’s next action",
      })
      .click();
    const planned = page.waitForResponse(
      (result) =>
        result.request().method() === "POST" &&
        new URL(result.url()).pathname ===
          `/api/v1/crm/leads/${returnedLead}/next-action`,
    );
    await page.getByRole("button", { name: "Save", exact: true }).click();
    expect((await planned).ok()).toBe(true);
    const after = (await call(page, `activities/${followup}`)).items[0];
    expect(after.owner_id).toBe(before.owner_id);
    expect(after.due_at).toBe(before.due_at);
    expect(after.status).toBe(before.status);
    expect(after.links).toEqual(expect.arrayContaining(before.links));
    expect(
      (await call(page, `crm/leads/${returnedLead}`)).next_activity.id,
    ).toBe(followup);
    expect((await call(page, `crm/leads/${lead.id}`)).deal.id).toBe(deal);
    await capture("06-returned-lead");
  });

  await test.step("Current restricted identity cannot read the joined commercial records", async () => {
    await call(page, "local-session", { profile: "assigned-technician" });
    for (const path of [
      `crm/leads/${lead.id}`,
      `estimating/estimates/${estimate}`,
      `sales/handovers/${wonHandover}`,
    ]) {
      const denied = await page.request.get(`/api/v1/${path}`);
      expect([403, 404]).toContain(denied.status());
      expect(await denied.text()).not.toContain(lead.title);
    }
    await call(page, "local-session", { profile: "coordinator" });
  });
  expect(errors).toEqual([]);
  await writeFile(
    info.outputPath("entry-records.json"),
    JSON.stringify(
      {
        application_baseline:
          process.env.PPO_SOURCE_HEAD ??
          execFileSync("git", ["rev-parse", "HEAD"], {
            encoding: "utf8",
          }).trim(),
        project: info.project.name,
        lead: lead.id,
        deal,
        estimatingHandover,
        workspace,
        revision,
        estimate,
        quote,
        wonHandover,
        deliveryProject: project,
        followup,
        returnedLead,
        operations,
        scope:
          "Synthetic HTTP preparation plus browser handovers; human acceptance pending",
      },
      null,
      2,
    ),
  );
});
