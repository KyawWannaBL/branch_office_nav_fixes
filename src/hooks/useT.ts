import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";

export function useT() {
  const { lang } = useLanguage();

  return {
    lang,
    t: (value: string) => t(lang, value),
  };
}
