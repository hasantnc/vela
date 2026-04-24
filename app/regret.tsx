import { useState, useCallback } from "react";
import { ScrollView, View, Text, Pressable, ActivityIndicator } from "react-native";
import { Stack, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/firebase/auth";
import { useHaptics } from "@/lib/context/haptics";
import { HapticPressable } from "@/components/HapticPressable";
import { subscribeRegretTransactions, setRegretScore } from "@/lib/firebase/firestore";
import { Transaction } from "@/types";
import { useCurrency } from "@/lib/context/currency";

const REGRET_EMOJIS = ["😤", "😕", "😐", "🙂", "😊"];

const fmt = (n: number) => new Intl.NumberFormat("tr-TR").format(Math.round(n));

const regretScoreColor = (s: number) =>
  s >= 4 ? "#34D399" : s >= 3 ? "#F59E0B" : "#F87171";

const regretScoreLabel = (s: number) =>
  s >= 4 ? "Değdi ✓" : s >= 3 ? "Orta" : "Pişman 😔";

function formatDate(val: any): string {
  if (!val) return "";
  try {
    const d = typeof val.toDate === "function" ? val.toDate() : new Date(val);
    return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  } catch { return ""; }
}

function formatTime(val: any): string {
  if (!val) return "";
  try {
    const d = typeof val.toDate === "function" ? val.toDate() : new Date(val);
    return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}

export default function RegretScreen() {
  const { user } = useAuth();
  const { symbol, convert } = useCurrency();
  const { selection } = useHaptics();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  useFocusEffect(useCallback(() => {
    if (!user?.uid) return;
    const unsub = subscribeRegretTransactions(user.uid, (txs) => {
      setTransactions(txs);
      setLoading(false);
    });
    return unsub;
  }, [user?.uid]));

  const handleRate = async (txId: string, score: number) => {
    if (!user?.uid) return;
    selection();
    setTransactions(prev =>
      prev.map(t => t.id === txId ? { ...t, regretScore: score } : t)
    );
    await setRegretScore(user.uid, txId, score);
  };

  const pending = transactions.filter(t => (t as any).regretScore == null);
  const scored  = transactions.filter(t => (t as any).regretScore != null);
  const avg = scored.length > 0
    ? Math.round(scored.reduce((s, t) => s + (t as any).regretScore, 0) / scored.length)
    : null;

  return (
    <>
      <Stack.Screen options={{ title: "Pişmanlık Skoru", headerBackTitle: "Geri" }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: "#06060F" }}
        contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 40 }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: "#555", fontSize: 13 }}>Harcamandan memnun kaldın mı?</Text>
          <HapticPressable
            onPress={() => setShowInfo(!showInfo)}
            style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }}
          >
            <Text style={{ color: "#888", fontSize: 12 }}>{showInfo ? "Kapat" : "Nedir?"}</Text>
          </HapticPressable>
        </View>

        {showInfo && (
          <View style={{ backgroundColor: "rgba(139,92,246,0.08)", borderWidth: 1, borderColor: "rgba(139,92,246,0.2)", borderRadius: 22, padding: 18, borderCurve: "continuous" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Ionicons name="information-circle-outline" size={14} color="#8B5CF6" />
              <Text style={{ color: "#8B5CF6", fontSize: 12, fontWeight: "700" }}>Pişmanlık Skoru Nedir?</Text>
            </View>
            <Text style={{ color: "#888", fontSize: 13, lineHeight: 22 }}>
              Harcamandan sonra sana soruyoruz: "Bu harcamadan memnun kaldın mı?" 1-5 arası puanlarsın. Zamanla hangi harcama tiplerinden pişman olduğunu görürsün.
            </Text>
          </View>
        )}

        {loading ? (
          <ActivityIndicator color="#F59E0B" style={{ marginTop: 40 }} />
        ) : (
          <>
            {avg !== null && (
              <View style={{ backgroundColor: `${regretScoreColor(avg)}0D`, borderWidth: 1, borderColor: `${regretScoreColor(avg)}25`, borderRadius: 22, padding: 20, borderCurve: "continuous", alignItems: "center" }}>
                <Text style={{ color: "#888", fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Ortalama Memnuniyet</Text>
                <Text style={{ color: regretScoreColor(avg), fontSize: 48, fontWeight: "900" }}>{avg}/5</Text>
                <Text style={{ color: regretScoreColor(avg), fontSize: 14, fontWeight: "700" }}>{regretScoreLabel(avg)}</Text>
              </View>
            )}

            {pending.length > 0 && (
              <>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="time-outline" size={14} color="#F59E0B" />
                  <Text style={{ color: "#F59E0B", fontSize: 13, fontWeight: "700" }}>Değerlendirmen Bekleniyor</Text>
                </View>
                {pending.map((item) => (
                  <View key={item.id} style={{ backgroundColor: "rgba(245,158,11,0.06)", borderWidth: 1, borderColor: "rgba(245,158,11,0.2)", borderRadius: 22, padding: 18, borderCurve: "continuous" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 }}>
                      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(248,113,113,0.1)", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {(item as any).emoji
                        ? <Text style={{ fontSize: 22 }}>{(item as any).emoji}</Text>
                        : <Ionicons name="card-outline" size={22} color="#F87171" />
                      }
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700", marginBottom: 2 }}>
                          {item.description ?? (item as any).label ?? item.category}
                        </Text>
                        <Text style={{ color: "#555", fontSize: 12 }}>
                          {formatDate(item.createdAt)} · {formatTime(item.createdAt)} · <Text style={{ color: "#F87171" }}>-{symbol}{convert(item.amount)}</Text>
                        </Text>
                      </View>
                    </View>
                    <Text style={{ color: "#aaa", fontSize: 13, marginBottom: 12 }}>Bu harcamadan memnun kaldın mı?</Text>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <HapticPressable
                          key={s}
                          onPress={() => handleRate(item.id, s)}
                          style={{ flex: 1, paddingVertical: 10, backgroundColor: s <= 2 ? "rgba(248,113,113,0.1)" : s === 3 ? "rgba(245,158,11,0.1)" : "rgba(52,211,153,0.1)", borderWidth: 1, borderColor: s <= 2 ? "rgba(248,113,113,0.2)" : s === 3 ? "rgba(245,158,11,0.2)" : "rgba(52,211,153,0.2)", borderRadius: 12, alignItems: "center" }}
                        >
                          <Text style={{ fontSize: 18 }}>{REGRET_EMOJIS[s - 1]}</Text>
                        </HapticPressable>
                      ))}
                    </View>
                  </View>
                ))}
              </>
            )}

            {scored.length > 0 && (
              <>
                <Text style={{ color: "#888", fontSize: 13, fontWeight: "700" }}>Değerlendirilenler</Text>
                {scored.map((item) => {
                  const score = (item as any).regretScore;
                  return (
                    <View key={item.id} style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", borderRadius: 22, padding: 14, borderCurve: "continuous", flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {(item as any).emoji
                        ? <Text style={{ fontSize: 20 }}>{(item as any).emoji}</Text>
                        : <Ionicons name="card-outline" size={20} color="#888" />
                      }
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700", marginBottom: 2 }}>
                          {item.description ?? (item as any).label ?? item.category}
                        </Text>
                        <Text style={{ color: "#555", fontSize: 11 }}>-{symbol}{convert(item.amount)} · {formatDate(item.createdAt)}</Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={{ color: regretScoreColor(score), fontSize: 18, fontWeight: "900", marginBottom: 2 }}>{score}/5</Text>
                        <Text style={{ color: regretScoreColor(score), fontSize: 10, fontWeight: "700" }}>{regretScoreLabel(score)}</Text>
                      </View>
                    </View>
                  );
                })}
              </>
            )}

            {transactions.length === 0 && (
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <Ionicons name="leaf-outline" size={42} color="#333" />
                <Text style={{ color: "#555", fontSize: 14, marginTop: 12 }}>Henüz harcama yok</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </>
  );
}