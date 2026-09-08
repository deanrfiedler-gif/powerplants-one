/** Dependency-free checks of the prototype's model/projections, not browser QA. */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const controls = new Map();
const listeners = new Map();
function node(id) {
  if (!controls.has(id))
    controls.set(id, {
      innerHTML: "",
      value: "",
      checked: false,
      focus() {},
      classList: { add() {}, remove() {} },
      addEventListener(type, fn) {
        listeners.set(id + ":" + type, fn);
      },
      querySelector: node,
      querySelectorAll() {
        return [];
      },
      showModal() {},
      close() {},
    });
  return controls.get(id);
}
const document = {
  querySelector: node,
  activeElement: { focus() {} },
  addEventListener(type, fn) {
    listeners.set("document:" + type, fn);
  },
};
const context = vm.createContext({
  document,
  window: { scrollTo() {} },
  setTimeout() {
    return 1;
  },
  clearTimeout() {},
  console,
});
vm.runInContext(
  fs.readFileSync(path.join(here, "fixtures.js"), "utf8") +
    "\n" +
    fs.readFileSync(path.join(here, "app.js"), "utf8"),
  context,
);
const run = (code) => vm.runInContext(code, context);
const click = (action, data = {}) =>
  listeners.get("document:click")({
    target: {
      closest() {
        return { dataset: { action, ...data } };
      },
    },
  });
const cases = [];
function check(name, fn) {
  fn();
  cases.push({ name, status: "passed" });
}
function reset() {
  click("confirm-reset");
}
const share = () =>
  run(
    "state.shared=[{thread:'irrigation',message:'m2',record:'opp-irrigation',actor:'jordan',attachment:false}]; threads[0].links=['opp-irrigation'];",
  );

check("Owner sees five Inbox conversations and one Sent conversation", () => {
  assert.equal(run("visibleThreads().filter(t=>t.folder==='Inbox').length"), 5);
  assert.equal(run("visibleThreads().filter(t=>t.folder==='Sent').length"), 1);
});
check("Record access alone grants no email rows or counts", () => {
  run("state.actor='jordan';state.record='opp-irrigation'");
  assert.equal(run("visibleThreads().length"), 0);
  assert(!run("record()").includes("scope confirmation"));
});
check("Explicit record linking does not share the conversation", () => {
  run("threads[0].links=['opp-irrigation']");
  assert.equal(run("visibleThreads().length"), 0);
});
check("A selected share reveals exactly one message", () => {
  share();
  assert.equal(run("visibleThreads().length"), 1);
  assert.equal(run("visibleMessages(threads[0]).length"), 1);
  assert.equal(run("visibleMessages(threads[0])[0].id"), "m2");
});
check("Unselected attachment filename is absent from recipient projection", () => {
  run("state.thread='irrigation'");
  assert(!run("conversation()").includes("Growing-area-sketch.txt"));
});
check("Explicit attachment inclusion permits its filename", () => {
  run("state.shared[0].attachment=true");
  assert(run("conversation()").includes("Growing-area-sketch.txt"));
});
check("Hidden earlier content cannot be found by recipient search", () => {
  run("state.query='two metres'");
  assert(run("mailResults()").includes("scope confirmation"));
  run("state.query='available space around'");
  assert(!run("mailResults()").includes('data-thread="irrigation"'));
});
check("Other linked record names do not leak through an allowed share", () => {
  run("threads[0].links.push('site-north')");
  assert(!run("conversation()").includes("North growing site"));
});
check("Revoked target access removes rows, content and attachment", () => {
  run("state.revoked=true");
  assert.equal(run("visibleThreads().length"), 0);
  assert(!run("conversation()").includes("Growing-area-sketch.txt"));
  assert(!run("record()").includes("scope confirmation"));
});
check("Restored target access respects the existing specific share", () => {
  run("state.revoked=false");
  assert.equal(run("visibleMessages(threads[0]).length"), 1);
});
check("Unlinking withdraws dependent shares without deleting the source", () => {
  run("state.actor='alex';state.thread='irrigation'");
  node("#dialog").querySelectorAll = () => [];
  click("save-links");
  assert.equal(run("state.shared.length"), 0);
  assert.equal(run("threads[0].messages.length"), 2);
});
check("Share command remains specific to one message and excludes attachments by default", () => {
  reset();
  run("state.thread='irrigation';threads[0].links=['opp-irrigation']");
  node("#share-message").value = "m2";
  node("#share-record").value = "opp-irrigation";
  node("#share-jordan").checked = true;
  node("#share-attachment").checked = false;
  click("save-share");
  assert.equal(run("state.shared.length"), 1);
  assert.equal(run("state.shared[0].attachment"), false);
  assert.equal(run("state.shared[0].message"), "m2");
});
check("Follow-up survives view changes once and appears as a separate internal agenda item", () => {
  node("#followup-title").value = "Confirm site visit details";
  node("#followup-due").value = "2026-09-09T09:00";
  node("#followup-record").value = "opp-irrigation";
  click("save-followup");
  run("navigate('calendar');state.day='2026-09-09'");
  assert(run("agendaEvents()").includes("Confirm site visit details"));
  assert.equal(run("allEvents().filter(e=>e.id==='followup-irrigation').length"), 1);
  run("state.thread='irrigation'");
  click("save-followup");
  assert.equal(run("allEvents().filter(e=>e.id==='followup-irrigation').length"), 1);
});
check("Entered follow-up text is escaped when rendered", () => {
  run(
    "threads[0].followup.title='<img src=x onerror=alert(1)>';state.actor='alex';state.thread='irrigation'",
  );
  assert(run("conversation()").includes("&lt;img"));
  assert(!run("conversation()").includes("<img src=x"));
});
check("Colleague agenda reveals Busy without event subject, location or people", () => {
  run("state.actor='jordan';state.day='2026-09-08'");
  const html = run("agendaEvents()");
  assert(html.includes("Busy"));
  assert(!html.includes("Irrigation scope review"));
  assert(!html.includes("Casey Rowan"));
  assert(!html.includes("Online meeting"));
});
check("Revoked availability disappears", () => {
  run("state.revoked=true");
  assert(!run("agendaEvents()").includes("Sales coordination"));
  assert(!run("agendaEvents()").includes("data-event"));
});
check("Expired and disconnected connections hide source content", () => {
  run("state.actor='alex';state.thread='irrigation';state.sync='expired'");
  assert(!run("mail()").includes("scope confirmation"));
  assert(!run("calendar()").includes("Irrigation scope review"));
  run("state.sync='disconnected'");
  assert(!run("record()").includes("scope confirmation"));
});
check("Reset restores fictional defaults", () => {
  reset();
  assert.equal(run("state.shared.length"), 0);
  assert.equal(run("threads[0].links.length"), 0);
  assert.equal(run("threads[0].followup"), null);
  assert.equal(run("state.sync"), "ready");
  assert.equal(run("state.actor"), "alex");
});
check("All screen render functions return complete labelled main content", () => {
  for (const view of ["email", "calendar", "record", "settings", "pilot"]) {
    run(`state.view='${view}';render()`);
    assert(node("#app").innerHTML.includes('id="main"'));
    assert(node("#app").innerHTML.includes("Synthetic prototype"));
  }
});
check("No external requests or browser persistence in prototype source", () => {
  const js = fs.readFileSync(path.join(here, "app.js"), "utf8");
  assert(!/\b(fetch|XMLHttpRequest|WebSocket|localStorage|sessionStorage|indexedDB)\b/.test(js));
});

const result = {
  suite: "EC r01 synthetic model and projection checks",
  browser_qa: false,
  server_security_test: false,
  cases,
};
console.log(JSON.stringify(result, null, 2));
if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(result, null, 2) + "\n");
