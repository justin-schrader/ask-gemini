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

### Option 1: Use directly from GitHub (no installation)

Use with npx in your MCP configuration - see usage section below.

### Option 2: Clone and install locally

```bash
# Clone the repository
git clone https://github.com/justin-schrader/ask-gemini.git
cd ask-gemini

# Install globally from local directory
npm install -g .
```

## Prerequisites

You must have authenticated with the Gemini CLI and have valid OAuth credentials at `~/.gemini/oauth_creds.json`.

## Usage

### With Claude Desktop or Claude Code

Add to your Claude Desktop or Claude Code configuration:

#### Option 1: Direct from GitHub (no installation):
```json
{
  "mcpServers": {
    "ask-gemini": {
      "command": "npx",
      "args": ["github:justin-schrader/ask-gemini"]
    }
  }
}
```

#### Option 2: If installed locally:
```json
{
  "mcpServers": {
    "ask-gemini": {
      "command": "ask-gemini-mcp"
    }
  }
}
```

## Models

Default model: `gemini-2.5-pro`

You can use any Gemini model by specifying it in the `model` parameter. Common models include:
- gemini-2.5-pro (default)
- gemini-2.5-flash

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