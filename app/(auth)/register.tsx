import { useState } from "react";
import { View, Text, ScrollView, Image, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Link, useRouter } from "expo-router";
import { HapticPressable } from "@/components/HapticPressable";
import { useHaptics } from "@/lib/context/haptics";

import { C, AuthInput, GlassCard } from "@/components/auth/auth-ui";
import { registerWithEmail } from "@/lib/firebase/auth";

function passStrength(pass: string) {
  if (!pass.length) return null;
  if (pass.length < 6)  return { label: "Çok kısa",  color: C.red,   pct: "20%" };
  if (pass.length < 8)  return { label: "Zayıf",     color: C.amber, pct: "45%" };
  if (!/[A-Z]/.test(pass) || !/[0-9]/.test(pass))
    return { label: "Orta",  color: C.amber, pct: "65%" };
  return { label: "Güçlü", color: C.teal, pct: "100%" };
}

const BENEFITS = [
  { icon: "hardware-chip-outline", label: "AI haftalık rapor" },
  { icon: "document-text-outline", label: "PDF ekstre analizi" },
  { icon: "analytics-outline",     label: "Finansal karakter analizi" },
  { icon: "trophy-outline",        label: "Rozet & seviye sistemi" },
];

const PASSWORD_RULES = [
  { label: "En az 6 karakter",    test: (p: string) => p.length >= 6 },
  { label: "Büyük harf içeriyor", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Rakam içeriyor",      test: (p: string) => /[0-9]/.test(p) },
];

export default function RegisterScreen() {
  const router = useRouter();
  const { selection, notification } = useHaptics();
  const hapticSuccess = () => notification(Haptics.NotificationFeedbackType.Success);
  const hapticError   = () => notification(Haptics.NotificationFeedbackType.Error);
  const [step,    setStep]    = useState(0);
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [pass,    setPass]    = useState("");
  const [pass2,   setPass2]   = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const strength = passStrength(pass);
  const steps = ["Bilgiler", "Şifre", "Tamamlandı"];

  const goBack = () => {
    if (step > 0) { selection(); setStep((s) => s - 1); }
    else router.back();
  };

  const handleRegister = async () => {
    setLoading(true);
    setError("");
    try {
      await registerWithEmail(email, pass);
      hapticSuccess();
      setStep(2);
    } catch (e: any) {
      hapticError();
      const code = e?.code || "";
      if (code === "auth/email-already-in-use") setError("Bu e-posta zaten kayıtlı.");
      else if (code === "auth/invalid-email")   setError("Geçersiz e-posta adresi.");
      else                                       setError("Kayıt başarısız. Tekrar dene.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingBottom: 60 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={{ flex: 1, backgroundColor: C.bg }}
    >
      {/* Glow orbs */}
      <View style={{ position: "absolute", top: -80, left: -60, width: 280, height: 280, borderRadius: 140, backgroundColor: C.green, opacity: 0.1, pointerEvents: "none" }} />
      <View style={{ position: "absolute", bottom: -60, right: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: C.purple, opacity: 0.07, pointerEvents: "none" }} />

      {/* Logo + back */}
      <View style={{ paddingTop: 60, paddingHorizontal: 28, alignItems: "center", marginBottom: 28 }}>
        <Image
          source={require("@/assets/icon.png")}
          style={{ width: 72, height: 72, borderRadius: 20, marginBottom: 16 }}
          resizeMode="cover"
        />
        <Text style={{ color: C.white, fontSize: 22, fontWeight: "900", letterSpacing: -0.5, marginBottom: 4 }}>Hesap Oluştur</Text>
        <Text style={{ color: C.sub, fontSize: 13 }}>Adım {step + 1} / {steps.length}</Text>
      </View>

      <View style={{ paddingHorizontal: 28 }}>
        {/* Progress bar */}
        <View style={{ flexDirection: "row", gap: 6, marginBottom: 32 }}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={{
                flex: 1, height: 4, borderRadius: 4,
                backgroundColor: i <= step ? C.green : "rgba(255,255,255,0.08)",
              }}
            />
          ))}
        </View>

        {/* ── Step 0: Bilgiler ── */}
        {step === 0 && (
          <View>
            <AuthInput label="Ad Soyad" value={name} onChangeText={setName} placeholder="Ahmet Yılmaz" autoCapitalize="words" />
            <AuthInput label="E-posta"  value={email} onChangeText={setEmail} placeholder="ahmet@email.com" keyboardType="email-address" />

            <GlassCard style={{ marginTop: 4, marginBottom: 28, backgroundColor: "rgba(16,185,129,0.06)", borderColor: "rgba(16,185,129,0.15)", borderRadius: 18, padding: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
                <Ionicons name="gift-outline" size={13} color={C.green} />
                <Text style={{ color: C.green, fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" }}>Üyelik Avantajları</Text>
              </View>
              {BENEFITS.map((b) => (
                <View key={b.label} style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: "rgba(16,185,129,0.12)", alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name={b.icon as any} size={13} color={C.green} />
                  </View>
                  <Text style={{ color: "#888", fontSize: 13 }}>{b.label}</Text>
                </View>
              ))}
            </GlassCard>

            <HapticPressable
              onPress={() => setStep(1)}
              disabled={!name.trim() || !email.includes("@")}
              style={({ pressed }) => ({
                flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
                paddingVertical: 17, borderRadius: 18,
                backgroundColor: !name.trim() || !email.includes("@") ? "rgba(255,255,255,0.05)" : pressed ? "#059669" : C.green,
                boxShadow: !name.trim() || !email.includes("@") ? "none" : "0 8px 28px rgba(16,185,129,0.35)",
              })}
            >
              <Text style={{ color: !name.trim() || !email.includes("@") ? "#333" : "#fff", fontSize: 16, fontWeight: "800" }}>Devam</Text>
              <Ionicons name="arrow-forward" size={18} color={!name.trim() || !email.includes("@") ? "#333" : "#fff"} />
            </HapticPressable>
          </View>
        )}

        {/* ── Step 1: Şifre ── */}
        {step === 1 && (
          <View>
            <AuthInput label="Şifre" value={pass} onChangeText={setPass} placeholder="••••••••" secureTextEntry hint="En az 8 karakter, büyük harf ve rakam" />

            {strength && (
              <View style={{ marginBottom: 16, marginTop: -8 }}>
                <View style={{ backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 4, height: 4, overflow: "hidden", marginBottom: 4 }}>
                  <View style={{ height: "100%", width: strength.pct as any, backgroundColor: strength.color, borderRadius: 4 }} />
                </View>
                <Text style={{ color: strength.color, fontSize: 12, fontWeight: "600" }}>{strength.label}</Text>
              </View>
            )}

            <AuthInput
              label="Şifre Tekrar"
              value={pass2}
              onChangeText={setPass2}
              placeholder="••••••••"
              secureTextEntry
              error={pass2 && pass !== pass2 ? "Şifreler eşleşmiyor" : ""}
            />

            {!!error && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
                <Ionicons name="alert-circle-outline" size={15} color={C.red} />
                <Text style={{ color: C.red, fontSize: 13 }}>{error}</Text>
              </View>
            )}

            {/* Password rules */}
            <View style={{ backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderRadius: 14, padding: 14, gap: 8, marginBottom: 24 }}>
              {PASSWORD_RULES.map((rule) => {
                const done = rule.test(pass);
                return (
                  <View key={rule.label} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View style={{ width: 20, height: 20, borderRadius: 6, backgroundColor: done ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" }}>
                      <Ionicons name={done ? "checkmark" : "remove"} size={12} color={done ? C.teal : "#333"} />
                    </View>
                    <Text style={{ color: done ? C.teal : "#444", fontSize: 13 }}>{rule.label}</Text>
                  </View>
                );
              })}
            </View>

            <HapticPressable
              onPress={handleRegister}
              disabled={pass.length < 6 || pass !== pass2 || loading}
              style={({ pressed }) => ({
                flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
                paddingVertical: 17, borderRadius: 18,
                backgroundColor: pass.length < 6 || pass !== pass2 ? "rgba(255,255,255,0.05)" : pressed ? "#059669" : C.green,
                boxShadow: pass.length < 6 || pass !== pass2 ? "none" : "0 8px 28px rgba(16,185,129,0.35)",
              })}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="person-add-outline" size={18} color={pass.length < 6 || pass !== pass2 ? "#333" : "#fff"} />
                  <Text style={{ color: pass.length < 6 || pass !== pass2 ? "#333" : "#fff", fontSize: 16, fontWeight: "800" }}>Hesap Oluştur</Text>
                </>
              )}
            </HapticPressable>
          </View>
        )}

        {/* ── Step 2: Başarı ── */}
        {step === 2 && (
          <View style={{ alignItems: "center", paddingTop: 16 }}>
            <View style={{
              width: 96, height: 96, borderRadius: 30,
              backgroundColor: "rgba(16,185,129,0.12)",
              borderWidth: 2, borderColor: "rgba(16,185,129,0.3)",
              alignItems: "center", justifyContent: "center",
              marginBottom: 24,
              boxShadow: "0 0 50px rgba(16,185,129,0.25)",
            }}>
              <Ionicons name="checkmark-circle" size={48} color={C.green} />
            </View>

            <Text style={{ color: C.white, fontSize: 24, fontWeight: "900", marginBottom: 10, textAlign: "center" }}>
              Hesabın Hazır!
            </Text>
            <Text style={{ color: "#666", fontSize: 14, lineHeight: 22, textAlign: "center", marginBottom: 36 }}>
              Hoş geldin{name ? `, ${name}` : ""}!{"\n"}VELA ile finansal hedeflerine ulaşmaya hazırsın.
            </Text>

            <HapticPressable
              onPress={() => router.replace("/(onboarding)")}
              style={({ pressed }) => ({
                width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
                paddingVertical: 17, borderRadius: 18,
                backgroundColor: pressed ? "#059669" : C.green,
                boxShadow: "0 8px 28px rgba(16,185,129,0.35)",
              })}
            >
              <Ionicons name="rocket-outline" size={18} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>Başlayalım</Text>
            </HapticPressable>
          </View>
        )}

        {/* Back button */}
        {step < 2 && (
          <HapticPressable
            onPress={goBack}
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 16, paddingVertical: 12 }}
          >
            <Ionicons name="chevron-back" size={15} color="#444" />
            <Text style={{ color: "#444", fontSize: 13, fontWeight: "600" }}>
              {step === 0 ? "Giriş Yap'a Dön" : "Geri"}
            </Text>
          </HapticPressable>
        )}

        {/* Login link */}
        {step === 0 && (
          <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 4, marginBottom: 8 }}>
            <Text style={{ color: C.sub, fontSize: 14 }}>Zaten hesabın var mı? </Text>
            <Link href="/(auth)/login" asChild>
              <HapticPressable>
                <Text style={{ color: C.purple, fontSize: 14, fontWeight: "700" }}>Giriş Yap</Text>
              </HapticPressable>
            </Link>
          </View>
        )}
      </View>
    </ScrollView>
  );
}