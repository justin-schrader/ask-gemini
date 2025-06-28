import { describe, it, expect } from 'vitest';
import { parseCredentials, parseSSELine, parseStreamChunk } from './parsers';

describe('parseCredentials', () => {
  it('parses valid OAuth credentials', () => {
    const validCreds = JSON.stringify({
      access_token: 'test-token',
      refresh_token: 'refresh-token',
      expiry_date: 1234567890,
      scope: 'test-scope',
      token_type: 'Bearer'
    });
    
    const result = parseCredentials(validCreds);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.access_token).toBe('test-token');
      expect(result.value.refresh_token).toBe('refresh-token');
      expect(result.value.expiry_date).toBe(1234567890);
    }
  });
  
  it('returns error for invalid JSON', () => {
    const result = parseCredentials('invalid json');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('INVALID_CREDENTIALS');
      expect(result.error.reason).toBe('Invalid JSON format');
    }
  });
  
  it('returns error for missing fields', () => {
    const invalidCreds = JSON.stringify({
      access_token: 'test-token'
    });
    
    const result = parseCredentials(invalidCreds);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('INVALID_CREDENTIALS');
      expect(result.error.reason).toBe('Missing required fields');
    }
  });
});

describe('parseSSELine', () => {
  it('parses data line correctly', () => {
    const result = parseSSELine('data: {"test": "value"}');
    expect(result).toEqual({ data: '{"test": "value"}' });
  });
  
  it('returns null for empty lines', () => {
    const result = parseSSELine('');
    expect(result).toBeNull();
  });
  
  it('returns null for lines without colon', () => {
    const result = parseSSELine('invalid line');
    expect(result).toBeNull();
  });
});

describe('parseStreamChunk', () => {
  it('parses text response correctly', () => {
    const data = JSON.stringify({
      candidates: [{
        content: {
          parts: [{
            text: 'Hello, world!'
          }]
        }
      }]
    });
    
    const result = parseStreamChunk(data);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.text).toBe('Hello, world!');
    }
  });
  
  it('parses usage metadata correctly', () => {
    const data = JSON.stringify({
      usageMetadata: {
        promptTokenCount: 10,
        candidatesTokenCount: 20,
        totalTokenCount: 30
      }
    });
    
    const result = parseStreamChunk(data);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.usageMetadata).toEqual({
        promptTokenCount: 10,
        candidatesTokenCount: 20,
        totalTokenCount: 30
      });
    }
  });
  
  it('returns error for invalid JSON', () => {
    const result = parseStreamChunk('invalid json');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('PARSE_ERROR');
    }
  });
});