import { useState } from "react";
import { ScrollView, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HapticPressable } from "@/components/HapticPressable";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const FEATURES: { iconName: IoniconsName; title: string; desc: string; premium: boolean }[] = [
  { iconName: "hardware-chip-outline", title: "Sınırsız AI Analiz",    desc: "Günde 3 sorudan fazla kişisel tavsiye", premium: true  },
  { iconName: "bar-chart-outline",     title: "Gelişmiş Analizler",    desc: "Aylık ve yıllık trend grafikleri",       premium: true  },
  { iconName: "options-outline",       title: "Kategori Limitleri",    desc: "Her kategori için ayrı bütçe",           premium: true  },
  { iconName: "trending-up-outline",   title: "Döviz Koruması",        desc: "Dolar/Euro bazlı portföy analizi",       premium: true  },
  { iconName: "trophy-outline",        title: "Sınırsız Hedef",        desc: "3'ten fazla finansal hedef ekle",        premium: true  },
  { iconName: "share-outline",         title: "CSV Dışa Aktarma",      desc: "Verilerini Excel'e aktar",               premium: true  },
  { iconName: "notifications-outline", title: "Akıllı Bildirimler",    desc: "Limit ve tasarruf uyarıları",            premium: true  },
  { iconName: "wallet-outline",        title: "Gelir / Gider Takibi",  desc: "Sınırsız işlem ekle",                   premium: false },
  { iconName: "calendar-outline",      title: "Maaş Planlayıcı",      desc: "Maaş günü bütçe dağılımı",              premium: false },
  { iconName: "ribbon-outline",        title: "Rozetler & Seriler",    desc: "Başarılarını takip et",                  premium: false },
];

const PLANS = [
  { id: "monthly", label: "Aylık",  price: "₺149,99",  sub: "/ay",   badge: null,           accent: false },
  { id: "yearly",  label: "Yıllık", price: "₺799,99",  sub: "/yıl",  badge: "%33 tasarruf", accent: true  },
];

export default function PremiumScreen() {
  const [selectedPlan, setSelectedPlan] = useState("yearly");

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: "#06060F" }}
      contentContainerStyle={{ paddingBottom: 50 }}
    >
      {/* Hero */}
      <View style={{ alignItems: "center", paddingTop: 40, paddingHorizontal: 28, paddingBottom: 32 }}>
        <View pointerEvents="none" style={{ position: "absolute", top: 0, width: 260, height: 260, borderRadius: 130, backgroundColor: "#7C3AED", opacity: 0.08 }} />

        <View style={{
          width: 80, height: 80, borderRadius: 28, borderCurve: "continuous",
          backgroundColor: "rgba(139,92,246,0.12)",
          borderWidth: 1.5, borderColor: "rgba(139,92,246,0.3)",
          alignItems: "center", justifyContent: "center", marginBottom: 20,
        }}>
          <Ionicons name="sparkles" size={38} color="#A78BFA" />
        </View>

        <Text style={{ color: "#fff", fontSize: 28, fontWeight: "900", letterSpacing: -0.5, marginBottom: 8 }}>
          VELA Premium
        </Text>
        <Text style={{ color: "#555", fontSize: 15, textAlign: "center", lineHeight: 22, maxWidth: 260 }}>
          Finansal özgürlüğe giden yolda tüm araçlara sahip ol
        </Text>
      </View>

      {/* Plans */}
      <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 20, marginBottom: 16 }}>
        {PLANS.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          return (
            <HapticPressable
              key={plan.id}
              onPress={() => setSelectedPlan(plan.id)}
              style={{
                flex: 1,
                backgroundColor: isSelected
                  ? plan.accent ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.07)"
                  : "rgba(255,255,255,0.03)",
                borderWidth: 1.5,
                borderColor: isSelected
                  ? plan.accent ? "#7C3AED" : "rgba(255,255,255,0.25)"
                  : "rgba(255,255,255,0.07)",
                borderRadius: 20, borderCurve: "continuous",
                padding: 18, alignItems: "center", gap: 2,
              }}
            >
              {plan.badge && (
                <View style={{ backgroundColor: "#7C3AED", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 6 }}>
                  <Text style={{ color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 0.4 }}>{plan.badge}</Text>
                </View>
              )}
              <Text style={{ color: isSelected ? "#fff" : "#555", fontSize: 13, fontWeight: "600", marginBottom: 4 }}>{plan.label}</Text>
              <Text style={{ color: isSelected ? "#fff" : "#777", fontSize: 26, fontWeight: "900", letterSpacing: -1 }}>{plan.price}</Text>
              <Text style={{ color: "#444", fontSize: 12 }}>{plan.sub}</Text>
              {isSelected && (
                <View style={{ position: "absolute", top: 12, right: 12 }}>
                  <Ionicons name="checkmark-circle" size={18} color={plan.accent ? "#A78BFA" : "#aaa"} />
                </View>
              )}
            </HapticPressable>
          );
        })}
      </View>

      {/* CTA */}
      <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
        <HapticPressable
          style={({ pressed }) => ({
            backgroundColor: pressed ? "#5B21B6" : "#7C3AED",
            borderRadius: 18, borderCurve: "continuous",
            paddingVertical: 18, alignItems: "center",
          })}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>Hemen Başla</Text>
          <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 }}>7 gün ücretsiz · Dilediğinde iptal et</Text>
        </HapticPressable>
      </View>

      {/* Divider */}
      <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
        <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.06)" }} />
      </View>

      {/* Features */}
      <View style={{ paddingHorizontal: 20, gap: 6 }}>
        <Text style={{ color: "#444", fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>
          Özellikler
        </Text>

        {FEATURES.map((f) => (
          <View
            key={f.title}
            style={{
              flexDirection: "row", alignItems: "center", gap: 14,
              paddingVertical: 12, paddingHorizontal: 4,
              borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)",
            }}
          >
            <View style={{
              width: 36, height: 36, borderRadius: 11,
              backgroundColor: f.premium ? "rgba(139,92,246,0.12)" : "rgba(255,255,255,0.04)",
              alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Ionicons name={f.iconName} size={17} color={f.premium ? "#A78BFA" : "#444"} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: f.premium ? "#fff" : "#555", fontSize: 14, fontWeight: "600" }}>{f.title}</Text>
              <Text style={{ color: "#333", fontSize: 12, marginTop: 1 }}>{f.desc}</Text>
            </View>
            {f.premium
              ? <Ionicons name="sparkles" size={14} color="#7C3AED" />
              : <Ionicons name="checkmark" size={16} color="#34D399" />
            }
          </View>
        ))}
      </View>
    </ScrollView>
  );
}