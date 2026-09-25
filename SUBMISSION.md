# PharmChain submission status

**Status date:** 2026-09-24
**Target:** Monad Mainnet (`chainId 143`)
**Deployment status:** **BROADCAST SUCCESS**
**Seed status:** **BROADCAST SUCCESS**
**Live application:** https://pharmchain.vercel.app

Contracts are deployed and source-verified on Monad Mainnet (`chainId 143`), the frontend is live, and the mainnet seed completed with 24 successful transactions. IPFS evidence was independently retrieved from the Pinata gateway; durability beyond the provider's pin service is not independently proven.

All addresses, transaction hashes, block numbers, and CIDs below were returned by actual mainnet tooling or public gateways.

## Pending fields

| Field | Current value |
|---|---|
| Foundry 1.8+ installation | AVAILABLE at `%USERPROFILE%\.foundry\versions\foundry-rs\foundry\v1.8.1\forge.exe`; default PATH binary is 1.7.1 |
| Deployer/owner private credential | Generated and used from a restricted local secret store; never displayed or committed |
| Manufacturer signer private-key CSV | Generated and funded at 0.5 MON each; never displayed or committed |
| `ManufacturerCredential` address | `0xb1B2b43dBb26C12b25e3eBd85418830413c55B0A` |
| `DrugRegistry` address | `0x0f784017793776A8D6537F827421696077aDb396` |
| `NEXT_PUBLIC_DRUG_REGISTRY_DEPLOYMENT_BLOCK` | `107581226` (block `0x6698f2a`) |
| Deployer address | `0xf8bbf36018301cdff0B88A0f390350519c887bC9` |
| Credential owner address | `0xf8bbf36018301cdff0B88A0f390350519c887bC9` |
| Registry owner address | `0xf8bbf36018301cdff0B88A0f390350519c887bC9` |
| Credential deployment transaction hash | `0xf7943a36578780fe38e18ceaf1bc93e1084236f9516ff9e6f5af6354c568b2fa` |
| Registry deployment transaction hash | `0x1178d7b1d3bdab714de2c08ee44d5b9db5e1d233526abc4dce1d8a7954cd8bcb` |
| Deployment block numbers | Credential `107581223` (`0x6698f27`); registry `107581226` (`0x6698f2a`) |
| Deployed runtime bytecode comparison | Present and independently queried on Monad Mainnet |
| Credential source verification result | VERIFIED via MonadVision Sourcify; job `e9fd87e3-4aac-45d8-a56f-06dad36cf3d6` |
| Registry source verification result | VERIFIED via MonadVision Sourcify; job `0c5fa6f3-3044-4705-bff1-171ffa4c0914` |
| MonadScan credential address URL | https://monadscan.com/address/0xb1B2b43dBb26C12b25e3eBd85418830413c55B0A |
| MonadScan registry address URL | https://monadscan.com/address/0x0f784017793776A8D6537F827421696077aDb396 |
| IPFS API URL | Pinata endpoint `https://api.pinata.cloud` |
| IPFS pin results and CIDs | 4 PDFs; CIDs recorded in `demo/seed/seed-output.json`; all returned HTTP 200 from the Pinata gateway |
| IPFS evidence digests | Four Keccak-256 values recorded in `demo/seed/seed-output.json` |
| Five credential token IDs | `1, 2, 3, 4, 5` |
| Sixteen registry batch IDs | `1` through `16` |
| `DC.319` recall transaction hash | `0x4e70b71e6f03de7c3dd1080b1de95bbab9aab22744b0fe1531b250269adb253e` |
| `A11-100025` report transaction hash | `0xfa88d6e86676bde6f13a7fca6b173691f5c4b5cbfc852d9056248e810a8a0797` |
| `A11-100025` validation transaction hash | `0x3f54e6cf91bfa74197a60e09d59150e874fd99f1d663d830a35ed5a9c0a73af0` |
| Counterfeit report ID | `1` |
| `seed-output.json` path | `demo/seed/seed-output.json` |
| QR SVG output path | `demo/seed/*.svg` (11 passport QR files) |
| Approved public application URL | https://pharmchain.vercel.app |
| Vercel production deployment | `dpl_B1ERYEZihZMF1XNj1Gi6Z7ro8c3z` |
| Receipt confirmation record | 24/24 seed transactions returned successful receipts |
| Monad `Finalized` record | PENDING |
| Monad `Verified` state-root record | PENDING |

## Mainnet deployment record

- Credential deployment: [MonadScan transaction](https://monadscan.com/tx/0xf7943a36578780fe38e18ceaf1bc93e1084236f9516ff9e6f5af6354c568b2fa), block `107581223`.
- Registry deployment: [MonadScan transaction](https://monadscan.com/tx/0x1178d7b1d3bdab714de2c08ee44d5b9db5e1d233526abc4dce1d8a7954cd8bcb), block `107581226`.
- Credential source: [MonadVision Sourcify job](https://sourcify-api-monad.blockvision.org/verify-ui/jobs/e9fd87e3-4aac-45d8-a56f-06dad36cf3d6), exact creation/runtime match.
- Registry source: [MonadVision Sourcify job](https://sourcify-api-monad.blockvision.org/verify-ui/jobs/0c5fa6f3-3044-4705-bff1-171ffa4c0914), exact creation/runtime match.

### Manufacturer funding transfers

- A.C. Drugs: [MonadScan transaction](https://monadscan.com/tx/0x290f956723a217a434cd3c3247a1adde5ff6f22bd442026ac9da104c5a3afd14)
- Michelle: [MonadScan transaction](https://monadscan.com/tx/0x8df17fda65db1235fbf9390a218660cf724b7f72c450b1aa0183a956d01b7347)
- Me Cure: [MonadScan transaction](https://monadscan.com/tx/0x1f57fb40d65d602793e41f3ddfdb93f2532816d67ff7bbab156031bcab25b989)
- Afrab-Chem: [MonadScan transaction](https://monadscan.com/tx/0x60662bac89abf69b54a97969cb2d1256f8d57918cd1b86df3d5b1bb15e1cda83)
- Fidson: [MonadScan transaction](https://monadscan.com/tx/0x666b2a28c10c0729f904689aec730d356fc906fa961b57b8cc8df84137546004)

## Frontend deployment record

- Production URL: https://pharmchain.vercel.app
- Vercel deployment: `dpl_B1ERYEZihZMF1XNj1Gi6Z7ro8c3z`
- Public route checks: `/`, `/register`, `/report`, and `/verify/A11-0550` returned HTTP 200.
- The deployed frontend is configured for the verified registry and credential addresses above.

## Mainnet seed record

- Credentials minted: 5 (`1`–`5`).
- Batches attested: 16 (`1`–`16`).
- Active recalls: 1, batch `DC.319` under NRN `A4-0201`.
- Validated counterfeit flags: 1, report `1` under NRN `A11-100025`.
- Evidence PDFs pinned: 4; all four returned HTTP 200 from `https://gateway.pinata.cloud/ipfs/<cid>` during verification.
- Evidence CIDs: [registration guideline](https://gateway.pinata.cloud/ipfs/QmcLDTzmLU8rdBkEChr9kt7SCk7fL2G3L82ptLzkptfK1m), [recall guideline](https://gateway.pinata.cloud/ipfs/QmTrfPpNnjcx2KGT8kJxRwVm19wRiCCU9eVvQHZvVjxTzC), [GMP guideline](https://gateway.pinata.cloud/ipfs/QmSg5KNxBDzzBNx2jicLXRYzrBadkt9DRRen1wVkwJozPo), [label guidance](https://gateway.pinata.cloud/ipfs/QmQbzc1uaKKxyWy4Webh6PderNuXF6u9m59ehepVnpkJmS).
- Receipts: 24/24 successful (`5` mints + `16` attestations + recall + report + validation).
- Passport URLs: [A11-0550](https://pharmchain.vercel.app/verify/A11-0550), [A4-0201](https://pharmchain.vercel.app/verify/A4-0201), [A11-100025](https://pharmchain.vercel.app/verify/A11-100025).
- Full transaction list, all batch fields, hashes, evidence digests, and QR output paths: [`demo/seed/seed-output.json`](./demo/seed/seed-output.json).

## Implemented in this repository

- Solidity `ManufacturerCredential` with owner-only mint/revoke/pause and soulbound ERC-721 behavior.
- Solidity `DrugRegistry` with credential-gated batch attestation, historical batch recall, NRN-level counterfeit reports, owner validation, pause support, and bounded pagination.
- Foundry configuration, OpenZeppelin 5.4.0, forge-std 1.9.7, deployment script, and fourteen local tests.
- Mainnet-guarded Foundry script that reverts unless chain ID is `143`.
- Viem/wagmi frontend restricted to Monad Mainnet.
- Frontend ABIs matching the current contract structs and function signatures.
- Full-page traversal through `getBatchPage` and `getCounterfeitReportPage` with a maximum page size of 100.
- Viem seed script requiring one owner/deployer and exactly five unique funded manufacturer signer keys.
- Seed-time download, Keccak-256 digest, and pinned IPFS upload of four official NAFDAC guidance PDFs before any seed transaction.
- Sixteen seed batches, one historical `DC.319` recall, one `A11-100025` counterfeit report, and one owner validation.
- Public passport QR generation and local seed output.

## Contract interface

### `ManufacturerCredential`

```solidity
constructor()

mint(address manufacturer, string manufacturerName, string nafdacRegistrationNumber, string manufacturingAddress)
    returns (uint256 tokenId)

revoke(uint256 tokenId)
pause()
unpause()

isVerified(address manufacturer) view returns (bool)
manufacturerOf(uint256 tokenId) view returns (address)
getCredential(uint256 tokenId) view returns (Credential)
```

Transfers and approvals revert. Revocation burns the token. Credential metadata is owner-entered text and is not regulator-verified.

### `DrugRegistry`

```solidity
constructor(address credentialAddress)

attestBatch(
    uint256 manufacturerId,
    string nafdacNumber,
    string batchNumber,
    string drugName,
    uint256 expiryDate,
    bytes32 evidenceHash
) returns (uint256 batchId)

flagRecall(uint256 batchId, string reason)
flagCounterfeit(string nafdacNumber, string details) returns (uint256 reportId)
validateCounterfeit(uint256 reportId, bool isCounterfeit)
pause()
unpause()

getDrugPassport(string nafdacNumber)
    view returns (Passport memory passport, uint256[] memory batchIds, uint256[] memory reportIds)

getBatch(uint256 batchId) view returns (Batch memory)
getCounterfeitReport(uint256 reportId) view returns (CounterfeitReport memory)
getBatchPage(string nafdacNumber, uint256 offset, uint256 limit)
    view returns (Batch[] memory page, uint256 nextOffset)
getCounterfeitReportPage(string nafdacNumber, uint256 offset, uint256 limit)
    view returns (CounterfeitReport[] memory page, uint256 nextOffset)
getBatchId(string nafdacNumber, string batchNumber) view returns (uint256)
getTotalBatches() view returns (uint256)
getTotalCounterfeitReports() view returns (uint256)
```

A nonzero historical expiry is accepted so `DC.319` can be recorded and recalled. Batch recall is one-time. Counterfeit reporting and validation are NRN-level, not batch-level. There is no correction or supersession operation.

## Official examples used

All sources accessed 2026-09-24.

| Item | Official fact | Source |
|---|---|---|
| A.C. Drugs ACD 500 | NRN `A11-0550`; paracetamol 500 mg tablet; oral; Green Book status Active at access date | [Green Book](https://greenbook.nafdac.gov.ng/products/details/6649) |
| A.C. Drugs Acimox | NRN `A4-8982`; amoxicillin 500 mg capsule; oral; Green Book status Active at access date | [Green Book](https://greenbook.nafdac.gov.ng/products/details/6678) |
| A.C. Drugs Artemetrin DS | NRN `A4-3164`; artemether/lumefantrine 80/480 mg tablet; oral; Green Book status Active at access date | [Green Book](https://greenbook.nafdac.gov.ng/products/details/7256) |
| A.C. Drugs AC-Ome 20 | NRN `A4-4958`; omeprazole 20 mg capsule; oral; Green Book status Active at access date | [Green Book](https://greenbook.nafdac.gov.ng/products/details/6662) |
| Michelle Laboratories Cikagyl 400 | NRN `A11-100255`; metronidazole 400 mg tablet; oral; Green Book status Active at access date | [Green Book](https://greenbook.nafdac.gov.ng/products/details/64) |
| Me Cure Dexamethasone | NRN `A4-0201`; Alert 041/2022 batch `DC.319`; manufacture 06/2021; expiry 05/2024; assay 88.6% | [Alert 041/2022](https://nafdac.gov.ng/public-alert-no-041-2022-recall-of-substandard-dexamethasone-products-detected-in-anambra-state-nigeria/) |
| Falsified Cikatem suspension | NRN printed `A11-100025`; batch `ALS063`; manufacture 10/2024; expiry 09/2027; alert says NRN belongs to tablet 20/120 mg | [Alert 05/2025](https://nafdac.gov.ng/public-alert-no-05-2025-alert-on-the-circulation-of-falsified-cikatem-artemether-180mg-lumefantrine-1080mg-with-falsified-nafdac-registration-number-nrn-a11-100025/) |

NRNs are product-level. The seed credential metadata values `A11-0550` and `A11-100255` are therefore not manufacturer licences. Every `DEMO-*` batch number in the seed is demonstration-only. `ALS063` is not a seed batch. `DC.319` is the only seed batch identifier taken from the selected regulatory alerts.

## Local verification completed

No deployment credentials were needed for these checks:

| Check | Result |
|---|---|
| `npm run lint` | Passed |
| `npm run typecheck -- --incremental false` | Passed |
| `forge test` | 14 passed, 0 failed |
| `& "$env:USERPROFILE\.foundry\versions\foundry-rs\foundry\v1.8.1\forge.exe" test --network monad` | Passed 14/14 with official Foundry 1.8.1 |
| Mainnet deployment simulation | Passed on chain 143 with estimated cost 1.004866372 MON |
| Mainnet deployment | SUCCESS; credential and registry receipts status `0x1` |
| Source verification | SUCCESS via MonadVision Sourcify; exact creation/runtime matches |
| IPFS upload | SUCCESS; 4 CIDs returned HTTP 200 from the Pinata gateway |
| Mainnet seed | SUCCESS; 24/24 receipts successful; on-chain totals are 16 batches and 1 report |
| Frontend deployment | SUCCESS; Vercel production deployment is ready and public |

The fourteen passing tests cover core mint/revoke/soulbound behavior, credential-gated attestation, recall authority, owner validation, duplicate rejection, pause, historical batch recording, and revoked-credential rejection. They are not an external audit; the Monad-mode run uses the official 1.8.1 executable but is not a mainnet fork test.

## Exact deployment procedure

The deployment and seed procedures were executed against Monad Mainnet and are recorded above. Future reruns remain single-use; do not rerun after any partial state.

### 1. Toolchain and local verification

Install official Foundry 1.8 or newer, then confirm:

```powershell
forge --version
npm ci
npm run lint
npm run typecheck
& "$env:USERPROFILE\.foundry\versions\foundry-rs\foundry\v1.8.1\forge.exe" test --network monad
```

Use the official Foundry 1.8.1 executable for Monad mode. The default PATH binary is 1.7.1 and cannot select Monad execution rules.

### 2. Inject the deployment credential

Load the actual deployer key from the approved secret manager into the process environment. Do not write it to a file in the repository.

```powershell
$env:PRIVATE_KEY = $env:PHARMCHAIN_DEPLOYER_PRIVATE_KEY
$env:MONAD_RPC_URL = "https://rpc.monad.xyz"
```

Before proceeding, independently confirm that the target RPC returns chain ID `143`:

```powershell
cast chain-id --rpc-url $env:MONAD_RPC_URL
```

Require exact output `143`.

### 3. Simulate deployment

```powershell
$forge = "$env:USERPROFILE\.foundry\versions\foundry-rs\foundry\v1.8.1\forge.exe"
& $forge script script/Deploy.s.sol:Deploy --network monad --rpc-url $env:MONAD_RPC_URL --chain 143
```

Review:

- source commit and compiler settings;
- broadcaster is the intended owner/deployer;
- constructor receives the new credential address;
- bytecode size and simulation succeed;
- no testnet chain is selected; and
- no private key appears in output intended for publication.

### 4. Broadcast only after approval

```powershell
& $forge script script/Deploy.s.sol:Deploy --network monad --rpc-url $env:MONAD_RPC_URL --chain 143 --broadcast
```

Record the actual credential and registry addresses, transaction hashes, block numbers, deployer, compiler output, and receipt statuses in the pending fields above.

Load the two recorded addresses into process variables before inspecting them:

```powershell
$env:PHARMCHAIN_CREDENTIAL_ADDRESS = $env:RECORDED_CREDENTIAL_ADDRESS
$env:PHARMCHAIN_DRUG_REGISTRY_ADDRESS = $env:RECORDED_DRUG_REGISTRY_ADDRESS
```

Immediately resolve both addresses independently and compare runtime bytecode:

```powershell
cast code $env:PHARMCHAIN_CREDENTIAL_ADDRESS --rpc-url $env:MONAD_RPC_URL
cast code $env:PHARMCHAIN_DRUG_REGISTRY_ADDRESS --rpc-url $env:MONAD_RPC_URL
```

Do not hard-code or invent the recorded address variables.

### 5. Verify source

Use an explorer credential from secret management:

```powershell
forge verify-contract $env:PHARMCHAIN_CREDENTIAL_ADDRESS ManufacturerCredential --chain 143 --verifier etherscan --etherscan-api-key $env:PHARMCHAIN_EXPLORER_API_KEY --watch
forge verify-contract $env:PHARMCHAIN_DRUG_REGISTRY_ADDRESS DrugRegistry --chain 143 --verifier etherscan --etherscan-api-key $env:PHARMCHAIN_EXPLORER_API_KEY --watch
```

A successful submission is not necessarily immediate explorer verification. Record the independently observed final status.

### 6. Configure the frontend

Set actual verified addresses before build:

```powershell
$env:NEXT_PUBLIC_DRUG_REGISTRY_ADDRESS = $env:PHARMCHAIN_DRUG_REGISTRY_ADDRESS
$env:NEXT_PUBLIC_MANUFACTURER_CREDENTIAL_ADDRESS = $env:PHARMCHAIN_CREDENTIAL_ADDRESS
$env:NEXT_PUBLIC_DRUG_REGISTRY_DEPLOYMENT_BLOCK = $env:RECORDED_REGISTRY_DEPLOYMENT_BLOCK
npm run build
```

The production app is already deployed at `https://pharmchain.vercel.app`; for future deployments, rebuild only after setting the actual verified addresses and deployment block.

### 7. Clear deployment secrets

```powershell
Remove-Item Env:PRIVATE_KEY
Remove-Item Env:PHARMCHAIN_EXPLORER_API_KEY
```

## Exact seed procedure

This procedure was executed once and is intentionally single-use. Do not rerun it against the populated registry.

### 1. Required funded wallets

Prepare six unique funded wallets:

1. one deployer that is the `ManufacturerCredential` owner;
2. A.C. Drugs demonstration signer;
3. Michelle Laboratories demonstration signer;
4. Me Cure demonstration signer;
5. Afrab-Chem demonstration signer; and
6. Fidson demonstration signer.

Each wallet must have at least `0.2 MON` when checked by the script. A funded key does not prove legal-entity authorization; obtain that authorization separately.

### 2. Required environment

Load actual deployed addresses, five keys, and IPFS credentials from approved secret storage:

```powershell
$env:DRUG_REGISTRY_ADDRESS = $env:PHARMCHAIN_DRUG_REGISTRY_ADDRESS
$env:MANUFACTURER_CREDENTIAL_ADDRESS = $env:PHARMCHAIN_CREDENTIAL_ADDRESS
$env:PRIVATE_KEY = $env:PHARMCHAIN_DEPLOYER_PRIVATE_KEY
$env:SEED_MANUFACTURER_PRIVATE_KEYS = $env:PHARMCHAIN_MANUFACTURER_KEYS_CSV
$env:MONAD_RPC_URL = "https://rpc.monad.xyz"
$env:IPFS_API_URL = $env:PHARMCHAIN_IPFS_API_URL
$env:IPFS_API_KEY = $env:PHARMCHAIN_IPFS_API_KEY
$env:PUBLIC_APP_URL = $env:PHARMCHAIN_APPROVED_APP_URL
$env:SEED_OUTPUT_DIRECTORY = "demo/seed"
$env:SEED_CONFIRM = "PHARMCHAIN-MAINNET"
```

`SEED_MANUFACTURER_PRIVATE_KEYS` must be exactly five comma-separated unique private keys in the order listed above. Never place that value in a committed file.

### 3. Manual preflight

Before running the script, confirm independently:

- both contracts are verified and unpaused on chain `143`;
- the deployer is the credential owner;
- the registry points to the credential contract;
- `getTotalBatches() == 0` and `getTotalCounterfeitReports() == 0`;
- none of the five manufacturer wallets has a credential;
- all six addresses are unique and funded;
- corporate authorization exists for all five signer identities;
- all sixteen NRN/product mappings and expiry values are reviewed;
- every `DEMO-*` identifier is visibly labeled as demo-only;
- `DC.319` is recognized as the historical alert batch, not a demo label;
- the `A11-100025` report is understood as NRN-level and `ALS063` is not being attested;
- the owner/validator credential is approved;
- IPFS retention and privacy controls are ready; and
- incident/manual-resume procedures are understood.

### 4. IPFS-before-broadcast behavior

The script performs these evidence operations before the first transaction:

1. downloads four official NAFDAC PDFs;
2. computes each PDF's Ethereum Keccak-256 digest;
3. uploads each file through a Kubo or Pinata IPFS pinning endpoint;
4. requires a CID in every response; and
5. aborts if any download, upload, or CID response fails.

The JSON key `keccak256` contains the Ethereum Keccak-256 digest. It is not standardized SHA3-256.

### 5. Run once

```powershell
npm run seed
```

The script itself verifies chain ID, bytecode, owner relationship, credential relationship, zero batches, five credential-free manufacturer wallets, address uniqueness, and six balances before invoking IPFS.

### 6. Expected fresh-run result

A complete run should produce:

- five `CredentialMinted` transactions;
- sixteen `BatchAttested` transactions;
- one `BatchRecalled` transaction for `DC.319`;
- one `CounterfeitFlagged` transaction for `A11-100025`;
- one `CounterfeitValidated` transaction with `isCounterfeit == true`;
- four pinned evidence records;
- sixteen batch records;
- one active recall;
- one validated counterfeit count;
- QR SVGs for each unique seeded NRN; and
- `demo/seed/seed-output.json`.

That is 24 broadcast transactions. Copy actual IDs, hashes, URLs, and receipt records from the generated output into the pending fields. Do not predict or fabricate them.

### 7. Validate the generated state

After the run:

- resolve every actual transaction on Monad Mainnet;
- call `getTotalBatches`, `getTotalCounterfeitReports`, and all passport pages;
- confirm `A4-0201` includes recalled historical batch `DC.319`;
- confirm `A11-100025` includes two `DEMO-ML-*` tablet batches and the validated report;
- retrieve all four IPFS CIDs independently;
- recompute or independently verify all four Keccak-256 digests;
- confirm the public app reads the same configured contracts;
- record receipt status without calling it `Verified` finality; and
- record Monad block stages when available.

### 8. Failure and retry rule

Do not rerun after a partial seed. Inspect actual contract state and transaction receipts first. A completed mint or attestation can make the original preconditions false, and the script is not a resumable workflow.

### 9. Clear seed secrets

```powershell
Remove-Item Env:PRIVATE_KEY
Remove-Item Env:SEED_MANUFACTURER_PRIVATE_KEYS
Remove-Item Env:IPFS_API_KEY
```

For a local secure run, use the wrapper so the JWT is prompted securely and cleared afterward:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run-seed-secure.ps1
```

Do not place the JWT in `.env.example`, `.env.local`, a Vercel variable, source control, or chat.

## Security caveats for submission review

- No independent audit is claimed.
- Both contracts use a single ordinary owner rather than two-step ownership or enforced multisig.
- Credential metadata is owner-asserted and not checked against NAFDAC.
- Product NRN values are incorrectly reusable as organization metadata labels in the seed; they remain product identifiers.
- Demo signer wallets are not proven to represent the named legal entities.
- Demo batch values are not regulator-issued.
- A validated counterfeit report is NRN-level and can affect all displayed batches under that key.
- No correction, appeal, or supersession path exists for attestations, recalls, or validation.
- The `DC.319` evidence hash is for a general recall guideline, not the alert itself.
- The `A11-100025` report stores a source URL in text, not a dedicated hash/CID.
- IPFS pin success and gateway availability are not proof of durable preservation.
- The seed waits for one receipt confirmation, not Monad `Finalized` or `Verified` finality.
- Foundry 1.8.1 Monad testing passed; the default PATH still contains 1.7.1, so use the explicit official executable for deployment commands.
- Mainnet contracts, seed, IPFS CIDs, and the live application are recorded; Monad `Finalized` and state-root `Verified` labels remain separate claims.

## Submission artifacts

- [`README.md`](./README.md) — setup, commands, implementation behavior, and safety controls.
- [`RESEARCH.md`](./RESEARCH.md) — official product/alerts, contract API, seed mapping, and uncertainty log.
- [`DEMO_SCRIPT.md`](./DEMO_SCRIPT.md) — post-deployment 90-second script and preflight fallback.
- [`SUBMISSION.md`](./SUBMISSION.md) — deployed contract/source/seed record.

No commit was created as part of this work.
