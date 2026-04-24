import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

const HAPTICS_KEY = "@vela:haptics_enabled";

type HapticsContextType = {
  hapticsEnabled: boolean;
  setHapticsEnabled: (value: boolean) => void;
  impact: (style?: Haptics.ImpactFeedbackStyle) => void;
  selection: () => void;
  notification: (type?: Haptics.NotificationFeedbackType) => void;
};

const HapticsContext = createContext<HapticsContextType>({
  hapticsEnabled: true,
  setHapticsEnabled: () => {},
  impact: () => {},
  selection: () => {},
  notification: () => {},
});

export function HapticsProvider({ children }: { children: ReactNode }) {
  const [hapticsEnabled, setEnabled] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(HAPTICS_KEY).then((val) => {
      if (val !== null) setEnabled(val === "true");
    });
  }, []);

  const setHapticsEnabled = useCallback(async (value: boolean) => {
    setEnabled(value);
    await AsyncStorage.setItem(HAPTICS_KEY, String(value));
  }, []);

  const impact = useCallback(
    (style = Haptics.ImpactFeedbackStyle.Light) => {
      if (!hapticsEnabled) return;
      Haptics.impactAsync(style);
    },
    [hapticsEnabled]
  );

  const selection = useCallback(() => {
    if (!hapticsEnabled) return;
    Haptics.selectionAsync();
  }, [hapticsEnabled]);

  const notification = useCallback(
    (type = Haptics.NotificationFeedbackType.Success) => {
      if (!hapticsEnabled) return;
      Haptics.notificationAsync(type);
    },
    [hapticsEnabled]
  );

  return (
    <HapticsContext.Provider
      value={{ hapticsEnabled, setHapticsEnabled, impact, selection, notification }}
    >
      {children}
    </HapticsContext.Provider>
  );
}

export function useHaptics() {
  return useContext(HapticsContext);
}
