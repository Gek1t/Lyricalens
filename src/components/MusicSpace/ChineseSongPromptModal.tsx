import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music, X, Filter } from 'lucide-react';
import { SongItem } from '../../types';
import { isChineseSong } from '../../utils/vocabEngine';

export interface ChineseSongPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlistName: string;
  allSongs?: SongItem[];
  totalCount?: number;
  chineseCount?: number;
  englishCount?: number;
  onConfirmImportEnglishOnly: () => void;
  onConfirmImportAll: () => void;
}

export const ChineseSongPromptModal: React.FC<ChineseSongPromptModalProps> = ({
  isOpen,
  onClose,
  playlistName,
  allSongs,
  totalCount: propTotalCount,
  chineseCount: propChineseCount,
  englishCount: propEnglishCount,
  onConfirmImportEnglishOnly,
  onConfirmImportAll
}) => {
  if (!isOpen) return null;

  const totalCount = propTotalCount ?? (allSongs ? allSongs.length : 0);
  const chineseCount = propChineseCount ?? (allSongs ? allSongs.filter(s => isChineseSong(s)).length : 0);
  const englishCount = propEnglishCount ?? Math.max(0, totalCount - chineseCount);

  return (
    <AnimatePresence>
      <div
        id="chinese-song-prompt-modal-container"
        data-no-swipe="true"
        data-no-gesture="true"
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 select-none pointer-events-auto"
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {/* Backdrop */}
        <motion.div
          key="chinese-prompt-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="absolute inset-0 bg-stone-950/50 dark:bg-black/70 backdrop-blur-xs cursor-pointer"
        />

        {/* Compact Modal Dialog Card */}
        <motion.div
          key="chinese-prompt-card"
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm bg-[#FAF7F2] dark:bg-[#151D2A] rounded-2xl border border-stone-200/90 dark:border-slate-800 shadow-xl p-4 sm:p-5 overflow-hidden z-10"
        >
          {/* Close Icon Top Right */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="pr-6 mb-3">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              导入选项：检测到中文歌曲
            </h3>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
              {playlistName || '歌单'} · 共 {totalCount} 首 (含 {chineseCount} 首中文，{englishCount} 首外语)
            </p>
          </div>

          {/* Action Choice Buttons */}
          <div className="space-y-2 pt-1">
            {/* Primary Choice: English Only */}
            <button
              type="button"
              onClick={onConfirmImportEnglishOnly}
              className="w-full px-3 py-2.5 rounded-xl bg-[#516050] hover:bg-[#404c3f] dark:bg-[#688E6D] dark:hover:bg-[#587a5c] text-white flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer"
            >
              <div className="flex items-center gap-2 text-left min-w-0">
                <Filter className="w-3.5 h-3.5 text-white/90 shrink-0" />
                <div>
                  <div className="text-xs font-medium">仅导入外语/英文歌曲</div>
                  <div className="text-[10px] text-white/75 mt-0.5">
                    导入 {englishCount} 首，过滤 {chineseCount} 首中文
                  </div>
                </div>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-mono shrink-0 ml-2">
                {englishCount}首
              </span>
            </button>

            {/* Secondary Choice: Import All */}
            <button
              type="button"
              onClick={onConfirmImportAll}
              className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#1C2536] hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-slate-800 flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer"
            >
              <div className="flex items-center gap-2 text-left min-w-0">
                <Music className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <div>
                  <div className="text-xs font-medium">导入全部歌曲</div>
                  <div className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">
                    保留包含中文歌在内的全部 {totalCount} 首
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-stone-400 font-mono shrink-0 ml-2">
                {totalCount}首
              </span>
            </button>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-full py-1.5 text-center text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 text-xs transition-colors cursor-pointer"
            >
              取消
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
