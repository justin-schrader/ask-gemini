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
    `**Tool: Gemini Text Generation**

**Function:** Stateless, single-shot text generation using Google Gemini models. Each API call is an independent transaction.

**Agent Workflow Guidance:**
*   **Single-Shot Nature:** This tool executes one-shot generation. It has no memory of past requests.
*   **Complex Task Handling:** For multi-step tasks (e.g., extract, then analyze, then summarize), the agent MUST chain multiple, independent calls to this tool. Do NOT combine multiple complex steps into a single request.
*   **Long Context:** For prompts containing large data blocks (e.g., a long document), the data block MUST be placed before the primary instruction or query.

---

**Parameter: \`persona\`**

The \`persona\` parameter is a mandatory system prompt that dictates all model behavior. It must adhere to the following specification.

**Persona Specification:**

**1. Core Principles:**
*   **ROLE_AND_GOAL:** Must define a specific, detailed role for the AI and a clear objective.
    *   *Example:* "You are a senior Go developer reviewing code for concurrency issues. Your goal is to identify race conditions and explain them."
*   **SEQUENCED_INSTRUCTIONS:** Must provide a numbered list of steps for the model to follow for task execution.
    *   *Example:* "1. Identify all imported libraries in the code. 2. For each library, list its function. 3. Output as a markdown table."
*   **FORMAT_AND_TONE:** Must specify the exact output format (e.g., JSON, XML) and response style. State rationale if it affects parsing.
    *   *Example:* "Output MUST be a single, valid JSON object without any surrounding text or markdown, as it will be consumed by a parser."

**2. Advanced Structural Patterns:**
*   **STRUCTURED_PROMPT_XML:** For prompts with multiple components, each component MUST be wrapped in descriptive XML tags.
    *   *Example Persona Structure:*
        \`\`\`xml
        <instructions>Analyze the <document> to answer the <query>.</instructions>
        <document>The Alani bird is a species native to the northern islands.</document>
        \`\`\`
        The agent then provides the user's question in the 'messages' array, wrapped in the corresponding tag: \`<query>Where is the Alani bird from?</query>\`
*   **CHAIN_OF_THOUGHT (CoT):** To improve reasoning on complex tasks, instruct the model to perform its step-by-step analysis within \`<thinking>\` tags before providing the final, concise answer in \`<answer>\` tags. The model will output both.
    *   *Example Persona Instruction:*
        \`\`\`
        <instructions>First, reason in <thinking> tags. Then, provide the final answer in <answer> tags.</instructions>
        \`\`\`
*   **FEW_SHOT_EXAMPLES:** To enforce a specific, non-obvious output format, provide 2-5 examples within the persona. Each example must be wrapped in \`<example>\` tags, with \`<input>\` and \`<output>\` tags inside.
    *   *Example Persona Structure:*
        \`\`\`xml
        <instructions>Classify the user's sentiment.</instructions>
        <example><input>This is fantastic!</input><output>Positive</output></example>
        <example><input>This is terrible.</input><output>Negative</output></example>
        \`\`\`
`,
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
      
      const { model, messages, temperature, maxTokens, persona } = validationResult.value;
      
      let apiMessages: Message[] = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Prepend persona as a system message
      apiMessages = [
        { role: 'user', content: persona },
        ...apiMessages
      ];
      
      logger.info('Processing Gemini request', { 
        model, 
        messageCount: messages.length,
        temperature,
        maxTokens,
        persona: persona.substring(0, 50) + '...'
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