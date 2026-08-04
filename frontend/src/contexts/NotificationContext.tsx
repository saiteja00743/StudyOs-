import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { NotificationItem, NotificationType } from '@/types';
import { ROUTES } from '@/constants';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  addNotification: (item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;
  sendTestNotification: () => void;
}

const STORAGE_KEY = 'studyos_notifications_v1';

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n-1',
    title: '🔥 1-Day Streak Active!',
    message: 'Awesome work starting your daily study habit! Keep it going tomorrow.',
    type: 'streak',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15m ago
    read: false,
    actionUrl: ROUTES.DASHBOARD,
  },
  {
    id: 'n-2',
    title: '📅 Upcoming Goal Reminder',
    message: 'You have unfinished study goals for today. Complete them to maintain your streak!',
    type: 'planner',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2h ago
    read: false,
    actionUrl: ROUTES.PLANNER,
  },
  {
    id: 'n-3',
    title: '🧠 AI Tutor Ready',
    message: 'Upload your notes or ask questions to generate custom quizzes instantly.',
    type: 'system',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1d ago
    read: true,
    actionUrl: ROUTES.CHAT,
  },
  {
    id: 'n-4',
    title: '🎉 Welcome to StudyOS!',
    message: 'Your personal AI-powered study space is ready. Explore Flashcards, Notes, & AI Tutor.',
    type: 'achievement',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2d ago
    read: true,
    actionUrl: ROUTES.DASHBOARD,
  },
];

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load notifications from storage:', e);
    }
    return INITIAL_NOTIFICATIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (e) {
      console.error('Failed to save notifications to storage:', e);
    }
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const addNotification = useCallback(
    (item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
      const newNotif: NotificationItem = {
        ...item,
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev]);
    },
    []
  );

  const sendTestNotification = useCallback(() => {
    const types: NotificationType[] = ['streak', 'quiz', 'planner', 'notes', 'system', 'achievement'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    const mockMessages: Record<NotificationType, { title: string; message: string; actionUrl: string }> = {
      streak: {
        title: '⚡ Streak Booster Alert!',
        message: 'Complete a quick 2-minute quiz now to boost your weekly study XP.',
        actionUrl: ROUTES.DASHBOARD,
      },
      quiz: {
        title: '📝 New Quiz Available',
        message: 'A personalized quiz on Operating Systems is ready for review.',
        actionUrl: ROUTES.QUIZ,
      },
      planner: {
        title: '🎯 Task Milestone Complete',
        message: 'Great job completing your morning study session goal!',
        actionUrl: ROUTES.PLANNER,
      },
      notes: {
        title: '✨ AI Notes Summary Ready',
        message: 'Your key takeaways from "Newton\'s Laws of Motion" are generated.',
        actionUrl: ROUTES.NOTES,
      },
      system: {
        title: '🔔 System Notification',
        message: 'StudyOS has been updated with smoother navigation and live streak tracking.',
        actionUrl: ROUTES.SETTINGS,
      },
      achievement: {
        title: '🏆 Achievement Unlocked!',
        message: 'Night Owl: Studied for more than 1 hour in a single session.',
        actionUrl: ROUTES.ANALYTICS,
      },
    };

    const notifInfo = mockMessages[randomType];
    addNotification({
      type: randomType,
      title: notifInfo.title,
      message: notifInfo.message,
      actionUrl: notifInfo.actionUrl,
    });
  }, [addNotification]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        addNotification,
        sendTestNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
