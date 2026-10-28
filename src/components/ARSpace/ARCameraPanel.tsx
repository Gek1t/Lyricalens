import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Flashlight, FlashlightOff } from 'lucide-react';
import { ARDetectedObject, MasteryLevel } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { TopHeader } from '../TopHeader';
import { SpatialTag } from './SpatialTag';
import { ZenShutter } from './ZenShutter';
import { db, setWordMastery } from '../../db';

interface ARCameraPanelProps {
  onOpenNotebook: () => void;
}

const SAMPLE_DESK_IMAGE_URL =
  'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=960&q=85';

const SAMPLE_DESK_TAGS: ARDetectedObject[] = [
  {
    id: 'sample-tag-porcelain',
    label: 'porcelain',
    phonetic: '/ˈpɔːsəlɪn/',
    pos: { x: 18, y: 52, z: 0 },
    confidence: 0.96,
    wordData: {
      word: 'porcelain',
      phoneticUk: '/ˈpɔːsəlɪn/',
      phoneticUs: '/ˈpɔːrsəlɪn/',
      partOfSpeech: 'n.',
      definition: 'A white vitrified translucent ceramic; china.',
      definitionCn: '白瓷杯；瓷器',
      examples: [
        {
          en: 'Warm black coffee was served in a minimalist white porcelain mug.',
          cn: '温热的黑咖啡盛在极简的白瓷马克杯中。',
          source: 'AR 实景识物 · 书房桌面'
        }
      ],
      sourceContext: 'AR 实景识物: Study Desk',
      isStarred: false,
      masteryLevel: 0,
      addedTimestamp: Date.now(),
      categories: ['IELTS', 'AR Spatial']
    }
  },
  {
    id: 'sample-tag-manuscript',
    label: 'manuscript',
    phonetic: '/ˈmænjʊskrɪpt/',
    pos: { x: 66, y: 50, z: 0 },
    confidence: 0.97,
    wordData: {
      word: 'manuscript',
      phoneticUk: '/ˈmænjʊskrɪpt/',
      phoneticUs: '/ˈmænjəskrɪpt/',
      partOfSpeech: 'n.',
      definition: 'A book, document, or piece of text written by hand rather than typed or printed.',
      definitionCn: '手稿；手写笔记',
      examples: [
        {
          en: 'She revised the handwritten manuscript carefully with a black pen.',
          cn: '她用黑色钢笔仔细修改了这份手写原稿。',
          source: 'AR 实景识物 · 书房桌面'
        }
      ],
      sourceContext: 'AR 实景识物: Study Desk',
      isStarred: false,
      masteryLevel: 0,
      addedTimestamp: Date.now(),
      categories: ['IELTS', 'AR Spatial', 'Academic']
    }
  },
  {
    id: 'sample-tag-pen',
    label: 'fountain pen',
    phonetic: '/ˈfaʊntɪn pen/',
    pos: { x: 83, y: 71, z: 0 },
    confidence: 0.96,
    wordData: {
      word: 'fountain pen',
      phoneticUk: '/ˈfaʊntɪn pen/',
      phoneticUs: '/ˈfaʊntn pen/',
      partOfSpeech: 'n.',
      definition: 'A pen with a reservoir or cartridge from which ink flows continuously to the nib.',
      definitionCn: '钢笔；签字笔',
      examples: [
        {
          en: 'A sleek black fountain pen rested diagonally across the open notebook.',
          cn: '一支利落的黑色钢笔斜放在摊开的笔记本上。',
          source: 'AR 实景识物 · 书房桌面'
        }
      ],
      sourceContext: 'AR 实景识物: Study Desk',
      isStarred: false,
      masteryLevel: 0,
      addedTimestamp: Date.now(),
      categories: ['IELTS', 'AR Spatial']
    }
  },
  {
    id: 'sample-tag-laptop',
    label: 'laptop',
    phonetic: '/ˈlæptɒp/',
    pos: { x: 35, y: 76, z: 0 },
    confidence: 0.95,
    wordData: {
      word: 'laptop',
      phoneticUk: '/ˈlæptɒp/',
      phoneticUs: '/ˈlæptɑːp/',
      partOfSpeech: 'n.',
      definition: 'A computer that is portable and suitable for use while traveling.',
      definitionCn: '便携电脑',
      examples: [
        {
          en: 'Students often draft essays on a laptop while consulting paper notes.',
          cn: '学生们常在查阅纸质笔记的同时用便携电脑起草论文。',
          source: 'AR 实景识物 · 书房桌面'
        }
      ],
      sourceContext: 'AR 实景识物: Study Desk',
      isStarred: false,
      masteryLevel: 0,
      addedTimestamp: Date.now(),
      categories: ['IELTS', 'AR Spatial']
    }
  }
];

export const ARCameraPanel: React.FC<ARCameraPanelProps> = ({ onOpenNotebook }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Hard Permission & Stream States
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [isRequesting, setIsRequesting] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Global App Store
  const isScannerActive = useAppStore(s => s.isScannerActive);
  const setScannerActive = useAppStore(s => s.setScannerActive);
  const openWordDetail = useAppStore(s => s.openWordDetail);
  const activeSpace = useAppStore(s => s.activeSpace);
  const showToast = useAppStore(s => s.showToast);
  const isFrozen = useAppStore(s => s.isArFrozen);
  const setIsFrozen = useAppStore(s => s.setIsArFrozen);
  const activeBubbleId = useAppStore(s => s.arActiveBubbleId);
  const setActiveBubbleId = useAppStore(s => s.setArActiveBubbleId);

  // Freeze Frame & Vision State
  const [frozenFrameUrl, setFrozenFrameUrl] = useState<string | null>(null);
  const [shutterFlash, setShutterFlash] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [hasTorch] = useState<boolean>(true);
  const freezeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasFreezeFrame, setHasFreezeFrame] = useState<boolean>(false);
  const streamStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // First-time Guide Overlay State ("此次关掉" vs "以后都关掉")
  const [showFirstTimeGuide, setShowFirstTimeGuide] = useState<boolean>(() => {
    try {
      return localStorage.getItem('lyricalens_ar_guide_dismissed_forever') !== 'true';
    } catch {
      return true;
    }
  });
  const [dismissedThisSession, setDismissedThisSession] = useState<boolean>(false);
  const [guideEntered, setGuideEntered] = useState<boolean>(false);

  // Spatial Tags & Interactive Bubble
  const [tags, setTags] = useState<ARDetectedObject[]>([]);
  const [bobOffset, setBobOffset] = useState<number>(0);

  // Crop any image or video source to match the exact object-cover viewport of containerRef
  const captureObjectCoverBase64 = useCallback(
    (
      source: HTMLVideoElement | HTMLImageElement,
      sourceWidth: number,
      sourceHeight: number,
      quality = 0.8
    ): string | null => {
      try {
        if (!sourceWidth || !sourceHeight) return null;
        const containerW = containerRef.current?.clientWidth || window.innerWidth || 390;
        const containerH = containerRef.current?.clientHeight || window.innerHeight || 844;
        const targetAspect = containerW / containerH;
        const sourceAspect = sourceWidth / sourceHeight;

        let sx = 0;
        let sy = 0;
        let sw = sourceWidth;
        let sh = sourceHeight;

        if (sourceAspect > targetAspect) {
          // Source is wider than container: crop left & right
          sh = sourceHeight;
          sw = sourceHeight * targetAspect;
          sx = (sourceWidth - sw) / 2;
        } else {
          // Source is taller than container: crop top & bottom
          sw = sourceWidth;
          sh = sourceWidth / targetAspect;
          sy = (sourceHeight - sh) / 2;
        }

        const maxDim = 768;
        let outW = Math.round(sw);
        let outH = Math.round(sh);
        if (outW > maxDim || outH > maxDim) {
          if (outW > outH) {
            outH = Math.round((outH * maxDim) / outW);
            outW = maxDim;
          } else {
            outW = Math.round((outW * maxDim) / outH);
            outH = maxDim;
          }
        }

        const canvas = hiddenCanvasRef.current || document.createElement('canvas');
        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        ctx.drawImage(source, sx, sy, sw, sh, 0, 0, outW, outH);
        return canvas.toDataURL('image/jpeg', quality);
      } catch (err) {
        console.warn('Object-cover crop error:', err);
        return null;
      }
    },
    []
  );

  // Capture lightweight video frame to base64 jpeg matching viewfinder aspect ratio
  const captureCurrentFrameBase64 = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return null;
    return captureObjectCoverBase64(video, video.videoWidth, video.videoHeight, 0.76);
  }, [captureObjectCoverBase64]);

  // Deep Gemini / Multimodal Cloud Vision Analysis
  const runCloudVisionDetection = useCallback(
    async (overrideBase64?: string, fallbackTagsOnFail?: ARDetectedObject[]) => {
      const frameBase64 = overrideBase64 || frozenFrameUrl || captureCurrentFrameBase64();
      if (!frameBase64) return;

      setIsScanning(true);

      const applySyncedTags = async (rawTags: ARDetectedObject[]) => {
        const wordsInDb = await db.words.toArray();
        const wordMap = new Map(wordsInDb.map(w => [w.word.toLowerCase(), w]));
        const updatedTags: ARDetectedObject[] = rawTags.map((t: any) => {
          const match = wordMap.get(t.wordData.word.toLowerCase());
          return {
            ...t,
            wordData: {
              ...t.wordData,
              masteryLevel: (match?.masteryLevel ?? (match?.isStarred ? 1 : 0)) as MasteryLevel,
              isStarred: Boolean(match?.isStarred || (match?.masteryLevel ?? 0) > 0)
            }
          };
        });
        setTags(updatedTags);
      };

      try {
        const res = await fetch('/api/gemini/vision-detect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: frameBase64 })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data.tags && Array.isArray(data.tags) && data.tags.length > 0 && !data.isFallback) {
          await applySyncedTags(data.tags);
        } else if (fallbackTagsOnFail && fallbackTagsOnFail.length > 0) {
          await applySyncedTags(fallbackTagsOnFail);
        } else if (data.tags && Array.isArray(data.tags) && data.tags.length > 0) {
          await applySyncedTags(data.tags);
        } else {
          showToast('未检测到清晰物体，请重试');
        }
      } catch (err) {
        console.warn('Vision detection fallback:', err);
        if (fallbackTagsOnFail && fallbackTagsOnFail.length > 0) {
          await applySyncedTags(fallbackTagsOnFail);
        } else {
          showToast('网络请求超时，请点击快门重试');
        }
      } finally {
        setIsScanning(false);
      }
    },
    [captureCurrentFrameBase64, frozenFrameUrl, showToast]
  );

  // Clean stream release
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
    setIsTorchOn(false);
  };

  // Start Camera
  const startCamera = async (targetFacing = facingMode) => {
    setIsRequesting(true);
    const oldStream = streamRef.current;

    let stream: MediaStream | null = null;
    try {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: targetFacing },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      if (stream) {
        if (oldStream && oldStream !== stream) {
          oldStream.getTracks().forEach(t => t.stop());
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
          try {
            await videoRef.current.play();
          } catch (playErr) {
            console.warn('Video autoplay prevented:', playErr);
          }
        }
        setStreamActive(true);
        setPermissionDenied(false);
        setScannerActive(true);
        setIsFrozen(false);
        setFrozenFrameUrl(null);
        setTags([]);
        setActiveBubbleId(null);
      }
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      if (!streamRef.current) {
        setStreamActive(false);
        setPermissionDenied(true);
      }
    } finally {
      setIsRequesting(false);
    }
  };

  // Handle unfreezing externally (e.g. from Android back button)
  const prevFrozenRef = useRef(isFrozen);
  useEffect(() => {
    if (prevFrozenRef.current && !isFrozen) {
      setFrozenFrameUrl(null);
      setTags([]);
      setActiveBubbleId(null);
      if (!streamActive && activeSpace === 0) {
        startCamera(facingMode);
      }
    }
    prevFrozenRef.current = isFrozen;
  }, [isFrozen, streamActive, activeSpace, facingMode]);

  // Lifecycle stream control & delayed guide entrance based on active panel
  useEffect(() => {
    let guideTimer: ReturnType<typeof setTimeout> | null = null;
    if (activeSpace === 0) {
      if (streamStopTimerRef.current) {
        clearTimeout(streamStopTimerRef.current);
        streamStopTimerRef.current = null;
      }
      if (isScannerActive && !isFrozen) {
        if (!streamActive || !streamRef.current) {
          startCamera(facingMode);
        }
      }
      guideTimer = setTimeout(() => {
        setGuideEntered(true);
      }, 420);
    } else {
      setGuideEntered(false);
      // Keep camera active during normal in-app tab switching to eliminate black flash when swiping back!
      const video = videoRef.current;
      const canvas = freezeCanvasRef.current;
      if (video && video.videoWidth > 0 && canvas) {
        try {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            setHasFreezeFrame(true);
          }
        } catch {
          // ignore
        }
      }
    }
    return () => {
      if (guideTimer) clearTimeout(guideTimer);
    };
  }, [activeSpace, isScannerActive, isFrozen, facingMode]);

  // Clean background unmount & phone screen sleep / minimize listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        stopStream();
      } else if (document.visibilityState === 'visible' && activeSpace === 0 && isScannerActive && !isFrozen) {
        startCamera(facingMode);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopStream();
    };
  }, [activeSpace, isScannerActive, isFrozen, facingMode]);

  // Subtle floating physics when frozen
  useEffect(() => {
    if (!isFrozen) return;

    const interval = setInterval(() => {
      setBobOffset(prev => (prev + 0.04) % (Math.PI * 2));
    }, 45);

    return () => clearInterval(interval);
  }, [isFrozen]);

  // Toggle Camera Facing Mode (Front / Back)
  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    if (streamActive && activeSpace === 0) {
      startCamera(nextMode);
    }
  };

  // Toggle Flashlight / Torch
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;

    try {
      const nextState = !isTorchOn;
      const capabilities: any =
        typeof videoTrack.getCapabilities === 'function' ? videoTrack.getCapabilities() : {};
      if (capabilities && capabilities.torch !== undefined) {
        await (videoTrack as any).applyConstraints({
          advanced: [{ torch: nextState }]
        });
        setIsTorchOn(nextState);
      } else {
        setIsTorchOn(nextState);
      }
    } catch (err) {
      console.warn('Torch toggle error:', err);
      setIsTorchOn(!isTorchOn);
    }
  };

  // Trigger Album Photo Picker
  const handleTriggerPhotoPicker = () => {
    fileInputRef.current?.click();
  };

  // Handle Album Image Selection & Resize to Base64 matching container aspect ratio
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = (event) => {
      const resultUrl = event.target?.result as string;
      if (!resultUrl) return;

      const img = new Image();
      img.onload = () => {
        const compressedDataUrl =
          captureObjectCoverBase64(img, img.naturalWidth || img.width, img.naturalHeight || img.height, 0.8) ||
          resultUrl;

        // Freeze viewfinder with the selected album image
        setShutterFlash(true);
        setTimeout(() => setShutterFlash(false), 140);

        setFrozenFrameUrl(compressedDataUrl);
        setIsFrozen(true);
        setScannerActive(true);
        setTags([]);
        setActiveBubbleId(null);
        runCloudVisionDetection(compressedDataUrl);
      };
      img.src = resultUrl;
    };
    reader.readAsDataURL(file);
  };

  // Toggle Freeze Frame (Zen Shutter Core Mechanism)
  const handleToggleFreeze = () => {
    if (!streamActive && !isFrozen) {
      startCamera(facingMode);
      return;
    }

    if (!isFrozen) {
      // 1. Capture snapshot from live video feed onto canvas
      let snapshotUrl: string | null = null;
      try {
        snapshotUrl = captureCurrentFrameBase64();
        if (snapshotUrl) {
          setFrozenFrameUrl(snapshotUrl);
        }
      } catch (e) {
        console.warn('Failed to capture frame snapshot:', e);
      }

      // 2. Optical shutter flash feedback
      setShutterFlash(true);
      setTimeout(() => setShutterFlash(false), 140);

      // 3. Freeze state
      setIsFrozen(true);

      // 4. Trigger vision detection on the frozen snapshot
      if (snapshotUrl) {
        runCloudVisionDetection(snapshotUrl);
      }
    } else {
      // Resume Live Stream (or return to standby if camera wasn't started)
      setIsFrozen(false);
      setFrozenFrameUrl(null);
      setTags([]);
      setActiveBubbleId(null);
      if (!streamActive) {
        startCamera(facingMode);
      }
    }
  };

  // Handle Mastery level updates directly from Spatial Tag
  const handleUpdateTagMastery = async (tagId: string, newLevel: MasteryLevel) => {
    setTags(prev =>
      prev.map(t => {
        if (t.id === tagId) {
          return {
            ...t,
            wordData: {
              ...t.wordData,
              masteryLevel: newLevel,
              isStarred: newLevel > 0
            }
          };
        }
        return t;
      })
    );

    const targetTag = tags.find(t => t.id === tagId);
    if (targetTag) {
      try {
        await setWordMastery(targetTag.wordData.word, newLevel);
      } catch (err) {
        console.warn('Error updating mastery in DB:', err);
      }
    }
  };

  // Hero flight to full-screen word detail
  const handleHeroFlight = (tag: ARDetectedObject, rect: DOMRect | null) => {
    openWordDetail(tag.wordData, rect, 'fullscreen');
  };

  // Try the curated sample desk scene by cropping to viewport & running real multimodal vision detection
  const handleTrySampleScene = async () => {
    setDismissedThisSession(true);
    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 140);

    setFrozenFrameUrl(SAMPLE_DESK_IMAGE_URL);
    setIsFrozen(true);
    setScannerActive(true);
    setIsScanning(true);
    setTags([]);
    setActiveBubbleId(null);

    try {
      const croppedBase64 = await new Promise<string | null>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const cropped = captureObjectCoverBase64(
            img,
            img.naturalWidth || img.width,
            img.naturalHeight || img.height,
            0.82
          );
          resolve(cropped);
        };
        img.onerror = () => resolve(null);
        img.src = SAMPLE_DESK_IMAGE_URL;
      });

      if (croppedBase64) {
        setFrozenFrameUrl(croppedBase64);
        await runCloudVisionDetection(croppedBase64, SAMPLE_DESK_TAGS);
      } else {
        await runCloudVisionDetection(undefined, SAMPLE_DESK_TAGS);
      }
    } catch {
      setTags(SAMPLE_DESK_TAGS);
      setIsScanning(false);
    }
  };

  const handleDismissGuideOnce = () => {
    setDismissedThisSession(true);
  };

  const handleDismissGuideForever = () => {
    try {
      localStorage.setItem('lyricalens_ar_guide_dismissed_forever', 'true');
    } catch {
      // ignore storage errors
    }
    setShowFirstTimeGuide(false);
    setDismissedThisSession(true);
  };

  const isGuideVisible = guideEntered && showFirstTimeGuide && !dismissedThisSession && !isFrozen;

  // 2D AABB Collision Avoidance Solver for Spatial Tag Capsules
  const tagCollisionOffsets = useMemo(() => {
    const offsets: Record<string, { x: number; y: number; preferTop?: boolean }> = {};
    if (tags.length <= 1) return offsets;

    const containerW = containerRef.current?.clientWidth || 390;
    const containerH = containerRef.current?.clientHeight || 820;
    const capsuleH = 38;
    const leaderH = 22;

    interface BoxItem {
      id: string;
      anchorX: number;
      anchorY: number;
      cx: number;
      cy: number;
      w: number;
      h: number;
      preferTop: boolean;
    }

    const boxes: BoxItem[] = tags.map((t) => {
      const anchorX = containerW * (t.pos.x / 100);
      const anchorY = containerH * (t.pos.y / 100);
      const cnShort = t.wordData.definitionCn ? t.wordData.definitionCn.split(/[，；,]/)[0] : '';
      const estWidth = Math.min(220, Math.max(128, t.label.length * 8.5 + cnShort.length * 13 + 52));
      const preferTop = anchorY - leaderH - capsuleH >= 56;
      const defaultCy = preferTop
        ? anchorY - leaderH - capsuleH / 2
        : anchorY + leaderH + capsuleH / 2;

      return {
        id: t.id,
        anchorX,
        anchorY,
        cx: Math.max(16 + estWidth / 2, Math.min(containerW - 16 - estWidth / 2, anchorX)),
        cy: defaultCy,
        w: estWidth,
        h: capsuleH,
        preferTop
      };
    });

    // If two anchors are vertically close and horizontally overlapping, flip one to bottom and one to top first
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i];
        const b = boxes[j];
        const minW = (a.w + b.w) / 2 + 10;
        const minH = (a.h + b.h) / 2 + 8;
        if (Math.abs(a.cx - b.cx) < minW && Math.abs(a.cy - b.cy) < minH) {
          if (a.preferTop === b.preferTop) {
            if (a.anchorY <= b.anchorY) {
              a.preferTop = true;
              a.cy = a.anchorY - leaderH - capsuleH / 2;
              b.preferTop = false;
              b.cy = b.anchorY + leaderH + capsuleH / 2;
            } else {
              b.preferTop = true;
              b.cy = b.anchorY - leaderH - capsuleH / 2;
              a.preferTop = false;
              a.cy = a.anchorY + leaderH + capsuleH / 2;
            }
          }
        }
      }
    }

    // Iterative relaxation pass to eliminate any remaining AABB overlap
    for (let iter = 0; iter < 6; iter++) {
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i];
          const b = boxes[j];
          const overlapX = (a.w + b.w) / 2 + 10 - Math.abs(a.cx - b.cx);
          const overlapY = (a.h + b.h) / 2 + 8 - Math.abs(a.cy - b.cy);

          if (overlapX > 0 && overlapY > 0) {
            if (overlapY <= overlapX * 0.85) {
              const pushY = (overlapY / 2) + 2;
              if (a.cy <= b.cy) {
                a.cy -= pushY;
                b.cy += pushY;
              } else {
                a.cy += pushY;
                b.cy -= pushY;
              }
            } else {
              const pushX = (overlapX / 2) + 3;
              if (a.cx <= b.cx) {
                a.cx -= pushX;
                b.cx += pushX;
              } else {
                a.cx += pushX;
                b.cx -= pushX;
              }
            }
          }
        }
      }
    }

    boxes.forEach((b) => {
      const baseCy = b.preferTop
        ? b.anchorY - leaderH - capsuleH / 2
        : b.anchorY + leaderH + capsuleH / 2;
      offsets[b.id] = {
        x: Math.round(b.cx - b.anchorX),
        y: Math.round(b.cy - baseCy),
        preferTop: b.preferTop
      };
    });

    return offsets;
  }, [tags]);

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-[#0D0F12] select-none">
      {/* Hidden Snapshot Canvas & Album File Picker */}
      <canvas ref={hiddenCanvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Top Header (Always in Camera Viewfinder Mode) */}
      <TopHeader
        variant="camera"
        centerLabel={isFrozen ? 'FRAME LOCKED' : 'VIEWFINDER'}
        rightSlot={
          streamActive && !isFrozen && hasTorch ? (
            <button
              type="button"
              onClick={toggleTorch}
              className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-xl border transition-all cursor-pointer active:scale-90 ${
                isTorchOn
                  ? 'bg-amber-400/90 text-stone-900 border-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.45)]'
                  : 'bg-white/14 hover:bg-white/22 border-white/25 text-white shadow-[0_2px_10px_rgba(0,0,0,0.18)]'
              }`}
              title={isTorchOn ? '关闭补光' : '开启补光'}
              aria-label={isTorchOn ? 'Turn off flashlight' : 'Turn on flashlight'}
            >
              {isTorchOn ? (
                <Flashlight className="w-4 h-4 fill-stone-900 text-stone-900" />
              ) : (
                <FlashlightOff className="w-4 h-4 opacity-90" />
              )}
            </button>
          ) : undefined
        }
        onOpenNotebook={onOpenNotebook}
      />

      {/* Full-Screen Direct Camera Viewfinder */}
      <div
        ref={containerRef}
        onClick={() => setActiveBubbleId(null)}
        className="absolute inset-0 z-0 overflow-hidden bg-[#12161F]"
      >
        {/* Cached Freeze Background Texture (Smoothly bridges transitions without black gap) */}
        <canvas
          ref={freezeCanvasRef}
          className={`absolute inset-0 w-full h-full object-cover z-0 pointer-events-none transition-opacity duration-300 ${
            hasFreezeFrame && !isFrozen ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Live Video Stream */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover z-[1] transition-opacity duration-300 ${
            streamActive && !isFrozen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        />

        {/* Minimalist First-Time Onboarding Card with Delayed Staggered Entrance */}
        <AnimatePresence>
          {isGuideVisible && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              onClick={e => e.stopPropagation()}
              className="absolute inset-0 z-30 flex items-center justify-center px-6 pointer-events-auto bg-black/25 backdrop-blur-[2px]"
            >
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.94, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: 12, scale: 0.96, filter: 'blur(4px)' }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-[308px] rounded-[26px] bg-stone-950/72 backdrop-blur-2xl border border-white/14 p-3.5 shadow-[0_24px_60px_rgba(0,0,0,0.6)] text-white"
              >
                {/* Clean Single Desk Preview Image (Tappable) */}
                <div
                  onClick={handleTrySampleScene}
                  className="group relative w-full h-40 rounded-[18px] overflow-hidden bg-stone-900 cursor-pointer"
                >
                  <img
                    src={SAMPLE_DESK_IMAGE_URL}
                    alt="书房实景示例"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />

                  {/* Single Floating Spatial Anchor Tag on the Notebook */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.24, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="pointer-events-none absolute top-[44%] left-[46%] flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-950/75 backdrop-blur-xl border border-white/25 text-xs text-white shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white/85" />
                    <span className="font-serif font-medium tracking-wide">manuscript</span>
                    <span className="text-white/40">·</span>
                    <span className="text-white/80 text-[11px]">手稿</span>
                  </motion.div>
                </div>

                {/* Minimal Centered Copy */}
                <div className="pt-4 pb-3.5 px-2 text-center space-y-1">
                  <h4 className="text-[15px] font-medium tracking-wide text-white/95">
                    实景拍物，即刻浮现词卡
                  </h4>
                  <p className="text-xs text-white/55 leading-relaxed">
                    轻触下方快门定格画面，或直接载入样张体验
                  </p>
                </div>

                {/* Clean Ivory Glass Primary Button */}
                <button
                  type="button"
                  onClick={handleTrySampleScene}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#FAF7F0] hover:bg-white text-stone-900 text-xs font-medium tracking-wide flex items-center justify-center shadow-sm transition-all cursor-pointer active:scale-[0.98]"
                >
                  <span>体验这张桌面样张</span>
                </button>

                {/* Symmetrical Two-Column Dismiss Row */}
                <div className="mt-3 pt-2.5 border-t border-white/10 grid grid-cols-2 divide-x divide-white/10 text-xs">
                  <button
                    type="button"
                    onClick={handleDismissGuideOnce}
                    className="py-1 text-center text-white/70 hover:text-white transition-colors cursor-pointer"
                  >
                    此次关掉
                  </button>
                  <button
                    type="button"
                    onClick={handleDismissGuideForever}
                    className="py-1 text-center text-white/45 hover:text-white/80 transition-colors cursor-pointer"
                  >
                    以后都关掉
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Subtle Minimalist Hint ONLY if Camera Permission is Denied and Guide is Closed */}
        {permissionDenied && !streamActive && !isFrozen && !isGuideVisible && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-8 text-center pointer-events-none">
            <button
              type="button"
              onClick={() => startCamera(facingMode)}
              className="pointer-events-auto flex flex-col items-center gap-3 px-6 py-4 rounded-2xl bg-white/8 hover:bg-white/12 backdrop-blur-xl border border-white/15 text-white/85 transition-all active:scale-95 cursor-pointer"
            >
              <Camera className="w-5 h-5 text-white/70 stroke-[1.6]" />
              <span className="text-xs font-sans tracking-wide text-white/85">
                未开启相机权限 · 轻触重试或从左下角相册选图
              </span>
            </button>
          </div>
        )}

        {/* Frozen Frame Snapshot Overlay */}
        {isFrozen && frozenFrameUrl && (
          <img
            src={frozenFrameUrl}
            alt="Frozen Viewfinder Frame"
            className="absolute inset-0 w-full h-full object-cover z-2"
          />
        )}

        {/* Optical Shutter Flash Effect */}
        <AnimatePresence>
          {shutterFlash && (
            <motion.div
              initial={{ opacity: 0.75 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.14 }}
              className="absolute inset-0 bg-[#FAF7F0] z-40 pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* High-Precision Deep Spatial Tags (Direct Object Annotation on Frozen Frame) */}
        {isFrozen &&
          tags.map((tag, idx) => {
            const floatY = Math.sin(bobOffset + idx * 1.8) * 2;
            const floatX = Math.cos(bobOffset + idx * 1.5) * 1.5;
            const isExpanded = activeBubbleId === tag.id;

            return (
              <SpatialTag
                key={tag.id}
                tag={tag}
                isFrozen={isFrozen}
                isExpanded={isExpanded}
                hasActiveBubble={Boolean(activeBubbleId)}
                floatOffset={{ x: floatX, y: floatY }}
                collisionOffset={tagCollisionOffsets[tag.id]}
                onTapTag={() => {
                  setActiveBubbleId(isExpanded ? null : tag.id);
                }}
                onCloseBubble={() => {
                  setActiveBubbleId(null);
                }}
                onHeroFlight={(rect) => {
                  handleHeroFlight(tag, rect);
                }}
                onToggleMastery={(newLevel) => {
                  handleUpdateTagMastery(tag.id, newLevel);
                }}
              />
            );
          })}
      </div>

      {/* Bottom Symmetrical Optical Shutter Dock (Always Present) */}
      <ZenShutter
        isFrozen={isFrozen}
        isScanning={isScanning}
        onToggleFreeze={handleToggleFreeze}
        onSelectPhoto={handleTriggerPhotoPicker}
        onFlipCamera={toggleCameraFacing}
        objectCount={tags.length}
      />
    </div>
  );
};
