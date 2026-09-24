# PharmChain implementation and research notes

**Snapshot:** 2026-09-24
**Implementation inspected:** `ManufacturerCredential.sol`, `DrugRegistry.sol`, `Deploy.s.sol`, `scripts/seed.ts`, frontend ABIs/forms, Foundry tests, and NAFDAC/Monad official sources.

All web sources in this document were accessed on **2026-09-24**. Green Book status and NAFDAC alerts can change. A production workflow must capture the exact source, access time, content digest, and reviewer rather than treating a URL as permanent evidence.

## Findings

1. **NAFDAC Registration Numbers are product-registration identifiers.** They are displayed with product name, ingredient, form, route, strength, applicant, approval date, and status. They are not batch numbers, manufacturer/facility licences, or proof that a physical pack is genuine.
2. **The Green Book examples used by the seed are real product records.** A.C. Drugs products include ACD 500 (`A11-0550`), Acimox (`A4-8982`), Artemetrin DS (`A4-3164`), and AC-Ome 20 (`A4-4958`). Michelle Laboratories' Cikagyl 400 is `A11-100255`.
3. **The credential script's `registrationNumber` field is not a verified manufacturer-licence field.** In particular, the seed puts product NRNs `A11-0550` and `A11-100255` into that field for A.C. Drugs and Michelle Laboratories. Those values are product-level registrations and must not be described as manufacturer licences.
4. **Every seed batch number prefixed `DEMO-` is a demonstration label created by `scripts/seed.ts`, not a regulator-issued batch number.** The seed expiry values are also demonstration data.
5. **`DC.319` is different:** it is the regulator-issued MeCure dexamethasone lot named in NAFDAC Public Alert 041/2022 under NRN `A4-0201`. The contract deliberately permits recording a historical, already-expired batch so it can be recalled.
6. **The `ALS063` Cikatem suspension in Public Alert 05/2025 is not a seed batch.** The seed records two demonstration Cikatem tablet batches under `A11-100025`; it separately creates an NRN-level counterfeit report whose details cite falsified suspension batch `ALS063`.
7. **Mainnet contracts, frontend, and seed are deployed.** The live frontend is `https://pharmchain.vercel.app`; the seed has 24 successful receipts, four retrievable IPFS PDFs, and the exact record in `demo/seed/seed-output.json`.
8. **Monad-mode tests pass with the installed Foundry 1.8.1 binary.** The default PATH also contains an older 1.7.1 binary, so use the official 1.8.1 executable for `--network monad`. The deployment script hard-fails unless `block.chainid == 143`.

## NAFDAC identifier formats

Observed official product and alert values include `A11-0550`, `A4-8982`, `A4-3164`, `A4-4958`, `A11-100255`, `A4-0201`, `A11-100025`, `04-4198`, `B4-3876`, and `4/1/8146`. The values use a mixture of letters, digits, hyphens, and separators. The official Green Book exposes an NRN as a product field alongside product name, ingredients, form, route, strength, applicant, approval date, and status; it does not publish a universal prefix grammar, check digit, or checksum rule in the reviewed guidance. A strict regular expression would therefore reject valid records or falsely imply regulatory meaning. PharmChain treats the value as an opaque lookup string, preserves the raw value on chain, and requires the caller to use the same exact string for later lookups.

The Green Book's own product interface and official product pages are the authoritative examples used here:

- [ACD 500, `A11-0550`](https://greenbook.nafdac.gov.ng/products/details/6649)
- [Acimox, `A4-8982`](https://greenbook.nafdac.gov.ng/products/details/6678)
- [Artemetrin DS, `A4-3164`](https://greenbook.nafdac.gov.ng/products/details/7256)
- [AC-Ome 20, `A4-4958`](https://greenbook.nafdac.gov.ng/products/details/6662)
- [Cikagyl 400, `A11-100255`](https://greenbook.nafdac.gov.ng/products/details/64)
- [Xalatan alert, `04-4198`](https://nafdac.gov.ng/public-alert-no-0019-2019-alert-on-voluntary-recall-of-xalatan-eye-drops-lot-numbers-w67369-and-ak4753/)
- [Dexamethasone alert, `B4-3876` and other rows](https://nafdac.gov.ng/public-alert-no-041-2022-recall-of-substandard-dexamethasone-products-detected-in-anambra-state-nigeria/)

**Implementation consequence:** do not call an NRN a manufacturer licence, do not infer a batch from it, and do not treat a formatting match as proof of authenticity.

## Batch and expiry conventions

NAFDAC's [recall guideline](https://nafdac.gov.ng/wp-content/uploads/Files/Resources/Guidelines/PMS_Guidelines_2024/NAFDAC-Guidelines-for-the-Recall-of-Defective-Medical-Products.pdf) and [GMP guidance](https://nafdac.gov.ng/wp-content/uploads/Files/Resources/Guidelines/DRUG_GUIDELINES/NAFDAC-GMP-GUIDELINES.pdf) describe a batch/lot as a distinctive combination of numbers and/or letters that links labels, records, and certificates of analysis. The reviewed official examples show that the combination is manufacturer/product-specific rather than one national template:

| Evidence | Observed batch/lot examples | Date examples | What can be concluded |
|---|---|---|---|
| [NAFDAC Alert 041/2022](https://nafdac.gov.ng/public-alert-no-041-2022-recall-of-substandard-dexamethasone-products-detected-in-anambra-state-nigeria/) | `DC.319`, `181201`, `201101`, `210201`, `KDSTE-003`, `L263`, `L20072`, `TVL55`, `A009`, `Z19003` | `06/2021`, `05/2024`, `10/2020`, `09/2022` | Numeric, dotted, hyphenated, and letter-containing lot values coexist. |
| [Sporidex Alert 033/2026](https://nafdac.gov.ng/public-alert-no-033-2026-alert-on-the-voluntary-recall-of-sporidex-suspension-125-mg-5-ml-batch-no-dfg4606a/) | `DFG4606A` | Public notice does not state expiry | An alphanumeric lot is possible; do not infer a date that the notice omits. |
| [Cikatem Alert 05/2025](https://nafdac.gov.ng/public-alert-no-05-2025-alert-on-the-circulation-of-falsified-cikatem-artemether-180mg-lumefantrine-1080mg-with-falsified-nafdac-registration-number-nrn-a11-100025/) | `ALS063` | Manufactured `10/2024`; expiry `09/2027` | A lot and manufacture/expiry fields can be read directly from the alert. |
| [Xalatan Alert 0019/2019](https://nafdac.gov.ng/public-alert-no-0019-2019-alert-on-voluntary-recall-of-xalatan-eye-drops-lot-numbers-w67369-and-ak4753/) | `W67369`, `AK4753` | Expiry `10/2020`, `10/2021` | Authentic-looking lot strings can be copied onto falsified products. |

NAFDAC's [label guidance](https://nafdac.gov.ng/wp-content/uploads/Files/Resources/Guidelines/DR_And_R_Guidelines/Label-Guidance-For-Pharmaceutical-Products.pdf) says manufacture and expiry information is assigned by the manufacturer and gives un-coded numeric examples such as `12/2016` and `2016 12`; alphabetic months are not acceptable in that guidance. PharmChain stores the parsed expiry as a Unix timestamp and displays the original batch string, but it cannot reconstruct a label convention that was not submitted.

Public packaging images and manufacturer pages for Fidson, Emzor, May & Baker, and Swiss Pharma did not yield a reliable, consistently documented lot template in the reviewed official sources. Green Book product descriptions, NAFDAC alerts, and regulator guidance are stronger evidence than an isolated retail photograph. The product-specific values above are therefore recorded as observed examples, not generalized manufacturer rules.

## Official recall and counterfeit notices

The implementation uses two recall/falsification scenarios directly and records a third notice for research context.

### Alert 033/2026 — Sporidex Suspension

[Official notice](https://nafdac.gov.ng/public-alert-no-033-2026-alert-on-the-voluntary-recall-of-sporidex-suspension-125-mg-5-ml-batch-no-dfg4606a/), released 2026-06-18, identifies Sporidex Suspension 125 mg/5 mL, batch `DFG4606A`, manufacturer/MAH Ranbaxy Nigeria Ltd. (a Sun Pharma Company), reason as a precautionary recall after an impurity exceeded the approved specification, and actions to stop distribution/sale, quarantine stock, and avoid use. It includes product name, strength, manufacturer, batch, reason, risk statement, date, and requested action. The public notice does not state an NRN, so none is invented here.

### Alert 0019/2019 — Xalatan eye drops

[Official notice](https://nafdac.gov.ng/public-alert-no-0019-2019-alert-on-voluntary-recall-of-xalatan-eye-drops-lot-numbers-w67369-and-ak4753/), released 2019-11-03, identifies Xalatan 0.005% eye drops, lots `W67369` and `AK4753`, expiries `10/2020` and `10/2021`, NRN `04-4198`, Pfizer Specialties Limited in Nigeria, and Pfizer Manufacturing Belgium NV for the genuine product. The reason was confirmed falsified products carrying authentic lot numbers; genuine lots were recalled defensively because consumers could not distinguish them visually. The fields demonstrate why a matching lot number is not conclusive.

### Alert 041/2022 — Dexamethasone

[Official notice](https://nafdac.gov.ng/public-alert-no-041-2022-recall-of-substandard-dexamethasone-products-detected-in-anambra-state-nigeria/), released 2022-10-08, lists product, strength, stated manufacturer, marketing authorization holder, NRN, batch, manufacture date, expiry, and HPLC assay. The Me Cure row is NRN `A4-0201`, batch `DC.319`, manufactured `06/2021`, expiry `05/2024`, assay `88.6%`. The notice calls the samples substandard, not counterfeit, and directs affected stock to be recalled.

### Alert 05/2025 — Cikatem suspension

[Official notice](https://nafdac.gov.ng/public-alert-no-05-2025-alert-on-the-circulation-of-falsified-cikatem-artemether-180mg-lumefantrine-1080mg-with-falsified-nafdac-registration-number-nrn-a11-100025/), released 2025-03-11, identifies Cikatem Suspension 180 mg/1080 mg, batch `ALS063`, manufacture `10/2024`, expiry `09/2027`, printed NRN `A11-100025`, and Michelle Laboratories as stated manufacturer. NAFDAC says the number belongs to Cikatem Tablet 20/120 mg, not the suspension. The seed does not attest `ALS063`; it demonstrates the mismatch through an NRN-level report.

## Nigerian manufacturer examples

These are real Nigerian manufacturer/product examples from the official Green Book. The NRN column is a **product registration number for the cited product**, not a manufacturer licence or a universal company identifier. Recheck status and source access before any production onboarding.

| Manufacturer | Example product | NRN | Green Book source |
|---|---|---|---|
| A.C. Drugs Ltd | ACD 500 Tablet | `A11-0550` | [product](https://greenbook.nafdac.gov.ng/products/details/6649) |
| Afrab-Chem Limited | Afrab Azithromycin 500 mg Tablets | `A11-101341` | [product](https://greenbook.nafdac.gov.ng/products/details/12465) |
| Emzor Pharmaceutical Industries Limited | Emzor Ciprofloxacin 500 Tablet | `A11-100523` | [product](https://greenbook.nafdac.gov.ng/products/details/4891) |
| Fidson Healthcare PLC | Forste Suspension | `A11-0731` | [product](https://greenbook.nafdac.gov.ng/products/details/11437) |
| May & Baker Nigeria PLC | Mepiryl 4 mg Tablet | `04-9439` | [product](https://greenbook.nafdac.gov.ng/products/details/11648) |
| Me Cure Industries Limited | MeCure's Amlodipine 10 mg Tablet | `A11-100744` | [product](https://greenbook.nafdac.gov.ng/products/details/8892) |
| Nalis Pharmaceuticals Ltd | Nalis Tramadol Capsules | `A11-100644` | [product](https://greenbook.nafdac.gov.ng/products/details/7180) |
| Ranbaxy Nigeria Limited | Brustan-N Suspension | `A4-0488` | [product](https://greenbook.nafdac.gov.ng/products/details/6052) |
| Unicure Pharmaceuticals Limited | Aminocure Amlodipine 10 mg Tablet | `A11-100719` | [product](https://greenbook.nafdac.gov.ng/products/details/7773) |
| Vitabiotics Nigeria Limited | Pentax Extra Caplet | `A4-2656` | [product](https://greenbook.nafdac.gov.ng/products/details/11679) |

Green Book status is a product-record status at access time, not independent proof of current facility licensing, MAH authorization, or a genuine physical pack.

## Counterfeit and substandard patterns

- **Wrong formulation with a copied NRN:** Cikatem suspension used `A11-100025`, which the alert says belongs to the tablet formulation. Compare product name, form, strength, route, ingredients, applicant, and status.
- **Authentic lot numbers copied onto fakes:** Xalatan lots `W67369` and `AK4753` appeared on falsified products, so even a matching lot is only a claim.
- **Missing NRN:** a Dostinex alert records `Nil` for purported product identity; a missing identifier is a stop-and-verify signal, not proof by itself.
- **Address or authorized-distributor mismatch:** the BETACLOX alert reports `No. 128 MCC Road` on packaging versus `No. 101 MCC Road` in a PCN record; the Tavanic alert reports a label/distributor mismatch.
- **Date or packaging tampering:** the Prevenar alert describes an altered expiry and the Augmentin alert describes inconsistent dates and poor fin-seal quality. These are triggers for testing, not standalone authentication.
- **Informal channels:** open markets, unauthorized online sellers, and unverified door-to-door supply are risk signals. WHO describes substandard and falsified medical products as a global patient-safety problem, but an on-chain report does not replace a regulator complaint or pharmacovigilance channel.

Sources: [Cikatem](https://nafdac.gov.ng/public-alert-no-05-2025-alert-on-the-circulation-of-falsified-cikatem-artemether-180mg-lumefantrine-1080mg-with-falsified-nafdac-registration-number-nrn-a11-100025/), [Xalatan](https://nafdac.gov.ng/public-alert-no-0019-2019-alert-on-voluntary-recall-of-xalatan-eye-drops-lot-numbers-w67369-and-ak4753/), [Dostinex](https://nafdac.gov.ng/public-alert-no-07-2026-alert-on-surveillance-and-mop-up-of-counterfeit-dostinex-0-5mg-tablets-found-in-circulation/), [BETACLOX](https://nafdac.gov.ng/public-alert-no-37-2025-alert-on-the-report-of-substandard-and-falsified-sf-betaclox-found-in-nigeria/), [Tavanic](https://nafdac.gov.ng/public-alert-no-01-2026-sale-of-falsified-tavanic-500mg-tablet-in-nigeria/), [Prevenar](https://nafdac.gov.ng/public-alert-no-02-2024-pfizer-warns-against-tampered-expiry-date-on-prevenar-13-batch-cl-3337/), [Augmentin](https://nafdac.gov.ng/public-alert-no-024-2026-alert-on-counterfeit-augmentin-625mg-tablets-batch-no-ac3n-in-nigeria/), and [WHO fact sheet](https://www.who.int/news-room/fact-sheets/detail/substandard-and-falsified-medical-products).

## Official Monad Mainnet facts

The [official Monad network information](https://docs.monad.xyz/developer-essentials/network-information) accessed 2026-09-24 specifies:

- network: Monad Mainnet;
- chain ID: `143`;
- native currency: `MON`, 18 decimals;
- public RPC: `https://rpc.monad.xyz`;
- WebSocket: `wss://rpc.monad.xyz`; and
- explorers: [MonadScan](https://monadscan.com/) and [MonadVision](https://monadvision.com/).

The public RPC is rate-limited. Receipt availability, Monad `Finalized`, and state-root `Verified` are distinct lifecycle states; the seed waits for a successful receipt and does not claim the later finality stages.

## Official Green Book examples

| NRN | Official product record | Applicant and manufacturer | Form, ingredient, strength, route | Green Book status at access date |
|---|---|---|---|---|
| [`A11-0550`](https://greenbook.nafdac.gov.ng/products/details/6649) | ACD 500 Tablet | A.C. Drugs Ltd, Nigeria | Tablet; paracetamol 500 mg; oral; OTC | Active; approval 2023-12-21; record expiry 2028-12-20 |
| [`A4-8982`](https://greenbook.nafdac.gov.ng/products/details/6678) | Acimox Capsule | A.C. Drugs Ltd, Nigeria | Capsule; amoxicillin trihydrate equivalent to amoxicillin 500 mg; oral; POM | Active; approval 2023-12-21; record expiry 2028-12-20 |
| [`A4-3164`](https://greenbook.nafdac.gov.ng/products/details/7256) | Artemetrin DS Tablet | A.C. Drugs Ltd, Nigeria | Tablet; artemether 80 mg and lumefantrine 480 mg; oral; OTC | Active; approval 2023-12-21; record expiry 2028-12-20 |
| [`A4-4958`](https://greenbook.nafdac.gov.ng/products/details/6662) | AC-Ome 20 Capsule | A.C. Drugs Ltd, Nigeria | Capsule; omeprazole 20 mg; oral; POM | Active; approval 2023-12-21; record expiry 2028-12-20 |
| [`A11-100255`](https://greenbook.nafdac.gov.ng/products/details/64) | Cikagyl 400 Tablet | Michelle Laboratories Limited, Nigeria | Tablet; metronidazole 400 mg; oral; POM | Active; approval 2021-12-02; record expiry 2026-12-01 |

The official [A.C. Drugs applicant record](https://greenbook.nafdac.gov.ng/applicant/products/355) links these product detail pages. The official [Michelle Laboratories applicant record](https://greenbook.nafdac.gov.ng/applicant/products/229) links the Cikagyl and other Michelle products.

### NRN boundary

A product NRN can identify the registered product record, but it cannot answer every safety question:

- it does not identify a batch;
- it does not establish manufacture or expiry for a physical pack;
- it is not a manufacturer/facility licence;
- it does not prove that the pack bearing the number is genuine; and
- formulation, strength, route, applicant, and current status must still be compared.

The Cikatem alert is the direct counterexample: a suspension carried `A11-100025`, which NAFDAC said belonged to Cikatem Tablet 20/120 mg.

## Official alerts used by the implementation

### Public Alert 041/2022 — NRN `A4-0201`, batch `DC.319`

**Source:** [NAFDAC Public Alert No. 041/2022](https://nafdac.gov.ng/public-alert-no-041-2022-recall-of-substandard-dexamethasone-products-detected-in-anambra-state-nigeria/)
**Released:** 2022-10-08

The affected row identifies:

- product: Me cure Dexamethasone 0.5 mg Tablet;
- stated manufacturer: Me Cure Industries Ltd., Nigeria;
- stated marketing authorization holder: Me Cure Industries, Nigeria;
- NRN: `A4-0201`;
- batch: `DC.319`;
- manufacture date: 06/2021;
- expiry: 05/2024;
- HPLC assay: 88.6%.

The notice describes a nationwide recall of the listed products. It calls the samples **substandard**, not counterfeit. The seed's `expiryDate: "2024-05-01"` is a UTC demo representation of the alert's month, not a copied regulator timestamp.

The [Green Book product record for `A4-0201`](https://greenbook.nafdac.gov.ng/products/details/4216) is product-level. Its registration record does not certify batch `DC.319` as safe; the alert says the opposite.

### Public Alert 05/2025 — NRN `A11-100025`, falsified suspension batch `ALS063`

**Source:** [NAFDAC Public Alert No. 05/2025](https://nafdac.gov.ng/public-alert-no-05-2025-alert-on-the-circulation-of-falsified-cikatem-artemether-180mg-lumefantrine-1080mg-with-falsified-nafdac-registration-number-nrn-a11-100025/)
**Released:** 2025-03-11

The notice identifies a confirmed falsified Cikatem Suspension, artemether 180 mg/lumefantrine 1080 mg, batch `ALS063`, manufactured 10/2024, expiring 09/2027, with `NRN A11-100025` printed on the label and Michelle Laboratories named as manufacturer.

NAFDAC states that `A11-100025` belonged to **Cikatem Tablet 20/120 mg**, not the suspension. This notice is a counterfeit/falsified-product alert, not titled as a recall.

The implementation uses this alert in three distinct ways that must not be conflated:

1. The seed does **not** attest `ALS063`.
2. The seed attests `DEMO-ML-002` and `DEMO-ML-003` as Cikatem Tablet 20/120 mg examples under `A11-100025`; these are not regulator-issued batches.
3. The seed creates a public report keyed only by `A11-100025`, then the owner validates it as counterfeit. That makes the passport's counterfeit state **NRN-level**, not proof that every batch carrying that NRN is counterfeit.

## Seed records and regulator-issued identifiers

`scripts/seed.ts` defines five credential recipients and sixteen batches:

| Credential recipient | Credential metadata entered by seed | Seed batch number | Product key | Provenance status |
|---|---|---|---|---|
| A.C. Drugs Ltd | `A11-0550` | `DEMO-AC-001` | `A11-0550` ACD 500 | Batch label is demo-only |
| A.C. Drugs Ltd | `A11-0550` | `DEMO-AC-002` | `A4-8982` Acimox | Batch label is demo-only |
| A.C. Drugs Ltd | `A11-0550` | `DEMO-AC-003` | `A4-3164` Artemetrin DS | Batch label is demo-only |
| A.C. Drugs Ltd | `A11-0550` | `DEMO-AC-004` | `A4-4958` AC-Ome 20 | Batch label is demo-only |
| Michelle Laboratories Limited | `A11-100255` | `DEMO-ML-001` | `A11-100255` Cikagyl 400 | Batch label is demo-only |
| Michelle Laboratories Limited | `A11-100255` | `DEMO-ML-002` | `A11-100025` Cikatem Tablet | Batch label is demo-only |
| Michelle Laboratories Limited | `A11-100255` | `DEMO-ML-003` | `A11-100025` Cikatem Tablet | Batch label is demo-only |
| Me Cure Industries Limited | `A11-100744` | `DEMO-MC-001` | `A11-100744` MeCure's Amlodipine | Batch label is demo-only |
| Me Cure Industries Limited | `A11-100744` | `DC.319` | `A4-0201` Me Cure Dexamethasone | Regulator-issued batch named by Alert 041/2022; historical seed |
| Me Cure Industries Limited | `A11-100744` | `DEMO-MC-003` | `A11-0262` MeCure's Diclopar | Batch label is demo-only |
| Afrab-Chem Limited | `A11-101341` | `DEMO-AR-001` | `A11-101341` azithromycin | Batch label is demo-only |
| Afrab-Chem Limited | `A11-101341` | `DEMO-AR-002` | `A11-101341` azithromycin | Batch label is demo-only |
| Afrab-Chem Limited | `A11-101341` | `DEMO-AR-003` | `A11-101341` azithromycin | Batch label is demo-only |
| Fidson Healthcare PLC | `A11-0731` | `DEMO-FH-001` | `A11-0731` Forste Suspension | Batch label is demo-only |
| Fidson Healthcare PLC | `A11-0731` | `DEMO-FH-002` | `A11-0731` Forste Suspension | Batch label is demo-only |
| Fidson Healthcare PLC | `A11-0731` | `DEMO-FH-003` | `A11-0731` Forste Suspension | Batch label is demo-only |

The table separates three different concepts:

- the NRN/product key supplied to `attestBatch`;
- the manufacturer credential token ID, which is minted on chain; and
- the product's printed batch/lot string.

The contract stores the printed batch/lot string and an internally assigned sequential `uint256 batchId`. Neither on-chain ID is a new NAFDAC identifier.

## Actual contract API

### `ManufacturerCredential`

Constructor:

```solidity
constructor()
```

External functions:

```solidity
mint(address manufacturer, string manufacturerName, string nafdacRegistrationNumber, string manufacturingAddress)
    returns (uint256 tokenId)

revoke(uint256 tokenId)
pause()
unpause()

isVerified(address manufacturer) view returns (bool)
manufacturerOf(uint256 tokenId) view returns (address)
getCredential(uint256 tokenId) view returns (Credential)
```

Credential storage contains manufacturer name, the free-text `nafdacRegistrationNumber`, manufacturing address, wallet, active state, issue time, and revocation time.

Access and soulbound behavior:

- only the contract owner can mint, revoke, pause, or unpause;
- only one active credential may exist per manufacturer wallet;
- credential text is limited to 256 bytes per field;
- revocation marks the credential inactive, removes the wallet lookup, and burns the token;
- `transferFrom` and both `safeTransferFrom` overloads revert through the transfer-blocking `_update` override;
- `approve` and `setApprovalForAll` revert;
- `tokenURI` returns an empty string.

The test suite proves the wallet/token binding, transfer/approval rejection, owner-only mint/revoke, burn-on-revoke, and pause behavior. It does not prove that a named manufacturer consented to receiving the credential or that the credential metadata is regulator-verified.

### `DrugRegistry`

Constructor:

```solidity
constructor(address credentialAddress)
```

Write signatures:

```solidity
attestBatch(
    uint256 manufacturerId,
    string nafdacNumber,
    string batchNumber,
    string drugName,
    uint256 expiryDate,
    bytes32 evidenceHash
) returns (uint256 batchId)

flagRecall(uint256 batchId, string reason)

flagCounterfeit(string nafdacNumber, string details)
    returns (uint256 reportId)

validateCounterfeit(uint256 reportId, bool isCounterfeit)

pause()
unpause()
```

Read signatures:

```solidity
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

credentialContract() view returns (address)
owner() view returns (address)
paused() view returns (bool)
MAX_TEXT_LENGTH() view returns (uint256)
MAX_DETAILS_LENGTH() view returns (uint256)
MAX_PASSPORT_ITEMS() view returns (uint256)
nextBatchId() view returns (uint256)
nextReportId() view returns (uint256)
```

The frontend ABI in `lib/contracts.ts` mirrors these signatures and tuple fields.

### Batch attestation and historical recall

`attestBatch` requires:

- an active credential for `msg.sender`;
- `credentialContract.manufacturerOf(manufacturerId) == msg.sender`;
- nonempty NRN, batch number, and drug name, each at most 512 bytes;
- a nonzero expiry timestamp; and
- a nonzero evidence hash.

The expiry only has to be nonzero. It may be in the past. This is what allows a historical `DC.319` record to be inserted and then recalled. It also means any active credential can attest an arbitrary historical date unless off-chain controls prevent that operation.

The uniqueness key is `keccak256(abi.encode(nafdacNumber, batchNumber))`. The same printed batch string under another exact NRN can be recorded as another batch. The contract does not canonicalize case, whitespace, Unicode, or formatting.

`flagRecall` is one-time and may be called only by:

- the wallet recorded as the batch manufacturer/attestor; or
- the DrugRegistry owner.

The reason is nonempty and at most 512 bytes. There is no unrecall, correction, appeal, or supersession path. Historical recall support is therefore immutable event/state history, not a reversible workflow.

### Counterfeit report lifecycle

Any connected address can create one report for an exact NRN when the registry is not paused. The duplicate key is the reporter wallet, NRN, and details. Details are limited to 2,048 bytes.

Only the DrugRegistry owner can validate a report once. Validation records:

- `validated`;
- boolean `isCounterfeit`;
- validator address and time.

A true decision increments the NRN-level validated-counterfeit count; a false decision removes the report from pending count but does not increment the counterfeit count. Reports are not batch-keyed and cannot later be corrected.

### Pause and ownership

The owner can pause and unpause both contracts. While paused, DrugRegistry attestation, recall, report creation, and report validation revert; reads remain available.

Both contracts use OpenZeppelin `Ownable`, not a two-step ownership module. Key compromise or unsafe owner operation therefore has a single control point. The implementation has no upgradeability, role-separated validator committee, timelock, or multisig enforcement.

### Bounded pagination

`MAX_PASSPORT_ITEMS` is `100`.

`getDrugPassport` returns:

- complete aggregate counts;
- at most the first 100 batch IDs; and
- at most the first 100 report IDs.

`getBatchPage` and `getCounterfeitReportPage` provide the full collections:

- `limit == 0` reverts with `InvalidLimit`;
- a requested limit above 100 is capped at 100;
- an offset at or beyond the end returns an empty page and `nextOffset == 0`;
- otherwise `nextOffset` advances by the page length; and
- the final page returns `nextOffset == 0`.

The frontend requests pages of 100 and loops until zero, an empty page, or a non-advancing offset. A malicious/buggy contract response could still cause excess client work because there is no global page-count or total-record cap.

### Transaction explorer

The verify page resolves transaction hashes from actual Monad event logs for `BatchAttested`, `BatchRecalled`, `CounterfeitFlagged`, and `CounterfeitValidated`. It uses the latest 50,000-block window by default, or a configured deployment block when that block is inside the same bounded window. Older events are not silently claimed to be absent. RPC/indexer failure is non-fatal and the page shows the warning rather than inventing a hash.

### Frontend state precedence

`passportVerificationState` applies this precedence:

1. `counterfeit` if any validated true counterfeit exists;
2. `recalled` if a recall flag exists;
3. `review` if a counterfeit report is pending or a loaded batch is expired;
4. `verified` otherwise.

“Verified” means only that the loaded registry state has none of those signals. It does not mean NAFDAC-certified, physically authentic, or safe. A counterfeit signal is NRN-level and can visually outrank a batch-level recall or expired state.

## IPFS evidence implemented by the seed

Before broadcasting the first seed transaction, `uploadEvidence()` downloads four official NAFDAC PDFs and uploads them through either a Kubo-compatible `/api/v0/add?pin=true` endpoint or Pinata's authenticated `/pinning/pinFileToIPFS` endpoint:

1. drug-registration guideline;
2. defective-product recall guideline;
3. GMP guideline; and
4. pharmaceutical label guidance.

For each PDF it records:

- source URL;
- filename;
- Ethereum `keccak256(bytes)` digest; and
- returned CID plus an `https://ipfs.io/ipfs/<cid>` URL.

Important limits:

- `IPFS_API_URL` is mandatory; seed refuses to continue if absent.
- `IPFS_API_KEY` is optional and sent as a bearer token when present.
- The script trusts a successful API response and CID; it does not retrieve the pinned object again before broadcasting.
- The output property is named `keccak256`; it is produced by viem's Ethereum `keccak256(bytes)`, not standardized SHA3-256.
- The DC.319 batch stores the hash of the general recall guideline, not a locally pinned copy of Alert 041/2022 itself. The alert number and reason are stored as text.
- The Cikatem report stores the official alert URL in report details, but the report does not carry a dedicated evidence hash or CID field.
- Content addressing does not prove source authenticity, completeness, or future availability.
- Uploading official guidance does not turn that guidance into evidence that every seeded batch is genuine.

## Exact seed preflight

`npm run seed` runs `tsx scripts/seed.ts` against viem's `monadMainnet`. It requires all of the following before uploading or broadcasting:

- `SEED_CONFIRM=PHARMCHAIN-MAINNET`;
- `PRIVATE_KEY` for a deployer/credential-owner wallet;
- `SEED_MANUFACTURER_PRIVATE_KEYS` containing exactly five unique private keys;
- `DRUG_REGISTRY_ADDRESS` and `MANUFACTURER_CREDENTIAL_ADDRESS`;
- `IPFS_API_URL`; and
- a working Monad Mainnet RPC.

It then checks:

- RPC chain ID is exactly `143`;
- both configured addresses contain runtime bytecode;
- all six wallet addresses are unique;
- the deployer is `ManufacturerCredential.owner()`;
- DrugRegistry points to the configured credential contract;
- `getTotalBatches() == 0`;
- none of the five manufacturer wallets already has a credential;
- deployer and all five manufacturer signers each hold at least `0.2 MON`; and
- all four evidence uploads and pin requests succeed.

The five keys are mapped in order to A.C. Drugs, Michelle Laboratories, Me Cure, Afrab-Chem, and Fidson. The script does not cryptographically or operationally prove that those wallets are controlled by the named legal entities. Their credentials are owner-issued demonstration credentials.

If a transaction fails, the script throws. It does not implement a full idempotent resume protocol. Because a completed mint or attestation changes preconditions, an interrupted run must be inspected manually before any retry. The script now checks both `getTotalBatches() == 0` and `getTotalCounterfeitReports() == 0` before uploading.

On a fresh successful run, intended output metrics are:

- 5 manufacturer credentials;
- 16 batches;
- 1 active recall;
- 1 owner-validated counterfeit report;
- 4 pinned evidence PDFs;
- 24 broadcast transactions: 5 mints, 16 attestations, 1 recall, 1 report, and 1 validation.

The script waits for one receipt confirmation per transaction. It does not wait for Monad `Finalized` or state-root `Verified` stages.

## Mainnet-only Foundry and viem setup

### Viem/wagmi

`lib/monad.ts` hardcodes:

- chain ID `143`;
- `https://rpc.monad.xyz`; and
- `https://monadscan.com`.

`components/providers.tsx` registers only `monadMainnet`. Write hooks reject any other chain. Although `.env.example` lists public RPC/explorer/IPFS gateway variables, the current `lib/monad.ts` does not read them.

### Foundry configuration

The root `foundry.toml` currently sets:

- Solidity sources in `src`;
- output in `out`;
- libraries in `lib`;
- tests in `test`;
- scripts in `script`;
- Solidity `0.8.28`;
- optimizer enabled with 200 runs;
- IR compilation enabled;
- metadata bytecode hash disabled; and
- read access to `./evidence`.

It does not set `network = "monad"` so the project remains buildable with the older default binary; the deployment script itself hard-fails unless the simulated or broadcast chain ID is 143. The official Foundry 1.8.1 executable was used to run `forge test --network monad`, and all 14 tests passed.

The official Foundry 1.8.1 executable supports Monad execution rules and passed `forge test --network monad` with 14 tests. The older 1.7.1 binary on the default PATH cannot select Monad mode; use the official executable for Monad-sensitive tests/scripts.

## Security and deployment caveats

- **No audit is claimed.** The 14 local tests cover core authorization and state transitions but not adversarial string normalization, owner compromise, pagination denial-of-service, event/indexer behavior, or a mainnet fork.
- **Credential issuance is centralized.** The owner can mint a real-looking credential for any wallet and self-asserted organization metadata.
- **Metadata is not regulator-verified.** `nafdacRegistrationNumber`, manufacturer name, and address are bounded strings only.
- **No two-step owner transfer.** Both deployed contracts are controlled by one ordinary `Ownable` owner.
- **No correction path.** Attestations, recalls, and report decisions cannot be corrected or superseded.
- **Exact-string identity is fragile.** NRN formatting is not normalized in Solidity.
- **Counterfeit state is NRN-level.** A validated report can affect every displayed batch under that NRN, including unrelated or demonstration batches.
- **Demo data is not regulator data.** `DEMO-*` batch strings and seed expiry timestamps must remain visibly labeled as demonstrations.
- **The alert and stored evidence are not the same artifact.** The seed does not pin either specific Public Alert PDF.
- **IPFS availability is external.** Pinning and gateway URLs do not guarantee preservation.
- **Seed authorization is not entity consent.** Five funded keys are required, but the script cannot prove corporate authorization.
- **Seed is intentionally single-use.** It requires zero batches and no existing credentials for its five wallets; manual recovery after partial execution is required.
- **One receipt is not finality.** Do not call seeded state irreversibly finalized based on `confirmations: 1`.
- **Seed is complete.** Mainnet contract addresses, deployment receipts, Sourcify matches, live frontend, seed output, and IPFS evidence records are available; provider durability and Monad finality labels remain separate claims.

## Local verification snapshot

Executed locally on 2026-09-24; mainnet deployment was subsequently executed from the restricted generated signer:

- `npm run lint` passed.
- `npm run typecheck -- --incremental false` passed.
- `forge test` passed 14 tests across `ManufacturerCredential` and `DrugRegistry`.
- `forge test --network monad` passed all 14 tests with the official Foundry 1.8.1 executable.
- Mainnet deployment simulation and broadcast succeeded; credential and registry addresses, receipts, and Sourcify jobs are recorded in `SUBMISSION.md`.
- The frontend is live at `https://pharmchain.vercel.app` and public route checks returned HTTP 200.
- Seed output verification confirmed 16 batches, 1 report, 24 successful receipts, five verified credentials, and four IPFS PDFs returning HTTP 200 from the Pinata gateway.

## Source register

All sources accessed 2026-09-24.

### NAFDAC and Green Book

1. [NAFDAC Green Book](https://greenbook.nafdac.gov.ng/)
2. [A.C. Drugs applicant products](https://greenbook.nafdac.gov.ng/applicant/products/355)
3. [Michelle Laboratories applicant products](https://greenbook.nafdac.gov.ng/applicant/products/229)
4. [ACD 500 — A11-0550](https://greenbook.nafdac.gov.ng/products/details/6649)
5. [Acimox — A4-8982](https://greenbook.nafdac.gov.ng/products/details/6678)
6. [Artemetrin DS — A4-3164](https://greenbook.nafdac.gov.ng/products/details/7256)
7. [AC-Ome 20 — A4-4958](https://greenbook.nafdac.gov.ng/products/details/6662)
8. [Cikagyl 400 — A11-100255](https://greenbook.nafdac.gov.ng/products/details/64)
9. [MeCure's Dexamethasone — A4-0201](https://greenbook.nafdac.gov.ng/products/details/4216)
10. [Public Alert 041/2022](https://nafdac.gov.ng/public-alert-no-041-2022-recall-of-substandard-dexamethasone-products-detected-in-anambra-state-nigeria/)
11. [Public Alert 05/2025](https://nafdac.gov.ng/public-alert-no-05-2025-alert-on-the-circulation-of-falsified-cikatem-artemether-180mg-lumefantrine-1080mg-with-falsified-nafdac-registration-number-nrn-a11-100025/)
12. [Handling Consumer Complaint](https://nafdac.gov.ng/our-services/pharmacovigilance-post-market-surveillance/handling-consumer-complaint/)
13. [Pharmacovigilance FAQs](https://nafdac.gov.ng/about-nafdac/nafdac-organisation/directorates/pharmacovigilance-pv-directorate/pharmacovigilance-faqs/)
14. [NAFDAC Guidelines](https://nafdac.gov.ng/regulatory-resources/guidelines/)
15. [Pharmaceutical Traceability and Supply Chain Monitoring](https://nafdac.gov.ng/nafdac-traceability-find-out-all-you-need-to-know-here/)

### Monad

16. [Monad documentation](https://docs.monad.xyz/)
17. [Monad Mainnet network information](https://docs.monad.xyz/developer-essentials/network-information)
18. [Deployment summary](https://docs.monad.xyz/developer-essentials/summary)
19. [Official Foundry guidance](https://docs.monad.xyz/tooling-and-infra/toolkits/foundry)
20. [Add Monad Mainnet to Wallet](https://docs.monad.xyz/guides/add-monad-to-wallet/mainnet)
