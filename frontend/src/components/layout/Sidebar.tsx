import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  Building2,
  Package,
  Layers,
  CalendarDays,
  FileSpreadsheet,
  RefreshCw,
  Receipt,
  Percent,
  Tag,
  CreditCard,
  BarChart3,
  Settings,
  ShieldAlert,
  LogOut
} from "lucide-react";

export const Sidebar: React.FC = () => {
  const { user, role, logout } = useAuth();

  const adminNav = [
    { name: "Overview Dashboard", path: "/dashboard/admin", icon: LayoutDashboard },
    { name: "User Management", path: "/users", icon: Users },
    { name: "Customers", path: "/customers", icon: Building2 },
    { name: "Products & Catalog", path: "/products", icon: Package },
    { name: "Subscription Plans", path: "/plans", icon: Layers },
    { name: "Quotations", path: "/quotations", icon: FileSpreadsheet },
    { name: "Subscriptions", path: "/subscriptions", icon: RefreshCw },
    { name: "Invoices", path: "/invoices", icon: Receipt },
    { name: "Tax Rates", path: "/taxes", icon: Percent },
    { name: "Discounts & Promos", path: "/discounts", icon: Tag },
    { name: "Payments", path: "/payments", icon: CreditCard },
    { name: "Analytics & Reports", path: "/analytics", icon: BarChart3 },
    { name: "System Settings", path: "/settings/system", icon: Settings }
  ];

  const staffNav = [
    { name: "Staff Dashboard", path: "/dashboard/staff", icon: LayoutDashboard },
    { name: "Customers", path: "/customers", icon: Building2 },
    { name: "Products", path: "/products", icon: Package },
    { name: "Subscription Plans", path: "/plans", icon: Layers },
    { name: "Quotations", path: "/quotations", icon: FileSpreadsheet },
    { name: "Subscriptions", path: "/subscriptions", icon: RefreshCw },
    { name: "Invoices", path: "/invoices", icon: Receipt },
    { name: "Payments", path: "/payments", icon: CreditCard },
    { name: "My Profile", path: "/settings/profile", icon: Settings }
  ];

  const customerNav = [
    { name: "My Account", path: "/dashboard/customer", icon: LayoutDashboard },
    { name: "Available Plans", path: "/plans", icon: Layers },
    { name: "My Subscriptions", path: "/subscriptions", icon: RefreshCw },
    { name: "My Invoices", path: "/invoices", icon: Receipt },
    { name: "Payment History", path: "/payments", icon: CreditCard },
    { name: "Profile Settings", path: "/settings/profile", icon: Settings }
  ];

  let links = customerNav;
  if (role === "ADMIN") links = adminNav;
  if (role === "STAFF") links = staffNav;

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between h-screen sticky top-0 border-r border-slate-800 flex-shrink-0">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800/80 gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-500/20">
            B
          </div>
          <div>
            <div className="font-extrabold text-white text-base tracking-tight leading-tight">
              Brightloop
            </div>
            <div className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase">
              Subscription Cloud
            </div>
          </div>
        </div>

        {/* Role Pill */}
        <div className="px-6 py-3">
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-400">ROLE:</span>
            <span
              className={`font-bold ${
                role === "ADMIN"
                  ? "text-blue-400"
                  : role === "STAFF"
                  ? "text-emerald-400"
                  : "text-amber-400"
              }`}
            >
              {role || "GUEST"}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="px-3 py-2 space-y-1 overflow-y-auto max-h-[calc(100vh-230px)]">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{link.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Footer & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white text-xs">
            {user?.name?.charAt(0) || "U"}
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-white truncate">{user?.name}</div>
            <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors border border-rose-500/20"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
};

