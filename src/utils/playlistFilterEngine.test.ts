import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AnalyzedPlaylistSong,
  extractPlaylistArtists,
  extractPlaylistArtistOptions,
  filterAnalyzedSongs,
  hasActiveSecondaryFilter
} from './playlistFilterEngine';

const mockSongs: AnalyzedPlaylistSong[] = [
  {
    song: {
      id: '1',
      title: 'Ephemeral Dawn',
      artist: 'Clara Vance',
      duration: 210,
      albumArtUrl: '/art1.jpg',
      audioUrl: '/audio1.mp3',
      lrcText: 'The ephemeral light of dawn',
      palette: ['#000', '#111', '#222'],
      keyVocab: ['ephemeral']
    },
    originalIdx: 0,
    isChinese: false,
    level: 'IELTS 7.5+',
    stats: {
      totalWords: 20,
      academicCount: 3,
      ieltsCount: 2,
      toeflCount: 1,
      cet6Count: 0,
      matchedNotebookCount: 1,
      matchedDueCount: 1
    },
    matchedList: [{ word: 'ephemeral', masteryLevel: 1, isDue: true }],
    hasDueWords: true,
    hasNotebookWords: true
  },
  {
    song: {
      id: '2',
      title: 'Resilience in Motion',
      artist: 'Echo Harbor / Clara Vance',
      duration: 195,
      albumArtUrl: '/art2.jpg',
      audioUrl: '/audio2.mp3',
      lrcText: 'Resilience keeps us moving',
      palette: ['#000', '#111', '#222'],
      keyVocab: ['resilience']
    },
    originalIdx: 1,
    isChinese: false,
    level: 'IELTS 6.5+',
    stats: {
      totalWords: 18,
      academicCount: 2,
      ieltsCount: 1,
      toeflCount: 1,
      cet6Count: 0,
      matchedNotebookCount: 1,
      matchedDueCount: 0
    },
    matchedList: [{ word: 'resilience', masteryLevel: 3, isDue: false }],
    hasDueWords: false,
    hasNotebookWords: true
  },
  {
    song: {
      id: '3',
      title: '晴天',
      artist: '周杰伦',
      duration: 269,
      albumArtUrl: '/art3.jpg',
      audioUrl: '/audio3.mp3',
      lrcText: '故事的小黄花',
      palette: ['#000', '#111', '#222'],
      keyVocab: []
    },
    originalIdx: 2,
    isChinese: true,
    level: undefined,
    stats: {
      totalWords: 0,
      academicCount: 0,
      ieltsCount: 0,
      toeflCount: 0,
      cet6Count: 0,
      matchedNotebookCount: 0,
      matchedDueCount: 0
    },
    matchedList: [],
    hasDueWords: false,
    hasNotebookWords: false
  }
];

test('filters by primary filter correctly', () => {
  const due = filterAnalyzedSongs(mockSongs, {
    primaryFilter: 'DUE_REVIEW',
    vocabSubFilter: 'ALL',
    langSubFilter: 'ALL',
    artistSubFilter: 'ALL',
    searchQuery: ''
  });
  assert.equal(due.length, 1);
  assert.equal(due[0].song.id, '1');

  const notebook = filterAnalyzedSongs(mockSongs, {
    primaryFilter: 'NOTEBOOK',
    vocabSubFilter: 'ALL',
    langSubFilter: 'ALL',
    artistSubFilter: 'ALL',
    searchQuery: ''
  });
  assert.equal(notebook.length, 2);
});

test('filters by secondary vocabulary, language, and artist filters', () => {
  const unmastered = filterAnalyzedSongs(mockSongs, {
    primaryFilter: 'ALL',
    vocabSubFilter: 'UNMASTERED',
    langSubFilter: 'ALL',
    artistSubFilter: 'ALL',
    searchQuery: ''
  });
  assert.equal(unmastered.length, 1);
  assert.equal(unmastered[0].song.id, '1');

  const byArtist = filterAnalyzedSongs(mockSongs, {
    primaryFilter: 'ALL',
    vocabSubFilter: 'ALL',
    langSubFilter: 'ALL',
    artistSubFilter: 'Echo Harbor',
    searchQuery: ''
  });
  assert.equal(byArtist.length, 1);
  assert.equal(byArtist[0].song.id, '2');

  const bySharedArtist = filterAnalyzedSongs(mockSongs, {
    primaryFilter: 'ALL',
    vocabSubFilter: 'ALL',
    langSubFilter: 'ALL',
    artistSubFilter: 'Clara Vance',
    searchQuery: ''
  });
  assert.equal(bySharedArtist.length, 2);
});

test('extracts unique playlist artists sorted by frequency', () => {
  const artists = extractPlaylistArtists(mockSongs);
  assert.deepEqual(artists, ['Clara Vance', 'Echo Harbor', '周杰伦']);
  const opts = extractPlaylistArtistOptions(mockSongs);
  assert.equal(opts[0].name, 'Clara Vance');
  assert.equal(opts[0].count, 2);
});

test('detects active secondary filter state including artist', () => {
  assert.equal(hasActiveSecondaryFilter({ vocabSubFilter: 'ALL', langSubFilter: 'ALL', artistSubFilter: 'ALL' }), false);
  assert.equal(hasActiveSecondaryFilter({ vocabSubFilter: 'ALL', langSubFilter: 'ALL', artistSubFilter: '周杰伦' }), true);
});
