import test from 'node:test';
import assert from 'node:assert/strict';
import { derivePhraseChinese, cleanChunkMeaning, getSimpleWordCn, isGarbageTranslation } from './lyricDictionary';
import { lookupInIeltsCorpus } from './ieltsCorpusDictionary';

test('terrace definition prioritizes 露台/阳台', () => {
  const result = lookupInIeltsCorpus('terrace');
  assert.ok(result);
  assert.ok(result.cn.startsWith('露台，阳台'), `Expected cn to start with 露台，阳台 but got ${result.cn}`);
  const firstMeaning = cleanChunkMeaning(result.cn);
  assert.strictEqual(firstMeaning, '露台');
});

test('terraces plural definition exists', () => {
  const result = lookupInIeltsCorpus('terraces');
  assert.ok(result);
  assert.ok(result.cn.includes('露台') || result.cn.includes('阳台'));
});

test('cleanChunkMeaning strips ellipsis and parentheses', () => {
  assert.strictEqual(cleanChunkMeaning('在……之上，在……表面'), '在之上');
  assert.strictEqual(cleanChunkMeaning('梯田（agricultural terrace）；露台'), '梯田');
});

test('getSimpleWordCn returns clean Chinese without ellipsis', () => {
  const terraceCn = getSimpleWordCn('terrace');
  assert.strictEqual(terraceCn, '露台');
  const onCn = getSimpleWordCn('on');
  assert.ok(!onCn.includes('……'), `Did not expect ellipsis in: ${onCn}`);
});

test('derivePhraseChinese correctly parses Pattern E prepositional phrases', () => {
  const outOnTerrace = derivePhraseChinese('Out on the terrace');
  assert.strictEqual(outOnTerrace.cn, '在露台上');
  assert.strictEqual(outOnTerrace.pos, '短语 · 介词短语');

  const onTerrace = derivePhraseChinese('on the terrace');
  assert.strictEqual(onTerrace.cn, '在露台上');

  const inDark = derivePhraseChinese('in the dark');
  assert.strictEqual(inDark.cn, '在黑暗中');

  const underMoonlight = derivePhraseChinese('under the moonlight');
  assert.strictEqual(underMoonlight.cn, '在月光下');

  const acrossRoom = derivePhraseChinese('across the room');
  assert.strictEqual(acrossRoom.cn, '穿过房间');
});

test('derivePhraseChinese preserves Pattern A and B noun phrases', () => {
  const ancientStone = derivePhraseChinese('the ancient stone');
  assert.ok(ancientStone.cn.includes('古老') && (ancientStone.cn.includes('石阶') || ancientStone.cn.includes('石头')));

  const luminousSpark = derivePhraseChinese('luminous spark');
  assert.ok(luminousSpark.cn.includes('火花') || luminousSpark.cn.includes('光'));
});

test('isGarbageTranslation correctly filters metadata and invalid phrases', () => {
  assert.strictEqual(isGarbageTranslation('唱片名'), true);
  assert.strictEqual(isGarbageTranslation('私下里'), false);
  assert.strictEqual(isGarbageTranslation(''), true);
  assert.strictEqual(isGarbageTranslation('   '), true);
  assert.strictEqual(isGarbageTranslation('album'), true);
  assert.strictEqual(isGarbageTranslation('唱片名: On The Low 歌手: Burna Boy'), true);
  assert.strictEqual(isGarbageTranslation('MYMEMORY WARNING: LIMIT REACHED'), true);
});

test('derivePhraseChinese correctly resolves colloquial and lyric idioms', () => {
  const onTheLow = derivePhraseChinese('on the low');
  assert.ok(onTheLow.cn.includes('私下'), `Expected cn to contain '私下', got: ${onTheLow.cn}`);
  assert.strictEqual(onTheLow.pos, '短语 · 俚语');

  const fallInLove = derivePhraseChinese('fall in love');
  assert.ok(/[\u4e00-\u9fa5]/.test(fallInLove.cn), `Expected Chinese translation, got: ${fallInLove.cn}`);
});
