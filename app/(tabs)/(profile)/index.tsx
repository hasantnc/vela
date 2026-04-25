import { useState, useEffect } from "react";
import { ScrollView, View, Text, Pressable, Alert, TextInput, Modal, Switch, KeyboardAvoidingView, ActivityIndicator } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { HapticPressable } from "@/components/HapticPressable";
import { logout, useAuth, updateDisplayName } from "@/lib/firebase/auth";
import { setDailyLimit, getDailyLimit } from "@/lib/firebase/firestore";
import { exportTransactionsCSV } from "@/lib/export/csv";
import { useCurrency } from "@/lib/context/currency";
import { useHaptics } from "@/lib/context/haptics";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const LANGUAGES = ["Türkçe", "English"];

const Pill = ({ children, color = "#8B5CF6" }: { children: string; color?: string }) => (
  <View style={{
    backgroundColor: `${color}22`,
    borderWidth: 1,
    borderColor: `${color}44`,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: "flex-start",
  }}>
    <Text style={{ color, fontSize: 11, fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase" }}>
      {children}
    </Text>
  </View>
);

const SectionLabel = ({ title }: { title: string }) => (
  <Text style={{
    color: "#444",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    paddingLeft: 4,
  }}>
    {title}
  </Text>
);

const Card = ({ children, style }: { children: React.ReactNode; style?: any }) => (
  <View style={{
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    borderRadius: 22,
    borderCurve: "continuous",
    overflow: "hidden",
    ...style,
  }}>
    {children}
  </View>
);

const Row = ({
  iconName, label, right, onPress, danger, last,
}: {
  iconName: IoniconsName;
  label: string;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
  last?: boolean;
}) => {
  const inner = (
    <View style={{
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingHorizontal: 18,
      paddingVertical: 14,
      borderBottomWidth: last ? 0 : 1,
      borderBottomColor: "rgba(255,255,255,0.05)",
    }}>
      <Ionicons
        name={iconName}
        size={18}
        color={danger ? "#F87171" : "#666"}
        style={{ width: 22, textAlign: "center" }}
      />
      <Text style={{ color: danger ? "#F87171" : "#ccc", fontSize: 14, fontWeight: "600", flex: 1 }}>
        {label}
      </Text>
      {right}
      {onPress && !right && <Ionicons name="chevron-forward" size={14} color="#333" />}
    </View>
  );

  if (onPress) {
    return (
      <HapticPressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
        {inner}
      </HapticPressable>
    );
  }
  return inner;
};

export default function ProfileScreen() {
  const [premium] = useState(false);
  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const [dailyLimit, setDailyLimitState] = useState("1200");
  const [language, setLanguage] = useState("Türkçe");
  const [toggles, setToggles] = useState({
    pushNotifications: true,
    smsAnalysis: true,
    haptics: true,
  });

  // Name edit
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [newName, setNewName] = useState("");
  const [nameSaving, setNameSaving] = useState(false);

  const router = useRouter();
  const { user } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const { impact, notification } = useHaptics();

  useEffect(() => {
    if (!user) return;
    getDailyLimit(user.uid).then((v) => setDailyLimitState(String(v)));
  }, [user]);

  const toggle = (key: string) =>
    setToggles((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));

  const handleLogout = () => {
    Alert.alert("Çıkış Yap", "Hesabından çıkmak istediğine emin misin?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Çıkış Yap",
        style: "destructive",
        onPress: async () => { await logout(); router.replace("/(auth)/login"); },
      },
    ]);
  };

  const handleSaveLimit = async () => {
    if (!user?.uid) return;
    await setDailyLimit(user.uid, Number(dailyLimit));
    setLimitModalVisible(false);
    notification();
  };

  const openNameModal = () => {
    setNewName(user?.displayName ?? "");
    setNameModalVisible(true);
  };

  const handleSaveName = async () => {
    if (!newName.trim()) return;
    setNameSaving(true);
    await updateDisplayName(newName.trim());
    setNameSaving(false);
    setNameModalVisible(false);
    notification();
  };

  const initials = (user?.displayName ?? user?.email ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <Stack.Screen options={{ title: "Profil", headerLargeTitle: true }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: "#06060F" }}
        contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 110 }}
      >
        {/* Avatar + Info */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <HapticPressable onPress={openNameModal} style={{ position: "relative" }}>
            <View style={{
              width: 64, height: 64, borderRadius: 22,
              backgroundColor: "#6D28D9",
              alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800" }}>{initials}</Text>
            </View>
            <View style={{
              position: "absolute", bottom: -4, right: -4,
              width: 22, height: 22, borderRadius: 8,
              backgroundColor: "#8B5CF6",
              borderWidth: 2, borderColor: "#06060F",
              alignItems: "center", justifyContent: "center",
            }}>
              <Ionicons name="pencil" size={11} color="#fff" />
            </View>
          </HapticPressable>
          <View style={{ flex: 1, gap: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800" }}>
                {user?.displayName ?? "Kullanıcı"}
              </Text>
              <HapticPressable onPress={openNameModal}>
                <Ionicons name="pencil-outline" size={14} color="#555" />
              </HapticPressable>
            </View>
            <Text selectable style={{ color: "#555", fontSize: 13 }}>{user?.email}</Text>
            <Pill color={premium ? "#F59E0B" : "#555"}>{premium ? "Premium" : "Ücretsiz"}</Pill>
          </View>
        </View>

        {/* Premium Upsell */}
        {!premium && (
          <View style={{
            backgroundColor: "#100D00",
            borderWidth: 1,
            borderColor: "rgba(245,158,11,0.22)",
            borderRadius: 24,
            overflow: "hidden",
            borderCurve: "continuous",
          }}>
            {/* Top gradient bar */}
            <View style={{ height: 3, backgroundColor: "#F59E0B", opacity: 0.7 }} />

            <View style={{ padding: 20 }}>
              {/* Header */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <View style={{
                  width: 42, height: 42, borderRadius: 13,
                  backgroundColor: "rgba(245,158,11,0.15)",
                  borderWidth: 1, borderColor: "rgba(245,158,11,0.3)",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <Ionicons name="diamond" size={20} color="#F59E0B" />
                </View>
                <View>
                  <Text style={{ color: "#F59E0B", fontSize: 16, fontWeight: "800", letterSpacing: -0.3 }}>VELA Premium</Text>
                  <Text style={{ color: "#555", fontSize: 12, marginTop: 1 }}>Tüm özelliklerin kilidi açılır</Text>
                </View>
              </View>

              {/* Feature list */}
              <View style={{ gap: 7, marginBottom: 16 }}>
                {[
                  { icon: "chatbubble-outline" as const,    label: "SMS otomatik okuma" },
                  { icon: "hardware-chip-outline" as const, label: "AI haftalık rapor" },
                  { icon: "trending-up-outline" as const,   label: "Döviz koruması" },
                  { icon: "heart-outline" as const,         label: "Pişmanlık skoru" },
                  { icon: "calendar-outline" as const,      label: "Maaş günü modu" },
                ].map((f) => (
                  <View key={f.label} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Ionicons name={f.icon} size={14} color="#F59E0B" />
                    <Text style={{ color: "#bbb", fontSize: 13 }}>{f.label}</Text>
                  </View>
                ))}
              </View>

              {/* CTA */}
              <HapticPressable
                onPress={() => { router.push("/premium"); }}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? "#D97706" : "#F59E0B",
                  borderRadius: 14, paddingVertical: 15,
                  alignItems: "center", flexDirection: "row",
                  justifyContent: "center", gap: 8,
                })}
              >
                <Ionicons name="diamond" size={15} color="#000" />
                <Text style={{ color: "#000", fontSize: 15, fontWeight: "900" }}>7 Gün Ücretsiz Dene</Text>
              </HapticPressable>
            </View>
          </View>
        )}

        {/* Tercihler */}
        <SectionLabel title="Tercihler" />
        <Card>
          {/* Dil */}
          <View style={{ padding: 14, gap: 10, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <Ionicons name="earth-outline" size={18} color="#666" style={{ width: 22, textAlign: "center" }} />
              <Text style={{ color: "#ccc", fontSize: 14, fontWeight: "600" }}>Dil</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8, paddingLeft: 32 }}>
              {LANGUAGES.map((lang) => (
                <HapticPressable
                  key={lang}
                  onPress={() => setLanguage(lang)}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 7,
                    backgroundColor: language === lang ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.05)",
                    borderWidth: 1,
                    borderColor: language === lang ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.08)",
                    borderRadius: 10,
                  }}
                >
                  <Text style={{ color: language === lang ? "#A78BFA" : "#666", fontSize: 13, fontWeight: language === lang ? "700" : "400" }}>
                    {lang}
                  </Text>
                </HapticPressable>
              ))}
            </View>
          </View>

          {/* Para Birimi */}
          <View style={{ padding: 14, gap: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <Ionicons name="cash-outline" size={18} color="#666" style={{ width: 22, textAlign: "center" }} />
              <Text style={{ color: "#ccc", fontSize: 14, fontWeight: "600" }}>Para Birimi</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8, paddingLeft: 32 }}>
              {(["TRY", "USD", "EUR"] as const).map((cur) => (
                <HapticPressable
                  key={cur}
                  onPress={() => { setCurrency(cur); }}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 7,
                    backgroundColor: currency === cur ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.05)",
                    borderWidth: 1,
                    borderColor: currency === cur ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.08)",
                    borderRadius: 10,
                  }}
                >
                  <Text style={{ color: currency === cur ? "#A78BFA" : "#666", fontSize: 13, fontWeight: currency === cur ? "700" : "400" }}>
                    {cur === "TRY" ? "₺ TRY" : cur === "USD" ? "$ USD" : "€ EUR"}
                  </Text>
                </HapticPressable>
              ))}
            </View>
          </View>
        </Card>

        {/* Bildirimler */}
        <SectionLabel title="Bildirimler" />
        <Card>
          {[
            { key: "pushNotifications", iconName: "notifications-outline" as IoniconsName, label: "Push Bildirimler", last: false },
            { key: "smsAnalysis",       iconName: "chatbubble-outline" as IoniconsName,    label: "SMS Analizi",       last: true  },
          ].map((item) => (
            <Row
              key={item.key}
              iconName={item.iconName}
              label={item.label}
              last={item.last}
              right={
                <Switch
                  value={toggles[item.key as keyof typeof toggles]}
                  onValueChange={() => toggle(item.key)}
                  trackColor={{ false: "#333", true: "#7C3AED" }}
                  thumbColor="#fff"
                />
              }
            />
          ))}
        </Card>

        {/* Uygulama */}
        <SectionLabel title="Uygulama" />
        <Card>
          <Row
            iconName="phone-portrait-outline"
            label="Haptic Geri Bildirim"
            last
            right={
              <Switch
                value={toggles.haptics}
                onValueChange={() => toggle("haptics")}
                trackColor={{ false: "#333", true: "#7C3AED" }}
                thumbColor="#fff"
              />
            }
          />
        </Card>

        {/* Araçlar */}
        <SectionLabel title="Araçlar" />
        <Card>
          <Row iconName="lock-closed-outline"    label="Günlük Limit Ayarla"  onPress={() => setLimitModalVisible(true)} right={<Text style={{ color: "#8B5CF6", fontSize: 13, fontWeight: "700", marginRight: 4 }}>₺{dailyLimit}</Text>} />
          <Row iconName="options-outline"        label="Kategori Limitleri" onPress={() => { router.push("/category-limits" as any); }} />
          <Row iconName="trending-up-outline"   label="Döviz Ayarları"     onPress={() => { router.push("/currency"); }} />
          <Row iconName="notifications-outline" label="Bildirim Ayarları"  onPress={() => { router.push("/notifications"); }} />
          <Row iconName="download-outline"      label="CSV Dışa Aktar"     onPress={() => exportTransactionsCSV(user!.uid)} last />
        </Card>

        {/* Hesap */}
        <SectionLabel title="Hesap" />
        <Card>
          <Row iconName="star-outline"      label="Premium'a Geç"       onPress={() => { router.push("/premium"); }} />
          <Row iconName="shield-outline"    label="Gizlilik Politikası" onPress={() => { router.push("/privacy" as any); }} />
          <Row iconName="log-out-outline"   label="Çıkış Yap"           onPress={handleLogout} danger last />
        </Card>

        <Text style={{ color: "#333", fontSize: 11, textAlign: "center" }}>VELA v1.0.0</Text>
      </ScrollView>

      {/* Name Edit Modal */}
      <Modal
        visible={nameModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setNameModalVisible(false)}
      >
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: "#0C0C1A" }}>
          <View style={{ padding: 24, gap: 20, flex: 1 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>Adını Düzenle</Text>
              <HapticPressable onPress={() => setNameModalVisible(false)}>
                <Ionicons name="close" size={24} color="#555" />
              </HapticPressable>
            </View>

            {/* Preview avatar */}
            <View style={{ alignItems: "center", gap: 12 }}>
              <View style={{ width: 80, height: 80, borderRadius: 26, backgroundColor: "#6D28D9", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#fff", fontSize: 28, fontWeight: "800" }}>
                  {(newName || user?.displayName || user?.email || "?")
                    .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                </Text>
              </View>
            </View>

            <View style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderRadius: 16, paddingHorizontal: 18 }}>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="Adın Soyadın"
                placeholderTextColor="#444"
                autoFocus
                style={{ color: "#fff", fontSize: 16, paddingVertical: 16 }}
              />
            </View>

            <HapticPressable
              onPress={handleSaveName}
              disabled={!newName.trim() || nameSaving}
              style={({ pressed }) => ({
                backgroundColor: !newName.trim() ? "rgba(255,255,255,0.05)" : pressed ? "#5B21B6" : "#7C3AED",
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: "center",
                marginTop: "auto",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              })}
            >
              {nameSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={18} color={!newName.trim() ? "#333" : "#fff"} />
                  <Text style={{ color: !newName.trim() ? "#333" : "#fff", fontSize: 16, fontWeight: "800" }}>Kaydet</Text>
                </>
              )}
            </HapticPressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Daily Limit Modal */}
      <Modal
        visible={limitModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setLimitModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "#06060F", padding: 24, gap: 16 }}>
          <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800" }}>Günlük Limit</Text>
          <Text style={{ color: "#555", fontSize: 14 }}>Harcama limitini aştığında bildirim alırsın.</Text>
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "rgba(255,255,255,0.06)",
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.1)",
          }}>
            <Text style={{ color: "#8B5CF6", fontSize: 20, fontWeight: "800", marginRight: 8 }}>₺</Text>
            <TextInput
              value={dailyLimit}
              onChangeText={setDailyLimitState}
              keyboardType="numeric"
              style={{ flex: 1, color: "#fff", fontSize: 24, fontWeight: "800" }}
              placeholderTextColor="#444"
            />
          </View>
          <HapticPressable
            onPress={handleSaveLimit}
            style={{ backgroundColor: "#8B5CF6", borderRadius: 14, paddingVertical: 16, alignItems: "center" }}
          >
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "900" }}>Kaydet</Text>
          </HapticPressable>
          <HapticPressable
            onPress={() => setLimitModalVisible(false)}
            style={{ alignItems: "center", paddingVertical: 12 }}
          >
            <Text style={{ color: "#555", fontSize: 14 }}>İptal</Text>
          </HapticPressable>
        </View>
      </Modal>
    </>
  );
}