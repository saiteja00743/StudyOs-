import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/constants';

/**
 * AdminRoute — guards any route so only users with role='admin' in their profile can access it.
 * Redirects everyone else to /dashboard.
 */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0f',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 48,
              height: 48,
              border: '3px solid #6d4bff33',
              borderTop: '3px solid #6d4bff',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: '#94a3b8', fontSize: 14 }}>Verifying admin access…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to={ROUTES.LOGIN} replace />;

  // role defaults to 'user' — only 'admin' passes through
  if (!profile || profile.role !== 'admin') {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <>{children}</>;
}
