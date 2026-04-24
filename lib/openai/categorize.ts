const OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_KEY;

export type AICategory = {
  category: string;
  emoji: string;
};

const CATEGORIES = [
  { category: "Yemek", emoji: "🍽️" },
  { category: "Kahve", emoji: "☕" },
  { category: "Market", emoji: "🛒" },
  { category: "Ulaşım", emoji: "🚌" },
  { category: "Taksi", emoji: "🚕" },
  { category: "Eğlence", emoji: "🎬" },
  { category: "Abonelik", emoji: "📺" },
  { category: "Fatura", emoji: "⚡" },
  { category: "Alışveriş", emoji: "👕" },
  { category: "Sağlık", emoji: "💊" },
  { category: "Gelir", emoji: "💰" },
  { category: "Diğer", emoji: "📦" },
];

export const categorize = async (label: string): Promise<AICategory> => {
  const fallback: AICategory = { category: "Diğer", emoji: "📦" };
  if (!label.trim()) return fallback;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 30,
        messages: [
          {
            role: "system",
            content: `Sen bir finansal kategorizasyon asistanısın. Kullanıcı bir harcama/gelir adı verir, sen sadece JSON formatında kategori ve emoji döndürürsün. Kategoriler: ${CATEGORIES.map((c) => c.category).join(", ")}. Sadece şu formatta yanıt ver: {"category":"...","emoji":"..."}`,
          },
          {
            role: "user",
            content: label,
          },
        ],
      }),
    });

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) return fallback;

    const parsed = JSON.parse(text) as AICategory;
    if (parsed.category && parsed.emoji) return parsed;
    return fallback;
  } catch {
    return fallback;
  }
};