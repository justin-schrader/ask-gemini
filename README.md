# Gemini OAuth MCP Server

An MCP (Model Context Protocol) server that provides access to Google Gemini models using OAuth tokens from the Gemini CLI.

## ⚠️ Experimental

This server uses Google's internal Cloud Assist API with OAuth tokens from the Gemini CLI. This approach is based on the implementation in Cline and the Gemini CLI itself, but may be subject to changes as it uses internal APIs.

## Features

- Uses existing OAuth credentials from `~/.gemini/oauth_creds.json`
- Supports Gemini 2.5 models (2.5-pro, 2.5-flash)
- Automatic token refresh
- Streaming responses
- Designed for Google Cloud Assist API access

## Installation

```bash
npm install -g ask-gemini
```

## Prerequisites

You must have authenticated with the Gemini CLI and have valid OAuth credentials at `~/.gemini/oauth_creds.json`.

## Usage

### With Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "ask-gemini": {
      "command": "ask-gemini-mcp"
    }
  }
}
```

### With other MCP clients

```bash
ask-gemini-mcp
```

## Models

Default model: `gemini-2.5-pro`

You can use any Gemini model by specifying it in the `model` parameter. Common models include:
- gemini-2.5-pro (default)
- gemini-2.5-flash
- gemini-2.0-flash-exp
- gemini-1.5-pro
- gemini-1.5-flash

Note: If an invalid model is specified, the API will return an error.

## Tool Schema

The server exposes a single tool named `gemini` with the following parameters:

- `model` (optional): The Gemini model to use (default: "gemini-2.5-pro")
- `messages` (required): Array of message objects with `role` and `content`
- `temperature` (optional): Sampling temperature (0-2)
- `maxTokens` (optional): Maximum output tokens

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Type check
npm run typecheck
```

## License

MIT