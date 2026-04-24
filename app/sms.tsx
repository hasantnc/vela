import { useState, useCallback } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  PermissionsAndroid,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/lib/firebase/auth";
import { addTransaction } from "@/lib/firebase/firestore";
import { PremiumGate } from "@/components/PremiumGate";
import {
  parseSMSTransaction,
  hasFinancialContent,
} from "@/lib/openai/sms-parse";

// Safe require — Expo Go'da veya web'de çökmez
let SmsAndroid: {
  list: (
    filter: string,
    fail: (e: string) => void,
    success: (count: number, list: string) => void
  ) => void;
} | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  SmsAndroid = require("react-native-get-sms-android").default;
} catch {}

const IS_ANDROID = process.env.EXPO_OS === "android";
const APPROVED_KEY = "vela_approved_sms_ids";
const REJECTED_KEY = "vela_rejected_sms_ids";
const MAX_DAYS = 90;
const MAX_COUNT = 100;
const PARSE_BATCH = 5;

// ─── Types ────────────────────────────────────────────────
type SMSItem = {
  id: string;
  sender: string;
  message: string;
  amount: number;
  category: string;
  emoji: string;
  merchant: string;
  rawDate: number;
  dateLabel: string;
  isExpense: boolean;
  status: "pending" | "approved" | "rejected";
};

type Phase =
  | "idle"
  | "requesting"
  | "reading"
  | "parsing"
  | "ready"
  | "error";

// ─── Helpers ──────────────────────────────────────────────
function dateLabel(tsMs: number): string {
  const diff = Date.now() - tsMs;
  const DAY = 86_400_000;
  const d = new Date(tsMs);
  const hm = `${d.getHours().toString().padStart(2, "0")}:${d
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
  if (diff < DAY) return `Bugün, ${hm}`;
  if (diff < 2 * DAY) return `Dün, ${hm}`;
  return `${Math.floor(diff / DAY)} gün önce`;
}

async function getStoredIds(key: string): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(key);
  return new Set<string>(JSON.parse(raw ?? "[]"));
}

async function addStoredId(key: string, id: string) {
  const set = await getStoredIds(key);
  set.add(id);
  await AsyncStorage.setItem(key, JSON.stringify([...set]));
}

// ─── Screen ───────────────────────────────────────────────
export default function SMSScreen() {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>("idle");
  const [items, setItems] = useState<SMSItem[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [errorMsg, setErrorMsg] = useState("");

  const pending = items.filter((i) => i.status === "pending");
  const approved = items.filter((i) => i.status === "approved");
  const rejected = items.filter((i) => i.status === "rejected");

  // ── Main scan flow ─────────────────────────────────────
  const startScan = useCallback(async () => {
    // Platform checks
    if (!IS_ANDROID) {
      setErrorMsg("Bu özellik yalnızca Android cihazlarda kullanılabilir.");
      setPhase("error");
      return;
    }
    if (!SmsAndroid) {
      setErrorMsg(
        "Gerçek SMS okuma için geliştirici derlemesi gerekli.\n\nTerminalde şunu çalıştır:\n  expo prebuild --platform android\n  expo run:android"
      );
      setPhase("error");
      return;
    }

    // Request permission
    setPhase("requesting");
    let granted: string;
    try {
      granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        {
          title: "SMS Okuma İzni",
          message:
            "VELA, banka SMS'lerini otomatik tespit etmek için okuma iznine ihtiyaç duyuyor.",
          buttonPositive: "İzin Ver",
          buttonNegative: "İptal",
        }
      );
    } catch {
      setErrorMsg("İzin alınırken hata oluştu.");
      setPhase("error");
      return;
    }

    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      setErrorMsg("SMS okuma izni reddedildi.");
      setPhase("error");
      return;
    }

    // Read SMS from device
    setPhase("reading");
    const minDate = Date.now() - MAX_DAYS * 86_400_000;

    type RawSms = { _id: string; address: string; body: string; date: string };
    const rawList: RawSms[] = await new Promise((resolve) => {
      SmsAndroid!.list(
        JSON.stringify({ box: "inbox", minDate, maxCount: MAX_COUNT }),
        () => resolve([]),
        (_count, smsList) => {
          try {
            resolve(JSON.parse(smsList));
          } catch {
            resolve([]);
          }
        }
      );
    });

    // Filter: unprocessed + financial content
    const [approvedIds, rejectedIds] = await Promise.all([
      getStoredIds(APPROVED_KEY),
      getStoredIds(REJECTED_KEY),
    ]);

    const candidates = rawList.filter(
      (sms) =>
        !approvedIds.has(sms._id) &&
        !rejectedIds.has(sms._id) &&
        hasFinancialContent(sms.body)
    );

    if (candidates.length === 0) {
      setItems([]);
      setPhase("ready");
      return;
    }

    // Parse with OpenAI in batches
    setPhase("parsing");
    setProgress({ current: 0, total: candidates.length });

    const parsed: SMSItem[] = [];

    for (let i = 0; i < candidates.length; i += PARSE_BATCH) {
      const batch = candidates.slice(i, i + PARSE_BATCH);
      const results = await Promise.all(
        batch.map(async (sms) => {
          const result = await parseSMSTransaction(sms.body, sms.address);
          setProgress((p) => ({ ...p, current: p.current + 1 }));
          if (!result) return null;
          const item: SMSItem = {
            id: sms._id,
            sender: sms.address,
            message: sms.body,
            amount: result.amount,
            category: result.category,
            emoji: result.emoji,
            merchant: result.merchant,
            rawDate: Number(sms.date),
            dateLabel: dateLabel(Number(sms.date)),
            isExpense: result.isExpense,
            status: "pending",
          };
          return item;
        })
      );
      parsed.push(...(results.filter(Boolean) as SMSItem[]));
    }

    parsed.sort((a, b) => b.rawDate - a.rawDate);
    setItems(parsed);
    setPhase("ready");
  }, []);

  // ── Approve / Reject ───────────────────────────────────
  const handle = async (id: string, newStatus: "approved" | "rejected") => {
    const item = items.find((i) => i.id === id);
    if (!item || item.status !== "pending") return;

    // Optimistic
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i))
    );

    await addStoredId(
      newStatus === "approved" ? APPROVED_KEY : REJECTED_KEY,
      id
    );

    if (newStatus === "approved" && user) {
      const now = new Date();
      await addTransaction(user.uid, {
        type: item.isExpense ? "expense" : "income",
        amount: item.amount,
        label: item.merchant,
        emoji: item.emoji,
        category: item.category,
        date: now.toISOString().split("T")[0],
        time: `${now.getHours().toString().padStart(2, "0")}:${now
          .getMinutes()
          .toString()
          .padStart(2, "0")}`,
        description: item.message,
      });
    }
  };

  const approveAll = async () => {
    for (const item of pending) {
      await handle(item.id, "approved");
    }
  };

  // ── Phase: idle ────────────────────────────────────────
  if (phase === "idle") {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#06060F",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
          gap: 20,
        }}
      >
        <Text style={{ fontSize: 52 }}>📩</Text>
        <Text
          style={{
            color: "#fff",
            fontSize: 22,
            fontWeight: "800",
            textAlign: "center",
          }}
        >
          SMS'leri Tara
        </Text>
        <Text
          style={{
            color: "#555",
            fontSize: 14,
            textAlign: "center",
            lineHeight: 22,
          }}
        >
          Son {MAX_DAYS} günün banka SMS'lerini okuyarak harcamalarını AI ile
          otomatik tespit eder.
        </Text>
        <Pressable
          onPress={startScan}
          style={({ pressed }) => ({
            backgroundColor: pressed
              ? "rgba(139,92,246,0.25)"
              : "rgba(139,92,246,0.12)",
            borderWidth: 1,
            borderColor: "rgba(139,92,246,0.4)",
            borderRadius: 18,
            borderCurve: "continuous",
            paddingVertical: 16,
            paddingHorizontal: 48,
          })}
        >
          <Text style={{ color: "#8B5CF6", fontSize: 16, fontWeight: "700" }}>
            Tara
          </Text>
        </Pressable>
      </View>
    );
  }

  // ── Phase: requesting ──────────────────────────────────
  if (phase === "requesting") {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#06060F",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <ActivityIndicator color="#8B5CF6" size="large" />
        <Text style={{ color: "#555", fontSize: 14 }}>İzin bekleniyor…</Text>
      </View>
    );
  }

  // ── Phase: reading ─────────────────────────────────────
  if (phase === "reading") {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#06060F",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
        }}
      >
        <ActivityIndicator color="#8B5CF6" size="large" />
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
          SMS'ler okunuyor
        </Text>
        <Text style={{ color: "#555", fontSize: 13 }}>
          Son {MAX_DAYS} günün mesajları taranıyor…
        </Text>
      </View>
    );
  }

  // ── Phase: parsing ─────────────────────────────────────
  if (phase === "parsing") {
    const pct =
      progress.total > 0
        ? Math.round((progress.current / progress.total) * 100)
        : 0;
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#06060F",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          padding: 32,
        }}
      >
        <Text style={{ fontSize: 42 }}>🤖</Text>
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>
          AI Analiz Ediyor
        </Text>
        <Text style={{ color: "#555", fontSize: 13 }}>
          {progress.current} / {progress.total} SMS işlendi
        </Text>
        <View
          style={{
            width: "100%",
            height: 4,
            backgroundColor: "rgba(255,255,255,0.06)",
            borderRadius: 2,
          }}
        >
          <View
            style={{
              width: `${pct}%`,
              height: 4,
              backgroundColor: "#8B5CF6",
              borderRadius: 2,
            }}
          />
        </View>
        <Text style={{ color: "#444", fontSize: 12 }}>{pct}%</Text>
      </View>
    );
  }

  // ── Phase: error ───────────────────────────────────────
  if (phase === "error") {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#06060F",
          alignItems: "center",
          justifyContent: "center",
          padding: 28,
          gap: 18,
        }}
      >
        <Text style={{ fontSize: 42 }}>⚠️</Text>
        <Text
          style={{
            color: "#F87171",
            fontSize: 15,
            fontWeight: "700",
            textAlign: "center",
            lineHeight: 24,
          }}
        >
          {errorMsg}
        </Text>
        <Pressable
          onPress={() => {
            setErrorMsg("");
            setPhase("idle");
          }}
          style={{ paddingVertical: 10, paddingHorizontal: 24 }}
        >
          <Text style={{ color: "#8B5CF6", fontSize: 14, fontWeight: "600" }}>
            ← Geri Dön
          </Text>
        </Pressable>
      </View>
    );
  }

  // ── Phase: ready ───────────────────────────────────────
  return (
    <PremiumGate feature="SMS otomasyonu">
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: "#06060F" }}
      contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 50 }}
    >
      {/* Stats */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <StatCard value={pending.length} label="Bekleyen" color="#8B5CF6" bg="rgba(139,92,246,0.08)" border="rgba(139,92,246,0.2)" />
        <StatCard value={approved.length} label="Onaylanan" color="#34D399" bg="rgba(52,211,153,0.06)" border="rgba(52,211,153,0.15)" />
        <StatCard value={rejected.length} label="Reddedilen" color="#F87171" bg="rgba(248,113,113,0.06)" border="rgba(248,113,113,0.15)" />
      </View>

      {/* Approve all */}
      {pending.length > 0 && (
        <Pressable
          onPress={approveAll}
          style={({ pressed }) => ({
            backgroundColor: pressed
              ? "rgba(52,211,153,0.15)"
              : "rgba(52,211,153,0.08)",
            borderWidth: 1,
            borderColor: "rgba(52,211,153,0.25)",
            borderRadius: 14,
            borderCurve: "continuous",
            paddingVertical: 12,
            alignItems: "center",
          })}
        >
          <Text style={{ color: "#34D399", fontSize: 14, fontWeight: "700" }}>
            ✓ Tümünü Onayla ({pending.length})
          </Text>
        </Pressable>
      )}

      {/* Pending */}
      {pending.length > 0 && (
        <Section label="Bekleyen SMS'ler">
          {pending.map((item) => (
            <SMSCard
              key={item.id}
              item={item}
              onApprove={() => handle(item.id, "approved")}
              onReject={() => handle(item.id, "rejected")}
            />
          ))}
        </Section>
      )}

      {/* Approved */}
      {approved.length > 0 && (
        <Section label="Onaylananlar">
          {approved.map((item) => (
            <SMSCard
              key={item.id}
              item={item}
              onApprove={() => handle(item.id, "approved")}
              onReject={() => handle(item.id, "rejected")}
            />
          ))}
        </Section>
      )}

      {/* Rejected */}
      {rejected.length > 0 && (
        <Section label="Reddedilenler">
          {rejected.map((item) => (
            <SMSCard
              key={item.id}
              item={item}
              onApprove={() => handle(item.id, "approved")}
              onReject={() => handle(item.id, "rejected")}
            />
          ))}
        </Section>
      )}

      {/* Empty */}
      {items.length === 0 && (
        <View
          style={{ alignItems: "center", paddingTop: 60, gap: 14 }}
        >
          <Text style={{ fontSize: 42 }}>📭</Text>
          <Text style={{ color: "#555", fontSize: 15, fontWeight: "600" }}>
            Yeni finansal SMS bulunamadı
          </Text>
          <Text
            style={{
              color: "#444",
              fontSize: 12,
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            Daha önce onayladığın veya reddettiğin SMS'ler{"\n"}tekrar gösterilmez.
          </Text>
          <Pressable
            onPress={() => setPhase("idle")}
            style={{ paddingVertical: 10, paddingHorizontal: 24 }}
          >
            <Text style={{ color: "#8B5CF6", fontSize: 13 }}>
              Tekrar Tara
            </Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
    </PremiumGate>
  );
}

// ─── Sub-components ───────────────────────────────────────

function StatCard({
  value,
  label,
  color,
  bg,
  border,
}: {
  value: number;
  label: string;
  color: string;
  bg: string;
  border: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: border,
        borderRadius: 16,
        borderCurve: "continuous",
        padding: 14,
        alignItems: "center",
        gap: 4,
      }}
    >
      <Text style={{ color, fontSize: 22, fontWeight: "800" }}>{value}</Text>
      <Text style={{ color: "#666", fontSize: 11 }}>{label}</Text>
    </View>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: 10 }}>
      <Text
        style={{
          color: "#444",
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 1,
          textTransform: "uppercase",
          paddingLeft: 4,
        }}
      >
        {label}
      </Text>
      {children}
    </View>
  );
}

function SMSCard({
  item,
  onApprove,
  onReject,
}: {
  item: SMSItem;
  onApprove: () => void;
  onReject: () => void;
}) {
  const isPending = item.status === "pending";
  const isApproved = item.status === "approved";

  return (
    <View
      style={{
        backgroundColor: isApproved
          ? "rgba(52,211,153,0.05)"
          : item.status === "rejected"
          ? "rgba(248,113,113,0.05)"
          : "rgba(255,255,255,0.03)",
        borderWidth: 1,
        borderColor: isApproved
          ? "rgba(52,211,153,0.15)"
          : item.status === "rejected"
          ? "rgba(248,113,113,0.15)"
          : "rgba(255,255,255,0.08)",
        borderRadius: 18,
        borderCurve: "continuous",
        padding: 14,
        gap: 12,
      }}
    >
      {/* Top row */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            backgroundColor: "rgba(255,255,255,0.06)",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Text style={{ fontSize: 22 }}>{item.emoji}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}
              numberOfLines={1}
            >
              {item.merchant}
            </Text>
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "800" }}>
              {item.isExpense ? "-" : "+"}₺
              {item.amount.toLocaleString("tr-TR", {
                minimumFractionDigits: 2,
              })}
            </Text>
          </View>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text style={{ color: "#555", fontSize: 12 }}>
              {item.category} · {item.sender}
            </Text>
            <Text style={{ color: "#444", fontSize: 11 }}>
              {item.dateLabel}
            </Text>
          </View>
        </View>
      </View>

      {/* SMS body */}
      <Text
        style={{
          color: "#555",
          fontSize: 12,
          lineHeight: 18,
          backgroundColor: "rgba(255,255,255,0.03)",
          borderRadius: 10,
          padding: 10,
        }}
        numberOfLines={3}
      >
        {item.message}
      </Text>

      {/* Actions */}
      {isPending ? (
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable
            onPress={onReject}
            style={({ pressed }) => ({
              flex: 1,
              backgroundColor: pressed
                ? "rgba(248,113,113,0.2)"
                : "rgba(248,113,113,0.08)",
              borderWidth: 1,
              borderColor: "rgba(248,113,113,0.25)",
              borderRadius: 12,
              borderCurve: "continuous",
              paddingVertical: 10,
              alignItems: "center",
            })}
          >
            <Text
              style={{ color: "#F87171", fontSize: 14, fontWeight: "700" }}
            >
              ✕ Reddet
            </Text>
          </Pressable>
          <Pressable
            onPress={onApprove}
            style={({ pressed }) => ({
              flex: 1,
              backgroundColor: pressed
                ? "rgba(52,211,153,0.2)"
                : "rgba(52,211,153,0.08)",
              borderWidth: 1,
              borderColor: "rgba(52,211,153,0.25)",
              borderRadius: 12,
              borderCurve: "continuous",
              paddingVertical: 10,
              alignItems: "center",
            })}
          >
            <Text
              style={{ color: "#34D399", fontSize: 14, fontWeight: "700" }}
            >
              ✓ Onayla
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ alignItems: "center" }}>
          <Text
            style={{
              color: isApproved ? "#34D399" : "#F87171",
              fontSize: 12,
              fontWeight: "700",
            }}
          >
            {isApproved
              ? "✓ Onaylandı — işleme eklendi"
              : "✕ Reddedildi"}
          </Text>
        </View>
      )}
    </View>
  );
}
