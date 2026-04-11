import { Plane, Users, BookOpen, FileText, DollarSign, LayoutDashboard, Map } from 'lucide-react';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'trips', label: 'Trips', icon: Map },
  { id: 'travelers', label: 'Travelers', icon: Users },
  { id: 'bookings', label: 'Bookings', icon: BookOpen },
  { id: 'expenses', label: 'Expenses', icon: DollarSign },
  { id: 'documents', label: 'Documents', icon: FileText },
];

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Plane size={18} />
        </div>
        <div>
          <div className="logo-text">Travel Agency CRM</div>
          <div className="logo-sub">CRM System</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Main Menu</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="nav-item" style={{ color: 'var(--gray-400)', fontSize: '12px' }}>
          <Plane size={14} />
          Travel Agency CRM System v1.0
        </div>
      </div>
    </aside>
  );
}
