import { isGarbageTranslation } from './lyricDictionary';
import { AIProviderConfig, AIProviderType, MajorAIProvider } from '../types';
import {
  getDefaultModelForProvider,
  isLocalAiEndpoint,
  isValidAiHandshakeJson,
  normalizeProbeBaseUrl,
  resolveMajorProvider,
} from './aiProviderDefaults';
import { performHttpRequest } from './aiModelProbe';

export interface ActiveAiConfig {
  type: 'gemini' | 'openai_compatible';
  majorProvider?: MajorAIProvider;
  protocol?: 'gemini' | 'anthropic' | 'openai_compatible';
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface PhraseContextParams {
  phrase: string;
  sentence: string;
  sentenceCn?: string;
  songTitle?: string;
  artist?: string;
}

export interface PhraseTranslationResult {
  cn: string;
  note?: string;
}

const phraseTranslationCache = new Map<string, PhraseTranslationResult>();

/**
 * Reads user AI configuration from localStorage 'lyricalens_ai_config'.
 * Returns null if no valid API key is configured.
 */
export function readAiConfig(): ActiveAiConfig | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const saved = localStorage.getItem('lyricalens_ai_config');
    if (!saved) return null;

    const parsed: Partial<AIProviderConfig> = JSON.parse(saved);
    const provider: AIProviderType =
      parsed.provider === 'gemini' || parsed.provider === 'openai_compatible'
        ? parsed.provider
        : 'openai_compatible';
    const majorProvider = resolveMajorProvider(parsed.majorProvider, provider);

    const isGemini = majorProvider === 'gemini' || provider === 'gemini';

    if (isGemini) {
      const apiKey = (parsed.geminiApiKey || '').trim();
      if (!apiKey) return null;
      const model = (parsed.geminiModel || getDefaultModelForProvider('gemini')).trim();
      return {
        type: 'gemini',
        majorProvider: 'gemini',
        protocol: 'gemini',
        apiKey,
        model
      };
    }

    const baseUrl = normalizeProbeBaseUrl(parsed.customBaseUrl, majorProvider);
    const apiKey = (parsed.customApiKey || '').trim();
    if (!apiKey && !isLocalAiEndpoint(baseUrl)) return null;

    const model = (parsed.customModel || getDefaultModelForProvider(majorProvider)).trim();
    const isAnthropicDirect = majorProvider === 'claude' && baseUrl.includes('api.anthropic.com');

    return {
      type: 'openai_compatible',
      majorProvider,
      protocol: isAnthropicDirect ? 'anthropic' : 'openai_compatible',
      apiKey,
      baseUrl,
      model
    };
  } catch {
    return null;
  }
}

/**
 * Robust JSON extraction and validation helper.
 * Handles ```json ... ``` code fence, raw JSON, and surrounding noise.
 * Returns null if invalid, malformed, or filtered by isGarbageTranslation.
 */
export function parseAiPhraseResponse(rawText: unknown): PhraseTranslationResult | null {
  if (!rawText || typeof rawText !== 'string') return null;
  const trimmed = rawText.trim();
  if (!trimmed) return null;

  // 1. Strip markdown code fence if present
  let cleaned = trimmed;
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    cleaned = fenceMatch[1].trim();
  }

  // 2. Locate innermost JSON object boundaries if surrounding text exists
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  try {
    const parsed = JSON.parse(cleaned);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;

    const rawCn = typeof parsed.cn === 'string' ? parsed.cn.trim() : '';
    if (!rawCn || isGarbageTranslation(rawCn)) return null;

    const rawNote = typeof parsed.note === 'string' ? parsed.note.trim() : undefined;
    return {
      cn: rawCn,
      ...(rawNote ? { note: rawNote } : {})
    };
  } catch {
    return null;
  }
}

function extractTextParts(parts: unknown[]): string | null {
  const texts: string[] = [];
  for (const part of parts) {
    if (typeof part === 'string') {
      if (part) texts.push(part);
      continue;
    }
    if (!part || typeof part !== 'object') continue;
    const record = part as Record<string, unknown>;
    if (
      record.thought === true ||
      record.type === 'thinking' ||
      record.type === 'redacted_thinking'
    ) {
      continue;
    }
    if (typeof record.text === 'string' && record.text) {
      texts.push(record.text);
    }
  }
  return texts.length > 0 ? texts.join('\n') : null;
}

export function readNestedText(
  raw: unknown,
  protocol: 'gemini' | 'anthropic' | 'openai_compatible'
): unknown {
  if (!raw || typeof raw !== 'object') return null;
  const root = raw as Record<string, unknown>;

  if (protocol === 'gemini') {
    const candidates = Array.isArray(root.candidates) ? root.candidates : [];
    const firstCandidate = candidates[0] as Record<string, unknown> | undefined;
    const content = firstCandidate?.content as Record<string, unknown> | undefined;
    const parts = Array.isArray(content?.parts) ? content.parts : [];
    return extractTextParts(parts);
  }

  if (protocol === 'anthropic') {
    const content = Array.isArray(root.content) ? root.content : [];
    return extractTextParts(content);
  }

  const choices = Array.isArray(root.choices) ? root.choices : [];
  const firstChoice = choices[0] as Record<string, unknown> | undefined;
  const message = firstChoice?.message as Record<string, unknown> | undefined;
  const msgContent = message?.content;
  if (Array.isArray(msgContent)) {
    return extractTextParts(msgContent);
  }
  return msgContent ?? null;
}

async function postAiJson(
  url: string,
  headers: Record<string, string>,
  body: Record<string, unknown>,
  timeoutMs: number
): Promise<unknown> {
  const res = await performHttpRequest(url, {
    method: 'POST',
    headers,
    body,
    timeoutMs,
  });
  if (!res.ok) return null;
  return isValidAiHandshakeJson(res.data) ? res.data : null;
}

/**
 * Translates a phrase in lyric/sentence context using user-configured AI model.
 * Native devices use CapacitorHttp.post; web uses fetch with AbortController (8000ms timeout).
 * In-memory caching key: `${phrase.toLowerCase()}||${sentence.toLowerCase()}`
 */
export async function translatePhraseInContext(
  params: PhraseContextParams
): Promise<PhraseTranslationResult | null> {
  const { phrase, sentence, sentenceCn, songTitle, artist } = params;
  if (!phrase || !phrase.trim()) return null;

  const phraseClean = phrase.trim();
  const sentenceClean = (sentence || '').trim();
  const cacheKey = `${phraseClean.toLowerCase()}||${sentenceClean.toLowerCase()}`;

  if (phraseTranslationCache.has(cacheKey)) {
    return phraseTranslationCache.get(cacheKey)!;
  }

  const aiConfig = readAiConfig();
  if (!aiConfig) return null;

  const systemPrompt =
    '你是一位精通英语俚语、流行音乐文化与歌词翻译的语言专家。请根据提供的歌词语境，给出目标短语在该句歌词语境下的地道中文释义（尤其是俚语、双关语或特定文化隐喻，必须按实际含义翻译，严禁字面直译）。\n' +
    '输出要求：必须且仅输出合法的 JSON 格式：{"cn": "地道中文释义（10-20字内）", "note": "用法或背景简短说明（可选，≤30字）"}。不要包含任何额外说明或除 JSON 以外的内容。';

  let userPrompt = `短语: "${phraseClean}"\n所在英文歌词: "${sentenceClean || '无'}"`;
  if (sentenceCn && sentenceCn.trim()) {
    userPrompt += `\n歌词中文参考: "${sentenceCn.trim()}"`;
  }
  if (songTitle || artist) {
    userPrompt += `\n歌曲信息: "${songTitle || '未知'} - ${artist || '未知'}"`;
  }
  userPrompt += '\n请输出该短语在此歌词语境下的准确中文释义 JSON。';

  const timeoutMs = 8000;

  try {
    if (aiConfig.type === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        aiConfig.model
      )}:generateContent?key=${encodeURIComponent(aiConfig.apiKey)}`;
      const rawResponse = await postAiJson(
        url,
        { 'Content-Type': 'application/json' },
        {
          contents: [
            {
              parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json'
          }
        },
        timeoutMs
      );

      const text = readNestedText(rawResponse, 'gemini');
      const parsed = parseAiPhraseResponse(text);
      if (parsed) {
        phraseTranslationCache.set(cacheKey, parsed);
        return parsed;
      }
      return null;
    }

    if (aiConfig.protocol === 'anthropic') {
      const url = `${aiConfig.baseUrl}/messages`;
      const rawResponse = await postAiJson(
        url,
        {
          'Content-Type': 'application/json',
          ...(aiConfig.apiKey ? { 'x-api-key': aiConfig.apiKey } : {}),
          'anthropic-version': '2023-06-01'
        },
        {
          model: aiConfig.model,
          max_tokens: 256,
          temperature: 0.2,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }]
        },
        timeoutMs
      );

      const text = readNestedText(rawResponse, 'anthropic');
      const parsed = parseAiPhraseResponse(text);
      if (parsed) {
        phraseTranslationCache.set(cacheKey, parsed);
        return parsed;
      }
      return null;
    }

    // OpenAI compatible upstream (DeepSeek, Claude proxy, OpenAI, Qwen, Kimi, GLM, Custom)
    const url = `${aiConfig.baseUrl}/chat/completions`;
    const rawResponse = await postAiJson(
      url,
      {
        'Content-Type': 'application/json',
        ...(aiConfig.apiKey ? { Authorization: `Bearer ${aiConfig.apiKey}` } : {})
      },
      {
        model: aiConfig.model,
        temperature: 0.2,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      },
      timeoutMs
    );

    const text = readNestedText(rawResponse, 'openai_compatible');
    const parsed = parseAiPhraseResponse(text);
    if (parsed) {
      phraseTranslationCache.set(cacheKey, parsed);
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
