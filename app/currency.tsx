import { useState, useEffect } from "react";
import { ScrollView, View, Text, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { HapticPressable } from "@/components/HapticPressable";
import { useAuth } from "@/lib/firebase/auth";
import { subscribeTransactions } from "@/lib/firebase/firestore";
import { Transaction } from "@/types";
import { fmt } from "@/constants/data";
import { PremiumGate } from "@/components/PremiumGate";

type Rates = { USD: number; EUR: number; ALTIN: number };

const CURRENCIES: { key: keyof Rates; label: string; flag: string; iconName: string; color: string }[] = [
  { key: "USD", label: "Amerikan Doları", flag: "🇺🇸", iconName: "logo-usd",        color: "#34D399" },
  { key: "EUR", label: "Euro",            flag: "🇪🇺", iconName: "globe-outline",    color: "#3B82F6" },
  { key: "ALTIN", label: "Gram Altın",   flag: "🪙",  iconName: "diamond-outline",  color: "#F59E0B" },
];

const FALLBACK_RATES: Rates = { USD: 0.0224, EUR: 0.0194, ALTIN: 0.00015 };

async function fetchRates(): Promise<Rates> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch("https://canlidoviz.com/doviz-kurlari", {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: controller.signal,
    });
    clearTimeout(timer);
    const html = await res.text();
    const usdMatch   = html.match(/doviz-kurlari\/dolar[^>]*>.*?(\d+[.,]\d+)/s);
    const eurMatch   = html.match(/doviz-kurlari\/euro[^>]*>.*?(\d+[.,]\d+)/s);
    const altinMatch = html.match(/altin-fiyatlari\/gram-altin[^>]*>.*?(\d+[.,]\d+)/s);
    const parse = (m: RegExpMatchArray | null) => m ? parseFloat(m[1].replace(",", ".")) : null;
    const usdTL = parse(usdMatch);
    const eurTL = parse(eurMatch);
    const altinTL = parse(altinMatch);
    if (!usdTL || !eurTL || !altinTL) return FALLBACK_RATES;
    return { USD: 1 / usdTL, EUR: 1 / eurTL, ALTIN: 1 / altinTL };
  } catch {
    return FALLBACK_RATES;
  }
}

export default function CurrencyScreen() {
  const { user } = useAuth();
  const [base, setBase] = useState<keyof Rates>("USD");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rates, setRates] = useState<Rates | null>(null);
  const [rawRates, setRawRates] = useState<Rates | null>(null);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");

  useEffect(() => {
    if (!user) return;
    return subscribeTransactions(user.uid, (txs) => {
      setTransactions(txs);
    });
  }, [user]);

  const loadRates = () => {
    setRatesLoading(true);
    fetchRates().then((r) => {
      setRates(r);
      setRawRates({
        USD:   r.USD   > 0 ? 1 / r.USD   : 0,
        EUR:   r.EUR   > 0 ? 1 / r.EUR   : 0,
        ALTIN: r.ALTIN > 0 ? 1 / r.ALTIN : 0,
      });
      const now = new Date();
      setLastUpdated(`${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`);
      setRatesLoading(false);
    });
  };

  useEffect(() => { loadRates(); }, []);

  const income  = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const rate    = rates ? rates[base] : FALLBACK_RATES[base];
  const curLabel = (c: string) => c === "ALTIN" ? "gram altın" : c;
  const converted = (amount: number) => base === "ALTIN"
    ? (amount * rate).toFixed(3)
    : (amount * rate).toFixed(2);

  const activeCur = CURRENCIES.find((c) => c.key === base)!;


  return (
    <PremiumGate feature="Döviz koruması">
    <>
      <Stack.Screen options={{ title: "Döviz Analizi", headerLargeTitle: true }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: "#06060F" }}
        contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 40 }}
      >
        {/* Header bar */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="time-outline" size={13} color="#444" />
            <Text style={{ color: "#444", fontSize: 12 }}>
              {ratesLoading ? "Kurlar güncelleniyor..." : `Son güncelleme: ${lastUpdated}`}
            </Text>
          </View>
          <HapticPressable
            onPress={loadRates}
            disabled={ratesLoading}
            style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(59,130,246,0.1)", borderWidth: 1, borderColor: "rgba(59,130,246,0.2)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, opacity: ratesLoading ? 0.5 : 1 }}
          >
            {ratesLoading
              ? <ActivityIndicator size="small" color="#3B82F6" style={{ width: 14, height: 14 }} />
              : <Ionicons name="refresh-outline" size={14} color="#3B82F6" />
            }
            <Text style={{ color: "#3B82F6", fontSize: 12, fontWeight: "700" }}>Yenile</Text>
          </HapticPressable>
        </View>

        {/* Currency selector */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          {CURRENCIES.map((c) => (
            <HapticPressable
              key={c.key}
              onPress={() => setBase(c.key)}
              style={{
                flex: 1,
                backgroundColor: base === c.key ? `${c.color}18` : "rgba(255,255,255,0.04)",
                borderWidth: 1,
                borderColor: base === c.key ? `${c.color}44` : "rgba(255,255,255,0.08)",
                borderRadius: 18,
                padding: 12,
                alignItems: "center",
                gap: 6,
              }}
            >
              <Text style={{ fontSize: 20 }}>{c.flag}</Text>
              <Text style={{ color: base === c.key ? c.color : "#888", fontSize: 11, fontWeight: "800" }}>{c.key}</Text>
              <Text style={{ color: base === c.key ? c.color : "#555", fontSize: 12, fontWeight: "700" }}>
                ₺{rawRates ? (c.key === "ALTIN" ? fmt(rawRates[c.key]) : rawRates[c.key].toFixed(2)) : "—"}
              </Text>
            </HapticPressable>
          ))}
        </View>

        {/* Balance card */}
        <View style={{
          backgroundColor: "#0F1629",
          borderWidth: 1,
          borderColor: `${activeCur.color}30`,
          borderRadius: 28,
          padding: 24,
          overflow: "hidden",
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: `${activeCur.color}18`, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 16 }}>{activeCur.flag}</Text>
            </View>
            <Text style={{ color: activeCur.color, fontSize: 11, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" }}>
              Bakiyenin Gerçek Değeri
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
            <Text selectable style={{ color: "#fff", fontSize: 40, fontWeight: "900", letterSpacing: -1.5 }}>
              {converted(balance)}
            </Text>
            <Text style={{ color: activeCur.color, fontSize: 16, fontWeight: "700" }}>{curLabel(base)}</Text>
          </View>
          <Text style={{ color: "#444", fontSize: 13 }}>
            = ₺{fmt(balance)} · 1₺ = {rate.toFixed(base === "ALTIN" ? 6 : 4)} {curLabel(base)}
          </Text>
        </View>

        {/* Income / Expense row */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{
            flex: 1,
            backgroundColor: "rgba(52,211,153,0.06)",
            borderWidth: 1,
            borderColor: "rgba(52,211,153,0.18)",
            borderRadius: 20,
            padding: 16,
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <View style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: "rgba(52,211,153,0.15)", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="arrow-down-outline" size={13} color="#34D399" />
              </View>
              <Text style={{ color: "#34D399", fontSize: 10, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" }}>Gelir</Text>
            </View>
            <Text selectable style={{ color: "#fff", fontSize: 17, fontWeight: "800", marginBottom: 2 }}>
              {converted(income)} {curLabel(base)}
            </Text>
            <Text style={{ color: "#555", fontSize: 11 }}>₺{fmt(income)}</Text>
          </View>
          <View style={{
            flex: 1,
            backgroundColor: "rgba(248,113,113,0.06)",
            borderWidth: 1,
            borderColor: "rgba(248,113,113,0.18)",
            borderRadius: 20,
            padding: 16,
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <View style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: "rgba(248,113,113,0.15)", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="arrow-up-outline" size={13} color="#F87171" />
              </View>
              <Text style={{ color: "#F87171", fontSize: 10, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" }}>Gider</Text>
            </View>
            <Text selectable style={{ color: "#fff", fontSize: 17, fontWeight: "800", marginBottom: 2 }}>
              {converted(expense)} {curLabel(base)}
            </Text>
            <Text style={{ color: "#555", fontSize: 11 }}>₺{fmt(expense)}</Text>
          </View>
        </View>

        {/* Inflation insight */}
        <View style={{
          backgroundColor: "rgba(248,113,113,0.05)",
          borderWidth: 1,
          borderColor: "rgba(248,113,113,0.14)",
          borderRadius: 20,
          padding: 16,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: "rgba(248,113,113,0.12)", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="trending-down-outline" size={15} color="#F87171" />
            </View>
            <Text style={{ color: "#F87171", fontSize: 13, fontWeight: "700" }}>Enflasyon Özeti</Text>
          </View>
          <Text style={{ color: "#666", fontSize: 13, lineHeight: 21 }}>
            Toplam gelirinizin döviz karşılığı{" "}
            <Text style={{ color: "#fff", fontWeight: "700" }}>{converted(income)} {curLabel(base)}</Text>.{" "}
            Giderler gelirinizin{" "}
            <Text style={{ color: income > 0 ? (expense / income > 0.8 ? "#F87171" : "#34D399") : "#F87171", fontWeight: "700" }}>
              %{income > 0 ? ((expense / income) * 100).toFixed(0) : "—"}
            </Text>
            'ini oluşturuyor.
          </Text>
        </View>

        {/* Live rates list */}
        <View style={{
          backgroundColor: "rgba(255,255,255,0.03)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.08)",
          borderRadius: 22,
          padding: 18,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 }}>
            <Ionicons name="swap-horizontal-outline" size={14} color="#555" />
            <Text style={{ color: "#555", fontSize: 11, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase" }}>
              Canlı Kurlar
            </Text>
          </View>
          {CURRENCIES.map((c, i, arr) => (
            <View
              key={c.key}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingBottom: 14,
                marginBottom: i < arr.length - 1 ? 14 : 0,
                borderBottomWidth: i < arr.length - 1 ? 1 : 0,
                borderBottomColor: "rgba(255,255,255,0.05)",
              }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: `${c.color}12`, borderWidth: 1, borderColor: `${c.color}22`, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                <Text style={{ fontSize: 18 }}>{c.flag}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700", marginBottom: 2 }}>{c.label}</Text>
                <Text style={{ color: "#444", fontSize: 11 }}>
                  {rawRates ? `₺${c.key === "ALTIN" ? fmt(rawRates[c.key]) : rawRates[c.key].toFixed(2)} / 1 ${curLabel(c.key)}` : "—"}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text selectable style={{ color: c.color, fontSize: 15, fontWeight: "800" }}>
                  {(balance * (rates ? rates[c.key] : FALLBACK_RATES[c.key])).toFixed(c.key === "ALTIN" ? 3 : 2)}
                </Text>
                <Text style={{ color: "#444", fontSize: 11 }}>{curLabel(c.key)}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </>
    </PremiumGate>
  );
}
