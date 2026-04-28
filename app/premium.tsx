import { useState } from "react";
import { ScrollView, View, Text, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HapticPressable } from "@/components/HapticPressable";
import { usePremium } from "@/lib/context/premium";
import { useRouter } from "expo-router";
import Constants from "expo-constants";

const isExpoGo = Constants.appOwnership === "expo";

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

export default function PremiumScreen() {
  const router = useRouter();
  const { packages, purchasePackage, restorePurchases, isPremium, loading } = usePremium();
  const [selectedPlan, setSelectedPlan] = useState("yearly");
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const monthlyPkg = packages.find(
    (p) => p.packageType === "MONTHLY" || p.identifier.includes("monthly")
  );
  const yearlyPkg = packages.find(
    (p) => p.packageType === "ANNUAL" || p.identifier.includes("yearly")
  );

  const selectedPkg = selectedPlan === "monthly" ? monthlyPkg : yearlyPkg;

  const handlePurchase = async () => {
    if (isExpoGo) {
      Alert.alert("Test Modu", "Expo Go'da satın alma simüle ediliyor...", [
        {
          text: "Premium Yap", onPress: async () => {
            if (selectedPkg) await purchasePackage(selectedPkg);
          }
        },
        { text: "İptal", style: "cancel" },
      ]);
      return;
    }
    if (!selectedPkg) {
      Alert.alert("Hata", "Paket bulunamadı.");
      return;
    }
    setPurchasing(true);
    const success = await purchasePackage(selectedPkg);
    setPurchasing(false);
    if (success) {
      Alert.alert("Tebrikler!", "VELA Premium'a hoş geldin!", [
        { text: "Harika!", onPress: () => router.back() },
      ]);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    const success = await restorePurchases();
    setRestoring(false);
    if (success) {
      Alert.alert("Başarılı", "Satın almalar geri yüklendi.", [
        { text: "Tamam", onPress: () => router.back() },
      ]);
    } else {
      Alert.alert("Bulunamadı", "Aktif bir abonelik bulunamadı.");
    }
  };

  if (isPremium) {
    return (
      <View style={{ flex: 1, backgroundColor: "#06060F", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <View style={{ width: 80, height: 80, borderRadius: 28, backgroundColor: "rgba(139,92,246,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <Ionicons name="diamond" size={38} color="#A78BFA" />
        </View>
        <Text style={{ color: "#fff", fontSize: 24, fontWeight: "900", marginBottom: 10 }}>Premium Aktif</Text>
        <Text style={{ color: "#555", fontSize: 15, textAlign: "center" }}>Tüm premium özelliklere erişimin var.</Text>
      </View>
    );
  }

  const PLANS = [
    {
      id: "monthly",
      label: "Aylık",
      price: monthlyPkg?.product.priceString ?? "₺149,99",
      sub: "/ay",
      badge: null,
      accent: false,
    },
    {
      id: "yearly",
      label: "Yıllık",
      price: yearlyPkg?.product.priceString ?? "₺1.199,99",
      sub: "/yıl",
      badge: "%33 tasarruf",
      accent: true,
    },
  ];

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
          <Ionicons name="diamond" size={38} color="#A78BFA" />
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
              <Text style={{ color: isSelected ? "#fff" : "#777", fontSize: 22, fontWeight: "900", letterSpacing: -1 }}>{plan.price}</Text>
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
      <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
        <HapticPressable
          onPress={handlePurchase}
          disabled={purchasing || loading}
          style={({ pressed }) => ({
            backgroundColor: pressed ? "#5B21B6" : "#7C3AED",
            borderRadius: 18, borderCurve: "continuous",
            paddingVertical: 18, alignItems: "center",
            opacity: purchasing || loading ? 0.7 : 1,
          })}
        >
          {purchasing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>Hemen Başla</Text>
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 }}>Dilediğinde iptal et</Text>
            </>
          )}
        </HapticPressable>
      </View>

      {/* Restore */}
      <HapticPressable
        onPress={handleRestore}
        disabled={restoring}
        style={{ alignItems: "center", paddingVertical: 10, marginBottom: 16 }}
      >
        {restoring ? (
          <ActivityIndicator color="#555" size="small" />
        ) : (
          <Text style={{ color: "#444", fontSize: 13 }}>Satın almaları geri yükle</Text>
        )}
      </HapticPressable>

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
              ? <Ionicons name="diamond-outline" size={14} color="#7C3AED" />
              : <Ionicons name="checkmark" size={16} color="#34D399" />
            }
          </View>
        ))}
      </View>
    </ScrollView>
  );
}