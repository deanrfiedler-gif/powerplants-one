// CSS content strings require CSS escaping, not JSON or HTML quoting.
// Escaping every code point also prevents closing the containing style element.
export function printHeaderCss(
  reference: string,
  revision: string,
  state: string,
) {
  const text = `${reference} · ${revision} · ${state} · Synthetic prototype`;
  const quoted =
    '"' +
    Array.from(text, (char) => `\\${char.codePointAt(0)!.toString(16)} `).join(
      "",
    ) +
    '"';
  return `@page job-pack-workbench { @top-left { content: ${quoted}; font: 8pt Verdana,sans-serif; color: #526176; } }`;
}
