import { api } from "./client";
import {
  cacheJob,
  contexts,
  queue,
  commitOperations,
  type CachedJob,
} from "./store";
import { type Command, type WireOperation, type Owner } from "./protocol";
import { localTimer } from "./timer";
import {
  pauseLabels,
  pauseReasons,
  timerInstant,
  timerCommand,
} from "../field/timer-model";
import { fieldReadinessCommand } from "../field/readiness-command";
import type { readFieldReadiness } from "../field/readiness";
type Readiness = Awaited<ReturnType<typeof readFieldReadiness>>;
type Controls = {
  owner: () => Owner;
  context: () => CachedJob;
  make: (
    command: Command,
    body: Record<string, unknown>,
    dependencies?: string[],
    target?: string | null,
    lineage?: string | null,
  ) => Promise<WireOperation>;
  attendance: () => Promise<{ id: unknown; deps: string[] }>;
  refreshQueue: () => Promise<void>;
  contextSaved: (c: CachedJob) => void;
  message: (text: string) => void;
  dirty: (kind: "timer" | "readiness", value: boolean) => void;
  error: (e: unknown) => void;
};
function node<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string) {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  return e;
}
function input(
  form: HTMLElement,
  label: string,
  kind: "input" | "textarea" = "input",
  value = "",
) {
  const l = node("label", label),
    e = node(kind);
  e.value = value;
  l.append(e);
  form.append(l);
  return e;
}
function select(
  form: HTMLElement,
  label: string,
  options: { id: string; label: string }[],
  value = "",
) {
  const l = node("label", label),
    e = node("select");
  for (const option of options) {
    const o = node("option", option.label);
    o.value = option.id;
    e.append(o);
  }
  e.value = value || options[0]?.id || "";
  l.append(e);
  form.append(l);
  return e;
}
function button(text: string, act: () => Promise<void>, c: Controls) {
  const b = node("button", text);
  b.type = "button";
  b.onclick = () => {
    b.disabled = true;
    void act()
      .catch(c.error)
      .finally(() => (b.disabled = false));
  };
  return b;
}

export async function renderOfflineTimer(box: HTMLElement, c: Controls) {
  const cached = c.context(),
    p = c.owner(),
    all = await queue(p),
    t = localTimer(cached.timer, cached.job.id, all);
  box.replaceChildren(
    node("h3", "Work timer saved on this device"),
    node(
      "p",
      `Last downloaded ${cached.verified_at}. ${t.pending ? `${t.pending} retained local timer action(s); the server has not accepted all of them.` : "This is the last downloaded or receipted state, not current authority."}`,
    ),
  );
  if (!cached.timer) {
    box.append(
      node(
        "p",
        "Download current timer context online before saving timer actions.",
      ),
    );
    return;
  }
  box.append(
    node(
      "p",
      `Timer intent: ${t.state}${t.pause_reason ? ` · ${pauseLabels[t.pause_reason]}` : ""}${t.open_since ? ` · from ${t.open_since}` : ""}`,
    ),
  );
  if (t.blocked) {
    box.append(
      node(
        "p",
        "Conflicting or failed timer originals need review. Preserve them and refresh current context online before making another timer action.",
      ),
    );
    return;
  }
  if (cached.timer.capture_closed) {
    box.append(
      node(
        "p",
        "This visit's completion evidence has been submitted. New physical work needs a separately authorised visit.",
      ),
    );
    return;
  }
  const form = node("form"),
    task = select(
      form,
      "Authorised task",
      cached.job.scope.items.map((x) => ({
        id: x.id,
        label: `${x.sequence}. ${x.description}`,
      })),
      t.scope_item_id ?? "",
    );
  form.onsubmit = (e) => e.preventDefault();
  const asset = select(
    form,
    "Affected equipment",
    [
      { id: "", label: "No equipment selected" },
      ...(
        cached.job.scope.items.find((x) => x.id === task.value)?.assets ?? []
      ).map((a) => ({ id: a.id, label: `${a.reference} · ${a.description}` })),
    ],
    t.asset_id ?? "",
  );
  task.onchange = () => {
    asset.replaceChildren();
    for (const a of [
      { id: "", description: "No equipment selected" },
      ...(cached.job.scope.items.find((x) => x.id === task.value)?.assets ??
        []),
    ]) {
      const o = node("option", a.description);
      o.value = a.id;
      asset.append(o);
    }
    c.dirty("timer", true);
  };
  const pause = select(
      form,
      "Pause reason",
      pauseReasons.map((id) => ({ id, label: pauseLabels[id] })),
      "Break",
    ),
    note = input(
      form,
      "Short note (required for waiting, unsafe work or something else)",
      "textarea",
    );
  form.oninput = () => c.dirty("timer", true);
  const status = node("p", "Local draft — no timer action saved");
  status.setAttribute("role", "status");
  form.append(status);
  const save = async (action: "Start" | "Pause" | "Resume" | "Stop") => {
    const current = c.context(),
      rows = await queue(c.owner()),
      latest = localTimer(current.timer, current.job.id, rows);
    if (latest.blocked || latest.version !== t.version)
      throw Error(
        "Another tab changed the saved timer. Reopen this job; your existing originals have been retained.",
      );
    if (action === "Start" || action === "Resume") {
      for (const other of await contexts(p))
        if (other.job.id !== current.job.id) {
          const active = localTimer(other.timer, other.job.id, rows);
          if (active.state === "Running" || active.state === "Paused")
            throw Error(
              "Finish the other retained personal timer first. The server will also recheck current authority before accepting this timer.",
            );
        }
      if (current.timer?.currentness === "ReviewRequired")
        throw Error(
          "The downloaded work authority needs review. Connect and refresh current context before starting or resuming.",
        );
    }
    const attendance = await c.attendance(),
      deps = [
        ...attendance.deps,
        ...(latest.last_operation_id ? [latest.last_operation_id] : []),
      ];
    const earliest =
      rows.find((r) => r.original.operation_id === latest.last_operation_id)
        ?.original.payload.occurred_at ??
      current.timer?.timer?.last_occurred_at ??
      current.job.attendance?.captured_at ??
      rows.find((r) => r.original.operation_id === attendance.deps[0])?.original
        .payload.captured_at;
    const occurred = timerInstant(earliest ? String(earliest) : undefined);
    const body = {
      reason: `Offline ${action.toLowerCase()} work timer`,
      attendance_id: attendance.id,
      expected_version: latest.version,
      action,
      occurred_at: occurred,
      scope_item_id:
        action === "Start" || action === "Resume" ? task.value : null,
      asset_id:
        action === "Start" || action === "Resume" ? asset.value || null : null,
      pause_reason: action === "Pause" ? pause.value : null,
      note: note.value || null,
      undo_event_id: null,
    };
    timerCommand(current.job.id, {
      ...body,
      schema_version: 1,
      operation_id: crypto.randomUUID(),
      attendance_id:
        typeof attendance.id === "string"
          ? attendance.id
          : "00000000-0000-4000-8000-000000000000",
    });
    const original = await c.make("Timer", body, deps);
    await commitOperations(c.owner(), [original]);
    c.dirty("timer", false);
    await c.refreshQueue();
    await renderOfflineTimer(box, c);
    c.message(
      "Timer action saved locally and queued. Use Send explicitly; only its exact server receipt proves acceptance. Earlier originals remain retained.",
    );
  };
  const actions = node("div");
  actions.className = "actions";
  for (const action of t.state === "Idle"
    ? (["Start"] as const)
    : t.state === "Running"
      ? (["Pause", "Stop"] as const)
      : t.state === "Paused"
        ? (["Resume", "Stop"] as const)
        : (["Resume"] as const))
    actions.append(
      button(
        `Save ${action.toLowerCase()} timer locally`,
        () => save(action),
        c,
      ),
    );
  form.append(
    actions,
    node(
      "p",
      "Offline timer changes preserve their original times and dependencies. Undo and forgotten-finish correction require the current online timer. They never grant work permission, payroll approval or billability.",
    ),
  );
  box.append(form);
}

export async function renderOfflineReadiness(
  box: HTMLElement,
  c: Controls,
  catalog?: Readiness,
) {
  const cached = c.context(),
    view = cached.readiness_review,
    choicesFrom = catalog ?? view;
  box.replaceChildren(
    node("h3", "Site readiness review"),
    node(
      "p",
      "Download an explicit activity and location selection while online. Saved instructions are a reference; only the server can confirm whether the original review still matches current sources.",
    ),
  );
  const choices = node("form"),
    activity = input(
      choices,
      "Activity to review",
      "input",
      view?.source?.preparation.activity ?? "",
    );
  choices.onsubmit = (e) => e.preventDefault();
  let selectionChanged = false;
  choices.addEventListener("input", () => {
    selectionChanged = true;
  });
  const selectedFacilities = new Set(
    view?.source?.preparation.facility_ids ?? [],
  );
  if (!choicesFrom)
    choices.append(
      button(
        "Load Site location choices online",
        async () => {
          const fresh = await api<Readiness>(
            `my-jobs/${c.context().job.id}/site-readiness`,
          );
          await renderOfflineReadiness(box, c, fresh);
        },
        c,
      ),
    );
  else {
    const locations = node("fieldset");
    locations.append(
      node("legend", "Exact Facilities or Areas"),
      node(
        "p",
        "Leave every location unchecked to select only explicitly Site-wide requirements.",
      ),
    );
    for (const f of choicesFrom.facilities) {
      const l = node("label", f.display_name),
        check = node("input");
      check.type = "checkbox";
      check.checked = selectedFacilities.has(f.id);
      check.onchange = () => {
        if (check.checked) selectedFacilities.add(f.id);
        else selectedFacilities.delete(f.id);
      };
      l.prepend(check);
      locations.append(l);
    }
    choices.append(locations);
  }
  choices.append(
    button(
      "Download this readiness selection",
      async () => {
        const current = c.context();
        if (!activity.value.trim())
          throw Error("Choose the activity this visit will perform.");
        const query = new URLSearchParams({
          activity: activity.value.trim(),
          facility_ids: [...selectedFacilities].join(","),
        });
        if (view?.source) query.set("record_id", view.source.id);
        const fresh = await api<Readiness>(
          `my-jobs/${current.job.id}/site-readiness?${query}`,
        );
        if (
          fresh.job.id !== current.job.id ||
          fresh.actor_id !== c.owner().actor_id ||
          c.context().job.id !== current.job.id
        )
          throw Error("The downloaded readiness owner or visit changed.");
        const updated = { ...current, readiness_review: fresh };
        await cacheJob(c.owner(), updated);
        c.contextSaved(updated);
        await renderOfflineReadiness(box, c);
        c.message(
          "Exact readiness selection saved as a cached reference. Review every applicable instruction and unresolved condition before recording your own review.",
        );
      },
      c,
    ),
  );
  box.append(choices);
  if (!view?.source) {
    box.append(
      node(
        "p",
        "No readiness selection has been saved. No acknowledgement can be queued.",
      ),
    );
    return;
  }
  const source = view.source;
  box.append(
    node("h4", source.name),
    node(
      "p",
      `Source owner: ${source.owner}. Source updated ${source.updated_at}; selection downloaded ${view.observed_at}. Activity: ${source.preparation.activity}.`,
    ),
    node("p", view.personal_induction),
    node(
      "p",
      `Arrival/access: ${view.site.access}. Biosecurity: ${view.site.biosecurity}.`,
    ),
  );
  const applies = (x: { facility_id: string | null; activity: string }) =>
    (!x.facility_id ||
      source.preparation.facility_ids.includes(x.facility_id)) &&
    (x.activity === "*" || x.activity === source.preparation.activity);
  const requirements = source.content.requirements.filter(applies),
    list = node("ul");
  for (const r of requirements)
    list.append(
      node(
        "li",
        `${r.title} · ${r.kind} · revision ${r.revision} · ${r.facility_id ? (view.facilities.find((f) => f.id === r.facility_id)?.display_name ?? "Exact location unavailable") : "Site-wide"} · ${r.activity} · ${r.source}`,
      ),
    );
  box.append(list);
  const blockers = node("ul");
  for (const b of source.assessment.blockers)
    blockers.append(
      node(
        "li",
        view.facilities.reduce(
          (text, f) => text.replaceAll(f.id, f.display_name),
          b,
        ),
      ),
    );
  box.append(
    node("strong", "Unresolved conditions in this cached selection"),
    blockers,
  );
  for (const e of source.content.evidence.filter((e) =>
    requirements.some((r) => r.id === e.requirement_id),
  ))
    box.append(
      node(
        "p",
        `Evidence: ${e.source} · effective ${e.captured_on} to ${e.expires_on} · ${source.evidence_status[e.id]?.status ?? "Unknown"} · review ${source.evidence_status[e.id]?.reviewed_at ?? "Not established"}`,
      ),
    );
  for (const window of source.content.windows.filter(applies))
    box.append(
      node(
        "p",
        `Recorded access/seasonal window: ${window.from_date} to ${window.to_date} · season ${window.season_from} to ${window.season_to} · ${window.start_time}–${window.end_time} ${view.job.timezone} · ${window.source}`,
      ),
    );
  const retained = (await queue(c.owner())).find(
    (r) =>
      r.original.appointment_id === cached.job.id &&
      r.original.command === "FieldReadiness" &&
      r.original.payload.presented_hash === source.presented_hash,
  );
  if (retained) {
    box.append(
      node(
        "p",
        retained.status.receipt
          ? "Your review of this source has a retained server receipt. Download current instructions before preparing a new review."
          : "Your review of this source is already retained locally. Send or recover that original; no second review has been created.",
      ),
    );
    return;
  }
  const form = node("form"),
    note = input(form, "My review note and conditions to escalate", "textarea"),
    label = node(
      "label",
      "I reviewed this exact cached source, visit and unresolved conditions",
    ),
    confirm = node("input");
  confirm.type = "checkbox";
  label.prepend(confirm);
  form.append(label);
  form.onsubmit = (e) => e.preventDefault();
  form.oninput = () => c.dirty("readiness", true);
  form.append(
    button(
      "Save readiness review locally",
      async () => {
        const current = c.context();
        if (selectionChanged)
          throw Error(
            "Download the changed activity and location selection before acknowledging it.",
          );
        if (!confirm.checked || !note.value.trim())
          throw Error(
            "Confirm the reviewed selection and record a short note.",
          );
        if (!view.can_acknowledge)
          throw Error(
            "This downloaded visit did not permit a field review. Refresh it online.",
          );
        if (
          (await queue(c.owner())).some(
            (r) =>
              r.original.appointment_id === current.job.id &&
              r.original.command === "Start" &&
              r.status.state !== "ServerSaved",
          )
        )
          throw Error(
            "Your provisional arrival may change this review's exact visit. Send it and download current readiness before recording a review; earlier originals remain retained.",
          );
        const body = {
          reason: note.value,
          record_id: source.id,
          expected_version: source.version,
          presented_hash: source.presented_hash,
          facility_ids: source.preparation.facility_ids,
          activity: source.preparation.activity,
        };
        fieldReadinessCommand(current.job.id, {
          ...body,
          schema_version: 1,
          operation_id: crypto.randomUUID(),
        });
        const op = await c.make("FieldReadiness", body);
        await commitOperations(c.owner(), [op]);
        c.dirty("readiness", false);
        confirm.checked = false;
        note.value = "";
        await c.refreshQueue();
        await renderOfflineReadiness(box, c);
        c.message(
          "Readiness review saved locally and queued. It grants no permission, induction acceptance or authority to start work. Current source and assignment will be checked when you explicitly send it.",
        );
      },
      c,
    ),
  );
  box.append(form);
}
