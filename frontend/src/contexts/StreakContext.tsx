import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { StreakData, StreakDay } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/contexts/NotificationContext';
import { supabase } from '@/services/supabase';

interface StreakContextType {
  streakData: StreakData;
  isTodayCheckedIn: boolean;
  checkInToday: () => void;
  useStreakFreeze: () => boolean;
  openStreakModal: boolean;
  setOpenStreakModal: (open: boolean) => void;
}

const STORAGE_KEY = 'studyos_streak_v1';

function getFormattedDate(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

function generateWeeklyHistory(lastActive: string | null): StreakDay[] {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 is Sun, 1 is Mon...
  // Calculate Monday of current week
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  const daysNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const todayStr = getFormattedDate(today);

  return daysNames.map((dayName, idx) => {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + idx);
    const dateStr = getFormattedDate(dayDate);
    const isToday = dateStr === todayStr;

    // Check if this date has been active
    // For visual simulation: past days in the current week before today default to completed if streak >= 1
    const isPast = dayDate < today && !isToday;
    const completed = isToday ? (lastActive === todayStr) : isPast;

    return {
      dayName,
      dateStr,
      isToday,
      completed,
    };
  });
}

const DEFAULT_STREAK_DATA: StreakData = {
  currentStreak: 1,
  longestStreak: 3,
  lastActiveDate: getFormattedDate(),
  totalActiveDays: 5,
  streakFreezes: 1,
  weeklyHistory: generateWeeklyHistory(getFormattedDate()),
};

const StreakContext = createContext<StreakContextType | undefined>(undefined);

export function StreakProvider({ children }: { children: ReactNode }) {
  const { profile, user } = useAuth();
  const { addNotification } = useNotifications();
  const [openStreakModal, setOpenStreakModal] = useState(false);

  const [streakData, setStreakData] = useState<StreakData>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.weeklyHistory = generateWeeklyHistory(parsed.lastActiveDate);
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse streak storage:', e);
    }
    return DEFAULT_STREAK_DATA;
  });

  // Sync profile streak if present
  useEffect(() => {
    if (profile?.study_streak && profile.study_streak !== streakData.currentStreak) {
      setStreakData((prev) => ({
        ...prev,
        currentStreak: profile.study_streak,
        longestStreak: Math.max(prev.longestStreak, profile.study_streak),
      }));
    }
  }, [profile?.study_streak]);

  // Persist locally
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(streakData));
    } catch (e) {
      console.error('Failed to store streak:', e);
    }
  }, [streakData]);

  const todayStr = getFormattedDate();
  const isTodayCheckedIn = streakData.lastActiveDate === todayStr;

  const checkInToday = useCallback(() => {
    const today = getFormattedDate();
    
    setStreakData((prev) => {
      if (prev.lastActiveDate === today) {
        return prev; // Already checked in today
      }

      const newCurrentStreak = prev.currentStreak + 1;
      const newLongestStreak = Math.max(prev.longestStreak, newCurrentStreak);
      const newTotalActive = prev.totalActiveDays + 1;
      const updatedHistory = generateWeeklyHistory(today);

      // Async update Supabase profile if user logged in
      if (user?.id) {
        (supabase.from('profiles') as any)
          .update({ study_streak: newCurrentStreak, updated_at: new Date().toISOString() })
          .eq('id', user.id)
          .then((res: { error: unknown }) => {
            if (res.error) console.error('Error updating streak in DB:', res.error);
          });
      }

      // Add notification
      addNotification({
        type: 'streak',
        title: `🔥 ${newCurrentStreak}-Day Streak Achieved!`,
        message: `Great dedication! You completed your daily study check-in and extended your streak.`,
      });

      return {
        ...prev,
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastActiveDate: today,
        totalActiveDays: newTotalActive,
        weeklyHistory: updatedHistory,
      };
    });
  }, [user?.id, addNotification]);

  const useStreakFreeze = useCallback(() => {
    if (streakData.streakFreezes <= 0) return false;

    setStreakData((prev) => ({
      ...prev,
      streakFreezes: prev.streakFreezes - 1,
      lastActiveDate: getFormattedDate(),
      weeklyHistory: generateWeeklyHistory(getFormattedDate()),
    }));

    addNotification({
      type: 'streak',
      title: '🛡️ Streak Freeze Applied!',
      message: 'Your study streak was saved using a Streak Freeze.',
    });

    return true;
  }, [streakData.streakFreezes, addNotification]);

  return (
    <StreakContext.Provider
      value={{
        streakData,
        isTodayCheckedIn,
        checkInToday,
        useStreakFreeze,
        openStreakModal,
        setOpenStreakModal,
      }}
    >
      {children}
    </StreakContext.Provider>
  );
}

export function useStreak() {
  const context = useContext(StreakContext);
  if (!context) {
    throw new Error('useStreak must be used within a StreakProvider');
  }
  return context;
}
