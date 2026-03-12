import { useState, lazy, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Eye } from "lucide-react";

const TrayScene3D = lazy(() => import("@/components/TrayScene3D"));

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

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

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  items: OrderItem[];
  total_amount: number;
  status: string;
  payment_status: string;
  notes: string | null;
  created_at: string;
  tray_layout: TrayLayoutData | null;
}

const OrdersTab = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [trayPreviewOrder, setTrayPreviewOrder] = useState<Order | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map((order) => ({
        ...order,
        items: (order.items as unknown as OrderItem[]) || [],
        tray_layout: order.tray_layout as unknown as TrayLayoutData | null,
      })) as Order[];
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: string }) => {
      const allowedFields = ['status', 'payment_status'];
      if (!allowedFields.includes(field)) throw new Error('Invalid field');
      const { error } = await supabase.from("orders").update({ [field]: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("ההזמנה עודכנה");
    },
    onError: () => toast.error("שגיאה בעדכון ההזמנה"),
  });

  const filteredOrders = orders?.filter((order) => {
    if (statusFilter === "all") return true;
    return order.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = { pending: "secondary", processing: "default", completed: "outline", cancelled: "destructive" };
    const labels: Record<string, string> = { pending: "ממתין", processing: "בטיפול", completed: "הושלם", cancelled: "בוטל" };
    return <Badge variant={variants[status] || "default"}>{labels[status] || status}</Badge>;
  };

  const getPaymentBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = { unpaid: "destructive", paid: "default" };
    const labels: Record<string, string> = { unpaid: "לא שולם", paid: "שולם" };
    return <Badge variant={variants[status] || "secondary"}>{labels[status] || status}</Badge>;
  };

  // Build TrayScene3D items from tray_layout
  const buildTrayPreviewItems = (layout: TrayLayoutData) => {
    const customPositions: Record<string, { x: number; y: number }> = {};
    const items = layout.items.map(item => {
      // Apply saved positions
      item.positions?.forEach((pos, i) => {
        customPositions[`${item.id}__${i}`] = pos;
      });
      return {
        id: item.id,
        name: item.name,
        image_url: item.image_url,
        quantity: item.quantity,
      };
    });
    return { items, customPositions };
  };

  if (isLoading) return <div className="text-center py-8">טוען...</div>;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>הזמנות</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="סנן לפי סטטוס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">הכל</SelectItem>
                <SelectItem value="pending">ממתין</SelectItem>
                <SelectItem value="processing">בטיפול</SelectItem>
                <SelectItem value="completed">הושלם</SelectItem>
                <SelectItem value="cancelled">בוטל</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>תאריך</TableHead>
                  <TableHead>לקוח</TableHead>
                  <TableHead>טלפון</TableHead>
                  <TableHead>פריטים</TableHead>
                  <TableHead>סכום</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>תשלום</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders?.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: he })}
                    </TableCell>
                    <TableCell>{order.customer_name}</TableCell>
                    <TableCell dir="ltr">{order.customer_phone}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {order.items.map((item, i) => (
                          <div key={i}>{item.name} x{item.quantity}</div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>₪{order.total_amount}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{getPaymentBadge(order.payment_status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2 items-center">
                        {order.tray_layout && order.tray_layout.items?.length > 0 && (
                          <Button variant="outline" size="sm" onClick={() => setTrayPreviewOrder(order)} title="צפה בסידור המגש">
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        <Select
                          value={order.status}
                          onValueChange={(value) => updateOrderMutation.mutate({ id: order.id, field: "status", value })}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">ממתין</SelectItem>
                            <SelectItem value="processing">בטיפול</SelectItem>
                            <SelectItem value="completed">הושלם</SelectItem>
                            <SelectItem value="cancelled">בוטל</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={order.payment_status}
                          onValueChange={(value) => updateOrderMutation.mutate({ id: order.id, field: "payment_status", value })}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unpaid">לא שולם</SelectItem>
                            <SelectItem value="paid">שולם</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {(!filteredOrders || filteredOrders.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">אין הזמנות</div>
          )}
        </CardContent>
      </Card>

      {/* Tray Layout Preview Dialog */}
      <Dialog open={!!trayPreviewOrder} onOpenChange={(open) => !open && setTrayPreviewOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>סידור המגש — {trayPreviewOrder?.customer_name}</DialogTitle>
          </DialogHeader>
          {trayPreviewOrder?.tray_layout && (() => {
            const { items, customPositions } = buildTrayPreviewItems(trayPreviewOrder.tray_layout);
            const traySize = (trayPreviewOrder.tray_layout.traySize || 'medium') as 'small' | 'medium' | 'large';
            return (
              <Suspense fallback={<div className="h-[400px] bg-muted rounded-xl animate-pulse" />}>
                <TrayScene3D
                  items={items}
                  traySize={traySize}
                  customPositions={customPositions}
                  readOnly
                />
              </Suspense>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrdersTab;
