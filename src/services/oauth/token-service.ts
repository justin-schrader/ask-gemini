import { Result, OAuthError } from '../../types/errors';
import { OAuthCredentials, OAuthConfig, RefreshedToken } from '../../types/oauth';
import { FileSystem, HttpClient } from '../../types/dependencies';
import { parseCredentials } from '../../lib/parsers';
import * as path from 'path';
import * as os from 'os';

export const loadCredentials = async (
  credentialsPath: string,
  fs: FileSystem
): Promise<Result<OAuthCredentials, OAuthError>> => {
  const fullPath = credentialsPath.startsWith('~') 
    ? path.join(os.homedir(), credentialsPath.slice(1))
    : credentialsPath;
    
  const exists = await fs.exists(fullPath);
  if (!exists) {
    return { ok: false, error: { type: 'CREDENTIALS_NOT_FOUND', path: fullPath } };
  }
  
  try {
    const content = await fs.readFile(fullPath, 'utf-8');
    return parseCredentials(content);
  } catch (error) {
    return {
      ok: false,
      error: {
        type: 'FILE_READ_ERROR',
        path: fullPath,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
};

export const validateCredentials = (
  creds: OAuthCredentials,
  currentTime: number
): Result<OAuthCredentials, OAuthError> => {
  if (creds.expiry_date <= currentTime) {
    return { ok: false, error: { type: 'TOKEN_EXPIRED', expiry: creds.expiry_date } };
  }
  return { ok: true, value: creds };
};

export const refreshToken = async (
  creds: OAuthCredentials,
  config: OAuthConfig,
  httpClient: HttpClient
): Promise<Result<RefreshedToken, OAuthError>> => {
  const params = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: creds.refresh_token,
    grant_type: 'refresh_token'
  });
  
  try {
    const response = await httpClient.post(
      'https://oauth2.googleapis.com/token',
      params.toString(),
      {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    );
    
    if (response.status !== 200) {
      const text = await response.text();
      return {
        ok: false,
        error: {
          type: 'REFRESH_FAILED',
          statusCode: response.status,
          message: text
        }
      };
    }
    
    const data = await response.json() as any;
    
    return {
      ok: true,
      value: {
        access_token: data.access_token,
        expiry_date: Date.now() + (data.expires_in * 1000)
      }
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        type: 'REFRESH_FAILED',
        statusCode: 0,
        message: error instanceof Error ? error.message : 'Network error'
      }
    };
  }
};

export const saveRefreshedToken = async (
  credentialsPath: string,
  oldCreds: OAuthCredentials,
  refreshed: RefreshedToken,
  fs: FileSystem
): Promise<Result<OAuthCredentials, OAuthError>> => {
  const fullPath = credentialsPath.startsWith('~') 
    ? path.join(os.homedir(), credentialsPath.slice(1))
    : credentialsPath;
    
  const newCreds: OAuthCredentials = {
    ...oldCreds,
    access_token: refreshed.access_token,
    expiry_date: refreshed.expiry_date
  };
  
  try {
    await fs.writeFile(fullPath, JSON.stringify(newCreds, null, 2), 'utf-8');
    return { ok: true, value: newCreds };
  } catch (error) {
    return {
      ok: false,
      error: {
        type: 'FILE_READ_ERROR',
        path: fullPath,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
};