import React, { useState } from "react";
import { X, Lock, User, Loader2, LogOut } from "lucide-react";
import { sileo } from "sileo";

import { useAuth } from "~/core/providers/AuthProvider";
import { AuthService } from "~/features/auth/services/auth.service";

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileSettingsModal({ isOpen, onClose }: ProfileSettingsModalProps) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  if (!isOpen) return null;

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword) return;

    if (newPassword.length < 8) {
      sileo.error({ title: "New password must be at least 8 characters" });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await AuthService.updatePassword(currentPassword, newPassword);
      sileo.success({ title: "Password updated successfully" });
      setCurrentPassword("");
      setNewPassword("");
    } catch (error: any) {
      sileo.error({ title: error.message || "Failed to update password" });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleLogout = () => {
    onClose();
    sileo.success({ title: "Successfully logged out!" });
    logout();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700/50 rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700/50">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-dark-surface transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-gray-200 dark:border-gray-700/50">
          <button
            className={`flex-1 py-3 text-sm font-medium flex justify-center items-center gap-2 border-b-2 transition-colors ${
              activeTab === "profile"
                ? "border-azure dark:border-yellow text-azure dark:text-yellow"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
            onClick={() => setActiveTab("profile")}
          >
            <User size={16} /> Profile
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium flex justify-center items-center gap-2 border-b-2 transition-colors ${
              activeTab === "security"
                ? "border-azure dark:border-yellow text-azure dark:text-yellow"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
            onClick={() => setActiveTab("security")}
          >
            <Lock size={16} /> Security
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {activeTab === "profile" && (
            <div className="flex flex-col items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-azure to-french flex items-center justify-center text-3xl font-bold text-white select-none">
                {user?.name?.charAt(0) || "U"}
              </div>

              <div className="w-full text-center">
                <h3 className="text-gray-900 dark:text-white font-semibold text-lg">
                  {user?.name} {user?.lastName}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{user?.email}</p>
                <span className="inline-block mt-2 text-xs font-medium px-2.5 py-1 rounded-full bg-azure/10 dark:bg-yellow/10 text-azure dark:text-yellow border border-azure/20 dark:border-yellow/20 capitalize">
                  {user?.role?.toLowerCase() || "user"}
                </span>
              </div>

              <div className="w-full pt-4 border-t border-gray-100 dark:border-gray-700/50">
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 px-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-medium rounded-xl border border-red-200 dark:border-red-800 transition-colors flex items-center justify-center gap-2"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow focus:border-transparent transition-colors"
                  placeholder="Enter current password"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow focus:border-transparent transition-colors"
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                />
              </div>
              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="btn-primary w-full mt-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdatingPassword ? <Loader2 size={18} className="animate-spin" /> : "Update Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}