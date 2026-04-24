export const fmt = (n: number) =>
  new Intl.NumberFormat('tr-TR').format(Math.round(n));

export const fmtCurrency = (n: number, currency: 'TRY' | 'USD' = 'TRY') =>
  currency === 'TRY' ? `₺${fmt(n)}` : `$${n.toFixed(2)}`;

export const fmtDate = (date: Date) =>
  new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short' }).format(date);