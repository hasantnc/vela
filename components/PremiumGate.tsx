import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { HapticPressable } from "@/components/HapticPressable";
import { usePremium } from "@/lib/context/premium";

interface PremiumGateProps {
  children: React.ReactNode;
  feature?: string;
}

export function PremiumGate({ children, feature = "Bu özellik" }: PremiumGateProps) {
  const { isPremium, loading } = usePremium();
  const router = useRouter();

  if (loading || isPremium) return <>{children}</>;

  return (
    <View style={{ flex: 1, backgroundColor: "#06060F", alignItems: "center", justifyContent: "center", padding: 32, gap: 20 }}>
      <Stack.Screen options={{ headerBackTitle: "Geri" }} />
      <View style={{
        width: 72, height: 72, borderRadius: 24,
        backgroundColor: "rgba(245,158,11,0.12)",
        borderWidth: 1.5, borderColor: "rgba(245,158,11,0.3)",
        alignItems: "center", justifyContent: "center",
      }}>
        <Ionicons name="diamond" size={32} color="#F59E0B" />
      </View>

      <View style={{ alignItems: "center", gap: 8 }}>
        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800", textAlign: "center" }}>
          Premium Özellik
        </Text>
        <Text style={{ color: "#555", fontSize: 14, textAlign: "center", lineHeight: 22 }}>
          {feature} yalnızca Premium üyelere açıktır.
        </Text>
      </View>

      <HapticPressable
        onPress={() => router.push("/premium")}
        style={({ pressed }) => ({
          backgroundColor: pressed ? "#D97706" : "#F59E0B",
          borderRadius: 16,
          paddingVertical: 14,
          paddingHorizontal: 32,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        })}
      >
        <Ionicons name="diamond" size={16} color="#000" />
        <Text style={{ color: "#000", fontSize: 15, fontWeight: "800" }}>Premium'a Geç</Text>
      </HapticPressable>

      <HapticPressable onPress={() => router.back()}>
        <Text style={{ color: "#444", fontSize: 13 }}>Geri Dön</Text>
      </HapticPressable>
    </View>
  );
}
