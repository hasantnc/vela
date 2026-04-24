import { Pressable, PressableProps } from "react-native";
import { useHaptics } from "@/lib/context/haptics";

/**
 * Pressable ile aynı API, her dokunuşta otomatik impact() çalar.
 * Ekstra `onPress` verilmişse impact() sonrasında çalıştırılır.
 */
export function HapticPressable({ onPress, ...props }: PressableProps) {
  const { impact } = useHaptics();

  return (
    <Pressable
      {...props}
      onPress={(e) => {
        impact();
        onPress?.(e);
      }}
    />
  );
}
