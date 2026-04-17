import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Bell, HelpCircle, User, LogIn, Stethoscope } from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { Customers } from "./components/Customers";
import { Billing } from "./components/Billing";
import { Analytics } from "./components/Analytics";
import { Settings } from "./components/Settings";
import { Inventory } from "./components/Inventory";
import { POS } from "./components/POS";
import { Suppliers } from "./components/Suppliers";
import { Reports } from "./components/Reports";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "./components/FirebaseProvider";
import { signInWithGoogle } from "./lib/firebase";

import { NotificationCenter } from "./components/NotificationCenter";
import { Zap } from "lucide-react";

export default function App() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-slate-400 font-medium animate-pulse">Initializing KripaSindhu...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-950 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/10 blur-[150px] rounded-full -mr-96 -mt-96" />
        <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-emerald-600/10 blur-[150px] rounded-full -ml-96 -mb-96" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-12 rounded-[40px] border-slate-800 w-full max-w-md relative z-10 text-center"
        >
          <div className="flex justify-center mb-8">
            <div className="p-4 rounded-3xl bg-blue-600/20 border border-blue-500/30">
              <Stethoscope className="text-blue-400" size={40} />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-gradient mb-2">KripaSindhu</h1>
          <p className="text-slate-400 mb-10">Premium Pharmacy Retail & SaaS</p>
          
          <div className="space-y-4">
            <Button 
              onClick={signInWithGoogle}
              className="w-full h-14 rounded-2xl bg-white text-slate-950 hover:bg-slate-100 font-bold flex items-center justify-center gap-3 transition-all"
            >
              <LogIn size={20} />
              Sign in with Google
            </Button>
            <p className="text-xs text-slate-500 px-4">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
          
          <div className="mt-12 pt-8 border-t border-slate-800/50">
            <p className="text-sm text-slate-500">Built for Dr. Sanket Dike</p>
          </div>
        </motion.div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "customers":
        return <Customers />;
      case "billing":
        return <Billing />;
      case "inventory":
        return <Inventory />;
      case "pos":
        return <POS />;
      case "suppliers":
        return <Suppliers />;
      case "reports":
        return <Reports />;
      case "analytics":
        return <Analytics />;
      case "settings":
        return <Settings />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center">
            <h2 className="text-2xl font-bold capitalize">{activeTab} Module</h2>
            <p className="text-slate-400">Coming soon...</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-50 font-sans selection:bg-blue-500/30 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 overflow-y-auto relative">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full -mr-48 -mt-48 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-600/5 blur-[120px] rounded-full -ml-48 -mb-48 pointer-events-none" />

        <div className="max-w-7xl mx-auto p-8 relative z-10">
          <header className="flex justify-between items-center mb-10">
            <div>
              <motion.h2 
                key={activeTab}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl font-bold tracking-tight text-slate-100"
              >
                {activeTab === 'dashboard' ? 'Welcome back, Sanket' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </motion.h2>
              <p className="text-slate-400 mt-1">
                {activeTab === 'dashboard' ? 'Here is what\'s happening with KripaSindhu today.' : `Manage your ${activeTab} and records.`}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Button 
                onClick={() => setActiveTab("pos")}
                className="hidden lg:flex premium-gradient border-none h-10 px-6 font-bold shadow-lg shadow-blue-500/20"
              >
                <Zap size={16} className="mr-2 fill-current" />
                Quick Sale
              </Button>

              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <Input 
                  placeholder="Quick search..." 
                  className="w-48 xl:w-64 pl-10 glass border-slate-800 focus:ring-blue-500/50"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <NotificationCenter />
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-100 hover:bg-slate-900">
                  <HelpCircle size={20} />
                </Button>
                <div className="h-10 w-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center cursor-pointer hover:border-blue-500/50 transition-all">
                  <User size={20} className="text-slate-400" />
                </div>
              </div>
            </div>
          </header>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
