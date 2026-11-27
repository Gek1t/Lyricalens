import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildLowerWordSet,
  calculateEbbinghausRetention,
  evaluateAndAnalyzeSong,
  evaluateSongVocabDifficulty,
  analyzeSongVocab,
  isChineseSong,
  prioritizeSongsByNotebookAndSpacedRepetition
} from './vocabEngine';
import type { SongItem, WordItem } from '../types';

function makeWord(word: string, overrides: Partial<WordItem> = {}): WordItem {
  return {
    word,
    phoneticUk: `/${word}/`,
    phoneticUs: `/${word}/`,
    partOfSpeech: 'n.',
    definition: 'test',
    definitionCn: '测试',
    examples: [],
    sourceContext: 'test',
    isStarred: true,
    masteryLevel: 1,
    addedTimestamp: Date.now(),
    ...overrides
  };
}

function makeSong(id: string, title: string, lrcText: string, artist = 'Artist'): SongItem {
  return {
    id,
    title,
    artist,
    duration: 180,
    albumArtUrl: '',
    audioUrl: '',
    palette: ['#111111', '#222222', '#333333'],
    keyVocab: [],
    lrcText
  };
}

test('isChineseSong accurately separates Chinese songs from English songs with Chinese aliases', () => {
  assert.equal(
    isChineseSong({
      title: '晴天',
      artist: '周杰伦',
      lrcText: '[00:01.00]故事的小黄花 从出生那年就飘着 童年的荡秋千 随记忆一直晃到现在'
    }),
    true
  );

  assert.equal(
    isChineseSong({
      title: 'Cruel Summer',
      artist: 'Taylor Swift (泰勒·斯威夫特)',
      lrcText: '[00:01.00]Fever dream high in the quiet of the night you know that I caught it bad'
    }),
    false
  );
});

test('evaluateAndAnalyzeSong produces identical results to evaluateSongVocabDifficulty and analyzeSongVocab in a single pass', () => {
  const song = makeSong(
    's1',
    'Ephemeral Horizon',
    '[00:05.00]Ephemeral resonance beneath a luminous sky\n[00:10.00]Sustained resilience will transform our perspective'
  );
  const notebook = ['resilience', 'luminous'];
  const due = ['resilience'];

  const combined = evaluateAndAnalyzeSong(song, buildLowerWordSet(notebook), buildLowerWordSet(due));
  const evalOnly = evaluateSongVocabDifficulty(song, notebook, due);
  const analyzeOnly = analyzeSongVocab(song, notebook, due);

  assert.deepEqual(combined.evaluation, evalOnly);
  assert.deepEqual(combined.analysis, analyzeOnly);
  assert.equal(combined.evaluation.level, 'IELTS 7.5+');
  assert.deepEqual(combined.analysis.matchedNotebookWords.sort(), ['luminous', 'resilience']);
  assert.deepEqual(combined.analysis.matchedDueWords, ['resilience']);
});

test('calculateEbbinghausRetention flags stale unmastered words as due and recent mastered words as solid', () => {
  const now = 1_750_000_000_000;
  const fiveDaysAgo = now - 5 * 24 * 60 * 60 * 1000;

  const staleWord = makeWord('ephemeral', {
    masteryLevel: 1,
    reviewCount: 1,
    addedTimestamp: fiveDaysAgo,
    lastReviewedTimestamp: fiveDaysAgo
  });
  const staleInfo = calculateEbbinghausRetention(staleWord, now);
  assert.equal(staleInfo.isDue, true);
  assert.equal(staleInfo.status, 'critical');

  const masteredRecent = makeWord('resilience', {
    masteryLevel: 3,
    reviewCount: 4,
    addedTimestamp: now - 3600_000,
    lastReviewedTimestamp: now - 3600_000
  });
  const solidInfo = calculateEbbinghausRetention(masteredRecent, now);
  assert.equal(solidInfo.isDue, false);
  assert.equal(solidInfo.status, 'solid');
});

test('prioritizeSongsByNotebookAndSpacedRepetition ranks due-word songs above notebook-only and academic-only songs', () => {
  const oldTs = Date.now() - 10 * 24 * 60 * 60 * 1000;
  const words: WordItem[] = [
    makeWord('ephemeral', { masteryLevel: 1, reviewCount: 1, addedTimestamp: oldTs, lastReviewedTimestamp: oldTs }),
    makeWord('solitude', { masteryLevel: 3, reviewCount: 5, addedTimestamp: Date.now(), lastReviewedTimestamp: Date.now() })
  ];

  const academicSong = makeSong('academic', 'Theory', '[00:01.00]Hypothesis framework paradigm');
  const notebookSong = makeSong('notebook', 'Quiet', '[00:01.00]Walking in solitude tonight');
  const dueSong = makeSong('due', 'Fleeting', '[00:01.00]An ephemeral moment passes');

  const ranked = prioritizeSongsByNotebookAndSpacedRepetition([academicSong, notebookSong, dueSong], words);
  assert.deepEqual(
    ranked.map(s => s.id),
    ['due', 'notebook', 'academic']
  );
});
