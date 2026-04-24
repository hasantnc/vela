import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type CurrencyCode = "TRY" | "USD" | "EUR";

type CurrencyContextType = {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  rate: number; // 1 TRY = ? seçilen birim
  symbol: string;
  convert: (tryAmount: number) => string;
};

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "TRY",
  setCurrency: () => {},
  rate: 1,
  symbol: "₺",
  convert: (n) => n.toFixed(0),
});

async function fetchRates(): Promise<{ USD: number; EUR: number }> {
  try {
    const res = await fetch("https://canlidoviz.com/doviz-kurlari", {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const html = await res.text();
    const usdMatch = html.match(/doviz-kurlari\/dolar[^>]*>.*?(\d+[.,]\d+)/s);
    const eurMatch = html.match(/doviz-kurlari\/euro[^>]*>.*?(\d+[.,]\d+)/s);
    const parse = (m: RegExpMatchArray | null) =>
      m ? parseFloat(m[1].replace(",", ".")) : null;
    const usdTL = parse(usdMatch);
    const eurTL = parse(eurMatch);
    if (!usdTL || !eurTL) return { USD: 0.0224, EUR: 0.0194 };
    return { USD: 1 / usdTL, EUR: 1 / eurTL };
  } catch {
    return { USD: 0.0224, EUR: 0.0194 };
  }
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<CurrencyCode>("TRY");
  const [rates, setRates] = useState({ USD: 0.0224, EUR: 0.0194 });

  useEffect(() => {
    fetchRates().then(setRates);
  }, []);

  const rate = currency === "TRY" ? 1 : rates[currency];
  const symbol = currency === "TRY" ? "₺" : currency === "USD" ? "$" : "€";

  const convert = (tryAmount: number) => {
    if (currency === "TRY") return new Intl.NumberFormat("tr-TR").format(Math.round(tryAmount));
    return (tryAmount * rate).toFixed(2);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, rate, symbol, convert }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);