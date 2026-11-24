import test from 'node:test';
import assert from 'node:assert/strict';
import {
  VisionDetectionError,
  detectObjectsWithAiVision,
  parseVisionResponseToTags,
} from './arVisionDetector.ts';
import type { ModelProbePlatformAdapter } from './aiModelProbe.ts';
import type { ActiveAiConfig } from './aiPhraseTranslator.ts';

const SAMPLE_BASE64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/';

test('parseVisionResponseToTags parses fenced JSON object with items and normalizes bounds', () => {
  const raw = `\`\`\`json
  {
    "items": [
      {
        "label": "ceramic mug",
        "phonetic": "/səˈræmɪk mʌɡ/",
        "cn": "陶瓷杯",
        "en_def": "A cup crafted from ceramic.",
        "example_en": "Steam rose from the ceramic mug.",
        "example_cn": "陶瓷杯中升起缕缕热气。",
        "pos": { "x": 3, "y": 950 }
      },
      {
        "label": "fountain pen",
        "pos": { "x": 64, "y": 52 }
      }
    ]
  }
  \`\`\``;

  const tags = parseVisionResponseToTags(raw, 1700000000000);
  assert.equal(tags.length, 2);
  assert.equal(tags[0].label, 'ceramic mug');
  assert.equal(tags[0].pos.x, 12); // clamped minimum horizontal safe margin
  assert.equal(tags[0].pos.y, 82); // 950 -> 95 -> clamped max vertical safe margin
  assert.equal(tags[0].wordData.definitionCn, '陶瓷杯');
  assert.equal(tags[1].label, 'fountain pen');
  assert.equal(tags[1].pos.x, 64);
  assert.equal(tags[1].pos.y, 52);
});

test('detectObjectsWithAiVision calls DeepSeek native multimodal image_url via CapacitorHttp on APK', async () => {
  const capturedPosts: Array<{ url: string; headers: Record<string, string>; data: Record<string, unknown> }> = [];

  const nativeAdapter: ModelProbePlatformAdapter = {
    isNativePlatform: () => true,
    capacitorGet: async () => {
      throw new Error('unexpected GET');
    },
    capacitorPost: async (opts) => {
      capturedPosts.push(opts);
      return {
        status: 200,
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  items: [
                    {
                      label: 'espresso cup',
                      phonetic: '/eˈspresəʊ kʌp/',
                      cn: '浓缩咖啡杯',
                      en_def: 'A small cup for serving espresso.',
                      example_en: 'An espresso cup sat beside the journal.',
                      example_cn: '一只浓缩咖啡杯放在笔记本旁。',
                      pos: { x: 42, y: 55 },
                    },
                  ],
                }),
              },
            },
          ],
        },
      };
    },
  };

  const deepseekConfig: ActiveAiConfig = {
    type: 'openai_compatible',
    majorProvider: 'deepseek',
    protocol: 'openai_compatible',
    apiKey: 'sk-ds-vision-test',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-v4-pro',
  };

  const result = await detectObjectsWithAiVision(
    SAMPLE_BASE64,
    { timeoutMs: 25000 },
    nativeAdapter,
    deepseekConfig
  );

  assert.equal(capturedPosts.length, 1);
  assert.equal(capturedPosts[0].url, 'https://api.deepseek.com/v1/chat/completions');
  assert.equal(capturedPosts[0].headers.Authorization, 'Bearer sk-ds-vision-test');
  assert.equal(capturedPosts[0].data.model, 'deepseek-v4-pro');

  const messages = capturedPosts[0].data.messages as Array<{ role: string; content: unknown }>;
  const userContent = messages[1].content as Array<{ type: string; image_url?: { url: string } }>;
  assert.equal(userContent[1].type, 'image_url');
  assert.ok(userContent[1].image_url?.url.startsWith('data:image/jpeg;base64,'));

  assert.equal(result.engine, 'deepseek:deepseek-v4-pro');
  assert.equal(result.tags.length, 1);
  assert.equal(result.tags[0].label, 'espresso cup');
});

test('detectObjectsWithAiVision supports Gemini inlineData and Anthropic image blocks on native APK', async () => {
  const capturedUrls: string[] = [];

  const geminiAdapter: ModelProbePlatformAdapter = {
    isNativePlatform: () => true,
    capacitorGet: async () => ({ status: 500, data: null }),
    capacitorPost: async (opts) => {
      capturedUrls.push(opts.url);
      return {
        status: 200,
        data: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: '[{"label":"notebook","cn":"笔记本","pos":{"x":50,"y":50}}]',
                  },
                ],
              },
            },
          ],
        },
      };
    },
  };

  const geminiConfig: ActiveAiConfig = {
    type: 'gemini',
    majorProvider: 'gemini',
    protocol: 'gemini',
    apiKey: 'AIza-test-vision',
    model: 'gemini-2.5-flash',
  };

  const geminiRes = await detectObjectsWithAiVision(SAMPLE_BASE64, {}, geminiAdapter, geminiConfig);
  assert.ok(capturedUrls[0].includes('gemini-2.5-flash:generateContent?key=AIza-test-vision'));
  assert.equal(geminiRes.tags[0].label, 'notebook');

  const claudeAdapter: ModelProbePlatformAdapter = {
    isNativePlatform: () => true,
    capacitorGet: async () => ({ status: 500, data: null }),
    capacitorPost: async (opts) => {
      capturedUrls.push(opts.url);
      return {
        status: 200,
        data: {
          content: [
            {
              type: 'text',
              text: '{"items":[{"label":"lamp","cn":"台灯","pos":{"x":30,"y":40}}]}',
            },
          ],
        },
      };
    },
  };

  const claudeConfig: ActiveAiConfig = {
    type: 'openai_compatible',
    majorProvider: 'claude',
    protocol: 'anthropic',
    apiKey: 'sk-ant-vision',
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-3-7-sonnet-20250219',
  };

  const claudeRes = await detectObjectsWithAiVision(SAMPLE_BASE64, {}, claudeAdapter, claudeConfig);
  assert.equal(capturedUrls[1], 'https://api.anthropic.com/v1/messages');
  assert.equal(claudeRes.tags[0].label, 'lamp');
});

test('detectObjectsWithAiVision reports truthful errors instead of mislabeling everything as network timeout', async () => {
  const nativeUnconfiguredAdapter: ModelProbePlatformAdapter = {
    isNativePlatform: () => true,
    capacitorGet: async () => ({ status: 500, data: null }),
    capacitorPost: async () => ({ status: 500, data: null }),
  };

  await assert.rejects(
    () => detectObjectsWithAiVision(SAMPLE_BASE64, {}, nativeUnconfiguredAdapter, null),
    (err: unknown) =>
      err instanceof VisionDetectionError &&
      err.code === 'NO_API_CONFIG' &&
      err.message.includes('配置 AI 密钥')
  );

  const authFailAdapter: ModelProbePlatformAdapter = {
    isNativePlatform: () => true,
    capacitorGet: async () => ({ status: 500, data: null }),
    capacitorPost: async () => ({
      status: 401,
      data: { error: { message: 'Authentication Fails' } },
    }),
  };

  const dsConfig: ActiveAiConfig = {
    type: 'openai_compatible',
    majorProvider: 'deepseek',
    protocol: 'openai_compatible',
    apiKey: 'sk-invalid',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-flash',
  };

  await assert.rejects(
    () => detectObjectsWithAiVision(SAMPLE_BASE64, {}, authFailAdapter, dsConfig),
    (err: unknown) => err instanceof VisionDetectionError && err.code === 'AUTH_ERROR'
  );
});

test('detectObjectsWithAiVision falls back cleanly to Web backend only when unconfigured on Web', async () => {
  const originalFetch = globalThis.fetch;
  const calledUrls: string[] = [];

  globalThis.fetch = async (input) => {
    calledUrls.push(String(input));
    return new Response(
      JSON.stringify({
        success: true,
        engine: 'gemini-flash',
        tags: [
          {
            id: 'ar-web-1',
            label: 'desk lamp',
            phonetic: '/desk læmp/',
            pos: { x: 45, y: 40, z: 0 },
            confidence: 0.96,
            wordData: {
              word: 'desk lamp',
              phoneticUk: '/desk læmp/',
              phoneticUs: '/desk læmp/',
              partOfSpeech: 'n.',
              definition: 'A portable lamp used on a desk.',
              definitionCn: '台灯',
              examples: [{ en: 'Switch on the desk lamp.', cn: '打开台灯。' }],
              isStarred: false,
              masteryLevel: 0,
              addedTimestamp: Date.now(),
            },
          },
        ],
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  };

  const webAdapter: ModelProbePlatformAdapter = {
    isNativePlatform: () => false,
    capacitorGet: async () => ({ status: 500, data: null }),
    capacitorPost: async () => ({ status: 500, data: null }),
  };

  try {
    const res = await detectObjectsWithAiVision(SAMPLE_BASE64, {}, webAdapter, null);
    assert.deepEqual(calledUrls, ['/api/gemini/vision-detect']);
    assert.equal(res.engine, 'gemini-flash');
    assert.equal(res.tags[0].label, 'desk lamp');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('detectObjectsWithAiVision classifies external abort as ABORTED, respects provider default baseUrl, skips thinking parts, and rejects https URLs', async () => {
  const abortController = new AbortController();
  abortController.abort();

  const nativeAdapter: ModelProbePlatformAdapter = {
    isNativePlatform: () => true,
    capacitorGet: async () => ({ status: 500, data: null }),
    capacitorPost: async () => ({ status: 200, data: null }),
  };

  const dsConfig: ActiveAiConfig = {
    type: 'openai_compatible',
    majorProvider: 'deepseek',
    protocol: 'openai_compatible',
    apiKey: 'sk-ds',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-flash',
  };

  await assert.rejects(
    () => detectObjectsWithAiVision(SAMPLE_BASE64, { signal: abortController.signal }, nativeAdapter, dsConfig),
    (err: unknown) => err instanceof VisionDetectionError && err.code === 'ABORTED'
  );

  await assert.rejects(
    () => detectObjectsWithAiVision('https://example.com/photo.jpg', {}, nativeAdapter, dsConfig),
    (err: unknown) => err instanceof VisionDetectionError && err.code === 'EMPTY_RESULT'
  );

  let requestedUrl = '';
  const openAiAdapter: ModelProbePlatformAdapter = {
    isNativePlatform: () => true,
    capacitorGet: async () => ({ status: 500, data: null }),
    capacitorPost: async (opts) => {
      requestedUrl = opts.url;
      return {
        status: 200,
        data: {
          choices: [
            {
              message: {
                content: '{"items":[{"label":"keyboard","cn":"键盘","pos":{"x":50,"y":60}}]}',
              },
            },
          ],
        },
      };
    },
  };

  const openAiConfigNoUrl: ActiveAiConfig = {
    type: 'openai_compatible',
    majorProvider: 'openai',
    protocol: 'openai_compatible',
    apiKey: 'sk-openai',
    model: 'gpt-4o',
  };

  const openAiRes = await detectObjectsWithAiVision(SAMPLE_BASE64, {}, openAiAdapter, openAiConfigNoUrl);
  assert.equal(requestedUrl, 'https://api.openai.com/v1/chat/completions');
  assert.equal(openAiRes.tags[0].label, 'keyboard');

  const geminiThinkingAdapter: ModelProbePlatformAdapter = {
    isNativePlatform: () => true,
    capacitorGet: async () => ({ status: 500, data: null }),
    capacitorPost: async () => ({
      status: 200,
      data: {
        candidates: [
          {
            content: {
              parts: [
                { thought: true, text: 'Let me think about objects in the scene...' },
                { text: '{"items":[{"label":"fountain pen","cn":"钢笔","pos":{"x":42,"y":68}}]}' },
              ],
            },
          },
        ],
      },
    }),
  };

  const geminiConfig: ActiveAiConfig = {
    type: 'gemini',
    majorProvider: 'gemini',
    protocol: 'gemini',
    apiKey: 'AIza-test',
    model: 'gemini-2.5-flash',
  };

  const geminiRes = await detectObjectsWithAiVision(SAMPLE_BASE64, {}, geminiThinkingAdapter, geminiConfig);
  assert.equal(geminiRes.tags[0].label, 'fountain pen');
});

test('DeepSeek requests disable thinking, bump max_tokens to 4096, and strip unsupported optional params on HTTP 400 retry', async () => {
  const capturedBodies: Array<Record<string, unknown>> = [];
  let attempt = 0;

  const relayAdapter: ModelProbePlatformAdapter = {
    isNativePlatform: () => true,
    capacitorGet: async () => ({ status: 500, data: null }),
    capacitorPost: async (opts) => {
      attempt += 1;
      capturedBodies.push((opts.data ?? {}) as Record<string, unknown>);
      if (attempt === 1) {
        return {
          status: 400,
          data: {
            error: {
              message: 'Invalid request: unknown field "thinking" for proxy endpoint',
            },
          },
        };
      }
      return {
        status: 200,
        data: {
          choices: [
            {
              message: {
                content: '{"items":[{"label":"mechanical keyboard","cn":"机械键盘","pos":{"x":35,"y":48}}]}',
              },
            },
          ],
        },
      };
    },
  };

  const dsConfig: ActiveAiConfig = {
    type: 'openai_compatible',
    majorProvider: 'deepseek',
    protocol: 'openai_compatible',
    apiKey: 'sk-ds-relay',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-flash',
  };

  const result = await detectObjectsWithAiVision(SAMPLE_BASE64, {}, relayAdapter, dsConfig);
  assert.equal(attempt, 2);
  assert.equal(capturedBodies[0].max_tokens, 4096);
  assert.deepEqual(capturedBodies[0].thinking, { type: 'disabled' });
  assert.deepEqual(capturedBodies[0].response_format, { type: 'json_object' });

  assert.equal('thinking' in capturedBodies[1], false);
  assert.equal('response_format' in capturedBodies[1], false);
  assert.equal('temperature' in capturedBodies[1], false);
  assert.equal(result.tags[0].label, 'mechanical keyboard');
});

test('DeepSeek non-flash models auto-fallback to deepseek-flash on image_url 400 or text vision refusal', async () => {
  const requestedModels400: string[] = [];
  const adapterHttp400: ModelProbePlatformAdapter = {
    isNativePlatform: () => true,
    capacitorGet: async () => ({ status: 500, data: null }),
    capacitorPost: async (opts) => {
      const body = (opts.data ?? {}) as Record<string, unknown>;
      const model = String(body.model ?? '');
      requestedModels400.push(model);
      if (model === 'deepseek-v4-pro') {
        return {
          status: 400,
          data: {
            error: {
              message: "Failed to deserialize request: unknown variant 'image_url', expected 'text'",
            },
          },
        };
      }
      return {
        status: 200,
        data: {
          choices: [
            {
              message: {
                content:
                  '{"items":[{"label":"keyboard","cn":"键盘","pos":{"x":32,"y":41}},{"label":"wireless mouse","cn":"无线鼠标","pos":{"x":74,"y":48}}]}',
              },
            },
          ],
        },
      };
    },
  };

  const v4ProConfig: ActiveAiConfig = {
    type: 'openai_compatible',
    majorProvider: 'deepseek',
    protocol: 'openai_compatible',
    apiKey: 'sk-ds-v4',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-v4-pro',
  };

  const res400 = await detectObjectsWithAiVision(SAMPLE_BASE64, {}, adapterHttp400, v4ProConfig);
  assert.deepEqual(requestedModels400, ['deepseek-v4-pro', 'deepseek-flash']);
  assert.equal(res400.isFallback, undefined);
  assert.equal(res400.usedVisionFallback, true);
  assert.equal(res400.engine, 'deepseek:deepseek-flash (vision-fallback)');
  assert.equal(res400.tags.length, 2);

  const requestedModelsRefusal: string[] = [];
  const adapterRefusal: ModelProbePlatformAdapter = {
    isNativePlatform: () => true,
    capacitorGet: async () => ({ status: 500, data: null }),
    capacitorPost: async (opts) => {
      const body = (opts.data ?? {}) as Record<string, unknown>;
      const model = String(body.model ?? '');
      requestedModelsRefusal.push(model);
      if (model === 'deepseek-v4-pro') {
        return {
          status: 200,
          data: {
            choices: [
              {
                message: {
                  content: '抱歉，我目前是纯文本模型，无法直接查看或识别图片中的物体。',
                },
              },
            ],
          },
        };
      }
      return {
        status: 200,
        data: {
          choices: [
            {
              message: {
                content: '{"items":[{"label":"gaming mouse","cn":"游戏鼠标","pos":{"x":72,"y":50}}]}',
              },
            },
          ],
        },
      };
    },
  };

  const resRefusal = await detectObjectsWithAiVision(SAMPLE_BASE64, {}, adapterRefusal, v4ProConfig);
  assert.deepEqual(requestedModelsRefusal, ['deepseek-v4-pro', 'deepseek-flash']);
  assert.equal(resRefusal.isFallback, undefined);
  assert.equal(resRefusal.usedVisionFallback, true);
  assert.equal(resRefusal.tags[0].label, 'gaming mouse');
});

test('detectObjectsWithAiVision recovers from reasoning_content fallback and distinguishes length truncation or embedded 200 errors', async () => {
  const dsConfig: ActiveAiConfig = {
    type: 'openai_compatible',
    majorProvider: 'deepseek',
    protocol: 'openai_compatible',
    apiKey: 'sk-ds-test',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-flash',
  };

  const reasoningAdapter: ModelProbePlatformAdapter = {
    isNativePlatform: () => true,
    capacitorGet: async () => ({ status: 500, data: null }),
    capacitorPost: async () => ({
      status: 200,
      data: {
        choices: [
          {
            finish_reason: 'stop',
            message: {
              content: '',
              reasoning_content:
                'Here is the json result:\n{"items":[{"label":"keyboard","cn":"键盘","pos":{"x":40,"y":45}}]}',
            },
          },
        ],
      },
    }),
  };

  const reasoningRes = await detectObjectsWithAiVision(SAMPLE_BASE64, {}, reasoningAdapter, dsConfig);
  assert.equal(reasoningRes.tags[0].label, 'keyboard');

  const truncatedLengthAdapter: ModelProbePlatformAdapter = {
    isNativePlatform: () => true,
    capacitorGet: async () => ({ status: 500, data: null }),
    capacitorPost: async () => ({
      status: 200,
      data: {
        choices: [
          {
            finish_reason: 'length',
            message: {
              content: '',
              reasoning_content: 'Thinking about all objects on the wooden desk without outputting JSON yet...',
            },
          },
        ],
      },
    }),
  };

  await assert.rejects(
    () => detectObjectsWithAiVision(SAMPLE_BASE64, {}, truncatedLengthAdapter, dsConfig),
    (err: unknown) => err instanceof VisionDetectionError && err.code === 'HTTP_ERROR'
  );

  const embeddedAuthErrAdapter: ModelProbePlatformAdapter = {
    isNativePlatform: () => true,
    capacitorGet: async () => ({ status: 500, data: null }),
    capacitorPost: async () => ({
      status: 200,
      data: {
        error: {
          code: 401,
          message: 'Incorrect API key provided',
        },
      },
    }),
  };

  await assert.rejects(
    () => detectObjectsWithAiVision(SAMPLE_BASE64, {}, embeddedAuthErrAdapter, dsConfig),
    (err: unknown) => err instanceof VisionDetectionError && err.code === 'AUTH_ERROR'
  );
});

test('parseVisionResponseToTags recovers truncated JSON arrays and normalizes box_2d, fractional coords, and flexible aliases', () => {
  const truncatedJson = `\`\`\`json
  {
    "detected_objects": [
      {
        "word": "keyboard",
        "translation": "键盘",
        "box_2d": [320, 140, 480, 620]
      },
      {
        "name": "wireless mouse",
        "meaning": "无线鼠标",
        "pos": { "x": 0.74, "y": 0.51 }
      },
      {
        "label": "laptop",
        "cn": "笔记`;

  const tags = parseVisionResponseToTags(truncatedJson, 2000);
  assert.equal(tags.length, 2);
  assert.equal(tags[0].label, 'keyboard');
  assert.equal(tags[0].wordData.definitionCn, '键盘');
  assert.equal(tags[0].pos.x, 38);
  assert.equal(tags[0].pos.y, 40);

  assert.equal(tags[1].label, 'wireless mouse');
  assert.equal(tags[1].wordData.definitionCn, '无线鼠标');
  assert.equal(tags[1].pos.x, 74);
  assert.equal(tags[1].pos.y, 51);
});

test('parseVisionResponseToTags handles bracket preambles, unclosed fences with preambles, percent coords, empty strings, and small top-left box_2d', () => {
  const truncatedWithBracketPreamble =
    'Here are [2] objects:\n{"items":[{"label":"keyboard","cn":"键盘","pos":{"x":"1%","y":"50%"}},{"label":"mou';
  const recoveredTruncated = parseVisionResponseToTags(truncatedWithBracketPreamble, 3000);
  assert.equal(recoveredTruncated.length, 1);
  assert.equal(recoveredTruncated[0].label, 'keyboard');
  assert.equal(recoveredTruncated[0].pos.x, 12);
  assert.equal(recoveredTruncated[0].pos.y, 50);

  const wrappedWithBracketPreamble =
    'Detected [2] objects:\n{"items":[{"label":"monitor","cn":"显示器","pos":{"x":"","y":null}}]}';
  const recoveredWrapped = parseVisionResponseToTags(wrappedWithBracketPreamble, 3001);
  assert.equal(recoveredWrapped.length, 1);
  assert.equal(recoveredWrapped[0].label, 'monitor');
  assert.equal(recoveredWrapped[0].pos.x, 50);
  assert.equal(recoveredWrapped[0].pos.y, 50);

  const unclosedFenceWithPreamble =
    'Here is [1] result:\n```json\n{"meta":[{"version":1}],"items":[{"label":"trackpad","cn":"触控板","box_2d":[10,20,150,120]},{"label":"cab';
  const recoveredFence = parseVisionResponseToTags(unclosedFenceWithPreamble, 3002);
  assert.equal(recoveredFence.length, 1);
  assert.equal(recoveredFence[0].label, 'trackpad');
  assert.equal(recoveredFence[0].pos.x, 12);
  assert.equal(recoveredFence[0].pos.y, 18);
});

test('DeepSeek fallback preserves original UNSUPPORTED_VISION error when a custom relay returns 404 for deepseek-flash', async () => {
  const attemptedModels: string[] = [];
  const customRelayAdapter: ModelProbePlatformAdapter = {
    isNativePlatform: () => true,
    capacitorGet: async () => ({ status: 500, data: null }),
    capacitorPost: async (opts) => {
      const body = (opts.data ?? {}) as Record<string, unknown>;
      const model = String(body.model ?? '');
      attemptedModels.push(model);
      if (model === 'deepseek-chat') {
        return {
          status: 400,
          data: {
            error: {
              message: 'deepseek-chat does not support image_url input',
            },
          },
        };
      }
      return {
        status: 404,
        data: {
          error: {
            message: 'Model not found: deepseek-flash',
          },
        },
      };
    },
  };

  const relayConfig: ActiveAiConfig = {
    type: 'openai_compatible',
    majorProvider: 'deepseek',
    protocol: 'openai_compatible',
    apiKey: 'sk-relay',
    baseUrl: 'https://relay.example.com/v1',
    model: 'deepseek-chat',
  };

  await assert.rejects(
    () => detectObjectsWithAiVision(SAMPLE_BASE64, {}, customRelayAdapter, relayConfig),
    (err: unknown) =>
      err instanceof VisionDetectionError &&
      err.code === 'UNSUPPORTED_VISION' &&
      err.message.includes('deepseek-chat')
  );
  assert.deepEqual(attemptedModels, ['deepseek-chat', 'deepseek-flash']);
});
