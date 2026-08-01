import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, User, Bell, Palette, Shield, Trash2, LogOut,
  Moon, Sun, Monitor, ChevronRight, CheckCircle2, Save,
  Camera, Upload, Sparkles, AlertTriangle, Loader2, Check
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

const ACCENT_COLORS: { id: AccentColor; label: string; cls: string; hex: string }[] = [
  { id: 'violet', label: 'Violet', cls: 'bg-violet-500', hex: '#6d4bff' },
  { id: 'cyan', label: 'Cyan', cls: 'bg-cyan-500', hex: '#06b6d4' },
  { id: 'emerald', label: 'Emerald', cls: 'bg-emerald-500', hex: '#10b981' },
  { id: 'rose', label: 'Rose', cls: 'bg-rose-500', hex: '#f43f5e' },
  { id: 'amber', label: 'Amber', cls: 'bg-amber-500', hex: '#f59e0b' },
];

// Curated high quality preset avatars
const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
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
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
        />
      </button>
    </div>
  );
}

export function SettingsPage() {
  const { user, profile, signOut, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPresetAvatars, setShowPresetAvatars] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronous initial state from cache/profile (0ms latency!)
  const [fullName, setFullName] = useState(() => profile?.full_name ?? user?.email?.split('@')[0] ?? '');
  const [bio, setBio] = useState(() => profile?.bio ?? '');
  const [school, setSchool] = useState(() => profile?.school ?? '');
  const [avatarUrl, setAvatarUrl] = useState(() => profile?.avatar_url ?? '');

  // Keep track of user manual edits to prevent accidental overwrites
  const isDirtyRef = useRef(false);

  // Sync with profile changes from server if user hasn't edited manually
  useEffect(() => {
    if (!profile || isDirtyRef.current) return;
    setFullName(profile.full_name ?? user?.email?.split('@')[0] ?? '');
    setBio(profile.bio ?? '');
    setSchool(profile.school ?? '');
    setAvatarUrl(profile.avatar_url ?? '');
  }, [profile, user]);

  // Appearance persistent settings
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('studyos_theme') as Theme) || 'dark');
  const [accent, setAccent] = useState<AccentColor>(() => (localStorage.getItem('studyos_accent') as AccentColor) || 'violet');
  const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem('studyos_reduced_motion') === 'true');
  const [compactMode, setCompactMode] = useState(() => localStorage.getItem('studyos_compact_mode') === 'true');

  // Apply appearance settings globally
  useEffect(() => {
    localStorage.setItem('studyos_theme', theme);
    localStorage.setItem('studyos_accent', accent);
    localStorage.setItem('studyos_reduced_motion', String(reducedMotion));
    localStorage.setItem('studyos_compact_mode', String(compactMode));

    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-accent', accent);
    document.documentElement.setAttribute('data-compact', String(compactMode));
  }, [theme, accent, reducedMotion, compactMode]);

  // Notifications
  const [studyReminders, setStudyReminders] = useState(true);
  const [quizAlerts, setQuizAlerts] = useState(true);
  const [streakAlerts, setStreakAlerts] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);

  // Privacy
  const [showActivity, setShowActivity] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  // Save profile changes (Instant & background sync)
  const saveProfileData = useCallback(async (customAvatar?: string) => {
    setSaveStatus('saving');
    const result = await updateProfile({
      full_name: fullName.trim(),
      bio: bio.trim(),
      school: school.trim(),
      avatar_url: customAvatar !== undefined ? customAvatar : avatarUrl,
    });
    if (!result?.error) {
      isDirtyRef.current = false;
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } else {
      setSaveStatus('idle');
    }
  }, [fullName, bio, school, avatarUrl, updateProfile]);

  // Debounced auto-save effect for fast editing
  useEffect(() => {
    if (!isDirtyRef.current) return;
    const timer = setTimeout(() => {
      saveProfileData();
    }, 800);
    return () => clearTimeout(timer);
  }, [fullName, bio, school, saveProfileData]);

  const handleFieldChange = (setter: React.Dispatch<React.SetStateAction<string>>, val: string) => {
    isDirtyRef.current = true;
    setter(val);
  };

  // Avatar file upload handler (instant preview + update)
  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setAvatarUrl(dataUrl);
      isDirtyRef.current = true;
      saveProfileData(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const selectPresetAvatar = (url: string) => {
    setAvatarUrl(url);
    setShowPresetAvatars(false);
    isDirtyRef.current = true;
    saveProfileData(url);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-5 p-4 rounded-2xl bg-white/3 border border-white/5">
              <div className="relative group">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName || 'Avatar'}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-brand-500/30 shadow-glow-sm transition-transform duration-200 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-brand-gradient flex items-center justify-center text-2xl font-black text-white shadow-glow-sm transition-transform duration-200 group-hover:scale-105">
                    {(fullName || 'A').slice(0, 2).toUpperCase()}
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload profile photo"
                  className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center border-2 border-surface-950 hover:bg-brand-400 text-white shadow-lg transition-transform active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFile}
              />

              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-white truncate">{fullName || 'Student'}</h3>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{user?.email || 'demo@studyos.ai'}</p>

                <div className="flex items-center gap-3 mt-2.5">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 font-medium bg-brand-500/10 px-2.5 py-1 rounded-lg border border-brand-500/20 hover:bg-brand-500/20 transition-all"
                  >
                    <Upload className="w-3 h-3" /> Upload Photo
                  </button>
                  <button
                    onClick={() => setShowPresetAvatars(!showPresetAvatars)}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-medium bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 hover:bg-white/10 transition-all"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" /> Presets
                  </button>
                </div>
              </div>
            </div>

            {/* Preset Avatars Drawer */}
            <AnimatePresence>
              {showPresetAvatars && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden p-4 rounded-xl bg-surface-900 border border-brand-500/20"
                >
                  <p className="text-xs font-semibold text-slate-300 mb-3 flex items-center justify-between">
                    Choose a preset avatar
                    <button onClick={() => setShowPresetAvatars(false)} className="text-slate-500 hover:text-white text-2xs">Close</button>
                  </p>
                  <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
                    {PRESET_AVATARS.map((url, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectPresetAvatar(url)}
                        className={cn(
                          'relative w-12 h-12 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-transform hover:scale-110',
                          avatarUrl === url ? 'border-brand-400 ring-2 ring-brand-500/50' : 'border-transparent opacity-80 hover:opacity-100'
                        )}
                      >
                        <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                        {avatarUrl === url && (
                          <div className="absolute inset-0 bg-brand-500/30 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Fields */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => handleFieldChange(setFullName, e.target.value)}
                  placeholder="Your full name"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-brand-500/50 focus:border-brand-500/40 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => handleFieldChange(setBio, e.target.value)}
                  rows={2}
                  placeholder="Brief description about your studies and goals..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-brand-500/50 focus:border-brand-500/40 transition-all resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">School / University</label>
                <input
                  type="text"
                  value={school}
                  onChange={(e) => handleFieldChange(setSchool, e.target.value)}
                  placeholder="e.g. Stanford University, MIT..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-brand-500/50 focus:border-brand-500/40 transition-all"
                />
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            {/* Theme Select */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-3">Interface Theme</label>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { id: 'dark', label: 'Dark Mode', icon: Moon },
                  { id: 'light', label: 'Light Mode', icon: Sun },
                  { id: 'system', label: 'System', icon: Monitor },
                ] as const).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setTheme(id)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-xl border text-xs font-medium transition-all relative',
                      theme === id
                        ? 'border-brand-500 bg-brand-500/15 text-white shadow-glow-sm'
                        : 'border-white/10 bg-white/3 text-slate-400 hover:border-white/20 hover:text-white'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                    {theme === id && <CheckCircle2 className="w-3.5 h-3.5 text-brand-400 absolute top-2 right-2" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Color */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-3">Accent Theme Color</label>
              <div className="flex items-center gap-3">
                {ACCENT_COLORS.map(({ id, label, cls }) => (
                  <button
                    key={id}
                    onClick={() => setAccent(id)}
                    title={label}
                    className={cn(
                      'w-10 h-10 rounded-full transition-transform flex items-center justify-center',
                      cls,
                      accent === id ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-950 scale-110 shadow-lg' : 'hover:scale-105 opacity-80 hover:opacity-100'
                    )}
                  >
                    {accent === id && <Check className="w-4 h-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Display preferences */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-2">Display & Accessibility</label>
              <div className="glass rounded-xl border border-white/5 divide-y divide-white/5 px-4">
                <Toggle value={reducedMotion} onChange={setReducedMotion} label="Reduce Motion" description="Minimize animations and smooth scrolling" />
                <Toggle value={compactMode} onChange={setCompactMode} label="Compact Density" description="Tighter UI spacing for maximum screen workspace" />
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div>
            <p className="text-2xs text-slate-500 mb-4">Customize how StudyOS AI alerts you about learning progress.</p>
            <div className="glass rounded-xl border border-white/5 px-4">
              <Toggle value={studyReminders} onChange={setStudyReminders} label="Daily Study Reminders" description="Get notified to keep your daily study routine active" />
              <Toggle value={quizAlerts} onChange={setQuizAlerts} label="Quiz Due Alerts" description="Notifications when scheduled quizzes are ready" />
              <Toggle value={streakAlerts} onChange={setStreakAlerts} label="Streak Alerts" description="Stay informed before losing your active streak" />
              <Toggle value={weeklyReport} onChange={setWeeklyReport} label="Weekly Progress Report" description="Receive a weekly summary email of your learning metrics" />
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-4">
            <div className="glass rounded-xl border border-white/5 px-4">
              <Toggle value={showActivity} onChange={setShowActivity} label="Activity Visibility" description="Allow classmates to see your study stats" />
              <Toggle value={analyticsEnabled} onChange={setAnalyticsEnabled} label="Anonymous Usage Analytics" description="Help improve StudyOS AI with anonymous telemetry" />
            </div>
            <div className="glass rounded-xl p-4 border border-white/5 space-y-3">
              <h3 className="text-sm font-semibold text-white">Data & Export</h3>
              <button className="w-full text-left flex items-center justify-between px-4 py-3 rounded-xl bg-white/3 hover:bg-white/8 transition-all text-sm text-slate-300 border border-white/5">
                <span>Export my complete study data</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
              <button className="w-full text-left flex items-center justify-between px-4 py-3 rounded-xl bg-white/3 hover:bg-white/8 transition-all text-sm text-slate-300 border border-white/5">
                <span>Clear chat and session history</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>
        );

      case 'account':
        return (
          <div className="space-y-4">
            <div className="glass rounded-xl p-4 border border-white/5">
              <p className="text-xs text-slate-400 mb-1">Account Email</p>
              <p className="text-sm font-semibold text-white">{user?.email || 'demo@studyos.ai'}</p>
            </div>
            <div className="glass rounded-xl p-4 border border-white/5 space-y-3">
              <h3 className="text-sm font-semibold text-white">Security Settings</h3>
              <button className="w-full text-left flex items-center justify-between px-4 py-3 rounded-xl bg-white/3 hover:bg-white/8 transition-all text-sm text-slate-300 border border-white/5">
                <span>Change Account Password</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <button
              onClick={signOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>

            {/* Danger Zone */}
            <div className="glass rounded-xl p-4 border border-rose-500/20 bg-rose-500/5 space-y-3">
              <h3 className="text-sm font-semibold text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Danger Zone
              </h3>
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full text-left flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 transition-all text-sm text-rose-300 border border-rose-500/20"
                >
                  <Trash2 className="w-4 h-4" /> Delete Account
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-300">Are you sure? All stored progress will be permanently erased.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-2 rounded-xl border border-white/10 text-sm text-slate-300 hover:bg-white/5"
                    >
                      Cancel
                    </button>
                    <button className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-sm font-medium hover:bg-rose-500 transition-all">
                      Yes, Delete Account
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-brand-400" /> Settings
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage your profile, avatar, preferences, and account.</p>
        </div>

        {/* Live Auto-save status badge */}
        <div className="flex items-center gap-2 text-xs font-medium">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-brand-400 bg-brand-500/10 px-3 py-1.5 rounded-full border border-brand-500/20">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" /> All changes saved
            </span>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-[200px_1fr] gap-5">
        {/* Tab Sidebar */}
        <div className="glass rounded-2xl border border-white/5 p-2 h-fit flex sm:flex-col overflow-x-auto no-scrollbar gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all text-left whitespace-nowrap sm:w-full font-medium',
                activeTab === id
                  ? 'bg-brand-500/20 text-white border border-brand-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0 text-brand-400" />
              {label}
            </button>
          ))}
        </div>

        {/* Content Panel */}
        <div className="glass rounded-2xl border border-white/5 p-5 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>

          {/* Manual Save Button */}
          {activeTab === 'profile' && (
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
              <p className="text-2xs text-slate-500">Changes auto-save as you type.</p>
              <button
                onClick={() => saveProfileData()}
                disabled={saveStatus === 'saving'}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
                  saveStatus === 'saved'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-brand-gradient text-white hover:opacity-90 shadow-glow-sm active:scale-95'
                )}
              >
                {saveStatus === 'saving' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : saveStatus === 'saved' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
