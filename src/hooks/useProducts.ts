import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category: string;
  inventory: number | null;
  available: boolean | null;
  max_quantity_per_order: number | null;
  description: string | null;
  display_order: number | null;
}

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('available', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as Product[];
    }
  });
};

export const useCategories = (products: Product[] | undefined) => {
  if (!products) return ['הכל'];
  const categories = [...new Set(products.map(p => p.category))];
  return ['הכל', ...categories];
};
