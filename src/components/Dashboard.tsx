import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Users, 
  Calendar, 
  Activity, 
  DollarSign,
  ArrowUpRight,
  Clock,
  ChevronRight,
  Plus,
  Bell,
  TrendingUp,
  ShoppingCart
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { collection, onSnapshot, query, limit, orderBy, where, collectionGroup, getDocs } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, isToday, addDays } from "date-fns";

const data = [
  { name: "Mon", customers: 12 },
  { name: "Tue", customers: 18 },
  { name: "Wed", customers: 15 },
  { name: "Thu", customers: 25 },
  { name: "Fri", customers: 22 },
  { name: "Sat", customers: 30 },
  { name: "Sun", customers: 20 },
];

export function Dashboard() {
  const [customerCount, setCustomerCount] = useState(0);
  const [todaySalesCount, setTodaySalesCount] = useState(0);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [expiringBatches, setExpiringBatches] = useState<any[]>([]);

  useEffect(() => {
    const unsubCustomers = onSnapshot(collection(db, "customers"), (snapshot) => {
      setCustomerCount(snapshot.size);
    });

    const qSales = query(collection(db, "retail_sales"), orderBy("createdAt", "desc"), limit(10));
    const unsubSales = onSnapshot(qSales, (snapshot) => {
      const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const today = all.filter((sale: any) => {
        const d = sale.createdAt?.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt);
        return isToday(d);
      });
      setTodaySalesCount(today.length);
      setRecentSales(all.slice(0, 5));
    });

    // Fetch expiring batches (within 90 days)
    const fetchExpiring = async () => {
      const ninetyDaysFromNow = format(addDays(new Date(), 90), "yyyy-MM-dd");
      const qExp = query(
        collectionGroup(db, "batches"),
        where("expiryDate", "<=", ninetyDaysFromNow),
        orderBy("expiryDate", "asc"),
        limit(5)
      );
      const snapshot = await getDocs(qExp);
      setExpiringBatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchExpiring();

    return () => {
      unsubCustomers();
      unsubSales();
    };
  }, []);

  const stats = [
    { label: "Total Customers", value: customerCount.toString(), icon: Users, color: "blue", trend: "+12%" },
    { label: "Today's Sales", value: todaySalesCount.toString(), icon: ShoppingCart, color: "emerald", trend: "+5%" },
    { label: "Monthly Revenue", value: "₹45,200", icon: DollarSign, color: "amber", trend: "+18%" },
    { label: "Inventory Alerts", value: expiringBatches.length.toString(), icon: Bell, color: "purple", trend: "Alerts" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-100">Welcome back, Sanket</h2>
          <p className="text-slate-400">Here's what's happening at KripaSindhu today.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="glass border-slate-800 h-11 px-5">
            <Bell size={18} className="mr-2" />
            Notifications
          </Button>
          <Button className="premium-gradient border-none h-11 px-5">
            <Plus size={18} className="mr-2" />
            Quick Sale
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="glass border-slate-800 hover:border-blue-500/30 transition-all group">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl bg-${stat.color}-500/10 border border-${stat.color}-500/20 group-hover:scale-110 transition-transform`}>
                    <stat.icon size={24} className={`text-${stat.color}-400`} />
                  </div>
                  <Badge variant="outline" className="glass border-emerald-500/20 text-emerald-400 text-[10px]">
                    {stat.trend}
                  </Badge>
                </div>
                <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
                <h3 className="text-3xl font-bold text-slate-100">{stat.value}</h3>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 glass border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold">Customer Inflow</CardTitle>
              <p className="text-xs text-slate-500">Weekly overview of customer visits</p>
            </div>
            <Button variant="ghost" size="sm" className="text-blue-400 text-xs">
              View Report <ChevronRight size={14} />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#0f172a", 
                      border: "1px solid #1e293b",
                      borderRadius: "12px",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                    }}
                    itemStyle={{ color: "#f8fafc" }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="customers" 
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#colorCustomers)" 
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Recent Sales</CardTitle>
            <p className="text-xs text-slate-500">Latest pharmacy transactions</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSales.length === 0 ? (
                <div className="text-center py-10">
                  <Clock className="mx-auto text-slate-700 mb-2" size={32} />
                  <p className="text-sm text-slate-500 italic">No sales recorded yet.</p>
                </div>
              ) : (
                recentSales.map((sale, i) => (
                  <div key={sale.id} className="flex items-center gap-4 p-3 rounded-2xl bg-slate-900/30 border border-slate-800/50 hover:border-blue-500/30 transition-all group">
                    <div className="text-center min-w-[50px]">
                      <p className="text-sm font-bold text-blue-400">
                        {format(sale.createdAt?.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt), "HH:mm")}
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-200">{sale.customerName}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">₹{sale.totalAmount}</p>
                    </div>
                    <Badge className="bg-blue-500/10 text-blue-400 border-none text-[8px]">
                      {sale.paymentMethod}
                    </Badge>
                  </div>
                ))
              )}
            </div>
            <Button variant="outline" className="w-full mt-6 glass border-slate-800 text-slate-400 hover:text-slate-200">
              View All Sales
            </Button>
          </CardContent>
        </Card>

        <Card className="glass border-slate-800 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Bell className="text-amber-400" size={20} />
                Inventory Alerts
              </CardTitle>
              <p className="text-xs text-slate-500">Batches expiring soon or low stock</p>
            </div>
            <Button variant="ghost" size="sm" className="text-amber-400 text-xs">
              Manage Inventory <ChevronRight size={14} />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {expiringBatches.length === 0 ? (
                <div className="col-span-2 text-center py-6 text-slate-500 italic text-sm">
                  No immediate inventory alerts.
                </div>
              ) : (
                expiringBatches.map((batch) => (
                  <div key={batch.id} className="flex items-center justify-between p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 group">
                    <div>
                      <p className="text-sm font-bold text-slate-200">Batch #{batch.batchNumber}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Expires: {batch.expiryDate}</p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-amber-500/10 text-amber-500 border-none text-[8px] mb-1">EXPIRING SOON</Badge>
                      <p className="text-xs text-slate-400">Stock: {batch.currentStock}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
