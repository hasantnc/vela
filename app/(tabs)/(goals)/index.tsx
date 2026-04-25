import { useState, useEffect, useRef } from "react";
import {
  ScrollView, View, Text,
  Modal, TextInput, KeyboardAvoidingView, ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HapticPressable } from "@/components/HapticPressable";
import { Stack, useRouter } from "expo-router";
import { useAuth } from "@/lib/firebase/auth";
import { useCurrency } from "@/lib/context/currency";
import { usePremium } from "@/lib/context/premium";

const FREE_GOAL_LIMIT = 3;
import { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { subscribeTransactions } from "@/lib/firebase/firestore";
import { Transaction } from "@/types";

type Goal = {
  id: string;
  emoji: string;
  label: string;
  target: number;
  current: number;
  deadline: string;
  color: string;
};

const COLORS = ["#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#EC4899"];
const GOAL_ICONS: Array<{ name: string; label: string }> = [
  { name: "airplane-outline",    label: "Tatil" },
  { name: "laptop-outline",      label: "Teknoloji" },
  { name: "home-outline",        label: "Ev" },
  { name: "car-outline",         label: "Araç" },
  { name: "phone-portrait-outline", label: "Telefon" },
  { name: "school-outline",      label: "Eğitim" },
  { name: "diamond-outline",     label: "Düğün" },
  { name: "umbrella-outline",    label: "Tatil" },
  { name: "cash-outline",        label: "Birikim" },
  { name: "trophy-outline",      label: "Hedef" },
  { name: "heart-outline",       label: "Sağlık" },
  { name: "bicycle-outline",     label: "Spor" },
];

const ProgressBar = ({ value, max, color = "#8B5CF6", height = 8 }: any) => {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  return (
    <View style={{ backgroundColor: "rgba(255,255,255,0.07)", borderRadius: height, height, overflow: "hidden" }}>
      <View style={{ height: "100%", width: `${pct}%`, backgroundColor: color, borderRadius: height }} />
    </View>
  );
};

const Stepper = ({ value, onDecrement, onIncrement }: any) => (
  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
    <HapticPressable onPress={onDecrement} style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700", lineHeight: 20 }}>−</Text>
    </HapticPressable>
    <Text style={{ color: "#8B5CF6", fontSize: 15, fontWeight: "800", minWidth: 22, textAlign: "center" }}>{value}x</Text>
    <HapticPressable onPress={onIncrement} style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: "rgba(139,92,246,0.2)", alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: "#8B5CF6", fontSize: 18, fontWeight: "700", lineHeight: 20 }}>+</Text>
    </HapticPressable>
  </View>
);

const SIM_ITEMS = [
  { key: "coffee",    label: "Kahve azalt",     iconName: "cafe-outline" },
  { key: "food",      label: "Dışarıda yeme",   iconName: "restaurant-outline" },
  { key: "transport", label: "Uber → Metro",    iconName: "subway-outline" },
];

export default function GoalsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { symbol, convert, rate, currency } = useCurrency();
  const { isPremium } = usePremium();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [simGoal, setSimGoal] = useState<string | null>(null);
  const [cuts, setCuts] = useState({ coffee: 0, food: 0, transport: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [saving, setSaving] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Form state
  const [newLabel, setNewLabel] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newCurrent, setNewCurrent] = useState("0");
  const [newDeadline, setNewDeadline] = useState("");
  const [newIconName, setNewIconName] = useState("trophy-outline");
  const [newColor, setNewColor] = useState(COLORS[0]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "goals"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setGoals(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Goal)));
      setLoading(false);
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    return subscribeTransactions(user.uid, setTransactions);
  }, [user]);

  const change = (key: string, delta: number) =>
    setCuts((c) => ({ ...c, [key]: Math.max(0, Math.min(5, c[key as keyof typeof c] + delta)) }));

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const baseSavings = Math.max(totalIncome - totalExpense, 0);
  const savings = baseSavings + cuts.coffee * 200 + cuts.food * 400 + cuts.transport * 150;

  const openModal = (goal?: Goal) => {
    if (goal) {
      setEditGoal(goal);
      setNewLabel(goal.label);
      setNewTarget(String(convert(goal.target)));
      setNewCurrent(String(convert(goal.current)));
      setNewDeadline(goal.deadline === "Belirsiz" ? "" : goal.deadline);
      setNewIconName(goal.emoji || "trophy-outline");
      setNewColor(goal.color);
    } else {
      setEditGoal(null);
      setNewLabel(""); setNewTarget(""); setNewCurrent("0");
      setNewDeadline(""); setNewIconName("trophy-outline"); setNewColor(COLORS[0]);
    }
    setModalVisible(true);
  };

  const handleDelete = async (goalId: string) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "goals", goalId));
  };

  const handleSave = async () => {
    if (!user || !newLabel || !newTarget) return;
    setSaving(true);
    try {
      const rawTarget  = parseFloat(newTarget.replace(",", "."));
      const rawCurrent = parseFloat(newCurrent.replace(",", ".")) || 0;
      const tryTarget  = currency === "TRY" ? rawTarget  : rawTarget  / rate;
      const tryCurrent = currency === "TRY" ? rawCurrent : rawCurrent / rate;
      if (editGoal) {
        await updateDoc(doc(db, "users", user.uid, "goals", editGoal.id), {
          label: newLabel,
          target: tryTarget,
          current: tryCurrent,
          deadline: newDeadline || "Belirsiz",
          emoji: newIconName,
          color: newColor,
        });
      } else {
        await addDoc(collection(db, "users", user.uid, "goals"), {
          label: newLabel,
          target: tryTarget,
          current: tryCurrent,
          deadline: newDeadline || "Belirsiz",
          emoji: newIconName,
          color: newColor,
          createdAt: serverTimestamp(),
        });
      }
      setModalVisible(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Hedefler", headerLargeTitle: true }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: "#06060F" }}
        contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 110 }}
      >
        <View style={{ backgroundColor: "rgba(16,185,129,0.08)", borderWidth: 1, borderColor: "rgba(16,185,129,0.18)", borderRadius: 22, padding: 18, borderCurve: "continuous" }}>
          <Text style={{ color: "#10B981", fontSize: 11, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>Finansal Durum</Text>
          <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>
            {goals.length} aktif hedef · Aylık {symbol}{convert(savings)} tasarruf
          </Text>
        </View>

        {loading && <ActivityIndicator color="#8B5CF6" style={{ paddingTop: 20 }} />}

        {!loading && goals.length === 0 && (
          <View style={{ alignItems: "center", paddingVertical: 40, gap: 10 }}>
            <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: "rgba(139,92,246,0.12)", borderWidth: 1, borderColor: "rgba(139,92,246,0.2)", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="trophy-outline" size={26} color="#6D28D9" />
            </View>
            <Text style={{ color: "#555", fontSize: 14 }}>Henüz hedef yok</Text>
          </View>
        )}

        {goals.map((g) => {
          const pct = Math.round((g.current / g.target) * 100);
          const remaining = g.target - g.current;
          const monthsLeft = Math.ceil(remaining / savings);
          const isOpen = simGoal === g.id;

          return (
            <HapticPressable
              key={g.id}
              onPress={() => setSimGoal(isOpen ? null : g.id)}
              style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: isOpen ? `${g.color}44` : "rgba(255,255,255,0.09)", borderRadius: 22, padding: 18, borderCurve: "continuous" }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: `${g.color}18`, borderWidth: 1, borderColor: `${g.color}33`, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {/[^\u0000-\u007F]/.test(g.emoji ?? "") ? (
                    <Text style={{ fontSize: 24 }}>{g.emoji}</Text>
                  ) : (
                    <Ionicons name={(g.emoji || "trophy-outline") as any} size={24} color={g.color} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700", marginBottom: 2 }}>{g.label}</Text>
                  <Text style={{ color: "#555", fontSize: 12 }}>{g.deadline}</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={{ color: g.color, fontSize: 16, fontWeight: "800", marginRight: 6 }}>{pct}%</Text>
                  <HapticPressable
                    onPress={() => openModal(g)}
                    style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(139,92,246,0.12)", alignItems: "center", justifyContent: "center" }}
                  >
                    <Ionicons name="pencil-outline" size={15} color="#8B5CF6" />
                  </HapticPressable>
                  <HapticPressable
                    onPress={() => handleDelete(g.id)}
                    style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(239,68,68,0.1)", alignItems: "center", justifyContent: "center" }}
                  >
                    <Ionicons name="trash-outline" size={15} color="#EF4444" />
                  </HapticPressable>
                </View>
              </View>

              <ProgressBar value={g.current} max={g.target} color={g.color} height={8} />

              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
                <Text selectable style={{ color: "#666", fontSize: 12 }}>{symbol}{convert(g.current)} / {symbol}{convert(g.target)}</Text>
                <Text style={{ color: g.color, fontSize: 12, fontWeight: "700" }}>~{monthsLeft} ay</Text>
              </View>

              {isOpen && (
                <View style={{ marginTop: 14, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)", paddingTop: 14, gap: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Ionicons name="options-outline" size={13} color="#8B5CF6" />
                    <Text style={{ color: "#8B5CF6", fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" }}>Senaryo Simülatörü</Text>
                  </View>
                  {SIM_ITEMS.map((item) => (
                    <View key={item.key} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: "rgba(139,92,246,0.1)", alignItems: "center", justifyContent: "center" }}>
                          <Ionicons name={item.iconName as any} size={14} color="#8B5CF6" />
                        </View>
                        <Text style={{ color: "#ccc", fontSize: 13 }}>{item.label}</Text>
                      </View>
                      <Stepper value={cuts[item.key as keyof typeof cuts]} onDecrement={() => change(item.key, -1)} onIncrement={() => change(item.key, +1)} />
                    </View>
                  ))}
                  <View style={{ backgroundColor: "rgba(139,92,246,0.12)", borderRadius: 14, padding: 14, alignItems: "center", marginTop: 4 }}>
                    <Text style={{ color: "#888", fontSize: 12, marginBottom: 4 }}>Aylık tasarruf</Text>
                    <Text selectable style={{ color: "#8B5CF6", fontSize: 24, fontWeight: "800", marginBottom: 4 }}>{symbol}{convert(savings)}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Ionicons name="checkmark-circle" size={15} color="#34D399" />
                      <Text style={{ color: "#34D399", fontSize: 13, fontWeight: "700" }}>{Math.ceil(remaining / savings)} ayda hedefe ulaşırsın</Text>
                    </View>
                  </View>
                </View>
              )}
            </HapticPressable>
          );
        })}

        <HapticPressable
          onPress={() => {
            if (!isPremium && goals.length >= FREE_GOAL_LIMIT) {
              router.push("/premium");
            } else {
              openModal();
            }
          }}
          style={{ borderWidth: 2, borderColor: "rgba(139,92,246,0.3)", borderStyle: "dashed", borderRadius: 20, padding: 20, alignItems: "center", gap: 4 }}
        >
          <Text style={{ color: "#8B5CF6", fontSize: 15, fontWeight: "600" }}>＋ Yeni Hedef Ekle</Text>
          {!isPremium && goals.length >= FREE_GOAL_LIMIT && (
            <Text style={{ color: "#555", fontSize: 11 }}>Ücretsiz planda en fazla {FREE_GOAL_LIMIT} hedef — Premium'a geç</Text>
          )}
        </HapticPressable>
      </ScrollView>

      {/* Add Goal Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: "#0C0C1A" }}>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}>
            {/* Header */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>{editGoal ? "Hedefi Düzenle" : "Yeni Hedef"}</Text>
              <HapticPressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#555" />
              </HapticPressable>
            </View>

            {/* İkon seç */}
            <View style={{ gap: 8 }}>
              <Text style={{ color: "#555", fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" }}>İkon</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {GOAL_ICONS.map((g) => (
                  <HapticPressable
                    key={g.name}
                    onPress={() => setNewIconName(g.name)}
                    style={{ width: 50, height: 50, borderRadius: 16, backgroundColor: newIconName === g.name ? `${newColor}22` : "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: newIconName === g.name ? newColor : "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" }}
                  >
                    <Ionicons name={g.name as any} size={22} color={newIconName === g.name ? newColor : "#555"} />
                  </HapticPressable>
                ))}
              </View>
            </View>

            {/* Renk seç */}
            <View style={{ gap: 8 }}>
              <Text style={{ color: "#555", fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" }}>Renk</Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {COLORS.map((c) => (
                  <HapticPressable key={c} onPress={() => setNewColor(c)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c, borderWidth: newColor === c ? 3 : 0, borderColor: "#fff" }} />
                ))}
              </View>
            </View>

            {/* Hedef adı */}
            <View style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 16, paddingHorizontal: 16 }}>
              <TextInput value={newLabel} onChangeText={setNewLabel} placeholder="Hedef adı (Avrupa Tatili...)" placeholderTextColor="#444" style={{ color: "#fff", fontSize: 15, paddingVertical: 14 }} />
            </View>

            {/* Hedef tutar */}
            <View style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 16, flexDirection: "row", alignItems: "center", paddingHorizontal: 16 }}>
              <Text style={{ color: "#555", fontSize: 16, fontWeight: "700", marginRight: 8 }}>{symbol}</Text>
              <TextInput value={newTarget} onChangeText={setNewTarget} placeholder="Hedef tutar" placeholderTextColor="#444" keyboardType="decimal-pad" style={{ flex: 1, color: "#fff", fontSize: 20, fontWeight: "700", paddingVertical: 14 }} />
            </View>

            {/* Mevcut birikim */}
            <View style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 16, flexDirection: "row", alignItems: "center", paddingHorizontal: 16 }}>
              <Text style={{ color: "#555", fontSize: 16, fontWeight: "700", marginRight: 8 }}>{symbol}</Text>
              <TextInput value={newCurrent} onChangeText={setNewCurrent} placeholder="Mevcut birikim (0)" placeholderTextColor="#444" keyboardType="decimal-pad" style={{ flex: 1, color: "#fff", fontSize: 20, fontWeight: "700", paddingVertical: 14 }} />
            </View>

            {/* Deadline */}
            <View style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 16, paddingHorizontal: 16 }}>
              <TextInput value={newDeadline} onChangeText={setNewDeadline} placeholder="Son tarih (Ağustos 2025)" placeholderTextColor="#444" style={{ color: "#fff", fontSize: 15, paddingVertical: 14 }} />
            </View>

            {/* Kaydet */}
            <HapticPressable
              onPress={handleSave}
              disabled={!newLabel || !newTarget || saving}
              style={({ pressed }) => ({ backgroundColor: !newLabel || !newTarget ? "rgba(255,255,255,0.05)" : pressed ? "#5B21B6" : "#7C3AED", borderRadius: 16, paddingVertical: 16, alignItems: "center" })}
            >
              {saving ? <ActivityIndicator color="#fff" /> : (
                <Text style={{ color: !newLabel || !newTarget ? "#333" : "#fff", fontSize: 16, fontWeight: "800" }}>{editGoal ? "Güncelle" : "Kaydet"}</Text>
              )}
            </HapticPressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}