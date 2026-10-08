import assert from "node:assert/strict";
import { test } from "node:test";
import { guardBrowserNavigation, navigateWithReview, registerNavigationReview } from "../../src/components/navigation-intent";

function browser() {
  const href = "https://ppo.invalid/people/synthetic-contact";
  const navigation = Object.assign(new EventTarget(), {
    navigate: (url: string) => emit(url),
    traverseTo: () => emit("https://ppo.invalid/work", "traverse"),
    reload: () => emit(href, "reload"),
  });
  const window = Object.assign(new EventTarget(), { navigation });
  const replacements = { window, document: new EventTarget(), location: { href } };
  const originals = Object.keys(replacements).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  for (const [key, value] of Object.entries(replacements)) Object.defineProperty(globalThis, key, { configurable: true, value });
  function emit(url: string, navigationType = "push", hashChange = false) {
    const event = Object.assign(new Event("navigate", { cancelable: true }), {
      destination: { url, key: "synthetic-entry" }, navigationType, hashChange,
    });
    navigation.dispatchEvent(event);
    return event;
  }
  return {
    href, emit,
    unload: () => { const event = new Event("beforeunload", { cancelable: true }); window.dispatchEvent(event); return event; },
    restore: () => {
      for (const [key, descriptor] of originals) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else Reflect.deleteProperty(globalThis, key);
      }
    },
  };
}

test("current-page approval is consumed before later reload protection", () => {
  const b = browser(); let confirmations = 0;
  const release = guardBrowserNavigation(run => { confirmations++; run(); }, 10);
  try {
    navigateWithReview(() => b.emit(b.href));
    assert.equal(confirmations, 1);
    assert.equal(b.unload().defaultPrevented, true);
  } finally { release(); b.restore(); }
});

test("one approved route change cannot authorize a later unrelated navigation", () => {
  const b = browser(); let allow = true, confirmations = 0;
  const release = guardBrowserNavigation(run => { confirmations++; if (allow) run(); }, 10);
  try {
    navigateWithReview(() => b.emit("https://ppo.invalid/work"));
    allow = false;
    assert.equal(b.emit("https://ppo.invalid/finance/handoffs").defaultPrevented, true);
    assert.equal(confirmations, 2);
    assert.equal(b.unload().defaultPrevented, true);
  } finally { release(); b.restore(); }
});

test("retained same-record views and stronger recovery do not clear unload protection", () => {
  const b = browser(); let confirmations = 0;
  const release = guardBrowserNavigation(run => { confirmations++; run(); }, 10, ["view"]);
  const stronger = registerNavigationReview(() => {}, 1000);
  try {
    let navigated = false;
    navigateWithReview(() => { navigated = true; }, { href: `${b.href}?view=history` });
    assert.equal(navigated, false);
    stronger();
    navigateWithReview(() => b.emit(`${b.href}?view=history`), { href: `${b.href}?view=history` });
    assert.equal(confirmations, 0);
    assert.equal(b.unload().defaultPrevented, true);
  } finally { stronger(); release(); b.restore(); }
});

test("explicit reload approval permits one unload and cannot authorize later edits", () => {
  const b = browser();
  const release = guardBrowserNavigation(run => run(), 10);
  try {
    navigateWithReview(() => b.emit(b.href, "reload"));
    assert.equal(b.unload().defaultPrevented, false);
    assert.equal(b.unload().defaultPrevented, true);
  } finally { release(); b.restore(); }
});
