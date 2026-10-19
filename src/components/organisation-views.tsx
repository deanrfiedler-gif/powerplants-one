"use client";
import { useState } from "react";
import { api, ErrorNotice } from "./business-ui";
import { useCrmResource } from "./crm-state";
import type { DirectoryView } from "../crm/directory";

/** Preserve the existing account-specific saved-view command and optimistic version. */
export function OrganisationViews({
  query,
  columns,
  apply,
}: {
  query: URLSearchParams;
  columns: string[];
  apply: (view: DirectoryView) => void;
}) {
  const resource = useCrmResource<{ version: number; views: DirectoryView[] }>(
    "crm/directory/views?kind=organisations",
    true,
  );
  const [selected, setSelected] = useState(""),
    [name, setName] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(null),
    [message, setMessage] = useState("");
  const extended =
    !!query.get("owner") ||
    ![null, "All"].includes(query.get("view")) ||
    query.get("sort") === "follow_up" ||
    query.get("sort") === "areas";
  async function save(remove: boolean) {
    if (!resource.data || busy) return;
    setBusy(true);
    setError(null);
    try {
      const current = {
        name: name.trim(),
        q: query.get("q") ?? "",
        status: query.get("status") ?? "",
        mine: query.get("mine") ?? "false",
        sort: query.get("sort") ?? "name",
        direction: query.get("direction") ?? "asc",
        limit: query.get("limit") ?? "25",
        columns: columns
          .filter((c) => !["service", "follow_up"].includes(c))
          .map((c) => (c === "areas" ? "facilities" : c)),
      };
      const views = remove
        ? resource.data.views.filter((v) => v.name !== selected)
        : [
            ...resource.data.views.filter((v) => v.name !== current.name),
            current,
          ];
      await api("crm/directory/views", {
        kind: "organisations",
        expected_version: resource.data.version,
        views,
      });
      setMessage(
        remove ? "Saved view removed." : "View saved for your account.",
      );
      setSelected(remove ? "" : current.name);
      resource.reload();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="org-saved-views">
      <h3>Saved views</h3>
      <ErrorNotice error={resource.error || error} />
      <label>
        Saved view
        <select
          value={selected}
          onChange={(e) => {
            const view = resource.data?.views.find(
              (v) => v.name === e.target.value,
            );
            setSelected(e.target.value);
            setName(e.target.value);
            if (view) apply(view);
          }}
        >
          <option value="">Custom view</option>
          {resource.data?.views.map((v) => (
            <option key={v.name}>{v.name}</option>
          ))}
        </select>
      </label>
      <label>
        View name
        <input
          value={name}
          maxLength={60}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <button
        type="button"
        disabled={busy || !resource.data || !name.trim() || extended}
        onClick={() => void save(false)}
      >
        Save view
      </button>
      <button
        type="button"
        className="secondary"
        disabled={busy || !resource.data || !selected}
        onClick={() => void save(true)}
      >
        Remove saved view
      </button>
      <p role="status">{message}</p>
      <p>
        Saved views retain search, status, owned-by-me, sorting, page size and
        legacy columns. The address bar retains the additional organisation view
        and owner filters.
      </p>
      {extended && (
        <p>
          Choose All organisations and a supported sort without a specific owner
          to save this view.
        </p>
      )}
    </section>
  );
}
