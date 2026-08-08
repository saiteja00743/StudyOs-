import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, rawFrom } from '@/services/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/constants';

// ─── Types ────────────────────────────────────────────────────────────────────
interface PlatformStats {
  totalUsers: number;
  totalNotes: number;
  totalPDFs: number;
  totalQuizzes: number;
  totalFlashcards: number;
  totalChatSessions: number;
  totalPlannerTasks: number;
  avgStreak: number;
  aiEnhancedNotes: number;
  masteredFlashcards: number;
}

interface UserRow {
  id: string;
  full_name: string | null;
  school: string | null;
  study_streak: number;
  role: string;
  created_at: string;
}

interface RecentActivity {
  type: 'note' | 'quiz' | 'chat' | 'pdf' | 'flashcard';
  title: string;
  created_at: string;
  user_id: string;
}

type Tab = 'overview' | 'users' | 'content' | 'activity' | 'system';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
function initials(name: string | null) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}
function avatarColor(id: string) {
  const colors = ['#6d4bff','#f97316','#10b981','#3b82f6','#ec4899','#a855f7','#14b8a6'];
  const idx = id.charCodeAt(0) % colors.length;
  return colors[idx];
}

// ─── Animated Counter ──────────────────────────────────────────────────────────
function AnimatedCounter({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = value / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <>{display.toLocaleString()}</>;
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function AdminDashboardPage() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { count: totalUsers },
        { count: totalNotes },
        { count: aiNotes },
        { count: totalPDFs },
        { count: totalQuizzes },
        { count: totalFlashcards },
        { count: masteredFC },
        { count: totalChats },
        { count: totalTasks },
        { data: profileData },
        { data: recentNotes },
        { data: recentQuizzes },
        { data: recentChats },
        { data: recentPDFs },
      ] = await Promise.all([
        rawFrom('profiles').select('*', { count: 'exact', head: true }),
        rawFrom('notes').select('*', { count: 'exact', head: true }),
        rawFrom('notes').select('*', { count: 'exact', head: true }).eq('is_ai_enhanced', true),
        rawFrom('pdf_documents').select('*', { count: 'exact', head: true }),
        rawFrom('quizzes').select('*', { count: 'exact', head: true }),
        rawFrom('flashcards').select('*', { count: 'exact', head: true }),
        rawFrom('flashcards').select('*', { count: 'exact', head: true }).eq('status', 'mastered'),
        rawFrom('chat_sessions').select('*', { count: 'exact', head: true }),
        rawFrom('planner_tasks').select('*', { count: 'exact', head: true }),
        rawFrom('profiles').select('id, full_name, school, study_streak, role, created_at').order('created_at', { ascending: false }),
        rawFrom('notes').select('title, created_at, user_id').order('created_at', { ascending: false }).limit(10),
        rawFrom('quizzes').select('title, created_at, user_id').order('created_at', { ascending: false }).limit(8),
        rawFrom('chat_sessions').select('title, created_at, user_id').order('created_at', { ascending: false }).limit(8),
        rawFrom('pdf_documents').select('name, uploaded_at, user_id').order('uploaded_at', { ascending: false }).limit(6),
      ]);

      // Compute avg streak
      const allProfiles = profileData as UserRow[] | null;
      const avgStreak = allProfiles && allProfiles.length > 0
        ? Math.round(allProfiles.reduce((s, p) => s + (p.study_streak || 0), 0) / allProfiles.length)
        : 0;

      setStats({
        totalUsers: totalUsers ?? 0,
        totalNotes: totalNotes ?? 0,
        totalPDFs: totalPDFs ?? 0,
        totalQuizzes: totalQuizzes ?? 0,
        totalFlashcards: totalFlashcards ?? 0,
        totalChatSessions: totalChats ?? 0,
        totalPlannerTasks: totalTasks ?? 0,
        avgStreak,
        aiEnhancedNotes: aiNotes ?? 0,
        masteredFlashcards: masteredFC ?? 0,
      });

      setUsers(allProfiles ?? []);

      // Merge activity
      const merged: RecentActivity[] = [
        ...(recentNotes ?? []).map((n: any) => ({ type: 'note' as const, title: n.title, created_at: n.created_at, user_id: n.user_id })),
        ...(recentQuizzes ?? []).map((q: any) => ({ type: 'quiz' as const, title: q.title, created_at: q.created_at, user_id: q.user_id })),
        ...(recentChats ?? []).map((c: any) => ({ type: 'chat' as const, title: c.title || 'Chat session', created_at: c.created_at, user_id: c.user_id })),
        ...(recentPDFs ?? []).map((p: any) => ({ type: 'pdf' as const, title: p.name, created_at: p.uploaded_at, user_id: p.user_id })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 25);
      setActivity(merged);
    } catch (err) {
      console.error('Admin data load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredUsers = users.filter(u =>
    !userSearch || (u.full_name ?? '').toLowerCase().includes(userSearch.toLowerCase())
  );

  const handleSignOut = async () => { await signOut(); navigate(ROUTES.HOME); };

  // ── Nav items
  const navItems: { id: Tab; label: string; icon: string; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥', badge: stats?.totalUsers },
    { id: 'content', label: 'Content', icon: '📚' },
    { id: 'activity', label: 'Activity', icon: '⚡', badge: activity.length },
    { id: 'system', label: 'System', icon: '⚙️' },
  ];

  return (
    <div style={styles.root}>
      {/* ── Sidebar */}
      <aside style={{ ...styles.sidebar, width: sidebarOpen ? 240 : 68, minWidth: sidebarOpen ? 240 : 68 }}>
        {/* Logo */}
        <div style={styles.sidebarHeader}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>🧠</span>
            {sidebarOpen && <span style={styles.logoText}>Admin<span style={{ color: '#6d4bff' }}>OS</span></span>}
          </div>
          <button onClick={() => setSidebarOpen(o => !o)} style={styles.collapseBtn} title="Toggle sidebar">
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Nav */}
        <nav style={styles.nav}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                ...styles.navItem,
                background: activeTab === item.id ? 'rgba(109,75,255,0.18)' : 'transparent',
                color: activeTab === item.id ? '#a78bfa' : '#94a3b8',
                borderLeft: activeTab === item.id ? '3px solid #6d4bff' : '3px solid transparent',
              }}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              {sidebarOpen && (
                <>
                  <span style={styles.navLabel}>{item.label}</span>
                  {item.badge !== undefined && (
                    <span style={styles.badge}>{item.badge > 999 ? '999+' : item.badge}</span>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>

        {/* Admin profile at bottom */}
        <div style={styles.sidebarFooter}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ ...styles.avatar, background: avatarColor(profile?.id ?? ''), flexShrink: 0 }}>
              {initials(profile?.full_name ?? null)}
            </div>
            {sidebarOpen && (
              <div style={{ overflow: 'hidden' }}>
                <p style={styles.footerName}>{profile?.full_name ?? 'Admin'}</p>
                <p style={styles.footerRole}>🛡️ Administrator</p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button onClick={handleSignOut} style={styles.signOutBtn}>Sign out</button>
          )}
        </div>
      </aside>

      {/* ── Main content */}
      <main style={styles.main}>
        {/* Header */}
        <header style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>
              {navItems.find(n => n.id === activeTab)?.icon}{' '}
              {navItems.find(n => n.id === activeTab)?.label}
            </h1>
            <p style={styles.pageSubtitle}>StudyOS AI — Admin Control Panel</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={loadData} style={styles.refreshBtn} title="Refresh data">
              🔄 Refresh
            </button>
            <button onClick={() => navigate(ROUTES.DASHBOARD)} style={styles.backBtn}>
              ← Back to App
            </button>
          </div>
        </header>

        {/* Content */}
        <div style={styles.content}>
          {loading ? (
            <LoadingSkeleton />
          ) : (
            <>
              {activeTab === 'overview' && <OverviewTab stats={stats} />}
              {activeTab === 'users' && (
                <UsersTab
                  users={filteredUsers}
                  search={userSearch}
                  onSearch={setUserSearch}
                  totalUsers={users.length}
                />
              )}
              {activeTab === 'content' && <ContentTab stats={stats} />}
              {activeTab === 'activity' && <ActivityTab activity={activity} />}
              {activeTab === 'system' && <SystemTab profile={profile} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// ─── Loading Skeleton ──────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{ ...styles.card, height: 100, animation: 'pulse 1.5s ease-in-out infinite' }}>
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
        </div>
      ))}
    </div>
  );
}

// ─── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ stats }: { stats: PlatformStats | null }) {
  if (!stats) return null;

  const metrics = [
    { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: '#6d4bff', sub: 'Registered accounts' },
    { label: 'Total Notes', value: stats.totalNotes, icon: '📝', color: '#10b981', sub: `${stats.aiEnhancedNotes} AI-enhanced` },
    { label: 'PDF Documents', value: stats.totalPDFs, icon: '📄', color: '#3b82f6', sub: 'Uploaded & processed' },
    { label: 'Quizzes Created', value: stats.totalQuizzes, icon: '🧪', color: '#f59e0b', sub: 'Across all users' },
    { label: 'Flashcards', value: stats.totalFlashcards, icon: '🃏', color: '#ec4899', sub: `${stats.masteredFlashcards} mastered` },
    { label: 'Chat Sessions', value: stats.totalChatSessions, icon: '💬', color: '#14b8a6', sub: 'AI tutor conversations' },
    { label: 'Planner Tasks', value: stats.totalPlannerTasks, icon: '📅', color: '#a855f7', sub: 'Study tasks created' },
    { label: 'Avg Streak', value: stats.avgStreak, icon: '🔥', color: '#f97316', sub: 'Days across all users' },
  ];

  return (
    <div>
      <div style={styles.statsGrid}>
        {metrics.map((m) => (
          <div key={m.label} style={{ ...styles.card, ...styles.statCard }}>
            <div style={{ ...styles.statIcon, background: m.color + '22', color: m.color }}>
              {m.icon}
            </div>
            <div>
              <p style={styles.statLabel}>{m.label}</p>
              <p style={{ ...styles.statValue, color: m.color }}>
                <AnimatedCounter value={m.value} />
              </p>
              <p style={styles.statSub}>{m.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick ratio cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 16 }}>
        <RatioCard
          label="AI-Enhanced Notes"
          value={stats.totalNotes > 0 ? Math.round((stats.aiEnhancedNotes / stats.totalNotes) * 100) : 0}
          color="#10b981"
          suffix="%"
          sub={`${stats.aiEnhancedNotes} of ${stats.totalNotes} notes`}
        />
        <RatioCard
          label="Flashcard Mastery Rate"
          value={stats.totalFlashcards > 0 ? Math.round((stats.masteredFlashcards / stats.totalFlashcards) * 100) : 0}
          color="#ec4899"
          suffix="%"
          sub={`${stats.masteredFlashcards} of ${stats.totalFlashcards} mastered`}
        />
        <RatioCard
          label="Content Per User"
          value={stats.totalUsers > 0 ? Math.round((stats.totalNotes + stats.totalQuizzes + stats.totalFlashcards) / stats.totalUsers) : 0}
          color="#6d4bff"
          suffix=""
          sub="avg items per user"
        />
      </div>
    </div>
  );
}

function RatioCard({ label, value, color, suffix, sub }: { label: string; value: number; color: string; suffix: string; sub: string }) {
  return (
    <div style={{ ...styles.card, padding: '20px 24px' }}>
      <p style={{ color: '#64748b', fontSize: 13, marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 36, fontWeight: 800, color, marginBottom: 4 }}>
        <AnimatedCounter value={value} />{suffix}
      </p>
      <p style={{ color: '#475569', fontSize: 12 }}>{sub}</p>
      <div style={{ marginTop: 12, height: 4, background: '#1e293b', borderRadius: 9999 }}>
        <div style={{ height: '100%', width: `${Math.min(value, 100)}%`, background: color, borderRadius: 9999, transition: 'width 1s ease' }} />
      </div>
    </div>
  );
}

// ─── Users Tab ─────────────────────────────────────────────────────────────────
function UsersTab({ users, search, onSearch, totalUsers }: {
  users: UserRow[]; search: string; onSearch: (v: string) => void; totalUsers: number;
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ color: '#64748b', fontSize: 14 }}>
          Showing <strong style={{ color: '#e2e8f0' }}>{users.length}</strong> of <strong style={{ color: '#e2e8f0' }}>{totalUsers}</strong> users
        </p>
        <input
          type="text"
          placeholder="🔍 Search by name…"
          value={search}
          onChange={e => onSearch(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              {['User', 'School', 'Streak', 'Role', 'Joined'].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id} style={{ ...styles.tr, animationDelay: `${i * 30}ms` }}>
                <td style={styles.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ ...styles.avatar, background: avatarColor(u.id), fontSize: 12 }}>
                      {initials(u.full_name)}
                    </div>
                    <div>
                      <p style={{ color: '#e2e8f0', fontWeight: 500, fontSize: 14 }}>{u.full_name ?? '—'}</p>
                      <p style={{ color: '#475569', fontSize: 12 }}>{u.id.slice(0, 8)}…</p>
                    </div>
                  </div>
                </td>
                <td style={styles.td}>
                  <span style={{ color: '#94a3b8', fontSize: 13 }}>{u.school || '—'}</span>
                </td>
                <td style={styles.td}>
                  <span style={{ color: '#f97316', fontWeight: 600 }}>🔥 {u.study_streak}</span>
                </td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.roleBadge,
                    background: u.role === 'admin' ? '#6d4bff22' : '#10b98122',
                    color: u.role === 'admin' ? '#a78bfa' : '#34d399',
                    border: `1px solid ${u.role === 'admin' ? '#6d4bff44' : '#10b98144'}`,
                  }}>
                    {u.role === 'admin' ? '🛡️ Admin' : '👤 User'}
                  </span>
                </td>
                <td style={styles.td}>
                  <span style={{ color: '#64748b', fontSize: 13 }}>{formatDate(u.created_at)}</span>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} style={{ ...styles.td, textAlign: 'center', color: '#475569', padding: 40 }}>
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Content Tab ───────────────────────────────────────────────────────────────
function ContentTab({ stats }: { stats: PlatformStats | null }) {
  if (!stats) return null;

  const contentSections = [
    {
      title: '📝 Notes',
      color: '#10b981',
      items: [
        { label: 'Total Notes', value: stats.totalNotes },
        { label: 'AI-Enhanced', value: stats.aiEnhancedNotes },
        { label: 'Regular', value: stats.totalNotes - stats.aiEnhancedNotes },
      ],
    },
    {
      title: '🃏 Flashcards',
      color: '#ec4899',
      items: [
        { label: 'Total Cards', value: stats.totalFlashcards },
        { label: 'Mastered', value: stats.masteredFlashcards },
        { label: 'In Progress', value: stats.totalFlashcards - stats.masteredFlashcards },
      ],
    },
    {
      title: '🧪 Quizzes',
      color: '#f59e0b',
      items: [
        { label: 'Total Quizzes', value: stats.totalQuizzes },
        { label: 'Avg per User', value: stats.totalUsers > 0 ? +(stats.totalQuizzes / stats.totalUsers).toFixed(1) : 0 },
      ],
    },
    {
      title: '📄 PDFs',
      color: '#3b82f6',
      items: [
        { label: 'Total Uploaded', value: stats.totalPDFs },
        { label: 'Avg per User', value: stats.totalUsers > 0 ? +(stats.totalPDFs / stats.totalUsers).toFixed(1) : 0 },
      ],
    },
    {
      title: '💬 Chat Sessions',
      color: '#14b8a6',
      items: [
        { label: 'Total Sessions', value: stats.totalChatSessions },
        { label: 'Avg per User', value: stats.totalUsers > 0 ? +(stats.totalChatSessions / stats.totalUsers).toFixed(1) : 0 },
      ],
    },
    {
      title: '📅 Planner Tasks',
      color: '#a855f7',
      items: [
        { label: 'Total Tasks', value: stats.totalPlannerTasks },
        { label: 'Avg per User', value: stats.totalUsers > 0 ? +(stats.totalPlannerTasks / stats.totalUsers).toFixed(1) : 0 },
      ],
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
      {contentSections.map(sec => (
        <div key={sec.title} style={{ ...styles.card, padding: 24 }}>
          <h3 style={{ color: sec.color, fontSize: 15, fontWeight: 700, marginBottom: 16 }}>{sec.title}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sec.items.map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b', fontSize: 13 }}>{item.label}</span>
                <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 18 }}>
                  {typeof item.value === 'number' && Number.isInteger(item.value)
                    ? item.value.toLocaleString()
                    : item.value}
                </span>
              </div>
            ))}
          </div>
          {/* Bar */}
          <div style={{ marginTop: 16, height: 3, background: '#1e293b', borderRadius: 9999 }}>
            <div style={{ height: '100%', width: '100%', background: `linear-gradient(90deg, ${sec.color}, ${sec.color}88)`, borderRadius: 9999 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Activity Tab ──────────────────────────────────────────────────────────────
const activityConfig = {
  note:      { icon: '📝', label: 'Note created',      color: '#10b981' },
  quiz:      { icon: '🧪', label: 'Quiz created',      color: '#f59e0b' },
  chat:      { icon: '💬', label: 'Chat session',      color: '#14b8a6' },
  pdf:       { icon: '📄', label: 'PDF uploaded',      color: '#3b82f6' },
  flashcard: { icon: '🃏', label: 'Flashcard created', color: '#ec4899' },
};

function ActivityTab({ activity }: { activity: RecentActivity[] }) {
  return (
    <div style={{ ...styles.card, padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #1e293b' }}>
        <h3 style={{ color: '#e2e8f0', fontSize: 16, fontWeight: 700 }}>Recent Platform Activity</h3>
        <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>Last {activity.length} actions across all users</p>
      </div>
      <div style={{ maxHeight: 520, overflowY: 'auto' }}>
        {activity.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#475569', padding: 40 }}>No recent activity</p>
        ) : (
          activity.map((item, i) => {
            const cfg = activityConfig[item.type];
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 24px',
                borderBottom: '1px solid #0f172a',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = '#0f172a')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: cfg.color + '22', color: cfg.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, flexShrink: 0,
                }}>
                  {cfg.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.title}
                  </p>
                  <p style={{ color: '#475569', fontSize: 12, marginTop: 2 }}>
                    <span style={{ color: cfg.color }}>{cfg.label}</span>
                    {' · '}user {item.user_id.slice(0, 8)}…
                  </p>
                </div>
                <span style={{ color: '#475569', fontSize: 12, flexShrink: 0 }}>{timeAgo(item.created_at)}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── System Tab ────────────────────────────────────────────────────────────────
function SystemTab({ profile }: { profile: ReturnType<typeof useAuth>['profile'] }) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;

  const rows = [
    { label: 'Supabase URL', value: supabaseUrl || 'Not configured' },
    { label: 'Auth Provider', value: 'Email + Google OAuth' },
    { label: 'Admin User', value: profile?.full_name ?? '—' },
    { label: 'Admin Role', value: profile?.role ?? '—' },
    { label: 'Session', value: 'Active' },
    { label: 'Frontend Framework', value: 'React + Vite + TypeScript' },
    { label: 'Database', value: 'Supabase (PostgreSQL)' },
    { label: 'Styling', value: 'Vanilla CSS' },
    { label: 'Routing', value: 'React Router v6' },
    { label: 'Deployed At', value: 'https://studyos.dpdns.org' },
    { label: 'Local Time', value: new Date().toLocaleString() },
  ];

  return (
    <div style={{ ...styles.card, padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #1e293b' }}>
        <h3 style={{ color: '#e2e8f0', fontSize: 16, fontWeight: 700 }}>⚙️ System Information</h3>
        <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>Platform configuration and environment details</p>
      </div>
      <div>
        {rows.map((row, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 24px', borderBottom: '1px solid #0f172a',
          }}>
            <span style={{ color: '#64748b', fontSize: 14 }}>{row.label}</span>
            <span style={{
              color: '#e2e8f0', fontSize: 13, fontFamily: 'monospace',
              background: '#0f172a', padding: '3px 10px', borderRadius: 6,
              maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    minHeight: '100vh',
    background: '#070b12',
    color: '#e2e8f0',
    fontFamily: "'Inter', 'Outfit', system-ui, sans-serif",
  },
  sidebar: {
    background: '#0d1117',
    borderRight: '1px solid #1e293b',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.25s ease, min-width 0.25s ease',
    flexShrink: 0,
    overflow: 'hidden',
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 16px',
    borderBottom: '1px solid #1e293b',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: { fontSize: 24 },
  logoText: {
    fontSize: 18,
    fontWeight: 800,
    color: '#e2e8f0',
    letterSpacing: '-0.5px',
    whiteSpace: 'nowrap',
  },
  collapseBtn: {
    background: 'none',
    border: 'none',
    color: '#475569',
    cursor: 'pointer',
    fontSize: 12,
    padding: 4,
    borderRadius: 4,
    flexShrink: 0,
  },
  nav: {
    flex: 1,
    padding: '12px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 12px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    transition: 'all 0.15s',
    textAlign: 'left',
    width: '100%',
  },
  navIcon: { fontSize: 18, flexShrink: 0 },
  navLabel: { flex: 1, whiteSpace: 'nowrap' },
  badge: {
    background: '#6d4bff33',
    color: '#a78bfa',
    fontSize: 11,
    fontWeight: 700,
    padding: '2px 7px',
    borderRadius: 9999,
    flexShrink: 0,
  },
  sidebarFooter: {
    padding: '16px',
    borderTop: '1px solid #1e293b',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  footerName: { color: '#e2e8f0', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  footerRole: { color: '#a78bfa', fontSize: 11, whiteSpace: 'nowrap' },
  avatar: {
    width: 34, height: 34, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 700, fontSize: 13,
  },
  signOutBtn: {
    background: '#1e293b',
    border: '1px solid #334155',
    color: '#94a3b8',
    padding: '7px 14px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
    transition: 'all 0.15s',
    width: '100%',
    textAlign: 'center',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 28px',
    borderBottom: '1px solid #1e293b',
    background: '#0d1117',
    flexShrink: 0,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: '#f1f5f9',
    letterSpacing: '-0.5px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  pageSubtitle: { color: '#475569', fontSize: 13, marginTop: 2 },
  refreshBtn: {
    background: '#1e293b',
    border: '1px solid #334155',
    color: '#94a3b8',
    padding: '8px 16px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    transition: 'all 0.15s',
  },
  backBtn: {
    background: 'linear-gradient(135deg, #6d4bff, #8b5cf6)',
    border: 'none',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    transition: 'all 0.15s',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px 28px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 14,
  },
  card: {
    background: '#0d1117',
    border: '1px solid #1e293b',
    borderRadius: 12,
    padding: 20,
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  statCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
    padding: '18px 20px',
  },
  statIcon: {
    width: 44, height: 44,
    borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20,
    flexShrink: 0,
  },
  statLabel: { color: '#64748b', fontSize: 12, fontWeight: 500, marginBottom: 2 },
  statValue: { fontSize: 28, fontWeight: 800, letterSpacing: '-1px', lineHeight: 1.1 },
  statSub: { color: '#334155', fontSize: 11, marginTop: 2 },
  tableWrapper: {
    background: '#0d1117',
    border: '1px solid #1e293b',
    borderRadius: 12,
    overflow: 'hidden',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: 12,
    fontWeight: 600,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '1px solid #1e293b',
    background: '#070b12',
  },
  tr: { borderBottom: '1px solid #0f172a', transition: 'background 0.12s' },
  td: { padding: '12px 16px', verticalAlign: 'middle' },
  searchInput: {
    background: '#0d1117',
    border: '1px solid #1e293b',
    borderRadius: 8,
    color: '#e2e8f0',
    padding: '8px 14px',
    fontSize: 13,
    outline: 'none',
    width: 220,
    transition: 'border-color 0.15s',
  },
  roleBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 10px',
    borderRadius: 9999,
    fontSize: 12,
    fontWeight: 600,
  },
};
