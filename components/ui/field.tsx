import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/components/ui/button";

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
      className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-ink"
    >
      <span>{children}</span>
      {optional ? (
        <span className="text-xs font-medium text-ink/45">Optional</span>
      ) : null}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-12 w-full rounded-2xl border border-ink/10 bg-white px-4 text-base text-ink shadow-sm transition placeholder:text-ink/30 hover:border-ink/20 focus:border-teal focus:outline-none focus:ring-4 focus:ring-teal/10",
        className,
      )}
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
      className={cn(
        "min-h-32 w-full resize-y rounded-2xl border border-ink/10 bg-white px-4 py-3 text-base text-ink shadow-sm transition placeholder:text-ink/30 hover:border-ink/20 focus:border-teal focus:outline-none focus:ring-4 focus:ring-teal/10",
        className,
      )}
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
      className={cn(
        "min-h-12 w-full appearance-none rounded-2xl border border-ink/10 bg-white px-4 text-base text-ink shadow-sm transition hover:border-ink/20 focus:border-teal focus:outline-none focus:ring-4 focus:ring-teal/10",
        className,
      )}
      {...props}
    />
  );
}
