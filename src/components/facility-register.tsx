"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Field, SelectField, Stamp } from "./business-ui";
import { denied } from "./crm-state";
import { FacilityDetail } from "./facility-detail";
import { SitePicker, useFacilityPages } from "./facility-controls";
import { useFacilityViewCounts } from "./facility-shell";
import {
  displayValue,
  structures,
  uses,
} from "../shared/facilities/definition";
import {
  detailsToComplete,
  facilityViews,
  hierarchyRows,
  measurement,
  type FacilityView,
} from "../shared/facilities/presentation";
import type { RegisterRow } from "../shared/facilities/reads";
import {
  RegisterTable,
  RegisterChip,
  RegisterSortHeader,
} from "./ui/register-table";
import { Button, ButtonLink } from "./ui/button";
import { ShellIcon } from "./shell-icon";
import { ProductIcon } from "./product-icons";
import { Icon } from "../activities/components/client/my-work-ui";
import { usePhoneHeader } from "../shell/phone-header";

export function FacilityRegister({ fixedSite }: { fixedSite?: string }) {
  const params = useSearchParams(),
    router = useRouter();
  const [selected, setSelected] = useState<string | null>(null),
    [checks, setChecks] = useState<string[]>([]);
  const filters = useRef<HTMLDialogElement>(null),
    snapshot = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null),
    publishCounts = useFacilityViewCounts();
  const mode = params.get("view") === "hierarchy" ? "hierarchy" : "list";
  const site = fixedSite ?? params.get("site_id") ?? "",
    q = params.get("q") ?? "";
  const structure = params.get("structure_type") ?? "",
    use = params.get("use") ?? "";
  const view = Object.hasOwn(facilityViews, params.get("area_view") ?? "")
    ? (params.get("area_view") as FacilityView)
    : "all";
  const sort = params.get("sort") ?? "site",
    organisation = params.get("organisation_id") ?? "";
  const query = new URLSearchParams({
    sort,
    area_view: view,
    ...(site ? { site_id: site } : {}),
    ...(q ? { q } : {}),
    ...(structure ? { structure_type: structure } : {}),
    ...(use ? { use } : {}),
    ...(organisation ? { organisation_id: organisation } : {}),
  });
  const read = useFacilityPages<RegisterRow>(`facilities/register?${query}`);
  const ready = !read.loading && !read.error,
    active = !!(q || structure || use || organisation || (site && !fixedSite));
  useEffect(() => {
    if (!fixedSite) publishCounts(ready ? read.view_counts : undefined);
  }, [fixedSite, publishCounts, ready, read.view_counts]);
  useEffect(() => {
    if (selected) snapshot.current?.showModal();
  }, [selected]);
  function filter(key: string, value: string) {
    const next = new URLSearchParams(query);
    next.set("view", mode);
    if (value) next.set(key, value);
    else next.delete(key);
    setSelected(null);
    setChecks([]);
    router.replace(`/facilities?${next}`, { scroll: false });
  }
  function clear() {
    setSelected(null);
    setChecks([]);
    router.replace(`/facilities${fixedSite ? `?site_id=${fixedSite}` : ""}`, {
      scroll: false,
    });
  }
  function inspect(id: string, element: HTMLElement) {
    opener.current = element;
    setSelected(id);
  }
  function closeSnapshot() {
    snapshot.current?.close();
    setSelected(null);
    opener.current?.focus();
  }
  function openFilters(element: HTMLElement) {
    opener.current = element;
    filters.current?.showModal();
  }
  useEffect(() => {
    const open = (event: Event) =>
      openFilters((event as CustomEvent<HTMLElement>).detail);
    window.addEventListener("ppo-facility-filters", open);
    return () => window.removeEventListener("ppo-facility-filters", open);
  }, []);
  usePhoneHeader(
    fixedSite
      ? null
      : {
          title: "Facilities",
          count: ready ? read.total : undefined,
          pageAction: {
            label: "Search facilities",
            icon: "search",
            search: true,
            onSelect: openFilters,
          },
          filter: { open: openFilters, applied: active },
          chooseView: { open: openFilters, controls: "facility-filters" },
        },
  );
  const options = (values: Record<string, string>) =>
    Object.entries(values).map(([id, display_name]) => ({ id, display_name }));
  const rows =
    mode === "hierarchy"
      ? hierarchyRows(read.items)
      : read.items.map((row) => ({ row, depth: 0 }));
  return (
    <div className="facility-workspace facility-register">
      <h1 className="sr-only">Facilities &amp; growing areas</h1>
      <div className="facility-toolbar">
        {read.can_create && (
          <ButtonLink
            className="facility-add"
            variant="primary"
            href={`/facilities/new${site ? `?site_id=${site}` : ""}`}
          >
            <ShellIcon name="plus" />
            <span>Facility / area</span>
          </ButtonLink>
        )}
        <Button
          className="facility-site-filter"
          onClick={(e) => openFilters(e.currentTarget)}
        >
          Site: {site ? (read.items[0]?.site_name ?? "Selected site") : "All"}
          <ShellIcon name="down" />
        </Button>
        <label className="facility-inline-filter">
          Structure
          <select
            aria-label="Structure type"
            value={structure}
            onChange={(e) => filter("structure_type", e.target.value)}
          >
            <option value="">All</option>
            {options(structures).map((o) => (
              <option key={o.id} value={o.id}>
                {o.display_name}
              </option>
            ))}
            <option value="not_recorded">Not recorded</option>
          </select>
        </label>
        <label className="facility-inline-filter facility-use-filter">
          Use
          <select
            aria-label="Use"
            value={use}
            onChange={(e) => filter("use", e.target.value)}
          >
            <option value="">All</option>
            {options(uses).map((o) => (
              <option key={o.id} value={o.id}>
                {o.display_name}
              </option>
            ))}
          </select>
        </label>
        <span className="facility-count" role="status">
          {ready ? `${read.total} facilities` : read.loading ? "Loading…" : "—"}
          <span className="facility-read-time">
            {ready && read.read_at ? (
              <>
                {" "}
                · as at{" "}
                <Stamp value={read.read_at} timezone="Australia/Brisbane" />
              </>
            ) : (
              " · Current results unconfirmed"
            )}
          </span>
        </span>
        <div
          className="facility-view-toggle"
          role="group"
          aria-label="Register presentation"
        >
          <Button
            aria-label="List"
            aria-pressed={mode === "list"}
            onClick={() => filter("view", "list")}
          >
            <ProductIcon name="list" />
          </Button>
          <Button
            aria-label="Hierarchy"
            aria-pressed={mode === "hierarchy"}
            onClick={() => filter("view", "hierarchy")}
          >
            <ProductIcon name="code-branch" />
          </Button>
        </div>
        <Button aria-label="Refresh facilities" onClick={read.reload}>
          <Icon name="refresh" />
        </Button>
        <Button
          aria-label="Search and filter facilities"
          onClick={(e) => openFilters(e.currentTarget)}
        >
          <ShellIcon name="more" />
        </Button>
      </div>
      <div className="facility-phone-toolbar">
        <label>
          <span className="sr-only">Facilities view</span>
          <select
            value={view}
            onChange={(e) => filter("area_view", e.target.value)}
          >
            {options(facilityViews).map((o) => (
              <option key={o.id} value={o.id}>
                {o.display_name}
              </option>
            ))}
          </select>
        </label>
        <span>
          {ready
            ? `${read.total} of ${read.view_counts?.all ?? read.total}`
            : read.loading
              ? "Loading…"
              : "—"}
        </span>
        <Button
          aria-label="Filter areas"
          onClick={(e) => openFilters(e.currentTarget)}
        >
          <ShellIcon name="filter" />
        </Button>
        <Button onClick={(e) => openFilters(e.currentTarget)}>
          Site: {site ? (read.items[0]?.site_name ?? "Selected site") : "All"}
          <ShellIcon name="down" />
        </Button>
        <span>
          {ready && read.read_at ? (
            <>
              As at{" "}
              <time>
                {new Date(read.read_at).toLocaleTimeString("en-AU", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
              </time>
            </>
          ) : (
            "Current results unconfirmed"
          )}
        </span>
        <Button aria-label="Refresh areas" onClick={read.reload}>
          <Icon name="refresh" />
        </Button>
      </div>
      {read.can_create && (
        <ButtonLink
          className="facility-phone-add"
          variant="primary"
          href={`/facilities/new${site ? `?site_id=${site}` : ""}`}
          aria-label="Add facility or area"
        >
          <ShellIcon name="plus" />
        </ButtonLink>
      )}
      {active && (
        <div className="facility-filter-chips">
          {q && <Button onClick={() => filter("q", "")}>Search: {q} ×</Button>}
          {use && (
            <Button onClick={() => filter("use", "")}>
              Use: {displayValue(use, "use")} ×
            </Button>
          )}
          {structure && (
            <Button onClick={() => filter("structure_type", "")}>
              Structure: {displayValue(structure, "structure_type")} ×
            </Button>
          )}
          {organisation && (
            <Link href={`/customers/${organisation}`}>
              Organisation context
            </Link>
          )}
        </div>
      )}
      {read.loading && (
        <div className="facility-loading" role="status">
          <p>Loading permitted facilities and areas…</p>
          {Array.from({ length: 6 }, (_, i) => (
            <div className="facility-skeleton" key={i} aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          ))}
        </div>
      )}
      {!!read.error && (
        <div className="facility-state facility-state-error" role="alert">
          <h2>
            {denied(read.error)
              ? "Facilities unavailable"
              : "Facilities could not be loaded"}
          </h2>
          <p>
            {denied(read.error)
              ? "You do not have access to these areas. No list or counts are shown."
              : "No list or counts are shown, so nothing here is out of date. Check your connection, then retry."}
          </p>
          <Button onClick={read.reload}>Retry loading</Button>
        </div>
      )}
      {ready && read.items.length === 0 && (
        <div className="facility-state">
          <h2>{active ? "No matching areas" : "No facilities recorded"}</h2>
          <p>
            {active
              ? "No permitted area matches these filters. Areas you cannot see because of site access are not counted. Clear a filter or search by site."
              : "Record a facility or area when its equipment, measurements or work need that context."}
          </p>
          {active && <Button onClick={clear}>Clear filters</Button>}
        </div>
      )}
      {ready && read.items.length > 0 && (
        <>
          <div className="facility-desktop-grid">
            <RegisterTable caption="Facilities and areas. Select a name to open its read-only snapshot. Checkboxes select loaded rows only.">
              <colgroup>
                {[
                  "select",
                  "name",
                  "site",
                  "parent",
                  "structure",
                  "use",
                  "crop",
                  "footprint",
                  "basis",
                  "equipment",
                  "changed",
                  "actions",
                ].map((c) => (
                  <col key={c} className={`facility-col-${c}`} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      aria-label="Select all loaded areas"
                      checked={
                        read.items.length > 0 &&
                        read.items.every((r) => checks.includes(r.id))
                      }
                      onChange={(e) =>
                        setChecks(
                          e.target.checked ? read.items.map((r) => r.id) : [],
                        )
                      }
                    />
                  </th>
                  <RegisterSortHeader
                    label="Facility / area"
                    direction={sort === "name" ? "ascending" : undefined}
                    onSort={() => filter("sort", "name")}
                  />
                  <RegisterSortHeader
                    label="Site"
                    direction={sort === "site" ? "ascending" : undefined}
                    onSort={() => filter("sort", "site")}
                  />
                  <th>{mode === "hierarchy" ? "Relationship" : "Within"}</th>
                  <th>Structure</th>
                  <th>Use</th>
                  <th>Crop / crop group</th>
                  <th className="facility-number">Footprint (m²)</th>
                  <th>Basis</th>
                  <th className="facility-number">Installed equipment</th>
                  <RegisterSortHeader
                    label="Last changed"
                    direction={sort === "updated" ? "descending" : undefined}
                    onSort={() => filter("sort", "updated")}
                  />
                  <th>
                    <span className="sr-only">Open snapshot</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ row: f, depth }) => (
                  <tr
                    key={f.id}
                    data-selected={checks.includes(f.id) || undefined}
                    data-inspected={selected === f.id || undefined}
                  >
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Select ${f.name}`}
                        checked={checks.includes(f.id)}
                        onChange={(e) =>
                          setChecks((old) =>
                            e.target.checked
                              ? [...old, f.id]
                              : old.filter((id) => id !== f.id),
                          )
                        }
                      />
                    </td>
                    <td>
                      <button
                        className="facility-row-open"
                        type="button"
                        onClick={(e) => inspect(f.id, e.currentTarget)}
                        title={f.name}
                      >
                        {depth > 0 && (
                          <span
                            aria-label={`${depth} levels within recorded parents`}
                          >
                            {"└ ".repeat(Math.min(depth, 4))}
                          </span>
                        )}
                        {f.name}
                      </button>
                    </td>
                    <td>
                      <Link href={`/sites/${f.site_id}`}>{f.site_name}</Link>
                    </td>
                    <td title={f.ancestor_path?.map((a) => a.name).join(" › ")}>
                      {mode === "hierarchy"
                        ? f.parent_facility_id
                          ? displayValue(
                              f.parent_relationship,
                              "parent_relationship",
                            )
                          : "—"
                        : (f.parent_name ?? "—")}
                    </td>
                    <td>
                      {f.structure_type === "unknown" ? (
                        <RegisterChip tone="attention">Unknown</RegisterChip>
                      ) : (
                        displayValue(f.structure_type, "structure_type")
                      )}
                    </td>
                    <td>{displayValue(f.use, "use")}</td>
                    <td>{displayValue(f.crop)}</td>
                    <td className="facility-number">
                      {measurement(f.footprint_m2)}
                    </td>
                    <td>
                      {displayValue(f.measurement_basis, "measurement_basis")}
                    </td>
                    <td className="facility-number">
                      {f.installed_equipment_count}
                    </td>
                    <td>
                      <Stamp value={f.updated_at} timezone={f.timezone} />
                      {f.updated_by_name && <> · {f.updated_by_name}</>}
                    </td>
                    <td>
                      <Button
                        variant="quiet"
                        aria-label={`Snapshot of ${f.name}`}
                        onClick={(e) => inspect(f.id, e.currentTarget)}
                      >
                        <ShellIcon name="more" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </RegisterTable>
          </div>
          <div className="facility-phone-list">
            {rows.map(({ row: f }) => (
              <Link
                key={f.id}
                href={`/facilities/${f.id}`}
                className="facility-phone-row"
              >
                <div>
                  <strong>{f.name}</strong>
                  <span>{measurement(f.footprint_m2, " m²")}</span>
                </div>
                <p>
                  {displayValue(f.structure_type, "structure_type")}
                  {f.parent_name ? ` · within ${f.parent_name}` : ""}
                </p>
                <p className={detailsToComplete(f) ? "facility-attention" : ""}>
                  {detailsToComplete(f)
                    ? "Details to complete"
                    : `${displayValue(f.use, "use")}${f.crop ? ` · ${f.crop}` : ""}`}
                </p>
                <ShellIcon name="chevron-right" />
              </Link>
            ))}
          </div>
          {read.next && <Button onClick={read.more}>More facilities</Button>}
          {mode === "hierarchy" && (
            <p className="facility-banner">
              Hierarchy shows the parents recorded on each area: “Grouping” or
              “Physically within”. Nothing is inherited from a parent, so each
              area keeps its own structure, use, measurements and equipment
              service.
              {read.next &&
                " More areas are available; this is the loaded part of the hierarchy."}
            </p>
          )}
        </>
      )}
      <dialog
        ref={filters}
        id="facility-filters"
        className="facility-filter-dialog"
        aria-labelledby="facility-filter-title"
        onClose={() => opener.current?.focus()}
      >
        <h2 id="facility-filter-title">Search and filter facilities</h2>
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
          name="facility-view"
          label="View"
          value={view}
          options={options(facilityViews)}
          onChange={(v) => filter("area_view", v)}
        />
        <SelectField
          name="facility-filter-structure"
          label="Structure"
          empty="All structures"
          value={structure}
          options={options(structures)}
          onChange={(v) => filter("structure_type", v)}
        />
        <SelectField
          name="facility-filter-use"
          label="Use filter"
          empty="All uses"
          value={use}
          options={options(uses)}
          onChange={(v) => filter("use", v)}
        />
        <div className="facility-actions">
          <Button onClick={clear}>Clear filters</Button>
          <Button variant="primary" onClick={() => filters.current?.close()}>
            Done
          </Button>
        </div>
      </dialog>
      {selected && (
        <dialog
          ref={snapshot}
          className="facility-snapshot-dialog"
          aria-label="Facility snapshot"
          onCancel={closeSnapshot}
          onClose={() => {
            setSelected(null);
            opener.current?.focus();
          }}
        >
          <FacilityDetail
            key={selected}
            id={selected}
            compact
            onClose={closeSnapshot}
          />
        </dialog>
      )}
    </div>
  );
}
