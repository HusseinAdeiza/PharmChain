import { NextRequest, NextResponse } from "next/server";
import {
  createRegulatoryKey,
  isRegistryId,
  parseRegulatoryKey,
  registryLabel,
  type RegulatoryKey,
} from "@/lib/regulatory";

const cache = new Map<string, { expiresAt: number; value: unknown }>();
const cacheTtlMs = 60 * 60 * 1000;

type GreenBookRow = {
  product_id?: number;
  product_name?: string;
  NAFDAC?: string;
  ingredient_name?: string;
  form_name?: string;
  route_name?: string;
  strength?: string;
  applicant_name?: string;
  manufacturer_name?: string;
  status?: string;
  approval_date?: string;
  expiry_date?: string;
};

type FdaNdcRow = {
  product_ndc?: string;
  brand_name?: string;
  generic_name?: string;
  labeler_name?: string;
  dosage_form?: string;
  route?: string[];
  marketing_category?: string;
  active_ingredients?: Array<{ name?: string; strength?: string }>;
};

type Product = {
  id: string;
  name: string;
  registrationId: string;
  ingredient: string | null;
  form: string | null;
  route: string | null;
  strength: string | null;
  applicant: string | null;
  manufacturer: string | null;
  status: string | null;
  approvalDate: string | null;
  expiryDate: string | null;
  sourceUrl: string;
};

function normalizeId(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

async function fetchJson(url: URL, allowNotFound = false) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "PharmChain-Product-Lookup/1.0",
    },
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(12000),
  });
  if (response.status === 404 && allowNotFound) {
    return { data: [] as unknown[] };
  }
  if (!response.ok) {
    throw new Error(`Official source request failed with status ${response.status}`);
  }
  return response.json() as Promise<unknown>;
}

async function queryGreenBook(registrationId: string) {
  const baseUrl = new URL("https://greenbook.nafdac.gov.ng/");
  baseUrl.search = new URLSearchParams({
    draw: "1",
    start: "0",
    length: "20",
    "search[value]": registrationId,
  }).toString();
  const response = await fetch(baseUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": "PharmChain-Product-Lookup/1.0",
      "X-Requested-With": "XMLHttpRequest",
    },
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) {
    throw new Error(`NAFDAC Green Book request failed with status ${response.status}`);
  }
  const payload = (await response.json()) as { data?: GreenBookRow[] };
  return Array.isArray(payload.data) ? payload.data : [];
}

async function queryFdaNdc(registrationId: string) {
  const searchTerms = [registrationId, registrationId.replace(/[^A-Za-z0-9]/g, "")];
  for (const term of searchTerms) {
    if (!term) continue;
    const url = new URL("https://api.fda.gov/drug/ndc.json");
    url.search = new URLSearchParams({
      search: `product_ndc:"${term}"`,
      limit: "10",
    }).toString();
    const payload = (await fetchJson(url, true)) as { results?: FdaNdcRow[] };
    if (Array.isArray(payload.results) && payload.results.length > 0) {
      return payload.results;
    }
  }
  return [];
}

function nafdacProduct(row: GreenBookRow, registrationId: string): Product {
  const id = row.product_id ? String(row.product_id) : normalizeId(row.NAFDAC || registrationId);
  return {
    id,
    name: row.product_name?.replace(/[#*]+/g, "").trim() || "Unnamed product",
    registrationId: row.NAFDAC?.trim() || registrationId,
    ingredient: row.ingredient_name?.trim() || null,
    form: row.form_name?.trim() || null,
    route: row.route_name?.trim() || null,
    strength: row.strength?.trim() || null,
    applicant: row.applicant_name?.trim() || null,
    manufacturer: row.manufacturer_name?.trim() || null,
    status: row.status?.trim() || null,
    approvalDate: row.approval_date || null,
    expiryDate: row.expiry_date || null,
    sourceUrl: row.product_id ? `https://greenbook.nafdac.gov.ng/products/details/${row.product_id}` : "https://greenbook.nafdac.gov.ng/",
  };
}

function fdaProduct(row: FdaNdcRow, registrationId: string): Product {
  const activeIngredients = Array.isArray(row.active_ingredients)
    ? row.active_ingredients
        .map((item) => [item.name, item.strength].filter(Boolean).join(" "))
        .filter(Boolean)
        .join("; ")
    : "";
  return {
    id: row.product_ndc?.trim() || registrationId,
    name: row.brand_name?.trim() || row.generic_name?.trim() || "Unnamed product",
    registrationId: row.product_ndc?.trim() || registrationId,
    ingredient: row.generic_name?.trim() || activeIngredients || null,
    form: row.dosage_form?.trim() || null,
    route: Array.isArray(row.route) ? row.route.join(", ") : null,
    strength: null,
    applicant: row.labeler_name?.trim() || null,
    manufacturer: row.labeler_name?.trim() || null,
    status: row.marketing_category?.trim() || null,
    approvalDate: null,
    expiryDate: null,
    sourceUrl: "https://www.accessdata.fda.gov/scripts/cder/daf/",
  };
}

function getRequestKey(request: NextRequest): RegulatoryKey | undefined {
  const rawId = request.nextUrl.searchParams.get("id")?.trim() || request.nextUrl.searchParams.get("nrn")?.trim() || "";
  const rawRegistry = request.nextUrl.searchParams.get("registry")?.trim().toLowerCase() || "nafdac";
  if (!rawId || rawId.length > 128) return undefined;
  if (rawId.includes(":")) return parseRegulatoryKey(rawId);
  if (!isRegistryId(rawRegistry)) return undefined;
  return createRegulatoryKey(rawRegistry, rawId);
}

export async function GET(request: NextRequest) {
  const key = getRequestKey(request);
  if (!key) {
    return NextResponse.json({ error: "Provide a valid jurisdiction registry id." }, { status: 400 });
  }
  const cacheKey = key.canonicalKey.toUpperCase();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.value, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  }
  try {
    const products = key.registry === "nafdac"
      ? (await queryGreenBook(key.registrationId))
          .filter((row) => normalizeId(row.NAFDAC || "") === normalizeId(key.registrationId))
          .map((row) => nafdacProduct(row, key.registrationId))
      : (await queryFdaNdc(key.registrationId))
          .filter((row) => normalizeId(row.product_ndc || "") === normalizeId(key.registrationId))
          .map((row) => fdaProduct(row, key.registrationId));
    const source = key.registry === "nafdac" ? "NAFDAC Green Book" : "US FDA NDC Directory";
    const sourceUrl = key.registry === "nafdac" ? "https://greenbook.nafdac.gov.ng/" : "https://www.accessdata.fda.gov/scripts/cder/daf/";
    const value = {
      registry: key.registry,
      jurisdiction: key.jurisdiction,
      registrationId: key.registrationId,
      canonicalKey: key.canonicalKey,
      products,
      source,
      sourceUrl,
      sourceLabel: registryLabel(key.registry),
      checkedAt: new Date().toISOString(),
    };
    cache.set(cacheKey, { expiresAt: Date.now() + cacheTtlMs, value });
    return NextResponse.json(value, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch {
    return NextResponse.json(
      { error: "The official product lookup is temporarily unavailable." },
      { status: 502 },
    );
  }
}
