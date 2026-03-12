import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useProducts } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { useLoyaltyBalance, useLoyaltyHistory } from "@/hooks/useLoyaltyPoints";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Package, Clock, ShoppingBag, Pencil, Save, X, RefreshCw, Award } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import type { Json } from "@/integrations/supabase/types";

interface OrderItem {
  id?: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  created_at: string;
  status: string;
  payment_status: string;
  total_amount: number;
  items: Json;
  notes: string | null;
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "ממתינה", variant: "secondary" },
  confirmed: { label: "אושרה", variant: "default" },
  preparing: { label: "בהכנה", variant: "default" },
  ready: { label: "מוכנה", variant: "default" },
  delivered: { label: "נמסרה", variant: "outline" },
  cancelled: { label: "בוטלה", variant: "destructive" },
};

const paymentMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  unpaid: { label: "לא שולם", variant: "destructive" },
  paid: { label: "שולם", variant: "default" },
  partial: { label: "שולם חלקית", variant: "secondary" },
};

const MyOrders = () => {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { data: availableProducts } = useProducts();
  const { data: loyaltyBalance } = useLoyaltyBalance();
  const { data: loyaltyHistory } = useLoyaltyHistory();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPhone, setHasPhone] = useState(true);
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showLoyalty, setShowLoyalty] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setUserId(session.user.id);

      const { data: profile } = await supabase.from("profiles").select("phone, name").eq("user_id", session.user.id).maybeSingle();
      setProfileName(profile?.name || "");
      setProfilePhone(profile?.phone || "");

      if (!profile?.phone) { setHasPhone(false); setIsLoading(false); return; }

      const { data, error } = await supabase.from("orders").select("id, created_at, status, payment_status, total_amount, items, notes").order("created_at", { ascending: false });
      if (!error && data) setOrders(data);
      setIsLoading(false);
    };
    fetchData();
  }, [navigate]);

  const startEditing = () => { setEditName(profileName); setEditPhone(profilePhone); setIsEditing(true); };
  const cancelEditing = () => setIsEditing(false);

  const saveProfile = async () => {
    if (!userId) return;
    if (!editPhone.trim()) { toast.error("מספר טלפון הוא שדה חובה"); return; }
    setIsSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({ name: editName.trim(), phone: editPhone.trim() }).eq("user_id", userId);
      if (error) throw error;
      setProfileName(editName.trim());
      setProfilePhone(editPhone.trim());
      setIsEditing(false);
      setHasPhone(true);
      toast.success("הפרופיל עודכן בהצלחה");
      if (!hasPhone) {
        const { data } = await supabase.from("orders").select("id, created_at, status, payment_status, total_amount, items, notes").order("created_at", { ascending: false });
        if (data) setOrders(data);
      }
    } catch (error: any) {
      toast.error(error.message || "שגיאה בעדכון הפרופיל");
    } finally { setIsSaving(false); }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const parseItems = (items: Json): OrderItem[] => Array.isArray(items) ? items as unknown as OrderItem[] : [];

  const handleOrderAgain = (order: Order) => {
    const orderItems = parseItems(order.items);
    let addedCount = 0;
    orderItems.forEach(item => {
      if (!item.id) return;
      const product = availableProducts?.find(p => p.id === item.id);
      if (product && product.available) {
        addItem({
          id: product.id,
          name: product.name,
          price: Number(product.price),
          image_url: product.image_url || undefined,
          max_quantity_per_order: product.max_quantity_per_order || 10,
        });
        addedCount++;
      }
    });
    if (addedCount > 0) {
      toast.success(`${addedCount} מוצרים נוספו לסל`);
    } else {
      toast.error("המוצרים מהזמנה זו אינם זמינים כרגע");
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logo} alt="סבתא יואל" className="w-12 h-12 object-contain" />
              <h1 className="text-xl font-rubik font-bold text-primary">ההזמנות שלי</h1>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowRight className="w-4 h-4 ml-2" />
              חזרה לאתר
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Profile Section */}
        <Card className="mb-6">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-lg">פרטי הפרופיל</h2>
              {!isEditing ? (
                <Button variant="ghost" size="sm" onClick={startEditing}>
                  <Pencil className="w-4 h-4 ml-1" />עריכה
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={cancelEditing} disabled={isSaving}><X className="w-4 h-4 ml-1" />ביטול</Button>
                  <Button size="sm" onClick={saveProfile} disabled={isSaving}><Save className="w-4 h-4 ml-1" />{isSaving ? "שומר..." : "שמור"}</Button>
                </div>
              )}
            </div>
            {isEditing ? (
              <div className="space-y-3">
                <div className="space-y-1"><Label htmlFor="editName">שם</Label><Input id="editName" value={editName} onChange={e => setEditName(e.target.value)} placeholder="שם מלא" /></div>
                <div className="space-y-1"><Label htmlFor="editPhone">טלפון</Label><Input id="editPhone" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="050-1234567" dir="ltr" /></div>
              </div>
            ) : (
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">שם:</span> {profileName || "—"}</p>
                <p><span className="text-muted-foreground">טלפון:</span> {profilePhone || "—"}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loyalty Points Card */}
        {(loyaltyBalance !== undefined && loyaltyBalance > 0) && (
          <Card className="mb-6 border-accent/30 bg-accent/5">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-accent" />
                  <span className="font-bold">נקודות נאמנות</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-accent">{loyaltyBalance}</span>
                  <Button variant="outline" size="sm" onClick={() => setShowLoyalty(!showLoyalty)}>
                    {showLoyalty ? "הסתר" : "היסטוריה"}
                  </Button>
                </div>
              </div>
              {showLoyalty && loyaltyHistory && loyaltyHistory.length > 0 && (
                <div className="mt-4 space-y-2 border-t border-border pt-3">
                  {loyaltyHistory.slice(0, 10).map((t: any) => (
                    <div key={t.id} className="flex justify-between text-sm">
                      <span>{t.description || (t.transaction_type === 'earned' ? 'נצברו נקודות' : 'מומשו נקודות')}</span>
                      <span className={t.transaction_type === 'earned' ? 'text-accent font-medium' : 'text-destructive font-medium'}>
                        {t.transaction_type === 'earned' ? '+' : '-'}{t.points}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!hasPhone ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <Package className="w-16 h-16 text-muted-foreground" />
              <h2 className="text-xl font-bold">לא נמצא מספר טלפון בפרופיל שלך</h2>
              <p className="text-muted-foreground">עדכן את מספר הטלפון למעלה כדי לראות את ההזמנות שלך.</p>
            </CardContent>
          </Card>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <ShoppingBag className="w-16 h-16 text-muted-foreground" />
              <h2 className="text-xl font-bold">אין הזמנות עדיין</h2>
              <p className="text-muted-foreground">ברגע שתבצע הזמנה, היא תופיע כאן.</p>
              <Button asChild><Link to="/#menu">הזמן עכשיו</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map(order => {
              const items = parseItems(order.items);
              const status = statusMap[order.status] || { label: order.status, variant: "secondary" as const };
              const payment = paymentMap[order.payment_status] || { label: order.payment_status, variant: "secondary" as const };

              return (
                <Card key={order.id} className="overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />{formatDate(order.created_at)}
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={status.variant}>{status.label}</Badge>
                        <Badge variant={payment.variant}>{payment.label}</Badge>
                      </div>
                    </div>
                    <div className="space-y-1 mb-3">
                      {items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{item.name} × {item.quantity}</span>
                          <span className="font-medium">₪{(item.price * item.quantity).toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                    {order.notes && (
                      <p className="text-sm text-muted-foreground border-t border-border pt-2 mt-2">הערות: {order.notes}</p>
                    )}
                    <div className="flex justify-between items-center border-t border-border pt-3 mt-3">
                      <span className="font-bold text-lg">סה״כ: ₪{Number(order.total_amount).toFixed(0)}</span>
                      <Button variant="outline" size="sm" onClick={() => handleOrderAgain(order)} className="gap-1">
                        <RefreshCw className="w-4 h-4" />הזמן שוב
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyOrders;
