import { useCallback } from "react";
import { ScrollView, View, Text, ActivityIndicator } from "react-native";
import { Stack, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useAuth } from "@/lib/firebase/auth";
import { subscribeStreak, StreakData } from "@/lib/firebase/firestore";

const STREAK_WEEK = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

const STREAK_MILESTONES = [
  { days: 7,  emoji: "🥉", label: "Bronz", color: "#CD7F32" },
  { days: 14, emoji: "🥈", label: "Gümüş", color: "#C0C0C0" },
  { days: 30, emoji: "🥇", label: "Altın",  color: "#FFD700" },
  { days: 90, emoji: "💎", label: "Elmas",  color: "#06B6D4" },
];

const Card = ({ children, style = {} }: { children: React.ReactNode; style?: object }) => (
  <View style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", borderRadius: 22, padding: 18, borderCurve: "continuous", ...style }}>
    {children}
  </View>
);

export default function StreakScreen() {
  const { user } = useAuth();
  const [streak, setStreak] = useState<StreakData | null>(null);

  useFocusEffect(useCallback(() => {
    if (!user?.uid) return;
    const unsub = subscribeStreak(user.uid, setStreak);
    return unsub;
  }, [user?.uid]));

  const current = streak?.current ?? 0;
  const best    = streak?.best ?? 0;
  const done    = streak?.done ?? [false, false, false, false, false, false, false];

  const todayIdx = (new Date().getDay() + 6) % 7; // Pazartesi=0

  return (
    <>
      <Stack.Screen options={{ title: "Streak", headerBackTitle: "Geri" }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: "#06060F" }}
        contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 40 }}
      >
        {!streak ? (
          <ActivityIndicator color="#F59E0B" style={{ marginTop: 60 }} />
        ) : (
          <>
            {/* Hero */}
            <View style={{ alignItems: "center", paddingVertical: 16 }}>
              <View style={{ width: 110, height: 110, borderRadius: 36, backgroundColor: "rgba(245,158,11,0.15)", borderWidth: 2, borderColor: "rgba(245,158,11,0.35)", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Ionicons name="flame" size={52} color="#F59E0B" />
              </View>
              <Text style={{ color: "#fff", fontSize: 52, fontWeight: "900", letterSpacing: -2 }}>{current}</Text>
              <Text style={{ color: "#F59E0B", fontSize: 16, fontWeight: "700", marginTop: 4 }}>günlük seri</Text>
              <Text style={{ color: "#555", fontSize: 13, marginTop: 4 }}>En iyi: {best} gün · Bugün limite uymayı unutma!</Text>
            </View>

            {/* Weekly */}
            <Card>
              <Text style={{ color: "#888", fontSize: 11, fontWeight: "700", marginBottom: 14, letterSpacing: 1.5, textTransform: "uppercase" }}>Bu Hafta</Text>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                {STREAK_WEEK.map((d, i) => (
                  <View key={d} style={{ alignItems: "center", gap: 6 }}>
                    <View style={{
                      width: 38, height: 38, borderRadius: 12,
                      backgroundColor: done[i] ? "#F59E0B" : i === todayIdx ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.05)",
                      borderWidth: 2,
                      borderColor: i === todayIdx ? "rgba(245,158,11,0.4)" : "transparent",
                      alignItems: "center", justifyContent: "center",
                    }}>
                      <Text style={{ color: done[i] ? "#fff" : i === todayIdx ? "#F59E0B" : "#333", fontSize: 14, fontWeight: "700" }}>
                        {done[i] ? "✓" : i === todayIdx ? "?" : "·"}
                      </Text>
                    </View>
                    <Text style={{ color: done[i] ? "#F59E0B" : i === todayIdx ? "#888" : "#333", fontSize: 10, fontWeight: done[i] ? "700" : "400" }}>{d}</Text>
                  </View>
                ))}
              </View>
            </Card>

            {/* Milestones */}
            <Card>
              <Text style={{ color: "#888", fontSize: 11, fontWeight: "700", marginBottom: 16, letterSpacing: 1.5, textTransform: "uppercase" }}>Milestone'lar</Text>
              {STREAK_MILESTONES.map((m, i) => {
                const isDone = current >= m.days;
                return (
                  <View key={m.days} style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingBottom: 14, marginBottom: i < STREAK_MILESTONES.length - 1 ? 14 : 0, borderBottomWidth: i < STREAK_MILESTONES.length - 1 ? 1 : 0, borderBottomColor: "rgba(255,255,255,0.05)" }}>
                    <View style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0, backgroundColor: isDone ? `${m.color}22` : "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: isDone ? m.color : "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ fontSize: 22 }}>{m.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: isDone ? "#fff" : "#555", fontSize: 14, fontWeight: "700", marginBottom: 6 }}>{m.label} — {m.days} Gün</Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 4, height: 4, overflow: "hidden" }}>
                          <View style={{ height: "100%", width: `${Math.min((current / m.days) * 100, 100)}%`, backgroundColor: m.color, borderRadius: 4 }} />
                        </View>
                        <Text style={{ color: "#444", fontSize: 11, minWidth: 40 }}>{current}/{m.days}</Text>
                      </View>
                    </View>
                    {isDone && (
                      <View style={{ backgroundColor: `${m.color}22`, borderWidth: 1, borderColor: `${m.color}44`, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 }}>
                        <Text style={{ color: m.color, fontSize: 10, fontWeight: "700" }}>Kazanıldı</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </Card>

            {/* Stats */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {([
                { label: "Bu Ayki Seri", value: `${current} gün`, iconName: "flame" as const,    color: "#F59E0B" },
                { label: "En İyi Seri",  value: `${best} gün`,    iconName: "star" as const,     color: "#8B5CF6" },
              ] as const).map((s) => (
                <View key={s.label} style={{ width: "47.5%", backgroundColor: `${s.color}0D`, borderWidth: 1, borderColor: `${s.color}22`, borderRadius: 22, padding: 14, borderCurve: "continuous", alignItems: "center" }}>
                  <Ionicons name={s.iconName} size={22} color={s.color} />
                  <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800", marginTop: 6, marginBottom: 2 }}>{s.value}</Text>
                  <Text style={{ color: "#555", fontSize: 11, fontWeight: "600" }}>{s.label}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </>
  );
}