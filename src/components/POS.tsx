import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  User, 
  Phone, 
  CreditCard, 
  Banknote, 
  QrCode,
  Printer,
  CheckCircle2,
  X,
  Keyboard,
  AlertOctagon,
  Layers,
  ScanLine,
  UserPlus
} from "lucide-react";
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  serverTimestamp,
  doc,
  getDocs,
  where
} from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CartItem {
  productId: string;
  name: string;
  batchNumber: string;
  quantity: number;
  price: number;
  gstRate: number;
  mrp: number;
  isNarcotic?: boolean;
  isH1?: boolean;
}

interface CustomerTab {
  id: string;
  name: string;
  phone: string;
  customerId: string;
  cart: CartItem[];
  paymentMethod: "Cash" | "UPI" | "Card";
}

export function POS() {
  const [tabs, setTabs] = useState<CustomerTab[]>([
    { id: "1", name: "", phone: "", customerId: "", cart: [], paymentMethod: "Cash" }
  ]);
  const [activeTabId, setActiveTabId] = useState("1");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showNarcoticAlert, setShowNarcoticAlert] = useState<string | null>(null);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  // Shortcut Keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "F4") {
        e.preventDefault();
        handleCheckout();
      }
      if (e.key === "F8") {
        e.preventDefault();
        addNewTab();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab]);

  useEffect(() => {
    if (search.length < 2) {
      setSearchResults([]);
      return;
    }
    const fetchProducts = async () => {
      const q = query(collection(db, "inventory"));
      const snapshot = await getDocs(q);
      const results = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .filter((p: any) => 
          p.name.toLowerCase().includes(search.toLowerCase()) || 
          p.barcode === search
        );
      setSearchResults(results);
      
      // Auto-add if exact barcode match
      if (results.length === 1 && results[0].barcode === search) {
        addToCart(results[0]);
      }
    };
    fetchProducts();
  }, [search]);

  useEffect(() => {
    if (customerSearch.length < 2) {
      setCustomerResults([]);
      return;
    }
    const fetchCustomers = async () => {
      const q = query(collection(db, "customers"));
      const snapshot = await getDocs(q);
      const results = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .filter((c: any) => 
          c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
          c.phone?.includes(customerSearch)
        );
      setCustomerResults(results);
    };
    fetchCustomers();
  }, [customerSearch]);

  const updateActiveTab = (updates: Partial<CustomerTab>) => {
    setTabs(tabs.map(t => t.id === activeTabId ? { ...t, ...updates } : t));
  };

  const addNewTab = () => {
    const newId = (Math.max(...tabs.map(t => parseInt(t.id))) + 1).toString();
    setTabs([...tabs, { id: newId, name: "", phone: "", customerId: "", cart: [], paymentMethod: "Cash" }]);
    setActiveTabId(newId);
  };

  const removeTab = (id: string) => {
    if (tabs.length === 1) return;
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) setActiveTabId(newTabs[0].id);
  };

  const [showSimilarProducts, setShowSimilarProducts] = useState<any[]>([]);
  const [similarSearchTerm, setSimilarSearchTerm] = useState("");
  const [showError, setShowError] = useState<string | null>(null);

  const fetchSimilarProducts = async (salt: string) => {
    if (!salt) return;
    const q = query(collection(db, "inventory"), where("salt", "==", salt));
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setShowSimilarProducts(results);
  };

  const addToCart = (product: any) => {
    // Check for expiry if batch info is available
    if (product.expiryDate && new Date(product.expiryDate) < new Date()) {
      setShowError(`Cannot add expired item: ${product.name}`);
      setTimeout(() => setShowError(null), 3000);
      return;
    }

    if (product.category === "Narcotic" || product.isNarcotic) {
      setShowNarcoticAlert(product.name);
    }

    const existing = activeTab.cart.find(item => item.productId === product.id);
    let newCart;
    if (existing) {
      newCart = activeTab.cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      );
    } else {
      newCart = [...activeTab.cart, {
        productId: product.id,
        name: product.name,
        batchNumber: "B" + Math.floor(Math.random() * 1000),
        quantity: 1,
        price: product.salePrice || 150,
        gstRate: product.gstRate || 12,
        mrp: product.mrp || 180,
        isNarcotic: product.category === "Narcotic" || product.isNarcotic,
        isH1: product.isH1
      }];
    }
    updateActiveTab({ cart: newCart });
    setSearch("");
    setSearchResults([]);
  };

  const selectCustomer = (customer: any) => {
    updateActiveTab({ 
      name: customer.name, 
      phone: customer.phone || "", 
      customerId: customer.id 
    });
    setCustomerSearch("");
    setCustomerResults([]);
  };

  const updateQuantity = (id: string, delta: number) => {
    const newCart = activeTab.cart.map(item => {
      if (item.productId === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    });
    updateActiveTab({ cart: newCart });
  };

  const removeFromCart = (id: string) => {
    updateActiveTab({ cart: activeTab.cart.filter(item => item.productId !== id) });
  };

  const subtotal = activeTab.cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalGst = activeTab.cart.reduce((acc, item) => acc + (item.price * item.quantity * item.gstRate / 100), 0);
  const total = subtotal + totalGst;

  const handleCheckout = async () => {
    if (activeTab.cart.length === 0) return;
    setIsProcessing(true);
    try {
      await addDoc(collection(db, "retail_sales"), {
        customerName: activeTab.name || "Walk-in Customer",
        customerPhone: activeTab.phone,
        customerId: activeTab.customerId || "walk-in",
        items: activeTab.cart.map(item => ({
          productId: item.productId,
          productName: item.name,
          batchNumber: item.batchNumber,
          quantity: item.quantity,
          price: item.price,
          gstAmount: (item.price * item.quantity * item.gstRate / 100)
        })),
        totalAmount: total,
        paymentMethod: activeTab.paymentMethod,
        date: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      
      if (tabs.length > 1) {
        removeTab(activeTabId);
      } else {
        updateActiveTab({ name: "", phone: "", customerId: "", cart: [], paymentMethod: "Cash" });
      }
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] gap-4">
      {/* Tab Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab, idx) => (
          <div 
            key={tab.id}
            className={cn(
              "flex items-center gap-3 px-4 py-2 rounded-xl border transition-all cursor-pointer min-w-[160px]",
              activeTabId === tab.id 
                ? "bg-blue-600/20 border-blue-500 text-blue-400" 
                : "glass border-slate-800 text-slate-500 hover:border-slate-700"
            )}
            onClick={() => setActiveTabId(tab.id)}
          >
            <User size={14} />
            <span className="text-sm font-medium truncate flex-1">
              {tab.name || `Customer ${idx + 1}`}
            </span>
            {tabs.length > 1 && (
              <X 
                size={14} 
                className="hover:text-red-400" 
                onClick={(e) => {
                  e.stopPropagation();
                  removeTab(tab.id);
                }}
              />
            )}
          </div>
        ))}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={addNewTab}
          className="glass border-slate-800 text-slate-400 hover:text-blue-400"
        >
          <Plus size={18} />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
        {/* Left: Product Selection */}
        <div className="lg:col-span-2 space-y-4 flex flex-col overflow-hidden">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <Input 
              ref={searchInputRef}
              autoFocus
              placeholder="Search (F2) or Scan Barcode..." 
              className="pl-12 h-14 text-lg glass border-slate-800 focus:border-blue-500/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchResults.length === 1) {
                  addToCart(searchResults[0]);
                }
              }}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-500">
                      <ScanLine size={18} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Barcode Mode Active</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 glass border-slate-800 rounded-2xl overflow-hidden z-50 shadow-2xl max-h-[400px] overflow-y-auto"
                >
                  {searchResults.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="w-full p-4 flex items-center justify-between hover:bg-blue-500/10 transition-colors border-b border-slate-800 last:border-none"
                    >
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-100">{product.name}</p>
                          {(product.category === "Narcotic" || product.isNarcotic) && (
                            <Badge className="bg-red-500/10 text-red-400 border-none text-[8px]">NARCOTIC</Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{product.salt}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-blue-400">₹{product.salePrice || 150}</p>
                        <p className="text-[10px] text-slate-600 uppercase font-bold">Stock: {product.totalStock || 0}</p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-1 glass rounded-3xl border-slate-800 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/30">
              <h3 className="font-bold flex items-center gap-2 text-sm">
                <ShoppingCart size={16} className="text-blue-400" />
                Bill Items
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase">
                  <Keyboard size={14} />
                  F4: Checkout | F8: New Tab
                </div>
                <Badge variant="outline" className="glass border-blue-500/30 text-blue-400">
                  {activeTab.cart.length} Items
                </Badge>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeTab.cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600">
                  <ShoppingCart size={48} className="mb-4 opacity-10" />
                  <p className="italic text-sm">Cart is empty. Press F2 to search.</p>
                </div>
              ) : (
                activeTab.cart.map((item) => (
                  <motion.div 
                    key={item.productId}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/30 border border-slate-800 group"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-200 text-sm">{item.name}</p>
                        {item.isNarcotic && <AlertOctagon size={12} className="text-red-400" />}
                      </div>
                      <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Batch: {item.batchNumber} • MRP: ₹{item.mrp}</p>
                    </div>
                    
                      <div className="flex items-center gap-4">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-600 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all"
                          onClick={() => {
                            setSimilarSearchTerm(item.name);
                            // In a real app, you'd fetch by salt
                            fetchSimilarProducts("Paracetamol"); // Mock salt for demo
                          }}
                        >
                          <Layers size={14} />
                        </Button>
                        
                        <div className="flex items-center gap-2 bg-slate-950 rounded-lg p-1 border border-slate-800">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-slate-400 hover:text-white"
                          onClick={() => updateQuantity(item.productId, -1)}
                        >
                          <Minus size={12} />
                        </Button>
                        <span className="w-6 text-center text-xs font-bold text-blue-400">{item.quantity}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-slate-400 hover:text-white"
                          onClick={() => updateQuantity(item.productId, 1)}
                        >
                          <Plus size={12} />
                        </Button>
                      </div>
                      
                      <div className="text-right min-w-[70px]">
                        <p className="font-bold text-slate-100 text-sm">₹{(item.price * item.quantity).toFixed(2)}</p>
                        <p className="text-[9px] text-slate-500">GST: ₹{(item.price * item.quantity * item.gstRate / 100).toFixed(2)}</p>
                      </div>

                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        onClick={() => removeFromCart(item.productId)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Checkout Sidebar */}
        <div className="space-y-4 overflow-y-auto pr-1">
          <Card className="glass border-slate-800">
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-blue-400" />
                  Customer Info
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-400">
                  <UserPlus size={14} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <div className="relative">
                <Label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Search Customer</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                  <Input 
                    placeholder="Search by name or phone..." 
                    className="pl-9 glass border-slate-800 h-9 text-sm"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                  />
                </div>
                <AnimatePresence>
                  {customerResults.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute top-full left-0 right-0 mt-1 glass border-slate-800 rounded-xl overflow-hidden z-[60] shadow-xl"
                    >
                      {customerResults.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => selectCustomer(c)}
                          className="w-full p-2 text-left hover:bg-blue-500/10 transition-colors border-b border-slate-800 last:border-none"
                        >
                          <p className="text-xs font-bold text-slate-100">{c.name}</p>
                          <p className="text-[10px] text-slate-500">{c.phone}</p>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] text-slate-500 uppercase font-bold">Name</Label>
                  <Input 
                    placeholder="Walk-in" 
                    className="glass border-slate-800 h-9 text-xs"
                    value={activeTab.name}
                    onChange={(e) => updateActiveTab({ name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-slate-500 uppercase font-bold">Phone</Label>
                  <Input 
                    placeholder="Mobile No." 
                    className="glass border-slate-800 h-9 text-xs"
                    value={activeTab.phone}
                    onChange={(e) => updateActiveTab({ phone: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-slate-800">
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CreditCard size={16} className="text-blue-400" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 grid grid-cols-3 gap-2">
              {[
                { id: "Cash", icon: Banknote },
                { id: "UPI", icon: QrCode },
                { id: "Card", icon: CreditCard },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => updateActiveTab({ paymentMethod: method.id as any })}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all",
                    activeTab.paymentMethod === method.id 
                      ? "bg-blue-600/10 border-blue-500 text-blue-400 shadow-lg shadow-blue-500/10" 
                      : "bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700"
                  )}
                >
                  <method.icon size={16} />
                  <span className="text-[9px] font-bold uppercase">{method.id}</span>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="glass border-slate-800 bg-blue-600/5">
            <CardContent className="p-5 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="text-slate-200 font-medium">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Total GST</span>
                  <span className="text-slate-200 font-medium">₹{totalGst.toFixed(2)}</span>
                </div>
                <div className="pt-3 border-t border-slate-800 flex justify-between items-end">
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Total</span>
                  <span className="text-2xl font-bold text-blue-400">₹{total.toFixed(2)}</span>
                </div>
              </div>
              
              <Button 
                className="w-full h-12 premium-gradient border-none text-md font-bold shadow-lg shadow-blue-500/20"
                disabled={activeTab.cart.length === 0 || isProcessing}
                onClick={handleCheckout}
              >
                {isProcessing ? "Processing..." : "Complete Sale (F4)"}
              </Button>
              
              <Button variant="ghost" className="w-full h-10 text-slate-500 hover:text-slate-300 text-xs">
                <Printer size={16} className="mr-2" />
                Print Receipt
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Similar Products Dialog */}
      <Dialog open={showSimilarProducts.length > 0} onOpenChange={(open) => !open && setShowSimilarProducts([])}>
        <DialogContent className="glass border-slate-800 text-slate-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="text-blue-400" size={20} />
              Similar Products for {similarSearchTerm}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {showSimilarProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => {
                  addToCart(product);
                  setShowSimilarProducts([]);
                }}
                className="w-full p-4 flex items-center justify-between glass border-slate-800 rounded-2xl hover:bg-blue-500/10 transition-all text-left"
              >
                <div>
                  <p className="font-bold text-slate-100">{product.name}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{product.manufacturer}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-blue-400">₹{product.salePrice || 150}</p>
                  <p className="text-[10px] text-slate-600 uppercase font-bold">Stock: {product.totalStock || 0}</p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Toast */}
      <AnimatePresence>
        {showError && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[120] glass border-red-500/50 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl shadow-red-500/20"
          >
            <AlertOctagon size={20} className="text-red-400" />
            <span className="text-sm font-medium text-slate-200">{showError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Narcotic Alert Overlay */}
      <AnimatePresence>
        {showNarcoticAlert && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-red-950/20 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass p-8 rounded-[32px] border-red-500/30 text-center max-w-sm shadow-2xl shadow-red-500/20"
            >
              <div className="h-16 w-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                <AlertOctagon size={32} className="text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-100 mb-2">Narcotic Drug Alert!</h2>
              <p className="text-sm text-slate-400 mb-6">
                <span className="text-red-400 font-bold">{showNarcoticAlert}</span> is a Narcotic/H1 drug. 
                Please ensure you follow restricted drug protocols and record the details.
              </p>
              <Button className="w-full bg-red-500 hover:bg-red-600 text-white font-bold" onClick={() => setShowNarcoticAlert(null)}>
                I Confirm
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass p-10 rounded-[40px] border-emerald-500/30 text-center max-w-sm"
            >
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-100 mb-2">Sale Successful!</h2>
              <p className="text-sm text-slate-400 mb-6">Transaction recorded and inventory updated.</p>
              <Button className="w-full glass border-slate-800" onClick={() => setShowSuccess(false)}>
                Close
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
