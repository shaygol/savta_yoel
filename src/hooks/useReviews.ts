import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profile_name?: string;
}

export const useProductReviews = (productId: string | null) => {
  return useQuery({
    queryKey: ['reviews', productId],
    enabled: !!productId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      // Fetch profile names for reviewers
      const userIds = [...new Set((data || []).map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', userIds);
      
      const nameMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);
      
      return (data || []).map(r => ({
        ...r,
        profile_name: nameMap.get(r.user_id) || 'אנונימי',
      })) as Review[];
    },
  });
};

export const useProductRatingSummary = (products: { id: string }[] | undefined) => {
  return useQuery({
    queryKey: ['reviews-summary'],
    enabled: !!products && products.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('product_id, rating');
      if (error) throw error;
      
      const summary: Record<string, { avg: number; count: number }> = {};
      const grouped: Record<string, number[]> = {};
      
      (data || []).forEach(r => {
        if (!grouped[r.product_id]) grouped[r.product_id] = [];
        grouped[r.product_id].push(r.rating);
      });
      
      Object.entries(grouped).forEach(([pid, ratings]) => {
        summary[pid] = {
          avg: ratings.reduce((a, b) => a + b, 0) / ratings.length,
          count: ratings.length,
        };
      });
      
      return summary;
    },
  });
};

export const useAddReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, rating, comment }: { productId: string; rating: number; comment: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('יש להתחבר כדי לכתוב ביקורת');
      
      const { error } = await supabase.from('reviews').insert({
        product_id: productId,
        user_id: session.user.id,
        rating,
        comment: comment || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['reviews-summary'] });
    },
  });
};
