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
    <section className="relative">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 sm:pt-16 lg:px-8 lg:pb-20">
        <div className="border-l border-electric/60 pl-5 sm:pl-6">
          <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-electric">
            <IdCard className="h-4 w-4" />
            Form PC-3 · Credential + batch onboarding
          </p>
          <h1 className="mt-3 font-display text-5xl font-extrabold uppercase leading-[0.92] tracking-[-0.02em] text-frost sm:text-6xl">
            Issue trust, then attest medicine batches
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
            Contract owners can issue soulbound manufacturer credentials. Verified
            manufacturer wallets can then attest batch identity, expiry, and evidence on
            Monad Mainnet.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a href="#mint-credential" className={buttonStyles("primary", "md")}>
              <IdCard className="h-4 w-4" />
              Issue credential
            </a>
            <a href="#attest-batch" className={buttonStyles("outline", "md")}>
              <BadgePlus className="h-4 w-4" />
              Attest a batch
            </a>
          </div>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-teal/40 bg-teal/10 px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-teal">
            <ShieldCheck className="h-4 w-4" />
            Non-transferable ERC-721 credential
          </p>
        </div>

        <div className="mt-12 space-y-12">
          <section>
            <div className="mb-5 flex items-center gap-4">
              <span className="head-glow font-display text-5xl font-extrabold leading-none text-electric">01</span>
              <div className="min-w-0 border-l border-white/10 pl-4">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                  Owner action
                </p>
                <h2 className="mt-0.5 font-display text-2xl font-bold uppercase leading-none tracking-[-0.01em] text-frost">
                  Manufacturer credential
                </h2>
              </div>
            </div>
            <ManufacturerCredentialForm />
          </section>
          <section id="attest-batch" className="scroll-mt-32">
            <div className="mb-5 flex items-center gap-4">
              <span className="head-glow font-display text-5xl font-extrabold leading-none text-electric">02</span>
              <div className="min-w-0 border-l border-white/10 pl-4">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                  Manufacturer action
                </p>
                <h2 className="mt-0.5 font-display text-2xl font-bold uppercase leading-none tracking-[-0.01em] text-frost">
                  Medicine batch attestation
                </h2>
              </div>
              <span className="ml-auto hidden h-10 w-10 place-items-center rounded-xl border border-electric/40 bg-electric/10 text-electric sm:grid" aria-hidden="true">
                <BadgePlus className="h-5 w-5" />
              </span>
            </div>
            <RegisterForm />
          </section>
        </div>
      </div>
    </section>
  );
}
