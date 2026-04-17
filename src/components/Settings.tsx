import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  User, 
  Building, 
  Bell, 
  Shield, 
  Globe, 
  Mail,
  Phone,
  MapPin,
  Camera,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "./FirebaseProvider";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { cn } from "@/lib/utils";

export function Settings() {
  const { user, profile } = useAuth();
  const [activeSection, setActiveSection] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "+91 98765 43210",
    licenseNumber: "PH-123456789",
    pharmacyName: "KripaSindhu Pharmacy & Retail",
    pharmacyAddress: "123 Medical Square, Pune, Maharashtra"
  });

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        name: profile.name || "",
        email: profile.email || "",
        // Other fields could be loaded from a 'pharmacy_settings' collection if needed
      }));
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      // Update User Profile
      await updateDoc(doc(db, "users", user.uid), {
        name: formData.name,
        // In a real app, you'd also update pharmacy settings in a separate doc
      });
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Settings</h2>
          <p className="text-slate-400 text-sm">Manage your account and pharmacy preferences.</p>
        </div>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium"
          >
            <CheckCircle2 size={16} />
            Settings saved successfully
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Navigation */}
        <div className="lg:col-span-1 space-y-2">
          {[
            { id: "profile", label: "Profile Information", icon: User },
            { id: "pharmacy", label: "Pharmacy Details", icon: Building },
            { id: "notifications", label: "Notifications", icon: Bell },
            { id: "security", label: "Security & Privacy", icon: Shield },
            { id: "regional", label: "Regional Settings", icon: Globe },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={cn(
                "w-full flex items-center gap-3 p-4 rounded-2xl transition-all",
                activeSection === item.id 
                  ? "bg-blue-600/10 text-blue-400 border border-blue-500/20" 
                  : "text-slate-400 hover:bg-slate-900/50 hover:text-slate-200"
              )}
            >
              <item.icon size={20} />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-2 space-y-6">
          {activeSection === "profile" && (
            <Card className="glass border-slate-800">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription className="text-slate-500">Update your personal details and professional info.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <div className="h-24 w-24 rounded-3xl bg-gradient-to-tr from-blue-500 to-emerald-400 p-[2px]">
                      <div className="h-full w-full rounded-[22px] bg-slate-900 flex items-center justify-center overflow-hidden">
                        <User size={40} className="text-slate-700" />
                      </div>
                    </div>
                    <button className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera size={14} />
                    </button>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-100">{formData.name || "Dr. Sanket Dike"}</h4>
                    <p className="text-sm text-slate-500">Pharmacist • KripaSindhu</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input 
                      className="glass border-slate-800" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input 
                      className="glass border-slate-800" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input 
                      className="glass border-slate-800" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>License Number</Label>
                    <Input 
                      className="glass border-slate-800" 
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button 
                    className="premium-gradient border-none px-8" 
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                    Save Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === "pharmacy" && (
            <Card className="glass border-slate-800">
              <CardHeader>
                <CardTitle>Pharmacy Details</CardTitle>
                <CardDescription className="text-slate-500">Information about your pharmacy retail business.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Pharmacy Name</Label>
                  <Input 
                    className="glass border-slate-800" 
                    value={formData.pharmacyName}
                    onChange={(e) => setFormData({...formData, pharmacyName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input 
                    className="glass border-slate-800" 
                    value={formData.pharmacyAddress}
                    onChange={(e) => setFormData({...formData, pharmacyAddress: e.target.value})}
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <Button 
                    className="premium-gradient border-none px-8" 
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                    Save Pharmacy Info
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === "notifications" && (
            <Card className="glass border-slate-800">
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription className="text-slate-500">Configure how you receive alerts and updates.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {[
                    { label: "Low Stock Alerts", desc: "Notify when inventory falls below threshold" },
                    { label: "Expiry Warnings", desc: "Alert for products nearing expiry (30/60/90 days)" },
                    { label: "Daily Sales Summary", desc: "Receive a summary of daily transactions" },
                    { label: "Security Alerts", desc: "Notify on suspicious login attempts" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                      <div>
                        <p className="text-sm font-bold text-slate-200">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                      <div className="h-6 w-11 rounded-full bg-blue-600/20 border border-blue-500/30 relative cursor-pointer">
                        <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-blue-400 shadow-lg shadow-blue-500/50" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end pt-4">
                  <Button className="premium-gradient border-none px-8" onClick={handleSave}>Save Preferences</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === "security" && (
            <Card className="glass border-slate-800">
              <CardHeader>
                <CardTitle>Security & Privacy</CardTitle>
                <CardDescription className="text-slate-500">Manage your password and account security.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Current Password</Label>
                  <Input type="password" placeholder="••••••••" className="glass border-slate-800" />
                </div>
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input type="password" placeholder="••••••••" className="glass border-slate-800" />
                </div>
                <div className="space-y-2">
                  <Label>Confirm New Password</Label>
                  <Input type="password" placeholder="••••••••" className="glass border-slate-800" />
                </div>
                <div className="flex justify-end pt-4">
                  <Button className="premium-gradient border-none px-8" onClick={handleSave}>Update Password</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === "regional" && (
            <Card className="glass border-slate-800">
              <CardHeader>
                <CardTitle>Regional Settings</CardTitle>
                <CardDescription className="text-slate-500">Set your local time, currency, and language.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Input defaultValue="INR (₹)" className="glass border-slate-800" />
                  </div>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Input defaultValue="(GMT+05:30) India Standard Time" className="glass border-slate-800" />
                  </div>
                  <div className="space-y-2">
                    <Label>Date Format</Label>
                    <Input defaultValue="DD-MM-YYYY" className="glass border-slate-800" />
                  </div>
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Input defaultValue="English (India)" className="glass border-slate-800" />
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button className="premium-gradient border-none px-8" onClick={handleSave}>Save Regional</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
