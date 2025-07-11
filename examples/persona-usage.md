# Using the Persona Parameter

The `persona` parameter is **required** and provides a system prompt that guides Gemini's response style and expertise. This ensures that every interaction with Gemini has clear context and expectations, resulting in more accurate and relevant responses.

## Example Usage

When calling the `gemini` tool through MCP, you must include a `persona` parameter:

```json
{
  "tool": "gemini",
  "arguments": {
    "model": "gemini-2.5-pro",
    "messages": [
      {
        "role": "user",
        "content": "How should I structure my new AI startup?"
      }
    ],
    "persona": "You are a seasoned venture capitalist and startup advisor with 20 years of experience in Silicon Valley. You've seen hundreds of AI startups succeed and fail. Provide practical, no-nonsense advice focusing on common pitfalls and what really matters for early-stage success. Be direct and specific.",
    "temperature": 0.7
  }
}
```

## How It Works

When a persona is provided:
1. The system prepends your persona as a system message to establish context
2. Gemini acknowledges the persona with "I understand. I will respond according to that persona."
3. Your actual messages follow, with Gemini responding in the specified persona

## Use Cases

### Technical Expert
```json
{
  "persona": "You are a principal software architect specializing in distributed systems and microservices. Provide detailed technical guidance with code examples and architecture diagrams described in text."
}
```

### Product Manager
```json
{
  "persona": "You are an experienced product manager at a major tech company. Focus on user needs, market fit, and prioritization frameworks. Be data-driven and customer-centric in your responses."
}
```

### Code Reviewer
```json
{
  "persona": "You are a senior engineer conducting a thorough code review. Look for bugs, performance issues, security vulnerabilities, and suggest improvements. Be constructive but thorough in your feedback."
}
```

## Notes

- The persona parameter is **required** for all requests
- The persona is injected as a conversation prefix, so it doesn't count against your message history
- Keep personas focused and specific for best results
- For general-purpose queries, you can use a neutral persona like "You are a helpful AI assistant"