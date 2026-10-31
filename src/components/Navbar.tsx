
import { Bell, Search, ChevronDown } from "lucide-react";

export default function Navbar() {
  return (
    <header className="top-navbar">
      <div className="navbar-search">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search anything..."
          aria-label="Search"
        />
      </div>

      <div className="navbar-actions">
        <button className="notification-button" aria-label="Notifications">
          <Bell size={20} />
          <span className="notification-dot" />
        </button>

        <div className="profile-section">
          <div className="profile-avatar">A</div>
          <div className="profile-info">
            <strong>Admin User</strong>
            <span>Administrator</span>
          </div>
          <ChevronDown size={16} />
        </div>
      </div>
    </header>
  );
}
