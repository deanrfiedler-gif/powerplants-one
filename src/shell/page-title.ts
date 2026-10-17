// NR-17: every page carries its own browser title, so tabs, history and bookmarks can be told apart
// and the route announcer reads a change of page. The most specific name comes first because tabs
// truncate from the right: the record, then the page or view, then the department, then the product.
export const productTitle = "Powerplants One";

export type TitleParts = {
  record?: string;
  page?: string;
  department?: string;
};

export function documentTitle({ record, page, department }: TitleParts): string {
  const parts: string[] = [];
  for (const part of [record, page, department]) {
    const value = part?.replace(/\s+/g, " ").trim();
    if (value && !parts.some((existing) => existing.toLocaleLowerCase("en-AU") === value.toLocaleLowerCase("en-AU")))
      parts.push(value);
  }
  return parts.length ? `${parts.join(" · ")} — ${productTitle}` : productTitle;
}

// Record headers publish an eyebrow such as "Service / SYN-PPO-WO-000001"; the tab and the breadcrumb
// need only the reference, because each names the department elsewhere.
export function recordReference(reference: string): string {
  const parts = reference.split(" / ");
  return parts[parts.length - 1].trim();
}

export function recordTitle(reference: string, title: string): string {
  return `${recordReference(reference)} · ${title}`;
}
