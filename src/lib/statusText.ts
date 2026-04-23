import { t, type AppLang } from "@/lib/i18n";

export function statusText(lang: AppLang, value?: string | null): string {
  const raw = String(value || "").trim();
  if (!raw) return "-";
  return t(lang, raw) || raw;
}
