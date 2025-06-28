import { Result, OAuthError } from '../types/errors';
import { OAuthCredentials } from '../types/oauth';
import { SSEEvent, StreamChunk } from '../types/api';

export const parseCredentials = (content: string): Result<OAuthCredentials, OAuthError> => {
  try {
    const parsed = JSON.parse(content);
    
    if (!isOAuthCredentials(parsed)) {
      return {
        ok: false,
        error: { type: 'INVALID_CREDENTIALS', reason: 'Missing required fields' }
      };
    }
    
    return { ok: true, value: parsed };
  } catch (error) {
    return {
      ok: false,
      error: { type: 'INVALID_CREDENTIALS', reason: 'Invalid JSON format' }
    };
  }
};

const isOAuthCredentials = (obj: unknown): obj is OAuthCredentials => {
  if (typeof obj !== 'object' || obj === null) return false;
  
  const creds = obj as Record<string, unknown>;
  return (
    typeof creds.access_token === 'string' &&
    typeof creds.refresh_token === 'string' &&
    typeof creds.expiry_date === 'number' &&
    typeof creds.scope === 'string' &&
    typeof creds.token_type === 'string'
  );
};

export const parseSSELine = (line: string): SSEEvent | null => {
  if (!line.trim()) return null;
  
  const colonIndex = line.indexOf(':');
  if (colonIndex === -1) return null;
  
  const field = line.slice(0, colonIndex).trim();
  const value = line.slice(colonIndex + 1).trim();
  
  if (field === 'data') {
    return { data: value };
  }
  
  return null;
};

export const parseStreamChunk = (data: string): Result<StreamChunk, { type: 'PARSE_ERROR'; message: string }> => {
  try {
    const parsed = JSON.parse(data);
    
    // Handle Cloud Assist API response format
    const response = parsed.response || parsed;
    const candidate = response.candidates?.[0];
    
    const chunk: StreamChunk = {
      ...(candidate?.content?.parts?.[0]?.text && {
        text: candidate.content.parts[0].text
      }),
      ...(candidate?.finishReason && {
        finishReason: candidate.finishReason
      }),
      ...(response.usageMetadata && {
        usageMetadata: {
          promptTokenCount: response.usageMetadata.promptTokenCount || 0,
          candidatesTokenCount: response.usageMetadata.candidatesTokenCount || 0,
          totalTokenCount: response.usageMetadata.totalTokenCount || 0
        }
      })
    };
    
    return { ok: true, value: chunk };
  } catch (error) {
    return {
      ok: false,
      error: { type: 'PARSE_ERROR', message: 'Failed to parse stream chunk' }
    };
  }
};