import { Settings2, TriangleAlert } from "lucide-react";
import { registryConfiguration } from "@/lib/contracts";

export function ConfigurationNotice({ compact = false }: { compact?: boolean }) {
  if (registryConfiguration === "ready") {
    return null;
  }

  return (
    <div
      className={`rounded-2xl border border-amber-300/60 bg-amber-50 text-amber-950 ${
        compact ? "p-3" : "p-4"
      }`}
      role="status"
    >
      <div className="flex gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-800">
          {registryConfiguration === "invalid" ? (
            <TriangleAlert className="h-4 w-4" />
          ) : (
            <Settings2 className="h-4 w-4" />
          )}
        </span>
        <div>
          <p className="text-sm font-bold">
            {registryConfiguration === "invalid"
              ? "Registry address is invalid"
              : "Registry deployment not configured"}
          </p>
          <p className="mt-1 text-sm leading-5 text-amber-900/70">
            Set{" "}
            <code className="rounded-md bg-amber-100 px-1.5 py-0.5 font-mono text-xs text-amber-950">
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
