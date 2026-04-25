import { useState, useEffect, useRef, useCallback } from "react";
import {
  ScrollView, View, Text,
  Modal, TextInput, KeyboardAvoidingView, ActivityIndicator, RefreshControl, Image, Alert,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/firebase/auth";
import { useHaptics } from "@/lib/context/haptics";
import { HapticPressable } from "@/components/HapticPressable";
import { categorize } from "@/lib/openai/categorize";
import type { Transaction } from "@/types";
import {
  addTransaction, subscribeTransactions, getDailyLimit,
  checkAndUpdateStreak, subscribeStreak, subscribeBadges, subscribePayday,
  deleteTransaction, updateTransaction,
} from "@/lib/firebase/firestore";
import { useCurrency } from "@/lib/context/currency";
import { notifyLimitExceeded, notifyLimitWarning } from "@/lib/notifications";
import { iconForCategory, colorForCategory } from "@/lib/categoryIcon";
const fmt = (n: number) => new Intl.NumberFormat("tr-TR").format(Math.round(n));

const GlowOrb = ({ top, right, left, bottom, color, size = 280, opacity = 0.12 }: any) => (
  <View pointerEvents="none" style={{ position: "absolute", top, right, left, bottom, width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity, zIndex: 0 }} />
);

const Pill = ({ children, color = "#8B5CF6" }: { children: string; color?: string }) => (
  <View style={{ backgroundColor: `${color}22`, borderWidth: 1, borderColor: `${color}44`, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 }}>
    <Text style={{ color, fontSize: 11, fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase" }}>{children}</Text>
  </View>
);

const ProgressBar = ({ value, max, color = "#8B5CF6", height = 6 }: any) => {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  return (
    <View style={{ backgroundColor: "rgba(255,255,255,0.07)", borderRadius: height, height, overflow: "hidden" }}>
      <View style={{ height: "100%", width: `${pct}%`, backgroundColor: color, borderRadius: height }} />
    </View>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const { symbol, convert, rate, currency } = useCurrency();
  const { user } = useAuth();
  const { notification } = useHaptics();
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");
  const [aiCategory, setAiCategory] = useState({ category: "Diğer", emoji: "📦" });
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dailyLimit, setDailyLimitState] = useState(1200);
  const [streakCurrent, setStreakCurrent] = useState(0);
  const [earnedBadgeCount, setEarnedBadgeCount] = useState(0);
  const [paydayDaysLeft, setPaydayDaysLeft] = useState<number | null>(null);
  const [usdRate, setUsdRate] = useState<number | null>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Edit transaction state
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editType, setEditType] = useState<"expense" | "income">("expense");
  const [editSaving, setEditSaving] = useState(false);

  const fetchMeta = useCallback(() => {
    if (!user) return;
    getDailyLimit(user.uid).then(setDailyLimitState);
    fetch("https://canlidoviz.com/doviz-kurlari", {
      headers: { "User-Agent": "Mozilla/5.0" },
    })
      .then((r) => r.text())
      .then((html) => {
        const m = html.match(/doviz-kurlari\/dolar[^>]*>.*?(\d+[.,]\d+)/s);
        if (m) setUsdRate(parseFloat(m[1].replace(",", ".")));
      })
      .catch(() => {});
  }, [user]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMeta();
    setTimeout(() => setRefreshing(false), 800);
  }, [fetchMeta]);

  const openEditTx = (t: Transaction) => {
    setEditTx(t);
    setEditLabel(t.label);
    setEditAmount(String(t.amount));
    setEditCategory(t.category);
    setEditType(t.type as "expense" | "income");
  };

  const closeEditTx = () => {
    setEditTx(null);
    setEditLabel("");
    setEditAmount("");
    setEditCategory("");
  };

  const handleEditSave = async () => {
    if (!user || !editTx) return;
    const amt = parseFloat(editAmount.replace(",", "."));
    if (!editLabel.trim() || isNaN(amt) || amt <= 0) return;
    setEditSaving(true);
    await updateTransaction(user.uid, String(editTx.id), {
      label: editLabel.trim(),
      amount: amt,
      category: editCategory,
      type: editType,
    });
    setEditSaving(false);
    closeEditTx();
  };

  const handleDeleteTx = (t: Transaction) => {
    Alert.alert(
      "İşlemi Sil",
      `"${t.label}" silinsin mi?`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: () => { if (user) deleteTransaction(user.uid, String(t.id)); },
        },
      ]
    );
  };

  useEffect(() => {
    if (!user) return;
    return subscribeTransactions(user.uid, setTxs);
  }, [user]);

  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  useEffect(() => {
    if (!user) return;
    return subscribeStreak(user.uid, (s) => setStreakCurrent(s.current));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    return subscribeBadges(user.uid, (b) => setEarnedBadgeCount(b.earnedIds.length));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    return subscribePayday(user.uid, setPaydayDaysLeft);
  }, [user]);

  // AI kategori — label değişince 600ms debounce
  useEffect(() => {
    if (!label.trim() || label.length < 2) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setAiLoading(true);
      const result = await categorize(label);
      setAiCategory(result);
      setAiLoading(false);
    }, 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [label]);

  // AI Insight — txs değişince gerçek veriye göre çek
  useEffect(() => {
    if (!txs.length) return;

    const inc = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const exp = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const bal = inc - exp;

    const byCategory: Record<string, number> = {};
    txs.forEach((t) => {
      if (t.type === "expense") {
        byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
      }
    });
    const catSummary = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat, amt]) => `${cat}: ₺${fmt(amt)}`)
      .join(", ");

    const context = `Toplam gelir: ₺${fmt(inc)}, Toplam gider: ₺${fmt(exp)}, Bakiye: ₺${fmt(bal)}, En çok harcanan kategoriler: ${catSummary || "veri yok"}`;

    fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.EXPO_PUBLIC_OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 80,
        messages: [
          {
            role: "system",
            content: "Sen VELA finans uygulamasının AI asistanısın. Kullanıcının harcama verisine göre 1-2 cümle kısa ve samimi bir günlük insight ver. Türkçe yaz. Emoji kullanma.",
          },
          { role: "user", content: context },
        ],
      }),
    })
      .then((r) => r.json())
      .then((d) => setAiInsight(d?.choices?.[0]?.message?.content ?? null))
      .catch(() => {});
  }, [txs]);

  const income  = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const today   = new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
  const todayExp = txs.filter((t) => t.type === "expense" && t.date === today).reduce((s, t) => s + t.amount, 0);
  const limitPct = Math.round((todayExp / dailyLimit) * 100);

  // Limit bildirimleri
  useEffect(() => {
    if (limitPct >= 100) {
      notifyLimitExceeded(symbol, dailyLimit);
    } else if (limitPct >= 80) {
      notifyLimitWarning(symbol, limitPct);
    }
  }, [limitPct]);

  const dövizSub = usdRate && balance > 0
    ? `$${(balance / usdRate).toFixed(0)} karşılığı`
    : "Döviz koruması";

  const paydaySub = paydayDaysLeft !== null
    ? paydayDaysLeft === 0 ? "Bugün maaş günü! 🎉" : `${paydayDaysLeft} gün kaldı`
    : "Hesaplanıyor...";

  const openModal = (t: "expense" | "income") => {
    setType(t);
    setAmount("");
    setLabel("");
    setAiCategory({ category: "Diğer", emoji: "📦" });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!user || !amount || !label) return;
    setSaving(true);
    try {
      const rawAmount = parseFloat(amount.replace(",", "."));
      const tryAmount = currency === "TRY" ? rawAmount : rawAmount / rate;
      await addTransaction(user.uid, {
        type,
        amount: tryAmount,
        label,
        emoji: aiCategory.emoji,
        category: aiCategory.category,
        date: new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "short" }),
        time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
      });
      await checkAndUpdateStreak(user.uid);
      notification();
      setModalVisible(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];
  const QUICK_ACCESS: { href: string; iconName: IoniconsName; label: string; sub: string; color: string }[] = [
    { href: "/streak",   iconName: "flame",           label: "Streak",    sub: `${streakCurrent} günlük seri`,    color: "#F59E0B" },
    { href: "/badges",   iconName: "trophy",          label: "Rozetler",  sub: `${earnedBadgeCount}/8 kazanıldı`, color: "#8B5CF6" },
    { href: "/payday",   iconName: "cash-outline",    label: "Maaş Günü", sub: paydaySub,                         color: "#34D399" },
    { href: "/currency", iconName: "swap-horizontal", label: "Döviz",     sub: dövizSub,                          color: "#3B82F6" },
  ];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: "#06060F" }}
        contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 110 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#8B5CF6"
            colors={["#8B5CF6"]}
          />
        }
      >
        <GlowOrb top={-80} right={-60} color="#8B5CF6" size={260} />
        <GlowOrb top={300} left={-80} color="#3B82F6" size={200} opacity={0.08} />

        {/* Header */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6, zIndex: 1 }}>
          <Image
            source={require("@/assets/icon.png")}
            style={{ width: 44, height: 44, borderRadius: 14 }}
            resizeMode="cover"
          />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <HapticPressable
              onPress={() => router.push("/streak")}
              style={{ backgroundColor: "rgba(245,158,11,0.12)", borderWidth: 1, borderColor: "rgba(245,158,11,0.25)", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Ionicons name="flame" size={14} color="#F59E0B" />
              <Text style={{ color: "#F59E0B", fontSize: 12, fontWeight: "700" }}>{streakCurrent} gün</Text>
            </HapticPressable>
          </View>
        </View>

        {/* Balance Card */}
        <View style={{ backgroundColor: "#12122A", borderWidth: 1, borderColor: "rgba(139,92,246,0.18)", borderRadius: 28, padding: 24, overflow: "hidden" }}>
          <Text style={{ color: "#8B5CF6", fontSize: 11, fontWeight: "700", marginBottom: 6, letterSpacing: 2, textTransform: "uppercase" }}>Toplam Bakiye</Text>
          <Text selectable style={{ color: "#fff", fontSize: 44, fontWeight: "800", marginBottom: 20, letterSpacing: -2 }}>{symbol}{convert(balance)}</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <HapticPressable
              onPress={() => openModal("income")}
              style={({ pressed }) => ({ flex: 1, backgroundColor: pressed ? "rgba(52,211,153,0.18)" : "rgba(52,211,153,0.09)", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "rgba(52,211,153,0.22)" })}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <View style={{ width: 22, height: 22, borderRadius: 7, backgroundColor: "rgba(52,211,153,0.2)", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="arrow-down-outline" size={13} color="#34D399" />
                </View>
                <Text style={{ color: "#34D399", fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" }}>Gelir</Text>
              </View>
              <Text selectable style={{ color: "#fff", fontSize: 17, fontWeight: "800" }}>{symbol}{convert(income)}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
                <Ionicons name="add-circle-outline" size={13} color="rgba(52,211,153,0.5)" />
                <Text style={{ color: "rgba(52,211,153,0.5)", fontSize: 11, fontWeight: "600" }}>Ekle</Text>
              </View>
            </HapticPressable>
            <HapticPressable
              onPress={() => openModal("expense")}
              style={({ pressed }) => ({ flex: 1, backgroundColor: pressed ? "rgba(248,113,113,0.18)" : "rgba(248,113,113,0.09)", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "rgba(248,113,113,0.22)" })}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <View style={{ width: 22, height: 22, borderRadius: 7, backgroundColor: "rgba(248,113,113,0.2)", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="arrow-up-outline" size={13} color="#F87171" />
                </View>
                <Text style={{ color: "#F87171", fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" }}>Gider</Text>
              </View>
              <Text selectable style={{ color: "#fff", fontSize: 17, fontWeight: "800" }}>{symbol}{convert(expense)}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
                <Ionicons name="add-circle-outline" size={13} color="rgba(248,113,113,0.5)" />
                <Text style={{ color: "rgba(248,113,113,0.5)", fontSize: 11, fontWeight: "600" }}>Ekle</Text>
              </View>
            </HapticPressable>
          </View>
        </View>

        {/* Daily Limit */}
        <View style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", borderRadius: 22, padding: 18, borderCurve: "continuous" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="lock-closed-outline" size={16} color="#aaa" />
              <Text style={{ color: "#aaa", fontSize: 13, fontWeight: "600" }}>Günlük Limit</Text>
            </View>
            <Pill color={limitPct >= 100 ? "#EF4444" : limitPct >= 80 ? "#F59E0B" : "#34D399"}>{`${limitPct}%`}</Pill>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
            <Text selectable style={{ color: "#fff", fontSize: 22, fontWeight: "800" }}>{symbol}{convert(todayExp)}</Text>
            <Text style={{ color: "#444", fontSize: 14, alignSelf: "center" }}>/ {symbol}{convert(dailyLimit)}</Text>
          </View>
          <ProgressBar value={todayExp} max={dailyLimit} color={limitPct >= 100 ? "#EF4444" : limitPct >= 80 ? "#F59E0B" : "#8B5CF6"} height={8} />
          {limitPct >= 80 && (
            <Text style={{ color: limitPct >= 100 ? "#F87171" : "#F59E0B", fontSize: 12, marginTop: 8, fontWeight: "600" }}>
              {limitPct >= 100 ? "✕ Limit aşıldı" : "↑ Limite yaklaşıyorsun!"}
            </Text>
          )}
        </View>

        {/* Quick Access */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {QUICK_ACCESS.map((item) => (
            <HapticPressable
              key={item.href}
              onPress={() => router.push(item.href as any)}
              style={{ width: "47.5%", backgroundColor: `${item.color}0D`, borderWidth: 1, borderColor: `${item.color}25`, borderRadius: 22, padding: 14, borderCurve: "continuous" }}
            >
              <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: `${item.color}18`, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={item.iconName} size={20} color={item.color} />
              </View>
              <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700", marginTop: 8, marginBottom: 2 }}>{item.label}</Text>
              <Text style={{ color: "#555", fontSize: 11 }}>{item.sub}</Text>
            </HapticPressable>
          ))}
        </View>

        {/* AI Insight */}
        <HapticPressable
          onPress={() => router.push("/(tabs)/(ai)/chat")}
          style={({ pressed }) => ({
            backgroundColor: pressed ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.06)",
            borderWidth: 1,
            borderColor: "rgba(16,185,129,0.15)",
            borderRadius: 22,
            padding: 18,
            borderCurve: "continuous",
          })}
        >
          <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
            <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: "rgba(16,185,129,0.15)", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Ionicons name="hardware-chip-outline" size={18} color="#10B981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#10B981", fontSize: 11, fontWeight: "700", marginBottom: 4, letterSpacing: 1, textTransform: "uppercase" }}>AI Asistan</Text>
              <Text style={{ color: "#bbb", fontSize: 13, lineHeight: 20 }}>
                {aiInsight ?? "Harcama verilerin analiz ediliyor..."}
              </Text>
            </View>
            <Text style={{ color: "#10B981", fontSize: 16, alignSelf: "center" }}>{'>'}</Text>
          </View>
        </HapticPressable>

        {/* Recent Transactions */}
        <View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>Son İşlemler</Text>
            <HapticPressable onPress={() => router.push("/history" as any)}>
              <Text style={{ color: "#8B5CF6", fontSize: 13, fontWeight: "700" }}>Tümü</Text>
            </HapticPressable>
          </View>
          <View style={{ gap: 8 }}>
            {txs.length === 0 && (
              <View style={{ alignItems: "center", paddingVertical: 30 }}>
                <Ionicons name="receipt-outline" size={38} color="#333" />
                <Text style={{ color: "#555", fontSize: 13, marginTop: 8 }}>Henüz işlem yok — gelir veya gider ekle</Text>
              </View>
            )}
            {txs.slice(0, 4).map((t) => {
              const catIcon = iconForCategory(t.category);
              const catColor = t.type === "income" ? "#34D399" : colorForCategory(t.category);
              return (
                <View key={t.id} style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", borderRadius: 22, padding: 14, borderCurve: "continuous", flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={{ width: 42, height: 42, borderRadius: 14, flexShrink: 0, backgroundColor: `${catColor}18`, alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name={catIcon} size={20} color={catColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700", marginBottom: 2 }}>{t.label}</Text>
                    <Text style={{ color: "#444", fontSize: 11 }}>{t.category} · {t.time}</Text>
                  </View>
                  <Text selectable style={{ color: t.type === "income" ? "#34D399" : "#F87171", fontSize: 15, fontWeight: "800", marginRight: 4 }}>
                    {t.type === "income" ? "+" : "-"}{symbol}{convert(t.amount)}
                  </Text>
                  <HapticPressable onPress={() => openEditTx(t)} style={{ padding: 6 }}>
                    <Ionicons name="pencil-outline" size={15} color="#666" />
                  </HapticPressable>
                  <HapticPressable onPress={() => handleDeleteTx(t)} style={{ padding: 6 }}>
                    <Ionicons name="trash-outline" size={15} color="#F87171" />
                  </HapticPressable>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Add Transaction Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: "#0C0C1A" }}>
          <View style={{ padding: 20, gap: 16, flex: 1 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>
                {type === "expense" ? "Gider Ekle" : "Gelir Ekle"}
              </Text>
              <HapticPressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#555" />
              </HapticPressable>
            </View>

            <View style={{ flexDirection: "row", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 14, padding: 4, gap: 4 }}>
              {(["expense", "income"] as const).map((t) => (
                <HapticPressable
                  key={t}
                  onPress={() => setType(t)}
                  style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", backgroundColor: type === t ? (t === "expense" ? "#EF4444" : "#10B981") : "transparent" }}
                >
                  <Text style={{ color: type === t ? "#fff" : "#555", fontSize: 13, fontWeight: "700" }}>
                    {t === "expense" ? "Gider" : "Gelir"}
                  </Text>
                </HapticPressable>
              ))}
            </View>

            <View style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 16, flexDirection: "row", alignItems: "center", paddingHorizontal: 16 }}>
              <Text style={{ color: "#555", fontSize: 20, fontWeight: "900", marginRight: 8 }}>{symbol}</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0"
                placeholderTextColor="#333"
                keyboardType="decimal-pad"
                style={{ flex: 1, color: "#fff", fontSize: 32, fontWeight: "800", paddingVertical: 14 }}
                autoFocus
              />
            </View>

            <View style={{ gap: 8 }}>
              <View style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 16, paddingHorizontal: 16 }}>
                <TextInput
                  value={label}
                  onChangeText={setLabel}
                  placeholder="Açıklama (Starbucks, Maaş...)"
                  placeholderTextColor="#444"
                  style={{ color: "#fff", fontSize: 15, paddingVertical: 14 }}
                />
              </View>

              {label.length >= 2 && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "rgba(139,92,246,0.08)", borderWidth: 1, borderColor: "rgba(139,92,246,0.2)", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 }}>
                  {aiLoading ? (
                    <>
                      <ActivityIndicator size="small" color="#8B5CF6" />
                      <Text style={{ color: "#666", fontSize: 13 }}>AI kategori belirliyor...</Text>
                    </>
                  ) : (
                    <>
                      <Text style={{ fontSize: 20 }}>{aiCategory.emoji}</Text>
                      <Text style={{ color: "#A78BFA", fontSize: 13, fontWeight: "600" }}>{aiCategory.category}</Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginLeft: "auto" }}>
                        <Ionicons name="hardware-chip-outline" size={11} color="#555" />
                        <Text style={{ color: "#555", fontSize: 11 }}>AI</Text>
                      </View>
                    </>
                  )}
                </View>
              )}
            </View>

            <HapticPressable
              onPress={handleSave}
              disabled={!amount || !label || saving || aiLoading}
              style={({ pressed }) => ({
                backgroundColor: !amount || !label ? "rgba(255,255,255,0.05)" : pressed ? "#5B21B6" : "#7C3AED",
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: "center",
                marginTop: "auto",
              })}
            >
              {saving ? <ActivityIndicator color="#fff" /> : (
                <Text style={{ color: !amount || !label ? "#333" : "#fff", fontSize: 16, fontWeight: "800" }}>Kaydet</Text>
              )}
            </HapticPressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Transaction Modal */}
      <Modal
        visible={editTx !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeEditTx}
      >
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: "#0C0C1A" }}>
          <View style={{ padding: 20, gap: 16, flex: 1 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>İşlemi Düzenle</Text>
              <HapticPressable onPress={closeEditTx}>
                <Ionicons name="close" size={24} color="#555" />
              </HapticPressable>
            </View>

            <View style={{ flexDirection: "row", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 14, padding: 4, gap: 4 }}>
              {(["expense", "income"] as const).map((tp) => (
                <HapticPressable
                  key={tp}
                  onPress={() => setEditType(tp)}
                  style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", backgroundColor: editType === tp ? (tp === "expense" ? "#EF4444" : "#10B981") : "transparent" }}
                >
                  <Text style={{ color: editType === tp ? "#fff" : "#555", fontSize: 13, fontWeight: "700" }}>
                    {tp === "expense" ? "Gider" : "Gelir"}
                  </Text>
                </HapticPressable>
              ))}
            </View>

            <View style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 16, flexDirection: "row", alignItems: "center", paddingHorizontal: 16 }}>
              <Text style={{ color: "#555", fontSize: 20, fontWeight: "900", marginRight: 8 }}>{symbol}</Text>
              <TextInput
                value={editAmount}
                onChangeText={setEditAmount}
                placeholder="0"
                placeholderTextColor="#333"
                keyboardType="decimal-pad"
                style={{ flex: 1, color: "#fff", fontSize: 32, fontWeight: "800", paddingVertical: 14 }}
              />
            </View>

            <View style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 16, paddingHorizontal: 16 }}>
              <TextInput
                value={editLabel}
                onChangeText={setEditLabel}
                placeholder="Açıklama"
                placeholderTextColor="#444"
                style={{ color: "#fff", fontSize: 15, paddingVertical: 14 }}
              />
            </View>

            <HapticPressable
              onPress={handleEditSave}
              disabled={!editLabel.trim() || !editAmount || editSaving}
              style={({ pressed }) => ({
                backgroundColor: !editLabel.trim() || !editAmount ? "rgba(255,255,255,0.05)" : pressed ? "#5B21B6" : "#7C3AED",
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: "center",
                marginTop: "auto",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              })}
            >
              {editSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={18} color={!editLabel.trim() || !editAmount ? "#333" : "#fff"} />
                  <Text style={{ color: !editLabel.trim() || !editAmount ? "#333" : "#fff", fontSize: 16, fontWeight: "800" }}>Kaydet</Text>
                </>
              )}
            </HapticPressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}