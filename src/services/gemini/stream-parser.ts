import { parseSSELine, parseStreamChunk } from '../../lib/parsers';
import { StreamChunk } from '../../types/api';

export async function* parseSSEStream(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<StreamChunk, void, unknown> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      buffer = lines[lines.length - 1] || '';
      
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i]?.trim();
        if (!line) continue;
        
        const event = parseSSELine(line);
        if (!event) continue;
        
        const chunkResult = parseStreamChunk(event.data);
        if (chunkResult.ok) {
          yield chunkResult.value;
        }
      }
    }
    
    if (buffer) {
      const event = parseSSELine(buffer);
      if (event) {
        const chunkResult = parseStreamChunk(event.data);
        if (chunkResult.ok) {
          yield chunkResult.value;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}