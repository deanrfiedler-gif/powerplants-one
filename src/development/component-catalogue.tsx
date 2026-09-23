"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, ButtonLink } from "../components/ui/button";
import { RecordTabs, RecordPanel } from "../components/record-ui";
import { componentCategories, type ComponentLibrary } from "./component-model";
import type { Catalog } from "./model";
import { DesignSystem } from "./design-system";

const panels = [
  { id: "example", label: "Live example" },
  { id: "reference", label: "Design reference" },
  { id: "rules", label: "Usage rules" },
  { id: "used", label: "Used on" },
  { id: "differences", label: "Differences" },
  { id: "review", label: "Review & history" },
];
const sizes = [
  { id: "fit", label: "Available width" },
  { id: "1440", label: "Desktop · 1440" },
  { id: "1024", label: "Laptop · 1024" },
  { id: "820", label: "Tablet · 820" },
  { id: "390", label: "Phone · 390" },
  { id: "320", label: "Small phone · 320" },
];
type CatalogueProps = {
  library: ComponentLibrary;
  catalog: Catalog;
  initialId?: string;
  initialState?: string;
  initialWidth?: string;
};
export function ComponentCatalogue(props: CatalogueProps) {
  const params = useSearchParams();
  const id = params.get("component") ?? props.initialId;
  return (
    <CatalogueContent
      key={id ?? "sales-table"}
      {...props}
      initialId={id}
      initialState={params.get("state") ?? props.initialState}
      initialWidth={params.get("width") ?? props.initialWidth}
    />
  );
}
function CatalogueContent({
  library,
  catalog,
  initialId,
  initialState,
  initialWidth,
}: {
  library: ComponentLibrary;
  catalog: Catalog;
  initialId?: string;
  initialState?: string;
  initialWidth?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("all"),
    [coverage, setCoverage] = useState("all"),
    [module, setModule] = useState("all"),
    [review, setReview] = useState("all"),
    [tab, setTab] = useState("example"),
    [compare, setCompare] = useState(false),
    [reset, setReset] = useState(0),
    [notice, setNotice] = useState("");
  const selected =
    library.entries.find((e) => e.id === initialId) ??
    library.entries.find((e) => e.id === "sales-table")!;
  const [state, setState] = useState(
      selected.states.some((s) => s.id === initialState)
        ? initialState!
        : (selected.states[0]?.id ?? "default"),
    ),
    [width, setWidth] = useState(
      sizes.some((s) => s.id === initialWidth)
        ? initialWidth!
        : selected.category === "Mobile"
          ? "390"
          : "fit",
    );
  const shown = library.entries.filter(
    (e) =>
      (category === "all" || e.category === category) &&
      (coverage === "all" || e.coverage === coverage) &&
      (module === "all" || e.module === module) &&
      (review === "all" || e.review_state === review) &&
      `${e.title} ${e.purpose} ${e.module} ${e.implementation.map((i) => i.symbol).join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const consuming = catalog.entries.filter((e) =>
    selected.used_on.includes(e.key),
  );
  const previewUrl = `/development/component-preview?component=${encodeURIComponent(selected.id)}&state=${encodeURIComponent(state)}&reset=${reset}`;
  function updateAddress(nextState: string, nextWidth: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("component", selected.id);
    url.searchParams.set("state", nextState);
    url.searchParams.set("width", nextWidth);
    window.history.replaceState(null, "", url);
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(
        window.location.origin +
          `/development/design-system?component=${selected.id}&state=${state}&width=${width}`,
      );
      setNotice("Example link copied.");
    } catch {
      setNotice("Copy is unavailable. Use the permanent example link below.");
    }
  }
  const frame = (reference = false) => (
    <div
      className="catalogue-frame-scroll"
      tabIndex={0}
      role="region"
      aria-label={
        reference
          ? "Design comparison viewport"
          : "Application component viewport"
      }
    >
      <iframe
        key={`${selected.id}:${state}:${reset}:${reference}`}
        className="catalogue-frame"
        title={
          reference
            ? `${selected.title} design reference`
            : `${selected.title} ${state} application example`
        }
        style={{
          width: width === "fit" ? "100%" : Number(width),
          height: width === "390" ? 844 : width === "320" ? 700 : 900,
        }}
        src={reference ? selected.reference_url : previewUrl}
        {...(reference ? { sandbox: "allow-scripts" } : {})}
      />
    </div>
  );
  return (
    <div className="catalogue" id="ppo-component-catalogue">
      <header className="catalogue-heading">
        <div>
          <p className="catalogue-eyebrow">Powerplants One · design & build</p>
          <h1>Component catalogue</h1>
          <p>
            Explore the controls PPO uses. Compare their references and track
            what still needs alignment.
          </p>
        </div>
        <div className="catalogue-actions">
          <Button onClick={() => router.refresh()}>Refresh working copy</Button>
          <ButtonLink href="/development/page-register">
            Page register
          </ButtonLink>
        </div>
      </header>
      <div className="catalogue-metrics">
        <span>
          <strong>{componentCategories.length}</strong> categories inventoried
        </span>
        <span>
          <strong>
            {library.entries.filter((e) => e.coverage === "Runnable").length}
          </strong>{" "}
          runnable examples
        </span>
        <span>
          <strong>
            {
              library.entries.filter((e) => e.coverage === "Reference only")
                .length
            }
          </strong>{" "}
          reference-only patterns
        </span>
        <span>
          <strong>
            {library.entries.filter((e) => e.review_state !== "Current").length}
          </strong>{" "}
          reviews pending or stale
        </span>
      </div>
      <p className="catalogue-note">
        Local development · synthetic examples · Git is the master. Coverage,
        design alignment and functional acceptance are separate. Browser changes
        are temporary.
      </p>
      {!!library.errors.length && (
        <div role="alert">
          <h2>Catalogue integrity needs attention</h2>
          <ul>
            {library.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="catalogue-filters">
        <label>
          Find a component
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Table, Gantt, error, Field…"
          />
        </label>
        <label>
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">All categories</option>
            {componentCategories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Area
          <select value={module} onChange={(e) => setModule(e.target.value)}>
            <option value="all">All areas</option>
            {[...new Set(library.entries.map((e) => e.module))].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
        <label>
          Coverage
          <select
            value={coverage}
            onChange={(e) => setCoverage(e.target.value)}
          >
            <option value="all">All coverage</option>
            {["Runnable", "Host example", "Reference only"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Review
          <select value={review} onChange={(e) => setReview(e.target.value)}>
            <option value="all">All review states</option>
            {["Not reviewed", "Current", "Stale"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="catalogue-layout">
        <aside>
          <details open>
            <summary>Browse components · {shown.length}</summary>
            <nav aria-label="Component categories">
              {componentCategories.map((c) => {
                const items = shown.filter((e) => e.category === c);
                return items.length ? (
                  <section key={c}>
                    <h2>{c}</h2>
                    {items.map((e) => (
                      <Link
                        prefetch={false}
                        key={e.id}
                        href={`/development/design-system?component=${e.id}`}
                        onClick={(event) => {
                          if (
                            event.button === 0 &&
                            !event.metaKey &&
                            !event.ctrlKey &&
                            !event.shiftKey &&
                            !event.altKey
                          ) {
                            event.preventDefault();
                            window.history.pushState(
                              null,
                              "",
                              `/development/design-system?component=${e.id}`,
                            );
                          }
                        }}
                        aria-current={selected.id === e.id ? "page" : undefined}
                      >
                        <span>{e.title}</span>
                        <small>
                          {e.coverage}
                          {e.review_state === "Stale" ? " · Review stale" : ""}
                        </small>
                      </Link>
                    ))}
                  </section>
                ) : null;
              })}
              {!shown.length && (
                <p>No components match. Clear the search or filters.</p>
              )}
            </nav>
          </details>
        </aside>
        <section className="catalogue-detail" aria-labelledby="component-title">
          <div className="catalogue-title">
            <div>
              <p className="catalogue-eyebrow">
                {selected.category} / {selected.module}
              </p>
              <h2 id="component-title">{selected.title}</h2>
              <p>{selected.purpose}</p>
            </div>
            <Button onClick={copy}>Copy example link</Button>
          </div>
          <div className="catalogue-pills">
            <span>{selected.coverage}</span>
            <span>{selected.review_state}</span>
            <span>
              {selected.gaps.length} recorded alignment item
              {selected.gaps.length === 1 ? "" : "s"}
            </span>
          </div>
          <p role="status">{notice}</p>
          <RecordTabs
            id="catalogue"
            label="Component details"
            tabs={panels}
            value={tab}
            onChange={setTab}
          />
          <RecordPanel id="catalogue" tab="example" value={tab}>
            {selected.example ? (
              <>
                <div className="catalogue-example-controls">
                  <label>
                    Example state
                    <select
                      value={state}
                      onChange={(e) => {
                        setState(e.target.value);
                        updateAddress(e.target.value, width);
                      }}
                    >
                      {selected.states.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Viewport width
                    <select
                      value={width}
                      onChange={(e) => {
                        setWidth(e.target.value);
                        updateAddress(state, e.target.value);
                      }}
                    >
                      {sizes.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Button onClick={() => setReset((n) => n + 1)}>
                    Reset example
                  </Button>
                  <label className="catalogue-check">
                    <input
                      type="checkbox"
                      checked={compare}
                      onChange={(e) => setCompare(e.target.checked)}
                    />
                    Compare with design
                  </label>
                  <ButtonLink
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open example ↗
                  </ButtonLink>
                </div>
                <p>
                  {selected.states.find((s) => s.id === state)?.description}
                </p>
                <p className="catalogue-caption">
                  Frames use real browser viewport widths and application
                  styles. Scroll inside a frame region when a chosen width
                  exceeds the available space. Browser zoom and device keyboards
                  require separate review.
                </p>
                <div className={compare ? "catalogue-comparison" : ""}>
                  <section>
                    <h3>Actual application component</h3>
                    {frame()}
                  </section>
                  {compare && (
                    <section>
                      <h3>Retained design · {selected.reference.status}</h3>
                      {frame(true)}
                    </section>
                  )}
                </div>
              </>
            ) : (
              <div className="catalogue-note">
                <h3>{selected.coverage}</h3>
                <p>{selected.purpose}</p>
                <p>{selected.limitations}</p>
                <Button onClick={() => setTab("reference")}>
                  View design reference
                </Button>
              </div>
            )}
            <p className="catalogue-caption">
              Implementation:{" "}
              {selected.implementation.map((i) => i.symbol).join(", ") ||
                "Not mapped"}
              . {selected.limitations}
            </p>
          </RecordPanel>
          <RecordPanel id="catalogue" tab="reference" value={tab}>
            <h3>Design reference</h3>
            <p>{selected.reference.status}</p>
            <p>
              <a
                href={selected.source_url + selected.reference.path}
                target="_blank"
                rel="noopener noreferrer"
              >
                {selected.reference.path} ↗
              </a>
              {selected.reference.anchor &&
                ` · section: ${selected.reference.anchor}`}
            </p>
            <p>
              <a
                href={selected.source_url + selected.specification}
                target="_blank"
                rel="noopener noreferrer"
              >
                Desktop and mobile Markdown specification ↗
              </a>
            </p>
            <p>
              Reference HTML is available below. A separate per-component mockup
              image has not been linked; page-specific image references remain
              in the page register.
            </p>
            {tab === "reference" && frame(true)}
          </RecordPanel>
          <RecordPanel id="catalogue" tab="rules" value={tab}>
            <h3>Desktop</h3>
            <p>{selected.desktop}</p>
            <h3>Mobile</h3>
            <p>{selected.mobile}</p>
            <h3>Keyboard and accessibility</h3>
            <p>{selected.keyboard}</p>
            <h3>States</h3>
            <ul>
              {selected.states.map((s) => (
                <li key={s.id}>
                  <strong>{s.label}:</strong> {s.description}
                </li>
              ))}
            </ul>
            <h3>Application implementation</h3>
            <ul>
              {selected.implementation.map((i) => (
                <li key={i.path + i.symbol}>
                  <a
                    href={selected.source_url + i.path}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {i.symbol} · {i.path}
                  </a>
                </li>
              ))}
            </ul>
            <p>
              Example adapters supply synthetic data and local callbacks. They
              do not replace the component or its stylesheet.
            </p>
          </RecordPanel>
          <RecordPanel id="catalogue" tab="used" value={tab}>
            <h3>Mapped application consumers</h3>
            <p>
              These are recorded consumers, not an exhaustive automatic usage
              claim. Page entries provide local/live links, record parameters,
              mockups and guides.
            </p>
            <div className="catalogue-consumers">
              {consuming.map((e) => (
                <article key={e.key}>
                  <h4>{e.title}</h4>
                  <code>{e.path ?? e.key}</code>
                  <p>
                    <Link
                      href={`/development/page-register?entry=${encodeURIComponent(e.key)}`}
                    >
                      Open page, links and design references
                    </Link>
                  </p>
                  {e.path && !/[\[{}]/.test(e.path) && (
                    <div className="catalogue-actions">
                      <a
                        href={catalog.local_base + e.path}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Local application ↗
                      </a>
                      {!e.path.startsWith("/development") && (
                        <a
                          href={catalog.live_base + e.path}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Hosted application ↗
                        </a>
                      )}
                    </div>
                  )}
                  <small>Deployment: {e.deployment_status}</small>
                </article>
              ))}
            </div>
          </RecordPanel>
          <RecordPanel id="catalogue" tab="differences" value={tab}>
            <h3>Alignment work</h3>
            {selected.gaps.map((g) => (
              <article className="catalogue-gap" key={g.id}>
                <h4>
                  {g.id} · {g.priority}
                </h4>
                <dl>
                  <dt>Expected</dt>
                  <dd>{g.expected}</dd>
                  <dt>Observed / unresolved</dt>
                  <dd>{g.actual}</dd>
                  <dt>Next action</dt>
                  <dd>{g.action}</dd>
                  <dt>Owner</dt>
                  <dd>{g.owner}</dd>
                </dl>
              </article>
            ))}
            <h3>Existing baseline token differences</h3>
            <p>
              Read from the maintained UI baseline register. These remain
              unresolved, not approved exceptions.
            </p>
            <ul>
              {library.divergences.map((d) => (
                <li key={d.token}>
                  <code>{d.token}</code>:{" "}
                  {Object.entries(d.values)
                    .map(([k, v]) => `${k} ${v}`)
                    .join("; ")}
                  . {d.status}
                </li>
              ))}
            </ul>
          </RecordPanel>
          <RecordPanel id="catalogue" tab="review" value={tab}>
            <h3>Review and history</h3>
            <p>
              Owner: {selected.owner}. Review state: {selected.review_state}.
            </p>
            <p>
              {selected.review
                ? `${selected.review.result} · ${selected.review.reviewer} · ${selected.review.date}`
                : "No paired visual acceptance has been recorded. Catalogue verification is documented separately."}
            </p>
            <p>
              <a
                href={selected.history_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Specification history in GitHub ↗
              </a>
            </p>
            <p>
              Checkout:{" "}
              <code>
                {library.checkout_commit ?? "Git history unavailable"}
              </code>
              . Working files may contain uncommitted changes; GitHub links show
              committed content and require that commit to be pushed.
            </p>
            <details>
              <summary>Review fingerprint and evidence</summary>
              <code>{selected.fingerprint}</code>
              <ul>
                {selected.review?.evidence.map((p) => (
                  <li key={p}>
                    <a href={selected.source_url + p}>{p}</a>
                  </li>
                ))}
              </ul>
              <p>
                This fingerprint includes source imports, styles, fixtures,
                specification and reference bytes. A match records unchanged
                inputs; it does not establish accessibility or business
                acceptance.
              </p>
            </details>
            <p>
              <a
                href={
                  selected.source_url +
                  "docs/design/development/components/README.md"
                }
              >
                Maintenance and coverage contract ↗
              </a>
            </p>
          </RecordPanel>
          <p>
            <Link
              href={`/development/design-system?component=${selected.id}&state=${state}&width=${width}`}
            >
              Permanent example link
            </Link>
          </p>
        </section>
      </div>
      <details className="catalogue-theme-tools">
        <summary>Theme adjustment tools and global impact</summary>
        <DesignSystem
          tokens={catalog.tokens}
          consumers={catalog.entries
            .filter((e) => e.kind === "route")
            .map((e) => ({ key: e.key, title: e.title, path: e.path }))}
        />
      </details>
    </div>
  );
}
