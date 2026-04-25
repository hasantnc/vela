import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/config";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/(auth)/login");
        return;
      }

      const val = await AsyncStorage.getItem("onboarding_done");

      if (val === "true") {
        router.replace("/(tabs)/(home)");
      } else {
        router.replace("/(onboarding)");
      }
    });
    return unsub;
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#06060F", alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color="#8B5CF6" size="large" />
    </View>
  );
}