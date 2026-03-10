import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-surface-primary text-slate-50">
      <TopBar />
      <Sidebar />
      <main className="mt-14 ml-0 md:ml-16 lg:ml-64 p-6">
        <Outlet />
      </main>
    </div>
  );
}
