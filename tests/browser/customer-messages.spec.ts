import { test, expect, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { destinations } from "../../src/shell/navigation";
import {
  ecActor,
  ecCompany,
  ecMessage,
  ecQueue,
  ecWorkspace,
} from "../helpers/customer-messages-fixture";
import type { MessageDetail } from "../../src/communications/ui-model";
const root = "/email/customer-messages",
  captures = "tmp/customer-messages-captures";
test.setTimeout(180000);
async function setup(
  page: Page,
  items: MessageDetail[] = [
    ecMessage(1),
    ecMessage(2),
    ecMessage(3, "Held"),
    ecMessage(4, "Failed"),
    ecMessage(5, "OutcomeUnknown"),
    ecMessage(6, "Sent"),
  ],
) {
  await mkdir(captures, { recursive: true });
  const posts: { path: string; body: Record<string, unknown> }[] = [];
  const state = {
    items,
    failQueue: false,
    failDetail: false,
    loseResponse: false,
    staleCommand: false,
    switchMode: {
      DispatchNotice: "Synthetic",
      DelayNotice: "Synthetic",
    } as Record<string, string>,
    switchVersion: { DispatchNotice: 1, DelayNotice: 1 } as Record<
      string,
      number
    >,
    switchReasons: {} as Record<string, string>,
    posts,
  };
  await page.route(/^https:\/\//, (r) => r.abort());
  await page.route("**/api/v1/**", (r) =>
    r.fulfill({
      json: {
        items: [],
        observed_at: "2026-10-13T23:00:00Z",
        completeness: "Complete",
      },
    }),
  );
  await page.route("**/api/v1/local-session", (r) =>
    r.fulfill({
      json: {
        actor_id: ecActor,
        workspace_id: ecWorkspace,
        display_name: "SYN Sasha Cole",
      },
    }),
  );
  await page.route("**/api/v1/shell/context", (r) =>
    r.fulfill({
      json: {
        display_name: "SYN Sasha Cole",
        preference_scope: "ec04-fixture",
        actions: [],
        navigation: destinations.map((d) => d.id),
        can_preview: true,
        companies: [{ id: ecCompany, name: "SYN Powerplants" }],
        working_company_id: ecCompany,
      },
    }),
  );
  await page.route("**/api/v1/customer-email-templates?*", (r) =>
    r.fulfill({
      json: {
        classes: ["DispatchNotice", "DelayNotice"].map((message_class) => ({
          message_class,
          current: { version: 3 },
        })),
      },
    }),
  );
  await page.route("**/api/v1/customer-communications/**", async (r) => {
    const path = new URL(r.request().url()).pathname;
    if (r.request().method() === "POST") {
      const body = r.request().postDataJSON();
      posts.push({ path, body });
      if (state.staleCommand) {
        state.staleCommand = false;
        const message = state.items.find((m) => path.includes(m.id))!;
        message.version++;
        message.subject = "SYN corrected source subject";
        return r.fulfill({
          status: 409,
          json: {
            code: "VersionConflict",
            message: "Message changed; read the current version.",
          },
        });
      }
      if (state.loseResponse) {
        state.loseResponse = false;
        return r.abort("failed");
      }
      if (path.endsWith("switches")) {
        state.switchMode[body.message_class] = body.mode;
        state.switchVersion[body.message_class]++;
        state.switchReasons[body.message_class] = body.reason;
      } else {
        const m = state.items.find((m) => path.includes(m.id))!;
        m.version++;
        m.state = path.endsWith("confirm")
          ? "Queued"
          : path.endsWith("withdraw")
            ? "Withdrawn"
            : "Sent";
        m.history.push({
          version: m.version,
          state: m.state,
          action: path.endsWith("confirm")
            ? "Confirm"
            : path.endsWith("withdraw")
              ? "Withdraw"
              : "Reconcile",
          hold_reason: null,
          display_state: m.state,
          provider_message_id: null,
          actor: "SYN Sasha Cole",
          reason: body.reason,
          evidence: "Synthetic action recorded; delivery is not confirmed.",
          occurred_at: "2026-10-13T23:01:00.000Z",
        });
        m.actions = {
          ...m.actions,
          confirm: false,
          withdraw: false,
          reconcile: false,
        };
      }
      return r.fulfill({ json: { state: "Confirmed", record_version: 2 } });
    }
    if (path.endsWith("queue"))
      return state.failQueue
        ? r.fulfill({ status: 503, json: { message: "Queue unavailable" } })
        : r.fulfill({ json: ecQueue(state.items) });
    if (path.endsWith("switches"))
      return r.fulfill({
        json: {
          company_id: ecCompany,
          channel: "Synthetic",
          can_switch: true,
          classes: ["DispatchNotice", "DelayNotice"].map(
            (message_class, i) => ({
              message_class,
              code: `M${i + 1}`,
              label: i ? "Delay notice" : "Dispatch notice",
              review: "Factual",
              mode: state.switchMode[message_class],
              version: state.switchVersion[message_class],
              reason: state.switchReasons[message_class] ?? null,
              recorded_by: state.switchReasons[message_class]
                ? "SYN Sasha Cole"
                : null,
              recorded_at: state.switchReasons[message_class]
                ? "2026-10-13T23:12:00.000Z"
                : null,
            }),
          ),
        },
      });
    const m = state.items.find((m) => path.endsWith(m.id));
    return state.failDetail
      ? r.fulfill({
          status: 404,
          json: { message: "Message unavailable", code: "RecordUnavailable" },
        })
      : r.fulfill({ json: m });
  });
  return state;
}
test("EC04-B01 accepted views and four-width queue, snapshot and confirmation captures", async ({
  page,
}) => {
  await setup(page);
  await mkdir(captures, { recursive: true });
  for (const width of [1440, 1024, 390, 320]) {
    await page.setViewportSize({ width, height: width < 781 ? 844 : 900 });
    await page.goto(root + "?view=all");
    await expect(page.locator("#ppo-customer-messages")).toBeVisible();
    const list = page.locator(
      width < 781 ? ".cm-phone-list" : ".cm-desktop-grid",
    );
    await expect(
      list.getByText("Sent (simulated) · delivery not confirmed"),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({ path: `${captures}/queue-${width}.png` });
    await page.goto(`${root}?view=to-send&message=${ecMessage(1).id}`);
    await expect(page.locator(".cm-email")).toContainText(
      "To stop these emails",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({ path: `${captures}/message-${width}.png` });
    await page
      .getByRole("button", { name: "Confirm and send", exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Confirm and send",
      exact: true,
    });
    await expect(dialog).toContainText("Named sender: SYN Sasha Cole");
    await expect(dialog).toContainText(ecMessage(1).content_hash!);
    await page.screenshot({ path: `${captures}/confirm-${width}.png` });
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Confirm and send", exact: true }),
    ).toBeFocused();
  }
});
test("EC04-B02 named confirm is always a dialog, optional note and uncertain replay survive reload", async ({
  page,
}) => {
  const state = await setup(page, [ecMessage(1)]);
  state.loseResponse = true;
  await page.goto(`${root}/${ecMessage(1).id}`);
  await page
    .getByRole("button", { name: "Confirm and send", exact: true })
    .click();
  expect(state.posts).toHaveLength(0);
  await page
    .getByRole("dialog", { name: "Confirm and send", exact: true })
    .getByRole("button", { name: "Confirm and send", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Check original result", exact: true }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: "Check original result", exact: true })
    .click();
  await expect(page.locator(".cm-readiness")).toContainText(
    "Queued (simulated)",
  );
  expect(state.posts).toHaveLength(2);
  expect(state.posts[1]).toEqual(state.posts[0]);
  expect(state.posts[0].body.reason).toBe(
    "Named sender confirmed the exact synthetic customer message.",
  );
});
test("EC04-B03 held, failed and unknown keep content and never offer resend; reconcile only", async ({
  page,
}) => {
  const state = await setup(page);
  for (const n of [3, 4, 5]) {
    await page.goto(`${root}/${ecMessage(n).id}`);
    await expect(page.locator(".cm-email")).toContainText("motor M-4");
    await expect(
      page.getByRole("button", { name: /Confirm and send|Resend/i }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Open follow-up", exact: true }),
    ).toBeVisible();
    if (n !== 5)
      await expect(page.locator(".cm-email")).toHaveAttribute(
        "data-dimmed",
        "true",
      );
    await page.screenshot({
      path: `${captures}/${n === 3 ? "held" : n === 4 ? "failed" : "unknown"}-1440.png`,
    });
  }
  await page
    .getByRole("button", { name: "Check Sent Items", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Check Sent Items",
    exact: true,
  });
  await dialog
    .getByLabel("Reason", { exact: true })
    .fill("SYN check original hand-over");
  await dialog
    .getByRole("button", { name: "Check Sent Items", exact: true })
    .click();
  await expect(page.locator(".cm-readiness")).toContainText(
    "Sent (simulated) · delivery not confirmed",
  );
  expect(state.posts[0].path).toMatch(/reconcile$/);
  await page.getByRole("button", { name: /^History ·/ }).click();
  await page.screenshot({ path: `${captures}/history-1440.png` });
});
test("EC04-B04 withdrawal and class switch require their native reason and version", async ({
  page,
}) => {
  const state = await setup(page, [ecMessage(1)]);
  await page.goto(`${root}/${ecMessage(1).id}`);
  if ((page.viewportSize()?.width ?? 1440) < 781)
    await page.locator(".cm-phone-more summary").click();
  await page
    .getByRole("button", { name: "Withdraw", exact: true })
    .filter({ visible: true })
    .click();
  let dialog = page.getByRole("dialog", {
    name: "Withdraw message",
    exact: true,
  });
  await expect(
    dialog.getByRole("button", { name: "Confirm withdrawal" }),
  ).toBeDisabled();
  await dialog
    .getByLabel("Reason", { exact: true })
    .fill("SYN source corrected");
  await dialog.getByRole("button", { name: "Confirm withdrawal" }).click();
  await expect(page.locator(".cm-readiness")).toContainText("Withdrawn");
  expect(state.posts[0].body.expected_version).toBe(1);
  await page.goto(root + "?view=classes");
  await expect(
    page.getByRole("switch", { name: "Delay notice sending" }),
  ).toBeVisible();
  await page.screenshot({ path: `${captures}/classes-1440.png` });
  await page.getByRole("switch", { name: "Delay notice sending" }).click();
  dialog = page.getByRole("dialog", { name: "Turn off delay notice" });
  await expect(
    dialog.getByRole("button", { name: "Confirm switch change" }),
  ).toBeDisabled();
  await dialog.getByLabel("Reason (required)").fill("SYN pause delay notices");
  await page.screenshot({ path: `${captures}/switch-1440.png` });
  await dialog.getByRole("button", { name: "Confirm switch change" }).click();
  await expect(
    page.getByRole("switch", { name: "Delay notice sending" }),
  ).toHaveAttribute("aria-checked", "false");
  expect(state.posts.at(-1)?.body.reason).toBe("SYN pause delay notices");
  await expect(
    page.getByRole("switch", { name: "Dispatch notice sending" }),
  ).toHaveAttribute("aria-checked", "true");
  await expect(page.locator(".cm-class-change")).toContainText(
    "SYN pause delay notices",
  );
  await page.screenshot({ path: `${captures}/classes-off-1440.png` });
});
test("EC04-B05 send-duty denial and failed/restricted reads clear obsolete controls and counts", async ({
  page,
}) => {
  const detail = ecMessage(1);
  detail.actions = {
    ...detail.actions,
    confirm: false,
    withdraw: false,
    reconcile: false,
    duty: false,
  };
  const state = await setup(page, [detail]);
  await page.goto(`${root}/${detail.id}`);
  await expect(page.getByText(/View only · sending needs/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Confirm and send", exact: true }),
  ).toHaveCount(0);
  state.failDetail = true;
  await page
    .getByRole("button", { name: "Refresh message", exact: true })
    .click();
  await expect(page.locator(".business-error[role=alert]")).toContainText(
    "Message unavailable",
  );
  await expect(page.locator(".cm-email")).toHaveCount(0);
  await page.goto(root + "?view=all");
  await expect(
    page.locator(".cm-message-link").or(page.locator(".cm-phone-message")),
  ).toHaveCount(2);
  state.failQueue = true;
  await page.reload();
  await expect(page.locator(".business-error[role=alert]")).toContainText(
    "Queue unavailable",
  );
  await expect(page.locator(".cm-message-link,.cm-phone-message")).toHaveCount(
    0,
  );
});

test("EC04-B06 stale confirmation closes its dialog and reloads the exact current content", async ({
  page,
}) => {
  const state = await setup(page, [ecMessage(1)]);
  state.staleCommand = true;
  await page.goto(`${root}/${ecMessage(1).id}`);
  await page
    .getByRole("button", { name: "Confirm and send", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Confirm and send",
    exact: true,
  });
  await dialog
    .getByRole("button", { name: "Confirm and send", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator(".cm-email")).toContainText(
    "SYN corrected source subject",
  );
  await expect(page.locator(".business-error[role=alert]")).toContainText(
    "Message changed",
  );
  await expect(
    page.getByRole("button", { name: "Check original result", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Confirm and send", exact: true })
    .click();
  await expect(dialog).toContainText("SYN corrected source subject");
  await dialog
    .getByRole("button", { name: "Confirm and send", exact: true })
    .click();
  await expect(page.locator(".cm-readiness")).toContainText(
    "Queued (simulated)",
  );
  expect(state.posts.map((p) => p.body.expected_version)).toEqual([1, 2]);
  expect(state.posts[1].body.operation_id).not.toBe(
    state.posts[0].body.operation_id,
  );
});
test("EC04-B07 320px search/filter and follow-up views retain qualified states", async ({
  page,
}) => {
  await setup(page);
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto(root + "?view=follow-up");
  await expect(page.locator(".cm-phone-message")).toHaveCount(3);
  await expect(page.locator(".cm-phone-list")).toContainText(
    "Held · do not notify",
  );
  await expect(page.locator(".cm-phone-list")).toContainText("Outcome unknown");
  await page.screenshot({ path: `${captures}/follow-up-320.png` });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: `${captures}/follow-up-390.png` });
  await page.setViewportSize({ width: 320, height: 844 });
  await page
    .getByRole("button", { name: "Search and filter", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Search and filter",
    exact: true,
  });
  await page.screenshot({ path: `${captures}/filter-320.png` });
  await dialog
    .getByLabel("Search messages", { exact: true })
    .fill("no such synthetic subject");
  await dialog
    .getByRole("button", { name: "Show messages", exact: true })
    .click();
  await expect(page.locator(".cm-phone-message")).toHaveCount(0);
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(page.locator(".cm-phone-message")).toHaveCount(3);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("EC04-B08 phone record More exposes withdrawal and preserves the sticky action", async ({
  page,
}) => {
  const state = await setup(page, [ecMessage(1)]);
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto(`${root}/${ecMessage(1).id}`);
  const confirm = page.getByRole("button", {
    name: "Confirm and send",
    exact: true,
  });
  await expect(confirm).toBeVisible();
  const box = await confirm.boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(48);
  expect(box!.width).toBeGreaterThanOrEqual(288);
  await page.getByRole("button", { name: "More actions", exact: true }).click();
  await page
    .getByRole("menu", { name: "More actions", exact: true })
    .getByRole("menuitem", { name: "Withdraw", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Withdraw message",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await dialog
    .getByLabel("Reason", { exact: true })
    .fill("SYN phone withdrawal after review");
  await dialog
    .getByRole("button", { name: "Confirm withdrawal", exact: true })
    .click();
  await expect(page.locator(".cm-readiness")).toContainText("Withdrawn");
  expect(state.posts[0].path).toMatch(/withdraw$/);
});
