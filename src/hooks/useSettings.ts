import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Settings {
  business_name?: string;
  business_slogan?: string;
  contact_person_name?: string;
  contact_phone?: string;
  menu_description?: string;
  logo_url?: string;
  weekly_ordering_schedule?: Record<string, {
    enabled: boolean;
    start: string;
    end: string;
    always_open: boolean;
  }>;
  footer_section_text?: string;
  primary_color?: string;
  business_address?: string;
  hero_section_text?: string;
  hero_image_url?: string;
  hero_images?: string[];
  paybox_url?: string;
  paybox_enabled?: boolean;
  bit_enabled?: boolean;
  bit_payment_url?: string;
  site_enabled?: boolean;
  tray_discount_config?: Record<string, {
    capacity?: number;
    minItems?: number;
    discountPercent?: number;
  }>;
}

export const useSettings = () => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value');
      
      if (error) throw error;
      
      const settings: Record<string, unknown> = {};
      data?.forEach(row => {
        const value = row.value;
        // Handle JSON values - remove extra quotes if present
        if (typeof value === 'string') {
          settings[row.key] = value.replace(/^"|"$/g, '');
        } else {
          settings[row.key] = value;
        }
      });
      
      return settings as Settings;
    }
  });
};

export const useIsOrderingOpen = (settings: Settings | undefined) => {
  if (!settings?.weekly_ordering_schedule) return true;
  
  const now = new Date();
  const dayOfWeek = now.getDay().toString();
  const schedule = settings.weekly_ordering_schedule[dayOfWeek];
  
  if (!schedule?.enabled) return false;
  if (schedule.always_open) return true;
  
  const currentTime = now.toTimeString().slice(0, 5);
  return currentTime >= schedule.start && currentTime <= schedule.end;
};
