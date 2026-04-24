import { Ionicons } from "@expo/vector-icons";

export type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

export function iconForCategory(cat: string): IoniconsName {
  if (cat?.startsWith("Yemek"))     return "restaurant-outline";
  if (cat?.startsWith("Ulaşım"))    return "car-outline";
  if (cat?.startsWith("Eğlence"))   return "film-outline";
  if (cat?.startsWith("Fatura"))    return "receipt-outline";
  if (cat?.startsWith("Alışveriş")) return "bag-handle-outline";
  if (cat?.startsWith("Gelir"))     return "arrow-down-circle-outline";
  if (cat?.startsWith("Sağlık"))    return "medkit-outline";
  return "ellipsis-horizontal-circle-outline";
}

export function colorForCategory(cat: string): string {
  if (cat?.startsWith("Yemek"))     return "#FF6B6B";
  if (cat?.startsWith("Ulaşım"))    return "#4ECDC4";
  if (cat?.startsWith("Eğlence"))   return "#A78BFA";
  if (cat?.startsWith("Fatura"))    return "#FCD34D";
  if (cat?.startsWith("Alışveriş")) return "#FB923C";
  if (cat?.startsWith("Gelir"))     return "#34D399";
  if (cat?.startsWith("Sağlık"))    return "#34D399";
  return "#6B7280";
}
