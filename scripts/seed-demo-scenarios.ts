import { mkdir, readFile, writeFile } from "node:fs/promises";
import {
  createPublicClient,
  createWalletClient,
  getAddress,
  http,
  parseAbi,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { monadMainnet } from "../lib/monad";

const registryAbi = parseAbi([
  "function owner() view returns (address)",
  "function credentialContract() view returns (address)",
  "function getTotalBatches() view returns (uint256)",
  "function getTotalCounterfeitReports() view returns (uint256)",
  "function getDrugPassport(string) view returns ((bool,string,uint256,uint256,uint256,uint256,uint256),uint256[],uint256[])",
  "function getBatchId(string,string) view returns (uint256)",
  "function getBatch(uint256) view returns ((uint256,uint256,address,string,string,string,uint256,bytes32,address,uint256,bool,string,uint256,address))",
  "function getCounterfeitReport(uint256) view returns ((uint256,string,string,address,uint256,bool,bool,address,uint256))",
  "function attestBatch(uint256,string,string,string,uint256,bytes32) returns (uint256)",
  "function flagRecall(uint256,string)",
  "function flagCounterfeit(string,string) returns (uint256)",
  "function validateCounterfeit(uint256,bool)",
]);

const credentialAbi = parseAbi([
  "function owner() view returns (address)",
  "function nextTokenId() view returns (uint256)",
  "function isVerified(address) view returns (bool)",
  "function manufacturerOf(uint256) view returns (address)",
  "function mint(address,string,string,string) returns (uint256)",
]);

type Passport = readonly [
  readonly [boolean, string, bigint, bigint, bigint, bigint, bigint],
  readonly bigint[],
  readonly bigint[],
];

type Batch = readonly [
  bigint,
  bigint,
  Address,
  string,
  string,
  string,
  bigint,
  Hex,
  Address,
  bigint,
  boolean,
  string,
  bigint,
  Address,
];

type Report = readonly [
  bigint,
  string,
  string,
  Address,
  bigint,
  boolean,
  boolean,
  Address,
  bigint,
];

type DemoTransaction = {
  action: string;
  hash: Hex;
  explorerUrl: string;
  batchId?: string;
  reportId?: string;
  credentialId?: string;
};

const rpcUrl = process.env.MONAD_RPC_URL?.trim() || "https://rpc.monad.xyz";
const registryAddress = getAddress(required("DRUG_REGISTRY_ADDRESS"));
const credentialAddress = getAddress(required("MANUFACTURER_CREDENTIAL_ADDRESS"));
const appUrl = required("PUBLIC_APP_URL").replace(/\/$/, "");
const deployerKey = required("PRIVATE_KEY") as Hex;
const fidsonKey = required("FIDSON_PRIVATE_KEY") as Hex;

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function explorerTx(hash: Hex) {
  return `https://monadscan.com/tx/${hash}`;
}

function expirySeconds() {
  return BigInt(Math.floor(Date.now() / 1000) + 31536000);
}

async function main() {
  if (process.env.SEED_CONFIRM?.trim() !== "PHARMCHAIN-DEMO-SCENARIOS") {
    throw new Error("Set SEED_CONFIRM=PHARMCHAIN-DEMO-SCENARIOS for this mainnet demo seeder.");
  }

  const publicClient = createPublicClient({ chain: monadMainnet, transport: http(rpcUrl) });
  const chainId = await publicClient.getChainId();
  if (chainId !== 143) throw new Error(`Refusing to seed: RPC chain is ${chainId}, expected 143.`);

  const [registryCode, credentialCode] = await Promise.all([
    publicClient.getCode({ address: registryAddress }),
    publicClient.getCode({ address: credentialAddress }),
  ]);
  if (!registryCode || registryCode === "0x") throw new Error("DrugRegistry has no bytecode.");
  if (!credentialCode || credentialCode === "0x") throw new Error("ManufacturerCredential has no bytecode.");

  const deployer = privateKeyToAccount(deployerKey);
  const fidson = privateKeyToAccount(fidsonKey);
  if (deployer.address.toLowerCase() === fidson.address.toLowerCase()) {
    throw new Error("Deployer and Fidson signer must be different wallets.");
  }

  const owner = await publicClient.readContract({ address: registryAddress, abi: registryAbi, functionName: "owner" });
  if (owner.toLowerCase() !== deployer.address.toLowerCase()) throw new Error("Deployer is not the registry owner.");
  const linkedCredential = await publicClient.readContract({ address: registryAddress, abi: registryAbi, functionName: "credentialContract" });
  if (linkedCredential.toLowerCase() !== credentialAddress.toLowerCase()) throw new Error("Registry points at a different credential contract.");

  for (const nrn of ["A4-0425", "A4-0426", "A4-0427"]) {
    const passport = await publicClient.readContract({ address: registryAddress, abi: registryAbi, functionName: "getDrugPassport", args: [nrn] }) as Passport;
    if (passport[0][0]) throw new Error(`${nrn} already exists; refusing to duplicate the demo scenarios.`);
  }

  const seedOutput = JSON.parse(await readFile("demo/seed/seed-output.json", "utf8")) as {
    evidence: Array<{ key: string; keccak256: Hex }>;
  };
  const evidence = Object.fromEntries(seedOutput.evidence.map((entry) => [entry.key, entry.keccak256]));
  const registrationHash = evidence["registration-guideline"];
  const recallHash = evidence["recall-guideline"];
  if (!registrationHash || !recallHash) throw new Error("Existing evidence manifest is incomplete.");

  const nextTokenId = await publicClient.readContract({ address: credentialAddress, abi: credentialAbi, functionName: "nextTokenId" });
  let emzorCredentialId = await findCredentialId(publicClient, nextTokenId, deployer.address);
  const transactions: DemoTransaction[] = [];
  const deployerWallet = createWalletClient({ account: deployer, chain: monadMainnet, transport: http(rpcUrl) });
  const fidsonWallet = createWalletClient({ account: fidson, chain: monadMainnet, transport: http(rpcUrl) });

  if (emzorCredentialId === 0n) {
    const mintHash = await send(deployerWallet, publicClient, {
      address: credentialAddress,
      abi: credentialAbi,
      functionName: "mint",
      args: [deployer.address, "Emzor Nigeria Ltd", "A4-0425", "Demo-only manufacturer record — not a regulatory address"],
    }, "mint Emzor demo credential");
    emzorCredentialId = nextTokenId;
    transactions.push({ action: "mint Emzor demo credential", hash: mintHash, explorerUrl: explorerTx(mintHash), credentialId: emzorCredentialId.toString() });
  }

  const fidsonCredentialId = await findCredentialId(publicClient, nextTokenId, fidson.address);
  if (fidsonCredentialId === 0n) throw new Error("Fidson credential was not found for the configured signer.");

  const verifiedBatchNumber = "DEMO-EMZOR-0425";
  const verifiedHash = await send(deployerWallet, publicClient, {
    address: registryAddress,
    abi: registryAbi,
    functionName: "attestBatch",
    args: [emzorCredentialId, "A4-0425", verifiedBatchNumber, "Paracetamol 500 mg — Emzor Nigeria Ltd (demo)", expirySeconds(), registrationHash],
  }, "attest A4-0425 verified paracetamol demo batch");
  const verifiedBatchId = await publicClient.readContract({ address: registryAddress, abi: registryAbi, functionName: "getBatchId", args: ["A4-0425", verifiedBatchNumber] });
  transactions.push({ action: "attest A4-0425 verified paracetamol demo batch", hash: verifiedHash, explorerUrl: explorerTx(verifiedHash), batchId: verifiedBatchId.toString() });

  const recalledBatchNumber = "DEMO-FIDSON-0426";
  const recalledHash = await send(fidsonWallet, publicClient, {
    address: registryAddress,
    abi: registryAbi,
    functionName: "attestBatch",
    args: [fidsonCredentialId, "A4-0426", recalledBatchNumber, "Amoxicillin 500 mg — Fidson Healthcare PLC (demo)", expirySeconds(), recallHash],
  }, "attest A4-0426 recalled amoxicillin demo batch");
  const recalledBatchId = await publicClient.readContract({ address: registryAddress, abi: registryAbi, functionName: "getBatchId", args: ["A4-0426", recalledBatchNumber] });
  transactions.push({ action: "attest A4-0426 recalled amoxicillin demo batch", hash: recalledHash, explorerUrl: explorerTx(recalledHash), batchId: recalledBatchId.toString() });

  const recallReason = "Elevated impurity levels detected in batch QA sample (demo scenario).";
  const recallFlagHash = await send(fidsonWallet, publicClient, {
    address: registryAddress,
    abi: registryAbi,
    functionName: "flagRecall",
    args: [recalledBatchId, recallReason],
  }, "flag A4-0426 demo recall");
  transactions.push({ action: "flag A4-0426 demo recall", hash: recallFlagHash, explorerUrl: explorerTx(recallFlagHash), batchId: recalledBatchId.toString() });

  const counterfeitDetails = "DEMO SCENARIO: Unverified Labs Ltd claims the same product key as the verified Emzor Nigeria Ltd paracetamol batch under A4-0425. The registry keeps the claims separate and flags the duplicate manufacturer claim.";
  const reportCountBefore = await publicClient.readContract({ address: registryAddress, abi: registryAbi, functionName: "getTotalCounterfeitReports" });
  const reportHash = await send(fidsonWallet, publicClient, {
    address: registryAddress,
    abi: registryAbi,
    functionName: "flagCounterfeit",
    args: ["A4-0427", counterfeitDetails],
  }, "flag A4-0427 demo counterfeit claim");
  const reportId = reportCountBefore + 1n;
  transactions.push({ action: "flag A4-0427 demo counterfeit claim", hash: reportHash, explorerUrl: explorerTx(reportHash), reportId: reportId.toString() });

  const validationHash = await send(deployerWallet, publicClient, {
    address: registryAddress,
    abi: registryAbi,
    functionName: "validateCounterfeit",
    args: [reportId, true],
  }, "validate A4-0427 demo counterfeit report");
  transactions.push({ action: "validate A4-0427 demo counterfeit report", hash: validationHash, explorerUrl: explorerTx(validationHash), reportId: reportId.toString() });

  const verifiedPassport = await publicClient.readContract({ address: registryAddress, abi: registryAbi, functionName: "getDrugPassport", args: ["A4-0425"] }) as Passport;
  const recalledPassport = await publicClient.readContract({ address: registryAddress, abi: registryAbi, functionName: "getDrugPassport", args: ["A4-0426"] }) as Passport;
  const counterfeitPassport = await publicClient.readContract({ address: registryAddress, abi: registryAbi, functionName: "getDrugPassport", args: ["A4-0427"] }) as Passport;
  const recalledBatch = await publicClient.readContract({ address: registryAddress, abi: registryAbi, functionName: "getBatch", args: [recalledBatchId] }) as Batch;
  const report = await publicClient.readContract({ address: registryAddress, abi: registryAbi, functionName: "getCounterfeitReport", args: [reportId] }) as Report;

  if (!verifiedPassport[0][0] || verifiedPassport[0][2] !== 1n || verifiedPassport[0][4] !== 0n) throw new Error("A4-0425 did not settle as a verified demo passport.");
  if (!recalledPassport[0][0] || recalledPassport[0][3] !== 1n || !recalledBatch[10]) throw new Error("A4-0426 did not settle as a recalled demo passport.");
  if (!counterfeitPassport[0][0] || counterfeitPassport[0][6] !== 1n || !report[5] || !report[6]) throw new Error("A4-0427 did not settle as a counterfeit-flagged demo passport.");

  await mkdir("demo/seed", { recursive: true });
  const output = {
    demo: true,
    chainId,
    contractAddresses: { manufacturerCredential: credentialAddress, drugRegistry: registryAddress },
    scenarios: {
      A4_0425: { state: "VERIFIED", batchId: verifiedBatchId.toString(), verifyUrl: `${appUrl}/verify/A4-0425` },
      A4_0426: { state: "RECALLED", batchId: recalledBatchId.toString(), verifyUrl: `${appUrl}/verify/A4-0426` },
      A4_0427: { state: "COUNTERFEIT_FLAGGED", reportId: reportId.toString(), verifyUrl: `${appUrl}/verify/A4-0427` },
    },
    transactions,
    onChainChecks: { verifiedPassport, recalledPassport, counterfeitPassport, recalledBatch, report },
  };
  await writeFile("demo/seed/demo-scenarios-output.json", `${JSON.stringify(output, (_, value) => typeof value === "bigint" ? value.toString() : value, 2)}\n`);
  console.log(JSON.stringify({ demo: true, scenarios: output.scenarios, transactions: transactions.length }, null, 2));
}

async function findCredentialId(client: ReturnType<typeof createPublicClient>, nextTokenId: bigint, address: Address) {
  for (let tokenId = 1n; tokenId < nextTokenId; tokenId += 1n) {
    const manufacturer = await client.readContract({ address: credentialAddress, abi: credentialAbi, functionName: "manufacturerOf", args: [tokenId] });
    if (manufacturer.toLowerCase() === address.toLowerCase()) return tokenId;
  }
  return 0n;
}

async function send(
  wallet: ReturnType<typeof createWalletClient>,
  client: ReturnType<typeof createPublicClient>,
  request: { address: Address; abi: unknown; functionName: string; args: readonly unknown[] },
  label: string,
) {
  const hash = await wallet.writeContract(request as never) as Hex;
  process.stdout.write(`${label}: ${hash}\n`);
  const receipt = await client.waitForTransactionReceipt({ hash, confirmations: 1 });
  if (receipt.status !== "success") throw new Error(`${label} reverted: ${hash}`);
  return hash;
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
