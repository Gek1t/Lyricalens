import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_BASE_URLS,
  FALLBACK_MODELS_BY_PROVIDER,
  extractApiErrorMessage,
  getDefaultBaseUrl,
  getDefaultModelForProvider,
  isLocalAiEndpoint,
  isValidAiHandshakeJson,
  normalizeProbeBaseUrl,
  parseModelsPayload,
  probeProviderModels,
  resolveMajorProvider,
  type ModelProbePlatformAdapter,
} from './aiModelProbe.ts';
import { readAiConfig } from './aiPhraseTranslator.ts';

function mockResponse(status: number, body: string, contentType = 'application/json'): Response {
  return new Response(body, {
    status,
    headers: { 'content-type': contentType },
  });
}

test('normalizeProbeBaseUrl trims slashes and endpoint suffixes', () => {
  assert.equal(
    normalizeProbeBaseUrl('https://api.deepseek.com/v1/', 'deepseek'),
    'https://api.deepseek.com/v1'
  );
  assert.equal(
    normalizeProbeBaseUrl('https://api.deepseek.com/v1/chat/completions', 'deepseek'),
    'https://api.deepseek.com/v1'
  );
  assert.equal(
    normalizeProbeBaseUrl('https://api.deepseek.com/v1/models', 'deepseek'),
    'https://api.deepseek.com/v1'
  );
  assert.equal(
    normalizeProbeBaseUrl('', 'deepseek'),
    'https://api.deepseek.com/v1'
  );
  assert.equal(
    normalizeProbeBaseUrl('', 'qwen'),
    'https://dashscope.aliyuncs.com/compatible-mode/v1'
  );
});

test('SSOT defaults align custom SiliconFlow model and provider helpers', () => {
  assert.equal(FALLBACK_MODELS_BY_PROVIDER.custom[0], 'deepseek-ai/DeepSeek-V3');
  assert.equal(getDefaultModelForProvider('custom'), 'deepseek-ai/DeepSeek-V3');
  assert.equal(getDefaultBaseUrl('deepseek'), DEFAULT_BASE_URLS.deepseek);
  assert.equal(resolveMajorProvider(undefined, 'gemini'), 'gemini');
  assert.equal(resolveMajorProvider('unknown_provider', 'openai_compatible'), 'deepseek');
  assert.equal(resolveMajorProvider('qwen', 'openai_compatible'), 'qwen');
});

test('isLocalAiEndpoint recognizes localhost and 127.0.0.1 only', () => {
  assert.equal(isLocalAiEndpoint('http://localhost:11434/v1'), true);
  assert.equal(isLocalAiEndpoint('https://127.0.0.1:8080/v1'), true);
  assert.equal(isLocalAiEndpoint('https://api.deepseek.com/v1'), false);
  assert.equal(isLocalAiEndpoint(''), false);
});

test('parseModelsPayload handles OpenAI-compatible payloads', () => {
  const models = parseModelsPayload(
    {
      object: 'list',
      data: [{ id: 'deepseek-chat' }, { id: 'deepseek-reasoner' }, { id: 'deepseek-chat' }],
    },
    'deepseek'
  );
  assert.deepEqual(models, ['deepseek-chat', 'deepseek-reasoner']);
});

test('parseModelsPayload filters OpenAI chat models and keeps o-series', () => {
  const models = parseModelsPayload(
    {
      data: [
        { id: 'gpt-4o-mini' },
        { id: 'gpt-4o-realtime-preview' },
        { id: 'o3-mini' },
        { id: 'dall-e-3' },
      ],
    },
    'openai'
  );
  assert.deepEqual(models, ['gpt-4o-mini', 'o3-mini']);
});

test('parseModelsPayload extracts Gemini generateContent models without models/ prefix', () => {
  const models = parseModelsPayload(
    {
      models: [
        { name: 'models/gemini-2.5-flash', supportedGenerationMethods: ['generateContent'] },
        { name: 'models/text-embedding-004', supportedGenerationMethods: ['embedContent'] },
        { name: 'models/gemini-2.5-pro', supportedGenerationMethods: ['generateContent'] },
      ],
    },
    'gemini'
  );
  assert.deepEqual(models, ['gemini-2.5-flash', 'gemini-2.5-pro']);
});

test('isValidAiHandshakeJson and extractApiErrorMessage validate upstream payloads', () => {
  assert.equal(isValidAiHandshakeJson({ choices: [{ message: { content: 'ok' } }] }), true);
  assert.equal(isValidAiHandshakeJson(null), false);
  assert.equal(isValidAiHandshakeJson(['unexpected']), false);
  assert.equal(isValidAiHandshakeJson({ error: { message: 'bad key' } }), false);
  assert.equal(
    extractApiErrorMessage({ error: { message: 'Invalid token' } }, '', 401),
    'Invalid token'
  );
  assert.equal(
    extractApiErrorMessage(null, '<html>401 Unauthorized</html>', 401),
    'API Key 无效或未授权 (401)'
  );
});

test('probeProviderModels rejects empty key on remote endpoints', async () => {
  const res = await probeProviderModels({
    provider: 'openai_compatible',
    majorProvider: 'deepseek',
    baseUrl: 'https://api.deepseek.com/v1',
    apiKey: '   ',
  });
  assert.equal(res.status, 'error');
});

test('probeProviderModels succeeds via Express backend on Web', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    assert.equal(String(input), '/api/ai/fetch-models');
    return mockResponse(
      200,
      JSON.stringify({
        success: true,
        latency: 42,
        models: ['deepseek-chat', 'deepseek-reasoner'],
        defaultModel: 'deepseek-chat',
        message: '已连通 DeepSeek 官方接口 · 延迟 42ms',
      })
    );
  };

  try {
    const res = await probeProviderModels({
      provider: 'openai_compatible',
      majorProvider: 'deepseek',
      apiKey: 'sk-test-valid',
    });
    assert.equal(res.status, 'success');
    if (res.status === 'success') {
      assert.equal(res.source, 'backend');
      assert.deepEqual(res.models, ['deepseek-chat', 'deepseek-reasoner']);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('probeProviderModels falls back to direct upstream on 404 backend and 404 /models -> /chat/completions', async () => {
  const originalFetch = globalThis.fetch;
  const calledUrls: string[] = [];

  globalThis.fetch = async (input) => {
    const url = String(input);
    calledUrls.push(url);
    if (url === '/api/ai/fetch-models') {
      return mockResponse(404, JSON.stringify({ error: 'Not found' }));
    }
    if (url === 'https://api.deepseek.com/v1/models') {
      return mockResponse(404, JSON.stringify({ error: { message: 'Not supported' } }));
    }
    if (url === 'https://api.deepseek.com/v1/chat/completions') {
      return mockResponse(200, JSON.stringify({ id: 'cmpl-1', choices: [{ message: { content: 'pong' } }] }));
    }
    throw new Error(`Unexpected URL: ${url}`);
  };

  try {
    const res = await probeProviderModels({
      provider: 'openai_compatible',
      majorProvider: 'deepseek',
      apiKey: 'sk-test-valid',
    });
    assert.equal(res.status, 'success');
    if (res.status === 'success') {
      assert.equal(res.source, 'direct');
      assert.deepEqual(res.models, ['deepseek-flash', 'deepseek-v4-pro']);
    }
    assert.deepEqual(calledUrls, [
      '/api/ai/fetch-models',
      'https://api.deepseek.com/v1/models',
      'https://api.deepseek.com/v1/chat/completions',
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('probeProviderModels skips backend SSRF guard on Web localhost Ollama even without API key', async () => {
  const originalFetch = globalThis.fetch;
  const calledUrls: string[] = [];

  globalThis.fetch = async (input) => {
    const url = String(input);
    calledUrls.push(url);
    return mockResponse(200, JSON.stringify({ data: [{ id: 'qwen2.5:7b' }] }));
  };

  try {
    const res = await probeProviderModels({
      provider: 'openai_compatible',
      majorProvider: 'custom',
      baseUrl: 'http://localhost:11434/v1/',
      apiKey: '',
    });
    assert.equal(res.status, 'success');
    assert.deepEqual(calledUrls, ['http://localhost:11434/v1/models']);
    if (res.status === 'success') {
      assert.deepEqual(res.models, ['qwen2.5:7b']);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('probeProviderModels fast-fails on 401/403 without hitting /chat/completions', async () => {
  const originalFetch = globalThis.fetch;
  const calledUrls: string[] = [];

  globalThis.fetch = async (input) => {
    const url = String(input);
    calledUrls.push(url);
    if (url === '/api/ai/fetch-models') {
      return mockResponse(404, 'Not Found', 'text/plain');
    }
    return mockResponse(401, JSON.stringify({ error: { message: 'Invalid API key' } }));
  };

  try {
    const res = await probeProviderModels({
      provider: 'openai_compatible',
      majorProvider: 'deepseek',
      apiKey: 'sk-invalid',
    });
    assert.equal(res.status, 'error');
    if (res.status === 'error') {
      assert.match(res.error, /Invalid API key/);
    }
    assert.deepEqual(calledUrls, [
      '/api/ai/fetch-models',
      'https://api.deepseek.com/v1/models',
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('probeProviderModels rejects HTTP 200 HTML captive portal responses instead of returning fallback models', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url === '/api/ai/fetch-models') {
      return mockResponse(404, 'Not Found', 'text/plain');
    }
    return mockResponse(200, '<!doctype html><html><body>Portal Login</body></html>', 'text/html');
  };

  try {
    const res = await probeProviderModels({
      provider: 'openai_compatible',
      majorProvider: 'deepseek',
      apiKey: 'sk-test',
    });
    assert.equal(res.status, 'error');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('probeProviderModels supports CapacitorHttp on native Android platform', async () => {
  const capUrls: string[] = [];
  const nativeAdapter: ModelProbePlatformAdapter = {
    isNativePlatform: () => true,
    capacitorGet: async (opts) => {
      capUrls.push(opts.url);
      return {
        status: 200,
        data: JSON.stringify({
          data: [{ id: 'deepseek-chat' }, { id: 'deepseek-reasoner' }],
        }),
      };
    },
    capacitorPost: async (opts) => {
      capUrls.push(opts.url);
      return {
        status: 200,
        data: { id: 'cmpl-native', choices: [{ message: { content: 'pong' } }] },
      };
    },
  };

  const res = await probeProviderModels(
    {
      provider: 'openai_compatible',
      majorProvider: 'deepseek',
      apiKey: 'sk-native-deepseek',
    },
    nativeAdapter
  );
  assert.equal(res.status, 'success');
  assert.deepEqual(capUrls, ['https://api.deepseek.com/v1/models']);
  if (res.status === 'success') {
    assert.equal(res.source, 'direct');
    assert.deepEqual(res.models, ['deepseek-chat', 'deepseek-reasoner']);
  }
});

test('probeProviderModels surfaces timeout error when Express backend hangs', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (_input, init) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener(
        'abort',
        () => {
          const err = new Error('Aborted');
          err.name = 'AbortError';
          reject(err);
        },
        { once: true }
      );
    });

  try {
    const res = await probeProviderModels({
      provider: 'openai_compatible',
      majorProvider: 'deepseek',
      apiKey: 'sk-timeout',
      timeoutMs: 25,
    });
    assert.equal(res.status, 'error');
    if (res.status === 'error') {
      assert.equal(res.aborted, undefined);
      assert.match(res.error, /超时/);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('probeProviderModels respects external AbortSignal', async () => {
  const controller = new AbortController();
  controller.abort();

  const res = await probeProviderModels({
    provider: 'openai_compatible',
    majorProvider: 'deepseek',
    apiKey: 'sk-abort-test',
    signal: controller.signal,
  });
  assert.equal(res.status, 'error');
  if (res.status === 'error') {
    assert.equal(res.aborted, true);
  }
});

test('readAiConfig resolves provider defaults, strips suffixes, and requires Gemini user key', () => {
  const hadLocalStorage = 'localStorage' in globalThis;
  const originalStorage = (globalThis as { localStorage?: Storage }).localStorage;
  const store = new Map<string, string>();
  const mockStorage: Storage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    writable: true,
    value: mockStorage,
  });

  try {
    // 1. Gemini without API key returns null (no built-in system fallback)
    mockStorage.setItem(
      'lyricalens_ai_config',
      JSON.stringify({ provider: 'gemini', majorProvider: 'gemini', geminiApiKey: '   ' })
    );
    assert.equal(readAiConfig(), null);

    // 2. Gemini with user key
    mockStorage.setItem(
      'lyricalens_ai_config',
      JSON.stringify({
        provider: 'gemini',
        majorProvider: 'gemini',
        geminiApiKey: 'AIza-user-key',
        geminiModel: 'gemini-2.5-pro',
      })
    );
    assert.deepEqual(readAiConfig(), {
      type: 'gemini',
      majorProvider: 'gemini',
      protocol: 'gemini',
      apiKey: 'AIza-user-key',
      model: 'gemini-2.5-pro',
    });

    // 3. Qwen with empty baseUrl uses Qwen official URL & default model, not DeepSeek
    mockStorage.setItem(
      'lyricalens_ai_config',
      JSON.stringify({
        provider: 'openai_compatible',
        majorProvider: 'qwen',
        customApiKey: 'sk-qwen-123',
        customBaseUrl: '',
        customModel: '',
      })
    );
    assert.deepEqual(readAiConfig(), {
      type: 'openai_compatible',
      majorProvider: 'qwen',
      protocol: 'openai_compatible',
      apiKey: 'sk-qwen-123',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      model: 'qwen-plus',
    });

    // 4. DeepSeek URL with trailing /chat/completions strips duplicate path
    mockStorage.setItem(
      'lyricalens_ai_config',
      JSON.stringify({
        provider: 'openai_compatible',
        majorProvider: 'deepseek',
        customApiKey: 'sk-ds-123',
        customBaseUrl: 'https://api.deepseek.com/v1/chat/completions/',
        customModel: 'deepseek-reasoner',
      })
    );
    assert.deepEqual(readAiConfig(), {
      type: 'openai_compatible',
      majorProvider: 'deepseek',
      protocol: 'openai_compatible',
      apiKey: 'sk-ds-123',
      baseUrl: 'https://api.deepseek.com/v1',
      model: 'deepseek-reasoner',
    });

    // 5. Claude official endpoint uses anthropic protocol
    mockStorage.setItem(
      'lyricalens_ai_config',
      JSON.stringify({
        provider: 'openai_compatible',
        majorProvider: 'claude',
        customApiKey: 'sk-ant-123',
        customBaseUrl: 'https://api.anthropic.com/v1/',
      })
    );
    assert.deepEqual(readAiConfig(), {
      type: 'openai_compatible',
      majorProvider: 'claude',
      protocol: 'anthropic',
      apiKey: 'sk-ant-123',
      baseUrl: 'https://api.anthropic.com/v1',
      model: 'claude-3-7-sonnet-20250219',
    });
  } finally {
    if (hadLocalStorage) {
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        writable: true,
        value: originalStorage,
      });
    } else {
      delete (globalThis as { localStorage?: Storage }).localStorage;
    }
  }
});
