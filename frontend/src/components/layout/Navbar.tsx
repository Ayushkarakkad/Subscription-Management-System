import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Bell, Search, User as UserIcon, Check } from "lucide-react";
import api from "../../services/api";

export const Navbar: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      if (res.data?.success) {
        setNotifications(res.data.data || []);
      }
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllRead = async () => {
    try {
      await api.post("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  return (
    <header className="h-16 bg-white border-b border-slate-100 px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm/50">
      {/* Search Input */}
      <div className="relative w-80">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search products, plans, customers..."
          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Popover */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-bold text-sm text-slate-900">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-50 mt-2">
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`py-2.5 px-2 rounded-lg text-xs ${
                        !n.isRead ? "bg-blue-50/50 font-medium" : "text-slate-600"
                      }`}
                    >
                      <div className="font-bold text-slate-900 mb-0.5">{n.title}</div>
                      <div className="text-slate-500">{n.message}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Pill */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
            {user?.name?.charAt(0) || <UserIcon className="w-4 h-4" />}
          </div>
          <div className="hidden md:block">
            <div className="text-xs font-bold text-slate-900 leading-tight">
              {user?.name || "User"}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              {user?.email}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

