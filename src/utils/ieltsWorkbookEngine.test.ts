import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeVolumeKey,
  buildReadingWorkbookCatalog,
  getSiblingPassages,
  resolveNextSequentialPassage,
  resolveReadingBookmarkTarget,
  getCompleteWorkbookPassages,
  getCompleteWorkbookListening,
} from './ieltsWorkbookEngine';
import { CambridgePassage } from '../data/ieltsPassages';
import { IeltsTestRecord } from '../db';

const mockPassages: CambridgePassage[] = [
  {
    id: 'recall26-t1-p1',
    cambridgeBook: '2026 考场真题',
    testNum: 1,
    passageNum: 1,
    title: 'The History of Glass',
    subtitle: '2026 RECALL · TEST 1 · PASSAGE 1',
    category: 'History',
    bandDifficulty: 'Band 6.5',
    timeAllowedMins: 20,
    keyVocab: ['silica'],
    text: 'Paragraph A\nGlass history paragraph A.',
    questions: [{ id: 1, type: 'TFNG', prompt: 'Q1', correctAnswer: 'TRUE', explanation: 'Exp' }],
  },
  {
    id: 'recall25-t1-p2',
    cambridgeBook: '2025 考场真题',
    testNum: 1,
    passageNum: 2,
    title: 'Urban Microclimates',
    subtitle: '2026 RECALL · TEST 1 · PASSAGE 2',
    category: 'Environment',
    bandDifficulty: 'Band 7.0',
    timeAllowedMins: 20,
    keyVocab: ['albedo'],
    text: 'Paragraph A\nUrban climate paragraph A.',
    questions: [
      { id: 14, type: 'TFNG', prompt: 'Q14', correctAnswer: 'FALSE', explanation: 'Exp' },
      { id: 15, type: 'TFNG', prompt: 'Q15', correctAnswer: 'TRUE', explanation: 'Exp' },
    ],
  },
  {
    id: 'recall25-t1-p3',
    cambridgeBook: '2026 Recall',
    testNum: 1,
    passageNum: 3,
    title: 'Cognitive Plasticity',
    subtitle: '2026 RECALL · TEST 1 · PASSAGE 3',
    category: 'Psychology',
    bandDifficulty: 'Band 7.5',
    timeAllowedMins: 20,
    keyVocab: ['synapse'],
    text: 'Paragraph A\nCognitive paragraph A.',
    questions: [{ id: 27, type: 'MULTIPLE_CHOICE', prompt: 'Q27', correctAnswer: 'A', explanation: 'Exp' }],
  },
  {
    id: 'recall-2026-t2-p1',
    cambridgeBook: '2026 Recall',
    testNum: 2,
    passageNum: 1,
    title: 'Deep Sea Hydrothermal Vents',
    subtitle: '2026 RECALL · TEST 2 · PASSAGE 1',
    category: 'Science',
    bandDifficulty: 'Band 6.5',
    timeAllowedMins: 20,
    keyVocab: ['chemosynthesis'],
    text: 'Paragraph A\nDeep sea paragraph A.',
    questions: [{ id: 1, type: 'TFNG', prompt: 'Q1', correctAnswer: 'TRUE', explanation: 'Exp' }],
  },
];

test('normalizeVolumeKey unifies disparate 2025/2026 recall strings into a single volume', () => {
  assert.equal(normalizeVolumeKey('2026 考场真题'), '2026 考场真题');
  assert.equal(normalizeVolumeKey('2025 考场真题'), '2026 考场真题');
  assert.equal(normalizeVolumeKey('2026 Recall'), '2026 考场真题');
  assert.equal(normalizeVolumeKey('Cambridge 19'), 'Cambridge 19');
  assert.equal(normalizeVolumeKey('Cambridge IELTS Academic Special'), 'Cambridge Special');
  assert.equal(normalizeVolumeKey('IELTS Academic Reading Special'), 'Cambridge Special');
});

test('buildReadingWorkbookCatalog groups P1, P2, P3 into Test 1 and computes completion & draft states', () => {
  const records: IeltsTestRecord[] = [
    {
      timestamp: 1000,
      passageTitle: 'The History of Glass',
      passageSubtitle: '',
      passageText: '',
      questions: [],
      conqueredWords: [],
      timeSpentSec: 600,
      correctCount: 1,
      totalQuestions: 1,
      bandScore: 9.0,
      answers: { 1: 'TRUE' },
      wrongQuestionDetails: [],
    },
  ];
  const drafts = {
    'recall25-t1-p2': { 14: 'FALSE' },
  };

  const catalog = buildReadingWorkbookCatalog(mockPassages, {}, records, drafts);
  assert.equal(catalog.length, 1);
  assert.equal(catalog[0].volumeKey, '2026 考场真题');
  assert.equal(catalog[0].tests.length, 2);

  const test1 = catalog[0].tests[0];
  assert.equal(test1.testNum, 1);
  assert.equal(test1.items.length, 3);
  assert.equal(test1.completedCount, 1);
  assert.equal(test1.inProgressCount, 1);
  assert.equal(test1.items[0].progress.status, 'completed');
  assert.equal(test1.items[1].progress.status, 'in_progress');
  assert.equal(test1.items[1].progress.answeredCount, 1);
  assert.equal(test1.items[2].progress.status, 'unstarted');
});

test('getSiblingPassages returns ordered P1, P2, P3 for the same Test even with mixed raw book labels', () => {
  const siblings = getSiblingPassages(mockPassages, mockPassages[1]);
  assert.equal(siblings.length, 3);
  assert.deepEqual(
    siblings.map(p => p.passageNum),
    [1, 2, 3]
  );
});

test('resolveNextSequentialPassage advances P1 -> P2 -> P3 -> Test 2 P1', () => {
  const afterP1 = resolveNextSequentialPassage(mockPassages, mockPassages[0]);
  assert.ok(afterP1);
  assert.equal(afterP1.nextPassage.id, 'recall25-t1-p2');
  assert.equal(afterP1.isSameTest, true);

  const afterP3 = resolveNextSequentialPassage(mockPassages, mockPassages[2]);
  assert.ok(afterP3);
  assert.equal(afterP3.nextPassage.id, 'recall-2026-t2-p1');
  assert.equal(afterP3.isSameTest, false);
  assert.equal(afterP3.isSameVolume, true);
});

test('resolveReadingBookmarkTarget advances past completed passage to next sequential passage', () => {
  const records: IeltsTestRecord[] = [
    {
      timestamp: 1000,
      passageTitle: 'The History of Glass',
      passageSubtitle: '',
      passageText: '',
      questions: [],
      conqueredWords: [],
      timeSpentSec: 600,
      correctCount: 1,
      totalQuestions: 1,
      bandScore: 9.0,
      answers: { 1: 'TRUE' },
      wrongQuestionDetails: [],
    },
  ];
  const catalog = buildReadingWorkbookCatalog(mockPassages, {}, records, {});
  const resolved = resolveReadingBookmarkTarget(catalog, 'recall26-t1-p1');
  assert.ok(resolved);
  assert.equal(resolved.targetItem.passage.id, 'recall25-t1-p2');
  assert.equal(resolved.isResume, true);
});

test('getCompleteWorkbookPassages and getCompleteWorkbookListening produce complete 3-passage / 4-section tests across volumes', () => {
  const allPassages = getCompleteWorkbookPassages();
  const readingCatalog = buildReadingWorkbookCatalog(allPassages, {}, [], {});

  // Must have 2026 考场真题, Cambridge 19, Cambridge 18, Cambridge 17, Cambridge 16, Cambridge Special
  assert.ok(readingCatalog.length >= 6);
  for (const vol of readingCatalog) {
    assert.ok(vol.tests.length >= 1, `Volume ${vol.volumeKey} should have at least 1 test`);
    for (const t of vol.tests) {
      assert.equal(
        t.items.length,
        3,
        `Volume ${vol.volumeKey} Test ${t.testNum} should have all 3 reading passages (P1, P2, P3)`
      );
    }
  }

  const allListening = getCompleteWorkbookListening();
  assert.ok(allListening.length >= 16);
});
