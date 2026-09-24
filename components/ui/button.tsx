import { forwardRef, type ButtonHTMLAttributes } from "react";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type ButtonVariant = "primary" | "secondary" | "outline" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

const pressMotion =
  "transition-[transform,box-shadow,background-color,border-color,color] duration-200 motion-safe:active:scale-[0.97]";

export function buttonStyles(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
) {
  return cn(
    "inline-flex select-none items-center justify-center gap-2 rounded-full border font-mono font-semibold uppercase tracking-[0.12em] disabled:pointer-events-none disabled:opacity-40",
    pressMotion,
    variant === "primary" &&
      cn(
        "btn-sheen border-transparent bg-gradient-to-r from-electric to-teal text-void shadow-[0_12px_40px_-14px_rgba(31,182,255,0.7)] motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-[0_18px_50px_-12px_rgba(31,182,255,0.75)] motion-safe:hover:brightness-105",
      ),
    variant === "secondary" &&
      cn(
        "border-gold/40 bg-gold/10 text-gold motion-safe:hover:border-gold/70 motion-safe:hover:bg-gold/20",
      ),
    variant === "outline" &&
      cn(
        "border-white/15 bg-transparent text-frost motion-safe:hover:border-electric/50 motion-safe:hover:bg-white/[0.03] motion-safe:hover:text-electric",
      ),
    variant === "danger" &&
      cn(
        "border-transparent bg-danger text-void shadow-[0_12px_40px_-14px_rgba(255,77,77,0.7)] motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-[0_18px_50px_-12px_rgba(255,77,77,0.75)] motion-safe:hover:brightness-105",
      ),
    variant === "ghost" &&
      "border-transparent bg-transparent text-muted underline decoration-white/15 decoration-1 underline-offset-4 motion-safe:hover:text-frost motion-safe:hover:decoration-electric",
    size === "sm" && "min-h-10 px-4 text-[11px]",
    size === "md" && "min-h-12 px-5 text-xs",
    size === "lg" && "min-h-14 px-7 text-sm",
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
