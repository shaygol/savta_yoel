import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  current_uses: number;
  active: boolean;
  expires_at: string | null;
  created_at: string;
}

export const useAdminCoupons = () => {
  return useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Coupon[];
    },
  });
};

export const useValidateCoupon = () => {
  return useMutation({
    mutationFn: async ({ code, orderAmount }: { code: string; orderAmount: number }) => {
      const { data, error } = await supabase.rpc('validate_coupon', {
        _code: code,
        _order_amount: orderAmount,
      });
      if (error) throw error;
      const result = (data as any)?.[0] || data;
      if (!result?.valid) {
        throw new Error(result?.error_message || 'קופון לא תקין');
      }
      return result as { valid: boolean; coupon_id: string; discount_type: string; discount_value: number };
    },
  });
};
