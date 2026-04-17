import React from "react";
import { motion } from "motion/react";
import { 
  Activity, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const revenueData = [
  { name: "Jan", revenue: 45000, customers: 120 },
  { name: "Feb", revenue: 52000, customers: 145 },
  { name: "Mar", revenue: 48000, customers: 130 },
  { name: "Apr", revenue: 61000, customers: 170 },
  { name: "May", revenue: 55000, customers: 155 },
  { name: "Jun", revenue: 67000, customers: 190 },
];

const categoryData = [
  { name: "Antibiotics", value: 400 },
  { name: "Painkillers", value: 300 },
  { name: "Diabetes", value: 300 },
  { name: "Vitamins", value: 200 },
];

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export function Analytics() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Analytics & Insights</h2>
        <p className="text-slate-400 text-sm">Comprehensive overview of your pharmacy's performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Customers", value: "1,284", change: "+12%", icon: Users, color: "blue" },
          { label: "Monthly Revenue", value: "₹67,000", change: "+18%", icon: DollarSign, color: "emerald" },
          { label: "Retail Sales", value: "842", change: "+5%", icon: ShoppingCart, color: "amber" },
          { label: "Inventory Health", value: "98.2%", change: "+2%", icon: Activity, color: "purple" },
        ].map((stat, i) => (
          <Card key={i} className="glass border-slate-800">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-xl bg-${stat.color}-500/10 border border-${stat.color}-500/20`}>
                  <stat.icon size={20} className={`text-${stat.color}-400`} />
                </div>
                <div className={cn(
                  "flex items-center text-xs font-bold",
                  stat.change.startsWith("+") ? "text-emerald-400" : "text-red-400"
                )}>
                  {stat.change}
                  {stat.change.startsWith("+") ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                </div>
              </div>
              <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-100">{stat.value}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="glass border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Revenue vs Customers Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px" }}
                    itemStyle={{ color: "#f8fafc" }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Sales by Category</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {categoryData.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-xs text-slate-400">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
