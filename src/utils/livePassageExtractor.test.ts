import test from 'node:test';
import assert from 'node:assert/strict';
import {
  splitIntoIeltsParagraphs,
  extractAuthenticVocab,
  buildAuthenticPassageFromLiveArticle
} from './livePassageExtractor';

const SAMPLE_WIKI_EXTRACT = `Ocean acidification is the ongoing decrease in the pH of the Earth's ocean, caused by the uptake of carbon dioxide (CO2) from the atmosphere. The main cause of ocean acidification is human burning of fossil fuels. As the amount of carbon dioxide in the atmosphere increases, the amount of carbon dioxide absorbed by the ocean also increases.

When carbon dioxide dissolves in seawater, it forms carbonic acid, which releases hydrogen ions and decreases the carbonate ion concentration. This chemical shift directly impairs calcifying marine organisms such as reef-building corals, mollusks, and planktonic foraminifera that depend on calcium carbonate shells.

Long-term oceanographic monitoring stations in Hawaii and Bermuda have documented a 0.1 unit reduction in surface ocean pH since the Industrial Revolution, representing an approximately 26 percent increase in hydrogen ion activity. Marine ecologists warn that continued acidification disrupts food webs and sensory navigation in larval fish.

Restoration scientists are currently investigating kelp forest co-cultivation and alkalinity enhancement to buffer coastal habitats against localized pH drops. These empirical conservation strategies aim to protect vulnerable aquaculture zones while global decarbonization progresses.`;

test('splitIntoIeltsParagraphs splits real multi-paragraph extract into distinct paragraphs', () => {
  const paras = splitIntoIeltsParagraphs(SAMPLE_WIKI_EXTRACT, 5);
  assert.equal(paras.length >= 3, true);
  assert.equal(paras[0].includes('Ocean acidification'), true);
  assert.equal(paras.some(p => p.includes('carbonic acid')), true);
});

test('extractAuthenticVocab extracts real academic words from paragraphs', () => {
  const paras = splitIntoIeltsParagraphs(SAMPLE_WIKI_EXTRACT, 5);
  const vocab = extractAuthenticVocab(paras, 6);
  assert.equal(vocab.length, 6);
  assert.equal(vocab.includes('acidification') || vocab.includes('atmosphere') || vocab.includes('decrease'), true);
});

test('buildAuthenticPassageFromLiveArticle creates a complete CambridgePassage with bilingual title and real questions', () => {
  const passage = buildAuthenticPassageFromLiveArticle({
    titleEn: 'Ocean acidification',
    titleZh: '海洋酸化',
    fullExtract: SAMPLE_WIKI_EXTRACT,
    sourceUrl: 'https://en.wikipedia.org/wiki/Ocean_acidification',
    sourceDomain: 'en.wikipedia.org',
    topicCategory: 'Marine Ecology & Earth Science',
    passageNum: 1
  }, 'test-live');

  assert.equal(passage.title, '海洋酸化 (Ocean acidification)');
  assert.equal(passage.text.includes('Paragraph A'), true);
  assert.equal(passage.text.includes('Paragraph B'), true);
  assert.equal(passage.questions.length, 6);
  assert.equal(passage.questions[0].type, 'TFNG');
  assert.equal(passage.questions[0].correctAnswer, 'TRUE');
  assert.equal(passage.questions[3].type, 'FORM_COMPLETION');
  assert.equal(passage.questions[3].prompt.includes('[____]'), true);
});
