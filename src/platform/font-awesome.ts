// ADR-0050: the Font Awesome Kit that draws the application's icons. The ID is configuration rather
// than code, so copies of this public repository do not draw on the owner's Kit. It is not a secret:
// every page that loads the Kit shows it. Anything other than a plain Kit ID is ignored, so a
// mistyped value can never become an arbitrary script address.
export function fontAwesomeKit(value = process.env.PPO_FONT_AWESOME_KIT): string | null {
  const kit = value?.trim() ?? "";
  return /^[a-z0-9]{6,32}$/i.test(kit) ? kit : null;
}
