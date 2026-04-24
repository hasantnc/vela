import { Stack } from "expo-router/stack";

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0C0C1A" }, animation: "fade" }}>
      <Stack.Screen name="index" options={{ title: "Hoş Geldin" }} />
    </Stack>
  );
}