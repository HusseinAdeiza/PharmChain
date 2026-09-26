import { NextRequest, NextResponse } from "next/server";

const greenBookBaseUrl = "https://greenbook.nafdac.gov.ng/";
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

function normalizeNrn(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

async function queryGreenBook(term: string) {
  const url = new URL(greenBookBaseUrl);
  url.search = new URLSearchParams({
    draw: "1",
    start: "0",
    length: "20",
    "search[value]": term,
  }).toString();
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "PharmChain-Product-Lookup/1.0",
      "X-Requested-With": "XMLHttpRequest",
    },
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) {
    throw new Error(`Green Book request failed with status ${response.status}`);
  }
  const payload = (await response.json()) as { data?: GreenBookRow[] };
  return Array.isArray(payload.data) ? payload.data : [];
}

function toProduct(row: GreenBookRow, requestedNrn: string) {
  const id = row.product_id;
  return {
    id: id ?? null,
    nrn: row.NAFDAC?.trim() || requestedNrn,
    name: row.product_name?.replace(/[#*]+/g, "").trim() || "Unnamed product",
    ingredient: row.ingredient_name?.trim() || null,
    form: row.form_name?.trim() || null,
    route: row.route_name?.trim() || null,
    strength: row.strength?.trim() || null,
    applicant: row.applicant_name?.trim() || null,
    manufacturer: row.manufacturer_name?.trim() || null,
    status: row.status?.trim() || null,
    approvalDate: row.approval_date || null,
    expiryDate: row.expiry_date || null,
    sourceUrl: id ? `${greenBookBaseUrl}products/details/${id}` : greenBookBaseUrl,
  };
}

export async function GET(request: NextRequest) {
  const rawNrn = request.nextUrl.searchParams.get("nrn")?.trim() || "";
  if (!rawNrn || rawNrn.length > 128) {
    return NextResponse.json({ error: "Provide a valid NAFDAC number." }, { status: 400 });
  }
  const normalized = normalizeNrn(rawNrn);
  const cached = cache.get(normalized);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.value, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  }
  try {
    let rows = await queryGreenBook(rawNrn);
    if (rows.length === 0) {
      const compact = rawNrn.replace(/[^A-Za-z0-9]/g, "");
      if (compact && compact !== rawNrn) {
        rows = await queryGreenBook(compact);
      }
    }
    const products = rows
      .filter((row) => normalizeNrn(row.NAFDAC || "") === normalized)
      .map((row) => toProduct(row, rawNrn));
    const value = {
      nrn: rawNrn,
      products,
      source: "NAFDAC Green Book",
      sourceUrl: greenBookBaseUrl,
      checkedAt: new Date().toISOString(),
    };
    cache.set(normalized, { expiresAt: Date.now() + cacheTtlMs, value });
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
