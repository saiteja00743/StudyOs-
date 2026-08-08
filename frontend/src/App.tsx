import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';  
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { StreakProvider } from '@/contexts/StreakContext';
import { LandingPage } from '@/pages/LandingPage';
import { SignupPage } from '@/pages/auth/SignupPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ChatPage } from '@/pages/ChatPage';
import { NotesPage } from '@/pages/NotesPage';
import { PDFPage } from '@/pages/PDFPage';
import { QuizPage } from '@/pages/QuizPage';
import { FlashcardsPage } from '@/pages/FlashcardsPage';
import { PlannerPage } from '@/pages/PlannerPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { InterviewPage } from '@/pages/InterviewPage';
import { RoadmapPage } from '@/pages/RoadmapPage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { AppLayout } from '@/layouts/AppLayout';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { ROUTES } from '@/constants';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function App() {
  useEffect(() => {
    const theme = localStorage.getItem('studyos_theme') || 'dark';
    const accent = localStorage.getItem('studyos_accent') || 'violet';
    const reducedMotion = localStorage.getItem('studyos_reduced_motion') === 'true';
    const compactMode = localStorage.getItem('studyos_compact_mode') === 'true';

    let activeTheme = theme;
    if (theme === 'system') {
      activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    document.documentElement.setAttribute('data-theme', activeTheme);
    document.documentElement.setAttribute('data-accent', accent);
    document.documentElement.setAttribute('data-reduced-motion', String(reducedMotion));
    document.documentElement.setAttribute('data-compact', String(compactMode));

    if (activeTheme === 'light') {
      document.documentElement.classList.add('light-mode');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.remove('light-mode');
      document.documentElement.classList.add('dark');
    }
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <StreakProvider>
            <BrowserRouter>
              <Routes>
                {/* Public */}
                <Route path={ROUTES.HOME} element={<LandingPage />} />

                {/* Auth */}
                <Route path={ROUTES.SIGNUP} element={<SignupPage />} />
                <Route path={ROUTES.LOGIN} element={<LoginPage />} />
                <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* Protected App Routes — ProtectedRoute checks auth, AppLayout provides shell */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<AppLayout />}>
                    <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
                    <Route path="/app/dashboard" element={<DashboardPage />} />
                    <Route path={ROUTES.CHAT} element={<ChatPage />} />
                    <Route path="/app/chat text" element={<ChatPage />} />
                    <Route path="/app/chat" element={<ChatPage />} />
                    <Route path={ROUTES.NOTES} element={<NotesPage />} />
                    <Route path={ROUTES.PDF} element={<PDFPage />} />
                    <Route path={ROUTES.QUIZ}       element={<QuizPage />} />
                    <Route path={ROUTES.FLASHCARDS}  element={<FlashcardsPage />} />
                    <Route path={ROUTES.PLANNER}     element={<PlannerPage />} />
                    <Route path={ROUTES.ANALYTICS}   element={<AnalyticsPage />} />
                    <Route path={ROUTES.SETTINGS}     element={<SettingsPage />} />
                    <Route path={ROUTES.INTERVIEW}    element={<InterviewPage />} />
                    <Route path={ROUTES.ROADMAP}      element={<RoadmapPage />} />
                  </Route>
                </Route>

                {/* Admin-only route — separate from AppLayout */}
                <Route
                  path={ROUTES.ADMIN}
                  element={
                    <AdminRoute>
                      <AdminDashboardPage />
                    </AdminRoute>
                  }
                />

                {/* 404 */}
                <Route path="*" element={
                  <div className="min-h-screen flex items-center justify-center text-center bg-surface-950">
                    <div>
                      <h1 className="text-8xl font-black gradient-text mb-4">404</h1>
                      <p className="text-slate-400 text-xl mb-8">Page not found</p>
                      <a href="/" className="text-brand-400 hover:text-brand-300 underline">← Back to home</a>
                    </div>
                  </div>
                } />
              </Routes>
            </BrowserRouter>
          </StreakProvider>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
