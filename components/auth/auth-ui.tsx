import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";

export const C = {
  bg: "#0C0C1A",
  purple: "#8B5CF6",
  green: "#10B981",
  amber: "#F59E0B",
  red: "#EF4444",
  teal: "#34D399",
  blue: "#3B82F6",
  white: "#FFFFFF",
  sub: "#555555",
  hint: "#444444",
  border: "rgba(255,255,255,0.09)",
};

export function GlassCard({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: object;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: "rgba(255,255,255,0.065)",
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 22,
        borderCurve: "continuous",
        padding: 18,
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </Pressable>
  );
}

export function AuthInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  error,
  hint,
  autoCapitalize = "none",
}: {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "email-address" | "numeric" | "default";
  error?: string;
  hint?: string;
  autoCapitalize?: "none" | "words" | "sentences";
}) {
  const [focused, setFocused] = useState(false);
  const [showPass, setShowPass] = useState(false);

  return (
    <View style={{ marginBottom: 16 }}>
      {label && (
        <Text style={{ color: "#888", fontSize: 12, fontWeight: "600", marginBottom: 8, letterSpacing: 0.5 }}>
          {label}
        </Text>
      )}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          backgroundColor: focused ? "rgba(139,92,246,0.08)" : "rgba(255,255,255,0.05)",
          borderWidth: 1.5,
          borderColor: error ? C.red : focused ? C.purple : C.border,
          borderRadius: 16,
          borderCurve: "continuous",
          paddingHorizontal: 16,
          paddingVertical: 14,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#333"
          secureTextEntry={secureTextEntry && !showPass}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ flex: 1, color: C.white, fontSize: 15, fontWeight: "500" }}
        />
        {secureTextEntry && (
          <Pressable onPress={() => setShowPass((s) => !s)}>
            <Text style={{ color: "#555", fontSize: 13, fontWeight: "600" }}>
              {showPass ? "Gizle" : "Göster"}
            </Text>
          </Pressable>
        )}
      </View>
      {!!error && (
        <Text selectable style={{ color: C.red, fontSize: 12, marginTop: 6 }}>
          ⚠ {error}
        </Text>
      )}
      {!!hint && !error && (
        <Text style={{ color: "#444", fontSize: 12, marginTop: 6 }}>{hint}</Text>
      )}
    </View>
  );
}

export function PrimaryBtn({
  children,
  onPress,
  disabled,
  loading,
  color = C.purple,
}: {
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  color?: string;
}) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={{
        width: "100%",
        paddingVertical: 17,
        borderRadius: 18,
        borderCurve: "continuous",
        alignItems: "center",
        backgroundColor: isDisabled ? "rgba(255,255,255,0.05)" : color,
        boxShadow: isDisabled ? "none" : `0 8px 28px ${color}44`,
      }}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <Text style={{ color: isDisabled ? "#333" : C.white, fontSize: 16, fontWeight: "800", letterSpacing: 0.3 }}>
          {children}
        </Text>
      )}
    </Pressable>
  );
}

export function Divider({ label }: { label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginVertical: 20 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.07)" }} />
      <Text style={{ color: "#444", fontSize: 12, fontWeight: "600" }}>{label}</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.07)" }} />
    </View>
  );
}