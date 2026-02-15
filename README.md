# InfoHound 📰

> AI-powered daily tech digest. Quality over quantity.

InfoHound is an intelligent news aggregator that curates high-quality tech content using AI evaluation and summarization. Instead of overwhelming you with hundreds of articles, it selects 10-15 truly valuable pieces and presents them in a beautiful, readable newsletter format.

## ✨ Features

- **Quality First**: AI evaluates articles on novelty, depth, practicality, and relevance
- **Smart Curation**: Only articles scoring 7+ out of 10 make it to your digest
- **AI Summarization**: Each article includes "Why It Matters" and key insights
- **Beautiful Design**: Newsletter-style output optimized for reading
- **Multiple Sources**: Hacker News, Lobste.rs, Ars Technica, Product Hunt, and more
- **Multi-Provider AI**: Support for Anthropic, OpenAI, OpenRouter, DeepSeek, and custom endpoints
- **GitHub Pages**: Auto-deployed static site for easy reading

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone git@github.com:Frank-whw/InfoHound.git
cd InfoHound
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and configure your AI provider
```

### AI Provider Configuration

InfoHound supports multiple AI providers:

| Provider | AI_PROVIDER | AI_BASE_URL (optional) | Default Model |
|----------|-------------|------------------------|---------------|
| **Anthropic** | `anthropic` | - | `claude-3-5-sonnet-20241022` |
| **OpenAI** | `openai` | - | `gpt-4` |
| **OpenRouter** | `openrouter` | `https://openrouter.ai/api/v1` | `anthropic/claude-3.5-sonnet` |
| **DeepSeek** | `deepseek` | `https://api.deepseek.com` | `deepseek-chat` |
| **Custom** | `custom` | Your endpoint URL | `gpt-3.5-turbo` |

#### Example: Using Anthropic (Claude)
```env
AI_PROVIDER=anthropic
AI_API_KEY=your_anthropic_api_key
AI_MODEL=claude-3-5-sonnet-20241022
```

#### Example: Using OpenRouter
```env
AI_PROVIDER=openrouter
AI_API_KEY=your_openrouter_api_key
AI_BASE_URL=https://openrouter.ai/api/v1
AI_MODEL=anthropic/claude-3.5-sonnet
```

#### Example: Using Custom Endpoint (e.g., LiteLLM Proxy)
```env
AI_PROVIDER=custom
AI_API_KEY=your_api_key
AI_BASE_URL=http://localhost:4000/v1
AI_MODEL=gpt-4
```

**Note**: `AI_BASE_URL` is optional and only needed for custom endpoints or proxy services like OpenRouter.

### 3. Run Locally

```bash
npm run generate
```

This will:
1. Fetch articles from configured sources
2. Evaluate quality using Claude AI
3. Generate summaries
4. Create `dist/index.html` with the digest

## 📁 Project Structure

```
InfoHound/
├── src/
│   ├── collectors/     # RSS/API collectors
│   ├── ai/            # Claude AI service
│   ├── orchestrator/  # Content organization
│   ├── renderer/      # Newsletter rendering
│   └── utils/         # Config, cache, logger
├── config/
│   └── sources.json   # Source configuration
├── dist/              # Generated output (GitHub Pages)
├── data/              # Cached content
└── .github/
    └── workflows/     # GitHub Actions
```

## 🔧 Configuration

### Adding New Sources

Edit `config/sources.json`:

```json
{
  "id": "your-source",
  "name": "Your Source Name",
  "type": "rss",
  "url": "https://example.com/feed.xml",
  "category": "tech-deep",
  "weight": 1.0,
  "maxPerDay": 3
}
```

Categories: `tech-deep`, `product`, `ai`, `chinese`

### Customizing AI Evaluation

The AI evaluates articles on 4 dimensions:
- **Novelty** (20%): How new/unique is the information?
- **Depth** (30%): How deep is the analysis?
- **Practicality** (30%): Can readers get actionable insights?
- **Relevance** (20%): How relevant to your interests?

Only articles scoring ≥7/10 are included in the digest.

## 💰 Cost

Using Claude 3.5 Sonnet API:
- ~15 articles/day
- ~$0.15/day
- ~$4.5/month

For a high-quality, personalized daily digest, this is quite reasonable.

## 📝 License

MIT

---

Made with ❤️ for people who value quality information.
