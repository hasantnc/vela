import { useState, useEffect, useCallback } from "react";
import {
  ScrollView, View, Text, TextInput, ActivityIndicator,
} from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/firebase/auth";
import { getCategoryLimits, setCategoryLimits } from "@/lib/firebase/firestore";
import { useCurrency } from "@/lib/context/currency";
import { HapticPressable } from "@/components/HapticPressable";
import { useHaptics } from "@/lib/context/haptics";
import { PremiumGate } from "@/components/PremiumGate";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const CATEGORIES: { key: string; iconName: IoniconsName; color: string }[] = [
  { key: "Yemek",      iconName: "restaurant-outline",       color: "#FF6B6B" },
  { key: "Ulaşım",    iconName: "car-outline",               color: "#4ECDC4" },
  { key: "Eğlence",   iconName: "film-outline",              color: "#A78BFA" },
  { key: "Fatura",     iconName: "receipt-outline",          color: "#FCD34D" },
  { key: "Alışveriş", iconName: "bag-handle-outline",        color: "#FB923C" },
  { key: "Sağlık",    iconName: "medkit-outline",            color: "#34D399" },
  { key: "Diğer",     iconName: "ellipsis-horizontal-circle-outline", color: "#9CA3AF" },
];

export default function CategoryLimitsScreen() {
  const { user } = useAuth();
  const { symbol, rate, currency } = useCurrency();
  const { notification } = useHaptics();

  const [limits, setLimits]   = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    if (!user) return;
    getCategoryLimits(user.uid).then((saved) => {
      // Firestore'da TRY, gösterimde seçili para birimine çevir
      const display: Record<string, string> = {};
      Object.entries(saved).forEach(([k, v]) => {
        const displayVal = currency === "TRY" ? v : v / rate;
        display[k] = displayVal > 0 ? String(Math.round(displayVal)) : "";
      });
      setLimits(display);
      setLoading(false);
    });
  }, [user]);

  const handleChange = useCallback((key: string, value: string) => {
    setLimits((prev) => ({ ...prev, [key]: value.replace(/[^0-9]/g, "") }));
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Her zaman TRY olarak kaydet
      const tryLimits: Record<string, number> = {};
      Object.entries(limits).forEach(([k, v]) => {
        const num = parseFloat(v);
        if (!isNaN(num) && num > 0) {
          tryLimits[k] = currency === "TRY" ? num : num / rate;
        }
      });
      await setCategoryLimits(user.uid, tryLimits);
      notification();
    } finally {
      setSaving(false);
    }
  };

  return (
    <PremiumGate feature="Kategori bazlı limitler">
    <>
      <Stack.Screen options={{ title: "Kategori Limitleri" }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: "#06060F" }}
        contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: 50 }}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Açıklama */}
        <View style={{
          backgroundColor: "rgba(139,92,246,0.08)",
          borderWidth: 1,
          borderColor: "rgba(139,92,246,0.18)",
          borderRadius: 18,
          padding: 16,
          borderCurve: "continuous",
          marginBottom: 4,
        }}>
          <Text style={{ color: "#A78BFA", fontSize: 12, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
            Nasıl Çalışır?
          </Text>
          <Text style={{ color: "#888", fontSize: 13, lineHeight: 20 }}>
            Her kategori için aylık harcama limiti belirle. Analiz ekranında ilerlemeyi takip edebilirsin. Boş bırakılan kategoriler limitsiz sayılır.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color="#8B5CF6" style={{ paddingTop: 40 }} />
        ) : (
          CATEGORIES.map((cat) => (
            <View
              key={cat.key}
              style={{
                backgroundColor: "rgba(255,255,255,0.04)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
                borderRadius: 18,
                borderCurve: "continuous",
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
              }}
            >
              {/* İkon */}
              <View style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: `${cat.color}18`,
                borderWidth: 1,
                borderColor: `${cat.color}33`,
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <Ionicons name={cat.iconName} size={20} color={cat.color} />
              </View>

              {/* Label */}
              <Text style={{ color: "#ccc", fontSize: 14, fontWeight: "600", flex: 1 }}>
                {cat.key}
              </Text>

              {/* Input */}
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "rgba(255,255,255,0.06)",
                borderWidth: 1,
                borderColor: limits[cat.key] ? `${cat.color}55` : "rgba(255,255,255,0.1)",
                borderRadius: 12,
                paddingHorizontal: 12,
                minWidth: 110,
              }}>
                <Text style={{ color: "#555", fontSize: 14, fontWeight: "700", marginRight: 4 }}>
                  {symbol}
                </Text>
                <TextInput
                  value={limits[cat.key] ?? ""}
                  onChangeText={(v) => handleChange(cat.key, v)}
                  placeholder="Limitsiz"
                  placeholderTextColor="#333"
                  keyboardType="numeric"
                  style={{ color: "#fff", fontSize: 15, fontWeight: "700", paddingVertical: 10, flex: 1 }}
                />
                {limits[cat.key] ? (
                  <HapticPressable onPress={() => handleChange(cat.key, "")}>
                    <Ionicons name="close-circle" size={16} color="#555" />
                  </HapticPressable>
                ) : null}
              </View>
            </View>
          ))
        )}

        {/* Kaydet */}
        {!loading && (
          <HapticPressable
            onPress={handleSave}
            disabled={saving}
            style={({ pressed }) => ({
              backgroundColor: pressed ? "#5B21B6" : "#7C3AED",
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: "center",
              marginTop: 8,
            })}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>Kaydet</Text>
            }
          </HapticPressable>
        )}
      </ScrollView>
    </>
    </PremiumGate>
  );
}
