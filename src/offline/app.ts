import {
  canonical,
  sha256,
  ownerKey,
  type Owner,
  type Original,
  type WireOperation,
  type Command,
} from "./protocol";
import {
  ownership,
  unlock,
  lockLocal,
  contexts,
  cacheJob,
  removeContext,
  commitOperations,
  queue,
  bytesFor,
  saveStatus,
  invalidateContexts,
  type CachedJob,
  type LocalBytes,
} from "./store";
import { api, HttpFailure, verifyOwner, synchronise, base64 } from "./client";
import {
  fieldKinds,
  timeKinds,
  materialKinds,
  units,
  readingUnits,
  checkIds,
  payload as validateField,
  entryCommand,
  completionCommand,
} from "../field/validation";
import {
  submitCommand,
  responseCommand,
  responseChoices,
} from "../reports/validation";
let owner: Owner | null = null,
  selected: CachedJob | null = null,
  dirty = false,
  sending = false;
const previewUrls = new Set<string>();
function releasePreviews() {
  for (const url of previewUrls) URL.revokeObjectURL(url);
  previewUrls.clear();
}
const $ = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  text?: string,
  className?: string,
) {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (className) e.className = className;
  return e;
}
function button(
  text: string,
  action: () => Promise<void> | void,
  secondary = false,
) {
  const b = element("button", text, secondary ? "secondary" : undefined);
  b.type = "button";
  b.onclick = () => {
    void perform(action);
  };
  return b;
}
function notice(text: string) {
  $("notice").textContent = text;
}
function showError(e: unknown) {
  $("error").textContent =
    e instanceof Error
      ? e.message +
        ("field_errors" in e
          ? " " +
            (e as { field_errors: { message: string }[] }).field_errors
              .map((x) => x.message)
              .join(" ")
          : "")
      : "Unable to finish. Keep original evidence and retry.";
  $("error").focus();
}
async function perform(action: () => Promise<void> | void) {
  $("error").textContent = "";
  try {
    await action();
  } catch (e) {
    showError(e);
  }
}
function requireOwner() {
  if (!owner)
    throw new Error("Verify the original workspace owner online first.");
  return owner;
}
function safeJob() {
  const j = selected;
  if (!j || j.locked || Date.parse(j.expires_at) < Date.now())
    throw new Error(
      "Cached context is expired or access changed. Preserve originals and refresh online before making new intents.",
    );
  return j;
}
function wipe() {
  releasePreviews();
  owner = null;
  selected = null;
  $("workspace").hidden = true;
  $("job").replaceChildren();
  $("jobs").replaceChildren();
  $("queue").replaceChildren();
  $("review-cases").replaceChildren();
  $("identity").textContent =
    "Saved workspace locked. Unsent originals retain their original ownership.";
}
async function activate(p: Owner, online: boolean) {
  owner = p;
  if (online) {
    for (const c of await contexts(p)) {
      try {
        await api(`my-jobs/${c.job.id}`);
      } catch (e) {
        if (e instanceof HttpFailure && [403, 404].includes(e.status)) {
          await invalidateContexts(p);
          break;
        }
        throw e;
      }
    }
  }
  $("identity").textContent =
    `${p.display_name} · ${online ? "identity verified online" : "last verified owner; server authority unavailable"}`;
  $("workspace").hidden = false;
  await renderJobs();
  await renderQueue();
  if (online) await loadAssigned();
}
async function reconnect() {
  const control = $<HTMLButtonElement>("reconnect");
  if (control.disabled) return;
  control.disabled = true;
  notice("Verifying identity and saved workspace…");
  try {
    const p = await api<Owner>("local-session");
    await unlock(p);
    await activate(p, true);
    notice(
      "Identity verified. Download or refresh a job to recheck its current permissions and authority.",
    );
  } catch (error) {
    notice("Identity verification did not finish. Saved originals remain retained.");
    throw error;
  } finally {
    control.disabled = false;
  }
}
async function loadAssigned() {
  const s = $<HTMLSelectElement>("available");
  s.replaceChildren();
  try {
    const data = await api<{
      items: { id: string; reference: string; site_name: string }[];
    }>("my-jobs");
    for (const j of data.items) {
      const o = element("option", `${j.reference} · ${j.site_name}`);
      o.value = j.id;
      s.append(o);
    }
  } catch (e) {
    if (!(e instanceof HttpFailure && e.status === 403)) throw e;
  }
}
async function download() {
  const control = $<HTMLButtonElement>("download");
  if (control.disabled) return;
  control.disabled = true;
  notice("Downloading selected job — no new local save is confirmed yet.");
  try {
    const p = requireOwner(),
      id = $<HTMLSelectElement>("available").value;
    if (!id) throw new Error("Choose a currently assigned job.");
    await verifyOwner(p);
    const data = await api<Omit<CachedJob, "key">>(`sync/context/${id}`, {});
    const response = await fetch(
      `/api/v1/pack-issues/${data.authority.issue_id}/html`,
      {
        cache: "no-store",
        credentials: "same-origin",
        signal: AbortSignal.timeout(15000),
      },
    );
    if (!response.ok)
      throw new Error(
        "Exact issued pack could not be downloaded. No offline context save is claimed.",
      );
    const html = await response.text();
    if (new TextEncoder().encode(html).length > 1048576)
      throw new Error("Issued HTML exceeds the bounded offline cache size.");
    for (const v of data.report_presentations ?? [])
      if (
        new TextEncoder().encode(v.html).length > 1048576 ||
        (await sha256(v.html)) !== v.content_hash
      )
        throw new Error(
          "Exact report presentation hash or size differs. No offline save is claimed.",
        );
    await cacheJob(p, { ...data, pack_html: html });
    await renderJobs();
    selected = (await contexts(p)).find((x) => x.job.id === id)!;
    await renderJob();
    notice(
      "Job context and exact pack saved on this device. Last verified time is shown; offline context is not current authority.",
    );
  } finally {
    control.disabled = false;
  }
}
async function renderJobs() {
  const p = requireOwner(),
    all = await contexts(p),
    box = $("jobs");
  box.replaceChildren();
  if (selected) {
    selected = all.find((x) => x.job.id === selected!.job.id) ?? null;
    if (selected?.locked) {
      $("job").replaceChildren();
      $("job").hidden = true;
    }
  }
  for (const j of all) {
    const a = element("article"),
      title = element(
        "h3",
        j.locked
          ? "Cached context locked"
          : `${j.job.reference} · ${j.job.site.name}`,
      );
    a.append(
      title,
      element(
        "p",
        `Last verified ${j.verified_at} · ${j.locked ? "access changed — cached viewing locked" : Date.parse(j.expires_at) < Date.now() ? "expired context" : "stale reference when offline"}`,
      ),
    );
    a.append(
      button("Open saved field job", async () => {
        if (j.locked)
          throw new Error(
            "Normal cached job access is locked after a permission or assignment change. Your original operations remain in recovery.",
          );
        selected = j;
        await renderJob();
      }),
      button(
        "Remove cached job context",
        async () => {
          await removeContext(p, j.job.id);
          if (selected?.job.id === j.job.id) {
            selected = null;
            $("job").hidden = true;
          }
          await renderJobs();
          notice(
            "Selected cached context removed. Original operations and local photo bytes remain retained for their owner.",
          );
        },
        true,
      ),
    );
    box.append(a);
  }
  if (!all.length)
    box.append(
      element(
        "p",
        "No jobs downloaded for this owner. Connect online and choose an assigned job.",
      ),
    );
}
function field(
  form: HTMLElement,
  label: string,
  value = "",
  kind = "text",
  options?: readonly string[],
) {
  const id = `field-${crypto.randomUUID()}`,
    wrap = element("div"),
    l = element("label", label);
  l.htmlFor = id;
  let input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  if (options) {
    const s = element("select");
    for (const v of options) {
      const o = element("option", v);
      o.value = v;
      s.append(o);
    }
    input = s;
  } else if (kind === "textarea") input = element("textarea");
  else {
    input = element("input");
    input.type = kind;
  }
  input.id = id;
  input.value = value;
  l.append();
  wrap.append(l, input);
  form.append(wrap);
  return input;
}
async function make(
  command: Command,
  body: Record<string, unknown>,
  dependencies: string[] = [],
  target: string | null = null,
  lineage: string | null = null,
): Promise<WireOperation> {
  const p = requireOwner(),
    j = safeJob(),
    id =
      typeof body.operation_id === "string"
        ? body.operation_id
        : crypto.randomUUID();
  const original: Original = {
    schema_version: 1,
    operation_id: id,
    actor_id: p.actor_id,
    workspace_id: p.workspace_id,
    appointment_id: j.job.id,
    command,
    target_id: target,
    authority: j.authority,
    depends_on: [...new Set(dependencies)],
    supersedes_operation_id: lineage,
    payload: { operation_id: id, schema_version: 1, ...body },
  };
  return { ...original, payload_hash: await sha256(canonical(original)) };
}
async function attendance() {
  const j = safeJob();
  if (j.job.attendance)
    return { id: j.job.attendance.id as unknown, deps: [] as string[] };
  const start = (await queue(requireOwner())).find(
    (x) =>
      x.original.appointment_id === j.job.id && x.original.command === "Start",
  );
  if (!start)
    throw new Error(
      "Save your provisional start intent first. It must be accepted before evidence can synchronise.",
    );
  return {
    id: { operation_id: start.original.operation_id } as unknown,
    deps: [start.original.operation_id],
  };
}
async function renderJob() {
  if (!selected) return;
  const j = selected.job,
    box = $("job");
  box.hidden = false;
  box.replaceChildren(
    element("h2", `${j.reference} · ${j.customer_name}`),
    element("p", `${j.site.name} · ${j.site.location}`),
    element(
      "p",
      `Scheduled ${j.scheduled_start_at} to ${j.scheduled_end_at} · ${j.site_timezone}`,
    ),
    element(
      "p",
      `Context last verified ${selected.verified_at}. Expires ${selected.expires_at}.`,
      "warning",
    ),
    element("p", j.scope.summary),
    element("p", `Exclusions: ${j.scope.exclusions}`),
    element(
      "p",
      `Site access: ${j.site.access} · Biosecurity: ${j.site.biosecurity}`,
    ),
    element(
      "p",
      `Scope r${j.scope.revision} · assigned version ${selected.authority.assignment_version} · pack hash ${selected.authority.issue_hash}`,
      "hash",
    ),
  );
  const tasks = element("ul");
  for (const t of j.scope.items)
    tasks.append(
      element(
        "li",
        `${t.description} · ${t.assets.map((x) => `${x.reference}: ${x.identity_status}`).join(", ")}`,
      ),
    );
  box.append(tasks);
  if (selected.pack_html) {
    const details = element("details"),
      summary = element("summary", "Read exact cached issued pack and history"),
      frame = element("iframe");
    frame.title = "Cached issued pack — stale reference";
    frame.sandbox.add("allow-same-origin");
    frame.srcdoc = selected.pack_html;
    details.append(
      summary,
      element(
        "p",
        "The displayed issue is the original downloaded content. It is not proof of current authority.",
      ),
      frame,
    );
    box.append(details);
  }
  const intents = element("div", undefined, "actions");
  intents.append(
    button("Save provisional start intent", async () => {
      const c = safeJob(),
        existing = (await queue(requireOwner())).find(
          (x) =>
            x.original.appointment_id === j.id &&
            x.original.command === "Start",
        );
      if (j.attendance || existing)
        throw new Error(
          "Your start already has a saved identity. Recover that original instead of creating another.",
        );
      const op = await make("Start", {
        reason: "Synthetic offline personal start intent",
        expected_version: j.version,
        schedule_version: c.authority.schedule_version,
        assignment_id: c.authority.assignment_id,
        assignment_version: c.authority.assignment_version,
        issue_id: c.authority.issue_id,
        issue_hash: c.authority.issue_hash,
        scope_revision_id: c.authority.scope_revision_id,
        scope_version: c.authority.scope_version,
        captured_at: new Date().toISOString(),
      });
      await commitOperations(requireOwner(), [op]);
      await renderQueue();
      notice(
        "Start intent saved on this device. Attendance is not started until the server accepts the full current crew and authority checks.",
      );
    }),
    button(
      "Save my pack acknowledgement intent",
      async () => {
        const c = safeJob();
        const op = await make(
          "Acknowledge",
          {
            reason:
              "Synthetic personal acknowledgement of exact cached issued pack",
            assignment_id: c.authority.assignment_id,
            assignment_version: c.authority.assignment_version,
            presented_hash: c.authority.issue_hash,
            captured_at: new Date().toISOString(),
          },
          [],
          c.authority.issue_id,
        );
        await commitOperations(requireOwner(), [op]);
        await renderQueue();
        notice(
          "Personal acknowledgement intent saved locally. It cannot acknowledge for another crew member. Refresh current context online before starting.",
        );
      },
      true,
    ),
  );
  box.append(
    intents,
    element(
      "p",
      j.attendance
        ? `Server-recorded attendance ${j.attendance.received_at}`
        : "No server-recorded start in this cached context. All offline work remains provisional.",
      "warning",
    ),
  );
  const capture = element("div");
  capture.id = "capture-form";
  box.append(capture);
  await renderCapture();
  const completion = element("div");
  completion.id = "completion-form";
  box.append(completion);
  renderCompletion();
  renderReports(box);
}
type Correction = { op: WireOperation; version: number };
async function renderCapture(correction?: Correction) {
  const j = safeJob().job,
    box = $("capture-form");
  box.replaceChildren(
    element(
      "h3",
      correction ? "Linked successor correction" : "Capture factual evidence",
    ),
  );
  const form = element("form"),
    kind = field(
      form,
      "Evidence type",
      String(correction?.op.payload.kind ?? "Observation"),
      "text",
      fieldKinds,
    ) as HTMLSelectElement;
  if (correction) kind.disabled = true;
  const task = field(
    form,
    "Original authorised task",
    String(correction?.op.payload.scope_item_id ?? j.scope.items[0].id),
    "text",
    j.scope.items.map((x) => x.id),
  ) as HTMLSelectElement;
  for (const o of task.options)
    o.textContent = j.scope.items.find((t) => t.id === o.value)!.description;
  const asset = field(
    form,
    "Affected asset",
    String(correction?.op.payload.asset_id ?? ""),
    "text",
    ["", ...j.scope.items.flatMap((t) => t.assets.map((a) => a.id))],
  ) as HTMLSelectElement;
  for (const o of asset.options)
    o.textContent = o.value
      ? j.scope.items.flatMap((t) => t.assets).find((a) => a.id === o.value)!
          .reference
      : "No asset attribution (only permitted task types)";
  if (!correction && j.scope.items[0].assets[0])
    asset.value = j.scope.items[0].assets[0].id;
  task.onchange = () => {
    asset.value =
      j.scope.items.find((t) => t.id === task.value)?.assets[0]?.id ?? "";
  };
  const controls = element("div"),
    reason = field(
      form,
      correction ? "Correction reason" : "Capture context",
      String(correction?.op.payload.reason ?? ""),
    ),
    state = element("p", "No unsaved changes.", "dirty");
  form.append(controls, state);
  let values: Record<
    string,
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  > = {};
  const set = (
    key: string,
    label: string,
    value = "",
    type = "text",
    options?: readonly string[],
  ) => {
    values[key] = field(controls, label, value, type, options);
  };
  async function draw() {
    controls.replaceChildren();
    values = {};
    const old = (correction?.op.payload.payload ?? {}) as Record<
        string,
        unknown
      >,
      v = (key: string, fallback = "") => String(old[key] ?? fallback);
    if (kind.value === "Observation") {
      set("finding", "Finding", v("finding"), "textarea");
      set(
        "confidence",
        "Diagnostic confidence",
        v("confidence", "Suspected"),
        "text",
        ["Reported", "Suspected", "Verified"],
      );
      set("attempted_fix", "Attempted fix", v("attempted_fix"), "textarea");
      set(
        "result",
        "Result, including unsuccessful work",
        v("result"),
        "textarea",
      );
      set(
        "follow_up_required",
        "Follow-up required",
        v("follow_up_required", "true"),
        "text",
        ["true", "false"],
      );
    }
    if (kind.value === "Time") {
      set(
        "time_kind",
        "Time category",
        v("time_kind", "Labour"),
        "text",
        timeKinds,
      );
      set(
        "start_at",
        "Actual start time (UTC)",
        v("start_at", new Date(Date.now() - 7200000).toISOString()),
      );
      set(
        "end_at",
        "Actual end time (UTC)",
        v("end_at", new Date(Date.now() - 3600000).toISOString()),
      );
      set("note", "Time note", v("note"), "textarea");
    }
    if (kind.value === "Material") {
      set(
        "movement_kind",
        "Material direction",
        v("movement_kind", "Consumed"),
        "text",
        materialKinds,
      );
      set("description", "Material description", v("description"));
      set("quantity", "Captured quantity", v("quantity"));
      set("uom", "Unit", v("uom", "EA"), "text", units);
      for (const [key, label] of [
        ["item_reference", "Item reference (optional)"],
        ["lot", "Lot (if required)"],
        ["serial", "Serial (if required)"],
        ["source_reference", "Source reference (optional)"],
      ])
        set(key, label, v(key));
      set(
        "stock_status",
        "Stock identity status",
        v("stock_status", "Unknown"),
        "text",
        ["Unknown", "ReviewRequired"],
      );
    }
    if (kind.value === "Reading") {
      set("name", "Reading name", v("name"));
      set(
        "numeric_value",
        "Numeric reading (or leave blank)",
        v("numeric_value"),
      );
      set("text_value", "Text reading (or leave blank)", v("text_value"));
      set("unit", "Reading unit", v("unit", "°C"), "text", readingUnits);
      set("context", "Reading context", v("context"), "textarea");
    }
    if (kind.value === "Checklist") {
      set("check_id", "Check", v("check_id", checkIds[0]), "text", checkIds);
      set("result", "Check result", v("result", "Pass"), "text", [
        "Pass",
        "Fail",
        "NotPerformed",
        "NotApplicable",
      ]);
      set("reason", "Check reason", v("reason"), "textarea");
      set(
        "evidence_ids",
        "Required photo IDs (comma separated)",
        Array.isArray(old.evidence_ids) ? old.evidence_ids.join(", ") : "",
      );
    }
    if (kind.value === "Photo") {
      set("file", "Original synthetic PNG", "", "file");
      (values.file as HTMLInputElement).accept = "image/png";
      set("caption", "Photo caption", v("caption"), "textarea");
      if (correction) {
        values.file.parentElement!.hidden = true;
      }
    }
  }
  await draw();
  kind.onchange = () => {
    void perform(draw);
  };
  form.oninput = () => {
    dirty = true;
    state.textContent = "Unsaved changes — held in this page only.";
  };
  const save = element(
    "button",
    correction
      ? "Save linked correction on this device"
      : "Save evidence on this device",
  );
  save.type = "submit";
  form.append(save);
  box.append(form);
  form.onsubmit = (e) => {
    e.preventDefault();
    void perform(async () => {
      save.disabled = true;
      try {
        safeJob();
        const a = await attendance(),
          data: Record<string, unknown> = {};
        for (const [k, x] of Object.entries(values))
          if (k !== "file") data[k] = x.value;
        if (kind.value === "Observation")
          data.follow_up_required = data.follow_up_required === "true";
        if (kind.value === "Material")
          for (const k of [
            "item_reference",
            "lot",
            "serial",
            "source_reference",
          ])
            if (!data[k]) data[k] = null;
        if (kind.value === "Time" && !data.note) data.note = null;
        if (kind.value === "Observation")
          for (const k of ["attempted_fix", "result"])
            if (!data[k]) data[k] = null;
        if (kind.value === "Reading")
          for (const k of ["numeric_value", "text_value"])
            if (!data[k]) data[k] = null;
        if (kind.value === "Checklist" && !data.reason) data.reason = null;
        if (kind.value === "Checklist")
          data.evidence_ids = String(data.evidence_ids)
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean);
        const deps = [...a.deps],
          ops: WireOperation[] = [],
          files: LocalBytes[] = [];
        if (kind.value === "Photo" && !correction) {
          const file = (values.file as HTMLInputElement).files?.[0];
          if (
            !file ||
            file.type !== "image/png" ||
            file.size < 1 ||
            file.size > 4194304
          )
            throw new Error(
              "Choose the original supported synthetic PNG, no larger than 4 MiB.",
            );
          const digest = await sha256(new Uint8Array(await file.arrayBuffer())),
            id = crypto.randomUUID();
          const init = await make(
            "AttachmentInitiate",
            {
              reason: reason.value,
              id,
              appointment_id: j.id,
              attendance_id: a.id,
              filename: file.name,
              media_type: "image/png",
              byte_count: file.size,
              sha256: digest,
            },
            a.deps,
          );
          const upload = await make(
            "AttachmentUpload",
            {
              reason: reason.value,
              expected_version: 1,
              sha256: digest,
              byte_count: file.size,
            },
            [init.operation_id],
            id,
          );
          const finalise = await make(
            "AttachmentFinalise",
            { reason: reason.value, expected_version: 2 },
            [upload.operation_id],
            id,
          );
          ops.push(init, upload, finalise);
          deps.push(finalise.operation_id);
          data.attachment_id = id;
          files.push({
            key: `${ownerKey(requireOwner())}:${upload.operation_id}`,
            owner: ownerKey(requireOwner()),
            operation_id: upload.operation_id,
            bytes: file,
            sha256: digest,
            byte_count: file.size,
          });
        } else if (kind.value === "Photo")
          data.attachment_id = (
            correction!.op.payload.payload as { attachment_id: string }
          ).attachment_id;
        const refs =
          kind.value === "Checklist" ? (data.evidence_ids as string[]) : [];
        for (const row of await queue(requireOwner()))
          if (
            row.original.command === "AttachmentFinalise" &&
            refs.includes(row.original.target_id!)
          )
            deps.push(row.original.operation_id);
        validateField(kind.value as (typeof fieldKinds)[number], data);
        const body = {
          reason: reason.value,
          id: crypto.randomUUID(),
          appointment_id: j.id,
          attendance_id: a.id,
          kind: kind.value,
          scope_item_id: task.value || null,
          asset_id: asset.value || null,
          captured_at: new Date().toISOString(),
          payload: data,
          ...(correction ? { expected_version: correction.version } : {}),
        };
        entryCommand(
          {
            ...body,
            operation_id: crypto.randomUUID(),
            schema_version: 1,
            attendance_id:
              typeof a.id === "string"
                ? a.id
                : "00000000-0000-4000-8000-000000000000",
          },
          correction ? String(correction.op.payload.id) : undefined,
        );
        if (correction) deps.push(correction.op.operation_id);
        const op = await make(
          correction ? "Correct" : "Capture",
          body,
          deps,
          correction ? String(correction.op.payload.id) : null,
          correction?.op.operation_id ?? null,
        );
        ops.push(op);
        await commitOperations(requireOwner(), ops, files);
        dirty = false;
        state.textContent =
          "Saved on this device — awaiting server acceptance.";
        await renderQueue();
        notice(
          "Original evidence and any selected PNG bytes committed on this device. Server acceptance is still pending.",
        );
      } finally {
        save.disabled = false;
      }
    });
  };
}
function renderCompletion() {
  const box = $("completion-form"),
    j = safeJob().job;
  box.replaceChildren(element("h3", "Completion draft"));
  const form = element("form");
  const outcome = field(form, "Draft scope outcome", "Partial", "text", [
      "Complete",
      "Partial",
      "UnableToProceed",
    ]),
    work = field(form, "Work performed", "", "textarea"),
    exclusions = field(
      form,
      "Draft exclusions",
      j.scope.exclusions,
      "textarea",
    ),
    remaining = field(form, "Remaining work and next action", "", "textarea"),
    time = field(form, "Personal time declaration", "Incomplete", "text", [
      "AllRecorded",
      "None",
      "Incomplete",
    ]),
    material = field(
      form,
      "Personal material declaration",
      "Incomplete",
      "text",
      ["AllRecorded", "None", "Incomplete"],
    ),
    why = field(form, "Declaration and draft reason", "", "textarea"),
    tasks = j.scope.items.map((t) => ({
      id: t.id,
      outcome: field(
        form,
        `Task outcome: ${t.description}`,
        "Partial",
        "text",
        ["Complete", "Partial", "UnableToProceed"],
      ),
      reason: field(form, `Task reason: ${t.description}`, "", "textarea"),
    }));
  const state = element("p", "No unsaved changes.", "dirty"),
    save = element("button", "Save completion draft on this device");
  save.type = "submit";
  form.append(state, save);
  box.append(form);
  form.oninput = () => {
    dirty = true;
    state.textContent = "Unsaved changes — held in this page only.";
  };
  form.onsubmit = (e) => {
    e.preventDefault();
    void perform(async () => {
      save.disabled = true;
      try {
        const a = await attendance(),
          rows = (await queue(requireOwner())).filter(
            (x) => x.original.appointment_id === j.id,
          ),
          captures = rows.filter((x) =>
            ["Capture", "Correct"].includes(x.original.command),
          ),
          superseded = new Set(captures.map((x) => x.original.target_id)),
          entries = [
            ...j.entries
              .filter((x) => !x.superseded && !superseded.has(x.id))
              .map((x) => ({ id: x.id, version: x.version })),
            ...captures
              .filter((x) => !superseded.has(String(x.original.payload.id)))
              .map((x) => ({
                id: String(x.original.payload.id),
                version:
                  x.original.command === "Correct"
                    ? Number(x.original.payload.expected_version) + 1
                    : 1,
              })),
          ];
        const distinct = [...new Map(entries.map((x) => [x.id, x])).values()];
        const deps = [
          ...new Set([
            ...a.deps,
            ...rows
              .filter((x) => !x.status.recovery)
              .map((x) => x.original.operation_id),
          ]),
        ];
        if (deps.length > 30)
          throw new Error(
            "This bounded draft has more than 30 local dependencies. Synchronise and download current context before preparing it.",
          );
        const previous = rows
            .filter((x) => x.original.command === "CompletionDraft")
            .at(-1),
          body = {
            reason: why.value,
            id:
              previous?.original.payload.id ??
              j.draft?.id ??
              crypto.randomUUID(),
            attendance_id: a.id,
            expected_version: previous
              ? Number(previous.original.payload.expected_version) + 1
              : (j.draft?.version ?? 0),
            scope_outcome: outcome.value,
            work_performed: work.value,
            exclusions: exclusions.value,
            remaining_work: remaining.value,
            time_declaration: time.value,
            material_declaration: material.value,
            declaration_reason: why.value,
            task_outcomes: tasks.map((x) => ({
              scope_item_id: x.id,
              outcome: x.outcome.value,
              reason: x.reason.value,
            })),
            entries: distinct,
            required_attachment_ids: [
              ...new Set([
                ...j.attachments.map((x) => x.id),
                ...rows
                  .filter((x) => x.original.command === "AttachmentInitiate")
                  .map((x) => String(x.original.payload.id)),
              ]),
            ],
          };
        completionCommand(j.id, {
          ...body,
          operation_id: crypto.randomUUID(),
          schema_version: 1,
          attendance_id:
            typeof a.id === "string"
              ? a.id
              : "00000000-0000-4000-8000-000000000000",
        });
        const op = await make(
          "CompletionDraft",
          body,
          deps,
          null,
          previous?.original.operation_id ?? null,
        );
        await commitOperations(requireOwner(), [op]);
        dirty = false;
        state.textContent =
          "Completion draft saved on this device — not submitted or approved.";
        await renderQueue();
        notice(
          "Completion draft retained with exact evidence dependencies. No attendance/order/ticket/report/Finance closure occurred.",
        );
      } finally {
        save.disabled = false;
      }
    });
  };
}
async function renderQueue() {
  releasePreviews();
  const p = requireOwner(),
    rows = await queue(p),
    box = $("queue");
  box.replaceChildren();
  for (const row of rows) {
    const op = row.original,
      a = element("article", undefined, "queue-row"),
      heading = element("div", undefined, "row-title");
    heading.append(
      element(
        "strong",
        `${op.command}${op.payload.kind ? ` · ${op.payload.kind}` : ""}`,
      ),
      element("span", row.status.state, "status"),
    );
    a.append(
      heading,
      element("p", `Original operation ${op.operation_id}`, "hash"),
      element(
        "p",
        row.status.message ?? "Saved on this device. No server acceptance yet.",
      ),
    );
    if (row.status.receipt)
      a.append(
        element(
          "p",
          `Exact receipt ${row.status.receipt.receipt_id} · ${row.status.receipt.accepted_at} · ${row.status.receipt.state}`,
          "hash",
        ),
      );
    if (row.status.recovery)
      a.append(
        element(
          "p",
          `Restricted recovery receipt ${row.status.recovery.recovery_receipt_id} · normal acceptance: no`,
          "hash",
        ),
      );
    if (op.depends_on.length)
      a.append(
        element(
          "small",
          `${op.depends_on.length} causal dependencies retained.`,
        ),
      );
    if (op.command === "AttachmentUpload") {
      const file = await bytesFor(p, op.operation_id);
      if (file) {
        const image = element("img"),
          url = URL.createObjectURL(file.bytes);
        previewUrls.add(url);
        image.src = url;
        image.alt = "Original PNG saved on this device";
        image.className = "thumb";
        a.append(
          image,
          element(
            "p",
            `Local original bytes: ${file.byte_count} · SHA-256 ${file.sha256}`,
            "hash",
          ),
        );
      } else
        a.append(
          element(
            "p",
            "Original local PNG bytes are missing. Metadata alone cannot be sent as a photo.",
            "warning",
          ),
        );
    }
    const details = element("details");
    details.append(
      element("summary", "Original payload and authority"),
      element(
        "pre",
        JSON.stringify({ ...op, payload_hash: op.payload_hash }, null, 2),
      ),
    );
    a.append(details);
    if (["Capture", "Correct"].includes(op.command))
      a.append(
        button(
          "Create linked successor correction",
          async () => {
            selected =
              (await contexts(p)).find((x) => x.job.id === op.appointment_id) ??
              null;
            if (!selected)
              throw new Error(
                "Refresh the original permitted context before correcting.",
              );
            await renderJob();
            await renderCapture({
              op,
              version:
                row.status.receipt?.record_version ??
                (op.command === "Correct"
                  ? Number(op.payload.expected_version) + 1
                  : 1),
            });
            $("capture-form").scrollIntoView();
          },
          true,
        ),
      );
    if (
      ![
        "Start",
        "Acknowledge",
        "SubmitCompletion",
        "CustomerResponse",
      ].includes(op.command) &&
      row.status.state !== "ServerSaved" &&
      row.status.state !== "Sending" &&
      !row.status.receipt &&
      !row.status.recovery
    )
      a.append(
        button(
          "Preserve original for service-owner review",
          async () => {
            await verifyOwner(p);
            const c = (await contexts(p)).find(
              (x) => x.job.id === op.appointment_id,
            );
            if (!c)
              throw new Error(
                "Original recovery capability is missing. Keep local evidence for supervised recovery.",
              );
            const file =
              op.command === "AttachmentUpload"
                ? await bytesFor(p, op.operation_id)
                : null;
            const result = await api<Record<string, unknown>>("sync/recovery", {
              grant_id: c.recovery.id,
              token: c.recovery.token,
              operation: op,
              ...(file ? { content_base64: await base64(file.bytes) } : {}),
            });
            await saveStatus(p, op.operation_id, {
              state: "ReviewRequired",
              recovery: result,
              message:
                "Original retained in restricted recovery. Service owner disposition is required; this is not normal field acceptance.",
            });
            await renderQueue();
          },
          true,
        ),
      );
    box.append(a);
  }
  if (!rows.length)
    box.append(element("p", "No locally saved originals for this owner."));
}
async function exportOriginals() {
  const p = requireOwner(),
    rows = await queue(p),
    files = [];
  for (const row of rows) {
    const file = await bytesFor(p, row.original.operation_id);
    if (file)
      files.push({
        operation_id: file.operation_id,
        sha256: file.sha256,
        byte_count: file.byte_count,
        content_base64: await base64(file.bytes),
      });
  }
  const blob = new Blob(
      [
        JSON.stringify(
          {
            format: "PPO-offline-owned-recovery-v1",
            owner: p,
            exported_at: new Date().toISOString(),
            operations: rows,
            files,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    ),
    url = URL.createObjectURL(blob),
    a = element("a");
  a.href = url;
  a.download = `SYN-PPO-offline-originals-${p.actor_id}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notice(
    "Originals exported for their owner. This does not remove local data or prove a backup was retained.",
  );
}
async function review() {
  const data = await api<{
      items: {
        case_id: string;
        actor_id: string;
        envelope: unknown;
        byte_hash: string | null;
        dispositions: unknown[];
      }[];
    }>("sync/recovery-review"),
    box = $("review-cases");
  box.replaceChildren();
  for (const r of data.items) {
    const a = element("article");
    a.append(
      element("h3", `Recovery ${r.case_id}`),
      element("p", `Original actor ${r.actor_id}`, "hash"),
      element("pre", JSON.stringify(r.envelope, null, 2)),
      element("pre", JSON.stringify(r.dispositions, null, 2)),
    );
    if (r.byte_hash) {
      const image = element("img");
      image.className = "thumb";
      image.alt = "Exact recovered synthetic PNG";
      image.src = `/api/v1/sync/recovery-review/${r.case_id}/bytes`;
      a.append(image);
    }
    const disposition = field(
        a,
        "Owned disposition",
        "RetainedForReview",
        "text",
        ["RetainedForReview", "ClarificationRequired"],
      ),
      note = field(a, "Disposition note", "", "textarea");
    let pending:
      | {
          operation_id: string;
          schema_version: number;
          reason: string;
          disposition: string;
          note: string;
        }
      | undefined;
    a.append(
      button("Record owned disposition", async () => {
        if (
          !pending ||
          pending.disposition !== disposition.value ||
          pending.note !== note.value
        )
          pending = {
            operation_id: crypto.randomUUID(),
            schema_version: 1,
            reason: "Synthetic owned offline evidence disposition",
            disposition: disposition.value,
            note: note.value,
          };
        await api(`sync/recovery-review/${r.case_id}/disposition`, pending);
        await review();
        notice(
          "Owned disposition recorded. Original evidence and its follow-up remain retained.",
        );
      }),
    );
    box.append(a);
  }
  if (!data.items.length)
    box.append(
      element("p", "No recovery cases are visible to this service owner."),
    );
}
$("reconnect").onclick = () => {
  void perform(reconnect);
};
$("lock").onclick = () => {
  void perform(async () => {
    await lockLocal();
    wipe();
  });
};
$("download").onclick = () => {
  void perform(download);
};
$("refresh").onclick = () => {
  void perform(async () => {
    await renderJobs();
    await renderQueue();
  });
};
$("export").onclick = () => {
  void perform(exportOriginals);
};
$("review").onclick = () => {
  void perform(review);
};
$("sync").onclick = () => {
  void perform(async () => {
    if (sending) return;
    sending = true;
    $<HTMLButtonElement>("sync").disabled = true;
    try {
      notice(await synchronise(requireOwner(), renderQueue));
      await renderJobs();
    } finally {
      sending = false;
      $<HTMLButtonElement>("sync").disabled = false;
    }
  });
};
const channel = new BroadcastChannel("ppo-offline-ownership");
channel.onmessage = async (event) => {
  // A queued lock notification can arrive after a newer verified unlock.
  // The committed ownership record, not the notification, controls visibility.
  if (event.data !== "locked" && event.data !== "refresh") return;
  const active = await ownership();
  if (
    !active?.owner ||
    active.locked ||
    (owner && ownerKey(active.owner) !== ownerKey(owner))
  )
    wipe();
};
window.addEventListener("beforeunload", (e) => {
  // Saving one form does not make another form's unsaved input durable.
  if (
    dirty ||
    [...document.querySelectorAll(".dirty")].some((state) =>
      state.textContent?.startsWith("Unsaved changes"),
    )
  ) {
    e.preventDefault();
    e.returnValue = "";
  }
});
window.addEventListener("ppo-storage-update", () => {
  wipe();
  showError(
    new Error(
      "Browser database updated in another tab. Reload to reopen it; originals remain retained.",
    ),
  );
});
function network() {
  $("network").textContent = navigator.onLine
    ? "Browser network hint: online. Only an actual server response proves acceptance."
    : "Browser network hint: offline. Committed local saves remain provisional.";
}
window.addEventListener("online", network);
window.addEventListener("offline", network);
network();
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && owner) {
    void verifyOwner(owner).catch((e) => {
      if (e instanceof HttpFailure) wipe();
    });
  }
});
await perform(async () => {
  if (!("serviceWorker" in navigator))
    throw new Error(
      "Service workers are unavailable. Offline navigation has not been prepared.",
    );
  const registration =
    (await navigator.serviceWorker.getRegistration("/offline/")) ??
    (await navigator.serviceWorker.register("/offline/sw.js", {
      scope: "/offline/",
      updateViaCache: "none",
    }));
  registration.addEventListener("updatefound", () => {
    $("shell-update").textContent =
      "A field shell update is downloading. Close other field tabs after saving; updates do not delete originals.";
  });
  await navigator.serviceWorker.ready;
  const active = await ownership();
  if (active?.locked) {
    wipe();
    notice(
      "Workspace is locked. Verify identity online to reopen only that owner’s saved work.",
    );
    return;
  }
  if (!active && localStorage.getItem("ppo-offline-marker"))
    notice(
      "Previous storage marker found but browser records are missing. Possible eviction or clearing: recover retained exports/server receipts before recapturing.",
    );
  try {
    const p = await api<Owner>("local-session");
    if (active?.owner && ownerKey(active.owner) !== ownerKey(p)) {
      wipe();
      await lockLocal();
    }
    await unlock(p);
    await activate(p, true);
  } catch (e) {
    if (e instanceof HttpFailure) {
      await lockLocal();
      wipe();
      throw e;
    }
    if (
      active?.owner &&
      !active.locked &&
      Date.now() - active.verified_at <= 86400000
    )
      await activate(active.owner, false);
    else {
      wipe();
      throw new Error(
        "Reconnect to verify the original owner. Cached identity is locked, unavailable or expired; originals have not been deleted.",
      );
    }
  }
  if (navigator.storage?.persist) await navigator.storage.persist();
  if (navigator.storage?.estimate) {
    const estimate = await navigator.storage.estimate();
    $("network").append(
      ` Browser storage usage ${estimate.usage ?? "unknown"} bytes of ${estimate.quota ?? "unknown"}; this is a capacity hint, not a save receipt.`,
    );
  }
}).finally(() => {
  // Do not accept a second identity operation before shell/ownership startup
  // has settled, including when startup reports a recoverable failure.
  $<HTMLButtonElement>("reconnect").disabled = false;
});

function renderReports(box: HTMLElement) {
  const cached = safeJob(),
    j = cached.job,
    section = element("section");
  section.append(
    element("h3", "Completion submission and customer response"),
    element(
      "p",
      "Offline actions remain local intents. Review and issue require the server. The cached content and versions may be stale; conflicting originals are retained without rewriting.",
    ),
  );
  const form = element("form"),
    end = field(
      form,
      "Submission attendance end (ISO timezone)",
      j.accepted_end_at ?? new Date().toISOString(),
    ),
    reason = field(form, "Submission reason", "", "textarea"),
    submit = element("button", "Save completion submission on this device");
  submit.type = "submit";
  form.append(submit);
  section.append(form);
  form.onsubmit = (e) => {
    e.preventDefault();
    void perform(async () => {
      submit.disabled = true;
      try {
        safeJob();
        if (!j.attendance)
          throw new Error(
            "Synchronise your original start and download its accepted attendance before preparing a completion submission. Your field originals remain retained.",
          );
        const a = await attendance(),
          rows = (await queue(requireOwner())).filter(
            (x) => x.original.appointment_id === j.id,
          );
        if (rows.some((x) => x.status.recovery))
          throw new Error(
            "Restricted-recovery evidence cannot enter normal submission. Resolve its owned disposition online.",
          );
        if (
          rows.some(
            (x) =>
              x.original.command === "SubmitCompletion" &&
              x.status.state !== "ServerSaved",
          )
        )
          throw new Error(
            "An original submission is already retained. Retry that exact original first.",
          );
        const localDraft = rows
            .filter(
              (x) =>
                x.original.command === "CompletionDraft" &&
                Number(x.original.payload.expected_version) + 1 >=
                  (j.draft?.version ?? 0),
            )
            .at(-1),
          d = j.draft_revisions[0];
        const pending = rows.filter(
          (x) =>
            x.status.state !== "ServerSaved" &&
            [
              "Start",
              "Capture",
              "Correct",
              "AttachmentInitiate",
              "AttachmentUpload",
              "AttachmentFinalise",
              "CompletionDraft",
            ].includes(x.original.command),
        );
        if (!localDraft && !d)
          throw new Error("Save an exact completion draft first.");
        if (pending.length && !localDraft)
          throw new Error(
            "Unsent evidence requires a new local completion draft with exact dependencies.",
          );
        if (
          localDraft &&
          pending.some(
            (x) =>
              x.original.operation_id !== localDraft.original.operation_id &&
              !localDraft.original.depends_on.includes(x.original.operation_id),
          )
        )
          throw new Error(
            "Evidence changed after the local draft. Save a successor draft before submission.",
          );
        const body = {
          id: j.report?.id ?? crypto.randomUUID(),
          attendance_id: a.id,
          draft_revision_id: localDraft
            ? { operation_id: localDraft.original.operation_id }
            : d.id,
          expected_draft_version: localDraft
            ? Number(localDraft.original.payload.expected_version) + 1
            : j.draft!.version,
          expected_report_version: j.report?.version ?? 0,
          expected_appointment_version: j.version,
          attendance_end_at: end.value,
          reason: reason.value,
        };
        submitCommand(j.id, {
          ...body,
          operation_id: crypto.randomUUID(),
          schema_version: 1,
          attendance_id:
            typeof a.id === "string"
              ? a.id
              : "00000000-0000-4000-8000-000000000000",
          draft_revision_id: localDraft
            ? "00000000-0000-4000-8000-000000000000"
            : d.id,
        });
        await commitOperations(requireOwner(), [
          await make(
            "SubmitCompletion",
            body,
            localDraft ? [localDraft.original.operation_id] : a.deps,
          ),
        ]);
        await renderQueue();
        notice(
          "Submission intent saved on this device. No submitted report or accepted attendance is claimed until the server accepts its exact draft and dependencies.",
        );
      } finally {
        submit.disabled = false;
      }
    });
  };
  for (const v of cached.report_presentations ?? []) {
    const panel = element("article"),
      show = element("div");
    panel.append(
      element("h4", `${v.kind} · exact cached content`),
      element("p", v.content_hash, "hash"),
      button("Present exact cached report", async () => {
        safeJob();
        if ((await sha256(v.html)) !== v.content_hash)
          throw new Error(
            "Cached presented bytes differ. Preserve originals and recover online.",
          );
        show.replaceChildren();
        const frame = element("iframe");
        frame.title = "Exact cached customer-safe report";
        frame.setAttribute("sandbox", "");
        frame.srcdoc = v.html;
        frame.style.width = "100%";
        frame.style.height = "520px";
        show.append(frame);
        const presentedAt = new Date().toISOString(),
          f = element("form"),
          choice = field(
            f,
            "Customer response",
            "Accepted",
            "text",
            responseChoices,
          ),
          name = field(f, "Stated respondent name (synthetic)"),
          role = field(f, "Stated respondent role"),
          remarks = field(
            f,
            "Response remarks / unavailable reason",
            "",
            "textarea",
          ),
          next = field(f, "Owned next contact action", "", "textarea"),
          signature = field(
            f,
            "Optional synthetic signature PNG",
            "",
            "file",
          ) as HTMLInputElement,
          save = element("button", "Save customer response on this device");
        signature.accept = "image/png";
        save.type = "submit";
        f.append(save);
        show.append(f);
        let responseSaved = false;
        f.onsubmit = (e) => {
          e.preventDefault();
          if (responseSaved || save.disabled) return;
          void perform(async () => {
            save.disabled = true;
            try {
              safeJob();
              let mark = null;
              const file = signature.files?.[0];
              if (file && choice.value !== "Unavailable") {
                if (file.size > 4194304)
                  throw new Error("Signature exceeds 4 MiB.");
                const bytes = new Uint8Array(await file.arrayBuffer());
                mark = {
                  sha256: await sha256(bytes),
                  byte_count: file.size,
                  content_base64: await base64(file),
                };
              }
              const body = {
                id: crypto.randomUUID(),
                presentation_id: v.id,
                revision_id: v.revision_id,
                presentation_kind: v.kind,
                presented_hash: v.content_hash,
                expected_report_version: v.report_version,
                response: choice.value,
                respondent_name:
                  choice.value === "Unavailable" ? null : name.value,
                respondent_role:
                  choice.value === "Unavailable" ? null : role.value,
                remarks: remarks.value || null,
                next_action: next.value || null,
                presented_at: presentedAt,
                captured_at: new Date().toISOString(),
                signature: mark,
                reason:
                  "Synthetic offline response to exact cached presentation.",
              };
              responseCommand(v.report_id, {
                ...body,
                operation_id: crypto.randomUUID(),
                schema_version: 1,
              });
              await commitOperations(requireOwner(), [
                await make("CustomerResponse", body, [], v.report_id),
              ]);
              responseSaved = true;
              await renderQueue();
              notice(
                "Response and exact presentation hash saved on this device. No server acknowledgement or distribution is claimed. Retry the retained original after reconnecting.",
              );
            } finally {
              save.disabled = responseSaved;
            }
          });
        };
      }),
    );
    panel.append(show);
    section.append(panel);
  }
  if (!cached.report_presentations?.length)
    section.append(
      element(
        "p",
        "No reviewed or issued presentation was downloaded. Complete online review and download its exact bytes before capturing an offline customer response.",
      ),
    );
  box.append(section);
}
