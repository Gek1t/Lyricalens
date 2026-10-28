import { Router, type Request, type Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { isSafeExternalUrl, requireAuth, type AuthenticatedRequest } from '../auth';

const router = Router();

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'lyricalens-fullstack-agent',
      },
    },
  });
}

// POST /api/ai/stream-generate - Real-time SSE streaming endpoint with robust lifecycle management
router.post('/stream-generate', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { prompt, systemInstruction, model = 'gemini-2.5-flash', endpoint, apiKey } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  let isAborted = false;
  const abortController = new AbortController();

  // Heartbeat ping every 12s to prevent proxy timeouts
  const heartbeatTimer = setInterval(() => {
    if (!res.writableEnded && !req.destroyed) {
      res.write(': keep-alive\n\n');
    }
  }, 12000);

  const cleanup = () => {
    isAborted = true;
    abortController.abort();
    clearInterval(heartbeatTimer);
  };

  req.on('close', cleanup);
  res.on('finish', cleanup);

  const sendEvent = (event: string, data: any) => {
    if (isAborted || req.destroyed || res.writableEnded) return;
    try {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch {}
  };

  try {
    const customKey = (apiKey || '').trim();
    const customEndpoint = (endpoint || '').trim();

    // 1. OpenAI / DeepSeek compatible upstream
    if (customKey && customEndpoint) {
      const targetUrl = customEndpoint.endsWith('/chat/completions')
        ? customEndpoint
        : `${customEndpoint.replace(/\/+$/, '')}/chat/completions`;

      if (!isSafeExternalUrl(targetUrl)) {
        sendEvent('error', { error: 'SSRF Protection: Blocked internal or unsafe destination URL' });
        cleanup();
        return res.end();
      }

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customKey}`,
        },
        body: JSON.stringify({
          model: model || 'deepseek-chat',
          stream: true,
          messages: [
            ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
            { role: 'user', content: prompt },
          ],
        }),
        signal: abortController.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Upstream API failed: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (!isAborted) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const payload = trimmed.replace(/^data:\s*/, '');
          if (payload === '[DONE]') {
            if (!isAborted) {
              sendEvent('done', {});
              res.end();
            }
            return;
          }
          try {
            const parsed = JSON.parse(payload);
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content && !isAborted) {
              sendEvent('chunk', { text: content });
            }
          } catch {}
        }
      }

      if (!isAborted) {
        sendEvent('done', {});
        res.end();
      }
      return;
    }

    // 2. Default Gemini streaming
    const ai = getGeminiClient();
    if (!ai) {
      sendEvent('error', { message: 'Gemini API key is not configured' });
      res.end();
      return;
    }

    const responseStream = await ai.models.generateContentStream({
      model,
      contents: prompt,
      config: systemInstruction
        ? { systemInstruction: { parts: [{ text: systemInstruction }] } }
        : undefined,
    });

    for await (const chunk of responseStream) {
      if (isAborted || req.destroyed) {
        break;
      }
      if (chunk.text) {
        sendEvent('chunk', { text: chunk.text });
      }
    }

    if (!isAborted) {
      sendEvent('done', {});
      res.end();
    }
  } catch (error: any) {
    if (!isAborted && !req.destroyed && !res.writableEnded) {
      sendEvent('error', { message: error.message || 'Stream generation failed' });
      res.end();
    }
  } finally {
    cleanup();
  }
});

export default router;
