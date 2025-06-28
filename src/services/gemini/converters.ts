import { Message, Content, GeminiRequest } from '../../types/api';

export const messageToContent = (message: Message): Content => ({
  role: message.role === 'assistant' ? 'model' : 'user',
  parts: [{ text: message.content }]
});

export const createGeminiRequest = (
  model: string,
  messages: readonly Message[],
  temperature?: number,
  maxTokens?: number
): GeminiRequest => {
  return {
    model,
    contents: messages.map(messageToContent),
    generationConfig: {
      temperature: temperature ?? 0.7,
      maxOutputTokens: maxTokens ?? 8192
    }
  };
};