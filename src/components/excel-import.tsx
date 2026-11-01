"use client";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type ComponentProps,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ErrorNotice, Field, type Failure } from "./business-ui";
import { useCrmResource, denied } from "./crm-state";
import { useUnsavedChanges } from "./record-ui";
import { SecondaryMenuFrame, useSecondaryMenu } from "../shell/secondary-menu";
import { WizardDialog } from "./estimation-wizard-dialog";
import { Row, Tag } from "./estimation-wizard-ui";
import { Button, ButtonLink } from "./ui/button";
import {
  useExcelCommand,
  CommandOutcome,
  ExcelActionHost,
} from "./excel-import-command";
import {
  ReviewWorkbook,
  CompareWorkbook,
  ImportTotals,
  EvidenceValues,
  EvidenceDetails,
  confirmations,
} from "./excel-import-review";
import { ExcelPricing, ExcelQuotation } from "./excel-import-continuation";
import {
  proposedTotals,
  estimateImportHref,
  money,
  type ImportContext,
  type ImportEvidence,
  type PricingEvidence,
  type WorkbookReview,
  type WorkbookComparison,
  type Upload,
  type Estimate,
  type Workspace,
  type ReviewSummary,
} from "./excel-import-types";
import type { Receipt } from "../shared/ui/use-recoverable-command";
import "./estimation-wizard.css";
import "./estimation-wizard-figma.css";
import "./excel-import.css";
function RouteLink({
  variant = "secondary",
  className,
  ...props
}: ComponentProps<typeof Link> & {
  variant?: "primary" | "secondary";
  className?: string;
}) {
  return (
    <Link
      {...props}
      className={`ppo-button ppo-button--${variant} ${className ?? ""}`}
    />
  );
}
const validId = (value: string | null | undefined): value is string =>
  !!value &&
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);

export function useImportEvidence(estimate: string, version: string) {
  const direct = useCrmResource<ImportEvidence>(
    `estimating/estimates/${estimate}/excel-import/${version}`,
    true,
  );
  const priced = useCrmResource<PricingEvidence>(
    (direct.error as Failure)?.status === 404
      ? `estimating/estimates/${estimate}/versions/${version}/excel-source-pricing`
      : null,
    true,
  );
  const original = useCrmResource<ImportEvidence>(
    priced.data?.import_version_id
      ? `estimating/estimates/${estimate}/excel-import/${priced.data.import_version_id}`
      : null,
    true,
  );
  return {
    data: direct.data ?? original.data,
    pricing: priced.data,
    loading: direct.loading || priced.loading || original.loading,
    error:
      (direct.error as Failure)?.status === 404
        ? (priced.error ?? original.error)
        : direct.error,
    reload: () => {
      direct.reload();
      priced.reload();
      original.reload();
    },
  };
}
export function ExcelEstimateActions({
  estimate,
  blocked = false,
}: {
  estimate: Estimate;
  blocked?: boolean;
}) {
  const evidence = useImportEvidence(estimate.id, estimate.saved.id);
  if (!evidence.data)
    return evidence.error && (evidence.error as Failure).status !== 404 ? (
      <section className="est-panel">
        <h2>Import evidence</h2>
        <ErrorNotice error={evidence.error} />
        <Button onClick={evidence.reload}>Reload import evidence</Button>
      </section>
    ) : null;
  const current = estimate.saved.id === estimate.current_version_id;
  return (
    <section className="est-panel">
      <h2>Import evidence</h2>
      <p>
        {evidence.data.proposal.file.name} · original workbook retained · saved
        version {estimate.saved.version}
      </p>
      <p>Source review and commercial approval remain separate.</p>
      <div className="est-actions">
        <Link href={estimateImportHref(estimate.id, estimate.saved.id)}>
          View exact import evidence
        </Link>
        {!blocked && current && estimate.can_edit && (
          <>
            <Link
              href={estimateImportHref(
                estimate.id,
                estimate.saved.id,
                "workbook",
              )}
            >
              Import a revised workbook
            </Link>
            <Link
              href={estimateImportHref(
                estimate.id,
                estimate.saved.id,
                "pricing",
              )}
            >
              Price from reviewed sources
            </Link>
            {estimate.can_prepare && (
              <Link
                href={estimateImportHref(
                  estimate.id,
                  estimate.saved.id,
                  "quotation",
                )}
              >
                Prepare Draft quotation from Excel
              </Link>
            )}
          </>
        )}
      </div>
    </section>
  );
}
function Frame({
  title,
  context,
  step,
  summary,
  children,
  footer,
  stepLabels = ["Workbook", "Review", "Confirm & save", "Saved"],
}: {
  title: string;
  context: ReactNode;
  step: number;
  summary: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  stepLabels?: string[];
}) {
  const [menuOpen, setMenuOpen] = useState(false),
    [summaryOpen, setSummaryOpen] = useState(false);
  const menu = useSecondaryMenu(menuOpen, setMenuOpen);
  const [actionHost, setActionHost] = useState<HTMLDivElement | null>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const currentStep = stepLabels[step];
  useEffect(() => {
    scroll.current?.scrollTo({ top: 0 });
    const heading = scroll.current?.querySelector<HTMLElement>("h2");
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }, [step, currentStep]);
  return (
    <SecondaryMenuFrame
      id="ppo-excel-import"
      name="Excel import"
      menuId="xi-menu"
      contentId="xi-content"
      state={menu}
      attributes={{ "data-ppo-workspace": "shared" }}
      message=""
      menu={
        <div className="xi-menu">
          <h2>Excel import</h2>
          <Link href="/estimating/discovery">Back to Estimation wizard</Link>
          <p>
            Synthetic workbooks only. Correct workbook values in Excel and
            upload again.
          </p>
        </div>
      }
    >
      <ExcelActionHost.Provider value={actionHost}>
        <div id="ppo-estimate-wizard" className="xi-wizard">
          <div className="es02-layout">
            <div className="es02-main">
              <header className="es02-context">
                <div className="es02-context-identity">
                  <div className="es02-context-title">
                    <h1>{title}</h1>
                    <Tag>Synthetic preview</Tag>
                  </div>
                  <div className="es02-context-meta">{context}</div>
                </div>
                <div className="es02-context-controls">
                  <Button onClick={() => setSummaryOpen(true)}>Summary</Button>
                </div>
              </header>
              <div className="es02-scroll" ref={scroll}>
                <nav className="es02-steps" aria-label="Excel import steps">
                  {stepLabels.map((name, i) => (
                    <div
                      className="es02-step"
                      aria-current={step === i ? "step" : undefined}
                      key={name}
                    >
                      <strong>
                        {i + 1}. {name}
                      </strong>
                      <small>
                        {step > i
                          ? "Complete"
                          : step === i
                            ? "Current step"
                            : ""}
                      </small>
                    </div>
                  ))}
                </nav>
                <p className="xi-mobile-step">
                  Step {step + 1} of 4 · {stepLabels[step]}
                </p>
                {children}
              </div>
              <footer className="es02-bottom">
                <Button
                  className="xi-summary-button"
                  onClick={() => setSummaryOpen(true)}
                >
                  Summary
                </Button>
                {footer}
                <div
                  ref={setActionHost}
                  id="xi-footer-actions"
                  className="xi-actions"
                />
              </footer>
            </div>
            <aside
              className="es02-summary xi-summary"
              aria-label="Import summary"
            >
              <h2>Import summary</h2>
              {summary}
            </aside>
          </div>
        </div>
      </ExcelActionHost.Provider>
      {summaryOpen && (
        <WizardDialog
          title="Import summary"
          close={() => setSummaryOpen(false)}
        >
          {summary}
        </WizardDialog>
      )}
    </SecondaryMenuFrame>
  );
}
export function ExcelImport() {
  const params = useSearchParams(),
    estimateId = params.get("estimate"),
    version = params.get("version");
  const estimate = useCrmResource<Estimate>(
    validId(estimateId) && validId(version)
      ? `estimating/estimates/${estimateId}?version_id=${version}`
      : null,
    true,
  );
  const basis = estimate.data?.saved.discovery_basis;
  const workspace = basis?.estimating_workspace_id ?? params.get("workspace"),
    option = basis?.option_id ?? params.get("option"),
    revision = basis?.revision_id ?? params.get("revision");
  const w = useCrmResource<Workspace>(
    validId(workspace) ? `estimating/workspaces/${workspace}` : null,
    true,
  );
  const error = estimate.error ?? w.error;
  if (error)
    return (
      <Frame
        title="Excel import unavailable"
        context="Current access and exact context are required"
        step={0}
        summary={<p>No import content available.</p>}
      >
        <ErrorNotice error={error} />
        <Button
          onClick={() => {
            estimate.reload();
            w.reload();
          }}
        >
          Check access and reload
        </Button>
      </Frame>
    );
  if (estimate.loading || w.loading)
    return (
      <Frame
        title="Excel import"
        context="Loading exact context"
        step={0}
        summary={<p>Loading…</p>}
      >
        <p role="status">Loading the permitted workspace…</p>
      </Frame>
    );
  if (
    !validId(workspace) ||
    !validId(option) ||
    !validId(revision) ||
    !w.data ||
    (estimateId && !estimate.data)
  )
    return (
      <Frame
        title="Exact import context required"
        context="Open this page from the Estimation wizard or an imported estimate"
        step={0}
        summary={<p>No target has been selected.</p>}
      >
        <section className="es02-card" role="alert">
          <h2>
            Choose a Draft workspace, option and Complete discovery revision
          </h2>
          <p>
            Import cannot infer these from a name or select another option for
            you.
          </p>
          <Link href="/estimating/discovery">Open Estimation wizard</Link>
        </section>
      </Frame>
    );
  const selected = w.data.options.find((o) => o.option.id === option);
  return (
    <ImportWorkflow
      key={`${workspace}:${option}:${revision}:${estimateId ?? "new"}:${version ?? ""}:${params.get("mode") ?? ""}`}
      workspace={w.data}
      option={option}
      revision={revision}
      estimate={estimate.data}
      mode={params.get("mode") ?? "workbook"}
      context={
        <>
          {selected?.revision.observed_context?.organisation.display_name ??
            "Customer unavailable"}{" "}
          ·{" "}
          {selected?.revision.observed_context?.site?.display_name ??
            "Site unavailable"}{" "}
          · {w.data.context.owner} · Alternative{" "}
          {selected?.option.label ?? "Unknown"} · Discovery r
          {selected?.revision.version ?? "?"}{" "}
          {selected?.revision.scope_readiness ?? "Unknown"}
        </>
      }
    />
  );
}
function ImportWorkflow({
  workspace: w,
  option,
  revision,
  estimate,
  mode,
  context,
}: {
  workspace: Workspace;
  option: string;
  revision: string;
  estimate: Estimate | null;
  mode: string;
  context: ReactNode;
}) {
  const router = useRouter(),
    [step, setStep] = useState(0),
    [basis, setBasis] = useState<ImportContext | null>(null),
    [file, setFile] = useState<Upload | null>(null),
    [review, setReview] = useState<WorkbookReview | null>(null),
    [comparison, setComparison] = useState<WorkbookComparison | null>(null),
    [decisions, setDecisions] = useState<Record<string, "Keep" | "Remove">>({}),
    [confirmed, setConfirmed] = useState<string[]>([]),
    [changesConfirmed, setChangesConfirmed] = useState(false),
    [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(null);
  const command = useExcelCommand(
      `${w.workspace.id}:${option}:${estimate?.saved.id ?? "new"}`,
    ),
    serial = useRef(0);
  const blocked =
    busy ||
    command.busy ||
    !!command.pending ||
    !!command.accepted ||
    !command.ready;
  useUnsavedChanges(
    !!file && !command.accepted,
    command.busy || !!command.pending,
  );
  const current = w.options.find((o) => o.option.id === option);
  const eligible =
    w.can_edit &&
    w.workspace.state === "Draft" &&
    w.workspace.selected_option_id === option &&
    current?.revision.id === revision &&
    current.revision.scope_readiness === "Complete" &&
    current.option.state === "Active";
  useEffect(
    () => () => {
      serial.current++;
    },
    [],
  );
  async function openSaved(receipt: Receipt) {
    setError(null);
    try {
      if (command.accepted?.entry.path.endsWith("/excel-quote")) {
        router.push(`/estimating/quotes/${receipt.record_id}`);
        return;
      }
      const e = await api<Estimate>(
        `estimating/estimates/${receipt.record_id}`,
      );
      const exact = e.versions.find(
        (v) => v.version === receipt.record_version,
      );
      if (!exact)
        throw {
          message:
            "Save accepted, but its exact version is unavailable under current access. Keep the receipt and reload.",
        };
      router.push(estimateImportHref(e.id, String(exact.id)));
    } catch (e) {
      setError(e);
    }
  }
  async function preview() {
    if (!file || blocked || !eligible) return;
    const token = ++serial.current;
    setBusy(true);
    setError(null);
    command.clear();
    setReview(null);
    setComparison(null);
    setConfirmed([]);
    setChangesConfirmed(false);
    setDecisions({});
    try {
      const b = await api<ImportContext>(
        `estimating/workspaces/${w.workspace.id}/excel-import/context`,
        { option_id: option, revision_id: revision },
      );
      const payload = {
        option_id: option,
        revision_id: revision,
        basis_hash: b.basis_hash,
        file,
      };
      const r = await api<WorkbookReview>(
        `estimating/workspaces/${w.workspace.id}/excel-import/preview`,
        payload,
      );
      if (token !== serial.current) return;
      setBasis(b);
      setReview(r);
      setStep(1);
      if (r.validation_passed && b.target.estimate_id) {
        const c = await api<WorkbookComparison>(
          `estimating/workspaces/${w.workspace.id}/excel-import/compare`,
          payload,
        );
        if (token === serial.current) setComparison(c);
      }
    } catch (e) {
      if (token === serial.current) {
        setError(e);
        if (denied(e)) {
          setReview(null);
          setBasis(null);
          setFile(null);
        }
      }
    } finally {
      if (token === serial.current) setBusy(false);
    }
  }
  async function choose(f: File | undefined) {
    if (!f || blocked) return;
    const token = ++serial.current;
    setError(null);
    setFile(null);
    setReview(null);
    setComparison(null);
    setConfirmed([]);
    setBasis(null);
    setStep(0);
    if (
      !/\.xlsx$/i.test(f.name) ||
      f.name.length > 160 ||
      f.size > 5 * 1024 * 1024 ||
      !f.size
    ) {
      setError({
        message:
          "Choose one nonempty .xlsx workbook within 5 MiB and a plain filename within 160 characters.",
      });
      return;
    }
    setBusy(true);
    try {
      const bytes = new Uint8Array(await f.arrayBuffer());
      let binary = "";
      for (let i = 0; i < bytes.length; i += 8192)
        binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
      if (token === serial.current)
        setFile({ name: f.name, base64: btoa(binary) });
    } catch {
      setError({
        message: "The workbook could not be read. Choose the file again.",
      });
    } finally {
      if (token === serial.current) setBusy(false);
    }
  }
  const ready =
    !!review?.validation_passed &&
    !!basis &&
    (!basis.target.estimate_id || !!comparison) &&
    (!comparison ||
      comparison.omissions.every((l) => !!decisions[l.line_id])) &&
    !error &&
    !command.error;
  const proposed = comparison ? proposedTotals(comparison, decisions) : null;
  const summary = (
    <>
      <p className="xi-hash">
        <strong>{file?.name ?? "No workbook chosen"}</strong>
      </p>
      <Tag
        tone={
          review?.validation_passed ? "success" : review ? "danger" : "neutral"
        }
      >
        {review
          ? review.validation_passed
            ? "Review required"
            : "Blocked"
          : "Choose workbook"}
      </Tag>
      {comparison ? (
        <dl>
          <Row label="Proposed lines">
            {proposed?.items.length ?? "Unknown"}
          </Row>
          <Row label="Proposed cost">{money(proposed?.cost)}</Row>
          <Row label="Proposed sell">{money(proposed?.sell)}</Row>
          <Row label="Workbook included sell">
            {money(review?.totals.included_sell)}
          </Row>
        </dl>
      ) : review ? (
        <ImportTotals review={review} />
      ) : (
        <dl>
          <Row label="Lines">—</Row>
          <Row label="Sections">—</Row>
          <Row label="Sell · calculated by PPO">AUD —</Row>
          <Row label="Cost">AUD —</Row>
        </dl>
      )}
      <p>Excluding tax · tax not calculated</p>
      <p>
        Saving rechecks current access, workspace, selected option and exact
        revision. A changed basis requires a new review.
      </p>
      <Link href={`/estimating/discovery/${w.workspace.id}?option=${option}`}>
        Back to Estimation wizard
      </Link>
      <p>
        Original workbook values and saved versions remain separate from
        approval.
      </p>
    </>
  );
  if (denied(command.error))
    return (
      <Frame
        title="Excel import access refused"
        context="Current permission is required"
        step={step}
        summary={<p>Protected evidence is unavailable.</p>}
      >
        <CommandOutcome command={command} onSaved={(r) => void openSaved(r)} />
      </Frame>
    );
  if (estimate && mode !== "workbook")
    return <SavedWorkflow estimate={estimate} mode={mode} context={context} />;
  const save = () => {
    if (
      !ready ||
      !file ||
      !basis ||
      !review ||
      confirmed.length !== 4 ||
      !reason.trim() ||
      blocked ||
      (comparison && !changesConfirmed)
    )
      return;
    void command.send(
      `estimating/workspaces/${w.workspace.id}/excel-import/${comparison ? "reimport" : "commit"}`,
      {
        option_id: option,
        revision_id: revision,
        basis_hash: basis.basis_hash,
        review_hash: review.review_hash,
        file,
        reason,
        confirmations: confirmed,
        ...(comparison
          ? {
              comparison_hash: comparison.comparison_hash,
              changes_confirmed: true,
              decisions: comparison.omissions.map((l) => ({
                line_id: l.line_id,
                action: decisions[l.line_id],
              })),
            }
          : {}),
      },
      "/estimating/import",
      "Excel estimate",
      basis.target.estimate_id ?? w.workspace.id,
    );
  };
  return (
    <Frame
      title={w.context.title}
      context={context}
      step={command.accepted ? 3 : step}
      stepLabels={
        comparison
          ? ["Workbook", "Compare", "Confirm & save", "Saved"]
          : undefined
      }
      summary={summary}
      footer={
        <>
          <span className="es02-bottom-state">
            {command.pending
              ? "Save outcome uncertain"
              : review?.validation_passed
                ? "Ready for review"
                : "Nothing saved yet"}
          </span>
          {step > 0 && !command.accepted && (
            <Button disabled={blocked} onClick={() => setStep(step - 1)}>
              Previous
            </Button>
          )}
          {!command.accepted &&
            (step === 0 ? (
              <Button
                variant="primary"
                disabled={blocked || !file || !eligible}
                onClick={() => void preview()}
              >
                Validate workbook
              </Button>
            ) : step === 1 && review && !review.validation_passed ? (
              <Button
                variant="primary"
                disabled={blocked}
                onClick={() => setStep(0)}
              >
                Upload corrected file
              </Button>
            ) : step === 1 ? (
              <Button
                variant="primary"
                disabled={blocked || !ready}
                onClick={() => setStep(2)}
              >
                Continue to confirm
              </Button>
            ) : (
              <Button
                variant="primary"
                disabled={
                  blocked ||
                  !ready ||
                  confirmed.length !== 4 ||
                  !reason.trim() ||
                  (!!comparison && !changesConfirmed)
                }
                onClick={save}
              >
                {comparison ? "Save revised estimate" : "Save as estimate v1"}
              </Button>
            ))}
        </>
      }
    >
      <ErrorNotice error={error} />
      <CommandOutcome command={command} onSaved={(r) => void openSaved(r)} />
      {!eligible && (
        <section className="es02-card" role="alert">
          <h2>Import is unavailable for this basis</h2>
          <p>
            Import requires estimating edit permission and the selected Active
            option in a Draft workspace with its exact current Complete
            discovery revision. Return to the Wizard to complete or select the
            basis.
          </p>
        </section>
      )}
      {!command.accepted && (
        <fieldset className="xi-workflow" disabled={blocked || !eligible}>
          {step === 0 && (
            <>
              <h2>This import writes to</h2>
              <div className="xi-targets">
                <section className="es02-card">
                  <small>Opportunity</small>
                  <strong>{w.context.display_number}</strong>
                  <p>{w.context.title}</p>
                </section>
                <section className="es02-card">
                  <small>Option</small>
                  <strong>{current?.option.label ?? "Unavailable"}</strong>
                  <p>
                    {current?.option.state} ·{" "}
                    {w.workspace.selected_option_id === option
                      ? "selected"
                      : "not selected"}
                  </p>
                </section>
                <section className="es02-card">
                  <small>Discovery basis</small>
                  <Tag tone={eligible ? "success" : "warning"}>
                    {current?.revision.scope_readiness ?? "Unavailable"}
                  </Tag>
                  <p>Revision r{current?.revision.version}</p>
                </section>
                <section className="es02-card">
                  <small>Estimate</small>
                  <strong>
                    {estimate
                      ? `Saved v${estimate.saved.version}`
                      : "Checked during review"}
                  </strong>
                  <p>
                    {estimate
                      ? "Review every replacement and omission"
                      : "A first save creates estimate v1"}
                  </p>
                </section>
              </div>
              <section className="es02-card">
                <h2>Choose workbook</h2>
                <p>
                  Upload one synthetic PPO estimate workbook. Save and
                  recalculate it in Excel before uploading.
                </p>
                <label className="xi-upload">
                  Workbook (.xlsx, up to 5 MiB)
                  <input
                    type="file"
                    accept=".xlsx"
                    onChange={(e) => void choose(e.target.files?.[0])}
                  />
                </label>
                {file && <p>{file.name} · ready to validate</p>}
              </section>
              <section className="es02-card">
                <h2>Before you upload</h2>
                <p>
                  Recalculate and save in Excel. PPO reads saved results and
                  never runs formulas.
                </p>
                <p>
                  Use the exact opportunity, organisation, site and option
                  references. Labels cannot match records.
                </p>
                <p>
                  The workbook needs PPO_Metadata, PPO_Sections, PPO_Scope,
                  PPO_Sources, PPO_Lines and PPO_Control tables. This does not
                  establish compatibility with a departmental workbook.
                </p>
              </section>
            </>
          )}
          {step === 1 && review && (
            <>
              {!comparison && <ReviewWorkbook review={review} />}
              {comparison && (
                <CompareWorkbook
                  comparison={comparison}
                  decisions={decisions}
                  setDecisions={(next) => {
                    setDecisions(next);
                    setConfirmed([]);
                    setChangesConfirmed(false);
                  }}
                  disabled={blocked}
                />
              )}
              {comparison && (
                <details className="es02-card">
                  <summary>
                    Incoming workbook validation and original values
                  </summary>
                  <ReviewWorkbook review={review} />
                </details>
              )}
              {review.validation_passed && (
                <Button onClick={() => setStep(0)}>
                  Choose another workbook
                </Button>
              )}
              <Button onClick={() => void preview()}>
                Refresh exact review
              </Button>
            </>
          )}
          {step === 2 && review && (
            <>
              <section className="es02-card">
                <h2>Confirm before saving</h2>
                <p>
                  PPO checks structure, references and arithmetic. These
                  statements are yours and are kept with the import under your
                  identity.
                </p>
                {confirmations.map(([id, label, description]) => (
                  <label className="xi-confirmation" key={id}>
                    <input
                      type="checkbox"
                      checked={confirmed.includes(id)}
                      onChange={(e) =>
                        setConfirmed(
                          e.target.checked
                            ? [...confirmed, id]
                            : confirmed.filter((x) => x !== id),
                        )
                      }
                    />
                    <span>
                      <strong>{label}</strong>
                      <small>{description}</small>
                    </span>
                  </label>
                ))}
                {comparison && (
                  <label className="xi-confirmation">
                    <input
                      type="checkbox"
                      checked={changesConfirmed}
                      onChange={(e) => setChangesConfirmed(e.target.checked)}
                    />
                    <span>
                      Confirm all replacements and Keep / Remove decisions,
                      including reviewed source prices affected.
                    </span>
                  </label>
                )}
                <Field
                  label="Reason · kept with the import"
                  name="reason"
                  value={reason}
                  onChange={setReason}
                  multiline
                  required
                  maxLength={1000}
                />
              </section>
              <section className="es02-card">
                <h2>What will be saved</h2>
                <p>
                  The exact estimate version, original workbook bytes, review
                  evidence, your confirmations and reason.
                </p>
                <p>
                  No quotation is prepared or issued. No operational approval or
                  ERP transaction follows.
                </p>
                <p className="xi-hash">
                  Review {review.review_hash} · Original SHA-256{" "}
                  {review.file.sha256}
                </p>
              </section>
            </>
          )}
        </fieldset>
      )}
    </Frame>
  );
}
function SavedWorkflow({
  estimate: e,
  mode,
  context,
}: {
  estimate: Estimate;
  mode: string;
  context: ReactNode;
}) {
  const evidence = useImportEvidence(e.id, e.saved.id),
    router = useRouter();
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(
    null,
  );
  const [continuationStep, setContinuationStep] = useState(0);
  const [openError, setOpenError] = useState<unknown>(null);
  const fresh = e.current_version_id === e.saved.id;
  const onSaved = async (receipt: Receipt) => {
    setOpenError(null);
    try {
      const next = await api<Estimate>(
        `estimating/estimates/${receipt.record_id}`,
      );
      const exact = next.versions.find(
        (v) => v.version === receipt.record_version,
      );
      if (!exact)
        throw {
          message: "The accepted exact version cannot currently be read.",
        };
      router.push(estimateImportHref(next.id, String(exact.id)));
    } catch (error) {
      setOpenError(error);
    }
  };
  const summary = (
    <>
      {evidence.data && (
        <>
          <small>Workbook</small>
          <p className="xi-hash">
            <strong>{evidence.data.proposal.file.name}</strong>
          </p>
          <small>
            {evidence.data.proposal.metadata.workbook_ref} ·{" "}
            {evidence.data.proposal.file.bytes} bytes
          </small>
        </>
      )}
      <Tag tone="success">Saved estimate v{e.saved.version}</Tag>
      <dl>
        <Row label="Lines">{e.saved.lines.length}</Row>
        {evidence.data && (
          <>
            <Row label="Workbook sections">
              {evidence.data.proposal.sections.length}
            </Row>
            <Row label="Source warnings">
              {
                evidence.data.proposal.issues.filter(
                  (i) => i.severity === "Warning",
                ).length
              }
            </Row>
          </>
        )}
        <Row label="Cost">{money(e.totals.cost)}</Row>
        <Row label="Sell">{money(e.totals.sell)}</Row>
      </dl>
      {reviewSummary && (
        <>
          <h3>{reviewSummary.label}</h3>
          <dl>
            {reviewSummary.values.map(([label, value]) => (
              <Row key={label} label={label}>
                {money(value)}
              </Row>
            ))}
          </dl>
        </>
      )}
      <p>
        Exact saved estimate. Pricing does not change the original workbook or
        sell prices.
      </p>
      {evidence.data && (
        <section className="xi-confirmation">
          <div>
            <strong>All four import confirmations given</strong>
            <small>
              Source calculation · scope · reconciliation · source warnings
            </small>
          </div>
        </section>
      )}
      <Link href={`/estimating/estimates/${e.id}?version_id=${e.saved.id}`}>
        Open estimate
      </Link>
    </>
  );
  return (
    <Frame
      title={e.saved.title}
      context={context}
      step={
        mode === "pricing" || mode === "quotation"
          ? reviewSummary
            ? 2
            : continuationStep
          : 3
      }
      stepLabels={
        mode === "pricing"
          ? ["Lines & sources", "Charges", "Review & save", "Priced"]
          : mode === "quotation"
            ? [
                "Include & print",
                "Customer preview",
                "Confirm & save",
                "Draft saved",
              ]
            : undefined
      }
      summary={summary}
      footer={
        <RouteLink
          href={`/estimating/estimates/${e.id}?version_id=${e.saved.id}`}
          variant={
            mode === "pricing" || mode === "quotation" ? "secondary" : "primary"
          }
        >
          Open estimate
        </RouteLink>
      }
    >
      <ErrorNotice error={openError} />
      <ErrorNotice error={evidence.error} />
      {evidence.loading && (
        <p role="status">Loading retained import evidence…</p>
      )}
      {!!evidence.error && (
        <Button onClick={evidence.reload}>Reload evidence</Button>
      )}
      {evidence.data && (
        <>
          {mode === "pricing" ? (
            <ExcelPricing
              estimate={e}
              onSaved={onSaved}
              onReview={setReviewSummary}
              onStage={setContinuationStep}
            />
          ) : mode === "quotation" ? (
            <ExcelQuotation estimate={e} onReview={setReviewSummary} />
          ) : (
            <>
              <section className="es02-card xi-ready">
                <h2>Estimate saved</h2>
                <p>
                  Saved version {e.saved.version} · {e.display_number}
                </p>
                <p>
                  Your workbook, review and confirmations are retained. Nothing
                  has been issued to the customer.
                </p>
                <p className="xi-hash">
                  Receipt{" "}
                  {String(
                    evidence.pricing?.receipt_id ?? evidence.data.receipt_id,
                  )}
                </p>
              </section>
              <section className="es02-card">
                <h2>Next steps</h2>
                {fresh && e.can_edit ? (
                  <div className="xi-next">
                    <article>
                      <h3>Price from reviewed sources</h3>
                      <p>
                        Replace workbook unit costs with independently reviewed
                        Cost Sources, including recorded FX and landed charges.
                        Creates a new version.
                      </p>
                      <RouteLink
                        href={estimateImportHref(e.id, e.saved.id, "pricing")}
                      >
                        Price from reviewed sources
                      </RouteLink>
                    </article>
                    {e.can_prepare && (
                      <article>
                        <h3>Prepare a Draft quotation</h3>
                        <p>
                          Choose included and printed lines, then review
                          customer wording. A saved Draft is not yet a PDF.
                        </p>
                        <RouteLink
                          href={estimateImportHref(
                            e.id,
                            e.saved.id,
                            "quotation",
                          )}
                        >
                          Prepare Draft quotation
                        </RouteLink>
                      </article>
                    )}
                    <article>
                      <h3>Import a revised workbook</h3>
                      <p>
                        Compare the workbook with this saved version, then keep
                        or remove each line it leaves out.
                      </p>
                      <RouteLink
                        href={estimateImportHref(e.id, e.saved.id, "workbook")}
                      >
                        Import a revised workbook
                      </RouteLink>
                    </article>
                  </div>
                ) : (
                  <p>
                    {fresh
                      ? "Read-only: current edit permission and ownership are required for changes."
                      : "Historical version. Open the current estimate before preparing changes."}
                  </p>
                )}
              </section>
              <section className="es02-card">
                <h2>Import evidence</h2>
                <p>
                  {evidence.data.proposal.file.name} ·{" "}
                  {evidence.data.proposal.file.bytes} bytes
                </p>
                <p>
                  Confirmed by {evidence.data.review.actor_id} ·{" "}
                  {String(evidence.data.review.recorded_at)}
                </p>
                <p>{evidence.data.review.reason}</p>
                <p className="xi-hash">
                  SHA-256 {evidence.data.proposal.file.sha256}
                </p>
                <ButtonLink
                  href={`/api/v1/estimating/estimates/${e.id}/excel-import/${evidence.data.estimate_version_id}/source`}
                >
                  Download retained original workbook
                </ButtonLink>
                <p>
                  The retained reference is not a live storage-availability
                  check. Download verifies the original bytes.
                </p>
                <EvidenceDetails title="Exact review and saved evidence">
                  <EvidenceValues value={evidence.data} />
                  {evidence.pricing && (
                    <EvidenceValues value={evidence.pricing} />
                  )}
                </EvidenceDetails>
              </section>
            </>
          )}
        </>
      )}
    </Frame>
  );
}
