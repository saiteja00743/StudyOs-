import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { AppNavbar } from '@/components/layout/AppNavbar';

/**
 * Authenticated app layout — Sidebar (left) + Main content (right).
 * All protected pages render inside the <Outlet />.
 */
export function AppLayout() {
  return (
    <div className="flex h-screen bg-surface-950 overflow-hidden" id="app-layout">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top navbar */}
        <AppNavbar />

        {/* Page content */}
        <main
          className="flex-1 overflow-y-auto p-3 sm:p-6 pb-20 md:pb-6"
          id="app-main-content"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
