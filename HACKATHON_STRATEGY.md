# PharmChain hackathon strategy

**Research basis:** Lucas Martinic’s [hackathon lessons](https://x.com/lucas_martinic/status/2105672868335906951) and the current [Build with Gemini XPRIZE project gallery](https://xprize.devpost.com/project-gallery?utm_source=devpost&utm_medium=newsletter&utm_campaign=10012026), reviewed 2026-09-24.

## What the winning projects actually do

| Project | Evidence from its public submission | Winning mechanism |
|---|---|---|
| [Polyfork](https://devpost.com/software/polyfork) | 583 published assets, 295 free models, launch-day revenue, weekly revenue, public API/MCP, and an independent judge agent | A narrow supply-chain gap becomes a real product with a runtime API, measurable usage, and an evaluator that contradicts the builder |
| [TICIAN Cierre](https://devpost.com/software/tician-cierre) | Processes a real eight-part Mexican tax workflow; an AI auditor found real reconciliation defects; 227,000 CFDI were checked | Deterministic arithmetic stays in code while AI judges an independent representation; the product is trusted because it caught bugs |
| [MyFixam](https://devpost.com/software/fixam) | Named Nigerian informal artisans, escrow payment protection, real users and bookings, 10% completed-booking fee, in-person verification | A specific underserved user, a painful money problem, and a complete workflow; assumptions were corrected through field research |
| [DodoPrep](https://devpost.com/software/dodoprep-the-autonomous-learning-os) | Upload-to-personalized-lesson pipeline with RAG, quizzes, flashcards, mind maps, and adaptive progress; reported revenue growth | AI is the product’s operating loop, not a chatbot bolted onto a static site |
| [OpportunityOS](https://devpost.com/software/opportunityos-ikfs5b) | Student profile drives matching, gap analysis, application tracking, and next actions | A persistent user record turns a search tool into an operating system |
| [Barber Copilot](https://devpost.com/software/barber-copilot) | A focused agent fleet performs appointment reminders and retention work while humans retain responsibility and relationships | AI handles repetitive revenue work; the human business remains in control |

## The repeatable pattern

1. **One painful job, named clearly.** Winners do not start with “an AI platform.” They identify a person who is losing money, time, trust, or access.
2. **A complete loop, not a model demo.** Input → decision/action → result is visible inside the product.
3. **AI is load-bearing but bounded.** The model judges, classifies, drafts, or routes. Deterministic code owns arithmetic, permissions, and irreversible actions.
4. **An outside evaluator contradicts the builder.** The most credible projects test outputs against a separate rule set, a real user, or a measurable outcome.
5. **Real adoption beats theoretical reach.** Users, bookings, revenue, transactions, and repeat usage are stronger evidence than a large addressable market slide.
6. **Packaging is part of the product.** Live URL, screenshots, architecture, founder perspective, short demo, and honest limitations are prepared before the deadline.
7. **Scope is narrow enough to perfect.** Small, coherent systems win more often than partially integrated collections of features.

## PharmChain’s winning position

**One sentence:** A regulator number can exist without a verifiable batch; PharmChain makes that gap visible in one scan, then shows the exact product, manufacturer, evidence, and recall signal a buyer can inspect.

The wedge is not “blockchain for medicines.” It is:

> **A number on a pack is not a batch passport.**

The product should always answer three questions in order:

1. Does an official regulator source recognize this product?
2. Has a verified manufacturer attested this exact batch on-chain?
3. Is there a recall or counterfeit signal attached to the batch/product key?

PharmChain must never collapse those answers into a single false “verified” state.

## Current strengths to preserve

- Real Monad Mainnet deployment, public addresses, successful receipts, and Sourcify source verification.
- A real scan/manual-entry flow, not a static landing mock.
- Batch-specific recall and counterfeit demo states with explorer links.
- NAFDAC and US FDA official-source adapters with jurisdiction-aware keys.
- Public IPFS evidence manifest and reproducible seed output.
- Security-first contract behavior, bounded pagination, wallet selection, and honest limitations.

These are stronger than the generic AI-startup presentation pattern. Protect them.

## Gaps to close before submission

### 1. Prove the product with real people

Recruit 3–5 testers from the actual ICP: a pharmacy worker, a medicine consumer, a distributor, and a manufacturer/representative. Give each the same task:

> Scan or enter a product number, decide whether you would trust the pack, and report one confusing or missing thing.

Record:

- time to first useful answer;
- whether the tester understood `VERIFIED`, `RECALLED`, and `COUNTERFEIT`;
- the number of questions that required explanation;
- whether the tester opened the source or explorer link;
- one concrete workflow improvement.

Do not invent testimonials. Quote only testers who actually used the product and retain their consent.

### 2. Complete one revenue- or outcome-shaped loop

The current product proves inspection. Add one narrow action loop rather than more features:

**Scan → inspect → report discrepancy → public evidence trail.**

For a medicine counter or pharmacy:

1. scan a pack;
2. open the passport;
3. report a mismatch or missing record;
4. receive a transaction-linked report ID;
5. let the manufacturer or registry owner validate it;
6. show the updated signal.

Track one metric: **median time from scan to a defensible buy/hold/reject decision.** This is more meaningful than “AI accuracy” without a ground truth.

**Implemented:**

- Every passport CTA hands off to the report form with the key pre-filled (`/report?n=<key>`), and each batch card gets its own **Report this batch** action carrying the batch ID (`/report?n=<key>&batch=<id>`).
- The report form detects where it was opened from and opens the action that reader can actually take: a member of the public gets the counterfeit report; a batch manufacturer or owner gets recall or validation.
- Writes are simulated before the wallet prompt, so a revert is caught before the user signs anything.
- For `flagCounterfeit` the predicted report ID is captured from the simulation, and the confirmation screen offers **Read the stored record back from the chain**, which calls `getCounterfeitReport` and displays the stored reporter, key, and validation state instead of trusting the wallet receipt.
- The confirmation links to the public passport, where the new report appears immediately as *pending*, not as a counterfeit verdict.

Still missing: real tester measurements for the scan-to-decision metric.

### 3. Add an independent evaluator

TICIAN and Polyfork show the value of an outside reviewer. PharmChain’s version can be simpler and domain-specific:

- compare the canonical NRN to the official regulator record;
- compare the product name/form/strength to the submitted batch;
- reject empty evidence hashes and unauthorized attestations;
- flag batch-level recalls as separate from product-level reports;
- return `pass`, `review`, or `fail` with a reason.

Run the evaluator against every seeded record and include its results in the submission. Never let the same code path silently approve its own output.

**Implemented:** `scripts/verify-demo.ts` (`npm run verify:demo`). It re-implements status derivation independently of the frontend, asserts contract invariants from live reads, calls the official adapter, and writes `demo/verify/demo-verification.json`. Current result: 49 passed, 0 failed, 1 advisory.

**It already earned its keep:** the evaluator flagged that `A4-0427` is a genuine NAFDAC registration for Griseo Cream, while our on-chain demo report text describes a paracetamol/Emzor duplicate claim. A judge checking the official source would see a different product than the demo claims. Fix this before submitting by re-keying the scenario to an NRN with no official registration; the contract has no correction path, so the existing validated report stays. See [`SUBMISSION.md`](./SUBMISSION.md).

### 4. Package before polishing features

Prepare these before the deadline:

- 90-second demo video with a real scan and real transaction links;
- one uninterrupted before/after walkthrough;
- founder story: why this problem matters to you;
- screenshots of the actual passport and wallet flow;
- architecture diagram showing deterministic code, official adapters, and on-chain evidence;
- honest limitations page;
- public repository with an OSI-approved license.

The current `VIDEO_DEMO_SCRIPT.md`, `ENGINEERING_JOURNAL.md`, and `SUBMISSION.md` are the raw material. Package them into one judge-facing story rather than adding another feature.

## Recommended execution order

### Now: proof and rehearsal

1. Run the three-state demo on a real phone.
2. Recruit the first tester and capture observed friction.
3. Rehearse the 90-second video with a real wallet and real source links.
4. Fix the `A4-0427` demo-key collision, or disclose it on camera.

### Next: one complete user loop

1. ~~Make the report flow obvious and pre-filled from a passport.~~ Done.
2. ~~Add the report ID and MonadScan link to the confirmation state.~~ Done.
3. Show a public event timeline on the passport. Already present via the bounded transaction explorer; keep the "unavailable" state honest rather than removing it.
4. Measure scan-to-decision time with five testers.

### Last: submission packaging

1. Freeze the wedge; do not add unrelated dashboards.
2. Update README, submission text, and demo video with measured results.
3. Submit at least 12 hours before the deadline.
4. Keep a local backup video and a fallback if the host or RPC is unavailable.

## What not to do

- Do not add “AI-powered” language without a real model-backed action.
- Do not claim regulator certification, physical-package authenticity, or user adoption that has not happened.
- Do not add a chatbot as the product.
- Do not broaden to every country before the two adapters are reliable.
- Do not let a demo-only record masquerade as a regulator-issued batch.
- Do not spend the final day redesigning the landing page.
- Do not leave the demo video, repository license, or tester evidence until the last hour.

## Win test

A judge should be able to understand PharmChain in 30 seconds, open a real passport in one click, inspect a real mainnet transaction, understand who the product is for, and see one measurable outcome without reading the source code.
