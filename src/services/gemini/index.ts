import { Result, GeminiError, OAuthError } from '../../types/errors';
import { Message, StreamChunk, GeminiConfig } from '../../types/api';
import { HttpClient, Logger } from '../../types/dependencies';
import { OAuthService } from '../oauth';
import { createGeminiRequest } from './converters';
import { streamCompletion } from './client';
import { discoverProjects } from './project-discovery';

export interface GeminiService {
  readonly generateStream: (
    model: string,
    messages: readonly Message[],
    temperature?: number,
    maxTokens?: number
  ) => AsyncGenerator<Result<StreamChunk, GeminiError | OAuthError>, void, unknown>;
}

export const createGeminiService = (
  oauthService: OAuthService,
  httpClient: HttpClient,
  config: GeminiConfig,
  logger: Logger
): GeminiService => {
  let cachedProjectId: string | undefined;
  
  return {
    generateStream: async function* (
      model: string,
      messages: readonly Message[],
      temperature?: number,
      maxTokens?: number
    ) {
      const tokenResult = await oauthService.getValidToken();
      if (!tokenResult.ok) {
        yield tokenResult;
        return;
      }
      
      // Discover project ID if not cached
      if (!cachedProjectId) {
        logger.info('Discovering project ID');
        const projectResult = await discoverProjects(tokenResult.value.access_token, httpClient);
        if (!projectResult.ok) {
          yield projectResult;
          return;
        }
        cachedProjectId = projectResult.value.projectId;
        logger.info('Project discovered', { projectId: cachedProjectId });
      }
      
      const request = createGeminiRequest(model, messages, temperature, maxTokens);
      const configWithProject: GeminiConfig = {
        ...config,
        projectId: cachedProjectId
      };
      
      let retryCount = 0;
      const maxRetries = 1;
      
      while (retryCount <= maxRetries) {
        const generator = streamCompletion(
          request,
          tokenResult.value.access_token,
          configWithProject,
          httpClient
        );
        
        let hasAuthError = false;
        
        for await (const result of generator) {
          if (!result.ok && result.error.type === 'API_ERROR' && result.error.statusCode === 401) {
            hasAuthError = true;
            break;
          }
          yield result;
        }
        
        if (hasAuthError && retryCount < maxRetries) {
          logger.info('Token expired, refreshing...');
          const refreshResult = await oauthService.refreshToken();
          if (!refreshResult.ok) {
            yield refreshResult;
            return;
          }
          retryCount++;
          continue;
        }
        
        break;
      }
    }
  };
};