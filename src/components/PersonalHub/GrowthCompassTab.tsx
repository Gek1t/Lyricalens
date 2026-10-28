import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../db';
import { getEbbinghausMetrics, EBBINGHAUS_INTERVAL_DAYS } from '../../utils/vocabEngine';
import {
  Flame,
  ChevronRight,
  BookOpen,
  Music2,
  Camera,
  Check,
  Sparkles,
  RotateCcw,
  Headphones,
  BrainCircuit,
  AlertCircle
} from 'lucide-react';

/**
 * Concentric Circular Activity Rings (Apple Fitness style)
 */
interface ActivityRingsProps {
  ring1Pct: number; // Mastered (Green)
  ring2Pct: number; // Learning (Cyan/Blue)
  ring3Pct: number; // Collected (Coral/Amber)
  size?: number;
}

const ActivityRings: React.FC<ActivityRingsProps> = ({
  ring1Pct,
  ring2Pct,
  ring3Pct,
  size = 110
}) => {
  const strokeWidth = 8.5;
  const gap = 3.5;

  // Radii for 3 concentric rings
  const r3 = (size - strokeWidth) / 2; // Outer (Collected)
  const r2 = r3 - strokeWidth - gap;  // Middle (Learning)
  const r1 = r2 - strokeWidth - gap;  // Inner (Mastered)

  const c3 = 2 * Math.PI * r3;
  const c2 = 2 * Math.PI * r2;
  const c1 = 2 * Math.PI * r1;

  const clamp = (v: number) => Math.min(100, Math.max(0, v));

  const offset3 = c3 - (clamp(ring3Pct) / 100) * c3;
  const offset2 = c2 - (clamp(ring2Pct) / 100) * c2;
  const offset1 = c1 - (clamp(ring1Pct) / 100) * c1;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track Rings */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r3}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-rose-500/15 dark:text-rose-500/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r2}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-cyan-500/15 dark:text-cyan-500/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r1}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-emerald-500/15 dark:text-emerald-500/20"
        />

        {/* Outer Ring: Collected / Starred (Apple Rose / Coral) */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r3}
          stroke="#FA2D48"
          strokeWidth={strokeWidth}
          strokeDasharray={c3}
          initial={{ strokeDashoffset: c3 }}
          animate={{ strokeDashoffset: offset3 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          strokeLinecap="round"
          fill="none"
        />

        {/* Middle Ring: Learning (Apple Electric Cyan) */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r2}
          stroke="#00C7BE"
          strokeWidth={strokeWidth}
          strokeDasharray={c2}
          initial={{ strokeDashoffset: c2 }}
          animate={{ strokeDashoffset: offset2 }}
          transition={{ duration: 1.2, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          strokeLinecap="round"
          fill="none"
        />

        {/* Inner Ring: Mastered (Apple Activity Lime / Emerald) */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r1}
          stroke="#30D158"
          strokeWidth={strokeWidth}
          strokeDasharray={c1}
          initial={{ strokeDashoffset: c1 }}
          animate={{ strokeDashoffset: offset1 }}
          transition={{ duration: 1.3, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  );
};

export const GrowthCompassTab: React.FC = () => {
  const words = useLiveQuery(() => db.words.toArray(), []) || [];
  const tests = useLiveQuery(() => db.ieltsTests.toArray(), []) || [];
  const setActiveSpace = useAppStore(s => s.setActiveSpace);
  const closePersonalHub = useAppStore(s => s.closePersonalHub);
  const openNotebook = useAppStore(s => s.openNotebook);

  // Mastery metrics (strictly aligned with Vocabulary Vault)
  const masteryStats = React.useMemo(() => {
    let level3 = 0; // ◉ 已完全掌握 (Mastered)
    let level2 = 0; // ⊙ 正在复习中 (Learning)
    let level1 = 0; // ◎ 已加入词单 (Collected)

    words.forEach(w => {
      const lvl = w.masteryLevel ?? (w.isStarred ? 1 : 0);
      if (lvl === 3) level3++;
      else if (lvl === 2) level2++;
      else level1++; // Words in vault with level 0 or 1 count as newly collected in vault
    });

    const total = words.length;
    const denom = total || 1;
    const pct3 = total > 0 ? Math.round((level3 / denom) * 100) : 0;
    const pct2 = total > 0 ? Math.round((level2 / denom) * 100) : 0;
    const pct1 = total > 0 ? Math.round((level1 / denom) * 100) : 0;

    return {
      level3,
      level2,
      level1,
      total,
      pct3,
      pct2,
      pct1,
      // Visual ring progress: 0 when count is 0; minimum 6% arc when non-zero so small counts remain visible
      ring3: level3 > 0 ? Math.max(6, pct3) : 0,
      ring2: level2 > 0 ? Math.max(6, pct2) : 0,
      ring1: level1 > 0 ? Math.max(6, pct1) : 0
    };
  }, [words]);

  // Ebbinghaus Spaced Repetition metrics
  const ebbinghausMetrics = React.useMemo(() => {
    return getEbbinghausMetrics(words);
  }, [words]);

  // IELTS metrics (truthful zero-state + real practice calculations)
  const ieltsStats = React.useMemo(() => {
    if (tests.length === 0) {
      return {
        avgBand: '--',
        totalPassages: 0,
        totalTimeMin: 0
      };
    }
    const totalBand = tests.reduce((acc, t) => acc + (t.bandScore || 0), 0);
    const totalSec = tests.reduce((acc, t) => acc + (t.timeSpentSec || 0), 0);

    return {
      avgBand: (totalBand / tests.length).toFixed(1),
      totalPassages: tests.length,
      totalTimeMin: Math.max(1, Math.round(totalSec / 60))
    };
  }, [tests]);

  // Dynamic Word Acquisition Sources (calculated from actual words in vault)
  const sourceStats = React.useMemo(() => {
    let musicCount = 0;
    let ieltsCount = 0;
    let arCount = 0;

    words.forEach(w => {
      const ctx = (w.sourceContext || '').toLowerCase();
      if (ctx.startsWith('song') || ctx.includes('lyric') || ctx.includes('歌词') || ctx.includes('音乐')) {
        musicCount++;
      } else if (ctx.startsWith('ar') || ctx.includes('camera') || ctx.includes('实景') || ctx.includes('拍照')) {
        arCount++;
      } else {
        ieltsCount++;
      }
    });

    const total = words.length;
    const denom = total || 1;
    return [
      {
        key: 'music',
        label: '歌词听力',
        icon: Music2,
        iconColor: 'text-indigo-500',
        barColor: 'bg-indigo-500',
        count: musicCount,
        pct: total > 0 ? Math.round((musicCount / denom) * 100) : 0
      },
      {
        key: 'ielts',
        label: '雅思真题',
        icon: BookOpen,
        iconColor: 'text-sky-500',
        barColor: 'bg-sky-500',
        count: ieltsCount,
        pct: total > 0 ? Math.round((ieltsCount / denom) * 100) : 0
      },
      {
        key: 'ar',
        label: '实景拍照',
        icon: Camera,
        iconColor: 'text-teal-500',
        barColor: 'bg-teal-500',
        count: arCount,
        pct: total > 0 ? Math.round((arCount / denom) * 100) : 0
      }
    ];
  }, [words]);

  const isCheckedInToday = useAppStore(s => s.isCheckedInToday);
  const checkInToday = useAppStore(s => s.checkInToday);

  // Check-in state & sparkling animation
  const [isSparkling, setIsSparkling] = useState(false);

  // Real weekly check-in calendar & streak computation backed by localStorage
  const { currentStreak, weekDays } = React.useMemo(() => {
    const now = new Date();
    const toDateKey = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const todayKey = toDateKey(now);
    let storedDates: string[] = [];

    try {
      // Clean slate reset: ensure new installation or upgraded APK starts strictly from Day 0
      if (localStorage.getItem('lyricalens_streak_fresh_v3') !== 'true') {
        localStorage.removeItem('lyricalens_checkin_history');
        localStorage.removeItem('lyricalens_checked_in_date');
        localStorage.setItem('lyricalens_streak_fresh_v3', 'true');
      }

      const raw = localStorage.getItem('lyricalens_checkin_history');
      if (raw) {
        storedDates = JSON.parse(raw);
      } else {
        storedDates = [];
        localStorage.setItem('lyricalens_checkin_history', JSON.stringify([]));
      }
    } catch {
      storedDates = [];
    }

    const dateSet = new Set(storedDates);
    if (isCheckedInToday) {
      dateSet.add(todayKey);
    }

    // Calculate consecutive days streak up to today (or yesterday if not checked in yet today)
    let streak = 0;
    const cursor = new Date(now);
    if (!dateSet.has(todayKey)) {
      cursor.setDate(cursor.getDate() - 1);
    }
    while (dateSet.has(toDateKey(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    // Build Monday -> Sunday of the current real week
    const dayOfWeek = now.getDay(); // 0 (Sun) .. 6 (Sat)
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);

    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const days = labels.map((label, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const key = toDateKey(d);
      const isToday = key === todayKey;
      const done = isToday ? isCheckedInToday || dateSet.has(key) : dateSet.has(key);
      return { label, done, isToday };
    });

    return { currentStreak: streak, weekDays: days };
  }, [isCheckedInToday]);

  const isCheckedIn = isCheckedInToday;

  const handleCheckIn = () => {
    if (isCheckedIn) return;
    try {
      const now = new Date();
      const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const raw = localStorage.getItem('lyricalens_checkin_history');
      const list: string[] = raw ? JSON.parse(raw) : [];
      if (!list.includes(todayKey)) {
        list.push(todayKey);
        localStorage.setItem('lyricalens_checkin_history', JSON.stringify(list));
      }
    } catch {
      // Ignore storage error
    }
    checkInToday();
    setIsSparkling(true);
    setTimeout(() => setIsSparkling(false), 1200);
  };

  return (
    <div className="space-y-3.5 pb-6 animate-in fade-in duration-300">
      {/* 1. Streak Activity Widget */}
      <div className="relative overflow-hidden rounded-3xl bg-white/45 dark:bg-white/[0.04] backdrop-blur-xl border border-stone-900/[0.06] dark:border-white/[0.07] p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.3)]">
        {/* Floating Sparkles Burst on Check-in */}
        <AnimatePresence>
          {isSparkling && (
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1.15 }}
              exit={{ opacity: 0, scale: 1.4 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="absolute inset-0 pointer-events-none flex items-center justify-center z-20"
            >
              <div className="relative">
                <span className="absolute -top-12 -left-16 text-xs font-bold font-mono px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/30 animate-bounce whitespace-nowrap">
                  达成 {currentStreak} 天连续学习
                </span>
                <div className="w-48 h-48 rounded-full bg-amber-400/15 blur-xl pointer-events-none" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Flame Badge */}
            <motion.div
              key={isCheckedIn ? 'flame-ignited' : 'flame-extinguished'}
              initial={isCheckedIn ? { scale: 0.8, rotate: -15 } : false}
              animate={
                isCheckedIn
                  ? { scale: [0.8, 1.25, 1], rotate: [-15, 8, 0] }
                  : { scale: 1, rotate: 0 }
              }
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors duration-500 ${
                isCheckedIn
                  ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/25'
                  : 'bg-stone-900/[0.04] dark:bg-white/[0.06] text-stone-400 dark:text-stone-500 border border-stone-900/[0.05] dark:border-white/6'
              }`}
            >
              <Flame
                className={`w-5 h-5 transition-all duration-500 ${
                  isCheckedIn ? 'fill-white text-white' : 'fill-transparent text-stone-400 dark:text-stone-500'
                }`}
              />
            </motion.div>

            <div>
              <div className="flex items-baseline gap-1.5">
                <motion.span
                  key={currentStreak}
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 250 }}
                  className="text-2xl font-bold font-mono tracking-tight text-stone-900 dark:text-white"
                >
                  {currentStreak}
                </motion.span>
                <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                  天连续学习
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Check-in Button */}
          <motion.button
            type="button"
            onClick={handleCheckIn}
            disabled={isCheckedIn}
            whileHover={!isCheckedIn ? { scale: 1.04 } : {}}
            whileTap={!isCheckedIn ? { scale: 0.94 } : {}}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
              isCheckedIn
                ? 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 cursor-default select-none'
                : 'bg-stone-900/[0.04] dark:bg-white/[0.06] hover:bg-stone-900/[0.07] dark:hover:bg-white/[0.1] text-stone-600 dark:text-stone-300 border border-stone-900/[0.06] dark:border-white/6 cursor-pointer'
            }`}
          >
            {isCheckedIn ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>已签到</span>
              </>
            ) : (
              <>
                <Flame className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" />
                <span>今日签到</span>
              </>
            )}
          </motion.button>
        </div>

        {/* 7-day Real Weekly Calendar Dots */}
        <div className="grid grid-cols-7 gap-2 pt-4 mt-4 border-t border-stone-900/[0.05] dark:border-white/5 text-center">
          {weekDays.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1.5">
              <span
                className={`text-[10px] font-mono font-medium ${
                  item.isToday
                    ? 'text-stone-800 dark:text-stone-200 font-bold'
                    : 'text-stone-400 dark:text-stone-500'
                }`}
              >
                {item.label}
              </span>
              <motion.div
                key={`${item.label}-${item.done}`}
                initial={item.isToday && item.done ? { scale: 0.5, rotate: -45 } : false}
                animate={item.isToday && item.done ? { scale: [0.5, 1.2, 1], rotate: 0 } : { scale: 1 }}
                transition={{ duration: 0.4 }}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  item.done
                    ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-xs shadow-emerald-500/25'
                    : item.isToday
                      ? 'border-2 border-dashed border-amber-500/60 dark:border-amber-400/50 bg-amber-500/5 text-amber-500'
                      : 'bg-stone-900/[0.04] dark:bg-white/[0.05] text-stone-300'
                }`}
              >
                {item.done ? (
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : item.isToday ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                ) : null}
              </motion.div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Apple Health Activity Rings (Vocabulary Mastery + Integrated Review Entry) */}
      <div className="rounded-3xl bg-white/45 dark:bg-white/[0.04] backdrop-blur-xl border border-stone-900/[0.06] dark:border-white/[0.07] p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.3)] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-stone-800 dark:text-stone-100">
            生词掌握度
          </h3>

          <button
            type="button"
            onClick={() => openNotebook('ALL')}
            className="flex items-center gap-1 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-stone-900/[0.04] dark:bg-white/[0.06] px-2.5 py-1.5 rounded-full border border-stone-900/[0.05] dark:border-white/4 transition-all cursor-pointer"
          >
            <span>单词库 ({masteryStats.total})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Rings & Legend Layout */}
        <div className="flex items-center gap-5 pt-1">
          {/* Concentric Rings Visual */}
          <div className="shrink-0">
            <ActivityRings
              ring1Pct={masteryStats.ring3}
              ring2Pct={masteryStats.ring2}
              ring3Pct={masteryStats.ring1}
              size={110}
            />
          </div>

          {/* Metric Legend Tiers */}
          <div className="flex-1 space-y-2">
            {/* Mastered */}
            <button
              type="button"
              onClick={() => openNotebook('MASTERED')}
              className="w-full flex items-center justify-between p-1.5 rounded-xl hover:bg-stone-900/[0.04] dark:hover:bg-white/4 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#30D158] shadow-xs shadow-emerald-500/40" />
                <span className="text-xs font-medium text-stone-700 dark:text-stone-300">已完全掌握</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold font-mono text-stone-900 dark:text-white">{masteryStats.level3}</span>
                <span className="text-[10px] font-mono text-stone-400">({masteryStats.pct3}%)</span>
              </div>
            </button>

            {/* Learning */}
            <button
              type="button"
              onClick={() => openNotebook('UNMASTERED')}
              className="w-full flex items-center justify-between p-1.5 rounded-xl hover:bg-stone-900/[0.04] dark:hover:bg-white/4 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00C7BE] shadow-xs shadow-cyan-500/40" />
                <span className="text-xs font-medium text-stone-700 dark:text-stone-300">正在复习中</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold font-mono text-stone-900 dark:text-white">{masteryStats.level2}</span>
                <span className="text-[10px] font-mono text-stone-400">({masteryStats.pct2}%)</span>
              </div>
            </button>

            {/* Collected */}
            <button
              type="button"
              onClick={() => openNotebook('LEVEL_1')}
              className="w-full flex items-center justify-between p-1.5 rounded-xl hover:bg-stone-900/[0.04] dark:hover:bg-white/4 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FA2D48] shadow-xs shadow-rose-500/40" />
                <span className="text-xs font-medium text-stone-700 dark:text-stone-300">已加入词单</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold font-mono text-stone-900 dark:text-white">{masteryStats.level1}</span>
                <span className="text-[10px] font-mono text-stone-400">({masteryStats.pct1}%)</span>
              </div>
            </button>
          </div>
        </div>

        {/* Integrated Spaced Repetition Review & Flashcard Entry Bar */}
        <div className="pt-3 border-t border-stone-900/[0.05] dark:border-white/[0.06] flex items-center gap-2">
          <button
            type="button"
            onClick={() => openNotebook(ebbinghausMetrics.dueCount > 0 ? 'DUE_REVIEW' : 'ALL')}
            className={`flex-1 py-2.5 px-3.5 rounded-2xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer active:scale-[0.99] ${
              ebbinghausMetrics.dueCount > 0
                ? 'bg-amber-500/[0.08] hover:bg-amber-500/[0.14] dark:bg-amber-500/[0.12] dark:hover:bg-amber-500/[0.18] border border-amber-500/20 text-amber-800 dark:text-amber-200'
                : 'bg-stone-900/[0.03] hover:bg-stone-900/[0.06] dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-stone-900/[0.05] dark:border-white/[0.06] text-stone-700 dark:text-stone-200'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <RotateCcw
                className={`w-3.5 h-3.5 shrink-0 ${
                  ebbinghausMetrics.dueCount > 0 ? 'text-amber-500' : 'text-emerald-500'
                }`}
              />
              <span className="truncate">
                {ebbinghausMetrics.dueCount > 0
                  ? `今日 ${ebbinghausMetrics.dueCount} 词待复习`
                  : '今日待复习已完成'}
              </span>
            </div>
            <div className="flex items-center gap-0.5 font-semibold text-[11px] shrink-0 ml-2">
              <span>词表</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => openNotebook(ebbinghausMetrics.dueCount > 0 ? 'DUE_REVIEW' : 'ALL', true)}
            className="py-2.5 px-3.5 rounded-2xl bg-[#516050] hover:bg-[#3F4C3E] dark:bg-[#8FB996] dark:text-stone-950 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-200 dark:text-stone-900" />
            <span>闪卡速刷</span>
          </button>
        </div>
      </div>

      {/* 3. IELTS Academic Performance Widget */}
      <div className="rounded-3xl bg-white/45 dark:bg-white/[0.04] backdrop-blur-xl border border-stone-900/[0.06] dark:border-white/[0.07] p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.3)] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-stone-800 dark:text-stone-100">
            雅思模考表现
          </h3>

          <button
            type="button"
            onClick={() => {
              closePersonalHub();
              setActiveSpace(2);
            }}
            className="flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 bg-sky-500/10 dark:bg-sky-500/15 px-2.5 py-1.5 rounded-full transition-all cursor-pointer"
          >
            <span>进入真题精读</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5 pt-1">
          {/* Average Band */}
          <div className="p-3 rounded-2xl bg-stone-900/[0.03] dark:bg-white/[0.04] border border-stone-900/[0.04] dark:border-white/[0.05] text-center">
            <span className="text-[11px] font-medium text-stone-400 dark:text-stone-500 block mb-1">
              平均总分
            </span>
            <span className="text-2xl font-bold font-mono text-sky-600 dark:text-sky-400">
              {ieltsStats.avgBand}
            </span>
            <span className="text-[10px] font-mono text-stone-400 block mt-0.5">Band</span>
          </div>

          {/* Passages Practiced */}
          <div className="p-3 rounded-2xl bg-stone-900/[0.03] dark:bg-white/[0.04] border border-stone-900/[0.04] dark:border-white/[0.05] text-center">
            <span className="text-[11px] font-medium text-stone-400 dark:text-stone-500 block mb-1">
              完成篇数
            </span>
            <span className="text-2xl font-bold font-mono text-stone-900 dark:text-white">
              {ieltsStats.totalPassages}
            </span>
            <span className="text-[10px] text-stone-400 block mt-0.5">篇</span>
          </div>

          {/* Total Reading Time */}
          <div className="p-3 rounded-2xl bg-stone-900/[0.03] dark:bg-white/[0.04] border border-stone-900/[0.04] dark:border-white/[0.05] text-center">
            <span className="text-[11px] font-medium text-stone-400 dark:text-stone-500 block mb-1">
              精读时长
            </span>
            <span className="text-2xl font-bold font-mono text-stone-900 dark:text-white">
              {ieltsStats.totalTimeMin}
            </span>
            <span className="text-[10px] text-stone-400 block mt-0.5">分钟</span>
          </div>
        </div>
      </div>

      {/* 4. Dynamic Word Acquisition Sources Gauge */}
      <div className="rounded-3xl bg-white/45 dark:bg-white/[0.04] backdrop-blur-xl border border-stone-900/[0.06] dark:border-white/[0.07] p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.3)] space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-stone-800 dark:text-stone-100">
            单词来源
          </h3>
          <span className="text-[11px] font-mono text-stone-400 dark:text-stone-500">
            共 {words.length} 词
          </span>
        </div>

        <div className="space-y-3 pt-1">
          {sourceStats.map(src => {
            const Icon = src.icon;
            return (
              <div key={src.key} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-stone-700 dark:text-stone-200">
                    <Icon className={`w-3.5 h-3.5 ${src.iconColor}`} />
                    <span>{src.label}</span>
                  </span>
                  <div className="flex items-baseline gap-1.5 font-mono">
                    <span className="text-[11px] text-stone-400 dark:text-stone-500">{src.count} 词</span>
                    <span className="font-bold text-stone-900 dark:text-white">{src.pct}%</span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-stone-900/[0.06] dark:bg-stone-800 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${src.pct}%` }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className={`h-full ${src.barColor} rounded-full`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
