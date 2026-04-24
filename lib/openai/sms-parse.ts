const OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_KEY;

export type ParsedSMS = {
  amount: number;
  merchant: string;
  category: string;
  emoji: string;
  isExpense: boolean;
};

const FINANCIAL_REGEX =
  /\d[\d.,]*\s*(?:TL|₺)|harcama|ödeme|tahsilat|alışveriş|pos\s*işlem|bakiye|para\s*transferi/i;

export function hasFinancialContent(body: string): boolean {
  return FINANCIAL_REGEX.test(body);
}

export async function parseSMSTransaction(
  body: string,
  sender: string
): Promise<ParsedSMS | null> {
  if (!OPENAI_KEY || !hasFinancialContent(body)) return null;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 80,
        temperature: 0,
        messages: [
          {
            role: "system",
            content: `Türk bankacılık SMS analiz asistanısın. SMS'ten finansal işlem bilgisi çıkar.
Sadece JSON döndür, başka hiçbir şey yazma.
Eğer SMS finansal bir işlem değilse tam olarak şunu döndür: null
Format: {"amount":sayı,"merchant":"yer adı","category":"kategori","emoji":"emoji","isExpense":boolean}
Kategoriler: Yemek, Kahve, Market, Ulaşım, Taksi, Eğlence, Abonelik, Fatura, Alışveriş, Sağlık, Gelir, Diğer
isExpense: harcama/gider=true, gelir/iade/transfer=false`,
          },
          {
            role: "user",
            content: `Gönderen: ${sender}\nMesaj: ${body}`,
          },
        ],
      }),
    });

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text || text === "null") return null;

    const parsed = JSON.parse(text) as ParsedSMS;
    if (parsed && typeof parsed.amount === "number" && parsed.amount > 0) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
