import type { Metadata } from "next";
import { BadgePlus, IdCard, ShieldCheck } from "lucide-react";
import { ManufacturerCredentialForm } from "@/components/manufacturer-credential-form";
import { RegisterForm } from "@/components/register-form";
import { buttonStyles } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Register a manufacturer credential or batch",
  description:
    "Mint an owner-issued manufacturer credential or attest a medicine batch to the configured contracts on Monad Mainnet.",
};

export default function RegisterPage() {
  return (
    <section className="relative overflow-hidden py-10 sm:py-14 lg:py-16">
      <div className="grid-fade pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px]" />
      <div className="pointer-events-none absolute -left-20 top-24 -z-10 h-64 w-64 rounded-full bg-mint/50 blur-3xl" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-teal/15 bg-white px-3 py-2 text-xs font-bold text-teal shadow-sm">
            <IdCard className="h-4 w-4" />
            CREDENTIAL + BATCH ONBOARDING
          </span>
          <h1 className="mt-5 text-balance font-display text-4xl font-black tracking-[-0.05em] sm:text-5xl">
            Issue trust, then attest medicine batches
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-ink/55">
            Contract owners can issue soulbound manufacturer credentials. Verified
            manufacturer wallets can then attest batch identity, expiry, and evidence on
            Monad Mainnet.
          </p>
          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <a href="#mint-credential" className={buttonStyles("primary", "md")}>
              <IdCard className="h-4 w-4" />
              Issue credential
            </a>
            <a href="#attest-batch" className={buttonStyles("outline", "md")}>
              <BadgePlus className="h-4 w-4" />
              Attest a batch
            </a>
          </div>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-mint/65 px-3 py-2 text-xs font-bold text-forest">
            <ShieldCheck className="h-4 w-4" />
            Non-transferable ERC-721 credential
          </div>
        </div>

        <div className="mt-10 space-y-10">
          <ManufacturerCredentialForm />
          <div id="attest-batch" className="scroll-mt-28">
            <div className="mb-4 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-mint text-ink">
                <BadgePlus className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-teal">
                  Manufacturer action
                </p>
                <h2 className="font-display text-xl font-black tracking-[-0.03em]">
                  Medicine batch attestation
                </h2>
              </div>
            </div>
            <RegisterForm />
          </div>
        </div>
      </div>
    </section>
  );
}
