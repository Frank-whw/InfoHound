import { DailyDigest, ArticleWithSummary, Section } from '../types';

export class NewsletterRenderer {
  render(digest: DailyDigest): string {
    const date = this.formatDate(digest.date);

    return `# 📰 InfoHound - ${date}

> 今日精选 ${digest.stats.totalArticles} 篇文章，预计阅读时间 ${digest.stats.estimatedReadTime} 分钟

---

${this.renderHeadline(digest.headline)}

---

${digest.sections.map(s => this.renderSection(s)).join('\n\n---\n\n')}

---

## 📊 今日统计

| 指标 | 数值 |
|------|------|
| 文章总数 | ${digest.stats.totalArticles} 篇 |
| 平均质量分 | ${digest.stats.averageScore}/10 |
| 预计阅读时间 | ${digest.stats.estimatedReadTime} 分钟 |

---

*由 [InfoHound](https://github.com/Frank-whw/InfoHound) 自动生成 | AI 整理，人工阅读*
`;
  }

  renderHTML(digest: DailyDigest): string {
    const date = this.formatDate(digest.date);

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>InfoHound - ${date}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      max-width: 680px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 { color: #1a1a1a; font-size: 28px; margin-bottom: 8px; }
    .subtitle { color: #666; font-size: 14px; margin-bottom: 30px; }
    .headline { background: #f8f9fa; padding: 24px; border-radius: 8px; margin: 24px 0; }
    .section { margin: 32px 0; }
    .section-title { font-size: 20px; color: #1a1a1a; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #e9ecef; }
    .article { margin: 20px 0; padding: 16px; border-left: 4px solid #dee2e6; }
    .article.tech-deep { border-left-color: #2563eb; }
    .article.product { border-left-color: #f59e0b; }
    .article.ai { border-left-color: #8b5cf6; }
    .article.chinese { border-left-color: #10b981; }
    .article-title { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
    .article-meta { font-size: 12px; color: #6b7280; margin-bottom: 8px; }
    .article-summary { font-size: 14px; color: #4b5563; margin-bottom: 12px; }
    .key-points { margin: 12px 0; padding-left: 16px; }
    .key-points li { margin: 4px 0; font-size: 14px; color: #374151; }
    .level-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-right: 8px; }
    .level-beginner { background: #d1fae5; color: #065f46; }
    .level-advanced { background: #fef3c7; color: #92400e; }
    .level-expert { background: #fee2e2; color: #991b1b; }
    .tags { margin-top: 8px; }
    .tag { display: inline-block; padding: 2px 8px; background: #f3f4f6; border-radius: 4px; font-size: 11px; color: #6b7280; margin-right: 4px; }
    a { color: #2563eb; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .stats { background: #f8f9fa; padding: 16px; border-radius: 8px; margin-top: 24px; }
    .stats table { width: 100%; font-size: 14px; }
    .stats td { padding: 4px 0; }
    .footer { text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
    @media (max-width: 600px) {
      body { padding: 10px; }
      .container { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📰 InfoHound</h1>
    <p class="subtitle">${date} · 今日精选 ${digest.stats.totalArticles} 篇 · 预计阅读 ${digest.stats.estimatedReadTime} 分钟</p>

    ${this.renderHeadlineHTML(digest.headline)}

    ${digest.sections.map(s => this.renderSectionHTML(s)).join('')}

    <div class="stats">
      <table>
        <tr><td>文章总数</td><td><strong>${digest.stats.totalArticles} 篇</strong></td></tr>
        <tr><td>平均质量分</td><td><strong>${digest.stats.averageScore}/10</strong></td></tr>
        <tr><td>预计阅读时间</td><td><strong>${digest.stats.estimatedReadTime} 分钟</strong></td></tr>
      </table>
    </div>

    <div class="footer">
      <p>由 <a href="https://github.com/Frank-whw/InfoHound">InfoHound</a> 自动生成 · AI 整理，人工阅读</p>
    </div>
  </div>
</body>
</html>`;
  }

  private renderHeadline(article: ArticleWithSummary): string {
    const levelEmoji = {
      beginner: '🟢',
      advanced: '🟡',
      expert: '🔴',
    };

    return `## 🌟 头条

### ${article.title}
**来源**: ${article.sourceName} | **评分**: ${article.overallScore.toFixed(1)}/10 ${levelEmoji[article.summary.level]}

**为什么重要**: ${article.summary.whyItMatters}

**一句话总结**: ${article.summary.oneSentenceSummary}

**关键要点**:
${article.summary.keyPoints.map(p => `• ${p}`).join('\n')}
${article.summary.background ? `
**背景**: ${article.summary.background}` : ''}

**标签**: ${article.summary.tags.join(', ')}

[阅读原文](${article.url})
`;
  }

  private renderSection(section: Section): string {
    return `## ${section.icon} ${section.name}

${section.articles.map(a => this.renderArticle(a)).join('\n\n')}
`;
  }

  private renderArticle(article: ArticleWithSummary): string {
    const levelEmoji = {
      beginner: '🟢',
      advanced: '🟡',
      expert: '🔴',
    };

    return `### ${levelEmoji[article.summary.level]} ${article.title}
**来源**: ${article.sourceName} | **评分**: ${article.overallScore.toFixed(1)}/10

**为什么重要**: ${article.summary.whyItMatters}

**要点**:
${article.summary.keyPoints.slice(0, 3).map(p => `• ${p}`).join('\n')}

[阅读原文](${article.url})`;
  }

  private renderHeadlineHTML(article: ArticleWithSummary): string {
    return `
    <div class="headline article ${article.category}">
      <div class="article-title">${article.title}</div>
      <div class="article-meta">来源: ${article.sourceName} · 评分: ${article.overallScore.toFixed(1)}/10 <span class="level-badge level-${article.summary.level}">${article.summary.level}</span></div>
      <div class="article-summary"><strong>为什么重要:</strong> ${article.summary.whyItMatters}</div>
      <ul class="key-points">
        ${article.summary.keyPoints.map(p => `<li>${p}</li>`).join('')}
      </ul>
      <div class="tags">${article.summary.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
      <p><a href="${article.url}" target="_blank">阅读原文 →</a></p>
    </div>
    `;
  }

  private renderSectionHTML(section: Section): string {
    return `
    <div class="section">
      <div class="section-title">${section.icon} ${section.name}</div>
      ${section.articles.map(a => this.renderArticleHTML(a)).join('')}
    </div>
    `;
  }

  private renderArticleHTML(article: ArticleWithSummary): string {
    return `
    <div class="article ${article.category}">
      <div class="article-title">${article.title}</div>
      <div class="article-meta">来源: ${article.sourceName} · 评分: ${article.overallScore.toFixed(1)}/10 <span class="level-badge level-${article.summary.level}">${article.summary.level}</span></div>
      <div class="article-summary"><strong>为什么重要:</strong> ${article.summary.whyItMatters}</div>
      <ul class="key-points">
        ${article.summary.keyPoints.slice(0, 3).map(p => `<li>${p}</li>`).join('')}
      </ul>
      <div class="tags">${article.summary.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
      <p><a href="${article.url}" target="_blank">阅读原文 →</a></p>
    </div>
    `;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  }
}
