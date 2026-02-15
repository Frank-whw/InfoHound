# InfoHound 📰

> 高质量信息获取的自动化解决方案

InfoHound 是一个基于 AI 的智能信息筛选系统，帮你从海量信息中自动发现真正有价值的内容，并整理成易读的日报。

**核心价值**: 与其每天刷 100 条信息，不如读 10 条经过 AI 精选的高质量内容。

---

## ✨ 核心能力

| 能力 | 说明 |
|-----|------|
| **AI 质量评估** | 4 维度评分（新颖性/深度/实用性/相关性），只保留 ≥7 分的内容 |
| **智能摘要** | 自动生成"为什么重要"和关键要点，不是简单的标题堆砌 |
| **多源聚合** | HN、Lobste.rs、Ars Technica、Product Hunt 等精选源 |
| **Newsletter 风格** | 精美的阅读体验，支持 Markdown + HTML 双格式 |
| **完全自动化** | GitHub Actions 每日自动运行，零维护成本 |
| **多 AI 支持** | Anthropic、OpenAI、OpenRouter、DeepSeek、自托管模型 |

---

## 🚀 快速开始（5 分钟部署）

### 方式一：Fork 仓库（推荐）

```bash
# 1. 点击仓库右上角的 "Fork" 按钮，将仓库 fork 到你的账号

# 2. Clone 你的 fork
git clone https://github.com/你的用户名/InfoHound.git
cd InfoHound

# 3. 安装依赖
npm install

# 4. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入你的 AI API Key

# 5. 本地测试
npm run generate
```

### 方式二：Use as Template

1. 点击仓库首页的 **"Use this template"** → **"Create a new repository"**
2. 填写仓库名称（建议保留 `InfoHound` 以便识别）
3. 选择公开或私有（GitHub Pages 需要公开）
4. Clone 你的新仓库并按上述步骤配置

---

## ⚙️ GitHub Actions 自动化配置

### 1. 设置 Secrets

进入你 fork 的仓库 → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret Name | Value | Required |
|------------|-------|----------|
| `AI_API_KEY` | 你的 AI API Key | ✅ |
| `AI_PROVIDER` | `anthropic` / `openai` / `openrouter` | ❌ (默认 anthropic) |
| `AI_MODEL` | 模型名称如 `claude-3-5-sonnet-20241022` | ❌ (有默认值) |
| `AI_BASE_URL` | 自定义 API 地址 | ❌ (仅第三方服务需要) |

### 2. 启用 GitHub Pages

进入 **Settings** → **Pages**

| 设置项 | 值 |
|-------|-----|
| **Source** | Deploy from a branch |
| **Branch** | `gh-pages` / `(root)` |

> 💡 第一次需要手动触发 workflow 后才会生成 `gh-pages` 分支

### 3. 手动触发测试

进入 **Actions** → **Daily InfoHound Digest** → **Run workflow**

等待约 2-5 分钟，检查：
- ✅ Workflow 成功完成
- ✅ `gh-pages` 分支被创建
- ✅ 访问 `https://你的用户名.github.io/InfoHound/` 能看到内容

### 4. 自动化运行

配置完成后，系统会自动：
- ⏰ 每天 8:00 / 13:00 / 19:00 (北京时间) 自动运行
- 📝 自动 commit 更新（保持 GitHub 贡献热力图）
- 🌐 自动部署到 GitHub Pages
- 📧 无需额外操作，每天自动在网页上查看最新日报

---

## 📝 自定义配置

### 添加/删除信息源

编辑 `config/sources.json`：

```json
{
  "id": "你的源ID",
  "name": "源名称",
  "type": "rss",
  "url": "https://example.com/feed.xml",
  "category": "tech-deep",
  "weight": 1.0,
  "maxPerDay": 3
}
```

### 修改运行时间

编辑 `.github/workflows/daily-digest.yml`：

```yaml
on:
  schedule:
    - cron: '0 0 * * *'    # 每天 8:00 (北京时间)
    - cron: '0 5 * * *'    # 每天 13:00 (北京时间)
    # 添加或删除定时任务
```

### 使用其他 AI 服务

```env
# OpenRouter（一个 key 访问多个模型）
AI_PROVIDER=openrouter
AI_API_KEY=sk-or-xxx
AI_BASE_URL=https://openrouter.ai/api/v1
AI_MODEL=anthropic/claude-3.5-sonnet

# DeepSeek（国产模型）
AI_PROVIDER=deepseek
AI_API_KEY=sk-xxx
AI_BASE_URL=https://api.deepseek.com

# 自托管（Ollama/LiteLLM）
AI_PROVIDER=custom
AI_API_KEY=sk-xxx
AI_BASE_URL=http://localhost:4000/v1
AI_MODEL=llama2:70b
```

---

## 📁 项目结构

```
InfoHound/
├── .github/workflows/    # GitHub Actions 配置
├── config/sources.json   # 信息源配置
├── src/
│   ├── collectors/       # RSS/API 抓取器
│   ├── ai/              # AI 评估与摘要
│   ├── orchestrator/    # 内容编排
│   └── renderer/        # 输出生成
├── dist/                # 生成的日报（GitHub Pages 源）
└── data/                # 缓存数据
```

---

## 💰 成本估算

| AI Provider | 每天 15 篇文章 | 月成本 |
|------------|---------------|--------|
| Anthropic Claude | ~$0.15 | ~$4.5 |
| OpenAI GPT-4 | ~$0.20 | ~$6 |
| OpenRouter | 取决于模型 | ~$3-5 |
| DeepSeek | ~¥0.3 | ~¥10 |

---

## 🎯 适用场景

- **信息过载**: 每天被各种推送轰炸，想高效获取精华
- **打破茧房**: 想接触不同领域的高质量信息
- **个人知识管理**: 建立自己的信息筛选系统
- **技术研究**: 追踪最新的技术趋势和研究

---

## 🤝 贡献

欢迎 Fork 和提交 PR！

---

## 📝 License

MIT

---

Made with ❤️ for people who value quality information.
