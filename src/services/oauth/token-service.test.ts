import { describe, it, expect } from 'vitest';
import { validateCredentials } from './token-service';
import { OAuthCredentials } from '../../types/oauth';

describe('validateCredentials', () => {
  it('accepts valid credentials with future expiry', () => {
    const creds: OAuthCredentials = {
      access_token: 'test-token',
      refresh_token: 'refresh-token',
      expiry_date: Date.now() + 3600000, // 1 hour from now
      scope: 'test-scope',
      token_type: 'Bearer'
    };
    
    const result = validateCredentials(creds, Date.now());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual(creds);
    }
  });
  
  it('returns error for expired credentials', () => {
    const creds: OAuthCredentials = {
      access_token: 'test-token',
      refresh_token: 'refresh-token',
      expiry_date: Date.now() - 3600000, // 1 hour ago
      scope: 'test-scope',
      token_type: 'Bearer'
    };
    
    const result = validateCredentials(creds, Date.now());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('TOKEN_EXPIRED');
      expect(result.error.expiry).toBe(creds.expiry_date);
    }
  });
});