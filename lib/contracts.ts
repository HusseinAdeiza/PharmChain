import { getAddress, isAddress, type Abi, type Address } from "viem";

const passportComponents = [
  { name: "exists", type: "bool" },
  { name: "nafdacNumber", type: "string" },
  { name: "batchCount", type: "uint256" },
  { name: "recalledCount", type: "uint256" },
  { name: "counterfeitReportCount", type: "uint256" },
  { name: "pendingReportCount", type: "uint256" },
  { name: "validatedCounterfeitCount", type: "uint256" },
] as const;

const batchComponents = [
  { name: "batchId", type: "uint256" },
  { name: "manufacturerId", type: "uint256" },
  { name: "manufacturer", type: "address" },
  { name: "nafdacNumber", type: "string" },
  { name: "batchNumber", type: "string" },
  { name: "drugName", type: "string" },
  { name: "expiryDate", type: "uint256" },
  { name: "evidenceHash", type: "bytes32" },
  { name: "attestedBy", type: "address" },
  { name: "attestedAt", type: "uint256" },
  { name: "recalled", type: "bool" },
  { name: "recallReason", type: "string" },
  { name: "recalledAt", type: "uint256" },
  { name: "recalledBy", type: "address" },
] as const;

const counterfeitReportComponents = [
  { name: "reportId", type: "uint256" },
  { name: "nafdacNumber", type: "string" },
  { name: "details", type: "string" },
  { name: "reporter", type: "address" },
  { name: "reportedAt", type: "uint256" },
  { name: "validated", type: "bool" },
  { name: "isCounterfeit", type: "bool" },
  { name: "validator", type: "address" },
  { name: "validatedAt", type: "uint256" },
] as const;

export const DRUG_REGISTRY_ABI = [
  {
    type: "constructor",
    inputs: [{ name: "credentialAddress", type: "address" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "attestBatch",
    stateMutability: "nonpayable",
    inputs: [
      { name: "manufacturerId", type: "uint256" },
      { name: "nafdacNumber", type: "string" },
      { name: "batchNumber", type: "string" },
      { name: "drugName", type: "string" },
      { name: "expiryDate", type: "uint256" },
      { name: "evidenceHash", type: "bytes32" },
    ],
    outputs: [{ name: "batchId", type: "uint256" }],
  },
  {
    type: "function",
    name: "flagRecall",
    stateMutability: "nonpayable",
    inputs: [
      { name: "batchId", type: "uint256" },
      { name: "reason", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "flagCounterfeit",
    stateMutability: "nonpayable",
    inputs: [
      { name: "nafdacNumber", type: "string" },
      { name: "details", type: "string" },
    ],
    outputs: [{ name: "reportId", type: "uint256" }],
  },
  {
    type: "function",
    name: "validateCounterfeit",
    stateMutability: "nonpayable",
    inputs: [
      { name: "reportId", type: "uint256" },
      { name: "isCounterfeit", type: "bool" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "getDrugPassport",
    stateMutability: "view",
    inputs: [{ name: "nafdacNumber", type: "string" }],
    outputs: [
      { name: "passport", type: "tuple", components: passportComponents },
      { name: "batchIds", type: "uint256[]" },
      { name: "reportIds", type: "uint256[]" },
    ],
  },
  {
    type: "function",
    name: "getBatch",
    stateMutability: "view",
    inputs: [{ name: "batchId", type: "uint256" }],
    outputs: [{ name: "", type: "tuple", components: batchComponents }],
  },
  {
    type: "function",
    name: "getCounterfeitReport",
    stateMutability: "view",
    inputs: [{ name: "reportId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: counterfeitReportComponents,
      },
    ],
  },
  {
    type: "function",
    name: "getBatchPage",
    stateMutability: "view",
    inputs: [
      { name: "nafdacNumber", type: "string" },
      { name: "offset", type: "uint256" },
      { name: "limit", type: "uint256" },
    ],
    outputs: [
      { name: "page", type: "tuple[]", components: batchComponents },
      { name: "nextOffset", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "getCounterfeitReportPage",
    stateMutability: "view",
    inputs: [
      { name: "nafdacNumber", type: "string" },
      { name: "offset", type: "uint256" },
      { name: "limit", type: "uint256" },
    ],
    outputs: [
      {
        name: "page",
        type: "tuple[]",
        components: counterfeitReportComponents,
      },
      { name: "nextOffset", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "getTotalBatches",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "getTotalCounterfeitReports",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "getBatchId",
    stateMutability: "view",
    inputs: [
      { name: "nafdacNumber", type: "string" },
      { name: "batchNumber", type: "string" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "pause",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "unpause",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "owner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "renounceOwnership",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "transferOwnership",
    stateMutability: "nonpayable",
    inputs: [{ name: "newOwner", type: "address" }],
    outputs: [],
  },
  {
    type: "function",
    name: "paused",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "credentialContract",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "MAX_TEXT_LENGTH",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "MAX_DETAILS_LENGTH",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "MAX_PASSPORT_ITEMS",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "nextBatchId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "nextReportId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "event",
    name: "BatchAttested",
    anonymous: false,
    inputs: [
      { name: "batchId", type: "uint256", indexed: true },
      { name: "manufacturerId", type: "uint256", indexed: true },
      { name: "attestor", type: "address", indexed: true },
      { name: "nafdacNumber", type: "string", indexed: false },
      { name: "batchNumber", type: "string", indexed: false },
      { name: "drugName", type: "string", indexed: false },
      { name: "expiryDate", type: "uint256", indexed: false },
      { name: "evidenceHash", type: "bytes32", indexed: false },
    ],
  },
  {
    type: "event",
    name: "BatchRecalled",
    anonymous: false,
    inputs: [
      { name: "batchId", type: "uint256", indexed: true },
      { name: "caller", type: "address", indexed: true },
      { name: "reason", type: "string", indexed: false },
    ],
  },
  {
    type: "event",
    name: "CounterfeitFlagged",
    anonymous: false,
    inputs: [
      { name: "reportId", type: "uint256", indexed: true },
      { name: "reporter", type: "address", indexed: true },
      { name: "nafdacNumber", type: "string", indexed: false },
      { name: "details", type: "string", indexed: false },
    ],
  },
  {
    type: "event",
    name: "CounterfeitValidated",
    anonymous: false,
    inputs: [
      { name: "reportId", type: "uint256", indexed: true },
      { name: "validator", type: "address", indexed: true },
      { name: "isCounterfeit", type: "bool", indexed: false },
    ],
  },
  {
    type: "event",
    name: "OwnershipTransferred",
    anonymous: false,
    inputs: [
      { name: "previousOwner", type: "address", indexed: true },
      { name: "newOwner", type: "address", indexed: true },
    ],
  },
  {
    type: "event",
    name: "Paused",
    anonymous: false,
    inputs: [{ name: "account", type: "address", indexed: false }],
  },
  {
    type: "event",
    name: "Unpaused",
    anonymous: false,
    inputs: [{ name: "account", type: "address", indexed: false }],
  },
  { type: "error", name: "BatchAlreadyExists", inputs: [] },
  { type: "error", name: "BatchDoesNotExist", inputs: [] },
  { type: "error", name: "DuplicateReport", inputs: [] },
  { type: "error", name: "EmptyText", inputs: [] },
  { type: "error", name: "EvidenceHashMissing", inputs: [] },
  { type: "error", name: "InvalidCredential", inputs: [] },
  { type: "error", name: "InvalidExpiry", inputs: [] },
  { type: "error", name: "InvalidLimit", inputs: [] },
  { type: "error", name: "NotRecallAuthority", inputs: [] },
  { type: "error", name: "NotVerifiedManufacturer", inputs: [] },
  { type: "error", name: "ReportAlreadyValidated", inputs: [] },
  { type: "error", name: "ReportDoesNotExist", inputs: [] },
  { type: "error", name: "TextTooLong", inputs: [] },
  { type: "error", name: "BatchAlreadyRecalled", inputs: [] },
  {
    type: "error",
    name: "OwnableUnauthorizedAccount",
    inputs: [{ name: "account", type: "address" }],
  },
  {
    type: "error",
    name: "OwnableInvalidOwner",
    inputs: [{ name: "owner", type: "address" }],
  },
  { type: "error", name: "EnforcedPause", inputs: [] },
  { type: "error", name: "ExpectedPause", inputs: [] },
  { type: "error", name: "ReentrancyGuardReentrantCall", inputs: [] },
] as const satisfies Abi;

const credentialComponents = [
  { name: "manufacturerName", type: "string" },
  { name: "nafdacRegistrationNumber", type: "string" },
  { name: "manufacturingAddress", type: "string" },
  { name: "manufacturer", type: "address" },
  { name: "active", type: "bool" },
  { name: "issuedAt", type: "uint64" },
  { name: "revokedAt", type: "uint64" },
] as const;

export const MANUFACTURER_CREDENTIAL_ABI = [
  { type: "constructor", inputs: [], stateMutability: "nonpayable" },
  {
    type: "function",
    name: "MAX_TEXT_LENGTH",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "pure",
    inputs: [
      { name: "", type: "address" },
      { name: "", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "getApproved",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "getCredential",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      { name: "", type: "tuple", components: credentialComponents },
    ],
  },
  {
    type: "function",
    name: "isApprovedForAll",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "operator", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "isVerified",
    stateMutability: "view",
    inputs: [{ name: "manufacturer", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "manufacturerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "mint",
    stateMutability: "nonpayable",
    inputs: [
      { name: "manufacturer", type: "address" },
      { name: "manufacturerName", type: "string" },
      { name: "nafdacRegistrationNumber", type: "string" },
      { name: "manufacturingAddress", type: "string" },
    ],
    outputs: [{ name: "tokenId", type: "uint256" }],
  },
  {
    type: "function",
    name: "name",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "nextTokenId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "owner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "pause",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "paused",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "renounceOwnership",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "revoke",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "safeTransferFrom",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "safeTransferFrom",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "data", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "setApprovalForAll",
    stateMutability: "pure",
    inputs: [
      { name: "", type: "address" },
      { name: "", type: "bool" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "supportsInterface",
    stateMutability: "view",
    inputs: [{ name: "interfaceId", type: "bytes4" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "tokenURI",
    stateMutability: "pure",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "transferFrom",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "transferOwnership",
    stateMutability: "nonpayable",
    inputs: [{ name: "newOwner", type: "address" }],
    outputs: [],
  },
  {
    type: "function",
    name: "unpause",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "event",
    name: "Approval",
    anonymous: false,
    inputs: [
      { name: "owner", type: "address", indexed: true },
      { name: "approved", type: "address", indexed: true },
      { name: "tokenId", type: "uint256", indexed: true },
    ],
  },
  {
    type: "event",
    name: "ApprovalForAll",
    anonymous: false,
    inputs: [
      { name: "owner", type: "address", indexed: true },
      { name: "operator", type: "address", indexed: true },
      { name: "approved", type: "bool", indexed: false },
    ],
  },
  {
    type: "event",
    name: "CredentialMinted",
    anonymous: false,
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "manufacturer", type: "address", indexed: true },
      { name: "manufacturerName", type: "string", indexed: false },
      { name: "nafdacRegistrationNumber", type: "string", indexed: false },
      { name: "manufacturingAddress", type: "string", indexed: false },
    ],
  },
  {
    type: "event",
    name: "CredentialRevoked",
    anonymous: false,
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "manufacturer", type: "address", indexed: true },
      { name: "reason", type: "string", indexed: false },
    ],
  },
  {
    type: "event",
    name: "OwnershipTransferred",
    anonymous: false,
    inputs: [
      { name: "previousOwner", type: "address", indexed: true },
      { name: "newOwner", type: "address", indexed: true },
    ],
  },
  {
    type: "event",
    name: "Paused",
    anonymous: false,
    inputs: [{ name: "account", type: "address", indexed: false }],
  },
  {
    type: "event",
    name: "Transfer",
    anonymous: false,
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "tokenId", type: "uint256", indexed: true },
    ],
  },
  {
    type: "event",
    name: "Unpaused",
    anonymous: false,
    inputs: [{ name: "account", type: "address", indexed: false }],
  },
  { type: "error", name: "CredentialAlreadyExists", inputs: [] },
  { type: "error", name: "CredentialDoesNotExist", inputs: [] },
  {
    type: "error",
    name: "ERC721IncorrectOwner",
    inputs: [
      { name: "sender", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "owner", type: "address" },
    ],
  },
  {
    type: "error",
    name: "ERC721InsufficientApproval",
    inputs: [
      { name: "operator", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
  },
  {
    type: "error",
    name: "ERC721InvalidApprover",
    inputs: [{ name: "approver", type: "address" }],
  },
  {
    type: "error",
    name: "ERC721InvalidOperator",
    inputs: [{ name: "operator", type: "address" }],
  },
  {
    type: "error",
    name: "ERC721InvalidOwner",
    inputs: [{ name: "owner", type: "address" }],
  },
  {
    type: "error",
    name: "ERC721InvalidReceiver",
    inputs: [{ name: "receiver", type: "address" }],
  },
  {
    type: "error",
    name: "ERC721InvalidSender",
    inputs: [{ name: "sender", type: "address" }],
  },
  {
    type: "error",
    name: "ERC721NonexistentToken",
    inputs: [{ name: "tokenId", type: "uint256" }],
  },
  { type: "error", name: "EmptyText", inputs: [] },
  { type: "error", name: "EnforcedPause", inputs: [] },
  { type: "error", name: "ExpectedPause", inputs: [] },
  { type: "error", name: "InvalidManufacturer", inputs: [] },
  {
    type: "error",
    name: "OwnableInvalidOwner",
    inputs: [{ name: "owner", type: "address" }],
  },
  {
    type: "error",
    name: "OwnableUnauthorizedAccount",
    inputs: [{ name: "account", type: "address" }],
  },
  { type: "error", name: "ReentrancyGuardReentrantCall", inputs: [] },
  { type: "error", name: "SoulboundToken", inputs: [] },
  { type: "error", name: "TextTooLong", inputs: [] },
] as const satisfies Abi;

export type Passport = {
  exists: boolean;
  nafdacNumber: string;
  batchCount: bigint;
  recalledCount: bigint;
  counterfeitReportCount: bigint;
  pendingReportCount: bigint;
  validatedCounterfeitCount: bigint;
};

export type Batch = {
  batchId: bigint;
  manufacturerId: bigint;
  manufacturer: `0x${string}`;
  nafdacNumber: string;
  batchNumber: string;
  drugName: string;
  expiryDate: bigint;
  evidenceHash: `0x${string}`;
  attestedBy: `0x${string}`;
  attestedAt: bigint;
  recalled: boolean;
  recallReason: string;
  recalledAt: bigint;
  recalledBy: `0x${string}`;
};

export type CounterfeitReport = {
  reportId: bigint;
  nafdacNumber: string;
  details: string;
  reporter: `0x${string}`;
  reportedAt: bigint;
  validated: boolean;
  isCounterfeit: boolean;
  validator: `0x${string}`;
  validatedAt: bigint;
};

export type DrugPassportResult = {
  passport: Passport;
  batchIds: bigint[];
  reportIds: bigint[];
};

export type BatchPageResult = {
  page: Batch[];
  nextOffset: bigint;
};

export type CounterfeitReportPageResult = {
  page: CounterfeitReport[];
  nextOffset: bigint;
};

export type PassportVerificationState =
  | "verified"
  | "recalled"
  | "counterfeit"
  | "review";

const zeroAddress = "0x0000000000000000000000000000000000000000" as const;
const zeroHash = `0x${"0".repeat(64)}` as `0x${string}`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function valueAt(
  value: unknown,
  record: Record<string, unknown> | undefined,
  key: string,
  index: number,
) {
  if (Array.isArray(value)) {
    return value[index];
  }
  return record?.[key];
}

function toBigInt(value: unknown) {
  if (typeof value === "bigint") {
    return value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return BigInt(Math.trunc(value));
  }
  if (typeof value === "string" && /^\d+$/.test(value)) {
    return BigInt(value);
  }
  return 0n;
}

function toBoolean(value: unknown) {
  return value === true || value === "true";
}

function toText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function toAddress(value: unknown) {
  const text = toText(value);
  return /^0x[0-9a-fA-F]{40}$/.test(text)
    ? (text as `0x${string}`)
    : zeroAddress;
}

function toHash(value: unknown) {
  const text = toText(value);
  return /^0x[0-9a-fA-F]{64}$/.test(text)
    ? (text as `0x${string}`)
    : zeroHash;
}

function toBigIntArray(value: unknown) {
  return Array.isArray(value) ? value.map(toBigInt) : [];
}

export function parsePassport(value: unknown): Passport {
  const record = isRecord(value) ? value : undefined;
  return {
    exists: toBoolean(valueAt(value, record, "exists", 0)),
    nafdacNumber: toText(valueAt(value, record, "nafdacNumber", 1)),
    batchCount: toBigInt(valueAt(value, record, "batchCount", 2)),
    recalledCount: toBigInt(valueAt(value, record, "recalledCount", 3)),
    counterfeitReportCount: toBigInt(
      valueAt(value, record, "counterfeitReportCount", 4),
    ),
    pendingReportCount: toBigInt(valueAt(value, record, "pendingReportCount", 5)),
    validatedCounterfeitCount: toBigInt(
      valueAt(value, record, "validatedCounterfeitCount", 6),
    ),
  };
}

export function parseBatch(value: unknown): Batch {
  const record = isRecord(value) ? value : undefined;
  return {
    batchId: toBigInt(valueAt(value, record, "batchId", 0)),
    manufacturerId: toBigInt(valueAt(value, record, "manufacturerId", 1)),
    manufacturer: toAddress(valueAt(value, record, "manufacturer", 2)),
    nafdacNumber: toText(valueAt(value, record, "nafdacNumber", 3)),
    batchNumber: toText(valueAt(value, record, "batchNumber", 4)),
    drugName: toText(valueAt(value, record, "drugName", 5)),
    expiryDate: toBigInt(valueAt(value, record, "expiryDate", 6)),
    evidenceHash: toHash(valueAt(value, record, "evidenceHash", 7)),
    attestedBy: toAddress(valueAt(value, record, "attestedBy", 8)),
    attestedAt: toBigInt(valueAt(value, record, "attestedAt", 9)),
    recalled: toBoolean(valueAt(value, record, "recalled", 10)),
    recallReason: toText(valueAt(value, record, "recallReason", 11)),
    recalledAt: toBigInt(valueAt(value, record, "recalledAt", 12)),
    recalledBy: toAddress(valueAt(value, record, "recalledBy", 13)),
  };
}

export function parseCounterfeitReport(value: unknown): CounterfeitReport {
  const record = isRecord(value) ? value : undefined;
  return {
    reportId: toBigInt(valueAt(value, record, "reportId", 0)),
    nafdacNumber: toText(valueAt(value, record, "nafdacNumber", 1)),
    details: toText(valueAt(value, record, "details", 2)),
    reporter: toAddress(valueAt(value, record, "reporter", 3)),
    reportedAt: toBigInt(valueAt(value, record, "reportedAt", 4)),
    validated: toBoolean(valueAt(value, record, "validated", 5)),
    isCounterfeit: toBoolean(valueAt(value, record, "isCounterfeit", 6)),
    validator: toAddress(valueAt(value, record, "validator", 7)),
    validatedAt: toBigInt(valueAt(value, record, "validatedAt", 8)),
  };
}

export function parseDrugPassportResult(value: unknown): DrugPassportResult | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const root = Array.isArray(value)
    ? value
    : isRecord(value)
      ? [value.passport, value.batchIds, value.reportIds]
      : [];
  return {
    passport: parsePassport(root[0]),
    batchIds: toBigIntArray(root[1]),
    reportIds: toBigIntArray(root[2]),
  };
}

export function parseBatchPageResult(value: unknown): BatchPageResult {
  const root = Array.isArray(value)
    ? value
    : isRecord(value)
      ? [value.page, value.nextOffset]
      : [];
  const page = Array.isArray(root[0]) ? root[0].map(parseBatch) : [];
  return { page, nextOffset: toBigInt(root[1]) };
}

export function parseCounterfeitReportPageResult(
  value: unknown,
): CounterfeitReportPageResult {
  const root = Array.isArray(value)
    ? value
    : isRecord(value)
      ? [value.page, value.nextOffset]
      : [];
  const page = Array.isArray(root[0]) ? root[0].map(parseCounterfeitReport) : [];
  return { page, nextOffset: toBigInt(root[1]) };
}

export function passportVerificationState(
  passport: Passport,
  batches: Batch[],
  reports: CounterfeitReport[],
  now = BigInt(Math.floor(Date.now() / 1000)),
): PassportVerificationState {
  if (passport.validatedCounterfeitCount > 0n || reports.some((report) => report.validated && report.isCounterfeit)) {
    return "counterfeit";
  }
  if (passport.recalledCount > 0n || batches.some((batch) => batch.recalled)) {
    return "recalled";
  }
  if (
    passport.pendingReportCount > 0n ||
    batches.some((batch) => batch.expiryDate <= now)
  ) {
    return "review";
  }
  return "verified";
}

const rawRegistryAddress = process.env.NEXT_PUBLIC_DRUG_REGISTRY_ADDRESS?.trim();
const rawCredentialAddress =
  process.env.NEXT_PUBLIC_MANUFACTURER_CREDENTIAL_ADDRESS?.trim();

export const registryAddress: Address | undefined =
  rawRegistryAddress && isAddress(rawRegistryAddress)
    ? getAddress(rawRegistryAddress)
    : undefined;

export const manufacturerCredentialAddress: Address | undefined =
  rawCredentialAddress && isAddress(rawCredentialAddress)
    ? getAddress(rawCredentialAddress)
    : undefined;

export const registryConfiguration = !rawRegistryAddress
  ? "missing"
  : registryAddress
    ? "ready"
    : "invalid";

export const credentialConfiguration = !rawCredentialAddress
  ? "missing"
  : manufacturerCredentialAddress
    ? "ready"
    : "invalid";

export const isRegistryConfigured = registryConfiguration === "ready";
