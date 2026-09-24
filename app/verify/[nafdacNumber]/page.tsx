import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VerifyPassport } from "@/components/verify-passport";
import { normalizeNafdacNumber } from "@/lib/nafdac";

interface VerifyPageProps {
  params: Promise<{
    nafdacNumber: string;
  }>;
}

export async function generateMetadata({ params }: VerifyPageProps): Promise<Metadata> {
  const { nafdacNumber: rawNafdacNumber } = await params;
  const nafdacNumber = normalizeNafdacNumber(rawNafdacNumber) || rawNafdacNumber;
  return {
    title: `Verify ${nafdacNumber}`,
    description: `Check the PharmChain medicine passport for ${nafdacNumber} on Monad Mainnet.`,
  };
}

export default async function VerifyPage({ params }: VerifyPageProps) {
  const { nafdacNumber: rawNafdacNumber } = await params;
  const nafdacNumber = normalizeNafdacNumber(rawNafdacNumber);
  if (!nafdacNumber) {
    notFound();
  }
  return <VerifyPassport initialNafdacNumber={nafdacNumber} />;
}
