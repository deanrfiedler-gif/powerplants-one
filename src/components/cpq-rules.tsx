"use client";
import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Definition, Rule } from "../cpq/types";
import type { readRelease, listReleases, readRevision } from "../cpq/reads";
import type { readDraft } from "../cpq/drafts";
import type { validateDraft } from "../cpq/ui-reads";
import { screenDefinition } from "../cpq/pilot";
import { CpqFormulaEditor } from "./cpq-formula-editor";
import { semanticChanges } from "../cpq/semantic-diff";
import { useCrmResource, useCrmCommand } from "./crm-state";
import { api, ErrorNotice } from "./business-ui";
import { Button } from "./ui/button";
import {
  CpqFrame,
  CpqDraftBoundary,
  CpqNav,
  CpqHeader,
  CpqTabs,
  CpqField,
  CpqPill,
  CpqNotice,
  CpqDialog,
  CpqEmpty,
  useCpqCompany,
  money,
  stamp,
  type Wire,
} from "./cpq-ui";
import {
  ConditionEditor,
  FactEditor,
  PartsEditor,
  DesignEditor,
  FixtureEditor,
} from "./cpq-rule-fields";
type ReleaseView = Wire<Awaited<ReturnType<typeof readRelease>>>;
type DraftView = Wire<Awaited<ReturnType<typeof readDraft>>>;
type Tests = Wire<Awaited<ReturnType<typeof validateDraft>>>;
const designDefault = () => ({
  option_sets: [],
  structure: [],
  shared_capacity: [],
  decision_tables: [],
  pricing: { mode: "Catalog" as const, percent: "0", allow_override: false },
});
function toDesign(d: Definition): Definition {
  return {
    ...structuredClone(d),
    schema_version: 3,
    design: d.design ?? designDefault(),
  };
}
const menus = [
  "All rules",
  "Fact dictionary",
  "Parts & cost sources",
  "Option sets",
  "Product structures",
  "Decision tables",
  "Compatibility & capacity",
  "Milestone proposals",
  "Test scenarios",
  "Releases",
  "Activation history",
];
export function CpqRules({ id }: { id: string }) {
  const selectedCompany = useCpqCompany(),
    query = useSearchParams(),
    draftId = query.get("draft");
  const resource = useCrmResource<ReleaseView>(
    id === "new" ? null : `cpq/releases/${id}`,
    true,
  );
  const draft = useCrmResource<DraftView>(
    draftId ? `cpq/drafts/${draftId}` : null,
    true,
  );
  const company =
    resource.data?.release.company_id ??
    draft.data?.draft.company_id ??
    selectedCompany;
  const registry = useCrmResource<
    Wire<Awaited<ReturnType<typeof listReleases>>>
  >(
    id === "new" && company ? `cpq/releases?company_id=${company}` : null,
    true,
  );
  const [start, setStart] = useState<Definition | null>(null),
    error = resource.error ?? draft.error ?? registry.error;
  const content = draft.data?.draft.content as Definition | undefined;
  if (error)
    return (
      <CpqFrame
        name="Rules studio"
        menu={<CpqNav label="All rules" href="/estimating/rules" />}
      >
        <div className="cpq-scroll">
          <ErrorNotice error={error} />
        </div>
      </CpqFrame>
    );
  if (resource.loading || draft.loading || registry.loading)
    return (
      <CpqFrame
        name="Rules studio"
        menu={<CpqNav label="All rules" href="/estimating/rules" />}
      >
        <div className="cpq-scroll" role="status">
          Loading rules studio…
        </div>
      </CpqFrame>
    );
  if (!company)
    return (
      <CpqFrame
        name="Rules studio"
        menu={<CpqNav label="All rules" href="/estimating/rules" />}
      >
        <div className="cpq-scroll">
          <CpqEmpty>
            Select a working company in the application header to start a rule
            set.
          </CpqEmpty>
        </div>
      </CpqFrame>
    );
  if (id === "new" && !content && !start)
    return (
      <CpqFrame
        name="Rules studio"
        menu={<CpqNav label="All rules" href="/estimating/rules" />}
      >
        <CpqHeader title="New rule set" context="Rules studio" />
        <div className="cpq-scroll">
          <CpqEmpty>
            <h2>Start a working draft</h2>
            <p>
              Choose an explicit synthetic authoring template. It remains a
              draft until tested, versioned, independently reviewed, sealed and
              activated.
            </p>
            {registry.data?.capabilities.author ? (
              <Button
                variant="primary"
                onClick={() => setStart(screenDefinition())}
              >
                Use Screen systems synthetic template
              </Button>
            ) : (
              <p>
                Your current role can read rules. Author permission is required
                to create a draft.
              </p>
            )}
          </CpqEmpty>
        </div>
      </CpqFrame>
    );
  const initial = content ?? start ?? resource.data?.current.definition;
  if (
    !initial ||
    !Array.isArray(initial.facts) ||
    !Array.isArray(initial.rules) ||
    !Array.isArray(initial.parts) ||
    !Array.isArray(initial.fixtures)
  )
    return (
      <CpqFrame
        name="Rules studio"
        menu={<CpqNav label="All rules" href="/estimating/rules" />}
      >
        <div className="cpq-scroll">
          <CpqNotice tone="warning">
            This saved draft has an incomplete document structure. Open its
            source release to start a new structured draft.
          </CpqNotice>
        </div>
      </CpqFrame>
    );
  return (
    <CpqDraftBoundary
      key={id + ":" + (draftId ?? "")}
      href={id === "new" ? "/estimating/rules" : `/estimating/rules/${id}`}
    >
      <RulesEditor
        key={id + ":" + (draftId ?? "")}
        company={company}
        initial={initial}
        initialRoot={resource.data}
        draft={draft.data}
        initialRule={query.get("rule")}
        canAuthor={
          resource.data?.capabilities.author ??
          registry.data?.capabilities.author ??
          false
        }
        serverRoot={resource.data}
      />
    </CpqDraftBoundary>
  );
}
function RulesEditor({
  company,
  initial,
  initialRoot,
  draft,
  initialRule,
  canAuthor,
  serverRoot,
}: {
  company: string;
  initial: Definition;
  initialRoot: ReleaseView | null;
  draft: DraftView | null;
  initialRule: string | null;
  canAuthor: boolean;
  serverRoot: ReleaseView | null;
}) {
  const router = useRouter(),
    [d, setDefinition] = useState(() => toDesign(initial)),
    [root, setRoot] = useState(initialRoot),
    [releaseId] = useState(initialRoot?.release.id ?? crypto.randomUUID()),
    [draftId] = useState(draft?.draft.id ?? crypto.randomUUID()),
    [draftVersion, setDraftVersion] = useState(draft?.draft.version ?? 0),
    [view, setView] = useState("All rules"),
    [ruleKey, setRuleKey] = useState(
      initialRule ?? initial.rules[0]?.key ?? "",
    ),
    [tab, setTab] = useState("Definition"),
    [details, setDetails] = useState(false),
    [formulaEditor, setFormulaEditor] = useState(false),
    [tests, setTests] = useState<{ signature: string; value: Tests } | null>(
      null,
    ),
    [testing, setTesting] = useState(false),
    [error, setError] = useState<unknown>(null),
    [scenario, setScenario] = useState(0),
    [reason, setReason] = useState(""),
    [lifecycle, setLifecycle] = useState<
      "Approved" | "Rejected" | "Seal" | "Activate" | null
    >(null),
    [historical, setHistorical] = useState<Wire<
      Awaited<ReturnType<typeof readRevision>>
    > | null>(null),
    [hydrating, setHydrating] = useState(false);
  const intent = useRef("draft");
  const command = useCrmCommand(
    (receipt) => {
      if (intent.current === "draft") {
        setDraftVersion(receipt.record_version);
        router.replace(
          `/estimating/rules/${root?.release.id ?? "new"}?draft=${draftId}`,
        );
        return;
      }
      setHydrating(true);
      setLifecycle(null);
      void api<ReleaseView>(`cpq/releases/${releaseId}`)
        .then((r) => {
          setRoot(r);
          if (intent.current === "version") {
            setDefinition(toDesign(r.current.definition));
            router.replace(
              `/estimating/rules/${releaseId}${draftVersion ? `?draft=${draftId}` : ""}`,
            );
            setTests(null);
            if (draftVersion) setDraftVersion((v) => v + 1);
          }
        })
        .catch(setError)
        .finally(() => setHydrating(false));
    },
    draft
      ? `Draft saved ${stamp(draft.draft.updated_at)}`
      : initialRoot
        ? "Saved version"
        : "Unsaved draft",
  );
  const busy = command.busy || command.uncertain || hydrating,
    disabled = !canAuthor || busy || testing || !!historical,
    signature = JSON.stringify(d);
  const activeTests = tests?.signature === signature ? tests.value : null,
    passed =
      !!activeTests &&
      activeTests.results.every((t) => t.passed) &&
      activeTests.coverage.every((c) => c.complete && !c.issues.length);
  const shown = historical?.definition ?? d,
    rule = shown.rules.find((r) => r.key === ruleKey) ?? shown.rules[0],
    ruleIndex = d.rules.findIndex((r) => r.key === rule?.key);
  function change(next: Definition) {
    if (disabled) return;
    setDefinition(next);
    setTests(null);
    command.dirty();
  }
  function editRule(patch: Partial<Rule>) {
    change({
      ...d,
      rules: d.rules.map((r, i) => (i === ruleIndex ? { ...r, ...patch } : r)),
    });
  }
  async function runTests() {
    setTesting(true);
    setError(null);
    try {
      const value = await api<Tests>("cpq/validate", {
        company_id: company,
        definition: d,
      });
      setTests({ signature, value });
    } catch (e) {
      setTests(null);
      setError(e);
    } finally {
      setTesting(false);
    }
  }
  async function saveDraft() {
    intent.current = "draft";
    await command.send("cpq/drafts", {
      id: draftId,
      company_id: company,
      kind: "Rules",
      release_id: root?.release.id ?? draft?.draft.release_id ?? null,
      estimating_workspace_id: null,
      option_id: null,
      discovery_revision_id: null,
      base_revision_id:
        root?.current.id ?? draft?.draft.base_revision_id ?? null,
      base_run_id: null,
      binding_hash: null,
      label: d.label,
      content: d,
      expected_version: draftVersion,
      reason: "Save working rule authoring draft.",
    });
  }
  async function version() {
    intent.current = "version";
    await command.send("cpq/releases", {
      id: releaseId,
      company_id: company,
      expected_version: root?.release.version ?? 0,
      definition: d,
      ...(draftVersion
        ? { draft: { id: draftId, expected_version: draftVersion } }
        : {}),
      reason:
        reason.trim() ||
        "Create an immutable version after passing the complete test bench.",
    });
  }
  async function lifecycleCommand() {
    if (!root || !lifecycle) return;
    intent.current = "lifecycle";
    const mode =
      lifecycle === "Approved" || lifecycle === "Rejected"
        ? "review"
        : lifecycle.toLowerCase();
    await command.send(`cpq/releases/${root.release.id}/${mode}`, {
      expected_version: root.release.version,
      revision_id: root.current.id,
      content_hash: root.current.content_hash,
      reason,
      ...(mode === "review"
        ? { outcome: lifecycle }
        : mode === "activate"
          ? { expected_activation_version: root.active?.version ?? 0 }
          : {}),
    });
  }
  const changes = semanticChanges(root?.current.definition ?? {}, d);
  const stale =
    serverRoot &&
    root &&
    serverRoot.release.version !== root.release.version &&
    serverRoot.release.version > root.release.version;
  const quick = activeTests?.results[scenario];
  return (
    <CpqFrame
      name="Rules studio"
      collapsed
      menu={
        <>
          <CpqNav
            label="Rule registry"
            href="/estimating/rules"
            icon="collapse"
          />
          <hr />
          {menus.map((m) => (
            <CpqNav
              key={m}
              label={m}
              selected={view === m}
              onClick={() => {
                setView(m);
                setHistorical(null);
              }}
              icon={
                m === "Releases"
                  ? "archive"
                  : m === "Test scenarios"
                    ? "check"
                    : m === "Activation history"
                      ? "clock"
                      : "list"
              }
            />
          ))}
        </>
      }
    >
      <CpqHeader
        title={view === "All rules" ? (rule?.description ?? d.label) : view}
        context={
          <>
            {rule?.key ?? "New rule set"} · {d.label}
          </>
        }
        status={
          historical
            ? `Historical version ${historical.version}`
            : command.hasUnsavedChanges
              ? "Draft · unsaved changes"
              : command.status
        }
      >
        <Button
          variant="quiet"
          onClick={() =>
            setView(view === "All rules" ? "Releases" : "All rules")
          }
        >
          {view === "All rules" ? "Release" : "Rule editor"}
        </Button>
      </CpqHeader>
      <div className="cpq-readiness">
        <span>Draft</span>
        <CpqPill>
          {draftVersion ? `Saved · draft ${draftVersion}` : "Not saved"}
        </CpqPill>
        <span>Validation / tests</span>
        <CpqPill tone={passed ? "good" : activeTests ? "bad" : "warning"}>
          {testing
            ? "Running…"
            : passed
              ? "All passing"
              : activeTests
                ? "Needs attention"
                : "Not run on this draft"}
        </CpqPill>
        <span>Published</span>
        <CpqPill>
          {root?.active
            ? `Release ${root.active.revision.version}`
            : "Not active"}
        </CpqPill>
      </div>
      {view === "All rules" && (
        <CpqTabs
          tabs={[
            "Definition",
            "Test bench",
            "Changes",
            "Where used",
            "History",
          ]}
          current={tab}
          onChange={setTab}
        />
      )}
      <div className="cpq-body">
        <div className="cpq-scroll">
          <div className="cpq-stack">
            <ErrorNotice error={command.error ?? error} />
            {command.uncertain && (
              <CpqNotice tone="warning">
                <p>Confirm the original command before changing this draft.</p>
                <Button
                  busy={command.busy}
                  onClick={() => void command.reconcile()}
                >
                  Confirm original action
                </Button>
              </CpqNotice>
            )}
            {initial.schema_version === 1 && (
              <CpqNotice>
                This working copy expands the preserved schema-1 release into a
                design draft. Existing saved releases and evaluations remain
                unchanged.
              </CpqNotice>
            )}
            {stale && (
              <CpqNotice tone="warning">
                A newer release state is available. Your draft is retained.
                Reopen the saved release in another view before retrying a
                version or publication action.
              </CpqNotice>
            )}
            {historical && (
              <CpqNotice>
                Viewing immutable release version {historical.version}.{" "}
                <Button variant="quiet" onClick={() => setHistorical(null)}>
                  Return to working draft
                </Button>
              </CpqNotice>
            )}
            {view === "All rules" && tab === "Definition" && rule && (
              <>
                <div className="cpq-section-head cpq-rule-head">
                  <h2>Rule details</h2>
                  <Button onClick={() => setDetails(!details)}>
                    {details ? "Done" : "Edit details"}
                  </Button>
                  <div className="cpq-actions cpq-rule-picker">
                    <select
                      aria-label="Selected rule"
                      value={rule.key}
                      onChange={(e) => setRuleKey(e.target.value)}
                    >
                      {shown.rules.map((r) => (
                        <option key={r.key} value={r.key}>
                          {r.description}
                        </option>
                      ))}
                    </select>
                    <Button
                      disabled={disabled || d.rules.length >= 100}
                      onClick={() => {
                        const key = `rule_${crypto.randomUUID().slice(0, 8)}`;
                        change({
                          ...d,
                          rules: [
                            ...d.rules,
                            {
                              key,
                              description: "New rule",
                              phase: "Materials",
                              when: { op: "ALL", items: [] },
                              part:
                                d.parts.find((p) => p.category !== "Labour")
                                  ?.key ?? "",
                              quantity: "",
                              priority: 1,
                              parameters: [],
                            },
                          ],
                        });
                        setRuleKey(key);
                      }}
                    >
                      + Rule
                    </Button>
                  </div>
                </div>
                {!details && (
                  <div className="cpq-detail-grid">
                    <div>
                      <small>Purpose</small>
                      <strong>Quantity calculation</strong>
                    </div>
                    <div>
                      <small>Scope</small>
                      <strong>{shown.label}</strong>
                      <small>
                        {shown.parts.find((p) => p.key === rule.part)?.scope
                          ?.kind ?? "System"}{" "}
                        output
                      </small>
                    </div>
                    <div>
                      <small>Priority</small>
                      <strong>{rule.priority}</strong>
                      <small>Larger wins within priority groups</small>
                    </div>
                    <div>
                      <small>Resolution group</small>
                      <strong>
                        {shown.parts.find((p) => p.key === rule.part)
                          ?.description ?? "Not selected"}
                      </strong>
                      <small>
                        Policy{" "}
                        {shown.parts.find((p) => p.key === rule.part)?.resolver}
                      </small>
                    </div>
                    <div>
                      <small>Release author</small>
                      <strong>
                        {root?.current_author?.display_name ?? "Working draft"}
                      </strong>
                    </div>
                    <div>
                      <small>Independent review</small>
                      <strong>
                        {root?.reviews.some(
                          (r) =>
                            r.revision_id === root.current.id &&
                            r.outcome === "Approved",
                        )
                          ? "Approved saved version"
                          : "Not yet approved"}
                      </strong>
                    </div>
                  </div>
                )}
                {details && (
                  <div className="cpq-grid">
                    <CpqField label="Rule name">
                      <input
                        disabled={disabled}
                        value={rule.description}
                        maxLength={200}
                        onChange={(e) =>
                          editRule({ description: e.target.value })
                        }
                      />
                    </CpqField>
                    <CpqField label="Stable key">
                      <input
                        disabled={disabled}
                        value={rule.key}
                        onChange={(e) => {
                          editRule({ key: e.target.value });
                          setRuleKey(e.target.value);
                        }}
                      />
                    </CpqField>
                    <CpqField label="Ruleset">
                      <input
                        disabled={disabled}
                        value={shown.label}
                        maxLength={200}
                        onChange={(e) =>
                          change({ ...d, label: e.target.value })
                        }
                      />
                    </CpqField>
                    <CpqField
                      label="Priority"
                      help="Larger wins within a PRIORITY resolution group. Equal winning priorities block use."
                    >
                      <input
                        disabled={disabled}
                        type="number"
                        min={0}
                        max={1000}
                        value={rule.priority}
                        onChange={(e) =>
                          editRule({ priority: Number(e.target.value) })
                        }
                      />
                    </CpqField>
                  </div>
                )}
                <section className="cpq-stack-tight">
                  <div className="cpq-section-head">
                    <h2>Applies when</h2>
                    <div className="cpq-actions">
                      <Button
                        disabled={disabled}
                        variant={
                          rule.when.op !== "ALWAYS" ? "primary" : "secondary"
                        }
                        onClick={() => {
                          if (rule.when.op === "ALWAYS")
                            editRule({ when: { op: "ALL", items: [] } });
                        }}
                      >
                        When conditions are true
                      </Button>
                      <Button
                        disabled={disabled}
                        variant={
                          rule.when.op === "ALWAYS" ? "primary" : "secondary"
                        }
                        onClick={() => editRule({ when: { op: "ALWAYS" } })}
                      >
                        Always applies
                      </Button>
                    </div>
                  </div>
                  <small>
                    Fields, operators and values come from the fact dictionary.
                    An empty group never means “always”.
                  </small>
                  <ConditionEditor
                    value={rule.when}
                    facts={shown.facts}
                    disabled={disabled}
                    onChange={(when) => editRule({ when })}
                  />
                  <small>
                    Use Move up / Move down to reorder conditions. Field →
                    operator → value is the keyboard order.
                  </small>
                </section>
                <section className="cpq-stack-tight">
                  <h2>Action</h2>
                  <div className="cpq-grid">
                    <CpqField label="Action type">
                      <select
                        disabled={disabled}
                        value={rule.phase}
                        onChange={(e) =>
                          editRule({
                            phase: e.target.value as Rule["phase"],
                            part: "",
                          })
                        }
                      >
                        <option value="Materials">Add part</option>
                        <option value="Labour">Add labour</option>
                      </select>
                    </CpqField>
                    <CpqField
                      label={
                        rule.phase === "Labour"
                          ? "Labour item"
                          : "Part / resolution group"
                      }
                    >
                      <select
                        disabled={disabled}
                        value={rule.part}
                        onChange={(e) => editRule({ part: e.target.value })}
                      >
                        <option value="">Choose a target</option>
                        {shown.parts
                          .filter(
                            (p) =>
                              (p.category === "Labour") ===
                              (rule.phase === "Labour"),
                          )
                          .map((p) => (
                            <option key={p.key} value={p.key}>
                              {p.description} · {p.resolver}
                            </option>
                          ))}
                      </select>
                    </CpqField>
                  </div>
                  <div className="cpq-section-head"><h3>Quantity formula</h3>
                    <Button disabled={disabled} onClick={() => setFormulaEditor(true)}>Edit formula</Button>
                  </div>
                  <CpqField
                    label="Quantity formula"
                    help="Exact decimals · + − × ÷ · parentheses · ceil, floor, round, min and max. No JavaScript or external calls."
                  >
                    <textarea
                      className="cpq-formula"
                      disabled={disabled}
                      rows={3}
                      value={rule.quantity}
                      onChange={(e) => editRule({ quantity: e.target.value })}
                    />
                  </CpqField>
                  <small>
                    Approved facts:{" "}
                    {shown.facts
                      .filter((f) => ["Decimal", "Integer"].includes(f.type))
                      .map((f) => f.key)
                      .join(", ")}
                    {rule.phase === "Labour"
                      ? `. Resolved material quantities: ${shown.parts
                          .filter((p) => p.category !== "Labour")
                          .map((p) => "bom_" + p.key)
                          .join(", ")}`
                      : ""}
                  </small>
                </section>
                <section className="cpq-stack-tight">
                  <div className="cpq-section-head">
                    <h2>Release parameters</h2>
                    <Button
                      disabled={
                        disabled || (rule.parameters?.length ?? 0) >= 20
                      }
                      onClick={() =>
                        editRule({
                          parameters: [
                            ...(rule.parameters ?? []),
                            {
                              key: `parameter_${(rule.parameters?.length ?? 0) + 1}`,
                              label: "New parameter",
                              value: "",
                              unit: "each",
                            },
                          ],
                        })
                      }
                    >
                      + Parameter
                    </Button>
                  </div>
                  {rule.parameters?.map((p, i) => (
                    <div className="cpq-grid cpq-card" key={i}>
                      {(["key", "label", "value", "unit"] as const).map((k) => (
                        <CpqField key={k} label={k}>
                          <input
                            disabled={disabled}
                            value={p[k]}
                            onChange={(e) =>
                              editRule({
                                parameters: rule.parameters!.map((x, n) =>
                                  n === i ? { ...x, [k]: e.target.value } : x,
                                ),
                              })
                            }
                          />
                        </CpqField>
                      ))}
                      <Button
                        disabled={disabled}
                        onClick={() =>
                          editRule({
                            parameters: rule.parameters!.filter(
                              (_, n) => n !== i,
                            ),
                          })
                        }
                      >
                        Remove parameter
                      </Button>
                    </div>
                  ))}
                </section>
                <div className="cpq-actions">
                  <Button
                    disabled={disabled || d.rules.length === 1}
                    variant="quiet"
                    onClick={() => {
                      change({
                        ...d,
                        rules: d.rules.filter((_, i) => i !== ruleIndex),
                      });
                      setRuleKey(
                        d.rules.find((_, i) => i !== ruleIndex)?.key ?? "",
                      );
                    }}
                  >
                    Remove rule from draft
                  </Button>
                  <Button
                    variant="quiet"
                    onClick={() => setView("Compatibility & capacity")}
                  >
                    Compatibility / capacity actions
                  </Button>
                </div>
              </>
            )}
            {((view === "All rules" && tab === "Test bench") ||
              view === "Test scenarios") && (
              <>
                <div className="cpq-section-head">
                  <div>
                    <h2>Test bench</h2>
                    <small>
                      All scenarios run against the exact current draft
                    </small>
                  </div>
                  <Button
                    variant="primary"
                    busy={testing}
                    disabled={busy || !canAuthor}
                    onClick={() => void runTests()}
                  >
                    Run all {d.fixtures.length} scenarios
                  </Button>
                </div>
                {activeTests && (
                  <>
                    <table className="cpq-table cpq-table-responsive">
                      <thead>
                        <tr>
                          <th>Scenario</th>
                          <th>Expected</th>
                          <th>Actual</th>
                          <th>Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeTests.results.map((t, i) => (
                          <tr key={i}>
                            <td>
                              <strong>{t.name}</strong>
                            </td>
                            <td data-label="Expected">
                              {t.expected.ready ? "Ready" : "Blocked"} ·{" "}
                              {money(t.expected.cost)} cost ·{" "}
                              {money(t.expected.sell)} sell
                              <small>
                                {t.expected.diagnostic_codes.join(", ") ||
                                  "No diagnostics"}
                              </small>
                            </td>
                            <td data-label="Actual">
                              {t.actual.ready ? "Ready" : "Blocked"} ·{" "}
                              {money(t.actual.cost)} cost ·{" "}
                              {money(t.actual.sell)} sell
                              <small>
                                {t.actual.diagnostic_codes.join(", ") ||
                                  "No diagnostics"}
                              </small>
                            </td>
                            <td data-label="Result">
                              <CpqPill tone={t.passed ? "good" : "bad"}>
                                {t.passed ? "Pass" : "Fail"}
                              </CpqPill>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {activeTests.coverage.map((c) => (
                      <section key={c.key} className="cpq-card">
                        <h3>{c.key} · coverage</h3>
                        <p>
                          {c.cases} known-value partitions · {c.issues.length}{" "}
                          gaps or overlaps
                        </p>
                        {!c.complete && (
                          <CpqNotice tone="warning">{c.message}</CpqNotice>
                        )}
                        {c.issues.slice(0, 20).map((issue, n) => (
                          <p key={n}>
                            <CpqPill tone="bad">{issue.state}</CpqPill>{" "}
                            {Object.entries(issue.facts)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(" · ")}{" "}
                            · matches {issue.matches.join(", ") || "none"}
                          </p>
                        ))}
                      </section>
                    ))}
                  </>
                )}
                <FixtureEditor d={d} disabled={disabled} change={change} />
              </>
            )}
            {view === "All rules" && tab === "Changes" && (
              <>
                <h2>Changes from the saved version</h2>
                <p>{changes.length} semantic changes · stable keys retained</p>
                {changes.length ? (
                  <table className="cpq-table cpq-table-responsive">
                    <thead>
                      <tr>
                        <th>Field</th>
                        <th>Before</th>
                        <th>Draft</th>
                      </tr>
                    </thead>
                    <tbody>
                      {changes.slice(0, 200).map((c) => (
                        <tr key={c.path}>
                          <td>{c.path}</td>
                          <td data-label="Before">
                            <Value value={c.before} />
                          </td>
                          <td data-label="Draft">
                            <Value value={c.after} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <CpqNotice tone="good">
                    The draft matches the saved definition.
                  </CpqNotice>
                )}
              </>
            )}
            {view === "All rules" && tab === "Where used" && (
              <>
                <h2>Where used</h2>
                <section className="cpq-card">
                  <h3>Release membership</h3>
                  {root?.members
                    .filter((m) => m.rule_key === rule?.key)
                    .map((m) => (
                      <p key={m.rule_version_id}>
                        {root.current.definition.label} · release version{" "}
                        {root.current.version} · rule v{m.version}
                      </p>
                    ))}
                  {!root && (
                    <p>
                      This draft has not been included in an immutable release.
                    </p>
                  )}
                </section>
                <section className="cpq-card">
                  <h3>Decision tables</h3>
                  {d.design?.decision_tables
                    .filter((t) =>
                      t.rows.some((r) => r.rules.includes(rule?.key ?? "")),
                    )
                    .map((t) => (
                      <p key={t.key}>{t.label}</p>
                    ))}
                  <small>
                    Current draft references. Saved evaluations retain the
                    release revision they used.
                  </small>
                </section>
              </>
            )}
            {view === "All rules" && tab === "History" && (
              <>
                <h2>Immutable rule history</h2>
                {root?.rule_versions
                  .filter((v) => v.rule_key === rule?.key)
                  .map((v) => (
                    <section key={v.id} className="cpq-card">
                      <h3>
                        v{v.version} · {stamp(v.created_at)}
                      </h3>
                      <p>{v.reason}</p>
                      <code className="cpq-formula">{v.content.quantity}</code>
                      <Button
                        disabled={disabled}
                        onClick={() => {
                          editRule(v.content);
                          setTab("Changes");
                        }}
                      >
                        Use v{v.version} in this draft
                      </Button>
                    </section>
                  ))}
                <h3>Release versions</h3>
                {root?.revisions.map((v) => (
                  <div className="cpq-section-head" key={v.id}>
                    <span>
                      Version {v.version} · {stamp(v.created_at)} · {v.reason}
                    </span>
                    <Button
                      onClick={() =>
                        void api<
                          Wire<Awaited<ReturnType<typeof readRevision>>>
                        >(`cpq/revisions/${v.id}`)
                          .then((r) => {
                            setHistorical(r);
                            setTab("Definition");
                          })
                          .catch(setError)
                      }
                    >
                      Inspect read only
                    </Button>
                  </div>
                ))}
              </>
            )}
            {view === "Fact dictionary" && (
              <FactEditor d={d} change={change} disabled={disabled} />
            )}
            {view === "Parts & cost sources" && (
              <PartsEditor d={d} change={change} disabled={disabled} />
            )}
            {[
              "Product structures",
              "Option sets",
              "Decision tables",
              "Compatibility & capacity",
              "Milestone proposals",
            ].includes(view) && (
              <DesignEditor
                d={d}
                change={change}
                disabled={disabled}
                view={view}
              />
            )}
            {view === "Releases" && (
              <>
                <h2>{root?.release.label ?? d.label}</h2>
                <CpqNotice>
                  Creating an immutable version, approving it, sealing it and
                  making it active are separate actions. The company uses its
                  active release until activation succeeds.
                </CpqNotice>
                <section className="cpq-card cpq-stack">
                  <div className="cpq-section-head">
                    <h3>Current saved version</h3>
                    <CpqPill
                      tone={
                        root?.release.state === "Published" ? "good" : "neutral"
                      }
                    >
                      {root?.release.state ?? "No version"}
                    </CpqPill>
                  </div>
                  <dl className="cpq-dl">
                    <dt>Version</dt>
                    <dd>{root?.current.version ?? "Not created"}</dd>
                    <dt>Rule members</dt>
                    <dd>{root?.members.length ?? 0}</dd>
                    <dt>Active release</dt>
                    <dd>
                      {root?.active?.revision.definition.label ?? "None"}{" "}
                      {root?.active ? `v${root.active.revision.version}` : ""}
                    </dd>
                  </dl>
                  <div className="cpq-actions">
                    {root?.capabilities.review &&
                      root.release.state === "Draft" && (
                        <>
                          <Button
                            disabled={busy}
                            onClick={() => {
                              setReason("");
                              setLifecycle("Approved");
                            }}
                          >
                            Approve saved version
                          </Button>
                          <Button
                            disabled={busy}
                            onClick={() => {
                              setReason("");
                              setLifecycle("Rejected");
                            }}
                          >
                            Reject saved version
                          </Button>
                        </>
                      )}
                    {root?.capabilities.publish &&
                      root.release.state === "Reviewed" && (
                        <Button
                          disabled={busy}
                          onClick={() => {
                            setReason("");
                            setLifecycle(
                              root.current.definition.schema_version === 3
                                ? "Seal"
                                : "Activate",
                            );
                          }}
                        >
                          {root.current.definition.schema_version === 3
                            ? "Seal release"
                            : "Activate reviewed release"}
                        </Button>
                      )}
                    {root?.capabilities.publish &&
                      ["Sealed", "Published"].includes(root.release.state) &&
                      root.active?.revision.id !== root.current.id && (
                        <Button
                          variant="primary"
                          disabled={busy}
                          onClick={() => {
                            setReason("");
                            setLifecycle("Activate");
                          }}
                        >
                          Make active
                        </Button>
                      )}
                  </div>
                </section>
                <section className="cpq-card">
                  <h3>Immutable rule versions in this release</h3>
                  <table className="cpq-table">
                    <thead>
                      <tr>
                        <th>Rule</th>
                        <th>Version</th>
                      </tr>
                    </thead>
                    <tbody>
                      {root?.members.map((m) => (
                        <tr key={m.rule_key}>
                          <td>{m.rule_key}</td>
                          <td>v{m.version}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
                <section className="cpq-card cpq-stack">
                  <h3>Pricing policy for the working draft</h3>
                  <div className="cpq-grid">
                    <CpqField label="Pricing mode">
                      <select
                        disabled={disabled}
                        value={d.design!.pricing.mode}
                        onChange={(e) =>
                          change({
                            ...d,
                            design: {
                              ...d.design!,
                              pricing: {
                                ...d.design!.pricing,
                                mode: e.target.value as
                                  "Catalog" | "Margin" | "Markup",
                                percent: "0",
                              },
                            },
                          })
                        }
                      >
                        <option>Catalog</option>
                        <option>Margin</option>
                        <option>Markup</option>
                      </select>
                    </CpqField>
                    <CpqField label="Percentage">
                      <input
                        inputMode="decimal"
                        disabled={
                          disabled || d.design!.pricing.mode === "Catalog"
                        }
                        value={d.design!.pricing.percent}
                        onChange={(e) =>
                          change({
                            ...d,
                            design: {
                              ...d.design!,
                              pricing: {
                                ...d.design!.pricing,
                                percent: e.target.value,
                              },
                            },
                          })
                        }
                      />
                    </CpqField>
                  </div>
                  <label>
                    <input
                      type="checkbox"
                      disabled={disabled}
                      checked={d.design!.pricing.allow_override}
                      onChange={(e) =>
                        change({
                          ...d,
                          design: {
                            ...d.design!,
                            pricing: {
                              ...d.design!.pricing,
                              allow_override: e.target.checked,
                            },
                          },
                        })
                      }
                    />{" "}
                    Allow configuration margin / markup adjustment
                  </label>
                </section>
              </>
            )}
            {view === "Activation history" && (
              <>
                <h2>Activation history</h2>
                {root?.activations.map((a) => (
                  <article className="cpq-card" key={a.id}>
                    <h3>
                      Activation {a.version} · {stamp(a.created_at)}
                    </h3>
                    <p>{a.reason}</p>
                    <CpqPill
                      tone={root.active?.id === a.id ? "good" : "neutral"}
                    >
                      {root.active?.id === a.id ? "Active" : "Superseded"}
                    </CpqPill>
                  </article>
                ))}
                {!root?.activations.length && (
                  <CpqEmpty>No activation has occurred.</CpqEmpty>
                )}
                <h3>Seals</h3>
                {root?.seals.map((s) => (
                  <p key={s.id}>
                    Sealed {stamp(s.created_at)} · {s.reason}
                  </p>
                ))}
                <h3>Reviews</h3>
                {root?.reviews.map((r) => (
                  <p key={r.id}>
                    {r.outcome} · {stamp(r.created_at)} · {r.reason}
                  </p>
                ))}
              </>
            )}
          </div>
        </div>
        {view === "All rules" && tab === "Definition" && !historical && (
          <aside className="cpq-summary cpq-quick-test">
            <h2>Quick test</h2>
            <CpqField label="Scenario">
              <select
                value={scenario}
                onChange={(e) => setScenario(Number(e.target.value))}
              >
                {d.fixtures.map((f, i) => (
                  <option value={i} key={i}>
                    {f.name}
                  </option>
                ))}
              </select>
            </CpqField>
            <small>
              Synthetic fixture · {d.fixtures.length} saved scenarios
            </small>
            <div className="cpq-card">
              <small>INPUTS</small>
              <dl>
                {Object.entries(
                  d.fixtures[scenario]?.input.instances[0]?.facts ?? {},
                ).map(([key, value]) => (
                  <div key={key}>
                    <dt>{d.facts.find((f) => f.key === key)?.label ?? key}</dt>
                    <dd>{value === null ? "Unknown" : String(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
            {quick && (
              <div className="cpq-card">
                <h3>Draft result</h3>
                <p>
                  Cost {money(quick.actual.cost)} · sell{" "}
                  {money(quick.actual.sell)}
                </p>
                <CpqPill tone={quick.passed ? "good" : "bad"}>
                  {quick.passed ? "Pass" : "Fail"}
                </CpqPill>
                <small>{quick.actual.diagnostic_codes.join(" · ")}</small>
              </div>
            )}
            <Button
              variant="primary"
              busy={testing}
              disabled={busy || !canAuthor}
              onClick={() => void runTests()}
            >
              Run all {d.fixtures.length} scenarios
            </Button>
            <small>
              All scenarios and coverage checks must pass on this exact draft
              before creating a version.
            </small>
          </aside>
        )}
      </div>
      {formulaEditor && rule && <CpqFormulaEditor definition={shown} rule={rule} company={company}
        onClose={() => setFormulaEditor(false)} onApply={(quantity) => { editRule({ quantity }); setFormulaEditor(false); }} />}
      <footer className="cpq-footer">
        <div>
          <strong role="status">
            {historical ? "Historical version · read only" : command.status}
          </strong>
          <small>
            {passed
              ? "All scenarios pass on this exact draft."
              : "Run all scenarios on the exact draft before creating a version."}
          </small>
        </div>
        <div className="cpq-actions">
          <Button
            disabled={disabled}
            busy={command.busy}
            onClick={() => void saveDraft()}
          >
            Save draft
          </Button>
          <Button
            variant="primary"
            disabled={disabled || !passed}
            busy={command.busy}
            onClick={() => void version()}
          >
            Create version…
          </Button>
        </div>
      </footer>
      {lifecycle && root && (
        <CpqDialog
          title={
            lifecycle === "Approved"
              ? "Approve saved version"
              : lifecycle === "Rejected"
                ? "Reject saved version"
                : lifecycle === "Seal"
                  ? "Seal release"
                  : "Make release active"
          }
          onClose={() => {
            if (!busy) setLifecycle(null);
          }}
          footer={
            <>
              <Button disabled={busy} onClick={() => setLifecycle(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={busy || !reason.trim()}
                busy={command.busy}
                onClick={() => void lifecycleCommand()}
              >
                Confirm {lifecycle.toLowerCase()}
              </Button>
            </>
          }
        >
          <div className="cpq-stack">
            <p>
              {root.current.definition.label} · immutable version{" "}
              {root.current.version} ·{" "}
              {root.members.length || root.current.definition.rules.length}{" "}
              rules
            </p>
            <CpqNotice>
              {lifecycle === "Activate"
                ? "New calculations use this release after activation. Existing evaluations retain their original release."
                : lifecycle === "Seal"
                  ? "Sealing freezes this independently approved version. It does not make the release active."
                  : "The server checks the saved content and test results. Review must be performed by someone other than the author."}
            </CpqNotice>
            <CpqField label="Reason">
              <textarea
                disabled={busy}
                autoFocus
                rows={3}
                maxLength={1000}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </CpqField>
            <ErrorNotice error={command.error} />
          </div>
        </CpqDialog>
      )}
    </CpqFrame>
  );
}
function Value({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <small>Not present</small>;
  if (typeof value !== "object") return <span>{String(value)}</span>;
  return (
    <code className="cpq-diff-value">{JSON.stringify(value, null, 2)}</code>
  );
}
