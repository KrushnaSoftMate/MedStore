import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  CreditCard, 
  Plus, 
  Search, 
  Download, 
  MoreHorizontal,
  DollarSign,
  Receipt,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { db, auth } from "@/src/lib/firebase";
import { useAuth } from "./FirebaseProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface InvoiceItem {
  description: string;
  price: number;
}

interface Invoice {
  id: string;
  customerName: string;
  customerId: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  date: any;
  items: InvoiceItem[];
}

export function Billing() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    customerName: "",
    status: "pending" as const,
    items: [] as InvoiceItem[]
  });
  const [currentItem, setCurrentItem] = useState({ description: "", price: "" });

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "invoices"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Invoice[];
      setInvoices(data);
    });
    return () => unsubscribe();
  }, [user]);

  const addItem = () => {
    if (!currentItem.description || !currentItem.price) return;
    setNewInvoice({
      ...newInvoice,
      items: [...newInvoice.items, { description: currentItem.description, price: parseFloat(currentItem.price) }]
    });
    setCurrentItem({ description: "", price: "" });
  };

  const handleSaveInvoice = async () => {
    if (!user || !newInvoice.customerName || newInvoice.items.length === 0) return;
    const total = newInvoice.items.reduce((acc, item) => acc + item.price, 0);
    try {
      await addDoc(collection(db, "invoices"), {
        ...newInvoice,
        amount: total,
        customerId: "temp-id",
        date: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      setIsDialogOpen(false);
      setNewInvoice({ customerName: "", status: "pending", items: [] });
    } catch (error) {
      console.error("Error saving invoice:", error);
    }
  };

  const filteredInvoices = invoices.filter(i => 
    i.customerName.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label: "Total Revenue", value: "₹12.4L", icon: DollarSign, color: "emerald" },
    { label: "Pending Payments", value: "₹1.2L", icon: Clock, color: "amber" },
    { label: "Paid Invoices", value: "842", icon: CheckCircle2, color: "blue" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Billing & Invoices</h2>
          <p className="text-slate-400 text-sm">Manage customer payments and billing records.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="premium-gradient border-none">
              <Plus size={18} className="mr-2" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="glass border-slate-800 text-slate-100 max-w-xl">
            <DialogHeader>
              <DialogTitle>Generate Invoice</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label>Customer Name</Label>
                <Input 
                  className="glass border-slate-700" 
                  value={newInvoice.customerName}
                  onChange={(e) => setNewInvoice({...newInvoice, customerName: e.target.value})}
                />
              </div>

              <div className="space-y-4 p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
                <h4 className="font-bold text-sm">Add Line Items</h4>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Description" 
                    className="glass border-slate-700 flex-1"
                    value={currentItem.description}
                    onChange={(e) => setCurrentItem({...currentItem, description: e.target.value})}
                  />
                  <Input 
                    placeholder="Price" 
                    type="number"
                    className="glass border-slate-700 w-24"
                    value={currentItem.price}
                    onChange={(e) => setCurrentItem({...currentItem, price: e.target.value})}
                  />
                  <Button variant="outline" className="glass border-blue-500/30 text-blue-400" onClick={addItem}>
                    Add
                  </Button>
                </div>
              </div>

              {newInvoice.items.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest px-2">
                    <span>Description</span>
                    <span>Amount</span>
                  </div>
                  {newInvoice.items.map((item, i) => (
                    <div key={i} className="flex justify-between p-2 rounded-lg bg-slate-900/30 border border-slate-800 text-sm">
                      <span>{item.description}</span>
                      <span className="font-bold">₹{item.price}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-slate-800 flex justify-between px-2">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-blue-400 text-lg">
                      ₹{newInvoice.items.reduce((acc, item) => acc + item.price, 0)}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <Button className="premium-gradient border-none w-full h-12 text-lg font-bold" onClick={handleSaveInvoice}>
              Generate & Send Invoice
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="glass border-slate-800">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-2xl bg-${stat.color}-500/10 border border-${stat.color}-500/20`}>
                <stat.icon size={24} className={`text-${stat.color}-400`} />
              </div>
              <div>
                <p className="text-sm text-slate-400 font-medium">{stat.label}</p>
                <h3 className="text-2xl font-bold text-slate-100">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <Input 
            placeholder="Search invoices by customer name..." 
            className="pl-10 glass border-slate-800"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="glass rounded-3xl overflow-hidden border-slate-800">
          <Table>
            <TableHeader className="bg-slate-900/50">
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Invoice ID</TableHead>
                <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Customer</TableHead>
                <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Date</TableHead>
                <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Amount</TableHead>
                <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Status</TableHead>
                <TableHead className="text-right text-slate-400 font-bold uppercase text-[10px] tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((inv) => (
                <TableRow key={inv.id} className="border-slate-800 hover:bg-slate-900/30 transition-colors">
                  <TableCell className="font-mono text-xs text-slate-500">#{inv.id.slice(0, 8).toUpperCase()}</TableCell>
                  <TableCell className="font-bold text-slate-200">{inv.customerName}</TableCell>
                  <TableCell className="text-slate-400">
                    {inv.date?.toDate ? inv.date.toDate().toLocaleDateString() : "N/A"}
                  </TableCell>
                  <TableCell className="font-bold text-slate-100">₹{inv.amount}</TableCell>
                  <TableCell>
                    <Badge className={cn(
                      "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      inv.status === "paid" ? "bg-emerald-500/10 text-emerald-400" :
                      inv.status === "pending" ? "bg-amber-500/10 text-amber-400" :
                      "bg-red-500/10 text-red-400"
                    )}>
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-200">
                      <Download size={18} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
