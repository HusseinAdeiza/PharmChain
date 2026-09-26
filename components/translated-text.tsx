"use client";

import { useLanguage } from "@/components/language-provider";
import type { TranslationKey } from "@/lib/i18n";

export function TranslatedText({
  className,
  messageKey,
}: {
  className?: string;
  messageKey: TranslationKey;
}) {
  const { t } = useLanguage();
  return <span className={className}>{t(messageKey)}</span>;
}
