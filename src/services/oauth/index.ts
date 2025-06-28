import { Result, OAuthError } from '../../types/errors';
import { OAuthCredentials, OAuthConfig } from '../../types/oauth';
import { FileSystem, HttpClient, Logger } from '../../types/dependencies';
import {
  loadCredentials,
  validateCredentials,
  refreshToken,
  saveRefreshedToken
} from './token-service';

export interface OAuthService {
  readonly getValidToken: () => Promise<Result<OAuthCredentials, OAuthError>>;
  readonly refreshToken: () => Promise<Result<OAuthCredentials, OAuthError>>;
}

export const createOAuthService = (
  config: OAuthConfig,
  fs: FileSystem,
  httpClient: HttpClient,
  logger: Logger
): OAuthService => {
  let cachedCredentials: OAuthCredentials | undefined;
  
  return {
    getValidToken: async () => {
      if (cachedCredentials) {
        const validationResult = validateCredentials(cachedCredentials, Date.now());
        if (validationResult.ok) {
          return validationResult;
        }
        logger.info('Cached token expired');
      }
      
      const loadResult = await loadCredentials(config.credentialsPath, fs);
      if (!loadResult.ok) {
        return loadResult;
      }
      
      const validationResult = validateCredentials(loadResult.value, Date.now());
      if (validationResult.ok) {
        cachedCredentials = validationResult.value;
        return validationResult;
      }
      
      logger.info('Token expired, refreshing...');
      const refreshResult = await refreshToken(loadResult.value, config, httpClient);
      if (!refreshResult.ok) {
        return refreshResult;
      }
      
      const saveResult = await saveRefreshedToken(
        config.credentialsPath,
        loadResult.value,
        refreshResult.value,
        fs
      );
      
      if (saveResult.ok) {
        cachedCredentials = saveResult.value;
      }
      
      return saveResult;
    },
    
    refreshToken: async () => {
      const loadResult = await loadCredentials(config.credentialsPath, fs);
      if (!loadResult.ok) {
        return loadResult;
      }
      
      const refreshResult = await refreshToken(loadResult.value, config, httpClient);
      if (!refreshResult.ok) {
        return refreshResult;
      }
      
      const saveResult = await saveRefreshedToken(
        config.credentialsPath,
        loadResult.value,
        refreshResult.value,
        fs
      );
      
      if (saveResult.ok) {
        cachedCredentials = saveResult.value;
      }
      
      return saveResult;
    }
  };
};