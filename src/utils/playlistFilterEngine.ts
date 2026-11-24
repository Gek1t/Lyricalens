import { SongItem, VocabDifficultyTag, SongVocabStats } from '../types';

export type PlaylistPrimaryFilter = 'ALL' | 'DUE_REVIEW' | 'NOTEBOOK';
export type PlaylistVocabSubFilter = 'ALL' | 'UNMASTERED' | 'MASTERED' | 'IELTS';
export type PlaylistLangSubFilter = 'ALL' | 'EN' | 'ZH';

export interface MatchedSongWord {
  word: string;
  masteryLevel: number;
  isDue: boolean;
}

export interface AnalyzedPlaylistSong {
  song: SongItem;
  originalIdx: number;
  isChinese: boolean;
  level?: VocabDifficultyTag;
  stats: SongVocabStats;
  matchedList: MatchedSongWord[];
  hasDueWords: boolean;
  hasNotebookWords: boolean;
}

export interface PlaylistArtistOption {
  name: string;
  count: number;
}

export interface PlaylistFilterState {
  primaryFilter: PlaylistPrimaryFilter;
  vocabSubFilter: PlaylistVocabSubFilter;
  langSubFilter: PlaylistLangSubFilter;
  artistSubFilter?: string; // 'ALL' or specific artist name
  searchQuery: string;
}

export function splitArtistNames(rawArtist?: string): string[] {
  if (!rawArtist) return [];
  return rawArtist
    .split(/\s*(?:\/|、|feat\.|ft\.)\s*/i)
    .map(a => a.trim())
    .filter(Boolean);
}

/**
 * Extracts unique artists sorted by song frequency (descending), preserving first-seen order on ties.
 */
export function extractPlaylistArtistOptions(analyzedSongs: AnalyzedPlaylistSong[]): PlaylistArtistOption[] {
  const countMap = new Map<string, { name: string; count: number; firstIdx: number }>();
  let order = 0;

  for (const item of analyzedSongs) {
    const parts = splitArtistNames(item.song.artist);
    const uniqueInSong = new Set<string>();
    for (const artist of parts) {
      const key = artist.toLowerCase();
      if (uniqueInSong.has(key)) continue;
      uniqueInSong.add(key);

      const existing = countMap.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        countMap.set(key, { name: artist, count: 1, firstIdx: order++ });
      }
    }
  }

  return Array.from(countMap.values())
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.firstIdx - b.firstIdx;
    })
    .map(({ name, count }) => ({ name, count }));
}

export function extractPlaylistArtists(analyzedSongs: AnalyzedPlaylistSong[]): string[] {
  return extractPlaylistArtistOptions(analyzedSongs).map(o => o.name);
}

export function hasActiveSecondaryFilter(
  state: Pick<PlaylistFilterState, 'vocabSubFilter' | 'langSubFilter' | 'artistSubFilter'>
): boolean {
  const hasArtist = Boolean(state.artistSubFilter && state.artistSubFilter !== 'ALL');
  return state.vocabSubFilter !== 'ALL' || state.langSubFilter !== 'ALL' || hasArtist;
}

export function filterAnalyzedSongs(
  analyzedSongs: AnalyzedPlaylistSong[],
  state: PlaylistFilterState
): AnalyzedPlaylistSong[] {
  const query = state.searchQuery.trim().toLowerCase();
  const activeArtist = state.artistSubFilter && state.artistSubFilter !== 'ALL' ? state.artistSubFilter : null;

  return analyzedSongs.filter(item => {
    // 1. Primary filter
    if (state.primaryFilter === 'DUE_REVIEW' && !item.hasDueWords) return false;
    if (state.primaryFilter === 'NOTEBOOK' && !item.hasNotebookWords) return false;

    // 2. Secondary vocabulary filter
    if (state.vocabSubFilter === 'UNMASTERED') {
      const hasUnmastered = item.matchedList.some(w => w.masteryLevel < 3);
      if (!hasUnmastered) return false;
    } else if (state.vocabSubFilter === 'MASTERED') {
      const hasMastered = item.matchedList.length > 0 && item.matchedList.every(w => w.masteryLevel === 3);
      if (!hasMastered) return false;
    } else if (state.vocabSubFilter === 'IELTS') {
      const hasIelts = (item.stats?.ieltsCount || 0) > 0 || (item.stats?.academicCount || 0) > 0 || Boolean(item.level);
      if (!hasIelts) return false;
    }

    // 3. Secondary language filter
    if (state.langSubFilter === 'EN' && item.isChinese) return false;
    if (state.langSubFilter === 'ZH' && !item.isChinese) return false;

    // 4. Secondary artist filter
    if (activeArtist) {
      const songArtists = splitArtistNames(item.song.artist);
      const matchesArtist =
        item.song.artist === activeArtist ||
        songArtists.some(a => a.toLowerCase() === activeArtist.toLowerCase());
      if (!matchesArtist) return false;
    }

    // 5. Search query filter (matches title, artist, matched words, or keyVocab)
    if (query) {
      const titleMatch = (item.song.title || '').toLowerCase().includes(query);
      const artistMatch = (item.song.artist || '').toLowerCase().includes(query);
      const vocabMatch = item.matchedList.some(w => w.word.toLowerCase().includes(query));
      const keyVocabMatch = (item.song.keyVocab || []).some(w => w.toLowerCase().includes(query));
      if (!titleMatch && !artistMatch && !vocabMatch && !keyVocabMatch) {
        return false;
      }
    }

    return true;
  });
}
