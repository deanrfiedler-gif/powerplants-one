"use client";
import { useCallback, useEffect, useState, type SetStateAction } from "react";
import { useSearchParams } from "next/navigation";
import { initialWorklistFilters, readWorklistLocation, worklistSearch, type WorklistFilters, type WorklistLocation } from "../crm/worklist-location";
import { businessViewChannel, sessionLockEvent } from "./session-signal";

type Mode = "push" | "replace";
function writeLocation(state: WorklistLocation, mode: Mode) {
  const search = worklistSearch(state);
  const url = window.location.pathname + (search ? `?${search}` : "") + window.location.hash;
  if (url !== window.location.pathname + window.location.search + window.location.hash)
    window.history[mode === "push" ? "pushState" : "replaceState"](null, "", url);
}
const resolve = <T,>(next: SetStateAction<T>, old: T): T => typeof next === "function" ? (next as (v: T) => T)(old) : next;

export function useWorklistLocation() {
  const params = useSearchParams();
  const state = readWorklistLocation(new URLSearchParams(params.toString()));
  // Signed paging tokens expire and bind the actor and result population. They
  // remain in memory; reload, a shared URL or changed criteria starts at page one.
  const [page, setPage] = useState({ criteria: "", cursor: "" });
  const criteria = JSON.stringify(state.filters);
  const filters = { ...state.filters, cursor: page.criteria === criteria ? page.cursor : "" };
  const setFilters = (next: SetStateAction<WorklistFilters>, mode: Mode = "replace") => {
    const current = readWorklistLocation(new URLSearchParams(window.location.search));
    const currentCriteria = JSON.stringify(current.filters);
    const value = resolve(next, { ...current.filters, cursor: page.criteria === currentCriteria ? page.cursor : "" });
    setPage({ criteria: JSON.stringify({ ...value, cursor: "" }), cursor: value.cursor });
    writeLocation({ ...current, filters: value }, mode);
  };
  const setView = (view: WorklistLocation["view"]) => {
    const current = readWorklistLocation(new URLSearchParams(window.location.search));
    const outcome = view === "Archive" ? "Closed" : view === "Forecast" || current.view === "Archive" ? "Open" : current.filters.outcome;
    setPage({ criteria: "", cursor: "" });
    writeLocation({ ...current, filters: { ...current.filters, outcome, cursor: "" }, view }, "push");
  };
  const setSelected = (selected: string, mode: Mode = "replace") => writeLocation({ ...readWorklistLocation(new URLSearchParams(window.location.search)), selected }, mode);
  const clear = useCallback((keepPipeline = false) => {
    const current = readWorklistLocation(new URLSearchParams(window.location.search));
    setPage({ criteria: "", cursor: "" });
    writeLocation({ filters: { ...initialWorklistFilters, ...(keepPipeline ? { pipeline_definition_id: current.filters.pipeline_definition_id } : {}) }, view: "Board", selected: "" }, "replace");
  }, [setPage]);
  useEffect(() => {
    const lock = () => clear(true);
    const remoteLock = (event: MessageEvent) => { if (event.data === "Lock") lock(); };
    const navigation = () => setPage({ criteria: "", cursor: "" });
    const channel = businessViewChannel();
    window.addEventListener(sessionLockEvent, lock);
    window.addEventListener("popstate", navigation);
    channel.addEventListener("message", remoteLock);
    return () => { window.removeEventListener(sessionLockEvent, lock); window.removeEventListener("popstate", navigation); channel.removeEventListener("message", remoteLock); };
  }, [clear]);
  return { filters, view: state.view, selected: state.selected, setFilters, setView, setSelected, clear };
}
