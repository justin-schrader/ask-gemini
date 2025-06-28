export interface FileSystem {
  readonly exists: (path: string) => Promise<boolean>;
  readonly readFile: (path: string, encoding: 'utf-8') => Promise<string>;
  readonly writeFile: (path: string, content: string, encoding: 'utf-8') => Promise<void>;
}

export interface HttpClient {
  readonly post: (url: string, data: unknown, headers: Record<string, string>) => Promise<HttpResponse>;
  readonly get: (url: string, headers: Record<string, string>) => Promise<HttpResponse>;
}

export interface HttpResponse {
  readonly status: number;
  readonly headers: Record<string, string>;
  readonly body: ReadableStream<Uint8Array>;
  readonly text: () => Promise<string>;
  readonly json: () => Promise<unknown>;
}

export interface Logger {
  readonly debug: (message: string, data?: unknown) => void;
  readonly info: (message: string, data?: unknown) => void;
  readonly warn: (message: string, data?: unknown) => void;
  readonly error: (message: string, error?: unknown) => void;
}