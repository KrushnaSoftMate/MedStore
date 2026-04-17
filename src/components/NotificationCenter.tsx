import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Bell, 
  X, 
  AlertTriangle, 
  Calendar, 
  Info,
  CheckCircle2,
  Trash2
} from "lucide-react";
import { collection, query, onSnapshot, where, getDocs } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { cn } from "@/lib/utils";
import { format, addDays } from "date-fns";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  timestamp: Date;
  read: boolean;
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // 1. Listen for Low Stock and Expiry
    const qInv = query(collection(db, "inventory"));
    const unsubInv = onSnapshot(qInv, async (snapshot) => {
      const newNotifications: Notification[] = [];
      
      for (const productDoc of snapshot.docs) {
        const data = productDoc.data();
        
        // Low Stock Check
        if (data.totalStock <= (data.reorderLevel || 10)) {
          newNotifications.push({
            id: `low-stock-${productDoc.id}`,
            title: "Low Stock Alert",
            message: `${data.name} is running low (${data.totalStock} left).`,
            type: "warning",
            timestamp: new Date(),
            read: false
          });
        }

        // Expiry Check (Check batches)
        const batchesSnap = await getDocs(collection(db, "inventory", productDoc.id, "batches"));
        batchesSnap.docs.forEach(batchDoc => {
          const batchData = batchDoc.data();
          const expiryDate = new Date(batchData.expiryDate);
          const today = new Date();
          const ninetyDaysFromNow = addDays(today, 90);

          if (expiryDate < today) {
            newNotifications.push({
              id: `expired-${batchDoc.id}`,
              title: "Product Expired!",
              message: `${data.name} (Batch: ${batchData.batchNumber}) has expired.`,
              type: "error",
              timestamp: new Date(),
              read: false
            });
          } else if (expiryDate < ninetyDaysFromNow) {
            newNotifications.push({
              id: `expiring-${batchDoc.id}`,
              title: "Expiring Soon",
              message: `${data.name} (Batch: ${batchData.batchNumber}) expires on ${batchData.expiryDate}.`,
              type: "warning",
              timestamp: new Date(),
              read: false
            });
          }
        });
      }
      
      setNotifications(prev => {
        const filtered = prev.filter(n => 
          !n.id.startsWith("low-stock-") && 
          !n.id.startsWith("expired-") && 
          !n.id.startsWith("expiring-")
        );
        return [...filtered, ...newNotifications].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      });
    });

    return () => unsubInv();
  }, []);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-blue-400 transition-all"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-slate-950">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[100]"
            />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-4 w-80 glass border-slate-800 rounded-2xl shadow-2xl z-[101] overflow-hidden"
            >
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <h3 className="font-bold text-sm">Notifications</h3>
                <button 
                  onClick={markAllAsRead}
                  className="text-[10px] uppercase font-bold text-blue-400 hover:text-blue-300"
                >
                  Mark all read
                </button>
              </div>

              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <Bell size={32} className="mx-auto mb-2 opacity-10" />
                    <p className="text-xs">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id}
                      className={cn(
                        "p-4 border-b border-slate-800/50 flex gap-3 group transition-colors",
                        !n.read ? "bg-blue-500/5" : "hover:bg-slate-900/30"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg h-fit",
                        n.type === "warning" ? "bg-amber-500/10 text-amber-400" :
                        n.type === "error" ? "bg-red-500/10 text-red-400" :
                        n.type === "success" ? "bg-emerald-500/10 text-emerald-400" :
                        "bg-blue-500/10 text-blue-400"
                      )}>
                        {n.type === "warning" ? <AlertTriangle size={14} /> :
                         n.type === "error" ? <AlertTriangle size={14} /> :
                         n.type === "success" ? <CheckCircle2 size={14} /> :
                         <Info size={14} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className={cn("text-xs font-bold", !n.read ? "text-slate-100" : "text-slate-400")}>
                            {n.title}
                          </p>
                          <button 
                            onClick={() => removeNotification(n.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-red-400 transition-all"
                          >
                            <X size={12} />
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          {n.message}
                        </p>
                        <p className="text-[9px] text-slate-600 mt-2">
                          {format(n.timestamp, "hh:mm a")}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-3 bg-slate-900/50 border-t border-slate-800 text-center">
                  <button 
                    onClick={() => setNotifications([])}
                    className="text-[10px] uppercase font-bold text-slate-500 hover:text-red-400 flex items-center justify-center gap-2 mx-auto"
                  >
                    <Trash2 size={12} />
                    Clear All
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
