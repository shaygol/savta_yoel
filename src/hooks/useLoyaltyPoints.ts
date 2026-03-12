import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useLoyaltyBalance = () => {
  return useQuery({
    queryKey: ['loyalty-balance'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return 0;

      const { data, error } = await supabase
        .from('loyalty_points')
        .select('points, transaction_type')
        .eq('user_id', session.user.id);
      
      if (error) throw error;
      
      let balance = 0;
      (data || []).forEach(t => {
        if (t.transaction_type === 'earned') balance += t.points;
        else if (t.transaction_type === 'redeemed') balance -= t.points;
      });
      
      return Math.max(0, balance);
    },
  });
};

export const useLoyaltyHistory = () => {
  return useQuery({
    queryKey: ['loyalty-history'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const { data, error } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });
};
