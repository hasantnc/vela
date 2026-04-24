import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LAST_LIMIT_NOTIF_KEY = "@vela:last_limit_notif_date";

let handlerReady = false;

/** Standalone / Android build: native modül hazır olduktan sonra çağrılmalı (açılış crash önleme) */
export function setupNotificationHandler() {
  if (handlerReady) return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    handlerReady = true;
  } catch {
    // expo-notifications bu ortamda yok / hata: sessizce devam
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/**
 * Günlük limit aşıldığında bir kez bildirim gönderir.
 * Aynı gün içinde ikinci kez çağrılırsa sessiz kalır.
 */
export async function notifyLimitExceeded(symbol: string, limitAmount: number) {
  const today = new Date().toDateString();
  const lastNotif = await AsyncStorage.getItem(LAST_LIMIT_NOTIF_KEY);
  if (lastNotif === today) return;

  await AsyncStorage.setItem(LAST_LIMIT_NOTIF_KEY, today);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "⛔ Günlük Limit Aşıldı",
      body: `${symbol}${Math.round(limitAmount)} limitini aştın. Harcamaları gözden geçir!`,
      data: { screen: "home" },
    },
    trigger: null, // Anında gönder
  });
}

/**
 * Limite yaklaşıldığında (%80+) uyarı bildirimi.
 */
export async function notifyLimitWarning(symbol: string, pct: number) {
  const key = "@vela:last_limit_warning_date";
  const today = new Date().toDateString();
  const last = await AsyncStorage.getItem(key);
  if (last === today) return;

  await AsyncStorage.setItem(key, today);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "⚡ Limite Yaklaşıyorsun",
      body: `Günlük limitinin %${pct}'ini kullandın. Dikkatli harca!`,
      data: { screen: "home" },
    },
    trigger: null,
  });
}
