import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, User, Bell, Palette, Shield, Trash2, LogOut,
  Moon, Sun, Monitor, ChevronRight, CheckCircle2, Save,
  Camera, Globe, Volume2, Eye, EyeOff, AlertTriangle, Loader2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

type SettingsTab = 'profile' | 'appearance' | 'notifications' | 'privacy' | 'account';

const TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy', icon: Shield },
  { id: 'account', label: 'Account', icon: Settings },
];

type Theme = 'dark' | 'light' | 'system';
type AccentColor = 'violet' | 'cyan' | 'emerald' | 'rose' | 'amber';

const ACCENT_COLORS: { id: AccentColor; label: string; cls: string }[] = [
  { id: 'violet', label: 'Violet', cls: 'bg-violet-500' },
  { id: 'cyan', label: 'Cyan', cls: 'bg-cyan-500' },
  { id: 'emerald', label: 'Emerald', cls: 'bg-emerald-500' },
  { id: 'rose', label: 'Rose', cls: 'bg-rose-500' },
  { id: 'amber', label: 'Amber', cls: 'bg-amber-500' },
];

function Toggle({ value, onChange, label, description }: {
  value: boolean; onChange: (v: boolean) => void; label: string; description?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-white/5 last:border-0">
      <div>
        <p className="text-sm text-slate-200 font-medium">{label}</p>
        {description && <p className="text-2xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={cn('relative w-11 h-6 rounded-full transition-colors flex-shrink-0', value ? 'bg-brand-500' : 'bg-white/10')}
      >
        <motion.div
          animate={{ x: value ? 20 : 2 }}
          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
        />
      </button>
    </div>
  );
}

export function SettingsPage() {
  const { user, profile, signOut, updateProfileName } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Profile fields
  const [fullName, setFullName] = useState(profile?.full_name || user?.email?.split('@')[0] || 'Student');
  const [bio, setBio] = useState('Computer Science student passionate about AI and algorithms.');
  const [school, setSchool] = useState('University Student');

  React.useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
  }, [profile?.full_name]);

  // Appearance
  const [theme, setTheme] = useState<Theme>('dark');
  const [accent, setAccent] = useState<AccentColor>('violet');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [compactMode, setCompactMode] = useState(false);

  // Notifications
  const [studyReminders, setStudyReminders] = useState(true);
  const [quizAlerts, setQuizAlerts] = useState(true);
  const [streakAlerts, setStreakAlerts] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);

  // Privacy
  const [showActivity, setShowActivity] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  const handleSave = async () => {
    setSaving(true);
    await updateProfileName(fullName);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-5">
            {/* Avatar */}
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-brand-gradient flex items-center justify-center text-2xl font-black text-white shadow-glow-sm">
                  {(fullName || 'A').slice(0, 2).toUpperCase()}
                </div>
                <button className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center border-2 border-surface-950 hover:bg-brand-400 transition-colors">
                  <Camera className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{fullName}</p>
                <p className="text-2xs text-slate-500 mt-0.5">{user?.email || 'demo@studyos.ai'}</p>
                <button className="text-2xs text-brand-400 hover:text-brand-300 transition-colors mt-1">
                  Change avatar
                </button>
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-4">
              {[
                { label: 'Full Name', value: fullName, set: setFullName, placeholder: 'Your name' },
                { label: 'Bio', value: bio, set: setBio, placeholder: 'Brief description...', multiline: true },
                { label: 'School / University', value: school, set: setSchool, placeholder: 'Where you study' },
              ].map(({ label, value, set, placeholder, multiline }) => (
                <div key={label}>
                  <label className="text-xs text-slate-400 block mb-1.5">{label}</label>
                  {multiline ? (
                    <textarea value={value} onChange={(e) => set(e.target.value)} rows={2}
                      placeholder={placeholder}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-brand-500/50 focus:border-brand-500/30 transition-all resize-none" />
                  ) : (
                    <input type="text" value={value} onChange={(e) => set(e.target.value)}
                      placeholder={placeholder}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-brand-500/50 focus:border-brand-500/30 transition-all" />
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            {/* Theme */}
            <div>
              <label className="text-xs text-slate-400 block mb-3">Theme</label>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { id: 'dark', label: 'Dark', icon: Moon },
                  { id: 'light', label: 'Light', icon: Sun },
                  { id: 'system', label: 'System', icon: Monitor },
                ] as const).map(({ id, label, icon: Icon }) => (
                  <button key={id} onClick={() => setTheme(id)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-xl border text-xs font-medium transition-all',
                      theme === id ? 'border-brand-500 bg-brand-500/15 text-brand-300' : 'border-white/10 bg-white/3 text-slate-400 hover:border-brand-500/30 hover:text-white'
                    )}>
                    <Icon className="w-5 h-5" />
                    {label}
                    {theme === id && <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent */}
            <div>
              <label className="text-xs text-slate-400 block mb-3">Accent Color</label>
              <div className="flex gap-3">
                {ACCENT_COLORS.map(({ id, label, cls }) => (
                  <button key={id} onClick={() => setAccent(id)} title={label}
                    className={cn('w-9 h-9 rounded-full transition-all flex items-center justify-center', cls,
                      accent === id ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-950 scale-110' : 'hover:scale-105'
                    )}>
                    {accent === id && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Display */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Display Options</label>
              <div className="glass rounded-xl border border-white/5 divide-y divide-white/5 px-4">
                <Toggle value={reducedMotion} onChange={setReducedMotion} label="Reduce Motion" description="Minimize animations for accessibility" />
                <Toggle value={compactMode} onChange={setCompactMode} label="Compact Mode" description="Tighter spacing and smaller elements" />
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div>
            <p className="text-2xs text-slate-500 mb-4">Manage how and when StudyOS AI notifies you.</p>
            <div className="glass rounded-xl border border-white/5 px-4">
              <Toggle value={studyReminders} onChange={setStudyReminders} label="Daily Study Reminders" description="Get reminded to study at your scheduled time" />
              <Toggle value={quizAlerts} onChange={setQuizAlerts} label="Quiz Due Alerts" description="Notifications when you have pending quizzes" />
              <Toggle value={streakAlerts} onChange={setStreakAlerts} label="Streak Alerts" description="Stay informed about your study streak" />
              <Toggle value={weeklyReport} onChange={setWeeklyReport} label="Weekly Progress Report" description="Receive a weekly summary of your learning" />
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-4">
            <div className="glass rounded-xl border border-white/5 px-4">
              <Toggle value={showActivity} onChange={setShowActivity} label="Activity Visibility" description="Allow others to see your study activity" />
              <Toggle value={analyticsEnabled} onChange={setAnalyticsEnabled} label="Usage Analytics" description="Help improve StudyOS AI with anonymous usage data" />
            </div>
            <div className="glass rounded-xl p-4 border border-white/5 space-y-3">
              <h3 className="text-sm font-semibold text-white">Data Management</h3>
              <button className="w-full text-left flex items-center justify-between px-4 py-3 rounded-xl bg-white/3 hover:bg-white/8 transition-all text-sm text-slate-300 border border-white/5">
                <span>Export all my data</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
              <button className="w-full text-left flex items-center justify-between px-4 py-3 rounded-xl bg-white/3 hover:bg-white/8 transition-all text-sm text-slate-300 border border-white/5">
                <span>Clear study history</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>
        );

      case 'account':
        return (
          <div className="space-y-4">
            <div className="glass rounded-xl p-4 border border-white/5">
              <p className="text-xs text-slate-400 mb-1">Email</p>
              <p className="text-sm text-white">{user?.email || 'demo@studyos.ai'}</p>
            </div>
            <div className="glass rounded-xl p-4 border border-white/5 space-y-3">
              <h3 className="text-sm font-semibold text-white">Security</h3>
              <button className="w-full text-left flex items-center justify-between px-4 py-3 rounded-xl bg-white/3 hover:bg-white/8 transition-all text-sm text-slate-300 border border-white/5">
                <span>Change Password</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
              <button className="w-full text-left flex items-center justify-between px-4 py-3 rounded-xl bg-white/3 hover:bg-white/8 transition-all text-sm text-slate-300 border border-white/5">
                <span>Two-Factor Authentication</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <button
              onClick={signOut}
              className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-all text-sm"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>

            {/* Danger zone */}
            <div className="glass rounded-xl p-4 border border-danger/20 bg-danger/5 space-y-3">
              <h3 className="text-sm font-semibold text-danger flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Danger Zone
              </h3>
              {!showDeleteConfirm ? (
                <button onClick={() => setShowDeleteConfirm(true)}
                  className="w-full text-left flex items-center gap-2 px-4 py-3 rounded-xl bg-danger/10 hover:bg-danger/20 transition-all text-sm text-danger border border-danger/20">
                  <Trash2 className="w-4 h-4" /> Delete Account
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-300">Are you sure? This cannot be undone.</p>
                  <div className="flex gap-2">
                    <button onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-2 rounded-xl border border-white/10 text-sm text-slate-300 hover:bg-white/5">Cancel</button>
                    <button className="flex-1 py-2 rounded-xl bg-danger text-white text-sm font-medium hover:bg-danger/80 transition-all">
                      Yes, Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-brand-400" /> Settings
        </h1>
        <p className="text-slate-400 text-sm mt-1">Manage your profile, preferences, and account settings.</p>
      </div>

      <div className="grid sm:grid-cols-[200px_1fr] gap-5">
        {/* Tab sidebar */}
        <div className="glass rounded-2xl border border-white/5 p-2 h-fit flex sm:flex-col overflow-x-auto no-scrollbar gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all text-left whitespace-nowrap sm:w-full',
                activeTab === id ? 'bg-brand-500/20 text-white font-medium' : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}>
              <Icon className={cn('w-4 h-4 flex-shrink-0', activeTab === id ? 'text-brand-400' : 'text-slate-500')} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="glass rounded-2xl border border-white/5 p-5">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}>
              {renderContent()}
            </motion.div>
          </AnimatePresence>

          {/* Save button — shown for editable tabs */}
          {(activeTab === 'profile' || activeTab === 'appearance' || activeTab === 'notifications' || activeTab === 'privacy') && (
            <div className="mt-6 pt-4 border-t border-white/5 flex justify-end">
              <button onClick={handleSave} disabled={saving}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all',
                  saved ? 'bg-success/20 text-success' : 'bg-brand-gradient text-white hover:opacity-90 shadow-glow-sm'
                )}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
