import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createPublicClient,
  createWalletClient,
  getAddress,
  http,
  keccak256,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import QRCode from "qrcode";
import { monadMainnet } from "../lib/monad";
import {
  DRUG_REGISTRY_ABI,
  MANUFACTURER_CREDENTIAL_ABI,
} from "../lib/contracts";

const rpcUrl = process.env.MONAD_RPC_URL?.trim() || "https://rpc.monad.xyz";
const registryAddress = optionalAddress("DRUG_REGISTRY_ADDRESS");
const credentialAddress = optionalAddress("MANUFACTURER_CREDENTIAL_ADDRESS");
const appUrl = process.env.PUBLIC_APP_URL?.trim();
const outputDirectory = resolve(
  process.cwd(),
  process.env.SEED_OUTPUT_DIRECTORY?.trim() || "demo/seed",
);
const confirmationPhrase = process.env.SEED_CONFIRM?.trim();

const evidenceSources = [
  {
    key: "registration-guideline",
    filename: "nafdac-registration-guideline.pdf",
    url: "https://nafdac.gov.ng/wp-content/uploads/Files/Resources/Guidelines/DR&R_2025/Guidelines-for-Registration-of-Drug-Products-Made-in-Nigeria-Human-and-Veterinary-Drug.pdf",
  },
  {
    key: "recall-guideline",
    filename: "nafdac-recall-guideline.pdf",
    url: "https://nafdac.gov.ng/wp-content/uploads/Files/Resources/Guidelines/PMS_Guidelines_2024/NAFDAC-Guidelines-for-the-Recall-of-Defective-Medical-Products.pdf",
  },
  {
    key: "gmp-guideline",
    filename: "nafdac-gmp-guideline.pdf",
    url: "https://nafdac.gov.ng/wp-content/uploads/Files/Resources/Guidelines/DRUG_GUIDELINES/NAFDAC-GMP-GUIDELINES.pdf",
  },
  {
    key: "label-guidance",
    filename: "nafdac-label-guidance.pdf",
    url: "https://nafdac.gov.ng/wp-content/uploads/Files/Resources/Guidelines/DR_And_R_Guidelines/Label-Guidance-For-Pharmaceutical-Products.pdf",
  },
] as const;

type BatchSeed = {
  nrn: string;
  batchNumber: string;
  drugName: string;
  expiryDate: string;
  evidenceKey: (typeof evidenceSources)[number]["key"];
};

type ManufacturerSeed = {
  name: string;
  registrationNumber: string;
  address: string;
  batches: BatchSeed[];
};

const manufacturerSeeds: ManufacturerSeed[] = [
  {
    name: "A.C. Drugs Ltd",
    registrationNumber: "A11-0550",
    address: "Lagos, Nigeria",
    batches: [
      { nrn: "A11-0550", batchNumber: "DEMO-AC-001", drugName: "ACD 500 Tablet — Paracetamol 500 mg", expiryDate: "2027-12-31", evidenceKey: "registration-guideline" },
      { nrn: "A4-8982", batchNumber: "DEMO-AC-002", drugName: "Acimox Capsule — Amoxicillin 500 mg", expiryDate: "2027-11-30", evidenceKey: "registration-guideline" },
      { nrn: "A4-3164", batchNumber: "DEMO-AC-003", drugName: "Artemetrin DS Tablet — Artemether/Lumefantrine 80/480 mg", expiryDate: "2028-01-31", evidenceKey: "registration-guideline" },
      { nrn: "A4-4958", batchNumber: "DEMO-AC-004", drugName: "AC-Ome 20 Capsule — Omeprazole 20 mg", expiryDate: "2027-10-31", evidenceKey: "registration-guideline" },
    ],
  },
  {
    name: "Michelle Laboratories Limited",
    registrationNumber: "A11-100255",
    address: "Plot 23, Block 2, Thinkers Corner Industrial Layout, Enugu, Nigeria",
    batches: [
      { nrn: "A11-100255", batchNumber: "DEMO-ML-001", drugName: "Cikagyl 400 Tablet — Metronidazole 400 mg", expiryDate: "2027-09-30", evidenceKey: "label-guidance" },
      { nrn: "A11-100025", batchNumber: "DEMO-ML-002", drugName: "Cikatem Tablet 20/120 mg", expiryDate: "2027-09-30", evidenceKey: "registration-guideline" },
      { nrn: "A11-100025", batchNumber: "DEMO-ML-003", drugName: "Cikatem Tablet 20/120 mg", expiryDate: "2027-09-30", evidenceKey: "registration-guideline" },
    ],
  },
  {
    name: "Me Cure Industries Limited",
    registrationNumber: "A11-100744",
    address: "Lagos, Nigeria",
    batches: [
      { nrn: "A11-100744", batchNumber: "DEMO-MC-001", drugName: "MeCure's Amlodipine 10 mg Tablet", expiryDate: "2028-02-28", evidenceKey: "registration-guideline" },
      { nrn: "A4-0201", batchNumber: "DC.319", drugName: "Me cure Dexamethasone 0.5 mg Tablet", expiryDate: "2024-05-01", evidenceKey: "recall-guideline" },
      { nrn: "A11-0262", batchNumber: "DEMO-MC-003", drugName: "MeCure's Diclopar Tablet", expiryDate: "2027-08-31", evidenceKey: "registration-guideline" },
    ],
  },
  {
    name: "Afrab-Chem Limited",
    registrationNumber: "A11-101341",
    address: "22 Abimbola Street, Isolo Industrial Estate, Isolo, Lagos, Nigeria",
    batches: [
      { nrn: "A11-101341", batchNumber: "DEMO-AR-001", drugName: "AFRAB AZITHROMYCIN 500MG TABLETS", expiryDate: "2027-12-31", evidenceKey: "registration-guideline" },
      { nrn: "A11-101341", batchNumber: "DEMO-AR-002", drugName: "AFRAB AZITHROMYCIN 500MG TABLETS", expiryDate: "2027-12-31", evidenceKey: "registration-guideline" },
      { nrn: "A11-101341", batchNumber: "DEMO-AR-003", drugName: "AFRAB AZITHROMYCIN 500MG TABLETS", expiryDate: "2027-12-31", evidenceKey: "registration-guideline" },
    ],
  },
  {
    name: "Fidson Healthcare PLC",
    registrationNumber: "A11-0731",
    address: "KM 38 Lagos-Abeokuta Expressway, Sango-Ota, Ogun State, Nigeria",
    batches: [
      { nrn: "A11-0731", batchNumber: "DEMO-FH-001", drugName: "Forste Suspension — Azithromycin 200 mg/5 mL", expiryDate: "2027-12-31", evidenceKey: "registration-guideline" },
      { nrn: "A11-0731", batchNumber: "DEMO-FH-002", drugName: "Forste Suspension — Azithromycin 200 mg/5 mL", expiryDate: "2027-12-31", evidenceKey: "registration-guideline" },
      { nrn: "A11-0731", batchNumber: "DEMO-FH-003", drugName: "Forste Suspension — Azithromycin 200 mg/5 mL", expiryDate: "2027-12-31", evidenceKey: "registration-guideline" },
    ],
  },
];

type SeedTransaction = {
  action: string;
  hash: Hex;
  explorerUrl: string;
  batchId?: bigint;
  reportId?: bigint;
  tokenId?: bigint;
};

async function main() {
  if (!registryAddress || !credentialAddress) {
    throw new Error("DRUG_REGISTRY_ADDRESS and MANUFACTURER_CREDENTIAL_ADDRESS are required.");
  }
  if (!appUrl) {
    throw new Error("PUBLIC_APP_URL is required so the seed can emit real passport URLs.");
  }
  const publicAppUrl = appUrl.replace(/\/$/, "");
  if (confirmationPhrase !== "PHARMCHAIN-MAINNET") {
    throw new Error("Set SEED_CONFIRM=PHARMCHAIN-MAINNET after reviewing the mainnet preflight.");
  }

  const deployerKey = required("PRIVATE_KEY") as Hex;
  const manufacturerKeys = required("SEED_MANUFACTURER_PRIVATE_KEYS")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean) as Hex[];
  if (manufacturerKeys.length !== manufacturerSeeds.length) {
    throw new Error(`SEED_MANUFACTURER_PRIVATE_KEYS must contain exactly ${manufacturerSeeds.length} unique keys.`);
  }

  const publicClient = createPublicClient({ chain: monadMainnet, transport: http(rpcUrl) });
  const chainId = await publicClient.getChainId();
  if (chainId !== 143) throw new Error(`Refusing seed: RPC returned chain ${chainId}, expected 143.`);
  const [registryCode, credentialCode] = await Promise.all([
    publicClient.getCode({ address: registryAddress }),
    publicClient.getCode({ address: credentialAddress }),
  ]);
  if (!registryCode || registryCode === "0x") throw new Error("DrugRegistry has no bytecode at the configured address.");
  if (!credentialCode || credentialCode === "0x") throw new Error("ManufacturerCredential has no bytecode at the configured address.");

  const deployer = privateKeyToAccount(deployerKey);
  const manufacturers = manufacturerKeys.map((key) => privateKeyToAccount(key));
  const addresses = [deployer.address, ...manufacturers.map((account) => account.address)];
  if (new Set(addresses.map((address) => address.toLowerCase())).size !== addresses.length) {
    throw new Error("Deployer and manufacturer signer addresses must be unique.");
  }

  const deployerWallet = createWalletClient({ account: deployer, chain: monadMainnet, transport: http(rpcUrl) });
  const owner = await publicClient.readContract({
    address: credentialAddress,
    abi: MANUFACTURER_CREDENTIAL_ABI,
    functionName: "owner",
  });
  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    throw new Error("The deployment signer is not the ManufacturerCredential owner.");
  }
  const registryCredential = await publicClient.readContract({
    address: registryAddress,
    abi: DRUG_REGISTRY_ABI,
    functionName: "credentialContract",
  });
  if (registryCredential.toLowerCase() !== credentialAddress.toLowerCase()) {
    throw new Error("DrugRegistry points at a different ManufacturerCredential contract.");
  }
  const existingBatches = await publicClient.readContract({
    address: registryAddress,
    abi: DRUG_REGISTRY_ABI,
    functionName: "getTotalBatches",
  });
  if (existingBatches !== 0n) {
    throw new Error(`Refusing seed: registry already contains ${existingBatches.toString()} batches.`);
  }
  const existingReports = await publicClient.readContract({
    address: registryAddress,
    abi: DRUG_REGISTRY_ABI,
    functionName: "getTotalCounterfeitReports",
  });
  if (existingReports !== 0n) {
    throw new Error(`Refusing seed: registry already contains ${existingReports.toString()} counterfeit reports.`);
  }
  for (const account of manufacturers) {
    const verified = await publicClient.readContract({
      address: credentialAddress,
      abi: MANUFACTURER_CREDENTIAL_ABI,
      functionName: "isVerified",
      args: [account.address],
    });
    if (verified) throw new Error(`Manufacturer signer ${account.address} already has a credential.`);
  }
  const minimumBalance = 200_000_000_000_000_000n;
  for (const account of [deployer, ...manufacturers]) {
    const balance = await publicClient.getBalance({ address: account.address });
    if (balance < minimumBalance) {
      throw new Error(`Insufficient MON preflight balance for ${account.address}.`);
    }
  }

  const evidence = await uploadEvidence();
  const transactions: SeedTransaction[] = [];
  const batchRecords: Array<Record<string, unknown>> = [];
  const credentialIds: bigint[] = [];
  for (let index = 0; index < manufacturerSeeds.length; index += 1) {
    const seed = manufacturerSeeds[index];
    const mintHash = await send(
      deployerWallet,
      publicClient,
      {
        address: credentialAddress,
        abi: MANUFACTURER_CREDENTIAL_ABI,
        functionName: "mint",
        args: [manufacturers[index].address, seed.name, seed.registrationNumber, seed.address],
        chain: monadMainnet,
      },
      `mint credential ${seed.name}`,
    );
    const tokenId = await publicClient.readContract({
      address: credentialAddress,
      abi: MANUFACTURER_CREDENTIAL_ABI,
      functionName: "nextTokenId",
    }) - 1n;
    credentialIds.push(tokenId);
    transactions.push({ action: `mint credential ${seed.name}`, hash: mintHash, explorerUrl: explorerTx(mintHash), tokenId });

    for (const batch of seed.batches) {
      const signerWallet = createWalletClient({ account: manufacturers[index], chain: monadMainnet, transport: http(rpcUrl) });
      const hash = await send(
        signerWallet,
        publicClient,
        {
          address: registryAddress,
          abi: DRUG_REGISTRY_ABI,
          functionName: "attestBatch",
          args: [tokenId, batch.nrn, batch.batchNumber, batch.drugName, toUnix(batch.expiryDate), evidence.hash(batch.evidenceKey)],
          chain: monadMainnet,
        },
        `attest ${batch.batchNumber}`,
      );
      const batchId = await publicClient.readContract({
        address: registryAddress,
        abi: DRUG_REGISTRY_ABI,
        functionName: "getBatchId",
        args: [batch.nrn, batch.batchNumber],
      });
      transactions.push({ action: `attest ${batch.batchNumber}`, hash, explorerUrl: explorerTx(hash), batchId });
      batchRecords.push({ ...batch, tokenId, manufacturer: seed.name, manufacturerAddress: manufacturers[index].address, batchId: batchId.toString(), transactionHash: hash, explorerUrl: explorerTx(hash), evidenceKey: batch.evidenceKey, evidenceCid: evidence.cid(batch.evidenceKey) });
    }
  }

  const recallBatch = batchRecords.find((batch) => batch.batchNumber === "DC.319");
  if (!recallBatch || typeof recallBatch.batchId !== "string") throw new Error("Recall seed batch was not created.");
  const recallSignerIndex = manufacturerSeeds.findIndex((seed) => seed.name === "Me Cure Industries Limited");
  const recallWallet = createWalletClient({ account: manufacturers[recallSignerIndex], chain: monadMainnet, transport: http(rpcUrl) });
  const recallReason = "NAFDAC Public Alert 041/2022: substandard dexamethasone, batch DC.319, assay 88.6%.";
  const recallHash = await send(
    recallWallet,
    publicClient,
    { address: registryAddress, abi: DRUG_REGISTRY_ABI, functionName: "flagRecall", args: [BigInt(recallBatch.batchId), recallReason], chain: monadMainnet },
    "flag recalled dexamethasone batch",
  );
  transactions.push({ action: "flag recalled dexamethasone batch", hash: recallHash, explorerUrl: explorerTx(recallHash), batchId: BigInt(recallBatch.batchId) });

  const reporterWallet = createWalletClient({ account: manufacturers[0], chain: monadMainnet, transport: http(rpcUrl) });
  const counterfeitDetails = "NAFDAC Public Alert 05/2025: falsified Cikatem suspension batch ALS063 used NRN A11-100025, which belongs to the tablet formulation; same key, different presentation and stated facility. Source: https://nafdac.gov.ng/public-alert-no-05-2025-alert-on-the-circulation-of-falsified-cikatem-artemether-180mg-lumefantrine-1080mg-with-falsified-nafdac-registration-number-nrn-a11-100025/";
  const reportHash = await send(
    reporterWallet,
    publicClient,
    { address: registryAddress, abi: DRUG_REGISTRY_ABI, functionName: "flagCounterfeit", args: ["A11-100025", counterfeitDetails], chain: monadMainnet },
    "flag counterfeit Cikatem report",
  );
  const reportId = await publicClient.readContract({ address: registryAddress, abi: DRUG_REGISTRY_ABI, functionName: "nextReportId" }) - 1n;
  transactions.push({ action: "flag counterfeit Cikatem report", hash: reportHash, explorerUrl: explorerTx(reportHash), reportId });
  const validateHash = await send(
    deployerWallet,
    publicClient,
    { address: registryAddress, abi: DRUG_REGISTRY_ABI, functionName: "validateCounterfeit", args: [reportId, true], chain: monadMainnet },
    "validate counterfeit report",
  );
  transactions.push({ action: "validate counterfeit report", hash: validateHash, explorerUrl: explorerTx(validateHash), reportId });

  await mkdir(outputDirectory, { recursive: true });
  const uniqueNrns = [...new Set(manufacturerSeeds.flatMap((seed) => seed.batches.map((batch) => batch.nrn)))];
  const verifyUrls = uniqueNrns.map((nrn) => `${publicAppUrl}/verify/${encodeURIComponent(nrn)}`);
  for (let index = 0; index < uniqueNrns.length; index += 1) {
    await writeFile(resolve(outputDirectory, `${safeName(uniqueNrns[index])}.svg`), await QRCode.toString(verifyUrls[index], { type: "svg", width: 320, margin: 2 }));
  }
  const output = {
    chainId,
    network: "Monad Mainnet",
    contractAddresses: { manufacturerCredential: credentialAddress, drugRegistry: registryAddress },
    deployer: deployer.address,
    manufacturers: manufacturerSeeds.map((seed, index) => ({ name: seed.name, address: manufacturers[index].address, tokenId: credentialIds[index].toString() })),
    metrics: { manufacturerCredentials: credentialIds.length, batches: batchRecords.length, activeRecalls: 1, validatedCounterfeitFlags: 1, evidencePdfs: evidence.files.length },
    evidence: evidence.files,
    transactions,
    batchRecords,
    verifyUrls,
    qrFiles: uniqueNrns.map((nrn, index) => ({ nafdacNumber: nrn, url: verifyUrls[index], file: `${safeName(nrn)}.svg` })),
  };
  await writeFile(resolve(outputDirectory, "seed-output.json"), `${JSON.stringify(output, (_, value) => typeof value === "bigint" ? value.toString() : value, 2)}\n`);
  console.log(JSON.stringify({ outputDirectory, ...output.metrics, verifyUrls }, null, 2));
}

async function uploadEvidence() {
  const apiUrl = process.env.IPFS_API_URL?.trim();
  const apiKey = process.env.IPFS_API_KEY?.trim();
  if (!apiUrl) throw new Error("IPFS_API_URL is required; refusing to broadcast without evidence uploads.");
  const files: Array<Record<string, unknown>> = [];
  const hashes = new Map<string, Hex>();
  const cids = new Map<string, string>();
  for (const source of evidenceSources) {
    const response = await fetch(source.url);
    if (!response.ok) throw new Error(`Evidence download failed (${response.status}) for ${source.url}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    const digest = keccak256(bytes);
    const form = new FormData();
    form.append("file", new Blob([bytes], { type: "application/pdf" }), source.filename);
    const headers: Record<string, string> = {};
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
    const normalizedApiUrl = apiUrl.replace(/\/$/, "");
    const isPinata = normalizedApiUrl.includes("api.pinata.cloud");
    const uploadUrl = isPinata
      ? `${normalizedApiUrl}/pinning/pinFileToIPFS`
      : normalizedApiUrl.endsWith("/api/v0")
        ? `${normalizedApiUrl}/add?pin=true`
        : `${normalizedApiUrl}/api/v0/add?pin=true`;
    const uploadResponse = await fetch(uploadUrl, { method: "POST", headers, body: form });
    if (!uploadResponse.ok) throw new Error(`IPFS upload failed (${uploadResponse.status}) for ${source.filename}.`);
    const result = (await uploadResponse.json()) as { Hash?: string; cid?: string; IpfsHash?: string };
    const cid = result.Hash ?? result.cid ?? result.IpfsHash;
    if (!cid) throw new Error(`IPFS returned no CID for ${source.filename}.`);
    hashes.set(source.key, digest);
    cids.set(source.key, cid);
    files.push({ key: source.key, filename: source.filename, sourceUrl: source.url, keccak256: digest, cid, ipfsUrl: `https://ipfs.io/ipfs/${cid}` });
  }
  return { files, hash: (key: string) => {
    const value = hashes.get(key);
    if (!value) throw new Error(`Unknown evidence key ${key}.`);
    return value;
  }, cid: (key: string) => cids.get(key) };
}

type ContractRequest = {
  address: Address;
  abi: readonly unknown[];
  functionName: string;
  args: readonly unknown[];
  chain: typeof monadMainnet;
};

type WalletWriter = {
  writeContract: (request: ContractRequest) => Promise<Hex>;
};

async function send(
  wallet: ReturnType<typeof createWalletClient>,
  publicClient: ReturnType<typeof createPublicClient>,
  request: ContractRequest,
  label: string,
) {
  const hash = await (wallet as unknown as WalletWriter).writeContract(request);
  process.stdout.write(`${label}: ${hash}\n`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });
  if (receipt.status !== "success") throw new Error(`${label} reverted: ${hash}`);
  return hash;
}

function toUnix(value: string) {
  const timestamp = Math.floor(new Date(`${value}T00:00:00Z`).getTime() / 1000);
  if (!Number.isSafeInteger(timestamp) || timestamp <= 0) throw new Error(`Invalid expiry date ${value}.`);
  return BigInt(timestamp);
}

function explorerTx(hash: Hex) {
  return `https://monadscan.com/tx/${hash}`;
}

function safeName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function optionalAddress(name: string) {
  const value = process.env[name]?.trim();
  return value ? getAddress(value) : undefined;
}

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
