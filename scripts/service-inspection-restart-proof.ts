// Run checkpoint and verify around an externally managed, actual application and
// PostgreSQL restart. Both inputs and raw checkpoints belong outside the repository.
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { readFile, writeFile, mkdir, mkdtemp } from "node:fs/promises";
import { join, resolve, relative, isAbsolute } from "node:path";
import { tmpdir } from "node:os";
import { chromium, expect } from "@playwright/test";
import { database, closeDatabase } from "../src/platform/database";
import { localConfig } from "../src/platform/config";
import { canonical } from "../src/platform/operations";
const config = localConfig();
assert.equal(config.database_name, "ppo_synthetic_test");
const [mode, originalPath, directory] = process.argv.slice(2);
assert(["checkpoint", "verify", "zoom"].includes(mode));
assert(directory && isAbsolute(directory));
const output = resolve(directory),
  rel = relative(process.cwd(), output);
assert(
  rel.startsWith("..") || isAbsolute(rel),
  "Keep raw recovery evidence outside Git",
);
await mkdir(output, { recursive: true });
const original = JSON.parse(await readFile(originalPath, "utf8"));
const context = await chromium.launchPersistentContext(
  await mkdtemp(join(tmpdir(), "ppo-inspection-proof-")),
  {
    channel: "chrome",
    headless: true,
    viewport: { width: 1440, height: 1000 },
  },
);
const login = async (profile: string) => {
  const r = await context.request.post(
    config.origin + "/api/v1/local-session",
    { headers: { origin: config.origin }, data: { profile } },
  );
  assert.equal(r.status(), 200);
};
const get = async (path: string) => {
  const r = await context.request.get(config.origin + path);
  assert.equal(r.status(), 200);
  return r;
};
try {
  if (mode === "zoom") {
    const settings = await context.newPage();
    await settings.goto("chrome://settings/appearance");
    await settings.locator("#zoomLevel").selectOption("2");
    assert.equal(await settings.locator("#zoomLevel").inputValue(), "2");
    await login("coordinator");
    const page = await context.newPage();
    await page.goto(
      config.origin +
        "/service/inspections?appointment_id=" +
        original.appointment,
    );
    await page.getByRole("button", { name: /^Attempt 2 ·/ }).click();
    await expect(
      page.getByRole("heading", { name: "Submitted readings", exact: true }),
    ).toBeVisible();
    const geometry = await page.evaluate(() => ({
      innerWidth,
      innerHeight,
      devicePixelRatio,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    assert.equal(geometry.innerWidth, 720);
    assert.equal(geometry.devicePixelRatio, 2);
    assert.equal(geometry.scrollWidth, geometry.innerWidth);
    const detail = page.getByText(
      "Exact equipment, work scope, template and preparation",
      { exact: true },
    );
    await detail.focus();
    await page.keyboard.press("Enter");
    assert(await detail.evaluate((e) => e.parentElement?.hasAttribute("open")));
    await page.keyboard.press("Enter");
    assert(
      !(await detail.evaluate((e) => e.parentElement?.hasAttribute("open"))),
    );
    await expect(detail).toBeFocused();
    const bounds = await detail.boundingBox();
    assert(
      bounds &&
        bounds.x >= 0 &&
        bounds.x + bounds.width <= geometry.innerWidth + 1,
    );
    // Capture the actual viewport surface: fullPage screenshot clipping uses
    // CSS dimensions and can crop a browser-zoomed device-pixel image.
    const cdp = await context.newCDPSession(page);
    await page.bringToFront();
    const capture = await cdp.send("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: false,
    });
    await writeFile(
      join(output, "zoom-200.png"),
      Buffer.from(capture.data, "base64"),
    );
    await cdp.detach();
    await writeFile(
      join(output, "zoom.json"),
      JSON.stringify(
        {
          result: "Passed",
          actual_zoom: "200%",
          geometry,
          focused_detail_bounds: bounds,
          keyboard:
            "Native source details open/close with Enter and retain focus",
          limits:
            "Synthetic Chrome; owner/physical-device/screen-reader acceptance separate",
        },
        null,
        2,
      ),
    );
    await settings.locator("#zoomLevel").selectOption("1");
    const layouts = [];
    for (const width of [1440, 1024, 390, 320]) {
      await page.setViewportSize({
        width,
        height: width < 600 ? 844 : width === 1024 ? 768 : 1000,
      });
      await page.goto(
        config.origin +
          "/service/inspections?appointment_id=" +
          original.appointment +
          "&attempt_id=" +
          original.retest,
      );
      await expect(
        page.getByRole("heading", { name: "Submitted readings", exact: true }),
      ).toBeVisible();
      const layout = await page.evaluate(() => {
        const root = document.querySelector("#ppo-service-inspections")!;
        const nodes = new Set<Element>([
          document.scrollingElement!,
          root,
          ...root.querySelectorAll("*"),
        ]);
        for (let p = root.parentElement; p; p = p.parentElement) nodes.add(p);
        const owners = [...nodes]
          .filter(
            (e) =>
              e.scrollHeight > e.clientHeight + 1 &&
              (e === document.scrollingElement ||
                ["auto", "scroll"].includes(getComputedStyle(e).overflowY)),
          )
          .map((e) => e.id || e.tagName);
        return {
          width: innerWidth,
          height: innerHeight,
          scroll_width: document.documentElement.scrollWidth,
          owners,
        };
      });
      assert.equal(layout.width, width);
      assert.equal(layout.scroll_width, width);
      assert.equal(layout.owners.length, 1);
      layouts.push(layout);
      await page
        .getByRole("heading", { name: "Inspection review", exact: true })
        .scrollIntoViewIfNeeded();
      await page.screenshot({
        path: join(output, `review-overview-${width}.png`),
      });
      await page
        .getByRole("heading", { name: "Submitted readings", exact: true })
        .scrollIntoViewIfNeeded();
      await page.screenshot({
        path: join(output, `review-readings-${width}.png`),
      });
    }
    await writeFile(
      join(output, "layouts.json"),
      JSON.stringify(layouts, null, 2),
    );
    console.log(
      "200% browser zoom, readable reflow and keyboard detail focus passed.",
    );
  } else {
    const checkpointPath = join(output, "checkpoint.json");
    const before =
      mode === "verify"
        ? JSON.parse(await readFile(checkpointPath, "utf8"))
        : null;
    const drafts: {
      profile: string;
      id: string;
      body: Record<string, unknown>;
      receipt: unknown;
    }[] = [];
    const capturePath = `/api/v1/my-jobs/${original.appointment}/inspections`;
    const post = async (body: Record<string, unknown>) => {
      const response = await context.request.post(config.origin + capturePath, {
        headers: { origin: config.origin },
        data: body,
      });
      assert([200, 201].includes(response.status()), await response.text());
      return response.json();
    };
    // Two real assigned actors keep independent drafts of the same procedure.
    // Their accepted save originals are replayed unchanged after the real restart.
    for (const profile of ["second-technician", "assigned-technician"]) {
      await login(profile);
      const retained = before?.data.drafts.find(
        (d: { profile: string }) => d.profile === profile,
      );
      if (retained) {
        drafts.push({ ...retained, receipt: await post(retained.body) });
      } else {
        const view = await (await get(capturePath)).json(),
          target = view.targets[0],
          template = view.catalogue.find(
            (t: { procedure_key: string }) =>
              t.procedure_key === "syn-pressure",
          );
        const preview = await (
          await get(
            capturePath +
              "/preview?" +
              new URLSearchParams({
                template_id: template.id,
                scope_item_id: target.scope_item_id,
                asset_id: target.asset_id,
              }),
          )
        ).json();
        const id = randomUUID(),
          common = () => ({
            schema_version: 1,
            operation_id: randomUUID(),
            reason: "SYN retained draft restart proof",
          });
        await post({
          ...common(),
          action: "open",
          id,
          template_id: template.id,
          scope_item_id: target.scope_item_id,
          asset_id: target.asset_id,
          binding_hash: preview.binding_hash,
        });
        const body = {
          ...common(),
          action: "save",
          attempt_id: id,
          expected_version: 1,
          occurred_at: new Date().toISOString(),
          findings: "SYN durable personal draft across actual process restart",
          instrument_ids: ["e9550000-0000-4000-8000-000000000003"],
          readings: preview.checks.map(
            (d: { key: string; check_type: string }) =>
              d.check_type === "Numeric"
                ? {
                    check_key: d.key,
                    state: "Recorded",
                    value: "221",
                    unit: "kPa",
                  }
                : { check_key: d.key, state: "Recorded", choice: "Clear" },
          ),
        };
        drafts.push({ profile, id, body, receipt: await post(body) });
      }
      const saved = await (await get(capturePath)).json();
      assert.equal(
        saved.attempts.find(
          (a: { row: { id: string } }) => a.row.id === drafts.at(-1)!.id,
        ).row.state,
        "Draft",
      );
    }
    const draftPage = await context.newPage();
    await draftPage.goto(
      config.origin +
        "/my-jobs/inspections?appointment_id=" +
        original.appointment +
        "&attempt_id=" +
        drafts.at(-1)!.id,
    );
    await expect(
      draftPage.getByLabel("SYN holding pressure reading", { exact: true }),
    ).toHaveValue("221");
    await expect(
      draftPage.getByText("Saved draft · version 3", { exact: true }),
    ).toBeVisible();
    await draftPage.screenshot({
      path: join(
        output,
        mode === "checkpoint" ? "draft-before.png" : "draft-after.png",
      ),
      fullPage: true,
    });
    const tables = [
      "inspection_attempts",
      "inspection_results",
      "inspection_evidence",
      "inspection_instrument_uses",
      "inspection_reviews",
      "inspection_defects",
      "inspection_defect_attempts",
      "service_inspection_bindings",
      "service_inspection_events",
      "service_inspection_outputs",
    ];
    const data: Record<string, unknown> = { drafts };
    for (const table of tables)
      data[table] = (
        await database().query(
          `SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text),'[]') AS rows FROM ppo.${table} t`,
        )
      ).rows[0].rows;
    await login("assigned-technician");
    data.receipt = await (
      await get("/api/v1/operations/" + original.submission.operation_id)
    ).json();
    const capture = await (
      await get("/api/v1/my-jobs/" + original.appointment + "/inspections")
    ).json();
    assert.equal(
      capture.attempts.find(
        (x: { row: { id: string } }) => x.row.id === original.first,
      ).row.submitted_hash,
      original.first_hash,
    );
    const files = [];
    for (const file of original.files) {
      await login("coordinator");
      const response = await get(file.href),
        bytes = await response.body(),
        hash = createHash("sha256").update(bytes).digest("hex");
      assert.equal(hash, file.sha256);
      assert.equal(bytes.length, file.bytes);
      files.push({ sha256: hash, bytes: bytes.length });
    }
    data.files = files;
    const db = (
      await database().query(
        "SELECT pg_postmaster_start_time() AS started,version() AS version",
      )
    ).rows[0];
    const identity = {
      build: (await readFile(".next/BUILD_ID", "utf8")).trim(),
      postgres_started: db.started,
      postgres: db.version,
      at: new Date().toISOString(),
    };
    if (mode === "checkpoint") {
      await writeFile(
        checkpointPath,
        JSON.stringify({ identity, data }, null, 2),
      );
      console.log(
        "Checkpoint retained exact inspection rows, original receipt and issued byte hashes.",
      );
    } else {
      assert.equal(canonical(data), canonical(before.data));
      assert.notEqual(
        String(db.started.toISOString()),
        before.identity.postgres_started,
        "Actual PostgreSQL restart required",
      );
      assert.equal(identity.build, before.identity.build);
      await writeFile(
        join(output, "restart.json"),
        JSON.stringify(
          {
            result: "Passed",
            before: before.identity,
            after: identity,
            tables: tables.length,
            exact_original_receipt: true,
            concurrent_personal_drafts: drafts.length,
            unchanged_draft_save_receipts: true,
            files,
            scope:
              "Actual app/PostgreSQL restart with unchanged compiled build; no offline inspection claim",
          },
          null,
          2,
        ),
      );
      console.log(
        "Actual PostgreSQL restart verified; exact rows, original receipt and issued bytes preserved.",
      );
    }
  }
} finally {
  await context.close();
  await closeDatabase();
}
