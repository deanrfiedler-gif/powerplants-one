"use client";
import { useMemo, useRef, useState } from "react";
import { Button, ButtonLink } from "../components/ui/button";
import { RegisterChip, RegisterEmpty, RegisterFooter, RegisterSortHeader, RegisterTable } from "../components/ui/register-table";
import { ShellIcon } from "../components/shell-icon";
import {
  ErrorNotice,
  Field,
  ReadState,
  SelectField,
  Status,
  ValidationFields,
} from "../components/business-ui";
import {
  LookupField,
  LocalDateTimeField,
  RecordPanel,
  RecordTabs,
} from "../components/record-ui";
import { Board, Grid } from "../components/crm-worklist-board";
import {
  ForecastWorklist,
  WorklistChoice,
  WorklistPanel,
} from "../components/crm-worklist-tools";
import { ProjectsGantt } from "../components/projects-gantt";
import {
  AppointmentCard,
  laneExtendedHours,
  PlannerBoard,
} from "../scheduling/components/client/planner-screens.client";
import { AreasEditor } from "../components/configuration-editor";
import { addDays } from "../projects/model";
import { type ExampleId } from "./component-model";
import {
  appointmentFixture,
  schedulingPolicyHoldFixture,
  areaFixture,
  customerRecordTabsFixture,
  salesEvidenceFixture,
  salesRecordTabsFixture,
  equipmentDateFixture,
  fixtureDate,
  fixtureId,
  fixtureTime,
  plannerFixture,
  longSchedulingResourceName,
  projectFixture,
  registerTableFixture,
  salesFixture,
} from "./component-fixtures";
import "../components/discovery.css";
import "../components/estimation-wizard.css";
import { TechnicalContent } from "../products/components/shared";
import { productTechnicalFixture } from "./component-fixtures";

function FieldsExample({
  state,
  mobile = false,
}: {
  state: string;
  mobile?: boolean;
}) {
  const [title, setTitle] = useState(
      mobile && state !== "invalid"
        ? "Inspect climate sensors in the propagation growing area"
        : "",
    ),
    [kind, setKind] = useState(""),
    [notes, setNotes] = useState(state === "sales-evidence" ? salesEvidenceFixture : ""),
    [date, setDate] = useState(""),
    [effective, setEffective] = useState(equipmentDateFixture.value),
    [movement, setMovement] = useState(equipmentDateFixture.value),
    [saved, setSaved] = useState(false),
    [invalid, setInvalid] = useState(state === "invalid");
  const error = useMemo(
    () =>
      invalid
        ? {
            message: "Review the required fields.",
            field_errors: [
              {
                field: "catalogue-title",
                message: "Enter a title before saving.",
              },
            ],
          }
        : null,
    [invalid],
  );
  return (
    <form
      className="business-form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setInvalid(!title.trim());
        setSaved(!!title.trim());
      }}
    >
      <ValidationFields error={error}>
        <ErrorNotice error={error} />
        <fieldset disabled={state === "disabled" || state === "saving"}>
          <legend>Synthetic record details</legend>
          <Field
            name="catalogue-title"
            label="Record title"
            value={title}
            onChange={(v) => {
              setTitle(v);
              setSaved(false);
            }}
            required
            hint="This example keeps changes in this preview only."
          />
          <SelectField
            name="catalogue-kind"
            label="Visit type"
            value={kind}
            onChange={setKind}
            options={[
              { id: "Inspection", display_name: "Inspection" },
              { id: "Follow-up", display_name: "Follow-up visit" },
            ]}
          />
          <Field
            name="catalogue-date"
            label="Requested date"
            type="date"
            value={date}
            onChange={setDate}
          />
          <Field
            name="catalogue-notes"
            label="Notes"
            multiline
            maxLength={4000}
            value={notes}
            onChange={setNotes}
            hint="Include useful context; no customer data."
          />
          <LocalDateTimeField
            name={equipmentDateFixture.firstName}
            validationField={equipmentDateFixture.validationField}
            label="Configuration effective time"
            value={effective}
            onChange={setEffective}
          />
          <LocalDateTimeField
            name={equipmentDateFixture.secondName}
            validationField={equipmentDateFixture.validationField}
            label="Movement effective time"
            value={movement}
            onChange={setMovement}
          />
          <label>
            <input type="checkbox" /> Include a follow-up reminder in this
            example
          </label>
        </fieldset>
        <Button
          variant="primary"
          type="submit"
          busy={state === "saving"}
          disabled={state === "disabled"}
        >
          Save example
        </Button>
      </ValidationFields>
      <p role="status">
        {saved
          ? "Saved in this preview only. No server record was created."
          : "Unsaved example — changes reset when the example is reloaded."}
      </p>
    </form>
  );
}
function SalesExample({
  kind,
  state,
}: {
  kind: "sales-board" | "sales-table" | "forecast";
  state: string;
}) {
  const [items, setItems] = useState(() =>
      state === "empty"
        ? []
        : salesFixture.items.map((item) => ({
            ...item,
            can_edit: state !== "read-only",
          })),
    ),
    [message, setMessage] = useState(""),
    [move, setMove] = useState<string | null>(null),
    [stage, setStage] = useState("Discovery"),
    [selectedStage, setSelectedStage] = useState("Discovery"),
    [query, setQuery] = useState(""),
    [sort, setSort] = useState("Reference");
  const position = useRef({ top: 0, left: 0 });
  const scroll = useMemo(
    () => ({
      read: () => position.current,
      save: (top: number, left: number) => {
        position.current = { top, left };
      },
    }),
    [],
  );
  const shown = items
    .filter((item) =>
      `${item.title} ${item.organisation_name}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .toSorted((a, b) =>
      sort === "Title"
        ? a.title.localeCompare(b.title)
        : a.display_number.localeCompare(b.display_number),
    );
  const data = {
    ...salesFixture,
    items: shown,
    stages: salesFixture.stages.map((s) => ({
      ...s,
      count: shown.filter((i) => i.stage_id === s.stage_id).length,
    })),
  };
  const notice = () =>
    setMessage("Example action selected. No business record changed.");
  function applyMove(id: string, next: string) {
    setItems((old) =>
      old.map((item) =>
        item.id === id
          ? { ...item, stage_id: next as typeof item.stage_id }
          : item,
      ),
    );
    setMessage("Stage changed in this preview only.");
  }
  if (state === "loading")
    return <ReadState loading error={null} retry={() => {}} />;
  return (
    <section
      id="ppo-deals"
      className="crm-workspace crm-r38"
      data-density={state === "compact" ? "compact" : "comfortable"}
    >
      <div className="catalogue-example-toolbar">
        <Field
          name="catalogue-sales-search"
          label="Filter example deals"
          value={query}
          onChange={setQuery}
        />
        <WorklistChoice
          label="Example sort"
          value={sort}
          onChange={setSort}
          options={[
            { id: "Reference", label: "Reference" },
            { id: "Title", label: "Title A–Z" },
          ]}
        />
      </div>
      {kind === "sales-board" && (
        <div className="catalogue-example-toolbar">
          <WorklistChoice
            label="Board stage on smaller screens"
            value={selectedStage}
            onChange={setSelectedStage}
            options={salesFixture.stages.map((s) => ({
              id: s.stage_id,
              label: s.stage_id,
            }))}
          />
        </div>
      )}
      {kind === "sales-table" ? (
        <Grid data={data} scroll={scroll} onOpen={notice} />
      ) : kind === "forecast" ? (
        <ForecastWorklist items={shown} asOf={fixtureTime} onEdit={notice} />
      ) : (
        <Board
          data={data}
          selected={selectedStage}
          scroll={scroll}
          onOpen={notice}
          onStage={(id) => {
            setMove(id);
            setStage(items.find((i) => i.id === id)?.stage_id ?? "Discovery");
          }}
          blocked={state === "read-only"}
          onMove={applyMove}
          onActivity={notice}
          onEdit={notice}
          onOutcome={notice}
        />
      )}
      <p role="status">
        {message || "Synthetic results · AUD excluding GST · preview only"}
      </p>
      {move && (
        <WorklistPanel title="Move example deal" onClose={() => setMove(null)}>
          <SelectField
            name="catalogue-stage"
            label="Destination stage"
            value={stage}
            onChange={setStage}
            options={salesFixture.stages.map((s) => ({
              id: s.stage_id,
              display_name: s.stage_id,
            }))}
          />
          <Button
            onClick={() => {
              applyMove(move, stage);
              setMove(null);
            }}
          >
            Apply to preview
          </Button>
        </WorklistPanel>
      )}
    </section>
  );
}
function GanttExample({ state }: { state: string }) {
  const [message, setMessage] = useState(""),
    [task, setTask] = useState<string | null>(null);
  const schedule = {
    ...projectFixture,
    project: { ...projectFixture.project, can_edit: state !== "read-only" },
    tasks:
      state === "empty"
        ? []
        : state === "undated"
          ? projectFixture.tasks.map((t) => ({
              ...t,
              start_date: null,
              finish_date: null,
            }))
          : projectFixture.tasks,
  };
  return (
    <>
      <ProjectsGantt
        persistLayout={false}
        schedule={schedule}
        referenceDate={fixtureDate}
        preferenceKey={`ppo.catalogue.gantt.${state}`}
        onTask={(t) => setTask(t?.title ?? "New example task")}
        onHistory={() =>
          setMessage("Synthetic fixture has no saved business history.")
        }
        onRefresh={() =>
          setMessage("Fixed synthetic schedule restored; no server request.")
        }
        loading={state === "loading"}
        saved={message}
        programme={state === "programme"}
      />
      {task && (
        <WorklistPanel title={task} onClose={() => setTask(null)}>
          <p>
            This is a synthetic task. Dates, dependencies and warnings are
            rendered by ProjectsGantt. Editing saved project work is outside
            this example.
          </p>
        </WorklistPanel>
      )}
    </>
  );
}
function PlannerExample({
  state,
  card = false,
}: {
  state: string;
  card?: boolean;
}) {
  const [mode, setMode] = useState<"day" | "week">(
      state === "week" ? "week" : "day",
    ),
    [message, setMessage] = useState("");
  const a = {
    ...appointmentFixture,
    status: state === "proposed" ? "Proposed" : "Confirmed",
    ...(state === "extended-hours"
      ? { start_at: "2026-09-22T21:30:00Z", end_at: "2026-09-22T23:30:00Z" }
      : {}),
    scope_review_required: state === "review-required",
    policy_impacts: state === "policy-hold" ? [schedulingPolicyHoldFixture] : [],
    actions: {
      ...appointmentFixture.actions,
      can_manage: state !== "read-only",
    },
  };
  const data = {
    ...plannerFixture,
    items: state === "empty" ? [] : [a],
    resources: plannerFixture.resources.map((r) =>
      state === "long-label" ? { ...r, name: longSchedulingResourceName } : r,
    ),
  };
  return (
    <>
      <p>
        Display timezone: Australia/Sydney · Fixed example date: 23 September
        2026
      </p>
      {card ? (
        <AppointmentCard
          a={a}
          zone="Australia/Sydney"
          extended={laneExtendedHours(a, plannerFixture.resources[0])}
          onMove={() =>
            setMessage(
              "Move requested in the example. The saved appointment is unchanged.",
            )
          }
        />
      ) : (
        <>
          <div className="catalogue-example-toolbar">
            <Button
              aria-pressed={mode === "day"}
              onClick={() => setMode("day")}
            >
              Day
            </Button>
            <Button
              aria-pressed={mode === "week"}
              onClick={() => setMode("week")}
            >
              Week
            </Button>
          </div>
          <PlannerBoard
            data={data}
            days={Array.from({ length: mode === "week" ? 7 : 1 }, (_, i) =>
              addDays(fixtureDate, i),
            )}
            mode={mode}
            zone="Australia/Sydney"
            usable={state !== "read-only"}
            onDrop={(e) => {
              e.preventDefault();
              setMessage(
                "Move proposed in the preview. Server conflict and readiness checks are not simulated as accepted bookings.",
              );
            }}
            onMove={() =>
              setMessage(
                "Move or reassign selected. Booking remains unchanged; this example exercises presentation only.",
              )
            }
            onDragNotice={setMessage}
          />
        </>
      )}
      <p role="status">
        {message ||
          "Availability blocks and reserved periods remain visible. No booking is saved."}
      </p>
    </>
  );
}
function LookupExample({ state }: { state: string }) {
  const [value, setValue] = useState(""),
    [search, setSearch] = useState("");
  const options = [
    { id: fixtureId(10), display_name: "Example nursery" },
    {
      id: fixtureId(11),
      display_name: "Synthetic propagation site — long site name",
    },
  ].filter((o) => o.display_name.toLowerCase().includes(search.toLowerCase()));
  return (
    <LookupField
      name="catalogue-lookup"
      label="Site"
      value={value}
      onChange={setValue}
      search={search}
      onSearch={setSearch}
      options={state === "empty" ? [] : options}
      loading={state === "loading"}
      error={state === "error"}
      more={false}
    />
  );
}
function AreasExample({ state }: { state: string }) {
  const [value, setValue] = useState(() =>
      state === "empty" ? { ...areaFixture(), areas: [] } : areaFixture(),
    ),
    [message, setMessage] = useState("");
  return (
    <section className="es02">
      <AreasEditor
        value={value}
        onChange={setValue}
        options={{
          owner: { id: fixtureId(12), display_name: "Example Coordinator" },
          owners: [{ id: fixtureId(12), display_name: "Example Coordinator" }],
          facilities: [],
        }}
        findings={[]}
        onEvidence={() =>
          setMessage("No evidence is attached to this synthetic example.")
        }
        readOnly={state === "read-only"}
      />
      <p role="status">
        {message ||
          "Select an area to edit its fields. Changes are held in this preview only."}
      </p>
    </section>
  );
}
function RegisterTableExample({ state }: { state: string }) {
  const [sort, setSort] = useState<{ column: "key" | "title"; direction: "ascending" | "descending" }>({ column: "key", direction: "ascending" }),
    [selected, setSelected] = useState<string[]>([registerTableFixture[0].id]),
    [inspected, setInspected] = useState(registerTableFixture[1].id);
  const rows = state === "empty" || state === "loading" ? [] : [...registerTableFixture].sort((a, b) => {
    const order = sort.column === "key" ? a.key.localeCompare(b.key) : a.title.localeCompare(b.title);
    return sort.direction === "ascending" ? order : -order;
  });
  const chip = (s: (typeof registerTableFixture)[number]["state"]) => (
    <RegisterChip tone={s.tone} icon={s.tone === "positive" ? <ShellIcon name="check" /> : s.tone === "neutral" ? null : <ShellIcon name="warning" />}>{s.label}</RegisterChip>
  );
  const sortBy = (column: "key" | "title") =>
    setSort((s) => ({ column, direction: s.column === column && s.direction === "ascending" ? "descending" : "ascending" }));
  if (state === "panel")
    return (
      <RegisterTable variant="panel" caption="Synthetic lines and their mapping state">
        <thead>
          <tr><th scope="col">Line</th><th scope="col">Material requirement</th><th scope="col">Design qty</th><th scope="col">Condition</th></tr>
        </thead>
        <tbody>
          {registerTableFixture.map((r) => (
            <tr key={r.id} data-inspected={r.id === inspected || undefined}>
              <td>{r.key}</td>
              <td><strong>{r.title}</strong><span className="ppo-register-sub">{r.source ?? "No drawing recorded"}</span></td>
              <td>{r.quantity}</td>
              <td>{chip(r.state)}</td>
            </tr>
          ))}
        </tbody>
      </RegisterTable>
    );
  return (
    <RegisterTable
      caption="Synthetic material lines. Opening a line inspects it; ticking a line selects it. The two are independent."
      stale={state === "loading"}
      empty={state === "empty" ? <RegisterEmpty title="No lines match"><p>4 lines exist in this example. Clear the search to see them.</p></RegisterEmpty>
        : state === "loading" ? <RegisterEmpty><p>Loading the example register…</p></RegisterEmpty> : null}
      footer={
        <RegisterFooter>
          <span>{rows.length} material{rows.length === 1 ? "" : "s"} · {selected.length} selected</span>
          <span className="ppo-register-spacer" />
          <span>{rows.length ? `1–${rows.length} of ${rows.length}` : "0 of 0"}</span>
          <Button variant="quiet" disabled>Previous page</Button>
          <Button variant="quiet" disabled>Next page</Button>
        </RegisterFooter>
      }>
      <thead>
        <tr>
          <th scope="col" className="ppo-register-check">
            <input type="checkbox" aria-label={`Select the ${rows.length} lines in this example`} checked={rows.length > 0 && selected.length === rows.length} disabled={!rows.length}
              onChange={() => setSelected(selected.length === rows.length ? [] : rows.map((r) => r.id))} />
          </th>
          <RegisterSortHeader label="Line" className="ppo-register-key" direction={sort.column === "key" ? sort.direction : undefined} onSort={() => sortBy("key")} />
          <RegisterSortHeader label="Material requirement" className="ppo-register-wrap" direction={sort.column === "title" ? sort.direction : undefined} onSort={() => sortBy("title")} />
          <th scope="col"><span className="ppo-register-label">Design qty</span></th>
          <th scope="col"><span className="ppo-register-label">Drawing</span></th>
          <th scope="col"><span className="ppo-register-label">Readiness</span></th>
          <th scope="col"><span className="ppo-register-label">Next owner</span></th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} data-inspected={r.id === inspected || undefined} data-selected={selected.includes(r.id) || undefined} data-removed={r.removed || undefined}
            onClick={(e) => { if (!(e.target as HTMLElement).closest("input,button,a,label")) setInspected(r.id); }}>
            <td className="ppo-register-check">
              <input type="checkbox" aria-label={`Select line ${r.key}, ${r.title}`} checked={selected.includes(r.id)} disabled={r.removed}
                onChange={() => setSelected(selected.includes(r.id) ? selected.filter((x) => x !== r.id) : [...selected, r.id])} />
            </td>
            <td className="ppo-register-key">{r.key}</td>
            <td className="ppo-register-wrap">
              <button type="button" className="ppo-register-row-title" onClick={() => setInspected(r.id)} aria-label={`Inspect line ${r.key}, ${r.title}`}>{r.title}</button>
              {r.sub && <span className="ppo-register-sub">{r.sub}</span>}
            </td>
            <td>{r.quantity}</td>
            <td>{r.source ?? "No drawing"}</td>
            <td>{chip(r.state)}</td>
            <td>{r.owner}</td>
          </tr>
        ))}
      </tbody>
    </RegisterTable>
  );
}
function NavigationExample({
  menu = false,
  state = "default",
}: {
  menu?: boolean;
  state?: string;
}) {
  const [value, setValue] = useState("overview");
  const options = state === "cs-customer" ? customerRecordTabsFixture : state === "sales-workspace" ? salesRecordTabsFixture : [
    { id: "overview", label: "Overview" },
    { id: "details", label: "Details" },
    { id: "history", label: "History" },
  ];
  return menu ? (
    <>
      <WorklistChoice
        label="Example view"
        value={value}
        onChange={setValue}
        options={options}
      />
      <p role="status">Selected: {value}</p>
    </>
  ) : (
    <>
      <RecordTabs
        id="catalogue-tabs"
        label="Example record"
        tabs={options}
        value={value}
        onChange={setValue}
      />
      {options.map((o) => (
        <RecordPanel key={o.id} id="catalogue-tabs" tab={o.id} value={value}>
          <h2>{o.label}</h2>
          <p>
            Synthetic {o.label.toLowerCase()} panel. Use Left/Right, Home and
            End to move between tabs.
          </p>
        </RecordPanel>
      ))}
    </>
  );
}
function DialogExample({ drawer }: { drawer: boolean }) {
  const [open, setOpen] = useState(false),
    [title, setTitle] = useState("Synthetic record"),
    [message, setMessage] = useState("");
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        Open {drawer ? "drawer" : "dialog"}
      </Button>
      <p role="status">{message}</p>
      {open && (
        <WorklistPanel
          title={drawer ? "Example drawer" : "Example dialog"}
          drawer={drawer}
          onClose={() => setOpen(false)}
        >
          <Field
            name="catalogue-dialog-title"
            label="Example title"
            value={title}
            onChange={setTitle}
          />
          <p>
            Tab stays inside the dialog. Escape closes it and returns focus to
            its opener.
          </p>
          <Button
            variant="primary"
            onClick={() => {
              setMessage("Example confirmed. No record changed.");
              setOpen(false);
            }}
          >
            Confirm example
          </Button>
        </WorklistPanel>
      )}
    </>
  );
}
function FeedbackExample({ state }: { state: string }) {
  const [retried, setRetried] = useState(false);
  const error = useMemo(
    () =>
      ["error", "background-error"].includes(state)
        ? {
            message:
              "Example connection failed. Your previously loaded details remain available.",
            retryable: true,
          }
        : state === "denied"
          ? {
              status: 403,
              message:
                "This example represents unavailable access. No restricted records are shown.",
            }
          : state === "conflict"
            ? {
                status: 409,
                message:
                  "The saved version changed. Review current details before retrying.",
              }
            : null,
    [state],
  );
  return (
    <>
      <ReadState
        loading={state === "loading"}
        error={retried ? null : error}
        retained={state === "error"}
        focusOnError={state !== "background-error"}
        retry={() => setRetried(true)}
      />
      {state === "empty" && (
        <p className="empty-state">
          No matching records. Clear the filter or create a record when
          permitted.
        </p>
      )}
      {state === "success" && <p role="status">Example saved in memory.</p>}
      {state === "offline" && (
        <p className="planner-warning" role="status">
          Illustrative offline notice: unsent entries remain on this device.
          This catalogue does not claim offline support for the current business
          page.
        </p>
      )}
      {retried && (
        <p role="status">
          Example retry completed. No server request was made.
        </p>
      )}
    </>
  );
}
export function ComponentExample({
  id,
  state,
  tokens,
}: {
  id: ExampleId;
  state: string;
  tokens: { name: string; value: string }[];
}) {
  switch (id) {
    case "products":
      return <div className="pd-workspace"><TechnicalContent content={{...productTechnicalFixture,attributes:state === "empty" ? [] : productTechnicalFixture.attributes,lifecycle:state === "retired" ? "Retired" : "Unknown"}}/></div>;
    case "foundations":
      return (
        <>
          <h2>Runtime theme tokens</h2>
          <p>
            Roboto / Verdana · text, surfaces, borders and geometry from the
            application stylesheet.
          </p>
          <h3>Theme applied to shared controls</h3>
          <ButtonExample />
          <div className="catalogue-swatches">
            {tokens.map((t) => (
              <div key={t.name}>
                {/^#[0-9a-f]{3,8}$/i.test(t.value) && (
                  <span
                    style={{ background: `var(${t.name})` }}
                    aria-hidden="true"
                  />
                )}
                <code>{t.name}</code>
                <p>{t.value}</p>
              </div>
            ))}
          </div>
        </>
      );
    case "buttons":
      return <ButtonExample />;
    case "sales-table":
    case "sales-board":
    case "forecast":
      return <SalesExample kind={id} state={state} />;
    case "area-editor":
      return <AreasExample state={state} />;
    case "gantt":
      return <GanttExample state={state} />;
    case "planner":
      return <PlannerExample state={state} />;
    case "appointment":
      return <PlannerExample state={state} card />;
    case "fields":
    case "validation":
      return <FieldsExample state={state} />;
    case "mobile-form":
      return <FieldsExample state={state} mobile />;
    case "lookup":
      return <LookupExample state={state} />;
    case "tabs":
      return <NavigationExample state={state} />;
    case "register-table":
      return <RegisterTableExample state={state} />;
    case "menu":
      return <NavigationExample menu />;
    case "dialog":
      return <DialogExample drawer={false} />;
    case "drawer":
      return <DialogExample drawer />;
    case "read-state":
      return <FeedbackExample state={state} />;
    case "status":
      return (
        <div className="catalogue-example-toolbar">
          {[
            "Draft",
            "InProgress",
            "Confirmed",
            "NeedsInformation",
            "Overdue",
            "Failed",
            "Unknown",
          ].map((v) => (
            <Status key={v} value={v} />
          ))}
        </div>
      );
  }
}
function ButtonExample() {
  const [message, setMessage] = useState("");
  return (
    <>
      <div className="catalogue-example-toolbar">
        {(["primary", "secondary", "quiet", "danger"] as const).map(
          (variant) => (
            <Button
              key={variant}
              variant={variant}
              onClick={() => setMessage(`${variant} example selected.`)}
            >
              {variant}
            </Button>
          ),
        )}
        <Button disabled>Unavailable</Button>
        <Button busy>Saving</Button>
        <ButtonLink href="#example-message">Link action</ButtonLink>
      </div>
      <p id="example-message" role="status">
        {message || "All variants use the shared Button and ButtonLink."}
      </p>
    </>
  );
}

export function ExampleDocument(props: Parameters<typeof ComponentExample>[0]) {
  const [navigation, setNavigation] = useState("");
  return (
    <div
      className="catalogue-preview"
      onClickCapture={(e) => {
        const link = (e.target as HTMLElement).closest("a");
        if (link && !link.getAttribute("href")?.startsWith("#")) {
          e.preventDefault();
          e.stopPropagation();
          setNavigation(
            "This example link points to a synthetic record. Use Used on in the catalogue to open an application page.",
          );
        }
      }}
      onSubmitCapture={(e) => e.preventDefault()}
    >
      <p className="catalogue-fixture-label">
        Synthetic component example · changes reset on reload
      </p>
      <p role="status">{navigation}</p>
      <ComponentExample {...props} />
    </div>
  );
}
