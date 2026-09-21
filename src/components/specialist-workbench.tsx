"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { api, ErrorNotice } from "./business-ui";
import { useIdentity } from "./business-session";
import { denied, useCrmResource } from "./crm-state";
import { useScopePreferences } from "./scope-preferences";
import { useDiscoveryNavigation } from "./discovery-navigation";
import { SecondaryMenuFrame, useSecondaryMenu } from "../shell/secondary-menu";
import {
  definition,
  views,
  viewLabels,
  groupLabels,
  emptyPrice,
} from "../estimating/specialist/definition";
import type {
  DraftProposal,
  Decision,
  Position,
  NativePriceProposal,
} from "../estimating/specialist/types";
import type {
  readConfiguration,
  listConfigurations,
  creationOptions,
  readHistory,
} from "../estimating/specialist/reads";
import type { previewConfiguration } from "../estimating/specialist/service";
import type { previewReceiving } from "../estimating/specialist/receiving";
import type { previewRebase } from "../estimating/specialist/source";
import { useSpecialistCommand } from "./specialist-recovery";
import { SpecialistDiagrams } from "./specialist-diagrams";
import "./specialist-workbench.css";
type Detail = Awaited<ReturnType<typeof readConfiguration>>;
type Preview = Awaited<ReturnType<typeof previewConfiguration>>;
type Receiving = Awaited<ReturnType<typeof previewReceiving>>;
type Options = Awaited<ReturnType<typeof creationOptions>>;
const basePath = "estimating/configurations";
const readable = (value: string | Date) =>
  new Date(value).toLocaleString("en-AU", {
    timeZone: "Australia/Brisbane",
    timeZoneName: "short",
  });
function Dialog({
  title,
  close,
  children,
  wide = false,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null,
      d = ref.current!;
    d.showModal();
    return () => {
      d.close();
      if (opener?.isConnected) opener.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`es08-dialog ${wide ? "es08-inspector" : ""}`}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <header>
        <h2>{title}</h2>
        <button onClick={close} aria-label={`Close ${title}`}>
          Close
        </button>
      </header>
      {children}
    </dialog>
  );
}
function Frame({
  id,
  view,
  children,
  message = "",
}: {
  id?: string;
  view?: string;
  children: ReactNode;
  message?: string;
}) {
  const identity = useIdentity(),
    preferences = useScopePreferences(
      `${identity.workspace_id}:${identity.actor_id}:es08`,
    ),
    menu = useSecondaryMenu(preferences.value.menu, (open) =>
      preferences.save({ ...preferences.value, menu: open }),
    );
  return (
    <SecondaryMenuFrame
      state={menu}
      id="ppo-specialist"
      name="Specialist configuration"
      menuId="es08-menu"
      contentId="es08-content"
      message={message}
      menu={
        <>
          <Link className="es08-back" href="/estimating">
            ← Back to estimating
          </Link>
          <h2 className="es08-menu-title">Specialist configuration</h2>
          <nav aria-label="Specialist configuration views">
            <Link
              href="/estimating/configurations"
              aria-current={!id ? "page" : undefined}
            >
              Configurations
            </Link>
            {id &&
              views.map((v, i) => (
                <Link
                  key={v}
                  href={`/estimating/configurations/${id}/${v}`}
                  aria-current={view === v ? "page" : undefined}
                >
                  {viewLabels[i]}
                </Link>
              ))}
            <Link href="/estimating/discovery">Discovery workspaces</Link>
          </nav>
          <p className="es08-menu-note">
            Screen Systems
            <br />
            Synthetic review
            <br />
            Engineering approval remains open
          </p>
        </>
      }
    >
      {children}
    </SecondaryMenuFrame>
  );
}
export function SpecialistRegister() {
  const [search, setSearch] = useState(""),
    [state, setState] = useState("Active"),
    [before, setBefore] = useState<string | null>(null),
    query = useSearchParams(),
    workspace = query.get("estimating_workspace_id"),
    resource = useCrmResource<Awaited<ReturnType<typeof listConfigurations>>>(
      `${basePath}?state=${state}&search=${encodeURIComponent(search)}${workspace ? `&estimating_workspace_id=${workspace}` : ""}${before ? `&before=${before}` : ""}`,
      true,
    );
  return (
    <Frame>
      <div className="es08-scroll">
        <header className="es08-title">
          <h1>Specialist configurations</h1>
          <p>
            Saved technical inputs, calculation evidence and reviewed estimate
            contributions.
          </p>
          {resource.data?.can_create && (
            <Link
              className="es08-primary"
              href={`/estimating/configurations/new${workspace ? `?estimating_workspace_id=${workspace}${query.get("option_id") ? `&option_id=${query.get("option_id")}` : ""}` : ""}`}
            >
              New configuration
            </Link>
          )}
        </header>
        <div className="es08-toolbar">
          <label>
            Search configurations
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setBefore(null);
              }}
            />
          </label>
          <label>
            Lifecycle
            <select
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                setBefore(null);
              }}
            >
              <option>Active</option>
              <option>Archived</option>
            </select>
          </label>
        </div>
        <ErrorNotice error={resource.error} />
        {resource.loading && (
          <p role="status">Loading permitted configurations…</p>
        )}
        {resource.data && (
          <div
            className="es08-table-scroll"
            tabIndex={0}
            aria-label="Configuration register"
          >
            <table>
              <thead>
                <tr>
                  {[
                    "Configuration",
                    "Family",
                    "Alternative",
                    "Coverage",
                    "Source discovery",
                    "Review run",
                    "Owner",
                    "Updated",
                  ].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resource.data.items.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link
                        href={`/estimating/configurations/${c.id}/configure`}
                      >
                        {c.name}
                      </Link>
                      <small>
                        Draft v{c.version} · {c.state}
                      </small>
                    </td>
                    <td>Screen Systems</td>
                    <td>{c.option_label}</td>
                    <td>
                      {c.coverage.facility_ids.length} Facilities ·{" "}
                      {c.coverage.area_ids.length} areas
                    </td>
                    <td>
                      Revision {c.source_revision}
                      <small>{c.scope_readiness}</small>
                    </td>
                    <td>
                      {c.current_run_id
                        ? c.current_run_id.slice(0, 8)
                        : "No saved run"}
                    </td>
                    <td>{c.owner_id.slice(0, 8)}</td>
                    <td>{readable(c.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {resource.data?.items.length === 0 && (
          <p>
            {search
              ? "No permitted configurations match these filters."
              : "No configurations in this scope yet. Start from a saved discovery revision."}
          </p>
        )}
        <div className="es08-toolbar">
          {before && (
            <button onClick={() => setBefore(null)}>First page</button>
          )}
          {resource.data?.next_cursor && (
            <button onClick={() => setBefore(resource.data!.next_cursor)}>
              Next page
            </button>
          )}
        </div>
      </div>
    </Frame>
  );
}
export function SpecialistCreate() {
  const query = useSearchParams(),
    workspace = query.get("estimating_workspace_id"),
    resource = useCrmResource<Options>(
      `${basePath}/options${workspace ? `?estimating_workspace_id=${workspace}` : ""}`,
      true,
    );
  return (
    <Frame>
      <div className="es08-scroll">
        <h1>New Screen Systems configuration</h1>
        <p>
          Choose an exact saved source. Creation saves a durable draft and
          creates no calculation run or cost lines.
        </p>
        <ErrorNotice error={resource.error} />
        {resource.data && <CreateForm options={resource.data} />}
      </div>
    </Frame>
  );
}
function CreateForm({ options }: { options: Options }) {
  const router = useRouter(),
    query = useSearchParams(),
    [index, setIndex] = useState(() =>
      Math.max(
        0,
        options.sources.findIndex(
          (s) => s.option_id === query.get("option_id"),
        ),
      ),
    ),
    [name, setName] = useState("Screen Systems study"),
    [id] = useState(() => query.get("configuration_id") ?? crypto.randomUUID()),
    [coverage, setCoverage] = useState("FacilityScope"),
    source = options.sources[index],
    command = useSpecialistCommand(options, id, async () => {
      router.push(`/estimating/configurations/${id}/configure`);
    });
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("configuration_id", id);
    window.history.replaceState(null, "", url);
  }, [id]);
  if (!source)
    return (
      <p>
        No editable saved discovery source is available.{" "}
        <Link href="/estimating/discovery">Save discovery first.</Link>
      </p>
    );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const system = source.configuration?.systems.find(
          (s) => s.id === coverage,
        );
        void command.send(basePath, "CreateSpecialistConfiguration", {
          id,
          name,
          estimating_workspace_id: source.estimating_workspace_id,
          option_id: source.option_id,
          revision_id: source.revision_id,
          expected_workspace_version: source.expected_workspace_version,
          coverage: {
            kind: system ? "StructuredSystem" : "FacilityScope",
            system_id: system?.id ?? null,
            area_ids: system?.coverage.area_ids ?? [],
            facility_ids: system ? [] : source.facility_ids,
          },
          proposal: source.proposal,
          reason:
            "Create a scoped specialist review draft from the selected saved discovery",
        });
      }}
      className="es08-form"
    >
      <label>
        Configuration name
        <input
          required
          maxLength={200}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label>
        Saved source
        <select
          value={index}
          onChange={(e) => {
            setIndex(Number(e.target.value));
            setCoverage("FacilityScope");
          }}
        >
          {options.sources.map((s, i) => (
            <option key={s.revision_id} value={i}>
              {s.site} · {s.option_label} · discovery {s.revision} ·{" "}
              {s.scope_readiness}
            </option>
          ))}
        </select>
      </label>
      <label>
        Explicit coverage
        <select value={coverage} onChange={(e) => setCoverage(e.target.value)}>
          <option value="FacilityScope">
            Saved Facility scope ({source.facility_ids.length} Facilities)
          </option>
          {source.configuration?.systems.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} · {s.coverage.mode}
            </option>
          ))}
        </select>
      </label>
      <p>
        Defaults retain recovered or synthetic assumption provenance. They are
        not confirmed customer requirements.
      </p>
      <ErrorNotice error={command.error} />
      <button
        className="es08-primary"
        disabled={command.busy || command.pending}
      >
        Create configuration
      </button>
      <p role="status">{command.status}</p>
      {command.pending && (
        <>
          <button
            type="button"
            disabled={command.busy}
            onClick={() => command.recover(command.canRetry)}
          >
            Recover original creation
          </button>
          <button
            type="button"
            disabled={command.busy}
            onClick={() => command.resolve()}
          >
            Resolve original outcome
          </button>
        </>
      )}
    </form>
  );
}
export function SpecialistWorkspace({ id }: { id: string }) {
  const path = usePathname(),
    view = path.split("/").at(-1) ?? "configure",
    resource = useCrmResource<Detail>(`${basePath}/${id}`, true);
  if (!views.includes(view as (typeof views)[number]))
    return (
      <Frame>
        <p>Unknown specialist view.</p>
      </Frame>
    );
  return (
    <Frame id={id} view={view}>
      <ErrorNotice error={resource.error} />
      {resource.loading && (
        <p role="status">Loading authorized configuration…</p>
      )}
      {resource.data && (
        <Editor
          key={`${resource.data.actor_id}:${id}`}
          initial={resource.data}
          view={view}
          reload={resource.reload}
        />
      )}
    </Frame>
  );
}
function Editor({
  initial,
  view,
  reload,
}: {
  initial: Detail;
  view: string;
  reload: () => void;
}) {
  const [data, setData] = useState(initial),
    [proposal, setProposal] = useState<DraftProposal>(initial.draft.proposal),
    [decisions, setDecisions] = useState<Decision[]>([]),
    [reason, setReason] = useState(
      "Reviewed specialist configuration proposal",
    ),
    [preview, setPreview] = useState<Preview | null>(null),
    [previewKey, setPreviewKey] = useState(""),
    [error, setError] = useState<unknown>(null),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("Active"),
    [section, setSection] = useState("All"),
    [columns, setColumns] = useState(false),
    [showSource, setShowSource] = useState(true),
    [working, setWorking] = useState<string | null>(null),
    [manualOpen, setManualOpen] = useState(false),
    [receiving, setReceiving] = useState<Receiving | null>(null),
    [receivingDecisions, setReceivingDecisions] = useState<Decision[]>([]),
    [nativePrices, setNativePrices] = useState<NativePriceProposal[]>([]),
    [summaryViews, setSummaryViews] = useState<Record<string, boolean>>({}),
    summary = summaryViews[view] ?? !["parts", "compare"].includes(view),
    setSummary = (value: boolean) =>
      setSummaryViews((prior) => ({ ...prior, [view]: value })),
    [rebaseOpen, setRebaseOpen] = useState(false);
  const id = data.configuration.id,
    path = `${basePath}/${id}`,
    dirty = JSON.stringify(proposal) !== JSON.stringify(data.draft.proposal),
    proposalKey = JSON.stringify({
      proposal,
      decisions,
      version: data.configuration.version,
    }),
    fresh =
      previewKey === proposalKey ||
      (!initial.can_edit && !dirty && !!data.current_run),
    calculation =
      preview?.calculation ?? data.current_run?.snapshot.calculation ?? null;
  const command = useSpecialistCommand(data, id, async () => {
    const current = await api<Detail>(path);
    setData(current);
    setProposal(current.draft.proposal);
    setDecisions([]);
    setPreview(null);
    setPreviewKey("");
    setReceiving(null);
    setReceivingDecisions([]);
    reload();
  });
  const frozen = command.busy || command.pending || !initial.can_edit,
    navigation = useDiscoveryNavigation(
      dirty,
      command.busy || command.pending,
      `/estimating/configurations/${id}/`,
    );
  useEffect(() => {
    if (
      initial.configuration.version !== data.configuration.version &&
      !dirty &&
      !command.pending &&
      !command.busy
    )
      queueMicrotask(() => {
        setData(initial);
        setProposal(initial.draft.proposal);
        setPreview(null);
      });
  }, [
    initial,
    data.configuration.version,
    dirty,
    command.pending,
    command.busy,
  ]);
  useEffect(() => {
    if (!initial.can_edit) return;
    let live = true;
    const timer = setTimeout(() => {
      void api<Preview>(`${path}/preview`, {
        expected_version: data.configuration.version,
        proposal,
        decisions,
      }).then(
        (result) => {
          if (live) {
            setPreview(result);
            setPreviewKey(proposalKey);
            setError(null);
          }
        },
        (e) => {
          if (live) {
            setError(e);
            setPreviewKey("");
          }
        },
      );
    }, 350);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [
    path,
    proposalKey,
    proposal,
    decisions,
    data.configuration.version,
    initial.can_edit,
  ]);
  const change = (work: (p: DraftProposal) => void) => {
    if (frozen) return;
    setProposal((prior) => {
      const next = structuredClone(prior);
      work(next);
      return next;
    });
    setReceiving(null);
  };
  const saveDraft = () =>
    command.send(`${path}/draft`, "SaveSpecialistDraft", {
      reason,
      expected_version: data.configuration.version,
      proposal,
    });
  const saveReview = () =>
    command.send(`${path}/run`, "SaveSpecialistRun", {
      reason,
      expected_version: data.configuration.version,
      proposal,
      decisions,
      proposal_signature: preview?.proposal_signature,
    });
  const decision = (
    key: string,
    choice: Decision["choice"],
    receivingChoice = false,
  ) => {
    const fn = receivingChoice ? setReceivingDecisions : setDecisions;
    fn((previous) => [
      ...previous.filter((d) => d.key !== key),
      { key, choice, reason },
    ]);
    if (receivingChoice) setReceiving(null);
  };
  const positions = calculation?.positions ?? [],
    shown = positions.filter(
      (l) =>
        (filter === "All" ||
          (filter === "Active" &&
            (l.effective_quantity === null ||
              l.effective_quantity.numerator !== "0")) ||
          (filter === "Manual" && l.manual) ||
          (filter === "Zero / excluded" &&
            (l.excluded || l.effective_quantity?.numerator === "0")) ||
          (filter === "Attention" &&
            (l.part_state !== "Mapped" || l.status === "Unresolved"))) &&
        (section === "All" || l.section === section) &&
        `${l.key} ${l.description} ${l.source} ${l.part_id ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    );
  const selected = positions.find((l) => l.key === working);
  const receivingRequest = () => ({
    run_id: data.current_run?.id,
    resolved_set_id: data.current_resolved?.id,
    resolved_set_hash: data.current_resolved?.content_hash,
    estimate_id: data.estimate?.id,
    estimate_version_id: data.estimate?.version_id,
    expected_configuration_version: data.configuration.version,
    expected_workspace_version: data.source.workspace_version,
    expected_estimate_version: data.estimate?.version,
    discovery_revision_id: data.current_run?.snapshot.binding.revision_id,
    source_context_hash: data.current_run?.snapshot.binding.context_hash,
    receiving_policy_id: data.receiving_policy.id,
    receiving_policy_hash: data.receiving_policy.hash,
    decisions: receivingDecisions,
    price_and_unit_proposals: nativePrices,
  });
  async function reviewReceiving() {
    try {
      setReceiving(
        await api<Receiving>(`${path}/receiving-preview`, receivingRequest()),
      );
      setError(null);
    } catch (e) {
      setError(e);
      setReceiving(null);
    }
  }
  const apply = () =>
    command.send(`${path}/apply`, "ApplySpecialistConfiguration", {
      ...receivingRequest(),
      reason,
      proposal_signature: receiving?.proposal_signature,
    });
  const reveal = (field: string | null) => {
    const element = document.getElementById(`es08-${field}`);
    element?.closest("details")?.setAttribute("open", "");
    element?.focus();
  };
  if (denied(command.error) || denied(error))
    return <ErrorNotice error={command.error ?? error} />;
  return (
    <div className="es08-layout">
      <div className="es08-main">
        <header className="es08-context">
          <h1>{data.configuration.name}</h1>
          <p>
            Screen Systems ·{" "}
            {data.source.source?.site?.display_name ?? "Saved scope"} ·
            Alternative {data.source.option_label} · Discovery{" "}
            {data.source.revision} ({data.source.scope_readiness})
          </p>
          <p>
            <span className="es08-tag">Synthetic</span> Draft v
            {data.configuration.version} ·{" "}
            {dirty ? "Unsaved changes" : "Draft saved"} ·{" "}
            {fresh
              ? calculation?.state === "Current"
                ? "Calculation current"
                : "Calculation invalid"
              : "Calculation stale"}{" "}
            ·{" "}
            {data.current_run
              ? `Last saved run ${data.current_run.sequence}`
              : "No saved review run"}
          </p>
          <details>
            <summary>Exact record identities</summary>
            <p>
              Configuration {id}
              <br />
              Discovery {data.draft.binding.revision_id}
              <br />
              Draft {data.draft.id}
              <br />
              Run {data.current_run?.id ?? "None"}
            </p>
          </details>
          <button onClick={() => setSummary(!summary)}>
            {summary ? "Hide" : "Show"} summary
          </button>
        </header>
        <div className="es08-scroll">
          {initial.configuration.version !== data.configuration.version &&
            dirty && (
              <p role="alert">
                The server version changed. Your proposal is retained; compare
                the latest version before saving.
              </p>
            )}
          {!initial.can_edit && (
            <p role="status">Read only · {initial.edit_blocker}</p>
          )}
          <ErrorNotice error={error} />
          <ErrorNotice error={command.error} />
          {command.pending && (
            <section className="es08-attention" role="status">
              <p>{command.status}</p>
              <button disabled={command.busy} onClick={() => command.recover()}>
                Check original receipt
              </button>
              {command.canRetry && (
                <button
                  disabled={command.busy}
                  onClick={() => command.recover(true)}
                >
                  Retry original unchanged
                </button>
              )}
              <button disabled={command.busy} onClick={() => command.resolve()}>
                Resolve original outcome
              </button>
              <p>
                A missing receipt is not proof of failure. Resolution accepts
                the original or permanently closes it before a new intent.
              </p>
            </section>
          )}
          {view === "configure" && (
            <>
              <h2>Configure Screen Systems</h2>
              <p>
                Recovered technical inputs. Source findings remain visible
                throughout review.
              </p>
              {calculation?.diagnostics.some((d) => d.severity === "Error") && (
                <section role="alert" className="es08-attention">
                  <h3>Review calculation inputs</h3>
                  <ul>
                    {calculation.diagnostics
                      .filter((d) => d.severity === "Error")
                      .map((d, i) => (
                        <li key={i}>
                          <button
                            className="es08-link"
                            onClick={() => reveal(d.field)}
                          >
                            {d.field}: {d.message}
                          </button>
                        </li>
                      ))}
                  </ul>
                </section>
              )}
              {groupLabels.map((group, index) => (
                <details
                  className="es08-section"
                  key={group}
                  open={index === 0}
                >
                  <summary>{group}</summary>
                  <div className="es08-fields">
                    {definition.fields
                      .filter((f) => f.group === index)
                      .map((f) => (
                        <label key={f.key} htmlFor={`es08-${f.key}`}>
                          {f.label} {f.unit && <span>({f.unit})</span>}
                          {f.options ? (
                            <select
                              id={`es08-${f.key}`}
                              value={proposal.inputs[f.key].raw}
                              disabled={frozen}
                              onChange={(e) =>
                                change((p) => {
                                  p.inputs[f.key] = {
                                    raw: e.target.value,
                                    attribution: {
                                      kind: "entered",
                                      note: reason,
                                      source_field: null,
                                    },
                                  };
                                })
                              }
                            >
                              <option value="">Choose…</option>
                              {f.options.map((v) => (
                                <option key={v}>{v}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              id={`es08-${f.key}`}
                              inputMode="decimal"
                              value={proposal.inputs[f.key].raw}
                              disabled={frozen}
                              aria-invalid={
                                calculation?.normalized_inputs.find(
                                  (n) => n.key === f.key,
                                )?.state === "Invalid"
                              }
                              onChange={(e) =>
                                change((p) => {
                                  p.inputs[f.key] = {
                                    raw: e.target.value,
                                    attribution: {
                                      kind: "entered",
                                      note: reason,
                                      source_field: null,
                                    },
                                  };
                                })
                              }
                            />
                          )}
                          <small>
                            {f.source || "Drawing only"} ·{" "}
                            {proposal.inputs[f.key].attribution.kind}
                          </small>
                          {f.note && <small>{f.note}</small>}
                        </label>
                      ))}
                  </div>
                </details>
              ))}
              <details className="es08-section">
                <summary>Five additional screen slots</summary>
                {proposal.extra_screens.map((slot, i) => (
                  <fieldset key={slot.id}>
                    <legend>
                      {slot.id} ·{" "}
                      {Number(slot.count) > 0
                        ? "Active"
                        : "Inactive; values retained"}
                    </legend>
                    <div className="es08-fields">
                      {(
                        [
                          "count",
                          "length",
                          "overhang",
                          "width",
                          "material",
                        ] as const
                      ).map((key) => (
                        <label key={key}>
                          {key}{" "}
                          {key !== "count" && key !== "material" ? "(m)" : ""}
                          <input
                            id={`es08-extra.${i}.${key}`}
                            disabled={frozen}
                            value={slot[key]}
                            onChange={(e) =>
                              change((p) => {
                                p.extra_screens[i][key] = e.target.value;
                              })
                            }
                          />
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
              </details>
              <SpecialistDiagrams
                calculation={calculation}
                proposal={proposal}
                stale={!fresh}
              />
            </>
          )}
          {view === "parts" && (
            <>
              <h2>Parts & working</h2>
              <div className="es08-toolbar">
                <label>
                  Search positions
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
                <label>
                  State
                  <select
                    aria-label="Position state"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    {[
                      "Active",
                      "All",
                      "Manual",
                      "Zero / excluded",
                      "Attention",
                    ].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Section
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                  >
                    {["All", ...new Set(positions.map((l) => l.section))].map(
                      (x) => (
                        <option key={x}>{x}</option>
                      ),
                    )}
                  </select>
                </label>
                <button onClick={() => setColumns(!columns)}>Columns</button>
                <button
                  disabled={frozen || !fresh}
                  onClick={() => setManualOpen(true)}
                >
                  Review 14 manual quantities
                </button>
              </div>
              {columns && (
                <label>
                  <input
                    type="checkbox"
                    checked={showSource}
                    onChange={(e) => setShowSource(e.target.checked)}
                  />{" "}
                  Show source and part identity
                </label>
              )}
              <p>
                {shown.length} shown of {positions.length} source positions ·{" "}
                {fresh ? "Current preview" : "Stale reference"}
              </p>
              <div className="es08-table-scroll" tabIndex={0}>
                <table>
                  <thead>
                    <tr>
                      {showSource && <th>PPO part / source position</th>}
                      <th>Description</th>
                      <th>Quantity</th>
                      <th>Unit</th>
                      <th>Origin / state</th>
                      <th>Attention / working</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((l) => (
                      <tr key={l.key}>
                        {showSource && (
                          <td>
                            {l.part_id ?? "Unmapped"}
                            <small>
                              {l.key} · {l.source}
                            </small>
                          </td>
                        )}
                        <td>{l.description}</td>
                        <td>{l.effective_quantity?.display ?? "Unresolved"}</td>
                        <td>{l.unit}</td>
                        <td>{l.status}</td>
                        <td>
                          <button
                            className="es08-link"
                            onClick={() => setWorking(l.key)}
                          >
                            Working · {l.part_state}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {view === "pricing" && (
            <>
              <h2>Pricing policies</h2>
              <p>
                Excluding tax · tax not calculated. Recovered illustrative
                pricing and native AUD receiving are independent.
              </p>
              <section className="es08-section">
                <h3>SYN-PRICE-02 · illustrative bridge</h3>
                <p>
                  EUR cost ÷ EUR-per-AUD; raw extensions → whole-dollar discount
                  → upward $10 rounding. No-purchase remains priced.
                </p>
                <p>
                  {calculation?.commercial.complete
                    ? `Illustrative total AUD ${calculation.commercial.total?.display}`
                    : "Complete illustrative total unavailable"}{" "}
                  · {calculation?.commercial.missing.length ?? 0} unresolved
                  quantities/rates
                </p>
              </section>
              <div className="es08-table-scroll" tabIndex={0}>
                <table>
                  <thead>
                    <tr>
                      <th>Position</th>
                      <th>Illustrative cost</th>
                      <th>Sell AUD</th>
                      <th>Cost currency</th>
                      <th>Source date</th>
                      <th>No purchase</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions
                      .filter(
                        (l) =>
                          l.row < 383 &&
                          (l.effective_quantity === null ||
                            l.effective_quantity.numerator !== "0"),
                      )
                      .map((l) => {
                        const price =
                          proposal.illustrative_prices.find(
                            (x) => x.key === l.key,
                          )?.price ?? emptyPrice();
                        const edit = (key: string, value: string | boolean) =>
                          change((p) => {
                            const existing = p.illustrative_prices.find(
                                (x) => x.key === l.key,
                              ),
                              next = { ...price, [key]: value, reason };
                            if (existing) existing.price = next;
                            else
                              p.illustrative_prices.push({
                                key: l.key,
                                price: next,
                              });
                          });
                        return (
                          <tr key={l.key}>
                            <td>
                              {l.description}
                              <small>{l.key}</small>
                            </td>
                            <td>
                              <input
                                aria-label={`${l.key} illustrative cost`}
                                disabled={frozen}
                                value={price.cost}
                                onChange={(e) => edit("cost", e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                aria-label={`${l.key} illustrative sell`}
                                disabled={frozen}
                                value={price.sell}
                                onChange={(e) => edit("sell", e.target.value)}
                              />
                            </td>
                            <td>
                              <select
                                aria-label={`${l.key} currency`}
                                disabled={frozen}
                                value={price.currency}
                                onChange={(e) =>
                                  edit("currency", e.target.value)
                                }
                              >
                                <option>AUD</option>
                                <option>EUR</option>
                              </select>
                            </td>
                            <td>
                              <input
                                type="date"
                                aria-label={`${l.key} illustrative date`}
                                disabled={frozen}
                                value={price.effective_date ?? ""}
                                onChange={(e) =>
                                  edit("effective_date", e.target.value)
                                }
                              />
                            </td>
                            <td>
                              <input
                                type="checkbox"
                                aria-label={`${l.key} no purchase`}
                                disabled={frozen}
                                checked={price.no_purchase}
                                onChange={(e) =>
                                  edit("no_purchase", e.target.checked)
                                }
                              />
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
              <h3>SYN-EST-ARITHMETIC-01 · native AUD receiving proposal</h3>
              <p>
                Exact three-decimal quantities, two-decimal AUD rates and
                per-line half-up extensions. Enter a source date and reason for
                every active saved contribution. Procurement packaging is not
                inferred.
              </p>
              <NativePrices
                data={data}
                values={nativePrices}
                set={(v) => {
                  setNativePrices(v);
                  setReceiving(null);
                }}
                disabled={frozen}
              />
            </>
          )}
          {view === "compare" && (
            <>
              <h2>Compare & save review run</h2>
              <p>
                {preview?.comparison.filter((c) => c.required && !c.decision)
                  .length ?? 0}{" "}
                unresolved configuration decisions ·{" "}
                {calculation?.manual_review_required.length ?? 14} manual
                reviews outstanding.
              </p>
              <button
                disabled={frozen || !fresh}
                onClick={() => setManualOpen(true)}
              >
                Review all manual quantities
              </button>
              <ComparisonTable
                rows={preview?.comparison ?? []}
                choose={decision}
                disabled={frozen}
              />
              <p>
                Resolved illustrative total:{" "}
                {preview?.resolved_commercial.total?.display ?? "Unavailable"}{" "}
                AUD · source findings remain.
              </p>
              <button
                className="es08-primary"
                disabled={
                  frozen ||
                  !fresh ||
                  calculation?.state !== "Current" ||
                  !!calculation.manual_review_required.length ||
                  preview?.comparison.some((c) => c.required && !c.decision)
                }
                onClick={() => saveReview()}
              >
                Save review run
              </button>
              <h2>Review estimate changes</h2>
              {!data.estimate ? (
                <p>
                  No estimate has been created.{" "}
                  <Link
                    href={`/estimating/discovery/${data.draft.binding.estimating_workspace_id}`}
                  >
                    Open discovery costing
                  </Link>{" "}
                  to create an exact bound estimate first.
                </p>
              ) : (
                <>
                  <p>
                    Saved estimate v{data.estimate.version}: AUD{" "}
                    {data.estimate.sell ?? "Unavailable"} · existing quotations
                    retain their earlier exact version.
                  </p>
                  <NativePrices
                    data={data}
                    values={nativePrices}
                    set={(v) => {
                      setNativePrices(v);
                      setReceiving(null);
                    }}
                    disabled={frozen}
                  />
                  <button
                    disabled={frozen || !data.current_run || dirty}
                    onClick={reviewReceiving}
                  >
                    Review estimate changes
                  </button>
                  {receiving && (
                    <>
                      {receiving.blockers.length > 0 && (
                        <ul className="es08-attention">
                          {receiving.blockers.map((b, i) => (
                            <li key={i}>
                              {b.key}: {b.message}
                            </li>
                          ))}
                        </ul>
                      )}
                      <ComparisonTable
                        rows={receiving.comparison}
                        choose={(k, c) => decision(k, c, true)}
                        disabled={frozen}
                      />
                      <p>
                        {receiving.lines.length} resulting cost lines · cost AUD{" "}
                        {receiving.totals.cost} · sell AUD{" "}
                        {receiving.totals.sell}.{" "}
                        {receiving.already_current
                          ? "Exact accepted contribution is already current."
                          : "A separate estimate version will be saved."}
                      </p>
                      <button
                        className="es08-primary"
                        disabled={frozen || receiving.blockers.length > 0}
                        onClick={() => apply()}
                      >
                        Apply reviewed changes
                      </button>
                      <button
                        onClick={() => {
                          setReceiving(null);
                          setReceivingDecisions([]);
                        }}
                      >
                        Cancel receiving comparison
                      </button>
                    </>
                  )}
                </>
              )}
            </>
          )}
          {view === "definition" && (
            <>
              <h2>Definition review</h2>
              <p>
                {definition.engine_version} · recovered source{" "}
                {definition.quantity_version} · {definition.part_version}
              </p>
              <p>
                Review required. 142 compared fields, 21 untested options, 23
                REV findings, 3 AUD findings and 12 WAS discrepancies.
                Commercial source values remain withheld.
              </p>
              <p>
                Native exact arithmetic differs at three binary rounding
                boundaries; see the native definition evidence. Tests do not
                approve engineering.
              </p>
              <details className="es08-section">
                <summary>Source manifest and retained hashes</summary>
                {definition.source_files.map((s) => (
                  <p key={s.path}>
                    {s.path}
                    <br />
                    <code>{s.sha256}</code>
                  </p>
                ))}
              </details>
              <h3>Configuration parameter proposal</h3>
              <div className="es08-fields">
                {definition.catalogue.parameters.map((p) => (
                  <label key={p.id}>
                    {p.id} ({p.unit})
                    <input
                      id={`es08-parameter.${p.id}`}
                      disabled={frozen}
                      value={proposal.parameters[p.id].raw}
                      onChange={(e) =>
                        change((s) => {
                          s.parameters[p.id] = { raw: e.target.value, reason };
                        })
                      }
                    />
                    <small>
                      {p.bound ? "Bound" : "Recorded only"} · {p.consumer}
                    </small>
                    <small>{proposal.parameters[p.id].reason}</small>
                  </label>
                ))}
              </div>
              <h3>Source findings</h3>
              {[...definition.issues, ...definition.catalogue.quality].map(
                (f) => (
                  <details className="es08-section" key={f.id}>
                    <summary>
                      {f.id} · {f.title}
                    </summary>
                    <p>{"action" in f ? f.action : f.detail}</p>
                    <FindingReview
                      id={f.id}
                      path={path}
                      version={data.configuration.version}
                      command={command}
                      disabled={frozen}
                    />
                    {data.reviews
                      .filter((r) => r.finding_id === f.id)
                      .map((r, i) => (
                        <p key={i}>
                          {r.disposition}: {r.note} · Next: {r.next_action}
                        </p>
                      ))}
                  </details>
                ),
              )}
              <details className="es08-section">
                <summary>Provisional catalogue · 101 identities</summary>
                <table>
                  <thead>
                    <tr>
                      <th>Part</th>
                      <th>Exact source description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {definition.catalogue.parts.map((p) => (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td>{p.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </>
          )}
          {view === "history" && (
            <History data={data} command={command} disabled={frozen} />
          )}
        </div>
        <footer className="es08-actions">
          <label>
            Reason for next saved change
            <input
              maxLength={1000}
              value={reason}
              disabled={frozen}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <button
            disabled={frozen || !reason.trim()}
            onClick={() => saveDraft()}
          >
            Save draft
          </button>
          <button
            disabled={command.busy}
            onClick={() => {
              setPreviewKey("");
              void api<Preview>(`${path}/preview`, {
                expected_version: data.configuration.version,
                proposal,
                decisions,
              }).then((p) => {
                setPreview(p);
                setPreviewKey(proposalKey);
              }, setError);
            }}
          >
            Review calculation
          </button>
          <span role="status">{command.status}</span>
        </footer>
      </div>
      {summary && (
        <aside className="es08-summary">
          <h2>Review context</h2>
          <p>
            {data.source.option_label} · Discovery {data.source.revision}
          </p>
          <p>
            Draft v{data.configuration.version} ·{" "}
            {data.current_run
              ? `Run ${data.current_run.sequence}`
              : "No saved run"}
          </p>
          <dl>
            {calculation?.facts
              .filter((f) => ["area", "cloth", "drives"].includes(f.key))
              .map((f) => (
                <div key={f.key}>
                  <dt>{f.label}</dt>
                  <dd>
                    {f.value.display} {f.unit}
                  </dd>
                </div>
              ))}
          </dl>
          <p>
            {fresh
              ? "Current calculation"
              : "Stale reference; review latest inputs"}
          </p>
          <p>
            {calculation?.manual_review_required.length ?? 14} manual reviews
            outstanding
          </p>
          <p>Definition: Review required</p>
          <p>
            Receiving:{" "}
            {data.adoptions.length
              ? "Applied to a saved estimate; review newer changes"
              : "Not applied"}
          </p>
          <Link
            href={`/estimating/discovery/${data.draft.binding.estimating_workspace_id}`}
          >
            Return to discovery
          </Link>
          {data.estimate && (
            <Link href={`/estimating/estimates/${data.estimate.id}`}>
              Open saved estimate v{data.estimate.version}
            </Link>
          )}
          <button disabled={frozen} onClick={() => setRebaseOpen(true)}>
            Review source change
          </button>
          <h3>Calculation findings</h3>
          <ul>
            {calculation?.diagnostics
              .filter((d) => d.severity !== "Error")
              .slice(0, 12)
              .map((d, i) => (
                <li key={i}>
                  {d.code} · {d.message}
                </li>
              ))}
          </ul>
        </aside>
      )}
      {manualOpen && preview && (
        <Dialog
          title="Review 14 manual quantities"
          close={() => setManualOpen(false)}
          wide
        >
          <p>
            Review every value, including unresolved and zero. This records
            review against the current noncommercial basis and retains all
            findings.
          </p>
          {definition.manual_rows.map((row) => {
            const key = `CE-LINE-${row}`,
              m = proposal.manual_quantities[key];
            return (
              <fieldset key={key}>
                <legend>
                  {key} · {definition.lines.find((l) => l.row === row)?.label}
                </legend>
                <label>
                  Quantity (blank means unresolved)
                  <input
                    disabled={frozen}
                    value={m.value ?? ""}
                    onChange={(e) =>
                      change((p) => {
                        p.manual_quantities[key].value =
                          e.target.value === "" ? null : e.target.value;
                        p.manual_quantities[key].basis_hash = null;
                      })
                    }
                  />
                </label>
                <label>
                  Review reason
                  <input
                    disabled={frozen}
                    value={m.reason}
                    onChange={(e) =>
                      change((p) => {
                        p.manual_quantities[key].reason = e.target.value;
                        p.manual_quantities[key].basis_hash = null;
                      })
                    }
                  />
                </label>
                <button
                  disabled={frozen || !fresh || !m.reason.trim()}
                  onClick={() =>
                    change((p) => {
                      p.manual_quantities[key].basis_hash =
                        preview.calculation.manual_basis_hash;
                    })
                  }
                >
                  {m.basis_hash === preview.calculation.manual_basis_hash
                    ? "Review recorded"
                    : "Record this review"}
                </button>
              </fieldset>
            );
          })}
          <label>
            Reason for explicit review of all displayed values
            <input value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
          <button
            disabled={frozen || !fresh || !reason.trim()}
            onClick={() => {
              change((p) => {
                for (const m of Object.values(p.manual_quantities)) {
                  m.basis_hash = preview.calculation.manual_basis_hash;
                  m.reason = reason;
                }
              });
              setManualOpen(false);
            }}
          >
            Record review of all 14 displayed values
          </button>
        </Dialog>
      )}
      {selected && (
        <Dialog
          title={`${selected.key} working`}
          close={() => setWorking(null)}
          wide
        >
          <h3>{selected.description}</h3>
          <p>
            {selected.source} · {selected.rule}
          </p>
          <pre>
            {selected.formula ?? "Manual quantity; no recovered formula"}
          </pre>
          <p>
            Generated {selected.quantity?.display ?? "Unresolved"}{" "}
            {selected.unit} · resolved{" "}
            {selected.effective_quantity?.display ?? "Unresolved"}
          </p>
          <p>
            {selected.part_state} · {selected.part_basis} · {selected.part_note}
          </p>
          <p>Candidates: {selected.part_candidates.join(", ") || "None"}</p>
          <label>
            <input
              type="checkbox"
              disabled={frozen}
              checked={selected.excluded}
              onChange={(e) =>
                change((p) => {
                  p.exclusions = [
                    ...p.exclusions.filter((x) => x.key !== selected.key),
                    { key: selected.key, excluded: e.target.checked, reason },
                  ];
                })
              }
            />{" "}
            Estimator exclusion (underlying quantity retained)
          </label>
          {definition.gates.includes(selected.row) && (
            <label>
              <input
                type="checkbox"
                disabled={frozen}
                checked={proposal.gates[`B${selected.row}`].include}
                onChange={(e) =>
                  change((p) => {
                    p.gates[`B${selected.row}`] = {
                      include: e.target.checked,
                      reason,
                    };
                  })
                }
              />{" "}
              Source gate B{selected.row}
            </label>
          )}
          <h3>Exact calculation working</h3>
          <dl>
            {calculation?.facts.map((f) => (
              <div key={f.key}>
                <dt>
                  {f.label} · {f.source}
                </dt>
                <dd>
                  {f.value.display} {f.unit}
                  <small>
                    {f.expression} · exact {f.value.numerator}/
                    {f.value.denominator}
                  </small>
                </dd>
              </div>
            ))}
          </dl>
          {data.current_resolved && (
            <ResolvedAdjustment
              data={data}
              position={selected}
              command={command}
              disabled={frozen}
              close={() => setWorking(null)}
            />
          )}
        </Dialog>
      )}
      {rebaseOpen && (
        <SourceReview
          data={data}
          command={command}
          disabled={frozen}
          close={() => setRebaseOpen(false)}
        />
      )}
      {navigation.leave && (
        <Dialog title="Unsaved configuration changes" close={navigation.stay}>
          <p>
            {command.pending
              ? "Resolve the original operation before leaving this proposal."
              : "Save this draft or discard only the local changes before leaving."}
          </p>
          <button onClick={navigation.stay}>Stay</button>
          <button
            disabled={command.pending || command.busy}
            onClick={async () => {
              if (await saveDraft()) navigation.proceed();
            }}
          >
            Save draft and leave
          </button>
          <button
            disabled={command.pending || command.busy}
            onClick={navigation.proceed}
          >
            Discard local changes
          </button>
        </Dialog>
      )}
    </div>
  );
}
type Row = {
  key: string;
  kind: string;
  required: boolean;
  decision: Decision | null;
  current: unknown;
  candidate: unknown;
};
function ComparisonTable({
  rows,
  choose,
  disabled,
}: {
  rows: Row[];
  choose: (key: string, choice: Decision["choice"]) => void;
  disabled: boolean;
}) {
  return (
    <div className="es08-table-scroll" tabIndex={0}>
      <table>
        <thead>
          <tr>
            <th>Position</th>
            <th>Change</th>
            <th>Current</th>
            <th>Proposal</th>
            <th>Decision</th>
          </tr>
        </thead>
        <tbody>
          {rows
            .filter((r) => r.kind !== "Unchanged")
            .map((r) => {
              const value = (x: unknown) => {
                if (!x) return "Omitted";
                const p = x as {
                  quantity?: string;
                  effective_quantity?: { display: string };
                  unit?: string;
                  description?: string;
                };
                return `${typeof p.quantity === "string" ? p.quantity : (p.effective_quantity?.display ?? "Unresolved")} ${p.unit ?? ""} · ${p.description ?? ""}`;
              };
              const choices =
                r.kind === "Deleted"
                  ? [
                      ["restore", "Restore proposal"],
                      ["omit", "Keep omitted"],
                    ]
                  : r.kind === "Removed"
                    ? [
                        ["remove", "Remove"],
                        ["retain", "Retain as manual"],
                      ]
                    : r.kind === "Incompatible"
                      ? [
                          ["retain", "Retain complete old tuple"],
                          ["generated", "Use new identity and quantity"],
                        ]
                      : [
                          ["keep", "Keep current"],
                          ["generated", "Use proposal"],
                        ];
              return (
                <tr key={r.key}>
                  <td>{r.key}</td>
                  <td>{r.kind}</td>
                  <td>{value(r.current)}</td>
                  <td>{value(r.candidate)}</td>
                  <td>
                    {r.required ? (
                      <select
                        aria-label={`${r.key} decision`}
                        disabled={disabled}
                        value={r.decision?.choice ?? ""}
                        onChange={(e) =>
                          choose(r.key, e.target.value as Decision["choice"])
                        }
                      >
                        <option value="">Resolve…</option>
                        {choices.map(([v, t]) => (
                          <option key={v} value={v}>
                            {t}
                          </option>
                        ))}
                      </select>
                    ) : (
                      "Proposed; no conflict"
                    )}
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}
function NativePrices({
  data,
  values,
  set,
  disabled,
}: {
  data: Detail;
  values: NativePriceProposal[];
  set: (v: NativePriceProposal[]) => void;
  disabled: boolean;
}) {
  const rows =
    data.current_resolved?.snapshot.lines.filter(
      (l) =>
        l.row < 383 && !l.excluded && l.effective_quantity?.numerator !== "0",
    ) ?? [];
  return (
    <>
      <details className="es08-section">
        <summary>
          Review native AUD rates for {rows.length} saved positions
        </summary>
        <button
          disabled={disabled}
          onClick={() =>
            set(
              rows.map((l) => ({
                key: l.key,
                unit_cost: "1.00",
                unit_sell: "2.00",
                effective_date: "2026-09-21",
                reason:
                  "Explicit authored synthetic AUD rate per calculation unit; no supplier quote",
              })),
            )
          }
        >
          Use authored synthetic 1.00 / 2.00 rate proposal
        </button>
        <p>
          This records an explicit synthetic proposal. Eligibility still depends
          on the server-owned fixture policy.
        </p>
        <div className="es08-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Position / quantity</th>
                <th>Unit cost AUD</th>
                <th>Unit sell AUD</th>
                <th>Source date</th>
                <th>Provenance / reason</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => {
                const current = values.find((p) => p.key === l.key) ?? {
                  key: l.key,
                  unit_cost: "",
                  unit_sell: "",
                  effective_date: "",
                  reason: "",
                };
                return (
                  <tr key={l.key}>
                    <td>
                      {l.key}
                      <small>
                        {l.effective_quantity?.display ?? "Unresolved"} {l.unit}
                      </small>
                    </td>
                    {(
                      [
                        "unit_cost",
                        "unit_sell",
                        "effective_date",
                        "reason",
                      ] as const
                    ).map((k) => (
                      <td key={k}>
                        <input
                          aria-label={`${l.key} native ${k}`}
                          type={k === "effective_date" ? "date" : "text"}
                          disabled={disabled}
                          value={current[k]}
                          onChange={(e) =>
                            set([
                              ...values.filter((v) => v.key !== l.key),
                              { ...current, [k]: e.target.value },
                            ])
                          }
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}
function FindingReview({
  id,
  path,
  version,
  command,
  disabled,
}: {
  id: string;
  path: string;
  version: number;
  command: ReturnType<typeof useSpecialistCommand>;
  disabled: boolean;
}) {
  const [note, setNote] = useState(""),
    [next, setNext] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void command.send(`${path}/finding`, "RecordSpecialistFindingReview", {
          expected_version: version,
          finding_id: id,
          note,
          next_action: next,
          disposition: "Reviewed; unresolved",
          reason: note,
        });
      }}
    >
      <label>
        Review note
        <input
          value={note}
          disabled={disabled}
          onChange={(e) => setNote(e.target.value)}
          maxLength={1000}
        />
      </label>
      <label>
        Next action (owned by current editor)
        <input
          disabled={disabled}
          value={next}
          onChange={(e) => setNext(e.target.value)}
          maxLength={1000}
        />
      </label>
      <button disabled={disabled || !note.trim() || !next.trim()}>
        Save review note
      </button>
    </form>
  );
}
function ResolvedAdjustment({
  data,
  position,
  command,
  disabled,
  close,
}: {
  data: Detail;
  position: Position;
  command: ReturnType<typeof useSpecialistCommand>;
  disabled: boolean;
  close: () => void;
}) {
  const [quantity, setQuantity] = useState(
      position.effective_quantity?.display ?? "",
    ),
    [reason, setReason] = useState("");
  if (
    !data.current_resolved?.snapshot.lines.some(
      (l) => l.key === position.key,
    ) ||
    position.row >= 383
  )
    return null;
  return (
    <section>
      <h3>Adjust current saved resolved line</h3>
      <p>Creates a successor resolved set. The original run stays unchanged.</p>
      <label>
        Quantity
        <input
          disabled={disabled}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </label>
      <label>
        Reason
        <input
          disabled={disabled}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
      {[false, true].map((remove) => (
        <button
          key={String(remove)}
          disabled={disabled || !reason}
          onClick={async () => {
            if (
              await command.send(
                `${basePath}/${data.configuration.id}/resolved`,
                "SaveSpecialistResolvedSet",
                {
                  expected_version: data.configuration.version,
                  resolved_set_id: data.current_resolved!.id,
                  resolved_set_hash: data.current_resolved!.content_hash,
                  reason,
                  changes: [
                    {
                      key: position.key,
                      quantity: remove ? null : quantity,
                      remove,
                      reason,
                    },
                  ],
                },
              )
            )
              close();
          }}
        >
          {remove ? "Omit saved line" : "Save resolved adjustment"}
        </button>
      ))}
    </section>
  );
}
function History({
  data,
  command,
  disabled,
}: {
  data: Detail;
  command: ReturnType<typeof useSpecialistCommand>;
  disabled: boolean;
}) {
  const [before, setBefore] = useState<string | null>(null),
    [selected, setSelected] = useState<unknown>(null),
    [selectedRun, setSelectedRun] = useState<string | null>(null),
    [error, setError] = useState<unknown>(null),
    resource = useCrmResource<{
      items: {
        id: string;
        sequence: number;
        created_at: string;
        created_by: string;
        evidence_hash: string;
        source_revision_id: string;
      }[];
      next_cursor: string | null;
    }>(
      `${basePath}/${data.configuration.id}/history${before ? `?before=${before}` : ""}`,
      true,
    );
  async function inspect(id: string, download = false, print = false) {
    try {
      const result = await api<Awaited<ReturnType<typeof readHistory>>>(
        `${basePath}/${data.configuration.id}/history?run_id=${id}${download ? "&export=1" : ""}`,
      );
      if (download) {
        const url = URL.createObjectURL(
            new Blob([JSON.stringify(result, null, 2)], {
              type: "application/json",
            }),
          ),
          link = document.createElement("a");
        link.href = url;
        link.download = `PPO-ES08-review-${id}.json`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        setSelected(result);
        setSelectedRun(id);
        if (print) requestAnimationFrame(() => window.print());
      }
    } catch (e) {
      setSelected(null);
      setSelectedRun(null);
      setError(e);
    }
  }
  return (
    <>
      <h2>Immutable run history</h2>
      <ErrorNotice error={resource.error} />
      <ErrorNotice error={error} />
      {resource.data?.items.length === 0 && <p>No saved review runs yet.</p>}
      <div className="es08-table-scroll">
        <table>
          <thead>
            <tr>
              <th>Run</th>
              <th>Saved</th>
              <th>Actor / source</th>
              <th>Evidence</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {resource.data?.items.map((r) => (
              <tr key={r.id}>
                <td>Run {r.sequence}</td>
                <td>{readable(r.created_at)}</td>
                <td>
                  {r.created_by.slice(0, 8)}
                  <small>{r.source_revision_id}</small>
                </td>
                <td>
                  <code>{r.evidence_hash.slice(0, 16)}…</code>
                </td>
                <td>
                  <button onClick={() => inspect(r.id)}>Inspect</button>
                  <button onClick={() => inspect(r.id, true)}>
                    Export evidence
                  </button>
                  <button
                    disabled={disabled}
                    onClick={() =>
                      command.send(
                        `${basePath}/${data.configuration.id}/from-run`,
                        "CreateSpecialistDraftFromRun",
                        {
                          expected_version: data.configuration.version,
                          run_id: r.id,
                          reason:
                            "Create a new draft proposal from this exact historical run; manual review required",
                        },
                      )
                    }
                  >
                    Create draft from run
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {resource.data?.next_cursor && (
        <button onClick={() => setBefore(resource.data!.next_cursor)}>
          Earlier runs
        </button>
      )}
      <CopyStudy data={data} command={command} disabled={disabled} />
      <h3>Estimate adoptions</h3>
      {data.adoptions.map((a) => (
        <p key={a.id}>
          <Link
            href={`/estimating/estimates/${a.estimate_id}?version_id=${a.estimate_version_id}`}
          >
            Exact estimate version {a.estimate_version_id.slice(0, 8)}
          </Link>{" "}
          · {readable(a.created_at)}
        </p>
      ))}
      <button
        disabled={disabled}
        onClick={() =>
          command.send(
            `${basePath}/${data.configuration.id}/archive`,
            "ArchiveSpecialistConfiguration",
            {
              expected_version: data.configuration.version,
              reason:
                "Archive configuration while retaining all runs and estimate contributions",
            },
          )
        }
      >
        Archive configuration
      </button>
      {selected !== null && (
        <Dialog
          title="Exact saved review evidence"
          close={() => setSelected(null)}
          wide
        >
          <p>
            Internal synthetic review evidence · exact saved run · engineering
            review remains open
          </p>
          <button
            onClick={() => selectedRun && inspect(selectedRun, false, true)}
          >
            Print this evidence
          </button>
          <pre>{JSON.stringify(selected, null, 2)}</pre>
        </Dialog>
      )}
    </>
  );
}
function SourceReview({
  data,
  command,
  disabled,
  close,
}: {
  data: Detail;
  command: ReturnType<typeof useSpecialistCommand>;
  disabled: boolean;
  close: () => void;
}) {
  const options = useCrmResource<Options>(
      `${basePath}/options?estimating_workspace_id=${data.configuration.estimating_workspace_id}`,
      true,
    ),
    [result, setResult] = useState<Awaited<
      ReturnType<typeof previewRebase>
    > | null>(null),
    [error, setError] = useState<unknown>(null),
    [reason, setReason] = useState(
      "Explicitly reviewed source revision and coverage",
    ),
    [coverageChoice, setCoverageChoice] = useState("keep"),
    [fieldDecisions, setFieldDecisions] = useState<
      { key: string; choice: "source" | "keep-entered"; reason: string }[]
    >([]);
  const source = options.data?.sources.find(
    (s) => s.option_id === data.configuration.option_id,
  );
  const body = {
    expected_version: data.configuration.version,
    revision_id: source?.revision_id,
    coverage:
      coverageChoice !== "keep" && source
        ? selectedCoverage(source, coverageChoice)
        : {
            kind: data.draft.binding.kind,
            system_id: data.draft.binding.system_id,
            area_ids: data.draft.binding.area_ids,
            facility_ids: data.draft.binding.facility_ids,
          },
    field_decisions: fieldDecisions,
  };
  return (
    <Dialog title="Review source change" close={close} wide>
      <ErrorNotice error={options.error} />
      <ErrorNotice error={error} />
      <p>
        Saved discovery {data.source.revision} → latest permitted discovery{" "}
        {source?.revision ?? "Unavailable"}. Rebase changes the draft source; it
        does not select an alternative or change saved costs.
      </p>
      <label>
        Reason
        <input value={reason} onChange={(e) => setReason(e.target.value)} />
      </label>
      {source && (
        <label>
          Destination coverage
          <select
            value={coverageChoice}
            onChange={(e) => {
              setCoverageChoice(e.target.value);
              setResult(null);
            }}
          >
            <option value="keep">
              Retain existing coverage (validated against destination)
            </option>
            <option value="FacilityScope">
              All Facilities in this saved source
            </option>
            {source.configuration?.systems
              .filter(
                (s) =>
                  s.coverage.mode === "Defined" &&
                  s.coverage.area_ids.length > 0,
              )
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
        </label>
      )}
      <button
        disabled={disabled || !source}
        onClick={async () => {
          try {
            setResult(
              await api(
                `${basePath}/${data.configuration.id}/source-preview`,
                body,
              ),
            );
          } catch (e) {
            setError(e);
          }
        }}
      >
        Preview source rebase
      </button>
      {result && (
        <>
          <p>
            Old scope {result.old_binding.content_hash.slice(0, 16)} → new scope{" "}
            {result.new_binding.content_hash.slice(0, 16)}
          </p>
          {result.changes.map((c) => (
            <label key={c.key}>
              {c.key}: {c.before} → {c.after ?? "Removed"}
              <select
                value={
                  fieldDecisions.find((d) => d.key === c.key)?.choice ?? ""
                }
                onChange={(e) => {
                  setFieldDecisions([
                    ...fieldDecisions.filter((d) => d.key !== c.key),
                    {
                      key: c.key,
                      choice: e.target.value as "source" | "keep-entered",
                      reason,
                    },
                  ]);
                  setResult(null);
                }}
              >
                <option value="">Resolve…</option>
                <option value="keep-entered">
                  Retain explicitly as entered
                </option>
                {c.after !== null && (
                  <option value="source">Use saved source</option>
                )}
              </select>
            </label>
          ))}
          <button
            disabled={disabled || result.changes.some((c) => !c.decision)}
            onClick={async () => {
              if (
                await command.send(
                  `${basePath}/${data.configuration.id}/rebase`,
                  "RebaseSpecialistSource",
                  {
                    ...body,
                    reason,
                    proposal_signature: result.proposal_signature,
                  },
                )
              )
                close();
            }}
          >
            Apply source rebase
          </button>
        </>
      )}
    </Dialog>
  );
}

function selectedCoverage(source: Options["sources"][number], value: string) {
  const system = source.configuration?.systems.find((s) => s.id === value);
  return system
    ? {
        kind: "StructuredSystem",
        system_id: system.id,
        area_ids: system.coverage.area_ids,
        facility_ids: source.facility_ids,
      }
    : {
        kind: "FacilityScope",
        system_id: null,
        area_ids: [],
        facility_ids: source.facility_ids,
      };
}
function CopyStudy({
  data,
  command,
  disabled,
}: {
  data: Detail;
  command: ReturnType<typeof useSpecialistCommand>;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false),
    options = useCrmResource<Options>(
      open ? `${basePath}/options` : null,
      true,
    ),
    [choice, setChoice] = useState(""),
    [name, setName] = useState("Copied Screen Systems proposal"),
    [copied, setCopied] = useState<string | null>(null);
  const source = options.data?.sources.find((s) => s.option_id === choice);
  return (
    <section>
      <button
        disabled={disabled || !data.current_run}
        onClick={() => setOpen(true)}
      >
        Copy saved run to another alternative
      </button>
      {copied && (
        <p>
          <Link href={`/estimating/configurations/${copied}/configure`}>
            Open copied configuration
          </Link>
        </p>
      )}
      {open && (
        <Dialog
          title="Copy to another alternative"
          close={() => setOpen(false)}
        >
          <p>
            This creates a new configuration and draft. All manual quantities
            need review; no cost ownership or adoption is copied.
          </p>
          <ErrorNotice error={options.error} />
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Saved destination
            <select value={choice} onChange={(e) => setChoice(e.target.value)}>
              <option value="">Select an alternative…</option>
              {options.data?.sources
                .filter((s) => s.option_id !== data.configuration.option_id)
                .map((s) => (
                  <option key={s.option_id} value={s.option_id}>
                    {s.site} · {s.option_label} · r{s.revision}
                  </option>
                ))}
            </select>
          </label>
          <p>
            Coverage: all {source?.facility_ids.length ?? 0} Facilities in the
            selected saved source, explicitly mapped as Facility scope.
          </p>
          <button
            disabled={
              disabled || !source || !name.trim() || !source.facility_ids.length
            }
            onClick={async () => {
              if (!source) return;
              const id = crypto.randomUUID();
              if (
                await command.send(
                  `${basePath}/${data.configuration.id}/copy`,
                  "CopySpecialistConfiguration",
                  {
                    id,
                    name,
                    reason:
                      "Explicitly copy exact saved run into new alternative Facility scope; review required",
                    source_run_id: data.current_run!.id,
                    estimating_workspace_id: source.estimating_workspace_id,
                    option_id: source.option_id,
                    revision_id: source.revision_id,
                    expected_workspace_version:
                      source.expected_workspace_version,
                    coverage: selectedCoverage(source, "FacilityScope"),
                  },
                )
              ) {
                setCopied(id);
                setOpen(false);
              }
            }}
          >
            Create copied draft
          </button>
        </Dialog>
      )}
    </section>
  );
}
