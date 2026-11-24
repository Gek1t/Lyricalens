import { Capacitor, CapacitorHttp } from '@capacitor/core';
import type { AIProviderType, MajorAIProvider } from '../types';
import {
  DEFAULT_BASE_URLS,
  FALLBACK_MODELS_BY_PROVIDER,
  PROVIDER_LABELS,
  extractApiErrorMessage,
  getDefaultBaseUrl,
  getDefaultModelForProvider,
  isLocalAiEndpoint,
  isValidAiHandshakeJson,
  normalizeProbeBaseUrl,
  parseModelsPayload,
  resolveMajorProvider,
} from './aiProviderDefaults';

export {
  DEFAULT_BASE_URLS,
  FALLBACK_MODELS_BY_PROVIDER,
  PROVIDER_LABELS,
  extractApiErrorMessage,
  getDefaultBaseUrl,
  getDefaultModelForProvider,
  isLocalAiEndpoint,
  isValidAiHandshakeJson,
  normalizeProbeBaseUrl,
  parseModelsPayload,
  resolveMajorProvider,
};

export interface ModelProbeHttpResponse {
  status: number;
  data: unknown;
}

export interface ModelProbePlatformAdapter {
  isNativePlatform: () => boolean;
  capacitorGet: (options: {
    url: string;
    headers: Record<string, string>;
    connectTimeout: number;
    readTimeout: number;
  }) => Promise<ModelProbeHttpResponse>;
  capacitorPost: (options: {
    url: string;
    headers: Record<string, string>;
    data: Record<string, unknown>;
    connectTimeout: number;
    readTimeout: number;
  }) => Promise<ModelProbeHttpResponse>;
}

export const DEFAULT_PLATFORM_ADAPTER: ModelProbePlatformAdapter = {
  isNativePlatform: () => Capacitor.isNativePlatform(),
  capacitorGet: (options) => CapacitorHttp.get(options),
  capacitorPost: (options) => CapacitorHttp.post(options),
};

export interface ModelProbeRequest {
  provider: AIProviderType;
  majorProvider: MajorAIProvider;
  baseUrl?: string;
  apiKey: string;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export type ModelProbeResult =
  | {
      status: 'success';
      models: string[];
      defaultModel: string;
      latency: number;
      message: string;
      source: 'backend' | 'direct';
    }
  | {
      status: 'error';
      error: string;
      aborted?: boolean;
    };

export interface HttpCallResponse {
  ok: boolean;
  status: number;
  data: unknown;
  rawText: string;
}

function isAbortError(err: unknown): boolean {
  if (err instanceof Error && err.name === 'AbortError') return true;
  if (typeof DOMException !== 'undefined' && err instanceof DOMException && err.name === 'AbortError') {
    return true;
  }
  return (
    typeof err === 'object' &&
    err !== null &&
    'name' in err &&
    (err as { name?: unknown }).name === 'AbortError'
  );
}

function createAbortError(): Error {
  if (typeof DOMException !== 'undefined') {
    return new DOMException('Aborted', 'AbortError') as unknown as Error;
  }
  const err = new Error('Aborted');
  err.name = 'AbortError';
  return err;
}

export async function performHttpRequest(
  url: string,
  options: {
    method: 'GET' | 'POST';
    headers: Record<string, string>;
    body?: Record<string, unknown>;
    timeoutMs: number;
    signal?: AbortSignal;
  },
  adapter: ModelProbePlatformAdapter = DEFAULT_PLATFORM_ADAPTER
): Promise<HttpCallResponse> {
  if (options.signal?.aborted) {
    throw createAbortError();
  }

  if (adapter.isNativePlatform()) {
    let abortHandler: (() => void) | null = null;
    let nativeTimer: ReturnType<typeof setTimeout> | null = null;

    const abortPromise = new Promise<never>((_, reject) => {
      if (!options.signal) return;
      abortHandler = () => reject(createAbortError());
      options.signal.addEventListener('abort', abortHandler, { once: true });
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      nativeTimer = setTimeout(() => reject(new Error('请求超时，请检查网络连接')), options.timeoutMs);
    });

    try {
      const requestCall =
        options.method === 'GET'
          ? adapter.capacitorGet({
              url,
              headers: options.headers,
              connectTimeout: options.timeoutMs,
              readTimeout: options.timeoutMs,
            })
          : adapter.capacitorPost({
              url,
              headers: options.headers,
              data: options.body || {},
              connectTimeout: options.timeoutMs,
              readTimeout: options.timeoutMs,
            });

      const res = await Promise.race([requestCall, timeoutPromise, abortPromise]);
      const rawText = typeof res.data === 'string' ? res.data : JSON.stringify(res.data ?? {});
      let parsedData: unknown = res.data;
      if (typeof res.data === 'string') {
        try {
          parsedData = res.data ? JSON.parse(res.data) : null;
        } catch {
          parsedData = null;
        }
      }
      return {
        ok: res.status >= 200 && res.status < 300,
        status: res.status,
        data: parsedData,
        rawText,
      };
    } finally {
      if (nativeTimer !== null) {
        clearTimeout(nativeTimer);
      }
      if (options.signal && abortHandler) {
        options.signal.removeEventListener('abort', abortHandler);
      }
    }
  }

  const controller = new AbortController();
  const onParentAbort = () => controller.abort();
  options.signal?.addEventListener('abort', onParentAbort, { once: true });
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, options.timeoutMs);

  try {
    const res = await fetch(url, {
      method: options.method,
      headers: options.headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
    const rawText = await res.text();
    let parsedData: unknown = null;
    try {
      parsedData = rawText ? JSON.parse(rawText) : null;
    } catch {
      parsedData = null;
    }
    return {
      ok: res.ok,
      status: res.status,
      data: parsedData,
      rawText,
    };
  } catch (err: unknown) {
    if (timedOut && !options.signal?.aborted) {
      throw new Error('请求超时，请检查网络连接');
    }
    throw err;
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', onParentAbort);
  }
}

async function probeDirectUpstream(
  req: ModelProbeRequest,
  major: MajorAIProvider,
  startTime: number,
  timeoutMs: number,
  adapter: ModelProbePlatformAdapter
): Promise<ModelProbeResult> {
  const cleanKey = req.apiKey.trim();

  if (major === 'gemini') {
    const url = `${DEFAULT_BASE_URLS.gemini}/models?key=${encodeURIComponent(cleanKey)}`;
    const res = await performHttpRequest(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      timeoutMs,
      signal: req.signal,
    }, adapter);

    if (res.status === 401 || res.status === 403) {
      return { status: 'error', error: extractApiErrorMessage(res.data, res.rawText, res.status) };
    }

    if (res.ok) {
      if (res.data === null) {
        return {
          status: 'error',
          error: 'Gemini 接口返回非 JSON 响应（可能被代理或网页拦截），请检查网络',
        };
      }
      const parsed = parseModelsPayload(res.data, 'gemini');
      if (parsed.length > 0) {
        const latency = Date.now() - startTime;
        const defaultModel = parsed.includes('gemini-2.5-flash') ? 'gemini-2.5-flash' : parsed[0];
        return {
          status: 'success',
          models: parsed,
          defaultModel,
          latency,
          message: `已连接 Gemini 接口 · 延迟 ${latency}ms`,
          source: 'direct',
        };
      }
    }

    // Fallback check when `/models` returns 404/405 or empty list on a custom proxy
    if (res.status !== 404 && res.status !== 405 && !res.ok) {
      return { status: 'error', error: extractApiErrorMessage(res.data, res.rawText, res.status) };
    }

    const pingUrl = `${DEFAULT_BASE_URLS.gemini}/models/${getDefaultModelForProvider('gemini')}:generateContent?key=${encodeURIComponent(cleanKey)}`;
    const pingRes = await performHttpRequest(pingUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        contents: [{ parts: [{ text: 'Hi' }] }],
      },
      timeoutMs,
      signal: req.signal,
    }, adapter);

    if (!pingRes.ok) {
      return {
        status: 'error',
        error: extractApiErrorMessage(pingRes.data, pingRes.rawText, pingRes.status),
      };
    }
    if (!isValidAiHandshakeJson(pingRes.data)) {
      return {
        status: 'error',
        error: 'Gemini 接口返回非 JSON 响应，请检查网络连接',
      };
    }

    const models = [...FALLBACK_MODELS_BY_PROVIDER.gemini];
    const latency = Date.now() - startTime;
    return {
      status: 'success',
      models,
      defaultModel: models[0],
      latency,
      message: `已连接 Gemini 接口 · 延迟 ${latency}ms`,
      source: 'direct',
    };
  }

  const cleanBase = normalizeProbeBaseUrl(req.baseUrl, major);
  const isAnthropicDirect = major === 'claude' && cleanBase.includes('api.anthropic.com');

  if (isAnthropicDirect) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': cleanKey,
      'anthropic-version': '2023-06-01',
    };
    const modelsRes = await performHttpRequest(`${cleanBase}/models`, {
      method: 'GET',
      headers,
      timeoutMs,
      signal: req.signal,
    }, adapter);

    if (modelsRes.status === 401 || modelsRes.status === 403) {
      return {
        status: 'error',
        error: extractApiErrorMessage(modelsRes.data, modelsRes.rawText, modelsRes.status),
      };
    }

    if (modelsRes.ok) {
      if (modelsRes.data === null) {
        return {
          status: 'error',
          error: '接口返回非 JSON 响应（可能被代理或网页拦截），请核对接口地址',
        };
      }
      const parsed = parseModelsPayload(modelsRes.data, 'claude');
      if (parsed.length > 0) {
        const latency = Date.now() - startTime;
        return {
          status: 'success',
          models: parsed,
          defaultModel: parsed[0],
          latency,
          message: `已连接 Claude 接口 · 延迟 ${latency}ms`,
          source: 'direct',
        };
      }
    }

    const pingRes = await performHttpRequest(`${cleanBase}/messages`, {
      method: 'POST',
      headers,
      body: {
        model: getDefaultModelForProvider('claude'),
        max_tokens: 5,
        messages: [{ role: 'user', content: 'Ping' }],
      },
      timeoutMs,
      signal: req.signal,
    }, adapter);

    if (!pingRes.ok) {
      return {
        status: 'error',
        error: extractApiErrorMessage(pingRes.data, pingRes.rawText, pingRes.status),
      };
    }
    if (!isValidAiHandshakeJson(pingRes.data)) {
      return {
        status: 'error',
        error: '接口返回非 JSON 响应，请核对接口地址',
      };
    }

    const latency = Date.now() - startTime;
    const models = [...FALLBACK_MODELS_BY_PROVIDER.claude];
    return {
      status: 'success',
      models,
      defaultModel: models[0],
      latency,
      message: `已连接 Claude 接口 · 延迟 ${latency}ms`,
      source: 'direct',
    };
  }

  // OpenAI-compatible upstream (DeepSeek, OpenAI, Kimi, Qwen, GLM, Custom, or Claude relay)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(cleanKey ? { Authorization: `Bearer ${cleanKey}` } : {}),
  };

  const modelsRes = await performHttpRequest(`${cleanBase}/models`, {
    method: 'GET',
    headers,
    timeoutMs,
    signal: req.signal,
  }, adapter);

  if (modelsRes.status === 401 || modelsRes.status === 403) {
    return {
      status: 'error',
      error: extractApiErrorMessage(modelsRes.data, modelsRes.rawText, modelsRes.status),
    };
  }

  if (modelsRes.ok) {
    if (modelsRes.data === null) {
      return {
        status: 'error',
        error: '接口返回非 JSON 响应（可能是网页或代理拦截），请核对接口地址',
      };
    }
    const parsed = parseModelsPayload(modelsRes.data, major);
    if (parsed.length > 0) {
      const latency = Date.now() - startTime;
      const preferredDefault = getDefaultModelForProvider(major);
      const defaultModel = parsed.includes(preferredDefault) ? preferredDefault : parsed[0];
      return {
        status: 'success',
        models: parsed,
        defaultModel,
        latency,
        message: `已获取 ${parsed.length} 个可用模型 · 延迟 ${latency}ms`,
        source: 'direct',
      };
    }
  }

  // Some compatible relays disable GET /models or return empty list; verify via chat/completions handshake
  const fallbackList = [...(FALLBACK_MODELS_BY_PROVIDER[major] || FALLBACK_MODELS_BY_PROVIDER.custom)];
  const pingRes = await performHttpRequest(`${cleanBase}/chat/completions`, {
    method: 'POST',
    headers,
    body: {
      model: fallbackList[0],
      messages: [{ role: 'user', content: 'Ping' }],
      max_tokens: 5,
    },
    timeoutMs,
    signal: req.signal,
  }, adapter);

  if (!pingRes.ok) {
    return {
      status: 'error',
      error: extractApiErrorMessage(pingRes.data, pingRes.rawText, pingRes.status),
    };
  }

  if (!isValidAiHandshakeJson(pingRes.data)) {
    return {
      status: 'error',
      error: '接口返回非 JSON 响应（可能是网页或代理拦截），请核对接口地址',
    };
  }

  const latency = Date.now() - startTime;
  return {
    status: 'success',
    models: fallbackList,
    defaultModel: fallbackList[0],
    latency,
    message: `已完成连通握手 · 延迟 ${latency}ms`,
    source: 'direct',
  };
}

/**
 * Probes available AI models for the selected provider.
 * Uses direct CapacitorHttp requests on native Android/iOS and local endpoints on Web,
 * or Express `/api/ai/fetch-models` on Web with automatic direct-fetch fallback.
 */
export async function probeProviderModels(
  req: ModelProbeRequest,
  adapter: ModelProbePlatformAdapter = DEFAULT_PLATFORM_ADAPTER
): Promise<ModelProbeResult> {
  const startTime = Date.now();
  const timeoutMs = req.timeoutMs ?? 8000;
  const cleanKey = req.apiKey.trim();
  const major = resolveMajorProvider(req.majorProvider, req.provider);
  const isGemini = major === 'gemini';
  const isLocal = !isGemini && isLocalAiEndpoint(req.baseUrl);

  if (!cleanKey && !isLocal) {
    return { status: 'error', error: '请先填写 API Key 后再进行探测' };
  }

  try {
    // Bypass Express SSRF guard on Web for local loopback endpoints (e.g. Ollama localhost:11434)
    if (!adapter.isNativePlatform() && !isLocal) {
      const normalizedBase = isGemini ? '' : normalizeProbeBaseUrl(req.baseUrl, major);
      const backendController = new AbortController();
      const onParentAbort = () => backendController.abort();
      req.signal?.addEventListener('abort', onParentAbort, { once: true });
      let backendTimedOut = false;
      const backendTimer = setTimeout(() => {
        backendTimedOut = true;
        backendController.abort();
      }, timeoutMs);

      try {
        const backendRes = await fetch('/api/ai/fetch-models', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: backendController.signal,
          body: JSON.stringify({
            provider: req.provider,
            majorProvider: major,
            baseUrl: normalizedBase,
            apiKey: cleanKey,
          }),
        });
        const contentType = backendRes.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = (await backendRes.json()) as {
            success?: boolean;
            models?: unknown;
            defaultModel?: string;
            latency?: number;
            message?: string;
            error?: string;
          };
          if (backendRes.ok && data.success && Array.isArray(data.models) && data.models.length > 0) {
            const models = data.models.map(m => String(m).trim()).filter(Boolean);
            const latency = typeof data.latency === 'number' ? data.latency : Date.now() - startTime;
            return {
              status: 'success',
              models,
              defaultModel: data.defaultModel || models[0],
              latency,
              message: data.message || `已发现 ${models.length} 个可用模型 · 延迟 ${latency}ms`,
              source: 'backend',
            };
          }
          if (backendRes.status !== 404) {
            return {
              status: 'error',
              error: data.error || '探测失败，请核对 API Key 或接口地址',
            };
          }
        }
      } catch (backendErr: unknown) {
        if (req.signal?.aborted) {
          return { status: 'error', error: '请求已取消', aborted: true };
        }
        if (backendTimedOut || isAbortError(backendErr)) {
          return { status: 'error', error: '探测请求超时，请检查网络连接' };
        }
        // Static frontend / preview without Express backend -> fall through to direct probe
      } finally {
        clearTimeout(backendTimer);
        req.signal?.removeEventListener('abort', onParentAbort);
      }
    }

    return await probeDirectUpstream(req, major, startTime, timeoutMs, adapter);
  } catch (err: unknown) {
    if (isAbortError(err)) {
      if (req.signal?.aborted) {
        return { status: 'error', error: '请求已取消', aborted: true };
      }
      return { status: 'error', error: '探测请求超时，请检查网络连接' };
    }
    const msg = err instanceof Error ? err.message : '网络请求失败，请检查网络连接';
    return { status: 'error', error: msg };
  }
}
