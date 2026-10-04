/**
 * Permanent, in-product disclosures for seeded records that must never be read
 * as a real-world finding.
 *
 * `DrugRegistry` has no correction, appeal, or supersession operation. A report
 * or attestation, once written, cannot be edited or withdrawn. That makes
 * honesty a UI and documentation responsibility rather than an on-chain one:
 * wherever a seeded key collides with a real regulatory record, the product has
 * to say so at the point of reading.
 *
 * This module is intentionally dependency-free so both the Next.js app and the
 * standalone evaluator in `scripts/verify-demo.ts` can read the same registry.
 */
export type DemoDisclosure = {
  /** Registry key the disclosure applies to, compared case-insensitively. */
  nrn: string;
  /** Short label for the banner heading. */
  title: string;
  /** What the official regulator actually lists under this key. */
  officialRecord: string;
  /** Direct link to the official record. */
  officialSourceUrl: string;
  /** What the on-chain demo record claims. */
  onChainRecord: string;
  /** The concrete risk if a reader is not told. */
  risk: string;
  /** How the demo now handles this key. */
  resolution: string;
  /** Date the collision was found, ISO format. */
  recordedAt: string;
};

export const demoDisclosures: Record<string, DemoDisclosure> = {
  "A4-0427": {
    nrn: "A4-0427",
    title: "Demo key on a real registration",
    officialRecord:
      "Griseo Cream, griseofulvin 1% topical cream, La-Lid Pharmaceutical Company Limited, status Active",
    officialSourceUrl: "https://greenbook.nafdac.gov.ng/products/details/99",
    onChainRecord:
      "Counterfeit report #2, which describes Unverified Labs Ltd claiming the same product key as the verified Emzor Nigeria Ltd paracetamol batch under A4-0425",
    risk:
      "The Green Book lists A4-0427 as Griseo Cream. Nothing in this registry concerns Griseo Cream, and PharmChain did not evaluate that product. A reader who assumes the key is real could conclude that PharmChain found this cream to be counterfeit.",
    resolution:
      "This key is retired from the demo path. The counterfeit scenario is presented with A11-100025, which is a real documented case from NAFDAC Alert 05/2025. The report text cannot be edited on-chain because DrugRegistry has no correction or supersession operation.",
    recordedAt: "2026-09-24",
  },
};

function normalizeKey(value: string) {
  return value.trim().toUpperCase();
}

/**
 * Lookups are keyed only by the normalized record key. The disclosure list is
 * intentionally the single source of truth: an entry that is registered but
 * unreachable by lookup would let the evaluator treat a real collision as
 * undisclosed, or vice versa.
 */
export function demoDisclosureFor(nrn: string | undefined): DemoDisclosure | undefined {
  if (!nrn) return undefined;
  return demoDisclosures[normalizeKey(nrn)];
}

export const disclosedDemoKeys = Object.keys(demoDisclosures);