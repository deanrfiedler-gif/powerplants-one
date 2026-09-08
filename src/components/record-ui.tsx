"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Field, useFieldError, type Option } from "./business-ui";
import { localDateTime, utcFromLocal } from "../scheduling/time";

export function RecordTabs({ id, label, tabs, value, onChange }: {
  id: string; label: string; tabs: { id: string; label: string }[];
  value: string; onChange: (value: string) => void;
}) {
  return <div className="record-tablist" role="tablist" aria-label={label}>
    {tabs.map((tab, index) => <button key={tab.id} type="button" role="tab"
      id={`${id}-tab-${tab.id}`} aria-controls={`${id}-panel-${tab.id}`}
      aria-selected={value === tab.id} tabIndex={value === tab.id ? 0 : -1}
      onClick={() => onChange(tab.id)} onKeyDown={event => {
        const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1
          : event.key === "ArrowRight" ? (index + 1) % tabs.length
          : event.key === "ArrowLeft" ? (index + tabs.length - 1) % tabs.length : null;
        if (next === null) return;
        event.preventDefault(); onChange(tabs[next].id);
        document.getElementById(`${id}-tab-${tabs[next].id}`)?.focus();
      }}>{tab.label}</button>)}
  </div>;
}
export function RecordPanel({ id, tab, value, children }: {
  id: string; tab: string; value: string; children: React.ReactNode;
}) {
  return <section className="record-panel" role="tabpanel" id={`${id}-panel-${tab}`}
    aria-labelledby={`${id}-tab-${tab}`} hidden={value !== tab} tabIndex={0}>{children}</section>;
}

// Selection always requires an explicit result. Editing its text clears the ID immediately.
// The caller supplies only the current permission-filtered server result, never a directory cache.
export function LookupField({ name, label, value, onChange, search, onSearch, options, loading, more, error }: {
  name: string; label: string; value: string; onChange: (id: string) => void;
  search: string; onSearch: (q: string) => void; options: Option[];
  loading: boolean; more?: boolean; error?: boolean;
}) {
  const [open, setOpen] = useState(false), [active, setActive] = useState(-1);
  const [selected, setSelected] = useState<Option | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const unique = useId(), list = `${unique}-results`;
  const fieldError = useFieldError(name);
  useEffect(() => { if(open && active >= 0) document.getElementById(`${list}-${active}`)?.scrollIntoView({block:"nearest"}); }, [open,active,list]);
  const found = options.find(o => o.id === value);
  const chosen = found ?? (selected?.id === value ? selected : null);
  const optionLabel = (o: Option) => `${o.display_name ?? o.description ?? "Record"}${o.display_number ? ` · ${o.display_number}` : ""}`;
  const choose = (o: Option) => { setSelected(o); onChange(o.id); onSearch(""); setOpen(false); setActive(-1); input.current?.focus(); };
  return <div className="field lookup-field" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
    <label htmlFor={name}>{label}</label>
    <input ref={input} id={name} name={name} data-validation-field={name} role="combobox" aria-autocomplete="list"
      aria-expanded={open} aria-controls={list} autoComplete="off"
      aria-activedescendant={open && !loading && !error && active >= 0 && options[active] ? `${list}-${active}` : undefined}
      aria-invalid={!!fieldError} aria-describedby={`${unique}-hint${fieldError ? ` ${unique}-error` : ""}`} value={value ? (chosen ? optionLabel(chosen) : "") : search}
      placeholder={`Search ${label.toLowerCase()}…`} onFocus={() => setOpen(true)}
      onChange={e => { onChange(""); setSelected(null); onSearch(e.target.value); setOpen(true); setActive(-1); }}
      onKeyDown={e => {
        if (e.key === "Escape") { setOpen(false); setActive(-1); e.stopPropagation(); }
        if (["ArrowDown", "ArrowUp"].includes(e.key)) { e.preventDefault(); setOpen(true); setActive(n => Math.max(0, Math.min(options.length - 1, n + (e.key === "ArrowDown" ? 1 : -1)))); }
        if (e.key === "Enter" && open) { e.preventDefault(); if (!loading && !error && options[active]) choose(options[active]); }
      }} />
    <small id={`${unique}-hint`}>{value ? "Selected record. Type to change it." : "Type a name or reference, then select a match."}</small>
    {fieldError && <small id={`${unique}-error`} className="field-error">{fieldError}</small>}
    {open && <div className="lookup-results">
      <ul id={list} role="listbox" aria-label={`${label} matches`} aria-busy={loading}>
        {!loading && !error && options.map((o, i) => <li key={o.id} role="presentation"><button type="button" role="option"
          data-record-id={o.id} id={`${list}-${i}`} aria-selected={o.id === value} data-active={active === i} tabIndex={-1}
          onMouseDown={e => e.preventDefault()} onClick={() => choose(o)}>{optionLabel(o)}</button></li>)}
      </ul>
      <p role="status">{error ? "Matches could not be loaded. Try again." : loading ? "Searching…" : options.length ? `${options.length} matches${more ? "; refine your search for more" : ""}` : "No matches. Try another name or reference."}</p>
    </div>}
  </div>;
}

export function LocalDateTimeField({ name, label = "Due date and time", value, onChange, timezone = "Australia/Brisbane", required = true }: {
  name: string; label?: string; value: string; onChange: (iso: string) => void; timezone?: string; required?: boolean;
}) {
  const [invalid, setInvalid] = useState<{ raw: string; message: string } | null>(null);
  const display = invalid?.raw ?? (value ? localDateTime(value, timezone) : "");
  return <div>
    <Field name={name} label={label} type="datetime-local" value={display} required={required}
      hint={timezone.replaceAll("_", " ")}
      onChange={raw => {
        try { const iso = raw ? utcFromLocal(raw, timezone) : ""; setInvalid(null); onChange(iso); }
        catch (e) { setInvalid({ raw, message: (e as Error).message }); onChange(""); }
      }} />
    {invalid && <p role="alert" className="field-error">{invalid.message}</p>}
  </div>;
}

// Native unload warning and in-app links share the same dirty state. Tabs retain mounted drafts.
export function useUnsavedChanges(dirty: boolean, pending = false) {
  useEffect(() => {
    if (!dirty && !pending) return;
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const click = (event: MouseEvent) => {
      const link = (event.target as Element).closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank" || link.download || link.hash && link.pathname === location.pathname) return;
      if (pending || !window.confirm("Leave this page and discard unsaved changes?")) {
        event.preventDefault(); event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", click, true);
    return () => { window.removeEventListener("beforeunload", unload); document.removeEventListener("click", click, true); };
  }, [dirty, pending]);
}
