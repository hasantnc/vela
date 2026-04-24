import { Tabs } from "expo-router";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useHaptics } from "@/lib/context/haptics";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

function HapticTabButton(props: any) {
  const { impact } = useHaptics();
  return (
    <Pressable
      {...props}
      onPress={(e) => {
        impact();
        props.onPress?.(e);
      }}
    />
  );
}

const TAB_ICON_SIZE = 24;

function tabIcon(name: IoniconsName, outlineName: IoniconsName) {
  return ({ color, focused }: { color: string; focused: boolean }) => (
    <Ionicons
      name={focused ? name : outlineName}
      size={TAB_ICON_SIZE}
      color={color}
    />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="(home)"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#8B5CF6",
        tabBarInactiveTintColor: "#555",
        tabBarStyle: {
          backgroundColor: "#0C0C1A",
          borderTopColor: "rgba(255,255,255,0.07)",
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: "Ana Sayfa",
          tabBarIcon: tabIcon("home", "home-outline"),
          tabBarButton: (props) => <HapticTabButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="(budget)"
        options={{
          title: "Analiz",
          tabBarIcon: tabIcon("bar-chart", "bar-chart-outline"),
          tabBarButton: (props) => <HapticTabButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="(goals)"
        options={{
          title: "Hedefler",
          tabBarIcon: tabIcon("flag", "flag-outline"),
          tabBarButton: (props) => <HapticTabButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="(profile)"
        options={{
          title: "Profil",
          tabBarIcon: tabIcon("person", "person-outline"),
          tabBarButton: (props) => <HapticTabButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="(ai)"
        options={{
          title: "AI",
          href: null,
          tabBarIcon: tabIcon("sparkles", "sparkles-outline"),
        }}
      />
    </Tabs>
  );
}