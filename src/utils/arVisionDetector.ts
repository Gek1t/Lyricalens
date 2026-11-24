import type { ARDetectedObject } from '../types';
import {
  DEFAULT_BASE_URLS,
  extractApiErrorMessage,
  getDefaultBaseUrl,
} from './aiProviderDefaults';
import {
  DEFAULT_PLATFORM_ADAPTER,
  performHttpRequest,
  type ModelProbePlatformAdapter,
} from './aiModelProbe';
import {
  readAiConfig,
  readNestedText,
  type ActiveAiConfig,
} from './aiPhraseTranslator';

export type VisionErrorCode =
  | 'ABORTED'
  | 'NO_API_CONFIG'
  | 'AUTH_ERROR'
  | 'UNSUPPORTED_VISION'
  | 'RATE_LIMIT'
  | 'TIMEOUT'
  | 'HTTP_ERROR'
  | 'NETWORK_ERROR'
  | 'EMPTY_RESULT';

export class VisionDetectionError extends Error {
  public readonly code: VisionErrorCode;
  public readonly status?: number;

  constructor(code: VisionErrorCode, message: string, status?: number) {
    super(message);
    this.name = 'VisionDetectionError';
    this.code = code;
    this.status = status;
  }
}

export interface VisionDetectOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface VisionDetectResult {
  tags: ARDetectedObject[];
  engine: string;
  isFallback?: boolean;
  usedVisionFallback?: boolean;
}

const VISION_SYSTEM_PROMPT = `You are a high-precision Spatial AR Vision & IELTS Lexicography AI.
Detect 1 to 6 distinct physical objects clearly visible in the image, including both primary items and smaller distinct foreground items.
Return ONLY strict valid JSON in this schema:
{
  "items": [
    {
      "label": "porcelain mug",
      "phonetic": "/ˈpɔːsəlɪn mʌɡ/",
      "cn": "白瓷杯",
      "en_def": "A cup made of fine white glazed ceramic.",
      "example_en": "Steam rose gently from the porcelain mug beside the manuscript.",
      "example_cn": "热气从手稿旁的白瓷杯中袅袅升起。",
      "pos": { "x": 38, "y": 48 }
    }
  ]
}
Rules:
- "label": concise lowercase English noun or 1-2 word noun phrase.
- "pos": exact visual anchor { "x": 0..100, "y": 0..100 } in image percentage pointing directly onto the object's unobstructed surface.
- "phonetic": accurate UK IPA transcription.
- "cn": concise 2-5 character Chinese translation.
- "en_def": concise 1-sentence English definition.
- "example_en" & "example_cn": 1 natural IELTS-level sentence describing the object in context and its Chinese translation.`;

const VISION_USER_PROMPT =
  'Identify 1 to 6 visible physical objects in this image with accurate percentage coordinates (x: 0-100, y: 0-100) and vocabulary details. Output JSON only.';

function normalizeImagePayload(imageBase64: string): {
  dataUrl: string;
  cleanBase64: string;
  mimeType: string;
} {
  const trimmed = imageBase64.trim();
  const dataUrlMatch = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/i.exec(trimmed);
  if (dataUrlMatch) {
    const mimeType = dataUrlMatch[1].toLowerCase();
    const cleanBase64 = dataUrlMatch[2].trim();
    return {
      mimeType,
      cleanBase64,
      dataUrl: `data:${mimeType};base64,${cleanBase64}`,
    };
  }
  const cleanBase64 = trimmed.replace(/^data:[^,]+,/, '');
  return {
    mimeType: 'image/jpeg',
    cleanBase64,
    dataUrl: `data:image/jpeg;base64,${cleanBase64}`,
  };
}

function clampCoordinate(value: unknown, min: number, max: number): number {
  if (value === null || value === undefined || typeof value === 'boolean') {
    return Math.round((min + max) / 2);
  }
  let hadPercent = false;
  let rawValue: unknown = value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed === '%') {
      return Math.round((min + max) / 2);
    }
    if (trimmed.endsWith('%')) {
      hadPercent = true;
      rawValue = trimmed.slice(0, -1).trim();
      if (!rawValue) return Math.round((min + max) / 2);
    } else {
      rawValue = trimmed;
    }
  }
  const num = Number(rawValue);
  if (!Number.isFinite(num)) return Math.round((min + max) / 2);
  let scaled = num;
  if (!hadPercent && num > 0 && num <= 1) {
    scaled = num * 100;
  } else if (num > 100) {
    scaled = num / 10;
  }
  return Math.min(max, Math.max(min, Math.round(scaled)));
}

function pickFirstString(
  record: Record<string, unknown>,
  keys: ReadonlyArray<string>
): string {
  for (const key of keys) {
    const val = record[key];
    if (typeof val === 'string' && val.trim()) {
      return val.trim();
    }
  }
  return '';
}

function extractItemCoordinates(item: Record<string, unknown>): { x: unknown; y: unknown } {
  if (item.pos && typeof item.pos === 'object' && !Array.isArray(item.pos)) {
    const rawPos = item.pos as Record<string, unknown>;
    return {
      x: rawPos.x ?? rawPos.cx ?? rawPos.left,
      y: rawPos.y ?? rawPos.cy ?? rawPos.top,
    };
  }
  if (Array.isArray(item.pos) && item.pos.length >= 2) {
    return { x: item.pos[0], y: item.pos[1] };
  }
  if (item.x !== undefined || item.y !== undefined) {
    return { x: item.x, y: item.y };
  }
  // Standard Gemini / Qwen / DeepSeek box_2d is [ymin, xmin, ymax, xmax]
  if (Array.isArray(item.box_2d) && item.box_2d.length >= 4) {
    const yMin = Number(item.box_2d[0]);
    const xMin = Number(item.box_2d[1]);
    const yMax = Number(item.box_2d[2]);
    const xMax = Number(item.box_2d[3]);
    if ([yMin, xMin, yMax, xMax].every(Number.isFinite)) {
      const maxBound = Math.max(yMin, xMin, yMax, xMax);
      const centerX = (xMin + xMax) / 2;
      const centerY = (yMin + yMax) / 2;
      if (maxBound > 100) {
        return { x: centerX / 10, y: centerY / 10 };
      }
      if (maxBound > 0 && maxBound <= 1) {
        return { x: centerX * 100, y: centerY * 100 };
      }
      return { x: centerX, y: centerY };
    }
  }
  return { x: undefined, y: undefined };
}

function buildArDetectedObject(rawItem: unknown, index: number, timestamp: number): ARDetectedObject | null {
  if (!rawItem || typeof rawItem !== 'object' || Array.isArray(rawItem)) {
    return null;
  }
  const item = rawItem as Record<string, unknown>;
  const label = pickFirstString(item, ['label', 'word', 'name', 'object', 'title', 'item']);
  if (!label) return null;

  const coords = extractItemCoordinates(item);

  const phonetic =
    pickFirstString(item, ['phonetic', 'ipa']) || `/${label.toLowerCase()}/`;
  const cn =
    pickFirstString(item, ['cn', 'translation', 'meaning', 'definition_cn', 'definitionCn']) ||
    label;
  const enDef =
    pickFirstString(item, ['en_def', 'enDef', 'definition', 'description']) ||
    `A physical ${label} visible in the scene.`;
  const exampleEn =
    pickFirstString(item, ['example_en', 'exampleEn']) ||
    `The ${label} is clearly visible in the foreground.`;
  const exampleCn =
    pickFirstString(item, ['example_cn', 'exampleCn']) ||
    `画面前景中可以清晰看到这个${cn}。`;

  return {
    id: `ar-ai-${timestamp}-${index}`,
    label,
    phonetic,
    pos: {
      x: clampCoordinate(coords.x, 12, 88),
      y: clampCoordinate(coords.y, 18, 82),
      z: 0,
    },
    confidence: 0.96,
    wordData: {
      word: label,
      phoneticUk: phonetic,
      phoneticUs: phonetic,
      partOfSpeech: 'n.',
      definition: enDef,
      definitionCn: cn,
      examples: [
        {
          en: exampleEn,
          cn: exampleCn,
          source: 'AR 实景识物 · AI 多模态解析',
        },
      ],
      sourceContext: `AR 实景识物: ${label}`,
      isStarred: false,
      masteryLevel: 0,
      addedTimestamp: timestamp,
      categories: ['AR Vision', 'IELTS'],
    },
  };
}

function findObjectArrayStartsOutsideStrings(text: string): number[] {
  const starts: number[] = [];
  let inString = false;
  let escaped = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
    } else if (ch === '[') {
      const rest = text.slice(i + 1).trimStart();
      if (rest.startsWith('{')) {
        starts.push(i);
      }
    }
  }
  return starts;
}

function scanClosedObjectsFrom(text: string, scanStart: number): unknown[] {
  const recovered: unknown[] = [];

  let inString = false;
  let escaped = false;
  let braceDepth = 0;
  let objStart = -1;

  for (let i = scanStart; i < text.length; i += 1) {
    const ch = text[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
    } else if (ch === '{') {
      if (braceDepth === 0) {
        objStart = i;
      }
      braceDepth += 1;
    } else if (ch === '}') {
      braceDepth -= 1;
      if (braceDepth === 0 && objStart !== -1) {
        try {
          const parsedObj: unknown = JSON.parse(text.slice(objStart, i + 1));
          if (parsedObj && typeof parsedObj === 'object' && !Array.isArray(parsedObj)) {
            recovered.push(parsedObj);
          }
        } catch {
          // Skip malformed fragment and continue recovering any remaining valid objects
        }
        objStart = -1;
      } else if (braceDepth < 0) {
        braceDepth = 0;
        objStart = -1;
      }
    }
  }

  return recovered;
}

function recoverTruncatedTags(text: string, timestamp: number): ARDetectedObject[] {
  const mapItems = (items: unknown[]): ARDetectedObject[] =>
    items
      .map((item, idx) => buildArDetectedObject(item, idx, timestamp))
      .filter((tag): tag is ARDetectedObject => tag !== null);

  for (const arrIdx of findObjectArrayStartsOutsideStrings(text)) {
    const tags = mapItems(scanClosedObjectsFrom(text, arrIdx + 1));
    if (tags.length > 0) {
      return tags;
    }
  }

  return mapItems(scanClosedObjectsFrom(text, 0));
}

const WRAPPER_ARRAY_KEYS = [
  'items',
  'objects',
  'tags',
  'results',
  'detected_objects',
  'words',
  'data',
  'labels',
] as const;

function extractRawItemList(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed;
  if (!parsed || typeof parsed !== 'object') return [];

  const record = parsed as Record<string, unknown>;
  for (const key of WRAPPER_ARRAY_KEYS) {
    if (Array.isArray(record[key])) {
      return record[key] as unknown[];
    }
  }

  if (pickFirstString(record, ['label', 'word', 'name', 'object', 'title', 'item'])) {
    return [record];
  }

  for (const value of Object.values(record)) {
    if (
      Array.isArray(value) &&
      value.some((entry) => Boolean(entry) && typeof entry === 'object' && !Array.isArray(entry))
    ) {
      return value;
    }
  }

  return [];
}

/**
 * Parses model text output (raw JSON array, wrapped object, markdown-fenced JSON,
 * or partially truncated JSON arrays) into normalized ARDetectedObject tags.
 */
export function parseVisionResponseToTags(
  rawText: unknown,
  timestamp = Date.now()
): ARDetectedObject[] {
  if (typeof rawText !== 'string') return [];
  const trimmed = rawText.trim();
  if (!trimmed) return [];

  let candidate = trimmed;
  const closedFenceMatch = candidate.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (closedFenceMatch && closedFenceMatch[1]) {
    candidate = closedFenceMatch[1].trim();
  } else {
    const openFenceMatch = candidate.match(/```(?:json)?\s*([\s\S]*)$/i);
    if (openFenceMatch && openFenceMatch[1]) {
      candidate = openFenceMatch[1].replace(/\s*```$/i, '').trim();
    }
  }

  const firstObj = candidate.indexOf('{');
  const lastObj = candidate.lastIndexOf('}');
  const firstArr = candidate.indexOf('[');
  const lastArr = candidate.lastIndexOf(']');

  const objSpan = firstObj !== -1 && lastObj > firstObj ? candidate.slice(firstObj, lastObj + 1) : '';
  const arrSpan = firstArr !== -1 && lastArr > firstArr ? candidate.slice(firstArr, lastArr + 1) : '';

  const spans: string[] = [];
  if (arrSpan && (!objSpan || firstArr < firstObj)) {
    spans.push(arrSpan);
    if (objSpan) spans.push(objSpan);
  } else {
    if (objSpan) spans.push(objSpan);
    if (arrSpan) spans.push(arrSpan);
  }

  for (const span of spans) {
    try {
      const parsed: unknown = JSON.parse(span);
      const rawList = extractRawItemList(parsed);
      const tags = rawList
        .map((item, idx) => buildArDetectedObject(item, idx, timestamp))
        .filter((tag): tag is ARDetectedObject => tag !== null);
      if (tags.length > 0) {
        return tags;
      }
    } catch {
      // Try next span or truncated JSON recovery
    }
  }

  return recoverTruncatedTags(candidate, timestamp);
}

type DirectVisionProtocol = 'gemini' | 'anthropic' | 'openai_compatible';

function isDeepSeekTarget(aiConfig: ActiveAiConfig, resolvedBaseUrl: string): boolean {
  if (aiConfig.majorProvider === 'deepseek') return true;
  return /(?:^|\/\/|\.)deepseek\.com/i.test(resolvedBaseUrl);
}

function buildDirectVisionHttpRequest(
  aiConfig: ActiveAiConfig,
  imageBase64: string
): {
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
  protocol: DirectVisionProtocol;
} {
  const { cleanBase64, dataUrl, mimeType } = normalizeImagePayload(imageBase64);

  if (aiConfig.protocol === 'gemini' || aiConfig.type === 'gemini') {
    const baseUrl = (aiConfig.baseUrl || DEFAULT_BASE_URLS.gemini).replace(/\/+$/, '');
    return {
      protocol: 'gemini',
      url: `${baseUrl}/models/${encodeURIComponent(aiConfig.model)}:generateContent?key=${encodeURIComponent(
        aiConfig.apiKey
      )}`,
      headers: { 'Content-Type': 'application/json' },
      body: {
        systemInstruction: { parts: [{ text: VISION_SYSTEM_PROMPT }] },
        contents: [
          {
            parts: [
              { text: VISION_USER_PROMPT },
              {
                inlineData: {
                  mimeType,
                  data: cleanBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      },
    };
  }

  if (aiConfig.protocol === 'anthropic') {
    const baseUrl = (aiConfig.baseUrl || DEFAULT_BASE_URLS.claude).replace(/\/+$/, '');
    return {
      protocol: 'anthropic',
      url: `${baseUrl}/messages`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': aiConfig.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: {
        model: aiConfig.model,
        max_tokens: 4096,
        temperature: 0.2,
        system: VISION_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mimeType,
                  data: cleanBase64,
                },
              },
              { type: 'text', text: VISION_USER_PROMPT },
            ],
          },
        ],
      },
    };
  }

  const baseUrl = (aiConfig.baseUrl || getDefaultBaseUrl(aiConfig.majorProvider || 'deepseek')).replace(
    /\/+$/,
    ''
  );
  const deepSeekExtraFields = isDeepSeekTarget(aiConfig, baseUrl)
    ? {
        thinking: { type: 'disabled' },
        response_format: { type: 'json_object' },
      }
    : {};

  return {
    protocol: 'openai_compatible',
    url: `${baseUrl}/chat/completions`,
    headers: {
      'Content-Type': 'application/json',
      ...(aiConfig.apiKey ? { Authorization: `Bearer ${aiConfig.apiKey}` } : {}),
    },
    body: {
      model: aiConfig.model,
      temperature: 0.2,
      max_tokens: 4096,
      ...deepSeekExtraFields,
      messages: [
        { role: 'system', content: VISION_SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: VISION_USER_PROMPT },
            {
              type: 'image_url',
              image_url: { url: dataUrl },
            },
          ],
        },
      ],
    },
  };
}

function isOptionalParamRejection(message: string): boolean {
  return (
    /thinking|response_format|json_object|temperature|unknown field|extra inputs|unrecognized/i.test(
      message
    ) && !/image|vision|multimodal|image_url|text[- ]only|input_modalities/i.test(message)
  );
}

function shouldStripOptionalParamsAndRetry(
  protocol: DirectVisionProtocol,
  status: number,
  body: Record<string, unknown>,
  errorMessage: string
): boolean {
  if (protocol !== 'openai_compatible') return false;
  if (status !== 400 && status !== 422) return false;
  const hasOptionalField =
    'thinking' in body || 'response_format' in body || 'temperature' in body;
  return hasOptionalField && isOptionalParamRejection(errorMessage);
}

function stripOptionalOpenAiParams(body: Record<string, unknown>): Record<string, unknown> {
  const nextBody: Record<string, unknown> = { ...body };
  delete nextBody.thinking;
  delete nextBody.response_format;
  delete nextBody.temperature;
  return nextBody;
}

function classifyHttpFailure(status: number, message: string, model: string): VisionDetectionError {
  if (status === 401 || status === 403) {
    return new VisionDetectionError('AUTH_ERROR', `AI 密钥无效或无权限 (${status})`, status);
  }
  if (status === 429) {
    return new VisionDetectionError('RATE_LIMIT', 'AI 接口请求过于频繁或额度不足，请稍后重试', status);
  }
  if (
    (status === 400 || status === 404 || status === 422) &&
    !isOptionalParamRejection(message) &&
    /image|vision|multimodal|image_url|text[- ]only|input_modalities|does not support|not supported/i.test(
      message
    )
  ) {
    return new VisionDetectionError(
      'UNSUPPORTED_VISION',
      `当前模型 (${model}) 不支持图像识别，请在设置中更换视觉模型`,
      status
    );
  }
  return new VisionDetectionError('HTTP_ERROR', `识图服务异常: ${message}`, status);
}

function extractEmbeddedApiError(
  data: unknown,
  rawText: string,
  fallbackStatus: number
): { status: number; message: string } | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return null;
  }
  const record = data as Record<string, unknown>;
  const hasErrorObj =
    (typeof record.error === 'string' && record.error.trim().length > 0) ||
    (Boolean(record.error) &&
      typeof record.error === 'object' &&
      !Array.isArray(record.error) &&
      Object.keys(record.error as Record<string, unknown>).length > 0);
  const baseResp =
    record.base_resp && typeof record.base_resp === 'object' && !Array.isArray(record.base_resp)
      ? (record.base_resp as Record<string, unknown>)
      : null;
  const hasBaseRespError =
    Boolean(baseResp) && typeof baseResp?.status_code === 'number' && baseResp.status_code !== 0;

  if (!hasErrorObj && !hasBaseRespError) {
    return null;
  }

  let status = fallbackStatus >= 400 ? fallbackStatus : 400;
  if (hasErrorObj && typeof record.error === 'object') {
    const errRec = record.error as Record<string, unknown>;
    const numericStatus = Number(errRec.status ?? errRec.code);
    if (Number.isInteger(numericStatus) && numericStatus >= 400 && numericStatus <= 599) {
      status = numericStatus;
    }
  }
  return {
    status,
    message: extractApiErrorMessage(data, rawText, status),
  };
}

function readReasoningFallbackText(data: unknown, protocol: DirectVisionProtocol): string {
  if (!data || typeof data !== 'object') return '';
  const record = data as Record<string, unknown>;

  if (protocol === 'openai_compatible') {
    const choices = Array.isArray(record.choices) ? record.choices : [];
    const first =
      choices[0] && typeof choices[0] === 'object' ? (choices[0] as Record<string, unknown>) : null;
    const message =
      first?.message && typeof first.message === 'object'
        ? (first.message as Record<string, unknown>)
        : null;
    for (const candidate of [message?.reasoning_content, message?.reasoning]) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }
    }
    return '';
  }

  if (protocol === 'anthropic') {
    const content = Array.isArray(record.content) ? record.content : [];
    return content
      .filter(
        (part): part is Record<string, unknown> =>
          Boolean(part) &&
          typeof part === 'object' &&
          (part as Record<string, unknown>).type === 'thinking'
      )
      .map((part) =>
        typeof part.thinking === 'string' ? part.thinking : typeof part.text === 'string' ? part.text : ''
      )
      .filter(Boolean)
      .join('\n')
      .trim();
  }

  const candidates = Array.isArray(record.candidates) ? record.candidates : [];
  const firstCandidate =
    candidates[0] && typeof candidates[0] === 'object'
      ? (candidates[0] as Record<string, unknown>)
      : null;
  const contentObj =
    firstCandidate?.content && typeof firstCandidate.content === 'object'
      ? (firstCandidate.content as Record<string, unknown>)
      : null;
  const parts = Array.isArray(contentObj?.parts) ? contentObj.parts : [];
  return parts
    .filter(
      (part): part is Record<string, unknown> =>
        Boolean(part) && typeof part === 'object' && (part as Record<string, unknown>).thought === true
    )
    .map((part) => (typeof part.text === 'string' ? part.text : ''))
    .filter(Boolean)
    .join('\n')
    .trim();
}

function readFinishReason(data: unknown, protocol: DirectVisionProtocol): string {
  if (!data || typeof data !== 'object') return '';
  const record = data as Record<string, unknown>;
  if (protocol === 'openai_compatible') {
    const choices = Array.isArray(record.choices) ? record.choices : [];
    const first =
      choices[0] && typeof choices[0] === 'object' ? (choices[0] as Record<string, unknown>) : null;
    return typeof first?.finish_reason === 'string' ? first.finish_reason : '';
  }
  if (protocol === 'anthropic') {
    return typeof record.stop_reason === 'string' ? record.stop_reason : '';
  }
  const candidates = Array.isArray(record.candidates) ? record.candidates : [];
  const first =
    candidates[0] && typeof candidates[0] === 'object'
      ? (candidates[0] as Record<string, unknown>)
      : null;
  return typeof first?.finishReason === 'string' ? first.finishReason : '';
}

function isVisionRefusalText(text: unknown): boolean {
  if (typeof text !== 'string' || !text.trim()) return false;
  return (
    /(?:cannot|can't|unable to|do not|don't|not able to)\s+(?:see|view|process|analyze|read|recognize|identify|inspect)\s+(?:images?|pictures?|photos?|visuals?)/i.test(
      text
    ) ||
    /(?:no|without)\s+(?:vision|image|visual)\s+(?:capabilit|support)/i.test(text) ||
    /text[- ]only\s+model|i am a language model|as an ai text model|cannot handle image/i.test(
      text
    ) ||
    /(?:无法|不能|不支持|暂不支持|没有能力|没法)(?:直接)?(?:查看|识别|处理|读取|分析|理解|接收)(?:图片|图像|照片|视觉|多模态)/.test(
      text
    ) ||
    /纯文本模型|仅支持文本|不具备(?:视觉|看图|识图)能力/.test(text)
  );
}

function isPreNormalizedTagArray(value: unknown): value is ARDetectedObject[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        Boolean(item) &&
        typeof item === 'object' &&
        typeof (item as { label?: unknown }).label === 'string' &&
        Boolean((item as { wordData?: unknown }).wordData)
    )
  );
}

async function requestDirectVision(
  aiConfig: ActiveAiConfig,
  imageBase64: string,
  timeoutMs: number,
  signal: AbortSignal | undefined,
  adapter: ModelProbePlatformAdapter
): Promise<VisionDetectResult> {
  const reqSpec = buildDirectVisionHttpRequest(aiConfig, imageBase64);

  try {
    let res = await performHttpRequest(
      reqSpec.url,
      {
        method: 'POST',
        headers: reqSpec.headers,
        body: reqSpec.body,
        timeoutMs,
        signal,
      },
      adapter
    );

    if (!res.ok) {
      const upstreamMsg = extractApiErrorMessage(res.data, res.rawText, res.status);
      if (shouldStripOptionalParamsAndRetry(reqSpec.protocol, res.status, reqSpec.body, upstreamMsg)) {
        res = await performHttpRequest(
          reqSpec.url,
          {
            method: 'POST',
            headers: reqSpec.headers,
            body: stripOptionalOpenAiParams(reqSpec.body),
            timeoutMs,
            signal,
          },
          adapter
        );
      }
    }

    if (!res.ok) {
      const upstreamMsg = extractApiErrorMessage(res.data, res.rawText, res.status);
      throw classifyHttpFailure(res.status, upstreamMsg, aiConfig.model);
    }

    if (res.data === null && /<html|<!doctype/i.test(res.rawText)) {
      throw new VisionDetectionError(
        'NETWORK_ERROR',
        '接口返回了网页而非数据，请检查 Base URL 配置是否正确'
      );
    }

    const embeddedError = extractEmbeddedApiError(res.data, res.rawText, res.status);
    if (embeddedError) {
      throw classifyHttpFailure(embeddedError.status, embeddedError.message, aiConfig.model);
    }

    const nestedText = readNestedText(res.data, reqSpec.protocol);
    let parsedTags = parseVisionResponseToTags(nestedText);
    const reasoningText =
      parsedTags.length === 0 ? readReasoningFallbackText(res.data, reqSpec.protocol) : '';
    if (parsedTags.length === 0 && reasoningText) {
      parsedTags = parseVisionResponseToTags(reasoningText);
    }

    if (parsedTags.length === 0) {
      if (isVisionRefusalText(nestedText) || isVisionRefusalText(reasoningText)) {
        throw new VisionDetectionError(
          'UNSUPPORTED_VISION',
          `当前模型 (${aiConfig.model}) 不支持图像识别，请在设置中更换视觉模型`
        );
      }
      const finishReason = readFinishReason(res.data, reqSpec.protocol);
      if (/^(?:length|max_tokens)$/i.test(finishReason)) {
        throw new VisionDetectionError(
          'HTTP_ERROR',
          `AI 输出达到长度上限被截断，未能生成完整识图标签 (${aiConfig.model})，请重试或切换视觉模型`
        );
      }
      throw new VisionDetectionError('EMPTY_RESULT', '未识别到清晰物体，请调整构图重拍');
    }

    return {
      tags: parsedTags,
      engine: `${aiConfig.majorProvider || aiConfig.type}:${aiConfig.model}`,
    };
  } catch (err: unknown) {
    if (err instanceof VisionDetectionError) throw err;
    if (signal?.aborted) {
      throw new VisionDetectionError('ABORTED', '识图请求已取消');
    }
    const msg = err instanceof Error ? err.message : '';
    if (/超时|timeout|abort/i.test(msg)) {
      throw new VisionDetectionError(
        'TIMEOUT',
        'AI 识图响应超时，请检查网络或切换响应更快的视觉模型'
      );
    }
    throw new VisionDetectionError(
      'NETWORK_ERROR',
      msg ? `网络连接失败: ${msg}` : '网络连接失败，请检查网络后重试'
    );
  }
}

/**
 * Runs AR object detection using user-configured AI provider directly (CapacitorHttp on APK,
 * fetch on Web) and falls back to Express `/api/gemini/vision-detect` only on Web when unconfigured.
 */
export async function detectObjectsWithAiVision(
  imageBase64: string,
  options: VisionDetectOptions = {},
  adapter: ModelProbePlatformAdapter = DEFAULT_PLATFORM_ADAPTER,
  configOverride?: ActiveAiConfig | null
): Promise<VisionDetectResult> {
  if (!imageBase64 || !imageBase64.trim()) {
    throw new VisionDetectionError('EMPTY_RESULT', '未能获取有效画面，请重试');
  }
  if (/^https?:\/\//i.test(imageBase64.trim())) {
    throw new VisionDetectionError('EMPTY_RESULT', '画面尚未完成本地采样，请重拍或更换图片');
  }
  if (options.signal?.aborted) {
    throw new VisionDetectionError('ABORTED', '识图请求已取消');
  }

  const timeoutMs = options.timeoutMs ?? 35000;
  const aiConfig = configOverride === undefined ? readAiConfig() : configOverride;

  if (!aiConfig) {
    if (adapter.isNativePlatform()) {
      throw new VisionDetectionError(
        'NO_API_CONFIG',
        '请先在右上角菜单「同步与偏好设置」中配置 AI 密钥'
      );
    }

    try {
      const backendRes = await performHttpRequest(
        '/api/gemini/vision-detect',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: { imageBase64 },
          timeoutMs,
          signal: options.signal,
        },
        adapter
      );

      if (backendRes.ok && backendRes.data && typeof backendRes.data === 'object') {
        const record = backendRes.data as Record<string, unknown>;
        if (isPreNormalizedTagArray(record.tags) && record.tags.length > 0) {
          return {
            tags: record.tags,
            engine: typeof record.engine === 'string' ? record.engine : 'server-vision',
            isFallback: Boolean(record.isFallback),
          };
        }
      }

      if (backendRes.status === 404) {
        throw new VisionDetectionError(
          'NO_API_CONFIG',
          '请先在右上角菜单「同步与偏好设置」中配置 AI 密钥'
        );
      }

      const errMsg = extractApiErrorMessage(backendRes.data, backendRes.rawText, backendRes.status);
      throw classifyHttpFailure(backendRes.status, errMsg, 'server-default');
    } catch (err: unknown) {
      if (err instanceof VisionDetectionError) throw err;
      if (options.signal?.aborted) {
        throw new VisionDetectionError('ABORTED', '识图请求已取消');
      }
      const msg = err instanceof Error ? err.message : '';
      if (/超时|timeout|abort/i.test(msg)) {
        throw new VisionDetectionError('TIMEOUT', '识图请求超时，请检查网络或重试');
      }
      throw new VisionDetectionError('NETWORK_ERROR', '网络或本地识图服务不可用，请检查设置或网络');
    }
  }

  try {
    return await requestDirectVision(aiConfig, imageBase64, timeoutMs, options.signal, adapter);
  } catch (err: unknown) {
    const normalizedModel = aiConfig.model.trim().toLowerCase();
    const resolvedBaseUrl = (
      aiConfig.baseUrl || getDefaultBaseUrl(aiConfig.majorProvider || 'deepseek')
    ).replace(/\/+$/, '');
    const isOpenAiCompat =
      aiConfig.protocol !== 'gemini' &&
      aiConfig.protocol !== 'anthropic' &&
      aiConfig.type !== 'gemini';
    const isDeepSeek = isOpenAiCompat && isDeepSeekTarget(aiConfig, resolvedBaseUrl);
    if (
      err instanceof VisionDetectionError &&
      err.code === 'UNSUPPORTED_VISION' &&
      isDeepSeek &&
      normalizedModel !== 'deepseek-flash' &&
      !options.signal?.aborted
    ) {
      try {
        const fallbackResult = await requestDirectVision(
          { ...aiConfig, model: 'deepseek-flash' },
          imageBase64,
          timeoutMs,
          options.signal,
          adapter
        );
        return {
          ...fallbackResult,
          engine: `${aiConfig.majorProvider || aiConfig.type}:deepseek-flash (vision-fallback)`,
          usedVisionFallback: true,
        };
      } catch (fallbackErr: unknown) {
        if (
          fallbackErr instanceof VisionDetectionError &&
          (fallbackErr.code === 'UNSUPPORTED_VISION' ||
            (fallbackErr.code === 'HTTP_ERROR' &&
              (fallbackErr.status === 400 || fallbackErr.status === 404)))
        ) {
          throw err;
        }
        throw fallbackErr;
      }
    }
    throw err;
  }
}
