// ─── GENEL ───────────────────────────────────────────────────────────────────

export const fmt = (n: number) =>
    new Intl.NumberFormat("tr-TR").format(Math.round(n));
  
  // ─── STREAK ──────────────────────────────────────────────────────────────────
  
  export const STREAK_WEEK = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
  export const STREAK_DONE = [true, true, true, true, true, false, false];
  
  export const STREAK_MILESTONES = [
    { days: 7,  emoji: "🥉", label: "Bronz", color: "#CD7F32", done: true  },
    { days: 14, emoji: "🥈", label: "Gümüş", color: "#C0C0C0", done: false },
    { days: 30, emoji: "🥇", label: "Altın", color: "#FFD700", done: false },
    { days: 90, emoji: "💎", label: "Elmas", color: "#06B6D4", done: false },
  ];
  
  export const STREAK_STATS = [
    { label: "Bu Ayki Seri",  value: "12 gün", emoji: "🔥", color: "#F59E0B" },
    { label: "En İyi Seri",   value: "23 gün", emoji: "⭐", color: "#8B5CF6" },
    { label: "Toplam Başarı", value: "34 gün", emoji: "✅", color: "#34D399" },
    { label: "Kaçırılan",     value: "8 gün",  emoji: "💔", color: "#F87171" },
  ];
  
  export const STREAK_CURRENT = 12;
  export const STREAK_BEST    = 23;
  
  // ─── BADGES ──────────────────────────────────────────────────────────────────
  
  export const BADGES = [
    { id: "streak7",   emoji: "🔥", title: "7 Günlük Seri",         desc: "7 gün üst üste limite uydun",          earned: true,  date: "15 Oca", rarity: "common",    color: "#F59E0B" },
    { id: "streak30",  emoji: "⚡", title: "30 Günlük Disiplin",    desc: "30 gün boyunca limitini aşmadın",      earned: true,  date: "10 Oca", rarity: "rare",      color: "#8B5CF6" },
    { id: "nosub",     emoji: "✂️", title: "Abonelik Katili",       desc: "2 kullanılmayan aboneliği iptal ettin", earned: true,  date: "5 Oca",  rarity: "common",    color: "#EF4444" },
    { id: "community", emoji: "👥", title: "Topluluk Yıldızı",      desc: "Topluluk ortalamasının altına indın",   earned: true,  date: "1 Oca",  rarity: "common",    color: "#3B82F6" },
    { id: "ai",        emoji: "🤖", title: "AI Dostu",              desc: "AI analizini 10 kez kullandın",         earned: true,  date: "20 Ara", rarity: "common",    color: "#8B5CF6" },
    { id: "saver",     emoji: "🏆", title: "Tasarruf Ustası",       desc: "Bir ayda ₺5.000 tasarruf ettin",       earned: false, date: null,     rarity: "epic",      color: "#F59E0B" },
    { id: "master",    emoji: "💎", title: "Finansal Usta",         desc: "3 ay üst üste hedefini tuttur",         earned: false, date: null,     rarity: "legendary", color: "#06B6D4" },
    { id: "payday",    emoji: "📅", title: "Maaş Günü Planlayıcı",  desc: "Maaş günü bütçeni 5 kez ayarladın",    earned: false, date: null,     rarity: "rare",      color: "#10B981" },
  ];
  
  export const BADGE_RARITY: Record<string, string> = {
    common: "Yaygın",
    rare: "Nadir",
    epic: "Epik",
    legendary: "Efsanevi",
  };
  
  export const BADGE_LEVELS = [
    { level: 1, label: "Çaylak",    xp: 0,    maxXp: 100,  color: "#6B7280" },
    { level: 2, label: "Başlangıç", xp: 100,  maxXp: 300,  color: "#34D399" },
    { level: 3, label: "Orta",      xp: 300,  maxXp: 600,  color: "#3B82F6" },
    { level: 4, label: "İleri",     xp: 600,  maxXp: 1000, color: "#8B5CF6" },
    { level: 5, label: "Usta",      xp: 1000, maxXp: 2000, color: "#F59E0B" },
  ];
  
  export const BADGE_CURRENT_XP    = 420;
  export const BADGE_CURRENT_LEVEL = BADGE_LEVELS[2];
  export const BADGE_NEXT_LEVEL    = BADGE_LEVELS[3];
  
  export const BADGE_XP_ACTIONS = [
    { action: "Günlük limite uy",  xp: "+10 XP" },
    { action: "SMS onayla",        xp: "+5 XP"  },
    { action: "Hedef tamamla",     xp: "+50 XP" },
    { action: "Rozet kazan",       xp: "+25 XP" },
    { action: "Abonelik iptal et", xp: "+15 XP" },
  ];
  
  // ─── REGRET ──────────────────────────────────────────────────────────────────
  
  export type RegretItem = {
    id: number;
    emoji: string;
    label: string;
    amount: number;
    date: string;
    time: string;
    score: number | null;
  };
  
  export const REGRET_INITIAL: RegretItem[] = [
    { id: 1, emoji: "☕", label: "Starbucks",  amount: 450, date: "28 Oca", time: "08:22", score: null },
    { id: 2, emoji: "🚕", label: "Uber",       amount: 540, date: "22 Oca", time: "23:45", score: null },
    { id: 3, emoji: "👕", label: "Zara",       amount: 680, date: "24 Oca", time: "16:20", score: 3    },
    { id: 4, emoji: "🍔", label: "McDonald's", amount: 175, date: "23 Oca", time: "13:10", score: 5    },
    { id: 5, emoji: "📺", label: "Netflix",    amount: 149, date: "26 Oca", time: "00:01", score: 4    },
  ];
  
  export const REGRET_EMOJIS = ["😤", "😕", "😐", "🙂", "😊"];
  
  export const regretScoreColor = (s: number) =>
    s >= 4 ? "#34D399" : s >= 3 ? "#F59E0B" : "#F87171";
  
  export const regretScoreLabel = (s: number) =>
    s >= 4 ? "Değdi ✓" : s >= 3 ? "Orta" : "Pişman 😔";
  
  // ─── PAYDAY ──────────────────────────────────────────────────────────────────
  
  export const PAYDAY_BUDGET_ITEMS = [
    { key: "kira",     label: "Kira & Fatura", emoji: "🏠", color: "#F87171", default: 6000 },
    { key: "hedefler", label: "Hedefler",      emoji: "🎯", color: "#8B5CF6", default: 3000 },
    { key: "yemek",    label: "Yemek",         emoji: "🍽️", color: "#FF6B6B", default: 3000 },
    { key: "ulasim",   label: "Ulaşım",        emoji: "🚇", color: "#4ECDC4", default: 1000 },
    { key: "eglence",  label: "Eğlence",       emoji: "🎬", color: "#A78BFA", default: 1000 },
    { key: "diger",    label: "Diğer",         emoji: "📦", color: "#6B7280", default: 1500 },
  ];
  
  export const PAYDAY_STEP        = 250;
  export const PAYDAY_MAX         = 15000;
  export const PAYDAY_DAYS_LEFT   = 3;
  export const PAYDAY_DEFAULT_SALARY = "18500";
  
  // ─── CURRENCY ────────────────────────────────────────────────────────────────
  
  export const CURRENCY_RATES: Record<string, number> = {
    USD: 0.0313,
    EUR: 0.0287,
    GBP: 0.0247,
    ALTIN: 1.82,
  };
  
  export const CURRENCY_LABELS: Record<string, string> = {
    USD: "🇺🇸 Dolar",
    EUR: "🇪🇺 Euro",
    GBP: "🇬🇧 Sterlin",
    ALTIN: "🥇 Gram Altın",
  };
  
  export const CURRENCY_INCOME  = 20500;
  export const CURRENCY_EXPENSE = 8652;
  
  export const CURRENCY_HISTORY = [
    { month: "Ekim", usdVal: 580 },
    { month: "Kas",  usdVal: 576 },
    { month: "Ara",  usdVal: 562 },
    { month: "Oca",  usdVal: 580 },
  ];
  
  // ─── HISTORY ─────────────────────────────────────────────────────────────────
  
  export type Transaction = {
    id: number;
    type: "income" | "expense";
    amount: number;
    label: string;
    emoji: string;
    date: string;
    category: string;
    time: string;
  };
  
  export const TRANSACTIONS: Transaction[] = [
    { id: 1,  type: "income",  amount: 18500, label: "Maaş",         emoji: "💰", date: "01 Oca", category: "Gelir",              time: "09:00" },
    { id: 2,  type: "expense", amount: 450,   label: "Starbucks",    emoji: "☕", date: "28 Oca", category: "Yemek › Kahve",      time: "08:22" },
    { id: 3,  type: "expense", amount: 1240,  label: "Migros",       emoji: "🛒", date: "27 Oca", category: "Yemek › Market",     time: "19:15" },
    { id: 4,  type: "expense", amount: 89,    label: "İstanbulkart", emoji: "🚌", date: "27 Oca", category: "Ulaşım › Metro",     time: "07:45" },
    { id: 5,  type: "expense", amount: 149,   label: "Netflix",      emoji: "📺", date: "26 Oca", category: "Eğlence › Abonelik", time: "00:01" },
    { id: 6,  type: "expense", amount: 2380,  label: "Elektrik",     emoji: "⚡", date: "25 Oca", category: "Fatura › Elektrik",  time: "14:30" },
    { id: 7,  type: "expense", amount: 680,   label: "Zara",         emoji: "👕", date: "24 Oca", category: "Alışveriş › Giyim",  time: "16:20" },
    { id: 8,  type: "income",  amount: 2000,  label: "Freelance",    emoji: "💼", date: "23 Oca", category: "Gelir",              time: "11:00" },
    { id: 9,  type: "expense", amount: 175,   label: "McDonald's",   emoji: "🍔", date: "23 Oca", category: "Yemek › Fast Food",  time: "13:10" },
    { id: 10, type: "expense", amount: 540,   label: "Uber",         emoji: "🚕", date: "22 Oca", category: "Ulaşım › Taksi",     time: "23:45" },
  ];
  
  // ─── SMS ─────────────────────────────────────────────────────────────────────
  
  export type SMSItem = {
    id: number;
    raw: string;
    parsed: { label: string; amount: number; cat: string; emoji: string };
  };
  
  export const SMS_INITIAL: SMSItem[] = [
    { id: 1, raw: "Garanti'den 47.50 TL harcama - Starbucks 08:22", parsed: { label: "Starbucks", amount: 47.5, cat: "Yemek › Kahve",  emoji: "☕" } },
    { id: 2, raw: "İşbank'tan 1.240 TL harcama - Migros 19:15",    parsed: { label: "Migros",    amount: 1240, cat: "Yemek › Market", emoji: "🛒" } },
    { id: 3, raw: "YKB'den 540 TL harcama - UBER 23:45",           parsed: { label: "Uber",      amount: 540,  cat: "Ulaşım › Taksi", emoji: "🚕" } },
  ];