import test from 'node:test';
import assert from 'node:assert/strict';
import { withColorAlpha, extractDominantPalette } from './colorExtractor';

test('withColorAlpha normalizes hex, rgb, and hsl colors into valid rgba strings', () => {
  assert.equal(withColorAlpha('#fff', 0.5), 'rgba(255, 255, 255, 0.5)');
  assert.equal(withColorAlpha('#7C8F6E', 0.25), 'rgba(124, 143, 110, 0.25)');
  assert.equal(withColorAlpha('rgb(10, 20, 30)', 0.8), 'rgba(10, 20, 30, 0.8)');
  assert.equal(withColorAlpha('hsl(0, 100%, 50%)', 1), 'rgba(255, 0, 0, 1)');
  assert.equal(withColorAlpha('invalid-color', 2, '#112233'), 'rgba(17, 34, 51, 1)');
});

test('extractDominantPalette returns fallback theme immediately for empty image URL', async () => {
  const theme = await extractDominantPalette('');
  assert.deepEqual(theme.palette, ['#7C8F6E', '#C4AC82', '#A69880']);
  assert.equal(theme.extractedHue, 110);
});
