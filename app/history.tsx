import { useState, useEffect, useCallback } from "react";
import {
  ScrollView, View, Text, TextInput, Modal, KeyboardAvoidingView,
  ActivityIndicator, RefreshControl, Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HapticPressable } from "@/components/HapticPressable";
import { Stack } from "expo-router";
import { useAuth } from "@/lib/firebase/auth";
import { subscribeTransactions, deleteTransaction, updateTransaction } from "@/lib/firebase/firestore";
import type { Transaction } from "@/types";
import { useCurrency } from "@/lib/context/currency";
import { iconForCategory, colorForCategory } from "@/lib/categoryIcon";

const FILTERS = [
  { id: "all", label: "Tümü" },
  { id: "expense", label: "Gider" },
  { id: "income", label: "Gelir" },
] as const;

const CATEGORIES = [
  "Yemek", "Ulaşım", "Eğlence", "Fatura", "Alışveriş", "Sağlık", "Gelir", "Diğer",
];

export default function HistoryScreen() {
  const { user } = useAuth();
  const { symbol, convert } = useCurrency();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "expense" | "income">("all");

  // Edit modal state
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editType, setEditType] = useState<"expense" | "income">("expense");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeTransactions(user.uid, (txs) => {
      setTransactions(txs);
      setLoading(false);
      setRefreshing(false);
    });
    return unsub;
  }, [user]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
  }, []);

  const openEdit = (t: Transaction) => {
    setEditTx(t);
    setEditLabel(t.label);
    setEditAmount(String(t.amount));
    setEditCategory(t.category);
    setEditType(t.type as "expense" | "income");
  };

  const closeEdit = () => {
    setEditTx(null);
    setEditLabel("");
    setEditAmount("");
    setEditCategory("");
  };

  const handleSave = async () => {
    if (!user || !editTx) return;
    const amt = parseFloat(editAmount.replace(",", "."));
    if (!editLabel.trim() || isNaN(amt) || amt <= 0) return;
    setSaving(true);
    await updateTransaction(user.uid, String(editTx.id), {
      label: editLabel.trim(),
      amount: amt,
      category: editCategory,
      type: editType,
    });
    setSaving(false);
    closeEdit();
  };

  const handleDelete = (t: Transaction) => {
    Alert.alert(
      "İşlemi Sil",
      `"${t.label}" silinsin mi?`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: () => {
            if (user) deleteTransaction(user.uid, String(t.id));
          },
        },
      ]
    );
  };

  const filtered = transactions.filter((t) => {
    const matchSearch =
      t.label.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || t.type === filter;
    return matchSearch && matchFilter;
  });

  const totalIncome = filtered
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);

  const totalExpense = filtered
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <>
      <Stack.Screen options={{ title: "Geçmiş", headerBackTitle: "Geri" }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: "#06060F" }}
        contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#8B5CF6"
            colors={["#8B5CF6"]}
          />
        }
      >
        {/* Search */}
        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.06)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.1)",
            borderRadius: 14,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 14,
          }}
        >
          <Ionicons name="search-outline" size={16} color="#555" style={{ marginRight: 8 }} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Ara..."
            placeholderTextColor="#444"
            style={{ flex: 1, paddingVertical: 12, color: "#fff", fontSize: 14 }}
          />
          {search.length > 0 && (
            <HapticPressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color="#555" style={{ paddingLeft: 8 }} />
            </HapticPressable>
          )}
        </View>

        {/* Filter */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          {FILTERS.map((f) => (
            <HapticPressable
              key={f.id}
              onPress={() => setFilter(f.id)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                backgroundColor: filter === f.id ? "#8B5CF6" : "rgba(255,255,255,0.06)",
                borderRadius: 10,
              }}
            >
              <Text style={{ color: filter === f.id ? "#fff" : "#555", fontSize: 13, fontWeight: "700" }}>
                {f.label}
              </Text>
            </HapticPressable>
          ))}
        </View>

        {/* Summary */}
        {!loading && filtered.length > 0 && (
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(52,211,153,0.08)",
                borderWidth: 1,
                borderColor: "rgba(52,211,153,0.15)",
                borderRadius: 14,
                borderCurve: "continuous",
                padding: 12,
                gap: 2,
              }}
            >
              <Text style={{ color: "#555", fontSize: 11 }}>Gelir</Text>
              <Text style={{ color: "#34D399", fontSize: 15, fontWeight: "800" }}>
                +{symbol}{convert(totalIncome)}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(248,113,113,0.08)",
                borderWidth: 1,
                borderColor: "rgba(248,113,113,0.15)",
                borderRadius: 14,
                borderCurve: "continuous",
                padding: 12,
                gap: 2,
              }}
            >
              <Text style={{ color: "#555", fontSize: 11 }}>Gider</Text>
              <Text style={{ color: "#F87171", fontSize: 15, fontWeight: "800" }}>
                -{symbol}{convert(totalExpense)}
              </Text>
            </View>
          </View>
        )}

        {/* Loading */}
        {loading && (
          <View style={{ alignItems: "center", paddingTop: 40 }}>
            <ActivityIndicator color="#8B5CF6" />
          </View>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <View style={{ alignItems: "center", paddingTop: 40, gap: 8 }}>
            <Ionicons name="search-outline" size={34} color="#333" />
            <Text style={{ color: "#555", fontSize: 14 }}>İşlem bulunamadı</Text>
          </View>
        )}

        {/* List */}
        {filtered.map((t) => {
          const catIcon = iconForCategory(t.category);
          const catColor = t.type === "income" ? "#34D399" : colorForCategory(t.category);
          return (
            <View
              key={t.id}
              style={{
                backgroundColor: "rgba(255,255,255,0.04)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.09)",
                borderRadius: 22,
                borderCurve: "continuous",
                padding: 14,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  flexShrink: 0,
                  backgroundColor: `${catColor}18`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name={catIcon} size={20} color={catColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700", marginBottom: 2 }}>
                  {t.label}
                </Text>
                <Text style={{ color: "#444", fontSize: 11 }}>
                  {t.category} · {t.date}
                </Text>
              </View>
              <Text
                selectable
                style={{ color: t.type === "income" ? "#34D399" : "#F87171", fontSize: 15, fontWeight: "800", marginRight: 8 }}
              >
                {t.type === "income" ? "+" : "-"}{symbol}{convert(t.amount)}
              </Text>
              <HapticPressable
                onPress={() => openEdit(t)}
                style={{ padding: 6 }}
              >
                <Ionicons name="pencil-outline" size={16} color="#666" />
              </HapticPressable>
              <HapticPressable
                onPress={() => handleDelete(t)}
                style={{ padding: 6 }}
              >
                <Ionicons name="trash-outline" size={16} color="#F87171" />
              </HapticPressable>
            </View>
          );
        })}
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editTx !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeEdit}
      >
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: "#0C0C1A" }}>
          <View style={{ padding: 20, gap: 16, flex: 1 }}>
            {/* Header */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>İşlemi Düzenle</Text>
              <HapticPressable onPress={closeEdit}>
                <Ionicons name="close" size={24} color="#555" />
              </HapticPressable>
            </View>

            {/* Type toggle */}
            <View style={{ flexDirection: "row", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 14, padding: 4, gap: 4 }}>
              {(["expense", "income"] as const).map((tp) => (
                <HapticPressable
                  key={tp}
                  onPress={() => setEditType(tp)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 10,
                    alignItems: "center",
                    backgroundColor: editType === tp ? (tp === "expense" ? "#EF4444" : "#10B981") : "transparent",
                  }}
                >
                  <Text style={{ color: editType === tp ? "#fff" : "#555", fontSize: 13, fontWeight: "700" }}>
                    {tp === "expense" ? "Gider" : "Gelir"}
                  </Text>
                </HapticPressable>
              ))}
            </View>

            {/* Amount */}
            <View style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 16, flexDirection: "row", alignItems: "center", paddingHorizontal: 16 }}>
              <Text style={{ color: "#555", fontSize: 20, fontWeight: "900", marginRight: 8 }}>{symbol}</Text>
              <TextInput
                value={editAmount}
                onChangeText={setEditAmount}
                placeholder="0"
                placeholderTextColor="#333"
                keyboardType="decimal-pad"
                style={{ flex: 1, color: "#fff", fontSize: 32, fontWeight: "800", paddingVertical: 14 }}
              />
            </View>

            {/* Label */}
            <View style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 16, paddingHorizontal: 16 }}>
              <TextInput
                value={editLabel}
                onChangeText={setEditLabel}
                placeholder="Açıklama"
                placeholderTextColor="#444"
                style={{ color: "#fff", fontSize: 15, paddingVertical: 14 }}
              />
            </View>

            {/* Category picker */}
            <View>
              <Text style={{ color: "#555", fontSize: 12, fontWeight: "600", marginBottom: 8, letterSpacing: 0.8, textTransform: "uppercase" }}>Kategori</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {CATEGORIES.map((cat) => {
                  const selected = editCategory.startsWith(cat);
                  const color = colorForCategory(cat);
                  return (
                    <HapticPressable
                      key={cat}
                      onPress={() => setEditCategory(cat)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        borderRadius: 10,
                        backgroundColor: selected ? `${color}22` : "rgba(255,255,255,0.05)",
                        borderWidth: 1,
                        borderColor: selected ? `${color}55` : "rgba(255,255,255,0.08)",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <Ionicons
                        name={iconForCategory(cat)}
                        size={13}
                        color={selected ? color : "#555"}
                      />
                      <Text style={{ color: selected ? color : "#555", fontSize: 12, fontWeight: "600" }}>
                        {cat}
                      </Text>
                    </HapticPressable>
                  );
                })}
              </View>
            </View>

            {/* Save */}
            <HapticPressable
              onPress={handleSave}
              disabled={!editLabel.trim() || !editAmount || saving}
              style={({ pressed }) => ({
                backgroundColor: !editLabel.trim() || !editAmount ? "rgba(255,255,255,0.05)" : pressed ? "#5B21B6" : "#7C3AED",
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: "center",
                marginTop: "auto",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              })}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={18} color={!editLabel.trim() || !editAmount ? "#333" : "#fff"} />
                  <Text style={{ color: !editLabel.trim() || !editAmount ? "#333" : "#fff", fontSize: 16, fontWeight: "800" }}>
                    Kaydet
                  </Text>
                </>
              )}
            </HapticPressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
