import { Result, GeminiError } from '../../types/errors';
import { GeminiRequest, StreamChunk, GeminiConfig } from '../../types/api';
import { HttpClient } from '../../types/dependencies';
import { parseSSEStream } from './stream-parser';

export async function* streamCompletion(
  request: GeminiRequest,
  accessToken: string,
  config: GeminiConfig,
  httpClient: HttpClient
): AsyncGenerator<Result<StreamChunk, GeminiError>, void, unknown> {
  const url = `${config.endpoint}:streamGenerateContent?alt=sse`;
  
  try {
    // Wrap the request in the expected format
    const streamRequest = {
      model: request.model,
      project: config.projectId || 'default',
      request: {
        contents: request.contents,
        generationConfig: request.generationConfig
      }
    };
    
    console.error('[gemini-mcp] DEBUG: Streaming request URL:', url);
    console.error('[gemini-mcp] DEBUG: Streaming request body:', JSON.stringify(streamRequest, null, 2));
    
    const response = await httpClient.post(
      url,
      JSON.stringify(streamRequest),
      {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    );
    
    if (response.status === 401) {
      yield {
        ok: false,
        error: { type: 'API_ERROR', statusCode: 401, message: 'Authentication failed' }
      };
      return;
    }
    
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers['retry-after'] || '60', 10);
      yield {
        ok: false,
        error: { type: 'RATE_LIMIT', retryAfter }
      };
      return;
    }
    
    if (response.status !== 200) {
      const text = await response.text();
      yield {
        ok: false,
        error: { type: 'API_ERROR', statusCode: response.status, message: text }
      };
      return;
    }
    
    for await (const chunk of parseSSEStream(response.body)) {
      yield { ok: true, value: chunk };
    }
  } catch (error) {
    yield {
      ok: false,
      error: {
        type: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network error'
      }
    };
  }
}