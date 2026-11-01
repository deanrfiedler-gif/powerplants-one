"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { ReleasedLibrary } from "./released";

// The released guides, for the shell (ADR-0065, decision 8). The root layout reads them on the server with
// releasedGuideLibrary() and passes them here; the shell reads them with useReleasedGuides(). This module is a client
// component, so it imports only types: never the compiler or the library, which read files.
//
// Without a provider (a component fixture, or a layout that could not read the release) the library is empty, and
// every page shows the existing "being prepared" fallback.
const emptyLibrary: ReleasedLibrary = { guides: [], routes: [], shell: null };
const ReleasedGuides = createContext<ReleasedLibrary>(emptyLibrary);

export function GuideLibraryProvider({ value, children }: { value: ReleasedLibrary; children: ReactNode }) {
  return <ReleasedGuides.Provider value={value}>{children}</ReleasedGuides.Provider>;
}

export const useReleasedGuides = (): ReleasedLibrary => useContext(ReleasedGuides);
