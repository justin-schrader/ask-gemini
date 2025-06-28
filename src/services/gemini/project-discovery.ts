import { Result, GeminiError } from '../../types/errors';
import { ProjectInfo } from '../../types/api';
import { HttpClient } from '../../types/dependencies';

export const discoverProjects = async (
  accessToken: string,
  httpClient: HttpClient
): Promise<Result<ProjectInfo, GeminiError>> => {
  try {
    const initialProjectId = 'default';
    const clientMetadata = {
      ideType: 'IDE_UNSPECIFIED',
      platform: 'PLATFORM_UNSPECIFIED',
      pluginType: 'GEMINI',
      duetProject: initialProjectId
    };
    
    // First try loadCodeAssist
    const loadUrl = 'https://cloudcode-pa.googleapis.com/v1internal:loadCodeAssist';
    console.error('[gemini-mcp] DEBUG: Attempting loadCodeAssist at:', loadUrl);
    
    const loadRequest = {
      cloudaicompanionProject: initialProjectId,
      metadata: clientMetadata
    };
    
    const response = await httpClient.post(
      loadUrl,
      JSON.stringify(loadRequest),
      {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    );
    
    console.error('[gemini-mcp] DEBUG: loadCodeAssist response status:', response.status);
    
    if (response.status !== 200) {
      const text = await response.text();
      console.error('[gemini-mcp] DEBUG: loadCodeAssist error response:', text);
      return {
        ok: false,
        error: {
          type: 'PROJECT_DISCOVERY_FAILED',
          message: `Failed to load projects: ${response.status} - ${text}`
        }
      };
    }
    
    const data = await response.json() as any;
    console.error('[gemini-mcp] DEBUG: loadCodeAssist response:', JSON.stringify(data, null, 2));
    
    // Check if we already have a project ID
    if (data.cloudaicompanionProject) {
      return {
        ok: true,
        value: {
          projectId: data.cloudaicompanionProject,
          displayName: data.cloudaicompanionProject
        }
      };
    }
    
    // If no existing project, we need to onboard
    const defaultTier = data.allowedTiers?.find((tier: any) => tier.isDefault);
    const tierId = defaultTier?.id || 'free-tier';
    
    const onboardUrl = 'https://cloudcode-pa.googleapis.com/v1internal:onboardUser';
    console.error('[gemini-mcp] DEBUG: Attempting onboardUser at:', onboardUrl);
    
    const onboardRequest = {
      tierId: tierId,
      cloudaicompanionProject: initialProjectId,
      metadata: clientMetadata
    };
    
    const onboardResponse = await httpClient.post(
      onboardUrl,
      JSON.stringify(onboardRequest),
      {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    );
    
    console.error('[gemini-mcp] DEBUG: onboardUser response status:', onboardResponse.status);
    
    if (onboardResponse.status !== 200) {
      const text = await onboardResponse.text();
      console.error('[gemini-mcp] DEBUG: onboardUser error response:', text);
      return {
        ok: false,
        error: {
          type: 'PROJECT_DISCOVERY_FAILED',
          message: `Onboarding failed: ${onboardResponse.status} - ${text}`
        }
      };
    }
    
    const onboardData = await onboardResponse.json() as any;
    console.error('[gemini-mcp] DEBUG: onboardUser response:', JSON.stringify(onboardData, null, 2));
    
    // Check if operation is complete
    if (onboardData.done) {
      const discoveredProjectId = onboardData.response?.cloudaicompanionProject?.id || initialProjectId;
      return {
        ok: true,
        value: {
          projectId: discoveredProjectId,
          displayName: discoveredProjectId
        }
      };
    }
    
    // For now, just use the default project ID
    return {
      ok: true,
      value: {
        projectId: initialProjectId,
        displayName: initialProjectId
      }
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        type: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network error'
      }
    };
  }
};