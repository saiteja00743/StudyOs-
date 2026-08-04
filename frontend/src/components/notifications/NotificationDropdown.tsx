import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Check, Trash2, CheckCheck, Flame, BookOpen, Target,
  FileText, Trophy, Info, ExternalLink, PlusCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/contexts/NotificationContext';
import { NotificationItem, NotificationType } from '@/types';
import { cn } from '@/utils/cn';

function formatRelativeTime(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return 'Recently';
  }
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'streak':
      return { icon: Flame, color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30' };
    case 'quiz':
      return { icon: BookOpen, color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' };
    case 'planner':
      return { icon: Target, color: 'text-brand-400', bg: 'bg-brand-500/15 border-brand-500/30' };
    case 'notes':
      return { icon: FileText, color: 'text-sky-400', bg: 'bg-sky-500/15 border-sky-500/30' };
    case 'achievement':
      return { icon: Trophy, color: 'text-rose-400', bg: 'bg-rose-500/15 border-rose-500/30' };
    case 'system':
    default:
      return { icon: Info, color: 'text-indigo-400', bg: 'bg-indigo-500/15 border-indigo-500/30' };
  }
}

type FilterTab = 'all' | 'unread' | 'streak' | 'system';

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    sendTestNotification,
  } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === 'unread') return !item.read;
    if (activeTab === 'streak') return item.type === 'streak' || item.type === 'planner';
    if (activeTab === 'system') return item.type === 'system' || item.type === 'achievement';
    return true;
  });

  const handleItemClick = (item: NotificationItem) => {
    markAsRead(item.id);
    if (item.actionUrl) {
      navigate(item.actionUrl);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative w-9 h-9 rounded-xl flex items-center justify-center transition-all',
          isOpen
            ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
            : 'text-slate-400 hover:text-white hover:bg-white/8'
        )}
        aria-label="Notifications"
        id="app-notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500 border-2 border-surface-900" />
          </span>
        )}
      </button>

      {/* Popover Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-surface-900 border border-white/10 shadow-2xl z-50 overflow-hidden backdrop-blur-xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/8 flex items-center justify-between bg-white/2">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-white text-base">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-2xs font-semibold rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-xs flex items-center gap-1"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-2xs">Read all</span>
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors text-xs"
                    title="Clear all notifications"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex border-b border-white/5 px-2 py-1.5 bg-surface-950/40 gap-1 overflow-x-auto text-2xs">
              {[
                { id: 'all', label: 'All' },
                { id: 'unread', label: `Unread (${unreadCount})` },
                { id: 'streak', label: 'Streak' },
                { id: 'system', label: 'System' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as FilterTab)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg transition-all font-medium whitespace-nowrap',
                    activeTab === tab.id
                      ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Notification List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 text-slate-500">
                    <Bell className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-slate-300">All caught up!</p>
                  <p className="text-xs text-slate-500 mt-1">No notifications in this filter.</p>
                </div>
              ) : (
                filteredNotifications.map((item) => {
                  const { icon: Icon, color, bg } = getNotificationIcon(item.type);
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={cn(
                        'p-3.5 flex items-start gap-3 transition-colors cursor-pointer group relative',
                        item.read ? 'bg-transparent hover:bg-white/3' : 'bg-brand-500/5 hover:bg-brand-500/10'
                      )}
                    >
                      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border', bg)}>
                        <Icon className={cn('w-4 h-4', color)} />
                      </div>

                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center justify-between mb-0.5">
                          <h4 className={cn('text-xs font-semibold truncate', item.read ? 'text-slate-300' : 'text-white')}>
                            {item.title}
                          </h4>
                        </div>
                        <p className="text-2xs text-slate-400 line-clamp-2 leading-relaxed mb-1">
                          {item.message}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 font-mono">
                            {formatRelativeTime(item.timestamp)}
                          </span>
                          {item.actionUrl && (
                            <span className="text-[10px] text-brand-400 group-hover:underline flex items-center gap-0.5">
                              View <ExternalLink className="w-2.5 h-2.5 inline" />
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right Action Menu (Unread indicator & item delete) */}
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        {!item.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(item.id);
                            }}
                            className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-white/10 rounded-md transition-colors"
                            title="Mark read"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(item.id);
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400 hover:bg-white/10 rounded-md transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Blue indicator dot for unread */}
                      {!item.read && (
                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-brand-400 rounded-full" />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Action */}
            <div className="p-3 border-t border-white/8 bg-surface-950/60 flex items-center justify-between">
              <button
                onClick={sendTestNotification}
                className="w-full py-2 px-3 text-2xs font-semibold text-brand-300 hover:text-white bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Simulate Demo Notification
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
