import { z } from 'zod';

export const DEFAULT_MODEL = 'gemini-2.5-pro';

export const GeminiToolSchema = z.object({
  model: z.string().default(DEFAULT_MODEL),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  persona: z.string().describe('System prompt persona to guide Gemini\'s response style and expertise. Best practices: 1) Define specific expertise or role (e.g., "senior DevOps engineer with Kubernetes expertise"), 2) Specify communication style (e.g., "concise and technical" or "detailed with examples"), 3) Include relevant context or constraints (e.g., "focus on production-ready solutions"), 4) Set clear boundaries or perspectives (e.g., "prioritize security and scalability"). A well-crafted persona improves response accuracy, consistency, and relevance by providing clear context and expectations.')
});

export type GeminiToolInput = z.infer<typeof GeminiToolSchema>;

export interface McpServerConfig {
  readonly name: string;
  readonly version: string;
}