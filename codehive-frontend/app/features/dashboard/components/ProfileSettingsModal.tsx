import React, { useState, useRef } from "react";
import { X, Upload, Lock, User, Loader2, LogOut } from "lucide-react";
import { sileo } from "sileo";
import { updatePassword } from "../api/dashboard.api";
import { useAuth } from "~/core/providers/AuthProvider";

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");
  
  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  if (!isOpen) return null;


  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    if (newPassword.length < 8) {
      sileo.error("New password must be at least 8 characters");
      return;
    }
    
    setIsUpdatingPassword(true);
    try {
      await updatePassword(currentPassword, newPassword);
      sileo.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
    } catch (error: any) {
      sileo.error(error.message || "Failed to update password");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleLogout = () => {
    onClose();
    sileo.success("Successfully logged out!");
    logout();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
          <h2 className="text-lg font-bold text-white">Settings</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-md hover:bg-[#2a2a2a] transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-[#2a2a2a]">
          <button 
            className={`flex-1 py-3 text-sm font-medium flex justify-center items-center gap-2 border-b-2 transition-colors ${activeTab === "profile" ? "border-blue-500 text-blue-400" : "border-transparent text-gray-400 hover:text-gray-200"}`}
            onClick={() => setActiveTab("profile")}
          >
            <User size={16} /> Profile
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-medium flex justify-center items-center gap-2 border-b-2 transition-colors ${activeTab === "security" ? "border-blue-500 text-blue-400" : "border-transparent text-gray-400 hover:text-gray-200"}`}
            onClick={() => setActiveTab("security")}
          >
            <Lock size={16} /> Security
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {activeTab === "profile" && (
            <div className="flex flex-col items-center gap-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#2a2a2a] bg-[#121212] flex items-center justify-center text-2xl font-bold text-gray-400">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              </div>

              <div className="w-full text-center">
                <h3 className="text-white font-medium">{user?.name} {user?.lastName}</h3>
                <p className="text-gray-400 text-sm">{user?.email}</p>
              </div>

              <div className="w-full mt-4 pt-6 border-t border-[#2a2a2a]">
                <button 
                  onClick={handleLogout}
                  className="w-full py-2 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Current Password</label>
                <input 
                  type="password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-[#121212] border border-[#2a2a2a] text-white rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Enter current password"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">New Password</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#121212] border border-[#2a2a2a] text-white rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                />
              </div>
              <button 
                type="submit"
                disabled={isUpdatingPassword}
                className="w-full mt-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isUpdatingPassword ? <Loader2 size={18} className="animate-spin" /> : "Update Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
