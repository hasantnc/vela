import { useState } from "react";
import { View, Text, ScrollView, TextInput, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HapticPressable } from "@/components/HapticPressable";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/lib/firebase/auth";
import { setDailyLimit, updateUserDoc } from "@/lib/firebase/firestore";

const C = {
  bg: "#0C0C1A",
  purple: "#8B5CF6",
  green: "#10B981",
  amber: "#F59E0B",
  red: "#EF4444",
  teal: "#34D399",
  blue: "#3B82F6",
  white: "#FFFFFF",
  sub: "#555555",
};

const tap = () => Haptics.selectionAsync();

const success = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// ─── SHARED ───────────────────────────────────────────────────────────────────
function Orb({ top, bottom, left, right, color, size = 280, opacity = 0.1 }: any) {
  return (
    <View style={{ position: "absolute", top, bottom, left, right, width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity, pointerEvents: "none" }} />
  );
}

function GlassCard({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <View style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", borderRadius: 22, borderCurve: "continuous", padding: 18, ...style }}>
      {children}
    </View>
  );
}

function PrimaryBtn({ children, onPress, disabled, color = C.purple }: any) {
  return (
    <HapticPressable onPress={onPress} disabled={disabled} style={{ width: "100%", paddingVertical: 18, borderRadius: 18, borderCurve: "continuous", alignItems: "center", backgroundColor: disabled ? "rgba(255,255,255,0.05)" : color, boxShadow: disabled ? "none" : `0 8px 28px ${color}55` }}>
      <Text style={{ color: disabled ? "#333" : C.white, fontSize: 16, fontWeight: "800", letterSpacing: 0.3 }}>{children}</Text>
    </HapticPressable>
  );
}

// ─── STEP 0: SPLASH ──────────────────────────────────────────────────────────
function SplashScreen({ onNext }: { onNext: () => void }) {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ minHeight: 700, alignItems: "center", justifyContent: "center", padding: 40 }} style={{ flex: 1, backgroundColor: "#080814" }}>
      <Orb top={-80} left={-60} color={C.purple} size={400} opacity={0.15} />
      <Orb bottom={-60} right={-60} color={C.blue} size={300} opacity={0.08} />

      <View style={{ alignItems: "center", width: "100%" }}>
        <Image
          source={require("@/assets/icon.png")}
          style={{ width: 100, height: 100, borderRadius: 30, marginBottom: 24 }}
          resizeMode="cover"
        />
        <Text style={{ color: C.white, fontSize: 52, fontWeight: "900", letterSpacing: -2, marginBottom: 8 }}>VELA</Text>
        <Text style={{ color: C.purple, fontSize: 14, fontWeight: "600", letterSpacing: 4, textTransform: "uppercase", marginBottom: 16 }}>Finansal Pusulan</Text>
        <Text style={{ color: C.sub, fontSize: 15, lineHeight: 26, textAlign: "center", marginBottom: 60, maxWidth: 280 }}>
          Para yönetimini bir sonraki seviyeye taşı. AI destekli, akıllı, kişisel.
        </Text>

        <PrimaryBtn onPress={() => { onNext(); }}>Başlayalım</PrimaryBtn>
        <Text style={{ color: "#333", fontSize: 13, marginTop: 16 }}>Tamamen ücretsiz başla</Text>
      </View>
    </ScrollView>
  );
}

// ─── BACK BUTTON (shared overlay) ────────────────────────────────────────────
function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <HapticPressable
      onPress={onPress}
      style={{
        width: 36, height: 36, borderRadius: 12,
        backgroundColor: "rgba(255,255,255,0.07)",
        borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
        alignItems: "center", justifyContent: "center",
      }}
    >
      <Ionicons name="chevron-back" size={18} color="#888" />
    </HapticPressable>
  );
}

// ─── STEP 1: FEATURES ─────────────────────────────────────────────────────────
const FEATURES = [
  {
    iconName: "hardware-chip-outline", title: "AI Finansal Koçun", color: C.blue,
    desc: "Haftalık harcama analizi, duygusal pattern tespiti ve kişisel öneriler. Sana özel.",
  },
  {
    iconName: "lock-closed-outline", title: "Akıllı Limit Sistemi", color: C.red,
    desc: "Günlük limit koy, aşınca kilit devreye girsin. Psikolojik sürtünme ile gereksiz harcamaları engelle.",
  },
  {
    iconName: "trophy-outline", title: "Rozet & Seviye Sistemi", color: C.amber,
    desc: "Her finansal başarın bir rozet kazandırır. XP topla, seviye atla, finansal karakterini keşfet.",
  },
];

function FeaturesScreen({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [active, setActive] = useState(0);
  const feat = FEATURES[active];

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingBottom: 48 }} style={{ flex: 1, backgroundColor: C.bg }}>
      <Orb top={-60} right={-60} color={feat.color} size={280} opacity={0.1} />

      {/* Dots */}
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, paddingTop: 56, paddingBottom: 24 }}>
        {FEATURES.map((_, i) => (
          <HapticPressable key={i} onPress={() => { setActive(i); }}>
            <View style={{ width: i === active ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: i === active ? feat.color : "rgba(255,255,255,0.1)" }} />
          </HapticPressable>
        ))}
      </View>

      <View style={{ paddingHorizontal: 24 }}>
        <View style={{ width: 80, height: 80, borderRadius: 26, borderCurve: "continuous", backgroundColor: `${feat.color}18`, borderWidth: 2, borderColor: `${feat.color}33`, alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 24, boxShadow: `0 0 40px ${feat.color}33` }}>
          <Ionicons name={feat.iconName as any} size={38} color={feat.color} />
        </View>

        <Text style={{ color: C.white, fontSize: 26, fontWeight: "900", textAlign: "center", marginBottom: 10, letterSpacing: -0.5 }}>{feat.title}</Text>
        <Text style={{ color: "#666", fontSize: 15, lineHeight: 26, textAlign: "center", marginBottom: 28 }}>{feat.desc}</Text>

        <View style={{ flexDirection: "row", gap: 12 }}>
          <HapticPressable
            onPress={() => active > 0 ? setActive((a) => a - 1) : onBack()}
            style={{ flex: 1, paddingVertical: 16, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 16, borderCurve: "continuous", alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6 }}
          >
            <Ionicons name="chevron-back" size={15} color="#666" />
            <Text style={{ color: "#666", fontSize: 15, fontWeight: "700" }}>Geri</Text>
          </HapticPressable>
          <HapticPressable onPress={() => { active < FEATURES.length - 1 ? setActive((a) => a + 1) : onNext(); }} style={{ flex: 2, paddingVertical: 16, backgroundColor: feat.color, borderRadius: 16, borderCurve: "continuous", alignItems: "center", boxShadow: `0 8px 28px ${feat.color}44` }}>
            <Text style={{ color: C.white, fontSize: 15, fontWeight: "800" }}>
              {active < FEATURES.length - 1 ? "Devam" : "Harika, Devam Et"}
            </Text>
          </HapticPressable>
        </View>

        <HapticPressable onPress={() => { onNext(); }} style={{ marginTop: 12, alignItems: "center", paddingVertical: 10 }}>
          <Text style={{ color: "#444", fontSize: 13 }}>Atla</Text>
        </HapticPressable>
      </View>
    </ScrollView>
  );
}

// ─── STEP 2: QUIZ ─────────────────────────────────────────────────────────────
const QUIZ = [
  {
    q: "Maaş geldiğinde ilk ne yaparsın?",
    opts: [
      { label: "Hemen harcamak için plan yaparım", type: "impulsive" },
      { label: "Önce faturaları öderim", type: "planner" },
      { label: "Arkadaşlarla kutlamaya çıkarım", type: "social" },
      { label: "Birikime ayırırım", type: "saver" },
    ],
  },
  {
    q: "En çok hangi harcamadan pişmanlık duyarsın?",
    opts: [
      { label: "Küçük günlük harcamalar (kahve vs)", type: "impulsive" },
      { label: "Abonelikler — kullanmıyorum bile", type: "planner" },
      { label: "Dışarıda yemek & eğlence", type: "social" },
      { label: "Hiçbirinden — tasarruf ederim", type: "saver" },
    ],
  },
  {
    q: "Harcama limitin aşıldığında ne hissedersin?",
    opts: [
      { label: '"Olur, yarın telafi ederim"', type: "impulsive" },
      { label: "Çok rahatsız olurum, plan bozuldu", type: "planner" },
      { label: "Arkadaşlarla birlikteyken oldu", type: "social" },
      { label: "Bu olmaz, limit aşmam", type: "saver" },
    ],
  },
];

const RESULTS: Record<string, { iconName: string; title: string; color: string; desc: string }> = {
  impulsive: { iconName: "flash-outline",       title: "Anlık Keyifçi",        color: C.amber,  desc: "Küçük harcamalar birikerek büyük para oluyor. VELA sana bu kalıbı kırmayı öğretecek." },
  planner:   { iconName: "analytics-outline",   title: "Stratejik Planlayıcı", color: C.purple, desc: "Büyük giderleri yönetiyorsun ama abonelikler seni yiyor. VELA bu kör noktaları gösterecek." },
  social:    { iconName: "people-outline",       title: "Sosyal Harcayıcı",     color: C.blue,   desc: "Sosyal hayat bütçeni zorluyor. VELA sana sosyal olmadan tasarruf etmeyi gösterecek." },
  saver:     { iconName: "wallet-outline",       title: "Doğal Tasarrufçu",     color: C.green,  desc: "Harika bir başlangıç noktası! VELA sana paranı daha akıllı büyütmeyi öğretecek." },
};

function QuizScreen({ onNext, onBack, onCharacterType }: { onNext: () => void; onBack: () => void; onCharacterType: (t: string) => void }) {
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<typeof RESULTS[string] | null>(null);

  const answer = (type: string) => {
    tap();
    const next = [...answers, type];
    setAnswers(next);
    if (qIndex < QUIZ.length - 1) {
      setQIndex((i) => i + 1);
    } else {
      const counts = next.reduce((acc: any, t) => ({ ...acc, [t]: (acc[t] || 0) + 1 }), {});
      const winner = Object.entries(counts).sort((a: any, b: any) => b[1] - a[1])[0][0];
      success();
      onCharacterType(winner);
      setResult(RESULTS[winner]);
    }
  };

  if (result) {
    return (
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }} style={{ flex: 1, backgroundColor: C.bg }}>
        <Orb top={-60} left={-60} color={result.color} size={300} opacity={0.12} />
        <View style={{ alignItems: "center", width: "100%" }}>
          <View style={{ width: 100, height: 100, borderRadius: 32, borderCurve: "continuous", backgroundColor: `${result.color}18`, borderWidth: 2, borderColor: `${result.color}44`, alignItems: "center", justifyContent: "center", marginBottom: 24, boxShadow: `0 0 50px ${result.color}33` }}>
            <Ionicons name={result.iconName as any} size={46} color={result.color} />
          </View>
          <Text style={{ color: result.color, fontSize: 12, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Finansal Karakterin</Text>
          <Text style={{ color: C.white, fontSize: 30, fontWeight: "900", marginBottom: 16, letterSpacing: -0.5 }}>{result.title}</Text>
          <GlassCard style={{ marginBottom: 28, backgroundColor: `${result.color}0A`, borderColor: `${result.color}25`, width: "100%" }}>
            <Text selectable style={{ color: "#bbb", fontSize: 15, lineHeight: 26 }}>{result.desc}</Text>
          </GlassCard>
          <PrimaryBtn onPress={() => { onNext(); }} color={result.color}>Devam Et</PrimaryBtn>
        </View>
      </ScrollView>
    );
  }

  const q = QUIZ[qIndex];
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingTop: 56, paddingHorizontal: 24, paddingBottom: 40 }} style={{ flex: 1, backgroundColor: C.bg }}>
      <Orb top={-60} right={-60} color={C.purple} size={280} opacity={0.08} />

      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <BackButton onPress={() => qIndex > 0 ? setQIndex((i) => i - 1) : onBack()} />
        <View style={{ flex: 1, flexDirection: "row", gap: 6 }}>
          {QUIZ.map((_, i) => (
            <View key={i} style={{ flex: 1, height: 4, borderRadius: 4, backgroundColor: i <= qIndex ? C.purple : "rgba(255,255,255,0.08)" }} />
          ))}
        </View>
      </View>

      <Text style={{ color: C.purple, fontSize: 12, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>
        Soru {qIndex + 1} / {QUIZ.length}
      </Text>
      <Text style={{ color: C.white, fontSize: 22, fontWeight: "800", marginBottom: 32, lineHeight: 30 }}>{q.q}</Text>

      <View style={{ gap: 12 }}>
        {q.opts.map((opt, i) => (
          <HapticPressable key={i} onPress={() => answer(opt.type)} style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 18, borderRadius: 18, borderCurve: "continuous", backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" }}>
            <View style={{ width: 32, height: 32, borderRadius: 10, borderCurve: "continuous", backgroundColor: "rgba(139,92,246,0.1)", borderWidth: 1, borderColor: "rgba(139,92,246,0.2)", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: C.purple, fontSize: 13, fontWeight: "800" }}>{String.fromCharCode(65 + i)}</Text>
            </View>
            <Text style={{ color: "#ccc", fontSize: 15, flex: 1, lineHeight: 22, fontWeight: "500" }}>{opt.label}</Text>
          </HapticPressable>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── STEP 3: SETUP ────────────────────────────────────────────────────────────
type SetupData = { limit: string; payday: string };

function SetupScreen({ onNext, onBack }: { onNext: (data: SetupData) => void; onBack: () => void }) {
  const [limit, setLimit] = useState("1200");
  const [payday, setPayday] = useState("15");

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingTop: 56, paddingHorizontal: 24, paddingBottom: 48 }} style={{ flex: 1, backgroundColor: C.bg }}>
      <Orb top={-60} right={-60} color={C.green} size={280} opacity={0.08} />

      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <BackButton onPress={onBack} />
        <Text style={{ color: C.green, fontSize: 12, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase" }}>Son Adım</Text>
      </View>
      <Text style={{ color: C.white, fontSize: 26, fontWeight: "900", marginBottom: 6 }}>Kurulumu Tamamla</Text>
      <Text style={{ color: C.sub, fontSize: 14, marginBottom: 32 }}>Sana özel deneyim için birkaç bilgi</Text>

      {/* Daily Limit */}
      <GlassCard style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 }}>
          <Ionicons name="lock-closed-outline" size={13} color="#888" />
          <Text style={{ color: "#888", fontSize: 11, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase" }}>Günlük Harcama Limiti</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Text style={{ color: C.sub, fontSize: 22, fontWeight: "900" }}>₺</Text>
          <TextInput value={limit} onChangeText={(v) => setLimit(v.replace(/\D/g, ""))} keyboardType="numeric" style={{ flex: 1, color: C.white, fontSize: 32, fontWeight: "900", letterSpacing: -1 }} />
        </View>
        <Text style={{ color: C.sub, fontSize: 12, marginBottom: 12 }}>Aşınca seni uyarır, kilit devreye girer</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {["500", "1000", "1500", "2000"].map((v) => (
            <HapticPressable key={v} onPress={() => { setLimit(v); }} style={{ flex: 1, paddingVertical: 8, backgroundColor: limit === v ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: limit === v ? C.purple : "rgba(255,255,255,0.08)", borderRadius: 10, borderCurve: "continuous", alignItems: "center" }}>
              <Text style={{ color: limit === v ? C.purple : C.sub, fontSize: 13, fontWeight: "700" }}>₺{v}</Text>
            </HapticPressable>
          ))}
        </View>
      </GlassCard>

      {/* Payday */}
      <GlassCard style={{ marginBottom: 32 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 }}>
          <Ionicons name="calendar-outline" size={13} color="#888" />
          <Text style={{ color: "#888", fontSize: 11, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase" }}>Maaş Günün</Text>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {["1", "5", "10", "15", "20", "25", "30"].map((d) => (
            <HapticPressable key={d} onPress={() => { setPayday(d); }} style={{ paddingHorizontal: 14, paddingVertical: 8, backgroundColor: payday === d ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: payday === d ? C.teal : "rgba(255,255,255,0.08)", borderRadius: 10, borderCurve: "continuous" }}>
              <Text style={{ color: payday === d ? C.teal : C.sub, fontSize: 13, fontWeight: "700" }}>Her ayın {d}'i</Text>
            </HapticPressable>
          ))}
        </View>
      </GlassCard>

      <PrimaryBtn onPress={() => { success(); onNext({ limit, payday }); }}>
        VELA'ya Başla
      </PrimaryBtn>
    </ScrollView>
  );
}

// ─── STEP 4: PREMIUM ──────────────────────────────────────────────────────────
function PremiumScreen({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [selected, setSelected] = useState("yearly");

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingTop: 56, paddingHorizontal: 24, paddingBottom: 48 }} style={{ flex: 1, backgroundColor: C.bg }}>
      <Orb top={-60} right={-60} color={C.amber} size={280} opacity={0.1} />

      <View style={{ alignItems: "flex-start", marginBottom: 20 }}>
        <BackButton onPress={onBack} />
      </View>

      <View style={{ alignItems: "center", marginBottom: 28 }}>
        <View style={{ width: 70, height: 70, borderRadius: 24, borderCurve: "continuous", backgroundColor: "rgba(245,158,11,0.15)", borderWidth: 2, borderColor: "rgba(245,158,11,0.3)", alignItems: "center", justifyContent: "center", marginBottom: 16, boxShadow: "0 0 40px rgba(245,158,11,0.2)" }}>
          <Ionicons name="diamond" size={34} color={C.amber} />
        </View>
        <Text style={{ color: C.white, fontSize: 26, fontWeight: "900", marginBottom: 6 }}>VELA Premium</Text>
        <Text style={{ color: "#888", fontSize: 14 }}>İstediğin zaman iptal et, taahhüt yok</Text>
      </View>

      <GlassCard style={{ marginBottom: 20, backgroundColor: "rgba(245,158,11,0.06)", borderColor: "rgba(245,158,11,0.18)" }}>
        {[
          { icon: "hardware-chip-outline",  label: "AI haftalık rapor & analiz" },
          { icon: "happy-outline",          label: "Pişmanlık skoru sistemi" },
          { icon: "swap-horizontal-outline",label: "Döviz koruma modu" },
          { icon: "cash-outline",           label: "Maaş günü akıllı bütçe" },
          { icon: "people-outline",         label: "Topluluk karşılaştırması" },
          { icon: "bar-chart-outline",      label: "Sınırsız harcama geçmişi" },
          { icon: "lock-closed-outline",    label: "Sert kilit modu" },
        ].map((f, i, arr) => (
          <View key={f.label} style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: i < arr.length - 1 ? 10 : 0 }}>
            <Ionicons name={f.icon as any} size={16} color={C.amber} />
            <Text style={{ color: "#ccc", fontSize: 14 }}>{f.label}</Text>
          </View>
        ))}
      </GlassCard>

      <View style={{ gap: 10, marginBottom: 24 }}>
        {[
          { id: "yearly", label: "Yıllık", price: "₺1.199,99", sub: "yıl · aylık ₺99 gibi", badge: "En Popüler", color: C.purple },
          { id: "monthly", label: "Aylık", price: "₺149,99", sub: "ay", badge: null, color: C.sub },
        ].map((plan) => (
          <HapticPressable key={plan.id} onPress={() => { setSelected(plan.id); }} style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 18, borderCurve: "continuous", backgroundColor: selected === plan.id ? `${plan.color}12` : "rgba(255,255,255,0.04)", borderWidth: 2, borderColor: selected === plan.id ? plan.color : "rgba(255,255,255,0.08)" }}>
            <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: selected === plan.id ? plan.color : "#444", alignItems: "center", justifyContent: "center" }}>
              {selected === plan.id && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: plan.color }} />}
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={{ color: C.white, fontSize: 15, fontWeight: "700" }}>{plan.label}</Text>
                {plan.badge && <View style={{ backgroundColor: "rgba(139,92,246,0.2)", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: "rgba(139,92,246,0.3)" }}><Text style={{ color: C.purple, fontSize: 10, fontWeight: "700" }}>{plan.badge}</Text></View>}
              </View>
              <Text style={{ color: C.sub, fontSize: 12 }}>{plan.sub}</Text>
            </View>
            <Text style={{ color: C.white, fontSize: 20, fontWeight: "900" }}>{plan.price}</Text>
          </HapticPressable>
        ))}
      </View>

      <HapticPressable onPress={() => { success(); onNext(); }} style={{ paddingVertical: 18, borderRadius: 18, borderCurve: "continuous", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, backgroundColor: C.amber, boxShadow: "0 8px 28px rgba(245,158,11,0.4)", marginBottom: 12 }}>
        <Ionicons name="diamond" size={18} color="#000" />
        <Text style={{ color: "#000", fontSize: 16, fontWeight: "900" }}>Premium'a Geç</Text>
      </HapticPressable>
      <HapticPressable onPress={() => { onNext(); }} style={{ alignItems: "center", paddingVertical: 12 }}>
        <Text style={{ color: "#444", fontSize: 13 }}>Ücretsiz devam et</Text>
      </HapticPressable>
    </ScrollView>
  );
}

// ─── STEP 5: READY ────────────────────────────────────────────────────────────
function ReadyScreen({ onFinish, setup, characterType }: {
  onFinish: () => void;
  setup: SetupData;
  characterType: string;
}) {
  const summaryItems = [
    `Günlük limit: ₺${Number(setup.limit).toLocaleString("tr-TR")}`,
    `Her ayın ${setup.payday}'inde maaş günü`,
    `Karakter: ${characterType || "Belirlendi"}`,
  ];

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 40 }} style={{ flex: 1, backgroundColor: "#080814" }}>
      <Orb top={-60} left={-60} color={C.teal} size={400} opacity={0.12} />

      <View style={{ alignItems: "center", width: "100%" }}>
        <View style={{ width: 100, height: 100, borderRadius: 32, borderCurve: "continuous", backgroundColor: C.green, alignItems: "center", justifyContent: "center", marginBottom: 28, boxShadow: "0 0 60px rgba(52,211,153,0.4)" }}>
          <Ionicons name="checkmark-circle" size={52} color="#fff" />
        </View>
        <Text style={{ color: C.white, fontSize: 32, fontWeight: "900", letterSpacing: -1, marginBottom: 10 }}>Hazırsın!</Text>
        <Text style={{ color: C.sub, fontSize: 15, lineHeight: 26, textAlign: "center", marginBottom: 40, maxWidth: 280 }}>
          VELA artık senin finansal pusulan. İlk harcamanı eklemeye hazır mısın?
        </Text>

        <View style={{ width: "100%", gap: 12, marginBottom: 40 }}>
          {summaryItems.map((item) => (
            <View key={item} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, backgroundColor: "rgba(52,211,153,0.08)", borderWidth: 1, borderColor: "rgba(52,211,153,0.2)", borderRadius: 16, borderCurve: "continuous" }}>
              <Ionicons name="checkmark-circle" size={20} color={C.teal} />
              <Text style={{ color: C.teal, fontSize: 14, fontWeight: "600" }}>{item}</Text>
            </View>
          ))}
        </View>

        <PrimaryBtn onPress={onFinish} color={C.green}>
          Hadi Başlayalım
        </PrimaryBtn>
      </View>
    </ScrollView>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
const STEPS = 5;

export default function OnboardingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [characterType, setCharacterType] = useState("impulsive");
  const [setupData, setSetupData] = useState<SetupData>({ limit: "1200", payday: "15" });

  const next = () => setStep((s) => Math.min(s + 1, STEPS));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleSetupDone = (data: SetupData) => {
    setSetupData(data);
    next();
  };

  const finish = async () => {
    if (user) {
      try {
        await Promise.all([
          setDailyLimit(user.uid, Number(setupData.limit) || 1200),
          updateUserDoc(user.uid, {
            characterType: characterType as any,
            payday: { paydayDay: Number(setupData.payday) || 15 },
          } as any),
        ]);
      } catch {}
    }
    await AsyncStorage.setItem("onboarding_done", "true");
    router.replace("/(tabs)/(home)");
  };

  const screens = [
    <SplashScreen onNext={next} />,
    <FeaturesScreen onNext={next} onBack={back} />,
    <QuizScreen onNext={next} onBack={back} onCharacterType={setCharacterType} />,
    <SetupScreen onNext={handleSetupDone} onBack={back} />,
    <PremiumScreen onNext={next} onBack={back} />,
    <ReadyScreen onFinish={finish} setup={setupData} characterType={characterType} />,
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {step > 0 && step < STEPS && (
        <View style={{ position: "absolute", top: 20, left: 24, right: 24, flexDirection: "row", gap: 4, zIndex: 100 }}>
          {Array.from({ length: STEPS }).map((_, i) => (
            <View key={i} style={{ flex: 1, height: 2, borderRadius: 2, backgroundColor: i < step ? C.purple : "rgba(255,255,255,0.08)" }} />
          ))}
        </View>
      )}
      {screens[step]}
    </View>
  );
}