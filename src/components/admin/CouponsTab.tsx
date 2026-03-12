import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  current_uses: number;
  active: boolean;
  expires_at: string | null;
}

const CouponsTab = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: 0,
    min_order_amount: 0,
    max_uses: "",
    active: true,
    expires_at: "",
  });

  const { data: coupons, isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Coupon[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        code: data.code.toUpperCase(),
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        min_order_amount: data.min_order_amount,
        max_uses: data.max_uses ? Number(data.max_uses) : null,
        active: data.active,
        expires_at: data.expires_at || null,
      };
      if (data.id) {
        const { error } = await supabase.from("coupons").update(payload).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("coupons").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success(editing ? "הקופון עודכן" : "הקופון נוצר");
      resetForm();
    },
    onError: () => toast.error("שגיאה בשמירת הקופון"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success("הקופון נמחק");
    },
  });

  const resetForm = () => {
    setForm({ code: "", discount_type: "percentage", discount_value: 0, min_order_amount: 0, max_uses: "", active: true, expires_at: "" });
    setEditing(null);
    setIsDialogOpen(false);
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code,
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      min_order_amount: c.min_order_amount,
      max_uses: c.max_uses?.toString() || "",
      active: c.active,
      expires_at: c.expires_at ? c.expires_at.split("T")[0] : "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(editing ? { ...form, id: editing.id } : form);
  };

  if (isLoading) return <div className="text-center py-8">טוען...</div>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>קופונים</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}><Plus className="w-4 h-4 ml-2" />הוסף קופון</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editing ? "ערוך קופון" : "קופון חדש"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>קוד קופון</Label>
                  <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required dir="ltr" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>סוג הנחה</Label>
                    <Select value={form.discount_type} onValueChange={v => setForm({ ...form, discount_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">אחוזים</SelectItem>
                        <SelectItem value="fixed">סכום קבוע</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{form.discount_type === "percentage" ? "אחוז הנחה" : "סכום הנחה (₪)"}</Label>
                    <Input type="number" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: Number(e.target.value) })} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>מינימום הזמנה (₪)</Label>
                    <Input type="number" value={form.min_order_amount} onChange={e => setForm({ ...form, min_order_amount: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>מקס שימושים</Label>
                    <Input type="number" value={form.max_uses} onChange={e => setForm({ ...form, max_uses: e.target.value })} placeholder="ללא הגבלה" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>תאריך תפוגה</Label>
                  <Input type="date" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} dir="ltr" />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.active} onCheckedChange={c => setForm({ ...form, active: c })} />
                  <Label>פעיל</Label>
                </div>
                <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "שומר..." : "שמור"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>קוד</TableHead>
                <TableHead>הנחה</TableHead>
                <TableHead>מינימום</TableHead>
                <TableHead>שימושים</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons?.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-bold" dir="ltr">{c.code}</TableCell>
                  <TableCell>{c.discount_type === "percentage" ? `${c.discount_value}%` : `₪${c.discount_value}`}</TableCell>
                  <TableCell>₪{c.min_order_amount}</TableCell>
                  <TableCell>{c.current_uses}{c.max_uses ? `/${c.max_uses}` : ""}</TableCell>
                  <TableCell>
                    <Badge variant={c.active ? "default" : "secondary"}>{c.active ? "פעיל" : "לא פעיל"}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(c.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default CouponsTab;
