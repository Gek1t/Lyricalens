import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isMultiWordHeading,
  normalizeClickableToken,
  tokenizeClickableSegment,
} from './textTokenizer.ts';

test('normalizeClickableToken strips punctuation and normalizes curly apostrophes', () => {
  assert.equal(normalizeClickableToken("don’t"), "don't");
  assert.equal(normalizeClickableToken('children’s'), "children's");
  assert.equal(normalizeClickableToken('(wireless),'), 'wireless');
  assert.equal(normalizeClickableToken('---'), '');
});

test('tokenizeClickableSegment handles straight and curly apostrophes cleanly', () => {
  assert.deepEqual(tokenizeClickableSegment("I don't know children’s names."), [
    { raw: 'I', lookupWord: 'I' },
    { raw: ' ', lookupWord: null },
    { raw: "don't", lookupWord: "don't" },
    { raw: ' ', lookupWord: null },
    { raw: 'know', lookupWord: 'know' },
    { raw: ' ', lookupWord: null },
    { raw: 'children’s', lookupWord: "children's" },
    { raw: ' ', lookupWord: null },
    { raw: 'names', lookupWord: 'names' },
    { raw: '.', lookupWord: null },
  ]);
});

test('tokenizeClickableSegment separates standalone curly quotes, en-dash, ellipsis, and slashes', () => {
  const quoteTokens = tokenizeClickableSegment('‘quiet’,');
  assert.deepEqual(quoteTokens, [
    { raw: '‘', lookupWord: null },
    { raw: 'quiet', lookupWord: 'quiet' },
    { raw: '’', lookupWord: null },
    { raw: ',', lookupWord: null },
  ]);

  const dashAndEllipsis = tokenizeClickableSegment('long–term wait… plug/adapter');
  assert.deepEqual(dashAndEllipsis, [
    { raw: 'long', lookupWord: 'long' },
    { raw: '–', lookupWord: null },
    { raw: 'term', lookupWord: 'term' },
    { raw: ' ', lookupWord: null },
    { raw: 'wait', lookupWord: 'wait' },
    { raw: '…', lookupWord: null },
    { raw: ' ', lookupWord: null },
    { raw: 'plug', lookupWord: 'plug' },
    { raw: '/', lookupWord: null },
    { raw: 'adapter', lookupWord: 'adapter' },
  ]);
});

test('tokenizeClickableSegment keeps hyphenated English words intact and rejects punctuation-only tokens', () => {
  assert.deepEqual(tokenizeClickableSegment('well-known ---'), [
    { raw: 'well-known', lookupWord: 'well-known' },
    { raw: ' ', lookupWord: null },
    { raw: '---', lookupWord: null },
  ]);
});

test('isMultiWordHeading distinguishes multi-word phrases from single tokens', () => {
  assert.equal(isMultiWordHeading('wireless earbuds'), true);
  assert.equal(isMultiWordHeading('  wireless   earbuds  '), true);
  assert.equal(isMultiWordHeading('wireless'), false);
  assert.equal(isMultiWordHeading('  pressure  '), false);
  assert.equal(isMultiWordHeading('well-known'), false);
  assert.equal(isMultiWordHeading(''), false);
});
