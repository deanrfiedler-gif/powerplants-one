"use client";
import Link from "next/link";
import { discoveryDefinition } from "../estimating/discovery-definition";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { DiscoveryInput } from "../estimating/discovery";
import type { DiscoveryRevision } from "../estimating/discovery-workspace-context";
import type {
  listDiscoveryWorkspaces,
  readDiscoveryWorkspace,
  previewDiscoveryCreate,
  previewDiscoveryChange,
} from "../estimating/discovery-workspaces";
import type { estimatingOptions } from "../estimating/reads";
import {
  api,
  ErrorNotice,
  Field,
  SelectField,
  PageHeader,
  ValidationFields,
} from "./business-ui";
import { denied, useCrmResource, useCrmCommand } from "./crm-state";
import {
  activeInput,
  answerText,
  blankDiscovery,
  DiscoveryFields,
  FollowUpFields,
  type FormOptions,
} from "./discovery-fields";
import "./estimating.css";
import "./discovery.css";
type Detail = Awaited<ReturnType<typeof readDiscoveryWorkspace>>;
type Command = ReturnType<typeof useCrmCommand>;
type Preview =
  | Awaited<ReturnType<typeof previewDiscoveryCreate>>
  | Awaited<ReturnType<typeof previewDiscoveryChange>>;
type Editor = {
  kind: "Save" | "Fresh" | "CopyDiscovery";
  optionId: string;
  siteId: string | null;
  scopeMode: string;
};
function Heading({
  title,
  description,
  register,
  children,
}: {
  title: string;
  description?: string;
  // A register's identity is in the shared breadcrumb; a workspace record keeps its visible heading.
  register?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <PageHeader
      variant={register ? "register" : "record"}
      eyebrow="Estimating · Synthetic"
      title={title}
      description={description}
      action={children}
    />
  );
}
function ResourceState({
  loading,
  error,
  reload,
}: {
  loading: boolean;
  error: unknown;
  reload: () => void;
}) {
  return (
    <>
      <ErrorNotice error={error} />
      {loading && <p role="status">Loading permitted discovery…</p>}
      {!!error && (
        <button type="button" className="secondary" onClick={reload}>
          Try loading again
        </button>
      )}
    </>
  );
}
function CommandState({ command }: { command: Command }) {
  return (
    <>
      <p role="status">{command.status}</p>
      <ErrorNotice error={command.error} />
      {command.uncertain && (
        <button
          type="button"
          disabled={command.busy}
          onClick={() => void command.reconcile()}
        >
          Confirm original save outcome
        </button>
      )}
    </>
  );
}
export function ScopeView({
  input,
  context,
}: {
  input: DiscoveryInput;
  context?: DiscoveryRevision["observed_context"];
}) {
  return (
    <>
      <p>
        <strong>Effort:</strong> {input.effort.value}
        {input.effort.source ? ` · ${input.effort.source}` : ""}
      </p>
      <p>
        <strong>Site:</strong>{" "}
        {context?.site?.display_name ??
          (input.scope.mode === "Site"
            ? "Selected existing Site"
            : input.scope.mode === "Unknown"
              ? "Unknown"
              : "No Site required")}
        {input.scope.site_reason ? ` · ${input.scope.site_reason}` : ""}
      </p>
      {input.scope.follow_up && (
        <p>Site follow-up: {input.scope.follow_up.reason}</p>
      )}
      {input.effort.follow_up && (
        <p>Effort follow-up: {input.effort.follow_up.reason}</p>
      )}
      <p>
        Work systems:{" "}
        {input.scope.systems
          .map((s) => s.tag.replace(/([a-z])([A-Z])/g, "$1 $2"))
          .join(", ") || "None selected"}
      </p>
      {context &&
        input.scope.systems.map((system) => (
          <p key={system.tag}>
            {system.tag.replace(/([a-z])([A-Z])/g, "$1 $2")} Facilities:{" "}
            {system.facility_ids
              .map(
                (id) =>
                  context.facilities.find((f) => f.id === id)?.name ??
                  "Saved Facility",
              )
              .join(", ") || "None selected"}
          </p>
        ))}
      {context && (
        <>
          <p>
            Facilities:{" "}
            {context.facilities.map((f) => f.name).join(", ") ||
              "None selected"}
          </p>
          <p>
            Equipment:{" "}
            {context.equipment
              .map(
                (e) =>
                  `${e.display_number} · ${e.description} · ${e.identity_status} · ${e.lifecycle_status}`,
              )
              .join("; ") || "None selected"}
          </p>
        </>
      )}
      {input.scope.unsupported_scope && (
        <p>
          Additional scope follow-up: {input.scope.unsupported_scope.reason}
        </p>
      )}
      <dl className="e2-answers">
        {input.answers.map((a) => (
          <div key={a.question_id}>
            <dt>
              {a.question_id} ·{" "}
              {
                discoveryDefinition.questions.find(
                  (q) => q.id === a.question_id,
                )?.label
              }{" "}
              · {a.state}
            </dt>
            <dd>
              {answerText(a.value)}
              {a.source && <small>Source: {a.source}</small>}
              {a.follow_up && <small>Follow-up: {a.follow_up.reason}</small>}
            </dd>
          </div>
        ))}
      </dl>
    </>
  );
}
function RevisionView({ revision: r }: { revision: DiscoveryRevision }) {
  return (
    <section
      className="est-panel e2-snapshot"
      aria-label={`Saved discovery revision ${r.version}`}
    >
      <h3>
        Saved revision {r.version} ·{" "}
        {r.scope_readiness === "NotRecorded"
          ? "Questionnaire not recorded"
          : r.scope_readiness}
      </h3>
      <p className="est-narrative">{r.reason}</p>
      {r.kind === "LegacyManual" ? (
        <p>
          This retains the original manual estimate identity.{" "}
          <Link href={`/estimating/estimates/${r.legacy_estimate_id}`}>
            Open the manual workbook and exact draft history
          </Link>
          .
        </p>
      ) : (
        r.input && (
          <>
            <ScopeView input={r.input} context={r.observed_context} />
            <p>
              {r.input.definition_id} · {r.input.definition_revision}
            </p>
            {r.retained_hidden_answers.length > 0 && (
              <details>
                <summary>
                  Retained hidden answers ({r.retained_hidden_answers.length})
                </summary>
                <p>
                  These saved answers do not contribute to current readiness.
                </p>
                {r.retained_hidden_answers.map((a) => (
                  <p key={a.question_id}>
                    {a.question_id} ·{" "}
                    {
                      discoveryDefinition.questions.find(
                        (q) => q.id === a.question_id,
                      )?.label
                    }{" "}
                    · {a.state} · {answerText(a.value)}
                  </p>
                ))}
              </details>
            )}
            <details>
              <summary>Snapshot identity and attribution</summary>
              <dl className="est-hashes">
                <dt>Scope snapshot</dt>
                <dd>{r.scope_snapshot_id}</dd>
                <dt>Answer snapshot</dt>
                <dd>{r.answer_snapshot_id}</dd>
                <dt>Content SHA-256</dt>
                <dd>{r.content_hash}</dd>
                {r.copied_from_id && (
                  <>
                    <dt>Copied source revision</dt>
                    <dd>{r.copied_from_id}</dd>
                  </>
                )}
              </dl>
              {Object.entries(r.answer_attribution).map(([id, a]) => (
                <p key={id}>
                  {id} · Recorded{" "}
                  {new Date(a.recorded_at).toLocaleString("en-AU")}
                  {a.confirmed_at
                    ? ` · Confirmed ${new Date(a.confirmed_at).toLocaleString("en-AU")} by ${a.confirmed_by}`
                    : " · Confirmation not recorded"}
                </p>
              ))}
            </details>
          </>
        )
      )}
    </section>
  );
}
export function DiscoveryList() {
  const data = useCrmResource<
    Awaited<ReturnType<typeof listDiscoveryWorkspaces>>
  >("estimating/workspaces");
  return (
    <div className="est-screen">
      <Link href="/estimating">Estimating intake & workload</Link>
      <Heading title="Scope and options">
        <Link className="button" href="/estimating/discovery/new">
          New discovery workspace
        </Link>
      </Heading>
      <p>
        One selected option per opportunity. Saved discovery records scope and
        questions. Complete selected discovery can be reviewed for manual costing; Excel import remains separate.
      </p>
      <ResourceState {...data} />
      {data.data && (
        <>
          <p>
            Up to {data.data.limit} permitted workspaces, most recently changed
            first.
          </p>
          {!data.data.items.length && (
            <p>No discovery workspaces are available.</p>
          )}
          {data.data.items.map((w) => (
            <article className="est-panel" key={w.id}>
              <h2>
                <Link href={`/estimating/discovery/${w.id}`}>
                  {w.display_number} · {w.title}
                </Link>
              </h2>
              {w.options.map((o) => (
                <p key={o.id}>
                  Option {o.label} ·{" "}
                  {o.id === w.selected_option_id
                    ? "Selected basis"
                    : "Alternative"}{" "}
                  · {o.state} · Revision {o.revision} · {o.scope_readiness}
                </p>
              ))}
            </article>
          ))}
        </>
      )}
    </div>
  );
}
export function NewDiscovery() {
  const choices =
      useCrmResource<Awaited<ReturnType<typeof estimatingOptions>>>(
        "estimating/options",
      ),
    params = useSearchParams(),
    [selected, setSelected] = useState(params.get("opportunity") ?? ""),
    [pending, setPending] = useState(false);
  return (
    <div className="est-screen">
      <Link href="/estimating/discovery">Scope and options</Link>
      <Heading title="New discovery workspace" />
      <ResourceState {...choices} />
      {choices.data && (
        <>
          <fieldset className="est-form" disabled={pending}>
            <SelectField
              label="Existing opportunity"
              name="opportunity_id"
              value={selected}
              options={choices.data.items.map((o) => ({
                id: o.id,
                display_name: `${o.display_number} · ${o.title} · ${o.customer}`,
              }))}
              onChange={setSelected}
            />
          </fieldset>
          {!choices.data.items.length && (
            <p>
              No eligible opportunities without an estimating workspace are
              available. <Link href="/sales/opportunities">Open CRM Sales</Link>.
            </p>
          )}
          {selected && (
            <NewDiscoveryContext
              key={selected}
              opportunityId={selected}
              onPending={setPending}
            />
          )}
        </>
      )}
    </div>
  );
}
function NewDiscoveryContext({
  opportunityId,
  onPending,
}: {
  opportunityId: string;
  onPending: (pending: boolean) => void;
}) {
  const options = useCrmResource<FormOptions>(
      `estimating/workspaces/form-options?opportunity_id=${opportunityId}`,
    ),
    router = useRouter(),
    command = useCrmCommand(
      (r) => router.push(`/estimating/discovery/${r.record_id}`),
      "Unsaved",
      onPending,
    );
  if (denied(command.error)) return <ErrorNotice error={command.error} />;
  return (
    <>
      <ResourceState {...options} />
      {options.data && (
        <ProposalEditor
          initialOptions={options.data}
          opportunityId={opportunityId}
          command={command}
        />
      )}
      <CommandState command={command} />
    </>
  );
}
export function ProposalEditor({
  initialOptions,
  opportunityId,
  command,
  detail,
  editor,
  onCancel,
}: {
  initialOptions: FormOptions;
  opportunityId: string;
  command: Command;
  detail?: Detail;
  editor?: Editor;
  onCancel?: () => void;
}) {
  const initial = detail?.options.find((x) => x.option.id === editor?.optionId),
    [base, setBase] = useState(() =>
      detail
        ? {
            version: detail.workspace.version,
            revisionId: initial!.revision.id,
            revision: initial!.revision,
          }
        : null,
    ),
    [draft, setDraft] = useState<DiscoveryInput>(() => {
      if (editor?.kind === "Save" && initial?.revision.input) {
        const r = initial.revision;
        return {
          ...r.input!,
          answers: [
            ...r.input!.answers,
            ...r.retained_hidden_answers.filter(
              (a) =>
                !r.input!.answers.some((x) => x.question_id === a.question_id),
            ),
          ],
        };
      }
      return blankDiscovery(
        initialOptions,
        initial?.revision.site_id ?? initialOptions.opportunity.site_id,
      );
    }),
    [copy, setCopy] = useState({
      owner_id: initialOptions.owner.id,
      reason: "",
    }),
    [label, setLabel] = useState(""),
    [copyAllocation] = useState(() => crypto.randomUUID()),
    [reason, setReason] = useState(""),
    [comparison, setComparison] = useState<{
      preview: Preview;
      proposal: Record<string, unknown>;
    } | null>(null),
    [confirmations, setConfirmations] = useState<string[]>([]),
    [previewBusy, setPreviewBusy] = useState(false),
    [previewError, setPreviewError] = useState<unknown>(null);
  const copied = editor?.kind === "CopyDiscovery",
    scope = copied ? base!.revision.input!.scope : draft.scope;
  const options = useCrmResource<FormOptions>(
    `estimating/workspaces/form-options?opportunity_id=${opportunityId}&scope_mode=${scope.mode}${scope.site_id ? `&site_id=${scope.site_id}` : ""}${detail ? `&workspace_id=${detail.workspace.id}` : ""}`,
    true,
  );
  const frozen = command.busy || command.uncertain || previewBusy,
    stale = !!detail && base!.version !== detail.workspace.version,
    current = detail?.options.find((x) => x.option.id === editor?.optionId);
  function dirty() {
    setComparison(null);
    setConfirmations([]);
    setPreviewError(null);
    command.clearError();
    command.dirty();
  }
  async function preview() {
    setPreviewBusy(true);
    setPreviewError(null);
    setComparison(null);
    setConfirmations([]);
    const proposal: Record<string, unknown> = detail
      ? {
          kind: editor!.kind === "Save" ? "Save" : "Branch",
          option_id: editor!.optionId,
          expected_version: base!.version,
          expected_revision_id: base!.revisionId,
          ...(editor!.kind === "Save" ? {} : { branch_mode: editor!.kind }),
          ...(copied
            ? { copy_follow_up: copy, ...(base?.revision.input?.configuration ? { copy_allocation_id: copyAllocation } : {}) }
            : { discovery: activeInput(draft, initialOptions) }),
        }
      : {
          opportunity_id: opportunityId,
          discovery: activeInput(draft, initialOptions),
        };
    try {
      const result = await api<Preview>(
        detail
          ? `estimating/workspaces/${detail.workspace.id}/preview`
          : "estimating/workspaces/preview",
        proposal,
      );
      setComparison({ preview: result, proposal });
    } catch (error) {
      setPreviewError(error);
    } finally {
      setPreviewBusy(false);
    }
  }
  async function save() {
    if (!comparison) return;
    const v = comparison.preview;
    await command.send(
      detail
        ? `estimating/workspaces/${detail.workspace.id}`
        : "estimating/workspaces",
      {
        ...comparison.proposal,
        revision_id: crypto.randomUUID(),
        context_hash: v.context_hash,
        confirmed_question_ids: confirmations,
        reason,
        ...(detail
          ? {
              comparison_hash: "comparison_hash" in v ? v.comparison_hash : "",
              ...(editor!.kind !== "Save"
                ? { new_option_id: crypto.randomUUID(), label }
                : {}),
            }
          : {
              id: crypto.randomUUID(),
              option_id: crypto.randomUUID(),
              expected_opportunity_version:
                "expected_opportunity_version" in v
                  ? v.expected_opportunity_version
                  : 0,
            }),
      },
    );
  }
  if (denied(options.error) || denied(previewError))
    return <ErrorNotice error={options.error ?? previewError} />;
  const available = options.data ?? {
    ...initialOptions,
    facilities: [],
    equipment: [],
    owners: [],
  };
  return (
    <section className="est-panel e2-editor" aria-label="Discovery proposal">
      <h2>
        {!editor
          ? "Create option A"
          : editor.kind === "Save"
            ? "Edit discovery"
            : editor.kind === "Fresh"
              ? "New alternative with fresh discovery"
              : "Copy discovery to a new alternative"}
      </h2>
      <p>
        Entries remain in this page until saved. Leaving or changing identity
        discards unsaved entries.
      </p>
      {!editor && <p>For a first incomplete save, choose at least one work tag, declare the Site scope and record an eligible owner and a reason for each unknown. Blank required details need attention; no answer or confirmation is filled for you.</p>}
      {stale && (
        <div className="est-note" role="alert">
          <p>
            The workspace has changed to version {detail!.workspace.version}.
            Your proposal is retained.
          </p>
          <details>
            <summary>Compare current saved revision before continuing</summary>
            {current && <RevisionView revision={current.revision} />}
            <button
              type="button"
              className="secondary"
              disabled={frozen || current?.option.state !== "Active"}
              onClick={() => {
                setBase({
                  version: detail!.workspace.version,
                  revisionId: current!.revision.id,
                  revision: current!.revision,
                });
                dirty();
              }}
            >
              Keep my proposal and compare against the current revision
            </button>
          </details>
        </div>
      )}
      <ResourceState {...options} />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void preview();
        }}
      >
        <ValidationFields error={previewError ?? command.error}>
          <fieldset
            className="est-form"
            disabled={
              frozen || !options.data || (!detail?.can_edit && !!detail)
            }
          >
            {editor && editor.kind !== "Save" && (
              <Field
                label="New option label"
                name="label"
                value={label}
                onChange={(v) => {
                  setLabel(v);
                  dirty();
                }}
                required
                maxLength={80}
              />
            )}{" "}
            {copied ? (
              <>
                <p>
                  Only saved discovery is copied. Confirmed answers start
                  unconfirmed with the follow-up below. This alternative remains
                  unselected.
                </p>
                <FollowUpFields
                  label="Copied answers"
                  value={copy}
                  owners={available.owners}
                  onChange={(v) => {
                    setCopy(v);
                    dirty();
                  }}
                />
              </>
            ) : (
              <DiscoveryFields
                value={draft}
                options={available}
                onChange={(v) => {
                  setDraft(v);
                  dirty();
                }}
              />
            )}
            <Field
              label="Discovery change reason"
              name="reason"
              value={reason}
              onChange={(v) => {
                setReason(v);
                dirty();
              }}
              required
              maxLength={1000}
            />
            <button type="submit" disabled={stale}>
              {previewBusy ? "Comparing…" : "Compare discovery proposal"}
            </button>
          </fieldset>
        </ValidationFields>
      </form>
      <ErrorNotice error={previewError} />
      {comparison && (
        <section
          className="est-panel e2-comparison"
          aria-label="Discovery comparison"
        >
          <h3>Review the proposed saved basis</h3>
          <p>
            Proposed readiness:{" "}
            <strong>{comparison.preview.compiled.scope_readiness}</strong>.
            Delivery routing: Not configured. After saving Complete discovery,
            review its exact basis separately for manual costing.
          </p>
          <ScopeView
            input={comparison.preview.compiled.input}
            context={comparison.preview.references}
          />
          {detail && (
            <details>
              <summary>Previous saved basis</summary>
              {base && <RevisionView revision={base.revision} />}
            </details>
          )}
          <p>
            {comparison.preview.compiled.open_items.length} owned follow-up
            items.
          </p>
          {comparison.preview.compiled.open_items.map((item) => (
            <p key={item.key}>
              {item.key}: {item.follow_up.reason} ·{" "}
              {available.owners.find((o) => o.id === item.follow_up.owner_id)
                ?.display_name ?? "Saved owner"}
              {item.blocks_scope ? " · Keeps scope Incomplete" : ""}
            </p>
          ))}
          <fieldset className="est-form" disabled={frozen || stale}>
            {comparison.preview.required_confirmation_ids.map((id) => (
              <label key={id} className="e2-check">
                <input
                  type="checkbox"
                  checked={confirmations.includes(id)}
                  onChange={(e) =>
                    setConfirmations(
                      e.target.checked
                        ? [...confirmations, id]
                        : confirmations.filter((x) => x !== id),
                    )
                  }
                />
                I confirm {id} in this exact proposal
              </label>
            ))}
            <button
              type="button"
              disabled={
                frozen ||
                stale ||
                comparison.preview.required_confirmation_ids.some(
                  (id) => !confirmations.includes(id),
                ) ||
                (!!detail && !detail.can_edit)
              }
              onClick={() => void save()}
            >
              {command.busy
                ? "Saving…"
                : detail
                  ? editor!.kind === "Save"
                    ? "Save discovery revision"
                    : "Create alternative"
                  : "Create discovery workspace"}
            </button>
          </fieldset>
        </section>
      )}
      {onCancel && (
        <button
          type="button"
          className="secondary"
          disabled={frozen}
          onClick={onCancel}
        >
          Cancel this proposal
        </button>
      )}
    </section>
  );
}
function SavedHistory({
  workspaceId,
  revisionId,
  onBack,
}: {
  workspaceId: string;
  revisionId: string;
  onBack: (id: string) => void;
}) {
  const data = useCrmResource<DiscoveryRevision>(
    `estimating/workspaces/${workspaceId}/revisions?revision_id=${revisionId}`,
    true,
  );
  return (
    <>
      <ResourceState {...data} />
      {data.data && (
        <>
          <RevisionView revision={data.data} />
          {data.data.predecessor_id && (
            <button
              type="button"
              className="secondary"
              onClick={() => onBack(data.data!.predecessor_id!)}
            >
              View preceding revision
            </button>
          )}
        </>
      )}
    </>
  );
}
export function LegacyDiscoveryDetail({ id }: { id: string }) {
  const data = useCrmResource<Detail>(`estimating/workspaces/${id}`),
    [view, setView] = useState<string | null>(null),
    [editor, setEditor] = useState<Editor | null>(null),
    [history, setHistory] = useState<string | null>(null),
    [accepted, setAccepted] = useState(0),
    [action, setAction] = useState<{
      action: "Select" | "Archive" | "Reopen";
      optionId: string;
      version: number;
      revisionId: string;
      selectedId: string;
    } | null>(null),
    [reason, setReason] = useState("");
  const command = useCrmCommand((r) => {
    setAccepted(r.record_version);
    setEditor(null);
    setAction(null);
    setHistory(null);
    setReason("");
    data.reload();
  }, "Saved workspace");
  const d = data.data,
    selected = d?.options.find(
      (x) => x.option.id === (view ?? d.workspace.selected_option_id),
    ),
    frozen = command.busy || command.uncertain,
    waiting = !!d && accepted > d.workspace.version;
  const options = useCrmResource<FormOptions>(
    d && editor
      ? `estimating/workspaces/form-options?opportunity_id=${d.workspace.opportunity_id}&workspace_id=${id}&scope_mode=${editor.scopeMode}${editor.siteId ? `&site_id=${editor.siteId}` : ""}`
      : null,
  );
  if (denied(command.error))
    return (
      <div className="est-screen">
        <ErrorNotice error={command.error} />
      </div>
    );
  function edit(kind: Editor["kind"]) {
    if (selected)
      setEditor({
        kind,
        optionId: selected.option.id,
        siteId: selected.revision.site_id,
        scopeMode: selected.revision.input?.scope.mode ?? "Site",
      });
  }
  function choose(kind: "Select" | "Archive" | "Reopen") {
    if (!d || !selected) return;
    setAction({
      action: kind,
      optionId: selected.option.id,
      version: d.workspace.version,
      revisionId: selected.revision.id,
      selectedId: d.workspace.selected_option_id,
    });
    setEditor(null);
    setReason("");
    command.dirty();
  }
  return (
    <div className="est-screen">
      <Link href="/estimating/discovery">Scope and options</Link>
      <ResourceState {...data} />
      {d && (
        <>
          <Heading title="Estimating workspace" />
          <p>
            Saved workspace version {d.workspace.version} ·{" "}
            <Link href={`/sales/opportunities/${d.workspace.opportunity_id}`}>
              Open the sales opportunity
            </Link>
          </p>
          <p>
            Delivery routing: Not configured. Complete selected discovery can
            be reviewed for manual costing. Selection keeps one estimating basis and does not change
            the CRM forecast or a saved quotation.
          </p>
          <div className="e2-options" aria-label="Saved options">
            {d.options.map(({ option: o, revision: r }) => (
              <button
                type="button"
                key={o.id}
                className="secondary"
                aria-pressed={selected?.option.id === o.id}
                disabled={frozen || !!editor || !!action || waiting}
                onClick={() => {
                  setView(o.id);
                  setHistory(null);
                }}
              >
                Option {o.label} ·{" "}
                {o.id === d.workspace.selected_option_id
                  ? "Selected basis"
                  : "Alternative"}{" "}
                · {o.state} · r{r.version}
              </button>
            ))}
          </div>
          {!d.can_edit && (
            <p className="est-note">
              Current permission, estimating ownership or commercial state holds
              new changes. Permitted original history remains available.
            </p>
          )}
          {waiting ? (
            <p role="status">Save accepted. Loading the saved workspace…</p>
          ) : (
            selected && (
              <>
                <div className="est-actions">
                  {!frozen && !editor && !action && d.can_edit && selected.option.state === "Active" && selected.option.id === d.workspace.selected_option_id && selected.revision.kind === "Discovery" && selected.revision.scope_readiness === "Complete" && (
                    <Link className="button" href={`/estimating/discovery/${id}/costing?option=${selected.option.id}`}>Review scope for manual costing</Link>
                  )}
                  <button
                    type="button"
                    className="secondary"
                    disabled={frozen || !!editor || !!action}
                    onClick={() => setHistory(selected.revision.id)}
                  >
                    View current saved revision
                  </button>
                  {!editor && !action && (
                    <fieldset
                      className="est-form est-actions"
                      disabled={frozen || !d.can_edit}
                    >
                      {selected.option.state === "Active" ? (
                        <>
                          {selected.revision.kind === "Discovery" && (
                            <button type="button" onClick={() => edit("Save")}>
                              Edit discovery
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={d.options.length >= 10}
                            onClick={() => edit("Fresh")}
                          >
                            Create fresh alternative
                          </button>
                          {selected.revision.kind === "Discovery" && (
                            <button
                              type="button"
                              disabled={d.options.length >= 10}
                              onClick={() => edit("CopyDiscovery")}
                            >
                              Copy discovery to alternative
                            </button>
                          )}
                          {selected.option.id !==
                            d.workspace.selected_option_id && (
                            <>
                              <button
                                type="button"
                                onClick={() => choose("Select")}
                              >
                                Select this option
                              </button>
                              <button
                                type="button"
                                className="secondary"
                                onClick={() => choose("Archive")}
                              >
                                Archive this option
                              </button>
                            </>
                          )}
                        </>
                      ) : (
                        <button type="button" onClick={() => choose("Reopen")}>
                          Reopen this option
                        </button>
                      )}
                    </fieldset>
                  )}
                </div>
                {history ? (
                  <SavedHistory
                    workspaceId={id}
                    revisionId={history}
                    onBack={setHistory}
                  />
                ) : (
                  !editor && <RevisionView revision={selected.revision} />
                )}{" "}
                {editor && (
                  <>
                    <ResourceState {...options} />
                    {options.data && (
                      <ProposalEditor
                        key={`${editor.optionId}:${editor.kind}`}
                        initialOptions={options.data}
                        opportunityId={d.workspace.opportunity_id}
                        command={command}
                        detail={d}
                        editor={editor}
                        onCancel={() => setEditor(null)}
                      />
                    )}
                  </>
                )}
                {action && (
                  <form
                    className="est-panel"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void command.send(`estimating/workspaces/${id}/options`, {
                        action: action.action,
                        option_id: action.optionId,
                        expected_version: action.version,
                        expected_revision_id: action.revisionId,
                        expected_selected_option_id: action.selectedId,
                        reason,
                      });
                    }}
                  >
                    <h2>
                      {action.action} option {selected.option.label}
                    </h2>
                    {action.version !== d.workspace.version && (
                      <p role="alert">
                        The saved selection changed. Cancel and review the
                        current options before creating a new action.
                      </p>
                    )}
                    <fieldset
                      className="est-form"
                      disabled={
                        frozen ||
                        !d.can_edit ||
                        action.version !== d.workspace.version
                      }
                    >
                      <Field
                        label="Option action reason"
                        name="reason"
                        value={reason}
                        onChange={(v) => {
                          setReason(v);
                          command.dirty();
                        }}
                        maxLength={1000}
                        required
                      />
                      <button type="submit">
                        Confirm {action.action.toLowerCase()}
                      </button>
                    </fieldset>
                    <button
                      type="button"
                      className="secondary"
                      disabled={frozen}
                      onClick={() => setAction(null)}
                    >
                      Cancel option action
                    </button>
                  </form>
                )}
              </>
            )
          )}
          <CommandState command={command} />
        </>
      )}
    </div>
  );
}
