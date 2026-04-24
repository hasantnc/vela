import * as Sharing from "expo-sharing";
import { getDocs, collection, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Transaction } from "@/types";
import * as FileSystem from "expo-file-system/legacy";

function toDate(val: any): string {
  if (!val) return "";
  try {
    if (typeof val.toDate === "function") return val.toDate().toLocaleDateString("tr-TR");
    return new Date(val).toLocaleDateString("tr-TR");
  } catch {
    return "";
  }
}

export async function exportTransactionsCSV(uid: string): Promise<void> {
  const q = query(
    collection(db, "users", uid, "transactions"),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);
  const txs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction));

  const lines: string[] = ["Tarih,Tür,Tutar,Kategori,Açıklama"];

  for (const t of txs) {
    const date = toDate(t.createdAt);
    const type = t.type === "income" ? "Gelir" : "Gider";
    const amount = String(t.amount ?? 0);
    const category = '"' + (t.category ?? "").replace(/"/g, '""') + '"';
    const desc = '"' + ((t.description ?? (t as any).label ?? "")).replace(/"/g, '""') + '"';
    lines.push([date, type, amount, category, desc].join(","));
  }

  const csv = lines.join("\n");
  const fileUri = FileSystem.documentDirectory + "vela-islemler.csv";

  await FileSystem.writeAsStringAsync(fileUri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error("Paylaşım bu cihazda desteklenmiyor");
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: "text/csv",
    dialogTitle: "CSV Dışa Aktar",
    UTI: "public.comma-separated-values-text",
  });
}