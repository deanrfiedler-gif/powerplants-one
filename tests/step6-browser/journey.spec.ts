import {
  test,
  expect,
  chromium,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { serviceJourney } from "../helpers/service-journey";
import {
  prepareReturnVisit,
  completeReturnVisit,
  type ReturnSource,
  type PreparedReturn,
} from "../helpers/quality-return";
import { call, capture, identity } from "../helpers/quality-browser";
import {
  createReadiness,
  prepareStart,
  verifyStart,
  prepareOriginals,
  verifyOriginals,
  offlineRows,
  type OfflineProof,
} from "../helpers/step6-offline";
import {
  publishReturnPolicy,
  amendReturn,
  resolveReturn,
  changePreparation,
} from "../helpers/step6-policy";

const config = localConfig();
expect(config.database_name).toBe("ppo_synthetic_test");
const root = resolve(process.env.PPO_STEP6_DIRECTORY!);
expect(root.startsWith(resolve(process.cwd()))).toBe(false);
const phase = process.env.PPO_STEP6_PHASE;
expect([
  "prepare",
  "publish",
  "resolve",
  "rollback",
  "finish",
  "history",
]).toContain(phase);
const hash = (v: string | Buffer) =>
  createHash("sha256").update(v).digest("hex");
type Saved = {
  source: ReturnSource;
  prepared: PreparedReturn;
  offline: OfflineProof;
  start: Awaited<ReturnType<typeof prepareStart>>;
  worker: string;
  policy?: Awaited<ReturnType<typeof publishReturnPolicy>>;
};
const statePath = join(root, "private", "journey.json");
async function save(value: Saved) {
  await writeFile(statePath, JSON.stringify(value, null, 2));
}
async function persistent(info: TestInfo, name: string) {
  const mobile = info.project.name.startsWith("mobile");
  return chromium.launchPersistentContext(join(root, "private", name), {
    channel: "chrome",
    headless: true,
    baseURL: config.origin,
    viewport: mobile
      ? { width: 390, height: 844 }
      : { width: 1440, height: 1000 },
    isMobile: mobile,
    hasTouch: mobile,
    locale: "en-AU",
    timezoneId: "UTC",
  });
}
async function worker(page: Page) {
  const registration = await page.evaluate(async () => {
    const r = await navigator.serviceWorker.getRegistration("/offline/");
    return { active: r?.active?.scriptURL, state: r?.active?.state };
  });
  expect(registration.state).toBe("activated");
  return hash(await (await page.request.get("/offline/sw.js")).body());
}
async function lifecycle(page: Page, prior: string, info: TestInfo) {
  await page.goto("/offline/index.html");
  await expect(page.locator("#workspace")).toBeVisible();
  const current = await worker(page);
  await page.evaluate(async () =>
    (await navigator.serviceWorker.getRegistration("/offline/"))!.update(),
  );
  if (current !== prior) {
    await page.waitForFunction(
      async () =>
        !!(await navigator.serviceWorker.getRegistration("/offline/"))?.waiting,
    );
    await capture(page, info, "step6-worker-waiting");
    await page.goto("/");
    await page.waitForFunction(async () => {
      const r = await navigator.serviceWorker.getRegistration("/offline/");
      return !r?.waiting && !r?.installing && r?.active?.state === "activated";
    });
    await page.goto("/offline/index.html");
  } else {
    expect(
      await page.evaluate(
        async () =>
          !!(await navigator.serviceWorker.getRegistration("/offline/"))
            ?.waiting,
      ),
    ).toBe(false);
  }
  return {
    previous_worker_sha256: prior,
    served_worker_sha256: current,
    result:
      current === prior
        ? "Unchanged worker; ordinary update check, no activation manufactured"
        : "New worker waited; final controlled client left before ordinary activation",
  };
}
async function held(page: Page, aid: string, info: TestInfo) {
  await call(page, "local-session", { profile: "second-technician" });
  await page.goto(`/my-jobs/${aid}`);
  await expect(page.getByText(/Scheduling policy hold/).first()).toBeVisible();
  const job = (await call(page, `my-jobs/${aid}`)).items[0];
  expect(job.attendance).toBeNull();
  expect(job.readiness.component_ready).toBe(false);
  await page
    .getByLabel("Start context", { exact: true })
    .fill("SYN explicit current hold refusal; no attendance inferred");
  const response = page.waitForResponse(
    (r) =>
      r.url().endsWith(`/appointments/${aid}/start`) &&
      r.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Record my actual start", exact: true })
    .click();
  const refused = await response;
  expect(refused.status()).toBe(422);
  expect((await refused.json()).code).toBe("StartBlocked");
  await capture(page, info, "step6-current-start-held");
}
test.afterAll(closeDatabase);
test(`Step 6 ${phase}: retained continuous service and compatible recovery`, async ({
  page,
}, info) => {
  // Starting a process is not HTTP readiness. The operator separately records
  // ownership/release; wait for that compiled listener before any business call.
  await expect
    .poll(
      async () => {
        try {
          return (await page.request.get("/")).ok();
        } catch {
          return false;
        }
      },
      { timeout: 60000 },
    )
    .toBe(true);
  await mkdir(join(root, "private"), { recursive: true });
  await mkdir(join(root, "review"), { recursive: true });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  if (phase === "prepare") {
    const first = await persistent(info, "initial-profile");
    let source: ReturnSource;
    try {
      const primary = first.pages()[0];
      primary.setDefaultTimeout(15000);
      primary.setDefaultNavigationTimeout(60000);
      const result = await serviceJourney(
        { page: primary, context: first },
        info,
        true,
      );
      source = result.source;
      await writeFile(
        join(root, "private", "initial-originals.json"),
        JSON.stringify(result.originals),
      );
    } finally {
      await first.close();
    }
    await call(page, "local-session", { profile: "coordinator" });
    await page.goto(`/service/reports/${source!.report_id}`);
    const prepared = await prepareReturnVisit(page, info, source!);
    await identity(page, "coordinator");
    await createReadiness(page);
    const startContext = await persistent(info, "start-profile");
    let start: Saved["start"];
    try {
      const startPage = startContext.pages()[0];
      await call(startPage, "local-session", { profile: "second-technician" });
      start = await prepareStart(startPage, prepared.aid);
    } finally {
      await startContext.close();
    }
    const context = await persistent(info, "return-profile");
    try {
      const offlinePage = context.pages()[0];
      offlinePage.setDefaultTimeout(15000);
      await call(offlinePage, "local-session", {
        profile: "second-technician",
      });
      const offline = await prepareOriginals(offlinePage, prepared.aid);
      await context.setOffline(false);
      const sw = await worker(offlinePage);
      await save({
        source: source!,
        prepared,
        offline,
        start: start!,
        worker: sw,
      });
      await capture(offlinePage, info, "step6-before-update-originals");
    } finally {
      await context.close();
    }
  } else {
    const saved: Saved = JSON.parse(await readFile(statePath, "utf8"));
    if (phase === "publish") {
      // Migration must add only the registered publication increments.
      expect(
        (
          await database().query(
            "SELECT max(version)::int v FROM public.ppo_migrations",
          )
        ).rows[0].v,
      ).toBe(54);
      await call(page, "local-session", { profile: "coordinator" });
      const before = (await call(page, `appointments/${saved.prepared.aid}`))
        .items[0];
      if (!saved.policy)
        saved.policy = await publishReturnPolicy(
          page,
          info,
          saved.source,
          saved.prepared,
        );
      const after = saved.policy.held;
      for (const key of [
        "scheduling_policy_id",
        "start_at",
        "end_at",
        "assignments",
        "schedule_version",
        "assignment_version",
      ])
        expect(after[key], key).toEqual(before[key]);
      await save(saved);
      await held(page, saved.prepared.aid, info);
      const context = await persistent(info, "return-profile");
      try {
        const offlinePage = context.pages()[0];
        const transition = await lifecycle(offlinePage, saved.worker, info);
        saved.worker = transition.served_worker_sha256;
        const rows = await verifyOriginals(offlinePage, saved.offline);
        await capture(offlinePage, info, "step6-update-original-recovery");
        await writeFile(
          join(root, "private", "recovered-rows.json"),
          JSON.stringify(rows),
        );
        await writeFile(
          join(root, "review", "worker-update.json"),
          JSON.stringify(transition, null, 2),
        );
      } finally {
        await context.close();
      }
      const startContext = await persistent(info, "start-profile");
      try {
        const row = await verifyStart(
          startContext.pages()[0],
          saved.start,
          "StartBlocked",
        );
        await writeFile(
          join(root, "private", "held-start.json"),
          JSON.stringify(row),
        );
      } finally {
        await startContext.close();
      }
      await save(saved);
    } else if (phase === "resolve") {
      await call(page, "local-session", { profile: "coordinator" });
      await page.goto(`/service/appointments/${saved.prepared.aid}`);
      saved.prepared = await amendReturn(page, saved.prepared);
      const resolution = await resolveReturn(
        page,
        info,
        saved.prepared.aid,
        true,
      );
      await writeFile(
        join(root, "private", "resolution.json"),
        JSON.stringify(resolution),
      );
      const job = (await call(page, `appointments/${saved.prepared.aid}`))
        .items[0];
      expect(job.scheduling_policy_id).toBe(
        saved.policy!.held.scheduling_policy_id,
      );
      await changePreparation(page, saved.source, saved.prepared.aid);
      await page.goto(`/service/appointments/${saved.prepared.aid}`);
      await expect(page.getByText(/Stale/).first()).toBeVisible();
      await held(page, saved.prepared.aid, info);
      await save(saved);
    } else if (phase === "rollback") {
      await held(page, saved.prepared.aid, info);
      await call(page, "local-session", {
        profile: "scheduling-policy-publisher",
      });
      // The rollback release has the real C26 parser and authority, though its
      // earlier PL-04 interface does not offer the Step 5 publication editor.
      const receipt = await call(
        page,
        "schedule/policy-publications",
        saved.policy!.original,
      );
      expect(receipt).toEqual(saved.policy!.receipt);
      const context = await persistent(info, "return-profile");
      try {
        const offlinePage = context.pages()[0];
        const transition = await lifecycle(offlinePage, saved.worker, info);
        const rows = await verifyOriginals(offlinePage, saved.offline);
        const earlier = JSON.parse(
          await readFile(join(root, "private", "recovered-rows.json"), "utf8"),
        );
        for (const original of saved.offline.originals.filter(
          (o) => o.command === "FieldReadiness" && o.schema_version === 1,
        ))
          expect(
            rows.find((r) => r.original.operation_id === original.operation_id)!
              .status.receipt,
          ).toEqual(
            earlier.find(
              (r: { original: WireId }) =>
                r.original.operation_id === original.operation_id,
            ).status.receipt,
          );
        await capture(offlinePage, info, "step6-rollback-retained");
        await writeFile(
          join(root, "review", "worker-rollback.json"),
          JSON.stringify(transition, null, 2),
        );
      } finally {
        await context.close();
      }
      const startContext = await persistent(info, "start-profile");
      try {
        await verifyStart(startContext.pages()[0], saved.start);
      } finally {
        await startContext.close();
      }
    } else if (phase === "finish") {
      await call(page, "local-session", { profile: "coordinator" });
      await page.goto(`/service/appointments/${saved.prepared.aid}`);
      await resolveReturn(page, info, saved.prepared.aid, false);
      await identity(page, "second-technician");
      const completed = await completeReturnVisit(
        page,
        info,
        saved.source,
        saved.prepared,
      );
      await writeFile(
        join(root, "review", "completed-return.json"),
        JSON.stringify(completed, null, 2),
      );
      const context = await persistent(info, "return-profile");
      try {
        const offlinePage = context.pages()[0];
        await offlinePage.goto("/offline/index.html");
        expect((await offlineRows(offlinePage)).map((r) => r.original)).toEqual(
          saved.offline.originals,
        );
      } finally {
        await context.close();
      }
    } else {
      const completed = JSON.parse(
        await readFile(join(root, "review", "completed-return.json"), "utf8"),
      );
      await call(page, "local-session", { profile: "second-technician" });
      await page.goto(`/my-jobs/${saved.source.appointment_id}`);
      await expect(
        page.getByText(/SYN corrected finding/).first(),
      ).toBeVisible();
      await page.goto(`/service/reports/${saved.source.report_id}`);
      await expect(
        page.getByRole("heading", { name: /Revision 2 · Issued/ }),
      ).toBeVisible();
      await identity(page, "assigned-technician");
      await page.goto(`/my-jobs/${completed.appointment_id}`);
      await expect(
        page.getByRole("heading", {
          name: "Saved evidence and corrections",
          exact: true,
        }),
      ).toBeVisible();
      expect(
        (await call(page, `my-jobs/${completed.appointment_id}`)).items[0]
          .attendance,
      ).toBeNull();
      await capture(page, info, "step6-after-restart-next-technician-history");
      await page.goto(`/service/reports/${completed.report_id}`);
      await expect(
        page.getByRole("heading", { name: /Revision 1 · Issued/ }),
      ).toBeVisible();
      const report = (await call(page, `reports/${completed.report_id}`))
        .items[0];
      expect(report.responses).toEqual([]);
      expect(report.work_order.status).toBe("Authorised");
      await identity(page, "coordinator");
      expect(
        (await call(page, `reports/${saved.source.report_id}`)).items[0]
          .responses[0].response,
      ).toBe("AcceptedWithReservations");
      for (const [path, sha256] of Object.entries({
        ...completed.preserved_outputs,
        ...completed.return_outputs,
      })) {
        if (path.startsWith("finance/")) continue;
        const r = await page.request.get(`/api/v1/${path}`);
        expect(r.ok()).toBe(true);
        expect(hash(await r.body())).toBe(sha256);
      }
      await identity(page, "finance-reconciler");
      const finance = await call(
        page,
        `finance/handoffs/${saved.source.finance.handoff_id}`,
      );
      expect(finance.handoff).toEqual(saved.prepared.priorFinance.handoff);
      expect(finance.targets).toEqual(saved.prepared.priorFinance.targets);
      for (const [path, sha256] of Object.entries(
        saved.prepared.priorFinanceBytes,
      )) {
        const r = await page.request.get(`/api/v1/${path}`);
        expect(r.ok()).toBe(true);
        expect(hash(await r.body())).toBe(sha256);
      }
      const originalContext = await persistent(info, "initial-profile");
      try {
        const originalPage = originalContext.pages()[0];
        await call(originalPage, "local-session", {
          profile: "assigned-technician",
        });
        await originalPage.goto("/offline/index.html");
        await originalPage
          .getByRole("button", { name: "Verify identity online", exact: true })
          .click();
        await expect(originalPage.locator("#notice")).toContainText(
          "Identity verified",
        );
        const originals = JSON.parse(
          await readFile(
            join(root, "private", "initial-originals.json"),
            "utf8",
          ),
        );
        expect(
          (await offlineRows(originalPage)).map((r) => r.original),
        ).toEqual(originals);
        await expect(originalPage.locator("#queue .status")).toHaveText(
          Array(5).fill("Server accepted and saved"),
        );
      } finally {
        await originalContext.close();
      }
    }
  }
  expect(errors).toEqual([]);
});
type WireId = { operation_id: string };
