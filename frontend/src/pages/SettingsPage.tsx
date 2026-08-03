import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, User, Bell, Palette, Shield, Trash2, LogOut,
  Moon, Sun, Monitor, ChevronRight, CheckCircle2, Save,
  Camera, Upload, Sparkles, AlertTriangle, Loader2, Check,
  GraduationCap, BookOpen, Mail, AtSign,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

type SettingsTab = 'profile' | 'appearance' | 'notifications' | 'privacy' | 'account';

const TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'profile',       label: 'Profile',       icon: User },
  { id: 'appearance',    label: 'Appearance',     icon: Palette },
  { id: 'notifications', label: 'Notifications',  icon: Bell },
  { id: 'privacy',       label: 'Privacy',        icon: Shield },
  { id: 'account',       label: 'Account',        icon: Settings },
];

type Theme = 'dark' | 'light' | 'system';
type AccentColor = 'violet' | 'cyan' | 'emerald' | 'rose' | 'amber';

const ACCENT_COLORS: { id: AccentColor; label: string; cls: string }[] = [
  { id: 'violet',  label: 'Violet',  cls: 'bg-violet-500' },
  { id: 'cyan',    label: 'Cyan',    cls: 'bg-cyan-500' },
  { id: 'emerald', label: 'Emerald', cls: 'bg-emerald-500' },
  { id: 'rose',    label: 'Rose',    cls: 'bg-rose-500' },
  { id: 'amber',   label: 'Amber',   cls: 'bg-amber-500' },
];

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
  const { user, profile, signOut, updateProfile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPresetAvatars, setShowPresetAvatars] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Profile fields — seeded from profile on mount and whenever profile updates ──
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [school, setSchool] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Track if fields have been modified since last save
  const [isDirty, setIsDirty] = useState(false);

  // Seed from profile whenever it loads/changes (only if not dirty)
  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? user?.email?.split('@')[0] ?? '');
    setBio(profile.bio ?? '');
    setSchool(profile.school ?? '');
    setAvatarUrl(profile.avatar_url ?? '');
    setIsDirty(false);
  }, [profile?.id]); // Re-seed only when user changes, not on every profile update

  // ── Appearance ──────────────────────────────────────────────
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('studyos_theme') as Theme) || 'dark');
  const [accent, setAccent] = useState<AccentColor>(() => (localStorage.getItem('studyos_accent') as AccentColor) || 'violet');
  const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem('studyos_reduced_motion') === 'true');
  const [compactMode, setCompactMode] = useState(() => localStorage.getItem('studyos_compact_mode') === 'true');

  useEffect(() => {
    localStorage.setItem('studyos_theme', theme);
    localStorage.setItem('studyos_accent', accent);
    localStorage.setItem('studyos_reduced_motion', String(reducedMotion));
    localStorage.setItem('studyos_compact_mode', String(compactMode));
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-accent', accent);
    document.documentElement.setAttribute('data-compact', String(compactMode));
  }, [theme, accent, reducedMotion, compactMode]);

  // ── Notifications ────────────────────────────────────────────
  const [studyReminders, setStudyReminders] = useState(true);
  const [quizAlerts, setQuizAlerts] = useState(true);
  const [streakAlerts, setStreakAlerts] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);

  // ── Privacy ──────────────────────────────────────────────────
  const [showActivity, setShowActivity] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  // ── Save profile to Supabase ─────────────────────────────────
  const saveProfileData = useCallback(async (overrideAvatar?: string) => {
    if (!user) return;
    setSaveStatus('saving');
    setErrorMsg('');

    const result = await updateProfile({
      full_name: fullName.trim() || user.email?.split('@')[0] || 'Student',
      bio: bio.trim(),
      school: school.trim(),
      avatar_url: overrideAvatar !== undefined ? overrideAvatar : avatarUrl,
    });

    if (result?.error) {
      setSaveStatus('error');
      setErrorMsg(result.error.message || 'Failed to save. Please try again.');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } else {
      setIsDirty(false);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    }
  }, [fullName, bio, school, avatarUrl, user, updateProfile]);

  // ── Debounced auto-save (800ms after last keystroke) ─────────
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isDirty) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      saveProfileData();
    }, 1200);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [fullName, bio, school, isDirty, saveProfileData]);

  // Field change helper — marks dirty and updates state
  const change = (setter: React.Dispatch<React.SetStateAction<string>>) => (val: string) => {
    setter(val);
    setIsDirty(true);
  };

  // ── Avatar upload ────────────────────────────────────────────
  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setAvatarUrl(dataUrl);
      saveProfileData(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const selectPresetAvatar = (url: string) => {
    setAvatarUrl(url);
    setShowPresetAvatars(false);
    saveProfileData(url);
  };

  // ── Avatar display ────────────────────────────────────────────
  const initials = (fullName || user?.email?.split('@')[0] || 'S').slice(0, 2).toUpperCase();

  // ── Render profile tab ────────────────────────────────────────
  const renderProfile = () => (
    <div className="space-y-6">
      {/* Avatar Card */}
      <div className="flex items-center gap-5 p-5 rounded-2xl bg-gradient-to-br from-brand-500/10 to-transparent border border-brand-500/20">
        <div className="relative group flex-shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={fullName || 'Avatar'}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-brand-500/40 shadow-glow-sm group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-brand-gradient flex items-center justify-center text-2xl font-black text-white shadow-glow-sm group-hover:scale-105 transition-transform duration-200">
              {initials}
            </div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Upload photo"
            className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center border-2 border-surface-950 hover:bg-brand-400 text-white shadow-lg transition-all active:scale-90"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-white truncate">{fullName || user?.email?.split('@')[0] || 'Student'}</h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Mail className="w-3 h-3 text-slate-500 flex-shrink-0" />
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
          {school && (
            <div className="flex items-center gap-1.5 mt-1">
              <GraduationCap className="w-3 h-3 text-brand-400 flex-shrink-0" />
              <p className="text-xs text-brand-300 truncate">{school}</p>
            </div>
          )}
          <div className="flex items-center gap-2 mt-3">
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

      {/* Preset Avatars */}
      <AnimatePresence>
        {showPresetAvatars && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-xl bg-surface-900 border border-brand-500/20 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-300">Choose a preset avatar</p>
              <button onClick={() => setShowPresetAvatars(false)} className="text-2xs text-slate-500 hover:text-white transition-colors">Close</button>
            </div>
            <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
              {PRESET_AVATARS.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => selectPresetAvatar(url)}
                  className={cn(
                    'relative w-14 h-14 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all hover:scale-110',
                    avatarUrl === url ? 'border-brand-400 ring-2 ring-brand-500/50' : 'border-transparent opacity-80 hover:opacity-100 hover:border-white/20'
                  )}
                >
                  <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                  {avatarUrl === url && (
                    <div className="absolute inset-0 bg-brand-500/40 flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Fields */}
      <div className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <AtSign className="w-3 h-3 text-brand-400" /> Full Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => change(setFullName)(e.target.value)}
            placeholder="Your full name"
            maxLength={80}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/40 transition-all"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <BookOpen className="w-3 h-3 text-brand-400" /> Bio
            <span className="ml-auto text-2xs text-slate-600">{bio.length}/200</span>
          </label>
          <textarea
            value={bio}
            onChange={(e) => change(setBio)(e.target.value)}
            rows={3}
            maxLength={200}
            placeholder="Brief description about your studies and goals..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/40 transition-all resize-none"
          />
        </div>

        {/* School */}
        <div>
          <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <GraduationCap className="w-3 h-3 text-brand-400" /> School / University
          </label>
          <input
            type="text"
            value={school}
            onChange={(e) => change(setSchool)(e.target.value)}
            placeholder="e.g. Stanford University, MIT, IIT Delhi..."
            maxLength={100}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/40 transition-all"
          />
        </div>
      </div>

      {/* Error message */}
      <AnimatePresence>
        {saveStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs"
          >
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {errorMsg || 'Failed to save profile. Please try again.'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save footer */}
      <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-3">
        <p className="text-2xs text-slate-500 flex items-center gap-1">
          {isDirty
            ? <span className="text-amber-400">Unsaved changes</span>
            : saveStatus === 'saved'
              ? <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> All changes saved</span>
              : 'Changes auto-save as you type.'
          }
        </p>
        <button
          onClick={() => saveProfileData()}
          disabled={saveStatus === 'saving'}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95',
            saveStatus === 'saved'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : saveStatus === 'error'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'bg-brand-gradient text-white hover:opacity-90 shadow-glow-sm disabled:opacity-60 disabled:cursor-not-allowed'
          )}
        >
          {saveStatus === 'saving' ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
          ) : saveStatus === 'saved' ? (
            <><CheckCircle2 className="w-4 h-4" /> Saved!</>
          ) : saveStatus === 'error' ? (
            <><AlertTriangle className="w-4 h-4" /> Retry</>
          ) : (
            <><Save className="w-4 h-4" /> Save Changes</>
          )}
        </button>
      </div>
    </div>
  );

  const renderAppearance = () => (
    <div className="space-y-6">
      <div>
        <label className="text-xs font-semibold text-slate-300 block mb-3">Interface Theme</label>
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

      <div>
        <label className="text-xs font-semibold text-slate-300 block mb-3">Accent Color</label>
        <div className="flex items-center gap-3">
          {ACCENT_COLORS.map(({ id, label, cls }) => (
            <button
              key={id}
              onClick={() => setAccent(id)}
              title={label}
              className={cn(
                'w-10 h-10 rounded-full transition-all flex items-center justify-center',
                cls,
                accent === id ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-950 scale-110 shadow-lg' : 'hover:scale-105 opacity-80 hover:opacity-100'
              )}
            >
              {accent === id && <Check className="w-4 h-4 text-white" />}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-300 block mb-2">Display & Accessibility</label>
        <div className="glass rounded-xl border border-white/5 divide-y divide-white/5 px-4">
          <Toggle value={reducedMotion} onChange={setReducedMotion} label="Reduce Motion" description="Minimize animations and smooth scrolling" />
          <Toggle value={compactMode} onChange={setCompactMode} label="Compact Density" description="Tighter UI spacing for maximum screen workspace" />
        </div>
      </div>
    </div>
  );

  const renderNotifications = () => (
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

  const renderPrivacy = () => (
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

  const renderAccount = () => (
    <div className="space-y-4">
      <div className="glass rounded-xl p-4 border border-white/5">
        <p className="text-xs text-slate-400 mb-1">Account Email</p>
        <p className="text-sm font-semibold text-white">{user?.email}</p>
        <p className="text-2xs text-slate-500 mt-0.5">Joined {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '—'}</p>
      </div>

      <div className="glass rounded-xl p-4 border border-white/5 space-y-3">
        <h3 className="text-sm font-semibold text-white">Security</h3>
        <button className="w-full text-left flex items-center justify-between px-4 py-3 rounded-xl bg-white/3 hover:bg-white/8 transition-all text-sm text-slate-300 border border-white/5">
          <span>Change Password</span>
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
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-slate-300 hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-500 transition-all">
                Yes, Delete Account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':       return renderProfile();
      case 'appearance':    return renderAppearance();
      case 'notifications': return renderNotifications();
      case 'privacy':       return renderPrivacy();
      case 'account':       return renderAccount();
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

        {/* Live save status */}
        <AnimatePresence mode="wait">
          {saveStatus === 'saving' && (
            <motion.span
              key="saving"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-1.5 text-xs text-brand-400 bg-brand-500/10 px-3 py-1.5 rounded-full border border-brand-500/20"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
            </motion.span>
          )}
          {saveStatus === 'saved' && (
            <motion.span
              key="saved"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> All changes saved
            </motion.span>
          )}
        </AnimatePresence>
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
              <Icon className={cn('w-4 h-4 flex-shrink-0', activeTab === id ? 'text-brand-400' : 'text-slate-500')} />
              {label}
            </button>
          ))}
        </div>

        {/* Content Panel */}
        <div className="glass rounded-2xl border border-white/5 p-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
