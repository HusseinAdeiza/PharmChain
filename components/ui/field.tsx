import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/components/ui/button";

const fieldBase =
  "w-full rounded-xl border border-white/10 bg-black/40 text-base text-frost placeholder:text-muted/60 transition-[border-color,box-shadow] hover:border-white/25 focus:border-electric/70 focus:outline-none focus:ring-1 focus:ring-electric/60 focus:shadow-glow-cyan";

export function FieldLabel({
  children,
  htmlFor,
  optional = false,
}: {
  children: React.ReactNode;
  htmlFor: string;
  optional?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 flex items-baseline justify-between gap-3 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-muted"
    >
      <span>{children}</span>
      {optional ? (
        <span className="font-medium normal-case tracking-normal text-muted/70">Optional</span>
      ) : null}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(fieldBase, "min-h-12 px-4", className)}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(fieldBase, "min-h-32 resize-y px-4 py-3", className)}
      {...props}
    />
  );
}

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(fieldBase, "min-h-12 appearance-none bg-black/40 px-4 [&>option]:bg-panel [&>option]:text-frost", className)}
      {...props}
    />
  );
}
