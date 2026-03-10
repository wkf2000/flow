import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  Eye,
  Briefcase,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Chart', icon: BarChart3, path: '/chart' },
  { label: 'Watchlist', icon: Eye, path: '/watchlist' },
  { label: 'Portfolio', icon: Briefcase, path: '/portfolio' },
  { label: 'Screener', icon: SlidersHorizontal, path: '/screener' },
];

function NavItems({ labelClassName }: { labelClassName?: string }) {
  const setSidebarMobileOpen = useUIStore((s) => s.setSidebarMobileOpen);

  return (
    <nav className="flex flex-col gap-1 mt-4 px-2">
      {navItems.map(({ label, icon: Icon, path }) => (
        <NavLink
          key={path}
          to={path}
          end={path === '/'}
          onClick={() => setSidebarMobileOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium cursor-pointer transition-colors duration-200 ${
              isActive
                ? 'bg-surface-tertiary text-accent border-l-2 border-accent'
                : 'text-slate-400 hover:text-slate-200 hover:bg-surface-tertiary/50'
            }`
          }
        >
          <Icon className="h-5 w-5 shrink-0" />
          <span className={labelClassName}>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export function Sidebar() {
  const sidebarMobileOpen = useUIStore((s) => s.sidebarMobileOpen);
  const setSidebarMobileOpen = useUIStore((s) => s.setSidebarMobileOpen);

  return (
    <>
      {/* Desktop / Tablet sidebar */}
      <aside className="hidden md:flex fixed top-14 left-0 bottom-0 z-20 flex-col bg-surface-secondary border-r border-border-primary w-16 lg:w-64">
        <NavItems labelClassName="lg:inline hidden" />
      </aside>

      {/* Mobile overlay */}
      {sidebarMobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSidebarMobileOpen(false)}
          />
          <aside className="relative z-50 flex flex-col w-64 h-full bg-surface-secondary border-r border-border-primary">
            <div className="flex items-center justify-between h-14 px-4 border-b border-border-primary">
              <span className="text-xl font-bold text-accent">Flow</span>
              <button
                onClick={() => setSidebarMobileOpen(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer transition-colors duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavItems />
          </aside>
        </div>
      )}
    </>
  );
}
