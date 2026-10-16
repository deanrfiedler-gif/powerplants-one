"use client";
import { useId, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Definition, Rule } from "../cpq/types";
import type { readRelease, listReleases, readRevision } from "../cpq/reads";
import type { readDraft } from "../cpq/drafts";
import type { validateDraft } from "../cpq/ui-reads";
import { screenDefinition } from "../cpq/pilot";
import {
  CpqFormulaEditor,
  FormulaTokens,
  formulaSymbols,
  formulaSyntax,
} from "./cpq-formula-editor";
import {
  AppliesMode,
  ConditionEditor,
  CpqMenu,
  CpqMenuItem,
  conditionIssues,
} from "./cpq-conditions";
import { ProductIcon, type ProductIconName } from "./product-icons";
import { QuickTestPanel, quickInvalid, useQuickTest } from "./cpq-quick-test";
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
  CpqState,
  CpqNotice,
  CpqDialog,
  CpqEmpty,
  useCpqCompany,
  money,
  stamp,
  type CpqTone,
  type Wire,
} from "./cpq-ui";
import {
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
    draftId = query.get("draft"),
    revisionId = query.get("revision");
  const inspected = useCrmResource<
    Wire<Awaited<ReturnType<typeof readRevision>>>
  >(revisionId ? `cpq/revisions/${revisionId}` : null, true);
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
    error =
      resource.error ??
      draft.error ??
      registry.error ??
      inspected.error ??
      (inspected.data && inspected.data.release_id !== id
        ? new Error("The selected revision belongs to another rule set.")
        : null);
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
  if (
    resource.loading ||
    draft.loading ||
    registry.loading ||
    inspected.loading
  )
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
      key={id + ":" + (draftId ?? "") + ":" + (revisionId ?? "")}
      href={id === "new" ? "/estimating/rules" : `/estimating/rules/${id}`}
    >
      <RulesEditor
        key={id + ":" + (draftId ?? "") + ":" + (revisionId ?? "")}
        company={company}
        initial={initial}
        initialRoot={resource.data}
        draft={draft.data}
        initialRule={query.get("rule")}
        initialHistorical={inspected.data}
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
  initialHistorical,
  canAuthor,
  serverRoot,
}: {
  company: string;
  initial: Definition;
  initialRoot: ReleaseView | null;
  draft: DraftView | null;
  initialRule: string | null;
  initialHistorical: Wire<Awaited<ReturnType<typeof readRevision>>> | null;
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
    [switching, setSwitching] = useState(false),
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
    > | null>(initialHistorical),
    [hydrating, setHydrating] = useState(false);
  const intent = useRef("draft");
  const reasonId = useId();
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
  const sentence = (s: string) =>
    s.charAt(0).toLowerCase() + s.slice(1).replace(/\.$/, "");
  const formulaIssue = rule
    ? formulaSyntax(rule.quantity, shown, formulaSymbols(shown, rule))
    : null;
  // Frame 488:1029 error summary: every incomplete part of this rule, each a route to its control.
  const incomplete =
    rule && !historical
      ? [
          ...conditionIssues(rule.when, shown.facts).map((i) => ({
            key: `condition-${i.number}-${i.part}`,
            text: `Applies when › condition ${i.number}: ${i.text}`,
            target: i.part
              ? `[aria-label="Condition ${i.number} ${i.part}"]`
              : null,
          })),
          ...(!rule.part
            ? [
                {
                  key: "part",
                  text: "Actions › resolution group: choose a resolution group",
                  target: ".cpq-action-body select",
                },
              ]
            : []),
          ...(formulaIssue
            ? [
                {
                  key: "formula",
                  text: `Actions › quantity formula: ${sentence(formulaIssue)}`,
                  target: ".cpq-formula-head button",
                },
              ]
            : []),
        ]
      : [];
  // Frames 486:641 / 488:1029 above "Applies when": versions, save state and publication are
  // named from saved data. A rule version is reused when its content returns to an earlier one.
  const ruleVersions: { version: number; content: Rule }[] =
      root?.rule_versions.filter((v) => v.rule_key === rule?.key) ?? [],
    versionOf = (r: Rule | undefined) =>
      r &&
      ruleVersions.find((v) => !semanticChanges(v.content, r).length)?.version,
    nextVersion = Math.max(0, ...ruleVersions.map((v) => v.version)) + 1,
    sameAs = versionOf(rule),
    draftName = sameAs ? `Draft (same as v${sameAs})` : `Draft v${nextVersion}`,
    activeRevision =
      root?.active && root.active.revision.release_id === root.release.id
        ? root.active.revision
        : null,
    activeRule = activeRevision?.definition.rules.find(
      (r) => r.key === rule?.key,
    ),
    activeVersion = versionOf(activeRule),
    baselineSource = activeRule
      ? activeRevision!.definition
      : (root?.current.definition ?? null),
    baselineLabel = activeRule
      ? `Published v${activeVersion ?? "?"}`
      : root
        ? `Saved version ${root.current.version}`
        : null;
  const baseline = useMemo(
    () => (baselineSource ? toDesign(baselineSource) : null),
    [baselineSource],
  );
  const savedAt = (v: string | undefined) => {
      if (!v) return "now";
      const t = new Date(v);
      return t.toDateString() === new Date().toDateString()
        ? t.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })
        : stamp(v);
    },
    savedTime = savedAt(draft?.draft.updated_at);
  const save: {
    tone: CpqTone;
    icon: ProductIconName;
    strip: string;
    head: string;
    bar: string;
  } = historical
    ? {
        tone: "muted",
        icon: "lock",
        strip: `Version ${historical.version} · read only`,
        head: `Release version ${historical.version} · read only`,
        bar: `Release version ${historical.version} · read only`,
      }
    : command.busy
      ? {
          tone: "neutral",
          icon: "clock",
          strip: "Saving…",
          head: "Saving…",
          bar: "Saving…",
        }
      : command.uncertain || command.error
        ? {
            tone: "bad",
            icon: "warning",
            strip: "Not saved",
            head: command.status,
            bar: command.status,
          }
        : command.hasUnsavedChanges
          ? {
              tone: "warning",
              icon: "pen-square",
              strip: "Unsaved changes",
              head: "Unsaved changes",
              bar: `Unsaved changes · revision ${draftVersion + 1} (local)`,
            }
          : draftVersion
            ? {
                tone: "neutral",
                icon: "clock",
                strip: `Saved ${savedTime}`,
                head: `${draftName} · saved ${savedTime}`,
                bar: `${draftName} · revision ${draftVersion} · saved ${savedTime}`,
              }
            : root
              ? {
                  tone: "neutral",
                  icon: "clock",
                  strip: "No draft saved",
                  head: `Release version ${root.current.version} · no draft saved`,
                  bar: `Release version ${root.current.version} · no draft saved`,
                }
              : {
                  tone: "warning",
                  icon: "pen-square",
                  strip: "Not saved",
                  head: "Not saved",
                  bar: "New rule set · not saved",
                };
  const showQuick =
      view === "All rules" &&
      (tab === "Definition" || tab === "Test bench") &&
      !historical,
    quick = useQuickTest({
      company,
      definition: d,
      signature,
      baseline,
      ruleKey: rule?.key,
      scenario,
      enabled: showQuick && canAuthor && !!rule && !incomplete.length,
    });
  const validation: { tone: CpqTone; icon: ProductIconName; text: string } =
      incomplete.length
        ? {
            tone: "warning",
            icon: "warning",
            text: `Incomplete · ${incomplete.length}`,
          }
        : quickInvalid(quick)
          ? { tone: "bad", icon: "warning", text: "Refused by the server check" }
          : { tone: "good", icon: "converted", text: "Valid" },
    failing = activeTests
      ? activeTests.results.filter((t) => !t.passed).length +
        activeTests.coverage.filter((c) => !c.complete || c.issues.length).length
      : 0,
    testState: { tone: CpqTone; icon: ProductIconName; text: string } = testing
      ? { tone: "neutral", icon: "clock", text: "Running…" }
      : passed
        ? {
            tone: "good",
            icon: "converted",
            text: `All ${activeTests!.results.length} passing`,
          }
        : activeTests
          ? { tone: "bad", icon: "circle-xmark", text: `${failing} failing` }
          : { tone: "warning", icon: "warning", text: "Not run on this draft" },
    published: { tone: CpqTone; text: string } =
      activeRule && activeRevision
        ? {
            tone: "link",
            text: `v${activeVersion ?? "?"} · active in release version ${activeRevision.version}`,
          }
        : activeRevision
          ? { tone: "muted", text: "Not in the active release" }
          : { tone: "muted", text: root?.active ? "Not active" : "Not published" },
    reasonText = historical
      ? "Return to the working draft to edit or save."
      : !canAuthor
        ? "Your role can read rules. Author permission is required to save or create a version."
        : incomplete.length
          ? "An incomplete draft can be saved. It cannot become a version until it is complete and tested."
          : testing
            ? "Running all scenarios on this exact draft…"
            : passed
              ? "All scenarios pass on this exact draft. It can become a version."
              : activeTests
                ? "Some scenarios fail on this exact draft. Fix them before creating a version."
                : "Run the test scenarios on this exact draft before creating a version.",
    whereUsed =
      (root?.members.filter((m) => m.rule_key === rule?.key).length ?? 0) +
      (d.design?.decision_tables.filter((t) =>
        t.rows.some((r) => r.rules.includes(rule?.key ?? "")),
      ).length ?? 0),
    firstGap = /^condition-(\d+)/.exec(incomplete[0]?.key ?? ""),
    blocked = !incomplete.length
      ? null
      : firstGap
        ? `No result: condition ${firstGap[1]} is incomplete`
        : incomplete[0].key === "part"
          ? "No result: choose a resolution group"
          : "No result: the quantity formula is incomplete",
    purpose = rule?.phase === "Labour" ? "Labour effort" : "Quantity",
    detailsNote = `${purpose} rule in the ${shown.label} ruleset. ${
      activeRule && activeRevision
        ? `Editing this draft never changes v${activeVersion ?? "?"}, which active release version ${activeRevision.version} uses.`
        : root
          ? `Editing this draft never changes saved release version ${root.current.version}.`
          : "This rule has not been saved as a version yet."
    }`;
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
      {/* CPQ / Context header: rule key · ruleset · you · save state, and the "⋯" record menu.
          Switching and adding rules, and the release view, live in that menu (no picker is drawn). */}
      <CpqHeader
        record
        title={view === "All rules" ? (rule?.description ?? d.label) : view}
        context={
          <span>
            {rule?.key ?? "New rule set"} · {d.label}
          </span>
        }
        status={save.head}
        dot={save.tone}
      >
        <CpqMenu
          label="More rule actions"
          className="cpq-more-button"
          trigger={<ProductIcon name="more" />}
        >
          {view === "All rules" ? (
            <CpqMenuItem
              disabled={shown.rules.length < 2}
              onClick={() => setSwitching(true)}
            >
              Switch rule…
            </CpqMenuItem>
          ) : (
            <CpqMenuItem onClick={() => setView("All rules")}>
              Open rule editor
            </CpqMenuItem>
          )}
          <CpqMenuItem
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
                      d.parts.find((p) => p.category !== "Labour")?.key ?? "",
                    quantity: "",
                    priority: 1,
                    parameters: [],
                  },
                ],
              });
              setRuleKey(key);
              setView("All rules");
              setTab("Definition");
            }}
          >
            Add a rule
          </CpqMenuItem>
          {view !== "Releases" && (
            <CpqMenuItem
              onClick={() => {
                setView("Releases");
                setHistorical(null);
              }}
            >
              Release and publication
            </CpqMenuItem>
          )}
        </CpqMenu>
      </CpqHeader>
      <div className="cpq-rule-state" role="group" aria-label="Rule state">
        <span>
          Draft
          <CpqState icon={save.icon} tone={save.tone}>
            {save.strip}
          </CpqState>
        </span>
        {!historical && (
          <>
            <span>
              Validation
              <CpqState icon={validation.icon} tone={validation.tone}>
                {validation.text}
              </CpqState>
            </span>
            <span>
              Tests
              <CpqState icon={testState.icon} tone={testState.tone}>
                {testState.text}
              </CpqState>
            </span>
          </>
        )}
        <span>
          Published
          <CpqState icon="code-branch" tone={published.tone}>
            {published.text}
          </CpqState>
        </span>
      </div>
      {view === "All rules" && (
        <CpqTabs
          record
          tabs={[
            { key: "Definition", label: "Definition" },
            {
              key: "Test bench",
              label: "Test bench",
              count: d.fixtures.length,
              description: `${d.fixtures.length} saved ${d.fixtures.length === 1 ? "scenario" : "scenarios"}`,
            },
            {
              key: "Changes",
              label: root ? `Changes vs version ${root.current.version}` : "Changes",
            },
            {
              key: "Where used",
              label: "Where used",
              count: whereUsed,
              description: `${whereUsed} ${whereUsed === 1 ? "use" : "uses"} of this rule`,
            },
            {
              key: "History",
              label: "History",
              count: ruleVersions.length,
              description: `${ruleVersions.length} saved ${ruleVersions.length === 1 ? "version" : "versions"} of this rule`,
            },
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
                <IncompleteSummary items={incomplete} />
                <div className="cpq-rule-section-head cpq-rule-details-head">
                  <div>
                    <h2>Rule details</h2>
                    <p>{detailsNote}</p>
                  </div>
                  <Button onClick={() => setDetails(!details)}>
                    <ProductIcon name={details ? "check" : "pen-square"} />
                    {details ? "Done" : "Edit details"}
                  </Button>
                </div>
                {!details && (
                  <dl className="cpq-detail-grid cpq-rule-details">
                    <div>
                      <dt>Purpose</dt>
                      <dd>{purpose} calculation</dd>
                    </div>
                    <div>
                      <dt>Scope</dt>
                      <dd>{shown.label}</dd>
                      <dd>
                        {shown.parts.find((p) => p.key === rule.part)?.scope
                          ?.kind ?? "System"}{" "}
                        output
                      </dd>
                    </div>
                    <div>
                      <dt>Priority</dt>
                      <dd>{rule.priority}</dd>
                      <dd>Larger wins within PRIORITY groups</dd>
                    </div>
                    <div>
                      <dt>Resolution group</dt>
                      <dd>
                        {shown.parts.find((p) => p.key === rule.part)
                          ?.description ?? "Not selected"}
                      </dd>
                      <dd>
                        Policy{" "}
                        {shown.parts.find((p) => p.key === rule.part)
                          ?.resolver ?? "not set"}
                      </dd>
                    </div>
                    <div>
                      <dt>Release author</dt>
                      <dd>
                        {root?.current_author?.display_name ?? "Working draft"}
                      </dd>
                      <dd>
                        {root
                          ? `Saved release version ${root.current.version}`
                          : "Not saved as a version"}
                      </dd>
                    </div>
                    <div>
                      <dt>Independent review</dt>
                      <dd>
                        {root?.reviews.some(
                          (r) =>
                            r.revision_id === root.current.id &&
                            r.outcome === "Approved",
                        )
                          ? "Approved saved version"
                          : "Not yet approved"}
                      </dd>
                      <dd>The reviewer must not be the author</dd>
                    </div>
                  </dl>
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
                <section className="cpq-rule-section">
                  <div className="cpq-rule-section-head">
                    <div>
                      <h2>Applies when</h2>
                      <p>
                        Fields, operators and values come from the fact
                        dictionary. An empty group never means “always”.
                      </p>
                    </div>
                    <AppliesMode
                      value={rule.when}
                      facts={shown.facts}
                      disabled={disabled}
                      onChange={(when) => editRule({ when })}
                    />
                  </div>
                  <ConditionEditor
                    value={rule.when}
                    facts={shown.facts}
                    disabled={disabled}
                    modeChoice={false}
                    onChange={(when) => editRule({ when })}
                  />
                  {rule.when.op !== "ALWAYS" && (
                    <p className="cpq-keyboard-note">
                      <ProductIcon name="keyboard" />
                      Reorder with Move up / Move down or Alt + ↑ ↓; dragging is
                      optional. Tab moves field → operator → value.
                    </p>
                  )}
                </section>
                <ActionSection
                  definition={shown}
                  rule={rule}
                  saved={
                    historical
                      ? undefined
                      : root?.current.definition.rules.find(
                          (r) => r.key === rule.key,
                        )
                  }
                  savedVersion={root?.current.version}
                  disabled={disabled}
                  canRemove={d.rules.length > 1}
                  onEdit={editRule}
                  onFormula={() => setFormulaEditor(true)}
                  onChecks={() => setView("Compatibility & capacity")}
                  onRemove={() => {
                    change({
                      ...d,
                      rules: d.rules.filter((_, i) => i !== ruleIndex),
                    });
                    setRuleKey(
                      d.rules.find((_, i) => i !== ruleIndex)?.key ?? "",
                    );
                  }}
                />
                <section className="cpq-rule-section">
                  <div className="cpq-rule-section-head">
                    <div>
                      <h2>Release parameters</h2>
                      <p>
                        Named values this rule’s formula uses. They are saved
                        with each version of the release.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="cpq-add"
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
                      <ProductIcon name="plus" />
                      Parameter
                    </button>
                  </div>
                  {rule.parameters?.length ? (
                    <div className="cpq-parameters">
                      <div className="cpq-parameter-row" aria-hidden="true">
                        <small>Key</small>
                        <small>Label</small>
                        <small>Value</small>
                        <small>Unit</small>
                      </div>
                      {rule.parameters.map((p, i) => (
                        <div className="cpq-parameter-row" key={i}>
                          {(["key", "label", "value", "unit"] as const).map(
                            (k) => (
                              <label className="cpq-box" key={k}>
                                <span className="cpq-box-label">
                                  {k[0].toUpperCase() + k.slice(1)}
                                </span>
                                <input
                                  aria-label={`Parameter ${i + 1} ${k}`}
                                  disabled={disabled}
                                  inputMode={k === "value" ? "decimal" : "text"}
                                  value={p[k]}
                                  onChange={(e) =>
                                    editRule({
                                      parameters: rule.parameters!.map(
                                        (x, n) =>
                                          n === i
                                            ? { ...x, [k]: e.target.value }
                                            : x,
                                      ),
                                    })
                                  }
                                />
                              </label>
                            ),
                          )}
                          <button
                            type="button"
                            className="cpq-icon-button"
                            aria-label={`Remove parameter ${p.key || i + 1}`}
                            title="Remove parameter"
                            disabled={disabled}
                            onClick={() =>
                              editRule({
                                parameters: rule.parameters!.filter(
                                  (_, n) => n !== i,
                                ),
                              })
                            }
                          >
                            <ProductIcon name="trash" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="cpq-muted">
                      No parameters. Add one to name a value the formula uses.
                    </p>
                  )}
                </section>
              </>
            )}
            {((view === "All rules" && tab === "Test bench") ||
              view === "Test scenarios") && (
              <>
                {/* Tablet frame 39 and the phone Test tab: below 1100 px the quick test moves
                    here from beside the definition. */}
                {view === "All rules" && rule && !historical && (
                  <QuickTestPanel
                    inline
                    definition={d}
                    rule={rule}
                    scenario={scenario}
                    onScenario={setScenario}
                    run={quick}
                    enabled={canAuthor}
                    blocked={blocked}
                    chip={draftName}
                    baselineLabel={baselineLabel}
                    baselineHasRule={!!baseline?.rules.some((r) => r.key === rule.key)}
                  />
                )}
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
        {view === "All rules" && tab === "Definition" && !historical && rule && (
          <QuickTestPanel
            definition={d}
            rule={rule}
            scenario={scenario}
            onScenario={setScenario}
            run={quick}
            enabled={canAuthor}
            blocked={blocked}
            chip={draftName}
            baselineLabel={baselineLabel}
            baselineHasRule={!!baseline?.rules.some((r) => r.key === rule.key)}
            runAll={{
              onClick: () => void runTests(),
              busy: testing,
              disabled: busy || !canAuthor,
            }}
          />
        )}
      </div>
      {formulaEditor && rule && (
        <CpqFormulaEditor
          definition={shown}
          rule={rule}
          company={company}
          onClose={() => setFormulaEditor(false)}
          onApply={(quantity) => {
            editRule({ quantity });
            setFormulaEditor(false);
          }}
        />
      )}
      {switching && (
        <CpqDialog title="Switch rule" onClose={() => setSwitching(false)}>
          <ul className="cpq-rule-list" aria-label="Rules in this draft">
            {shown.rules.map((r) => (
              <li key={r.key}>
                <button
                  type="button"
                  aria-current={r.key === rule?.key ? "true" : undefined}
                  onClick={() => {
                    setRuleKey(r.key);
                    setSwitching(false);
                  }}
                >
                  <strong>{r.description}</strong>
                  <small>
                    {r.key} ·{" "}
                    {r.phase === "Labour" ? "Labour effort" : "Material quantity"}
                  </small>
                </button>
              </li>
            ))}
          </ul>
        </CpqDialog>
      )}
      {/* Draft bar: save state with its dot and revision, the reason, Save draft and Create
          version. Create version stays visibly unavailable, with the reason, until it can run. */}
      <footer className="cpq-footer cpq-draft-bar">
        <div>
          <p className="cpq-save-state">
            <span className="cpq-dot" data-tone={save.tone} />
            <span role="status">{save.bar}</span>
          </p>
          <small id={reasonId}>{reasonText}</small>
        </div>
        <div className="cpq-actions">
          <Button
            variant={command.hasUnsavedChanges ? "primary" : "secondary"}
            disabled={disabled}
            busy={command.busy}
            onClick={() => void saveDraft()}
          >
            <ProductIcon name="save" />
            Save draft
          </Button>
          {passed && !disabled ? (
            <Button
              variant="primary"
              busy={command.busy}
              onClick={() => void version()}
            >
              Create version…
            </Button>
          ) : (
            <Button
              className="cpq-unavailable"
              disabled
              aria-describedby={reasonId}
            >
              <ProductIcon name="lock" />
              Create version…
            </Button>
          )}
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
function IncompleteSummary({
  items,
}: {
  items: { key: string; text: string; target: string | null }[];
}) {
  if (!items.length) return null;
  return (
    <section className="cpq-error-summary" aria-labelledby="cpq-incomplete">
      <h2 id="cpq-incomplete">
        <ProductIcon name="warning" />
        This draft is incomplete · {items.length}{" "}
        {items.length === 1 ? "item" : "items"}
      </h2>
      <ul>
        {items.map((i) => (
          <li key={i.key}>
            {i.target ? (
              <button
                type="button"
                className="cpq-summary-link"
                onClick={() => {
                  const control = document.querySelector<HTMLElement>(
                    `#ppo-cpq ${i.target}`,
                  );
                  control?.scrollIntoView({ block: "center" });
                  control?.focus({ preventScroll: true });
                }}
              >
                {i.text}
              </button>
            ) : (
              i.text
            )}
          </li>
        ))}
      </ul>
      <p>
        You can still save the draft. Empty text, “-” or “1.” stay incomplete;
        they are never read as zero.
      </p>
    </section>
  );
}
// Accepted frame 486:641 "Actions": one form per action type (CPQ / Action card header 469:471 and
// CPQ / Control 466:230). A release rule carries exactly one action, so Add action stays visible
// as unavailable with its reason. The resolution group is the rule's target part; product and unit
// belong to that part and are shown read only. Rounding exists only inside the formula.
function ActionSection({
  definition,
  rule,
  saved,
  savedVersion,
  disabled,
  canRemove,
  onEdit,
  onFormula,
  onChecks,
  onRemove,
}: {
  definition: Definition;
  rule: Rule;
  saved?: Rule;
  savedVersion?: number;
  disabled: boolean;
  canRemove: boolean;
  onEdit: (patch: Partial<Rule>) => void;
  onFormula: () => void;
  onChecks: () => void;
  onRemove: () => void;
}) {
  const id = useId(),
    labour = rule.phase === "Labour",
    title = labour ? "Labour effort" : "Material quantity",
    part = definition.parts.find((p) => p.key === rule.part),
    symbols = formulaSymbols(definition, rule),
    syntax = formulaSyntax(rule.quantity, definition, symbols),
    compared =
      saved && savedVersion
        ? saved.quantity === rule.quantity
          ? ` · same as saved version ${savedVersion}`
          : ` · changed from saved version ${savedVersion}`
        : "";
  return (
    <section className="cpq-rule-section">
      <div className="cpq-rule-section-head">
        <div>
          <h2>Actions</h2>
          <p id={`${id}-note`}>
            Each action has its own form. This rule has one{" "}
            {title.toLowerCase()} (one action per rule).
          </p>
        </div>
        <Button
          className="cpq-unavailable"
          disabled
          title="A release rule holds one action. Add another action as its own rule."
          aria-describedby={`${id}-note`}
        >
          <ProductIcon name="lock" />
          Add action
        </Button>
      </div>
      <article className="cpq-action-card" aria-labelledby={`${id}-title`}>
        <header>
          <span className="cpq-action-type">
            <ProductIcon name={labour ? "helmet" : "box-open"} />
          </span>
          <div className="cpq-action-title">
            <strong id={`${id}-title`}>{title}</strong>
            <small>
              {part
                ? `${part.description} · ${part.unit}`
                : "Choose a resolution group"}
            </small>
          </div>
          <CpqMenu
            label={`${title} actions`}
            className="cpq-icon-button"
            trigger={<ProductIcon name="more" />}
            disabled={disabled}
          >
            <CpqMenuItem
              onClick={() =>
                onEdit({ phase: labour ? "Materials" : "Labour", part: "" })
              }
            >
              {labour ? "Change to material quantity" : "Change to labour effort"}
            </CpqMenuItem>
            <CpqMenuItem onClick={onChecks}>
              Compatibility and capacity checks
            </CpqMenuItem>
            <CpqMenuItem danger disabled={!canRemove} onClick={onRemove}>
              Remove rule from draft
            </CpqMenuItem>
          </CpqMenu>
        </header>
        <div className="cpq-action-body">
          <div className="cpq-grid">
            <ReadOnlyField
              label={labour ? "Labour item" : "Product"}
              value={part?.description ?? "Not chosen"}
              help={
                part?.product
                  ? "Maintained in Products. Edit it there."
                  : "Defined in Parts & cost sources. Edit it there."
              }
            />
            <ReadOnlyField
              label={labour ? "Effort unit" : "Installed unit"}
              value={part?.unit ?? "Not chosen"}
              help="From the selected part; a group uses one unit"
            />
          </div>
          <div className="cpq-formula-field">
            <div className="cpq-formula-head">
              <span id={`${id}-formula`}>Quantity formula</span>
              <Button disabled={disabled} onClick={onFormula}>
                <ProductIcon name="function" />
                Edit formula
              </Button>
            </div>
            <div
              className="cpq-formula-box"
              role="group"
              aria-labelledby={`${id}-formula`}
              data-formula={rule.quantity}
            >
              {rule.quantity.trim() ? (
                <FormulaTokens formula={rule.quantity} symbols={symbols} />
              ) : (
                <span className="cpq-muted">No formula yet</span>
              )}
              <p
                className="cpq-formula-check"
                data-tone={syntax ? "warning" : "good"}
              >
                <ProductIcon name={syntax ? "warning" : "converted"} />
                {syntax
                  ? `Incomplete · ${syntax}`
                  : `Valid · result in ${part?.unit ?? "the part’s unit"}${compared}`}
              </p>
            </div>
          </div>
          <div className="cpq-grid">
            <ReadOnlyField
              label="Rounding"
              value="As written in the formula"
              help="Use ceil, floor or round in the formula; there is no separate rounding step"
            />
            <CpqField
              label="Resolution group"
              help="Every rule in a group uses the same policy and unit"
            >
              <select
                disabled={disabled}
                value={rule.part}
                onChange={(e) => onEdit({ part: e.target.value })}
              >
                <option value="">Choose a resolution group</option>
                {definition.parts
                  .filter((p) => (p.category === "Labour") === labour)
                  .map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.description} · {p.resolver}
                    </option>
                  ))}
              </select>
            </CpqField>
          </div>
        </div>
      </article>
    </section>
  );
}
function ReadOnlyField({
  label,
  value,
  help,
}: {
  label: string;
  value: string;
  help: string;
}) {
  const id = useId();
  return (
    <label className="cpq-field">
      <span>{label}</span>
      <span className="cpq-readonly">
        <input readOnly value={value} aria-describedby={`${id}-help`} />
        <ProductIcon name="lock" />
      </span>
      <small id={`${id}-help`}>{help}</small>
    </label>
  );
}
function Value({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <small>Not present</small>;
  if (typeof value !== "object") return <span>{String(value)}</span>;
  return (
    <code className="cpq-diff-value">{JSON.stringify(value, null, 2)}</code>
  );
}
