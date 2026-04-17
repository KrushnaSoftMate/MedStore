import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  Filter, 
  MoreVertical,
  Layers,
  Calendar,
  Tag,
  Factory,
  BarChart3
} from "lucide-react";
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  serverTimestamp,
  doc,
  collectionGroup
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
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  category: string;
  salt: string;
  manufacturer: string;
  hsnCode: string;
  gstRate: number;
  reorderLevel: number;
  isNarcotic: boolean;
  isH1: boolean;
  barcode?: string;
  totalStock?: number;
}

interface Batch {
  id: string;
  productId: string;
  batchNumber: string;
  expiryDate: string;
  purchasePrice: number;
  mrp: number;
  salePrice: number;
  currentStock: number;
}

export function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [newBatch, setNewBatch] = useState({
    batchNumber: "",
    expiryDate: "",
    purchasePrice: 0,
    mrp: 0,
    salePrice: 0,
    currentStock: 0
  });
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "Tablet",
    salt: "",
    manufacturer: "",
    hsnCode: "",
    gstRate: 12,
    reorderLevel: 50,
    isNarcotic: false,
    isH1: false,
    barcode: ""
  });

  useEffect(() => {
    const q = query(collection(db, "inventory"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!selectedProduct) return;
    const q = query(collection(db, "inventory", selectedProduct.id, "batches"), orderBy("expiryDate", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Batch[];
      setBatches(data);
    });
    return () => unsubscribe();
  }, [selectedProduct]);

  const handleAddBatch = async () => {
    if (!selectedProduct || !newBatch.batchNumber) return;
    try {
      await addDoc(collection(db, "inventory", selectedProduct.id, "batches"), {
        ...newBatch,
        productId: selectedProduct.id,
        createdAt: serverTimestamp()
      });
      setNewBatch({
        batchNumber: "",
        expiryDate: "",
        purchasePrice: 0,
        mrp: 0,
        salePrice: 0,
        currentStock: 0
      });
    } catch (error) {
      console.error("Error adding batch:", error);
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name) return;
    try {
      await addDoc(collection(db, "inventory"), {
        ...newProduct,
        createdAt: serverTimestamp()
      });
      setIsDialogOpen(false);
      setNewProduct({
        name: "",
        category: "Tablet",
        salt: "",
        manufacturer: "",
        hsnCode: "",
        gstRate: 12,
        reorderLevel: 50,
        isNarcotic: false,
        isH1: false,
        barcode: ""
      });
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.salt.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Pharmacy Inventory</h2>
          <p className="text-slate-400 text-sm">Manage medicines, stock levels, and expiry tracking.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="glass border-slate-800">
            <AlertTriangle size={18} className="mr-2 text-amber-400" />
            Expiry Alerts
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="premium-gradient border-none">
                <Plus size={18} className="mr-2" />
                Add New Item
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-slate-800 text-slate-100 max-w-xl">
              <DialogHeader>
                <DialogTitle>Add New Medicine/Product</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="col-span-2 space-y-2">
                  <Label>Product Name</Label>
                  <Input 
                    className="glass border-slate-700" 
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select 
                    className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-sm"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                  >
                    <option>Tablet</option>
                    <option>Capsule</option>
                    <option>Syrup</option>
                    <option>Injection</option>
                    <option>Ointment</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>GST Rate (%)</Label>
                  <Input 
                    type="number"
                    className="glass border-slate-700" 
                    value={newProduct.gstRate}
                    onChange={(e) => setNewProduct({...newProduct, gstRate: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Salt/Composition</Label>
                  <Input 
                    className="glass border-slate-700" 
                    value={newProduct.salt}
                    onChange={(e) => setNewProduct({...newProduct, salt: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Manufacturer</Label>
                  <Input 
                    className="glass border-slate-700" 
                    value={newProduct.manufacturer}
                    onChange={(e) => setNewProduct({...newProduct, manufacturer: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reorder Level</Label>
                  <Input 
                    type="number"
                    className="glass border-slate-700" 
                    value={newProduct.reorderLevel}
                    onChange={(e) => setNewProduct({...newProduct, reorderLevel: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Barcode</Label>
                  <Input 
                    className="glass border-slate-700" 
                    value={newProduct.barcode}
                    onChange={(e) => setNewProduct({...newProduct, barcode: e.target.value})}
                  />
                </div>
                <div className="col-span-2 flex gap-6 pt-2">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="narcotic" 
                      checked={newProduct.isNarcotic}
                      onChange={(e) => setNewProduct({...newProduct, isNarcotic: e.target.checked})}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-900"
                    />
                    <Label htmlFor="narcotic" className="text-xs">Narcotic Drug</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="h1" 
                      checked={newProduct.isH1}
                      onChange={(e) => setNewProduct({...newProduct, isH1: e.target.checked})}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-900"
                    />
                    <Label htmlFor="h1" className="text-xs">H1 Schedule</Label>
                  </div>
                </div>
              </div>
              <Button className="premium-gradient border-none w-full h-12 text-lg font-bold" onClick={handleAddProduct}>
                Save Product
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Items", value: products.length.toString(), icon: Package, color: "blue" },
          { label: "Low Stock Items", value: "12", icon: AlertTriangle, color: "amber" },
          { label: "Expiring Soon", value: "8", icon: Calendar, color: "red" },
        ].map((stat, i) => (
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
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <Input 
              placeholder="Search by medicine name or composition..." 
              className="pl-10 glass border-slate-800"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" className="glass border-slate-800">
            <Filter size={18} className="mr-2" />
            Filter
          </Button>
        </div>

        <div className="glass rounded-3xl overflow-hidden border-slate-800">
          <Table>
            <TableHeader className="bg-slate-900/50">
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Product Name</TableHead>
                <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Manufacturer</TableHead>
                <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Category</TableHead>
                <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Stock</TableHead>
                <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">GST</TableHead>
                <TableHead className="text-right text-slate-400 font-bold uppercase text-[10px] tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id} className="border-slate-800 hover:bg-slate-900/30 transition-colors group">
                  <TableCell>
                    <div>
                      <p className="font-bold text-slate-200">{product.name}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{product.salt}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-400 text-sm">{product.manufacturer}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-slate-800 text-slate-500 text-[10px]">
                      {product.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-bold",
                        (product.totalStock || 0) < product.reorderLevel ? "text-amber-400" : "text-slate-200"
                      )}>
                        {product.totalStock || 0}
                      </span>
                      {(product.totalStock || 0) < product.reorderLevel && (
                        <AlertTriangle size={12} className="text-amber-400" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-400">{product.gstRate}%</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-slate-500 hover:text-blue-400"
                      onClick={() => {
                        setSelectedProduct(product);
                        setIsBatchDialogOpen(true);
                      }}
                    >
                      <Layers size={18} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Batch Management Dialog */}
      <Dialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}>
        <DialogContent className="glass border-slate-800 text-slate-100 max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="text-blue-400" size={20} />
              Manage Batches: {selectedProduct?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
            <div className="md:col-span-1 space-y-4">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Add New Batch</h4>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-[10px]">Batch Number</Label>
                  <Input 
                    className="glass border-slate-700 h-9 text-sm" 
                    value={newBatch.batchNumber}
                    onChange={(e) => setNewBatch({...newBatch, batchNumber: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Expiry Date</Label>
                  <Input 
                    type="date"
                    className="glass border-slate-700 h-9 text-sm" 
                    value={newBatch.expiryDate}
                    onChange={(e) => setNewBatch({...newBatch, expiryDate: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]">MRP</Label>
                    <Input 
                      type="number"
                      className="glass border-slate-700 h-9 text-sm" 
                      value={newBatch.mrp}
                      onChange={(e) => setNewBatch({...newBatch, mrp: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Stock</Label>
                    <Input 
                      type="number"
                      className="glass border-slate-700 h-9 text-sm" 
                      value={newBatch.currentStock}
                      onChange={(e) => setNewBatch({...newBatch, currentStock: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
                <Button className="w-full premium-gradient border-none h-10" onClick={handleAddBatch}>
                  Add Batch
                </Button>
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Active Batches</h4>
              <div className="glass rounded-2xl overflow-hidden border-slate-800">
                <Table>
                  <TableHeader className="bg-slate-900/50">
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-[10px] uppercase">Batch</TableHead>
                      <TableHead className="text-[10px] uppercase">Expiry</TableHead>
                      <TableHead className="text-[10px] uppercase">MRP</TableHead>
                      <TableHead className="text-[10px] uppercase">Stock</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-slate-500 italic text-xs py-8">
                          No batches found for this product.
                        </TableCell>
                      </TableRow>
                    ) : (
                      batches.map((batch) => {
                        const isExpiringSoon = new Date(batch.expiryDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
                        const isExpired = new Date(batch.expiryDate) < new Date();
                        
                        return (
                          <TableRow key={batch.id} className="border-slate-800 hover:bg-slate-900/30">
                            <TableCell className="font-bold text-xs">{batch.batchNumber}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-xs",
                                  isExpired ? "text-red-400 font-bold" : isExpiringSoon ? "text-amber-400" : "text-slate-400"
                                )}>
                                  {batch.expiryDate}
                                </span>
                                {isExpired && <Badge className="bg-red-500/10 text-red-400 text-[8px] border-none">EXPIRED</Badge>}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">₹{batch.mrp}</TableCell>
                            <TableCell className="text-xs font-bold">{batch.currentStock}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
