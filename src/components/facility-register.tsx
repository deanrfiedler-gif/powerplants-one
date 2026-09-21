"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Field, PageHeader, ReadState, SelectField } from "./business-ui";
import { RecordTabs, RecordPanel } from "./record-ui";
import { denied } from "./crm-state";
import { FacilityDetail } from "./facility-detail";
import { SitePicker, useFacilityPages } from "./facility-controls";
import {
  displayValue,
  structures,
  uses,
} from "../shared/facilities/definition";
import type { RegisterRow } from "../shared/facilities/reads";

export function FacilityRegister({ fixedSite }: { fixedSite?: string }) {
  const params = useSearchParams(),
    router = useRouter(),
    [selected, setSelected] = useState<string | null>(null);
  const mode = params.get("view") === "hierarchy" ? "hierarchy" : "list";
  const site = fixedSite ?? params.get("site_id") ?? "",
    q = params.get("q") ?? "",
    structure = params.get("structure_type") ?? "",
    use = params.get("use") ?? "",
    sort = params.get("sort") ?? "name",
    organisation = params.get("organisation_id") ?? "";
  const query = new URLSearchParams({
    ...(site ? { site_id: site } : {}),
    ...(q ? { q } : {}),
    ...(structure ? { structure_type: structure } : {}),
    ...(use ? { use } : {}),
    ...(organisation ? { organisation_id: organisation } : {}),
    sort,
  });
  const read = useFacilityPages<RegisterRow>(`facilities/register?${query}`);
  function filter(key: string, value: string) {
    const next = new URLSearchParams(query);
    if (mode === "hierarchy") next.set("view", mode);
    if (value) next.set(key, value);
    else next.delete(key);
    setSelected(null);
    router.replace(`/facilities?${next}`, { scroll: false });
  }
  function inspect(id: string) {
    if (window.innerWidth < 1280) router.push(`/facilities/${id}`);
    else setSelected(id);
  }
  const active = !!(
    q ||
    structure ||
    use ||
    organisation ||
    (site && !fixedSite) ||
    sort !== "name"
  );
  if (denied(read.error))
    return <ReadState loading={false} error={read.error} retry={read.reload} />;
  return (
    <div className="facility-workspace facility-register">
      <PageHeader
        eyebrow="Customers & sites"
        title="Facilities & growing areas"
        description={
          fixedSite
            ? "Exact Site locations. Each footprint is recorded independently."
            : "Find exact locations across permitted Sites. Structure, use and equipment service remain separate."
        }
        action={
          read.can_create ? (
            <Link
              className="button"
              href={`/facilities/new${site ? `?site_id=${site}` : ""}`}
            >
              Add facility / area
            </Link>
          ) : undefined
        }
      />
      {organisation && (
        <p>
          Filtered through current Site relationships of{" "}
          <Link href={`/customers/${organisation}`}>this Organisation</Link>.
          The role is shown with each Site.
        </p>
      )}
      <div className="facility-toolbar">
        <Field
          name="facility-search"
          label="Search facilities"
          value={q}
          maxLength={200}
          onChange={(v) => filter("q", v)}
        />
        {!fixedSite && (
          <SitePicker value={site} onChange={(v) => filter("site_id", v)} />
        )}
        <SelectField
          name="facility-structure"
          label="Structure type"
          empty="All structures"
          value={structure}
          options={[
            ...Object.entries(structures).map(([id, display_name]) => ({
              id,
              display_name,
            })),
            { id: "not_recorded", display_name: "Not recorded" },
          ]}
          onChange={(v) => filter("structure_type", v)}
        />
        <SelectField
          name="facility-use"
          label="Use"
          empty="All uses"
          value={use}
          options={[
            ...Object.entries(uses).map(([id, display_name]) => ({
              id,
              display_name,
            })),
            { id: "not_recorded", display_name: "Not recorded" },
          ]}
          onChange={(v) => filter("use", v)}
        />
        <SelectField
          name="facility-sort"
          label="Sort"
          value={sort}
          options={[
            { id: "name", display_name: "Name" },
            { id: "site", display_name: "Site / name" },
            { id: "structure", display_name: "Structure / name" },
            { id: "updated", display_name: "Recently updated" },
          ]}
          onChange={(v) => filter("sort", v)}
        />
        {active && (
          <button
            className="secondary"
            type="button"
            onClick={() => {
              setSelected(null);
              router.replace(
                `/facilities${fixedSite ? `?site_id=${fixedSite}` : ""}`,
              );
            }}
          >
            Clear filters
          </button>
        )}
      </div>
      {organisation && (
        <p>
          Sites with a current permitted SiteParty relationship to the selected
          Organisation; roles remain recorded in Site context.{" "}
          <Link href={`/customers/${organisation}`}>Open Organisation</Link>
        </p>
      )}
      {site && (
        <RecordTabs
          id="facility-view"
          label="Site facilities presentation"
          value={mode}
          onChange={(v) => {
            const next = new URLSearchParams(query);
            next.set("view", v);
            router.replace(`/facilities?${next}`, { scroll: false });
            setSelected(null);
          }}
          tabs={[
            { id: "list", label: "List" },
            { id: "hierarchy", label: "Hierarchy" },
          ]}
        />
      )}
      <ReadState
        loading={read.loading}
        error={read.error}
        retry={read.reload}
      />
      {!read.loading && !read.error && (
        <p className="facility-count" role="status">
          {read.total} permitted matching records · {read.items.length} loaded
          {read.next ? "; more available" : ""}
        </p>
      )}
      <div
        className={`facility-register-body${selected ? " has-inspector" : ""}`}
      >
        <div className="facility-register-main">
          {mode === "hierarchy" && site ? (
            <RecordPanel id="facility-view" tab="hierarchy" value={mode}>
              {q || structure || use ? (
                <>
                  <p>
                    Matching records stay visible with their ancestor context;
                    ancestors do not add to the match count.
                  </p>
                  <ul className="facility-tree">
                    {read.items.map((f) => (
                      <HierarchyMatch key={f.id} row={f} inspect={inspect} />
                    ))}
                  </ul>
                  {read.next && (
                    <button
                      type="button"
                      className="secondary"
                      onClick={read.more}
                    >
                      More matching areas
                    </button>
                  )}
                </>
              ) : (
                <HierarchyBranch
                  key={site}
                  site={site}
                  parent="root"
                  depth={0}
                  inspect={inspect}
                  onCollapse={() => setSelected(null)}
                />
              )}
            </RecordPanel>
          ) : (
            <>
              <div className="facility-table-scroll">
                <table className="facility-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Record ID</th>
                      <th>Site</th>
                      <th>Structure</th>
                      <th>Use</th>
                      <th>Crop / crop group</th>
                      <th>Footprint (m²)</th>
                      <th>
                        <span className="sr-only">Inspect</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {read.items.map((f) => (
                      <tr key={f.id} data-selected={selected === f.id}>
                        <td>
                          <Link href={`/facilities/${f.id}`}>{f.name}</Link>
                        </td>
                        <td>
                          <span className="facility-table-id" title={f.id}>
                            {f.id}
                          </span>
                        </td>
                        <td>
                          <Link href={`/sites/${f.site_id}`}>
                            {f.site_name}
                          </Link>
                          {!!f.organisation_roles?.length && (
                            <small className="facility-meta">
                              {f.organisation_roles.join(", ")}
                            </small>
                          )}
                        </td>
                        <td>
                          {displayValue(f.structure_type, "structure_type")}
                        </td>
                        <td>{displayValue(f.use, "use")}</td>
                        <td>{displayValue(f.crop)}</td>
                        <td>{displayValue(f.footprint_m2)}</td>
                        <td>
                          <button
                            type="button"
                            className="secondary"
                            aria-label={`Inspect ${f.name} ${f.id}`}
                            onClick={() => inspect(f.id)}
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {read.next && (
                <button className="secondary" type="button" onClick={read.more}>
                  More facilities
                </button>
              )}
            </>
          )}
          {!read.loading && !read.error && !read.items.length && (
            <p className="empty-state">
              {active
                ? "No facilities match these filters."
                : "No permitted facilities have been recorded."}
            </p>
          )}
        </div>
        {selected && (
          <aside
            className="facility-inspector"
            aria-label="Facility inspection"
          >
            <FacilityDetail
              key={selected}
              id={selected}
              compact
              onClose={() => {
                setSelected(null);
                document
                  .querySelector<HTMLButtonElement>(
                    `button[aria-label$="${selected}"]`,
                  )
                  ?.focus();
              }}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
function HierarchyMatch({
  row,
  inspect,
}: {
  row: RegisterRow;
  inspect: (id: string) => void;
}) {
  return (
    <li>
      <p>
        {row.ancestor_path?.map((a) => (
          <span key={a.id}>
            <Link href={`/facilities/${a.id}`}>{a.name}</Link> /{" "}
          </span>
        ))}
        {row.parent_name && (
          <span>
            {row.parent_relationship === "physically_within"
              ? "Within"
              : "Grouped under"}{" "}
            <Link href={`/facilities/${row.parent_facility_id}`}>
              {row.parent_name}
            </Link>{" "}
            /{" "}
          </span>
        )}
        <Link href={`/facilities/${row.id}`}>{row.name}</Link>
      </p>
      <small>
        {row.site_name} · {row.id}
      </small>
      <button className="secondary" onClick={() => inspect(row.id)}>
        Inspect
      </button>
    </li>
  );
}
function HierarchyBranch({
  site,
  parent,
  depth,
  inspect,
  onCollapse,
}: {
  site: string;
  parent: string;
  depth: number;
  inspect: (id: string) => void;
  onCollapse: () => void;
}) {
  const r = useFacilityPages<RegisterRow>(
      `facilities/register?site_id=${site}&parent_id=${parent}&sort=name`,
    ),
    [expanded, setExpanded] = useState<string[]>([]);
  return (
    <>
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      <ul
        className="facility-tree"
        style={{ paddingInlineStart: depth ? "min(16px, 3vw)" : 0 }}
      >
        {r.items.map((f) => (
          <li key={f.id}>
            <div className="facility-tree-row">
              {f.has_children && (
                <button
                  type="button"
                  className="secondary"
                  aria-expanded={expanded.includes(f.id)}
                  aria-label={`${expanded.includes(f.id) ? "Collapse" : "Expand"} ${f.name}`}
                  onClick={() => {
                    if (expanded.includes(f.id)) onCollapse();
                    setExpanded((old) =>
                      old.includes(f.id)
                        ? old.filter((i) => i !== f.id)
                        : [...old, f.id],
                    );
                  }}
                >
                  {expanded.includes(f.id) ? "−" : "+"}
                </button>
              )}
              <div>
                <Link href={`/facilities/${f.id}`}>{f.name}</Link>
                <p>
                  {f.parent_facility_id
                    ? `${f.parent_relationship === "physically_within" ? "Within" : "Grouped under"} ${f.parent_name}`
                    : "Directly under Site"}{" "}
                  · {displayValue(f.structure_type, "structure_type")} ·{" "}
                  {displayValue(f.footprint_m2)}
                  {f.footprint_m2 ? " m²" : ""}
                </p>
                <small>{f.id}</small>
              </div>
              <button
                type="button"
                className="secondary"
                onClick={() => inspect(f.id)}
              >
                Inspect
              </button>
            </div>
            {expanded.includes(f.id) && (
              <HierarchyBranch
                site={site}
                parent={f.id}
                depth={depth + 1}
                inspect={inspect}
                onCollapse={onCollapse}
              />
            )}
          </li>
        ))}
      </ul>
      {r.next && (
        <button type="button" className="secondary" onClick={r.more}>
          More {parent === "root" ? "root areas" : "children"}
        </button>
      )}
    </>
  );
}
