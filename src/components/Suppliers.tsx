import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Truck, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  FileText,
  ExternalLink,
  MoreHorizontal
} from "lucide-react";
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "@/src/lib/firebase";
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
import { cn } from "@/lib/utils";

interface Supplier {
  id: string;
  name: string;
  contact: string;
  gstNumber: string;
  address: string;
  email?: string;
}

export function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    contact: "",
    gstNumber: "",
    address: "",
    email: ""
  });

  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showLedger, setShowLedger] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "suppliers"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Supplier[];
      setSuppliers(data);
    });
    return () => unsubscribe();
  }, []);

  const handleAddSupplier = async () => {
    if (!newSupplier.name || !newSupplier.contact) return;
    try {
      await addDoc(collection(db, "suppliers"), {
        ...newSupplier,
        createdAt: serverTimestamp()
      });
      setIsDialogOpen(false);
      setNewSupplier({ name: "", contact: "", gstNumber: "", address: "", email: "" });
    } catch (error) {
      console.error("Error adding supplier:", error);
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.gstNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Supplier Management</h2>
          <p className="text-slate-400 text-sm">Manage distributors and medicine supply chain.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="premium-gradient border-none">
              <Plus size={18} className="mr-2" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="glass border-slate-800 text-slate-100 max-w-md">
            <DialogHeader>
              <DialogTitle>Register New Supplier</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Supplier/Agency Name</Label>
                <Input 
                  className="glass border-slate-700" 
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Contact Number</Label>
                  <Input 
                    className="glass border-slate-700" 
                    value={newSupplier.contact}
                    onChange={(e) => setNewSupplier({...newSupplier, contact: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>GST Number</Label>
                  <Input 
                    className="glass border-slate-700" 
                    value={newSupplier.gstNumber}
                    onChange={(e) => setNewSupplier({...newSupplier, gstNumber: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Email Address</Label>
                <Input 
                  className="glass border-slate-700" 
                  value={newSupplier.email}
                  onChange={(e) => setNewSupplier({...newSupplier, email: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label>Full Address</Label>
                <Input 
                  className="glass border-slate-700" 
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier({...newSupplier, address: e.target.value})}
                />
              </div>
            </div>
            <Button className="premium-gradient border-none w-full h-12 text-lg font-bold" onClick={handleAddSupplier}>
              Register Supplier
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <Input 
          placeholder="Search suppliers by name or GST..." 
          className="pl-10 glass border-slate-800"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredSuppliers.map((sup, i) => (
            <motion.div
              key={sup.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="glass border-slate-800 hover:border-blue-500/30 transition-all group overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                      <Truck className="text-blue-400" size={24} />
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500">
                      <MoreHorizontal size={18} />
                    </Button>
                  </div>
                  <CardTitle className="text-xl font-bold mt-4">{sup.name}</CardTitle>
                  <Badge variant="outline" className="w-fit glass border-slate-800 text-slate-500 text-[10px] uppercase tracking-widest">
                    GST: {sup.gstNumber || "N/A"}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <Phone size={14} className="text-blue-500/50" />
                      {sup.contact}
                    </div>
                    {sup.email && (
                      <div className="flex items-center gap-3 text-sm text-slate-400">
                        <Mail size={14} className="text-blue-500/50" />
                        {sup.email}
                      </div>
                    )}
                    <div className="flex items-start gap-3 text-sm text-slate-400">
                      <MapPin size={14} className="text-blue-500/50 mt-1" />
                      <span className="flex-1 line-clamp-2">{sup.address}</span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-800 flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 glass border-slate-800 text-xs h-9"
                      onClick={() => {
                        setSelectedSupplier(sup);
                        setShowLedger(true);
                      }}
                    >
                      <FileText size={14} className="mr-2" />
                      Ledger
                    </Button>
                    <Button variant="outline" className="flex-1 glass border-slate-800 text-xs h-9">
                      <ExternalLink size={14} className="mr-2" />
                      Orders
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Supplier Ledger Dialog */}
      <Dialog open={showLedger} onOpenChange={setShowLedger}>
        <DialogContent className="glass border-slate-800 text-slate-100 max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <FileText className="text-blue-400" size={20} />
              </div>
              <div>
                <p className="text-lg font-bold">Supplier Ledger: {selectedSupplier?.name}</p>
                <p className="text-xs text-slate-500 uppercase tracking-widest">Transaction History & Outstanding</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6">
            <Card className="glass border-slate-800 bg-blue-500/5">
              <CardContent className="p-4">
                <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Total Purchases</p>
                <h4 className="text-xl font-bold text-slate-100">₹4,25,600</h4>
              </CardContent>
            </Card>
            <Card className="glass border-slate-800 bg-emerald-500/5">
              <CardContent className="p-4">
                <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Total Paid</p>
                <h4 className="text-xl font-bold text-emerald-400">₹3,80,000</h4>
              </CardContent>
            </Card>
            <Card className="glass border-slate-800 bg-red-500/5">
              <CardContent className="p-4">
                <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Outstanding Balance</p>
                <h4 className="text-xl font-bold text-red-400">₹45,600</h4>
              </CardContent>
            </Card>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar rounded-2xl border border-slate-800">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-900 z-10">
                <tr className="border-b border-slate-800">
                  <th className="p-4 text-[10px] uppercase font-bold text-slate-500">Date</th>
                  <th className="p-4 text-[10px] uppercase font-bold text-slate-500">Voucher Type</th>
                  <th className="p-4 text-[10px] uppercase font-bold text-slate-500">Reference</th>
                  <th className="p-4 text-[10px] uppercase font-bold text-slate-500">Debit (Paid)</th>
                  <th className="p-4 text-[10px] uppercase font-bold text-slate-500">Credit (Purchase)</th>
                  <th className="p-4 text-[10px] uppercase font-bold text-slate-500 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {[
                  { date: "2024-03-15", type: "Purchase", ref: "PUR-8821", debit: 0, credit: 45600, bal: 45600 },
                  { date: "2024-03-10", type: "Payment", ref: "CHQ-102", debit: 50000, credit: 0, bal: 0 },
                  { date: "2024-03-05", type: "Purchase", ref: "PUR-8750", debit: 0, credit: 50000, bal: 50000 },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-slate-900/30 transition-colors">
                    <td className="p-4 text-xs text-slate-400">{row.date}</td>
                    <td className="p-4 text-xs font-medium">{row.type}</td>
                    <td className="p-4 text-xs font-mono text-slate-500">{row.ref}</td>
                    <td className="p-4 text-xs text-emerald-400">{row.debit > 0 ? `₹${row.debit}` : "-"}</td>
                    <td className="p-4 text-xs text-red-400">{row.credit > 0 ? `₹${row.credit}` : "-"}</td>
                    <td className="p-4 text-xs font-bold text-right">₹{row.bal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-6 flex gap-3">
            <Button className="flex-1 glass border-slate-800 text-blue-400">
              <Plus size={16} className="mr-2" />
              New Payment
            </Button>
            <Button className="flex-1 premium-gradient border-none">
              Download Statement
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
