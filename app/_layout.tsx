import { useEffect } from "react";
import { Stack } from "expo-router";
import { CurrencyProvider } from "@/lib/context/currency";
import { HapticsProvider } from "@/lib/context/haptics";
import { PremiumProvider } from "@/lib/context/premium";
import { requestNotificationPermissions, setupNotificationHandler } from "@/lib/notifications";

const SCREEN_DEFAULTS = {
  headerStyle: { backgroundColor: "#06060F" },
  headerTintColor: "#FFFFFF",
  headerTitleStyle: { fontWeight: "700" as const },
  headerBackTitle: "Geri",
};

export default function RootLayout() {
  useEffect(() => {
    setupNotificationHandler();
    void requestNotificationPermissions().catch(() => {});
  }, []);

  return (
    <HapticsProvider>
      <PremiumProvider>
      <CurrencyProvider>
        <Stack>
          <Stack.Screen name="index"         options={{ headerShown: false }} />
          <Stack.Screen name="(auth)"        options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)"  options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)"        options={{ headerShown: false }} />
          <Stack.Screen name="streak"        options={{ ...SCREEN_DEFAULTS, title: "Streak 🔥" }} />
          <Stack.Screen name="badges"        options={{ ...SCREEN_DEFAULTS, title: "Rozetler" }} />
          <Stack.Screen name="regret"        options={{ ...SCREEN_DEFAULTS, title: "Pişmanlıklar" }} />
          <Stack.Screen name="payday"        options={{ ...SCREEN_DEFAULTS, title: "Maaş Günü" }} />
          <Stack.Screen name="history"       options={{ ...SCREEN_DEFAULTS, title: "Geçmiş" }} />
          <Stack.Screen name="currency"      options={{ ...SCREEN_DEFAULTS, title: "Döviz Koruması 💱" }} />
          <Stack.Screen name="sms"           options={{ ...SCREEN_DEFAULTS, title: "SMS Analiz 📩" }} />
          <Stack.Screen name="notifications" options={{ ...SCREEN_DEFAULTS, title: "Bildirimler" }} />
          <Stack.Screen name="premium"       options={{ ...SCREEN_DEFAULTS, title: "Premium 💎" }} />
          <Stack.Screen name="category-limits" options={{ ...SCREEN_DEFAULTS, title: "Kategori Limitleri" }} />
          <Stack.Screen name="privacy"        options={{ ...SCREEN_DEFAULTS, title: "Gizlilik Politikası" }} />
        </Stack>
      </CurrencyProvider>
      </PremiumProvider>
    </HapticsProvider>
  );
}