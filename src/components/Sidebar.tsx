
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Layers,
  Users,
  FileText,
  Repeat,
  Receipt,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Products", path: "/products", icon: Package },
  { name: "Plans", path: "/plans", icon: Layers },
  { name: "Customers", path: "/customers", icon: Users },
  { name: "Quotations", path: "/quotations", icon: FileText },
  { name: "Subscriptions", path: "/subscriptions", icon: Repeat },
  { name: "Invoices", path: "/invoices", icon: Receipt },
  { name: "Payments", path: "/payments", icon: CreditCard },
  { name: "Reports", path: "/reports", icon: BarChart3 },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">B</div>
        <div>
          <h2>Brightloop</h2>
          <span>Subscription Manager</span>
        </div>
      </div>

      <p className="menu-heading">MAIN MENU</p>

      <nav className="sidebar-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <Icon size={19} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <NavLink to="/settings" className="sidebar-link">
          <Settings size={19} />
          <span>Settings</span>
        </NavLink>

        <button className="sidebar-link logout-button">
          <LogOut size={19} />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
