import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AppLang } from "@/lib/i18n";

type LanguageContextValue = {
  lang: AppLang;
  setLang: (lang: AppLang) => void;
  toggleLang: () => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<AppLang>(() => {
    const saved = localStorage.getItem("app_lang");
    return saved === "my" ? "my" : "en";
  });

  useEffect(() => {
    localStorage.setItem("app_lang", lang);
    document.documentElement.lang = lang === "my" ? "my" : "en";
  }, [lang]);

  const value = useMemo(
    () => ({
      lang,
      setLang: (next: AppLang) => setLangState(next),
      toggleLang: () => setLangState((prev) => (prev === "en" ? "my" : "en")),
    }),
    [lang]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
