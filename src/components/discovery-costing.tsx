"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { previewDiscoveryCosting } from "../estimating/cost-basis-service";
import type {
  readDiscoveryWorkspace,
  readDiscoveryRevision,
} from "../estimating/discovery-workspaces";
import type {
  readDiscoverySummary,
  compareDiscoverySources,
} from "../estimating/discovery-reads";
import { arithmeticPolicy, type CostLine } from "../estimating/math";
import { parseLines } from "../estimating/validation";
import { configurationCounts } from "../estimating/configuration-definition";
import { RecordIdentity } from "../shell/record-identity";
import { usePhoneHeader } from "../shell/phone-header";
import {
  api,
  ErrorNotice,
  Field,
  ValidationFields,
  type Failure,
} from "./business-ui";
import { useCrmResource, useCrmCommand, denied } from "./crm-state";
import type { Draft } from "./estimating-screens";
import { ScopeView } from "./discovery-screens";
import { FertigationReceivedNotes } from "./fertigation-received-notes";
import { LegacyDiscoveryCosting } from "./discovery-costing-legacy";
import { Icon, Tag, Row } from "./estimation-wizard-ui";
import {
  CostingBanner,
  CostingDialog,
  CostingLineEditor,
  CostingLines,
  CostingLoading,
  CostingTotals,
  CostingButton as Button,
  CostingButtonLink as ButtonLink,
} from "./discovery-costing-parts";
import {
  compareCostLines,
  money,
  proposalAmounts,
  revisionName as rev,
  sellChange,
  scopeDifferenceText,
} from "./discovery-costing-model";
import "./estimation-wizard.css";
import "./estimation-wizard-figma.css";
import "./discovery-costing.css";

type Review = Awaited<ReturnType<typeof previewDiscoveryCosting>>;
type Detail = Awaited<ReturnType<typeof readDiscoveryWorkspace>>;
type Revision = Awaited<ReturnType<typeof readDiscoveryRevision>>;
type Saved = Awaited<ReturnType<typeof readDiscoverySummary>>;
const steps = [
  "Requirements",
  "Configuration",
  "Scope & delivery",
  "Pricing",
  "Review",
];

export function DiscoveryCosting({ id }: { id: string }) {
  const data = useCrmResource<Detail>(`estimating/workspaces/${id}`),
    params = useSearchParams();
  const optionId =
    params.get("option") ?? data.data?.workspace.selected_option_id;
  const option = data.data?.options.find((item) => item.option.id === optionId);
  // Q1 is outside this increment; preserve its native first-estimate flow.
  if (option?.cost.status === "NoEstimate")
    return (
      <div className="dc-legacy">
        <LegacyDiscoveryCosting id={id} />
      </div>
    );
  return (
    <section
      id="ppo-estimate-wizard"
      className="dc-host"
      data-module-layout="full-bleed"
      aria-label="Discovery costing"
    >
      {data.loading && <CostingLoading />}
      <ErrorNotice error={data.error} />
      {data.error != null && (
        <Button onClick={data.reload}>Reload current scope</Button>
      )}
      {data.data && optionId && (
        <CostingEditor
          key={`${id}:${optionId}`}
          detail={data.data}
          optionId={optionId}
          reload={data.reload}
          readError={data.error}
        />
      )}
    </section>
  );
}

function CostingEditor({
  detail: d,
  optionId,
  reload,
  readError,
}: {
  detail: Detail;
  optionId: string;
  reload: () => void;
  readError: unknown;
}) {
  const router = useRouter(),
    id = d.workspace.id,
    workspaceHref = `/estimating/discovery/${id}?option=${optionId}`;
  const option = d.options.find((item) => item.option.id === optionId);
  const [review, setReview] = useState<Review | null>(null),
    [reviewedRevision, setReviewedRevision] = useState<Revision | null>(null),
    [draft, setDraft] = useState<Draft | null>(null);
  const [scopeComparison, setScopeComparison] = useState<Awaited<
    ReturnType<typeof compareDiscoverySources>
  > | null>(null);
  const [loading, setLoading] = useState(false),
    [error, setError] = useState<unknown>(null),
    [validation, setValidation] = useState<unknown>(null);
  const [dialog, setDialog] = useState(false),
    [reason, setReason] = useState(""),
    [confirmed, setConfirmed] = useState(false),
    [editing, setEditing] = useState<CostLine | null>(null);
  const [summary, setSummary] = useState(true),
    [summarySheet, setSummarySheet] = useState(false),
    [outcomeClosed, setOutcomeClosed] = useState(false);
  const started = useRef(false),
    form = useRef<HTMLFormElement>(null);
  const command = useCrmCommand((receipt) =>
    router.push(`/estimating/estimates/${receipt.record_id}`),
  );
  const savedRead = useCrmResource<Saved>(
      `estimating/workspaces/${id}/summary?option_id=${optionId}`,
      true,
    ),
    saved = review?.current_saved;
  const baseline = useCrmResource<Revision>(
    saved?.discovery_basis
      ? `estimating/workspaces/${id}/revisions?revision_id=${saved.discovery_basis.revision_id}`
      : null,
    true,
  );
  const sourceUnavailable =
    denied(baseline.error) ||
    denied(savedRead.error) ||
    savedRead.data?.status === "Unavailable" ||
    option?.cost.status === "Unavailable";
  const blockedRead =
    !!readError ||
    !!savedRead.error ||
    !!baseline.error ||
    !!error ||
    baseline.loading ||
    savedRead.loading;
  const permitted =
    d.can_edit &&
    !denied(error) &&
    !denied(command.error) &&
    !sourceUnavailable;
  const eligible =
    permitted &&
    option?.option.state === "Active" &&
    d.workspace.selected_option_id === optionId &&
    option.revision.kind === "Discovery" &&
    option.revision.scope_readiness === "Complete";
  const changedOnServer =
    !!review &&
    (review.expected_workspace_version !== d.workspace.version ||
      review.revision_id !== option?.revision.id ||
      d.workspace.selected_option_id !== optionId ||
      (savedRead.data?.status === "Available" &&
        savedRead.data.version !== review.expected_estimate_version));
  const stale =
    changedOnServer ||
    [
      "DiscoveryRevisionChanged",
      "VersionConflict",
      "DiscoveryContextChanged",
    ].includes((command.error as Failure)?.code ?? "");
  const frozen = loading || command.busy || command.uncertain,
    oldLines = saved?.lines ?? [],
    lines = draft?.lines ?? [];
  const differences = compareCostLines(oldLines, lines),
    totals = proposalAmounts(lines),
    savedAvailable =
      savedRead.data?.status === "Available" ? savedRead.data : null;
  const savedVersion = saved?.version ?? savedAvailable?.version,
    basis = saved?.discovery_basis ?? savedAvailable?.basis;
  const revision = review?.revision ?? option?.revision.version ?? 0,
    nextVersion = (savedVersion ?? 0) + 1;
  const checks = lines.flatMap((line, index) => [
    ...(line.allowance
      ? [
          {
            line,
            index,
            label: `${line.description} is an allowance`,
            kind: "Allowance",
          },
        ]
      : []),
    ...(differences.added.some((item) => item.id === line.id)
      ? [
          {
            line,
            index,
            label: `New line: ${line.description}`,
            kind: "New line",
          },
        ]
      : []),
  ]);
  const findings =
    option?.evaluation?.findings?.filter(
      (item) => item.category === "Readiness",
    ) ?? [];
  const counts = option?.revision.input?.configuration
    ? configurationCounts(
        option.revision.input.configuration,
        option.evaluation?.findings,
      )
    : null;
  const original =
      (error as Failure)?.code === "LegacyEstimateRetained" ||
      savedAvailable?.basis_kind === "LegacyManual",
    deny = !permitted;
  usePhoneHeader({
    title: d.context.title,
    record: {
      more: [
        {
          label: "Open discovery workspace",
          onSelect: () => router.push(workspaceHref),
        },
        { label: "Costing summary", onSelect: () => setSummarySheet(true) },
      ],
    },
  });
  async function compare() {
    if (!option || !eligible || frozen) return;
    setLoading(true);
    setError(null);
    setConfirmed(false);
    command.clearError();
    setOutcomeClosed(false);
    try {
      const next = await api<Review>(
        `estimating/workspaces/${id}/costing/preview`,
        { option_id: optionId, revision_id: option.revision.id },
      );
      const comparison = next.current_saved?.discovery_basis
        ? await api<Awaited<ReturnType<typeof compareDiscoverySources>>>(
            `estimating/workspaces/${id}/compare`,
            {
              baseline_id: next.current_saved.discovery_basis.revision_id,
              target_id: next.revision_id,
            },
          )
        : null;
      setScopeComparison(comparison);
      setReview(next);
      setReviewedRevision(option.revision);
      setDraft(
        (current) =>
          current ??
          (next.current_saved
            ? {
                schema_version: 2,
                title: next.current_saved.title,
                scope: next.current_saved.scope,
                lines: next.current_saved.lines,
              }
            : null),
      );
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (!started.current && eligible) {
      started.current = true;
      void compare();
    }
  });
  const edit = (next: Draft) => {
    setDraft(next);
    setConfirmed(false);
    setValidation(null);
    command.dirty();
  };
  const openReview = () => {
    if (
      !draft ||
      !eligible ||
      stale ||
      frozen ||
      blockedRead ||
      !form.current?.reportValidity()
    )
      return;
    try {
      parseLines(draft.lines, 2);
      setValidation(null);
      setDialog(true);
    } catch (error) {
      setValidation(error);
    }
  };
  const changedScope = scopeComparison?.differences ?? null;
  const unchangedSystems =
    baseline.data?.input?.configuration?.systems.filter((old) =>
      reviewedRevision?.input?.configuration?.systems.some(
        (current) =>
          current.id === old.id &&
          JSON.stringify(current) === JSON.stringify(old),
      ),
    ) ?? [];
  const estimateHref = review?.estimate_id
    ? `/estimating/estimates/${review.estimate_id}?version_id=${saved?.id}`
    : savedAvailable
      ? `/estimating/estimates/${savedAvailable.estimate_id}?version_id=${savedAvailable.estimate_version_id}`
      : null;
  const summaryContent = (
    <>
      <small>Viewing</small>
      <strong>
        Discovery {rev(option?.revision.version ?? 0)} ·{" "}
        {option?.revision.scope_readiness ?? "Unavailable"}
      </strong>
      <small>
        Option {option?.option.label} ·{" "}
        {d.workspace.selected_option_id === optionId
          ? "the selected basis"
          : "not selected"}
      </small>
      <div className="dc-tags">
        <Tag tone={eligible ? "warning" : "neutral"}>
          {eligible ? "Not saved" : "Not costable"}
        </Tag>
        <Tag>Cost proposal</Tag>
      </div>
      <dl>
        <Row label="Discovery readiness">
          {option?.revision.scope_readiness}
        </Row>
        <Row label="Growing areas">
          {counts?.growing_areas ?? "Not recorded"}
        </Row>
        <Row label="Systems">{counts?.systems ?? "Not recorded"}</Row>
        <Row label="Systems to confirm">
          {counts?.to_confirm ?? "Not recorded"}
        </Row>
      </dl>
      <section>
        <small>
          Saved estimate{savedVersion ? ` · Estimate v${savedVersion}` : ""}
        </small>
        <strong className="dc-saved-total">
          {money(saved?.sell_total ?? savedAvailable?.sell_total)}
        </strong>
        <small>
          Excluding tax
          {basis ? ` · costed on discovery ${rev(basis.revision)}` : ""}
        </small>
        <dl>
          <Row label="Cost basis">
            {basis
              ? `${rev(basis.revision)} → ${rev(revision)}`
              : "Not available"}
            {stale
              ? " · review required"
              : eligible
                ? " when adopted"
                : " · not costed"}
          </Row>
        </dl>
        <CostingBanner>
          {draft ? (
            <>
              Proposal {money(totals?.sell)}
              {sellChange(saved?.sell_total, totals?.sell) !== null
                ? ` (${sellChange(saved?.sell_total, totals?.sell)})`
                : ""}
              . Nothing is saved until you adopt {rev(revision)}; v
              {savedVersion} keeps its own lines and basis.
            </>
          ) : (
            "Newer discovery is not costed. Saved prices remain unchanged."
          )}
        </CostingBanner>
      </section>
      <section>
        <h3>
          {eligible ? "To check before adopting" : "To confirm"} ·{" "}
          {eligible ? checks.length : findings.length}
        </h3>
        {eligible
          ? checks.map((check, index) => (
              <Button
                className="dc-check-link"
                key={`${check.line.id}:${index}`}
                disabled={frozen}
                onClick={() => {
                  setSummarySheet(false);
                  setEditing(check.line);
                }}
              >
                <span>
                  <strong>{check.label}</strong>
                  <small>
                    Line {check.index + 1} · {check.line.source} ·{" "}
                    {check.line.effective_date}
                  </small>
                </span>
                <Icon name="chevron-right" />
              </Button>
            ))
          : findings.map((finding) => (
              <Link
                className="dc-check-link"
                key={finding.key}
                href={`${workspaceHref}&step=${encodeURIComponent(finding.step)}`}
              >
                {finding.message}
              </Link>
            ))}
      </section>
      <section>
        <dl>
          <Row label="Estimating effort">
            {option?.revision.input?.effort.value ?? "Not recorded"}
          </Row>
          <Row label="Delivery routing">Not configured</Row>
        </dl>
      </section>
      <p className="dc-note">
        Proposal totals require complete lines. Discovery does not generate
        prices.
      </p>
    </>
  );
  // Revoked source authority must also remove retained totals and the open editor.
  if (sourceUnavailable || denied(error) || denied(command.error))
    return (
      <section className="dc-section">
        <h1>Costing is no longer available</h1>
        <CostingBanner warning>
          Your current access does not permit this cost basis. No adoption is
          confirmed here. Ask your estimating lead for access.
        </CostingBanner>
        <ButtonLink href={workspaceHref}>Back to discovery</ButtonLink>
      </section>
    );
  return (
    <div className={`dc-layout${summary ? "" : " dc-summary-hidden"}`}>
      <RecordIdentity
        reference={d.context.display_number}
        title={d.context.title}
      />
      <div className="dc-main">
        <header className="dc-context">
          <div>
            <h1>{d.context.title}</h1>
            <Tag>Synthetic preview</Tag>
            <Button
              className="dc-summary-toggle"
              onClick={() => {
                if (window.matchMedia("(max-width:1199px)").matches)
                  setSummarySheet(true);
                else setSummary(!summary);
              }}
            >
              <Icon name="summary" />
              Summary
            </Button>
          </div>
          <p>
            {d.context.display_number} · Estimator {d.context.owner} ·{" "}
            {stale
              ? "Proposal kept · not saved"
              : draft
                ? `Cost version v${nextVersion} proposal · not saved`
                : "Cost a saved discovery option"}
          </p>
        </header>
        <nav className="dc-tabs" aria-label="Discovery workspace views">
          <Link href={workspaceHref} aria-current="page">
            Discovery
          </Link>
          <Link
            href={workspaceHref}
            title="Open the workspace to choose Alternatives"
          >
            Alternatives <Tag>{d.options.length}</Tag>
          </Link>
          <Link
            href={workspaceHref}
            title="Open the workspace to choose Revisions"
          >
            Revisions{" "}
            {option?.history_count != null && <Tag>{option.history_count}</Tag>}
          </Link>
          <span className="dc-viewed" title={`Option ${option?.option.label}`}>
            Viewing Option {option?.option.label} ·{" "}
            {d.workspace.selected_option_id === optionId
              ? "Selected"
              : "Not selected"}
          </span>
        </nav>
        <div className="dc-scroll">
          <nav className="dc-steps" aria-label="Discovery steps">
            {steps.map((step, index) => (
              <Link
                key={step}
                href={`${workspaceHref}&step=${encodeURIComponent(step)}`}
                aria-current={index === 3 ? "step" : undefined}
              >
                <strong>
                  {index + 1}. {step}
                </strong>
                <small>
                  {index === 3
                    ? eligible
                      ? `Costing ${rev(revision)}`
                      : "Not ready to cost"
                    : index === 4
                      ? "After adoption"
                      : option?.revision.scope_readiness === "Complete"
                        ? "Complete"
                        : "Needs review"}
                </small>
              </Link>
            ))}
          </nav>
          <div className="dc-phone-step">
            <small>Step 4 of 5 · Costing {rev(revision)}</small>
            <div>
              <ButtonLink
                href={`${workspaceHref}&step=Scope%20%26%20delivery`}
                aria-label="Previous step"
              >
                <Icon name="arrow-left" />
              </ButtonLink>
              <span>Pricing</span>
              <ButtonLink
                href={`${workspaceHref}&step=Review`}
                aria-label="Next step"
              >
                <Icon name="arrow-right" />
              </ButtonLink>
            </div>
          </div>
          {stale && (
            <div className="dc-section">
              <CostingBanner warning>
                Discovery or the saved estimate changed while you were costing.
                Your proposal is kept; review the current saved basis before
                adopting.{" "}
                <Button
                  disabled={frozen || !eligible}
                  onClick={() => void compare()}
                >
                  Review {rev(option?.revision.version ?? 0)} and keep proposal
                </Button>
              </CostingBanner>
            </div>
          )}
          {(readError != null || savedRead.error != null) && (
            <div className="dc-section">
              <CostingBanner warning>
                Current scope could not be rechecked. Your proposal is kept;
                reconnect and reload the current scope before adopting.{" "}
                <Button
                  onClick={() => {
                    reload();
                    savedRead.reload();
                  }}
                >
                  Reload current scope
                </Button>
              </CostingBanner>
            </div>
          )}
          <div className="dc-section dc-basis-banner">
            <CostingBanner>
              <strong>
                {eligible
                  ? `Costing discovery ${rev(revision)} · Option ${option?.option.label}`
                  : `Discovery ${rev(option?.revision.version ?? 0)} cannot be costed`}
              </strong>
              <p>
                {basis
                  ? `Estimate v${savedVersion} stays on ${rev(basis.revision)} until you adopt a new cost version. `
                  : ""}
                Discovery does not generate prices.
              </p>
              {estimateHref && (
                <ButtonLink href={estimateHref}>
                  <Icon name="external" />
                  Open estimate v{savedVersion}
                </ButtonLink>
              )}
            </CostingBanner>
          </div>
          <div className="dc-phone-viewed">
            <small>Viewed alternative</small>
            <span>
              Option {option?.option.label} ·{" "}
              {d.workspace.selected_option_id === optionId
                ? "Selected"
                : "Not selected"}
            </span>
          </div>
          {loading && !draft ? <CostingLoading /> : null}
          {error != null && !original && !denied(error) && (
            <div className="dc-section">
              <ErrorNotice error={error} />
              <Button
                onClick={() => void compare()}
                disabled={frozen || !eligible}
              >
                Review selected scope for costing
              </Button>
            </div>
          )}
          {!eligible && (
            <section className="dc-section">
              <h2>What is not ready</h2>
              <p>
                Discovery {rev(option?.revision.version ?? 0)} ·{" "}
                {option?.revision.scope_readiness ?? "Unavailable"}. Existing
                saved estimates remain unchanged.
              </p>
              <div className="dc-scope-rows">
                {findings.map((finding) => (
                  <div key={finding.key}>
                    <Icon name="warning" />
                    <span>
                      <strong>{finding.message}</strong>
                      <small>
                        {finding.step} · {finding.field}
                      </small>
                    </span>
                    <Link
                      href={`${workspaceHref}&step=${encodeURIComponent(finding.step)}`}
                    >
                      Open
                    </Link>
                  </div>
                ))}
              </div>
              {!findings.length && (
                <p>
                  {!permitted
                    ? "Estimating edit access is required to adopt a cost basis."
                    : "Select an Active option with Complete discovery in the workspace before costing."}
                </p>
              )}
              {savedAvailable && (
                <>
                  <h2>Saved estimate v{savedAvailable.version} · unchanged</h2>
                  <CostingTotals lines={savedAvailable.lines} />
                </>
              )}
            </section>
          )}
          {review && draft && permitted && !sourceUnavailable && (
            <>
              <section className="dc-section">
                <h2>Scope being costed</h2>
                <p>
                  Discovery {rev(review.revision)} compared with{" "}
                  {basis ? rev(basis.revision) : "the saved basis"}, the basis
                  of estimate v{savedVersion}
                </p>
                {baseline.loading && (
                  <p role="status">Loading the exact saved comparison…</p>
                )}
                <ErrorNotice error={baseline.error} />
                {baseline.error != null && (
                  <Button onClick={baseline.reload}>
                    Reload saved comparison
                  </Button>
                )}
                {changedScope && (
                  <div className="dc-scope-rows">
                    {changedScope.map((change, index) => (
                      <div key={`${change.entity_id}:${change.field}:${index}`}>
                        <Icon
                          name={
                            change.change === "Added"
                              ? "plus"
                              : change.change === "Removed"
                                ? "removed"
                                : "changed"
                          }
                        />
                        <span>
                          <strong>
                            {
                              scopeDifferenceText(
                                change,
                                baseline.data?.input,
                                reviewedRevision?.input,
                              ).label
                            }{" "}
                            · {change.change.toLowerCase()}
                          </strong>
                          <small>
                            {
                              scopeDifferenceText(
                                change,
                                baseline.data?.input,
                                reviewedRevision?.input,
                              ).detail
                            }
                          </small>
                        </span>
                        <Link
                          href={`${workspaceHref}&step=${encodeURIComponent(change.entity === "answer" ? "Requirements" : "Configuration")}`}
                        >
                          View
                        </Link>
                      </div>
                    ))}
                    {(unchangedSystems.length > 0 ||
                      changedScope.length === 0) && (
                      <div>
                        <Icon name="check" />
                        <span>
                          <strong>
                            {changedScope.length
                              ? `Unchanged system definitions since ${rev(basis?.revision ?? 0)}`
                              : "No scope changes between these saved revisions"}
                          </strong>
                          <small>
                            {unchangedSystems.length
                              ? unchangedSystems
                                  .map((system) => system.name)
                                  .join(", ")
                              : "Open exact saved source for the full retained scope."}
                          </small>
                        </span>
                      </div>
                    )}
                  </div>
                )}
                <details className="dc-source">
                  <summary>
                    Exact saved source · scope snapshot, answer snapshot and
                    content hash for {rev(review.revision)}
                  </summary>
                  <dl>
                    <Row label="Scope snapshot">{review.scope_snapshot_id}</Row>
                    <Row label="Answer snapshot">
                      {review.answer_snapshot_id}
                    </Row>
                    <Row label="Content hash">{review.content_hash}</Row>
                  </dl>
                  <ScopeView
                    input={review.selected_scope.input}
                    context={review.recorded_context!}
                  />
                  {baseline.data?.input && (
                    <details>
                      <summary>
                        Compare with saved discovery{" "}
                        {rev(baseline.data.version)}
                      </summary>
                      <ScopeView
                        input={baseline.data.input}
                        context={baseline.data.observed_context}
                      />
                    </details>
                  )}
                </details>
                <FertigationReceivedNotes
                  items={review.fertigation_handovers}
                />
              </section>
              <section className="dc-cost-lines">
                <div className="dc-section">
                  <h2>Cost lines · proposal for estimate v{nextVersion}</h2>
                  <p>
                    Prefilled from estimate v{savedVersion} · edit to match
                    discovery {rev(review.revision)}
                  </p>
                </div>
                <CostingLines
                  lines={lines}
                  saved={oldLines}
                  bindings={saved?.source_bindings ?? []}
                  changed={differences.changed}
                  disabled={frozen || !permitted}
                  edit={setEditing}
                  add={() =>
                    setEditing({
                      id: crypto.randomUUID(),
                      description: "",
                      category: "Product",
                      quantity: "",
                      unit: "",
                      unit_cost: "",
                      unit_sell: "",
                      source: "",
                      effective_date: "",
                    })
                  }
                />
              </section>
              <div className="dc-section">
                <CostingTotals
                  lines={lines}
                  saved={oldLines}
                  version={savedVersion}
                />
                <p className="dc-note">
                  Manual AUD, excluding tax; tax not calculated.{" "}
                  {arithmeticPolicy}: sell at least cost, unit amounts to 2
                  places, each extension rounded half-up to 2 places, then
                  summed. Approval belongs to Estimate review (ES-04).
                </p>
              </div>
              <section className="dc-section">
                <h2>Customer wording</h2>
                <p>
                  Saved with the cost version and shown on the draft quotation
                </p>
                <form
                  ref={form}
                  onSubmit={(e) => {
                    e.preventDefault();
                    openReview();
                  }}
                >
                  <ValidationFields error={validation ?? command.error}>
                    <fieldset
                      disabled={frozen || !permitted}
                      className="dc-wording"
                    >
                      <Field
                        label="Estimate title"
                        name="title"
                        value={draft.title}
                        onChange={(title) => edit({ ...draft, title })}
                        required
                        maxLength={200}
                      />
                      {(["included", "excluded", "assumptions"] as const).map(
                        (key) => (
                          <Field
                            key={key}
                            label={
                              key === "included"
                                ? "Included scope"
                                : key === "excluded"
                                  ? "Excluded scope"
                                  : "Assumptions"
                            }
                            name={key}
                            value={draft.scope[key]}
                            onChange={(value) =>
                              edit({
                                ...draft,
                                scope: { ...draft.scope, [key]: value },
                              })
                            }
                            required
                            multiline
                            maxLength={key === "included" ? 3000 : 2000}
                          />
                        ),
                      )}
                    </fieldset>
                    <ErrorNotice error={validation} />
                  </ValidationFields>
                </form>
              </section>
            </>
          )}
        </div>
        <footer className="dc-bottom">
          <span>
            {stale
              ? `Proposal kept · ${rev(revision)} is no longer the reviewed current basis`
              : draft
                ? `Proposal for estimate v${nextVersion} · ${differences.changed.length} lines changed · not saved`
                : `Nothing to cost · ${option?.revision.scope_readiness ?? "Unavailable"}`}
          </span>
          <Button
            className="dc-mobile-summary"
            onClick={() => setSummarySheet(true)}
          >
            <Icon name="summary" />
            Summary
          </Button>
          <ButtonLink
            className="dc-previous"
            href={`${workspaceHref}&step=Scope%20%26%20delivery`}
          >
            <Icon name="arrow-left" /> Previous
          </ButtonLink>
          {command.uncertain ? (
            <Button variant="primary" onClick={() => setDialog(true)}>
              Check the save outcome
            </Button>
          ) : !eligible ? (
            <ButtonLink variant="primary" href={workspaceHref}>
              Open workspace
            </ButtonLink>
          ) : stale ? (
            <Button
              variant="primary"
              disabled={frozen}
              onClick={() => void compare()}
            >
              Review {rev(option?.revision.version ?? 0)} and keep proposal
            </Button>
          ) : (
            <Button
              variant="primary"
              disabled={frozen || !draft || blockedRead || baseline.loading}
              onClick={openReview}
            >
              Review and adopt{" "}
              <span className="dc-desktop-revision">{rev(revision)}</span>
            </Button>
          )}
        </footer>
      </div>
      {summary && (
        <aside className="dc-summary" aria-label="Costing summary">
          <header>
            <h2>Costing summary</h2>
            <Button
              variant="quiet"
              aria-label="Hide costing summary"
              onClick={() => setSummary(false)}
            >
              <Icon name="close" />
            </Button>
          </header>
          {summaryContent}
        </aside>
      )}
      {summarySheet && (
        <CostingDialog
          title="Costing summary"
          close={() => setSummarySheet(false)}
        >
          <div className="dc-summary-sheet">{summaryContent}</div>
        </CostingDialog>
      )}
      {editing && draft && !frozen && permitted && (
        <CostingLineEditor
          key={editing.id}
          line={editing}
          index={
            lines.some((line) => line.id === editing.id)
              ? lines.findIndex((line) => line.id === editing.id)
              : lines.length
          }
          saved={oldLines}
          bindings={saved?.source_bindings ?? []}
          close={() => setEditing(null)}
          save={(line) => {
            edit({
              ...draft,
              lines: lines.some((item) => item.id === line.id)
                ? lines.map((item) => (item.id === line.id ? line : item))
                : [...lines, line],
            });
            setEditing(null);
          }}
          remove={() => {
            edit({
              ...draft,
              lines: lines.filter((line) => line.id !== editing.id),
            });
            setEditing(null);
          }}
        />
      )}
      {(dialog || ((original || deny) && !outcomeClosed)) && (
        <CostingDialog
          title={
            command.uncertain
              ? "Adoption outcome not confirmed"
              : deny
                ? "You can no longer adopt this cost basis"
                : original
                  ? "This option keeps its original estimate"
                  : `Adopt discovery ${rev(revision)} in cost version v${nextVersion}`
          }
          subtitle={`${d.context.title} · Option ${option?.option.label}`}
          close={() => {
            setDialog(false);
            setOutcomeClosed(true);
          }}
          frozen={command.busy}
          footer={
            <>
              <small>
                {command.uncertain
                  ? "Check the original request; no new save is created."
                  : "The server assigns the version and time."}
              </small>
              <Button
                disabled={command.busy}
                onClick={() => {
                  setDialog(false);
                  setOutcomeClosed(true);
                }}
              >
                {command.uncertain || deny || original ? "Close" : "Cancel"}
              </Button>
              {command.uncertain ? (
                <Button
                  variant="primary"
                  disabled={command.busy}
                  onClick={() => void command.reconcile()}
                >
                  Check the save outcome
                </Button>
              ) : original ? (
                <ButtonLink variant="primary" href={workspaceHref}>
                  Branch a discovery option
                </ButtonLink>
              ) : (
                !deny && (
                  <Button
                    variant="primary"
                    form="dc-adopt"
                    type="submit"
                    disabled={
                      frozen ||
                      stale ||
                      !eligible ||
                      !confirmed ||
                      !reason.trim() ||
                      blockedRead
                    }
                  >
                    {command.busy
                      ? "Adopting…"
                      : `Adopt ${rev(revision)} in cost version v${nextVersion}`}
                  </Button>
                )
              )}
            </>
          }
        >
          {command.uncertain ? (
            <>
              <CostingBanner warning>
                We could not confirm whether cost version v{nextVersion} was
                saved. Your proposal is kept in this page and nothing is shown
                as saved. Check the outcome before trying again; reloading
                discards this proposal.
              </CostingBanner>
              <p role="status">
                The existing command recovery checks the original request and
                may retry that same idempotent request if no receipt is
                available.
              </p>
            </>
          ) : deny ? (
            <CostingBanner warning>
              Your current access does not permit this cost basis. No adoption
              is confirmed here. Ask your estimating lead for access.
            </CostingBanner>
          ) : original ? (
            <CostingBanner warning>
              This option keeps its original manual estimate, which has no
              discovery basis. Branch a new discovery option in the workspace to
              cost it separately. Nothing was saved.
            </CostingBanner>
          ) : (
            <>
              <CostingBanner>
                Estimate v{savedVersion} keeps discovery{" "}
                {basis ? rev(basis.revision) : "its original basis"} with its
                own lines and totals. Adopting creates v{nextVersion} on{" "}
                {rev(revision)}; drafts and quotations made from v{savedVersion}{" "}
                keep their originals.
              </CostingBanner>
              {stale && (
                <CostingBanner warning>
                  The saved basis changed. Close this review and review the
                  current scope; your proposal is kept.
                </CostingBanner>
              )}
              <h3>What will be saved</h3>
              <ul className="dc-review-list">
                <li>
                  Discovery basis · {basis ? rev(basis.revision) : "Unknown"} →{" "}
                  {rev(revision)} · scope and answer snapshots
                </li>
                <li>
                  Cost lines · {lines.length} lines ·{" "}
                  {differences.changed.length} changed,{" "}
                  {differences.added.length} added, {differences.removed.length}{" "}
                  removed
                </li>
                <li>
                  Totals · cost {money(totals?.cost)} · sell{" "}
                  {money(totals?.sell)}
                </li>
                <li>
                  Customer wording · title, included, excluded, assumptions
                </li>
              </ul>
              <h3>Check before adopting · {checks.length}</h3>
              <ul className="dc-review-list">
                {checks.map((check, index) => (
                  <li key={index}>
                    {check.label} · line {check.index + 1}{" "}
                    <Tag tone="warning">{check.kind}</Tag>
                  </li>
                ))}
              </ul>
              <form
                id="dc-adopt"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (
                    !review ||
                    !draft ||
                    !confirmed ||
                    !eligible ||
                    stale ||
                    frozen ||
                    blockedRead
                  )
                    return;
                  void command.send(`estimating/workspaces/${id}/costing`, {
                    estimate_id: review.estimate_id,
                    option_id: review.option_id,
                    revision_id: review.revision_id,
                    expected_workspace_version:
                      review.expected_workspace_version,
                    expected_estimate_version: review.expected_estimate_version,
                    context_hash: review.context_hash,
                    title: draft.title,
                    scope: draft.scope,
                    lines: draft.lines,
                    policy: arithmeticPolicy,
                    reason,
                  });
                }}
              >
                <ValidationFields error={command.error}>
                  <fieldset disabled={frozen || stale || !eligible}>
                    <Field
                      label="Reason for adopting this cost basis"
                      name="reason"
                      value={reason}
                      onChange={(value) => {
                        setReason(value);
                        command.dirty();
                      }}
                      required
                      multiline
                      maxLength={1000}
                      hint={`Shown with cost version v${nextVersion} in history.`}
                    />
                    <div className="dc-confirm">
                      <h3>Confirm the review</h3>
                      <label>
                        <input
                          type="checkbox"
                          checked={confirmed}
                          onChange={(e) => setConfirmed(e.target.checked)}
                        />
                        I reviewed this exact discovery basis and the manual
                        scope and costs
                      </label>
                      <small>
                        Discovery {rev(revision)}, {lines.length} cost lines and
                        the customer wording above. Approval stays with Estimate
                        review (ES-04).
                      </small>
                    </div>
                  </fieldset>
                </ValidationFields>
                <ErrorNotice error={command.error} />
                {command.busy && (
                  <p role="status">
                    Adopting… Keep this page open while the original request is
                    confirmed.
                  </p>
                )}
              </form>
            </>
          )}
        </CostingDialog>
      )}
    </div>
  );
}
