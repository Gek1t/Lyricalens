# Changelog

All notable changes to **Lyricalens · ContextEng** are documented in this file.

---

## [1.1] - 2026-11-27

### ✨ UI & Visual Polish (Editorial / Zen-Paper Refresh)
- **Notebook & Vocabulary Vault** (`NotebookModal.tsx`, `MasteryBadge.tsx`): Redesigned card layout with unboxed inline metadata rows, four-tier mastery dots/indicators, cohesive editorial filter tabs, and zero-latency card transitions.
- **IELTS Space** (`IELTSHubView.tsx`, `IELTSPanel.tsx`, `IELTSListeningView.tsx`, `OnlineIELTSSearchModal.tsx`, `CambridgePassageSelectorModal.tsx`, `AssessmentSummaryModal.tsx`): Refined bookmark mastheads, clean single-row metadata footers, compact region filter tray, bottom soft feather gradient wash, and streamlined test/score summary cards.
- **Personal Hub** (`GrowthCompassTab.tsx`, `IELTSArchivesTab.tsx`, `SettingsSyncTab.tsx`, `PersonalHubModal.tsx`):
  - Added collapsible weekly check-in calendar strip with ripple animation.
  - Added 240° IELTS Band arc gauge, unlined 3-row metrics ledger, and 5-segment comprehension meter.
  - Refined quiet editorial spaced-repetition footer and unified monochrome/warm-ivory Zen-paper controls.
- **Music & Word Lookup** (`MusicPlayerPanel.tsx`, `FullscreenLyricsView.tsx`, `PlaylistDrawer.tsx`, `WordDetailSheet.tsx`, `WordDrawer.tsx`, `HighlightedText.tsx`, `ContextualImmersionSection.tsx`):
  - Separated English italic POS abbreviations from upright Chinese POS annotations for cleaner typography.
  - Replaced bulky playlist mastery SVGs with lightweight editorial dots and preserved stack scroll/offset (`savedY`) across nested word drawers.
- **AR Camera Space** (`ARCameraPanel.tsx`, `SpatialTag.tsx`, `ZenShutter.tsx`, `MasteryRing.tsx`): Polished warm-ivory capsule tags, subtle frozen-frame floating motion, and minimalist camera-unavailable empty state.
- **Typography & Accent Tokens** (`index.html`, `src/index.css`, `TopHeader.tsx`, `BottomNavDots.tsx`): Added Playfair Display 500 weight and unified warm editorial ink accents across light and dark modes.

### ⚡ Performance & Reliability
- **Vite Bundle Splitting** (`vite.config.ts`): Configured `manualChunks` separating React, Motion, Lucide icons, Dexie/Zustand, corpus dictionaries, and IELTS datasets.
- **Single-Pass Analyzers & Caching** (`src/utils/vocabEngine.ts`, `src/utils/ieltsWorkbookEngine.ts`, `src/utils/colorExtractor.ts`):
  - Added `evaluateAndAnalyzeSong` and `buildLowerWordSet` for single-pass playlist analysis, cached base workbook passages/listening lists, precompiled word boundary matchers, and O(R) test-record indexing.
  - Added an 80-entry LRU palette cache and inflight request deduplication in `extractDominantPalette`.
- **Database & Cloud Sync** (`src/db/index.ts`, `src/db/cloudSync.ts`): Switched initial Dexie word seeding/backfill to batched transactions (`bulkPut`), made `initCloudSyncListener` idempotent across React StrictMode remounts, and skipped background sync ticks while the tab is hidden.
- **Server & Cross-Platform Safety** (`server.ts`, `src/server/routes/ieltsRoute.ts`, `src/server/routes/words.ts`, `src/utils/clientMusicSync.ts`): Added `AbortSignal.timeout` on upstream LLM/NetEase calls, `safeJsonParse` guards on serialized DB columns, and `Capacitor.isNativePlatform()` gating on direct HTTP Kuwo audio fallback.
- **Unit Tests**: Added `src/utils/colorExtractor.test.ts` and `src/utils/vocabEngine.test.ts`, plus expanded boundary tests in `src/utils/ieltsWorkbookEngine.test.ts` (74 tests passing).

### 📱 Versioning
- Bumped web package version to `1.1.0` (`package.json`) and Android app version to `1.1` (`versionCode 2` in `android/app/build.gradle`).

---

## [1.0] - 2026-11-16
- Added native Android multimodal AR vision (`deepseek-flash` / `deepseek-v4-pro` / Gemini / Anthropic via CapacitorHttp) and AI provider/model probing.
- Replaced AI model selector dropdowns with inline Zen-paper pill selectors.
- Enabled click-anywhere English word tokenization and nested stacked `WordDrawer` lookups with hardware Back stack handling.
- Refined Playlist artist filters (`>= 5` tracks), animated accordion filter drawers, and privacy-sanitized repository history.
