import React from 'react';
import { RefreshCw, RotateCcw, ImagePlus, Camera } from 'lucide-react';

interface ZenShutterProps {
  isFrozen: boolean;
  isScanning?: boolean;
  onToggleFreeze: () => void;
  onSelectPhoto?: () => void;
  onFlipCamera?: () => void;
  objectCount: number;
}

export const ZenShutter: React.FC<ZenShutterProps> = ({
  isFrozen,
  isScanning = false,
  onToggleFreeze,
  onSelectPhoto,
  onFlipCamera
}) => {
  return (
    <div className="relative z-30 pt-10 pb-[max(4.25rem,calc(env(safe-area-inset-bottom,0px)+3.25rem))] px-8 w-full grid grid-cols-3 items-center pointer-events-auto bg-gradient-to-t from-black/65 via-black/28 to-transparent select-none">
      {/* Left Slot: Album Photo Picker (Strictly Symmetrical 44x44 Frosted Glass Circle) */}
      <div className="flex items-center justify-start">
        {onSelectPhoto && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectPhoto();
            }}
            disabled={isScanning}
            className="w-11 h-11 rounded-full bg-stone-950/35 hover:bg-stone-950/50 active:scale-92 backdrop-blur-xl border border-white/30 flex items-center justify-center text-white shadow-[0_4px_20px_rgba(0,0,0,0.28)] transition-all duration-200 cursor-pointer disabled:opacity-40"
            title="从相册选图"
            aria-label="Choose photo from album"
          >
            <ImagePlus className="w-[18px] h-[18px] stroke-[1.75]" />
          </button>
        )}
      </div>

      {/* Center: Frosted Glass Outer Ring + Camera / Retake Icon Button */}
      <div className="flex items-center justify-center">
        <button
          id="zen-shutter-btn"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFreeze();
          }}
          disabled={isScanning}
          title={isFrozen ? '返回取景重拍' : '轻触快门定格识物'}
          aria-label={isFrozen ? 'Return to live viewfinder' : 'Freeze frame and scan'}
          className="group relative w-16 h-16 rounded-full p-1.5 flex items-center justify-center border border-white/45 bg-stone-950/28 hover:bg-stone-950/42 hover:border-white/65 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300 cursor-pointer active:scale-92"
        >
          {/* Subtle 1px Optical Ring Sweep when Analyzing */}
          {isScanning && (
            <svg
              className="absolute inset-0 w-full h-full -rotate-90 animate-spin pointer-events-none"
              style={{ animationDuration: '1.4s' }}
              viewBox="0 0 64 64"
            >
              <circle
                cx="32"
                cy="32"
                r="30.5"
                fill="none"
                stroke="rgba(255, 255, 255, 0.85)"
                strokeWidth="1.5"
                strokeDasharray="48 150"
                strokeLinecap="round"
              />
            </svg>
          )}

          {/* Inner Frosted Glass Core */}
          <span
            className={`w-full h-full rounded-full flex items-center justify-center transition-all duration-300 border text-white ${
              isScanning
                ? 'bg-stone-950/35 border-white/35 scale-95'
                : isFrozen
                ? 'bg-stone-950/55 border-white/50 group-hover:bg-stone-950/70 scale-95'
                : 'bg-white/18 border-white/40 group-hover:bg-white/26 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]'
            }`}
          >
            {isFrozen && !isScanning ? (
              <RotateCcw className="w-[19px] h-[19px] text-white stroke-[1.85] transition-transform duration-300 group-hover:-rotate-45" />
            ) : (
              <Camera
                className={`w-[21px] h-[21px] text-white stroke-[1.75] transition-all duration-300 ${
                  isScanning ? 'opacity-65 scale-95' : 'group-hover:scale-105'
                }`}
              />
            )}
          </span>
        </button>
      </div>

      {/* Right Slot: Camera Flip Button (Hidden cleanly while viewing a frozen photo) */}
      <div className="flex items-center justify-end">
        {onFlipCamera && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFlipCamera();
            }}
            disabled={isFrozen || isScanning}
            aria-hidden={isFrozen}
            tabIndex={isFrozen ? -1 : 0}
            className={`w-11 h-11 rounded-full bg-stone-950/35 hover:bg-stone-950/50 active:scale-92 backdrop-blur-xl border border-white/30 flex items-center justify-center text-white shadow-[0_4px_20px_rgba(0,0,0,0.28)] transition-all duration-200 ${
              isFrozen
                ? 'opacity-0 scale-90 pointer-events-none'
                : 'opacity-100 scale-100 cursor-pointer'
            }`}
            aria-label="Flip Camera"
            title="翻转摄像头"
          >
            <RefreshCw className="w-[18px] h-[18px] stroke-[1.75]" />
          </button>
        )}
      </div>
    </div>
  );
};
