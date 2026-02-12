#!/usr/bin/env node

import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { format, subDays } from 'date-fns';

const GITHUB_API_BASE = 'https://api.github.com';
const BRAVE_SEARCH_API_BASE = 'https://api.search.brave.com/res/v1/web/search';

class AIDigestGenerator {
    constructor() {
        this.braveApiKey = process.env.BRAVE_API_KEY;
        this.githubToken = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
        this.today = new Date();
        this.yesterday = subDays(this.today, 1);
        
        // Initialize GitHub API client
        this.githubHeaders = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'thepopebot-ai-digest'
        };
        if (this.githubToken) {
            this.githubHeaders['Authorization'] = `token ${this.githubToken}`;
        }
    }

    async searchGitHub(query, sort = 'stars', order = 'desc', per_page = 10) {
        try {
            const url = `${GITHUB_API_BASE}/search/repositories`;
            const response = await axios.get(url, {
                headers: this.githubHeaders,
                params: { q: query, sort, order, per_page }
            });
            return response.data.items || [];
        } catch (error) {
            console.error(`GitHub search error for "${query}":`, error.message);
            return [];
        }
    }

    async searchWeb(query, freshness = 'pd') {
        if (!this.braveApiKey) {
            console.warn('BRAVE_API_KEY not available - skipping web search for:', query);
            return [];
        }

        try {
            const response = await axios.get(BRAVE_SEARCH_API_BASE, {
                headers: {
                    'X-Subscription-Token': this.braveApiKey,
                    'Accept': 'application/json'
                },
                params: {
                    q: query,
                    freshness,
                    count: 5,
                    summary: true
                }
            });
            return response.data.web?.results || [];
        } catch (error) {
            console.error(`Web search error for "${query}":`, error.message);
            return [];
        }
    }

    async getNewAIRepositories() {
        console.log('🔍 Searching for new AI repositories...');
        const yesterday = format(this.yesterday, 'yyyy-MM-dd');
        
        const queries = [
            `artificial intelligence created:>${yesterday}`,
            `machine learning created:>${yesterday}`,
            `deep learning created:>${yesterday}`,
            `neural network created:>${yesterday}`,
            `computer vision created:>${yesterday}`,
            `natural language processing created:>${yesterday}`,
            `llm created:>${yesterday}`,
            `transformer created:>${yesterday}`
        ];

        const allRepos = [];
        for (const query of queries) {
            const repos = await this.searchGitHub(query, 'stars', 'desc', 5);
            allRepos.push(...repos);
            await this.delay(1000); // Rate limiting
        }

        // Deduplicate and filter for quality
        const uniqueRepos = this.deduplicateRepos(allRepos);
        return uniqueRepos.filter(repo => 
            repo.stargazers_count >= 5 || 
            repo.description?.toLowerCase().includes('ai') ||
            repo.description?.toLowerCase().includes('machine learning') ||
            repo.description?.toLowerCase().includes('deep learning')
        ).slice(0, 10);
    }

    async getTrendingAIRepositories() {
        console.log('📈 Finding trending AI repositories...');
        const queries = [
            'artificial intelligence stars:>50',
            'machine learning stars:>100',
            'deep learning stars:>50',
            'llm stars:>50',
            'transformer stars:>50'
        ];

        const allRepos = [];
        for (const query of queries) {
            const repos = await this.searchGitHub(query, 'updated', 'desc', 10);
            allRepos.push(...repos);
            await this.delay(1000);
        }

        const uniqueRepos = this.deduplicateRepos(allRepos);
        return uniqueRepos.slice(0, 15);
    }

    async getFrameworkUpdates() {
        console.log('🔧 Checking framework updates...');
        const frameworks = [
            'pytorch/pytorch',
            'tensorflow/tensorflow',
            'huggingface/transformers',
            'openai/openai-python',
            'anthropics/anthropic-sdk-python',
            'microsoft/DeepSpeed',
            'google/jax'
        ];

        const updates = [];
        for (const repo of frameworks) {
            try {
                const response = await axios.get(`${GITHUB_API_BASE}/repos/${repo}/releases/latest`, {
                    headers: this.githubHeaders
                });
                
                const release = response.data;
                const releaseDate = new Date(release.published_at);
                const daysSinceRelease = Math.floor((this.today - releaseDate) / (1000 * 60 * 60 * 24));
                
                if (daysSinceRelease <= 7) { // Last week
                    updates.push({
                        repo: repo,
                        version: release.tag_name,
                        name: release.name,
                        published_at: release.published_at,
                        body: release.body?.substring(0, 200) + '...',
                        url: release.html_url
                    });
                }
                await this.delay(1000);
            } catch (error) {
                console.error(`Error fetching releases for ${repo}:`, error.message);
            }
        }
        return updates;
    }

    async getAINews() {
        console.log('📰 Gathering AI news...');
        const searches = [
            'AI artificial intelligence breakthrough new research',
            'machine learning paper release arxiv',
            'OpenAI Anthropic Google AI Meta AI announcement',
            'LLM large language model release update',
            'computer vision breakthrough',
            'natural language processing NLP advancement'
        ];

        const allNews = [];
        for (const search of searches) {
            const results = await this.searchWeb(search, 'pd');
            allNews.push(...results);
            await this.delay(1000);
        }

        return allNews.slice(0, 10);
    }

    deduplicateRepos(repos) {
        const seen = new Set();
        return repos.filter(repo => {
            if (seen.has(repo.id)) return false;
            seen.add(repo.id);
            return true;
        });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    formatRepo(repo) {
        const stars = repo.stargazers_count.toLocaleString();
        const language = repo.language || 'Unknown';
        const description = repo.description || 'No description available';
        
        return `**[${repo.name}](${repo.html_url})** (${stars} ⭐)\n*${language}*\n${description}\n`;
    }

    formatFrameworkUpdate(update) {
        const date = format(new Date(update.published_at), 'MMM dd');
        return `**[${update.repo}](${update.url})** - ${update.version}\n*Released: ${date}*\n${update.body}\n`;
    }

    formatNewsItem(item) {
        const age = item.age || 'Recent';
        return `**[${item.title}](${item.url})**\n*${age}*\n${item.description}\n`;
    }

    async generateDigest(date) {
        const dateStr = date ? date : format(this.today, 'yyyy-MM-dd');
        const digestDate = date ? new Date(date) : this.today;
        
        console.log(`🤖 Generating AI digest for ${dateStr}...`);

        try {
            // Gather all data in parallel where possible
            const [newRepos, trendingRepos, frameworkUpdates, aiNews] = await Promise.all([
                this.getNewAIRepositories(),
                this.getTrendingAIRepositories(),
                this.getFrameworkUpdates(),
                this.getAINews()
            ]);

            const digest = this.buildDigestMarkdown({
                date: digestDate,
                newRepos,
                trendingRepos,
                frameworkUpdates,
                aiNews
            });

            // Ensure logs directory exists
            const logsDir = path.join(process.cwd(), 'logs');
            try {
                await fs.access(logsDir);
            } catch {
                await fs.mkdir(logsDir, { recursive: true });
            }

            // Write digest file
            const filename = `ai-digest-${dateStr}.md`;
            const filepath = path.join(logsDir, filename);
            await fs.writeFile(filepath, digest);

            console.log(`✅ AI digest generated: ${filepath}`);
            console.log(`📊 Stats: ${newRepos.length} new repos, ${trendingRepos.length} trending, ${frameworkUpdates.length} updates, ${aiNews.length} news items`);

            return filepath;

        } catch (error) {
            console.error('❌ Error generating digest:', error);
            throw error;
        }
    }

    buildDigestMarkdown({ date, newRepos, trendingRepos, frameworkUpdates, aiNews }) {
        const formattedDate = format(date, 'MMMM dd, yyyy');
        const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss') + ' UTC';

        let markdown = `# Open-Source AI Daily Digest

**${formattedDate}**  
*Generated: ${timestamp}*

---

## 🆕 New Notable Repositories (Last 24 Hours)

`;

        if (newRepos.length > 0) {
            newRepos.slice(0, 8).forEach(repo => {
                markdown += this.formatRepo(repo) + '\n';
            });
        } else {
            markdown += '*No significant new repositories found in the last 24 hours.*\n\n';
        }

        markdown += `## 📈 Trending AI Projects

`;

        if (trendingRepos.length > 0) {
            trendingRepos.slice(0, 10).forEach(repo => {
                markdown += this.formatRepo(repo) + '\n';
            });
        } else {
            markdown += '*No trending repositories identified.*\n\n';
        }

        markdown += `## 🔧 Framework & Library Updates

`;

        if (frameworkUpdates.length > 0) {
            frameworkUpdates.forEach(update => {
                markdown += this.formatFrameworkUpdate(update) + '\n';
            });
        } else {
            markdown += '*No major framework updates in the past week.*\n\n';
        }

        markdown += `## 📰 AI Community News & Developments

`;

        if (aiNews.length > 0) {
            aiNews.slice(0, 8).forEach(item => {
                markdown += this.formatNewsItem(item) + '\n';
            });
        } else {
            markdown += '*No recent AI news found.*\n\n';
        }

        markdown += `## 🔮 Key Trends & Patterns

`;

        // Analyze patterns from the collected data
        const trends = this.analyzeTrends({ newRepos, trendingRepos, frameworkUpdates, aiNews });
        markdown += trends + '\n\n';

        markdown += `## 👀 Projects to Watch

`;

        // Identify promising early-stage projects
        const watchList = this.identifyWatchList(newRepos, trendingRepos);
        markdown += watchList + '\n\n';

        markdown += `---

*This digest was automatically generated by thepopebot using GitHub API, Brave Search, and AI analysis.*  
*Sources: GitHub trending, new repositories, framework releases, and AI community news.*`;

        return markdown;
    }

    analyzeTrends({ newRepos, trendingRepos, frameworkUpdates, aiNews }) {
        const languages = {};
        const topics = {};
        const frameworks = {};

        // Analyze programming languages
        [...newRepos, ...trendingRepos].forEach(repo => {
            if (repo.language) {
                languages[repo.language] = (languages[repo.language] || 0) + 1;
            }
            
            // Extract topics from descriptions
            const description = (repo.description || '').toLowerCase();
            const topicKeywords = ['llm', 'transformer', 'vision', 'nlp', 'generative', 'diffusion', 'gan', 'reinforcement'];
            topicKeywords.forEach(keyword => {
                if (description.includes(keyword)) {
                    topics[keyword] = (topics[keyword] || 0) + 1;
                }
            });
        });

        // Analyze framework activity
        frameworkUpdates.forEach(update => {
            const repo = update.repo.split('/')[1];
            frameworks[repo] = frameworks[repo] || update.version;
        });

        let trends = '';
        
        // Top languages
        const topLanguages = Object.entries(languages)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3);
        if (topLanguages.length > 0) {
            trends += `**Popular Languages:** ${topLanguages.map(([lang, count]) => `${lang} (${count})`).join(', ')}\n\n`;
        }

        // Hot topics
        const hotTopics = Object.entries(topics)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3);
        if (hotTopics.length > 0) {
            trends += `**Trending Topics:** ${hotTopics.map(([topic, count]) => `${topic.toUpperCase()} (${count})`).join(', ')}\n\n`;
        }

        // Active frameworks
        if (frameworkUpdates.length > 0) {
            trends += `**Active Frameworks:** ${frameworkUpdates.map(u => u.repo.split('/')[1]).join(', ')}\n\n`;
        }

        return trends || '*No significant trends identified in current data.*';
    }

    identifyWatchList(newRepos, trendingRepos) {
        // Focus on repos with good descriptions, recent activity, but not too many stars yet (early stage)
        const promising = [...newRepos, ...trendingRepos]
            .filter(repo => 
                repo.description && 
                repo.stargazers_count < 1000 && 
                repo.stargazers_count > 10 &&
                new Date(repo.updated_at) > subDays(new Date(), 7)
            )
            .sort((a, b) => b.stargazers_count - a.stargazers_count)
            .slice(0, 5);

        if (promising.length > 0) {
            return promising.map(repo => this.formatRepo(repo)).join('\n') + '\n';
        }

        return '*No promising early-stage projects identified.*\n';
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    const date = args[0]; // Optional date argument in YYYY-MM-DD format

    const generator = new AIDigestGenerator();
    
    try {
        await generator.generateDigest(date);
        process.exit(0);
    } catch (error) {
        console.error('Failed to generate digest:', error);
        process.exit(1);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}