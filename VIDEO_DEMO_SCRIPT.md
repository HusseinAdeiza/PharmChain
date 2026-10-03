# PharmChain 90-second video demo script

**Format:** 1080p screen recording, 16:9, browser zoom 100%, no personal addresses visible longer than necessary.

The script follows one judge path: **verified → recalled → counterfeit → official fallback → report → proof**. Do not wander. If a step fails, skip to the next row; never narrate a demo record as regulator-certified.

## Pre-record

- Open `https://pharmchain.vercel.app/` in a clean browser window.
- Have a browser wallet funded and unlocked on Monad Mainnet.
- Confirm `https://pharmchain.vercel.app/report?n=A4-0425` opens with the key pre-filled.
- Run `npm run verify:demo` once before recording and keep the terminal output for the proof row.
- Do not narrate the demo records as regulator-certified products.

## Recording

| Time | Screen action | Narration |
|---|---|---|
| 0:00–0:08 | Show a medicine packet or printed demo pack, then the landing page. | “A number printed on a medicine pack is not enough. The same number can be copied, attached to the wrong formulation, or recalled after it reaches the shelf.” |
| 0:08–0:14 | Click **Check a product number**, type `A4-0425`, submit. | “PharmChain starts with the one job that matters: check this product before it reaches a patient.” |
| 0:14–0:24 | Show the VERIFIED stamp, paracetamol batch, manufacturer label, credential token, and pinned evidence link. | “A seeded demonstration passport: paracetamol, Emzor Nigeria Ltd, with a real contract-backed batch record and pinned evidence. The demo label is intentional.” |
| 0:24–0:32 | Open `https://pharmchain.vercel.app/verify/A4-0426`. Point at the RECALLED stamp and batch `DEMO-FIDSON-0426`, then its MonadScan link. | “The same scan catches one specific recalled batch. The record names the batch, the reason, the wallet, and the transaction on Monad Mainnet.” |
| 0:32–0:42 | Open `https://pharmchain.vercel.app/verify/A11-100025`. Show the validated counterfeit report. | “This is a real case. NAFDAC Alert 05/2025 caught a falsified suspension carrying a tablet's registration number. The registry holds that NRN, the tablet batches, and the validated report separately.” |
| 0:42–0:50 | Open `https://pharmchain.vercel.app/verify/04-2531`. Show “Product found · not yet on-chain”. | “For a real number not yet on PharmChain, we check the official Nigerian product record and say so plainly instead of faking a verification.” |
| 0:50–0:56 | Switch the registry selector and open the US FDA NDC result. | “The same interface is jurisdiction-aware, with the source and the same non-verification boundary.” |
| 0:56–1:10 | Back on the passport, click **Report this batch**. The form opens pre-filled with the key and batch. Submit the report, then in the confirmation click **Read the stored record back from the chain**. | “This closes the loop. The report form opens already filled with the exact batch I was inspecting. I submit it on-chain, and instead of trusting my own wallet confirmation, PharmChain reads the stored record back from the registry so I can see the reporter, the key, and the pending validation state.” |
| 1:10–1:20 | Show the evaluator terminal output. | “I do not ask you to trust the interface either. Forty-nine independent checks re-derive these numbers from Monad Mainnet, and the run writes its own evidence file.” |
| 1:20–1:30 | End on the passport and the GitHub link. | “PharmChain: one scan, one public record, one way to report what should not be ignored. Source and deployment are open.” |

## If the wallet step fails

Record the read-only path (0:00–0:56), then state plainly: “The reporting action needs a funded Monad wallet. The form pre-fills either way, and the same registry write is reproducible from the seed script.” Do not fake a transaction.

## If the RPC or explorer is unavailable

Show the official NAFDAC fallback row, then say: “The chain read is rate-limited right now. PharmChain tells you the lookup failed instead of rendering an empty verified state.”

## Exact links to keep open

- App: `https://pharmchain.vercel.app/`
- Verified demo: `https://pharmchain.vercel.app/verify/A4-0425`
- Recalled demo: `https://pharmchain.vercel.app/verify/A4-0426`
- Real counterfeit case: `https://pharmchain.vercel.app/verify/A11-100025`
- Official product fallback: `https://pharmchain.vercel.app/verify/04-2531`
- US FDA adapter: `https://pharmchain.vercel.app/verify/fda-ndc%3AUS%3A50580-590`
- Report loop, pre-filled: `https://pharmchain.vercel.app/report?n=A4-0425&batch=17`
- Evaluator evidence: `demo/verify/demo-verification.json`
- Source: `https://github.com/HusseinAdeiza/PharmChain`

## Do not show

- `A4-0427` as a counterfeit example. Its demo narrative contradicts the real NAFDAC registration under that key; see `SUBMISSION.md`.
- Any claim of regulator certification, physical-package authentication, user count, revenue, or clinical outcome.
- The wallet seed phrase or any private key.
