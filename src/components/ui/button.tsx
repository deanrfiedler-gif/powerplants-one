import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";
type Variant = "primary" | "secondary" | "quiet" | "danger";
const style = (variant: Variant, className?: string) =>
  `ppo-button ppo-button--${variant} ${className || ""}`;
export function Button({
  variant = "secondary",
  busy = false,
  children,
  className,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      {...props}
      className={style(variant, className)}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
    >
      {busy ? "Working…" : children}
    </button>
  );
}
export function ButtonLink({
  variant = "secondary",
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant }) {
  return <a {...props} className={style(variant, className)} />;
}
