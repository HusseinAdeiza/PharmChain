import { forwardRef, type ButtonHTMLAttributes } from "react";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type ButtonVariant = "primary" | "secondary" | "outline" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

export function buttonStyles(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50",
    variant === "primary" &&
      "bg-ink text-white shadow-[0_10px_28px_rgba(16,44,42,0.18)] hover:-translate-y-0.5 hover:bg-forest hover:shadow-[0_14px_32px_rgba(16,44,42,0.22)]",
    variant === "secondary" &&
      "bg-mint text-ink hover:-translate-y-0.5 hover:bg-[#a5e8d1]",
    variant === "outline" &&
      "border border-ink/15 bg-white/70 text-ink hover:border-teal/40 hover:bg-white",
    variant === "danger" &&
      "bg-coral text-white shadow-[0_10px_28px_rgba(238,106,75,0.2)] hover:-translate-y-0.5 hover:bg-[#dc5b3e]",
    variant === "ghost" && "text-ink hover:bg-ink/5",
    size === "sm" && "min-h-10 px-4 text-sm",
    size === "md" && "min-h-12 px-5 text-sm",
    size === "lg" && "min-h-14 px-6 text-base",
    className,
  );
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={buttonStyles(variant, size, className)}
      {...props}
    />
  ),
);

Button.displayName = "Button";
