import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store/useAppStore';

export const ToastNotification: React.FC = () => {
  const toastMessage = useAppStore(s => s.toastMessage);
  const isFullscreenLyricsOpen = useAppStore(s => s.isFullscreenLyricsOpen);

  if (isFullscreenLyricsOpen) return null;

  const cleanMessage = toastMessage
    ? toastMessage.replace(/^[✨🎯🔔🔥🟢🔴]+\s*/u, '').trim()
    : null;

  return (
    <AnimatePresence>
      {cleanMessage && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[100] pointer-events-none w-max max-w-[84%]">
          <motion.div
            key={cleanMessage}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="px-3.5 py-2 rounded-xl bg-stone-900/88 dark:bg-stone-900/92 text-white/95 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.22)] border border-white/10 text-xs font-normal tracking-wide text-center"
          >
            <span className="truncate block">{cleanMessage}</span>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};


