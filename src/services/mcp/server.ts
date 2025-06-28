import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { GeminiToolSchema, McpServerConfig } from '../../types/mcp';
import { GeminiService } from '../gemini';
import { Logger } from '../../types/dependencies';
import { validateToolInput } from '../../lib/validators';
import { Message } from '../../types/api';

export const createMcpServer = (
  geminiService: GeminiService,
  config: McpServerConfig,
  logger: Logger
): McpServer => {
  const server = new McpServer({
    name: config.name,
    version: config.version
  }, {
    capabilities: {
      tools: {}
    }
  });
  
  server.tool(
    'gemini',
    'Generate text using Google Gemini models with OAuth authentication',
    GeminiToolSchema.shape,
    async (args) => {
      const validationResult = validateToolInput(args);
      if (!validationResult.ok) {
        return {
          content: [{
            type: 'text',
            text: `Validation error: ${validationResult.error.message}`
          }],
          isError: true
        };
      }
      
      const { model, messages, temperature, maxTokens } = validationResult.value;
      
      const apiMessages: Message[] = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      logger.info('Processing Gemini request', { 
        model, 
        messageCount: messages.length,
        temperature,
        maxTokens
      });
      
      let fullResponse = '';
      let totalTokens = 0;
      
      try {
        for await (const result of geminiService.generateStream(
          model,
          apiMessages,
          temperature,
          maxTokens
        )) {
          if (!result.ok) {
            const error = result.error;
            let errorMessage: string;
            
            switch (error.type) {
              case 'RATE_LIMIT':
                errorMessage = `Rate limit exceeded. Retry after ${error.retryAfter} seconds.`;
                break;
              case 'INVALID_MODEL':
                errorMessage = `Invalid model: ${error.model}. Available models: ${error.available.join(', ')}`;
                break;
              case 'API_ERROR':
                errorMessage = `API error (${error.statusCode}): ${error.message}`;
                break;
              case 'NETWORK_ERROR':
                errorMessage = `Network error: ${error.message}`;
                break;
              case 'CREDENTIALS_NOT_FOUND':
                errorMessage = `OAuth credentials not found at ${error.path}. Please run 'gemini auth' to authenticate.`;
                break;
              case 'TOKEN_EXPIRED':
                errorMessage = `OAuth token expired`;
                break;
              case 'REFRESH_FAILED':
                errorMessage = `Failed to refresh OAuth token: ${error.message}`;
                break;
              case 'PROJECT_DISCOVERY_FAILED':
                errorMessage = `Failed to discover Google Cloud project: ${error.message}. This may indicate expired credentials or changed API endpoints.`;
                break;
              case 'FILE_READ_ERROR':
                errorMessage = `Error reading credentials file: ${error.error}`;
                break;
              case 'INVALID_CREDENTIALS':
                errorMessage = `Invalid credentials format: ${error.reason}`;
                break;
              case 'PARSE_ERROR':
                errorMessage = `Response parsing error: ${error.message}`;
                break;
              default:
                errorMessage = 'An unknown error occurred';
            }
            
            logger.error('Gemini request failed', error);
            
            return {
              content: [{
                type: 'text',
                text: `Error: ${errorMessage}`
              }],
              isError: true
            };
          }
          
          if (result.value.text) {
            fullResponse += result.value.text;
          }
          
          if (result.value.usageMetadata) {
            totalTokens = result.value.usageMetadata.totalTokenCount;
          }
        }
        
        logger.info('Gemini request completed', { totalTokens });
        
        return {
          content: [{
            type: 'text',
            text: fullResponse || 'No response generated'
          }]
        };
      } catch (error) {
        logger.error('Unexpected error', error);
        return {
          content: [{
            type: 'text',
            text: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true
        };
      }
    }
  );
  
  return server;
};