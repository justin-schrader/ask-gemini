import { z } from 'zod';

export const DEFAULT_MODEL = 'gemini-2.5-pro';

export const GeminiToolSchema = z.object({
  model: z.string().default(DEFAULT_MODEL),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional()
});

export type GeminiToolInput = z.infer<typeof GeminiToolSchema>;

export interface McpServerConfig {
  readonly name: string;
  readonly version: string;
}