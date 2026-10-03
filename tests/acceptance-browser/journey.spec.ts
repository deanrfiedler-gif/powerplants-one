import { test, expect, chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { localConfig } from "../../src/platform/config";
import { serviceJourney } from "../helpers/service-journey";
import {
  prepareReturnVisit,
  completeReturnVisit,
  type ReturnSource,
  type PreparedReturn,
} from "../helpers/quality-return";
import { call, identity, capture } from "../helpers/quality-browser";
import { privatePath } from "../../scripts/recovery";

const config = localConfig();
expect(config.database_name).toBe("ppo_synthetic_test");
const root = resolve(process.env.PPO_ACCEPTANCE_DIRECTORY!);
const phase = process.env.PPO_ACCEPTANCE_PHASE;
expect(["initial", "prepare", "finish", "history"]).toContain(phase);
type Saved = {
  source: ReturnSource;
  originals: unknown[];
  prepared?: PreparedReturn;
  completed?: Awaited<ReturnType<typeof completeReturnVisit>>;
};

test("Current Field Work narrative keeps original and separate attendance through explicit restart phases", async ({}, info) => {
  // Reuse the existing canonical-path, symlink and Git-ancestor refusal.
  await privatePath(root, false);
  await mkdir(join(root, "private"), { recursive: true });
  await mkdir(join(root, "review"), { recursive: true });
  const path = join(root, "private", "journey.json");
  const context = await chromium.launchPersistentContext(
    join(
      root,
      "private",
      phase === "initial" || phase === "history"
        ? "original-profile"
        : "return-profile",
    ),
    {
      channel: "chrome",
      headless: true,
      baseURL: config.origin,
      viewport: { width: 1440, height: 1000 },
      locale: "en-AU",
      timezoneId: "UTC",
    },
  );
  context.setDefaultTimeout(15000);
  const page = context.pages()[0];
  page.setDefaultNavigationTimeout(60000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    let saved: Saved;
    if (phase === "initial") {
      // Refuse to replace the retained successful checkpoint.
      await expect(readFile(path)).rejects.toThrow();
      saved = await serviceJourney({ page, context }, info, true, true, true);
      await writeFile(path, JSON.stringify(saved, null, 2), { flag: "wx" });
    } else {
      saved = JSON.parse(await readFile(path, "utf8"));
      await call(page, "local-session", { profile: "coordinator" });
      await page.goto(`/service/reports/${saved.source.report_id}`);
      if (phase === "prepare") {
        expect(saved.prepared).toBeUndefined();
        saved.prepared = await prepareReturnVisit(page, info, saved.source);
      } else if (phase === "finish") {
        expect(saved.prepared).toBeTruthy();
        expect(saved.completed).toBeUndefined();
        await identity(page, "second-technician");
        saved.completed = await completeReturnVisit(
          page,
          info,
          saved.source,
          saved.prepared!,
        );
      } else {
        expect(saved.completed).toBeTruthy();
        const prepared = saved.prepared!,
          completed = saved.completed!;
        for (const profile of ["assigned-technician", "second-technician"]) {
          await identity(page, profile);
          await page.goto(`/my-jobs/${saved.source.appointment_id}`);
          await expect(
            page.getByRole("button", {
              name: "Record my actual start",
              exact: true,
            }),
          ).toHaveCount(0);
          const job = (
            await call(page, `my-jobs/${saved.source.appointment_id}`)
          ).items[0];
          expect(Boolean(job.attendance)).toBe(
            profile === "assigned-technician",
          );
          await capture(page, info, `closed-original-${profile}`);
        }
        await page.goto(`/service/reports/${completed.report_id}`);
        const report = (await call(page, `reports/${completed.report_id}`))
          .items[0];
        expect(report.responses).toEqual([]);
        expect(report.work_order.status).toBe("Authorised");
        await identity(page, "coordinator");
        const old = (await call(page, `reports/${saved.source.report_id}`))
          .items[0];
        for (const key of ["revisions", "responses", "reviews", "issues"])
          expect(old[key]).toEqual(prepared.historicReport[key]);
        for (const [path, hash] of Object.entries({
          ...completed.preserved_outputs,
          ...completed.return_outputs,
        })) {
          if (path.startsWith("finance/")) continue;
          const r = await page.request.get(`/api/v1/${path}`);
          expect(r.ok()).toBe(true);
          expect(
            createHash("sha256")
              .update(await r.body())
              .digest("hex"),
          ).toBe(hash);
        }
        await identity(page, "finance-reconciler");
        const finance = await call(
          page,
          `finance/handoffs/${saved.source.finance.handoff_id}`,
        );
        expect(finance.handoff).toEqual(prepared.priorFinance.handoff);
        expect(finance.targets).toEqual(prepared.priorFinance.targets);
        for (const [path, hash] of Object.entries(prepared.priorFinanceBytes)) {
          const r = await page.request.get(`/api/v1/${path}`);
          expect(r.ok()).toBe(true);
          expect(
            createHash("sha256")
              .update(await r.body())
              .digest("hex"),
          ).toBe(hash);
        }
        await identity(page, "assigned-technician");
        await page.goto(`/my-jobs/${completed.appointment_id}`);
        expect(
          (await call(page, `my-jobs/${completed.appointment_id}`)).items[0]
            .attendance,
        ).toBeNull();
        await capture(page, info, "next-technician-history");
        await page.goto("/offline/index.html");
        await page
          .getByRole("button", { name: "Verify identity online", exact: true })
          .click();
        await expect(page.locator("#notice")).toContainText(
          "Identity verified",
        );
        const rows = await page.evaluate(async () => {
          const path = "/offline/modules/offline/store.js";
          const store = await import(path);
          return store.queue((await store.ownership()).owner);
        });
        expect(rows.map((r: { original: unknown }) => r.original)).toEqual(
          saved.originals,
        );
        await expect(page.locator("#queue .status")).toHaveText(
          Array(5).fill("Server accepted and saved"),
        );
      }
      await writeFile(path, JSON.stringify(saved, null, 2));
    }
    await writeFile(
      join(root, "review", `${phase}.json`),
      JSON.stringify(
        {
          phase,
          at: new Date().toISOString(),
          source: saved.source,
          completed: saved.completed,
          page_errors: errors,
        },
        null,
        2,
      ),
    );
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});
