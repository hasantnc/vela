import { useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { C, AuthInput, PrimaryBtn, GlassCard } from "@/components/auth/auth-ui";
import { resetPassword } from "@/lib/firebase/auth";
import { useHaptics } from "@/lib/context/haptics";
import { HapticPressable } from "@/components/HapticPressable";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { selection, notification } = useHaptics();
  const [step,    setStep]    = useState(0);
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const send = async () => {
    setLoading(true);
    setError("");
    try {
      await resetPassword(email);
      notification();
      setStep(1);
    } catch (e: any) {
      const code = e?.code || "";
      if (code === "auth/user-not-found") {
        setError("Bu e-posta ile kayıtlı hesap bulunamadı.");
      } else if (code === "auth/invalid-email") {
        setError("Geçersiz e-posta adresi.");
      } else {
        setError("Gönderim başarısız, tekrar dene.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingTop: 56, paddingHorizontal: 28, paddingBottom: 60 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={{ flex: 1, backgroundColor: C.bg }}
    >
      {/* Amber glow */}
      <View style={{ position: "absolute", top: -60, right: -60, width: 280, height: 280, borderRadius: 140, backgroundColor: C.amber, opacity: 0.08, pointerEvents: "none" }} />

      <HapticPressable onPress={() => router.back()} style={{ alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 12, borderCurve: "continuous", paddingHorizontal: 14, paddingVertical: 8, marginBottom: 28, flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Ionicons name="chevron-back" size={13} color="#888" />
        <Text style={{ color: "#888", fontSize: 13 }}>Geri</Text>
      </HapticPressable>

      {/* Step 0: Enter email */}
      {step === 0 && (
        <View>
          <View style={{ width: 72, height: 72, borderRadius: 24, borderCurve: "continuous", backgroundColor: "rgba(245,158,11,0.12)", borderWidth: 2, borderColor: "rgba(245,158,11,0.25)", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <Ionicons name="key-outline" size={34} color="#F59E0B" />
          </View>
          <Text style={{ color: C.white, fontSize: 24, fontWeight: "800", marginBottom: 8 }}>Şifreni Sıfırla</Text>
          <Text style={{ color: "#666", fontSize: 14, lineHeight: 22, marginBottom: 28 }}>
            E-posta adresini gir, sana şifre sıfırlama bağlantısı gönderelim.
          </Text>
          <AuthInput label="E-posta" value={email} onChangeText={setEmail} placeholder="ahmet@email.com" keyboardType="email-address" />
          {error ? (
            <Text style={{ color: C.red, fontSize: 13, marginBottom: 8 }}>{error}</Text>
          ) : null}
          <View style={{ marginTop: 8 }}>
            <PrimaryBtn onPress={send} loading={loading} disabled={!email.includes("@")} color={C.amber}>
              Sıfırlama Linki Gönder →
            </PrimaryBtn>
          </View>
        </View>
      )}

      {/* Step 1: Sent */}
      {step === 1 && (
        <View style={{ alignItems: "center" }}>
          <View style={{ width: 90, height: 90, borderRadius: 28, borderCurve: "continuous", backgroundColor: "rgba(52,211,153,0.12)", borderWidth: 2, borderColor: "rgba(52,211,153,0.25)", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
            <Ionicons name="checkmark-circle" size={48} color="#34D399" />
          </View>
          <Text style={{ color: C.white, fontSize: 22, fontWeight: "800", marginBottom: 10, textAlign: "center" }}>Link Gönderildi!</Text>
          <Text style={{ color: "#666", fontSize: 14, lineHeight: 24, marginBottom: 8, textAlign: "center" }}>
            <Text style={{ color: C.teal, fontWeight: "700" }}>{email}</Text> adresine şifre sıfırlama linki gönderdik.
          </Text>
          <Text style={{ color: "#444", fontSize: 13, marginBottom: 36, textAlign: "center" }}>
            Spam klasörünü de kontrol et • Link 15 dk geçerli
          </Text>

          <GlassCard style={{ width: "100%", marginBottom: 24, backgroundColor: "rgba(245,158,11,0.06)", borderColor: "rgba(245,158,11,0.15)", borderRadius: 18 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 6 }}>
              <Ionicons name="bulb-outline" size={13} color={C.amber} />
              <Text style={{ color: C.amber, fontSize: 12, fontWeight: "700" }}>Gelmedi mi?</Text>
            </View>
            <Text style={{ color: "#777", fontSize: 13, lineHeight: 20 }}>
              Spam / Junk klasörünü kontrol et ya da 60 saniye bekleyip tekrar dene.
            </Text>
          </GlassCard>

          <PrimaryBtn onPress={() => router.replace("/(auth)/login")} color={C.purple}>
            Giriş Sayfasına Dön
          </PrimaryBtn>

          <HapticPressable onPress={() => { selection(); setStep(0); }} style={{ marginTop: 12 }}>
            <Text style={{ color: C.sub, fontSize: 13 }}>Farklı e-posta dene →</Text>
          </HapticPressable>
        </View>
      )}
    </ScrollView>
  );
}