import React from 'react';
import { RefreshCw, Play, Loader2, ImagePlus, Camera } from 'lucide-react';

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
    <div className="relative z-30 pt-8 pb-[max(2.5rem,calc(env(safe-area-inset-bottom,0px)+1.5rem))] px-8 w-full grid grid-cols-3 items-center pointer-events-auto select-none bg-gradient-to-t from-black/60 via-black/25 to-transparent">
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
            className="w-11 h-11 rounded-full flex items-center justify-center bg-white/14 hover:bg-white/22 active:scale-92 backdrop-blur-xl border border-white/28 text-white shadow-[0_4px_20px_rgba(0,0,0,0.22)] transition-all duration-200 cursor-pointer disabled:opacity-40"
            title="从相册选图"
            aria-label="Choose photo from album"
          >
            <ImagePlus className="w-[18px] h-[18px] stroke-[1.75]" />
          </button>
        )}
      </div>

      {/* Center: Frosted Glass Outer Ring + Camera Wireframe Icon Button */}
      <div className="flex items-center justify-center">
        <button
          id="zen-shutter-btn"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFreeze();
          }}
          disabled={isScanning}
          title={isFrozen ? '点击恢复实时取景' : '轻触快门定格识物'}
          aria-label={isFrozen ? 'Resume live stream' : 'Freeze frame and scan'}
          className="group relative w-16 h-16 rounded-full p-1.5 flex items-center justify-center backdrop-blur-2xl border border-white/35 bg-white/10 hover:bg-white/16 hover:border-white/55 transition-all duration-300 cursor-pointer active:scale-92 shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
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
            className={`w-full h-full rounded-full flex items-center justify-center transition-all duration-300 border border-white/35 text-white ${
              isScanning
                ? 'bg-white/14 scale-95'
                : isFrozen
                  ? 'bg-white/22 scale-95'
                  : 'bg-white/16 group-hover:bg-white/24 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]'
            }`}
          >
            {isFrozen && !isScanning ? (
              <Play className="w-5 h-5 fill-white text-white ml-0.5" />
            ) : (
              <Camera
                className={`w-[21px] h-[21px] stroke-[1.75] text-white transition-all duration-300 ${
                  isScanning ? 'opacity-65 scale-95' : 'group-hover:scale-105'
                }`}
              />
            )}
          </span>
        </button>
      </div>

      {/* Right Slot: Camera Flip Button (Strictly Symmetrical 44x44 Frosted Glass Circle) */}
      <div className="flex items-center justify-end">
        {onFlipCamera && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFlipCamera();
            }}
            className="w-11 h-11 rounded-full flex items-center justify-center bg-white/14 hover:bg-white/22 active:scale-92 backdrop-blur-xl border border-white/28 text-white shadow-[0_4px_20px_rgba(0,0,0,0.22)] transition-all duration-200 cursor-pointer"
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
