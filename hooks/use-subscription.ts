import { useUserStore } from '@/store/user-store';

export const useSubscription = () => {
  const { user } = useUserStore();
  const isPro = user?.subscriptionStatus === 'pro';
  const currency = user?.currency ?? 'TRY';
  const price = currency === 'TRY' ? '₺149/ay' : '$4.99/mo';

  return { isPro, currency, price };
};