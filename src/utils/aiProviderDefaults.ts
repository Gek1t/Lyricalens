import type { MajorAIProvider } from '../types';

export const FALLBACK_MODELS_BY_PROVIDER: Record<MajorAIProvider, readonly string[]> = {
  deepseek: ['deepseek-flash', 'deepseek-v4-pro'],
  claude: [
    'claude-3-7-sonnet-20250219',
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022',
  ],
  openai: ['gpt-4o-mini', 'gpt-4o', 'o3-mini', 'o1'],
  gemini: [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-3-flash-preview',
    'gemini-3.1-pro-preview',
  ],
  kimi: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k', 'moonshot-v1-auto'],
  qwen: ['qwen-plus', 'qwen-max', 'qwen-turbo', 'qwen-plus-latest', 'qwen2.5-72b-instruct'],
  glm: ['glm-4-flash', 'glm-4-plus', 'glm-4-air', 'glm-4-long', 'glm-4'],
  custom: ['deepseek-ai/DeepSeek-V3', 'deepseek-chat', 'gpt-4o-mini', 'claude-3-7-sonnet'],
};

export const DEFAULT_BASE_URLS: Record<MajorAIProvider, string> = {
  deepseek: 'https://api.deepseek.com/v1',
  claude: 'https://api.anthropic.com/v1',
  openai: 'https://api.openai.com/v1',
  gemini: 'https://generativelanguage.googleapis.com/v1beta',
  kimi: 'https://api.moonshot.cn/v1',
  qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  glm: 'https://open.bigmodel.cn/api/paas/v4',
  custom: 'https://api.siliconflow.cn/v1',
};

export const PROVIDER_LABELS: Record<MajorAIProvider, string> = {
  deepseek: 'DeepSeek',
  claude: 'Claude',
  openai: 'OpenAI',
  gemini: 'Gemini',
  kimi: 'Kimi (月之暗面)',
  qwen: '阿里通义千问 (Qwen)',
  glm: '智谱 GLM',
  custom: '兼容接口',
};

const KNOWN_MAJOR_PROVIDERS = new Set<MajorAIProvider>([
  'deepseek',
  'claude',
  'openai',
  'gemini',
  'kimi',
  'qwen',
  'glm',
  'custom',
]);

/**
 * Resolves a validated MajorAIProvider identifier from persisted or request fields.
 */
export function resolveMajorProvider(rawMajor?: string, rawProvider?: string): MajorAIProvider {
  if (rawMajor && KNOWN_MAJOR_PROVIDERS.has(rawMajor as MajorAIProvider)) {
    return rawMajor as MajorAIProvider;
  }
  return rawProvider === 'gemini' ? 'gemini' : 'deepseek';
}

/**
 * Returns the canonical default Base URL for a given AI provider.
 */
export function getDefaultBaseUrl(majorProvider: MajorAIProvider): string {
  return DEFAULT_BASE_URLS[majorProvider] || DEFAULT_BASE_URLS.deepseek;
}

/**
 * Returns the canonical default model ID for a given AI provider.
 */
export function getDefaultModelForProvider(majorProvider: MajorAIProvider): string {
  const models = FALLBACK_MODELS_BY_PROVIDER[majorProvider] || FALLBACK_MODELS_BY_PROVIDER.deepseek;
  return models[0];
}

/**
 * Normalizes a user-entered AI Base URL by trimming whitespace and stripping
 * trailing `/chat/completions`, `/messages`, `/models`, or `/` suffixes.
 */
export function normalizeProbeBaseUrl(rawUrl: string | undefined, majorProvider: MajorAIProvider): string {
  const fallback = getDefaultBaseUrl(majorProvider);
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return fallback;

  return trimmed
    .replace(/\/+$/, '')
    .replace(/\/(chat\/completions|messages|models)$/i, '')
    .replace(/\/+$/, '');
}

/**
 * Checks whether a Base URL targets a loopback endpoint (`localhost` or `127.0.0.1`).
 */
export function isLocalAiEndpoint(rawUrl: string | undefined): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test((rawUrl || '').trim());
}

/**
 * Extracts normalized model IDs from OpenAI-compatible, Gemini, or Anthropic `/models` payloads.
 */
export function parseModelsPayload(
  payload: unknown,
  majorProvider: MajorAIProvider
): string[] {
  if (!payload || typeof payload !== 'object') return [];
  const record = payload as Record<string, unknown>;
  const rawList = Array.isArray(record.data)
    ? record.data
    : Array.isArray(record.models)
      ? record.models
      : [];

  const extracted = rawList
    .map(item => {
      if (typeof item === 'string') return item.trim();
      if (!item || typeof item !== 'object') return '';
      const entry = item as Record<string, unknown>;
      if (majorProvider === 'gemini') {
        const methods = Array.isArray(entry.supportedGenerationMethods)
          ? entry.supportedGenerationMethods.map(m => String(m))
          : null;
        if (methods && !methods.includes('generateContent')) {
          return '';
        }
      }
      const rawId = typeof entry.id === 'string'
        ? entry.id
        : typeof entry.name === 'string'
          ? entry.name
          : '';
      return rawId.replace(/^models\//, '').trim();
    })
    .filter(Boolean);

  const unique = Array.from(new Set(extracted));
  if (majorProvider === 'openai') {
    const filtered = unique.filter(
      id =>
        (id.startsWith('gpt-') || id.startsWith('o1') || id.startsWith('o3') || id.startsWith('o4') || id.startsWith('chatgpt')) &&
        !id.includes('realtime') &&
        !id.includes('audio') &&
        !id.includes('transcription')
    );
    if (filtered.length > 0) {
      return filtered.slice(0, 20);
    }
  }

  if (majorProvider === 'gemini') {
    const geminiFiltered = unique.filter(id => id.startsWith('gemini'));
    if (geminiFiltered.length > 0) {
      return geminiFiltered.slice(0, 20);
    }
  }

  return unique.slice(0, 30);
}

/**
 * Checks whether a parsed JSON body represents a valid API response object (not HTML or embedded error).
 */
export function isValidAiHandshakeJson(data: unknown): boolean {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  return !obj.error;
}

/**
 * Extracts a concise human-readable error message from JSON or raw HTTP error text.
 */
export function extractApiErrorMessage(data: unknown, rawText: string, status: number): string {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>;
    if (typeof obj.error === 'string' && obj.error.trim()) return obj.error.trim();
    if (obj.error && typeof obj.error === 'object') {
      const nested = obj.error as Record<string, unknown>;
      if (typeof nested.message === 'string' && nested.message.trim()) return nested.message.trim();
    }
    if (typeof obj.message === 'string' && obj.message.trim()) return obj.message.trim();
  }
  if (status === 401 || status === 403) {
    return `API Key 无效或未授权 (${status})`;
  }
  const snippet = rawText.replace(/<[^>]+>/g, '').trim().slice(0, 100);
  return snippet ? `接口返回 HTTP ${status}: ${snippet}` : `接口返回 HTTP ${status}`;
}
