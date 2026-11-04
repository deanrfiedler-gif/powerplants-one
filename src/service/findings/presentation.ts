import type { FindingView } from "../../components/service-findings-menu";

export type FindingOption = { id: string; label: string };

export function findingFacetPath(
  query: URLSearchParams,
  facet: "owner_id" | "site_id",
) {
  const params = new URLSearchParams(query);
  params.delete(facet);
  return `service/findings?${params}`;
}

// An applied filter still needs its label when another filter empties the
// window, or when a new query has not returned its authorised options yet.
export function findingFacetOptions(
  options: readonly FindingOption[],
  selected: FindingOption,
) {
  return selected.id && !options.some((option) => option.id === selected.id)
    ? [...options, selected]
    : [...options];
}

export function findingViewHref(query: string, view: FindingView) {
  const params = new URLSearchParams(query);
  params.set("view", view);
  return `/service/findings?${params}`;
}
