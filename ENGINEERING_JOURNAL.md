# PharmChain engineering journal

This journal records the decisions that shaped PharmChain. It is intentionally factual: it documents what was tested, what changed, and what remains unfinished. It is not a reconstruction of a fake development struggle.

## The problem that started the build

A real NAFDAC product record can exist without having a PharmChain passport. `04-2531` is the concrete example that exposed the gap: the official NAFDAC Green Book identifies Dizpharm Paracetamol, while the on-chain registry correctly returned no batch record. A lookup tool that only says “not found” hides that distinction.

PharmChain therefore separates two questions:

1. Does an official regulator source have a product record?
2. Has a verified manufacturer attested a specific batch on-chain?

A product record is never promoted to `VERIFIED` unless the on-chain registry contains the batch record.

## Decisions and trade-offs

### NAFDAC data is not a manufacturer licence

The research pass established that an NRN is a product-level identifier. The same identifier can be copied onto another formulation, as shown by the Cikatem alert. The original contract therefore stores the NRN as an opaque key and keeps the manufacturer wallet, batch, expiry, and evidence commitment as separate fields.

### Recalls must be batch-specific

The contract accepts historical, nonzero expiry timestamps so an expired batch can still be recorded and recalled. The seeded `DC.319` record demonstrates why a molecule-wide “this product is unsafe” message would be unsafe. The UI shows the batch and the recall reason.

### The counterfeit layer is NRN-level

The deployed `flagCounterfeit` function accepts an NRN and details, not a batch ID. That limitation is visible in the product and is documented rather than hidden. A report can affect every batch displayed under that key, so the UI presents the report as a registry signal, not a physical authentication result.

### Mainnet credibility came before feature breadth

The deployment was guarded to Monad chain `143`, the source was verified through MonadVision Sourcify, the registry and credential addresses are public, and the seed records are reproducible in `demo/seed/seed-output.json`. The project does not use testnet data to imply a mainnet result.

### The UI had to earn trust

The first landing page was functionally correct but too generic. It was replaced with a proof-ledger layout: real product records, real state examples, live contract links, and explicit “not yet on-chain” boundaries. The wallet selector was also changed from “connect the first detected provider” to an explicit list with connector-provided logos.

## What is verified

- `ManufacturerCredential` is a non-transferable ERC-721 credential. Transfers and approvals revert.
- `DrugRegistry` gates attestation on an active credential and records batch recalls and counterfeit reports.
- Foundry tests cover minting, soulbound behavior, revocation, authorization, duplicate protection, pause behavior, historical recalls, and report validation.
- The live Vercel app reads the Monad registry and falls back to official NAFDAC and US FDA product adapters.
- The seeded mainnet records are independently checked through the deployed contract, not just through screenshots.

## What is not finished

- The contracts use a single ordinary owner rather than a two-step owner or enforced multisig.
- There is no correction, appeal, or supersession path for an incorrect attestation.
- Product adapters prove that an official record exists; they do not prove that a physical package is genuine.
- The camera path has not been tested on a physical iOS or Android handset in this environment.
- Monad receipt success is not the same as Monad `Finalized` or state-root `Verified` finality.
- The current product adapters are Nigeria and the United States. “Global-ready” means the adapter boundary is extensible, not that every regulator is covered today.

## What I would do next

1. Add a signed supersession path for disputed attestations.
2. Move privileged operations to a multisig and document the incident process.
3. Add a second live manufacturer credential flow with an authorized organization reviewer.
4. Test the QR flow on low-end Android devices and offline/poor-network conditions.
5. Add a second official regulator adapter only after its terms, provenance, and update cadence are documented.
