import { useState, useEffect } from "react";
import { ScrollView, View, Text, TextInput, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { HapticPressable } from "@/components/HapticPressable";
import { useAuth } from "@/lib/firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { fmt, PAYDAY_BUDGET_ITEMS, PAYDAY_STEP } from "@/constants/data";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];
const ITEM_ICON: Record<string, IoniconsName> = {
  kira:     "home-outline",
  hedefler: "trophy-outline",
  yemek:    "restaurant-outline",
  ulasim:   "car-outline",
  eglence:  "film-outline",
  diger:    "ellipsis-horizontal-circle-outline",
};

async function getPaydayData(uid: string) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.data()?.payday ?? null;
}

async function savePaydayData(uid: string, data: { payday: number; salary: string; budgets: Record<string, number> }) {
  await setDoc(doc(db, "users", uid), { payday: data }, { merge: true });
}

function getDaysLeft(dayOfMonth: number): number {
  const today = new Date();
  const next = new Date(today.getFullYear(), today.getMonth(), dayOfMonth);
  if (next <= today) next.setMonth(next.getMonth() + 1);
  return Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getPaydayDateStr(dayOfMonth: number): string {
  const today = new Date();
  const next = new Date(today.getFullYear(), today.getMonth(), dayOfMonth);
  if (next <= today) next.setMonth(next.getMonth() + 1);
  return next.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

export default function PaydayScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paydayDay, setPaydayDay] = useState(15);
  const [salary, setSalary] = useState("18500");
  const [budgets, setBudgets] = useState(
    Object.fromEntries(PAYDAY_BUDGET_ITEMS.map((i) => [i.key, i.default]))
  );

  useEffect(() => {
    if (!user) return;
    getPaydayData(user.uid).then((data) => {
      if (data) {
        if (data.paydayDay) setPaydayDay(data.paydayDay);
        if (data.salary) setSalary(data.salary);
        if (data.budgets) setBudgets(data.budgets);
      }
      setLoading(false);
    });
  }, [user]);

  const totalBudget = Object.values(budgets).reduce((s, v) => s + v, 0);
  const salaryNum   = parseInt(salary || "0", 10);
  const remaining   = salaryNum - totalBudget;
  const daysLeft    = getDaysLeft(paydayDay);
  const paydayDateStr = getPaydayDateStr(paydayDay);

  // Sınır yok — sadece 0'ın altına düşmesin
  const change = (key: string, delta: number) =>
    setBudgets((b) => ({ ...b, [key]: Math.max(0, b[key] + delta) }));

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await savePaydayData(user.uid, { payday: paydayDay, salary, budgets });
    setSaving(false);
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: "Maaş Günü Modu", headerBackTitle: "Geri" }} />
        <ActivityIndicator color="#34D399" style={{ marginTop: 60 }} />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Maaş Günü Modu", headerBackTitle: "Geri" }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: "#06060F" }}
        contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 40 }}
      >
        {/* Countdown */}
        <View style={{ backgroundColor: "rgba(52,211,153,0.06)", borderWidth: 1, borderColor: "rgba(52,211,153,0.2)", borderRadius: 22, padding: 24, borderCurve: "continuous", alignItems: "center" }}>
          <Text style={{ color: "#34D399", fontSize: 11, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Maaşa Kalan</Text>
          <Text style={{ color: "#fff", fontSize: 52, fontWeight: "900", letterSpacing: -2 }}>{daysLeft}</Text>
          <Text style={{ color: "#555", fontSize: 14 }}>gün · {paydayDateStr}</Text>
        </View>

        {/* Payday Day Input */}
        <View style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", borderRadius: 22, padding: 18, borderCurve: "continuous" }}>
          <Text style={{ color: "#888", fontSize: 11, fontWeight: "700", marginBottom: 10, letterSpacing: 1, textTransform: "uppercase" }}>Maaş Günü (Ayın kaçı?)</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            {[1, 5, 10, 15, 20, 25].map((d) => (
              <HapticPressable
                key={d}
                onPress={() => setPaydayDay(d)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: paydayDay === d ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.05)",
                  borderWidth: 1,
                  borderColor: paydayDay === d ? "rgba(52,211,153,0.4)" : "rgba(255,255,255,0.08)",
                }}
              >
                <Text style={{ color: paydayDay === d ? "#34D399" : "#666", fontSize: 13, fontWeight: "700" }}>{d}</Text>
              </HapticPressable>
            ))}
          </View>
        </View>

        {/* Salary Input */}
        <View style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", borderRadius: 22, padding: 18, borderCurve: "continuous" }}>
          <Text style={{ color: "#888", fontSize: 11, fontWeight: "700", marginBottom: 10, letterSpacing: 1, textTransform: "uppercase" }}>Beklenen Maaş</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ color: "#555", fontSize: 20 }}>₺</Text>
            <TextInput
              value={salary}
              onChangeText={(t) => setSalary(t.replace(/\D/g, ""))}
              keyboardType="numeric"
              style={{ flex: 1, color: "#fff", fontSize: 28, fontWeight: "900", letterSpacing: -1 }}
            />
          </View>
        </View>

        {/* Budget Allocation */}
        <View style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", borderRadius: 22, padding: 18, borderCurve: "continuous" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
            <Text style={{ color: "#888", fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" }}>Bütçe Dağılımı</Text>
            <Text style={{ color: remaining >= 0 ? "#34D399" : "#F87171", fontSize: 13, fontWeight: "700" }}>
              {remaining >= 0 ? `₺${fmt(remaining)} kaldı` : `₺${fmt(Math.abs(remaining))} aşıldı!`}
            </Text>
          </View>

          {PAYDAY_BUDGET_ITEMS.map((item, i) => {
            // Progress bar için maaşın %100'ü referans alınır, sınır yok
            const barPct = salaryNum > 0 ? Math.min((budgets[item.key] / salaryNum) * 100, 100) : 0;
            return (
              <View key={item.key} style={{ marginBottom: i < PAYDAY_BUDGET_ITEMS.length - 1 ? 16 : 0 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: `${item.color}22`, alignItems: "center", justifyContent: "center" }}>
                      <Ionicons name={ITEM_ICON[item.key] ?? "ellipsis-horizontal"} size={15} color={item.color} />
                    </View>
                    <Text style={{ color: "#ccc", fontSize: 13, fontWeight: "600" }}>{item.label}</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Text selectable style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>₺{fmt(budgets[item.key])}</Text>
                    <Text style={{ color: "#444", fontSize: 12 }}>
                      {salaryNum > 0 ? Math.round((budgets[item.key] / salaryNum) * 100) : 0}%
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <HapticPressable
                    onPress={() => change(item.key, -PAYDAY_STEP)}
                    style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" }}
                  >
                    <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>−</Text>
                  </HapticPressable>
                  <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 6, height: 6, overflow: "hidden" }}>
                    <View style={{ height: "100%", width: `${barPct}%`, backgroundColor: item.color, borderRadius: 6 }} />
                  </View>
                  <HapticPressable
                    onPress={() => change(item.key, +PAYDAY_STEP)}
                    style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: `${item.color}22`, alignItems: "center", justifyContent: "center" }}
                  >
                    <Text style={{ color: item.color, fontSize: 18, fontWeight: "700" }}>+</Text>
                  </HapticPressable>
                </View>
              </View>
            );
          })}
        </View>

        {/* AI Suggestion */}
        <View style={{ backgroundColor: "rgba(139,92,246,0.08)", borderWidth: 1, borderColor: "rgba(139,92,246,0.2)", borderRadius: 22, padding: 18, borderCurve: "continuous" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <Ionicons name="hardware-chip-outline" size={13} color="#8B5CF6" />
            <Text style={{ color: "#8B5CF6", fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" }}>AI Önerisi</Text>
          </View>
          <Text style={{ color: "#888", fontSize: 13, lineHeight: 22, marginBottom: 12 }}>
            Geçen ay yemeğe ₺4.200 harcadın, bütçen ₺3.000'dı.{" "}
            <Text style={{ color: "#F59E0B", fontWeight: "700" }}>₺1.200 aştın.</Text>{" "}
            Bu ay yemek bütçeni ₺3.500 olarak ayarlamanı öneririm.
          </Text>
          <HapticPressable
            onPress={() => setBudgets((b) => ({ ...b, yemek: 3500 }))}
            style={{ backgroundColor: "rgba(139,92,246,0.15)", borderWidth: 1, borderColor: "rgba(139,92,246,0.3)", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8, alignSelf: "flex-start" }}
          >
            <Text style={{ color: "#8B5CF6", fontSize: 13, fontWeight: "700" }}>Öneriyi Uygula</Text>
          </HapticPressable>
        </View>

        {/* Confirm */}
        <HapticPressable
          onPress={handleSave}
          disabled={saving}
          style={{ backgroundColor: saving ? "rgba(16,185,129,0.4)" : "#10B981", borderRadius: 18, paddingVertical: 18, alignItems: "center" }}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>Bütçeyi Onayla & Kaydet</Text>
          }
        </HapticPressable>
      </ScrollView>
    </>
  );
}