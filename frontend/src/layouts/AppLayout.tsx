import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { AppNavbar } from '@/components/layout/AppNavbar';
import { StreakModal } from '@/components/streak/StreakModal';

/**
 * Authenticated app layout — Sidebar (left) + Main content (right).
 * All protected pages render inside the <Outlet />.
 */
export function AppLayout() {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  // Reset scroll position to top on every page navigation
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return (
    <div className="flex h-screen bg-surface-950 overflow-hidden" id="app-layout">
      {/* Streak Modal */}
      <StreakModal />

      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top navbar */}
        <AppNavbar />

        {/* Page content */}
        <main
          ref={mainRef}
          className="flex-1 overflow-y-auto p-3 sm:p-6 pb-20 md:pb-6"
          id="app-main-content"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

