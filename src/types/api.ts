export interface GeminiRequest {
  readonly model: string;
  readonly contents: readonly Content[];
  readonly generationConfig?: GenerationConfig;
}

export interface Content {
  readonly role: 'user' | 'model';
  readonly parts: readonly Part[];
}

export interface Part {
  readonly text: string;
}

export interface GenerationConfig {
  readonly temperature?: number;
  readonly maxOutputTokens?: number;
  readonly topP?: number;
  readonly topK?: number;
}

export interface Message {
  readonly role: 'user' | 'assistant';
  readonly content: string;
}

export interface StreamChunk {
  readonly text?: string;
  readonly usageMetadata?: UsageMetadata;
  readonly finishReason?: string;
}

export interface UsageMetadata {
  readonly promptTokenCount: number;
  readonly candidatesTokenCount: number;
  readonly totalTokenCount: number;
}

export interface GeminiConfig {
  readonly endpoint: string;
  readonly projectId?: string;
}

export interface ProjectInfo {
  readonly projectId: string;
  readonly displayName: string;
}

export interface SSEEvent {
  readonly data: string;
  readonly event?: string;
  readonly id?: string;
}