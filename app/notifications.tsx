import { useState, useEffect } from "react";
import { ScrollView, View, Text, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HapticPressable } from "@/components/HapticPressable";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/firebase/auth";
import {
  collection, query, orderBy, onSnapshot,
  doc, updateDoc, writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Stack } from "expo-router";

type Notification = {
  id: string;
  title: string;
  body: string;
  emoji: string;
  read: boolean;
  createdAt: any;
};

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notification)));
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const markRead = async (id: string) => {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid, "notifications", id), { read: true });
  };

  const markAllRead = async () => {
    if (!user) return;
    const batch = writeBatch(db);
    items.filter((i) => !i.read).forEach((i) => {
      batch.update(doc(db, "users", user.uid, "notifications", i.id), { read: true });
    });
    await batch.commit();
  };

  const unreadCount = items.filter((i) => !i.read).length;

  return (
    <>
      <Stack.Screen
        options={{
          title: "Bildirimler",
          headerBackTitle: "Geri",
          headerStyle: { backgroundColor: "#06060F" },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { fontWeight: "700" },
          headerRight: () =>
            unreadCount > 0 ? (
              <HapticPressable onPress={markAllRead} style={{ paddingRight: 4 }}>
                <Text style={{ color: "#8B5CF6", fontSize: 13, fontWeight: "600" }}>
                  Tümünü oku
                </Text>
              </HapticPressable>
              ) : undefined,
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: "#06060F" }}
        contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: 40 }}
      >
        {loading && (
          <View style={{ alignItems: "center", paddingTop: 40 }}>
            <ActivityIndicator color="#8B5CF6" />
          </View>
        )}

        {!loading && items.length === 0 && (
          <View style={{ alignItems: "center", paddingTop: 60, gap: 12 }}>
            <Ionicons name="notifications-outline" size={42} color="#333" />
            <Text style={{ color: "#555", fontSize: 14, marginTop: 8 }}>Henüz bildirim yok</Text>
          </View>
        )}

        {items.map((item) => (
          <HapticPressable
            key={item.id}
            onPress={() => markRead(item.id)}
            style={({ pressed }) => ({
              backgroundColor: pressed
                ? "rgba(255,255,255,0.07)"
                : item.read
                ? "rgba(255,255,255,0.03)"
                : "rgba(139,92,246,0.08)",
              borderWidth: 1,
              borderColor: item.read
                ? "rgba(255,255,255,0.07)"
                : "rgba(139,92,246,0.25)",
              borderRadius: 18,
              borderCurve: "continuous",
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            })}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: item.read
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(139,92,246,0.15)",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Text style={{ fontSize: 22 }}>{item.emoji}</Text>
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text
                style={{
                  color: item.read ? "#888" : "#fff",
                  fontSize: 14,
                  fontWeight: item.read ? "500" : "700",
                }}
              >
                {item.title}
              </Text>
              <Text style={{ color: "#555", fontSize: 12, lineHeight: 18 }}>
                {item.body}
              </Text>
            </View>
            {!item.read && (
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#8B5CF6",
                  flexShrink: 0,
                }}
              />
            )}
          </HapticPressable>
        ))}
      </ScrollView>
    </>
  );
}