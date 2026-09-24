# 90-second mainnet demo script

**Target runtime:** 90 seconds
**Network:** Monad Mainnet (`chainId 143`)
**Mode:** read-only walkthrough after the mainnet seed completes; no new write transaction during the demo

## Status gate

The contracts, frontend, and mainnet seed are complete. This script is runnable after the recorded preflight checks pass; do not record until the live passport, recall, counterfeit state, and explorer links have been opened successfully.

Use the actual deployment URLs already recorded in [`SUBMISSION.md`](./SUBMISSION.md). Add seed transaction links only after they exist in `seed-output.json`; never type an invented address, hash, batch ID, or explorer link.

## Required preflight

- Confirm the live app is configured with the actual `ManufacturerCredential` and `DrugRegistry` addresses from the deployment record.
- Confirm both contracts are on chain `143`, contain expected bytecode, and have matching verified source.
- Confirm the seed completed and `demo/seed/seed-output.json` contains five credentials, sixteen batches, one recall, one validated counterfeit report, and four evidence records.
- Open `/verify/A11-0550`, `/verify/A4-0201`, and `/verify/A11-100025` and verify every expected record before recording.
- Confirm `A4-0201` shows batch `DC.319`, expired and recalled, with the Alert 041/2022 reason.
- Confirm `A11-100025` shows two `DEMO-ML-*` tablet batches plus the validated report details citing falsified suspension batch `ALS063`.
- Keep the official [NAFDAC Alert 05/2025](https://nafdac.gov.ng/public-alert-no-05-2025-alert-on-the-circulation-of-falsified-cikatem-artemether-180mg-lumefantrine-1080mg-with-falsified-nafdac-registration-number-nrn-a11-100025/) open in a second tab. Source accessed 2026-09-24.
- Use actual explorer links **only after deployment**. Addresses and transaction links must come from deployment output or `seed-output.json`, never from this document.

If any check fails, use the fallback below and do not show a mainnet or explorer link.

## Timed narration

| Time | Screen action | Spoken script |
|---|---|---|
| 0:00–0:10 | Hold up a real medicine packet or printed demo packet, then show the landing scanner. | “This paracetamol could be fake. There is no quick way to know.” |
| 0:10–0:25 | Show the packet's NAFDAC number, then show that a number alone does not answer batch, formulation, or recall status. | “The number is printed on the pack, but how do you verify it? You usually don't. Until now.” |
| 0:25–0:40 | Scan the passport QR with the phone and open `/verify/A11-0550`. | “PharmChain turns one scan into a public medicine passport. Every batch, manufacturer credential, and alert is recorded on Monad Mainnet.” |
| 0:40–0:55 | Walk through ACD 500, `DEMO-AC-001`, credential token, expiry, evidence hash, and the actual explorer link if deployment exists. | “This record is signed by the verified manufacturer wallet. The evidence, timestamps, and transaction can be inspected independently.” |
| 0:55–1:10 | Open `/verify/A4-0201` and show `DC.319` with the red `RECALLED — do not use` state. | “The batch is recalled. One scan turns a hidden safety signal into an immediate stop warning.” |
| 1:10–1:25 | Open `/verify/A11-100025`, show the validated counterfeit state, then briefly show the official Cikatem alert. | “The same NRN appears on a different formulation and stated facility. PharmChain catches the mismatch onchain; the exact batch and regulator evidence still matter.” |
| 1:25–1:30 | End on the passport and the actual MonadScan contract link, only if deployment exists. | “PharmChain: trust infrastructure for the drugs that keep us alive. Live on Monad Mainnet.” |

## Realistic mainnet behavior

- The frontend is hardcoded to Monad Mainnet. A wallet on another chain receives a switch request.
- Public reads require configured contract addresses. Missing configuration is not evidence of deployment.
- The verifier first calls `getDrugPassport`, then repeatedly calls `getBatchPage` and `getCounterfeitReportPage` with a bounded limit of 100.
- Seed transactions were recorded after one receipt confirmation. That does not mean the demo should call them `Finalized` or state-root `Verified`.
- RPC or explorer failures can make a valid deployment temporarily unreadable. Never substitute a guessed address or transaction hash.
- “Verified on-chain record” means the returned registry state has no recall, validated counterfeit, pending report, or expired-batch signal. It does not mean NAFDAC-certified or physically authenticated.
- The counterfeit state has precedence over recall/review in the current UI and is not batch-keyed.

## No-deployment fallback

If a live preflight fails, record a research walkthrough using [`RESEARCH.md`](./RESEARCH.md) and the official NAFDAC pages. State: “Contracts, frontend, and seed are live, but this preflight check failed.” Do not show simulated success or a transaction link that was not independently opened.

## Recording guardrails

- Do not connect a wallet or request a signature during the read-only demo.
- Do not expose a private key, seed phrase, IPFS API key, or environment file.
- Do not describe the five seed signer wallets as legally authorized manufacturers without separate evidence.
- Do not call `DEMO-*` identifiers regulator-issued.
- Do not call `A11-100025` a manufacturer licence; it is a product-level NRN.
- Do not describe `DC.319` as a demo batch; it is a regulator-issued lot named in the alert.
- Do not describe the `A11-100025` report as batch-specific; the contract signature has no batch argument.
- Show actual explorer links only after they have been independently resolved on Monad Mainnet.
