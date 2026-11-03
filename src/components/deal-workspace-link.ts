// Return context is a local worklist URL, never a redirect supplied by a host.
export function dealWorkspaceHref(id: string, section?: "timeline" | "files") {
  const back =
    typeof window !== "undefined" &&
    window.location.pathname === "/sales/opportunities"
      ? window.location.pathname + window.location.search
      : "/sales/opportunities";
  return `/sales/opportunities/${id}?return_to=${encodeURIComponent(back)}${section ? `&section=${section}` : ""}`;
}
