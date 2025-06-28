import * as fs from 'fs/promises';
import { FileSystem, HttpClient, Logger } from '../types/dependencies';

export const createFileSystem = (): FileSystem => ({
  exists: async (filePath: string) => {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  },
  readFile: async (filePath: string, encoding: 'utf-8') => {
    return await fs.readFile(filePath, encoding);
  },
  writeFile: async (filePath: string, content: string, encoding: 'utf-8') => {
    await fs.writeFile(filePath, content, encoding);
  }
});

export const createHttpClient = (): HttpClient => ({
  post: async (url: string, data: unknown, headers: Record<string, string>) => {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: typeof data === 'string' ? data : JSON.stringify(data)
    });
    
    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: response.body!,
      text: () => response.text(),
      json: () => response.json()
    };
  },
  
  get: async (url: string, headers: Record<string, string>) => {
    const response = await fetch(url, {
      method: 'GET',
      headers
    });
    
    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: response.body!,
      text: () => response.text(),
      json: () => response.json()
    };
  }
});

export const createLogger = (prefix = '[gemini-mcp]'): Logger => ({
  debug: (message: string, data?: unknown) => {
    if (process.env.DEBUG) {
      console.error(`${prefix} DEBUG: ${message}`, data || '');
    }
  },
  info: (message: string, data?: unknown) => {
    console.error(`${prefix} INFO: ${message}`, data || '');
  },
  warn: (message: string, data?: unknown) => {
    console.error(`${prefix} WARN: ${message}`, data || '');
  },
  error: (message: string, error?: unknown) => {
    console.error(`${prefix} ERROR: ${message}`, error || '');
  }
});