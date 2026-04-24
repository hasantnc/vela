import { useState, useMemo, useCallback } from "react";
import {
  ScrollView,
  View,
  Text,
  Modal,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { HapticPressable } from "@/components/HapticPressable";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/firebase/auth";
import { subscribeTransactions, subscribeCategoryLimits } from "@/lib/firebase/firestore";
import { useFocusEffect } from "expo-router";
import type { Transaction } from "@/types";
import { useCurrency } from "@/lib/context/currency";

/* ─── HELPERS ────────────────────────────────────────────────────────────────── */
const fmt = (n: number) =>
  new Intl.NumberFormat("tr-TR").format(Math.round(n));

const startOfDay = (d: Date) => {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
};

const addDays = (d: Date, n: number) => {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const TR_DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const TR_MONTHS = [
  "Oca","Şub","Mar","Nis","May","Haz",
  "Tem","Ağu","Eyl","Eki","Kas","Ara",
];

function getDayLabel(date: Date) {
  return `${date.getDate()} ${TR_MONTHS[date.getMonth()]}`;
}

/* ─── CATEGORIES ─────────────────────────────────────────────────────────────── */
const CATEGORY_COLORS: Record<string, string> = {
  Yemek:     "#FF6B6B",
  Ulaşım:    "#4ECDC4",
  Eğlence:   "#A78BFA",
  Fatura:    "#FCD34D",
  Alışveriş: "#FB923C",
  Gelir:     "#34D399",
  Diğer:     "#9CA3AF",
};

function colorForCategory(cat: string): string {
  const key = Object.keys(CATEGORY_COLORS).find((k) => cat?.startsWith(k));
  return key ? CATEGORY_COLORS[key] : CATEGORY_COLORS["Diğer"];
}

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

function iconForCategory(cat: string): IoniconsName {
  if (cat?.startsWith("Yemek"))     return "restaurant-outline";
  if (cat?.startsWith("Ulaşım"))    return "car-outline";
  if (cat?.startsWith("Eğlence"))   return "film-outline";
  if (cat?.startsWith("Fatura"))    return "receipt-outline";
  if (cat?.startsWith("Alışveriş")) return "bag-handle-outline";
  if (cat?.startsWith("Gelir"))     return "arrow-down-circle-outline";
  return "ellipsis-horizontal-circle-outline";
}

/* ─── COMPONENTS ─────────────────────────────────────────────────────────────── */
const ProgressBar = ({
  value, max, color = "#8B5CF6", height = 5,
}: { value: number; max: number; color?: string; height?: number }) => {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  return (
    <View style={{
      backgroundColor: "rgba(255,255,255,0.07)",
      borderRadius: height,
      height,
      overflow: "hidden",
    }}>
      <View style={{
        height: "100%",
        width: `${pct}%`,
        backgroundColor: color,
        borderRadius: height,
      }} />
    </View>
  );
};

const Card = ({
  children, style = {},
}: { children: React.ReactNode; style?: object }) => (
  <View style={{
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    borderRadius: 22,
    padding: 18,
    borderCurve: "continuous",
    ...style,
  }}>
    {children}
  </View>
);

/* ─── DAY DETAIL MODAL ───────────────────────────────────────────────────────── */
function DayDetailModal({
  visible,
  date,
  transactions,
  onClose,
}: {
  visible: boolean;
  date: Date | null;
  transactions: Transaction[];
  onClose: () => void;
}) {
  const { symbol, convert } = useCurrency();
  const total = transactions.reduce(
    (s, t) => s + (t.type === "expense" ? t.amount : -t.amount), 0
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: "#06060F" }}>
        {/* Header */}
        <View style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: 20,
          paddingTop: 24,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.07)",
        }}>
          <View>
            <Text style={{ color: "#888", fontSize: 12, fontWeight: "600", letterSpacing: 1 }}>
              {date ? getDayLabel(date) : ""}
            </Text>
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800", marginTop: 2 }}>
              Günlük Harcama
            </Text>
          </View>
          <HapticPressable
            onPress={onClose}
            style={{
              backgroundColor: "rgba(255,255,255,0.08)",
              borderRadius: 50,
              width: 34,
              height: 34,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="close" size={18} color="#fff" />
          </HapticPressable>
        </View>

        {/* Total */}
        <View style={{
          margin: 20,
          backgroundColor: "rgba(139,92,246,0.08)",
          borderWidth: 1,
          borderColor: "rgba(139,92,246,0.2)",
          borderRadius: 18,
          padding: 18,
          borderCurve: "continuous",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <Text style={{ color: "#888", fontSize: 13, fontWeight: "600" }}>
            Toplam Gider
          </Text>
          <Text style={{ color: "#F87171", fontSize: 22, fontWeight: "800" }}>
            {symbol}{convert(total)}
          </Text>
        </View>

        {/* Transaction list */}
        {transactions.length === 0 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="leaf-outline" size={42} color="#333" />
            <Text style={{ color: "#555", fontSize: 15, marginTop: 12 }}>
              Bu gün harcama yok
            </Text>
          </View>
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingBottom: 40 }}
            renderItem={({ item }) => {
              const color = colorForCategory(item.category);
              const iconName = iconForCategory(item.category);
              return (
                <View style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.07)",
                  borderRadius: 16,
                  padding: 14,
                  gap: 12,
                  borderCurve: "continuous",
                }}>
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: `${color}22`,
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <Ionicons name={iconName} size={18} color={color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>
                      {item.description || item.category}
                    </Text>
                    <Text style={{ color: "#555", fontSize: 12, marginTop: 2 }}>
                      {item.category}
                    </Text>
                  </View>
                  <Text style={{
                    color: item.type === "income" ? "#34D399" : "#F87171",
                    fontSize: 15,
                    fontWeight: "800",
                  }}>
                    {item.type === "income" ? "+" : "-"}{symbol}{convert(item.amount)}
                  </Text>
                </View>
              );
            }}
          />
        )}
      </View>
    </Modal>
  );
}

/* ─── SCREEN ─────────────────────────────────────────────────────────────────── */
export default function BudgetScreen() {
  const [period, setPeriod] = useState(1); // 0=haftalık, 1=aylık, 2=yıllık
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [categoryLimits, setCategoryLimitsState] = useState<Record<string, number>>({});
  const { user } = useAuth();
  const router = useRouter();
  const { symbol, convert } = useCurrency();

  /* Firestore realtime subscription */
  useFocusEffect(
    useCallback(() => {
      if (!user?.uid) return;
      const unsubTx = subscribeTransactions(user.uid, (data) => {
        setTransactions(data);
        setLoading(false);
        setRefreshing(false);
      });
      const unsubLimits = subscribeCategoryLimits(user.uid, setCategoryLimitsState);
      return () => { unsubTx(); unsubLimits(); };
    }, [user?.uid])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
  }, []);

  /* ── Derived data ───────────────────────────────────────────────────────── */
  const today = startOfDay(new Date());

  // Build chart data depending on period
  const chartBars = useMemo(() => {
    const now = new Date();
    if (period === 0) {
      // Weekly: last 7 days
      const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
      return days.map((day) => {
        const dayTxs = transactions.filter(
          (t) =>
            t.type === "expense" &&
            t.createdAt &&
            isSameDay(t.createdAt instanceof Date ? t.createdAt : t.createdAt?.toDate?.() ?? new Date(), day)
        );
        return {
          label: TR_DAYS[(day.getDay() + 6) % 7],
          total: dayTxs.reduce((s, t) => s + t.amount, 0),
          txs: dayTxs,
          day,
          isHighlight: isSameDay(day, today),
        };
      });
    } else if (period === 1) {
      // Monthly: week buckets within current month
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const weeks: { label: string; total: number; txs: Transaction[]; day: Date; isHighlight: boolean }[] = [];
      for (let w = 0; w < 5; w++) {
        const start = w * 7 + 1;
        const end = Math.min(start + 6, daysInMonth);
        if (start > daysInMonth) break;
        const weekTxs = transactions.filter((t) => {
          if (t.type !== "expense" || !t.createdAt) return false;
          const d = t.createdAt instanceof Date ? t.createdAt : t.createdAt?.toDate?.() ?? new Date();
          return (
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear() &&
            d.getDate() >= start &&
            d.getDate() <= end
          );
        });
        const weekDay = new Date(now.getFullYear(), now.getMonth(), start);
        const isHighlight = now.getDate() >= start && now.getDate() <= end;
        weeks.push({ label: `${start}-${end}`, total: weekTxs.reduce((s, t) => s + t.amount, 0), txs: weekTxs, day: weekDay, isHighlight });
      }
      return weeks;
    } else {
      // Yearly: 12 month buckets
      return Array.from({ length: 12 }, (_, m) => {
        const monthTxs = transactions.filter((t) => {
          if (t.type !== "expense" || !t.createdAt) return false;
          const d = t.createdAt instanceof Date ? t.createdAt : t.createdAt?.toDate?.() ?? new Date();
          return d.getMonth() === m && d.getFullYear() === now.getFullYear();
        });
        const day = new Date(now.getFullYear(), m, 1);
        return { label: TR_MONTHS[m], total: monthTxs.reduce((s, t) => s + t.amount, 0), txs: monthTxs, day, isHighlight: m === now.getMonth() };
      });
    }
  }, [transactions, period, today.toDateString()]);

  // Keep legacy names for the weekly tapping
  const dailyTotals = chartBars;
  const weekDays = chartBars.map((b) => b.day);
  const maxDaily = Math.max(...chartBars.map((d) => d.total), 1);

  // Expense totals for current period
  const periodExpenses = useMemo(() => {
    const now = new Date();
    return transactions.filter((t) => {
      if (t.type !== "expense") return false;
      if (!t.createdAt) return false;
      const date = t.createdAt instanceof Date ? t.createdAt : t.createdAt?.toDate?.() ?? new Date();
      if (period === 0) {
        // last 7 days
        return date >= addDays(today, -6);
      } else if (period === 1) {
        // this month
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      } else {
        // this year
        return date.getFullYear() === now.getFullYear();
      }
    });
  }, [transactions, period]);

  const totalExpense = periodExpenses.reduce((s, t) => s + t.amount, 0);
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);

  // Category breakdown
  const catData = useMemo(() => {
    const map: Record<string, { total: number; color: string; iconName: IoniconsName }> = {};
    periodExpenses.forEach((t) => {
      const key = t.category?.split("›")[0]?.trim() || "Diğer";
      if (!map[key]) {
        map[key] = {
          total: 0,
          color: colorForCategory(t.category),
          iconName: iconForCategory(t.category),
        };
      }
      map[key].total += t.amount;
    });
    return Object.entries(map)
      .map(([label, v]) => ({ label, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [periodExpenses]);

  /* ── Handlers ───────────────────────────────────────────────────────────── */
  function handleBarPress(dayData: { day: Date; total: number; txs: Transaction[] }) {
    
    setSelectedDay(dayData.day);
    setModalVisible(true);
  }

  const selectedDayTxs = useMemo(() => {
    if (!selectedDay) return [];
    return transactions.filter(
      (t) =>
        t.createdAt &&
      isSameDay(t.createdAt instanceof Date ? t.createdAt : t.createdAt?.toDate?.() ?? new Date(), selectedDay)
    );
  }, [selectedDay, transactions]);

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <>
      <Stack.Screen options={{ title: "Analiz", headerLargeTitle: true }} />

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
        {/* Period Selector */}
        <View style={{
          backgroundColor: "rgba(255,255,255,0.05)",
          borderRadius: 14,
          padding: 4,
          flexDirection: "row",
        }}>
          {["Haftalık", "Aylık", "Yıllık"].map((p, i) => (
            <HapticPressable
              key={p}
              onPress={() => {
                
                setPeriod(i);
              }}
              style={{
                flex: 1,
                paddingVertical: 10,
                backgroundColor: period === i ? "#8B5CF6" : "transparent",
                borderRadius: 10,
                alignItems: "center",
              }}
            >
              <Text style={{
                color: period === i ? "#fff" : "#555",
                fontSize: 13,
                fontWeight: "700",
              }}>
                {p}
              </Text>
            </HapticPressable>
          ))}
        </View>

        {/* Bar Chart — tappable */}
        <Card>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
            <Text style={{
              color: "#555",
              fontSize: 11,
              fontWeight: "700",
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}>
              {period === 0 ? "Günlük Harcama" : period === 1 ? "Haftalık Harcama" : "Aylık Harcama"}
            </Text>
            <Text style={{ color: "#444", fontSize: 11 }}>
              Detay için tıkla
            </Text>
          </View>

          {loading ? (
            <View style={{ height: 110, alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator color="#8B5CF6" />
            </View>
          ) : (
            <View style={{
              flexDirection: "row",
              alignItems: "flex-end",
              gap: period === 1 ? 5 : 8,
              height: 130,
              marginBottom: 12,
            }}>
              {chartBars.map((d, i) => {
                const h = d.total > 0 ? Math.max((d.total / maxDaily) * 100, 8) : 4;
                const isSelected =
                  selectedDay !== null && isSameDay(d.day, selectedDay) && modalVisible;

                return (
                  <HapticPressable
                    key={i}
                    onPress={() => handleBarPress(d)}
                    style={({ pressed }) => ({
                      flex: 1,
                      alignItems: "center",
                      gap: 5,
                      height: "100%",
                      justifyContent: "flex-end",
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Text style={{ color: "#555", fontSize: 9 }}>
                      {d.total >= 1000
                        ? `${(d.total / 1000).toFixed(1)}k`
                        : d.total > 0
                        ? d.total
                        : ""}
                    </Text>
                    <View style={{
                      width: "100%",
                      height: `${h}%`,
                      minHeight: 5,
                      backgroundColor: isSelected
                        ? "#C4B5FD"
                        : d.isHighlight
                        ? "#8B5CF6"
                        : d.total > 0
                        ? "rgba(139,92,246,0.35)"
                        : "rgba(255,255,255,0.05)",
                      borderRadius: 6,
                      borderWidth: isSelected ? 1 : 0,
                      borderColor: "#C4B5FD",
                    }} />
                    <Text style={{
                      color: d.isHighlight ? "#8B5CF6" : "#444",
                      fontSize: period === 1 ? 8 : 10,
                      fontWeight: d.isHighlight ? "800" : "500",
                    }}>
                      {d.label}
                    </Text>
                  </HapticPressable>
                );
              })}
            </View>
          )}
        </Card>

        {/* Category Breakdown */}
        <Card>
          <Text style={{
            color: "#555",
            fontSize: 11,
            fontWeight: "700",
            marginBottom: 16,
            letterSpacing: 1.5,
            textTransform: "uppercase",
          }}>
            Kategori Dağılımı
          </Text>

          {loading ? (
            <ActivityIndicator color="#8B5CF6" style={{ marginVertical: 20 }} />
          ) : catData.length === 0 ? (
            <Text style={{ color: "#444", textAlign: "center", paddingVertical: 20 }}>
              Bu dönemde harcama yok
            </Text>
          ) : (
            <View style={{ gap: 14 }}>
              {catData.map((c) => {
                const pct = totalExpense > 0
                  ? Math.round((c.total / totalExpense) * 100)
                  : 0;
                const catLimit = categoryLimits[c.label];
                const limitPct = catLimit ? Math.round((c.total / catLimit) * 100) : null;
                const overLimit = limitPct !== null && limitPct >= 100;
                const nearLimit = limitPct !== null && limitPct >= 80 && !overLimit;
                const barColor = overLimit ? "#EF4444" : nearLimit ? "#F59E0B" : c.color;

                return (
                  <View key={c.label}>
                    <View style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <View style={{ width: 24, height: 24, borderRadius: 7, backgroundColor: `${barColor}20`, alignItems: "center", justifyContent: "center" }}>
                          <Ionicons name={c.iconName} size={13} color={barColor} />
                        </View>
                        <Text style={{ color: "#bbb", fontSize: 13, fontWeight: "600" }}>
                          {c.label}
                        </Text>
                        {overLimit && (
                          <View style={{ backgroundColor: "rgba(239,68,68,0.15)", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                            <Text style={{ color: "#EF4444", fontSize: 10, fontWeight: "700" }}>AŞILDI</Text>
                          </View>
                        )}
                        {nearLimit && (
                          <View style={{ backgroundColor: "rgba(245,158,11,0.15)", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                            <Text style={{ color: "#F59E0B", fontSize: 10, fontWeight: "700" }}>%{limitPct}</Text>
                          </View>
                        )}
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text selectable style={{ color: overLimit ? "#EF4444" : "#fff", fontSize: 13, fontWeight: "800" }}>
                          {symbol}{convert(c.total)}
                        </Text>
                        {catLimit ? (
                          <Text style={{ color: "#444", fontSize: 11 }}>
                            / {symbol}{convert(catLimit)}
                          </Text>
                        ) : (
                          <Text style={{ color: "#444", fontSize: 11, minWidth: 28, textAlign: "right" }}>
                            {pct}%
                          </Text>
                        )}
                      </View>
                    </View>
                    <ProgressBar
                      value={c.total}
                      max={catLimit ?? totalExpense}
                      color={barColor}
                      height={5}
                    />
                  </View>
                );
              })}
            </View>
          )}
        </Card>

        {/* Total Summary */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{
            flex: 1,
            backgroundColor: "rgba(248,113,113,0.08)",
            borderWidth: 1,
            borderColor: "rgba(248,113,113,0.15)",
            borderRadius: 22,
            padding: 18,
            borderCurve: "continuous",
            alignItems: "center",
          }}>
            <Ionicons name="trending-down-outline" size={28} color="#F87171" />
            <Text selectable style={{
              color: "#F87171",
              fontSize: 22,
              fontWeight: "800",
              marginTop: 8,
              fontVariant: ["tabular-nums"],
            }}>
              {symbol}{convert(totalExpense)}
            </Text>
            <Text style={{ color: "#555", fontSize: 12, marginTop: 4, fontWeight: "600" }}>
              Toplam Gider
            </Text>
          </View>
          <View style={{
            flex: 1,
            backgroundColor: "rgba(52,211,153,0.08)",
            borderWidth: 1,
            borderColor: "rgba(52,211,153,0.15)",
            borderRadius: 22,
            padding: 18,
            borderCurve: "continuous",
            alignItems: "center",
          }}>
            <Ionicons name="trending-up-outline" size={28} color="#34D399" />
            <Text selectable style={{
              color: "#34D399",
              fontSize: 22,
              fontWeight: "800",
              marginTop: 8,
              fontVariant: ["tabular-nums"],
            }}>
              {symbol}{convert(totalIncome)}
            </Text>
            <Text style={{ color: "#555", fontSize: 12, marginTop: 4, fontWeight: "600" }}>
              Toplam Gelir
            </Text>
          </View>
        </View>

        {/* Net balance */}
        {totalIncome > 0 && (
          <Card style={{ alignItems: "center", paddingVertical: 14 }}>
            <Text style={{ color: "#555", fontSize: 12, fontWeight: "600" }}>Net Bakiye</Text>
            <Text selectable style={{
              fontSize: 26,
              fontWeight: "800",
              marginTop: 4,
              fontVariant: ["tabular-nums"],
              color: totalIncome - totalExpense >= 0 ? "#34D399" : "#F87171",
            }}>
              {totalIncome - totalExpense >= 0 ? "+" : ""}{symbol}{convert(totalIncome - totalExpense)}
            </Text>
          </Card>
        )}

        {/* Shortcut Tiles */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <HapticPressable
            onPress={() => router.push("/regret" as any)}
            style={{ flex: 1, backgroundColor: "rgba(245,158,11,0.06)", borderWidth: 1, borderColor: "rgba(245,158,11,0.15)", borderRadius: 22, padding: 18, borderCurve: "continuous", alignItems: "center" }}
          >
            <Ionicons name="happy-outline" size={28} color="#F59E0B" />
            <Text style={{ color: "#F59E0B", fontSize: 13, fontWeight: "700", marginTop: 8 }}>
              Pişmanlık Skoru
            </Text>
          </HapticPressable>
          <HapticPressable
            onPress={() => router.push("/currency" as any)}
            style={{ flex: 1, backgroundColor: "rgba(59,130,246,0.06)", borderWidth: 1, borderColor: "rgba(59,130,246,0.15)", borderRadius: 22, padding: 18, borderCurve: "continuous", alignItems: "center" }}
          >
            <Ionicons name="swap-horizontal-outline" size={28} color="#3B82F6" />
            <Text style={{ color: "#3B82F6", fontSize: 13, fontWeight: "700", marginTop: 8 }}>
              Döviz Analizi
            </Text>
          </HapticPressable>
        </View>

        {/* Kategori Limitleri shortcut */}
        <HapticPressable
          onPress={() => router.push("/category-limits" as any)}
          style={({ pressed }) => ({
            backgroundColor: pressed ? "rgba(139,92,246,0.12)" : "rgba(139,92,246,0.07)",
            borderWidth: 1,
            borderColor: "rgba(139,92,246,0.2)",
            borderRadius: 22,
            padding: 18,
            borderCurve: "continuous",
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
          })}
        >
          <View style={{
            width: 44, height: 44, borderRadius: 14,
            backgroundColor: "rgba(139,92,246,0.15)",
            borderWidth: 1, borderColor: "rgba(139,92,246,0.25)",
            alignItems: "center", justifyContent: "center",
          }}>
            <Ionicons name="options-outline" size={20} color="#A78BFA" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#A78BFA", fontSize: 14, fontWeight: "700" }}>
              Kategori Limitleri
            </Text>
            <Text style={{ color: "#555", fontSize: 12, marginTop: 2 }}>
              Her kategori için aylık limit belirle
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#555" />
        </HapticPressable>
      </ScrollView>

      {/* Day Detail Modal */}
      <DayDetailModal
        visible={modalVisible}
        date={selectedDay}
        transactions={selectedDayTxs}
        onClose={() => {
          setModalVisible(false);
          setSelectedDay(null);
        }}
      />
    </>
  );
}
