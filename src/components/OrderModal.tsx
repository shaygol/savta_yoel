import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { useSettings } from "@/hooks/useSettings";
import { useValidateCoupon } from "@/hooks/useCoupons";
import { useLoyaltyBalance } from "@/hooks/useLoyaltyPoints";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { z } from "zod";
import { Tag, Award, X } from "lucide-react";
import ThankYouModal from "./ThankYouModal";

const orderSchema = z.object({
  name: z.string().min(2, "שם חייב להכיל לפחות 2 תווים").max(100),
  phone: z.string().regex(/^0\d{9}$/, "מספר טלפון לא תקין (10 ספרות)"),
  notes: z.string().max(500).optional(),
});

interface TrayLayoutData {
  traySize: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    image_url?: string | null;
    positions?: Array<{ x: number; y: number }>;
  }>;
}

interface OrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trayLayout?: TrayLayoutData | null;
}

const OrderModal = ({ open, onOpenChange, trayLayout }: OrderModalProps) => {
  const { items, totalAmount, clearCart } = useCart();
  const { data: settings } = useSettings();
  const validateCoupon = useValidateCoupon();
  const { data: loyaltyBalance } = useLoyaltyBalance();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showThankYou, setShowThankYou] = useState(false);
  const [savedAmount, setSavedAmount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ coupon_id: string; discount_type: string; discount_value: number } | null>(null);
  const [usePoints, setUsePoints] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);

  const couponDiscount = appliedCoupon
    ? appliedCoupon.discount_type === "percentage"
      ? Math.round(totalAmount * appliedCoupon.discount_value / 100)
      : Math.min(appliedCoupon.discount_value, totalAmount)
    : 0;

  const pointsDiscount = usePoints ? Math.min(pointsToRedeem, totalAmount - couponDiscount) : 0;
  const finalAmount = Math.max(0, totalAmount - couponDiscount - pointsDiscount);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        const { data: profile } = await supabase.from("profiles").select("name, phone").eq("user_id", session.user.id).maybeSingle();
        if (profile) {
          if (profile.name) setName(profile.name);
          if (profile.phone) setPhone(profile.phone);
        }
      }
    };
    if (open) {
      loadProfile();
      setAppliedCoupon(null);
      setCouponCode("");
      setUsePoints(false);
      setPointsToRedeem(0);
    }
  }, [open]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const result = await validateCoupon.mutateAsync({ code: couponCode, orderAmount: totalAmount });
      setAppliedCoupon({ coupon_id: result.coupon_id, discount_type: result.discount_type, discount_value: result.discount_value });
      toast.success("הקופון הופעל!");
    } catch (err: any) {
      toast.error(err.message || "קופון לא תקין");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = orderSchema.safeParse({ name, phone, notes });
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach(err => { if (err.path[0]) fieldErrors[err.path[0] as string] = err.message; });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const orderItems = items.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity }));

      // Only include tray_layout if it has items
      const hasTrayLayout = trayLayout && trayLayout.items && trayLayout.items.length > 0;

      const { error } = await supabase.from('orders').insert({
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        items: orderItems,
        total_amount: totalAmount,
        notes: [
          notes.trim(),
          appliedCoupon ? `קופון: ${couponCode.toUpperCase()} (-₪${couponDiscount})` : "",
          pointsDiscount > 0 ? `נקודות: -₪${pointsDiscount}` : "",
        ].filter(Boolean).join(" | ") || null,
        status: 'pending',
        payment_status: 'unpaid',
        ...(hasTrayLayout ? { tray_layout: trayLayout as any } : {}),
      });

      if (error) throw error;

      if (appliedCoupon) {
        const { data: couponData } = await supabase.from('coupons').select('current_uses').eq('id', appliedCoupon.coupon_id).single();
        if (couponData) {
          await supabase.from('coupons').update({ current_uses: couponData.current_uses + 1 }).eq('id', appliedCoupon.coupon_id);
        }
      }

      if (pointsDiscount > 0 && userId) {
        await supabase.from('loyalty_points').insert({
          user_id: userId,
          points: pointsToRedeem,
          transaction_type: 'redeemed',
          description: `מימוש נקודות בהזמנה (-₪${pointsDiscount})`,
        });
      }

      if (userId) {
        await supabase.from("profiles").update({ name: name.trim(), phone: phone.trim() }).eq("user_id", userId);
      }

      setSavedAmount(finalAmount);
      onOpenChange(false);
      setShowThankYou(true);
      clearCart();
      setName(""); setPhone(""); setNotes("");
    } catch (error) {
      if (import.meta.env.DEV) console.error('Order submission error:', error);
      toast.error("שגיאה בשליחת ההזמנה, נסו שוב");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-right text-xl">פרטי הזמנה</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
              {items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.name} x{item.quantity}</span>
                  <span>₪{item.price * item.quantity}</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>סה״כ</span>
                <span>₪{totalAmount}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Tag className="w-4 h-4" />קוד קופון</Label>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-accent/10 rounded-lg px-3 py-2">
                  <span className="text-sm font-medium text-accent">
                    {couponCode.toUpperCase()} — הנחה ₪{couponDiscount}
                  </span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setAppliedCoupon(null); setCouponCode(""); }}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="הכניסו קוד קופון" dir="ltr" />
                  <Button type="button" variant="outline" onClick={handleApplyCoupon} disabled={validateCoupon.isPending}>
                    {validateCoupon.isPending ? "..." : "הפעל"}
                  </Button>
                </div>
              )}
            </div>

            {userId && loyaltyBalance && loyaltyBalance > 0 && (
              <div className="space-y-2 bg-accent/5 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1"><Award className="w-4 h-4 text-accent" />נקודות נאמנות ({loyaltyBalance} נקודות)</Label>
                  <Button type="button" variant={usePoints ? "default" : "outline"} size="sm" onClick={() => {
                    setUsePoints(!usePoints);
                    if (!usePoints) setPointsToRedeem(Math.min(loyaltyBalance, totalAmount - couponDiscount));
                  }}>
                    {usePoints ? "בטל" : "השתמש"}
                  </Button>
                </div>
                {usePoints && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={pointsToRedeem}
                      onChange={e => setPointsToRedeem(Math.min(Number(e.target.value), loyaltyBalance, totalAmount - couponDiscount))}
                      min={0}
                      max={Math.min(loyaltyBalance, totalAmount - couponDiscount)}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">נקודות = ₪{pointsDiscount} הנחה</span>
                  </div>
                )}
              </div>
            )}

            {(couponDiscount > 0 || pointsDiscount > 0) && (
              <div className="bg-accent/10 rounded-lg p-3 flex justify-between font-bold text-accent">
                <span>סה״כ לתשלום</span>
                <span>₪{finalAmount}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">שם מלא *</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="הכניסו את שמכם" className={errors.name ? "border-destructive" : ""} aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-error" : undefined} />
              {errors.name && <p id="name-error" role="alert" className="text-destructive text-sm">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">טלפון *</Label>
              <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0501234567" type="tel" dir="ltr" className={errors.phone ? "border-destructive" : ""} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "phone-error" : undefined} />
              {errors.phone && <p id="phone-error" role="alert" className="text-destructive text-sm">{errors.phone}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">הערות להזמנה</Label>
              <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="הערות מיוחדות, אלרגיות וכו׳" rows={3} />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "שולח..." : `שלח הזמנה${finalAmount !== totalAmount ? ` (₪${finalAmount})` : ""}`}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <ThankYouModal
        open={showThankYou}
        onOpenChange={setShowThankYou}
        totalAmount={savedAmount}
        payboxUrl={settings?.paybox_url}
        bitUrl={settings?.bit_payment_url}
        bitEnabled={settings?.bit_enabled}
        phone={settings?.contact_phone}
      />
    </>
  );
};

export default OrderModal;
