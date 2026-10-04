/**
 * Independent read-only evaluator for the PharmChain demo scenarios.
 *
 * It does not reuse the frontend status logic. It re-derives every claim from
 * live chain reads and official regulator responses, then fails loudly when the
 * product would mislead a judge.
 *
 * Usage:
 *   npm run verify:demo
 *
 * Optional environment:
 *   MONAD_RPC_URL                  default https://rpc.monad.xyz
 *   NEXT_PUBLIC_DRUG_REGISTRY_ADDRESS
 *   NEXT_PUBLIC_MANUFACTURER_CREDENTIAL_ADDRESS
 *   SKIP_REGULATOR_LOOKUP          set to "1" to skip official HTTP lookups
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createPublicClient, getAddress, http, parseAbi, type Address } from "viem";
import { monadMainnet, MONAD_MAINNET_ID } from "../lib/monad";
import { demoDisclosureFor } from "../lib/demo-disclosures";

const registryAbi = parseAbi([
  "function owner() view returns (address)",
  "function credentialContract() view returns (address)",
  "function paused() view returns (bool)",
  "function MAX_TEXT_LENGTH() view returns (uint256)",
  "function MAX_DETAILS_LENGTH() view returns (uint256)",
  "function MAX_PASSPORT_ITEMS() view returns (uint256)",
  "function getTotalBatches() view returns (uint256)",
  "function getTotalCounterfeitReports() view returns (uint256)",
  "function getDrugPassport(string) view returns ((bool,string,uint256,uint256,uint256,uint256,uint256),uint256[],uint256[])",
  "function getBatch(uint256) view returns ((uint256,uint256,address,string,string,string,uint256,bytes32,address,uint256,bool,string,uint256,address))",
  "function getCounterfeitReport(uint256) view returns ((uint256,string,string,address,uint256,bool,bool,address,uint256))",
]);

const credentialAbi = parseAbi([
  "function owner() view returns (address)",
  "function paused() view returns (bool)",
  "function nextTokenId() view returns (uint256)",
  "function isVerified(address) view returns (bool)",
  "function getCredential(uint256) view returns ((string,string,string,address,bool,uint64,uint64))",
]);

type PassportTuple = readonly [
  readonly [boolean, string, bigint, bigint, bigint, bigint, bigint],
  readonly bigint[],
  readonly bigint[],
];

type BatchTuple = readonly [
  bigint,
  bigint,
  Address,
  string,
  string,
  string,
  bigint,
  `0x${string}`,
  Address,
  bigint,
  boolean,
  string,
  bigint,
  Address,
];

type ReportTuple = readonly [
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

type Finding = { check: string; expected: string; observed: string; ok: boolean };
type Advisory = { check: string; detail: string };

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;
const ZERO_HASH = `0x${"0".repeat(64)}` as `0x${string}`;
const NOW = BigInt(Math.floor(Date.now() / 1000));

type ScenarioExpectation = {
  key: string;
  nrn: string;
  expectedState: "VERIFIED" | "RECALLED" | "COUNTERFEIT_FLAGGED";
};

const scenarios: ScenarioExpectation[] = [
  { key: "A4_0425", nrn: "A4-0425", expectedState: "VERIFIED" },
  { key: "A4_0426", nrn: "A4-0426", expectedState: "RECALLED" },
  { key: "A4_0427", nrn: "A4-0427", expectedState: "COUNTERFEIT_FLAGGED" },
];

const findings: Finding[] = [];
const scenarioResults: Record<string, unknown> = {};

function record(check: string, expected: string, observed: string, ok: boolean) {
  findings.push({ check, expected, observed, ok });
}

const advisories: Advisory[] = [];

function advise(check: string, detail: string) {
  advisories.push({ check, detail });
}

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function namesOverlap(a: string, b: string) {
  const left = new Set(normalizeName(a).split(" ").filter(Boolean));
  const right = normalizeName(b).split(" ").filter(Boolean);
  if (left.size === 0 || right.length === 0) return false;
  return right.some((token) => left.has(token));
}

function same(a: string, b: string) {
  return a.toLowerCase() === b.toLowerCase();
}

async function readSeedAddresses() {
  const seed = JSON.parse(await readFile("demo/seed/seed-output.json", "utf8")) as {
    contractAddresses: { drugRegistry: string; manufacturerCredential: string };
  };
  return seed.contractAddresses;
}

async function resolveAddresses() {
  const fromEnvRegistry = process.env.NEXT_PUBLIC_DRUG_REGISTRY_ADDRESS?.trim();
  const fromEnvCredential =
    process.env.NEXT_PUBLIC_MANUFACTURER_CREDENTIAL_ADDRESS?.trim();
  const fromSeed = await readSeedAddresses();
  return {
    registry: getAddress(fromEnvRegistry || fromSeed.drugRegistry),
    credential: getAddress(fromEnvCredential || fromSeed.manufacturerCredential),
    addressSource: fromEnvRegistry && fromEnvCredential ? "environment" : "demo/seed/seed-output.json",
  };
}

/**
 * Re-implemented independently from the frontend so a UI regression cannot hide
 * a wrong on-chain claim.
 */
function deriveState(
  passport: PassportTuple[0],
  batches: BatchTuple[],
  reports: ReportTuple[],
): "VERIFIED" | "RECALLED" | "COUNTERFEIT_FLAGGED" | "REVIEW" {
  if (passport[6] > 0n || reports.some((r) => r[5] && r[6])) return "COUNTERFEIT_FLAGGED";
  if (passport[3] > 0n || batches.some((b) => b[10])) return "RECALLED";
  if (passport[5] > 0n || batches.some((b) => b[6] <= NOW)) return "REVIEW";
  return "VERIFIED";
}

async function regulatorLookup(nrn: string) {
  const base = process.env.PUBLIC_APP_URL?.trim() || "https://pharmchain.vercel.app";
  const url = new URL(`${base.replace(/\/$/, "")}/api/products/lookup`);
  url.search = new URLSearchParams({ registry: "nafdac", id: nrn }).toString();
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) {
    return { reachable: false, products: 0, source: "unavailable", note: `status ${response.status}` };
  }
  const payload = (await response.json()) as {
    products?: unknown[];
    source?: string;
    sourceUrl?: string;
    error?: string;
  };
  return {
    reachable: true,
    products: Array.isArray(payload.products) ? payload.products.length : 0,
    productNames: Array.isArray(payload.products)
      ? payload.products
          .map((product) => (product as { name?: string }).name ?? "")
          .filter(Boolean)
      : [],
    source: payload.source ?? "unknown",
    sourceUrl: payload.sourceUrl ?? "",
    note: payload.error ?? "",
  };
}

async function main() {
  const rpcUrl = process.env.MONAD_RPC_URL?.trim() || "https://rpc.monad.xyz";
  const { registry, credential, addressSource } = await resolveAddresses();
  const client = createPublicClient({ chain: monadMainnet, transport: http(rpcUrl) });

  const chainId = await client.getChainId();
  record("rpc chain id", String(MONAD_MAINNET_ID), String(chainId), chainId === MONAD_MAINNET_ID);

  const [registryCode, credentialCode] = await Promise.all([
    client.getCode({ address: registry }),
    client.getCode({ address: credential }),
  ]);
  record("registry bytecode present", "non-empty", registryCode && registryCode !== "0x" ? "present" : "missing", Boolean(registryCode && registryCode !== "0x"));
  record("credential bytecode present", "non-empty", credentialCode && credentialCode !== "0x" ? "present" : "missing", Boolean(credentialCode && credentialCode !== "0x"));

  const [registryOwner, linkedCredential, registryPaused, credentialOwner, credentialPaused] =
    await Promise.all([
      client.readContract({ address: registry, abi: registryAbi, functionName: "owner" }),
      client.readContract({ address: registry, abi: registryAbi, functionName: "credentialContract" }),
      client.readContract({ address: registry, abi: registryAbi, functionName: "paused" }),
      client.readContract({ address: credential, abi: credentialAbi, functionName: "owner" }),
      client.readContract({ address: credential, abi: credentialAbi, functionName: "paused" }),
    ]);

  record("registry owner is set", "non-zero address", registryOwner, !same(registryOwner, ZERO_ADDRESS));
  record("registry not paused", "false", String(registryPaused), registryPaused === false);
  record("registry points at credential contract", credential, linkedCredential, same(linkedCredential, credential));
  record("credential owner matches registry owner", registryOwner, credentialOwner, same(credentialOwner, registryOwner));
  record("credential not paused", "false", String(credentialPaused), credentialPaused === false);

  const [totalBatches, totalReports, nextTokenId, maxText, maxDetails, maxItems] =
    await Promise.all([
      client.readContract({ address: registry, abi: registryAbi, functionName: "getTotalBatches" }),
      client.readContract({ address: registry, abi: registryAbi, functionName: "getTotalCounterfeitReports" }),
      client.readContract({ address: credential, abi: credentialAbi, functionName: "nextTokenId" }),
      client.readContract({ address: registry, abi: registryAbi, functionName: "MAX_TEXT_LENGTH" }),
      client.readContract({ address: registry, abi: registryAbi, functionName: "MAX_DETAILS_LENGTH" }),
      client.readContract({ address: registry, abi: registryAbi, functionName: "MAX_PASSPORT_ITEMS" }),
    ]);

  record("seeded batches present", ">= 1", totalBatches.toString(), totalBatches > 0n);
  record("seeded reports present", ">= 1", totalReports.toString(), totalReports > 0n);
  record("manufacturer credentials minted", ">= 1", (nextTokenId - 1n).toString(), nextTokenId > 1n);

  const regulatorSkipped = process.env.SKIP_REGULATOR_LOOKUP?.trim() === "1";

  for (const scenario of scenarios) {
    const passport = (await client.readContract({
      address: registry,
      abi: registryAbi,
      functionName: "getDrugPassport",
      args: [scenario.nrn],
    })) as PassportTuple;

    record(`${scenario.key}: passport exists`, "true", String(passport[0][0]), passport[0][0] === true);
    record(`${scenario.key}: canonical key matches`, scenario.nrn, passport[0][1], passport[0][1] === scenario.nrn);

    const batchIds = passport[1];
    const reportIds = passport[2];
    record(
      `${scenario.key}: counts agree with id lists`,
      `batchCount=${passport[0][2]}, reports=${passport[0][4]}`,
      `batchIds=${batchIds.length}, reportIds=${reportIds.length}`,
      passport[0][2] === BigInt(batchIds.length) && passport[0][4] === BigInt(reportIds.length),
    );
    record(
      `${scenario.key}: passport id cap respected`,
      `<= ${maxItems}`,
      String(batchIds.length + reportIds.length),
      BigInt(batchIds.length + reportIds.length) <= maxItems,
    );

    const batches = (await Promise.all(
      batchIds.map((id) =>
        client.readContract({ address: registry, abi: registryAbi, functionName: "getBatch", args: [id] }) as Promise<BatchTuple>,
      ),
    )) as BatchTuple[];
    const reports = (await Promise.all(
      reportIds.map((id) =>
        client.readContract({ address: registry, abi: registryAbi, functionName: "getCounterfeitReport", args: [id] }) as Promise<ReportTuple>,
      ),
    )) as ReportTuple[];

    for (const batch of batches) {
      const label = `${scenario.key}: batch ${batch[0]}`;
      record(`${label} has evidence hash`, "non-zero bytes32", batch[7] === ZERO_HASH ? "zero" : "present", batch[7] !== ZERO_HASH);
      record(`${label} nrn matches passport`, scenario.nrn, batch[3], batch[3] === scenario.nrn);
      record(`${label} attestor is set`, "non-zero address", batch[8], !same(batch[8], ZERO_ADDRESS));
      record(`${label} attestor is manufacturer`, batch[2], batch[8], same(batch[2], batch[8]));
      record(
        `${label} text within MAX_TEXT_LENGTH`,
        `<= ${maxText}`,
        `name=${new TextEncoder().encode(batch[5]).length}, batch=${new TextEncoder().encode(batch[4]).length}`,
        new TextEncoder().encode(batch[5]).length <= maxText && new TextEncoder().encode(batch[4]).length <= maxText,
      );
      const credentialActive = await client.readContract({
        address: credential,
        abi: credentialAbi,
        functionName: "isVerified",
        args: [batch[2]],
      });
      record(`${label} manufacturer credential active`, "true", String(credentialActive), credentialActive === true);
      if (batch[10]) {
        record(`${label} recall has a reason`, "non-empty", batch[11] || "empty", batch[11].trim().length > 0);
        record(`${label} recall recorded at`, "> 0", batch[12].toString(), batch[12] > 0n);
        record(
          `${label} recall authority is batch owner or registry owner`,
          "batch manufacturer or registry owner",
          `${batch[13]} (registry owner ${registryOwner})`,
          same(batch[13], batch[2]) || same(batch[13], registryOwner),
        );
      }
    }

    for (const report of reports) {
      const label = `${scenario.key}: report ${report[0]}`;
      record(`${label} nrn matches passport`, scenario.nrn, report[1], report[1] === scenario.nrn);
      record(`${label} reporter is set`, "non-zero address", report[3], !same(report[3], ZERO_ADDRESS));
      record(
        `${label} details within MAX_DETAILS_LENGTH`,
        `<= ${maxDetails}`,
        String(new TextEncoder().encode(report[2]).length),
        new TextEncoder().encode(report[2]).length <= maxDetails,
      );
      if (report[5]) {
        record(`${label} validator is registry owner`, registryOwner, report[7], same(report[7], registryOwner));
        record(`${label} validated timestamp`, "> 0", report[8].toString(), report[8] > 0n);
      }
    }

    const derived = deriveState(passport[0], batches, reports);
    record(`${scenario.key}: derived state`, scenario.expectedState, derived, derived === scenario.expectedState);

    let regulator: Record<string, unknown> = { skipped: true };
    if (!regulatorSkipped) {
      try {
        regulator = await regulatorLookup(scenario.nrn);
        const ok = regulator.reachable === true;
        record(
          `${scenario.key}: official regulator adapter answers`,
          "HTTP 200 with product list",
          ok ? `${regulator.products} product(s) from ${regulator.source}` : `unreachable (${regulator.note})`,
          ok,
        );
        if (ok && typeof regulator.products === "number" && regulator.products > 0) {
          const officialNames = Array.isArray(regulator.productNames)
            ? (regulator.productNames as string[])
            : [];
          for (const officialName of officialNames) {
            const claims: string[] = [
              ...batches.map((b) => b[5]),
              ...reports.map((r) => r[2]),
            ];
            const conflicting = claims.filter((claim) => !namesOverlap(claim, officialName));
            if (claims.length > 0 && conflicting.length === claims.length) {
              const disclosed = demoDisclosureFor(scenario.nrn);
              const detail = `The NAFDAC Green Book lists ${scenario.nrn} as "${officialName}" (${regulator.sourceUrl}), but the on-chain demo records under that key describe: ${conflicting.map((c) => `"${c.slice(0, 120)}${c.length > 120 ? "…" : ""}"`).join(" · ")}.`;
              if (disclosed) {
                advise(
                  `${scenario.key}: disclosed demo key on a real registration`,
                  `${detail} This collision is registered in lib/demo-disclosures.ts and disclosed on the passport, so it is an acknowledged limitation rather than an open finding.`,
                );
              } else {
                record(
                  `${scenario.key}: demo key collides with a real registration and is NOT disclosed`,
                  "a disclosure registered in lib/demo-disclosures.ts",
                  `official record is "${officialName}" with no matching disclosure`,
                  false,
                );
              }
            }
          }
        }
      } catch (error) {
        regulator = { reachable: false, error: String(error) };
        record(`${scenario.key}: official regulator adapter answers`, "HTTP 200 with product list", `error: ${String(error)}`, false);
      }
    }

    scenarioResults[scenario.key] = {
      nrn: scenario.nrn,
      expectedState: scenario.expectedState,
      derivedState: derived,
      batchCount: passport[0][2].toString(),
      recalledCount: passport[0][3].toString(),
      reportCount: passport[0][4].toString(),
      pendingReportCount: passport[0][5].toString(),
      validatedCounterfeitCount: passport[0][6].toString(),
      batches: batches.map((b) => ({
        batchId: b[0].toString(),
        batchNumber: b[4],
        drugName: b[5],
        manufacturer: b[2],
        recalled: b[10],
        recallReason: b[11] || null,
        evidenceHash: b[7],
      })),
      reports: reports.map((r) => ({
        reportId: r[0].toString(),
        reporter: r[3],
        validated: r[5],
        isCounterfeit: r[6],
      })),
      regulatorLookup: regulator,
    };
  }

  if (regulatorSkipped) {
    record("regulator lookups executed", "yes", "skipped via SKIP_REGULATOR_LOOKUP=1", false);
  }

  const failed = findings.filter((f) => !f.ok);
  const report = {
    evaluator: "scripts/verify-demo.ts",
    chainId,
    network: monadMainnet.name,
    rpcUrl,
    addresses: { registry, credential, addressSource },
    totals: {
      batches: totalBatches.toString(),
      counterfeitReports: totalReports.toString(),
      manufacturerCredentials: (nextTokenId - 1n).toString(),
    },
    limits: {
      MAX_TEXT_LENGTH: maxText.toString(),
      MAX_DETAILS_LENGTH: maxDetails.toString(),
      MAX_PASSPORT_ITEMS: maxItems.toString(),
    },
    scenarios: scenarioResults,
    findings,
    advisories,
    passed: findings.length - failed.length,
    failed: failed.length,
    advisoryCount: advisories.length,
    ok: failed.length === 0,
    generatedAt: new Date().toISOString(),
  };

  for (const finding of findings) {
    const mark = finding.ok ? "PASS" : "FAIL";
    console.log(`${mark}  ${finding.check} — expected ${finding.expected}, observed ${finding.observed}`);
  }

  console.log("");
  console.log(`PharmChain evaluator: ${report.passed} passed, ${report.failed} failed, ${advisories.length} advisory.`);

  for (const advisory of advisories) {
    console.log("");
    console.log(`DISCLOSURE REQUIRED  ${advisory.check}`);
    console.log(`  ${advisory.detail}`);
  }

  if (advisories.length > 0) {
    console.log("");
    console.log("Advisories do not fail the run, but each one must be disclosed in the submission.");
  }

  if (!process.env.NO_WRITE_REPORT) {
    await mkdir("demo/verify", { recursive: true });
    await writeFile("demo/verify/demo-verification.json", `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log("Report written to demo/verify/demo-verification.json");
  }

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`Evaluator failed to run: ${String(error)}`);
  process.exitCode = 1;
});
