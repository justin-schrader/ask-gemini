#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createFileSystem, createHttpClient, createLogger } from './lib/dependencies';
import { createOAuthService } from './services/oauth';
import { createGeminiService } from './services/gemini';
import { createMcpServer } from './services/mcp';
import { OAuthConfig } from './types/oauth';
import { GeminiConfig } from './types/api';
import { McpServerConfig } from './types/mcp';

async function main() {
  const logger = createLogger();
  
  try {
    const fs = createFileSystem();
    const httpClient = createHttpClient();
    
    const oauthConfig: OAuthConfig = {
      clientId: '681255809395-oo8ft2oprdrnp9e3aqf6av3hmdib135j.apps.googleusercontent.com',
      clientSecret: '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',
      credentialsPath: '~/.gemini/oauth_creds.json'
    };
    
    const geminiConfig: GeminiConfig = {
      endpoint: 'https://cloudcode-pa.googleapis.com/v1internal'
    };
    
    const mcpConfig: McpServerConfig = {
      name: 'ask-gemini',
      version: '0.1.0'
    };
    
    const oauthService = createOAuthService(oauthConfig, fs, httpClient, logger);
    const geminiService = createGeminiService(oauthService, httpClient, geminiConfig, logger);
    const mcpServer = createMcpServer(geminiService, mcpConfig, logger);
    
    const transport = new StdioServerTransport();
    
    logger.info('Starting Gemini MCP server...');
    await mcpServer.server.connect(transport);
    logger.info('Server started successfully');
    
    process.on('SIGINT', async () => {
      logger.info('Shutting down...');
      await mcpServer.server.close();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      logger.info('Shutting down...');
      await mcpServer.server.close();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

main().catch(console.error);