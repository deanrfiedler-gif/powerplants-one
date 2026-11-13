import { test, expect } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { crmReturnDiagnostics } from "../helpers/crm-return-diagnostics";

test("CRM return diagnostic artifact survives an actual Playwright test timeout", async ({}, info) => {
  const child = spawn(
    process.execPath,
    [
      "node_modules/@playwright/test/cli.js",
      "test",
      "--config=tests/helpers/crm-return-timeout.config.ts",
      `--output=${info.outputPath("timeout-child")}`,
    ],
    {
      cwd: process.cwd(),
      env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: "" },
    },
  );
  let output = "",
    errors = "";
  child.stdout.on("data", (data) => {
    output += data.toString();
  });
  child.stderr.on("data", (data) => {
    errors += data.toString();
  });
  const exit = await new Promise<number | null>((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", resolve);
  });
  expect(exit, errors).toBe(1);
  const report = JSON.parse(output);
  expect(report.stats.unexpected).toBe(1);
  const result = report.suites[0].specs[0].tests[0].results[0];
  expect(result.status).toBe("timedOut");
  const attachment = result.attachments.find(
    (a: { name: string }) => a.name === "CRM return navigation",
  );
  expect(attachment).toBeTruthy();
  const saved = JSON.parse(await readFile(attachment.path, "utf8"));
  expect(
    saved.events.some(
      (e: { event: string }) => e.event === "page-state-unavailable",
    ),
  ).toBe(true);
  expect(
    saved.browser.some((e: { event: string }) => e.event === "click-capture"),
  ).toBe(true);
  expect(
    saved.browser.some((e: { event: string }) => e.event === "click-settled"),
  ).toBe(true);
  await writeFile(info.outputPath("timeout-child-report.json"), output);
});

test("CRM return events already sent to Node survive page teardown before finish", async ({
  page,
}, info) => {
  const diagnostics = await crmReturnDiagnostics(
    page,
    info,
    "synthetic-return",
    "synthetic-opportunity",
  );
  await page.route("**/work/synthetic-return", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<a href="#" onclick="event.preventDefault()">Return to opportunity and plan follow-up</a><p>Private record text must not enter diagnostics</p>',
    }),
  );
  await page.goto("http://127.0.0.1:3000/work/synthetic-return");
  await page.getByRole("link").click();
  // Cancellation is sampled in the next browser task. Let that task run before
  // flushing delivery and destroying the page; flushing current promises alone
  // can race a click-settled callback that has not run yet (especially on mobile).
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    await (
      window as typeof window & {
        ppoCrmReturnDiagnostics: () => Promise<void>;
      }
    ).ppoCrmReturnDiagnostics();
  });
  await page.close();
  await diagnostics.finish();
  const text = await readFile(
    info.outputPath("crm-return-navigation.json"),
    "utf8",
  );
  const saved = JSON.parse(text);
  expect(
    saved.browser.some((e: { event: string }) => e.event === "click-capture"),
  ).toBe(true);
  expect(
    saved.browser.some(
      (e: { event: string; prevented: boolean }) =>
        e.event === "click-settled" && e.prevented,
    ),
  ).toBe(true);
  expect(
    saved.events.some(
      (e: { event: string }) => e.event === "page-state-unavailable",
    ),
  ).toBe(true);
  expect(text).not.toContain("Private record text");
  expect(text).not.toContain("http://");
});

test("CRM return browser diagnostics retain only bounded allowlisted metadata", async ({
  page,
}, info) => {
  const diagnostics = await crmReturnDiagnostics(
    page,
    info,
    "synthetic-return",
    "synthetic-opportunity",
  );
  await page.evaluate(async () => {
    const send = (
      window as typeof window & {
        ppoRecordCrmReturnEvent: (
          event: Record<string, unknown>,
        ) => Promise<void>;
      }
    ).ppoRecordCrmReturnEvent;
    await send({
      event: "https://private.invalid/secret",
      text: "private-secret",
    });
    for (let i = 0; i < 110; i++)
      await send({
        event: "layout-state",
        at_ms: i,
        link_width: Infinity,
        return_link: "private-secret",
        text: "private-secret",
        url: "https://private.invalid/secret",
      });
  });
  await page.close();
  await diagnostics.finish();
  const text = await readFile(
    info.outputPath("crm-return-navigation.json"),
    "utf8",
  );
  const saved = JSON.parse(text);
  expect(saved.browser).toHaveLength(100);
  expect(saved.browser[0]).toEqual({ event: "layout-state", at_ms: 0 });
  expect(text).not.toContain("private-secret");
  expect(text).not.toContain("private.invalid");
});
