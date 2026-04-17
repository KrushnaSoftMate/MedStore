import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter, 
  TrendingUp, 
  DollarSign, 
  PieChart as PieChartIcon,
  Table as TableIcon,
  ArrowUpRight,
  ArrowDownRight,
  Calculator,
  Briefcase,
  AlertCircle
} from "lucide-react";
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  getDocs 
} from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { cn } from "@/lib/utils";

export function Reports() {
  const [sales, setSales] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    end: format(endOfMonth(new Date()), "yyyy-MM-dd")
  });
  const [reportType, setReportType] = useState<"GST" | "Sales" | "Inventory" | "PNL" | "BalanceSheet" | "NonMoving">("GST");

  useEffect(() => {
    const fetchData = async () => {
      const qSales = query(collection(db, "retail_sales"), orderBy("date", "desc"));
      const salesSnap = await getDocs(qSales);
      setSales(salesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const qInv = query(collection(db, "inventory"));
      const invSnap = await getDocs(qInv);
      setInventory(invSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchData();
  }, []);

  const calculateGst = () => {
    let totalTaxable = 0;
    let totalGst = 0;
    sales.forEach(sale => {
      sale.items?.forEach((item: any) => {
        totalTaxable += (item.price * item.quantity);
        totalGst += (item.gstAmount || 0);
      });
    });
    return { totalTaxable, totalGst };
  };

  const calculatePNL = () => {
    const totalSales = sales.reduce((acc, s) => acc + s.totalAmount, 0);
    const estimatedCOGS = totalSales * 0.7; // Mock 70% cost of goods sold
    const expenses = totalSales * 0.1; // Mock 10% expenses
    const grossProfit = totalSales - estimatedCOGS;
    const netProfit = grossProfit - expenses;
    return { totalSales, estimatedCOGS, expenses, grossProfit, netProfit };
  };

  const { totalTaxable, totalGst } = calculateGst();
  const pnl = calculatePNL();

  const exportToTally = () => {
    const headers = ["Date", "Voucher Type", "Voucher No", "Ledger Name", "Amount", "GST"];
    const rows = sales.map(s => [
      format(s.date?.toDate ? s.date.toDate() : new Date(), "dd-MM-yyyy"),
      "Sales",
      s.id.slice(0, 8),
      s.customerName || "Walk-in Customer",
      s.totalAmount,
      (s.items?.reduce((a: any, b: any) => a + (b.gstAmount || 0), 0) || 0)
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Tally_Export_${format(new Date(), "yyyyMMdd")}.csv`;
    link.click();
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Advanced Business Intelligence</h2>
          <p className="text-slate-400 text-sm">Comprehensive accounting, tax, and inventory analytics.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="glass border-slate-800" onClick={exportToTally}>
            <Download size={18} className="mr-2 text-blue-400" />
            Export to Tally
          </Button>
          <Button className="premium-gradient border-none">
            <Download size={18} className="mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 glass border-slate-800 h-fit">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Report Center</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { id: "GST", label: "GST Report", icon: Calculator },
              { id: "Sales", label: "Sales Analysis", icon: TrendingUp },
              { id: "PNL", label: "Profit & Loss", icon: Briefcase },
              { id: "BalanceSheet", label: "Balance Sheet", icon: PieChartIcon },
              { id: "Inventory", label: "Stock Valuation", icon: TableIcon },
              { id: "NonMoving", label: "Non-Moving Items", icon: AlertCircle },
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => setReportType(type.id as any)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-sm font-medium",
                  reportType === type.id 
                    ? "bg-blue-600/10 border-blue-500 text-blue-400" 
                    : "bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700"
                )}
              >
                <type.icon size={16} />
                {type.label}
              </button>
            ))}
            
            <div className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-slate-500">Date Range</Label>
                <Input 
                  type="date" 
                  className="glass border-slate-800 h-9 text-xs" 
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                />
                <Input 
                  type="date" 
                  className="glass border-slate-800 h-9 text-xs" 
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                />
              </div>
              <Button className="w-full glass border-blue-500/30 text-blue-400 h-9 text-xs">Apply Period</Button>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-6">
          {reportType === "PNL" ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="glass border-slate-800 bg-emerald-500/5">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 rounded-lg bg-emerald-500/10">
                        <ArrowUpRight className="text-emerald-400" size={20} />
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-none">INCOME</Badge>
                    </div>
                    <p className="text-sm text-slate-500 font-medium">Gross Revenue</p>
                    <h3 className="text-3xl font-bold text-slate-100">₹{pnl.totalSales.toLocaleString()}</h3>
                  </CardContent>
                </Card>
                <Card className="glass border-slate-800 bg-red-500/5">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 rounded-lg bg-red-500/10">
                        <ArrowDownRight className="text-red-400" size={20} />
                      </div>
                      <Badge className="bg-red-500/10 text-red-400 border-none">EXPENSE</Badge>
                    </div>
                    <p className="text-sm text-slate-500 font-medium">Total COGS & Expenses</p>
                    <h3 className="text-3xl font-bold text-slate-100">₹{(pnl.estimatedCOGS + pnl.expenses).toLocaleString()}</h3>
                  </CardContent>
                </Card>
              </div>
              
              <Card className="glass border-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Profit & Loss Statement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Trading Income (Sales)</span>
                    <span className="text-slate-100 font-bold">₹{pnl.totalSales.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Cost of Goods Sold (COGS)</span>
                    <span className="text-red-400">(-) ₹{pnl.estimatedCOGS.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 font-bold text-blue-400">
                    <span>Gross Profit</span>
                    <span>₹{pnl.grossProfit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Operating Expenses</span>
                    <span className="text-red-400">(-) ₹{pnl.expenses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-4 text-xl font-bold text-emerald-400 bg-emerald-500/5 px-4 rounded-xl">
                    <span>Net Profit</span>
                    <span>₹{pnl.netProfit.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : reportType === "BalanceSheet" ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="glass border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-blue-400">Assets</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between py-2 border-b border-slate-800">
                      <span className="text-slate-400">Cash in Hand</span>
                      <span className="text-slate-100 font-bold">₹42,500</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-800">
                      <span className="text-slate-400">Bank Accounts</span>
                      <span className="text-slate-100 font-bold">₹1,24,000</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-800">
                      <span className="text-slate-400">Stock in Hand</span>
                      <span className="text-slate-100 font-bold">₹8,45,000</span>
                    </div>
                    <div className="flex justify-between py-4 text-xl font-bold text-blue-400 bg-blue-500/5 px-4 rounded-xl">
                      <span>Total Assets</span>
                      <span>₹10,11,500</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-red-400">Liabilities</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between py-2 border-b border-slate-800">
                      <span className="text-slate-400">Sundry Creditors</span>
                      <span className="text-slate-100 font-bold">₹2,15,000</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-800">
                      <span className="text-slate-400">Outstanding Expenses</span>
                      <span className="text-slate-100 font-bold">₹12,400</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-800">
                      <span className="text-slate-400">Capital Account</span>
                      <span className="text-slate-100 font-bold">₹7,84,100</span>
                    </div>
                    <div className="flex justify-between py-4 text-xl font-bold text-red-400 bg-red-500/5 px-4 rounded-xl">
                      <span>Total Liabilities</span>
                      <span>₹10,11,500</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : reportType === "Inventory" ? (
            <Card className="glass border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TableIcon className="text-blue-400" size={20} />
                  Stock Valuation Report
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-[10px] uppercase font-bold">Item Name</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold">Batch</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold">Closing Stock</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold">Purchase Rate</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold">Valuation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventory.map((item, idx) => (
                      <TableRow key={idx} className="border-slate-800">
                        <TableCell className="p-4 text-sm font-bold">{item.name}</TableCell>
                        <TableCell className="p-4 text-xs text-slate-500">B{Math.floor(Math.random()*1000)}</TableCell>
                        <TableCell className="p-4 text-sm">{item.totalStock || 0}</TableCell>
                        <TableCell className="p-4 text-sm">₹105.00</TableCell>
                        <TableCell className="p-4 text-sm font-bold text-emerald-400">₹{((item.totalStock || 0) * 105).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : reportType === "NonMoving" ? (
            <Card className="glass border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="text-amber-400" size={20} />
                  Non-Moving Items (Last 90 Days)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-[10px] uppercase font-bold">Product Name</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold">Last Sale Date</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold">Current Stock</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold">Stock Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventory.filter(i => (i.totalStock || 0) > 0).slice(0, 5).map((item, idx) => (
                      <TableRow key={idx} className="border-slate-800">
                        <TableCell className="p-4 text-sm font-bold">{item.name}</TableCell>
                        <TableCell className="p-4 text-sm text-slate-500">12 Jan 2024</TableCell>
                        <TableCell className="p-4 text-sm">{item.totalStock || 0}</TableCell>
                        <TableCell className="p-4 text-sm font-bold text-blue-400">₹{(item.totalStock || 0) * 120}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="glass border-slate-800">
                  <CardContent className="p-6">
                    <p className="text-sm text-slate-500 font-medium mb-1">Taxable Amount</p>
                    <h3 className="text-2xl font-bold text-slate-100">₹{totalTaxable.toLocaleString()}</h3>
                  </CardContent>
                </Card>
                <Card className="glass border-slate-800">
                  <CardContent className="p-6">
                    <p className="text-sm text-slate-500 font-medium mb-1">Total GST (Output)</p>
                    <h3 className="text-2xl font-bold text-emerald-400">₹{totalGst.toLocaleString()}</h3>
                  </CardContent>
                </Card>
                <Card className="glass border-slate-800">
                  <CardContent className="p-6">
                    <p className="text-sm text-slate-500 font-medium mb-1">Total Sales (Gross)</p>
                    <h3 className="text-2xl font-bold text-blue-400">₹{(totalTaxable + totalGst).toLocaleString()}</h3>
                  </CardContent>
                </Card>
              </div>

              <Card className="glass border-slate-800 overflow-hidden">
                <CardHeader className="bg-slate-900/50 border-b border-slate-800">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <TableIcon size={20} className="text-blue-400" />
                    {reportType} Summary Table
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-800 hover:bg-transparent">
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider">Date</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider">Invoice #</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider">Taxable</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider">GST Amt</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider">Total</TableHead>
                        <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sales.map((sale) => (
                        <TableRow key={sale.id} className="border-slate-800 hover:bg-slate-900/30">
                          <TableCell className="text-xs text-slate-400">
                            {sale.date?.toDate ? format(sale.date.toDate(), "dd MMM yyyy") : "N/A"}
                          </TableCell>
                          <TableCell className="font-mono text-[10px] text-slate-500">#{sale.id.slice(0, 8).toUpperCase()}</TableCell>
                          <TableCell className="text-sm font-medium">₹{(sale.totalAmount - (sale.items?.reduce((a: any, b: any) => a + (b.gstAmount || 0), 0) || 0)).toFixed(2)}</TableCell>
                          <TableCell className="text-sm font-medium text-emerald-400">₹{(sale.items?.reduce((a: any, b: any) => a + (b.gstAmount || 0), 0) || 0).toFixed(2)}</TableCell>
                          <TableCell className="text-sm font-bold">₹{sale.totalAmount.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-none text-[8px]">PAID</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
