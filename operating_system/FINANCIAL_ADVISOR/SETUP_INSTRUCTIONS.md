# Financial Advisor Setup Instructions

This document explains how to configure the Financial Advisor agent for daily market research.

## Required Setup

### 1. Brave Search API Key

The financial advisor uses the Brave Search API to gather current market data. You'll need:

1. **Create Brave Search Account:**
   - Go to https://api-dashboard.search.brave.com/register
   - Sign up for a free account
   - You'll need to provide a credit card for verification (no charges on free tier)

2. **Get Free Subscription:**
   - Create a "Free AI" subscription in the dashboard
   - This provides 2,000 free queries per month

3. **Generate API Key:**
   - Create an API key for your subscription
   - Copy the key (format: `BSA...`)

4. **Add to LLM_SECRETS:**
   ```json
   {
     "BRAVE_API_KEY": "BSA_your_actual_api_key_here"
   }
   ```

### 2. Encode and Set LLM_SECRETS

If you don't already have LLM_SECRETS configured:

```bash
# Create your secrets JSON
echo '{"BRAVE_API_KEY":"BSA_your_actual_api_key_here"}' > secrets.json

# Encode to base64
LLM_SECRETS=$(cat secrets.json | base64 -w 0)

# Set as repository secret or environment variable
gh secret set LLM_SECRETS --body "$LLM_SECRETS"
```

If you already have LLM_SECRETS, add the BRAVE_API_KEY to your existing JSON.

### 3. Test the Setup

Once configured, test with:

```bash
# Test API access
cd /job/.pi/skills/brave-search
./search.js "stock market today" --freshness pd -n 3

# Run financial advisor manually
# (Create a job with: "Read the file at operating_system/FINANCIAL_ADVISOR/FINANCIAL_ADVISOR.md and complete the tasks described there.")
```

## Schedule Daily Reports

Add to your `operating_system/CRONS.json`:

```json
{
  "name": "daily-financial-report",
  "schedule": "0 13 * * 1-5",
  "type": "agent",
  "job": "Read the file at operating_system/FINANCIAL_ADVISOR/FINANCIAL_ADVISOR.md and complete the tasks described there.",
  "enabled": true
}
```

This runs at 13:00 UTC (6:00 AM Pacific / 9:00 AM Eastern) on weekdays, just before market open.

## What the Agent Does

Once configured, the financial advisor will:

1. **Search for current market data** across multiple categories:
   - Major US indices (S&P 500, Dow, Nasdaq, Russell 2000)
   - Global markets (Asia-Pacific, Europe)
   - Treasury yields and Federal Reserve data
   - Commodities (Oil, Gold, Silver, Natural Gas)
   - Currency rates (Dollar Index, major pairs)
   - Sector performance and earnings

2. **Generate structured report** using the template at:
   `operating_system/FINANCIAL_ADVISOR/FINANCIAL_REPORT_TEMPLATE.md`

3. **Save daily report** to:
   `operating_system/FINANCIAL_ADVISOR/FINANCIAL_REPORT.md`

## Report Features

- **Real-time data**: Searches for data from the past 24 hours
- **Comprehensive coverage**: Markets, bonds, commodities, currencies
- **Professional format**: Tables, sections, key highlights
- **Accuracy focus**: Only reports verified data, flags stale information
- **Legal disclaimer**: Includes required investment disclaimer

## Troubleshooting

### "BRAVE_API_KEY environment variable is required"
- Check that LLM_SECRETS contains BRAVE_API_KEY
- Verify the base64 encoding is correct
- Ensure the API key is valid and subscription is active

### "Failed to fetch results"
- Check API key is valid in Brave dashboard
- Verify you haven't exceeded monthly quota (2,000 free queries)
- Try a simpler search query to test connectivity

### Stale or missing data
- Financial markets are closed on weekends/holidays
- Some data may have delayed reporting
- The agent will flag when data appears outdated

## Cost and Limits

- **Brave Search**: 2,000 free queries/month (about 65 per day)
- **LLM Usage**: ~10-15 minutes per daily report generation
- **GitHub Actions**: Minimal usage for job execution

The daily financial report typically uses 6-10 search queries, so you can run it daily with room for manual testing.