/* Synthetic interaction model only. Real authorisation belongs on the PPO server. */
"use strict";
const icons = {
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
  calendar:
    '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18M8 15h2M14 15h2"/>',
  record:
    '<rect x="4" y="4" width="16" height="17" rx="2"/><path d="M8 3v3h8V3M8 11h8M8 16h5"/>',
  settings:
    '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="currentColor"/><circle cx="15" cy="17" r="3" fill="currentColor"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4M12 17h.01"/>',
  search: '<circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/>',
  refresh:
    '<path d="M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0 1 12-2l2 3M4 16l2 3a7 7 0 0 0 12-2"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 15v2"/>',
  link: '<path d="m10 13 4-4M8 16l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0M16 8l1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0" transform="translate(0 -1) scale(.95)"/>',
  arrow: '<path d="M19 12H5m6-6-6 6 6 6"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  clip: '<path d="m8 13 7-7a3 3 0 0 1 4 4L9 20a5 5 0 0 1-7-7L13 2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  people:
    '<circle cx="9" cy="8" r="3"/><path d="M3 20v-3a6 6 0 0 1 12 0v3M17 4a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  sent: '<path d="m3 3 19 9-19 9 4-9-4-9Zm4 9h15"/>',
  check: '<path d="m5 12 4 4L20 5"/>',
  warning: '<path d="m12 3 10 18H2L12 3Zm0 6v5m0 3h.01"/>',
  external: '<path d="M14 3h7v7m0-7L10 14M10 4H4v16h16v-6"/>',
};
const icon = (n) =>
  `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${icons[n] || icons.record}</svg>`;
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const clone = (v) => JSON.parse(JSON.stringify(v));
let threads = clone(EC_FIXTURES.threads);
const state = {
  view: "calendar",
  actor: "alex",
  folder: "Inbox",
  filter: "all",
  query: "",
  thread: null,
  record: "opp-irrigation",
  recordTab: "emails",
  sync: "ready",
  shared: [],
  revoked: false,
  day: "2026-09-08",
  privateBusy: true,
  calendarView: "day",
  calendarSource: "all",
};
const app = document.querySelector("#app");
const dialog = document.querySelector("#dialog");
let dialogReturn = null,
  noticeTimer;
const button = (label, action, extra = "", cls = "") =>
  `<button type="button" class="${cls}" data-action="${action}" ${extra}>${label}</button>`;
const badge = (text, n = "lock", cls = "") =>
  `<span class="badge ${cls}">${icon(n)}${esc(text)}</span>`;
const isOwner = () => state.actor === "alex";
const recordById = (id) => EC_FIXTURES.records.find((r) => r.id === id);
const canRecord = (id) => {
  const r = recordById(id);
  return (
    !!r &&
    r.readers.includes(state.actor) &&
    !(state.actor === "jordan" && state.revoked)
  );
};
const canShare = (thread, message) =>
  state.shared.some(
    (s) =>
      s.thread === thread.id &&
      s.message === message.id &&
      s.actor === state.actor &&
      canRecord(s.record),
  );
const visibleMessages = (t) =>
  isOwner() ? t.messages : t.messages.filter((m) => canShare(t, m));
const visibleThreads = () => threads.filter((t) => visibleMessages(t).length);
const visibleLinks = (t) =>
  t.links.filter(
    (id) =>
      canRecord(id) &&
      (isOwner() ||
        state.shared.some(
          (s) =>
            s.thread === t.id && s.record === id && s.actor === state.actor,
        )),
  );
const isShared = (t, m) =>
  state.shared.some((s) => s.thread === t.id && s.message === m.id);
const currentThread = () => threads.find((t) => t.id === state.thread);
const empty = (title, text, action = "") =>
  `<div class="empty">${icon("mail")}<h2>${esc(title)}</h2><p>${esc(text)}</p>${action}</div>`;
function toast(text) {
  const el = document.querySelector("#notice");
  el.textContent = text;
  el.classList.add("visible");
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => el.classList.remove("visible"), 4500);
}
function navigate(view) {
  state.view = view;
  state.thread = null;
  state.query = "";
  state.filter = "all";
  render();
  window.scrollTo(0, 0);
  document.querySelector("#main")?.focus();
}
function nav() {
  return [
    ["email", "mail", "Email"],
    ["calendar", "calendar", "Calendar"],
    ["record", "record", "Records"],
    ["settings", "settings", "Settings"],
  ]
    .map(([v, i, l]) =>
      button(
        icon(i) + `<span>${l}</span>`,
        "nav",
        `data-view="${v}" ${state.view === v ? 'aria-current="page"' : ""}`,
        state.view === v ? "active" : "",
      ),
    )
    .join("");
}
function shell(content) {
  const title = {
    email: "Email",
    calendar: "Calendar",
    record: "Customer records",
    settings: "Email & Calendar settings",
    pilot: "Microsoft pilot",
  }[state.view];
  return `<div class="shell"><nav class="rail" aria-label="Prototype navigation"><div class="brand"><img src="../../standards/ui-assets/powerplants-logo-green-white.png" alt="Powerplants"></div>${nav()}<div class="push">${button(icon("help") + "<span>Pilot plan</span>", "nav", 'data-view="pilot"', state.view === "pilot" ? "active" : "")}</div></nav><header class="topbar"><div class="title"><h1>${title}</h1><span class="mobile-env environment">Synthetic prototype</span></div><span class="environment">Synthetic prototype · No Microsoft connection</span><div class="identity"><label class="meta" for="actor">Preview as</label><select id="actor"><option value="alex" ${isOwner() ? "selected" : ""}>Alex · Owner</option><option value="jordan" ${!isOwner() ? "selected" : ""}>Jordan · Colleague</option></select></div></header>${content}<nav class="bottom-nav" aria-label="Mobile prototype navigation">${nav()}</nav></div>`;
}
function syncbar() {
  const labels = {
    ready: "Sample mailbox · Refreshed 8 Sept 2026, 9:45 am AEST",
    paused: "Demo sync paused · Sample data may be out of date",
    expired: "Demo connection expired · Reconnect to refresh",
    error: "Demo sync unavailable · Last sample refresh 9:45 am",
    disconnected: "Demo mailbox disconnected · Cached email hidden",
  };
  return `<div class="syncbar ${state.sync === "ready" ? "" : "problem"}"><span>${esc(labels[state.sync])}</span><span class="hide-phone">${isOwner() ? "Read-only Outlook preview" : "Selected shared messages only"}</span></div>`;
}
function sidebar() {
  return `<aside class="sidebar" aria-label="Email folders"><h2>${isOwner() ? "Alex’s mailbox" : "Shared with Jordan"}</h2><p class="meta account">${isOwner() ? "alex@ppo.example" : "Only explicitly shared messages"}</p>${["Inbox", "Sent"].map((f) => button(icon(f === "Inbox" ? "mail" : "sent") + esc(f) + `<span>${visibleThreads().filter((t) => t.folder === f).length}</span>`, "folder", `data-folder="${f}"`, "folder " + (state.folder === f ? "active" : ""))).join("")}<div class="section-label">Workspace</div>${button(icon("record") + "Linked records", "nav", 'data-view="record"', "folder")}${button(icon("calendar") + "Calendar", "nav", 'data-view="calendar"', "folder")}<p class="hint">${icon("lock")} Linking a record keeps the email private. Sharing is a separate choice.</p></aside>`;
}
function mail() {
  if (["disconnected", "expired"].includes(state.sync))
    return `<main id="main" tabindex="-1" class="page">${empty(state.sync === "expired" ? "Reconnect required" : "Mailbox disconnected", "The sample mailbox is hidden. Reconnect the demo from Settings.", button("Open settings", "nav", 'data-view="settings"', "primary"))}</main>`;
  if (state.thread)
    return `<main id="main" tabindex="-1" class="mail-main"><div class="toolbar">${button(icon("arrow") + "Back to email", "back-mail")}<span class="grow"></span>${button(icon("settings") + "Privacy settings", "nav", 'data-view="settings"', "quiet")}</div>${syncbar()}${conversation()}</main>`;
  return `<div class="workspace">${sidebar()}<main id="main" tabindex="-1" class="mail-main"><div class="toolbar"><div class="view-title"><h2>${isOwner() ? state.folder : "Shared messages"}</h2></div><select id="folder-mobile" class="mobile-folders" aria-label="Email folder">${["Inbox", "Sent"].map((f) => `<option ${f === state.folder ? "selected" : ""}>${f}</option>`).join("")}</select>${button(icon("refresh"), "refresh", 'aria-label="Refresh sample email"', "icon-only")}</div><div class="toolbar"><div class="search">${icon("search")}<input id="search" type="search" value="${esc(state.query)}" placeholder="Search email" aria-label="Search email"></div><select id="mail-filter" class="filter" aria-label="Filter conversations"><option value="all">All conversations</option><option value="unlinked" ${state.filter === "unlinked" ? "selected" : ""}>Not linked</option><option value="followup" ${state.filter === "followup" ? "selected" : ""}>Follow-up planned</option></select></div>${syncbar()}<div id="mail-results">${mailResults()}</div><p class="prototype-note" style="padding:0 24px 20px">Fictional correspondence. Sending and Outlook changes are outside this first preview.</p></main></div>`;
}
function mailResults() {
  const rows = visibleThreads()
    .filter((t) => t.folder === state.folder)
    .filter(
      (t) =>
        state.filter === "all" ||
        (state.filter === "unlinked" && !visibleLinks(t).length) ||
        (state.filter === "followup" && isOwner() && !!t.followup),
    )
    .filter((t) => {
      const ms = visibleMessages(t);
      const terms = [t.subject, t.from, ...ms.map((m) => m.body)]
        .join(" ")
        .toLowerCase();
      return terms.includes(state.query.toLowerCase());
    });
  return rows.length
    ? `<div class="mail-head" aria-hidden="true"><span>Conversation</span><span>Subject & preview</span><span class="relation">Record / privacy</span><span>Date</span></div>${rows
        .map((t) => {
          const link = recordById(visibleLinks(t)[0]);
          return `<button type="button" class="mail-row" data-action="thread" data-thread="${t.id}" aria-label="Open ${esc(t.subject)}"><span class="from"><span class="avatar customer">${t.initials}</span><span class="grow"><span class="name">${esc(t.from)}</span><span class="meta" style="display:block">${esc(t.org)}</span></span></span><span class="content grow"><span class="subject" style="display:block">${esc(t.subject)} <span class="meta">${visibleMessages(t).length > 1 ? visibleMessages(t).length : ""}</span></span><span class="snippet" style="display:block">${esc(visibleMessages(t).at(-1).body.replace(/\n/g, " "))}</span></span><span class="relation">${badge(!isOwner() ? "Shared with you" : t.messages.some((m) => isShared(t, m)) ? "Selected messages shared" : "Private", !isOwner() || t.messages.some((m) => isShared(t, m)) ? "people" : "lock")}<span class="meta">${link ? esc(link.type) : "Not linked"}${isOwner() && t.followup ? " · Follow-up planned" : ""}</span></span><span class="when">${t.date}</span></button>`;
        })
        .join("")}`
    : empty(
        "No conversations to show",
        state.query || state.filter !== "all"
          ? "Try another search or filter."
          : "Messages shared with this account will appear here.",
      );
}
function conversation() {
  const t = currentThread();
  if (!t || !visibleMessages(t).length)
    return empty(
      "Email unavailable",
      "Your current preview account does not have access to this email.",
    );
  const links = visibleLinks(t);
  return `<div class="conversation"><section class="conversation-body"><div class="subject-line"><p class="meta">${esc(t.org)}</p><h2>${esc(t.subject)}</h2></div><div class="row wrap">${badge(isOwner() ? "Your mailbox" : "Selected messages shared with you", isOwner() ? "lock" : "people")}${badge(`${visibleMessages(t).length} message${visibleMessages(t).length === 1 ? "" : "s"}`, "mail")}${isOwner() && t.followup ? badge("Follow-up planned", "clock", "green") : ""}</div>${!isOwner() ? '<div class="spacer"></div><div class="callout">You can read only the messages explicitly shared with you. Earlier messages and future replies stay private.</div>' : ""}${visibleMessages(
    t,
  )
    .map(
      (m) =>
        `<article class="message"><div class="message-head"><span class="avatar ${m.from === "Alex Lee" ? "" : "customer"}">${esc(
          m.from
            .split(" ")
            .map((w) => w[0])
            .join(""),
        )}</span><div class="grow"><strong>${esc(m.from)}</strong><div class="addresses meta">${esc(m.email)}<br>To: ${esc(m.to)}</div></div><time>${esc(m.date)}</time></div><div class="body">${esc(m.body)}</div>${m.attachment && (isOwner() || state.shared.some((s) => s.thread === t.id && s.message === m.id && s.actor === state.actor && canRecord(s.record) && s.attachment)) ? button(icon("clip") + esc(m.attachment) + " · synthetic attachment", "attachment", `data-message="${m.id}"`, "attachment") : ""}<div class="message-footer">${badge(isShared(t, m) ? "Shared selection" : "Private", isShared(t, m) ? "people" : "lock")}${isOwner() && !t.personal ? button(icon("people") + (isShared(t, m) ? "Manage sharing" : "Share this message"), "share", `data-message="${m.id}"`, "quiet") : ""}</div></article>`,
    )
    .join(
      "",
    )}<div class="spacer"></div>${isOwner() ? '<div class="callout">Outlook owns the original messages. This read-only preview does not send replies or change read/unread status.</div>' : ""}</section><aside class="context" aria-label="Conversation context"><section class="context-section"><div class="row between"><h3>Linked records</h3>${isOwner() && !t.personal ? button(icon("plus"), "link", 'aria-label="Link a record"', "icon-only quiet") : ""}</div>${
    links.length
      ? links
          .map((id) => {
            const r = recordById(id);
            return button(
              `<span class="grow"><strong>${esc(r.title)}</strong><span class="meta" style="display:block">${esc(r.type)} · ${esc(r.ref)}</span></span>${icon("chevron")}`,
              "record",
              `data-record="${id}"`,
              "record-link",
            );
          })
          .join("")
      : '<p class="small muted">No record linked yet.</p>'
  }${isOwner() && !t.personal ? `<p class="small muted">${t.id === "irrigation" ? "Casey is linked to two opportunities. Choose the one this conversation concerns." : "Choose a permitted record to place this conversation in context."}</p>${button(icon("link") + (links.length ? "Manage record links" : "Choose a record"), "link", "", "record-link")}` : ""}${t.personal ? '<div class="callout warning">Personal correspondence. Filing and sharing are disabled for this sample.</div>' : ""}<p class="meta">Linking does not change who can read the email.</p></section><section class="context-section"><h3>Next action</h3>${isOwner() && t.followup ? `<div class="callout success"><strong>${esc(t.followup.title)}</strong><p>${esc(t.followup.owner)}<br>${esc(formatDue(t.followup.due))} AEST</p></div>` : isOwner() && !t.personal ? `<p class="small muted">Create a PPO follow-up with an owner and due date.</p>${button(icon("plus") + "Plan follow-up", "followup", "", "record-link")}` : '<p class="small muted">No follow-up details are available in this view.</p>'}<p class="meta">A follow-up does not send an invitation or reserve a service visit.</p></section><section class="context-section"><h3>Message privacy</h3><p class="small">${isOwner() ? "Private by default. Share selected messages with named, eligible colleagues." : "Access depends on the specific message share and current record access."}</p>${isOwner() && t.messages.some((m) => isShared(t, m)) ? button("Preview as Jordan", "preview-jordan", "", "record-link") : ""}</section></aside></div>`;
}
function formatDue(d) {
  if (!d) return "Date needed";
  const [date, time] = d.split("T");
  const [y, m, day] = date.split("-");
  const [h, min] = time.split(":");
  return `${Number(day)} ${["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"][Number(m) - 1]} ${y}, ${Number(h) % 12 || 12}:${min} ${Number(h) < 12 ? "am" : "pm"}`;
}
function record() {
  const records = EC_FIXTURES.records.filter((r) => canRecord(r.id));
  let r = recordById(state.record);
  if (!r || !canRecord(r.id)) r = records[0];
  if (!r)
    return `<main id="main" tabindex="-1" class="page">${empty("Record access unavailable", "This preview account has no current record access. Restore the demo access in Settings.")}</main>`;
  state.record = r.id;
  const linked = ["disconnected", "expired"].includes(state.sync)
    ? []
    : visibleThreads().filter((t) => visibleLinks(t).includes(r.id));
  return `<main id="main" tabindex="-1" class="page narrow"><div class="page-header"><div><p class="meta">${esc(r.type)} · ${esc(r.ref)}</p><h2>${esc(r.title)}</h2><p class="muted">${esc(r.org)}</p></div><label>View record<select id="record-select">${records.map((x) => `<option value="${x.id}" ${x.id === r.id ? "selected" : ""}>${esc(x.type)} · ${esc(x.title)}</option>`).join("")}</select></label></div>${r.planned ? '<div class="callout warning">Project record shown for design review. Projects J1 remains a separate runtime increment.</div>' : ""}<div class="panel"><dl class="record-summary"><div><dt>Owner</dt><dd>${esc(r.owner)}</dd></div><div><dt>Contact</dt><dd>${esc(r.contact || "Not selected")}</dd></div><div><dt>${r.stage ? "Sales stage" : "Record type"}</dt><dd>${esc(r.stage || r.type)}</dd></div></dl><div class="tabs" aria-label="Record views">${button("Emails", "record-tab", 'data-tab="emails" aria-pressed="' + (state.recordTab === "emails") + '"', state.recordTab === "emails" ? "active" : "")}${button("Details", "record-tab", 'data-tab="details" aria-pressed="' + (state.recordTab === "details") + '"', state.recordTab === "details" ? "active" : "")}</div>${state.recordTab === "details" ? `<div class="stack"><p>This synthetic record demonstrates the shared Email tab for a ${esc(r.type.toLowerCase())}.</p><dl class="definitions"><dt>Stable reference</dt><dd>${esc(r.ref)}</dd><dt>Email ownership</dt><dd>Originals remain in Microsoft Outlook.</dd><dt>Sharing</dt><dd>Record access and selected-message sharing are both required.</dd></dl></div>` : `<div class="row between"><h3>Conversations you can access</h3><span class="meta">${linked.length} conversation${linked.length === 1 ? "" : "s"}</span></div>${linked.length ? linked.map((t) => `<div class="email-card"><span class="avatar customer">${t.initials}</span><div class="grow"><strong>${esc(t.subject)}</strong><p>${esc(t.from)}</p>${badge(isOwner() ? "Your mailbox" : "Shared with you", isOwner() ? "lock" : "people")}</div>${button("Open email", "thread", `data-thread="${t.id}"`)}</div>`).join("") : empty("No emails available", "Only linked emails that you are permitted to read appear here.")}<p class="prototype-note">Private email subjects, previews, attachments and counts are not shown to other record viewers.</p>`}</div></main>`;
}
const sampleDay = "2026-09-08";
const utcDay = (day) => new Date(day + "T12:00:00Z");
const dateLabel = (day, options) =>
  utcDay(day).toLocaleDateString("en-AU", { timeZone: "UTC", ...options });
function shiftDay(day, amount) {
  const d = utcDay(day);
  d.setUTCDate(d.getUTCDate() + amount);
  return d.toISOString().slice(0, 10);
}
function weekDays(day) {
  const offset = (utcDay(day).getUTCDay() + 6) % 7;
  return Array.from({ length: 7 }, (_, i) => shiftDay(day, i - offset));
}
function minutesAt(time) {
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (!match) return null;
  return (
    ((Number(match[1]) % 12) + (match[3].toLowerCase() === "pm" ? 12 : 0)) *
      60 +
    Number(match[2])
  );
}
const hourLabel = (hour) => `${hour % 12 || 12} ${hour < 12 ? "AM" : "PM"}`;
function calendarEventsFor(day, applyFilter = true) {
  if (["disconnected", "expired"].includes(state.sync)) return [];
  let events = allEvents().filter((e) => e.day === day);
  if (!isOwner())
    events =
      state.privateBusy && !state.revoked
        ? events.filter((e) => e.source === "Outlook")
        : [];
  if (applyFilter && state.calendarSource !== "all")
    events = events.filter((e) => e.source === state.calendarSource);
  return events.sort(
    (a, b) =>
      minutesAt(a.start) - minutesAt(b.start) || a.id.localeCompare(b.id),
  );
}
function weekStrip() {
  return `<nav class="week-strip" aria-label="Choose a day">${weekDays(
    state.day,
  )
    .map((day) => {
      const count = calendarEventsFor(day).length;
      return button(
        `<span class="week-name">${dateLabel(day, { weekday: "short" }).slice(0, 1)}</span><span class="week-number">${utcDay(day).getUTCDate()}</span><span class="week-indicator ${count ? "has-events" : ""}" aria-hidden="true"></span>`,
        "calendar-day",
        `data-day="${day}" aria-label="${dateLabel(day, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}, ${count} ${isOwner() ? "items" : "busy periods"}" aria-pressed="${day === state.day}"`,
        "week-day " +
          (day === state.day ? "selected" : "") +
          (day === sampleDay ? " sample-day" : ""),
      );
    })
    .join("")}</nav>`;
}
function calendar() {
  if (["disconnected", "expired"].includes(state.sync))
    return `<main id="main" tabindex="-1" class="page">${empty(state.sync === "expired" ? "Reconnect required" : "Calendar disconnected", "Reconnect the sample mailbox from Settings.", button("Open settings", "nav", 'data-view="settings"', "primary"))}</main>`;
  const events = calendarEventsFor(state.day);
  return `<main id="main" tabindex="-1" class="calendar-page"><section class="calendar-surface" aria-label="${isOwner() ? "Alex’s calendar" : "Shared availability"}"><div class="calendar-controls"><div class="month-navigation">${button(icon("arrow"), "calendar-week", 'data-offset="-7" aria-label="Previous week"', "quiet icon-only")}${button(`<span>${dateLabel(state.day, { month: "long" })} <span class="month-year">${dateLabel(state.day, { year: "numeric" })}</span></span><span class="down-chevron">${icon("chevron")}</span>`, "calendar-date", 'aria-label="Choose calendar date"', "month-picker quiet")}${button(icon("chevron"), "calendar-week", 'data-offset="7" aria-label="Next week"', "quiet icon-only")}</div><div class="calendar-control-actions">${button("Sample day", "calendar-sample", 'aria-label="Return to sample day, 8 September 2026"', "quiet sample-button")}${button(icon("settings") + (state.calendarSource === "all" ? "" : '<span class="filter-count">1</span>'), "calendar-filter", 'aria-label="Filter calendar"', "icon-only " + (state.calendarSource !== "all" ? "filter-active" : "quiet"))}</div></div>${weekStrip()}<div class="calendar-day-heading"><div><h2 id="selected-day">${dateLabel(state.day, { weekday: "long", day: "numeric", month: "short" })}</h2><p>${isOwner() ? "Brisbane · AEST" : "Shared availability · AEST"} <span aria-hidden="true">·</span> ${events.length} ${isOwner() ? "items" : "busy periods"}</p></div><div class="view-toggle" role="group" aria-label="Calendar view">${["day", "agenda"].map((v) => button(v === "day" ? "Day" : "Agenda", "calendar-view", `data-calendar-view="${v}" aria-pressed="${state.calendarView === v}"`, state.calendarView === v ? "active" : "")).join("")}</div></div>${state.sync !== "ready" ? '<div class="calendar-warning" role="status">' + icon("warning") + "<span>Sync is not current. Availability may have changed.</span></div>" : ""}${state.calendarSource !== "all" ? `<div class="active-filter">Showing ${esc(state.calendarSource)}${button("Clear filter", "calendar-clear-filter", "", "quiet")}</div>` : ""}<div class="calendar-body">${state.calendarView === "day" ? dayTimeline(events) : '<div class="agenda-list">' + agendaEvents() + "</div>"}</div><footer class="calendar-key"><span class="key-outlook">${icon("calendar")} Outlook</span>${isOwner() ? `<span class="key-activity">${icon("record")} PPO Activity</span><span class="key-private">${icon("lock")} Private</span>` : `<span>${icon("lock")} Busy only</span>`}<span class="calendar-zone">UTC+10</span></footer></section><p class="calendar-footnote">Fictional calendar · Outlook events are read only.</p></main>`;
}
function timelineLayout(events) {
  const timed = events
    .filter((e) => e.end !== "Due")
    .map((e) => ({ ...e, from: minutesAt(e.start), to: minutesAt(e.end) }))
    .sort((a, b) => a.from - b.from || a.to - b.to);
  let group = [],
    groupEnd = -1;
  const finish = () => {
    const columns = Math.max(1, ...group.map((e) => e.column + 1));
    group.forEach((e) => (e.columns = columns));
    group = [];
  };
  for (const e of timed) {
    if (e.from >= groupEnd) finish();
    const active = new Set(
      group.filter((x) => x.to > e.from).map((x) => x.column),
    );
    e.column = 0;
    while (active.has(e.column)) e.column++;
    group.push(e);
    groupEnd = Math.max(...group.map((x) => x.to));
  }
  finish();
  return timed;
}
function eventCaption(e) {
  return !isOwner() ? "Busy" : e.title;
}
function eventAria(e) {
  return `${eventCaption(e)}, ${e.start}${e.end === "Due" ? ", due" : " to " + e.end}, AEST${isOwner() ? ", " + e.source + (e.private ? ", private" : "") + (e.recurring ? ", recurring occurrence" : "") : ", details private"}`;
}
function dayTimeline(events) {
  if (!events.length) return agendaEvents();
  const timed = timelineLayout(events);
  const due = events.filter((e) => e.end === "Due");
  // Use the fully wrapping agenda when a narrow time block cannot carry a usable touch target.
  if (
    timed.some(
      (e) =>
        e.from === null || e.to === null || e.to - e.from < 30 || e.columns > 2,
    )
  )
    return (
      '<div class="calendar-density-note">Agenda shown for short or overlapping events so every item stays readable.</div>' +
      agendaEvents()
    );
  const startHour = Math.min(9, ...timed.map((e) => Math.floor(e.from / 60)));
  const endHour = Math.max(17, ...timed.map((e) => Math.ceil(e.to / 60)));
  const height = (endHour - startHour) * 112;
  const dueSection = due.length
    ? `<section class="due-section" aria-label="Activities due"><h3>${icon("record")} Due this day <span>Internal activities · no reserved duration</span></h3>${due.map((e) => button(`<span class="due-time">${esc(e.start)}</span><span class="grow"><strong>${esc(e.title)}</strong><span class="due-context">${esc(recordById(e.link)?.title || "Internal follow-up")}</span></span>${icon("chevron")}`, "event", `data-event="${e.id}" aria-label="${esc(eventAria(e))}"`, "due-item")).join("")}</section>`
    : "";
  if (!timed.length)
    return (
      dueSection +
      '<div class="calendar-empty"><h3>No meetings scheduled</h3><p>Activities above have due times; they do not reserve calendar time.</p></div>'
    );
  return (
    dueSection +
    `<section class="day-timeline" aria-label="Day timeline in Brisbane time" style="--timeline-height:${height}px">${Array.from({ length: endHour - startHour + 1 }, (_, i) => `<div class="hour-line" style="top:${i * 112}px"><span>${hourLabel(startHour + i)}</span></div>`).join("")}<div class="timeline-events">${timed.map((e) => button(`<span class="timeline-title">${esc(eventCaption(e))}${isOwner() && e.recurring ? icon("refresh") : ""}${!isOwner() || e.private ? icon("lock") : ""}</span><span class="timeline-meta">${esc(e.start)}–${esc(e.end)}${isOwner() ? " · " + esc(e.source) : ""}</span>`, "event", `data-event="${e.id}" aria-label="${esc(eventAria(e))}" style="top:${((e.from - startHour * 60) * 112) / 60}px;height:${((e.to - e.from) * 112) / 60 - 3}px;left:calc(${(e.column * 100) / e.columns}% + 2px);width:calc(${100 / e.columns}% - 5px)"`, "timeline-event " + (!isOwner() || e.private ? "private" : "outlook"))).join("")}${state.day === sampleDay ? `<div class="sample-time" style="top:${((585 - startHour * 60) * 112) / 60}px"><span>Sample · 9:45</span></div>` : ""}</div></section>`
  );
}
function calendarDateDialog() {
  openDialog(
    "Choose a date",
    `<label for="calendar-date">Calendar date<input id="calendar-date" type="date" value="${state.day}" min="2020-01-01" max="2035-12-31"></label><p id="calendar-date-error" class="error" role="alert"></p><p class="muted small">Sample events begin on 8 September 2026. Other days may be empty.</p>`,
    button("Cancel", "close") +
      button("Show date", "calendar-save-date", "", "primary"),
  );
}
function calendarFilterDialog() {
  openDialog(
    "Calendar filters",
    `<label for="calendar-source">Show<select id="calendar-source"><option value="all">All calendars</option><option value="Outlook" ${state.calendarSource === "Outlook" ? "selected" : ""}>Outlook meetings</option>${isOwner() ? '<option value="PPO Activity" ' + (state.calendarSource === "PPO Activity" ? "selected" : "") + ">PPO Activities</option>" : ""}</select></label><p class="small muted">${isOwner() ? "Private meetings are visible only to you." : "Only shared Busy periods are available to this account."}</p>`,
    button("Cancel", "close") +
      button("Apply filter", "calendar-save-filter", "", "primary"),
  );
}
function allEvents() {
  return [
    ...EC_FIXTURES.events,
    ...threads
      .filter((t) => t.followup?.record)
      .map((t) => {
        const f = t.followup;
        return {
          id: "followup-" + t.id,
          day: f.due.split("T")[0],
          start: formatDue(f.due).split(", ")[1],
          end: "Due",
          title: f.title,
          source: "PPO Activity",
          with: f.owner,
          location: "Internal follow-up",
          link: f.record,
          private: false,
          recurring: false,
        };
      }),
  ];
}
function agendaEvents() {
  const events = calendarEventsFor(state.day);
  if (!events.length)
    return `<div class="calendar-empty">${icon("calendar")}<h3>${state.calendarSource !== "all" ? "No matching items" : isOwner() ? "A clear day" : "No shared availability"}</h3><p>${state.calendarSource !== "all" ? "Try showing all calendars." : isOwner() ? "No sample events or activities on this date." : "No Busy periods have been shared for this date."}</p>${state.calendarSource !== "all" ? button("Show all calendars", "calendar-clear-filter") : button("Back to sample day", "calendar-sample")}</div>`;
  return events
    .map((e) =>
      button(
        `<span class="event-time">${esc(e.start)}<span>${e.end === "Due" ? "Due" : esc(e.end)}</span></span><span class="event-content ${!isOwner() || e.private ? "private" : e.source === "PPO Activity" ? "ppo" : ""}"><strong>${esc(eventCaption(e))}</strong><span class="event-description">${esc(!isOwner() ? "Details are private" : e.with + " · " + e.location)}</span><span class="event-source">${icon(!isOwner() || e.private ? "lock" : e.source === "Outlook" ? "calendar" : "record")}${esc(!isOwner() ? "Shared availability" : e.source)}${isOwner() && e.recurring ? " · Recurring" : ""}${isOwner() && e.private ? " · Private" : ""}</span></span>${icon("chevron")}`,
        "event",
        `data-event="${e.id}" aria-label="${esc(eventAria(e))}"`,
        "event",
      ),
    )
    .join("");
}
function settings() {
  return `<main id="main" tabindex="-1" class="page narrow"><div class="page-header"><div><h2>Email & Calendar settings</h2><p class="muted">Connection, privacy and sync preferences</p></div>${button("First Microsoft pilot", "nav", 'data-view="pilot"')}</div><div class="settings-grid"><section class="panel"><h3>Outlook connection</h3><p class="small muted">alex@ppo.example · Fictional Microsoft 365 mailbox</p><div class="setting"><div class="grow"><strong>Connection</strong><p>No Microsoft account is connected.</p></div>${badge("Simulated", "calendar", "navy")}</div><div class="setting"><div class="grow"><strong>Email folders</strong><p>Inbox and Sent Items</p></div>${badge("Read only", "lock")}</div><div class="setting"><div class="grow"><strong>Calendar</strong><p>Primary calendar · 30 days before to 90 days ahead in the proposed pilot</p></div>${badge("Read only", "lock")}</div><div class="setting"><div class="grow"><strong>Outlook changes</strong><p>Send, archive, delete, mark read and meeting updates are unavailable in this stage.</p></div></div></section><section class="panel"><h3>Privacy defaults</h3><div class="setting"><div class="grow"><strong>New email</strong><p>Private to the mailbox owner.</p></div>${icon("lock")}</div><div class="setting"><div class="grow"><strong>Record matching</strong><p>Suggest possible records. A person chooses the link.</p></div></div><div class="setting"><div class="grow"><strong>Sharing</strong><p>Selected messages, one linked record and named eligible colleagues. Future replies stay private.</p></div></div><div class="setting"><div class="grow"><strong>Attachments</strong><p>Share separately with the selected message; default off. External images stay blocked.</p></div></div></section><section class="panel full"><h3>Prototype controls</h3><p class="small muted">These controls simulate states for design review. Changes last until you reload or reset this page.</p><div class="setting"><div class="grow"><label for="sync-state">Sample connection state</label><p>Show paused, expired, unavailable and disconnected experiences.</p></div><select id="sync-state">${[
    ["ready", "Ready"],
    ["paused", "Paused"],
    ["expired", "Reconnect required"],
    ["error", "Sync unavailable"],
    ["disconnected", "Disconnected"],
  ]
    .map(
      ([v, l]) =>
        `<option value="${v}" ${state.sync === v ? "selected" : ""}>${l}</option>`,
    )
    .join(
      "",
    )}</select></div><div class="setting"><div class="grow"><strong>Jordan’s record access</strong><p>Revoking access hides previously shared messages, results and record counts.</p></div><label class="switch-row"><input id="revoke-access" type="checkbox" ${state.revoked ? "checked" : ""}>Revoke demo access</label></div><div class="setting"><div class="grow"><strong>Shared calendar availability</strong><p>Jordan sees Busy only, without subjects or meeting details. Separate from the first live pilot.</p></div><label class="switch-row"><input id="busy-sharing" type="checkbox" ${state.privateBusy ? "checked" : ""}>Show demo free/busy</label></div><div class="split-actions">${button(icon("refresh") + "Reset sample data", "reset")}${button("Open pilot plan", "nav", 'data-view="pilot"', "primary")}</div><p class="prototype-note">This client-side preview demonstrates visibility rules. Production security requires server enforcement and Microsoft tenant testing.</p></section></div></main>`;
}
function pilot() {
  return `<main id="main" tabindex="-1" class="page narrow"><div class="page-header"><div><p class="meta">Proposed next integration stage</p><h2>First Microsoft pilot</h2><p class="muted">One test mailbox. Read-only email and calendar.</p></div>${badge("Prepared · Not connected", "lock", "warn")}</div><div class="stack"><div class="callout">This prototype can be reviewed now. A live pilot needs a separate implementation, an isolated authenticated environment and approval for the specific Microsoft test account.</div><section class="panel"><h3>Pilot boundary</h3><dl class="definitions"><dt>Account</dt><dd>One company-approved Exchange Online test mailbox containing fictional correspondence.</dd><dt>Email</dt><dd>Inbox and Sent Items; initial 30-day history.</dd><dt>Calendar</dt><dd>Primary calendar; a fixed window from 30 days before to 90 days ahead.</dd><dt>Access</dt><dd>Mailbox owner only. Sharing is tested with synthetic fixtures first.</dd><dt>Microsoft rights</dt><dd>Delegated Mail.Read and Calendars.Read, with sign-in and offline-access scopes appropriate to the implementation. No Mail.Send or write grants.</dd><dt>Local actions</dt><dd>Explicit PPO record linking and an internal follow-up. No invitations.</dd></dl></section><section class="panel"><h3>Sequence</h3><ol class="step-list"><li><strong>Confirm the test environment</strong><p>Microsoft administrator verifies mailbox type, tenant, consent policy and permitted test user.</p></li><li><strong>Build and verify the synthetic adapter</strong><p>Prove server access checks, record linking, deduplication, recovery and disconnect cleanup.</p></li><li><strong>Register and connect the approved app</strong><p>Use Microsoft sign-in and a protected server token store in an isolated environment.</p></li><li><strong>Run the read-only pilot</strong><p>Check new messages, folder moves, deletions, recurring events, expiry, reconnect and Australian/NZ time zones.</p></li><li><strong>Review evidence and disconnect</strong><p>Remove pilot tokens and cached content, verify cleanup and record the next decision.</p></li></ol></section><section class="panel"><h3>What must pass</h3><ul class="help-list"><li>Original Outlook messages and events remain unchanged.</li><li>Unauthorised users cannot obtain content through search, counts, attachments or direct URLs.</li><li>Repeated sync does not duplicate messages, links or follow-ups.</li><li>A failed sync is visible and recovers without losing the previous checkpoint.</li><li>Calendar changes never bypass PPO service scheduling or approval rules.</li><li>Disconnect removes access and cleans up tokens, subscriptions and cached pilot content.</li></ul><p class="small muted">Detailed acceptance cases, responsibilities, retention and the run procedure are in the accompanying Microsoft pilot plan.</p></section>${button(icon("arrow") + "Return to Email", "nav", 'data-view="email"')}</div></main>`;
}
function render() {
  app.innerHTML = shell(
    ({ email: mail, record, calendar, settings, pilot }[state.view] || mail)(),
  );
}
function openDialog(title, body, footer = "") {
  dialogReturn = document.activeElement;
  dialog.innerHTML = `<div class="dialog-head"><h2 id="dialog-title">${esc(title)}</h2>${button(icon("close"), "close", 'aria-label="Close dialog"', "quiet icon-only")}</div><div class="dialog-body">${body}</div>${footer ? `<div class="dialog-footer">${footer}</div>` : ""}`;
  dialog.showModal();
}
function closeDialog() {
  dialog.close();
  dialogReturn?.focus();
}
function linkDialog() {
  const t = currentThread();
  if (!isOwner() || !t || t.personal) return;
  const candidates = EC_FIXTURES.records.filter((r) => canRecord(r.id));
  openDialog(
    "Link a record",
    `<p class="small muted">Choose records for this conversation. Linking keeps every message private.</p>${t.email === "casey@banksia.example" ? '<div class="callout warning">Two opportunities use this contact. An email address alone cannot identify the correct opportunity.</div>' : ""}<label>Find a record<input id="record-search" type="search" placeholder="Search title, type or reference"></label><div id="link-choices" class="stack">${candidates.map((r) => `<label class="choice" data-match="${esc((r.title + " " + r.type + " " + r.ref).toLowerCase())}"><input type="checkbox" name="record-link" value="${r.id}" ${t.links.includes(r.id) ? "checked" : ""}><span><strong>${esc(r.title)}</strong><p>${esc(r.type)} · ${esc(r.ref)}</p><p>${esc(r.org)}</p></span></label>`).join("")}</div><p class="meta">Removing a link also withdraws the message shares that depend on that link.</p>`,
    button("Cancel", "close") +
      button("Save links", "save-links", "", "primary"),
  );
}
function shareDialog(messageId) {
  const t = currentThread();
  if (!isOwner() || !t || t.personal) return;
  const m = t.messages.find((m) => m.id === messageId);
  if (!m) return;
  const links = t.links.filter(
    (id) => recordById(id)?.readers.includes("jordan") && !state.revoked,
  );
  const existing = state.shared.filter(
    (s) => s.thread === t.id && s.message === m.id,
  );
  if (!links.length) {
    openDialog(
      "Share selected message",
      `<div class="callout warning">No eligible recipient for the linked records.</div><p>Link a record that both you and Jordan can access before sharing this message.</p>`,
      button("Close", "close"),
    );
    return;
  }
  openDialog(
    "Share selected message",
    `<div class="callout"><strong>${esc(t.subject)}</strong><br><span class="small">${esc(m.from)} · ${esc(m.date)}</span></div><p class="small">Only this message will be shared. Earlier messages and future replies remain private.</p><label>Share in the context of<select id="share-record">${links
      .map((id) => {
        const r = recordById(id);
        return `<option value="${id}" ${existing.some((s) => s.record === id) ? "selected" : ""}>${esc(r.type)} · ${esc(r.title)}</option>`;
      })
      .join(
        "",
      )}</select></label><label class="choice"><input id="share-jordan" type="checkbox" checked><span><strong>Jordan Vale</strong><p>Eligible colleague with access to the selected record.</p></span></label>${m.attachment ? `<label class="switch-row"><input id="share-attachment" type="checkbox" ${existing.some((s) => s.attachment) ? "checked" : ""}>Include this message’s synthetic attachment</label>` : ""}<p class="meta">A share includes the selected sender, recipient, subject and body. Revoking the share or the recipient’s record access removes visibility.</p><input id="share-message" type="hidden" value="${m.id}">`,
    (existing.length
      ? button(
          "Withdraw sharing",
          "withdraw-share",
          `data-message="${m.id}"`,
          "danger",
        )
      : button("Cancel", "close")) +
      button("Share selected message", "save-share", "", "primary"),
  );
}
function followupDialog() {
  const t = currentThread();
  if (!isOwner() || !t || t.personal) return;
  if (!t.links.length) {
    openDialog(
      "Link a record first",
      "<p>Choose the relevant record before creating its follow-up.</p>",
      button("Close", "close") +
        button("Choose a record", "followup-link", "", "primary"),
    );
    return;
  }
  openDialog(
    "Plan a follow-up",
    `<div class="callout">This creates an internal PPO Activity. It does not create an Outlook event or send an invitation.</div><label>Follow-up action<input id="followup-title" required maxlength="160" placeholder="For example, confirm site visit details"></label><label>Related record<select id="followup-record">${t.links
      .filter((id) => canRecord(id) && !recordById(id).planned)
      .map(
        (id) => `<option value="${id}">${esc(recordById(id).title)}</option>`,
      )
      .join(
        "",
      )}</select></label><div class="form-grid"><label>Owner<input value="Alex Lee" readonly></label><label>Due date and time · Brisbane<input id="followup-due" type="datetime-local" value="2026-09-09T09:00" required></label></div><p id="followup-error" class="error" role="alert"></p><p class="meta">Saved in this demo session only. Date and time are AEST (UTC+10).</p>`,
    button("Cancel", "close") +
      button("Create follow-up", "save-followup", "", "primary"),
  );
}
function eventDialog(id) {
  const e = allEvents().find((e) => e.id === id);
  if (!e || !calendarEventsFor(e.day, false).some((x) => x.id === e.id)) return;
  if (!isOwner()) {
    openDialog(
      "Busy",
      `<p>${esc(e.start)}–${esc(e.end)} AEST</p><p>Meeting details have not been shared with you.</p>`,
      button("Close", "close"),
    );
    return;
  }
  openDialog(
    e.title,
    `<div class="row wrap">${badge(e.source, "calendar")}${e.recurring ? badge("Recurring occurrence", "refresh") : ""}${e.private ? badge("Private", "lock") : ""}</div><dl class="definitions"><dt>Date</dt><dd>${dateLabel(e.day, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</dd><dt>Time</dt><dd>${e.start}${e.end === "Due" ? " · Due" : "–" + e.end} AEST</dd><dt>Location</dt><dd>${esc(e.location)}</dd><dt>People</dt><dd>${esc(e.with)}</dd><dt>Linked record</dt><dd>${e.link ? esc(recordById(e.link).title) : "Not linked"}</dd></dl><div class="callout">${e.source === "Outlook" ? "Read-only Outlook event. Editing, cancellation and invitations remain in Outlook during the first pilot." : "Internal PPO follow-up. This is not an Outlook meeting or a confirmed service visit."}</div>`,
    button("Close", "close") +
      (e.link
        ? button(
            "View linked record",
            "event-record",
            `data-record="${e.link}"`,
            "primary",
          )
        : ""),
  );
}
app.addEventListener("input", (e) => {
  if (e.target.id === "search") {
    state.query = e.target.value;
    document.querySelector("#mail-results").innerHTML = mailResults();
  }
});
app.addEventListener("change", (e) => {
  const id = e.target.id;
  if (id === "actor") {
    state.calendarSource = "all";
    state.actor = e.target.value;
    state.thread = null;
    state.query = "";
    state.filter = "all";
    render();
    toast(
      isOwner()
        ? "Previewing Alex’s private mailbox."
        : "Previewing Jordan’s permitted shared messages.",
    );
  }
  if (id === "mail-filter") {
    state.filter = e.target.value;
    document.querySelector("#mail-results").innerHTML = mailResults();
  }
  if (id === "folder-mobile") {
    state.folder = e.target.value;
    render();
  }
  if (id === "record-select") {
    state.record = e.target.value;
    render();
  }
  if (id === "agenda-day") {
    state.day = e.target.value;
    render();
  }
  if (id === "sync-state") {
    state.sync = e.target.value;
    render();
  }
  if (id === "revoke-access") {
    state.revoked = e.target.checked;
    render();
    toast(
      state.revoked
        ? "Jordan’s demo record access revoked."
        : "Jordan’s demo record access restored.",
    );
  }
  if (id === "busy-sharing") {
    state.privateBusy = e.target.checked;
    render();
  }
});
dialog.addEventListener("input", (e) => {
  if (e.target.id === "record-search") {
    const q = e.target.value.toLowerCase();
    dialog.querySelectorAll("[data-match]").forEach((el) => {
      el.hidden = !el.dataset.match.includes(q);
      el.style.display = el.hidden ? "none" : "";
    });
  }
});
document.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-action]");
  if (!b) return;
  const a = b.dataset.action;
  if (a === "nav") navigate(b.dataset.view);
  if (
    a === "calendar-day" ||
    a === "calendar-week" ||
    a === "calendar-sample"
  ) {
    state.day =
      a === "calendar-day"
        ? b.dataset.day
        : a === "calendar-week"
          ? shiftDay(state.day, Number(b.dataset.offset))
          : sampleDay;
    render();
    document.querySelector('[data-day="' + state.day + '"]')?.focus();
  }
  if (a === "calendar-view") {
    state.calendarView = b.dataset.calendarView;
    render();
    document
      .querySelector('[data-calendar-view="' + state.calendarView + '"]')
      ?.focus();
  }
  if (a === "calendar-date") calendarDateDialog();
  if (a === "calendar-filter") calendarFilterDialog();
  if (a === "calendar-save-date") {
    const day = dialog.querySelector("#calendar-date").value;
    if (
      !/^20[0-3]\d-\d{2}-\d{2}$/.test(day) ||
      day < "2020-01-01" ||
      day > "2035-12-31" ||
      Number.isNaN(utcDay(day).getTime()) ||
      utcDay(day).toISOString().slice(0, 10) !== day
    ) {
      dialog.querySelector("#calendar-date-error").textContent =
        "Choose a valid date between 2020 and 2035.";
      return;
    }
    state.day = day;
    closeDialog();
    render();
    document.querySelector('[data-day="' + state.day + '"]')?.focus();
  }
  if (a === "calendar-save-filter" || a === "calendar-clear-filter") {
    state.calendarSource =
      a === "calendar-clear-filter"
        ? "all"
        : dialog.querySelector("#calendar-source").value;
    closeDialog();
    render();
    document.querySelector('[data-action="calendar-filter"]')?.focus();
  }
  if (a === "folder") {
    state.folder = b.dataset.folder;
    state.thread = null;
    render();
  }
  if (a === "thread") {
    state.thread = b.dataset.thread;
    state.view = "email";
    render();
    window.scrollTo(0, 0);
  }
  if (a === "back-mail") {
    state.thread = null;
    render();
  }
  if (a === "record") {
    state.record = b.dataset.record;
    state.view = "record";
    state.recordTab = "emails";
    render();
    window.scrollTo(0, 0);
  }
  if (a === "record-tab") {
    state.recordTab = b.dataset.tab;
    render();
  }
  if (a === "event-record") {
    state.record = b.dataset.record;
    closeDialog();
    navigate("record");
  }
  if (a === "refresh") {
    if (state.sync === "ready")
      toast("Sample refresh complete. No Microsoft request was made.");
    else
      toast(
        "Refresh unavailable in this simulated state. Open Settings to change the demo connection.",
      );
  }
  if (a === "close") closeDialog();
  if (a === "link") linkDialog();
  if (a === "save-links") {
    const t = currentThread();
    if (!isOwner() || !t) return;
    const links = [
      ...dialog.querySelectorAll('input[name="record-link"]:checked'),
    ]
      .map((x) => x.value)
      .filter(canRecord);
    t.links = links;
    state.shared = state.shared.filter(
      (s) => s.thread !== t.id || links.includes(s.record),
    );
    closeDialog();
    render();
    toast("Record links saved in this demo. Message privacy is unchanged.");
  }
  if (a === "share") shareDialog(b.dataset.message);
  if (a === "save-share") {
    const t = currentThread();
    if (!isOwner() || !t) return;
    const mid = dialog.querySelector("#share-message").value;
    const rid = dialog.querySelector("#share-record").value;
    const checked = dialog.querySelector("#share-jordan").checked;
    if (!checked) {
      toast("Select a colleague to share with.");
      return;
    }
    if (
      state.revoked ||
      !t.links.includes(rid) ||
      !recordById(rid)?.readers.includes("jordan")
    ) {
      toast("The selected recipient is no longer eligible.");
      return;
    }
    state.shared = state.shared.filter(
      (s) => !(s.thread === t.id && s.message === mid && s.actor === "jordan"),
    );
    state.shared.push({
      thread: t.id,
      message: mid,
      record: rid,
      actor: "jordan",
      attachment: !!dialog.querySelector("#share-attachment")?.checked,
    });
    closeDialog();
    render();
    toast(
      "Selected message shared with Jordan in this demo. Future replies remain private.",
    );
  }
  if (a === "withdraw-share") {
    const t = currentThread();
    if (!isOwner() || !t) return;
    state.shared = state.shared.filter(
      (s) => !(s.thread === t.id && s.message === b.dataset.message),
    );
    closeDialog();
    render();
    toast("Message sharing withdrawn.");
  }
  if (a === "preview-jordan") {
    state.actor = "jordan";
    state.thread = null;
    render();
    toast("Jordan can see only the selected shared messages.");
  }
  if (a === "followup") followupDialog();
  if (a === "followup-link") {
    closeDialog();
    linkDialog();
  }
  if (a === "save-followup") {
    const t = currentThread();
    const title = dialog.querySelector("#followup-title").value.trim(),
      due = dialog.querySelector("#followup-due").value,
      rid = dialog.querySelector("#followup-record").value;
    const error = dialog.querySelector("#followup-error");
    if (!isOwner() || !t) return;
    if (
      !title ||
      title.length > 160 ||
      !due ||
      !rid ||
      !canRecord(rid) ||
      !t.links.includes(rid) ||
      recordById(rid).planned
    ) {
      error.textContent =
        "Enter an action, related record and valid due date and time.";
      dialog
        .querySelector(
          !title
            ? "#followup-title"
            : !rid
              ? "#followup-record"
              : "#followup-due",
        )
        .focus();
      return;
    }
    if (t.followup) {
      error.textContent =
        "This conversation already has a follow-up in the demo.";
      return;
    }
    t.followup = { title, due, owner: "Alex Lee", record: rid };
    closeDialog();
    render();
    toast("Follow-up created in this demo. No meeting invitation was sent.");
  }
  if (a === "attachment") {
    const t = currentThread(),
      m = t?.messages.find((m) => m.id === b.dataset.message);
    if (!m || !visibleMessages(t).includes(m)) return;
    const allowed =
      isOwner() ||
      state.shared.some(
        (s) =>
          s.thread === t.id &&
          s.message === m.id &&
          s.actor === state.actor &&
          canRecord(s.record) &&
          s.attachment,
      );
    openDialog(
      allowed ? "Synthetic attachment" : "Attachment not shared",
      allowed
        ? '<p>Growing-area-sketch.txt</p><div class="callout">Fictional attachment preview: north growing area, pump station and access lane. No original customer file is included.</div>'
        : "<p>The mailbox owner shared the message without its attachment.</p>",
      button("Close", "close"),
    );
  }
  if (a === "event") eventDialog(b.dataset.event);
  if (a === "reset") {
    openDialog(
      "Reset sample data",
      "<p>Clear demo links, shares, follow-ups and connection simulations, and return to Alex’s sample inbox?</p>",
      button("Cancel", "close") +
        button("Reset demo", "confirm-reset", "", "primary"),
    );
  }
  if (a === "confirm-reset") {
    threads = clone(EC_FIXTURES.threads);
    Object.assign(state, {
      view: "email",
      actor: "alex",
      folder: "Inbox",
      filter: "all",
      query: "",
      thread: null,
      record: "opp-irrigation",
      recordTab: "emails",
      sync: "ready",
      shared: [],
      revoked: false,
      day: "2026-09-08",
      privateBusy: true,
      calendarView: "day",
      calendarSource: "all",
    });
    closeDialog();
    render();
    toast("Sample data reset.");
  }
});
render();
