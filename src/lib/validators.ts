import { Result } from '../types/errors';
import { GeminiToolInput } from '../types/mcp';
import { GeminiToolSchema } from '../types/mcp';

export const validateToolInput = (input: unknown): Result<GeminiToolInput, { type: 'VALIDATION_ERROR'; message: string }> => {
  const result = GeminiToolSchema.safeParse(input);
  
  if (!result.success) {
    return {
      ok: false,
      error: {
        type: 'VALIDATION_ERROR',
        message: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      }
    };
  }
  
  return { ok: true, value: result.data };
};