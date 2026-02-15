# InfoHound 📰

> AI-powered daily tech digest. Quality over quantity.

InfoHound is an intelligent news aggregator that curates high-quality tech content using AI evaluation and summarization. Instead of overwhelming you with hundreds of articles, it selects 10-15 truly valuable pieces and presents them in a beautiful, readable newsletter format.

## ✨ Features

- **Quality First**: AI evaluates articles on novelty, depth, practicality, and relevance
- **Smart Curation**: Only articles scoring 7+ out of 10 make it to your digest
- **AI Summarization**: Each article includes "Why It Matters" and key insights
- **Beautiful Design**: Newsletter-style output optimized for reading
- **Multiple Sources**: Hacker News, Lobste.rs, Ars Technica, Product Hunt, and more
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
# Edit .env and add your ANTHROPIC_API_KEY
```

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
