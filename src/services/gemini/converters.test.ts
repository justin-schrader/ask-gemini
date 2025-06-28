import { describe, it, expect } from 'vitest';
import { messageToContent, createGeminiRequest } from './converters';
import { Message } from '../../types/api';

describe('messageToContent', () => {
  it('converts user message correctly', () => {
    const message: Message = {
      role: 'user',
      content: 'Hello, world!'
    };
    
    const result = messageToContent(message);
    expect(result).toEqual({
      role: 'user',
      parts: [{ text: 'Hello, world!' }]
    });
  });
  
  it('converts assistant message to model role', () => {
    const message: Message = {
      role: 'assistant',
      content: 'Hi there!'
    };
    
    const result = messageToContent(message);
    expect(result).toEqual({
      role: 'model',
      parts: [{ text: 'Hi there!' }]
    });
  });
});

describe('createGeminiRequest', () => {
  it('creates basic request without optional parameters', () => {
    const messages: Message[] = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi' }
    ];
    
    const result = createGeminiRequest('gemini-1.5-pro', messages);
    expect(result).toEqual({
      model: 'gemini-1.5-pro',
      contents: [
        { role: 'user', parts: [{ text: 'Hello' }] },
        { role: 'model', parts: [{ text: 'Hi' }] }
      ]
    });
  });
  
  it('includes generation config when optional parameters provided', () => {
    const messages: Message[] = [
      { role: 'user', content: 'Test' }
    ];
    
    const result = createGeminiRequest('gemini-1.5-pro', messages, 0.7, 1000);
    expect(result).toEqual({
      model: 'gemini-1.5-pro',
      contents: [
        { role: 'user', parts: [{ text: 'Test' }] }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000
      }
    });
  });
});