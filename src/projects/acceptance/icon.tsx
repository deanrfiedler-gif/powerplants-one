import {
  Icon as ExistingIcon,
  type IconName,
} from "../../engineering/materials/components/client/materials-ui";
const additional = {
  info: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20v-2a6 6 0 0 1 12 0v2M17 5a3 3 0 0 1 0 6m1 3a5 5 0 0 1 3 5" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 5v5h-5M4 19v-5h5M19 10a7.5 7.5 0 0 0-13-5M5 14a7.5 7.5 0 0 0 13 5" />
    </>
  ),
};
export function Icon({ name }: { name: IconName | keyof typeof additional }) {
  return name in additional ? (
    <svg
      className="mw-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      {additional[name as keyof typeof additional]}
    </svg>
  ) : (
    <ExistingIcon name={name as IconName} />
  );
}
