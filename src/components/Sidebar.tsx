import React from "react";
import { motion } from "motion/react";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Activity, 
  Settings, 
  LogOut,
  Stethoscope,
  FileText,
  CreditCard,
  Package,
  ShoppingCart,
  Truck,
  BarChart3,
  Download,
  Monitor,
  Smartphone,
  Globe
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/src/lib/firebase";
import { usePWAInstall } from "@/src/hooks/usePWAInstall";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "customers", label: "Customers", icon: Users },
  { id: "pos", label: "Pharmacy POS", icon: ShoppingCart },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "suppliers", label: "Suppliers", icon: Truck },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "analytics", label: "Analytics", icon: Activity },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { isInstallable, installApp } = usePWAInstall();
  const [showInstallGuide, setShowInstallGuide] = React.useState(false);

  return (
    <aside className="w-72 border-r border-slate-800 p-6 flex flex-col h-screen bg-slate-950/50 backdrop-blur-xl shrink-0">
      <div className="mb-10 px-4 shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/30">
            <ShoppingCart className="text-blue-400" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gradient">
            KripaSindhu
          </h1>
        </div>
        <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-semibold">
          Pharmacy Gold Retail
        </p>
      </div>

      <nav className="space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <motion.button
              key={item.id}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center p-3.5 rounded-xl transition-all duration-300 group relative",
                isActive 
                  ? "bg-blue-600/10 text-blue-400 border border-blue-500/20" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Icon size={20} className={cn("mr-4", isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300")} />
              <span className="font-medium">{item.label}</span>
            </motion.button>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-slate-800 space-y-4">
        <button 
          className={cn(
            "w-full flex items-center gap-3 p-3 rounded-xl transition-all",
            isInstallable 
              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700" 
              : "bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600/20"
          )}
          onClick={() => {
            if (isInstallable) {
              installApp();
            } else {
              setShowInstallGuide(true);
            }
          }}
        >
          <Download size={18} />
          <span className="text-xs font-bold uppercase tracking-wider">
            {isInstallable ? "Install Desktop App" : "Download Desktop App"}
          </span>
        </button>

        <Dialog open={showInstallGuide} onOpenChange={setShowInstallGuide}>
          <DialogContent className="glass border-slate-800 text-slate-100 max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Monitor className="text-blue-400" size={20} />
                Desktop App Installation
              </DialogTitle>
              <DialogDescription className="text-slate-400 pt-2">
                KripaSindhu is a Progressive Web App (PWA) that can be installed as a standalone desktop software.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="flex gap-4 p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
                <div className="p-2 rounded-xl bg-blue-500/10 h-fit">
                  <Globe className="text-blue-400" size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-200">Chrome / Edge</p>
                  <p className="text-xs text-slate-500 mt-1">Click the "Install" icon in the address bar or go to <span className="text-blue-400">Menu &gt; Save and Share &gt; Install App</span>.</p>
                </div>
              </div>
              <div className="flex gap-4 p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
                <div className="p-2 rounded-xl bg-emerald-500/10 h-fit">
                  <Smartphone className="text-emerald-400" size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-200">Mobile (iOS/Android)</p>
                  <p className="text-xs text-slate-500 mt-1">Tap the "Share" button and select <span className="text-emerald-400">"Add to Home Screen"</span>.</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-center">
                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Why Install?</p>
                <p className="text-xs text-slate-400 mt-1">Standalone window, faster access, and offline capabilities.</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-emerald-400 p-[1px]">
              <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center text-xs font-bold">
                SD
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Admin</p>
              <p className="text-sm font-semibold text-slate-200">Sanket Dike</p>
            </div>
          </div>
        </div>
        
        <button 
          onClick={logout}
          className="w-full flex items-center p-3.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-400/5 transition-all duration-300"
        >
          <LogOut size={20} className="mr-4" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
