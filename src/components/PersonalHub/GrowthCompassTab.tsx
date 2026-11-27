import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../db';
import { getEbbinghausMetrics } from '../../utils/vocabEngine';
import {
  Flame,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Music2,
  Camera,
  Check,
  Layers
} from 'lucide-react';

/**
 * Concentric Circular Activity Rings (Apple Watch Fitness Style)
 */
interface ActivityRingsProps {
  ring1Pct: number; // Mastered (Vibrant Green)
  ring2Pct: number; // Learning (Cyan/Teal)
  ring3Pct: number; // Collected (Coral/Red)
  size?: number;
}

const ActivityRings: React.FC<ActivityRingsProps> = ({
  ring1Pct,
  ring2Pct,
  ring3Pct,
  size = 110
}) => {
  const strokeWidth = 8;
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
          className="text-[#FA2D48]/15 dark:text-[#FA2D48]/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r2}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-[#00C7BE]/15 dark:text-[#00C7BE]/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r1}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-[#30D158]/15 dark:text-[#30D158]/20"
        />

        {/* Outer Ring: Collected / Starred (Apple Pink/Red) */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r3}
          stroke="#FA2D48"
          strokeWidth={strokeWidth}
          strokeDasharray={c3}
          initial={{ strokeDashoffset: c3 }}
          animate={{ strokeDashoffset: offset3 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          strokeLinecap="round"
          fill="none"
        />

        {/* Middle Ring: Learning (Apple Cyan/Teal) */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r2}
          stroke="#00C7BE"
          strokeWidth={strokeWidth}
          strokeDasharray={c2}
          initial={{ strokeDashoffset: c2 }}
          animate={{ strokeDashoffset: offset2 }}
          transition={{ duration: 1.0, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          strokeLinecap="round"
          fill="none"
        />

        {/* Inner Ring: Mastered (Apple Vibrant Green) */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r1}
          stroke="#30D158"
          strokeWidth={strokeWidth}
          strokeDasharray={c1}
          initial={{ strokeDashoffset: c1 }}
          animate={{ strokeDashoffset: offset1 }}
          transition={{ duration: 1.1, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
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
    let level3 = 0; // 已完全掌握 (Mastered)
    let level2 = 0; // 正在复习中 (Learning)
    let level1 = 0; // 已加入词单 (Collected)

    words.forEach(w => {
      const lvl = w.masteryLevel ?? (w.isStarred ? 1 : 0);
      if (lvl === 3) level3++;
      else if (lvl === 2) level2++;
      else level1++;
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
        iconColor: 'text-[#30D158]',
        barColor: 'bg-[#30D158]',
        count: musicCount,
        pct: total > 0 ? Math.round((musicCount / denom) * 100) : 0
      },
      {
        key: 'ielts',
        label: '雅思真题',
        icon: BookOpen,
        iconColor: 'text-[#FA2D48]',
        barColor: 'bg-[#FA2D48]',
        count: ieltsCount,
        pct: total > 0 ? Math.round((ieltsCount / denom) * 100) : 0
      },
      {
        key: 'ar',
        label: '实景拍照',
        icon: Camera,
        iconColor: 'text-[#00C7BE]',
        barColor: 'bg-[#00C7BE]',
        count: arCount,
        pct: total > 0 ? Math.round((arCount / denom) * 100) : 0
      }
    ];
  }, [words]);

  const isCheckedInToday = useAppStore(s => s.isCheckedInToday);
  const checkInToday = useAppStore(s => s.checkInToday);

  // Check-in celebration & compact single-row collapse state
  const [justCheckedIn, setJustCheckedIn] = useState(false);
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);
  const collapseTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (collapseTimerRef.current !== null) {
        window.clearTimeout(collapseTimerRef.current);
      }
    };
  }, []);

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

    let streak = 0;
    const cursor = new Date(now);
    if (!dateSet.has(todayKey)) {
      cursor.setDate(cursor.getDate() - 1);
    }
    while (dateSet.has(toDateKey(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    const dayOfWeek = now.getDay();
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
  const showExpanded = !isCheckedIn || justCheckedIn || isCalendarExpanded;
  const isCompactMode = isCheckedIn && !showExpanded;

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
    setJustCheckedIn(true);
    setIsCalendarExpanded(false);
    checkInToday();
    if (collapseTimerRef.current !== null) {
      window.clearTimeout(collapseTimerRef.current);
    }
    collapseTimerRef.current = window.setTimeout(() => {
      setJustCheckedIn(false);
      collapseTimerRef.current = null;
    }, 950);
  };

  const handleToggleCompactCalendar = () => {
    if (!isCheckedIn || justCheckedIn) return;
    setIsCalendarExpanded(prev => !prev);
  };

  return (
    <div className="space-y-3.5 pb-6 animate-in fade-in duration-300">
      {/* 1. Streak Activity Widget (Full when unchecked; celebrates & collapses to 1-line bar after check-in) */}
      <div
        className={`relative overflow-hidden bg-white/85 dark:bg-[#151C28]/88 border border-stone-900/[0.06] dark:border-white/[0.07] shadow-[0_2px_18px_-4px_rgba(28,25,23,0.04)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.3)] transition-[padding,border-radius] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isCompactMode ? 'rounded-2xl px-4 py-3' : 'rounded-3xl p-5'
        }`}
      >
        {/* Soft Warm Sheen Sweep on Check-in */}
        <AnimatePresence>
          {justCheckedIn && (
            <motion.div
              initial={{ x: '-110%', opacity: 0.9 }}
              animate={{ x: '120%', opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-transparent via-orange-400/14 dark:via-orange-400/12 to-transparent"
            />
          )}
        </AnimatePresence>

        {/* Header Row (Never remounts, so flame badge & streak number interpolate smoothly during collapse) */}
        <div className="relative flex items-center justify-between gap-3">
          {/* Full-row native toggle button once checked in and settled */}
          {isCheckedIn && !justCheckedIn && (
            <button
              type="button"
              onClick={handleToggleCompactCalendar}
              aria-expanded={showExpanded}
              aria-label={showExpanded ? '收起本周签到记录' : '展开本周签到记录'}
              className="peer absolute -inset-x-2 -inset-y-1.5 z-10 rounded-xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900/20 dark:focus-visible:ring-white/25"
            />
          )}

          <div className={`flex items-center min-w-0 transition-all duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] ${isCompactMode ? 'gap-2.5' : 'gap-3'}`}>
            {/* Flame Badge with Ignition Burst */}
            <div className="relative shrink-0">
              <AnimatePresence>
                {justCheckedIn && (
                  <motion.span
                    initial={{ scale: 0.85, opacity: 0.65 }}
                    animate={{ scale: 1.6, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                    className="pointer-events-none absolute inset-0 rounded-xl bg-orange-500/35"
                  />
                )}
              </AnimatePresence>
              <motion.div
                animate={justCheckedIn ? { scale: [0.8, 1.14, 1] } : { scale: 1 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className={`relative flex items-center justify-center transition-all duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  isCompactMode ? 'w-7 h-7 rounded-lg' : 'w-10 h-10 rounded-xl'
                } ${
                  isCheckedIn
                    ? 'bg-gradient-to-br from-orange-500 to-rose-500 text-white shadow-sm shadow-orange-500/20'
                    : 'bg-stone-900/[0.04] dark:bg-white/[0.06] text-stone-400 dark:text-stone-500 border border-stone-900/[0.05] dark:border-white/[0.06]'
                }`}
              >
                <Flame
                  className={`transition-all duration-350 ${
                    isCompactMode ? 'w-3.5 h-3.5' : 'w-4.5 h-4.5'
                  } ${isCheckedIn ? 'fill-current' : 'fill-transparent'}`}
                />
              </motion.div>
            </div>

            <div className="flex items-baseline gap-1.5 min-w-0">
              <motion.span
                key={currentStreak}
                initial={justCheckedIn ? { y: 10, opacity: 0, scale: 0.85 } : false}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                className={`font-bold font-mono tabular-nums tracking-tight text-stone-900 dark:text-white inline-block transition-[font-size,line-height] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  isCompactMode ? 'text-[17px] leading-6' : 'text-2xl leading-8'
                }`}
              >
                {currentStreak}
              </motion.span>
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400 truncate">
                天连续学习
              </span>
            </div>
          </div>

          {/* Right Action Area */}
          {isCheckedIn && !justCheckedIn ? (
            <div className="flex items-center gap-2.5 shrink-0 pointer-events-none">
              {/* Mini 7-day Dot Rhythm (visible only when collapsed to 1 line) */}
              <AnimatePresence initial={false}>
                {isCompactMode && (
                  <motion.div
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 4 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="flex items-center gap-1"
                    aria-hidden="true"
                  >
                    {weekDays.map((d, i) => (
                      <span
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                          d.done
                            ? 'bg-stone-900 dark:bg-stone-100'
                            : 'bg-stone-900/12 dark:bg-white/15'
                        }`}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-[#30D158]">
                <Check className="w-3.5 h-3.5 stroke-[2.4]" />
                <span>已签到</span>
              </span>

              <ChevronDown
                className={`w-3.5 h-3.5 text-stone-400 dark:text-stone-500 peer-hover:text-stone-700 dark:peer-hover:text-stone-200 transition-transform duration-300 ${
                  showExpanded ? 'rotate-180' : 'rotate-0'
                }`}
              />
            </div>
          ) : (
            <motion.button
              type="button"
              onClick={handleCheckIn}
              disabled={isCheckedIn}
              whileTap={!isCheckedIn ? { scale: 0.96 } : undefined}
              className={`h-8 px-3 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 shrink-0 transition-colors duration-300 ${
                isCheckedIn
                  ? 'bg-[#30D158]/14 text-emerald-700 dark:text-[#30D158] cursor-default select-none'
                  : 'bg-stone-900/[0.04] hover:bg-stone-900/[0.08] dark:bg-white/[0.06] dark:hover:bg-white/[0.11] text-stone-700 dark:text-stone-200 border border-stone-900/[0.06] dark:border-white/[0.07] cursor-pointer'
              }`}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isCheckedIn ? (
                  <motion.span
                    key="checked-label"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                    className="inline-flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.4]" />
                    <span>已签到</span>
                  </motion.span>
                ) : (
                  <motion.span
                    key="unchecked-label"
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.16 }}
                    className="inline-flex items-center gap-1.5"
                  >
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    <span>今日签到</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          )}
        </div>

        {/* 7-day Real Weekly Calendar Dots (Collapsible with Smooth Height & Fade Transition) */}
        <AnimatePresence initial={false}>
          {showExpanded && (
            <motion.div
              key="weekly-calendar-strip"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-7 gap-2 pt-4 mt-4 border-t border-stone-900/[0.05] dark:border-white/[0.06] text-center">
                {weekDays.map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1.5">
                    <span
                      className={`text-[10px] font-mono ${
                        item.isToday
                          ? 'text-stone-900 dark:text-stone-100 font-semibold'
                          : 'text-stone-400 dark:text-stone-500'
                      }`}
                    >
                      {item.label}
                    </span>
                    <div className="relative flex items-center justify-center">
                      {/* Expanding Ring Ripple on Today's Circle upon Check-in */}
                      {item.isToday && justCheckedIn && (
                        <motion.span
                          initial={{ scale: 0.85, opacity: 0.75 }}
                          animate={{ scale: 1.75, opacity: 0 }}
                          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                          className="pointer-events-none absolute inset-0 rounded-full border-2 border-orange-500/70 dark:border-orange-400/70"
                        />
                      )}
                      <motion.div
                        animate={
                          item.isToday && justCheckedIn
                            ? { scale: [0.82, 1.16, 1] }
                            : { scale: 1 }
                        }
                        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-300 ${
                          item.done
                            ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-950'
                            : item.isToday
                              ? 'border border-amber-600/60 dark:border-amber-400/70 bg-amber-50/90 dark:bg-amber-500/15'
                              : 'bg-stone-900/[0.04] dark:bg-white/[0.05]'
                        }`}
                      >
                        {item.done ? (
                          <motion.span
                            initial={item.isToday && justCheckedIn ? { scale: 0, rotate: -25 } : false}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ duration: 0.32, delay: item.isToday && justCheckedIn ? 0.08 : 0, ease: [0.22, 1, 0.36, 1] }}
                            className="inline-flex items-center justify-center"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          </motion.span>
                        ) : item.isToday ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                        ) : null}
                      </motion.div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Vocabulary Mastery & Integrated Spaced Review */}
      <div className="rounded-3xl bg-white/85 dark:bg-[#151C28]/88 border border-stone-900/[0.06] dark:border-white/[0.07] p-5 shadow-[0_2px_18px_-4px_rgba(28,25,23,0.04)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.3)] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
            生词掌握度
          </h3>

          <button
            type="button"
            onClick={() => openNotebook('ALL')}
            className="inline-flex items-center gap-0.5 text-xs font-medium text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition-colors cursor-pointer tabular-nums"
          >
            <span>单词库 · {masteryStats.total}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Rings & Legend Layout */}
        <div className="flex items-center gap-5 pt-0.5">
          {/* Concentric Rings Visual */}
          <div className="shrink-0">
            <ActivityRings
              ring1Pct={masteryStats.ring3}
              ring2Pct={masteryStats.ring2}
              ring3Pct={masteryStats.ring1}
              size={106}
            />
          </div>

          {/* Metric Legend Tiers */}
          <div className="flex-1 space-y-1.5">
            {/* Mastered */}
            <button
              type="button"
              onClick={() => openNotebook('MASTERED')}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-stone-900/[0.035] dark:hover:bg-white/[0.04] transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#30D158]" />
                <span className="text-xs font-medium text-stone-700 dark:text-stone-300">已完全掌握</span>
              </div>
              <div className="flex items-baseline gap-1.5 font-mono tabular-nums">
                <span className="text-sm font-semibold text-stone-900 dark:text-white">{masteryStats.level3}</span>
                <span className="text-[10px] text-stone-400">{masteryStats.pct3}%</span>
              </div>
            </button>

            {/* Learning */}
            <button
              type="button"
              onClick={() => openNotebook('UNMASTERED')}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-stone-900/[0.035] dark:hover:bg-white/[0.04] transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00C7BE]" />
                <span className="text-xs font-medium text-stone-700 dark:text-stone-300">正在复习中</span>
              </div>
              <div className="flex items-baseline gap-1.5 font-mono tabular-nums">
                <span className="text-sm font-semibold text-stone-900 dark:text-white">{masteryStats.level2}</span>
                <span className="text-[10px] text-stone-400">{masteryStats.pct2}%</span>
              </div>
            </button>

            {/* Collected */}
            <button
              type="button"
              onClick={() => openNotebook('LEVEL_1')}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-stone-900/[0.035] dark:hover:bg-white/[0.04] transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FA2D48]" />
                <span className="text-xs font-medium text-stone-700 dark:text-stone-300">已加入词单</span>
              </div>
              <div className="flex items-baseline gap-1.5 font-mono tabular-nums">
                <span className="text-sm font-semibold text-stone-900 dark:text-white">{masteryStats.level1}</span>
                <span className="text-[10px] text-stone-400">{masteryStats.pct1}%</span>
              </div>
            </button>
          </div>
        </div>

        {/* Quiet Editorial Spaced-Repetition Footer */}
        <div className="pt-3.5 border-t border-stone-900/[0.06] dark:border-white/[0.06] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => openNotebook(ebbinghausMetrics.dueCount > 0 ? 'DUE_REVIEW' : 'ALL')}
            className="group min-w-0 flex items-center gap-2 py-1 text-left transition-colors cursor-pointer"
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                ebbinghausMetrics.dueCount > 0
                  ? 'bg-[#FA2D48]'
                  : 'bg-[#30D158]'
              }`}
            />
            <span className="text-xs font-medium text-stone-700 dark:text-stone-200 group-hover:text-stone-950 dark:group-hover:text-white truncate tabular-nums">
              {ebbinghausMetrics.dueCount > 0
                ? `${ebbinghausMetrics.dueCount} 词待复习`
                : '今日复习已完成'}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200 group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => openNotebook(ebbinghausMetrics.dueCount > 0 ? 'DUE_REVIEW' : 'ALL', true)}
            className="h-9 px-3.5 rounded-[10px] bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-stone-50 dark:text-stone-900 text-xs font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors active:scale-[0.98] cursor-pointer shrink-0"
          >
            <Layers className="w-3.5 h-3.5 opacity-80" />
            <span>闪卡复习</span>
          </button>
        </div>
      </div>

      {/* 3. IELTS Academic Performance Widget */}
      <div className="rounded-3xl bg-white/85 dark:bg-[#151C28]/88 border border-stone-900/[0.06] dark:border-white/[0.07] p-5 shadow-[0_2px_18px_-4px_rgba(28,25,23,0.04)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.3)] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
            雅思模考表现
          </h3>

          <button
            type="button"
            onClick={() => {
              closePersonalHub();
              setActiveSpace(2);
            }}
            className="inline-flex items-center gap-0.5 text-xs font-medium text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition-colors cursor-pointer"
          >
            <span>进入真题精读</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {/* Average Band */}
          <div className="p-3 rounded-2xl bg-stone-900/[0.025] dark:bg-white/[0.035] border border-stone-900/[0.04] dark:border-white/[0.05] text-center">
            <span className="text-[11px] font-medium text-stone-400 dark:text-stone-500 block mb-1">
              平均总分
            </span>
            <span className="text-2xl font-bold font-mono tabular-nums text-stone-900 dark:text-white">
              {ieltsStats.avgBand}
            </span>
            <span className="text-[10px] font-mono text-stone-400 block mt-0.5">Band</span>
          </div>

          {/* Passages Practiced */}
          <div className="p-3 rounded-2xl bg-stone-900/[0.025] dark:bg-white/[0.035] border border-stone-900/[0.04] dark:border-white/[0.05] text-center">
            <span className="text-[11px] font-medium text-stone-400 dark:text-stone-500 block mb-1">
              完成篇数
            </span>
            <span className="text-2xl font-bold font-mono tabular-nums text-stone-900 dark:text-white">
              {ieltsStats.totalPassages}
            </span>
            <span className="text-[10px] text-stone-400 block mt-0.5">篇</span>
          </div>

          {/* Total Reading Time */}
          <div className="p-3 rounded-2xl bg-stone-900/[0.025] dark:bg-white/[0.035] border border-stone-900/[0.04] dark:border-white/[0.05] text-center">
            <span className="text-[11px] font-medium text-stone-400 dark:text-stone-500 block mb-1">
              精读时长
            </span>
            <span className="text-2xl font-bold font-mono tabular-nums text-stone-900 dark:text-white">
              {ieltsStats.totalTimeMin}
            </span>
            <span className="text-[10px] text-stone-400 block mt-0.5">分钟</span>
          </div>
        </div>
      </div>

      {/* 4. Dynamic Word Acquisition Sources Gauge */}
      <div className="rounded-3xl bg-white/85 dark:bg-[#151C28]/88 border border-stone-900/[0.06] dark:border-white/[0.07] p-5 shadow-[0_2px_18px_-4px_rgba(28,25,23,0.04)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.3)] space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
            单词来源
          </h3>
          <span className="text-[11px] font-mono tabular-nums text-stone-400 dark:text-stone-500">
            共 {words.length} 词
          </span>
        </div>

        <div className="space-y-3 pt-0.5">
          {sourceStats.map(src => {
            const Icon = src.icon;
            return (
              <div key={src.key} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-stone-700 dark:text-stone-200">
                    <Icon className={`w-3.5 h-3.5 ${src.iconColor}`} />
                    <span>{src.label}</span>
                  </span>
                  <div className="flex items-baseline gap-1.5 font-mono tabular-nums">
                    <span className="text-[11px] text-stone-400 dark:text-stone-500">{src.count} 词</span>
                    <span className="font-semibold text-stone-900 dark:text-white">{src.pct}%</span>
                  </div>
                </div>
                <div className="w-full h-1.5 rounded-full bg-stone-900/[0.06] dark:bg-white/[0.07] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${src.pct}%` }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
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
