"use client";
import { Icon, type WizardIconName } from "./estimation-wizard-ui";
import { FontAwesomeGlyph } from "./font-awesome";
import { discoveryRegisterFontAwesome } from "./font-awesome-icons";
type Name = keyof typeof discoveryRegisterFontAwesome;
const fallback: Partial<Record<Name, WizardIconName>> = {
  branch: "copy",
  incomplete: "history",
  unrecorded: "document",
  legacy: "document",
  cost: "document",
  refresh: "history",
};
// Page-local adapter: the shared loader and existing local fallback remain authoritative.
export function DiscoveryRegisterIcon({
  name,
}: {
  name: WizardIconName | Name;
}) {
  if (!(name in discoveryRegisterFontAwesome))
    return <Icon name={name as WizardIconName} />;
  return (
    <FontAwesomeGlyph
      icon={discoveryRegisterFontAwesome[name as Name]}
      className="es02-icon"
      fallback={
        <Icon name={fallback[name as Name] ?? (name as WizardIconName)} />
      }
    />
  );
}
