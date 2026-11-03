import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  PhoneHeaderActions,
  PhoneHeaderLead,
  PhoneHeaderTitle,
  type PhoneHeaderModel,
} from "../../src/components/shell-phone-header";
import {
  createPhoneHeaderEntry,
  type PhoneHeaderConfig,
} from "../../src/shell/phone-header";

// Phone header amendment (PPO-SHELL-PHONE-HEADER-AMENDMENT-DEC, P2, P3, P4, P5, P8). The browser suites find the
// phone row's controls by these accessible names and classes, so the markup that carries them is pinned here
// without a browser: the shell draws the row, and a page only hands over its views, action, filter and record steps.
const noop = () => {};
const list = (
  config: Extract<PhoneHeaderModel, { type: "list" }>["config"] = null,
  extra: { count?: string } = {},
): PhoneHeaderModel => ({ type: "list", title: "My Work", config, ...extra });
const record = (
  config: Extract<PhoneHeaderModel, { type: "record" }>["config"] = null,
  back?: { href?: string; label: string },
): PhoneHeaderModel => ({
  type: "record",
  reference: "SYN-DEAL-0042",
  back,
  config,
});
const html = (element: Parameters<typeof renderToStaticMarkup>[0]) =>
  renderToStaticMarkup(element);

test("unchanged header labels dispatch to the latest page state, including an already-open record menu", () => {
  const calls: string[] = [];
  const config = (revision: string): PhoneHeaderConfig => {
    const run = (name: string) => () => {
      calls.push(`${revision}:${name}`);
    };
    return {
      chooseView: { open: run("view") },
      pageAction: { label: "Search", icon: "search", onSelect: run("action") },
      filter: { open: run("filter"), searchAndFilter: run("combined") },
      record: {
        previous: { label: "Previous", onSelect: run("previous") },
        next: { label: "Next", onSelect: run("next") },
        more: [{ label: "Edit", onSelect: run("edit") }],
      },
    };
  };
  const entry = createPhoneHeaderEntry("/records/one", config("old"));
  const shown = entry.config;
  const openMenuAction = shown.record!.more![0].onSelect;
  entry.update(config("current"));
  const opener = {} as HTMLElement;
  shown.chooseView!.open(opener);
  shown.pageAction!.onSelect(opener);
  shown.filter!.open(opener);
  shown.filter!.searchAndFilter!(opener);
  shown.record!.previous!.onSelect(opener);
  shown.record!.next!.onSelect(opener);
  openMenuAction(opener);
  assert.deepEqual(
    calls,
    ["view", "action", "filter", "combined", "previous", "next", "edit"].map(
      (name) => `current:${name}`,
    ),
  );
});

test("P2 a page without views shows its name as a plain title, not a button", () => {
  const markup = html(createElement(PhoneHeaderTitle, { model: list() }));
  assert.match(
    markup,
    /^<span class="ppo-phone-title"><span class="ppo-phone-title-text">My Work<\/span><\/span>$/,
  );
  assert.doesNotMatch(markup, /<button/);
});

test("P2 P8 a page with views shows a chooser that announces the current view, with its count", () => {
  const chooseView = { open: noop, expanded: false, controls: "mw-menu" };
  const plain = html(
    createElement(PhoneHeaderTitle, { model: list({ chooseView }) }),
  );
  assert.match(
    plain,
    /<button type="button" class="ppo-phone-title ppo-view-chooser" aria-label="Choose view\. Current view: My Work"/,
  );
  assert.match(plain, /aria-haspopup="dialog"/);
  assert.match(plain, /aria-expanded="false"/);
  assert.match(plain, /aria-controls="mw-menu"/);
  assert.match(plain, /<span class="ppo-phone-title-text">My Work<\/span>/);
  const counted = html(
    createElement(PhoneHeaderTitle, {
      model: list({ chooseView }, { count: "12" }),
    }),
  );
  assert.match(counted, /aria-label="Choose view\. Current view: My Work, 12"/);
  assert.match(counted, /<span class="ppo-phone-count">12<\/span>/);
});

test("P4 the Menu button leads the row and says when notifications are unread", () => {
  const read = html(
    createElement(PhoneHeaderLead, {
      model: list(),
      unread: false,
      menuOpen: false,
    }),
  );
  assert.match(
    read,
    /<button id="shell-phone-menu" type="button" class="ppo-top-action ppo-phone-lead ppo-phone-menu" aria-label="Menu"/,
  );
  assert.match(read, /aria-haspopup="dialog"/);
  assert.match(read, /aria-expanded="false"/);
  assert.doesNotMatch(read, /ppo-phone-dot/);
  const unread = html(
    createElement(PhoneHeaderLead, {
      model: list(),
      unread: true,
      menuOpen: true,
    }),
  );
  assert.match(unread, /aria-label="Menu, unread notifications"/);
  assert.match(unread, /aria-expanded="true"/);
  assert.match(unread, /<span class="ppo-phone-dot" aria-hidden="true">/);
});

test("P3 a record page leads with Back to its list and shows its reference, which never gets the truncating title text", () => {
  const linked = html(
    createElement(PhoneHeaderLead, {
      model: record(null, { href: "/sales/leads", label: "Back to Leads" }),
      unread: false,
      menuOpen: false,
    }),
  );
  assert.match(
    linked,
    /<a [^>]*class="ppo-top-action ppo-phone-lead ppo-phone-back"[^>]*href="\/sales\/leads"/,
  );
  assert.match(linked, /aria-label="Back to Leads"/);
  assert.doesNotMatch(linked, /shell-phone-menu/);
  const plain = html(
    createElement(PhoneHeaderLead, {
      model: record(),
      unread: false,
      menuOpen: false,
    }),
  );
  assert.match(
    plain,
    /<button type="button" class="ppo-top-action ppo-phone-lead ppo-phone-back" aria-label="Back"/,
  );
  const reference = html(createElement(PhoneHeaderTitle, { model: record() }));
  assert.equal(
    reference,
    '<span class="ppo-phone-title ppo-phone-reference">SYN-DEAL-0042</span>',
  );
  const position = html(
    createElement(PhoneHeaderTitle, {
      model: record({ record: { position: "1 of 3 to send" } }),
    }),
  );
  assert.equal(
    position,
    '<span class="ppo-phone-title ppo-phone-reference ppo-phone-position">1 of 3 to send</span>',
  );
});

test("P2 P5 a record page with views keeps its Choose view sheet: the reference becomes the chooser", () => {
  const chooseView = {
    open: noop,
    expanded: false,
    controls: "ppo-job-pack-menu",
  };
  const markup = html(
    createElement(PhoneHeaderTitle, { model: record({ chooseView }) }),
  );
  assert.match(
    markup,
    /<button type="button" class="ppo-phone-title ppo-view-chooser ppo-phone-reference" aria-label="Choose view\. Current record: SYN-DEAL-0042"/,
  );
  assert.match(markup, /aria-controls="ppo-job-pack-menu"/);
  assert.match(
    markup,
    /<span class="ppo-phone-title-text">SYN-DEAL-0042<\/span>/,
  );
});

test("P3 P4 a record row always has More actions: Open menu, then Conversations with its unread count, then the page's own actions", () => {
  const conversations = {
    name: "Conversations, 3 unread",
    title: "Conversations · 3 with new messages",
    badge: "3",
    count: 3,
    current: false,
  };
  // No Menu button on a record row (P3), so More is the way to the menu even when the page registers nothing.
  const bare = html(
    createElement(PhoneHeaderActions, {
      model: record(),
      place: "after",
      conversations,
    }),
  );
  assert.match(
    bare,
    /aria-label="More actions" aria-haspopup="menu" aria-expanded="false"/,
  );
  assert.match(
    bare,
    /<button type="button" role="menuitem">Open menu<\/button>/,
  );
  assert.match(
    bare,
    /role="menuitem"[^>]*aria-label="Conversations, 3 unread"|aria-label="Conversations, 3 unread"[^>]*role="menuitem"/,
  );
  assert.match(bare, /ppo-phone-more-count" aria-hidden="true">3<\/span>/);
  assert.ok(
    bare.indexOf("Open menu") < bare.indexOf("Conversations, 3 unread"),
  );
  assert.doesNotMatch(bare, /role="separator"|Page guide/);
  // A viewer without conversation.read gets only the menu item.
  const none = html(
    createElement(PhoneHeaderActions, {
      model: record(),
      place: "after",
      conversations: null,
    }),
  );
  assert.match(none, /Open menu/);
  assert.doesNotMatch(none, /Conversations/);
  // Nothing new: the name carries no count and no count is drawn.
  const quiet = html(
    createElement(PhoneHeaderActions, {
      model: record(),
      place: "after",
      conversations: {
        name: "Conversations",
        title: "Conversations",
        badge: null,
        current: true,
      },
    }),
  );
  assert.match(quiet, /aria-label="Conversations"/);
  assert.match(quiet, /aria-current="page"/);
  assert.doesNotMatch(quiet, /ppo-phone-more-count/);
  // The page's own actions come after a rule that follows the two shell entries.
  const withActions = html(
    createElement(PhoneHeaderActions, {
      model: record({ record: { more: [{ label: "Edit", onSelect: noop }] } }),
      place: "after",
      conversations,
    }),
  );
  assert.ok(
    withActions.indexOf("Conversations, 3 unread") <
      withActions.indexOf('role="separator"'),
  );
  assert.ok(
    withActions.indexOf('role="separator"') < withActions.indexOf(">Edit<"),
  );
  // A list row has no More: its Menu button is the way in.
  assert.doesNotMatch(
    html(
      createElement(PhoneHeaderActions, {
        model: list(),
        place: "after",
        conversations,
      }),
    ),
    /More actions/,
  );
});

test("P2 P5 a list page may add one page action before Conversations and Filter after it, with a dot when a filter is applied", () => {
  const config = {
    pageAction: { label: "Search", icon: "search" as const, onSelect: noop },
    filter: { open: noop, applied: true },
  };
  const before = html(
    createElement(PhoneHeaderActions, { model: list(config), place: "before" }),
  );
  assert.match(
    before,
    /class="ppo-top-action ppo-phone-page-action" aria-label="Search"/,
  );
  const after = html(
    createElement(PhoneHeaderActions, { model: list(config), place: "after" }),
  );
  assert.match(
    after,
    /class="ppo-top-action ppo-phone-filter" aria-label="Filter, a filter is applied"/,
  );
  assert.match(after, /<span class="ppo-phone-dot" aria-hidden="true">/);
  const clear = html(
    createElement(PhoneHeaderActions, {
      model: list({ filter: { open: noop } }),
      place: "after",
    }),
  );
  assert.match(clear, /aria-label="Filter"/);
  assert.doesNotMatch(clear, /ppo-phone-dot/);
  assert.equal(
    html(createElement(PhoneHeaderActions, { model: list(), place: "before" })),
    "",
  );
  assert.equal(
    html(createElement(PhoneHeaderActions, { model: list(), place: "after" })),
    "",
  );
});

test("P7 a search page action and Filter combine into Search and filter at 320 px", () => {
  const config = {
    pageAction: {
      label: "Search",
      icon: "search" as const,
      search: true,
      onSelect: noop,
    },
    filter: { open: noop },
  };
  const before = html(
    createElement(PhoneHeaderActions, { model: list(config), place: "before" }),
  );
  assert.match(before, /ppo-phone-page-action ppo-phone-combines/);
  const after = html(
    createElement(PhoneHeaderActions, { model: list(config), place: "after" }),
  );
  assert.match(after, /ppo-phone-filter ppo-phone-combines/);
  assert.match(
    after,
    /class="ppo-top-action ppo-phone-search-filter" aria-label="Search and filter"/,
  );
});

test("P3 P7 a record page steps to the previous and next record and keeps the rest in More actions", () => {
  const config = {
    record: {
      previous: { label: "Previous record", onSelect: noop },
      next: { label: "Next record", onSelect: noop, disabled: true },
      more: [{ label: "Edit", onSelect: noop }],
    },
  };
  assert.equal(
    html(
      createElement(PhoneHeaderActions, {
        model: record(config),
        place: "before",
      }),
    ),
    "",
  );
  const after = html(
    createElement(PhoneHeaderActions, {
      model: record(config),
      place: "after",
    }),
  );
  assert.match(after, /aria-label="Previous record"/);
  assert.match(
    after,
    /ppo-phone-next" aria-label="Next record" title="Next record" disabled=""/,
  );
  assert.match(
    after,
    /aria-label="More actions" aria-haspopup="menu" aria-expanded="false"/,
  );
  assert.match(after, /<button type="button" role="menuitem">Edit<\/button>/);
  // 320 px moves the usable steps into the More menu, and a disabled step is not offered there.
  assert.match(
    after,
    /class="ppo-phone-narrow-item">Previous record<\/button>/,
  );
  assert.doesNotMatch(after, /ppo-phone-narrow-item">Next record/);
});

test("record overlays use their current Back callback instead of navigating away", () => {
  const calls: string[] = [];
  const entry = createPhoneHeaderEntry("/estimating/cost-sources", {
    record: {
      back: {
        label: "Back to cost sources",
        onSelect: () => calls.push("old"),
      },
    },
  });
  const retained = entry.config.record!.back!;
  entry.update({
    record: {
      back: {
        label: "Back to cost sources",
        onSelect: () => calls.push("current"),
      },
    },
  });
  retained.onSelect({} as HTMLElement);
  assert.deepEqual(calls, ["current"]);
  const markup = html(
    createElement(PhoneHeaderLead, {
      model: record(entry.config, { label: "Parent", href: "/estimating" }),
      unread: false,
      menuOpen: false,
    }),
  );
  assert.match(markup, /aria-label="Back to cost sources"/);
  assert.doesNotMatch(markup, /href=/);
});
