import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, Users, DollarSign, Package } from "lucide-react";

const StatsTab = () => {
  const { data: ordersStats } = useQuery({
    queryKey: ["admin-orders-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("total_amount, status, payment_status");
      if (error) throw error;

      const total = data?.length || 0;
      const pending = data?.filter((o) => o.status === "pending").length || 0;
      const paid = data?.filter((o) => o.payment_status === "paid").length || 0;
      const revenue = data?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;

      return { total, pending, paid, revenue };
    },
  });

  const { data: customersCount } = useQuery({
    queryKey: ["admin-customers-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("customers").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: productsCount } = useQuery({
    queryKey: ["admin-products-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("products").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const stats = [
    {
      title: "סה״כ הזמנות",
      value: ordersStats?.total || 0,
      icon: ShoppingBag,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "הזמנות ממתינות",
      value: ordersStats?.pending || 0,
      icon: Package,
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
    {
      title: "לקוחות",
      value: customersCount || 0,
      icon: Users,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      title: "הכנסות",
      value: `₪${ordersStats?.revenue?.toLocaleString() || 0}`,
      icon: DollarSign,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
    {
      title: "מוצרים",
      value: productsCount || 0,
      icon: Package,
      color: "text-pink-600",
      bg: "bg-pink-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>סיכום</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
              <span>הזמנות ששולמו</span>
              <span className="font-bold">{ordersStats?.paid || 0}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
              <span>אחוז תשלום</span>
              <span className="font-bold">
                {ordersStats?.total
                  ? Math.round((ordersStats.paid / ordersStats.total) * 100)
                  : 0}
                %
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsTab;
