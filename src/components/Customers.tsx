import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Filter,
  Download,
  UserPlus
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
import { cn } from "@/lib/utils";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Customer {
  id: string;
  name: string;
  age: number;
  gender: string;
  lastVisit: any;
  diagnosis: string;
  status: string;
  phone?: string;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

export function Customers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    age: "",
    gender: "Male",
    status: "Active"
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const path = "customers";
    const q = query(collection(db, path), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const customerData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Customer[];
      setCustomers(customerData);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddCustomer = async () => {
    if (!user) return;
    const path = "customers";
    try {
      await addDoc(collection(db, path), {
        ...newCustomer,
        age: parseInt(newCustomer.age) || 0,
        lastVisit: serverTimestamp(),
        createdAt: serverTimestamp(),
        createdBy: user.uid
      });
      setIsDialogOpen(false);
      setNewCustomer({ name: "", phone: "", age: "", gender: "Male", status: "Active" });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const filteredCustomers = customers.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.phone && p.phone.includes(search))
  );

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Customer Management</h2>
          <p className="text-slate-400 text-sm">View and manage all pharmacy customers.</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <Button variant="outline" className="glass border-slate-800 hover:bg-slate-900">
            <Download size={18} className="mr-2" />
            Export
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="premium-gradient border-none shadow-lg shadow-blue-500/20">
                <Plus size={18} className="mr-2" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-slate-800 text-slate-100">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Register New Customer</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right text-xs uppercase font-bold text-slate-500">Name</Label>
                  <Input 
                    id="name" 
                    className="col-span-3 glass border-slate-700" 
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right text-xs uppercase font-bold text-slate-500">Phone</Label>
                  <Input 
                    id="phone" 
                    className="col-span-3 glass border-slate-700" 
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="age" className="text-right text-xs uppercase font-bold text-slate-500">Age</Label>
                  <Input 
                    id="age" 
                    type="number" 
                    className="col-span-3 glass border-slate-700" 
                    value={newCustomer.age}
                    onChange={(e) => setNewCustomer({...newCustomer, age: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="gender" className="text-right text-xs uppercase font-bold text-slate-500">Gender</Label>
                  <select 
                    id="gender" 
                    className="col-span-3 glass border-slate-700 bg-slate-900 rounded-md p-2 text-sm"
                    value={newCustomer.gender}
                    onChange={(e) => setNewCustomer({...newCustomer, gender: e.target.value})}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline" className="glass border-slate-700" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button className="premium-gradient border-none" onClick={handleAddCustomer}>Save Customer</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <Input 
            placeholder="Search by name, phone..." 
            className="pl-10 glass border-slate-800 focus:ring-blue-500/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="glass border-slate-800">
          <Filter size={18} className="mr-2" />
          Filters
        </Button>
      </div>

      <div className="glass rounded-3xl overflow-hidden border-slate-800">
        <Table>
          <TableHeader className="bg-slate-900/50">
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Customer</TableHead>
              <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Contact</TableHead>
              <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Age/Gender</TableHead>
              <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Last Visit</TableHead>
              <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Status</TableHead>
              <TableHead className="text-right text-slate-400 font-bold uppercase text-[10px] tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-500 italic">
                    Loading customer records...
                  </TableCell>
                </TableRow>
              ) : filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-500 italic">
                    No customers found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer, i) => (
                  <motion.tr
                    key={customer.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-slate-800 hover:bg-slate-900/30 transition-colors group"
                  >
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-blue-400 border border-slate-700">
                          {customer.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="font-semibold text-slate-200">{customer.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-400">
                      {customer.phone || "N/A"}
                    </TableCell>
                    <TableCell className="text-slate-400">
                      {customer.age}y / {customer.gender}
                    </TableCell>
                    <TableCell className="text-slate-400">
                      {formatDate(customer.lastVisit)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        "border-none px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        customer.status === 'Active' ? "bg-emerald-500/10 text-emerald-400" : 
                        customer.status === 'Inactive' ? "bg-red-500/10 text-red-400" :
                        "bg-slate-500/10 text-slate-400"
                      )}>
                        {customer.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-200 hover:bg-slate-800">
                        <MoreHorizontal size={18} />
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}


