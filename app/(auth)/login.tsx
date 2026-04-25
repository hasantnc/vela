import { useState } from "react";
import { View, Text, ScrollView, Alert, ActivityIndicator, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HapticPressable } from "@/components/HapticPressable";
import { Link, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import { GoogleAuthProvider, OAuthProvider, signInWithCredential } from "firebase/auth";

import { C, AuthInput, Divider, GlassCard } from "@/components/auth/auth-ui";
import { loginWithEmail } from "@/lib/firebase/auth";
import { auth } from "@/lib/firebase/config";

// Google Sign-In yapılandırması
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
  offlineAccess: true,
});

const triggerHaptic = (type: "selection" | "success" | "error") => {
  if (type === "selection") Haptics.selectionAsync();
  if (type === "success") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  if (type === "error") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
};

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "apple" | null>(null);

  const valid = email.includes("@") && pass.length >= 6;

  // ── Google Auth ────────────────────────────────────────
  const handleGoogle = async () => {
    triggerHaptic("selection");
    setSocialLoading("google");
    setError("");
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      if (!idToken) throw new Error("no_token");
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
      triggerHaptic("success");
      router.replace("/(tabs)");
    } catch (e: any) {
      if (e.code === statusCodes.SIGN_IN_CANCELLED) {
        // kullanıcı iptal etti
      } else if (e.code === statusCodes.IN_PROGRESS) {
        // zaten işlem var
      } else {
        setError("Google girişi başarısız. Tekrar dene.");
        triggerHaptic("error");
      }
    } finally {
      setSocialLoading(null);
    }
  };

  // ── Apple Auth ─────────────────────────────────────────
  const handleApple = async () => {
    if (process.env.EXPO_OS !== "ios") {
      Alert.alert("Apple ile giriş yalnızca iOS cihazlarda kullanılabilir.");
      return;
    }
    triggerHaptic("selection");
    setSocialLoading("apple");
    try {
      const cred = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const { identityToken } = cred;
      if (!identityToken) throw new Error("no_token");
      const provider = new OAuthProvider("apple.com");
      const firebaseCred = provider.credential({ idToken: identityToken });
      await signInWithCredential(auth, firebaseCred);
      triggerHaptic("success");
      router.replace("/(tabs)");
    } catch (e: any) {
      if (e.code !== "ERR_REQUEST_CANCELED") {
        setError("Apple girişi başarısız.");
      }
    } finally {
      setSocialLoading(null);
    }
  };

  // ── Email Auth ─────────────────────────────────────────
  const handleLogin = async () => {
    if (!valid) return;
    setLoading(true);
    setError("");
    try {
      await loginWithEmail(email, pass);
      triggerHaptic("success");
      router.replace("/(tabs)");
    } catch (e: any) {
      triggerHaptic("error");
      const code = e?.code || "";
      if (
        code === "auth/user-not-found" ||
        code === "auth/wrong-password" ||
        code === "auth/invalid-credential"
      ) {
        setError("E-posta veya şifre hatalı.");
      } else if (code === "auth/too-many-requests") {
        setError("Çok fazla deneme. Lütfen bekle.");
      } else {
        setError("Giriş başarısız. Tekrar dene.");
      }
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
      <View style={{ position: "absolute", top: -80, right: -60, width: 300, height: 300, borderRadius: 150, backgroundColor: C.purple, opacity: 0.12, pointerEvents: "none" }} />
      <View style={{ position: "absolute", bottom: -60, left: -60, width: 250, height: 250, borderRadius: 125, backgroundColor: C.blue, opacity: 0.08, pointerEvents: "none" }} />

      {/* Logo */}
      <View style={{ paddingTop: 72, paddingHorizontal: 32, alignItems: "center" }}>
        <Image
          source={require("@/assets/icon.png")}
          style={{ width: 90, height: 90, borderRadius: 24, marginBottom: 16 }}
          resizeMode="cover"
        />
        <Text style={{ color: C.sub, fontSize: 15 }}>Finansal pusulana hoş geldin</Text>
      </View>

      {/* Form */}
      <View style={{ paddingHorizontal: 28, paddingTop: 40 }}>
        <AuthInput
          label="E-posta"
          value={email}
          onChangeText={setEmail}
          placeholder="ahmet@email.com"
          keyboardType="email-address"
          error={error}
        />
        <AuthInput
          label="Şifre"
          value={pass}
          onChangeText={setPass}
          placeholder="••••••••"
          secureTextEntry
          hint="En az 6 karakter"
        />

        <View style={{ alignItems: "flex-end", marginBottom: 24, marginTop: -8 }}>
          <Link href="/(auth)/forgot-password" asChild>
            <HapticPressable>
              <Text style={{ color: C.purple, fontSize: 13, fontWeight: "600" }}>Şifremi unuttum →</Text>
            </HapticPressable>
          </Link>
        </View>

        <HapticPressable
          onPress={handleLogin}
          disabled={!valid || loading}
          style={({ pressed }) => ({
            width: "100%",
            paddingVertical: 17,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
            backgroundColor: !valid ? "rgba(255,255,255,0.05)" : pressed ? "#5B21B6" : "#7C3AED",
            boxShadow: !valid ? "none" : "0 8px 28px rgba(124,58,237,0.45)",
          })}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="lock-open-outline" size={18} color={!valid ? "#333" : "#fff"} />
              <Text style={{ color: !valid ? "#333" : "#fff", fontSize: 16, fontWeight: "800", letterSpacing: 0.3 }}>
                Giriş Yap
              </Text>
            </>
          )}
        </HapticPressable>

        <Divider label="veya" />

        {/* Social Buttons */}
        <View style={{ gap: 10, marginBottom: 32 }}>
          {/* Apple */}
          <HapticPressable
            onPress={handleApple}
            disabled={socialLoading !== null}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              paddingVertical: 16,
              borderRadius: 16,
              borderCurve: "continuous",
              backgroundColor: pressed ? "#E5E5E5" : "#FFFFFF",
              opacity: socialLoading !== null && socialLoading !== "apple" ? 0.4 : 1,
            })}
          >
            {socialLoading === "apple" ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <>
                <Ionicons name="logo-apple" size={20} color="#000" />
                <Text style={{ color: "#000", fontSize: 15, fontWeight: "700" }}>Apple ile devam et</Text>
              </>
            )}
          </HapticPressable>

          {/* Google */}
          <HapticPressable
            onPress={handleGoogle}
            disabled={socialLoading !== null}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              paddingVertical: 16,
              borderRadius: 16,
              borderCurve: "continuous",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.14)",
              backgroundColor: pressed ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.06)",
              opacity: socialLoading !== null && socialLoading !== "google" ? 0.4 : 1,
            })}
          >
            {socialLoading === "google" ? (
              <ActivityIndicator color={C.white} size="small" />
            ) : (
              <>
                <View style={{ width: 22, height: 22, borderRadius: 4, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 13, fontWeight: "900", color: "#4285F4" }}>G</Text>
                </View>
                <Text style={{ color: C.white, fontSize: 15, fontWeight: "700" }}>Google ile devam et</Text>
              </>
            )}
          </HapticPressable>
        </View>

        {/* Register link */}
        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginBottom: 20 }}>
          <Text style={{ color: C.sub, fontSize: 14 }}>Hesabın yok mu? </Text>
          <Link href="/(auth)/register" asChild>
            <HapticPressable>
              <Text style={{ color: C.purple, fontSize: 14, fontWeight: "700" }}>Kayıt Ol</Text>
            </HapticPressable>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}