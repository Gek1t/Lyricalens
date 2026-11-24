import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAiPhraseResponse, readAiConfig, readNestedText } from './aiPhraseTranslator';

test('parseAiPhraseResponse parses pure JSON string', () => {
  const input = JSON.stringify({
    cn: '别往心里去，放轻松',
    note: '口语中用于安抚对方不要过度焦虑'
  });
  const res = parseAiPhraseResponse(input);
  assert.ok(res !== null);
  assert.equal(res?.cn, '别往心里去，放轻松');
  assert.equal(res?.note, '口语中用于安抚对方不要过度焦虑');
});

test('parseAiPhraseResponse parses pure JSON without optional note', () => {
  const input = '{"cn": "顺其自然，听天由命"}';
  const res = parseAiPhraseResponse(input);
  assert.ok(res !== null);
  assert.equal(res?.cn, '顺其自然，听天由命');
  assert.equal(res?.note, undefined);
});

test('parseAiPhraseResponse handles markdown ```json code block wrapping', () => {
  const input = `\`\`\`json
{
  "cn": "破釜沉舟，孤注一掷",
  "note": "常用于强调下定决心不留后路"
}
\`\`\``;
  const res = parseAiPhraseResponse(input);
  assert.ok(res !== null);
  assert.equal(res?.cn, '破釜沉舟，孤注一掷');
  assert.equal(res?.note, '常用于强调下定决心不留后路');
});

test('parseAiPhraseResponse handles markdown code block without json tag', () => {
  const input = `\`\`\`
{
  "cn": "碰运气，试一把"
}
\`\`\``;
  const res = parseAiPhraseResponse(input);
  assert.ok(res !== null);
  assert.equal(res?.cn, '碰运气，试一把');
});

test('parseAiPhraseResponse handles conversational preamble before and after JSON', () => {
  const input = `好的，根据这句歌词的语境，该短语的释义如下：
{"cn": "沉住气，保持冷静", "note": "俚语用法"}
希望对你有帮助！`;
  const res = parseAiPhraseResponse(input);
  assert.ok(res !== null);
  assert.equal(res?.cn, '沉住气，保持冷静');
  assert.equal(res?.note, '俚语用法');
});

test('parseAiPhraseResponse returns null for garbage/non-JSON text', () => {
  assert.equal(parseAiPhraseResponse('这是一段完全不是 JSON 的文本'), null);
  assert.equal(parseAiPhraseResponse(''), null);
  assert.equal(parseAiPhraseResponse(null), null);
  assert.equal(parseAiPhraseResponse(undefined), null);
  assert.equal(parseAiPhraseResponse('502 Bad Gateway'), null);
  assert.equal(parseAiPhraseResponse('{ malformed: json }'), null);
});

test('parseAiPhraseResponse returns null when cn matches isGarbageTranslation', () => {
  // Metadata tags like "单曲", "唱片名", or English echo
  assert.equal(parseAiPhraseResponse('{"cn": "单曲"}'), null);
  assert.equal(parseAiPhraseResponse('{"cn": "专辑名"}'), null);
  assert.equal(parseAiPhraseResponse('{"cn": "hello world"}'), null);
});

test('readNestedText skips thought/thinking parts and joins remaining text segments', () => {
  const geminiText = readNestedText(
    {
      candidates: [
        {
          content: {
            parts: [
              { thought: true, text: 'Internal chain of thought' },
              { text: '{"cn":"第一部分",' },
              { text: '"note":"完整释义"}' },
            ],
          },
        },
      ],
    },
    'gemini'
  );
  assert.equal(geminiText, '{"cn":"第一部分",\n"note":"完整释义"}');

  const anthropicText = readNestedText(
    {
      content: [
        { type: 'thinking', thinking: 'Reasoning step...' },
        { type: 'text', text: '{"cn":"最终答案"}' },
      ],
    },
    'anthropic'
  );
  assert.equal(anthropicText, '{"cn":"最终答案"}');
});

test('readAiConfig allows keyless local endpoints while rejecting keyless remote endpoints', () => {
  const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const storageMap = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => storageMap.get(k) ?? null,
      setItem: (k: string, v: string) => storageMap.set(k, v),
    },
  });

  try {
    storageMap.set(
      'lyricalens_ai_config',
      JSON.stringify({
        provider: 'openai_compatible',
        majorProvider: 'custom',
        customBaseUrl: 'http://localhost:11434/v1',
        customModel: 'qwen2.5vl:7b',
        customApiKey: '',
      })
    );
    const localCfg = readAiConfig();
    assert.ok(localCfg !== null);
    assert.equal(localCfg?.baseUrl, 'http://localhost:11434/v1');
    assert.equal(localCfg?.apiKey, '');

    storageMap.set(
      'lyricalens_ai_config',
      JSON.stringify({
        provider: 'openai_compatible',
        majorProvider: 'deepseek',
        customBaseUrl: 'https://api.deepseek.com/v1',
        customModel: 'deepseek-flash',
        customApiKey: '',
      })
    );
    assert.equal(readAiConfig(), null);
  } finally {
    if (originalDescriptor) {
      Object.defineProperty(globalThis, 'localStorage', originalDescriptor);
    } else {
      delete (globalThis as Record<string, unknown>).localStorage;
    }
  }
});
