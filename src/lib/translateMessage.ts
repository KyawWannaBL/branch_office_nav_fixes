import { t, type AppLang } from "@/lib/i18n";

const PREFIXES = [
  "Action completed: ",
  "Scanned ",
  "Run sheet created: ",
  "Run sheet dispatched: ",
  "Updated COD for ",
  "Settlement created: ",
  "Settlement posted: ",
];

export function translateMessage(lang: AppLang, value?: string | null): string {
  const raw = String(value || "").trim();
  if (!raw) return "";

  for (const prefix of PREFIXES) {
    if (raw.startsWith(prefix)) {
      return `${t(lang, prefix.trim())}: ${raw.slice(prefix.length)}`;
    }
  }

  return t(lang, raw);
}
