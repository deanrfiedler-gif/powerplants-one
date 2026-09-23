"use client";
/* Original design images must retain their exact bytes; no image optimisation proxy. */
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button, ButtonLink } from "../components/ui/button";
import {
  type Catalog,
  type CatalogEntry,
  type Guide,
  type Resource,
  origin,
  resolveDestination,
  resourceHref,
} from "./model";

const github = (path: string) =>
  "https://github.com/deanrfiedler-gif/powerplants-one/blob/main/" +
  path.split("/").map(encodeURIComponent).join("/");
function download(name: string, value: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
type Reader =
  | { kind: "entry"; entry: CatalogEntry }
  | { kind: "resource"; resource: Resource }
  | { kind: "guide"; key: string; title: string }
  | { kind: "missing"; entry: CatalogEntry };

export function DevelopmentWorkspace({
  initial,
  initialView,
  initialEntry,
}: {
  initial: Catalog;
  initialView?: string;
  initialEntry?: string;
}) {
  const [catalog, setCatalog] = useState(initial),
    [query, setQuery] = useState(""),
    [tab, setTab] = useState(
      ["pages", "systems", "journeys", "health"].includes(initialView || "")
        ? initialView!
        : "pages",
    ),
    [module, setModule] = useState("all"),
    [filter, setFilter] = useState("all"),
    [history, setHistory] = useState(false),
    [limit, setLimit] = useState(60);
  const [reader, setReader] = useState<Reader | null>(() => {
      const entry = initial.entries.find((e) => e.key === initialEntry);
      return entry ? { kind: "entry", entry } : null;
    }),
    [trail, setTrail] = useState<Reader[]>([]),
    [text, setText] = useState(""),
    [guide, setGuide] = useState<Guide | null>(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [refreshing, setRefreshing] = useState(false),
    [searchGuide, setSearchGuide] = useState("");
  const [local, setLocal] = useState(initial.local_base),
    [live, setLive] = useState(initial.live_base),
    [linkError, setLinkError] = useState(""),
    [parameters, setParameters] = useState<Record<string, string>>({});
  const dialog = useRef<HTMLDialogElement>(null),
    opener = useRef<HTMLElement | null>(null),
    heading = useRef<HTMLHeadingElement>(null),
    pageHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (reader) return;
    const controller = new AbortController();
    const timer = setInterval(() => {
      if (document.hidden) return;
      void fetch("/api/development/catalog", {
        cache: "no-store",
        signal: controller.signal,
      })
        .then(async (r) => {
          if (!r.ok)
            throw Error(
              "Automatic refresh failed. The previous snapshot is retained; use Refresh working copy to retry.",
            );
          return r.json() as Promise<Catalog>;
        })
        .then((next) => {
          if (!controller.signal.aborted)
            setCatalog((previous) =>
              previous.fingerprint === next.fingerprint ? previous : next,
            );
        })
        .catch((reason) => {
          if (!controller.signal.aborted) setError(reason.message);
        });
    }, 30000);
    return () => {
      clearInterval(timer);
      controller.abort();
    };
  }, [reader]);
  useEffect(() => {
    if (reader) {
      if (!dialog.current?.open) dialog.current?.showModal();
      heading.current?.focus();
    } else dialog.current?.close();
  }, [reader]);
  useEffect(() => {
    if (!reader) return;
    const controller = new AbortController();
    const url =
      reader.kind === "guide"
        ? `/api/development/catalog?guide=${encodeURIComponent(reader.key)}`
        : reader.kind === "resource" && reader.resource.type === "markdown"
          ? resourceHref(reader.resource.id, false, reader.resource.sha256)
          : null;
    if (!url) return;
    fetch(url, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok)
          throw Error(
            "This reference could not be loaded. Return to the register and refresh, then try again.",
          );
        return reader.kind === "guide" ? response.json() : response.text();
      })
      .then((value) => {
        if (!controller.signal.aborted) {
          if (reader.kind === "guide") setGuide(value as Guide);
          else setText(value as string);
          setLoading(false);
        }
      })
      .catch((reason) => {
        if (!controller.signal.aborted) {
          setError(reason.message);
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [reader]);
  function selectReader(next: Reader) {
    setError("");
    setGuide(null);
    setText("");
    setSearchGuide("");
    setLoading(
      next.kind === "guide" ||
        (next.kind === "resource" && next.resource.type === "markdown"),
    );
    setReader(next);
  }
  function open(next: Reader) {
    if (!reader) {
      opener.current = document.activeElement as HTMLElement;
      setTrail([]);
    } else setTrail((items) => [...items, reader]);
    selectReader(next);
  }
  function close() {
    setReader(null);
    setTrail([]);
    setParameters({});
    const url = new URL(location.href);
    url.searchParams.delete("entry");
    window.history.replaceState(null, "", url);
    requestAnimationFrame(() => {
      if (opener.current?.isConnected) opener.current.focus();
      else pageHeading.current?.focus();
    });
  }
  function view(value: string) {
    setTab(value);
    const url = new URL(location.href);
    url.searchParams.set("view", value);
    url.searchParams.delete("entry");
    window.history.replaceState(null, "", url);
  }
  async function refresh() {
    setRefreshing(true);
    setError("");
    try {
      const response = await fetch("/api/development/catalog", {
        cache: "no-store",
      });
      if (!response.ok)
        throw Error("Refresh failed. The previous snapshot remains visible.");
      setCatalog(await response.json());
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setRefreshing(false);
    }
  }
  const filtered = catalog.entries.filter(
    (e) =>
      (tab === "systems" ? e.kind === "system" : e.kind !== "system") &&
      (module === "all" || e.module === module) &&
      (!query ||
        `${e.key} ${e.title} ${e.summary} ${e.path}`
          .toLowerCase()
          .includes(query.toLowerCase())) &&
      (filter === "all" ||
        (filter === "routes" && e.kind === "route") ||
        (filter === "scopes" && e.kind === "scope") ||
        (filter === "missing-image" && !e.image_paths.length) ||
        (filter === "review" && e.review_state !== "Current") ||
        (filter === "planned" && !e.source_present)),
  );
  const journeys = catalog.journeys.filter(
    (j) =>
      (history || j.current) &&
      (!query || j.title.toLowerCase().includes(query.toLowerCase())),
  );
  const title =
    reader?.kind === "entry" || reader?.kind === "missing"
      ? reader.entry.title
      : reader?.kind === "resource"
        ? reader.resource.title
        : reader?.title || "";
  const resourceButton = (resource: Resource, label?: string) => (
    <Button
      key={resource.id}
      onClick={() => open({ kind: "resource", resource })}
    >
      {label || resource.title}
      {resource.missing ? " · missing" : ""}
    </Button>
  );
  const entryActions = (entry: CatalogEntry) => (
    <div className="studio-actions">
      <Button variant="primary" onClick={() => open({ kind: "entry", entry })}>
        Open entry
      </Button>
      {entry.guide_key && (
        <Button
          onClick={() =>
            open({ kind: "guide", key: entry.guide_key!, title: entry.title })
          }
        >
          User guide
        </Button>
      )}
      <Button
        onClick={() => {
          const image = entry.resources.find((r) => r.type === "image");
          open(
            image
              ? { kind: "resource", resource: image }
              : { kind: "missing", entry },
          );
        }}
      >
        UI image{entry.image_paths.length ? "" : " · not linked"}
      </Button>
    </div>
  );
  function environmentLinks(entry: CatalogEntry, env: "local" | "live") {
    if (!entry.path) return null;
    const base = env === "local" ? local : live;
    const prefix = entry.key + ":" + env + ":";
    let destination: string | null = null;
    try {
      destination = resolveDestination(
        entry.path,
        base,
        Object.fromEntries(
          Object.entries(parameters)
            .filter(([k]) => k.startsWith(prefix))
            .map(([k, v]) => [k.slice(prefix.length), v]),
        ),
      );
    } catch {
      /* Invalid origin is shown inline. */
    }
    const params = [...entry.path.matchAll(/\[([^\]]+)\]|\{([^}]+)\}/g)].map(
      (m) => m[1] || m[2],
    );
    return (
      <section className="studio-environment">
        <h3>
          {env === "local" ? "Local application" : "Live web application"}
        </h3>
        <p>
          {entry.source_present
            ? "Source entry point; page availability is checked separately."
            : "Proposed destination; this page or view may not exist yet."}
        </p>
        {params.map((param) => (
          <label key={param}>
            {param === "view"
              ? "View name (configure, parts, pricing, compare, definition, history)"
              : "Record UUID"}{" "}
            · {env}
            <input
              autoComplete="off"
              value={parameters[prefix + param] || ""}
              onChange={(event) =>
                setParameters({
                  ...parameters,
                  [prefix + param]: event.target.value,
                })
              }
            />
          </label>
        ))}
        <code>{destination || base + entry.path}</code>
        <div className="studio-actions">
          {destination ? (
            <ButtonLink
              href={destination}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open {env} page ↗
            </ButtonLink>
          ) : (
            <span>
              Enter valid {env} record details and server address to open this
              page.
            </span>
          )}
        </div>
      </section>
    );
  }
  return (
    <div id="ppo-development" className="studio">
      <header className="studio-heading">
        <div>
          <p className="studio-eyebrow">Local development · working copy</p>
          <h1 tabIndex={-1} ref={pageHeading}>
            Design & build
          </h1>
          <p>
            Pages, guidance, visual standards and the journeys that connect
            them.
          </p>
        </div>
        <div className="studio-actions">
          <Link className="ppo-button" href="/development/design-system">
            Live theme & controls
          </Link>
          <Button
            onClick={() => download("PPO-development-register.json", catalog)}
          >
            Export register
          </Button>
          <Button busy={refreshing} onClick={() => void refresh()}>
            Refresh working copy
          </Button>
        </div>
      </header>
      <div className="studio-summary">
        <span>
          <strong>
            {catalog.entries.filter((e) => e.kind === "route").length}
          </strong>{" "}
          source addresses
        </span>
        <span>
          <strong>
            {catalog.entries.filter((e) => e.kind === "scope").length}
          </strong>{" "}
          scopes
        </span>
        <span>
          <strong>{catalog.entries.filter((e) => e.guide_key).length}</strong>{" "}
          draft guides
        </span>
        <span>
          <strong>{catalog.journeys.filter((j) => j.current).length}</strong>{" "}
          current journey references
        </span>
      </div>
      <p className="studio-note">
        Git files are the master. Refresh reads the current working copy;
        published environments change after their normal deployment. Guidance
        and design review remain separate from source presence.
      </p>
      {error && !reader && (
        <p role="alert" className="studio-warning">
          {error}
        </p>
      )}
      <nav className="studio-tabs" aria-label="Development library">
        {[
          ["pages", "Pages & scopes"],
          ["systems", "Shell & shared systems"],
          ["journeys", "Journey maps"],
          ["health", "Coverage & changes"],
        ].map(([value, label]) => (
          <Button
            key={value}
            variant={tab === value ? "primary" : "quiet"}
            aria-current={tab === value ? "page" : undefined}
            onClick={() => view(value)}
          >
            {label}
          </Button>
        ))}
      </nav>
      <div className="studio-toolbar">
        <label>
          Search the library
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Page, reference or workflow…"
          />
        </label>
        {(tab === "pages" || tab === "systems") && (
          <>
            <label>
              Workspace
              <select
                value={module}
                onChange={(e) => setModule(e.target.value)}
              >
                <option value="all">All workspaces</option>
                {[...new Set(catalog.entries.map((e) => e.module))]
                  .sort()
                  .map((m) => (
                    <option key={m}>{m}</option>
                  ))}
              </select>
            </label>
            <label>
              Show
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                {[
                  ["all", "All entries"],
                  ["routes", "Source addresses"],
                  ["scopes", "Scopes"],
                  ["planned", "Planned destinations"],
                  ["missing-image", "Missing UI image"],
                  ["review", "Review needed"],
                ].map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
        {tab === "journeys" && (
          <label className="studio-check">
            <input
              type="checkbox"
              checked={history}
              onChange={(e) => setHistory(e.target.checked)}
            />
            Include earlier revisions
          </label>
        )}
      </div>
      {(tab === "pages" || tab === "systems") && (
        <>
          <p role="status" className="studio-count">
            {filtered.length} entries match
          </p>
          <div className="studio-grid">
            {filtered.slice(0, limit).map((entry) => (
              <article className="studio-card" key={entry.key}>
                <p className="studio-eyebrow">
                  {entry.module} · {entry.kind}
                  {entry.build_rank
                    ? ` · #${String(entry.build_rank).padStart(3, "0")}`
                    : ""}
                </p>
                <h2>{entry.title}</h2>
                <p className="studio-description">{entry.summary}</p>
                <code>{entry.path || "Shared application surface"}</code>
                <div className="studio-badges">
                  <span>
                    {entry.source_present ? "Source present" : "Proposed scope"}
                  </span>
                  <span>{entry.guide_status}</span>
                  <span>{entry.review_state}</span>
                </div>
                {entryActions(entry)}
              </article>
            ))}
          </div>
          {filtered.length > limit && (
            <div className="studio-actions">
              <p>
                Showing {limit} of {filtered.length} entries.
              </p>
              <Button onClick={() => setLimit(limit + 60)}>Show 60 more</Button>
            </div>
          )}
          {!filtered.length && (
            <p className="studio-empty">
              No matching entries. Clear the search or select All entries.
            </p>
          )}
        </>
      )}
      {tab === "journeys" && (
        <div className="studio-grid">
          {journeys.map((item) => (
            <article className="studio-card" key={item.id}>
              <p className="studio-eyebrow">
                {item.current
                  ? "Latest file in this family"
                  : "Earlier retained revision"}
              </p>
              <h2>{item.title}</h2>
              <p>
                Retained design reference. A higher revision does not establish
                acceptance or current application behaviour.
              </p>
              {resourceButton(item, "Read journey map")}
              <a
                href={github(item.path)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Source in GitHub ↗
              </a>
            </article>
          ))}
        </div>
      )}
      {tab === "health" && (
        <div className="studio-health">
          <h2>Coverage that needs attention</h2>
          <p>
            {catalog.errors.length} structural errors ·{" "}
            {catalog.entries.filter((e) => e.review_state === "Stale").length}{" "}
            stale reviews ·{" "}
            {catalog.entries.filter((e) => !e.image_paths.length).length}{" "}
            entries without images.
          </p>
          {catalog.errors.length ? (
            <ul>
              {catalog.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          ) : (
            <p>
              Every discovered canonical page is registered and required
              references resolve.
            </p>
          )}
          <h3>Source or review changes</h3>
          {catalog.entries
            .filter((e) => e.issues.length)
            .map((e) => (
              <details key={e.key}>
                <summary>
                  {e.title} · {e.issues.length} review items
                </summary>
                <ul>
                  {e.issues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
                <Button onClick={() => open({ kind: "entry", entry: e })}>
                  Review entry
                </Button>
              </details>
            ))}
          <h3>How this stays current</h3>
          <p>
            Routes and journey files are discovered automatically. New routes
            fail the repository coverage check until registered. Source, design
            and shared-style changes invalidate a recorded review fingerprint.
            Status is never promoted automatically to tested, accepted or
            deployed.
          </p>
          <p>
            Working-copy fingerprint: <code>{catalog.fingerprint}</code>
          </p>
          <p>
            Read at {new Date(catalog.observed_at).toLocaleString("en-AU")} ·
            starting source {catalog.source_baseline.slice(0, 8)}.
          </p>
        </div>
      )}
      <details className="studio-settings">
        <summary>Application links and maintenance</summary>
        <div className="studio-toolbar">
          <label>
            Local server
            <input
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              onBlur={() => {
                try {
                  setLocal(origin(local));
                  setLinkError("");
                } catch (e) {
                  setLinkError((e as Error).message);
                }
              }}
            />
          </label>
          <label>
            Hosted server
            <input
              value={live}
              onChange={(e) => setLive(e.target.value)}
              onBlur={() => {
                try {
                  setLive(origin(live));
                  setLinkError("");
                } catch (e) {
                  setLinkError((e as Error).message);
                }
              }}
            />
          </label>
        </div>
        {linkError && <p role="alert">{linkError}</p>}
        <p>
          These overrides last for this visit. Change register.json for a
          durable default. Record IDs stay in the open entry only and are
          separate for each environment.
        </p>
        <a
          href={github("docs/design/development/README.md")}
          target="_blank"
          rel="noopener noreferrer"
        >
          Maintenance instructions in GitHub ↗
        </a>
      </details>
      <dialog
        className="studio-dialog"
        ref={dialog}
        aria-labelledby="studio-reader-title"
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
      >
        <header>
          <div>
            <p className="studio-eyebrow">Design library · working reference</p>
            <h2 id="studio-reader-title" tabIndex={-1} ref={heading}>
              {title}
            </h2>
          </div>
          <div className="studio-actions">
            {trail.length > 0 && (
              <Button
                onClick={() => {
                  selectReader(trail.at(-1)!);
                  setTrail(trail.slice(0, -1));
                }}
              >
                ← Back
              </Button>
            )}
            <Button onClick={close} aria-label="Close design reference">
              Close
            </Button>
          </div>
        </header>
        <div className="studio-reader">
          {loading && <p role="status">Loading reference…</p>}
          {error && reader && <p role="alert">{error}</p>}
          {reader?.kind === "entry" && (
            <>
              <p>{reader.entry.summary}</p>
              <div className="studio-badges">
                <span>{reader.entry.scope_status} · retained assessment</span>
                <span>Visual: {reader.entry.visual_status}</span>
                <span>Functional: {reader.entry.functional_status}</span>
                <span>Deployment: {reader.entry.deployment_status}</span>
              </div>
              <h3>Design, images and user guide</h3>
              <div className="studio-actions">
                {reader.entry.resources.map((r) =>
                  resourceButton(
                    r,
                    r.type === "markdown"
                      ? "Desktop & mobile design reference"
                      : undefined,
                  ),
                )}
                {reader.entry.guide_key && (
                  <Button
                    variant="primary"
                    onClick={() =>
                      open({
                        kind: "guide",
                        key: reader.entry.guide_key!,
                        title: reader.entry.title,
                      })
                    }
                  >
                    Read user guide
                  </Button>
                )}
              </div>
              <div className="studio-environments">
                {environmentLinks(reader.entry, "local")}
                {environmentLinks(reader.entry, "live")}
              </div>
              <h3>Related entries</h3>
              <div className="studio-actions">
                {reader.entry.related_keys.map((key) => {
                  const entry = catalog.entries.find((e) => e.key === key);
                  return entry ? (
                    <Button
                      key={key}
                      onClick={() => open({ kind: "entry", entry })}
                    >
                      {entry.title}
                    </Button>
                  ) : null;
                })}
              </div>
              <h3>Review and change impact</h3>
              <p>
                {reader.entry.review_state} ·{" "}
                {reader.entry.reviewed_at ||
                  "No completed visual review recorded"}
                .
              </p>
              <p>
                Shared theme and shell changes affect this entry. Its current
                review fingerprint is <code>{reader.entry.fingerprint}</code>.
              </p>
              <ul>
                {reader.entry.source_paths.map((path) => (
                  <li key={path}>
                    <a
                      href={github(path)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {path} ↗
                    </a>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() =>
                  download("PPO-review-proposal.json", {
                    entry_key: reader.entry.key,
                    fingerprint: reader.entry.fingerprint,
                    reviewer: null,
                    result: "Pending review",
                    reviewed_at: null,
                  })
                }
              >
                Export review proposal
              </Button>
              <p className="studio-note">
                A review proposal does not record acceptance. Complete the
                evidence and update the working source through the normal Git
                review.
              </p>
            </>
          )}
          {reader?.kind === "missing" && (
            <>
              <h3>No exact UI image is linked yet</h3>
              <p>
                The entry remains available for planning. Its desktop/mobile
                specification and any HTML design are linked below.
              </p>
              {reader.entry.resources
                .filter((r) => r.type !== "image")
                .map((r) => resourceButton(r))}
            </>
          )}
          {reader?.kind === "resource" && (
            <>
              <p className="studio-note">
                {reader.resource.path} · retained source{" "}
                {reader.resource.sha256.slice(0, 12)}. Viewing a design does not
                approve its implementation.
              </p>
              <div className="studio-actions">
                <ButtonLink
                  href={resourceHref(
                    reader.resource.id,
                    true,
                    reader.resource.sha256,
                  )}
                  download
                >
                  Download exact reference
                </ButtonLink>
                <ButtonLink
                  href={github(reader.resource.path)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open source in GitHub ↗
                </ButtonLink>
              </div>
              {reader.resource.missing ? (
                <p>Reference missing from this working copy.</p>
              ) : reader.resource.type === "markdown" ? (
                <pre className="studio-markdown">{text}</pre>
              ) : reader.resource.type === "image" ? (
                <img
                  className="studio-image"
                  src={resourceHref(
                    reader.resource.id,
                    false,
                    reader.resource.sha256,
                  )}
                  alt={reader.resource.title}
                  onError={() =>
                    setError(
                      "The image is unavailable or changed. Close the reader, refresh and try again.",
                    )
                  }
                />
              ) : (
                <>
                  <p className="studio-note">
                    Isolated reference preview. External assets, forms and
                    access to the application are blocked inside this preview.
                  </p>
                  <iframe
                    title={reader.resource.title}
                    src={resourceHref(
                      reader.resource.id,
                      false,
                      reader.resource.sha256,
                    )}
                    sandbox="allow-scripts"
                    referrerPolicy="no-referrer"
                    className="studio-frame"
                  />
                </>
              )}
            </>
          )}
          {reader?.kind === "guide" && guide && (
            <>
              <p className="studio-note">
                {guide.status} {guide.revision} · {guide.content_mode}. Review
                against the applicable running release.
              </p>
              <label>
                Search this guide
                <input
                  type="search"
                  value={searchGuide}
                  onChange={(e) => setSearchGuide(e.target.value)}
                />
              </label>
              <nav
                className="studio-guide-contents"
                aria-label="Guide contents"
              >
                {guide.sections.map((s) => (
                  <a
                    key={s.section_id}
                    href={"#read-" + s.section_id}
                    onClick={(e) => {
                      e.preventDefault();
                      setSearchGuide("");
                      requestAnimationFrame(() => {
                        const heading = document.getElementById(
                          "read-" + s.section_id,
                        );
                        heading?.focus();
                        heading?.scrollIntoView({ block: "start" });
                      });
                    }}
                  >
                    {s.title}
                  </a>
                ))}
              </nav>
              {guide.sections
                .filter((s) =>
                  JSON.stringify(s)
                    .toLowerCase()
                    .includes(searchGuide.toLowerCase()),
                )
                .map((s) => (
                  <section className="studio-guide-section" key={s.section_id}>
                    <h3 id={"read-" + s.section_id} tabIndex={-1}>
                      {s.title}
                    </h3>
                    {s.paragraphs.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                    {s.steps.length > 0 && (
                      <ol>
                        {s.steps.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                    )}
                    {s.rows.length > 0 && (
                      <div className="studio-table-scroll">
                        <table>
                          <thead>
                            <tr>
                              {s.headers.map((h) => (
                                <th key={h} scope="col">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {s.rows.map((row, i) => (
                              <tr key={i}>
                                {row.map((cell, j) => (
                                  <td key={j}>{cell}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                ))}
              {!guide.sections.some((s) =>
                JSON.stringify(s)
                  .toLowerCase()
                  .includes(searchGuide.toLowerCase()),
              ) && (
                <p role="status">
                  No sections match. Clear the search to read the full guide.
                </p>
              )}
              <h3>Related entries</h3>
              <div className="studio-actions">
                {guide.related_entry_keys.map((key) => {
                  const entry = catalog.entries.find((e) => e.key === key);
                  return entry ? (
                    <Button
                      key={key}
                      onClick={() => open({ kind: "entry", entry })}
                    >
                      {entry.title}
                    </Button>
                  ) : null;
                })}
              </div>
            </>
          )}
        </div>
      </dialog>
    </div>
  );
}
