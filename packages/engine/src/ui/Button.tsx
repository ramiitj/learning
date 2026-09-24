import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "quiet";

export function Button({ variant = "secondary", className, type = "button", ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type={type} className={["lm-btn", `lm-btn--${variant}`, className].filter(Boolean).join(" ")} {...rest} />;
}
