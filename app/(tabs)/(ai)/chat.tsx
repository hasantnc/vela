import { useState, useRef, useEffect } from "react";
import {
  ScrollView, View, Text, TextInput, KeyboardAvoidingView, Pressable,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/firebase/auth";
import { useHaptics } from "@/lib/context/haptics";
import { usePremium } from "@/lib/context/premium";
import { HapticPressable } from "@/components/HapticPressable";
import { subscribeTransactions, subscribeStreak, getDailyLimit } from "@/lib/firebase/firestore";
import { Transaction } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AI_DAILY_COUNT_KEY = "@vela:ai_daily_count";
const AI_DAILY_DATE_KEY  = "@vela:ai_daily_date";
const FREE_AI_LIMIT = 3;

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

const QUICK_PROMPTS: { iconName: IoniconsName; label: string; color: string }[] = [
  { iconName: "bar-chart-outline",     label: "Harcama analizi yap",        color: "#8B5CF6" },
  { iconName: "bulb-outline",          label: "Tasarruf önerileri ver",      color: "#F59E0B" },
  { iconName: "trophy-outline",        label: "Hedefe ulaşma planı",         color: "#34D399" },
  { iconName: "warning-outline",       label: "Risk kategorileri göster",    color: "#EF4444" },
  { iconName: "person-outline",        label: "Finansal karakter analizim",  color: "#3B82F6" },
];

export default function AIScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { impact } = useHaptics();
  const { isPremium } = usePremium();
  const [aiUsedToday, setAiUsedToday] = useState(0);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "assistant",
      content: "Merhaba! 👋 Ben VELA'nın AI asistanıyım. Harcamalarını analiz edip sana özel tavsiyeler verebilirim. Ne öğrenmek istersin?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [streakCurrent, setStreakCurrent] = useState(0);
  const [dailyLimit, setDailyLimitState] = useState(1200);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeTransactions(user.uid, (txs) => setTransactions(txs));
    const unsubStreak = subscribeStreak(user.uid, (s) => setStreakCurrent(s.current));
    getDailyLimit(user.uid).then(setDailyLimitState);
    return () => { unsub(); unsubStreak(); };
  }, [user]);

  useEffect(() => {
    (async () => {
      const today = new Date().toDateString();
      const savedDate = await AsyncStorage.getItem(AI_DAILY_DATE_KEY);
      if (savedDate !== today) {
        await AsyncStorage.setItem(AI_DAILY_DATE_KEY, today);
        await AsyncStorage.setItem(AI_DAILY_COUNT_KEY, "0");
        setAiUsedToday(0);
      } else {
        const count = parseInt(await AsyncStorage.getItem(AI_DAILY_COUNT_KEY) ?? "0");
        setAiUsedToday(count);
      }
    })();
  }, []);

  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);

  const buildContext = () => {
    const recent = transactions.slice(0, 20);
    const byCategory: Record<string, number> = {};
    recent.forEach((t) => {
      if (t.type === "expense") byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
    });
    const catSummary = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => `${cat}: ₺${amt.toFixed(0)}`).join(", ");
    const txList = recent.slice(0, 10).map((t) => `${t.emoji ?? ""} ${t.description ?? t.category} ${t.type === "expense" ? "-" : "+"}₺${t.amount}`).join("\n");
    return `Kullanıcı finans verileri:\n- Toplam gelir: ₺${totalIncome.toFixed(0)}\n- Toplam gider: ₺${totalExpense.toFixed(0)}\n- Günlük limit: ₺${dailyLimit}\n- Streak: ${streakCurrent} gün\n- Kategori dağılımı: ${catSummary || "veri yok"}\n- Son işlemler:\n${txList || "işlem yok"}`;
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    if (!isPremium && aiUsedToday >= FREE_AI_LIMIT) return;
    impact();

    if (!isPremium) {
      const newCount = aiUsedToday + 1;
      setAiUsedToday(newCount);
      await AsyncStorage.setItem(AI_DAILY_COUNT_KEY, String(newCount));
    }

    const userMsg: Message = { id: Date.now(), role: "user", content: trimmed };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const context = buildContext();
      const historyMessages = updatedMessages.slice(1).map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_OPENAI_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          max_tokens: 1000,
          messages: [
            {
              role: "system",
              content: `Sen VELA adlı bir kişisel finans uygulamasının Türkçe AI asistanısın. Kullanıcının gerçek harcama verilerine erişimin var. Kısa, samimi ve pratik cevaplar ver. Emoji kullan ama abartma. Türk lirası (₺) ile çalış. Maksimum 3-4 paragraf yaz.\n\n${context}`,
            },
            ...historyMessages,
          ],
        }),
      });

      const data = await response.json();
      const reply = data?.choices?.[0]?.message?.content ?? "Üzgünüm, bir hata oluştu. Tekrar dener misin?";
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: "assistant", content: "Bağlantı hatası oluştu. İnternet bağlantını kontrol et. 🔌" }]);
    }

    setLoading(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <>
      <Stack.Screen options={{
        title: "VELA AI",
        headerLargeTitle: false,
        headerLeft: () => (
          <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(139,92,246,0.2)", borderWidth: 1, borderColor: "rgba(139,92,246,0.3)", alignItems: "center", justifyContent: "center", marginLeft: 4 }}>
            <Ionicons name="diamond" size={16} color="#A78BFA" />
          </View>
        ),
      }} />
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "#06060F" }}
        behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={process.env.EXPO_OS === "ios" ? 88 : 0}
      >
        <ScrollView
          ref={scrollRef}
          contentInsetAdjustmentBehavior="automatic"
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 20 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Context Card */}
          <View style={{ backgroundColor: "rgba(139,92,246,0.08)", borderWidth: 1, borderColor: "rgba(139,92,246,0.2)", borderRadius: 22, padding: 16, borderCurve: "continuous", marginBottom: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Ionicons name="wifi-outline" size={12} color="#8B5CF6" />
              <Text style={{ color: "#8B5CF6", fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" }}>Veri Bağlantısı Aktif</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 16 }}>
              <View>
                <Text style={{ color: "#555", fontSize: 11 }}>Toplam gelir</Text>
                <Text selectable style={{ color: "#34D399", fontSize: 14, fontWeight: "700" }}>₺{totalIncome.toFixed(0)}</Text>
              </View>
              <View>
                <Text style={{ color: "#555", fontSize: 11 }}>Bu ay gider</Text>
                <Text selectable style={{ color: "#F87171", fontSize: 14, fontWeight: "700" }}>₺{totalExpense.toFixed(0)}</Text>
              </View>
              <View>
                <Text style={{ color: "#555", fontSize: 11 }}>Streak</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Ionicons name="flame" size={13} color="#F59E0B" />
                  <Text style={{ color: "#F59E0B", fontSize: 14, fontWeight: "700" }}>{streakCurrent} gün</Text>
                </View>
              </View>
              <View>
                <Text style={{ color: "#555", fontSize: 11 }}>İşlem</Text>
                <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>{transactions.length}</Text>
              </View>
            </View>
          </View>

          {/* Messages */}
          {messages.map((msg) => (
            <View key={msg.id} style={{ alignItems: msg.role === "user" ? "flex-end" : "flex-start", gap: 4 }}>
              {msg.role === "assistant" && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <View style={{ width: 20, height: 20, borderRadius: 6, backgroundColor: "rgba(139,92,246,0.25)", alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name="sparkles" size={11} color="#A78BFA" />
                  </View>
                  <Text style={{ color: "#3D3D55", fontSize: 11, fontWeight: "600", letterSpacing: 0.3 }}>VELA AI</Text>
                </View>
              )}
              <View style={{ maxWidth: "82%", backgroundColor: msg.role === "user" ? "#6D28D9" : "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: msg.role === "user" ? "rgba(139,92,246,0.6)" : "rgba(255,255,255,0.08)", borderRadius: 20, borderBottomRightRadius: msg.role === "user" ? 4 : 20, borderBottomLeftRadius: msg.role === "user" ? 20 : 4, paddingHorizontal: 14, paddingVertical: 11 }}>
                <Text selectable style={{ color: "#fff", fontSize: 14, lineHeight: 22, letterSpacing: 0.1 }}>{msg.content}</Text>
              </View>
              {msg.role === "user" && <Text style={{ color: "#2D2D45", fontSize: 10 }}>Sen</Text>}
            </View>
          ))}

          {/* Loading */}
          {loading && (
            <View style={{ alignItems: "flex-start", gap: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View style={{ width: 20, height: 20, borderRadius: 6, backgroundColor: "rgba(139,92,246,0.25)", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="sparkles" size={11} color="#A78BFA" />
                </View>
                <Text style={{ color: "#3D3D55", fontSize: 11, fontWeight: "600" }}>VELA AI</Text>
              </View>
              <View style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderRadius: 20, borderBottomLeftRadius: 4, paddingHorizontal: 16, paddingVertical: 14, flexDirection: "row", gap: 5, alignItems: "center" }}>
                {[0, 1, 2].map((i) => <View key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#6D28D9", opacity: 0.7 + i * 0.1 }} />)}
              </View>
            </View>
          )}

          {/* Quick Prompts */}
          {messages.length === 1 && (
            <View style={{ gap: 8, marginTop: 8 }}>
              <Text style={{ color: "#555", fontSize: 12, fontWeight: "600", marginBottom: 4 }}>Hızlı sorular:</Text>
              {QUICK_PROMPTS.map((p) => (
                <HapticPressable key={p.label} onPress={() => send(p.label)} style={({ pressed }) => ({ backgroundColor: pressed ? `${p.color}14` : "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: pressed ? `${p.color}33` : "rgba(255,255,255,0.09)", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 12 })}>
                  <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: `${p.color}18`, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Ionicons name={p.iconName} size={16} color={p.color} />
                  </View>
                  <Text style={{ color: "#bbb", fontSize: 14, fontWeight: "600", flex: 1 }}>{p.label}</Text>
                  <Ionicons name="chevron-forward" size={14} color="#333" />
                </HapticPressable>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={{ padding: 16, paddingBottom: 24, backgroundColor: "#06060F", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" }}>
          {!isPremium && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: aiUsedToday >= FREE_AI_LIMIT ? "rgba(239,68,68,0.1)" : "rgba(139,92,246,0.08)", borderWidth: 1, borderColor: aiUsedToday >= FREE_AI_LIMIT ? "rgba(239,68,68,0.25)" : "rgba(139,92,246,0.2)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10 }}>
              <Ionicons name="diamond-outline" size={13} color={aiUsedToday >= FREE_AI_LIMIT ? "#EF4444" : "#A78BFA"} />
              <Text style={{ flex: 1, color: aiUsedToday >= FREE_AI_LIMIT ? "#F87171" : "#A78BFA", fontSize: 12, fontWeight: "600" }}>
                {aiUsedToday >= FREE_AI_LIMIT ? "Günlük 3 soru hakkını kullandın — Premium'a geç" : `Bugün ${FREE_AI_LIMIT - aiUsedToday} soru hakkın kaldı`}
              </Text>
              {aiUsedToday >= FREE_AI_LIMIT && (
                <HapticPressable onPress={() => router.push("/premium")}>
                  <Text style={{ color: "#F59E0B", fontSize: 12, fontWeight: "700" }}>Geç</Text>
                </HapticPressable>
              )}
            </View>
          )}
          <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-end" }}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Bir şey sor..."
              placeholderTextColor="#444"
              multiline
              style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12, color: "#fff", fontSize: 14, maxHeight: 100 }}
              returnKeyType="send"
              onSubmitEditing={() => send(input)}
            />
            <HapticPressable onPress={() => send(input)} disabled={!input.trim() || loading} style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: input.trim() && !loading ? "#8B5CF6" : "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name={loading ? "ellipsis-horizontal" : "arrow-up"} size={20} color={input.trim() && !loading ? "#fff" : "#333"} />
            </HapticPressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}