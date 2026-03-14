import { createContext, useContext, useState, useCallback } from "react";
import { translations } from "@/lib/translations";

const LanguageContext = createContext();

// Locale mapping: app language → browser locale for date/number formatting
const LOCALE_MAP = {
  es: "es-MX",
  en: "en-US",
  pt: "pt-BR",
};

// Currency symbol per locale
const CURRENCY_MAP = {
  es: "MXN",
  en: "USD",
  pt: "BRL",
};

export function LanguageProvider({ children }) {
  const [language, setLang] = useState(localStorage.getItem("sigaf_lang") || "es");

  const t = useCallback((key) => {
    const keys = key.split(".");
    let value = translations[language];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  }, [language]);

  const changeLanguage = (lang) => {
    setLang(lang);
    localStorage.setItem("sigaf_lang", lang);
  };

  const locale = LOCALE_MAP[language] || "es-MX";

  // Format a date string/object with the current locale
  const fmtDate = useCallback((val, opts = { dateStyle: "short", timeStyle: "short" }) => {
    if (!val) return "—";
    try {
      return new Date(val).toLocaleString(locale, opts);
    } catch {
      return String(val);
    }
  }, [locale]);

  // Format a date only (no time)
  const fmtDateOnly = useCallback((val) => {
    if (!val) return "—";
    try {
      return new Date(val).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return String(val);
    }
  }, [locale]);

  // Format currency — always show MXN value, but with locale number formatting
  const fmtMoney = useCallback((val) => {
    if (val === null || val === undefined) return "—";
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "MXN",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(val));
    } catch {
      return `$${Number(val).toFixed(2)}`;
    }
  }, [locale]);

  return (
    <LanguageContext.Provider value={{ language, t, changeLanguage, locale, fmtDate, fmtDateOnly, fmtMoney }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
