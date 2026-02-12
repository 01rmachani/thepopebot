# Daily AI Digest Generation Task

You are tasked with generating a comprehensive daily digest of open-source AI developments.

## Objective

Create a 500-word markdown digest covering the latest developments in the AI/ML open-source ecosystem, formatted for easy reading and reference.

## Instructions

1. **Use the AI Digest Skill**
   - Navigate to `/job/.pi/skills/ai-digest/`
   - Execute: `./generate-digest.js`
   - This will automatically generate the digest for the current date

2. **Content Requirements**
   The generated digest should include:
   - **New Repositories**: AI/ML repos created in the last 24 hours with notable descriptions
   - **Trending Projects**: Popular and recently updated repositories
   - **Framework Updates**: Recent releases from PyTorch, TensorFlow, Hugging Face, OpenAI, etc.
   - **Community News**: AI research papers, announcements, breakthroughs
   - **Trends Analysis**: Programming languages, topics, and patterns
   - **Watch List**: Promising early-stage projects worth monitoring

3. **Output Format**
   - File: `logs/ai-digest-YYYY-MM-DD.md`
   - Clean markdown with proper headings and sections
   - GitHub links for all repositories
   - Star counts and repository metrics
   - Publication date and generation timestamp

4. **Data Sources**
   The skill automatically searches:
   - GitHub API for repository data and releases
   - Brave Search API for AI news and research (if configured)
   - Framework release APIs for update information

## Success Criteria

- ✅ Digest file created in logs directory with correct date format
- ✅ All sections populated with relevant content
- ✅ Proper markdown formatting and GitHub links
- ✅ Generation statistics logged to console
- ✅ File contains 400-600 words of substantive content

## Notes

- The skill handles rate limiting and API quotas automatically
- If Brave Search API is not available, it will skip web search gracefully
- The digest includes trend analysis and pattern recognition
- Failed API calls are logged but don't stop generation

## Expected Runtime

2-5 minutes depending on API response times and content volume.