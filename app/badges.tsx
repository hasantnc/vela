import { useState, useCallback } from "react";
import { ScrollView, View, Text, ActivityIndicator } from "react-native";
import { Stack, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { HapticPressable } from "@/components/HapticPressable";
import { useAuth } from "@/lib/firebase/auth";
import { subscribeBadges, BadgeData } from "@/lib/firebase/firestore";

const BADGE_LEVELS = [
  { level: 1, label: "Çaylak",    xp: 0,    maxXp: 100,  color: "#6B7280" },
  { level: 2, label: "Başlangıç", xp: 100,  maxXp: 300,  color: "#34D399" },
  { level: 3, label: "Orta",      xp: 300,  maxXp: 600,  color: "#3B82F6" },
  { level: 4, label: "İleri",     xp: 600,  maxXp: 1000, color: "#8B5CF6" },
  { level: 5, label: "Usta",      xp: 1000, maxXp: 2000, color: "#F59E0B" },
];

const ALL_BADGES = [
  { id: "streak7",   emoji: "🔥", title: "7 Günlük Seri",        desc: "7 gün üst üste limite uydun",          rarity: "common",    color: "#F59E0B" },
  { id: "streak30",  emoji: "⚡", title: "30 Günlük Disiplin",   desc: "30 gün boyunca limitini aşmadın",      rarity: "rare",      color: "#8B5CF6" },
  { id: "nosub",     emoji: "✂️", title: "Abonelik Katili",      desc: "2 kullanılmayan aboneliği iptal ettin", rarity: "common",    color: "#EF4444" },
  { id: "community", emoji: "👥", title: "Topluluk Yıldızı",     desc: "Topluluk ortalamasının altına indın",   rarity: "common",    color: "#3B82F6" },
  { id: "ai",        emoji: "🤖", title: "AI Dostu",             desc: "AI analizini 10 kez kullandın",         rarity: "common",    color: "#8B5CF6" },
  { id: "saver",     emoji: "🏆", title: "Tasarruf Ustası",      desc: "Bir ayda ₺5.000 tasarruf ettin",       rarity: "epic",      color: "#F59E0B" },
  { id: "master",    emoji: "💎", title: "Finansal Usta",        desc: "3 ay üst üste hedefini tuttur",         rarity: "legendary", color: "#06B6D4" },
  { id: "payday",    emoji: "📅", title: "Maaş Günü Planlayıcı", desc: "Maaş günü bütçeni 5 kez ayarladın",    rarity: "rare",      color: "#10B981" },
];

const BADGE_RARITY: Record<string, string> = {
  common: "Yaygın", rare: "Nadir", epic: "Epik", legendary: "Efsanevi",
};

const BADGE_XP_ACTIONS = [
  { action: "Günlük limite uy",  xp: "+10 XP" },
  { action: "SMS onayla",        xp: "+5 XP"  },
  { action: "Hedef tamamla",     xp: "+50 XP" },
  { action: "Rozet kazan",       xp: "+25 XP" },
  { action: "Abonelik iptal et", xp: "+15 XP" },
];

function getLevelForXP(xp: number) {
  let level = BADGE_LEVELS[0];
  for (const l of BADGE_LEVELS) {
    if (xp >= l.xp) level = l;
  }
  return level;
}

function getNextLevel(current: typeof BADGE_LEVELS[0]) {
  return BADGE_LEVELS.find(l => l.level === current.level + 1) ?? BADGE_LEVELS[BADGE_LEVELS.length - 1];
}

export default function BadgesScreen() {
  const { user } = useAuth();
  const [badgeData, setBadgeData] = useState<BadgeData | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    if (!user?.uid) return;
    const unsub = subscribeBadges(user.uid, setBadgeData);
    return unsub;
  }, [user?.uid]));

  if (!badgeData) {
    return (
      <>
        <Stack.Screen options={{ title: "Rozetler & Seviye", headerBackTitle: "Geri" }} />
        <ActivityIndicator color="#8B5CF6" style={{ marginTop: 60 }} />
      </>
    );
  }

  const { earnedIds, xp } = badgeData;
  const currentLevel = getLevelForXP(xp);
  const nextLevel    = getNextLevel(currentLevel);

  const earned = ALL_BADGES.filter(b => earnedIds.includes(b.id));
  const locked  = ALL_BADGES.filter(b => !earnedIds.includes(b.id));

  return (
    <>
      <Stack.Screen options={{ title: "Rozetler & Seviye", headerBackTitle: "Geri" }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: "#06060F" }}
        contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 40 }}
      >
        {/* Level Card */}
        <View style={{ backgroundColor: "#12122A", borderWidth: 1, borderColor: "rgba(139,92,246,0.25)", borderRadius: 24, padding: 22, borderCurve: "continuous" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 16 }}>
            <View style={{ width: 60, height: 60, borderRadius: 20, flexShrink: 0, backgroundColor: `${currentLevel.color}22`, borderWidth: 2, borderColor: `${currentLevel.color}44`, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: currentLevel.color, fontSize: 28, fontWeight: "900" }}>{currentLevel.level}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ backgroundColor: `${currentLevel.color}22`, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, alignSelf: "flex-start", marginBottom: 6 }}>
                <Text style={{ color: currentLevel.color, fontSize: 11, fontWeight: "700", textTransform: "uppercase" }}>{currentLevel.label}</Text>
              </View>
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800", marginBottom: 2 }}>Level {currentLevel.level}</Text>
              <Text style={{ color: "#555", fontSize: 12 }}>{xp} / {nextLevel.maxXp} XP</Text>
            </View>
          </View>
          <View style={{ backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 8, height: 8, overflow: "hidden" }}>
            <View style={{ height: "100%", width: `${Math.round(((xp - currentLevel.xp) / (nextLevel.maxXp - currentLevel.xp)) * 100)}%`, backgroundColor: currentLevel.color, borderRadius: 8 }} />
          </View>
          <Text style={{ color: "#555", fontSize: 12, marginTop: 8 }}>
            {nextLevel.maxXp - xp} XP daha →{" "}
            <Text style={{ color: nextLevel.color, fontWeight: "700" }}>Level {nextLevel.level} {nextLevel.label}</Text>
          </Text>
        </View>

        {/* XP Nasıl Kazanılır */}
        <View style={{ backgroundColor: "rgba(139,92,246,0.06)", borderWidth: 1, borderColor: "rgba(139,92,246,0.18)", borderRadius: 22, padding: 18, borderCurve: "continuous" }}>
          <Text style={{ color: "#8B5CF6", fontSize: 11, fontWeight: "700", marginBottom: 12, letterSpacing: 1, textTransform: "uppercase" }}>XP Nasıl Kazanılır?</Text>
          {BADGE_XP_ACTIONS.map((item) => (
            <View key={item.action} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ color: "#888", fontSize: 13 }}>• {item.action}</Text>
              <Text style={{ color: "#8B5CF6", fontSize: 13, fontWeight: "700" }}>{item.xp}</Text>
            </View>
          ))}
        </View>

        {/* Earned */}
        {earned.length > 0 && (
          <>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>Kazanılan Rozetler</Text>
          <Ionicons name="checkmark-circle" size={16} color="#34D399" />
        </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {earned.map((b) => (
                <HapticPressable
                  key={b.id}
                  onPress={() => setSelected(selected === b.id ? null : b.id)}
                  style={{ width: "47.5%", backgroundColor: `${b.color}0F`, borderWidth: 1, borderColor: `${b.color}33`, borderRadius: 22, padding: 14, borderCurve: "continuous" }}
                >
                  <Text style={{ fontSize: 30, marginBottom: 8 }}>{b.emoji}</Text>
                  <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700", marginBottom: 6, lineHeight: 18 }}>{b.title}</Text>
                  <View style={{ backgroundColor: `${b.color}22`, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, alignSelf: "flex-start" }}>
                    <Text style={{ color: b.color, fontSize: 10, fontWeight: "700" }}>{BADGE_RARITY[b.rarity]}</Text>
                  </View>
                  {selected === b.id && (
                    <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" }}>
                      <Text style={{ color: "#888", fontSize: 11, lineHeight: 18 }}>{b.desc}</Text>
                    </View>
                  )}
                </HapticPressable>
              ))}
            </View>
          </>
        )}

        {earned.length === 0 && (
          <View style={{ alignItems: "center", paddingVertical: 30 }}>
            <Ionicons name="trophy-outline" size={42} color="#333" />
            <Text style={{ color: "#555", fontSize: 14, marginTop: 12 }}>Henüz rozet kazanılmadı</Text>
          </View>
        )}

        {/* Locked */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ color: "#555", fontSize: 15, fontWeight: "700" }}>Kilitli Rozetler</Text>
          <Ionicons name="lock-closed-outline" size={15} color="#555" />
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {locked.map((b) => (
            <View key={b.id} style={{ width: "47.5%", backgroundColor: "rgba(255,255,255,0.02)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderRadius: 22, padding: 14, borderCurve: "continuous", opacity: 0.6 }}>
              <Text style={{ fontSize: 30, marginBottom: 8 }}>{b.emoji}</Text>
              <Text style={{ color: "#555", fontSize: 13, fontWeight: "700", marginBottom: 4, lineHeight: 18 }}>{b.title}</Text>
              <Text style={{ color: "#333", fontSize: 11, lineHeight: 16 }}>{b.desc}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </>
  );
}