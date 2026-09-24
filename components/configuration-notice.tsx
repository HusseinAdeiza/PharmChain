import { Settings2, TriangleAlert } from "lucide-react";
import { registryConfiguration } from "@/lib/contracts";

export function ConfigurationNotice({ compact = false }: { compact?: boolean }) {
  if (registryConfiguration === "ready") {
    return null;
  }

  return (
    <div
      className={`rounded-2xl border border-gold/40 bg-gold/5 ${compact ? "p-3" : "p-4"}`}
      role="status"
    >
      <div className="flex gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-gold/50 bg-gold/10 text-gold">
          {registryConfiguration === "invalid" ? (
            <TriangleAlert className="h-4 w-4" />
          ) : (
            <Settings2 className="h-4 w-4" />
          )}
        </span>
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-gold">
            {registryConfiguration === "invalid"
              ? "Registry address is invalid"
              : "Registry deployment not configured"}
          </p>
          <p className="mt-1.5 text-sm leading-5 text-muted">
            Set{" "}
            <code className="rounded-md border border-white/15 bg-black/40 px-1.5 py-0.5 font-mono text-xs text-electric">
              NEXT_PUBLIC_DRUG_REGISTRY_ADDRESS
            </code>{" "}
            to the verified DrugRegistry address on Monad Mainnet, then restart the
            app. No address or live result will be simulated.
          </p>
        </div>
      </div>
    </div>
  );
}
