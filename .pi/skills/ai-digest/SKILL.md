---
name: ai-digest
description: Generate comprehensive daily Open-Source AI digest by researching GitHub repositories, framework updates, and AI community developments.
---

# AI Digest Generator

Generate a comprehensive daily digest of open-source AI developments including:
- New GitHub repositories in AI/ML space
- Trending repositories and their key features
- Framework and library updates
- Notable trends and patterns
- Promising early-stage projects

## Usage

```bash
{baseDir}/generate-digest.js [date]
```

- `date` (optional): YYYY-MM-DD format. Defaults to current date.

## Output

Creates a markdown file at `logs/ai-digest-YYYY-MM-DD.md` with:
- Publication date and time
- New notable repositories with descriptions and metrics
- Major framework/library updates
- Trending projects analysis
- Community trends and patterns
- Projects to watch
- Proper GitHub links for all mentioned repositories

## Dependencies

- Brave Search API (for web research)
- GitHub API access (for repository data)
- Internet connectivity

## Data Sources

1. **GitHub API**: New repositories, trending data, releases
2. **Web Search**: AI news, research papers, announcements
3. **Framework Monitoring**: PyTorch, TensorFlow, Hugging Face updates
4. **Organization Tracking**: OpenAI, Anthropic, Google AI, Meta AI releases