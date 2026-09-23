"use client";
import { useState } from "react";
import { api, ErrorNotice } from "./business-ui";
import { WorkDialog } from "../activities/components/client/my-work-ui";
import { usePlatformResource } from "./platform-resource";
import type { readSavedViews } from "../platform/saved-views";
import {
  sameViewCriteria,
  teamSharing,
  type SavedView,
  type ViewTarget,
} from "../platform/view-targets";
type Saved = Awaited<ReturnType<typeof readSavedViews>>;
export function SavedViewControls({
  target,
  criteria,
  apply,
}: {
  target: ViewTarget;
  criteria: Record<string, string>;
  apply: (criteria: Record<string, string>) => void;
}) {
  const read = usePlatformResource<Saved>("views", false),
    [open, setOpen] = useState(false),
    [name, setName] = useState(""),
    [active, setActive] = useState<string | null>(null),
    [error, setError] = useState<unknown>(),
    [busy, setBusy] = useState(false),
    [rename, setRename] = useState<{ id: string; name: string } | null>(null);
  const views = read.data?.settings.views ?? [],
    current = views.find((v) => v.id === active);
  async function save(next: SavedView[]) {
    if (!read.data) return;
    setBusy(true);
    setError(undefined);
    try {
      await api("views", { expected_version: read.data.version, views: next });
      read.reload();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button className="mw-button" onClick={() => setOpen(true)}>
        Saved views
        {current
          ? ` · ${current.name}${sameViewCriteria(criteria, current.criteria) ? "" : " · Modified"}`
          : ""}
      </button>
      {open && (
        <WorkDialog
          title="Saved views"
          subtitle="Personal criteria; every use rechecks current access."
          onClose={() => setOpen(false)}
          busy={busy}
        >
          <p>{teamSharing.reason}</p>
          <ErrorNotice error={error ?? read.error} />
          {(error as { code?: string })?.code === "VersionConflict" && (
            <button className="mw-button" onClick={read.reload}>
              Reload current views; retain entered name
            </button>
          )}
          <form
            className="sh-toolbar"
            onSubmit={(e) => {
              e.preventDefault();
              const v: SavedView = {
                id: crypto.randomUUID(),
                name,
                target,
                schema_version: 1,
                scope: "personal",
                pinned: false,
                criteria,
              };
              void save([...views, v]);
            }}
          >
            <label>
              Save current criteria as
              <input
                value={name}
                maxLength={60}
                required
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <button
              className="mw-button"
              disabled={busy || !read.data || views.length >= 12}
            >
              Save view
            </button>
          </form>
          {read.loading && <p role="status">Loading saved views…</p>}
          <ul className="sh-register">
            {views
              .filter((v) => v.target === target)
              .toSorted((a, b) => Number(b.pinned) - Number(a.pinned))
              .map((v) => (
                <li key={v.id}>
                  <div>
                    <strong>{v.name}</strong>
                    <p>
                      {v.pinned ? "Pinned · " : ""}Personal
                      {read.data?.unavailable.includes(v.id)
                        ? " · Criteria unavailable; recreate from current filters"
                        : ""}
                    </p>
                    {rename?.id === v.id && (
                      <form
                        className="sh-toolbar"
                        onSubmit={(e) => {
                          e.preventDefault();
                          void save(
                            views.map((x) =>
                              x.id === v.id ? { ...x, name: rename.name } : x,
                            ),
                          );
                          setRename(null);
                        }}
                      >
                        <label>
                          New view name
                          <input
                            value={rename.name}
                            maxLength={60}
                            required
                            onChange={(e) =>
                              setRename({ id: v.id, name: e.target.value })
                            }
                          />
                        </label>
                        <button className="mw-button">Save name</button>
                      </form>
                    )}
                    <div className="sh-actions">
                      <button
                        className="mw-button"
                        disabled={read.data?.unavailable.includes(v.id)}
                        onClick={() => {
                          setActive(v.id);
                          apply(v.criteria);
                          setOpen(false);
                        }}
                      >
                        Use
                      </button>
                      <button
                        className="mw-button"
                        disabled={busy}
                        onClick={() =>
                          void save(
                            views.map((x) =>
                              x.id === v.id
                                ? { ...x, criteria, schema_version: 1 }
                                : x,
                            ),
                          )
                        }
                      >
                        Update to current criteria
                      </button>
                      <button
                        className="mw-button"
                        onClick={() => setRename({ id: v.id, name: v.name })}
                      >
                        Rename
                      </button>
                      <button
                        className="mw-button"
                        disabled={busy || views.length >= 12}
                        onClick={() => {
                          let n = 1;
                          let copy = "";
                          do {
                            copy = `${v.name.slice(0, 48)} copy ${n++}`;
                          } while (
                            views.some(
                              (x) =>
                                x.name.toLowerCase() === copy.toLowerCase(),
                            )
                          );
                          void save([
                            ...views,
                            {
                              ...v,
                              id: crypto.randomUUID(),
                              name: copy,
                              pinned: false,
                            },
                          ]);
                        }}
                      >
                        Duplicate
                      </button>
                      <button
                        className="mw-button"
                        disabled={busy}
                        onClick={() =>
                          void save(
                            views.map((x) =>
                              x.id === v.id ? { ...x, pinned: !x.pinned } : x,
                            ),
                          )
                        }
                      >
                        {v.pinned ? "Unpin" : "Pin"}
                      </button>
                      <button
                        className="mw-button"
                        disabled={busy}
                        onClick={() =>
                          void save(views.filter((x) => x.id !== v.id))
                        }
                      >
                        Retire
                      </button>
                    </div>
                  </div>
                </li>
              ))}
          </ul>
        </WorkDialog>
      )}
    </>
  );
}
