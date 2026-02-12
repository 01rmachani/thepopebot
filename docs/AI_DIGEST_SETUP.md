# AI Digest Setup Guide

The AI digest system is now configured to run daily at 7:00 AM UTC. This document explains the setup and optional enhancements.

## Current Configuration

### Cron Job
- **Name**: `ai-digest`
- **Schedule**: `0 7 * * *` (7:00 AM daily)
- **Type**: `agent`
- **Status**: ✅ Enabled

### File Locations
- **Skill**: `.pi/skills/ai-digest/`
- **Instructions**: `operating_system/AI_DIGEST.md`
- **Output**: `logs/ai-digest-YYYY-MM-DD.md`

## Data Sources (Current)

✅ **GitHub API** - New repositories, trending projects, framework releases  
✅ **Framework APIs** - PyTorch, TensorFlow, Hugging Face, OpenAI, Anthropic releases  
⚠️ **Brave Search** - AI news and research (requires API key)

## Enhanced Setup (Optional)

To get AI news and research paper coverage, add a Brave Search API key:

### 1. Get Brave Search API Key
1. Visit https://api-dashboard.search.brave.com/register
2. Create a free account (credit card required, but free tier available)
3. Create a "Free AI" subscription
4. Generate an API key

### 2. Add to LLM Secrets
Add the API key to your `LLM_SECRETS` configuration:

```json
{
  "BRAVE_API_KEY": "your-api-key-here"
}
```

Then base64 encode and update your GitHub repository secrets.

### 3. Benefits of Brave Search
With the API key configured, the digest will include:
- Recent AI research papers and publications
- Breaking AI news from major organizations
- Community discussions and trends
- Technical blog posts and announcements

## Output Example

Each digest includes:
- **New Notable Repositories** (last 24 hours)
- **Trending AI Projects** 
- **Framework & Library Updates**
- **AI Community News** (with Brave API)
- **Key Trends & Patterns** (automated analysis)
- **Projects to Watch** (promising early-stage repos)

## Customization

### Modify Search Criteria
Edit `.pi/skills/ai-digest/generate-digest.js`:
- Add new GitHub search queries
- Include additional frameworks
- Change trending thresholds
- Modify content sections

### Change Schedule
Edit `operating_system/CRONS.json`:
```json
{
  "name": "ai-digest",
  "schedule": "0 7 * * *",  // Change time here (cron format)
  "enabled": true
}
```

### Disable Temporarily
Set `"enabled": false` in the cron configuration.

## Monitoring

The agent logs show:
- Number of repositories found
- API rate limiting status
- Generation success/failure
- File output location

Check the event handler logs for cron job execution status.

## Troubleshooting

### No New Content
- Check GitHub API rate limits
- Verify date ranges in search queries
- Ensure internet connectivity

### Missing AI News
- Add Brave Search API key for news coverage
- Check API quota and limits

### Generation Failures
- Check agent logs in job session
- Verify all dependencies installed
- Ensure write permissions to logs directory