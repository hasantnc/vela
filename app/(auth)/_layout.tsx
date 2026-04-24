import { Stack } from "expo-router/stack";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0C0C1A" },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="login" options={{ title: "Giriş Yap" }} />
      <Stack.Screen name="register" options={{ title: "Hesap Oluştur" }} />
      <Stack.Screen name="forgot-password" options={{ title: "Şifremi Sıfırla" }} />
    </Stack>
  );
}