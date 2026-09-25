# PharmChain

PharmChain is a Next.js frontend and Solidity/viem system for public medicine-passport inspection and manufacturer-authorized registry actions on **Monad Mainnet only**.

The implementation contains:

- `ManufacturerCredential`, an owner-issued soulbound ERC-721 manufacturer credential;
- `DrugRegistry`, which stores batches, batch recalls, counterfeit reports, and owner validation;
- bounded pagination for full passport histories;
- a mainnet-guarded Foundry deployment script;
- a strict viem seed script using five funded manufacturer signer keys; and
- a frontend that reads all result pages and builds public QR passport URLs.

## Current status

- **Mainnet contracts are deployed and source-verified** on Monad Mainnet (`chainId 143`); addresses and receipts are recorded in [`SUBMISSION.md`](./SUBMISSION.md).
- **Mainnet seed is complete:** 5 credentials, 16 base batches, 1 active recall, 1 validated counterfeit flag, 4 IPFS PDFs, and 24/24 successful receipts; details are in [`demo/seed/seed-output.json`](./demo/seed/seed-output.json).
- **Approved demo scenarios are live:** [A4-0425 VERIFIED](https://pharmchain.vercel.app/verify/A4-0425), [A4-0426 RECALLED](https://pharmchain.vercel.app/verify/A4-0426), and [A4-0427 COUNTERFEIT FLAG](https://pharmchain.vercel.app/verify/A4-0427); details are in [`demo/seed/demo-scenarios-output.json`](./demo/seed/demo-scenarios-output.json).
- **Live frontend:** https://pharmchain.vercel.app (production deployment `dpl_5F9Nug15PE2jDjBv9C5RLxyxUCnf`).
- The Solidity source, Foundry configuration, deployment script, viem seed script, frontend ABI, and 14 local contract tests are present.
- The official Foundry 1.8.1 executable is installed at `%USERPROFILE%\.foundry\versions\foundry-rs\foundry\v1.8.1\forge.exe`; the default PATH also contains 1.7.1. Use the 1.8.1 executable for Monad execution rules.
- The frontend is hardcoded to Monad chain `143`, public RPC `https://rpc.monad.xyz`, and MonadScan.
- The camera scanner is implemented with `html5-qrcode` and has a manual fallback; a physical iOS/Android camera test was not available in this environment and remains a pre-demo check.
- The frontend does not query NAFDAC or upload evidence. The seed script performs separate IPFS uploads before broadcasting.

See [`SUBMISSION.md`](./SUBMISSION.md) for the exact pending fields, deployment procedure, and seed procedure. See [`RESEARCH.md`](./RESEARCH.md) for official product/alerts and implementation analysis.

## Important data boundary

A NAFDAC Registration Number is a **product-registration identifier**. It is not a manufacturer licence, batch number, expiry date, or proof of physical authenticity.

`scripts/seed.ts` uses real Green Book product NRNs, including:

- ACD 500 — `A11-0550`;
- Acimox — `A4-8982`;
- Artemetrin DS — `A4-3164`;
- AC-Ome 20 — `A4-4958`; and
- Cikagyl 400 — `A11-100255`.

Every batch string beginning with `DEMO-` is a demonstration identifier created by the seed, not a regulator-issued batch number. Seed expiry dates are demonstration fields. `DC.319` is the exception: it is the Me Cure batch named in NAFDAC Alert 041/2022 under NRN `A4-0201`, and the seed uses it to demonstrate historical recall.

## Contract behavior

### `ManufacturerCredential`

The owner can mint one active credential per manufacturer wallet. Credential metadata contains free-text manufacturer name, `nafdacRegistrationNumber`, manufacturing address, wallet, status, and timestamps.

Transfers and approvals revert. Revocation burns the token and removes `isVerified` eligibility. `tokenURI` is empty. The owner is ordinary OpenZeppelin `Ownable`; this is not a two-step or multisig-enforced owner.

### `DrugRegistry`

The credential contract address is immutable. Core writes are:

```solidity
attestBatch(uint256 manufacturerId, string nafdacNumber, string batchNumber, string drugName, uint256 expiryDate, bytes32 evidenceHash)
flagRecall(uint256 batchId, string reason)
flagCounterfeit(string nafdacNumber, string details)
validateCounterfeit(uint256 reportId, bool isCounterfeit)
```

Rules:

- only the active credential wallet matching `manufacturerId` can attest;
- exact NRN + batch string is unique;
- expiry may be historical, enabling expired-batch recall;
- only the batch manufacturer or registry owner can recall;
- recall is one-time and cannot be cleared;
- anyone can submit an NRN-level counterfeit report when unpaused;
- only the registry owner can validate a report once;
- all registry writes stop while the owner has paused the contract; and
- no record has a correction, appeal, or supersession path.

### Pagination

`getDrugPassport` returns complete counts and at most the first 100 batch/report IDs. `getBatchPage` and `getCounterfeitReportPage` expose the complete history:

- `limit == 0` reverts;
- `limit > 100` is capped to 100;
- `nextOffset == 0` marks completion; and
- the frontend follows pages until completion, an empty page, or a non-advancing offset.

### Frontend status precedence

The UI reports:

1. counterfeit if any validated true report exists;
2. recalled if a batch recall exists;
3. review if a report is pending or a loaded batch is expired; or
4. verified when none of those registry signals exists.

“Verified on-chain record” is a registry-state label, not a NAFDAC certification or physical-authenticity guarantee. Counterfeit reports are NRN-level, not batch-level.

## Requirements

- Node.js `20.9.0` or newer
- npm
- an injected browser wallet for owner/manufacturer actions
- Monad Mainnet access and sufficient MON
- official Foundry 1.8 or newer before using Monad execution mode
- a Kubo-compatible IPFS API for the seed
- six funded mainnet wallets for a fresh seed: one deployer/owner and five manufacturer signers

The seed requires at least `0.2 MON` in each of those six wallets before it starts uploading or broadcasting.

## Frontend setup

Install exact Node dependencies:

```powershell
npm ci
```

Create a local `.env.local` with only actual verified public addresses:

```dotenv
NEXT_PUBLIC_DRUG_REGISTRY_ADDRESS=<verified-monad-mainnet-registry-address>
NEXT_PUBLIC_DRUG_REGISTRY_DEPLOYMENT_BLOCK=<verified-deployment-block>
NEXT_PUBLIC_MANUFACTURER_CREDENTIAL_ADDRESS=<verified-monad-mainnet-credential-address>
```

Then run:

```powershell
npm run dev
```

For production, set the addresses before building:

```powershell
npm run build
npm run start
```

Do not place private keys or API keys in `.env.local`, any `NEXT_PUBLIC_*` variable, source control, or a screen recording. `NEXT_PUBLIC_*` values are embedded in the browser bundle.

The current `lib/monad.ts` hardcodes chain `143`, the public RPC, and MonadScan. `NEXT_PUBLIC_DRUG_REGISTRY_DEPLOYMENT_BLOCK` is optional; when supplied, the verify page uses it as the lower bound only if it is within the latest 50,000-block safety window, otherwise it uses the bounded lookback.

## Node commands

```powershell
npm ci
npm run dev
npm run lint
npm run typecheck
npm run build
npm run start
npm run seed
```

The secure PowerShell wrapper prompts for the Pinata JWT without echoing it, loads the restricted generated wallet file, runs the seed, and clears sensitive environment variables afterward:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run-seed-secure.ps1
```

Do not edit `.env.example` with a real JWT. Do not commit `.env.local` or any secret file.

`npm run seed` broadcasts real mainnet transactions. Never use it as a smoke test.

## Mainnet-only Viem/wagmi setup

- `lib/monad.ts` defines only chain `143`.
- `components/providers.tsx` registers only `monadMainnet`.
- Registry and credential writes reject any other connected chain.
- `scripts/seed.ts` uses `monadMainnet` and aborts unless RPC chain ID is `143`.
- `script/Deploy.s.sol` aborts unless `block.chainid == 143`.
- No testnet chain, arbitrary chain ID, or production RPC switch is exposed.

Official network reference: [Monad Mainnet information](https://docs.monad.xyz/developer-essentials/network-information), accessed 2026-09-24.

## Foundry workflow

### Current configuration

`foundry.toml` uses Solidity `0.8.28`, optimizer runs `200`, IR compilation, no bytecode metadata hash, and read access to `./evidence`. It does not set `network = "monad"` so older local binaries can still build the project; use Foundry 1.8.1 with `--network monad` for Monad execution rules.

Do not claim Monad-specific testing until Foundry 1.8+ is used. The official 1.8.1 executable passed the Monad suite in this workspace.

### Local checks

The default PATH binary is 1.7.1, while the official Foundry 1.8.1 binary supports Monad mode:

```powershell
forge test
& "$env:USERPROFILE\.foundry\versions\foundry-rs\foundry\v1.8.1\forge.exe" test --network monad
```

Both suites passed 14 tests in this workspace. Use the explicit 1.8.1 command for deployment simulation and broadcast.

### Deployment

Inject the actual deployer key only into the current process from an approved secret source:

```powershell
$env:PRIVATE_KEY = $env:PHARMCHAIN_DEPLOYER_PRIVATE_KEY
$env:MONAD_RPC_URL = "https://rpc.monad.xyz"
```

Simulate first:

```powershell
$forge = "$env:USERPROFILE\.foundry\versions\foundry-rs\foundry\v1.8.1\forge.exe"
& $forge script script/Deploy.s.sol:Deploy --network monad --rpc-url $env:MONAD_RPC_URL --chain 143
```

Review chain ID, broadcaster, constructor argument, bytecode, and simulation output. Broadcast only after explicit approval:

```powershell
& $forge script script/Deploy.s.sol:Deploy --network monad --rpc-url $env:MONAD_RPC_URL --chain 143 --broadcast
```

Clear the process variable after recording the deployment:

```powershell
Remove-Item Env:PRIVATE_KEY
```

Deployment simulation and broadcast succeeded on Monad Mainnet. The actual addresses, block numbers, transaction hashes, and source-verification jobs are recorded in [`SUBMISSION.md`](./SUBMISSION.md).

### Verification

After actual addresses exist, verify each source through the selected explorer using its own secret-managed API key:

```powershell
forge verify-contract <verified-credential-address> ManufacturerCredential --chain 143 --verifier etherscan --etherscan-api-key <explorer-api-key> --watch
forge verify-contract <verified-registry-address> DrugRegistry --chain 143 --verifier etherscan --etherscan-api-key <explorer-api-key> --watch
```

Never place an actual address or API key in this file. Record the resolved explorer links only in the deployment record after they work.

## Seed procedure and preflight

`scripts/seed.ts` is intentionally strict and not idempotent.

Required variables:

- `DRUG_REGISTRY_ADDRESS`;
- `MANUFACTURER_CREDENTIAL_ADDRESS`;
- `PRIVATE_KEY`;
- `SEED_MANUFACTURER_PRIVATE_KEYS`, exactly five comma-separated unique keys;
- `IPFS_API_URL`;
- optional `IPFS_API_KEY`;
- `PUBLIC_APP_URL`, the approved deployed frontend origin used for real verify URLs;
- optional `SEED_OUTPUT_DIRECTORY`, default `demo/seed`; and
- `SEED_CONFIRM=PHARMCHAIN-MAINNET`.

The five manufacturer keys map in order to A.C. Drugs, Michelle Laboratories, Me Cure, Afrab-Chem, and Fidson. Supplying a funded key does not prove that the named company authorized it.

Automatic preflight:

- chain `143`;
- runtime bytecode at both configured contracts;
- six unique addresses;
- deployer equals credential owner;
- registry points to the configured credential;
- registry has zero batches;
- all five manufacturer wallets lack credentials;
- every wallet has at least `0.2 MON`; and
- four evidence uploads must succeed before the first transaction.

Additional manual preflight:

- use a fresh deployment or confirm the seed preflight's zero-batch and zero-report checks;
- confirm both contracts are unpaused;
- independently confirm corporate authorization for every signer;
- review every NRN, product name, expiry, and `DEMO-*` label;
- review the owner/validator key and pause authority;
- use a durable IPFS pinning and evidence-retention plan; and
- prepare for manual recovery if a run stops midway.

Load secrets from an approved process environment, then run once:

```powershell
$env:DRUG_REGISTRY_ADDRESS = $env:PHARMCHAIN_DRUG_REGISTRY_ADDRESS
$env:MANUFACTURER_CREDENTIAL_ADDRESS = $env:PHARMCHAIN_CREDENTIAL_ADDRESS
$env:SEED_MANUFACTURER_PRIVATE_KEYS = $env:PHARMCHAIN_MANUFACTURER_KEYS_CSV
$env:IPFS_API_URL = $env:PHARMCHAIN_IPFS_API_URL
$env:IPFS_API_KEY = $env:PHARMCHAIN_IPFS_API_KEY
$env:PUBLIC_APP_URL = $env:PHARMCHAIN_APPROVED_APP_URL
$env:SEED_CONFIRM = "PHARMCHAIN-MAINNET"
npm run seed
```

Remove all seed/deployer key variables from the process after completion. The recorded run completed successfully; never rerun it against the same populated registry.

The completed seed wrote:

- five credential mints;
- sixteen batch attestations;
- one `DC.319` recall;
- one `A11-100025` counterfeit report and one owner validation;
- four IPFS evidence records; and
- `seed-output.json` plus QR SVGs in the selected output directory.

That is 24 mainnet transactions. The script waits for one receipt confirmation per transaction, not Monad `Finalized` or state-root `Verified` finality.

## IPFS evidence

The seed downloads four official NAFDAC PDFs, computes Ethereum `keccak256(bytes)`, and uploads them through either a Kubo-compatible `/api/v0/add?pin=true` endpoint or Pinata's authenticated `/pinning/pinFileToIPFS` endpoint before any seed transaction.

The output records the source URL, filename, `keccak256` digest, CID, and a public gateway URL. The field is explicitly named for the algorithm used.

Operational requirements:

- an authenticated, durable IPFS API;
- privacy review before upload;
- independent retrieval testing after upload;
- documented retention and pin-recovery procedures;
- secure handling of `IPFS_API_KEY`; and
- preservation of exact source captures and review metadata.

A pin request and successful HTTP response are not proof that a CID is durable. The script does not re-fetch each object before broadcasting. The general recall guideline hash attached to `DC.319` is not the hash of Alert 041/2022 itself.

## Deployment safety

Before broadcasting:

- upgrade to Foundry 1.8+ and pass the Monad test profile;
- review all 14 tests and add missing adversarial/mainnet-fork cases;
- obtain an independent contract audit;
- use a hardware wallet or multisig policy for owner operations;
- decide how both single `Ownable` owners will be governed;
- verify compiler settings, bytecode, constructor argument, source, and both owners;
- fund only the required deployment amount while retaining operational MON;
- configure monitoring and incident contacts;
- confirm pause procedures and document that pause does not remove incorrect state; and
- distinguish one-receipt success from Monad `Finalized` and `Verified` finality.

Before seeding:

- use a fresh registry or manually confirm zero reports;
- verify entity authorization for all five signers;
- label every `DEMO-*` batch visibly;
- review the NRN-level Cikatem signal and its effect on all batches under the key;
- treat credential metadata as owner assertions, not regulator verification;
- avoid personal or medical data in public reports/evidence; and
- do not rely on an IPFS gateway alone for preservation.

## Official regulatory references

All accessed 2026-09-24:

- [NAFDAC Green Book](https://greenbook.nafdac.gov.ng/)
- [A.C. Drugs products](https://greenbook.nafdac.gov.ng/applicant/products/355)
- [Michelle Laboratories products](https://greenbook.nafdac.gov.ng/applicant/products/229)
- [Alert 041/2022 — dexamethasone](https://nafdac.gov.ng/public-alert-no-041-2022-recall-of-substandard-dexamethasone-products-detected-in-anambra-state-nigeria/)
- [Alert 05/2025 — Cikatem](https://nafdac.gov.ng/public-alert-no-05-2025-alert-on-the-circulation-of-falsified-cikatem-artemether-180mg-lumefantrine-1080mg-with-falsified-nafdac-registration-number-nrn-a11-100025/)
- [NAFDAC Guidelines](https://nafdac.gov.ng/regulatory-resources/guidelines/)
- [Monad Mainnet information](https://docs.monad.xyz/developer-essentials/network-information)
- [Monad Foundry guidance](https://docs.monad.xyz/tooling-and-infra/toolkits/foundry)

## Troubleshooting

- **No passport:** verify the exact NRN string, configured registry, chain `143`, and completed seed. A valid Green Book NRN does not imply an on-chain record.
- **Read pages fail:** check the configured registry and RPC; do not change to an unverified address.
- **Credential mint disabled:** verify the credential address, connected owner, chain, and pause state.
- **Attestation reverts:** verify the wallet's active token ID and exact NRN/batch uniqueness.
- **Recall reverts:** only the recorded manufacturer wallet or registry owner may recall an existing batch.
- **Validation reverts:** only the registry owner may validate, and a report can be validated once.
- **Seed aborts before IPFS:** an explicit confirmation, six keys, five unique manufacturer keys, contracts, ownership, empty-batch, credential, or balance preflight failed.
- **Seed aborts during IPFS:** `IPFS_API_URL`, download, upload, or CID response failed; no transaction was intended to start.
- **Partial seed:** inspect chain state manually. Do not rerun blindly; preconditions may have changed.
- **Foundry default rejects Monad:** use the official 1.8.1 executable shown above; the older PATH binary is not Monad-aware.
