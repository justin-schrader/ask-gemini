export type OAuthError =
  | { readonly type: 'CREDENTIALS_NOT_FOUND'; readonly path: string }
  | { readonly type: 'INVALID_CREDENTIALS'; readonly reason: string }
  | { readonly type: 'TOKEN_EXPIRED'; readonly expiry: number }
  | { readonly type: 'REFRESH_FAILED'; readonly statusCode: number; readonly message: string }
  | { readonly type: 'FILE_READ_ERROR'; readonly path: string; readonly error: string };

export type GeminiError =
  | { readonly type: 'RATE_LIMIT'; readonly retryAfter: number }
  | { readonly type: 'INVALID_MODEL'; readonly model: string; readonly available: readonly string[] }
  | { readonly type: 'API_ERROR'; readonly statusCode: number; readonly message: string }
  | { readonly type: 'NETWORK_ERROR'; readonly message: string }
  | { readonly type: 'PARSE_ERROR'; readonly message: string }
  | { readonly type: 'PROJECT_DISCOVERY_FAILED'; readonly message: string };

export type McpError =
  | { readonly type: 'INVALID_PARAMETERS'; readonly message: string }
  | { readonly type: 'TOOL_NOT_FOUND'; readonly tool: string }
  | { readonly type: 'TRANSPORT_ERROR'; readonly message: string };

export type Result<T, E> = 
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };